document.addEventListener('DOMContentLoaded', async () => {
    const normalPetsGrid = document.getElementById('regular-grid');
    const rarePetsGrid = document.getElementById('rare-grid');

    // Validate grid elements exist
    if (!normalPetsGrid || !rarePetsGrid) {
        console.error('Error: One or more grids not found in the HTML');
        return;
    }

    // Separate keys for each grid's state
    const normalPetsKey = 'normalPetsState';
    const rarePetsKey = 'rarePetsState';

    const savedNormalPetsState = JSON.parse(localStorage.getItem(normalPetsKey)) || {};
    const savedRarePetsState = JSON.parse(localStorage.getItem(rarePetsKey)) || {};

    try {
        // Fetch images for each grid
        const normalPetsResponse = await fetch('/images?folder=Pets/Regular');
        const rarePetsResponse = await fetch('/images?folder=Pets/Rare');

        const normalPetsImages = await normalPetsResponse.json();
        const rarePetsImages = await rarePetsResponse.json();

        // Utility function to create grid items
        function createGridItems(images, grid, savedState, stateKey) {
            images.forEach((src, index) => {
                const gridItem = document.createElement('div');
                gridItem.classList.add('grid-item');
                gridItem.dataset.index = index;

                const img = document.createElement('img');
                img.src = src;
                img.alt = `Pet ${index + 1}`;

                const number = document.createElement('span');
                number.textContent = `${index + 1}`.padStart(2, '0');

                gridItem.appendChild(img);
                gridItem.appendChild(number);
                grid.appendChild(gridItem);

                // Restore saved state
                if (savedState[index]) {
                    const { capturePod, scaleFactor, borderRadius } = savedState[index];

                    if (capturePod) {
                        img.style.opacity = 0;
                        const capturePodImage = document.createElement('img');
                        capturePodImage.src = 'Images/Misc/Capture_Pod.png';
                        capturePodImage.alt = 'Capture Pod';
                        capturePodImage.classList.add('capture-pod-image');
                        gridItem.appendChild(capturePodImage);
                        gridItem.classList.add('capture-pod');
                    }

                    if (scaleFactor && borderRadius) {
                        img.style.transform = `scale(${scaleFactor})`;
                        img.style.borderRadius = borderRadius;
                    }
                }

                // Handle click event for interactions
                gridItem.addEventListener('click', function () {
                    const imageElement = this.querySelector('img');
                    const isCapturePod = this.classList.contains('capture-pod');

                    if (!isCapturePod) {
                        // Shrink and capture animation
                        this.classList.add('clicked');
                        const originalHeight = imageElement.height;
                        const originalWidth = imageElement.width;
                        const scaleFactor = (35 / originalHeight + 35 / originalWidth) / 2;

                        imageElement.style.transition = 'transform 0.5s ease, border-radius 0.5s ease';
                        imageElement.style.transform = `scale(${scaleFactor})`;
                        imageElement.style.borderRadius = '50%';

                        setTimeout(() => {
                            const capturePodImage = document.createElement('img');
                            capturePodImage.src = 'Images/Misc/Capture_Pod.png';
                            capturePodImage.alt = 'Capture Pod';
                            capturePodImage.classList.add('capture-pod-image');

                            imageElement.style.opacity = 0;
                            this.appendChild(capturePodImage);

                            savedState[index] = {
                                capturePod: true,
                                scaleFactor,
                                borderRadius: '50%',
                            };
                            localStorage.setItem(stateKey, JSON.stringify(savedState));

                            this.classList.add('capture-pod');
                            this.classList.remove('clicked');
                        }, 500);
                    } else {
                        // Restore animation
                        const capturePodImage = this.querySelector('.capture-pod-image');
                        capturePodImage.remove();

                        this.classList.add('clicked');
                        imageElement.style.transition = 'transform 0.5s ease, border-radius 0.5s ease';
                        imageElement.style.opacity = 1;
                        imageElement.style.transform = 'scale(1)';
                        imageElement.style.borderRadius = '0%';

                        setTimeout(() => {
                            this.classList.remove('clicked');

                            savedState[index] = {
                                capturePod: false,
                                scaleFactor: 1,
                                borderRadius: '0%',
                            };
                            localStorage.setItem(stateKey, JSON.stringify(savedState));

                            this.classList.remove('capture-pod');
                        }, 500);
                    }
                });
            });
        }

        // Create grid items for each category
        createGridItems(normalPetsImages, normalPetsGrid, savedNormalPetsState, normalPetsKey);
        createGridItems(rarePetsImages, rarePetsGrid, savedRarePetsState, rarePetsKey);

    } catch (error) {
        console.error('Failed to fetch images:', error);
    }
});