// Con Claude ở mép phải ngay trên ô chat trên app desktop, theo kiểu Dragon Ball:
//   idle  thở chậm · sleep  nghỉ lâu thì gục đầu ngủ, bay chữ Zzz · charge  gồng ki: hào quang lửa bốc lên, sét (từ medium), đá bay
//   punch  dùng công cụ (đọc, chạy lệnh, tìm): đấm hai phát, nổ va chạm · blast  ghi/sửa file: gom chưởng rồi bắn
// Một dải SVG có CSS animation (Svg isInteractive mới chạy animation).
// fps: 60 mượt (giữ easing), 24 / 12 nhảy theo khung hình bằng steps() để đỡ tốn máy.
import { AURA, MASCOTS } from './scenes'

import type { Pose } from '../types'
export type { Pose }

export const FPS = [12, 24, 60]
export const BLAST_MS = 1800
export const PUNCH_MS = 800

const STILL = '@media (prefers-reduced-motion: reduce) { * { animation: none !important } }'
const SPARKY = ['medium', 'high', 'xhigh', 'max', 'ultracode']

/** Một animation: ở 60 fps giữ easing, thấp hơn thì chia đều thành số khung = thời lượng × fps. */
function anim(fps: number, name: string, seconds: number, ease: string, rest = ''): string {
  const timing = fps >= 60 ? ease : `steps(${Math.max(2, Math.round(seconds * fps))}, jump-none)`
  return `${name} ${seconds}s ${timing} ${rest}`.trim()
}

function css(pose: Pose, fps: number): string {
  const a = (name: string, s: number, ease: string, rest?: string) => anim(fps, name, s, ease, rest)
  switch (pose) {
    case 'idle':
      return `.me{transform-origin:40px 86px;animation:${a('breathe', 3.6, 'ease-in-out', 'infinite')}}` +
        '@keyframes breathe{0%,100%{transform:translateY(0) scale(1,1)}45%,55%{transform:translateY(-1px) scale(1.015,1.045)}}' +
        `.aura{transform-origin:40px 52px;animation:${a('glow', 3.6, 'ease-in-out', 'infinite')}}` +
        '@keyframes glow{0%,100%{opacity:.14;transform:scale(.9)}50%{opacity:.28;transform:scale(1)}}'
    case 'sleep':
      return `.me{transform-origin:40px 86px;animation:${a('doze', 5, 'ease-in-out', 'infinite')}}` +
        '@keyframes doze{0%,100%{transform:translateY(3px) rotate(-7deg) scale(1,.97)}50%{transform:translateY(3px) rotate(-7deg) scale(1.01,1.01)}}' +
        `.z{animation:${a('zzz', 3, 'ease-out', 'infinite')};opacity:0}` +
        '@keyframes zzz{0%{transform:translate(0,0) scale(.6);opacity:0}20%{opacity:.9}100%{transform:translate(18px,-30px) scale(1.3);opacity:0}}'
    case 'charge':
      // ngồi thụp lấy đà rồi rung; lửa ki hai lớp lệch nhịp bốc lên; sét chớp; đá dưới chân bay lên
      return `.me{transform-origin:40px 86px;animation:${a('crouch', 0.45, 'ease-out', 'both')},${a('shake', 0.1, 'linear', '.45s infinite')}}` +
        '@keyframes crouch{from{scale:1 1}to{scale:1.05 .95}}' +
        '@keyframes shake{0%,100%{translate:0 0}33%{translate:1px -.6px}66%{translate:-.8px .6px}}' +
        `.flame{transform-origin:40px 90px;animation:${a('flick', 0.24, 'ease-in-out', 'infinite alternate')}}` +
        `.flame2{transform-origin:40px 90px;animation:${a('flick', 0.18, 'ease-in-out', '-.1s infinite alternate')}}` +
        '@keyframes flick{from{transform:scale(.97,.94);opacity:.75}to{transform:scale(1.04,1.1) translateY(-2px);opacity:1}}' +
        `.bolt{opacity:0;animation:${a('zap', 0.7, 'linear', 'infinite')}}` +
        '@keyframes zap{0%,9%{opacity:0}10%,16%{opacity:1}17%,100%{opacity:0}}' +
        `.rock{animation:${a('lift', 1.4, 'ease-out', 'infinite')}}` +
        '@keyframes lift{0%{transform:translateY(0) rotate(0);opacity:0}15%{opacity:1}100%{transform:translateY(-46px) rotate(160deg);opacity:0}}'
    case 'punch':
      // hai cú đấm thẳng về phía trước (lật thì sang trái), mỗi cú một vụ nổ va chạm và vệt tốc độ
      return `.me{transform-origin:40px 86px;animation:${a('jab', PUNCH_MS / 1000, 'cubic-bezier(.3,1.6,.4,1)', 'both')}}` +
        '@keyframes jab{0%{transform:translateX(0)}12%{transform:translateX(14px) scale(1.04,.97)}24%{transform:translateX(0)}44%{transform:translateX(16px) scale(1.05,.96)}58%,100%{transform:translateX(0)}}' +
        `.hit{transform-origin:100px 50px;opacity:0;animation:${a('hit', PUNCH_MS / 1000, 'ease-out', 'both')}}` +
        '@keyframes hit{0%,8%{transform:scale(.2);opacity:0}13%{transform:scale(1.1);opacity:1}22%{transform:scale(1.3);opacity:0}40%{transform:scale(.2);opacity:0}45%{transform:scale(1.3);opacity:1}56%,100%{transform:scale(1.5);opacity:0}}' +
        `.speed{opacity:0;animation:${a('speed', PUNCH_MS / 1000, 'linear', 'both')}}` +
        '@keyframes speed{0%,8%{opacity:0}12%{opacity:.8}24%{opacity:0}40%{opacity:0}44%{opacity:.8}56%,100%{opacity:0}}'
    case 'blast': {
      // gom chưởng ở tay (0-28%), bắn tia ra và rung (28-75%), tan (75-100%)
      const t = BLAST_MS / 1000
      return `.me{transform-origin:40px 86px;animation:${a('recoil', t, 'ease-out', 'both')}}` +
        '@keyframes recoil{0%{transform:translateX(2px)}28%{transform:translateX(4px) scale(1.04,.96)}34%{transform:translateX(-5px)}60%{transform:translateX(-2px)}100%{transform:translateX(0)}}' +
        `.flame{transform-origin:40px 90px;animation:${a('flick', 0.2, 'ease-in-out', 'infinite alternate')}}` +
        '@keyframes flick{from{transform:scale(.97,.94);opacity:.7}to{transform:scale(1.05,1.12);opacity:1}}' +
        `.orb{transform-origin:72px 52px;animation:${a('orb', t, 'ease-out', 'both')}}` +
        '@keyframes orb{0%{transform:scale(.2);opacity:.6}28%{transform:scale(1.5);opacity:1}40%{transform:scale(1)}80%{transform:scale(.9);opacity:.9}100%{transform:scale(.2);opacity:0}}' +
        `.beam{transform-origin:72px 52px;animation:${a('fire', t, 'cubic-bezier(.2,.8,.2,1)', 'both')}}` +
        '@keyframes fire{0%,28%{transform:scale(0,1);opacity:1}42%{transform:scale(1,1.2)}50%{transform:scale(1,.9)}58%{transform:scale(1,1.12)}75%{transform:scale(1,1);opacity:1}100%{transform:scale(1,.2);opacity:0}}' +
        `.flash{animation:${a('flash', t, 'ease-out', 'both')}}` +
        '@keyframes flash{0%,30%{opacity:0}34%{opacity:.45}50%,100%{opacity:0}}'
    }
  }
}

// lửa ki: giọt lửa nhọn đầu, viền trên răng cưa như hào quang Dragon Ball
const FLAME = 'M40,-10 L46,8 L54,-4 L57,15 L68,6 L67,27 C80,42 81,72 68,87 C56,99 24,99 12,87 C-1,72 0,42 13,27 L12,6 L23,15 L26,-4 L34,8 Z'
const BOLTS = ['M14,20 L22,34 L16,36 L26,52', 'M66,16 L58,30 L65,32 L54,48', 'M8,58 L18,64 L12,68 L22,78']
const ROCKS = [[16, 0], [30, 0.5], [52, 0.25], [64, 0.8]]

// flip: lật ngang (Claude ở mép phải, chưởng và cú đấm hướng sang trái)
export function petSvg(level: string, pose: Pose, fps = 24, flip = false): string {
  const color = AURA[level] ?? '#D97757'
  const body = MASCOTS[level] ?? MASCOTS.low
  const fiery = pose === 'charge' || pose === 'blast'
  const parts: string[] = []
  if (pose === 'idle') parts.push('<ellipse class="aura" cx="40" cy="52" rx="40" ry="44" fill="url(#glow)"/>')
  if (fiery) {
    parts.push(`<path class="flame" d="${FLAME}" fill="${color}" opacity=".8" filter="url(#soft)"/>`,
      `<path class="flame2" d="${FLAME}" transform="translate(40 52) scale(.72 .78) translate(-40 -46)" fill="#FFFFFF" opacity=".45"/>`)
  }
  if (pose === 'charge') {
    if (SPARKY.includes(level)) {
      parts.push(...BOLTS.map((d, i) => `<path class="bolt" style="animation-delay:-${i * 0.23}s" d="${d}" fill="none" stroke="#E8F6FF" stroke-width="2.2" stroke-linejoin="round"/>`))
    }
    parts.push(...ROCKS.map(([x, d]) => `<path class="rock" style="animation-delay:-${d}s;transform-box:fill-box;transform-origin:center" d="M${x},84 l4,-3 l4,2 l-1,4 l-5,1 z" fill="#8A847D"/>`))
  }
  if (pose === 'punch') {
    parts.push('<g class="speed" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".8"><path d="M78,40 H104"/><path d="M80,52 H112"/><path d="M78,64 H100"/></g>',
      '<path class="hit" d="M100,34 L104,45 L116,42 L107,51 L118,59 L105,58 L102,70 L97,58 L85,61 L93,51 L84,43 L96,45 Z" fill="#FFE066" stroke="#FFFFFF" stroke-width="1.5"/>')
  }
  if (pose === 'blast') {
    parts.push('<rect class="flash" x="0" y="-20" width="380" height="106" rx="12" fill="#BFF3FF" opacity="0"/>',
      '<g class="beam"><rect x="70" y="41" width="300" height="22" rx="11" fill="url(#beam)"/><rect x="70" y="48" width="300" height="8" rx="4" fill="url(#core)"/></g>',
      '<g class="orb"><circle cx="72" cy="52" r="15" fill="url(#orbg)"/><circle cx="72" cy="52" r="6" fill="#fff"/></g>')
  }
  const zzz = pose === 'sleep'
    ? [['z', 9, 0], ['Z', 12, 1], ['Z', 15, 2]].map(([c, size, d]) =>
      `<text class="z" style="animation-delay:-${d}s" x="62" y="22" font-size="${size}" font-weight="700" font-family="sans-serif" fill="#D8DEE9">${c}</text>`).join('')
    : ''
  const me = `<g class="me"><svg x="4" y="14" width="72" height="72" viewBox="0 0 224 224">${body}</svg></g>`
  // Zzz không lật để chữ đọc xuôi: đặt ngoài nhóm lật, toạ độ tính lại
  const zzzOut = flip ? zzz.replace(/x="62"/g, 'x="300"') : zzz
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -20 380 106" width="380" height="106"><style>${css(pose, fps)} ${STILL}</style><defs>` +
    `<radialGradient id="glow"><stop offset="0" stop-color="${color}" stop-opacity=".9"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>` +
    '<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter>' +
    '<radialGradient id="orbg"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#9FE8FF"/><stop offset="1" stop-color="#4FB8FF" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="beam" x1="0" x2="1"><stop offset="0" stop-color="#9FE8FF"/><stop offset=".7" stop-color="#4FB8FF"/><stop offset="1" stop-color="#4FB8FF" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="core" x1="0" x2="1"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
    `<g${flip ? ' transform="translate(380 0) scale(-1 1)"' : ''}>${parts.join('')}${me}</g>${flip ? zzzOut : ''}` +
    `${flip ? '' : zzz}</svg>`
}

/** Cảnh nền cũng có animation (ngọc nhấp nháy, hào quang thở): đổi easing theo fps như trên. */
export function sceneAtFps(svg: string, fps: number): string {
  if (fps >= 60) return svg
  return svg
    .replace('pulse 6s ease-in-out', `pulse 6s steps(${6 * fps}, jump-none)`)
    .replace('breathe 9s ease-in-out', `breathe 9s steps(${9 * fps}, jump-none)`)
}
