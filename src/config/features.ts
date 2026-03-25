import cloneDeep from 'lodash/cloneDeep.js'
import isEmpty from 'lodash/isEmpty.js'
import set from 'lodash/set.js'
import { FeaturesContext } from '@node-in-layers/core/index.js'

import type {
  CoreServicesLayer,
  GetSecretProps,
  WithSecretsConfig,
} from '../core/types.js'
import { SecretsNamespace } from '../types.js'
import { findNilSecretEntries } from './libs.js'
import { ConfigServicesLayer, NilSecretEntry, SecretFormat } from './types.js'

const toGetSecretProps = (entry: NilSecretEntry): GetSecretProps => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { type: _type, format: _format, ...rest } = entry
  return rest as GetSecretProps
}

export const create = (
  context: FeaturesContext<
    WithSecretsConfig,
    ConfigServicesLayer & CoreServicesLayer
  >
) => {
  const replaceSecretsConfigObjects = async <TConfig extends object = object>(
    rawConfig: TConfig
  ): Promise<TConfig> => {
    const needed = findNilSecretEntries(rawConfig as object)
    if (isEmpty(needed)) {
      return rawConfig
    }

    const core = context.services[SecretsNamespace.Core]
    if (!core) {
      throw new Error(
        `Missing services["${SecretsNamespace.Core}"]. Load secrets core (and json backend) before config globals.`
      )
    }

    const entries = Object.entries(needed)
    const resolved = await Promise.all(
      entries.map(async ([path, partial]) => {
        const format = partial.format ?? SecretFormat.String
        const props = toGetSecretProps(partial)
        const value =
          format === SecretFormat.Json
            ? await core.getStoredJsonSecret(props)
            : await core.getStoredSecret(props)
        return [path, value] as const
      })
    )

    return resolved.reduce(
      (acc, [path, value]) => set(acc, path, value),
      cloneDeep(rawConfig) as object
    ) as TConfig
  }

  return {
    replaceSecretsConfigObjects,
  }
}
