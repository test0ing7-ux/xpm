const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Where we store uploaded packages on the server
const STORAGE_DIR = path.join(__dirname, 'storage');
fs.ensureDirSync(STORAGE_DIR);

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, STORAGE_DIR);
  },
  filename: function (req, file, cb) {
    const pkgName = req.body.name || 'unknown';
    cb(null, `${pkgName}.zip`); // Save as <name>.zip
  }
});

const upload = multer({ storage: storage });

// PUBLISH ENDPOINT: Receives a zip and saves it
app.post('/publish', upload.single('package'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No package file uploaded' });
  }
  const pkgName = req.body.name;
  console.log(`[PUBLISH] Received new package: ${pkgName}`);
  res.json({ success: true, message: `Package ${pkgName} published successfully!` });
});

// DOWNLOAD ENDPOINT: Serves the zip file for a package
app.get('/download/:pkgName', (req, res) => {
  const pkgName = req.params.pkgName;
  const filePath = path.join(STORAGE_DIR, `${pkgName}.zip`);
  
  if (fs.existsSync(filePath)) {
    console.log(`[DOWNLOAD] Serving package: ${pkgName}`);
    res.download(filePath);
  } else {
    console.log(`[ERROR] Package not found: ${pkgName}`);
    res.status(404).json({ error: 'Package not found' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 XPM Registry Server running on http://localhost:${PORT}`);
  console.log(`📁 Packages will be stored in: ${STORAGE_DIR}`);
});
