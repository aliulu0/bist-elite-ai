/**
 * R2-008 — BIST Master Symbol Registry generator.
 *
 * Reproducible: fetches the KAP IGS listing, probes Yahoo Finance coverage,
 * enriches with the existing local registry (ISIN, sector, English name) and
 * writes a canonical TypeScript data module consumed by SymbolRegistryService.
 *
 * Usage (from repo root):
 *   node scripts/generate-bist-master-registry.mjs \
 *     [--kap-json <path-or-url>] [--out <path>] [--local <path>] [--max-verify <n>]
 *
 * Defaults:
 *   --kap-json  https://www.kap.org.tr/tr/api/company/items/IGS/A
 *   --out       apps/api/src/modules/market-data/symbol-registry/bist-master-registry.data.ts
 *   --local     apps/api/src/modules/market-data/symbol-registry/bist-symbols.data.ts
 *   --max-verify 0 (0 = verify all tradable codes against Yahoo)
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const KAP_URL = arg('--kap-json') || 'https://www.kap.org.tr/tr/api/company/items/IGS/A';
const OUT = resolve(ROOT, arg('--out') || 'apps/api/src/modules/market-data/symbol-registry/bist-master-registry.data.ts');
const LOCAL = resolve(ROOT, arg('--local') || 'apps/api/src/modules/market-data/symbol-registry/bist-symbols.data.ts');
const MAX_VERIFY = parseInt(arg('--max-verify') || '0', 10);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchKAP() {
  if (existsSync(KAP_URL)) {
    console.log(`[kap] reading cached file: ${KAP_URL}`);
    return JSON.parse(readFileSync(KAP_URL, 'utf8'));
  }
  console.log(`[kap] fetching ${KAP_URL} ...`);
  const res = await fetch(KAP_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'application/json',
      Referer: 'https://www.kap.org.tr/tr/sirket-bilgileri',
    },
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`KAP HTTP ${res.status}`);
  return res.json();
}

function parseLocalRegistry(localPath) {
  const src = readFileSync(localPath, 'utf8');
  const entries = [];
  const blocks = src.split(/\{\s*canonicalTicker:/).slice(1);
  for (const block of blocks) {
    const ticker = (block.match(/^\s*'([^']+)'/) || [])[1];
    const name = (block.match(/companyName:\s*'([^']*)'/) || [])[1];
    const sector = (block.match(/sector:\s*'([^']*)'/) || [])[1];
    const isin = (block.match(/isin:\s*'([^']*)'/) || [])[1];
    const active = /active:\s*true/.test(block);
    if (!ticker) continue;
    entries.push({ canonicalTicker: ticker, companyName: name, sector, isin: isin ?? null, active });
  }
  return entries;
}

function classifyAssetType(entry) {
  const ft = entry.financialType || '';
  const title = (entry.kapMemberTitle || '').toUpperCase();
  const code = (entry.stockCode || '').trim().toUpperCase();
  if (ft === 'BNK') return 'Bank';
  if (ft === 'SIG') return 'Insurance';
  if (ft === 'GYO' || ft === 'GSYO') return 'REIT';
  if (ft === 'YO') return 'Investment Trust';
  if (ft === 'HLD') return 'Holding';
  if (ft === 'SIR') {
    if (code.endsWith('GYO') || title.includes('GAYRİMENKUL YATIRIM')) return 'REIT';
    return 'Equity';
  }
  if (ft === 'FFF') return 'Fund';
  if (ft === 'KTL') return 'Institutional';
  if (code.endsWith('GYO') || title.includes('GAYRİMENKUL YATIRIM')) return 'REIT';
  if (code.endsWith('YO') && !code.endsWith('GYO')) return 'Investment Trust';
  if (title.includes('YATIRIM FONU')) return 'Fund';
  if (title.includes('YATIRIM ORTAKLIĞI')) return 'Investment Trust';
  if (title.includes('FON')) return 'Fund';
  if (title.includes('VARANT')) return 'Fund';
  if (ft === '' || entry.financialType === null || entry.financialType === undefined) return 'Equity';
  return 'Unknown';
}

const toYahoo = (code) => `${code}.IS`;

async function probeYahoo(code) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(toYahoo(code))}?interval=1d&range=5d`;
  const t0 = Date.now();
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) });
    if (res.status !== 200) return { ok: false, status: res.status, ms: Date.now() - t0 };
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    return { ok: !!meta && meta.regularMarketPrice !== undefined, status: res.status, ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, status: -1, ms: Date.now() - t0 };
  }
}

async function main() {
  const kap = await fetchKAP();
  console.log(`[kap] ${kap.length} company records`);
  const local = parseLocalRegistry(LOCAL);
  console.log(`[local] ${local.length} local entries`);
  const localByTicker = new Map(local.map((e) => [e.canonicalTicker.toUpperCase(), e]));

  // Expand multi-code company records into per-ticker records
  const records = new Map();
  for (const it of kap) {
    const codes = (it.stockCode || '').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
    for (const code of codes) {
      records.set(code, { code, kap: it });
    }
  }
  console.log(`[expand] ${records.size} distinct ticker codes`);

  // Probe Yahoo coverage
  const tradableCodes = [...records.keys()].filter((c) => records.get(c).kap.payIslemDurumu === '1');
  const verifyList = MAX_VERIFY > 0 ? tradableCodes.slice(0, MAX_VERIFY) : tradableCodes;
  console.log(`[yahoo] probing ${verifyList.length} tradable codes ...`);
  const CONCURRENCY = 6;
  let idx = 0;
  const results = new Map();
  const worker = async () => {
    while (idx < verifyList.length) {
      const code = verifyList[idx++];
      results.set(code, await probeYahoo(code));
      await sleep(100);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const okCount = [...results.values()].filter((r) => r.ok).length;
  console.log(`[yahoo] ${okCount}/${results.size} tradable codes have live price`);

  const entries = [];
  for (const [code, { kap: it }] of records) {
    const localEnrich = localByTicker.get(code);
    const yahooResult = results.get(code);
    const active = it.payIslemDurumu === '1';
    const assetType = classifyAssetType(it);
    const sources = ['kap'];
    if (localEnrich?.isin || localEnrich?.sector) sources.push('local');
    if (yahooResult?.ok) sources.push('yahoo');
    entries.push({
      ticker: code,
      yahooTicker: toYahoo(code),
      isin: localEnrich?.isin ?? null,
      companyName: localEnrich?.companyName ?? null,
      turkishName: it.kapMemberTitle ?? null,
      sector: localEnrich?.sector ?? null,
      industry: null,
      market: 'BIST',
      exchange: 'BIST',
      currency: 'TRY',
      status: active ? 'active' : 'inactive',
      assetType,
      dataSources: sources,
      _yahooOk: yahooResult?.ok ?? false,
    });
  }

  const json = entries.map(({ _yahooOk, ...e }) => e);
  const q = (v) => `'${String(v).replace(/'/g, "\\'")}'`;
  const ts = [
    '[',
    json.map((e) => {
      const fields = [
        `ticker: ${q(e.ticker)},`,
        `yahooTicker: ${q(e.yahooTicker)},`,
        `isin: ${e.isin === null ? 'null' : q(e.isin)},`,
        `companyName: ${e.companyName === null ? 'null' : q(e.companyName)},`,
        `turkishName: ${e.turkishName === null ? 'null' : q(e.turkishName)},`,
        `sector: ${e.sector === null ? 'null' : q(e.sector)},`,
        `industry: ${e.industry === null ? 'null' : q(e.industry)},`,
        `market: ${q(e.market)},`,
        `exchange: ${q(e.exchange)},`,
        `currency: ${q(e.currency)},`,
        `status: ${q(e.status)},`,
        `assetType: ${q(e.assetType)},`,
        `dataSources: [${e.dataSources.map(q).join(', ')}],`,
      ].map((f) => `    ${f}`).join('\n');
      return `  {\n${fields}\n  }`;
    }).join(',\n'),
    ']',
  ].join('\n');
  const body = [
    '// AUTO-GENERATED by scripts/generate-bist-master-registry.mjs (R2-008).',
    '// Do not edit by hand — regenerate via:',
    '//   node scripts/generate-bist-master-registry.mjs',
    'import { BistMasterRegistryEntry } from \'./symbol-registry.types\';',
    '',
    'export const BIST_MASTER_REGISTRY: BistMasterRegistryEntry[] = ' + ts + ';',
    '',
    'export const BIST_MASTER_REGISTRY_MAP: Map<string, BistMasterRegistryEntry> = new Map(',
    '  BIST_MASTER_REGISTRY.map((entry) => [entry.ticker, entry]),',
    ');',
    '',
  ].join('\n');

  writeFileSync(OUT, body);
  console.log(`[write] ${OUT}`);
  console.log(`[write] ${entries.length} master registry entries (${okCount} yahoo-covered)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
