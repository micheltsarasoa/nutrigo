import { StrictMode, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app.tsx";
import { interceptLinks, usePath } from "./router.ts";
import "./design-system/tokens.css";
import "./design-system/fonts.css";
import "./design-system/global.css";

// --breakpoint-desktop: the tab bar becomes the sidebar (frontend.md §6).
const desktop = matchMedia("(min-width: 1200px)");
const onResize = (listener: () => void) => {
  desktop.addEventListener("change", listener);
  return () => desktop.removeEventListener("change", listener);
};

function Root() {
  const path = usePath();
  const wide = useSyncExternalStore(onResize, () => desktop.matches);
  return <App path={path} wide={wide} />;
}

interceptLinks();

// index.html always has #root.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
