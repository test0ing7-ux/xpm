require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require('crypto');

const User = require('./models/User');
const Package = require('./models/Package');

const app = express();
const PORT = process.env.PORT || 3000;
const REGISTRY_DIR = path.join(__dirname, 'registry_data');

if (!fs.existsSync(REGISTRY_DIR)) fs.mkdirSync(REGISTRY_DIR, { recursive: true });

// --- MONGODB CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'xpm_secret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// --- PASSPORT GOOGLE AUTH ---
const callbackUrl = process.env.RAILWAY_STATIC_URL 
    ? `https://${process.env.RAILWAY_STATIC_URL}/auth/google/callback` 
    : 'http://localhost:3000/auth/google/callback';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackUrl
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            user = await User.create({
                googleId: profile.id,
                email: profile.emails[0].value,
                displayName: profile.displayName,
                avatarUrl: profile.photos[0].value,
                cliToken: crypto.randomBytes(16).toString('hex')
            });
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

// --- AUTH ROUTES ---
app.get('/auth/cli', (req, res) => {
    req.session.cliPort = req.query.port;
    res.redirect('/auth/google');
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
    if (req.session.cliPort) {
        const port = req.session.cliPort;
        delete req.session.cliPort;
        res.redirect(`http://localhost:${port}/callback?token=${req.user.cliToken}`);
    } else {
        res.redirect('/');
    }
});
app.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/'));
});

app.get('/whoami', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const user = await User.findOne({ cliToken: token });
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    res.json({ username: user.displayName, email: user.email });
});

// --- MULTER SETUP (FOR PACKAGE UPLOADS) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, REGISTRY_DIR),
    filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// --- API ROUTES ---

// Publish endpoint (Requires CLI Token)
app.post('/publish', upload.single('package'), async (req, res) => {
    try {
        // 1. Auth check
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            fs.unlinkSync(req.file.path); // delete uploaded file
            return res.status(401).json({ error: 'Unauthorized. Please login to the CLI using your token.' });
        }
        
        const token = authHeader.split(' ')[1];
        const user = await User.findOne({ cliToken: token });
        if (!user) {
            fs.unlinkSync(req.file.path);
            return res.status(401).json({ error: 'Invalid CLI Token.' });
        }

        // 2. Parse filename (e.g. godsplan-3.0.2.tgz)
        const filename = req.file.originalname;
        const match = filename.match(/^(.*)-(\d+\.\d+\.\d+)\.tgz$/);
        if (!match) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Invalid package filename format.' });
        }

        const pkgName = match[1];
        const pkgVersion = match[2];

        // 3. Unique Name / Ownership Check
        let pkg = await Package.findOne({ name: pkgName });
        if (pkg) {
            if (pkg.author.toString() !== user._id.toString()) {
                fs.unlinkSync(req.file.path);
                return res.status(403).json({ error: `Package name '${pkgName}' is already taken by another user.` });
            }
            // Update existing package
            pkg.version = pkgVersion;
            pkg.filename = filename;
            if (req.body.readme) pkg.readme = req.body.readme;
            await pkg.save();
        } else {
            // Create new package
            await Package.create({
                name: pkgName,
                version: pkgVersion,
                author: user._id,
                filename: filename,
                readme: req.body.readme || ''
            });
        }

        res.json({ message: `Package ${pkgName}@${pkgVersion} published successfully!` });
    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: 'Server error' });
    }
});

// Download package
app.get('/download/:filename', async (req, res) => {
    const filePath = path.join(REGISTRY_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Package not found' });
    
    // Increment download count safely in background
    const match = req.params.filename.match(/^(.*)-(\d+\.\d+\.\d+)\.tgz$/);
    if (match) {
        Package.findOneAndUpdate({ name: match[1] }, { $inc: { downloads: 1 } }).exec();
    }
    
    res.download(filePath);
});

// List packages (For CLI resolution)
app.get('/packages', (req, res) => {
    fs.readdir(REGISTRY_DIR, (err, files) => {
        if (err) return res.status(500).json({ error: 'Failed to list packages' });
        const tgzFiles = files.filter(f => f.endsWith('.tgz'));
        res.json({ packages: tgzFiles });
    });
});

// --- WEB UI (NPM REPLICA) ---
app.get('/', async (req, res) => {
    const user = req.user;
    const packages = await Package.find().populate('author', 'displayName avatarUrl').sort({ downloads: -1 });

    let authSection = `
        <div class="flex items-center gap-4">
            <a href="/auth/google" class="text-black font-semibold text-sm hover:opacity-80">Sign In</a>
            <a href="/auth/google" class="bg-white border border-black hover:bg-gray-100 text-black font-semibold py-1.5 px-4 text-sm rounded">Sign Up</a>
        </div>
    `;

    if (user) {
        authSection = `
            <div class="flex items-center gap-3">
                <img src="${user.avatarUrl}" class="w-8 h-8 rounded-full border border-gray-300">
                <a href="/logout" class="text-gray-600 hover:text-black text-sm">Logout</a>
            </div>
        `;
    }

    const packageHTML = packages.map(pkg => `
        <div class="border-b border-gray-200 py-4 hover:bg-gray-50 transition-colors">
            <a href="/package/${pkg.name}" class="text-lg font-bold text-[#cb3837] hover:underline hover:text-red-700 block mb-1">${pkg.name}</a>
            <p class="text-gray-600 text-sm mb-3 font-serif">${pkg.description || 'No description provided.'}</p>
            <div class="flex items-center gap-4 text-xs text-gray-500">
                <span class="flex items-center gap-1 font-bold"><svg class="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 5h2v5h-2V5zm0 6h2v2H9v-2z"/></svg> v${pkg.version}</span>
                <span class="flex items-center gap-1">published by <strong class="text-gray-800">${pkg.author ? pkg.author.displayName : 'unknown'}</strong></span>
                <span class="flex items-center gap-1">⬇ ${pkg.downloads} downloads</span>
            </div>
        </div>
    `).join('') || '<p class="text-gray-500 py-10">No packages found.</p>';

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>xpm | build amazing things</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-white text-gray-900 font-sans antialiased">
            <div class="h-1 bg-[#cb3837] w-full"></div>
            
            <header class="border-b border-gray-200">
                <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-6">
                    <div class="flex items-center gap-2">
                        <a href="/" class="text-[32px] font-black tracking-tighter" style="color:#cb3837;">xpm</a>
                    </div>
                    
                    <div class="flex-1 max-w-4xl flex items-center bg-gray-100 px-4 py-2">
                        <svg class="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <input type="text" placeholder="Search packages" class="bg-transparent border-none outline-none w-full text-black placeholder-gray-500 text-sm">
                        <button class="bg-black text-white px-5 py-2 font-bold text-sm ml-2">Search</button>
                    </div>

                    ${authSection}
                </div>
            </header>

            <main class="max-w-7xl mx-auto px-4 py-12 flex gap-12">
                <div class="flex-1">
                    <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">Explore <span class="bg-[#cb3837]/10 text-[#cb3837] px-2 py-0.5 rounded text-sm">public</span></h2>
                    <div class="flex flex-col">
                        ${packageHTML}
                    </div>
                </div>
                <div class="w-80 hidden lg:block">
                    ${user ? `
                    <div class="border border-[#cb3837]/20 bg-[#cb3837]/5 p-5 mb-6 shadow-sm">
                        <h3 class="font-bold text-[#cb3837] mb-2 flex items-center gap-2">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
                            Your CLI Token
                        </h3>
                        <input type="text" readonly value="${user.cliToken}" class="w-full bg-white border border-gray-300 text-xs font-mono p-2 mb-2 outline-none focus:border-[#cb3837]">
                        <button onclick="navigator.clipboard.writeText('${user.cliToken}'); this.innerText='Copied!'" class="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-1.5 px-3 w-full transition-colors">Copy to clipboard</button>
                    </div>
                    ` : ''}
                    <div class="bg-gray-50 p-6 border border-gray-200">
                        <h3 class="font-bold mb-3">Install xpm</h3>
                        <code class="block bg-black text-white p-3 text-sm font-mono mb-2">winget install test0ing7-ux.xpm</code>
                        <p class="text-xs text-gray-500">Global package manager & NPX runner designed for Windows.</p>
                    </div>
                </div>
            </main>
        </body>
        </html>
    `);
});

app.get('/package/:name', async (req, res) => {
    const pkg = await Package.findOne({ name: req.params.name }).populate('author');
    if (!pkg) return res.status(404).send('Package not found');
    
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${pkg.name} - xpm</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown-light.min.css">
        </head>
        <body class="bg-white text-gray-900 font-sans antialiased">
            <div class="h-1 bg-[#cb3837] w-full"></div>
            <header class="border-b border-gray-200">
                <div class="max-w-7xl mx-auto px-4 h-16 flex items-center">
                    <a href="/" class="text-[32px] font-black tracking-tighter" style="color:#cb3837;">xpm</a>
                    <div class="flex-1 ml-6 bg-gray-100 flex items-center px-4 py-2">
                        <input type="text" placeholder="Search packages" class="bg-transparent border-none outline-none w-full text-sm">
                        <button class="bg-black text-white px-5 py-2 font-bold text-sm ml-2">Search</button>
                    </div>
                </div>
            </header>

            <div class="border-b border-gray-200 pt-8 pb-4">
                <div class="max-w-7xl mx-auto px-4">
                    <h1 class="text-2xl font-bold flex items-center gap-2">${pkg.name} <span class="text-gray-400 text-lg font-normal">v${pkg.version}</span></h1>
                    <div class="flex gap-6 mt-4 text-sm font-semibold border-b border-gray-200">
                        <span class="text-[#cb3837] border-b-2 border-[#cb3837] pb-3 px-1">Readme</span>
                        <span class="text-gray-500 hover:text-black cursor-not-allowed pb-3 px-1">Code</span>
                        <span class="text-gray-500 hover:text-black cursor-not-allowed pb-3 px-1">Versions</span>
                    </div>
                </div>
            </div>

            <main class="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-12">
                <div class="flex-1">
                    <div id="readme" class="markdown-body"></div>
                </div>
                
                <div class="w-full md:w-80">
                    <h3 class="font-bold text-gray-600 text-sm mb-2">Install</h3>
                    <div class="flex items-center justify-between border border-gray-300 p-2 mb-6 hover:border-gray-400 transition-colors cursor-text group" onclick="navigator.clipboard.writeText('xpm install ${pkg.name}');">
                        <code class="text-sm font-mono text-gray-700">xpm install ${pkg.name}</code>
                        <svg class="w-4 h-4 text-gray-400 group-hover:text-black cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </div>

                    <div class="border-t border-gray-200 py-4">
                        <h3 class="text-xs font-bold text-gray-500 mb-1">Weekly Downloads</h3>
                        <p class="text-xl font-medium">${pkg.downloads}</p>
                    </div>
                    
                    <div class="border-t border-gray-200 py-4 flex items-center justify-between">
                        <div>
                            <h3 class="text-xs font-bold text-gray-500 mb-1">Version</h3>
                            <p class="text-sm font-bold text-gray-900">${pkg.version}</p>
                        </div>
                        <div>
                            <h3 class="text-xs font-bold text-gray-500 mb-1">License</h3>
                            <p class="text-sm font-bold text-gray-900">MIT</p>
                        </div>
                    </div>

                    <div class="border-t border-gray-200 py-4">
                        <h3 class="text-xs font-bold text-gray-500 mb-2">Collaborators</h3>
                        <div class="flex items-center gap-2">
                            <img src="${pkg.author ? pkg.author.avatarUrl : ''}" title="${pkg.author ? pkg.author.displayName : ''}" class="w-10 h-10 rounded-full border border-gray-200">
                        </div>
                    </div>
                </div>
            </main>
            
            <script>
                document.getElementById('readme').innerHTML = marked.parse(${JSON.stringify(pkg.readme || '# ' + pkg.name + '\\n\\nNo README provided.')});
            </script>
        </body>
        </html>
    `);
});

app.listen(PORT, () => console.log('🚀 XPM Server running on port ' + PORT));
