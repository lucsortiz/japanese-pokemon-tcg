const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove the Buy input group
html = html.replace(/<div class="input-group"><span class="input-label"><span class="sym">¥<\/span>Buy<\/span><input class="price-input" type="number" min="0" step="1" data-key="[^"]+-buy"\/><\/div>\n?\s*/g, '');

// 2. Change input tags for Sell and Stock to div tags, and keep data-key for JS to fill them.
// Sell
html = html.replace(/<input class="price-input" type="number" min="0" step="0\.01" data-key="([^"]+)"\/>/g, '<div class="price-display" data-key="$1">0.00</div>');
// Stock
html = html.replace(/<input class="price-input" type="number" min="0" step="1" data-key="([^"]+)"\/>/g, '<div class="price-display" data-key="$1">0</div>');

// 3. Update the CSS for price-display and layout
html = html.replace(/\.card-inputs\{([\s\S]*?)\}/, `.card-inputs{
      display:grid;
      grid-template-columns: 1fr 1fr;
      gap:8px;
      padding:14px 22px 22px;
      background:linear-gradient(180deg, transparent, rgba(0,0,0,.25));
      border-top:1px solid rgba(255,255,255,.04);
    }`);

html = html.replace(/\.price-input\{([\s\S]*?)\}/, `.price-display{
      width:100%;
      padding:8px 0;
      font-size:1.4rem;
      font-weight:700;
      color:var(--text);
      font-family:'Bricolage Grotesque','Inter',sans-serif;
      text-align:right;
      letter-spacing:0.02em;
    }`);

// Remove unneeded hover/focus styles for price-input
html = html.replace(/\.price-input::-webkit-inner-spin-button,[\s\S]*?\.price-input:focus\{[\s\S]*?\}/, '');

// 4. Update the Javascript: remove upsert logic, change document.querySelectorAll to .price-display, set textContent
html = html.replace(/document\.querySelectorAll\('\.price-input'\)\.forEach\(inp => \{[\s\S]*?\}\);/, `document.querySelectorAll('.price-display').forEach(el => {
          el.textContent = prices[el.dataset.key] ?? 0;
        });`);

html = html.replace(/async function upsertPrice[\s\S]*?function scheduleUpsert[\s\S]*?800\);/g, '');

html = html.replace(/document\.querySelectorAll\('\.price-input'\)\.forEach\(inp => \{[\s\S]*?\}\);/g, '');

// 5. Change header to say Public Tracking
html = html.replace('<h1>JAPANESE POKEMON TCG</h1>', '<h1>JAPANESE POKEMON TCG</h1>\n  <a href="admin.html" style="position:absolute; top:20px; right:20px; color:var(--text-dim); text-decoration:none; font-size:0.8rem;">Admin</a>');

fs.writeFileSync('index.html', html);
console.log("Successfully transformed index.html");
