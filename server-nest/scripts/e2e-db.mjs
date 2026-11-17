import http from 'node:http';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import memoryServer from 'mongodb-memory-server';

const { MongoMemoryReplSet } = memoryServer;

const dbPort = Number(process.env.E2E_DB_PORT);
const readyPort = Number(process.env.E2E_DB_READY_PORT);
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

if (!dbPort || !readyPort || !adminEmail || !adminPassword) {
  console.error('Missing E2E_* environment variables');
  process.exit(1);
}

const replSet = await MongoMemoryReplSet.create({
  replSet: { name: 'e2e', count: 1, storageEngine: 'wiredTiger' },
  instanceOpts: [{ port: dbPort }],
});

await mongoose.connect(replSet.getUri('ems-e2e'));
const now = new Date();
await mongoose.connection.collection('users').insertOne({
  email: adminEmail,
  password: await bcrypt.hash(adminPassword, 10),
  role: 'ADMIN',
  createdAt: now,
  updatedAt: now,
});
await mongoose.disconnect();

const readyServer = http
  .createServer((_request, response) => response.end('ready'))
  .listen(readyPort, '127.0.0.1');

console.log(`E2E database ready on port ${dbPort}`);

async function shutdown() {
  readyServer.close();
  await replSet.stop();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
