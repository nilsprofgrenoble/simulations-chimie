// Exercices de calcul (REA) du chapitre BTS « Spectroscopies IR et UV-visible » : tirage pur, testé par lumMatExos.test.mjs.
//  • tirageBandeIR : d'une longueur d'onde infrarouge au nombre d'onde, à l'énergie (J puis eV) et à la comparaison avec un photon UV (sim 300)
// Reçoit une fonction `tire(tableau)` et renvoie { intro, questions, retenir }.
const NB = '\u00a0';
const d = (x, k) => Number(x).toFixed(k).replace('.', ',').replace('-', '−');
const arr = (x, k) => Number(Number(x).toFixed(k));
const filtrePieges = q => { const seuil = Math.max(1.5 * q.tolRel, 0.08); q.pieges = q.pieges.filter(([v]) => Number.isFinite(v) && Math.abs(v - q.vrai) > seuil * Math.abs(q.vrai)); };
export const H = 6.63e-34, CL = 3.00e8, EV = 1.60e-19;
const CST = `h = 6,63${NB}×${NB}10⁻³⁴${NB}J·s ; c = 3,00${NB}×${NB}10⁸${NB}m·s⁻¹ ; 1${NB}eV = 1,60${NB}×${NB}10⁻¹⁹${NB}J`;

export function tirageBandeIR(tire) {
  const lamUm = tire([2.5, 4.0, 5.0, 6.25, 8.0, 10.0]);
  const sigma = 1e4 / lamUm;                       // cm⁻¹, valeur exacte pour ces λ
  const EJ = H * CL * sigma * 100;                 // J (σ en m⁻¹)
  const E20 = EJ / 1e-20, E20r = arr(E20, 2), EeV = E20r * 1e-20 / EV;
  const ratio = lamUm / 0.25;                      // E(UV 250 nm) / E(bande IR)
  const intro = `Un spectre infrarouge présente une bande d’absorption vers λ = ${d(lamUm, lamUm % 1 ? 2 : 1)}${NB}µm. Constantes : ${CST}.`;
  const q1 = { id: 'ir0', type: 'num', unite: 'cm⁻¹', vrai: sigma, tolRel: 0.05, csMin: 2,
    q: `Calculez le nombre d’onde σ de cette bande, en cm⁻¹ (σ = 1/λ avec λ en cm ; 1${NB}µm = 10⁻⁴${NB}cm).`,
    aide: 'Convertissez d’abord λ en centimètres, puis prenez l’inverse. Raccourci : σ(cm⁻¹) = 10 000 / λ(µm).',
    pieges: [[1 / lamUm, 'Vous avez calculé 1/λ sans convertir les micromètres en centimètres : il manque le facteur 10⁴.'], [1e3 / lamUm, 'Il y a une erreur de puissance de 10 : 1 µm = 10⁻⁴ cm, donc σ = frac(10⁴|λ).'], [1e5 / lamUm, 'Il y a une erreur de puissance de 10 : 1 µm = 10⁻⁴ cm, donc σ = frac(10⁴|λ).'], [lamUm * 1e-4, 'Vous avez donné λ en centimètres : le nombre d’onde est son inverse.']],
    expl: `λ = ${d(lamUm, 2)}${NB}µm = ${d(lamUm * 1e-4, 6)}${NB}cm, donc σ = 1/λ = ${d(sigma, 0)}${NB}cm⁻¹.` };
  const q2 = { id: 'ir1', type: 'num', unite: '× 10⁻²⁰ J', vrai: E20, tolRel: 0.05, csMin: 2,
    q: `La bande est à σ = ${d(sigma, 0)}${NB}cm⁻¹ (valeur donnée). Calculez l’énergie du photon absorbé, E = h·c·σ avec σ en m⁻¹, en unités de 10⁻²⁰${NB}J (2 chiffres significatifs).`,
    aide: '1 cm⁻¹ = 100 m⁻¹ : convertissez σ en m⁻¹, puis E = h·c·σ.',
    pieges: [[E20 / 100, 'Vous avez utilisé σ en cm⁻¹ sans le convertir en m⁻¹ (facteur 100).'], [E20 * 100, 'Vous avez converti dans le mauvais sens : 1 cm⁻¹ = 100 m⁻¹.'], [E20 / 1e-1 * 1e-1 / 1.6e-19 * 1e-20, 'Vous avez divisé par 1,60·10⁻¹⁹ : ce résultat est en électronvolts, on demande des joules.']],
    expl: `σ = ${d(sigma, 0)}${NB}cm⁻¹ = ${d(sigma * 100, 0)}${NB}m⁻¹ ; E = h·c·σ = 6,63·10⁻³⁴ × 3,00·10⁸ × ${d(sigma * 100, 0)} ≈ ${d(E20, 2)}${NB}×${NB}10⁻²⁰${NB}J.` };
  const q3 = { id: 'ir2', type: 'num', unite: 'eV', vrai: EeV, tolRel: 0.05, csMin: 2,
    q: `Le photon a pour énergie E = ${d(E20r, 2)}${NB}×${NB}10⁻²⁰${NB}J (valeur donnée). Exprimez cette énergie en électronvolts (2 chiffres significatifs).`,
    aide: '1 eV = 1,60·10⁻¹⁹ J : divisez l’énergie en joules par 1,60·10⁻¹⁹.',
    pieges: [[E20r * 1e-20 * EV, 'Vous avez multiplié par 1,60·10⁻¹⁹ au lieu de diviser : pour passer des joules aux électronvolts, on divise.'], [E20r / 1.6, 'Vous avez oublié la puissance de 10 : 10⁻²⁰ J = 0,1 × 10⁻¹⁹ J.'], [E20r * 1e-20, 'C’est l’énergie en joules : divisez par 1,60·10⁻¹⁹ pour obtenir des électronvolts.']],
    expl: `E = ${d(E20r, 2)}·frac(10⁻²⁰|1),60·10⁻¹⁹ ≈ ${d(EeV, 3)}${NB}eV, de l’ordre de grandeur d’une vibration de liaison (0,06 à 0,5${NB}eV).` };
  const q4 = { id: 'ir3', type: 'num', unite: '', vrai: ratio, tolRel: 0.05, csMin: 2,
    q: `Un photon ultraviolet de longueur d’onde 250${NB}nm est comparé au photon infrarouge de λ = ${d(lamUm, lamUm % 1 ? 2 : 1)}${NB}µm. Combien de fois le photon UV est-il plus énergétique ? (2 chiffres significatifs)`,
    aide: 'E = h·c/λ : à h et c fixés, l’énergie est inversement proportionnelle à λ. Convertissez 250 nm en µm (0,250 µm).',
    pieges: [[1 / ratio, 'Vous avez inversé le rapport : le photon de plus petite longueur d’onde est le plus énergétique.'], [lamUm / 250, 'Vous avez comparé 250 (nm) et λ (µm) sans convertir : 250 nm = 0,250 µm.'], [lamUm - 0.25, 'Vous avez fait une différence : l’énergie est inversement proportionnelle à λ, on calcule un rapport.']],
    expl: `E(UV)/E(IR) = λ(IR)/λ(UV) = ${d(lamUm, 2)} / 0,250 = ${d(ratio, 1)}.` };
  const qs = [q1, q2, q3, q4]; qs.forEach(filtrePieges);
  return { intro, questions: qs,
    retenir: ['σ(cm⁻¹) = 10 000 / λ(µm) ; E = h·c/λ = h·c·σ.', 'Une bande infrarouge correspond à des photons de 0,06 à 0,5 eV : l’énergie d’une vibration de liaison.', 'À constantes fixées, l’énergie d’un photon est inversement proportionnelle à sa longueur d’onde.'] };
}
