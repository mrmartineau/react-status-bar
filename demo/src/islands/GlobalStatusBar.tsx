import {
	StatusBar,
	StatusBarProvider,
	StatusBarViewport,
} from "react-status-bar";
import { globalStore } from "../lib/status-store";

/**
 * The always-on global bar, portaled into the fixed `#statusbar-global` node in
 * the layout. Uses the shared store so producers from other islands (page
 * labels, etc.) show up here.
 */
export function GlobalStatusBar() {
	return (
		<StatusBarProvider store={globalStore}>
			<StatusBarViewport
				portalTarget="#statusbar-global"
				mode="stack"
				separator="•"
				ariaLive="polite"
				empty={
					<span className="statusbar-shell__idle">idle — no global status</span>
				}
			/>
			{/* Baseline entry so the bar is never empty. */}
			<StatusBar priority={-10}>react-status-bar</StatusBar>
		</StatusBarProvider>
	);
}
