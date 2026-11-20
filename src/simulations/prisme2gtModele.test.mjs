// Tests du modèle « prisme » 2GT (sim 201) : node src/simulations/prisme2gtModele.test.mjs
// Propriétés géométriques vérifiées sur des centaines de configurations tirées au hasard (exigence « schémas » de Nils).
import * as M from './prisme2gtModele.js';
let ko = 0;
const vrai = (nom, c) => { if (!c) { ko++; console.log(`✗ ${nom}`); } else console.log(`✓ ${nom}`); };
const proche = (a, b, t) => Math.abs(a - b) <= t;
const RAD = Math.PI / 180, dot = (a, b) => a[0] * b[0] + a[1] * b[1];

// indices : valeurs du cours
vrai('n(violet 400 nm) = 1,69', proche(M.indice(400), 1.69, 1e-12));
vrai('n(rouge 700 nm) = 1,63', proche(M.indice(700), 1.63, 1e-12));
vrai('n décroît avec la longueur d’onde', [400, 450, 500, 550, 600, 650, 700, 800].every((x, i, t) => i === 0 || M.indice(x) < M.indice(t[i - 1])));
vrai('table à 0,01 : 405 → 1,69 ; 532 → 1,65 ; 650 → 1,63 ; 450 → 1,67 ; 550 → 1,65',
  M.indiceTable(405) === 1.69 && M.indiceTable(532) === 1.65 && M.indiceTable(650) === 1.63 && M.indiceTable(450) === 1.67 && M.indiceTable(550) === 1.65);
vrai('quatre couleurs de référence ont des indices (0,01) distincts sauf 550/532', new Set([400, 450, 550, 700].map(x => M.indiceTable(x))).size === 4);
vrai('verre sans dispersion : même indice partout', proche(M.indice(400, 0), M.indice(700, 0), 1e-12));
vrai('verre ordinaire : 3 fois moins dispersif', proche((M.indice(400, 0.3) - M.indice(700, 0.3)) / (M.indice(400) - M.indice(700)), 0.3, 1e-12));
// normales ⟂ faces
const S = M.SOMMETS, face1 = [S.T[0] - S.L[0], S.T[1] - S.L[1]], face2 = [S.T[0] - S.R[0], S.T[1] - S.R[1]];
vrai('normale d’entrée ⟂ face gauche', proche(dot(M.NORMALE_ENTREE, face1), 0, 1e-12));
vrai('normale de sortie ⟂ face droite', proche(dot(M.NORMALE_SORTIE, face2), 0, 1e-12));
vrai('normales sortantes (dirigées vers l’extérieur)', M.NORMALE_ENTREE[0] < 0 && M.NORMALE_SORTIE[0] > 0);
vrai('angle au sommet = 60°', proche(Math.acos(dot(face1, face2) / Math.hypot(...face1) / Math.hypot(...face2)) / RAD, 60, 1e-9));
// 600 configurations aléatoires
let n = 0, pireSnell = 0, pireD = 0, pireSomme = 0, pireFace = 0, ordreOk = true, ecartMin = 99, tangOk = true, surEcran = true;
for (let k = 0; k < 600; k++) {
  const i1 = M.I1_MIN + Math.random() * (M.I1_MAX - M.I1_MIN), f = [1, 0.3, 0][k % 3], nm = 400 + Math.random() * 400;
  const t = M.trajet(i1, nm, f);
  if (!t || t.reflexionTotale) { vrai(`pas de réflexion totale (i1 = ${i1}, ${nm} nm, f = ${f})`, false); break; }
  n++;
  pireSnell = Math.max(pireSnell, Math.abs(Math.sin(t.i1 * RAD) - t.n * Math.sin(t.i2 * RAD)), Math.abs(t.n * Math.sin(t.i3 * RAD) - Math.sin(t.i4 * RAD)));
  pireD = Math.max(pireD, Math.abs(t.D - M.deviationFormule(t)));
  pireSomme = Math.max(pireSomme, Math.abs(t.i2 + t.i3 - M.ANGLE_PRISME));
  pireFace = Math.max(pireFace, Math.abs(dot([t.P2[0] - S.R[0], t.P2[1] - S.R[1]], M.NORMALE_SORTIE)), Math.abs(dot([t.P1[0] - S.L[0], t.P1[1] - S.L[1]], M.NORMALE_ENTREE)));
  // le point de sortie est bien sur le segment de la face droite
  const s = (t.P2[1] - S.R[1]) / (S.T[1] - S.R[1]); if (s < 0 || s > 1) pireFace = 9;
  // composante tangentielle conservée : n1 (d·τ) = n2 (d'·τ)
  const tau1 = [face1[0] / Math.hypot(...face1), face1[1] / Math.hypot(...face1)];
  if (!proche(dot(t.d0, tau1), t.n * dot(t.d1, tau1), 1e-9)) tangOk = false;
  if (!(t.P3 && proche(t.P3[0], M.X_ECRAN, 1e-12))) surEcran = false;
  // dispersion : violet plus dévié que rouge
  const tv = M.trajet(i1, 400, f), tr = M.trajet(i1, 700, f);
  if (f === 0) { if (!proche(tv.D, tr.D, 1e-9)) ordreOk = false; } else { if (!(tv.D > tr.D)) ordreOk = false; ecartMin = Math.min(ecartMin, tv.D - tr.D); }
  if (!proche(t.i1calc, i1, 1e-9)) ordreOk = false;
}
vrai(`${n} configurations sans réflexion totale`, n === 600);
vrai(`loi de Snell-Descartes aux deux faces (pire écart ${pireSnell.toExponential(1)})`, pireSnell < 1e-12);
vrai(`D = i1 + i4 − A (pire écart ${pireD.toExponential(1)})`, pireD < 1e-9);
vrai(`i2 + i3 = A (pire écart ${pireSomme.toExponential(1)})`, pireSomme < 1e-9);
vrai('points d’incidence et de sortie sur les faces', pireFace < 1e-9);
vrai('composante tangentielle conservée à l’entrée', tangOk);
vrai('les rayons arrivent sur l’écran', surEcran);
vrai(`violet plus dévié que rouge (écart minimal ${ecartMin.toFixed(2)}°), égaux sans dispersion`, ordreOk && ecartMin > 1);
// valeurs du parcours (i1 = 50°)
const tr = M.trajet(50, 700), tv = M.trajet(50, 400);
vrai('i₂ rouge = 28,0° ; i₂ violet = 27,0° (26,95°)', proche(tr.i2, 28.03, 0.01) && proche(tv.i2, 26.95, 0.01));
vrai('D rouge = 49,7° ; D violet = 57,2°', M.degFR(tr.D) === `49,7${M.NB}°` && M.degFR(tv.D) === `57,2${M.NB}°`);
vrai('écart de déviation = 7,5°', proche(Math.round(tv.D * 10) / 10 - Math.round(tr.D * 10) / 10, 7.5, 1e-9));
vrai('exemple résolu : sin 50° / 1,63 = 0,470', proche(M.sinus(50) / 1.63, 0.470, 5e-4));
// le prolongement sans prisme arrive à la direction du rayon incident
const sp = M.sansPrisme(50); vrai('prolongement : direction identique au rayon incident', proche(sp.d0[0], tr.d0[0], 1e-12));
// dessin : la déviation à l'entrée est de 1,1° seulement, à la sortie de 7,5°
vrai('écart des angles à l’entrée ≈ 1,1° (petit devant 7,5°)', proche(tr.i2 - tv.i2, 1.08, 0.02));
// i1 hors plage : réflexion totale du violet à 45°
vrai('à 45° le violet est transmis, à 40° il est totalement réfléchi (seuil vers 43° ; la plage 50–80° est une limite choisie)', !M.trajet(45, 400).reflexionTotale && M.trajet(40, 400).reflexionTotale && !M.trajet(43, 400).reflexionTotale && M.trajet(42, 400).reflexionTotale);
// défi 1
let b1 = true, p1 = true, nE = 0;
for (let k = 0; k < 20000; k++) {
  const d = M.tirerDefiAngle();
  if (!isFinite(d.vrai)) { b1 = false; break; }
  if (!M.reponseJusteAngle(d, d.vrai) || !M.reponseJusteAngle(d, Math.round(d.vrai)) || !M.reponseJusteAngle(d, M.arrondiSig(d.vrai, 2))) b1 = false;
  const autre = d.nm === 400 ? M.N_ROUGE : M.N_VIOLET;
  const faux = M.angleRefracte(d.i, autre);
  if (faux != null && M.reponseJusteAngle(d, faux)) p1 = false;      // indice de l'autre couleur accepté
  if (M.reponseJusteAngle(d, d.i)) p1 = false;                        // angle donné recopié accepté
  nE++;
}
vrai(`défi 1 : bonne réponse et arrondi à l’unité acceptés (${nE} tirages)`, b1 && nE === 20000);
vrai('défi 1 : indice de l’autre couleur et angle recopié refusés', p1);
// défi 2 : écarts entre couleurs de référence ≥ 1,0°
let ecart = 99;
for (const i1 of [55, 60, 65, 70]) { const D = M.REFERENCES.map(r => Math.round(M.deviation(i1, r.nm) * 10) / 10).sort((a, b) => a - b); for (let i = 1; i < D.length; i++) ecart = Math.min(ecart, D[i] - D[i - 1]); }
vrai(`défi 2 : écart minimal entre deux couleurs de référence ${ecart.toFixed(1)}°`, ecart >= 1.0);
const d2 = M.tirerDefiCouleur(); vrai('défi 2 : bonne couleur acceptée, autre refusée', M.reponseJusteCouleur(d2, d2.ref.nm) && !M.reponseJusteCouleur(d2, 123));
// défi 3 : verres A et B
{ let ok3 = true, pieges = 0; const N = 20000;
  for (let k = 0; k < N; k++) { const d = M.tirerDefiVerres(); const [A, B] = d.verres, eA = A.nV - A.nR, eB = B.nV - B.nR;
    if (!(Math.abs(eA - eB) > 0.005) || d.bonne !== (eA > eB ? 'A' : 'B') || !M.reponseJusteVerres(d, d.bonne) || M.reponseJusteVerres(d, d.bonne === 'A' ? 'B' : 'A') || A.nV > 1.75 || B.nV > 1.75) ok3 = false;
    if (d.plusIndice !== d.bonne) pieges++; }
  vrai(`défi 3 : bon verre accepté, l’autre refusé, écarts distincts, indices ≤ 1,75 ; piège (indice le plus élevé ≠ plus dispersif) dans ${(100 * pieges / N).toFixed(0)} % des tirages`, ok3 && pieges > 0.4 * N && pieges < 0.6 * N); }
vrai('lampes : raies ≥ 400 nm', M.LAMPES.every(l => l.raies.length > 0 && l.raies.every(r => r.nm >= 400)));
console.log(ko ? `${ko} échec(s)` : 'Tout est correct');
process.exit(ko ? 1 : 0);
