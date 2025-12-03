import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { LiveAudioVisualizer } from "./live-audio-visualizer";
import { useAudioRecorder } from "./use-audio-recorder";

const meta = {
  title: "Components/LiveAudioRecorder",
  component: LiveAudioVisualizer,
} satisfies Meta<typeof LiveAudioVisualizer>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Interactive Recording Demo
// ============================================================================

function LiveRecordingDemo() {
  const {
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
  } = useAudioRecorder();

  const [savedBlob, setSavedBlob] = useState<Blob | null>(null);

  const handleStop = () => {
    stopRecording();
  };

  const handleSave = () => {
    if (recordingBlob) {
      setSavedBlob(recordingBlob);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Live Audio Recorder</h2>
          <p className="text-gray-600">Record your voice with real-time visualization</p>
        </div>

        {/* Visualizer */}
        <div className="w-full h-48 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
          <LiveAudioVisualizer
            mediaRecorder={mediaRecorder}
            className="text-blue-500 size-full [--bar-width:3] [--bar-gap:1] [--bar-radius:1.5]"
          />
        </div>

        {/* Recording Time */}
        <div className="text-center">
          <div className="text-4xl font-mono font-bold text-gray-800">{formatTime(recordingTime)}</div>
          <div className="text-sm text-gray-500 mt-1">
            {isRecording && !isPaused && "Recording..."}
            {isPaused && "Paused"}
            {!isRecording && "Ready to record"}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              Start Recording
            </button>
          ) : (
            <>
              {!isPaused ? (
                <button
                  type="button"
                  onClick={pauseRecording}
                  className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                >
                  Pause
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resumeRecording}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                >
                  Resume
                </button>
              )}
              <button
                type="button"
                onClick={handleStop}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
              >
                Stop
              </button>
            </>
          )}
          {recordingBlob && !isRecording && (
            <>
              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={clearRecording}
                className="px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
              >
                Clear
              </button>
            </>
          )}
        </div>

        {/* Error Display */}
        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error.message}</div>}

        {/* Recording Result */}
        {recordingBlob && !isRecording && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
            <div className="font-medium text-green-800">Recording Complete</div>
            <audio controls src={URL.createObjectURL(recordingBlob)} className="w-full" />
            <div className="text-sm text-green-700">Size: {(recordingBlob.size / 1024).toFixed(2)} KB</div>
          </div>
        )}

        {/* Saved Recording */}
        {savedBlob && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
            <div className="font-medium text-blue-800">Saved Recording</div>
            <audio controls src={URL.createObjectURL(savedBlob)} className="w-full" />
          </div>
        )}
      </div>
    </div>
  );
}

export const Interactive: Story = {
  args: {
    mediaRecorder: null,
  },
  render: () => <LiveRecordingDemo />,
};

// ============================================================================
// Different Visualization Styles
// ============================================================================

function VisualizerStylesDemo() {
  const { startRecording, stopRecording, mediaRecorder, isRecording } = useAudioRecorder();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Visualizer Styles</h2>
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-6 py-3 ${
              isRecording ? "bg-gray-700 hover:bg-gray-800" : "bg-red-500 hover:bg-red-600"
            } text-white rounded-lg font-medium transition-colors`}
          >
            {isRecording ? "Stop Recording" : "Start Recording"}
          </button>
        </div>

        {/* Dense Bars */}
        <div className="space-y-2">
          <h3 className="font-medium text-gray-700">Dense Bars</h3>
          <div className="w-full h-32 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
            <LiveAudioVisualizer
              mediaRecorder={mediaRecorder}
              className="text-emerald-500 size-full [--bar-width:2] [--bar-gap:0.5] [--bar-radius:1]"
            />
          </div>
        </div>

        {/* Medium Bars */}
        <div className="space-y-2">
          <h3 className="font-medium text-gray-700">Medium Bars</h3>
          <div className="w-full h-32 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
            <LiveAudioVisualizer
              mediaRecorder={mediaRecorder}
              className="text-blue-500 size-full [--bar-width:3] [--bar-gap:1] [--bar-radius:1.5]"
            />
          </div>
        </div>

        {/* Wide Bars */}
        <div className="space-y-2">
          <h3 className="font-medium text-gray-700">Wide Bars</h3>
          <div className="w-full h-32 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
            <LiveAudioVisualizer
              mediaRecorder={mediaRecorder}
              className="text-purple-500 size-full [--bar-width:6] [--bar-gap:4] [--bar-radius:3]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const VisualizerStyles: Story = {
  args: {
    mediaRecorder: null,
  },
  render: () => <VisualizerStylesDemo />,
};
