// Claude Dragonball cho app desktop: cảnh nền đen, 7 viên ngọc rồng, Claude biến hình theo mức effort của lượt.
// /dragonball: bật lại theo effort · /dragonball fps 12|24|60: tốc độ khung hình · /dragonball <low|medium|high|xhigh|max|ultracode>: giữ một mức · /dragonball off: tắt.
// Cách đặt nền theo plugin mẫu theme-examples của Anthropic: thử theme.set (mới) rồi ui.backdrop (cũ), engine thiếu thì thôi.
import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import { BLAST_MS, FPS, PUNCH_MS, petSvg, sceneAtFps } from './pet'
import type { Pose } from '../types'
import { SCENES } from './scenes'

const PLUGIN = 'dragonball'
const COMMAND = 'dragonball'
const LEVELS = ['low', 'medium', 'high', 'xhigh', 'max', 'ultracode']
const GLASS = { blur: 10, tint: '#0E0E0E', opacity: 0.35 }
// $.store: 'off' tắt hẳn, một mức effort là giữ cố định, không có là đi theo effort
const MODE_KEY = 'mode'

type Answer = { isDrawn: boolean }
type AnyEngine = {
  theme?: { set(args: unknown): Promise<Answer>; clear(): Promise<unknown> }
  ui: { toast(text: string): Promise<unknown>; backdrop?(args: unknown): Promise<Answer> }
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
const DEFAULT_FPS = 24

async function fpsOf($: { store: { get(key: string): Promise<unknown> } }): Promise<number> {
  const fps = await $.store.get(FPS_KEY)
  return typeof fps === 'number' && FPS.includes(fps) ? fps : DEFAULT_FPS
}

// cảnh đang hiện; biến của module, nạp lại thì đặt lại từ đầu
let shown: string | undefined

function isMissing(error: unknown): boolean {
  return error instanceof TypeError || (error instanceof Error && error.message.includes('does not know the attribute'))
}

async function setScene($: AnyEngine, scene: string): Promise<Answer> {
  if (shown === scene) return { isDrawn: true }
  try {
    const set = await $.theme!.set({ backdrop: { scene, id: scene, glass: GLASS }, overrideColorScheme: 'dark' })
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

function sceneFor(level: unknown): string {
  return typeof level === 'string' && LEVELS.includes(level) ? `dragonball-${level}` : 'dragonball'
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    try {
      await $.command.register({ name: COMMAND, description: 'Dragon-ball backdrop + pet: off, a level to pin, nothing to follow effort, or fps 12|24|60.' })
    } catch (error) {
      void $.ui.toast(`dragonball: /${COMMAND} is not available (${String(error)})`)
    }
    const mode = await $.store.get(MODE_KEY)
    if (mode !== 'off') {
      try {
        await setScene($, sceneFor(mode))
      } catch {
        // nền là phần phụ: lỗi không được chặn phiên
      }
    }
    return next(e)
  })

  // đầu mỗi lượt đặt lại cảnh: app bỏ qua cảnh đặt trước khi cửa sổ gắn vào phiên (phiên mới, sau /clear)
  on('prompt.submit', async ($, e, next) => {
    restId += 1
    await update($, pose, () => 'charge')
    const mode = await $.store.get(MODE_KEY)
    if (mode !== 'off') {
      shown = undefined
      try {
        await setScene($, sceneFor(mode))
      } catch {
        // như trên
      }
    }
    return next(e)
  })

  // mỗi lần gửi model một yêu cầu: đổi cảnh theo effort của lượt, trừ khi đã tắt hoặc giữ một mức
  on('turn.step', async function* ($, e, next) {
    if (typeof e.effort === 'string') await update($, level, () => e.effort as string)
    const mode = await $.store.get(MODE_KEY)
    if (mode === undefined) {
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
    const hit: Pose = WRITES.includes(e.tool) ? 'blast' : 'punch'
    const was = await read($, pose)
    if (hit === 'punch' && was === 'blast') return result  // đang bắn chưởng thì không cắt ngang
    await update($, pose, () => hit)
    void (async () => {
      await $.clock.sleep(hit === 'blast' ? BLAST_MS : PUNCH_MS)
      await update($, pose, now => (now === hit ? 'charge' : now))
    })()
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
    if (e.surface !== 'desktop' || e.props.hasSurvey) return next(e)
    const mode = await $.store.get(MODE_KEY)
    if (mode === 'off') return next(e)
    const shownLevel = typeof mode === 'string' && LEVELS.includes(mode) ? mode : await read($, level)
    const now = await read($, pose)
    const { Box, Svg } = $.ui.resolve(e)
    // chỉ chưởng cần cả dải; đấm cần chỗ cho tia nổ; còn lại chỉ ôm con Claude, thử cho thẻ xám của app co theo
    const x0 = now === 'blast' ? 0 : now === 'punch' ? 250 : 296
    // app tự bọc dải này trong một thẻ xám và cắt phần tràn ra ngoài: chân con Claude chạm đáy hình, lấn vào lề dưới/phải của thẻ để ngồi sát góc
    return (
      <Box flexDirection="row" justifyContent="flex-end" alignSelf="flex-end" marginBottom={-14} marginRight={-12}>
        <Svg isInteractive key={now} width={Math.round((380 - x0) * 634 / 380)} height={177} alt={`Claude ${ALT[now]}`} source={petSvg(shownLevel, now, await fpsOf($), true, x0)} />
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
    if (word === 'off') {
      await $.store.set(MODE_KEY, 'off')
      await clearScene($)
      return { text: 'Dragon-ball backdrop off. /dragonball turns it back on.' }
    }
    if (word !== '' && !LEVELS.includes(word)) {
      return { text: `Unknown "${word}". Use off, fps 12|24|60, nothing, or one of: ${LEVELS.join(', ')}.` }
    }
    if (word === '') await $.store.delete(MODE_KEY)
    else await $.store.set(MODE_KEY, word)
    shown = undefined
    const set = await setScene($, sceneFor(word || undefined))
    const said = word === '' ? 'Dragon-ball backdrop follows the effort level.' : `Dragon-ball backdrop pinned to ${word}.`
    return { text: set.isDrawn ? said : `${said} This window may not draw backdrops yet.` }
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.props.plugin !== PLUGIN || e.surface !== 'desktop') return next(e)
    const props = e.props as { scene?: unknown; id?: unknown }
    const name = typeof props.scene === 'string' ? props.scene : typeof props.id === 'string' ? props.id : undefined
    const source = name === undefined ? undefined : SCENES[name]
    if (source === undefined) return next(e)
    const { Svg } = $.ui.resolve(e)
    return <Svg isInteractive alt="Claude powering up among seven dragon balls" source={sceneAtFps(source, await fpsOf($))} />
  })
}
