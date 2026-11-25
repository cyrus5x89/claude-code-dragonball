import { test, expect, mock } from 'claude-code/testing'

const LEVELS = ['low', 'medium', 'high', 'xhigh', 'max', 'ultracode']
const THEMES = ['dark', 'dark-ansi', 'light', 'custom:dragonball:dragonball', ...LEVELS.map(l => 'custom:dragonball:dragonball-' + l)]

function wire(on: any, start: string, options: string[] | undefined, surface: string) {
  const s = { theme: start as unknown, accents: [] as unknown[], scenes: [] as string[], log: [] as string[], surface, redraws: 0, clearFails: false }
  mock.store(on)
  on('session.surfaces' as never, async () => ({ value: [s.surface] }) as never)
  on('turn.step', async function* (_$: unknown, e: any) { return { turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: 'end_turn', usage: null } as never })
  on('prompt.submit', async (_$: unknown, e: any) => ({ text: e.text }) as never)
  on('ui.invalidate' as never, async () => { s.redraws++; return { value: undefined } as never })
  on('config.list' as never, async () => ({ value: [{ key: 'theme', label: 'Theme', kind: 'choice', value: s.theme, options, isLocked: false }] }) as never)
  on('config.set', async (_$: unknown, e: any) => { s.theme = e.value; return { value: e.value } as never })
  on('theme.set' as never, async (_$: unknown, e: any) => { s.accents.push(e.colors === undefined ? 'none' : 'colors'); s.scenes.push(e.backdrop.scene); return { value: { isDrawn: true } } as never })
  on('theme.clear' as never, async () => {
    if (s.clearFails) throw new Error('clear refused')
    return { value: { isDrawn: false } } as never
  })
  return s
}

for (const surface of ['terminal', 'desktop']) {
  test(surface + ': levels from a theme of my own, then back to it', async ($, on) => {
    const s = wire(on, 'dark-ansi', THEMES, surface)
    for (const word of LEVELS) {
      await $.command.run({ command: 'dragonball', args: word })
      expect(s.theme).toBe('custom:dragonball:dragonball-' + word)
    }
    await $.command.run({ command: 'dragonball', args: '' })
    expect(s.theme).toBe('dark-ansi')
    await $.command.run({ command: 'dragonball', args: 'max' })
    expect(s.theme).toBe('custom:dragonball:dragonball-max')
    await $.command.run({ command: 'dragonball', args: 'off' })
    expect(s.theme).toBe('dark-ansi')
    if (surface === 'desktop') expect(s.accents.includes('colors')).toBe(true)
  })

  test(surface + ': already on a level theme with nothing saved goes to the base theme', async ($, on) => {
    const s = wire(on, 'custom:dragonball:dragonball-xhigh', THEMES, surface)
    await $.command.run({ command: 'dragonball', args: 'max' })
    await $.command.run({ command: 'dragonball', args: 'off' })
    expect(s.theme).toBe('custom:dragonball:dragonball')
  })
}

test('a theme the user picked after a level stays on /dragonball off', async ($, on) => {
  const s = wire(on, 'dark-ansi', THEMES, 'terminal')
  await $.command.run({ command: 'dragonball', args: 'high' })
  s.theme = 'light'
  await $.command.run({ command: 'dragonball', args: 'off' })
  expect(s.theme).toBe('light')
})

test('a level theme that is not installed is reported, not written', async ($, on) => {
  const s = wire(on, 'dark-ansi', ['dark', 'dark-ansi'], 'terminal')
  const r = await $.command.run({ command: 'dragonball', args: 'max' })
  expect(s.theme).toBe('dark-ansi')
  expect(String(r.text)).toContain('not an installed theme')
})

test('the app refusing the palette still draws the backdrop', async ($, on) => {
  mock.store(on)
  const sets: string[] = []
  on('session.surfaces' as never, async () => ({ value: ['desktop'] }) as never)
  on('config.list' as never, async () => ({ value: [] }) as never)
  on('theme.set' as never, async (_$: unknown, e: any) => {
    if (e.colors !== undefined) throw new Error("Desktop won't paint this theme")
    sets.push(e.backdrop.scene)
    return { value: { isDrawn: true } } as never
  })
  const r = await $.command.run({ command: 'dragonball', args: 'max' })
  expect(sets).toEqual(['dragonball-max'])
  expect(String(r.text)).toContain('pinned to max')
})

// một lượt ở mức effort này, như engine gửi cho model
async function turnAt($: any, effort: string) {
  const stream = $.turn.step({ turnId: 't', index: 0, model: 'test', effort, messageCount: 1 } as never)
  for await (const _ of stream) { /* bỏ qua */ }
  await stream
}

test('app on draws the pinned level again at once and redraws the pet', async ($, on) => {
  const s = wire(on, 'dark-ansi', THEMES, 'desktop')
  await $.command.run({ command: 'dragonball', args: 'max' })
  const r0 = s.redraws
  await $.command.run({ command: 'dragonball', args: 'app off' })
  expect(s.redraws).toBe(r0 + 1)
  const before = s.scenes.length
  const r = await $.command.run({ command: 'dragonball', args: 'app on' })
  expect(s.redraws).toBe(r0 + 2)
  expect(s.scenes.slice(before)).toEqual(['dragonball-max'])
  expect(s.accents.at(-1)).toBe('colors')
  expect(String(r.text)).toContain('back on')
})

test('app on while following effort draws the level of the last turn', async ($, on) => {
  const s = wire(on, 'dark-ansi', THEMES, 'desktop')
  await turnAt($, 'xhigh')
  await $.command.run({ command: 'dragonball', args: 'app off' })
  const before = s.scenes.length
  await $.command.run({ command: 'dragonball', args: 'app on' })
  expect(s.scenes.slice(before)).toEqual(['dragonball-xhigh'])
})

test('app on before any turn draws the base scene, not the low one', async ($, on) => {
  const s = wire(on, 'dark-ansi', THEMES, 'desktop')
  await $.command.run({ command: 'dragonball', args: 'app off' })
  await $.command.run({ command: 'dragonball', args: 'app on' })
  expect(s.scenes.at(-1)).toBe('dragonball')
})

test('each new message keeps the level of the last turn instead of flashing the base scene', async ($, on) => {
  const s = wire(on, 'dark-ansi', THEMES, 'desktop')
  await turnAt($, 'max')
  const before = s.scenes.length
  await $.prompt.submit({ text: 'hi' } as never)
  expect(s.scenes.length).toBeGreaterThan(before)
  expect(s.scenes.slice(before).every(x => x === 'dragonball-max')).toBe(true)
})

test('app on with the backdrop off draws nothing and says both stay off', async ($, on) => {
  const s = wire(on, 'dark-ansi', THEMES, 'desktop')
  await $.command.run({ command: 'dragonball', args: 'off' })
  await $.command.run({ command: 'dragonball', args: 'app off' })
  const before = s.scenes.length
  const r = await $.command.run({ command: 'dragonball', args: 'app on' })
  expect(s.scenes.length).toBe(before)
  expect(String(r.text)).toContain('backdrop and pet stay off')
})

test('app on redraws even when this session remembers the scene (app off came from the terminal)', async ($, on) => {
  const s = wire(on, 'dark-ansi', THEMES, 'desktop')
  await $.command.run({ command: 'dragonball', args: 'max' })
  s.surface = 'terminal'
  await $.command.run({ command: 'dragonball', args: 'app off' })
  s.surface = 'desktop'
  const before = s.scenes.length
  await $.command.run({ command: 'dragonball', args: 'app on' })
  expect(s.scenes.slice(before)).toEqual(['dragonball-max'])
})

test('app off sticks when the app refuses to clear the backdrop', async ($, on) => {
  const s = wire(on, 'dark-ansi', THEMES, 'desktop')
  await $.command.run({ command: 'dragonball', args: 'max' })
  s.clearFails = true
  const r = await $.command.run({ command: 'dragonball', args: 'app off' })
  expect(String(r.text)).toContain('could not be cleared')
  const pin = await $.command.run({ command: 'dragonball', args: 'high' })
  expect(String(pin.text)).toContain('/dragonball app on')
})

test('a level pinned while the app is off says how to turn it on', async ($, on) => {
  const s = wire(on, 'dark-ansi', THEMES, 'desktop')
  await $.command.run({ command: 'dragonball', args: 'app off' })
  const before = s.scenes.length
  const r = await $.command.run({ command: 'dragonball', args: 'max' })
  expect(s.scenes.length).toBe(before)
  expect(String(r.text)).toContain('/dragonball app on')
})

test('fps, side, off and a level redraw the pet at once', async ($, on) => {
  const s = wire(on, 'dark-ansi', THEMES, 'desktop')
  for (const args of ['fps 12', 'left', 'right', 'max', '', 'off']) {
    const before = s.redraws
    await $.command.run({ command: 'dragonball', args })
    expect(s.redraws).toBeGreaterThan(before)
  }
})
