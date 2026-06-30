/**
 * 沈阳 POI 公海数据全量导入
 * - 高德地图 API（需 AMAP_API_KEY，国内 POI 最全）
 * - OpenStreetMap Overpass（免费补充）
 *
 * Usage:
 *   cd backend && node ../scripts/import-shenyang-poi.mjs
 *   cd backend && node ../scripts/import-shenyang-poi.mjs --replace   # 清空现有公海后导入
 *   cd backend && node ../scripts/import-shenyang-poi.mjs --amap-only
 *   cd backend && node ../scripts/import-shenyang-poi.mjs --osm-only
 */
import { createHash } from 'crypto';
import { readFileSync, existsSync, appendFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(resolve(__dirname, '../backend/package.json'));
const { PrismaClient } = require('@prisma/client');

function loadEnv() {
  const envPath = resolve(__dirname, '../backend/.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

loadEnv();

const prisma = new PrismaClient();
const AMAP_KEYS = (process.env.AMAP_API_KEY || process.env.AMAP_API_KEYS || '')
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);
let amapKeyIndex = 0;
const nextAmapKey = () => {
  if (!AMAP_KEYS.length) return '';
  const k = AMAP_KEYS[amapKeyIndex % AMAP_KEYS.length];
  amapKeyIndex++;
  return k;
};
const REPLACE = process.argv.includes('--replace');
const AMAP_ONLY = process.argv.includes('--amap-only');
const OSM_ONLY = process.argv.includes('--osm-only');

/** 沈阳市 bounding box */
const SY_BBOX = { south: 41.2, west: 122.7, north: 42.05, east: 123.7 };

/** 高德 POI 一级大类（扫街销售相关，共 16 类） */
const AMAP_TYPES = [
  '010000', '020000', '030000', '040000',
  '050000', '060000', '070000', '080000', '090000', '100000',
  '110000', '120000',
  '140000', '160000', '170000', '200000',
];

/** 沈阳 13 区县 */
const DISTRICTS = [
  '和平区', '沈河区', '大东区', '皇姑区', '铁西区', '苏家屯区',
  '浑南区', '沈北新区', '于洪区', '辽中区', '新民市', '康平县', '法库县',
];

/** 高德关键词（按行业扫街） */
const AMAP_KEYWORDS = [
  '餐饮', '餐厅', '饭店', '火锅', '烧烤', '小吃', '快餐', '咖啡', '奶茶', '烘焙',
  '美发', '美容', '美甲', 'SPA', '造型',
  '五金', '建材', '灯饰', '瓷砖', '油漆', '水暖', '卫浴',
  '超市', '便利店', '商场', '服装店', '鞋店', '手机店', '家电',
  '药店', '诊所', '口腔', '眼镜',
  '酒店', '宾馆', '民宿', '旅馆',
  '汽修', '洗车', '轮胎', '4S店',
  '培训', '教育', '幼儿园', '驾校',
  '水果', '生鲜', '菜市场',
  'ktv', '网吧', '台球', '健身', '瑜伽',
  '图文', '打印', '快递',
  '家具', '窗帘', '装修',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LOG_PATH = resolve(__dirname, 'poi-import-progress.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    appendFileSync(LOG_PATH, line + '\n');
  } catch {
    /* ignore */
  }
}

function buildDedupKey(name, phone, district, source, sourceId) {
  if (sourceId && source !== 'manual') {
    const raw = `${source}|${sourceId}`;
    return createHash('sha256').update(raw).digest('hex');
  }
  const raw = `${name.trim().toLowerCase()}|${(phone || '').trim()}|${(district || '').trim()}`;
  return createHash('sha256').update(raw).digest('hex');
}

function mapAmapCategory(typeStr) {
  if (!typeStr) return '其他';
  const major = typeStr.split(';')[0].trim();
  if (major && !/^[a-z_]+$/i.test(major)) return major;
  const t = typeStr;
  if (/restaurant|fast_food|cafe|餐|饮|食/.test(t)) return '餐饮服务';
  if (/shop|supermarket|mall|购物|超市|服装/.test(t)) return '购物服务';
  if (/hotel|宾馆|住宿/.test(t)) return '住宿服务';
  if (/hospital|clinic|pharmacy|医|药/.test(t)) return '医疗保健服务';
  if (/school|college|教育|培训/.test(t)) return '科教文化服务';
  if (/car|汽车|汽修/.test(t)) return '汽车服务';
  if (/bank|金融/.test(t)) return '金融保险服务';
  return '生活服务';
}

function mapOsmCategory(tags) {
  const amenity = tags.amenity || '';
  const shop = tags.shop || '';
  const combined = `${amenity} ${shop}`;
  if (/restaurant|fast_food|cafe|bar|food|ice_cream|biergarten/.test(combined)) return '餐饮服务';
  if (/hairdress|beauty|nail|spa|massage/.test(combined)) return '生活服务';
  if (/hardware|doityourself|trade|building_material|plumber|electrical|curtain/.test(combined)) return '购物服务';
  if (/supermarket|convenience|mall|clothes|shoes|electronics|mobile_phone|department/.test(combined)) return '购物服务';
  if (/pharmacy|chemist|clinic|dentist|optician|hospital/.test(combined)) return '医疗保健服务';
  if (/hotel|motel|guest_house|hostel/.test(combined)) return '住宿服务';
  if (/car_repair|car_parts|tyres/.test(combined)) return '汽车维修';
  if (/school|kindergarten|college|university|driving/.test(combined)) return '科教文化服务';
  if (/fitness|sports|nightclub/.test(combined)) return '体育休闲服务';
  if (/greengrocer|butcher|seafood|bakery/.test(combined)) return '购物服务';
  if (/bank|atm/.test(combined)) return '金融保险服务';
  return '生活服务';
}

function normalizeDistrict(name) {
  if (!name) return null;
  for (const d of DISTRICTS) {
    if (name.includes(d) || name.includes(d.replace('区', '').replace('市', '').replace('县', ''))) return d;
  }
  if (name.includes('沈阳')) return null;
  return name.length <= 10 ? name : null;
}

function normalizeTel(tel) {
  if (tel == null || tel === '' || tel === '[]') return { phone: null, phoneBackup: null };
  const s = Array.isArray(tel) ? tel.join(';') : String(tel);
  const parts = s.split(';').map((p) => p.trim()).filter(Boolean);
  return { phone: parts[0] || null, phoneBackup: parts[1] || null };
}

function poiToLead(p) {
  const [lng, lat] = (p.location || '').split(',').map(Number);
  const { phone, phoneBackup } = normalizeTel(p.tel);
  return {
    name: p.name,
    phone,
    phoneBackup,
    address: p.address || p.business_area || null,
    district: normalizeDistrict(p.adname) || normalizeDistrict(p.cityname),
    category: mapAmapCategory(p.type),
    poiCategoryRaw: p.type,
    lng: lng || null,
    lat: lat || null,
    source: 'amap',
    sourceId: p.id,
  };
}

async function amapRequest(path, params) {
  const key = nextAmapKey();
  if (!key) throw new Error('无可用 AMAP_API_KEY');
  const qs = new URLSearchParams({ ...params, key });
  const res = await fetch(`https://restapi.amap.com/v3/place/${path}?${qs}`);
  const data = await res.json();
  if (data.status !== '1') {
    if (/配额|QPS|超限|DAILY|USERKEY/.test(data.info || '')) {
      await sleep(2000);
    }
    throw new Error(data.info || 'Amap API error');
  }
  return data;
}

async function fetchAmapTextPage(keywords, city, page) {
  const data = await amapRequest('text', {
    keywords,
    city,
    citylimit: 'true',
    offset: '25',
    page: String(page),
    extensions: 'all',
  });
  return { pois: data.pois || [], total: parseInt(data.count || '0', 10) };
}

function bboxPolygon(west, south, east, north) {
  return `${west},${south}|${east},${south}|${east},${north}|${west},${north}`;
}

async function fetchAmapPolygonPage(west, south, east, north, types, page) {
  const data = await amapRequest('polygon', {
    polygon: bboxPolygon(west, south, east, north),
    types,
    offset: '25',
    page: String(page),
    extensions: 'all',
  });
  return { pois: data.pois || [], total: parseInt(data.count || '0', 10) };
}

async function fetchAmapCell(west, south, east, north, types, seen, results, depth = 0) {
  let total = 0;
  try {
    const first = await fetchAmapPolygonPage(west, south, east, north, types, 1);
    total = first.total;
  } catch (e) {
    if (depth < 8 && (east - west) > 0.02) {
      const midLon = (west + east) / 2;
      const midLat = (south + north) / 2;
      await fetchAmapCell(west, south, midLon, midLat, types, seen, results, depth + 1);
      await fetchAmapCell(midLon, south, east, midLat, types, seen, results, depth + 1);
      await fetchAmapCell(west, midLat, midLon, north, types, seen, results, depth + 1);
      await fetchAmapCell(midLon, midLat, east, north, types, seen, results, depth + 1);
      return;
    }
    console.warn(`  [高德] 网格 ${west.toFixed(3)},${south.toFixed(3)}: ${e.message}`);
    return;
  }

  if (total > 800 && depth < 10 && (east - west) > 0.005) {
    const midLon = (west + east) / 2;
    const midLat = (south + north) / 2;
    await fetchAmapCell(west, south, midLon, midLat, types, seen, results, depth + 1);
    await fetchAmapCell(midLon, south, east, midLat, types, seen, results, depth + 1);
    await fetchAmapCell(west, midLat, midLon, north, types, seen, results, depth + 1);
    await fetchAmapCell(midLon, midLat, east, north, types, seen, results, depth + 1);
    return;
  }

  let page = 1;
  while (page <= 100) {
    let pois;
    try {
      ({ pois } = await fetchAmapPolygonPage(west, south, east, north, types, page));
    } catch (e) {
      console.warn(`  [高德] 网格 p${page}: ${e.message}`);
      break;
    }
    if (!pois?.length) break;
    for (const p of pois) {
      const id = `amap:${p.id}`;
      if (seen.has(id)) continue;
      seen.add(id);
      results.push(poiToLead(p));
    }
    if (pois.length < 25) break;
    page++;
    await sleep(120);
  }
}

async function fetchAmapQuadtree(seen, results) {
  const { west, south, east, north } = SY_BBOX;
  console.log('[高德] 四叉树网格扫描（按 POI 大类）…');
  for (const types of AMAP_TYPES) {
    await fetchAmapCell(west, south, east, north, types, seen, results);
    console.log(`  [高德] 类型 ${types} 完成，累计 ${results.length} 条`);
    await sleep(300);
  }
}

async function fetchAmapKeywords(seen, results) {
  console.log('[高德] 关键词补充扫描…');
  for (const kw of AMAP_KEYWORDS) {
    let page = 1;
    while (page <= 100) {
      try {
        const { pois } = await fetchAmapTextPage(kw, '沈阳', page);
        if (!pois.length) break;
        for (const p of pois) {
          const id = `amap:${p.id}`;
          if (seen.has(id)) continue;
          seen.add(id);
          results.push(poiToLead(p));
        }
        if (pois.length < 25) break;
        page++;
        await sleep(120);
      } catch (e) {
        console.warn(`  [高德] "${kw}" p${page}: ${e.message}`);
        break;
      }
    }
  }
}

async function fetchAmapAll() {
  if (!AMAP_KEYS.length) {
    console.log('\n[高德] 未配置 AMAP_API_KEY — 沈阳全量 POI 需高德 Web 服务 Key');
    console.log('  在 backend/.env 添加: AMAP_API_KEY="你的Key"');
    console.log('  多 Key 轮换: AMAP_API_KEYS="key1,key2"');
    console.log('  申请: https://console.amap.com/dev/key/app → Web 服务');
    return [];
  }
  console.log(`\n[高德] 开始采集沈阳市 POI（${AMAP_KEYS.length} 个 Key）…`);
  const results = [];
  const seen = new Set();
  await fetchAmapQuadtree(seen, results);
  await fetchAmapKeywords(seen, results);
  console.log(`[高德] 合计 ${results.length} 条（去重后）`);
  return results;
}

const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

async function fetchOverpassQuery(query) {
  let lastErr;
  const headers = { 'User-Agent': 'erp-poi-import/1.0 (erp-system; contact@local)' };
  for (const server of OVERPASS_SERVERS) {
    try {
      const getUrl = `${server}?data=${encodeURIComponent(query)}`;
      const res = await fetch(getUrl, {
        headers,
        signal: AbortSignal.timeout(90000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.remark && /error|timeout|too busy/i.test(data.remark)) {
        throw new Error(data.remark);
      }
      return data.elements || [];
    } catch (e) {
      lastErr = e;
      await sleep(1200);
    }
  }
  throw lastErr;
}

async function fetchOverpassTile(south, west, north, east) {
  const query = `[out:json][timeout:60];node["name"]["shop"](${south},${west},${north},${east});node["name"]["amenity"](${south},${west},${north},${east});out tags;`;
  return fetchOverpassQuery(query);
}

function elementToLead(el, fallbackDistrict) {
  const tags = el.tags || {};
  const name = tags.name || tags['name:zh'] || tags.brand;
  if (!name) return null;
  const isShop = tags.shop || tags.amenity || tags.office || tags.tourism;
  if (!isShop) return null;

  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  const phone = tags.phone || tags['contact:phone'] || tags['contact:mobile'] || null;
  const district =
    normalizeDistrict(tags['addr:district'] || tags['addr:suburb'] || tags['addr:city'] || '') ||
    fallbackDistrict;

  return {
    name,
    phone: phone ? String(phone).split(';')[0] : null,
    address: [tags['addr:province'], tags['addr:city'], tags['addr:district'], tags['addr:street'], tags['addr:housenumber']]
      .filter(Boolean)
      .join('') || null,
    district,
    category: mapOsmCategory(tags),
    poiCategoryRaw: [tags.amenity, tags.shop].filter(Boolean).join('/'),
    lng: lon ?? null,
    lat: lat ?? null,
    source: 'osm',
    sourceId: `${el.type}/${el.id}`,
  };
}

async function fetchOsmStreaming(onBatch) {
  log('[OSM] 开始采集沈阳 POI（OpenStreetMap，国内覆盖有限，作补充源）');
  const { south: minLat, west: minLon, north: maxLat, east: maxLon } = SY_BBOX;
  const step = 0.06;
  const seen = new Set();
  let total = 0;
  let tileNum = 0;
  const totalTiles = Math.ceil((maxLat - minLat) / step) * Math.ceil((maxLon - minLon) / step);

  for (let lat = minLat; lat < maxLat; lat += step) {
    for (let lon = minLon; lon < maxLon; lon += step) {
      tileNum++;
      const south = lat;
      const west = lon;
      const north = Math.min(lat + step, maxLat);
      const east = Math.min(lon + step, maxLon);
      const batch = [];
      try {
        const elements = await fetchOverpassTile(south, west, north, east);
        for (const el of elements) {
          const lead = elementToLead(el);
          if (!lead) continue;
          const key = `osm:${el.type}/${el.id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          batch.push(lead);
        }
        if (batch.length) await onBatch(batch);
        total += batch.length;
        if (tileNum % 3 === 0 || batch.length > 0) {
          log(`[OSM] ${tileNum}/${totalTiles} 格 (${south.toFixed(2)},${west.toFixed(2)}) +${batch.length} 累计 ${total}`);
        }
        await sleep(350);
      } catch (e) {
        log(`[OSM] tile ${south.toFixed(2)},${west.toFixed(2)} 失败: ${e.message}`);
        await sleep(1500);
      }
    }
  }
  log(`[OSM] 采集完成 ${total} 条`);
  return total;
}

async function importLeads(tenantId, items) {
  let created = 0;
  let skipped = 0;
  let failed = 0;
  const BATCH = 200;

  for (let i = 0; i < items.length; i += BATCH) {
    const chunk = items.slice(i, i + BATCH);
    const rows = chunk.map((item) => ({
      tenantId,
      name: item.name,
      phone: item.phone,
      phoneBackup: item.phoneBackup ?? null,
      address: item.address,
      district: item.district,
      category: item.category,
      poiCategoryRaw: item.poiCategoryRaw,
      lng: item.lng,
      lat: item.lat,
      source: item.source,
      sourceId: item.sourceId,
      dedupKey: buildDedupKey(item.name, item.phone, item.district, item.source, item.sourceId),
      status: 'pool',
      quality: 'unknown',
    }));
    try {
      const r = await prisma.leadPool.createMany({ data: rows, skipDuplicates: true });
      created += r.count;
      skipped += rows.length - r.count;
    } catch {
      for (const row of rows) {
        try {
          await prisma.leadPool.create({ data: row });
          created++;
        } catch (e) {
          if (e.code === 'P2002') skipped++;
          else failed++;
        }
      }
    }
    if (created % 1000 === 0 && created > 0) process.stdout.write(`  入库 ${created}…\r`);
  }
  return { created, skipped, failed };
}

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { code: 'default' } });
  if (!tenant) throw new Error('未找到 default 租户，请先 npm run seed');

  if (REPLACE) {
    const deleted = await prisma.leadPool.deleteMany({ where: { tenantId: tenant.id } });
    log(`已清空公海 ${deleted.count} 条`);
  }

  const totals = { created: 0, skipped: 0, failed: 0 };
  const mergeImport = async (items) => {
    const r = await importLeads(tenant.id, items);
    totals.created += r.created;
    totals.skipped += r.skipped;
    totals.failed += r.failed;
  };

  if (!OSM_ONLY) {
    const amapItems = await fetchAmapAll();
    if (amapItems.length) {
      log(`[高德] 入库 ${amapItems.length} 条…`);
      await mergeImport(amapItems);
    }
  }

  if (!AMAP_ONLY) {
    await fetchOsmStreaming(mergeImport);
  }

  const count = await prisma.leadPool.count({ where: { tenantId: tenant.id, status: 'pool' } });
  const withPhone = await prisma.leadPool.count({
    where: { tenantId: tenant.id, status: 'pool', phone: { not: null } },
  });

  log('\n导入完成:');
  log(`  公海总数: ${count}`);
  log(`  本次新增: ${totals.created}`);
  log(`  跳过(重复): ${totals.skipped}`);
  log(`  失败: ${totals.failed}`);
  log(`  含电话: ${withPhone} (${count ? ((withPhone / count) * 100).toFixed(1) : 0}%)`);

  const stats = await prisma.leadPool.groupBy({
    by: ['district'],
    where: { tenantId: tenant.id, status: 'pool' },
    _count: true,
  });
  log('\n公海按区县:');
  for (const s of stats.sort((a, b) => b._count - a._count)) {
    log(`  ${s.district || '未知'}: ${s._count}`);
  }

  if (!AMAP_KEYS.length) {
    log('\n提示: 沈阳全量真实 POI（5~15万条）需配置 backend/.env 中 AMAP_API_KEY');
    log('  申请: https://console.amap.com/dev/key/app → Web 服务');
    log('  配置后运行: cd backend && node ../scripts/import-shenyang-poi.mjs');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
