import { useCallback, useEffect, useRef, useState } from "react";

export interface UseAudioRecorderConfig {
  /**
   * MIME type for the recording (e.g., 'audio/webm', 'audio/mp4')
   * @default 'audio/webm'
   */
  mimeType?: string;
  /**
   * Audio constraints for getUserMedia
   * @default true
   */
  audioConstraints?: MediaTrackConstraints | boolean;
  /**
   * Callback when recording is complete
   */
  onRecordingComplete?: (blob: Blob) => void;
}

export interface UseAudioRecorderReturn {
  /** Start recording from the microphone */
  startRecording: () => Promise<void>;
  /** Stop recording and generate the audio blob */
  stopRecording: () => void;
  /** Pause the current recording */
  pauseRecording: () => void;
  /** Resume a paused recording */
  resumeRecording: () => void;
  /** Clear the recording and reset state */
  clearRecording: () => void;
  /** The MediaRecorder instance (for visualization) */
  mediaRecorder: MediaRecorder | null;
  /** The recorded audio as a Blob (available after stopRecording) */
  recordingBlob: Blob | null;
  /** Recording duration in seconds */
  recordingTime: number;
  /** Whether currently recording */
  isRecording: boolean;
  /** Whether recording is paused */
  isPaused: boolean;
  /** Any error that occurred */
  error: Error | null;
}

/**
 * Custom hook for audio recording with real-time visualization support
 * Based on react-audio-visualize patterns
 */
export const useAudioRecorder = (config: UseAudioRecorderConfig = {}): UseAudioRecorderReturn => {
  const { mimeType = "audio/webm", audioConstraints = true, onRecordingComplete } = config;

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // useCallback 안정성을 위한 ref (최신 state 값 추적)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const isRecordingRef = useRef(false);
  const isPausedRef = useRef(false);

  // State를 ref와 동기화
  useEffect(() => {
    mediaRecorderRef.current = mediaRecorder;
    isRecordingRef.current = isRecording;
    isPausedRef.current = isPaused;
  }, [mediaRecorder, isRecording, isPaused]);

  // Timer for recording duration
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      setRecordingBlob(null);
      setRecordingTime(0);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });
      streamRef.current = stream;

      // Create MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : "audio/webm",
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Create final blob from chunks
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        setRecordingBlob(blob);
        onRecordingComplete?.(blob);
        setIsRecording(false);
        setIsPaused(false);
        setMediaRecorder(null);

        // Clean up stream
        if (streamRef.current) {
          for (const track of streamRef.current.getTracks()) {
            track.stop();
          }
          streamRef.current = null;
        }
      };

      recorder.onerror = (event) => {
        setError(new Error(`Recording error: ${event}`));
        setIsRecording(false);
        setIsPaused(false);
      };

      setMediaRecorder(recorder);
      recorder.start(100); // Collect data every 100ms for smooth visualization
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("Failed to start recording:", error);
    }
  }, [mimeType, audioConstraints, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    // ref를 사용해 최신 값 참조 (의존성 배열 안정화)
    if (mediaRecorderRef.current && isRecordingRef.current) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const pauseRecording = useCallback(() => {
    // ref를 사용해 최신 값 참조 (의존성 배열 안정화)
    if (mediaRecorderRef.current && isRecordingRef.current && !isPausedRef.current) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    // ref를 사용해 최신 값 참조 (의존성 배열 안정화)
    if (mediaRecorderRef.current && isRecordingRef.current && isPausedRef.current) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  }, []);

  const clearRecording = useCallback(() => {
    // ref를 사용해 최신 값 참조 (의존성 배열 안정화)
    if (mediaRecorderRef.current && isRecordingRef.current) {
      mediaRecorderRef.current.stop();
    }
    audioChunksRef.current = [];
    setRecordingBlob(null);
    setRecordingTime(0);
    setError(null);
  }, []);

  // Cleanup on unmount only (empty dependency array)
  useEffect(() => {
    return () => {
      // Use refs to get current values at cleanup time
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    mediaRecorder,
    recordingBlob,
    recordingTime,
    isRecording,
    isPaused,
    error,
  };
};
