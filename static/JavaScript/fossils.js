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

    const normalizeAssetPath = (path) => (path.startsWith('/') ? path : `/${path}`);

    const getImage = (src) => {
        const normalized = normalizeAssetPath(src);
        if (!imageCache.has(normalized)) {
            const template = new Image();
            template.src = normalized;
            template.decoding = 'async';
            template.loading = 'lazy';
            imageCache.set(normalized, template);
        }
        const clone = imageCache.get(normalized).cloneNode();
        clone.decoding = 'async';
        clone.loading = 'lazy';
        return clone;
    };

    const findAsset = (assetList, predicate) => assetList.find(predicate);

    const createGridItem = (category, item, assetList) => {
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');
        gridItem.setAttribute('data-category', category);
        gridItem.setAttribute('data-item', item);

        const setNameDiv = document.createElement('div');
        setNameDiv.classList.add('set-name');
        setNameDiv.innerText = item;
        gridItem.appendChild(setNameDiv);

        const imagesContainer = document.createElement('div');
        imagesContainer.classList.add('images-container');

        const overlayImgs = {};
        const iconImgs = {};
        const pieceCount = category === 'Small' ? 1 : category === 'Medium' ? 3 : 5;
        let isAnimatingContainer = false;

        const setContainerAnimationState = (animating) => {
            isAnimatingContainer = animating;
            Object.values(iconImgs).forEach((iconImg) => {
                iconImg.style.cursor = animating ? 'default' : 'pointer';
            });
        };

        const imagesContainerFragment = document.createDocumentFragment();

        for (let i = 0; i < pieceCount + 1; i++) {
            const container = document.createElement('div');
            container.classList.add('container', `container-${i + 1}`);
            container.setAttribute('data-category', category);

            if (i === 0) {
                container.style.position = 'relative';
                container.style.overflow = 'visible';

                try {
                    const mannequin = getImage(`/Resources/Misc/${category}Display.webp`);
                    mannequin.alt = 'Mannequin';
                    mannequin.classList.add('set-image');
                    mannequin.style.zIndex = '1';

                    const mannequinDone = getImage(`/Resources/Misc/${category}DisplayDone.webp`);
                    mannequinDone.alt = 'MannequinDone';
                    mannequinDone.classList.add('set-image');
                    mannequinDone.style.zIndex = '2';
                    mannequinDone.style.opacity = '0';

                    let mannequinAdd = null;
                    if (category === 'Medium') {
                        mannequinAdd = getImage(`/Resources/Misc/MediumDisplayPole.webp`);
                        mannequinAdd.alt = 'MannequinAdd';
                        mannequinAdd.classList.add('set-image');
                        mannequinAdd.style.zIndex = '0';
                        mannequinAdd.style.opacity = '1';
                        container.appendChild(mannequinAdd);
                    }

                    container.appendChild(mannequin);
                    container.appendChild(mannequinDone);

                    for (let j = 1; j <= pieceCount; j++) {
                        const num = `0${j}`;
                        let overlayPath = findAsset(assetList, (path) => path.endsWith(`${num}_On.png`));
                        if (!overlayPath) {
                            overlayPath = findAsset(assetList, (path) => path.endsWith(`${num}_On.webp`));
                        }
                        if (!overlayPath) {
                            console.warn(`Overlay image ${num}_On.(png/webp) not found for ${category}/${item}`);
                            continue;
                        }

                        const overlay = getImage(overlayPath);
                        overlay.alt = `Overlay ${num}`;
                        overlay.classList.add('set-image');
                        overlay.style.opacity = '0';
                        overlay.style.transition = 'opacity 0.5s ease';
                        container.appendChild(overlay);
                        overlayImgs[num] = overlay;
                    }

                    const pathKeyInit = `${category}/${item}`;
                    const savedPieceInit = savedState[pathKeyInit];
                    if (savedPieceInit) {
                        const visibleCountInit = Object.values(savedPieceInit).filter((data) => data.visible).length;
                        const allVisibleInit = visibleCountInit === pieceCount;

                        Object.entries(savedPieceInit).forEach(([num, data]) => {
                            if (overlayImgs[num]) {
                                overlayImgs[num].style.opacity = data.visible ? '1' : '0';
                            }
                        });

                        mannequinDone.style.opacity = allVisibleInit ? '1' : '0';
                        if (mannequinAdd) {
                            mannequinAdd.style.opacity = allVisibleInit ? '0' : '1';
                        }
                    } else {
                        mannequinDone.style.opacity = '0';
                        if (mannequinAdd) {
                            mannequinAdd.style.opacity = '1';
                        }
                    }
                } catch (imgError) {
                    console.error(`Error loading base/overlay images for ${category}/${item}:`, imgError);
                }
            } else {
                try {
                    const num = `0${i}`;
                    let iconPath = findAsset(assetList, (path) => path.endsWith(`${num}.png`) && !path.includes('_On.'));
                    if (!iconPath) {
                        iconPath = findAsset(assetList, (path) => path.endsWith(`${num}.webp`) && !path.includes('_On.'));
                    }
                    if (!iconPath) {
                        console.warn(`Icon image ${num}.(png/webp) not found for ${category}/${item}`);
                        continue;
                    }

                    const baseImg = getImage(iconPath);
                    baseImg.alt = `Icon ${num}`;
                    baseImg.classList.add('set-image');
                    baseImg.style.filter = 'grayscale(0%)';
                    baseImg.style.transition = 'filter 0.5s ease';
                    baseImg.style.cursor = 'pointer';

                    const pathKeyIcon = `${category}/${item}`;
                    const savedIconState = savedState[pathKeyIcon]?.[num];
                    if (savedIconState?.grayed) {
                        baseImg.style.filter = 'grayscale(100%)';
                    } else {
                        baseImg.style.filter = 'grayscale(0%)';
                    }
                    container.appendChild(baseImg);
                    iconImgs[num] = baseImg;

                    baseImg.addEventListener('click', function clickHandler() {
                        const container1 = gridItem.querySelector('.container-1');
                        const mannequinDone = container1.querySelector('img[alt="MannequinDone"]');
                        const mannequinAdd = container1.querySelector('img[alt="MannequinAdd"]');
                        const pathKey = `${category}/${item}`;
                        if (isAnimatingContainer) return;

                        const animationDoneCallback = () => {
                            baseImg.addEventListener('click', clickHandler);
                            setContainerAnimationState(false);
                        };

                        const startAnimation = () => {
                            setContainerAnimationState(true);
                        };

                        const overlay = overlayImgs[num];
                        if (!overlay) return;
                        const wasAllVisibleBeforeClick = mannequinDone.style.opacity === '1';
                        const newVisible = overlay.style.opacity !== '1';
                        overlay.style.opacity = newVisible ? '1' : '0';
                        baseImg.style.filter = newVisible ? 'grayscale(100%)' : 'grayscale(0%)';

                        savedState[pathKey] = savedState[pathKey] || {};
                        savedState[pathKey][num] = { visible: newVisible, grayed: newVisible };
                        localStorage.setItem('vanityItemsStateRevamp', JSON.stringify(savedState));

                        const visibleCount = Object.values(savedState[pathKey]).filter((d) => d.visible).length;
                        const allVisible = visibleCount === pieceCount;
                        const shouldAnim = (allVisible && !wasAllVisibleBeforeClick)
                            || (!allVisible && wasAllVisibleBeforeClick);

                        if (shouldAnim) {
                            startAnimation();

                            const container1El = gridItem.querySelector('.container-1');
                            container1El
                                .querySelectorAll('.fossil-anim-img')
                                .forEach((el) => el.remove());

                            if (category === 'Medium' && mannequinAdd && mannequinDone) {
                                animateMedium(allVisible, wasAllVisibleBeforeClick, mannequinAdd, mannequinDone, animationDoneCallback);
                            } else if (category === 'Small' && mannequinDone) {
                                animateSmall(allVisible, wasAllVisibleBeforeClick, mannequinDone, animationDoneCallback);
                            } else if (category === 'Large' && mannequinDone) {
                                animateLarge(allVisible, wasAllVisibleBeforeClick, mannequinDone, animationDoneCallback);
                            } else {
                                if (mannequinDone) mannequinDone.style.opacity = allVisible ? '1' : '0';
                                if (mannequinAdd) mannequinAdd.style.opacity = allVisible ? '0' : '1';
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

            imagesContainerFragment.appendChild(container);
        }

        imagesContainer.appendChild(imagesContainerFragment);
        gridItem.appendChild(imagesContainer);
        return gridItem;
    };

    const groupAssetsByItem = (category, assetPaths) => {
        const grouped = new Map();
        const regex = new RegExp(`^(?:Resources/)?Images/${baseFolder}/${category}/([^/]+)/`);

        assetPaths.forEach((path) => {
            const match = path.match(regex);
            if (!match || !match[1]) {
                return;
            }
            const item = match[1];
            if (!grouped.has(item)) {
                grouped.set(item, []);
            }
            grouped.get(item).push(path);
        });

        return grouped;
    };

    const renderCategory = async (category) => {
        const grid = gridElements[category];
        grid.setAttribute('data-category', category);
        grid.innerHTML = '';

        const response = await fetch(`/images?folder=${baseFolder}/${category}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${category}: ${response.status}`);
        }
        const assetPaths = await response.json();
        const assetsByItem = groupAssetsByItem(category, assetPaths);

        const fragment = document.createDocumentFragment();
        assetsByItem.forEach((assets, item) => {
            if (!assets || assets.length === 0) {
                return;
            }
            const gridItem = createGridItem(category, item, assets);
            fragment.appendChild(gridItem);
        });

        grid.appendChild(fragment);
    };

    async function loadContainersAndOverlays() {
        try {
            await Promise.all(categories.map((category) => renderCategory(category)));
        } catch (error) {
            console.error('Error loading fossil categories or items:', error);
        }
    }

    // Initial execution
    await loadContainersAndOverlays();

    // --- animateSmall, animateMedium, animateLarge functions remain the same ---
    // Keep animations as WEBP unless specified otherwise
    function animateSmall(allVisible, wasAllVisibleBeforeClick, mannequinDone, callback) {
        const animImg = new Image();
        // force-reload so each <img> restarts its WebP animation
        const smallUrl = allVisible
          ? `/Resources/Animation/SmallFossilDone.webp?reload=${Date.now()}`
          : `/Resources/Animation/SmallFossilDoneR.webp?reload=${Date.now()}`;
        animImg.src = smallUrl;
    
        animImg.classList.add('set-image', 'fossil-anim-img');
        animImg.style.position = 'absolute';
        animImg.style.zIndex   = 3;
        animImg.style.pointerEvents = 'none';
    
        mannequinDone.parentElement.appendChild(animImg);

         let timeDuration;
         if (allVisible && !wasAllVisibleBeforeClick) {
             timeDuration = 1150;
         } else {
             timeDuration = 750;
         }

         if (!(allVisible && !wasAllVisibleBeforeClick)) {
             const hideMannequin = () => {
                 mannequinDone.style.opacity = '0';
             };
             if (animImg.complete && animImg.naturalWidth > 0) {
                 requestAnimationFrame(hideMannequin);
             } else {
                 animImg.addEventListener('load', () => requestAnimationFrame(hideMannequin), { once: true });
             }
             animImg.addEventListener('error', hideMannequin, { once: true });
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
        const animImg = new Image();
        // force-reload so each <img> restarts its WebP animation
        const medUrl = allVisible
          ? `/Resources/Animation/MediumFossilDone.webp?reload=${Date.now()}`
          : `/Resources/Animation/MediumFossilDoneR.webp?reload=${Date.now()}`;
        animImg.src = medUrl;
    
        animImg.classList.add('set-image', 'fossil-anim-img');
        animImg.style.position = 'absolute';
        animImg.style.left     = '65px';
        animImg.style.top      = '35px';
        animImg.style.zIndex   = 3;
        animImg.style.pointerEvents = 'none';
    
        mannequinAdd.parentElement.appendChild(animImg);

        let timeDuration;
        if (allVisible && !wasAllVisibleBeforeClick) {
            mannequinAdd.style.opacity = '0';
            mannequinAdd.style.transition = 'opacity 0.2s ease';
            timeDuration = 1150;
        } else {
            mannequinAdd.style.opacity = '1';
            mannequinAdd.style.transition = 'opacity 0.2s ease';
            timeDuration = 750;
        }

        if (!(allVisible && !wasAllVisibleBeforeClick)) {
            const hideTargets = () => {
                mannequinDone.style.opacity = '0';
            };
            if (animImg.complete && animImg.naturalWidth > 0) {
                requestAnimationFrame(hideTargets);
            } else {
                animImg.addEventListener('load', () => requestAnimationFrame(hideTargets), { once: true });
            }
            animImg.addEventListener('error', hideTargets, { once: true });
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
        const animImg = new Image();
        // force-reload so each <img> restarts its WebP animation
        const largeUrl = allVisible
          ? `/Resources/Animation/LargeFossilDone.webp?reload=${Date.now()}`
          : `/Resources/Animation/LargeFossilDoneR.webp?reload=${Date.now()}`;
        animImg.src = largeUrl;

        animImg.classList.add('set-image', 'fossil-anim-img');
        animImg.style.position = 'absolute';
        animImg.style.left     = '216px';
        animImg.style.top      = '10.5px';
        animImg.style.zIndex   = 3;
        animImg.style.pointerEvents = 'none';

        mannequinDone.parentElement.appendChild(animImg);

        let timeDuration;
        if (allVisible && !wasAllVisibleBeforeClick) {
           mannequinDone.style.opacity = '0';
            timeDuration = 1725;
        } else {
            timeDuration = 1380;
        }

        if (!(allVisible && !wasAllVisibleBeforeClick)) {
            const hideMannequin = () => {
                mannequinDone.style.opacity = '0';
            };
            if (animImg.complete && animImg.naturalWidth > 0) {
                requestAnimationFrame(hideMannequin);
            } else {
                animImg.addEventListener('load', () => requestAnimationFrame(hideMannequin), { once: true });
            }
            animImg.addEventListener('error', hideMannequin, { once: true });
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