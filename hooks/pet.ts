// Con Claude nhỏ ở góc phải dưới ô chat trên app desktop: nghỉ thì thở, đang làm thì gồng ki, ghi/sửa file xong thì bắn chưởng.
// Một dải SVG có CSS animation (Svg isInteractive mới chạy animation).
// fps: 60 mượt (giữ easing), 24 / 12 nhảy theo khung hình bằng steps() để đỡ tốn máy.
import { AURA, MASCOTS } from './scenes'

import type { Pose } from '../types'
export type { Pose }

export const FPS = [12, 24, 60]
export const BLAST_MS = 1800

const STILL = '@media (prefers-reduced-motion: reduce) { * { animation: none !important } }'

/** Một animation: ở 60 fps giữ easing, thấp hơn thì chia đều thành số khung = thời lượng × fps. */
function anim(fps: number, name: string, seconds: number, ease: string, rest = ''): string {
  const timing = fps >= 60 ? ease : `steps(${Math.max(2, Math.round(seconds * fps))}, jump-none)`
  return `${name} ${seconds}s ${timing} ${rest}`.trim()
}

function css(pose: Pose, fps: number): string {
  const a = (name: string, s: number, ease: string, rest?: string) => anim(fps, name, s, ease, rest)
  if (pose === 'idle') {
    return `.me{transform-origin:40px 80px;animation:${a('breathe', 3.6, 'ease-in-out', 'infinite')}}` +
      '@keyframes breathe{0%,100%{transform:translateY(0) scale(1,1)}45%,55%{transform:translateY(-1px) scale(1.015,1.045)}}' +
      `.aura{transform-origin:40px 50px;animation:${a('glow', 3.6, 'ease-in-out', 'infinite')}}` +
      '@keyframes glow{0%,100%{opacity:.16;transform:scale(.9)}50%{opacity:.3;transform:scale(1)}}'
  }
  if (pose === 'charge') {
    // ngồi thụp lấy đà rồi rung liên tục; hai lớp hào quang lệch nhịp; tia ki bay lên
    return `.me{transform-origin:40px 80px;animation:${a('crouch', 0.5, 'ease-out', 'both')},${a('shake', 0.12, 'linear', '.5s infinite')}}` +
      '@keyframes crouch{from{scale:1 1}to{scale:1.04 .96}}' +
      '@keyframes shake{0%,100%{translate:0 0}33%{translate:.7px -.5px}66%{translate:-.6px .4px}}' +
      `.aura{transform-origin:40px 52px;animation:${a('flare', 0.42, 'ease-in-out', 'infinite alternate')}}` +
      `.aura2{transform-origin:40px 52px;animation:${a('flare', 0.6, 'ease-in-out', '-.3s infinite alternate')}}` +
      '@keyframes flare{from{opacity:.4;transform:scale(.9,.95)}to{opacity:.95;transform:scale(1.12,1.22)}}' +
      `.spark{animation:${a('rise', 0.9, 'ease-in', 'infinite')}}` +
      '@keyframes rise{0%{transform:translateY(10px) scale(1);opacity:0}25%{opacity:1}100%{transform:translateY(-38px) scale(.4);opacity:0}}'
  }
  // blast: gom chưởng ở tay (0-28%), bắn tia ra và rung (28-75%), tan (75-100%)
  const t = BLAST_MS / 1000
  return `.me{transform-origin:40px 80px;animation:${a('recoil', t, 'ease-out', 'both')}}` +
    '@keyframes recoil{0%{transform:translateX(2px)}28%{transform:translateX(3px) scale(1.03,.97)}34%{transform:translateX(-4px)}60%{transform:translateX(-2px)}100%{transform:translateX(0)}}' +
    `.aura{transform-origin:40px 52px;animation:${a('burst', t, 'ease-out', 'both')}}` +
    '@keyframes burst{0%{opacity:.5;transform:scale(1)}30%{opacity:1;transform:scale(1.15)}100%{opacity:.3;transform:scale(.95)}}' +
    `.orb{transform-origin:68px 50px;animation:${a('orb', t, 'ease-out', 'both')}}` +
    '@keyframes orb{0%{transform:scale(.2);opacity:.6}28%{transform:scale(1.4);opacity:1}40%{transform:scale(1)}80%{transform:scale(.9);opacity:.9}100%{transform:scale(.2);opacity:0}}' +
    `.beam{transform-origin:68px 50px;animation:${a('fire', t, 'cubic-bezier(.2,.8,.2,1)', 'both')}}` +
    '@keyframes fire{0%,28%{transform:scale(0,1);opacity:1}42%{transform:scale(1,1.15)}50%{transform:scale(1,.9)}58%{transform:scale(1,1.1)}75%{transform:scale(1,1);opacity:1}100%{transform:scale(1,.2);opacity:0}}' +
    `.flash{animation:${a('flash', t, 'ease-out', 'both')}}` +
    '@keyframes flash{0%,30%{opacity:0}34%{opacity:.5}50%,100%{opacity:0}}'
}

// flip: lật ngang (Claude ở mép phải, chưởng bắn sang trái) cho chỗ góc phải dưới ô chat
export function petSvg(level: string, pose: Pose, fps = 24, flip = false): string {
  const color = AURA[level] ?? '#D97757'
  const body = MASCOTS[level] ?? MASCOTS.low
  const sparks = pose === 'charge'
    ? [[10, 0], [24, 0.35], [40, 0.15], [56, 0.55], [70, 0.25]].map(([x, d]) =>
      `<circle class="spark" style="animation-delay:-${d}s" cx="${x}" cy="72" r="1.8" fill="${color}"/>`).join('')
    : ''
  const blast = pose === 'blast'
    ? '<rect class="flash" width="380" height="96" rx="12" fill="#BFF3FF" opacity="0"/>' +
      '<g class="beam"><rect x="66" y="40" width="300" height="20" rx="10" fill="url(#beam)"/>' +
      '<rect x="66" y="46" width="300" height="8" rx="4" fill="url(#core)"/></g>' +
      '<g class="orb"><circle cx="68" cy="50" r="14" fill="url(#orbg)"/><circle cx="68" cy="50" r="6" fill="#fff"/></g>'
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 96" width="380" height="96"><style>${css(pose, fps)} ${STILL}</style><defs>` +
    `<radialGradient id="glow"><stop offset="0" stop-color="${color}" stop-opacity=".9"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>` +
    '<radialGradient id="orbg"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#9FE8FF"/><stop offset="1" stop-color="#4FB8FF" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="beam" x1="0" x2="1"><stop offset="0" stop-color="#9FE8FF"/><stop offset=".7" stop-color="#4FB8FF"/><stop offset="1" stop-color="#4FB8FF" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="core" x1="0" x2="1"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
    `<g${flip ? ' transform="translate(380 0) scale(-1 1)"' : ''}>` +
    '<ellipse class="aura" cx="40" cy="52" rx="40" ry="44" fill="url(#glow)"/>' +
    (pose === 'charge' ? '<ellipse class="aura2" cx="40" cy="50" rx="30" ry="40" fill="url(#glow)" opacity=".6"/>' : '') +
    `${sparks}${blast}<g class="me"><svg x="4" y="14" width="72" height="72" viewBox="0 0 224 224">${body}</svg></g></g></svg>`
}

/** Cảnh nền cũng có animation (ngọc nhấp nháy, hào quang thở): đổi easing theo fps như trên. */
export function sceneAtFps(svg: string, fps: number): string {
  if (fps >= 60) return svg
  return svg
    .replace('pulse 6s ease-in-out', `pulse 6s steps(${6 * fps}, jump-none)`)
    .replace('breathe 9s ease-in-out', `breathe 9s steps(${9 * fps}, jump-none)`)
}
