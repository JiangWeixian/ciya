// eslint-disable-next-line import/no-extraneous-dependencies -- rollup automatic bundle
import cac from 'cac'
import { createModuleGraph } from './lib'
import { debug } from './lib/utils'
import type { CreateModuleGraphOptions } from './lib'

const cli = cac()

cli
  .command('<entry>', '[string] Build module graph from entry file')
  .option('--root [root]', '[string] Resolve entry file and search all available tsconfig.json from root dir')
  .action(async (entry, options) => {
    debug('cli options %o', options)
    const resolvedOptions: CreateModuleGraphOptions = {
      root: options.root ?? process.cwd(),
    }
    const moduleGraph = await createModuleGraph(entry, resolvedOptions)
    console.log(moduleGraph)
  })

cli.help()

cli.parse()
