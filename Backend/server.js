const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Define the root of the project (one level up from this file)
const projectRoot = path.join(__dirname, '..');

// Serve static files from the project root
app.use(express.static(projectRoot));

// Serve static files from the "Images" folder in the root
app.use('/Images', express.static(path.join(projectRoot, 'Images')));

// Serve index.html from the root directory
app.get('/', (req, res) => {
  res.sendFile(path.join(projectRoot, 'index.html'));
});

// Recursive function to get image files
function getImageFiles(dir) {
  let imageFiles = [];
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      imageFiles = imageFiles.concat(getImageFiles(filePath));
    } else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file)) {
      imageFiles.push(filePath);
    }
  });

  return imageFiles;
}

// Route to get images
app.get('/images', (req, res) => {
  const folder = req.query.folder;
  const imagesDir = path.join(projectRoot, 'Images', folder);

  console.log(`Requested folder: ${folder}`);
  console.log(`Full path to folder: ${imagesDir}`);

  if (!folder) {
    return res.status(400).json({ error: 'Folder query parameter is required.' });
  }

  if (!fs.existsSync(imagesDir)) {
    console.error(`Folder not found: ${imagesDir}`);
    return res.status(404).json({ error: `Folder ${folder} does not exist.` });
  }

  try {
    const imageFiles = getImageFiles(imagesDir);

    if (imageFiles.length === 0) {
      return res.status(404).json({ error: `No images found in folder ${folder}.` });
    }

    console.log(`Images found in ${folder}:`, imageFiles);

    res.json(imageFiles.map(file => path.relative(projectRoot, file).replace(/\\/g, '/')));
  } catch (err) {
    console.error(`Error reading folder ${imagesDir}:`, err);
    res.status(500).json({ error: 'Failed to load images.' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
