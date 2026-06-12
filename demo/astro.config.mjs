import { fileURLToPath } from "node:url";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	integrations: [react()],
	markdown: {
		shikiConfig: {
			themes: { light: "github-light", dark: "github-dark" },
		},
	},
	vite: {
		resolve: {
			// Resolve the library to its source so the demo edits the real package
			// live. Consumers would instead get it from node_modules.
			alias: {
				"react-status-bar": fileURLToPath(
					new URL("../src/index.tsx", import.meta.url),
				),
			},
			// One copy of React across islands and the aliased library source.
			dedupe: ["react", "react-dom"],
		},
	},
});
