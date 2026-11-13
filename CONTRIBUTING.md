# Contributing to HopBack

Thanks for helping. This project is small on purpose; contributions that keep it small, fast and private are the easiest to merge.

By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting set up

You need Node 20 or newer.

```bash
npm install
npx playwright install chromium
npm run build
```

Load `dist/` from `chrome://extensions` (Developer mode → Load unpacked). After changing code, run `npm run build` (or keep `npm run watch` running), then press the reload icon on the extension card and refresh the chat tab.

## Before you open a pull request

```bash
npm run check
```

This runs the typecheck, lint, unit tests and browser tests. CI runs the same thing. The build fails if `dist/content.js` goes over 20 KB; if you need more room, say why in the PR.

Please keep pull requests focused on one thing, add or update a test for behaviour you change, and re-run `npm run media` if you changed how the UI looks.

## Adding a site

1. Add an adapter to [`src/adapters/index.ts`](src/adapters/index.ts):

   ```ts
   {
     id: 'example',
     name: 'Example Chat',
     hosts: ['chat.example.com'],
     // Elements that wrap one user message. First selector that matches wins;
     // list a fallback if you can find a second stable hook.
     selectors: ['[data-role="user"]', '.user-message'],
     // Optional: where the text is, if the element also holds buttons or labels.
     textSelector: '.message-text',
     // Height of the sticky header, so a hop doesn't land underneath it.
     headerOffset: 64,
   }
   ```

   Prefer `data-*` attributes, test ids and custom element names over generated class names, which change on every deploy.

2. Add `https://chat.example.com/*` to `content_scripts.matches` in `manifest.json`. A unit test fails if the two lists disagree.

3. Add the site's message markup to [`tests/fixtures/sites.ts`](tests/fixtures/sites.ts). Copy the real structure around a user message and an assistant reply; leave out everything else. The unit and browser tests pick it up automatically.

4. Do the live check below and say in the PR that you did.

## Fixing a site that broke

Sites change their markup. When the button stops appearing somewhere, open the page's DevTools, find what now wraps a user message, update the adapter's `selectors` (keep the old one as a fallback if it might come back) and update the fixture to match.

## Live check

The automated tests run against stand-in pages, so they can't notice when a real site changes. For any adapter you add or touch, load the built extension and confirm on the real site:

- [ ] The button appears in a chat with questions and shows the right count
- [ ] The list shows each question's text, with nothing extra (no "You said", no button labels)
- [ ] Clicking the first, a middle and the last question lands on each, clear of the site's header
- [ ] Asking a new question adds it to the list
- [ ] Switching to another chat swaps the list; a brand new chat hides the button
- [ ] The panel matches the site in both light and dark mode
- [ ] <kbd>Alt</kbd> <kbd>J</kbd> and <kbd>Alt</kbd> <kbd>Shift</kbd> <kbd>↑</kbd>/<kbd>↓</kbd> work while the message box is focused

## Ground rules for the code

- No network requests, no analytics, no storing chat content.
- No new permissions without a discussion in an issue first.
- No runtime dependencies. Dev dependencies are fine when they earn their keep.
- No `innerHTML`: some supported sites enforce Trusted Types.

## Reporting bugs and asking for features

Use the [issue forms](https://github.com/sidDarthVader31/hopback/issues/new/choose). For anything security related, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.
