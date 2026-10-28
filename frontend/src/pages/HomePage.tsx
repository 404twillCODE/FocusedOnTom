import { useState } from "react";
import SiteHeader from "../components/SiteHeader";
import { MotionToggle } from "../motion/MotionProvider";
import {
  PortfolioProvider,
  CollectionToolbar,
  CollectionGrid,
  CatalogStatus,
} from "../components/Portfolio";
import Workbench from "../components/Workbench";
import ContactCard from "../components/ContactCard";
import Gallery from "../components/Gallery";
import Ticker from "../components/Ticker";
import { useHomeExperience } from "../motion/useExperience";

export default function HomePage() {
  const [composeRequest, requestCompose] = useState(0);
  useHomeExperience();
  return (
    <PortfolioProvider>
      <>
        <a className="skip" href="#main">
          {"Skip to content"}
        </a>
        <div className="reading-progress" aria-hidden="true"></div>
        <SiteHeader home={true} />
        <div className="liquid-environment" aria-hidden="true"></div>
        <canvas id="ambient-field" aria-hidden="true"></canvas>
        <div className="screen-grain" aria-hidden="true"></div>
        <aside className="chapter-nav" aria-label="Page chapters">
          <a href="#home" aria-label="Introduction">
            <i></i>
            <span>{"START"}</span>
          </a>
          <a href="#photography" aria-label="Photography chapter">
            <i></i>
            <span>{"OBSERVE"}</span>
          </a>
          <a href="#projects" aria-label="Coding projects chapter">
            <i></i>
            <span>{"BUILD"}</span>
          </a>
          <a href="#about" aria-label="About Tom chapter">
            <i></i>
            <span>{"HUMAN"}</span>
          </a>
          <a href="#contact" aria-label="Contact chapter">
            <i></i>
            <span>{"CONNECT"}</span>
          </a>
        </aside>
        <main id="main">
          <section
            className="hero scroll-scene"
            id="home"
            aria-labelledby="hero-title"
          >
            <div className="hero-stage">
              <div className="scene-grid" aria-hidden="true"></div>
              <div className="scene-orbit orbit-one" aria-hidden="true"></div>
              <div className="scene-orbit orbit-two" aria-hidden="true"></div>
              <div className="viewfinder-label">
                <i className="record-dot"></i>
                <span>{"THOMAS WILLIAMS"}</span>
                <span>
                  {"PERSONAL EXPLORATIONS / "}
                  <span className="year">{new Date().getFullYear()}</span>
                </span>
              </div>
              <div className="hero-title-group">
                <span className="hero-kicker">
                  {"CODE. CAMERAS. CURIOSITY."}
                </span>
                <h1 id="hero-title">
                  <span className="title-row title-row-one">{"FOCUSED"}</span>
                  <span className="title-row title-row-two">
                    {"ON TOM"}
                    <span className="title-dot">{"."}</span>
                  </span>
                </h1>
                <span className="title-outline" aria-hidden="true">
                  {"ALWAYS CURIOUS"}
                </span>
              </div>
              <div
                className="floating-composition"
                aria-label="Explore my photographs"
              >
                <a
                  className="scene-photo scene-photo-nature"
                  href="#photo/1837b224-0831-4e3c-a203-a406a79343e0/3a09cc7b-9ee7-4362-9108-478f35d95b62"
                  aria-label="View the selected BMW photograph"
                >
                  <img
                    src="https://cdn.tevisuals.com/public/portfolio/automotive/adam-lz-world-tour/pic00002-2-1778091089194.webp"
                    width="2400"
                    height="1600"
                    alt="The vintage BMW from Adam LZ World Tour"
                  />
                  <span>{"EXP. 001 / ADAM LZ WORLD TOUR"}</span>
                </a>
                <a
                  className="scene-photo scene-photo-detail"
                  href="#photo/009bd361-4add-481a-9715-7bea5e962b1d/c0fe2e74-dc56-4c52-a2dc-d7a40923119c"
                  aria-label="View the selected blue Shelby photograph"
                >
                  <img
                    src="https://cdn.tevisuals.com/public/portfolio/automotive/buffalo-cars-and-coffee/pic00054-1778105558661.webp"
                    width="1600"
                    height="2400"
                    alt="The blue Shelby at Buffalo Cars and Coffee"
                  />
                  <span>{"EXP. 002 / BUFFALO CARS & COFFEE"}</span>
                </a>
                <a
                  className="scene-photo scene-photo-focus"
                  href="#photo/626965f0-d81e-4a23-8e4f-720993307d18/9a8c7263-b02a-4d6c-a593-24db3ff4a4ce"
                  aria-label="View the selected lake photograph"
                >
                  <img
                    src="https://cdn.tevisuals.com/public/portfolio/nature/camping/pic00126-1778713560307.webp"
                    width="2400"
                    height="1600"
                    alt="A turquoise lake surrounded by forested mountains beneath a moody sky"
                    fetchPriority="high"
                  />
                  <span>
                    {"EXP. 003 / OUT THERE "}
                    <b>{"↗"}</b>
                  </span>
                  <i className="focus-corner corner-tl"></i>
                  <i className="focus-corner corner-tr"></i>
                  <i className="focus-corner corner-bl"></i>
                  <i className="focus-corner corner-br"></i>
                </a>
              </div>
              <div className="focus-reticle" aria-hidden="true">
                <span></span>
                <span></span>
                <i></i>
                <b>{"AF / TRACKING CURIOSITY"}</b>
              </div>
              <div className="hero-intro">
                <span className="tiny-label">
                  {"THE PERSON BEHIND THE PIXELS"}
                </span>
                <p>
                  {"Hey, I’m Tom."}
                  <br />
                  {"I build things. I take photos."}
                  <br />
                  {"I see where curiosity takes me."}
                </p>
                <span className="hero-location">
                  <i></i>
                  {" UPSTATE NEW YORK"}
                </span>
              </div>
              <a className="scroll-invitation" href="#photography">
                <span className="scroll-mouse">
                  <i></i>
                </span>
                <span>
                  {"SCROLL TO FIND YOUR FOCUS"}
                  <small>{"OR JUMP STRAIGHT TO THE WORK ↗"}</small>
                </span>
                <b>{"↓"}</b>
              </a>
              <div className="hero-telemetry" aria-hidden="true">
                <span>{"35 MM / A DIFFERENT PERSPECTIVE"}</span>
                <span className="depth-meter">
                  {"DEPTH "}
                  <b id="depth-value">{"000"}</b>
                </span>
              </div>
              <div className="scene-exit" aria-hidden="true">
                <span>{"EVERYTHING STARTS WITH A SECOND LOOK."}</span>
                <strong>
                  {"LOOK "}
                  <em>{"CLOSER."}</em>
                </strong>
              </div>
            </div>
          </section>
          <Ticker />
          <section
            className="photography section"
            id="photography"
            aria-labelledby="photo-heading"
          >
            <div className="photo-pin wrap">
              <div className="section-index reveal">
                <span>{"01 / OBSERVE_MODE"}</span>
                <span>{"THE WORLD, THROUGH MY VIEWFINDER"}</span>
              </div>
              <div className="section-heading reveal">
                <h2 id="photo-heading">
                  <span className="photo-title-line">{"CHASING"}</span>
                  <br />
                  <span className="photo-title-line">
                    {"THE "}
                    <em>{"FEELING."}</em>
                  </span>
                </h2>
                <div>
                  <p>
                    {"The cars. The places. The moments in between."}
                    <br className="desktop-break" />
                    {" Here’s what caught my eye."}
                  </p>
                  <span className="small-note">
                    {"PHOTOGRAPHY BY TOM WILLIAMS"}
                  </span>
                </div>
              </div>
              <CollectionToolbar />
              <div className="collection-viewport">
                <CollectionGrid />
              </div>
              <div className="filmstrip-track" aria-hidden="true">
                <span></span>
              </div>
              <CatalogStatus />
              <div className="section-end">
                <span>{"REAL PLACES. REAL MOMENTS. MY POINT OF VIEW."}</span>
                <a
                  className="text-link"
                  href="https://www.tevisuals.com/photographer/tom"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {"Prints & full photo library "}
                  <span>{"↗"}</span>
                </a>
              </div>
            </div>
          </section>
          <section
            className="projects section"
            id="projects"
            aria-labelledby="project-heading"
          >
            <div className="wrap">
              <div className="section-index reveal">
                <span>{"02 / BUILD_MODE"}</span>
                <span>{"CURIOSITY, COMPILED."}</span>
              </div>
              <div className="section-heading reveal">
                <h2 id="project-heading">
                  <span className="workbench-title-word">{"THE"}</span>
                  <br />
                  <em>{"WORKBENCH."}</em>
                </h2>
                <div>
                  <p>
                    {"A few things I’ve built."}
                    <br className="desktop-break" />
                    {" Pick a project. Take a closer look."}
                  </p>
                  <a
                    className="text-link"
                    href="https://github.com/404twillCODE"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {"Find me on GitHub "}
                    <span>{"↗"}</span>
                  </a>
                </div>
              </div>
              <div className="workbench-note reveal">
                {"built because I wanted it to exist."}
                <span aria-hidden="true">{"↙"}</span>
              </div>
              <Workbench />
              <div className="project-footnote">
                <span>{"THE TOOLBOX"}</span>
                <p>
                  {"JavaScript "}
                  <i>{"/"}</i>
                  {" TypeScript "}
                  <i>{"/"}</i>
                  {" React "}
                  <i>{"/"}</i>
                  {" Node.js "}
                  <i>{"/"}</i>
                  {" Electron "}
                  <i>{"/"}</i>
                  {" A little persistence"}
                </p>
              </div>
            </div>
          </section>
          <section
            className="about section wrap"
            id="about"
            aria-labelledby="about-heading"
          >
            <div className="section-index reveal">
              <span>{"03 / HUMAN_MODE"}</span>
              <span>{"MORE THAN A BROWSER TAB"}</span>
            </div>
            <div className="about-grid">
              <div className="portrait reveal">
                <img
                  src="/assets/tom-portrait.png"
                  width="1080"
                  height="1080"
                  alt="Tom standing beside his Chrysler 300 under a colorful evening sky"
                  loading="lazy"
                />
                <span className="portrait-label">
                  {"THOMAS WILLIAMS "}
                  <span>{"THAT’S ME ↗"}</span>
                </span>
                <span className="portrait-sticker">
                  {"OFFLINE"}
                  <br />
                  {"IS A GOOD"}
                  <br />
                  <em>{"PLACE TO BE."}</em>
                </span>
              </div>
              <div className="about-copy reveal">
                <span className="small-note">{"HEY AGAIN. I’M TOM."}</span>
                <h2 id="about-heading">
                  <span className="about-title-line">{"A HUMAN."}</span>
                  <br />
                  <span className="about-title-line">{"NOT JUST"}</span>
                  <br />
                  <span className="about-title-line">
                    {"A "}
                    <em>{"HANDLE."}</em>
                  </span>
                </h2>
                <p className="reveal">
                  {
                    "I’m a computer science student at SUNY Poly, based in Upstate New York. Some days I’m building an app. Other days I’m finding a back road, heading to a car meet, or taking the long way home with my camera."
                  }
                </p>
                <p className="reveal">
                  {
                    "Code and photography scratch the same itch for me: noticing a little detail, figuring out what it could become, and making it feel right."
                  }
                </p>
                <div className="now-list">
                  <div className="reveal">
                    <span>{"LEARNING"}</span>
                    <strong>{"Computer science @ SUNY Poly"}</strong>
                  </div>
                  <div className="reveal">
                    <span>{"BUILDING"}</span>
                    <strong>{"Tools I’d want to use myself"}</strong>
                  </div>
                  <div className="reveal">
                    <span>{"EXPLORING"}</span>
                    <strong>{"Back roads & the next idea"}</strong>
                  </div>
                </div>
                <a
                  className="text-link"
                  href="https://instagram.com/thomasw_300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {"A little more of my world "}
                  <span>{"↗"}</span>
                </a>
              </div>
            </div>
          </section>
          <section
            className="contact section"
            id="contact"
            aria-labelledby="contact-heading"
          >
            <div className="wrap">
              <div className="section-index reveal">
                <span>{"04 / CONNECT_MODE"}</span>
                <span>{"LET’S SEE WHERE AN IDEA GOES"}</span>
              </div>
              <div className="contact-layout">
                <div className="contact-intro reveal">
                  <span className="contact-kicker">
                    {"YOUR NEXT IDEA. A LITTLE CURIOSITY."}
                  </span>
                  <h2 id="contact-heading">
                    <span>{"LET’S MAKE"}</span>
                    <br />
                    <em>{"IT HAPPEN."}</em>
                  </h2>
                  <p>
                    {"A photo worth keeping. Something worth building."}
                    <br className="desktop-break" />
                    {" Or an idea we haven’t figured out yet."}
                  </p>
                  <div
                    className="contact-topics"
                    aria-label="Start a conversation"
                  >
                    <a
                      href="https://www.tevisuals.com/book"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>{"01"}</span>
                      {" A photo shoot "}
                      <b>{"↗"}</b>
                    </a>
                    <button
                      data-contact=""
                      onClick={() => requestCompose((value) => value + 1)}
                    >
                      <span>{"02"}</span>
                      {" Something to build "}
                      <b>{"↗"}</b>
                    </button>
                    <button
                      data-contact=""
                      onClick={() => requestCompose((value) => value + 1)}
                    >
                      <span>{"03"}</span>
                      {" Just an idea "}
                      <b>{"↗"}</b>
                    </button>
                  </div>
                </div>
                <ContactCard request={composeRequest} />
              </div>
              <div className="contact-bottom reveal">
                <p>
                  {"Code. Cameras. Good conversations."}
                  <span>{"UPSTATE NEW YORK / WHEREVER THE IDEA TAKES US"}</span>
                </p>
                <div className="social-links">
                  <a
                    href="https://instagram.com/thomasw_300"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {"Instagram "}
                    <span>{"↗"}</span>
                  </a>
                  <a
                    href="https://github.com/404twillCODE"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {"GitHub "}
                    <span>{"↗"}</span>
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>
        <footer className="wrap footer">
          <a className="brand" href="#home">
            <span className="brand-mark" aria-hidden="true">
              <img
                src="/assets/brand/focused-on-tom.svg"
                alt=""
                width="36"
                height="36"
              />
            </span>
            <span>{"focused on tom."}</span>
          </a>
          <span>
            {"© "}
            <span className="year">{new Date().getFullYear()}</span>
            {" TOM WILLIAMS"}
          </span>
          <a href="#home">
            {"MADE WITH A LITTLE CURIOSITY "}
            <span>{"↑"}</span>
          </a>
          <MotionToggle id="motion-toggle" />
        </footer>
        <Gallery />
      </>
    </PortfolioProvider>
  );
}
