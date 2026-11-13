import { adapterFor } from './adapters';
import type { SiteAdapter } from './adapters/types';
import { jumpTo, scrollParent } from './core/jump';
import { currentIndex, hopTarget } from './core/spy';
import { Tracker } from './core/tracker';
import { detectDark } from './ui/theme';
import { HOST_ID, View } from './ui/view';

const POSITION_KEY = 'fabY';
const storage = typeof chrome !== 'undefined' ? chrome.storage?.local : undefined;

function main(adapter: SiteAdapter): void {
  // A reloaded extension leaves its old UI behind in already-open tabs.
  document.getElementById(HOST_ID)?.remove();

  const offset = adapter.headerOffset ?? 72;

  /** Top of each question relative to the top of the area that scrolls. */
  const tops = (): number[] => {
    const first = tracker.questions[0];
    if (!first) return [];
    const scroller = scrollParent(first.el);
    const base = scroller === document.scrollingElement ? 0 : scroller.getBoundingClientRect().top;
    return tracker.questions.map((q) => q.el.getBoundingClientRect().top - base);
  };

  const jump = (index: number): void => {
    // Virtualised lists may have swapped the element out; find it again by position.
    if (!tracker.questions[index]?.el.isConnected) tracker.scan();
    const question = tracker.questions[index];
    if (question) jumpTo(question.el, offset);
  };

  /** For sites that load history lazily: scroll to the top until nothing new appears. */
  const loadEarlier = async (): Promise<void> => {
    let seen = -1;
    for (let round = 0; round < 40 && tracker.questions.length !== seen; round++) {
      seen = tracker.questions.length;
      const first = tracker.questions[0];
      if (!first) return;
      scrollParent(first.el).scrollTop = 0;
      await new Promise((resolve) => setTimeout(resolve, 600));
      tracker.scan();
    }
    jump(0);
  };

  const view = new View({
    onJump: (question) => jump(question.index),
    onLoadEarlier: () => void loadEarlier(),
    currentIndex: () => currentIndex(tops(), window.innerHeight / 2),
    isDark: () => detectDark(),
    onMove: (y) => void storage?.set({ [POSITION_KEY]: y }),
  });

  const tracker = new Tracker(adapter, (questions, info) => {
    if (info.conversationChanged) view.close();
    view.attach();
    view.setQuestions(questions);
  });

  void storage?.get(POSITION_KEY).then((saved) => {
    const y = saved[POSITION_KEY];
    if (typeof y === 'number') view.setY(y);
  });

  window.addEventListener(
    'keydown',
    (e) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || !tracker.questions.length) return;
      if (e.code === 'KeyJ' && !e.shiftKey) {
        view.toggle();
      } else if (e.shiftKey && (e.code === 'ArrowUp' || e.code === 'ArrowDown')) {
        const target = hopTarget(tops(), offset, e.code === 'ArrowUp' ? -1 : 1);
        if (target >= 0) jump(target);
      } else {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
    },
    true,
  );

  view.attach();
  tracker.start();
}

const adapter = adapterFor(location.hostname);
if (adapter) main(adapter);
