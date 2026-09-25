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
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
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
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/');
});
app.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/'));
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
            await pkg.save();
        } else {
            // Create new package
            await Package.create({
                name: pkgName,
                version: pkgVersion,
                author: user._id,
                filename: filename
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

// --- WEB UI (TAILWIND + DARK MODE) ---
app.get('/', async (req, res) => {
    const user = req.user;
    const packages = await Package.find().populate('author', 'displayName avatarUrl').sort({ downloads: -1 });

    let authSection = `
        <a href="/auth/google" class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-6 rounded-lg transition-all shadow-lg flex items-center gap-2">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866.549 3.921 1.453l2.814-2.814C17.503 2.988 15.139 2 12.545 2 7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.761h-9.426z"/></svg>
            Sign in with Google
        </a>
    `;

    let dashboardSection = '';

    if (user) {
        authSection = `
            <div class="flex items-center gap-4">
                <img src="${user.avatarUrl}" class="w-10 h-10 rounded-full border-2 border-indigo-500">
                <div class="text-left hidden sm:block">
                    <p class="text-sm text-gray-300">Welcome,</p>
                    <p class="font-bold text-white">${user.displayName}</p>
                </div>
                <a href="/logout" class="ml-4 text-sm text-gray-400 hover:text-white transition-colors">Logout</a>
            </div>
        `;

        dashboardSection = `
            <div class="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8 shadow-xl">
                <h2 class="text-xl font-bold text-white mb-4">🔑 Your Secret CLI Token</h2>
                <p class="text-gray-400 text-sm mb-4">You need this token to publish packages from your terminal. Do not share it!</p>
                <div class="flex gap-2">
                    <input type="text" readonly value="${user.cliToken}" class="flex-1 bg-gray-900 text-green-400 font-mono p-3 rounded-lg border border-gray-700 focus:outline-none">
                    <button onclick="navigator.clipboard.writeText('${user.cliToken}'); alert('Token Copied!')" class="bg-gray-700 hover:bg-gray-600 text-white px-4 rounded-lg font-bold transition">Copy</button>
                </div>
            </div>
        `;
    }

    const packageHTML = packages.map(pkg => `
        <div class="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-indigo-500 transition-all shadow-md">
            <div class="flex justify-between items-start mb-3">
                <h3 class="text-xl font-bold text-indigo-400">${pkg.name}</h3>
                <span class="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded font-mono">v${pkg.version}</span>
            </div>
            <p class="text-gray-400 text-sm mb-4">Published by ${pkg.author ? pkg.author.displayName : 'Unknown'}</p>
            <div class="flex justify-between items-center text-sm">
                <code class="text-gray-400 bg-gray-900 px-3 py-1 rounded-lg">xpm -y ${pkg.name}</code>
                <span class="text-indigo-400 font-semibold">${pkg.downloads} downloads</span>
            </div>
        </div>
    `).join('') || '<p class="text-gray-500 col-span-3 text-center py-10">No packages published yet.</p>';

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>XPM Package Registry</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-900 text-gray-100 min-h-screen font-sans">
            <nav class="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
                <div class="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20">X</div>
                        <h1 class="text-2xl font-extrabold tracking-tight">XPM <span class="text-indigo-500">Registry</span></h1>
                    </div>
                    ${authSection}
                </div>
            </nav>

            <main class="max-w-6xl mx-auto px-6 py-12">
                ${dashboardSection}

                <div class="mb-8 flex justify-between items-end">
                    <div>
                        <h2 class="text-3xl font-bold mb-2">Explore Packages</h2>
                        <p class="text-gray-400">Discover and run global CLI tools instantly.</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${packageHTML}
                </div>
            </main>
        </body>
        </html>
    `);
});

app.listen(PORT, () => console.log(\`🚀 XPM Server running on port \${PORT}\`));
