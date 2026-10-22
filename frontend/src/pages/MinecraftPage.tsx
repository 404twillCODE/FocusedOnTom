import SiteHeader from "../components/SiteHeader";
import { MotionToggle } from "../motion/MotionProvider";
import { useMinecraftExperience } from "../motion/useExperience";

import { useMinecraftLibrary } from "../lib/useMinecraftLibrary";

export default function MinecraftPage() {
  const { query, setQuery, category, setCategory, matchesMod, visibleMods } =
    useMinecraftLibrary(
      [
        [
          "transportation",
          "Boat Motors Five outboards Fuel sounds Transportation",
        ],
        ["combat", "Rocket RPG Rocket launcher Craftable ammo Combat"],
        ["combat", "Nuclear Strike Targeting map Nuclear TNT Combat"],
      ],
      [],
    );
  useMinecraftExperience();
  return (
    <>
      <a className="skip" href="#collection">
        {"Skip to mod collection"}
      </a>
      <SiteHeader home={false} />
      <div className="mc-backdrop" aria-hidden="true"></div>
      <canvas id="mod-stars" aria-hidden="true"></canvas>
      <div className="mc-progress" aria-hidden="true"></div>
      <main>
        <section
          className="sandbox-hero mc-wrap"
          aria-labelledby="sandbox-title"
        >
          <div className="sandbox-copy">
            <span className="eyebrow hero-label">
              <i></i>
              {" TOM’S SANDBOX / JAVA EDITION"}
            </span>
            <h1 id="sandbox-title">
              <span>{"MINECRAFT."}</span>
              <br />
              <em>
                {"MY WAY"}
                <span>{"."}</span>
              </em>
            </h1>
            <p>
              {"Small changes. Entirely new ways to play."}
              <br />
              {"A few things I built just to see what would happen."}
            </p>
            <a className="text-link" href="#collection">
              {"Find your next rabbit hole "}
              <span>{"↓"}</span>
            </a>
            <span className="sandbox-note">
              {"same curiosity. different world."}
            </span>
          </div>
          <div className="block-scene" aria-hidden="true">
            <span className="block-label">
              {"EXPERIMENT NO. 002 / THE SANDBOX"}
            </span>
            <div className="block-orbit orbit-a"></div>
            <div className="block-orbit orbit-b"></div>
            <div className="block-stage">
              <div className="block-shadow"></div>
              <div className="grass-block">
                <div className="block-face block-front"></div>
                <div className="block-face block-back"></div>
                <div className="block-face block-left"></div>
                <div className="block-face block-right"></div>
                <div className="block-face block-top"></div>
                <div className="block-face block-bottom"></div>
              </div>
            </div>
            <span className="block-coordinate">
              {"X: CURIOSITY "}
              <i>{"/"}</i>
              {" Y: ONE MORE IDEA"}
            </span>
            <span className="block-corner corner-one"></span>
            <span className="block-corner corner-two"></span>
          </div>
        </section>
        <section
          id="collection"
          className="mc-library mc-wrap"
          aria-labelledby="collection-heading"
        >
          <div className="section-label mc-reveal">
            <span>{"01 / BUILT TO PLAY"}</span>
            <span>{"A LITTLE OUTSIDE THE VANILLA"}</span>
          </div>
          <div className="library-heading mc-reveal">
            <div>
              <h2 id="collection-heading">
                {"PICK YOUR"}
                <br />
                <em>{"NEXT EXPERIMENT."}</em>
              </h2>
            </div>
            <p>
              {"From a faster way across the water"}
              <br />
              {"to a very different way to make an entrance."}
              <span id="mod-count" role="status">
                {visibleMods} {visibleMods === 1 ? "mod" : "mods"} to explore
              </span>
            </p>
          </div>
          <form
            className="mod-filters mc-reveal"
            role="search"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="filter-tabs" role="group" aria-label="Filter mods">
              <button
                type="button"
                data-filter="all"
                aria-pressed={category === "all"}
                onClick={() => setCategory("all")}
              >
                {"All mods "}
                <span>{"03"}</span>
              </button>
              <button
                type="button"
                data-filter="transportation"
                aria-pressed={category === "transportation"}
                onClick={() => setCategory("transportation")}
              >
                {"Transportation"}
              </button>
              <button
                type="button"
                data-filter="combat"
                aria-pressed={category === "combat"}
                onClick={() => setCategory("combat")}
              >
                {"Combat"}
              </button>
            </div>
            <label className="search-box">
              <span className="sr-only">{"Search mods"}</span>
              <input
                type="search"
                id="mod-search"
                placeholder="Find a mod…"
                autoComplete="off"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <span aria-hidden="true">{"⌕"}</span>
            </label>
          </form>
          <div className="mod-tiles">
            <a
              className="mod-tile mc-reveal"
              href="/minecraft/boat-motors/wiki/"
              data-mod-card=""
              data-category="transportation"
              data-search="Boat Motors Five outboards Fuel sounds Transportation"
              hidden={
                !matchesMod(
                  "transportation",
                  "Boat Motors Five outboards Fuel sounds Transportation",
                )
              }
            >
              <div className="mod-tile-image">
                <img
                  src="/minecraft/assets/boat-motors-cover.svg"
                  alt="Five colorful outboard motors from Boat Motors"
                  width="640"
                  height="600"
                />
                <span className="tile-number">{"01"}</span>
                <span className="tile-hover" aria-hidden="true">
                  {"Open field guide ↗"}
                </span>
              </div>
              <div className="mod-tile-caption">
                <span className="mod-kind">{"TRANSPORTATION"}</span>
                <h3>{"Boat Motors"}</h3>
                <p>
                  {"Less paddling. More exploring."}
                  <br />
                  {"Five motors, fuel, and a dashboard along for the ride."}
                </p>
                <span className="tile-footer">
                  {"Crafting · Controls · Setup "}
                  <b>{"↗"}</b>
                </span>
              </div>
            </a>
            <a
              className="mod-tile mc-reveal"
              href="/minecraft/rocket-rpg/wiki/"
              data-mod-card=""
              data-category="combat"
              data-search="Rocket RPG Rocket launcher Craftable ammo Combat"
              hidden={
                !matchesMod(
                  "combat",
                  "Rocket RPG Rocket launcher Craftable ammo Combat",
                )
              }
            >
              <div className="mod-tile-image">
                <img
                  src="/minecraft/assets/rocket-rpg-cover.svg"
                  alt="The Rocket RPG launcher and ammunition"
                  width="640"
                  height="600"
                  loading="lazy"
                />
                <span className="tile-number">{"02"}</span>
                <span className="tile-hover" aria-hidden="true">
                  {"Open field guide ↗"}
                </span>
              </div>
              <div className="mod-tile-caption">
                <span className="mod-kind">{"COMBAT"}</span>
                <h3>{"Rocket RPG"}</h3>
                <p>
                  {"A different kind of problem solver."}
                  <br />
                  {"A craftable launcher with its own ammunition."}
                </p>
                <span className="tile-footer">
                  {"Crafting · Controls · Setup "}
                  <b>{"↗"}</b>
                </span>
              </div>
            </a>
            <a
              className="mod-tile mc-reveal"
              href="/minecraft/nuclear-strike/wiki/"
              data-mod-card=""
              data-category="combat"
              data-search="Nuclear Strike Targeting map Nuclear TNT Combat"
              hidden={
                !matchesMod(
                  "combat",
                  "Nuclear Strike Targeting map Nuclear TNT Combat",
                )
              }
            >
              <div className="mod-tile-image">
                <img
                  src="/minecraft/assets/nuclear-strike-cover.svg"
                  alt="Nuclear Strike targeting map, launch button, and warhead"
                  width="640"
                  height="600"
                  loading="lazy"
                />
                <span className="tile-number">{"03"}</span>
                <span className="tile-hover" aria-hidden="true">
                  {"Open field guide ↗"}
                </span>
              </div>
              <div className="mod-tile-caption">
                <span className="mod-kind">{"COMBAT"}</span>
                <h3>{"Nuclear Strike"}</h3>
                <p>
                  {"Not exactly a subtle entrance."}
                  <br />
                  {"A targeting map, a launch button, and a big idea."}
                </p>
                <span className="tile-footer">
                  {"Crafting · Controls · Setup "}
                  <b>{"↗"}</b>
                </span>
              </div>
            </a>
          </div>
          <p
            className="empty-state"
            id="no-mods"
            role="status"
            hidden={visibleMods !== 0}
          >
            {"No mods match. Try a different search or category."}
          </p>
          <div className="sandbox-outro mc-reveal">
            <span>{"BUILT OUT OF CURIOSITY. SHARED FOR THE FUN OF IT."}</span>
            <a href="/#projects" className="text-link">
              {"More things I’m building "}
              <span>{"↗"}</span>
            </a>
          </div>
        </section>
      </main>
      <footer className="mc-footer mc-wrap">
        <a href="/#projects" className="footer-brand">
          {"focused on tom."}
        </a>
        <span>{"© 2026 TOM WILLIAMS"}</span>
        <MotionToggle id="mc-motion" />
        <p>
          {
            "Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft."
          }
        </p>
      </footer>
    </>
  );
}
