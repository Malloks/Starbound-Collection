// figurines.js
document.addEventListener('DOMContentLoaded', async () => {
  const normalGrid = document.getElementById('normal-grid');
  const bossGrid   = document.getElementById('boss-grid');
  const oreGrid    = document.getElementById('ore-grid');

  if (!normalGrid || !bossGrid || !oreGrid) {
    console.error('Error: Grids not found in the HTML');
    return;
  }

  // — Find the “Figurines” nav link by normalizing href —
  function hrefToName(href) {
    return href
      .split('?')[0]            // strip query
      .replace(/^\//, '')       // strip leading slash
      .replace(/\.html$/i, '')  // strip .html
      .toLowerCase();
  }
  const navLink = Array.from(document.querySelectorAll('.navbar-links a'))
    .find(a => hrefToName(a.getAttribute('href') || '') === 'figurines');

  // storage keys
  const normalStateKey = 'gridStateNormal';
  const bossStateKey   = 'gridStateBosses';
  const oreStateKey    = 'gridStateOres';

  const savedNormalState = JSON.parse(localStorage.getItem(normalStateKey)) || {};
  const savedBossState   = JSON.parse(localStorage.getItem(bossStateKey))   || {};
  const savedOreState    = JSON.parse(localStorage.getItem(oreStateKey))    || {};

  // 1) all-done checker
  function checkAllFigurines() {
    const allItems = [
      ...normalGrid.querySelectorAll('.grid-item'),
      ...bossGrid  .querySelectorAll('.grid-item'),
      ...oreGrid   .querySelectorAll('.grid-item')
    ];
    const allDone = allItems.length > 0
      && allItems.every(item => item.classList.contains('pedestal-added'));

    // persist flag
    localStorage.setItem('figurinesAllDone', allDone ? 'true' : 'false');
    // toggle nav link
    if (navLink) navLink.classList.toggle('completed', allDone);
  }

  // 2) grid-builder
  try {
    const [normalImages, bossImages, oreImages] = await Promise.all([
      fetch('/images?folder=Figurines/Normal').then(r => r.json()),
      fetch('/images?folder=Figurines/Bosses').then(r => r.json()),
      fetch('/images?folder=Figurines/Ores').then(r => r.json())
    ]);

    function createGridItems(images, grid, folderName, savedState, stateKey) {
      images.forEach((src, index) => {
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');
        gridItem.dataset.index = index;

        const img = document.createElement('img');
        img.src = src;
        img.alt = `${folderName} ${index + 1}`;

        const number = document.createElement('span');
        number.textContent = `${index + 1}`.padStart(2, '0');

        gridItem.append(img, number);
        // 1) Give every figurine img the base class so CSS can style it
        img.classList.add('set-image');

        // restore collected state
        if (savedState[index]?.pedestalAdded) {
          const pedestalImage = getPedestalImage(folderName);
          applyPedestalAnimation(
            gridItem, img, number,
            false,
            savedState[index].pedestalPosition,
            pedestalImage
          );
          // gray it out by toggling the CSS class
          img.classList.add('grayscale');
        }

        gridItem.addEventListener('click', () => {
          if (gridItem._clickLock) return;
          gridItem._clickLock = true;
          setTimeout(() => { gridItem._clickLock = false; }, 500);

          const pedestalImage = getPedestalImage(folderName);
          if (gridItem.classList.contains('pedestal-added')) {
            // remove pedestal
            removePedestalAnimation(gridItem, img, number);
            // take off the gray class → back to colored + drop-shadow
            img.classList.remove('grayscale');
            savedState[index] = { pedestalAdded: false, pedestalPosition: null };
          } else {
            // add pedestal
            applyPedestalAnimation(gridItem, img, number, true, null, pedestalImage);
            // gray out the figurine
            img.classList.add('grayscale');
            const pedestalPosition = -(60 - img.offsetTop);
            savedState[index] = { pedestalAdded: true, pedestalPosition };
          }

          localStorage.setItem(stateKey, JSON.stringify(savedState));
          checkAllFigurines();
        });

        // append
        if (folderName === 'Bosses') {
          bossGrid.appendChild(gridItem);
        } else if (folderName === 'Ores') {
          oreGrid.appendChild(gridItem);
        } else {
          normalGrid.appendChild(gridItem);
        }
      });
    }

    createGridItems(normalImages, normalGrid, 'Normal', savedNormalState, normalStateKey);
    createGridItems(bossImages,   bossGrid,   'Bosses', savedBossState,   bossStateKey);
    createGridItems(oreImages,    oreGrid,    'Ores',    savedOreState,    oreStateKey);

    // initial check once DOM is built
    checkAllFigurines();

  } catch (error) {
    console.error('Failed to fetch images:', error);
  }
});

// helper functions (getPedestalImage, applyPedestalAnimation, removePedestalAnimation)
// remain exactly as you have them.

// (the rest of your helper functions — getPedestalImage, applyPedestalAnimation, removePedestalAnimation — remain unchanged)

function getPedestalImage(folderName) {
  if (folderName === 'Ores')    return 'Images/Misc/OrePedistal.png';
  if (folderName === 'Bosses')  return 'Images/Misc/BossPedistal.png';
  return 'Images/Misc/Pedistal.png';
}

function applyPedestalAnimation(gridItem, img, number, animate = true, savedPedestalPosition = null, pedestalImage) {
  const pedestal = document.createElement('img');
  pedestal.src = pedestalImage;
  pedestal.alt = 'Pedestal';
  Object.assign(pedestal.style, {
    position:   'absolute',
    zIndex:     '0',
    left:       '50%',
    transform:  'translateX(-50%)',
    filter:     `drop-shadow(5px 5px 5px #1a1a1a) grayscale(100%)`,
    transition: animate ? 'bottom 1s ease-in' : 'none'
  });

  gridItem.style.position = 'relative';
  const startBottom = -80;
  const stopBottom  = savedPedestalPosition != null
                     ? savedPedestalPosition
                     : -(60 - img.offsetTop);

  pedestal.style.bottom = `${startBottom}px`;
  gridItem.appendChild(pedestal);
  gridItem.classList.add('pedestal-added');

  // drop pedestal
  setTimeout(() => pedestal.style.bottom = `${stopBottom}px`, 50);

  // inject shake keyframes once
  if (!document.getElementById('shake-keyframes')) {
    const style = document.createElement('style');
    style.id = 'shake-keyframes';
    style.textContent = `
      @keyframes shake {
        0%   { transform: translateX(-50%) translateX(0); }
        25%  { transform: translateX(-50%) translateX(-1px); }
        50%  { transform: translateX(-50%) translateX(1px); }
        75%  { transform: translateX(-50%) translateX(-1px); }
        100% { transform: translateX(-50%) translateX(0); }
      }
    `;
    document.head.appendChild(style);
  }

  // shake after landing
  setTimeout(() => {
    pedestal.style.animation = 'shake 0.5s ease forwards';
  }, 1050);
}

function removePedestalAnimation(gridItem, img, number) {
  const pedestal = gridItem.querySelector('img[alt="Pedestal"]');
  if (pedestal) {
    const imgBottom       = img.offsetTop + img.offsetHeight;
    const offscreenBottom = -(imgBottom + 50);
    pedestal.style.transition = 'bottom 1s ease-in';
    pedestal.style.bottom     = `${offscreenBottom}px`;
    setTimeout(() => pedestal.remove(), 1000);
  }

  // fade back to color by removing the class; CSS handles the rest
  img.classList.remove('grayscale');

  gridItem.classList.remove('pedestal-added');
}