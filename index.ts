import { VERSION } from "@earendil-works/pi-coding-agent";
import { truncateToWidth } from "@earendil-works/pi-tui";

import { BottomFiller } from "./filler";
import { loadConfig } from "./config";

import type { ExtensionAPI, ExtensionCommandContext, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import type { TUI } from "@earendil-works/pi-tui";
import type { UserMessage } from "@earendil-works/pi-ai";

const WIDGET_KEY = "fullscreen";

/** Replace newlines, tabs, carriage returns with space, then collapse multiple spaces and trim. */
function sanitizeText(text: string): string {
  return text
    .replace(/[\r\n\t]/g, " ")
    .replace(/ +/g, " ")
    .trim();
}

function getSessionDisplayText(ctx: ExtensionContext, theme: Theme): string | undefined {
  const sessionName = ctx.sessionManager.getSessionName();
  if (sessionName) return theme.fg("warning", sanitizeText(sessionName));

  for (const entry of ctx.sessionManager.getEntries()) {
    if (entry.type !== "message" || entry.message.role !== "user") continue;

    const text = extractText(entry.message);
    if (text) return sanitizeText(text);
  }

  return undefined;
}

function extractText(message: UserMessage): string {
  const content = message.content;
  if (typeof content === "string") return content;

  return content.filter((block) => block.type === "text").map((block) => block.text).join(" ");
}

/**
 * pi-fullscreen is a single-feature Pi extension: it clears the screen and scrollback on session
 * start/exit and pins the editor and footer to the bottom of the terminal, giving the TUI a calm,
 * immersive fullscreen layout like Claude Code. Toggle it at any time with `/fullscreen`.
 */
export default function registerFullscreen(pi: ExtensionAPI): void {
  // Per-session state. The TUI handle and filler are captured in the widget factory below; the
  // command handler closes over them to toggle the layout live.
  let tui: TUI | undefined;
  let filler: BottomFiller | undefined;
  let active = false;
  let pendingClear = false;

  pi.registerCommand("fullscreen", {
    description: "Toggle the fullscreen TUI layout on or off for this session.",
    handler: async (_args, ctx) => toggle(ctx),
  });

  function toggle(ctx: ExtensionCommandContext | ExtensionContext): void {
    if (ctx.mode !== "tui") {
      ctx.ui.notify("fullscreen is only available in TUI mode", "warning");
      return;
    }

    if (!filler || !tui) {
      ctx.ui.notify("fullscreen is not available in this session", "warning");
      return;
    }

    if (active) {
      filler.dispose();
      active = false;
      ctx.ui.notify("fullscreen off", "info");
    } else {
      filler.mount();
      active = true;
      ctx.ui.notify("fullscreen on", "info");
    }

    tui.requestRender(true);
  }

  pi.on("session_start", (_event, ctx) => {
    if (ctx.mode !== "tui") return;

    const config = loadConfig(ctx);
    active = config.enabled;
    pendingClear = config.enabled;

    // The TUI handle isn't exposed via `ctx.ui`; the widget factory is the only place that
    // receives it. Mounting a persistent filler above the editor both captures the TUI and
    // pins the editor and footer to the bottom of the screen. The factory is always registered
    // in TUI mode so the toggle command can re-mount the filler even if fullscreen started
    // disabled.
    ctx.ui.setWidget(WIDGET_KEY, (capturedTui) => {
      tui = capturedTui;

      const localFiller = new BottomFiller(capturedTui);
      filler = localFiller;

      const shouldClear = pendingClear;
      pendingClear = false;

      // Defer setup until `setWidget` has mounted the filler in the render tree.
      queueMicrotask(() => {
        if (active) localFiller.mount();
        if (shouldClear) capturedTui.requestRender(true);
      });

      return localFiller;
    });
  });

  pi.on("session_shutdown", (event, ctx) => {
    if (event.reason === "quit" && active && tui) {
      // The TUI is already stopped here, so write the clear sequence directly instead of
      // repainting: clear screen, home, clear scrollback.
      tui.terminal.write("\x1b[2J\x1b[H\x1b[3J");

      const theme = ctx.ui.theme;
      const exitMessage = `${theme.bold(theme.fg("accent", "pi"))} ${theme.fg("dim", `v${VERSION} exited`)}`;
      const sessionText = getSessionDisplayText(ctx, theme);
      const line = truncateToWidth(
        `${exitMessage}${sessionText ? `${theme.fg("dim", ":")} ${sessionText}` : ""}`,
        tui.terminal.columns,
        "…",
      );
      tui.terminal.write(`${line}\r\n`);
    }

    ctx.ui.setWidget(WIDGET_KEY, undefined);
    tui = undefined;
    filler = undefined;
    active = false;
    pendingClear = false;
  });
}