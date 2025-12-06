import { useOverlayScrollbars } from "overlayscrollbars-react";
import { forwardRef, type HTMLAttributes, type ReactNode, useCallback, useEffect, useId, useRef } from "react";
import { DEFAULT_SCROLLBAR_APPEARANCE, DEFAULT_WAVEFORM_APPEARANCE } from "../../../constants";
import type { LiveStreamingRecorderAppearance } from "../../../types";
import type { UseRecordingAmplitudesOptions } from "../use-recording-amplitudes";
import { LiveStreamingRecorderProvider, useLiveStreamingRecorderContext } from "./recorder-context";

// ============================================================================
// LiveStreamingRecorder.Root
// ============================================================================

export interface LiveStreamingRecorderRootProps
  extends UseRecordingAmplitudesOptions,
    Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: ReactNode | ((value: ReturnType<typeof useLiveStreamingRecorderContext>) => ReactNode);
  /** Appearance configuration (waveform + scrollbar styles) */
  appearance?: LiveStreamingRecorderAppearance;
}

const LiveStreamingRecorderRoot = forwardRef<HTMLDivElement, LiveStreamingRecorderRootProps>(
  function LiveStreamingRecorderRoot(
    {
      children,
      className = "",
      style,
      mediaRecorder,
      fftSize,
      smoothingTimeConstant,
      sampleInterval,
      appearance,
      ...props
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);

    // 고유한 scrollbar 테마 클래스명 생성 (인스턴스별 스타일 충돌 방지)
    const uniqueId = useId().replace(/:/g, "");
    const themeClassName = `os-theme-lsr-${uniqueId}`;

    // Scrollbar appearance 값 추출
    const scrollbar = appearance?.scrollbar;
    const thumbColor = scrollbar?.thumbColor ?? DEFAULT_SCROLLBAR_APPEARANCE.thumbColor;
    const hidden = scrollbar?.hidden ?? DEFAULT_SCROLLBAR_APPEARANCE.hidden;

    // OverlayScrollbars 훅 초기화
    const [initializeOS, osInstance] = useOverlayScrollbars({
      options: {
        overflow: { x: "scroll", y: "hidden" },
        scrollbars: {
          theme: themeClassName,
          visibility: hidden ? "hidden" : "auto",
          autoHide: "leave", // 마우스가 영역을 벗어나면 숨김 (가장 대중적인 UX)
          autoHideDelay: 400,
          dragScroll: true,
          clickScroll: true,
        },
      },
      defer: true,
    });

    // OverlayScrollbars 초기화
    useEffect(() => {
      if (containerRef.current) {
        initializeOS(containerRef.current);
      }
    }, [initializeOS]);

    // hidden 옵션 변경 시 업데이트
    useEffect(() => {
      const instance = osInstance();
      if (instance) {
        instance.options({
          scrollbars: {
            visibility: hidden ? "hidden" : "auto",
          },
        });
      }
    }, [osInstance, hidden]);

    // OverlayScrollbars 테마 CSS 변수 주입 (thumbColor만 커스텀, 나머지는 고정값)
    useEffect(() => {
      const styleId = `lsr-os-theme-${uniqueId}`;
      document.getElementById(styleId)?.remove();

      const styleElement = document.createElement("style");
      styleElement.id = styleId;
      styleElement.textContent = `
        .${themeClassName} {
          --os-size: 8px;
          --os-padding-perpendicular: 2px;
          --os-padding-axis: 2px;
          --os-track-border-radius: 4px;
          --os-track-bg: transparent;
          --os-track-bg-hover: transparent;
          --os-handle-border-radius: 4px;
          --os-handle-bg: ${thumbColor};
          --os-handle-bg-hover: ${thumbColor};
          --os-handle-bg-active: ${thumbColor};
          --os-handle-min-size: 30px;
        }
      `;
      document.head.appendChild(styleElement);

      return () => {
        document.getElementById(styleId)?.remove();
      };
    }, [uniqueId, themeClassName, thumbColor]);

    // ref 포워딩
    useEffect(() => {
      if (ref) {
        if (typeof ref === "function") {
          ref(containerRef.current);
        } else {
          ref.current = containerRef.current;
        }
      }
    }, [ref]);

    return (
      <div ref={containerRef} className={className} style={style} {...props}>
        <LiveStreamingRecorderProvider
          mediaRecorder={mediaRecorder}
          fftSize={fftSize}
          smoothingTimeConstant={smoothingTimeConstant}
          sampleInterval={sampleInterval}
        >
          {children}
        </LiveStreamingRecorderProvider>
      </div>
    );
  }
);

// ============================================================================
// LiveStreamingRecorder.Canvas
// ============================================================================

export interface LiveStreamingRecorderCanvasProps extends HTMLAttributes<HTMLCanvasElement> {
  /** Additional className for canvas element */
  className?: string;
  /** Inline styles for canvas element */
  style?: React.CSSProperties;
  /** Waveform appearance configuration (barColor, barWidth, etc.) - scrollbar 설정은 Root에서만 유효 */
  appearance?: LiveStreamingRecorderAppearance;
}

const LiveStreamingRecorderCanvas = forwardRef<HTMLCanvasElement, LiveStreamingRecorderCanvasProps>(
  function LiveStreamingRecorderCanvas({ className = "", style, appearance, ...props }, ref) {
    const { amplitudes, isRecording, isPaused } = useLiveStreamingRecorderContext();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const containerSizeRef = useRef({ width: 0, height: 0 });
    const containerRef = useRef<HTMLElement | null>(null);

    // Track canvas width in growWidth mode to ensure it never shrinks
    const prevCanvasWidthRef = useRef<number>(0);

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

    // Reset canvas width ref when new recording starts
    useEffect(() => {
      if (amplitudes.length === 0) {
        prevCanvasWidthRef.current = 0;
      }
    }, [amplitudes.length]);

    // Canvas rendering function (called in real-time during recording)
    const drawWaveform = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;

      // Get container's actual size (use parent element's size)
      const container = canvas.parentElement;
      const containerWidth = container?.clientWidth || canvas.clientWidth;
      const containerHeight = container?.clientHeight || canvas.clientHeight;

      // Extract styles from appearance (with defaults)
      const barColor = appearance?.barColor ?? DEFAULT_WAVEFORM_APPEARANCE.barColor;
      const barWidth = appearance?.barWidth ?? DEFAULT_WAVEFORM_APPEARANCE.barWidth;
      const barGap = appearance?.barGap ?? DEFAULT_WAVEFORM_APPEARANCE.barGap;
      const barRadius = appearance?.barRadius ?? DEFAULT_WAVEFORM_APPEARANCE.barRadius;
      const barHeightScale = appearance?.barHeightScale ?? DEFAULT_WAVEFORM_APPEARANCE.barHeightScale;

      const totalBarWidth = barWidth + barGap;

      // When recording or data exists
      if (isRecording || amplitudes.length > 0) {
        // Canvas grows with data (enables scrolling, Voice Memos style)
        // 녹음 데이터에 따라 캔버스 너비가 늘어남 → 스크롤 가능
        const requiredWidth = amplitudes.length * totalBarWidth;
        const calculatedWidth = amplitudes.length > 0 ? requiredWidth : containerWidth;
        // 캔버스 너비는 절대 줄어들지 않음 (pause/resume 시 안정성 보장)
        const canvasWidth = Math.max(calculatedWidth, prevCanvasWidthRef.current);
        prevCanvasWidthRef.current = canvasWidth;
        canvas.style.width = `${canvasWidth}px`;

        canvas.width = canvasWidth * dpr;
        canvas.height = containerHeight * dpr;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, containerHeight);

        // Set bar color
        ctx.fillStyle = barColor;

        // Draw bars - 1:1 매핑 (amplitude 하나당 bar 하나)
        const minBarHeight = 2;
        ctx.beginPath();

        for (let i = 0; i < amplitudes.length; i++) {
          const amplitude = amplitudes[i];
          const barHeight = Math.max(minBarHeight, amplitude * containerHeight * barHeightScale);

          const x = i * totalBarWidth;
          const y = (containerHeight - barHeight) / 2;

          ctx.roundRect(x, y, barWidth, barHeight, barRadius);
        }

        ctx.fill();
      }
      // Don't draw anything if not recording and no data
    }, [amplitudes, isRecording, appearance]);

    // Track container size with ResizeObserver and get OverlayScrollbars viewport reference
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // OverlayScrollbars가 생성한 viewport 요소 찾기 (.os-viewport 클래스)
      // 구조: Root > .os-viewport (실제 스크롤 컨테이너) > .os-content > canvas
      const osContent = canvas.parentElement;
      const osViewport = osContent?.parentElement;
      if (osViewport?.classList.contains("os-viewport")) {
        containerRef.current = osViewport;
      } else {
        // Fallback: OverlayScrollbars 초기화 전이거나 다른 구조일 경우
        containerRef.current = canvas.parentElement;
      }

      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;

        const { width, height } = entry.contentRect;
        containerSizeRef.current = { width, height };

        // Redraw when container size changes
        if (!isRecording) {
          drawWaveform();
        }
      });

      resizeObserver.observe(canvas);
      return () => resizeObserver.disconnect();
    }, [isRecording, drawWaveform]);

    // Animation loop when recording (runs every frame for real-time updates)
    useEffect(() => {
      if (isRecording && !isPaused) {
        const draw = () => {
          drawWaveform();

          // Auto-scroll to right edge while recording
          if (containerRef.current) {
            containerRef.current.scrollLeft = containerRef.current.scrollWidth;
          }

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
      // Draw once when stopped or paused (preserve waveform after recording ends)
      drawWaveform();
    }, [isRecording, isPaused, drawWaveform]);

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          display: "block",
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

export const LiveStreamingRecorder = Object.assign(LiveStreamingRecorderRoot, {
  Root: LiveStreamingRecorderRoot,
  Canvas: LiveStreamingRecorderCanvas,
});
