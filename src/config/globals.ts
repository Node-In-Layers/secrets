import merge from 'lodash/merge.js'
import type { CommonContext, FeaturesContext } from '@node-in-layers/core'

import * as coreServices from '../core/services.js'
import { toServicesContextForSecrets } from '../context.js'
import { SecretsNamespace } from '../types.js'
import type { CoreServicesLayer, WithSecretsConfig } from '../core/types.js'
import * as configServices from './services.js'
import * as features from './features.js'
import type { ConfigServicesLayer } from './types.js'

/**
 * Resolves `type: 'nil-secret'` placeholders using core + config features.
 * Receives {@link CommonContext} only (globals run before layers). Use `secretServiceFactory` on
 * `[SecretsNamespace.Core]` when you need an explicit backend during globals; otherwise core defaults to json.
 */
const create = async (context: CommonContext<WithSecretsConfig>) => {
  const svcCtx = toServicesContextForSecrets(context)
  const core = coreServices.create(svcCtx)
  const configService = configServices.create(svcCtx)
  const f = features.create(
    merge({}, svcCtx, {
      features: {
        getFeatures: () => undefined,
      },
      services: {
        ...svcCtx.services,
        [SecretsNamespace.Core]: core,
        [SecretsNamespace.Config]: configService,
      },
    }) as FeaturesContext<
      WithSecretsConfig,
      ConfigServicesLayer & CoreServicesLayer
    >
  )
  const newConfig = await f.replaceSecretsConfigObjects(context.config)
  return {
    config: newConfig,
  }
}

export { create }
