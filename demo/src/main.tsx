import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StatusBarProvider } from "react-status-bar";
import { router } from "./router";
import "./styles.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Missing #root element");

createRoot(rootEl).render(
	<StrictMode>
		{/* One provider at the very top. Every viewport and producer in the app
		    shares this store; status changes only re-render the viewport(s)
		    reading the affected scope. */}
		<StatusBarProvider>
			<RouterProvider router={router} />
		</StatusBarProvider>
	</StrictMode>,
);
