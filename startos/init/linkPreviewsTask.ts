import { linkPreviews } from '../actions/linkPreviews'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const linkPreviewsTask = sdk.setupOnInit(async (effects) => {
  const chosen = await storeJson
    .read((s) => s.linkPreviews !== undefined)
    .const(effects)

  if (chosen) {
    await sdk.action.clearTask(effects, 'jumble:link-previews')
  } else {
    await sdk.action.createOwnTask(effects, linkPreviews, 'important', {
      reason: i18n('Choose whether your server fetches link previews'),
    })
  }
})
