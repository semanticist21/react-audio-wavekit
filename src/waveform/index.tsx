import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { decodeAudioBlob, getAudioData } from "./util-audio-decoder";
import type { BarConfig } from "./util-canvas";
import { unwrapPromise } from "./util-suspense";
import { WaveformRenderer, type WaveformRendererRef } from "./waveform-renderer";

// ============================================================================
// AudioWaveform - Unified Component (with optional Suspense support)
// ============================================================================

export interface AudioWaveformProps {
  /** Audio blob to visualize */
  blob: Blob | null;
  /** Additional class name for the canvas */
  className?: string;
  /** Bar styling configuration */
  barConfig?: BarConfig;
  /** Enable Suspense mode (requires Suspense boundary in parent) */
  suspense?: boolean;
  /** Current playback time in seconds (shows playhead) */
  currentTime?: number;
  /** Total audio duration in seconds (required for playhead positioning) */
  duration?: number;
  /** Callback when user clicks/seeks on waveform */
  onSeek?: (time: number) => void;
  /** Playhead class name for Tailwind styling (e.g., "text-red-500 [--playhead-width:3]") */
  playheadClassName?: string;
}

export interface AudioWaveformRef {
  canvas: HTMLCanvasElement | null;
}

export const AudioWaveform = forwardRef<AudioWaveformRef, AudioWaveformProps>(function AudioWaveform(
  { blob, className, barConfig, suspense = false, currentTime, duration, onSeek, playheadClassName },
  ref
) {
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const rendererRef = useRef<WaveformRendererRef>(null);

  // sampleCount: 화면 너비만큼 샘플을 가져와서 고해상도에서도 선명하게 표시
  const sampleCount = useMemo(() => Math.max(500, Math.ceil(window.innerWidth)), []);

  // Forward ref to WaveformRenderer's canvas
  useEffect(() => {
    if (ref && typeof ref === "function") {
      ref({ canvas: rendererRef.current?.canvas || null });
    } else if (ref) {
      ref.current = { canvas: rendererRef.current?.canvas || null };
    }
  }, [ref]);

  // Suspense mode: Use React 19-style Promise unwrapping
  const suspensePeaks = blob && suspense ? unwrapPromise(getAudioData(blob, sampleCount)) : null;

  // Non-suspense mode: Decode audio when blob changes
  useEffect(() => {
    if (suspense) return; // Skip state management in suspense mode

    if (!blob) {
      setPeaks(null);
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
          setPeaks(data);
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
  }, [blob, sampleCount, suspense]);

  if (!suspense && error) {
    throw error;
  }

  const finalPeaks = suspense ? suspensePeaks : peaks;

  return (
    <WaveformRenderer
      ref={rendererRef}
      peaks={finalPeaks}
      className={className}
      barConfig={barConfig}
      currentTime={currentTime}
      duration={duration}
      onSeek={onSeek}
      playheadClassName={playheadClassName}
    />
  );
});

export default AudioWaveform;
