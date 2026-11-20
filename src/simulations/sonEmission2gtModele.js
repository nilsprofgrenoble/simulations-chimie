// ====================================================
//  Modèle de la simulation « Le son : émission et propagation » (2GT).
//  Modèle pur (sans React), testé par sonEmission2gtModele.test.mjs.
//  Relations : v = d / Δt (mesure de la vitesse), d = v × Δt (distance), Δt = d / v (retard), conversion m/s ↔ km/h (× 3,6).
//  Hypothèses : vitesse du son dans l'air ≈ 340 m/s à 20 °C (elle dépend de la température : exploration seulement), propagation en ligne droite,
//  sans vent, milieu homogène ; instants lus avec l'incertitude du chronomètre ; lumière supposée instantanée devant le son (éclair, tonnerre) ;
//  vitesses dans l'eau (≈ 1 500 m/s) et l'acier (≈ 5 000 m/s) : ordres de grandeur arrondis, à ne pas retenir.
//  Enchaînement avec 1G (sim 150, célérité et retard) : mêmes mots « retard » et « Δt », mais ici on parle de « vitesse du son ».
// ====================================================

const NB = ' ';
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const sup = n => String(n).split('').map(c => SUP[c] ?? c).join('');

export const V_AIR = 340;          // m/s, à 20 °C
export const V_EAU = 1500;         // m/s, ordre de grandeur
export const V_ACIER = 5000;       // m/s, ordre de grandeur
export const V_LUMIERE = 3.0e8;    // m/s
export const FACTEUR_KMH = 3.6;    // 1 m/s = 3,6 km/h

// Milieux de propagation (v = null : pas de propagation, le vide)
export const MILIEUX = [
  { id: 'air', nom: 'l’air', Nom: 'Air', v: V_AIR, fond: '#e0f2fe', trait: '#0369a1' },
  { id: 'eau', nom: 'l’eau', Nom: 'Eau', v: V_EAU, fond: '#bfdbfe', trait: '#1d4ed8' },
  { id: 'acier', nom: 'l’acier', Nom: 'Acier', v: V_ACIER, fond: '#e2e8f0', trait: '#475569' },
  { id: 'vide', nom: 'le vide', Nom: 'Vide', v: null, fond: '#f8fafc', trait: '#64748b' },
];
export const milieu = id => MILIEUX.find(m => m.id === id);

// Vitesse du son dans l'air selon la température (exploration, hors programme) : 340 m/s à 20 °C, environ +0,6 m/s par degré
export const vAirTemperature = T => V_AIR + 0.6 * (T - 20);

// ----- relations -----
export const vitesse = (d, dt) => d / dt;           // v = d / Δt   (m, s → m/s)
export const retard = (d, v) => d / v;              // Δt = d / v
export const distance = (v, dt) => v * dt;          // d = v × Δt
export const kmhDepuisMs = v => v * FACTEUR_KMH;
export const msDepuisKmh = v => v / FACTEUR_KMH;

// Vitesses courantes, en m/s (valeurs arrondies)
export const VITESSES = [
  { id: 'pieton', nom: 'Piéton', ms: 1.4, kmh: 5 },
  { id: 'velo', nom: 'Vélo', ms: 5, kmh: 18 },
  { id: 'voiture', nom: 'Voiture', ms: 25, kmh: 90 },
  { id: 'tgv', nom: 'TGV', ms: 83, kmh: 300 },
  { id: 'avion', nom: 'Avion de ligne', ms: 250, kmh: 900 },
  { id: 'son', nom: 'Son dans l’air', ms: 340, kmh: 1200 },
  { id: 'lumiere', nom: 'Lumière', ms: 3.0e8, kmh: 1.1e9 },
];

// ----- écriture des nombres (virgule française, espaces insécables) -----
export const arrondiSig = (x, cs = 2) => Number(Number(x).toPrecision(cs));
export const nbf = (x, d) => Number(x).toFixed(d).replace('.', ',');
export function nb(x, cs = 2) {
  if (!isFinite(x)) return '—';
  if (x === 0) return '0';
  const r = Number(x.toPrecision(cs)), e = Math.floor(Math.log10(Math.abs(r)));
  if (e < -3 || e > 5) return `${(r / Math.pow(10, e)).toFixed(cs - 1).replace('.', ',')}${NB}×${NB}10${sup(e)}`;
  const d = Math.max(0, cs - 1 - e);
  const t = r.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: false });
  return e >= 3 ? t.replace(/\B(?=(\d{3})+(?!\d))/g, NB) : t;   // « 1 500 » avec espace insécable
}
// Entier avec espaces insécables entre les milliers (« 1 200 »)
export const entier = x => Math.round(x).toLocaleString('fr-FR').replace(/[\u202f\u00a0\u0020]/g, NB);
// Durée lisible : ms si moins d'un centième de seconde, sinon s (cs chiffres significatifs)
export function duree(s, cs = 2) {
  if (!isFinite(s)) return '—';
  if (s < 0.01) return `${nb(s * 1000, cs)}${NB}ms`;
  return `${nb(s, cs)}${NB}s`;
}
export function longueur(m, cs = 2) {
  if (m >= 1000) return `${nb(m / 1000, cs)}${NB}km`;
  return `${nb(m, cs)}${NB}m`;
}

// ----- défis (tirages bornés) -----
const tire = t => t[Math.floor(Math.random() * t.length)];
const alea = (a, b) => a + Math.random() * (b - a);

// Défi « mesurer la vitesse du son » : milieu, distance d et retard Δt affiché (2 chiffres significatifs) ; la valeur attendue est d / Δt AFFICHÉ.
const DEFI_MESURE = {
  air: { d: [34, 51, 68, 85, 102, 170], vmin: 312, vmax: 368 },
  eau: { d: [150, 300, 450, 600], vmin: 1380, vmax: 1620 },
  acier: { d: [500, 1000, 1500, 2500], vmin: 4650, vmax: 5350 },
};
export function tirerDefiMesure(prec) {
  for (let essai = 0; essai < 200; essai++) {
    const mid = tire(['air', 'air', 'eau', 'acier']), P = DEFI_MESURE[mid], d = tire(P.d), vCache = alea(P.vmin, P.vmax);
    const dt = arrondiSig(d / vCache, 2);
    if (dt <= 0) continue;
    if (prec && prec.mid === mid && prec.d === d) continue;
    const vrai = d / dt, nominal = milieu(mid).v;
    // tolérance : jamais plus stricte que l'arrondi à 2 chiffres significatifs de la réponse de l'élève, au moins 2,5 %
    const tol = Math.max(0.025, 1.05 * 0.5 * Math.pow(10, Math.floor(Math.log10(vrai)) - 1) / vrai);
    if (Math.abs(vrai - nominal) / vrai <= tol * 1.15) continue;     // la valeur connue (340, 1 500, 5 000) ne doit pas être acceptée sans calcul
    return { mid, d, dt, vrai, tol, nominal };
  }
  return { mid: 'air', d: 68, dt: 0.22, vrai: 68 / 0.22, tol: 0.025, nominal: 340 };
}
// Défi « prévoir un retard ou une distance » : orage (distance en km d'après Δt) ou feu d'artifice (retard en s d'après d)
export function tirerDefiPrevoir(prec) {
  for (let essai = 0; essai < 200; essai++) {
    if (Math.random() < 0.5) {
      const dt = tire([2.0, 3.0, 4.0, 5.0, 6.0, 8.0, 9.0, 12]);
      if (prec && prec.cas === 'orage' && prec.dt === dt) continue;
      return { cas: 'orage', dt, vrai: distance(V_AIR, dt) / 1000, unite: 'km' };
    }
    const dkm = tire([0.50, 0.85, 1.2, 1.7, 2.5, 3.4]);
    if (prec && prec.cas === 'feu' && prec.dkm === dkm) continue;
    return { cas: 'feu', dkm, vrai: retard(dkm * 1000, V_AIR), unite: 's' };
  }
  return { cas: 'orage', dt: 6.0, vrai: 2.04, unite: 'km' };
}
