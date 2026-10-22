import SiteHeader from "../components/SiteHeader";
import { MotionToggle } from "../motion/MotionProvider";
import { useMinecraftExperience } from "../motion/useExperience";

import { useMinecraftLibrary } from "../lib/useMinecraftLibrary";

export default function MinecraftBoatMotorsPage() {
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
            {"Boat Motors"}
            <span>{"."}</span>
          </h1>
          <p>
            {
              "Give your boat a motor, fill the tank, and head out. Five horsepower tiers, engine sounds, and a live speed and fuel dashboard."
            }
          </p>
        </header>
        <div className="collection-feature">
          <img
            src="/minecraft/assets/boat-motors-cover.svg"
            alt="Boat Motors item model render"
            width="900"
            height="650"
          />
          <div>
            <p className="eyebrow">{"INSIDE THE MOD"}</p>
            <h2>{"Know your gear."}</h2>
            <div className="fact-tags">
              <span>{"9.9–100 HP"}</span>
              <span>{"5 motor sizes"}</span>
              <span>{"Fuel + dashboard"}</span>
            </div>
            <p className="compat">{"Fabric · Quilt · Forge · NeoForge"}</p>
            <p>
              {
                "Crafting, controls, installation, and the details that help you get started — all in one field guide."
              }
            </p>
            <a className="button" href="/minecraft/boat-motors/wiki">
              {"Open the Boat Motors wiki ↗"}
            </a>
            <a
              className="button secondary"
              href="https://modrinth.com/mod/boat-motors"
              target="_blank"
              rel="noopener noreferrer"
            >
              {"Modrinth project ↗"}
            </a>
            <p className="release-note">
              {"Modrinth download is not published yet."}
            </p>
          </div>
        </div>
        <div className="collection-links">
          <a href="/minecraft">{"← Back to the collection"}</a>
          <a href="/minecraft/boat-motors/wiki#crafting">
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
