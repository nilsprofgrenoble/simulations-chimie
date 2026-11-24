import assert from 'node:assert/strict';
import * as M from './chargeTensioactifsModele.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const pr = (a, b, t = 1e-9) => Math.abs(a - b) <= t;

// Henderson–Hasselbalch : à pH = pKa, moitié ionisée ; ±1 unité → 91 % / 9 %
ok(pr(M.fracIonisee(7.5, 7.5), 0.5) && pr(M.fracProtonee(10, 10), 0.5));
ok(pr(M.fracIonisee(7.5, 8.5), 10 / 11) && pr(M.fracIonisee(7.5, 6.5), 1 / 11));
ok(pr(M.fracProtonee(10, 9), 10 / 11) && pr(M.fracProtonee(10, 11), 1 / 11));

// familles déduites de la structure = familles annoncées
for (const e of M.ESPECES) ok(M.familleDeduite(e) === e.famille, `${e.id} : ${M.familleDeduite(e)} ≠ ${e.famille}`);

// ioniques « forts » : charge fixe, jamais les deux sortes
for (const pH of [0, 3, 7, 11, 14]) {
  const s = M.charges(M.espece('sds'), pH), c = M.charges(M.espece('ctab'), pH);
  ok(pr(s.nMoins, 1) && pr(s.nPlus, 0) && pr(s.nette, -1), 'SDS ' + pH);
  ok(pr(c.nPlus, 1) && pr(c.nMoins, 0) && pr(c.nette, 1), 'CTAB ' + pH);
}
// ioniques « faibles » : perdent leur charge sans jamais changer de signe ni porter les deux
const sav = M.espece('savon'), ami = M.espece('amine');
ok(M.charges(sav, 4).nette > -0.01 && M.charges(sav, 11).nette < -0.99, 'savon');
ok(M.charges(ami, 4).nette > 0.99 && M.charges(ami, 13).nette < 0.01, 'amine');
for (const e of [sav, ami]) { const b = M.bilan(e); ok(!b.deux, e.id + ' : une seule sorte de charge'); ok(!(b.nettePlus && b.netteMoins), e.id + ' : ne change pas de signe'); ok(M.plageDeuxCharges(e) === null); }

// bétaïne : N⁺ permanent ; jamais de charge nette négative ; zwitterion (deux charges) au milieu
const bet = M.espece('betaine'), bb = M.bilan(bet);
ok(bb.deux && !bb.netteMoins && bb.nettePlus && bb.zero, 'bétaïne');
ok(pr(M.charges(bet, 7).nPlus, 1, 1e-4) && M.charges(bet, 7).nMoins > 0.999 && Math.abs(M.charges(bet, 7).nette) < 1e-3, 'bétaïne pH 7 : deux charges, net nul');
ok(M.charges(bet, 0.5).nette > 0.5 && M.charges(bet, 14).nette > -0.001, 'bétaïne : + en milieu très acide, jamais −');
// amphotère à amine : + puis 0 puis −, deux charges au milieu
const ala = M.espece('alanine'), ab = M.bilan(ala);
ok(ab.nettePlus && ab.netteMoins && ab.zero && ab.deux, 'alkylaminopropionate');
ok(M.charges(ala, 1).nette > 0.9 && M.charges(ala, 12).nette < -0.9, 'signes aux extrêmes');
ok(M.charges(ala, 6.5).nPlus > 0.99 && M.charges(ala, 6.5).nMoins > 0.99 && Math.abs(M.charges(ala, 6.5).nette) < 0.01, 'zwitterion au milieu');
ok(pr(M.pointIsoelectrique(ala), 6.5) && Math.abs(M.charges(ala, M.pointIsoelectrique(ala)).nette) < 0.01, 'point isoélectrique = charge nette nulle');
ok(M.pointIsoelectrique(bet) === null, 'pas de point isoélectrique unique pour la bétaïne');
const pl = M.plageDeuxCharges(ala); ok(pl && pl[0] < 6.5 && pl[1] > 6.5, 'plage des deux charges autour du point isoélectrique');
// non ioniques : aucune charge à aucun pH
for (const id of ['age', 'sorbitane']) { const e = M.espece(id), b = M.bilan(e); ok(!b.sPlus && !b.sMoins && M.charges(e, 7).nette === 0, id); }
// SEUIL de coexistence : le savon et l'amine ne l'atteignent jamais
ok(M.ESPECES.filter(e => M.plageDeuxCharges(e)).map(e => e.id).join() === 'betaine,alanine', 'seuls les amphotères portent deux sortes de charges');
// pas de pKa écrit en dur côté interface : tous les pKa sont dans ESPECES
for (const e of M.ESPECES) for (const g of e.groupes) ok(g.type === 'fixe' ? Math.abs(g.q) === 1 : g.pKa > 0 && g.pKa < 14 && g.formes.length === 2, e.id);

// gouttes : le savon protège à pH 9 (charge forte), pas à pH 5 ; SDS, CTAB et les non ioniques : indépendants du pH pour les ioniques forts
ok(M.etatGouttes(sav, 9).repulsion === 'forte' && M.etatGouttes(sav, 5).repulsion === 'nulle', 'gouttes savon');
ok(M.etatGouttes(M.espece('sds'), 2).repulsion === 'forte' && M.etatGouttes(M.espece('age'), 7).repulsion === 'nulle');
ok(M.etatGouttes(ala, 6.5).repulsion === 'nulle' && M.etatGouttes(ala, 2).repulsion === 'forte', 'amphotère : fragile à son point isoélectrique');

// défi « famille » : sur 5000 tirages, la famille annoncée = la famille déduite, et la courbe est lisible (pKa dans 1,5–11)
for (let k = 0; k < 5000; k++) { const t = M.tirageFamille(); ok(M.familleDeduite(t.e) === t.famille); for (const g of t.e.groupes) if (g.type !== 'fixe') ok(g.pKa >= 1.5 && g.pKa <= 11); }
// défi « fraction ionisée » : valeurs 2 chiffres significatifs, tolérance 5 % tenue même avec une valeur intermédiaire arrondie à 2 chiffres
const s2 = v => Number(Number(v).toPrecision(2));
let pire = 0, pireNeg = 1;
for (const pKa of [6.5, 7, 7.5, 8, 8.5]) for (const d of [-1.5, -1, -0.5, 0.5, 1, 1.5, 2]) {
  const pH = pKa + d, vrai = M.fracIonisee(pKa, pH), x = s2(Math.pow(10, pKa - pH)), alpha = 1 / (1 + x);
  pire = Math.max(pire, Math.abs(alpha - vrai) / vrai); pireNeg = Math.min(pireNeg, vrai);
  ok(Math.abs(s2(alpha) - vrai) / vrai < 0.06, `fraction ${pKa} ${pH}`);
}
console.log('fraction ionisée : écart relatif max avec valeur intermédiaire arrondie à 2 chiffres =', (100 * pire).toFixed(2), '% ; plus petite valeur', pireNeg.toFixed(4));
ok(pire < 0.05, 'tolérance 5 % suffisante');
for (let k = 0; k < 2000; k++) { const t = M.tirageFraction(); ok(t.vrai > 0.025 && t.vrai < 0.995 && Math.abs(t.pH * 2 - Math.round(t.pH * 2)) < 1e-9, 'tirage fraction'); }
// défi « point isoélectrique » : demi-somme exacte en dixièmes
for (let k = 0; k < 200; k++) { const t = M.tirageIso(); ok(pr(t.vrai * 4, Math.round(t.vrai * 4)), 'demi-somme ' + t.vrai); }
console.log(n, 'vérifications OK');
