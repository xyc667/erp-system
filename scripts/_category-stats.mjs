import { createRequire } from 'module';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(resolve(dirname(fileURLToPath(import.meta.url)), '../backend/package.json'));
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const rows = await p.leadPool.groupBy({
  by: ['category'],
  _count: { _all: true },
  where: { status: 'pool' },
  orderBy: { _count: { category: 'desc' } },
});
const total = rows.reduce((s, x) => s + x._count._all, 0);
for (const x of rows) {
  const n = x._count._all;
  console.log(`${x.category || '未分类'}\t${n}\t${((n / total) * 100).toFixed(1)}%`);
}
console.log(`合计\t${total}`);
await p.$disconnect();
