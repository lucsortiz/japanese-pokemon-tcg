const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/<span class="input-label"><span class="sym">€<\/span>Sell<\/span>/g, '<span class="input-label"><span class="sym">€</span>Price</span>');
fs.writeFileSync('index.html', html);
console.log("Successfully changed Sell to Price");
