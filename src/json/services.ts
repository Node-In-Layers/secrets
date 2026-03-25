import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import get from 'lodash/get.js'
import type { JsonObj } from 'functional-models'
import { Config, memoizeValue, ServicesContext } from '@node-in-layers/core'
import type { GetSecretProps } from '../core/types.js'
import type { JsonServices } from './types.js'

export const create = (context: ServicesContext<Config>): JsonServices => {
  const filePath = () =>
    join(
      context.constants.workingDirectory,
      `secrets.${context.constants.environment}.json`
    )

  const load = memoizeValue(async (): Promise<JsonObj> => {
    const raw = await readFile(filePath(), 'utf8').catch(e => {
      throw new Error(`Failed to read secrets file ${filePath()}: ${e.message}`)
    })
    const parsed = JSON.parse(raw) as unknown
    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      throw new Error(`Secrets file ${filePath()} must be a JSON object`)
    }
    return parsed as JsonObj
  })

  const getStoredSecret = async (props: GetSecretProps): Promise<string> => {
    const data = await load()
    const value = get(data, props.key)
    if (value === undefined) {
      throw new Error(`Secret not found for key: ${props.key}`)
    }
    if (typeof value !== 'string') {
      throw new Error(`Secret value for key ${props.key} is not a string`)
    }
    return value
  }

  const getStoredJsonSecret = async <T extends JsonObj = JsonObj>(
    props: GetSecretProps
  ): Promise<T> => {
    const obj = await load()
    const response = get(obj, props.key) as T
    if (response === undefined) {
      throw new Error(`Secret not found for key: ${props.key}`)
    }
    return response
  }

  const storeSecret = async (): Promise<void> => {
    throw new Error('Not implemented')
  }

  return {
    getStoredSecret,
    storeSecret,
    getStoredJsonSecret,
  }
}
