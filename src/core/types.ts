import type { CommonContext, Config } from '@node-in-layers/core'
import type { JsonObj, JsonAble } from 'functional-models'

import { SecretsNamespace } from '../types.js'

export type GetSecretProps = Readonly<{
  /** The key path to the stored secret. */
  key: string
  /** Optional metadata useful for grabbing the secret. */
  readonly [s: string]: JsonAble
}>

export type StoreSecretProps = Readonly<{
  /** The key path to the secret. */
  key: string
  /** The value to store. */
  value: string
  /** Optional metadata useful for setting the secret correctly. */
  readonly [s: string]: JsonAble
}>

export type StoreSecretJsonProps<T extends JsonObj> = Readonly<{
  /** The key path to the secret. */
  key: string
  /** The value to store. */
  value: T
  /** Optional metadata useful for setting the secret correctly. */
  readonly [s: string]: JsonAble
}>

/**
 * What a backend secrets manager implements. JSON methods are optional; core fills them in when missing.
 */
export type SecretsService = Readonly<{
  getStoredSecret: (props: GetSecretProps) => Promise<string>
  storeSecret: (props: StoreSecretProps) => Promise<void>
  getStoredJsonSecret?: <T extends JsonObj = JsonObj>(
    props: GetSecretProps
  ) => Promise<T>
  storeSecretJson?: <T extends JsonObj = JsonObj>(
    props: StoreSecretJsonProps<T>
  ) => Promise<void>
}>

/**
 * Ordered phases for how core resolves a {@link SecretsService} from config (see implementation in `core/services.ts`).
 */
export const SECRETS_CONFIG_RESOLUTION = [
  'secretServiceFactory',
  'jsonBackendDefault',
] as const

export type SecretsConfigResolutionStep =
  (typeof SECRETS_CONFIG_RESOLUTION)[number]

/**
 * Configuration under [SecretsNamespace.Core].
 *
 * Backend resolution follows {@link SECRETS_CONFIG_RESOLUTION}: use {@link SecretsConfig.secretServiceFactory} if set, otherwise the **json file** backend ({@link SecretsNamespace.Json}) is used.
 */
export type SecretsConfig = Readonly<{
  /**
   * Factory receiving {@link CommonContext} only (no `context.services` from other apps).
   * Omit to use the default json file secrets backend.
   */
  secretServiceFactory?: (
    ctx: CommonContext
  ) => SecretsService | Promise<SecretsService>
}>

export type WithSecretsConfig<TConfig extends Config = Config> = TConfig & {
  [SecretsNamespace.Core]: SecretsConfig
}

export type FullSecretsService = Readonly<{
  getStoredSecret: (props: GetSecretProps) => Promise<string>
  getStoredJsonSecret: <T extends JsonObj = JsonObj>(
    props: GetSecretProps
  ) => Promise<T>
  storeSecret: (props: StoreSecretProps) => Promise<void>
  storeSecretJson: <T extends JsonObj = JsonObj>(
    props: StoreSecretJsonProps<T>
  ) => Promise<void>
}>

export type CoreServices = FullSecretsService

export type CoreServicesLayer = Readonly<{
  [SecretsNamespace.Core]: CoreServices
}>

export type CoreFeatures = Readonly<object>

export type CoreFeaturesLayer = Readonly<{
  [SecretsNamespace.Core]: CoreFeatures
}>
