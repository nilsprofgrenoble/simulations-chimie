// Tests du modèle « corps pur ou mélange » 2GT (sim 196) : node src/simulations/corpsPur2gtModele.test.mjs
import * as M from './corpsPur2gtModele.js';
let ko = 0;
const vrai = (nom, c) => { if (!c) { ko++; console.log(`✗ ${nom}`); } else console.log(`✓ ${nom}`); };
const proche = (nom, x, ref, tol) => vrai(`${nom} : ${x} ≈ ${ref}`, Math.abs(x - ref) <= Math.abs(ref) * tol);

// valeurs de référence (vérifiées sur sources, voir l'en-tête du modèle)
vrai('eau 0 et 100', M.CORPS.eau.Tfus === 0 && M.CORPS.eau.Tvap === 100);
vrai('éthanol −114 et 78', M.CORPS.ethanol.Tfus === -114 && M.CORPS.ethanol.Tvap === 78);
vrai('acétone −95 et 56', M.CORPS.acetone.Tfus === -95 && M.CORPS.acetone.Tvap === 56);
vrai('cyclohexane 6,5 et 81', M.CORPS.cyclohexane.Tfus === 6.5 && M.CORPS.cyclohexane.Tvap === 81);
vrai('liquides classés par température d’ébullition', M.LIQUIDES.every((id, i, a) => i === 0 || M.CORPS[a[i - 1]].Tvap < M.CORPS[id].Tvap));

// courbe d'un corps pur : palier exactement plat, début à 20 °C, montée 6 °C/min
const eth = M.profil('ethanol');
proche('éthanol : début du palier à 9,67 min', eth.tDeb, 58 / 6, 1e-9);
vrai('éthanol : température à 0 min', M.temperature(eth, 0) === 20);
proche('éthanol : température à 5 min', M.temperature(eth, 5), 50, 1e-9);
vrai('éthanol : palier plat', M.courbe(eth).filter(([t]) => t >= eth.tDeb && t <= eth.tFin).every(([, T]) => T === 78));
vrai('pente nulle pour un corps pur', M.LIQUIDES.every(id => M.penteEbullition(M.profil(id)) === 0));
vrai('la courbe est croissante pour tous les échantillons', [...M.LIQUIDES.map(id => M.profil(id)), M.profil('eau-ethanol', 10), M.profil('eau-ethanol', 70), M.profil('eau-sel', 2), M.profil('eau-sel', 15)]
  .every(pr => M.courbe(pr).every(([, T], i, a) => i === 0 || T >= a[i - 1][1] - 1e-9)));
// mélange eau + éthanol : plus d'éthanol, début d'ébullition plus bas (de 100 vers 78), pente toujours > 0
let prec = 101;
for (let p = 10; p <= 70; p += 5) { const pr = M.profil('eau-ethanol', p); vrai(`eau + éthanol ${p} % : début décroissant (${M.arrondi(pr.Tdeb)} °C)`, pr.Tdeb < prec && pr.Tdeb > 78 && pr.Tdeb < 100); prec = pr.Tdeb; vrai(`eau + éthanol ${p} % : monte d’au moins ${p >= 20 ? 1 : 0.8} °C/min`, M.penteEbullition(pr) >= (p >= 20 ? 1 : 0.8) && pr.Tfin < 100); }
// eau salée : au-dessus de 100 °C, montée lente
for (let p = 2; p <= 15; p++) { const pr = M.profil('eau-sel', p); vrai(`eau salée ${p} % : début > 100 °C et montée < 0,2 °C/min`, pr.Tdeb > 100 && pr.Tdeb <= 103 && M.penteEbullition(pr) > 0 && M.penteEbullition(pr) < 0.2); }
proche('eau salée 10 % ≈ 102 °C', M.profil('eau-sel', 10).Tdeb, 102, 1e-9);

// thermomètre : lecture à la graduation, compatibilité stricte
vrai('lecture 78,03 à 0,5 → 78', M.lecture(78.03, 0.5) === 78);
vrai('lecture 77,8 à 0,5 → 78', M.lecture(77.8, 0.5) === 78);
vrai('lecture 56,4 à 1 → 56', M.lecture(56.4, 1) === 56);
vrai('écart 2 °C à précision 2 : non compatible (strict)', !M.compatible(80, 78, 2));
vrai('écart 1,5 à précision 2 : compatible', M.compatible(79.5, 78, 2));
vrai('éthanol lu 77,5 ± 1 compatible avec 78 seul', JSON.stringify(M.compatibles(77.5, 1)) === '["ethanol"]');
vrai('80,5 ± 1 : cyclohexane seul', JSON.stringify(M.compatibles(80.5, 1)) === '["cyclohexane"]');
vrai('79,5 ± 2 : éthanol et cyclohexane (ambigu)', JSON.stringify(M.compatibles(79.5, 2)) === '["ethanol","cyclohexane"]');
vrai('valeur lue à chaque précision compatible avec sa propre référence', M.LIQUIDES.every(id => M.PRECISIONS.every(p => M.compatible(M.lecture(M.CORPS[id].Tvap, p), M.CORPS[id].Tvap, p))));
vrai('nombreFR virgule et signe moins', M.nombreFR(77.5, 1) === '77,5'.replace('.', ',') && M.nombreFR(-114) === '−114');
vrai('temp : espace insécable réelle', M.temp(78, 0) === '78 °C' && M.NB === ' ');

// exemples du quotidien : trois catégories, deux de chaque dans le tri
vrai('tri : 6 exemples, 2 par catégorie', M.TRI.length === 6 && M.CATEGORIES.every(([c]) => M.TRI.filter(id => M.exemple(id).cat === c).length === 2));
vrai('chaque exemple est expliqué', Object.values(M.EXEMPLES).every(e => e.pourquoi.length > 20 && M.NOM_CAT[e.cat]));

// défi 1 : 20 000 tirages
let nP = 0, nM = 0;
for (let i = 0; i < 20000; i++) {
  const d = M.tirerDefiPur();
  if (d.pur) { nP++; if (M.penteEbullition(d.pr) !== 0) { vrai('pur sans palier', false); break; } } else { nM++; if (M.penteEbullition(d.pr) < 1) { vrai('mélange trop plat', false); break; } }
  if (!M.reponseJustePur(d, d.pur ? 'pur' : 'melange') || M.reponseJustePur(d, d.pur ? 'melange' : 'pur')) { vrai('vérification défi 1', false); break; }
}
vrai(`défi 1 : ${nP} corps purs et ${nM} mélanges tirés`, nP > 8000 && nM > 8000);
// défi 2 : un seul liquide compatible, jamais d'écart égal à la précision, tolérance = précision affichée
let n2 = 0, ok2 = true; const vus = new Set();
for (let i = 0; i < 20000; i++) {
  const d = M.tirerDefiLiquide();
  const cs = M.compatibles(d.lue, d.prec);
  if (cs.length !== 1 || cs[0] !== d.id) { ok2 = false; console.log('ambigu', d); break; }
  if (M.LIQUIDES.some(x => Math.abs(M.ecart(d.lue, M.CORPS[x].Tvap) - d.prec) < 0.15)) { ok2 = false; console.log('cas limite', d); break; }
  if (!M.reponseJusteLiquide(d, d.id) || M.LIQUIDES.filter(x => x !== d.id).some(x => M.reponseJusteLiquide(d, x))) { ok2 = false; break; }
  vus.add(`${d.id}|${d.prec}`); n2++;
}
vrai(`défi 2 : ${n2} tirages sans ambiguïté, ${vus.size} combinaisons (liquide, précision) vues`, ok2 && vus.size >= 9);
vrai('défi 2 : les deux liquides voisins (éthanol, cyclohexane) n’apparaissent à 2 °C que sans ambiguïté (vérifié ci-dessus)', true);

console.log(ko ? `${ko} ÉCHEC(S)` : 'corpsPur2gtModele : tout est correct');
process.exit(ko ? 1 : 0);
