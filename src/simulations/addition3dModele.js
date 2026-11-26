// Modèle PUR de la vue 3D « syn ou anti » (simulation Syn ou anti ? Stéréosélectivité) : addition de Br₂ (anti, pont bromonium), OsO₄ (syn, ester cyclique)
// ou H₂/Pd (syn, surface du métal) sur le (Z)-but-2-ène, le (E)-but-2-ène ou le 1,2-diméthylcyclohexène. Aucun accès à React ni à three.js : testé par addition3dModele.test.mjs.
// Repère : la double liaison C=C est sur l'axe x, le plan de l'alcène est le plan xz (y = 0) ; la face « dessus » est y > 0.
import { seg } from "./sn3dModele.js";
import { REACTIFS, resultat } from "./seleModele.js";

const L = 1.0, XS = 1.9, ZS = 1.4, HAUT = 1.5, PLI = 0.55;          // demi-longueur C=C, position des substituants, longueur de la liaison C–X, flexion des substituants
const C = [[-L, 0, 0], [L, 0, 0]];
const add = (a, b) => a.map((x, i) => x + b[i]);
const mid = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);

// face : 'dessus' | 'dessous' (face par laquelle le réactif arrive) ; u ∈ [0, 1] : avancement
export function etat(alc, re, face, u) {
  const s = face === 'dessus' ? 1 : -1, syn = REACTIFS[re].mode === 'syn';
  const cote = [s, syn ? s : -s];                                  // côté du plan où se fixe le groupe ajouté sur C2 et sur C3
  const zA = [ZS, alc === 'E' ? -ZS : ZS];                         // côté (z) du substituant « a » (CH₃, ou CH₂ du cycle) de chaque carbone ; « b » (H, ou CH₃ du cycle) est de l'autre côté
  const w = seg(u, 0.35, 0.9);                                     // pyramidalisation : les substituants fuient le groupe ajouté
  const subs = [0, 1].map(k => {
    const x = C[k][0] + (k === 0 ? -1 : 1) * (XS - L), y = -cote[k] * PLI * w;
    return { a: [x, y, zA[k]], b: [x, y, -zA[k]] };
  });
  const X = [0, 1].map(k => [C[k][0] * 1.15, cote[k] * HAUT, 0]);   // positions finales des groupes ajoutés
  const e = { s, syn, cote, subs, X, carbones: C, sp3: w > 0.5, atomes: [], liaisons: [] };
  // atomes mobiles et liaisons : { p, el, nom, charge?, op } ; liaisons { de: index d'atome | 'C0' | 'C1', vers, op }
  const A = e.atomes, B = e.liaisons;
  const poseA = (el, p, nom, extra = {}) => { A.push({ el, p, nom, ...extra }); return A.length - 1; };
  if (re === 'H2') {
    const f = seg(u, 0.3, 0.8);
    e.surface = { y: s * 3.3, nom: 'Pd' };
    [0, 1].forEach(k => { const i = poseA('H', mid([C[k][0], s * 3.0, 0], X[k], f), 'H'); B.push({ de: i, vers: 'C' + k, op: f }); B.push({ de: i, vers: { surface: [C[k][0], s * 3.3, 0] }, op: 1 - f }); });
  } else if (re === 'OsO4') {
    const f = seg(u, 0.2, 0.5), c = seg(u, 0.55, 0.9), os = poseA('Os', [0, s * (3.2 + 2 * seg(u, 0.55, 0.95)), 0], u < 0.55 ? 'Os' : '', { op: 1 - seg(u, 0.7, 0.98) });
    [0, 1].forEach(k => { const i = poseA('O', mid([C[k][0] * 0.55, s * 2.2, 0], X[k], f), u > 0.9 ? 'OH' : 'O'); B.push({ de: i, vers: 'C' + k, op: f }); B.push({ de: i, vers: os, op: 1 - c }); });
  } else {
    // Br₂ : pont bromonium au-dessus (étape 1), puis Br⁻ qui attaque C3 par le dessous (étape 2)
    const f1 = seg(u, 0.12, 0.45), f2 = seg(u, 0.55, 0.92);
    const pont = poseA('Br', mid([0, s * 1.9, 0], X[0], f2), u < 0.35 ? 'Br' : f2 < 0.5 ? 'Br⁺' : 'Br', { charge: u >= 0.4 && f2 < 0.5 ? '+' : null });
    B.push({ de: pont, vers: 'C0', op: f1 }); B.push({ de: pont, vers: 'C1', op: f1 * (1 - f2) });
    const dep = poseA('Br', [2.6 + 1.6 * seg(u, 0.3, 0.6), s * (2.7 + seg(u, 0.3, 0.6)), 0], u < 0.35 ? 'Br' : 'Br⁻', { charge: u >= 0.4 ? '−' : null });
    if (u < 0.35) B.push({ de: pont, vers: dep, op: 1 });
    const att = poseA('Br', mid([1.7, -s * 4.2, 0], X[1], f2), 'Br⁻', { charge: f2 < 0.95 && u > 0.5 ? '−' : null, op: u < 0.5 ? 0 : 1 });
    B.push({ de: att, vers: 'C1', op: f2 });
  }
  return e;
}

// Descripteur R/S de chaque carbone lu sur la géométrie finale (Br₂ et OsO₄ sur le but-2-ène) : priorités X > autre carbone > CH₃ > H
const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
const dir = (p, q) => q.map((x, i) => x - p[i]);
export function lettres(e) {
  return [0, 1].map(k => {
    const d = dir(e.carbones[k], e.X[k]), dc = dir(e.carbones[k], e.carbones[1 - k]), dm = dir(e.carbones[k], e.subs[k].a);
    return dot(d, cross(dc, dm)) < 0 ? 'R' : 'S';
  });
}
// cis / trans des deux CH₃ du produit cyclique (les CH₃ sont les substituants « b ») : même côté du plan moyen du cycle ?
export const cisTrans = e => (Math.sign(e.subs[0].b[1]) === Math.sign(e.subs[1].b[1]) ? 'cis' : 'trans');
// ce que le modèle annonce pour la fin de la réaction, comparé à seleModele.js par le test
export function bilan(alc, re, face) {
  const e = etat(alc, re, face, 1), X = resultat(alc, re);
  if (X.type === 'sans') return { texte: 'butane : aucun stéréoisomère', desc: null };
  if (alc === 'cyc') return { texte: cisTrans(e), desc: null };
  const l = lettres(e);
  return { texte: `(2${l[0]},3${l[1]})`, desc: l.join('') };
}
export const _util = { add };
