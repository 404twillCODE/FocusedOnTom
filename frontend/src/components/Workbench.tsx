import { useEffect, useState, type CSSProperties } from "react";
import { projects } from "../lib/projects";
import { safeUrl } from "../lib/catalog";

export default function Workbench() {
  const [selected, setSelected] = useState(0),
    project = projects[selected];
  useEffect(() => {
    const route = () => {
      const [kind, id] = location.hash.slice(1).split("/");
      if (kind === "project") {
        const index = projects.findIndex((project) => project.id === id);
        if (index >= 0) {
          setSelected(index);
          history.replaceState(null, "", "#projects");
          document.getElementById("projects")?.scrollIntoView({
            behavior: document.documentElement.classList.contains("motion-off")
              ? "instant"
              : "smooth",
            block: "start",
          });
        }
      }
    };
    route();
    addEventListener("hashchange", route);
    return () => removeEventListener("hashchange", route);
  }, []);
  return (
    <div id="project-grid" className="project-grid">
      <div className="workbench-arrival workbench-reveal reveal">
        <div
          className="workbench-index"
          role="group"
          aria-label="Select a coding project"
        >
          <div className="workbench-index-label">~/ selected-work</div>
          {projects.map((project, index) => (
            <button
              key={project.id}
              type="button"
              className={
                "project-selector" + (index === selected ? " selected" : "")
              }
              style={{ "--selector-order": String(index + 1) } as CSSProperties}
              aria-label={`Show ${project.name} project`}
              aria-pressed={index === selected}
              onClick={() => setSelected(index)}
            >
              <span className="project-selector-number">0{index + 1}</span>
              <span>
                <strong>{project.name}</strong>
                <small>{project.category}</small>
              </span>
              <span className="project-selector-arrow">↗</span>
            </button>
          ))}
        </div>
      </div>
      <div className="workbench-arrival workbench-preview-arrival workbench-reveal reveal">
        <section
          className="workbench-screen"
          aria-label="Selected project preview"
        >
          <div className="workbench-bar">
            <span className="console-lights">● ● ●</span>
            <span>{project.id} / project-preview</span>
            <span>
              {String(selected + 1).padStart(2, "0")} /{" "}
              {String(projects.length).padStart(2, "0")}
            </span>
          </div>
          <a
            key={project.id}
            href={safeUrl(project.links[0][1])}
            target="_blank"
            rel="noopener noreferrer"
            className="workbench-visual workbench-preview-link"
            aria-label={`Open ${project.name} website (opens in a new tab)`}
          >
            <img
              src={project.image}
              alt={`${project.name} interface preview`}
              loading="eager"
              decoding="async"
            />
            <span className="workbench-hover-prompt" aria-hidden="true">
              Open website
            </span>
          </a>
          <div className="workbench-copy">
            <div className="workbench-summary">
              <h3>{project.name}</h3>
              <p>{project.description}</p>
            </div>
            <div className="workbench-meta">
              <span className="workbench-kind">
                {project.category.charAt(0) +
                  project.category.slice(1).toLowerCase()}
              </span>
              <div className="workbench-stack" aria-label="Built with">
                {project.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
