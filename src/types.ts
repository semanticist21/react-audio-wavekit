// ============================================================================
// Appearance Types - 공통 시각화 스타일 정의
// ============================================================================

/**
 * 기본 웨이브폼 appearance 설정
 * 모든 웨이브폼 컴포넌트에서 공통으로 사용
 */
export interface WaveformAppearance {
  /** 바 색상 (CSS color 값). 기본값: "#3b82f6" (blue-500) */
  barColor?: string;
  /** 바 너비 (pixels). 기본값: 3 */
  barWidth?: number;
  /** 바 간격 (pixels). 기본값: 1 */
  barGap?: number;
  /** 바 모서리 둥글기 (pixels). 기본값: 1.5 */
  barRadius?: number;
  /** 바 높이 스케일 (0.0 - 1.0). 기본값: 0.9 (10% 상하 여백) */
  barHeightScale?: number;
}

/**
 * AudioWaveform 전용 appearance 설정
 * 기본 WaveformAppearance + playhead 스타일 포함
 */
export interface AudioWaveformAppearance extends WaveformAppearance {
  /** Playhead 색상 (CSS color 값). 기본값: "#ef4444" (red-500) */
  playheadColor?: string;
  /** Playhead 너비 (pixels). 기본값: 2 */
  playheadWidth?: number;
}
