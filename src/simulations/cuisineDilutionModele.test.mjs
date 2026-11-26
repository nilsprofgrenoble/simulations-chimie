// Test : node src/simulations/cuisineDilutionModele.test.mjs — loi de dilution, commandes réalisables, retours pédagogiques de « Service en cuisine »
import assert from 'node:assert';
import * as M from './cuisineDilutionModele.js';

// 1. Loi de dilution C × p = C' × f
const r = M.realiser(1, [{ p: 5, f: 100 }]);
assert(r.ok && Math.abs(r.C - 0.05) < 1e-12 && r.V === 100, '1,0 mol/L, 5 mL dans 100 mL → 0,050 mol/L');
const r2 = M.realiser(1, [{ p: 10, f: 100 }, { p: 10, f: 100 }]);
assert(Math.abs(r2.C - 0.01) < 1e-12, 'deux dilutions au 1/10e successives : F = 10 × 10 = 100');
assert(M.realiser(1, [{ p: 25, f: 20 }]).erreur === 'pipette-trop-grande');
// le facteur de dilution F = C0/C = f/p pour une étape
for (const p of M.PIPETTES) for (const f of M.FIOLES) if (p < f) { const x = M.realiser(2, [{ p, f }]); assert(Math.abs(2 / x.C - f / p) < 1e-9, `F = f/p pour ${p} dans ${f}`); }

// 2. Chaque service : commandes réalisables, bon nombre, sans doublon ; service 3 jamais réalisable en une étape
for (const S of M.SERVICES) for (const graine of [1, 2, 3, 42, 777]) {
  const cmds = M.commandesDuService(S, graine);
  assert(cmds.length === S.nb, `service ${S.id} : ${cmds.length} commandes au lieu de ${S.nb}`);
  const vues = new Set();
  for (const c of cmds) {
    assert(c.Ct < c.C0 && M.FIOLES.includes(c.Vt), 'commande valide');
    assert(M.solutions(c, S.etapesMax).length > 0, `service ${S.id}, commande ${JSON.stringify(c)} irréalisable`);
    if (S.etapesMax === 2) assert(M.solutions(c, 1).length === 0, `service 3 : commande réalisable en une étape ${JSON.stringify(c)}`);
    const clef = `${c.C0}|${c.Ct}|${c.Vt}`; assert(!vues.has(clef), 'doublon'); vues.add(clef);
  }
  assert(JSON.stringify(cmds) === JSON.stringify(M.commandesDuService(S, graine)), 'reproductible');
}

// 3. Retours pédagogiques
const cmd = { C0: 1, Ct: 0.05, Vt: 100 };
assert(M.retour(cmd, [{ p: 5, f: 100 }]).juste, 'bonne réponse');
assert(M.retour(cmd, [{ p: 10, f: 100 }]).texte.includes('trop concentrée'), '10 mL au lieu de 5 : trop concentrée');
assert(M.retour(cmd, [{ p: 2, f: 100 }]).texte.includes('trop diluée'), '2 mL au lieu de 5 : trop diluée');
assert(M.retour(cmd, [{ p: 5, f: 200 }]).texte.includes('100 mL'), 'mauvais volume de fiole');
assert(M.correction(cmd, 1)[0].p === 5, 'correction');
assert(M.fmtC(1) === '1,0' && M.fmtC(0.05) === '0,050' && M.fmtC(0.0005) === '0,00050', 'chiffres significatifs');

// 4. Températures et étoiles : cohérentes avec le temps restant
assert(M.temperature(240, 240) === 35 && M.temperature(0, 240) === 180 && M.temperature(120, 240) === 108, 'température : 35 °C au départ, 180 °C à l\'explosion');
assert(M.temperature(999, 240) === 35 && M.temperature(-5, 240) === 180, 'bornes');
assert(M.etoilesMission(120, 240) === 3 && M.etoilesMission(60, 240) === 2 && M.etoilesMission(10, 240) === 1, 'étoiles selon le temps restant');
// chaque mission est faisable dans le temps imparti par un joueur qui met 25 s par étape de calcul (marge ≥ 30 %)
for (const S of M.SERVICES) assert(S.temps + S.nb * M.BONUS_REUSSITE > 1.3 * S.nb * 25 * S.etapesMax, `mission ${S.id} : temps trop court`);
// tous les services sont jouables par un « expert » : il réussit toutes les commandes du premier coup
for (const S of M.SERVICES) for (const c of M.commandesDuService(S, 5)) assert(M.retour(c, M.correction(c, S.etapesMax)).juste, 'correction juste');
console.log('OK');
