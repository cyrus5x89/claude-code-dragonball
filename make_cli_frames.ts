// Khung hình PNG cho con pet ở CLI (terminal không vẽ SVG): dựng chính petSvg trong Chrome, dừng animation ở từng
// thời điểm 1/12 s rồi chụp nền trong suốt. Ra frames/<level>/<pose>/<i>.png và hooks/frames.ts (số khung từng dáng).
// Chạy: npm i && npm run frames  (cần Google Chrome); rồi python3 make_scenes.py --frames để nén PNG
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

import { petSvg } from './hooks/pet'
import type { Pose } from './types'

const FPS = 12
const LEVELS = ['low', 'medium', 'high', 'xhigh', 'max', 'ultracode']
// [dáng, số khung mở đầu, số khung vòng lặp, giây tổng]: idle / sleep lặp từ đầu, charge chạy đoạn bung ki 0.5 s rồi
// lặp 1.4 s, punch / blast chạy một lần (vòng 0 = giữ khung cuối)
const POSES: [Pose, number, number, number][] = [
  ['idle', 0, 43, 3.6], ['sleep', 0, 60, 5], ['charge', 6, 17, 0.45 + 1.4], ['punch', 10, 0, 0.8], ['blast', 22, 0, 1.8],
]
// phần dải được chụp (toạ độ viewBox 380 x 106 của petSvg, đã lật): chưởng cần cả dải, còn lại chỉ quanh con Claude
const NARROW = 255

async function main(): Promise<void> {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' })
  const page = await browser.newPage({ viewport: { width: 380, height: 106 }, deviceScaleFactor: 1.5 })
  const counts: Record<string, { intro: number; loop: number; wide: boolean }> = {}
  for (const level of LEVELS) {
    for (const [pose, intro, loop] of POSES) {
      const wide = pose === 'blast'
      counts[pose] = { intro, loop, wide }
      const dir = `frames/${level}/${pose}`
      mkdirSync(dir, { recursive: true })
      await page.setContent(`<html><body style="margin:0;background:transparent">${petSvg(level, pose, 60, true)}</body></html>`)
      await page.waitForTimeout(150)  // khung đầu chụp ngay sau khi nạp thì có khi chưa vẽ xong
      for (let i = 0; i < intro + loop; i++) {
        await page.evaluate(ms => document.getAnimations().forEach(a => { a.pause(); a.currentTime = ms }), (i * 1000) / FPS)
        const x = wide ? 0 : NARROW
        await page.screenshot({ path: `${dir}/${i}.png`, omitBackground: true, clip: { x, y: 0, width: 380 - x, height: 106 } })
      }
    }
  }
  await browser.close()
  writeFileSync('hooks/frames.ts', '// Sinh bởi make_cli_frames.ts, đừng sửa tay\n' +
    `// số khung (${FPS} fps) của con pet CLI: intro chạy một lần, loop lặp lại (0 = giữ khung cuối); wide = chụp cả dải\n` +
    `export const FRAME_FPS = ${FPS}\nexport const NARROW = ${NARROW}\n` +
    `export const FRAMES: Record<string, { intro: number; loop: number; wide: boolean }> = ${JSON.stringify(counts)}\n`)
}

void main()
