# Node In Layers Secrets

![Unit Tests](https://github.com/node-in-layers/secrets/actions/workflows/ut.yml/badge.svg?branch=main)
[![Coverage Status](https://coveralls.io/repos/github/Node-In-Layers/secrets/badge.svg?branch=main)](https://coveralls.io/github/Node-In-Layers/secrets?branch=main)

<img src="./public/nil.png" width="160" height="150" />

The official library for handling secrets with Node in Layers.

## How to Use

### 1. Install Library

```bash
npm install @node-in-layers/secrets
```

### 2. Add To Configuration

```typescript
// config.base.mts
import { CoreNamespace } from '@node-in-layers/core'
import {
  config as secretsConfig,
  SecretsNamespace,
} from '@node-in-layers/secrets'

export default async () => ({
  environment: 'base',
  systemName: 'your-system-name',
  [CoreNamespace.root]: {
    apps: [
      // If using the configuration approach (recommended for most applications) put the secrets configuration here.
      secretsConfig,
      // your domains
    ],
  },
  // Optional: see SecretsConfig — omit or use {} to use the default json file backend.
  [SecretsNamespace.Core]: {},
})
```

To use the **default json file** backend instead, omit `secretServiceFactory` (or pass `[SecretsNamespace.Core]: {}`).

## Main Capabilities

1. Ability to retrieve system-level secrets from a secrets manager through a unified interface.
2. Ability to seamlessly replace secrets placeholders in a system's config via a secrets manager.

## Domains

### SecretsNamespace.Core (`@node-in-layers/secrets`)

Provides the basic capabilities of storing and retrieving secrets.

Core wires a single `SecretsService`-compatible backend from config and exposes the full string + JSON API (JSON is synthesized from strings when the backend omits JSON methods).

#### SecretsConfig

`SecretsConfig` (under `[SecretsNamespace.Core]` in system config) resolves a backend in one of two ways only:

1. **`secretServiceFactory`** — `(ctx: CommonContext) => SecretsService | Promise<SecretsService>`. Use during globals when full `ServicesContext` is not available yet (for example `secretsService` from `@node-in-layers/aws`).
2. **Default** — if `secretServiceFactory` is omitted, the **json file** backend (`secrets.{ENVIRONMENT}.json`) is used.

The ordered step ids are exported as **`SECRETS_CONFIG_RESOLUTION`** from this package (for docs and tooling).

#### Interface Description

Any domain can provide the ability to retrieve and store secrets by providing a services layer that implements the `SecretsService` type. **`getStoredSecret` and `storeSecret` are required.** **`getStoredJsonSecret` and `storeSecretJson` are optional** on the implementation: if you omit them, **this library automatically implements them** by delegating to `getStoredSecret` / `storeSecret` with `JSON.parse` and `JSON.stringify`.

Provide your own `getStoredJsonSecret` / `storeSecretJson` only when the backend can handle JSON more efficiently or differently than string round-tripping.

NOTE: If a domain does not want to provide a `storeSecret()` function, then the system should throw an exception.

#### Types

```typescript
import { JsonObj, JsonAble } from 'functional-models'

type GetSecretProps = Readonly<{
  /**
   * The key path to the stored secret.
   */
  key: string
  /**
   * Optional metadata useful for grabbing the secret.
   */
  readonly [s: string]: JsonAble
}>

type StoreSecretProps = Readonly<{
  /**
   * The key path to the secret.
   */
  key: string
  /**
   * The value to store.
   */
  value: string
  /**
   * Optional metadata useful for setting the secret correctly.
   */
  readonly [s: string]: JsonAble
}>

type StoreSecretJsonProps<T extends JsonObj> = Readonly<{
  /**
   * The key path to the secret.
   */
  key: string
  /**
   * The value to store.
   */
  value: JsonObj
  /**
   * Optional metadata useful for setting the secret correctly.
   */
  readonly [s: string]: JsonAble
}>

/**
 * What a secrets manager *implements*. JSON methods are optional; the library fills them in when missing.
 */
type SecretsService = Readonly<{
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
 * Optional marker for backends that implement all four methods natively (e.g. optimized JSON storage).
 * Call sites still receive the same surface whether methods are native or library-wrapped.
 */
type FullSecretsService = Readonly<{
  getStoredSecret: (props: GetSecretProps) => Promise<string>
  getStoredJsonSecret: <T extends JsonObj = JsonObj>(
    props: GetSecretProps
  ) => Promise<T>
  storeSecret: (props: StoreSecretProps) => Promise<void>
  storeSecretJson: <T extends JsonObj = JsonObj>(
    props: StoreSecretJsonProps<T>
  ) => Promise<void>
}>
```

#### Example:

Most managers only implement the string APIs. **Do not** implement `getStoredJsonSecret` / `storeSecretJson` unless the backend needs native JSON behavior—the library supplies those by wrapping `getStoredSecret` / `storeSecret` with `JSON.parse` / `JSON.stringify`, so **callers always use the full API and never add their own JSON fallbacks**.

```typescript
// your-system/src/yourDomain/services.ts

import type {
  GetSecretProps,
  StoreSecretProps,
  SecretsService,
} from '@node-in-layers/secrets'
import { ServicesContext } from '@node-in-layers/core'
import { MyDomainServices } from './types.ts'

export type MyDomainServices = SecretsService & {
  // whatever else
}

export const create = (context: ServicesContext): MyDomainServices => {
  const getStoredSecret = async (props: GetSecretProps): Promise<string> => {
    // read stored secret using props.key (and optional metadata).
    return 'stored-secret'
  }

  const storeSecret = async (props: StoreSecretProps): Promise<void> => {
    throw new Error('Not implemented')
  }

  return {
    getStoredSecret,
    storeSecret,
  }
}
```

### SecretsNamespace.Config (`@node-in-layers/secrets/config`)

This domain provides the most common capability of loading secrets at runtime, by replacing structured secret placeholders, via a secrets manager.
Instead of calling stored secrets each time they're used, the path to secrets can be configured in the config, and then at load time, all secrets are pulled down and set in the config. These secrets can then be seamlessly used throughout the application.

#### How To Use

1. Define and create a placeholder for your secret inside your configuration file.

```typescript
// config.base.mts
import { CoreNamespace } from '@node-in-layers/core'
import {
  config as secretsConfig,
  SecretsNamespace,
} from '@node-in-layers/secrets'

export default async () => ({
  environment: 'base',
  systemName: 'your-system-name',
  [CoreNamespace.root]: {
    apps: [
      // Place this close to the top. Above anything that needs a
      // clean config with secrets replaced.
      secretsConfig,
      // your domains
    ],
  },
  [SecretsNamespace.Core]: {},
  yourDomain: {
    // This entire structure will collapse down to a string. Example: 'mySecretKey: "the stored secret"'
    mySecretKey: {
      type: 'nil-secret',
      format: 'string',
      key: '/your-system-name/dev/my-secret-key',
    },
  },
  anotherDomain: {
    nested: {
      // This structure is replaced with a json object. Example: anotherSecretKey: {}
      anotherSecretKey: {
        type: 'nil-secret',
        format: 'json',
        key: '/your-system-name/dev/another-secret-as-a-json',
      },
    },
  },
})
```

Another Example Using AWS Secrets Config Replacement

```typescript
// config.base.mts
import { CoreNamespace } from '@node-in-layers/core'
import {
  config as secretsConfig,
  SecretsNamespace,
} from '@node-in-layers/secrets'
import { secretsService, AwsNamespace, AwsService } from '@node-in-layers/aws'

export default async () => ({
  environment: 'base',
  systemName: 'your-system-name',
  [AwsNamespace.root]: {
    awsClientProps: { region: 'us-east-1' },
    services: [AwsService.secretsManager, AwsService.ssm],
  },
  [CoreNamespace.root]: {
    apps: [
      secretsConfig,
      // your domains
    ],
  },
  [SecretsNamespace.Core]: {
    secretServiceFactory: secretsService,
  },
  yourDomain: {
    // This entire structure will collapse down to a string. Example: 'mySecretKey: "the stored secret"'
    mySecretKey: {
      awsService: 'secretsManager',
      type: 'nil-secret',
      format: 'string',
      key: '/your-system-name/dev/my-secret-key',
    },
  },
  anotherDomain: {
    nested: {
      // A property that is stored in parameterStore (not a secret, but rides on the backbone)
      anAwsProperty: {
        awsService: 'parameterStore',
        type: 'nil-secret',
        format: 'json',
        key: '/your-system-name/dev/not-a-secret-a-config',
      },
    },
  },
})
```

```typescript
import { JsonAble } from 'functional-models'

enum SecretFormat {
  String = 'string',
  Json = 'json',
}

type StructuredSecretEntry = Readonly<{
  /**
   * This tells the system that this is a node in layer secret that should be replaced.
   */
  type: 'nil-secret'
  // The format for replacing the SecretEntry. If string, it sets a string value. If json, it uses the JSON secret path (resolved via the same automatic JSON wrapping as `getStoredJsonSecret` when the manager only implements string APIs).
  format?: SecretFormat
  // The key path to the secret.
  key: string
  // Optional information specific passed into the storage system.
  readonly [data: string]: JsonAble
}>
```

### SecretsNamespace.Json (`@node-in-layers/secrets/json`)

The default file-based backend: secrets are read from JSON or JSON5 files under the working directory, using the same `SecretsService` contract as other backends.

#### File Pathing

These files are automatically found at the base of the system directory (working directory) using the environment name.
`secrets.{ENVIRONMENT}.json`
`secrets.{ENVIRONMENT}.json5`
