const fs = require('fs');

function refactorAdmin() {
  let content = fs.readFileSync('admin.html', 'utf8');
  
  // 1. Bigger booster, smaller logo
  content = content.replace(/width:180px;\s*height:235px;/, 'width:220px;\n      height:287px;');
  content = content.replace(/max-width:150px;\s*max-height:74px;/, 'max-width:110px;\n      max-height:54px;');
  
  // 2. Remove # from stock completely
  content = content.replace(/<span class="sym">#<\/span>Stock/g, 'Stock');
  
  // 3. Currency symbol should follow amount with a blank space separating
  // Currently: <div class="input-group"><span class="input-label"><span class="sym">¥</span>Buy</span><input class="price-input" type="number" min="0" step="1" data-key="MG6-abyss-eye-buy"/></div>
  // We want:   <div class="input-group"><span class="input-label">Buy</span><div style="display:flex; align-items:center; gap:4px;"><input class="price-input" .../> <span class="sym">¥</span></div></div>
  // Or simply: <div class="input-group"><span class="input-label">Buy</span><div style="display:flex; align-items:center;"><input ... style="margin-right: 4px;"/> <span class="sym">¥</span></div></div>
  
  // Let's use a regex to capture the symbol and the label text (Buy/Sell), and the input tag.
  // Pattern: <div class="input-group">\s*<span class="input-label"><span class="sym">([^<]+)<\/span>([^<]+)<\/span>\s*(<input[^>]+>)\s*<\/div>
  const rgx = /<div class="input-group">\s*<span class="input-label"><span class="sym">([^<]+)<\/span>([^<]+)<\/span>\s*(<input[^>]+>)\s*<\/div>/g;
  
  content = content.replace(rgx, (match, sym, label, input) => {
    return `<div class="input-group"><span class="input-label">${label}</span><div style="display:flex; align-items:center;">${input} <span class="sym" style="margin-left: 4px; font-size: 0.9rem;">${sym}</span></div></div>`;
  });
  
  // What if the stock input-group matches? We already removed <span class="sym">#</span> from it, so it won't match the regex anymore!
  
  fs.writeFileSync('admin.html', content);
}

function refactorIndex() {
  let content = fs.readFileSync('index.html', 'utf8');
  
  // 1. Bigger booster, smaller logo
  content = content.replace(/width:180px;\s*height:235px;/, 'width:220px;\n      height:287px;');
  content = content.replace(/max-width:150px;\s*max-height:74px;/, 'max-width:110px;\n      max-height:54px;');
  
  // 2. Remove # from stock completely
  // Pattern: <div class="price-display" data-key="[^"]+stock">[^<]+<\/div><span class="sym" style="font-size:1.4rem; font-weight:700;">#<\/span>
  const stockRgx = /(<div class="price-display" data-key="[^"]+-stock">[^<]+<\/div>)<span class="sym" style="font-size:1\.4rem; font-weight:700;">#<\/span>/g;
  content = content.replace(stockRgx, '$1');
  
  fs.writeFileSync('index.html', content);
}

refactorAdmin();
refactorIndex();
console.log("Done refactoring.");
