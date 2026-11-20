// Tests du modèle « tests chimiques » 2GT (sim 198) : node src/simulations/testsChimiques2gtModele.test.mjs
import * as M from './testsChimiques2gtModele.js';
let ko = 0;
const vrai = (nom, c) => { if (!c) { ko++; console.log(`✗ ${nom}`); } else console.log(`✓ ${nom}`); };

// NB est bien une espace insécable U+00A0
vrai('NB = U+00A0', M.NB === ' ' && M.NB.charCodeAt(0) === 160);
// chaque test est positif pour un seul des quatre gaz (hypothèse de spécificité) ; le diazote n'a aucun test positif
for (const t of M.TESTS_GAZ) vrai(`test ${t} : un seul gaz positif`, M.GAZ.filter(g => M.positifGaz(g, t)).length === 1);
vrai('diazote : aucun test positif', M.TESTS_GAZ.every(t => !M.positifGaz('n2', t)));
vrai('H₂ ↔ flamme, O₂ ↔ braise, CO₂ ↔ eau de chaux', M.positifGaz('h2', 'h2') && M.positifGaz('o2', 'o2') && M.positifGaz('co2', 'co2'));
vrai('observationGaz cohérente avec positifGaz', M.GAZ.every(g => M.TESTS_GAZ.every(t => M.observationGaz(g, t).positif === M.positifGaz(g, t) && M.observationGaz(g, t).texte.length > 5)));
// aucune observation d'un test positif n'apparaît chez un gaz négatif (texte)
vrai('« pop » seulement pour H₂', M.GAZ.every(g => /pop/.test(M.observationGaz(g, 'h2').texte) === (g === 'h2')));
vrai('« rallume » seulement pour O₂', M.GAZ.every(g => /rallume/.test(M.observationGaz(g, 'o2').texte) === (g === 'o2')));
vrai('« trouble » seulement pour CO₂', M.GAZ.every(g => /se trouble/.test(M.observationGaz(g, 'co2').texte) === (g === 'co2')));
// pas d'ions dans le contenu
vrai('aucun ion mentionné', !/\bions?\b|cation|anion|Cu²|Ca²/i.test(JSON.stringify([M.TESTS, M.SOURCES, M.OBSERVATIONS])));

// situations d'exploration : chaque situation a une observation (ou n/a) pour les 4 tests ; cohérence avec les espèces
for (const s of M.SOURCES) for (const t of M.ORDRE_TESTS) { const r = M.essai(s.id, t); vrai(`${s.id}/${t} défini`, r.applicable === !!s.obs[t] && (!r.applicable || (typeof r.positif === 'boolean' && r.texte && r.conclusion))); }
const pos = (s, t) => M.essai(s, t).positif;
vrai('acide + calcaire : seul CO₂ positif', pos('calcaire', 'co2') && !pos('calcaire', 'h2') && !pos('calcaire', 'o2') && !pos('calcaire', 'eau'));
vrai('acide + zinc : seul H₂ positif', pos('zinc', 'h2') && !pos('zinc', 'co2') && !pos('zinc', 'o2') && !pos('zinc', 'eau'));
vrai('eau oxygénée : seul O₂ positif', pos('eauO2', 'o2') && !pos('eauO2', 'co2') && !pos('eauO2', 'h2') && !pos('eauO2', 'eau'));
vrai('bougie : eau ET CO₂ positifs (mélange)', pos('bougie', 'eau') && pos('bougie', 'co2') && !pos('bougie', 'h2') && !pos('bougie', 'o2'));
vrai('air : O₂ et CO₂ négatifs (test négatif ≠ absence), avec nuance affichée', !pos('air', 'o2') && !pos('air', 'co2') && /un cinquième/.test(M.essai('air', 'o2').nuance) && M.essai('air', 'co2').nuance.length > 20);
vrai('diazote : tout négatif', M.ORDRE_TESTS.every(t => !pos('azote', t)));
vrai('éthanol absolu négatif, éthanol à 96 % positif (eau présente, pas pure)', !pos('ethanolAbsolu', 'eau') && pos('ethanol96', 'eau') && /pas de l’eau pure/.test(M.essai('ethanol96', 'eau').nuance));
vrai('liquides : tests de gaz non applicables', ['robinet', 'ethanolAbsolu', 'ethanol96'].every(s => ['h2', 'o2', 'co2'].every(t => !M.essai(s, t).applicable)));

// identification : restants, preuve, nombre de tests
const toutes = ['h2', 'o2', 'co2', 'n2'];
vrai('restants après pop', M.restants(toutes, [{ test: 'h2', positif: true }]).join() === 'h2');
vrai('restants après deux tests négatifs', M.restants(toutes, [{ test: 'h2', positif: false }, { test: 'o2', positif: false }]).join() === 'co2,n2');
vrai('prouvé après trois négatifs : N₂', M.prouve(toutes, [{ test: 'h2', positif: false }, { test: 'o2', positif: false }, { test: 'co2', positif: false }]));
vrai('testsNecessaires(n) = n − 1', [2, 3, 4].every(n => M.testsNecessaires(n) === n - 1));
// pour tout ensemble de candidats, tout gaz, tout ordre des tests : n − 1 tests suffisent (on s'arrête dès que le gaz est prouvé)
const ensembles = [['h2', 'o2', 'co2'], ['h2', 'o2', 'n2'], ['h2', 'co2', 'n2'], ['o2', 'co2', 'n2'], toutes];
const perms = a => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [x, ...p])));
let pire = {}, tous = true;
for (const c of ensembles) for (const g of c) for (const ordre of perms(M.TESTS_GAZ)) {
  let d = { candidats: c, gaz: g, obs: [] };
  for (const t of ordre) { if (M.prouve(c, d.obs)) break; d = M.faireTest(d, t); }
  if (!M.prouve(c, d.obs) || M.restants(c, d.obs)[0] !== g) tous = false;
  pire[c.length] = Math.max(pire[c.length] || 0, d.obs.length);
}
vrai('tout ordre des tests identifie le gaz', tous);
vrai('le pire cas dépasse n − 1 si on teste dans le mauvais ordre ? non : jamais plus de n − 1 quand les tests sont utiles', pire[3] <= 3 && pire[4] <= 3);
// ordre choisi avec tests utiles uniquement : n − 1 tests au plus
{
  let ok = true;
  for (const c of ensembles) for (const g of c) {
    const utiles = M.TESTS_GAZ.filter(t => c.some(x => M.TESTS[t].cible === x));
    let d = { candidats: c, gaz: g, obs: [] };
    for (const t of utiles) { if (M.prouve(c, d.obs)) break; d = M.faireTest(d, t); }
    if (!M.prouve(c, d.obs) || d.obs.length > M.testsNecessaires(c.length)) ok = false;
  }
  vrai('en ne faisant que des tests utiles : au plus n − 1 tests', ok);
}
// arbre de décision
vrai('arbre correct (O₂ puis CO₂)', M.verifierArbre({ t2: 'o2', g2: 'o2', t3: 'co2', g3: 'co2', gf: 'n2' }).ok);
vrai('arbre correct (CO₂ puis O₂)', M.verifierArbre({ t2: 'co2', g2: 'co2', t3: 'o2', g3: 'o2', gf: 'n2' }).ok);
vrai('arbre : gaz incohérent refusé', !M.verifierArbre({ t2: 'o2', g2: 'co2', t3: 'co2', g3: 'co2', gf: 'n2' }).ok);
vrai('arbre : deux fois le même test refusé', !M.verifierArbre({ t2: 'o2', g2: 'o2', t3: 'o2', g3: 'o2', gf: 'n2' }).ok);
vrai('arbre : gaz final autre que N₂ refusé', !M.verifierArbre({ t2: 'o2', g2: 'o2', t3: 'co2', g3: 'co2', gf: 'h2' }).ok);
vrai('arbre : cases vides refusées', !M.verifierArbre({ t2: '', g2: '', t3: '', g3: '', gf: '' }).ok);

// défi 1 : 20 000 tirages
let n = 0, okTirage = true, juges = 0;
for (let i = 0; i < 20000; i++) {
  const d = M.tirerDefiGaz();
  if (!d.candidats.includes(d.gaz) || d.budget !== d.candidats.length - 1 || d.budget < 2) { okTirage = false; break; }
  // stratégie raisonnable : tests utiles seulement
  let x = { ...d };
  for (const t of M.TESTS_GAZ.filter(t => d.candidats.some(c => M.TESTS[t].cible === c))) { if (M.prouve(d.candidats, x.obs)) break; x = M.faireTest(x, t); }
  const rest = M.restants(d.candidats, x.obs);
  x.conclusion = rest[0];
  const j = M.jugerDefiGaz(x);
  if (!j.ok) { okTirage = false; console.log('stratégie utile refusée', d, x.obs); break; }
  // conclusion juste sans aucun test : refusée (non prouvée)
  const y = { ...d, obs: [], conclusion: d.gaz };
  if (M.jugerDefiGaz(y).ok) { okTirage = false; console.log('conclusion sans test acceptée'); break; }
  // mauvaise conclusion refusée
  const z = { ...x, conclusion: d.candidats.find(c => c !== d.gaz) };
  if (M.jugerDefiGaz(z).ok) { okTirage = false; console.log('mauvaise conclusion acceptée'); break; }
  // trop de tests refusé (test hors budget)
  if (x.obs.length <= d.budget) { const w = { ...x }; w.obs = [...x.obs, ...M.TESTS_GAZ.map(t => ({ test: t, positif: M.positifGaz(d.gaz, t) }))].slice(0, d.budget + 1); if (M.jugerDefiGaz(w).ok) { okTirage = false; console.log('hors budget accepté'); break; } }
  juges++; n++;
}
vrai(`défi 1 : ${juges} tirages contrôlés`, okTirage && juges === 20000);
// défi 2 : toutes les observations
for (const o of M.OBSERVATIONS) {
  const L = [o.bonne, ...o.faux].map(s => s.length);
  vrai(`défi 2 ${o.id} : 3 pièges distincts, bonne réponse jamais la plus longue`, new Set([o.bonne, ...o.faux]).size === 4 && L[0] < Math.max(...L) && o.indice && o.expl);
}
vrai('défi 2 : tirage sans répétition', (() => { const a = M.tirerObservation(); for (let i = 0; i < 200; i++) { const b = M.tirerObservation(a); if (b.id === a.id || b.options.length !== 4 || !b.options.includes(b.bonne)) return false; } return true; })());
// la bonne réponse n'est pas toujours à la même place dans les options mélangées
vrai('options mélangées', (() => { const pos = new Set(); for (let i = 0; i < 400; i++) { const o = M.tirerObservation(); pos.add(o.options.indexOf(o.bonne)); } return pos.size === 4; })());
console.log(ko ? `${ko} échec(s)` : 'Tout est correct');
process.exit(ko ? 1 : 0);
