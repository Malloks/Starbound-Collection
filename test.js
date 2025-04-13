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

                        container.appendChild(baseImg);

                        baseImg.addEventListener('click', () => {
                            const overlay = overlayImgs[num];
                            if (!overlay) return;

                            const visible = overlay.style.opacity === '1';
                            overlay.style.opacity = visible ? '0' : '1';
                            baseImg.style.filter = visible ? 'grayscale(0%)' : 'grayscale(100%)';

                            const pathKey = `${category}/${item}`;
                            if (!savedState[pathKey]) savedState[pathKey] = {};

                            savedState[pathKey][num] = {
                                visible: !visible,
                                grayed: !visible
                            };
                            localStorage.setItem('vanityItemsStateRevamp', JSON.stringify(savedState));

                            const allVisible = Object.keys(overlayImgs).every(key => overlayImgs[key].style.opacity === '1');
                            const container1 = gridItem.querySelector('.container-1');
                            const mannequinDone = container1?.querySelector('img[alt="MannequinDone"]');
                            const mannequinAdd = container1?.querySelector('img[alt="MannequinAdd"]');

                            mannequinDone.style.opacity = allVisible ? '1' : '0';
                            if (category === 'Medium' && mannequinAdd) {
                                mannequinAdd.style.opacity = allVisible ? '0' : '1';
                            }
                        });

                        const pathKey = `${category}/${item}`;
                        const savedPiece = savedState[pathKey];
                        if (savedPiece && savedPiece[num]) {
                            const state = savedPiece[num];
                            const overlay = overlayImgs[num];
                            if (overlay) overlay.style.opacity = state.visible ? '1' : '0';
                            baseImg.style.filter = state.grayed ? 'grayscale(100%)' : 'grayscale(0%)';
                        }
                    }
                }

                gridItem.appendChild(imagesContainer);
                grid.appendChild(gridItem);
            }
        }
    } catch (error) {
        console.error('Error loading fossil items:', error);
    }

    observer.observe(document.body, { childList: true, subtree: true });
});
