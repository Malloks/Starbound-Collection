document.addEventListener('DOMContentLoaded', async () => {
  const normalGrid = document.getElementById('normal-grid');
  const bossGrid = document.getElementById('boss-grid');
  const oreGrid = document.getElementById('ore-grid');

  if (!normalGrid || !bossGrid || !oreGrid) {
    console.error('Error: Grids not found in the HTML');
    return;
  }

  const savedStateKey = 'gridStateFigurines';
  const savedState = JSON.parse(localStorage.getItem(savedStateKey)) || {};

  try {
    // Fetch images from different folders
    const normalImagesResponse = await fetch('/images?folder=Figurines/Normal');
    const bossImagesResponse = await fetch('/images?folder=Figurines/Bosses');
    const oreImagesResponse = await fetch('/images?folder=Figurines/Ores');

    const normalImages = await normalImagesResponse.json();
    const bossImages = await bossImagesResponse.json();
    const oreImages = await oreImagesResponse.json();

    // Function to create grid items
    function createGridItems(images, grid, folderName) {
      images.forEach((src, index) => {
        const gridItem = document.createElement('div');
        gridItem.classList.add('grid-item');
        gridItem.dataset.index = index;

        const img = document.createElement('img');
        img.src = src;
        img.alt = `${folderName} ${index + 1}`;

        const number = document.createElement('span');
        number.textContent = `${index + 1}`.padStart(2, '0');

        gridItem.appendChild(img);
        gridItem.appendChild(number);

        // If there's a saved state for this index, restore the pedestal state
        if (savedState[index] && savedState[index].pedestalAdded) {
          const pedestalImage = getPedestalImage(folderName);
          applyPedestalAnimation(gridItem, img, number, false, savedState[index].pedestalPosition, pedestalImage);
        }

        // Add click event to toggle pedestal
        gridItem.addEventListener('click', function () {
          const pedestalImage = getPedestalImage(folderName);

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

        // Append to the appropriate grid based on folder
        if (folderName === 'Bosses') {
          bossGrid.appendChild(gridItem);
        } else if (folderName === 'Ores') {
          oreGrid.appendChild(gridItem);
        } else {
          normalGrid.appendChild(gridItem);
        }
      });
    }

    // Create grid items for each category
    createGridItems(normalImages, normalGrid, 'Normal');
    createGridItems(bossImages, bossGrid, 'Bosses');
    createGridItems(oreImages, oreGrid, 'Ores');

  } catch (error) {
    console.error('Failed to fetch images:', error);
  }
});

function getPedestalImage(folderName) {
  if (folderName === 'Ores') {
    return 'Images/Misc/OrePedistal.png';
  } else if (folderName === 'Bosses') {
    return 'Images/Misc/BossPedistal.png';
  } else {
    return 'Images/Misc/Pedistal.png';
  }
}

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

  // Apply transition to move pedestal into position
  setTimeout(() => {
    pedestal.style.bottom = `${pedestalStopBottom}px`;
  }, 50);

  img.style.filter = 'grayscale(100%)';
  img.style.transition = animate ? 'filter 1s ease' : 'none';

  // Add shake animation after the pedestal settles
  setTimeout(() => {
    pedestal.style.animation = 'shake 0.5s ease forwards';
  }, 1050);

  // Inject the shake animation keyframes into the document
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