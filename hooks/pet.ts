// Con Claude cạnh ô chat trên app desktop: nghỉ thì thở, đang làm thì gồng ki, ghi/sửa file xong thì bắn một phát chưởng.
// Một dải SVG có CSS animation (Svg isInteractive mới chạy animation).
import { AURA, MASCOTS } from './scenes'

import type { Pose } from '../types'
export type { Pose }

const STILL = '@media (prefers-reduced-motion: reduce) { * { animation: none !important } }'
const CSS: Record<Pose, string> = {
  idle: '.me{transform-origin:40px 76px;animation:breathe 3.2s ease-in-out infinite}' +
    '@keyframes breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.03,1.06)}}' +
    '.aura{opacity:.25}',
  charge: '.me{animation:shake .12s linear infinite}' +
    '@keyframes shake{0%{transform:translate(0,0)}25%{transform:translate(.8px,-.6px)}50%{transform:translate(-.7px,.5px)}75%{transform:translate(.5px,.8px)}100%{transform:translate(0,0)}}' +
    '.aura{transform-origin:40px 48px;animation:flare .5s ease-in-out infinite alternate}' +
    '@keyframes flare{from{opacity:.45;transform:scale(.92)}to{opacity:.9;transform:scale(1.12)}}' +
    '.spark{animation:rise 1s linear infinite}@keyframes rise{from{transform:translateY(8px);opacity:0}30%{opacity:1}to{transform:translateY(-34px);opacity:0}}',
  blast: '.me{transform-origin:40px 76px;animation:push .25s ease-out both}@keyframes push{from{transform:translateX(0)}to{transform:translateX(-3px)}}' +
    '.aura{opacity:.8}' +
    '.beam{transform-origin:64px 48px;animation:fire 1.6s cubic-bezier(.2,.7,.2,1) both}' +
    '@keyframes fire{0%{transform:scaleX(0);opacity:1}35%{transform:scaleX(1);opacity:1}80%{transform:scaleX(1);opacity:.9}100%{transform:scaleX(1);opacity:0}}' +
    '.orb{animation:orb 1.6s ease-out both}@keyframes orb{0%{r:4}20%{r:13}80%{r:11;opacity:1}100%{r:2;opacity:0}}',
}

export function petSvg(level: string, pose: Pose): string {
  const color = AURA[level] ?? '#D97757'
  const body = MASCOTS[level] ?? MASCOTS.low
  const sparks = pose === 'charge'
    ? [12, 30, 52, 68].map((x, i) => `<circle class="spark" style="animation-delay:-${i * 0.25}s" cx="${x}" cy="70" r="1.6" fill="${color}"/>`).join('')
    : ''
  const beam = pose === 'blast'
    ? `<g class="beam"><rect x="64" y="40" width="300" height="16" rx="8" fill="url(#beam)"/><rect x="64" y="45" width="300" height="6" rx="3" fill="url(#core)"/></g>` +
      `<circle class="orb" cx="66" cy="48" r="10" fill="#E8FBFF"/>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 96" width="380" height="96"><style>${CSS[pose]} ${STILL}</style>` +
    `<defs><radialGradient id="glow"><stop offset="0" stop-color="${color}" stop-opacity=".9"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="beam" x1="0" x2="1"><stop offset="0" stop-color="#9FE8FF"/><stop offset=".7" stop-color="#4FB8FF"/><stop offset="1" stop-color="#4FB8FF" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="core" x1="0" x2="1"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>` +
    `<ellipse class="aura" cx="40" cy="48" rx="40" ry="44" fill="url(#glow)"/>${sparks}${beam}` +
    `<g class="me"><svg x="4" y="12" width="72" height="72" viewBox="0 0 256 256">${body}</svg></g></svg>`
}
