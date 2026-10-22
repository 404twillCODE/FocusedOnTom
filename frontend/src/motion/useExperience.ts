import { useEffect } from "react";
import { startHomeEngine } from "./home-engine";
import { startStarEngine } from "./star-engine";

export function useHomeExperience() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("motion-ready");
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            reveal.unobserve(entry.target);
          }
      },
      { threshold: 0.08 },
    );
    const album = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            album.unobserve(entry.target);
          }
      },
      { threshold: 0.01, rootMargin: "0px 0px 80px 0px" },
    );
    const detail = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            detail.unobserve(entry.target);
          }
      },
      { threshold: 0.1, rootMargin: "0px 0px 30px 0px" },
    );
    const seen = new WeakSet<Element>();
    function scan() {
      document
        .querySelectorAll(
          ".section-heading>div>*, .section-index>span, .filter-tabs button, .gallery-hint, .about-copy>p, .now-list>div, .about-copy>.text-link",
        )
        .forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          element.classList.remove("reveal");
          element.classList.add("detail-reveal");
          detail.observe(element);
        });
      document.querySelectorAll(".reveal").forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        (element.matches(".scroll-album, .workbench-reveal")
          ? album
          : reveal
        ).observe(element);
      });
    }
    scan();
    const changes = new MutationObserver(scan);
    changes.observe(document.getElementById("main")!, {
      childList: true,
      subtree: true,
    });
    const progress = () => {
      const total = root.scrollHeight - innerHeight;
      const bar = document.querySelector<HTMLElement>(".reading-progress");
      if (bar)
        bar.style.transform = `scaleX(${total > 0 ? Math.min(1, scrollY / total) : 0})`;
    };
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting)
            document
              .querySelectorAll<HTMLAnchorElement>(".site-header nav a")
              .forEach((link) => {
                if (link.hash === "#" + entry.target.id)
                  link.setAttribute("aria-current", "location");
                else link.removeAttribute("aria-current");
              });
      },
      { rootMargin: "-20% 0px -55% 0px" },
    );
    document
      .querySelectorAll("main>section[id]")
      .forEach((section) => sectionObserver.observe(section));
    addEventListener("scroll", progress, { passive: true });
    progress();
    const stopHome = startHomeEngine();
    return () => {
      stopHome();
      reveal.disconnect();
      album.disconnect();
      detail.disconnect();
      changes.disconnect();
      sectionObserver.disconnect();
      removeEventListener("scroll", progress);
      root.classList.remove("motion-ready");
    };
  }, []);
}

export function useMinecraftExperience() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("mc-motion-ready");
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            reveal.unobserve(entry.target);
          }
      },
      { threshold: 0.05, rootMargin: "0px 0px 50px 0px" },
    );
    document
      .querySelectorAll(
        ".mc-reveal,.collection-title,.collection-feature,.wiki-hero",
      )
      .forEach((element) => {
        element.classList.add("mc-reveal");
        reveal.observe(element);
      });
    const wikiLinks = [
      ...document.querySelectorAll<HTMLAnchorElement>(".wiki-sidebar nav a"),
    ];
    const sections = new Map<string, boolean>();
    const active = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          sections.set(entry.target.id, entry.isIntersecting);
        const current = wikiLinks.find((link) =>
          sections.get(link.hash.slice(1)),
        );
        if (current)
          wikiLinks.forEach((link) => {
            if (link === current) link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
      },
      { rootMargin: "-100px 0px -55% 0px", threshold: 0 },
    );
    document
      .querySelectorAll(".wiki-section[id]")
      .forEach((section) => active.observe(section));
    if (
      wikiLinks.length &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      document.body.classList.add("wiki-animated");
      document
        .querySelectorAll(
          ".wiki-section>h2,.wiki-section>.eyebrow,.recipe,.steps,.table-wrap,.faq,.command-row",
        )
        .forEach((element) => {
          element.classList.add("reveal-section");
          reveal.observe(element);
        });
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const disabled = root.classList.contains("motion-off"),
        y = scrollY,
        total = root.scrollHeight - innerHeight;
      const bar = document.querySelector<HTMLElement>(".mc-progress");
      if (bar)
        bar.style.transform = `scaleX(${total > 0 ? Math.min(1, y / total) : 0})`;
      const scene = document.querySelector<HTMLElement>(".block-scene");
      if (scene) {
        const progress = disabled ? 0 : Math.min(1, y / (innerHeight * 0.8));
        scene.style.setProperty("--sandbox-scroll", progress.toFixed(4));
        const title = document.querySelector<HTMLElement>(".sandbox-copy h1");
        if (title) title.style.translate = `${progress * -18}px 0`;
      }
      const grid = document.querySelector<HTMLElement>(".mod-tiles");
      if (grid) {
        const top = grid.getBoundingClientRect().top;
        for (const card of grid.querySelectorAll<HTMLElement>(
          ".mod-tile:not([hidden])",
        )) {
          const position = disabled
            ? 0
            : Math.max(
                -1,
                Math.min(
                  1,
                  (innerHeight * 0.5 -
                    top -
                    card.offsetTop -
                    card.offsetHeight * 0.5) /
                    (innerHeight * 0.85),
                ),
              );
          card.style.setProperty("--mod-position", position.toFixed(5));
        }
        const heading = document.querySelector(".library-heading");
        if (heading)
          document
            .getElementById("collection")
            ?.style.setProperty(
              "--collection-enter",
              (disabled
                ? 1
                : Math.max(
                    0,
                    Math.min(
                      1,
                      (innerHeight * 0.9 -
                        heading.getBoundingClientRect().top) /
                        (innerHeight * 0.7),
                    ),
                  )
              ).toFixed(5),
            );
      }
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const filters = new MutationObserver(request);
    const grid = document.querySelector(".mod-tiles");
    if (grid)
      filters.observe(grid, {
        subtree: true,
        attributes: true,
        attributeFilter: ["hidden"],
      });
    addEventListener("scroll", request, { passive: true });
    addEventListener("resize", request);
    addEventListener("portfolio:motion", request);
    update();
    const stopStars = startStarEngine();
    return () => {
      stopStars();
      cancelAnimationFrame(frame);
      reveal.disconnect();
      active.disconnect();
      filters.disconnect();
      removeEventListener("scroll", request);
      removeEventListener("resize", request);
      removeEventListener("portfolio:motion", request);
      root.classList.remove("mc-motion-ready");
      document.body.classList.remove("wiki-animated");
    };
  }, []);
}
