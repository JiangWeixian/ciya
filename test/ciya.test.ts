import { createModuleGraph } from '../src/lib/index'
import { describe, expect, test, vi } from 'vitest'
import path from 'node:path'

describe('createModuleGraph', () => {
  test('basic usage', async () => {
    // Support resolve pkg from node_modules
    // Support resolve relative path: e.g. `.`
    // Support resolve alias in tsconfig.json
    const moduleGraph = await createModuleGraph('./test/fixtures/basic/src/index.ts')
    expect([...moduleGraph.keys()].length).toBe(3)
  })

  test('support relative root', async () => {
    const moduleGraph = await createModuleGraph('./fixtures/circular/file-a.ts', { root: './test' })
    const abPath = path.resolve(__dirname, './fixtures/circular/file-a.ts')
    expect(moduleGraph.get(abPath)?.isCircular).toBe(true)
  })
})
