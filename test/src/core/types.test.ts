import { assert } from 'chai'

import { SECRETS_CONFIG_RESOLUTION } from '../../../src/core/types.js'

describe('/src/core/types.ts', () => {
  describe('#SECRETS_CONFIG_RESOLUTION', () => {
    it('should include factory and the ordered default backend steps', () => {
      const actual = SECRETS_CONFIG_RESOLUTION
      const expected = [
        'secretServiceFactory',
        'jsonBackendDefault',
        'envBackendDefault',
        'dotenvBackendDefault',
      ]

      assert.deepEqual(actual, expected)
    })
  })
})
