#!/usr/bin/env node
/**
 * update-catalogs.js
 * Tüm FellowKit + Local Library dosyalarından component key'lerini çeker,
 * catalogs/ altına kaydeder ve master index oluşturur.
 *
 * Kullanım: node scripts/fetch/update-catalogs.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const CATALOGS_DIR = path.join(ROOT, "catalogs");

// .env'den token oku
const envPath = path.join(ROOT, ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const TOKEN = envContent.match(/FIGMA_TOKEN=(.+)/)?.[1]?.trim();
if (!TOKEN) { console.error("FIGMA_TOKEN bulunamadı"); process.exit(1); }

// ── Kütüphane tanımları ──────────────────────────────────────────────────────
const LIBRARIES = [
  // FellowKit [00 Base]
  { group: "base", key: "OHDToqlxQSQyEspJiS0K4n", name: "FK-Typography" },
  { group: "base", key: "DW5NtebXn6KGAiPJKjmauq", name: "FK-Visuals" },
  { group: "base", key: "vZaYJajcxG4I5OQLKBApV9", name: "FK-FlagshipColors" },
  { group: "base", key: "MR4xaDNSEgApGcU5J70JHE", name: "FK-SubBrandColors" },

  // FellowKit [01 Core]
  { group: "core", key: "Nlit2JQKPm0l2Z5fWMD983", name: "FK-Button" },
  { group: "core", key: "4R7A5OLRKJ9GmsdQ5JIPN9", name: "FK-ButtonGroup" },
  { group: "core", key: "KJLraiSuClOfcJWkqbH2nw", name: "FK-Charts" },
  { group: "core", key: "vkwVeHZiBCX3lSiZLR2upK", name: "FK-Checkbox" },
  { group: "core", key: "aJtIIFR51thwzjYAAhf6H6", name: "FK-Chips" },
  { group: "core", key: "xtfDipMq69j91GSzrJQhzY", name: "FK-Drawer" },
  { group: "core", key: "PXi811WxncaFFdn2Ul5X7m", name: "FK-Dropdown" },
  { group: "core", key: "NtzBKUfAuAVIiALPZOejV9", name: "FK-Filters" },
  { group: "core", key: "bHav3vCFOlMn8TWnwaciXD", name: "FK-Gauge" },
  { group: "core", key: "DiVyjfM8iWfJeQVZoGfOf1", name: "FK-Graph" },
  { group: "core", key: "1foGqXD8NLxXLs97OXRjy5", name: "FK-Icons" },
  { group: "core", key: "6GFF7T7fU5i6xDYgvPLX0j", name: "FK-InfoRow" },
  { group: "core", key: "366GFBWgYcSAnuiMmBZSlm", name: "FK-Input" },
  { group: "core", key: "rei2CMYXJD1qsA34KQ4hRO", name: "FK-Keyboards" },
  { group: "core", key: "C1rZmbQpk3gZDaeC1SQ16d", name: "FK-Loader" },
  { group: "core", key: "OD1CPbCRN4dPrOntLUYff1", name: "FK-Menu" },
  { group: "core", key: "FRKkPJh45bCELWgmAe9vHA", name: "FK-NotificationBadge" },
  { group: "core", key: "QKqC0qDVRzrlRkUZbxT6eA", name: "FK-Overlay" },
  { group: "core", key: "ADqYI5EermvB9JpEOByLH9", name: "FK-PriceRow" },
  { group: "core", key: "fglj1Gyg683cRrFzVklsrO", name: "FK-ProgressStepper" },
  { group: "core", key: "a3VVbE8J76uGX77d2ChecT", name: "FK-ProgressDot" },
  { group: "core", key: "pONZ7MnnWFyThMVh1BVeHD", name: "FK-Radio" },
  { group: "core", key: "YRnObGVc1Gjz2wvudqFFgk", name: "FK-RangeSelector" },
  { group: "core", key: "4DtqKs7Lzzp8ayZEbakx1X", name: "FK-Row" },
  { group: "core", key: "k6PMBkpjwmpKnwCdevrNA9", name: "FK-SegmentedControl" },
  { group: "core", key: "moFa24gGdMnmyNzJyscO0O", name: "FK-TableHeader" },
  { group: "core", key: "I8VF3iKT4wXpGziooEGK1O", name: "FK-Tables" },
  { group: "core", key: "b9bDpsrcp4dT22xgaD7ipR", name: "FK-Tabs" },
  { group: "core", key: "aYJZ11gzeieWPIyAyfsvmF", name: "FK-Ticker" },
  { group: "core", key: "8ByBHoDrIX38XoEU9rXEVh", name: "FK-Toast" },
  { group: "core", key: "Rai40im5wuttEk7ori4dkF", name: "FK-Toggle" },
  { group: "core", key: "YuRDNMsrweog6Dd3PbCYYF", name: "FK-Tooltip" },
  { group: "core", key: "JDaRUMfK9t0sKQGOUB4Cay", name: "FK-UserGizmo" },
  { group: "core", key: "KFZ4U3xQraZq1ZxHC4oNMA", name: "FK-Empty" },
  { group: "core", key: "2iIFDf53s7KHbLjt5nrzLW", name: "FK-Technology" },
  { group: "core", key: "rsMwutsd7tLrgKDXTQ0EcN", name: "FK-Utilities" },
  { group: "core", key: "MYLV177LGYkYrKXD5TtKIe", name: "FK-AssetRow" },
  { group: "core", key: "5PRWsNFWTDJAZYBkJsFsfX", name: "FK-Bullet" },

  // FellowKit [02 Modules]
  { group: "modules", key: "GoZDoZVaxgKT3lwn5ERr5B", name: "FK-AssetList" },
  { group: "modules", key: "2ZTHbEHReUPqN1b1au4JIX", name: "FK-BalancePNL" },
  { group: "modules", key: "NXig2szKnNmuPMIF0JYFxE", name: "FK-BasicTrade" },
  { group: "modules", key: "lXP90rO5s6pXUOCk338x4F", name: "FK-BottomNav" },
  { group: "modules", key: "BfqjMydNBPW0NtNPCkp7wn", name: "FK-Calendar" },
  { group: "modules", key: "Fn4cTGHiXtxWvAXDF8tAqv", name: "FK-Card" },
  { group: "modules", key: "qeprfeadWXeFygq3RKoo4b", name: "FK-ConfirmationDrawer" },
  { group: "modules", key: "0DXxACZsHL2P8NGEsRVpxJ", name: "FK-Convert" },
  { group: "modules", key: "JuIVr0cyIcq11A6pV5Rw8K", name: "FK-DOB" },
  { group: "modules", key: "Jwbl0CcwkodmmmxNmMWoOw", name: "FK-DatePicker" },
  { group: "modules", key: "MRFmDHubvRXb6gb52owX0p", name: "FK-Exceptions" },
  { group: "modules", key: "OJM0GrJL1IZnj7EZxTra58", name: "FK-FeeInformation" },
  { group: "modules", key: "lu8QQlPsZGU2MWltQBUZZi", name: "FK-Finalizer" },
  { group: "modules", key: "jPRQt7YtsKn0kvvN65fCbs", name: "FK-GraphModule" },
  { group: "modules", key: "L4PR4CRZ7lbfnhVaNUbXFn", name: "FK-NumpadUnit" },
  { group: "modules", key: "z2XpEnXNMxwhKf4qUFyOW9", name: "FK-OrderList" },
  { group: "modules", key: "hj56hdvkKyWrul6P9uf5sV", name: "FK-PINScreen" },
  { group: "modules", key: "tj3tKUoyT8fw0oJVA3TID9", name: "FK-PickerModal" },
  { group: "modules", key: "860JxpULNmSZShDDKc8dZD", name: "FK-PriceDetailGraph" },
  { group: "modules", key: "y0fqsC9RIiddun3581BQhH", name: "FK-TopNav" },
  { group: "modules", key: "nrsqqSsjRtYatCoixuKSmX", name: "FK-TradePages" },
  { group: "modules", key: "qMBvu90hoseTWLK0Hf5JMF", name: "FK-TradeStuff" },
  { group: "modules", key: "jeftAuSQnnJnEFSgRHhE8s", name: "FK-Validation" },

  // FellowKit [04 Assets]
  { group: "assets", key: "IiURTQxqTrLQnUizkCxMSQ", name: "x-CryptoLogos" },
  { group: "assets", key: "ehiVDR4Dhtls5jujkncviR", name: "x-StockLogos" },
  { group: "assets", key: "Pli3Ofc0Ch8Gm4I0C8AcxL", name: "x-FiatLogos" },
  { group: "assets", key: "Nkvz18CYJHlcdbl0AzUZpY", name: "Logos" },
  { group: "assets", key: "U1A2jnNqD5JouAU91CMhmD", name: "AppIcons" },
  { group: "assets", key: "JA26MALjdKmtmM7cEEKcF7", name: "FK-WireframeSet" },

  // Local Libraries
  { group: "local", key: "aXNHzdXZaGSv4dlnVBhPND", name: "LocalLib-Kripto" },
  { group: "local", key: "DBmpxv9QiETKI5IcUcm4Ai", name: "LocalLib-Hisse" },
];

// ── Yardımcı fonksiyonlar ────────────────────────────────────────────────────
async function fetchComponents(fileKey) {
  const res = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/components`,
    { headers: { "X-Figma-Token": TOKEN } }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${fileKey}`);
  const data = await res.json();
  return data.meta?.components || [];
}

function slugify(name) {
  return name.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-");
}

// ── Ana işlem ────────────────────────────────────────────────────────────────
async function main() {
  const masterIndex = {}; // name.toLowerCase() → { key, fileKey, fileName, group }
  const summary = { updatedAt: new Date().toISOString(), libraries: [] };

  for (const lib of LIBRARIES) {
    process.stdout.write(`Fetching ${lib.name}... `);

    let components = [];
    try {
      components = await fetchComponents(lib.key);
    } catch (e) {
      console.log(`SKIP (${e.message})`);
      continue;
    }

    // Her component'i indexe ekle
    for (const c of components) {
      const nameLower = c.name.toLowerCase();
      masterIndex[nameLower] = {
        key: c.key,
        nodeId: c.node_id,
        fileKey: lib.key,
        fileName: lib.name,
        group: lib.group,
        name: c.name,
      };
    }

    // Dosyaya kaydet
    const outDir = path.join(CATALOGS_DIR, lib.group);
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, `${slugify(lib.name)}.json`);
    const catalog = {
      fileKey: lib.key,
      name: lib.name,
      group: lib.group,
      updatedAt: new Date().toISOString(),
      componentCount: components.length,
      components: components.map((c) => ({
        key: c.key,
        nodeId: c.node_id,
        name: c.name,
        description: c.description || "",
        containingFrame: c.containing_frame?.name || "",
        containingPage: c.containing_frame?.pageName || "",
      })),
    };
    fs.writeFileSync(outFile, JSON.stringify(catalog, null, 2));
    summary.libraries.push({ name: lib.name, group: lib.group, count: components.length });
    console.log(`${components.length} components`);
  }

  // Master index kaydet
  fs.writeFileSync(
    path.join(CATALOGS_DIR, "index.json"),
    JSON.stringify(masterIndex, null, 2)
  );

  // Summary kaydet
  fs.writeFileSync(
    path.join(CATALOGS_DIR, "summary.json"),
    JSON.stringify(summary, null, 2)
  );

  const total = Object.keys(masterIndex).length;
  console.log(`\n✅ Tamamlandı: ${total} component indexlendi`);
  console.log(`   catalogs/index.json — arama için`);
  console.log(`   catalogs/{group}/*.json — detay için`);
}

main().catch((e) => { console.error(e); process.exit(1); });
