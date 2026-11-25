import * as M from './milieuxDispersesModele.js';
let n = 0, bad = 0;
const ok = (c, m) => { n++; if (!c) { bad++; if (bad <= 15) console.log('ÉCHEC :', m); } };
ok(Object.keys(M.TYPES).length === 8, '8 cases remplies sur 9');
ok(M.typeDe('gaz', 'gaz') === null, 'gaz dans gaz : pas de milieu dispersé');
for (const a of M.ETATS) for (const b of M.ETATS) if (!(a.id === 'gaz' && b.id === 'gaz')) ok(!!M.typeDe(a.id, b.id), `case ${a.id}>${b.id}`);
for (const t of Object.values(M.TYPES)) { ok(M.NOMS_TYPES.includes(t), `type connu ${t}`); ok(!!M.INSTAB[t], `instabilité de ${t}`); }
for (const t of M.NOMS_TYPES) ok(Object.values(M.TYPES).includes(t), `type utilisé ${t}`);
const ids = new Set();
for (const p of M.PRODUITS) { ok(!ids.has(p.id), `id unique ${p.id}`); ids.add(p.id); ok(!!M.typeDe(p.disp, p.cont), `produit ${p.id} typé`); ok(M.produit(p.id) === p, 'recherche'); }
// chaque type utilisé par au moins un produit, sauf aucun manquant
for (const t of M.NOMS_TYPES) ok(M.PRODUITS.some(p => M.typeDe(p.disp, p.cont) === t), `un exemple de ${t}`);
// cas du défi : problème ↔ cause cohérents, chaque problème présent deux fois
for (const k of Object.keys(M.PROBLEMES)) { ok(M.SITUATIONS.filter(s => s.pb === k).length >= 2, `2 situations pour ${k}`); ok(!!M.CAUSES[M.CAUSE_DE[k]], `cause de ${k}`); }
for (let i = 0; i < 2000; i++) {
  const s = M.tirageDiagnostic(); ok(M.verifieDiagnostic(s, s.pb, s.cause), 'diagnostic juste accepté');
  const autre = Object.keys(M.PROBLEMES).find(k => k !== s.pb); ok(!M.verifieDiagnostic(s, autre, s.cause), 'mauvais problème refusé');
  const p = M.tirageClasser(); ok(M.verifieClasser(p, p.disp, p.cont, M.typeDe(p.disp, p.cont)), 'classement juste accepté');
  if (p.disp !== p.cont) ok(!M.verifieClasser(p, p.cont, p.disp, M.typeDe(p.cont, p.disp)), 'phases inversées refusées');
}
console.log(bad ? `${bad} échec(s) sur ${n}` : `${n} vérifications OK`);
process.exit(bad ? 1 : 0);
