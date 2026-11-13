# Chrome Web Store listing

Everything to paste into the [Developer Dashboard](https://chrome.google.com/webstore/devconsole). Upload `release/hopback-<version>.zip` (made by `npm run zip`), then fill in the three tabs below.

## Store listing tab

**Name** (comes from the manifest)

    HopBack: Jump to Your Questions in AI Chats

**Summary** (comes from the manifest, 131 of 132 characters)

    Hop back to any question you asked in ChatGPT, Claude, Gemini, Perplexity, DeepSeek, Grok and Copilot. No data leaves your browser.

**Description**

    Long AI answers bury your questions. HopBack brings them back.

    You ask something, the AI writes four screens. You ask a follow-up, it writes five more. Ten questions in, finding "that thing I asked earlier" means dragging the scrollbar and squinting.

    HopBack adds one small button to the side of the chat. Click it to see every question you asked in that conversation, then click a question to go straight to it.

    WHAT IT DOES

    • Lists every question you asked in the current chat, in order
    • Takes you to any question with one click and briefly highlights it so your eye lands in the right place
    • Lets you search your questions as you type
    • Shows which question you are currently reading
    • Works for old chats too, including ones from before you installed it
    • Follows you when you switch to another chat
    • Matches the light or dark look of the site you are on
    • Stays out of the way: drag the button up or down and it remembers

    KEYBOARD SHORTCUTS

    • Alt + J (Option + J on Mac): open or close the list
    • Arrow keys and Enter: pick a question
    • Alt + Shift + Up / Down: go to the previous or next question without opening the list

    WORKS WITH

    ChatGPT, Claude, Gemini, Perplexity, DeepSeek, Grok and Microsoft Copilot.

    PRIVATE BY DESIGN

    • No data is collected, stored or sent anywhere
    • No account, no sign-up, no tracking
    • Your questions are read from the page only to show you the list, and are never saved
    • Free and open source: https://github.com/sidDarthVader31/hopback

    These sites change often. If the button stops appearing on one of them, please report it at https://github.com/sidDarthVader31/hopback/issues and it will be fixed.

    HopBack is an independent project. It is not affiliated with or endorsed by OpenAI, Anthropic, Google, Perplexity, DeepSeek, xAI or Microsoft.

**Category:** Tools (under Productivity)

**Language:** English

**Graphic assets** (all in this folder)

| Slot | File |
| --- | --- |
| Store icon, 128×128 | `icons/icon-128.png` (also inside the zip) |
| Screenshots, 1280×800 | `screenshot-1-list.png` to `screenshot-5-other-chat.png`, in that order |
| Small promo tile, 440×280 | `promo-small-440x280.png` |
| Marquee promo tile, 1400×560 | `promo-marquee-1400x560.png` |

**Additional fields**

- Homepage URL: `https://github.com/sidDarthVader31/hopback`
- Support URL: `https://github.com/sidDarthVader31/hopback/issues`
- Mature content: No

## Privacy practices tab

**Single purpose**

    HopBack helps you navigate long AI chat conversations: it lists the questions you asked in the current chat and scrolls the page to the one you select.

**Permission justification: storage**

    Used only to remember the vertical position of the HopBack button after the user drags it, so it stays where they put it. No other data is stored.

**Permission justification: host permissions** (the sites in `content_scripts.matches`)

    HopBack runs only on the listed AI chat sites. On those pages it needs to find the messages the user sent, in order to list them, and to add its button and question list to the page. It does not run on or access any other site, and makes no network requests.

**Are you using remote code?**

    No, I am not using remote code.

**Data usage**

- What user data do you collect: leave every box unchecked. HopBack reads the user's own questions from the page to display them back to the user, but does not collect, store or transmit them.
- Certify all three statements:
  - I do not sell or transfer user data to third parties, outside of the approved use cases
  - I do not use or transfer user data for purposes that are unrelated to my item's single purpose
  - I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL**

    https://github.com/sidDarthVader31/hopback/blob/main/PRIVACY.md

## Distribution tab

- Payments: Free of charge
- Visibility: Public
- Regions: All regions

## Test instructions (for the reviewer)

    No account is needed. Open https://chatgpt.com, send two or three messages, and a round HopBack button appears on the right edge of the page showing the number of questions. Click it to see the list, click a question to scroll to it. Alt+J also opens the list. The button is hidden on pages with no conversation.

## Before each release

1. Bump `version` in `manifest.json` and `package.json`.
2. `npm run check`
3. `npm run zip`
4. Upload the new zip in the dashboard's Package tab and submit for review.
