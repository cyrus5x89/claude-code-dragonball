// Tốc độ khung hình của animation cảnh nền app (ngọc nhấp nháy, hào quang thở).
// 60 fps giữ easing mượt; 24 / 12 nhảy theo khung hình bằng steps() để đỡ tốn máy.
export const FPS = [12, 24, 60]

/** Cảnh nền ở fps này: dưới 60 thì đổi easing thành steps(thời lượng × fps). */
export function sceneAtFps(svg: string, fps: number): string {
  if (fps >= 60) return svg
  return svg
    .replace('pulse 6s ease-in-out', `pulse 6s steps(${6 * fps}, jump-none)`)
    .replace('breathe 9s ease-in-out', `breathe 9s steps(${9 * fps}, jump-none)`)
}
