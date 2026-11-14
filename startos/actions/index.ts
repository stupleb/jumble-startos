import { sdk } from '../sdk'
import { linkPreviews } from './linkPreviews'

export const actions = sdk.Actions.of().addAction(linkPreviews)
