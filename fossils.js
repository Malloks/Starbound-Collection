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

    const getImage = async (src) => {
        if (imageCache.has(src)) {
            return imageCache.get(src).cloneNode();
        }
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                imageCache.set(src, img);
                resolve(img.cloneNode());
            };
            img.onerror = reject;
            img.src = src;
        });
    };

    const preloadAnimationFrames = async (animationFolder, totalFrames) => {
        const frameImages = [];
        const promises = [];
        for (let frame = 1; frame <= totalFrames; frame++) {
            const frameNumber = String(frame).padStart(4, '0');
            const framePath = `/Images/Animation/${animationFolder}/frame${frameNumber}.webp`;
            promises.push(getImage(framePath));
        }
        await Promise.all(promises).then(images => frameImages.push(...images));
        return frameImages;
    };

    let mediumAnimationFrames = [];
    let smallAnimationFrames = [];
    let largeAnimationFrames = [];
    let largeReverseAnimationFrames = [];
    try {
        await Promise.all([
            preloadAnimationFrames('MediumFossilDone', 40).then(frames => mediumAnimationFrames = frames),
            preloadAnimationFrames('SmallFossilDone', 40).then(frames => smallAnimationFrames = frames),
            preloadAnimationFrames('LargeFossilDone', 60).then(frames => largeAnimationFrames = frames),
            preloadAnimationFrames('LargeFossilDoneR', 48).then(frames => largeReverseAnimationFrames = frames)
        ]);
    } catch (error) {
        console.error('Error preloading animation frames:', error);
    }

    try {
        for (const category of categories) {
            const grid = gridElements[category];
            grid.setAttribute('data-category', category);

            const response = await fetch(`/images?folder=${baseFolder}/${category}`);
            if (!response.ok) throw new Error(`Failed to fetch ${category}: ${response.status}`);

            const items = await response.json();
            const itemFolders = items.reduce((acc, path) => {
                const subPath = path.replace(/^Images\//, '').replace(`${baseFolder}/${category}/`, '').replace(/\/[^/]+\.webp$/, '');
                if (!acc.includes(subPath)) acc.push(subPath);
                return acc;
            }, []);

            for (const item of itemFolders) {
                const itemResponse = await fetch(`/images?folder=${baseFolder}/${category}/${item}`);
                if (!itemResponse.ok) throw new Error(`Failed to fetch ${item}: ${itemResponse.status}`);
                const images = await itemResponse.json();

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

                for (let i = 0; i < pieceCount + 1; i++) {
                    const container = document.createElement('div');
                    container.classList.add('container', `container-${i + 1}`);
                    container.setAttribute('data-category', category);
                    imagesContainer.appendChild(container);

                    if (i === 0) {
                        const mannequin = await getImage(`/Images/Misc/${category}Display.webp`);
                        mannequin.alt = 'Mannequin';
                        mannequin.classList.add('set-image');
                        mannequin.style.zIndex = "1";

                        const mannequinDone = await getImage(`/Images/Misc/${category}DisplayDone.webp`);
                        mannequinDone.alt = 'MannequinDone';
                        mannequinDone.classList.add('set-image');
                        mannequinDone.style.zIndex = "2";
                        mannequinDone.style.opacity = "0";

                        if (category === 'Medium') {
                            const mannequinAdd = await getImage(`/Images/Misc/MediumDisplayPole.webp`);
                            mannequinAdd.alt = 'MannequinAdd';
                            mannequinAdd.classList.add('set-image');
                            mannequinAdd.style.zIndex = "0";
                            mannequinAdd.style.opacity = '1';
                            container.appendChild(mannequinAdd);
                        }

                        container.appendChild(mannequin);
                        container.appendChild(mannequinDone);

                        for (let j = 1; j <= pieceCount; j++) {
                            const num = `0${j}`;
                            const overlayPath = images.find(img => img.includes(`${num}_On.webp`));
                            if (!overlayPath) continue;
                            const overlay = await getImage(`/${overlayPath}`);
                            overlay.alt = `Overlay ${num}`;
                            overlay.classList.add('set-image');
                            overlay.style.opacity = '0';
                            overlay.style.transition = 'opacity 0.5s ease';
                            container.appendChild(overlay);
                            overlayImgs[num] = overlay;
                        }

                        const savedPiece = savedState[`${category}/${item}`];
                        if (savedPiece) {
                            Object.entries(savedPiece).forEach(([num, data]) => {
                                if (overlayImgs[num]) overlayImgs[num].style.opacity = data.visible ? '1' : '0';
                            });
                            const mannequinDoneElem = container.querySelector('img[alt="MannequinDone"]');
                            const mannequinAddElem = container.querySelector('img[alt="MannequinAdd"]');
                            const allVisible = Object.keys(savedPiece).every(key => savedPiece[key].visible);
                            mannequinDoneElem.style.opacity = allVisible ? '1' : '0';
                            if (mannequinAddElem) mannequinAddElem.style.opacity = allVisible ? '0' : '1';
                        }
                    } else {
                        const num = `0${i}`;
                        const iconPath = images.find(img => img.includes(`${num}.webp`));
                        if (!iconPath) continue;
                        const baseImg = await getImage(`/${iconPath}`);
                        baseImg.alt = `Icon ${num}`;
                        baseImg.classList.add('set-image');
                        baseImg.style.filter = 'grayscale(0%)';
                        baseImg.style.transition = 'filter 0.5s ease';
                        const savedPiece = savedState[`${category}/${item}`]?.[num];
                        if (savedPiece?.grayed) baseImg.style.filter = 'grayscale(100%)';
                        container.appendChild(baseImg);
                        iconImgs[num] = baseImg;

                        baseImg.addEventListener('click', function clickHandler() {
                            // disable click during animation
                            baseImg.removeEventListener('click', clickHandler);

                            const overlay = overlayImgs[num];
                            if (!overlay) return;
                            const visible = overlay.style.opacity === '1';
                            overlay.style.opacity = visible ? '0' : '1';
                            baseImg.style.filter = visible ? 'grayscale(0%)' : 'grayscale(100%)';
                            const pathKey = `${category}/${item}`;
                            if (!savedState[pathKey]) savedState[pathKey] = {};
                            savedState[pathKey][num] = { visible: !visible, grayed: !visible };
                            localStorage.setItem('vanityItemsStateRevamp', JSON.stringify(savedState));

                            const container1 = gridItem.querySelector('.container-1');
                            const mannequinDone = container1?.querySelector('img[alt="MannequinDone"]');
                            const mannequinAdd = container1?.querySelector('img[alt="MannequinAdd"]');
                            const allVisible = Object.keys(overlayImgs).every(key => overlayImgs[key].style.opacity === '1');
                            const wasAllVisibleBeforeClick = mannequinDone?.style.opacity === '1';

                            const animationDoneCallback = () => {
                                baseImg.addEventListener('click', clickHandler);
                            };

                            if (category === 'Medium' && mannequinAdd) {
                                if ((allVisible && !wasAllVisibleBeforeClick) || (!allVisible && wasAllVisibleBeforeClick)) {
                                    animateMedium(allVisible, wasAllVisibleBeforeClick, mannequinAdd, mannequinDone, animationDoneCallback);
                                } else {
                                    animationDoneCallback();
                                }
                            } else if (category === 'Small') {
                                animateSmall(allVisible, wasAllVisibleBeforeClick, mannequinDone, animationDoneCallback);
                            } else if (category === 'Large') {
                                animateLarge(allVisible, wasAllVisibleBeforeClick, mannequinDone, animationDoneCallback);
                            } else {
                                if (mannequinDone) mannequinDone.style.opacity = allVisible ? '1' : '0';
                                animationDoneCallback();
                            }
                        });
                    }
                }
                gridItem.appendChild(imagesContainer);
                grid.appendChild(gridItem);
            }
        }
    } catch (error) {
        console.error('Error loading fossil items:', error);
    }

    function animateMedium(allVisible, wasAllVisibleBeforeClick, mannequinAdd, mannequinDone, callback) {
        let frame = allVisible && !wasAllVisibleBeforeClick ? 1 : 26;
        const interval = setInterval(async () => {
            try {
                const frameImg = await getImage(`/Images/Animation/MediumFossilDone/frame${String(frame).padStart(4, '0')}.webp`);
                frameImg.classList.add('set-image');
                frameImg.style.position = 'absolute';
                frameImg.style.zIndex = '10';
                frameImg.style.left = '65px';
                frameImg.style.top = '35px';
                mannequinAdd.parentElement.appendChild(frameImg);
                setTimeout(() => frameImg.remove(), 20);
                if (frame === 26 && mannequinDone) mannequinDone.style.opacity = '0';
                frame = allVisible && !wasAllVisibleBeforeClick ? frame + 1 : frame - 1;
                if (frame < 1 || frame > 40) {
                    clearInterval(interval);
                    if (allVisible && !wasAllVisibleBeforeClick) {
                        mannequinAdd.style.opacity = '0';
                        mannequinAdd.style.transition = 'opacity 0.5s ease';
                        if (mannequinDone) mannequinDone.style.opacity = '1';
                    } else if (!allVisible && wasAllVisibleBeforeClick) {
                        mannequinAdd.style.opacity = '1';
                        mannequinAdd.style.transition = 'opacity 0.5s ease';
                    }
                    callback();
                }
            } catch (error) {
                console.error("Error loading animation frame:", error);
                clearInterval(interval);
                callback();
            }
        }, 20);
    }

    function animateSmall(allVisible, wasAllVisibleBeforeClick, mannequinDone, callback) {
        let frame = allVisible && !wasAllVisibleBeforeClick ? 1 : 26;
        const interval = setInterval(async () => {
            try {
                const frameImg = await getImage(`/Images/Animation/SmallFossilDone/frame${String(frame).padStart(4, '0')}.webp`);
                frameImg.classList.add('set-image');
                frameImg.style.position = 'absolute';
                frameImg.style.zIndex = '10';
                frameImg.style.left = '65px';
                frameImg.style.top = '10px';
                mannequinDone.parentElement.appendChild(frameImg);
                setTimeout(() => frameImg.remove(), 20);
                if (frame === 26) mannequinDone.style.opacity = '0';
                frame = allVisible && !wasAllVisibleBeforeClick ? frame + 1 : frame - 1;
                if (frame < 1 || frame > 40) {
                    clearInterval(interval);
                    if (allVisible && !wasAllVisibleBeforeClick) mannequinDone.style.opacity = '1';
                    callback();
                }
            } catch (error) {
                console.error("Error loading animation frame:", error);
                clearInterval(interval);
                callback();
            }
        }, 20);
    }

    function animateLarge(allVisible, wasAllVisibleBeforeClick, mannequinDone, callback) {
        let frame = allVisible && !wasAllVisibleBeforeClick ? 1 : 48;
        const interval = setInterval(async () => {
            try {
                if (!allVisible && wasAllVisibleBeforeClick && frame === 48) {
                    mannequinDone.style.opacity = '0';
                }
                const frameImg = await getImage(allVisible && !wasAllVisibleBeforeClick ? `/Images/Animation/LargeFossilDone/frame${String(frame).padStart(4, '0')}.webp` : `/Images/Animation/LargeFossilDoneR/frame${String(frame).padStart(4, '0')}.webp`);
                frameImg.classList.add('set-image');
                frameImg.style.position = 'absolute';
                frameImg.style.zIndex = '10';
                frameImg.style.left = '216px';
                frameImg.style.top = '10.5px';
                mannequinDone.parentElement.appendChild(frameImg);
                setTimeout(() => frameImg.remove(), 32);
                frame = allVisible && !wasAllVisibleBeforeClick ? frame + 1 : frame - 1;
                if (frame < 1 || frame > (allVisible && !wasAllVisibleBeforeClick ? 60 : 48)) {
                    clearInterval(interval);
                    if (allVisible && !wasAllVisibleBeforeClick) mannequinDone.style.opacity = '1';
                    callback();
                }
            } catch (error) {
                console.error("Error loading animation frame:", error);
                clearInterval(interval);
                callback();
            }
        }, 32);
    }
});