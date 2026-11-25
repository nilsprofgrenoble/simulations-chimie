// ====================================================
//  Modèle « Effet photoélectrique » (sim 240, TG spé PC, « Ondes et signaux », « Décrire la lumière par un flux de photons »).
//  Modèle pur (sans React), test : effetPhotoModele.test.mjs.
//  Un photon de fréquence ν (longueur d'onde λ = c / ν) a l'énergie E = h ν = h c / λ. Il est absorbé en entier par UN électron du métal.
//  Une partie W de l'énergie (travail d'extraction : énergie minimale pour arracher un électron au métal) sert à l'extraire ;
//  le reste est l'énergie cinétique de l'électron : h ν = W + Ec. Les électrons les plus faiblement liés sortent avec Ec,max = h ν − W
//  (les autres, plus profonds, perdent de l'énergie avant de sortir). Pas d'effet si h ν < W : fréquence seuil ν0 = W / h.
//  Le nombre d'électrons éjectés par seconde est proportionnel au nombre de photons reçus par seconde (intensité de la lumière).
// ====================================================
export const H = 6.63e-34;        // J·s (constante de Planck, donnée)
export const C = 3.00e8;          // m·s⁻¹ (célérité de la lumière dans le vide)
export const EV = 1.60e-19;       // J (1 eV)
export const ME = 9.11e-31;       // kg (masse de l'électron ; sert seulement à l'animation)
export const METAUX = [
  { id: 'cs', nom: 'césium', court: 'Césium', W: 2.0 },
  { id: 'k', nom: 'potassium', court: 'Potassium', W: 2.3 },
  { id: 'ca', nom: 'calcium', court: 'Calcium', W: 2.9 },
  { id: 'zn', nom: 'zinc', court: 'Zinc', W: 4.3 },
  { id: 'cu', nom: 'cuivre', court: 'Cuivre', W: 4.7 },
];                                // W en eV : ordres de grandeur arrondis (varient avec l'état de surface et la méthode de mesure)
export const metalDe = id => METAUX.find(m => m.id === id);

// ν en unités de 10¹⁴ Hz (nu14), λ en nm, énergies en eV
export const nuHz = nu14 => nu14 * 1e14;
export const lambdaNm = nu14 => C / (nu14 * 1e14) * 1e9;
export const nu14DeLambda = nm => C / (nm * 1e-9) / 1e14;
export const energiePhotonJ = nu14 => H * nu14 * 1e14;
export const energiePhotonEV = nu14 => H * nu14 * 1e14 / EV;
export const energieDeLambdaEV = nm => H * C / (nm * 1e-9) / EV;     // ≈ 1243 / λ(nm)
export const ecMaxEV = (nu14, W) => Math.max(0, energiePhotonEV(nu14) - W);
export const ejecte = (nu14, W) => energiePhotonEV(nu14) > W;
export const nuSeuil14 = W => W * EV / H / 1e14;                      // 10¹⁴ Hz
export const lambdaSeuilNm = W => H * C / (W * EV) * 1e9;
export const vitesseEcMax = ecEV => Math.sqrt(2 * ecEV * EV / ME);   // m·s⁻¹ (animation seulement)
export const nuDeDomaine = { min: 3.0, max: 14.0 };                   // 10¹⁴ Hz : de l'infrarouge proche (λ ≈ 1000 nm) à l'ultraviolet (λ ≈ 214 nm)

/** Domaine de la lumière et couleur d'affichage selon la longueur d'onde (nm). Le visible va d'environ 400 à 750 nm. */
export function domaineLumiere(nm) {
  if (nm < 400) return { nom: 'ultraviolet (invisible)', visible: false };
  if (nm > 750) return { nom: 'infrarouge (invisible)', visible: false };
  const nom = nm < 450 ? 'violet' : nm < 495 ? 'bleu' : nm < 570 ? 'vert' : nm < 590 ? 'jaune' : nm < 620 ? 'orange' : 'rouge';
  return { nom, visible: true };
}
/** Couleur de tracé d'un photon (hex). Invisible : teinte neutre distincte (UV violet foncé, IR brun) : le nom du domaine est toujours écrit. */
export function couleurLumiere(nm) {
  if (nm < 380) return '#5b21b6';
  if (nm > 780) return '#7c2d12';
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = -(nm - 440) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = -(nm - 645) / 65; } else { r = 1; }
  const k = nm < 420 ? 0.55 + 0.45 * (nm - 380) / 40 : nm > 700 ? 0.55 + 0.45 * (780 - nm) / 80 : 1;
  const f = x => Math.round(255 * Math.pow(Math.max(0, x) * k, 0.8) * 0.82);        // légèrement assombri : lisible sur fond clair
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

export function rngGraine(graine) {
  let a = (graine >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const r2 = x => Number(x.toPrecision(2));
export const ecartArrondi = x => Math.abs(r2(x) - x) / Math.abs(x);
const tire = (t, rng) => t[Math.floor(rng() * t.length)];

/** Défi « bilan d'énergie » : métal (W) et lumière (λ en nm) donnés. Q1 : énergie du photon (eV) ; Q2 : Ec,max (eV) ; Q3 : fréquence seuil du métal (10¹⁴ Hz). */
export function tirageDirect(rng = Math.random) {
  for (;;) {
    const m = tire(METAUX, rng), lam = tire([200, 210, 220, 240, 250, 260, 280, 300, 320, 350, 400, 430], rng);
    const E = energieDeLambdaEV(lam), Ec = E - m.W;
    if (Ec < 0.6 || E > 6.3) continue;
    return { type: 'direct', metal: m.nom, W: m.W, lam, rep1: E, rep2: Ec, rep3: nuSeuil14(m.W) };
  }
}
/** Défi « métal inconnu » : fréquence ν (10¹⁴ Hz) et Ec,max (eV) mesurée. Q1 : énergie du photon (eV) ; Q2 : travail d'extraction W (eV) ; Q3 : fréquence seuil (10¹⁴ Hz). */
export function tirageInconnu(rng = Math.random) {
  for (;;) {
    const nu = tire([6.5, 7.0, 7.5, 8.0, 9.0, 10.0, 11.0, 12.0], rng), Ec = tire([0.3, 0.4, 0.5, 0.6, 0.8, 1.0, 1.2, 1.5, 1.8, 2.0], rng);
    const E = energiePhotonEV(nu), W = E - Ec;
    if (W < 1.8 || W > 5 || Ec < 0.3) continue;
    return { type: 'inconnu', nu, Ec, rep1: E, rep2: W, rep3: nuSeuil14(W) };
  }
}
