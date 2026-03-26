import { assert } from 'chai'
import type { ServicesContext } from '@node-in-layers/core'
import type { JsonServices } from '../../../../src/json/types.js'

import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { create as createJsonSecretsService } from '../../../src/json/services.js'

const testDir = join(tmpdir(), 'node-in-layers-secrets-test')

const cleanTestDir = () => {
  rmSync(testDir, { recursive: true, force: true })
  mkdirSync(testDir, { recursive: true })
}

describe('/src/json/services.ts', () => {
  before(() => {
    cleanTestDir()
  })

  beforeEach(() => {
    cleanTestDir()
  })

  after(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  describe('#getStoredSecret()', () => {
    it('should return the stored string when the key resolves to a string from a json5 file', async () => {
      const input = { key: 'json5' }
      writeFileSync(
        join(testDir, 'secrets.test.json5'),
        '{json5:"rocks"}',
        'utf8'
      )

      const context = {
        constants: { workingDirectory: testDir, environment: 'test' },
      } as unknown as ServicesContext<any>

      const service: JsonServices = createJsonSecretsService(context)
      const actual = await service.getStoredSecret(input as any)

      const expected = 'rocks'
      assert.equal(actual, expected)
    })

    it('should return the stored string when the key resolves to a string', async () => {
      const data = { my: { secret: 'abc' } }
      const input = { key: 'my.secret' }
      writeFileSync(
        join(testDir, 'secrets.test.json'),
        JSON.stringify(data),
        'utf8'
      )

      const context = {
        constants: { workingDirectory: testDir, environment: 'test' },
      } as unknown as ServicesContext<any>

      const service: JsonServices = createJsonSecretsService(context)
      const actual = await service.getStoredSecret(input as any)

      const expected = 'abc'
      assert.equal(actual, expected)
    })

    it('should throw when the resolved key is missing', async () => {
      writeFileSync(
        join(testDir, 'secrets.test.json'),
        JSON.stringify({}),
        'utf8'
      )

      const context = {
        constants: { workingDirectory: testDir, environment: 'test' },
      } as unknown as ServicesContext<any>

      const service: JsonServices = createJsonSecretsService(context)

      const input = { key: 'missing.key' }

      let thrown: unknown
      try {
        await service.getStoredSecret(input as any)
      } catch (e) {
        thrown = e
      }

      const actual = String((thrown as Error)?.message ?? thrown)
      const expected = 'Secret not found for key: missing.key'
      assert.equal(actual, expected)
    })

    it('should throw when the resolved value is not a string', async () => {
      writeFileSync(
        join(testDir, 'secrets.test.json'),
        JSON.stringify({ my: { secret: { nested: true } } }),
        'utf8'
      )

      const context = {
        constants: { workingDirectory: testDir, environment: 'test' },
      } as unknown as ServicesContext<any>

      const service: JsonServices = createJsonSecretsService(context)

      const input = { key: 'my.secret' }

      let thrown: unknown
      try {
        await service.getStoredSecret(input as any)
      } catch (e) {
        thrown = e
      }

      const actual = String((thrown as Error)?.message ?? thrown)
      const expected = 'Secret value for key my.secret is not a string'
      assert.equal(actual, expected)
    })
  })

  describe('#getStoredJsonSecret()', () => {
    it('should return the stored object for JSON secrets', async () => {
      const data = { my: { obj: { x: 1, ok: true } } }
      writeFileSync(
        join(testDir, 'secrets.test.json'),
        JSON.stringify(data),
        'utf8'
      )

      const context = {
        constants: { workingDirectory: testDir, environment: 'test' },
      } as unknown as ServicesContext<any>

      const service: JsonServices = createJsonSecretsService(context)
      const input = { key: 'my.obj' }

      const actual = await service.getStoredJsonSecret<typeof data.my.obj>(
        input as any
      )

      const expected = { x: 1, ok: true }
      assert.deepEqual(actual, expected)
    })

    it('should throw when the resolved key is missing for JSON secrets', async () => {
      writeFileSync(
        join(testDir, 'secrets.test.json'),
        JSON.stringify({}),
        'utf8'
      )

      const context = {
        constants: { workingDirectory: testDir, environment: 'test' },
      } as unknown as ServicesContext<any>

      const service: JsonServices = createJsonSecretsService(context)
      const input = { key: 'missing.json' }

      let thrown: unknown
      try {
        await service.getStoredJsonSecret(input as any)
      } catch (e) {
        thrown = e
      }

      const actual = String((thrown as Error)?.message ?? thrown)
      const expected = 'Secret not found for key: missing.json'
      assert.equal(actual, expected)
    })
  })

  describe('#storeSecret()', () => {
    it('should throw Not implemented', async () => {
      writeFileSync(
        join(testDir, 'secrets.test.json'),
        JSON.stringify({ my: { key: 'abc' } }),
        'utf8'
      )

      const context = {
        constants: { workingDirectory: testDir, environment: 'test' },
      } as unknown as ServicesContext<any>

      const service: JsonServices = createJsonSecretsService(context)

      let thrown: unknown
      try {
        await service.storeSecret({ key: 'my.key', value: 'x' } as any)
      } catch (e) {
        thrown = e
      }

      const actual = String((thrown as Error)?.message ?? thrown)
      const expected = 'Not implemented'
      assert.equal(actual, expected)
    })

    it('should throw when secrets file does not exist', async () => {
      const context = {
        constants: { workingDirectory: testDir, environment: 'test' },
      } as unknown as ServicesContext<any>

      const service: JsonServices = createJsonSecretsService(context)

      let thrown: unknown
      try {
        await service.getStoredSecret({ key: 'missing.key' } as any)
      } catch (e) {
        thrown = e
      }

      const actual = String((thrown as Error)?.message ?? thrown)
      const expectedPattern =
        /Failed to read secrets file .*secrets\.test\.json/
      assert.match(actual, expectedPattern)
    })

    it('should throw when secrets file is not a JSON object', async () => {
      writeFileSync(
        join(testDir, 'secrets.test.json'),
        JSON.stringify([]),
        'utf8'
      )

      const context = {
        constants: { workingDirectory: testDir, environment: 'test' },
      } as unknown as ServicesContext<any>

      const service: JsonServices = createJsonSecretsService(context)

      let thrown: unknown
      try {
        await service.getStoredSecret({ key: 'missing.key' } as any)
      } catch (e) {
        thrown = e
      }

      const actual = String((thrown as Error)?.message ?? thrown)
      const expectedPattern = /must be a JSON object/
      assert.match(actual, expectedPattern)
    })
  })
})
