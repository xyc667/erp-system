/**
 * Re-add Modal import for files using Modal.confirm after FormModal migration.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pagesDir = path.join(__dirname, '../src/pages')

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) walk(full, out)
    else if (name.endsWith('.tsx')) out.push(full)
  }
  return out
}

let count = 0
for (const file of walk(pagesDir)) {
  let src = fs.readFileSync(file, 'utf8')
  if (!src.includes('Modal.confirm')) continue
  if (src.includes("import { Modal") || src.match(/import \{[^}]*Modal[^}]*\} from 'antd'/)) continue

  const antdImport = src.match(/import \{([^}]+)\} from 'antd'\n/)
  if (antdImport) {
    const parts = antdImport[1].split(',').map((s) => s.trim()).filter(Boolean)
    if (!parts.includes('Modal')) {
      parts.push('Modal')
      parts.sort((a, b) => a.localeCompare(b))
      src = src.replace(antdImport[0], `import { ${parts.join(', ')} } from 'antd'\n`)
      fs.writeFileSync(file, src)
      count++
      console.log('fixed:', path.relative(pagesDir, file))
    }
  }
}
console.log(`Done. ${count} files fixed.`)
