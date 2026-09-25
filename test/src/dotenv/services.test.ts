import { assert } from 'chai'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { create } from '../../../src/dotenv/services.js'

describe('/src/dotenv/services.ts', () => {
  const makeTempSecretsDir = () =>
    mkdtempSync(join(tmpdir(), 'node-in-layers-dotenv-'))

  describe('#create()', () => {
    it('should read exact keys from the default .env file', async () => {
      const dir = makeTempSecretsDir()
      writeFileSync(
        join(dir, '.env'),
        'NIL_TEST_SECRET=secret-value\nNIL_OTHER_SECRET="other-value"\n',
        'utf8'
      )
      const services = create({
        config: {},
        constants: { workingDirectory: dir, environment: 'test' },
      } as any)

      const actual = await services.getStoredSecret({ key: 'NIL_TEST_SECRET' })

      assert.equal(actual, 'secret-value')
      rmSync(dir, { recursive: true, force: true })
    })

    it('should read from a configured dotenv file path', async () => {
      const dir = makeTempSecretsDir()
      const filePath = join(dir, 'local.env')
      writeFileSync(filePath, 'NIL_TEST_SECRET=secret-value\n', 'utf8')
      const services = create({
        config: {
          '@node-in-layers/secrets': { dotenvFilePath: 'local.env' },
        },
        constants: { workingDirectory: dir, environment: 'test' },
      } as any)

      const actual = await services.getStoredSecret({ key: 'NIL_TEST_SECRET' })

      assert.equal(actual, 'secret-value')
      rmSync(dir, { recursive: true, force: true })
    })

    it('should reject when the dotenv key is missing', async () => {
      const dir = makeTempSecretsDir()
      writeFileSync(join(dir, '.env'), 'NIL_OTHER_SECRET=other-value\n', 'utf8')
      const services = create({
        config: {},
        constants: { workingDirectory: dir, environment: 'test' },
      } as any)

      const actual = services.getStoredSecret({ key: 'NIL_TEST_SECRET' })

      await actual.then(
        () => assert.fail('Expected missing dotenv key to reject'),
        error =>
          assert.include(error.message, 'Secret not found in dotenv file')
      )
      rmSync(dir, { recursive: true, force: true })
    })

    it('should reject secret writes', async () => {
      const dir = makeTempSecretsDir()
      const services = create({
        config: {},
        constants: { workingDirectory: dir, environment: 'test' },
      } as any)

      const actual = services.storeSecret({
        key: 'NIL_TEST_SECRET',
        value: 'secret-value',
      })

      await actual.then(
        () => assert.fail('Expected dotenv writes to reject'),
        error => assert.equal(error.message, 'Not implemented')
      )
      rmSync(dir, { recursive: true, force: true })
    })
  })
})
