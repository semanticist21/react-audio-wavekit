import type { WaveformAppearance } from "./types";

// ============================================================================
// 기본값 상수 - 웨이브폼 및 플레이헤드 기본 스타일
// ============================================================================

export const DEFAULT_WAVEFORM_APPEARANCE: Required<WaveformAppearance> = {
  barColor: "#3b82f6",
  barWidth: 1,
  barGap: 1,
  barRadius: 0,
  barHeightScale: 0.9,
};

export const DEFAULT_PLAYHEAD_APPEARANCE = {
  playheadColor: "#ef4444",
  playheadWidth: 2,
} as const;
