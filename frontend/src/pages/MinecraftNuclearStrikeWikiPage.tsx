import SiteHeader from "../components/SiteHeader";
import { MotionToggle } from "../motion/MotionProvider";
import { useMinecraftExperience } from "../motion/useExperience";

import { useMinecraftLibrary } from "../lib/useMinecraftLibrary";

export default function MinecraftNuclearStrikeWikiPage() {
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
      "Nuclear launch button Iron ingot Redstone dust Iron ingot Obsidian Lever Obsidian Iron ingot Redstone dust Iron ingot",
      "Targeting map Glass Paper Glass Redstone dust Compass Redstone dust Glass Paper Glass",
      "Nuclear warhead TNT Diamond TNT Gold ingot Nether star Gold ingot TNT Diamond TNT",
      "Nuclear TNT TNT TNT TNT TNT Nuclear warhead TNT TNT TNT TNT",
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
          <p className="eyebrow">{"NUCLEAR STRIKE / WIKI"}</p>
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
                {"Nuclear Strike"}
                <span>{"The essentials."}</span>
              </h1>
              <p>
                {
                  "Choose a target on a terrain map, press the launch button, and send in a warhead. Or light Nuclear TNT for the same enormous blast."
                }
              </p>
              <a className="text-link" href="#crafting">
                {"Jump to crafting ↓"}
              </a>
            </div>
            <img
              src="/minecraft/assets/nuclear-strike-cover.svg"
              alt="Rendered nuclear strike item model"
              width="900"
              height="650"
            />
          </header>
          <section id="overview" className="wiki-section">
            <p className="eyebrow">{"FIELD GUIDE"}</p>
            <h2>{"Getting started."}</h2>
            <ol className="steps">
              <li>{"Place a Nuclear Launch Button on a block."}</li>
              <li>
                {
                  "Right-click with the Targeting Map to open its terrain map. Click a location, then choose "
                }
                <strong>{"Save target"}</strong>
                {"."}
              </li>
              <li>
                {"Carry the saved map and a Nuclear Warhead in your inventory."}
              </li>
              <li>
                {
                  "Right-click the placed launch button. A warhead descends onto the selected location. Survival consumes one warhead."
                }
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
                id="recipe-launch_button"
                data-recipe=""
                data-search="Nuclear launch button Iron ingot Redstone dust Iron ingot Obsidian Lever Obsidian Iron ingot Redstone dust Iron ingot"
                hidden={
                  !matchesRecipe(
                    "Nuclear launch button Iron ingot Redstone dust Iron ingot Obsidian Lever Obsidian Iron ingot Redstone dust Iron ingot",
                  )
                }
              >
                <div className="recipe-heading">
                  <h3>{"Nuclear launch button"}</h3>
                  <span>{"MAKES 1"}</span>
                </div>
                <p>{"Place ingredients exactly as shown."}</p>
                <div className="recipe-body">
                  <div
                    className="crafting-grid"
                    role="group"
                    aria-label="Nuclear launch button crafting grid, read left to right, top to bottom"
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
                    <span className="craft-slot" title="Redstone dust">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-redstone.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Redstone dust"}</span>
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
                    <span className="craft-slot" title="Obsidian">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-obsidian.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Obsidian"}</span>
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
                    <span className="craft-slot" title="Obsidian">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-obsidian.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Obsidian"}</span>
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
                    <span className="craft-slot" title="Redstone dust">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-redstone.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Redstone dust"}</span>
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
                  </div>
                  <span className="recipe-arrow" aria-hidden="true">
                    {"→"}
                  </span>
                  <div className="recipe-output">
                    <span className="output-visual">
                      <img
                        src="/minecraft/assets/items/nuclear_strike-launch_button.png"
                        alt=""
                        width="80"
                        height="80"
                        loading="lazy"
                      />
                      <span>{"1×"}</span>
                    </span>
                    <strong>{"Nuclear launch button"}</strong>
                  </div>
                </div>
              </article>
              <article
                className="recipe"
                id="recipe-targeting_map"
                data-recipe=""
                data-search="Targeting map Glass Paper Glass Redstone dust Compass Redstone dust Glass Paper Glass"
                hidden={
                  !matchesRecipe(
                    "Targeting map Glass Paper Glass Redstone dust Compass Redstone dust Glass Paper Glass",
                  )
                }
              >
                <div className="recipe-heading">
                  <h3>{"Targeting map"}</h3>
                  <span>{"MAKES 1"}</span>
                </div>
                <p>{"Place ingredients exactly as shown."}</p>
                <div className="recipe-body">
                  <div
                    className="crafting-grid"
                    role="group"
                    aria-label="Targeting map crafting grid, read left to right, top to bottom"
                  >
                    <span className="craft-slot" title="Glass">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-glass.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Glass"}</span>
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
                    <span className="craft-slot" title="Glass">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-glass.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Glass"}</span>
                    </span>
                    <span className="craft-slot" title="Redstone dust">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-redstone.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Redstone dust"}</span>
                    </span>
                    <span className="craft-slot" title="Compass">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-compass.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Compass"}</span>
                    </span>
                    <span className="craft-slot" title="Redstone dust">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-redstone.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Redstone dust"}</span>
                    </span>
                    <span className="craft-slot" title="Glass">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-glass.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Glass"}</span>
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
                    <span className="craft-slot" title="Glass">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-glass.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Glass"}</span>
                    </span>
                  </div>
                  <span className="recipe-arrow" aria-hidden="true">
                    {"→"}
                  </span>
                  <div className="recipe-output">
                    <span className="output-visual">
                      <img
                        src="/minecraft/assets/items/nuclear_strike-targeting_map.png"
                        alt=""
                        width="80"
                        height="80"
                        loading="lazy"
                      />
                      <span>{"1×"}</span>
                    </span>
                    <strong>{"Targeting map"}</strong>
                  </div>
                </div>
              </article>
              <article
                className="recipe"
                id="recipe-warhead"
                data-recipe=""
                data-search="Nuclear warhead TNT Diamond TNT Gold ingot Nether star Gold ingot TNT Diamond TNT"
                hidden={
                  !matchesRecipe(
                    "Nuclear warhead TNT Diamond TNT Gold ingot Nether star Gold ingot TNT Diamond TNT",
                  )
                }
              >
                <div className="recipe-heading">
                  <h3>{"Nuclear warhead"}</h3>
                  <span>{"MAKES 1"}</span>
                </div>
                <p>{"Place ingredients exactly as shown."}</p>
                <div className="recipe-body">
                  <div
                    className="crafting-grid"
                    role="group"
                    aria-label="Nuclear warhead crafting grid, read left to right, top to bottom"
                  >
                    <span className="craft-slot" title="TNT">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-tnt.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"TNT"}</span>
                    </span>
                    <span className="craft-slot" title="Diamond">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-diamond.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Diamond"}</span>
                    </span>
                    <span className="craft-slot" title="TNT">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-tnt.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"TNT"}</span>
                    </span>
                    <span className="craft-slot" title="Gold ingot">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-gold_ingot.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Gold ingot"}</span>
                    </span>
                    <span className="craft-slot" title="Nether star">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-nether_star.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Nether star"}</span>
                    </span>
                    <span className="craft-slot" title="Gold ingot">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-gold_ingot.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Gold ingot"}</span>
                    </span>
                    <span className="craft-slot" title="TNT">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-tnt.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"TNT"}</span>
                    </span>
                    <span className="craft-slot" title="Diamond">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-diamond.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Diamond"}</span>
                    </span>
                    <span className="craft-slot" title="TNT">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-tnt.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"TNT"}</span>
                    </span>
                  </div>
                  <span className="recipe-arrow" aria-hidden="true">
                    {"→"}
                  </span>
                  <div className="recipe-output">
                    <span className="output-visual">
                      <img
                        src="/minecraft/assets/items/nuclear_strike-warhead.png"
                        alt=""
                        width="80"
                        height="80"
                        loading="lazy"
                      />
                      <span>{"1×"}</span>
                    </span>
                    <strong>{"Nuclear warhead"}</strong>
                  </div>
                </div>
              </article>
              <article
                className="recipe"
                id="recipe-nuclear_tnt"
                data-recipe=""
                data-search="Nuclear TNT TNT TNT TNT TNT Nuclear warhead TNT TNT TNT TNT"
                hidden={
                  !matchesRecipe(
                    "Nuclear TNT TNT TNT TNT TNT Nuclear warhead TNT TNT TNT TNT",
                  )
                }
              >
                <div className="recipe-heading">
                  <h3>{"Nuclear TNT"}</h3>
                  <span>{"MAKES 1"}</span>
                </div>
                <p>{"Place ingredients exactly as shown."}</p>
                <div className="recipe-body">
                  <div
                    className="crafting-grid"
                    role="group"
                    aria-label="Nuclear TNT crafting grid, read left to right, top to bottom"
                  >
                    <span className="craft-slot" title="TNT">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-tnt.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"TNT"}</span>
                    </span>
                    <span className="craft-slot" title="TNT">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-tnt.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"TNT"}</span>
                    </span>
                    <span className="craft-slot" title="TNT">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-tnt.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"TNT"}</span>
                    </span>
                    <span className="craft-slot" title="TNT">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-tnt.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"TNT"}</span>
                    </span>
                    <span className="craft-slot" title="Nuclear warhead">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/nuclear_strike-warhead.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"Nuclear warhead"}</span>
                    </span>
                    <span className="craft-slot" title="TNT">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-tnt.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"TNT"}</span>
                    </span>
                    <span className="craft-slot" title="TNT">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-tnt.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"TNT"}</span>
                    </span>
                    <span className="craft-slot" title="TNT">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-tnt.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"TNT"}</span>
                    </span>
                    <span className="craft-slot" title="TNT">
                      <img
                        className="ingredient-icon"
                        src="/minecraft/assets/items/minecraft-tnt.png"
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                      />
                      <span>{"TNT"}</span>
                    </span>
                  </div>
                  <span className="recipe-arrow" aria-hidden="true">
                    {"→"}
                  </span>
                  <div className="recipe-output">
                    <span className="output-visual">
                      <img
                        src="/minecraft/assets/items/nuclear_strike-nuclear_tnt.png"
                        alt=""
                        width="80"
                        height="80"
                        loading="lazy"
                      />
                      <span>{"1×"}</span>
                    </span>
                    <strong>{"Nuclear TNT"}</strong>
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
                {"The destruction sphere has an "}
                <strong>{"80-block radius"}</strong>
                {
                  ", or 160 blocks across. Nuclear TNT uses the same blast routine."
                }
              </li>
              <li>
                {
                  "Place Nuclear TNT and ignite it with flint and steel or a fire charge. Redstone and nearby explosions can also prime it. Its fuse is "
                }
                <strong>{"eight seconds"}</strong>
                {"."}
              </li>
              <li>
                {
                  "Blocks inside the sphere, including obsidian and liquids, are removed. Bedrock remains. Drops are suppressed. Terrain removal runs in batches over several seconds."
                }
              </li>
              <li>
                {
                  "Entity damage reaches 1,000 near the center and decreases toward the edge."
                }
              </li>
              <li>
                {
                  "The targeting map saves X/Z and dimension. Select within 4,096 blocks on each horizontal axis, in your current dimension and inside the world border."
                }
              </li>
              <li>
                {
                  "North is up; cyan marks your location. Dark map cells represent unloaded terrain. Use the map’s zoom and directional controls."
                }
              </li>
              <li>
                {
                  "The tntExplodes game rule disables both nuclear weapons when false. This mod changes large areas of terrain; use a test world or backup before experimenting."
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
              <code>{"/give @s nuclear_strike:launch_button"}</code>
              <button
                type="button"
                data-copy="/give @s nuclear_strike:launch_button"
                aria-label="Copy command for Nuclear launch button"
                onClick={() =>
                  copyCommand("/give @s nuclear_strike:launch_button")
                }
              >
                {"Copy"}
              </button>
            </div>
            <div className="command-row">
              <code>{"/give @s nuclear_strike:targeting_map"}</code>
              <button
                type="button"
                data-copy="/give @s nuclear_strike:targeting_map"
                aria-label="Copy command for Targeting map"
                onClick={() =>
                  copyCommand("/give @s nuclear_strike:targeting_map")
                }
              >
                {"Copy"}
              </button>
            </div>
            <div className="command-row">
              <code>{"/give @s nuclear_strike:warhead"}</code>
              <button
                type="button"
                data-copy="/give @s nuclear_strike:warhead"
                aria-label="Copy command for Nuclear warhead"
                onClick={() => copyCommand("/give @s nuclear_strike:warhead")}
              >
                {"Copy"}
              </button>
            </div>
            <div className="command-row">
              <code>{"/give @s nuclear_strike:nuclear_tnt"}</code>
              <button
                type="button"
                data-copy="/give @s nuclear_strike:nuclear_tnt"
                aria-label="Copy command for Nuclear TNT"
                onClick={() =>
                  copyCommand("/give @s nuclear_strike:nuclear_tnt")
                }
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
              <summary>{"Why will the button not launch?"}</summary>
              <p>
                {
                  "Save a target in your current dimension and carry the map and a warhead. Survival consumes a warhead per launch."
                }
              </p>
            </details>
            <details className="faq">
              <summary>{"Why does the crater take time to finish?"}</summary>
              <p>
                {
                  "Terrain removal is batched to reduce lag. Pending terrain work is saved and resumes after a normal world reload."
                }
              </p>
            </details>
            <details className="faq">
              <summary>{"Where are the Creative items?"}</summary>
              <p>{"Look in the Redstone Blocks creative tab."}</p>
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
