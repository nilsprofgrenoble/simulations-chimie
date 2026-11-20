// Tests du modèle « mesure : variabilité » 2GT : node src/simulations/mesureVariabilite2gtModele.test.mjs
import * as M from './mesureVariabilite2gtModele.js';
let ko = 0;
const proche = (nom, x, ref, tolRel) => { const ok = Math.abs(x - ref) <= Math.abs(ref) * tolRel + 1e-12; if (!ok) { ko++; console.log(`✗ ${nom} : ${x} au lieu de ${ref}`); } else console.log(`✓ ${nom}`); };
const vrai = (nom, c) => { if (!c) { ko++; console.log(`✗ ${nom}`); } else console.log(`✓ ${nom}`); };
const corr = v => { const n = v.length, mx = (n - 1) / 2, my = M.moyenne(v); let sxy = 0, sxx = 0, syy = 0; v.forEach((y, i) => { sxy += (i - mx) * (y - my); sxx += (i - mx) ** 2; syy += (y - my) ** 2; }); return sxy / Math.sqrt(sxx * syy); };

// statistiques calculées à part, à la main
proche('moyenne de 1, 2, 3, 6 = 3', M.moyenne([1, 2, 3, 6]), 3, 1e-12);
proche('écart-type de 1, 2, 3, 6 = √(14/3)', M.ecartType([1, 2, 3, 6]), Math.sqrt(14 / 3), 1e-12);
vrai('écart-type d’une valeur seule : NaN', Number.isNaN(M.ecartType([5])));
proche('écart-type de valeurs identiques = 0', M.ecartType([4, 4, 4, 4]), 0, 1);
proche('moyenne des durées de l’étape 1 = 0,605 s', M.moyenne(M.CHUTE_8), 0.605, 1e-9);
proche('moyenne des 6 masses = 120,56 ÷ 6 ≈ 20,09 g', M.moyenne(M.EAU_6), 20.09, 0.001);
proche('somme des 6 masses = 120,56', M.somme(M.EAU_6), 120.56, 1e-9);
vrai('masses : aucune valeur de la liste n’est à moins de 0,5 % de la moyenne (une valeur recopiée est refusée, tolérance 0,3 %)', M.EAU_6.every(x => Math.abs(x - M.moyenne(M.EAU_6)) > 0.005 * M.moyenne(M.EAU_6)));
vrai('masses : le piège « divisé par 5 » vaut 24,112', Math.abs(M.somme(M.EAU_6) / 5 - 24.112) < 1e-9);
proche('moyenne de l’exemple (crayon) = 871 ÷ 5 = 174,2', M.moyenne(M.CRAYON_5), 174.2, 1e-9);
vrai('exemple de l’étape 4 : somme 871', M.somme(M.CRAYON_5) === 871);
vrai('la moyenne est comprise entre le minimum et le maximum', [M.CHUTE_20, M.GOUTTES_12, M.EAU_6].every(v => M.moyenne(v) >= M.minimum(v) && M.moyenne(v) <= M.maximum(v)));

// histogramme : règle des bornes et comptes écrits dans le parcours
const h20 = M.histogramme(M.CHUTE_20, M.HISTO_CHUTE.debut, M.HISTO_CHUTE.largeur, M.HISTO_CHUTE.K);
vrai('étape 2 : somme des effectifs = 20, aucune valeur hors graphique', h20.classes.reduce((s, c) => s + c.n, 0) === 20 && h20.hors === 0);
vrai('étape 2 : classe 0,56–0,60 contient 4 (exemple)', M.effectifClasse(M.CHUTE_20, 0.56, 0.60) === 4);
vrai('étape 2 : classe 0,60–0,64 contient 6 (question)', M.effectifClasse(M.CHUTE_20, 0.60, 0.64) === 6 && h20.classes[4].n === 6);
vrai('étape 2 : aucune valeur sur une borne de classe', M.CHUTE_20.every(x => Math.abs(x / 0.04 - Math.round(x / 0.04)) > 1e-6));
const hg = M.histogramme(M.GOUTTES_12, M.HISTO_GOUTTES.debut, M.HISTO_GOUTTES.largeur, M.HISTO_GOUTTES.K);
vrai('étape 3 : classe 1,20–1,25 contient 5 (1,20 inclus)', hg.classes[2].n === 5 && M.effectifClasse(M.GOUTTES_12, 1.2, 1.25) === 5);
vrai('étape 3 : classes 1, 3, 5, 2, 1', hg.classes.map(c => c.n).join() === '1,3,5,2,1');
vrai('étape 3 : sans la borne gauche on trouverait 4 (piège)', M.GOUTTES_12.filter(x => x > 1.2 + 1e-9 && x < 1.25).length === 4);
vrai('étape 3 : exemple 3, 4 et 1 valeurs (0,60 dans la classe de droite)', M.effectifClasse(M.CHUTE_8, 0.55, 0.60) === 3 && M.effectifClasse(M.CHUTE_8, 0.60, 0.65) === 4 && M.effectifClasse(M.CHUTE_8, 0.65, 0.70) === 1);
vrai('une valeur égale à la borne de droite passe dans la classe suivante', M.histogramme([1, 2, 3], 1, 1, 3).classes.map(c => c.n).join() === '1,1,1');
vrai('valeurs hors des classes comptées à part', M.histogramme([0, 1.5, 9], 1, 1, 3).hors === 2);

// séries du parcours : dispersions annoncées dans le texte
const arr2 = x => Number(M.nbSig(x, 2).replace(',', '.'));
for (const [k, s] of [['S1', 0.02], ['S2', 0.05], ['S3', 0.09], ['A', 0.03], ['B', 0.07], ['E', 0.03], ['F', 0.06]]) {
  const v = M.SERIES_DISP[k]; proche(`série ${k} : écart-type ${s} s`, arr2(M.ecartType(v)), s, 0.011); proche(`série ${k} : moyenne 1,20 s`, M.moyenne(v), 1.2, 0.001);
  vrai(`série ${k} : toutes les valeurs dans l’axe commun`, M.histogramme(v, M.HISTO_DISP.debut, M.HISTO_DISP.largeur, M.HISTO_DISP.K).hors === 0);
}
vrai('étape 5 : E entre 1,14 et 1,25 s, F entre 1,12 et 1,32 s (exemple)', M.minimum(M.SERIES_DISP.E) >= 1.14 - 0.005 && M.maximum(M.SERIES_DISP.E) <= 1.25 + 0.005 && M.minimum(M.SERIES_DISP.F) >= 1.12 - 0.005 && M.maximum(M.SERIES_DISP.F) <= 1.32 + 0.005);
vrai('étape 5 : la série B est plus large que A', M.maximum(M.SERIES_DISP.B) - M.minimum(M.SERIES_DISP.B) > 1.8 * (M.maximum(M.SERIES_DISP.A) - M.minimum(M.SERIES_DISP.A)));
// instrument : la règle est moins précise que le pied à coulisse, la différence de 0,5 mm se perd avec la règle seulement
const sR = M.ecartType(M.CRAYON_REGLE), sP = M.ecartType(M.CRAYON_PIED);
vrai(`instrument : règle s = ${sR.toFixed(2)} mm > 0,5 mm > pied s = ${sP.toFixed(2)} mm`, sR > 0.5 && sP < 0.2);
vrai('instrument : valeurs de la règle dans 172–176 mm, du pied dans 173,5–174,5 mm', M.CRAYON_REGLE.every(x => x >= 172 && x < 176) && M.CRAYON_PIED.every(x => x >= 173.5 && x < 174.5));
const sU = M.ecartType(M.GOUTTES_UN), sX = M.ecartType(M.GOUTTES_DIX);
vrai(`protocole : 10 intervalles ÷ 10 (s = ${sX.toFixed(4)}) bien plus étroit que 1 intervalle (s = ${sU.toFixed(4)})`, sX * 5 < sU);
vrai('protocole : les deux séries ont 20 mesures', M.GOUTTES_UN.length === 20 && M.GOUTTES_DIX.length === 20);
vrai('protocole : valeurs dans l’axe 1,05–1,35 s', [...M.GOUTTES_UN, ...M.GOUTTES_DIX].every(x => x >= 1.05 && x < 1.35));
vrai('protocole : 10 intervalles ÷ 10, valeurs dans les classes 1,185–1,235', M.GOUTTES_DIX.every(x => x >= 1.185 && x < 1.235));
// indépendance
vrai(`indépendance : A sans tendance (corr ${corr(M.ORDRE_A).toFixed(2)}), B qui monte (corr ${corr(M.ORDRE_B).toFixed(2)})`, Math.abs(corr(M.ORDRE_A)) < 0.1 && corr(M.ORDRE_B) > 0.9);
vrai('indépendance : valeurs dans l’axe 1,05–1,35', [...M.ORDRE_A, ...M.ORDRE_B].every(x => x > 1.05 && x < 1.35));
// plus de mesures
const r = M.ecartType(M.NOMBRE_50) / M.ecartType(M.NOMBRE_5);
vrai(`nombre : s(50) / s(5) = ${r.toFixed(2)}, du même ordre`, r > 0.7 && r < 1.4);

// tirage : reproductible, centré, résolution respectée, dérive
for (const sit of M.IDS_SITUATIONS) for (const c of M.SITUATIONS[sit].configs) {
  const a = M.tirerSerie(sit, c.id, 20, 5), b = M.tirerSerie(sit, c.id, 20, 5);
  vrai(`${sit}/${c.id} : tirage reproductible`, a.join() === b.join());
  let sm = 0, ss = 0, ok = true;
  for (let g = 1; g <= 400; g++) { const { valeurs } = M.tirerSerieAffichable(sit, c.id, 20, g); sm += M.moyenne(valeurs); ss += M.ecartType(valeurs);
    const d = M.debutClasses(M.SITUATIONS[sit].ref, c.classe, c.K); if (!valeurs.every(x => x >= d - 1e-9 && x < d + c.K * c.classe - 1e-9)) ok = false; }
  proche(`${sit}/${c.id} : moyenne des moyennes proche de la référence`, sm / 400, M.SITUATIONS[sit].ref, 0.002);
  proche(`${sit}/${c.id} : écart-type moyen proche de σ (arrondi à la résolution compris)`, ss / 400, Math.hypot(c.sigma, c.res / Math.sqrt(12)), 0.06);
  vrai(`${sit}/${c.id} : séries affichables dans les ${c.K} classes`, ok);
  vrai(`${sit}/${c.id} : valeurs multiples de la résolution`, a.every(x => Math.abs(x / c.res - Math.round(x / c.res)) < 1e-6));
  vrai(`${sit}/${c.id} : résolution ≤ largeur de classe`, c.res <= c.classe + 1e-12);
  const sd = M.ecartType(M.tirerSerie(sit, c.id, 200, 9, 3)), s0 = M.ecartType(M.tirerSerie(sit, c.id, 200, 9, 0));
  vrai(`${sit}/${c.id} : la dérive élargit la série`, sd > 1.2 * s0);
}
vrai('dérive : la moyenne reste centrée', Math.abs(M.moyenne(M.tirerSerie('chute', 'main', 200, 4, 3)) - 0.606) < 0.03);

// écriture des nombres
vrai('nbSig(0,0512) = 0,051', M.nbSig(0.0512, 2) === '0,051');
vrai('nbSig(0,6567) = 0,66', M.nbSig(0.6567, 2) === '0,66');
vrai('nbSig(1,25) = 1,3 (2 chiffres)', M.nbSig(1.25, 2) === '1,3' || M.nbSig(1.25, 2) === '1,2');
vrai('decimalesDe(0,001) = 3 ; decimalesDe(1) = 0', M.decimalesDe(0.001) === 3 && M.decimalesDe(1) === 0);

// défis
let okC = true, okE = true, mesure = 0;
for (let t = 0; t < 300; t++) {
  const d = M.tirerDefiComparer(null);
  if (!d || !(d.rapport >= 2.5) || (d.largeEstA !== (d.sA > d.sB))) okC = false;
  const e = M.tirerDefiEstimer(null);
  if (!e || new Set(e.choix).size !== 3 || e.choix[e.bonne] !== Number(e.s.toPrecision(2))) okE = false;
  else { const largeur = (M.maximum(e.valeurs) - M.minimum(e.valeurs) + M.configDe(e.sit, e.cfg).res) / 4, proches = e.choix.map(c => Math.abs(Math.log(largeur / c))); if (proches.indexOf(Math.min(...proches)) === e.bonne) mesure++; }
}
vrai('défi comparer : rapports ≥ 2,5, A/B cohérents', okC);
vrai('défi estimer : trois propositions distinctes, la bonne est l’écart-type', okE);
vrai(`défi estimer : « largeur ÷ 4 » désigne la bonne proposition (${mesure} / 300)`, mesure >= 285);
console.log(ko ? `${ko} échec(s)` : 'Tout est OK');
process.exit(ko ? 1 : 0);
