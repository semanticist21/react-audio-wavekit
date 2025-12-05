import { forwardRef, type HTMLAttributes, type ReactNode, useCallback, useEffect, useRef } from "react";
import { DEFAULT_WAVEFORM_APPEARANCE } from "../../../constants";
import type { WaveformAppearance } from "../../../types";
import type { UseRecordingAmplitudesOptions } from "../use-recording-amplitudes";
import { LiveStreamingStackRecorderProvider, useLiveStreamingStackRecorderContext } from "./stack-recorder-context";

// ============================================================================
// LiveStreamingStackRecorder.Root
// ============================================================================

export interface LiveStreamingStackRecorderRootProps
  extends UseRecordingAmplitudesOptions,
    Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: ReactNode | ((value: ReturnType<typeof useLiveStreamingStackRecorderContext>) => ReactNode);
}

const LiveStreamingStackRecorderRoot = forwardRef<HTMLDivElement, LiveStreamingStackRecorderRootProps>(
  function LiveStreamingStackRecorderRoot(
    { children, className = "", style, mediaRecorder, fftSize, smoothingTimeConstant, sampleInterval, ...props },
    ref
  ) {
    return (
      <div ref={ref} className={className} style={style} {...props}>
        <LiveStreamingStackRecorderProvider
          mediaRecorder={mediaRecorder}
          fftSize={fftSize}
          smoothingTimeConstant={smoothingTimeConstant}
          sampleInterval={sampleInterval}
        >
          {children}
        </LiveStreamingStackRecorderProvider>
      </div>
    );
  }
);

// ============================================================================
// LiveStreamingStackRecorder.Canvas
// ============================================================================

export interface LiveStreamingStackRecorderCanvasProps extends HTMLAttributes<HTMLCanvasElement> {
  /** Additional className for canvas element */
  className?: string;
  /** Inline styles for canvas element */
  style?: React.CSSProperties;
  /** Waveform appearance configuration (barColor, barWidth 등) */
  appearance?: WaveformAppearance;
  /**
   * Show minimal bars when not recording (idle state)
   * @default false
   */
  showIdleState?: boolean;
}

const LiveStreamingStackRecorderCanvas = forwardRef<HTMLCanvasElement, LiveStreamingStackRecorderCanvasProps>(
  function LiveStreamingStackRecorderCanvas(
    { className = "", style, appearance, showIdleState = false, ...props },
    ref
  ) {
    const { amplitudes, isRecording, isPaused } = useLiveStreamingStackRecorderContext();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    // Canvas 크기 캐싱 (ResizeObserver에서만 업데이트, 매 프레임 getBoundingClientRect 방지)
    const sizeRef = useRef({ width: 0, height: 0 });

    // Forward ref
    useEffect(() => {
      if (ref) {
        if (typeof ref === "function") {
          ref(canvasRef.current);
        } else {
          ref.current = canvasRef.current;
        }
      }
    }, [ref]);

    // Canvas rendering function (녹음 중 실시간으로 호출됨)
    const drawWaveform = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      // 캐싱된 크기 사용 (layout thrashing 방지)
      const containerWidth = sizeRef.current.width;
      const containerHeight = sizeRef.current.height;
      if (containerWidth === 0 || containerHeight === 0) return;

      // appearance에서 스타일 추출 (기본값 적용)
      const barColor = appearance?.barColor ?? DEFAULT_WAVEFORM_APPEARANCE.barColor;
      const barWidth = appearance?.barWidth ?? DEFAULT_WAVEFORM_APPEARANCE.barWidth;
      const barGap = appearance?.barGap ?? DEFAULT_WAVEFORM_APPEARANCE.barGap;
      const barRadius = appearance?.barRadius ?? DEFAULT_WAVEFORM_APPEARANCE.barRadius;
      const barHeightScale = appearance?.barHeightScale ?? DEFAULT_WAVEFORM_APPEARANCE.barHeightScale;

      const totalBarWidth = barWidth + barGap;

      // 녹음 중이거나 데이터가 있을 때
      if (isRecording || amplitudes.length > 0) {
        // 고정 width 유지 (container 너비에 맞춤)
        const canvasWidth = containerWidth;

        canvas.width = canvasWidth * dpr;
        canvas.height = containerHeight * dpr;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, containerHeight);

        // Set bar color
        ctx.fillStyle = barColor;

        // Draw bars - amplitudes를 canvas width에 맞춰 다운샘플링 (path batching으로 draw call 최소화)
        const minBarHeight = 2;
        const barsCount = Math.floor(canvasWidth / totalBarWidth);

        ctx.beginPath();
        for (let i = 0; i < barsCount; i++) {
          // 각 bar가 담당하는 amplitude 범위 계산 (downsample 방식)
          const startIdx = Math.floor((i * amplitudes.length) / barsCount);
          const endIdx = Math.floor(((i + 1) * amplitudes.length) / barsCount);

          // 해당 범위의 최대값 사용 (waveform 표준 방식)
          let maxAmplitude = 0;
          for (let j = startIdx; j < endIdx; j++) {
            maxAmplitude = Math.max(maxAmplitude, amplitudes[j] || 0);
          }

          const barHeight = Math.max(minBarHeight, maxAmplitude * containerHeight * barHeightScale);

          const x = i * totalBarWidth;
          const y = (containerHeight - barHeight) / 2;

          ctx.roundRect(x, y, barWidth, barHeight, barRadius);
        }
        ctx.fill();
      } else if (showIdleState) {
        // No data - draw idle state (minimal bars)
        canvas.width = containerWidth * dpr;
        canvas.height = containerHeight * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, containerWidth, containerHeight);

        ctx.fillStyle = barColor;
        const minBarHeight = 2;
        const barCount = Math.floor((containerWidth + barGap) / totalBarWidth);

        ctx.beginPath();
        for (let i = 0; i < barCount; i++) {
          const x = i * totalBarWidth;
          const y = (containerHeight - minBarHeight) / 2;
          ctx.roundRect(x, y, barWidth, minBarHeight, barRadius);
        }
        ctx.fill();
      }
    }, [amplitudes, isRecording, appearance, showIdleState]);

    // Track container size with ResizeObserver (크기를 캐싱하여 매 프레임 reflow 방지)
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;

        const { width, height } = entry.contentRect;
        // 크기 변경 없으면 무시
        if (sizeRef.current.width === width && sizeRef.current.height === height) return;

        sizeRef.current = { width, height };

        // Container 크기 변경시 다시 그리기
        if (!isRecording) {
          drawWaveform();
        }
      });

      resizeObserver.observe(canvas);
      return () => resizeObserver.disconnect();
    }, [isRecording, drawWaveform]);

    // Animation loop when recording (매 프레임마다 실행되어 실시간 업데이트)
    useEffect(() => {
      if (isRecording && !isPaused) {
        const draw = () => {
          drawWaveform();
          animationRef.current = requestAnimationFrame(draw);
        };
        draw();

        return () => {
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
          }
        };
      }
      // Draw once when stopped or paused
      drawWaveform();
    }, [isRecording, isPaused, drawWaveform]);

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          width: "100%",
          height: "100%",
          ...style,
        }}
        aria-hidden="true"
        tabIndex={-1}
        {...props}
      />
    );
  }
);

// ============================================================================
// Compound Component Composition
// ============================================================================

export const LiveStreamingStackRecorder = Object.assign(LiveStreamingStackRecorderRoot, {
  Root: LiveStreamingStackRecorderRoot,
  Canvas: LiveStreamingStackRecorderCanvas,
});
