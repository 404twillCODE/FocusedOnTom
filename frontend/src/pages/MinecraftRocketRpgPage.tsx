import SiteHeader from "../components/SiteHeader";
import { MotionToggle } from "../motion/MotionProvider";
import { useMinecraftExperience } from "../motion/useExperience";

import { useMinecraftLibrary } from "../lib/useMinecraftLibrary";

export default function MinecraftRocketRpgPage() {
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
      <main id="main" className="mod-collection">
        <header className="collection-title">
          <a className="back-link" href="/minecraft">
            {"← All mods"}
          </a>
          <p className="eyebrow">{"MINECRAFT / THE COLLECTION"}</p>
          <h1>
            {"Rocket RPG"}
            <span>{"."}</span>
          </h1>
          <p>
            {
              "A craftable rocket launcher with its own ammunition, straight-flying rockets, a huge explosion, and no firing cooldown."
            }
          </p>
        </header>
        <div className="collection-feature">
          <img
            src="/minecraft/assets/rocket-rpg-cover.svg"
            alt="Rocket RPG item model render"
            width="900"
            height="650"
          />
          <div>
            <p className="eyebrow">{"INSIDE THE MOD"}</p>
            <h2>{"Know your gear."}</h2>
            <div className="fact-tags">
              <span>{"Blast strength 20"}</span>
              <span>{"No cooldown"}</span>
              <span>{"Craftable ammo"}</span>
            </div>
            <p className="compat">{"Fabric · Minecraft 26.3"}</p>
            <p>
              {
                "Crafting, controls, installation, and the details that help you get started — all in one field guide."
              }
            </p>
            <a className="button" href="/minecraft/rocket-rpg/wiki">
              {"Open the Rocket RPG wiki ↗"}
            </a>
            <span className="release-pending">
              {"Modrinth link will appear when released."}
            </span>
            <p className="release-note">
              {"Modrinth download is not published yet."}
            </p>
          </div>
        </div>
        <div className="collection-links">
          <a href="/minecraft">{"← Back to the collection"}</a>
          <a href="/minecraft/rocket-rpg/wiki#crafting">
            {"Jump to crafting recipes ↗"}
          </a>
        </div>
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
