export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting Jumble!': 0,
  'Web Interface': 1,
  'The web interface is ready': 2,
  'The web interface is not ready': 3,
  'Link Previews': 4,
  'The link preview service is ready': 5,
  'The link preview service is not ready': 6,

  // interfaces.ts
  'Web UI': 7,
  'The Jumble Nostr client': 8,

  // actions/linkPreviews.ts, init/linkPreviewsTask.ts
  'Fetch link previews': 9,
  "Your server fetches the title and image for links in notes. Anyone who can open Jumble can use this to learn your server's IP address.": 10,
  'Choose whether your server fetches titles and images for links in notes. Off by default.': 11,
  "Anyone who can open Jumble, over Tor too, can use link previews to learn your server's IP address by linking to a site they run. They can also have your server load web pages of their choosing, and those requests come from your IP address, not theirs. Leave this off unless only people you trust can reach Jumble, or you intend to run a public instance anyway.": 12,
  "Choose whether to turn on link previews, which can reveal your server's IP address": 13,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
