// ═══════════════════════════════════════════════════════════════════════════
//  SIM 73 — DIFFRACTION DES RAYONS X : modèle du diffractogramme de poudre (structures cubiques)
//  Positions : loi de Bragg 2 d sin θ = λ (ordre 1, les ordres supérieurs sont portés par les indices hkl), d = a / √(h² + k² + l²).
//  Intensités (approchées, seulement qualitatives) : |F|² × multiplicité × facteur de Lorentz-polarisation × agitation thermique,
//  avec un facteur de diffusion atomique simplifié f = Z (0,25 + 0,75 e^(−4,5 s²)), s = sin θ / λ en Å⁻¹.
//  Les extinctions (pics absents) ne sont pas imposées : elles sortent du calcul du facteur de structure F.
// ═══════════════════════════════════════════════════════════════════════════

export const LAMBDA = 0.1542;          // nm : raie Kα du cuivre (doublet Kα1/Kα2 non résolu)
export const NA = 6.02214076e23;
export const DT_MIN = 20, DT_MAX = 140;   // domaine angulaire enregistré (2θ en degrés)

const pos = {
  P: [[0, 0, 0]],
  I: [[0, 0, 0], [0.5, 0.5, 0.5]],
  F: [[0, 0, 0], [0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0]],
};
export const STRUCTURES = {
  P: { nomF: 'cubique simple', nom: 'cubique simple', court: 'cubique simple (P)', n: 1, regle: 'tous les plans (hkl) existent' },
  I: { nomF: 'cubique centrée', nom: 'cubique centré', court: 'cubique centré (I)', n: 2, regle: 'seuls les plans avec h + k + l pair existent' },
  F: { nomF: 'cubique à faces centrées', nom: 'cubique à faces centrées', court: 'cubique à faces centrées (F)', n: 4, regle: 'seuls les plans avec h, k, l de même parité existent' },
};
// Motif : liste [Z, x, y, z] ; type = réseau de Bravais ; n motifs (unités formulaires) par maille = STRUCTURES[type].n
const metal = (type, Z) => pos[type].map(p => [Z, ...p]);
const selGemme = (Zc, Za) => [...pos.F.map(p => [Za, ...p]), ...pos.F.map(([x, y, z]) => [Zc, (x + 0.5) % 1, y, z])];

// a : paramètre de maille à 20 °C (nm) ; M : masse molaire (g/mol) de l'unité formulaire ; rho : masse volumique (g/cm³)
export const ECHANTILLONS = {
  W:   { nom: 'tungstène', formule: 'W', type: 'I', a: 0.31652, M: 183.84, rho: 19.25, atomes: metal('I', 74) },
  Mo:  { nom: 'molybdène', formule: 'Mo', type: 'I', a: 0.31470, M: 95.95, rho: 10.22, atomes: metal('I', 42) },
  Cr:  { nom: 'chrome', formule: 'Cr', type: 'I', a: 0.28846, M: 52.00, rho: 7.19, atomes: metal('I', 24) },
  Fe:  { nom: 'fer α', formule: 'Fe', type: 'I', a: 0.28665, M: 55.845, rho: 7.87, atomes: metal('I', 26) },
  Cu:  { nom: 'cuivre', formule: 'Cu', type: 'F', a: 0.36149, M: 63.546, rho: 8.96, atomes: metal('F', 29) },
  Al:  { nom: 'aluminium', formule: 'Al', type: 'F', a: 0.40495, M: 26.982, rho: 2.70, atomes: metal('F', 13) },
  Ni:  { nom: 'nickel', formule: 'Ni', type: 'F', a: 0.35240, M: 58.693, rho: 8.91, atomes: metal('F', 28) },
  Ag:  { nom: 'argent', formule: 'Ag', type: 'F', a: 0.40857, M: 107.87, rho: 10.49, atomes: metal('F', 47) },
  Po:  { nom: 'polonium α', formule: 'Po', type: 'P', a: 0.33590, M: 209, rho: 9.20, atomes: metal('P', 84) },
  NaCl: { nom: 'chlorure de sodium', formule: 'NaCl', type: 'F', a: 0.56402, M: 58.44, rho: 2.165, atomes: selGemme(10, 18), sel: true },
  KCl: { nom: 'chlorure de potassium', formule: 'KCl', type: 'F', a: 0.62929, M: 74.55, rho: 1.984, atomes: selGemme(18, 18), sel: true },
};
export const ORDRE_EXPLO = ['W', 'Cu', 'Fe', 'Al', 'NaCl', 'Po', 'KCl'];
export const CANDIDATS_DEFI = ['W', 'Mo', 'Cr', 'Fe', 'Cu', 'Al', 'Ni', 'Ag', 'NaCl'];

const fDiff = (Z, s) => Z * (0.25 + 0.75 * Math.exp(-4.5 * s * s));
const deg = r => r * 180 / Math.PI, rad = d => d * Math.PI / 180;

// petit décalage reproductible des positions (± 0,015°) : réglage de l'appareil, planéité de l'échantillon
const decal = (cle, N) => { let h = 2166136261; for (const ch of `${cle}:${N}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return ((h >>> 0) / 4294967296 - 0.5) * 0.03; };

// Liste des pics observables : [{ N, hkl, dt (2θ en °), I (max = 100) }]
export function pics(cle, ech = ECHANTILLONS[cle]) {
  const groupes = new Map();
  for (let h = 0; h <= 9; h++) for (let k = 0; k <= h; k++) for (let l = 0; l <= k; l++) {
    const N = h * h + k * k + l * l; if (!N) continue;
    const st = LAMBDA * Math.sqrt(N) / (2 * ech.a); if (st >= 1) continue;
    const dt = 2 * deg(Math.asin(st)); if (dt < DT_MIN - 2 || dt > DT_MAX) continue;
    const s = st / (LAMBDA * 10);   // sin θ / λ en Å⁻¹
    let re = 0, im = 0;
    ech.atomes.forEach(([Z, x, y, z]) => { const ph = 2 * Math.PI * (h * x + k * y + l * z); re += fDiff(Z, s) * Math.cos(ph); im += fDiff(Z, s) * Math.sin(ph); });
    const F2 = re * re + im * im;
    // multiplicité : permutations et signes de (h, k, l)
    const perm = new Set(); const sg = [1, -1];
    [[h, k, l], [h, l, k], [k, h, l], [k, l, h], [l, h, k], [l, k, h]].forEach(([a, b, c]) => sg.forEach(p => sg.forEach(q => sg.forEach(r => perm.add(`${a * p},${b * q},${c * r}`)))));
    if (F2 < 1e-6 * Math.max(1, ech.atomes.length) ** 2) continue;
    const g = groupes.get(N) || { N, hkl: [], dt, somme: 0, s };
    g.hkl.push(`${h}${k}${l}`); g.somme += F2 * perm.size; groupes.set(N, g);
  }
  const L = [...groupes.values()].map(g => {
    const th = rad(g.dt / 2), LP = (1 + Math.cos(2 * th) ** 2) / (Math.sin(th) ** 2 * Math.cos(th));
    return { N: g.N, hkl: g.hkl.join(' et '), dt: g.dt + decal(cle, g.N), Ibrut: g.somme * LP * Math.exp(-2 * 0.5 * g.s * g.s) };
  }).filter(p => p.dt >= DT_MIN).sort((a, b) => a.dt - b.dt);
  const max = Math.max(...L.map(p => p.Ibrut));
  return L.map(p => ({ N: p.N, hkl: p.hkl, dt: p.dt, I: 100 * p.Ibrut / max })).filter(p => p.I >= 0.4);
}

// Courbe enregistrée : pics de largeur croissante avec θ, fond continu, bruit reproductible
export function courbe(cle, liste) {
  let a = 0; for (const ch of cle) a = (a * 31 + ch.charCodeAt(0)) >>> 0;
  const r = () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pts = [];
  for (let x = DT_MIN; x <= DT_MAX + 1e-9; x += 0.05) {
    let y = 1.5 + 2.5 * Math.exp(-(x - DT_MIN) / 25);
    liste.forEach(p => { const w = 0.32 + 0.22 * Math.tan(rad(p.dt / 2)), u = (x - p.dt) / w; if (Math.abs(u) < 6) y += p.I * Math.exp(-2.7726 * u * u); });
    pts.push([x, y + (r() - 0.5) * 0.9]);
  }
  return pts;
}

// Valeurs de N = h² + k² + l² permises par un réseau (pour un cristal à un seul type d'atome)
export function Npermis(type, max = 60) {
  const S = new Set();
  for (let h = 0; h <= 8; h++) for (let k = 0; k <= h; k++) for (let l = 0; l <= k; l++) {
    const N = h * h + k * k + l * l; if (!N || N > max) continue;
    if (type === 'P' || (type === 'I' && (h + k + l) % 2 === 0) || (type === 'F' && h % 2 === k % 2 && k % 2 === l % 2)) S.add(N);
  }
  return [...S].sort((p, q) => p - q);
}
export const HKL_DE = (type, N) => {
  const L = [];
  for (let h = 0; h <= 8; h++) for (let k = 0; k <= h; k++) for (let l = 0; l <= k; l++) {
    if (h * h + k * k + l * l !== N) continue;
    if (type === 'P' || (type === 'I' && (h + k + l) % 2 === 0) || (type === 'F' && h % 2 === k % 2 && k % 2 === l % 2)) L.push(`${h}${k}${l}`);
  }
  return L.join(' et ');
};

// Indexation des pics relevés (en degrés 2θ) dans l'hypothèse d'un réseau donné, par la méthode des rapports sin²θ / sin²θ₁
export function indexer(releves, type) {
  if (!releves.length) return null;
  const permis = Npermis(type), N1 = permis[0];
  const s1 = Math.sin(rad(releves[0] / 2)) ** 2;
  const lignes = releves.map(dt => {
    const th = rad(dt / 2), s2 = Math.sin(th) ** 2, rap = s2 / s1, Nest = rap * N1;
    const N = permis.reduce((b, n) => (Math.abs(n - Nest) < Math.abs(b - Nest) ? n : b), permis[0]);
    return { dt, th: dt / 2, s2, rap, Nest, N, hkl: HKL_DE(type, N), a: LAMBDA * Math.sqrt(N) / (2 * Math.sin(th)) };
  });
  const as = lignes.map(l => l.a), moy = as.reduce((s, v) => s + v, 0) / as.length;
  const disp = (Math.max(...as) - Math.min(...as)) / moy;
  return { lignes, moy, disp, constant: lignes.length >= 2 && disp < 0.005, N1 };
}
export const masseVolumique = (n, M, a) => n * M / (NA * (a * 1e-7) ** 3);   // g/cm³, a en nm
export const sequence = (type, k = 8) => { const P = Npermis(type); return P.slice(0, k).map(n => n / P[0]); };
