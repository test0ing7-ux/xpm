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

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

program
    .name('xpm')
    .description('Custom package manager & runner (like npm + npx)')
    .option('-y, --yes', 'Skip prompts and run automatically')
    .version('1.0.0');

program
    .command('init')
    .description('Initialize a new xpm project')
    .action(() => {
        if (fs.existsSync(CONFIG_FILE)) {
            console.error('xpm.json already exists!');
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
        if (!fs.existsSync(CONFIG_FILE)) return console.error('No xpm.json found.');
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
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
            
            const response = await axios.post(`${REGISTRY_URL}/publish`, formData, {
                headers: formData.getHeaders()
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
        if (!fs.existsSync(CONFIG_FILE)) return console.error('No xpm.json found.');
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        const scripts = config.scripts || {};
        if (!scripts[scriptName]) return console.error(`Script '${scriptName}' not found.`);
        try { execSync(scripts[scriptName], { stdio: 'inherit' }); }
        catch(err) { console.error(`Script '${scriptName}' failed.`); }
    });

// Helper function to download and extract
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
}

// NPX-style execution (Default command)
program
    .command('exec <pkg>', { isDefault: true })
    .description('Download and run a package instantly (like npx)')
    .action(async (pkg) => {
        // Prevent running built-in commands as packages if user mistypes
        if (['init', 'publish', 'install', 'run', 'delete'].includes(pkg)) return;

        let name = pkg.split('@')[0];
        const cacheDest = path.join(CACHE_DIR, name);

        try {
            // Always fetch latest for NPX-like execution
            await downloadAndExtract(pkg, cacheDest);
            
            // Check xpm.json to find what to run
            const pkgConfigPath = path.join(cacheDest, 'xpm.json');
            if (!fs.existsSync(pkgConfigPath)) {
                console.error(`❌ Package ${pkg} does not contain an xpm.json file.`);
                return;
            }
            
            const config = JSON.parse(fs.readFileSync(pkgConfigPath, 'utf-8'));
            const scriptToRun = config.scripts?.start || `node ${config.main}`;
            
            console.log(`\n🚀 Executing ${pkg}...\n`);
            execSync(scriptToRun, { stdio: 'inherit', cwd: cacheDest });
            
        } catch (err) {
            console.error('\n❌ Execution failed:', err.message);
        }
    });

program.parse();
