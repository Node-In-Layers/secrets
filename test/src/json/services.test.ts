import { assert } from 'chai'
import type { ServicesContext } from '@node-in-layers/core'
import type { JsonServices } from '../../../../src/json/types.js'

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { create as createJsonSecretsService } from '../../../src/json/services.js'

const makeTempSecretsDir = () => {
  const dir = mkdtempSync(join(tmpdir(), 'node-in-layers-secrets-'))
  return dir
}

describe('/src/json/services.ts', () => {
  describe('#getStoredSecret()', () => {
    it('should return the stored string when the key resolves to a string', async () => {
      // setup input
      const dir = makeTempSecretsDir()
      const data = { my: { secret: 'abc' } }
      const input = { key: 'my.secret' }
      writeFileSync(
        join(dir, 'secrets.test.json'),
        JSON.stringify(data),
        'utf8'
      )

      const context = {
        constants: { workingDirectory: dir, environment: 'test' },
      } as unknown as ServicesContext<any>

      // run the thing
      const service: JsonServices = createJsonSecretsService(context)
      const actual = await service.getStoredSecret(input as any)

      // create expected
      const expected = 'abc'

      // assert actual expected
      assert.equal(actual, expected)

      rmSync(dir, { recursive: true, force: true })
    })

    it('should throw when the resolved key is missing', async () => {
      const dir = makeTempSecretsDir()
      writeFileSync(join(dir, 'secrets.test.json'), JSON.stringify({}), 'utf8')

      const context = {
        constants: { workingDirectory: dir, environment: 'test' },
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

      rmSync(dir, { recursive: true, force: true })
    })

    it('should throw when the resolved value is not a string', async () => {
      const dir = makeTempSecretsDir()
      writeFileSync(
        join(dir, 'secrets.test.json'),
        JSON.stringify({ my: { secret: { nested: true } } }),
        'utf8'
      )

      const context = {
        constants: { workingDirectory: dir, environment: 'test' },
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

      rmSync(dir, { recursive: true, force: true })
    })
  })

  describe('#getStoredJsonSecret()', () => {
    it('should return the stored object for JSON secrets', async () => {
      const dir = makeTempSecretsDir()
      const data = { my: { obj: { x: 1, ok: true } } }
      writeFileSync(
        join(dir, 'secrets.test.json'),
        JSON.stringify(data),
        'utf8'
      )

      const context = {
        constants: { workingDirectory: dir, environment: 'test' },
      } as unknown as ServicesContext<any>

      const service: JsonServices = createJsonSecretsService(context)
      const input = { key: 'my.obj' }

      const actual = await service.getStoredJsonSecret<typeof data.my.obj>(
        input as any
      )

      const expected = { x: 1, ok: true }
      assert.deepEqual(actual, expected)

      rmSync(dir, { recursive: true, force: true })
    })

    it('should throw when the resolved key is missing for JSON secrets', async () => {
      const dir = makeTempSecretsDir()
      writeFileSync(join(dir, 'secrets.test.json'), JSON.stringify({}), 'utf8')

      const context = {
        constants: { workingDirectory: dir, environment: 'test' },
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

      rmSync(dir, { recursive: true, force: true })
    })
  })

  describe('#storeSecret()', () => {
    it('should throw Not implemented', async () => {
      const dir = makeTempSecretsDir()
      writeFileSync(
        join(dir, 'secrets.test.json'),
        JSON.stringify({ my: { key: 'abc' } }),
        'utf8'
      )

      const context = {
        constants: { workingDirectory: dir, environment: 'test' },
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

      rmSync(dir, { recursive: true, force: true })
    })

    it('should throw when secrets file does not exist', async () => {
      const dir = makeTempSecretsDir()

      const context = {
        constants: { workingDirectory: dir, environment: 'test' },
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
        /Failed to read secrets file .*secrets\.test\.json:/
      assert.match(actual, expectedPattern)

      rmSync(dir, { recursive: true, force: true })
    })

    it('should throw when secrets file is not a JSON object', async () => {
      const dir = makeTempSecretsDir()
      writeFileSync(join(dir, 'secrets.test.json'), JSON.stringify([]), 'utf8')

      const context = {
        constants: { workingDirectory: dir, environment: 'test' },
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

      rmSync(dir, { recursive: true, force: true })
    })
  })
})
