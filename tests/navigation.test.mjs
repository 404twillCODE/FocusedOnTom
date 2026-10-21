import test from 'node:test';
import assert from 'node:assert/strict';
import {connectNavigation} from '../new-site/navigation.js';

function setup(t, {mobile = true, touch = true} = {}) {
  const classes = new Set(['nav-compact']);
  const header = new EventTarget(), brand = new EventTarget(), menu = new EventTarget(), link = new EventTarget();
  const attrs = new Map(), page = new EventTarget(), window = new EventTarget();
  const breakpoint = Object.assign(new EventTarget(), {matches: mobile});
  header.classList = {
    contains: value => classes.has(value),
    add: value => classes.add(value),
    remove: value => classes.delete(value),
    toggle(value, enabled) { if (enabled) classes.add(value); else classes.delete(value); }
  };
  header.querySelector = selector => selector === '.brand' ? brand : menu;
  header.querySelectorAll = () => [brand, link];
  header.contains = target => [header, brand, menu, link].includes(target);
  menu.setAttribute = (name, value) => attrs.set(name, value);
  for (const [key, value] of Object.entries({
    document: page,
    addEventListener: window.addEventListener.bind(window),
    matchMedia: query => query.includes('max-width') ? breakpoint : {matches: touch}
  })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, {configurable: true, value});
    t.after(() => { if (original) Object.defineProperty(globalThis, key, original); else delete globalThis[key]; });
  }
  connectNavigation(header);
  return {classes, brand, menu, link, attrs, breakpoint, window};
}

test('mobile capsule tap restores the hamburger before opening the menu, even with hover support', t => {
  const state = setup(t, {touch: false});
  const tap = new Event('click', {cancelable: true});
  state.brand.dispatchEvent(tap);
  assert.equal(tap.defaultPrevented, true);
  assert.equal(state.classes.has('nav-expanded'), true);
  assert.equal(state.classes.has('menu-open'), false);
  state.menu.dispatchEvent(new Event('click'));
  assert.equal(state.classes.has('menu-open'), true);
  assert.equal(state.attrs.get('aria-expanded'), 'true');
  state.menu.dispatchEvent(new Event('click'));
  assert.equal(state.classes.has('nav-expanded'), true);
  assert.equal(state.attrs.get('aria-expanded'), 'false');
  assert.equal(state.attrs.get('aria-label'), 'Open navigation');
  state.link.dispatchEvent(new Event('click'));
  assert.equal(state.classes.has('nav-expanded'), false);
  state.brand.dispatchEvent(new Event('click', {cancelable: true}));
  assert.equal(state.classes.has('nav-expanded'), true);
});

test('Escape and viewport changes reset the mobile capsule and menu together', t => {
  const state = setup(t);
  state.menu.dispatchEvent(new Event('click'));
  const escape = Object.assign(new Event('keydown'), {key: 'Escape'});
  state.window.dispatchEvent(escape);
  assert.equal(state.classes.has('menu-open'), false);
  assert.equal(state.classes.has('nav-expanded'), false);
  state.menu.dispatchEvent(new Event('click'));
  state.breakpoint.dispatchEvent(new Event('change'));
  assert.equal(state.classes.has('menu-open'), false);
  assert.equal(state.attrs.get('aria-expanded'), 'false');
});

test('desktop brand retains its normal home link behavior', t => {
  const state = setup(t, {mobile: false, touch: false});
  const click = new Event('click', {cancelable: true});
  state.brand.dispatchEvent(click);
  assert.equal(click.defaultPrevented, false);
  assert.equal(state.classes.has('nav-expanded'), false);
});
