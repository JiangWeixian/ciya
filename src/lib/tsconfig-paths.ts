import { createMatchPath, loadConfig } from 'tsconfig-paths'
import { dirname, normalize, resolve, join } from 'pathe'
import enhancedResolve from 'enhanced-resolve'
import { findAll } from 'tsconfck'


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

interface Options {
  exts: string[]
}

export async function createResolver(projectRoot: string, { exts = ['tsx'] }: Options) {
  const configLoaderResult = loadConfig(projectRoot)

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
    extensions: exts.map(e => `.${e}`),
  })

  const enhancedResolveAsync = (id: string, importer: string): Promise<string> => {
    return new Promise((resolve) => {
      enhancedResolver(dirname(importer), id, (error: any, result: any) => {
        if (error) {
          console.error(error)
          resolve('')
        }
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
      // console.log('enhancedResolveAsync', path, id, importer)
      if (!path) {
        // e.g. resolve('./index', { basedir: importer, extensions: exts })
        path = matchPath(id, undefined, undefined, exts.map(e => `.${e}`))
      }
    }
    return [path, true]
  }
}
