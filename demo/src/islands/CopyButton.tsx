import { Button } from "@mrmartineau/zui/react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useState } from "react";

/** Clipboard button used in code-block headers. Graceful when blocked. */
export function CopyButton({
	value,
	label,
}: {
	value: string;
	label?: string;
}) {
	const [copied, setCopied] = useState(false);
	return (
		<Button
			variant="ghost"
			size="xs"
			icon
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
			{copied ? <CheckIcon weight="bold" /> : <CopyIcon />}
		</Button>
	);
}
