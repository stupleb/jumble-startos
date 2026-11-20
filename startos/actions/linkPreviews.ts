import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  enabled: Value.toggle({
    name: i18n('Fetch link previews'),
    description: i18n(
      "Your server fetches the title and image for links in notes. Anyone who can open Jumble can use this to learn your server's IP address.",
    ),
    default: false,
  }),
})

export const linkPreviews = sdk.Action.withInput(
  // id
  'link-previews',

  // metadata
  async ({ effects }) => ({
    name: i18n('Link Previews'),
    description: i18n(
      'Choose whether your server fetches titles and images for links in notes. Off by default.',
    ),
    warning: i18n(
      "Anyone who can open Jumble, over Tor too, can use link previews to learn your server's IP address by linking to a site they run. They can also have your server load web pages of their choosing, and those requests come from your IP address, not theirs. Leave this off unless only people you trust can reach Jumble, or you intend to run a public instance anyway.",
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // input spec
  inputSpec,

  // pre-fill
  async ({ effects }) => ({
    enabled: (await storeJson.read((s) => s.linkPreviews).once()) === true,
  }),

  // execution
  async ({ effects, input }) =>
    storeJson.merge(effects, { linkPreviews: input.enabled }),
)
