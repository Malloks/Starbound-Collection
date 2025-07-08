// pets.js
document.addEventListener('DOMContentLoaded', async () => {
  const normalPetsGrid = document.getElementById('regular-grid');
  const rarePetsGrid   = document.getElementById('rare-grid');

  if (!normalPetsGrid || !rarePetsGrid) {
    console.error('Error: One or more grids not found');
    return;
  }

  // — Pets nav-link for “all done” glow —
  const petsLink = document.querySelector('.navbar-links a[href$="pets.html"]');
  console.log('🐾 petsLink found?', !!petsLink);

  // Helper: check every .grid-item in both grids for .capture-pod
  function checkAllPets() {
    const allItems = [
      ...normalPetsGrid.querySelectorAll('.grid-item'),
      ...rarePetsGrid  .querySelectorAll('.grid-item')
    ];
    const doneCount = allItems.filter(item => item.classList.contains('capture-pod')).length;
    const allDone   = allItems.length > 0 && doneCount === allItems.length;

    console.log('🐾 checkAllPets:', { total: allItems.length, doneCount, allDone });
    localStorage.setItem('petsAllDone', allDone ? 'true' : 'false');
    if (petsLink) petsLink.classList.toggle('completed', allDone);
  }

  const normalPetsKey = 'normalPetsState';
  const rarePetsKey   = 'rarePetsState';
  const savedNormalPetsState = JSON.parse(localStorage.getItem(normalPetsKey)) || {};
  const savedRarePetsState   = JSON.parse(localStorage.getItem(rarePetsKey))   || {};

  try {
    const [normalPetsImages, rarePetsImages] = await Promise.all([
      fetch('/images?folder=Pets/Regular').then(r => r.json()),
      fetch('/images?folder=Pets/Rare')   .then(r => r.json())
    ]);

    function createGridItems(images, grid, savedState, stateKey) {
      images.forEach((src, index) => {
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');
        gridItem.dataset.index = index;
        gridItem.style.position = 'relative';

        gridItem._isAnimating = false;
        gridItem._hovering    = false;

        const img = document.createElement('img');
        img.src = src;
        img.alt = `Pet ${index + 1}`;

        const number = document.createElement('span');
        number.textContent = `${index + 1}`.padStart(2, '0');

        gridItem.append(img, number);
        grid.appendChild(gridItem);

        // Restore captured state
        if (savedState[index]?.capturePod) {
          img.style.transform    = 'scale(0.5)';
          img.style.borderRadius = '50%';
          img.style.opacity      = '0';
          img.style.transition   = 'none';

          const pod = document.createElement('img');
          pod.src = 'Images/Misc/Capture_Pod.png';
          pod.alt = 'Capture Pod';
          pod.classList.add('capture-pod-image');
          gridItem.appendChild(pod);
          gridItem.classList.add('capture-pod');
        }

        // Hover handlers (unchanged) …
        gridItem.addEventListener('mouseenter', () => {
          gridItem._hovering = true;
          if (gridItem.classList.contains('capture-pod') && !gridItem._isAnimating) {
            const overlay = document.createElement('img');
            overlay.src = src;
            overlay.alt = 'Pet Preview';
            overlay.classList.add('hover-overlay');
            gridItem.appendChild(overlay);
            gridItem._hoverOverlay = overlay;
          }
        });
        gridItem.addEventListener('mouseleave', () => {
          gridItem._hovering = false;
          if (gridItem._hoverOverlay) {
            gridItem._hoverOverlay.remove();
            delete gridItem._hoverOverlay;
          }
        });

        // Click to toggle capture + preview
        gridItem.addEventListener('click', () => {
          if (gridItem._isAnimating) return;
          gridItem._isAnimating = true;

          if (gridItem._hoverOverlay) {
            gridItem._hoverOverlay.remove();
            delete gridItem._hoverOverlay;
          }

          const origFilter = gridItem.style.filter;
          gridItem.style.filter = 'none';

          const hasPod = gridItem.classList.contains('capture-pod');
          const animImg = document.createElement('img');
          const duration = 1000, filterDur = duration, morphDur = 500;

          Object.assign(animImg.style, {
            position: 'absolute', left: '10%', top: '10%',
            width: '80%', height: '80%', pointerEvents: 'none',
            zIndex: 0, imageRendering: 'pixelated',
            filter: 'none', boxShadow: 'none'
          });
          animImg.classList.add('capture-anim-img');

          if (!hasPod) {
            // ▶ forward
            animImg.src = `Images/Animation/CaptureAnim.webp?reload=${Date.now()}`;
            gridItem.appendChild(animImg);

            img.style.position   = 'relative';
            img.style.zIndex     = 1;
            img.style.transition = [
              `transform ${morphDur}ms ease`,
              `border-radius ${morphDur}ms ease`,
              `filter ${filterDur}ms ease`
            ].join(',');
            img.style.transform    = 'scale(0.5)';
            img.style.borderRadius = '50%';
            img.style.filter       = 'saturate(0%) brightness(5000%)';

            setTimeout(() => {
              // finalize capture
              img.style.opacity = 0;
              const pod = document.createElement('img');
              pod.src = 'Images/Misc/Capture_Pod.png';
              pod.alt = 'Capture Pod';
              pod.classList.add('capture-pod-image');
              gridItem.appendChild(pod);
              gridItem.classList.add('capture-pod');

              if (gridItem._hovering) {
                const overlay = document.createElement('img');
                overlay.src = src;
                overlay.alt = 'Pet Preview';
                overlay.classList.add('hover-overlay');
                gridItem.appendChild(overlay);
                gridItem._hoverOverlay = overlay;
              }

              animImg.remove();
              savedState[index] = { capturePod: true };
              localStorage.setItem(stateKey, JSON.stringify(savedState));

              gridItem.style.filter = origFilter;
              gridItem._isAnimating = false;

              // ← call here after every state change
              checkAllPets();
            }, duration);

          } else {
            // ◀ reverse
            const pod = gridItem.querySelector('.capture-pod-image');
            if (pod) pod.remove();
            gridItem.classList.remove('capture-pod');

            animImg.src = `Images/Animation/CaptureAnimR.webp?reload=${Date.now()}`;
            gridItem.appendChild(animImg);

            img.style.position   = 'relative';
            img.style.zIndex     = 1;
            img.style.opacity    = 1;
            img.style.transition = [
              `transform ${morphDur}ms ease`,
              `border-radius ${morphDur}ms ease`,
              `filter ${filterDur}ms ease`
            ].join(',');
            img.style.transform    = 'scale(1)';
            img.style.borderRadius = '0%';
            img.style.filter       = 'saturate(0%) brightness(5000%)';

            setTimeout(() => {
              img.style.filter = '';
              animImg.remove();
              savedState[index] = { capturePod: false };
              localStorage.setItem(stateKey, JSON.stringify(savedState));

              gridItem.style.filter = origFilter;
              gridItem._isAnimating = false;

              // ← call here after every state change
              checkAllPets();
            }, duration);
          }
        });
      });
    }

    createGridItems(normalPetsImages, normalPetsGrid, savedNormalPetsState, normalPetsKey);
    createGridItems(rarePetsImages,   rarePetsGrid,   savedRarePetsState,   rarePetsKey);

    // ← initial check once all items are rendered/restored
    checkAllPets();
  } catch (e) {
    console.error('Failed to load pets:', e);
  }
});
