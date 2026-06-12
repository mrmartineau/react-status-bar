import { StatusBar } from "react-status-bar";
import { Card, Code, Page, PropsTable } from "../ui";

export function ApiPage() {
	return (
		<Page
			title="API reference"
			lead={
				<>
					Five exports: a provider, a producer, a viewport, an imperative hook,
					and the underlying store factory. Everything is fully typed.
				</>
			}
		>
			<StatusBar priority={1}>Viewing: API reference</StatusBar>

			<Card title="Exports">
				<Code lang="ts">{`import {
  StatusBarProvider,   // holds the store
  StatusBar,           // producer — registers content while mounted
  StatusBarViewport,   // host — reads a scope and renders it
  useStatusBar,        // imperative show()/hide()
  createStatusStore,   // the plain-JS store (tests / DI)
} from "react-status-bar";

import type { StatusEntry, StatusBarMode, StatusStore } from "react-status-bar";`}</Code>
			</Card>

			<Card title="<StatusBarProvider>">
				<p>Holds the store and makes it available to the subtree.</p>
				<PropsTable
					rows={[
						{
							name: "children",
							type: "ReactNode",
							notes: "Your app subtree.",
						},
						{
							name: "store",
							type: "StatusStore",
							default: "auto",
							notes: (
								<>
									Inject your own store from <code>createStatusStore()</code> —
									useful for tests or sharing a store across roots.
								</>
							),
						},
					]}
				/>
			</Card>

			<Card title="<StatusBar>">
				<p>
					A side-effect component. Renders <code>null</code>; while mounted it
					upserts an entry into the store, and removes it on unmount.
				</p>
				<PropsTable
					rows={[
						{
							name: "children",
							type: "ReactNode",
							notes: "Content to contribute.",
						},
						{
							name: "priority",
							type: "number",
							default: "0",
							notes: "Higher sorts first; the top entry wins in replace mode.",
						},
						{
							name: "scope",
							type: "string",
							default: '"global"',
							notes: "Target bar. Changing it migrates the entry correctly.",
						},
						{
							name: "id",
							type: "string",
							default: "auto",
							notes: (
								<>
									Stable identity across remounts (e.g. route transitions).
									Defaults to a <code>useId()</code>.
								</>
							),
						},
					]}
				/>
			</Card>

			<Card title="<StatusBarViewport>">
				<p>
					Subscribes to a single scope and renders it. Owns presentation
					(replace vs stack) and optionally portals its output.
				</p>
				<PropsTable
					rows={[
						{
							name: "scope",
							type: "string",
							default: '"global"',
							notes: "Which scope to read.",
						},
						{
							name: "mode",
							type: '"replace" | "stack"',
							default: '"replace"',
							notes: "replace → top entry only; stack → all entries, sorted.",
						},
						{
							name: "empty",
							type: "ReactNode",
							default: "null",
							notes:
								"Rendered inside the always-mounted live region when idle.",
						},
						{
							name: "separator",
							type: "ReactNode",
							notes: "Between items in stack mode. Marked aria-hidden.",
						},
						{
							name: "portalTarget",
							type: "HTMLElement | string | null",
							notes:
								"Renders inline if omitted; warns in dev if a selector matches nothing.",
						},
						{
							name: "className",
							type: "string",
							notes: "Added to the live region.",
						},
						{
							name: "ariaLive",
							type: '"off" | "polite" | "assertive"',
							default: '"polite"',
							notes:
								"Live-region politeness. Reserve assertive for urgent states.",
						},
						{
							name: "renderItem",
							type: "(entry: StatusEntry) => ReactNode",
							notes: "Custom per-item wrapper (badges, icons, transitions).",
						},
					]}
				/>
			</Card>

			<Card title="useStatusBar({ scope? })">
				<p>
					Returns an imperative handle. The entry it manages is removed
					automatically when the calling component unmounts.
				</p>
				<Code lang="ts">{`const sb = useStatusBar({ scope?: string });

sb.show(node: ReactNode, opts?: { priority?: number }): void;  // idempotent upsert
sb.hide(): void;                                               // remove the entry`}</Code>
			</Card>

			<Card title="createStatusStore()">
				<p>
					The plain-JS store behind the provider. Inject it via{" "}
					<code>{"<StatusBarProvider store={...}>"}</code>, or unit-test it
					directly with no React involved.
				</p>
				<Code lang="ts">{`const store = createStatusStore();

store.upsert({ id, scope, priority, node });  // add or update (idempotent by id)
store.remove(scope, id);                      // remove an entry
store.subscribe(scope, listener);             // → unsubscribe fn
store.getSnapshot(scope);                     // StatusEntry[] (stable until changed)`}</Code>
			</Card>

			<Card title="Types">
				<Code lang="ts">{`type StatusEntry = {
  id: string;        // unique per producer instance
  scope: string;     // logical bar id
  priority: number;  // higher sorts first
  order: number;     // monotonic registration order (recency tiebreak)
  node: React.ReactNode;
};

type StatusBarMode = "replace" | "stack";
type StatusStore = ReturnType<typeof createStatusStore>;`}</Code>
			</Card>
		</Page>
	);
}
