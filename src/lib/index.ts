import { init, parse } from 'es-module-lexer'
import { parse as tsconfckParse } from 'tsconfck'
import fs from 'node:fs/promises'
import { dirname } from 'node:path'
import { normalize, resolve } from 'pathe'
import { uniq } from 'lodash-es'
import pico from 'picocolors'

import { createResolver, resolveProjectPaths } from './tsconfig-paths'
import { debug, shortPath } from './utils'
import type { Logger } from './utils'

interface Module {
  // Real filepath on disk
  file: string
  // Imported id. e.g. import m from "id"
  id: string
  // Array of id
  imports: string[]
  // Child module
  imported: Set<Module>
  // Parent module
  importer: Set<Module>
  isCircular?: boolean
  // Order is from bottom to top
  urlStack: string[]
}

const isCircular = (url: string, urlStack: string[]) => {
  // console.log(urlStack.includes(url), urlStack, url)
  return urlStack.includes(url)
}

const isNodeModules = (url: string) => /node_modules/.test(url)

export interface CreateModuleGraphOptions {
  /**
   * @description Resolve entry file and search all available tsconfig.json from root dir
   * @default process.cwd()
   */
  root: string
  /**
   * @default 'silent'
   */
  logger?: Logger
}

export const createModuleGraph = async (importer: string, { root = process.cwd(), logger }: CreateModuleGraphOptions = { root: process.cwd() }) => {
  // Resolve root from cwd, support relative root path
  const resolvedRoot = resolve(process.cwd(), root)
  const resolvedOptions = {
    entry: resolve(resolvedRoot, importer),
    root: resolvedRoot
  }
  const projects = await resolveProjectPaths(undefined, root, root)
  const moduleGraph = new Map<string, Module>()
  const parsedProjects = new Set(
    await Promise.all(
      projects.map(tsconfigFile =>
        tsconfckParse(tsconfigFile),
      ),
    ),
  )
  const resolversByDir = {}
  const defaultResolver = await createResolver(root, { exts: ['tsx', 'ts', 'js', 'jsx', 'cjs', 'mjs'] })
  parsedProjects.forEach(async (project) => {
    const projectDir = normalize(dirname(project.tsconfigFile))
    const resolver = await createResolver(project.tsconfigFile, { exts: ['tsx', 'ts', 'js', 'jsx', 'cjs', 'mjs'] })
    if (!resolversByDir[projectDir]) {
      resolversByDir[projectDir] = []
    }
    const resolvers = resolversByDir[projectDir]
    resolvers.push(resolver)
  })

  const resolveId = async (id: string, importer: string): Promise<string | undefined> => {
    let prevProjectDir: string | undefined
    let projectDir = dirname(importer)
    while (projectDir && projectDir !== prevProjectDir) {
      // If tsconfig.json not found, use default resolver as fallback
      const resolvers = resolversByDir[projectDir] ?? [defaultResolver]
      debug('%s resolver from project %s, ', resolversByDir[projectDir] ? 'found' : 'not-found', projectDir)
      if (resolvers) {
        for (const resolver of resolvers) {
          const [resolved, matched] = await resolver(
            id,
            importer,
          )
          if (resolved) {
            return resolved
          }
          if (matched) {
            // Once a matching resolver is found, stop looking.
            break
          }
        }
      }
      prevProjectDir = projectDir
      projectDir = dirname(prevProjectDir)
    }
    return undefined
  }

  await init

  const ensureModule = (file: string, info: Partial<Module> = {}) => {
    let module = moduleGraph.get(file)
    if (!module) {
      moduleGraph.set(file, {
        file,
        imports:
        [],
        imported:
        new Set(),
        id: file,
        importer: new Set(),
        urlStack: [],
        ...info,
      })
      // promise file module is exits
      module = moduleGraph.get(file)!
    }
    return module
  }

  const walk = async (file: string, urlStack: string[] = []) => {
    const module = ensureModule(file)
    // es-module get all import module first
    if (module.imported && module.imported.size === 0) {
      const source = (await fs.readFile(file, 'utf-8')).toString()
      const [imports] = parse(source)
      module.imports = imports.map(i => source.slice(i.s, i.e))
      for (const id of module.imports) {
        const resolvedId = await resolveId(id, file)
        debug('resolve %s to %s', id, resolvedId)
        if (resolvedId && !isNodeModules(resolvedId)) {
          const m = ensureModule(resolvedId, {
            id,
            importer: new Set<Module>().add(moduleGraph.get(file)!),
          })
          module?.imported.add(m)
        }
      }
    }
    if (module.imported && module.imported.size > 0) {
      for (const m of [...module.imported.values()]) {
        // (should use set?)
        urlStack = uniq(urlStack.concat(file))
        m.urlStack = urlStack.concat([])
        debug('file %s url stacks %o', m.file, urlStack)
        m.isCircular = isCircular(m.file, urlStack)
        // TODO: reporter, or log circular info
        // Skip circular
        if (m.isCircular) {
          logger?.warn(
            `${urlStack
              .concat(m.file)
              .map(url => pico.bold(pico.yellow(shortPath(url, resolvedOptions))))
              .join(pico.cyan(' -> '))}`
            )
          continue
        }
        await walk(m.file, urlStack)
      }
    }
  }
  // create root module graph
  await walk(resolvedOptions.entry)
  return moduleGraph
}

// createModuleGraph(
//   '/Users/bytedance/Projects/ciya/test/fixtures/circular/file-a.ts',
//   { root: '/Users/bytedance/Projects/ciya/test/fixtures/circular' })
