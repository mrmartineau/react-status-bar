import {
	StatusBarProvider,
	StatusBarViewport,
	useStatusBar,
} from "@mrmartineau/react-status-bar";
import { Badge, Button, Textarea } from "@mrmartineau/zui/react";
import { useState } from "react";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function SaveDemo() {
	const sb = useStatusBar();
	const [busy, setBusy] = useState(false);

	async function run(fail: boolean) {
		setBusy(true);
		sb.show("💾 Saving…", { priority: 5 });
		await wait(1100);
		if (fail) {
			// Escalate to P0 — most important.
			sb.show(
				<Badge variant="fill" color="red">
					⚠️ Save failed — retry?
				</Badge>,
				{ priority: 0 },
			);
		} else {
			sb.show(
				<Badge variant="fill" color="green">
					✓ Saved
				</Badge>,
				{ priority: 3 },
			);
			await wait(1600);
			sb.hide();
		}
		setBusy(false);
	}

	return (
		<div className="controls">
			<Button
				variant="fill"
				size="sm"
				disabled={busy}
				onClick={() => run(false)}
			>
				Save
			</Button>
			<Button
				variant="outline"
				size="sm"
				disabled={busy}
				onClick={() => run(true)}
			>
				Save (simulate failure)
			</Button>
			<Button variant="ghost" size="sm" onClick={() => sb.hide()}>
				Clear
			</Button>
		</div>
	);
}

function CharCounter() {
	const sb = useStatusBar();
	const [text, setText] = useState("");
	return (
		<Textarea
			className="charcounter"
			placeholder="Type here — the bar reports a live character count via the same entry…"
			value={text}
			onChange={(e) => {
				const v = e.target.value;
				setText(v);
				// Idempotent upsert: one entry, updated in place on every keystroke.
				// No priority → lowest, so a save in progress takes precedence.
				if (v) sb.show(`✍️ ${v.length} characters`);
				else sb.hide();
			}}
		/>
	);
}

export function ImperativeDemo() {
	return (
		<StatusBarProvider>
			<div className="surface">
				<span className="surface__label">
					{'<StatusBarViewport mode="replace" ariaLive="assertive" />'}
				</span>
				<div className="surface__body">
					<StatusBarViewport
						mode="replace"
						ariaLive="assertive"
						empty={<em>idle</em>}
					/>
				</div>
			</div>
			<SaveDemo />
			<CharCounter />
		</StatusBarProvider>
	);
}
