import {
	createRootRoute,
	createRoute,
	createRouter,
} from "@tanstack/react-router";
import { ApiPage } from "./routes/api";
import { GettingStartedPage } from "./routes/getting-started";
import { ImperativePage } from "./routes/imperative";
import { ModesPage } from "./routes/modes";
import { OverviewPage } from "./routes/overview";
import { PlaygroundPage } from "./routes/playground";
import { PortalsPage } from "./routes/portals";
import { ScopesPage } from "./routes/scopes";
import { AppShell } from "./shell";

const rootRoute = createRootRoute({ component: AppShell });

const routeTree = rootRoute.addChildren([
	createRoute({
		getParentRoute: () => rootRoute,
		path: "/",
		component: OverviewPage,
	}),
	createRoute({
		getParentRoute: () => rootRoute,
		path: "/getting-started",
		component: GettingStartedPage,
	}),
	createRoute({
		getParentRoute: () => rootRoute,
		path: "/api",
		component: ApiPage,
	}),
	createRoute({
		getParentRoute: () => rootRoute,
		path: "/modes",
		component: ModesPage,
	}),
	createRoute({
		getParentRoute: () => rootRoute,
		path: "/imperative",
		component: ImperativePage,
	}),
	createRoute({
		getParentRoute: () => rootRoute,
		path: "/scopes",
		component: ScopesPage,
	}),
	createRoute({
		getParentRoute: () => rootRoute,
		path: "/portals",
		component: PortalsPage,
	}),
	createRoute({
		getParentRoute: () => rootRoute,
		path: "/playground",
		component: PlaygroundPage,
	}),
]);

export const router = createRouter({ routeTree, defaultPreload: "intent" });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
