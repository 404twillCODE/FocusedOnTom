import SiteHeader from "../components/SiteHeader";
const tools = [
  {
    name: "FMHY",
    category: "MOVIES / TV / ANIME",
    description: "Stream Videos, Download Videos, Torrent Videos",
    host: "fmhy.net/video",
    href: "https://fmhy.net/video",
    logo: "/tools/logos/fmhy.webp",
  },
  {
    name: "TheTVApp",
    category: "LIVE TV / SPORTS",
    description:
      "The free TV app for watching live sports streams in HD. NBA, NFL, MLB, NHL, soccer, UFC, F1. No signup, no downloads. Watch on any device.",
    host: "tvapp1.com",
    href: "https://tvapp1.com",
    logo: "/tools/logos/tvapp.svg",
  },
];
export default function ToolsPage() {
  return (
    <>
      <a className="skip" href="#tools">
        Skip to tools
      </a>
      <SiteHeader />
      <div className="liquid-environment" aria-hidden="true" />
      <main id="tools" className="tools-wrap">
        <div className="tools-intro">
          <a href="/" className="tools-back">
            ‹ Back to the portfolio
          </a>
          <span className="small-note">A SMALL CORNER OF FOCUSED ON TOM</span>
          <h1>
            Useful things<span>.</span>
          </h1>
          <p>A few links I keep coming back to. All in one place.</p>
        </div>
        <ul className="tools-list" aria-label="Saved tools">
          {tools.map((tool, index) => (
            <li key={tool.name}>
              <a
                className="tool-link"
                href={tool.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="tool-number">0{index + 1}</span>
                <img
                  className="tool-logo"
                  src={tool.logo}
                  alt=""
                  width={76}
                  height={76}
                />
                <span className="tool-copy">
                  <span className="tool-category">{tool.category}</span>
                  <strong>{tool.name}</strong>
                  <span className="tool-description">{tool.description}</span>
                  <span className="tool-host">{tool.host}</span>
                </span>
                <span className="tool-action">
                  Open website <span aria-hidden="true">↗</span>
                </span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
        <footer className="tools-footer">
          <span>Saved by Tom. Shared with you.</span>
          <a href="/">Back to the portfolio ↗</a>
        </footer>
      </main>
    </>
  );
}
