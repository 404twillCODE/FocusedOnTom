// Touch browsers can retain :hover after a tap; track capsule expansion explicitly.
export function connectNavigation(header) {
  const menu = header.querySelector('.menu-toggle');
  const mobile = matchMedia('(max-width: 760px)');
  const touch = matchMedia('(hover: none)');
  function setMenu(open) {
    header.classList.toggle('menu-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  }
  function close() {
    setMenu(false);
    header.classList.remove('nav-expanded');
  }
  menu.addEventListener('click', () => {
    header.classList.add('nav-expanded');
    setMenu(!header.classList.contains('menu-open'));
  });
  header.querySelector('.brand').addEventListener('click', event => {
    if ((mobile.matches || touch.matches) && header.classList.contains('nav-compact') &&
        !header.classList.contains('nav-expanded') && !header.classList.contains('menu-open')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      header.classList.add('nav-expanded');
      if (!mobile.matches) setMenu(true);
    }
  }, true);
  header.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
  document.addEventListener('pointerdown', event => { if (!header.contains(event.target)) close(); });
  header.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse' && !mobile.matches) close(); });
  addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  mobile.addEventListener('change', close);
}
