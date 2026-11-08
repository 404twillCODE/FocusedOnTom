import { animate } from "motion/mini";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { projects } from "../lib/projects";
import { safeUrl } from "../lib/catalog";
import { useMotion } from "../motion/MotionProvider";

export default function Workbench() {
  const [selected, setSelected] = useState(0),
    project = projects[selected];
  const { disabled } = useMotion();
  const previousProject = useRef(project.id);
  const image = useRef<HTMLImageElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const consoleLabel = useRef<HTMLSpanElement>(null);
  const spotlight = useRef<HTMLSpanElement>(null);

  // Adapt Magic UI's pointer tracking to a narrow, transform-only light.
  function moveSpotlight(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse" || !spotlight.current) return;
    const left = event.currentTarget.getBoundingClientRect().left;
    spotlight.current.style.transform = `translateX(${event.clientX - left}px)`;
  }

  useEffect(() => {
    const changed = previousProject.current !== project.id;
    previousProject.current = project.id;
    if (
      !changed ||
      disabled ||
      typeof window.Animation !== "function" ||
      !image.current ||
      !caption.current ||
      !consoleLabel.current
    )
      return;

    const preview = animate(
      image.current,
      { opacity: [0.35, 1], transform: ["scale(0.985)", "none"] },
      { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
    );
    const details = animate(
      caption.current,
      { opacity: [0.55, 1], transform: ["translateY(7px)", "none"] },
      { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
    );
    const label = animate(
      consoleLabel.current,
      { opacity: [0.35, 1], transform: ["translateY(4px)", "none"] },
      { duration: 0.24, ease: "easeOut" },
    );
    return () => {
      preview.cancel();
      details.cancel();
      label.cancel();
    };
  }, [project.id, disabled]);

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
    <>
      <div id="project-grid" className="project-grid">
        <div className="workbench-arrival workbench-reveal reveal">
          <div
            className="workbench-index"
            role="group"
            aria-label="Select a coding project"
          >
            <div className="workbench-index-label" data-workbench-reveal>
              ~/ selected-work
            </div>
            {projects.map((project, index) => (
              <button
                key={project.id}
                type="button"
                className={
                  "project-selector" + (index === selected ? " selected" : "")
                }
                style={
                  { "--selector-order": String(index + 1) } as CSSProperties
                }
                aria-label={`Show ${project.name} project`}
                data-workbench-reveal
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
            onPointerMove={disabled ? undefined : moveSpotlight}
          >
            <span
              ref={spotlight}
              className="workbench-spotlight"
              aria-hidden="true"
            />
            <div className="workbench-bar">
              <span className="console-lights" data-workbench-reveal>
                ● ● ●
              </span>
              <span ref={consoleLabel} data-workbench-reveal>
                {project.id} / project-preview
              </span>
              <span data-workbench-reveal>
                {String(selected + 1).padStart(2, "0")} /{" "}
                {String(projects.length).padStart(2, "0")}
              </span>
            </div>
            <a
              href={safeUrl(project.links[0][1])}
              target="_blank"
              rel="noopener noreferrer"
              className="workbench-visual workbench-preview-link"
              data-workbench-reveal
              aria-label={`Open ${project.name} website (opens in a new tab)`}
            >
              <img
                key={project.id}
                ref={image}
                src={project.image}
                alt={`${project.name} interface preview`}
                loading="eager"
                decoding="async"
              />
              <span
                className="workbench-link-label"
                aria-hidden="true"
                data-workbench-reveal
              >
                Open website <span>↗</span>
              </span>
            </a>
            <div ref={caption} className="workbench-copy">
              <div className="workbench-summary">
                <h3 data-workbench-reveal>{project.name}</h3>
                <p data-workbench-reveal>{project.description}</p>
              </div>
              <div className="workbench-meta">
                <span className="workbench-kind" data-workbench-reveal>
                  {project.category.charAt(0) +
                    project.category.slice(1).toLowerCase()}
                </span>
                <div
                  className="workbench-stack"
                  aria-label="Project highlights"
                >
                  {project.tags.map((tag) => (
                    <span key={tag} data-workbench-reveal>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      <section
        className="project-footnote"
        aria-labelledby="toolbox-heading"
        data-reveal
      >
        <span id="toolbox-heading">THE TOOLBOX</span>
        <div className="toolbox-content" aria-live="polite" aria-atomic="true">
          <div className="toolbox-selection" key={project.id}>
            <span className="toolbox-project">{project.name}</span>
            <ul className="toolbox-chips" role="list" aria-label="Technologies">
              {project.technologies.map((technology, index) => (
                <li
                  key={technology}
                  style={{ "--step": index } as CSSProperties}
                >
                  {technology}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
