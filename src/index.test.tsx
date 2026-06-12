import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import * as React from "react";
import {
	createStatusStore,
	StatusBar,
	StatusBarProvider,
	StatusBarViewport,
	useStatusBar,
} from "./index.js";

afterEach(cleanup);

// ---------- Store (pure, no React) ----------
describe("createStatusStore", () => {
	test("upsert adds an entry to a scope", () => {
		const store = createStatusStore();
		store.upsert({ id: "a", scope: "global", priority: 0, node: "hello" });
		const snap = store.getSnapshot("global");
		expect(snap).toHaveLength(1);
		expect(snap[0]?.node).toBe("hello");
	});

	test("upsert is idempotent by id (no duplicates)", () => {
		const store = createStatusStore();
		store.upsert({ id: "a", scope: "global", priority: 0, node: "one" });
		store.upsert({ id: "a", scope: "global", priority: 0, node: "two" });
		const snap = store.getSnapshot("global");
		expect(snap).toHaveLength(1);
		expect(snap[0]?.node).toBe("two");
	});

	test("upsert preserves registration order across updates", () => {
		const store = createStatusStore();
		store.upsert({ id: "a", scope: "global", priority: 0, node: "a" });
		store.upsert({ id: "b", scope: "global", priority: 0, node: "b" });
		const orderA = store.getSnapshot("global").find((e) => e.id === "a")?.order;
		store.upsert({ id: "a", scope: "global", priority: 0, node: "a2" });
		const orderA2 = store
			.getSnapshot("global")
			.find((e) => e.id === "a")?.order;
		expect(orderA2).toBe(orderA as number);
	});

	test("sorts by priority desc, then by recency desc", () => {
		const store = createStatusStore();
		store.upsert({ id: "low", scope: "global", priority: 1, node: "low" });
		store.upsert({ id: "high", scope: "global", priority: 5, node: "high" });
		store.upsert({ id: "mid1", scope: "global", priority: 3, node: "mid1" });
		store.upsert({ id: "mid2", scope: "global", priority: 3, node: "mid2" });
		const ids = store.getSnapshot("global").map((e) => e.id);
		// high(5) first, then the two priority-3 entries newest-first, then low(1)
		expect(ids).toEqual(["high", "mid2", "mid1", "low"]);
	});

	test("getSnapshot is referentially stable between changes", () => {
		const store = createStatusStore();
		store.upsert({ id: "a", scope: "global", priority: 0, node: "a" });
		const first = store.getSnapshot("global");
		const second = store.getSnapshot("global");
		expect(first).toBe(second);
		store.upsert({ id: "b", scope: "global", priority: 0, node: "b" });
		expect(store.getSnapshot("global")).not.toBe(first);
	});

	test("remove deletes by id and prunes empty scopes", () => {
		const store = createStatusStore();
		store.upsert({ id: "a", scope: "global", priority: 0, node: "a" });
		store.remove("global", "a");
		expect(store.getSnapshot("global")).toHaveLength(0);
	});

	test("scopes are independent", () => {
		const store = createStatusStore();
		store.upsert({ id: "a", scope: "global", priority: 0, node: "g" });
		store.upsert({ id: "a", scope: "editor", priority: 0, node: "e" });
		expect(store.getSnapshot("global")).toHaveLength(1);
		expect(store.getSnapshot("editor")).toHaveLength(1);
		expect(store.getSnapshot("editor")[0]?.node).toBe("e");
	});

	test("subscribe is notified on change and can unsubscribe", () => {
		const store = createStatusStore();
		let calls = 0;
		const unsub = store.subscribe("global", () => {
			calls++;
		});
		store.upsert({ id: "a", scope: "global", priority: 0, node: "a" });
		expect(calls).toBe(1);
		unsub();
		store.upsert({ id: "b", scope: "global", priority: 0, node: "b" });
		expect(calls).toBe(1);
	});
});

// ---------- Components (DOM via happy-dom) ----------
describe("StatusBar + StatusBarViewport", () => {
	test("a producer's content appears in the viewport", () => {
		const { getByRole } = render(
			<StatusBarProvider>
				<StatusBarViewport />
				<StatusBar>Hello bar</StatusBar>
			</StatusBarProvider>,
		);
		expect(getByRole("status").textContent).toContain("Hello bar");
	});

	test("replace mode shows only the highest-priority entry", () => {
		const { getByRole } = render(
			<StatusBarProvider>
				<StatusBarViewport mode="replace" />
				<StatusBar priority={1}>Low</StatusBar>
				<StatusBar priority={5}>High</StatusBar>
			</StatusBarProvider>,
		);
		const text = getByRole("status").textContent ?? "";
		expect(text).toContain("High");
		expect(text).not.toContain("Low");
	});

	test("stack mode shows all entries sorted by priority", () => {
		const { getByRole } = render(
			<StatusBarProvider>
				<StatusBarViewport mode="stack" separator=" | " />
				<StatusBar priority={1}>Low</StatusBar>
				<StatusBar priority={5}>High</StatusBar>
			</StatusBarProvider>,
		);
		const text = getByRole("status").textContent ?? "";
		expect(text.indexOf("High")).toBeLessThan(text.indexOf("Low"));
	});

	test("entries are removed when the producer unmounts", () => {
		function Harness({ show }: { show: boolean }) {
			return (
				<StatusBarProvider store={store}>
					<StatusBarViewport />
					{show && <StatusBar>Transient</StatusBar>}
				</StatusBarProvider>
			);
		}
		const store = createStatusStore();
		const { rerender, getByRole } = render(<Harness show={true} />);
		expect(getByRole("status").textContent).toContain("Transient");
		rerender(<Harness show={false} />);
		expect(getByRole("status").textContent).not.toContain("Transient");
	});

	test("the live region stays mounted when empty", () => {
		const { getByRole } = render(
			<StatusBarProvider>
				<StatusBarViewport empty={<span>idle</span>} />
			</StatusBarProvider>,
		);
		const region = getByRole("status");
		expect(region).toBeTruthy();
		expect(region.getAttribute("data-empty")).toBe("true");
		expect(region.textContent).toContain("idle");
	});

	test("useStatusBar().show() upserts a single entry", () => {
		function Producer() {
			const sb = useStatusBar();
			// biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
			React.useEffect(() => {
				sb.show("first");
				sb.show("second");
			}, []);
			return null;
		}
		const { getByRole } = render(
			<StatusBarProvider>
				<StatusBarViewport mode="stack" />
				<Producer />
			</StatusBarProvider>,
		);
		const text = getByRole("status").textContent ?? "";
		expect(text).toContain("second");
		expect(text).not.toContain("first");
	});
});
