// food.js
document.addEventListener('DOMContentLoaded', async () => {
  const foodGrids = {
    'Main':     document.getElementById('main-grid'),
    'Side':     document.getElementById('side-grid'),
    'Dessert':  document.getElementById('dessert-grid'),
    'Snack':    document.getElementById('snack-grid'),
    'Drink':    document.getElementById('drink-grid'),
    'Condiment':document.getElementById('condiment-grid')
  };

  // Load eatenItems from localStorage
  const eatenItems = new Set(JSON.parse(localStorage.getItem('eatenItems')) || []);

  // Nav‐link for “all done” glow
  const foodLink = document.querySelector('.navbar-links a[href$="food.html"]');
  console.log('🍔 foodLink found?', !!foodLink);

  // Helper: check every grid‐item across all categories
  function checkAllFood() {
    const allItems = Object.values(foodGrids).reduce((acc, grid) => {
      if (grid) acc.push(...grid.querySelectorAll('.grid-item'));
      return acc;
    }, []);
    const allDone = allItems.length > 0
      && allItems.every(item => {
           const imgName = item.querySelector('img').src.split('/').pop();
           return eatenItems.has(imgName);
         });

    console.log('🍔 checkAllFood:', { total: allItems.length, eaten: eatenItems.size, allDone });
    localStorage.setItem('foodAllDone', allDone ? 'true' : 'false');
    if (foodLink) foodLink.classList.toggle('completed', allDone);
  }

  let globalCounter = 1;

  async function loadFoodImages(category, gridElement) {
    if (!gridElement) {
      console.error(`Error: Grid element for '${category}' not found.`);
      return;
    }

    try {
      const res = await fetch(`/images?folder=Food/${category}`);
      if (!res.ok) throw new Error(`Failed to fetch images for ${category}`);
      const images = await res.json();

      images.forEach(imageSrc => {
        const imageName = imageSrc.split('/').pop();
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');

        let isAnimating = false;
        let isEmpty     = eatenItems.has(imageName);

        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = `${category} ${globalCounter}`;
        img.style.opacity = isEmpty ? '0' : '1';
        img.style.cursor  = 'pointer';

        const number = document.createElement('span');
        number.classList.add('number');
        number.textContent = `${globalCounter}`.padStart(2, '0');

        gridItem.append(img, number);
        gridElement.appendChild(gridItem);

        gridItem.addEventListener('click', () => {
          if (isAnimating) return;

          // If already eaten, restore it
          if (isEmpty) {
            img.style.transition = 'opacity 0.3s ease-in-out, filter 0.3s ease-in-out, box-shadow 0.3s ease-in-out';
            img.style.opacity = 1;
            img.classList.remove('no-shadow', 'eating');
            img.style.cursor = 'pointer';
            isEmpty = false;

            eatenItems.delete(imageName);
            localStorage.setItem('eatenItems', JSON.stringify([...eatenItems]));
            checkAllFood();
            return;
          }

          // Otherwise, play the eating animation
          isAnimating = true;
          img.classList.add('no-shadow', 'eating');
          img.style.transition = '';
          img.style.cursor = 'default';

          const onAnimEnd = () => {
            img.classList.remove('eating', 'no-shadow');
            img.style.opacity = 0;
            isEmpty = true;
            isAnimating = false;
            img.style.cursor = 'pointer';

            eatenItems.add(imageName);
            localStorage.setItem('eatenItems', JSON.stringify([...eatenItems]));
            checkAllFood();

            img.removeEventListener('animationend', onAnimEnd);
          };

          img.addEventListener('animationend', onAnimEnd);
        });

        globalCounter++;
      });
    } catch (err) {
      console.error(`Error loading ${category}:`, err);
    }
  }

  // Load every category, then do an initial check
  for (const category in foodGrids) {
    // await so we guarantee all grid‐items exist before first check
    await loadFoodImages(category, foodGrids[category]);
  }

  checkAllFood();
});
