// Rendu de la SIM64 à 390 px : tailles de texte rendues, débordements du viewBox, textes qui se chevauchent. Usage : NODE_PATH=$(npm root -g) node audit/scripts/rendu-SIM64.cjs
const { chromium, devices } = require('playwright');
const MES = `(root) => [...root.querySelectorAll('svg')].map(s => { const vb = s.viewBox && s.viewBox.baseVal; if (!vb || !vb.width) return null;
  const k = s.getBoundingClientRect().width / vb.width, T = [...s.querySelectorAll('text')].filter(t => t.textContent.trim());
  const B = T.map(t => { let bb; try { bb = t.getBBox(); } catch (e) { return null; } return { t: t.textContent.trim().slice(0, 34), x: bb.x, y: bb.y, w: bb.width, h: bb.height, px: parseFloat(getComputedStyle(t).fontSize) * k }; }).filter(Boolean);
  const hors = B.filter(b => b.x < vb.x - 1 || b.x + b.w > vb.x + vb.width + 1 || b.y < vb.y - 1 || b.y + b.h > vb.y + vb.height + 1).map(b => b.t + ' [x ' + Math.round(b.x) + '→' + Math.round(b.x + b.w) + ' / ' + vb.width + ']');
  const chev = []; for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) { const a = B[i], c = B[j], ox = Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x), oy = Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y); if (ox > 2 && oy > 3) chev.push(a.t + ' ⟷ ' + c.t); }
  return { aria: (s.getAttribute('aria-label') || '').slice(0, 45), larg: Math.round(s.getBoundingClientRect().width), vb: vb.width + 'x' + vb.height, min: Math.round(10 * Math.min(...B.map(b => b.px))) / 10, petits: B.filter(b => b.px < 9).map(b => b.t + ' ' + b.px.toFixed(1)).slice(0, 5), hors, chev }; }).filter(Boolean)`;
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['Pixel 7'], viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 150))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 150)); });
  await p.addInitScript(() => { window.__PARCOURS_TEST__ = true; });
  await p.goto('http://localhost:4173/?sim=' + process.argv[2]); await p.waitForTimeout(900);
  await p.getByRole('button', { name: 'Parcours guidé', exact: true }).first().click(); await p.waitForTimeout(300);
  const vus = new Set();
  for (let k = 0; k < 16; k++) {
    const titre = await p.locator('[data-titre-etape]').first().innerText().catch(() => '?');
    const res = await p.evaluate(`(${MES})(document.body)`);
    for (const r of res) { const cle = r.aria + '|' + r.vb; if (vus.has(cle)) continue; vus.add(cle);
      console.log(`étape ${k + 1} « ${titre.slice(0, 40)} » svg ${r.vb} rendu ${r.larg}px | min ${r.min}px | <9px: ${r.petits.join(', ') || '-'} | hors cadre: ${r.hors.join(' ; ') || '-'} | chevauchements: ${r.chev.join(' ; ') || '-'}`); }
    if (k === 5) { // étape « snell » : la carte À retenir montre-t-elle la réponse ?
      const t = await p.locator('[data-carte-parcours]').first().innerText(); console.log('   >> étape', k + 1, '« ' + titre + ' » : "19,5" dans la carte ?', /19,5/.test(t), '| contient « ≈ 1,50 » ?', /1,50/.test(t)); }
    const nx = p.getByRole('button', { name: /Suivant/ }); if (!(await nx.count())) break; await nx.first().click(); await p.waitForTimeout(250);
  }
  // Explore : ateliers
  await p.goto('http://localhost:4173/?sim=' + process.argv[2]); await p.waitForTimeout(700);
  await p.getByRole('button', { name: /Explorer|Exploration/ }).first().click().catch(() => {}); await p.waitForTimeout(300);
  for (const at of ['Rayon et surface', 'Mesurer un indice', 'Le pêcheur']) { await p.getByRole('button', { name: new RegExp(at) }).first().click().catch(() => {}); await p.waitForTimeout(250);
    const res = await p.evaluate(`(${MES})(document.body)`); for (const r of res) console.log(`atelier ${at} svg ${r.vb} rendu ${r.larg}px | min ${r.min}px | <9px: ${r.petits.join(', ') || '-'} | hors cadre: ${r.hors.join(' ; ') || '-'} | chevauchements: ${r.chev.join(' ; ') || '-'}`); }
  console.log('erreurs console:', errs.join(' ; ') || 'aucune'); await b.close();
})();
