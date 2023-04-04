import { createMatchPath, loadConfig } from 'tsconfig-paths'
import { dirname, normalize } from 'pathe'
import enhancedResolve from 'enhanced-resolve'

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

    // const internalResolver = () => {
    //   return new Promise((resolve) => {
    //     // e.g. matchPath('@/index', undefined, undefined, exts)
    //     path = matchPath(id, undefined, undefined, exts.map(e => `.${e}`))
    //   })
    //     .then(() => {
    //       if (!path) {
    //         // e.g. resolve('./index', { basedir: importer, extensions: exts })
    //         path = resolveSync(id, { basedir: dirname(importer), extensions: exts.map(e => `.${e}`) })
    //       }
    //     })
    //     .catch((e) => {
    //       if (!path) {
    //       // e.g. resolve('./index', { basedir: importer, extensions: exts })
    //         path = resolveSync(id, { basedir: dirname(importer), extensions: exts.map(e => `.${e}`) })
    //       }
    //     })
    //     .finally(() => {
    //       resolve(path)
    //     })
    // }

    if (!path) {
      // e.g. matchPath('@/index', undefined, undefined, exts)
      path = await enhancedResolveAsync(id, importer)
      // console.log('enhancedResolveAsync', path, id, importer)
      if (!path) {
        // e.g. resolve('./index', { basedir: importer, extensions: exts })
        path = matchPath(id, undefined, undefined, exts.map(e => `.${e}`))
      }
      // path = resolveSync(id, { basedir: dirname(importer), extensions: exts.map(e => `.${e}`) })
      // console.log('resolveSync', path)
      // if (!path) {
      //   // e.g. resolve('./index', { basedir: importer, extensions: exts })
      //   path = matchPath('./index', undefined, undefined, exts.map(e => `.${e}`))
      // }
      // if (path) {
      //   resolutionCache.set(id, path)
      //   debug(`resolved:`, {
      //     id,
      //     importer,
      //     resolvedId: path,
      //     configPath,
      //   })
      // }
    }
    return [path, true]
  }
}

// createResolver({}, { exts: ['ts'] })
