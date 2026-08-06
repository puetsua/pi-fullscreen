import type { Component, TUI } from "@earendil-works/pi-tui";

const FILLER_MARKER = "\0pi-fullscreen:fullscreen\0";

/** Pins the editor and footer to the bottom when the rest of the UI is shorter than the terminal. */
export class BottomFiller implements Component {
  private tui: TUI;
  private active = false;
  private restore?: () => void;

  constructor(tui: TUI) {
    this.tui = tui;
  }

  /**
   * Install the layout after Pi has added this component to its widget container.
   *
   * Pi has no flexible spacer or layout-measurement API. The filler therefore emits a temporary
   * marker during Pi's normal render pass. A root render wrapper replaces that marker afterward,
   * when the total height is known. Every component, including the transcript, renders only once.
   */
  mount(): void {
    if (this.active) return;

    const widgetIndex = this.tui.children.findIndex(
      (child) => "children" in child && Array.isArray(child.children) && child.children.includes(this),
    );
    if (widgetIndex <= 0) return;

    const statusContainer = this.tui.children[widgetIndex - 1];
    if (!statusContainer) return;

    const originalStatusRender = statusContainer.render;
    const patchedStatusRender = (width: number): string[] => {
      const lines = originalStatusRender.call(statusContainer, width);
      if (!this.active) return lines;

      // Fullscreen already keeps the layout stable, so Pi's two idle placeholder rows only add an
      // unwanted gap above the editor. Real status indicators are left untouched.
      const blankLine = " ".repeat(width);
      return lines.length === 2 && lines.every((line) => line === blankLine) ? [] : lines;
    };

    // Pi 0.84+ wraps the widget TUI in a stable Proxy (createInteractiveTuiReference) that
    // returns a fresh closure for every function-property read, and each closure re-reads the
    // live property at call time. Capturing `this.tui.render` therefore captures a wrapper, not
    // the real method; after we reassign `this.tui.render`, that wrapper calls straight back into
    // the patched function and recurses forever (the 0.84.0 crash). `render` is inherited from
    // Container.prototype (TuiMainScreen/TuiAltScreen do not override it), so read the real
    // method off the prototype and bind it to the underlying TUI instance. A regular function
    // receives that instance as the call-time `this` — the proxy forwards
    // `Reflect.apply(method, tui, args)` with the real TUI, and pi-tui's own render loop calls
    // `this.render(width)` on the real TUI too.
    const self = this;
    const tuiProxy = this.tui;
    const originalTuiRender = (Object.getPrototypeOf(tuiProxy) as unknown as TUI).render;

    const patchedTuiRender = function (this: TUI, width: number): string[] {
      const lines = originalTuiRender.call(this, width);
      if (!self.active) return lines;

      const markerIndex = lines.indexOf(FILLER_MARKER);
      if (markerIndex === -1) return lines;

      lines.splice(markerIndex, 1);
      const fillerHeight = Math.max(0, this.terminal.rows - lines.length);
      if (fillerHeight > 0) lines.splice(markerIndex, 0, ...new Array<string>(fillerHeight).fill(""));

      // Pi reads this after render() and may reset it to the configured value on startup/reload.
      this.setClearOnShrink(true);
      return lines;
    };

    this.active = true;
    statusContainer.render = patchedStatusRender;
    tuiProxy.render = patchedTuiRender;

    this.restore = () => {
      // The proxy makes `tuiProxy.render === patchedTuiRender` always false (reads return a
      // wrapper), so restore unconditionally by reassigning the original prototype method.
      tuiProxy.render = originalTuiRender;
      if (statusContainer.render === patchedStatusRender) statusContainer.render = originalStatusRender;
    };
  }

  dispose(): void {
    this.active = false;
    this.restore?.();
    this.restore = undefined;
  }

  invalidate(): void {
    // No cached render state
  }

  render(_width: number): string[] {
    return this.active ? [FILLER_MARKER] : [];
  }
}