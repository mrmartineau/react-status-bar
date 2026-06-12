import { type FormEvent, useRef, useState } from "react";
import {
	StatusBar,
	type StatusBarMode,
	StatusBarViewport,
} from "react-status-bar";
import { Button, Card, Code, Controls, Page, Surface } from "../ui";

type Item = { id: string; text: string; priority: number };

const INITIAL: Item[] = [
	{ id: "seed-1", text: "Build passing", priority: 4 },
	{ id: "seed-2", text: "Branch: main", priority: 2 },
	{ id: "seed-3", text: "2 TODOs", priority: 1 },
];

export function PlaygroundPage() {
	const [items, setItems] = useState<Item[]>(INITIAL);
	const [text, setText] = useState("");
	const [priority, setPriority] = useState(0);
	const [mode, setMode] = useState<StatusBarMode>("stack");
	const nextId = useRef(0);

	function add(e: FormEvent) {
		e.preventDefault();
		const trimmed = text.trim();
		if (!trimmed) return;
		setItems((prev) => [
			...prev,
			{ id: `entry-${nextId.current++}`, text: trimmed, priority },
		]);
		setText("");
	}

	function remove(id: string) {
		setItems((prev) => prev.filter((it) => it.id !== id));
	}

	return (
		<Page
			title="Playground"
			lead={
				<>
					Add and remove entries on the fly. Each row is a real{" "}
					<code>&lt;StatusBar&gt;</code> with a stable <code>id</code> —
					removing a row unmounts it, and the entry leaves the bar
					automatically. No manual cleanup.
				</>
			}
		>
			<StatusBar priority={1}>Viewing: playground</StatusBar>

			<Card title="Live entry editor">
				<Controls>
					<Button
						variant={mode === "stack" ? "primary" : "default"}
						onClick={() => setMode("stack")}
					>
						stack
					</Button>
					<Button
						variant={mode === "replace" ? "primary" : "default"}
						onClick={() => setMode("replace")}
					>
						replace
					</Button>
					<Button variant="ghost" onClick={() => setItems([])}>
						Clear all
					</Button>
				</Controls>

				<Surface
					label={`<StatusBarViewport scope="playground" mode="${mode}" />`}
				>
					<StatusBarViewport
						scope="playground"
						mode={mode}
						separator="•"
						empty={<em>empty — add an entry below</em>}
					/>
				</Surface>

				{/* One producer per item. key + id share identity across renders. */}
				{items.map((it) => (
					<StatusBar
						key={it.id}
						id={it.id}
						scope="playground"
						priority={it.priority}
					>
						{it.text}
					</StatusBar>
				))}

				<form onSubmit={add} className="controls" style={{ marginTop: "1rem" }}>
					<label className="field">
						text
						<input
							type="text"
							value={text}
							onChange={(e) => setText(e.target.value)}
							placeholder="e.g. Deploying…"
						/>
					</label>
					<label className="field">
						priority
						<input
							type="number"
							value={priority}
							onChange={(e) => setPriority(Number(e.target.value) || 0)}
						/>
					</label>
					<Button type="submit" variant="primary">
						Add entry
					</Button>
				</form>

				{items.length > 0 && (
					<ul className="tag-list">
						{items.map((it) => (
							<li key={it.id}>
								<span className="prio">p{it.priority}</span>
								<span>{it.text}</span>
								<Button variant="ghost" onClick={() => remove(it.id)}>
									remove
								</Button>
							</li>
						))}
					</ul>
				)}

				<Code>{`const [items, setItems] = useState(INITIAL)

<StatusBarViewport scope="playground" mode={mode} separator="•" />

{items.map((it) => (
  <StatusBar key={it.id} id={it.id} scope="playground" priority={it.priority}>
    {it.text}
  </StatusBar>
))}
// remove from \`items\` → producer unmounts → entry leaves the bar`}</Code>
			</Card>
		</Page>
	);
}
