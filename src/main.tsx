import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Remove the static loader immediately on React mount
const loader = document.getElementById("initial-loader");
if (loader) loader.remove();

createRoot(document.getElementById("root")!).render(<App />);
