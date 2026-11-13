# Security Policy

## Supported versions

Only the latest release (and the `main` branch) receives fixes.

## Reporting a vulnerability

Please do not open a public issue for security problems.

Report privately through GitHub: go to the repository's **Security** tab and choose **Report a vulnerability**, or use [this link](https://github.com/sidDarthVader31/hopback/security/advisories/new).

Include what you found, how to reproduce it, and which site and browser you were using. You should get a reply within a week. Once a fix is released you will be credited in the release notes unless you would rather not be.

## Scope

HopBack runs as a content script on a fixed list of chat sites, reads the questions shown on the page, and makes no network requests. Things worth reporting include:

- Any way for a web page to make HopBack run script, inject markup, or act outside its own UI
- Any way chat content could leave the page or be persisted
- Anything that lets the extension run on sites outside its manifest
