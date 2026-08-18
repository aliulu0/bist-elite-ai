#!/usr/bin/env node
/**
 * R2-070 REAL BIST UNIVERSE DISCOVERY RUNNER
 *
 * Probes every ACTIVE equity candidate in the BIST master registry against
 * the same Yahoo Finance chart endpoint the existing YahooFinanceProvider uses
 * (query1.finance.yahoo.com/v8/finance/chart). This is a runtime discovery
 * harness only — it does NOT create a second market-data pipeline, second
 * cache, or second provider. It reuses the exact URL scheme of the existing
 * provider so results reflect what the production provider would return.
 *
 * Per-symbol outcome:
 *   AVAILABLE  - real OHLCV returned
 *   UNAVAILABLE- no data returned (symbol not on Yahoo / no bars)
 *   INVALID    - non-equity instrument type (excluded by caller)
 *   RATE_LIMITED - HTTP 429 / blocked
 *   ENDPOINT_UNSUPPORTED - Yahoo chart returns an explicit error for the symbol
 *
 * Usage:
 *   node scripts/r2-070-universe-discovery.mjs --limit 50
 *   node scripts/r2-070-universe-discovery.mjs --offset 0 --out docs/R2-070_DISCOVERY_RUN.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(
  ROOT,
  'apps/api/src/modules/market-data/symbol-registry/bist-master-registry.data.ts',
);

const args = process.argv.slice(2);
function argValue(name, fallback) {
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : fallback;
}
const LIMIT = parseInt(argValue('--limit', '0'), 10) || 0; // 0 = all
const OFFSET = parseInt(argValue('--offset', '0'), 10) || 0;
const OUT = argValue('--out', path.join(ROOT, 'docs', 'R2-070_DISCOVERY_RUN.json'));

const BASE_URL = process.env.YAHOO_FINANCE_BASE_URL || 'https://query1.finance.yahoo.com/v8/finance/chart';
const TIMEOUT_MS = parseInt(process.env.YAHOO_FINANCE_TIMEOUT_MS || '15000', 10);
const DELAY_MS = parseInt(process.env.YAHOO_DISCOVERY_DELAY_MS || '150', 10);
const USER_AGENT = 'BIST-Elite-AI/1.0';

function parseRegistry(src) {
  const start = src.indexOf('= [');
  const end = src.lastIndexOf('];');
  const body = src.slice(start + 2, end + 1);
  // eslint-disable-next-line no-eval
  return eval(body);
}

const EQ_TYPES = new Set(['Equity', 'Bank', 'Insurance', 'Holding', 'REIT']);

async function probeSymbol(yahooTicker) {
  const url = `${BASE_URL}/${encodeURIComponent(yahooTicker)}?interval=1d&range=5d`;
  let res;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    return { status: 'RATE_LIMITED', reason: `network_error: ${error.message}`, httpStatus: 0 };
  }
  if (res.status === 429) {
    return { status: 'RATE_LIMITED', reason: 'http_429', httpStatus: 429 };
  }
  if (res.status >= 500) {
    return { status: 'RATE_LIMITED', reason: `http_${res.status}`, httpStatus: res.status };
  }
  let json;
  try {
    json = await res.json();
  } catch {
    return { status: 'ENDPOINT_UNSUPPORTED', reason: 'invalid_json', httpStatus: res.status };
  }
  const chartError = json?.chart?.error;
  if (chartError) {
    return { status: 'ENDPOINT_UNSUPPORTED', reason: `yahoo_error:${chartError.code}`, httpStatus: res.status };
  }
  const result = json?.chart?.result?.[0];
  if (!result || !result.timestamp || result.timestamp.length === 0) {
    return { status: 'UNAVAILABLE', reason: 'no_bars', httpStatus: res.status };
  }
  const meta = result.meta || {};
  const quote = result.indicators?.quote?.[0];
  const n = result.timestamp.length;
  let validBars = 0;
  for (let i = 0; i < n; i++) {
    const o = quote?.open?.[i];
    const h = quote?.high?.[i];
    const l = quote?.low?.[i];
    const c = quote?.close?.[i];
    const v = quote?.volume?.[i];
    if (o == null || h == null || l == null || c == null || v == null) continue;
    if (o <= 0 || h <= 0 || l <= 0 || c <= 0) continue;
    if (h < l) continue;
    validBars++;
  }
  return {
    status: 'AVAILABLE',
    reason: 'real_data',
    httpStatus: res.status,
    barsReturned: n,
    validBars,
    currency: meta.currency || null,
    regularMarketPrice: meta.regularMarketPrice ?? null,
    exchangeName: meta.exchangeName || null,
    fullExchangeName: meta.fullExchangeName || null,
    instrumentType: meta.instrumentType || null,
    firstBar: new Date(result.timestamp[0] * 1000).toISOString(),
    lastBar: new Date(result.timestamp[n - 1] * 1000).toISOString(),
  };
}

async function main() {
  const src = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const registry = parseRegistry(src);
  const candidates = registry.filter((e) => EQ_TYPES.has(e.assetType) && e.status === 'active');

  const slice = LIMIT > 0 ? candidates.slice(OFFSET, OFFSET + LIMIT) : candidates.slice(OFFSET);
  const startedAt = new Date().toISOString();
  const results = [];

  console.log(`[r2-070] probing ${slice.length} active equity candidates (offset=${OFFSET}, limit=${LIMIT || 'all'})`);

  for (const entry of slice) {
    const outcome = await probeSymbol(entry.yahooTicker);
    results.push({
      internalSymbol: entry.ticker,
      providerSymbol: entry.yahooTicker,
      instrumentType: entry.assetType,
      sector: entry.sector || null,
      market: entry.market || null,
      currency: entry.currency || 'TRY',
      status: outcome.status,
      reason: outcome.reason,
      httpStatus: outcome.httpStatus,
      retrievedAt: new Date().toISOString(),
      data: {
        barsReturned: outcome.barsReturned ?? null,
        validBars: outcome.validBars ?? null,
        currency: outcome.currency ?? null,
        regularMarketPrice: outcome.regularMarketPrice ?? null,
        exchangeName: outcome.exchangeName ?? null,
        fullExchangeName: outcome.fullExchangeName ?? null,
        instrumentType: outcome.instrumentType ?? null,
        firstBar: outcome.firstBar ?? null,
        lastBar: outcome.lastBar ?? null,
      },
    });
    const line = `[r2-070] ${entry.ticker} -> ${outcome.status}${outcome.barsReturned ? ` (${outcome.barsReturned} bars)` : ''}`;
    console.log(line);
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }

  const byStatus = {};
  for (const r of results) byStatus[r.status] = (byStatus[r.status] || 0) + 1;

  const output = {
    metadata: {
      script: 'scripts/r2-070-universe-discovery.mjs',
      endpoint: `${BASE_URL}/{symbol}?interval=1d&range=5d`,
      startedAt,
      finishedAt: new Date().toISOString(),
      offset: OFFSET,
      limit: LIMIT,
      probedCount: results.length,
      delayMs: DELAY_MS,
    },
    byStatus,
    results,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(output, null, 2), 'utf8');
  console.log(`[r2-070] wrote ${results.length} results to ${OUT}`);
  console.log('[r2-070] byStatus:', JSON.stringify(byStatus));
}

main().catch((error) => {
  console.error('[r2-070] fatal:', error);
  process.exit(1);
});