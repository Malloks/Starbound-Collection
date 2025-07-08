// general.js
document.addEventListener('DOMContentLoaded', () => {
  // — Fish link —
  const fishState     = JSON.parse(localStorage.getItem('gridStateFish_v8')) || {};
  const fishAllCaught = Object.values(fishState).length > 0
    && Object.values(fishState).every(s => s.hasFishbowl);
  const fishLink = document.querySelector('.navbar-links a[href$="fish.html"]');
  console.log('🐠 fishAllCaught:', fishAllCaught, 'fishLink:', !!fishLink);
  if (fishLink) fishLink.classList.toggle('completed', fishAllCaught);

  // — Fossils link —
  const fossilAllDone = localStorage.getItem('fossilsAllDone') === 'true';
  const fossilLink    = document.querySelector('.navbar-links a[href$="fossils.html"]');
  console.log('🦴 fossilAllDone:', fossilAllDone, 'fossilLink:', !!fossilLink);
  if (fossilLink) fossilLink.classList.toggle('completed', fossilAllDone);

  // — Figurines link —
  const figurinesAllDone = localStorage.getItem('figurinesAllDone') === 'true';
  const figurinesLink    = document.querySelector('.navbar-links a[href$="figurines.html"]');
  console.log('🎎 figurinesAllDone:', figurinesAllDone, 'figurinesLink:', !!figurinesLink);
  if (figurinesLink) figurinesLink.classList.toggle('completed', figurinesAllDone);

  // — Pets link —
  const petsAllDone = localStorage.getItem('petsAllDone') === 'true';
  const petsLink    = document.querySelector('.navbar-links a[href$="pets.html"]');
  console.log('🐾 petsAllDone:', petsAllDone, 'petsLink:', !!petsLink);
  if (petsLink) petsLink.classList.toggle('completed', petsAllDone);

  // — Vanity link —
  const vanityAllDone = localStorage.getItem('vanityAllDone') === 'true';
  const vanityLink    = document.querySelector('.navbar-links a[href$="vanity.html"]');
  if (vanityLink) vanityLink.classList.toggle('completed', vanityAllDone);
});
