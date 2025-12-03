import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { LiveAudioVisualizer } from "./live-audio-visualizer";

const meta: Meta<typeof LiveAudioVisualizer> = {
  title: "Components/LiveAudioVisualizer",
  component: LiveAudioVisualizer,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Demo component that handles microphone access and recording
 */
function LiveVisualizerDemo({
  className,
  fftSize = 2048,
  smoothingTimeConstant = 0.8,
}: {
  className?: string;
  fftSize?: number;
  smoothingTimeConstant?: number;
}) {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to access microphone");
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
    }

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
  }, [mediaRecorder]);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <div className="w-full max-w-2xl">
        <LiveAudioVisualizer
          mediaRecorder={mediaRecorder}
          className={className}
          fftSize={fftSize}
          smoothingTimeConstant={smoothingTimeConstant}
        />
      </div>

      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        className="px-6 py-2 bg-black text-white rounded-full text-sm hover:bg-gray-800"
      >
        {isRecording ? "Stop" : "Start Recording"}
      </button>

      {error && <p className="text-sm text-red-500">Error: {error}</p>}
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <LiveVisualizerDemo className="h-32 w-full rounded-lg bg-gray-100 text-blue-500 [--bar-width:3] [--bar-gap:1] [--bar-radius:1.5]" />
  ),
};

export const DarkTheme: Story = {
  render: () => (
    <LiveVisualizerDemo className="h-32 w-full rounded-lg bg-gray-900 text-green-400 [--bar-width:4] [--bar-gap:2] [--bar-radius:2]" />
  ),
};
