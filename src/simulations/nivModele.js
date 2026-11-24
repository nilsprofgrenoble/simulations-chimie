// Modèle de la simulation 165 « Niveaux d'énergie : absorption, émission et spectres de raies » (1G spé PC, Ondes et signaux).
// Fichier sans React : testé par nivModele.test.mjs.
// HYPOTHÈSES DU MODÈLE (reprises dans le panneau d'hypothèses de la simulation et dans les étapes) :
//  • atome ISOLÉ (gaz à basse pression) : ses énergies sont discrètes (niveaux) ; aucune interaction entre atomes ;
//  • les diagrammes sont SIMPLIFIÉS : quelques niveaux, valeurs données. On considère toutes les transitions possibles entre les niveaux
//    REPRÉSENTÉS (le diagramme fourni ne montre que quelques niveaux) ;
//  • un photon est absorbé EN ENTIER ou pas du tout : il faut ΔE = |E_f − E_i| exactement (à la précision des données) ;
//  • absorption : atomes initialement au niveau fondamental (gaz froid) ; émission : atomes excités (décharge, chauffage) ;
//  • l'INTENSITÉ des raies n'est pas modélisée (les raies sont toutes tracées avec le même trait) ;
//  • constantes arrondies : h = 6,63×10⁻³⁴ J·s ; c = 3,00×10⁸ m·s⁻¹ ; 1 eV = 1,60×10⁻¹⁹ J (3 chiffres significatifs) ;
//  • ΔE = h·ν = h·c/λ ; E = 0 est choisie au fondamental (atomes fictifs, sodium) ; pour l'hydrogène E = 0 est l'ionisation (niveaux négatifs).
import { C, H, EV, domaineDeLambda, couleurVisible } from './photonModele.js';
export { C, H, EV, domaineDeLambda, couleurVisible };
export { dec, sci, lambdaTexte, evTexte } from './photonModele.js';

// ───────────── Relations ─────────────
export const lamNmDeEv = e => H * C / (e * EV) * 1e9;       // nm
export const evDeLamNm = l => H * C / (l * 1e-9) / EV;      // eV
export const ecart = (a, b) => Math.abs(a - b);               // |E_f − E_i|, en eV
export const arrondiEv = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

// ───────────── Atomes ─────────────
// niveaux en eV, du plus bas (fondamental) au plus haut. reel : valeur issue d'un diagramme publié (voir le compte rendu).
export const ATOMES = {
  X: { id: 'X', nom: 'atome fictif X', court: 'X', reel: false, niveaux: [0, 1.90, 2.85, 3.55], zero: 'fondamental', plage: [300, 1900], echelle: 'lin' },
  Y: { id: 'Y', nom: 'atome fictif Y', court: 'Y', reel: false, niveaux: [0, 1.90, 2.60, 3.40], zero: 'fondamental', plage: [300, 1900], echelle: 'lin' },
  Z: { id: 'Z', nom: 'atome fictif Z', court: 'Z', reel: false, niveaux: [0, 2.30, 3.00, 3.85], zero: 'fondamental', plage: [300, 1900], echelle: 'lin' },
  Na: { id: 'Na', nom: 'sodium (diagramme très simplifié)', menu: 'sodium (simplifié)', court: 'sodium', reel: true, niveaux: [0, 2.10], zero: 'fondamental', plage: [400, 850], echelle: 'lin' },
  H: { id: 'H', nom: 'hydrogène (pour aller plus loin)', menu: 'hydrogène (plus loin)', court: 'hydrogène', reel: true, niveaux: [-13.6, -3.40, -1.51, -0.85], zero: 'ionisation', plage: [90, 2100], echelle: 'log' },
};
export const nomNiveau = (atome, i) => atome.id === 'H' ? `n = ${i + 1}` : `E${i}`;
export const nomNiveauHtml = (atome, i) => atome.id === 'H' ? `n = ${i + 1}` : `E${'₀₁₂₃₄₅₆₇'[i]}`;

// Toutes les transitions entre niveaux représentés (bas < haut), triées par longueur d'onde croissante (donc ΔE décroissante)
export function transitions(atome) {
  const L = atome.niveaux, t = [];
  for (let b = 0; b < L.length; b++) for (let h = b + 1; h < L.length; h++) {
    const dE = ecart(L[h], L[b]), lam = lamNmDeEv(dE);
    t.push({ bas: b, haut: h, dE, lam, dom: domaineDeLambda(lam * 1e-9), couleur: couleurVisible(lam), depuisFond: b === 0 });
  }
  return t.sort((u, v) => u.lam - v.lam);
}
export const transitionsAbsorption = atome => transitions(atome).filter(t => t.depuisFond);
export const nbRaiesCascade = k => (k * (k - 1)) / 2;        // k niveaux au plus (du fondamental au niveau de départ inclus)
export const nbRaiesDepuis = (atome, i) => nbRaiesCascade(i + 1);
// Raies visibles (400 à 780 nm)
export const raiesVisibles = atome => transitions(atome).filter(t => t.dom.id === 'vis');
export const trouveTransition = (atome, b, h) => transitions(atome).find(t => t.bas === b && t.haut === h);
// Un photon d'énergie e (eV) peut-il être absorbé par un atome au niveau i ? (précision : 0,5 % de ΔE, valeurs données à 3 chiffres)
export const absorbe = (atome, i, eEv, tol = 0.005) => atome.niveaux.some((E, j) => j > i && Math.abs((E - atome.niveaux[i]) - eEv) <= tol * eEv);

// ───────────── Couleur d'une raie (illustration) ─────────────
const STOPS = [[380, [124, 58, 237]], [440, [79, 70, 229]], [470, [59, 130, 246]], [495, [6, 182, 212]], [530, [34, 197, 94]], [570, [234, 179, 8]], [590, [245, 158, 11]], [620, [249, 115, 22]], [680, [220, 38, 38]], [780, [153, 27, 27]]];
export function rgbVisible(lam) {
  const l = Math.min(780, Math.max(380, lam));
  for (let k = 0; k < STOPS.length - 1; k++) {
    const [a, ca] = STOPS[k], [b, cb] = STOPS[k + 1];
    if (l <= b) { const f = (l - a) / (b - a); return ca.map((v, j) => Math.round(v + f * (cb[j] - v))); }
  }
  return STOPS[STOPS.length - 1][1];
}
export const cssVisible = lam => `rgb(${rgbVisible(lam).join(',')})`;
export const COUL_UV = '#7c3aed', COUL_IR = '#9f1239';
// Couleur du trait d'une raie : sa couleur réelle si elle est visible, un violet (UV) ou un rouge sombre (IR) sinon ; le domaine est toujours écrit.
export const couleurRaie = lam => (lam < 400 ? COUL_UV : lam >= 780 ? COUL_IR : cssVisible(lam));
// Teinte de texte lisible : nom de couleur (accessibilité)

// ───────────── Identification d'un atome (tableau de raies visibles) ─────────────
export const lignesVisibles = atome => raiesVisibles(atome).map(t => Math.round(t.lam)).sort((a, b) => a - b);

// ───────────── Tirages (fonctions pures : rng() dans [0 ; 1[ ) ─────────────
const pioche = (rng, t) => t[Math.min(t.length - 1, Math.floor(rng() * t.length))];
// Niveaux aléatoires : n niveaux, fondamental à 0 ou négatif (convention), écarts consécutifs tirés au dixième d'eV entre 0,7 et 3,5 eV,
// tous les écarts entre niveaux (toutes les paires) distincts de plus de 0,1 eV : aucune raie confondue avec une autre.
export function tirerNiveaux(rng, n = 4, negatif = false) {
  for (let essai = 0; essai < 200; essai++) {
    const L = [0];
    for (let k = 1; k < n; k++) L.push(Math.round((L[k - 1] + 0.7 + rng() * 2.8) * 10) / 10);
    const ec = []; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) ec.push(Math.round((L[b] - L[a]) * 100) / 100);
    const tri = [...ec].sort((x, y) => x - y);
    let ok = L[n - 1] <= 9.0;
    for (let k = 1; k < tri.length; k++) if (tri[k] - tri[k - 1] < 0.1) ok = false;
    if (ok) { const d = negatif ? -Math.round((L[n - 1] + 1.0 + rng() * 3.0) * 10) / 10 : 0; return L.map(x => Math.round((x + d) * 10) / 10); }
  }
  return [0, 1.9, 2.85, 3.55];
}
// Défi « exciter » : une transition (bas → haut) d'un diagramme tiré ; 4 radiations proposées (λ en nm, arrondies à 3 chiffres significatifs).
// La bonne a ΔE exactement égale à l'écart ; les autres : mêmes erreurs d'élève (énergie du niveau haut, somme, écart plus grand/plus petit).
const arrondi3 = x => Number(x.toPrecision(3));
export function tirerExciter(rng, exclu) {
  for (let essai = 0; essai < 300; essai++) {
    const L = tirerNiveaux(rng, 4, false), b = Math.floor(rng() * 3), h = b + 1 + Math.floor(rng() * (3 - b));
    const dE = arrondiEv(L[h] - L[b]);
    if (dE < 0.7 || exclu === `${L.join(';')}|${b}|${h}`) continue;
    const bonne = arrondi3(lamNmDeEv(dE));
    // pièges : λ calculée avec E_haut seul (si b > 0), avec E_bas + E_haut, avec un écart voisin
    const cand = [L[h], L[h] + L[b], Math.abs(L[h] - L[b]) * 1.5, Math.abs(L[h] - L[b]) * 0.7, L[h] - L[b] + 0.9, Math.max(0.8, L[h] - L[b] - 0.8)]
      .filter(e => e >= 0.5).map(e => arrondi3(lamNmDeEv(e))).filter(l => Math.abs(l - bonne) > 0.06 * bonne && l >= 100 && l <= 2500);
    const faux = []; for (const l of cand) if (!faux.some(f => Math.abs(f - l) < 0.06 * l) && faux.length < 3) faux.push(l);
    if (faux.length < 3) continue;
    // aucune mauvaise radiation ne doit exciter une autre transition du diagramme (sinon le défi est ambigu)
    const eV = l => evDeLamNm(l), at = { niveaux: L };
    if (faux.some(l => absorbe(at, 0, eV(l), 0.03) || absorbe(at, 1, eV(l), 0.03) || absorbe(at, 2, eV(l), 0.03))) continue;
    return { niveaux: L, bas: b, haut: h, dE, bonne, faux, cle: `${L.join(';')}|${b}|${h}` };
  }
  return { niveaux: [0, 1.9, 2.85, 3.55], bas: 0, haut: 2, dE: 2.85, bonne: arrondi3(lamNmDeEv(2.85)), faux: [350, 654, 1780], cle: 'x' };
}
// Défi « identifier » : trois atomes A, B, C (4 niveaux, fondamental à 0) ; le gaz inconnu en est un ; on donne trois de ses raies (nm).
// Au moins une des trois raies n'est pas une raie de chacun des deux autres atomes (identification sans ambiguïté, tolérance 1 %).
export function tirerIdentifier(rng, exclu) {
  for (let essai = 0; essai < 400; essai++) {
    const at = ['A', 'B', 'C'].map(id => ({ id, niveaux: tirerNiveaux(rng, 4, false) }));
    const lam = a => transitions(a).map(t => t.lam);
    const k = Math.min(2, Math.floor(rng() * 3)), inconnu = at[k];
    const tr = transitions(inconnu);
    if (tr.some(t => t.lam < 120 || t.lam > 2200)) continue;
    // trois raies parmi six, dont au moins une qui ne part pas du fondamental
    const idx = [0, 1, 2, 3, 4, 5].sort(() => rng() - 0.5).slice(0, 3);
    const choisies = idx.map(i => tr[i]);
    if (choisies.every(t => t.depuisFond)) continue;
    const raies = choisies.map(t => Math.round(t.lam)).sort((a, b) => a - b);
    const autres = at.filter((_, j) => j !== k);
    const ambigu = autres.some(a => raies.every(r => lam(a).some(l => Math.abs(l - r) <= 0.015 * r)));
    if (ambigu) continue;
    // distinguer aussi nettement les trois diagrammes (aucun niveau identique pour tous)
    const cle = at.map(a => a.niveaux.join(',')).join('/') + k;
    if (exclu && exclu === cle) continue;
    return { atomes: at, k, bonne: inconnu.id, raies, choisies, cle };
  }
  return { atomes: [{ id: 'A', niveaux: ATOMES.X.niveaux }, { id: 'B', niveaux: ATOMES.Y.niveaux }, { id: 'C', niveaux: ATOMES.Z.niveaux }], k: 1, bonne: 'B', raies: [366, 478, 654], choisies: [], cle: 'defaut' };
}
// Défi « au-delà du programme » : hydrogène, E_n = −13,6/n² (eV), transition n_i → n_f ; λ en nm
export function tirerBalmer(rng, exclu) {
  const cas = [[3, 2], [4, 2], [5, 2], [6, 2], [4, 3], [5, 3], [2, 1], [3, 1]];
  let c = pioche(rng, cas); if (exclu && exclu[0] === c[0] && exclu[1] === c[1]) c = pioche(rng, cas.filter(x => x[0] !== exclu[0] || x[1] !== exclu[1]));
  const [ni, nf] = c, dE = 13.6 * (1 / (nf * nf) - 1 / (ni * ni));
  return { ni, nf, dE, vrai: lamNmDeEv(dE) };
}
