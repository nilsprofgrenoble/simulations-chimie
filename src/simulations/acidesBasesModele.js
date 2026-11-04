// ====================================================
//  MODÈLE « ACIDES ET BASES » (sim 85) — solutions aqueuses à 25 °C
//  Hypothèses : activités = concentrations (solutions diluées), Ke = 1,0·10⁻¹⁴, volumes additifs,
//  acides forts et bases fortes totalement dissociés, pas de CO₂ dissous.
//  Le pH est calculé « exactement » par la conservation de la charge (autoprotolyse de l'eau et polyacides compris) ;
//  les formules du cours (pH = ½(pKa − log C), Henderson-Hasselbalch…) sont des approximations qu'on compare à ce calcul.
// ====================================================

export const KE = 1e-14;

// Fractions α_i de chaque espèce d'un (poly)acide, i = 0 (la plus protonée) … n ; pKas = [pKa1, pKa2, …]
export function fractions(h, pKas) {
  const ka = pKas.map(p => 10 ** -p);
  const n = ka.length;
  const termes = [1];
  for (let i = 1; i <= n; i++) termes.push(termes[i - 1] * ka[i - 1] / h);       // [A_i]/[A_0] = Π Ka / h^i
  const S = termes.reduce((a, b) => a + b, 0);
  return termes.map(t => t / S);
}

// Charge négative moyenne portée par une mole d'acide : Σ i·α_i
const chargeMoy = (h, pKas) => fractions(h, pKas).reduce((s, a, i) => s + i * a, 0);

// Résolution de f(lh) = 0 (f croissante en lh = log10 h) par dichotomie ; renvoie le pH
function resous(f) {
  let a = -18, b = 1;
  for (let it = 0; it < 200; it++) { const m = (a + b) / 2; if (f(m) > 0) b = m; else a = m; }
  return -(a + b) / 2;
}

// pH d'un mélange : acide faible (ou polyacide) de concentration totale C (mol/L), + base forte cb (Na⁺) + acide fort ca (Cl⁻), en mol/L dans le mélange.
// Conservation de la charge : h + cb = Ke/h + C·Σ i·α_i + ca
export function pH({ C = 0, pKas = [], cb = 0, ca = 0 }) {
  return resous(lh => { const h = 10 ** lh; return h + cb - KE / h - (pKas.length ? C * chargeMoy(h, pKas) : 0) - ca; });
}

export const concH = ph => 10 ** -ph;

// Taux d'avancement final d'un acide faible de concentration C dans l'eau pure : τ = [A⁻]/C
export function tauAcide(C, pKa) { return fractions(concH(pH({ C, pKas: [pKa] })), [pKa])[1]; }
// pH d'une base faible B de concentration C (pKa du couple BH⁺/B) : charge h + C·α(BH⁺) = Ke/h
export function pHBase(C, pKa) { return resous(lh => { const h = 10 ** lh; return h + C * fractions(h, [pKa])[0] - KE / h; }); }
// Taux d'avancement d'une base faible : τ = [BH⁺]/C
export function tauBase(C, pKa) { return fractions(concH(pHBase(C, pKa)), [pKa])[0]; }

// Approximations du cours
export const pHAcideFortApprox = C => -Math.log10(C);
export const pHAcideFaibleApprox = (C, pKa) => 0.5 * (pKa - Math.log10(C));
export const pHBaseFaibleApprox = (C, pKa) => 0.5 * (14 + pKa + Math.log10(C));
export const hendersonHasselbalch = (pKa, A, AH) => pKa + Math.log10(A / AH);

// Constante de réaction acide A1H + base A2⁻ → A1⁻ + A2H : K = Ka1 / Ka2 = 10^(pKa2 − pKa1)
export const logK = (pKaAcide, pKaBase) => pKaBase - pKaAcide;

// ---------- solution tampon ----------
// Tampon : n_AH mol d'acide et n_A mol de base conjuguée dans V litres ; on ajoute nOH mol de soude (négatif = acide fort) ; volume supposé inchangé
export function pHTampon({ nAH, nA, V, pKa, nAjout = 0 }) {
  // la base conjuguée A⁻ provient de Na⁺A⁻ : cb = nA/V (Na⁺) ; on ajoute de la soude (cb ↑) ou de l'acide fort (ca ↑)
  const C = (nAH + nA) / V;
  const cb = (nA + Math.max(0, nAjout)) / V, ca = Math.max(0, -nAjout) / V;
  return pH({ C, pKas: [pKa], cb, ca });
}
// Pouvoir tampon β = dn_base/dpH × 1/V (mol/L par unité de pH), par différence centrée
export function pouvoirTampon({ nAH, nA, V, pKa }) {
  const d = Math.min(nAH, nA) * 1e-3 + 1e-9;
  const p1 = pHTampon({ nAH, nA, V, pKa, nAjout: d }), p0 = pHTampon({ nAH, nA, V, pKa, nAjout: -d });
  return (2 * d / V) / (p1 - p0);
}

// ---------- titrage ----------
// Titrage de V0 (L) d'un acide (poly)faible ou fort de concentration C0 par de la soude de concentration Cb ; Vb en L.
// pKas = [] : acide fort.
export function pHTitrage({ C0, V0, pKas, Cb, Vb }) {
  const Vt = V0 + Vb, C = C0 * V0 / Vt, cb = Cb * Vb / Vt;
  if (!pKas.length) return pH({ C: 0, pKas: [], cb, ca: C });
  return pH({ C, pKas, cb });
}
// Titrage d'une base forte (ou faible) par de l'acide chlorhydrique : on modélise la base faible B par son acide conjugué BH⁺ introduit en totalité sous forme basique
export function pHTitrageBase({ C0, V0, pKa, Ca, Va }) {
  const Vt = V0 + Va, C = C0 * V0 / Vt, ca = Ca * Va / Vt;
  if (pKa == null) return pH({ C: 0, pKas: [], cb: C, ca });            // base forte
  return resous(lh => { const h = 10 ** lh; return h + C * fractions(h, [pKa])[0] - KE / h - ca; });   // charge : h + C·α(BH⁺) = Ke/h + ca
}
// Volume équivalent (L) pour la i-ème acidité : Veq_i = i·C0·V0/Cb
export const volumeEquivalent = (C0, V0, Cb, i = 1) => i * C0 * V0 / Cb;

// Courbe pH(Vb) et dérivée dpH/dV (par différence centrée)
export function courbeTitrage(p, Vmax, n = 400) {
  const pts = [];
  for (let k = 0; k <= n; k++) { const Vb = Vmax * k / n; pts.push({ V: Vb, pH: pHTitrage({ ...p, Vb }) }); }
  for (let k = 0; k <= n; k++) {
    const a = pts[Math.max(0, k - 1)], b = pts[Math.min(n, k + 1)];
    pts[k].d = (b.pH - a.pH) / (b.V - a.V);
  }
  return pts;
}
// Équivalence par la méthode de la dérivée (maximum de dpH/dV)
export function equivalenceDerivee(pts) {
  let k = 1; for (let i = 1; i < pts.length - 1; i++) if (pts[i].d > pts[k].d) k = i;
  return pts[k].V;
}
// Équivalence par la méthode des tangentes : intersection des deux tangentes parallèles de part et d'autre du saut, puis milieu du segment qu'elles découpent.
// Ici, version numérique pour tests : pour une courbe symétrique, l'abscisse du point d'inflexion.
export function pHaDemiEquivalence(p) { return pHTitrage({ ...p, Vb: volumeEquivalent(p.C0, p.V0, p.Cb, 1) / 2 }); }

// ---------- indicateurs colorés ----------
export const INDICATEURS = [
  { id: 'jm',  nom: 'jaune de méthyle',     zone: [2.9, 4.0],  acide: '#dc2626', base: '#facc15', pKa: 3.45 },
  { id: 'vbc', nom: 'vert de bromocrésol',  zone: [3.8, 5.4],  acide: '#facc15', base: '#2563eb', pKa: 4.6 },
  { id: 'bbt', nom: 'bleu de bromothymol',  zone: [6.0, 7.6],  acide: '#facc15', base: '#2563eb', pKa: 6.8 },
  { id: 'php', nom: 'phénolphtaléine',      zone: [8.2, 10.0], acide: '#f8fafc', base: '#db2777', pKa: 9.1 },
  { id: 'jar', nom: 'jaune d’alizarine R',  zone: [10.1, 12.0], acide: '#facc15', base: '#b45309', pKa: 11.0 },
];
// Fraction de forme basique de l'indicateur à un pH donné (modèle d'un couple HIn/In⁻ de pKa au milieu de la zone de virage)
export const fractionBasiqueIndicateur = (ind, ph) => 1 / (1 + 10 ** (ind.pKa - ph));
// Un indicateur convient à un titrage si sa zone de virage est entièrement contenue dans le saut de pH (autour de l'équivalence)
export function convient(ind, pHavant, pHapres) { return ind.zone[0] >= pHavant && ind.zone[1] <= pHapres; }
// Saut de pH : pH à Veq − 0,1·Veq et à Veq + 0,1·Veq (écart de 10 %), pour juger du choix de l'indicateur
export function sautPH(p, i = 1) {
  const Ve = volumeEquivalent(p.C0, p.V0, p.Cb, i);
  return [pHTitrage({ ...p, Vb: 0.99 * Ve }), pHTitrage({ ...p, Vb: 1.01 * Ve })];
}
// Couleur d'un indicateur à un pH (mélange linéaire des deux teintes)
export function couleurIndicateur(ind, ph) {
  const t = fractionBasiqueIndicateur(ind, ph), hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const a = hex(ind.acide), b = hex(ind.base);
  return `rgb(${a.map((x, k) => Math.round(x + (b[k] - x) * t)).join(',')})`;
}

// ---------- incertitudes de métrologie (titrage) ----------
// Concentration inconnue Ca = Cb·Veq / V0 ; incertitudes de type B (loi rectangulaire, u = demi-étendue/√3), sources indépendantes
export function incertitudeTitrage({ Cb, Veq, V0, uCb, uVeq, uV0 }) {
  const Ca = Cb * Veq / V0;
  const rel = Math.sqrt((uCb / Cb) ** 2 + (uVeq / Veq) ** 2 + (uV0 / V0) ** 2);
  return { Ca, rel, u: Ca * rel };
}
// Compatibilité de deux valeurs : |x − xref| / u(x) ≤ 2 (critère du programme, u de la mesure seule si la référence est exacte)
export const compatible = (x, xref, u) => Math.abs(x - xref) / u <= 2;
