#!/usr/bin/env node
/**
 * find-component.js
 * Kataloglardan component arar, key döndürür.
 * API çağrısı yapmaz — tamamen offline çalışır.
 *
 * Kullanım:
 *   node scripts/fetch/find-component.js "button primary"
 *   node scripts/fetch/find-component.js "alarm page empty" --exact
 *   node scripts/fetch/find-component.js "icon" --group core --limit 20
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const INDEX_FILE = path.join(ROOT, "catalogs", "index.json");

const args = process.argv.slice(2);
const flags = [];
const queryParts = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) { flags.push(args[i]); if (!args[i].includes("=") && args[i+1] && !args[i+1].startsWith("--")) flags.push(args[++i]); }
  else queryParts.push(args[i]);
}
const query = queryParts.join(" ").toLowerCase().trim();
const exact = flags.includes("--exact");
const groupIdx = flags.indexOf("--group");
const groupFilter = groupIdx >= 0 ? flags[groupIdx + 1] : (flags.find(f => f.startsWith("--group="))?.split("=")[1] || null);
const limitFlag = flags.find(f => f.startsWith("--limit="));
const limit = limitFlag ? parseInt(limitFlag.split("=")[1]) : 20;

if (!query) {
  console.log("Kullanım: node find-component.js <arama> [--exact] [--group=core] [--limit=20]");
  console.log("Gruplar: base, core, modules, assets, local");
  process.exit(0);
}

if (!fs.existsSync(INDEX_FILE)) {
  console.error("❌ catalogs/index.json bulunamadı. Önce update-catalogs.js çalıştırın.");
  process.exit(1);
}

const index = JSON.parse(fs.readFileSync(INDEX_FILE, "utf-8"));
const queryTerms = query.split(/\s+/);

const results = Object.entries(index)
  .filter(([name, info]) => {
    if (groupFilter && info.group !== groupFilter) return false;
    if (exact) return name === query;
    return queryTerms.every((term) => name.includes(term));
  })
  .slice(0, limit);

if (results.length === 0) {
  console.log(`❌ "${query}" için sonuç bulunamadı`);
  process.exit(0);
}

console.log(`\n🔍 "${query}" — ${results.length} sonuç:\n`);
for (const [name, info] of results) {
  console.log(`  ${info.name}`);
  console.log(`    Key    : ${info.key}`);
  console.log(`    File   : ${info.fileName} (${info.group})`);
  console.log(`    NodeId : ${info.nodeId}`);
  console.log();
}
