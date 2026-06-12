import { Link } from "@tanstack/react-router";
import { StatusBar, StatusBarViewport } from "react-status-bar";
import { Card, Code, FeatureGrid, Install, Surface } from "../ui";

export function OverviewPage() {
	return (
		<article className="page">
			{/* Contributes to the global bar (bottom of the screen) while mounted. */}
			<StatusBar priority={1}>👋 Overview</StatusBar>

			{/* ---------- Hero ---------- */}
			<header className="hero">
				<span className="hero__eyebrow">react · 2&nbsp;kB · zero-config</span>
				<h1 className="hero__title">react-status-bar</h1>
				<p className="hero__lead">
					A lightweight, portal-based{" "}
					<strong>status bar system for React</strong>. Any component can push
					UI into a shared bar; a viewport aggregates the entries and renders
					them — optionally portaled anywhere in the DOM.
				</p>

				<Install />

				<div className="hero__links">
					<Link to="/getting-started" className="btn btn--primary">
						Get started →
					</Link>
					<Link to="/api" className="btn">
						API reference
					</Link>
					<a
						className="btn btn--ghost"
						href="https://github.com/mrmartineau/react-status-bar"
					>
						GitHub
					</a>
				</div>
			</header>

			{/* ---------- Live demo ---------- */}
			<Card title="See it live">
				<p>
					The three producers below all target one <code>overview</code> scope.
					The viewport sorts by priority then recency and renders them. The bar
					pinned to the bottom of the window is another viewport — this page is
					pushing into it right now.
				</p>

				<Surface label='<StatusBarViewport scope="overview" mode="stack" separator="•" />'>
					<StatusBarViewport
						scope="overview"
						mode="stack"
						separator="•"
						empty={<em>nothing here yet</em>}
					/>
				</Surface>

				<StatusBar scope="overview" priority={5}>
					Preview mode
				</StatusBar>
				<StatusBar scope="overview" priority={3}>
					<strong>3 unresolved comments</strong>
				</StatusBar>
				<StatusBar scope="overview" priority={2}>
					Autosaving…
				</StatusBar>

				<Code>{`import { StatusBarProvider, StatusBarViewport, StatusBar } from "react-status-bar";

<StatusBarProvider>
  <StatusBarViewport mode="stack" separator="•" />

  {/* …anywhere deeper in the tree… */}
  <StatusBar priority={5}>Preview mode</StatusBar>
  <StatusBar priority={3}>3 unresolved comments</StatusBar>
  <StatusBar priority={2}>Autosaving…</StatusBar>
</StatusBarProvider>
// → "Preview mode • 3 unresolved comments • Autosaving…"`}</Code>
			</Card>

			{/* ---------- Features ---------- */}
			<Card title="Why react-status-bar">
				<FeatureGrid
					items={[
						{
							icon: "🧩",
							title: "Side-effect API",
							body: (
								<>
									<code>{"<StatusBar>…</StatusBar>"}</code> registers content
									while mounted, removes it on unmount.
								</>
							),
						},
						{
							icon: "🎯",
							title: "Surgical re-renders",
							body: "Per-scope subscriptions via useSyncExternalStore — only the affected viewport repaints.",
						},
						{
							icon: "🪟",
							title: "Portaled output",
							body: "Mount the bar into a fixed shell node anywhere, or render inline.",
						},
						{
							icon: "🗂️",
							title: "Scopes",
							body: "Independent bars (global, editor, modal-42) from a single provider.",
						},
						{
							icon: "♿",
							title: "Accessible",
							body: "One always-mounted aria-live region so screen readers announce reliably.",
						},
						{
							icon: "🧪",
							title: "SSR-safe",
							body: "Server snapshot is always empty → zero hydration mismatch.",
						},
					]}
				/>
			</Card>

			<Card title="Explore the examples">
				<p>
					Each page is a live, interactive demo of one feature — and the source
					for every snippet is in <code>demo/src/routes</code>.
				</p>
				<ul className="tag-list">
					<li>
						<Link to="/modes" className="doclink">
							Replace vs Stack
						</Link>{" "}
						— viewport-owned presentation
					</li>
					<li>
						<Link to="/imperative" className="doclink">
							Imperative API
						</Link>{" "}
						— <code>useStatusBar().show()</code> in async flows
					</li>
					<li>
						<Link to="/scopes" className="doclink">
							Scopes
						</Link>{" "}
						— multiple independent bars
					</li>
					<li>
						<Link to="/portals" className="doclink">
							Portals
						</Link>{" "}
						— render output anywhere in the DOM
					</li>
					<li>
						<Link to="/playground" className="doclink">
							Playground
						</Link>{" "}
						— add/remove entries on the fly
					</li>
				</ul>
			</Card>
		</article>
	);
}
