import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeDatabase } from "./lib/database";

console.log("Starting React application...");

// Initialize database
initializeDatabase();

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
  console.log("React app rendered successfully");
} else {
  console.error("Root element not found");
}
