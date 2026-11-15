import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// Run after npm ci and Cargo dependency download. Include the Windows normal
// dependency tree, including proc-macro transitive dependencies, conservatively.
const cargo = (...args) => execFileSync('cargo', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const manifest = ['--manifest-path', 'src-tauri/Cargo.toml'];
const metadata = JSON.parse(cargo('metadata', ...manifest, '--locked', '--offline', '--format-version', '1', '--filter-platform', 'x86_64-pc-windows-msvc'));
const tree = cargo('tree', ...manifest, '--locked', '--offline', '--target', 'x86_64-pc-windows-msvc', '--edges', 'normal', '--prefix', 'none', '--format', '{p}');
const names = new Set(tree.split(/\r?\n/).map(line => line.replace(/ \(.*$/, '').trim()));
const packages = metadata.packages.filter(p => names.has(`${p.name} v${p.version}`) && p.name !== 'timeflow-calendar');
const groups = new Map();
const sections = [];

function licenseFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory() && /^licen[sc]es$/i.test(entry.name)) {
      return fs.readdirSync(file).map(name => path.join(file, name)).filter(name => fs.statSync(name).isFile());
    }
    return entry.isFile() && /^(LICENSE|LICENCE|COPYING|COPYRIGHT|NOTICE)(\b|[-_.])/i.test(entry.name) ? [file] : [];
  }).sort();
}

function add(name, license, source, files, extra = '') {
  if (!files.length) throw new Error(`Missing license text: ${name}`);
  const ids = files.map(file => {
    const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim();
    const hash = createHash('sha256').update(text).digest('hex');
    if (!groups.has(hash)) groups.set(hash, { id: groups.size + 1, text });
    return groups.get(hash).id;
  });
  sections.push(`${name}\nLicense: ${license}\nSource: ${source}\nLicense texts: ${[...new Set(ids)].join(', ')}${extra ? `\n${extra}` : ''}`);
}

for (const p of packages.sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version))) {
  let files = licenseFiles(path.dirname(p.manifest_path));
  if (!files.length) {
    const override = path.join('licenses', `${p.name}-${p.version}.txt`);
    if (fs.existsSync(override)) files = [override];
  }
  add(`${p.name} ${p.version}`, p.license, `https://crates.io/crates/${p.name}/${p.version}`, files,
    p.license?.includes('MPL') ? 'Unmodified source is available from the source link under MPL-2.0.' : '');
}

for (const name of ['react', 'react-dom', 'scheduler', '@tauri-apps/api', '@tauri-apps/plugin-sql']) {
  const dir = path.join('node_modules', name);
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  const files = licenseFiles(dir);
  if (name === '@tauri-apps/plugin-sql') {
    files.push('node_modules/@tauri-apps/api/LICENSE-MIT', 'node_modules/@tauri-apps/api/LICENSE-APACHE-2.0');
  }
  add(`${name} ${pkg.version}`, pkg.license, `https://www.npmjs.com/package/${name}/v/${pkg.version}`, files);
}

const header = 'Timeflow Calendar — Third-party notices\n\nWindows dependencies and their license texts. This inventory also includes\ntransitive compilation dependencies. Each component retains its own license.\nSQLite is in the public domain: https://www.sqlite.org/copyright.html\nMicrosoft WebView2 is provided under Microsoft terms: https://developer.microsoft.com/microsoft-edge/webview2/\n';
const texts = [...groups.values()].map(g => `LICENSE TEXT ${g.id}\n\n${g.text}`);
fs.writeFileSync('THIRD_PARTY_NOTICES.txt', [header, ...sections, ...texts].join('\n\n' + '='.repeat(72) + '\n\n') + '\n');
console.log(`Generated notices for ${sections.length} packages with ${groups.size} distinct license texts.`);
