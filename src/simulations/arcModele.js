// ====================================================
//  Modèle « Poussée d'Archimède » (sim 213, TG spé PC, « Mouvement et interactions », « Modéliser l'écoulement d'un fluide »).
//  Fluide au repos, incompressible, dans un champ de pesanteur uniforme : g = 9,8 N/kg (= m/s²), valeur usuelle tenue partout.
//  Loi de la statique des fluides (fournie en 1G) : P_bas − P_haut = ρ g (z_haut − z_bas) = ρ g Δh.
//  Poussée d'Archimède : résultante des forces pressantes sur la partie IMMERGÉE d'un solide :
//     vec(Π) = − ρ_fluide · V_immergé · vec(g)      norme  Π = ρ_fluide · V_immergé · g      (vertical, vers le haut)
//  Poids : P = m g = ρ_objet · V · g.  Poids apparent (dynamomètre, solide immergé tenu par un fil) : F = P − Π.
//  Ni tension superficielle, ni viscosité, ni courants : repos. Unités : ρ en kg/m³, V en cm³ (affichage) puis en m³ (1 cm³ = 1e-6 m³), forces en N.
// ====================================================
export const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');   // virgule décimale
export const G = 9.8;                                                         // N/kg
export const RHO_AIR = 1.2;                                                   // kg/m³ : air à 20 °C, pression atmosphérique (ordre de grandeur usuel)
export const FLUIDES = [
  { id: 'huile', nom: 'Huile végétale', rho: 900, lab: ['huile', 'végétale'] },
  { id: 'eau', nom: 'Eau douce', rho: 1000, lab: ['eau douce'] },
  { id: 'mer', nom: 'Eau de mer', rho: 1030, lab: ['eau de mer'] },
  { id: 'sale', nom: 'Eau très salée', rho: 1200, lab: ['eau très', 'salée'] },
];                                                                            // ordres de grandeur usuels (valeurs tabulées, non mesurées)
export const OBJETS = [
  { id: 'liege', nom: 'Liège', rho: 240, lab: ['cube de', 'liège'], coul: '#d6a96a' },
  { id: 'pin', nom: 'Bois (pin)', rho: 500, lab: ['cube de', 'bois (pin)'], coul: '#e0b983' },
  { id: 'glace', nom: 'Glace', rho: 920, lab: ['cube de', 'glace'], coul: '#e0f2fe' },
  { id: 'alu', nom: 'Aluminium', rho: 2700, lab: ['cube', 'd’aluminium'], coul: '#cbd5e1' },
  { id: 'acier', nom: 'Acier', rho: 7800, lab: ['cube', 'd’acier'], coul: '#94a3b8' },
];                                                                            // masses volumiques usuelles arrondies (ordres de grandeur)
export const VOLUMES = [100, 200, 500, 1000];                                 // cm³
export const objet = id => OBJETS.find(o => o.id === id);
export const fluide = id => FLUIDES.find(f => f.id === id);

// ---------- cuve (scène à l'échelle) : section carrée de 18 cm de côté, hauteur 20 cm, 3 700 cm³ de liquide ----------
export const S_CUVE = 324, H_CUVE = 20, V_LIQ = 3700;                         // cm², cm, cm³
export const niveau = Vim => (V_LIQ + Vim) / S_CUVE;                          // hauteur de liquide (cm) : elle monte quand on immerge
export const arete = V => Math.cbrt(V);                                       // cm

export const m3 = V => V * 1e-6;                                              // cm³ -> m³
/** Poids (N) d'un objet de masse volumique rho (kg/m³) et de volume V (cm³). */
export const poids = (rho, V) => rho * m3(V) * G;
/** Norme de la poussée d'Archimède (N) : fluide de masse volumique rhoF, volume immergé Vim (cm³). */
export const poussee = (rhoF, Vim) => rhoF * m3(Vim) * G;
/** Poids apparent (N) lu au dynamomètre : P − Π ; jamais négatif (un fil ne pousse pas). */
export const poidsApparent = (rhoO, rhoF, V, f = 1) => Math.max(0, poids(rhoO, V) - poussee(rhoF, f * V));
/** Fraction du volume immergée à l'équilibre : 1 si l'objet est plus dense (il coule), ρ_objet / ρ_fluide sinon. */
export const fractionEquilibre = (rhoO, rhoF) => (rhoO >= rhoF ? 1 : rhoO / rhoF);
export const etat = (rhoO, rhoF) => (Math.abs(rhoO - rhoF) < 0.5 ? 'equilibre' : rhoO < rhoF ? 'flotte' : 'coule');
/** Masse maximale (kg) posée sur un flotteur pour qu'il soit à la limite d'être totalement immergé : (ρ_fluide − ρ_objet) V. */
export const masseMaxPosee = (rhoO, rhoF, V) => (rhoF - rhoO) * m3(V);
/** Masse volumique d'un liquide (kg/m³) d'après P (air) et F (liquide), objet totalement immergé de volume V (cm³). */
export const rhoDepuisDynamometre = (P, F, V) => (P - F) / (m3(V) * G);
/** Lecture du dynamomètre arrondie à sa graduation (0,1 N). */
export const lecture = x => Math.round(x * 10) / 10;
/** Calibre du dynamomètre (N) : plus petit calibre usuel strictement supérieur à la force maximale. */
export const calibre = Fmax => [5, 10, 20, 30, 50, 100].find(c => c > Fmax * 1.02) || 100;

// ---------- défis ----------
const tire = (t, rnd) => t[Math.floor(rnd() * t.length)];
/** Défi « prévoir » : objet plus dense que le fluide, totalement immergé. Données affichées : ρ_objet, ρ_fluide (kg/m³), V (cm³). Réponses : Π et poids apparent. */
export function tirageCoule(rnd = Math.random) {
  const o = tire(OBJETS.filter(x => x.rho > 2000), rnd), fl = tire(FLUIDES, rnd), V = tire([200, 500, 1000], rnd);
  return { type: 'prevoir', o, fl, rhoO: o.rho, rhoF: fl.rho, V, vPi: poussee(fl.rho, V), vF: poidsApparent(o.rho, fl.rho, V) };
}
/** Défi « flotteur » : objet moins dense (rapport ≤ 0,95). Réponses : fraction immergée (%) et masse maximale posée (g). */
export function tirageFlotteur(rnd = Math.random) {
  for (;;) {
    const o = tire(OBJETS.filter(x => x.rho < 1000), rnd), fl = tire(FLUIDES, rnd), V = tire([200, 500, 1000], rnd);
    if (o.rho / fl.rho > 0.95) continue;
    const a2 = x => Number(Number(x).toPrecision(2)), mm = (fl.rho - o.rho) * V * 1e-3;
    if (Math.abs(a2(fl.rho * V * 1e-3) - a2(o.rho * V * 1e-3) - mm) / mm > 0.055) continue;       // écarte les cas où arrondir les deux masses à 2 chiffres avant de soustraire sortirait de la marge de 6 %
    return { type: 'flotteur', o, fl, rhoO: o.rho, rhoF: fl.rho, V, vFrac: 100 * o.rho / fl.rho, vMasse: masseMaxPosee(o.rho, fl.rho, V) * 1000 };
  }
}
/** Défi « liquide inconnu » : cube d'aluminium ou d'acier de 500 ou 1 000 cm³ ; P et F lus à 0,1 N près (affichés) ; ρ du liquide déduite des valeurs LUES. */
export function tirageInconnu(rnd = Math.random) {
  const o = tire(OBJETS.filter(x => x.rho > 2000), rnd), V = tire([500, 1000], rnd), rho = tire([800, 850, 900, 1100, 1200, 1300], rnd);
  const P = lecture(poids(o.rho, V)), F = lecture(poidsApparent(o.rho, rho, V));
  return { type: 'inconnu', o, V, rhoVrai: rho, P, F, vRho: rhoDepuisDynamometre(P, F, V) };
}
