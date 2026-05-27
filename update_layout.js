const fs = require('fs');

function processFile(filename) {
  let html = fs.readFileSync(filename, 'utf8');

  // 1. CSS changes for Booster layout
  // .card-media change to flex-direction: column
  html = html.replace(/\.card-media\{([\s\S]*?)\}/, (match, p1) => {
    let inner = p1.replace(/align-items:center;/, 'align-items:center;\n      flex-direction:column;');
    return `.card-media{${inner}}`;
  });

  // .booster-img increase size
  html = html.replace(/\.booster-img\{([\s\S]*?)\}/, (match, p1) => {
    let inner = p1.replace(/width:130px;/, 'width:180px;')
                  .replace(/height:170px;/, 'height:235px;');
    return `.booster-img{${inner}}`;
  });
  
  // .set-logo size adjust (maybe slightly larger or keep same)
  html = html.replace(/\.set-logo\{([\s\S]*?)\}/, (match, p1) => {
    let inner = p1.replace(/max-width:130px;/, 'max-width:150px;');
    return `.set-logo{${inner}}`;
  });

  // 2. Add Search Box to header
  const searchHtml = `\n  <input type="text" id="search-box" placeholder="Search cards..." style="margin-top:16px; padding:10px 16px; width:100%; max-width:400px; border-radius:8px; border:1px solid var(--border); background:var(--bg-card); color:var(--text); font-family:inherit; font-size:1rem;" />`;
  html = html.replace(/<div id="sync-status"><\/div>/, `<div id="sync-status"></div>${searchHtml}`);

  // Add JS for Search Box
  const searchJs = `
      document.getElementById('search-box')?.addEventListener('input', e => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.card').forEach(card => {
          card.style.display = card.textContent.toLowerCase().includes(term) ? 'flex' : 'none';
        });
      });
  `;
  html = html.replace(/\/\/ Parallax: subtle tilt/, `${searchJs}\n      // Parallax: subtle tilt`);

  // 3. For public page ONLY: currency symbol position
  if (filename === 'index.html') {
    // Change <span class="input-label"><span class="sym">€</span>Price</span>
    // to <span class="input-label">Price</span>
    html = html.replace(/<span class="input-label"><span class="sym">€<\/span>Price<\/span>/g, '<span class="input-label">Price</span>');
    html = html.replace(/<span class="input-label"><span class="sym">#<\/span>Stock<\/span>/g, '<span class="input-label">Stock</span>');

    // Wrap price-display and append sym with same font size and keeping color var(--neon-cyan) for sv and var(--neon-pink) for mega
    // The color logic: .sym uses var(--card-accent, var(--neon-cyan)). So we can just use class="sym" but change its CSS.
    
    // We can do this in JS since replacing all 32 occurrences with wrapper is tricky.
    // Wait, replacing is easy:
    html = html.replace(/<div class="price-display" data-key="([^"]+-sell)">0\.00<\/div>/g, '<div style="display:flex; align-items:baseline; gap:4px;"><div class="price-display" data-key="$1">0.00</div><span class="sym" style="font-size:1.4rem; font-weight:700;">€</span></div>');
    html = html.replace(/<div class="price-display" data-key="([^"]+-stock)">0<\/div>/g, '<div style="display:flex; align-items:baseline; gap:4px;"><div class="price-display" data-key="$1">0</div><span class="sym" style="font-size:1.4rem; font-weight:700;">#</span></div>');
  }

  fs.writeFileSync(filename, html);
  console.log(`Successfully processed ${filename}`);
}

processFile('index.html');
processFile('admin.html');
