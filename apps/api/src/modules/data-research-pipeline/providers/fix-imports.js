const fs = require('fs');
const files = ['agent-reach.adapter.ts', 'vectorbt.adapter.ts'];

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