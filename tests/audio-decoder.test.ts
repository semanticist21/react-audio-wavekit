import { afterEach, describe, expect, it, vi } from "vitest";
import { decodeAudioBlob } from "../src/waveform/util-audio-decoder";

vi.mock("mpg123-decoder", () => {
  return {
    MPEGDecoder: class {
      ready = Promise.resolve();
      decode() {
        return {
          channelData: [new Float32Array([0.1, -0.2, 0.3, -0.4])],
        };
      }
      free() {}
    },
  };
});

type OfflineAudioContextLike = new (
  ...args: unknown[]
) => {
  decodeAudioData: (buffer: ArrayBuffer) => Promise<{ getChannelData: (index: number) => Float32Array }>;
};

const originalOfflineAudioContext = global.OfflineAudioContext;

afterEach(() => {
  global.OfflineAudioContext = originalOfflineAudioContext;
});

describe("decodeAudioBlob", () => {
  it("normalizes sampleCount to channel length to avoid NaN peaks", async () => {
    const OfflineAudioContextMock: OfflineAudioContextLike = class {
      decodeAudioData() {
        return Promise.resolve({
          getChannelData: () => new Float32Array([0.1, -0.2]),
        });
      }
    };
    global.OfflineAudioContext = OfflineAudioContextMock as typeof OfflineAudioContext;

    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/wav" });
    const peaks = await decodeAudioBlob(blob, 10);

    expect(peaks).toHaveLength(2);
    for (const peak of peaks) {
      expect(Number.isFinite(peak)).toBe(true);
    }
  });

  it("surfaces MP3-only fallback message when native decode fails", async () => {
    const OfflineAudioContextMock: OfflineAudioContextLike = class {
      decodeAudioData() {
        return Promise.reject(new Error("native decode failed"));
      }
    };
    global.OfflineAudioContext = OfflineAudioContextMock as typeof OfflineAudioContext;

    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/mp4" });

    await expect(decodeAudioBlob(blob, 4)).rejects.toThrow("MP3");
  });

  it("uses WASM fallback when native decode fails and blob is MP3", async () => {
    const OfflineAudioContextMock: OfflineAudioContextLike = class {
      decodeAudioData() {
        return Promise.reject(new Error("native decode failed"));
      }
    };
    global.OfflineAudioContext = OfflineAudioContextMock as typeof OfflineAudioContext;

    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/mp3" });
    const peaks = await decodeAudioBlob(blob, 10);

    expect(peaks).toHaveLength(4);
    for (const peak of peaks) {
      expect(peak).toBeGreaterThanOrEqual(0);
      expect(peak).toBeLessThanOrEqual(1);
    }
  });
});
