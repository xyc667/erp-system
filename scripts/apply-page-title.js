const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'frontend', 'src', 'pages');
const skip = new Set(['Login.tsx', 'Dashboard.tsx', 'BiScreen.tsx', 'NotFound.tsx']);

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.tsx')) update(p);
  }
}

function update(file) {
  if (skip.has(path.basename(file))) return;
  let c = fs.readFileSync(file, 'utf8');
  if (!c.includes('<h1 className="text-xl font-bold mb-6"')) return;
  if (c.includes('PageTitle')) return;

  const rel = path.relative(root, file);
  const depth = rel.split(path.sep).length - 1;
  const importPath = depth === 0 ? '../components/PageTitle' : '../../components/PageTitle';

  if (!c.includes('import PageTitle')) {
    c = c.replace(/^(import .+\r?\n)/m, (m) => `${m}import PageTitle from '${importPath}'\n`);
  }
  c = c.replace(/<h1 className="text-xl font-bold mb-6"[^>]*>[\s\S]*?<\/h1>/, '<PageTitle />');
  fs.writeFileSync(file, c);
  console.log('Updated', rel);
}

walk(root);
