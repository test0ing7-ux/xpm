const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_SECRET = process.env.UPLOAD_SECRET || 'my-super-secret-key'; // Change this when deploying
const REGISTRY_DIR = path.join(__dirname, 'registry_data');

// Ensure registry directory exists
if (!fs.existsSync(REGISTRY_DIR)) {
    fs.mkdirSync(REGISTRY_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, REGISTRY_DIR)
    },
    filename: function (req, file, cb) {
        // We expect the CLI to send the file as <name>-<version>.tgz
        cb(null, file.originalname)
    }
});
const upload = multer({ storage: storage });

// --- ROUTES ---

// 1. Publish a package (Open to everyone)
app.post('/publish', upload.single('package'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No package file uploaded.' });
    }
    res.json({ message: 'Package published successfully!', filename: req.file.filename });
});

// 2. List available packages (Public)
app.get('/packages', (req, res) => {
    const files = fs.readdirSync(REGISTRY_DIR).filter(f => f.endsWith('.tgz'));
    res.json({ packages: files });
});

// 3. Download a package (Public)
app.get('/download/:filename', (req, res) => {
    const filePath = path.join(REGISTRY_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Package not found' });
    }
    res.download(filePath);
});

// 4. Delete a package (Open to everyone)
app.delete('/delete/:filename', (req, res) => {
    const filePath = path.join(REGISTRY_DIR, req.params.filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ message: 'Package deleted.' });
    } else {
        res.status(404).json({ error: 'Package not found.' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 XPM Registry Server running on http://localhost:${PORT}`);
    console.log(`🔒 Upload secret is: ${UPLOAD_SECRET}`);
});
