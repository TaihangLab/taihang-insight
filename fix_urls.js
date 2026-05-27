const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/api/stream.js',
  'src/api/region.js',
  'src/api/group.js',
  'src/api/channel.js',
  'src/api/dialog.js'
];

for (const file of filesToFix) {
  const filePath = path.join('D:\\sxzw\\信产院\\taihang-insight', file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace /api/v1/wvp/api/ with /api/
  content = content.replace(/\/api\/v1\/wvp\/api\//g, '/api/');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed ${file}`);
}
