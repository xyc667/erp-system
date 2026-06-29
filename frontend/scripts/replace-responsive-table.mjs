/**
 * Replaces antd Table with ResponsiveTable across page components.
 * Run: node scripts/replace-responsive-table.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pagesDir = path.join(__dirname, '../src/pages')

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? walk(p) : p.endsWith('.tsx') ? [p] : []
  })
}

function depthToComponents(filePath) {
  const rel = path.relative(pagesDir, filePath)
  const depth = rel.split(path.sep).length - 1
  return '../'.repeat(depth + 1) + 'components/ResponsiveTable'
}

for (const file of walk(pagesDir)) {
  let src = fs.readFileSync(file, 'utf8')
  if (!src.includes('<Table') && !src.includes('Table,')) continue
  if (src.includes('ResponsiveTable')) continue

  const importPath = depthToComponents(file)

  // Add ResponsiveTable import after last import
  if (!src.includes('ResponsiveTable')) {
    src = src.replace(
      /(import .+ from ['"].+['"];?\n)(?!import)/,
      `$1import ResponsiveTable from '${importPath}'\n`,
    )
  }

  // Remove Table from antd import
  src = src.replace(
    /import\s*\{([^}]*)\}\s*from\s*['"]antd['"]/g,
    (match, imports) => {
      const parts = imports
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s && s !== 'Table')
      if (parts.length === 0) return match
      return `import { ${parts.join(', ')} } from 'antd'`
    },
  )

  src = src.replace(/<Table\b/g, '<ResponsiveTable')
  src = src.replace(/<\/Table>/g, '</ResponsiveTable>')

  fs.writeFileSync(file, src)
  console.log('updated', path.relative(pagesDir, file))
}
