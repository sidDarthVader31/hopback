/**
 * Everything HopBack needs to know about one chat site.
 * Adapters are plain data so adding a site is a few lines.
 */
export interface SiteAdapter {
  /** Short stable id, e.g. "chatgpt". */
  id: string;
  /** Human readable name. */
  name: string;
  /** Hostnames this adapter handles (exact match). */
  hosts: string[];
  /**
   * CSS selectors for the element wrapping one user message, in priority order.
   * The first selector that matches anything wins, so later entries act as
   * fallbacks when a site changes its markup.
   */
  selectors: string[];
  /** Optional selector, relative to a message element, for the node holding the text. */
  textSelector?: string;
  /** Selector for screen-reader labels and other nodes inside a message that are not part of what the user typed. */
  ignore?: string;
  /** Height in px of the site's sticky header, so a hop doesn't land underneath it. */
  headerOffset?: number;
  /** Identifies the open conversation. Defaults to the URL path. */
  conversationKey?: (url: URL) => string;
}
