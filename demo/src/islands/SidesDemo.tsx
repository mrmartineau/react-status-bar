import {
	type StatusAlign,
	StatusBar,
	StatusBarProvider,
	StatusBarViewport,
} from "@mrmartineau/react-status-bar";
import { Button } from "@mrmartineau/zui/react";
import { useState } from "react";

export function SidesDemo() {
	const [clockSide, setClockSide] = useState<StatusAlign>("end");
	return (
		<StatusBarProvider>
			<div className="controls">
				<span className="controls__hint">Pin the clock:</span>
				<Button
					variant={clockSide === "start" ? "fill" : "outline"}
					size="sm"
					onClick={() => setClockSide("start")}
				>
					align="start"
				</Button>
				<Button
					variant={clockSide === "end" ? "fill" : "outline"}
					size="sm"
					onClick={() => setClockSide("end")}
				>
					align="end"
				</Button>
			</div>

			<div className="surface">
				<span className="surface__label">
					{`<StatusBarViewport mode="stack" />`}
				</span>
				<div className="surface__body">
					<StatusBarViewport mode="stack" separator="•" />
				</div>
			</div>

			{/* start group — most important sits on the far left */}
			<StatusBar align="start" priority={0}>
				main ✓
			</StatusBar>
			<StatusBar align="start" priority={3}>
				Spaces: 2
			</StatusBar>

			{/* end group — most important sits on the far right */}
			<StatusBar align="end" priority={0}>
				Ln 12, Col 4
			</StatusBar>
			<StatusBar align="end" priority={4}>
				Prettier
			</StatusBar>

			{/* this entry hops between sides as you toggle */}
			<StatusBar align={clockSide} priority={2}>
				🕑 12:04
			</StatusBar>
		</StatusBarProvider>
	);
}
