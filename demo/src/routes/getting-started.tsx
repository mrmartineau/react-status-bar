import { StatusBar } from "react-status-bar";
import { Callout, Code, Install, Page, Step } from "../ui";

export function GettingStartedPage() {
	return (
		<Page
			title="Getting started"
			lead={
				<>
					Install the package, wrap your app in a provider, drop a viewport
					somewhere, and contribute from anywhere in the tree. React 18+ is the
					only peer dependency.
				</>
			}
		>
			<StatusBar priority={1}>Viewing: getting started</StatusBar>

			<Step n={1} title="Install">
				<p>Add the package with your favourite package manager:</p>
				<Install />
				<Callout kind="info" title="Peer dependencies">
					<code>react</code> and <code>react-dom</code> (18 or newer) must
					already be installed in your app. Nothing else is bundled.
				</Callout>
			</Step>

			<Step n={2} title="Mount the provider + a viewport">
				<p>
					The provider holds the store. The viewport reads a scope and renders
					it — give the shell node a <code>min-height</code> so content arriving
					after hydration causes no layout shift.
				</p>
				<Code>{`// AppShell.tsx
import { StatusBarProvider, StatusBarViewport } from "react-status-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <StatusBarProvider>
      <div className="app-layout">
        {/* A fixed shell node in your chrome */}
        <div id="statusbar-global" className="statusbar-shell" />

        <StatusBarViewport
          portalTarget="#statusbar-global"
          mode="stack"
          separator="•"
        />

        {children}
      </div>
    </StatusBarProvider>
  );
}`}</Code>
			</Step>

			<Step n={3} title="Contribute from anywhere">
				<p>
					Mount a <code>{"<StatusBar>"}</code> anywhere below the provider. It
					declares <em>what</em> to show and <em>how important</em> it is — the
					viewport decides presentation. Entries are removed automatically on
					unmount.
				</p>
				<Code>{`import { StatusBar } from "react-status-bar";

function Editor() {
  return (
    <>
      <StatusBar priority={2}>Autosaving…</StatusBar>
      <StatusBar priority={5}>Preview mode</StatusBar>
    </>
  );
}`}</Code>
			</Step>

			<Step n={4} title="Imperative updates (optional)">
				<p>
					For event handlers and async flows, <code>useStatusBar()</code>{" "}
					returns <code>show()</code> / <code>hide()</code>. <code>show</code>{" "}
					is an idempotent upsert — call it again to update the same entry in
					place.
				</p>
				<Code>{`import { useStatusBar } from "react-status-bar";

function SaveButton() {
  const sb = useStatusBar();
  async function onClick() {
    sb.show("Saving…");
    try {
      await save();
      sb.show("Saved", { priority: 4 });   // same entry, updated
      setTimeout(() => sb.hide(), 1500);
    } catch {
      sb.show("⚠️ Save failed", { priority: 10 });
    }
  }
  return <button onClick={onClick}>Save</button>;
}`}</Code>
			</Step>

			<Step n={5} title="Multiple bars with scopes">
				<p>
					Every component takes a <code>scope</code>. One provider can drive any
					number of independent bars; a viewport only re-renders when its own
					scope changes.
				</p>
				<Code>{`<StatusBarViewport scope="global" portalTarget="#statusbar-global" />
<StatusBarViewport scope="editor" portalTarget="#statusbar-editor" mode="stack" />

// deep in the editor tree
<StatusBar scope="editor">Spellcheck enabled</StatusBar>`}</Code>
			</Step>

			<Callout kind="info" title="RSC / Next.js">
				The package is marked <code>"use client"</code>. Producers and viewports
				are client components (the store lives in the browser), but they can be
				rendered anywhere inside a server-rendered tree. The server snapshot is
				empty, so there is never a hydration mismatch.
			</Callout>

			<Callout kind="warn" title="Testing">
				Inject a store for isolation:{" "}
				<code>{"<StatusBarProvider store={createStatusStore()}>"}</code>. The
				store is plain JS — unit-test <code>upsert</code>/<code>remove</code>
				/sorting without React at all.
			</Callout>
		</Page>
	);
}
