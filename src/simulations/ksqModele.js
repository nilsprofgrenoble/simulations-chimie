// ====================================================
//  Modèle de la simulation 309 (terminale STL, SPCL) : constante Ks, quotient de réaction Qr, solubilité d'un sel peu soluble.
//  Sel AaBb(s) = a Mⁿ⁺ + b Xᵐ⁻ ; Ks = [M]^a × [X]^b à l'équilibre ; solubilité s = quantité de sel dissoute par litre de solution saturée.
//  Valeurs de Ks : produits de solubilité à 25 °C de l'annexe « Solubility Products » du manuel OpenStax Chemistry 2e (une seule source, valeurs arrondies telles que publiées).
//  Hypothèses : solutions diluées (activités = concentrations), 25 °C, pas de réaction acido-basique ni de complexation des ions, volumes additifs.
// ====================================================
export const SELS = {
  AgI:    { id: 'AgI',    nom: 'iodure d’argent',          f: 'AgI',    cation: 'Ag⁺',  anion: 'I⁻',    a: 1, b: 1, Ks: 1.5e-16, M: 234.77 },
  CuI:    { id: 'CuI',    nom: 'iodure de cuivre(I)',      f: 'CuI',    cation: 'Cu⁺',  anion: 'I⁻',    a: 1, b: 1, Ks: 1.27e-12, M: 190.45 },
  SrCO3:  { id: 'SrCO3',  nom: 'carbonate de strontium',   f: 'SrCO₃',  cation: 'Sr²⁺', anion: 'CO₃²⁻', a: 1, b: 1, Ks: 7e-10, M: 147.63 },
  CaF2:   { id: 'CaF2',   nom: 'fluorure de calcium',      f: 'CaF₂',   cation: 'Ca²⁺', anion: 'F⁻',    a: 1, b: 2, Ks: 4.0e-11, M: 78.07 },
  Ag2CO3: { id: 'Ag2CO3', nom: 'carbonate d’argent',       f: 'Ag₂CO₃', cation: 'Ag⁺',  anion: 'CO₃²⁻', a: 2, b: 1, Ks: 8.1e-12, M: 275.75 },
};
export const ORDRE_SELS = ['AgI', 'CuI', 'SrCO3', 'CaF2', 'Ag2CO3'];
export const TOL_SAT = 0.02;           // Qr à moins de 2 % de Ks : on dit « saturée » (équilibre)

export const pKs = sel => -Math.log10(sel.Ks);
// Solubilité (mol/L) : (a s)^a (b s)^b = Ks  =>  s = (Ks / (a^a b^b))^(1/(a+b))
export const solubilite = sel => Math.pow(sel.Ks / (Math.pow(sel.a, sel.a) * Math.pow(sel.b, sel.b)), 1 / (sel.a + sel.b));
export const solubiliteGL = sel => solubilite(sel) * sel.M;
export const concSat = sel => { const s = solubilite(sel); return { cation: sel.a * s, anion: sel.b * s }; };
export const qr = (sel, cCat, cAn) => Math.pow(cCat, sel.a) * Math.pow(cAn, sel.b);
// Verdict : 'precipite' (Qr > Ks), 'sature' (Qr ≈ Ks), 'dissout' (Qr < Ks : le solide, s'il y en a, se dissout)
export const verdict = (q, Ks) => (Math.abs(q - Ks) <= TOL_SAT * Ks ? 'sature' : q > Ks ? 'precipite' : 'dissout');
export const LIBELLE = { precipite: 'précipitation', sature: 'équilibre (solution saturée)', dissout: 'dissolution possible (pas de précipité)' };

// Mélange de deux solutions de volumes V1 et V2 (en mL) : concentrations juste après mélange, avant toute précipitation
export const apresMelange = (c1, V1, c2, V2) => ({ c1: c1 * V1 / (V1 + V2), c2: c2 * V2 / (V1 + V2) });

// Précipitation : avancement x (mol/L) du solide formé quand Qr > Ks, avec (a x) et (b x) retirés des concentrations initiales cCat, cAn.
// On résout (cCat − a x)^a (cAn − b x)^b = Ks par dichotomie sur [0, xmax].
export function precipitation(sel, cCat, cAn) {
  const { a, b, Ks } = sel;
  if (qr(sel, cCat, cAn) <= Ks) return { x: 0, cCat, cAn };
  let lo = 0, hi = Math.min(cCat / a, cAn / b);
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (qr(sel, cCat - a * m, cAn - b * m) > Ks) lo = m; else hi = m; }
  const x = (lo + hi) / 2;
  return { x, cCat: cCat - a * x, cAn: cAn - b * x };
}
// Solubilité en présence d'un ion commun de concentration c0 (sel AaBb, ion commun = l'anion) : (a s)^a (b s + c0)^b = Ks
export function solubiliteIonCommun(sel, c0, ion = 'anion') {
  const { a, b, Ks } = sel;
  const f = s => (ion === 'anion' ? Math.pow(a * s, a) * Math.pow(b * s + c0, b) : Math.pow(a * s + c0, a) * Math.pow(b * s, b)) - Ks;
  let lo = 0, hi = solubilite(sel);
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (f(m) > 0) hi = m; else lo = m; }
  return (lo + hi) / 2;
}
// Sel le plus soluble ? On compare les solubilités s, pas les Ks (les stœchiométries diffèrent).
export const plusSoluble = (s1, s2) => (solubilite(s1) >= solubilite(s2) ? s1 : s2);

// ----- mise en forme française -----
const EXP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const sup = n => [...String(n)].map(c => EXP[c] ?? c).join('');
export const sci = (x, d = 2) => { if (!x) return '0'; let e = Math.floor(Math.log10(Math.abs(x))), m = x / Math.pow(10, e); if (Number(m.toFixed(d)) >= 10) { m /= 10; e += 1; } return `${m.toFixed(d).replace('.', ',')}×10${sup(e)}`; };
export const sciNb = (x, d = 2) => sci(x, d).replace(/ /g, ' ');

// ====================================================
//  Défis : tirages et diagnostics (les données affichées à l'élève sont exactement celles du corrigé : concentrations à 2 chiffres significatifs)
// ====================================================
const r2 = x => Number(Number(x).toPrecision(2));
const choisir = (t, rng) => t[Math.floor(rng() * t.length)];
const proche = (x, v, t = 0.10) => isFinite(x) && Math.abs(x - v) <= t * Math.abs(v);
export const TOL_DEFI_QR = 0.10;

// Défi 1 : « précipité ou non ? » : deux solutions de volumes différents sont mélangées ; l'élève calcule Qr puis conclut.
export function tirageDefiPrecip(rng = Math.random) {
  for (let essai = 0; essai < 400; essai++) {
    const sel = SELS[choisir(ORDRE_SELS, rng)], V1 = choisir([10, 20, 25, 30], rng), V2 = choisir([10, 20, 25, 30, 40], rng), Vt = V1 + V2, cs = concSat(sel);
    const lcm1 = Math.log10(cs.cation) + (rng() * 2.7 - 1.2), cible = (rng() < 0.5 ? -1 : 1) * (0.5 + rng() * 2.5);
    const lcm2 = (cible + Math.log10(sel.Ks) - sel.a * lcm1) / sel.b;
    const c1 = r2(Math.pow(10, lcm1) * Vt / V1), c2 = r2(Math.pow(10, lcm2) * Vt / V2);
    if (c1 > 0.5 || c2 > 0.5 || c1 < 1e-11 || c2 < 1e-11) continue;
    const m = apresMelange(c1, V1, c2, V2), q = qr(sel, m.c1, m.c2), lr = Math.log10(q / sel.Ks);
    if (Math.abs(lr) < 0.45 || Math.abs(lr) > 4) continue;
    return { sel: sel.id, c1, V1, c2, V2, Vt, m, q, Ks: sel.Ks, verdict: verdict(q, sel.Ks), qSansDilution: qr(sel, c1, c2), qSansExposant: m.c1 * m.c2 };
  }
  return null;
}
export function diagQr(d, x) {
  if (!isFinite(x) || x <= 0) return { ok: false, msg: 'Ce que vous avez saisi n’est pas un nombre positif : écrivez Qr comme 2,5×10⁻⁷ ou 2,5e-7.' };
  if (proche(x, d.q, TOL_DEFI_QR)) return { ok: true, msg: '' };
  if (proche(x, d.qSansDilution)) return { ok: false, msg: 'Vous avez utilisé les concentrations des solutions de départ : après le mélange, chaque ion est dilué dans le volume total (V₁ + V₂). Calculez d’abord les concentrations après mélange.' };
  if (d.qSansExposant > 0 && !proche(d.qSansExposant, d.q) && proche(x, d.qSansExposant)) return { ok: false, msg: 'Il manque les exposants : dans Qr, chaque concentration est élevée à la puissance de son coefficient stœchiométrique.' };
  return { ok: false, msg: x > d.q ? 'Votre Qr est trop grand : refaites le calcul des concentrations après mélange (dilution) puis du produit avec les exposants.' : 'Votre Qr est trop petit : refaites le calcul des concentrations après mélange (dilution) puis du produit avec les exposants.' };
}
// Défi 2 : « solubilité mesurée → Ks » : la solubilité est donnée en g/L (2 chiffres significatifs) ; l'élève convertit en mol/L puis en déduit Ks.
export function tirageDefiKs(rng = Math.random) {
  const sel = SELS[choisir(ORDRE_SELS, rng)], sgL = r2(solubiliteGL(sel) * (0.7 + rng() * 0.8)), s = sgL / sel.M, Ks = Math.pow(sel.a * s, sel.a) * Math.pow(sel.b * s, sel.b);
  return { sel: sel.id, sgL, s, Ks, tol: 0.07 * (sel.a + sel.b), sSansStoech: s * s, sSansM: Math.pow(sel.a * sgL, sel.a) * Math.pow(sel.b * sgL, sel.b) };
}
export function diagKs(d, x) {
  const sel = SELS[d.sel];
  if (!isFinite(x) || x <= 0) return { ok: false, msg: 'Ce que vous avez saisi n’est pas un nombre positif : écrivez Ks comme 4,0×10⁻¹¹ ou 4,0e-11.' };
  if (proche(x, d.Ks, d.tol)) return { ok: true, msg: '' };
  if (proche(x, d.sSansM, 0.2)) return { ok: false, msg: 'Il faut des concentrations en mol/L : divisez la solubilité en g/L par la masse molaire avant de calculer Ks.' };
  if ((sel.a !== 1 || sel.b !== 1) && proche(x, d.sSansStoech, 0.2)) return { ok: false, msg: 'Vous avez écrit Ks = s² : avec cette formule, les concentrations des ions valent a × s et b × s (coefficients stœchiométriques) et Ks les utilise en exposants.' };
  return { ok: false, msg: x > d.Ks ? 'Votre Ks est trop grand : vérifiez la conversion en mol/L, les concentrations des ions et les exposants.' : 'Votre Ks est trop petit : vérifiez la conversion en mol/L, les concentrations des ions et les exposants.' };
}
