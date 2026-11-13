import type { SiteAdapter } from '../adapters/types';

const MAX_LENGTH = 300;

export function normalise(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** The label shown in the list for one user message. */
export function questionText(el: HTMLElement, adapter: SiteAdapter): string {
  const source = (adapter.textSelector && el.querySelector(adapter.textSelector)) || el;
  const text = normalise(source.textContent ?? '');
  if (text) return text.length > MAX_LENGTH ? `${text.slice(0, MAX_LENGTH).trimEnd()}…` : text;
  return el.querySelector('img, canvas, video') ? 'Image' : 'Attachment';
}
