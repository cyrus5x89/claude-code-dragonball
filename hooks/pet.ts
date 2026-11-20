// Con Claude ở mép phải ngay trên ô chat trên app desktop, theo kiểu Dragon Ball:
// Mỗi con tách 3 lớp (make_scenes.py): .ki viền hào quang, .hair tóc, .bod thân; mỗi lớp cử động riêng, tóc trễ nhịp sau thân.
// low / medium không có hào quang thật: quanh người có điện chớp (.arc) ở mọi dáng trừ ngủ.
//   idle  thở chậm · sleep  nghỉ lâu thì gục đầu ngủ, bay chữ Zzz · charge  gồng ki: tóc dựng, hào quang của chính con đó bốc cao và giật, sét (từ medium), đá bay
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
const ELECTRIC = ['low', 'medium']
// gốc biến hình của từng lớp, theo toạ độ viewBox 224 của mascot: chân thân, chân tóc, tâm hào quang
const FEET = 'transform-origin:112px 178px'
const ROOT = 'transform-origin:112px 112px'
const MID = 'transform-origin:112px 120px'

/** Một animation: ở 60 fps giữ easing, thấp hơn thì chia đều thành số khung = thời lượng × fps. */
function anim(fps: number, name: string, seconds: number, ease: string, rest = ''): string {
  const timing = fps >= 60 ? ease : `steps(${Math.max(2, Math.round(seconds * fps))}, jump-none)`
  return `${name} ${seconds}s ${timing} ${rest}`.trim()
}

function css(pose: Pose, fps: number): string {
  const a = (name: string, s: number, ease: string, rest?: string) => anim(fps, name, s, ease, rest)
  switch (pose) {
    case 'idle':
      // thân thở (giữ thể tích: scaleX = 1/√scaleY), tóc bồng theo trễ 0.15 s, hào quang đập nhịp đôi
      return `.bod{${FEET};animation:${a('breathe', 3.6, 'ease-in-out', 'infinite')}}` +
        '@keyframes breathe{0%,100%{transform:scale(1,1)}45%,55%{transform:scale(.985,1.03)}}' +
        `.hair{${ROOT};animation:${a('sway', 3.6, 'ease-in-out', '.15s infinite')}}` +
        '@keyframes sway{0%,100%{transform:translateY(0) rotate(0)}30%{transform:translateY(-2px) rotate(-1.5deg)}50%{transform:translateY(-3px) rotate(0)}70%{transform:translateY(-2px) rotate(1.5deg)}}' +
        `.ki{${MID};animation:${a('pulse', 1.8, 'ease-in-out', 'infinite')}}` +
        '@keyframes pulse{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.04,1.06);opacity:1}}' +
        `.arc{opacity:0;animation:${a('zap', 1.6, 'linear', 'infinite')}}` +
        '@keyframes zap{0%,6%{opacity:0}7%,12%{opacity:1}13%,100%{opacity:0}}' +
        `.aura{transform-origin:40px 52px;animation:${a('glow', 3.6, 'ease-in-out', 'infinite')}}` +
        '@keyframes glow{0%,100%{opacity:.14;transform:scale(.9)}50%{opacity:.28;transform:scale(1)}}'
    case 'sleep':
      return `.me{transform-origin:40px 86px;animation:${a('doze', 5, 'ease-in-out', 'infinite')}}` +
        '@keyframes doze{0%,100%{transform:translateY(3px) rotate(-7deg) scale(1,.97)}50%{transform:translateY(3px) rotate(-7deg) scale(1.01,1.01)}}' +
        `.hair{${ROOT};transform:rotate(-3deg) scale(1,.95)}.ki{opacity:.3}` +
        `.z{animation:${a('zzz', 3, 'ease-out', 'infinite')};opacity:0}` +
        '@keyframes zzz{0%{transform:translate(0,0) scale(.6);opacity:0}20%{opacity:.9}100%{transform:translate(18px,-30px) scale(1.3);opacity:0}}'
    case 'charge':
      // ngồi thụp lấy đà rồi rung; lửa ki hai lớp lệch nhịp bốc lên; sét chớp; đá dưới chân bay lên
      return `.me{transform-origin:40px 86px;animation:${a('crouch', 0.45, 'ease-out', 'both')},${a('shake', 0.1, 'linear', '.45s infinite')}}` +
        '@keyframes crouch{from{scale:1 1}to{scale:1.05 .95}}' +
        '@keyframes shake{0%,100%{translate:0 0}33%{translate:1px -.6px}66%{translate:-.8px .6px}}' +
        // tóc dựng lên rồi run, hào quang bốc cao và giật liên hồi
        `.hair{${ROOT};animation:${a('rise', 0.45, 'cubic-bezier(.34,1.56,.64,1)', 'both')},${a('tremble', 0.08, 'linear', '.45s infinite')}}` +
        '@keyframes rise{from{transform:translateY(0) scale(1)}to{transform:translateY(-4px) scale(1.03,1.1)}}' +
        '@keyframes tremble{0%,100%{rotate:0deg}50%{rotate:1.2deg}}' +
        `.ki{${FEET};animation:${a('surge', 0.16, 'ease-in-out', 'infinite alternate')}}` +
        '@keyframes surge{from{transform:scale(1.02,1.04);opacity:.85}to{transform:scale(1.08,1.16);opacity:1}}' +
        `.arc{opacity:0;animation:${a('zap', 0.5, 'linear', 'infinite')}}` +
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
        '@keyframes speed{0%,8%{opacity:0}12%{opacity:.8}24%{opacity:0}40%{opacity:0}44%{opacity:.8}56%,100%{opacity:0}}' +
        // tóc văng ngược chiều cú đấm, trễ 2 khung sau thân
        `.hair{${ROOT};animation:${a('whip', PUNCH_MS / 1000, 'ease-out', '.03s both')}}` +
        '@keyframes whip{0%,8%{transform:rotate(0)}14%{transform:rotate(-6deg) translateX(-3px)}28%{transform:rotate(1deg)}46%{transform:rotate(-7deg) translateX(-3px)}62%{transform:rotate(1.5deg)}80%,100%{transform:rotate(0)}}' +
        `.ki{${MID};animation:${a('flare', PUNCH_MS / 1000, 'ease-out', 'both')}}` +
        '@keyframes flare{0%,8%,30%,40%,64%,100%{transform:scale(1)}14%,46%{transform:scale(1.1)}}' +
        `.arc{opacity:0;animation:${a('zap', 0.4, 'linear', 'infinite')}}` +
        '@keyframes zap{0%,9%{opacity:0}10%,20%{opacity:1}21%,100%{opacity:0}}'
    case 'blast': {
      // gom chưởng ở tay (0-28%), bắn tia ra và rung (28-75%), tan (75-100%)
      const t = BLAST_MS / 1000
      return `.me{transform-origin:40px 86px;animation:${a('recoil', t, 'ease-out', 'both')}}` +
        '@keyframes recoil{0%{transform:translateX(2px)}28%{transform:translateX(4px) scale(1.04,.96)}34%{transform:translateX(-5px)}60%{transform:translateX(-2px)}100%{transform:translateX(0)}}' +
        `.orb{transform-origin:72px 52px;animation:${a('orb', t, 'ease-out', 'both')}}` +
        '@keyframes orb{0%{transform:scale(.2);opacity:.6}28%{transform:scale(1.5);opacity:1}40%{transform:scale(1)}80%{transform:scale(.9);opacity:.9}100%{transform:scale(.2);opacity:0}}' +
        `.beam{transform-origin:72px 52px;animation:${a('fire', t, 'cubic-bezier(.2,.8,.2,1)', 'both')}}` +
        '@keyframes fire{0%,28%{transform:scale(0,1);opacity:1}42%{transform:scale(1,1.2)}50%{transform:scale(1,.9)}58%{transform:scale(1,1.12)}75%{transform:scale(1,1);opacity:1}100%{transform:scale(1,.2);opacity:0}}' +
        `.flash{animation:${a('flash', t, 'ease-out', 'both')}}` +
        '@keyframes flash{0%,30%{opacity:0}34%{opacity:.45}50%,100%{opacity:0}}' +
        // lúc bắn: tóc hất ngược và dựng, hào quang phồng to rồi xẹp dần
        `.hair{${ROOT};animation:${a('blow', t, 'ease-out', 'both')}}` +
        '@keyframes blow{0%{transform:scale(1)}28%{transform:translateY(-3px) scale(1.04,1.1)}34%{transform:rotate(-8deg) translate(-4px,-3px) scale(1.04,1.12)}75%{transform:rotate(-5deg) translate(-3px,-2px) scale(1.03,1.08)}100%{transform:none}}' +
        `.ki{${FEET};animation:${a('boom', t, 'ease-out', 'both')}}` +
        '@keyframes boom{0%{transform:scale(1)}28%{transform:scale(1.1,1.16)}36%{transform:scale(1.18,1.24)}75%{transform:scale(1.08,1.12)}100%{transform:scale(1)}}' +
        `.arc{opacity:0;animation:${a('zap', 0.3, 'linear', 'infinite')}}` +
        '@keyframes zap{0%,9%{opacity:0}10%,25%{opacity:1}26%,100%{opacity:0}}'
    }
  }
}

const BOLTS = ['M14,20 L22,34 L16,36 L26,52', 'M66,16 L58,30 L65,32 L54,48', 'M8,58 L18,64 L12,68 L22,78']
// điện quanh người cho low / medium: các tia gấp khúc ôm sát viền (toạ độ dải 80 đơn vị)
const ARCS = ['M6,30 L12,38 L7,42 L14,50', 'M74,28 L68,36 L73,40 L66,48', 'M22,12 L28,20 L24,22 L31,28', 'M58,10 L52,18 L57,21 L50,27',
  'M4,62 L11,66 L6,71 L13,76', 'M76,60 L69,65 L74,69 L67,75']
const ROCKS = [[16, 0], [30, 0.5], [52, 0.25], [64, 0.8]]

// flip: lật ngang (Claude ở mép phải, chưởng và cú đấm hướng sang trái)
// x0: cắt bỏ phần trái của dải (lật thì đó là chỗ trống trước mặt), để khung chỉ ôm con Claude khi không bắn chưởng
export function petSvg(level: string, pose: Pose, fps = 24, flip = false, x0 = 0): string {
  const color = AURA[level] ?? '#D97757'
  const m = MASCOTS[level] ?? MASCOTS.low
  const parts: string[] = []
  if (pose === 'idle') parts.push('<ellipse class="aura" cx="40" cy="52" rx="40" ry="44" fill="url(#glow)"/>')
  if (ELECTRIC.includes(level) && pose !== 'sleep') {
    const tint = level === 'low' ? '#FFE680' : '#BFE8FF'
    parts.push(...ARCS.map((d, i) => `<g class="arc" style="animation-delay:-${(i * 0.37) % 1.6}s" fill="none" stroke-linejoin="round" stroke-linecap="round">` +
      `<path d="${d}" stroke="${tint}" stroke-width="3.2" opacity=".45"/><path d="${d}" stroke="#FFFFFF" stroke-width="1.2"/></g>`))
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
  const me = `<g class="me"><svg x="4" y="14" width="72" height="72" viewBox="0 0 224 224" overflow="visible">` +
    `<g class="ki">${m.aura}</g><g class="hair">${m.hair}</g><g class="bod">${m.body}</g></svg></g>`
  // Zzz không lật để chữ đọc xuôi: đặt ngoài nhóm lật, toạ độ tính lại
  const zzzOut = flip ? zzz.replace(/x="62"/g, 'x="300"') : zzz
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} -20 ${380 - x0} 106" width="${380 - x0}" height="106"><style>${css(pose, fps)} ${STILL}</style><defs>` +
    `<radialGradient id="glow"><stop offset="0" stop-color="${color}" stop-opacity=".9"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>` +
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
