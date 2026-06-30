import { createRequire } from 'module';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(resolve(dirname(fileURLToPath(import.meta.url)), '../backend/package.json'));
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const c = await p.leadPool.count();
console.log('lead_pool count:', c);
await p.$disconnect();
