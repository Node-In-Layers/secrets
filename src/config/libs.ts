import get from 'lodash/get.js'
import merge from 'lodash/merge.js'
import isPlainObject from 'lodash/isPlainObject.js'

import {
  NilSecretEntryKey,
  NilSecretEntryType,
  type NilSecretEntry,
  type NilSecretsToReplace,
} from './types.js'

const _findObjects = (
  path: undefined | string,
  obj: unknown,
  isMatch: (obj: object) => boolean
): string[] => {
  if (isPlainObject(obj)) {
    const match = isMatch(obj as object)
    if (match) {
      if (!path) {
        throw new Error(`Cannot match base object`)
      }
      return [path]
    }
    return Object.entries(obj as Record<string, unknown>).reduce(
      (acc, [key, value]) => {
        const fullPath = path ? `${path}.${key}` : key
        return acc.concat(_findObjects(fullPath, value, isMatch))
      },
      [] as string[]
    )
  }
  return []
}

const findNestedObjects = (
  obj: unknown,
  isMatch: (obj: object) => boolean
): string[] => {
  return _findObjects(undefined, obj, isMatch)
}

const isNilSecretEntry = (obj: object): boolean => {
  return (
    NilSecretEntryKey in obj &&
    (obj as Record<string, unknown>)[NilSecretEntryKey] ===
      NilSecretEntryType &&
    'key' in obj
  )
}

/**
 * Finds all `type: 'nil-secret'` entries in the config tree (see README).
 */
const findNilSecretEntries = (rawConfig: object): NilSecretsToReplace => {
  return findNestedObjects(rawConfig, isNilSecretEntry).reduce((acc, path) => {
    return merge(acc, {
      [path]: get(rawConfig, path) as NilSecretEntry,
    })
  }, {} as NilSecretsToReplace)
}

export { findNilSecretEntries, findNestedObjects, isNilSecretEntry }
