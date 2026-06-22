import {
	StatusBar,
	StatusBarProvider,
	StatusBarViewport,
} from "@mrmartineau/react-status-bar";

// Rendered with the demo's own base styles — the same class names the snippets
// on this page target. A quick "this is what it looks like wired up".
export function StylePreview() {
	return (
		<StatusBarProvider>
			<div className="surface">
				<span className="surface__label">{`<StatusBarViewport mode="stack" />`}</span>
				<div className="surface__body">
					<StatusBarViewport mode="stack" separator="•" />
				</div>
			</div>

			<StatusBar align="start" priority={0}>
				main ✓
			</StatusBar>
			<StatusBar align="start" priority={2}>
				Spaces: 2
			</StatusBar>
			<StatusBar align="end" priority={0}>
				Ln 12, Col 4
			</StatusBar>
			<StatusBar align="end" priority={3}>
				UTF-8
			</StatusBar>
		</StatusBarProvider>
	);
}
