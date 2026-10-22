/** Read geometry together, then write only changed values. Never mix the phases. */
export function createSceneUpdater() {
  const root = document.documentElement;
  const get = (selector: string) =>
    document.querySelector<HTMLElement>(selector)!;
  const hero = get(".hero"),
    code = get("#projects"),
    album = get("#collection-grid"),
    about = get("#about");
  const portrait = get(".portrait"),
    copy = get(".about-copy"),
    depth = get("#depth-value");
  const progressBar = get(".reading-progress");
  const sections = ["home", "photography", "projects", "about", "contact"].map(
    (id) => get("#" + id),
  );
  const headings = [
    get("#photography .section-heading"),
    get("#projects .section-heading"),
  ];
  const links = [
    ...document.querySelectorAll<HTMLAnchorElement>(".chapter-nav a"),
  ];
  const dialogs = [...document.querySelectorAll<HTMLDialogElement>("dialog")];
  let cards = [...album.querySelectorAll<HTMLElement>(".scroll-album")];
  let active = "";
  const values = new WeakMap<HTMLElement, Map<string, string>>();
  const clamp = (value: number, min = 0, max = 1) =>
    Math.min(max, Math.max(min, value));
  const ease = (value: number) => {
    const t = clamp(value);
    return t * t * (3 - 2 * t);
  };
  function style(element: HTMLElement, name: string, value: string) {
    let previous = values.get(element);
    if (!previous) {
      previous = new Map();
      values.set(element, previous);
    }
    if (previous.get(name) === value) return;
    previous.set(name, value);
    element.style.setProperty(name, value);
  }
  function update(reduced: boolean) {
    const height = innerHeight;
    // One geometry phase lets the browser resolve layout at most once per update.
    const rects = sections.map((section) => section.getBoundingClientRect());
    const heroHeight = hero.offsetHeight,
      codeHeight = code.offsetHeight;
    const albumTop = album.getBoundingClientRect().top;
    const positions = cards.map((card) => ({
      card,
      center: albumTop + card.offsetTop + card.offsetHeight * 0.5,
    }));
    const headingTops = headings.map(
      (heading) => heading.getBoundingClientRect().top,
    );
    const portraitTop = portrait.offsetTop + rects[3].top,
      copyTop = copy.offsetTop + rects[3].top;
    const total = root.scrollHeight - height,
      y = scrollY;
    const overlayOpen = dialogs.some((dialog) => dialog.open);

    // All mutations happen after the final layout read.
    style(
      progressBar,
      "transform",
      `scaleX(${total > 0 ? Math.min(1, y / total) : 0})`,
    );
    style(
      code,
      "--code-progress",
      ease(
        (height * 0.7 - rects[2].top) / (height * 0.7 + codeHeight * 0.45),
      ).toFixed(5),
    );
    for (const { card, center } of positions)
      style(
        card,
        "--album-position",
        (reduced
          ? 0
          : clamp((height * 0.5 - center) / (height * 0.85), -1, 1)
        ).toFixed(5),
      );
    for (const [index, section] of [sections[1], code].entries()) {
      style(
        section,
        "--title-enter",
        (reduced
          ? 1
          : ease((height * 0.95 - headingTops[index]) / (height * 0.65))
        ).toFixed(5),
      );
      style(
        section,
        "--title-drift",
        (reduced
          ? 0
          : clamp((height * 0.3 - headingTops[index]) / (height * 0.8))
        ).toFixed(5),
      );
    }
    style(
      about,
      "--portrait-enter",
      (reduced
        ? 1
        : ease((height * 0.95 - portraitTop) / (height * 0.7))
      ).toFixed(5),
    );
    style(
      about,
      "--about-enter",
      (reduced ? 1 : ease((height * 0.95 - copyTop) / (height * 0.7))).toFixed(
        5,
      ),
    );
    const progress = reduced
      ? 0
      : clamp(-rects[0].top / Math.max(1, heroHeight - height));
    style(hero, "--scene", progress.toFixed(5));
    style(hero, "--scene-zoom", ease((progress - 0.12) / 0.8).toFixed(5));
    style(hero, "--title-fade", (1 - ease(progress / 0.48)).toFixed(5));
    style(hero, "--title-shift", `${-progress * 110}px`);
    style(hero, "--tilt", `${-7 * (1 - ease(progress / 0.7))}deg`);
    style(hero, "--scene-exit", ease((progress - 0.56) / 0.36).toFixed(5));
    const label = String(Math.round(progress * 999)).padStart(3, "0");
    if (depth.textContent !== label) depth.textContent = label;
    for (let index = 1; index < sections.length; index++) {
      const rect = rects[index],
        section = sections[index];
      style(
        section,
        "--chapter-enter",
        (reduced ? 1 : ease((height - rect.top) / (height * 0.9))).toFixed(5),
      );
      style(
        section,
        "--chapter-travel",
        (reduced
          ? 0
          : clamp((height * 0.5 - rect.top) / Math.max(1, rect.height), -1, 1)
        ).toFixed(5),
      );
    }
    const current = overlayOpen
      ? "photography"
      : sections[
          rects.reduce(
            (last, rect, index) => (rect.top < height * 0.48 ? index : last),
            0,
          )
        ].id;
    if (current !== active) {
      active = current;
      root.dataset.chapter = current;
      for (const link of links) {
        const selected = link.hash === "#" + current;
        link.classList.toggle("active", selected);
        if (selected) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
    }
    root.classList.toggle(
      "hero-out-of-view",
      rects[0].bottom <= 0 || rects[0].top >= height,
    );
  }
  return {
    update,
    refreshCards() {
      cards = [...album.querySelectorAll<HTMLElement>(".scroll-album")];
    },
    configure(reduced: boolean) {
      code.classList.toggle(
        "pinned-code",
        !reduced && innerWidth >= 1050 && innerHeight >= 700,
      );
    },
    overlayOpen: () => dialogs.some((dialog) => dialog.open),
  };
}
