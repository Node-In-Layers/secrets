import type {
  CommonContext,
  Config,
  ServicesContext,
} from '@node-in-layers/core'

/**
 * Builds a minimal {@link ServicesContext} from {@link CommonContext} for secrets backends
 * and for running core during globals (before full layer context exists).
 */
export const toServicesContextForSecrets = <TConfig extends Config = Config>(
  ctx: CommonContext<TConfig>
): ServicesContext<TConfig> =>
  ({
    ...ctx,
    log: {} as ServicesContext<TConfig>['log'],
    models: {},
    services: {
      getServices: () => undefined,
    },
  }) as ServicesContext<TConfig>
