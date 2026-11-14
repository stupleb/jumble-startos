import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'jumble',
  title: 'Jumble',
  license: 'MIT',
  packageRepo: 'https://github.com/stupleb/jumble-startos',
  upstreamRepo: 'https://github.com/CodyTseng/jumble',
  marketingUrl: 'https://jumble.social',
  donationUrl: null,
  description: { short, long },
  volumes: ['main'],
  images: {
    jumble: {
      source: { dockerBuild: { dockerfile: 'Dockerfile' } },
      arch: ['x86_64', 'aarch64'],
    },
  },
})
