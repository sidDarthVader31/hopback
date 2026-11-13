import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Question } from '../../src/core/tracker';
import { View, type ViewOptions } from '../../src/ui/view';

const questions = ['How do I bake bread?', 'Best flour for pizza', 'Bread storage tips'].map(
  (text, index) => ({ id: `q${index}`, index, text, el: document.createElement('div') }) satisfies Question,
);

let opts: { [K in keyof ViewOptions]: ReturnType<typeof vi.fn<ViewOptions[K]>> };
let view: View;
const $ = <T extends HTMLElement>(selector: string) => view.host.shadowRoot!.querySelector<T>(selector)!;
const items = () => [...view.host.shadowRoot!.querySelectorAll<HTMLElement>('.item')];
const type = (value: string) => {
  $<HTMLInputElement>('input').value = value;
  $('input').dispatchEvent(new Event('input'));
};
const press = (key: string) => $('input').dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

beforeEach(() => {
  document.documentElement.querySelector('#hopback-root')?.remove();
  opts = { onJump: vi.fn(), onLoadEarlier: vi.fn(), currentIndex: vi.fn(() => 1), isDark: vi.fn(() => false), onMove: vi.fn() };
  view = new View(opts);
  view.attach();
});

describe('View', () => {
  it('stays hidden until the chat has questions', () => {
    expect(view.host.hidden).toBe(true);
    view.setQuestions(questions);
    expect(view.host.hidden).toBe(false);
    expect($('.badge').textContent).toBe('3');
    view.setQuestions([]);
    expect(view.host.hidden).toBe(true);
  });

  it('opens from the button with every question listed and the current one marked', () => {
    view.setQuestions(questions);
    $('.fab').click();
    expect(view.isOpen).toBe(true);
    expect($('.fab').getAttribute('aria-expanded')).toBe('true');
    expect(items().map((li) => li.querySelector('.text')!.textContent)).toEqual(questions.map((q) => q.text));
    expect(items().map((li) => li.classList.contains('current'))).toEqual([false, true, false]);
    expect(items()[1]!.getAttribute('aria-selected')).toBe('true');
  });

  it('filters as you type and highlights the match', () => {
    view.setQuestions(questions);
    view.open();
    type('bread');
    expect(items().map((li) => li.querySelector('.num')!.textContent)).toEqual(['1', '3']);
    expect(items()[0]!.querySelector('mark')!.textContent).toBe('bread');
    expect($('.count').textContent).toBe('2 of 3');
    type('zzz');
    expect(items()).toHaveLength(0);
    expect($('.empty').hidden).toBe(false);
  });

  it('hops with the keyboard', () => {
    view.setQuestions(questions);
    view.open();
    press('ArrowDown');
    press('Enter');
    expect(opts.onJump).toHaveBeenCalledWith(questions[2]);
    expect(view.isOpen).toBe(false);
  });

  it('hops on click', () => {
    view.setQuestions(questions);
    view.open();
    items()[0]!.click();
    expect(opts.onJump).toHaveBeenCalledWith(questions[0]);
  });

  it('closes on Escape and when the chat empties', () => {
    view.setQuestions(questions);
    view.open();
    press('Escape');
    expect(view.isOpen).toBe(false);
    view.open();
    view.setQuestions([]);
    expect(view.isOpen).toBe(false);
  });

  it('updates an open list when a question arrives', () => {
    view.setQuestions(questions.slice(0, 2));
    view.open();
    view.setQuestions(questions);
    expect(items()).toHaveLength(3);
  });

  it('follows the page theme', () => {
    opts.isDark.mockReturnValue(true);
    view.setQuestions(questions);
    expect(view.host.dataset.theme).toBe('dark');
  });

  it('keeps keystrokes away from the page', () => {
    const onPageKey = vi.fn();
    document.addEventListener('keydown', onPageKey);
    view.setQuestions(questions);
    view.open();
    press('a');
    expect(onPageKey).not.toHaveBeenCalled();
    document.removeEventListener('keydown', onPageKey);
  });

  it('re-attaches if the page removes it', () => {
    view.host.remove();
    view.attach();
    expect(document.getElementById('hopback-root')).toBe(view.host);
  });
});
