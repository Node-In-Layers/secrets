import { SecretsNamespace } from '../types.js'
import type { SecretsService } from '../core/types.js'

export type JsonServices = SecretsService

export type JsonServicesLayer = Readonly<{
  [SecretsNamespace.Json]: JsonServices
}>

export type JsonFeatures = Readonly<object>

export type JsonFeaturesLayer = Readonly<{
  [SecretsNamespace.Json]: JsonFeatures
}>
