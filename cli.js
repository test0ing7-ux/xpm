#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const os = require('os');
const tar = require('tar');
const axios = require('axios');
const FormData = require('form-data');
const { spawnSync, execSync } = require('child_process');

const REGISTRY_URL = process.env.XPM_REGISTRY || 'https://xpm.up.railway.app'; 
const CACHE_DIR = path.join(os.homedir(), '.xpm-cache');
const MODULES_DIR = path.join(process.cwd(), 'xpm_modules');
const CONFIG_FILE = path.join(process.cwd(), 'xpm.json');
const PKG_JSON = path.join(process.cwd(), 'package.json');
const INSTALL_DIR = path.join(os.homedir(), '.xpm-bin');
const AUTH_FILE = path.join(os.homedir(), '.xpm-auth.json');

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

// ==========================================
// 🚀 DOUBLE-CLICK INSTALLER LOGIC
// ==========================================
if (process.argv.length === 2 && process.pkg) {
    const currentExePath = process.execPath.toLowerCase();
    const targetExePath = path.join(INSTALL_DIR, 'xpm.exe').toLowerCase();

    if (currentExePath !== targetExePath) {
        console.log("==================================================");
        console.log("🚀 Welcome to the XPM Global Installer!");
        console.log("==================================================");
        
        try {
            if (!fs.existsSync(INSTALL_DIR)) fs.mkdirSync(INSTALL_DIR, { recursive: true });
            const finalExe = path.join(INSTALL_DIR, 'xpm.exe');
            
            console.log(`\n📦 Copying XPM to ${INSTALL_DIR}...`);
            fs.copyFileSync(process.execPath, finalExe);
            
            console.log("⚙️  Setting up global PATH variable...");
            
            const userPath = execSync('powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable(\'Path\', \'User\')"').toString().trim();
            if (!userPath.toLowerCase().includes(INSTALL_DIR.toLowerCase())) {
                const newPath = userPath ? `${userPath};${INSTALL_DIR}` : INSTALL_DIR;
                execSync(`powershell -NoProfile -Command "[Environment]::SetEnvironmentVariable(\'Path\', \'${newPath}\', \'User\')"`);
            }
            
            console.log("\n✅ SUCCESS! XPM has been installed globally on your PC.");
            console.log("You can now safely delete this downloaded file.");
            console.log("\n➡️  To use XPM, just open any NEW terminal and type: xpm");
            
        } catch (err) {
            console.error("\n❌ Installation failed:", err.message);
        }
        
        console.log("\nPress any key to close this installer...");
        execSync('pause', { stdio: 'inherit', shell: true });
        process.exit(0);
    }
}
// ==========================================

program
    .name('xpm')
    .description('Custom package manager & runner (like npm + npx)')
    .option('-y, --yes', 'Skip prompts and run automatically')
    .version('1.0.0');

if (process.argv.length === 2) {
    program.help();
}

const http = require('http');

program
    .command('login')
    .description('Login via your browser (NPM style)')
    .action(() => {
        const PORT = 8484;
        const server = http.createServer((req, res) => {
            if (req.url.startsWith('/callback')) {
                const urlObj = new URL(req.url, `http://localhost:${PORT}`);
                const token = urlObj.searchParams.get('token');
                if (token) {
                    fs.writeFileSync(AUTH_FILE, JSON.stringify({ token }));
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end('<h1 style="font-family:sans-serif;color:green;text-align:center;margin-top:50px;">✅ Successfully logged into XPM! You can safely close this window.</h1><script>setTimeout(()=>window.close(), 3000)</script>');
                    console.log('\n✅ Successfully authenticated! You can now publish packages.');
                    server.close();
                    process.exit(0);
                }
            }
        });
        
        server.listen(PORT, () => {
            const loginUrl = `${REGISTRY_URL}/auth/cli?port=${PORT}`;
            console.log('\n======================================================');
            console.log('🚪 XPM Login');
            console.log('======================================================');
            console.log('Opening your browser to authenticate with XPM...');
            console.log('\nIf your browser does not open automatically, please click this link:');
            console.log(`👉  ${loginUrl}\n`);
            console.log('Waiting for authentication... (Press Ctrl+C to cancel)');
            
            const { exec } = require('child_process');
            const startCmd = process.platform === 'win32' ? 'start ""' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
            exec(`${startCmd} "${loginUrl}"`).on('error', () => {});
        });
    });

program
    .command('whoami')
    .description('Check which user you are logged in as')
    .action(async () => {
        if (!fs.existsSync(AUTH_FILE)) return console.error('❌ You are not logged in. Run: xpm login');
        const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
        try {
            const response = await axios.get(`${REGISTRY_URL}/whoami`, {
                headers: { 'Authorization': `Bearer ${authData.token}` }
            });
            console.log(`✅ Logged in as: ${response.data.username} (${response.data.email})`);
        } catch (err) {
            console.error('❌ Your session has expired or is invalid. Please run: xpm login');
        }
    });

program
    .command('init')
    .description('Initialize a new xpm project')
    .action(() => {
        if (fs.existsSync(CONFIG_FILE) || fs.existsSync(PKG_JSON)) {
            console.error('Config file already exists!');
            return;
        }
        const config = {
            name: path.basename(process.cwd()),
            version: '1.0.0',
            description: '',
            main: 'index.js',
            scripts: { "start": "node index.js" }
        };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        console.log('Created xpm.json');
    });

program
    .command('publish')
    .description('Publish the current package to the remote registry')
    .action(async () => {
        if (!fs.existsSync(AUTH_FILE)) {
            return console.error('❌ You are not logged in! Get your CLI token from https://xpm.up.railway.app and run: xpm login <token>');
        }
        const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));

        const configFile = fs.existsSync(PKG_JSON) ? PKG_JSON : (fs.existsSync(CONFIG_FILE) ? CONFIG_FILE : null);
        if (!configFile) return console.error('No package.json or xpm.json found.');
        
        const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
        const tarballName = `${config.name}-${config.version}.tgz`;
        const tempTarPath = path.join(process.cwd(), tarballName);

        const filesToPack = fs.readdirSync(process.cwd()).filter(f => 
            f !== 'xpm_modules' && f !== 'node_modules' && f !== '.git' && f !== tarballName
        );

        try {
            console.log(`Packing ${tarballName}...`);
            await tar.c({ gzip: true, file: tempTarPath }, filesToPack);
            
            console.log(`Uploading to ${REGISTRY_URL}...`);
            const formData = new FormData();
            formData.append('package', fs.createReadStream(tempTarPath), tarballName);
            
            // Extract README just like NPM
            let readmeContent = '';
            if (fs.existsSync(path.join(process.cwd(), 'README.md'))) {
                readmeContent = fs.readFileSync(path.join(process.cwd(), 'README.md'), 'utf-8');
            } else if (fs.existsSync(path.join(process.cwd(), 'readme.md'))) {
                readmeContent = fs.readFileSync(path.join(process.cwd(), 'readme.md'), 'utf-8');
            }
            formData.append('readme', readmeContent);
            
            const response = await axios.post(`${REGISTRY_URL}/publish`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${authData.token}`
                }
            });
            console.log('✅ ' + response.data.message);
        } catch (err) {
            console.error('❌ Error publishing:', err.response ? err.response.data.error : err.message);
        } finally {
            if (fs.existsSync(tempTarPath)) fs.unlinkSync(tempTarPath);
        }
    });

program
    .command('install <pkg>')
    .description('Install a package')
    .action(async (pkg) => {
        await downloadAndExtract(pkg, path.join(MODULES_DIR, pkg.split('@')[0]));
        console.log(`✅ Successfully installed ${pkg} into xpm_modules/`);
    });

program
    .command('run <script>')
    .description('Run a local script')
    .action((scriptName) => {
        const configFile = fs.existsSync(PKG_JSON) ? PKG_JSON : (fs.existsSync(CONFIG_FILE) ? CONFIG_FILE : null);
        if (!configFile) return console.error('No package config found.');
        const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
        const scripts = config.scripts || {};
        if (!scripts[scriptName]) return console.error(`Script '${scriptName}' not found.`);
        try { execSync(scripts[scriptName], { stdio: 'inherit' }); }
        catch(err) { console.error(`Script '${scriptName}' failed.`); }
    });

async function downloadAndExtract(pkg, destFolder) {
    let [name, version] = pkg.includes('@') ? pkg.split('@') : [pkg, null];
    
    console.log(`Looking up ${pkg} in registry...`);
    const listRes = await axios.get(`${REGISTRY_URL}/packages`);
    const files = listRes.data.packages;
    
    let tarballToInstall = null;
    if (version) {
        if (files.includes(`${name}-${version}.tgz`)) tarballToInstall = `${name}-${version}.tgz`;
    } else {
        const pkgFiles = files.filter(f => f.startsWith(`${name}-`) && f.endsWith('.tgz'));
        if (pkgFiles.length > 0) tarballToInstall = pkgFiles.sort().pop();
    }

    if (!tarballToInstall) throw new Error(`Package ${pkg} not found in registry.`);

    console.log(`Downloading ${tarballToInstall}...`);
    const tempTarPath = path.join(os.tmpdir(), tarballToInstall);
    
    const response = await axios({ method: 'GET', url: `${REGISTRY_URL}/download/${tarballToInstall}`, responseType: 'stream' });
    const writer = fs.createWriteStream(tempTarPath);
    response.data.pipe(writer);
    
    await new Promise((res, rej) => { writer.on('finish', res); writer.on('error', rej); });

    if (fs.existsSync(destFolder)) fs.rmSync(destFolder, { recursive: true, force: true });
    fs.mkdirSync(destFolder, { recursive: true });

    await tar.x({ file: tempTarPath, cwd: destFolder });
    fs.unlinkSync(tempTarPath);

    const pkgJsonPath = path.join(destFolder, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
        if (pkgJson.dependencies && Object.keys(pkgJson.dependencies).length > 0) {
            console.log(`Installing dependencies for ${pkg}...`);
            try {
                execSync('npm install --omit=dev --no-fund --no-audit', { cwd: destFolder, stdio: 'inherit' });
            } catch (err) {
                console.warn(`\n⚠️ Warning: Failed to install dependencies. Make sure Node.js/NPM is installed on this PC.\n`);
            }
        }
    }
}

program
    .command('exec <pkg>', { isDefault: true })
    .description('Download and run a package instantly (like npx)')
    .action(async (pkg) => {
        if (['init', 'publish', 'install', 'run', 'delete', 'login'].includes(pkg)) return;

        let name = pkg.split('@')[0];
        const cacheDest = path.join(CACHE_DIR, name);

        try {
            await downloadAndExtract(pkg, cacheDest);
            
            let configPath = path.join(cacheDest, 'package.json');
            if (!fs.existsSync(configPath)) configPath = path.join(cacheDest, 'xpm.json');
            if (!fs.existsSync(configPath)) return console.error(`❌ Package ${pkg} does not contain a package.json or xpm.json file.`);
            
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            
            let scriptToRun;
            if (config.scripts && config.scripts.start) scriptToRun = config.scripts.start;
            else if (config.bin) scriptToRun = `node ${typeof config.bin === 'string' ? config.bin : Object.values(config.bin)[0]}`;
            else scriptToRun = `node ${config.main || 'index.js'}`;
            
            console.log(`\n⚡ Executing ${pkg}...\n`);
            
            if (process.pkg && scriptToRun.startsWith('node ')) {
                const targetFile = scriptToRun.replace('node ', '').trim();
                spawnSync(process.execPath, [targetFile], { stdio: 'inherit', cwd: cacheDest });
            } else {
                execSync(scriptToRun, { stdio: 'inherit', cwd: cacheDest });
            }
            
        } catch (err) {
            console.error('\n❌ Execution failed:', err.message);
        }
    });

program
    .command('info <package>')
    .description('View details about a package')
    .action(async (pkgName) => {
        try {
            const response = await axios.get(`${REGISTRY_URL}/packages`);
            const exists = response.data.packages.find(p => p.startsWith(`${pkgName}-`));
            if (!exists) {
                console.error(`npm ERR! code E404\nnpm ERR! 404 Not Found - GET ${REGISTRY_URL}/package/${pkgName} - Not found`);
                return;
            }
            console.log(`\n${pkgName}`);
            console.log(`\nView online at: ${REGISTRY_URL}/package/${pkgName}`);
        } catch (e) {
            console.error('Failed to fetch package info.');
        }
    });

program
    .command('docs <package>')
    .description('Open a package\'s documentation in your browser')
    .action((pkgName) => {
        console.log(`Opening ${REGISTRY_URL}/package/${pkgName} in your browser...`);
        const { exec } = require('child_process');
        const startCmd = process.platform === 'win32' ? 'start ""' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
        exec(`${startCmd} "${REGISTRY_URL}/package/${pkgName}"`).on('error', () => {});
    });

// Override the default help to look like NPM
program.configureHelp({
    formatHelp: (cmd, helper) => {
        let v = '1.0.0';
        try { v = require('./package.json').version; } catch(e){}
        return `
Usage: xpm <command>

where <command> is one of:
    docs, exec, help, info, init, install, login, publish, whoami

xpm <command> -h  quick help on <command>
xpm help <term>   search for help on <term>

Specify configs in the ini-formatted file:
    C:\\Users\\<user>\\.xpmrc
or on the command line via: xpm <command> --key value

xpm@${v} ${process.cwd()}
`;
    }
});

program.parse();
