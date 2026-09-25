const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const REGISTRY_DIR = path.join(__dirname, 'registry_data');
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!fs.existsSync(REGISTRY_DIR)) fs.mkdirSync(REGISTRY_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, REGISTRY_DIR),
    filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// ==========================================
// 🎨 PROFESSIONAL WEB UI DASHBOARD
// ==========================================
app.get('/', (req, res) => {
    const files = fs.readdirSync(REGISTRY_DIR).filter(f => f.endsWith('.tgz'));
    
    let packagesHtml = files.map(file => `
        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center transition hover:shadow-md">
            <div>
                <h3 class="font-bold text-lg text-gray-800 flex items-center gap-2">
                    📦 ${file.replace('.tgz', '')}
                </h3>
                <p class="text-sm text-gray-500 mt-1">Run instantly on any PC:</p>
                <code class="mt-2 block bg-gray-900 text-green-400 px-3 py-1.5 rounded text-sm font-mono shadow-inner">
                    > xpm ${file.split('-')[0]}
                </code>
            </div>
            <div class="flex flex-col gap-2">
                <a href="/download/${file}" class="px-4 py-2 bg-blue-50 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition text-center border border-blue-200">
                    Download .tgz
                </a>
                <form action="/delete-ui/${file}" method="POST" onsubmit="return confirm('Are you sure you want to permanently delete ${file}?');">
                    <button type="submit" class="w-full px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition border border-red-200">
                        Delete
                    </button>
                </form>
            </div>
        </div>
    `).join('');

    if (files.length === 0) {
        packagesHtml = `
            <div class="text-center text-gray-400 py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <p class="text-lg">No packages published yet.</p>
                <p class="text-sm mt-1">Use the XPM CLI to publish your first package!</p>
            </div>
        `;
    }

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>XPM Registry Hub</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-50 min-h-screen font-sans">
        <div class="max-w-4xl mx-auto p-6">
            
            <!-- HEADER -->
            <header class="flex justify-between items-center py-6 mb-8 border-b border-gray-200">
                <div>
                    <h1 class="text-3xl font-black text-gray-900 tracking-tight">XPM Registry Central</h1>
                    <p class="text-gray-500 text-sm mt-1">Your professional private package manager.</p>
                </div>
                <a href="/download-cli" class="bg-gray-900 text-white px-5 py-3 rounded-xl font-bold hover:bg-black transition flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Download XPM for Windows
                </a>
            </header>
            
            <!-- PACKAGE LIST -->
            <main>
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-800">Published Packages</h2>
                    <span class="bg-indigo-100 text-indigo-800 text-sm font-bold px-3 py-1 rounded-full shadow-sm">${files.length} Total</span>
                </div>
                
                <div class="space-y-4">
                    ${packagesHtml}
                </div>
            </main>
        </div>
    </body>
    </html>
    `;
    res.send(html);
});

// UI Delete action (Browsers use POST for forms)
app.post('/delete-ui/:filename', (req, res) => {
    const filePath = path.join(REGISTRY_DIR, req.params.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.redirect('/');
});


// ==========================================
// ⚙️ API ROUTES (Used by the CLI)
// ==========================================
app.post('/publish', upload.single('package'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No package file uploaded.' });
    res.json({ message: 'Package published successfully!', filename: req.file.filename });
});

app.get('/packages', (req, res) => {
    const files = fs.readdirSync(REGISTRY_DIR).filter(f => f.endsWith('.tgz'));
    res.json({ packages: files });
});

app.get('/download/:filename', (req, res) => {
    const filePath = path.join(REGISTRY_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Package not found' });
    res.download(filePath);
});

app.delete('/delete/:filename', (req, res) => {
    const filePath = path.join(REGISTRY_DIR, req.params.filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ message: 'Package deleted.' });
    } else {
        res.status(404).json({ error: 'Package not found.' });
    }
});

// CLI Download Route (Serves the compiled .exe or script)
app.get('/download-cli', (req, res) => {
    const exePath = path.join(PUBLIC_DIR, 'xpm.exe');
    if (fs.existsSync(exePath)) {
        res.download(exePath, 'xpm.exe');
    } else {
        res.send("CLI executable is still building, please try again in a minute.");
    }
});

app.listen(PORT, () => {
    console.log(\`🚀 XPM Registry Server running on port \${PORT}\`);
});
