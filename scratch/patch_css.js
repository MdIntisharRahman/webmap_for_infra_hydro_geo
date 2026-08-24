const fs = require('fs');
let code = fs.readFileSync('frontend/styles.css', 'utf8');

// Replace mobile panel height
code = code.replace(
    /max-height: 70vh;\s+z-index: 1001;/,
    'height: 55vh; max-height: 55vh;\n        z-index: 1001;'
);

// Replace max-height of tab-content-area
code = code.replace(
    /#tab-content-area \{\s+max-height: 250px;\s+\}/,
    '#tab-content-area {\n        flex: 1;\n        max-height: none;\n    }\n    .tabs-and-content {\n        flex: 1;\n        display: flex;\n        flex-direction: column;\n        min-height: 0;\n    }'
);

fs.writeFileSync('frontend/styles.css', code);
