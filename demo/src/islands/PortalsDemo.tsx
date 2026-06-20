import {
	StatusBar,
	StatusBarProvider,
	StatusBarViewport,
} from "@mrmartineau/react-status-bar";
import { Badge, Button } from "@mrmartineau/zui/react";
import { useState } from "react";

export function PortalsDemo() {
	const [connected, setConnected] = useState(true);
	const [syncing, setSyncing] = useState(false);

	return (
		<StatusBarProvider>
			<div className="controls">
				<Button
					variant={connected ? "fill" : "outline"}
					size="sm"
					onClick={() => setConnected((v) => !v)}
				>
					{connected ? "Connected" : "Offline"}
				</Button>
				<Button
					variant={syncing ? "fill" : "outline"}
					size="sm"
					onClick={() => setSyncing((v) => !v)}
				>
					{syncing ? "Syncing…" : "Idle"}
				</Button>
			</div>

			{/* A mock window whose footer is the portal target. Producers are
			    declared below, but their output renders into this node. */}
			<div className="window">
				<div className="window__bar">
					<span className="window__dot" />
					<span className="window__dot" />
					<span className="window__dot" />
					<span style={{ marginLeft: "0.5rem" }}>my-app.tsx</span>
				</div>
				<div className="window__body">
					Editor content… the status bar below is a portal target, not where the
					producers are declared.
				</div>
				<div className="window__status" id="window-statusbar" />
			</div>

			<StatusBarViewport
				portalTarget="#window-statusbar"
				mode="stack"
				separator="•"
				empty={<span className="statusbar-shell__idle">no window status</span>}
			/>

			<StatusBar priority={2}>
				{connected ? (
					<Badge variant="fill" color="green">
						online
					</Badge>
				) : (
					<Badge variant="fill" color="red">
						offline
					</Badge>
				)}
			</StatusBar>
			{syncing && <StatusBar priority={1}>⟳ syncing changes</StatusBar>}
		</StatusBarProvider>
	);
}
