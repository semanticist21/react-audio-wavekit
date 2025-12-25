"use client";

import { useState } from "react";
import {
  LiveRecorder,
  LiveStreamingRecorder,
  LiveStreamingStackRecorder,
  useAudioRecorder,
} from "react-audio-wavekit";

function LiveRecorderTest() {
  const { startRecording, stopRecording, mediaRecorder, isRecording } =
    useAudioRecorder();

  return (
    <div className="mb-8 p-4 bg-gray-100 rounded-lg">
      <h2 className="text-lg font-semibold mb-4">LiveRecorder (Frequency Bars)</h2>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isRecording ? "Stop" : "Start"}
        </button>
        <LiveRecorder
          mediaRecorder={mediaRecorder}
          className="h-16 w-64 bg-white rounded border"
          appearance={{ barColor: "#3b82f6", barWidth: 3, barGap: 2 }}
        />
        <span className="text-sm text-gray-500">
          {isRecording ? "Recording..." : "Click Start"}
        </span>
      </div>
    </div>
  );
}

function StreamingRecorderTest() {
  const { startRecording, stopRecording, mediaRecorder, isRecording } =
    useAudioRecorder();

  return (
    <div className="mb-8 p-4 bg-gray-100 rounded-lg">
      <h2 className="text-lg font-semibold mb-4">
        LiveStreamingRecorder (Timeline - Scrolling)
      </h2>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          {isRecording ? "Stop" : "Start"}
        </button>
        <LiveStreamingRecorder.Root
          mediaRecorder={mediaRecorder}
          className="h-16 w-64 bg-white rounded border"
        >
          <LiveStreamingRecorder.Canvas
            appearance={{ barColor: "#22c55e", barWidth: 2, barGap: 1 }}
          />
        </LiveStreamingRecorder.Root>
        <span className="text-sm text-gray-500">
          {isRecording ? "Recording..." : "Click Start"}
        </span>
      </div>
    </div>
  );
}

function StackRecorderTest() {
  const { startRecording, stopRecording, mediaRecorder, isRecording } =
    useAudioRecorder();

  return (
    <div className="mb-8 p-4 bg-gray-100 rounded-lg">
      <h2 className="text-lg font-semibold mb-4">
        LiveStreamingStackRecorder (Fixed Width - Compressing)
      </h2>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          {isRecording ? "Stop" : "Start"}
        </button>
        <LiveStreamingStackRecorder
          mediaRecorder={mediaRecorder}
          className="h-16 w-64 bg-white rounded border"
          appearance={{ barColor: "#a855f7", barWidth: 2, barGap: 1 }}
        />
        <span className="text-sm text-gray-500">
          {isRecording ? "Recording..." : "Click Start"}
        </span>
      </div>
    </div>
  );
}

export default function RecorderTestPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Recorder Components Test</h1>
      <p className="mb-6 text-gray-600">
        Click Start on each recorder to test. Requires microphone permission.
      </p>

      <LiveRecorderTest />
      <StreamingRecorderTest />
      <StackRecorderTest />
    </div>
  );
}
