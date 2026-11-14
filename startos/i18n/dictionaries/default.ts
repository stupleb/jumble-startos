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
  'Your server fetches the title and image for links in the notes you read.': 10,
  'Choose whether your server fetches titles and images for links in notes. Off by default.': 11,
  "With link previews on, anyone who can open Jumble can make your server request web pages, and those sites see your server's IP address. That includes visitors over Tor, so leave this off if you publish Jumble to hide where your server is.": 12,
  'Choose whether your server fetches link previews': 13,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
