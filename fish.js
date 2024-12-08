document.addEventListener('DOMContentLoaded', async () => {
    const oceanGrid = document.getElementById('ocean-grid');
    const toxicGrid = document.getElementById('toxic-grid');
    const arcticGrid = document.getElementById('arctic-grid');
    const lavaGrid = document.getElementById('lava-grid');

    if (!oceanGrid || !toxicGrid || !arcticGrid || !lavaGrid) {
        console.error('Error: Grids not found in the HTML');
        return;
    }

    const savedStateKey = 'gridStateFish';
    const savedState = JSON.parse(localStorage.getItem(savedStateKey)) || {};

    try {
        // Fetch images from different Fish folders
        const oceanImagesResponse = await fetch('/images?folder=Fish/Ocean');
        const toxicImagesResponse = await fetch('/images?folder=Fish/Toxic');
        const arcticImagesResponse = await fetch('/images?folder=Fish/Arctic');
        const lavaImagesResponse = await fetch('/images?folder=Fish/Lava');

        const oceanImages = await oceanImagesResponse.json();
        const toxicImages = await toxicImagesResponse.json();
        const arcticImages = await arcticImagesResponse.json();
        const lavaImages = await lavaImagesResponse.json();

        // Function to create grid items for Fish
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

                // Create Fishbowl image placeholder (Initially hidden)
                const fishbowlImage = document.createElement('img');
                fishbowlImage.style.position = 'absolute';
                fishbowlImage.style.zIndex = '1';  // Fishbowl above fish
                fishbowlImage.style.top = '-5px';  // Initially off-screen
                fishbowlImage.style.display = 'none';  // Initially hidden

                // Create FishHook image (Initially off-screen)
                const fishHookImage = document.createElement('img');
                fishHookImage.src = 'Images/Misc/FishHook.png';
                fishHookImage.style.position = 'absolute';
                fishHookImage.style.zIndex = '10';  // Above the fish
                fishHookImage.style.top = '-150px';  // Start off-screen above the grid
                fishHookImage.style.left = '50%';
                fishHookImage.style.transform = 'translateX(-50%)';
                fishHookImage.style.transition = 'top 0.5s ease-in-out';  // Smooth animation
                
                // Append the FishHook image to the grid item (not the grid container)
                gridItem.appendChild(fishHookImage);

                // Create a container to wrap the fish
                const fishContainer = document.createElement('div');
                fishContainer.style.position = 'relative';  // To position both Fish and FishHook together
                fishContainer.appendChild(img);

                gridItem.appendChild(fishContainer);
                gridItem.appendChild(number);
                gridItem.appendChild(fishbowlImage);  // Append fishbowl to grid item

                // Check if the fish has a cached fishbowl state
                const fishState = savedState[`${folderName}_${index}`];
                if (fishState && fishState.hasFishbowl) {
                    // If the fish has a fishbowl, show it and adjust opacity

                    const fishWidth = img.width; // Get the width of the fish image

                    if (fishWidth <= 50) {
                        fishbowlImage.src = 'Images/Misc/FishbowlSmall.png';
                    } else if (fishWidth > 60 && fishWidth <= 75) {
                        fishbowlImage.src = 'Images/Misc/FishbowlMedium.png';
                    } else {
                        fishbowlImage.src = 'Images/Misc/FishbowlBig.png';
                    }
                    fishbowlImage.style.display = 'block';  // Show the fishbowl
                    fishbowlImage.style.zIndex = "-10";
                    img.style.opacity = '0.5';  // Set the fish opacity to indicate it has been caught
                    fishbowlImage.style.top = '12px';  // Position the fishbowl correctly
                }

                // Append to the appropriate grid based on folder
                if (folderName === 'Ocean') {
                    oceanGrid.appendChild(gridItem);
                } else if (folderName === 'Toxic') {
                    toxicGrid.appendChild(gridItem);
                } else if (folderName === 'Arctic') {
                    arcticGrid.appendChild(gridItem);
                } else if (folderName === 'Lava') {
                    lavaGrid.appendChild(gridItem);
                }

                // Add click event to trigger animations
                gridItem.addEventListener('click', function () {
                    const fishWidth = img.width; // Get the width of the fish image

                    // Check if the fish already has a fishbowl
                    if (fishbowlImage.style.display === 'none') {
                        // If no fishbowl, set the appropriate fishbowl size
                        if (fishWidth <= 50) {
                            fishbowlImage.src = 'Images/Misc/FishbowlSmall.png';
                        } else if (fishWidth > 60 && fishWidth <= 75) {
                            fishbowlImage.src = 'Images/Misc/FishbowlMedium.png';
                        } else {
                            fishbowlImage.src = 'Images/Misc/FishbowlBig.png';
                        }

                        // Start FishHook animation: Move down
                        fishHookImage.style.top = '-40px';  // Move the hook down to catch the fish
                        fishHookImage.style.transition = 'top 0.5s ease-in-out';  // Smooth animation

                        // Wait for the FishHook to catch the fish (0.5 seconds at 0px)
                        setTimeout(() => {
                            // Move FishHook and fishContainer back up after 0.5 seconds
                            fishHookImage.style.top = '-150px'; // Reset the hook to its starting position
                            fishContainer.style.transition = 'transform 0.5s ease-in-out';
                            fishContainer.style.transform = 'translateY(-115px)';  // Move both the fish and hook up

                            // After the FishHook goes up, place the Fishbowl on top of the fish
                            setTimeout(() => {
                                fishbowlImage.style.display = 'block';  // Show Fishbowl
                                fishbowlImage.style.transition = 'top 0.2s ease-out';
                                fishbowlImage.style.top = '-115px';  // Position Fishbowl just above fish
                                fishbowlImage.style.zIndex = '-10';

                                // Animate the fish and Fishbowl down to their original position
                                setTimeout(() => {
                                    fishbowlImage.style.top = '12px';  // Fishbowl falls to its final position
                                    img.style.opacity = '0.5';  // Reset fish opacity
                                    fishContainer.style.transition = 'transform 0.2s ease-out';  // Adjust speed for falling
                                    fishContainer.style.transform = 'translateY(0px)';  // Reset fish position

                                    // Remove shake animation after it finishes (1s)
                                    setTimeout(() => {
                                        // Now, trigger the shake effect as the last action
                                        fishbowlImage.classList.add('shake');
                                        fishContainer.classList.add('shake')
                                    }, 125);
                                    fishbowlImage.classList.remove('shake');
                                    fishContainer.classList.remove('shake');

                                    // Cache the state of the fish having a fishbowl
                                    savedState[`${folderName}_${index}`] = { hasFishbowl: true };
                                    localStorage.setItem(savedStateKey, JSON.stringify(savedState));
                                }, 500); // Delay before fishbowl starts falling
                            }, 500); // Delay before Fishbowl appears
                        }, 500); // Wait for FishHook to "catch" the fish (stay at 0px for 0.5 seconds)
                    } else {
                        // If the fish already has a fishbowl, remove it
                        fishbowlImage.style.display = 'none';
                        img.style.opacity = '1';  // Revert fish image opacity to 100%

                        // Update the cached state to reflect that the fish no longer has a fishbowl
                        savedState[`${folderName}_${index}`] = { hasFishbowl: false };
                        localStorage.setItem(savedStateKey, JSON.stringify(savedState));
                    }
                });
            });
        }

        // Create grid items for each Fish category
        createGridItems(oceanImages, oceanGrid, 'Ocean');
        createGridItems(toxicImages, toxicGrid, 'Toxic');
        createGridItems(arcticImages, arcticGrid, 'Arctic');
        createGridItems(lavaImages, lavaGrid, 'Lava');

    } catch (error) {
        console.error('Failed to fetch images:', error);
    }
});
