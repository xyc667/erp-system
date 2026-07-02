/**
 * Migrate footer={null} form Modals to FormModal.
 * Skips non-form modals and files already using FormModal.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pagesDir = path.join(__dirname, '../src/pages')

const skipFiles = new Set([
  'Login.tsx',
  'BiScreen.tsx',
  'IntegrationCenter.tsx',
  'LeadReports.tsx',
])

function depthImportPrefix(filePath) {
  const rel = path.relative(pagesDir, filePath)
  const depth = rel.split(path.sep).length - 1
  return '../'.repeat(depth + 1)
}

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) walk(full, out)
    else if (name.endsWith('.tsx')) out.push(full)
  }
  return out
}

function removeSubmitRows(src) {
  let next = src
  // Form.Item with only submit button (optional extra cancel in same item)
  next = next.replace(
    /\s*<Form\.Item[^>]*>\s*<Button[^>]*type="primary"[^>]*htmlType="submit"[^>]*>[\s\S]*?<\/Button>(?:\s*<Button[\s\S]*?<\/Button>)?\s*<\/Form\.Item>/g,
    '',
  )
  // Compact mt-4 submit row
  next = next.replace(
    /\s*<Form\.Item className="mt-4"><Button type="primary" htmlType="submit">[^<]*<\/Button><\/Form\.Item>/g,
    '',
  )
  return next
}

function migrateFile(filePath) {
  const base = path.basename(filePath)
  if (skipFiles.has(base)) return false

  let src = fs.readFileSync(filePath, 'utf8')
  if (!src.includes('footer={null}') || !src.includes('<Form')) return false
  if (src.includes('FormModal')) return false

  const prefix = depthImportPrefix(filePath)
  const importLine = `import FormModal from '${prefix}components/FormModal'`

  if (!src.includes(importLine)) {
    const fromAntd = src.match(/import \{([^}]+)\} from 'antd'\n/)
    if (fromAntd) {
      const parts = fromAntd[1].split(',').map((s) => s.trim()).filter(Boolean)
      const withoutModal = parts.filter((p) => p !== 'Modal')
      if (withoutModal.length !== parts.length) {
        if (withoutModal.length === 0) {
          src = src.replace(fromAntd[0], `${importLine}\n`)
        } else {
          src = src.replace(fromAntd[0], `import { ${withoutModal.join(', ')} } from 'antd'\n${importLine}\n`)
        }
      } else {
        src = src.replace(fromAntd[0], `${fromAntd[0]}${importLine}\n`)
      }
    } else {
      src = `${importLine}\n${src}`
    }
  }

  const modalRe = /<Modal\s+([\s\S]*?)footer=\{null\}([\s\S]*?)>\s*<Form\s+form=\{(\w+)\}\s+layout="vertical"\s+onFinish=\{([\s\S]*?)\}\s*>/g
  let changed = false
  src = src.replace(modalRe, (_match, before, after, formName, onFinish) => {
    changed = true
    const attrs = `${before}${after}`.replace(/\s+/g, ' ').trim()
    return `<FormModal ${attrs} form={${formName}} onFinish={${onFinish}}>`
  })

  if (!changed) return false

  src = removeSubmitRows(src)
  src = src.replace(/\s*<\/Form>\s*<\/Modal>/g, '\n      </FormModal>')

  fs.writeFileSync(filePath, src)
  return true
}

let count = 0
for (const file of walk(pagesDir)) {
  if (migrateFile(file)) {
    count++
    console.log('migrated:', path.relative(pagesDir, file))
  }
}
console.log(`Done. ${count} files migrated.`)
