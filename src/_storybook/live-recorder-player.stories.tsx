import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useRef } from "react";
import { LiveRecorder } from "../recorder/live-recorder";
import { useAudioRecorder } from "../recorder/use-audio-recorder";

function LiveRecorderPlayer() {
  const { startRecording, stopRecording, pauseRecording, resumeRecording, mediaRecorder, isRecording, isPaused } =
    useAudioRecorder({
      onRecordingComplete: (_audioBlob) => {
        // Uncomment to play audio in new tab when recording completes
        // const audioUrl = URL.createObjectURL(audioBlob);
        // window.open(audioUrl, "_blank");
      },
    });

  // Recording start/pause/resume button handler
  const handleRecordClick = () => {
    if (!isRecording) {
      startRecording();
    } else if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-100">
      <div className="flex h-24 w-fit items-center gap-4 rounded-2xl bg-white px-5 shadow-lg">
        {/* Record/pause button */}
        <button
          type="button"
          onClick={handleRecordClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md"
        >
          {!isRecording ? (
            // Start recording: red circle
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : isPaused ? (
            // Resume from pause: red circle
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : (
            // Pause during recording: two vertical bars
            <div className="flex gap-0.5">
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
            </div>
          )}
        </button>

        {/* Real-time frequency visualization */}
        <LiveRecorder mediaRecorder={mediaRecorder} className="h-12 w-72 rounded-sm bg-slate-100 text-slate-600" />

        {/* Stop button */}
        <button
          type="button"
          onClick={stopRecording}
          disabled={!isRecording}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md disabled:opacity-40"
        >
          <div className="h-3.5 w-3.5 rounded-sm bg-slate-700" />
        </button>
      </div>
    </div>
  );
}

function LiveRecorderPlayerWithPlay() {
  const {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    mediaRecorder,
    recordingBlob,
    isRecording,
    isPaused,
  } = useAudioRecorder();

  const audioRef = useRef<HTMLAudioElement>(null);

  // Set blob URL to audio element when recording completes
  useEffect(() => {
    if (recordingBlob && audioRef.current) {
      const url = URL.createObjectURL(recordingBlob);
      audioRef.current.src = url;
      return () => URL.revokeObjectURL(url);
    }
  }, [recordingBlob]);

  const handleRecordClick = () => {
    if (!isRecording) {
      startRecording();
    } else if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-slate-100">
      <div className="flex h-24 w-fit items-center gap-4 rounded-2xl bg-white px-5 shadow-lg">
        <button
          type="button"
          onClick={handleRecordClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md"
        >
          {!isRecording ? (
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : isPaused ? (
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : (
            <div className="flex gap-0.5">
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
            </div>
          )}
        </button>

        <LiveRecorder mediaRecorder={mediaRecorder} className="h-12 w-72 rounded-sm bg-slate-100 text-slate-600" />

        <button
          type="button"
          onClick={stopRecording}
          disabled={!isRecording}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md disabled:opacity-40"
        >
          <div className="h-3.5 w-3.5 rounded-sm bg-slate-700" />
        </button>
      </div>

      {/* Audio playback UI after recording completes */}
      {recordingBlob && (
        <div className="flex w-fit flex-col items-center gap-3 rounded-2xl bg-white p-5 shadow-lg">
          <p className="text-sm font-medium text-slate-700">Recording Complete</p>
          {/* biome-ignore lint/a11y/useMediaCaption: Recorded audio does not require captions */}
          <audio ref={audioRef} controls className="w-80" />
        </div>
      )}
    </div>
  );
}

function LiveRecorderPlayerCustomAppearance() {
  const { startRecording, stopRecording, pauseRecording, resumeRecording, mediaRecorder, isRecording, isPaused } =
    useAudioRecorder();

  const handleRecordClick = () => {
    if (!isRecording) {
      startRecording();
    } else if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-900">
      <div className="flex h-24 w-fit items-center gap-4 rounded-2xl bg-slate-800 px-5 shadow-lg">
        <button
          type="button"
          onClick={handleRecordClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 shadow-md"
        >
          {!isRecording ? (
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : isPaused ? (
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : (
            <div className="flex gap-0.5">
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
            </div>
          )}
        </button>

        {/* Custom appearance with wider bars and green color */}
        <LiveRecorder
          mediaRecorder={mediaRecorder}
          className="h-12 w-72 rounded-sm bg-slate-700"
          appearance={{
            barColor: "#22c55e",
            barWidth: 4,
            barGap: 2,
            barRadius: 2,
          }}
        />

        <button
          type="button"
          onClick={stopRecording}
          disabled={!isRecording}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 shadow-md disabled:opacity-40"
        >
          <div className="h-3.5 w-3.5 rounded-sm bg-slate-300" />
        </button>
      </div>
    </div>
  );
}

const meta: Meta<typeof LiveRecorderPlayer> = {
  title: "Recorder/LiveRecorder",
  component: LiveRecorderPlayer,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof LiveRecorderPlayer>;

export const Default: Story = {
  parameters: {
    docs: {
      source: {
        code: `import { LiveRecorder, useAudioRecorder } from "react-audio-waveform";

function LiveRecorderPlayer() {
  const { startRecording, stopRecording, pauseRecording, resumeRecording, mediaRecorder, isRecording, isPaused } =
    useAudioRecorder({
      onRecordingComplete: (audioBlob) => {
        // Handle recording completion
        const audioUrl = URL.createObjectURL(audioBlob);
        window.open(audioUrl, "_blank");
      },
    });

  // Recording start/pause/resume button handler
  const handleRecordClick = () => {
    if (!isRecording) {
      startRecording();
    } else if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-100">
      <div className="flex h-24 w-fit items-center gap-4 rounded-2xl bg-white px-5 shadow-lg">
        {/* Record/pause button */}
        <button
          type="button"
          onClick={handleRecordClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md"
        >
          {!isRecording ? (
            // Start recording: red circle
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : isPaused ? (
            // Resume from pause: red circle
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : (
            // Pause during recording: two vertical bars
            <div className="flex gap-0.5">
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
            </div>
          )}
        </button>

        {/* Real-time frequency visualization */}
        <LiveRecorder mediaRecorder={mediaRecorder} className="h-12 w-72 rounded-sm bg-slate-100 text-slate-600" />

        {/* Stop button */}
        <button
          type="button"
          onClick={stopRecording}
          disabled={!isRecording}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md disabled:opacity-40"
        >
          <div className="h-3.5 w-3.5 rounded-sm bg-slate-700" />
        </button>
      </div>
    </div>
  );
}`,
      },
    },
  },
};

export const WithPlay: StoryObj<typeof LiveRecorderPlayerWithPlay> = {
  render: () => <LiveRecorderPlayerWithPlay />,
  parameters: {
    docs: {
      source: {
        code: `import { useEffect, useRef } from "react";
import { LiveRecorder, useAudioRecorder } from "react-audio-waveform";

function LiveRecorderPlayerWithPlay() {
  const {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    mediaRecorder,
    recordingBlob,
    isRecording,
    isPaused,
  } = useAudioRecorder();

  const audioRef = useRef<HTMLAudioElement>(null);

  // Set blob URL to audio element when recording completes
  useEffect(() => {
    if (recordingBlob && audioRef.current) {
      const url = URL.createObjectURL(recordingBlob);
      audioRef.current.src = url;
      return () => URL.revokeObjectURL(url);
    }
  }, [recordingBlob]);

  const handleRecordClick = () => {
    if (!isRecording) {
      startRecording();
    } else if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-slate-100">
      <div className="flex h-24 w-fit items-center gap-4 rounded-2xl bg-white px-5 shadow-lg">
        <button
          type="button"
          onClick={handleRecordClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md"
        >
          {!isRecording ? (
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : isPaused ? (
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : (
            <div className="flex gap-0.5">
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
            </div>
          )}
        </button>

        <LiveRecorder mediaRecorder={mediaRecorder} className="h-12 w-72 rounded-sm bg-slate-100 text-slate-600" />

        <button
          type="button"
          onClick={stopRecording}
          disabled={!isRecording}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-md disabled:opacity-40"
        >
          <div className="h-3.5 w-3.5 rounded-sm bg-slate-700" />
        </button>
      </div>

      {/* Audio playback UI after recording completes */}
      {recordingBlob && (
        <div className="flex w-fit flex-col items-center gap-3 rounded-2xl bg-white p-5 shadow-lg">
          <p className="text-sm font-medium text-slate-700">Recording Complete</p>
          <audio ref={audioRef} controls className="w-80" />
        </div>
      )}
    </div>
  );
}`,
      },
    },
  },
};

export const CustomAppearance: StoryObj<typeof LiveRecorderPlayerCustomAppearance> = {
  render: () => <LiveRecorderPlayerCustomAppearance />,
  parameters: {
    docs: {
      source: {
        code: `import { LiveRecorder, useAudioRecorder } from "react-audio-waveform";

function LiveRecorderPlayerCustomAppearance() {
  const { startRecording, stopRecording, pauseRecording, resumeRecording, mediaRecorder, isRecording, isPaused } =
    useAudioRecorder();

  const handleRecordClick = () => {
    if (!isRecording) {
      startRecording();
    } else if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-900">
      <div className="flex h-24 w-fit items-center gap-4 rounded-2xl bg-slate-800 px-5 shadow-lg">
        <button
          type="button"
          onClick={handleRecordClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 shadow-md"
        >
          {!isRecording ? (
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : isPaused ? (
            <div className="h-4 w-4 rounded-full bg-red-500" />
          ) : (
            <div className="flex gap-0.5">
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
              <div className="h-4 w-1 rounded-sm bg-orange-500" />
            </div>
          )}
        </button>

        {/* Custom appearance with wider bars and green color */}
        <LiveRecorder
          mediaRecorder={mediaRecorder}
          className="h-12 w-72 rounded-sm bg-slate-700"
          appearance={{
            barColor: "#22c55e",
            barWidth: 4,
            barGap: 2,
            barRadius: 2,
          }}
        />

        <button
          type="button"
          onClick={stopRecording}
          disabled={!isRecording}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 shadow-md disabled:opacity-40"
        >
          <div className="h-3.5 w-3.5 rounded-sm bg-slate-300" />
        </button>
      </div>
    </div>
  );
}`,
      },
    },
  },
};
