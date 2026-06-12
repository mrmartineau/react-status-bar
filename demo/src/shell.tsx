import { Link, Outlet } from "@tanstack/react-router";
import { StatusBar, StatusBarViewport } from "react-status-bar";

const NAV = [
	{
		section: "Docs",
		items: [
			{ to: "/", label: "Overview" },
			{ to: "/getting-started", label: "Getting started" },
			{ to: "/api", label: "API reference" },
		],
	},
	{
		section: "Examples",
		items: [
			{ to: "/modes", label: "Replace vs Stack" },
			{ to: "/imperative", label: "Imperative API" },
			{ to: "/scopes", label: "Scopes" },
			{ to: "/portals", label: "Portals" },
			{ to: "/playground", label: "Playground" },
		],
	},
] as const;

export function AppShell() {
	return (
		<div className="app">
			<aside className="sidebar">
				<div className="sidebar__brand">
					<span className="sidebar__logo" aria-hidden="true">
						▚
					</span>
					<span className="sidebar__title">
						<strong>react-status-bar</strong>
						<small>interactive demo</small>
					</span>
				</div>

				<nav className="nav">
					{NAV.map((group) => (
						<div key={group.section} className="nav__group">
							<span className="nav__heading">{group.section}</span>
							{group.items.map((item) => (
								<Link
									key={item.to}
									to={item.to}
									className="nav__link"
									activeProps={{ className: "nav__link nav__link--active" }}
									activeOptions={{ exact: item.to === "/" }}
								>
									{item.label}
								</Link>
							))}
						</div>
					))}
				</nav>

				<a
					className="sidebar__foot"
					href="https://github.com/mrmartineau/react-status-bar"
				>
					github →
				</a>
			</aside>

			<main className="main">
				<Outlet />
			</main>

			{/* The fixed global bar. The viewport below portals into it — note the
			    node is ALWAYS in the DOM so its aria-live region is stable. */}
			<div id="statusbar-global" className="statusbar-shell" />
			<StatusBarViewport
				portalTarget="#statusbar-global"
				mode="stack"
				separator="•"
				ariaLive="polite"
				empty={
					<span className="statusbar-shell__idle">idle — no global status</span>
				}
			/>

			{/* A baseline entry so the global bar is never empty. Each page adds
			    its own higher-priority entry, removed automatically on navigation. */}
			<StatusBar priority={-10}>react-status-bar</StatusBar>
		</div>
	);
}
