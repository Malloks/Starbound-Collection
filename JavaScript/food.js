document.addEventListener('DOMContentLoaded', async () => {
    const foodGrids = {
        'Main': document.getElementById('main-grid'),
        'Side': document.getElementById('side-grid'),
        'Dessert': document.getElementById('dessert-grid'),
        'Snack': document.getElementById('snack-grid'),
        'Drink': document.getElementById('drink-grid'),
        'Condiment': document.getElementById('condiment-grid')
    };

    let globalCounter = 1;
    const eatenItems = new Set(JSON.parse(localStorage.getItem('eatenItems')) || []);

    async function loadFoodImages(category, gridElement) {
        if (!gridElement) {
            console.error(`Error: Grid element for '${category}' not found.`);
            return;
        }

        try {
            const response = await fetch(`/images?folder=Food/${category}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch images for ${category}`);
            }
            const images = await response.json();

            images.forEach((imageSrc) => {
                const imageName = imageSrc.split('/').pop();
                const gridItem = document.createElement('div');
                gridItem.classList.add('grid-item');
                let isAnimating = false;
                let isEmpty = eatenItems.has(imageName); // Initially empty if in cache
                const img = document.createElement('img');
                img.src = imageSrc;
                img.alt = `${category} ${globalCounter}`;
                img.style.opacity = isEmpty ? 0 : 1; // Initially transparent if in cache
                img.style.cursor = 'pointer';

                const number = document.createElement('span');
                number.classList.add('number');
                number.textContent = `${globalCounter}`.padStart(2, '0');

                gridItem.appendChild(img);
                gridItem.appendChild(number);
                gridElement.appendChild(gridItem);

                gridItem.addEventListener('click', () => {
                    if (isAnimating) return;

                    if (isEmpty) {
                        img.style.transition = 'opacity 0.3s ease-in-out, filter 0.3s ease-in-out, box-shadow 0.3s ease-in-out';
                        img.style.opacity = 1;
                        img.classList.remove('no-shadow');
                        img.classList.remove('eating');
                        img.style.cursor = 'pointer';
                        isEmpty = false;

                        // Remove from cache when it reappears
                        const eatenImageName = imageSrc.split('/').pop();
                        eatenItems.delete(eatenImageName);
                        localStorage.setItem('eatenItems', JSON.stringify(Array.from(eatenItems)));
                        return;
                    }

                    isAnimating = true;
                    img.classList.add('no-shadow');
                    img.style.transition = '';
                    img.classList.add('eating');
                    img.style.cursor = 'default';

                    img.addEventListener('animationend', () => {
                        img.classList.remove('eating');
                        img.classList.remove('no-shadow');
                        img.style.opacity = 0;
                        isAnimating = false;
                        isEmpty = true;
                        img.style.cursor = 'pointer';

                        const eatenImageName = imageSrc.split('/').pop();
                        eatenItems.add(eatenImageName);
                        localStorage.setItem('eatenItems', JSON.stringify(Array.from(eatenItems)));

                        img.removeEventListener('animationend', arguments.callee);
                    });
                });
                globalCounter++;
            });
        } catch (error) {
            console.error(`Error loading images for ${category}:`, error);
        }
    }

    for (const category in foodGrids) {
        await loadFoodImages(category, foodGrids[category]);
    }
});

// localStorage.removeItem('eatenItems'); // For testing