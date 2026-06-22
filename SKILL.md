---
name: react-status-bar
description: 'Integrate @mrmartineau/react-status-bar into a React app — a portal-based status bar where any component pushes UI into a shared bar and a viewport owns presentation. Use when adding a status bar, contributing transient status from deep in the tree, pinning entries to the left/right (align), clipping overflow VS-Code style, scoping independent bars, or wiring the imperative useStatusBar hook.'
---

# Integrating @mrmartineau/react-status-bar

A lightweight, portal-based **status bar system for React**. Any component, anywhere in the tree, pushes content into a shared bar; a single viewport aggregates the entries and renders them — optionally portaled to a fixed shell node.

Built on an external store + `useSyncExternalStore`, so a status change re-renders **only** the viewport reading that scope, never the producer tree. The package ships **unstyled** — you supply the CSS (a minimal starting sheet is below).

## Install

```bash
npm install @mrmartineau/react-status-bar
# or: bun add … / pnpm add … / yarn add …
```

`react` and `react-dom` **18+** are peer dependencies (works with 18 and 19). ESM + CJS are both published; just import by name:

```tsx
import {
  StatusBarProvider,
  StatusBarViewport,
  StatusBar,
  useStatusBar,
} from "@mrmartineau/react-status-bar";
```

## Mental model — four pieces

1. **`<StatusBarProvider>`** — wraps your app (or a subtree). Owns the store. Renders no DOM and never re-renders on status changes.
2. **`<StatusBarViewport>`** — the **host**. Reads one scope and renders its entries. Place one per visible bar. Owns presentation (mode, separator, sides, overflow). Can portal its output to a fixed shell node.
3. **`<StatusBar>`** — a **producer**. A side-effect component: while mounted it registers its `children` as an entry; on unmount the entry is removed. Renders `null`.
4. **`useStatusBar()`** — the **imperative** equivalent of `<StatusBar>` for event handlers / async flows (`show()` / `hide()`).

Entries sort by `priority` (**lower = more important**, incident-style P0 > P1 > P5), then by recency.

## Minimal setup

```tsx
import { StatusBarProvider, StatusBarViewport, StatusBar } from "@mrmartineau/react-status-bar";

function App() {
  return (
    <StatusBarProvider>
      {/* The host — one bar. mode="stack" shows all entries. */}
      <StatusBarViewport mode="stack" separator="•" />

      {/* …anywhere deeper in the tree… */}
      <StatusBar priority={1}>Preview mode</StatusBar>
      <StatusBar priority={2}>Autosaving…</StatusBar>
    </StatusBarProvider>
  );
}
// → "Preview mode • Autosaving…"
```

`mode="replace"` (the default) shows only the single most-important entry; `mode="stack"` shows them all, sorted.

## Required CSS (ships unstyled)

The component only emits class names + structure. Drop in this sheet to get a working horizontal bar — **`align` and `overflow="clip"` require the flex layout below**:

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

/* Pinned sides: each side is a group; the spacer pushes them apart. */
.statusbar__group { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
.statusbar__spacer { flex: 1 1 auto; } /* also applied inline, so sides work even unstyled */

/* Overflow clipping: keep everything on one line so measurement is meaningful. */
.statusbar--clip { flex-wrap: nowrap; overflow: hidden; }
```

## API reference

### Exports

| Export | Kind | Purpose |
| --- | --- | --- |
| `StatusBarProvider` | component | Owns the store; wrap your app. |
| `StatusBarViewport` | component | Host that renders a scope's entries. |
| `StatusBar` | component | Declarative producer (registers while mounted). |
| `useStatusBar` | hook | Imperative `show()` / `hide()`. |
| `createStatusStore` | factory | The plain-JS store (inject in tests, or drive without React). |
| `fitCount` | function | Pure overflow math: how many items fit a width. Rarely needed directly. |
| `StatusEntry`, `StatusAlign`, `StatusBarMode`, `StatusBarOverflow`, `StatusStore` | types | Public TypeScript types. |

### `<StatusBarProvider>`

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | App subtree. |
| `store` | `StatusStore` | auto | Inject your own store (handy in tests / multi-renderer setups). |

### `<StatusBar>` (producer)

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Content to contribute. |
| `priority` | `number` | lowest | Lower = more important; lowest-numbered wins in `replace` mode. Unset → rendered last. |
| `align` | `"start" \| "end"` | `"start"` | Which side to pin to. `start` collects left, `end` right, fluid gap between. |
| `scope` | `string` | `"global"` | Target bar. Changing it migrates the entry. |
| `id` | `string` | auto | Stable identity across remounts. |

### `<StatusBarViewport>` (host)

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `scope` | `string` | `"global"` | Which scope to read. |
| `mode` | `"replace" \| "stack"` | `"replace"` | `replace` = winner only; `stack` = all, sorted. |
| `overflow` | `"visible" \| "clip"` | `"visible"` | `clip` hides the least-important entries one by one until the rest fit one line. Adds `statusbar--clip` + `data-clipped`. Needs flex layout. |
| `empty` | `ReactNode` | `null` | Rendered in the always-mounted live region when idle. |
| `separator` | `ReactNode` | — | Between items in `stack` mode. `aria-hidden`. |
| `portalTarget` | `HTMLElement \| string \| null` | — | Renders inline if omitted; warns in dev if a selector matches nothing. |
| `className` | `string` | — | Added to the live region. |
| `ariaLive` | `"off" \| "polite" \| "assertive"` | `"polite"` | Live-region politeness. |
| `renderItem` | `(entry: StatusEntry) => ReactNode` | — | Custom per-item wrapper (badges, icons, transitions). |

### `useStatusBar({ scope? })`

Returns `{ show(node, { priority?, align? }), hide() }`. `show` is an idempotent upsert; the entry auto-removes when the calling component unmounts.

## Pinned sides (`align`)

Push entries to opposite ends with a fluid gap between — like an editor status bar. Important entries sit on the **outer** edges; the lowest-priority entries land nearest the centre.

```tsx
<StatusBarViewport mode="stack" separator="•" />

<StatusBar align="start" priority={0}>main ✓</StatusBar>
<StatusBar align="start" priority={3}>Spaces: 2</StatusBar>
<StatusBar align="end" priority={0}>Ln 12, Col 4</StatusBar>
<StatusBar align="end" priority={4}>Prettier</StatusBar>
// → [ main ✓ • Spaces: 2 .............. Prettier • Ln 12, Col 4 ]
```

Requires the flex `.statusbar` / `.statusbar__group` CSS above. The spacer's `flex: 1` is also set inline, so sides separate even before you add CSS.

## Overflow clipping (`overflow="clip"`)

Opt in and the viewport measures itself and hides the **least-important** entries one at a time when they don't fit, restoring them as space returns (like VS Code's status bar). With pinned sides, the inner (centre-most) entries clip first; with a single side, the right-most clips first.

```tsx
<StatusBarViewport mode="stack" overflow="clip" separator="•" />
```

- Forces a single line (`flex-wrap: nowrap`) — needs the flex layout.
- Sets `data-clipped` on the bar while anything is hidden — use it for a `…` affordance:
  ```css
  .statusbar[data-clipped]::after { content: "…"; opacity: 0.6; }
  ```
- Uses `ResizeObserver`; recomputes on resize and on entry/content change.

## Scopes (independent bars)

One provider can drive many logical bars. Match a viewport's `scope` to producers' `scope`:

```tsx
<StatusBarViewport scope="global" portalTarget="#statusbar-global" />
<StatusBarViewport scope="editor" portalTarget="#statusbar-editor" mode="stack" />

<StatusBar scope="editor">Spellcheck enabled</StatusBar>
```

Default scope is `"global"`. Scopes are fully independent.

## Portaling to a fixed shell

Give the viewport a `portalTarget` (element or selector) to render its output into a fixed shell node anywhere in the DOM — useful for a sticky footer bar:

```tsx
<div id="statusbar-global" className="statusbar-shell" /> {/* give it a min-height */}
<StatusBarViewport portalTarget="#statusbar-global" mode="stack" separator="•" />
```

Omit `portalTarget` to render **inline** where the viewport sits.

## Imperative API

```tsx
import { useStatusBar } from "@mrmartineau/react-status-bar";

function SaveButton() {
  const sb = useStatusBar(); // or useStatusBar({ scope: "editor" })
  async function onClick() {
    sb.show("Saving…", { priority: 5 });
    try {
      await save();
      sb.show("Saved", { priority: 3 });       // same entry, updated in place
      setTimeout(() => sb.hide(), 1500);
    } catch {
      sb.show("⚠️ Save failed", { priority: 0 }); // escalate to P0
    }
  }
  return <button onClick={onClick}>Save</button>;
}
```

`show()` is an idempotent upsert (one entry per hook instance); it auto-removes on unmount. Pass `{ align }` to pin the imperative entry to a side.

## SSR & hydration

Entries register in effects, so the server and the hydration pass both render an empty bar (`getServerSnapshot` returns a stable empty array) — **no hydration mismatch**. Content appears in a layout effect right after hydration, before paint; pair with a CSS `min-height` for zero layout shift.

## Gotchas

- **Unstyled by default** — without the CSS above you get a vertical, unstyled list. `align` and `overflow="clip"` specifically need the flex `.statusbar` / `.statusbar__group` rules.
- **`overflow="clip"` forces one line** — don't expect wrapping; it measures a single row to decide what fits.
- **Priority is lowest-wins** — `priority={0}` is the most important, not the least. Unset priority renders last.
- **One viewport per visible bar per scope** — multiple viewports on the same scope each render the full set (fine for mirrored bars, surprising otherwise).
- **Producers render `null`** — `<StatusBar>` contributes to the bar; it never renders inline where you place it.
- **The live region is always mounted** (`role="status"` / `aria-live`) — keep one viewport mounted so screen readers announce reliably; reserve `ariaLive="assertive"` for genuinely urgent states.
