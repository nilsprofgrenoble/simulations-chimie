// Contrôle automatique des parcours guidés : rejoue chaque étape avec la bonne réponse et vérifie qu'elle est acceptée.
// Usage : (serveur de prévisualisation sur le port 4173)  node scripts/controle-parcours.cjs [id ...]
// Étapes couvertes : QCM (bonne réponse repérée par data-ok), numériques (data-vrai), actions avec bouton « faire ».
// Étapes « manuelles » (curseurs, saisies libres sans bouton) : signalées, non testées.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const tous = fs.readFileSync(__dirname + '/../public/catalogue.csv', 'utf8').split('\n').map(l => l.split(';')).filter(r => r[0] === 'simulation').map(r => r[1].replace('sim', ''));
const ids = process.argv.slice(2).length ? process.argv.slice(2) : tous;
const BASE = process.env.BASE || 'http://localhost:4173/';
(async () => {
  const b = await chromium.launch(); let problemes = 0, manuelles = 0, etapes = 0, parcoursTotal = 0;
  for (const id of ids) {
    const ctx = await b.newContext({ ...devices['Pixel 7'] }); const p = await ctx.newPage();
    await p.addInitScript(() => { window.__PARCOURS_TEST__ = true; });
    const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 120)));
    try {
      await p.goto(BASE + '?sim=' + id, { timeout: 20000 }); await p.waitForTimeout(900);
      const guide = p.getByRole('button', { name: 'Parcours guidé', exact: true });
      if (!(await guide.count())) continue;
      await guide.first().click({ timeout: 3000 }); await p.waitForTimeout(300);
      const boutonsParc = await p.locator('button').evaluateAll(bs => bs.map(x => x.innerText.trim()).filter(t => /^[1-9]\. /.test(t)));
      const liste = boutonsParc.length ? boutonsParc : [null];
      for (const nom of liste) {
        parcoursTotal++;
        if (nom) { await p.getByRole('button', { name: nom, exact: true }).first().click({ timeout: 3000 }); await p.waitForTimeout(300);
          const rev = p.getByText('revenir au début'); if (await rev.count()) { await rev.first().click(); await p.waitForTimeout(200); } }
        for (let k = 0; k < 80; k++) {
          const carte = p.locator('[data-carte-parcours]').first();
          if (!(await carte.count())) { console.log(`PROBLÈME sim ${id} ${nom || ''} : carte du parcours absente (étape ${k})`); problemes++; break; }
          const type = await carte.getAttribute('data-type-tache');
          const titre = ((await carte.locator('[data-titre-etape]').first().innerText().catch(() => '')) || '').slice(0, 60);
          let resultat = 'ok';
          etapes++;
          if (type === 'qcm') {
            await carte.locator('button[data-ok="true"]').first().click({ timeout: 3000 });
            const vb = carte.getByRole('button', { name: /Vérifier/ }).first(); if (await vb.count()) await vb.click({ timeout: 3000 });
            await p.waitForTimeout(120);
            if (!(await carte.getByText('Bravo').count()) && !(await carte.getByText('déjà réussie').count())) resultat = (await vb.count()) ? 'QCM : bonne réponse non acceptée' : 'manuelle';
          } else if (type === 'num') {
            const inp = carte.locator('input[aria-label="Votre réponse"]');
            if (!(await inp.count())) resultat = 'manuelle';
            else {
              const v = await inp.getAttribute('data-vrai');
              if (v === null || v === '') resultat = 'numérique sans valeur attendue';
              else {
                await inp.fill(String(Number(v))); const vb = carte.getByRole('button', { name: /Vérifier/ }).first(); if (await vb.count()) await vb.click({ timeout: 3000 }); await p.waitForTimeout(120);
                if (!(await carte.getByText('Bravo').count()) && !(await carte.getByText('Valeur juste').count())) resultat = `numérique : valeur attendue ${v} non acceptée`;
              }
            }
          } else if (type === 'action') {
            const f = carte.locator('button[data-faire="1"]');
            if (await f.count()) { await f.first().click({ timeout: 3000 }).catch(() => {}); await p.waitForTimeout(500); }
            if (!(await carte.getByText('C\'est fait').count())) resultat = 'manuelle';
          }
          if (resultat === 'manuelle') manuelles++;
          else if (resultat !== 'ok') { problemes++; console.log(`PROBLÈME sim ${id} ${nom || ''} étape ${k + 1} « ${titre} » : ${resultat}`); }
          const suiv = p.getByRole('button', { name: /Suivant/ });
          if (!(await suiv.count())) break;
          if (await suiv.first().isDisabled()) { problemes++; console.log(`PROBLÈME sim ${id} ${nom || ''} étape ${k + 1} « ${titre} » : bloquée (${resultat})`); break; }
          if (resultat === 'manuelle') console.log(`manuelle sim ${id} ${nom || ''} étape ${k + 1} « ${titre} »`);
          await suiv.first().click();
          await p.waitForTimeout(150);
        }
      }
    } catch (e) { problemes++; console.log(`PROBLÈME sim ${id} : ${String(e).slice(0, 150)}`); }
    if (errs.length) { problemes++; console.log(`PROBLÈME sim ${id} : erreurs JS ${errs[0]}`); }
    await ctx.close();
  }
  console.log(`parcours ${parcoursTotal}, étapes jouées ${etapes}, problèmes ${problemes}, étapes manuelles non testées ${manuelles}`);
  await b.close();
})();
