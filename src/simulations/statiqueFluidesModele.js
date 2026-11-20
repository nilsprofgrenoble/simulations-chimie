// Modèle de la simulation 163 « Statique des fluides : pression et profondeur » (1G spé PC, partie « Mouvement et interactions »).
// Hypothèses du modèle (affichées à l'élève) : fluide au repos ; fluide INCOMPRESSIBLE (masse volumique ρ constante) ; g constant ;
// la pression de l'atmosphère à la surface libre est Patm = 1013 hPa ; le manomètre mesure la pression ABSOLUE (sauf mention « relative »).
// Relation fournie (axe z orienté VERS LE HAUT) : P_B − P_A = ρ·g·(z_A − z_B).
export const G = 9.81;            // N·kg⁻¹ (ou m·s⁻²)
export const PATM_HPA = 1013;     // pression atmosphérique usuelle, en hPa
export const PATM = PATM_HPA * 100;   // en Pa

// Liquides proposés. rho en kg·m⁻³ ; aff : écriture de ρ à l'écran (nombre de chiffres significatifs des données) ;
// hmax : profondeur maximale de la cuve (m) ; pas : pas du curseur de profondeur (m).
export const LIQUIDES = {
  eau:     { id: 'eau',     nom: 'Eau',                   rho: 1000,  aff: '1,00 × 10³', hmax: 10,  pas: 0.5,  couleur: ['#cfeafc', '#7cc0ee'] },
  mer:     { id: 'mer',     nom: 'Eau de mer',            rho: 1030,  aff: '1,03 × 10³', hmax: 10,  pas: 0.5,  couleur: ['#c9e6f2', '#6aaecb'] },
  huile:   { id: 'huile',   nom: 'Huile d’olive',         rho: 920,   aff: '9,2 × 10²',  hmax: 10,  pas: 0.5,  couleur: ['#fdf2b3', '#e8c33f'] },
  mercure: { id: 'mercure', nom: 'Mercure',               rho: 13600, aff: '1,36 × 10⁴', hmax: 1.0, pas: 0.05, couleur: ['#e2e8f0', '#94a3b8'] },
};
export const ORDRE_LIQUIDES = ['eau', 'mer', 'huile', 'mercure'];
export const liquideDe = id => LIQUIDES[id] || LIQUIDES.eau;

// z (m) d'un point situé à la profondeur h sous la surface libre, l'origine de l'axe vertical z étant à la surface
export const zDepuisProfondeur = h => -h;

// Relation fournie : P_B − P_A = ρ·g·(z_A − z_B), en Pa (z en m)
export const diffPression = (rho, zA, zB) => rho * G * (zA - zB);
// Pression absolue (Pa) à la profondeur h sous une surface où règne la pression Ps (Pa) : P = Ps + ρ·g·h
export const pression = (Ps, rho, h) => Ps + rho * G * Math.max(0, h);
// Profondeur (m) où règne la pression P (Pa), la surface étant à la pression Ps (Pa)
export const profondeur = (P, Ps, rho) => (P - Ps) / (rho * G);
// Le manomètre affiche des hPa entiers (résolution 1 hPa)
export const hPa = pa => Math.round(pa / 100);
// Pression relative (par rapport à l'atmosphère), en Pa
export const relative = pa => pa - PATM;
// Force pressante (N) d'une pression P (Pa) sur une surface S (m²) : F = P·S (la force est perpendiculaire à la paroi)
export const force = (P, S) => P * S;
// Masse volumique (kg·m⁻³) déduite de deux relevés (h en m, P en hPa) : ρ = ΔP / (g·Δh)
export const rhoDepuisReleves = (h1, P1, h2, P2) => (P2 - P1) * 100 / (G * (h2 - h1));

// Régression linéaire P = a·h + b (moindres carrés) ; renvoie null si moins de deux profondeurs différentes
export function ajuste(pts) {
  const n = pts.length; if (n < 2) return null;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n, my = pts.reduce((s, p) => s + p.y, 0) / n;
  const sxx = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0); if (sxx < 1e-12) return null;
  const a = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / sxx;
  return { pente: a, ord: my - a * mx };
}

// Pseudo-aléa à graine (mulberry32) : un défi est rejouable à partir de sa graine
export function aleaGraine(graine) {
  let t = (graine >>> 0) + 0x6D2B79F5;
  return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
}
// Graine d'un nouveau défi (tirée à l'ouverture du défi, jamais pendant l'affichage)
export const graineAleatoire = () => 1 + Math.floor(Math.random() * 1e6);
const tire = (rng, t) => t[Math.floor(rng() * t.length) % t.length];

// Données du défi « cuve cachée » : la sonde au fond lit P ; on cherche la hauteur de liquide (surface libre à Patm).
// La hauteur vraie est calculée à partir de la valeur AFFICHÉE (hPa entiers) et de ρ tel qu'écrit à l'écran.
export function tirerDefiCuve(graine) {
  const rng = aleaGraine(graine), l = LIQUIDES[tire(rng, ORDRE_LIQUIDES)];
  const hauteurs = l.id === 'mercure' ? [0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.60, 0.70, 0.80] : [2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];
  const H = tire(rng, hauteurs), P = hPa(pression(PATM, l.rho, H));
  return { type: 'cuve', graine, l, rho: l.rho, P, Ps: PATM_HPA, vrai: profondeur(P * 100, PATM, l.rho), unite: 'm' };
}
// Défi « liquide inconnu » : deux relevés de pression (hPa) à deux profondeurs ; on cherche ρ.
export function tirerDefiRho(graine) {
  const rng = aleaGraine(graine + 7919), l = LIQUIDES[tire(rng, ORDRE_LIQUIDES)];
  const h1 = tire(rng, l.id === 'mercure' ? [0.10, 0.15, 0.20] : [0.5, 1.0, 1.5, 2.0]);
  const dhs = (l.id === 'mercure' ? [0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50] : [2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0]);
  const dh = tire(rng, dhs), h2 = Math.round((h1 + dh) * 100) / 100;
  const P1 = hPa(pression(PATM, l.rho, h1)), P2 = hPa(pression(PATM, l.rho, h2));
  return { type: 'rho', graine, l, h1, h2, P1, P2, vrai: rhoDepuisReleves(h1, P1, h2, P2), unite: 'kg·m⁻³' };
}
