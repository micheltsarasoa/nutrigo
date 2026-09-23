import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app.tsx";
import "./design-system/tokens.css";
import "./design-system/fonts.css";
import "./design-system/global.css";

// index.html always has #root.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
