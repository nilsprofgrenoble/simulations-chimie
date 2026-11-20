// Contrôle du tracé des flèches courbes de la simulation 186 (souris 1280 px et toucher 390 px) :
//   NODE_PATH=/tmp/pwmod/node_modules BASE=http://localhost:5353/ node scripts/controle-mrx-anneaux.cjs
// Pour chaque acte de chaque mécanisme (obtenus par tirages successifs du défi « Tracer les flèches ») : on touche le centre de CHAQUE anneau de départ
// (le départ choisi doit apparaître à cet endroit), puis le centre de CHAQUE anneau d'arrivée (une flèche doit se tracer et sa pointe doit être sur l'atome touché).
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:4173/';
const ATTENDUS = 5;   // substitution (Br, Cl) et les trois actes de l'hydratation
(async () => {
  const br = await chromium.launch(); let problemes = 0;
  for (const cfg of [{ nom: 'souris 1280 px', w: 1280, h: 900, touch: false }, { nom: 'toucher 390 px', w: 390, h: 844, touch: true }]) {
    const ctx = await br.newContext({ viewport: { width: cfg.w, height: cfg.h }, hasTouch: cfg.touch, isMobile: cfg.touch });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 150)));
    await p.goto(BASE + '?sim=186'); await p.waitForTimeout(900);
    await p.getByRole('button', { name: 'Défi', exact: true }).first().click(); await p.waitForTimeout(300);
    await p.getByRole('button', { name: 'Tracer les flèches' }).first().click(); await p.waitForTimeout(300);
    const tap = async (x, y) => { if (cfg.touch) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await p.waitForTimeout(15); };
    const cliqueSiActif = async nom => { const b = p.getByRole('button', { name: nom }).first(); if (await b.isEnabled()) await b.click(); };
    const vus = new Set(); let anneaux = 0;
    for (let tirage = 0; tirage < 150 && vus.size < ATTENDUS; tirage++) {
      const svgs = p.locator('svg[role="img"][aria-label^="Schéma de l’acte"]'), n = await svgs.count();
      for (let i = 0; i < n; i++) {
        const svg = svgs.nth(i); await svg.evaluate(s => s.scrollIntoView({ block: 'center' })); await p.waitForTimeout(80);
        const eq = (await svg.evaluate(s => { let e = s.parentElement; while (e && !/Trace les flèches courbes de l’acte/.test(e.innerText)) e = e.parentElement; const m = e && e.innerText.match(/de l’acte : ([^\n]*)/); return m ? m[1] : '?'; }));
        if (vus.has(eq)) continue; vus.add(eq); if (process.env.DEBUG) console.log('  acte', eq);
        const centres = async sel => svg.evaluate((s, q) => [...s.querySelectorAll(q)].map(c => { const r = c.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }), sel);
        const RING = 'circle[stroke-dasharray="3 3"]', SEL = 'circle[stroke="#f59e0b"]';
        const dep = await centres(RING); if (dep.length < 3) { console.log(`PROBLÈME ${cfg.nom} « ${eq} » : ${dep.length} anneaux de départ`); problemes++; continue; }
        for (const [x, y] of dep) {
          await tap(x, y); const sel = await centres(SEL); anneaux++;
          if (sel.length !== 1 || Math.hypot(sel[0][0] - x, sel[0][1] - y) > 4) { console.log(`PROBLÈME ${cfg.nom} « ${eq} » : départ touché en (${x.toFixed(0)}, ${y.toFixed(0)}) mais sélection ${JSON.stringify(sel)}`); problemes++; }
          await tap(x, y);   // second toucher : désélection
        }
        // arrivées : on part d'un doublet puis on touche chaque atome
        await tap(dep[0][0], dep[0][1]);
        const arr = await centres(RING);   // en mode « arrivée », seuls les atomes sont cerclés
        let premier = true;
        for (const [x, y] of arr) {
          if (!premier) await tap(dep[0][0], dep[0][1]);   // (re)choisir le départ ; la première fois il est déjà choisi
          premier = false;
          const avant = await svg.locator('polygon').count(); await tap(x, y); anneaux++;
          const info = await svg.evaluate(s => { const pg = [...s.querySelectorAll('polygon')].pop(); if (!pg) return null; const [px, py] = pg.getAttribute('points').split(' ')[0].split(',').map(Number); const m = s.getScreenCTM(); return [m.a * px + m.e, m.d * py + m.f]; });
          const apres = await svg.locator('polygon').count();
          if (apres !== avant + 1 || !info || Math.hypot(info[0] - x, info[1] - y) > 32) { console.log(`PROBLÈME ${cfg.nom} « ${eq} » : arrivée touchée en (${x.toFixed(0)}, ${y.toFixed(0)}), flèches ${avant}→${apres}, pointe ${JSON.stringify(info)}`); problemes++; }
          await cliqueSiActif(/Annuler la dernière flèche/);
        }
        await cliqueSiActif(/Tout effacer/);
      }
      await p.getByRole('button', { name: /Nouveaux actes/ }).click(); await p.waitForTimeout(80);
    }
    if (vus.size < ATTENDUS) { console.log(`PROBLÈME ${cfg.nom} : seulement ${vus.size} actes différents rencontrés`); problemes++; }
    if (errs.length) { console.log(`PROBLÈME ${cfg.nom} : erreur JS ${errs[0]}`); problemes++; }
    console.log(`${cfg.nom} : ${vus.size} actes, ${anneaux} anneaux touchés`);
    await ctx.close();
  }
  await br.close(); console.log(`problèmes ${problemes}`); process.exitCode = problemes ? 1 : 0;
})();
