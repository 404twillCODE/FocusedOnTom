const $ = selector => document.querySelector(selector);
const filters = $('.mod-filters');
if (filters) {
  filters.hidden = false;
  filters.addEventListener('submit', event => event.preventDefault());
  let category = 'all';
  function filterMods() {
    const query = $('#mod-search').value.trim().toLowerCase();
    let count = 0;
    document.querySelectorAll('[data-mod-card]').forEach(card => {
      const visible = (category === 'all' || card.dataset.category === category) && card.dataset.search.toLowerCase().includes(query);
      card.hidden = !visible;
      if (visible) count++;
    });
    $('#mod-count').textContent = `${count} ${count === 1 ? 'mod' : 'mods'} to explore`;
    $('#no-mods').hidden = count !== 0;
  }
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    filterMods();
  }));
  $('#mod-search').addEventListener('input', filterMods);
}
const recipeSearch = $('#recipe-search');
if (recipeSearch) {
  recipeSearch.closest('label').hidden = false;
  recipeSearch.addEventListener('input', () => {
    const query = recipeSearch.value.trim().toLowerCase();
    let count = 0;
    document.querySelectorAll('[data-recipe]').forEach(recipe => {
      recipe.hidden = !recipe.dataset.search.toLowerCase().includes(query);
      if (!recipe.hidden) count++;
    });
    $('#no-recipes').hidden = count !== 0;
  });
}
document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
  const status = $('.copy-status');
  try {
    await navigator.clipboard.writeText(button.dataset.copy);
    status.textContent = 'Command copied. Paste it into Minecraft chat.';
  } catch {
    status.textContent = 'Copy was unavailable. Select the command text and copy it manually.';
  }
}));
const wikiLinks = [...document.querySelectorAll('.wiki-sidebar nav a')];
if(wikiLinks.length&&'IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
 document.body.classList.add('wiki-animated');
 const reveal=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-revealed');reveal.unobserve(entry.target)}},{rootMargin:'0px 0px 60px 0px',threshold:0});
 document.querySelectorAll('.wiki-section>h2,.wiki-section>.eyebrow,.recipe,.steps,.table-wrap,.faq,.command-row').forEach(el=>{el.classList.add('reveal-section');reveal.observe(el)});
}
if (wikiLinks.length && 'IntersectionObserver' in window) {
  const sections = new Map();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => sections.set(entry.target.id, entry.isIntersecting));
    const active = wikiLinks.find(link => sections.get(link.hash.slice(1)));
    if (active) wikiLinks.forEach(link => {
      if (link === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, {rootMargin: '-100px 0px -55% 0px', threshold: 0});
  document.querySelectorAll('.wiki-section[id]').forEach(section => observer.observe(section));
}
