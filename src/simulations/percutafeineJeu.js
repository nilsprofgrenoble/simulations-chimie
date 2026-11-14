// ====================================================
//  CONTRE-TYPAGE DE LA PERCUTAFÉINE : histoire à choix pour le BTS Métiers de la Chimie (sans React, testable seule avec node).
//  Support : TP / CCF4 « contre-typage d'un gel de Percutaféine » (déformulation, formulation d'un gel au Synthalen K, contrôle qualité :
//  extrait sec, rhéologie, caféine par CLHP ou UV, éthanol par CPG). Le joueur est technicien·ne de R&D, sur une journée de 8 h à 17 h (pause déjeuner d'une heure).
//  Les valeurs sont FICTIVES mais calées sur les mesures réelles des élèves (pentes, bruits, écarts entre méthodes) ;
//  chaque donnée affichée est celle qui sert au corrigé (les calculs repartent des valeurs arrondies affichées).
//  Hypothèses de mesure : voir les champs « hyp » de chaque scène (toujours affichées à l'élève).
// ====================================================
import { INDICATEURS } from './acidesBasesModele.js';
export const ID_PERCU = 113;
export const CLE_ETAT = 'percu-histoire-v1';
export const CLE_FINS = 'percu-fins-v1';
export const T_FIN = 540;        // journée de TP de 8 h à 17 h, en minutes depuis 8 h
export const T_MIDI = 240;       // 12 h : point d'étape de Mme Dubreuil, puis pause déjeuner
export const T_PAUSE = 60;       // durée de la pause déjeuner

export const nf = (x, d = 1) => Number(x).toFixed(d).replace('.', ',');
export const horloge = t => { const m = 8 * 60 + t; return `${Math.floor(m / 60)} h ${String(Math.floor(m % 60)).padStart(2, '0')}`; };
export const duree = min => min >= 60 ? `${Math.floor(min / 60)} h ${String(Math.round(min % 60)).padStart(2, '0')}` : `${Math.round(min)} min`;

// ───────────── Aléatoire reproductible (une graine par partie) ─────────────
const hachage = s => { let h = 1779033703 ^ s.length; for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^ (h >>> 16)) >>> 0; };
export const unif = (graine, cle) => hachage(`${graine}|${cle}`) / 4294967296;
export const gauss = (graine, cle) => Math.sqrt(-2 * Math.log(Math.max(1e-9, unif(graine, cle + 'a')))) * Math.cos(2 * Math.PI * unif(graine, cle + 'b'));
const arr = (x, d) => +Number(x).toFixed(d);

// ───────────── Données du scénario ─────────────
export const PNJ = {
  moi: { nom: 'Toi', role: 'Technicien·ne de R&D', couleur: '#0f766e' },
  dubreuil: { nom: 'Mme Dubreuil', role: 'Responsable du laboratoire', couleur: '#7c3aed' },
  ines: { nom: 'Inès', role: 'Technicienne en analyses (CLHP, CPG, UV)', couleur: '#0369a1' },
  lucas: { nom: 'Lucas', role: 'Technicien rhéologie et formulation', couleur: '#15803d' },
};
export const M_LOT = 200;                    // g de gel à fabriquer
export const COM = { caf: 5.0, carb: 0.75, coc: 4.0, trol: 0.9, eth96: 40.0 };   // gel commercial (vérité cachée, % massiques)
export const ETH_PUR_COM = COM.eth96 * 0.96;  // 38,4 % d'éthanol pur
export const ES_COM = COM.caf + COM.carb + COM.coc + COM.trol;   // 10,65 %
export const SR_ES = 0.5;                    // écart-type de répétabilité de l'extrait sec (donné par le sujet), en % absolus
export const RHO_ETOH = 0.789;               // g/mL à 20 °C
export const SPEC = { caf: [4.5, 5.5], eth: [35.4, 41.4], q: 0.7 };   // cahier des charges du contretype (hypothèse du scénario)
export const V_REF = 250, V_EI = 500;        // µL d'éthanol et d'étalon interne dans la fiole de référence (CPG)
export const PENTE_CPG = 0.00139;            // r = %A(EtOH)/%A(EI) par µL d'éthanol dans 20 mL (EI = butan-1-ol, 500 µL) : pente mesurée par les élèves
export const SIG_CPG = 0.035;                // dispersion relative d'une injection CPG (volume injecté mal maîtrisé), hypothèse gaussienne
export const K_GEL = 0.0455, K_ELU = 0.0330; // L/mg : sensibilité UV de la caféine dans la solution de gel (effet de matrice) et dans l'éluant seul
export const KC = 23.4, KB = 2.1;            // aire de pic par mg/L : caféine, benzoïne (CLHP, 273 nm)
export const FINS = [
  ['fin_conforme', 'Contretype conforme'],
  ['fin_detecte', 'Non-conformité détectée'],
  ['fin_mauvaise_cause', 'Défaut mal identifié'],
  ['fin_faux_ok', 'Lot non conforme validé'],
  ['fin_faux_nok', 'Lot conforme refusé'],
  ['fin_temps', 'Hors délai'],
];

// ───────────── Vérité sur le gel formulé par le joueur ─────────────
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const QDISP = { continuer: 1.0, neutraliser: 0.85, chauffer: 0.95, grumeaux: 0.3 };
export const M_COOH = 45.02, M_TEA = 149.19;
export const coohLot = e => 45.02 / (72 + 14 * unif(e.f?.graine ?? 1, 'lotcooh'));   // fraction massique de COOH du lot de Synthalen K : bidon ancien, poudre plus ou moins humide (fiche 3V : masse équivalente d'environ 76 g de polymère par mole de COOH, soit environ 59 % ; le lot réel va de 52 à 62 %)
// pH du gel après ajout cumulé de m g de trolamine. Calé sur la fiche 3V : 0,01 équivalent de base par g de polymère (1,5 g de trolamine) donne pH 7,
// soit un taux de neutralisation α ≈ 0,77 (masse équivalente 76) ; pH 3 sans base ; plafond vers 8 (la trolamine est une base faible, pKa 7,8).
export const alphaNeutr = (e, m) => m * M_COOH / (M_TEA * (e.f.fm?.carb || 1.5) * coohLot(e));
export function phDe(e, m) { return 3.0 + 5.0 * (1 - Math.exp(-alphaNeutr(e, m) / 0.478)); }
export function gelVrai(e) {
  const fm = e.f.fm || { caf: 10, carb: 1.5, coc: 8, eth96: 80, trol: 1.8, eau: 98.7 };
  const l = e.f.perteEth || 0, ethPur = fm.eth96 * 0.96, trol = e.f.trolAdd || 0, ajout = e.f.ethAjout || 0;   // ajout : masse d'éthanol à 96 % réellement ajoutée en compensation
  const total = fm.caf + fm.carb + fm.coc + fm.eth96 + fm.eau + trol - ethPur * l + ajout;
  const carbPct = fm.carb / total * 100;
  const ph = e.f.phFinal ?? phDe(e, trol);
  const fPH = clamp((ph - 4.0) / 2.0, 0.15, 1);   // fiche 3V, figure 1 : plateau de viscosité à partir de pH 6
  const q = Math.min(1.1, (QDISP[e.f.disp] ?? 0.85) * fPH * Math.pow(carbPct / COM.carb, 1.3));
  return { caf: fm.caf / total * 100, eth: (ethPur * (1 - l) + 0.96 * ajout) / total * 100, carb: carbPct, ph, q };
}
export function defauts(e) {
  const g = gelVrai(e), d = [];
  if (g.caf < SPEC.caf[0] || g.caf > SPEC.caf[1]) d.push('caf');
  if (g.eth < SPEC.eth[0] || g.eth > SPEC.eth[1]) d.push('eth');
  if (g.q < SPEC.q) d.push('visco');
  return d;
}

// ───────────── Données calculées (toujours déterministes à partir de la graine) ─────────────
export const BALANCES = { std: { nom: 'balance au 0,01 g', res: 0.01, dec: 2 }, prec: { nom: 'balance de précision au 0,1 mg', res: 0.0001, dec: 4 } };
export function donneesEs(e) {
  const g = e.f.graine, B = BALANCES[e.f.bal || 'prec'], aff = x => arr(Math.round(x / B.res) * B.res, B.dec);
  return [0, 1, 2].map(i => {
    const m0v = 34.4 + 1.8 * unif(g, `m0${i}`), m1v = 1.0 + 0.06 * unif(g, `m1${i}`);
    const m2v = m0v + (ES_COM + SR_ES * gauss(g, `es${i}`)) / 100 * m1v;
    const bruit = B.res >= 0.01 ? 0.007 : 0;   // reproductibilité d'une balance au 0,01 g : de l'ordre de ±0,01 g sur chaque pesée (dérive, courants d'air, tare)
    const m0 = aff(m0v + bruit * gauss(g, `bn0${i}`)), m1 = aff(m1v), m2 = aff(m2v + bruit * gauss(g, `bn2${i}`));   // ce que la balance affiche : c'est avec ces valeurs que l'élève calcule
    return { m0, m1, m2, ES: (m2 - m0) / m1 * 100, bal: B.nom };
  });
}
export function esRetenu(e) {
  const d = donneesEs(e).map(x => x.ES);
  return e.f.es3 ? [...d].sort((a, b) => a - b)[1] : e.f.es2 === false ? d[0] : (d[0] + d[1]) / 2;
}
export const ecartEs = e => { const d = donneesEs(e); return Math.abs(d[0].ES - d[1].ES); };

export function donneesHplc(e) {
  const g = e.f.graine, gel = gelVrai(e), mPes = arr(0.98 + 0.08 * unif(g, 'hm'), 3), cRef = 5.09;
  const aRefC = arr(KC * cRef * (1 + 0.01 * gauss(g, 'h1')), 2), aRefB = arr(KB * 20 * (1 + 0.01 * gauss(g, 'h2')), 2);
  const aEchC = arr(KC * gel.caf * mPes * (1 + 0.01 * gauss(g, 'h3')), 2), aEchB = arr(KB * 20 * (1 + 0.01 * gauss(g, 'h4')), 2);
  const c5 = cRef * (aRefB / aRefC) * (aEchC / aEchB);
  return { mPes, cRef, aRefC, aRefB, aEchC, aEchB, pct: c5 / mPes };
}
export const regression = pts => {
  const n = pts.length, mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
  const sxx = pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0), sxy = pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0);
  const a = sxy / sxx, b = my - a * mx, sst = pts.reduce((s, p) => s + (p[1] - my) ** 2, 0), sse = pts.reduce((s, p) => s + (p[1] - (a * p[0] + b)) ** 2, 0);
  return { a, b, r2: 1 - sse / sst };
};
// ───── Plans de préparation : volumes choisis par l'élève, pipetage réel (incertitude des micropipettes), absorbance réelle ─────
export const nombre = x => { const v = parseFloat(String(x).replace(',', '.').replace(/\s/g, '')); return Number.isFinite(v) ? v : null; };
const pip = (e, V, cle) => V <= 0 ? 0 : V * (1 + (0.004 + 0.8 / V) * gauss(e.f.graine, cle));   // micropipette : plus le volume est petit, plus l'erreur relative est grande
const planDe = (e, id) => (e.f.plans || {})[id];
export const niveaux = (vmin, vmax, n) => Array.from({ length: n }, (_, i) => Math.round(vmin + (n > 1 ? i * (vmax - vmin) / (n - 1) : 0)));
const absUv = (A, e, cle) => arr(Math.min(2.5, Math.max(0, A * (1 - 0.08 * Math.max(0, A - 0.8)) + 0.004 * gauss(e.f.graine, cle))), 3);   // écart à la loi de Beer-Lambert au-delà de A ≈ 0,8, bruit de 0,004
export function donneesUv(e) {
  const g = e.f.graine, gel = gelVrai(e), mDef = arr(0.98 + 0.08 * unif(g, 'um'), 3);
  const pa = planDe(e, 'uv_ajouts_plan') || { m: mDef, vp: 200, dv: 50, n: 5 }, pe = planDe(e, 'uv_ext_plan') || { m: mDef, vp: 200, vmin: 20, vmax: 200, n: 5 };
  const cGel = (m, vp, cle) => gel.caf * m * pip(e, vp, cle) / 100;   // mg/L de caféine du gel dans la fiole de 20 mL
  const ajouts = Array.from({ length: pa.n }, (_, i) => { const v = i * pa.dv; return { v, c: arr(v * 1.003 / 20, 2), A: absUv(K_GEL * (cGel(pa.m, pa.vp, `uvp${i}`) + pip(e, v, `uvs${i}`) * 1.003 / 20), e, `ua${i}`) }; });
  const rg = regression(ajouts.map(p => [p.c, p.A])), a = arr(rg.a, 4), b = arr(rg.b, 4);
  const gamme = niveaux(pe.vmin, pe.vmax, pe.n).map((v, i) => ({ v, c: arr(v * 1.003 / 20, 2), A: absUv(K_ELU * pip(e, v, `ue${i}`) * 1.003 / 20, e, `uea${i}`) }));
  const re = regression(gamme.map(p => [p.c, p.A])), aE = arr(re.a, 4), bE = arr(re.b, 4);
  const aGel = absUv(K_GEL * cGel(pe.m, pe.vp, 'uvp_e'), e, 'ug');
  const aTem = absUv(K_GEL * COM.caf * pe.m * pip(e, pe.vp, 'uvp_t') / 100, e, 'ut');   // même prise d'essai, gel commercial à 5 % : le témoin de la méthode
  return { mPes: pa.m, planA: pa, planE: pe, ajouts, a, b, r2: arr(rg.r2, 4), pctAjouts: a > 0 ? 100 * (b / a) / (pa.m * pa.vp) : 0, residus: ajouts.map(p => arr(p.A - (a * p.c + b), 3)),
    gammeExt: gamme, aExt: aE, bExt: bE, r2Ext: arr(re.r2, 4), aGel, pctExt: aE > 0 ? 100 * ((aGel - bE) / aE) / (pe.m * pe.vp) : 0, pctTemoin: aE > 0 ? 100 * ((aTem - bE) / aE) / (pe.m * pe.vp) : 0, residusExt: gamme.map(p => arr(p.A - (aE * p.c + bE), 3)) };
}
export function donneesHplcGamme(e) {
  const g = e.f.graine, gel = gelVrai(e), mPes = donneesHplc(e).mPes, pl = planDe(e, 'hplc_gamme_plan') || { vmin: 20, vmax: 200, n: 5 };
  const pts = niveaux(pl.vmin, pl.vmax, pl.n).map((v, i) => { const c = pip(e, v, `hg${i}`) * 1.018 / 20, sat = c > 40 ? 1 - 0.15 * (c - 40) / 40 : 1; return { v, c: arr(v * 1.018 / 20, 2), A: arr(KC * c * sat * (1 + 0.01 * gauss(g, `hga${i}`)), 2) }; });
  const rg = regression(pts.map(p => [p.c, p.A])), a = arr(rg.a, 3), b = arr(rg.b, 2), aEch = arr(KC * gel.caf * mPes * (1 + 0.01 * gauss(g, 'hge')), 2);
  return { mPes, pts, a, b, r2: arr(rg.r2, 4), aEch, c5: a > 0 ? (aEch - b) / a : 0, pct: a > 0 ? (aEch - b) / a / mPes : 0, residus: pts.map(p => arr(p.A - (a * p.c + b), 2)) };
}
export function donneesCpg(e) {
  const g = e.f.graine, gel = gelVrai(e);
  const ratio = r => ({ aE: arr(100 * r / (1 + r), 2), aEI: arr(100 / (1 + r), 2) });
  const rRef = PENTE_CPG * V_REF * (1 + SIG_CPG / Math.sqrt(3) * gauss(g, 'cr')), ref = ratio(rRef);
  const mP = arr(0.5 + 0.03 * unif(g, 'cm'), 3), vE = mP * gel.eth / 100 / RHO_ETOH * 1000;
  const ech = ratio(PENTE_CPG * vE * (1 + SIG_CPG / Math.sqrt(3) * gauss(g, 'ce')));
  const pg = planDe(e, 'cpg_gamme_plan') || { vmin: 100, vmax: 1000, n: 5, rep: 2 };
  const sig = r => SIG_CPG * (1 + 0.12 / r) * (r > 6 ? 1 + (r - 6) / 6 : 1);   // pic trop petit : intégration bruitée ; pic trop grand : étalon interne noyé
  const gamme = niveaux(pg.vmin, pg.vmax, pg.n).flatMap((v, i) => Array.from({ length: pg.rep }, (_, k) => { const r0 = PENTE_CPG * pip(e, v, `gp${i}_${k}`) * (v > 1000 ? Math.max(0.5, 1 - 0.1 * (v - 1000) / 1000) : 1); return { v, r: arr(r0 * (1 + sig(r0) * gauss(g, `gm${i}_${k}`)), 4) }; }));
  const rg = regression(gamme.map(p => [p.v, p.r])), a = arr(rg.a, 6), b = arr(rg.b, 4);
  const rR = ref.aE / ref.aEI, rE = ech.aE / ech.aEI, bi = e.f.coelIgnore ? 1.3 : 1;   // pics coélués séparés au logiciel : l'éthanol est surestimé
  return { ref, ech, mP, gamme, a, b, r2: arr(rg.r2, 4), rR, rE,
    pctSimple: bi * V_REF * (rE / rR) * RHO_ETOH / (mP * 1000) * 100, pctGamme: bi * ((rE - b) / a) * RHO_ETOH / (mP * 1000) * 100,
    residus: gamme.map(p => arr(p.r - (a * p.v + b), 4)),
    // trois injections successives de la même solution, sans étalon interne (pour montrer que l'aire seule ne suffit pas)
    sansEI: [0, 1, 2].map(i => arr(100 * (1 + 0.14 * gauss(g, `sei${i}`)), 1)) };
}
// Rhéologie : modèle d'Herschel-Bulkley, τ = τ0 + K·γ̇^n (données de scénario inspirées des courbes des élèves)
export const GAMMAS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
export const HB = { tau0: 18, K: 9, n: 0.45 };
export const courbe = q => GAMMAS.map(g => { const s = q * (HB.tau0 + HB.K * Math.pow(g, HB.n)); return { g, s, eta: s / g }; });

// Points de mesure (bruit de 3 % sur la contrainte) : l'élève ne reçoit que des points, pas la courbe du modèle
export const pointsRheo = (e, q, cle) => GAMMAS.map((g, i) => { const s = q * (HB.tau0 + HB.K * Math.pow(g, HB.n)) * (1 + 0.03 * gauss(e.f.graine, `${cle}${i}`)); return { g, s, eta: s / g }; });
export const MODELES_RHEO = [
  { id: 'newton', nom: 'Newtonien', eq: 'σ = η · γ̇' },
  { id: 'ostwald', nom: 'Loi de puissance (Ostwald)', eq: 'σ = K · γ̇ⁿ' },
  { id: 'bingham', nom: 'Bingham', eq: 'σ = τ₀ + ηₚ · γ̇' },
  { id: 'hb', nom: 'Herschel-Bulkley', eq: 'σ = τ₀ + K · γ̇ⁿ' },
];
// Ajustement par moindres carrés sur l'écart relatif (poids 1/σ) ; rms en %
const moco = (A, y) => { const a = A.reduce((s, r) => s + r[0] * r[0], 0), b = A.reduce((s, r) => s + r[0] * r[1], 0), c = A.reduce((s, r) => s + r[1] * r[1], 0), u = A.reduce((s, r, i) => s + r[0] * y[i], 0), v = A.reduce((s, r, i) => s + r[1] * y[i], 0), d = a * c - b * b; return [(u * c - v * b) / d, (a * v - b * u) / d]; };
export function ajusteRheo(pts, id) {
  const rms = f => 100 * Math.sqrt(pts.reduce((s, p) => s + ((p.s - f(p.g)) / p.s) ** 2, 0) / pts.length);
  if (id === 'newton') { const x = pts.map(p => p.g / p.s), eta = x.reduce((s, v) => s + v, 0) / x.reduce((s, v) => s + v * v, 0), f = g => eta * g; return { id, p: { eta }, f, rms: rms(f) }; }
  if (id === 'ostwald') { const n = pts.length, lx = pts.map(p => Math.log(p.g)), ly = pts.map(p => Math.log(p.s)), mx = lx.reduce((s, v) => s + v, 0) / n, my = ly.reduce((s, v) => s + v, 0) / n, ex = lx.reduce((s, v, i) => s + (v - mx) * (ly[i] - my), 0) / lx.reduce((s, v) => s + (v - mx) ** 2, 0), K = Math.exp(my - ex * mx), f = g => K * Math.pow(g, ex); return { id, p: { K, n: ex }, f, rms: rms(f) }; }
  const un = pts.map(p => 1 / p.s), ajuste = ex => { const [t0, K] = moco(pts.map(p => [1 / p.s, Math.pow(p.g, ex) / p.s]), pts.map(() => 1)); const f = g => t0 + K * Math.pow(g, ex); return { t0, K, f, r: rms(f) }; };
  if (id === 'bingham') { const r = ajuste(1); return { id, p: { tau0: r.t0, etap: r.K }, f: r.f, rms: r.r }; }
  let best = null; for (let ex = 0.2; ex <= 1.0001; ex += 0.005) { const r = ajuste(ex); if (!best || r.r < best.r) best = { ...r, ex }; }
  void un; return { id, p: { tau0: best.t0, K: best.K, n: best.ex }, f: best.f, rms: best.r };
}
export function validerRheo(e, retenu, tau0, nTests) {
  const pts = pointsRheo(e, 1, 'rc'), rm = Object.fromEntries(MODELES_RHEO.map(m => [m.id, ajusteRheo(pts, m.id).rms])), meilleur = Math.min(...Object.values(rm));
  const modeleOk = rm[retenu] <= Math.max(meilleur * 1.5, 0.02 * 100), seuilOk = Math.abs(tau0 - HB.tau0) <= 0.25 * HB.tau0, ok = modeleOk && seuilOk;
  const faute = !modeleOk ? 'modele' : !seuilOk ? 'seuil' : null;
  return choisir({ ...e, f: { ...e.f, rheoFaute: faute || undefined, rheoModele: retenu } }, { vers: ok ? 'hub' : 'rheoC_faux', duree: Math.min(20, 8 + 2 * nTests), run: n => marquer(n, 'rheoC'), f: ok ? {} : { errRheo: true }, note: ok ? `Rhéologie du commercial : modèle ${MODELES_RHEO.find(m => m.id === retenu).nom} retenu, seuil τ₀ ≈ ${nf(tau0, 0)} Pa.` : `Rhéologie du commercial : modèle ${MODELES_RHEO.find(m => m.id === retenu).nom} retenu, τ₀ ≈ ${nf(tau0, 0)} Pa (à revoir).` });
}

// ───────────── CPG simplifiée : peut-on séparer éthanol et propan-1-ol en réglant l'appareil ? ─────────────
export const CPG_LIM = { Tinj: [120, 300, 250], Tfour: [40, 150, 70], Tdet: [100, 350, 250], P: [50, 200, 100] };   // min, max, valeur de départ
export function cpgModele({ Tinj, Tfour, Tdet, P }) {
  const T = Tfour + 273.15, u = P / 100, t0 = 0.55 / u, fvd = 0.4 + 0.3 / u + 0.3 * u;
  const kE = 1.47 * Math.exp(4570 * (1 / T - 1 / 343.15)), kP = 1.55 * Math.exp(4650 * (1 / T - 1 / 343.15));
  const nInj = Tinj >= 200 ? 1 : Math.max(0.2, (Tinj - 100) / 100), N = 4000 / fvd * nInj;
  const tE = t0 * (1 + kE), tP = t0 * (1 + kP), wE = 4 * tE / Math.sqrt(N), wP = 4 * tP / Math.sqrt(N), Rs = 2 * (tP - tE) / (wE + wP);
  const bruit = Tdet < 120 ? 0.12 : Tdet < Tfour + 30 ? 0.06 : 0.015;
  return { t0, tE, tP, N, Rs, wE, wP, bruit, horsFenetre: tP > 3, tailing: Tinj < 180, condens: Tdet < 120 };
}
export function cpgSimFin(e, nEssais, concl) { return choisir({ ...e, f: { ...e.f, cpgSimEssais: (e.f.cpgSimEssais || 0) + nEssais } }, { vers: concl ? 'cpg_ei' : 'cpg_ref', duree: 3 * nEssais, note: concl ? `CPG : ${nEssais} réglage(s) essayé(s) (températures, pression) : éthanol et propan-1-ol restent confondus, je change d'étalon interne.` : `CPG : ${nEssais} réglage(s) essayé(s), retour à la référence.` }); }

// ───────────── Moteur ─────────────
export const NB_AVATARS = 6;
export const nettoyerPrenom = x => String(x ?? '').replace(/[<>«»\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 20);
export const pn = e => e?.f?.prenom || '';
export const avatarDe = e => 'moi' + (((e?.f?.avatar ?? 0) % NB_AVATARS + NB_AVATARS) % NB_AVATARS);
export const etatInitial = (graine = (Math.random() * 2147483647) | 0, prenom = '', avatar = 0) => ({ scene: 'intro', t: 0, f: { graine, attente: 0, nbErr: 0, prenom: nettoyerPrenom(prenom), avatar }, carnet: [], essais: 0, fait: {}, bg: {}, hist: [], spans: [] });
const nota = (e, texte) => texte ? { ...e, carnet: [...e.carnet, `${horloge(e.t)} : ${texte}`] } : e;
const marquer = (e, ...cles) => ({ ...e, fait: { ...e.fait, ...Object.fromEntries(cles.map(c => [c, true])) } });
const pauseDej = n => ({ ...n, t: n.t + T_PAUSE, hist: [...(n.hist || []), { t0: n.t, t1: n.t + T_PAUSE, k: 'pause', l: 'Pause déjeuner' }] });
const ATT = { es: ['attente devant l\'étuve', 'l\'étuve'], gel: ['attente devant le ballon', 'le ballon'], clhp: ['attente de la réparation de la CLHP', 'la réparation de la CLHP'] };
const attendre = (e, cle) => { const r = e.bg[cle]; if (r == null || r <= e.t) return e; return nota({ ...e, hist: [...(e.hist || []), { t0: e.t, t1: r, k: 'att', l: ATT[cle][0] }], t: r, f: { ...e.f, attente: e.f.attente + (r - e.t) } }, `J'attends (${ATT[cle][1]}) pendant ${duree(r - e.t)}.`); };

const eqNote = (n, k, id) => ({ ...n, f: { ...n.f, eq: { ...(n.f.eq || {}), [id]: k } } });
export const SCENES = {};
const add = (id, o) => { SCENES[id] = { id, ...o }; };
export const estFin = id => !!SCENES[id]?.fin;

// Écrans de résultats déjà vus (courbes, chromatogrammes, pesées…) : l'élève peut les relire à tout moment, sans rien engager.
export const resultatsVus = e => (e.vus || []).filter(id => SCENES[id]);
// Modes opératoires de dosage : ils n'entrent dans le dossier qu'une fois la technique choisie (écran où ils servent)
const DOCS_MO = ['mo1', 'mo3'];
export const DOCS_BASE = ['notice', 'synthalen', 'cocoate', 'trolamine'];
export const docsDe = e => [...DOCS_BASE, ...(e.docs || [])];
export function aller(e, id) {
  let cible = id;
  if (cible === 'hub' && e.t >= T_MIDI && !e.f.pointD && e.t < T_FIN) cible = 'point_dubreuil';
  if (!SCENES[cible]) throw new Error(`Scène inconnue : ${cible}`);
  if (!SCENES[cible].fin && e.t >= T_FIN) cible = 'fin_temps';
  const mo = (SCENES[cible].fiches || []).filter(d => DOCS_MO.includes(d));
  const n = { ...e, scene: cible, essais: 0, ...(e.f.suspendu && e.f.suspendu === cible ? { f: { ...e.f, suspendu: undefined } } : {}), ...(mo.length ? { docs: [...new Set([...(e.docs || []), ...mo])] } : {}), ...(SCENES[cible].visuels && !SCENES[cible].fin ? { vus: [...new Set([...(e.vus || []), cible])] } : {}) };
  return SCENES[cible].entree ? SCENES[cible].entree(n) : n;
}
const DEBUTS_SURS = new Set(['avant', 'pour', 'comme', 'alors', 'dis', 'voilà', 'plus', 'au', 'un', 'une', 'le', 'la', 'les', 'tu', 'notre', 'bien', 'même', 'sur', 'quand', 'ton', 'ta', 'tes', 'avec', 'après', 'ce', 'cette', 'ça', 'mon', 'il', 'elle', 'on', 'je', 'nous', 'vous', 'si', 'donc', 'mais', 'et', 'ici', 'là', 'ah', 'oui', 'non', 'c', 'l', 'd', 'j', 't', 'n', 's', 'qu', 'comment', 'combien', 'quel', 'quelle', 'est', 'regarde', 'lis', 'pose', 'note', 'tiens', 'écoute', 'attention', 'ok']);
const nommer = (e, sc, t) => {
  const p = pn(e); if (!p || typeof t !== 'string' || sc.pnj === 'moi') return t;
  const toujours = sc.fin || e.scene === 'intro' || e.scene === 'intro2' || e.scene === 'verdict' || e.scene === 'point_dubreuil' || e.scene.startsWith('eq_');
  if (!toujours && hachage(`${e.scene}|${e.f.graine ?? 1}|prenom`) % 100 >= 50) return t;
  const m = t.match(/«\s*([A-Za-zÀ-ÿ]+)/);
  if (!m || m[1][0] !== m[1][0].toUpperCase() || !DEBUTS_SURS.has(m[1].toLowerCase())) return t;
  const i = t.indexOf(m[0]), mot = m[1][0].toLowerCase() + m[1].slice(1);
  return `${t.slice(0, i)}« ${p}, ${mot}${t.slice(i + m[0].length)}`;
};
export const texteDe = (e, sc = SCENES[e.scene]) => nommer(e, sc, typeof sc.texte === 'function' ? sc.texte(e) : sc.texte);
export const choixDe = (e, sc = SCENES[e.scene]) => (typeof sc.choix === 'function' ? sc.choix(e) : sc.choix || []).filter(c => !c.si || c.si(e));
export const visuelsDe = (e, sc = SCENES[e.scene]) => (sc.visuels ? sc.visuels(e) : []) || [];
const DATEES = ['mode', 'bal', 'ei', 'voieCaf', 'methCaf', 'disp', 'decl'];
export function choisir(e, c) {
  const tDec = { ...(e.f.tDec || {}) }; DATEES.forEach(k => { if (c.f && k in c.f) tDec[k] = e.t; });
  let n = { ...e, t: e.t + (c.duree || 0), f: { ...e.f, ...(c.f || {}), tDec, corrige: undefined }, hist: [...(e.hist || []), ...(c.duree ? [{ t0: e.t, t1: e.t + c.duree, k: c.pause || (c.f && c.f.attendu) ? 'att' : 'act', l: c.note || c.t || '' }] : [])] };
  n = nota(n, c.note);
  const avant = n.bg, t0 = n.t;
  if (c.run) n = c.run(n);
  Object.keys(n.bg || {}).forEach(k => { if (n.bg[k] != null && n.bg[k] !== (avant || {})[k]) n = { ...n, spans: [...(n.spans || []), { k, t0, t1: n.bg[k] }] }; });
  const r = aller(n, typeof c.vers === 'function' ? c.vers(n) : c.vers);
  return { ...r, retourHub: e.scene === 'hub' && r.scene !== 'hub' ? { scene: r.scene, t: r.t } : undefined };
}
// Au premier écran d'une tâche prise à la paillasse, rien n'est encore engagé : on peut changer d'avis.
export const peutRevenir = e => !!e.retourHub && e.retourHub.scene === e.scene && e.retourHub.t === e.t && !SCENES[e.scene].entree && !SCENES[e.scene].fin;
export const revenirHub = e => ({ ...e, scene: 'hub', retourHub: undefined, essais: 0 });
// Quitter une analyse en cours pour y revenir plus tard : aucun coût, la tâche « Reprendre » apparaît à la paillasse
const SANS_SUSPENSION = ['hub', 'intro', 'intro2', 'point_dubreuil', 'verdict', 'avis', 'relance', 'formule_ok'];
export const peutSuspendre = e => !SANS_SUSPENSION.includes(e.scene) && !SCENES[e.scene].fin && !SCENES[e.scene].entree;
export const suspendre = e => ({ ...e, scene: 'hub', retourHub: undefined, essais: 0, f: { ...e.f, suspendu: e.scene, suspenduFaits: Object.keys(e.fait).length } });
// Journal des calculs de l'élève : saisies, valeur attendue, énoncé tel qu'il l'a vu (sert à la fiche de correction)
const logCalc = (e, v, juste, vrai, solution = false) => { const calcs = [...(e.f.calcs || [])]; let i = calcs.findIndex(c => c.id === e.scene);
  if (i < 0) { calcs.push({ id: e.scene, donnees: texteDe(e), saisies: [] }); i = calcs.length - 1; }
  calcs[i] = { ...calcs[i], saisies: v == null && solution ? calcs[i].saisies : [...calcs[i].saisies, Number.isFinite(v) ? v : null], vrai, juste: juste ? true : calcs[i].juste === true ? true : false, solution: calcs[i].solution || solution, lot: e.f.lot || 1 };
  return { ...e, f: { ...e.f, calcs } }; };
export function valider(e, saisie, abandon = false) {
  const sc = SCENES[e.scene], k = sc.calcul;
  const v = parseFloat(String(saisie).replace(',', '.').replace(/\s/g, ''));
  const vrai = k.vrai(e), tol = k.tolAbs ?? Math.abs(vrai) * k.tol;
  if (Number.isFinite(v) && Math.abs(v - vrai) <= tol) return { etat: choisir(logCalc(e, v, true, vrai), k.ok), juste: true, message: '' };
  const e2 = logCalc({ ...e, f: { ...e.f, nbErr: e.f.nbErr + 1 } }, abandon ? null : v, false, vrai, abandon), essais = abandon ? 2 : e.essais + 1;
  if (essais >= 2) {
    const st = choisir({ ...e2, t: e2.t + 5 }, k.ko);
    return { etat: { ...st, f: { ...st.f, corrige: `${sc.pnj === 'moi' ? 'Lucas' : PNJ[sc.pnj].nom} passe, refait le calcul avec toi et trouve ${nf(vrai, k.cs ?? 2)} ${k.unite}.`, aides: (st.f.aides || 0) + 1 } }, juste: false, message: '' };
  }
  return { etat: { ...e2, t: e2.t + 5, essais }, juste: false, message: (k.retour && Number.isFinite(v) && k.retour(v, e)) || k.indice };
}
export const ficheCorrection = e => (e.f.calcs || []).map(c => { const sc = SCENES[c.id], k = sc.calcul; return { id: c.id, titre: sc.titre, q: k.q, donnees: c.donnees, saisies: c.saisies, juste: c.juste, solution: !!c.solution, attendu: `${nf(c.vrai, k.cs ?? 2)} ${k.unite}`.trim(),
  demarche: [k.indice, ...(sc.aide ? sc.aide.textes.slice(1).map(f => f(e).replace(/^« | »$/g, '')) : [])] }; });
// Correction de la formule : ta formule, la référence, et le raisonnement qui y conduit
export const ficheFormule = e => { const h = e.f.formuleHist || []; if (!h.length || !e.f.fm) return null; const f = e.f.fm, r = REF_FORMULE;
  return { tentatives: h.length, refus: e.f.fRefus || 0, aide: !!e.f.repli, lignes: [
    ['Caféine', f.caf, r.caf, `5 % (notice) × ${M_LOT} g = ${nf(r.caf, 0)} g`],
    ['Synthalen K', f.carb, r.carb, `La fiche donne 0,1 à 1,5 % ; une valeur moyenne vers ${nf(COM.carb, 2)} % donne un gel à la bonne viscosité : ${nf(r.carb, 1)} g`],
    ['Cocoate de macrogol', f.coc, r.coc, `Extrait sec − caféine − Synthalen K − trolamine ≈ ${nf(COM.coc, 0)} % : ${nf(r.coc, 0)} g`],
    ['Éthanol à 96 %', f.eth96, r.eth96, `${nf(ETH_PUR_COM, 1)} % d'éthanol pur (notice) ÷ 0,96 = ${nf(COM.eth96, 0)} % d'éthanol à 96 % : ${nf(r.eth96, 0)} g`],
    ['Trolamine (estimation)', f.trol, r.trol, `Fiche : 1,5 g par g de polymère pour pH 7 (soit ${nf(1.5 * r.carb, 1)} g ici) ; ajustée au pH-mètre`],
    ['Eau purifiée', f.eau, M_LOT - r.caf - r.carb - r.coc - r.eth96 - r.trol, `Complément pour atteindre ${M_LOT} g`]] }; };
export const cer = (cause, effet, remede) => `Cause : ${cause} Effet : ${effet} Remède : ${remede}`;

// ───────────── La paillasse (hub) ─────────────
export const statutBg = e => ({
  es: e.fait.es && !e.fait.esRes ? (e.bg.es > e.t ? `Étuve en route, prête dans ${duree(e.bg.es - e.t)}` : 'Étuve terminée : les coupelles sont prêtes à peser') : null,
  clhp: e.f.attendu && e.bg.clhp != null && !e.fait.caf ? (e.bg.clhp > e.t ? `CLHP en réparation, prête dans ${duree(e.bg.clhp - e.t)}` : (e.fait.ph ? 'CLHP réparée : elle est prête pour l\'injection' : 'CLHP réparée : tu pourras l\'utiliser quand ton gel sera prêt')) : null,
  gel: e.fait.fab && !e.fait.ph ? (e.bg.gel > e.t ? `Ballon en route, prêt dans ${duree(e.bg.gel - e.t)}` : 'Ballon terminé : le gel est prêt') : null,
});
const defautVu = e => { const F = e.fait, m = mesures(e); return !!((F.rheoF && m.q < SPEC.q) || (F.ethQC && ecartsMes(e).includes('eth')) || (F.caf && ecartsMes(e).includes('caf'))); };
const taches = e => {
  const F = e.fait, L = [];
  const enCours = Object.values(e.bg || {}).some(x => x != null && x > e.t);
  if (e.f.suspendu && SCENES[e.f.suspendu] && e.f.suspenduFaits === Object.keys(F).length) L.push([`Reprendre : ${SCENES[e.f.suspendu].titre}`, 'Tu avais laissé cette étape en cours : tu la reprends là où tu t\'étais arrêté(e).', e.f.suspendu]);
  L.push(['Relire les documents du dossier', 'Notice ANSM et fiches techniques (Synthalen K, trolamine, cocoate de macrogol).', 'docs']);
  if (!F.obs) L.push(['Noter mes observations sur le gel étalé', 'Ce que tu as vu dans la vidéo d\'Inès à ton arrivée ; tu peux la revoir si besoin (5 min).', 'obs_video']);
  if (!F.es) L.push(['Lancer l\'extrait sec du gel commercial', 'Peser, étaler, mettre à l\'étuve : 15 min de travail, puis l\'étuve tourne seule.', e.f.bal ? 'es_prep' : 'es_balance']);
  if (!F.eth) L.push(['Raisonner sur l\'éthanol de la notice', 'Quelle masse d\'éthanol faut-il mettre dans 200 g de gel ?', 'eth1']);
  if (F.es && !F.esLu) L.push(e.f.es3Att ? ['Lire le troisième extrait sec', `Calculer la médiane des trois essais.${e.bg.es > e.t ? ` Attention : étuve en cours, prête dans ${duree(e.bg.es - e.t)}, tu devras attendre.` : ''}`, 'es_calc2b'] : ['Lire l\'extrait sec', `Calculer ES et vérifier la répétabilité.${e.bg.es > e.t ? ` Attention : étuve en cours, prête dans ${duree(e.bg.es - e.t)}, tu devras attendre.` : ''}`, 'es_calc1']);
  if (F.esLu && !F.esRes) L.push(['Estimer le cocoate de macrogol', 'Déduire sa teneur de l\'extrait sec, avec les fiches techniques.', 'es_calc3']);
  if (!F.formule) L.push(['Écrire la formule du contretype', 'Fixer les masses des constituants pour environ 200 g de gel : la formule est à faire valider avant de formuler.', 'formule']);
  if (!F.fab) L.push(['Formuler les 200 g de gel', 'Choisir le procédé, lancer la dispersion du Synthalen K.', (e.f.lot || 1) > 1 ? 'fab_relance' : e.f.eq?.base ? 'fab_choix' : 'eq_base', F.formule ? undefined : { bloque: 'Fais d\'abord valider ta formule au Bureau.' }]);
  if (!F.rheoC) L.push(['Rhéologie du gel commercial', 'Mesurer la courbe d\'écoulement du témoin (10 min).', 'rheoC']);
  if (!e.f.voieCaf && !e.f.rapideCaf) L.push(['Choisir comment contrôler la caféine du gel', 'Quelle technique utiliser pour vérifier les 5 % de caféine ?', 'choix_caf']);
  if (e.f.voieCaf === 'clhp' && !F.hplcPrep) L.push(['Préparer le dosage de la caféine', 'Masse à peser, solution de référence, première injection.', 'hplc_m']);
  if (F.eth && !e.f.voieEth && !e.f.rapideEth) L.push(['Choisir comment contrôler l\'éthanol du gel', 'Quelle technique utiliser pour vérifier l\'éthanol ?', 'choix_eth']);
  if (e.f.voieEth === 'cpg' && !F.cpgPrep) L.push(['Préparer le dosage de l\'éthanol', 'Masse à peser, solution de référence, première injection.', 'cpg_m']);
  if (F.fab && !F.ph) L.push(['Neutraliser et mettre en pot', `Quand le Synthalen K est dispersé : ajouter la trolamine et contrôler le pH.${e.bg.gel > e.t ? ` Attention : dispersion en cours, prête dans ${duree(e.bg.gel - e.t)}, tu devras attendre.` : ''}`, 'fab_disp']);
  if (F.rheoC && !F.rheoF) L.push(['Comparer les rhéologies', 'La viscosité est la seule grandeur impossible à prévoir : mesure-la avant les dosages, et compare au gel commercial. Si elle est mauvaise, tu pourras refaire un gel.', 'rheoF', F.ph ? undefined : { bloque: 'Le gel doit d\'abord être fabriqué et mis en pot.' }]);
  if (F.hplcPrep && !F.caf && !e.f.rapideCaf) L.push(['Doser la caféine du gel formulé', e.f.methCaf === 'ajouts' ? 'Concevoir les fioles, mesurer au spectrophotomètre UV.' : e.f.methCaf === 'ext' ? 'Concevoir la gamme, mesurer au spectrophotomètre UV.' : e.f.methCaf === 'gamme' ? `Concevoir la gamme, injecter en CLHP.${e.bg.clhp > e.t ? ` Attention : ${statutBg(e).clhp.toLowerCase()}, tu devras attendre.` : ''}` : `CLHP, méthode de l'étalon interne.${e.bg.clhp > e.t ? ` Attention : ${statutBg(e).clhp.toLowerCase()}, tu devras attendre.` : ''}`, e.f.methCaf === 'ajouts' ? 'uv_ajouts_plan' : e.f.methCaf === 'ext' ? 'uv_ext_plan' : e.f.methCaf === 'gamme' ? 'hplc_gamme_plan' : 'hplc_ei', F.ph ? undefined : { bloque: 'Le gel doit d\'abord être fabriqué et mis en pot.' }]);
  if (F.cpgPrep && !F.ethQC && !e.f.rapideEth) L.push(['Doser l\'éthanol du gel formulé', 'CPG avec étalon interne : une solution de référence, une solution de gel, le calcul.', 'cpg_inj', F.ph ? undefined : { bloque: 'Le gel doit d\'abord être fabriqué et mis en pot.' }]);
  if (e.f.rapideCaf && !F.caf) L.push(['Relancer le dosage de la caféine', 'Méthode déjà au point : mêmes manipulations, résultat calculé pour toi (environ 40 min).', 'rapide_caf', F.ph ? undefined : { bloque: 'Le gel doit d\'abord être fabriqué et mis en pot.' }]);
  if (e.f.rapideEth && !F.ethQC) L.push(['Relancer le dosage de l\'éthanol', 'Méthode déjà au point : mêmes manipulations, résultat calculé pour toi (environ 40 min).', 'rapide_eth', F.ph ? undefined : { bloque: 'Le gel doit d\'abord être fabriqué et mis en pot.' }]);
  if ((e.f.lot || 1) < 3 && e.f.relanceRefusee !== (e.f.lot || 1) && defautVu(e) && T_FIN - e.t >= 150) L.push(['Refaire un lot en corrigeant le procédé', 'Un défaut est visible dans tes résultats et il reste du temps : tu peux refaire le gel.', 'relance']);
  if (!F.titrCarb) L.push(['Vérifier le Synthalen K du labo : titrer ses acides', 'Le bidon est ouvert depuis longtemps : un titrage par la soude vérifie que la fiche 3V (masse équivalente 76 g/mol) correspond bien à ce lot, et donne la trolamine à prévoir.', 'titr_suivi']);
  if (!F.leurre_titrgel) L.push(['Titrer le gel commercial', 'Titrage d\'une prise de gel par la soude : 30 min.', 'leurre_titrgel']);
  if (!F.leurre_ir) L.push(['Spectre infrarouge du gel (réflexion totale atténuée, ATR)', 'Une goutte de gel sur le cristal : 15 min avec le nettoyage.', 'leurre_ir']);
  if (!F.leurre_refracto) L.push(['Indice de réfraction du gel', 'Une goutte sur le prisme du réfractomètre : 15 min.', 'leurre_refracto']);
  if (!F.leurre_polar) L.push(['Pouvoir rotatoire du gel', 'Remplir la cuve du polarimètre avec une solution de gel : 15 min.', 'leurre_polar']);
  if (!F.leurre_conduc) L.push(['Conductivité du gel', 'Plonger la cellule du conductimètre dans le gel : 15 min.', 'leurre_conduc']);
  L.push(['Demander conseil à un collègue ou à Mme Dubreuil', 'Tu hésites sur la suite, sur où aller ou par quoi commencer ? Demande : quelques minutes.', 'conseil']);
  if (F.caf && F.ethQC && F.rheoF) L.push(['Conclure : le contretype est-il conforme ?', 'Comparer aux exigences et décider.', e.f.eq?.ines ? 'verdict' : 'eq_ines']);
  if (enCours) L.push(['Prendre une pause de 10 minutes', 'Un café, un tour dehors : les appareils continuent de tourner pendant ce temps.', 'hub', { duree: 10, pause: true, note: 'Pause de 10 minutes pendant que les appareils tournent.' }]);
  return L;
};
add('intro', {
  fiches: ['notice'],
  lieu: 'Laboratoire de R&D', pnj: 'dubreuil', titre: 'Contre-typer la Percutaféine',
  texte: () => `« Une cliente veut un gel équivalent à la Percutaféine, un gel à la caféine vendu pour les surcharges adipeuses localisées. Ton travail : retrouver la formule du gel commercial, fabriquer environ 200 g d'un contretype, puis contrôler sa qualité : caféine, éthanol, viscosité. »\n« Tu as la journée, de 8 h à 17 h, avec une heure de pause à midi. L'étuve et le ballon chauffent pendant que tu fais autre chose : organise-toi pour ne pas attendre devant. Les appareils sont fragiles, et une analyse qui ne donne pas ce qu'on attend se discute. »\n« Un point de vigilance : le bidon de Synthalen K du laboratoire est ouvert depuis très longtemps. C'est une poudre hygroscopique, et on n'est plus sûr que la fiche du fabricant corresponde encore à ce lot : à toi de juger ce qu'il faut vérifier avant de neutraliser. »\n« Voici la fiche de formulation du contretype : tous les constituants y sont listés, mais aucune teneur n'est connue. Avant de fabriquer quoi que ce soit, il faut d'abord retrouver ces pourcentages massiques. Garde-la à portée de main : tu la retrouveras dans ton cahier de laboratoire pour y noter les teneurs au fur et à mesure. »\nLe dossier contient aussi la notice (résumé des caractéristiques du produit).`,
  visuels: () => [{ type: 'tableau', titre: 'Fiche de formulation · contretype de la Percutaféine · à compléter', cols: ['Constituant', '% massique'], lignes: [['Caféine', '?'], ['Synthalen K', '?'], ['Cocoate de macrogol 7 glycérol', '?'], ['Éthanol à 96 %', '?'], ['Trolamine', '?'], ['Eau purifiée', '?'], ['Total', '100 %']] }, { type: 'tube' }],
  choix: [{ t: 'Écouter Inès, qui a préparé quelque chose sur ce gel', vers: 'intro2', duree: 0 }],
});
add('intro2', {
  lieu: 'Laboratoire de R&D', pnj: 'ines', titre: 'Un gel étonnant',
  video: { src: 'videos/gel-evaporation.mp4', legende: 'Une noisette de gel du pot commercial, étalée sur une plaque noire. Enregistrement accéléré (×8).' },
  texte: () => '« Regarde ce gel : 5 % de caféine dans un mélange d\'eau et d\'éthanol, alors que la caféine se dissout plutôt mal dans l\'un comme dans l\'autre, et pourtant elle tient dans le pot. La formule est vraiment bien optimisée ! »\n« J\'en ai étalé une noisette sur une plaque noire et je l\'ai filmée en accéléré (×8). Regarde ce qui se passe quand ça sèche : ça peut t\'être utile. »',
  choix: [{ t: 'Aller à la paillasse', vers: 'hub', note: 'Début du travail : contre-typer la Percutaféine.' }],
});
add('docs', {
  fiches: ['notice', 'synthalen', 'cocoate', 'trolamine'],
  lieu: 'Bureau', pnj: 'moi', titre: 'Le dossier du TP',
  texte: () => 'Tu relis la notice du gel commercial et les fiches techniques des matières premières. Tout ce que tu y trouves est utilisable pour retrouver la formule ; ce qui n\'y figure pas, il faudra le déduire de tes mesures.',
  choix: [{ t: 'Retourner à la paillasse', vers: 'hub', duree: 3, note: 'Relecture du dossier (notice et fiches techniques).' }],
});
add('hub', {
  lieu: 'Paillasse', pnj: 'moi', titre: 'À la paillasse',
  texte: e => { const s = statutBg(e); return [`${horloge(e.t)}. Il te reste ${duree(T_FIN - e.t)} de TP.`, e.t < 30 && 'Objectif de la journée : déformuler le gel commercial, fabriquer le contretype, puis le contrôler (caféine, éthanol, viscosité).', s.es && `🔥 ${s.es}.`, s.gel && `⚗️ ${s.gel}.`, s.clhp && `🔧 ${s.clhp}.`, 'Que fais-tu maintenant ?'].filter(Boolean).join('\n'); },
  choix: e => taches(e).map(([t, d, vers, x]) => ({ t, d, vers, ...(x || {}) })),
});


// ───────────── Demander conseil (C.7.3) : à Mme Dubreuil, Inès ou Lucas ; aucun verdict, des pistes graduées selon l'avancement ─────────────
const etapeTP = F => !F.es ? 0 : !F.formule ? 1 : !F.fab ? 2 : !(F.caf && F.ethQC) ? 3 : 4;
const CONSEILS = {
  dubreuil: [[
    '« Le but : contre-typer le gel, puis le contrôler. Commence par ce qui est long et qui tourne tout seul, ça évite de perdre du temps plus tard. »',
    '« Pendant que ça tourne, avance ce qui ne demande pas d\'appareil. De quoi as-tu besoin pour écrire la formule ? »',
    '« Ta formule est prête. Fabriquer le gel prend du temps : lance-le avant de t\'occuper du reste. »',
    '« Pendant que le gel se disperse, prépare le contrôle qualité : on vérifie le gel au regard du cahier des charges du produit. Prévois tes manipulations pour bien occuper les appareils. »',
    '« Il te reste à conclure. Qu\'est-ce qui te manque pour pouvoir dire si le gel est conforme ? »',
  ], [
    '« Je commencerais par l\'extrait sec du gel commercial : l\'étuve demande 1 h et tourne seule. Pendant ce temps, lis le dossier du TP. »',
    '« Il te faut l\'extrait sec et l\'éthanol de la notice pour écrire la formule. Tu peux mesurer la rhéologie du gel commercial en attendant. »',
    '« Le Synthalen K est long à disperser : lance la fabrication, puis occupe-toi de la rhéologie du témoin et du choix des techniques de dosage. »',
    '« Il faut vérifier la caféine, l\'éthanol et la viscosité. Choisis tes techniques, prépare les solutions, puis compare la rhéologie du gel formulé à celle du commercial. »',
    '« Compare chaque résultat à l\'exigence correspondante, puis viens me dire ce que tu écris sur le bon de contrôle. »',
  ]],
  ines: [[
    '« Mes dosages servent à contrôler ton gel une fois fabriqué. Au début, on déformule : plutôt des mesures simples et rapides sur le gel commercial. »',
    '« Les analyses de contrôle, c\'est pour quand le gel sera fabriqué. Pour avancer maintenant, vois plutôt Lucas pour la formule. »',
    '« Pour contrôler, demande-toi ce que tu veux mesurer et si l\'appareil peut le voir : tous ne répondent pas à toutes les questions. »',
    '« Prévois tout ce que tu dois injecter avant de lancer l\'appareil, pour ne pas le monopoliser. Relis les modes opératoires du dossier. »',
    '« Relis tes résultats un par un : sont-ils cohérents avec ce que tu attendais ? Au moindre doute, on en discute. »',
  ], [
    '« Je ne peux pas t\'en dire plus : dans cette phase on déformule, on ne dose pas encore la caféine. Demande à Mme Dubreuil comment t\'organiser. »',
    '« Garde les appareils de dosage de côté pour l\'instant. L\'extrait sec et la notice te donnent déjà beaucoup. »',
    '« Quand tu seras au contrôle de ton gel, relis le mode opératoire de la technique que tu auras choisie : il donne la marche à suivre. »',
    '« Pour chaque méthode, vois si tu as besoin d\'un étalon interne et de combien de fioles : fais un petit plan avant de t\'y mettre. »',
    '« Tu as tous les résultats : compare chacun à l\'exigence de la fiche, puis conclus. »',
  ]],
  lucas: [[
    '« Pour la formule, il faut savoir ce que contient le gel : l\'extrait sec te donne ce qui n\'est pas volatil. Lis la notice et les fiches techniques. »',
    '« Écris ta formule avec ce que tu as mesuré et ce que dit la notice. Si tu hésites, demande-moi, on peut la discuter. »',
    '« Pour la fabrication, lis d\'abord la fiche du Synthalen K : l\'ordre d\'ajout compte. Moi j\'ai mes habitudes, mais vérifie. »',
    '« La rhéologie du gel commercial peut se faire pendant que le ballon tourne. Tu compareras ensuite avec ton gel. »',
    '« Si ton gel diffère du commercial, pense au pH et à la trolamine. »',
  ], [
    '« Je lancerais l\'extrait sec tout de suite, il tourne seul, puis je lirais la fiche du Synthalen K. »',
    '« Il te faut le pourcentage d\'éthanol pur de la notice, converti en éthanol à 96 %, et l\'extrait sec pour estimer le cocoate. »',
    '« Demande-moi ce que tu veux sur le montage : le chauffage, l\'agitation, la sécurité. »',
    '« Mesure la courbe d\'écoulement du gel formulé et compare-la à celle du commercial : une différence de viscosité a une cause. »',
    '« Si les rhéologies diffèrent, regarde le pH final : un Synthalen K mal neutralisé donne un gel trop fluide. »',
  ]],
};
add('conseil', {
  lieu: 'Paillasse', pnj: 'moi', titre: 'Demander conseil',
  texte: () => 'Tu hésites sur la suite. Autour de toi, on peut t\'aider, sans faire le travail à ta place. À qui t\'adresses-tu ?',
  choix: [
    { t: 'À Mme Dubreuil, la responsable du laboratoire', vers: 'conseil_dubreuil', duree: 0 },
    { t: 'À Inès, qui s\'occupe des analyses', vers: 'conseil_ines', duree: 0 },
    { t: 'À Lucas, qui s\'occupe de la formulation et de la rhéologie', vers: 'conseil_lucas', duree: 0 },
    { t: 'Finalement, je me débrouille', vers: 'hub', duree: 0 },
  ],
});
for (const [qui, lieu] of [['dubreuil', 'Bureau de Mme Dubreuil'], ['ines', 'Salle de chromatographie'], ['lucas', 'Paillasse de formulation']]) {
  add('conseil_' + qui, {
    lieu, pnj: qui, titre: 'Un conseil',
    texte: e => CONSEILS[qui][(e.f.conseils || {})[qui] || 0][etapeTP(e.fait)],
    choix: e => [
      { t: '« Merci, je m\'organise comme ça. »', vers: 'hub', duree: 3, run: n => eqNote({ ...n, f: { ...n.f, nbConseils: (n.f.nbConseils || 0) + 1 } }, 'ok', 'conseil'), note: `Conseil demandé à ${PNJ[qui].nom}.` },
      ...(((e.f.conseils || {})[qui] || 0) < 1 ? [{ t: '« Je ne vois pas bien. Peux-tu me préciser ? »', vers: 'conseil_' + qui, duree: 3, run: n => ({ ...n, f: { ...n.f, conseils: { ...(n.f.conseils || {}), [qui]: 1 } } }), note: `Précisions demandées à ${PNJ[qui].nom}.` }] : []),
    ],
  });
}

// ───────────── Appareils du laboratoire qui ne répondent pas à la question ─────────────
const leurre = (id, titre, texte, note, d = 15) => add(id, {
  lieu: 'Laboratoire', pnj: 'moi', titre, texte: () => texte,
  choix: [{ t: 'Retour à la paillasse', duree: d, vers: 'hub', run: n => ({ ...marquer(n, id), f: { ...n.f, leurres: (n.f.leurres || 0) + 1 } }), note }],
});
leurre('leurre_ir', 'Spectre IR du gel', 'Le spectre ATR du gel est enregistré (4 000 à 650 cm⁻¹). Bandes relevées : large entre 3 600 et 3 000 cm⁻¹ ; 2 970 et 2 880 cm⁻¹ ; faibles vers 1 700 et 1 660 cm⁻¹ ; 1 450 cm⁻¹ ; massif intense vers 1 100 et 1 050 cm⁻¹ ; 880 cm⁻¹.', 'Spectre IR (ATR) du gel commercial enregistré.');
leurre('leurre_refracto', 'Indice de réfraction du gel', 'Trois lectures à 20 °C sur le prisme : n = 1,364 ; 1,363 ; 1,364.', 'Indice de réfraction du gel commercial mesuré.');
leurre('leurre_polar', 'Pouvoir rotatoire du gel', 'Solution de 5 g de gel dans 50 mL d\'eau, cuve de 10 cm, lampe au sodium (589 nm). Trois lectures : 0,00° ; 0,01° ; 0,00°.', 'Pouvoir rotatoire du gel commercial mesuré.');
leurre('leurre_titrgel', 'Titrage du gel commercial', 'Tu dissous 5 g de gel dans 50 mL d\'eau et tu ajoutes de la soude à 0,1 mol/L. pH de départ : 6,1. Après 5 mL : 6,8 ; 10 mL : 7,4 ; 15 mL : 8,0 ; 20 mL : 8,5. Chaque lecture met une à deux minutes à se stabiliser, et le milieu devient plus épais au fil des ajouts.', 'Titrage du gel commercial à la soude réalisé (20 mL versés).', 30);
leurre('leurre_conduc', 'Conductivité du gel', 'Cellule plongée dans le gel, mesure à 20 °C. Après 3 minutes de stabilisation : 420 µS/cm.', 'Conductivité du gel commercial mesurée.');

// ───────────── Déformulation ─────────────
add('es_balance', {
  lieu: 'Salle des étuves', pnj: 'moi', titre: 'Quelle balance pour l\'extrait sec ?',
  texte: () => `Tu vas peser une coupelle vide, environ 1 g de gel humide, puis la coupelle avec le résidu sec. Deux balances sont libres : une balance au 0,01 g sur la paillasse (plateau large, rapide), et une balance de précision au 0,1 mg dans la salle voisine (5 minutes aller-retour).`,
  choix: [
    { t: 'La balance au 0,01 g, sur la paillasse', vers: 'es_prep', duree: 0, f: { bal: 'std' }, note: 'Extrait sec : pesées sur la balance au 0,01 g.' },
    { t: 'La balance de précision au 0,1 mg, dans la salle voisine', vers: 'es_prep', duree: 5, f: { bal: 'prec' }, note: 'Extrait sec : pesées sur la balance de précision.' },
  ],
});
add('es_prep', {
  fiches: ['notice'],
  lieu: 'Salle des étuves', pnj: 'moi', titre: 'Extrait sec du gel commercial',
  texte: () => `Seuls l'eau et l'éthanol s'évaporent à 105 °C : ce qui reste dans la coupelle est le résidu de caféine, de Synthalen K, de tensioactif et de trolamine. Le sujet donne un écart-type de répétabilité S_r = 0,5 % pour l'extrait sec.\nCombien de coupelles prépares-tu ?`,
  hyp: "Hypothèse : les constituants non volatils (caféine, Synthalen K, cocoate de macrogol, trolamine) ne se perdent pas à 105 °C ; l'éthanol et l'eau sont évaporés en 1 h.",
  choix: [
    { t: 'Deux coupelles, à l\'étuve à 105 °C pendant 1 h', duree: 15, vers: 'hub', f: { es2: true }, run: n => ({ ...marquer(n, 'es'), bg: { ...n.bg, es: n.t + 60 } }), note: 'Extrait sec lancé en double (105 °C, 1 h).' },
    { t: 'Une seule coupelle, pour gagner du temps', duree: 10, vers: 'hub', f: { es2: false }, run: n => ({ ...marquer(n, 'es'), bg: { ...n.bg, es: n.t + 60 } }), note: 'Extrait sec lancé avec une seule coupelle.' },
  ],
});
add('eth1', {
  fiches: ['notice'],
  lieu: 'Bureau', pnj: 'moi', titre: 'L\'éthanol de la notice',
  texte: () => `La notice indique : « pour 10 g de gel, 4 g d'éthanol à 96 % (en masse) ». Le gel est un mélange à base d'eau et d'éthanol : c'est l'éthanol pur qui compte pour la spécification.`,
  hyp: "Hypothèse : l'éthanol à 96 % contient 96 g d'éthanol pur pour 100 g de solution (le reste est de l'eau).",
  aide: { pnj: 'lucas', textes: [
    () => '« Dans la notice, l\'éthanol est à 96 % : les 4 g indiqués sont-ils de l\'éthanol pur ? »',
    () => '« 4 g de solution à 96 % contiennent 96 % d\'éthanol pur. Quelle masse d\'éthanol pur cela fait-il pour 10 g de gel ? »',
    () => '« m(éthanol pur) = 4 × 0,96 pour 10 g de gel. Divise ensuite par 10 et multiplie par 100 pour avoir un pourcentage. »'] },
  calcul: { q: 'Quel est le pourcentage massique d\'éthanol pur dans le gel ?', unite: '%', vrai: () => ETH_PUR_COM, tol: 0.013, cs: 1, indice: 'Dans 10 g de gel il y a 4 g de solution d\'éthanol à 96 %. Quelle masse d\'éthanol pur cela représente-t-il ? Rapporte-la à 10 g de gel.',
    retour: v => Math.abs(v - 40) < 0.4 ? cer('tu as pris les 4 g de solution comme de l\'éthanol pur.', 'tu obtiens 40 % au lieu de 38,4 %.', 'multiplie par 0,96 : la solution contient 4 % d\'eau.') : null,
    ok: { vers: 'eth2', duree: 5, note: 'Éthanol pur dans le gel : 38,4 %.' }, ko: { vers: 'eth2', duree: 0, f: { errEth: true } } },
});
add('eth2', {
  fiches: ['notice'],
  lieu: 'Bureau', pnj: 'moi', titre: 'Masse d\'éthanol à peser',
  texte: () => `Tu fabriques 200 g de gel. L'éthanol disponible au laboratoire est de l'éthanol à 96 %.\nLa notice annonce aussi 5 % de caféine : c'est une donnée du fabricant, on ne la dose pas à ce stade (le dosage viendra au contrôle qualité).`,
  aide: { pnj: 'lucas', textes: [
    () => '« La notice donne une masse pour 10 g de gel. Ton gel est combien de fois plus lourd ? »',
    () => '« C\'est une proportionnalité : 200 g, c\'est un certain nombre de fois 10 g. La masse d\'éthanol à 96 % est multipliée par ce même nombre. »',
    () => '« m = 4 g × (200 / 10). »'] },
  calcul: { q: 'Quelle masse d\'éthanol à 96 % faut-il peser pour 200 g de gel ?', unite: 'g', vrai: () => M_LOT * 4 / 10, tol: 0.02, cs: 0, indice: 'La notice donne 4 g d\'éthanol à 96 % pour 10 g de gel : cherche la masse pour 200 g.',
    ok: { vers: 'hub', duree: 5, run: n => marquer(n, 'eth'), note: 'Éthanol à 96 % à peser : 80 g pour 200 g de gel.' }, ko: { vers: 'hub', duree: 0, run: n => marquer(n, 'eth'), f: { errEth: true } } },
});
add('es_calc1', {
  lieu: 'Salle des étuves', pnj: 'moi', titre: 'Premier extrait sec',
  entree: e => attendre(e, 'es'),
  texte: e => { const d = donneesEs(e)[0]; return `L'étuve est terminée. Coupelle 1 : coupelle vide m₀ = ${nf(d.m0, BALANCES[e.f.bal || 'prec'].dec)} g ; gel humide déposé m₁ = ${nf(d.m1, BALANCES[e.f.bal || 'prec'].dec)} g ; coupelle + résidu sec m₂ = ${nf(d.m2, BALANCES[e.f.bal || 'prec'].dec)} g.`; },
  visuels: e => { const d = donneesEs(e)[0]; return [{ type: 'balance', nom: d.bal, lectures: [['Coupelle vide m₀', d.m0], ['Gel humide m₁', d.m1], ['Coupelle + résidu m₂', d.m2]], dec: (BALANCES[e.f.bal || 'prec']).dec }]; },
  formule: 'es',
  aide: { pnj: 'lucas', textes: [
    () => '« Que reste-t-il dans la coupelle après l\'étuve, et par rapport à quelle masse veux-tu l\'exprimer ? »',
    () => '« Le résidu sec, c\'est la masse finale moins celle de la coupelle vide. L\'extrait sec le rapporte à la masse de gel humide déposée. »',
    () => '« ES = (m₂ − m₀) / m₁ × 100, avec les trois pesées de la coupelle 1. »'] },
  calcul: { q: 'Calcule l\'extrait sec ES₁ de la coupelle 1 (en % massique).', unite: '%', vrai: e => donneesEs(e)[0].ES, tol: 0.02, cs: 2, indice: 'ES = (m₂ − m₀) / m₁ × 100.',
    retour: (v, e) => { const d = donneesEs(e)[0]; return Math.abs(v - d.m2 / d.m1 * 100) < 1 ? cer('tu as divisé m₂ au lieu de (m₂ − m₀).', 'tu trouves une valeur d\'environ 3 000 %.', 'retire la masse de la coupelle vide avant de diviser.') : null; },
    ok: { vers: e => e.f.es2 ? 'es_calc2' : 'hub', duree: 5, run: n => n.f.es2 ? n : marquer(n, 'esLu') }, ko: { vers: e => e.f.es2 ? 'es_calc2' : 'hub', duree: 0, run: n => n.f.es2 ? n : marquer(n, 'esLu') } },
});
add('es_calc2', {
  lieu: 'Salle des étuves', pnj: 'moi', titre: 'Les deux essais sont-ils compatibles ?',
  texte: e => { const d = donneesEs(e), dc = BALANCES[e.f.bal || 'prec'].dec; return `Coupelle 2 : m₀ = ${nf(d[1].m0, dc)} g ; m₁ = ${nf(d[1].m1, dc)} g ; m₂ = ${nf(d[1].m2, dc)} g, soit ES₂ = ${nf(d[1].ES, 2)} %. Pour la coupelle 1, ES₁ = ${nf(d[0].ES, 2)} %.\nÉcart |ES₁ − ES₂| = ${nf(ecartEs(e), 2)} %. Critère de répétabilité pour deux essais : écart ≤ 2,8 × S_r = 1,4 %.`; },
  hyp: "Hypothèse : les deux essais suivent la même loi normale d'écart-type S_r = 0,5 % ; le critère 2,8·S_r correspond alors à un niveau de confiance de 95 % pour l'écart de deux essais.",
  choix: e => { const compat = ecartEs(e) <= 1.4; return [
    { t: 'Les deux résultats sont compatibles : je retiens la moyenne', vers: 'hub', duree: 5, run: n => marquer(n, 'esLu'), f: compat ? {} : { errEs: true }, note: compat ? `Extrait sec retenu : moyenne de deux essais.` : 'Extrait sec : moyenne retenue malgré un écart trop grand.' },
    ...(e.f.bal === 'std' ? [{ t: 'La balance au 0,01 g est trop peu précise pour un résidu d\'environ 0,1 g : je refais les deux essais sur la balance de précision', vers: 'es_prep', duree: 5, f: { bal: 'prec', es2: undefined, es3: undefined, refaitBal: true }, run: n => ({ ...n, fait: { ...n.fait, es: false, esRes: false, esLu: false }, bg: { ...n.bg, es: undefined } }), note: 'Extrait sec à refaire : balance de précision nécessaire pour un résidu d\'environ 0,1 g.' }] : []),
    { t: 'L\'écart est trop grand : je fais un troisième essai et je retiens la médiane', d: '10 min de travail, puis 1 h d\'étuve sans toi : tu reviens à la paillasse.', duree: 10, vers: 'hub', f: { es3: true, es3Att: true, errEs: compat }, run: n => ({ ...n, bg: { ...n.bg, es: n.t + 60 } }), note: 'Troisième essai d\'extrait sec lancé (médiane) : 1 h d\'étuve.' },
  ]; },
});
add('es_calc2b', {
  lieu: 'Salle des étuves', pnj: 'moi', titre: 'Troisième essai d\'extrait sec',
  entree: e => attendre(e, 'es'),
  texte: e => { const d = donneesEs(e); return `L'étuve est terminée. Les trois essais donnent ES₁ = ${nf(d[0].ES, 2)} %, ES₂ = ${nf(d[1].ES, 2)} % et ES₃ = ${nf(d[2].ES, 2)} %. La médiane est ${nf(esRetenu(e), 2)} %.`; },
  choix: [{ t: 'Retenir la médiane', duree: 3, vers: 'hub', run: n => marquer(n, 'esLu'), note: 'Extrait sec retenu : médiane de trois essais.' }],
});
add('es_calc3', {
  fiches: ['synthalen', 'trolamine', 'cocoate'],
  lieu: 'Bureau', pnj: 'moi', titre: 'Le cocoate de macrogol par différence',
  texte: e => `Extrait sec retenu : ES = ${nf(esRetenu(e), 2)} %. Après l'étuve, il reste dans la coupelle la caféine (5 % d'après la notice), le Synthalen K, la trolamine et le cocoate de macrogol. Pour déduire le cocoate, il te faut estimer le Synthalen K et la trolamine : appuie-toi sur les fiches techniques.`,
  aide: { pnj: 'lucas', textes: [
    () => '« Quels constituants du gel restent dans la coupelle après l\'étuve ? Lesquels connais-tu déjà, lesquels peux-tu estimer avec les fiches ? »',
    () => '« La fiche du Synthalen K donne un taux d\'emploi de 0,1 à 1,5 % : prends une valeur moyenne. La trolamine sert à neutraliser jusqu\'à un pH voisin de 6 : elle représente un peu plus que la masse de Synthalen K. »',
    () => '« Prends Synthalen K ≈ 0,75 % et trolamine ≈ 0,9 %. Alors cocoate = ES − 5 − 0,75 − 0,9. »'] },
  calcul: { q: 'Quel pourcentage massique de cocoate de macrogol déduis-tu ?', unite: '%', vrai: e => esRetenu(e) - 5 - 0.75 - 0.9, tolAbs: 0.7, cs: 1, indice: 'Cocoate = ES − caféine − Synthalen K − trolamine.',
    ok: { vers: 'hub', duree: 5, run: n => marquer(n, 'esRes'), note: 'Cocoate de macrogol estimé par différence.' }, ko: { vers: 'hub', duree: 0, run: n => marquer(n, 'esRes') } },
});

// ───────────── Formulation ─────────────
export const CHAMPS_FORMULE = [['caf', 'Caféine'], ['carb', 'Synthalen K'], ['coc', 'Cocoate de macrogol'], ['eth96', 'Éthanol à 96 %'], ['trol', 'Trolamine (estimation)'], ['eau', 'Eau purifiée']];
export const FORMULE_REPLI = { caf: 10, carb: 1.5, coc: 8, eth96: 80, trol: 1.8, eau: 98.7 };
// Valeurs de référence pour 200 g (gel commercial : caféine 5 %, Synthalen K 0,75 %, cocoate 4 %, éthanol à 96 % pour 40 %, trolamine 0,9 %)
export const REF_FORMULE = { caf: COM.caf * M_LOT / 100, carb: COM.carb * M_LOT / 100, coc: COM.coc * M_LOT / 100, eth96: COM.eth96 * M_LOT / 100, trol: COM.trol * M_LOT / 100 };
const gNum = x => parseFloat(String(x).replace(',', '.')) || 0;
// Mme Dubreuil relit la formule : d'abord ce qui manque (mesures non faites), puis chaque masse par rapport à ce que les mesures et les fiches permettent d'établir
export function relectureFormule(e, fm) {
  const v = Object.fromEntries(Object.keys(FORMULE_REPLI).map(k => [k, gNum(fm[k])])), F = e.fait, manques = [], ecarts = [], tot = Object.values(v).reduce((s, x) => s + x, 0);
  if (!F.es) manques.push('Tu n\'as pas encore lancé l\'extrait sec du gel commercial : sans lui tu ne peux pas connaître la part de cocoate de macrogol. Va le faire d\'abord.');
  else if (!F.esLu) manques.push('L\'extrait sec est lancé, mais tu ne l\'as pas encore lu et calculé : il te faut ce résultat pour le cocoate de macrogol.');
  else if (!F.esRes) manques.push('Tu as l\'extrait sec, mais tu n\'as pas encore estimé la teneur en cocoate de macrogol : fais le calcul avec les fiches techniques.');
  if (!F.eth) manques.push('Tu n\'as pas encore raisonné sur l\'éthanol de la notice : quelle masse d\'éthanol à 96 % faut-il peser pour 200 g de gel ?');
  if (manques.length) return { manques, ecarts: Math.abs(tot - M_LOT) > 6 ? [{ k: 'tot', t: `Le total fait ${nf(tot, 1)} g alors que tu fabriques ${M_LOT} g : complète ou corrige avec l'eau purifiée.` }] : [], v, tot };   // tant que des mesures manquent, on ne juge pas les masses
  const r = REF_FORMULE;
  if (Math.abs(tot - M_LOT) > 6) ecarts.push({ k: 'tot', t: `Le total fait ${nf(tot, 1)} g alors que tu fabriques ${M_LOT} g : complète ou corrige avec l'eau purifiée.` });
  if (v.caf < 9 || v.caf > 11) ecarts.push({ k: 'caf', t: `La notice indique 5 % de caféine : pour ${M_LOT} g de gel, cela fait environ ${nf(r.caf, 0)} g, et tu en as mis ${nf(v.caf, 1)} g.` });
  if (v.eth96 < 74 || v.eth96 > 86) ecarts.push({ k: 'eth96', t: `L'éthanol pur représente environ ${nf(ETH_PUR_COM, 1)} % du gel (notice). Ton éthanol de paillasse est à 96 % : pour ${M_LOT} g il en faut environ ${nf(r.eth96, 0)} g, et tu en as mis ${nf(v.eth96, 1)} g.` });
  if (F.esRes) { const cocES = Math.max(0, 2 * (esRetenu(e) - 5 - 0.75 - 0.9)), prochesES = Math.abs(v.coc - cocES) <= 2.4, prochesRef = v.coc >= 5.8 && v.coc <= 10.2;   // cohérent avec SON extrait sec, ou avec la valeur du gel
    if (!prochesES && !prochesRef) ecarts.push({ k: 'coc', t: `Avec ton extrait sec (ES = ${nf(esRetenu(e), 2)} %), il reste, une fois retirés la caféine (5 %), le Synthalen K et la trolamine, environ ${nf(cocES / 2, 1)} % de cocoate de macrogol, soit à peu près ${nf(cocES, 1)} g pour ${M_LOT} g ; tu en as mis ${nf(v.coc, 1)} g.` }); }
  if (v.carb < 0.8 || v.carb > 2.4) ecarts.push({ k: 'carb', t: `Le Synthalen K ne se déduit pas d'une mesure directe : la fiche donne 0,1 à 1,5 % d'emploi. Une valeur moyenne, vers ${nf(COM.carb, 2)} % (environ ${nf(r.carb, 1)} g pour ${M_LOT} g), donne un gel à la bonne viscosité ; ${nf(v.carb, 2)} g ${v.carb < 0.8 ? 'donnerait un gel trop fluide' : 'donnerait un gel trop épais et inutilement cher'}.` });
  if (v.carb > 0 && (v.trol / v.carb < 0.8 || v.trol / v.carb > 1.9)) ecarts.push({ k: 'trol', t: `D'après la fiche du Synthalen K, il faut environ 1,5 g de trolamine par gramme de polymère pour atteindre pH 7. Pour ${nf(v.carb, 2)} g de Synthalen K, cela fait de l'ordre de ${nf(1.5 * v.carb, 1)} g ; tu en as prévu ${nf(v.trol, 1)} g (c'est une estimation, ajustée ensuite au pH-mètre).` });
  return { manques, ecarts, v, tot };
}
export function controlesFormule(e, fm) { const r = relectureFormule(e, fm); return [...r.manques, ...r.ecarts.map(x => x.t)].map(t => ({ ok: false, t })); }
// Mme Dubreuil ne laisse partir en fabrication qu'une formule cohérente avec les mesures et les fiches, à quelques incertitudes près.
export function validerFormule(e, fm, repli = false) {
  const val = repli ? FORMULE_REPLI : Object.fromEntries(Object.entries(fm).map(([k, x]) => [k, gNum(x)]));
  const rp = repli || (niveauAide(e) === 3 && Object.keys(FORMULE_REPLI).every(k => val[k] === FORMULE_REPLI[k]));
  const rel = rp ? { manques: [], ecarts: [], tot: M_LOT } : relectureFormule(e, val);
  const n = { ...e, t: e.t + 2, f: { ...e.f, fTent: (e.f.fTent || 0) + 1, fmBrouillon: Object.fromEntries(Object.keys(FORMULE_REPLI).map(k => [k, String(fm?.[k] ?? val[k] ?? '')])) } };
  const hist = [...(n.f.formuleHist || []), { fm: val, manques: rel.manques.length, ecarts: rel.ecarts.map(x => x.k) }];
  if (rel.manques.length || rel.ecarts.length) {
    const msg = [...rel.manques, ...rel.ecarts.map(x => x.t)];
    return { ok: false, lignes: msg.map(t => ({ ok: false, t })), etat: { ...n, f: { ...n.f, formuleHist: hist, formuleMsg: msg, formuleOk: undefined, fRefus: (n.f.fRefus || 0) + 1 } } };
  }
  const nbEcarts = rp ? 0 : Math.abs(val.caf - REF_FORMULE.caf) > 0.5 || Math.abs(val.eth96 - REF_FORMULE.eth96) > 3 || Math.abs(val.coc - REF_FORMULE.coc) > 1 ? 1 : 0;
  const msgOk = rp ? ['La formule de départ est validée avec l\'aide d\'un collègue.'] : [nbEcarts ? 'Tes masses sont proches de ce que les mesures et les fiches permettent d\'établir, avec les incertitudes habituelles.' : 'Tes masses sont cohérentes avec tes mesures et les fiches.'];
  return { ok: true, lignes: [], etat: choisir({ ...n, f: { ...n.f, fm: val, repli: rp || undefined, formuleHist: hist, formuleMsg: undefined, formuleOk: msgOk } }, { vers: 'formule_ok', run: x => marquer(x, 'formule'), note: rp ? 'Formule proposée par Lucas utilisée.' : `Formule validée par Mme Dubreuil (éthanol à 96 % : ${nf(val.eth96, 1)} g, cocoate : ${nf(val.coc, 1)} g, Synthalen K : ${nf(val.carb, 2)} g).` }) };
}
add('formule_ok', {
  lieu: 'Bureau', pnj: 'dubreuil', titre: 'Formule validée',
  texte: e => `Mme Dubreuil relit ta formule : « ${(e.f.formuleOk || ['C\'est validé.']).join(' ')} Tu peux passer à la paillasse de formulation et lancer la fabrication des ${M_LOT} g. Le reste dépendra de la qualité de ta fabrication et du contrôle. »`,
  choix: [{ t: 'Retourner à la paillasse', vers: 'hub', duree: 0 }],
});
add('formule', {
  fiches: ['notice', 'synthalen', 'cocoate', 'trolamine'],
  lieu: 'Bureau', pnj: 'dubreuil', station: 'formule', titre: 'La formule du contretype',
  texte: e => `« Écris les masses pour environ ${M_LOT} g. Je relirai ta formule avant que tu ne fabriques : elle doit être cohérente avec tes mesures et les fiches, à quelques incertitudes près. » Rappels : ${e.fait.esLu ? `ES mesuré ${nf(esRetenu(e), 2)} %, ` : ''}éthanol à 96 % pour ${nf(ETH_PUR_COM, 1)} % d'éthanol pur.`,
  aide: { pnj: 'lucas', textes: [
    () => '« Pars de tes résultats, pas de la notice seule : pour 200 g de gel, la masse d\'un composant est son pourcentage mesuré multiplié par 2. Occupe-toi d\'abord de la caféine et de l\'éthanol, puis du Synthalen K et du cocoate. »',
    () => '« L\'éthanol de la paillasse est à 96 % : pour une teneur en éthanol pur donnée, il faut peser un peu plus d\'éthanol à 96 %. Ton extrait sec compte la caféine, le Synthalen K, le cocoate et la trolamine ensemble. Complète avec l\'eau pour atteindre 200 g au total. »',
    () => '« Je ferais : caféine 10 g, Synthalen K 1,5 g, cocoate 8 g, éthanol à 96 % 80 g, trolamine 1,8 g et eau 98,7 g. Compare avec tes résultats avant de valider. »'],
    valeurs: () => FORMULE_REPLI },
  hyp: "Hypothèse : le volume de gel est la somme des masses (pas de contraction de volume à l'échelle de ce contrôle) ; la trolamine finale est ajustée au pH, la valeur saisie n'est qu'une estimation.",
  choix: [],
});


// ───────────── Échanges avec les collègues (C.7.3) ─────────────
// Chaque échange note l'attitude de l'élève (ok : respectueux et argumenté ; moyen : passif ; ko : sec ou fermé) ; les conséquences sont réelles plus loin.
add('eq_base', {
  fiches: ['synthalen'],
  lieu: 'Paillasse de formulation', pnj: 'lucas', titre: 'Le conseil de Lucas',
  texte: () => `Lucas, qui a l'habitude du labo : « Moi je mets tout d'un coup, base comprise, ça fait gagner 20 minutes. J'ai toujours fait comme ça. »`,
  choix: [
    { t: '« D\'accord, je fais comme toi. »', tag: 'moyen', vers: 'fab_grumeaux', duree: 5, f: { mode: 'base', perteEth: 0.01 }, run: n => eqNote(n, 'moyen', 'base'), note: 'Conseil de Lucas suivi sans discussion : tout mélangé, base comprise.' },
    { t: '« Merci, mais le Synthalen K doit être dispersé avant d\'être neutralisé, sinon il fait des grumeaux. Je préfère ajouter la base à la fin. »', tag: 'ok', vers: 'fab_choix', duree: 2, run: n => eqNote(n, 'ok', 'base'), note: 'Conseil de Lucas discuté poliment, procédé choisi par moi.' },
    { t: '« Arrête, tu ne sais pas de quoi tu parles. »', tag: 'ko', vers: 'fab_choix', duree: 5, run: n => eqNote(n, 'ko', 'base'), note: 'Lucas rembarré sèchement.' },
  ],
});
add('eq_ext', {
  lieu: 'Salle de chromatographie', pnj: 'lucas', titre: 'Lucas passe à la paillasse',
  texte: () => `Lucas s'arrête devant la CLHP et jette un œil à tes relevés : « Tu devrais faire une gamme en UV, étalonnage externe : c'est ce qu'on a toujours fait, c'est rapide et ça marche très bien. »`,
  choix: [
    { t: '« Merci du conseil. Je regarde ce que ça donne, et je vérifierai le résultat avec une autre méthode ou avec le gel commercial avant de le retenir. »', tag: 'ok', vers: 'hplc_panne', duree: 2, run: n => eqNote(n, 'ok', 'ext'), note: 'Conseil de Lucas (UV externe) écouté, vérification prévue.' },
    { t: '« Oui, bonne idée, j\'y vais. »', tag: 'moyen', vers: 'hplc_panne', duree: 1, run: n => eqNote(n, 'moyen', 'ext'), note: 'Conseil de Lucas (UV externe) accepté sans discussion.' },
    { t: '« Je n\'ai pas besoin de ton avis. »', tag: 'ko', vers: 'hplc_panne', duree: 3, run: n => eqNote(n, 'ko', 'ext'), note: 'Lucas envoyé balader.' },
  ],
});
add('eq_ines', {
  lieu: 'Bureau', pnj: 'ines', titre: 'Inès relit tes résultats',
  texte: e => { const D = defauts(e), m = mesures(e); return D.includes('eth') ? `Inès regarde ton cahier : « Ton éthanol est à ${nf(m.eth, 1)} % ; la notice en annonce 38,4 %. Tu veux qu'on regarde ça ensemble avant que tu rendes ton bon ? »` : `Inès regarde ton cahier : « Tes résultats me paraissent cohérents entre eux. Tu veux que je relise un calcul avant que tu rendes ton bon ? »`; },
  choix: [
    { t: '« Oui, volontiers : montre-moi ce qui te gêne, on regarde ça ensemble. »', tag: 'ok', vers: 'avis', duree: 5, run: n => eqNote(n, 'ok', 'ines'), note: 'Relecture avec Inès acceptée.' },
    { t: '« Ça va, je gère. »', tag: 'moyen', vers: 'verdict', duree: 0, run: n => eqNote(n, 'moyen', 'ines'), note: 'Aide d\'Inès déclinée sans explication.' },
    { t: '« Tu n\'as pas à relire mon travail. »', tag: 'ko', vers: 'verdict', duree: 2, run: n => eqNote(n, 'ko', 'ines'), note: 'Inès envoyée balader.' },
  ],
});


// ───────────── Observation filmée de l'évaporation (début de parcours, facultative) ─────────────
export const observationsDe = e => [...OBSERVATIONS].sort((a, b) => unif(e.f.graine, 'obs' + a[0]) - unif(e.f.graine, 'obs' + b[0]));   // ordre mélangé, stable pour une partie
export const OBSERVATIONS = [
  ['blanc', 'Le gel, d\'abord transparent, devient blanc et opaque'],
  ['cristaux', 'Des filaments de cristaux apparaissent'],
  ['fins', 'Le blanchiment commence par les parties les plus fines'],
  ['fluide', 'Le gel devient plus fluide'],
  ['bout', 'Le gel se met à bouillir'],
  ['stable', 'Le gel ne change pas'],
];
// Conseils graduels d'un collègue sur une station de conception : 1 = une question qui oriente, 2 = la démarche chiffrée, 3 = « voilà ce que je ferais ».
export const niveauAide = e => (e.f.aidePlan || {})[e.scene] || 0;
export function demanderAide(e) {
  const sc = SCENES[e.scene], k = niveauAide(e);
  if (!sc.aide || k >= 3) return e;
  const cout = k === 2 ? 5 : 3, nom = PNJ[sc.aide.pnj].nom;
  const n = { ...e, t: e.t + cout, f: { ...e.f, aidePlan: { ...(e.f.aidePlan || {}), [e.scene]: k + 1 }, aidesPlan: (e.f.aidesPlan || 0) + 1 }, hist: [...(e.hist || []), { t0: e.t, t1: e.t + cout, k: 'act', l: `Conseil de ${nom} : ${sc.titre}` }] };
  return nota(n, `Conseil de ${nom} sur : ${sc.titre.charAt(0).toLowerCase() + sc.titre.slice(1)}.`);
}
// ───────────── Schémas cliquables : où injecte-t-on ? (reconnaître les éléments d'un chromatographe) ─────────────
export const PIECES_SCHEMA = {
  clhp: { eluant: ['les réservoirs d\'éluant', 'ils alimentent la pompe en éluant'], pompe: ['la pompe', 'elle impose le débit d\'éluant'], manometre: ['le manomètre', 'il mesure la pression en sortie de pompe'], injecteur: ['l\'injecteur', ''], colonne: ['la colonne, dans son four', 'les composés s\'y séparent'], detecteur: ['le détecteur UV', 'il mesure l\'absorbance à la sortie de la colonne'] },
  cpg: { gaz: ['la bouteille de gaz vecteur', 'le gaz entraîne les composés vaporisés'], manometre: ['le manomètre', 'il indique la pression du gaz en tête de colonne'], injecteur: ['l\'injecteur', ''], four: ['le four et la colonne', 'les composés s\'y séparent'], fid: ['le détecteur FID', 'il détecte les composés à la sortie de la colonne'] },
};
const INDICE_SCHEMA = { clhp: 'on injecte dans le flux d\'éluant, juste avant la colonne : cherche la vanne à boucle', cpg: 'l\'échantillon est injecté dans la chambre chauffée où il se vaporise, avant la colonne : cherche le septum' };
export function cliquerPiece(e, id) {
  const sc = SCENES[e.scene], k = (e.f.clicInj || {})[e.scene] || 0;
  if (id === sc.cible) return { ok: true, indice: null, message: '', etat: choisir(e, sc.choix[0]) };
  const [nom, role] = PIECES_SCHEMA[sc.schema][id], n = { ...e, t: e.t + 2, f: { ...e.f, clicInj: { ...(e.f.clicInj || {}), [e.scene]: k + 1 }, errInj: (e.f.errInj || 0) + 1 } };
  const aide = k + 1 >= 2;
  return { ok: false, indice: aide ? sc.cible : null, message: `Ce n'est pas là : c'est ${nom} (${role}). ${aide ? `Inès : « ${INDICE_SCHEMA[sc.schema].charAt(0).toUpperCase()}${INDICE_SCHEMA[sc.schema].slice(1)}. »` : 'Essaie encore.'}`, etat: nota(n, `Clic sur ${nom} au lieu de l'injecteur.`) };
}
export const textesAide = e => { const sc = SCENES[e.scene]; return sc.aide ? sc.aide.textes.slice(0, niveauAide(e)).map(f => f(e)) : []; };
export function validerPlan(e, vals) {
  const P = SCENES[e.scene].plan, v = {};
  for (const c of P.champs) {
    const x = nombre(vals[c.id]);
    if (x === null) return { ok: false, message: `Renseigne : ${c.l.charAt(0).toLowerCase() + c.l.slice(1)}.` };
    if (x < c.min || x > c.max) return { ok: false, message: `${c.l} : entre ${nf(c.min, c.min < 1 ? 2 : 0)} et ${nf(c.max, c.max < 10 ? 1 : 0)} ${c.u}`.trim() + ' avec le matériel disponible.' };
    v[c.id] = c.entier ? Math.round(x) : x;
  }
  const msg = P.controle && P.controle(v);
  if (msg) return { ok: false, message: msg };
  const n = { ...e, f: { ...e.f, plans: { ...(e.f.plans || {}), [e.scene]: v } } };
  return { ok: true, etat: choisir(n, { vers: P.vers, duree: P.duree(v), note: P.note(v) }) };
}
export function noterObs(e, ids) {
  const noms = OBSERVATIONS.filter(([id]) => ids.includes(id)).map(([, t]) => t.charAt(0).toLowerCase() + t.slice(1));
  const n = { ...e, t: e.t + 5, f: { ...e.f, obs: ids } };
  return choisir(n, { vers: 'hub', run: x => marquer(x, 'obs'), note: noms.length ? `Vidéo d'une noisette de gel étalée (×8) : j'ai noté — ${noms.join(' ; ')}.` : 'Vidéo d\'une noisette de gel étalée (×8) : rien noté.' });
}
add('obs_video', {
  lieu: 'Bureau', pnj: 'ines', station: 'obs', titre: 'Ce que montre le gel étalé',
  video: { src: 'videos/gel-evaporation.mp4', legende: 'Une noisette de gel du pot commercial, étalée sur une plaque noire. Enregistrement accéléré (×8).' },
  texte: () => `Tu as vu la vidéo d'Inès à ton arrivée : une noisette de gel du pot sur une plaque noire, filmée en accéléré (×8). Tu peux la revoir ci-dessous si tu as un doute.\nNote dans ton cahier ce que tu as observé.`,
  choix: [],
});

// ───────────── Avis d'un collègue et remédiation (si l'élève a accepté la relecture) ─────────────
// Écarts visibles dans les résultats AFFICHÉS à l'élève (≠ vérité cachée) : c'est sur eux que les collègues et le bon de contrôle réagissent.
export const ecartsMes = e => { const m = mesures(e), L = [];
  if (m.caf < SPEC.caf[0] || m.caf > SPEC.caf[1]) L.push('caf');
  if (m.eth < SPEC.eth[0] || m.eth > SPEC.eth[1]) L.push('eth');
  if (m.q < SPEC.q) L.push('visco');
  return L; };
const NOM_CRIT = { caf: 'caféine', eth: 'éthanol', visco: 'viscosité' };
export const causeMesure = e => {
  const f = e.f, E = ecartsMes(e).filter(d => !defauts(e).includes(d));
  if (E.includes('eth') && f.errCoel) return 'ton dosage de l\'éthanol à la CPG est faussé : le pic de l\'étalon interne se confondait avec celui de l\'éthanol (coélution) et tu avais exploité les aires telles quelles';
  if (E.includes('eth') && f.errComp) return 'tu as moyenné deux méthodes d\'éthanol qui ne s\'accordaient pas, sans chercher pourquoi';
  if (E.includes('caf') && f.extAccepte) return 'ton dosage UV par étalonnage externe surestimait la caféine (effet de matrice des excipients) et tu avais retenu ce résultat sans témoin';
  if (E.length) return `ta mesure de ${E.map(d => NOM_CRIT[d]).join(' et de ')} était biaisée`;
  return null; };
const causeReelle = e => { const g = gelVrai(e), D = defauts(e);
  return D.map(d => d === 'caf' ? (g.caf < SPEC.caf[0] ? 'il manque de la caféine dans la formule' : 'il y a trop de caféine dans la formule') : d === 'eth' ? 'l\'éthanol s\'est échappé ou a été sous-dosé' : (e.f.disp === 'grumeaux' ? 'des grumeaux ne se redissolvent pas' : g.ph < 6 ? 'le gel est mal neutralisé' : 'il manque du Synthalen K dans la formule')).join(' ; '); };
add('avis', {
  lieu: 'Bureau', pnj: 'ines', titre: 'Ce que voit Inès',
  texte: e => {
    const D = defauts(e), m = mesures(e), vu = (e.f.obs || []).some(x => x === 'blanc' || x === 'cristaux');
    if (D.includes('eth')) return `Inès relit tes résultats : « L'éthanol est à ${nf(m.eth, 1)} % au lieu de ${nf(ETH_PUR_COM, 1)} %. ${vu ? 'Tu te souviens de la vidéo : ça part très vite. ' : ''}${(e.f.perteEth || 0) > 0.06 ? 'Qu\'est-ce que tu as fait comme chauffage, et avec quel montage ?' : 'Le montage n\'a pas chauffé beaucoup : vérifie plutôt la masse d\'éthanol que tu as mise dans ta formule.'} On peut compenser : ajouter de l'éthanol à 96 % dans le gel, mais il faut calculer la masse puis refaire le dosage CPG. »`;
    if (D.includes('visco') && gelVrai(e).ph < 6) return `Inès relit tes résultats : « Ton gel est trop fluide, sa viscosité est trop faible : rapport des contraintes ${nf(m.q, 2)}. As-tu regardé le pH final ? Si le Synthalen K n'est pas assez neutralisé, on peut reprendre avec de la trolamine (15 min), puis refaire la rhéologie. »`;
    if (D.length) return `Inès relit tes résultats : « Je vois un écart, mais il ne se rattrape pas dans le temps qui reste : ${causeReelle(e)}. Écris-le tel quel sur le bon, et on refera un lot. »`;
    const EM = ecartsMes(e);
    if (EM.length) return `Inès relit tes résultats : « ${EM.map(d => d === 'caf' ? `caféine ${nf(m.caf, 1)} %` : d === 'eth' ? `éthanol ${nf(m.eth, 1)} %` : `viscosité ${nf(m.q, 2)}`).join(', ')} : ${EM.length > 1 ? 'ça sort' : 'ça sort'} de la fiche de spécification. Avant de conclure, regarde si ta méthode est fiable : un résultat aberrant n'est pas forcément un gel raté. »`;
    return `Inès relit tes résultats : « Tout me paraît cohérent : caféine, éthanol et viscosité dans les plages. Je ne vois rien à redire. »`;
  },
  choix: e => {
    const D = defauts(e);
    if (D.includes('eth')) return [
      { t: 'Compenser : calculer la masse d\'éthanol à ajouter', vers: 'reprise_eth', duree: 5, note: 'Décision de compenser l\'éthanol manquant avec Inès.' },
      { t: 'Laisser le gel tel quel et conclure', vers: 'verdict', duree: 0, note: 'Gel laissé tel quel malgré l\'éthanol bas.' }];
    if (D.includes('visco') && gelVrai(e).ph < 6) return [
      { t: 'Reprendre le pH avec Lucas', vers: 'ph2', duree: 5, note: 'Reprise du pH décidée avec Inès.' },
      { t: 'Laisser le gel tel quel et conclure', vers: 'verdict', duree: 0, note: 'Gel laissé tel quel malgré la viscosité basse.' }];
    return [{ t: 'Passer au bon de contrôle', vers: 'verdict', duree: 0 }];
  },
});
const DELTA_ETH = e => (ETH_PUR_COM / 100 * M_LOT - mesures(e).eth / 100 * M_LOT) / (0.96 - ETH_PUR_COM / 100);
add('reprise_eth', {
  lieu: 'Paillasse de formulation', pnj: 'ines', titre: 'Compenser l\'éthanol manquant',
  texte: e => `Gel : environ ${M_LOT} g ; éthanol mesuré : ${nf(mesures(e).eth, 1)} % ; objectif : ${nf(ETH_PUR_COM, 1)} %. L'éthanol disponible est à 96 % (en masse). On suppose que l'éthanol ajouté se mélange sans autre perte.`,
  hyp: 'Hypothèse : le gel pèse environ 200 g ; la teneur finale visée est celle du gel commercial ; le mélange est homogène.',
  aide: { pnj: 'ines', textes: [
    () => '« Que veux-tu retrouver dans le gel après l\'ajout ? Quelle teneur en éthanol pur vises-tu ? »',
    () => '« Bilan sur l\'éthanol pur : ce qu\'il y a déjà, plus 96 % de la masse que tu ajoutes, le tout rapporté à la masse totale du gel. »',
    () => '« (masse présente + 0,96 × x) / (200 + x) = teneur visée. Résous pour x. »'] },
  calcul: { q: 'Quelle masse d\'éthanol à 96 % faut-il ajouter ?', unite: 'g', vrai: DELTA_ETH, tol: 0.2, cs: 0, indice: 'Bilan sur l\'éthanol pur : (masse présente + 0,96 × masse ajoutée) / (200 + masse ajoutée) = teneur visée.',
    ok: { vers: 'hub', duree: 10, run: n => ({ ...n, fait: { ...n.fait, ethQC: false }, f: { ...n.f, ethAjout: arr(DELTA_ETH(n), 1) } }), f: { compense: true }, note: 'Éthanol compensé par ajout d\'éthanol à 96 % ; dosage CPG à refaire.' },
    ko: { vers: 'hub', duree: 10, run: n => ({ ...n, fait: { ...n.fait, ethQC: false }, f: { ...n.f, ethAjout: arr(DELTA_ETH(n), 1) } }), f: { compense: true }, note: 'Éthanol compensé avec l\'aide d\'un collègue ; dosage CPG à refaire.' } },
});

const appareilsVus = F => { const l = [F.leurre_ir && 'la spectrométrie IR', F.leurre_refracto && 'le réfractomètre', F.leurre_polar && 'le polarimètre', F.leurre_conduc && 'le conductimètre', F.leurre_titrgel && 'le titrage du gel'].filter(Boolean); return l.length ? `\nMme Dubreuil : « Je vois que tu es passé par ${l.join(', ')}. Qu'est-ce que cela t'a apporté pour ton contretype ? »` : ''; };
const resteFait = e => { const F = e.fait,
  fait = [F.esRes && 'l\'extrait sec', F.formule && 'la formule', F.fab && 'le lancement du gel', F.rheoC && 'la rhéologie du témoin', (F.caf || F.hplcPrep) && 'la préparation de la caféine', F.ethQC && 'l\'éthanol'].filter(Boolean),
  reste = [!F.formule && 'la formule', !F.ph && 'la mise en pot du gel', !F.rheoF && 'la rhéologie du gel formulé', !F.caf && 'le dosage de la caféine', !F.ethQC && 'le dosage de l\'éthanol', 'la conclusion'].filter(Boolean);
  return { fait: fait.length ? fait.join(', ') : 'peu de choses', reste: reste.join(', '), heure: horloge(Math.min(T_FIN - 20, e.t + T_PAUSE + 40 * reste.length)) }; };
add('point_dubreuil', {
  lieu: 'Paillasse', pnj: 'dubreuil', titre: 'Mme Dubreuil passe à la paillasse',
  entree: e => ({ ...e, f: { ...e.f, pointD: true } }),
  texte: e => { const F = e.fait, fait = [F.esRes && 'l\'extrait sec', F.formule && 'la formule', F.ph && 'le gel formulé', F.rheoC && 'la rhéologie du témoin', (F.caf || F.hplcPrep) && 'la caféine (en cours)', F.ethQC && 'l\'éthanol'].filter(Boolean); return `Mme Dubreuil : « Il est ${horloge(e.t)}, c'est bientôt la pause déjeuner. Où en es-tu ? »\nTu as fait : ${fait.length ? fait.join(', ') : 'peu de choses pour l\'instant'}.${appareilsVus(F)}`; },
  choix: e => [
    { t: `« J'ai fait ${resteFait(e).fait}. Il me reste ${resteFait(e).reste}, et je pense finir vers ${resteFait(e).heure}. J'ai besoin d'un avis sur un point. »`, tag: 'ok', vers: 'hub', duree: 3, run: n => pauseDej(eqNote(n, 'ok', 'dub')), note: 'Point d\'étape précis avec Mme Dubreuil.' },
    { t: '« Ça va, tout est sous contrôle. »', tag: 'moyen', vers: 'hub', duree: 1, run: n => pauseDej(eqNote(n, 'moyen', 'dub')), note: 'Point d\'étape vague avec Mme Dubreuil.' },
    { t: '« Laissez-moi travailler, je n\'ai pas le temps. »', tag: 'ko', vers: 'hub', duree: 2, run: n => pauseDej(eqNote(n, 'ko', 'dub')), note: 'Mme Dubreuil écartée sèchement.' },
  ],
});

// ───────────── Fabrication ─────────────
add('fab_choix', {
  fiches: ['synthalen'],
  lieu: 'Paillasse de formulation', pnj: 'moi', titre: 'Comment fabriques-tu le gel ?',
  texte: () => `Dans ton expérience du TP, le Synthalen K est long à se disperser (de 30 min à 1 h 30 à froid) ; un léger chauffage accélère la dispersion. Une fois dispersé, c'est la base (la trolamine) qui fait épaissir le milieu.\nComment procèdes-tu ?`,
  hyp: 'Hypothèse : le Synthalen K gonfle et épaissit quand il est neutralisé ; mal dispersé, il forme des grumeaux qui ne se redissolvent pas bien.',
  choix: e => melange(e, 'fabp', [
    { id: 'reflux', t: 'Ballon à reflux sous agitation, chauffage modéré, base ajoutée à la fin', d: '15 min de travail, puis environ 1 h de dispersion.', duree: 15, vers: 'secu', f: { mode: 'reflux', perteEth: 0.01 }, run: n => ({ ...marquer(n, 'fab'), bg: { ...n.bg, gel: n.t + 60 } }), note: 'Fabrication : ballon à reflux, chauffage modéré, agitation, base en dernier.' },
    { id: 'becher', t: 'Bécher sur plaque chauffante sous agitation, base ajoutée à la fin', d: '10 min de travail, puis environ 45 min de dispersion.', duree: 10, vers: 'secu', f: { mode: 'becher', perteEth: 0.18 }, run: n => ({ ...marquer(n, 'fab'), bg: { ...n.bg, gel: n.t + 45 } }), note: 'Fabrication : bécher sur plaque chauffante, agitation, base en dernier.' },
    { id: 'froid', t: 'Bécher à température ambiante sous agitation, base ajoutée à la fin', d: '10 min de travail, puis environ 1 h 30 de dispersion.', duree: 10, vers: 'secu', f: { mode: 'froid', perteEth: 0.04 }, run: n => ({ ...marquer(n, 'fab'), bg: { ...n.bg, gel: n.t + 90 } }), note: 'Fabrication : bécher à froid, agitation, base en dernier.' },
    { id: 'base', t: 'Tout mélanger d\'un coup, base comprise, pour gagner du temps', d: '10 min de travail.', duree: 10, vers: 'fab_grumeaux', f: { mode: 'base', perteEth: 0.01 }, note: 'Fabrication : tous les constituants, base comprise, dès le départ.' },
  ]),
});
const tourne = (e, cle, k) => { const L = [...k]; const r = Math.floor(unif(e.f.graine, cle) * L.length); return [...L.slice(r), ...L.slice(0, r)]; };
add('fab_relance', {
  lieu: 'Paillasse de formulation', pnj: 'lucas', titre: 'Un deuxième gel, plus vite',
  texte: () => `Lucas passe près de ta paillasse : « Puisque tu dois recommencer le gel, autant gagner du temps. Prends le ballon à reflux et chauffe dès le départ : l'eau chaude, le matériel déjà prêt et une formule déjà calculée, tu en as pour environ 35 minutes de dispersion au lieu d'une heure. Et monte le montage sous la hotte comme la première fois. »`,
  choix: [
    { t: 'Suivre le conseil : ballon à reflux, chauffage dès le départ', d: '10 min de travail, puis environ 35 min de dispersion.', duree: 10, vers: 'secu', f: { mode: 'reflux', perteEth: 0.01 }, run: n => ({ ...marquer(n, 'fab'), bg: { ...n.bg, gel: n.t + 35 } }), note: 'Nouveau gel : ballon à reflux et chauffage dès le départ (conseil de Lucas), dispersion plus courte.' },
    { t: 'Choisir moi-même le procédé', d: 'Les mêmes choix que la première fois.', duree: 0, vers: 'fab_choix' },
  ],
});
add('secu', {
  lieu: 'Paillasse de formulation', pnj: 'lucas', titre: 'Où installes-tu le montage ?',
  texte: e => `Lucas : « Ton mélange contient ${nf((e.f.fm || FORMULE_REPLI).eth96 || 0, 0)} g d'éthanol à 96 %${e.f.mode === 'froid' ? ', même sans chauffer il s\'évapore' : ' et tu vas chauffer'}. L'éthanol est inflammable : où installes-tu le montage ? »`,
  choix: e => tourne(e, 'rotsecu', [
    { t: 'Sous la hotte, lunettes et blouse, aucune flamme ni point chaud à proximité', tag: 'ok', vers: 'hub', duree: 3, note: 'Montage installé sous la hotte, avec lunettes et blouse.' },
    { t: 'Sur la paillasse, avec la plaque ; je reste à côté pour surveiller', tag: 'ko', vers: 'hub', duree: 10, f: { secuErr: true }, note: 'Montage installé hors hotte : Mme Dubreuil me fait tout déplacer sous la hotte.' },
  ]),
});
add('fab_grumeaux', {
  lieu: 'Paillasse de formulation', pnj: 'lucas', titre: 'Des grumeaux gélifiés',
  texte: () => `Après 20 minutes, le milieu est trouble et plein de petits grumeaux translucides : le Synthalen K a gonflé au contact de la base avant d'être dispersé. Lucas : « Ça ne se redissoudra pas. »`,
  choix: [
    { t: 'Tout recommencer avec la base à la fin, en ballon à reflux', d: '45 min de travail, puis environ 1 h 15 de dispersion : compte 2 h de plus.', duree: 45, vers: 'secu', f: { errBase: true, mode: 'reflux', perteEth: 0.01 }, run: n => ({ ...marquer(n, 'fab'), bg: { ...n.bg, gel: n.t + 75 } }), note: 'Gel raté (base trop tôt) : fabrication refaite avec reflux.' },
    { t: 'Continuer tel quel et espérer que ça passera', duree: 5, vers: 'hub', f: { errBase: true, disp: 'grumeaux' }, run: n => ({ ...marquer(n, 'fab', 'disp'), bg: { ...n.bg, gel: n.t + 10 } }), note: 'Gel avec grumeaux conservé.' },
  ],
});
add('fab_disp', {
  fiches: ['synthalen', 'trolamine'],
  lieu: 'Paillasse de formulation', pnj: 'moi', titre: 'Le Synthalen K est-il dispersé ?',
  entree: e => attendre(e, 'gel'),
  texte: e => e.fait.disp ? 'Le gel est prêt à être neutralisé.' : e.f.mode === 'froid' ? `Après 1 h 30 à température ambiante, il reste encore des morceaux de Synthalen K dans le milieu. Que fais-tu ?` : `Après le temps prévu, il reste encore des morceaux de Synthalen K dans le milieu. Que fais-tu ?`,
  choix: e => e.fait.disp ? [{ t: 'Passer à la neutralisation', vers: 'ph' }] : [
    { t: 'Continuer l\'agitation 30 minutes de plus', duree: 30, vers: 'ph', f: { disp: 'continuer' }, run: n => marquer(n, 'disp'), note: 'Dispersion prolongée de 30 min : Synthalen K dissous.' },
    { t: e.f.mode === 'froid' ? 'Ajouter la base maintenant pour voir si le reste se dissout' : 'Arrêter le chauffage et ajouter la base pour voir si le reste se dissout', duree: 2, vers: 'ph', f: { disp: 'neutraliser' }, run: n => marquer(n, 'disp'), note: 'Dispersion arrêtée avant la fin, base ajoutée ensuite.' },
    { t: e.f.mode === 'froid' ? 'Chauffer modérément pour accélérer' : 'Augmenter le chauffage pour accélérer', duree: 15, vers: 'ph', run: n => ({ ...marquer(n, 'disp'), f: { ...n.f, disp: 'chauffer', perteEth: n.f.perteEth + (n.f.mode === 'becher' ? 0.06 : n.f.mode === 'froid' ? 0.05 : 0.03) } }), note: 'Chauffage augmenté : Synthalen K dispersé, un peu d\'éthanol perdu.' },
  ],
});
export function ajouterBase(e, g) {
  const m = (e.f.trolAdd || 0) + g;
  return { ...e, t: e.t + 2, f: { ...e.f, trolAdd: arr(m, 2), phMes: arr(phDe(e, m) + 0.04 * gauss(e.f.graine, `ph${Math.round(m * 100)}`), 2) } };
}
// Ajout de la quantité prévue dans la formule, en une fois (5 min)
export function ajouterPrevu(e) { const n = ajouterBase(e, e.f.fm?.trol ?? 0); return { ...n, t: e.t + 5 }; }
export function validerPh(e) {
  const ph = phDe(e, e.f.trolAdd || 0), reprise = e.scene === 'ph2';
  const run = n => ({ ...marquer(n, 'ph'), fait: { ...n.fait, ph: true, ...(reprise ? { rheoF: false } : {}) } });
  return { ok: true, etat: choisir({ ...e, f: { ...e.f, phFinal: ph, ...(reprise ? { reprisePh: true } : {}) } }, { vers: 'hub', run, duree: reprise ? 15 : 10, note: reprise ? `Gel repris avec Lucas : pH ${nf(e.f.phMes ?? ph, 2)} après ajout de trolamine (${nf(e.f.trolAdd || 0, 2)} g au total).` : `Gel mis en pot : pH ${e.f.phMes != null ? nf(e.f.phMes, 2) : 'non mesuré'}, ${nf(e.f.trolAdd || 0, 2)} g de trolamine.` }) };
}
add('ph', {
  fiches: ['synthalen', 'trolamine'],
  lieu: 'Paillasse de formulation', pnj: 'lucas', station: 'ph', titre: 'Neutraliser et mettre en pot',
  video: { src: 'videos/neutralisation-carbopol.mp4', legende: 'Enregistrement du TP : le milieu agité s\'épaissit pendant la neutralisation.' },
  texte: e => `« Ta formule prévoyait ${nf(e.f.fm?.trol ?? 0, 2)} g de trolamine : c'était une estimation. Verse-la en agitant : le milieu s'épaissit (regarde l'enregistrement ci-dessous), puis contrôle le pH au pH-mètre. La fiche du fabricant indique environ 1,5 g de trolamine par gramme de polymère pour un pH de 7 : si le pH est loin de cette valeur, corrige par un petit ajout. » ${e.f.disp === 'grumeaux' ? 'Le gel contient des grumeaux.' : ''}${e.f.cooh ? `\nD'après ton titrage, ${nf(e.f.fm?.carb || 1.5, 2)} g de Synthalen K contiennent ${nf((e.f.fm?.carb || 1.5) * e.f.cooh / 100 / M_COOH * 1000, 1)} mmol de COOH : les neutraliser tous demanderait ${nf((e.f.fm?.carb || 1.5) * e.f.cooh / 100 / M_COOH * M_TEA, 2)} g de trolamine.` : ''}`,
  hyp: 'Hypothèse : la viscosité d\'un gel de Synthalen K dépend du pH (elle augmente de pH 3 à 6 environ puis reste sur un plateau jusqu\'à pH 11 environ, d\'après la fiche) ; la lecture du pH-mètre a une dispersion de ±0,04.',
  choix: [],
});
add('ph2', {
  fiches: ['synthalen', 'trolamine'],
  lieu: 'Paillasse de formulation', pnj: 'lucas', station: 'ph', titre: 'Reprendre le pH du gel',
  texte: () => `Lucas rouvre le pot : « On remet de la trolamine par petites fractions, en agitant, et on relit le pH. Compte 15 minutes pour la reprise, et il faudra refaire la mesure de rhéologie. »`,
  hyp: 'Hypothèse : le Synthalen K non encore neutralisé peut encore épaissir ; les grumeaux, eux, ne se rattrapent pas.',
  choix: [],
});

// ───────────── Rhéologie ─────────────
add('rheoC', {
  lieu: 'Salle de rhéologie', pnj: 'lucas', station: 'rheo', titre: 'Rhéologie du gel commercial',
  texte: () => `Lucas lance le rhéomètre sur le gel commercial et te laisse les points de mesure : contrainte σ en fonction du gradient de vitesse γ̇. Teste des modèles d'écoulement, garde celui dont la courbe suit les points, puis donne le seuil d'écoulement τ₀ (contrainte minimale pour que le gel s'écoule).`,
  hyp: "Hypothèse : chaque modèle est une loi empirique ; on garde le plus simple qui suit tous les points (écart relatif de quelques %). Les valeurs sont des données de scénario inspirées des mesures des élèves.",
  choix: [],
});
add('rheoC_faux', {
  lieu: 'Salle de rhéologie', pnj: 'lucas', titre: 'Relis la courbe',
  texte: e => e.f.rheoFaute === 'seuil' ? `Lucas : « Ton modèle est le bon, mais ton seuil est à côté. Le seuil τ₀ est la contrainte que le modèle donne quand γ̇ tend vers 0 : regarde le paramètre τ₀ de l'ajustement, il est d'environ ${nf(HB.tau0, 0)} Pa. »` : 'Lucas : « Regarde les points à faible gradient : la contrainte ne tend pas vers zéro, il y a un seuil d\'écoulement, et la viscosité diminue quand on cisaille davantage (rhéofluidifiant). Seul le modèle de Herschel-Bulkley, seuil plus loi de puissance, suit tous les points : les autres s\'en écartent d\'au moins 10 % à un bout de la courbe. »',
  choix: [{ t: 'Compris, retour à la paillasse', vers: 'hub' }],
});
const causeVisco = e => { const g = gelVrai(e), fDisp = QDISP[e.f.disp] ?? 0.85, fPH = clamp((g.ph - 4) / 2.0, 0.15, 1), fCarb = Math.pow(g.carb / COM.carb, 1.3);
  if (g.q >= 0.9) return 'similaires'; const m = Math.min(fDisp, fPH, fCarb); return m === fDisp ? 'dispersion' : m === fPH ? 'ph' : 'carbopol'; };
add('rheoF', {
  lieu: 'Salle de rhéologie', pnj: 'lucas', titre: 'Gel formulé et gel commercial',
  texte: e => { const q = gelVrai(e).q; return `Voici les deux courbes. Rapport des contraintes formulé / commercial : ${nf(q, 2)} (spécification du scénario : au moins ${nf(SPEC.q, 2)}).\nSi les courbes diffèrent, quelle est la cause la plus probable dans ta fabrication ?`; },
  hyp: 'Hypothèse : à composition proche, la différence de viscosité vient surtout de la dispersion du Synthalen K, du pH final ou de la teneur en Synthalen K.',
  visuels: e => [{ type: 'rheo', courbes: [{ nom: 'Gel commercial', pts: pointsRheo(e, 1, 'rc'), couleur: '#1e3a8a', points: true }, { nom: 'Gel formulé', pts: pointsRheo(e, gelVrai(e).q, 'rf'), couleur: '#b45309', points: true }] }],
  choix: e => { const bon = causeVisco(e), ok = c => c === bon;
    const mk = (id, t) => ({ t, duree: 10, vers: 'hub', f: { errRheo2: !ok(id) || undefined }, run: n => marquer(n, 'rheoF'), note: ok(id) ? 'Cause de l\'écart de viscosité correctement identifiée.' : 'Cause de l\'écart de viscosité mal identifiée.' });
    return [mk('similaires', 'Les deux gels sont très proches : pas de défaut de viscosité'), mk('dispersion', 'Synthalen K mal dispersé (morceaux restants)'), mk('ph', 'pH trop bas : le gel n\'a pas fini d\'épaissir'), mk('carbopol', 'Pas assez de Synthalen K dans la formule')]; },
});

// ───────────── Choix des techniques de contrôle : liste ouverte, présentée sans avis ─────────────
const melange = (e, etiq, L) => [...L].sort((a, b) => unif(e.f.graine, etiq + a.id) - unif(e.f.graine, etiq + b.id));
const essaiInadapte = n => ({ ...n, f: { ...n.f, errMeth: (n.f.errMeth || 0) + 1 } });
add('choix_caf', {
  lieu: 'Salle de chromatographie', pnj: 'moi', titre: 'Contrôler la caféine du gel',
  texte: () => `Il faut vérifier que ton gel contient bien la caféine attendue, avec une incertitude raisonnable. Le laboratoire met à ta disposition les techniques suivantes : aucune n'est imposée, le choix t'appartient.`,
  choix: e => melange(e, 'caf', [
    { id: 'clhpExt', t: 'Chromatographie liquide (CLHP-UV, 273 nm) avec une gamme d\'étalonnage externe', d: 'Fioles de caféine de concentrations croissantes, à injecter une à une (10 min pour sortir la solution mère, puis la préparation et l\'injection de chaque fiole).', duree: 10, vers: 'hplc_m', f: { voieCaf: 'clhp', hplcGamme: true }, note: 'Caféine : technique choisie, CLHP avec gamme d\'étalonnage externe.' },
    { id: 'uvAj', t: 'Spectrophotométrie UV (273 nm) avec ajouts dosés', d: 'Cuve de 1 cm ; cinq fioles à préparer à partir de la solution de gel.', duree: 10, vers: 'hub', f: { voieCaf: 'uv', methCaf: 'ajouts', panne: false }, run: n => marquer(n, 'hplcPrep'), note: 'Caféine : technique choisie, UV avec ajouts dosés.' },
    { id: 'uvExt', t: 'Spectrophotométrie UV (273 nm) avec une gamme d\'étalonnage externe', d: 'Cuve de 1 cm ; gamme de caféine dans l\'éluant.', duree: 10, vers: 'hub', f: { voieCaf: 'uv', methCaf: 'ext', panne: false }, run: n => marquer(n, 'hplcPrep'), note: 'Caféine : technique choisie, UV avec étalonnage externe.' },
    { id: 'titrage', t: 'Titrage acido-basique de la caféine par la soude', d: 'pH-mètre et burette.', duree: 25, vers: 'caf_titrage', run: essaiInadapte, note: 'Caféine : titrage acido-basique essayé.' },
  ]),
});
add('caf_titrage', {
  lieu: 'Paillasse', pnj: 'moi', titre: 'Titrage de la caféine : la courbe pH = f(V)',
  texte: () => `Tu traces la courbe : un seul saut de pH, très étalé, qui apparaît bien avant la quantité de soude attendue pour 5 % de caféine. Dans l'eau, l'acide conjugué de la caféine a un pKa d'environ 0,6 : la caféine est une base bien trop faible pour être dosée par un acide ou une base courants, alors que le Synthalen K et la trolamine du gel, eux, réagissent avec la soude. Cette courbe ne renseigne pas sur la caféine.\nTu as perdu 25 minutes.`,
  choix: [{ t: 'Choisir une autre technique', duree: 0, vers: 'choix_caf' }],
});
add('choix_eth', {
  lieu: 'Salle de chromatographie', pnj: 'moi', titre: 'Contrôler l\'éthanol du gel',
  texte: () => `Il faut maintenant vérifier la teneur en éthanol du gel formulé. Voici ce que le laboratoire peut te proposer ; le choix t'appartient.`,
  choix: e => melange(e, 'eth', [
    { id: 'cpg', t: 'Chromatographie en phase gazeuse (CPG, détecteur à ionisation de flamme, FID)', d: 'Colonne polaire, four à 70 °C, injection de 0,1 µL.', duree: 0, vers: 'cpg_m', f: { voieEth: 'cpg', ei: 'propanol' }, note: 'Éthanol : technique choisie, CPG.' },
    { id: 'clhp', t: 'Chromatographie liquide (CLHP-UV, 273 nm)', d: 'Mêmes colonne et détecteur que pour la caféine.', duree: 15, vers: 'eth_hplc', run: essaiInadapte, note: 'Éthanol : CLHP-UV essayée.' },
    { id: 'dens', t: 'Masse volumique du gel au pycnomètre', d: 'Pesée d\'un volume connu de gel à 20 °C.', duree: 20, vers: 'eth_dens', run: essaiInadapte, note: 'Éthanol : masse volumique essayée.' },
  ]),
});
add('eth_hplc', {
  lieu: 'Salle de chromatographie', pnj: 'moi', titre: 'CLHP-UV : où est l\'éthanol ?',
  texte: () => `Tu injectes la solution de gel : un pic de caféine, un front de solvant, et rien d'autre. L'éthanol n'absorbe pas à 273 nm : le détecteur UV ne le voit pas.\nTu as perdu 15 minutes.`,
  visuels: () => [{ type: 'chroma', titre: 'CLHP-UV 273 nm · solution de gel', tmax: 2, pics: [{ tr: 0.3, h: 0.15, l: 'front de solvant' }, { tr: 0.82, h: 0.9, l: 'caféine' }] }],
  choix: [{ t: 'Choisir une autre technique', duree: 0, vers: 'choix_eth' }],
});
add('eth_dens', {
  lieu: 'Paillasse', pnj: 'moi', titre: 'Masse volumique du gel',
  texte: () => `Tu mesures ρ = 0,94 g/mL à 20 °C. Les tables donnent la masse volumique d'un mélange eau-éthanol, mais ton gel contient aussi de la caféine, du Synthalen K, du cocoate de macrogol et de la trolamine, qui modifient ρ : plusieurs compositions différentes conduisent à 0,94 g/mL. Cette valeur ne permet pas de remonter à la teneur en éthanol.\nTu as perdu 20 minutes.`,
  choix: [{ t: 'Choisir une autre technique', duree: 0, vers: 'choix_eth' }],
});

// ───────────── Caféine : CLHP, ou UV si la CLHP tombe en panne ─────────────
add('hplc_m', {
  lieu: 'Salle de chromatographie', pnj: 'ines', titre: 'Préparer le dosage de la caféine',
  fiches: ['mo1'],
  visuels: () => [{ type: 'fioles' }],
  texte: () => `Fiole 1 : environ 51 mg de caféine dans 50 mL d'éluant. Pour la fiole 4 (50 mL), tu veux la même masse de caféine que dans la fiole 1, à partir du gel (à 5 % de caféine en masse).`,
  hyp: "Hypothèse : le gel formulé contient environ 5 % de caféine (c'est la valeur à vérifier) ; la prise d'essai est faite sur balance de précision.",
  aide: { pnj: 'ines', textes: [
    () => '« Regarde le schéma des fioles : la solution injectée (fiole 5) est une dilution de la fiole 4, comme la référence (fiole 3) est une dilution de la fiole 1. Qu\'est-ce qui doit être pareil entre la fiole 3 et la fiole 5 pour pouvoir les comparer ? »',
    () => '« On prélève les mêmes volumes dans les deux cas (100 µL, puis 200 µL d\'étalon interne). Pour que la fiole 5 contienne autant de caféine que la fiole 3, la fiole 4 doit contenir autant de caféine que la fiole 1 : environ 50 mg dans 50 mL. »',
    () => '« Dans m g de gel à 5 %, il y a 0,05 × m g de caféine. Tu veux environ 50 mg, soit 0,050 g : pose l\'égalité 0,05 × m = 0,050 g. »'] },
  calcul: { q: 'Quelle masse m de gel faut-il peser pour la fiole 4 ?', unite: 'g', vrai: () => 1.0, tol: 0.1, cs: 1, indice: '50 mg de caféine représentent 5 % de la masse m de gel : m = 50 mg / 0,05.',
    ok: { vers: 'hplc_inj', duree: 5 }, ko: { vers: 'hplc_inj', duree: 0 } },
});
add('hplc_inj', {
  lieu: 'Salle de chromatographie', pnj: 'ines', titre: 'Première injection',
  entree: e => e.f.panne === undefined ? { ...e, f: { ...e.f, panne: unif(e.f.graine, 'panne') < 0.6 } } : e,
  texte: e => `Les solutions sont prêtes (${e.f.hplcGamme ? 'solution de référence de caféine' : 'référence avec benzoïne comme étalon interne'}). Tu passes à l'injection de la solution de référence en CLHP.\nSur le schéma de l'appareil, clique à l'endroit où tu injectes la solution.`,
  station: 'schema', schema: 'clhp', cible: 'injecteur',
  choix: [{ t: 'Injecter la solution de référence', duree: 10, vers: e => e.f.panne ? 'hplc_symptome' : 'hplc_ref', run: n => marquer(n, 'hplcPrep'), f: {} }],
});
export const symptomeClhp = e => ['bouchon', 'fuite', 'detecteur'][Math.min(2, Math.floor(unif(e.f.graine, 'sympt') * 3))];
const RELEVES_CLHP = {
  bouchon: { txt: 'La pression, qui était de 100 bar environ pendant l\'équilibrage, monte sans s\'arrêter après l\'injection jusqu\'à 380 bar, puis la pompe s\'arrête sur sécurité. Aucun pic n\'est enregistré.', lignes: [['Pression en tête de colonne', 'environ 100 bar', '100 → 380 bar en 3 min, arrêt de la pompe'], ['Débit', '3 mL/min', 'tombe à 0'], ['Chromatogramme', '2 pics', 'aucun pic']] },
  fuite: { txt: 'La pression chute à 15 bar après l\'injection et ne remonte plus. Le raccord à l\'entrée de la colonne est humide, avec des gouttes d\'éluant. Les pics, très tardifs et étalés, sont inexploitables.', lignes: [['Pression en tête de colonne', 'environ 100 bar', '100 → 15 bar'], ['Débit mesuré en sortie', '3 mL/min', 'environ 0,8 mL/min'], ['Raccord de la colonne', 'sec', 'humide, gouttes d\'éluant']] },
  detecteur: { txt: 'La pression est stable (98 bar) et le débit est normal. Mais la ligne de base est très bruitée, et la solution de référence, pourtant concentrée, ne donne que des pics minuscules, à peine visibles.', lignes: [['Pression en tête de colonne', 'environ 100 bar', '98 bar, stable'], ['Débit', '3 mL/min', '3 mL/min'], ['Signal du détecteur', 'deux pics hauts', 'pics à peine visibles, ligne de base bruitée']] },
};
add('hplc_symptome', {
  lieu: 'Salle de chromatographie', pnj: 'ines', titre: 'L\'injection ne donne pas ce qu\'on attend',
  texte: e => `Tu injectes la solution de référence (boucle de 20 µL). Voici ce que tu relèves.\n${RELEVES_CLHP[symptomeClhp(e)].txt}\nInès : « Ça ne ressemble pas à ce qu'on obtient d'habitude. Regarde bien les relevés. »`,
  visuels: e => { const s = symptomeClhp(e), L = [{ type: 'tableau', titre: 'Relevés de la CLHP pendant l\'injection', cols: ['Relevé', 'Habituel', 'Mesuré'], lignes: RELEVES_CLHP[s].lignes }]; if (s === 'detecteur') L.push({ type: 'chroma', titre: 'CLHP · référence (signal obtenu)', tmax: 2, bruit: 0.05, pics: [{ tr: 0.82, h: 0.07, l: '' }, { tr: 1.24, h: 0.04, l: '' }] }); return L; },
  choix: e => { const s = symptomeClhp(e), mk = (id, t, vers = 'hplc_panne') => ({ id, t, duree: id === s ? 3 : id === 'ines' ? 5 : 8, vers, f: { diag: id }, note: id === 'ines' ? 'Relevés de la CLHP : je demande son avis à Inès.' : id === s ? `Relevés de la CLHP : j'identifie correctement la cause (${t.toLowerCase()}).` : `Relevés de la CLHP : j'avais pensé à autre chose (${t.toLowerCase()}), erreur de diagnostic.` });
    return melange(e, 'diag', [mk('bouchon', 'Le circuit est bouché (particules dans la colonne)'), mk('fuite', 'Il y a une fuite au raccord de la colonne'), mk('detecteur', 'La lampe du détecteur UV est défaillante')]).concat([mk('ines', 'Je ne sais pas : je demande à Inès')]); },
});
add('hplc_ref', {
  lieu: 'Salle de chromatographie', pnj: 'ines', titre: 'Chromatogramme de référence',
  texte: e => { const d = donneesHplc(e); return e.f.hplcGamme ? 'Un pic net et symétrique : la caféine (t_R ≈ 0,8 min). L\'appareil fonctionne : tu peux concevoir ta gamme d\'étalonnage.' : `Deux pics bien séparés : la caféine (t_R ≈ 0,8 min) et la benzoïne, étalon interne (t_R ≈ 1,2 min). Aires de la référence : caféine ${nf(d.aRefC, 2)}, benzoïne ${nf(d.aRefB, 2)}.`; },
  visuels: e => e.f.hplcGamme ? [{ type: 'chroma', titre: 'CLHP · solution de caféine', tmax: 2, pics: [{ tr: 0.82, h: 0.9, l: 'caféine' }] }] : [{ type: 'chroma', titre: 'CLHP · référence (caféine + benzoïne)', tmax: 2, pics: [{ tr: 0.82, h: 0.9, l: 'caféine' }, { tr: 1.24, h: 0.35, l: 'benzoïne (EI)' }] }],
  choix: e => [{ t: 'Retour à la paillasse', vers: 'hub', f: { methCaf: e.f.hplcGamme ? 'gamme' : 'EI' } }],
});
const DIAG_CLHP = {
  bouchon: 'Inès : « Une pression qui monte sans fin et aucun pic : le circuit est bouché, sans doute des particules dans le fritté de la colonne. Il faut le changer et rincer le circuit : compte une heure et quart.',
  fuite: 'Inès : « Une pression qui s\'effondre et un raccord humide : c\'est une fuite à l\'entrée de la colonne. Il faut changer la bague du raccord, purger et ré-équilibrer : compte une heure et quart.',
  detecteur: 'Inès : « Pression et débit normaux, mais un signal presque nul et bruité : la lampe UV du détecteur est en fin de vie. Il faut la changer et attendre qu\'elle se stabilise : compte une heure et quart.',
};
add('hplc_panne', {
  lieu: 'Salle de chromatographie', pnj: 'ines', titre: 'La CLHP est hors service',
  texte: e => `${e.f.diag && e.f.diag !== 'ines' && e.f.diag !== symptomeClhp(e) ? 'Inès : « Ce n\'était pas ça, regarde de nouveau les relevés. » ' : ''}${DIAG_CLHP[symptomeClhp(e)]} ${e.f.eq?.ext ? '' : 'Lucas, qui passe par là, jette un œil à tes relevés et te lance un conseil.'} Mais la CLHP n'est pas obligatoire : à 273 nm, la caféine est sans doute la seule espèce du gel qui absorbe, donc on peut simplement mesurer l'absorbance des solutions au spectrophotomètre UV, sans passer par une colonne. »\nQue fais-tu ?`,
  hyp: 'Hypothèse (UV) : loi de Beer-Lambert (A proportionnelle à C) dans la zone de travail, A restant inférieure à 1.',
  choix: e => [
    { t: 'Ajouts dosés au spectrophotomètre UV : on ajoute des quantités connues de caféine à la solution de gel', d: '5 fioles à préparer', duree: 10, vers: 'hub', f: { methCaf: 'ajouts' }, note: 'Panne de CLHP : dosage par ajouts dosés en UV.' },
    { t: 'Étalonnage externe en UV : gamme de caféine dans l\'éluant, puis lecture de la solution de gel', d: 'Plus simple à préparer', duree: 10, vers: 'hub', f: { methCaf: 'ext' }, note: 'Panne de CLHP : dosage par étalonnage externe en UV.' },
    ...(e.f.eq?.ext ? [] : [{ t: 'Écouter ce que Lucas te conseille', duree: 0, vers: 'eq_ext' }]),
    { t: 'Faire réparer la CLHP et m\'occuper d\'autre chose en attendant', d: 'La réparation dure 1 h 15 sans toi : tu peux travailler ailleurs pendant ce temps', duree: 5, vers: 'hub', f: { methCaf: e.f.hplcGamme ? 'gamme' : 'EI', attendu: true }, run: n => ({ ...n, bg: { ...n.bg, clhp: n.t + 75 } }), note: 'Panne de CLHP : réparation lancée (1 h 15), je continue autre chose.' },
  ],
});
add('hplc_gamme_plan', {
  lieu: 'Salle de chromatographie', pnj: 'moi', station: 'plan', titre: 'CLHP, étalonnage externe : concevoir ma gamme',
  texte: e => { const d = donneesHplc(e); return `Solution mère de caféine : fiole 1, 1,018 g/L. Tu prépares une gamme en diluant un volume X de cette solution dans 20 mL d'éluant. La solution du gel formulé est celle de la fiole 5 (m = ${nf(d.mPes, 3)} g dans 50 mL, puis 100 µL dans 20 mL, benzoïne comprise : elle ne gêne pas). Il faut que la caféine du gel « tombe » dans la gamme.`; },
  hyp: "Hypothèse de travail : l'aire du pic est proportionnelle à la concentration dans la zone choisie ; le volume injecté est fixé par la boucle de 20 µL.",
  aide: { pnj: 'ines', textes: [
    () => '« Estime d\'abord la concentration de la fiole 5 : combien de caféine y a-t-il, si le gel est conforme ? Ta gamme doit encadrer cette valeur, sans aller beaucoup au-delà. »',
    () => '« Fiole 5 : environ 5 × m mg/L (m en grammes). Une fiole de gamme avec X µL de la fiole 1 contient X × 1,018 / 20 mg/L. Cinq fioles, par exemple, qui vont d\'un peu moins de la moitié à environ deux fois la valeur attendue. »',
    () => '« Je ferais : 5 fioles, de 20 à 200 µL de la fiole 1. »'],
    valeurs: () => ({ vmin: 20, vmax: 200, n: 5 }) },
  plan: { infos: ['Micropipettes disponibles : 20 à 200 µL, 100 à 1 000 µL. Huit fioles de 20 mL au plus.', 'Détecteur UV à 273 nm ; une injection dure environ 4 minutes.'], vers: 'hplc_gamme', duree: v => 6 + 3 * v.n, note: v => `CLHP, étalonnage externe : gamme de ${v.n} fioles de ${v.vmin} à ${v.vmax} µL de la fiole 1.`,
    champs: [{ id: 'vmin', l: 'Plus petit volume de la fiole 1', u: 'µL', min: 10, max: 1000 }, { id: 'vmax', l: 'Plus grand volume de la fiole 1', u: 'µL', min: 10, max: 1000 }, { id: 'n', l: 'Nombre de fioles de la gamme', u: '', min: 3, max: 8, entier: true }],
    controle: v => v.vmax <= v.vmin ? 'Le plus grand volume doit dépasser le plus petit.' : null,
    apercu: v => ({ cols: ['Fiole', 'Volume de fiole 1 (µL)'], lignes: niveaux(v.vmin, v.vmax, v.n).map((x, i) => [String(i + 1), String(x)]) }) },
});
add('hplc_gamme', {
  lieu: 'Salle de chromatographie', pnj: 'ines', titre: 'Caféine par CLHP, étalonnage externe : tes mesures',
  texte: e => { const d = donneesHplcGamme(e); return `Aires de la caféine (UV 273 nm) pour ta gamme : droite A = ${nf(d.a, 3)} × C ${d.b < 0 ? '−' : '+'} ${nf(Math.abs(d.b), 2)}, R² = ${nf(d.r2, 4)} (C en mg/L). Solution du gel (fiole 5, m = ${nf(d.mPes, 3)} g) : aire de la caféine ${nf(d.aEch, 2)}.`; },
  hyp: "Hypothèses : aire proportionnelle à la concentration sur la gamme ; volume injecté constant (boucle) ; la solution du gel est lue à l'intérieur de la gamme.",
  visuels: e => { const d = donneesHplcGamme(e); return [{ type: 'droite', titre: 'Gamme CLHP : aire = f(C)', xl: 'C (mg/L)', yl: 'aire', pts: d.pts.map(p => [p.c, p.A]), a: d.a, b: d.b, residus: d.residus, ech: d.a > 0 ? [d.c5, d.aEch] : null }, { type: 'tableau', titre: 'Mesures', cols: ['V fiole 1 (µL)', 'C (mg/L)', 'Aire'], lignes: d.pts.map(p => [String(p.v), nf(p.c, 2), nf(p.A, 2)]) }]; },
  choix: [{ t: 'Calculer le pourcentage de caféine', duree: 0, vers: 'hplc_gamme_calc' }, { t: 'Refaire ma gamme autrement', d: 'Nouvelle préparation, nouvelles injections.', duree: 0, vers: 'hplc_gamme_plan' }],
});
add('hplc_gamme_calc', {
  lieu: 'Salle de chromatographie', pnj: 'ines', titre: 'Caféine par CLHP, étalonnage externe : calcul',
  texte: e => { const d = donneesHplcGamme(e); return `Droite A = ${nf(d.a, 3)} × C ${d.b < 0 ? '−' : '+'} ${nf(Math.abs(d.b), 2)}. Fiole 5 : aire ${nf(d.aEch, 2)}, m = ${nf(d.mPes, 3)} g dans 50 mL (fiole 4), puis 100 µL dans 20 mL.`; },
  aide: { pnj: 'ines', textes: [
    () => '« Que te permet de calculer la droite d\'étalonnage à partir de l\'aire de ton échantillon ? »',
    () => '« Inverse la droite : concentration = (aire − ordonnée à l\'origine) / pente. C\'est la concentration de la fiole 5. »',
    () => '« Multiplie par 200 pour la fiole 4, par 0,050 L pour la masse en mg, puis divise par la masse de gel. »'] },
  calcul: { q: 'Quel est le pourcentage massique de caféine dans le gel ?', unite: '%', vrai: e => donneesHplcGamme(e).pct, tol: 0.03, cs: 2, indice: 'C_fiole5 = (aire − b) / pente. × 200 (dilution de la fiole 4 vers la fiole 5), × 0,050 L pour la masse en mg, ÷ masse de gel.',
    ok: { vers: 'hub', duree: 8, run: n => marquer(n, 'caf'), f: { cafMes: true } }, ko: { vers: 'hub', duree: 0, run: n => marquer(n, 'caf'), f: { cafMes: true } } },
});
add('hplc_ei', {
  entree: e => attendre(e, 'clhp'),
  lieu: 'Salle de chromatographie', pnj: 'ines', titre: 'Caféine par CLHP, étalon interne',
  texte: e => { const d = donneesHplc(e); return `Gel formulé : m = ${nf(d.mPes, 3)} g dans 50 mL (fiole 4), puis 100 µL de cette fiole + 200 µL de la solution de benzoïne dans 20 mL (fiole 5). Concentration de la caféine dans la référence : ${nf(d.cRef, 2)} mg/L.\nAires : référence caféine ${nf(d.aRefC, 2)}, benzoïne ${nf(d.aRefB, 2)} ; échantillon caféine ${nf(d.aEchC, 2)}, benzoïne ${nf(d.aEchB, 2)}.`; },
  formule: 'hplcEI', hyp: "Hypothèses : la réponse du détecteur est proportionnelle à la concentration pour chaque composé ; la benzoïne est stable et à la même concentration dans les deux fioles ; le volume injecté est constant (boucle de 20 µL).",
  visuels: e => { const d = donneesHplc(e); return [{ type: 'tableau', titre: 'Aires des pics (unités arbitraires)', cols: ['', 'caféine', 'benzoïne'], lignes: [['Référence (fiole 3)', nf(d.aRefC, 2), nf(d.aRefB, 2)], ['Échantillon (fiole 5)', nf(d.aEchC, 2), nf(d.aEchB, 2)]] }]; },
  aide: { pnj: 'ines', textes: [
    () => '« Que faut-il comparer entre la référence et l\'échantillon pour ne pas dépendre du volume injecté ? »',
    () => '« Le rapport des aires caféine / benzoïne dans chaque solution. La référence a une concentration connue : une proportionnalité donne celle de la fiole 5. »',
    () => '« C_fiole5 = C_réf × (rapport éch) / (rapport réf). Remonte à la fiole 4 par la dilution (× 200), multiplie par 0,050 L, divise par la masse de gel. »'] },
  calcul: { q: 'Quel est le pourcentage massique de caféine dans le gel ?', unite: '%', vrai: e => donneesHplc(e).pct, tol: 0.03, cs: 2, indice: 'C_fiole5 = C_réf × (A_benz,réf / A_caf,réf) × (A_caf,éch / A_benz,éch). Puis × 200 (dilution de la fiole 4 vers la fiole 5), × 0,050 L pour la masse en mg, ÷ masse de gel.',
    ok: { vers: 'hub', duree: 25, run: n => marquer(n, 'caf'), f: { cafMes: true } }, ko: { vers: 'hub', duree: 0, run: n => marquer(n, 'caf'), f: { cafMes: true } } },
});
const INFOS_UV = ['Solution étalon de caféine : 1,003 g/L. Fiole mère de 50 mL, fioles de travail de 20 mL. Cuve de 1 cm, λ = 273 nm.', 'Micropipettes disponibles : 20 à 200 µL, 100 à 1 000 µL, 1 à 5 mL. Huit fioles de 20 mL au plus.', 'Essai préalable : une solution de caféine à 10 mg/L dans l\'éluant donne A = 0,33.'];
const volTotal = v => v > 19000 ? 'Le volume à prélever dépasse ce que contient une fiole de 20 mL.' : null;
add('uv_ajouts_plan', {
  lieu: 'Salle des spectrophotomètres', pnj: 'moi', station: 'plan', titre: 'Ajouts dosés : concevoir mes fioles',
  texte: () => `Tu dissous une masse de gel dans la fiole mère de 50 mL. Dans chaque fiole de 20 mL, tu mets la même prise de fiole mère, plus un volume croissant de solution étalon (0, Δ, 2Δ…), puis tu complètes au trait. C'est à toi de fixer les quantités.`,
  hyp: "Hypothèse de travail : l'absorbance est proportionnelle à la concentration (loi de Beer-Lambert) dans la zone que tu choisis ; toutes les fioles ont la même matrice.",
  aide: { pnj: 'ines', textes: [
    () => '« Vise une absorbance entre 0,2 et 0,8 pour toutes les fioles, y compris la plus chargée en étalon. Tu as un essai préalable : 10 mg/L donne A = 0,33. Quelle concentration de caféine veux-tu dans la fiole sans ajout ? »',
    () => '« Le gel contient environ 5 % de caféine : m grammes de gel dans 50 mL donnent environ 1 000 × m mg/L dans la fiole mère. Prélève une prise pour avoir à peu près 10 mg/L dans la fiole de 20 mL, puis ajoute de l\'étalon (1,003 g/L) pour doubler la concentration environ, sans dépasser A = 0,8. Évite de pipeter moins de 50 µL : l\'erreur relative devient grosse. »',
    () => '« Je ferais : 1 g de gel dans 50 mL, une prise de 160 µL, des ajouts de 30 µL, 6 fioles. »'],
    valeurs: () => ({ m: 1, vp: 160, dv: 30, n: 6 }) },
  plan: { infos: INFOS_UV, vers: 'uv_ajouts', duree: v => 8 + 3 * v.n, note: v => `Ajouts dosés UV : ${nf(v.m, 3)} g de gel dans 50 mL, prise de ${v.vp} µL, ajouts de ${v.dv} µL en ${v.n} fioles.`,
    champs: [{ id: 'm', l: 'Masse de gel dans la fiole mère de 50 mL', u: 'g', min: 0.05, max: 2.5 }, { id: 'vp', l: 'Prise de fiole mère dans chaque fiole de 20 mL', u: 'µL', min: 20, max: 5000 }, { id: 'dv', l: 'Pas d\'ajout de solution étalon (Δ)', u: 'µL', min: 20, max: 5000 }, { id: 'n', l: 'Nombre de fioles (la première sans ajout)', u: '', min: 3, max: 8, entier: true }],
    controle: v => volTotal(v.vp + (v.n - 1) * v.dv),
    apercu: v => ({ cols: ['Fiole', 'Fiole mère (µL)', 'Étalon (µL)'], lignes: Array.from({ length: v.n }, (_, i) => [String(i + 1), String(v.vp), String(i * v.dv)]) }) },
});
add('uv_ajouts', {
  lieu: 'Salle des spectrophotomètres', pnj: 'ines', titre: 'Caféine par ajouts dosés : tes mesures',
  texte: e => { const d = donneesUv(e); return `Gel formulé : ${nf(d.mPes, 3)} g dans 50 mL (fiole mère). Dans ${d.planA.n} fioles de 20 mL : ${d.planA.vp} µL de fiole mère + 0 à ${(d.planA.n - 1) * d.planA.dv} µL de solution étalon (1,003 g/L). Droite A = a·C_ajoutée + b, avec C en mg/L dans la fiole de 20 mL : a = ${nf(d.a, 4)} L/mg, b = ${nf(d.b, 4)}, R² = ${nf(d.r2, 4)}.`; },
  formule: 'ajouts',
  hyp: "Hypothèses : A proportionnelle à la concentration (Beer-Lambert) ; la matrice (excipients du gel) est identique dans les fioles, donc la sensibilité est la même pour la caféine du gel et pour la caféine ajoutée ; extrapolation linéaire jusqu'à A = 0. Vérifie les résidus.",
  visuels: e => { const d = donneesUv(e); return [{ type: 'droite', titre: 'Ajouts dosés : A = f(C ajoutée)', xl: 'C ajoutée (mg/L)', yl: 'A', pts: d.ajouts.map(p => [p.c, p.A]), a: d.a, b: d.b, residus: d.residus }, { type: 'tableau', titre: 'Mesures', cols: ['V ajouté (µL)', 'C ajoutée (mg/L)', 'A'], lignes: d.ajouts.map(p => [String(p.v), nf(p.c, 2), nf(p.A, 3)]) }]; },
  choix: [{ t: 'Calculer le pourcentage de caféine', duree: 0, vers: 'uv_ajouts_calc' }, { t: 'Refaire mes fioles autrement', d: 'Nouvelle préparation, nouvelles mesures.', duree: 0, vers: 'uv_ajouts_plan', f: { refait: true } }],
});
add('uv_ajouts_calc', {
  lieu: 'Salle des spectrophotomètres', pnj: 'ines', titre: 'Caféine par ajouts dosés : calcul',
  texte: e => { const d = donneesUv(e); return `Droite A = a·C_ajoutée + b : a = ${nf(d.a, 4)} L/mg, b = ${nf(d.b, 4)}. Gel : ${nf(d.mPes, 3)} g dans 50 mL, prise de ${d.planA.vp} µL dans 20 mL.`; },
  formule: 'ajouts',
  visuels: e => { const d = donneesUv(e); return [{ type: 'droite', titre: 'Ajouts dosés : A = f(C ajoutée)', xl: 'C ajoutée (mg/L)', yl: 'A', pts: d.ajouts.map(p => [p.c, p.A]), a: d.a, b: d.b, residus: d.residus }]; },
  aide: { pnj: 'ines', textes: [
    () => '« Quand on n\'ajoute rien, quelle est la concentration de la solution ? La droite des ajouts te le dit en un point particulier. »',
    () => '« Prolonge la droite jusqu\'à A = 0 : l\'abscisse trouvée, changée de signe, est la concentration de la solution avant ajout. »',
    () => '« C = b / a. Rapporte-la à la prise d\'essai (dilution de la fiole mère), multiplie par 0,050 L pour la masse en mg, divise par la masse de gel. »'] },
  calcul: { q: 'Quel est le pourcentage massique de caféine dans le gel ?', unite: '%', vrai: e => donneesUv(e).pctAjouts, tol: 0.03, cs: 2, indice: 'À A = 0, C = −b/a : la concentration de caféine du gel dans la fiole de 20 mL vaut b/a. Rapporte-la à la prise (dilution de la fiole mère), multiplie par 0,050 L pour la masse en mg, et divise par la masse de gel.',
    ok: { vers: 'hub', duree: 8, run: n => marquer(n, 'caf'), f: { cafMes: true } }, ko: { vers: 'hub', duree: 0, run: n => marquer(n, 'caf'), f: { cafMes: true } } },
});
add('uv_ext_plan', {
  lieu: 'Salle des spectrophotomètres', pnj: 'moi', station: 'plan', titre: 'Étalonnage externe : concevoir ma gamme',
  texte: () => `Tu prépares une gamme de solutions de caféine dans l'éluant (en prélevant de la solution étalon), puis une solution de gel (masse dans la fiole mère de 50 mL, puis une prise dans une fiole de 20 mL). À toi de fixer les volumes.`,
  hyp: "Hypothèse de travail : l'absorbance est proportionnelle à la concentration dans la gamme ; la solution de gel est lue sur la droite d'étalonnage.",
  aide: { pnj: 'ines', textes: [
    () => '« Ta gamme doit encadrer la concentration attendue pour la solution de gel, avec des absorbances entre 0,1 et 0,8. Commence par estimer la concentration de caféine dans ta fiole de gel. »',
    () => '« Avec 5 % de caféine : m g de gel dans 50 mL, puis une prise de vp µL dans 20 mL, donnent environ 0,05 × m × vp mg/L. Pour la gamme, une fiole avec V µL d\'étalon contient V × 1,003 / 20 mg/L. Prends cinq fioles qui encadrent la valeur du gel. »',
    () => '« Je ferais : 1 g de gel dans 50 mL, une prise de 200 µL ; gamme de 5 fioles de 20 à 300 µL d\'étalon. »'],
    valeurs: () => ({ vmin: 20, vmax: 300, n: 5, m: 1, vp: 200 }) },
  plan: { infos: INFOS_UV, vers: 'uv_ext', duree: v => 10 + 3 * v.n, note: v => `Étalonnage externe UV : gamme de ${v.n} fioles de ${v.vmin} à ${v.vmax} µL d'étalon ; gel ${nf(v.m, 3)} g dans 50 mL, prise de ${v.vp} µL.`,
    champs: [{ id: 'vmin', l: 'Plus petit volume de solution étalon', u: 'µL', min: 20, max: 5000 }, { id: 'vmax', l: 'Plus grand volume de solution étalon', u: 'µL', min: 20, max: 5000 }, { id: 'n', l: 'Nombre de fioles de la gamme', u: '', min: 3, max: 8, entier: true }, { id: 'm', l: 'Masse de gel dans la fiole mère de 50 mL', u: 'g', min: 0.05, max: 2.5 }, { id: 'vp', l: 'Prise de fiole mère dans la fiole de 20 mL', u: 'µL', min: 20, max: 5000 }],
    controle: v => v.vmax <= v.vmin ? 'Le plus grand volume doit dépasser le plus petit.' : volTotal(v.vmax),
    apercu: v => ({ cols: ['Fiole', 'Étalon (µL)'], lignes: [...niveaux(v.vmin, v.vmax, v.n).map((x, i) => [String(i + 1), String(x)]), ['Gel', `${v.vp} µL de fiole mère`]] }) },
});
add('uv_ext', {
  lieu: 'Salle des spectrophotomètres', pnj: 'ines', titre: 'Caféine par étalonnage externe : tes mesures',
  texte: e => { const d = donneesUv(e); return `Gamme d'étalonnage de caféine dans l'éluant (${d.planE.n} fioles) : A = ${nf(d.aExt, 4)} × C ${d.bExt < 0 ? '−' : '+'} ${nf(Math.abs(d.bExt), 4)} (C en mg/L), R² = ${nf(d.r2Ext, 4)}. Solution de gel (${d.planE.vp} µL de la fiole mère de ${nf(d.planE.m, 3)} g / 50 mL, dans 20 mL) : A = ${nf(d.aGel, 3)}.`; },
  formule: 'ext',
  hyp: "Hypothèse : la sensibilité de la caféine est la même dans l'éluant seul et dans la solution de gel (pas d'effet de matrice).",
  visuels: e => { const d = donneesUv(e); return [{ type: 'droite', titre: 'Gamme UV : A = f(C)', xl: 'C (mg/L)', yl: 'A', pts: d.gammeExt.map(p => [p.c, p.A]), a: d.aExt, b: d.bExt, residus: d.residusExt, ech: d.aExt > 0 ? [(d.aGel - d.bExt) / d.aExt, d.aGel] : null }, { type: 'tableau', titre: 'Mesures', cols: ['V étalon (µL)', 'C (mg/L)', 'A'], lignes: d.gammeExt.map(p => [String(p.v), nf(p.c, 2), nf(p.A, 3)]) }]; },
  choix: [{ t: 'Calculer le pourcentage de caféine', duree: 0, vers: 'uv_ext_calc' }, { t: 'Refaire ma gamme autrement', d: 'Nouvelle préparation, nouvelles mesures.', duree: 0, vers: 'uv_ext_plan' }],
});
add('uv_ext_calc', {
  lieu: 'Salle des spectrophotomètres', pnj: 'ines', titre: 'Caféine par étalonnage externe : calcul',
  texte: e => { const d = donneesUv(e); return `Droite d'étalonnage : A = ${nf(d.aExt, 4)} × C ${d.bExt < 0 ? '−' : '+'} ${nf(Math.abs(d.bExt), 4)} (A = pente × C + b). Solution de gel : A = ${nf(d.aGel, 3)} (${d.planE.vp} µL de fiole mère de ${nf(d.planE.m, 3)} g / 50 mL, dans 20 mL).`; },
  formule: 'ext',
  aide: { pnj: 'ines', textes: [
    () => '« Que te donne la droite d\'étalonnage quand tu y reportes l\'absorbance de ta solution ? »',
    () => '« Inverse la droite : C = (A − b) / pente, concentration de la solution mesurée. »',
    () => '« Rapporte-la à la prise (dilution de la fiole mère), multiplie par 0,050 L pour la masse en mg, divise par la masse de gel. »'] },
  calcul: { q: 'Quel est le pourcentage massique de caféine dans le gel ?', unite: '%', vrai: e => donneesUv(e).pctExt, tol: 0.03, cs: 2, indice: 'C_fiole = (A − b) / pente. Rapporte-la à la prise (dilution de la fiole mère), multiplie par 0,050 L pour la masse en mg, et divise par la masse de gel.',
    ok: { vers: 'uv_ext_dec', duree: 5, f: { extTente: true } }, ko: { vers: 'uv_ext_dec', duree: 0, f: { extTente: true } } },
});
add('uv_ext_dec', {
  lieu: 'Salle des spectrophotomètres', pnj: 'ines', titre: 'Ce résultat est-il crédible ?',
  texte: e => { const x = donneesUv(e).pctExt; return `Tu trouves ${nf(x, 1)} % de caféine pour un gel censé en contenir 5 %. Inès : « ${x > SPEC.caf[1] ? 'Ça fait beaucoup. Tu as un témoin sous la main.' : 'Le résultat semble raisonnable, mais as-tu vérifié ta méthode ? Tu as un témoin sous la main.'} »`; },
  choix: [
    { t: 'Je garde ce résultat : le gel formulé contient trop de caféine', duree: 3, vers: 'hub', f: { extAccepte: true, cafMes: 'ext' }, run: n => marquer(n, 'caf'), note: 'Caféine dosée par étalonnage externe UV, résultat retenu sans vérification.' },
    { t: 'Je mesure le gel commercial (à 5 % connus) avec la même gamme pour vérifier la méthode', d: '25 min', duree: 25, vers: 'uv_ext_verif' },
  ],
});
add('uv_ext_verif', {
  lieu: 'Salle des spectrophotomètres', pnj: 'ines', titre: 'Le témoin sort aussi trop haut',
  texte: e => `Le gel commercial, qui contient 5 % de caféine, donne ${nf(donneesUv(e).pctTemoin, 1)} % avec cette gamme (au lieu de 5,0 %) : la méthode est biaisée. Dans la solution de gel, la caféine absorbe plus que dans l'éluant seul (effet de matrice des excipients) : la gamme faite dans l'éluant ne convient pas. Il faut faire les ajouts dans la solution de gel elle-même.`,
  choix: [{ t: 'Refaire en ajouts dosés', duree: 0, vers: 'uv_ajouts_plan', f: { methCaf: 'ajouts' } }],
});

// ───────────── Éthanol : CPG ─────────────
const eiNom = e => ({ propanol: 'propan-1-ol', butanol: 'butan-1-ol' })[e.f.ei || 'propanol'];
add('cpg_ei', {
  lieu: 'Salle de chromatographie', pnj: 'ines', titre: 'Changer d\'étalon interne',
  texte: () => `En CPG, le volume injecté (≈ 0,1 µL) n'est pas maîtrisé : l'aire d'un pic seul ne permet pas de remonter à la masse injectée, il faut un étalon interne dont le pic soit séparé de celui de l'éthanol. Colonne polaire CP Wax, four à 70 °C, durée d'analyse de 3 minutes. Voici les autres étalons internes que l'on peut utiliser et que l'on a en stock :`,
  hyp: "Hypothèse : le facteur de réponse éthanol / étalon interne est constant ; les deux pics doivent être résolus et sortir dans la durée d'analyse.",
  choix: e => melange(e, 'ei', [
    { id: 'butanol', t: 'Le butan-1-ol', d: 'Alcool primaire en C4.', duree: 10, vers: 'cpg_ref', f: { ei: 'butanol' }, note: 'Étalon interne CPG : butan-1-ol (fiole de référence refaite).' },
    { id: 'pentanol', t: 'Le pentan-1-ol', d: 'Alcool primaire en C5.', duree: 15, vers: 'cpg_pentanol', run: essaiInadapte, note: 'Étalon interne CPG : pentan-1-ol essayé.' },
    { id: 'aucun', t: 'Pas d\'étalon interne : j\'injecte plusieurs fois la même solution d\'éthanol et je compare les aires', duree: 5, vers: 'cpg_sans', si: x => !x.f.sansEI },
  ]),
});
add('cpg_sim', {
  lieu: 'Salle de chromatographie', pnj: 'ines', station: 'cpgsim', titre: 'Régler le chromatographe',
  texte: () => `Inès : « Avant de changer d'étalon, regarde ce que l'appareil peut faire. Tu peux régler la température de l'injecteur, celle du four (isotherme), celle du détecteur et la pression du gaz vecteur. Chaque injection dure environ 3 minutes. Une résolution Rₛ d'au moins 1,5 correspond à des pics séparés jusqu'à la ligne de base. »`,
  hyp: "Hypothèse : modèle simplifié : le temps de rétention suit une loi de van 't Hoff, l'efficacité de la colonne une loi de van Deemter ; les constantes sont des données de scénario.",
  choix: [],
});
add('cpg_pentanol', {
  lieu: 'Salle de chromatographie', pnj: 'ines', titre: 'Pentan-1-ol : pas de pic',
  texte: () => `Tu injectes la référence : le pic de l'éthanol est là, mais aucun pic d'étalon interne avant la fin des 3 minutes d'analyse. Le pentan-1-ol, plus lourd, est encore dans la colonne quand l'enregistrement s'arrête.\nTu as perdu 15 minutes.`,
  choix: [{ t: 'Choisir un autre étalon interne', duree: 0, vers: 'cpg_ei' }],
});
add('cpg_sans', {
  lieu: 'Salle de chromatographie', pnj: 'ines', titre: 'Trois injections de la même solution',
  texte: e => { const d = donneesCpg(e).sansEI; return `Même solution, trois injections : aires d'éthanol ${d.map(x => nf(x, 1)).join(' ; ')} (unités arbitraires). Les aires varient de plus de 10 % alors que la solution est la même : le volume injecté change d'une injection à l'autre. Il faut un étalon interne.`; },
  choix: [{ t: 'Revenir au choix de l\'étalon interne', duree: 5, vers: 'cpg_ei', f: { sansEI: true } }],
});
add('cpg_m', {
  lieu: 'Salle de chromatographie', pnj: 'ines', titre: 'Masse de gel à peser pour la CPG',
  fiches: ['mo3'],
  texte: e => `Solution de référence (fiole de 20 mL) : 500 µL de ${eiNom(e)} (micropipette), 250 µL d'éthanol (ρ = ${nf(RHO_ETOH, 3)} g/mL), eau qsp. Pour la solution échantillon, tu veux environ la même quantité d'éthanol que dans la référence, à partir du gel (rappel : ${nf(ETH_PUR_COM, 1)} % d'éthanol pur).`,
  hyp: "Hypothèse : la masse volumique de l'éthanol pur est 0,789 g/mL à 20 °C ; la solution échantillon est préparée avec la même masse d'étalon interne.",
  aide: { pnj: 'ines', textes: [
    () => '« Quelle masse d\'éthanol y a-t-il dans ta fiole de référence ? C\'est elle que tu veux retrouver dans la fiole échantillon. »',
    () => '« La référence contient 250 µL d\'éthanol, de masse volumique 0,789 g/mL. L\'échantillon doit en contenir la même masse. »',
    () => '« m(éthanol) = 0,250 mL × 0,789 g/mL. Cette masse représente 38,4 % de m\' : donc m\' = m(éthanol) / 0,384. »'] },
  calcul: { q: 'Quelle masse m\' de gel faut-il peser dans la fiole échantillon ?', unite: 'g', vrai: () => V_REF * RHO_ETOH / 1000 / (ETH_PUR_COM / 100), tol: 0.1, cs: 2, indice: 'Masse d\'éthanol de la référence : 250 µL × 0,789 g/mL. Elle représente 38,4 % de la masse de gel m\'.',
    ok: { vers: 'cpg_inj1', duree: 5 }, ko: { vers: 'cpg_inj1', duree: 0 } },
});
add('cpg_inj1', {
  lieu: 'Salle de chromatographie', pnj: 'ines', titre: 'Première injection en CPG',
  fiches: ['mo3'],
  texte: () => 'Les fioles sont prêtes. Tu passes à l\'injection de la solution de référence en CPG.\nSur le schéma de l\'appareil, clique à l\'endroit où tu injectes la solution.',
  station: 'schema', schema: 'cpg', cible: 'injecteur',
  choix: [{ t: 'Injecter la solution de référence', duree: 5, vers: 'cpg_ref' }],
});
add('cpg_ref', {
  lieu: 'Salle de chromatographie', pnj: 'ines', titre: 'Injection de la référence',
  fiches: ['mo3'],
  texte: e => { if (e.f.ei === 'butanol') { const d = donneesCpg(e).ref; return `Chromatogramme de la référence : éthanol ${nf(d.aE, 2)} % de l'aire, butan-1-ol ${nf(d.aEI, 2)} %. Les deux pics sont bien séparés. Rapport des aires éthanol / butan-1-ol de la référence : ${nf(d.aE / d.aEI, 3)}. Ce rapport te servira à doser l'éthanol dès que ton gel sera prêt : on injectera alors la solution échantillon dans les mêmes conditions.`; }
    return `Chromatogramme de la référence : un seul pic large et dissymétrique vers 1,4 min. L'éthanol (t_R ≈ 1,36 min) et le propan-1-ol (≈ 1,40 min) sortent presque en même temps : le logiciel ne propose qu'une aire pour l'ensemble.`; },
  visuels: e => e.f.ei === 'butanol' ? [{ type: 'chroma', titre: 'CPG · référence (éthanol + butan-1-ol)', tmax: 3, pics: [{ tr: 1.36, h: 0.5, l: 'éthanol' }, { tr: 2.1, h: 0.9, l: 'butan-1-ol (EI)' }] }] : [{ type: 'chroma', titre: 'CPG · référence (éthanol + propan-1-ol)', tmax: 3, pics: [{ tr: 1.36, h: 0.8, l: 'éthanol + propan-1-ol' }, { tr: 1.42, h: 0.6, l: '' }] }],
  choix: e => e.f.ei === 'butanol' ? [{ t: 'Retour à la paillasse', duree: 10, vers: 'hub', run: n => marquer(n, 'cpgPrep'), note: 'Référence CPG injectée avec le butan-1-ol : rapport des aires relevé.' }] : [
    { t: 'Essayer de séparer les deux pics en réglant l\'appareil', d: 'Températures de l\'injecteur, du four et du détecteur, pression du gaz vecteur.', duree: 0, vers: 'cpg_sim' },
    { t: 'Changer d\'étalon interne', d: 'Il faudra refaire la fiole de référence.', duree: 5, vers: 'cpg_ei', note: 'Référence CPG : coélution éthanol / propan-1-ol constatée.' },
    { t: 'Exploiter quand même ces aires, en séparant les deux pics au logiciel', duree: 10, vers: 'hub', run: n => marquer(n, 'cpgPrep'), f: { coelIgnore: true, errCoel: true }, note: 'Référence CPG : aires exploitées malgré la coélution.' },
  ],
});
add('cpg_inj', {
  lieu: 'Salle de chromatographie', pnj: 'ines', titre: 'Éthanol du gel formulé : étalon interne',
  texte: e => { const d = donneesCpg(e); return `Gel formulé : m' = ${nf(d.mP, 3)} g pesés dans la fiole de 20 mL (avec 500 µL de ${eiNom(e)}).\nRéférence : éthanol ${nf(d.ref.aE, 2)} %, ${eiNom(e)} ${nf(d.ref.aEI, 2)} % de l'aire (V_réf = 250 µL).\nÉchantillon : éthanol ${nf(d.ech.aE, 2)} %, ${eiNom(e)} ${nf(d.ech.aEI, 2)} % de l'aire.\n(Aires moyennées sur trois injections de chaque solution.)`; },
  formule: 'cpgEI',
  hyp: "Hypothèses : l'aire est proportionnelle à la quantité injectée pour chaque composé ; le facteur de réponse éthanol / EI est constant ; chaque solution est injectée trois fois et les aires sont moyennées (une injection seule a une dispersion d'environ 3 à 4 %, la moyenne d'environ 2 %) ; la méthode à un seul point de référence porte cette dispersion entièrement.",
  visuels: e => { const d = donneesCpg(e); return [{ type: 'chroma', titre: 'CPG · échantillon (gel formulé)', tmax: 3, pics: e.f.ei === 'butanol' ? [{ tr: 1.36, h: 0.5 * d.rE / d.rR, l: 'éthanol' }, { tr: 2.1, h: 0.9, l: 'butan-1-ol (EI)' }] : [{ tr: 1.36, h: 0.8, l: 'éthanol + propan-1-ol' }, { tr: 1.42, h: 0.6, l: '' }] }]; },
  aide: { pnj: 'ines', textes: [
    () => '« Avec le même étalon interne dans les deux solutions, que te permet de comparer le rapport des aires éthanol / étalon interne ? »',
    () => '« Ce rapport est proportionnel à la quantité d\'éthanol. Compare celui de l\'échantillon à celui de la référence pour trouver le volume d\'éthanol de l\'échantillon. »',
    () => '« V_éch = V_réf × (rapport éch) / (rapport réf). Passe en masse avec 0,789 g/mL, puis divise par m\'. »'] },
  calcul: { q: 'Quel est le pourcentage massique d\'éthanol dans le gel (méthode de l\'étalon interne, un point) ?', unite: '%', vrai: e => donneesCpg(e).pctSimple, tol: 0.03, cs: 1, indice: 'V_éch = V_réf × (%A_EI,réf / %A_EtOH,réf) × (%A_EtOH,éch / %A_EI,éch). Puis m_EtOH = V_éch × 0,789 g/mL, et divise par m\'.',
    ok: { vers: 'cpg_conclu', duree: 10 }, ko: { vers: 'cpg_conclu', duree: 0 } },
});
add('cpg_conclu', {
  lieu: 'Salle de chromatographie', pnj: 'ines', titre: 'Éthanol : résultat',
  texte: e => { const d = donneesCpg(e); return `Par la méthode de l'étalon interne (référence et échantillon dans les mêmes conditions), le gel contient ${nf(d.pctSimple, 1)} % d'éthanol. Le facteur de réponse n'intervient pas : il est le même dans les deux solutions. Les aires sont des moyennes de trois injections, dispersion d'environ 2 % par solution, soit 3 % sur le résultat : retiens ce résultat avec cette incertitude quand tu le compareras à l'exigence (${nf(SPEC.eth[0], 1)} à ${nf(SPEC.eth[1], 1)} %).`; },
  choix: [{ t: 'Noter le résultat', duree: 2, vers: 'hub', run: n => marquer(n, 'ethQC'), f: { ethMes: true }, note: 'Éthanol : résultat obtenu par étalon interne.' }],
});
add('cpg_gamme_plan', {
  lieu: 'Salle de chromatographie', pnj: 'moi', station: 'plan', titre: 'Éthanol : concevoir ma gamme',
  texte: e => `Pour une méthode plus fiable que le point unique, tu prépares une gamme de fioles de 20 mL contenant chacune 500 µL de ${eiNom(e)} et un volume V d'éthanol, et tu traces r = %A(éthanol) / %A(étalon interne) en fonction de V. Ton échantillon contient environ ${nf(donneesCpg(e).mP * ETH_PUR_COM / 100 / RHO_ETOH * 1000, 0)} µL d'éthanol si le gel est conforme. À toi de fixer la gamme.`,
  hyp: "Hypothèse de travail : r est proportionnelle au volume d'éthanol sur la plage choisie.",
  aide: { pnj: 'ines', textes: [
    () => '« Ton échantillon contient environ la même quantité d\'éthanol que la référence. Ta gamme doit l\'encadrer, et mieux vaut prévoir plusieurs fioles par niveau pour voir la dispersion des injections. »',
    () => '« Prends des volumes allant d\'environ 0,4 à 2 fois la quantité attendue, avec cinq niveaux et deux fioles par niveau. La micropipette de 100 à 1 000 µL est plus juste que celle de 20 à 200 µL pour ces volumes. »',
    () => '« Je ferais : 5 niveaux de 100 à 600 µL d\'éthanol, deux fioles par niveau. »'],
    valeurs: () => ({ vmin: 100, vmax: 600, n: 5, rep: 2 }) },
  plan: { infos: ['Micropipettes disponibles : 20 à 200 µL, 100 à 1 000 µL, 1 à 5 mL. Une injection dure environ 3 minutes ; vingt fioles de 20 mL au plus.', 'Éthanol absolu pour la gamme ; étalon interne : 500 µL de propan-1-ol ou de butan-1-ol par fiole, selon ton choix.'], vers: 'cpg_gamme', duree: v => 6 + 2 * v.n * v.rep, note: v => `CPG, gamme : ${v.n} niveaux de ${v.vmin} à ${v.vmax} µL d'éthanol, ${v.rep} fiole(s) par niveau.`,
    champs: [{ id: 'vmin', l: 'Plus petit volume d\'éthanol', u: 'µL', min: 20, max: 5000 }, { id: 'vmax', l: 'Plus grand volume d\'éthanol', u: 'µL', min: 20, max: 5000 }, { id: 'n', l: 'Nombre de niveaux', u: '', min: 3, max: 8, entier: true }, { id: 'rep', l: 'Fioles par niveau', u: '', min: 1, max: 3, entier: true }],
    controle: v => v.vmax <= v.vmin ? 'Le plus grand volume doit dépasser le plus petit.' : v.n * v.rep > 20 ? 'Vingt fioles de 20 mL au plus.' : null,
    apercu: v => ({ cols: ['Niveau', 'Éthanol (µL)', 'Fioles'], lignes: niveaux(v.vmin, v.vmax, v.n).map((x, i) => [String(i + 1), String(x), String(v.rep)]) }) },
});
add('cpg_gamme', {
  lieu: 'Salle de chromatographie', pnj: 'ines', titre: 'Éthanol : ta gamme',
  texte: e => { const d = donneesCpg(e), pg = e.f.plans?.cpg_gamme_plan || { n: 5, rep: 2, vmin: 100, vmax: 1000 }; return `Tu as préparé ${pg.n * pg.rep} fioles (${pg.n} niveaux de ${pg.vmin} à ${pg.vmax} µL d'éthanol, ${pg.rep} par niveau) avec 500 µL de ${eiNom(e)}, et tracé r = %A(EtOH) / %A(EI) en fonction de V(EtOH). Régression : r = a·V + b avec a = ${nf(d.a, 6)} µL⁻¹, b = ${nf(d.b, 4)}, R² = ${nf(d.r2, 4)}.\nPour l'échantillon : r = ${nf(d.rE, 4)}.`; },
  formule: 'gamme',
  hyp: "Hypothèses : relation linéaire sur la plage choisie ; dispersion identique à tous les niveaux (homoscédasticité) ; résidus aléatoires, sans tendance. Vérifie le graphique des résidus.",
  visuels: e => { const d = donneesCpg(e); return [{ type: 'droite', titre: 'Gamme CPG : r = f(V éthanol)', xl: 'V éthanol (µL)', yl: 'r', pts: d.gamme.map(p => [p.v, p.r]), a: d.a, b: d.b, residus: d.residus, ech: d.a > 0 ? [(d.rE - d.b) / d.a, d.rE] : null }]; },
  choix: [{ t: 'Calculer le pourcentage d\'éthanol', duree: 0, vers: 'cpg_gamme_calc' }, { t: 'Refaire ma gamme autrement', d: 'Nouvelle préparation, nouvelles injections.', duree: 0, vers: 'cpg_gamme_plan' }],
});
add('cpg_gamme_calc', {
  lieu: 'Salle de chromatographie', pnj: 'ines', titre: 'Éthanol : calcul par la gamme',
  texte: e => { const d = donneesCpg(e); return `Droite r = a·V + b avec a = ${nf(d.a, 6)} µL⁻¹ et b = ${nf(d.b, 4)}. Échantillon : r = ${nf(d.rE, 4)} pour m' = ${nf(d.mP, 3)} g de gel.`; },
  formule: 'gamme',
  aide: { pnj: 'ines', textes: [
    () => '« Sur ta gamme, que porte-t-on en abscisse et en ordonnée ? Que cherches-tu à partir du rapport de ton échantillon ? »',
    () => '« Inverse la droite : V = (r − b) / a, volume d\'éthanol de l\'échantillon, en µL. »',
    () => '« m = V × 0,789 × 10⁻³ g. Divise par m\' pour avoir le pourcentage massique. »'] },
  calcul: { q: 'Quel est le pourcentage massique d\'éthanol dans le gel (méthode de la gamme) ?', unite: '%', vrai: e => donneesCpg(e).pctGamme, tol: 0.03, cs: 1, indice: 'V_EtOH = (r_éch − b) / a, en µL. Puis m_EtOH = V × 0,789 g/mL = V × 0,789 × 10⁻³ g, et divise par m\'.',
    ok: { vers: 'cpg_comp', duree: 5 }, ko: { vers: 'cpg_comp', duree: 0 } },
});
add('cpg_comp', {
  lieu: 'Salle de chromatographie', pnj: 'ines', titre: 'Les deux méthodes concordent-elles ?',
  texte: e => { const d = donneesCpg(e); return `Étalon interne à un point : ${nf(d.pctSimple, 1)} %. Gamme : ${nf(d.pctGamme, 1)} %. Écart : ${nf(Math.abs(d.pctSimple - d.pctGamme), 1)} points.\nQuel commentaire est le plus juste ?`; },
  choix: [
    { t: 'L\'écart est de l\'ordre de la dispersion d\'une injection (≈ 4 %) ; la gamme, qui s\'appuie sur plusieurs points, est plus fiable : je retiens son résultat', duree: 5, vers: 'hub', run: n => marquer(n, 'ethQC'), f: { ethMes: true }, note: 'Éthanol : résultat de la gamme retenu, écart avec le point unique commenté.' },
    { t: 'Les deux méthodes sont équivalentes : je fais la moyenne', duree: 5, vers: 'hub', run: n => marquer(n, 'ethQC'), f: { ethMes: true, errComp: true }, note: 'Éthanol : moyenne des deux méthodes, sans discussion de leur fiabilité.' },
    { t: 'L\'écart prouve que le gel perd de l\'éthanol à l\'air', duree: 5, vers: 'hub', run: n => marquer(n, 'ethQC'), f: { ethMes: true, errComp: true }, note: 'Éthanol : écart attribué à une perte, sans preuve.' },
  ],
});

// ───────────── Titrage des acides du Synthalen K (matière première) ─────────────
// Volumes de soude versés : pas grossier, pas fin dans la zone [vdeb ; vfz] autour de l'équivalence, puis de nouveau le pas grossier.
export function volumesTitr(P) {
  const vdeb = P.vdeb ?? 0, vfz = P.vfz ?? 0, dvf = P.dvf ?? P.dv, vols = [0]; let v = 0;
  const jusque = (lim, pas) => { while (v < lim - 1e-9) { v = Math.min(v + pas, lim); vols.push(Math.round(v / 0.05) * 0.05); } };
  jusque(vdeb, P.dv); jusque(vfz, dvf); jusque(P.vfin, P.dv);
  return [...new Set(vols.map(x => arr(x, 2)))];
}
// Méthodes de suivi du titrage et indicateurs colorés du laboratoire (liste de la simulation « Acides et bases »)
export const INDIC_ADAPTES = ['bth', 'php'];   // zone de virage contenant le pH à l'équivalence (acide faible titré par une base forte)
export const COULEURS_INDIC = { jm: ['rouge', 'jaune'], vbc: ['jaune', 'bleu'], bbt: ['jaune', 'bleu'], bth: ['jaune', 'bleu'], php: ['incolore', 'rose'], jar: ['jaune', 'brun'] };
const regL = P => { const n = P.length, sx = P.reduce((s, p) => s + p[0], 0), sy = P.reduce((s, p) => s + p[1], 0), sxx = P.reduce((s, p) => s + p[0] * p[0], 0), sxy = P.reduce((s, p) => s + p[0] * p[1], 0), b = (n * sxy - sx * sy) / (n * sxx - sx * sx); return { a: (sy - b * sx) / n, b }; };
const sseL = (P, r) => P.reduce((s, p) => s + (p[1] - r.a - r.b * p[0]) ** 2, 0);
// Cassure de la courbe de conductivité : meilleure paire de droites (somme des carrés des écarts minimale), abscisse de leur intersection
export function cassure(pts) {
  let best = null;
  for (let k = 2; k <= pts.length - 3; k++) { const A = regL(pts.slice(0, k + 1)), B = regL(pts.slice(k)), s = sseL(pts.slice(0, k + 1), A) + sseL(pts.slice(k), B); if (!best || s < best.s) best = { s, A, B }; }
  if (!best || Math.abs(best.A.b - best.B.b) < 1e-9) return null;
  const v = (best.B.a - best.A.a) / (best.A.b - best.B.b); return v > pts[0][0] && v < pts[pts.length - 1][0] ? { v, A: best.A, B: best.B } : null;
}
export function donneesTitr(e) {
  const P = planDe(e, 'titr_carb_plan') || { m: 0.2, V0: 100, c: 0.1, vfin: 12, dv: 0.5 }, w = coohLot(e), suivi = e.f?.suivi || 'ph', ind = suivi === 'ind' ? INDICATEURS.find(i => i.id === e.f.indic) : null;
  const n = P.m * w / M_COOH, veq = n / P.c * 1000;           // mol ; mL
  const epais = P.m / P.V0 * 100 > 0.6, sig = epais ? 0.22 : 0.04, vols = volumesTitr(P), N = vols.length - 1;
  const pHw = a => 6 + 2 * Math.log10((a + 0.02) / (1 - a + 0.02));
  const pH = v => { const a = P.c * v / 1000 / n; if (a < 0.995) return Math.max(2.8, pHw(a)); return Math.max(pHw(0.995), 14 + Math.log10(Math.max(1e-9, P.c * v / 1000 - n) / ((P.V0 + v) / 1000))); };
  const base = { P, w, n, veq, epais, N, suivi, ind, vols };
  const fin = (pts, extra) => ({ ...base, pts, der: [], iVirage: null, atteint: false, vEq: null, pctMes: null, ...extra, ...(extra.vEq ? { pctMes: P.c * extra.vEq / 1000 * M_COOH / P.m * 100 } : {}) });
  if (suivi === 'ind') {
    const pts = vols.map(v => [v, arr(pH(v), 2)]), iV = ind ? pts.findIndex((p, i) => i > 0 && pH(p[0]) >= ind.pKa) : -1;
    return fin(pts, { iVirage: iV >= 0 ? iV : null, atteint: iV >= 0, vEq: iV >= 0 ? pts[iV][0] : null });
  }
  if (suivi === 'cond') {
    // σ (mS/cm) = (0,04·V₀ + 10·λ·n_ajouté) / (V₀ + V) : Na⁺ avec le polyanion avant l'équivalence (λ ≈ 3), Na⁺ et HO⁻ en excès après (λ ≈ 24,9 mS·m²/mol) ; n en mmol
    const nmm = n * 1000, kk = v => (0.04 * P.V0 + 10 * 3 * Math.min(P.c * v, nmm) + 10 * 24.9 * Math.max(0, P.c * v - nmm)) / (P.V0 + v);
    const pts = vols.map((v, i) => [v, arr(kk(v) + 0.004 * (epais ? 3 : 1) * gauss(e.f.graine, `cd${i}`), 3)]);
    const avant = pts.filter(p => p[0] < veq * 0.95).length, apres = pts.filter(p => p[0] > veq * 1.05).length, c = avant >= 3 && apres >= 3 ? cassure(pts) : null;
    return fin(pts, { atteint: !!c, vEq: c ? arr(c.v, 2) : null, cass: c });
  }
  if (suivi === 'pt') return fin(vols.map((v, i) => [v, arr(248 + 0.25 * v + 3.5 * gauss(e.f.graine, `pt${i}`), 0)]), {});
  const pts = vols.map((v, i) => [v, arr(Math.min(12.4, pH(v) + sig * gauss(e.f.graine, `tc${i}`)), 2)]);
  const der = pts.slice(1).map((p, i) => [arr((p[0] + pts[i][0]) / 2, 2), arr((p[1] - pts[i][1]) / (p[0] - pts[i][0]), 2)]);
  let k = 0; der.forEach((d, i) => { if (d[1] > der[k][1]) k = i; });
  const atteint = P.vfin >= veq * 1.03 && N >= 4, vEq = atteint ? der[k][0] : null;
  return { ...base, pts, der, iVirage: null, atteint, vEq, pctMes: vEq ? P.c * vEq / 1000 * M_COOH / P.m * 100 : null };
}
// Grandeurs affichées selon la méthode de suivi (courbe, appareil de mesure)
export const GRANDEUR_TITR = {
  ph: { nom: 'pH-mètre', y: 'pH', unite: '', dec: 2, yr: [2, 13] },
  cond: { nom: 'conductimètre', y: 'σ (mS/cm)', unite: 'mS/cm', dec: 3, yr: null },
  pt: { nom: 'voltmètre', y: 'E (mV)', unite: 'mV', dec: 0, yr: [150, 350] },
};
export const phReel = (e, v) => { const d = donneesTitr(e), a = d.P.c * v / 1000 / d.n, pHw = x => 6 + 2 * Math.log10((x + 0.02) / (1 - x + 0.02)); return a < 0.995 ? Math.max(2.8, pHw(a)) : Math.max(pHw(0.995), 14 + Math.log10(Math.max(1e-9, d.P.c * v / 1000 - d.n) / ((d.P.V0 + v) / 1000))); };
add('titr_suivi', {
  fiches: ['synthalen'],
  lieu: 'Salle de titrage', pnj: 'moi', titre: 'Comment suivre le titrage ?',
  texte: () => `Tu vas titrer les groupes acide carboxylique du Synthalen K par de la soude. Le laboratoire propose plusieurs façons de repérer l'équivalence. Aucune n'est imposée, le choix t'appartient.`,
  choix: e => melange(e, 'suivi', [
    { id: 'ph', t: 'Électrode de verre combinée et pH-mètre', d: 'Courbe pH = f(V) ; étalonnage préalable avec deux solutions tampons (5 min).', duree: 5, vers: 'titr_carb_plan', f: { suivi: 'ph' }, note: 'Titrage du Synthalen K : suivi avec une électrode combinée et un pH-mètre.' },
    { id: 'ind', t: 'Indicateur coloré', d: 'À choisir dans la liste du laboratoire.', duree: 0, vers: 'titr_indic', f: { suivi: 'ind' } },
    { id: 'cond', t: 'Sonde conductimétrique', d: 'Courbe conductivité = f(V) ; cellule à rincer et à plonger dans la dispersion (3 min).', duree: 3, vers: 'titr_carb_plan', f: { suivi: 'cond' }, note: 'Titrage du Synthalen K : suivi avec une sonde conductimétrique.' },
    { id: 'pt', t: 'Électrode de platine et électrode de référence Ag/AgCl', d: 'Mesure de la tension entre les deux électrodes (3 min de montage).', duree: 3, vers: 'titr_carb_plan', f: { suivi: 'pt' }, run: n => ({ ...n, f: { ...n.f, errSuivi: (n.f.errSuivi || 0) + 1 } }), note: 'Titrage du Synthalen K : suivi avec une électrode de platine et une électrode de référence Ag/AgCl.' },
  ]),
});
add('titr_indic', {
  fiches: ['synthalen'],
  lieu: 'Salle de titrage', pnj: 'moi', titre: 'Quel indicateur coloré ?',
  texte: () => `Voici les indicateurs colorés disponibles au laboratoire, avec leur zone de virage. Tu repéreras l'équivalence au changement de couleur de la dispersion.`,
  choix: e => melange(e, 'indic', INDICATEURS.map(i => ({ id: i.id, t: `${i.nom}${i.id === 'php' ? ' (CMR)' : ''}`, d: `zone de virage de pH ${nf(i.zone[0], 1)} à ${nf(i.zone[1], 1)}`, duree: 0, vers: 'titr_carb_plan', f: { indic: i.id },
    run: n => INDIC_ADAPTES.includes(i.id) ? n : { ...n, f: { ...n.f, errSuivi: (n.f.errSuivi || 0) + 1 } }, note: `Titrage du Synthalen K : suivi avec un indicateur coloré (${i.nom}).` }))),
});
add('titr_live', {
  fiches: ['synthalen'],
  lieu: 'Salle de titrage', pnj: 'moi', station: 'titrage', titre: 'Le titrage',
  texte: e => { const d = donneesTitr(e), L = { ph: `Tu as étalonné le pH-mètre et plongé l'électrode dans la dispersion agitée.`, ind: `Tu as ajouté quelques gouttes de ${d.ind ? d.ind.nom : 'l\'indicateur'} dans la dispersion agitée.`, cond: `Tu as rincé la cellule et tu l'as plongée dans la dispersion agitée.`, pt: `Tu as monté les deux électrodes et tu les as plongées dans la dispersion agitée.` };
    return `${L[d.suivi]} La burette contient la soude à ${nf(d.P.c, 2)} mol/L. Tu verses selon ton plan, un ajout à la fois : ${d.vols.length - 1} ajouts jusqu'à ${nf(d.P.vfin, 1)} mL.`; },
  choix: [{ t: 'Passer aux résultats', duree: 0, vers: 'titr_carb' }],
});
add('titr_carb_plan', {
  fiches: ['synthalen'],
  lieu: 'Salle de titrage', pnj: 'moi', station: 'plan', titre: 'Titrer les acides du Synthalen K',
  texte: () => `Le Synthalen K est un polymère de l'acide acrylique réticulé : ses groupes acide carboxylique (–COOH, M = ${nf(M_COOH, 2)} g/mol pour le motif COOH ; la fiche technique donne la masse équivalente du polymère) sont neutralisés par la trolamine pour former le gel. Connaître leur quantité dans ton lot permet de calculer la base à prévoir. Tu disperses une masse m de poudre dans un volume d'eau, et tu la titres à la soude. À toi de concevoir ce titrage.`,
  hyp: "Hypothèses : tous les groupes COOH sont accessibles à la soude ; le milieu reste assez fluide pour que la mesure se stabilise ; l'équivalence est repérée selon la méthode de suivi choisie (maximum de dpH/dV, cassure des droites de conductivité, virage de l'indicateur).",
  aide: { pnj: 'lucas', textes: [
    () => '« Commence par une estimation : combien de mmol de COOH dans ta prise d\'essai ? La fiche technique donne la masse équivalente du Synthalen K : combien de grammes de polymère par mole de COOH ? Et combien de mL de soude cela demandera-t-il ? Il faut que ce volume tienne largement dans la burette. »',
    () => '« n(COOH) ≈ m / 76 mol. Pour 0,1 g, ça fait environ 1,3 mmol, donc 13 mL de soude à 0,1 mol/L. Verse vite, de 1 mL en 1 mL, loin de l\'équivalence, et resserre les ajouts de 2 mL avant à 2 mL après le volume équivalent attendu. Reste en dessous de 0,5 g de poudre pour 100 mL d\'eau, sinon ça épaissit trop. »',
    () => '« Je ferais : 0,100 g de Synthalen K dans 150 mL d\'eau, soude à 0,1 mol/L, pas de 1 mL, avec des ajouts de 0,25 mL entre 11 et 16 mL, jusqu\'à 18 mL. Je te laisse changer ce que tu veux. »'],
    valeurs: () => ({ m: 0.1, V0: 150, c: 0.1, dv: 1, vdeb: 11, vfz: 16, dvf: 0.25, vfin: 18 }) },
  plan: { ordi: true, materiel: [['⚖️ Balance', 'précise à 0,1 mg'], ['🧪 Soude disponible', '0,1 mol/L ou 0,5 mol/L'], ['📏 Burette', '25 mL, graduée tous les 0,05 mL']], infos: ['Une autre concentration de soude demande une dilution de 5 min.', 'Le Synthalen K se disperse lentement dans l\'eau et épaissit quand il se neutralise : une prise d\'essai trop concentrée rend la mesure difficile. Compte 10 min de dispersion, puis environ 30 s par point de mesure (ajout, agitation, lecture) ; 60 points au plus.'],
    vers: 'titr_live', duree: v => 10 + Math.round(0.5 * (volumesTitr(v).length - 1)) + ([0.1, 0.5].includes(v.c) ? 0 : 5), note: v => `Titrage du Synthalen K : ${nf(v.m, 3)} g dans ${v.V0} mL d'eau, soude à ${nf(v.c, 2)} mol/L, pas de ${nf(v.dv, 2)} mL, pas de ${nf(v.dvf, 2)} mL entre ${nf(v.vdeb, 1)} et ${nf(v.vfz, 1)} mL, jusqu'à ${nf(v.vfin, 1)} mL.`,
    champs: [{ id: 'm', l: 'Masse de Synthalen K', u: 'g', min: 0.02, max: 1.5 }, { id: 'V0', l: 'Volume d\'eau', u: 'mL', min: 50, max: 500 }, { id: 'c', l: 'Concentration de la soude', u: 'mol/L', min: 0.01, max: 1 }, { id: 'dv', l: 'Pas d\'addition (loin de l\'équivalence)', u: 'mL', min: 0.05, max: 2 }, { id: 'vdeb', l: 'Début de la zone d\'ajouts fins', u: 'mL', min: 0, max: 25 }, { id: 'vfz', l: 'Fin de la zone d\'ajouts fins', u: 'mL', min: 0, max: 25 }, { id: 'dvf', l: 'Pas d\'addition dans la zone fine', u: 'mL', min: 0.05, max: 2 }, { id: 'vfin', l: 'Volume final de soude versé', u: 'mL', min: 1, max: 25 }],
    controle: v => v.vfz < v.vdeb ? 'La zone fine doit finir après son début (mets les deux au même volume pour ne pas en faire).' : v.vfz > v.vfin ? 'La zone fine doit se terminer avant le volume final.' : v.dvf > v.dv ? 'Le pas fin doit être inférieur ou égal au pas habituel.' : volumesTitr(v).length - 1 > 60 ? 'Soixante points de mesure au plus : augmente les pas ou réduis la zone fine.' : volumesTitr(v).length - 1 < 4 ? 'Il faut au moins quatre additions.' : null,
    apercu: v => ({ cols: ['Grandeur', 'Valeur'], lignes: [['Synthalen K dans la dispersion', `${nf(v.m / v.V0 * 100, 2)} g pour 100 mL d'eau`], ['Mesures de pH', String(volumesTitr(v).length)], ['Zone d\'ajouts fins', v.vfz > v.vdeb ? `de ${nf(v.vdeb, 1)} à ${nf(v.vfz, 1)} mL, pas de ${nf(v.dvf, 2)} mL` : 'aucune'], ['Soude versée au maximum', `${nf(v.c * v.vfin, 1)} mmol`]] }) },
});
add('titr_carb', {
  lieu: 'Salle de titrage', pnj: 'moi', titre: 'Titrage du Synthalen K : ton résultat',
  texte: e => { const d = donneesTitr(e), debut = `Tu as titré ${nf(d.P.m, 3)} g de Synthalen K dans ${d.P.V0} mL d'eau par de la soude à ${nf(d.P.c, 2)} mol/L (${d.pts.length} points).${d.epais ? ' Le milieu est épais : la mesure se stabilise mal et les points sont dispersés.' : ''}`;
    if (d.suivi === 'ind') { const cc = d.ind ? COULEURS_INDIC[d.ind.id] : ['', '']; return d.atteint
      ? `${debut}\nLe ${d.ind.nom} a viré du ${cc[0]} au ${cc[1]} pour un volume de soude versé V_éq = ${nf(d.vEq, 2)} mL.`
      : `${debut}\nLe ${d.ind ? d.ind.nom : 'l\'indicateur'} n'a pas changé de couleur dans l'intervalle de volumes versés : tu n'as pas repéré l'équivalence.`; }
    if (d.suivi === 'cond') return d.atteint
      ? `${debut}\nLes deux portions de droite de la courbe σ = f(V) se coupent à V_éq = ${nf(d.vEq, 2)} mL.`
      : `${debut}\nTu n'as pas assez de points de part et d'autre de la cassure de la courbe de conductivité pour la repérer.`;
    if (d.suivi === 'pt') return `${debut}\nLa tension mesurée reste voisine de 250 mV pendant tout le titrage, sans saut ni changement de pente.`;
    return d.atteint
      ? `${debut}\nLe maximum de la courbe dérivée est à V_éq = ${nf(d.vEq, 2)} mL.`
      : `Tu as versé jusqu'à ${nf(d.P.vfin, 1)} mL de soude à ${nf(d.P.c, 2)} mol/L : le pH monte sans jamais présenter de saut net, ou tu n'as pas assez de points pour le repérer. Tu n'as pas atteint l'équivalence.`; },
  visuels: e => { const d = donneesTitr(e); if (d.suivi === 'ind') return []; if (d.suivi === 'ph') return [{ type: 'titrage', titre: 'Titrage du Synthalen K : pH = f(V soude)', pts: d.pts, der: d.der, veq: d.vEq }];
    const g = GRANDEUR_TITR[d.suivi]; return [{ type: 'titrage', titre: `Titrage du Synthalen K : ${g.y} = f(V soude)`, pts: d.pts, der: [], veq: d.suivi === 'cond' ? d.vEq : null, y: g.y, yr: g.yr, droites: d.cass ? [d.cass.A, d.cass.B] : null }]; },
  hyp: 'Hypothèse : le saut de pH, très étalé pour un polyélectrolyte, est repéré au maximum de la dérivée ; avec la conductivité, l\'équivalence est à l\'intersection des deux droites ; avec un indicateur, au changement de couleur. L\'incertitude sur V_éq est de l\'ordre du pas d\'addition.',
  choix: e => donneesTitr(e).atteint
    ? [{ t: 'Calculer la teneur en groupes COOH', duree: 0, vers: 'titr_carb_calc' }, { t: 'Refaire le titrage autrement', d: 'Nouvelle prise d\'essai, nouvelle mesure.', duree: 0, vers: 'titr_suivi' }]
    : [{ t: 'Refaire le titrage autrement', d: 'Nouvelle prise d\'essai, nouvelle mesure.', duree: 0, vers: 'titr_suivi' }, { t: 'Renoncer à ce dosage', duree: 0, vers: 'hub', note: 'Titrage du Synthalen K abandonné.' }],
});
add('titr_carb_calc', {
  fiches: ['synthalen'],
  visuels: e => SCENES.titr_carb.visuels(e),
  lieu: 'Salle de titrage', pnj: 'moi', titre: 'Teneur en groupes acides',
  texte: e => { const d = donneesTitr(e); return `Prise d'essai m = ${nf(d.P.m, 3)} g de Synthalen K ; soude à c = ${nf(d.P.c, 2)} mol/L ; équivalence à V_éq = ${nf(d.vEq, 2)} mL. Un groupe COOH consomme un ion hydroxyde.`; },
  hyp: "Hypothèse : chaque COOH du polymère réagit avec un seul HO⁻ ; la masse de COOH est calculée avec M = 45,02 g/mol (motif –COOH).",
  aide: { pnj: 'lucas', textes: [
    () => '« À l\'équivalence, combien de moles de HO⁻ as-tu versées, et à quoi correspondent-elles ? »',
    () => '« Chaque groupe COOH réagit avec un HO⁻ : n(COOH) = n(HO⁻ versées) = c × V_éq. »',
    () => '« m(COOH) = n × 45,02 g/mol, avec V_éq en litres ; puis m(COOH) / m(poudre) × 100. »'] },
  calcul: { q: 'Quel est le pourcentage massique de groupes COOH dans le Synthalen K ?', unite: '%', vrai: e => donneesTitr(e).pctMes, tol: 0.04, cs: 1, indice: 'n(COOH) = c × V_éq (en mol, V en litres). Masse de COOH = n × 45,02 g/mol. Divise par la masse m de poudre.',
    ok: { vers: 'hub', duree: 5, run: n => ({ ...marquer(n, 'titrCarb'), f: { ...n.f, cooh: arr(donneesTitr(n).pctMes, 1) } }), note: 'Titrage du Synthalen K : teneur en groupes COOH déterminée.' },
    ko: { vers: 'hub', duree: 0, run: n => marquer(n, 'titrCarb') } },
});

// ───────────── Refaire un lot : les méthodes déjà au point ne sont pas à reconstruire ─────────────
const CAUSES_LOT = e => ecartsMes(e).map(d => ({ caf: 'la caféine', eth: 'l\'éthanol', visco: 'la viscosité' }[d])).join(', ');
add('relance', {
  lieu: 'Bureau de Mme Dubreuil', pnj: 'dubreuil', titre: 'Refaire un lot ?',
  texte: e => `Mme Dubreuil : « Il est ${horloge(e.t)}, il te reste ${duree(T_FIN - e.t)}. Tes résultats montrent un défaut (${CAUSES_LOT(e) || 'à vérifier'}). Tu peux refaire un lot en corrigeant ce qui l'a causé. La formule de départ et la rhéologie du témoin sont conservées ; tu peux corriger ce qui a causé le défaut. Les dosages déjà mis au point seront relancés avec les mêmes méthodes, résultat calculé pour toi. Compte environ 2 h à 2 h 30 pour le nouveau gel. Que décides-tu ? »`,
  choix: [
    { t: 'Refaire un lot : je reprends la formule et la fabrication', d: 'Les dosages au point sont relancés plus vite, sans refaire les calculs.', duree: 5, vers: 'hub',
      run: n => ({ ...n, fait: { ...n.fait, formule: false, fab: false, ph: false, rheoF: false, caf: false, ethQC: false }, bg: { ...n.bg, gel: undefined },
        f: { ...n.f, lot: (n.f.lot || 1) + 1, rapideCaf: !!(n.fait.caf || n.f.rapideCaf), rapideEth: !!(n.fait.ethQC || n.f.rapideEth), formuleMsg: undefined, fmBrouillon: n.f.fm ? Object.fromEntries(Object.entries(n.f.fm).map(([k, x]) => [k, String(x)])) : undefined, suspendu: undefined, trolAdd: undefined, phMes: undefined, phFinal: undefined, disp: undefined, mode: undefined, perteEth: undefined, ethAjout: undefined, compense: undefined, reprisePh: undefined, errBase: undefined, decl: undefined } }), note: 'Défaut constaté : décision de refaire un lot (formule, fabrication, contrôles).' },
    { t: 'Non : je conclus avec ce lot', duree: 0, vers: 'hub', run: n => ({ ...n, f: { ...n.f, relanceRefusee: n.f.lot || 1 } }), note: 'Pas de nouveau lot : je conclus avec le premier.' },
  ],
});
add('rapide_caf', {
  lieu: 'Salle de chromatographie', pnj: 'ines', titre: 'Caféine : dosage relancé',
  texte: e => `Tu relances le dosage avec la méthode déjà mise au point (${{ ajouts: 'UV, ajouts dosés', ext: 'UV, étalonnage externe', gamme: 'CLHP, gamme d\'étalonnage', EI: 'CLHP, étalon interne' }[e.f.methCaf] || 'la même méthode'}). Les solutions sont préparées comme la première fois, les mesures faites et le calcul refait pour toi.\nRésultat : caféine = ${nf(mesures(e).caf, 1)} % (exigence ${nf(SPEC.caf[0], 1)} à ${nf(SPEC.caf[1], 1)} %).`,
  choix: [{ t: 'Noter le résultat', duree: 40, vers: 'hub', run: n => marquer(n, 'caf'), note: 'Caféine du nouveau lot : dosage relancé avec la méthode déjà au point.' }],
});
add('rapide_eth', {
  lieu: 'Salle de chromatographie', pnj: 'ines', titre: 'Éthanol : dosage relancé',
  texte: e => `Tu relances le dosage CPG avec la méthode déjà mise au point. Solutions préparées, injections faites, calcul refait pour toi.\nRésultat : éthanol = ${nf(mesures(e).eth, 1)} % (exigence ${nf(SPEC.eth[0], 1)} à ${nf(SPEC.eth[1], 1)} %).`,
  choix: [{ t: 'Noter le résultat', duree: 40, vers: 'hub', run: n => marquer(n, 'ethQC'), note: 'Éthanol du nouveau lot : dosage relancé avec la méthode déjà au point.' }],
});

// ───────────── Conclusion ─────────────
export const mesures = e => ({ caf: e.f.cafMes === 'ext' ? donneesUv(e).pctExt : e.f.methCaf === 'ajouts' ? donneesUv(e).pctAjouts : e.f.methCaf === 'gamme' ? donneesHplcGamme(e).pct : donneesHplc(e).pct, eth: donneesCpg(e).pctGamme, q: gelVrai(e).q });
add('verdict', {
  lieu: 'Bureau de Mme Dubreuil', pnj: 'dubreuil', titre: 'Le contretype est-il conforme ?',
  texte: e => { const m = mesures(e); return `Mme Dubreuil : « Je t'écoute. Qu'écris-tu sur le bon de contrôle ? »\nTes résultats : caféine ${nf(m.caf, 1)} % (exigence ${nf(SPEC.caf[0], 1)} à ${nf(SPEC.caf[1], 1)} %) ; éthanol ${nf(m.eth, 1)} % (exigence ${nf(SPEC.eth[0], 1)} à ${nf(SPEC.eth[1], 1)} %) ; viscosité : rapport des contraintes ${nf(m.q, 2)} (au moins ${nf(SPEC.q, 2)}).`; },
  hyp: "Règle de décision du scénario : un résultat est conforme s'il est dans la plage exigée ; l'incertitude de mesure n'est pas ajoutée à la plage.",
  choix: [
    { t: 'Conforme sur les trois critères', vers: e => verdictVers(e, 'conforme') },
    { t: 'Non conforme : la caféine', f: { decl: 'caf' }, vers: e => verdictVers(e, 'caf') },
    { t: 'Non conforme : l\'éthanol', f: { decl: 'eth' }, vers: e => verdictVers(e, 'eth') },
    { t: 'Non conforme : la viscosité', f: { decl: 'visco' }, vers: e => verdictVers(e, 'visco') },
  ],
});

// Cause probable du défaut : la vérité vient de l'historique réel de la partie (procédé, formule, pH), pas d'un tirage.
const NOMS_DEFAUT = { caf: 'la teneur en caféine', eth: 'la teneur en éthanol', visco: 'la viscosité' };
export function causesDe(e) {
  const f = e.f, fm = f.fm || FORMULE_REPLI, g = gelVrai(e);
  const L = {
    eth: [
      { t: 'De l\'éthanol s\'est échappé pendant la fabrication (chauffage sans reflux, récipient ouvert)', vrai: (f.perteEth || 0) > 0.06 },
      { t: 'La masse d\'éthanol à 96 % pesée était trop faible', vrai: fm.eth96 < 75 },
      { t: 'L\'étalon interne de la CPG était mal choisi', vrai: false },
      { t: 'La caféine a réagi avec l\'éthanol', vrai: false },
    ],
    caf: [
      { t: 'La masse de caféine pesée ne correspondait pas à 5 % du lot', vrai: fm.caf < 9 || fm.caf > 11 },
      { t: 'La caféine s\'est évaporée pendant la fabrication', vrai: false },
      { t: 'Le dosage par étalon interne est faussé par la benzoïne', vrai: false },
      { t: 'La caféine a été dégradée par la trolamine', vrai: false },
    ],
    visco: [
      { t: 'Le Synthalen K n\'a pas été bien dispersé avant d\'ajouter la base (grumeaux)', vrai: f.disp === 'grumeaux' || !!f.errBase },
      { t: 'Le pH final est resté trop bas : le Synthalen K n\'est pas assez neutralisé', vrai: g.ph < 6 },
      { t: 'La masse de Synthalen K pesée était trop faible', vrai: fm.carb < 1.3 },
      { t: 'L\'éthanol a fluidifié le gel', vrai: false },
    ],
  }[f.decl || 'eth'];
  // si aucune cause « vraie » ne se détache (défaut léger), la plus plausible est celle de l'historique le plus marqué
  if (!L.some(c => c.vrai)) { if (f.decl === 'eth') L[0].vrai = true; else if (f.decl === 'visco') L[1].vrai = true; else L[0].vrai = true; }
  const rot = Math.floor(unif(f.graine, 'rotcause') * L.length);
  return [...L.slice(rot), ...L.slice(0, rot)];
}
add('cause', {
  lieu: 'Bureau de Mme Dubreuil', pnj: 'dubreuil', titre: 'Quelle cause probable ?',
  texte: e => `« Tu écris que ${NOMS_DEFAUT[e.f.decl || 'eth']} est hors exigence. Sur le bon de contrôle, quelle cause probable proposes-tu ? Pense à ce que tu as fait depuis ce matin. »\nTon cahier de laboratoire garde la trace de tes choix.`,
  choix: e => causesDe(e).map(c => ({ t: c.t, vers: c.vrai ? 'fin_detecte' : 'fin_mauvaise_cause', f: { causeJuste: !!c.vrai } })),
});
const verdictVers = (e, decl) => { const D = defauts(e);
  if (!D.length) return decl === 'conforme' ? 'fin_conforme' : 'fin_faux_nok';
  if (decl === 'conforme') return 'fin_faux_ok';
  return D.includes(decl) ? 'cause' : 'fin_mauvaise_cause'; };
const fin = (id, ton, titre, texte) => add(id, { lieu: 'Bureau de Mme Dubreuil', pnj: 'dubreuil', titre, fin: { ton, titre }, texte, choix: [] });
fin('fin_conforme', 'ok', 'Contretype conforme', e => ecartsMes(e).length ? `« Le gel est conforme. Mais ton dossier dit autre chose : ${causeMesure(e)}, et ce résultat reste hors exigence dans ton rapport. Une mesure qui contredit tout le reste se vérifie avant de conclure. »\nTu as fini à ${horloge(e.t)}.` : e.f.extAccepte ? `« Le gel est bien conforme, mais pas grâce à ton dossier : ton dosage UV par étalonnage externe surestimait la caféine, tu avais retenu ce résultat, et il contredit ta conclusion. Sans une seconde méthode, personne ne pourrait te croire. »\nTu as fini à ${horloge(e.t)}.` : `« Le gel est conforme : caféine, éthanol et viscosité sont dans les exigences, et tes méthodes se tiennent. On peut proposer le contretype à la cliente. »\nTu as fini à ${horloge(e.t)}.`);
fin('fin_detecte', 'ok', 'Non-conformité détectée', e => `« Tu as vu juste, sur le défaut comme sur sa cause : ${e.f.decl === 'eth' ? (e.f.perteEth > 0.06 ? "l'éthanol s'est échappé à la fabrication, faute de reflux" : 'la masse d\'éthanol pesée était trop faible') : e.f.decl === 'visco' ? 'le gel est trop fluide' : 'la teneur en caféine est hors exigence'}. Mieux vaut le savoir avant la cliente. On refait un lot en corrigeant le procédé. »`);
fin('fin_mauvaise_cause', 'moyen', 'Défaut mal identifié', e => defauts(e).includes(e.f.decl) ? `« Tu as vu qu'il y avait un défaut sur ${NOMS_DEFAUT[e.f.decl]}, mais la cause que tu proposes ne tient pas. Relis ton cahier : qu'as-tu fait, et dans quel ordre ? Avec une mauvaise cause, on refera un lot sans rien corriger. »` : `« Il y a bien un défaut, mais pas celui que tu écris sur le bon. Reprends tes résultats critère par critère : ${defauts(e).map(d => ({ caf: 'caféine', eth: 'éthanol', visco: 'viscosité' }[d])).join(', ')}. »`);
fin('fin_faux_ok', 'ko', 'Lot non conforme validé', e => `« Tu as signé un lot qui ne respecte pas le cahier des charges (${defauts(e).map(d => ({ caf: 'caféine', eth: 'éthanol', visco: 'viscosité' }[d])).join(', ')}). C'est exactement ce qu'un contrôle qualité doit empêcher. »`);
fin('fin_faux_nok', 'ko', 'Lot conforme refusé', e => `« Le gel était en fait conforme. ${e.f.extAccepte && !ecartsMes(e).length ? 'Ta méthode UV externe surestimait la caféine (effet de matrice) : un témoin t\'aurait prévenu.' : `Ce sont tes mesures qui étaient en cause : ${causeMesure(e) || 'reprends tes résultats un par un et compare-les aux exigences'}.`} Un faux rejet coûte un lot et du temps. »`);
fin('fin_temps', 'ko', 'Hors délai', () => `La journée est terminée (17 h) sans conclusion : le bon de contrôle reste vide. En TP comme au laboratoire, il faut anticiper les temps d'attente, les pannes et les reprises.`);

// ───────────── Résumé et bilan par compétence ─────────────
export const resume = e => [
  `Formule : ${e.f.fm ? `éthanol à 96 % ${nf(e.f.fm.eth96, 1)} g, Synthalen K ${nf(e.f.fm.carb, 2)} g, caféine ${nf(e.f.fm.caf, 1)} g` : 'non fixée'}${e.f.repli ? ' (formule de repli)' : ''}.`,
  e.f.mode ? `Procédé : ${{ reflux: 'ballon à reflux sous agitation', becher: 'bécher chauffé sans reflux', froid: 'bécher à froid', base: 'base ajoutée dès le début' }[e.f.mode]}${e.f.disp ? `, dispersion : ${{ continuer: 'prolongée', neutraliser: 'arrêtée avant la fin', chauffer: 'chauffage augmenté', grumeaux: 'grumeaux conservés' }[e.f.disp]}` : ''}.` : null,
  e.f.methCaf ? `Caféine : ${e.f.methCaf === 'gamme' ? 'CLHP, gamme d\'étalonnage externe' : e.f.methCaf === 'EI' ? (e.f.attendu ? 'CLHP après réparation' : 'CLHP, étalon interne') : e.f.methCaf === 'ajouts' ? 'UV, ajouts dosés' : 'UV, étalonnage externe'}.` : null,
  e.f.compense ? 'Éthanol compensé après une perte à la fabrication, dosage CPG refait.' : null,
  e.f.reprisePh ? 'pH du gel repris après la mesure de rhéologie.' : null,
  `Temps d'attente subi : ${duree(e.f.attente)}.`,
].filter(Boolean);
const eqNiveau = f => {
  const v = Object.values(f.eq || {}), ko = v.filter(x => x === 'ko').length, moy = v.filter(x => x === 'moyen').length;
  if (!v.length) return { niveau: 'nd', texte: 'Pas d\'échange avec les collègues dans cette partie.' };
  const niveau = ko >= 2 ? 'ko' : ko + moy === 0 ? 'ok' : 'moyen';
  return { niveau, texte: niveau === 'ok' ? `${f.nbConseils ? 'Tu as demandé conseil quand tu en avais besoin. ' : ''}Conseils écoutés, désaccords exprimés avec tact, aide acceptée : une équipe de labo fonctionne ainsi.` : `${ko ? `${ko} échange(s) sec(s) ou fermé(s) avec un collègue. ` : ''}${moy ? `${moy} fois, tu as suivi un avis ou refusé une aide sans en discuter. ` : ''}Un désaccord technique s'exprime avec un argument, sur un ton qui laisse la porte ouverte.` };
};
export function bilan(e, finId = e.scene) {
  const f = e.f, niv = (n, a, b) => n <= a ? 'ok' : n <= b ? 'moyen' : 'ko';
  const n1 = (f.errCoel ? 1 : 0) + (f.sansEI ? 1 : 0) + (f.extTente ? 1 : 0) + (f.extAccepte ? 2 : 0) + (f.errComp ? 1 : 0) + (f.errMeth || 0) + (f.leurres || 0) + (f.errSuivi ? 1 : 0);
  const c4 = f.panne === false || f.panne === undefined ? 'nd' : f.methCaf === 'ajouts' && !f.extTente ? 'ok' : f.attendu ? 'moyen' : f.extAccepte ? 'ko' : 'moyen';
  const att = f.attente || 0, nbErr = f.nbErr || 0;
  const c3 = (finId === 'fin_conforme' || finId === 'fin_detecte') ? (f.secuErr || f.extAccepte ? 'moyen' : 'ok') : finId === 'fin_mauvaise_cause' ? 'moyen' : finId === 'fin_temps' ? 'nd' : 'ko';
  return [
    { comp: 'C.1.4', titre: 'Sélectionner les méthodes, techniques et matériels', niveau: niv(n1, 0, 1), texte: n1 === 0 ? 'Étalon interne adapté, méthodes cohérentes avec la matrice.' : `À revoir : ${[f.errCoel && 'étalon interne (propan-1-ol coélue avec l\'éthanol)', f.sansEI && 'nécessité d\'un étalon interne en CPG', f.extTente && 'étalonnage externe UV (effet de matrice)', f.extAccepte && 'résultat UV non vérifié avec un témoin', f.errComp && 'comparaison des deux méthodes CPG', f.leurres && 'appareils sans rapport avec la question (IR, réfractomètre, polarimètre, conductimètre, titrage du gel)', f.errSuivi && 'méthode de suivi du titrage du Synthalen K (électrode de platine, ou indicateur dont la zone de virage ne contient pas le pH à l\'équivalence)', f.errMeth && 'technique de dosage inadaptée essayée avant la bonne (titrage de la caféine, CLHP-UV ou masse volumique pour l\'éthanol)'].filter(Boolean).join(' ; ')}.` },
    { comp: 'C.2.1', titre: 'Préparer les produits et les calculs', niveau: f.repli ? 'moyen' : niv(nbErr + (f.errEs ? 1 : 0) + (f.aides || 0) + (f.errInj ? 1 : 0), 1, 4), texte: `${nbErr} réponse(s) de calcul fausse(s)${f.aides ? `, dont ${f.aides} refaite(s) avec l'aide d'un collègue` : ''}${f.errEth ? ' (titre de l\'éthanol à 96 %)' : ''}${f.repli ? ' ; formule de repli utilisée' : ''}${f.errInj ? ` ; ${f.errInj} erreur(s) pour repérer l'injecteur sur le schéma de l'appareil` : ''}.` },
    { comp: 'C.3.2', titre: 'Détecter les non-conformités', niveau: c3, texte: c3 === 'nd' ? 'Pas de conclusion rendue.' : f.secuErr && (finId === 'fin_conforme' || finId === 'fin_detecte') ? 'Décision cohérente avec le lot, mais le montage chauffant d\'éthanol a d\'abord été installé hors hotte : la sécurité fait partie de la détection des non-conformités.' : c3 === 'ok' ? 'Décision cohérente avec la réalité du lot.' : 'La décision ne correspond pas aux défauts réels du lot : relis tes résultats critère par critère.' },
    { comp: 'C.4', titre: 'Adapter son protocole face à un imprévu', niveau: c4, texte: c4 === 'nd' ? 'Pas de panne dans cette partie.' : c4 === 'ok' ? 'Panne de CLHP : bascule immédiate vers une méthode adaptée (ajouts dosés).' : c4 === 'moyen' ? 'Panne de CLHP : solution trouvée mais coûteuse ou après un détour.' : 'Résultat biaisé conservé sans vérification.' },
    { comp: 'C.6.1', titre: 'Organiser le travail dans le respect des délais', niveau: finId === 'fin_temps' ? 'ko' : niv(att, 70, 130), texte: `${duree(att)} d'attente subie devant l'étuve, le ballon ou la CLHP en panne (l'étuve et la dispersion tournent seules : profites-en pour lancer d'autres manipulations)${att > 70 ? ' : lance les opérations longues en premier et prépare les analyses pendant ce temps' : ''}.` },
    { comp: 'C.7.3', titre: 'Travailler en équipe', niveau: eqNiveau(f).niveau, texte: eqNiveau(f).texte },
  ];
}

// ───────────── Après la partie : le film de la journée, les causes et les effets, la fiche de fabrication ─────────────
export const chronologie = e => ({ actif: (e.hist || []).filter(h => h.k === 'act'), attentes: (e.hist || []).filter(h => h.k === 'att'), pauses: (e.hist || []).filter(h => h.k === 'pause'), etuve: (e.spans || []).filter(x => x.k === 'es'), gel: (e.spans || []).filter(x => x.k === 'gel') });
export function consequences(e) {
  const f = e.f, d = f.tDec || {}, g = gelVrai(e), L = [], h = k => d[k] != null ? horloge(d[k]) : null;
  if (f.mode) {
    const txt = { reflux: `ballon à reflux : l'éthanol reste dans le montage (${nf(g.eth, 1)} % dans le gel)`, becher: `bécher chauffé sans reflux : de l'éthanol s'échappe (${nf(g.eth, 1)} % dans le gel au lieu de ${nf(ETH_PUR_COM, 1)} %)`, froid: `bécher à froid : peu de pertes (${nf(g.eth, 1)} % d'éthanol), mais une dispersion plus longue`, base: `base mélangée dès le départ : le Synthalen K fait des grumeaux, le gel épaissit mal` }[f.mode];
    L.push({ quand: h('mode'), cause: 'Procédé de fabrication', effet: txt });
  }
  if (f.bal) L.push({ quand: h('bal'), cause: 'Balance pour l\'extrait sec', effet: f.bal === 'std' ? (f.refaitBal ? 'balance au 0,01 g : résidu trop petit, écart trop grand entre les essais, essais à refaire (1 h perdue)' : 'balance au 0,01 g : le résidu d\'environ 0,1 g est connu à ±0,01 g, soit environ 1 point d\'extrait sec d\'incertitude') : 'balance de précision : écart de répétabilité compatible avec S_r' });
  if (f.phFinal != null) L.push({ quand: null, cause: 'pH final du gel', effet: `pH ${nf(f.phFinal, 2)} : viscosité mesurée par le rapport des contraintes ${nf(g.q, 2)} (exigence : au moins ${nf(SPEC.q, 2)})${f.reprisePh ? ', après reprise de la trolamine' : ''}` });
  if (f.methCaf) L.push({ quand: h('methCaf'), cause: 'Dosage de la caféine', effet: f.methCaf === 'gamme' ? 'CLHP, gamme d\'étalonnage externe : volume injecté maîtrisé par la boucle, pas d\'effet de matrice' : f.methCaf === 'ext' ? (f.extAccepte ? 'UV, étalonnage externe : effet de matrice, caféine surestimée d\'environ 40 %, résultat retenu sans vérification' : 'UV, étalonnage externe : surestimation détectée et corrigée par une autre méthode') : f.methCaf === 'ajouts' ? 'UV, ajouts dosés : l\'effet de matrice est compensé' : 'CLHP, étalon interne : volume injecté sans influence' });
  if (f.ei === 'butanol') L.push({ quand: h('ei'), cause: 'Étalon interne CPG', effet: 'le propan-1-ol du protocole sort en même temps que l\'éthanol (un seul pic) : remplacé par le butan-1-ol, dont le pic est séparé' });
  if (f.coelIgnore) L.push({ quand: null, cause: 'Coélution ignorée', effet: 'aires exploitées malgré le pic unique éthanol + propan-1-ol : éthanol surestimé d\'environ 30 %' });
  if (f.aidesPlan) L.push({ quand: null, cause: 'Conseils de collègues', effet: `${f.aidesPlan} conseil(s) demandé(s) pour concevoir tes préparations : du temps passé (3 à 5 minutes chacun), mais des collègues sollicités à bon escient` });
  if (f.cooh != null) { const vrai = coohLot(e) * 100, bon = Math.abs(f.cooh - vrai) <= 4; L.push({ quand: null, cause: 'Titrage du Synthalen K (bidon ancien)', effet: bon ? `${nf(f.cooh, 1)} % de COOH dans ton lot, contre ${nf(59, 0)} % annoncés par la fiche : ${Math.abs(vrai - 59) > 2.5 ? 'le lot s\'écarte de la fiche (poudre vieillie), la vérification était justifiée et la trolamine à prévoir en tient compte' : 'le lot est conforme à la fiche, mais on ne pouvait pas le savoir sans vérifier'}` : `${nf(f.cooh, 1)} % de COOH trouvés : très éloigné de la teneur réelle du lot (environ ${nf(vrai, 0)} %)${f.suivi === 'ind' && !INDIC_ADAPTES.includes(f.indic) ? ' (la zone de virage de l\'indicateur choisi ne contient pas le pH à l\'équivalence)' : ''}, donc quantité de trolamine mal estimée` }); }
  if (f.leurres) L.push({ quand: null, cause: 'Appareils sans rapport avec la question', effet: `${f.leurres} mesure(s) (IR, réfractomètre, polarimètre, conductimètre, titrage du gel) sans information sur la formule ni sur les teneurs : ${f.leurres * 20} minutes perdues` });
  if (f.errMeth) L.push({ quand: null, cause: 'Choix de techniques', effet: `${f.errMeth} technique(s) inadaptée(s) essayée(s) avant la bonne : de 15 à 25 minutes perdues à chaque fois` });
  if (f.compense) L.push({ quand: null, cause: 'Éthanol manquant', effet: 'compensation par ajout d\'éthanol à 96 % et dosage CPG refait' });
  if (f.secuErr) L.push({ quand: null, cause: 'Sécurité', effet: 'montage chauffant d\'éthanol installé hors hotte : déplacé par la responsable' });
  return L;
}
export function fiche(e) {
  const f = e.f, fm = f.fm || null, L = ['FICHE DE FABRICATION : contretype de gel à la caféine (lot de ' + M_LOT + ' g)'];
  if (fm) L.push('Formule (g) : ' + CHAMPS_FORMULE.map(([k, n]) => `${n} ${nf(fm[k], 2)}`).join(' ; '));
  if (f.mode) L.push('Procédé : ' + ({ reflux: 'ballon à reflux, chauffage modéré, agitation ; base ajoutée à la fin', becher: 'bécher chauffé sans reflux ; base ajoutée à la fin', froid: 'bécher à température ambiante, agitation ; base ajoutée à la fin', base: 'tous les constituants mélangés dès le départ' })[f.mode]);
  if (f.trolAdd != null) L.push(`Neutralisation : ${nf(f.trolAdd, 2)} g de trolamine, pH ${nf(f.phFinal ?? f.phMes ?? 0, 2)}`);
  L.push(`Temps passé : ${horloge(Math.min(e.t, T_FIN))} ; attente subie : ${duree(f.attente || 0)}`);
  return L;
}
