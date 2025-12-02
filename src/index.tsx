import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { unwrapPromise } from "./suspense-utils";

export interface AudioWaveformProps {
  /** Audio blob to visualize */
  blob: Blob | null;
  /** Additional class name for the canvas */
  className?: string;
  /** Inline styles for the canvas (supports CSS variables for bar customization) */
  style?: React.CSSProperties & {
    "--bar-width"?: string | number;
    "--bar-gap"?: string | number;
    "--bar-radius"?: string | number;
  };
  /** Enable Suspense support. When true, wrap component with <Suspense> for loading state */
  suspense?: boolean;
}

export interface AudioWaveformRef {
  canvas: HTMLCanvasElement | null;
}

// Promise cache for Suspense support (automatic garbage collection)
const audioDataCache = new WeakMap<Blob, Promise<number[]>>();

async function decodeAudioBlob(blob: Blob, sampleCount: number): Promise<number[]> {
  const audioContext = new AudioContext();
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / sampleCount);
  const peaks: number[] = [];

  for (let i = 0; i < sampleCount; i++) {
    const start = i * blockSize;
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[start + j] || 0);
    }
    peaks.push(sum / blockSize);
  }

  const maxPeak = Math.max(...peaks);
  const normalizedPeaks = maxPeak > 0 ? peaks.map((p) => p / maxPeak) : peaks;

  await audioContext.close();

  return normalizedPeaks;
}

function getAudioData(blob: Blob, sampleCount: number): Promise<number[]> {
  let promise = audioDataCache.get(blob);

  if (!promise) {
    promise = decodeAudioBlob(blob, sampleCount);
    audioDataCache.set(blob, promise);
  }

  return promise;
}

export const AudioWaveform = forwardRef<AudioWaveformRef, AudioWaveformProps>(function AudioWaveform(
  { blob, className = "", style, suspense: suspenseProp = false },
  ref
) {
  // With polyfill, suspense works in both React 18 and 19
  const suspense = suspenseProp;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const rafRef = useRef<number>(0);

  const sampleCount = useMemo(() => Math.max(200, Math.ceil(window.innerWidth / 4)), []);

  // Suspense mode: React 19-style Promise unwrapping
  // Uses unwrapPromise() which throws Promise for Suspense boundary to catch
  let peaksFromSuspense: number[] | null = null;
  if (suspense && blob) {
    peaksFromSuspense = unwrapPromise(getAudioData(blob, sampleCount));
  }

  // Legacy mode: useState with useEffect
  const [peaksFromState, setPeaksFromState] = useState<number[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const blobRef = useRef<Blob | null>(null);

  const peaks = suspense ? peaksFromSuspense : peaksFromState;

  useImperativeHandle(ref, () => ({
    canvas: canvasRef.current,
  }));

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const { width, height } = sizeRef.current;
    if (!canvas || !peaks || width === 0 || height === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    // Only resize canvas if needed
    const targetWidth = width * dpr;
    const targetHeight = height * dpr;
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Read CSS variables with fallback defaults
    const styles = getComputedStyle(canvas);
    const barWidth = parseFloat(styles.getPropertyValue("--bar-width")) || 3;
    const gap = parseFloat(styles.getPropertyValue("--bar-gap")) || 1;
    const barRadius = parseFloat(styles.getPropertyValue("--bar-radius")) || 1;

    const totalBarWidth = barWidth + gap;
    const barsCount = Math.floor(width / totalBarWidth);
    const step = peaks.length / barsCount;

    ctx.fillStyle = styles.color || "#3b82f6";

    for (let i = 0; i < barsCount; i++) {
      const peakIndex = Math.min(Math.floor(i * step), peaks.length - 1);
      const peak = peaks[peakIndex];
      const barHeight = Math.max(peak * height * 0.9, 2);
      const x = i * totalBarWidth;
      const y = (height - barHeight) / 2;

      if (barRadius > 0) {
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, barRadius);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    }
  }, [peaks]);

  // ResizeObserver with RAF throttling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      if (sizeRef.current.width === width && sizeRef.current.height === height) return;

      sizeRef.current = { width, height };

      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(drawWaveform);
    });

    resizeObserver.observe(canvas);
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [drawWaveform]);

  // Decode audio when blob changes (only in non-Suspense mode)
  useEffect(() => {
    if (suspense) return; // Skip in Suspense mode

    if (!blob) {
      setPeaksFromState(null);
      setError(null);
      blobRef.current = null;
      return;
    }

    // Skip if same blob
    if (blobRef.current === blob) return;
    blobRef.current = blob;

    let cancelled = false;
    setError(null);

    decodeAudioBlob(blob, sampleCount)
      .then((data) => {
        if (!cancelled) {
          setPeaksFromState(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(err?.message || "Failed to decode audio"));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [blob, suspense, sampleCount]);

  // Draw when peaks change
  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  if (error) {
    throw error;
  }

  return <canvas ref={canvasRef} className={className} style={style} />;
});

export const AudioVisualizer = AudioWaveform;

export default AudioWaveform;
