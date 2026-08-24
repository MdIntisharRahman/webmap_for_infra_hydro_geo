const fs = require('fs');
let code = fs.readFileSync('frontend/styles.css', 'utf8');

// Remove forced pinned transform for tablet
code = code.replace(
    /(\/\* Tablet Adaptations \*\/[\s\S]*?\.side-panel-container \{[\s\S]*?)transform: translateY\(-50%\) translateX\(0\);/,
    ''
);

// Remove forced pinned transform for wide monitor
code = code.replace(
    /(\/\* Wide Monitor Adaptations \*\/[\s\S]*?\.side-panel-container \{[\s\S]*?)transform: translateY\(-50%\) translateX\(0\);/,
    ''
);

// Remove the "Fix pin buttons display" block entirely
code = code.replace(
    /\/\* Fix pin buttons display \*\/[\s\S]*?#pin-btn\s*\{\s*display:\s*none;\s*\}\s*\}/g,
    ''
);

// Remove original display:none for pin-btn in tablet
code = code.replace(
    /\.pin-btn\s*\{\s*display:\s*none;\s*\}/g,
    ''
);

fs.writeFileSync('frontend/styles.css', code);
