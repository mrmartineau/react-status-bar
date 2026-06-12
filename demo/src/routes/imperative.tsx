import { useState } from "react";
import { StatusBar, StatusBarViewport, useStatusBar } from "react-status-bar";
import { Button, Card, Code, Controls, Page, Surface } from "../ui";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function SaveDemo() {
	const sb = useStatusBar({ scope: "imperative" });
	const [busy, setBusy] = useState(false);

	async function run(fail: boolean) {
		setBusy(true);
		sb.show("💾 Saving…", { priority: 2 });
		await wait(1100);
		if (fail) {
			// Higher priority + assertive viewport → announced immediately.
			sb.show(
				<span className="pill pill--danger">⚠️ Save failed — retry?</span>,
				{ priority: 10 },
			);
		} else {
			sb.show(<span className="pill pill--ok">✓ Saved</span>, { priority: 4 });
			await wait(1600);
			sb.hide();
		}
		setBusy(false);
	}

	return (
		<Controls>
			<Button variant="primary" disabled={busy} onClick={() => run(false)}>
				Save
			</Button>
			<Button disabled={busy} onClick={() => run(true)}>
				Save (simulate failure)
			</Button>
			<Button variant="ghost" onClick={() => sb.hide()}>
				Clear
			</Button>
		</Controls>
	);
}

function CharCounter() {
	const sb = useStatusBar({ scope: "imperative" });
	const [text, setText] = useState("");

	return (
		<textarea
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

export function ImperativePage() {
	return (
		<Page
			title="Imperative API"
			lead={
				<>
					<code>useStatusBar()</code> returns <code>show()</code> and{" "}
					<code>hide()</code> for event handlers and async flows.{" "}
					<code>show</code> is an idempotent upsert — the entry auto-removes
					when the component unmounts.
				</>
			}
		>
			<StatusBar priority={1}>Viewing: imperative</StatusBar>

			<Card title="Async save flow (assertive on error)">
				<Surface label='<StatusBarViewport scope="imperative" mode="replace" ariaLive="assertive" />'>
					<StatusBarViewport
						scope="imperative"
						mode="replace"
						ariaLive="assertive"
						empty={<em>idle</em>}
					/>
				</Surface>
				<SaveDemo />
				<CharCounter />

				<Code>{`function SaveButton() {
  const sb = useStatusBar({ scope: "imperative" })

  async function onClick() {
    sb.show("💾 Saving…", { priority: 2 })
    try {
      await save()
      sb.show("✓ Saved", { priority: 4 })   // same entry, updated in place
      setTimeout(() => sb.hide(), 1600)
    } catch {
      sb.show("⚠️ Save failed", { priority: 10 })
    }
  }

  return <button onClick={onClick}>Save</button>
}`}</Code>
			</Card>
		</Page>
	);
}
