import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import React, { StrictMode } from "react";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});
for (const key of [
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "Node",
  "MouseEvent",
  "KeyboardEvent",
  "Event",
  "HashChangeEvent",
  "FormData",
])
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: dom.window[key],
  });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.addEventListener = window.addEventListener.bind(window);
globalThis.removeEventListener = window.removeEventListener.bind(window);
globalThis.dispatchEvent = window.dispatchEvent.bind(window);
globalThis.scrollY = 300;
let mobile = true;
globalThis.matchMedia = (query) => ({
  matches: query.includes("max-width") ? mobile : false,
  addEventListener() {},
  removeEventListener() {},
});
HTMLElement.prototype.scrollIntoView = () => {};
HTMLElement.prototype.animate = () => ({
  cancel() {},
  finished: Promise.resolve(),
});
globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
globalThis.cancelAnimationFrame = clearTimeout;
const { render, fireEvent, cleanup, waitFor, act } =
  await import("@testing-library/react");
const { default: SiteHeader } =
  await import("../frontend/src/components/SiteHeader.tsx");
const { default: Workbench } =
  await import("../frontend/src/components/Workbench.tsx");
const { PortfolioProvider, CollectionGrid, CollectionToolbar } =
  await import("../frontend/src/components/Portfolio.tsx");
const { default: ContactCard } =
  await import("../frontend/src/components/ContactCard.tsx");
const { default: ToolsPage } =
  await import("../frontend/src/pages/ToolsPage.tsx");
globalThis.location = window.location;
globalThis.history = window.history;
const realFetch = globalThis.fetch;

test("restored tools retain their original destinations and safe new-tab behavior", () => {
  const view = render(React.createElement(ToolsPage));
  const tools = view
    .getByRole("list", { name: "Saved tools" })
    .querySelectorAll("a");
  assert.deepEqual(
    [...tools].map((link) => link.href),
    ["https://fmhy.net/video", "https://tvapp1.com/"],
  );
  for (const link of tools) {
    assert.equal(link.target, "_blank");
    assert.match(link.rel, /noopener/);
  }
});
afterEach(() => {
  cleanup();
  globalThis.fetch = realFetch;
  mobile = true;
});

test("React mobile capsule restores the hamburger, opens the menu, and resets on Escape", () => {
  const view = render(
    React.createElement(
      StrictMode,
      null,
      React.createElement(SiteHeader, { home: true }),
    ),
  );
  const header = view.container.querySelector("header");
  assert.ok(header.classList.contains("nav-compact"));
  fireEvent.click(view.getByRole("link", { name: "Focused on Tom home" }));
  assert.ok(header.classList.contains("nav-expanded"));
  assert.equal(
    view
      .getByRole("button", { name: "Open navigation" })
      .getAttribute("aria-expanded"),
    "false",
  );
  fireEvent.click(view.getByRole("button", { name: "Open navigation" }));
  assert.ok(header.classList.contains("menu-open"));
  fireEvent.keyDown(window, { key: "Escape" });
  assert.equal(header.classList.contains("menu-open"), false);
  assert.equal(header.classList.contains("nav-expanded"), false);
});

test("React desktop navigation keeps its home link and closes after following a section", () => {
  mobile = false;
  const view = render(React.createElement(SiteHeader, { home: true }));
  const brand = view.getByRole("link", { name: "Focused on Tom home" });
  const click = new MouseEvent("click", { bubbles: true, cancelable: true });
  act(() => brand.dispatchEvent(click));
  assert.equal(click.defaultPrevented, false);
  fireEvent.click(view.getByRole("button", { name: "Open navigation" }));
  fireEvent.click(view.getByRole("link", { name: "Photography 01" }));
  assert.equal(
    view.container.querySelector("header").classList.contains("menu-open"),
    false,
  );
});

test("all six React workbench choices update the accessible preview and destination", () => {
  const view = render(React.createElement(Workbench));
  const names = [
    "Nodexity",
    "Minecraft Mods",
    "Delta Water Explorer",
    "GalleryX",
    "Afterhours",
    "TE Visuals",
  ];
  assert.deepEqual(
    view
      .getAllByRole("button")
      .map((button) => button.getAttribute("aria-label")),
    names.map((name) => `Show ${name} project`),
  );
  for (const name of names) {
    fireEvent.click(view.getByRole("button", { name: `Show ${name} project` }));
    assert.equal(
      view
        .getByRole("button", { name: `Show ${name} project` })
        .getAttribute("aria-pressed"),
      "true",
    );
    assert.ok(
      view.getByRole("link", {
        name: `Open ${name} website (opens in a new tab)`,
      }).href,
    );
  }
});

test("live portfolio replaces the bundled catalog and clears removed publications without reloading", async () => {
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
  let removed = false;
  globalThis.fetch = async (url, options) => {
    if (url === "/api/portfolio-photos") assert.equal(options.cache, "no-store");
    const id = url === "/catalog.json" ? "Bundled" : "New portraits";
    return Response.json({ collections: removed && url !== "/catalog.json" ? [] : [{
      id, name: id, category: "Portraits", photos: [{ id: "new", url: "https://example.com/new.webp" }],
    }] });
  };
  try {
    const view = render(React.createElement(PortfolioProvider, null, React.createElement(CollectionGrid)));
    await waitFor(() => assert.ok(view.getByRole("button", { name: "Explore New portraits collection" })));
    assert.equal(view.queryByRole("button", { name: "Explore Bundled collection" }), null);
    removed = true;
    fireEvent.focus(window);
    await waitFor(() => assert.equal(view.queryByRole("button", { name: "Explore New portraits collection" }), null));
  } finally {
    delete document.hidden;
  }
});

test("React portfolio filters preserve complete albums and restore all collections", async () => {
  const collections = [
    {
      id: "nature",
      name: "Camping",
      category: "Nature",
      totalPhotos: 354,
      photos: [{ id: "n", url: "https://example.com/n.jpg" }],
    },
    {
      id: "cars",
      name: "Cars",
      category: "Automotive",
      totalPhotos: 87,
      photos: [{ id: "c", url: "https://example.com/c.jpg" }],
    },
  ];
  globalThis.fetch = async () => Response.json({ collections });
  const view = render(
    React.createElement(
      PortfolioProvider,
      null,
      React.createElement(CollectionToolbar),
      React.createElement(CollectionGrid),
    ),
  );
  await waitFor(() =>
    assert.equal(
      view.getAllByRole("button", { name: /Explore .* collection/ }).length,
      2,
    ),
  );
  fireEvent.click(view.getByRole("button", { name: "Out in the world" }));
  assert.equal(
    view.getAllByRole("button", { name: /Explore .* collection/ }).length,
    1,
  );
  assert.ok(view.getByText(/354 photographs/));
  fireEvent.click(view.getByRole("button", { name: /All work/ }));
  assert.equal(
    view.getAllByRole("button", { name: /Explore .* collection/ }).length,
    2,
  );
});

test("React contact validation makes no request and a failed send preserves the draft", async () => {
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return Response.json({ ok: false }, { status: 503 });
  };
  const view = render(React.createElement(ContactCard, { request: 0 }));
  fireEvent.click(view.getByRole("button", { name: "Tell me your idea ↗" }));
  fireEvent.submit(view.container.querySelector("form"));
  assert.equal(requests, 0);
  assert.ok(view.getByText("Please enter your name."));
  fireEvent.change(view.getByLabelText(/^Your name/), {
    target: { value: "Example Visitor" },
  });
  fireEvent.change(view.getByLabelText(/^Email address/), {
    target: { value: "visitor@example.com" },
  });
  fireEvent.change(view.getByLabelText(/^What do you have in mind/), {
    target: { value: "Please keep this draft if delivery fails." },
  });
  fireEvent.submit(view.container.querySelector("form"));
  await waitFor(() => assert.ok(view.getByText(/Your message didn’t send/)));
  assert.equal(requests, 1);
  assert.equal(view.getByLabelText(/^Your name/).value, "Example Visitor");
  assert.equal(
    view.getByLabelText(/^What do you have in mind/).value,
    "Please keep this draft if delivery fails.",
  );
});


test("contact card stays revealed when opening, closing, and reopening the form", async () => {
  const view = render(React.createElement(ContactCard, { request: 0 }));
  const card = view.container.querySelector("#contact-card");
  // The scroll observer reveals the card once, then stops observing it.
  card.classList.add("is-visible");
  const open = view.getByRole("button", { name: "Tell me your idea ↗" });
  open.focus();
  fireEvent.click(open);
  await act(async () => {});
  assert.ok(card.classList.contains("is-visible"));
  assert.equal(view.container.querySelector("#contact-compose").hidden, false);
  assert.equal(document.activeElement, view.getByLabelText(/^Your name/));
  fireEvent.change(view.getByLabelText(/^Your name/), {
    target: { value: "Saved draft" },
  });
  fireEvent.click(view.getByRole("button", { name: "Back to note" }));
  assert.ok(card.classList.contains("is-visible"));
  assert.equal(document.activeElement, open);
  view.rerender(React.createElement(ContactCard, { request: 1 }));
  await act(async () => {});
  assert.ok(card.classList.contains("is-visible"));
  assert.equal(view.container.querySelector("#contact-compose").hidden, false);
  assert.equal(view.getByLabelText(/^Your name/).value, "Saved draft");
});
