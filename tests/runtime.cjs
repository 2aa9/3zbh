const { existsSync } = require('node:fs');
const launchOptions = { headless: true, args: ['--no-sandbox'] };
const executablePath = process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
if (executablePath) launchOptions.executablePath = executablePath;
module.exports = { launchOptions };
