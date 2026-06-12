import { Button } from "@mrmartineau/zui/react";
import { useState } from "react";
import {
	StatusBar,
	type StatusBarMode,
	StatusBarProvider,
	StatusBarViewport,
} from "@mrmartineau/react-status-bar";

export function ModesDemo() {
	const [mode, setMode] = useState<StatusBarMode>("stack");
	return (
		<StatusBarProvider>
			<div className="controls">
				<Button
					variant={mode === "replace" ? "fill" : "outline"}
					size="sm"
					onClick={() => setMode("replace")}
				>
					mode="replace"
				</Button>
				<Button
					variant={mode === "stack" ? "fill" : "outline"}
					size="sm"
					onClick={() => setMode("stack")}
				>
					mode="stack"
				</Button>
				<span className="controls__hint">current: "{mode}"</span>
			</div>

			<div className="surface">
				<span className="surface__label">
					{`<StatusBarViewport mode="${mode}" />`}
				</span>
				<div className="surface__body">
					<StatusBarViewport mode={mode} separator="•" />
				</div>
			</div>

			{/* Producers never change — only the viewport's mode does. */}
			<StatusBar priority={5}>🔴 Recording</StatusBar>
			<StatusBar priority={3}>2 warnings</StatusBar>
			<StatusBar priority={1}>Ln 42, Col 8</StatusBar>
		</StatusBarProvider>
	);
}
