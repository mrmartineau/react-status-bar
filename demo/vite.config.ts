import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Resolve `react-status-bar` to the library source so the demo edits the real
// package live (no build step). Consumers would instead get it from node_modules.
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"react-status-bar": fileURLToPath(
				new URL("../src/index.tsx", import.meta.url),
			),
		},
		// One copy of React across the demo and the aliased library source.
		dedupe: ["react", "react-dom"],
	},
});
