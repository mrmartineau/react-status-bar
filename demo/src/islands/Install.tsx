import { Button } from "@mrmartineau/zui/react";
import { useState } from "react";
import { CopyButton } from "./CopyButton";

const INSTALL: Record<string, string> = {
	bun: "bun add @mrmartineau/react-status-bar",
	npm: "npm install @mrmartineau/react-status-bar",
	pnpm: "pnpm add @mrmartineau/react-status-bar",
	yarn: "yarn add @mrmartineau/react-status-bar",
};

export function Install() {
	const managers = Object.keys(INSTALL);
	const [active, setActive] = useState("bun");
	const command = INSTALL[active] ?? INSTALL.bun;
	return (
		<div className="install">
			<div className="install__tabs">
				{managers.map((m) => (
					<Button
						key={m}
						variant={m === active ? "subtle" : "ghost"}
						size="sm"
						onClick={() => setActive(m)}
					>
						{m}
					</Button>
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
