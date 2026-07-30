# pi-fullscreen

A [Pi](https://pi.dev/) package that gives the TUI a calm, immersive fullscreen layout — like Claude Code's fullscreen mode.

It does one thing:

- Clears the terminal screen and scrollback on session start and exit, and pins the editor and footer to the bottom of the screen.

That's it. No other UI is replaced. Inspired by the fullscreen feature in [`pi-spark`](https://github.com/zlliang/pi-spark), extracted as a standalone package for people who only want fullscreen.

![Fullscreen layout](https://raw.githubusercontent.com/zlliang/pi-spark/main/assets/screenshot-tui.png)

## Install

Install from npm:

```bash
pi install npm:pi-fullscreen
```

Install from git:

```bash
pi install git:github.com/<owner>/pi-fullscreen
```

> Replace `<owner>` with the GitHub account this repo is published under.

## How it works

Pi has no flexible spacer or layout-measurement API, so this package mounts a persistent "bottom filler" widget above the editor. The filler emits a temporary marker during Pi's normal render pass; a root render wrapper replaces that marker with the right number of blank lines once the total height is known. Every component, including the transcript, renders only once. On `quit`, it writes a clear-screen sequence directly (the TUI is already stopped by then) and prints a one-line exit banner with the session name or first user message.

## Configuration

`pi-fullscreen` is **enabled by default**. To turn it off, set `enabled: false` in either of:

- Global: `~/.pi/agent/fullscreen.json`
- Project:  `<project>/.pi/fullscreen.json` (overrides global)

```json
{
  "enabled": false
}
```

Project config overrides the global file. An empty or missing file leaves fullscreen enabled.

## Compatibility

Requires Pi `>= 0.81.0` (tested against `@earendil-works/pi-coding-agent` 0.82.x).

## License

MIT