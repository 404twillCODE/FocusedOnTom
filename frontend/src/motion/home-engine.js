export function startHomeEngine() {
  const stop = [];
  function listen(target, type, listener, options) {
    target.addEventListener(type, listener, options);
    stop.push(() => target.removeEventListener(type, listener, options));
  }
  const hero = document.querySelector(".hero");
  const canvas = document.querySelector("#ambient-field");
  const ctx = canvas.getContext("2d");
  const clamp = (value, min = 0, max = 1) =>
    Math.min(max, Math.max(min, value));
  const ease = (value) => {
    const t = clamp(value);
    return t * t * (3 - 2 * t);
  };
  let width = innerWidth,
    height = innerHeight,
    dpr = Math.min(devicePixelRatio || 1, 1.5);
  let dirty = true,
    previous = 0,
    frame = 0,
    pointerX = innerWidth / 2,
    pointerY = innerHeight / 2;
  let particles = [],
    meteor = null,
    nextMeteor = 0;
  const still = () =>
    document.documentElement.classList.contains("motion-off") ||
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = () => innerWidth <= 760;
  function sizeCanvas() {
    width = innerWidth;
    height = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    particles = Array.from({ length: mobile() ? 95 : 210 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.05 + 0.25,
      v: 0.035 + Math.random() * 0.065,
      phase: i * 1.7,
      warm: i % 7 === 0,
      spark: i % 29 === 0,
    }));
    meteor = null;
    dirty = true;
  }
  sizeCanvas();
  function updateScenes() {
    dirty = false;
    const reduced = still(),
      heroRect = hero.getBoundingClientRect();
    const codeScene = document.getElementById("projects");
    codeScene.classList.toggle(
      "pinned-code",
      !reduced && innerWidth >= 1050 && innerHeight >= 700,
    );
    const codeProgress = clamp(
      (innerHeight * 0.7 - codeScene.getBoundingClientRect().top) /
        (innerHeight * 0.7 + codeScene.offsetHeight * 0.45),
    );
    codeScene.style.setProperty(
      "--code-progress",
      ease(codeProgress).toFixed(5),
    );
    const albumGrid = document.getElementById("collection-grid");
    const albumGridTop = albumGrid.getBoundingClientRect().top;
    const albumPositions = [...albumGrid.querySelectorAll(".scroll-album")].map(
      (card) => {
        // Measure the layout position so the animated tilt cannot feed back into it.
        const center = albumGridTop + card.offsetTop + card.offsetHeight * 0.5;
        return [
          card,
          reduced
            ? 0
            : clamp((innerHeight * 0.5 - center) / (innerHeight * 0.85), -1, 1),
        ];
      },
    );
    for (const [card, position] of albumPositions)
      card.style.setProperty("--album-position", position.toFixed(5));
    for (const id of ["photography", "projects"]) {
      const section = document.getElementById(id),
        heading = section.querySelector(".section-heading");
      const top = heading.getBoundingClientRect().top;
      section.style.setProperty(
        "--title-enter",
        (reduced
          ? 1
          : ease((innerHeight * 0.95 - top) / (innerHeight * 0.65))
        ).toFixed(5),
      );
      section.style.setProperty(
        "--title-drift",
        (reduced
          ? 0
          : clamp((innerHeight * 0.3 - top) / (innerHeight * 0.8))
        ).toFixed(5),
      );
    }
    const about = document.getElementById("about");
    const portraitTop =
      about.querySelector(".portrait").offsetTop +
      about.getBoundingClientRect().top;
    const copyTop =
      about.querySelector(".about-copy").offsetTop +
      about.getBoundingClientRect().top;
    about.style.setProperty(
      "--portrait-enter",
      (reduced
        ? 1
        : ease((innerHeight * 0.95 - portraitTop) / (innerHeight * 0.7))
      ).toFixed(5),
    );
    about.style.setProperty(
      "--about-enter",
      (reduced
        ? 1
        : ease((innerHeight * 0.95 - copyTop) / (innerHeight * 0.7))
      ).toFixed(5),
    );
    const progress = reduced
      ? 0
      : clamp(-heroRect.top / Math.max(1, hero.offsetHeight - innerHeight));
    hero.style.setProperty("--scene", progress.toFixed(5));
    hero.style.setProperty(
      "--scene-zoom",
      ease((progress - 0.12) / 0.8).toFixed(5),
    );
    hero.style.setProperty(
      "--title-fade",
      (1 - ease(progress / 0.48)).toFixed(5),
    );
    hero.style.setProperty("--title-shift", `${-progress * 110}px`);
    hero.style.setProperty("--tilt", `${-7 * (1 - ease(progress / 0.7))}deg`);
    hero.style.setProperty(
      "--scene-exit",
      ease((progress - 0.56) / 0.36).toFixed(5),
    );
    document.querySelector("#depth-value").textContent = String(
      Math.round(progress * 999),
    ).padStart(3, "0");
    for (const id of ["photography", "projects", "about", "contact"]) {
      const section = document.getElementById(id),
        rect = section.getBoundingClientRect();
      const enter = reduced
        ? 1
        : ease((innerHeight - rect.top) / (innerHeight * 0.9));
      const travel = reduced
        ? 0
        : clamp(
            (innerHeight * 0.5 - rect.top) / Math.max(1, rect.height),
            -1,
            1,
          );
      section.style.setProperty("--chapter-enter", enter.toFixed(5));
      section.style.setProperty("--chapter-travel", travel.toFixed(5));
    }
    let active = "home";
    for (const id of ["home", "photography", "projects", "about", "contact"]) {
      if (
        document.getElementById(id).getBoundingClientRect().top <
        innerHeight * 0.48
      )
        active = id;
    }
    if (document.querySelector("#viewer[open],#gallery-dialog[open]"))
      active = "photography";
    if (document.documentElement.dataset.chapter !== active)
      document.documentElement.dataset.chapter = active;
    document.querySelectorAll(".chapter-nav a").forEach((link) => {
      const current = link.hash === "#" + active;
      link.classList.toggle("active", current);
      if (current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
  function drawAmbient(time, delta, animate = true) {
    ctx.clearRect(0, 0, width, height);
    const mx = animate ? (pointerX / width - 0.5) * 5 : 0,
      my = animate ? (pointerY / height - 0.5) * 5 : 0;
    for (const point of particles) {
      point.y -= (point.v * delta) / 16.67;
      if (point.y < -5) {
        point.y = height + 5;
        point.x = Math.random() * width;
      }
      const alpha = 0.16 + (Math.sin(time * 0.0007 + point.phase) + 1) * 0.2;
      ctx.fillStyle = `rgba(${point.warm ? "255,164,118" : "175,218,242"},${alpha})`;
      ctx.beginPath();
      ctx.arc(point.x + mx, point.y + my, point.r, 0, Math.PI * 2);
      ctx.fill();
      if (point.spark) {
        const shimmer = Math.max(0, Math.sin(time * 0.0008 + point.phase));
        ctx.strokeStyle = `rgba(190,225,248,${shimmer * 0.24})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(point.x + mx - 3, point.y + my);
        ctx.lineTo(point.x + mx + 3, point.y + my);
        ctx.moveTo(point.x + mx, point.y + my - 3);
        ctx.lineTo(point.x + mx, point.y + my + 3);
        ctx.stroke();
      }
    }
    if (!animate) return;
    if (!nextMeteor) nextMeteor = time + 2300;
    if (!meteor && time >= nextMeteor) {
      const direction = Math.random() < 0.78 ? -1 : 1;
      meteor = {
        start: time,
        x:
          width *
          (direction < 0
            ? 0.35 + Math.random() * 0.6
            : 0.05 + Math.random() * 0.5),
        y: height * (0.04 + Math.random() * 0.45),
        direction,
        duration: 1450 + Math.random() * 650,
      };
      nextMeteor = time + 4000 + Math.random() * 3500;
    }
    if (meteor) {
      const progress = (time - meteor.start) / meteor.duration;
      if (progress >= 1) {
        meteor = null;
        return;
      }
      const distance = progress * Math.min(width * 0.5, 520),
        x = meteor.x + meteor.direction * distance,
        y = meteor.y + distance * 0.55;
      const tail = Math.min(mobile() ? 95 : 165, distance),
        fade = Math.sin(progress * Math.PI);
      const tx = x - meteor.direction * tail,
        ty = y - tail * 0.55;
      const length = Math.hypot(x - tx, y - ty) || 1,
        nx = -(y - ty) / length,
        ny = (x - tx) / length;
      const gradient = ctx.createLinearGradient(x, y, tx, ty);
      gradient.addColorStop(0, `rgba(235,248,255,${fade * 0.9})`);
      gradient.addColorStop(0.14, `rgba(162,219,255,${fade * 0.65})`);
      gradient.addColorStop(0.55, `rgba(113,180,229,${fade * 0.2})`);
      gradient.addColorStop(1, "rgba(113,180,229,0)");
      // A widening shoulder and tapered tip give the trail a comet silhouette.
      ctx.fillStyle = gradient;
      ctx.shadowColor = `rgba(141,205,255,${fade * 0.45})`;
      ctx.shadowBlur = 7;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(
        x - (x - tx) * 0.23 + nx * 2.3,
        y - (y - ty) * 0.23 + ny * 2.3,
        x + nx * 0.8,
        y + ny * 0.8,
      );
      ctx.lineTo(x - nx * 0.8, y - ny * 0.8);
      ctx.quadraticCurveTo(
        x - (x - tx) * 0.23 - nx * 2.3,
        y - (y - ty) * 0.23 - ny * 2.3,
        tx,
        ty,
      );
      ctx.fill();
      ctx.shadowBlur = 0;
      const halo = ctx.createRadialGradient(x, y, 0, x, y, 8);
      halo.addColorStop(0, `rgba(247,252,255,${fade * 0.65})`);
      halo.addColorStop(0.25, `rgba(167,220,255,${fade * 0.3})`);
      halo.addColorStop(1, "rgba(133,202,255,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,240,223,${fade})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.25, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 1; i <= 3; i++) {
        const behind = 9 + i * 13,
          sparkle = fade * (0.12 + 0.12 * Math.sin(time * 0.013 + i * 2));
        if (behind > distance) continue;
        ctx.fillStyle = `rgba(199,228,255,${sparkle})`;
        ctx.beginPath();
        ctx.arc(
          x - meteor.direction * behind + nx * Math.sin(i * 2) * 3,
          y - behind * 0.55 + ny * Math.sin(i * 2) * 3,
          0.65,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
  }
  function tick(time) {
    frame = 0;
    if (document.hidden) return;
    if (dirty) updateScenes();
    const reduced = still(),
      delta = Math.min(50, time - previous || 16.67);
    if (!reduced && time - previous > 32) {
      drawAmbient(time, delta);
      previous = time;
    }
    if (!reduced) frame = requestAnimationFrame(tick);
    else drawAmbient(0, 0, false);
  }
  function requestFrame() {
    dirty = true;
    if (!frame) frame = requestAnimationFrame(tick);
  }
  listen(window, "scroll", requestFrame, { passive: true });
  listen(window, "resize", () => {
    sizeCanvas();
    requestFrame();
  });
  listen(window, "portfolio:motion", requestFrame);
  listen(window, "portfolio:collections", requestFrame);
  listen(document, "visibilitychange", () => {
    if (!document.hidden) requestFrame();
    else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  });
  // Native SVG cursors follow the device directly: no DOM cursor and no tracking delay.
  listen(
    document,
    "pointermove",
    (event) => {
      if (event.pointerType === "mouse") {
        pointerX = event.clientX;
        pointerY = event.clientY;
      }
    },
    { passive: true },
  );
  const dialogObserver = new MutationObserver(requestFrame);
  document.querySelectorAll("dialog").forEach((dialog) =>
    dialogObserver.observe(dialog, {
      attributes: true,
      attributeFilter: ["open"],
    }),
  );
  requestFrame();

  return () => {
    stop.forEach((dispose) => dispose());
    cancelAnimationFrame(frame);
    dialogObserver.disconnect();
  };
}
