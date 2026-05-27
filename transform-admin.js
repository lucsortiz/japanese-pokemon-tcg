const fs = require('fs');

let html = fs.readFileSync('admin.html', 'utf8');

// Add "Back to Public Site" to header
html = html.replace('<h1>JAPANESE POKEMON TCG</h1>', '<h1>JAPANESE POKEMON TCG <span style="font-size:0.4em; color:var(--neon-pink); vertical-align:middle;">ADMIN</span></h1>\n  <a href="index.html" style="position:absolute; top:20px; right:20px; color:var(--text-dim); text-decoration:none; font-size:0.8rem;">&larr; Back to Public</a>');

// Inject login prompt in body
const bodyStart = html.indexOf('<body>') + 6;

const loginHtml = `
<div id="login-overlay" style="position:fixed; inset:0; background:var(--bg-deep); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center;">
  <h2 style="font-family:'Bricolage Grotesque',sans-serif; margin-bottom:1rem;">Admin Login</h2>
  <input type="password" id="admin-pass" placeholder="Password" style="padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg-card); color:var(--text); font-size:1rem; margin-bottom:1rem;" onkeydown="if(event.key==='Enter') login()"/>
  <button onclick="login()" style="padding:10px 20px; border-radius:8px; background:var(--neon-pink); color:#fff; border:none; font-weight:bold; cursor:pointer;">Enter</button>
</div>
<div id="app-content" style="display:none;">
`;

html = html.slice(0, bodyStart) + loginHtml + html.slice(bodyStart);

const bodyEnd = html.lastIndexOf('</body>');
html = html.slice(0, bodyEnd) + '\n</div>\n<script>\nfunction login(){\n  if(document.getElementById("admin-pass").value === "admin"){\n    document.getElementById("login-overlay").style.display="none";\n    document.getElementById("app-content").style.display="block";\n  } else {\n    alert("Incorrect");\n  }\n}\n</script>\n' + html.slice(bodyEnd);

fs.writeFileSync('admin.html', html);
console.log("Successfully transformed admin.html");
