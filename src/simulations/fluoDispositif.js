// Vue « Dispositif et spectre » de la simulation 301 : relie une transition du diagramme de Perrin-Jablonski, la place du détecteur
// (dans l'axe : absorption ; à 90° : fluorescence et phosphorescence) et l'allure du spectre obtenu. Fonctions pures, testées par fluoDispositif.test.mjs.
// Hypothèses : celles des tirages (fluoTirages.js) : structure vibronique schématique à 5 sous-niveaux, mêmes facteurs de Franck-Condon à l'absorption et à
// l'émission, règle de Kasha, bandes élargies de 0,14 eV (spectres en solution : les sous-niveaux de vibration ne sont plus résolus), E(eV) × λ(nm) = 1243. Les courbes sont les spectres attendus (sans bruit) ; les photons animés sont
// des événements pseudo-aléatoires reproductibles (fonction de leur numéro). Le monochromateur de détection laisse passer ± FEN_MONO nm autour de sa longueur d'onde.
import { gauss } from './fluoModele.js';
import * as X from './fluoTirages.js';

export const MODES = [
  { id: 'abs', nom: 'Absorption : dans l’axe' },
  { id: 'em', nom: 'Émission : à 90°' },
  { id: 'ex', nom: 'Excitation : à 90°' },
  { id: 'ph', nom: 'Phosphorescence' },
];
export const DOMAINE = { abs: [290, 430], ex: [290, 430], em: [370, 620], ph: [370, 620] };   // longueurs d'onde balayées (nm)
export const FEN_MONO = 6;                                                                       // demi-fente du monochromateur de détection (nm)
const Een = lam => X.HC / lam;
export const lamDefaut = (mode, mol) => (mode === 'em' ? (mol.id === 'A' ? 450 : 420) : mode === 'ph' ? 520 : 350);
export const lamsRaies = (mol, type) => (type === 'abs' ? X.raiesAbs(mol) : type === 'fluo' ? X.raiesFluo(mol) : X.raiesPhos(mol)).map(X.lamDe);
export const fixeDefaut = (mode, mol) => (mode === 'ex' ? Math.round(lamsRaies(mol, 'fluo')[2]) : 350);
export const modeValide = (mode, mol) => !(mode === 'ph' && !mol.T);

// ---------- spectres attendus : BANDES (largeur 0,14 eV), intensités relatives (0 à 1) ----------
export const SIGB = X.SIG;
const gE = (E, E0) => gauss(E, E0, SIGB);
const densAbs = (mol, E) => X.raiesAbs(mol).reduce((s, E0, v) => s + X.FC[v] * gE(E, E0), 0);
const pdfB = (raies, E) => raies.reduce((s, E0, v) => s + X.FC[v] * gE(E, E0) / (SIGB * Math.sqrt(2 * Math.PI)), 0);
const cache = {};
const maxi = (cle, f, lo, hi, pas = 1) => (cache[cle] ??= (() => { let m = 0; for (let l = lo; l <= hi; l += pas) m = Math.max(m, f(l)); return m; })());
export const absRel = (mol, lam) => densAbs(mol, Een(lam)) / maxi(mol.id + 'abs', l => densAbs(mol, Een(l)), 250, 500, 0.5);
const jac = l => X.HC / (l * l);
const fluoNm = (mol, l) => mol.rend.fluo * pdfB(X.raiesFluo(mol), Een(l)) * jac(l);
const phosNm = (mol, l) => (mol.T ? mol.rend.cis * mol.T.phos * pdfB(X.raiesPhos(mol), Een(l)) * jac(l) : 0);
const emNm = (mol, l) => fluoNm(mol, l) + phosNm(mol, l);
const fenetre = (mol, lam) => { let s = 0; for (let l = lam - FEN_MONO; l <= lam + FEN_MONO; l += 0.5) s += emNm(mol, l) * 0.5; return s; };
// lamBal : longueur d'onde balayée ; fixe : longueur d'onde fixée (excitation pour 'em' et 'ph', détection pour 'ex')
export function signal(mol, mode, lamBal, fixe) {
  if (mode === 'abs') return absRel(mol, lamBal);
  if (mode === 'ex') return absRel(mol, lamBal) * fenetre(mol, fixe) / maxi(mol.id + 'ex', l => fenetre(mol, l), 370, 620);
  if (mode === 'em') return absRel(mol, fixe) * emNm(mol, lamBal) / maxi(mol.id + 'em', l => emNm(mol, l), 370, 620);
  return mol.T ? absRel(mol, fixe) * phosNm(mol, lamBal) / maxi(mol.id + 'ph', l => phosNm(mol, l), 370, 620) : 0;
}
export function courbe(mol, mode, fixe, pas = 2) {
  const [lo, hi] = DOMAINE[mode], out = [];
  for (let l = lo; l <= hi + 1e-9; l += pas) out.push({ lam: l, s: signal(mol, mode, l, fixe) });
  return out;
}

// ---------- transition dominante mise en valeur sur le diagramme (la plus proche de la longueur d'onde réglée) ----------
const SEUIL_SIGNAL = 0.05;
const proche = (lams, lam) => { let k = 0, d = Infinity; lams.forEach((l, i) => { const e = Math.abs(Een(l) - Een(lam)); if (e < d) { d = e; k = i; } }); return k; };
// renvoie { abs, fluo, phos } : sous-niveau d'arrivée (v′ pour l'absorption, v pour l'émission), -1 si le signal est négligeable
export function transitions(mol, mode, lamBal, fixe) {
  const nul = { abs: -1, fluo: -1, phos: -1 };
  if (signal(mol, mode, lamBal, fixe) < SEUIL_SIGNAL) return nul;
  const la = lamsRaies(mol, 'abs'), lf = lamsRaies(mol, 'fluo'), lp = lamsRaies(mol, 'phos');
  if (mode === 'abs') return { ...nul, abs: proche(la, lamBal) };
  if (mode === 'ex') return { ...nul, abs: proche(la, lamBal), fluo: proche(lf, fixe) };
  if (mode === 'ph') return { ...nul, phos: proche(lp, lamBal) };
  const phos = mol.T && phosNm(mol, lamBal) > fluoNm(mol, lamBal);
  return { abs: proche(la, fixe), fluo: phos ? -1 : proche(lf, lamBal), phos: phos ? proche(lp, lamBal) : -1 };
}

// ---------- un photon animé : événement reproductible ----------
const hash = (i, k) => { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };
const tirerV = u => { let s = 0; for (let v = 0; v < X.NV; v++) { s += X.FC[v]; if (u < s) return v; } return X.NV - 1; };
// un photon de longueur d'onde lamIn, tiré de façon reproductible (même modèle de bandes que les courbes)
function photonBande(mol, lamIn, i) {
  if (hash(i, 10) >= X.P_ABS_MAX * absRel(mol, lamIn)) return { absorbe: false };
  const E = Een(lamIn), poids = X.raiesAbs(mol).map((E0, v) => X.FC[v] * gE(E, E0)), tot = poids.reduce((a, b) => a + b, 0);
  let u = hash(i, 11) * tot, vAbs = 0; for (; vAbs < X.NV - 1; vAbs++) { u -= poids[vAbs]; if (u < 0) break; }
  const g = () => Math.sqrt(-2 * Math.log(1 - hash(i, 14))) * Math.cos(2 * Math.PI * hash(i, 15)), r = hash(i, 12);
  if (r < mol.rend.fluo) { const v = tirerV(hash(i, 13)); return { absorbe: true, vAbs, voie: 'fluo', v, Eem: mol.E00 - v * mol.hw + SIGB * g() }; }
  if (r < mol.rend.fluo + mol.rend.cis) {
    if (hash(i, 16) < mol.T.phos) { const v = tirerV(hash(i, 13)); return { absorbe: true, vAbs, voie: 'phos', v, Eem: mol.T.E00 - v * mol.hw + SIGB * g() }; }
    return { absorbe: true, vAbs, voie: 'nrT' };
  }
  return { absorbe: true, vAbs, voie: 'nr' };
}
export function evenement(mol, mode, lamBal, fixe, i) {
  if (mode === 'ph') {
    if (!mol.T) return { absorbe: false, voie: null, passe: false, lamIn: null, lamOut: null, lamDet: lamBal };
    if (hash(i, 1) >= mol.T.phos) return { absorbe: true, voie: 'nrT', passe: false, lamIn: null, lamOut: null, lamDet: lamBal };
    const v = tirerV(hash(i, 2)), g = Math.sqrt(-2 * Math.log(1 - hash(i, 3))) * Math.cos(2 * Math.PI * hash(i, 4));
    const lamOut = X.lamDe(mol.T.E00 - v * mol.hw + SIGB * g);
    return { absorbe: true, voie: 'phos', v, lamIn: null, lamOut, lamDet: lamBal, passe: Math.abs(lamOut - lamBal) <= FEN_MONO };
  }
  const lamIn = mode === 'abs' || mode === 'ex' ? lamBal : fixe, lamDet = mode === 'ex' ? fixe : lamBal;
  const ev = photonBande(mol, lamIn, i), lamOut = ev.Eem ? X.lamDe(ev.Eem) : null;
  return { ...ev, lamIn, lamOut, lamDet, passe: mode === 'abs' ? !ev.absorbe : lamOut != null && Math.abs(lamOut - lamDet) <= FEN_MONO };
}
const NB = ' ', nm = l => `${Math.round(l)}${NB}nm`;
export function texteEvenement(ev, mode) {
  if (mode === 'ph') {
    if (ev.voie == null) return 'cette molécule ne phosphoresce pas : rien à mesurer';
    if (ev.voie === 'nrT') return 'lampe coupée : une molécule dans T₁ revient à S₀ sans photon (chaleur)';
    return `lampe coupée : une molécule dans T₁ phosphoresce (T₁ → S₀ v${NB}=${NB}${ev.v}) à ${nm(ev.lamOut)} ; ${ev.passe ? `le monochromateur de détection (${nm(ev.lamDet)}) laisse passer ce photon : le détecteur le compte` : `le monochromateur de détection est réglé sur ${nm(ev.lamDet)} : il arrête ce photon`}`;
  }
  if (mode === 'abs') return ev.absorbe ? `photon de ${nm(ev.lamIn)} absorbé (S₀ v${NB}=${NB}0 → S₁ v′${NB}=${NB}${ev.vAbs}) : il n’atteint pas le détecteur` : `photon de ${nm(ev.lamIn)} non absorbé : il traverse l’échantillon et le détecteur le reçoit`;
  if (!ev.absorbe) return `photon de ${nm(ev.lamIn)} non absorbé : il traverse l’échantillon sans rien émettre`;
  const abs = `photon de ${nm(ev.lamIn)} absorbé (S₀ v${NB}=${NB}0 → S₁ v′${NB}=${NB}${ev.vAbs})`;
  if (ev.voie === 'nr' || ev.voie === 'nrT') return `${abs}, puis la molécule revient à S₀ sans photon (chaleur)`;
  const em = ev.voie === 'fluo' ? `fluorescence (S₁ v′${NB}=${NB}0 → S₀ v${NB}=${NB}${ev.v})` : `croisement intersystème puis phosphorescence (T₁ → S₀ v${NB}=${NB}${ev.v})`;
  return `${abs}, ${em} à ${nm(ev.lamOut)} ; ${ev.passe ? `le monochromateur de détection (${nm(ev.lamDet)}) laisse passer ce photon : le détecteur le compte` : `le monochromateur de détection est réglé sur ${nm(ev.lamDet)} : il arrête ce photon`}`;
}

// ---------- défi : quel type de mesure faut-il choisir ? ----------
const SITUATIONS = [
  { mode: 'abs', txt: 'Vous voulez savoir quelles longueurs d’onde l’échantillon absorbe.', expl: 'On compare la lumière avant et après l’échantillon : le détecteur est dans l’axe du faisceau et on balaie l’excitation.' },
  { mode: 'em', txt: 'Vous éclairez l’échantillon à 350 nm et vous voulez connaître les longueurs d’onde des photons qu’il émet.', expl: 'Le détecteur est à 90° pour ne pas recevoir le faisceau : on fixe l’excitation et on balaie le monochromateur de détection.' },
  { mode: 'ex', txt: 'Vous voulez savoir quelles longueurs d’onde d’excitation produisent de la fluorescence à 450 nm.', expl: 'On fixe la détection à 450 nm et on balaie l’excitation : le signal a l’allure du spectre d’absorption.' },
  { mode: 'ph', txt: 'Vous voulez mesurer la lumière qui reste visible plusieurs secondes après avoir coupé la lampe.', expl: 'La fluorescence est éteinte : seule la phosphorescence (T₁ → S₀) subsiste, mesurée à 90° avec la lampe coupée.' },
];
export const tirageDefiDispositif = rnd => { const s = SITUATIONS[Math.floor(rnd() * SITUATIONS.length)]; return { kind: 'dispositif', txt: s.txt, rep: s.mode, expl: s.expl, nomRep: MODES.find(m => m.id === s.mode).nom }; };

// ---------- vue unifiée (montage, diagramme à l'échelle, spectre) ----------
export const A_MAX = 0.8;                                         // absorbance au maximum de la bande (cuve de 1 cm), mesure d'absorption
export const absorbance = (mol, lam) => A_MAX * absRel(mol, lam);
export const emissionDominante = (mol, lam) => (mol.T && phosNm(mol, lam) > fluoNm(mol, lam) ? 'phos' : 'fluo');
// couleur perçue d'une lumière de longueur d'onde lam (nm) ; l'UV, invisible, est représenté en violet
export function couleurLam(lam, f = 0.82) {
  if (lam < 380) return f < 0.8 ? '#7c3aed' : '#8b5cf6';
  let r = 0, g = 0, b = 0;
  if (lam < 440) { r = (440 - lam) / 60; b = 1; } else if (lam < 490) { g = (lam - 440) / 50; b = 1; } else if (lam < 510) { g = 1; b = (510 - lam) / 20; }
  else if (lam < 580) { r = (lam - 510) / 70; g = 1; } else if (lam < 645) { r = 1; g = (645 - lam) / 65; } else r = 1;
  const h = v => Math.round(255 * Math.min(1, Math.max(0, v)) * f).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}
