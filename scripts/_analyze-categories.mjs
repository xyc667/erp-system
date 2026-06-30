import { createRequire } from 'module';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(resolve(dirname(fileURLToPath(import.meta.url)), '../backend/package.json'));
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const byCategory = await p.leadPool.groupBy({
  by: ['category'],
  _count: { _all: true },
  orderBy: { _count: { category: 'desc' } },
});
console.log('=== 映射后分类 ===');
for (const x of byCategory) console.log(x.category, x._count._all);

const raw = await p.$queryRaw`
  SELECT split_part(poi_category_raw, ';', 1) AS major, COUNT(*)::int AS cnt
  FROM lead_pool
  WHERE poi_category_raw IS NOT NULL AND poi_category_raw <> ''
  GROUP BY 1
  ORDER BY cnt DESC
  LIMIT 30
`;
console.log('\n=== 高德原始大类 Top30 ===');
for (const x of raw) console.log(x.major, x.cnt);

const sources = await p.leadPool.groupBy({ by: ['source'], _count: { _all: true } });
console.log('\n=== 数据来源 ===');
for (const x of sources) console.log(x.source, x._count._all);

await p.$disconnect();
