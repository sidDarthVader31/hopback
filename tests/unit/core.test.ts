import { describe, expect, it } from 'vitest';
import { adapterFor } from '../../src/adapters';
import { filterQuestions } from '../../src/core/filter';
import { currentIndex, hopTarget } from '../../src/core/spy';
import { normalise, questionText } from '../../src/core/text';
import type { Question } from '../../src/core/tracker';
import { highlight } from '../../src/ui/dom';
import { isDarkColor, parseRgb } from '../../src/ui/theme';

const el = (html: string): HTMLElement => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div;
};
const chatgpt = adapterFor('chatgpt.com')!;
const gemini = adapterFor('gemini.google.com')!;

describe('questionText', () => {
  it('collapses whitespace and newlines', () => {
    expect(normalise('  a\n\n b\t c ')).toBe('a b c');
    expect(questionText(el('<p>line one</p>\n<p>line   two</p>'), chatgpt)).toBe('line one line two');
  });

  it('truncates very long questions', () => {
    const text = questionText(el('x'.repeat(1000)), chatgpt);
    expect(text).toHaveLength(301);
    expect(text.endsWith('…')).toBe(true);
  });

  it('labels messages with no text', () => {
    expect(questionText(el('<img src="a.png">'), chatgpt)).toBe('Image');
    expect(questionText(el('<div class="file"></div>'), chatgpt)).toBe('Attachment');
  });

  it('drops screen-reader labels without touching the page', () => {
    const grok = adapterFor('grok.com')!;
    const bubble = el('<h2 class="sr-only">You</h2><p>Hello</p>');
    expect(questionText(bubble, grok)).toBe('Hello');
    expect(bubble.querySelector('.sr-only')).not.toBeNull();
  });

  it('reads only the text node the adapter points at', () => {
    expect(questionText(el('<span>You said</span><div class="query-text">Hello</div>'), gemini)).toBe('Hello');
  });
});

describe('filterQuestions', () => {
  const qs = ['How do I bake bread?', 'Best flour for pizza', 'Bread storage tips'].map((text, index) => ({ id: `q${index}`, index, text }) as Question);

  it('returns everything for an empty query', () => {
    expect(filterQuestions(qs, '  ')).toBe(qs);
  });

  it('matches case-insensitively and keeps original indexes', () => {
    expect(filterQuestions(qs, 'BREAD').map((q) => q.index)).toEqual([0, 2]);
  });

  it('requires every term', () => {
    expect(filterQuestions(qs, 'bread tips').map((q) => q.index)).toEqual([2]);
    expect(filterQuestions(qs, 'bread pizza')).toEqual([]);
  });
});

describe('scroll position', () => {
  it('finds the question being read', () => {
    expect(currentIndex([-900, -200, 600, 1400], 400)).toBe(1);
    expect(currentIndex([500, 900], 400)).toBe(-1);
    expect(currentIndex([], 400)).toBe(-1);
  });

  it('hops forward to the next question', () => {
    expect(hopTarget([-900, 64, 800], 64, 1)).toBe(2);
    expect(hopTarget([200, 900], 64, 1)).toBe(0);
    expect(hopTarget([-900, 64], 64, 1)).toBe(-1);
  });

  it('hops back to the start of the current answer first, then the one before', () => {
    expect(hopTarget([-900, -300, 800], 64, -1)).toBe(1);
    expect(hopTarget([-900, 64, 800], 64, -1)).toBe(0);
    expect(hopTarget([64, 800], 64, -1)).toBe(-1);
    expect(hopTarget([300, 800], 64, -1)).toBe(-1);
  });
});

describe('theme detection', () => {
  it('parses computed colours', () => {
    expect(parseRgb('rgb(255, 255, 255)')).toEqual([255, 255, 255, 1]);
    expect(parseRgb('rgba(0, 0, 0, 0)')).toEqual([0, 0, 0, 0]);
    expect(parseRgb('rgb(33 33 33 / 0.9)')).toEqual([33, 33, 33, 0.9]);
    expect(parseRgb('transparent')).toBeNull();
  });

  it('classifies backgrounds', () => {
    expect(isDarkColor('rgb(255, 255, 255)')).toBe(false);
    expect(isDarkColor('rgb(33, 33, 33)')).toBe(true);
    expect(isDarkColor('rgba(0, 0, 0, 0)')).toBeNull();
  });

  it('understands the other colour formats browsers report', () => {
    // Seen live: ChatGPT reports oklch, Perplexity color(srgb …).
    expect(isDarkColor('oklch(0.991069 0 none)')).toBe(false);
    expect(isDarkColor('oklch(0.21 0.006 285)')).toBe(true);
    expect(isDarkColor('oklch(21% 0.006 285)')).toBe(true);
    expect(isDarkColor('color(srgb 0.984314 0.984314 0.984314)')).toBe(false);
    expect(isDarkColor('color(srgb 0.1 0.1 0.12)')).toBe(true);
    expect(isDarkColor('lab(98 0 0)')).toBe(false);
    expect(isDarkColor('lab(12 0 0)')).toBe(true);
    expect(isDarkColor('oklch(0.2 0 0 / 0)')).toBeNull();
    expect(isDarkColor('transparent')).toBeNull();
  });
});

describe('highlight', () => {
  const render = (text: string, terms: string[]) => {
    const div = document.createElement('div');
    div.append(...highlight(text, terms));
    return div.innerHTML;
  };

  it('wraps matches, keeping the original casing', () => {
    expect(render('Bread and more bread', ['bread'])).toBe('<mark>Bread</mark> and more <mark>bread</mark>');
  });

  it('treats search text literally and never as markup', () => {
    expect(render('a+b <b>', ['a+b'])).toBe('<mark>a+b</mark> &lt;b&gt;');
    expect(render('plain', [])).toBe('plain');
  });
});
