const fs = require('fs');
const content = fs.readFileSync('provider-health.service.ts', 'utf8');

// Remove duplicate CacheService import
let fixed = content.replace(
  "import { CacheService } from '../../../common/cache/cache.service';\nimport { CacheService } from '../../../common/cache/cache.service';",
  "import { Cache Service } from '../../../common/cache/cache.service';"
);

// Remove duplicate config line
fixed = fixed.replace(
  "private readonly config = getMarketDataConfig();\n\n  constructor(",
  "private readonly config = getMarketDataConfig();\n\n  constructor("
);

fs.writeFileSync('provider-health.service.ts', fixed);
console.log('Fixed');