import { assert } from 'chai'
import sinon from 'sinon'
import type { FeaturesContext } from '@node-in-layers/core'

import { create as createConfigFeatures } from '../../../src/config/features.js'
import { SecretsNamespace } from '../../../src/types.js'
import { SecretFormat, NilSecretEntryType } from '../../../src/config/types.js'

const makeContext = (core: any) => {
  return {
    config: {},
    constants: { environment: 'test', workingDirectory: '/tmp' },
    rootLogger: {} as any,
    models: {},
    log: {} as any,
    features: {
      getFeatures: () => undefined,
    },
    services: {
      [SecretsNamespace.Core]: core,
    },
  } as unknown as FeaturesContext<any>
}

describe('/src/config/features.ts', () => {
  describe('#replaceSecretsConfigObjects()', () => {
    it('should return rawConfig unchanged when there are no nil-secret entries', async () => {
      const coreGetStoredSecret = sinon.stub()
      const context = makeContext({
        getStoredSecret: coreGetStoredSecret,
        getStoredJsonSecret: sinon.stub(),
      })

      const features = createConfigFeatures(context)
      const input = { a: { b: 1 } }
      const actual = await features.replaceSecretsConfigObjects(input)
      const expected = input

      assert.equal(actual, expected)
      assert.equal(coreGetStoredSecret.callCount, 0)
    })

    it('should replace nil-secret entries using core.getStoredSecret() when format is string', async () => {
      const coreGetStoredSecret = sinon.stub().resolves('value-1')
      const coreGetStoredJsonSecret = sinon.stub()
      const context = makeContext({
        getStoredSecret: coreGetStoredSecret,
        getStoredJsonSecret: coreGetStoredJsonSecret,
      })

      const features = createConfigFeatures(context)
      const input = {
        myKey: {
          type: NilSecretEntryType,
          key: '/s1',
        },
      }
      const actual = await features.replaceSecretsConfigObjects(input)
      const expected = { myKey: 'value-1' }

      assert.deepEqual(actual, expected)
      assert.equal(coreGetStoredSecret.callCount, 1)
      assert.equal(coreGetStoredJsonSecret.callCount, 0)
    })

    it('should replace nil-secret entries using core.getStoredJsonSecret() when format is json', async () => {
      const coreGetStoredSecret = sinon.stub()
      const coreGetStoredJsonSecret = sinon.stub().resolves({ x: 1, ok: true })
      const context = makeContext({
        getStoredSecret: coreGetStoredSecret,
        getStoredJsonSecret: coreGetStoredJsonSecret,
      })

      const features = createConfigFeatures(context)
      const input = {
        myKey: {
          type: NilSecretEntryType,
          format: SecretFormat.Json,
          key: '/j1',
        },
      }
      const actual = await features.replaceSecretsConfigObjects(input)
      const expected = { myKey: { x: 1, ok: true } }

      assert.deepEqual(actual, expected)
      assert.equal(coreGetStoredSecret.callCount, 0)
      assert.equal(coreGetStoredJsonSecret.callCount, 1)
    })

    it('should default format to string when format is omitted', async () => {
      const coreGetStoredSecret = sinon.stub().resolves('value-default')
      const coreGetStoredJsonSecret = sinon.stub()
      const context = makeContext({
        getStoredSecret: coreGetStoredSecret,
        getStoredJsonSecret: coreGetStoredJsonSecret,
      })

      const features = createConfigFeatures(context)
      const input = {
        myKey: {
          type: NilSecretEntryType,
          key: '/s-default',
        },
      }
      const actual = await features.replaceSecretsConfigObjects(input)
      const expected = { myKey: 'value-default' }

      assert.deepEqual(actual, expected)
      assert.equal(coreGetStoredSecret.callCount, 1)
      assert.equal(coreGetStoredJsonSecret.callCount, 0)
    })

    it('should pass through extra metadata to core.getStoredSecret()', async () => {
      const coreGetStoredSecret = sinon.stub().callsFake(async (props: any) => {
        assert.deepEqual(props, { key: '/s1', extra: 'meta' })
        return 'value-meta'
      })
      const coreGetStoredJsonSecret = sinon.stub()
      const context = makeContext({
        getStoredSecret: coreGetStoredSecret,
        getStoredJsonSecret: coreGetStoredJsonSecret,
      })

      const features = createConfigFeatures(context)
      const input = {
        myKey: {
          type: NilSecretEntryType,
          key: '/s1',
          extra: 'meta',
        },
      }

      const actual = await features.replaceSecretsConfigObjects(input)
      const expected = { myKey: 'value-meta' }

      assert.deepEqual(actual, expected)
      assert.equal(coreGetStoredSecret.callCount, 1)
    })

    it('should throw when services["SecretsNamespace.Core"] is missing', async () => {
      const context = {
        config: {},
        constants: { environment: 'test', workingDirectory: '/tmp' },
        rootLogger: {} as any,
        models: {},
        log: {} as any,
        features: { getFeatures: () => undefined },
        services: {},
      } as unknown as FeaturesContext<any>

      const features = createConfigFeatures(context)
      const input = {
        myKey: {
          type: NilSecretEntryType,
          key: '/s1',
        },
      }

      let thrown: unknown
      try {
        await features.replaceSecretsConfigObjects(input)
      } catch (e) {
        thrown = e
      }

      const actual = String((thrown as Error)?.message ?? thrown)
      const expectedPattern = `Missing services["${SecretsNamespace.Core}"]. Load secrets core (and json backend) before config globals.`
      assert.equal(actual, expectedPattern)
    })
  })
})
