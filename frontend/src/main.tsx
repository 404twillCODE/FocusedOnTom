import { lazy, Suspense, StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { pages } from "./routes";
import { MotionProvider } from "./motion/MotionProvider";

const path = location.pathname
  .replace(/\/index\.html$/, "/")
  .replace(/\/?$/, "/");
const page = pages[path as keyof typeof pages] ?? pages["/"];
document.body.className = page.bodyClass;
const Page = lazy(page.load);

const app = (
  <StrictMode>
    <MotionProvider>
      <Suspense fallback={null}>
        <Page />
      </Suspense>
    </MotionProvider>
  </StrictMode>
);
const root = document.getElementById("root")!;
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
