import Debug from 'debug'

export const debug = Debug('ciya')

export interface Logger {
  info(msg: string): void
  warn(msg: string): void
  silent(msg: any): void
}

export type LogLevel = 'warn' | 'info' | 'silent'

const logLevel2num: Record<LogLevel, number> = {
  info: 0,
  warn: 1,
  silent: 999,
}

export const createLogger = (logLevel: LogLevel): Logger => {
  const log = (type: LogLevel, msg: string) => {
    // logLevel = 'warn' only console.warn will work
    if (logLevel2num[type] < logLevel2num[logLevel]) {
      return
    }
    console[type](msg)
  }
  return {
    info(msg) {
      log('info', msg)
    },
    warn(msg) {
      log('warn', msg)
    },
    silent() {},
  }
}

export const shortPath = (file: string, options: { root: string }) => {
  return file.replace(options.root, '<root>')
}
