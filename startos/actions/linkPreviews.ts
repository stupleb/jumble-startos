import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  enabled: Value.toggle({
    name: i18n('Fetch link previews'),
    description: i18n(
      'Your server fetches the title and image for links in the notes you read.',
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
      "With link previews on, anyone who can open Jumble can make your server request web pages, and those sites see your server's IP address. That includes visitors over Tor, so leave this off if you publish Jumble to hide where your server is.",
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
