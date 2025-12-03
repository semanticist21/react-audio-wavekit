// ============================================================================
// Audio Decoding Utilities (Common)
// ============================================================================

export async function decodeAudioBlob(blob: Blob, sampleCount: number): Promise<number[]> {
  const audioContext = new AudioContext();
  const arrayBuffer = await blob.arrayBuffer();

  // Check if blob has data
  if (arrayBuffer.byteLength === 0) {
    await audioContext.close();
    throw new Error("Audio blob is empty");
  }

  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  } catch {
    await audioContext.close();
    throw new Error(
      `Unable to decode audio data (type: ${blob.type}, size: ${blob.size} bytes). ` +
        `This may be due to an unsupported audio format or corrupted data.`
    );
  }

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

  await audioContext.close();

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
