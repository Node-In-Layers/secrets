import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import dotenv from 'dotenv'
import type { ServicesContext } from '@node-in-layers/core'

import type {
  GetSecretProps,
  SecretsService,
  WithSecretsConfig,
} from '../core/types.js'

export const create = (
  context: ServicesContext<WithSecretsConfig>
): SecretsService => {
  const load = async (): Promise<Record<string, string>> => {
    const configuredPath =
      context.config['@node-in-layers/secrets']?.dotenvFilePath ?? '.env'
    const filePath = resolve(context.constants.workingDirectory, configuredPath)
    const raw = await readFile(filePath, 'utf8').catch(error => {
      throw new Error(
        `Failed to read dotenv file ${filePath}: ${error.message}`
      )
    })
    return dotenv.parse(raw)
  }

  const getStoredSecret = async (props: GetSecretProps): Promise<string> => {
    const data = await load()
    const value = data[props.key]
    if (value === undefined) {
      throw new Error(`Secret not found in dotenv file for key: ${props.key}`)
    }
    return value
  }

  const storeSecret = async (): Promise<void> => {
    throw new Error('Not implemented')
  }

  return {
    getStoredSecret,
    storeSecret,
  }
}
