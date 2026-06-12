---
status: idea
version: 2
---

A lightweight, portal-based status bar system for React. Any component can push UI into a shared bar; the host viewport aggregates entries and portals the result to a fixed DOM location.

v2 is a rewrite of the original plan. Same idea, but built on an external store + `useSyncExternalStore` instead of context-held reducer state, with a simpler mental model: **producers declare content, the viewport owns presentation.**

---

## What changed from v1 (and why)

**Architecture: external store instead of `useReducer` in context.** In v1, every `add`/`update`/`remove` replaced the context value, re-rendering *every* context consumer — including every mounted `<StatusBar>` — on every status change. Worse, the update effect depended on `children` (a new reference on every parent render), so any re-render near a producer dispatched into the provider and rippled through the whole tree. In v2 the store lives outside React state; viewports subscribe per-scope via `useSyncExternalStore`, so a status change re-renders only the viewport(s) reading that scope. Producers subscribe to nothing.

**Merge mode moved entirely to the viewport.** v1's "the highest-priority entry's `mode` dictates the whole scope" rule meant mounting one component could silently flip the entire bar from stacked to replace. Presentation is now a viewport concern: `<StatusBarViewport mode="replace" | "stack">`. Producers only declare *what* and *how important*.

**Bugs fixed:**

- **Stale entries on `scope`/`id` change.** v1 registered with a mount-only effect (deps disabled via eslint comment), so changing `scope` orphaned the entry under the old scope while updates targeted the new one. v2 keys the cleanup on `[scope, id]` and upserts on render, so identity changes remove + re-register correctly.
- **`useStatusBar().show()` duplicated entries.** v1's `add` action didn't dedupe by id, so calling `show()` twice pushed two entries. v2's store is a `Map` keyed by id — `show` is an idempotent upsert, and the separate `update` method is gone because it's redundant.
- **Hook entries leaked on unmount.** v1's hook never cleaned up; if a component called `show()` and unmounted, the message stayed forever. v2 auto-removes on unmount.
- **Broken `aria-live`.** v1 unmounted the `role="status"` container whenever the bar was empty, so screen readers never had a stable live region to announce changes into (live regions must exist *before* content changes to be announced reliably). v2 keeps the container mounted at all times and toggles content inside it.
- **Unstable keys in stacked mode.** v1 ran content through `React.Children.toArray` and re-keyed by index, defeating the stable per-entry keys. v2 maps entries directly with `key={entry.id}`.
- **Dead code.** The `target ? (target ? … : …) : …` ternary, the double dispatch on mount (`add` then immediate `update`), and the redundant `mergeMode` re-sort in the viewport are all gone.

**SSR story corrected.** v1 claimed it "works with SSR" — technically true but misleading: entries register in effects, so the server (and first client paint) always renders an empty bar. v2 makes this explicit and leans into it: `getServerSnapshot` returns an empty list, which guarantees zero hydration mismatch. Reserve the bar's height in CSS (`min-height`) so content arriving after hydration causes no layout shift.

---

## At a glance

- **Side-effect component API**: `<StatusBar>…</StatusBar>` registers content while mounted.
- **Portaled rendering**: `<StatusBarViewport portalTarget>` mounts output anywhere in the DOM.
- **Multiple producers**: any number of components contribute; entries sort by priority, then recency.
- **Viewport-owned presentation**: `mode="replace"` (show the winner) or `mode="stack"` (show all).
- **Scopes**: independent bars (`global`, `editor`, `modal-42`) from one provider.
- **Surgical re-renders**: status changes re-render only the subscribed viewport, not the tree.

---

## Installation

Copy the **Source Code** section into a file in your project, e.g. `ui/status-bar.tsx`. The only peer dependency is React (18+). Marked `"use client"` for RSC frameworks — producers and viewports are client components by nature (the store lives in the browser), but they can be rendered anywhere inside a server-rendered tree.

---

## Source Code (TypeScript / React)

```tsx
"use client";

import * as React from "react";
import { createPortal } from "react-dom";

// ---------- Types ----------
export type StatusEntry = {
  id: string;       // unique per producer instance
  scope: string;    // logical bar id (supports many bars)
  priority: number; // higher sorts first
  order: number;    // monotonic registration order (recency tiebreak)
  node: React.ReactNode;
};

export type StatusBarMode = "replace" | "stack";

// ---------- Store (lives outside React state) ----------
const EMPTY: StatusEntry[] = [];

export function createStatusStore() {
  let order = 0;
  const scopes = new Map<string, Map<string, StatusEntry>>();
  const listeners = new Map<string, Set<() => void>>();
  const snapshots = new Map<string, StatusEntry[]>(); // cached sorted arrays

  function notify(scope: string) {
    snapshots.delete(scope); // invalidate cache; rebuild lazily on next read
    listeners.get(scope)?.forEach((fn) => fn());
  }

  return {
    /** Add or update an entry. Idempotent — registration order is preserved on update. */
    upsert(entry: Omit<StatusEntry, "order">) {
      let bucket = scopes.get(entry.scope);
      if (!bucket) scopes.set(entry.scope, (bucket = new Map()));
      const existing = bucket.get(entry.id);
      bucket.set(entry.id, { ...entry, order: existing?.order ?? ++order });
      notify(entry.scope);
    },

    remove(scope: string, id: string) {
      const bucket = scopes.get(scope);
      if (!bucket?.delete(id)) return;
      if (bucket.size === 0) scopes.delete(scope);
      notify(scope);
    },

    subscribe(scope: string, listener: () => void) {
      let set = listeners.get(scope);
      if (!set) listeners.set(scope, (set = new Set()));
      set.add(listener);
      return () => {
        set.delete(listener);
        if (set.size === 0) listeners.delete(scope);
      };
    },

    /** Referentially stable until the scope changes — required by useSyncExternalStore. */
    getSnapshot(scope: string): StatusEntry[] {
      let snap = snapshots.get(scope);
      if (!snap) {
        const bucket = scopes.get(scope);
        snap = bucket
          ? [...bucket.values()].sort(
              (a, b) => b.priority - a.priority || b.order - a.order
            )
          : EMPTY;
        snapshots.set(scope, snap);
      }
      return snap;
    },
  };
}

export type StatusStore = ReturnType<typeof createStatusStore>;

// ---------- Context (carries the store reference only — never re-renders) ----------
const StatusContext = React.createContext<StatusStore | null>(null);

export function StatusBarProvider({
  children,
  store,
}: {
  children: React.ReactNode;
  /** Optional: inject your own store (useful in tests). */
  store?: StatusStore;
}) {
  const [fallback] = React.useState(createStatusStore);
  return (
    <StatusContext.Provider value={store ?? fallback}>
      {children}
    </StatusContext.Provider>
  );
}

function useStatusStore() {
  const store = React.useContext(StatusContext);
  if (!store) {
    throw new Error("StatusBar components must be used within <StatusBarProvider>");
  }
  return store;
}

// Layout effect on the client (avoids a flicker frame), plain effect on the server.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

// ---------- Producer: side-effect component ----------
export function StatusBar({
  children,
  priority = 0,
  scope = "global",
  id: explicitId,
}: {
  children: React.ReactNode;
  /** Higher priority sorts first; the top entry wins in "replace" mode. */
  priority?: number;
  /** Logical bar to target. */
  scope?: string;
  /** Optional stable id to share identity across remounts. */
  id?: string;
}) {
  const store = useStatusStore();
  const autoId = React.useId();
  const id = explicitId ?? autoId;

  // Upsert after every render: `children` is a fresh reference whenever the
  // parent re-renders, so there's nothing useful to memoize against. This is
  // cheap — only viewports subscribed to this scope re-render.
  useIsoLayoutEffect(() => {
    store.upsert({ id, scope, priority, node: children });
  });

  // Cleanup keyed on identity: if `scope` or `id` changes, the old entry is
  // removed and the upsert above re-registers under the new identity.
  useIsoLayoutEffect(() => {
    return () => store.remove(scope, id);
  }, [store, scope, id]);

  return null;
}

// ---------- Viewport (host) with portal support ----------
export function StatusBarViewport({
  scope = "global",
  mode = "replace",
  empty = null,
  separator,
  portalTarget,
  className,
  ariaLive = "polite",
  renderItem,
}: {
  /** Which scope to read. */
  scope?: string;
  /** "replace" → top entry only; "stack" → all entries, sorted. */
  mode?: StatusBarMode;
  /** Shown inside the (always-mounted) live region when there are no entries. */
  empty?: React.ReactNode;
  /** Rendered between items in "stack" mode. */
  separator?: React.ReactNode;
  /** HTMLElement or selector string to portal into. Renders inline if omitted. */
  portalTarget?: HTMLElement | string | null;
  className?: string;
  /** ARIA live politeness. */
  ariaLive?: "off" | "polite" | "assertive";
  /** Optional custom wrapper per item. */
  renderItem?: (entry: StatusEntry) => React.ReactNode;
}) {
  const store = useStatusStore();

  const entries = React.useSyncExternalStore(
    React.useCallback((cb) => store.subscribe(scope, cb), [store, scope]),
    () => store.getSnapshot(scope),
    () => EMPTY // server snapshot: always empty → no hydration mismatch
  );

  const target = usePortalTarget(portalTarget);
  const items = mode === "replace" ? entries.slice(0, 1) : entries;

  // The live region container is ALWAYS mounted so screen readers have a
  // stable node to announce changes into. Only its contents change.
  const content = (
    <div
      role="status"
      aria-live={ariaLive}
      className={cn("statusbar", `statusbar--${mode}`, className)}
      data-empty={items.length === 0 || undefined}
    >
      {items.length === 0
        ? empty
        : items.map((entry, i) => (
            <React.Fragment key={entry.id}>
              {i > 0 && separator != null && (
                <span className="statusbar__sep" aria-hidden="true">
                  {separator}
                </span>
              )}
              {renderItem ? (
                renderItem(entry)
              ) : (
                <span className="statusbar__item">{entry.node}</span>
              )}
            </React.Fragment>
          ))}
    </div>
  );

  return target ? createPortal(content, target) : content;
}

function usePortalTarget(portalTarget?: HTMLElement | string | null) {
  const [target, setTarget] = React.useState<HTMLElement | null>(null);

  useIsoLayoutEffect(() => {
    if (!portalTarget) return setTarget(null);
    if (typeof portalTarget !== "string") return setTarget(portalTarget);

    const el = document.querySelector<HTMLElement>(portalTarget);
    if (!el && process.env.NODE_ENV !== "production") {
      console.warn(
        `StatusBarViewport: no element matches "${portalTarget}"; rendering inline.`
      );
    }
    setTarget(el);
  }, [portalTarget]);

  return target;
}

// ---------- Imperative hook ----------
export function useStatusBar({
  scope = "global",
}: { scope?: string } = {}) {
  const store = useStatusStore();
  const id = React.useId();

  // Auto-remove on unmount — a component that called show() can't leak
  // a stale message into the bar.
  React.useEffect(() => {
    return () => store.remove(scope, id);
  }, [store, scope, id]);

  return React.useMemo(
    () => ({
      /** Idempotent: calling show() again updates the same entry in place. */
      show(node: React.ReactNode, opts?: { priority?: number }) {
        store.upsert({ id, scope, priority: opts?.priority ?? 0, node });
      },
      hide() {
        store.remove(scope, id);
      },
    }),
    [store, scope, id]
  );
}

// ---------- Tiny className combiner ----------
function cn(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(" ");
}
```

---

## How it works

- Each `<StatusBar>` (or `useStatusBar().show()`) upserts an **entry** — `{ id, scope, priority, node }` — into a plain JS store held by the provider.
- Entries are bucketed by scope in `Map`s. Sorted snapshots are computed lazily and cached, so `getSnapshot` is referentially stable between changes (a `useSyncExternalStore` requirement).
- `<StatusBarViewport>` subscribes to a single scope. It re-renders when — and only when — that scope changes. It decides presentation (`replace` vs `stack`) and optionally **portals** the output into a fixed shell node.

> Producers never read from the store, so mounting a hundred `<StatusBar>`s costs nothing on update — only the viewport repaints.

---

## Usage

### 1) Mount the provider and the portaled viewport

```tsx
// AppShell.tsx
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <StatusBarProvider>
      <div className="app-layout">
        {/* Fixed bar container in your shell — give it a min-height so
            client-side registration causes no layout shift */}
        <div id="statusbar-global" className="sticky bottom-0 min-h-7 border-t bg-white px-3" />

        <StatusBarViewport portalTarget="#statusbar-global" mode="stack" separator="•" />

        {children}
      </div>
    </StatusBarProvider>
  );
}
```

### 2) Contribute from anywhere in the tree

```tsx
function Editor() {
  return (
    <>
      <StatusBar priority={2}>Autosaving…</StatusBar>
      <StatusBar priority={5}>Preview mode</StatusBar>
    </>
  );
}

function CommentsPanel() {
  return <StatusBar priority={3}><strong>3 unresolved comments</strong></StatusBar>;
}
```

With `mode="stack"` on the viewport, all three render together, sorted by priority then recency:

```
Preview mode • 3 unresolved comments • Autosaving…
```

With `mode="replace"`, only `Preview mode` shows. Producers don't need to change.

### 3) Multiple scopes (independent bars)

```tsx
<div id="statusbar-global" />
<div id="statusbar-editor" />

<StatusBarViewport scope="global" portalTarget="#statusbar-global" />
<StatusBarViewport scope="editor" portalTarget="#statusbar-editor" mode="stack" />

// Deep in the editor tree
<StatusBar scope="editor">Spellcheck enabled</StatusBar>
```

### 4) Imperative API

```tsx
function SaveButton() {
  const sb = useStatusBar();

  async function onClick() {
    sb.show("Saving…");
    try {
      await save();
      sb.show("Saved", { priority: 4 }); // same entry, updated in place
      setTimeout(() => sb.hide(), 1500);
    } catch {
      sb.show(<span role="img" aria-label="error">⚠️ Save failed</span>, { priority: 10 });
    }
  }

  return <button onClick={onClick}>Save</button>;
}
```

---

## Props reference

### `<StatusBar>`

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Content to contribute. |
| `priority` | `number` | `0` | Higher sorts first; top entry wins in `replace` mode. |
| `scope` | `string` | `"global"` | Target bar. Changing it migrates the entry correctly. |
| `id` | `string` | auto | Stable identity across remounts (e.g. route transitions). |

### `<StatusBarViewport>`

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `scope` | `string` | `"global"` | Which scope to read. |
| `mode` | `"replace" \| "stack"` | `"replace"` | Presentation is owned here, not by producers. |
| `empty` | `ReactNode` | `null` | Rendered inside the always-mounted live region. |
| `separator` | `ReactNode` | — | Between items in `stack` mode. Marked `aria-hidden`. |
| `portalTarget` | `HTMLElement \| string \| null` | — | Renders inline if omitted; warns in dev if a selector matches nothing. |
| `ariaLive` | `"off" \| "polite" \| "assertive"` | `"polite"` | |
| `renderItem` | `(entry) => ReactNode` | — | Escape hatch for custom item wrappers (badges, icons, transitions). |

### `useStatusBar({ scope? })`

Returns `{ show(node, { priority? }), hide() }`. `show` is an idempotent upsert; the entry is automatically removed when the calling component unmounts.

---

## Styling

Unopinionated by default. Suggested minimal CSS:

```css
.statusbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 28px; /* reserve height → no layout shift when entries arrive */
}
.statusbar__item { white-space: nowrap; }
.statusbar__sep { opacity: 0.6; }
.statusbar[data-empty] { /* style the idle state if you like */ }
```

The `data-empty` attribute lets you collapse, fade, or restyle the bar without unmounting the live region.

---

## Accessibility

- The `role="status"` / `aria-live` container is **always mounted** — screen readers only reliably announce changes inside live regions that already exist in the DOM.
- Separators are `aria-hidden` so "bullet" isn't read between every item.
- Keep messages short and meaningful; prefer `polite`, reserve `assertive` for genuinely urgent states (save failures, lost connection).
- Reserve the bar's height in CSS so messages appearing/disappearing cause no layout shift.

---

## SSR & hydration

Entries register in effects, so the server and the hydration pass both render an **empty** bar (`getServerSnapshot` returns the same empty array) — guaranteed no hydration mismatch. Content appears in a layout effect immediately after hydration, before paint, so there's no visible flicker; combine with a CSS `min-height` and there's no layout shift either.

---

## Testing

- Inject a store: `<StatusBarProvider store={createStatusStore()}>` gives each test an isolated instance you can also assert against directly (`store.getSnapshot("global")`).
- Producer tests: mount provider + viewport + producer, assert on text content as entries mount/update/unmount.
- Portal tests: render the host node in the test DOM and query within it by id.
- The store itself is plain JS — unit test `upsert`/`remove`/sorting without React at all.

---

## FAQ

**Q: Can multiple components add items at once?**
A: Yes. With `mode="stack"` the viewport renders all of them, sorted by priority then recency.

**Q: What if I want only one item?**
A: `mode="replace"` (the default). Highest priority wins; ties go to the most recently registered.

**Q: Why can't a producer set the merge mode anymore?**
A: In v1, the highest-priority entry's mode silently controlled the whole bar — mounting one component could change how everything else rendered. Presentation belongs to the surface that renders it.

**Q: Do I need portals?**
A: No. Omit `portalTarget` and the viewport renders in place; portals just let you mount the output into a fixed shell node.

**Q: Does mounting lots of producers hurt performance?**
A: No. Producers write to the store but never subscribe to it, so updates only re-render the viewport(s) for the affected scope.

---

## Future ideas (out of scope for v2)

- **Timed entries**: `dismissAfter` on `show()` / `<StatusBar>`, cleared on unmount.
- **Enter/exit transitions**: `renderItem` + View Transitions API, or a `getSnapshot` that keeps exiting entries around briefly.
- **Severity kinds**: `kind: "info" | "warning" | "error"` mapping to default styling and an `assertive` escalation for errors.
- **Overflow handling**: max visible items in `stack` mode with a "+2 more" affordance.

---

## Changelog

- **v2.0.0**: Rewrite. External store + `useSyncExternalStore` (per-scope subscriptions, no tree-wide re-renders). Merge mode moved to the viewport. Fixed: stale entries on scope/id change, duplicate entries from `show()`, leaked hook entries on unmount, unmounting `aria-live` region, index-based keys in stacked mode. Idempotent `show()` replaces `show`/`update`. Injectable store for tests. Honest SSR story.
- **v1.0.0**: Initial portal-based release (Option B).
