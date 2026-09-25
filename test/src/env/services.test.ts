import { assert } from 'chai'

import { create } from '../../../src/env/services.js'

describe('/src/env/services.ts', () => {
  describe('#create()', () => {
    it('should return a secret from process.env by exact key', async () => {
      process.env.NIL_TEST_SECRET = 'secret-value'
      const services = create()

      const actual = await services.getStoredSecret({ key: 'NIL_TEST_SECRET' })

      assert.equal(actual, 'secret-value')
      delete process.env.NIL_TEST_SECRET
    })

    it('should return an empty string when the environment variable is empty', async () => {
      process.env.NIL_TEST_SECRET = ''
      const services = create()

      const actual = await services.getStoredSecret({ key: 'NIL_TEST_SECRET' })

      assert.equal(actual, '')
      delete process.env.NIL_TEST_SECRET
    })

    it('should reject when the environment variable is missing', async () => {
      delete process.env.NIL_TEST_SECRET
      const services = create()

      const actual = services.getStoredSecret({ key: 'NIL_TEST_SECRET' })

      await actual.then(
        () => assert.fail('Expected missing environment key to reject'),
        error =>
          assert.include(
            error.message,
            'Secret not found in process environment'
          )
      )
    })

    it('should reject secret writes', async () => {
      const services = create()

      const actual = services.storeSecret({
        key: 'NIL_TEST_SECRET',
        value: 'secret-value',
      })

      await actual.then(
        () => assert.fail('Expected environment writes to reject'),
        error => assert.equal(error.message, 'Not implemented')
      )
    })
  })
})
