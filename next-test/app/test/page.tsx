"use client";

import { Component, useEffect, useState, type ReactNode } from "react";
import { AudioWaveform } from "react-audio-wavekit";

// Error boundary to catch rendering errors
class ErrorBoundary extends Component<
  { children: ReactNode; fallback: (error: Error) => ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}

function WaveformTest({ src, label }: { src: string; label: string }) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("loading file...");
  const [decodeStatus, setDecodeStatus] = useState("waiting for blob...");

  useEffect(() => {
    setStatus("fetching...");
    fetch(src)
      .then((res) => {
        setStatus(`fetched, status: ${res.status}`);
        return res.blob();
      })
      .then((b) => {
        setStatus(`blob ready: ${b.size} bytes, type: ${b.type}`);
        setDecodeStatus("blob set, waiting for decode...");
        setBlob(b);
      })
      .catch((e) => {
        setStatus(`error: ${e.message}`);
        setError(e.message);
      });
  }, [src]);

  // Test manual decoding
  useEffect(() => {
    if (!blob) return;
    setDecodeStatus("starting decode test...");

    const testDecode = async () => {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        setDecodeStatus(`arrayBuffer: ${arrayBuffer.byteLength} bytes`);

        const offlineContext = new OfflineAudioContext(1, 1, 44100);
        const audioBuffer = await offlineContext.decodeAudioData(arrayBuffer);
        setDecodeStatus(
          `decoded: ${audioBuffer.duration.toFixed(1)}s, ${audioBuffer.sampleRate}Hz`
        );
      } catch (e) {
        setDecodeStatus(`decode error: ${(e as Error).message}`);
      }
    };
    testDecode();
  }, [blob]);

  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!blob) return <div>{status}</div>;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2">{label}</h2>
      <p className="text-sm text-gray-500 mb-1">{status}</p>
      <p className="text-sm text-blue-500 mb-2">{decodeStatus}</p>
      <ErrorBoundary
        fallback={(e) => (
          <div className="text-red-500 p-4 bg-red-50 rounded">
            Waveform Error: {e.message}
          </div>
        )}
      >
        <AudioWaveform
          blob={blob}
          className="h-20 w-full bg-gray-100 rounded"
          appearance={{ barColor: "#3b82f6", barWidth: 2, barGap: 1 }}
        />
      </ErrorBoundary>
    </div>
  );
}

export default function TestPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">SSR + Audio Waveform Test</h1>
      <p className="mb-6 text-gray-600">If you see this page, SSR worked!</p>

      <WaveformTest src="/sample-5min.mp3" label="MP3 Test (sample-5min.mp3)" />
      <WaveformTest src="/ios-sample.m4a" label="M4A Test (ios-sample.m4a)" />
    </div>
  );
}
