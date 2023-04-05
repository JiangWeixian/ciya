import { createMatchPath, loadConfig } from 'tsconfig-paths'
import { dirname, normalize, resolve, join } from 'pathe'
import enhancedResolve from 'enhanced-resolve'
import { findAll } from 'tsconfck'
import fs from 'node:fs'
import { debug } from './utils'

// MIT License

// Copyright (c) Alec Larson
export function resolveProjectPaths(
  projects: string[] | undefined,
  projectRoot: string,
  workspaceRoot: string,
) {
  if (projects) {
    return projects.map((file) => {
      if (!file.endsWith('.json')) {
        file = join(file, 'tsconfig.json')
      }
      return resolve(projectRoot, file)
    })
  }
  return findAll(workspaceRoot, {
    skip(dir) {
      return dir === 'node_modules' || dir === '.git'
    },
  })
}

const noOp = () => {}
const noMatch = [undefined, false]

const addExtensions = (path: string, exts: string[]) => {
  for (const ext of exts) {
    if (fs.existsSync(`${path}${ext}`)) {
      return `${path}${ext}`
    }
  }
  return path
}

interface Options {
  exts: string[]
}

export async function createResolver(projectRoot: string, { exts = ['tsx'] }: Options) {
  const configLoaderResult = loadConfig(projectRoot)
  const resolvedExts = exts.map(e => `.${e}`)

  if (configLoaderResult.resultType === 'failed') {
    return noOp
  }

  const matchPath = createMatchPath(
    configLoaderResult.absoluteBaseUrl,
    configLoaderResult.paths,
    configLoaderResult.mainFields,
    configLoaderResult.addMatchAll,
  )

  const enhancedResolver = enhancedResolve.create({
    extensions: resolvedExts,
  })

  const enhancedResolveAsync = (id: string, importer: string): Promise<string> => {
    return new Promise((resolve) => {
      enhancedResolver(dirname(importer), id, (error: any, result: any) => {
        if (error) {
          // throw error when resolve alias path
          // ignore, fallback to tsconfig paths resolver
          // console.error(error)
          resolve('')
        }
        debug('enhancedResolveAsync: resolve %s to %s', id, result)
        resolve(result)
      })
    })
  }

  const extRE = new RegExp(`\\.(${exts.join('|')})$`)
  const resolutionCache = new Map<string, string>()
  return async (id: string, importer: string) => {
    // Skip virtual modules.
    if (id.includes('\0')) {
      return noMatch
    }

    importer = normalize(importer)
    const importerFile = importer.replace(/[#?].+$/, '')

    // Ignore importers with unsupported extensions.
    if (!extRE.test(importerFile)) {
      return noMatch
    }

    // Respect the include/exclude properties.
    // const relativeImporterFile = relative(configDir, importerFile)
    // if (!isIncludedRelative(relativeImporterFile)) {
    //   return noMatch
    // }

    // Find and remove Vite's suffix (e.g. "?url") if present.
    // If the path is resolved, the suffix will be added back.
    const suffix = /\?.+$/.exec(id)?.[0]
    if (suffix) {
      id = id.slice(0, -suffix.length)
    }

    let path = resolutionCache.get(id)

    if (!path) {
      // e.g. matchPath('@/index', undefined, undefined, exts)
      path = await enhancedResolveAsync(id, importer)
      if (!path) {
        // e.g. resolve('./index', { basedir: importer, extensions: exts })
        path = matchPath(id, undefined, undefined, resolvedExts)
        // https://github.com/dividab/tsconfig-paths/blob/11b774d994b897c6c8e87dda57375a285813731d/src/try-path.ts#L58-L69
        // tsconfig-paths will remove exts from path
        path = path && addExtensions(path, resolvedExts)
        debug('matchPath: resolve %s to %s', id, path)
      }
    }
    return [path, true]
  }
}
