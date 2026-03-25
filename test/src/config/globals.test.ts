import { assert } from 'chai'
import omit from 'lodash/omit.js'
import sinon from 'sinon'
import type { CommonContext } from '@node-in-layers/core'

import { create as createConfigGlobals } from '../../../src/config/globals.js'
import { SecretsNamespace } from '../../../src/types.js'
import { SecretFormat } from '../../../src/config/types.js'

const makeInMemorySecretsService = (storage: Record<string, string>) => {
  const getStoredSecret = sinon.stub().callsFake(async (props: any) => {
    if (!(props.key in storage)) {
      throw new Error(`Secret not found for key: ${props.key}`)
    }
    return storage[props.key]
  })

  return {
    getStoredSecret,
    storeSecret: sinon.stub().resolves(),
  }
}

describe('/src/config/globals.ts', () => {
  describe('#create()', () => {
    it('should return original config when there are no nil-secret entries', async () => {
      const inMemory = makeInMemorySecretsService({})

      const inputConfig = {
        hello: 'world',
      }

      const common = {
        config: {
          [SecretsNamespace.Core]: {
            secretServiceFactory: async () => inMemory as any,
          },
          ...inputConfig,
        },
        constants: { environment: 'test', workingDirectory: '/tmp' },
        rootLogger: {} as any,
        models: {},
        log: {} as any,
      } as CommonContext<any>

      const actual = await createConfigGlobals(common)
      const expected = inputConfig

      const actualToTest = omit(actual.config, [SecretsNamespace.Core])

      assert.deepEqual(actualToTest, expected)
      assert.equal(inMemory.getStoredSecret.callCount, 0)
    })

    it('should replace nil-secret entries using core.getStoredSecret() when format is string', async () => {
      const inMemory = makeInMemorySecretsService({
        '/s1': 'value-1',
      })

      const inputConfig = {
        myKey: {
          type: 'nil-secret',
          key: '/s1',
          extra: 'meta',
        },
      }

      const common = {
        config: {
          [SecretsNamespace.Core]: {
            secretServiceFactory: async () => inMemory as any,
          },
          ...inputConfig,
        },
        constants: { environment: 'test', workingDirectory: '/tmp' },
        rootLogger: {} as any,
        models: {},
        log: {} as any,
      } as CommonContext<any>

      // run the thing
      const actual = await createConfigGlobals(common)

      const actualToTest = omit(actual.config, [SecretsNamespace.Core])

      // create expected
      const expected = {
        myKey: 'value-1',
      }

      // assert
      assert.deepEqual(actualToTest, expected)
      assert.equal(inMemory.getStoredSecret.callCount, 1)
      assert.deepEqual(inMemory.getStoredSecret.getCall(0).args[0], {
        key: '/s1',
        extra: 'meta',
      })
    })

    it('should replace nil-secret entries using core.getStoredJsonSecret() when format is json', async () => {
      const inMemory = makeInMemorySecretsService({
        '/j1': JSON.stringify({ x: 1, ok: true }),
      })

      const inputConfig = {
        myKey: {
          type: 'nil-secret',
          format: SecretFormat.Json,
          key: '/j1',
        },
      }

      const common = {
        config: {
          [SecretsNamespace.Core]: {
            secretServiceFactory: async () => inMemory as any,
          },
          ...inputConfig,
        },
        constants: { environment: 'test', workingDirectory: '/tmp' },
        rootLogger: {} as any,
        models: {},
        log: {} as any,
      } as CommonContext<any>

      const actual = await createConfigGlobals(common)

      const actualToTest = omit(actual.config, [SecretsNamespace.Core])

      const expected = {
        myKey: { x: 1, ok: true },
      }

      assert.deepEqual(actualToTest, expected)
      assert.equal(inMemory.getStoredSecret.callCount, 1)
    })

    it('should throw when secrets core is missing from common config', async () => {
      const common = {
        config: {
          myKey: {
            type: 'nil-secret',
            key: '/s1',
          },
        },
        constants: { environment: 'test', workingDirectory: '/tmp' },
        rootLogger: {} as any,
        models: {},
        log: {} as any,
      } as CommonContext<any>

      let thrown: unknown
      try {
        await createConfigGlobals(common)
      } catch (e) {
        thrown = e
      }

      const actual = String((thrown as Error)?.message ?? thrown)
      const expectedPattern = 'config["@node-in-layers/secrets"] is required'
      assert.equal(actual, expectedPattern)
    })
  })
})
