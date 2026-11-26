// ====================================================
//  Modèle de la simulation 311 (terminale STL, SPCL) : précipitation sélective d'hydroxydes métalliques selon le pH.
//  M(OH)n(s) ⇌ Mⁿ⁺ + n HO⁻ ; Ks = [Mⁿ⁺] × [HO⁻]ⁿ ; pH = 14 + log [HO⁻] (25 °C, Ke = 1,0×10⁻¹⁴).
//  Valeurs de Ks (25 °C) : annexe « Solubility Products » d'OpenStax Chemistry 2e (valeurs arrondies telles que publiées).
//  Hypothèses : solutions diluées (activités = concentrations), pas de complexation ni de caractère amphotère, volume constant (soude concentrée ajoutée en très petite quantité),
//  précipitation « quasi totale » conventionnelle quand [Mⁿ⁺] ≤ 1,0×10⁻⁵ mol/L.
// ====================================================
export const CATS = {
  Cr: { id: 'Cr', nom: 'chrome(III)',     ion: 'Cr³⁺', n: 3, solide: 'Cr(OH)₃', Ks: 6.7e-31, M: 103.02, col: '#7c3aed', colS: '#a78bfa' },
  Ni: { id: 'Ni', nom: 'nickel(II)',      ion: 'Ni²⁺', n: 2, solide: 'Ni(OH)₂', Ks: 1.6e-16, M: 92.71,  col: '#15803d', colS: '#4ade80' },
  Mn: { id: 'Mn', nom: 'manganèse(II)',   ion: 'Mn²⁺', n: 2, solide: 'Mn(OH)₂', Ks: 2e-13,   M: 88.95,  col: '#be185d', colS: '#f9a8d4' },
  Mg: { id: 'Mg', nom: 'magnésium(II)',   ion: 'Mg²⁺', n: 2, solide: 'Mg(OH)₂', Ks: 8.9e-12, M: 58.32,  col: '#0369a1', colS: '#e2e8f0' },
};
export const ORDRE = ['Cr', 'Ni', 'Mn', 'Mg'];
export const C_FIN = 1.0e-5;          // convention : précipitation quasi totale
export const LARGEUR_MIN = 0.3;       // fenêtre de pH jugée réalisable en pratique (unités de pH)
export const CONCS = [1e-3, 1e-2, 1e-1];

export const pKs = cat => -Math.log10(cat.Ks);
// [HO⁻] à partir de laquelle Mⁿ⁺ (concentration c) commence à précipiter : Ks = c × [HO⁻]ⁿ
export const ohSeuil = (cat, c) => Math.pow(cat.Ks / c, 1 / cat.n);
export const phDe = oh => 14 + Math.log10(oh);
export const phDebut = (cat, c) => phDe(ohSeuil(cat, c));
export const phFin = (cat, cFin = C_FIN) => phDe(ohSeuil(cat, cFin));   // ne dépend pas de la concentration de départ (seulement du seuil conventionnel)
// Concentration restante de l'ion à un pH donné (si pH < pH de début : rien n'a précipité)
export const restant = (cat, c0, ph) => { const oh = Math.pow(10, ph - 14), cmax = cat.Ks / Math.pow(oh, cat.n); return Math.min(c0, cmax); };
export const fractionPrecipitee = (cat, c0, ph) => 1 - restant(cat, c0, ph) / c0;
// Statut à un pH donné
export const statut = (cat, c0, ph) => { const r = restant(cat, c0, ph); return r >= c0 * (1 - 1e-9) ? 'dissous' : r <= C_FIN ? 'total' : 'partiel'; };

// Séparation de deux cations A (précipite en premier) et B : fenêtre de pH [phFin(A), phDebut(B)]
export function fenetre(catA, cA, catB, cB) {
  const dA = phDebut(catA, cA), dB = phDebut(catB, cB);
  const [p, c1, q, c2] = dA <= dB ? [catA, cA, catB, cB] : [catB, cB, catA, cA];
  const lo = phFin(p), hi = phDebut(q, c2);
  const largeur = hi - lo;
  return { premier: p, cPremier: c1, second: q, cSecond: c2, lo, hi, largeur, ok: largeur > 0, pratique: largeur >= LARGEUR_MIN, qualite: largeur >= 1 ? 'nette' : largeur >= LARGEUR_MIN ? 'étroite' : 'impossible' };
}

// ----- mise en forme française -----
const EXP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const sup = n => [...String(n)].map(c => EXP[c] ?? c).join('');
export const sci = (x, d = 2) => { if (!x) return '0'; let e = Math.floor(Math.log10(Math.abs(x))), m = x / Math.pow(10, e); if (Number(m.toFixed(d)) >= 10) { m /= 10; e += 1; } return `${m.toFixed(d).replace('.', ',')}×10${sup(e)}`; };
export const sciNb = (x, d = 2) => sci(x, d).replace(/ /g, ' ');
export const nbf = (v, d = 1) => Number(v).toFixed(d).replace('.', ',');
export const phTxt = v => nbf(v, 1);

// ====================================================
//  Défis (les données affichées sont exactement celles du corrigé : concentrations à 2 chiffres significatifs, pH comparés à 0,1 près)
// ====================================================
const pick = t => t[Math.floor(Math.random() * t.length)];
const CONC_DEFI = [0.0050, 0.010, 0.020, 0.050, 0.10];
// Défi « choisir le pH qui sépare » : deux cations dont la fenêtre fait au moins 1 unité de pH
export function tirageDefiSeparer() {
  for (let essai = 0; essai < 500; essai++) {
    const [a, b] = [pick(ORDRE), pick(ORDRE)]; if (a === b) continue;
    const cA = pick(CONC_DEFI), cB = pick(CONC_DEFI), w = fenetre(CATS[a], cA, CATS[b], cB);
    if (w.largeur >= 1.0) return { a, b, cA, cB, w };
  }
  return { a: 'Cr', b: 'Mg', cA: 0.010, cB: 0.010, w: fenetre(CATS.Cr, 0.010, CATS.Mg, 0.010) };
}
// Diagnostic : le pH saisi sépare-t-il ? (tolérance 0,1 unité de pH de chaque côté : lecture sur l'axe)
export function diagSeparer(d, ph) {
  if (!Number.isFinite(ph)) return { ok: false, msg: 'Écrivez un pH sous forme d’un nombre (par exemple 7,5).' };
  if (ph < 0 || ph > 14) return { ok: false, msg: 'Un pH d’une solution aqueuse à 25 °C est compris entre 0 et 14.' };
  const { w } = d, premier = CATS[w.premier.id], second = CATS[w.second.id], TOL = 0.1;
  if (ph >= w.lo - 1e-9 && ph <= w.hi + 1e-9) return { ok: true, msg: '' };
  if (ph < w.lo) {
    const r = restant(premier, w.cPremier, ph), reste = r / w.cPremier * 100;
    if (ph >= w.lo - TOL) return { ok: true, msg: '' };
    return { ok: false, cas: 'bas', msg: `À pH ${phTxt(ph)}, les ions ${premier.ion} ne sont pas assez précipités : il en reste ${reste >= 10 ? nbf(reste, 0) : nbf(reste, 1)} % (la précipitation n’est « quasi totale » qu’à partir de pH ${phTxt(w.lo)}). Augmentez le pH.` };
  }
  if (ph <= w.hi + TOL) return { ok: true, msg: '' };
  const f = fractionPrecipitee(second, w.cSecond, ph) * 100;
  return { ok: false, cas: 'haut', msg: `À pH ${phTxt(ph)}, ${second.solide} a déjà commencé à précipiter (${f >= 10 ? nbf(f, 0) : nbf(f, 1)} % des ions ${second.ion}) : il ne sera plus séparé. Diminuez le pH sous ${phTxt(w.hi)}.` };
}
// Défi « pH de début de précipitation » : un cation, une concentration
export function tirageDefiDebut() {
  const id = pick(ORDRE), c = pick(CONC_DEFI), cat = CATS[id];
  return { id, c, ph: phDebut(cat, c), oh: ohSeuil(cat, c) };
}
export function diagDebut(d, ph) {
  const cat = CATS[d.id], TOL = 0.15;
  if (!Number.isFinite(ph)) return { ok: false, msg: 'Écrivez un pH sous forme d’un nombre (par exemple 8,5).' };
  if (Math.abs(ph - d.ph) <= TOL) return { ok: true, msg: '' };
  if (ph < 0 || ph > 14) return { ok: false, msg: 'Un pH d’une solution aqueuse à 25 °C est compris entre 0 et 14.' };
  // erreurs classiques : pOH donné à la place du pH ; oubli de la puissance 1/n ; oubli de c
  const pOH = 14 - d.ph;
  if (Math.abs(ph - pOH) <= TOL) return { ok: false, msg: `Vous avez donné le pOH (${phTxt(pOH)}) : le pH s’en déduit avec pH = 14 − pOH.` };
  const ohSans = cat.Ks / d.c, phSans = phDe(ohSans);                       // n traité comme 1
  if (cat.n > 1 && Math.abs(ph - phSans) <= TOL) return { ok: false, msg: `Vous avez utilisé [HO⁻] = Ks ÷ c sans l’exposant : Ks = c × [HO⁻]${sup(cat.n)}, donc [HO⁻] = (Ks ÷ c)^(1/${cat.n}) : racine ${cat.n === 2 ? 'carrée' : 'cubique'}.` };
  const phSansC = phDe(Math.pow(cat.Ks, 1 / cat.n));
  if (Math.abs(ph - phSansC) <= TOL) return { ok: false, msg: 'Vous avez oublié de diviser Ks par la concentration de l’ion métallique avant la racine.' };
  return { ok: false, msg: `Le pH attendu est ${ph > d.ph ? 'plus petit' : 'plus grand'} que ${phTxt(ph)}. Refaites : [HO⁻] = (Ks ÷ c)^(1/${cat.n}) puis pH = 14 + log [HO⁻].` };
}
