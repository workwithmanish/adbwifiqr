// Test-only tripwire: fail rather than suppress any deprecated URL parsing.
require('node:url').parse = () => {
  throw new Error('Installer called deprecated url.parse(). Use the supported full-clone path.');
};
