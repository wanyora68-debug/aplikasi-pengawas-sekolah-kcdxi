import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeLocalStorage } from "./lib/localStorage";

console.log("Starting React application...");

// Initialize localStorage database
initializeLocalStorage();

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
  console.log("React app rendered successfully");
} else {
  console.error("Root element not found");
}
