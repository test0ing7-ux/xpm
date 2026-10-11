#!/usr/bin/env node

// XPX - Native execution utility for XPM (Equivalent to npx for npm)
// Usage: xpx [-y] <package> [args...]

const chalk = require('chalk');
const { executePackage } = require('./runner');

const rawArgs = process.argv.slice(2);
let autoYes = false;
let pkgNameStr = null;
let passThroughArgs = [];

for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg === '-y' || arg === '--yes') {
        autoYes = true;
    } else if (!pkgNameStr && !arg.startsWith('-')) {
        pkgNameStr = arg;
        passThroughArgs = rawArgs.slice(i + 1);
        break;
    }
}

if (!pkgNameStr) {
    console.log(chalk.cyan.bold('\nXPX - Native Package Runner (Like npx for XPM)\n'));
    console.log('Usage:');
    console.log('  xpx [options] <package[@version]> [args...]');
    console.log('\nOptions:');
    console.log('  -y, --yes    Automatically confirm package download and run');
    console.log('\nExamples:');
    console.log('  xpx -y awt');
    console.log('  xpx -y neon --status');
    console.log('  xpm i <package>       Install globally');
    console.log('  xpm x -y <package>    Run on the fly\n');
    process.exit(1);
}

executePackage(pkgNameStr, passThroughArgs);
