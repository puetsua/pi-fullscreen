import { registerFullscreen } from "./src/features/fullscreen";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/**
 * pi-fullscreen is a single-feature Pi extension: it clears the screen and scrollback on session
 * start/exit and pins the editor and footer to the bottom of the terminal, giving the TUI a calm,
 * immersive fullscreen layout like Claude Code.
 */
export default function (pi: ExtensionAPI) {
  registerFullscreen(pi);
}