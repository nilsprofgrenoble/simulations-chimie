// Échographe 2D : balayage sectoriel (suite de la simulation « Échographe », sim 88).
// Modèle PUR (aucune dépendance à React), testé par echo2D.test.mjs.
// Mêmes lois que echoModele.js : niveau d'un écho = 10·log10(R·T²) − absorption aller-retour,
// absorption α₁·f par cm, seuil de détection −80 dB, appareil qui suppose 1540 m/s partout.
// Convention de temps : tous les temps stockés sont des temps ALLER-RETOUR (t = 2d/v, en µs).
import { V_APPAREIL, SEUIL_DB, MILIEUX, R_INTERFACE, tDB } from './echoModele.js';
export { V_APPAREIL, SEUIL_DB };

// Milieux : v (m/s), a1 (dB·cm⁻¹·MHz⁻¹), sc = force du grain du tissu (speckle, cosmétique).
// Les cinq premiers viennent de la sim 88 (valeurs identiques, non modifiables).
export const MIL = {
  peau:    { v: MILIEUX.peau.v,    a1: MILIEUX.peau.alpha1,    sc: 0.5 },
  graisse: { v: MILIEUX.graisse.v, a1: MILIEUX.graisse.alpha1, sc: 0.6 },
  muscle:  { v: MILIEUX.muscle.v,  a1: MILIEUX.muscle.alpha1,  sc: 1.0 },
  organe:  { v: MILIEUX.organe.v,  a1: MILIEUX.organe.alpha1,  sc: 1.0 },
  kyste:   { v: 1570, a1: 0.08, sc: 0.02 },   // liquide : presque pas d'échos internes → sombre
  detail:  { v: 1590, a1: 0.7, sc: 0.8 },
  uterus:  { v: 1550, a1: 0.7, sc: 0.8 },
  liquid:  { v: 1500, a1: 0.05, sc: 0.02 },   // liquide amniotique : sombre
  os:      { v: 3200, a1: 4.0, sc: 0.05 },    // os : très réfléchissant, très absorbant
  cerveau: { v: 1540, a1: 0.6, sc: 0.55 },
  foetus:  { v: 1540, a1: 0.6, sc: 0.8 },     // tissus mous du fœtus (corps, membres)
};
export const R_INT = {
  'air/peau': R_INTERFACE['air/peau'], 'gel/peau': R_INTERFACE['gel/peau'], 'peau/graisse': R_INTERFACE['peau/graisse'],
  'graisse/muscle': R_INTERFACE['graisse/muscle'], 'muscle/organe': R_INTERFACE['muscle/organe'],
  'muscle/uterus': 0.03, 'uterus/liquid': 0.05, 'uterus/organe': 0.02,
  'organe/kyste': 0.025, 'organe/detail': 0.02,
  'liquid/os': 0.45, 'os/cerveau': 0.35, 'liquid/cerveau': 0.02, 'liquid/foetus': 0.02, 'os/foetus': 0.35,
};
export const rOf = (a, b) => R_INT[a + '/' + b] ?? R_INT[b + '/' + a] ?? 0.005;
// tAR : temps aller-RETOUR (µs) → profondeur « apparente » (cm), l'appareil supposant 1540 m/s
export const dAppCm = tAR => V_APPAREIL * tAR / 2 * 1e-4;

const inCercle = (x, z, c, r) => (x - c[0]) ** 2 + (z - c[1]) ** 2 < r * r;
const inEll = (x, z, c, rx, rz) => ((x - c[0]) / rx) ** 2 + ((z - c[1]) / rz) ** 2 < 1;
// Ellipse tournée : renvoie la valeur normalisée (u/rx)² + (v/rz)² après recentrage et rotation
function inEllR(x, z, c, rx, rz, aDeg) {
  const a = aDeg * Math.PI / 180, dx = x - c[0], dz = z - c[1];
  const u = dx * Math.cos(a) + dz * Math.sin(a), v = -dx * Math.sin(a) + dz * Math.cos(a);
  return (u / rx) ** 2 + (v / rz) ** 2;
}

// ---------- Scènes ----------
export const SCENES = {
  organe: {
    nom: 'Coupe d’organe',
    zPeau: 0.25,
    zGraisse: x => 1.3 + 0.25 * Math.sin(x * 0.9),
    zMuscle: x => 3.4 + 0.4 * Math.sin(x * 0.6 + 1),
    mediumAt(x, z) {
      if (z < this.zPeau) return 'peau';
      if (z < this.zGraisse(x)) return 'graisse';
      if (z < this.zMuscle(x)) return 'muscle';
      if (inCercle(x, z, [2.1, 5.2], 0.85)) return 'kyste';
      if (inCercle(x, z, [-1.7, 5.0], 0.18) || inCercle(x, z, [-1.7, 5.35], 0.18)) return 'detail';
      return 'organe';
    },
    // structures à étiqueter : angle du rayon qui la rencontre + nom du milieu touché
    structures: [
      { angle: Math.atan2(2.1, 5.2) * 180 / Math.PI, cible: 'kyste', label: 'kyste (liquide)' },
      { angle: Math.atan2(-1.7, 5.17) * 180 / Math.PI, cible: 'detail', label: '2 détails' },
    ],
    essais: [
      'Sans gel : 99 % de l’énergie se réfléchit à l’entrée — l’image est noire sous la peau.',
      'Fréquence basse (2 MHz) : ça pénètre loin, mais les deux détails fusionnent.',
      'Fréquence haute (8 MHz) : nets près de la sonde… mais le fond disparaît.',
      'Le kyste (liquide) paraît sombre : presque aucun écho interne.',
      'La graisse (1 450 m/s) décale en profondeur tout ce qui est dessous : l’appareil suppose 1540 m/s partout.',
    ],
  },
  foetus: {
    nom: 'Échographie obstétricale',
    zPeau: 0.25,
    zGraisse: x => 1.1 + 0.2 * Math.sin(x * 1.1 + 0.5),
    zMuscle: x => 2.9 + 0.35 * Math.sin(x * 0.7 + 2),
    // Fœtus DE PROFIL (comme l'image de référence) : tête à gauche, corps vers la droite,
    // visage (nez, menton) vers le bas, dos en haut avec la colonne en pointillé brillant.
    ut: [0.3, 5.6, 4.2, 2.8],          // paroi externe de l'utérus : centre + rayons
    utIn: [0.3, 5.6, 3.9, 2.5],        // paroi interne
    tete: [-1.5, 5.5, 1.05, 0.86],     // tête : centre + rayons externe (os) et interne (cerveau)
    menton: [-0.72, 6.05, 0.45, 0.28, 20],  // menton : petite ellipse osseuse sous la face
    nez: [-0.95, 6.42, 0.1],           // nez : petit relief osseux qui dépasse du crâne, sous la face
    corps: [1.0, 6.0, 1.5, 0.65, 8],   // corps : ellipse allongée (tissu granuleux), légèrement inclinée
    bras: [0.55, 6.7, 0.55, 0.2, 35],       // bras replié vers le ventre (humérus dedans)
    humerus: [0.55, 6.7, 0.38, 0.06, 35],
    jambe1: [2.75, 6.45, 0.9, 0.26, -10],   // jambe arrière (fémur dedans)
    femur1: [2.75, 6.45, 0.66, 0.06, -10],
    jambe2: [2.55, 5.95, 0.85, 0.24, -4],   // jambe avant
    femur2: [2.55, 5.95, 0.58, 0.055, -4],
    colonne: [[-0.45, 5.62], [0.05, 5.56], [0.55, 5.5], [1.05, 5.45], [1.55, 5.42], 0.11],  // vertèbres le long du dos
    mediumAt(x, z) {
      if (z < this.zPeau) return 'peau';
      if (z < this.zGraisse(x)) return 'graisse';
      if (z < this.zMuscle(x)) return 'muscle';
      const [cx, cz, rx, rz] = this.ut, [ix, iz, irx, irz] = this.utIn;
      if (!inEll(x, z, [cx, cz], rx, rz)) return 'organe';       // tissu maternel
      if (!inEll(x, z, [ix, iz], irx, irz)) return 'uterus';     // paroi de l'utérus
      const [tx, tz, tr, tir] = this.tete;
      const d2 = (x - tx) ** 2 + (z - tz) ** 2;
      if (d2 < tr * tr) return d2 < tir * tir ? 'cerveau' : 'os';           // crâne
      const [nx, nz, nr] = this.nez;
      if (inCercle(x, z, [nx, nz], nr)) return 'os';                        // nez
      const [mx, mz, mrx, mrz, mang] = this.menton;
      const u = inEllR(x, z, [mx, mz], mrx, mrz, mang);
      if (u < 1) return u > 0.36 ? 'os' : 'foetus';                         // menton
      // os d'abord (vertèbres, fémurs, humérus), sinon ils seraient « avalés » par les tissus mous qui les entourent
      const col = this.colonne;
      for (let i = 0; i < col.length - 1; i++) if (inCercle(x, z, col[i], col[col.length - 1])) return 'os';   // vertèbres
      for (const o of ['femur1', 'femur2', 'humerus']) {
        const [ox, oz, orx, orz, oang] = this[o];
        if (inEllR(x, z, [ox, oz], orx, orz, oang) < 1) return 'os';
      }
      const [bx, bz, brx, brz, bang] = this.corps;
      if (inEllR(x, z, [bx, bz], brx, brz, bang) < 1) return 'foetus';        // corps (tissu mou)
      for (const t of ['jambe1', 'jambe2', 'bras']) {
        const [lx, lz, lrx, lrz, lang] = this[t];
        if (inEllR(x, z, [lx, lz], lrx, lrz, lang) < 1) return 'foetus';       // membres (tissu mou)
      }
      return 'liquid';
    },
    structures: [
      { angle: -15, cible: 'os', label: 'tête (os du crâne)' },
      { angle: -35, cible: 'liquid', label: 'liquide amniotique', dedans: true },
      { angle: 1.5, cible: 'os', label: 'colonne (dos)' },
      { angle: 12, cible: 'foetus', label: 'corps' },
      { angle: 23, cible: 'os', label: 'jambe (fémur)' },
      { angle: 4.7, cible: 'foetus', label: 'bras' },
    ],
    essais: [
      'Le bébé est de profil : tête à gauche, corps et jambes vers la droite, visage vers le bas (nez, menton), dos en haut.',
      'La colonne : un chapelet de points brillants le long du dos ; les fémurs : deux petits segments brillants dans les jambes.',
      'Avec les calipers : mesurez le fémur (les ✕ jaunes se déplacent au doigt).',
      'L’os (3 200 m/s) paraît plus mince qu’en réalité : l’appareil suppose 1540 m/s.',
    ],
  },
};

// Générateur pseudo-aléatoire déterministe (même tir → même grain)
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Marche le long d'un rayon ; renvoie les franchissements d'interface et (si voulu) le grain du tissu.
// Franchissement : { s, tUs, de, vers } — placé au demi-pas près de l'interface.
export function marcher(scene, thetaDeg, { grain = false, f = 4, gel = true, maxS = 9.7 } = {}) {
  const th = thetaDeg * Math.PI / 180, st = Math.sin(th), ct = Math.cos(th);
  const ds = 0.02;
  let tUs = 0, prev = gel ? 'peau' : 'air';
  const pass = [], speckle = [];
  const rand = mulberry32(1013 + Math.round((thetaDeg + 90) * 57.1));
  for (let s = ds / 2; s < maxS; s += ds) {
    const x = st * s, z = ct * s;
    const m = scene.mediumAt(x, z);
    if (m === null) break;
    if (m !== prev) {
      pass.push({ s, tUs: 2 * tUs, de: prev, vers: m });   // temps aller-retour
      prev = m;
    }
    tUs += ds / MIL[m].v * 1e4;
    if (grain && s > 0.35 && MIL[m].sc > 0.05) {
      const niv = tDB(MIL[m].sc * 0.002) - 2 * MIL[m].a1 * f * s + (rand() - 0.5) * 14;
      if (niv > SEUIL_DB + 12) speckle.push({ tUs: 2 * tUs, niv: Math.min(-6, niv) });
    }
  }
  return { pass, speckle };
}

// Variante avec absorption exacte pas à pas (utilisée pour l'image : plus fidèle)
export function tirerExacts(scene, thetaDeg, f, gel) {
  const th = thetaDeg * Math.PI / 180, st = Math.sin(th), ct = Math.cos(th);
  const ds = 0.02, maxS = 9.7;
  let tUs = 0, absOne = 0, tr = 1, prev = gel ? 'peau' : 'air';
  const events = [], speckle = [];
  const rand = mulberry32(1013 + Math.round((thetaDeg + 90) * 57.1));
  for (let s = ds / 2; s < maxS; s += ds) {
    const x = st * s, z = ct * s;
    const m = scene.mediumAt(x, z);
    if (m === null) break;
    if (m !== prev) {
      const R = rOf(prev, m);
      const niveau = tDB(R * tr * tr) - 2 * absOne;
      events.push({ tUs: 2 * tUs, niveau, R, detecte: niveau >= SEUIL_DB });   // temps aller-retour
      tr *= 1 - R;
      prev = m;
    }
    absOne += MIL[m].a1 * f * ds;
    tUs += ds / MIL[m].v * 1e4;
    if (s > 0.35 && MIL[m].sc > 0.05) {
      const niv = tDB(MIL[m].sc * 0.002) - 2 * absOne + (rand() - 0.5) * 14;
      if (niv > SEUIL_DB + 12) speckle.push({ tUs: 2 * tUs, niv: Math.min(-6, niv) });
    }
  }
  return { thetaDeg, events, speckle };
}


// Position APPARENTE (angle, profondeur affichée en cm) d'un point réel (x, z) : même marche que le tir.
export function positionApparente(scene, x, z, ds = 0.01) {
  const r = Math.hypot(x, z), th = Math.atan2(x, z), st = Math.sin(th), ct = Math.cos(th);
  let tUs = 0;
  for (let s = ds / 2; s < r; s += ds) { const m = scene.mediumAt(st * s, ct * s); if (m === null) break; tUs += ds / MIL[m].v * 1e4; }
  return { thetaDeg: th * 180 / Math.PI, dApp: dAppCm(2 * tUs), dVraie: r };
}
// Épaisseur réelle (cm) d'un milieu traversé par le rayon d'angle theta.
export function epaisseurTraversee(scene, thetaDeg, milieu, ds = 0.01) {
  const th = thetaDeg * Math.PI / 180, st = Math.sin(th), ct = Math.cos(th);
  let e = 0;
  for (let s = ds / 2; s < 9.7; s += ds) if (scene.mediumAt(st * s, ct * s) === milieu) e += ds;
  return e;
}
