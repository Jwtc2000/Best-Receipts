/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/** The app version from package.json, injected at build time (see vite.config.ts). */
declare const __APP_VERSION__: string

/** The short git commit hash the build was cut from, injected at build time
 * (see vite.config.ts); "unknown" when git history isn't available. */
declare const __COMMIT_HASH__: string
