// Vue « Dispositif et spectre » de la simulation 301 : relie une transition du diagramme de Perrin-Jablonski, la place du détecteur
// (dans l'axe : absorption ; à 90° : fluorescence et phosphorescence) et l'allure du spectre obtenu. Fonctions pures, testées par fluoDispositif.test.mjs.
// Hypothèses : celles des tirages (fluoTirages.js) : structure vibronique schématique à 5 sous-niveaux, mêmes facteurs de Franck-Condon à l'absorption et à
// l'émission, règle de Kasha, raies élargies de 0,05 eV, E(eV) × λ(nm) = 1243. Les courbes sont les spectres attendus (sans bruit) ; les photons animés sont
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

// ---------- spectres attendus, intensités relatives (0 à 1) ----------
export const absRel = (mol, lam) => X.pAbs(mol, Een(lam)) / X.P_ABS_MAX;
const jac = l => X.HC / (l * l);
const fluoNm = (mol, l) => mol.rend.fluo * X.pdfFluo(mol, Een(l)) * jac(l);
const phosNm = (mol, l) => (mol.T ? mol.rend.cis * mol.T.phos * X.pdfPhos(mol, Een(l)) * jac(l) : 0);
const emNm = (mol, l) => fluoNm(mol, l) + phosNm(mol, l);
const fenetre = (mol, lam) => { let s = 0; for (let l = lam - FEN_MONO; l <= lam + FEN_MONO; l += 0.5) s += emNm(mol, l) * 0.5; return s; };
const cache = {};
const maxi = (cle, f, lo, hi, pas = 1) => (cache[cle] ??= (() => { let m = 0; for (let l = lo; l <= hi; l += pas) m = Math.max(m, f(l)); return m; })());
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
// raies repérées sur la courbe : famille ('abs', 'fluo', 'phos'), sous-niveau v, longueur d'onde (nm)
export function raiesCourbe(mol, mode) {
  const [lo, hi] = DOMAINE[mode], fam = mode === 'abs' || mode === 'ex' ? ['abs'] : mode === 'em' ? ['fluo', 'phos'] : ['phos'], out = [];
  for (const f of fam) lamsRaies(mol, f).forEach((lam, v) => { if (lam >= lo && lam <= hi) out.push({ fam: f, v, lam }); });
  return out;
}

// ---------- transitions mises en valeur sur le diagramme ----------
const TOL = 1.55 * X.SIG;                                    // une longueur d'onde « tombe sur » une raie à ± 1,55 σ (eV)
const proche = (lams, lam) => { let k = -1, d = Infinity; lams.forEach((l, i) => { const e = Math.abs(Een(l) - Een(lam)); if (e < d) { d = e; k = i; } }); return d <= TOL ? k : -1; };
// renvoie { abs, fluo, phos } : sous-niveau d'arrivée (v′ pour l'absorption, v pour l'émission), -1 si aucune transition n'est sélectionnée
export function transitions(mol, mode, lamBal, fixe) {
  const la = lamsRaies(mol, 'abs'), lf = lamsRaies(mol, 'fluo'), lp = lamsRaies(mol, 'phos');
  if (mode === 'abs') return { abs: proche(la, lamBal), fluo: -1, phos: -1 };
  if (mode === 'ex') { const a = proche(la, lamBal); return { abs: a, fluo: a >= 0 ? proche(lf, fixe) : -1, phos: -1 }; }
  if (mode === 'ph') return { abs: -1, fluo: -1, phos: mol.T ? proche(lp, lamBal) : -1 };
  const a = proche(la, fixe);
  return { abs: a, fluo: a >= 0 ? proche(lf, lamBal) : -1, phos: mol.T && a >= 0 ? proche(lp, lamBal) : -1 };
}

// ---------- un photon animé : événement reproductible ----------
const hash = (i, k) => { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };
const tirerV = u => { let s = 0; for (let v = 0; v < X.NV; v++) { s += X.FC[v]; if (u < s) return v; } return X.NV - 1; };
export function evenement(mol, mode, lamBal, fixe, i) {
  if (mode === 'ph') {
    if (!mol.T) return { absorbe: false, voie: null, passe: false, lamIn: null, lamOut: null, lamDet: lamBal };
    if (hash(i, 1) >= mol.T.phos) return { absorbe: true, voie: 'nrT', passe: false, lamIn: null, lamOut: null, lamDet: lamBal };
    const v = tirerV(hash(i, 2)), g = Math.sqrt(-2 * Math.log(1 - hash(i, 3))) * Math.cos(2 * Math.PI * hash(i, 4));
    const lamOut = X.lamDe(mol.T.E00 - v * mol.hw + X.SIG * g);
    return { absorbe: true, voie: 'phos', v, lamIn: null, lamOut, lamDet: lamBal, passe: Math.abs(lamOut - lamBal) <= FEN_MONO };
  }
  const lamIn = mode === 'abs' || mode === 'ex' ? lamBal : fixe, lamDet = mode === 'ex' ? fixe : lamBal;
  let k = 0; const ev = X.photon(mol, X.HC / lamIn, () => hash(i, 10 + k++));
  const lamOut = ev.Eem ? X.lamDe(ev.Eem) : null;
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
export { gauss };

// ---------- défi : quel type de mesure faut-il choisir ? ----------
const SITUATIONS = [
  { mode: 'abs', txt: 'Vous voulez savoir quelles longueurs d’onde l’échantillon absorbe.', expl: 'On compare la lumière avant et après l’échantillon : le détecteur est dans l’axe du faisceau et on balaie l’excitation.' },
  { mode: 'em', txt: 'Vous éclairez l’échantillon à 350 nm et vous voulez connaître les longueurs d’onde des photons qu’il émet.', expl: 'Le détecteur est à 90° pour ne pas recevoir le faisceau : on fixe l’excitation et on balaie le monochromateur de détection.' },
  { mode: 'ex', txt: 'Vous voulez savoir quelles longueurs d’onde d’excitation produisent de la fluorescence à 450 nm.', expl: 'On fixe la détection à 450 nm et on balaie l’excitation : le signal a l’allure du spectre d’absorption.' },
  { mode: 'ph', txt: 'Vous voulez mesurer la lumière qui reste visible plusieurs secondes après avoir coupé la lampe.', expl: 'La fluorescence est éteinte : seule la phosphorescence (T₁ → S₀) subsiste, mesurée à 90° avec la lampe coupée.' },
];
export const tirageDefiDispositif = rnd => { const s = SITUATIONS[Math.floor(rnd() * SITUATIONS.length)]; return { kind: 'dispositif', txt: s.txt, rep: s.mode, expl: s.expl, nomRep: MODES.find(m => m.id === s.mode).nom }; };
