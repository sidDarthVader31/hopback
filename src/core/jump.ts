const DEFAULT_OFFSET = 72;
const ACCENT_TINT = 'rgba(91, 91, 214, 0.22)';

export function prefersReducedMotion(win: Window = window): boolean {
  return win.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** Scroll a question to the top of its scroll container and flash it briefly. */
export function jumpTo(el: HTMLElement, headerOffset = DEFAULT_OFFSET, win: Window = window): void {
  const reduce = prefersReducedMotion(win);
  el.style.scrollMarginTop = `${headerOffset}px`;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  if (!reduce && typeof el.animate === 'function') {
    el.animate(
      [
        { backgroundColor: ACCENT_TINT, boxShadow: `0 0 0 6px ${ACCENT_TINT}`, borderRadius: '10px' },
        { backgroundColor: 'transparent', boxShadow: '0 0 0 6px transparent', borderRadius: '10px' },
      ],
      { duration: 1400, easing: 'ease-out', delay: 150 },
    );
  }
}

/** Nearest ancestor that actually scrolls, falling back to the page itself. */
export function scrollParent(el: HTMLElement, win: Window = window): Element {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const overflowY = win.getComputedStyle(node).overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node;
    }
  }
  return win.document.scrollingElement ?? win.document.documentElement;
}
