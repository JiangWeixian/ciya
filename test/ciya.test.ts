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
    expect([...moduleGraph.keys()].length).toBe(2)
  })
})

describe('circular', () => {
  // file-a import file-b
  // file-b import file-a
  test('support circular', async () => {
    const moduleGraph = await createModuleGraph('./fixtures/circular/file-a.ts', { root: './test' })
    const abPath = path.resolve(__dirname, './fixtures/circular/file-a.ts')
    expect(moduleGraph.get(abPath)?.isCircular).toBe(true)
  })

  // file-a import file-b
  // file-b import file-c
  // file-c import file-a, file-d
  test('support depth circular', async () => {
    const moduleGraph = await createModuleGraph('./fixtures/depth-circular/file-a.ts', { root: './test' })
    const abPath = path.resolve(__dirname, './fixtures/depth-circular/file-a.ts')
    expect(moduleGraph.get(abPath)?.isCircular).toBe(true)
  })
})
