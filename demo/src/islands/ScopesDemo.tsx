import { Button } from "@mrmartineau/zui/react";
import { useState } from "react";
import {
	StatusBar,
	StatusBarProvider,
	StatusBarViewport,
} from "react-status-bar";

export function ScopesDemo() {
	const [spellcheck, setSpellcheck] = useState(true);
	const [wrap, setWrap] = useState(false);
	const [notifications, setNotifications] = useState(2);

	return (
		<StatusBarProvider>
			<h3 className="demo-subhead">Editor bar — scope "editor"</h3>
			<div className="controls">
				<Button
					variant={spellcheck ? "fill" : "outline"}
					size="sm"
					onClick={() => setSpellcheck((v) => !v)}
				>
					Spellcheck: {spellcheck ? "on" : "off"}
				</Button>
				<Button
					variant={wrap ? "fill" : "outline"}
					size="sm"
					onClick={() => setWrap((v) => !v)}
				>
					Word wrap: {wrap ? "on" : "off"}
				</Button>
			</div>
			<div className="surface">
				<span className="surface__label">
					{'<StatusBarViewport scope="editor" mode="stack" />'}
				</span>
				<div className="surface__body">
					<StatusBarViewport
						scope="editor"
						mode="stack"
						separator="•"
						empty={<em>no editor status</em>}
					/>
				</div>
			</div>
			<StatusBar scope="editor" priority={2}>
				UTF-8
			</StatusBar>
			{spellcheck && (
				<StatusBar scope="editor" priority={3}>
					Spellcheck enabled
				</StatusBar>
			)}
			{wrap && (
				<StatusBar scope="editor" priority={1}>
					Word wrap
				</StatusBar>
			)}

			<h3 className="demo-subhead">
				Notifications bar — scope "notifications"
			</h3>
			<div className="controls">
				<Button
					variant="outline"
					size="sm"
					onClick={() => setNotifications((n) => n + 1)}
				>
					Add notification
				</Button>
				<Button variant="ghost" size="sm" onClick={() => setNotifications(0)}>
					Mark all read
				</Button>
			</div>
			<div className="surface">
				<span className="surface__label">
					{'<StatusBarViewport scope="notifications" mode="replace" />'}
				</span>
				<div className="surface__body">
					<StatusBarViewport
						scope="notifications"
						mode="replace"
						empty={<em>all caught up ✨</em>}
					/>
				</div>
			</div>
			{notifications > 0 && (
				<StatusBar scope="notifications" priority={1}>
					🔔 {notifications} unread notification{notifications === 1 ? "" : "s"}
				</StatusBar>
			)}
		</StatusBarProvider>
	);
}
