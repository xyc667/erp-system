/**
 * Wrap list page content (after PageTitle) in PageSection, closing before Modal.
 * Skips files that already import PageSection.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pagesDir = path.join(__dirname, '../src/pages')

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

const skip = new Set([
  'Login.tsx',
  'BiScreen.tsx',
  'Dashboard.tsx',
  'NotFound.tsx',
])

let updated = 0
for (const file of walk(pagesDir)) {
  const base = path.basename(file)
  if (skip.has(base)) continue

  let src = fs.readFileSync(file, 'utf8')
  if (!src.includes('ResponsiveTable') && !src.includes('PageTitle')) continue
  if (src.includes('PageSection')) continue
  if (!src.includes('<PageTitle')) continue

  const prefix = depthImportPrefix(file)
  const importLine = `import PageSection from '${prefix}components/PageSection'`

  if (!src.includes(importLine)) {
    const pageTitleImport = src.match(/import PageTitle from '[^']+'\n/)
    if (!pageTitleImport) continue
    src = src.replace(pageTitleImport[0], `${pageTitleImport[0]}${importLine}\n`)
  }

  // Insert <PageSection> after first <PageTitle /> (or with props)
  if (!src.includes('<PageSection>')) {
    src = src.replace(/(<PageTitle[^/]*\/>)\n/, '$1\n      <PageSection>\n')
  }

  // Close before first Modal at component return level
  if (src.includes('<Modal') && !src.includes('</PageSection>')) {
    src = src.replace(/\n(\s*)<Modal/, '\n$1</PageSection>\n$1<Modal')
  } else if (!src.includes('</PageSection>')) {
    // Close before final closing </div> of return
    src = src.replace(/\n(\s*)<\/div>\n(\s*)\)\n(\s*)\}/, '\n$1</PageSection>\n$1</div>\n$2)\n$3}')
  }

  fs.writeFileSync(file, src)
  updated++
  console.log('updated:', path.relative(pagesDir, file))
}

console.log(`Done. ${updated} files updated.`)
