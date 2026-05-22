/**
 * Dev-only logging helpers.
 *
 * - `devLog` / `devWarn` are no-ops in production builds (silenced via
 *   `import.meta.env.DEV`), so they're safe to leave at call sites.
 * - For prod-visible errors, keep using `console.error` directly.
 */
const isDev = import.meta.env.DEV;

export const devLog = (...args: unknown[]): void => {
  if (isDev) console.log(...args);
};

export const devWarn = (...args: unknown[]): void => {
  if (isDev) console.warn(...args);
};

export const devInfo = (...args: unknown[]): void => {
  if (isDev) console.info(...args);
};

export const devDebug = (...args: unknown[]): void => {
  if (isDev) console.debug(...args);
};
