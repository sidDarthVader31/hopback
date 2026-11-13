import type { SiteAdapter } from './types';

export const adapters: SiteAdapter[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    hosts: ['chatgpt.com', 'chat.openai.com'],
    selectors: ['[data-message-author-role="user"]', 'article[data-turn="user"]'],
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
    selectors: ['user-query', '.user-query-container'],
    textSelector: '.query-text',
    headerOffset: 72,
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    hosts: ['www.perplexity.ai'],
    selectors: ['[class*="group/query"]', '[data-testid="query-text"]'],
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
    selectors: ['div[id^="response-"].items-end .message-bubble', '.items-end > .message-bubble'],
    headerOffset: 64,
  },
  {
    id: 'copilot',
    name: 'Copilot',
    hosts: ['copilot.microsoft.com'],
    selectors: ['[data-content="user-message"]', '[data-testid="user-message"]'],
    headerOffset: 64,
  },
];

export function adapterFor(hostname: string): SiteAdapter | undefined {
  return adapters.find((a) => a.hosts.includes(hostname));
}
