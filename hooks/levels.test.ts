import { test, expect, mock } from 'claude-code/testing'

const LEVELS = ['low', 'medium', 'high', 'xhigh', 'max', 'ultracode']
const THEMES = ['dark', 'dark-ansi', 'light', 'custom:dragonball:dragonball', ...LEVELS.map(l => 'custom:dragonball:dragonball-' + l)]

function wire(on: any, start: string, options: string[] | undefined, surface: string) {
  const s = { theme: start as unknown, accents: [] as unknown[], log: [] as string[] }
  mock.store(on)
  on('session.surfaces' as never, async () => ({ value: [surface] }) as never)
  on('config.list' as never, async () => ({ value: [{ key: 'theme', label: 'Theme', kind: 'choice', value: s.theme, options, isLocked: false }] }) as never)
  on('config.set', async (_$: unknown, e: any) => { s.theme = e.value; return { value: e.value } as never })
  on('theme.set' as never, async (_$: unknown, e: any) => { s.accents.push(e.colors === undefined ? 'none' : 'colors'); return { value: { isDrawn: true } } as never })
  on('theme.clear' as never, async () => ({ value: { isDrawn: false } }) as never)
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
