// Sinh bởi make_cli_frames.ts, đừng sửa tay
// số khung (12 fps) của con pet CLI: intro chạy một lần, loop lặp lại (0 = giữ khung cuối); wide = chụp cả dải
export const FRAME_FPS = 12
export const NARROW = 255
export const FRAMES: Record<string, { intro: number; loop: number; wide: boolean }> = {"idle":{"intro":0,"loop":43,"wide":false},"sleep":{"intro":0,"loop":60,"wide":false},"charge":{"intro":6,"loop":17,"wide":false},"punch":{"intro":10,"loop":0,"wide":false},"blast":{"intro":22,"loop":0,"wide":true}}
