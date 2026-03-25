import type { Config, CommonContext } from '@node-in-layers/core'
import { memoizeValue, ServicesContext } from '@node-in-layers/core/index.js'
import type { JsonObj } from 'functional-models'

import * as jsonServices from '../json/services.js'
import { SecretsNamespace } from '../types.js'
import type {
  FullSecretsService,
  GetSecretProps,
  SecretsConfig,
  SecretsService,
  WithSecretsConfig,
} from './types.js'

const mergeJsonDefaults = (base: SecretsService): FullSecretsService => {
  const getStoredSecret = base.getStoredSecret.bind(base)
  const storeSecret =
    base.storeSecret ||
    (() => Promise.reject(new Error('Not implemented')) as Promise<void>)
  const storeSecretJson =
    base.storeSecretJson ||
    (async props => {
      const asString = JSON.stringify(props.value)
      await storeSecret({
        ...props,
        value: asString,
      })
    })
  const getStoredJsonSecret =
    base.getStoredJsonSecret ||
    (async <T extends JsonObj = JsonObj>(props: GetSecretProps) => {
      const asString = await getStoredSecret(props)
      return JSON.parse(asString) as T
    })

  return {
    getStoredSecret,
    storeSecret,
    storeSecretJson,
    getStoredJsonSecret,
  }
}

const resolveRawSecretsService = async (
  secretsConfig: SecretsConfig,
  commonGlobals: CommonContext,
  context: ServicesContext<WithSecretsConfig>
): Promise<SecretsService> =>
  secretsConfig.secretServiceFactory
    ? Promise.resolve(secretsConfig.secretServiceFactory(commonGlobals))
    : jsonServices.create(context as ServicesContext<Config>)

export const create = (
  context: ServicesContext<WithSecretsConfig>
): FullSecretsService => {
  const secretsConfig = context.config[SecretsNamespace.Core]
  if (secretsConfig === undefined) {
    throw new Error(`config["${SecretsNamespace.Core}"] is required`)
  }

  const commonGlobals: CommonContext = {
    config: context.config,
    rootLogger: context.rootLogger,
    constants: context.constants,
  }

  const resolveBackend = memoizeValue(async (): Promise<FullSecretsService> => {
    const raw = await resolveRawSecretsService(
      secretsConfig,
      commonGlobals,
      context
    )
    return mergeJsonDefaults(raw)
  })

  const getStoredSecret: SecretsService['getStoredSecret'] = async props => {
    const backend = await resolveBackend()
    return backend.getStoredSecret(props)
  }
  const getStoredJsonSecret: SecretsService['getStoredJsonSecret'] =
    async props => {
      const backend = await resolveBackend()
      return backend.getStoredJsonSecret(props)
    }
  const storeSecret: SecretsService['storeSecret'] = async props => {
    const backend = await resolveBackend()
    return backend.storeSecret(props)
  }
  const storeSecretJson: SecretsService['storeSecretJson'] = async props => {
    const backend = await resolveBackend()
    return backend.storeSecretJson(props)
  }

  return {
    getStoredSecret,
    getStoredJsonSecret,
    storeSecret,
    storeSecretJson,
  }
}
