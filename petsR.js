document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('grid');
  
  const savedState = JSON.parse(localStorage.getItem('gridState')) || {};

  try {
    const response = await fetch('/images?folder=Pets'); // Ensure this path matches your server route

    if (!response.ok) {
      throw new Error(`Failed to fetch images: ${response.statusText}`);
    }

    const images = await response.json();
    console.log('Fetched images:', images); // Log the image paths

    images.forEach((src, index) => {
      const gridItem = document.createElement('div');
      gridItem.classList.add('grid-item');
      gridItem.dataset.index = index;

      const img = document.createElement('img');
      img.src = src; // Make sure this src is a full URL path like /Images/Pets/image.jpg
      img.alt = `Pet ${index + 1}`;

      const number = document.createElement('span');
      number.textContent = `${index + 1}`.padStart(2, '0');

      gridItem.appendChild(img);
      gridItem.appendChild(number);
      grid.appendChild(gridItem);

      // If the grid item has been saved in localStorage as Capture Pod, apply it
      if (savedState[index] && savedState[index].capturePod) {
        img.style.opacity = 0;  
        const capturePodImage = document.createElement('img');
        capturePodImage.src = 'Images/Misc/Capture_Pod.png'; // Ensure path is correct
        capturePodImage.alt = 'Capture Pod';
        capturePodImage.style.opacity = 1;
        capturePodImage.classList.add('capture-pod-image');
        gridItem.appendChild(capturePodImage);
        gridItem.classList.add('capture-pod');
      } else {
        img.style.opacity = 1;
      }

      // Event listener for grid item click
      gridItem.addEventListener('click', function () {
        const imageElement = this.querySelector('img');
        const numberElement = this.querySelector('span');
        
        if (!this.classList.contains('capture-pod')) {
          imageElement.style.filter = 'hue-rotate(180deg)';
          this.classList.add('clicked');

          setTimeout(() => {
            imageElement.style.opacity = 0;

            const newImage = document.createElement('img');
            newImage.src = 'Images/Misc/Capture_Pod.png'; // Ensure path is correct
            newImage.alt = 'Capture Pod';
            newImage.style.objectFit = 'cover';
            newImage.style.opacity = 1;
            newImage.classList.add('capture-pod-image');

            this.innerHTML = '';
            this.appendChild(numberElement);
            this.appendChild(imageElement);
            this.appendChild(newImage);

            savedState[this.dataset.index] = { capturePod: true, isOriginalVisible: false };
            localStorage.setItem('gridState', JSON.stringify(savedState));

            setTimeout(() => {
              imageElement.style.filter = 'none';
              this.classList.remove('clicked');
            }, 0);

            this.classList.add('capture-pod');
          }, 1000);
        } else {
          const capturePodImage = this.querySelector('.capture-pod-image');
          capturePodImage.style.filter = 'hue-rotate(180deg)';
          this.classList.add('clicked');

          setTimeout(() => {
            capturePodImage.style.opacity = 0;

            setTimeout(() => {
              capturePodImage.remove();
              imageElement.style.opacity = 1;
              imageElement.style.filter = 'none';
              this.classList.remove('clicked');

              savedState[this.dataset.index] = { capturePod: false, isOriginalVisible: true };
              localStorage.setItem('gridState', JSON.stringify(savedState));

              this.classList.remove('capture-pod');
            }, 0);
          }, 1000);
        }
      });
    });
  } catch (error) {
    console.error('Failed to fetch images:', error);
  }
});