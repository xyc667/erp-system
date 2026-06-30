/**
 * 按 poi_category_raw 重新映射已有线索分类（高德一级大类）
 * Usage: cd backend && node ../scripts/recategorize-leads.mjs
 */
import { createRequire } from 'module';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(resolve(__dirname, '../backend/package.json'));
const { PrismaClient } = require('@prisma/client');

function mapFromRaw(raw, source) {
  if (!raw) return '其他';
  const major = raw.split(';')[0].trim();
  if (major && !/^[a-z_]+$/i.test(major)) return major;
  const t = raw;
  if (/restaurant|fast_food|cafe|餐|饮|食/.test(t)) return '餐饮服务';
  if (/shop|supermarket|mall|购物|超市/.test(t)) return '购物服务';
  if (/hotel|宾馆|住宿/.test(t)) return '住宿服务';
  if (/hospital|clinic|pharmacy|医|药/.test(t)) return '医疗保健服务';
  if (/school|college|教育|培训/.test(t)) return '科教文化服务';
  if (/car|汽车|汽修/.test(t)) return '汽车服务';
  if (/bank|金融/.test(t)) return '金融保险服务';
  return source === 'osm' ? '生活服务' : '其他';
}

const prisma = new PrismaClient();
const leads = await prisma.leadPool.findMany({
  select: { id: true, category: true, poiCategoryRaw: true, source: true },
});
let updated = 0;
for (const lead of leads) {
  const next = mapFromRaw(lead.poiCategoryRaw, lead.source);
  if (next !== lead.category) {
    await prisma.leadPool.update({ where: { id: lead.id }, data: { category: next } });
    updated++;
  }
}
console.log(`已更新 ${updated} / ${leads.length} 条分类`);
const stats = await prisma.leadPool.groupBy({
  by: ['category'],
  _count: { _all: true },
  orderBy: { _count: { category: 'desc' } },
});
for (const s of stats) console.log(`  ${s.category || '未分类'}: ${s._count._all}`);
await prisma.$disconnect();
