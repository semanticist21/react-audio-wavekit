/**
 * Canvas bar 스타일을 CSS 변수에서 읽어오는 유틸리티
 */
export interface CanvasBarStyles {
  /** Bar의 너비 (픽셀) */
  barWidth: number;
  /** Bar 사이의 간격 (픽셀) */
  gap: number;
  /** Bar의 border radius (픽셀) */
  barRadius: number;
  /** Bar의 색상 (CSS color 값) */
  barColor: string;
}

/**
 * Canvas 요소로부터 bar 스타일 설정을 읽어옴
 * @param canvas - 스타일을 읽을 canvas 요소
 * @returns bar 렌더링에 필요한 스타일 설정
 */
export function getCanvasBarStyles(canvas: HTMLCanvasElement): CanvasBarStyles {
  const style = getComputedStyle(canvas);

  return {
    barWidth: Number.parseInt(style.getPropertyValue("--bar-width") || "3", 10),
    gap: Number.parseInt(style.getPropertyValue("--bar-gap") || "1", 10),
    barRadius: Number.parseFloat(style.getPropertyValue("--bar-radius") || "1.5"),
    barColor: style.color,
  };
}
