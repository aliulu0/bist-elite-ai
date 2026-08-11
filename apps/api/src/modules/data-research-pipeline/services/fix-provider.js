const fs = require('fs');
const content = fs.readFileSync('provider-health.service.ts', 'utf8');

// Remove duplicate CacheService import (line 18)
let fixed = content.replace(
  "import { CacheService } from '../../../common/cache/cache.service';\nimport { CacheService } from '../../../common/cache/cache.service';",
  "import { CacheService } from '../../../common/cache/cache.service';"
);

// Remove the readonly config line and keep the private config = getMarketDataConfig() line
fixed = fixed.replace(
  "private readonly config: ReturnType<typeof getMarketDataConfig>;\n\n  constructor(",
  "private readonly config = getMarketDataConfig();\n\n  constructor("
);

// Remove the duplicate config declaration line
fixed = fixed.replace("private readonly config: ReturnType<typeof getMarketDataConfig>;\n", "");

fs.writeFileSync('provider-health.service.ts', fixed);
console.log('Fixed');