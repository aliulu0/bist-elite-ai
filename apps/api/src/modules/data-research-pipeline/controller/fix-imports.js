const fs = require('fs');
const content = fs.readFileSync('data-research-pipeline.controller.ts', 'utf8');
let fixed = content;
fixed = fixed.replace(/from '\.\.\/services/g, "from '../services");
fixed = fixed.replace(/from '\.\.\/providers/g, "from '../providers");
fs.writeFileSync('data-research-pipeline.controller.ts', fixed);
console.log('Fixed controller');