/** Tiny DOM builders. No innerHTML anywhere, so Trusted Types pages are fine. */

type Child = Node | string;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
  el.append(...children);
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** A 24x24 stroked icon built from path data. */
export function icon(...paths: string[]): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  const attrs: Record<string, string> = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2.2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
  };
  for (const [name, value] of Object.entries(attrs)) svg.setAttribute(name, value);
  for (const d of paths) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

/** The hop: an arc that lands on an arrowhead, plus the dot it took off from. */
export const HOP_ICON = ['M18.5 17c0-6-2.8-9.5-6.3-9.5S6.300 10.500 6 15.500', 'M2.500 12.300l3.400 3.600 3.700-3.200', 'M18.500 17h.01'];
export const SEARCH_ICON = ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M20 20l-4-4'];

/** `text` as nodes, with every occurrence of each term wrapped in <mark>. */
export function highlight(text: string, terms: string[]): Child[] {
  const clean = terms.filter(Boolean).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!clean.length) return [text];
  const parts = text.split(new RegExp(`(${clean.join('|')})`, 'gi'));
  // split() with a capture group alternates plain text and matches.
  return parts.map((part, i) => (i % 2 ? h('mark', {}, part) : part)).filter((part) => part !== '');
}
