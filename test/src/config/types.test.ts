import { assert } from 'chai'

import {
  NilSecretEntryKey,
  NilSecretEntryType,
  SecretFormat,
} from '../../../src/config/types.js'

describe('/src/config/types.ts', () => {
  describe('#NilSecretEntryKey()', () => {
    it('should be "type"', () => {
      const input = NilSecretEntryKey
      const actual = input
      const expected = 'type'
      assert.equal(actual, expected)
    })
  })

  describe('#NilSecretEntryType()', () => {
    it('should be "nil-secret"', () => {
      const input = NilSecretEntryType
      const actual = input
      const expected = 'nil-secret'
      assert.equal(actual, expected)
    })
  })

  describe('#SecretFormat()', () => {
    it('should include String and Json formats', () => {
      const input = SecretFormat
      const actual = [input.String, input.Json]
      const expected = ['string', 'json']
      assert.deepEqual(actual, expected)
    })
  })
})
