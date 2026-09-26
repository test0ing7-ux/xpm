const crypto = require('crypto');
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const multer = require('multer');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const cors = require('cors');

const User = require('./models/User');
const Package = require('./models/Package');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- MONGODB CONNECTION ---
let gfs;
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

mongoose.connection.once('open', () => {
    gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'tarballs' });
    console.log('✅ GridFS Bucket ready');
});

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
                avatarUrl: profile.photos[0].value,
                cliToken: 'xpm_' + crypto.randomBytes(24).toString('hex')
            });
        } else if (!user.cliToken) {
            user.cliToken = 'xpm_' + crypto.randomBytes(24).toString('hex');
            await user.save();
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
app.get('/auth/cli', (req, res, next) => {
    const port = req.query.port || '';
    passport.authenticate('google', { scope: ['profile', 'email'], state: port })(req, res, next);
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
    const port = req.query.state;
    if (port) {
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

// --- MULTER SETUP (TEMP DISK FOR GRIDFS STREAMING) ---
const upload = multer({ dest: os.tmpdir() });

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
            if (req.body.readme) pkg.readme = req.body.readme;
        } else {
            pkg = new Package({
                name: pkgName,
                version: pkgVersion,
                author: user._id,
                filename: filename,
                readme: req.body.readme || ''
            });
        }

        // Delete old GridFS file if it exists
        if (pkg.tarballId) {
            try { await gfs.delete(pkg.tarballId); } catch(e) {}
        }

        // Upload to GridFS
        const uploadStream = gfs.openUploadStream(filename);
        const readStream = fs.createReadStream(req.file.path);
        readStream.pipe(uploadStream);
        
        await new Promise((resolve, reject) => {
            uploadStream.on('finish', resolve);
            uploadStream.on('error', reject);
        });

        pkg.tarballId = uploadStream.id;
        pkg.tarballSize = req.file.size;
        await pkg.save();
        
        // Clean up temp file
        fs.unlinkSync(req.file.path);

        res.json({ message: `Package ${pkgName}@${pkgVersion} published successfully (Size: ${(req.file.size/1024/1024).toFixed(2)} MB)!` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Server error' });
    }
});

// Delete package
app.delete('/package/:name', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
        
        const token = authHeader.split(' ')[1];
        const user = await User.findOne({ cliToken: token });
        if (!user) return res.status(401).json({ error: 'Invalid token' });

        const pkg = await Package.findOne({ name: req.params.name });
        if (!pkg) return res.status(404).json({ error: 'Package not found' });
        if (pkg.author.toString() !== user._id.toString()) return res.status(403).json({ error: 'You are not the owner of this package.' });

        if (pkg.tarballId) {
            try { await gfs.delete(pkg.tarballId); } catch(e) {}
        }
        await Package.deleteOne({ _id: pkg._id });
        res.json({ message: `Package ${pkg.name} deleted successfully.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Download package
app.get('/download/:filename', async (req, res) => {
    const match = req.params.filename.match(/^(.*)-(\d+\.\d+\.\d+)\.tgz$/);
    if (!match) return res.status(400).send('Invalid filename format');
    
    const pkg = await Package.findOne({ name: match[1] });
    if (!pkg || !pkg.tarballId) return res.status(404).json({ error: 'Package not found' });
    
    // Increment downloads stat
    pkg.downloads += 1;
    pkg.save();
    
    res.set('Content-Type', 'application/gzip');
    res.set('Content-Disposition', `attachment; filename="${req.params.filename}"`);
    
    const downloadStream = gfs.openDownloadStream(pkg.tarballId);
    downloadStream.on('error', () => res.status(404).json({ error: 'File stream not found in GridFS' }));
    downloadStream.pipe(res);
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


// Delete Account
app.delete('/account', async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    try {
        const userPackages = await Package.find({ author: req.user._id });
        
        for (const pkg of userPackages) {
            if (pkg.tarballId) {
                try { await gfs.delete(pkg.tarballId); } catch(e) {}
            }
        }
        
        await Package.deleteMany({ author: req.user._id });
        await User.deleteOne({ _id: req.user._id });
        
        req.logout(() => {
            res.json({ message: 'Account and all packages deleted successfully.' });
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

// Username routes
app.post('/profile/username', express.json(), async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    
    const token = authHeader.split(' ')[1];
    const user = await User.findOne({ cliToken: token });
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    
    const { username } = req.body;
    if (!username || !/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
        return res.status(400).json({ error: 'Invalid username format (3-20 chars, letters/numbers/_-)' });
    }
    
    if (user.username) {
        return res.status(400).json({ error: 'Username already set' });
    }
    
    const existing = await User.findOne({ username: { $regex: new RegExp('^' + username + '$', 'i') } });
    if (existing) {
        return res.status(400).json({ error: 'Username already taken' });
    }
    
    user.username = username;
    await user.save();
    res.json({ success: true, username: user.username });
});

const getUserView = require('./views/user');
app.get('/user/:username', async (req, res) => {
    const userProfile = await User.findOne({ username: { $regex: new RegExp('^' + req.params.username + '$', 'i') } });
    if (!userProfile) return res.status(404).send('User not found');
    
    const packages = await Package.find({ author: userProfile._id }).sort({ downloads: -1 });
    res.send(getLayout(getUserView(userProfile, packages), req.user));
});

// --- WEB UI (PROFESSIONAL VERCEL/STRIPE AESTHETIC) ---
const getLayout = require('./views/layout');
const getHomeView = require('./views/home');
const getPackageView = require('./views/package');
const getProfileView = require('./views/profile');
const getSearchView = require('./views/search');
const getHelpView = require('./views/help');
const getBillingView = require('./views/billing');

app.get('/', async (req, res) => {
    const packages = await Package.find().populate('author', 'displayName avatarUrl').sort({ downloads: -1 }).limit(12);
    res.send(getLayout(getHomeView(packages, req.user), req.user));
});

const tar = require('tar');
app.get('/package/:name', async (req, res) => {
    const pkg = await Package.findOne({ name: req.params.name }).populate('author');
    if (!pkg) return res.status(404).send('Package not found');
    
    const tab = req.query.tab || 'readme';
    let fileContent = null;
    let requestedFile = req.query.file || null;
    
    if (tab === 'code' || tab === 'dependencies') {
        let needsExtract = false;
        
        // If we don't have fileTree or dependencies cached, or we need to read a specific file
        if (!pkg.fileTree || pkg.fileTree.length === 0 || !pkg.dependencies || requestedFile) {
            needsExtract = true;
        }

        if (needsExtract && pkg.tarballId) {
            const tmpZip = path.join(os.tmpdir(), 'xpm_' + pkg.tarballId + '.tgz');
            const extractDir = path.join(os.tmpdir(), 'xpm_ext_' + pkg.tarballId);
            
            try {
                // Download
                const downloadStream = gfs.openDownloadStream(pkg.tarballId);
                const writeStream = fs.createWriteStream(tmpZip);
                downloadStream.pipe(writeStream);
                
                await new Promise((resolve, reject) => {
                    writeStream.on('finish', resolve);
                    writeStream.on('error', reject);
                });
                
                // Extract
                if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true });
                fs.mkdirSync(extractDir, { recursive: true });
                await tar.x({ file: tmpZip, cwd: extractDir });
                
                // Cache Tree and Dependencies
                if (!pkg.fileTree || pkg.fileTree.length === 0) {
                    const walkSync = (dir, filelist = [], base = '') => {
                        const files = fs.readdirSync(dir);
                        for (const file of files) {
                            const filepath = path.join(dir, file);
                            const relative = path.join(base, file).replace(/\\/g, '/');
                            if (fs.statSync(filepath).isDirectory()) {
                                filelist = walkSync(filepath, filelist, relative);
                            } else {
                                filelist.push(relative);
                            }
                        }
                        return filelist;
                    };
                    pkg.fileTree = walkSync(extractDir);
                    
                    let pkgJsonPath = path.join(extractDir, 'package.json');
                    if (fs.existsSync(pkgJsonPath)) {
                        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
                        pkg.dependencies = pkgJson.dependencies || {};
                    }
                    await pkg.save();
                }

                // Read specific file content
                if (requestedFile) {
                    const targetFile = path.join(extractDir, requestedFile);
                    if (fs.existsSync(targetFile)) {
                        // Ensure it's not a huge binary
                        const stat = fs.statSync(targetFile);
                        if (stat.size < 500 * 1024) { // < 500KB
                            fileContent = fs.readFileSync(targetFile, 'utf-8');
                            // Simple binary check
                            if (fileContent.includes('\x00')) fileContent = null;
                        }
                    }
                }
            } catch (err) {
                console.error('Extraction error:', err);
            } finally {
                if (fs.existsSync(tmpZip)) fs.unlinkSync(tmpZip);
                if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true });
            }
        }
    }
    
    res.send(getLayout(getPackageView(pkg, tab, requestedFile, fileContent), req.user));
});

app.get('/search', async (req, res) => {
    const query = req.query.q || '';
    const packages = await Package.find({ name: { $regex: query, $options: 'i' } }).populate('author');
    res.send(getLayout(getSearchView(query, packages), req.user));
});

app.get('/profile', async (req, res) => {
    if (!req.user) return res.redirect('/auth/google');
    const userPackages = await Package.find({ author: req.user._id }).sort({ createdAt: -1 });
    res.send(getLayout(getProfileView(req.user, userPackages), req.user));
});

app.get('/help', (req, res) => {
    res.send(getLayout(getHelpView(), req.user));
});

app.get('/billing', (req, res) => {
    res.send(getLayout(getBillingView(), req.user));
});

app.listen(PORT, () => console.log('🚀 XPM Server running on port ' + PORT));
