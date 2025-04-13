document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM content loaded');

    const grid = document.getElementById('grid');
    const savedState = JSON.parse(localStorage.getItem('vanityItemsStateRevamp')) || {};

    try {
        const response = await fetch('/images?folder=Vanity Revamp');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const folders = await response.json();
        const folderPaths = [];

        folders.forEach(folder => {
            const folderPath = folder
                .replace(/^Images\//, '')
                .replace(/^Vanity Revamp\//, '')
                .replace(/\/[^/]+\.png$/, '');

            if (!folderPaths.includes(folderPath)) {
                folderPaths.push(folderPath);
            }
        });

        for (const folderPath of folderPaths) {
            const folderResponse = await fetch(`/images?folder=Vanity Revamp/${folderPath}`);
            if (!folderResponse.ok) throw new Error(`HTTP error for folder ${folderPath}: ${folderResponse.status}`);

            const images = await folderResponse.json();
            console.log(`Images for ${folderPath}:`, images);

            const gridItem = document.createElement('div');
            gridItem.classList.add('grid-item');

            const imagesContainer = document.createElement('div');
            imagesContainer.classList.add('images-container');

            const setNameDiv = document.createElement('div');
            setNameDiv.classList.add('set-name');
            setNameDiv.innerText = folderPath;
            gridItem.appendChild(setNameDiv);

            const overlayImgs = {};
            const baseImgs = {};
            let mannequinImg = null;

            for (let i = 0; i < 5; i++) {
                const container = document.createElement('div');
                container.classList.add('container', `container-${i + 1}`);
                imagesContainer.appendChild(container);

                if (i === 0) {
                    mannequinImg = document.createElement('img');
                    mannequinImg.src = '/Images/Misc/Mannequin.png';
                    mannequinImg.alt = 'Mannequin';
                    mannequinImg.classList.add('set-image');
                    mannequinImg.style.transition = 'filter 0.5s ease';
                    container.appendChild(mannequinImg);

                    for (let j = 1; j <= 4; j++) {
                        const num = `0${j}`;
                        const overlayImgPath = images.find(img => img.includes(`${num}_On.png`));
                        if (!overlayImgPath) continue;

                        const overlayImg = document.createElement('img');
                        overlayImg.src = `/${overlayImgPath}`;
                        overlayImg.alt = `Overlay ${num}`;
                        overlayImg.classList.add('set-image');
                        overlayImg.style.opacity = '0';
                        overlayImg.style.transition = 'opacity 0.5s ease';

                        container.appendChild(overlayImg);
                        overlayImgs[num] = overlayImg;
                    }
                } else {
                    const num = `0${i}`;
                    const baseImgPath = images.find(img => img.includes(`${num}.png`));
                    if (!baseImgPath) continue;

                    const baseImg = document.createElement('img');
                    baseImg.src = `/${baseImgPath}`;
                    baseImg.alt = `Icon ${num}`;
                    baseImg.classList.add('set-image');
                    baseImg.style.transition = 'filter 0.5s ease';

                    baseImgs[num] = baseImg;
                    container.appendChild(baseImg);

                    const state = savedState[folderPath]?.[num]?.visible ?? false;

                    if (state) {
                        overlayImgs[num].style.opacity = '1';
                        baseImg.style.filter = 'grayscale(100%)';
                    } else {
                        overlayImgs[num].style.opacity = '0';
                        baseImg.style.filter = 'grayscale(0%)';
                    }

                    baseImg.addEventListener('click', () => {
                        const overlay = overlayImgs[num];
                        if (!overlay) return;

                        const currentlyVisible = overlay.style.opacity === '1';
                        overlay.style.opacity = currentlyVisible ? '0' : '1';
                        baseImg.style.filter = currentlyVisible ? 'grayscale(0%)' : 'grayscale(100%)';

                        if (!savedState[folderPath]) savedState[folderPath] = {};
                        savedState[folderPath][num] = { visible: !currentlyVisible };
                        localStorage.setItem('vanityItemsStateRevamp', JSON.stringify(savedState));

                        // Check if all overlays are visible
                        const allVisible = ['01', '02', '03', '04'].every(n => savedState[folderPath]?.[n]?. visible);
                        mannequinImg.src = allVisible ? '/Images/Misc/GoldMannequin.png' : '/Images/Misc/Mannequin.png';
                    });
                }
            }

            // Double-check on load if all overlays are active for this set
            const allVisibleOnLoad = ['01', '02', '03', '04'].every(n => savedState[folderPath]?.[n]?.visible);
            mannequinImg.src = allVisibleOnLoad ? '/Images/Misc/GoldMannequin.png' : '/Images/Misc/Mannequin.png';

            gridItem.appendChild(imagesContainer);
            grid.appendChild(gridItem);
        }
    } catch (error) {
        console.error('Failed to fetch vanity revamp items:', error);
    }

    // Drag reveal functionality
    const observer = new MutationObserver(() => {
        const container1s = document.querySelectorAll('.container-1');

        container1s.forEach(container => {
            const overlays = container.querySelectorAll('img:not([src*="Mannequin"])');

            overlays.forEach(overlay => {
                const line = document.createElement('div');
                line.classList.add('line');
                container.appendChild(line);

                let dragging = false;
                let startY = 0;

                line.addEventListener('mousedown', (e) => {
                    dragging = true;
                    startY = e.clientY;
                    e.preventDefault();
                });

                document.addEventListener('mousemove', (e) => {
                    if (dragging) {
                        const deltaY = e.clientY - startY;
                        const newClip = Math.max(0, Math.min(100, (deltaY / container.offsetHeight) * 100));
                        overlay.style.clipPath = `inset(${100 - newClip}% 0 0 0)`;
                        startY = e.clientY;
                    }
                });

                document.addEventListener('mouseup', () => {
                    dragging = false;
                });
            });
        });
    });

    observer.observe(document.getElementById('grid'), { childList: true, subtree: true });
});
