// Tests du modèle « Mesure : incertitude-type et résultat » 2GT : node src/simulations/mesureIncertitude2gtModele.test.mjs
import * as M from './mesureIncertitude2gtModele.js';
let ko = 0;
const proche = (nom, x, ref, tol) => { const ok = Math.abs(x - ref) <= tol; if (!ok) { ko++; console.log(`✗ ${nom} : ${x} au lieu de ${ref}`); } else console.log(`✓ ${nom}`); };
const vrai = (nom, c) => { if (!c) { ko++; console.log(`✗ ${nom}`); } else console.log(`✓ ${nom}`); };
const lire = s => Number(String(s).replace(/[\s  ]/g, '').replace(',', '.'));

// données du parcours : calculs refaits à la main
proche('étape 1 : moyenne des 5 masses', M.moyenne(M.G.moyenne.valeurs), 7.50, 1e-9);
proche('exemple étape 1 : moyenne des 4 durées', M.moyenne(M.G.exMoyenne.valeurs), 0.64, 1e-9);
proche('étape 4 : u = 0,30 ÷ √9', M.incertitudeA(0.30, 9), 0.10, 1e-12);
proche('exemple étape 4 : u = 0,12 ÷ √4', M.incertitudeA(0.12, 4), 0.06, 1e-12);
proche('étape 5 : n × 4 divise u par 2', M.incertitudeA(0.30, 36), M.incertitudeA(0.30, 9) / 2, 1e-12);
vrai('étape 5 : 100 fois plus de mesures pour u ÷ 10', Math.abs(M.incertitudeA(1, 900) - M.incertitudeA(1, 9) / 10) < 1e-12);
// arrondis (convention de la sim 161 : 1 chiffre significatif, 2 si le premier est 1, par excès)
proche('arrondi 0,0347 → 0,04', M.arrondiU(0.0347), 0.04, 1e-12);
proche('arrondi 0,0623 → 0,07 (par excès)', M.arrondiU(0.0623), 0.07, 1e-12);
proche('usuel 0,0623 → 0,06', M.arrondiUUsuel(0.0623), 0.06, 1e-12);
proche('arrondi 0,0143 → 0,015 (premier chiffre 1 : 2 chiffres)', M.arrondiU(0.0143), 0.015, 1e-12);
proche('usuel 0,0143 → 0,014', M.arrondiUUsuel(0.0143), 0.014, 1e-12);
proche('arrondi 0,0482 → 0,05', M.arrondiU(0.0482), 0.05, 1e-12);
proche('moyenne 12,3846 au rang de u = 0,0482 → 12,38', M.arrondiMoyenne(12.3846, 0.0482), 12.38, 1e-12);
vrai('écriture (7,50 ± 0,04) g', M.ecrireResultat(7.5043, 0.0347, 'g').texte === '(7,50 ± 0,04) g');
vrai('écriture (12,38 ± 0,05) s', M.ecrireResultat(12.3846, 0.0482, 's').texte === '(12,38 ± 0,05) s');
vrai('écriture avec 2 chiffres (u commence par 1)', M.ecrireResultat(3.2718, 0.0143, 's').texte === '(3,272 ± 0,015) s');
vrai('écriture : exemple de la carte (3,27 ± 0,03) s', M.ecrireResultat(3.2718, 0.0239, 's').texte === '(3,27 ± 0,03) s');
// comparaison à une référence
vrai('étape 9 : 29,70 dans [29,62 ; 29,72]', M.dansIntervalle(29.67, 0.05, 29.70) && M.verdictCompat(29.67, 0.05, 29.70) === 'compatible');
vrai('exemple étape 9 : 5,20 loin de [4,90 ; 5,00]', M.verdictCompat(4.95, 0.05, 5.20) === 'non');
vrai('cas limite : écart 2 u', M.verdictCompat(10.2, 0.1, 10.0) === 'limite');
// séries tirées : statistiques cohérentes, reproductibles
{ const sit = M.SITUATIONS.piece, a = M.tirerSerie(sit, sit.instruments[1], 9, 42), b = M.tirerSerie(sit, sit.instruments[1], 9, 42);
  vrai('série reproductible (même graine)', a.join() === b.join());
  vrai('valeurs arrondies à la résolution', a.every(x => Math.abs(x * 100 - Math.round(x * 100)) < 1e-6)); }
// loi des grands nombres : u diminue quand n augmente (moyenne sur 300 graines)
for (const id of M.IDS_SITUATIONS) {
  const sit = M.SITUATIONS[id];
  for (const instr of sit.instruments) {
    const moy = n => { let t = 0; for (let g = 1; g <= 300; g++) t += M.stats(M.tirerSerie(sit, instr, n, g)).u; return t / 300; };
    const u4 = moy(4), u16 = moy(16), u100 = moy(100);
    vrai(`${id}/${instr.id} : u(4) > u(16) > u(100) (${u4.toFixed(4)} ; ${u16.toFixed(4)} ; ${u100.toFixed(4)})`, u4 > u16 && u16 > u100);
    vrai(`${id}/${instr.id} : u(100) ≈ sigma ÷ 10 à 15 %`, Math.abs(u100 - instr.sigma / 10) < 0.15 * instr.sigma / 10);
  }
  vrai(`${id} : le meilleur instrument a un sigma plus petit`, sit.instruments[1].sigma < sit.instruments[0].sigma);
  // la valeur de référence est dans l'intervalle d'une série sans biais, la plupart du temps (≈ 2 fois sur 3 : modèle gaussien)
  let dans = 0; for (let g = 1; g <= 1000; g++) { const st = M.stats(M.tirerSerie(sit, sit.instruments[1], 25, g)); if (Math.abs(st.m - sit.ref) <= st.u) dans++; }
  vrai(`${id} : référence dans [m − u ; m + u] ${dans / 10} % du temps (attendu ≈ 68 %, résolution comprise)`, dans > 600 && dans < 780);
  // avec le décalage systématique, la référence sort de l'intervalle (n = 100)
  let hors = 0; for (let g = 1; g <= 200; g++) { const st = M.stats(M.tirerSerie(sit, sit.instruments[1], 100, g, true)); if (M.verdictCompat(st.m, st.u, sit.ref) === 'non') hors++; }
  vrai(`${id} : avec le décalage et n = 100, « pas compatible » ${hors / 2} % du temps (≥ 90 %)`, hors >= 180);
}
// défis : 5000 tirages
{ let pb = 0, prec = null, precC = null, nU1 = 0, nU2 = 0, nc = { compatible: 0, non: 0 };
  for (let i = 0; i < 5000; i++) {
    const d = M.tirerDefiEcrire(prec); prec = d;
    if (!d) { pb++; continue; }
    const u = M.incertitudeA(d.s, d.n);
    if (!(u > 0) || !isFinite(d.ua) || d.ua < u - 1e-12 || d.ua - u > 0.1 * Math.pow(10, M.rangU(u) + 1)) pb++;
    if (Math.abs(M.arrondiU(u) - d.ua) > 1e-12) pb++;
    // la bonne réponse est acceptée dans les deux conventions, et rien d'autre
    const lt = x => x.toFixed(d.d).replace('.', ',');
    if (!M.verifierEcrire(d, lt(d.ua), lt(d.ma), lire).ok || !M.verifierEcrire(d, lt(d.uu), lt(d.ma), lire).ok) pb++;
    if (M.verifierEcrire(d, lt(d.ua), String(d.m), lire).ok && Math.abs(d.m - d.ma) > 1e-9) pb++;        // moyenne non arrondie refusée
    if (M.verifierEcrire(d, String(u), lt(d.ma), lire).ok && Math.abs(u - d.ua) > 1e-9 && Math.abs(u - d.uu) > 1e-9) pb++;
    if (d.d >= 1 && Math.abs(Number(d.ma.toFixed(d.d - 1)) - d.ma) < 1e-9 && M.verifierEcrire(d, lt(d.ua), lt(d.ma).replace(/0$/, '').replace(/,$/, ''), lire).okM) pb++;   // « 7,5 » refusé pour « 7,50 »
    const premier = Math.floor(u / Math.pow(10, Math.floor(Math.log10(u)) ) + 1e-9); if (premier === 1) nU2++; else nU1++;
    const c = M.tirerDefiCompare(precC); precC = c;
    if (!c) { pb++; continue; }
    nc[c.cas]++;
    if (M.verdictCompat(c.m, c.u, c.sit.ref) === 'limite') pb++;
    if (c.cas === 'compatible' !== M.dansIntervalle(c.m, c.u, c.sit.ref)) pb++;
    if (!(c.u > 0) || !isFinite(c.m)) pb++;
  }
  vrai(`défis : 5000 tirages « écrire » et ${JSON.stringify(nc)} « compatible ? » sans cas limite ni valeur non finie (${nU1} u à 1 chiffre, ${nU2} à 2 chiffres)`, pb === 0); }
console.log(ko ? `\n${ko} échec(s)` : '\nTous les tests passent.');
process.exit(ko ? 1 : 0);
