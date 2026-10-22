import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

const routes = JSON.parse(
  await readFile(new URL("../frontend/routes.json", import.meta.url), "utf8"),
);
for (const route of routes) {
  const source = await readFile(
    new URL(
      "../archives/pre-react-site" + route.path + "index.html",
      import.meta.url,
    ),
    "utf8",
  );
  const built = await readFile(
    new URL("../build" + route.path + "index.html", import.meta.url),
    "utf8",
  );
  const original = new JSDOM(source).window.document,
    current = new JSDOM(built).window.document;
  const values = (document, selector, attribute) =>
    [...document.querySelectorAll(selector)].map((element) =>
      attribute
        ? element.getAttribute(attribute)
        : element.textContent.replace(/\s+/g, " ").trim(),
    );
  assert.equal(current.title, original.title, route.path + " title");
  assert.deepEqual(
    values(current, "link[rel=stylesheet]", "href"),
    values(original, "link[rel=stylesheet]", "href"),
    route.path + " styles",
  );
  assert.deepEqual(
    values(current, "main h1"),
    values(original, "main h1"),
    route.path + " heading",
  );
  assert.deepEqual(
    values(current, "[data-recipe]", "id"),
    values(original, "[data-recipe]", "id"),
    route.path + " recipes",
  );
  assert.deepEqual(
    values(current, "[data-copy]", "data-copy"),
    values(original, "[data-copy]", "data-copy"),
    route.path + " commands",
  );
  for (const image of values(original, "main img", "src"))
    assert.ok(
      values(current, "main img", "src").includes(image),
      route.path + " photo: " + image,
    );
  assert.equal(
    current.querySelectorAll(
      'script[src*="/app.js"],script[src*="/minecraft.js"],script[src*="/experience.js"]',
    ).length,
    0,
  );
  if (route.path !== "/")
    assert.equal(
      current.querySelector("main").textContent.replace(/\s+/g, ""),
      original.querySelector("main").textContent.replace(/\s+/g, ""),
      route.path + " content",
    );
  console.log("Preserved design, content, and page metadata:", route.path);
}
console.log(
  "All 8 React pages preserve the original design assets, headings, recipes, and metadata.",
);
