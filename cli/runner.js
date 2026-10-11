const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const AdmZip = require('adm-zip');
const chalk = require('chalk');
const { spawn } = require('child_process');

const SERVER_URL = 'https://edvu.in';
const HOME_DIR = os.homedir();
const CACHE_BASE = path.join(HOME_DIR, '.xpm', 'cache');

async function executePackage(pkgNameStr, passThroughArgs = []) {
    let name = pkgNameStr;
    let version = 'latest';
    if (pkgNameStr.includes('@') && !pkgNameStr.startsWith('@')) {
        [name, version] = pkgNameStr.split('@');
    }
    name = name.toLowerCase();

    try {
        const { data: meta } = await axios.get(`${SERVER_URL}/api/package/${name}`);
        const targetVersion = version === 'latest' ? (meta.distTags?.latest || meta.version) : version;

        const pkgCacheDir = path.join(CACHE_BASE, name, targetVersion);

        // Check if cached
        if (!fs.existsSync(pkgCacheDir)) {
            console.log(chalk.cyan(`📦 Fetching ${name}@${targetVersion}...`));
            fs.mkdirSync(pkgCacheDir, { recursive: true });

            const downloadUrl = `${SERVER_URL}/download/${name}/${targetVersion}`;
            const tempZipPath = path.join(pkgCacheDir, `temp-${Date.now()}.zip`);
            const writer = fs.createWriteStream(tempZipPath);

            const response = await axios.get(downloadUrl, { responseType: 'stream' });
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            const zip = new AdmZip(tempZipPath);
            zip.extractAllTo(pkgCacheDir, true);
            try { fs.rmSync(tempZipPath, { force: true }); } catch (e) {}
        }

        // Locate executable entrypoint
        const isWin = process.platform === 'win32';
        let execPath = null;
        let isNodeScript = false;

        const pkgJsonPath = path.join(pkgCacheDir, 'package.json');
        const xpmJsonPath = path.join(pkgCacheDir, 'xpm.json');
        let manifest = null;
        if (fs.existsSync(pkgJsonPath)) {
            try { manifest = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')); } catch (e) {}
        } else if (fs.existsSync(xpmJsonPath)) {
            try { manifest = JSON.parse(fs.readFileSync(xpmJsonPath, 'utf8')); } catch (e) {}
        }

        if (manifest) {
            let binCandidate = null;
            if (manifest.bin) {
                if (typeof manifest.bin === 'string') {
                    binCandidate = manifest.bin;
                } else if (typeof manifest.bin === 'object') {
                    binCandidate = manifest.bin[name] || Object.values(manifest.bin)[0];
                }
            } else if (manifest.main) {
                binCandidate = manifest.main;
            }

            if (binCandidate) {
                const fullCandidate = path.join(pkgCacheDir, binCandidate);
                if (fs.existsSync(fullCandidate)) {
                    execPath = fullCandidate;
                }
            }
        }

        if (!execPath) {
            const possibleNames = [
                isWin ? `${name}.exe` : name,
                'index.exe',
                'main.exe',
                'cli.exe',
                'index.js',
                'main.js',
                'cli.js'
            ];
            for (const cand of possibleNames) {
                const p = path.join(pkgCacheDir, cand);
                if (fs.existsSync(p)) {
                    execPath = p;
                    break;
                }
            }
        }

        if (!execPath) {
            console.error(chalk.red(`✖ Could not find executable entrypoint for ${name}@${targetVersion}`));
            process.exit(1);
        }

        if (execPath.endsWith('.js')) {
            isNodeScript = true;
        }

        let child;
        if (isNodeScript) {
            child = spawn(process.execPath, [execPath, ...passThroughArgs], { stdio: 'inherit' });
        } else if (isWin && (execPath.endsWith('.cmd') || execPath.endsWith('.bat'))) {
            child = spawn(execPath, passThroughArgs, { stdio: 'inherit', shell: true });
        } else {
            child = spawn(execPath, passThroughArgs, { stdio: 'inherit' });
        }

        child.on('exit', (code) => {
            process.exit(code || 0);
        });
        child.on('error', (err) => {
            console.error(chalk.red(`✖ Execution error: ${err.message}`));
            process.exit(1);
        });

    } catch (e) {
        console.error(chalk.red('✖ Error executing package:'), e.response?.data?.error || e.message);
        process.exit(1);
    }
}

module.exports = { executePackage };
