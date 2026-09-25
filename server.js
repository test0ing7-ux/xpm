require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const cors = require('cors');

const User = require('./models/User');
const Package = require('./models/Package');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- MONGODB CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- SESSION & PASSPORT SETUP ---
app.use(session({
    secret: process.env.SESSION_SECRET || 'xpm_secret_key_123',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            user = await User.create({
                googleId: profile.id,
                email: profile.emails[0].value,
                displayName: profile.displayName,
                avatarUrl: profile.photos[0].value
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

// --- MULTER SETUP (MEMORY STORAGE FOR STATELESS RAILWAY DEPLOYS) ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- API ROUTES ---

// Publish endpoint (Requires CLI Token)
app.post('/publish', upload.single('package'), async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized. Please login to the CLI using your token.' });
        }
        
        const token = authHeader.split(' ')[1];
        const user = await User.findOne({ cliToken: token });
        if (!user) {
            return res.status(401).json({ error: 'Invalid CLI Token.' });
        }

        const filename = req.file.originalname;
        const match = filename.match(/^(.*)-(\d+\.\d+\.\d+)\.tgz$/);
        if (!match) return res.status(400).json({ error: 'Invalid package filename format.' });

        const pkgName = match[1];
        const pkgVersion = match[2];

        let pkg = await Package.findOne({ name: pkgName });
        if (pkg) {
            if (pkg.author.toString() !== user._id.toString()) {
                return res.status(403).json({ error: `Package name '${pkgName}' is already taken by another user.` });
            }
            pkg.version = pkgVersion;
            pkg.filename = filename;
            pkg.tarball = req.file.buffer;
            if (req.body.readme) pkg.readme = req.body.readme;
            await pkg.save();
        } else {
            await Package.create({
                name: pkgName,
                version: pkgVersion,
                author: user._id,
                filename: filename,
                tarball: req.file.buffer,
                readme: req.body.readme || ''
            });
        }

        res.json({ message: `Package ${pkgName}@${pkgVersion} published successfully!` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Download package
app.get('/download/:filename', async (req, res) => {
    const match = req.params.filename.match(/^(.*)-(\d+\.\d+\.\d+)\.tgz$/);
    if (!match) return res.status(400).send('Invalid filename format');
    
    const pkg = await Package.findOne({ name: match[1] });
    if (!pkg || !pkg.tarball) return res.status(404).json({ error: 'Package not found' });
    
    // Increment downloads stat
    pkg.downloads += 1;
    pkg.save();
    
    res.set('Content-Type', 'application/gzip');
    res.set('Content-Disposition', \`attachment; filename="\${req.params.filename}"\`);
    res.send(pkg.tarball);
});

// List packages (For CLI resolution)
app.get('/packages', async (req, res) => {
    try {
        const pkgs = await Package.find({}, 'filename');
        const tgzFiles = pkgs.map(p => p.filename).filter(Boolean);
        res.json({ packages: tgzFiles });
    } catch(e) {
        res.status(500).json({ error: 'Failed to list packages' });
    }
});

// --- WEB UI (PROFESSIONAL VERCEL/STRIPE AESTHETIC) ---

const getLayout = (content, user) => \`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XPM - The Windows Package Manager</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown-light.min.css">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #fafafa; }
        .glass-nav { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .gradient-text { background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-image: linear-gradient(90deg, #000 0%, #666 100%); }
    </style>
</head>
<body class="text-gray-900 antialiased min-h-screen flex flex-col">
    <!-- Navbar -->
    <nav class="glass-nav fixed top-0 w-full z-50 border-b border-gray-200/60 transition-all duration-300">
        <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <a href="/" class="text-2xl font-extrabold tracking-tight flex items-center gap-2">
                <div class="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center text-sm shadow-md">X</div>
                XPM
            </a>
            
            <div class="hidden md:flex flex-1 max-w-lg mx-8 relative group">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <input type="text" placeholder="Search for packages..." class="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-full bg-gray-50/50 text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all">
            </div>

            <div class="flex items-center gap-4">
                \${user ? \`
                    <div class="flex items-center gap-3">
                        <img src="\${user.avatarUrl}" class="w-8 h-8 rounded-full border border-gray-200 shadow-sm">
                        <span class="text-sm font-medium hidden sm:block">\${user.displayName}</span>
                        <a href="/logout" class="text-gray-500 hover:text-black text-sm font-medium transition-colors ml-2">Log out</a>
                    </div>
                \` : \`
                    <a href="/auth/google" class="text-gray-600 hover:text-black font-medium text-sm transition-colors">Sign in</a>
                    <a href="/auth/google" class="bg-black hover:bg-gray-800 text-white font-medium py-2 px-4 text-sm rounded-full shadow-md hover:shadow-lg transition-all">Sign up</a>
                \`}
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-1 mt-16 flex flex-col">
        \${content}
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-200 bg-white py-12 mt-auto">
        <div class="max-w-7xl mx-auto px-6 text-center">
            <div class="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center text-lg font-bold mx-auto mb-4">X</div>
            <p class="text-gray-500 text-sm mb-2">Designed for Windows developers. Built with precision.</p>
            <p class="text-gray-400 text-xs">&copy; 2026 XPM Registry. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>
\`;

app.get('/', async (req, res) => {
    const packages = await Package.find().populate('author', 'displayName avatarUrl').sort({ downloads: -1 });

    const packageCards = packages.map(pkg => \`
        <a href="/package/\${pkg.name}" class="group block bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:border-gray-300 transition-all duration-300 transform hover:-translate-y-1">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">\${pkg.name}</h3>
                <span class="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full font-mono">v\${pkg.version}</span>
            </div>
            <p class="text-gray-500 text-sm mb-6 line-clamp-2">\${pkg.description || 'A powerful CLI tool built for the modern Windows ecosystem.'}</p>
            <div class="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                <div class="flex items-center gap-2">
                    <img src="\${pkg.author?.avatarUrl || ''}" class="w-6 h-6 rounded-full border border-gray-200">
                    <span class="text-xs font-medium text-gray-600">\${pkg.author?.displayName || 'Unknown'}</span>
                </div>
                <div class="flex items-center gap-1 text-gray-400 text-xs font-medium">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    \${pkg.downloads}
                </div>
            </div>
        </a>
    \`).join('') || '<div class="col-span-full text-center py-20 text-gray-400 font-medium">No packages published yet. Be the first!</div>';

    let dashboard = '';
    if (req.user) {
        dashboard = \`
            <div class="max-w-7xl mx-auto px-6 mb-12">
                <div class="bg-black rounded-3xl p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-20 -mt-20 pointer-events-none"></div>
                    <h2 class="text-2xl font-bold mb-2 relative z-10">Welcome back, \${req.user.displayName.split(' ')[0]}</h2>
                    <p class="text-gray-400 mb-6 max-w-xl relative z-10">Use your secret CLI token to publish packages directly from your terminal. Treat this token like a password.</p>
                    
                    <div class="flex flex-col sm:flex-row gap-3 relative z-10">
                        <div class="relative flex-1 max-w-md">
                            <input type="password" id="cliToken" readonly value="\${req.user.cliToken}" class="w-full bg-gray-900 border border-gray-700 text-gray-300 text-sm font-mono p-3 pl-4 rounded-xl focus:outline-none focus:border-gray-500">
                        </div>
                        <button onclick="
                            const el = document.getElementById('cliToken'); 
                            el.type = 'text'; 
                            navigator.clipboard.writeText(el.value); 
                            this.innerHTML = 'Copied!'; 
                            this.classList.add('bg-green-600', 'hover:bg-green-500'); 
                            setTimeout(() => { el.type = 'password'; this.innerHTML = 'Copy Token'; this.classList.remove('bg-green-600', 'hover:bg-green-500'); }, 2000);
                        " class="bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-all shadow-md whitespace-nowrap">
                            Copy Token
                        </button>
                    </div>
                </div>
            </div>
        \`;
    }

    const content = \`
        \${req.user ? '' : \`
        <div class="pt-24 pb-16 px-6 text-center relative overflow-hidden">
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-400/20 to-purple-500/20 blur-[100px] rounded-full pointer-events-none"></div>
            <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 relative z-10 gradient-text">
                Build perfect<br>Windows workflows.
            </h1>
            <p class="text-lg text-gray-500 max-w-2xl mx-auto mb-10 relative z-10">
                XPM is the modern, blazing fast registry for Windows. Publish your CLI tools instantly, execute them seamlessly, and manage your projects with unparalleled developer experience.
            </p>
            <div class="flex items-center justify-center gap-4 relative z-10">
                <div class="bg-gray-900 text-white pl-6 pr-2 py-2 rounded-full flex items-center gap-4 shadow-xl border border-gray-800">
                    <code class="font-mono text-sm text-gray-300">winget install test0ing7-ux.xpm</code>
                    <button onclick="navigator.clipboard.writeText('winget install test0ing7-ux.xpm')" class="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </button>
                </div>
            </div>
        </div>
        \`}

        \${dashboard}

        <div class="max-w-7xl mx-auto px-6 py-12 w-full">
            <div class="flex items-center justify-between mb-8">
                <h2 class="text-2xl font-bold text-gray-900 tracking-tight">Trending Packages</h2>
                <a href="#" class="text-sm font-semibold text-blue-600 hover:text-blue-800">View all &rarr;</a>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                \${packageCards}
            </div>
        </div>
    \`;

    res.send(getLayout(content, req.user));
});

app.get('/package/:name', async (req, res) => {
    const pkg = await Package.findOne({ name: req.params.name }).populate('author');
    if (!pkg) return res.status(404).send('Package not found');
    
    const content = \`
        <div class="bg-white border-b border-gray-200 pt-12 pb-8">
            <div class="max-w-7xl mx-auto px-6">
                <div class="flex items-center gap-3 mb-2">
                    <h1 class="text-3xl font-extrabold tracking-tight text-gray-900">\${pkg.name}</h1>
                    <span class="bg-blue-100 text-blue-700 text-sm font-bold px-3 py-1 rounded-full font-mono">v\${pkg.version}</span>
                </div>
                <p class="text-gray-500 text-lg mb-6">A powerful executable distributed via XPM.</p>
                
                <div class="flex gap-8 text-sm font-semibold border-b border-gray-200 mt-8">
                    <span class="text-black border-b-2 border-black pb-3 px-1">Readme</span>
                    <span class="text-gray-400 cursor-not-allowed pb-3 px-1">Code</span>
                    <span class="text-gray-400 cursor-not-allowed pb-3 px-1">Dependencies</span>
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-6 py-10 flex flex-col lg:flex-row gap-12 w-full">
            <div class="flex-1 min-w-0">
                <div id="readme" class="markdown-body bg-white border border-gray-100 p-8 rounded-2xl shadow-sm"></div>
            </div>
            
            <div class="w-full lg:w-80 shrink-0">
                <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-24">
                    <h3 class="font-bold text-gray-900 mb-3">Install</h3>
                    <div class="flex items-center justify-between border border-gray-200 bg-gray-50 rounded-xl p-3 mb-6 hover:border-gray-300 transition-colors cursor-text group" onclick="navigator.clipboard.writeText('xpm install \${pkg.name}');">
                        <code class="text-sm font-mono text-gray-700">xpm install \${pkg.name}</code>
                        <div class="bg-white border border-gray-200 p-1.5 rounded-md group-hover:shadow-sm">
                            <svg class="w-4 h-4 text-gray-400 group-hover:text-black cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Weekly Downloads</h3>
                            <div class="flex items-center gap-2">
                                <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                <p class="text-2xl font-bold text-gray-900">\${pkg.downloads}</p>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                            <div>
                                <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Version</h3>
                                <p class="text-sm font-bold text-gray-900">\${pkg.version}</p>
                            </div>
                            <div>
                                <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">License</h3>
                                <p class="text-sm font-bold text-gray-900">MIT</p>
                            </div>
                        </div>

                        <div class="border-t border-gray-100 pt-4">
                            <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Publisher</h3>
                            <div class="flex items-center gap-3">
                                <img src="\${pkg.author?.avatarUrl || ''}" class="w-10 h-10 rounded-full border border-gray-200">
                                <span class="text-sm font-bold text-gray-900">\${pkg.author?.displayName || 'Unknown'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            document.getElementById('readme').innerHTML = marked.parse(${JSON.stringify(pkg.readme || '# ' + pkg.name + '\\n\\nNo README provided.')});
        </script>
    \`;

    res.send(getLayout(content, req.user));
});

app.listen(PORT, () => console.log('🚀 XPM Server running on port ' + PORT));
