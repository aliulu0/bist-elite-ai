const fs = require('fs');
const content = fs.readFileSync('provider-health.service.ts', 'utf8');

// Remove duplicate CacheService import
let fixed = content.replace(
  "import { CacheService } from '../../../common/cache/cache.service';\nimport { CacheService } from '../../../common/cache/cache.service';",
  "import { CacheService } from '../../../common/cache/cache.service';"
);

fs.writeFileSync('provider-health.service.ts', fixed);
console.log('Fixed duplicate CacheService');