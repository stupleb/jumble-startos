import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import { previewPort, uiPort } from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Jumble!'))

  const previewsOn =
    (await storeJson.read((s) => s.linkPreviews).const(effects)) === true

  return sdk.Daemons.of(effects)
    .addDaemon('preview', {
      subcontainer: sdk.SubContainer.of(
        effects,
        { imageId: 'jumble' },
        null,
        'preview',
      ),
      exec: {
        command: ['jumble-preview'],
        env: {
          LISTEN: `127.0.0.1:${previewPort}`,
          PREVIEWS: previewsOn ? 'on' : 'off',
        },
        user: 'nobody',
      },
      ready: {
        display: previewsOn ? i18n('Link Previews') : null,
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, previewPort, {
            successMessage: i18n('The link preview service is ready'),
            errorMessage: i18n('The link preview service is not ready'),
          }),
      },
      requires: [],
    })
    .addDaemon('web', {
      subcontainer: sdk.SubContainer.of(
        effects,
        { imageId: 'jumble' },
        null,
        'web',
      ),
      exec: { command: ['nginx', '-g', 'daemon off;'] },
      ready: {
        display: i18n('Web Interface'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: i18n('The web interface is ready'),
            errorMessage: i18n('The web interface is not ready'),
          }),
      },
      requires: [],
    })
})
