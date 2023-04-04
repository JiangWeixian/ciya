import { findAll } from 'tsconfck'
import { resolve, join } from 'node:path'

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
