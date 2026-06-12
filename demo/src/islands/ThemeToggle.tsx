import { Button, useColorScheme } from "@mrmartineau/zui/react";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";

export function ThemeToggle() {
	const { scheme, set } = useColorScheme();
	const isDark = scheme === "dark";
	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={() => set(isDark ? "light" : "dark")}
			aria-label="Toggle colour scheme"
		>
			{isDark ? <SunIcon /> : <MoonIcon />}
			{isDark ? "Light" : "Dark"}
		</Button>
	);
}
