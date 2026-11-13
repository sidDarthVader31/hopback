import { filterQuestions } from '../core/filter';
import type { Question } from '../core/tracker';
import { h, highlight, HOP_ICON, icon, SEARCH_ICON } from './dom';
import css from './styles.css?inline';

export const HOST_ID = 'hopback-root';

export interface ViewOptions {
  onJump(question: Question): void;
  onLoadEarlier(): void;
  /** Index of the question currently being read, or -1. */
  currentIndex(): number;
  isDark(): boolean;
  /** Called with the new vertical position (0..1) after the button is dragged. */
  onMove(y: number): void;
}

/** The floating button and the question panel, isolated in a shadow root. */
export class View {
  readonly host = h('div', { id: HOST_ID, hidden: '' });

  private readonly fab: HTMLButtonElement;
  private readonly badge: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly input: HTMLInputElement;
  private readonly list: HTMLElement;
  private readonly count: HTMLElement;
  private readonly empty: HTMLElement;

  private questions: Question[] = [];
  private visible: Question[] = [];
  private active = 0;
  private dragged = false;

  constructor(private readonly opts: ViewOptions) {
    const root = this.host.attachShadow({ mode: 'open' });
    applyStyles(root);

    this.badge = h('span', { class: 'badge' });
    this.fab = h('button', { class: 'fab', type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false' }, icon(...HOP_ICON), this.badge);

    this.count = h('span', { class: 'count' });
    this.input = h('input', {
      type: 'text',
      placeholder: 'Search your questions',
      role: 'combobox',
      'aria-label': 'Search your questions',
      'aria-controls': 'hb-list',
      'aria-expanded': 'true',
      'aria-autocomplete': 'list',
      autocomplete: 'off',
      spellcheck: 'false',
    });
    this.list = h('ul', { class: 'list', id: 'hb-list', role: 'listbox', 'aria-label': 'Your questions' });
    this.empty = h('div', { class: 'empty', hidden: '' }, 'No questions match your search.');
    const earlier = h('button', { class: 'earlier', type: 'button', title: 'Scroll up until the whole conversation has loaded' }, 'Load earlier');

    this.panel = h(
      'div',
      { class: 'panel', role: 'dialog', 'aria-label': 'HopBack', hidden: '' },
      h('div', { class: 'head' }, h('h2', { class: 'title' }, 'Your questions'), this.count),
      h('label', { class: 'search' }, icon(...SEARCH_ICON), this.input),
      this.list,
      this.empty,
      h(
        'div',
        { class: 'foot' },
        h('span', { class: 'hints' }, h('span', {}, h('kbd', {}, '↑'), h('kbd', {}, '↓'), 'move'), h('span', {}, h('kbd', {}, '↵'), 'hop'), h('span', {}, h('kbd', {}, 'esc'), 'close')),
        earlier,
      ),
    );

    root.append(this.fab, this.panel);

    this.fab.addEventListener('click', () => {
      if (this.dragged) this.dragged = false;
      else this.toggle();
    });
    this.enableDrag();

    this.input.addEventListener('input', () => {
      this.active = 0;
      this.render();
    });
    this.input.addEventListener('keydown', (e) => this.onKey(e));
    // Keep focus in the search field while clicking through the list.
    this.list.addEventListener('mousedown', (e) => e.preventDefault());
    this.list.addEventListener('click', (e) => {
      const item = (e.target as Element).closest<HTMLElement>('.item');
      const question = item && this.visible[Number(item.dataset.i)];
      if (question) this.choose(question);
    });
    this.list.addEventListener('mousemove', (e) => {
      const item = (e.target as Element).closest<HTMLElement>('.item');
      if (item && Number(item.dataset.i) !== this.active) this.setActive(Number(item.dataset.i), false);
    });
    earlier.addEventListener('click', () => {
      this.close();
      this.opts.onLoadEarlier();
    });

    // Typing in the panel must not trigger the host app's own shortcuts.
    for (const type of ['keydown', 'keyup', 'keypress']) {
      this.host.addEventListener(type, (e) => e.stopPropagation());
    }
    document.addEventListener(
      'pointerdown',
      (e) => {
        if (this.isOpen && !e.composedPath().includes(this.host)) this.close();
      },
      true,
    );
  }

  get isOpen(): boolean {
    return !this.panel.hidden;
  }

  /** Mounts the host, or puts it back if the page removed it. */
  attach(): void {
    if (!this.host.isConnected) document.documentElement.append(this.host);
  }

  setQuestions(questions: Question[]): void {
    this.questions = questions;
    const n = questions.length;
    this.host.hidden = n === 0;
    this.badge.textContent = String(n);
    this.fab.setAttribute('aria-label', `HopBack: ${n} question${n === 1 ? '' : 's'} in this chat`);
    this.syncTheme();
    if (n === 0) this.close();
    else if (this.isOpen) this.render();
  }

  setY(y: number): void {
    this.host.style.setProperty('--y', String(clamp(y, 0.08, 0.92)));
  }

  toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
  }

  open(): void {
    if (this.isOpen || !this.questions.length) return;
    this.syncTheme();
    this.input.value = '';
    const current = this.opts.currentIndex();
    this.active = current >= 0 ? current : this.questions.length - 1;
    this.panel.hidden = false;
    this.fab.setAttribute('aria-expanded', 'true');
    this.render();
    this.place();
    this.input.focus({ preventScroll: true });
  }

  close(): void {
    if (!this.isOpen) return;
    this.panel.hidden = true;
    this.fab.setAttribute('aria-expanded', 'false');
  }

  private syncTheme(): void {
    this.host.dataset.theme = this.opts.isDark() ? 'dark' : 'light';
  }

  private choose(question: Question): void {
    this.close();
    this.opts.onJump(question);
  }

  private render(): void {
    const query = this.input.value;
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const current = this.opts.currentIndex();
    this.visible = filterQuestions(this.questions, query);
    this.active = clamp(this.active, 0, Math.max(0, this.visible.length - 1));

    this.list.replaceChildren(
      ...this.visible.map((q, i) =>
        h(
          'li',
          {
            class: q.index === current ? 'item current' : 'item',
            id: `hb-opt-${i}`,
            role: 'option',
            'data-i': String(i),
            'aria-selected': String(i === this.active),
            title: q.text,
          },
          h('span', { class: 'num' }, String(q.index + 1)),
          h('span', { class: 'text' }, ...highlight(q.text, terms)),
        ),
      ),
    );

    const total = this.questions.length;
    this.count.textContent = this.visible.length === total ? String(total) : `${this.visible.length} of ${total}`;
    this.empty.hidden = this.visible.length > 0;
    this.list.hidden = this.visible.length === 0;
    this.setActive(this.active, true);
  }

  private setActive(index: number, scroll: boolean): void {
    this.active = index;
    for (const item of this.list.children) {
      item.setAttribute('aria-selected', String(item.id === `hb-opt-${index}`));
    }
    const item = this.list.children[index];
    if (item) this.input.setAttribute('aria-activedescendant', item.id);
    else this.input.removeAttribute('aria-activedescendant');
    if (scroll) item?.scrollIntoView?.({ block: 'nearest' });
  }

  private onKey(e: KeyboardEvent): void {
    const last = this.visible.length - 1;
    if (e.key === 'ArrowDown') this.setActive(Math.min(this.active + 1, last), true);
    else if (e.key === 'ArrowUp') this.setActive(Math.max(this.active - 1, 0), true);
    else if (e.key === 'Enter') {
      const question = this.visible[this.active];
      if (question) this.choose(question);
    } else if (e.key === 'Escape') this.close();
    else return;
    e.preventDefault();
  }

  /** Centres the panel on the button, kept inside the viewport. */
  private place(): void {
    const fab = this.fab.getBoundingClientRect();
    const centre = fab.top + fab.height / 2;
    const height = this.panel.offsetHeight;
    const top = clamp(centre - height / 2, 12, Math.max(12, window.innerHeight - height - 12));
    this.panel.style.top = `${top}px`;
    this.panel.style.transformOrigin = `100% ${centre - top}px`;
  }

  private enableDrag(): void {
    let startY: number | null = null;
    this.fab.addEventListener('pointerdown', (e) => {
      startY = e.clientY;
      this.dragged = false;
      this.fab.setPointerCapture?.(e.pointerId);
    });
    this.fab.addEventListener('pointermove', (e) => {
      if (startY === null) return;
      if (!this.dragged && Math.abs(e.clientY - startY) < 5) return;
      this.dragged = true;
      this.close();
      this.setY(e.clientY / window.innerHeight);
    });
    const end = (e: PointerEvent) => {
      if (startY === null) return;
      startY = null;
      if (this.dragged) this.opts.onMove(clamp(e.clientY / window.innerHeight, 0.08, 0.92));
    };
    this.fab.addEventListener('pointerup', end);
    this.fab.addEventListener('pointercancel', end);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function applyStyles(root: ShadowRoot): void {
  try {
    // Constructable stylesheets are not subject to the page's CSP.
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    root.adoptedStyleSheets = [sheet];
  } catch {
    root.append(h('style', {}, css));
  }
}
