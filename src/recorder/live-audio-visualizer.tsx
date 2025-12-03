import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export interface LiveAudioVisualizerProps {
  /** MediaRecorder instance from useAudioRecorder hook */
  mediaRecorder: MediaRecorder | null;
  /** Additional class name for the canvas */
  className?: string;
  /** Inline styles for the canvas (supports CSS variables for bar customization) */
  style?: React.CSSProperties & {
    "--bar-width"?: string | number;
    "--bar-gap"?: string | number;
    "--bar-radius"?: string | number;
  };
}

export interface LiveAudioVisualizerRef {
  canvas: HTMLCanvasElement | null;
}

/**
 * Real-time audio visualizer for live recording
 * Must be used with MediaRecorder from useAudioRecorder hook
 */
export const LiveAudioVisualizer = forwardRef<LiveAudioVisualizerRef, LiveAudioVisualizerProps>(
  function LiveAudioVisualizer({ mediaRecorder, className, style }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    useImperativeHandle(ref, () => ({
      canvas: canvasRef.current,
    }));

    useEffect(() => {
      if (!mediaRecorder) {
        // Clean up when no media recorder
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        analyserRef.current = null;
        return;
      }

      const stream = mediaRecorder.stream;
      if (!stream) return;

      // Create audio context and analyser
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      analyserRef.current = analyser;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Get CSS variables for customization
      const computedStyle = getComputedStyle(canvas);
      const barColor = computedStyle.color;
      const barWidth = Number.parseFloat(computedStyle.getPropertyValue("--bar-width")) || 2;
      const gap = Number.parseFloat(computedStyle.getPropertyValue("--bar-gap")) || 1;
      const barRadius = Number.parseFloat(computedStyle.getPropertyValue("--bar-radius")) || 0;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const draw = () => {
        if (!analyserRef.current || !canvas) return;

        animationFrameRef.current = requestAnimationFrame(draw);

        analyserRef.current.getByteFrequencyData(dataArray);

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barCount = Math.floor(canvas.width / (barWidth + gap));
        const step = Math.floor(dataArray.length / barCount);

        for (let i = 0; i < barCount; i++) {
          const value = dataArray[i * step] / 255;
          const barHeight = value * canvas.height;
          const x = i * (barWidth + gap);
          const y = canvas.height - barHeight;

          ctx.fillStyle = barColor;

          if (barRadius > 0) {
            // Draw rounded rectangle
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, barRadius);
            ctx.fill();
          } else {
            // Draw regular rectangle
            ctx.fillRect(x, y, barWidth, barHeight);
          }
        }
      };

      draw();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        audioContext.close();
      };
    }, [mediaRecorder]);

    // Handle canvas resize
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resizeCanvas = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
      };

      resizeCanvas();

      const resizeObserver = new ResizeObserver(resizeCanvas);
      resizeObserver.observe(canvas);

      return () => {
        resizeObserver.disconnect();
      };
    }, []);

    return <canvas ref={canvasRef} className={className} style={style} />;
  }
);
