#!/usr/bin/env node
const path = require('node:path');
const os = require('node:os');

// Global installs may be read-only. Keep runtime settings in the user's home.
process.env.ADBWIFIQR_HOME ||= path.join(os.homedir(), '.adbwifiqr');
require('../src/cli');
