// Modèle de la simulation 234 « Mouillage : tension superficielle, angle de contact, tension critique » (BTS MDC, Formulation).
// Capacités visées (jamais affichées à l'élève) : « Mettre en œuvre une méthode de mesure de la tension interfaciale » ; « Identifier les situations de mouillage total, partiel et non mouillage
// selon l'angle de raccordement » ; « Appliquer la loi de Young-Dupré pour déterminer un critère simple de mouillage » ; tension critique de Zisman ; traitements de surface.
// Fil rouge : une encre d'emballage sur un film plastique (PE, PET).
// Modèle QUALITATIF : pour chaque solide, cos θ varie linéairement avec la tension superficielle γL du liquide (droite de Zisman), avec cos θ = 1 en γL = γc ;
// la pente est ajustée pour retrouver l'angle de l'eau mesuré sur ce solide (valeurs publiées). Les angles des liquides autres que l'eau sont donc des valeurs indicatives.

export const G_EAU = 72.8;                 // mN/m, eau à 20 °C

// γc : tension critique de Zisman (mN/m) ; thEau : angle de contact de l'eau (°). Source : table Diversified Enterprises « Critical Surface Tension and Contact Angle with Water for Various Polymers ».
export const SOLIDES = [
  { id: 'ptfe', nom: 'PTFE (téflon)', court: 'PTFE', gc: 19.4, thEau: 109.2 },
  { id: 'pp', nom: 'polypropylène (PP)', court: 'PP', gc: 30.5, thEau: 102.1 },
  { id: 'pe', nom: 'polyéthylène (PE)', court: 'PE', gc: 31.6, thEau: 96 },
  { id: 'ps', nom: 'polystyrène (PS)', court: 'PS', gc: 34, thEau: 87.4 },
  { id: 'pet', nom: 'polyéthylène téréphtalate (PET)', court: 'PET', gc: 39, thEau: 72.5 },
  { id: 'pa66', nom: 'polyamide 6,6 (nylon)', court: 'PA 6,6', gc: 42.2, thEau: 68.3 },
];
export const solide = id => SOLIDES.find(s => s.id === id);

// Liquides (tension superficielle à 20–25 °C, mN/m). Sources : Wikipedia « Surface-tension values », AUS-e-TUTE, HyperPhysics.
export const LIQUIDES = [
  { id: 'etoh', nom: 'éthanol', g: 22.3 },
  { id: 'tol', nom: 'toluène', g: 28.5 },
  { id: 'deg', nom: 'diéthylène glycol', g: 30.1 },
  { id: 'pc', nom: 'carbonate de propylène', g: 41.1 },
  { id: 'dmso', nom: 'diméthylsulfoxyde (DMSO)', g: 43.5 },
  { id: 'eg', nom: 'éthylène glycol', g: 47.3 },
  { id: 'eau', nom: 'eau', g: G_EAU },
];
export const liquide = id => LIQUIDES.find(l => l.id === id);

export const TRAIT_MAX = 42;               // mN/m : énergie de surface visée après un traitement corona (38 à 44 mN/m selon la puissance)
export const MARGE_ENCRE = 7;              // mN/m : écart usuel recommandé entre l'énergie de surface du film et la tension superficielle de l'encre (7 à 10)
export const G_ENCRE = 38;                 // mN/m : encre à base d'eau additivée (valeur illustrative)

const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
export const cosDe = d => Math.cos(rad(d));

// Pente de la droite de Zisman du solide (en (mN/m)⁻¹) : elle passe par (γc ; 1) et par le point de l'eau (72,8 ; cos θ_eau).
export const pente = s => (1 - cosDe(s.thEau)) / (G_EAU - s.gc);
// Tension critique d'un solide traité : traitement de niveau n (0 à 1) ; un solide déjà au-dessus de TRAIT_MAX n'est pas modifié.
export const gcTraite = (s, n) => Math.max(s.gc, s.gc + Math.min(1, Math.max(0, n)) * (TRAIT_MAX - s.gc));
// cos θ « brut » (peut dépasser 1 quand γL < γc) et angle réel.
export const cosBrut = (s, gL, gc = s.gc) => 1 - pente(s) * (gL - gc);
export const cosTheta = (s, gL, gc = s.gc) => Math.max(-1, Math.min(1, cosBrut(s, gL, gc)));
export const theta = (s, gL, gc = s.gc) => deg(Math.acos(cosTheta(s, gL, gc)));
export const travailAdhesion = (s, gL, gc = s.gc) => gL * (1 + cosTheta(s, gL, gc));   // W = γLV (1 + cos θ), en mN/m = mJ/m²
export const coefEtalement = (s, gL, gc = s.gc) => gL * (cosBrut(s, gL, gc) - 1);       // S = γSV − γSL − γLV = γLV (cos θ − 1), > 0 : étalement total
export const regime = (th, tol = 0.5) => (th < tol ? 'total' : th < 90 ? 'partiel' : 'faible');

// Lame de Wilhelmy (platine, mouillage total, θ = 0) : F = γ · p avec p = 2 (l + e)
export const PLAQUE = { l: 20.0, e: 0.2 };                         // mm
export const perimetre = (pl = PLAQUE) => 2 * (pl.l + pl.e);       // mm
// γ (mN/m) × p (m) = F (mN)
export const forceMN = (g, pl = PLAQUE) => g * perimetre(pl) * 1e-3;       // mN

// Points de Zisman d'un solide : angles mesurés au degré près.
export const pointsZisman = (s, ids = LIQUIDES.map(l => l.id), gc = s.gc) => ids.map(id => {
  const l = liquide(id), th = Math.round(theta(s, l.g, gc));
  return { id, nom: l.nom, g: l.g, theta: th, cos: Math.round(cosDe(th) * 100) / 100 };
});
// Droite de régression de cos θ en fonction de γL sur les points non étalés (θ > 0) ; renvoie pente, ordonnée et γc extrapolée (cos θ = 1).
export function droiteZisman(pts) {
  const p = pts.filter(q => q.theta > 0);
  if (p.length < 2) return null;
  const n = p.length, mx = p.reduce((a, q) => a + q.g, 0) / n, my = p.reduce((a, q) => a + q.cos, 0) / n;
  const sxx = p.reduce((a, q) => a + (q.g - mx) ** 2, 0), sxy = p.reduce((a, q) => a + (q.g - mx) * (q.cos - my), 0);
  const a = sxy / sxx, b = my - a * mx;
  return { a, b, gc: (1 - b) / a };
}
// γc par deux points (l'extrapolation que fait l'élève à la main)
export const gcDeuxPoints = (p1, p2) => { const a = (p2.cos - p1.cos) / (p2.g - p1.g); return p1.g + (1 - p1.cos) / a; };

// ---------- défis ----------
const alea = (a, b) => a + Math.random() * (b - a);
const choisir = t => t[Math.floor(Math.random() * t.length)];
// Défi 1 : film inconnu ; liquides au-dessus de γc ; l'élève extrapole γc à partir des angles.
export function tirageZisman() {
  const s = choisir(SOLIDES.filter(x => x.id !== 'ptfe' && x.id !== 'pa66'));
  const ids = LIQUIDES.filter(l => l.g > s.gc + 3).map(l => l.id).slice(-4);
  const pts = pointsZisman(s, ids);
  const a = pts[0], b = pts[pts.length - 1];
  return { s, pts, vrai: gcDeuxPoints(a, b) };
}
export const CAS = ['encre', 'film', 'gras'];
export const CAUSES = {
  encre: 'La tension superficielle de l’encre est trop élevée',
  film: 'L’énergie de surface du film est trop faible : il n’est pas traité',
  gras: 'Le film est contaminé (lubrifiant) : sa surface est devenue moins énergétique',
};
export const REMEDES = {
  encre: 'Abaisser la tension superficielle de l’encre (tensioactif, solvant)',
  film: 'Traiter le film (corona ou plasma) pour augmenter son énergie de surface',
  gras: 'Dégraisser le film avant d’imprimer',
};
export function tirageDiagnostic() {
  const cas = choisir(CAS);
  let s, gcMes, gInk;
  if (cas === 'encre') { s = solide('pet'); gInk = Math.round(alea(52, 56)); gcMes = Math.round(alea(42, 44)); }   // film PET déjà traité (corona)
  else if (cas === 'film') { s = choisir([solide('pe'), solide('pp')]); gInk = Math.round(alea(33, 36)); gcMes = s.gc; }
  else { s = solide('pet'); gInk = Math.round(alea(32, 35)); gcMes = Math.round(alea(26, 29)); }
  const gcRef = s.gc;
  const th = Math.round(theta(s, gInk, gcMes));
  return { cas, s, gInk, gcMes, gcRef, th };
}
