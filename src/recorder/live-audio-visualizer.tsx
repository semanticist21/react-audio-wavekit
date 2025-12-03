import { type ForwardedRef, forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export interface LiveAudioVisualizerProps {
  /**
   * MediaRecorder instance to visualize
   */
  mediaRecorder: MediaRecorder | null;
  /**
   * CSS class for styling. Use Tailwind classes:
   * - text-* for bar color (inherited via text-inherit)
   * - [--bar-width:N] for bar width in pixels
   * - [--bar-gap:N] for gap between bars in pixels
   * - [--bar-radius:N] for bar border radius in pixels
   */
  className?: string;
  /**
   * FFT size for frequency analysis (must be power of 2)
   * @default 2048
   */
  fftSize?: number;
  /**
   * Smoothing time constant for analyser (0-1)
   * @default 0.8
   */
  smoothingTimeConstant?: number;
}

export interface LiveAudioVisualizerRef {
  /**
   * Get the canvas element
   */
  getCanvas: () => HTMLCanvasElement | null;
  /**
   * Get the audio context
   */
  getAudioContext: () => AudioContext | null;
  /**
   * Get the analyser node
   */
  getAnalyser: () => AnalyserNode | null;
}

/**
 * Real-time audio visualizer for live recording
 * Visualizes audio from MediaRecorder using Web Audio API
 */
export const LiveAudioVisualizer = forwardRef<LiveAudioVisualizerRef, LiveAudioVisualizerProps>(
  (
    { mediaRecorder, className = "", fftSize = 2048, smoothingTimeConstant = 0.8 },
    ref: ForwardedRef<LiveAudioVisualizerRef>
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
      getAudioContext: () => audioContextRef.current,
      getAnalyser: () => analyserRef.current,
    }));

    useEffect(() => {
      if (!mediaRecorder || !canvasRef.current) {
        return;
      }

      const canvas = canvasRef.current;

      // Get CSS variables for bar styling
      const barWidth = Number.parseInt(getComputedStyle(canvas).getPropertyValue("--bar-width") || "3", 10);
      const gap = Number.parseInt(getComputedStyle(canvas).getPropertyValue("--bar-gap") || "1", 10);
      const barRadius = Number.parseInt(getComputedStyle(canvas).getPropertyValue("--bar-radius") || "1.5", 10);

      // Setup Web Audio API
      let audioContext: AudioContext | null = null;
      let analyser: AnalyserNode | null = null;
      let source: MediaStreamAudioSourceNode | null = null;

      try {
        // Create audio context and analyser
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = smoothingTimeConstant;

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        // Get the MediaRecorder's stream and connect to analyser
        const stream = mediaRecorder.stream;
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        // Create buffer for frequency data
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        dataArrayRef.current = dataArray;

        // Get canvas context and setup
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Get device pixel ratio for sharp rendering
        const dpr = window.devicePixelRatio || 1;

        // Animation loop
        const draw = () => {
          if (!analyser || !dataArray || !ctx) return;

          // Get current canvas dimensions
          const { width, height } = canvas.getBoundingClientRect();
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);

          // Get time domain data (waveform)
          analyser.getByteTimeDomainData(dataArray);

          // Clear canvas
          ctx.clearRect(0, 0, width, height);

          // Calculate number of bars that fit
          const totalBarWidth = barWidth + gap;
          const numBars = Math.floor(width / totalBarWidth);

          // Get bar color from text-inherit
          const barColor = getComputedStyle(canvas).color;
          ctx.fillStyle = barColor;

          // Draw bars
          for (let i = 0; i < numBars; i++) {
            // Sample from the data array
            const dataIndex = Math.floor((i / numBars) * bufferLength);
            const value = dataArray[dataIndex] || 0;

            // Convert byte value (0-255) to height
            // Center around 128 (silence) and scale
            const amplitude = Math.abs(value - 128) / 128;
            const barHeight = Math.max(2, amplitude * height);

            // Calculate position
            const x = i * totalBarWidth;
            const y = (height - barHeight) / 2;

            // Draw rounded rectangle
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, barRadius);
            ctx.fill();
          }

          animationRef.current = requestAnimationFrame(draw);
        };

        // Start animation
        draw();
      } catch (error) {
        console.error("Failed to setup audio visualization:", error);
      }

      // Cleanup
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }

        if (source) {
          source.disconnect();
        }

        if (audioContext && audioContext.state !== "closed") {
          audioContext.close();
        }

        audioContextRef.current = null;
        analyserRef.current = null;
        dataArrayRef.current = null;
      };
    }, [mediaRecorder, fftSize, smoothingTimeConstant]);

    return <canvas ref={canvasRef} className={`text-inherit ${className}`} />;
  }
);

LiveAudioVisualizer.displayName = "LiveAudioVisualizer";
