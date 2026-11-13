import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { adapterFor } from '../../src/adapters';
import { Tracker, type ChangeInfo, type Question } from '../../src/core/tracker';
import { CHATS, SITES, threadHtml, turnHtml } from '../fixtures/sites';

const adapter = adapterFor('claude.ai')!;
const site = SITES.claude!;
const settle = () => new Promise((resolve) => setTimeout(resolve, 60));

let tracker: Tracker;
let onChange: ReturnType<typeof vi.fn<(questions: Question[], info: ChangeInfo) => void>>;

beforeEach(() => {
  history.replaceState({}, '', '/chat/one');
  document.body.innerHTML = `<div id="thread">${threadHtml('claude', CHATS.sourdough!.turns)}</div>`;
  onChange = vi.fn();
  tracker = new Tracker(adapter, onChange, window, 10);
  tracker.start();
});

afterEach(() => tracker.stop());

describe('Tracker', () => {
  it('reports the questions already on the page', () => {
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(tracker.questions.map((q) => q.text)).toEqual(CHATS.sourdough!.turns.map((t) => t.q));
    expect(tracker.questions.map((q) => q.index)).toEqual([0, 1, 2]);
  });

  it('picks up a new question as it is added', async () => {
    document.getElementById('thread')!.insertAdjacentHTML('beforeend', turnHtml(site, { q: 'And the crust?', a: ['…'] }, 9));
    await settle();
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(tracker.questions.at(-1)!.text).toBe('And the crust?');
  });

  it('stays quiet while an answer streams in', async () => {
    const answer = document.querySelector('.font-claude-response')!;
    for (let i = 0; i < 5; i++) answer.append(document.createTextNode(' more words'));
    await settle();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('keeps ids stable when earlier messages are loaded above', async () => {
    const before = tracker.questions.map((q) => q.id);
    document.getElementById('thread')!.insertAdjacentHTML('afterbegin', turnHtml(site, { q: 'Older question', a: ['…'] }, 0));
    await settle();
    expect(tracker.questions[0]!.text).toBe('Older question');
    expect(tracker.questions.slice(1).map((q) => q.id)).toEqual(before);
    expect(tracker.questions.map((q) => q.index)).toEqual([0, 1, 2, 3]);
  });

  it('notices an edited question', async () => {
    document.querySelector('[data-testid="user-message"] p')!.textContent = 'Why is my loaf flat?';
    await settle();
    expect(tracker.questions[0]!.text).toBe('Why is my loaf flat?');
  });

  it('flags a switch to another conversation', async () => {
    history.pushState({}, '', '/chat/two');
    document.getElementById('thread')!.innerHTML = threadHtml('claude', CHATS.kyoto!.turns);
    await settle();
    expect(onChange.mock.lastCall![1]).toEqual({ conversationChanged: true });
    expect(tracker.questions).toHaveLength(CHATS.kyoto!.turns.length);
  });

  it('empties the list for a new chat', async () => {
    history.pushState({}, '', '/new');
    document.getElementById('thread')!.innerHTML = '';
    await settle();
    expect(tracker.questions).toEqual([]);
  });

  it('stops watching after stop()', async () => {
    tracker.stop();
    document.getElementById('thread')!.innerHTML = '';
    await settle();
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
