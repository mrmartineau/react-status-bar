# @mrmartineau/react-status-bar

A lightweight, portal-based **status bar system for React**. Any component can push UI into a shared bar; a viewport aggregates the entries and renders them — optionally portaled to a fixed location in the DOM.

Built on an external store + `useSyncExternalStore`, so a status change re-renders **only** the viewport reading that scope — never the producer tree.

```tsx
<StatusBarProvider>
  <StatusBarViewport mode="stack" separator="•" />

  {/* ...anywhere deeper in the tree... */}
  <StatusBar priority={1}>Preview mode</StatusBar>
  <StatusBar priority={2}>Autosaving…</StatusBar>
</StatusBarProvider>
// → "Preview mode • Autosaving…"  (lower priority is more important, like P0 > P1)
```

## Features

- **Side-effect component API** — `<StatusBar>…</StatusBar>` registers content while mounted, removes it on unmount.
- **Portaled rendering** — `<StatusBarViewport portalTarget>` mounts output anywhere in the DOM.
- **Multiple producers** — any number of components contribute; entries sort by priority (lower = more important), then recency.
- **Viewport-owned presentation** — `mode="replace"` (show the winner) or `mode="stack"` (show all).
- **Pinned sides** — `align="start"` / `align="end"` push entries to opposite ends with a fluid gap between, like an editor status bar.
- **Overflow clipping** — `overflow="clip"` hides the least-important entries one by one when they don't fit, VS-Code style.
- **Scopes** — independent bars (`global`, `editor`, `modal-42`) from one provider.
- **Surgical re-renders** — status changes re-render only the subscribed viewport, not the tree.
- **Accessible** — a single `role="status"` / `aria-live` region stays mounted so screen readers announce reliably.
- **SSR-safe** — server snapshot is always empty → zero hydration mismatch.

## Install

```bash
bun add @mrmartineau/react-status-bar
# or
pnpm install @mrmartineau/react-status-bar
# or
npm install @mrmartineau/react-status-bar
```

`react` and `react-dom` (18+) are peer dependencies.

## Usage

### 1. Mount the provider and a viewport

```tsx
import { StatusBarProvider, StatusBarViewport } from "@mrmartineau/react-status-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <StatusBarProvider>
      <div className="app-layout">
        {/* A fixed shell node. Give it a min-height to avoid layout shift. */}
        <div id="statusbar-global" className="statusbar-shell" />
        <StatusBarViewport portalTarget="#statusbar-global" mode="stack" separator="•" />
        {children}
      </div>
    </StatusBarProvider>
  );
}
```

> `portalTarget` is optional — omit it and the viewport renders **inline** wherever you place it (portals just let you mount the output into a fixed shell node). The bar ships **unstyled** so it inherits your design; drop in the minimal CSS from [Styling](#styling) to get started.

### 2. Contribute from anywhere

```tsx
import { StatusBar } from "@mrmartineau/react-status-bar";

function Editor() {
  return (
    <>
      <StatusBar priority={2}>Autosaving…</StatusBar>
      <StatusBar priority={1}>Preview mode</StatusBar>
    </>
  );
}
```

With `mode="stack"` the viewport renders all entries sorted by priority (lower = more important) then recency. With `mode="replace"` only the most important — lowest-numbered — entry shows; producers don't change.

### 3. Multiple scopes (independent bars)

```tsx
<StatusBarViewport scope="global" portalTarget="#statusbar-global" />
<StatusBarViewport scope="editor" portalTarget="#statusbar-editor" mode="stack" />

<StatusBar scope="editor">Spellcheck enabled</StatusBar>
```

### 4. Pinned sides & overflow

Give entries an `align` to push them to opposite ends of the bar — `"start"` (default) collects on the left, `"end"` on the right, with a fluid gap between. Turn on `overflow="clip"` and the viewport measures itself and hides the least-important entries one at a time when they don't fit, restoring them as space returns (like VS Code's status bar).

```tsx
<div id="statusbar" className="statusbar-shell" />
<StatusBarViewport portalTarget="#statusbar" mode="stack" separator="•" overflow="clip" />

{/* …anywhere deeper… */}
<StatusBar align="start" priority={0}>main ✓</StatusBar>
<StatusBar align="start" priority={3}>Spaces: 2</StatusBar>
<StatusBar align="end" priority={0}>Ln 12, Col 4</StatusBar>
<StatusBar align="end" priority={4}>Prettier</StatusBar>
// → [ main ✓  Spaces: 2 ............... Prettier  Ln 12, Col 4 ]
```

Important entries sit on the outer edges; the lowest-priority entries land nearest the centre and are the first to be clipped when the bar runs out of room. With a single side, the least-important (right-most) entry clips first. `overflow="clip"` needs a flex layout and forces a single line — see [Styling](#styling).

### 5. Imperative API

```tsx
import { useStatusBar } from "@mrmartineau/react-status-bar";

function SaveButton() {
  const sb = useStatusBar();
  async function onClick() {
    sb.show("Saving…", { priority: 5 });
    try {
      await save();
      sb.show("Saved", { priority: 3 }); // same entry, updated in place
      setTimeout(() => sb.hide(), 1500);
    } catch {
      sb.show("⚠️ Save failed", { priority: 0 }); // most important — escalate to P0
    }
  }
  return <button onClick={onClick}>Save</button>;
}
```

`show()` is an idempotent upsert; the entry is removed automatically when the calling component unmounts.

## API

### `<StatusBarProvider>`

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | App subtree. |
| `store` | `StatusStore` | auto | Inject your own store (handy in tests). |

### `<StatusBar>`

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Content to contribute. |
| `priority` | `number` | lowest | Lower = more important (incident-style: P0 > P1 > P5); lowest-numbered entry wins in `replace` mode. Unset → lowest priority, rendered last. |
| `align` | `"start" \| "end"` | `"start"` | Which side to pin to. `start` collects left, `end` right, with a fluid gap between. |
| `scope` | `string` | `"global"` | Target bar. Changing it migrates the entry correctly. |
| `id` | `string` | auto | Stable identity across remounts. |

### `<StatusBarViewport>`

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `scope` | `string` | `"global"` | Which scope to read. |
| `mode` | `"replace" \| "stack"` | `"replace"` | Presentation is owned here, not by producers. |
| `overflow` | `"visible" \| "clip"` | `"visible"` | `clip` measures the bar and hides the least-important entries one by one until the rest fit on one line. Adds `statusbar--clip` + `data-clipped`. Needs a flex layout. |
| `empty` | `ReactNode` | `null` | Rendered inside the always-mounted live region when idle. |
| `separator` | `ReactNode` | — | Between items in `stack` mode. Marked `aria-hidden`. |
| `portalTarget` | `HTMLElement \| string \| null` | — | Renders inline if omitted; warns in dev if a selector matches nothing. |
| `className` | `string` | — | Added to the live region. |
| `ariaLive` | `"off" \| "polite" \| "assertive"` | `"polite"` | Live-region politeness. |
| `renderItem` | `(entry: StatusEntry) => ReactNode` | — | Custom per-item wrapper (badges, icons, transitions). |

### `useStatusBar({ scope? })`

Returns `{ show(node, { priority?, align? }), hide() }`. `show` is an idempotent upsert (`priority` is lowest-wins and `align` defaults to `"start"`, like the `<StatusBar>` props); the entry auto-removes on unmount.

### `createStatusStore()`

The plain-JS store behind the provider. Exposes `upsert`, `remove`, `subscribe`, `getSnapshot(scope)` — unit-test it without React, or inject it via `<StatusBarProvider store={...}>`.

## Styling

Unopinionated. Suggested minimal CSS:

```css
.statusbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 28px; /* reserve height → no layout shift when entries arrive */
}
.statusbar__item { white-space: nowrap; }
.statusbar__sep { opacity: 0.6; }
.statusbar[data-empty] { /* style the idle state */ }

/* Pinned sides: groups hold each side; the spacer pushes them apart. */
.statusbar__group { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
.statusbar__spacer { flex: 1 1 auto; } /* also applied inline, so sides work unstyled */

/* Overflow clipping: keep everything on one line so measurement is meaningful. */
.statusbar--clip { flex-wrap: nowrap; overflow: hidden; }
```

The `data-empty` attribute lets you collapse or fade the bar without unmounting the live region. With `overflow="clip"`, `data-clipped` is set on the bar whenever one or more entries are hidden for space — handy for showing a `…` affordance via CSS.

> `align` and `overflow="clip"` rely on the bar being a **flex row** (`.statusbar { display: flex }`) with flex `.statusbar__group`s — the snippet above covers it. The spacer's `flex: 1` is also set inline, so pinned sides separate even before you add CSS.

## Accessibility

- The `role="status"` / `aria-live` region is **always mounted** — screen readers only reliably announce changes inside live regions that already exist.
- Separators are `aria-hidden`.
- Prefer `polite`; reserve `assertive` for genuinely urgent states (save failures, lost connection).

## SSR & hydration

Entries register in effects, so the server and the hydration pass both render an empty bar (`getServerSnapshot` returns the same empty array) — guaranteed no hydration mismatch. Content appears in a layout effect immediately after hydration, before paint; combine with a CSS `min-height` for no layout shift.

## Demo

An [Astro](https://astro.build) demo (React islands for the interactive parts, [ZUI](https://github.com/mrmartineau/zui) for styling, Shiki-highlighted code) lives in [`demo/`](./demo) with pages covering every feature:

```bash
cd demo && bun install && bun run dev
```

Or from the repo root: `bun run demo`.

## Development

```bash
bun install
bun run build   # ESM + CJS + .d.ts via tsdown
bun test        # bun:test + happy-dom
bun run check   # Biome lint + format
```

## License

[ISC](https://choosealicense.com/licenses/isc/) © [Zander Martineau](https://zander.wtf)

> Made by Zander • [zander.wtf](https://zander.wtf) • [GitHub](https://github.com/mrmartineau/)
