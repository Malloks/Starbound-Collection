document.addEventListener('DOMContentLoaded', async () => {
    const savedState = JSON.parse(localStorage.getItem('vanityItemsStateRevamp')) || {};
    const categories = ['Small', 'Medium', 'Large'];
    const baseFolder = 'Fossils';
    const gridElements = {
        'Small': document.getElementById('small-grid'),
        'Medium': document.getElementById('medium-grid'),
        'Large': document.getElementById('large-grid')
    };
    const imageCache = new Map();

    // --- getImage function remains the same ---
    const getImage = async (src) => {
        // ... (implementation as before) ...
        if (imageCache.has(src)) {
            return imageCache.get(src).cloneNode();
        }
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                imageCache.set(src, img);
                resolve(img.cloneNode());
            };
            // Add more specific error handling for debugging if needed
            img.onerror = (err) => {
                console.error(`Failed to load image: ${src}`, err);
                reject(`Failed to load image: ${src}`);
            };
            img.src = src;
        });
    };

    async function loadContainersAndOverlays() {
        try {
            for (const category of categories) {
                const grid = gridElements[category];
                grid.setAttribute('data-category', category);

                // Fetch the list of item folders/paths for the category
                const response = await fetch(`/images?folder=${baseFolder}/${category}`);
                if (!response.ok) throw new Error(`Failed to fetch ${category}: ${response.status}`);
                const itemsPaths = await response.json();

                // Derive unique item folder names
                const itemFolders = itemsPaths.reduce((acc, path) => {
                    // Adjusted regex to handle both .webp and .png in paths potentially
                    const match = path.match(new RegExp(`^Images/${baseFolder}/${category}/([^/]+)/`));
                    if (match && match[1] && !acc.includes(match[1])) {
                         acc.push(match[1]);
                    }
                    return acc;
                 }, []);


                // Fetch image lists for all items in parallel
                const itemDetailPromises = itemFolders.map(async (item) => {
                    try {
                        const itemResponse = await fetch(`/images?folder=${baseFolder}/${category}/${item}`);
                        if (!itemResponse.ok) {
                            console.error(`Failed to fetch image list for ${item}: ${itemResponse.status}`);
                            return { item, images: [], error: true };
                        }
                        const images = await itemResponse.json();
                        // Ensure images is an array
                        return { item, images: Array.isArray(images) ? images : [] };
                    } catch (err) {
                        console.error(`Error fetching details for ${item}:`, err);
                        return { item, images: [], error: true };
                    }
                });
                const itemDetails = await Promise.all(itemDetailPromises);

                // Process items
                for (const { item, images, error } of itemDetails) {
                    if (error || images.length === 0) {
                        console.warn(`Skipping item ${category}/${item} due to fetch error or no images.`);
                        continue;
                    }

                    const gridItem = document.createElement('div');
                    gridItem.classList.add('grid-item');
                    gridItem.setAttribute('data-category', category);

                    const imagesContainer = document.createElement('div');
                    imagesContainer.classList.add('images-container');

                    const setNameDiv = document.createElement('div');
                    setNameDiv.classList.add('set-name');
                    setNameDiv.innerText = item;
                    gridItem.appendChild(setNameDiv);

                    const overlayImgs = {};
                    const iconImgs = {};
                    const pieceCount = category === 'Small' ? 1 : category === 'Medium' ? 3 : 5;
                    let isAnimatingContainer = false;

                    const setContainerAnimationState = (animating) => {
                        // ... (implementation as before) ...
                        isAnimatingContainer = animating;
                         Array.from(imagesContainer.querySelectorAll('.set-image')).forEach(img => {
                             if (img.alt.startsWith('Icon')) {
                                 img.style.cursor = animating ? 'default' : 'pointer';
                             }
                         });
                    };

                    const imagesContainerFragment = document.createDocumentFragment();

                    for (let i = 0; i < pieceCount + 1; i++) {
                        const container = document.createElement('div');
                        container.classList.add('container', `container-${i + 1}`);
                        container.setAttribute('data-category', category);

                        if (i === 0) { // Container 1: Mannequin and Overlays
                            try {
                                // Keep Mannequin/Display images as WEBP unless specified otherwise
                                const mannequin = await getImage(`/Images/Misc/${category}Display.webp`);
                                mannequin.alt = 'Mannequin';
                                mannequin.classList.add('set-image');
                                mannequin.style.zIndex = "1";

                                const mannequinDone = await getImage(`/Images/Misc/${category}DisplayDone.webp`);
                                mannequinDone.alt = 'MannequinDone';
                                mannequinDone.classList.add('set-image');
                                mannequinDone.style.zIndex = "2";
                                mannequinDone.style.opacity = "0";

                                let mannequinAdd = null;
                                if (category === 'Medium') {
                                    mannequinAdd = await getImage(`/Images/Misc/MediumDisplayPole.webp`);
                                    mannequinAdd.alt = 'MannequinAdd';
                                    mannequinAdd.classList.add('set-image');
                                    mannequinAdd.style.zIndex = "0";
                                    mannequinAdd.style.opacity = '1';
                                    container.appendChild(mannequinAdd);
                                }

                                container.appendChild(mannequin);
                                container.appendChild(mannequinDone);

                                // Create overlay images (Prioritize PNG, fallback to WEBP)
                                for (let j = 1; j <= pieceCount; j++) {
                                    const num = `0${j}`;

                                    // *** MODIFICATION START: Find Overlay Path ***
                                    // Prioritize PNG, fallback to WEBP
                                    let overlayPath = images.find(imgPath => imgPath.endsWith(`${num}_On.png`));
                                    if (!overlayPath) {
                                        overlayPath = images.find(imgPath => imgPath.endsWith(`${num}_On.webp`));
                                    }
                                    // *** MODIFICATION END ***

                                    if (!overlayPath) {
                                        console.warn(`Overlay image ${num}_On.(png/webp) not found for ${category}/${item}`);
                                        continue;
                                    }
                                    const overlay = await getImage(`/${overlayPath}`); // Assumes paths start with /Images/...
                                    overlay.alt = `Overlay ${num}`;
                                    overlay.classList.add('set-image');
                                    overlay.style.opacity = '0';
                                    overlay.style.transition = 'opacity 0.5s ease';
                                    container.appendChild(overlay);
                                    overlayImgs[num] = overlay;
                                }

                                // Initialize state from localStorage (logic unchanged)
                                const pathKeyInit = `${category}/${item}`;
                                const savedPieceInit = savedState[pathKeyInit];
                                if (savedPieceInit) {
                                     let allVisibleInit = false;
                                     const visibleCountInit = Object.values(savedPieceInit).filter(data => data.visible).length;
                                     if (visibleCountInit === pieceCount) {
                                         allVisibleInit = true;
                                     }
                                     Object.entries(savedPieceInit).forEach(([num, data]) => {
                                         if (overlayImgs[num]) overlayImgs[num].style.opacity = data.visible ? '1' : '0';
                                     });
                                     mannequinDone.style.opacity = allVisibleInit ? '1' : '0';
                                     if (mannequinAdd) mannequinAdd.style.opacity = allVisibleInit ? '0' : '1';
                                 } else {
                                     mannequinDone.style.opacity = '0';
                                     if (mannequinAdd) mannequinAdd.style.opacity = '1';
                                 }

                            } catch (imgError) {
                                console.error(`Error loading base/overlay images for ${category}/${item}:`, imgError);
                            }
                        } else { // Containers 2 to pieceCount+1: Icons
                            try {
                                const num = `0${i}`;

                                // *** MODIFICATION START: Find Icon Path ***
                                // Prioritize PNG, fallback to WEBP. Ensure it's not an "_On" file.
                                let iconPath = images.find(imgPath => imgPath.endsWith(`${num}.png`) && !imgPath.includes('_On.'));
                                if (!iconPath) {
                                    iconPath = images.find(imgPath => imgPath.endsWith(`${num}.webp`) && !imgPath.includes('_On.'));
                                }
                                // *** MODIFICATION END ***

                                if (!iconPath) {
                                    console.warn(`Icon image ${num}.(png/webp) not found for ${category}/${item}`);
                                    continue; // Skip this icon container if path not found
                                }

                                const baseImg = await getImage(`/${iconPath}`); // Assumes paths start with /Images/...
                                baseImg.alt = `Icon ${num}`;
                                baseImg.classList.add('set-image');
                                baseImg.style.filter = 'grayscale(0%)';
                                baseImg.style.transition = 'filter 0.5s ease';
                                baseImg.style.cursor = 'pointer';

                                // Initialize state (logic unchanged)
                                const pathKeyIcon = `${category}/${item}`;
                                const savedIconState = savedState[pathKeyIcon]?.[num];
                                if (savedIconState?.grayed) {
                                    baseImg.style.filter = 'grayscale(100%)';
                                } else {
                                    baseImg.style.filter = 'grayscale(0%)';
                                }
                                container.appendChild(baseImg);
                                iconImgs[num] = baseImg;

                                let isAnimating = false;

                                // Click Handler (logic unchanged)
                                baseImg.addEventListener('click', function clickHandler() {
                                    // ... (implementation as before) ...
                                     if (isAnimatingContainer) return;
                                     if (isAnimating) return;

                                     baseImg.removeEventListener('click', clickHandler);
                                     const overlay = overlayImgs[num];
                                     if (!overlay) {
                                         baseImg.addEventListener('click', clickHandler);
                                         return;
                                     }
                                     const isCurrentlyVisible = overlay.style.opacity === '1';
                                     const newVisibleState = !isCurrentlyVisible;

                                     overlay.style.opacity = newVisibleState ? '1' : '0';
                                     baseImg.style.filter = newVisibleState ? 'grayscale(100%)' : 'grayscale(0%)';

                                     const pathKey = `${category}/${item}`;
                                     if (!savedState[pathKey]) savedState[pathKey] = {};
                                     savedState[pathKey][num] = { visible: newVisibleState, grayed: newVisibleState };
                                     localStorage.setItem('vanityItemsStateRevamp', JSON.stringify(savedState));

                                     const container1 = gridItem.querySelector('.container-1');
                                     const mannequinDone = container1?.querySelector('img[alt="MannequinDone"]');
                                     const mannequinAdd = container1?.querySelector('img[alt="MannequinAdd"]');

                                     const currentSavedPiece = savedState[pathKey];
                                     let visibleCount = 0;
                                     if (currentSavedPiece) {
                                         visibleCount = Object.values(currentSavedPiece).filter(data => data.visible).length;
                                     }
                                     const allVisible = visibleCount === pieceCount;

                                     const wasAllVisibleBeforeClick = mannequinDone?.style.opacity === '1';

                                     const animationDoneCallback = () => {
                                         baseImg.addEventListener('click', clickHandler);
                                         isAnimating = false;
                                         setContainerAnimationState(false);
                                     };

                                     const startAnimation = () => {
                                         isAnimating = true;
                                         setContainerAnimationState(true);
                                     };

                                     const shouldAnimate = (allVisible && !wasAllVisibleBeforeClick) || (!allVisible && wasAllVisibleBeforeClick);

                                     if (shouldAnimate) {
                                         startAnimation();
                                         if (category === 'Medium' && mannequinAdd && mannequinDone) {
                                             animateMedium(allVisible, wasAllVisibleBeforeClick, mannequinAdd, mannequinDone, animationDoneCallback);
                                         } else if (category === 'Small' && mannequinDone) {
                                             animateSmall(allVisible, wasAllVisibleBeforeClick, mannequinDone, animationDoneCallback);
                                         } else if (category === 'Large' && mannequinDone) {
                                             animateLarge(allVisible, wasAllVisibleBeforeClick, mannequinDone, animationDoneCallback);
                                         } else {
                                             if(mannequinDone) mannequinDone.style.opacity = allVisible ? '1' : '0';
                                             if(mannequinAdd) mannequinAdd.style.opacity = allVisible ? '0' : '1';
                                             animationDoneCallback();
                                         }
                                     } else {
                                         animationDoneCallback();
                                     }
                                });
                            } catch (imgError) {
                                console.error(`Error loading icon image ${i} for ${category}/${item}:`, imgError);
                            }
                        }
                        // Append container to fragment
                        imagesContainerFragment.appendChild(container);
                    }
                    // Append fragment to DOM
                    imagesContainer.appendChild(imagesContainerFragment);

                    gridItem.appendChild(imagesContainer);
                    grid.appendChild(gridItem);
                } // End loop through items
            } // End loop through categories
        } catch (error) {
            console.error('Error loading fossil categories or items:', error);
        }
    }

    // Initial execution
    await loadContainersAndOverlays();

    // --- animateSmall, animateMedium, animateLarge functions remain the same ---
    // Keep animations as WEBP unless specified otherwise
    function animateSmall(allVisible, wasAllVisibleBeforeClick, mannequinDone, callback) {
        // ... (implementation as before, using .webp animation) ...
         const animImg = new Image();
         animImg.src = allVisible ? '/Images/Animation/SmallFossilDone.webp' : '/Images/Animation/SmallFossilDoneR.webp';
         animImg.classList.add('set-image');
         animImg.style.position = 'absolute';
         animImg.style.zIndex = 3;
         animImg.style.pointerEvents = 'none';

         mannequinDone.parentElement.appendChild(animImg);

         let timeDuration;
         if (allVisible && !wasAllVisibleBeforeClick) {
             timeDuration = 1150;
         } else {
             mannequinDone.style.opacity = '0';
             timeDuration = 750;
         }
         setTimeout(() => {
             if (animImg.parentElement) {
                animImg.remove();
             }
             mannequinDone.style.opacity = allVisible ? '1' : '0';
             callback();
         }, timeDuration);
    }

    function animateMedium(allVisible, wasAllVisibleBeforeClick, mannequinAdd, mannequinDone, callback) {
        // ... (implementation as before, using .webp animation) ...
        const animImg = new Image();
        animImg.src = allVisible ? '/Images/Animation/MediumFossilDone.webp' : '/Images/Animation/MediumFossilDoneR.webp';
        animImg.classList.add('set-image');
        animImg.style.position = 'absolute';
        animImg.style.zIndex = 3;
        animImg.style.pointerEvents = 'none';
        animImg.style.left = '65px';
        animImg.style.top = '35px';

        mannequinAdd.parentElement.appendChild(animImg);

        let timeDuration;
        if (allVisible && !wasAllVisibleBeforeClick) {
            mannequinAdd.style.opacity = '0';
            mannequinAdd.style.transition = 'opacity 0.2s ease';
            timeDuration = 1150;
        } else {
            mannequinAdd.style.opacity = '1';
            mannequinAdd.style.transition = 'opacity 0.2s ease';
            mannequinDone.style.opacity = '0';
            timeDuration = 750;
        }

        setTimeout(() => {
           if (animImg.parentElement) {
               animImg.remove();
           }
            mannequinDone.style.opacity = allVisible ? '1' : '0';
            if(mannequinAdd) mannequinAdd.style.opacity = allVisible ? '0' : '1';
            callback();
        }, timeDuration);
    }

    function animateLarge(allVisible, wasAllVisibleBeforeClick, mannequinDone, callback) {
        // ... (implementation as before, using .webp animation) ...
        const animImg = new Image();
        animImg.src = allVisible ? '/Images/Animation/LargeFossilDone.webp' : '/Images/Animation/LargeFossilDoneR.webp';
        animImg.classList.add('set-image');
        animImg.style.position = 'absolute';
        animImg.style.zIndex = 3;
        animImg.style.pointerEvents = 'none';
        animImg.style.left = '216px';
        animImg.style.top = '10.5px';

        mannequinDone.parentElement.appendChild(animImg);

        let timeDuration;
        if (allVisible && !wasAllVisibleBeforeClick) {
           mannequinDone.style.opacity = '0';
            timeDuration = 1725;
        } else {
            mannequinDone.style.opacity = '0';
            timeDuration = 1380;
        }

        setTimeout(() => {
           if (animImg.parentElement) {
               animImg.remove();
           }
            mannequinDone.style.opacity = allVisible ? '1' : '0';
            callback();
        }, timeDuration);
    }
});