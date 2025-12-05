import { useEffect, useRef, useState } from "react";
import { useAudioAnalyser } from "./use-audio-analyser";

export interface UseLiveAudioDataOptions {
  /** MediaRecorder instance to visualize */
  mediaRecorder: MediaRecorder | null;
  /** FFT size for frequency analysis (must be power of 2) */
  fftSize?: number;
  /** Smoothing time constant for analyser (0-1) */
  smoothingTimeConstant?: number;
  /** Number of frequency bars to display */
  barCount?: number;
}

export interface UseLiveAudioDataReturn {
  /** Frequency data (0-100 range) for each bar */
  frequencies: number[];
  /** Volume levels (0-100 range) */
  volumes: number[];
  /** Audio context instance */
  audioContext: AudioContext | null;
  /** Analyser node instance */
  analyser: AnalyserNode | null;
  /** Whether recording is active */
  isRecording: boolean;
  /** Whether recording is paused */
  isPaused: boolean;
}

/**
 * Headless hook for extracting real-time audio frequency data from MediaRecorder
 *
 * @example
 * ```tsx
 * const { frequencies, isRecording } = useLiveAudioData({ mediaRecorder });
 *
 * return (
 *   <div className="flex gap-1 items-center h-32">
 *     {frequencies.map((freq, i) => (
 *       <div
 *         key={i}
 *         className="bg-green-500 w-1"
 *         style={{ height: `${freq}%` }}
 *       />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useLiveAudioData(options: UseLiveAudioDataOptions): UseLiveAudioDataReturn {
  const { mediaRecorder, fftSize = 2048, smoothingTimeConstant = 0.8, barCount = 64 } = options;

  const [frequencies, setFrequencies] = useState<number[]>([]);
  const [volumes, setVolumes] = useState<number[]>([]);
  const animationRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);

  const { audioContextRef, analyserRef, dataArrayRef, bufferLengthRef } = useAudioAnalyser({
    mediaRecorder,
    fftSize,
    smoothingTimeConstant,
  });

  // Animation loop for extracting real-time frequency data
  useEffect(() => {
    if (!mediaRecorder) {
      setFrequencies([]);
      setVolumes([]);
      return;
    }

    isPausedRef.current = false;

    const updateData = () => {
      if (isPausedRef.current) {
        animationRef.current = requestAnimationFrame(updateData);
        return;
      }

      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;
      const bufferLength = bufferLengthRef.current;

      if (!analyser || !dataArray) {
        animationRef.current = requestAnimationFrame(updateData);
        return;
      }

      // Get time domain data (waveform)
      analyser.getByteTimeDomainData(dataArray);

      // Extract frequency data for specified bar count
      const freqData: number[] = [];
      const volData: number[] = [];

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const value = dataArray[dataIndex] || 0;

        // Convert byte value (0-255) to height, centered around 128 (silence)
        const amplitude = Math.abs(value - 128) / 128;
        freqData.push(Math.min(100, amplitude * 100));
        volData.push(value);
      }

      setFrequencies(freqData);
      setVolumes(volData);

      animationRef.current = requestAnimationFrame(updateData);
    };

    // pause/resume event handlers
    const handlePause = () => {
      isPausedRef.current = true;
    };
    const handleResume = () => {
      isPausedRef.current = false;
    };

    mediaRecorder.addEventListener("pause", handlePause);
    mediaRecorder.addEventListener("resume", handleResume);

    // Start animation (wait for analyser to be ready)
    const timeoutId = setTimeout(() => {
      updateData();
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      mediaRecorder.removeEventListener("pause", handlePause);
      mediaRecorder.removeEventListener("resume", handleResume);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [mediaRecorder, barCount, analyserRef, dataArrayRef, bufferLengthRef]);

  return {
    frequencies,
    volumes,
    audioContext: audioContextRef.current,
    analyser: analyserRef.current,
    isRecording: mediaRecorder?.state === "recording",
    isPaused: mediaRecorder?.state === "paused",
  };
}
