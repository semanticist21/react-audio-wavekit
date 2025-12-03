import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { LiveAudioVisualizer } from "./recorder/live-audio-visualizer";
import { useAudioRecorder } from "./recorder/use-audio-recorder";
import { AudioWaveform } from "./waveform/audio-waveform";

const meta: Meta = {
  title: "Components/AudioRecorder",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

interface RecordedBlob {
  id: string;
  blob: Blob;
}

/**
 * Complete audio recording demo with live visualization and playback waveform
 * Left: Live recording visualizer, Right: Recorded audio result
 */
function AudioRecorderDemo() {
  const [recordings, setRecordings] = useState<RecordedBlob[]>([]);
  const { startRecording, stopRecording, mediaRecorder, isRecording, error } = useAudioRecorder({
    onRecordingComplete: (blob) => {
      setRecordings((prev) => [...prev, { id: crypto.randomUUID(), blob }]);
    },
  });

  return (
    <div className="flex flex-col gap-6 p-8 w-full max-w-4xl">
      {/* Control Button */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center"
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording ? (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="8" />
            </svg>
          )}
        </button>
        <span className="text-sm text-gray-600">{isRecording ? "Recording..." : "Press to record"}</span>
      </div>

      {/* Live Visualizer - Shows during recording */}
      {mediaRecorder && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-600">Live Recording</span>
          <LiveAudioVisualizer
            mediaRecorder={mediaRecorder}
            className="h-20 w-full rounded-lg bg-red-50 text-red-500 [--bar-width:3] [--bar-gap:1] [--bar-radius:1.5]"
          />
        </div>
      )}

      {/* Recorded Results */}
      {recordings.length > 0 && (
        <div className="flex flex-col gap-4">
          <span className="text-sm font-medium text-gray-600">Recorded Results</span>

          {/* Style 1: barWidth=1, gap=0 (dense) */}
          {recordings.map((recording, index) => (
            <div key={`dense-${recording.id}`} className="flex flex-col gap-1">
              <span className="text-xs text-gray-400">Recording {index + 1} - Dense (barWidth: 1, gap: 0)</span>
              <AudioWaveform
                blob={recording.blob}
                className="h-16 w-full rounded-lg bg-pink-50 text-pink-500"
                style={{ "--bar-width": 1, "--bar-gap": 0, "--bar-radius": 0 }}
              />
            </div>
          ))}

          {/* Style 2: barWidth=4, gap=4 (spaced) */}
          {recordings.map((recording, index) => (
            <div key={`spaced-${recording.id}`} className="flex flex-col gap-1">
              <span className="text-xs text-gray-400">Recording {index + 1} - Spaced (barWidth: 4, gap: 4)</span>
              <AudioWaveform
                blob={recording.blob}
                className="h-16 w-full rounded-lg bg-blue-50 text-blue-400"
                style={{ "--bar-width": 4, "--bar-gap": 4, "--bar-radius": 2 }}
              />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-500">Error: {error.message}</p>}
    </div>
  );
}

export const Default: Story = {
  render: () => <AudioRecorderDemo />,
};
