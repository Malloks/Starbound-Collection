// pets.js
// pets.js
document.addEventListener('DOMContentLoaded', async () => {
  const normalGrid = document.getElementById('normal-grid');
  const bossGrid   = document.getElementById('boss-grid');
  const oreGrid    = document.getElementById('ore-grid');

  if (!normalGrid || !bossGrid || !oreGrid) {
    console.error('Error: Grids not found in the HTML');
    return;
  }

  // Nav-link we’ll toggle when everything’s collected:
  const navLink = document.querySelector('.navbar-links a[href$="figurines.html"]');

  // storage keys
  const normalStateKey = 'gridStateNormal';
  const bossStateKey   = 'gridStateBosses';
  const oreStateKey    = 'gridStateOres';

  const savedNormalState = JSON.parse(localStorage.getItem(normalStateKey)) || {};
  const savedBossState   = JSON.parse(localStorage.getItem(bossStateKey))   || {};
  const savedOreState    = JSON.parse(localStorage.getItem(oreStateKey))    || {};

  // ── 1) all-done checker ─────────────────────────────────
  function checkAllFigurines() {
    const allItems = [
      ...normalGrid.querySelectorAll('.grid-item'),
      ...bossGrid  .querySelectorAll('.grid-item'),
      ...oreGrid   .querySelectorAll('.grid-item')
    ];
    const allDone = allItems.length > 0
      && allItems.every(item => item.classList.contains('pedestal-added'));

    localStorage.setItem('figurinesAllDone', allDone ? 'true' : 'false');
    if (navLink) navLink.classList.toggle('completed', allDone);
  }

  // ── 2) grid-builder ────────────────────────────────────
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

        gridItem.appendChild(img);
        gridItem.appendChild(number);

        // restore “collected” state:
        if (savedState[index]?.pedestalAdded) {
          const pedestalImage = getPedestalImage(folderName);
          applyPedestalAnimation(gridItem, img, number, false,
                                 savedState[index].pedestalPosition,
                                 pedestalImage);
          requestAnimationFrame(() => {
            img.style.transition = 'filter 1s ease';
            img.style.filter     = 'grayscale(100%)';
          });
        }

        gridItem.addEventListener('click', function () {
          if (this._clickLock) return;
          this._clickLock = true;
          setTimeout(() => { this._clickLock = false; }, 500);

          const pedestalImage = getPedestalImage(folderName);
          if (this.classList.contains('pedestal-added')) {
            removePedestalAnimation(this, img, number);
            savedState[index] = { pedestalAdded: false, pedestalPosition: null };
          } else {
            applyPedestalAnimation(this, img, number, true, null, pedestalImage);
            const pedestalPosition = -(60 - img.offsetTop);
            savedState[index] = { pedestalAdded: true, pedestalPosition };
          }

          localStorage.setItem(stateKey, JSON.stringify(savedState));
          checkAllFigurines();     // ←── call after each state change
        });

        // append to correct grid
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

    checkAllFigurines(); // ←── initial check once all items are in the DOM
  } catch (error) {
    console.error('Failed to fetch images:', error);
  }
});

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
    zIndex:     '-1',
    left:       '50%',
    transform:  'translateX(-50%)',
    filter:     'grayscale(100%)',
    transition: animate ? 'bottom 1s ease' : 'none'
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

  // only fade image when animate===true
  if (animate) {
    img.style.transition = 'filter 1s ease';
    img.style.filter     = 'grayscale(100%)';
  }

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
    pedestal.style.transition = 'bottom 1s ease';
    pedestal.style.bottom     = `${offscreenBottom}px`;
    setTimeout(() => pedestal.remove(), 1000);
  }

  // fade back to color
  img.style.transition = 'filter 1s ease';
  img.style.filter     = 'none';

  gridItem.classList.remove('pedestal-added');
}
