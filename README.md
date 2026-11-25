# Claude Code Dragonball

![Claude + 7 dragon balls](art/hero.png)

A theme pack for Claude Code: black with Claude orange, dragon-ball gold accents, power-up spinner verbs ("Charging ki", "Going Super", "Breaking the limit"…) and a few tips. Made for the Claude Code desktop app and the CLI; each has its own section below. Each effort level has its own colours, after the aura of its Claude. The iTerm2 IDE layout lives in [claude-ide-dragonball](https://github.com/cyrus5x89/claude-ide-dragonball).

## Claude desktop app

![Backdrop in the desktop app](docs/app.png)

The plugin is a mod for the Code tab, built like Anthropic's `theme-examples` plugin: a black backdrop with seven dragon balls and Claude powering up behind the chat, following the effort level of each turn (low → ultracode), and so do the app's colours: the accent takes the colour of that level's aura and tints the black.

**Install** (type these in the app's prompt box):

```
/plugin marketplace add cyrus5x89/claude-code-dragonball
/plugin install dragonball@claude-code-dragonball
/reload-plugins
```

Then send any message: the backdrop appears with the first turn.

**Update:** `/plugin marketplace update claude-code-dragonball`, then `/plugin update dragonball@claude-code-dragonball` and `/reload-plugins`.

**Commands:**

- `/dragonball` follows the effort level (default)
- `/dragonball max` pins one level (`low`, `medium`, `high`, `xhigh`, `max`, `ultracode`): its backdrop and its colours, in the app and in the terminal theme (see "Colours per level" under [CLI](#cli-terminal))
- `/dragonball off` turns the backdrop off
- `/dragonball app off` / `app on`: turn the desktop-app backdrop off on this machine and keep the terminal theme; the window you type in updates at once, other open windows on their next message
- `/dragonball fps 12`, `24` (default) or `60`: frame rate of every animation; lower costs less GPU

**Limits:** the app refuses images in a backdrop, so the mascots are traced to vector paths by `make_scenes.py` into `hooks/scenes.ts`.

## CLI (terminal)

No backdrop in the terminal: the plugin gives the CLI its colour themes and the `/dragonball` command.

**Install** (in Claude Code):

```
/plugin marketplace add cyrus5x89/claude-code-dragonball
/plugin install dragonball@claude-code-dragonball
/reload-plugins
```

To try it from a clone without installing: `claude --plugin-dir ./claude-code-dragonball`.

**Colours per level.** The plugin ships one terminal theme per level in `themes/` (Claude Code names them `custom:dragonball:dragonball-<level>`, in `/theme` as "Claude Dragonball <level>"), plus the base orange one, `custom:dragonball:dragonball`. `/dragonball <level>` sets the level's theme in `~/.claude/settings.json` and remembers the theme you had; `/dragonball` and `/dragonball off` put that theme back when a level theme is on, and leave any theme you picked since alone. A level theme that is not installed is reported, not written. Following the effort level changes only the app's colours, never the terminal theme. `python3 make_scenes.py` rebuilds the scenes and the level themes together (`--themes`: only the themes) from `themes/dragonball.json` and the aura colours.

| Level | Accent (`claude`) |
|---|---|
| low | `#F2C230` gold |
| medium | `#C98A0B` dark gold |
| high | `#FFD84D` bright yellow |
| xhigh | `#E0384F` red |
| max | `#2FA8F0` blue |
| ultracode | `#D8DEE9` silver |

**Spinner text and a theme without the plugin** (optional): `./install.sh` copies `themes/dragonball.json` to `~/.claude/themes/`, sets `"theme": "custom:dragonball"` and merges the power-up spinner verbs and tips from `settings.json` into `~/.claude/settings.json` (backup at `~/.claude/settings.json.bak-dragonball`). Colours only: copy the theme file and pick **Claude Dragonball** in `/theme`. Also submitted to the [ccthemes gallery](https://github.com/livlign/ccthemes/pull/4).

For the iTerm2 IDE layout (preview pane, Saiyan watermark per effort level) see [claude-ide-dragonball](https://github.com/cyrus5x89/claude-ide-dragonball).

## What changes

| | |
|---|---|
| `themes/dragonball-<level>.json` | The same theme with the level's aura colour in place of Claude orange, tinting the greys; a cue that would match the accent (permission, plan mode, fast mode, ultra effort, auto-accept, warning) moves to orange |
| `hooks/levels.test.ts` | `claude plugin test`: level themes, going back to your own theme, a theme not installed, the app refusing a palette, `app off` / `app on` (scene drawn and redrawn at once, backdrop off, a refused clear), following effort without flashing the base scene |
| `themes/dragonball.json` | Theme (dark base): orange Claude accent, gold shimmer, yellow permission prompts, blue plan mode, red fast mode, white ultra effort, soft green/red diff tints, matching subagent colours |
| `spinnerVerbs` | Power-up verbs replace the built-in ones |
| `spinnerTipsOverride` | Tips labelled ❶ |

## Limits

- The pixel Clawd in the terminal welcome header cannot be changed; in the desktop app the mascot lives in the backdrop instead.
- The CLI and the desktop app read the same `~/.claude/settings.json`, so the theme applies to both.
- A CLI session with the plugin installed leaves the app's backdrop alone: only sessions drawn in the desktop app set it.
- The backdrop needs a desktop app version that draws mod backdrops (tested on 2.1.326).
