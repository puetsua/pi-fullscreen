import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";

import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

export interface FullscreenConfig {
  /** Whether the fullscreen layout is active. Defaults to `true`. */
  enabled: boolean;
}

const cache = new Map<string, FullscreenConfig>();

/**
 * Load `fullscreen.json` once per session lifecycle; later calls return the cached result.
 * Reads only the global file under the agent directory. Missing or empty files leave
 * fullscreen enabled.
 */
export function loadConfig(ctx: ExtensionContext, fileName: string = "fullscreen.json"): FullscreenConfig {
  const key = `${ctx.cwd}\u0000${fileName}`;
  const cached = cache.get(key);
  if (cached) return cached;

  // Any value other than an explicit `false` enables fullscreen, so a missing or empty file keeps
  // the feature on by default.
  const config: FullscreenConfig = { enabled: readRawConfig(join(getAgentDir(), fileName)).enabled !== false };

  cache.set(key, config);
  return config;
}

/**
 * Persist `enabled` to the global config file, preserving any other keys already present,
 * and update the in-memory cache so subsequent `loadConfig` calls reflect the new value.
 */
export function setEnabled(ctx: ExtensionContext, enabled: boolean, fileName: string = "fullscreen.json"): void {
  const path = join(getAgentDir(), fileName);
  const raw = readRawConfig(path);
  raw.enabled = enabled;
  writeFileSync(path, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
  cache.set(`${ctx.cwd}\u0000${fileName}`, { enabled });
}

function readRawConfig(path: string): { enabled?: unknown } {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as { enabled?: unknown })
      : {};
  } catch {
    return {};
  }
}