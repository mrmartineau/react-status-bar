import {
	StatusBar,
	type StatusBarMode,
	StatusBarProvider,
	StatusBarViewport,
} from "@mrmartineau/react-status-bar";
import { Button, Input, Label } from "@mrmartineau/zui/react";
import { type FormEvent, useRef, useState } from "react";

type Item = { id: string; text: string; priority: number };

// Lower priority = more important, so these render most-important first.
const INITIAL: Item[] = [
	{ id: "seed-1", text: "Build passing", priority: 1 },
	{ id: "seed-2", text: "Branch: main", priority: 2 },
	{ id: "seed-3", text: "2 TODOs", priority: 3 },
];

export function PlaygroundDemo() {
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
		<StatusBarProvider>
			<div className="controls">
				<Button
					variant={mode === "stack" ? "fill" : "outline"}
					size="sm"
					onClick={() => setMode("stack")}
				>
					stack
				</Button>
				<Button
					variant={mode === "replace" ? "fill" : "outline"}
					size="sm"
					onClick={() => setMode("replace")}
				>
					replace
				</Button>
				<Button variant="ghost" size="sm" onClick={() => setItems([])}>
					Clear all
				</Button>
			</div>

			<div className="surface">
				<span className="surface__label">
					{`<StatusBarViewport scope="playground" mode="${mode}" />`}
				</span>
				<div className="surface__body">
					<StatusBarViewport
						mode={mode}
						separator="•"
						empty={<em>empty — add an entry below</em>}
					/>
				</div>
			</div>

			{/* One producer per item; key + id share identity across renders. */}
			{items.map((it) => (
				<StatusBar key={it.id} id={it.id} priority={it.priority}>
					{it.text}
				</StatusBar>
			))}

			<form onSubmit={add} className="controls" style={{ marginTop: "1rem" }}>
				<div className="field">
					<Label htmlFor="pg-text">text</Label>
					<Input
						id="pg-text"
						type="text"
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder="e.g. Deploying…"
					/>
				</div>
				<div className="field">
					<Label htmlFor="pg-priority">priority (lower = more important)</Label>
					<Input
						id="pg-priority"
						className="input-num"
						type="number"
						value={priority}
						onChange={(e) => setPriority(Number(e.target.value) || 0)}
					/>
				</div>
				<Button type="submit" variant="fill" size="sm">
					Add entry
				</Button>
			</form>

			{items.length > 0 && (
				<ul className="tag-list">
					{items.map((it) => (
						<li key={it.id}>
							<span className="prio">p{it.priority}</span>
							<span>{it.text}</span>
							<Button variant="ghost" size="xs" onClick={() => remove(it.id)}>
								remove
							</Button>
						</li>
					))}
				</ul>
			)}
		</StatusBarProvider>
	);
}
