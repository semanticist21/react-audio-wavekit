/**
 * SSR Compatibility Test
 * Verify components render without errors in server environment (no window/document)
 */
import { renderToString } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LiveRecorder } from "../src/recorder/live-recorder";
import { LiveStreamingRecorder } from "../src/recorder/live-streaming/recorder";
import { LiveStreamingStackRecorder } from "../src/recorder/live-streaming/stack-recorder";
import { AudioWaveform } from "../src/waveform";

describe("SSR Compatibility", () => {
  // Simulate server environment: remove window object
  const originalWindow = global.window;

  beforeAll(() => {
    // @ts-expect-error - Simulate server environment
    delete global.window;
  });

  afterAll(() => {
    global.window = originalWindow;
  });

  it("AudioWaveform renders without window access errors", () => {
    expect(() => {
      renderToString(<AudioWaveform blob={null} />);
    }).not.toThrow();
  });

  it("LiveRecorder renders without window access errors", () => {
    expect(() => {
      renderToString(<LiveRecorder mediaRecorder={null} />);
    }).not.toThrow();
  });

  it("LiveStreamingRecorder renders without window access errors", () => {
    expect(() => {
      renderToString(
        <LiveStreamingRecorder.Root mediaRecorder={null}>
          <LiveStreamingRecorder.Canvas />
        </LiveStreamingRecorder.Root>
      );
    }).not.toThrow();
  });

  it("LiveStreamingStackRecorder renders without window access errors", () => {
    expect(() => {
      renderToString(<LiveStreamingStackRecorder mediaRecorder={null} />);
    }).not.toThrow();
  });
});
