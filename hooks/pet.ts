// Con Claude ở mép phải ngay trên ô chat trên app desktop, theo kiểu Dragon Ball:
// Mỗi con tách 3 lớp (make_scenes.py): .ki viền hào quang, .hair tóc, .bod thân; mỗi lớp cử động riêng, tóc trễ nhịp sau thân.
// low / medium không có hào quang thật: quanh người có điện chớp (.arc) ở mọi dáng trừ ngủ.
//   idle  thở chậm · sleep  nghỉ lâu thì gục đầu ngủ, bay chữ Zzz · charge  gồng ki: tóc dựng, hào quang của chính con đó bốc cao và giật, sét (từ medium), đá bay
//   punch  dùng công cụ (đọc, chạy lệnh, tìm): đấm hai phát, nổ va chạm · blast  ghi/sửa file: gom chưởng rồi bắn
// Một dải SVG có CSS animation (Svg isInteractive mới chạy animation).
// fps: 60 mượt (giữ easing), 24 / 12 nhảy theo khung hình bằng steps() để đỡ tốn máy.
import { AURA, FX, KI, MASCOTS } from './scenes'

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
        `.arc{opacity:0;animation:${a('zap', 1.2, 'linear', 'infinite')}}` +
        '@keyframes zap{0%,6%{opacity:0}7%,20%{opacity:1}21%,100%{opacity:0}}' +
        `.aura{transform-origin:40px 52px;animation:${a('glow', 3.6, 'ease-in-out', 'infinite')}}` +
        '@keyframes glow{0%,100%{opacity:.14;transform:scale(.9)}50%{opacity:.28;transform:scale(1)}}'
    case 'sleep':
      return `.me{transform-origin:40px 86px;animation:${a('doze', 5, 'ease-in-out', 'infinite')}}` +
        '@keyframes doze{0%,100%{transform:translateY(3px) rotate(-7deg) scale(1,.97)}50%{transform:translateY(3px) rotate(-7deg) scale(1.01,1.01)}}' +
        `.hair{${ROOT};transform:rotate(-3deg) scale(1,.95)}.ki{opacity:.3}` +
        `.z{animation:${a('zzz', 3, 'ease-out', 'infinite')}}` +
        '@keyframes zzz{0%{transform:translate(0,0) scale(.6);opacity:0}20%{opacity:1}100%{transform:translate(18px,-30px) scale(1.3);opacity:0}}'
    case 'charge':
      // ngồi thụp lấy đà rồi rung; lửa ki hai lớp lệch nhịp bốc lên; sét chớp; đá dưới chân bay lên
      return `.me{transform-origin:40px 86px;animation:${a('crouch', 0.45, 'ease-out', 'both')},${a('shake', 0.1, 'linear', '.45s infinite')}}` +
        '@keyframes crouch{from{scale:1 1}to{scale:1.05 .95}}' +
        '@keyframes shake{0%,100%{translate:0 0}33%{translate:1px -.6px}66%{translate:-.8px .6px}}' +
        // tóc dựng lên rồi run, hào quang bốc cao và giật liên hồi
        `.hair{${ROOT};animation:${a('rise', 0.45, 'cubic-bezier(.34,1.56,.64,1)', 'both')},${a('tremble', 0.08, 'linear', '.45s infinite')}}` +
        '@keyframes rise{from{transform:translateY(0) scale(1)}to{transform:translateY(-4px) scale(1.03,1.1)}}' +
        '@keyframes tremble{0%,100%{rotate:0deg}50%{rotate:1.2deg}}' +
        // hào quang bung ra từ sau lưng (bật quá đà rồi về), sau đó cháy phập phồng liên hồi, gốc ở chân
        `.ki2{transform-origin:112px 190px;animation:${a('kiIn', 0.45, 'cubic-bezier(.34,1.56,.64,1)', 'both')},${a('kiBurn', 0.18, 'ease-in-out', '.45s infinite alternate')}}` +
        '@keyframes kiIn{from{transform:scale(.4);opacity:0}to{transform:scale(1.15,1.2);opacity:1}}' +
        '@keyframes kiBurn{from{scale:1 1}to{scale:1.04 1.09}}' +
        `.arc{opacity:0;animation:${a('zap', 0.5, 'linear', 'infinite')}}` +
        `.bolt{opacity:0;animation:${a('zap', 0.7, 'linear', 'infinite')}}` +
        '@keyframes zap{0%,9%{opacity:0}10%,16%{opacity:1}17%,100%{opacity:0}}' +
        `.rock{animation:${a('lift', 1.4, 'ease-out', 'infinite')}}` +
        '@keyframes lift{0%{transform:translateY(0) rotate(0);opacity:0}15%{opacity:1}100%{transform:translateY(-46px) rotate(160deg);opacity:0}}'
    case 'punch':
      // hai cú đấm thẳng về phía trước (lật thì sang trái), mỗi cú một vụ nổ va chạm và vệt tốc độ
      return `.me{transform-origin:40px 86px;animation:${a('jab', PUNCH_MS / 1000, 'cubic-bezier(.3,1.6,.4,1)', 'both')}}` +
        '@keyframes jab{0%{transform:translateX(0)}12%{transform:translateX(14px) scale(1.04,.97)}24%{transform:translateX(0)}44%{transform:translateX(16px) scale(1.05,.96)}58%,100%{transform:translateX(0)}}' +
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
        `.orb{animation:${a('orb', t, 'ease-out', 'both')}}` +
        '@keyframes orb{0%{transform:scale(.2);opacity:.6}28%{transform:scale(1.5);opacity:1}40%{transform:scale(1)}80%{transform:scale(.9);opacity:.9}100%{transform:scale(.2);opacity:0}}' +
        `.beam{animation:${a('fire', t, 'cubic-bezier(.2,.8,.2,1)', 'both')}}` +
        '@keyframes fire{0%,28%{transform:scale(0,1);opacity:1}42%{transform:scale(1,1.2)}50%{transform:scale(1,.9)}58%{transform:scale(1,1.12)}75%{transform:scale(1,1);opacity:1}100%{transform:scale(1,.2);opacity:0}}' +
        // lúc bắn: tóc hất ngược và dựng, hào quang phồng to rồi xẹp dần
        `.hair{${ROOT};animation:${a('blow', t, 'ease-out', 'both')}}` +
        '@keyframes blow{0%{transform:scale(1)}28%{transform:translateY(-3px) scale(1.04,1.1)}34%{transform:rotate(-8deg) translate(-4px,-3px) scale(1.04,1.12)}75%{transform:rotate(-5deg) translate(-3px,-2px) scale(1.03,1.08)}100%{transform:none}}' +
        `.ki2{transform-origin:112px 190px;animation:${a('boom', t, 'ease-out', 'both')}}` +
        '@keyframes boom{0%{transform:scale(1.15,1.2)}28%{transform:scale(1.25,1.32)}36%{transform:scale(1.35,1.42)}75%{transform:scale(1.2,1.26)}100%{transform:scale(1,1);opacity:.6}}' +
        `.arc{opacity:0;animation:${a('zap', 0.3, 'linear', 'infinite')}}` +
        '@keyframes zap{0%,9%{opacity:0}10%,25%{opacity:1}26%,100%{opacity:0}}'
    }
  }
}

type Sprite = { w: number; h: number; d: string }
/** Hình thứ i của một tấm hiệu ứng (các tấm sinh sẵn, chỉ số luôn có). */
const fx = (sheet: string, i: number): Sprite => FX[sheet]![i]!
/** Một hình hiệu ứng (art/fx) cao h đơn vị, góc trên trái ở (x, y); lớp bọc g để CSS xoay/phóng quanh chính nó. */
function sp(f: Sprite, x: number, y: number, h: number, cls: string, style = '', w = h * f.w / f.h): string {
  return `<g class="${cls}" style="transform-box:fill-box;transform-origin:center;${style}"><svg x="${x}" y="${y}" width="${w.toFixed(1)}" height="${h}" ` +
    `viewBox="0 0 ${f.w} ${f.h}" preserveAspectRatio="none">${f.d}</svg></g>`
}

// sét quanh người: [hình, x, y, cao, góc] trong dải 80 đơn vị (mascot nằm ở x 4-76, y 14-86)
const ARCS: [number, number, number, number, number][] = [[0, 0, 24, 28, -10], [2, 62, 20, 28, 12], [1, 14, 4, 24, -25], [3, 50, 2, 24, 20],
  [4, -2, 52, 24, 30], [5, 64, 50, 24, -30]]
const BOLTS: [number, number, number, number, number][] = [[1, 4, 10, 22, -15], [3, 60, 8, 22, 15], [5, 2, 54, 20, 25]]
// đá bay khi gồng: [hình, x, độ trễ]
const ROCKS: [number, number, number][] = [[1, 10, 0], [4, 24, 0.5], [2, 46, 0.25], [6, 60, 0.8], [0, 34, 1.05]]
// cú đấm: 4 khung (tia nhỏ, sao nổ, vụ nổ văng mảnh, vòng khói) x 2 cú, theo % thời lượng PUNCH_MS
const HITS: [number, number, number, number, number][] = [[8, 12, 18, 26, 38], [40, 44, 50, 58, 72]]

/** Keyframes cho khung thứ k của cú đấm: hiện bằng cách phóng to (không mờ dần), tắt bằng cách thu về 0. */
function hitFrame(k: number): string {
  const steps = HITS.flatMap(t => {
    const s = t[k]!, e = t[k + 1]!
    return k === 3
      ? [`${s - 0.1}%{transform:scale(0)}`, `${s}%{transform:scale(.8);opacity:1}`, `${e}%{transform:scale(1.35);opacity:0}`, `${e + 0.1}%{transform:scale(0)}`]
      : [`${s - 0.1}%{transform:scale(0)}`, `${s}%{transform:scale(.6)}`, `${(s + e) / 2}%{transform:scale(1.1)}`, `${e}%{transform:scale(1)}`, `${e + 0.1}%{transform:scale(0)}`]
  })
  return `@keyframes f${k}{0%{transform:scale(0)}${steps.join('')}100%{transform:scale(0)}}`
}

// flip: lật ngang (Claude ở mép phải, chưởng và cú đấm hướng sang trái)
// x0: cắt bỏ phần trái của dải (lật thì đó là chỗ trống trước mặt), để khung chỉ ôm con Claude khi không bắn chưởng
export function petSvg(level: string, pose: Pose, fps = 24, flip = false, x0 = 0): string {
  const color = AURA[level] ?? '#D97757'
  const m = MASCOTS[level] ?? MASCOTS.low!
  const a = (name: string, s: number, ease: string, rest?: string) => anim(fps, name, s, ease, rest)
  const parts: string[] = []
  let extra = ''
  if (pose === 'idle') parts.push('<ellipse class="aura" cx="40" cy="52" rx="40" ry="44" fill="url(#glow)"/>')
  if (ELECTRIC.includes(level) && pose !== 'sleep') {
    parts.push(...ARCS.map(([f, x, y, h, r], i) => sp(fx('bolts', f), x, y, h, 'arc', `animation-delay:-${(i * 0.41) % 1.2}s;rotate:${r}deg`)))
  }
  if (pose === 'charge') {
    if (SPARKY.includes(level)) {
      parts.push(...BOLTS.map(([f, x, y, h, r], i) => sp(fx('bolts', f), x, y, h, 'bolt', `animation-delay:-${i * 0.23}s;rotate:${r}deg`)))
    }
    parts.push(...ROCKS.map(([f, x, d]) => sp(fx('debris', f), x, 78, 9, 'rock', `animation-delay:-${d}s`)))
    // bụi bung ra hai bên chân lúc ngồi thụp lấy đà
    parts.push(...([[-6, -1], [6, -1], [62, 1], [74, 1]] as const).map(([x, dir], i) =>
      sp(fx('debris', 8 + i), x, 78, 9, 'dust', `--dx:${dir * 8}px`)))
    extra += `.dust{animation:${a('dust', 0.9, 'cubic-bezier(.16,1,.3,1)', 'both')}}` +
      '@keyframes dust{0%{transform:scale(0)}18%{transform:translateX(calc(var(--dx)*.4)) scale(1.1)}100%{transform:translate(var(--dx),-3px) scale(0)}}'
  }
  if (pose === 'punch') {
    parts.push('<g class="speed" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".8"><path d="M78,40 H104"/><path d="M80,52 H112"/><path d="M78,64 H100"/></g>')
    parts.push(...[16, 26, 30, 34].map((h, k) => sp(fx('impact', k), 101 - h * fx('impact', k).w / fx('impact', k).h / 2, 50 - h / 2, h, `f f${k}`)))
    extra += [0, 1, 2, 3].map(k => `.f${k}{animation:${a(`f${k}`, PUNCH_MS / 1000, 'linear', 'both')}}${hitFrame(k)}`).join('')
  }
  if (pose === 'blast') {
    parts.push(sp(fx('beam', 1), 64, 38, 28, 'beam', 'transform-origin:left center', 310),
      sp(fx('beam', 0), 56, 35, 34, 'orb'))
  }
  if (pose === 'sleep') {
    // bong bóng ngủ phồng xẹp theo nhịp thở ở mũi
    parts.push(sp(fx('sleep', 3), 60, 40, 18, 'bubble'))
    extra += `.bubble{animation:${a('bubble', 5, 'ease-in-out', 'infinite')}}` +
      '@keyframes bubble{0%,100%{transform:scale(.35)}50%{transform:scale(1)}92%{transform:scale(1.15)}94%{transform:scale(0)}}'
  }
  const zzz = pose === 'sleep'
    ? ([[0, 11, 0], [1, 15, 1], [2, 19, 2]] as const).map(([f, h, d]) => {
      const w = h * fx('sleep', f).w / fx('sleep', f).h
      return sp(fx('sleep', f), flip ? 380 - 60 - w : 60, 0, h, 'z', `animation-delay:-${d}s;opacity:0`)
    }).join('')
    : ''
  // gồng ki và bắn chưởng: thay viền hào quang có sẵn bằng hào quang vẽ riêng (art/fx/aura-*.png), bung to sau lưng
  const powered = pose === 'charge' || pose === 'blast'
  const ki = powered
    ? `<g class="ki2"><svg width="224" height="224" viewBox="0 0 160 160" overflow="visible">${KI[level] ?? KI.low}</svg></g>`
    : `<g class="ki">${m.aura}</g>`
  const me = `<g class="me"><svg x="4" y="14" width="72" height="72" viewBox="0 0 224 224" overflow="visible">` +
    `${ki}<g class="hair">${m.hair}</g><g class="bod">${m.body}</g></svg></g>`
  // Zzz không lật để chữ đọc xuôi: đặt ngoài nhóm lật
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} -20 ${380 - x0} 106" width="${380 - x0}" height="106"><style>${css(pose, fps)}${extra} ${STILL}</style><defs>` +
    `<radialGradient id="glow"><stop offset="0" stop-color="${color}" stop-opacity=".9"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs>` +
    `<g${flip ? ' transform="translate(380 0) scale(-1 1)"' : ''}>${parts.join('')}${me}</g>${zzz}</svg>`
}

/** Cảnh nền cũng có animation (ngọc nhấp nháy, hào quang thở): đổi easing theo fps như trên. */
export function sceneAtFps(svg: string, fps: number): string {
  if (fps >= 60) return svg
  return svg
    .replace('pulse 6s ease-in-out', `pulse 6s steps(${6 * fps}, jump-none)`)
    .replace('breathe 9s ease-in-out', `breathe 9s steps(${9 * fps}, jump-none)`)
}
