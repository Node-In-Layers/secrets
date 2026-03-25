import { assert } from 'chai'
import sinon from 'sinon'
import type { ServicesContext } from '@node-in-layers/core'

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { create as createSecretsCore } from '../../../src/core/services.js'
import type {
  SecretsService,
  FullSecretsService,
} from '../../../src/core/types.js'
import { SecretsNamespace } from '../../../src/types.js'

describe('/src/core/services.ts', () => {
  const makeTempSecretsDir = () =>
    mkdtempSync(join(tmpdir(), 'node-in-layers-secrets-'))

  describe('#create()', () => {
    it('should throw when config[SecretsNamespace.Core] is missing', async () => {
      const context = {
        config: {},
        constants: { environment: 'test', workingDirectory: '/tmp' },
        rootLogger: {} as any,
        models: {},
        services: {},
        log: {} as any,
      } as any

      let thrown: unknown
      try {
        createSecretsCore(context)
      } catch (e) {
        thrown = e
      }

      const actual = String((thrown as Error)?.message ?? thrown)
      const expected = 'config["@node-in-layers/secrets"] is required'
      assert.equal(actual, expected)
    })

    it('should memoize the resolved backend (secretServiceFactory called once)', async () => {
      const backend: Partial<SecretsService> = {
        getStoredSecret: sinon.stub().resolves('{"a":1}'),
      }

      const sandbox = sinon.createSandbox()
      const secretServiceFactory = sandbox
        .stub()
        .resolves(backend as SecretsService)

      const config = {
        [SecretsNamespace.Core]: { secretServiceFactory },
      } as any

      const context = {
        config,
        constants: { environment: 'test', workingDirectory: '/tmp' },
        rootLogger: {} as any,
        models: {},
        services: {},
        log: {} as any,
      } as ServicesContext<any>

      const secrets = createSecretsCore(context) as FullSecretsService

      const input = { key: '/a' }
      const actual1 = await secrets.getStoredSecret(input)
      const actual2 = await secrets.getStoredSecret(input)

      const expected = '{"a":1}'
      assert.equal(actual1, expected)
      assert.equal(actual2, expected)
      assert.equal(secretServiceFactory.callCount, 1)
      sandbox.restore()
    })
  })

  describe('#getStoredJsonSecret()', () => {
    it('should JSON.parse() the value returned by getStoredSecret() when missing getStoredJsonSecret', async () => {
      const backendGetStoredSecret = sinon
        .stub()
        .resolves('{"id":123,"enabled":true}')

      const sandbox = sinon.createSandbox()
      const secretServiceFactory = sandbox.stub().resolves({
        getStoredSecret: backendGetStoredSecret,
      } as SecretsService)

      const config = {
        [SecretsNamespace.Core]: { secretServiceFactory },
      } as any

      const context = {
        config,
        constants: { environment: 'test', workingDirectory: '/tmp' },
        rootLogger: {} as any,
        models: {},
        services: {},
        log: {} as any,
      } as ServicesContext<any>

      const secrets = createSecretsCore(context) as FullSecretsService

      const input = { key: '/json/secret' }
      const actual = await secrets.getStoredJsonSecret(input as any)
      const expected = { id: 123, enabled: true }

      assert.deepEqual(actual, expected)
      assert.equal(backendGetStoredSecret.callCount, 1)
      sandbox.restore()
    })

    it('should delegate to backend.getStoredJsonSecret() when implemented', async () => {
      // setup input
      const backendGetStoredJsonSecret = sinon
        .stub()
        .resolves({ from: 'backend' })
      const backendGetStoredSecret = sinon.stub().resolves('{"no":"use"}')

      const sandbox = sinon.createSandbox()
      const secretServiceFactory = sandbox.stub().resolves({
        getStoredSecret: backendGetStoredSecret,
        getStoredJsonSecret: backendGetStoredJsonSecret,
      } as SecretsService)

      const config = {
        [SecretsNamespace.Core]: { secretServiceFactory },
      } as any

      const context = {
        config,
        constants: { environment: 'test', workingDirectory: '/tmp' },
        rootLogger: {} as any,
        models: {},
        services: {},
        log: {} as any,
      } as ServicesContext<any>

      // run the thing
      const secrets = createSecretsCore(context) as FullSecretsService
      const input = { key: '/json/secret' }
      const actual = await secrets.getStoredJsonSecret(input as any)

      // create your expected value.
      const expected = { from: 'backend' }

      // assert actual expected
      assert.deepEqual(actual, expected)
      assert.equal(backendGetStoredSecret.callCount, 0)
      assert.equal(backendGetStoredJsonSecret.callCount, 1)
      sandbox.restore()
    })
  })

  describe('#storeSecretJson()', () => {
    it('should JSON.stringify() value and call storeSecret() when storeSecretJson() is missing', async () => {
      const getStoredSecret = sinon.stub().resolves('{"ignored":true}')
      const storeSecret = sinon.stub().resolves()

      const sandbox = sinon.createSandbox()
      const secretServiceFactory = sandbox.stub().resolves({
        getStoredSecret,
        storeSecret,
      } as SecretsService)

      const config = {
        [SecretsNamespace.Core]: { secretServiceFactory },
      } as any

      const context = {
        config,
        constants: { environment: 'test', workingDirectory: '/tmp' },
        rootLogger: {} as any,
        models: {},
        services: {},
        log: {} as any,
      } as ServicesContext<any>

      const secrets = createSecretsCore(context) as FullSecretsService

      const input = { key: '/json/secret', value: { x: 1, y: 'z' } }
      const actualCallArgs = await secrets.storeSecretJson(input as any)
      // storeSecretJson returns void; assert via storeSecret call args.

      assert.equal(actualCallArgs, undefined)

      const expectedValue = JSON.stringify(input.value)
      assert.equal(storeSecret.callCount, 1)
      assert.deepEqual(storeSecret.getCall(0).args[0], {
        key: input.key,
        value: expectedValue,
      })
      sandbox.restore()
    })

    it('should delegate to backend.storeSecretJson() when implemented (no JSON.stringify)', async () => {
      // setup input
      const storeSecretJson = sinon.stub().resolves()
      const storeSecret = sinon.stub().resolves()

      const sandbox = sinon.createSandbox()
      const secretServiceFactory = sandbox.stub().resolves({
        storeSecret,
        storeSecretJson,
        // getStoredSecret is required only for typing; not used in this test.
        getStoredSecret: sinon.stub().resolves('unused'),
      } as SecretsService)

      const config = {
        [SecretsNamespace.Core]: { secretServiceFactory },
      } as any

      const context = {
        config,
        constants: { environment: 'test', workingDirectory: '/tmp' },
        rootLogger: {} as any,
        models: {},
        services: {},
        log: {} as any,
      } as ServicesContext<any>

      // run the thing
      const secrets = createSecretsCore(context) as FullSecretsService
      const input = { key: '/json/secret', value: { a: 1 } }
      await secrets.storeSecretJson(input as any)

      // create your expected value.
      // storeSecretJson should receive the object value directly.
      assert.equal(storeSecret.callCount, 0)
      assert.equal(storeSecretJson.callCount, 1)
      assert.deepEqual(storeSecretJson.getCall(0).args[0], input)
      sandbox.restore()
    })
  })

  describe('#default json backend', () => {
    it('should use json backend for getStoredSecret() when secretServiceFactory is omitted', async () => {
      // setup input
      const dir = makeTempSecretsDir()
      writeFileSync(
        join(dir, 'secrets.test.json'),
        JSON.stringify({ my: { key: 'abc' } }),
        'utf8'
      )

      const context = {
        config: {
          [SecretsNamespace.Core]: {},
        },
        constants: { environment: 'test', workingDirectory: dir },
        rootLogger: {} as any,
        models: {},
        services: {},
        log: {} as any,
      } as ServicesContext<any>

      // run the thing
      const secrets = createSecretsCore(context) as FullSecretsService
      const input = { key: 'my.key' }
      const actual = await secrets.getStoredSecret(input as any)

      // create your expected value.
      const expected = 'abc'

      // assert actual expected
      assert.equal(actual, expected)

      rmSync(dir, { recursive: true, force: true })
    })

    it('should use json backend for getStoredJsonSecret() when secretServiceFactory is omitted', async () => {
      // setup input
      const dir = makeTempSecretsDir()
      writeFileSync(
        join(dir, 'secrets.test.json'),
        JSON.stringify({ my: { obj: { x: 1 } } }),
        'utf8'
      )

      const context = {
        config: {
          [SecretsNamespace.Core]: {},
        },
        constants: { environment: 'test', workingDirectory: dir },
        rootLogger: {} as any,
        models: {},
        services: {},
        log: {} as any,
      } as ServicesContext<any>

      // run the thing
      const secrets = createSecretsCore(context) as FullSecretsService
      const input = { key: 'my.obj' }
      const actual = await secrets.getStoredJsonSecret(input as any)

      // create your expected value.
      const expected = { x: 1 }

      // assert actual expected
      assert.deepEqual(actual, expected)

      rmSync(dir, { recursive: true, force: true })
    })
  })
})
