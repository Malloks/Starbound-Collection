const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Optional: For cross-origin requests

const app = express();
const port = process.env.PORT || 3000; // Use the PORT environment variable or default to 3000

// Enable CORS (Optional)
app.use(cors());

// Serve static files from the "public" directory (JavaScript, CSS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the "Images" folder
app.use('/Images', express.static(path.join(__dirname, 'Images'), {
  fallthrough: false // Send a 404 response if the file is not found
}));

// Serve the index.html file for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Function to get all image files from a directory and its subdirectories
function getImageFiles(dir) {
  let imageFiles = [];
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively get images from subdirectories
      imageFiles = imageFiles.concat(getImageFiles(filePath));
    } else if (/\.(jpg|jpeg|png|gif)$/i.test(file)) {
      // Add image files to the array
      imageFiles.push(filePath);
    }
  });

  return imageFiles;
}

// Route to get images from a specific folder inside the "Images" directory
app.get('/images', (req, res) => {
  const folder = req.query.folder; // Get the folder name from the query parameter
  const imagesDir = path.join(__dirname, 'Images', folder); // Path to the requested folder

  if (!folder) {
    return res.status(400).json({ error: 'Folder query parameter is required.' });
  }

  if (!fs.existsSync(imagesDir)) {
    return res.status(404).json({ error: `Folder ${folder} does not exist.` });
  }

  try {
    const imageFiles = getImageFiles(imagesDir);

    if (imageFiles.length === 0) {
      return res.status(404).json({ error: `No images found in folder ${folder}.` });
    }

    console.log(`Images found in ${folder}:`, imageFiles); // Log the image files
    res.json(imageFiles.map(file => path.relative(__dirname, file).replace(/\\/g, '/'))); // Return image paths relative to the server
  } catch (err) {
    console.error(`Error reading folder ${imagesDir}:`, err);
    res.status(500).json({ error: 'Failed to load images.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});