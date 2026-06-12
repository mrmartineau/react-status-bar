import { Badge, Button, Textarea } from "@mrmartineau/zui/react";
import { useState } from "react";
import {
	StatusBarProvider,
	StatusBarViewport,
	useStatusBar,
} from "@mrmartineau/react-status-bar";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function SaveDemo() {
	const sb = useStatusBar();
	const [busy, setBusy] = useState(false);

	async function run(fail: boolean) {
		setBusy(true);
		sb.show("💾 Saving…", { priority: 2 });
		await wait(1100);
		if (fail) {
			sb.show(
				<Badge variant="fill" color="red">
					⚠️ Save failed — retry?
				</Badge>,
				{ priority: 10 },
			);
		} else {
			sb.show(
				<Badge variant="fill" color="green">
					✓ Saved
				</Badge>,
				{ priority: 4 },
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
				if (v) sb.show(`✍️ ${v.length} characters`, { priority: 1 });
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
