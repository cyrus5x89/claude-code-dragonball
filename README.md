# Claude Code Dragonball

![Claude + 7 dragon balls](art/hero.png)

A theme pack for Claude Code: black with Claude orange, dragon-ball gold accents, power-up spinner verbs ("Charging ki", "Going Super", "Breaking the limit"…) and a few tips. Made for the Claude Code desktop app and the CLI. The iTerm2 IDE layout lives in [claude-ide-dragonball](https://github.com/cyrus5x89/claude-ide-dragonball).

## Install

```sh
git clone https://github.com/cyrus5x89/claude-code-dragonball && ./claude-code-dragonball/install.sh
```

This follows Claude Code's custom theme format: it copies `themes/dragonball.json` to `~/.claude/themes/`, sets `"theme": "custom:dragonball"` and merges the spinner verbs and tips from `settings.json` into `~/.claude/settings.json` (backup at `~/.claude/settings.json.bak-dragonball`). The CLI and the desktop app read the same settings, so both switch.

Colours only: copy `themes/dragonball.json` into `~/.claude/themes/` and pick **Claude Dragonball** in `/theme`. Plugin route: `/plugin marketplace add cyrus5x89/claude-code-dragonball`, `/plugin install dragonball@claude-code-dragonball`. Also submitted to the [ccthemes gallery](https://github.com/livlign/ccthemes/pull/4).

## What changes

| | |
|---|---|
| `themes/dragonball.json` | Theme (dark base): orange Claude accent, gold shimmer, yellow permission prompts, blue plan mode, red fast mode, white ultra effort, soft green/red diff tints, matching subagent colours |
| `spinnerVerbs` | Power-up verbs replace the built-in ones |
| `spinnerTipsOverride` | Tips labelled ❶ |

## Limits

- The pet / mascot cannot be changed: Claude Code has no setting for it.
- The CLI and the desktop app read the same `~/.claude/settings.json`, so the theme applies to both.
