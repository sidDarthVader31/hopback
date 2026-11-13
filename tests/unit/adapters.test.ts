import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { adapterFor, adapters } from '../../src/adapters';
import { questionText } from '../../src/core/text';
import { findQuestionElements } from '../../src/core/tracker';
import { CHATS, SITES, threadHtml } from '../fixtures/sites';

const turns = CHATS.kyoto!.turns;

beforeEach(() => {
  document.body.innerHTML = '';
});

describe.each(adapters)('$name adapter', (adapter) => {
  it('finds every question, in order, with clean text', () => {
    document.body.innerHTML = threadHtml(adapter.id, turns);
    const found = findQuestionElements(document, adapter);
    expect(found.map((el) => questionText(el, adapter))).toEqual(turns.map((t) => t.q));
  });

  it('finds nothing in an empty chat', () => {
    document.body.innerHTML = '<main><p>What can I help with?</p></main>';
    expect(findQuestionElements(document, adapter)).toEqual([]);
  });

  it('is reachable by every one of its hostnames', () => {
    for (const host of adapter.hosts) expect(adapterFor(host)).toBe(adapter);
  });

  it('has a fixture served from one of its hosts', () => {
    expect(adapter.hosts).toContain(new URL(SITES[adapter.id]!.origin).hostname);
  });
});

describe('adapter registry', () => {
  it('ignores unknown sites', () => {
    expect(adapterFor('example.com')).toBeUndefined();
  });

  it('matches the manifest exactly', () => {
    const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
    const matches: string[] = manifest.content_scripts[0].matches;
    const hosts = adapters.flatMap((a) => a.hosts).map((h) => `https://${h}/*`);
    expect([...matches].sort()).toEqual([...hosts].sort());
  });
});

describe('findQuestionElements', () => {
  const chatgpt = adapterFor('chatgpt.com')!;

  it('falls back to the next selector when the first matches nothing', () => {
    document.body.innerHTML = '<article data-turn="user">Old markup gone</article><article data-turn="assistant">Hi</article>';
    const found = findQuestionElements(document, chatgpt);
    expect(found.map((el) => el.textContent)).toEqual(['Old markup gone']);
  });

  it('keeps only the outermost of nested matches', () => {
    const perplexity = adapterFor('www.perplexity.ai')!;
    document.body.innerHTML = '<div class="group/query"><h1 class="group/query">One</h1></div><div class="group/query">Two</div>';
    expect(findQuestionElements(document, perplexity)).toHaveLength(2);
  });
});
