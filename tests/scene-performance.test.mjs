import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createSceneUpdater } from "../frontend/src/motion/scene-layout.ts";

test("scroll updates finish all layout reads before writing styles and skip unchanged writes", () => {
  const dom = new JSDOM(
    `<div class="reading-progress"></div><section id="home" class="hero"></section><section id="photography"><div class="section-heading"></div><div id="collection-grid"><button class="scroll-album"></button></div></section><section id="projects"><div class="section-heading"></div></section><section id="about"><div class="portrait"></div><div class="about-copy"></div></section><section id="contact"></section><b id="depth-value"></b><nav class="chapter-nav"><a href="#home"></a></nav><dialog></dialog>`,
  );
  globalThis.document = dom.window.document;
  globalThis.innerHeight = 900;
  globalThis.innerWidth = 1440;
  globalThis.scrollY = 800;
  let writes = 0,
    readsAfterWrite = 0;
  const read = () => {
    if (writes) readsAfterWrite++;
    return 400;
  };
  for (const element of document.querySelectorAll("*")) {
    element.getBoundingClientRect = () => {
      read();
      return { top: 100, bottom: 500, height: 400 };
    };
    for (const key of ["offsetTop", "offsetHeight", "scrollHeight"])
      Object.defineProperty(element, key, { get: read });
    const original = element.style.setProperty.bind(element.style);
    element.style.setProperty = (...args) => {
      writes++;
      original(...args);
    };
  }
  const scene = createSceneUpdater();
  scene.configure(false);
  scene.update(false);
  assert.ok(writes > 10);
  assert.equal(
    readsAfterWrite,
    0,
    "scroll work must not force layout after a style mutation",
  );
  writes = 0;
  scene.update(false);
  assert.equal(
    writes,
    0,
    "stationary values should not invalidate styles again",
  );
  assert.equal(readsAfterWrite, 0);
  dom.window.close();
});

test("scene refresh discovers new albums and the background can detect open overlays", () => {
  const dom = new JSDOM(
    `<div class="reading-progress"></div><section id="home" class="hero"></section><section id="photography"><div class="section-heading"></div><div id="collection-grid"></div></section><section id="projects"><div class="section-heading"></div></section><section id="about"><div class="portrait"></div><div class="about-copy"></div></section><section id="contact"></section><b id="depth-value"></b><dialog></dialog>`,
  );
  globalThis.document = dom.window.document;
  globalThis.innerHeight = 900;
  globalThis.innerWidth = 1440;
  globalThis.scrollY = 0;
  const scene = createSceneUpdater();
  const card = document.createElement("button");
  card.className = "scroll-album";
  document.getElementById("collection-grid").append(card);
  scene.refreshCards();
  scene.update(false);
  assert.notEqual(card.style.getPropertyValue("--album-position"), "");
  assert.equal(scene.overlayOpen(), false);
  document.querySelector("dialog").open = true;
  assert.equal(scene.overlayOpen(), true);
  dom.window.close();
});
