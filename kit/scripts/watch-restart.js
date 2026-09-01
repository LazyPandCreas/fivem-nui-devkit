// Watches .lua files and restarts ONLY the affected resource via RCON,
// instead of restarting the entire FXServer.
//
// Usage:
//   RCON_PASSWORD=xxxx node scripts/watch-restart.js bridge ./resources/bridge
//
// Requires in server.cfg:
//   rcon_password "xxxx"
//   (and that RCON port is reachable locally)
//
// Dependency to install in the monorepo root: pnpm add -D chokidar

import chokidar from 'chokidar';
import dgram from 'dgram';

const [, , resourceName, watchPath] = process.argv;

if (!resourceName || !watchPath) {
  console.error('Usage: node watch-restart.js <resource-name> <path-to-watch>');
  process.exit(1);
}

const RCON_HOST = process.env.RCON_HOST || '127.0.0.1';
const RCON_PORT = Number(process.env.RCON_PORT || 30120);
const RCON_PASSWORD = process.env.RCON_PASSWORD;

if (!RCON_PASSWORD) {
  console.error(
    'Set RCON_PASSWORD (must match rcon_password in server.cfg)'
  );
  process.exit(1);
}

function sendRconCommand(command) {
  const socket = dgram.createSocket('udp4');
  const payload = Buffer.from(`\xFF\xFF\xFF\xFFrcon ${RCON_PASSWORD} ${command}`);
  socket.send(payload, RCON_PORT, RCON_HOST, (err) => {
    if (err) console.error('[watch] RCON Error:', err);
    socket.close();
  });
}

console.log(
  `[watch] Watching ${watchPath} — on every change I restart ONLY "${resourceName}" (not the entire server)`
);

chokidar.watch(watchPath, { ignoreInitial: true }).on('all', (event, filePath) => {
  console.log(`[watch] ${event}: ${filePath} -> restart ${resourceName}`);
  sendRconCommand(`restart ${resourceName}`);
});
