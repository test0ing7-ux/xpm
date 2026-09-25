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
    
    let packagesHtml = files.map(file => {
        const pkgName = file.replace('.tgz', '');
        return `
        <div class="pkg-item glass-card p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center transition hover:border-brand/50 group" data-name="${pkgName}">
            <div class="mb-4 md:mb-0">
                <h3 class="font-bold text-xl text-white flex items-center gap-2">
                    <svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                    ${pkgName}
                </h3>
                <p class="text-sm text-gray-400 mt-1">Run instantly from any terminal:</p>
                <div class="mt-2 inline-flex items-center bg-black border border-white/10 rounded overflow-hidden">
                    <span class="px-3 py-1.5 text-gray-500 font-mono text-sm border-r border-white/10">$</span>
                    <code class="px-3 py-1.5 text-green-400 text-sm font-mono tracking-tight">xpm -y ${pkgName}</code>
                </div>
            </div>
            <div class="flex gap-3 w-full md:w-auto">
                <a href="/download/${file}" class="flex-1 md:flex-none px-4 py-2 bg-white/5 text-white font-medium rounded-lg hover:bg-white/10 transition text-center border border-white/10 flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    .tgz
                </a>
                <form action="/delete-ui/${file}" method="POST" onsubmit="return confirm('Permanently delete ${file}?');" class="flex-1 md:flex-none">
                    <button type="submit" class="w-full px-4 py-2 bg-red-500/10 text-red-500 font-medium rounded-lg hover:bg-red-500/20 transition border border-red-500/20 flex items-center justify-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Delete
                    </button>
                </form>
            </div>
        </div>
        `;
    }).join('');

    if (files.length === 0) {
        packagesHtml = `
            <div class="text-center py-16 glass-card rounded-2xl border-dashed border-white/20">
                <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">No packages found</h3>
                <p class="text-gray-400 max-w-md mx-auto">You haven't published any packages to your registry yet. Use the XPM CLI to publish your first package.</p>
            </div>
        `;
    }

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>XPM | The Native Package Manager</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
        <script>
            tailwind.config = {
                theme: {
                    extend: {
                        fontFamily: {
                            sans: ['Inter', 'sans-serif'],
                            mono: ['JetBrains Mono', 'monospace'],
                        },
                        colors: {
                            brand: '#0070F3',
                            dark: '#111111',
                            darker: '#000000',
                        }
                    }
                }
            }
        </script>
        <style>
            body { background: #000; color: #fff; }
            .glass-card {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
            }
            .grid-bg {
                background-size: 40px 40px;
                background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                                  linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
                mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
                -webkit-mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
            }
        </style>
    </head>
    <body class="min-h-screen font-sans selection:bg-brand selection:text-white pb-20">
        
        <!-- Animated Background Grid -->
        <div class="fixed inset-0 grid-bg z-[-1] opacity-50"></div>

        <!-- Navbar -->
        <nav class="border-b border-white/10 bg-darker/80 backdrop-blur-md sticky top-0 z-50">
            <div class="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded bg-brand flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(0,112,243,0.5)]">X</div>
                    <span class="font-bold text-lg tracking-tight">XPM Registry</span>
                </div>
                <div class="flex items-center gap-4">
                    <span class="text-sm text-gray-400"><span class="w-2 h-2 inline-block rounded-full bg-green-500 mr-2 animate-pulse"></span>System Online</span>
                </div>
            </div>
        </nav>

        <div class="max-w-5xl mx-auto px-6 mt-16">
            
            <!-- Hero Section -->
            <div class="flex flex-col items-center text-center mb-20 mt-10">
                <h1 class="text-5xl md:text-6xl font-extrabold tracking-tighter mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                    The Global Package Hub
                </h1>
                <p class="text-xl text-gray-400 max-w-2xl mb-8">
                    Lightning fast, native, and built for Windows. Download the XPM tool once and run your code anywhere.
                </p>
                
                <div class="flex flex-col sm:flex-row gap-4 items-center">
                    <a href="/download-cli" class="bg-white text-black px-6 py-3.5 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Download XPM (Windows)
                    </a>
                    
                    <div class="relative group cursor-pointer" onclick="navigator.clipboard.writeText('winget install xpm'); alert('Copied to clipboard!')">
                        <div class="absolute -inset-0.5 bg-gradient-to-r from-brand to-purple-600 rounded-full blur opacity-30 group-hover:opacity-70 transition duration-200"></div>
                        <div class="relative bg-dark px-6 py-3.5 rounded-full border border-white/10 font-mono text-sm flex items-center gap-3">
                            <span class="text-brand">$</span> <span class="text-gray-200">winget install xpm</span>
                            <svg class="w-4 h-4 text-gray-500 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Statistics -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                <div class="glass-card p-6 rounded-2xl flex flex-col items-center justify-center">
                    <span class="text-3xl font-black text-white">${files.length}</span>
                    <span class="text-sm text-gray-400 font-medium mt-1">Packages</span>
                </div>
                <div class="glass-card p-6 rounded-2xl flex flex-col items-center justify-center">
                    <span class="text-3xl font-black text-white text-green-400">99.9%</span>
                    <span class="text-sm text-gray-400 font-medium mt-1">Uptime</span>
                </div>
                <div class="glass-card p-6 rounded-2xl flex flex-col items-center justify-center">
                    <span class="text-3xl font-black text-white text-brand">v1.0.0</span>
                    <span class="text-sm text-gray-400 font-medium mt-1">Latest Version</span>
                </div>
                <div class="glass-card p-6 rounded-2xl flex flex-col items-center justify-center">
                    <span class="text-3xl font-black text-white text-purple-400">Winget</span>
                    <span class="text-sm text-gray-400 font-medium mt-1">Global Support</span>
                </div>
            </div>

            <!-- PACKAGE REGISTRY SECTION -->
            <div class="mb-8 flex justify-between items-end">
                <div>
                    <h2 class="text-2xl font-bold tracking-tight">Package Registry</h2>
                    <p class="text-gray-400 text-sm mt-1">Explore and manage published packages.</p>
                </div>
                
                <div class="relative">
                    <input type="text" id="searchInput" placeholder="Search packages..." class="bg-white/5 border border-white/10 text-white text-sm rounded-lg focus:ring-brand focus:border-brand block w-64 p-2.5 outline-none transition-all focus:bg-white/10" onkeyup="searchPackages()">
                    <svg class="w-4 h-4 absolute right-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
            </div>
            
            <div class="space-y-4" id="packageList">
                ${packagesHtml}
            </div>
        </div>

        <script>
            function searchPackages() {
                let input = document.getElementById('searchInput').value.toLowerCase();
                let packages = document.querySelectorAll('.pkg-item');
                packages.forEach(pkg => {
                    let title = pkg.getAttribute('data-name').toLowerCase();
                    if (title.includes(input)) {
                        pkg.style.display = "flex";
                    } else {
                        pkg.style.display = "none";
                    }
                });
            }
        </script>
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
    console.log(`🚀 XPM Registry Server running on port ${PORT}`);
});
