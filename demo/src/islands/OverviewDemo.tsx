import {
	StatusBar,
	StatusBarProvider,
	StatusBarViewport,
} from "@mrmartineau/react-status-bar";

/** Self-contained island: provider + viewport + three producers. */
export function OverviewDemo() {
	return (
		<StatusBarProvider>
			<div className="surface">
				<span className="surface__label">
					{'<StatusBarViewport mode="stack" separator="•" />'}
				</span>
				<div className="surface__body">
					<StatusBarViewport
						mode="stack"
						separator="•"
						empty={<em>nothing here yet</em>}
					/>
				</div>
			</div>

			<StatusBar priority={1}>Preview mode</StatusBar>
			<StatusBar priority={2}>
				<strong>3 unresolved comments</strong>
			</StatusBar>
			<StatusBar priority={3}>Autosaving…</StatusBar>
		</StatusBarProvider>
	);
}
