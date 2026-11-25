// Claude Dragonball cho app desktop: cảnh nền đen, 7 viên ngọc rồng, Claude biến hình theo mức effort của lượt.
// /dragonball: bật lại theo effort · /dragonball fps 12|24|60: tốc độ khung hình · /dragonball <low|medium|high|xhigh|max|ultracode>: giữ một mức,
// đổi luôn bảng màu (app: colors của theme; terminal: theme themes/dragonball-<mức>.json) · /dragonball off: tắt.
// Cách đặt nền theo plugin mẫu theme-examples của Anthropic: thử theme.set (mới) rồi ui.backdrop (cũ), engine thiếu thì thôi.
import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import { BLAST_MS, FPS, PUNCH_MS, petSvg, sceneAtFps } from './pet'
import type { Pose } from '../types'
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

type Answer = { isDrawn: boolean }
type AnyEngine = {
  theme?: { set(args: unknown): Promise<Answer>; clear(): Promise<unknown> }
  ui: { toast(text: string): unknown; backdrop?(args: unknown): Promise<Answer> }
}

// con pet cạnh ô chat: dáng (thở / ngủ / gồng ki / đấm / bắn chưởng) và mức effort để chọn con Claude nào
const pose = atom({ plugin: 'dragonball', key: 'pose' } as const, 'idle' as Pose)
const level = atom({ plugin: 'dragonball', key: 'level' } as const, 'low')
// công cụ ghi file: xong một cái là bắn chưởng
const WRITES = ['Write', 'Edit', 'MultiEdit', 'NotebookEdit']
// nghỉ quá lâu thì ngủ
const SLEEP_AFTER_MS = 90_000
// mỗi lần nghỉ một số mới: hẹn giờ ngủ của lần nghỉ cũ thấy số khác thì thôi
let restId = 0
const ALT: Record<string, string> = {
  idle: 'resting', sleep: 'asleep', charge: 'charging ki', punch: 'punching', blast: 'firing a beam',
}
// $.store 'fps': 12 / 24 / 60 khung hình mỗi giây cho mọi animation, mặc định 24
const FPS_KEY = 'fps'
// con pet ở mép phải (mặc định, chưởng bắn sang trái) hay mép trái (lật lại, chưởng bắn sang phải)
const SIDE_KEY = 'side'
// /dragonball app off: tắt nền và con pet trên app desktop của máy này, theme terminal vẫn giữ
const APP_KEY = 'app'
const DEFAULT_FPS = 24

async function fpsOf($: { store: { get(key: string): Promise<unknown> } }): Promise<number> {
  const fps = await $.store.get(FPS_KEY)
  return typeof fps === 'number' && FPS.includes(fps) ? fps : DEFAULT_FPS
}

// cảnh đang hiện; biến của module, nạp lại thì đặt lại từ đầu
let shown: string | undefined

function mix(a: string, b: string, t: number): string {
  const rgb = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16))
  const x = rgb(a), y = rgb(b)
  return '#' + x.map((v, i) => Math.round(v + (y[i]! - v) * t).toString(16).padStart(2, '0')).join('')
}

// bảng màu app của mỗi cảnh: màu nhấn = màu hào quang của mức (cảnh gốc: cam Claude), nền đen ám chút màu ấy; chỉ chế độ tối
const palettes = new Map<string, unknown>()
function colorsFor(scene: string): unknown {
  let colors = palettes.get(scene)
  if (colors === undefined) {
    const c = AURA[scene.replace(/^dragonball-?/, '')] ?? '#D97757'
    colors = makeColors({
      label: 'Claude Dragonball', only: 'dark',
      roles: { accent: c, danger: '#E06C5A', success: '#9DB57A', warning: '#F2C230', pro: '#C792B8' },
      dark: { gray: { anchors: {
        'surface-0': mix('#0E0E0E', c, 0.03), 'surface-1': mix('#161514', c, 0.05), 'surface-2': mix('#1C1A19', c, 0.06),
        'surface-3': mix('#232120', c, 0.07), 'text-primary': '#E8E6E3', 'text-secondary': mix('#C9C4BE', c, 0.08),
        'text-muted': mix('#A39C94', c, 0.1),
      } } },
    }).theme
    palettes.set(scene, colors)
  }
  return colors
}

function isMissing(error: unknown): boolean {
  return error instanceof TypeError || (error instanceof Error && error.message.includes('does not know the attribute'))
}

async function setScene($: AnyEngine, scene: string): Promise<Answer> {
  if (shown === scene) return { isDrawn: true }
  const look = { backdrop: { scene, id: scene, glass: GLASS }, overrideColorScheme: 'dark' }
  try {
    const set = await $.theme!.set({ ...look, colors: colorsFor(scene) })
    shown = scene
    return set
  } catch (error) {
    if (!isMissing(error)) throw error
  }
  // engine cũ chưa nhận colors: chỉ đặt nền
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

// Nền, bảng màu app và con pet chỉ có trên app desktop. Một phiên CLI (terminal) cũng chạy plugin này: nếu nó đặt cảnh,
// nền của app đổi theo effort của phiên CLI. Nên chỉ phiên đang vẽ trên app mới đặt cảnh.
async function inApp($: { session: { surfaces(): Promise<readonly string[]> }; store: { get(key: string): Promise<unknown> } }): Promise<boolean> {
  return (await $.session.surfaces()).includes('desktop') && (await $.store.get(APP_KEY)) !== 'off'
}

function sceneFor(level: unknown): string {
  return typeof level === 'string' && LEVELS.includes(level) ? `dragonball-${level}` : 'dragonball'
}

type Themed = {
  settings: { read(args: { key: 'theme' }): Promise<unknown> }
  config: { set(args: { key: string; value: string }): Promise<{ deny?: string }> }
}

// Theme terminal (settings.json "theme", chung cho CLI và app): /dragonball <mức> chọn theme của mức đó; /dragonball
// và /dragonball off trả về theme gốc, nhưng chỉ khi đang dùng theme của một mức (theme người dùng tự chọn thì để nguyên).
async function setCliTheme($: Themed, level: string | undefined): Promise<string> {
  const want = level === undefined ? CLI_THEME : `${CLI_THEME}-${level}`
  try {
    const now = await $.settings.read({ key: 'theme' })
    if (now === want) return ''
    if (level === undefined && !(typeof now === 'string' && now.startsWith(`${CLI_THEME}-`))) return ''
    const { deny } = await $.config.set({ key: 'theme', value: want })
    return deny === undefined ? ` Theme: ${want}.` : ` Theme not changed: ${deny}`
  } catch (error) {
    return ` Theme not changed: ${String(error)}`
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    try {
      await $.command.register({ name: COMMAND, description: 'Dragon-ball backdrop + pet: off, a level to pin, nothing to follow effort, or fps 12|24|60.' })
    } catch (error) {
      void $.ui.toast(`dragonball: /${COMMAND} is not available (${String(error)})`)
    }
    const mode = await $.store.get(MODE_KEY)
    if (mode !== 'off' && await inApp($)) {
      try {
        await setScene($, sceneFor(mode))
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
        await setScene($, sceneFor(mode))
      } catch {
        // như trên
      }
    }
    return next(e)
  })

  // đầu mỗi lượt đặt lại cảnh: app bỏ qua cảnh đặt trước khi cửa sổ gắn vào phiên (phiên mới, sau /clear)
  on('prompt.submit', async ($, e, next) => {
    // hook này chặn được lượt gửi: lỗi của nền / pet không được làm hỏng tin nhắn
    await (async () => {
      restId += 1
      await update($, pose, () => 'charge')
      const mode = await $.store.get(MODE_KEY)
      if (mode === 'off' || !await inApp($)) return
      shown = undefined
      await setScene($, sceneFor(mode))
    })().catch(() => undefined)
    return next(e)
  })

  // mỗi lần gửi model một yêu cầu: đổi cảnh theo effort của lượt, trừ khi đã tắt hoặc giữ một mức
  on('turn.step', async function* ($, e, next) {
    if (typeof e.effort === 'string') await update($, level, () => e.effort as string)
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

  // ghi/sửa file: bắn chưởng; công cụ khác (đọc, chạy lệnh, tìm...): đấm hai phát; xong thì về gồng ki
  on('tool.call', async ($, e, next) => {
    const result = await next(e)
    // chỉ là hoạt hình: lỗi ở đây không được đổi kết quả của công cụ
    await (async () => {
      const hit: Pose = WRITES.includes(e.tool) ? 'blast' : 'punch'
      if (hit === 'punch' && await read($, pose) === 'blast') return  // đang bắn chưởng thì không cắt ngang
      await update($, pose, () => hit)
      void $.clock.sleep(hit === 'blast' ? BLAST_MS : PUNCH_MS)
        .then(() => update($, pose, now => (now === hit ? 'charge' : now)))
        .catch(() => undefined)
    })().catch(() => undefined)
    return result
  })

  on('turn.complete', async ($, e, next) => {
    await update($, pose, () => 'idle')
    const mine = ++restId
    void (async () => {
      await $.clock.sleep(SLEEP_AFTER_MS)
      if (mine === restId) await update($, pose, now => (now === 'idle' ? 'sleep' : now))
    })()
    return next(e)
  })

  // Claude nhỏ ở mép phải ngay trên ô chat (chưởng bắn sang trái). App không vẽ cây của plugin ở dòng dưới ô chat
  // (chỗ SessionMode) khi không có nhãn chế độ nào, nên dùng dải AbovePrompt và dồn sang phải.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || e.surface !== 'desktop') return next(e)
    const mode = await $.store.get(MODE_KEY)
    if (mode === 'off') return next(e)
    const shownLevel = typeof mode === 'string' && LEVELS.includes(mode) ? mode : await read($, level)
    const now = await read($, pose)
    const left = (await $.store.get(SIDE_KEY)) === 'left'
    if ((await $.store.get(APP_KEY)) === 'off') return next(e)
    const { Box, Svg } = $.ui.resolve(e)
    // app tự bọc dải này trong một thẻ xám rộng bằng ô chat và cắt phần tràn ra ngoài (lề âm hay khung hẹp đều bị cắt), nên giữ khung đầy đủ, dồn phải
    return (
      <Box flexDirection="row" justifyContent={left ? 'flex-start' : 'flex-end'}>
        <Svg isInteractive key={now} width={634} height={177} alt={`Claude ${ALT[now]}`} source={petSvg(shownLevel, now, await fpsOf($), !left)} />
      </Box>
    )
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const word = e.args.trim().toLowerCase()
    const fps = /^fps\s+(\d+)$/.exec(word)
    if (fps !== null) {
      const n = Number(fps[1])
      if (!FPS.includes(n)) return { text: `fps is one of ${FPS.join(', ')}.` }
      await $.store.set(FPS_KEY, n)
      return { text: `Dragon-ball animations at ${n} fps.` }
    }
    if (word === 'left' || word === 'right') {
      await $.store.set(SIDE_KEY, word)
      return { text: `Pet on the ${word} in the desktop app; it moves on the next turn.` }
    }
    if (word === 'app off' || word === 'app on') {
      if (word === 'app off' && await inApp($)) await clearScene($)
      if (word === 'app off') await $.store.set(APP_KEY, 'off')
      else await $.store.delete(APP_KEY)
      return { text: word === 'app off' ? 'Desktop app: backdrop and pet off on this machine; the terminal theme stays. /dragonball app on brings them back.' : 'Desktop app: backdrop and pet back on.' }
    }
    if (word === 'off') {
      await $.store.set(MODE_KEY, 'off')
      if (await inApp($)) await clearScene($)
      return { text: `Dragon-ball backdrop off. /dragonball turns it back on.${await setCliTheme($, undefined)}` }
    }
    if (word !== '' && !LEVELS.includes(word)) {
      return { text: `Unknown "${word}". Use off, left, right, app off|on, fps 12|24|60, nothing, or one of: ${LEVELS.join(', ')}.` }
    }
    if (word === '') await $.store.delete(MODE_KEY)
    else await $.store.set(MODE_KEY, word)
    const theme = await setCliTheme($, word || undefined)
    if (!await inApp($)) return { text: `Saved. The backdrop and pet show in the Claude desktop app.${theme}` }
    shown = undefined
    const set = await setScene($, sceneFor(word || undefined))
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
