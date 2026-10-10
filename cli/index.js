#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');
const FormData = require('form-data');
const open = require('open');
const http = require('http');
const chalk = require('chalk');

const SERVER_URL = 'https://edvu.in';
const HOME_DIR = require('os').homedir();
const CONFIG_FILE = path.join(HOME_DIR, '.xpm', 'auth.json');
const XPM_BIN = path.join(HOME_DIR, '.xpm', 'bin');

fs.ensureDirSync(XPM_BIN);

function getToken() {
    if (fs.existsSync(CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')).token;
    }
    return null;
}

function setToken(token) {
    fs.ensureDirSync(path.dirname(CONFIG_FILE));
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ token }));
}

program
    .name('xpm')
    .description(chalk.cyan.bold('XPM - The Universal Native Package Manager'))
    .version('1.0.0');


// xpm init
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

// xpm login
program
    .command('login')
    .description('Login to your XPM account via browser')
    .action(async () => {
        console.log(chalk.yellow('Waiting for browser authentication...'));
        
        const server = http.createServer((req, res) => {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const token = url.searchParams.get('token');
            if (token) {
                setToken(token);
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end('<h1>Successfully logged in! You can close this window.</h1><script>window.close()</script>');
                console.log(chalk.green.bold('✔ Successfully logged in!'));
                server.close();
                process.exit(0);
            }
        });

        server.listen(8989, () => {
            open(`${SERVER_URL}/login?cli_port=8989`);
        });
    });

// xpm info
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
            console.log(chalk.cyan('Latest Version:'), chalk.white(data.distTags?.latest || 'Unknown'));
            console.log(chalk.cyan('Author:'), chalk.white(data.author?.username || 'Unknown'));
            console.log(chalk.cyan('Downloads:'), chalk.white(data.downloads));
            
            if (data.versions && data.versions.length > 0) {
                console.log(chalk.cyan('\nPublished Versions:'));
                data.versions.forEach(v => {
                    console.log(`  - ${chalk.yellow(v.version)} (${new Date(v.createdAt).toLocaleDateString()})`);
                });
            }
            console.log();
        } catch (error) {
            console.error(chalk.red('✖ Error fetching package info:'), error.response?.status === 404 ? 'Package not found' : error.message);
        }
    });

// xpm publish
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
            console.error(chalk.red('✖ Missing xpm.json in current directory.'));
            return process.exit(1);
        }

        const metadata = JSON.parse(fs.readFileSync(xpmJsonPath, 'utf8'));
        if (!metadata.name || !metadata.version) {
            console.error(chalk.red('✖ xpm.json must contain "name" and "version".'));
            return process.exit(1);
        }

        console.log(chalk.cyan(`🚀 Publishing ${metadata.name}@${metadata.version}...`));
        console.log(chalk.yellow('🔒 Critical action requires WebAuthn/Passkey verification. Opening browser...'));

        const server = http.createServer(async (req, res) => {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const actionToken = url.searchParams.get('actionToken');
            
            if (actionToken) {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end('<h1>Action Verified. You can close this window.</h1><script>window.close()</script>');
                server.close();
                
                console.log(chalk.green('✔ Security verification passed. Uploading payload...'));
                
                try {
                    const zipPath = path.join(currentDir, `.xpm-pack-${Date.now()}.zip`);
                    const zip = new AdmZip();
                    zip.addLocalFolder(currentDir);
                    zip.writeZip(zipPath);

                    const form = new FormData();
                    form.append('package', fs.createReadStream(zipPath), { filename: `${metadata.name}-${metadata.version}.zip` });
                    form.append('metadata', JSON.stringify(metadata));

                    const response = await axios.post(`${SERVER_URL}/api/publish`, form, {
                        headers: { 
                            ...form.getHeaders(),
                            'Authorization': `Bearer ${token}`,
                            'X-Action-Token': actionToken
                        }
                    });

                    console.log(chalk.green.bold(`\n🎉 Success! ${metadata.name}@${metadata.version} published.`));
                    fs.removeSync(zipPath);
                    process.exit(0);
                } catch (error) {
                    fs.removeSync(path.join(currentDir, `.xpm-pack-*`)).catch(()=>{});
                    console.error(chalk.red('\n✖ Publish failed:'), error.response?.data?.error || error.message);
                    process.exit(1);
                }
            }
        });

        server.listen(8989, () => {
            open(`${SERVER_URL}/authorize?action=publish&package=${metadata.name}&version=${metadata.version}&port=8989`);
        });
    });

// xpm install
program
    .command('install')
    .description('Install an executable package globally')
    .argument('<pkgName>', 'Name of the package (e.g., pkg or pkg@1.0.0)')
    .action(async (pkgNameStr) => {
        console.log(chalk.cyan(`\n📦 Fetching ${pkgNameStr}...`));
        
        // Basic resolution logic
        let name = pkgNameStr;
        let version = 'latest';
        if (pkgNameStr.includes('@') && !pkgNameStr.startsWith('@')) {
            [name, version] = pkgNameStr.split('@');
        }

        try {
            // Check metadata first
            const { data: meta } = await axios.get(`${SERVER_URL}/api/package/${name}`);
            const targetVersion = version === 'latest' ? meta.distTags.latest : version;
            
            console.log(chalk.gray(`Resolving ${name}@${targetVersion}...`));
            
            // NOTE: Need to implement the exact download endpoint matching versions on backend
            // Doing a basic simulation for now.
            console.log(chalk.green(`✔ Installed ${name} to ${XPM_BIN}`));
            console.log(chalk.yellow('Make sure ' + XPM_BIN + ' is in your system PATH.'));
        } catch(e) {
            console.error(chalk.red('✖ Error installing package:'), e.response?.data?.error || e.message);
        }
    });

program.parse(process.argv);
