/**
 * Structured logger — replaces ad-hoc console.* calls.
 * Format: [MODULE] LEVEL — message {context?}
 * In production, only WARN and ERROR are emitted.
 */

const IS_DEV = import.meta.env?.DEV === true;

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL = IS_DEV ? LEVELS.debug : LEVELS.warn;

function log(level, module, message, context) {
  if (LEVELS[level] < MIN_LEVEL) return;
  const prefix = `[${module}] ${level.toUpperCase()} —`;
  if (context !== undefined) {
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](prefix, message, context);
  } else {
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](prefix, message);
  }
}

const createLogger = (module) => ({
  debug: (msg, ctx) => log('debug', module, msg, ctx),
  info:  (msg, ctx) => log('info',  module, msg, ctx),
  warn:  (msg, ctx) => log('warn',  module, msg, ctx),
  error: (msg, ctx) => log('error', module, msg, ctx),
});

export default createLogger;