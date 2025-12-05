import type { ScrollbarAppearance, WaveformAppearance } from "./types";

// ============================================================================
// Default constants - Waveform and playhead default styles
// ============================================================================

export const DEFAULT_WAVEFORM_APPEARANCE: Required<WaveformAppearance> = {
  barColor: "#3b82f6",
  barWidth: 1,
  barGap: 1,
  barRadius: 0,
  barHeightScale: 0.95,
};

export const DEFAULT_PLAYHEAD_APPEARANCE = {
  playheadColor: "#ef4444",
  playheadWidth: 2,
} as const;

export const DEFAULT_SCROLLBAR_APPEARANCE: Required<ScrollbarAppearance> = {
  thumbColor: "rgba(148, 163, 184, 0.5)",
  hidden: false,
};
