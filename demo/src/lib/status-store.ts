import { createStatusStore } from "@mrmartineau/react-status-bar";

/**
 * A single store shared across every island on the page.
 *
 * Astro hydrates each `client:` component as an isolated React root, so a
 * `<StatusBarProvider>` in one island can't share context with another. By
 * exporting one module-singleton store and passing it as
 * `<StatusBarProvider store={globalStore}>` in each island, producers in one
 * island still feed the viewport in another — the whole point of the library's
 * injectable store. (Per page load only; Astro is an MPA, so navigation starts
 * fresh, which is exactly what we want for the per-page status.)
 */
export const globalStore = createStatusStore();
