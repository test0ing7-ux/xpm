const crypto = require('crypto');
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const multer = require('multer');
const mongoose = require('mongoose');
const passport = require('passport');

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
app.use(express.static(path.join(__dirname, 'public')));

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
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const axios = require('axios');

app.use(session({
    secret: process.env.SESSION_SECRET || 'xpm_secret_key_123',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
        const user = await User.findOne({ email });
        if (!user) return done(null, false, { message: 'Invalid email or password' });
        if (!user.password) return done(null, false, { message: 'Please login with Google or reset password.' });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return done(null, false, { message: 'Invalid email or password' });
        
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

// --- AUTH ROUTES ---
const getLoginView = require('./views/login');
const getRegisterView = require('./views/register');
const getVerifyView = require('./views/verify');

app.get('/login', (req, res) => {
    if (req.user) {
        if (req.query.cli_port) return res.redirect('/auth/cli?port=' + req.query.cli_port);
        return res.redirect('/');
    }
    res.send(getLayout(getLoginView(req.query.error, req.query.cli_port), req.user));
});

app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.redirect('/login?error=' + encodeURIComponent(info.message));
        if (!user.isVerified) return res.redirect('/verify?email=' + encodeURIComponent(user.email));
        
        req.logIn(user, (err) => {
            if (err) return next(err);
            if (req.query.cli_port) {
                return res.redirect('http://localhost:' + req.query.cli_port + '/callback?token=' + user.cliToken);
            }
            res.redirect('/');
        });
    })(req, res, next);
});

app.get('/register', (req, res) => {
    if (req.user) return res.redirect('/');
    res.send(getLayout(getRegisterView(req.query.error, process.env.TURNSTILE_SITE_KEY), req.user));
});

function generateOTP() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let otp = '';
    for (let i = 0; i < 6; i++) {
        otp += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return otp;
}

const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY
    }
});

app.post('/register', async (req, res) => {
    try {
        const { username, email, password, 'cf-turnstile-response': turnstileToken } = req.body;
        
        // Turnstile Validation
        if (process.env.TURNSTILE_SECRET_KEY) {
            if (!turnstileToken) return res.redirect('/register?error=' + encodeURIComponent('Please complete the CAPTCHA'));
            
            const verifyRes = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', new URLSearchParams({
                secret: process.env.TURNSTILE_SECRET_KEY,
                response: turnstileToken,
                remoteip: req.ip
            }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
            
            if (!verifyRes.data.success) {
                return res.redirect('/register?error=' + encodeURIComponent('CAPTCHA failed. Please try again.'));
            }
        }

        if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
            return res.redirect('/register?error=' + encodeURIComponent('Invalid username format'));
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.redirect('/register?error=' + encodeURIComponent('Email already in use'));
        
        const existingUsername = await User.findOne({ username: { $regex: new RegExp('^' + username + '$', 'i') } });
        if (existingUsername) return res.redirect('/register?error=' + encodeURIComponent('Username already taken'));
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const otp = generateOTP();
        
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            avatarUrl: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(username),
            cliToken: 'xpm_' + crypto.randomBytes(24).toString('hex'),
            isVerified: false,
            otp,
            otpExpires: new Date(Date.now() + 15 * 60000) // 15 mins
        });
        
        if (process.env.RESEND_API_KEY) {
            await axios.post('https://api.resend.com/emails', {
                from: '"XPM Registry" <' + (process.env.EMAIL_FROM || 'noreply@edvu.in') + '>',
                to: email,
                subject: 'XPM OTP for completing your sign up',
                html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                    <h2 style="color: #4f46e5; margin-bottom: 20px;">Welcome to XPM, ${username}!</h2>
                    <p style="font-size: 16px; line-height: 1.5;">To complete your XPM sign up, and as an additional security measure, you are requested to enter the one-time password (OTP) provided in this email.</p>
                    <p style="font-size: 16px;">The OTP code is: <br><br>
                    <strong style="font-size: 28px; display: inline-block; padding: 12px 20px; background: #f4f6f8; border: 1px solid #e5e7eb; border-radius: 6px; letter-spacing: 4px; color: #111827;">${otp}</strong></p>
                    <p style="font-size: 16px; line-height: 1.5; margin-top: 25px;">We also recommend that you enable two-factor authentication (2FA) with a trusted device.</p>
                    <p style="font-size: 16px; line-height: 1.5;">2FA is an extra layer of security used when logging in. It also protects package publishing. When you publish a package from the command line you will be prompted to provide a generated token in order to do so.</p>
                    <p style="font-size: 16px; line-height: 1.5;">If you have any questions or concerns please feel free to reach out to the XPM support team.</p>
                    <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;">
                    <p style="font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.6;">
                        You're receiving this email because you recently created an XPM account. If this wasn't you, please ignore this email.<br><br>
                        <a href="https://edvu.in" style="color: #4f46e5; text-decoration: none;">Preferences</a> • 
                        <a href="https://edvu.in/terms" style="color: #4f46e5; text-decoration: none;">Terms</a> • 
                        <a href="https://edvu.in/privacy" style="color: #4f46e5; text-decoration: none;">Privacy</a> • 
                        <a href="https://edvu.in/login" style="color: #4f46e5; text-decoration: none;">Sign in to XPM</a>
                    </p>
                </div>
                `
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Sent OTP email to ' + email);
        } else {
            console.log('\n=========================================');
            console.log('🔐 DEVELOPER MODE OTP GENERATED');
            console.log('User: ' + email);
            console.log('OTP Code: ' + otp);
            console.log('=========================================\n');
        }
        
        res.redirect('/verify?email=' + encodeURIComponent(email));
    } catch (err) {
        console.error(err);
        res.redirect('/register?error=' + encodeURIComponent('Registration failed'));
    }
});

app.get('/verify', (req, res) => {
    const email = req.query.email;
    if (!email) return res.redirect('/register');
    res.send(getLayout(getVerifyView(email, req.query.error), req.user));
});

app.post('/verify', async (req, res) => {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.redirect('/register?error=' + encodeURIComponent('User not found'));
    if (user.isVerified) return res.redirect('/login');
    
    if (!user.otp || user.otp !== otp.toUpperCase().trim()) {
        return res.redirect('/verify?email=' + encodeURIComponent(email) + '&error=' + encodeURIComponent('Invalid verification code'));
    }
    
    if (user.otpExpires < new Date()) {
        return res.redirect('/verify?email=' + encodeURIComponent(email) + '&error=' + encodeURIComponent('Verification code expired'));
    }
    
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    
    req.logIn(user, (err) => {
        if (err) return res.redirect('/login');
        res.redirect('/');
    });
});

app.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/?message=' + encodeURIComponent('Successfully logged out!')));
});

app.get('/auth/cli', async (req, res) => {
    const port = req.query.port || '';
    if (!req.user) {
        return res.redirect('/login?cli_port=' + port);
    }
    res.redirect('http://localhost:' + port + '/callback?token=' + req.user.cliToken);
});

app.get('/whoami', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const user = await User.findOne({ cliToken: token });
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    res.json({ username: user.username, email: user.email });
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

// Download package by name and version
app.get('/download/:name/:version', async (req, res) => {
    try {
        const { name, version } = req.params;
        const pkg = await Package.findOne({ name });
        if (!pkg) return res.status(404).json({ error: 'Package not found' });

        const targetVerStr = (version === 'latest') ? (pkg.distTags?.get('latest') || pkg.version) : version;
        let verObj = null;
        if (pkg.versions && pkg.versions.length > 0) {
            verObj = pkg.versions.find(v => v.version === targetVerStr);
        }

        const gridId = verObj?.gridFsId || pkg.tarballId;
        if (!gridId) return res.status(404).json({ error: 'Package payload not found in storage' });

        pkg.downloads = (pkg.downloads || 0) + 1;
        await pkg.save();

        const ext = verObj?.filename?.endsWith('.tgz') ? 'tgz' : 'zip';
        const contentType = ext === 'tgz' ? 'application/gzip' : 'application/zip';
        res.set('Content-Type', contentType);
        res.set('Content-Disposition', 'attachment; filename="' + name + '-' + targetVerStr + '.' + ext + '"');

        const downloadStream = gfs.openDownloadStream(gridId);
        downloadStream.on('error', () => res.status(404).json({ error: 'File stream not found in GridFS' }));
        downloadStream.pipe(res);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Download failed' });
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
    const packages = await Package.find().populate('author', 'username avatarUrl').sort({ downloads: -1 }).limit(12);
    res.send(getLayout(getHomeView(packages, req.user), req.user));
});

const tar = require('tar');

app.get('/api/package/:name', async (req, res) => {
    try {
        const pkg = await Package.findOne({ name: req.params.name }).populate('author', 'username');
        if (!pkg) return res.status(404).json({ error: 'Package not found' });
        res.json(pkg);
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

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
    if (!req.user) return res.redirect('/login');
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

app.post('/api/publish', upload.single('package'), async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const actionToken = req.headers['x-action-token'];
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized. Please login to the CLI using your token.' });
        }
        
        const token = authHeader.split(' ')[1];
        const user = await User.findOne({ cliToken: token });
        if (!user) return res.status(401).json({ error: 'Invalid CLI Token.' });

        if (!actionToken || !actionTokens.has(actionToken)) {
            return res.status(403).json({ error: 'Missing or invalid Action Token. Critical actions require web verification.' });
        }
        
        const action = actionTokens.get(actionToken);
        if (action.user_id.toString() !== user._id.toString() || action.expires < Date.now()) {
            actionTokens.delete(actionToken);
            return res.status(403).json({ error: 'Action token expired or invalid user.' });
        }
        actionTokens.delete(actionToken); // One-time use

        // The CLI sends metadata JSON as a text field, and the tarball/zip as the file.
        let metadata;
        try {
            metadata = JSON.parse(req.body.metadata);
        } catch(e) {
            return res.status(400).json({ error: 'Missing or invalid metadata JSON.' });
        }
        
        const { name, version, description, dependencies, readme } = metadata;

        if (!name || !version) return res.status(400).json({ error: 'Package name and version are required.' });
        if (action.package !== name || action.version !== version) {
            return res.status(403).json({ error: 'Action token does not match the package being published.' });
        }

        let pkg = await Package.findOne({ name });
        if (pkg) {
            if (pkg.author.toString() !== user._id.toString()) {
                return res.status(403).json({ error: `Package name '${name}' is owned by another user.` });
            }
            // Strict immutable versions check
            if (pkg.versions && pkg.versions.some(v => v.version === version)) {
                return res.status(409).json({ error: `Version ${version} already exists. Versions are immutable.` });
            }
        } else {
            pkg = new Package({ name, author: user._id });
        }

        const filename = req.file.originalname;
        const uploadStream = gfs.openUploadStream(filename);
        const readStream = fs.createReadStream(req.file.path);
        readStream.pipe(uploadStream);
        
        await new Promise((resolve, reject) => {
            uploadStream.on('finish', resolve);
            uploadStream.on('error', reject);
        });

        const newVersion = {
            version,
            description,
            filename,
            gridFsId: uploadStream.id,
            size: uploadStream.length || req.file.size,
            dependencies: dependencies || {},
            readme: readme || ''
        };

        if (!pkg.versions) pkg.versions = [];
        pkg.versions.push(newVersion);
        
        // Update tags
        if (!pkg.distTags) pkg.distTags = new Map();
        pkg.distTags.set('latest', version);
        
        // Update top-level metadata for easy search
        pkg.description = description || pkg.description;
        pkg.readme = readme || pkg.readme;
        
        await pkg.save();
        
        res.json({ message: `Successfully published ${name}@${version}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/authorize', (req, res) => {
    if (!req.user) return res.redirect('/login?returnTo=' + encodeURIComponent(req.originalUrl));
    
    // UI for Action Verification (Passkey / Confirm)
    const { action, package: pkg, version, port } = req.query;
    
    res.send(getLayout(`
        <div class="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
            <div class="w-full max-w-md bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 shadow-sm rounded-md p-8">
                <div class="flex items-center justify-center mb-6">
                    <svg viewBox="0 0 24 24" fill="currentColor" class="w-12 h-12 text-[#cb3837]"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <h1 class="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Security Verification</h1>
                <p class="text-gray-500 text-center mb-6 text-sm">Your CLI is attempting to perform a critical action.</p>
                
                <div class="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-md p-4 mb-6">
                    <div class="flex justify-between mb-2">
                        <span class="text-gray-500 text-sm">Action</span>
                        <span class="font-bold text-gray-900 dark:text-gray-100 uppercase text-sm">${action}</span>
                    </div>
                    ${pkg ? `<div class="flex justify-between mb-2">
                        <span class="text-gray-500 text-sm">Package</span>
                        <span class="font-mono text-[#cb3837] dark:text-[#ff5f56] text-sm">${pkg}</span>
                    </div>` : ''}
                    ${version ? `<div class="flex justify-between">
                        <span class="text-gray-500 text-sm">Version</span>
                        <span class="font-mono text-gray-900 dark:text-gray-100 text-sm">${version}</span>
                    </div>` : ''}
                </div>

                <form action="/authorize" method="POST">
                    <input type="hidden" name="action" value="${action}">
                    <input type="hidden" name="package" value="${pkg || ''}">
                    <input type="hidden" name="version" value="${version || ''}">
                    <input type="hidden" name="port" value="${port}">
                    <button type="submit" class="w-full bg-[#cb3837] hover:bg-[#a12928] text-white font-bold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                        Verify & Authorize
                    </button>
                </form>
            </div>
        </div>
    `, req.user));
});

app.post('/authorize', (req, res) => {
    if (!req.user) return res.status(401).send('Unauthorized');
    
    const { action, package: pkg, version, port } = req.body;
    
    // In a real passkey flow, we'd verify WebAuthn assertion here.
    // For now, they clicked the button which counts as verified session auth.
    const token = require('crypto').randomBytes(32).toString('hex');
    
    actionTokens.set(token, {
        user_id: req.user._id,
        action,
        package: pkg,
        version,
        expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    });
    
    res.redirect(`http://localhost:${port}/callback?actionToken=${token}`);
});
