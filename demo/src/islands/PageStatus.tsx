import { StatusBar, StatusBarProvider } from "react-status-bar";
import { globalStore } from "../lib/status-store";

/**
 * Pushes a single entry into the shared global bar while the page is mounted.
 * Demonstrates cross-island communication: this producer lives in its own
 * island, yet shows up in the GlobalStatusBar island's viewport because both
 * share `globalStore`.
 */
export function PageStatus({ label }: { label: string }) {
	return (
		<StatusBarProvider store={globalStore}>
			<StatusBar priority={1}>{label}</StatusBar>
		</StatusBarProvider>
	);
}
