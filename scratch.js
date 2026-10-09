const fs = require('fs');
const jsCode = fs.readFileSync('./frontend/resources/BorelogVisualizer.js', 'utf8');

const regexFind = /find\(/g;
let match;
while ((match = regexFind.exec(jsCode)) !== null) {
    console.log(`Found 'find(' at index ${match.index}`);
    console.log(jsCode.substring(match.index - 50, match.index + 50));
}
