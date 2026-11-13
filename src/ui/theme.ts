/** Parses `rgb()/rgba()` as returned by getComputedStyle. */
export function parseRgb(color: string): [number, number, number, number] | null {
  const match = /rgba?\(([^)]+)\)/.exec(color);
  if (!match) return null;
  const parts = numbers(match[1]!);
  const [r, g, b, a = 1] = parts;
  if (r === undefined || g === undefined || b === undefined || parts.some(Number.isNaN)) return null;
  return [r, g, b, a];
}

function numbers(args: string): number[] {
  return args
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map((part) => (part === 'none' ? 0 : part.endsWith('%') ? Number(part.slice(0, -1)) / 100 : Number(part)));
}

/**
 * true = dark, false = light, null = transparent or unparseable.
 * Computed colours come back in whatever space the site authored them in, so
 * besides rgb() this understands color(srgb …) and the lab/lch/oklab/oklch family.
 */
export function isDarkColor(color: string): boolean | null {
  const rgb = parseRgb(color);
  if (rgb) {
    if (rgb[3] < 0.5) return null;
    // Perceived brightness (ITU-R BT.601).
    return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000 < 128;
  }

  const fn = /^(oklch|oklab|lch|lab|color)\(([^)]+)\)/.exec(color.trim());
  if (!fn) return null;
  const raw = fn[2]!.split(/[\s,/]+/).filter(Boolean);
  if (fn[1] === 'color') raw.shift(); // drop the colour space name
  const parts = numbers(raw.join(' '));
  if (parts.length < 3 || parts.some(Number.isNaN)) return null;
  if ((parts[3] ?? 1) < 0.5) return null;

  if (fn[1] === 'color') return (parts[0]! * 299 + parts[1]! * 587 + parts[2]! * 114) / 1000 < 0.5;
  // First component is lightness: 0..1 for ok*, 0..100 for lab/lch (percentages were already scaled to 0..1).
  const percent = raw[0]!.endsWith('%');
  const lightness = fn[1]!.startsWith('ok') || percent ? parts[0]! : parts[0]! / 100;
  return lightness < 0.55;
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
