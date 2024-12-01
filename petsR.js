document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('grid');
  
  // Get the current grid state from localStorage (if exists)
  const savedState = JSON.parse(localStorage.getItem('gridState')) || {};

  try {
      const response = await fetch('/images?folder=Pets'); // Change the folder name to "Pets"
      const images = await response.json();

      images.forEach((src, index) => {
          const gridItem = document.createElement('div');
          gridItem.classList.add('grid-item');
          gridItem.dataset.index = index;  // Store the index to associate with the state

          const img = document.createElement('img');
          img.src = src;
          img.alt = `Pet ${index + 1}`;

          const number = document.createElement('span');
          number.textContent = `${index + 1}`.padStart(2, '0');

          gridItem.appendChild(img);
          gridItem.appendChild(number);
          grid.appendChild(gridItem);

          // If the grid item has been saved in localStorage as Capture Pod, apply it
          if (savedState[index] && savedState[index].capturePod) {
              img.style.opacity = 0;  // Hide the original image
              const capturePodImage = document.createElement('img');
              capturePodImage.src = 'Images/Misc/Capture_Pod.png';
              capturePodImage.alt = 'Capture Pod';
              capturePodImage.style.opacity = 1;
              capturePodImage.classList.add('capture-pod-image');
              gridItem.appendChild(capturePodImage);
              gridItem.classList.add('capture-pod');
          } else {
              img.style.opacity = 1;  // Ensure original image is visible if Capture Pod is not shown
          }

          // Add click event listener to each grid item
          gridItem.addEventListener('click', function () {
              const imageElement = this.querySelector('img');
              const numberElement = this.querySelector('span');
              
              // If the Capture Pod image is not currently displayed
              if (!this.classList.contains('capture-pod')) {
                  // Make the original image red and apply the glow effect
                  imageElement.style.filter = 'hue-rotate(180deg)';
                  this.classList.add('clicked');  // Apply glow animation

                  // Wait for the glow animation to finish
                  setTimeout(() => {
                      // Fade out the original image (opacity 0)
                      imageElement.style.opacity = 0;

                      // Create and place the Capture Pod image on top
                      const newImage = document.createElement('img');
                      newImage.src = 'Images/Misc/Capture_Pod.png';
                      newImage.alt = 'Capture Pod';
                      newImage.style.objectFit = 'cover';
                      newImage.style.opacity = 1;
                      newImage.classList.add('capture-pod-image');

                      // Clear existing content, keeping the number, and add the new image on top
                      this.innerHTML = '';
                      this.appendChild(numberElement);
                      this.appendChild(imageElement);
                      this.appendChild(newImage);

                      // Update the localStorage with the new state
                      savedState[this.dataset.index] = { capturePod: true, isOriginalVisible: false };
                      localStorage.setItem('gridState', JSON.stringify(savedState));

                      // Remove the red hue and the glow effect from the original image
                      setTimeout(() => {
                          imageElement.style.filter = 'none'; // Remove the hue-rotate
                          this.classList.remove('clicked'); // Remove the glow effect
                      }, 0);  // Wait for 1 second for the glow effect to finish

                      this.classList.add('capture-pod');
                  }, 1000); // Wait 1 second for the red glow animation
              } else {
                  // If the Capture Pod is already displayed, apply a glow effect to it
                  const capturePodImage = this.querySelector('.capture-pod-image');

                  // Apply the glow effect to the Capture Pod
                  capturePodImage.style.filter = 'hue-rotate(180deg)';
                  this.classList.add('clicked');  // Apply glow animation

                  // Wait for the glow animation to finish
                  setTimeout(() => {
                      // Fade out the Capture Pod image
                      capturePodImage.style.opacity = 0;

                      // After fading out, remove the Capture Pod image and show the original image again
                      setTimeout(() => {
                          capturePodImage.remove();
                          imageElement.style.opacity = 1;  // Make the original image visible again
                          imageElement.style.filter = 'none'; // Reset the filter (no red glow)
                          
                          // Remove the glow effect (reset)
                          this.classList.remove('clicked');

                          // Update the localStorage to reflect that the Capture Pod was removed
                          savedState[this.dataset.index] = { capturePod: false, isOriginalVisible: true };
                          localStorage.setItem('gridState', JSON.stringify(savedState));

                          this.classList.remove('capture-pod');
                      }, 0); // Wait for the Capture Pod image to fade out
                  }, 1000); // Wait 1 second for the red glow animation
              }
          });
      });
  } catch (error) {
      console.error('Failed to fetch images:', error);
  }
});