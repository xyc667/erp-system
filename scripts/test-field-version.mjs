/**
 * Smoke test: field Android/iOS version APIs + optional APK HEAD
 * Usage: node scripts/test-field-version.mjs
 */
const apiURL = process.env.E2E_API_URL || 'http://localhost:3001'

async function step(name, fn) {
  try {
    await fn()
    console.log('✓', name)
    return true
  } catch (e) {
    console.log('✗', name, '-', e.message)
    return false
  }
}

let ok = 0
const total = 4

if (await step('GET /api/app/field-android/latest', async () => {
  const res = await fetch(`${apiURL}/api/app/field-android/latest`)
  if (!res.ok) throw new Error(`status ${res.status}`)
  const data = await res.json()
  if (typeof data.versionCode !== 'number') throw new Error('missing versionCode')
  if (!data.downloadUrl && !data.apkUrl) throw new Error('missing downloadUrl/apkUrl')
  if (typeof data.forceUpdate !== 'boolean') throw new Error('missing forceUpdate')
  console.log('  ', JSON.stringify(data))
})) ok++

if (await step('GET /api/app/field-ios/latest', async () => {
  const res = await fetch(`${apiURL}/api/app/field-ios/latest`)
  if (!res.ok) throw new Error(`status ${res.status}`)
  const data = await res.json()
  if (typeof data.versionCode !== 'number') throw new Error('missing versionCode')
  if (typeof data.downloadUrl !== 'string') throw new Error('missing downloadUrl')
  if (typeof data.forceUpdate !== 'boolean') throw new Error('missing forceUpdate')
  if (data.apkUrl !== undefined) throw new Error('iOS should not return apkUrl')
  console.log('  ', JSON.stringify(data))
})) ok++

if (await step('version response has minVersionCode', async () => {
  for (const path of ['field-android/latest', 'field-ios/latest']) {
    const res = await fetch(`${apiURL}/api/app/${path}`)
    const data = await res.json()
    if (typeof data.minVersionCode !== 'number') throw new Error(`${path}: missing minVersionCode`)
  }
})) ok++

if (await step('HEAD apk path (optional if not built yet)', async () => {
  const res = await fetch(`${apiURL}/api/app/field-android/latest`)
  const data = await res.json()
  const apkUrl = data.downloadUrl || data.apkUrl
  const head = await fetch(apkUrl, { method: 'HEAD' })
  if (head.status === 404) {
    console.log('  (skip) APK not uploaded yet — run mobile-field npm run build:apk')
    return
  }
  if (!head.ok) throw new Error(`apk HEAD ${head.status}`)
  const ct = head.headers.get('content-type') || ''
  if (!ct.includes('android') && !ct.includes('octet-stream')) {
    console.log('  warn: content-type', ct)
  }
})) ok++

console.log(`\n${ok}/${total} passed`)
