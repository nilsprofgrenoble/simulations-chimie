// Contrôle automatique des schémas des cartes « À retenir » sur téléphone (390 px) : texte trop petit (< 9 px rendus) ou qui déborde du schéma.
// Usage : (serveur de prévisualisation sur le port 4173)  node scripts/controle-fiches.cjs [id ...]   (sans argument : toutes les simulations ayant des cartes)
// Parcourt le parcours guidé étape par étape (window.__PARCOURS_TEST__ débloque « Suivant ») et mesure chaque schéma affiché dans la carte du parcours.
// Écrit le résultat dans fiches-controle.json (au dossier courant) : { id: { min, petits, debordent, schemas } }.
const { chromium } = require('playwright');
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/../src/simsAvecCartes.js', 'utf8');
const tous = src.split('new Set([')[1].split('])')[0].split(',').map(x => x.trim()).filter(Boolean);
const ids = process.argv.slice(2).length ? process.argv.slice(2) : tous;
const BASE = process.env.BASE || 'http://localhost:4173/';
const SEUIL = 9;
(async () => {
  const b = await chromium.launch(); const res = {};
  for (const id of ids) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
    await p.addInitScript(() => { window.__PARCOURS_TEST__ = true; });
    const r = { min: 99, petits: 0, debordent: 0, schemas: 0, vus: {} };
    try {
      await p.goto(BASE + '?sim=' + id, { timeout: 20000 }); await p.waitForTimeout(800);
      const guide = p.getByRole('button', { name: 'Parcours guidé', exact: true });
      if (await guide.count()) { await guide.first().click({ timeout: 3000 }); await p.waitForTimeout(300); }
      const boutons = await p.locator('button').evaluateAll(bs => bs.map(x => x.innerText.trim()).filter(t => /^[1-9]\. /.test(t)));
      for (const nom of (boutons.length ? boutons : [null])) {
        if (nom) { await p.getByRole('button', { name: nom, exact: true }).first().click({ timeout: 3000 }); await p.waitForTimeout(300); const rev = p.getByText('revenir au début'); if (await rev.count()) { await rev.first().click(); await p.waitForTimeout(200); } }
        for (let k = 0; k < 90; k++) {
          const carte = p.locator('[data-carte-parcours]').first();
          if (!(await carte.count())) break;
          const m = await carte.evaluate(c => [...c.querySelectorAll('svg')].map(s => {
            const vb = s.viewBox && s.viewBox.baseVal; if (!vb || !vb.width) return null;
            const k2 = s.getBoundingClientRect().width / vb.width, txt = [...s.querySelectorAll('text')].filter(t => t.textContent.trim());
            const tailles = txt.map(t => ({ t: t.textContent.trim().slice(0, 24), px: parseFloat(getComputedStyle(t).fontSize) * k2 }));
            let deb = 0; txt.forEach(t => { if (t.getAttribute('transform')) return; try { const bb = t.getBBox(); if (bb.x < vb.x - 1 || bb.x + bb.width > vb.x + vb.width + 1 || bb.y < vb.y - 1 || bb.y + bb.height > vb.y + vb.height + 1) deb++; } catch (e) {} });
            return { cle: (s.getAttribute('aria-label') || '').slice(0, 40), larg: Math.round(s.getBoundingClientRect().width), tailles, deb };
          }).filter(Boolean));
          for (const s of m) {
            if (r.vus[s.cle]) continue; r.vus[s.cle] = 1; r.schemas++;
            for (const t of s.tailles) { r.min = Math.min(r.min, t.px); if (t.px < SEUIL) r.petits++; }
            r.debordent += s.deb;
          }
          const suiv = p.getByRole('button', { name: /Suivant/ });
          if (!(await suiv.count()) || (await suiv.first().isDisabled())) break;
          await suiv.first().click().catch(() => {}); await p.waitForTimeout(120);
        }
      }
    } catch (e) { r.erreur = String(e).slice(0, 100); }
    delete r.vus; r.min = +r.min.toFixed(1); res[id] = r;
    console.log(id, JSON.stringify(r));
    await ctx.close();
  }
  fs.writeFileSync('fiches-controle.json', JSON.stringify(res, null, 1));
  await b.close();
})();
