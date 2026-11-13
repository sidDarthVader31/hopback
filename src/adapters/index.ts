import type { SiteAdapter } from './types';

export const adapters: SiteAdapter[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    hosts: ['chatgpt.com', 'chat.openai.com'],
    // Checked live 2026-11. The signed-in and signed-out apps are built differently; the one
    // thing they share is the bubble around the user's text, so that comes first.
    // Signed out: <li data-message-role="user">. Signed in: <div data-chatgpt-search-unit-key="…:user">.
    // The older data-message-author-role markup is kept as a last fallback.
    selectors: [
      '[data-user-message-bubble]',
      '[data-message-role="user"]',
      '[data-chatgpt-search-unit-key$=":user"]',
      '[data-message-author-role="user"]',
      'article[data-turn="user"]',
    ],
    textSelector: '[data-user-message-bubble]',
    ignore: '[data-conversation-role], .sr-only',
    headerOffset: 64,
  },
  {
    id: 'claude',
    name: 'Claude',
    hosts: ['claude.ai'],
    selectors: ['[data-testid="user-message"]', '.font-user-message'],
    headerOffset: 64,
  },
  {
    id: 'gemini',
    name: 'Gemini',
    hosts: ['gemini.google.com'],
    // Checked live 2026-11. The "You said" label lives inside .query-text.
    selectors: ['user-query', '.user-query-container'],
    textSelector: '.query-text',
    ignore: '.cdk-visually-hidden',
    headerOffset: 72,
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    hosts: ['www.perplexity.ai'],
    // Checked live 2026-11. group/query is the older heading-style markup.
    selectors: ['[data-message-bubble="right"]', '[class*="group/user-bubble"]', '[class*="group/query"]'],
    headerOffset: 72,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    hosts: ['chat.deepseek.com'],
    selectors: ['[data-um-id]', '.fbb737a4'],
    headerOffset: 64,
  },
  {
    id: 'grok',
    name: 'Grok',
    hosts: ['grok.com'],
    // Checked live 2026-11. Each bubble starts with a screen-reader "You" heading.
    selectors: ['.message-bubble[data-testid="user-message"]', '.items-end > .message-bubble'],
    ignore: '.sr-only',
    headerOffset: 64,
  },
  {
    id: 'copilot',
    name: 'Copilot',
    hosts: ['copilot.microsoft.com', 'copilot.com'],
    selectors: ['[data-content="user-message"]', '[data-testid="user-message"]'],
    headerOffset: 64,
  },
];

export function adapterFor(hostname: string): SiteAdapter | undefined {
  return adapters.find((a) => a.hosts.includes(hostname));
}
