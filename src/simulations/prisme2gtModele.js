// ====================================================
//  MODÈLE DE LA SIMULATION 201 « DISPERSION DE LA LUMIÈRE BLANCHE PAR UN PRISME » (2GT, partie « Ondes et signaux : lumière, vision et image »).
//  Fichier sans React, testé par prisme2gtModele.test.mjs. Tout tracé de rayons de la simulation est CALCULÉ ici (jamais dessiné à la main).
//
//  HYPOTHÈSES DU MODÈLE (affichées à l'élève dans le panneau « Hypothèses de travail ») :
//   • prisme en verre d'angle au sommet A = 60° (triangle équilatéral de 4 cm de côté), placé dans l'air (n = 1,00 pour toutes les couleurs) ;
//   • verre FICTIF fortement dispersif, choisi pour que l'effet soit bien visible : n = 1,69 pour le violet (400 nm) et n = 1,63 pour le rouge (700 nm) ;
//     un verre ordinaire disperse environ 3 fois moins (option « verre ordinaire » de l'exploration) ; l'effet dessiné est donc EXAGÉRÉ ;
//   • les indices des autres couleurs sont calculés par une formule simple de la forme n = B + C / λ² (loi de Cauchy, hors programme : l'élève lit les valeurs),
//     B et C étant ajustés sur les deux valeurs ci-dessus ; en parcours guidé, les indices sont arrondis à 0,01 (1,63 ; 1,65 ; 1,69) ;
//   • rayons lumineux rectilignes, faisceau très fin, lois de Snell-Descartes à chaque face ; réflexions partielles et absorption ignorées ;
//   • longueur d'onde dans le vide ou l'air ; domaine du visible : environ 400 à 800 nm ;
//   • les couleurs dessinées sont des teintes d'écran approximatives (un écran ne reproduit pas fidèlement une couleur spectrale pure).
// ====================================================
import { GAZ } from './spectresModele.js';
export const NB = '\u00a0';
const RAD = Math.PI / 180;
export const ANGLE_PRISME = 60;                 // angle au sommet A (°)
export const COTE = 4;                          // côté du prisme (cm)
export const LAMBDA_MIN = 400, LAMBDA_MAX = 800;   // domaine du visible (nm), « environ » : repère du programme
export const LAMBDA_ROUGE = 700, LAMBDA_VIOLET = 400;
export const N_ROUGE = 1.63, N_VIOLET = 1.69;
export const I1_MIN = 50, I1_MAX = 80;          // angles d'incidence proposés : limite choisie pour rester loin du cas limite (le violet est totalement réfléchi à la 2e face pour i₁ ≤ 43° environ, le rouge pour i₁ ≤ 38° environ)
export const X_ECRAN = 5.2;                     // abscisse de l'écran (cm)
export const DISTANCE_DEPART = 3.0;             // longueur dessinée du rayon incident avant le prisme (cm)

// ---------- indice du verre ----------
const C_CAUCHY = (N_VIOLET - N_ROUGE) / (1 / ((LAMBDA_VIOLET / 1000) ** 2) - 1 / ((LAMBDA_ROUGE / 1000) ** 2));
const B_CAUCHY = N_ROUGE - C_CAUCHY / ((LAMBDA_ROUGE / 1000) ** 2);
export const cauchy = nm => B_CAUCHY + C_CAUCHY / ((nm / 1000) ** 2);
// facteur de dispersion f : 1 = verre du cours, 0,3 = verre ordinaire, 0 = aucune dispersion (même indice pour toutes les couleurs, celui de 589 nm)
export const VERRES = [
  { id: 'cours', nom: 'verre du cours (très dispersif)', f: 1 },
  { id: 'ordinaire', nom: 'verre ordinaire (environ 3 fois moins dispersif)', f: 0.3 },
  { id: 'aucune', nom: 'verre sans dispersion (théorique)', f: 0 },
];
export const indice = (nm, f = 1) => (f === 1 ? cauchy(nm) : cauchy(589) + f * (cauchy(nm) - cauchy(589)));
export const indiceTable = (nm, f = 1) => Math.round(indice(nm, f) * 100) / 100;          // valeur lue dans le tableau (0,01 près)

// ---------- couleurs ----------
// nom de la couleur d'une radiation (repères usuels)
export function nomCouleur(nm) {
  if (nm < 440) return 'violet';
  if (nm < 490) return 'bleu';
  if (nm < 570) return 'vert';
  if (nm < 590) return 'jaune';
  if (nm < 620) return 'orangé';
  return 'rouge';
}
// teinte d'écran (HSL) d'un rayon : foncée et saturée pour rester lisible sur fond clair
const REPERES_TEINTE = [[400, 272], [440, 252], [480, 205], [510, 150], [550, 112], [580, 52], [610, 26], [650, 4], [800, 0]];
export function teinte(nm) {
  const x = Math.min(800, Math.max(400, nm));
  let i = 0; while (i < REPERES_TEINTE.length - 2 && x > REPERES_TEINTE[i + 1][0]) i++;
  const [l0, h0] = REPERES_TEINTE[i], [l1, h1] = REPERES_TEINTE[i + 1];
  return h0 + (h1 - h0) * (x - l0) / (l1 - l0);
}
export const couleurRayon = nm => { const h = teinte(nm), l = h > 40 && h < 80 ? 40 : h > 80 && h < 170 ? 33 : 44; return `hsl(${h.toFixed(0)}, 92%, ${l}%)`; };
export const couleurClaire = nm => `hsl(${teinte(nm).toFixed(0)}, 95%, 62%)`;

// ---------- géométrie (cm ; x vers la droite, y vers le haut) ----------
const H_PRISME = COTE * Math.sin(ANGLE_PRISME * RAD);
export const SOMMETS = { L: [-COTE / 2, 0], R: [COTE / 2, 0], T: [0, H_PRISME] };
const unit = v => { const l = Math.hypot(v[0], v[1]); return [v[0] / l, v[1] / l]; };
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
// normales SORTANTES des deux faces (vecteurs unitaires)
export const NORMALE_ENTREE = unit([-(SOMMETS.T[1] - SOMMETS.L[1]), SOMMETS.T[0] - SOMMETS.L[0]]);     // face gauche L→T
export const NORMALE_SORTIE = unit([SOMMETS.T[1] - SOMMETS.R[1], -(SOMMETS.T[0] - SOMMETS.R[0])]);    // face droite R→T
export const FRACTION_ENTREE = 0.5;                                                                    // point d'incidence au milieu de la face d'entrée
export const P_ENTREE = [SOMMETS.L[0] + FRACTION_ENTREE * (SOMMETS.T[0] - SOMMETS.L[0]), SOMMETS.L[1] + FRACTION_ENTREE * (SOMMETS.T[1] - SOMMETS.L[1])];

// réfraction vectorielle : N unitaire, tourné vers le côté d'où vient la lumière ; renvoie la nouvelle direction ou null (réflexion totale)
export function refracter(d, N, n1, n2) {
  const c = -dot(N, d), r = n1 / n2, k = 1 - r * r * (1 - c * c);
  if (c <= 0 || k < 0) return null;
  const f = r * c - Math.sqrt(k);
  return unit([r * d[0] + f * N[0], r * d[1] + f * N[1]]);
}
// angle (°) entre une direction et la normale (sans signe)
export const angleAvecNormale = (d, N) => Math.acos(Math.min(1, Math.abs(dot(d, N)))) / RAD;

// trajet d'un rayon de longueur d'onde nm, d'incidence i1 (°) sur la face d'entrée ; f : dispersion du verre
export function trajet(i1, nm, f = 1) {
  const n = indice(nm, f), a = (i1 - ANGLE_PRISME / 2) * RAD;            // la direction incidente est tournée de i1 par rapport à la normale entrante
  const d0 = [Math.cos(a), Math.sin(a)];
  const d1 = refracter(d0, NORMALE_ENTREE, 1, n);
  if (!d1) return null;
  // intersection du rayon intérieur avec la face de sortie (droite R + s (T − R))
  const R = SOMMETS.R, u = sub(SOMMETS.T, R), P1 = P_ENTREE;
  const det = d1[0] * (-u[1]) - d1[1] * (-u[0]);
  const w = sub(R, P1), t = (w[0] * (-u[1]) - w[1] * (-u[0])) / det;
  const P2 = [P1[0] + t * d1[0], P1[1] + t * d1[1]];
  const Nint = [-NORMALE_SORTIE[0], -NORMALE_SORTIE[1]];
  const d2 = refracter(d1, Nint, n, 1);
  const res = { nm, n, i1, d0, d1, d2, P1, P2, reflexionTotale: !d2 };
  res.i2 = angleAvecNormale(d1, NORMALE_ENTREE);
  res.i1calc = angleAvecNormale(d0, NORMALE_ENTREE);
  if (!d2) return res;
  res.i3 = angleAvecNormale(d1, NORMALE_SORTIE);
  res.i4 = angleAvecNormale(d2, NORMALE_SORTIE);
  res.D = Math.acos(Math.max(-1, Math.min(1, dot(d0, d2)))) / RAD;        // déviation : angle entre la direction de départ et la direction de sortie
  const ts = (X_ECRAN - P2[0]) / d2[0];
  res.P3 = d2[0] > 1e-9 ? [X_ECRAN, P2[1] + ts * d2[1]] : null;           // point sur l'écran (null si le rayon n'y va pas)
  return res;
}
// prolongement du rayon incident, sans prisme, jusqu'à l'écran
export function sansPrisme(i1) {
  const a = (i1 - ANGLE_PRISME / 2) * RAD, d0 = [Math.cos(a), Math.sin(a)], ts = (X_ECRAN - P_ENTREE[0]) / d0[0];
  return { d0, P3: [X_ECRAN, P_ENTREE[1] + ts * d0[1]] };
}
export const deviation = (i1, nm, f = 1) => { const t = trajet(i1, nm, f); return t && !t.reflexionTotale ? t.D : null; };
// déviation donnée par la formule du prisme : D = i1 + i4 − A (contrôle du modèle)
export const deviationFormule = t => t.i1 + t.i4 - ANGLE_PRISME;

// longueurs d'onde d'une bande « lumière blanche » (de 400 à 700 nm)
export const BANDE = Array.from({ length: 31 }, (_, k) => 400 + 10 * k);

// ---------- calculs de cours ----------
export const sinus = deg => Math.sin(deg * RAD);
export const arcsin = x => Math.asin(x) / RAD;
export const angleRefracte = (i1, n) => arcsin(sinus(i1) / n);                 // i2 (°) à l'entrée : sin i2 = sin i1 / n (air → verre)
export const angleSortie = (i3, n) => { const s = n * sinus(i3); return s > 1 ? null : arcsin(s); };    // i4 (°) à la sortie : sin i4 = n sin i3 (verre → air)

// ---------- affichage (notation française) ----------
export const arrondiSig = (x, n) => (x === 0 || !isFinite(x) ? x : Number(x.toPrecision(n)));
export const nombreFR = (x, d = null) => {
  if (!isFinite(x)) return '—';
  const s = d == null ? Number(x.toPrecision(3)).toLocaleString('fr-FR', { maximumFractionDigits: 6 }) : x.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
  return s.replace(/[\u00a0\u202f\u2009]/g, NB).replace('-', '−');
};
export const degFR = (x, d = 1) => `${nombreFR(x, d)}${NB}°`;

// ---------- lampes à vapeur (raies visibles ; valeurs de la simulation 66 « Spectres ») ----------
export const LAMPES = ['helium', 'sodium', 'mercure', 'cadmium', 'zinc'].map(id => {
  const g = GAZ.find(x => x.id === id);
  return { id, nom: g.nom, raies: g.raies.filter(([nm]) => nm >= 400).map(([nm, w]) => ({ nm, w })) };
});
export const lampe = id => LAMPES.find(l => l.id === id);

// ---------- défis ----------
const tireDans = t => t[Math.floor(Math.random() * t.length)];
export const TOL_ANGLE = 0.025;       // 2,5 % : un arrondi du résultat à l'unité (≤ 2,1 % ici) est accepté ; l'indice d'une autre couleur (écart ≥ 4 %) est refusé
// Défi 1 : calculer l'angle i2 dans le verre à la première face (loi de Snell-Descartes, rouge ou violet)
export function tirerDefiAngle(prec = null) {
  for (;;) {
    const nm = tireDans([LAMBDA_VIOLET, LAMBDA_ROUGE]), n = nm === LAMBDA_VIOLET ? N_VIOLET : N_ROUGE, i = tireDans([50, 55, 60, 65, 70, 75]);
    if (prec && prec.i === i && prec.nm === nm) continue;
    return { variante: 'entree', nm, n, i, vrai: angleRefracte(i, n) };
  }
}
export const reponseJusteAngle = (d, x) => isFinite(x) && Math.abs(x - d.vrai) <= TOL_ANGLE * d.vrai;
// Défi 2 : reconnaître la couleur d'un laser à sa déviation (tableau de référence)
export const REFERENCES = [{ nm: 400, nom: 'violet' }, { nm: 450, nom: 'bleu' }, { nm: 550, nom: 'vert' }, { nm: 700, nom: 'rouge' }];
export function tirerDefiCouleur(prec = null) {
  for (;;) {
    const i1 = tireDans([55, 60, 65, 70]), ref = tireDans(REFERENCES);
    if (prec && prec.i1 === i1 && prec.ref.nm === ref.nm) continue;
    const table = REFERENCES.map(r => ({ ...r, D: Math.round(deviation(i1, r.nm) * 10) / 10 }));
    const D = table.find(r => r.nm === ref.nm).D;
    return { i1, ref, table, D };
  }
}
export const reponseJusteCouleur = (d, nm) => nm === d.ref.nm;
// Défi 3 (qualitatif) : quel verre disperse le plus la lumière blanche ? Celui dont l'écart n(violet) − n(rouge) est le plus grand ; un verre d'indice
// plus élevé n'est pas forcément plus dispersif (un cas sur deux pose ce piège).
export function tirerDefiVerres(prec = null) {
  const NR = [1.50, 1.52, 1.54, 1.56, 1.58, 1.60, 1.62, 1.64, 1.66, 1.68], ECARTS = [0.01, 0.02, 0.03, 0.04, 0.06];
  for (;;) {
    const piege = Math.random() < 0.5, nrA = tireDans(NR), nrB = tireDans(NR), eA = tireDans(ECARTS), eB = tireDans(ECARTS);
    if (eA === eB || nrA === nrB) continue;
    const plusIndice = nrA > nrB ? 'A' : 'B', plusEcart = eA > eB ? 'A' : 'B';
    if (piege === (plusIndice === plusEcart)) continue;                      // piège : le verre d'indice le plus élevé est le moins dispersif
    const r = x => Math.round(x * 100) / 100, verres = [{ nom: 'A', nR: nrA, nV: r(nrA + eA) }, { nom: 'B', nR: nrB, nV: r(nrB + eB) }];
    if (prec && prec.verres[0].nR === nrA && prec.verres[0].nV === verres[0].nV && prec.verres[1].nR === nrB && prec.verres[1].nV === verres[1].nV) continue;
    return { verres, bonne: plusEcart, plusIndice, piege };
  }
}
export const reponseJusteVerres = (d, choix) => choix === d.bonne;
