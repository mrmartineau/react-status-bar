import { useState } from "react";
import {
	StatusBar,
	type StatusBarMode,
	StatusBarViewport,
} from "react-status-bar";
import { Button, Card, Code, Controls, Page, Surface } from "../ui";

export function ModesPage() {
	const [mode, setMode] = useState<StatusBarMode>("stack");

	return (
		<Page
			title="Replace vs Stack"
			lead={
				<>
					Presentation is a <em>viewport</em> concern, not a producer one. The
					exact same three producers render differently depending on the
					viewport's <code>mode</code>. Flip it and watch.
				</>
			}
		>
			<StatusBar priority={1}>Viewing: modes</StatusBar>

			<Card title="Same producers, two presentations">
				<Controls>
					<Button
						variant={mode === "replace" ? "primary" : "default"}
						onClick={() => setMode("replace")}
					>
						mode="replace"
					</Button>
					<Button
						variant={mode === "stack" ? "primary" : "default"}
						onClick={() => setMode("stack")}
					>
						mode="stack"
					</Button>
					<span className="controls__hint">current: "{mode}"</span>
				</Controls>

				<Surface label={`<StatusBarViewport scope="modes" mode="${mode}" />`}>
					<StatusBarViewport scope="modes" mode={mode} separator="•" />
				</Surface>

				{/* Producers never change — only the viewport's mode does. */}
				<StatusBar scope="modes" priority={5}>
					🔴 Recording
				</StatusBar>
				<StatusBar scope="modes" priority={3}>
					2 warnings
				</StatusBar>
				<StatusBar scope="modes" priority={1}>
					Ln 42, Col 8
				</StatusBar>

				<p>
					<strong>replace</strong> shows only the highest-priority entry —{" "}
					<code>🔴 Recording</code> (priority 5). <strong>stack</strong> shows
					all three, sorted by priority then recency. The producers are
					identical in both cases.
				</p>

				<Code>{`const [mode, setMode] = useState("stack")

<StatusBarViewport scope="modes" mode={mode} separator="•" />

<StatusBar scope="modes" priority={5}>🔴 Recording</StatusBar>
<StatusBar scope="modes" priority={3}>2 warnings</StatusBar>
<StatusBar scope="modes" priority={1}>Ln 42, Col 8</StatusBar>`}</Code>
			</Card>
		</Page>
	);
}
