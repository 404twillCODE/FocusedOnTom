import SiteHeader from "../components/SiteHeader";
import { MotionToggle } from "../motion/MotionProvider";
import { useMinecraftExperience } from "../motion/useExperience";

import { useMinecraftLibrary } from "../lib/useMinecraftLibrary";

export default function MinecraftRocketRpgWikiPage() {
  const {
    query,
    setQuery,
    copyStatus,
    copyCommand,
    matchesRecipe,
    visibleRecipes,
  } = useMinecraftLibrary(
    [],
    [
      "RPG rocket launcher Iron ingot Iron ingot Iron ingot Flint Copper ingot Flint Lever Stick",
      "RPG rockets Iron ingot Gunpowder Paper",
    ],
  );
  useMinecraftExperience();
  return (
    <>
      <a className="skip" href="#main">
        {"Skip to content"}
      </a>
      <SiteHeader home={false} />
      <div className="mc-backdrop" aria-hidden="true"></div>
      <canvas id="mod-stars" aria-hidden="true"></canvas>
      <div className="mc-progress" aria-hidden="true"></div>
      <main id="main" className="wiki-layout">
        <aside className="wiki-sidebar">
          <a className="back-link" href="/minecraft#collection">
            {"← All mods"}
          </a>
          <p className="eyebrow">{"ROCKET RPG / WIKI"}</p>
          <nav aria-label="Wiki sections">
            <a href="#overview">{"Getting started"}</a>
            <a href="#crafting">{"Crafting recipes"}</a>
            <a href="#mechanics">{"How it works"}</a>
            <a href="#installation">{"Installation"}</a>
            <a href="#compatibility">{"Versions & loaders"}</a>
            <a href="#commands">{"Creative commands"}</a>
            <a href="#questions">{"Common questions"}</a>
          </nav>
          <div className="sidebar-release">
            <div className="release-heading">
              <span className="release-dot" aria-hidden="true"></span>
              <strong>{"Release pending"}</strong>
            </div>
            <p>
              {"The download will be available when this mod is published."}
            </p>
          </div>
        </aside>
        <article className="wiki-content">
          <header className="wiki-hero">
            <div>
              <p className="eyebrow">{"MINECRAFT / COMBAT / v1.0"}</p>
              <h1>
                {"Rocket RPG"}
                <span>{"The essentials."}</span>
              </h1>
              <p>
                {
                  "A craftable rocket launcher with its own ammunition, straight-flying rockets, a huge explosion, and no firing cooldown."
                }
              </p>
              <a className="text-link" href="#crafting">
                {"Jump to crafting ↓"}
              </a>
            </div>
            <img
              src="/minecraft/assets/rocket-rpg-cover.svg"
              alt="Rendered rocket rpg item model"
              width="900"
              height="650"
            />
          </header>
          <section id="overview" className="wiki-section">
            <p className="eyebrow">{"FIELD GUIDE"}</p>
            <h2>{"Getting started."}</h2>
            <ol className="steps">
              <li>
                {"Craft the launcher and RPG rockets using the recipes below."}
              </li>
              <li>
                {
                  "Keep rockets anywhere in your inventory. Each Survival shot consumes one rocket and one durability point."
                }
              </li>
              <li>
                {"Hold the launcher and "}
                <strong>{"right-click to fire"}</strong>
                {". There is no firing or reload cooldown."}
              </li>
            </ol>
          </section>
          <section id="crafting" className="wiki-section">
            <p className="eyebrow">{"FIELD GUIDE"}</p>
            <h2>{"Crafting recipes."}</h2>
            <p>
              {
                "Use a crafting table. Read each 3 × 3 grid left to right, from the top row down. Dotted slots stay empty. Each slot shows the ingredient and its name. The item to the right is the crafting result."
              }
            </p>
            <label className="recipe-search">
              <span>{"Find a recipe or ingredient"}</span>
              <input
                type="search"
                id="recipe-search"
                placeholder="Try iron, gas, or motor…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="recipe-list">
              <article
                className="recipe"
                id="recipe-rpg_launcher"
                data-recipe=""
                data-search="RPG rocket launcher Iron ingot Iron ingot Iron ingot Flint Copper ingot Flint Lever Stick"
                hidden={
                  !matchesRecipe(
                    "RPG rocket launcher Iron ingot Iron ingot Iron ingot Flint Copper ingot Flint Lever Stick",
                  )
                }
              >
                <div className="recipe-heading">
                  <h3>{"RPG rocket launcher"}</h3>
                  <span>{"MAKES 1"}</span>
                </div>
                <p>{"Place ingredients exactly as shown."}</p>
                <div className="recipe-body">
                  <div
                    className="crafting-grid"
                    role="group"
                    aria-label="RPG rocket launcher crafting grid, read left to right, top to bottom"
                  >
                    <span className="craft-slot" title="Iron ingot">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-iron_ingot.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Iron ingot"}</span>
                    </span>
                    <span className="craft-slot" title="Iron ingot">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-iron_ingot.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Iron ingot"}</span>
                    </span>
                    <span className="craft-slot" title="Iron ingot">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-iron_ingot.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Iron ingot"}</span>
                    </span>
                    <span className="craft-slot" title="Flint">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-flint.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Flint"}</span>
                    </span>
                    <span className="craft-slot" title="Copper ingot">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-copper_ingot.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Copper ingot"}</span>
                    </span>
                    <span className="craft-slot" title="Flint">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-flint.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Flint"}</span>
                    </span>
                    <span className="craft-slot empty" aria-label="Empty slot">
                      <span aria-hidden="true">{"·"}</span>
                    </span>
                    <span className="craft-slot" title="Lever">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-lever.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Lever"}</span>
                    </span>
                    <span className="craft-slot" title="Stick">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-stick.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Stick"}</span>
                    </span>
                  </div>
                  <span className="recipe-arrow" aria-hidden="true">
                    {"→"}
                  </span>
                  <div className="recipe-output">
                    <span className="output-visual">
                      <img
                        src="/minecraft/assets/items/rocket_rpg-rpg_launcher.png"
                        alt=""
                        width="80"
                        height="80"
                        loading="lazy"
                      />
                      <span>{"1×"}</span>
                    </span>
                    <strong>{"RPG rocket launcher"}</strong>
                  </div>
                </div>
              </article>
              <article
                className="recipe"
                id="recipe-rocket"
                data-recipe=""
                data-search="RPG rockets Iron ingot Gunpowder Paper"
                hidden={
                  !matchesRecipe("RPG rockets Iron ingot Gunpowder Paper")
                }
              >
                <div className="recipe-heading">
                  <h3>{"RPG rockets"}</h3>
                  <span>{"MAKES 4"}</span>
                </div>
                <p>{"Place ingredients exactly as shown."}</p>
                <div className="recipe-body">
                  <div
                    className="crafting-grid"
                    role="group"
                    aria-label="RPG rockets crafting grid, read left to right, top to bottom"
                  >
                    <span className="craft-slot empty" aria-label="Empty slot">
                      <span aria-hidden="true">{"·"}</span>
                    </span>
                    <span className="craft-slot" title="Iron ingot">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-iron_ingot.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Iron ingot"}</span>
                    </span>
                    <span className="craft-slot empty" aria-label="Empty slot">
                      <span aria-hidden="true">{"·"}</span>
                    </span>
                    <span className="craft-slot empty" aria-label="Empty slot">
                      <span aria-hidden="true">{"·"}</span>
                    </span>
                    <span className="craft-slot" title="Gunpowder">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-gunpowder.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Gunpowder"}</span>
                    </span>
                    <span className="craft-slot empty" aria-label="Empty slot">
                      <span aria-hidden="true">{"·"}</span>
                    </span>
                    <span className="craft-slot empty" aria-label="Empty slot">
                      <span aria-hidden="true">{"·"}</span>
                    </span>
                    <span className="craft-slot" title="Paper">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-paper.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Paper"}</span>
                    </span>
                    <span className="craft-slot empty" aria-label="Empty slot">
                      <span aria-hidden="true">{"·"}</span>
                    </span>
                  </div>
                  <span className="recipe-arrow" aria-hidden="true">
                    {"→"}
                  </span>
                  <div className="recipe-output">
                    <span className="output-visual">
                      <img
                        src="/minecraft/assets/items/rocket_rpg-rocket.png"
                        alt=""
                        width="80"
                        height="80"
                        loading="lazy"
                      />
                      <span>{"4×"}</span>
                    </span>
                    <strong>{"RPG rockets"}</strong>
                  </div>
                </div>
              </article>
            </div>
            <p id="no-recipes" hidden={visibleRecipes !== 0}>
              {"No recipes match. Try another ingredient or item."}
            </p>
          </section>
          <section id="mechanics" className="wiki-section">
            <p className="eyebrow">{"FIELD GUIDE"}</p>
            <h2>{"How it works."}</h2>
            <ul className="guide-list">
              <li>
                {"Launcher durability: "}
                <strong>{"384 shots"}</strong>
                {
                  ". Creative requires no ammunition and consumes no durability."
                }
              </li>
              <li>
                {
                  "Rockets fly straight with smoke and flame, detonate on blocks or entities, and expire after about four seconds."
                }
              </li>
              <li>
                {"Explosion strength is "}
                <strong>{"20"}</strong>
                {
                  ", compared with ordinary TNT’s 4. This is blast strength, not a fixed crater radius or guaranteed damage multiplier."
                }
              </li>
              <li>
                {
                  "No fire is placed. Large terrain explosions can damage your builds. Try it in a test world first."
                }
              </li>
            </ul>
          </section>
          <section id="installation" className="wiki-section">
            <p className="eyebrow">{"FIELD GUIDE"}</p>
            <h2>{"Install the right build."}</h2>
            <ol className="steps">
              <li>
                {
                  "Choose exactly one jar that matches your Minecraft version and loader."
                }
              </li>
              <li>
                {
                  "Install the required loader. Fabric and Quilt Boat Motors builds require matching Fabric API; native Forge and NeoForge Boat Motors builds do not. Other mods here currently require Fabric API."
                }
              </li>
              <li>
                {"Put the mod in your profile’s "}
                <code>{"mods"}</code>
                {
                  " folder. For multiplayer, install it on the server and every client."
                }
              </li>
              <li>{"Fully restart Minecraft to load the mod."}</li>
            </ol>
          </section>
          <section id="compatibility" className="wiki-section">
            <p className="eyebrow">{"FIELD GUIDE"}</p>
            <h2>{"Versions & loaders."}</h2>
            <p>
              {"The current build is for "}
              <strong>{"Minecraft Java 26.3 / Fabric"}</strong>
              {
                ", with Java 25, Fabric Loader 0.19.5 or newer, and compatible Fabric API. Forge, Quilt, NeoForge, and other Minecraft versions have not been validated for this mod."
              }
            </p>
          </section>
          <section id="commands" className="wiki-section">
            <p className="eyebrow">{"FIELD GUIDE"}</p>
            <h2>{"Creative mode. testing."}</h2>
            <p>
              {
                "Requires cheats or operator permission. These commands give items; they do not fill a new motor’s tank."
              }
            </p>
            <div className="command-row">
              <code>{"/give @s rocket_rpg:rpg_launcher"}</code>
              <button
                type="button"
                data-copy="/give @s rocket_rpg:rpg_launcher"
                aria-label="Copy command for RPG rocket launcher"
                onClick={() => copyCommand("/give @s rocket_rpg:rpg_launcher")}
              >
                {"Copy"}
              </button>
            </div>
            <div className="command-row">
              <code>{"/give @s rocket_rpg:rocket"}</code>
              <button
                type="button"
                data-copy="/give @s rocket_rpg:rocket"
                aria-label="Copy command for RPG rockets"
                onClick={() => copyCommand("/give @s rocket_rpg:rocket")}
              >
                {"Copy"}
              </button>
            </div>
            <p className="copy-status" role="status" aria-live="polite">
              {copyStatus}
            </p>
          </section>
          <section id="questions" className="wiki-section">
            <p className="eyebrow">{"FIELD GUIDE"}</p>
            <h2>{"Common questions."}</h2>
            <details className="faq">
              <summary>{"Why will the launcher not fire?"}</summary>
              <p>
                {
                  "Carry RPG rockets in your inventory and check that the launcher has durability remaining."
                }
              </p>
            </details>
            <details className="faq">
              <summary>{"Where are the Creative items?"}</summary>
              <p>{"Look in the Combat creative tab."}</p>
            </details>
            <details className="faq">
              <summary>{"Does RPG mean role-playing game?"}</summary>
              <p>
                {
                  "Here RPG means rocket launcher. This mod adds a launcher and rocket ammunition."
                }
              </p>
            </details>
          </section>
          <footer className="wiki-end">
            <a href="/minecraft">{"← Explore all mods"}</a>
            <a href="#main">{"Back to top ↑"}</a>
            <p>
              {
                "Code, assets, and documentation were created with AI assistance. Engine loops are original synthesized audio. There is no in-game generative AI functionality."
              }
            </p>
          </footer>
        </article>
      </main>
      <footer className="mc-footer">
        <a href="/">{"Focused on Tom"}</a>
        <span>{"© 2026 Tom Williams"}</span>
        <a href="/#contact">{"Let’s connect ↗"}</a>
        <p>
          {
            "Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft."
          }
        </p>
        <MotionToggle id="mc-motion" />
      </footer>
    </>
  );
}
