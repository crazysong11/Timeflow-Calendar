import { readFile, writeFile, copyFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const { version } = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const name = `Timeflow-Calendar_${version}_x64-setup.exe`;
const source = path.join(root, "src-tauri/target/release/bundle/nsis", `Timeflow Calendar_${version}_x64-setup.exe`);
const out = path.resolve(root, process.argv[2] || `work/release-${version}`);
const signature = (await readFile(source + ".sig", "utf8")).trim();
if (!signature) throw Error("Build a signed installer before preparing update assets.");
const notes = (await readFile(path.join(root, `docs/releases/v${version}.md`), "utf8")).split(/\r?\n---\r?\n/)[0].trim();
await mkdir(out, { recursive: true });
await copyFile(source, path.join(out, name));
await writeFile(path.join(out, name + ".sig"), signature + "\n");
await writeFile(path.join(out, "latest.json"), JSON.stringify({
  version, notes, pub_date: new Date().toISOString(),
  platforms: { "windows-x86_64": { signature, url: `https://github.com/crazysong11/Timeflow-Calendar/releases/download/v${version}/${name}` } },
}, null, 2) + "\n");
const hashes = [];
for (const file of [name, name + ".sig", "latest.json"]) {
  hashes.push(`${createHash("sha256").update(await readFile(path.join(out, file))).digest("hex")}  ${file}`);
}
await writeFile(path.join(out, "SHA256SUMS.txt"), hashes.join("\n") + "\n");
console.log(`Prepared installer, signature, update manifest and checksums in ${out}`);
