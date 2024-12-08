document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM content loaded');

    const grid = document.getElementById('grid');

    // Fetch and parse saved states
    const savedState = JSON.parse(localStorage.getItem('normalPetsState')) || {};
    console.log('Saved state from localStorage:', savedState);

    try {
        const response = await fetch('/images?folder=NormalPets');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const images = await response.json();

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

            // Apply cached state for normal pets
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

            // Event listener for click interactions
            gridItem.addEventListener('click', function () {
                const imageElement = this.querySelector('img');
                const isCapturePod = this.classList.contains('capture-pod');

                if (!isCapturePod) {
                    // Shrink animation
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
                        localStorage.setItem('normalPetsState', JSON.stringify(savedState));

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
                        localStorage.setItem('normalPetsState', JSON.stringify(savedState));

                        this.classList.remove('capture-pod');
                    }, 500);
                }
            });
        });
    } catch (error) {
        console.error('Failed to fetch images:', error);
    }
});