// Modèle PUR de la simulation « Mécanismes réactionnels » : addition de HBr sur le but-2-ène (mécanisme en deux étapes).
// Aucune dépendance à React ni à three.js : tout est testé par mecaModele.test.mjs.
//
// Une seule variable pilote tout : la coordonnée de réaction u ∈ [0, 1].
//   u = 0     réactifs : but-2-ène + HBr
//   u = 0,25  état de transition 1 (le doublet π attaque H, la liaison H–Br se rompt)
//   u = 0,50  carbocation + Br⁻ (intermédiaire)
//   u = 0,75  état de transition 2 (un doublet non liant de Br⁻ attaque le carbone C⁺)
//   u = 1     produit : 2-bromobutane
// Les repères sont en coordonnées mathématiques (y vers le HAUT) ; la vue 2D les retourne à l'affichage.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lisse = t => { t = clamp(t); return t * t * (3 - 2 * t); };          // 0 → 1, pente nulle aux extrémités
export const seg = (u, a, b) => lisse((u - a) / (b - a));                          // « avancement » entre u = a et u = b
export const mix = (a, b, t) => a + (b - a) * t;
export const mixPt = (p, q, t) => p.map((v, i) => mix(v, q[i], t));

// Interpolation lissée entre des clés [[u, valeur], …] (valeur = nombre ou tableau de nombres)
export function interp(cles, u) {
  const n = cles.length;
  if (u <= cles[0][0]) return cles[0][1];
  if (u >= cles[n - 1][0]) return cles[n - 1][1];
  let i = 0;
  while (u > cles[i + 1][0]) i++;
  const [u0, v0] = cles[i], [u1, v1] = cles[i + 1];
  const t = lisse((u - u0) / (u1 - u0));
  return Array.isArray(v0) ? mixPt(v0, v1, t) : mix(v0, v1, t);
}

// ── Profil réactionnel (ordres de grandeur DIDACTIQUES, en kJ·mol⁻¹, pris par rapport aux réactifs) ──
export const JALONS = [
  { id: 'R',   u: 0,    E: 0,   nom: 'Réactifs',                court: 'Réactifs' },
  { id: 'ET1', u: 0.25, E: 100, nom: 'État de transition 1',    court: 'ET₁' },
  { id: 'CB',  u: 0.5,  E: 60,  nom: 'Carbocation (intermédiaire)', court: 'Carbocation' },
  { id: 'ET2', u: 0.75, E: 70,  nom: 'État de transition 2',    court: 'ET₂' },
  { id: 'P',   u: 1,    E: -65, nom: 'Produit',                 court: 'Produit' },
];
export const energie = u => interp(JALONS.map(j => [j.u, j.E]), u);
export const EA1 = JALONS[1].E - JALONS[0].E;          // 100 : barrière de l'étape 1 (la plus haute : étape cinétiquement déterminante)
export const EA2 = JALONS[3].E - JALONS[2].E;          // 10  : barrière de l'étape 2 (recombinaison d'ions, très rapide)
export const DELTA_E = JALONS[4].E - JALONS[0].E;      // −65 : bilan énergétique de la réaction
export const E_CARBOCATION = JALONS[2].E;              // 60  : le carbocation est un intermédiaire d'énergie élevée

// Vitesse de lecture (en u par seconde) : la bille ralentit près des états de transition et s'attarde dans le puits.
export function vitesse(u) {
  const d = Math.min(...[0.25, 0.5, 0.75].map(k => Math.abs(u - k)));
  return 0.1 * (0.25 + 0.75 * clamp(d / 0.06));
}
export const jalonLePlusProche = u => JALONS.reduce((a, j) => Math.abs(j.u - u) < Math.abs(a.u - u) ? j : a, JALONS[0]);

// ── Avancement de chaque événement chimique (communs aux vues 2D et 3D) ──
export const phases = u => ({
  piAffaibli: seg(u, 0.08, 0.2),                       // le doublet π commence à se déplacer vers H
  piPerdu: seg(u, 0.25, 0.5),                          // la liaison π a disparu
  hbrCassee: seg(u, 0.25, 0.5),                        // H–Br rompue
  hbrAmorce: seg(u, 0.10, 0.25),                       // H–Br s'allonge (pointillés)
  htLiaison: seg(u, 0.05, 0.25),                       // liaison C–H en formation (pointillés)
  htFormee: seg(u, 0.25, 0.5),                         // liaison C–H entière
  brApproche: seg(u, 0.6, 0.75),                       // liaison C–Br en formation (pointillés)
  brFormee: seg(u, 0.75, 0.95),                        // liaison C–Br entière
  stereo: seg(u, 0.88, 1),                             // wedge / hash du produit
  lacune: seg(u, 0.3, 0.5) * (1 - seg(u, 0.74, 0.86)), // carré codé : lacune électronique de C⁺
  charge: seg(u, 0.35, 0.5) * (1 - seg(u, 0.7, 0.85)), // charge + de C⁺ (et − de Br⁻)
  polarite: 1 - seg(u, 0.1, 0.25),                     // δ+ / δ− de la liaison H–Br polarisée
});

// ═══════════════════════════ VUE 2D (dessin à plat, formule développée) ═══════════════════════════
const L = 62;                              // longueur d'une liaison C–C (px)
const c30 = L * Math.cos(Math.PI / 6), s30 = L / 2;
const LH = 46;                             // liaison C–H dessinée
export const FIXE2D = {
  C1: [-c30, -s30], C2: [0, 0], C3: [c30, -s30], C4: [2 * c30, 0],
  H3: [c30, -s30 - LH],                    // H du carbone C3, vers le bas (il restera spectateur)
};
export const BR_FINAL_ANGLE = 50, H2_FINAL_ANGLE = 130;       // angles (degrés) de Br et du H de C2 dans le produit
const polaire = (c, r, deg) => [c[0] + r * Math.cos(deg * Math.PI / 180), c[1] + r * Math.sin(deg * Math.PI / 180)];
const BR_P = polaire(FIXE2D.C2, L, BR_FINAL_ANGLE);
const H2_P = polaire(FIXE2D.C2, LH, H2_FINAL_ANGLE);
const ET2_BR = polaire(FIXE2D.C2, 92, BR_FINAL_ANGLE);
const HT_FINAL = [c30, -s30 + LH];         // H transféré, lié à C3 (vers le haut)
export const VACANCE2D = polaire(FIXE2D.C2, L, BR_FINAL_ANGLE);   // le carré codé est exactement là où Br viendra

export const angleVers = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
const norm360 = x => ((x % 360) + 360) % 360;
const lerpAngle = (a, b, t) => { const d = ((b - a + 540) % 360) - 180; return a + d * t; };
const lerpAngleMod90 = (a, b, t) => { const d = ((b - a + 45) % 90 + 90) % 90 - 45; return a + d * t; };   // 4 doublets : symétrie d'ordre 4

// Positions des atomes mobiles : H transféré (Ht), Br, H de C2 (H2)
export function atomes2D(u) {
  const Ht = interp([[0, [c30, 70]], [0.25, [c30, 38]], [0.5, HT_FINAL], [1, HT_FINAL]], u);
  const Br = interp([[0, [c30, 127]], [0.25, [94, 93]], [0.5, [122, 100]], [0.62, [88, 80]], [0.75, ET2_BR], [1, BR_P]], u);
  const H2 = interp([[0, [0, LH]], [0.62, [0, LH]], [0.75, [-12, 43]], [1, H2_P]], u);
  return { ...FIXE2D, Ht, Br, H2 };
}

// Doublets non liants de Br : un doublet = un TRAIT court, tangent à l'atome (convention de Lewis).
// k = 0 est le doublet qui regarde H (puis C) : c'est lui qui devient liaison.
export function doublets2D(u, a = atomes2D(u)) {
  const ph = phases(u);
  const dHBr = angleVers(a.Br, a.Ht);                                  // direction Br → H
  const aCB = angleVers(atomes2D(0.5).Br, HT_FINAL);                  // même direction, figée au carbocation
  const dC = angleVers(a.Br, FIXE2D.C2);                              // direction Br → C⁺
  const base = u < 0.5 ? dHBr : lerpAngleMod90(aCB, dC, seg(u, 0.5, 0.7));
  const liant = u < 0.5 ? ph.hbrCassee : 1 - ph.brFormee;              // le doublet k = 0 est « liant » avant la rupture / après l'attaque
  return [0, 1, 2, 3].map(k => ({ k, ang: norm360(base + 90 * k), op: k === 0 ? liant : 1 }));
}

// Flèches courbes (valables aux jalons) : { de: [x,y], vers: [x,y], courbe: signe }
export const U_FLECHES = [0, 0.25, 0.5, 0.62];   // instants où les flèches courbes sont affichées (doublets bien placés)
export function fleches2D(u) {
  const a = atomes2D(u);
  const milieu = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  if (u < 0.5) {
    const pi = milieu(FIXE2D.C2, FIXE2D.C3);
    return [
      { id: 'pi-vers-H', nom: 'Le doublet π attaque l’atome H', de: [pi[0] + 3, pi[1] + 4], vers: [a.Ht[0] - 4, a.Ht[1] - 5], courbe: 1 },
      { id: 'HBr-vers-Br', nom: 'Le doublet de H–Br passe sur Br', de: milieu(a.Ht, a.Br), vers: [a.Br[0] - 11, a.Br[1] - 11], courbe: -1 },
    ];
  }
  const dir = doublets2D(u, a).find(d => d.k === 0).ang;
  const rad = dir * Math.PI / 180;
  return [{ id: 'Br-vers-C', nom: 'Un doublet non liant de Br⁻ attaque le carbone C⁺', de: [a.Br[0] + 13 * Math.cos(rad), a.Br[1] + 13 * Math.sin(rad)], vers: [VACANCE2D[0] + 6, VACANCE2D[1] - 4], courbe: 1 }];
}

// ═══════════════════════════ VUE 3D (Å, plan moléculaire = plan xy, z = perpendiculaire) ═══════════════════════════
const v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: a => Math.hypot(a[0], a[1], a[2]),
  unit: a => { const n = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / n, a[1] / n, a[2] / n]; },
  mix: (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)],
};
export const V3 = v3;

const A3 = {   // squelette plan du but-2-ène (Å)
  C2: [0, 0, 0], C3: [1.160, -0.670, 0], C1: [-1.299, -0.750, 0], C4: [2.459, 0.080, 0],
  H2: [0, 1.08, 0], H3: [1.160, -1.750, 0],
};

// Trois H d'un méthyle (tétraèdre, 1,09 Å) : axe = direction du carbone vers son voisin
function hMethyle(c, voisin, phi0) {
  const a = v3.unit(v3.sub(voisin, c));
  const ref = Math.abs(a[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const p = v3.unit(v3.cross(a, ref)), q = v3.cross(a, p);
  return [0, 1, 2].map(k => {
    const ph = phi0 + k * 2 * Math.PI / 3;
    const d = v3.add(v3.mul(a, -1 / 3), v3.mul(v3.add(v3.mul(p, Math.cos(ph)), v3.mul(q, Math.sin(ph))), Math.sqrt(8) / 3));
    return v3.add(c, v3.mul(d, 1.09));
  });
}

// Positions 3D de tous les atomes. face = +1 : Br⁻ attaque la face avant (+z) ; −1 : face arrière (−z).
// L'attaque de H–Br (étape 1) se fait toujours par la face +z (l'autre face est équivalente, par symétrie du plan).
export function geom3D(u, face = 1) {
  const f = face >= 0 ? 1 : -1;
  const ph = phases(u);
  const pyr3 = ph.htFormee;                    // C3 devient tétraédrique quand H arrive
  const pyr2 = seg(u, 0.6, 1);                 // C2 devient tétraédrique quand Br arrive
  const Ht = interp([[0, [0.95, -0.35, 3.1]], [0.25, [1.10, -0.55, 1.55]], [0.5, [1.27, -0.37, 1.03]], [1, [1.27, -0.37, 1.03]]], u);
  const BrCles = [
    [0, [1.16, 0.0, 4.45]], [0.25, [1.63, 0.24, 3.02]], [0.5, [2.3, 1.2, 3.3]],
    [0.56, f > 0 ? [0.9, 1.6, 3.8] : [3.4, 1.5, 0.0]],
    [0.64, [-0.7, 0.9, f * 3.2]], [0.75, [-0.43, 0.53, f * 2.30]], [1, [-0.19, 0.23, f * 1.93]],
  ];
  const Br = interp(BrCles, u);
  const H2 = interp([[0, A3.H2], [0.62, A3.H2], [1, [0.58, 0.66, -f * 0.66]]], u);
  const dC = v3.mul(v3.unit(A3.C3), 0.20 * pyr3);   // la liaison C2–C3 passe de 1,34 Å (double) à 1,54 Å (simple)
  const C1 = v3.add(A3.C1, [0, 0, -f * 0.40 * pyr2]);
  const C4 = v3.add(v3.add(A3.C4, dC), [0, 0, -0.30 * pyr3]);
  const H3 = v3.add(v3.add(A3.H3, dC), [0, 0, -0.40 * pyr3]);
  const atomes = {
    C1: { el: 'C', p: C1 }, C2: { el: 'C', p: A3.C2 }, C3: { el: 'C', p: v3.add(A3.C3, dC) }, C4: { el: 'C', p: C4 },
    H2: { el: 'H', p: H2 }, H3: { el: 'H', p: H3 }, Ht: { el: 'H', p: Ht }, Br: { el: 'Br', p: Br },
  };
  hMethyle(C1, A3.C2, 0.4).forEach((p, i) => { atomes['H1' + 'abc'[i]] = { el: 'H', p }; });
  hMethyle(C4, v3.add(A3.C3, dC), 1.2).forEach((p, i) => { atomes['H4' + 'abc'[i]] = { el: 'H', p }; });
  // Liaisons : opacité pleine (op) et pointillée (opPoint)
  const lb = (a, b, op = 1, opPoint = 0, ordre = 1) => ({ a, b, op, opPoint, ordre });
  const liaisons = [
    lb('C1', 'C2'), lb('C3', 'C4'), lb('C2', 'H2'), lb('C3', 'H3'),
    lb('H1a', 'C1'), lb('H1b', 'C1'), lb('H1c', 'C1'), lb('H4a', 'C4'), lb('H4b', 'C4'), lb('H4c', 'C4'),
    lb('C2', 'C3'),
    lb('Ht', 'Br', 1 - ph.hbrAmorce, ph.hbrAmorce * (1 - ph.hbrCassee)),
    lb('Ht', 'C3', ph.htFormee, ph.htLiaison * (1 - ph.htFormee)),
    lb('Br', 'C2', ph.brFormee, ph.brApproche * (1 - ph.brFormee)),
  ];
  const piOp = 1 - seg(u, 0.1, 0.5);           // nuage π : deux lobes de part et d'autre du plan
  const vac = { op: ph.lacune, centre: [0, 0, f * 1.05] };    // carré codé sur la face attaquée
  // Doublets non liants de Br (lobes) : axe = direction Br→H puis Br→C ; k = 0 sur l'axe, 3 autres à 109,5° de l'axe
  const axeHBr = v3.unit(v3.sub(Ht, Br));
  const axeCB = v3.unit(v3.sub([-0.43, 0.53, f * 2.30], [2.3, 1.2, 3.3]));   // approximation stable : Br⁻ libre regarde C⁺ une fois proche
  const axeC = v3.unit(v3.sub(A3.C2, Br));
  const axe = u < 0.5 ? axeHBr : v3.unit(v3.mix(axeHBr, axeC, seg(u, 0.5, 0.7)));
  void axeCB;
  const ref = Math.abs(axe[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const p = v3.unit(v3.cross(axe, ref)), q = v3.cross(axe, p);
  const liant = u < 0.5 ? ph.hbrCassee : 1 - ph.brFormee;
  const doublets = [{ dir: axe, op: liant }];
  for (let k = 0; k < 3; k++) {
    const ang = 2 * Math.PI * k / 3;
    const perp = v3.add(v3.mul(p, Math.cos(ang)), v3.mul(q, Math.sin(ang)));
    doublets.push({ dir: v3.unit(v3.add(v3.mul(axe, -0.334), v3.mul(perp, 0.943))), op: 1 });   // 109,5° de l'axe
  }
  return { atomes, liaisons, piOp, vac, doublets, face: f, ph };
}

// ═══════════════════════════ STÉRÉOCHIMIE ═══════════════════════════
// Descripteur CIP du centre C2 du produit : priorités Br > C3 (CH₂CH₃) > C1 (CH₃) > H
export function descripteurCIP(centre, a, b, c) {
  const det = v3.dot(v3.sub(a, centre), v3.cross(v3.sub(b, centre), v3.sub(c, centre)));
  return det < 0 ? 'R' : 'S';
}
export const descripteurProduit = face => {
  const g = geom3D(1, face).atomes;
  return descripteurCIP(g.C2.p, g.Br.p, g.C3.p, g.C1.p);
};
// Le produit obtenu par chaque face : l'autre face donne l'énantiomère (mélange racémique si les deux faces sont équiprobables)
export const PRODUITS = { 1: { face: 1, cip: descripteurProduit(1) }, [-1]: { face: -1, cip: descripteurProduit(-1) } };
export const POURCENT_RACEMIQUE = 50;
