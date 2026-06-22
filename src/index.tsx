"use client";

import * as React from "react";
import { createPortal } from "react-dom";

// ---------- Types ----------
/** Which side of the bar an entry is pinned to. Defaults to "start". */
export type StatusAlign = "start" | "end";

export type StatusEntry = {
	id: string; // unique per producer instance
	scope: string; // logical bar id (supports many bars)
	priority: number; // lower = more important (P0 wins); sorts first
	order: number; // monotonic registration order (recency tiebreak)
	align?: StatusAlign; // pinned side; treated as "start" when unset
	node: React.ReactNode;
};

export type StatusBarMode = "replace" | "stack";
export type StatusBarOverflow = "visible" | "clip";

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
	align = "start",
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
	/**
	 * Pin this entry to the "start" or "end" group of the bar. The two groups are
	 * pushed apart with a fluid gap in the middle. Defaults to "start".
	 */
	align?: StatusAlign;
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
		store.upsert({ id, scope, priority, align, node: children });
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
	overflow = "visible",
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
	/**
	 * What to do when entries exceed the available width.
	 * - "visible" (default): render everything; let your CSS wrap or scroll.
	 * - "clip": measure the bar and hide the least-important (highest-numbered
	 *   priority) entries one at a time until the rest fit on a single line.
	 *   With important entries pinned to the outer edges (see `align`), the
	 *   hidden ones are the inner items nearest the centre — like VS Code's
	 *   status bar. Adds the `statusbar--clip` modifier and sets `data-clipped`
	 *   while anything is hidden. Requires a flex layout (see Styling).
	 */
	overflow?: StatusBarOverflow;
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
	const clip = overflow === "clip";

	// Entries surviving the mode filter, before any overflow clipping.
	const modeItems = mode === "replace" ? entries.slice(0, 1) : entries;

	// ---- Overflow measurement (only when `clip` is on) ----
	// A hidden measurement row renders ALL items on one line so we can read each
	// item's natural right edge; `fitCount` then says how many fit. The row never
	// depends on `visibleCount`, so recomputing can settle rather than loop.
	const containerRef = React.useRef<HTMLDivElement>(null);
	const measureRef = React.useRef<HTMLDivElement>(null);
	const [visibleCount, setVisibleCount] = React.useState(
		Number.POSITIVE_INFINITY,
	);

	const measure = React.useCallback(() => {
		const container = containerRef.current;
		const row = measureRef.current;
		if (!container || !row) return;
		const style = getComputedStyle(container);
		const padX =
			Number.parseFloat(style.paddingLeft || "0") +
			Number.parseFloat(style.paddingRight || "0");
		const available = container.clientWidth - padX;
		const edges: number[] = [];
		for (const mark of row.querySelectorAll<HTMLElement>("[data-mi]")) {
			edges.push(mark.offsetLeft + mark.offsetWidth);
		}
		const k = fitCount(edges, available);
		setVisibleCount((prev) => (prev === k ? prev : k));
	}, []);

	// Re-measure after every commit — covers entry/content changes. Cheap: bails
	// out immediately when clip is off or the refs aren't mounted.
	useIsoLayoutEffect(() => {
		if (clip) measure();
	});

	// Re-measure when the container resizes.
	useIsoLayoutEffect(() => {
		if (!clip) return;
		const container = containerRef.current;
		if (!container || typeof ResizeObserver === "undefined") return;
		const ro = new ResizeObserver(() => measure());
		ro.observe(container);
		return () => ro.disconnect();
	}, [clip, measure]);

	const shown = clip ? modeItems.slice(0, visibleCount) : modeItems;
	const { start, end } = splitByAlign(shown);
	const hasEnd = end.length > 0;
	const isEmpty = modeItems.length === 0;
	const isClipped = clip && shown.length < modeItems.length;

	const renderList = (list: StatusEntry[]) =>
		list.map((entry, i) => (
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
		));

	// The live region container is ALWAYS mounted so screen readers have a
	// stable node to announce changes into. Only its contents change.
	const content = (
		// biome-ignore lint/a11y/useSemanticElements: a live region is intentionally a div with role="status", not an <output> (which is form-associated)
		<div
			ref={containerRef}
			role="status"
			aria-live={ariaLive}
			className={cn(
				"statusbar",
				`statusbar--${mode}`,
				clip && "statusbar--clip",
				className,
			)}
			data-empty={isEmpty || undefined}
			data-clip={clip || undefined}
			data-clipped={isClipped || undefined}
		>
			{isEmpty ? (
				empty
			) : (
				<>
					<div className="statusbar__group statusbar__group--start">
						{renderList(start)}
					</div>
					{hasEnd && (
						<span
							className="statusbar__spacer"
							aria-hidden="true"
							style={{ flex: "1 1 auto" }}
						/>
					)}
					{hasEnd && (
						<div className="statusbar__group statusbar__group--end">
							{renderList(end)}
						</div>
					)}
					{clip && (
						// Off-screen single-line copy of every item, used only to measure
						// natural widths. aria-hidden so it isn't announced twice.
						<div
							ref={measureRef}
							aria-hidden="true"
							className="statusbar__group statusbar__measure"
							style={{
								position: "absolute",
								left: 0,
								top: 0,
								display: "flex",
								flexWrap: "nowrap",
								whiteSpace: "nowrap",
								visibility: "hidden",
								pointerEvents: "none",
							}}
						>
							{modeItems.map((entry, i) => (
								<React.Fragment key={entry.id}>
									{i > 0 && separator != null && (
										<span className="statusbar__sep" aria-hidden="true">
											{separator}
										</span>
									)}
									<span
										data-mi=""
										className="statusbar__item"
										style={{ display: "inline-flex", whiteSpace: "nowrap" }}
									>
										{renderItem ? renderItem(entry) : entry.node}
									</span>
								</React.Fragment>
							))}
						</div>
					)}
				</>
			)}
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
			show(
				node: React.ReactNode,
				opts?: { priority?: number; align?: StatusAlign },
			) {
				store.upsert({
					id,
					scope,
					priority: opts?.priority ?? Number.POSITIVE_INFINITY,
					align: opts?.align ?? "start",
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

// ---------- Layout helpers ----------
/**
 * Partition priority-sorted entries into the two pinned groups. `start` keeps
 * the incoming order (most important first → leftmost/outer). `end` is reversed
 * so the most important sits rightmost/outer and the least important lands
 * nearest the centre, where overflow clipping bites first.
 */
function splitByAlign(items: StatusEntry[]): {
	start: StatusEntry[];
	end: StatusEntry[];
} {
	const start: StatusEntry[] = [];
	const end: StatusEntry[] = [];
	for (const entry of items) {
		if (entry.align === "end") end.push(entry);
		else start.push(entry);
	}
	end.reverse();
	return { start, end };
}

/**
 * Largest `k` such that the first `k` items — given their cumulative right edges
 * (each edge already includes preceding gaps/separators) — fit within
 * `available`. Assumes `rightEdges` is non-decreasing. Pure: unit-testable with
 * no DOM.
 */
export function fitCount(rightEdges: number[], available: number): number {
	let k = 0;
	for (let i = 0; i < rightEdges.length; i++) {
		if (rightEdges[i] <= available) k = i + 1;
		else break;
	}
	return k;
}

// ---------- Tiny className combiner ----------
function cn(...parts: Array<string | undefined | false | null>) {
	return parts.filter(Boolean).join(" ");
}
