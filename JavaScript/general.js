// general.js
(() => {
  // 1) Page configuration
  const pages = [
    { key: 'gridStateFish_v8',  name: 'fish',      check: s => !!s && Object.values(s).every(x => x.hasFishbowl) },
    { key: 'fossilsAllDone',    name: 'fossils',   check: raw => raw === 'true' },
    { key: 'figurinesAllDone',  name: 'figurines', check: raw => raw === 'true' },
    { key: 'petsAllDone',       name: 'pets',      check: raw => raw === 'true' },
    { key: 'vanityAllDone',     name: 'vanity',    check: raw => raw === 'true' },
    { key: 'foodAllDone',       name: 'food',      check: raw => raw === 'true' },
    { key: 'gridStateBugs_v8',  name: 'bugs',      check: s => !!s && Object.values(s).every(x => x.hasJar) }
  ];

  // 2) Normalize href → bare page name
  function hrefToName(href) {
    return href
      .split('?')[0]
      .replace(/^\//, '')
      .replace(/\.html$/i, '')
      .toLowerCase();
  }

  // 3) Toggle logic
  function updateNavLinks() {
    const navLinks = Array.from(document.querySelectorAll('.navbar-links a'));
    pages.forEach(({ key, name, check }) => {
      const raw = localStorage.getItem(key);
      let done = false;

      if (raw && raw.trim().startsWith('{')) {
        try { done = check(JSON.parse(raw)); }
        catch { done = false; }
      } else {
        done = check(raw);
      }

      const link = navLinks.find(a =>
        hrefToName(a.getAttribute('href') || '') === name
      );
      if (link) link.classList.toggle('completed', done);
    });
  }

  // 4) Immediately hide the navbar
  const navbar = document.querySelector('.navbar');
  if (navbar) navbar.style.visibility = 'hidden';

  // 5) Prevent transition flash during initial update
  document.documentElement.classList.add('no-nav-transition');

  // 6) Run once synchronously before paint
  updateNavLinks();

  // 7) On DOMContentLoaded, finalize and show navbar
  document.addEventListener('DOMContentLoaded', () => {
    updateNavLinks();
    // remove the no-transition flag so future toggles animate normally
    document.documentElement.classList.remove('no-nav-transition');
    // show the navbar now that classes are correct
    if (navbar) navbar.style.visibility = '';
  });

  // 8) Re-run whenever localStorage is updated
  (function() {
    const orig = localStorage.setItem;
    localStorage.setItem = function(k, v) {
      orig.call(this, k, v);
      updateNavLinks();
    };
  })();
})();
