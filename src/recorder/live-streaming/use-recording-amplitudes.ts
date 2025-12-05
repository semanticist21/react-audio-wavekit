import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { useAudioAnalyser } from "../use-audio-analyser";
import type { UseRecordingAmplitudesOptions, UseRecordingAmplitudesReturn } from "./types";

export type { UseRecordingAmplitudesOptions, UseRecordingAmplitudesReturn };

/**
 * Headless hook for collecting amplitude timeline data from MediaRecorder
 * Samples RMS amplitude at regular intervals for timeline-based waveform visualization
 *
 * 성능 최적화: useSyncExternalStore 사용하여 불필요한 배열 복사 방지
 * - 샘플링 시 amplitudeDataRef에 직접 push (배열 복사 없음)
 * - 구독자에게 snapshot 제공 시에만 배열 참조 반환
 *
 * @example
 * ```tsx
 * const { amplitudes, isRecording } = useRecordingAmplitudes({
 *   mediaRecorder,
 *   sampleInterval: 50
 * });
 *
 * return (
 *   <div className="flex gap-px items-center h-32">
 *     {amplitudes.map((amp, i) => (
 *       <div
 *         key={i}
 *         className="bg-orange-500 w-0.5 rounded-full"
 *         style={{ height: `${amp * 100}%` }}
 *       />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useRecordingAmplitudes(options: UseRecordingAmplitudesOptions): UseRecordingAmplitudesReturn {
  const { mediaRecorder, fftSize = 2048, smoothingTimeConstant = 0.4, sampleInterval = 50 } = options;

  // 외부 store 패턴: 배열 복사 없이 효율적인 업데이트
  const amplitudeDataRef = useRef<number[]>([]);
  const listenersRef = useRef<Set<() => void>>(new Set());
  const samplingIntervalRef = useRef<number | null>(null);

  // useSyncExternalStore용 subscribe/getSnapshot
  const subscribe = useCallback((onStoreChange: () => void) => {
    listenersRef.current.add(onStoreChange);
    return () => listenersRef.current.delete(onStoreChange);
  }, []);

  const getSnapshot = useCallback(() => amplitudeDataRef.current, []);

  // 구독자들에게 변경 알림 (배열 복사 없음)
  const notifyListeners = useCallback(() => {
    for (const listener of listenersRef.current) {
      listener();
    }
  }, []);

  const amplitudes = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const { audioContextRef, analyserRef, dataArrayRef, bufferLengthRef } = useAudioAnalyser({
    mediaRecorder,
    fftSize,
    smoothingTimeConstant,
  });

  // Clear amplitude data
  const clearAmplitudes = useCallback(() => {
    amplitudeDataRef.current = [];
    notifyListeners();
  }, [notifyListeners]);

  // MediaRecorder 인스턴스가 변경될 때만 amplitudes 초기화 (새로운 녹음 시작)
  const prevMediaRecorderRef = useRef<MediaRecorder | null>(null);
  useEffect(() => {
    if (mediaRecorder !== prevMediaRecorderRef.current) {
      // MediaRecorder 인스턴스 변경 = 새로운 녹음 시작 → amplitudes 초기화
      amplitudeDataRef.current = [];
      notifyListeners();
      prevMediaRecorderRef.current = mediaRecorder;
    }
  }, [mediaRecorder, notifyListeners]);

  // Sample amplitude periodically (pause/resume 시 amplitudes 보존)
  useEffect(() => {
    if (!mediaRecorder) {
      return;
    }

    const sampleAmplitude = () => {
      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;
      const bufferLength = bufferLengthRef.current;

      if (!analyser || !dataArray) return;

      // Get time domain data
      analyser.getByteTimeDomainData(dataArray);

      // Calculate RMS amplitude
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / bufferLength);

      // Store amplitude (0-1 range, slightly amplified)
      // 배열 복사 없이 직접 push 후 구독자에게 알림
      const amplitude = Math.min(1, rms * 2);
      amplitudeDataRef.current.push(amplitude);
      notifyListeners();
    };

    const startSampling = () => {
      if (!samplingIntervalRef.current) {
        samplingIntervalRef.current = window.setInterval(sampleAmplitude, sampleInterval);
      }
    };

    const stopSampling = () => {
      if (samplingIntervalRef.current) {
        clearInterval(samplingIntervalRef.current);
        samplingIntervalRef.current = null;
      }
    };

    // pause/resume event handlers (sampling만 중단/재개, amplitudes는 보존)
    const handlePause = () => stopSampling();
    const handleResume = () => startSampling();

    mediaRecorder.addEventListener("pause", handlePause);
    mediaRecorder.addEventListener("resume", handleResume);

    // Start sampling (wait for analyser to be ready)
    const timeoutId = setTimeout(() => {
      startSampling();
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      mediaRecorder.removeEventListener("pause", handlePause);
      mediaRecorder.removeEventListener("resume", handleResume);
      stopSampling();
    };
  }, [mediaRecorder, sampleInterval, analyserRef, dataArrayRef, bufferLengthRef, notifyListeners]);

  return {
    amplitudes,
    audioContext: audioContextRef.current,
    analyser: analyserRef.current,
    isRecording: mediaRecorder?.state === "recording",
    isPaused: mediaRecorder?.state === "paused",
    clearAmplitudes,
  };
}
