#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const { exec } = require('child_process');
const axios = require('axios');
const AdmZip = require('adm-zip');
const FormData = require('form-data');
const chalk = require('chalk');

const SERVER_URL = 'https://edvu.in';
const HOME_DIR = os.homedir();
const XPM_DIR = path.join(HOME_DIR, '.xpm');
const CONFIG_FILE = path.join(XPM_DIR, 'auth.json');
const XPM_BIN = path.join(HOME_DIR, '.xpm-bin');

// Ensure directories exist
try { fs.mkdirSync(XPM_DIR, { recursive: true }); } catch (e) {}
try { fs.mkdirSync(XPM_BIN, { recursive: true }); } catch (e) {}

// Native cross-platform browser opener (zero dependencies, 100% works in pkg on Windows, Mac, Linux)
function openBrowser(url) {
    const platform = process.platform;
    if (platform === 'win32') {
        exec(`start "" "${url}"`);
    } else if (platform === 'darwin') {
        exec(`open "${url}"`);
    } else {
        exec(`xdg-open "${url}"`);
    }
}

function getToken() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            return data.token || null;
        }
    } catch (e) {}
    return null;
}

function setToken(token) {
    try {
        fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
        fs.writeFileSync(CONFIG_FILE, JSON.stringify({ token }, null, 2));
    } catch (e) {}
}

program
    .name('xpm')
    .description(chalk.cyan.bold('XPM - The Universal Native Package Manager (Windows, macOS, Linux)'))
    .version('1.0.0');

// --- xpm init ---
program
    .command('init')
    .description('Initialize a new xpm.json configuration file')
    .action(() => {
        const xpmJsonPath = path.join(process.cwd(), 'xpm.json');
        if (fs.existsSync(xpmJsonPath)) {
            console.error(chalk.red('✖ xpm.json already exists in this directory.'));
            process.exit(1);
        }
        
        const folderName = path.basename(process.cwd()).toLowerCase().replace(/[^a-z0-9-]/g, '-');
        
        const defaultMetadata = {
            name: folderName || 'my-xpm-package',
            version: '1.0.0',
            description: '',
            main: 'index.exe',
            dependencies: {}
        };
        
        fs.writeFileSync(xpmJsonPath, JSON.stringify(defaultMetadata, null, 2));
        console.log(chalk.green('✔ Successfully created xpm.json!'));
        console.log(chalk.gray(JSON.stringify(defaultMetadata, null, 2)));
    });

// --- xpm login ---
program
    .command('login')
    .description('Login to your XPM account via browser')
    .action(async () => {
        console.log(chalk.yellow('Waiting for browser authentication...'));
        
        const server = http.createServer((req, res) => {
            try {
                const url = new URL(req.url, `http://${req.headers.host}`);
                const token = url.searchParams.get('token');
                if (token) {
                    setToken(token);
                    res.writeHead(200, { 
                        'Content-Type': 'text/html',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>XPM - Authenticated</title>
                            <meta charset="utf-8">
                            <style>
                                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fafafa; }
                                .card { background: white; border: 1px solid #eaeaea; border-radius: 16px; padding: 48px 36px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.06); max-width: 420px; }
                                .icon { width: 56px; height: 56px; background: #e6f7ec; color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 26px; font-weight: bold; }
                                h1 { margin: 0 0 10px; font-size: 22px; color: #111; }
                                p { margin: 0; color: #666; font-size: 14px; line-height: 1.5; }
                            </style>
                        </head>
                        <body>
                            <div class="card">
                                <div class="icon">✓</div>
                                <h1>CLI Authenticated!</h1>
                                <p>You have successfully logged in. You can now close this tab and return to your terminal.</p>
                            </div>
                            <script>setTimeout(() => { window.close(); }, 3000);</script>
                        </body>
                        </html>
                    `);
                    console.log(chalk.green.bold('\n✔ Successfully logged in to XPM!'));
                    console.log(chalk.gray('Authentication token saved to ~/.xpm/auth.json\n'));
                    server.close();
                    process.exit(0);
                }
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Authentication failed');
            }
        });

        server.listen(8989, () => {
            openBrowser(`${SERVER_URL}/auth/cli?port=8989`);
        });

        server.on('error', (err) => {
            console.error(chalk.red('✖ Failed to start local authentication listener:'), err.message);
            process.exit(1);
        });
    });

// --- xpm whoami ---
program
    .command('whoami')
    .description('Check currently logged-in account')
    .action(async () => {
        const token = getToken();
        if (!token) {
            console.error(chalk.red('✖ Not logged in. Run ') + chalk.yellow('xpm login'));
            process.exit(1);
        }
        try {
            const { data } = await axios.get(`${SERVER_URL}/whoami`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(chalk.green('✔ Logged in as:'), chalk.white.bold(data.username), chalk.gray(`(${data.email})`));
        } catch (e) {
            console.error(chalk.red('✖ Invalid or expired token. Run ') + chalk.yellow('xpm login'));
            process.exit(1);
        }
    });

// --- xpm info / view ---
program
    .command('info')
    .alias('view')
    .description('View details about a published package')
    .argument('<pkgName>', 'Name of the package')
    .action(async (pkgName) => {
        try {
            const { data } = await axios.get(`${SERVER_URL}/api/package/${pkgName}`);
            console.log();
            console.log(chalk.green.bold.underline(data.name));
            console.log(chalk.gray(data.description || 'No description provided.'));
            console.log();
            console.log(chalk.cyan('Latest Version:'), chalk.white(data.distTags?.latest || (data.versions?.[data.versions.length - 1]?.version) || 'Unknown'));
            console.log(chalk.cyan('Author:'), chalk.white(data.author?.username || 'Unknown'));
            console.log(chalk.cyan('Downloads:'), chalk.white(data.downloads || 0));
            
            if (data.versions && data.versions.length > 0) {
                console.log(chalk.cyan('\nPublished Versions:'));
                data.versions.forEach(v => {
                    const dateStr = v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '';
                    console.log(`  - ${chalk.yellow(v.version)} ${dateStr ? chalk.gray('(' + dateStr + ')') : ''}`);
                });
            }
            console.log();
        } catch (error) {
            console.error(chalk.red('✖ Error fetching package info:'), error.response?.status === 404 ? 'Package not found' : error.message);
        }
    });

// --- xpm publish ---
program
    .command('publish')
    .description('Publish the current directory as an immutable version to the registry')
    .action(async () => {
        const token = getToken();
        if (!token) {
            console.error(chalk.red('✖ You are not logged in. Run ') + chalk.yellow('xpm login') + chalk.red(' first.'));
            return process.exit(1);
        }

        const currentDir = process.cwd();
        const xpmJsonPath = path.join(currentDir, 'xpm.json');

        if (!fs.existsSync(xpmJsonPath)) {
            console.error(chalk.red('✖ Missing xpm.json in current directory. Run ') + chalk.yellow('xpm init') + chalk.red(' first.'));
            return process.exit(1);
        }

        let metadata;
        try {
            metadata = JSON.parse(fs.readFileSync(xpmJsonPath, 'utf8'));
        } catch (e) {
            console.error(chalk.red('✖ Invalid JSON syntax in xpm.json'));
            return process.exit(1);
        }

        if (!metadata.name || !metadata.version) {
            console.error(chalk.red('✖ xpm.json must contain "name" and "version".'));
            return process.exit(1);
        }

        metadata.name = metadata.name.toLowerCase();

        console.log(chalk.cyan(`🚀 Publishing ${metadata.name}@${metadata.version}...`));
        console.log(chalk.yellow('🔒 Critical action requires WebAuthn/Passkey verification. Opening browser...'));

        const server = http.createServer(async (req, res) => {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const actionToken = url.searchParams.get('actionToken');
            
            if (actionToken) {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end('<h1>Action Verified. You can close this window.</h1><script>window.close()</script>');
                server.close();
                
                console.log(chalk.green('✔ Security verification passed. Packing and uploading payload...'));
                
                let zipPath = null;
                try {
                    zipPath = path.join(currentDir, `.xpm-pack-${Date.now()}.zip`);
                    const zip = new AdmZip();
                    
                    // Add files, cleanly excluding node_modules, .git, and temporary pack zips
                    const items = fs.readdirSync(currentDir);
                    for (const item of items) {
                        if (item === 'node_modules' || item === '.git' || item.startsWith('.xpm-pack-')) continue;
                        const fullPath = path.join(currentDir, item);
                        const stat = fs.statSync(fullPath);
                        if (stat.isDirectory()) {
                            zip.addLocalFolder(fullPath, item);
                        } else {
                            zip.addLocalFile(fullPath);
                        }
                    }
                    zip.writeZip(zipPath);

                    const form = new FormData();
                    form.append('package', fs.createReadStream(zipPath), { filename: `${metadata.name}-${metadata.version}.zip` });
                    form.append('metadata', JSON.stringify(metadata));

                    const response = await axios.post(`${SERVER_URL}/api/publish`, form, {
                        headers: { 
                            ...form.getHeaders(),
                            'Authorization': `Bearer ${token}`,
                            'X-Action-Token': actionToken
                        },
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity
                    });

                    console.log(chalk.green.bold(`\n🎉 Success! ${metadata.name}@${metadata.version} published to XPM.`));
                    if (zipPath && fs.existsSync(zipPath)) {
                        try { fs.rmSync(zipPath, { force: true }); } catch (e) {}
                    }
                    process.exit(0);
                } catch (error) {
                    if (zipPath && fs.existsSync(zipPath)) {
                        try { fs.rmSync(zipPath, { force: true }); } catch (e) {}
                    }
                    console.error(chalk.red('\n✖ Publish failed:'), error.response?.data?.error || error.message);
                    process.exit(1);
                }
            }
        });

        server.listen(8989, () => {
            openBrowser(`${SERVER_URL}/authorize?action=publish&package=${encodeURIComponent(metadata.name)}&version=${encodeURIComponent(metadata.version)}&port=8989`);
        });

        server.on('error', (err) => {
            console.error(chalk.red('✖ Failed to start verification listener:'), err.message);
            process.exit(1);
        });
    });

// --- xpm install ---
program
    .command('install')
    .description('Install an executable package globally')
    .argument('<pkgName>', 'Name of the package (e.g., pkg or pkg@1.0.0)')
    .action(async (pkgNameStr) => {
        console.log(chalk.cyan(`\n📦 Fetching ${pkgNameStr}...`));
        
        let name = pkgNameStr;
        let version = 'latest';
        if (pkgNameStr.includes('@') && !pkgNameStr.startsWith('@')) {
            [name, version] = pkgNameStr.split('@');
        }

        try {
            const { data: meta } = await axios.get(`${SERVER_URL}/api/package/${name}`);
            const targetVersion = version === 'latest' ? (meta.distTags?.latest || meta.version) : version;
            
            console.log(chalk.gray(`Resolving ${name}@${targetVersion}...`));
            
            // Download payload
            const downloadUrl = `${SERVER_URL}/download/${name}/${targetVersion}`;
            const pkgDestDir = path.join(XPM_BIN, name);
            try { fs.mkdirSync(pkgDestDir, { recursive: true }); } catch (e) {}
            
            const tempZipPath = path.join(pkgDestDir, `temp-${Date.now()}.zip`);
            const writer = fs.createWriteStream(tempZipPath);
            
            const response = await axios.get(downloadUrl, { responseType: 'stream' });
            response.data.pipe(writer);
            
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            
            // Extract
            const zip = new AdmZip(tempZipPath);
            zip.extractAllTo(pkgDestDir, true);
            try { fs.rmSync(tempZipPath, { force: true }); } catch (e) {}
            
            // Create executable shims in XPM_BIN so it's in PATH
            const isWin = process.platform === 'win32';
            let execName = name;
            let targetExec = path.join(pkgDestDir, isWin ? `${name}.exe` : name);
            
            if (!fs.existsSync(targetExec)) {
                // Check if main is specified in xpm.json
                const pkgJsonPath = path.join(pkgDestDir, 'xpm.json');
                if (fs.existsSync(pkgJsonPath)) {
                    try {
                        const parsed = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
                        if (parsed.main && fs.existsSync(path.join(pkgDestDir, parsed.main))) {
                            targetExec = path.join(pkgDestDir, parsed.main);
                        }
                    } catch (e) {}
                }
            }
            
            if (isWin) {
                const cmdShim = `@ECHO off\r\n"${targetExec}" %*`;
                fs.writeFileSync(path.join(XPM_BIN, `${name}.cmd`), cmdShim);
                const ps1Shim = `& "${targetExec}" $args`;
                fs.writeFileSync(path.join(XPM_BIN, `${name}.ps1`), ps1Shim);
            } else {
                const shShim = `#!/bin/sh\nexec "${targetExec}" "$@"`;
                const shimPath = path.join(XPM_BIN, name);
                fs.writeFileSync(shimPath, shShim);
                try { fs.chmodSync(shimPath, 0o755); } catch (e) {}
            }
            
            console.log(chalk.green.bold(`✔ Successfully installed ${name}@${targetVersion} to ${XPM_BIN}`));
            console.log(chalk.gray(`Executable ready: ${name}`));
        } catch (e) {
            console.error(chalk.red('✖ Error installing package:'), e.response?.data?.error || e.message);
        }
    });

program.parse(process.argv);
