/** Parses `rgb()/rgba()` as returned by getComputedStyle. */
export function parseRgb(color: string): [number, number, number, number] | null {
  const match = /rgba?\(([^)]+)\)/.exec(color);
  if (!match) return null;
  const parts = match[1]!.split(/[\s,/]+/).filter(Boolean).map(Number);
  const [r, g, b, a = 1] = parts;
  if (r === undefined || g === undefined || b === undefined || parts.some(Number.isNaN)) return null;
  return [r, g, b, a];
}

/** true = dark, false = light, null = transparent or unparseable. */
export function isDarkColor(color: string): boolean | null {
  const rgb = parseRgb(color);
  if (!rgb || rgb[3] < 0.5) return null;
  const [r, g, b] = rgb;
  // Perceived brightness (ITU-R BT.601).
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

/**
 * Follows the host page rather than the OS: a site can be in dark mode while
 * the system is light. The page background is the one signal every site shares.
 */
export function detectDark(win: Window = window): boolean {
  const doc = win.document;
  for (const el of [doc.body, doc.documentElement]) {
    if (!el) continue;
    const dark = isDarkColor(win.getComputedStyle(el).backgroundColor);
    if (dark !== null) return dark;
  }
  return win.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}
