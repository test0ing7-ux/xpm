#!/usr/bin/env node
const { program } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');
const FormData = require('form-data');

const SERVER_URL = 'http://localhost:3000'; // Change this when hosting remotely

program
  .name('xpm')
  .description('XPM - The ultimate custom package manager')
  .version('1.0.0');

program
  .command('publish')
  .description('Publish the current directory as a package')
  .argument('<pkgName>', 'Name of the package')
  .action(async (pkgName) => {
    console.log(`\n📦 Packing ${pkgName}...`);
    const currentDir = process.cwd();
    const zipPath = path.join(currentDir, `${pkgName}.zip`);

    try {
      // 1. Create a zip of the current directory
      const zip = new AdmZip();
      zip.addLocalFolder(currentDir);
      zip.writeZip(zipPath);
      console.log(`✅ Created zip file locally`);

      // 2. Upload it to our custom registry
      console.log(`☁️  Uploading to XPM registry...`);
      const form = new FormData();
      form.append('package', fs.createReadStream(zipPath));
      form.append('name', pkgName);

      await axios.post(`${SERVER_URL}/publish`, form, {
        headers: { ...form.getHeaders() }
      });
      
      console.log(`🎉 Success! ${pkgName} published successfully.`);
      
      // 3. Cleanup the local zip
      fs.removeSync(zipPath);
    } catch (error) {
      console.error('❌ Error publishing package:', error.message);
    }
  });

program
  .command('install')
  .description('Install a package from the XPM registry')
  .argument('<pkgName>', 'Name of the package to install')
  .action(async (pkgName) => {
    console.log(`\n🔍 Searching for ${pkgName}...`);
    
    // We will install packages in C:\Users\Current_User\.xpm\packages
    const homeDir = require('os').homedir();
    const xpmDir = path.join(homeDir, '.xpm', 'packages', pkgName);
    const zipPath = path.join(homeDir, '.xpm', `${pkgName}.zip`);

    try {
      fs.ensureDirSync(path.join(homeDir, '.xpm', 'packages'));
      
      // 1. Download the package
      console.log(`⬇️  Downloading ${pkgName}...`);
      const response = await axios({
        method: 'GET',
        url: `${SERVER_URL}/download/${pkgName}`,
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(zipPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // 2. Extract it
      console.log(`📦 Extracting...`);
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(xpmDir, true);

      console.log(`✨ Success! Installed at: ${xpmDir}`);
      
      // 3. Cleanup the local zip
      fs.removeSync(zipPath);
    } catch (error) {
      console.error('❌ Error installing package:', error.response?.status === 404 ? 'Package not found' : error.message);
    }
  });

program.parse(process.argv);
