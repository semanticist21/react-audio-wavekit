import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WaveformRenderer } from "../src/waveform/waveform-renderer";

if (!global.ResizeObserver) {
  // @ts-expect-error - jsdom shim
  global.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
}

const mockCanvasRect = (canvas: HTMLCanvasElement, width = 100) => {
  Object.defineProperty(canvas, "getBoundingClientRect", {
    value: () => ({
      left: 0,
      top: 0,
      right: width,
      bottom: 10,
      width,
      height: 10,
      x: 0,
      y: 0,
      toJSON: () => "",
    }),
  });
};

describe("WaveformRenderer", () => {
  it("fires onSeek and onClick when drag-to-seek is disabled", () => {
    const onSeek = vi.fn();
    const onClick = vi.fn();
    const { container } = render(
      <WaveformRenderer peaks={[0.1, 0.2, 0.3]} duration={10} onSeek={onSeek} onClick={onClick} />
    );

    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    mockCanvasRect(canvas as HTMLCanvasElement, 100);

    fireEvent.click(canvas as HTMLCanvasElement, { clientX: 50 });

    expect(onSeek).toHaveBeenCalledTimes(1);
    expect(onSeek).toHaveBeenCalledWith(5);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onSeek on click when drag-to-seek is enabled", () => {
    const onSeek = vi.fn();
    const onClick = vi.fn();
    const onSeekStart = vi.fn();
    const { container } = render(
      <WaveformRenderer
        peaks={[0.1, 0.2, 0.3]}
        duration={10}
        onSeek={onSeek}
        onSeekStart={onSeekStart}
        onClick={onClick}
      />
    );

    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    mockCanvasRect(canvas as HTMLCanvasElement, 100);

    fireEvent.click(canvas as HTMLCanvasElement, { clientX: 50 });

    expect(onSeek).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
