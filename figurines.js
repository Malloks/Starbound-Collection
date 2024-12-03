document.addEventListener('DOMContentLoaded', async () => {
  const normalGrid = document.getElementById('normal-grid');
  const bossGrid = document.getElementById('boss-grid');
  const oreGrid = document.getElementById('ore-grid');

  if (!normalGrid || !bossGrid || !oreGrid) {
    console.error('Error: Grids not found in the HTML');
    return; // Stop execution if grids are not found
  }

  const savedStateKey = 'gridStateFigurines';
  const savedState = JSON.parse(localStorage.getItem(savedStateKey)) || {};

  const specialIndexes = [60, 61, 62, 63, 64, 65, 66, 67, 68];
  const oreIndexes = [69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84]; // Numbers for ore grid

  try {
    const response = await fetch('/images?folder=Figurines');
    const images = await response.json();

    images.forEach((src, index) => {
      const gridItem = document.createElement('div');
      gridItem.classList.add('grid-item');
      gridItem.dataset.index = index;

      const img = document.createElement('img');
      img.src = src;
      img.alt = `Figurine ${index + 1}`;

      const number = document.createElement('span');
      let numberText = '';

      // Check if this image is part of the ore grid and assign the appropriate number
      if (oreIndexes.includes(index)) {
        const oreIndex = oreIndexes.indexOf(index) + 70; // Start numbering from 70
        numberText = oreIndex.toString().padStart(2, '0');
      } else {
        numberText = `${index + 1}`.padStart(2, '0');
      }

      number.textContent = numberText;

      gridItem.appendChild(img);
      gridItem.appendChild(number);

      if (specialIndexes.includes(index)) {
        bossGrid.appendChild(gridItem); // Add to boss grid
      } else if (oreIndexes.includes(index)) {
        oreGrid.appendChild(gridItem); // Add to ore grid and add number
      } else {
        normalGrid.appendChild(gridItem); // Add to normal grid
      }

      if (savedState[index] && savedState[index].pedestalAdded) {
        const pedestalImage = specialIndexes.includes(index) ? 'Images/Misc/BossPedistal.png' : 'Images/Misc/Pedistal.png';
        applyPedestalAnimation(gridItem, img, number, false, savedState[index].pedestalPosition, pedestalImage);
      }

      gridItem.addEventListener('click', function () {
        const pedestalImage = specialIndexes.includes(index) ? 'Images/Misc/BossPedistal.png' : 'Images/Misc/Pedistal.png';

        if (this.classList.contains('pedestal-added')) {
          removePedestalAnimation(this, img, number);
          savedState[this.dataset.index] = { pedestalAdded: false, pedestalPosition: null };
        } else {
          applyPedestalAnimation(this, img, number, true, null, pedestalImage);
          const pedestalPosition = -(60 - img.offsetTop);
          savedState[this.dataset.index] = { pedestalAdded: true, pedestalPosition };
        }
        localStorage.setItem(savedStateKey, JSON.stringify(savedState));
      });
    });
  } catch (error) {
    console.error('Failed to fetch images:', error);
  }
});

function applyPedestalAnimation(gridItem, img, number, animate = true, savedPedestalPosition = null, pedestalImage) {
  const pedestal = document.createElement('img');
  pedestal.src = pedestalImage;
  pedestal.alt = 'Pedestal';
  pedestal.style.position = 'absolute';
  pedestal.style.zIndex = '-1';
  pedestal.style.left = '50%';
  pedestal.style.transform = 'translateX(-50%)';
  pedestal.style.filter = 'grayscale(100%)';
  pedestal.style.transition = animate ? 'bottom 1s ease, filter 1s ease' : 'none';

  gridItem.style.position = 'relative';
  const pedestalStartBottom = -80;
  const pedestalStopBottom = savedPedestalPosition !== null ? savedPedestalPosition : -(60 - img.offsetTop);

  pedestal.style.bottom = `${pedestalStartBottom}px`;

  gridItem.appendChild(pedestal);
  gridItem.classList.add('pedestal-added');

  setTimeout(() => {
    pedestal.style.bottom = `${pedestalStopBottom}px`;
  }, 50);

  img.style.filter = 'grayscale(100%)';
  img.style.transition = animate ? 'filter 1s ease' : 'none';

  setTimeout(() => {
    pedestal.style.animation = 'shake 0.5s ease forwards';
  }, 1050);

  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes shake {
      0% { transform: translateX(-50%) translateX(0); }
      25% { transform: translateX(-50%) translateX(-1px); }
      50% { transform: translateX(-50%) translateX(1px); }
      75% { transform: translateX(-50%) translateX(-1px); }
      100% { transform: translateX(-50%) translateX(0); }
    }
  `;
  document.head.appendChild(style);
}

function removePedestalAnimation(gridItem, img, number) {
  const pedestal = gridItem.querySelector('img[alt="Pedestal"]');
  if (pedestal) {
    const imgBottom = img.offsetTop + img.offsetHeight;
    const pedestalStartBottom = -(imgBottom + 50);

    pedestal.style.bottom = `${pedestalStartBottom}px`;
    pedestal.style.transition = 'bottom 1s ease';

    setTimeout(() => {
      pedestal.remove();
    }, 1000);
  }

  img.style.filter = 'none';
  img.style.transition = 'filter 1s ease';

  gridItem.classList.remove('pedestal-added');
}
