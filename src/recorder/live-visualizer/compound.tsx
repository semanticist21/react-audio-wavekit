import { forwardRef, type HTMLAttributes, type ReactNode, useEffect, useRef } from "react";
import { getCanvasBarStyles } from "../../waveform/util-canvas";
import { LiveVisualizerProvider, useLiveVisualizerContext } from "./context";
import type { UseLiveAudioDataOptions } from "./use-live-audio-data";

// ============================================================================
// LiveVisualizer.Root
// ============================================================================

export interface LiveVisualizerRootProps extends UseLiveAudioDataOptions {
  children: ReactNode | ((value: ReturnType<typeof useLiveVisualizerContext>) => ReactNode);
}

const LiveVisualizerRoot = forwardRef<HTMLDivElement, LiveVisualizerRootProps>(function LiveVisualizerRoot(
  { children, ...options },
  ref
) {
  return (
    <div ref={ref}>
      <LiveVisualizerProvider {...options}>{children}</LiveVisualizerProvider>
    </div>
  );
});

// ============================================================================
// LiveVisualizer.Canvas
// ============================================================================

export interface LiveVisualizerCanvasProps extends HTMLAttributes<HTMLCanvasElement> {
  /** Additional className for canvas element */
  className?: string;
  /** Inline styles including CSS custom properties */
  style?: React.CSSProperties & {
    "--bar-width"?: string | number;
    "--bar-gap"?: string | number;
    "--bar-radius"?: string | number;
  };
  /** Bar height scale (0.0 - 1.0). Default 0.9 leaves 10% vertical padding */
  barHeightScale?: number;
}

const LiveVisualizerCanvas = forwardRef<HTMLCanvasElement, LiveVisualizerCanvasProps>(function LiveVisualizerCanvas(
  { className = "", style, barHeightScale = 0.9, ...props },
  ref
) {
  const { frequencies, isRecording, isPaused } = useLiveVisualizerContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  // Canvas Rendering animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || frequencies.length === 0) return;

    // Read bar styles from CSS variables (once)
    const { barWidth, gap, barRadius, barColor } = getCanvasBarStyles(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const draw = () => {
      // In pause state, stop rendering but keep animation loop
      if (isPaused) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      const totalBarWidth = barWidth + gap;
      const numBars = frequencies.length;

      // Set bar color
      ctx.fillStyle = barColor;

      // Render bars
      for (let i = 0; i < numBars; i++) {
        const frequency = frequencies[i];
        // Apply height scale (default 0.9 = 90% max height)
        const barHeight = Math.max(2, (frequency / 100) * height * barHeightScale);

        const x = i * totalBarWidth;
        const y = (height - barHeight) / 2;

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, barRadius);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    // Start animation
    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [frequencies, isPaused, barHeightScale]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`text-inherit ${className}`}
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
        {isRecording ? "Recording audio" : "Audio recording paused"}
      </span>
    </>
  );
});

// ============================================================================
// Compound Component Composition
// ============================================================================

export const LiveVisualizer = Object.assign(LiveVisualizerRoot, {
  Root: LiveVisualizerRoot,
  Canvas: LiveVisualizerCanvas,
});
