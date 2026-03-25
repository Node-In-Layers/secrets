import type { JsonAble } from 'functional-models'
import { SecretsNamespace } from '../types.js'

export const NilSecretEntryKey = 'type' as const
export const NilSecretEntryType = 'nil-secret' as const

export enum SecretFormat {
  String = 'string',
  Json = 'json',
}

/**
 * Shape of a config placeholder replaced at globals time (`type: 'nil-secret'`).
 */
export type NilSecretEntry = Readonly<{
  type: typeof NilSecretEntryType
  /**
   * If omitted, treated as {@link SecretFormat.String}.
   */
  format?: SecretFormat
  /** Storage key path passed to the secrets manager. */
  key: string
  readonly [data: string]: JsonAble
}>

export type NilSecretsToReplace = Readonly<Record<string, NilSecretEntry>>

export type ConfigServices = Readonly<object>

export type ConfigServicesLayer = Readonly<{
  [SecretsNamespace.Config]: ConfigServices
}>

export type ConfigFeatures = Readonly<{
  /**
   * Walks the config tree for `type: 'nil-secret'`, loads values via {@link SecretsNamespace.Core}, and returns a new config with placeholders replaced.
   */
  replaceSecretsConfigObjects: <TConfig extends object = object>(
    rawConfig: TConfig
  ) => Promise<TConfig>
}>

export type ConfigFeaturesLayer = Readonly<{
  [SecretsNamespace.Config]: ConfigFeatures
}>
