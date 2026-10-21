// ═══════════════════════════════════════════════════════════════════════════
//  SIM 76 — RMN ¹³C ET RMN 2D (COSY, HSQC) : modèle
//  Réutilise les molécules de la sim 75 (groupes de H : δH, couplages) et leur ajoute les carbones :
//  δC usuels en solution dans CDCl₃, nombre de H portés, groupe de H lié.
//  Hypothèses : ¹³C découplé du proton (un singulet par carbone non équivalent) ; intensités NON proportionnelles au nombre de C ;
//  COSY = couplages ³J H–H ; HSQC = liaisons directes ¹J C–H ; pas de HMBC ni de DEPT.
// ═══════════════════════════════════════════════════════════════════════════
import { MOL } from "./rmnModele";

export { MOL };

// c(δC, nombre de H portés, groupe de H lié (clé du groupe dans rmnModele), nombre de carbones équivalents, description)
const c = (d, nH, g, n, desc) => ({ d, nH, g, n, desc });

export const CARBONES = {
  bromobutane: [c(34.6, 2, 'b', 1, 'CH₂ (β)'), c(33.5, 2, 'br', 1, 'CH₂Br'), c(21.3, 2, 'c', 1, 'CH₂ (γ)'), c(13.2, 3, 'me', 1, 'CH₃')],
  ethoxyethane: [c(65.8, 2, 'ch2', 2, 'CH₂O (×2)'), c(15.4, 3, 'me', 2, 'CH₃ (×2)')],
  ethanol: [c(57.8, 2, 'ch2', 1, 'CH₂O'), c(18.2, 3, 'me', 1, 'CH₃')],
  acetateethyle: [c(171.1, 0, null, 1, 'C=O (ester)'), c(60.4, 2, 'och2', 1, 'OCH₂'), c(21.0, 3, 'ac', 1, 'CH₃CO'), c(14.2, 3, 'me', 1, 'CH₃ (éthyle)')],
  propanoatemethyle: [c(174.9, 0, null, 1, 'C=O (ester)'), c(51.4, 3, 'ome', 1, 'OCH₃'), c(27.2, 2, 'ch2', 1, 'CH₂CO'), c(9.1, 3, 'me', 1, 'CH₃')],
  butanoateethyle: [c(173.7, 0, null, 1, 'C=O (ester)'), c(60.2, 2, 'och2', 1, 'OCH₂'), c(36.2, 2, 'alpha', 1, 'CH₂CO'), c(18.5, 2, 'mid', 1, 'CH₂ central'),
    c(14.2, 3, 'me2', 1, 'CH₃ (éthyle)'), c(13.7, 3, 'me1', 1, 'CH₃ (butanoyle)')],
  methylbutanone: [c(212.5, 0, null, 1, 'C=O (cétone)'), c(41.6, 1, 'ch', 1, 'CH'), c(27.5, 3, 'ac', 1, 'CH₃CO'), c(18.2, 3, 'me2', 2, 'CH₃ (×2)')],
  propanal: [c(203.0, 1, 'cho', 1, 'CHO (aldéhyde)'), c(37.3, 2, 'ch2', 1, 'CH₂'), c(6.0, 3, 'me', 1, 'CH₃')],
  benzoateethyle: [c(166.6, 0, null, 1, 'C=O (ester)'), c(132.8, 1, 'p', 1, 'C–H para'), c(130.6, 0, null, 1, 'C aromatique lié à C=O'), c(129.6, 1, 'o', 2, 'C–H ortho (×2)'),
    c(128.3, 1, 'm', 2, 'C–H meta (×2)'), c(60.9, 2, 'och2', 1, 'OCH₂'), c(14.3, 3, 'me', 1, 'CH₃')],
  nitrobenzoate: [c(164.6, 0, null, 1, 'C=O (ester)'), c(150.5, 0, null, 1, 'C aromatique lié à NO₂'), c(135.8, 0, null, 1, 'C aromatique lié à C=O'),
    c(130.6, 1, 'he', 2, 'C–H ortho à CO₂Et (×2)'), c(123.5, 1, 'hn', 2, 'C–H ortho à NO₂ (×2)'), c(61.9, 2, 'och2', 1, 'OCH₂'), c(14.2, 3, 'me', 1, 'CH₃')],
};

export const IDS = Object.keys(CARBONES);

// Molécule enrichie : carbones numérotés par δC décroissant, groupes de H non labiles, taches COSY et HSQC.
function construire(id) {
  const m = MOL[id];
  const carbones = CARBONES[id].map(x => ({ ...x })).sort((a, b) => b.d - a.d).map((x, i) => ({ ...x, num: i + 1, groupe: x.g ? m.par[x.g] : null }));
  const groupes = m.liste.filter(x => !x.labile);
  // COSY : un couplage H–H entre deux groupes distincts = une paire de taches hors diagonale
  const parLettre = Object.fromEntries(m.liste.map(x => [x.lettre, x]));
  // COSY : un couplage H–H entre deux groupes distincts = une paire de taches hors diagonale (déclaré dans les deux sens : on déduplique)
  const sens = new Map();
  groupes.forEach(a => a.coupl.forEach(cp => { const b = parLettre[cp.avec]; if (b && !b.labile) { const k = [a.lettre, b.lettre].sort().join(''); sens.set(k, [a.lettre < b.lettre ? a : b, a.lettre < b.lettre ? b : a]); } }));
  const taches = [...sens.values()];
  const hsqc = carbones.filter(x => x.groupe && x.nH > 0);
  return { id, m, carbones, groupes, taches, hsqc, nSignaux: carbones.length, nCtot: carbones.reduce((s, x) => s + x.n, 0), sansH: carbones.filter(x => x.nH === 0) };
}
export const MOLS = Object.fromEntries(IDS.map(id => [id, construire(id)]));
export const LISTE = IDS.map(id => MOLS[id]);

// Vérification de cohérence (utilisée par les tests) : le nombre de H des carbones égale celui des groupes non labiles
export function verifier(id) {
  const M = MOLS[id], hC = M.carbones.reduce((s, x) => s + x.n * x.nH, 0), hG = M.groupes.reduce((s, x) => s + x.n, 0);
  const lie = M.carbones.every(x => !x.groupe || x.n * x.nH === x.groupe.n);
  return { ok: hC === hG && lie, hC, hG, lie };
}

// Domaine de δC (tables de cours)
export const DOMAINES = [
  { de: 160, a: 220, nom: 'C=O', long: 'carbonyle (C=O)', teinte: '#e0f2fe' },
  { de: 100, a: 160, nom: 'C=C, aromatique', long: 'carbone sp² (C=C, aromatique)', teinte: '#fef3c7' },
  { de: 50, a: 100, nom: 'C–O, C–N', long: 'carbone sp³ lié à O ou N', teinte: '#dcfce7' },
  { de: 0, a: 50, nom: 'alkyle', long: 'carbone sp³ alkyle (ou halogéné)', teinte: '#f3f4f6' },
];
export const domaine = d => (d >= 160 ? DOMAINES[0] : d >= 100 ? DOMAINES[1] : d >= 50 ? DOMAINES[2] : DOMAINES[3]);

// Intensité relative d'une raie ¹³C : proportionnelle au nombre de C équivalents, mais très affaiblie pour les C sans H (pas d'effet NOE, relaxation lente)
export const intensite = x => x.n * (x.nH === 0 ? 0.3 : 1);
export const typeC = nH => (nH === 0 ? 'C (sans H)' : nH === 1 ? 'CH' : nH === 2 ? 'CH₂' : 'CH₃');

// Courbe ¹³C : lorentziennes de demi-largeur 0,5 ppm
export function courbeC(M, nb = 700, dmax = 220) {
  const hw = 0.5, pts = [], imax = Math.max(...M.carbones.map(intensite));
  for (let k = 0; k <= nb; k++) { const d = dmax * (1 - k / nb); let y = 0; M.carbones.forEach(x => { const u = (d - x.d) / hw; y += intensite(x) / imax / (1 + u * u); }); pts.push([d, y]); }
  return pts;
}
