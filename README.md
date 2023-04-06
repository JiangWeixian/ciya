# ciya
> Build **moduleGraph** and find **circular** relations. Respect `paths` in `tsconfig.json`

[![npm](https://img.shields.io/npm/v/ciya.svg?style=flat-square)](https://www.npmjs.org/package/ciya) [![npm](https://img.shields.io/npm/l/ciya.svg?style=flat-square)](https://www.npmjs.org/package/ciya)

## usage

```console
pnpm i ciya
```

## features

- Create module graph from entry file
- Support `node` apis and cli usages

### `CLI` 

```
Usage:
  $ ciya <entry>

Commands:
  <entry>  [string] Build module graph from entry file

For more info, run any command with the `--help` flag:
  $ ciya --help

Options:
  --root [root]          [string] Resolve entry file and search all available tsconfig.json from root dir 
  --logLevel [logLevel]  [string] log level (default: silent)
  -h, --help             Display this message 
```

### `Node APIs`

```ts
import { createModuleGraph } from 'ciya'

const moduleGraph = createModuleGraph(entry, { logger, root })
```

[Types define of ModuleGraph](./src/lib/index.ts)

#### options

`entry`

- type: `string`
- require: `true`

Create module graph from `entry` file.

`options.logger`

- type: `Logger`
- require: `false`

`options.root` 

Resolve entry file and search all available tsconfig files from `root`, default is `process.cwd()`

- type: `string`
- require: `false`


