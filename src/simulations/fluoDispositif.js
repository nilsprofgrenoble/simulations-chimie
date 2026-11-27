// Modèle de la vue « Du photon au spectre » de la simulation 301. Fonctions pures, testées par fluoDispositif.test.mjs.
// Structure vibronique schématique (fluoTirages.js) : un seul mode de vibration, 5 sous-niveaux, mêmes facteurs de Franck-Condon à l'absorption
// et à l'émission, règle de Kasha, E(eV) × λ(nm) = 1243.
// Deux réglages « physiques » (objet opt) :
//  - sig : largeur (écart-type, eV) de chaque raie vibronique, selon les CONDITIONS (gaz froid : raies ; solvant apolaire : structure ; solution : bande) ;
//  - fente : bande passante des monochromateurs (nm) ; le signal observé est la moyenne du spectre vrai sur cette bande passante
//    (intensités ramenées à la largeur de fente : seul l'effet sur la résolution est montré).
// Intensités relatives : chaque spectre est ramené au maximum du spectre vrai (sans effet de fente), mêmes conditions.
import { gauss } from './fluoModele.js';
import * as X from './fluoTirages.js';

export const MODES = [
  { id: 'abs', nom: 'Absorption : dans l’axe' },
  { id: 'em', nom: 'Émission : à 90°' },
  { id: 'ex', nom: 'Excitation : à 90°' },
  { id: 'ph', nom: 'Phosphorescence' },
];
export const CONDITIONS = {
  gaz: { id: 'gaz', nom: 'Raies (gaz très froid)', court: 'Raies', sig: 0.012, cause: 'Raies (gaz très froid) : molécules isolées et très froides : chaque transition donne une raie fine. Ici, un seul mode de vibration : on voit une raie par sous-niveau.' },
  rigide: { id: 'rigide', nom: 'Structure (solvant apolaire)', court: 'Structure', sig: 0.05, cause: 'Structure : molécule rigide (type anthracène ou pyrène) dans un solvant apolaire : chaque raie s’élargit, mais la structure vibrationnelle reste visible.' },
  solution: { id: 'solution', nom: 'Bande (solution usuelle)', court: 'Bande', sig: X.SIG, cause: 'Bande (solution usuelle) : chaque molécule a un entourage de solvant différent et une vraie molécule a de nombreux modes de vibration ; les raies se fondent en une bande.' },
};
export const FENTES = [1, 5, 10];
export const OPT0 = { sig: X.SIG, fente: 5 };
export const SCAN = { abs: [285, 430], ex: [285, 430], em: [370, 640], ph: [400, 640] };
export const DOMAINE = SCAN;
export const FEN_MONO = OPT0.fente / 2;
const Een = lam => X.HC / lam;
export const lamDefaut = (mode, mol) => (mode === 'em' ? (mol.id === 'A' ? 450 : 420) : mode === 'ph' ? 520 : 350);
export const lamsRaies = (mol, type) => (type === 'abs' ? X.raiesAbs(mol) : type === 'fluo' ? X.raiesFluo(mol) : X.raiesPhos(mol)).map(X.lamDe);
export const fixeDefaut = (mode, mol) => (mode === 'ex' ? Math.round(X.lamMaxEmission(mol) / 5) * 5 : 350);
export const modeValide = (mode, mol) => !(mode === 'ph' && !mol.T);
export const pasDe = sig => (sig < 0.03 ? 0.2 : sig < 0.08 ? 0.5 : 1);

// ---------- spectres vrais (sans fente) ----------
const densAbs = (mol, E, s) => X.raiesAbs(mol).reduce((t, E0, v) => t + X.FC[v] * gauss(E, E0, s), 0);
const pdf = (raies, E, s) => raies.reduce((t, E0, v) => t + X.FC[v] * gauss(E, E0, s) / (s * Math.sqrt(2 * Math.PI)), 0);
const jac = l => X.HC / (l * l);
const fluoNm = (mol, l, s) => mol.rend.fluo * pdf(X.raiesFluo(mol), Een(l), s) * jac(l);
const phosNm = (mol, l, s) => (mol.T ? mol.rend.cis * mol.T.phos * pdf(X.raiesPhos(mol), Een(l), s) * jac(l) : 0);
const emNm = (mol, l, s) => fluoNm(mol, l, s) + phosNm(mol, l, s);
const memo = new Map();
const maxSur = (cle, f, lo, hi, pas) => { if (!memo.has(cle)) { let m = 0; for (let l = lo; l <= hi; l += pas) m = Math.max(m, f(l)); memo.set(cle, m || 1); } return memo.get(cle); };
// moyenne sur la bande passante (rectangulaire, largeur fente)
const lisse = (f, lam, fente) => { if (!fente || fente <= 0.05) return f(lam); const n = Math.max(5, Math.ceil(fente / 0.3)); let t = 0; for (let i = 0; i < n; i++) t += f(lam - fente / 2 + fente * (i + 0.5) / n); return t / n; };
const absVrai = (mol, l, s) => densAbs(mol, Een(l), s) / maxSur(`a|${mol.id}|${s}`, x => densAbs(mol, Een(x), s), 250, 500, pasDe(s) / 2);
export const absRel = (mol, lam, opt = OPT0) => lisse(l => absVrai(mol, l, opt.sig), lam, opt.fente);
const emVrai = (mol, l, s) => emNm(mol, l, s) / maxSur(`e|${mol.id}|${s}`, x => emNm(mol, x, s), 370, 660, pasDe(s) / 2);
const phVrai = (mol, l, s) => (mol.T ? phosNm(mol, l, s) / maxSur(`p|${mol.id}|${s}`, x => phosNm(mol, x, s), 370, 660, pasDe(s) / 2) : 0);
export const emRel = (mol, lam, opt = OPT0) => lisse(l => emVrai(mol, l, opt.sig), lam, opt.fente);       // forme de la bande d'émission (lampe allumée)
export const phRel = (mol, lam, opt = OPT0) => lisse(l => phVrai(mol, l, opt.sig), lam, opt.fente);
// lamBal : longueur d'onde balayée ; fixe : longueur d'onde fixée (excitation pour 'em' et 'ph', détection pour 'ex')
export function signal(mol, mode, lamBal, fixe, opt = OPT0) {
  if (mode === 'abs') return absRel(mol, lamBal, opt);
  if (mode === 'ex') return absRel(mol, lamBal, opt) * emRel(mol, fixe, opt);
  if (mode === 'em') return absRel(mol, fixe, opt) * emRel(mol, lamBal, opt);
  return mol.T ? absRel(mol, fixe, opt) * phRel(mol, lamBal, opt) : 0;
}
const memoC = new Map();
export function courbe(mol, mode, fixe, pas, opt = OPT0) {
  const p = pas ?? pasDe(opt.sig), cle = `${mol.id}|${mode}|${fixe}|${p}|${opt.sig}|${opt.fente}`;
  if (memoC.has(cle)) return memoC.get(cle);
  const [lo, hi] = SCAN[mode], out = [];
  for (let l = lo; l <= hi + 1e-9; l += p) out.push({ lam: Math.round(l * 100) / 100, s: signal(mol, mode, l, fixe, opt) });
  if (memoC.size > 60) memoC.clear();
  memoC.set(cle, out);
  return out;
}

// ---------- transition dominante mise en valeur sur le diagramme ----------
const SEUIL_SIGNAL = 0.05;
const proche = (lams, lam) => { let k = 0, d = Infinity; lams.forEach((l, i) => { const e = Math.abs(Een(l) - Een(lam)); if (e < d) { d = e; k = i; } }); return k; };
export function transitions(mol, mode, lamBal, fixe, opt = OPT0) {
  const nul = { abs: -1, fluo: -1, phos: -1 };
  if (signal(mol, mode, lamBal, fixe, opt) < SEUIL_SIGNAL) return nul;
  const la = lamsRaies(mol, 'abs'), lf = lamsRaies(mol, 'fluo'), lp = lamsRaies(mol, 'phos');
  if (mode === 'abs') return { ...nul, abs: proche(la, lamBal) };
  if (mode === 'ex') return { ...nul, abs: proche(la, lamBal), fluo: proche(lf, fixe) };
  if (mode === 'ph') return { ...nul, phos: proche(lp, lamBal) };
  const phos = mol.T && phosNm(mol, lamBal, opt.sig) > fluoNm(mol, lamBal, opt.sig);
  return { abs: proche(la, fixe), fluo: phos ? -1 : proche(lf, lamBal), phos: phos ? proche(lp, lamBal) : -1 };
}
export const emissionDominante = (mol, lam, opt = OPT0) => (mol.T && phosNm(mol, lam, opt.sig) > fluoNm(mol, lam, opt.sig) ? 'phos' : 'fluo');

// ---------- un photon : tirage au hasard (rnd fourni), même modèle que les courbes ----------
const tirerV = u => { let s = 0; for (let v = 0; v < X.NV; v++) { s += X.FC[v]; if (u < s) return v; } return X.NV - 1; };
const normale = rnd => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
// photon de longueur d'onde lamIn envoyé sur la molécule
export function tirerPhoton(mol, lamIn, opt, rnd) {
  const s = opt.sig;
  if (rnd() >= X.P_ABS_MAX * absVrai(mol, lamIn, s)) return { absorbe: false, lamIn };
  const E = Een(lamIn), poids = X.raiesAbs(mol).map((E0, v) => X.FC[v] * gauss(E, E0, s)), tot = poids.reduce((a, b) => a + b, 0);
  let u = rnd() * tot, vAbs = 0; for (; vAbs < X.NV - 1; vAbs++) { u -= poids[vAbs]; if (u < 0) break; }
  const r = rnd();
  if (r < mol.rend.fluo) { const v = tirerV(rnd()); return { absorbe: true, lamIn, vAbs, voie: 'fluo', v, lamOut: X.lamDe(mol.E00 - v * mol.hw + s * normale(rnd)) }; }
  if (r < mol.rend.fluo + mol.rend.cis) {
    if (rnd() < mol.T.phos) { const v = tirerV(rnd()); return { absorbe: true, lamIn, vAbs, voie: 'phos', v, lamOut: X.lamDe(mol.T.E00 - v * mol.hw + s * normale(rnd)) }; }
    return { absorbe: true, lamIn, vAbs, voie: 'nrT' };
  }
  return { absorbe: true, lamIn, vAbs, voie: 'nr' };
}
// photon de phosphorescence après l'arrêt (molécule déjà dans T₁)
export function tirerPhos(mol, opt, rnd) {
  if (!mol.T) return { absorbe: false, voie: null };
  if (rnd() >= mol.T.phos) return { absorbe: true, voie: 'nrT' };
  const v = tirerV(rnd()); return { absorbe: true, voie: 'phos', v, lamOut: X.lamDe(mol.T.E00 - v * mol.hw + opt.sig * normale(rnd)) };
}
// un événement de comptage : renvoie aussi la longueur d'onde où ranger le coup (lamCoup), ou null s'il n'est pas compté
export function evenementComptage(mol, mode, fixe, opt, rnd) {
  if (mode === 'ph') { const ev = tirerPhos(mol, opt, rnd); return { ...ev, lamCoup: ev.lamOut ?? null }; }
  if (mode === 'ex') {
    const lamIn = SCAN.ex[0] + (SCAN.ex[1] - SCAN.ex[0]) * rnd(), ev = tirerPhoton(mol, lamIn, opt, rnd);
    const passe = ev.lamOut != null && Math.abs(ev.lamOut - fixe) <= opt.fente / 2;
    return { ...ev, lamDet: fixe, passe, lamCoup: passe ? lamIn : null };
  }
  const ev = tirerPhoton(mol, fixe, opt, rnd);
  return { ...ev, lamCoup: ev.lamOut ?? null };
}
// version reproductible (hasard fonction du numéro du photon), utilisée par les tests
const hash = (i, k) => { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };
export function evenement(mol, mode, lamBal, fixe, i, opt = OPT0) {
  let k = 0; const rnd = () => hash(i, 10 + k++);
  if (mode === 'ph') { const ev = tirerPhos(mol, opt, rnd); return { ...ev, lamIn: null, lamDet: lamBal, passe: ev.lamOut != null && Math.abs(ev.lamOut - lamBal) <= opt.fente / 2 }; }
  const lamIn = mode === 'abs' || mode === 'ex' ? lamBal : fixe, lamDet = mode === 'ex' ? fixe : lamBal, ev = tirerPhoton(mol, lamIn, opt, rnd);
  return { ...ev, lamDet, passe: mode === 'abs' ? !ev.absorbe : ev.lamOut != null && Math.abs(ev.lamOut - lamDet) <= opt.fente / 2 };
}
const NB = ' ', nm = l => `${Math.round(l)}${NB}nm`;
export function texteEvenement(ev, mode) {
  if (mode === 'ph') {
    if (ev.voie == null) return 'cette molécule ne phosphoresce pas : rien à mesurer';
    if (ev.voie === 'nrT') return 'lampe coupée : une molécule dans T₁ revient à S₀ sans photon (chaleur)';
    return `lampe coupée : une molécule dans T₁ phosphoresce (T₁ → S₀ v${NB}=${NB}${ev.v}) et émet un photon de ${nm(ev.lamOut)}`;
  }
  if (mode === 'abs') return ev.absorbe ? `photon de ${nm(ev.lamIn)} absorbé : il n’atteint pas le détecteur` : `photon de ${nm(ev.lamIn)} non absorbé : il traverse la cuve et atteint le détecteur`;
  if (!ev.absorbe) return `photon de ${nm(ev.lamIn)} non absorbé : il traverse la cuve sans rien émettre`;
  const abs = `photon de ${nm(ev.lamIn)} absorbé (S₀ v${NB}=${NB}0 → S₁ v′${NB}=${NB}${ev.vAbs})`;
  if (ev.voie === 'nr' || ev.voie === 'nrT') return `${abs}, puis retour à S₀ sans photon (chaleur)`;
  const em = ev.voie === 'fluo' ? `relaxation puis fluorescence (S₁ v′${NB}=${NB}0 → S₀ v${NB}=${NB}${ev.v})` : `relaxation, croisement intersystème puis phosphorescence (T₁ → S₀ v${NB}=${NB}${ev.v})`;
  const det = mode === 'ex' ? (ev.passe ? ` : il passe la fenêtre de détection (${nm(ev.lamDet)}), un coup est compté à ${nm(ev.lamIn)}` : ` : hors de la fenêtre de détection (${nm(ev.lamDet)}), il n’est pas compté`) : '';
  return `${abs}, ${em} : photon émis à ${nm(ev.lamOut)}${det}`;
}

// ---------- défi : quel type de mesure faut-il choisir ? ----------
const SITUATIONS = [
  { mode: 'abs', txt: 'Vous voulez savoir quelles longueurs d’onde l’échantillon absorbe.', expl: 'On compare la lumière avant et après l’échantillon : le détecteur est dans l’axe du faisceau et on balaie l’excitation.' },
  { mode: 'em', txt: 'Vous éclairez l’échantillon à 350 nm et vous voulez connaître les longueurs d’onde des photons qu’il émet.', expl: 'Le détecteur est à 90° pour ne pas recevoir le faisceau : on fixe l’excitation et on balaie le monochromateur de détection.' },
  { mode: 'ex', txt: 'Vous voulez savoir quelles longueurs d’onde d’excitation produisent de la fluorescence à 450 nm.', expl: 'On fixe la détection à 450 nm et on balaie l’excitation : le signal a l’allure du spectre d’absorption.' },
  { mode: 'ph', txt: 'Vous voulez mesurer la lumière qui reste visible plusieurs secondes après avoir coupé la lampe.', expl: 'La fluorescence est éteinte : seule la phosphorescence (T₁ → S₀) subsiste, mesurée à 90° avec la lampe coupée.' },
];
export const tirageDefiDispositif = rnd => { const s = SITUATIONS[Math.floor(rnd() * SITUATIONS.length)]; return { kind: 'dispositif', txt: s.txt, rep: s.mode, expl: s.expl, nomRep: MODES.find(m => m.id === s.mode).nom }; };

export const A_MAX = 0.8;                                         // absorbance au maximum de la bande vraie (cuve de 1 cm)
export const absorbance = (mol, lam, opt = OPT0) => A_MAX * absRel(mol, lam, opt);
// couleur perçue d'une lumière de longueur d'onde lam (nm) ; l'UV, invisible, est représenté en violet
export function couleurLam(lam, f = 0.82) {
  if (lam < 380) return f < 0.8 ? '#7c3aed' : '#8b5cf6';
  let r = 0, g = 0, b = 0;
  if (lam < 440) { r = (440 - lam) / 60; b = 1; } else if (lam < 490) { g = (lam - 440) / 50; b = 1; } else if (lam < 510) { g = 1; b = (510 - lam) / 20; }
  else if (lam < 580) { r = (lam - 510) / 70; g = 1; } else if (lam < 645) { r = 1; g = (645 - lam) / 65; } else r = 1;
  const h = v => Math.round(255 * Math.min(1, Math.max(0, v)) * f).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

// formes des bandes (pour les petits graphiques « ce qui est fixé »), mises en cache
const memoF = new Map();
export function forme(mol, quoi, opt = OPT0) {
  const cle = `${quoi}|${mol.id}|${opt.sig}|${opt.fente}`;
  if (memoF.has(cle)) return memoF.get(cle);
  const [lo, hi] = quoi === 'abs' ? SCAN.abs : [370, 640], p = pasDe(opt.sig), f = quoi === 'abs' ? absRel : quoi === 'ph' ? phRel : emRel, out = [];
  for (let l = lo; l <= hi + 1e-9; l += p) out.push({ lam: Math.round(l * 100) / 100, s: f(mol, l, opt) });
  if (memoF.size > 60) memoF.clear();
  memoF.set(cle, out);
  return out;
}
