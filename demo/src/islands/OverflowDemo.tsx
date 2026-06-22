import {
	StatusBar,
	type StatusBarOverflow,
	StatusBarProvider,
	StatusBarViewport,
} from "@mrmartineau/react-status-bar";
import { Button } from "@mrmartineau/zui/react";
import { useState } from "react";

export function OverflowDemo() {
	const [width, setWidth] = useState(560);
	const [overflow, setOverflow] = useState<StatusBarOverflow>("clip");
	return (
		<StatusBarProvider>
			<div className="controls">
				<Button
					variant={overflow === "clip" ? "fill" : "outline"}
					size="sm"
					onClick={() => setOverflow("clip")}
				>
					overflow="clip"
				</Button>
				<Button
					variant={overflow === "visible" ? "fill" : "outline"}
					size="sm"
					onClick={() => setOverflow("visible")}
				>
					overflow="visible"
				</Button>
				<label className="controls__hint">
					width: {width}px
					<input
						type="range"
						min={220}
						max={760}
						value={width}
						onChange={(e) => setWidth(Number(e.target.value))}
					/>
				</label>
			</div>

			<div className="surface">
				<span className="surface__label">
					{`<StatusBarViewport mode="stack" overflow="${overflow}" />`}
				</span>
				<div className="surface__body">
					{/* The bar fills this box; shrink it (slider or drag the corner) to
					    watch the least-important entries drop out. */}
					<div
						style={{
							width,
							maxWidth: "100%",
							resize: "horizontal",
							overflow: "hidden",
						}}
					>
						<StatusBarViewport mode="stack" separator="•" overflow={overflow} />
					</div>
				</div>
			</div>

			{/* Mixed priorities across both sides. Highest number = least important,
			    so it clips first; with sides, the inner entries go before the outer. */}
			<StatusBar align="start" priority={0}>
				main ✓
			</StatusBar>
			<StatusBar align="start" priority={5}>
				Spaces: 2
			</StatusBar>
			<StatusBar align="start" priority={6}>
				UTF-8
			</StatusBar>
			<StatusBar align="end" priority={0}>
				Ln 12, Col 4
			</StatusBar>
			<StatusBar align="end" priority={4}>
				Prettier
			</StatusBar>
			<StatusBar align="end" priority={7}>
				⚠ 3
			</StatusBar>
		</StatusBarProvider>
	);
}
