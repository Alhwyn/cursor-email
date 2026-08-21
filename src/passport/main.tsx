import { ConvexProvider } from "convex/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { convex } from "./convex";
import { GuestsPage } from "./GuestsPage";
import { PassportPage } from "./PassportPage";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function App() {
  const path =
    typeof window !== "undefined"
      ? window.location.pathname.replace(/\/+$/, "") || "/"
      : "/";

  if (path === "/guests" || path === "/crm") {
    return <GuestsPage />;
  }

  const segment = path.startsWith("/") ? path.slice(1) : path;
  if (segment && UUID_RE.test(segment) && !segment.includes("/")) {
    return <PassportPage passportId={segment} />;
  }

  return <PassportPage />;
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root not found");
}

createRoot(root).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </StrictMode>,
);
