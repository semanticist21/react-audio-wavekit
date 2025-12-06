// ============================================================================
// Audio Decoding Utilities (Common)
// ============================================================================

import { OfflineAudioContext } from "standardized-audio-context";

export async function decodeAudioBlob(blob: Blob, sampleCount: number): Promise<number[]> {
  const arrayBuffer = await blob.arrayBuffer();

  // Check if blob has data
  if (arrayBuffer.byteLength === 0) {
    throw new Error("Audio blob is empty");
  }

  // Cross-browser audio decoding best practice:
  // Use OfflineAudioContext from standardized-audio-context library
  // - OfflineAudioContext: No user gesture required, no autoplay policy restrictions
  // - standardized-audio-context: Fixes Safari/iOS bugs (Promise rejection with null,
  //   callback-only API on older versions)
  // - Call decodeAudioData method directly on the context instance
  //   (standalone decodeAudioData function only works with AudioContext, not OfflineAudioContext)
  const offlineContext = new OfflineAudioContext({ numberOfChannels: 1, length: 1, sampleRate: 44100 });

  // Use arrayBuffer.slice(0) to create a copy, preventing ArrayBuffer detachment issues
  const audioBuffer = await offlineContext.decodeAudioData(arrayBuffer.slice(0)).catch(() => {
    throw new Error(
      `Unable to decode audio data (type: ${blob.type}, size: ${blob.size} bytes). ` +
        `This may be due to an unsupported audio format or corrupted data.`
    );
  });

  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / sampleCount);
  const peaks: number[] = [];

  for (let i = 0; i < sampleCount; i++) {
    const start = i * blockSize;
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[start + j] || 0);
    }
    peaks.push(sum / blockSize);
  }

  const maxPeak = Math.max(...peaks);
  const normalizedPeaks = maxPeak > 0 ? peaks.map((p) => p / maxPeak) : peaks;

  return normalizedPeaks;
}

// Promise cache for Suspense support (automatic garbage collection)
const audioDataCache = new WeakMap<Blob, Promise<number[]>>();

export function getAudioData(blob: Blob, sampleCount: number): Promise<number[]> {
  let promise = audioDataCache.get(blob);

  if (!promise) {
    promise = decodeAudioBlob(blob, sampleCount);
    audioDataCache.set(blob, promise);
  }

  return promise;
}
