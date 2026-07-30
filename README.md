# pi-fullscreen

A [Pi](https://pi.dev/) package that gives the TUI a calm, immersive fullscreen layout — like Claude Code's fullscreen mode.

It clears the terminal screen and scrollback on session start and exit, and pins the editor and footer to the bottom of the screen so the conversation fills the viewport without leftover scrollback above it. Nothing else about Pi's UI is changed.

## Installing

Install from npm:

```bash
pi install npm:pi-fullscreen
```

Install from git:

```bash
pi install git:github.com/puetsua/pi-fullscreen
```

## Configuration

`pi-fullscreen` is **enabled by default** once installed. To turn it off by default, set `enabled: false` in the global config file:

- `~/.pi/agent/fullscreen.json`

```json
{
  "enabled": false
}
```

An empty or missing file leaves fullscreen enabled. You can also flip it live at any time with the `/fullscreen` command (see below).

## Commands

- `/fullscreen` — toggle the fullscreen layout on or off. The change applies immediately to the current session **and** is written to `fullscreen.json`, so it persists across restarts.

## Compatibility

Requires Pi `>= 0.81.0`. Developed and typechecked against `@earendil-works/pi-coding-agent` 0.82.x / 0.83.x.

The package relies on Pi's internal TUI render path (the root `render` function, the status container's `render`, and `setClearOnShrink`). If a future Pi release refactors those internals, the layout falls back to no-op gracefully rather than crashing the session — you'd just lose the bottom-pinning until the package is updated.

## Inspiration from

The fullscreen layout was inspired by [pi-spark](https://github.com/zlliang/pi-spark), which bundles this feature together with several others (editor, footer, credits, presets, recap, title, write). This package is a standalone extraction of just the fullscreen behavior for people who want that one thing without the rest.

## License

MIT