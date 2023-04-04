import { welcome } from '../src'
import { describe, expect, test, vi } from 'vitest'

describe('index', () => {
  test('demo part', () => {
    console.log = vi.fn()
    welcome()
    expect(console.log).toHaveBeenCalledWith('hello world')
  })
})
