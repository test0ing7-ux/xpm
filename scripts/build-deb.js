const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const tar = require('tar');

function createArHeader(filename, size, mtime = 0, mode = '100644') {
    const buf = Buffer.alloc(60, 0x20); // space-padded
    buf.write(filename.padEnd(16, ' '), 0, 16, 'ascii');
    buf.write(String(mtime).padEnd(12, ' '), 16, 12, 'ascii');
    buf.write('0'.padEnd(6, ' '), 28, 6, 'ascii'); // UID
    buf.write('0'.padEnd(6, ' '), 34, 6, 'ascii'); // GID
    buf.write(mode.padEnd(8, ' '), 40, 8, 'ascii');
    buf.write(String(size).padEnd(10, ' '), 48, 10, 'ascii');
    buf.write('`\n', 58, 2, 'ascii');
    return buf;
}

async function buildDeb() {
    const tempDir = path.join(__dirname, '..', '.tmp_deb');
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir, { recursive: true });

    // 1. Prepare debian-binary
    const debianBinary = Buffer.from('2.0\n', 'ascii');

    // 2. Prepare control.tar.gz
    const controlDir = path.join(tempDir, 'control_root');
    fs.mkdirSync(controlDir, { recursive: true });
    const linuxBin = path.join(__dirname, '..', 'public', 'xpm-linux');
    if (!fs.existsSync(linuxBin)) {
        throw new Error(`xpm-linux not found at ${linuxBin}`);
    }
    const stat = fs.statSync(linuxBin);
    const installedSizeKb = Math.ceil(stat.size / 1024);

    const controlContent = `Package: xpm
Version: 1.0.0
Section: utils
Priority: optional
Architecture: amd64
Maintainer: EDVU Team <contact@edvu.in>
Installed-Size: ${installedSizeKb}
Homepage: https://edvu.in
Description: XPM Universal Native Package Manager
 XPM is a blazing fast native universal package manager with built-in passkey
 security, native package.json support, and xpx on-the-fly execution.
`;
    fs.writeFileSync(path.join(controlDir, 'control'), controlContent.replace(/\r\n/g, '\n'), { mode: 0o644 });

    const controlTarPath = path.join(tempDir, 'control.tar.gz');
    await tar.c({
        gzip: true,
        file: controlTarPath,
        cwd: controlDir,
        portable: true
    }, ['control']);
    const controlTarGz = fs.readFileSync(controlTarPath);

    // 3. Prepare data.tar.gz
    const dataDir = path.join(tempDir, 'data_root');
    const binDir = path.join(dataDir, 'usr', 'bin');
    fs.mkdirSync(binDir, { recursive: true });

    // Copy linux binary to /usr/bin/xpm
    fs.copyFileSync(linuxBin, path.join(binDir, 'xpm'));
    fs.chmodSync(path.join(binDir, 'xpm'), 0o755);

    // Create xpx wrapper script in /usr/bin/xpx
    const xpxScript = `#!/bin/sh\nexec /usr/bin/xpm x "$@"\n`;
    fs.writeFileSync(path.join(binDir, 'xpx'), xpxScript, { mode: 0o755 });

    const dataTarPath = path.join(tempDir, 'data.tar.gz');
    await tar.c({
        gzip: true,
        file: dataTarPath,
        cwd: dataDir,
        portable: true
    }, ['usr']);
    const dataTarGz = fs.readFileSync(dataTarPath);

    // 4. Assemble ar archive (.deb)
    const magic = Buffer.from('!<arch>\n', 'ascii');
    
    function makeEntry(name, buf) {
        const header = createArHeader(name, buf.length);
        const padding = (buf.length % 2 !== 0) ? Buffer.from('\n', 'ascii') : Buffer.alloc(0);
        return Buffer.concat([header, buf, padding]);
    }

    const debBuffer = Buffer.concat([
        magic,
        makeEntry('debian-binary', debianBinary),
        makeEntry('control.tar.gz', controlTarGz),
        makeEntry('data.tar.gz', dataTarGz)
    ]);

    const outPath = path.join(__dirname, '..', 'public', 'xpm.deb');
    const outPathVersioned = path.join(__dirname, '..', 'public', 'xpm_1.0.0_amd64.deb');
    fs.writeFileSync(outPath, debBuffer);
    fs.writeFileSync(outPathVersioned, debBuffer);

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });

    console.log(`✅ Successfully generated Debian packages:`);
    console.log(`   - ${outPath} (${(debBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(`   - ${outPathVersioned}`);
}

buildDeb().catch(err => {
    console.error('❌ Error building deb:', err);
    process.exit(1);
});
