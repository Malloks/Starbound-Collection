document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM content loaded');

    const grid = document.getElementById('grid');

    // Fetch and parse saved states from localStorage
    const savedState = JSON.parse(localStorage.getItem('vanityItemsState')) || {};
    console.log('Saved state from localStorage:', savedState);

    try {
        // Fetch the subfolders representing image sets
        const response = await fetch('/images?folder=Vanity');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const folders = await response.json(); // Should return a list of folder names
        console.log('Folders fetched:', folders);

        const folderPaths = [];

        // Process folder paths and add them to the folderPaths array
        folders.forEach(folder => {
            const folderPath = folder
                .replace(/^Images\//, '')                  // Remove "Images/" prefix
                .replace(/^Vanity\//, '')                 // Remove "Vanity/" prefix
                .replace(/\/[^/]+\.png$/, '');            // Remove file name at the end

            if (!folderPaths.includes(folderPath)) {
                folderPaths.push(folderPath);
            }
        });

        console.log('Processed folder paths:', folderPaths);

        // Loop through each folder in the folderPaths array
        for (const folderPath of folderPaths) {
            const folderResponse = await fetch(`/images?folder=Vanity/${folderPath}`);
            if (!folderResponse.ok) throw new Error(`HTTP error for folder ${folderPath}: ${folderResponse.status}`);

            const images = await folderResponse.json(); // Images in the specific folder
            console.log(`Images for folder ${folderPath}:`, images);

            const gridItem = document.createElement('div');
            gridItem.classList.add('grid-item');

            const imagesContainer = document.createElement('div');
            imagesContainer.classList.add('images-container');

            const setNameDiv = document.createElement('div');
            setNameDiv.classList.add('set-name');
            setNameDiv.innerText = folderPath; // Using the folder path as the set name
            gridItem.appendChild(setNameDiv);

            // Create 5 containers for positioning
            for (let i = 0; i < 5; i++) {
                const container = document.createElement('div');
                container.classList.add('container', `container-${i + 1}`);
                imagesContainer.appendChild(container);

                if (i === 0 && images[i]) {
                    // First container: Transparent set image + mannequin
                    const firstImage = document.createElement('img');
                    firstImage.src = `/${images[i]}`;
                    firstImage.alt = `Image ${i + 1}`;
                    firstImage.classList.add('set-image');
                    firstImage.style.opacity = '0'; // Initial transparency
                    container.appendChild(firstImage);

                    const mannequinImg = document.createElement('img');
                    mannequinImg.src = '/Images/Misc/Mannequin.png';
                    mannequinImg.alt = 'Mannequin Image';
                    mannequinImg.classList.add('set-image');
                    container.appendChild(mannequinImg);

                    // Check if the mannequin should be hidden (from saved state)
                    if (savedState[folderPath]?.mannequinHidden) {
                        firstImage.style.opacity = '1'; // Fully opaque
                        mannequinImg.style.display = 'none'; // Hide mannequin
                    }
                } else if (images[i]) {
                    // Other containers: clickable images
                    const img = document.createElement('img');
                    img.src = `/${images[i]}`;
                    img.alt = `Image ${i + 1}`;
                    img.classList.add('set-image');
                    img.style.filter = savedState[folderPath]?.[i]?.clicked ? 'grayscale(100%)' : 'none';
                    container.appendChild(img);

                    img.addEventListener('click', () => handleImageClick(img, i, folderPath, imagesContainer));
                }
            }

            gridItem.appendChild(imagesContainer);
            grid.appendChild(gridItem);
        }
    } catch (error) {
        console.error('Failed to fetch vanity items:', error);
    }

    /**
     * Function to handle image click events
     */
    function handleImageClick(img, index, folderPath, imagesContainer) {
        const isClicked = img.style.filter === 'grayscale(100%)';
        img.style.filter = isClicked ? 'none' : 'grayscale(100%)';

        const firstImage = imagesContainer.querySelector('.container-1 img:first-child');
        const mannequin = imagesContainer.querySelector('.container-1 img:last-child');

        updateMannequinVisibility(imagesContainer, firstImage, mannequin);

        if (!savedState[folderPath]) {
            savedState[folderPath] = {};
        }
        savedState[folderPath][index] = { clicked: !isClicked };
        savedState[folderPath].mannequinHidden = checkAllClicked(imagesContainer);
        localStorage.setItem('vanityItemsState', JSON.stringify(savedState));
    }

    /**
     * Function to check if all clickable images are clicked
     */
    function checkAllClicked(imagesContainer) {
        const allImages = Array.from(imagesContainer.querySelectorAll('img:not([alt="Mannequin Image"])'));
        return allImages.slice(1).every(img => img.style.filter === 'grayscale(100%)');
    }

    /**
     * Function to update mannequin visibility dynamically
     */
    function updateMannequinVisibility(imagesContainer, firstImage, mannequin) {
        const allClicked = checkAllClicked(imagesContainer);

        if (allClicked) {
            if (firstImage && mannequin) {
                firstImage.style.opacity = '1'; // Fully opaque
                mannequin.style.display = 'none'; // Hide mannequin
            }
        } else {
            if (firstImage && mannequin) {
                mannequin.style.display = ''; // Show mannequin
                firstImage.style.opacity = '0'; // Restore transparency
            }
        }
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM content loaded');

    const grid = document.getElementById('grid');
    
    // Existing code to fetch and display images (you can leave this as is)
    
    // Add drag functionality to reveal image
    const containers = document.querySelectorAll('.container');
    containers.forEach(container => {
        const image = container.querySelector('img'); // Assuming the first image is the one to reveal
        const line = document.createElement('div');
        line.classList.add('line');
        container.appendChild(line);

        // Variables for dragging
        let dragging = false;
        let startY = 0;

        line.addEventListener('mousedown', (e) => {
            dragging = true;
            startY = e.clientY;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (dragging) {
                const deltaY = e.clientY - startY; // Distance moved
                const newClip = Math.max(0, Math.min(100, (deltaY / container.offsetHeight) * 100)); // Calculate percentage
                image.style.clipPath = `inset(${100 - newClip}% 0 0 0)`; // Update the clipping

                startY = e.clientY; // Update startY for continuous dragging
            }
        });

        document.addEventListener('mouseup', () => {
            dragging = false;
        });
    });
});
