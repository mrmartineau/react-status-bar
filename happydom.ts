// Registers a DOM (document, window, etc.) on the global scope so that
// React Testing Library can render components under `bun test`.
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
