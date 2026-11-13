/**
 * Stand-in pages for each supported site.
 *
 * Each template reproduces the markup the real site uses around a user
 * message and an assistant reply (only the parts HopBack relies on), inside a
 * neutral chat layout. They let the tests run without accounts or network, but
 * they cannot prove the real sites still look like this: see the live checklist
 * in CONTRIBUTING.md.
 */

export interface Turn {
  q: string;
  /** Answer paragraphs. */
  a: string[];
}

export interface SiteFixture {
  /** Origin the page is served from in e2e tests. */
  origin: string;
  /** {{TEXT}} = escaped question, {{I}} = turn number. */
  user: string;
  /** {{HTML}} = answer markup, {{I}} = turn number. */
  assistant: string;
}

export const SITES: Record<string, SiteFixture> = {
  chatgpt: {
    origin: 'https://chatgpt.com',
    user: '<li id="u{{I}}" data-message-role="user"><div data-submit-message-animation-target=""><div><div data-user-message-bubble=""><p data-user-message-copy="">{{TEXT}}</p></div></div></div></li>',
    assistant: '<li id="a{{I}}" data-message-role="assistant"><div class="markdown">{{HTML}}</div></li>',
  },
  claude: {
    origin: 'https://claude.ai',
    user: '<div data-test-render-count="1"><div class="group"><div data-testid="user-message" class="font-user-message"><p class="whitespace-pre-wrap">{{TEXT}}</p></div></div></div>',
    assistant: '<div data-test-render-count="1"><div class="font-claude-response">{{HTML}}</div></div>',
  },
  gemini: {
    origin: 'https://gemini.google.com',
    user: '<user-query><span class="user-query-container"><user-query-content class="user-query-container"><div class="user-query-container"><div class="query-content" id="user-query-content-{{I}}"><span class="user-query-bubble-with-background"><div class="query-text" dir="ltr"><h5 class="cdk-visually-hidden screen-reader-user-query-label">You said {{TEXT}}</h5><p class="query-text-line">{{TEXT}}</p></div></span></div></div></user-query-content></span></user-query>',
    assistant: '<model-response><message-content>{{HTML}}</message-content></model-response>',
  },
  perplexity: {
    origin: 'https://www.perplexity.ai',
    user: '<div class="group/user-bubble flex min-w-0 justify-end"><div data-message-bubble="right" class="min-w-0 whitespace-pre-wrap"><div data-renderer="lm"><p class="my-2">{{TEXT}}</p></div></div></div>',
    assistant: '<div class="prose">{{HTML}}</div>',
  },
  deepseek: {
    origin: 'https://chat.deepseek.com',
    user: '<div class="fbb737a4" data-um-id="um-{{I}}">{{TEXT}}</div>',
    assistant: '<div class="ds-markdown">{{HTML}}</div>',
  },
  grok: {
    origin: 'https://grok.com',
    user: '<div class="relative group flex flex-col justify-center w-full items-end"><div dir="auto" role="article" data-testid="user-message" class="message-bubble"><h2 class="sr-only" id="l{{I}}">You</h2><p class="py-2">{{TEXT}}</p></div></div>',
    assistant: '<div class="relative group flex flex-col justify-center w-full items-start"><div class="message-bubble">{{HTML}}</div></div>',
  },
  copilot: {
    origin: 'https://copilot.microsoft.com',
    user: '<div data-content="user-message">{{TEXT}}</div>',
    assistant: '<div data-content="ai-message">{{HTML}}</div>',
  },
};

const para = (topic: string) => [
  `Here is how I would think about ${topic}. Start with what you already know and what you can check quickly, then decide what is worth the extra effort.`,
  'In practice the simplest option is usually right. Pick it, try it for a day, and only add more when you notice something missing.',
  'A few details matter more than the rest: timing, how much you want to carry with you, and what you would regret skipping. Everything else can be adjusted along the way.',
  'If plans change, nothing here is hard to undo. Keep the first and last steps fixed and stay flexible about the middle.',
  'Tell me a bit more about your constraints and I can tighten this up into something concrete.',
];

/** Made-up conversations used by tests and README media. */
export const CHATS: Record<string, { title: string; turns: Turn[] }> = {
  kyoto: {
    title: 'Kyoto in autumn',
    turns: [
      { q: 'I have five days in Kyoto in November. Where should I start?', a: para('a first visit') },
      { q: 'Which temples are worth the early alarm?', a: para('beating the crowds') },
      { q: 'Is a rail pass worth it if I only do one day trip to Nara?', a: para('rail passes') },
      { q: 'Suggest a rainy day plan that is not just museums', a: para('a wet afternoon') },
      { q: 'What should I book ahead and what can I leave to the day?', a: para('reservations') },
      { q: 'Where do locals actually go to see the autumn leaves?', a: para('quieter spots for autumn colour') },
      { q: 'How much cash should I carry?', a: para('paying for things') },
      { q: 'Turn all of this into a day by day itinerary', a: para('putting the days together') },
    ],
  },
  sourdough: {
    title: 'Sourdough troubleshooting',
    turns: [
      { q: 'Why is my sourdough so dense?', a: para('a tight crumb') },
      { q: 'How do I know when the starter is ready to use?', a: para('reading your starter') },
      { q: 'Can I proof the dough overnight in the fridge?', a: para('a cold proof') },
    ],
  },
  empty: { title: 'New chat', turns: [] },
};

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function turnHtml(site: SiteFixture, turn: Turn, i: number): string {
  const user = site.user.replaceAll('{{TEXT}}', escapeHtml(turn.q)).replaceAll('{{I}}', String(i));
  const answer = turn.a.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
  const assistant = site.assistant.replaceAll('{{HTML}}', answer).replaceAll('{{I}}', String(i));
  return `<div class="row-user">${user}</div><div class="row-assistant">${assistant}</div>`;
}

export function threadHtml(siteId: string, turns: Turn[]): string {
  const site = SITES[siteId]!;
  return turns.map((t, i) => turnHtml(site, t, i + 1)).join('');
}

const PAGE_CSS = `
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body { display: flex; font: 16px/1.65 ui-sans-serif, system-ui, -apple-system, sans-serif; background: #fff; color: #1f1f23; }
  body.dark { background: #17171a; color: #e8e8ec; }
  aside { width: 232px; flex: none; padding: 16px 10px; background: #f6f6f7; border-right: 1px solid rgba(0,0,0,.06); }
  .dark aside { background: #1e1e22; border-color: rgba(255,255,255,.06); }
  aside h3 { margin: 4px 10px 10px; font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; opacity: .55; }
  aside a { display: block; padding: 8px 10px; border-radius: 8px; color: inherit; text-decoration: none; font-size: 14px; cursor: pointer; }
  aside a.on { background: rgba(0,0,0,.07); font-weight: 550; }
  .dark aside a.on { background: rgba(255,255,255,.09); }
  .col { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  header { flex: none; height: 56px; display: flex; align-items: center; padding: 0 24px; font-weight: 600; border-bottom: 1px solid rgba(0,0,0,.06); }
  .dark header { border-color: rgba(255,255,255,.06); }
  main { flex: 1; overflow-y: auto; }
  #thread { max-width: 720px; margin: 0 auto; padding: 24px 24px 40px; }
  ol, li { list-style: none; margin: 0; padding: 0; }
  .row-user { display: flex; justify-content: flex-end; margin: 28px 0 14px; }
  .row-user > * { display: block; max-width: 80%; padding: 10px 16px; border-radius: 20px; background: #f0f0f2; }
  .dark .row-user > * { background: #2b2b31; }
  .row-user * { margin: 0; font: inherit; }
  .row-assistant p { margin: 0 0 16px; }
  .cdk-visually-hidden, .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .composer { flex: none; max-width: 720px; width: calc(100% - 48px); margin: 0 auto 20px; padding: 14px 18px; border-radius: 24px; background: #f0f0f2; opacity: .8; font-size: 15px; }
  .dark .composer { background: #2b2b31; }
  .welcome { padding: 20vh 0; text-align: center; font-size: 26px; font-weight: 600; opacity: .7; }
`;

/** A full page for one site: sidebar of chats, scrolling thread, and test hooks on `window`. */
export function pageHtml(siteId: string, chatId = 'kyoto'): string {
  const site = SITES[siteId]!;
  const data = JSON.stringify({ site, chats: CHATS }).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Chat</title><style>${PAGE_CSS}</style></head>
<body>
<aside><h3>Chats</h3><nav id="chats"></nav></aside>
<div class="col">
  <header id="title"></header>
  <main id="scroller"><div id="thread"></div></main>
  <div class="composer">Ask anything</div>
</div>
<script>
  const { site, chats } = ${data};
  const thread = document.getElementById('thread');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let n = 0;
  const turnHtml = (t) => {
    const i = ++n;
    const user = site.user.replaceAll('{{TEXT}}', esc(t.q)).replaceAll('{{I}}', i);
    const assistant = site.assistant.replaceAll('{{HTML}}', t.a.map((p) => '<p>' + esc(p) + '</p>').join('')).replaceAll('{{I}}', i);
    return '<div class="row-user">' + user + '</div><div class="row-assistant">' + assistant + '</div>';
  };
  const render = (id) => {
    const chat = chats[id];
    document.getElementById('title').textContent = chat.title;
    thread.innerHTML = chat.turns.length ? chat.turns.map(turnHtml).join('') : '<div class="welcome">What can I help with?</div>';
    document.getElementById('scroller').scrollTop = 0;
    document.getElementById('chats').innerHTML = Object.entries(chats)
      .map(([key, c]) => '<a data-chat="' + key + '"' + (key === id ? ' class="on"' : '') + '>' + esc(c.title) + '</a>').join('');
  };
  window.__switchChat = (id) => { history.pushState({}, '', '/c/' + id); render(id); };
  window.__addTurn = (q, a) => thread.insertAdjacentHTML('beforeend', turnHtml({ q, a: [a] }));
  window.__prependTurn = (q, a) => thread.insertAdjacentHTML('afterbegin', turnHtml({ q, a: [a] }));
  window.__setDark = (on) => document.body.classList.toggle('dark', on);
  document.getElementById('chats').addEventListener('click', (e) => {
    const id = e.target.dataset.chat;
    if (id) window.__switchChat(id);
  });
  render(${JSON.stringify(chatId)});
</script>
</body>
</html>`;
}
