// eslint-disable-next-line import/no-extraneous-dependencies -- rollup automatic bundle
import cac from 'cac'
import { createModuleGraph } from './lib'
import { createLogger, debug } from './lib/utils'
import type { CreateModuleGraphOptions } from './lib'

const cli = cac()

cli
  .command('<entry>', '[string] Build module graph from entry file')
  .option('--root [root]', '[string] Resolve entry file and search all available tsconfig.json from root dir')
  .option('--logLevel [logLevel]', '[string] log level', { default: 'warn' })
  .action(async (entry, options) => {
    debug('cli options %o', options)
    const resolvedOptions: CreateModuleGraphOptions = {
      root: options.root ?? process.cwd(),
      logger: createLogger(options.logLevel),
    }
    await createModuleGraph(entry, resolvedOptions)
  })

cli.help()

cli.parse()
