document.addEventListener('DOMContentLoaded', async () => {
    const titleEl = document.getElementById('page-title');
    if (!titleEl) console.warn('No title element to mark completed');

    const oceanGrid  = document.getElementById('ocean-grid');
    const toxicGrid  = document.getElementById('toxic-grid');
    const arcticGrid = document.getElementById('arctic-grid');
    const lavaGrid   = document.getElementById('lava-grid');

    if (!oceanGrid || !toxicGrid || !arcticGrid || !lavaGrid) {
        console.error('Error: Grids not found in the HTML');
        return;
    }

    const savedStateKey = 'gridStateFish_v8'; // Increment version
    const savedState    = JSON.parse(localStorage.getItem(savedStateKey)) || {};

    // Fish labels per region
    const fishLabels = {
        Ocean:   ["Clownfish", "Angelfish" /* … etc … */],
        Toxic:   ["Puffer", "Lionfish"  /* … */],
        Arctic:  ["Cod", "Icefish"      /* … */],
        Lava:    ["Magma Bass", "Flame Gill" /* … */]
    };

    // --- Bowl Size Configuration ---
    const bowlSizeCodes = '112221233213222122122333111321112223221121112313'
        .split('').map(Number);
    const dayNightCodes  = '333121212123333121212123333331223133333121212123'
        .split('').map(Number);
    const howDeepCodes   = '132113213232123323132132321133223132123323331332'
        .split('').map(Number);

    const BOWL_SMALL_SRC   = '/Resources/Misc/FishbowlSmall.png';
    const BOWL_MEDIUM_SRC  = '/Resources/Misc/FishbowlMedium.png';
    const BOWL_BIG_SRC     = '/Resources/Misc/FishbowlBig.png';
    const BOWL_DEFAULT_SRC = BOWL_MEDIUM_SRC;

    // --- Animation Timings (ms) ---
    const HOOK_DOWN_DURATION = 500;
    const LIFT_DURATION      = 500;
    const DROP_DELAY         = 50;
    const DROP_DURATION      = 400;
    const SHAKE_DURATION     = 400; // Match CSS

    // --- Animation Positions ---
    const HOOK_START_Y       = -130;
    const HOOK_CATCH_OFFSET_Y= 30;
    const LIFT_DISTANCE_Y    = HOOK_START_Y - HOOK_CATCH_OFFSET_Y;

    // Day / Night icons mapping
    const DAY_ICONS = {
        1: '/Resources/Misc/Sun.png',
        2: '/Resources/Misc/Moon.png',
        3: '/Resources/Misc/SunMoon.png'
    };
    const DEPTH_ICONS = {
        1: '/Resources/Misc/Shallow.png',
        2: '/Resources/Misc/Deep.png',
        3: '/Resources/Misc/All.png'
    };

    function getDayIconSrc(index) {
        const code = dayNightCodes[index] || 1;
        return DAY_ICONS[code];
    }

    function getDepthIconSrc(index) {
        const code = howDeepCodes[index] || 1;
        return DEPTH_ICONS[code];
    }

    function getBowlSrcFromIndex(index) {
        const sizeCode = (index >= 0 && index < bowlSizeCodes.length)
            ? bowlSizeCodes[index]
            : 0;
        switch (sizeCode) {
            case 1: return BOWL_SMALL_SRC;
            case 2: return BOWL_MEDIUM_SRC;
            case 3: return BOWL_BIG_SRC;
            default: return BOWL_DEFAULT_SRC;
        }
    }

    try {
        // Fetch all region images in parallel
        const [
            oceanResp,
            toxicResp,
            arcticResp,
            lavaResp
        ] = await Promise.all([
            fetch('/images?folder=Fish/Ocean'),
            fetch('/images?folder=Fish/Toxic'),
            fetch('/images?folder=Fish/Arctic'),
            fetch('/images?folder=Fish/Lava')
        ]);

        if (!oceanResp.ok || !toxicResp.ok || !arcticResp.ok || !lavaResp.ok) {
            throw new Error('Failed to fetch one or more image lists');
        }

        const oceanImages  = await oceanResp.json();
        const toxicImages  = await toxicResp.json();
        const arcticImages = await arcticResp.json();
        const lavaImages   = await lavaResp.json();

        // Check if every fish has been caught (bowl applied)
        function checkAllCaught() {
            const allItems = document.querySelectorAll('.grid-item');
            const allCaught = Array.from(allItems).every(item => {
                const stateId = `${item.dataset.folder}_${item.dataset.index}`;
                return savedState[stateId]?.hasFishbowl;
            });

            titleEl.classList.toggle('completed', allCaught);

            const fishNavLink = document.getElementById('nav-fish');
            if (fishNavLink) {
                fishNavLink.classList.toggle('completed', allCaught);
            }
        }

        // Create one region's grid items
        function createGridItems(images, grid, folderName) {
            images.forEach(src => {
                // Derive zero-based index from filename
                const fileName   = src.substring(src.lastIndexOf('/') + 1);
                const fileNumber = parseInt(fileName.match(/\d+/)[0], 10) - 1;

                // Build grid-item container
                const gridItem = document.createElement('div');
                gridItem.classList.add('grid-item');
                gridItem.dataset.folder = folderName;
                gridItem.dataset.index  = fileNumber;

                // Hook back half
                const fishHookBack = document.createElement('img');
                fishHookBack.src     = '/Resources/Misc/FishHook1.png';
                fishHookBack.alt     = 'Fishing Hook Back';
                fishHookBack.classList.add('fish-hook', 'fish-hook-back');
                fishHookBack.style.visibility = 'hidden';

                // Container for vertical movement
                const fishMover = document.createElement('div');
                fishMover.classList.add('fish-mover');

                // Container for rotation
                const fishRotator = document.createElement('div');
                fishRotator.classList.add('fish-rotator');

                // Hook front half
                const fishHookFront = document.createElement('img');
                fishHookFront.src     = '/Resources/Misc/FishHook2.png';
                fishHookFront.alt     = 'Fishing Hook Front';
                fishHookFront.classList.add('fish-hook', 'fish-hook-front');
                fishHookFront.style.visibility = 'hidden';

                // The fish image
                const img = document.createElement('img');
                img.src   = src;
                img.alt   = `${folderName} Fish ${fileNumber + 1}`;
                img.classList.add('fish');

                // The fishbowl overlay
                const fishbowlImage = document.createElement('img');
                fishbowlImage.classList.add('fishbowl');
                fishbowlImage.alt = 'Fishbowl';
                fishbowlImage.src = getBowlSrcFromIndex(fileNumber);

                // Number label (01, 02, etc.)
                const number = document.createElement('span');
                number.classList.add('number');
                number.textContent = String(fileNumber + 1).padStart(2, '0');

                // Decorative triangle
                const triangle = document.createElement('div');
                triangle.classList.add('triangle');

                // Determine triangle color by ranges
                const itemNumber = fileNumber + 1;
                let triangleColor;
                if (
                    (itemNumber >= 1 && itemNumber <= 3) ||
                    (itemNumber >= 13 && itemNumber <= 15) ||
                    (itemNumber >= 25 && itemNumber <= 27) ||
                    (itemNumber >= 37 && itemNumber <= 39)
                ) {
                    triangleColor = '#B5B5B550';
                } else if (
                    (itemNumber >= 4 && itemNumber <= 7) ||
                    (itemNumber >= 16 && itemNumber <= 19) ||
                    (itemNumber >= 28 && itemNumber <= 31) ||
                    (itemNumber >= 40 && itemNumber <= 43)
                ) {
                    triangleColor = '#369C3350';
                } else if (
                    (itemNumber >= 8 && itemNumber <= 11) ||
                    (itemNumber >= 20 && itemNumber <= 23) ||
                    (itemNumber >= 32 && itemNumber <= 35) ||
                    (itemNumber >= 44 && itemNumber <= 47)
                ) {
                    triangleColor = '#33859C50';
                } else if (
                    itemNumber === 12 ||
                    itemNumber === 24 ||
                    itemNumber === 36 ||
                    itemNumber === 48
                ) {
                    triangleColor = '#6D339C50';
                } else {
                    triangleColor = 'transparent';
                }

                const rgbOnly   = triangleColor.slice(0, 7);
                const fullAlpha = rgbOnly + 'FF';
                triangle.style.setProperty('--triangle-color', rgbOnly);

                gridItem.addEventListener('mouseenter', () => {
                    triangle.style.background =
                        `linear-gradient(to bottom right, transparent 50%, ${fullAlpha} 50%)`;
                });
                gridItem.addEventListener('mouseleave', () => {
                    triangle.style.background =
                        `linear-gradient(to bottom right, transparent 50%, ${fullAlpha} 50%)`;
                });

                // Assemble DOM structure
                fishMover.appendChild(fishHookBack);
                fishRotator.appendChild(img);
                fishRotator.appendChild(fishbowlImage);
                fishMover.appendChild(fishRotator);
                fishMover.appendChild(fishHookFront);

                gridItem.appendChild(fishMover);
                gridItem.appendChild(number);
                gridItem.appendChild(triangle);

                // Label below fish
                const label = document.createElement('div');
                label.classList.add('item-label');
                label.textContent = fishLabels[folderName]?.[fileNumber] || '';
                gridItem.appendChild(label);

                // Day/Night icon (top-right)
                const dayIcon = document.createElement('img');
                dayIcon.src   = getDayIconSrc(fileNumber);
                dayIcon.alt   = 'Day/Night Icon';
                dayIcon.classList.add('day-icon');
                gridItem.appendChild(dayIcon);

                // Depth icon (bottom-left)
                const depthIcon = document.createElement('img');
                depthIcon.src   = getDepthIconSrc(fileNumber);
                depthIcon.alt   = 'Depth Icon';
                depthIcon.classList.add('depth-icon');
                gridItem.appendChild(depthIcon);

                // Helper: find non-transparent pixel bounds
                async function getVisibleBounds(image) {
                    await image.decode?.();
                    const cw = image.naturalWidth,
                          ch = image.naturalHeight;
                    const canvas = document.createElement('canvas');
                    canvas.width = cw;
                    canvas.height = ch;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(image, 0, 0);
                    const data = ctx.getImageData(0, 0, cw, ch).data;
                    let minX = cw, maxX = 0;
                    for (let x = 0; x < cw; x++) {
                        for (let y = 0; y < ch; y++) {
                            if (data[(y * cw + x) * 4 + 3] > 0) {
                                minX = Math.min(minX, x);
                                maxX = Math.max(maxX, x);
                                break;
                            }
                        }
                    }
                    return (minX > maxX) ? [0, cw] : [minX, maxX];
                }

                // Position hook pivot based on fish silhouette
                async function positionHooks() {
                    const [minX, maxX] = await getVisibleBounds(img);
                    const visibleW     = maxX - minX;
                    const scale        = img.clientWidth / img.naturalWidth;
                    const visibleOnScreenW = visibleW * scale;
                    const offsetOnScreen  = minX * scale;
                    const tipX = offsetOnScreen + visibleOnScreenW * 0.7;
                    const pivotOffset = -5;

                    fishRotator.style.setProperty(
                        '--hook-x',
                        `${tipX + pivotOffset}px`
                    );
                    [fishHookBack, fishHookFront].forEach(hook => {
                        hook.style.left = `${tipX}px`;
                    });
                    fishHookBack.style.visibility  = '';
                    fishHookFront.style.visibility = ''
                }

                // Apply saved state (show bowl if caught)
                const stateId = `${folderName}_${fileNumber}`;
                function applyInitialState() {
                    const prevTransition = img.style.transition;
                    img.style.transition = 'none';

                    if (savedState[stateId]?.hasFishbowl) {
                        fishbowlImage.style.display = 'block';
                        fishbowlImage.style.top     = '0px';
                        img.style.opacity            = '0.5';
                    } else {
                        fishbowlImage.style.display = 'none';
                        img.style.opacity            = '1';
                    }

                    // Force reflow then restore transition
                    void img.offsetHeight;
                    img.style.transition = prevTransition;
                }

                // Once image is ready, set initial state and hooks
                if (img.complete) {
                    applyInitialState();
                    positionHooks();
                } else {
                    img.onload  = () => { applyInitialState(); positionHooks(); };
                    img.onerror = () => { applyInitialState(); positionHooks(); };
                }
                window.addEventListener('resize', positionHooks);

                // Click handler: catch or release fish
                gridItem.addEventListener('click', () => {
                    if (gridItem.classList.contains('animating')) return;

                    const isCaught = savedState[stateId]?.hasFishbowl;
                    gridItem.classList.add('animating');
                    gridItem.style.cursor = 'default';

                    if (isCaught) {
                        // Release animation
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
                            gridItem.classList.remove('animating');
                            gridItem.style.cursor = 'pointer';
                        }, 500);
                    } else {
                        // Catch animation sequence
                        fishbowlImage.src = getBowlSrcFromIndex(fileNumber);

                        // 1) Hook descends
                        [fishHookBack, fishHookFront].forEach(h => {
                            h.style.top = `${HOOK_CATCH_OFFSET_Y}px`;
                        });
                        setTimeout(() => {
                            // 2) Hook & fish lift
                            requestAnimationFrame(() =>
                                requestAnimationFrame(() => {
                                    [fishHookBack, fishHookFront].forEach(h => {
                                        h.style.top = `${HOOK_START_Y}px`;
                                    });
                                    fishMover.style.transform   = `translateY(${LIFT_DISTANCE_Y}px)`;
                                    fishRotator.style.transform = `rotate(-80deg)`;
                                })
                            );

                            setTimeout(() => {
                                // 3) Bowl appears
                                fishbowlImage.style.top     = `${LIFT_DISTANCE_Y}px`;
                                fishbowlImage.style.display = 'block';
                                img.style.opacity            = '0.5';

                                setTimeout(() => {
                                    // 4) Drop back down
                                    fishMover.style.transform   = 'translateY(0px)';
                                    fishRotator.style.transform = 'rotate(0deg)';
                                    fishbowlImage.style.top     = '0px';

                                    setTimeout(() => {
                                        // 5) Shake
                                        fishRotator.classList.add('shake');
                                        fishbowlImage.classList.add('bowlshake');

                                        setTimeout(() => {
                                            fishRotator.classList.remove('shake');
                                            fishbowlImage.classList.remove('bowlshake');
                                            gridItem.classList.remove('animating');
                                            gridItem.style.cursor = 'pointer';
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

                grid.appendChild(gridItem);
            });
        }

        // Initialize all four regions
        createGridItems(oceanImages,  oceanGrid,  'Ocean');
        createGridItems(toxicImages,  toxicGrid,  'Toxic');
        createGridItems(arcticImages, arcticGrid, 'Arctic');
        createGridItems(lavaImages,   lavaGrid,   'Lava');

        checkAllCaught();
    } catch (error) {
        console.error('Failed to initialize fish grids:', error);
    }
});
