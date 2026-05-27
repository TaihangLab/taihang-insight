const fs = require('fs');
const path = require('path');
const glob = require('glob');

const apiDir = path.join('D:\\sxzw\\信产院\\taihang-insight', 'src', 'api');

glob(apiDir + '/**/*.js', (err, files) => {
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content.replace(/url:\s*['"`]\/api\/v1\//g, match => match.replace('/api/v1/', '/api/'));
    if (content !== newContent) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`Fixed ${file}`);
    }
  }
});
