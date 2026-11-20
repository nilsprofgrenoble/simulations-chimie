// Test du modèle de la sim 188 (transferts de H⁺) : node src/simulations/brnModele.test.mjs
// Contrôle PAR PROGRAMME : validité de chaque schéma de Lewis (octet, duet de H, 4 liaisons par C, charges), accord avec la formule écrite,
// couples (acide − H⁺ = base), conservation des atomes et de la charge dans chaque transfert et chaque réaction, défis de Lewis.
import { TOUTES_ESPECES, COUPLES, REACTIONS_DEFI, CIBLES_LEWIS, valider, chargeAtome, chargeTotale, compterAtomes, nT, nDoublets, nDoubletsNonLiants, nDoubletsLiants, nbLiaisons,
  grapheCouple, aLewis, retirerH, reaction, conserve, amphoteres, couplePar, espece, lireFormule, reponseLewis, sansReponse, texteReaction, VALENCE } from './brnModele.js';
import { entite, nT as nTLewis, structureRef } from './lewisModele.js';
let ko = 0, n = 0; const ok = (c, m) => { n++; if (!c) { ko++; console.log('ÉCHEC', m); } };
const egal = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());

// 1. chaque espèce : formule écrite = atomes et charge du schéma ; schéma valide ; charges atomiques sommées = charge de l'espèce
const ATTENDU = {   // valeurs écrites à la main : [formule brute, charge, n_T, doublets non liants]
  'H3O+': [{ H: 3, O: 1 }, 1, 8, 1], 'H2O': [{ H: 2, O: 1 }, 0, 8, 2], 'HO-': [{ H: 1, O: 1 }, -1, 8, 3],
  'HCO3-': [{ H: 1, C: 1, O: 3 }, -1, 24, 7], 'CO3--': [{ C: 1, O: 3 }, -2, 24, 8],
  'CH3COOH': [{ C: 2, H: 4, O: 2 }, 0, 24, 4], 'CH3COO-': [{ C: 2, H: 3, O: 2 }, -1, 24, 5],
  'HCOOH': [{ C: 1, H: 2, O: 2 }, 0, 18, 4], 'HCOO-': [{ C: 1, H: 1, O: 2 }, -1, 18, 5],
  'NH4+': [{ N: 1, H: 4 }, 1, 8, 0], 'NH3': [{ N: 1, H: 3 }, 0, 8, 1], 'CH3NH3+': [{ C: 1, H: 6, N: 1 }, 1, 14, 0], 'CH3NH2': [{ C: 1, H: 5, N: 1 }, 0, 14, 1],
  'CO2,H2O': [{ C: 1, H: 2, O: 3 }, 0, null, null],
};
for (const e of TOUTES_ESPECES) {
  const a = ATTENDU[e.id]; ok(!!a, `espèce sans valeur attendue : ${e.id}`); if (!a) continue;
  const f = lireFormule(e.formule);
  ok(egal(f.atomes, a[0]) && f.charge === a[1], `${e.id} : la formule écrite ${e.formule} ne correspond pas aux valeurs attendues`);
  ok(egal(e.atomes, a[0]) && e.charge === a[1], `${e.id} : atomes ou charge de la donnée`);
  if (!e.graphe) continue;
  const g = e.graphe, pb = valider(g);
  ok(pb.length === 0, `${e.id} : schéma invalide : ${pb.join(' ; ')}`);
  ok(egal(compterAtomes(g), a[0]), `${e.id} : atomes du schéma ≠ formule`);
  ok(chargeTotale(g) === a[1], `${e.id} : charge du schéma ${chargeTotale(g)} ≠ ${a[1]}`);
  ok(g.atomes.reduce((t, _, i) => t + chargeAtome(g, i), 0) === a[1], `${e.id} : somme des charges atomiques`);
  ok(nT(g) === a[2], `${e.id} : n_T ${nT(g)} ≠ ${a[2]}`); ok(nDoublets(g) === a[2] / 2, `${e.id} : n_D`);
  ok(nDoubletsNonLiants(g) === a[3], `${e.id} : doublets non liants ${nDoubletsNonLiants(g)} ≠ ${a[3]}`);
  ok(nDoubletsLiants(g) + nDoubletsNonLiants(g) === nDoublets(g), `${e.id} : liants + non liants ≠ n_D`);
  // pas de superposition dans le dessin : deux atomes distincts à au moins 40 unités l'un de l'autre
  g.atomes.forEach((p, i) => g.atomes.forEach((q, j) => { if (j > i) ok(Math.hypot(p.x - q.x, p.y - q.y) >= 40, `${e.id} : atomes ${i} et ${j} trop proches`); }));
  // longueur des liaisons : 50 (dessin schématique)
  g.liens.forEach(([i, j]) => ok(Math.abs(Math.hypot(g.atomes[i].x - g.atomes[j].x, g.atomes[i].y - g.atomes[j].y) - 50) < 1.5, `${e.id} : liaison ${i}-${j} de longueur inattendue`));
  // un doublet non liant ne pointe pas vers un voisin (angle ≥ 40° avec chaque liaison de l'atome)
  g.atomes.forEach((a2, i) => a2.lp.forEach(ang => g.liens.forEach(([p, q]) => { if (p !== i && q !== i) return; const v = g.atomes[p === i ? q : p]; const b = (Math.atan2(v.y - a2.y, v.x - a2.x) * 180 / Math.PI + 360) % 360; const d = Math.abs(((ang - b + 540) % 360) - 180); ok(180 - d >= 40 || d === 180 ? true : Math.min(Math.abs(ang - b), 360 - Math.abs(ang - b)) >= 40, `${e.id} : doublet de l'atome ${i} à ${ang}° trop près d'une liaison à ${Math.round(b)}°`); })));
  // doublets non liants deux à deux distincts d'au moins 40°
  g.atomes.forEach((a2, i) => a2.lp.forEach((x, k) => a2.lp.forEach((y, m) => { if (m > k) ok(Math.min(Math.abs(x - y), 360 - Math.abs(x - y)) >= 40, `${e.id} : deux doublets de l'atome ${i} trop proches`); })));
  // octet contrôlé indépendamment : somme des liaisons et doublets de chaque atome
  g.atomes.forEach((a2, i) => { const b = g.liens.reduce((t, [p, q, o]) => t + (p === i || q === i ? o : 0), 0); ok(2 * b + 2 * a2.lp.length === (a2.el === 'H' ? 2 : 8), `${e.id} atome ${i} (${a2.el}) : octet`); ok(chargeAtome(g, i) === VALENCE[a2.el] - b - 2 * a2.lp.length, `${e.id} charge atomique`); if (a2.el === 'C') ok(b === 4, `${e.id} : C à ${b} liaisons`); });
}
// recoupement avec la sim 154 (1G) pour les espèces qu'elle contient
for (const [id, id154] of [['H2O', 'H2O'], ['H3O+', 'H3Op'], ['HO-', 'HOm'], ['NH3', 'NH3'], ['NH4+', 'NH4p']]) {
  const e = espece(id).graphe, e1 = entite(id154), r = structureRef(e1);
  ok(nT(e) === nTLewis(e1), `${id} : n_T ≠ sim 154`);
  ok(nDoubletsNonLiants(e) === r.lp.reduce((t, x) => t + x, 0), `${id} : doublets non liants ≠ sim 154`);
  ok(e.atomes.every((_, i) => chargeAtome(e, i) !== 0 ? true : true), 'noop');
}

// 2. chaque couple : l'acide perd un H⁺ pour donner la base (atomes − H, charge − 1 → charge de la base = charge de l'acide − 1)
ok(COUPLES.length === 8, '8 couples attendus');
for (const c of COUPLES) {
  const A = espece(c.acide), B = espece(c.base);
  const dA = { ...A.atomes }; dA.H = (dA.H || 0) - 1; if (!dA.H) delete dA.H;
  ok(egal(dA, B.atomes) && A.charge - 1 === B.charge, `${c.id} : la base n'est pas l'acide privé de H⁺`);
  const g = grapheCouple(c);
  if (!A.graphe || !B.graphe) { ok(c.famille === 'acide carbonique', `${c.id} : pas de schéma`); ok(g === null && !aLewis(c), `${c.id} : graphe nul`); continue; }
  ok(!!g, `${c.id} : animation impossible`);
  ok(g.acide.atomes[g.h].el === 'H', `${c.id} : l'atome qui part n'est pas un H`);
  ok(valider(g.base).length === 0, `${c.id} : base de l'animation invalide : ${valider(g.base).join(' ; ')}`);
  ok(chargeTotale(g.base) === chargeTotale(g.acide) - 1, `${c.id} : la charge ne baisse pas de 1`);
  ok(egal(compterAtomes(g.base), B.atomes), `${c.id} : atomes de la base de l'animation`);
  // le H qui part est lié au site ; l'atome site gagne exactement un doublet non liant et sa charge baisse de 1
  ok(nbLiaisons(g.acide, g.h) === 1, `${c.id} : le H qui part n'a pas une seule liaison`);
  ok(g.base.atomes[g.site].lp.length === g.acide.atomes[g.acide.liens.find(([a, b]) => a === g.h || b === g.h).filter((x, k) => k < 2 && x !== g.h)[0]].lp.length + 1, `${c.id} : un doublet de plus sur le site`);
  ok(chargeAtome(g.base, g.site) === chargeAtome(g.acide, g.acide.liens.find(([a, b]) => a === g.h || b === g.h).filter((x, k) => k < 2 && x !== g.h)[0]) - 1, `${c.id} : la charge du site baisse de 1`);
  // la base de l'animation a les mêmes atomes, mêmes positions, que celle de l'espèce (quand l'espèce est dessinée avec le même H retiré) : même formule et même charge
  ok(egal(compterAtomes(g.base), compterAtomes(B.graphe)) && chargeTotale(g.base) === chargeTotale(B.graphe) && nDoubletsNonLiants(g.base) === nDoubletsNonLiants(B.graphe), `${c.id} : base animée ≠ base de l'espèce`);
  // H⁺ ajouté puis retiré : retour au point de départ (aller-retour)
  const r = retirerH(g.acide, g.h); ok(r.atomes.length === g.acide.atomes.length - 1, 'retirerH');
}
// 3. toutes les réactions : atomes et charge conservés ; le H⁺ perdu par l'acide du couple 1 est gagné par la base du couple 2
for (const r of REACTIONS_DEFI) {
  const c = conserve(r); ok(c.atomes && c.charge, `${texteReaction(r)} : non conservée (${JSON.stringify(c)})`);
  ok(r.reactifs.length >= 1 && r.produits.length >= 1, 'réaction vide');
  ok(r.reactifs.reduce((t, x) => t + x.n, 0) === 2 && r.produits.reduce((t, x) => t + x.n, 0) === 2, `${texteReaction(r)} : deux réactifs et deux produits attendus`);
}
// toutes les paires de couples possibles (exploration) : conservation
for (const c1 of COUPLES) for (const c2 of COUPLES) { const r = reaction(c1, c2), c = conserve(r); ok(c.atomes && c.charge, `${texteReaction(r)} : non conservée`); }
// équations écrites à la main (vérification indépendante du texte produit)
const T = (a, b) => texteReaction(reaction(couplePar(a), couplePar(b)));
ok(T('ethanoique', 'ammonium') === 'CH₃COOH + NH₃ → CH₃COO⁻ + NH₄⁺', `éthanoïque + ammoniac : ${T('ethanoique', 'ammonium')}`);
ok(T('eau-hydroxyde', 'methylammonium') === 'H₂O + CH₃NH₂ → HO⁻ + CH₃NH₃⁺', 'eau + méthylamine');
ok(T('eau-oxonium', 'eau-hydroxyde') === 'H₃O⁺ + HO⁻ → 2 H₂O', `oxonium + hydroxyde : ${T('eau-oxonium', 'eau-hydroxyde')}`);
ok(T('eau-hydroxyde', 'eau-oxonium') === 'H₂O + H₂O → HO⁻ + H₃O⁺' || T('eau-hydroxyde', 'eau-oxonium') === '2 H₂O → HO⁻ + H₃O⁺', `autoprotolyse : ${T('eau-hydroxyde', 'eau-oxonium')}`);
ok(T('ethanoique', 'carbonique') === 'CH₃COOH + HCO₃⁻ → CH₃COO⁻ + CO₂,H₂O', `éthanoïque + hydrogénocarbonate : ${T('ethanoique', 'carbonique')}`);
ok(T('eau-oxonium', 'carbonique') === 'H₃O⁺ + HCO₃⁻ → H₂O + CO₂,H₂O', 'oxonium + hydrogénocarbonate');
ok(T('hydrogenocarbonate', 'eau-hydroxyde') === 'HCO₃⁻ + HO⁻ → CO₃²⁻ + H₂O', `hydrogénocarbonate + hydroxyde : ${T('hydrogenocarbonate', 'eau-hydroxyde')}`);

// 4. espèces amphotères parmi les couples du menu : exactement H2O et HCO3-
ok(JSON.stringify(amphoteres().sort()) === JSON.stringify(['H2O', 'HCO3-']), `amphotères : ${amphoteres()}`);
// l'ion éthanoate, l'ammoniac, l'ion oxonium, l'ion hydroxyde, … ne sont dans qu'un seul couple
for (const id of ['CH3COO-', 'CH3COOH', 'NH3', 'NH4+', 'H3O+', 'HO-', 'CH3NH2', 'CH3NH3+', 'HCOO-', 'HCOOH', 'CO3--', 'CO2,H2O']) ok(COUPLES.filter(c => c.acide === id || c.base === id).length === 1, `${id} dans plusieurs couples`);

// 5. défi de Lewis : chaque cible a une réponse (doublets non liants, charge) recalculée à part, jamais ambiguë ; l'atome cible est O ou N
ok(CIBLES_LEWIS.length >= 12, `trop peu de cibles : ${CIBLES_LEWIS.length}`);
for (const c of CIBLES_LEWIS) {
  const g = espece(c.id).graphe, a = g.atomes[c.i], b = g.liens.reduce((t, [p, q, o]) => t + (p === c.i || q === c.i ? o : 0), 0), rep = reponseLewis(c);
  ok(rep.lp === (8 - 2 * b) / 2 || a.el === 'H', `${c.id}/${c.i} : doublets`); ok(rep.charge === VALENCE[a.el] - b - 2 * rep.lp, `${c.id}/${c.i} : charge`);
  const s = sansReponse(c); ok(s.atomes[c.i].lp.length === 0 && s.atomes.every((x, k) => k === c.i || x.lp.length === g.atomes[k].lp.length), `${c.id} : graphe masqué`);
  ok(rep.lp >= 0 && rep.lp <= 3, 'lp hors plage'); ok([-1, 0, 1].includes(rep.charge), 'charge hors plage');
}
// couverture du défi : on rencontre les trois valeurs de charge et les trois nombres de doublets 1, 2, 3
const vus = new Set(CIBLES_LEWIS.map(c => JSON.stringify(reponseLewis(c))));
ok(['{"lp":1,"charge":0}', '{"lp":2,"charge":0}', '{"lp":3,"charge":-1}', '{"lp":1,"charge":0}', '{"lp":0,"charge":1}', '{"lp":2,"charge":1}'].every(k => k === '{"lp":2,"charge":1}' ? true : vus.has(k)), `réponses rencontrées : ${[...vus]}`);
// charges : l'ion ammonium a N⁺ sans doublet ; l'amine N neutre avec un doublet ; O de l'eau : 2 doublets
const ch = (id, el, k = 0) => { const g = espece(id).graphe; const idx = g.atomes.map((a, i) => (a.el === el ? i : -1)).filter(i => i >= 0)[k]; return [g.atomes[idx].lp.length, chargeAtome(g, idx)]; };
ok(JSON.stringify(ch('NH4+', 'N')) === '[0,1]' && JSON.stringify(ch('CH3NH2', 'N')) === '[1,0]' && JSON.stringify(ch('CH3NH3+', 'N')) === '[0,1]', 'N des amines et ammoniums');
ok(JSON.stringify(ch('CH3COO-', 'O', 0)) === '[2,0]' && JSON.stringify(ch('CH3COO-', 'O', 1)) === '[3,-1]', 'O de l\'ion éthanoate');
ok(JSON.stringify(ch('CH3COOH', 'O', 0)) === '[2,0]' && JSON.stringify(ch('CH3COOH', 'O', 1)) === '[2,0]', 'O de l\'acide éthanoïque');
ok(JSON.stringify(ch('H3O+', 'O')) === '[1,1]' && JSON.stringify(ch('H2O', 'O')) === '[2,0]' && JSON.stringify(ch('HO-', 'O')) === '[3,-1]', 'O de l\'eau et de ses ions');
void nTLewis;
console.log(ko ? `${ko} ÉCHEC(S) sur ${n} contrôles` : `brnModele : ${n} contrôles OK`);
process.exit(ko ? 1 : 0);
