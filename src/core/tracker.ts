import type { SiteAdapter } from '../adapters/types';
import { questionText } from './text';

export interface Question {
  /** Stable for as long as the underlying element lives. */
  id: string;
  /** Position in the conversation, starting at 0. */
  index: number;
  text: string;
  el: HTMLElement;
}

export interface ChangeInfo {
  /** True when the user moved to a different conversation. */
  conversationChanged: boolean;
}

export type ChangeListener = (questions: Question[], info: ChangeInfo) => void;

/** User message elements in document order, using the first selector that matches. */
export function findQuestionElements(root: ParentNode, adapter: SiteAdapter): HTMLElement[] {
  for (const selector of adapter.selectors) {
    const found = root.querySelectorAll<HTMLElement>(selector);
    if (!found.length) continue;
    // Keep only outermost matches. Document order means an ancestor always comes first.
    const result: HTMLElement[] = [];
    for (const el of found) {
      const last = result[result.length - 1];
      if (!last || !last.contains(el)) result.push(el);
    }
    return result;
  }
  return [];
}

/**
 * Keeps an up-to-date list of the questions on the page.
 *
 * The DOM is the source of truth: nothing is recorded or stored, so the list
 * is right for any conversation the moment it renders, and jump targets stay
 * valid while answers stream in and the layout shifts.
 */
export class Tracker {
  questions: Question[] = [];

  private ids = new WeakMap<HTMLElement, string>();
  private nextId = 1;
  private key = '';
  private timer: ReturnType<typeof setTimeout> | undefined;
  private observer: MutationObserver | undefined;

  constructor(
    private readonly adapter: SiteAdapter,
    private readonly onChange: ChangeListener,
    private readonly win: Window = window,
    private readonly delay = 150,
  ) {}

  start(): void {
    this.key = this.conversationKey();
    this.observer = new MutationObserver(() => this.schedule());
    this.observer.observe(this.win.document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    this.scan();
  }

  stop(): void {
    this.observer?.disconnect();
    clearTimeout(this.timer);
    this.timer = undefined;
  }

  /** Rescan now. Emits only when something actually changed. */
  scan(): void {
    const key = this.conversationKey();
    const conversationChanged = key !== this.key;
    this.key = key;

    const next = findQuestionElements(this.win.document, this.adapter).map((el, index) => ({
      id: this.idFor(el),
      index,
      text: questionText(el, this.adapter),
      el,
    }));

    if (conversationChanged || !sameList(this.questions, next)) {
      this.questions = next;
      this.onChange(next, { conversationChanged });
    }
  }

  // Streaming answers fire mutations constantly, so run at most once per `delay`.
  private schedule(): void {
    if (this.timer !== undefined) return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.scan();
    }, this.delay);
  }

  private conversationKey(): string {
    const url = new URL(this.win.location.href);
    return this.adapter.conversationKey?.(url) ?? url.pathname;
  }

  private idFor(el: HTMLElement): string {
    let id = this.ids.get(el);
    if (!id) {
      id = `q${this.nextId++}`;
      this.ids.set(el, id);
    }
    return id;
  }
}

function sameList(a: Question[], b: Question[]): boolean {
  return a.length === b.length && a.every((q, i) => q.id === b[i]!.id && q.text === b[i]!.text);
}
