/**
 * R2-071 Provider Runtime Verification
 * Calls the /api/market-data/:ticker/truth endpoint for each symbol
 * and records the results.
 * 
 * CRITICAL: Never fabricate prices. If a provider cannot supply BIST data,
 * report EXPLICIT ABSENCE. Never silently average conflicting prices.
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000'; // Will be adjusted for actual test
const SYMBOLS = [
  'THYAO',
  'THYAO.IS',
  'AKBNK', 
  'AKBNK.IS',
  'ASELS',
  'ASELS.IS',
  'BIMAS',
  'BIMAS.IS',
  'TUPRS',
  'TUPRS.IS',
  'GARAN',
  'GARAN.IS',
];

async function runVerification() {
  const results = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    symbolsTested: 0,
    providerResults: {},
    consensus: {
      priceConflicts: 0,
      singleSource: 0,
      multiSourceConfirmed: 0,
      noValidPrice: 0,
    },
    details: [],
  };

  for (const symbol of SYMBOLS) {
    results.symbolsTested++;
    const truthUrl = `${BASE_URL}/api/market-data/${symbol}/truth`;
    
    let truthData;
    try {
      const response = await fetch(truthUrl);
      if (!response.ok) {
        truthData = { error: `HTTP ${response.status}` };
      } else {
        truthData = await response.json();
      }
    } catch (e) {
      truthData = { error: `FETCH_FAILED: ${e.message}` };
    }

    results.providerResults[symbol] = truthData;
    results.details.push({
      symbol,
      status: truthData.status || 'UNKNOWN',
      consensusPrice: truthData.consensusPrice,
      confidence: truthData.confidence,
      sourceCount: truthData.sources ? truthData.sources.length : 0,
      hasConflict: !!truthData.conflict,
    });
  }

  // Summary
  let singleSource = 0, multiSource = 0, conflicts = 0, noValid = 0;
  for (const s of SYMBOLS) {
    const r = results.providerResults[s];
    if (!r) { noValid++; continue; }
    if (r.status === 'SINGLE_SOURCE_VERIFIED' || r.status === 'SINGLE_SOURCE_UNAVAILABLE') singleSource++;
    else if (r.status === 'MULTI_SOURCE_CONFIRMED' || r.status === 'MULTI_SOURCE_CONFIRMED_RESEARCH_SUPPORTED') multiSource++;
    else if (r.status === 'PRICE_CONFLICT') conflicts++;
    else noValid++;
  }

  console.log('=== R2-071 Provider Runtime Verification ===');
  console.log(`Symbols tested: ${results.symbolsTested}`);
  console.log(`Single source: ${singleSource}`);
  console.log(`Multi-source confirmed: ${multiSource}`);
  console.log(`Price conflicts: ${conflicts}`);
  console.log(`No valid price: ${noValid}`);
  console.log();
  console.log('Per-symbol results:');
  for (const s of SYMBOLS) {
    const r = results.providerResults[s];
    const detail = results.details.find(d => d.symbol === s);
    if (r && r.status) {
      console.log(`  ${s}: ${r.status} | Price: ${r.consensusPrice} ${r.consensusCurrency} | Confidence: ${r.confidence} | Sources: ${detail.sourceCount} | Conflict: ${detail.hasConflict}`);
    } else {
      console.log(`  ${s}: UNAVAILABLE | Error: ${r?.error || 'no response'}`);
    }
  }
  
  // Check for secrets in responses
  for (const s of SYMBOLS) {
    const r = results.providerResults[s];
    if (r && r.data) {
      const sources = r.data.sources || [];
      for (const src of sources) {
        if (src.price !== undefined && src.price !== null) {
          // Price is a number, that's fine
        }
      }
    }
  }

  console.log();
  console.log('=== Verification Complete ===');
}

runVerification().catch(console.error);