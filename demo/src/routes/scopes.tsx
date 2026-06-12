import { useState } from "react";
import { StatusBar, StatusBarViewport } from "react-status-bar";
import { Button, Card, Code, Controls, Page, Surface } from "../ui";

export function ScopesPage() {
	const [spellcheck, setSpellcheck] = useState(true);
	const [wrap, setWrap] = useState(false);
	const [notifications, setNotifications] = useState(2);

	return (
		<Page
			title="Scopes"
			lead={
				<>
					One provider can drive any number of <em>independent</em> bars. Each
					viewport reads a single <code>scope</code> and re-renders only when
					that scope changes. Below: an <code>editor</code> bar and a{" "}
					<code>notifications</code> bar, fed by separate producers.
				</>
			}
		>
			<StatusBar priority={1}>Viewing: scopes</StatusBar>

			<Card title="Editor bar (scope: editor)">
				<Controls>
					<Button
						variant={spellcheck ? "primary" : "default"}
						onClick={() => setSpellcheck((v) => !v)}
					>
						Spellcheck: {spellcheck ? "on" : "off"}
					</Button>
					<Button
						variant={wrap ? "primary" : "default"}
						onClick={() => setWrap((v) => !v)}
					>
						Word wrap: {wrap ? "on" : "off"}
					</Button>
				</Controls>

				<Surface label='<StatusBarViewport scope="editor" mode="stack" />'>
					<StatusBarViewport
						scope="editor"
						mode="stack"
						separator="•"
						empty={<em>no editor status</em>}
					/>
				</Surface>

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
			</Card>

			<Card title="Notifications bar (scope: notifications)">
				<Controls>
					<Button onClick={() => setNotifications((n) => n + 1)}>
						Add notification
					</Button>
					<Button variant="ghost" onClick={() => setNotifications(0)}>
						Mark all read
					</Button>
				</Controls>

				<Surface label='<StatusBarViewport scope="notifications" mode="replace" />'>
					<StatusBarViewport
						scope="notifications"
						mode="replace"
						empty={<em>all caught up ✨</em>}
					/>
				</Surface>

				{notifications > 0 && (
					<StatusBar scope="notifications" priority={1}>
						🔔 {notifications} unread notification
						{notifications === 1 ? "" : "s"}
					</StatusBar>
				)}

				<p>
					Toggling the editor controls never re-renders the notifications
					viewport, and vice versa — the subscriptions are per-scope.
				</p>

				<Code>{`<StatusBarViewport scope="editor" mode="stack" />
<StatusBarViewport scope="notifications" mode="replace" />

<StatusBar scope="editor">Spellcheck enabled</StatusBar>
<StatusBar scope="notifications">🔔 2 unread notifications</StatusBar>`}</Code>
			</Card>
		</Page>
	);
}
