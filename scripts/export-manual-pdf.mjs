/**
 * Export docs/USER_MANUAL.md to PDF (with embedded images).
 * Usage: node scripts/export-manual-pdf.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from '@playwright/test'
import { marked } from 'marked'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const docsDir = path.join(root, 'docs')
const mdPath = path.join(docsDir, 'USER_MANUAL.md')
const htmlPath = path.join(docsDir, '_USER_MANUAL_export.html')
const pdfPath = path.join(docsDir, 'USER_MANUAL.pdf')
const pdfTmp = path.join(docsDir, 'USER_MANUAL.pdf.tmp')

const md = fs.readFileSync(mdPath, 'utf8')
const body = marked.parse(md)

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>ERP 系统详细使用说明</title>
  <style>
    @page { margin: 18mm 16mm; }
    body {
      font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif;
      font-size: 11pt;
      line-height: 1.65;
      color: #1a1a1a;
      max-width: 100%;
    }
    h1 { font-size: 22pt; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-top: 0; }
    h2 { font-size: 15pt; color: #1e40af; margin-top: 28px; page-break-after: avoid; }
    h3 { font-size: 12.5pt; margin-top: 18px; page-break-after: avoid; }
    h4 { font-size: 11.5pt; }
    blockquote {
      border-left: 4px solid #93c5fd;
      margin: 12px 0;
      padding: 8px 16px;
      background: #f8fafc;
      color: #334155;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 12px 0;
      font-size: 10pt;
      page-break-inside: avoid;
    }
    th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
    th { background: #eff6ff; font-weight: 600; }
    tr:nth-child(even) { background: #f8fafc; }
    code { background: #f1f5f9; padding: 1px 5px; border-radius: 3px; font-size: 9.5pt; }
    pre { background: #0f172a; color: #e2e8f0; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 9pt; }
    pre code { background: transparent; color: inherit; }
    img { max-width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 6px; margin: 12px 0; page-break-inside: avoid; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    a { color: #2563eb; text-decoration: none; }
    ul, ol { padding-left: 22px; }
    li { margin: 4px 0; }
  </style>
</head>
<body>
${body}
</body>
</html>`

fs.writeFileSync(htmlPath, html, 'utf8')

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' })
await page.pdf({
  path: pdfTmp,
  format: 'A4',
  printBackground: true,
  margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
  displayHeaderFooter: true,
  headerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#94a3b8;">ERP 系统详细使用说明</div>',
  footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#94a3b8;">第 <span class="pageNumber"></span> / <span class="totalPages"></span> 页</div>',
})
await browser.close()

try {
  if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath)
} catch {
  /* Windows may lock the file if open in a viewer */
}
fs.renameSync(pdfTmp, pdfPath)
fs.unlinkSync(htmlPath)
console.log(`PDF exported: ${pdfPath}`)
console.log(`Size: ${(fs.statSync(pdfPath).size / 1024).toFixed(1)} KB`)
