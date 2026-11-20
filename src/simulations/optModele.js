// ====================================================
//  Modèle de la simulation 189 : optimiser une étape de synthèse (vitesse et rendement), TG spé PC.
//  Réaction support : estérification  acide éthanoïque + éthanol ⇌ éthanoate d'éthyle + eau,  K = 4 (valeur de la simulation, ordre de grandeur réel).
//  MODÈLE CONSTRUIT (annoncé comme tel dans la simulation) : mélange homogène de volume constant ; comme les coefficients stœchiométriques sont tous égaux à 1,
//  Qr = n(ester) n(eau) / (n(acide) n(éthanol)) ne dépend que des quantités de matière.
//  La vitesse d'évolution est proportionnelle à n(acide) n(éthanol) − n(ester) n(eau) / K : elle s'annule exactement quand Qr = K.
//  Le coefficient kd (unité arbitraire) croît avec la température (×2 par tranche de 10 °C : règle qualitative, pas une loi à connaître) et avec un catalyseur acide ;
//  il ne modifie jamais K (hypothèse : K constant dans la plage 20 à 75 °C).
//  Élimination de l'eau (Dean-Stark) : idéalisée, la quantité retirée par minute est proportionnelle à l'eau présente dans le milieu ; elle suppose le chauffage à reflux.
//  Quantités en mol ; on part de 1,00 mol d'acide (réactif limitant) et r mol d'éthanol. Rendement = avancement / 1,00 mol.
// ====================================================
export const K = 4;
export const T_REFLUX = 75;                 // °C : ébullition du mélange (ordre de grandeur), seule température où l'on peut retirer l'eau
export const TEMPS = [20, 45, 75];          // °C proposés
export const RAPPORTS = [1, 2, 3, 5];       // n(éthanol) / n(acide)
export const DUREE = 180;                   // min : durée d'un essai (3 h)
export const KD_REF = 0.0008;               // unité arbitraire : 75 °C, sans catalyseur
export const FACT_CAT = 50;                 // catalyseur acide : facteur qualitatif
export const K_RETRAIT = 0.06;              // min⁻¹ : vitesse d'élimination de l'eau
export const REF = { r: 1, T: 75, cat: true, eau: false };   // protocole de référence

export const kd = ({ T, cat }) => KD_REF * Math.pow(2, (T - T_REFLUX) / 10) * (cat ? FACT_CAT : 1);
export const retraitPossible = T => T >= T_REFLUX;
export const qr = (nA, nB, nE, nW) => (nA * nB > 0 ? (nE * nW) / (nA * nB) : Infinity);
// racines de 3x² − 4(1+r)x + 4r = 0 (équation obtenue avec K = 4) : x1 (acceptable, < min(1, r)) et x2
export const discriminant = r => 16 * (1 + r) ** 2 - 48 * r;
export const racines = r => { const d = Math.sqrt(discriminant(r)); return [(4 * (1 + r) - d) / 6, (4 * (1 + r) + d) / 6]; };
export const xEq = r => racines(r)[0];
// solution exacte sans élimination (logistique) : x(t)
export function xExact(p, t) {
  const [x1, x2] = racines(p.r), lam = kd(p) * 0.75 * (x2 - x1), q = (x1 / x2) * Math.exp(-lam * t);
  return (x1 - q * x2) / (1 - q);
}
function derivee(p, s) {
  const nA = 1 - s.x, nB = p.r - s.x, nE = s.x, nW = s.x - s.w;
  return { x: kd(p) * (nA * nB - (nE * nW) / K), w: p.eau ? K_RETRAIT * nW : 0 };
}
const pas = p => Math.min(1, 0.05 / (kd(p) * (1 + p.r) + (p.eau ? K_RETRAIT : 0)));
const rk4 = (p, s, dt) => {
  const f1 = derivee(p, s), s2 = { x: s.x + dt / 2 * f1.x, w: s.w + dt / 2 * f1.w }, f2 = derivee(p, s2),
    s3 = { x: s.x + dt / 2 * f2.x, w: s.w + dt / 2 * f2.w }, f3 = derivee(p, s3), s4 = { x: s.x + dt * f3.x, w: s.w + dt * f3.w }, f4 = derivee(p, s4);
  return { x: s.x + dt / 6 * (f1.x + 2 * f2.x + 2 * f3.x + f4.x), w: s.w + dt / 6 * (f1.w + 2 * f2.w + 2 * f3.w + f4.w) };
};
// courbes : tableau de points { t, x, nA, nB, nE, nW, qr } échantillonné n+1 fois sur [0, tMax]
export function simuler(p, tMax = DUREE, n = 180) {
  const sortie = [], dtMax = pas(p); let s = { x: 0, w: 0 }, t = 0;
  const pousse = () => sortie.push({ t, x: s.x, nA: 1 - s.x, nB: p.r - s.x, nE: s.x, nW: s.x - s.w, qr: qr(1 - s.x, p.r - s.x, s.x, s.x - s.w) });
  pousse();
  for (let i = 1; i <= n; i++) {
    const cible = tMax * i / n, m = Math.max(1, Math.ceil((cible - t) / dtMax)), dt = (cible - t) / m;
    for (let j = 0; j < m; j++) { s = rk4(p, s, dt); s.x = Math.min(s.x, Math.min(1, p.r) - 1e-12); }
    t = cible; pousse();
  }
  return sortie;
}
export const rendementFin = (p, tMax = DUREE) => { const c = simuler(p, tMax, 60); return c[c.length - 1].x; };
// valeur limite de l'avancement : l'équilibre sans élimination ; avec élimination continue, quasi total (idéalisation)
export const xLimite = p => (p.eau ? 1 : xEq(p.r));
// temps de demi-réaction (min) : date où x atteint la moitié de sa valeur limite ; défini ici sans élimination (formule exacte)
export function tDemi(p) {
  const [x1, x2] = racines(p.r), lam = kd(p) * 0.75 * (x2 - x1), c = x1 / 2;
  // (x1 − c)/(x2 − c) = (x1/x2) e^(−λ t)
  return Math.log((x1 / x2) * (x2 - c) / (x1 - c)) / lam;
}
// durée d'affichage : texte lisible
export function dureeTexte(min) {
  if (!isFinite(min)) return '—';
  if (min < 90) return `${Math.round(min)} min`;
  if (min < 48 * 60) return `${(min / 60).toFixed(min < 600 ? 1 : 0).replace('.', ',')} h`;
  return `${Math.round(min / 1440)} jours`;
}
export const sig = (x, k) => Number(Number(x).toPrecision(k));

// ---------- défis ----------
const tire = (t, rnd) => t[Math.floor(rnd() * t.length)];
// Défi 1 : atteindre un rendement visé (essai de 3 h, 75 °C, catalyseur) avec une réserve d'éthanol limitée (rmax) ; chaque tirage a au moins une solution et l'essai sans levier échoue
export const SCENARIOS_RENDEMENT = [[1, 80], [2, 75], [2, 90], [2, 95], [3, 88], [3, 97]];
export const rendementAffiche = p => Number((rendementFin(p) * 100).toFixed(1));
export const solutionRendement = (rmax, cible) => {
  for (const r of RAPPORTS.filter(x => x <= rmax)) for (const eau of [false, true]) if (rendementAffiche({ r, T: T_REFLUX, cat: true, eau }) >= cible) return { r, eau };
  return null;
};
export function tirageDefiRendement(rnd = Math.random) {
  const [rmax, cible] = tire(SCENARIOS_RENDEMENT, rnd);
  return { rmax, cible, graine: rnd() };
}
// Défi 2 : analyser un protocole (4 questions)
export const OPERATIONS = [['chauffer le mélange à reflux', 'v'], ['ajouter quelques gouttes d’acide sulfurique concentré', 'v'], ['travailler avec des réactifs peu dilués', 'v'], ['retirer l’eau formée avec un montage de Dean-Stark', 'r'],
  ['laver la phase organique avec une solution d’hydrogénocarbonate de sodium', 'n'], ['sécher la phase organique sur du sulfate de magnésium anhydre', 'n'], ['identifier l’ester par son spectre infrarouge', 'n']];
export const CIBLES_EXCES = [70, 80, 88, 92];
// plus petit rapport éthanol/acide dont le rendement à l'équilibre (affiché au dixième) atteint la cible
export const rapportMinimal = cible => RAPPORTS.find(r => Number((xEq(r) * 100).toFixed(1)) >= cible);
export function tirageDefiProtocole(rnd = Math.random) {
  const n0 = tire([0.6, 0.9, 1.2, 1.5], rnd), cible = tire(CIBLES_EXCES, rnd), f = tire([0.25, 0.5, 0.75], rnd);
  return { n0, cible, f, nE: 2 * n0 / 3, nA: n0 / 3, op: tire(OPERATIONS, rnd), graine: rnd() };
}
