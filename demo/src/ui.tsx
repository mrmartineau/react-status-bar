import { type ButtonHTMLAttributes, type ReactNode, useState } from "react";

export function Page({
	title,
	lead,
	children,
}: {
	title: string;
	lead: ReactNode;
	children: ReactNode;
}) {
	return (
		<article className="page">
			<header className="page__head">
				<h1 className="page__title">{title}</h1>
				<p className="page__lead">{lead}</p>
			</header>
			{children}
		</article>
	);
}

export function Card({
	title,
	children,
}: {
	title?: ReactNode;
	children: ReactNode;
}) {
	return (
		<section className="card">
			{title && <h2 className="card__title">{title}</h2>}
			{children}
		</section>
	);
}

/** A neutral panel that hosts a live viewport, styled like a real app chrome. */
export function Surface({
	label,
	children,
}: {
	label?: string;
	children: ReactNode;
}) {
	return (
		<div className="surface">
			{label && <span className="surface__label">{label}</span>}
			<div className="surface__body">{children}</div>
		</div>
	);
}

export function Controls({ children }: { children: ReactNode }) {
	return <div className="controls">{children}</div>;
}

export function Button({
	variant = "default",
	className,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: "default" | "primary" | "ghost";
}) {
	return (
		<button
			type="button"
			className={`btn btn--${variant}${className ? ` ${className}` : ""}`}
			{...props}
		/>
	);
}

/** Small clipboard button. Falls back gracefully when the API is unavailable. */
export function CopyButton({
	value,
	label,
}: {
	value: string;
	label?: string;
}) {
	const [copied, setCopied] = useState(false);
	return (
		<button
			type="button"
			className="copy"
			aria-label={label ?? "Copy to clipboard"}
			onClick={async () => {
				try {
					await navigator.clipboard?.writeText(value);
					setCopied(true);
					setTimeout(() => setCopied(false), 1400);
				} catch {
					/* clipboard blocked — no-op */
				}
			}}
		>
			{copied ? "copied ✓" : "copy"}
		</button>
	);
}

export function Code({
	children,
	lang = "tsx",
}: {
	children: string;
	lang?: string;
}) {
	return (
		<div className="code">
			<div className="code__head">
				<span className="code__lang">{lang}</span>
				<CopyButton value={children} label="Copy code" />
			</div>
			<pre className="code__pre">
				<code>{children}</code>
			</pre>
		</div>
	);
}

const INSTALL: Record<string, string> = {
	bun: "bun add react-status-bar",
	npm: "npm install react-status-bar",
	pnpm: "pnpm add react-status-bar",
	yarn: "yarn add react-status-bar",
};

export function Install() {
	const managers = Object.keys(INSTALL);
	const [active, setActive] = useState("bun");
	const command = INSTALL[active] ?? INSTALL.bun;
	return (
		<div className="install">
			<div className="install__tabs">
				{managers.map((m) => (
					<button
						key={m}
						type="button"
						className={`install__tab${m === active ? " install__tab--active" : ""}`}
						onClick={() => setActive(m)}
					>
						{m}
					</button>
				))}
			</div>
			<div className="install__cmd">
				<code>
					<span className="install__prompt">$</span> {command}
				</code>
				<CopyButton value={command ?? ""} label="Copy install command" />
			</div>
		</div>
	);
}

export type PropRow = {
	name: string;
	type: string;
	default?: string;
	notes: ReactNode;
};

export function PropsTable({ rows }: { rows: PropRow[] }) {
	return (
		<div className="proptable-wrap">
			<table className="proptable">
				<thead>
					<tr>
						<th>Prop</th>
						<th>Type</th>
						<th>Default</th>
						<th>Notes</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((r) => (
						<tr key={r.name}>
							<td>
								<code>{r.name}</code>
							</td>
							<td>
								<code className="proptable__type">{r.type}</code>
							</td>
							<td>
								{r.default ? (
									<code>{r.default}</code>
								) : (
									<span className="muted">—</span>
								)}
							</td>
							<td>{r.notes}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export function FeatureGrid({
	items,
}: {
	items: { icon: string; title: string; body: ReactNode }[];
}) {
	return (
		<div className="features">
			{items.map((it) => (
				<div key={it.title} className="feature">
					<span className="feature__icon" aria-hidden="true">
						{it.icon}
					</span>
					<strong className="feature__title">{it.title}</strong>
					<span className="feature__body">{it.body}</span>
				</div>
			))}
		</div>
	);
}

export function Callout({
	kind = "info",
	title,
	children,
}: {
	kind?: "info" | "warn";
	title?: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className={`callout callout--${kind}`}>
			{title && <strong className="callout__title">{title}</strong>}
			<div>{children}</div>
		</div>
	);
}

export function Step({
	n,
	title,
	children,
}: {
	n: number;
	title: ReactNode;
	children: ReactNode;
}) {
	return (
		<section className="step">
			<div className="step__head">
				<span className="step__num">{n}</span>
				<h2 className="step__title">{title}</h2>
			</div>
			<div className="step__body">{children}</div>
		</section>
	);
}
