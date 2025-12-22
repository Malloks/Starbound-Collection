document.addEventListener('DOMContentLoaded', async () => {
    const titleEl = document.getElementById('page-title');
    if (!titleEl) console.warn('No title element to mark completed');
    const oceanGrid = document.getElementById('ocean-grid');
    const toxicGrid = document.getElementById('toxic-grid');
    const arcticGrid = document.getElementById('arctic-grid');
    const lavaGrid = document.getElementById('lava-grid');

    if (!oceanGrid || !toxicGrid || !arcticGrid || !lavaGrid) {
        console.error('Error: Grids not found in the HTML');
        return;
    }

    const savedStateKey = 'gridStateFish_v8'; // Increment version
    const savedState = JSON.parse(localStorage.getItem(savedStateKey)) || {};

    // --- Bowl Size Configuration ---
    const bowlSizeCodes = "112221233213222122122333111321112223221121112313".split('').map(Number);
    const BOWL_SMALL_SRC = '/Resources/Misc/FishbowlSmall.png';
    const BOWL_MEDIUM_SRC = '/Resources/Misc/FishbowlMedium.png';
    const BOWL_BIG_SRC = '/Resources/Misc/FishbowlBig.png';
    const BOWL_DEFAULT_SRC = BOWL_MEDIUM_SRC;

    // --- Animation Timings (in milliseconds) ---
    const HOOK_DOWN_DURATION = 500;
    const LIFT_DURATION = 500;
    const DROP_DELAY = 50;
    const DROP_DURATION = 400;
    const SHAKE_DURATION = 400; // Match CSS

    // --- Animation Positions ---
    const HOOK_START_Y = -130;
    const HOOK_CATCH_OFFSET_Y = 30; // Needs testing
    const LIFT_DISTANCE_Y = HOOK_START_Y - HOOK_CATCH_OFFSET_Y;

    // --- Helper to get Bowl Source ---
    function getBowlSrcFromIndex(index) {
        const sizeCode = (index >= 0 && index < bowlSizeCodes.length) ? bowlSizeCodes[index] : 0; // Get code or 0 if out of bounds
        switch (sizeCode) {
            case 1: return BOWL_SMALL_SRC;
            case 2: return BOWL_MEDIUM_SRC;
            case 3: return BOWL_BIG_SRC;
            default: return BOWL_DEFAULT_SRC; // Use default for 0 or unexpected codes
        }
    }

    try {
        // Fetch images
        const [oceanImagesResponse, toxicImagesResponse, arcticImagesResponse, lavaImagesResponse] = await Promise.all([
            fetch('/images?folder=Fish/Ocean'),
            fetch('/images?folder=Fish/Toxic'),
            fetch('/images?folder=Fish/Arctic'),
            fetch('/images?folder=Fish/Lava')
        ]);

        if (!oceanImagesResponse.ok || !toxicImagesResponse.ok || !arcticImagesResponse.ok || !lavaImagesResponse.ok) {
            throw new Error('Failed to fetch one or more image lists');
        }

        const oceanImages = await oceanImagesResponse.json();
        const toxicImages = await toxicImagesResponse.json();
        const arcticImages = await arcticImagesResponse.json();
        const lavaImages = await lavaImagesResponse.json();

        // Checks every grid-item against savedState to see if they've all been caught
        function checkAllCaught() {
          const allItems = document.querySelectorAll('.grid-item');
          const allCaught = Array.from(allItems).every(item => {
            const stateId = `${item.dataset.folder}_${item.dataset.index}`;
            return savedState[stateId] && savedState[stateId].hasFishbowl;
          });
        
          // Toggle the page-title
          titleEl.classList.toggle('completed', allCaught);
        
          // Toggle the Fish link in the navbar
          const fishNavLink = document.getElementById('nav-fish');
          if (fishNavLink) {
            fishNavLink.classList.toggle('completed', allCaught);
          }
        }

        // Function to create grid items
        function createGridItems(images, grid, folderName) {
            images.forEach((src) => {
                const fileName = src.substring(src.lastIndexOf('/') + 1);
                const fileNumber = parseInt(fileName.match(/\d+/)[0], 10) - 1; // Extract number and adjust to 0-based index

                const gridItem = document.createElement('div');
                gridItem.classList.add('grid-item');
                gridItem.dataset.index = fileNumber;
                gridItem.dataset.folder = folderName;

                // --- Create Hook Halves ---
                const fishHookBack = document.createElement('img');
                fishHookBack.src = '/Resources/Misc/FishHook1.png';      // back half
                fishHookBack.alt = 'Fishing Hook Back';
                fishHookBack.classList.add('fish-hook', 'fish-hook-back');

                // outer mover for vertical translate
                const fishMover = document.createElement('div');
                fishMover.classList.add('fish-mover');
                
                // inner rotator for rotation
                const fishRotator = document.createElement('div');
                fishRotator.classList.add('fish-rotator');

                const fishHookFront = document.createElement('img');
                fishHookFront.src = '/Resources/Misc/FishHook2.png';     // front half
                fishHookFront.alt = 'Fishing Hook Front';
                fishHookFront.classList.add('fish-hook', 'fish-hook-front');

                const img = document.createElement('img');
                img.src = src;
                img.alt = `${folderName} Fish ${fileNumber + 1}`;
                img.classList.add('fish');

                const fishbowlImage = document.createElement('img');
                fishbowlImage.classList.add('fishbowl');
                fishbowlImage.alt = 'Fishbowl';
                // Set bowl source based on index - MOVED LOGIC TO HELPER
                fishbowlImage.src = getBowlSrcFromIndex(fileNumber); // Set src immediately

                const number = document.createElement('span');
                number.classList.add('number');
                number.textContent = `${fileNumber + 1}`.padStart(2, '0');

                const triangle = document.createElement('div');
                triangle.classList.add('triangle');
                let triangleColor;
                const itemNumber = fileNumber + 1;
                switch (true) {
                    case itemNumber >= 1 && itemNumber <= 3 || itemNumber >= 13 && itemNumber <= 15 || itemNumber >= 25 && itemNumber <= 27 || itemNumber >= 37 && itemNumber <= 39: triangleColor = '#B5B5B550'; break;
                    case itemNumber >= 4 && itemNumber <= 7 || itemNumber >= 16 && itemNumber <= 19 || itemNumber >= 28 && itemNumber <= 31 || itemNumber >= 40 && itemNumber <= 43: triangleColor = '#369C3350'; break;
                    case itemNumber >= 8 && itemNumber <= 11 || itemNumber >= 20 && itemNumber <= 23 || itemNumber >= 32 && itemNumber <= 35 || itemNumber >= 44 && itemNumber <= 47: triangleColor = '#33859C50'; break;
                    case itemNumber === 12 || itemNumber === 24 || itemNumber === 36 || itemNumber === 48: triangleColor = '#6D339C50'; break;
                    default: triangleColor = 'transparent';
                }
                triangle.style.background = `linear-gradient(to bottom right, transparent 50%, ${triangleColor} 50%)`;

                // --- Append Elements ---
                // 1) BACK hook goes into the mover (not the rotator)
                fishMover.appendChild(fishHookBack);

                // 2) Fish & bowl go into the rotator
                fishRotator.appendChild(img);
                fishRotator.appendChild(fishbowlImage);

                // 3) Put rotator and then the front hook into the mover
                fishMover.appendChild(fishRotator);
                fishMover.appendChild(fishHookFront);

                // 4) Finally, put your mover into the grid-item
                gridItem.appendChild(fishMover);
                gridItem.appendChild(number);
                gridItem.appendChild(triangle);


                grid.appendChild(gridItem);

                /**
                 * Returns [minX, maxX] of non-transparent pixels in the image's natural size.
                 */
                async function getVisibleBounds(img) {
                  // wait for the image to be decoded
                  await img.decode?.();
                
                  const cw = img.naturalWidth, ch = img.naturalHeight;
                  const canvas = document.createElement('canvas');
                  canvas.width = cw; canvas.height = ch;
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(img, 0, 0);
                
                  const data = ctx.getImageData(0, 0, cw, ch).data;
                  let minX = cw, maxX = 0;
                
                  for (let x = 0; x < cw; x++) {
                    for (let y = 0; y < ch; y++) {
                      if (data[(y * cw + x) * 4 + 3] > 0) {  // alpha > 0
                        minX = Math.min(minX, x);
                        maxX = Math.max(maxX, x);
                        break;
                      }
                    }
                  }
                  // if fully transparent, fall back to full width
                  if (minX > maxX) return [0, cw];
                  return [minX, maxX];
                }

                async function positionHooks() {
                  // 1) get the visible pixel bounds
                  const [minX, maxX] = await getVisibleBounds(img);
                  const visibleW     = maxX - minX;
                
                  // 2) how big is that on-screen?
                  const scale        = img.clientWidth / img.naturalWidth;
                  const visibleOnScreenW = visibleW * scale;
                
                  // 3) compute the 80% tip point (relative to wrapper)
                  const offsetOnScreen = minX * scale;                  // where visible starts
                  const tipX           = offsetOnScreen + visibleOnScreenW * 0.7;
                
                  console.log('visibleW', visibleW, 
                              'screenW', visibleOnScreenW.toFixed(1), 
                              'tipX', tipX.toFixed(1));

                  // tell the rotator where to pivot
                  // nudge the pivot a little left by 5px to counter over-swing
                  const pivotOffset = -5;
                  fishRotator.style.setProperty(
                    '--hook-x',
                    `${tipX + pivotOffset}px`
                  );        
                  [fishHookBack, fishHookFront].forEach(h => h.style.left = `${tipX}px`);
                }

                // --- Check Saved State ---
                const stateId = `${folderName}_${fileNumber}`;
                const applyInitialState = () => {
                  const fishState = savedState[stateId];
                  // temporarily disable the opacity transition
                  const prev = img.style.transition;
                  img.style.transition = 'none';
                
                  if (fishState && fishState.hasFishbowl) {
                    fishbowlImage.src = getBowlSrcFromIndex(fileNumber);
                    fishbowlImage.style.display = 'block';
                    fishbowlImage.style.top = '0px';
                    img.style.opacity = '0.5';
                  } else {
                    fishbowlImage.style.display = 'none';
                    img.style.opacity = '1';
                  }
              
                  // force a reflow so the browser applies the no-transition style
                  // eslint-disable-next-line no-unused-expressions
                  img.offsetHeight;
              
                  // restore the transition for future changes
                  img.style.transition = prev;
                };

                if (img.complete) {
                  applyInitialState();
                  positionHooks();
                } else {
                  img.onload = () => { applyInitialState(); positionHooks(); };
                  img.onerror = () => { applyInitialState(); positionHooks(); };
                }
                window.addEventListener('resize', positionHooks);


                // Recompute hook positions if the layout resizes
                window.addEventListener('resize', positionHooks);

                // --- Add Click Event Listener ---
                gridItem.addEventListener('click', () => {
                    if (gridItem.classList.contains('animating')) {
                        return;
                    }
                    const currentState = savedState[stateId] || { hasFishbowl: false };
                    const isCaught = currentState.hasFishbowl;

                    gridItem.classList.add('animating'); // Add animating class immediately
                    gridItem.style.cursor = 'default'; // Change cursor to default immediately
        

                    if (isCaught) {
                        // --- Remove Fishbowl ---
                        gridItem.classList.add('animating');
                        fishbowlImage.style.top = '-100px';
                        setTimeout(() => fishbowlImage.style.display = 'none', 700);
                        fishbowlImage.style.top = '120px';
                        setTimeout(() => fishbowlImage.style.display = 'block', 300);
                        img.style.opacity = '1';
                        fishRotator.classList.remove('shake');
                        fishbowlImage.classList.remove('bowlshake');
                        savedState[stateId] = { hasFishbowl: false };
                        checkAllCaught();
                        localStorage.setItem(savedStateKey, JSON.stringify(savedState));
                        setTimeout(() => {
                            gridItem.classList.remove('animating'); // Reset cursor after animation
                            gridItem.style.cursor = 'pointer'; // Change cursor to default immediately
                        }, 500);
                    } else {
                        // --- Catch Fish Animation ---
                        gridItem.classList.add('animating');

                        // Ensure correct bowl source is set before animation
                        fishbowlImage.src = getBowlSrcFromIndex(fileNumber);

                        // 1. Hook Animates Down
                        [fishHookBack, fishHookFront].forEach(h => {
                          h.style.top = `${HOOK_CATCH_OFFSET_Y}px`;
                        });
                        setTimeout(() => {
                          // 2. Hook and Fish Animate Up — ensure they both start on the same frame
                          requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                              [fishHookBack, fishHookFront].forEach(h => {
                                h.style.top = `${HOOK_START_Y}px`;
                              });
                                // tilt the fish up 20° as it’s pulled
                                // lift the whole thing
                                fishMover.style.transform   = `translateY(${LIFT_DISTANCE_Y}px)`;
                                // snap-fast tilt
                                fishRotator.style.transform = `rotate(-80deg)`;
                            });
                          });

                            setTimeout(() => {
                                // 3. Bowl Appears & Opacity Changes
                                fishbowlImage.style.top = `${LIFT_DISTANCE_Y}px`;
                                fishbowlImage.style.display = 'block';
                                img.style.opacity = '0.5';

                                setTimeout(() => {
                                    // 4. Fish and Bowl Animate Down
                                    fishMover.style.transform   = 'translateY(0px)';
                                    fishRotator.style.transform = 'rotate(0deg)';
                                    // Land at the desired height
                                    fishbowlImage.style.top = '0px'; // <<-- ADJUST FINAL LANDING HEIGHT

                                    setTimeout(() => {
                                        // 5. Shake Animation
                                        fishRotator.classList.add('shake');
                                        fishbowlImage.classList.add('bowlshake');

                                        setTimeout(() => {
                                            fishRotator.classList.remove('shake');
                                            fishbowlImage.classList.remove('bowlshake');
                                            gridItem.classList.remove('animating');
                                            gridItem.style.cursor = 'pointer'; // Reset cursor after animation
                                        }, SHAKE_DURATION);

                                        savedState[stateId] = { hasFishbowl: true };
                                        checkAllCaught();
                                        localStorage.setItem(savedStateKey, JSON.stringify(savedState));

                                    }, DROP_DURATION);
                                }, DROP_DELAY);
                            }, LIFT_DURATION);
                        }, HOOK_DOWN_DURATION);
                    }
                });
            });
        }

        // Create grids
        createGridItems(oceanImages, oceanGrid, 'Ocean');
        createGridItems(toxicImages, toxicGrid, 'Toxic');
        createGridItems(arcticImages, arcticGrid, 'Arctic');
        createGridItems(lavaImages, lavaGrid, 'Lava');
        checkAllCaught();

    } catch (error) {
        console.error('Failed to initialize fish grids:', error);
    }
});