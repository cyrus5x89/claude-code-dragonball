// Claude Dragonball cho app desktop: cảnh nền đen, 7 viên ngọc rồng, Claude biến hình theo mức effort của lượt.
// /dragonball: bật lại theo effort · /dragonball fps 12|24|60: tốc độ khung hình · /dragonball <low|medium|high|xhigh|max|ultracode>: giữ một mức,
// đổi luôn bảng màu (app: colors của theme; terminal: theme themes/dragonball-<mức>.json) · /dragonball off: tắt.
// Cách đặt nền theo plugin mẫu theme-examples của Anthropic: thử theme.set (mới) rồi ui.backdrop (cũ), engine thiếu thì thôi.
import type { Register } from 'claude-code'

import { FPS, sceneAtFps } from './fps'
import { makeColors } from './make-colors.js'
import { AURA, SCENES } from './scenes'

const PLUGIN = 'dragonball'
const COMMAND = 'dragonball'
const LEVELS = ['low', 'medium', 'high', 'xhigh', 'max', 'ultracode']
const GLASS = { blur: 10, tint: '#0E0E0E', opacity: 0.35 }
// theme terminal của plugin (themes/*.json): Claude Code gọi chúng là custom:<plugin>:<tên file>
const CLI_THEME = 'custom:dragonball:dragonball'
// $.store: 'off' tắt hẳn, một mức effort là giữ cố định, không có là đi theo effort
const MODE_KEY = 'mode'
// $.store: theme terminal người dùng đang dùng trước khi /dragonball <mức> thay nó, để /dragonball (off) trả lại đúng cái đó
const BEFORE_KEY = 'theme-before'

type Answer = { isDrawn: boolean }
type AnyEngine = {
  theme?: { set(args: unknown): Promise<Answer>; clear(): Promise<unknown> }
  ui: { toast(text: string): unknown; backdrop?(args: unknown): Promise<Answer> }
}

// $.store 'fps': 12 / 24 / 60 khung hình mỗi giây cho mọi animation, mặc định 24
const FPS_KEY = 'fps'
// /dragonball app off: tắt nền và bảng màu trên app desktop của máy này, theme terminal vẫn giữ
const APP_KEY = 'app'
const DEFAULT_FPS = 24

async function fpsOf($: { store: { get(key: string): Promise<unknown> } }): Promise<number> {
  const fps = await $.store.get(FPS_KEY)
  return typeof fps === 'number' && FPS.includes(fps) ? fps : DEFAULT_FPS
}

// cảnh đang hiện; biến của module, nạp lại thì đặt lại từ đầu
let shown: string | undefined
// mức effort của lượt gần nhất mà turn.step thấy (biến của module như trên); chưa có lượt nào thì dùng cảnh gốc
let lastEffort: string | undefined

// cảnh khi đi theo effort: mức đang giữ, hoặc mức của lượt gần nhất, hoặc cảnh gốc khi chưa có lượt nào
function followScene(mode: unknown): string {
  return sceneFor(typeof mode === 'string' ? mode : lastEffort)
}

// hook Backdrop đọc fps và APP_KEY từ $.store, mà ghi store không làm vẽ lại: bảo engine vẽ lại ngay (engine cũ không có hay lỗi thì thôi)
function redraw($: { ui: { invalidate(event: 'ui.render'): void } }): void {
  try {
    $.ui.invalidate('ui.render')
  } catch {
    // chỉ là vẽ lại sớm: cài đặt đã ghi, lượt sau vẫn vẽ lại
  }
}

function mix(a: string, b: string, t: number): string {
  const rgb = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16))
  const x = rgb(a), y = rgb(b)
  return '#' + x.map((v, i) => Math.round(v + (y[i]! - v) * t).toString(16).padStart(2, '0')).join('')
}

// bảng màu app của mỗi cảnh: màu nhấn = màu hào quang của mức (cảnh gốc: cam Claude), nền đen ám chút màu ấy; chỉ chế độ tối.
// makeColors kê độ tương phản trong problems: dòng "Desktop won't paint this theme" là app bỏ cả theme, nên khi có dòng đó
// thì không gửi colors (chỉ đặt nền); các dòng khác dưới chuẩn riêng của design system nhưng app vẫn vẽ (look.md).
const palettes = new Map<string, unknown>()
function colorsFor(scene: string): unknown {
  if (palettes.has(scene)) return palettes.get(scene)
  {
    const c = AURA[scene.replace(/^dragonball-?/, '')] ?? '#D97757'
    const made = makeColors({
      label: 'Claude Dragonball', only: 'dark',
      roles: { accent: c, danger: '#E06C5A', success: '#9DB57A', warning: '#F2C230', pro: '#C792B8' },
      dark: { gray: { anchors: {
        'surface-0': mix('#0E0E0E', c, 0.03), 'surface-1': mix('#161514', c, 0.05), 'surface-2': mix('#1C1A19', c, 0.06),
        'surface-3': mix('#232120', c, 0.07), 'text-primary': '#E8E6E3', 'text-secondary': mix('#C9C4BE', c, 0.08),
        'text-muted': mix('#A39C94', c, 0.1),
      } } },
    })
    const refused = made.problems.some((p: string) => p.startsWith("Desktop won't paint"))
    palettes.set(scene, refused ? undefined : made.theme)
  }
  return palettes.get(scene)
}

function isMissing(error: unknown): boolean {
  return error instanceof TypeError || (error instanceof Error && error.message.includes('does not know the attribute'))
}

async function setScene($: AnyEngine, scene: string): Promise<Answer> {
  if (shown === scene) return { isDrawn: true }
  const look = { backdrop: { scene, id: scene, glass: GLASS }, overrideColorScheme: 'dark' }
  const colors = colorsFor(scene)
  if (colors !== undefined) {
    try {
      const set = await $.theme!.set({ ...look, colors })
      shown = scene
      return set
    } catch {
      // colors là phần thêm: engine cũ không biết nó, hoặc app từ chối bảng màu, thì vẫn đặt nền như trước
    }
  }
  // chỉ đặt nền
  try {
    const set = await $.theme!.set(look)
    shown = scene
    return set
  } catch (error) {
    if (!isMissing(error)) throw error
  }
  try {
    const set = await $.ui.backdrop!({ id: scene, glass: GLASS })
    shown = scene
    return set
  } catch (error) {
    if (!isMissing(error)) throw error
  }
  return { isDrawn: false }
}

async function clearScene($: AnyEngine): Promise<void> {
  shown = undefined
  try {
    await $.theme!.clear()
    return
  } catch (error) {
    if (!isMissing(error)) throw error
  }
  try {
    await $.ui.backdrop!(undefined)
  } catch (error) {
    if (!isMissing(error)) throw error
  }
}

// Nền và bảng màu app chỉ có trên app desktop. Một phiên CLI (terminal) cũng chạy plugin này: nếu nó đặt cảnh,
// nền của app đổi theo effort của phiên CLI. Nên chỉ phiên đang vẽ trên app mới đặt cảnh.
async function inApp($: { session: { surfaces(): Promise<readonly string[]> }; store: { get(key: string): Promise<unknown> } }): Promise<boolean> {
  return (await $.session.surfaces()).includes('desktop') && (await $.store.get(APP_KEY)) !== 'off'
}

function sceneFor(level: unknown): string {
  return typeof level === 'string' && LEVELS.includes(level) ? `dragonball-${level}` : 'dragonball'
}

type Themed = {
  store: { get(key: string): Promise<unknown>; set(key: string, value: string): Promise<unknown>; delete(key: string): Promise<unknown> }
  config: {
    list(): Promise<readonly { key: string; value: unknown; options?: readonly string[] }[]>
    set(args: { key: string; value: string }): Promise<{ deny?: string }>
  }
}

// Theme terminal (hàng "theme" của /config, chung cho CLI và app): /dragonball <mức> chọn theme của mức đó và nhớ theme
// đang dùng trước đó; /dragonball và /dragonball off trả lại đúng theme ấy, nhưng chỉ khi đang dùng theme của một mức
// (theme người dùng tự chọn sau đó thì để nguyên). Theme của mức chưa có trong danh sách theme thì báo, không ghi bừa.
async function setCliTheme($: Themed, level: string | undefined): Promise<string> {
  try {
    const row = (await $.config.list()).find(r => r.key === 'theme')
    if (row === undefined) return ''
    const now = row.value
    const onLevel = typeof now === 'string' && now.startsWith(`${CLI_THEME}-`)
    let target: string
    if (level === undefined) {
      if (!onLevel) return ''
      const before = await $.store.get(BEFORE_KEY)
      target = typeof before === 'string' ? before : CLI_THEME
    } else {
      target = `${CLI_THEME}-${level}`
      if (now === target) return ''
      if (row.options !== undefined && !row.options.includes(target)) return ` Theme not changed: ${target} is not an installed theme.`
      if (!onLevel && typeof now === 'string') await $.store.set(BEFORE_KEY, now)
    }
    const { deny } = await $.config.set({ key: 'theme', value: target })
    if (deny !== undefined) return ` Theme not changed: ${deny}`
    if (level === undefined) await $.store.delete(BEFORE_KEY)
    return ` Theme: ${target}.`
  } catch (error) {
    return ` Theme not changed: ${String(error)}`
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    try {
      await $.command.register({ name: COMMAND, description: 'Dragon-ball backdrop: off, a level to pin, nothing to follow effort, app off|on, or fps 12|24|60.' })
    } catch (error) {
      void $.ui.toast(`dragonball: /${COMMAND} is not available (${String(error)})`)
    }
    const mode = await $.store.get(MODE_KEY)
    if (mode !== 'off' && await inApp($)) {
      try {
        await setScene($, followScene(mode))
      } catch {
        // nền là phần phụ: lỗi không được chặn phiên
      }
    }
    return next(e)
  })

  // cửa sổ app gắn vào phiên sau khi phiên đã chạy: đặt cảnh lúc đó
  on('session.attach', { surface: 'desktop' }, async ($, e, next) => {
    const mode = await $.store.get(MODE_KEY)
    if (mode !== 'off' && (await $.store.get(APP_KEY)) !== 'off') {
      shown = undefined
      try {
        await setScene($, followScene(mode))
      } catch {
        // như trên
      }
    }
    return next(e)
  })

  // đầu mỗi lượt đặt lại cảnh: app bỏ qua cảnh đặt trước khi cửa sổ gắn vào phiên (phiên mới, sau /clear)
  on('prompt.submit', async ($, e, next) => {
    // hook này chặn được lượt gửi: lỗi của nền không được làm hỏng tin nhắn
    await (async () => {
      const mode = await $.store.get(MODE_KEY)
      if (mode === 'off' || !await inApp($)) return
      shown = undefined
      await setScene($, followScene(mode))
    })().catch(() => undefined)
    return next(e)
  })

  // mỗi lần gửi model một yêu cầu: đổi cảnh theo effort của lượt, trừ khi đã tắt hoặc giữ một mức
  on('turn.step', async function* ($, e, next) {
    if (typeof e.effort === 'string') lastEffort = e.effort
    const mode = await $.store.get(MODE_KEY)
    if (mode === undefined && await inApp($)) {
      try {
        await setScene($, sceneFor(e.effort))
      } catch {
        // như trên
      }
    }
    return yield* next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const word = e.args.trim().toLowerCase()
    const fps = /^fps\s+(\d+)$/.exec(word)
    if (fps !== null) {
      const n = Number(fps[1])
      if (!FPS.includes(n)) return { text: `fps is one of ${FPS.join(', ')}.` }
      await $.store.set(FPS_KEY, n)
      redraw($)
      return { text: `Dragon-ball animations at ${n} fps.` }
    }
    if (word === 'app off' || word === 'app on') {
      // cài đặt theo máy: các phiên khác đọc được ngay nhưng chỉ vẽ lại ở tin nhắn sau của chúng
      const others = ' Other open windows follow on their next message.'
      if (word === 'app off') {
        // ghi cài đặt trước, để lỗi khi xoá nền không làm mất nó
        await $.store.set(APP_KEY, 'off')
        redraw($)
        let failed = ''
        if ((await $.session.surfaces()).includes('desktop')) {
          try {
            await clearScene($)
          } catch (error) {
            failed = ` The backdrop could not be cleared: ${String(error)}`
          }
        }
        return { text: `Desktop app: backdrop off on this machine; the terminal theme stays. /dragonball app on brings them back.${others}${failed}` }
      }
      await $.store.delete(APP_KEY)
      redraw($)
      const mode = await $.store.get(MODE_KEY)
      if (mode === 'off') return { text: 'Desktop app: on again, but the backdrop stays off until /dragonball or /dragonball <level>.' }
      if (!await inApp($)) return { text: `Desktop app: backdrop back on.${others}` }
      // vẽ lại ngay nền + bảng màu app, không đợi lượt sau (cảnh đã nhớ có thể cũ: app off từ phiên khác)
      shown = undefined
      try {
        const set = await setScene($, followScene(mode))
        return { text: (set.isDrawn ? 'Desktop app: backdrop back on.' : 'Desktop app: back on. This window may not draw backdrops yet.') + others }
      } catch (error) {
        return { text: `Desktop app: back on, but the backdrop failed: ${String(error)}.${others}` }
      }
    }
    if (word === 'off') {
      await $.store.set(MODE_KEY, 'off')
      if (await inApp($)) await clearScene($)
      return { text: `Dragon-ball backdrop off. /dragonball turns it back on.${await setCliTheme($, undefined)}` }
    }
    if (word !== '' && !LEVELS.includes(word)) {
      return { text: `Unknown "${word}". Use off, app off|on, fps 12|24|60, nothing, or one of: ${LEVELS.join(', ')}.` }
    }
    if (word === '') await $.store.delete(MODE_KEY)
    else await $.store.set(MODE_KEY, word)
    const theme = await setCliTheme($, word || undefined)
    if (!await inApp($)) {
      const appOff = (await $.session.surfaces()).includes('desktop') && (await $.store.get(APP_KEY)) === 'off'
      return { text: (appOff ? 'Saved. The desktop app is off on this machine: /dragonball app on shows the backdrop.' : 'Saved. The backdrop show in the Claude desktop app.') + theme }
    }
    shown = undefined
    const set = await setScene($, followScene(word || undefined))
    const said = word === '' ? 'Dragon-ball backdrop follows the effort level.' : `Dragon-ball backdrop and colours pinned to ${word}.`
    return { text: (set.isDrawn ? said : `${said} This window may not draw backdrops yet.`) + theme }
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.props.plugin !== PLUGIN || e.surface !== 'desktop' || (await $.store.get(APP_KEY)) === 'off') return next(e)
    const props = e.props as { scene?: unknown; id?: unknown }
    const name = typeof props.scene === 'string' ? props.scene : typeof props.id === 'string' ? props.id : undefined
    const source = name === undefined ? undefined : SCENES[name]
    if (source === undefined) return next(e)
    const { Svg } = $.ui.resolve(e)
    return <Svg isInteractive alt="Claude powering up among seven dragon balls" source={sceneAtFps(source, await fpsOf($))} />
  })
}
