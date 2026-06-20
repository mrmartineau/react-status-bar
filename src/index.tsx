"use client";

import * as React from "react";
import { createPortal } from "react-dom";

// ---------- Types ----------
export type StatusEntry = {
	id: string; // unique per producer instance
	scope: string; // logical bar id (supports many bars)
	priority: number; // lower = more important (P0 wins); sorts first
	order: number; // monotonic registration order (recency tiebreak)
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
		for (const fn of listeners.get(scope) ?? []) fn();
	}

	return {
		/** Add or update an entry. Idempotent — registration order is preserved on update. */
		upsert(entry: Omit<StatusEntry, "order">) {
			let bucket = scopes.get(entry.scope);
			if (!bucket) {
				bucket = new Map();
				scopes.set(entry.scope, bucket);
			}
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
			if (!set) {
				set = new Set();
				listeners.set(scope, set);
			}
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
							(a, b) =>
								a.priority !== b.priority
									? a.priority - b.priority // lower number = more important, sorts first
									: b.order - a.order, // tie: most recently registered wins
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
		throw new Error(
			"StatusBar components must be used within <StatusBarProvider>",
		);
	}
	return store;
}

// Layout effect on the client (avoids a flicker frame), plain effect on the server.
const useIsoLayoutEffect =
	typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

// ---------- Producer: side-effect component ----------
export function StatusBar({
	children,
	priority = Number.POSITIVE_INFINITY,
	scope = "global",
	id: explicitId,
}: {
	children: React.ReactNode;
	/**
	 * Lower is more important (incident-style: P0 > P1 > P5); the lowest-numbered
	 * entry wins in "replace" mode. Defaults to lowest priority, so an unset
	 * entry is rendered last.
	 */
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
		() => EMPTY, // server snapshot: always empty → no hydration mismatch
	);

	const target = usePortalTarget(portalTarget);
	const items = mode === "replace" ? entries.slice(0, 1) : entries;

	// The live region container is ALWAYS mounted so screen readers have a
	// stable node to announce changes into. Only its contents change.
	const content = (
		// biome-ignore lint/a11y/useSemanticElements: a live region is intentionally a div with role="status", not an <output> (which is form-associated)
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
				`StatusBarViewport: no element matches "${portalTarget}"; rendering inline.`,
			);
		}
		setTarget(el);
	}, [portalTarget]);

	return target;
}

// ---------- Imperative hook ----------
export function useStatusBar({ scope = "global" }: { scope?: string } = {}) {
	const store = useStatusStore();
	const id = React.useId();

	// Auto-remove on unmount — a component that called show() can't leak
	// a stale message into the bar.
	React.useEffect(() => {
		return () => store.remove(scope, id);
	}, [store, scope, id]);

	return React.useMemo(
		() => ({
			/**
			 * Idempotent: calling show() again updates the same entry in place.
			 * `priority` is lowest-wins (P0 = most important); defaults to lowest.
			 */
			show(node: React.ReactNode, opts?: { priority?: number }) {
				store.upsert({
					id,
					scope,
					priority: opts?.priority ?? Number.POSITIVE_INFINITY,
					node,
				});
			},
			hide() {
				store.remove(scope, id);
			},
		}),
		[store, scope, id],
	);
}

// ---------- Tiny className combiner ----------
function cn(...parts: Array<string | undefined | false | null>) {
	return parts.filter(Boolean).join(" ");
}
