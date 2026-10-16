// ====================================================
//  MODÈLE DE LA SIMULATION CPG (sim 54) — fonctions pures, testables sans React
//
//  RÉTENTION. Chaque composé est repéré par son indice de rétention de Kováts I, mesuré sur deux colonnes
//  du même fabricant (GL Sciences, notes GT063 et GT065 : InertCap 5 = 5 % phényl-PDMS « apolaire »,
//  InertCap WAX = PEG « polaire » ; 60 m × 0,25 mm × 0,25 µm) en isotherme à 40, 80, 120 et 160 °C.
//  Les n-alcanes ont, par définition, I = 100 n à toute température et sur toute colonne.
//  Sur ces mêmes chromatogrammes, ln k des alcanes « virtuels » a été ajusté (moindres carrés globaux,
//  4 températures, ~70 pics par colonne, écart-type 0,5 % sur ln tR) sous la forme de van 't Hoff :
//        ln k = a0 + a1/T + (b0 + b1/T) · I/100        (T en K, rapport de phase β = 250)
//  ce qui revient à inverser la définition de l'indice de Kováts. Pour un autre film : k ∝ 1/β.
//  Contrôle hors échantillon : la programmation publiée (40 → 220 °C à 5 °C/min, mêmes colonnes) est
//  prédite à 3 % (5 % phényl) et 4,5 % (WAX) près en moyenne quadratique, sans paramètre ajusté.
//
//  GAZ VECTEUR. Débit constant (régulation électronique), écoulement de Poiseuille compressible :
//  vitesse de sortie u0 = d²·p0·(P² − 1)/(32 η L), vitesse moyenne ū = j·u0, j = 3(P² − 1)/(2(P³ − 1)).
//  ÉLUTION. Migration de chaque bande intégrée pas à pas : dz/dt = ū(T)/(1 + k(T)) avec T(t) le programme du four.
//  EFFICACITÉ. Équation de Golay (colonne capillaire) avec la correction de compressibilité de Giddings ;
//  largeur temporelle du pic : σ = t0(Te)·(1 + ke)/√N(ke) à la température d'élution Te.
//  DÉTECTEUR FID. Aire ∝ masse injectée dans la colonne × nombre de carbones effectif / masse molaire.
//  PANNES. Déformations simples et illustratives du fonctionnement normal.
// ====================================================

// Indices de rétention [40, 80, 120, 160 °C] (GL Sciences GT063 / GT065) ; un nombre seul = indice de la
// programmation de température (données isothermes absentes de la note) : on le suppose constant.
// M (g/mol), ρ (g/mL, 20 °C), téb (°C) : valeurs usuelles des tables. ecn : nombre de carbones effectif
// (contributions de Sternberg : C aliphatique ou aromatique 1 ; C=O 0 ; C≡N 0,3 ; O éther −1 ; O alcool
// primaire −0,6, secondaire −0,75 ; Cl −0,12 par atome ; O d'ester estimé −0,7 ; DMF estimé) : ordre de grandeur.
export const COMPOSES = [
  { id: 'meoh',  nom: 'Méthanol',             famille: 'alcool', M: 32.04,  rho: 0.792, teb: 64.7,  ecn: 0.4,  oh: true,  I: { apolaire: [397, 368, 354, 347], polaire: [903, 899, 890, 879] } },
  { id: 'etoh',  nom: 'Éthanol',              famille: 'alcool', M: 46.07,  rho: 0.789, teb: 78.4,  ecn: 1.4,  oh: true,  I: { apolaire: [459, 442, 427, 432], polaire: [941, 933, 923, 912] } },
  { id: 'ipa',   nom: 'Propan-2-ol',          famille: 'alcool', M: 60.10,  rho: 0.786, teb: 82.5,  ecn: 2.25, oh: true,  I: { apolaire: [501, 493, 475, 478], polaire: [934, 923, 909, 897] } },
  { id: 'nproh', nom: 'Propan-1-ol',          famille: 'alcool', M: 60.10,  rho: 0.803, teb: 97.2,  ecn: 2.4,  oh: true,  I: { apolaire: [564, 555, 543, 547], polaire: [1044, 1038, 1030, 1026] } },
  { id: 'buoh',  nom: 'Butan-1-ol',           famille: 'alcool', M: 74.12,  rho: 0.810, teb: 117.7, ecn: 3.4,  oh: true,  I: { apolaire: [670, 660, 652, 636], polaire: 1142 } },
  { id: 'acet',  nom: 'Acétone',              famille: 'cétone', M: 58.08,  rho: 0.791, teb: 56.1,  ecn: 2.0,  I: { apolaire: [496, 494, 481, 483], polaire: [823, 829, 837, 848] } },
  { id: 'mek',   nom: 'Butanone',             famille: 'cétone', M: 72.11,  rho: 0.805, teb: 79.6,  ecn: 3.0,  I: { apolaire: [600, 597, 591, 594], polaire: [905, 915, 925, 929] } },
  { id: 'mibk',  nom: 'MIBK',                 famille: 'cétone', M: 100.16, rho: 0.802, teb: 116.5, ecn: 5.0,  I: { apolaire: [743, 741, 742, 734], polaire: [1009, 1021, 1032, 1044] } },
  { id: 'cyhone', nom: 'Cyclohexanone',       famille: 'cétone', M: 98.14,  rho: 0.947, teb: 155.6, ecn: 5.0,  I: { apolaire: [890, 900, 913, 925], polaire: 1301 } },
  { id: 'aceet', nom: 'Acétate d’éthyle',     famille: 'ester',  M: 88.11,  rho: 0.902, teb: 77.1,  ecn: 2.3,  I: { apolaire: [619, 612, 600, 598], polaire: [893, 894, 894, 891] } },
  { id: 'aceip', nom: 'Acétate d’isopropyle', famille: 'ester',  M: 102.13, rho: 0.872, teb: 88.6,  ecn: 3.3,  I: { apolaire: [668, 660, 650, 648], polaire: [904, 904, 900, 897] } },
  { id: 'acebu', nom: 'Acétate de butyle',    famille: 'ester',  M: 116.16, rho: 0.882, teb: 126.1, ecn: 4.3,  I: { apolaire: [764, 758, 753, 750], polaire: [1078, 1082, 1085, 1079] } },
  { id: 'ether', nom: 'Éther diéthylique',    famille: 'éther',  M: 74.12,  rho: 0.713, teb: 34.6,  ecn: 3.0,  I: { apolaire: [510, 506, 490, 496], polaire: [623, 619, 620, 625] } },
  { id: 'thf',   nom: 'THF',                  famille: 'éther',  M: 72.11,  rho: 0.889, teb: 66.0,  ecn: 3.0,  I: { apolaire: [635, 638, 638, 630], polaire: [866, 885, 903, 920] } },
  { id: 'diox',  nom: '1,4-Dioxane',          famille: 'éther',  M: 88.11,  rho: 1.033, teb: 101.1, ecn: 2.0,  I: { apolaire: [711, 713, 715, 711], polaire: [1062, 1081, 1100, 1122] } },
  { id: 'dcm',   nom: 'Dichlorométhane',      famille: 'chloré', M: 84.93,  rho: 1.326, teb: 39.6,  ecn: 0.76, I: { apolaire: [537, 540, 537, 542], polaire: [940, 939, 940, 933] } },
  { id: 'chcl3', nom: 'Chloroforme',          famille: 'chloré', M: 119.38, rho: 1.489, teb: 61.2,  ecn: 0.64, I: { apolaire: [620, 624, 624, 613], polaire: [1027, 1031, 1033, 1036] } },
  { id: 'acn',   nom: 'Acétonitrile',         famille: 'nitrile', M: 41.05, rho: 0.786, teb: 81.6,  ecn: 1.3,  I: { apolaire: [493, 492, 478, 480], polaire: [1011, 1024, 1037, 1053] } },
  { id: 'dmf',   nom: 'DMF',                  famille: 'amide',  M: 73.09,  rho: 0.944, teb: 153.0, ecn: 1.5,  oh: true,  I: { apolaire: [798, 784, 786, 784], polaire: 1333 } },
  { id: 'benz',  nom: 'Benzène',              famille: 'aromatique', M: 78.11, rho: 0.877, teb: 80.1, ecn: 6,  I: { apolaire: [664, 673, 679, 677], polaire: [945, 964, 982, 1000] } },
  { id: 'tol',   nom: 'Toluène',              famille: 'aromatique', M: 92.14, rho: 0.867, teb: 110.6, ecn: 7, I: { apolaire: [766, 776, 785, 787], polaire: [1040, 1061, 1082, 1094] } },
  { id: 'ebz',   nom: 'Éthylbenzène',         famille: 'aromatique', M: 106.17, rho: 0.867, teb: 136.2, ecn: 8, I: { apolaire: [857, 868, 879, 885], polaire: 1135 } },
  { id: 'pxyl',  nom: 'p-Xylène',             famille: 'aromatique', M: 106.17, rho: 0.861, teb: 138.4, ecn: 8, I: { apolaire: [866, 876, 886, 892], polaire: 1143 } },
  { id: 'oxyl',  nom: 'o-Xylène',             famille: 'aromatique', M: 106.17, rho: 0.880, teb: 144.4, ecn: 8, I: { apolaire: [887, 899, 912, 925], polaire: 1190 } },
  ...[[5, 'Pentane', 72.15, 0.626, 36.1], [6, 'Hexane', 86.18, 0.659, 68.7], [7, 'Heptane', 100.20, 0.684, 98.4], [8, 'Octane', 114.23, 0.703, 125.7],
    [9, 'Nonane', 128.26, 0.718, 150.8], [10, 'Décane', 142.28, 0.730, 174.1], [11, 'Undécane', 156.31, 0.740, 196], [12, 'Dodécane', 170.34, 0.749, 216.3]]
    .map(([n, nom, M, rho, teb]) => ({ id: 'c' + n, nom, famille: 'alcane', M, rho, teb, ecn: n, alcane: n, I: { apolaire: 100 * n, polaire: 100 * n } })),
];
export const PAR_ID = Object.fromEntries(COMPOSES.map(c => [c.id, c]));

// ln k des alcanes virtuels (ajustement global sur les données GL Sciences, β = 250)
export const PHASES = {
  apolaire: { nom: 'apolaire', chimie: '5 % phényl – 95 % diméthylpolysiloxane', exemples: 'HP-5, DB-5, InertCap 5', tmax: 325,
    a0: -7.018, a1: 229.0, b0: -0.6766, b1: 505.5 },
  polaire: { nom: 'polaire', chimie: 'polyéthylène glycol (PEG)', exemples: 'DB-WAX, InertCap WAX, Carbowax', tmax: 250,
    a0: -6.932, a1: -88.7, b0: -0.5632, b1: 429.0 },
};
const BETA_REF = 250;

// Gaz vecteurs : viscosité η = η300·(T/300)^x (Pa·s) ; coefficient de diffusion d'un soluté type (C6–C8)
// à 25 °C et 1 atm (cm²/s, ordre de grandeur, corrélation de Fuller) ; D ∝ T^1,75 / p.
export const GAZ = {
  He: { nom: 'hélium', eta300: 19.9e-6, x: 0.68, D0: 0.30 },
  H2: { nom: 'dihydrogène', eta300: 8.96e-6, x: 0.68, D0: 0.37 },
  N2: { nom: 'diazote', eta300: 17.9e-6, x: 0.70, D0: 0.085 },
};
const P0 = 101325;         // Pa : sortie de colonne (FID, pression atmosphérique)
const T_REF_DEBIT = 298.15; // K : débit exprimé à 25 °C et 1 atm (convention des appareils)
const DS = 5e-6;           // cm²/s : diffusion dans la phase stationnaire (ordre de grandeur)

export const PARAMS_DEFAUT = {
  phase: 'apolaire', L: 30, dc: 0.25, df: 0.25,         // colonne : m, mm, µm
  gaz: 'He', debit: 1.2,                                // gaz vecteur : mL/min (25 °C, 1 atm), débit constant
  T0: 40, t1: 2, rampe: 10, Tf: 200, t2: 2,             // four : °C, min, °C/min (0 = isotherme), °C, min
  mode: 'split', split: 100, V: 0.2,                    // injecteur : split / splitless ; rapport de division ; µL
  panne: null,
};
export const SEUIL_RS = [1.0, 1.5];
// Échantillon : chaque composé choisi à 5 % en volume dans le disulfure de carbone (CS₂), solvant
// presque invisible au FID (il n'est pas représenté).
export const FRACTION_VOL = 0.05;
export const P_MAX = 600;    // kPa : limite usuelle du régulateur de pression en tête de colonne

// ---------- pannes : effets simples et illustratifs ----------
export const PANNES = {
  septum: { nom: 'Septum usé (fuite à l’injecteur)', symptome: 'pression en tête plus basse, temps de rétention plus longs, aires plus petites et peu répétables',
    geste: 'Changer le septum (injecteur refroidi), puis vérifier l’étanchéité et le débit.' },
  liner: { nom: 'Liner (insert) encrassé', symptome: 'les composés polaires (alcools, DMF) traînent et perdent de l’aire ; les autres pics sont normaux',
    geste: 'Changer le liner et son joint ; couper 20 à 50 cm en tête de colonne si la traînée persiste.' },
  flamme: { nom: 'Flamme du FID éteinte', symptome: 'aucun pic, ligne de base plate à zéro, alors que pression et débit sont normaux',
    geste: 'Vérifier les débits de dihydrogène et d’air, puis rallumer la flamme (test : buée sur une surface froide au-dessus de la cheminée).' },
  hydrogene: { nom: 'Débit de dihydrogène du FID déréglé', symptome: 'pics plus petits et ligne de base plus bruitée ; temps de rétention corrects',
    geste: 'Contrôler les débits de gaz du détecteur (dihydrogène, air, gaz d’appoint) au débitmètre et les régler selon la notice.' },
  ressuage: { nom: 'Colonne usée (ressuage de la phase)', symptome: 'la ligne de base monte fortement en fin de programme ; pics un peu plus larges',
    geste: 'Ne pas dépasser la température maximale de la colonne ; conditionner la colonne ; si le défaut persiste, la remplacer.' },
};
const PANNE_EFFETS = {
  septum: { debitFac: 0.75, aireFac: 0.6 },
  liner: { trainee: 2.5, aireOH: 0.7 },
  flamme: { gain: 0, eteinte: true },
  hydrogene: { gain: 0.4, bruit: 0.05 },
  ressuage: { ressuage: 10, dTmax: -80, nFac: 0.6 },
};
export const effets = p => (p.panne && PANNE_EFFETS[p.panne]) || {};

// ---------- four ----------
export function dureeProgramme(p) {
  return p.rampe > 0 ? p.t1 + Math.max(0, p.Tf - p.T0) / p.rampe + p.t2 : null;
}
export function temperature(p, t) {
  if (!(p.rampe > 0)) return p.T0;
  if (t <= p.t1) return p.T0;
  return Math.min(p.Tf, p.T0 + p.rampe * (t - p.t1));
}

// ---------- gaz vecteur : pression d'entrée et temps mort à la température T (°C), débit constant ----------
export function ecoulement(p, T) {
  const g = GAZ[p.gaz], e = effets(p);
  const Tk = T + 273.15, eta = g.eta300 * (Tk / 300) ** g.x;
  const L = p.L, d = p.dc * 1e-3, r = d / 2;
  const F = p.debit * (e.debitFac || 1) * 1e-6 / 60 * (Tk / T_REF_DEBIT);   // m³/s à la sortie (T du four, p0)
  const u0 = F / (Math.PI * r * r);
  const P2 = 1 + 32 * eta * L * u0 / (d * d * P0);
  const P = Math.sqrt(P2);
  const j = 1.5 * (P2 - 1) / (P * P2 - 1);
  const ub = j * u0, t0 = L / ub / 60;                                     // m/s, min
  const fGid = 9 * (P2 * P2 - 1) * (P2 - 1) / (8 * (P * P2 - 1) ** 2);     // correction de compressibilité (Giddings)
  return { P, pEntree: (P - 1) * P0 / 1000, u0, ub, t0, eta, f: fGid };   // pEntree : kPa relatifs (manomètre)
}

// ---------- rétention ----------
const ajustI = {};                       // I(T) = I100 + pente·(T − 100) : droite des moindres carrés sur 40–160 °C
function indiceFn(c, phase) {
  const cle = c.id + '|' + phase;
  if (ajustI[cle]) return ajustI[cle];
  const d = c.I[phase];
  let f;
  if (!Array.isArray(d)) f = () => d;
  else {
    const Ts = [40, 80, 120, 160], mT = 100, mI = d.reduce((s, x) => s + x, 0) / 4;
    const pente = Ts.reduce((s, T, i) => s + (T - mT) * (d[i] - mI), 0) / Ts.reduce((s, T) => s + (T - mT) ** 2, 0);
    f = T => mI + pente * (Math.min(Math.max(T, 20), 220) - mT);
  }
  ajustI[cle] = f;
  return f;
}
export const indice = (c, phase, T) => indiceFn(c, phase)(T);
export function lnK(p, c, T) {
  const ph = PHASES[p.phase], Tk = T + 273.15, beta = p.dc * 1000 / (4 * p.df);
  return Math.log(BETA_REF / beta) + ph.a0 + ph.a1 / Tk + (ph.b0 + ph.b1 / Tk) * indice(c, p.phase, T) / 100;
}

// ---------- efficacité : Golay + compressibilité ----------
export function hauteurPlateau(p, k, T) {
  const g = GAZ[p.gaz], ec = ecoulement(p, T), Tk = T + 273.15;
  const Dm0 = g.D0 * 1e-4 * (Tk / 298.15) ** 1.75;                        // m²/s à p0 (sortie de colonne)
  const d = p.dc * 1e-3, df = p.df * 1e-6;
  const B = 2 * Dm0;
  const Cm = (1 + 6 * k + 11 * k * k) * d * d / (96 * (1 + k) ** 2 * Dm0);
  const Cs = (2 / 3) * k / (1 + k) ** 2 * df * df / (DS * 1e-4);
  return ec.f * (B / ec.u0 + Cm * ec.u0) + Cs * ec.ub;                    // m
}

// ---------- élution d'un composé ----------
const T_LIMITE = 200;     // min : au-delà, le composé est considéré comme non élué
export function elution(p, c) {
  const e = effets(p);
  let z = 0, t = 0, dt = 0.004;
  const traj = [[0, 0]];                                   // trajectoire (t, z) de la bande, pour l'animation
  while (z < 1 && t < T_LIMITE) {
    const T = temperature(p, t + dt / 2);
    const v = 1 / (ecoulement(p, T).t0 * (1 + Math.exp(lnK(p, c, T)) * (e.kFac || 1)));
    if (z + v * dt > 1) { t += (1 - z) / v; z = 1; traj.push([t, 1]); break; }
    z += v * dt; t += dt;
    if (traj.length < 4000 && t - traj[traj.length - 1][0] >= 0.02) traj.push([t, z]);
    if (t > 5) dt = 0.01;
  }
  if (z < 1) return { elue: false };
  const Te = temperature(p, t), ke = Math.exp(lnK(p, c, Te)) * (e.kFac || 1), ec = ecoulement(p, Te);
  const N = p.L / hauteurPlateau(p, ke, Te) * (e.nFac || 1);
  return { elue: true, tr: t, Te, k: ke, t0e: ec.t0, N, sigmaCol: ec.t0 * (1 + ke) / Math.sqrt(N), traj };
}

// ---------- injection ----------
// split : fraction (1/(1 + R)) de l'échantillon vaporisé entre dans la colonne ; bande d'injection très courte.
// splitless : ~90 % entre dans la colonne, mais pendant ~0,75 min (temps de purge) ; la bande est recondensée
// en tête de colonne (rapport (1 + k élution)/(1 + k initial)) si le four de départ est assez froid.
const T_PURGE = 0.75, TRANSFERT_SPLITLESS = 0.9, VOL_LINER = 0.9;   // min, —, mL
export function injection(p) {
  if (p.mode === 'splitless') return { fraction: TRANSFERT_SPLITLESS, duree: T_PURGE };
  const Ftot = p.debit * (1 + p.split);
  return { fraction: 1 / (1 + p.split), duree: VOL_LINER / Ftot };
}
// capacité d'une colonne : masse au-delà de laquelle le pic se déforme (front avant étalé)
export const capacite = p => 0.2 * (p.df / 0.25) * (p.dc / 0.25) ** 2;   // µg par composé (ordre de grandeur)

// ---------- analyse complète ----------
export function analyse(p, ids) {
  const e = effets(p), inj = injection(p), cap = capacite(p);
  const kInit = c => Math.exp(lnK(p, c, p.T0));
  const tous = ids.map(id => {
    const c = PAR_ID[id], el = elution(p, c);
    if (!el.elue) return { ...c, elue: false };
    const masse = c.rho * p.V * FRACTION_VOL * inj.fraction * 1000 * (e.aireFac || 1) * (e.aireFac ? 1 + 0.25 * Math.sin(12.9898 * (p.essai || 0) + 1.3) : 1) * (c.oh && e.aireOH ? e.aireOH : 1);   // µg dans la colonne
    const focal = (1 + el.k) / (1 + kInit(c));
    const sigmaInj = inj.duree / Math.sqrt(12) * Math.min(1, focal);
    const sigma = Math.sqrt(el.sigmaCol ** 2 + sigmaInj ** 2);
    const aire = masse * c.ecn / c.M * 1e4 * (e.gain ?? 1);       // u.a. ∝ nombre de carbones effectifs
    const surcharge = masse / cap;
    const tauQ = c.oh && e.trainee ? e.trainee * sigma : 0;       // traînée (sites actifs du liner)
    const tauF = surcharge > 1 ? Math.min(6, 0.9 * (surcharge - 1) ** 0.6) * sigma : 0;  // front avant (surcharge)
    return { ...c, ...el, masse, aire, sigma, sigmaInj, surcharge, tauQ, tauF, W: 2.355 * sigma, Ik: indice(c, p.phase, el.Te) };
  });
  const pics = tous.filter(m => m.elue).sort((a, b) => a.tr - b.tr);
  pics.forEach(m => { m.hauteur = hauteurMax(m); });
  const res = pics.slice(0, -1).map((m, i) => ({ de: m, a: pics[i + 1], R: resolutionNum(m, pics[i + 1]) }));
  const ec0 = ecoulement(p, p.T0), fin = dureeProgramme(p);
  const dernier = pics.length ? pics[pics.length - 1] : null;
  let tMax = Math.max(ec0.t0 * 2, dernier ? dernier.tr + 4 * dernier.sigma + 3 * dernier.tauQ : 0, fin || 0);
  let ref = null, hRef = Math.max(...pics.map(m => m.hauteur), 0);
  if (p.panne) { ref = analyse({ ...p, panne: null }, ids); hRef = ref.hRef; tMax = Math.max(tMax, ref.tMax); }
  const Tmax = p.rampe > 0 ? p.Tf : p.T0;
  return {
    pics, res, tMax, nonElues: tous.filter(m => !m.elue), hRef, ref, cap,
    pression: { debut: ec0.pEntree, fin: ecoulement(p, Tmax).pEntree }, t0: ec0.t0,
    ligneBase: { bruit: e.bruit || 0, ressuage: e.ressuage || 1, eteinte: !!e.eteinte, tmax: PHASES[p.phase].tmax + (e.dTmax || 0), hRef },
  };
}

// ---------- forme des pics : gaussienne, éventuellement traînante (τ > 0) ou à front étalé (surcharge) ----------
function erfc(x) {                       // Numerical Recipes (erfcc), erreur relative < 1,2·10⁻⁷
  const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 +
    t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
}
function erfcxPos(x) {                   // exp(x²)·erfc(x) pour x ≥ 0, sans dépassement
  const t = 1 / (1 + 0.5 * x);
  return t * Math.exp(-1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 +
    t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
}
// densité gaussienne convoluée par une exponentielle de constante τ (EMG), normalisée (aire 1)
function emg(x, s, tau) {
  if (tau < 0.02 * s) return Math.exp(-0.5 * (x / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
  const w = (s / tau - x / s) / Math.SQRT2;
  if (w >= 0) return Math.exp(-0.5 * (x / s) ** 2) * erfcxPos(w) / (2 * tau);
  return Math.exp(s * s / (2 * tau * tau) - x / tau) * erfc(w) / (2 * tau);
}
export function signal(m, t) {
  const x = t - m.tr;
  let f;
  if (m.tauF > 0) f = emg(-x, m.sigma, m.tauF);       // front avant : exponentielle vers les temps courts
  else f = emg(x, m.sigma, m.tauQ || 0);
  return m.aire * f;
}
function hauteurMax(m) {
  let h = 0;
  const a = m.tr - 4 * m.sigma - 4 * m.tauF, b = m.tr + 4 * m.sigma + 4 * m.tauQ;
  for (let i = 0; i <= 200; i++) h = Math.max(h, signal(m, a + (b - a) * i / 200));
  return h;
}
// résolution : formule usuelle 1,18 Δt / (W½₁ + W½₂) avec les largeurs à mi-hauteur réelles (pics déformés compris)
function largeurMiHauteur(m) {
  if (!m.tauQ && !m.tauF) return 2.355 * m.sigma;
  const a = m.tr - 6 * m.sigma - 6 * m.tauF, b = m.tr + 6 * m.sigma + 8 * m.tauQ, n = 600;
  let g = null, d = null;
  for (let i = 0; i <= n; i++) { const t = a + (b - a) * i / n; if (signal(m, t) >= m.hauteur / 2) { if (g == null) g = t; d = t; } }
  return g == null ? 2.355 * m.sigma : d - g;
}
function resolutionNum(a, b) {
  a.W = largeurMiHauteur(a); b.W = largeurMiHauteur(b);
  return 1.18 * (b.tr - a.tr) / (a.W + b.W);
}

// ---------- ligne de base : bruit, ressuage de la colonne (croît avec la température) ----------
export function ligneBase(lb, p, t) {
  if (lb.eteinte) return 0;
  const T = temperature(p, t);
  const ress = 0.004 * lb.ressuage * lb.hRef * Math.exp((T - lb.tmax) / 30) * 8;
  const alea = lb.bruit ? Math.sin(t * 91.7) * 0.5 + Math.sin(t * 213.3 + 1.7) * 0.3 + Math.sin(t * 457.1 + 0.4) * 0.2 : 0;
  return ress + lb.hRef * lb.bruit * alea;
}

// position d'une bande à l'instant t (fraction z de la longueur parcourue) et son facteur de rétention local
export function positionBande(p, m, t) {
  if (t >= m.tr) return { z: 1 + (t - m.tr) / m.t0e, k: 0 };
  const tr = m.traj;
  let i = 1;
  while (i < tr.length - 1 && tr[i][0] < t) i++;
  const [ta, za] = tr[i - 1], [tb, zb] = tr[i];
  const z = tb > ta ? za + (zb - za) * (t - ta) / (tb - ta) : zb;
  return { z, k: Math.exp(lnK(p, PAR_ID[m.id], temperature(p, t))) };
}
