import { forwardRef, type HTMLAttributes, type ReactNode, useEffect, useRef } from "react";
import { type BarStyle, getCanvasBarStyles } from "../../waveform/util-canvas";
import { RecordingWaveformProvider, useRecordingWaveformContext } from "./context";
import type { UseRecordingAmplitudesOptions } from "./use-recording-amplitudes";

// ============================================================================
// RecordingWaveform.Root
// ============================================================================

export interface RecordingWaveformRootProps extends UseRecordingAmplitudesOptions {
  children: ReactNode | ((value: ReturnType<typeof useRecordingWaveformContext>) => ReactNode);
}

const RecordingWaveformRoot = forwardRef<HTMLDivElement, RecordingWaveformRootProps>(function RecordingWaveformRoot(
  { children, ...options },
  ref
) {
  return (
    <div ref={ref}>
      <RecordingWaveformProvider {...options}>{children}</RecordingWaveformProvider>
    </div>
  );
});

// ============================================================================
// RecordingWaveform.ScrollContainer
// ============================================================================

export interface RecordingWaveformScrollContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Enable auto-scroll behavior (default: true) */
  autoScroll?: boolean;
}

const RecordingWaveformScrollContainer = forwardRef<HTMLDivElement, RecordingWaveformScrollContainerProps>(
  function RecordingWaveformScrollContainer({ children, className = "", autoScroll = true, ...props }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const isAutoScrollingRef = useRef(autoScroll);

    // Forward ref
    useEffect(() => {
      if (ref) {
        if (typeof ref === "function") {
          ref(containerRef.current);
        } else {
          ref.current = containerRef.current;
        }
      }
    }, [ref]);

    // Detect manual scrolling to disable auto-scroll
    useEffect(() => {
      const container = containerRef.current;
      if (!container || !autoScroll) return;

      const handleScroll = () => {
        const { scrollLeft, scrollWidth, clientWidth } = container;
        // Re-enable auto-scroll if scrolled within 10px of the end
        isAutoScrollingRef.current = scrollLeft + clientWidth >= scrollWidth - 10;
      };

      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }, [autoScroll]);

    return (
      <div ref={containerRef} className={`overflow-x-auto overflow-y-hidden ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

// ============================================================================
// RecordingWaveform.Canvas
// ============================================================================

export interface RecordingWaveformCanvasProps extends HTMLAttributes<HTMLCanvasElement> {
  /** Additional className for canvas element */
  className?: string;
  /** Inline styles for canvas element */
  style?: React.CSSProperties;
  /** Bar height scale (0.0 - 1.0). Default 0.9 leaves 10% vertical padding */
  barHeightScale?: number;
  /** Bar 스타일 (width, gap, radius) */
  barStyle?: BarStyle;
}

const RecordingWaveformCanvas = forwardRef<HTMLCanvasElement, RecordingWaveformCanvasProps>(
  function RecordingWaveformCanvas({ className = "", style, barHeightScale = 0.9, barStyle, ...props }, ref) {
    const { amplitudes, isRecording } = useRecordingWaveformContext();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const animationRef = useRef<number | null>(null);

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

    // Find parent ScrollContainer element
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Find parent element with overflow-x scrolling
      let parent = canvas.parentElement;
      while (parent) {
        const overflow = getComputedStyle(parent).overflowX;
        if (overflow === "auto" || overflow === "scroll") {
          containerRef.current = parent as HTMLDivElement;
          break;
        }
        parent = parent.parentElement;
      }
    }, []);

    // Render canvas during recording
    useEffect(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container || !isRecording) return;

      // Read bar styles from barStyle prop or CSS variables (once)
      const { barWidth, gap, barRadius, barColor } = getCanvasBarStyles(canvas, barStyle);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;

      const draw = () => {
        if (!ctx) return;

        const totalBarWidth = barWidth + gap;
        const requiredWidth = amplitudes.length * totalBarWidth;
        const containerHeight = container.clientHeight;
        const containerWidth = container.clientWidth;

        // Update canvas dimensions
        canvas.style.width = `${Math.max(requiredWidth, containerWidth)}px`;
        canvas.style.height = `${containerHeight}px`;
        canvas.width = Math.max(requiredWidth, containerWidth) * dpr;
        canvas.height = containerHeight * dpr;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set bar color
        ctx.fillStyle = barColor;

        // Render bars
        const height = containerHeight;
        const minBarHeight = 2;

        for (let i = 0; i < amplitudes.length; i++) {
          const amplitude = amplitudes[i];
          // Apply height scale (default 0.9 = 90% max height)
          const barHeight = Math.max(minBarHeight, amplitude * height * barHeightScale);

          const x = i * totalBarWidth;
          const y = (height - barHeight) / 2;

          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, barRadius);
          ctx.fill();
        }

        // Auto-scroll to end
        if (requiredWidth > containerWidth) {
          container.scrollLeft = requiredWidth - containerWidth;
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
    }, [amplitudes, isRecording, barHeightScale, barStyle]);

    // Render stopped state (when not recording)
    useEffect(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container || isRecording) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const containerHeight = container.clientHeight;
      const containerWidth = container.clientWidth;

      // Read bar styles from barStyle prop or CSS variables
      const { barWidth, gap, barRadius, barColor } = getCanvasBarStyles(canvas, barStyle);
      const totalBarWidth = barWidth + gap;

      // Render recorded data if available
      if (amplitudes.length > 0) {
        const requiredWidth = amplitudes.length * totalBarWidth;

        canvas.style.width = `${Math.max(requiredWidth, containerWidth)}px`;
        canvas.style.height = `${containerHeight}px`;
        canvas.width = Math.max(requiredWidth, containerWidth) * dpr;
        canvas.height = containerHeight * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = barColor;

        const minBarHeight = 2;
        const height = containerHeight;

        for (let i = 0; i < amplitudes.length; i++) {
          const amplitude = amplitudes[i];
          // Apply height scale (default 0.9 = 90% max height)
          const barHeight = Math.max(minBarHeight, amplitude * height * barHeightScale);
          const x = i * totalBarWidth;
          const y = (height - barHeight) / 2;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, barRadius);
          ctx.fill();
        }
      } else {
        // No data - render idle state (minimal bars)
        canvas.style.width = `${containerWidth}px`;
        canvas.style.height = `${containerHeight}px`;
        canvas.width = containerWidth * dpr;
        canvas.height = containerHeight * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = barColor;

        const minBarHeight = 2;
        const barCount = Math.floor(containerWidth / totalBarWidth);

        for (let i = 0; i < barCount; i++) {
          const x = i * totalBarWidth;
          const y = (containerHeight - minBarHeight) / 2;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, minBarHeight, barRadius);
          ctx.fill();
        }
      }
    }, [amplitudes, isRecording, barHeightScale, barStyle]);

    return (
      <>
        <canvas
          ref={canvasRef}
          className={`text-inherit h-full min-w-full ${className}`}
          style={style}
          aria-hidden="true"
          tabIndex={-1}
          {...props}
        />
        {/* Screen reader only text for accessibility */}
        <span
          style={{
            position: "absolute",
            width: "1px",
            height: "1px",
            padding: "0",
            margin: "-1px",
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            border: "0",
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          {isRecording ? "Recording in progress" : "Recording stopped"}
        </span>
      </>
    );
  }
);

// ============================================================================
// Compound Component Composition
// ============================================================================

export const RecordingWaveform = Object.assign(RecordingWaveformRoot, {
  Root: RecordingWaveformRoot,
  ScrollContainer: RecordingWaveformScrollContainer,
  Canvas: RecordingWaveformCanvas,
});
