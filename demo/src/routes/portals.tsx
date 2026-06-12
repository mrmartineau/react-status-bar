import { useState } from "react";
import { StatusBar, StatusBarViewport } from "react-status-bar";
import { Button, Card, Code, Controls, Page, Surface } from "../ui";

export function PortalsPage() {
	const [connected, setConnected] = useState(true);
	const [syncing, setSyncing] = useState(false);

	return (
		<Page
			title="Portals"
			lead={
				<>
					A viewport can render <em>inline</em> or portal its output into a
					fixed shell node anywhere in the DOM. The producers stay where they
					are in the tree; only the rendered bar moves. (The bottom-of-screen
					global bar on every page is itself a portal.)
				</>
			}
		>
			<StatusBar priority={1}>Viewing: portals</StatusBar>

			<Card title="Portal into a window footer">
				<p>
					This mock window owns a footer node with{" "}
					<code>id="window-statusbar"</code>. The viewport targets it by
					selector — the producers live in this card, but their output appears
					down in the window chrome.
				</p>

				<Controls>
					<Button
						variant={connected ? "primary" : "default"}
						onClick={() => setConnected((v) => !v)}
					>
						{connected ? "Connected" : "Offline"}
					</Button>
					<Button
						variant={syncing ? "primary" : "default"}
						onClick={() => setSyncing((v) => !v)}
					>
						{syncing ? "Syncing…" : "Idle"}
					</Button>
				</Controls>

				<div className="window">
					<div className="window__bar">
						<span className="window__dot" />
						<span className="window__dot" />
						<span className="window__dot" />
						<span style={{ marginLeft: "0.5rem" }}>my-app.tsx</span>
					</div>
					<div className="window__body">
						Editor content… the status bar below is a portal target, not where
						the producers are declared.
					</div>
					{/* Portal target — always in the DOM so the live region is stable. */}
					<div className="window__status" id="window-statusbar" />
				</div>

				<StatusBarViewport
					scope="portals"
					portalTarget="#window-statusbar"
					mode="stack"
					separator="•"
					empty={
						<span className="statusbar-shell__idle">no window status</span>
					}
				/>

				<StatusBar scope="portals" priority={2}>
					{connected ? (
						<span className="pill pill--ok">● online</span>
					) : (
						<span className="pill pill--danger">● offline</span>
					)}
				</StatusBar>
				{syncing && (
					<StatusBar scope="portals" priority={5}>
						⟳ syncing changes
					</StatusBar>
				)}

				<Code>{`<div id="window-statusbar" />   {/* fixed shell node */}

<StatusBarViewport
  scope="portals"
  portalTarget="#window-statusbar"
  mode="stack"
/>

{/* declared here, rendered into the node above */}
<StatusBar scope="portals" priority={2}>● online</StatusBar>`}</Code>
			</Card>

			<Card title="No portal? Renders inline">
				<p>
					Omit <code>portalTarget</code> and the viewport renders right where
					you put it.
				</p>
				<Surface label="<StatusBarViewport scope=&quot;portals-inline&quot; mode=&quot;stack&quot; />">
					<StatusBarViewport
						scope="portals-inline"
						mode="stack"
						separator="•"
						empty={<em>nothing inline</em>}
					/>
				</Surface>
				<StatusBar scope="portals-inline" priority={1}>
					Rendered inline, no portal
				</StatusBar>
			</Card>
		</Page>
	);
}
