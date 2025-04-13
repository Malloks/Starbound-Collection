document.addEventListener('DOMContentLoaded', async () => {
    const savedState = JSON.parse(localStorage.getItem('vanityItemsStateRevamp')) || {};

    const categories = ['Small', 'Medium', 'Large'];
    const baseFolder = 'Fossils';

    const gridElements = {
        'Small': document.getElementById('small-grid'),
        'Medium': document.getElementById('medium-grid'),
        'Large': document.getElementById('large-grid')
    };

    try {
        for (const category of categories) {
            const grid = gridElements[category];
            grid.setAttribute('data-category', category);

            const response = await fetch(`/images?folder=${baseFolder}/${category}`);
            if (!response.ok) throw new Error(`Failed to fetch ${category}: ${response.status}`);

            const items = await response.json();
            const itemFolders = [];

            items.forEach(path => {
                const subPath = path
                    .replace(/^Images\//, '')
                    .replace(`${baseFolder}/${category}/`, '')
                    .replace(/\/[^/]+\.png$/, '');
                if (!itemFolders.includes(subPath)) itemFolders.push(subPath);
            });

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
                        const mannequin = document.createElement('img');
                        mannequin.src = `/Images/Misc/${category}Display.png`;
                        mannequin.alt = 'Mannequin';
                        mannequin.classList.add('set-image');
                        mannequin.style.zIndex = "1";

                        const mannequinDone = document.createElement('img');
                        mannequinDone.src = `/Images/Misc/${category}DisplayDone.png`;
                        mannequinDone.alt = 'MannequinDone';
                        mannequinDone.classList.add('set-image');
                        mannequinDone.style.zIndex = "2";
                        mannequinDone.style.opacity = "0";

                        if (category === 'Medium') {
                            const mannequinAdd = document.createElement('img');
                            mannequinAdd.src = `/Images/Misc/MediumDisplayPole.png`;
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
                            const overlayPath = images.find(img => img.includes(`${num}_On.png`));
                            if (!overlayPath) continue;

                            const overlay = document.createElement('img');
                            overlay.src = `/${overlayPath}`;
                            overlay.alt = `Overlay ${num}`;
                            overlay.classList.add('set-image');
                            overlay.style.opacity = '0';
                            overlay.style.transition = 'opacity 0.5s ease';

                            container.appendChild(overlay);
                            overlayImgs[num] = overlay;
                        }

                        const pathKey = `${category}/${item}`;
                        const savedPiece = savedState[pathKey];

                        if (savedPiece) {
                            Object.entries(savedPiece).forEach(([num, data]) => {
                                if (overlayImgs[num]) {
                                    overlayImgs[num].style.opacity = data.visible ? '1' : '0';
                                }
                            });

                            const mannequinDoneElem = container.querySelector('img[alt="MannequinDone"]');
                            const mannequinAddElem = container.querySelector('img[alt="MannequinAdd"]');
                            const allVisible = Object.keys(savedPiece).every(key => savedPiece[key].visible);

                            mannequinDoneElem.style.opacity = allVisible ? '1' : '0';
                            if (mannequinAddElem) mannequinAddElem.style.opacity = allVisible ? '0' : '1';
                        }
                    } else {
                        const num = `0${i}`;
                        const iconPath = images.find(img => img.includes(`${num}.png`));
                        if (!iconPath) continue;

                        const baseImg = document.createElement('img');
                        baseImg.src = `/${iconPath}`;
                        baseImg.alt = `Icon ${num}`;
                        baseImg.classList.add('set-image');
                        baseImg.style.filter = 'grayscale(0%)';
                        baseImg.style.transition = 'filter 0.5s ease';

                        const pathKey = `${category}/${item}`;
                        const savedPiece = savedState[pathKey]?.[num];
                        if (savedPiece?.grayed) {
                            baseImg.style.filter = 'grayscale(100%)';
                        }

                        container.appendChild(baseImg);
                        iconImgs[num] = baseImg;

                        baseImg.addEventListener('click', () => {
                            const overlay = overlayImgs[num];
                            if (!overlay) return;

                            const visible = overlay.style.opacity === '1';
                            overlay.style.opacity = visible ? '0' : '1';
                            baseImg.style.filter = visible ? 'grayscale(0%)' : 'grayscale(100%)';

                            if (!savedState[pathKey]) savedState[pathKey] = {};
                            savedState[pathKey][num] = {
                                visible: !visible,
                                grayed: !visible
                            };
                            localStorage.setItem('vanityItemsStateRevamp', JSON.stringify(savedState));

                            const container1 = gridItem.querySelector('.container-1');
                            const mannequinDone = container1?.querySelector('img[alt="MannequinDone"]');
                            const mannequinAdd = container1?.querySelector('img[alt="MannequinAdd"]');

                            const allVisible = Object.keys(overlayImgs).every(key => overlayImgs[key].style.opacity === '1');
                            const wasAllVisibleBeforeClick = mannequinDone?.style.opacity === '1';

                            if (category === 'Medium' && mannequinAdd) {
                                if (allVisible && !wasAllVisibleBeforeClick) {
                                    const animationImg = document.createElement('img');
                                    animationImg.classList.add('set-image');
                                    animationImg.style.position = 'absolute';
                                    animationImg.style.zIndex = '10';
                                    animationImg.style.left = '65px';
                                    animationImg.style.top = '35px';
                                    mannequinAdd.parentElement.appendChild(animationImg);

                                    let frame = 1;
                                    const totalFrames = 40;

                                    const interval = setInterval(() => {
                                        const frameNumber = String(frame).padStart(4, '0');
                                        animationImg.src = `/Images/Animation/MediumFossilDone/frame${frameNumber}.png`;
                                        frame++;

                                        if (frame > totalFrames) {
                                            clearInterval(interval);
                                            animationImg.remove();

                                            mannequinAdd.style.opacity = '0';
                                            mannequinAdd.style.transition = 'opacity 0.5s ease';

                                            if (mannequinDone) {
                                                mannequinDone.style.opacity = '1';
                                            }
                                        }
                                    }, 20);
                                } else if (!allVisible && wasAllVisibleBeforeClick) {
                                    mannequinAdd.style.opacity = '1';
                                    mannequinAdd.style.transition = 'opacity 0.5s ease';

                                    const reverseAnimationImg = document.createElement('img');
                                    reverseAnimationImg.classList.add('set-image');
                                    reverseAnimationImg.style.position = 'absolute';
                                    reverseAnimationImg.style.zIndex = '10';
                                    reverseAnimationImg.style.left = '65px';
                                    reverseAnimationImg.style.top = '35px';
                                    mannequinAdd.parentElement.appendChild(reverseAnimationImg);

                                    let frame = 26;

                                    const interval = setInterval(() => {
                                        const frameNumber = String(frame).padStart(4, '0');
                                        reverseAnimationImg.src = `/Images/Animation/MediumFossilDone/frame${frameNumber}.png`;

                                        if (frame === 26) {
                                            if (mannequinDone) {
                                                mannequinDone.style.opacity = '0';
                                            }
                                        }

                                        frame--;

                                        if (frame < 1) {
                                            clearInterval(interval);
                                            reverseAnimationImg.remove();
                                        }
                                    }, 20);
                                }
                            } else if (category === 'Small') {
                                if (allVisible && !wasAllVisibleBeforeClick) {
                                    const animationImg = document.createElement('img');
                                    animationImg.classList.add('set-image');
                                    animationImg.style.position = 'absolute';
                                    animationImg.style.zIndex = '10';
                                    animationImg.style.left = '65px';
                                    animationImg.style.top = '10px';
                                    mannequinDone.parentElement.appendChild(animationImg);

                                    let frame = 1;
                                    const totalFrames = 40;

                                    const interval = setInterval(() => {
                                        const frameNumber = String(frame).padStart(4, '0');
                                        animationImg.src = `/Images/Animation/SmallFossilDone/frame${frameNumber}.png`;
                                        frame++;

                                        if (frame > totalFrames) {
                                            clearInterval(interval);
                                            animationImg.remove();

                                            mannequinDone.style.opacity = '1';
                                        }
                                    }, 20);
                                } else if (!allVisible && wasAllVisibleBeforeClick) {
                                    const reverseAnimationImg = document.createElement('img');
                                    reverseAnimationImg.classList.add('set-image');
                                    reverseAnimationImg.style.position = 'absolute';
                                    reverseAnimationImg.style.zIndex = '10';
                                    reverseAnimationImg.style.left = '65px';
                                    reverseAnimationImg.style.top = '10px';
                                    mannequinDone.parentElement.appendChild(reverseAnimationImg);

                                    let frame = 26;

                                    const interval = setInterval(() => {
                                        const frameNumber = String(frame).padStart(4, '0');
                                        reverseAnimationImg.src = `/Images/Animation/SmallFossilDone/frame${frameNumber}.png`;

                                        if (frame === 26) {
                                            mannequinDone.style.opacity = '0';
                                        }

                                        frame--;

                                        if (frame < 1) {
                                            clearInterval(interval);
                                            reverseAnimationImg.remove();
                                        }
                                    }, 20);
                                }
                            } else {
                                mannequinDone.style.opacity = allVisible ? '1' : '0';
                                mannequinDone.style.transition = 'opacity 0.5s ease';
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
});
