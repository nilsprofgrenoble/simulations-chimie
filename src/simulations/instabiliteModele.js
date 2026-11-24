// Modèle de la simulation 222 « Instabilités des émulsions : crémage, floculation, coalescence, mûrissement d'Ostwald ».
// Tout est qualitatif ou en ordres de grandeur annoncés dans le panneau d'hypothèses ; seule la loi de Stokes est quantitative.
// Les champs de gouttes sont déterministes (graine fixe) : mêmes gouttes, mêmes positions, seul le temps change.

export const PHENOMENES = ['cremage', 'floculation', 'coalescence', 'ostwald'];
export const NOMS = { cremage: 'Crémage', floculation: 'Floculation', coalescence: 'Coalescence', ostwald: 'Mûrissement d’Ostwald' };
export const REVERSIBLE = { cremage: true, floculation: true, coalescence: false, ostwald: false };
export const G = 9.81;
export const RHO_EAU = 1000;

// ---------- 1. Loi de Stokes : crémage (Δρ > 0) ou sédimentation (Δρ < 0) ----------
// v = 2 Δρ g r² / (9 η) ; r en µm, Δρ = ρ_continue − ρ_dispersée en kg/m³, η en mPa·s ; résultat en m/s (positif : les gouttes montent).
export const vitesseStokes = (rUm, drho, etaMPas) => 2 * drho * G * (rUm * 1e-6) ** 2 / (9 * etaMPas * 1e-3);
export const vitesseUmS = (rUm, drho, etaMPas) => vitesseStokes(rUm, drho, etaMPas) * 1e6;
export const mouvement = drho => (drho > 0 ? 'crémage' : drho < 0 ? 'sédimentation' : 'aucun mouvement');
// durée (s) pour parcourir h cm
export const dureeStokes = (hCm, rUm, drho, etaMPas) => (hCm * 1e-2) / Math.abs(vitesseStokes(rUm, drho, etaMPas));
// Δρ pour une émulsion : H/E (huile dispersée, moins dense que l'eau) → crémage ; E/H → sédimentation
export const deltaRho = (type, rhoHuile) => (type === 'H/E' ? RHO_EAU - rhoHuile : rhoHuile - RHO_EAU);

// ---------- 2. Champ de gouttes déterministe ----------
export const CHAMP = { W: 60, H: 45 };   // µm
export function alea(graine) { let a = graine >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const gauss = r => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(6.283185307 * r());
// n gouttes de rayon log-normal (médiane 2,4 µm), positions aléatoires non chevauchantes
export function population(n = 40, graine = 11) {
  const r = alea(graine), L = [];
  for (let k = 0; k < n; k++) {
    const rayon = Math.min(4.2, Math.max(1.2, 2.4 * Math.exp(0.26 * gauss(r))));
    let essais = 0, x, y, bon;
    do {
      x = 4 + r() * (CHAMP.W - 8); y = 4 + r() * (CHAMP.H - 8); essais++;
      bon = L.every(d => Math.hypot(d.x - x, d.y - y) > (d.r + rayon) * (essais < 3000 ? 1.35 : 1.05));
    } while (!bon && essais < 6000);
    L.push({ x, y, r: rayon });
  }
  return L;
}
export const rayonMoyen = L => L.reduce((a, d) => a + d.r, 0) / (L.length || 1);
export const volumeTotal = L => L.reduce((a, d) => a + d.r ** 3, 0);

// ---------- 3. Mûrissement d'Ostwald (hors référentiel) ----------
// Pression de Laplace 2γ/r : les petites gouttes sont « plus pressées » et leur contenu diffuse à travers la phase continue vers les grosses.
// Avec v = r³ : dv/dt = 3a (r / r_c − 1), où r_c est le rayon moyen des gouttes restantes ; la somme des volumes est conservée.
export const A_OSTWALD = 0.25;   // µm³ par jour et par unité d'indice de solubilité
export const aEffectif = (S, fIns) => A_OSTWALD * S * (1 - 0.9 * Math.min(Math.max(fIns, 0), 0.3) / 0.3);
const cacheO = {};
// Trajectoire échantillonnée tous les 0,5 jour jusqu'à tmax : tableaux de volumes (0 = goutte disparue)
export function trajOstwald(pop, a, tmax = 60) {
  const cle = `${pop.length}-${pop[0].r.toFixed(4)}-${a.toFixed(5)}-${tmax}`;
  if (cacheO[cle]) return cacheO[cle];
  let v = pop.map(d => d.r ** 3);
  const sorties = [v.slice()], dt = 0.05, par = 10;
  for (let k = 1; k <= tmax / dt; k++) {
    const vivants = v.filter(x => x > 0.02), rc = vivants.reduce((s, x) => s + Math.cbrt(x), 0) / (vivants.length || 1);
    v = v.map(x => (x <= 0.02 ? 0 : Math.max(0, x + 3 * a * (Math.cbrt(x) / rc - 1) * dt)));
    // conservation exacte du volume (corrige l'erreur numérique et la disparition des gouttes minuscules)
    const s0 = volumeTotal(pop), s1 = v.reduce((s, x) => s + x, 0);
    if (s1 > 0) v = v.map(x => x * s0 / s1);
    if (k % par === 0) sorties.push(v.slice());
  }
  return (cacheO[cle] = sorties);
}
export function etatOstwald(pop, traj, t) {
  const k = Math.min(traj.length - 1, Math.max(0, Math.round(t / 0.5))), v = traj[k];
  const items = pop.map((d, i) => ({ x: d.x, y: d.y, r: Math.cbrt(v[i]), i })).filter(d => d.r > 0.05);
  return { items, N: items.length, rc: rayonMoyen(items) };
}

// ---------- 4. Floculation et coalescence : événements de contact ----------
// Chaque paire de gouttes voisines se rencontre à un instant aléatoire t_e = −ln(1−u)/k (k en 1/jour). Floculation : les gouttes s'accolent (leur taille ne change
// pas). Coalescence : elles fusionnent (volume conservé). k_floc ∝ (1 − répulsion)², k_coal ∝ (1 − couverture)².
export const K_FLOC = 0.12, K_COAL = 0.12;
export const kFloc = rep => K_FLOC * (1 - Math.min(Math.max(rep, 0), 1)) ** 2;
export const kCoal = cov => K_COAL * (1 - Math.min(Math.max(cov, 0), 1)) ** 2;
export function aretes(pop) {
  const A = [];
  for (let i = 0; i < pop.length; i++) for (let j = i + 1; j < pop.length; j++)
    if (Math.hypot(pop[i].x - pop[j].x, pop[i].y - pop[j].y) < 1.75 * (pop[i].r + pop[j].r)) A.push([i, j]);
  return A;
}
export function evenements(pop, k, mode, graine = 5, tmax = 60) {
  const rng = alea(graine * 7 + 3), feuilles = pop.map((d, i) => ({ feuille: true, i, x: d.x, y: d.y, v: d.r ** 3, r: d.r, tc: -Infinity, feuillesIdx: [i], parent: null, enfants: null }));
  const noeuds = feuilles.slice(), comp = feuilles.slice();
  const ev = aretes(pop).map(([i, j]) => ({ i, j, te: k > 0 ? -Math.log(1 - rng() * 0.999) / k : Infinity })).sort((a, b) => a.te - b.te);
  for (const e of ev) {
    if (e.te > tmax) break;
    const a = comp[e.i], b = comp[e.j];
    if (a === b) continue;
    const v = a.v + b.v, w = mode === 'coalescence' ? [a.v / v, b.v / v] : [a.feuillesIdx.length / (a.feuillesIdx.length + b.feuillesIdx.length), b.feuillesIdx.length / (a.feuillesIdx.length + b.feuillesIdx.length)];
    const p = { feuille: false, enfants: [a, b], tc: e.te, v, x: a.x * w[0] + b.x * w[1], y: a.y * w[0] + b.y * w[1], r: Math.cbrt(v), feuillesIdx: [...a.feuillesIdx, ...b.feuillesIdx], parent: null };
    a.parent = b.parent = p; p.finals = null;
    noeuds.push(p); for (const l of p.feuillesIdx) comp[l] = p;
  }
  return { pop, mode, noeuds, feuilles, k };
}
const lerp = (a, b, s) => a + (b - a) * s;
const ease = s => (s <= 0 ? 0 : s >= 1 ? 1 : s * s * (3 - 2 * s));
export const TAU = 2.0;   // durée d'une fusion ou d'un accolement (jours)
// Coalescence : disques visibles à l'instant t (les fusions en cours rapprochent les deux disques enfants)
export function etatCoalescence(E, t) {
  const items = [];
  for (const n of E.noeuds) {
    if (n.tc > t || (n.parent && n.parent.tc <= t)) continue;
    if (n.feuille || t >= n.tc + TAU) { items.push({ x: n.x, y: n.y, r: n.r, n: n.feuillesIdx.length }); continue; }
    const s = ease((t - n.tc) / TAU);
    for (const c of n.enfants) items.push({ x: lerp(c.x, n.x, s), y: lerp(c.y, n.y, s), r: lerp(c.r, n.r, s), n: c.feuillesIdx.length, fusion: true });
  }
  const N = E.feuilles.length - E.noeuds.filter(n => !n.feuille && n.tc <= t).length;
  return { items, N, rc: rayonMoyen(items) };
}
// Floculation : positions des gouttes ; les amas se resserrent jusqu'au contact (sans fusion)
function positionsFinales(E, n) {
  if (n.finals) return n.finals;
  const idx = n.feuillesIdx, P = idx.map(i => E.pop[i]), cx = P.reduce((s, d) => s + d.x, 0) / P.length, cy = P.reduce((s, d) => s + d.y, 0) / P.length;
  // lam = plus grand rapport (r_a + r_b) / distance : au contact des deux gouttes les plus proches
  let lamMax = 0;
  for (let a = 0; a < P.length; a++) for (let b = a + 1; b < P.length; b++) { const d = Math.hypot(P[a].x - P[b].x, P[a].y - P[b].y); lamMax = Math.max(lamMax, (P[a].r + P[b].r) * 1.02 / d); }
  const lam = Math.min(1, lamMax);
  n.finals = idx.map((i, k) => ({ i, x: cx + lam * (P[k].x - cx), y: cy + lam * (P[k].y - cy) }));
  return n.finals;
}
export function etatFloculation(E, t) {
  const pos = E.pop.map((d, i) => ({ x: d.x, y: d.y, r: d.r, i, amas: 1 }));
  const top = E.noeuds.filter(n => !n.feuille && n.tc <= t && !(n.parent && n.parent.tc <= t));
  for (const n of top) {
    const fin = positionsFinales(E, n), s = ease((t - n.tc) / TAU);
    const avant = new Map();
    for (const c of n.enfants) if (c.feuille) avant.set(c.i, { x: c.x, y: c.y }); else for (const f of positionsFinales(E, c)) avant.set(f.i, f);
    for (const f of fin) { const a = avant.get(f.i); pos[f.i].x = lerp(a.x, f.x, s); pos[f.i].y = lerp(a.y, f.y, s); pos[f.i].amas = n.feuillesIdx.length; }
  }
  const nbAmas = E.pop.length - E.noeuds.filter(n => !n.feuille && n.tc <= t).length;
  const enAmas = pos.filter(p => p.amas > 1).length / pos.length;
  return { items: pos, N: nbAmas, enAmas, rc: rayonMoyen(pos) };
}

// ---------- 5. Histogramme des diamètres ----------
export const BORNES = [0, 2, 4, 6, 8, 10, 12, 14, 16];
export function histogramme(items) {
  const h = Array(BORNES.length - 1).fill(0);
  for (const d of items) { const D = 2 * d.r; const k = Math.min(h.length - 1, Math.floor(D / 2)); h[k]++; }
  return h;
}

// ---------- 6. Crémage : montée des gouttes dans un tube de h cm ----------
// Chaque goutte du champ monte (ou descend) à sa vitesse de Stokes ; les gouttes arrivées s'empilent en haut (ou en bas).
export function cremage(pop, hCm, drho, etaMPas) {
  const n = pop.length, r = alea(99);
  const gouttes = pop.map((d, i) => { const x = r(), y0 = r(); const v = vitesseStokes(d.r, drho, etaMPas) * 86400 * 100; return { x, y0, v, i, r: d.r }; });   // v en cm/jour
  const monte = drho >= 0;
  // arrivée : temps pour atteindre la couche (haut si monte, bas sinon)
  gouttes.forEach(g => { const dist = (monte ? 1 - g.y0 : g.y0) * hCm; g.ta = Math.abs(g.v) > 0 ? dist / Math.abs(g.v) : Infinity; });
  const ordre = gouttes.slice().sort((a, b) => a.ta - b.ta), nCol = 12, haut = Array(nCol).fill(0);
  ordre.forEach(g => { const c = Math.min(nCol - 1, Math.floor(g.x * nCol)); g.col = c; g.rang = haut[c]++; });
  return { gouttes, hCm, monte, nCol, vMoy: gouttes.reduce((s, g) => s + Math.abs(g.v), 0) / n };
}
// position normalisée (0 = bas, 1 = haut) d'une goutte à t jours ; pile = rang dans la couche d'arrivée
export function positionCremage(C, g, t, pasPile) {
  const y = g.y0 + g.v * t / C.hCm;   // v signé : positif vers le haut
  const arrivee = C.monte ? y >= 1 - g.rang * pasPile : y <= g.rang * pasPile;
  if (arrivee) return { y: C.monte ? 1 - g.rang * pasPile : g.rang * pasPile, arrive: true };
  return { y, arrive: false };
}
export const fractionArrivee = (C, t) => C.gouttes.filter(g => g.ta <= t).length / C.gouttes.length;

// ---------- 7. Aspect macroscopique ----------
// couche : épaisseur relative (0 à 0,3) de la couche d'huile libre (coalescence) ou de crème (Ostwald avancé) ; grain : 0 à 1
export function aspectMacro(phen, st, N0, r0) {
  if (phen === 'floculation') return { couche: 0, grain: st.enAmas ?? 0 };
  if (phen === 'coalescence') { const f = N0 > 1 ? (N0 - st.N) / (N0 - 1) : 0; return { couche: 0.3 * f * f, grain: 0 }; }
  if (phen === 'ostwald') return { couche: 0.12 * Math.min(1, Math.max(0, (st.rc / r0 - 1) / 1.5)), grain: 0 };
  return { couche: 0, grain: 0 };
}

// ---------- 8. Défis ----------
const choix = (L, r) => L[Math.floor(r() * L.length) % L.length];
// Défi « Stokes » : durée (h) pour que la crème monte de h cm
export function tirageStokes(r = Math.random, forcer = {}) {
  const rUm = forcer.rUm ?? choix([2, 3, 5, 10], r), eta = forcer.eta ?? choix([1, 2, 5, 10], r), drho = forcer.drho ?? choix([50, 80, 100, 120], r), h = forcer.h ?? choix([5, 10, 20], r);
  return { rUm, eta, drho, h, heures: dureeStokes(h, rUm, drho, eta) / 3600 };
}
// Défi « diagnostic » : observations tirées pour un phénomène ; le remède attendu dépend du phénomène
export const REMEDES = {
  cremage: 'diminuer la taille des gouttes ou épaissir la phase continue',
  floculation: 'augmenter la répulsion entre gouttes (charge de surface, polymère adsorbé)',
  coalescence: 'mieux couvrir l’interface avec l’émulsifiant (quantité et choix)',
  ostwald: 'ajouter une huile insoluble dans la phase continue et resserrer les tailles',
};
export const OBSERVATIONS = {
  cremage: [
    ['Aspect', 'une couche de crème se forme en haut du flacon, avec un sérum plus clair en dessous'],
    ['Au microscope', 'les gouttes ont gardé leur taille, séparées les unes des autres'],
    ['Après agitation', 'l’émulsion redevient homogène'],
  ],
  floculation: [
    ['Aspect', 'la crème devient granuleuse, avec de petits grumeaux'],
    ['Au microscope', 'des amas de gouttes accolées, chaque goutte ayant gardé sa taille'],
    ['Après agitation', 'les amas se défont et la crème redevient lisse'],
  ],
  coalescence: [
    ['Aspect', 'une couche d’huile libre apparaît en surface'],
    ['Au microscope', 'des grosses gouttes issues de la fusion de plusieurs petites'],
    ['Après agitation', 'les grosses gouttes ne disparaissent pas : l’huile libre reste'],
  ],
  ostwald: [
    ['Aspect', 'aucun changement visible au début, puis la crème devient plus grossière'],
    ['Au microscope', 'des gouttes qui ne se touchent pas ; les plus petites disparaissent, les plus grosses grossissent'],
    ['Après agitation', 'la distribution de tailles ne revient pas à l’état initial'],
  ],
};
export function tirageDiagnostic(r = Math.random, forcer = {}) {
  const phen = forcer.phen ?? choix(PHENOMENES, r);
  return { phen, observations: OBSERVATIONS[phen], remede: REMEDES[phen] };
}
