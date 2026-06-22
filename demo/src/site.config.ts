import type { NavSection, SiteConfig } from "@mrmartineau/zui-theme/nav";

export const site: SiteConfig = {
	title: "React Status Bar",
	description:
		"A lightweight, portal-based status bar system for React. Any component can push UI into a shared bar; a viewport aggregates and renders it.",
	author: "Zander Martineau",
	authorHref: "https://zander.wtf",
	social: [
		{
			href: "https://github.com/mrmartineau/react-status-bar",
			icon: "github-logo",
			label: "GitHub",
			ariaLabel: "GitHub repository",
		},
		{
			href: "https://www.npmjs.com/package/@mrmartineau/react-status-bar",
			icon: "package",
			ariaLabel: "npm package",
		},
	],
	// Icons are self-hosted via the `@phosphor-icons/web/regular` import in
	// Layout.astro, so skip the theme's CDN load.
	phosphor: false,
	// The signature fixed bottom status bar would clash with the floating
	// theme-builder; keep the header colour dots + light/dark toggle instead.
	themeSwitcher: false,
};

// The demo's pages are `.astro` (interactive React islands), not `.mdx`, so the
// theme's glob-based nav builders can't read their frontmatter — define the
// sidebar by hand instead.
export const sections: NavSection[] = [
	{
		heading: "Docs",
		sectionOrder: 0,
		items: [
			{ href: "/", label: "Overview", exact: true },
			{ href: "/getting-started", label: "Getting started" },
			{ href: "/styling", label: "Styling" },
			{ href: "/api", label: "API reference" },
		],
	},
	{
		heading: "Examples",
		sectionOrder: 1,
		items: [
			{ href: "/modes", label: "Replace vs Stack" },
			{ href: "/sides", label: "Pinned sides" },
			{ href: "/overflow", label: "Overflow clipping" },
			{ href: "/imperative", label: "Imperative API" },
			{ href: "/scopes", label: "Scopes" },
			{ href: "/portals", label: "Portals" },
			{ href: "/playground", label: "Playground" },
		],
	},
];
