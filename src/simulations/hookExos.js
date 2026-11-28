// Exercices de calcul (REA) de la sim 304 « Infrarouge : de la liaison-ressort au spectre » : tirage pur, testé par hookExos.test.mjs.
//  • tirageHooke : masse réduite, nombre d'onde (loi de Hooke), longueur d'onde et énergie du photon absorbé
import { LIAISONS, MASSE, masseReduite, sigmaHooke, U, CL } from './hookModele.js';
const NB = ' ';
const d = (x, k) => Number(x).toFixed(k).replace('.', ',').replace('-', '−');
const arr = (x, k) => Number(Number(x).toFixed(k));
const filtrePieges = q => { const seuil = Math.max(1.5 * q.tolRel, 0.08); q.pieges = q.pieges.filter(([v]) => Number.isFinite(v) && Math.abs(v - q.vrai) > seuil * Math.abs(q.vrai)); };
const H = 6.63e-34, EV = 1.60e-19;

export function tirageHooke(tire) {
  const l = tire(LIAISONS.filter(x => ['CH', 'OH', 'NH', 'CO2', 'CC2', 'CC3'].includes(x.id))), m1 = MASSE[l.a], m2 = MASSE[l.b];
  const mu = masseReduite(m1, m2), mur = arr(mu, 3), sig = sigmaHooke(l.k, mur), sigr = arr(sig, 0);
  const lam = 1e4 / sigr, E = H * CL * sigr * 100 / EV;
  const intro = `Une liaison relie un atome de masse ${m1}${NB}u à un atome de masse ${m2}${NB}u ; sa raideur vaut k = ${l.k}${NB}N/m. Constantes : u = 1,66·10⁻²⁷${NB}kg ; c = 3,00·10⁸${NB}m/s ; h = 6,63·10⁻³⁴${NB}J·s ; 1${NB}eV = 1,60·10⁻¹⁹${NB}J.`;
  const q1 = { id: 'hk0', type: 'num', unite: 'u', vrai: mu, tolRel: 0.05, csMin: 3,
    q: `Calculez la masse réduite μ de la liaison, μ = frac(m₁·m₂|m₁ + m₂), en u (3 chiffres significatifs).`,
    aide: 'Produit des deux masses divisé par leur somme.',
    pieges: [[(m1 + m2) / 2, 'Vous avez fait la moyenne des masses : la formule est le produit divisé par la somme.'], [m1 + m2, 'Vous avez donné la somme des masses.'], [m1 * m2, 'Vous avez donné le produit sans diviser par la somme.']],
    expl: `μ = (${m1} × ${m2}) / (${m1} + ${m2}) ≈ ${d(mu, 3)}${NB}u.` };
  const q2 = { id: 'hk1', type: 'num', unite: 'cm⁻¹', vrai: sig, tolRel: 0.05, csMin: 3,
    q: `Avec μ = ${d(mur, 3)}${NB}u (valeur donnée), calculez le nombre d’onde de la bande, σ = frac(sqrt(k/μ)|2π·c), en cm⁻¹ (3 chiffres significatifs). Convertissez μ en kg.`,
    aide: 'μ(kg) = μ(u) × 1,66·10⁻²⁷ ; σ vient en m⁻¹, puis 1 m⁻¹ = 10⁻² cm⁻¹.',
    pieges: [[sig * 100, 'Vous avez laissé σ en m⁻¹ : divisez par 100 pour l’exprimer en cm⁻¹.'], [sig * 2 * Math.PI, 'Vous avez oublié le facteur 2π au dénominateur.'], [sig / Math.sqrt(1.66e-27), 'Vous avez oublié de convertir μ en kg (u → kg).'], [sig * Math.SQRT2 * Math.SQRT2, 'Vérifiez la racine carrée : σ varie comme sqrt(k/μ), pas comme k/μ.']],
    expl: `μ = ${d(mur, 3)} × 1,66·10⁻²⁷ = ${d(mur * U / 1e-27, 3)}·10⁻²⁷ kg ; sqrt(k/μ) = ${d(Math.sqrt(l.k / (mur * U)) / 1e14, 3)}·10¹⁴ rad/s ; σ = sqrt(k/μ) / (2π·c) ≈ ${d(sig, 0)}${NB}cm⁻¹.` };
  const q3 = { id: 'hk2', type: 'num', unite: 'µm', vrai: lam, tolRel: 0.05, csMin: 3,
    q: `La bande est à σ = ${d(sigr, 0)}${NB}cm⁻¹ (valeur donnée). Calculez la longueur d’onde correspondante, en µm (3 chiffres significatifs).`,
    aide: 'λ(µm) = 10 000 / σ(cm⁻¹).',
    pieges: [[1 / sigr, 'Vous avez pris l’inverse sans convertir les centimètres en micromètres (facteur 10⁴).'], [1e3 / sigr, 'Il y a une erreur de puissance de 10 : 1 cm = 10⁴ µm.'], [1e5 / sigr, 'Il y a une erreur de puissance de 10 : 1 cm = 10⁴ µm.']],
    expl: `λ = 10 000 / ${d(sigr, 0)} ≈ ${d(lam, 2)}${NB}µm.` };
  const q4 = { id: 'hk3', type: 'num', unite: 'eV', vrai: E, tolRel: 0.05, csMin: 2,
    q: `Calculez l’énergie du photon absorbé à σ = ${d(sigr, 0)}${NB}cm⁻¹, E = h·c·σ, en eV (2 chiffres significatifs). Convertissez σ en m⁻¹.`,
    aide: '1 cm⁻¹ = 100 m⁻¹ ; E en J = h·c·σ ; puis division par 1,60·10⁻¹⁹.',
    pieges: [[E / 100, 'Vous avez utilisé σ en cm⁻¹ sans le convertir en m⁻¹ (facteur 100).'], [E * EV, 'Vous avez laissé l’énergie en joules : divisez par 1,60·10⁻¹⁹ pour obtenir des eV.'], [E * 100, 'Vous avez converti dans le mauvais sens : 1 cm⁻¹ = 100 m⁻¹.']],
    expl: `σ = ${d(sigr * 100, 0)} m⁻¹ ; E = 6,63·10⁻³⁴ × 3,00·10⁸ × ${d(sigr * 100, 0)} ≈ ${d(H * CL * sigr * 100 / 1e-20, 2)}·10⁻²⁰ J ≈ ${d(E, 3)}${NB}eV.` };
  const qs = [q1, q2, q3, q4]; qs.forEach(filtrePieges);
  return { intro, questions: qs,
    retenir: ['μ = frac(m₁·m₂|m₁ + m₂) ; σ = frac(sqrt(k/μ)|2π·c) : σ augmente avec k et diminue avec μ.', 'λ(µm) = 10 000 / σ(cm⁻¹) ; E = h·c·σ avec σ en m⁻¹.', 'Les liaisons faisant intervenir H (μ petite) absorbent à nombre d’onde élevé.'] };
}
