const fs = require('fs');
const files = [
  'data-freshness.service.ts',
  'data-quality.service.ts',
  'data-research-pipeline.service.ts',
  'mtf-coverage.service.ts',
  'indicator-coverage.service.ts',
  'source-quality.service.ts',
  'research-evidence.service.ts',
  'data-freshness.service.ts',
  'data-quality.service.ts',
  'data-research-pipeline.service.ts',
  'mtf-coverage.service.ts',
  'indicator-coverage.service.ts',
  'source-quality.service.ts',
  'research-evidence.service.ts'
];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let fixed = content;
  fixed = fixed.replace(/from '\.\.\/market-data/g, "from '../../market-data");
  fixed = fixed.replace(/from '\.\.\/common\/cache/g, "from '../../../common/cache");
  fixed = fixed.replace(/from '\.\.\/interfaces/g, "from '../interfaces");
  fixed = fixed.replace(/from '\.\.\/research/g, "from '../../research");
  fs.writeFileSync(file, fixed);
  console.log('Fixed:', file);
}