import { assert } from 'chai'

import {
  findNestedObjects,
  findNilSecretEntries,
  isNilSecretEntry,
} from '../../../src/config/libs.js'

describe('/src/config/libs.ts', () => {
  describe('#isNilSecretEntry()', () => {
    it('should return true for objects that contain type:"nil-secret" and key', () => {
      // input
      const input = { type: 'nil-secret', key: '/k' }

      // run the thing
      const actual = isNilSecretEntry(input)

      // create your expected value.
      const expected = true

      // assert actual expected
      assert.equal(actual, expected)
    })

    it('should return false when type is not "nil-secret"', () => {
      const input = { type: 'other', key: '/k' }
      const actual = isNilSecretEntry(input)
      const expected = false
      assert.equal(actual, expected)
    })

    it('should return false when key is missing', () => {
      const input = { type: 'nil-secret' }
      const actual = isNilSecretEntry(input as any)
      const expected = false
      assert.equal(actual, expected)
    })
  })

  describe('#findNestedObjects()', () => {
    it('should return dot paths for nested nil-secret entries', () => {
      // input
      const input = {
        a: { type: 'nil-secret', key: '/k1' },
        b: { c: { type: 'nil-secret', key: '/k2' } },
      }

      // run the thing
      const actual = findNestedObjects(input, isNilSecretEntry)

      // create your expected value.
      const expected = ['a', 'b.c']

      // assert actual expected
      assert.deepEqual(actual.sort(), expected.sort())
    })

    it('should throw when the base object itself matches', () => {
      const input = { type: 'nil-secret', key: '/k1' }

      let thrown: unknown
      try {
        findNestedObjects(input, isNilSecretEntry)
      } catch (e) {
        thrown = e
      }

      const actual = String((thrown as Error)?.message ?? thrown)
      const expected = 'Cannot match base object'
      assert.equal(actual, expected)
    })

    it('should return an empty array when there are no matches', () => {
      const input = { a: { b: 1 }, c: 'x' }
      const actual = findNestedObjects(input, isNilSecretEntry)
      const expected: string[] = []
      assert.deepEqual(actual, expected)
    })
  })

  describe('#findNilSecretEntries()', () => {
    it('should return an object keyed by dot paths to nil-secret entries', () => {
      // input
      const input = {
        a: { type: 'nil-secret', key: '/k1' },
        b: { c: { type: 'nil-secret', format: 'json', key: '/k2' } },
      }

      // run the thing
      const actual = findNilSecretEntries(input as any)

      // create your expected value.
      const expected = {
        a: { type: 'nil-secret', key: '/k1' },
        'b.c': { type: 'nil-secret', format: 'json', key: '/k2' },
      }

      // assert actual expected
      assert.deepEqual(actual, expected)
    })

    it('should return an empty object when there are no nil-secret entries', () => {
      const input = { a: { b: 1 } }
      const actual = findNilSecretEntries(input as any)
      const expected = {}
      assert.deepEqual(actual, expected)
    })
  })
})
