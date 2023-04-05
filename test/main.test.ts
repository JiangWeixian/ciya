import { createModuleGraph } from '../src/lib/index'
import { describe, expect, test, vi } from 'vitest'

describe('createModuleGraph', () => {
  test('basic usage', async () => {
    const moduleGraph = await createModuleGraph('./test/fixtures/circular/file-a.ts')
  })

  test('support relative root', async () => {
    const moduleGraph = await createModuleGraph('./fixtures/circular/file-a.ts', { root: './test' })
  })
})
