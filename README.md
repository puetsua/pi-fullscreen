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

Install from a local path (useful while editing; the source is loaded in place, so changes apply on the next launch):

```bash
pi install /absolute/path/to/pi-fullscreen
```

Try it for a single run without installing:

```bash
pi -e /absolute/path/to/pi-fullscreen
```

## Configuration

`pi-fullscreen` is **enabled by default** once installed. To turn it off, set `enabled: false` in a config file:

- Global: `~/.pi/agent/fullscreen.json`
- Project: `<project>/.pi/fullscreen.json` (overrides global)

```json
{
  "enabled": false
}
```

An empty or missing file leaves fullscreen enabled. Project config overrides the global file.

## Compatibility

Requires Pi `>= 0.81.0`. Developed and typechecked against `@earendil-works/pi-coding-agent` 0.82.x / 0.83.x.

The package relies on Pi's internal TUI render path (the root `render` function, the status container's `render`, and `setClearOnShrink`). If a future Pi release refactors those internals, the layout falls back to no-op gracefully rather than crashing the session — you'd just lose the bottom-pinning until the package is updated.

## Inspiration from

The fullscreen layout was inspired by [pi-spark](https://github.com/zlliang/pi-spark), which bundles this feature together with several others (editor, footer, credits, presets, recap, title, write). This package is a standalone extraction of just the fullscreen behavior for people who want that one thing without the rest.

## Releasing

Releases are published automatically from tags. Pushing a `v*` tag triggers [.github/workflows/release.yml](.github/workflows/release.yml), which:

1. installs and typechecks,
2. derives the package version from the tag,
3. generates release notes from conventional commits with [git-cliff](https://git-cliff.org),
4. publishes to npm (with provenance), and
5. creates a GitHub Release with the generated notes.

To cut a release:

```bash
# bump version in package.json to match the tag, commit, then:
git tag v0.2.0
git push origin v0.2.0
```

The workflow uses the tag as the single source of truth for the version, so the version in `package.json` on the tagged commit should match the tag (e.g. `v0.2.0` → `"version": "0.2.0"`).

Use [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:`, `docs:`, …) so git-cliff can group changelog entries.

### Required secret

Add an npm access token as the `NPM_TOKEN` repository secret (Settings → Secrets and variables → Actions). Use a granular publish token or a classic automation token. npm provenance (`--provenance`) also requires the job's `id-token: write` permission, which is already set in the workflow.

## License

MIT