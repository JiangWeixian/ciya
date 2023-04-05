# ciya
> Build **moduleGraph** and find **Circular**

## usage

```console
pnpm i ciya
```

### `cli` 

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

## features

- Create module graph from entry file
- Support `node` apis and cli usages

