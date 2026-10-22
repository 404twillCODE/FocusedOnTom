import { useEffect, useRef, useState, type MouseEvent } from "react";

export default function SiteHeader({ home = false }: { home?: boolean }) {
  const header = useRef<HTMLElement>(null);
  const [scroll, setScroll] = useState({ compact: false, scrolled: false });
  const [expanded, setExpanded] = useState(false),
    [open, setOpen] = useState(false);
  const close = () => {
    setExpanded(false);
    setOpen(false);
  };
  useEffect(() => {
    const update = () =>
      setScroll((current) => {
        const compact = scrollY > 160,
          scrolled = scrollY > 30;
        return current.compact === compact && current.scrolled === scrolled
          ? current
          : { compact, scrolled };
      });
    update();
    const outside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) close();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const mobile = matchMedia("(max-width: 760px)");
    addEventListener("scroll", update, { passive: true });
    document.addEventListener("pointerdown", outside);
    addEventListener("keydown", escape);
    mobile.addEventListener("change", close);
    return () => {
      removeEventListener("scroll", update);
      document.removeEventListener("pointerdown", outside);
      removeEventListener("keydown", escape);
      mobile.removeEventListener("change", close);
    };
  }, []);
  function brandClick(event: MouseEvent) {
    const mobile = matchMedia("(max-width: 760px)").matches;
    if (
      (mobile || matchMedia("(hover: none)").matches) &&
      scroll.compact &&
      !expanded &&
      !open
    ) {
      event.preventDefault();
      setExpanded(true);
      if (!mobile) setOpen(true);
    } else close();
  }
  const prefix = home ? "" : "/";
  return (
    <header
      ref={header}
      className={[
        "site-header",
        scroll.compact && "nav-compact",
        scroll.scrolled && "scrolled",
        expanded && "nav-expanded",
        open && "menu-open",
      ]
        .filter(Boolean)
        .join(" ")}
      onPointerLeave={(event) => {
        if (
          event.pointerType === "mouse" &&
          !matchMedia("(max-width: 760px)").matches
        )
          close();
      }}
    >
      <a
        className="brand"
        href={prefix + "#home"}
        aria-label="Focused on Tom home"
        onClick={brandClick}
      >
        <span className="brand-mark" aria-hidden="true">
          <img
            src="/assets/brand/focused-on-tom.svg"
            alt=""
            width="36"
            height="36"
          />
        </span>
        <span>
          focused on tom<span className="brand-period">.</span>
        </span>
      </a>
      <nav aria-label="Main navigation" id="navigation">
        {[
          ["photography", "Photography", "01"],
          ["projects", "Code", "02"],
          ["about", "About", "03"],
        ].map(([id, label, index]) => (
          <a key={id} href={prefix + "#" + id} onClick={close}>
            {label} <sup>{index}</sup>
          </a>
        ))}
        <a
          className="mobile-contact-link"
          href={prefix + "#contact"}
          onClick={close}
        >
          Let’s work together ↗
        </a>
      </nav>
      <a className="header-contact" href={prefix + "#contact"} onClick={close}>
        Let’s work together <span>↗</span>
      </a>
      <button
        className="menu-toggle"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls="navigation"
        onClick={() => {
          setExpanded(true);
          setOpen((value) => !value);
        }}
      >
        <span />
        <span />
      </button>
    </header>
  );
}
