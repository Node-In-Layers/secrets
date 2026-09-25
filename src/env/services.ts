import type { GetSecretProps, SecretsService } from '../core/types.js'

export const create = (): SecretsService => {
  const getStoredSecret = async (props: GetSecretProps): Promise<string> => {
    const value = process.env[props.key]
    if (value === undefined) {
      throw new Error(
        `Secret not found in process environment for key: ${props.key}`
      )
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
