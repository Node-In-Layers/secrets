import { assert } from 'chai'

import { name } from '../../../src/config/index.js'
import { SecretsNamespace } from '../../../src/types.js'

describe('/src/config/index.ts', () => {
  describe('#name()', () => {
    it('should export name as SecretsNamespace.Config', () => {
      // input
      const input = SecretsNamespace.Config

      // run the thing
      const actual = name

      // create your expected value
      const expected = input

      // assert actual expected
      assert.equal(actual, expected)
    })
  })
})
