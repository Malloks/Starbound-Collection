// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS if you need it
app.use(cors());

//
// 1) Redirect lowercase-first URLs to Capital-first
//
app.use((req, res, next) => {
  // match a single path segment starting with a lowercase letter, no extension
  const m = req.path.match(/^\/([a-z][^\/]*)$/);
  if (m) {
    const name = m[1];
    const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
    // preserve any query string
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    return res.redirect(301, `/${capitalized}${qs}`);
  }
  next();
});

//
// 2) Serve Capital-first URLs by mapping to lowercase .html files
//
app.use((req, res, next) => {
  const capMatch = req.path.match(/^\/([A-Z][^\/]+)$/);
  if (capMatch) {
    const name = capMatch[1];
    const filename = name.charAt(0).toLowerCase() + name.slice(1) + '.html';
    const fullPath = path.join(__dirname, filename);
    if (fs.existsSync(fullPath)) {
      return res.sendFile(fullPath);
    }
  }
  next();
});

//
// 3) Static‐serve your project root, hiding “.html” via extensions fallback
//
app.use(
  express.static(path.join(__dirname), {
    extensions: ['html']
  })
);

//
// 4) Serve Images folder
//
app.use('/Images', express.static(path.join(__dirname, 'Images')));

//
// 5) Your existing /images API
//
function getImageFiles(dir) {
  let imageFiles = [];
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      imageFiles = imageFiles.concat(getImageFiles(full));
    } else if (/\.(jpe?g|png|gif|webp)$/i.test(file)) {
      imageFiles.push(full);
    }
  });
  return imageFiles;
}

app.get('/images', (req, res) => {
  const folder = req.query.folder;
  if (!folder) {
    return res.status(400).json({ error: 'Folder query parameter is required.' });
  }

  const imagesDir = path.join(__dirname, 'Images', folder);
  if (!fs.existsSync(imagesDir)) {
    return res.status(404).json({ error: `Folder “${folder}” does not exist.` });
  }

  try {
    const files = getImageFiles(imagesDir);
    if (files.length === 0) {
      return res.status(404).json({ error: `No images found in folder “${folder}”.` });
    }
    // Send paths relative to project root
    const rel = files.map(f => path.relative(__dirname, f).replace(/\\/g, '/'));
    res.json(rel);
  } catch (err) {
    console.error('Error reading images:', err);
    res.status(500).json({ error: 'Failed to load images.' });
  }
});

//
// 6) Start the server
//
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
