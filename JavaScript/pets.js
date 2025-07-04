// pets.js
document.addEventListener('DOMContentLoaded', async () => {
  const normalPetsGrid = document.getElementById('regular-grid');
  const rarePetsGrid   = document.getElementById('rare-grid');

  if (!normalPetsGrid || !rarePetsGrid) {
    console.error('Error: One or more grids not found');
    return;
  }

  const normalPetsKey = 'normalPetsState';
  const rarePetsKey   = 'rarePetsState';
  const savedNormalPetsState = JSON.parse(localStorage.getItem(normalPetsKey)) || {};
  const savedRarePetsState   = JSON.parse(localStorage.getItem(rarePetsKey))   || {};

  try {
    const [normalPetsImages, rarePetsImages] = await Promise.all([
      fetch('/images?folder=Pets/Regular').then(r => r.json()),
      fetch('/images?folder=Pets/Rare').then(r => r.json())
    ]);

    function createGridItems(images, grid, savedState, stateKey) {
      images.forEach((src, index) => {
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');
        gridItem.dataset.index = index;
        gridItem.style.position = 'relative';
        gridItem._isAnimating = false; // click-lock flag

        const img = document.createElement('img');
        img.src = src;
        img.alt = `Pet ${index + 1}`;

        const number = document.createElement('span');
        number.textContent = `${index + 1}`.padStart(2, '0');

        gridItem.append(img, number);
        grid.appendChild(gridItem);

        // — restore state on load —
        if (savedState[index]?.capturePod) {
          // pet shrunk & circle, but hidden under the pod
          img.style.transform    = 'scale(0.5)';
          img.style.borderRadius = '50%';
          img.style.opacity      = '0';           // ← force hidden
          img.style.transition   = 'none';

          const pod = document.createElement('img');
          pod.src = 'Images/Misc/Capture_Pod.png';
          pod.alt = 'Capture Pod';
          pod.classList.add('capture-pod-image');
          gridItem.appendChild(pod);
          gridItem.classList.add('capture-pod');
        }

        gridItem.addEventListener('click', () => {
          if (gridItem._isAnimating) return;
          gridItem._isAnimating = true;

          // temporarily strip any parent filter
          const origFilter = gridItem.style.filter;
          gridItem.style.filter = 'none';

          const hasPod   = gridItem.classList.contains('capture-pod');
          const animImg  = document.createElement('img');
          const duration = 1000; // your .webp length
          const filterDur = duration;
          const morphDur  = 500; // circle-morph time

          Object.assign(animImg.style, {
            position:       'absolute',
            left:           '10%',
            top:            '10%',
            width:          '80%',
            height:         '80%',
            pointerEvents:  'none',
            zIndex:         0,
            imageRendering: 'pixelated',
            filter:         'none',
            boxShadow:      'none'
          });
          animImg.classList.add('capture-anim-img');

          if (!hasPod) {
            // ▶ PLAY FORWARD
            animImg.src = `Images/Animation/CaptureAnim.webp?reload=${Date.now()}`;
            gridItem.appendChild(animImg);

            img.style.position = 'relative';
            img.style.zIndex   = 1;
            img.style.transition = [
              `transform ${morphDur}ms ease`,
              `border-radius ${morphDur}ms ease`,
              `filter ${filterDur}ms ease`
            ].join(',');
            img.style.transform    = 'scale(0.5)';
            img.style.borderRadius = '50%';
            img.style.filter       = 'saturate(0%) brightness(5000%)';

            setTimeout(() => {
              // after anim
              img.style.opacity = 0;
              const pod = document.createElement('img');
              pod.src = 'Images/Misc/Capture_Pod.png';
              pod.alt = 'Capture Pod';
              pod.classList.add('capture-pod-image');
              gridItem.appendChild(pod);
              gridItem.classList.add('capture-pod');

              animImg.remove();
              savedState[index] = { capturePod: true };
              localStorage.setItem(stateKey, JSON.stringify(savedState));

              // restore parent filter & unlock
              gridItem.style.filter = origFilter;
              gridItem._isAnimating = false;
            }, duration);

          } else {
            // ◀ PLAY REVERSE
            const pod = gridItem.querySelector('.capture-pod-image');
            if (pod) pod.remove();
            gridItem.classList.remove('capture-pod');

            animImg.src = `Images/Animation/CaptureAnimR.webp?reload=${Date.now()}`;
            gridItem.appendChild(animImg);

            img.style.position = 'relative';
            img.style.zIndex   = 1;
            img.style.opacity  = 1;
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
            }, duration);
          }
        });
      });
    }

    createGridItems(normalPetsImages, normalPetsGrid, savedNormalPetsState, normalPetsKey);
    createGridItems(rarePetsImages,   rarePetsGrid,   savedRarePetsState,   rarePetsKey);

  } catch (e) {
    console.error('Failed to load pets:', e);
  }
});
