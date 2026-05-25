const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      content = content.replace(/\brounded-(?:sm|md|lg|xl|2xl|3xl|full|none|\[[^\]]+\])\b/g, '');
      content = content.replace(/\brounded\b/g, '');
      content = content.replace(/bg-\[radial-gradient[^\]]+\]/g, '');
      
      // Clean up spaces in classNames
      content = content.replace(/className="([^"]*)"/g, (match, classes) => {
        return `className="${classes.replace(/\s+/g, ' ').trim()}"`;
      });
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated: ' + fullPath);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
