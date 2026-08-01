import { startServer } from '../server.js';

const server = await startServer(process.cwd(), 4173);
console.log(`serving ${process.cwd()} at ${server.url}`);
console.log(`player: ${server.url}/player/index.html?player=hlsjs&src=...`);
