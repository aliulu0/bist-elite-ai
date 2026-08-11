const fs = require('fs');
const content = fs.readFileSync('provider-health.service.ts', 'utf8');
let fixed = content;

// Remove duplicate CacheService import (line 18)
fixed = fixed.replace(/import \{ CacheService \} from '\\.\\.\\.\\.\\/\\.\\.\\/\\.\\.\\/common\\/cache\\/cache\\.service';\nimport \{ CacheService \} from '\\.\\.\\.\\.\\/\\.\\.\\/\\.\\.\\/common\\/cache\\/cache\\.service';/g, "import { CacheService } from '../../../common/cache/cache.service';\n");

// Remove duplicate config declaration - remove the readonly config line and keep the private config = getMarketDataConfig() line
fixed = fixed.replace(/private readonly config: ReturnType<typeof getMarketDataConfig>;\n\n  constructor\(/, 'private readonly config = getMarketDataConfig();\n\n  constructor(');

fs.writeFileSync('provider-health.service.ts', fixed);
console.log('Fixed');