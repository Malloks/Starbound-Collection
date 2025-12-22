// vanity.js
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM content loaded');

    const grid = document.getElementById('grid');
    const savedState = JSON.parse(localStorage.getItem('vanityItemsStateRevamp')) || {};

    // — Vanity nav-link for “all done” glow —
    const vanityLink = document.querySelector('.navbar-links a[href$="vanity.html"]');
    console.log('💄 vanityLink found?', !!vanityLink);

    // Track each folder/set and how many overlays it has
    const folderPaths    = [];
    const overlayCounts  = {};  // overlayCounts[folderPath] = number of overlays in that set

    // Helper: are all overlays visible in every set?
    function checkAllVanity() {
      const allDone = folderPaths.every(fp => {
        const needed = overlayCounts[fp] || 0;
        const visible = Object.values(savedState[fp] || {})
                              .filter(s => s.visible).length;
        return needed > 0 && visible === needed;
      });
      console.log('💄 checkAllVanity:', { sets: folderPaths.length, allDone });
      localStorage.setItem('vanityAllDone', allDone ? 'true' : 'false');
      if (vanityLink) vanityLink.classList.toggle('completed', allDone);
    }

    try {
        // 1) Fetch list of all image paths under Vanity Revamp
        const resp = await fetch('/images?folder=Vanity Revamp');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const flatPaths = await resp.json();

        // 2) Derive unique folderPaths (one per set)
        flatPaths.forEach(p => {
            const fp = p
              .replace(/^(?:Resources\/)?Images\//, '')
              .replace(/^Vanity Revamp\//, '')
              .replace(/\/[^/]+\.png$/, '');
            if (!folderPaths.includes(fp)) folderPaths.push(fp);
        });

        // 3) For each set, fetch its images and build a grid-item
        for (const folderPath of folderPaths) {
            const r2 = await fetch(`/images?folder=Vanity Revamp/${folderPath}`);
            if (!r2.ok) throw new Error(`Folder fetch error ${folderPath}`);
            const images = await r2.json();
            console.log(`Images for ${folderPath}:`, images);

            // track overlays for this set
            const overlayImgs = {};
            let mannequinImg  = null;

            // wrapper for this set
            const gridItem = document.createElement('div');
            gridItem.classList.add('grid-item');

            // set name
            const setNameDiv = document.createElement('div');
            setNameDiv.classList.add('set-name');
            setNameDiv.innerText = folderPath;
            gridItem.appendChild(setNameDiv);

            // images container
            const imagesContainer = document.createElement('div');
            imagesContainer.classList.add('images-container');
            gridItem.appendChild(imagesContainer);

            // build 5 slots: 0 = mannequin+overlays, 1..4 = icons
            for (let i = 0; i < 5; i++) {
                const container = document.createElement('div');
                container.classList.add('container', `container-${i+1}`);
                imagesContainer.appendChild(container);

                if (i === 0) {
                    // base mannequin
                    mannequinImg = document.createElement('img');
                    mannequinImg.src = '/Resources/Misc/Mannequin.png';
                    mannequinImg.alt = 'Mannequin';
                    mannequinImg.classList.add('set-image');
                    mannequinImg.style.transition = 'filter 0.5s ease';
                    container.appendChild(mannequinImg);

                    // discover all overlays for this set
                    images.forEach(path => {
                      const m = path.match(/\/0(\d)_On\.(png|webp)$/);
                      if (m) {
                        const num = `0${m[1]}`;
                        const ov = document.createElement('img');
                        ov.src = `/${path}`;
                        ov.alt = `Overlay ${num}`;
                        ov.classList.add('set-image');
                        ov.style.opacity = '0';
                        ov.style.transition = 'opacity 0.5s ease';
                        container.appendChild(ov);
                        overlayImgs[num] = ov;
                      }
                    });

                    // record how many overlays this set has
                    overlayCounts[folderPath] = Object.keys(overlayImgs).length;

                } else {
                    // icon slots
                    const num = `0${i}`;
                    const basePath = images.find(p => p.match(new RegExp(`/${num}\\.(png|webp)$`)));
                    if (!basePath) continue;

                    const icon = document.createElement('img');
                    icon.src = `/${basePath}`;
                    icon.alt = `Icon ${num}`;
                    icon.classList.add('set-image');
                    icon.style.transition = 'filter 0.5s ease';
                    container.appendChild(icon);

                    // initial state
                    const isVis = !!savedState[folderPath]?.[num]?.visible;
                    if (overlayImgs[num]) {
                      overlayImgs[num].style.opacity = isVis ? '1' : '0';
                      icon.style.filter = isVis ? 'grayscale(100%)' : 'grayscale(0%)';
                    }

                    // click toggles
                    icon.addEventListener('click', () => {
                      if (!overlayImgs[num]) return;
                      const nowVis = overlayImgs[num].style.opacity !== '1';
                      overlayImgs[num].style.opacity = nowVis ? '1' : '0';
                      icon.style.filter = nowVis ? 'grayscale(100%)' : 'grayscale(0%)';

                      // persist
                      if (!savedState[folderPath]) savedState[folderPath] = {};
                      savedState[folderPath][num] = { visible: nowVis };
                      localStorage.setItem('vanityItemsStateRevamp', JSON.stringify(savedState));

                      // swap mannequin if this set is complete
                      const visibleCount = Object.values(savedState[folderPath])
                                                 .filter(s => s.visible).length;
                      const needed = overlayCounts[folderPath] || 0;
                      mannequinImg.src = (needed > 0 && visibleCount === needed)
                        ? '/Resources/Misc/GoldMannequin.png'
                        : '/Resources/Misc/Mannequin.png';

                      // re-evaluate global completion
                      checkAllVanity();
                    });
                }
            }

            // initial per-set mannequin state
            const initVis = Object.values(savedState[folderPath] || {})
                                  .filter(s => s.visible).length;
            const need = overlayCounts[folderPath] || 0;
            if (mannequinImg) {
              mannequinImg.src = (need > 0 && initVis === need)
                ? '/Resources/Misc/GoldMannequin.png'
                : '/Resources/Misc/Mannequin.png';
            }

            grid.appendChild(gridItem);
        }

        // initial global check
        checkAllVanity();

    } catch (err) {
        console.error('Failed to fetch vanity items:', err);
    }

    // ── Drag-reveal observer (unchanged) ──
    const observer = new MutationObserver(() => {
        document.querySelectorAll('.container-1').forEach(container => {
            container.querySelectorAll('img:not([src*="Mannequin"])')
              .forEach(overlay => {
                const line = document.createElement('div');
                line.classList.add('line');
                container.appendChild(line);
                let dragging = false, startY = 0;
                line.addEventListener('mousedown', e => {
                    dragging = true; startY = e.clientY; e.preventDefault();
                });
                document.addEventListener('mousemove', e => {
                    if (!dragging) return;
                    const deltaY = e.clientY - startY;
                    const clip = Math.max(0,
                      Math.min(100, (deltaY / container.offsetHeight) * 100));
                    overlay.style.clipPath = `inset(${100 - clip}% 0 0 0)`;
                    startY = e.clientY;
                });
                document.addEventListener('mouseup', () => { dragging = false; });
            });
        });
    });
    observer.observe(grid, { childList: true, subtree: true });
});
