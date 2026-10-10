import { useState, useEffect, useRef, useMemo } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, Curseur, indicesProfond, lireNombre, proche } from "../commun";

// ====================================================
//  SIM 32 — REFROIDISSEMENT D'UNE BOUILLOIRE : MESURER λ DE SA PAROI
// ====================================================

// ── Modèle (fonctions pures) ──
// Bilan d'énergie de l'eau (température uniforme T) : C_tot · dT/dt = −(G_lat + G_cf)·(T − T_ext) − P_évap(T).
// • Modèle du TP (hypothèses des élèves) : seule la paroi latérale (cylindre, S = c·h) laisse sortir l'énergie, par
//   conduction pure, ses faces étant à T et à T_ext : G_lat = λ·S/e ; C_tot = m·C_eau. Solution exponentielle exacte.
// • Modèle enrichi (effets activables un par un) :
//   – films : résistances convectives en série, 1/(h_int·S) côté eau et 1/(h_ext·S) côté air (h_ext dépend du ventilateur) ;
//   – couvercle et fond : deux disques d'aire c²/(4π) chacun, supposés faits de la même paroi (e, λ, films) ;
//   – évaporation : P_évap = P_100 · (p_sat(T) − p_v,air) / (p_sat(100 °C) − p_v,air) (loi de Dalton), p_sat par la formule d'Antoine ;
//   – capacité thermique de la bouilloire : C_corps ajoutée à celle de l'eau.
//   Intégration numérique (Runge-Kutta d'ordre 4) quand l'évaporation est prise en compte.
export const C_EAU = 4185;                                          // J·kg⁻¹·K⁻¹ (valeur du TP)
const pSat = T => 10 ** (8.07131 - 1730.63 / (233.426 + T));        // mmHg, eau entre 1 et 100 °C (Antoine)
export const MATS_B = {
  abs:   { nom: 'ABS (plastique)',  lam: 0.16, coul: '#e2e8f0' },
  pp:    { nom: 'Polypropylène',    lam: 0.22, coul: '#e7e5e4' },
  verre: { nom: 'Verre',            lam: 1.2,  coul: '#bae6fd' },
  inox:  { nom: 'Inox',             lam: 26,   coul: '#94a3b8' },
};
export const ENRICHI = { hint: 500, hextVent: 50, hextSans: 12, P100: 100, Ccorps: 150, HR: 0.5 };
const AUCUN = { films: false, cf: false, evap: false, corps: false };
const TOUS = { films: true, cf: true, evap: true, corps: true };

// p : { m (kg), h, c, e (m), lam, Text, T0, drop (°C), eff:{films, cf, evap, corps}, vent, hint, hextVent, hextSans, P100, Ccorps, HR }
export function simuler(p) {
  const E = p.eff || AUCUN;
  const S = p.c * p.h, Acf = 2 * p.c * p.c / (4 * Math.PI);
  const hext = p.vent ? p.hextVent : p.hextSans;
  const R = A => ({ int: E.films ? 1 / (p.hint * A) : 0, abs: p.e / (p.lam * A), ext: E.films ? 1 / (hext * A) : 0 });
  const Rl = R(S), Rc = R(Acf);
  const Glat = 1 / (Rl.int + Rl.abs + Rl.ext), Gcf = E.cf ? 1 / (Rc.int + Rc.abs + Rc.ext) : 0;
  const Ctot = p.m * C_EAU + (E.corps ? p.Ccorps : 0);
  const pv = p.HR * pSat(p.Text), ref = pSat(100) - pv;
  const Pev = T => (E.evap ? Math.max(0, p.P100 * (pSat(T) - pv) / ref) : 0);
  const Tfin = p.T0 - p.drop;
  let tEnd, Tde;
  if (!E.evap) {
    const tau = Ctot / (Glat + Gcf);
    tEnd = tau * Math.log((p.T0 - p.Text) / (Tfin - p.Text));
    Tde = t => p.Text + (p.T0 - p.Text) * Math.exp(-Math.min(t, tEnd) / tau);
  } else {
    const f = T => -((Glat + Gcf) * (T - p.Text) + Pev(T)) / Ctot, dt = 0.05, Ts = [p.T0];
    let T = p.T0, t = 0;
    while (T > Tfin && t < 20000) {
      const k1 = f(T), k2 = f(T + dt / 2 * k1), k3 = f(T + dt / 2 * k2), k4 = f(T + dt * k3);
      const Tn = T + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4);
      if (Tn <= Tfin) { tEnd = t + dt * (T - Tfin) / (T - Tn); Ts.push(Tn); break; }
      T = Tn; t += dt; Ts.push(T);
    }
    if (tEnd == null) tEnd = t;
    Tde = tt => {
      const u = Math.min(Math.max(tt, 0), tEnd) / dt, i = Math.floor(u);
      if (i >= Ts.length - 1) return Tfin;
      const v = Ts[i] + (Ts[i + 1] - Ts[i]) * (u - i);
      return Math.max(v, Tfin);
    };
  }
  const Tm = (p.T0 + Tfin) / 2;
  const flux = { lat: Glat * (Tm - p.Text), cf: Gcf * (Tm - p.Text), ev: Pev(Tm) };
  const Tsi = Tm - flux.lat * Rl.int, Tse = p.Text + flux.lat * Rl.ext;
  return { S, Acf, Rl, Glat, Gcf, Ctot, tEnd, Tde, Tfin, Tm, flux, Tsi, Tse, hext, E };
}
// Méthode du TP appliquée à une durée mesurée Δt
export function lambdaEleve(p, dt) {
  const phi = p.m * C_EAU * p.drop / dt;
  return phi * p.e / (p.c * p.h * (p.T0 - p.drop / 2 - p.Text));
}
// Le λ que trouverait un élève pour chaque effet ajouté seul au modèle du TP, puis tous ensemble
export function tableEffets(p) {
  const lignes = [['aucun', 'Modèle du TP (aucun effet)', AUCUN], ['films', 'Films d’eau et d’air seuls', { ...AUCUN, films: true }],
    ['cf', 'Couvercle et fond seuls', { ...AUCUN, cf: true }], ['evap', 'Évaporation seule', { ...AUCUN, evap: true }],
    ['corps', 'Capacité thermique de la bouilloire seule', { ...AUCUN, corps: true }], ['tous', 'Tous les effets ensemble', TOUS]];
  return lignes.map(([id, nom, eff]) => {
    const s = simuler({ ...p, eff }), l = lambdaEleve(p, s.tEnd);
    return { id, nom, dt: s.tEnd, l, ecart: l / p.lam - 1 };
  });
}

// ── Mise en forme ──
const nf = (x, n = 3) => (isFinite(x) ? Number(x).toLocaleString('fr-FR', { maximumSignificantDigits: n }) : '—');
const dec = (x, d) => (isFinite(x) ? Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—');
const r1 = x => Math.round(x * 10) / 10;
const t1 = x => dec(r1(x), 1);
const pct = x => `${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(Math.round(100 * x))} %`;
const Sub = ({ c }) => <sub>{c}</sub>;
const ROUGE = '#dc2626', BLEU = '#2563eb', ORANGE = '#ea580c', VIOLET = '#7e22ce', AMBRE = '#d97706', CIEL = '#0284c7';
function couleurT(T) {                                              // 15 °C bleu → 100 °C rouge
  const f = Math.max(0, Math.min(1, (T - 15) / 85));
  const a = [37, 99, 235], b = [220, 38, 38], c = a.map((v, i) => Math.round(v + (b[i] - v) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

// ── Données ──
// Relevé de la correction du TP : θ2 = 21,0 °C ; m_vide = 599 g ; m_plein = 2 190 g ; h = 14,3 cm ; c = 42,6 cm ; e = 0,21 cm ; θ1′ = 100,3 °C ; Δt = 70 s
const BASE = { m: 1.591, hcm: 14.3, ccm: 42.6, emm: 2.1, mat: 'abs', Text: 21.0, T0: 100.3, drop: 3, enrichi: false, eff: { ...TOUS }, vent: true, ...ENRICHI };
const versP = u => ({ m: u.m, h: u.hcm / 100, c: u.ccm / 100, e: u.emm / 1000, lam: MATS_B[u.mat].lam, Text: u.Text, T0: u.T0, drop: u.drop,
  eff: u.enrichi ? u.eff : AUCUN, vent: u.vent, hint: u.hint, hextVent: u.hextVent, hextSans: u.hextSans, P100: u.P100, Ccorps: u.Ccorps, HR: u.HR });
// Parcours guidé : mêmes mesures que le TP, mais θ1′ = 100,0 °C (eau de 100,0 à 97,0 °C)
const GUIDE = { ...BASE, T0: 100.0, mVide: 599, mPlein: 2190 };

// ════════════════ SCHÉMA DE LA BOUILLOIRE ════════════════
function Schema({ u, s, T, t, fini, enrichi, flux }) {
  const xa = 178, xb = 322, yBas = 272, yHaut = 90, hmax = 19;      // intérieur de la cuve ; hauteur dessinée = 19 cm
  const yw = yBas - Math.min(u.hcm, hmax) / hmax * (yBas - yHaut);
  const coulParoi = MATS_B[u.mat].coul;
  const tot = flux.lat + flux.cf + flux.ev, part = k => (tot > 0 ? flux[k] / tot : 0);
  const larg = k => 1.5 + 7 * part(k);
  const ys = [0.25, 0.5, 0.78].map(f => yw + (yBas - yw) * f);
  const fl = (x1, y1, x2, y2, w, c) => {
    const ang = Math.atan2(y2 - y1, x2 - x1), L = 9 + w;
    const p1 = `${x2 - L * Math.cos(ang - 0.45)},${y2 - L * Math.sin(ang - 0.45)}`, p2 = `${x2 - L * Math.cos(ang + 0.45)},${y2 - L * Math.sin(ang + 0.45)}`;
    return <g key={`${x1}-${y1}-${x2}`}><line x1={x1} y1={y1} x2={x2 - (L - 2) * Math.cos(ang)} y2={y2 - (L - 2) * Math.sin(ang)} stroke={c} strokeWidth={w} strokeLinecap="round"/><polygon points={`${x2},${y2} ${p1} ${p2}`} fill={c}/></g>;
  };
  const ventActif = !enrichi || u.vent;
  return (
    <svg viewBox="0 0 470 330" style={{ width: '100%', display: 'block' }} role="img" aria-label="Bouilloire, thermomètre et chronomètre">
      {/* air et ventilateur */}
      <text x="14" y="26" fontSize="13" fill={BLEU} fontWeight="700">air : T<tspan fontSize="10" dy="3">ext</tspan><tspan dy="-3"> = {t1(u.Text)} °C</tspan></text>
      <g opacity={ventActif ? 1 : 0.35}>
        <circle cx="52" cy="176" r="30" fill="white" stroke="#475569" strokeWidth="2"/>
        {[0, 120, 240].map(a => <ellipse key={a} cx="52" cy="163" rx="6" ry="13" fill="#cbd5e1" stroke="#64748b" transform={`rotate(${a} 52 176)`}/>)}
        <circle cx="52" cy="176" r="4" fill="#475569"/>
        <line x1="52" y1="206" x2="52" y2="250" stroke="#475569" strokeWidth="3"/>
        <line x1="34" y1="252" x2="70" y2="252" stroke="#475569" strokeWidth="3"/>
        {ventActif && [160, 176, 192].map(y => <path key={y} d={`M90 ${y} q8 -5 16 0 t16 0`} fill="none" stroke="#94a3b8" strokeWidth="1.5"/>)}
      </g>
      <text x="52" y="270" fontSize="12" fill="#334155" textAnchor="middle">{ventActif ? 'ventilateur' : 'ventilateur arrêté'}</text>
      {/* corps de la bouilloire */}
      <polygon points={`${xa - 8},96 140,78 140,90 ${xa - 8},116`} fill={coulParoi} stroke="#475569" strokeWidth="1.5"/>
      <path d={`M${xb + 8} 104 C 380 104, 382 120, 382 140 L 382 226 C 382 246, 380 252, ${xb + 8} 252`} fill="none" stroke="#64748b" strokeWidth="11" strokeLinecap="round"/>
      <rect x={xa - 8} y="80" width={xb - xa + 16} height={yBas - 80 + 8} rx="6" fill={coulParoi} stroke="#475569" strokeWidth="1.5"/>
      <rect x={xa} y="84" width={xb - xa} height={yBas - 84} fill="#f8fafc"/>
      <rect x={xa} y={yw} width={xb - xa} height={yBas - yw} fill={couleurT(T)}/>
      <ellipse cx={(xa + xb) / 2} cy={yw} rx={(xb - xa) / 2} ry="6" fill={couleurT(T)} stroke="white" strokeOpacity="0.6"/>
      <ellipse cx={(xa + xb) / 2} cy={yBas} rx={(xb - xa) / 2} ry="6" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="5 4"/>
      <rect x={xa - 14} y="68" width={xb - xa + 28} height="13" rx="4" fill={coulParoi} stroke="#475569" strokeWidth="1.5"/>
      <rect x={(xa + xb) / 2 + 30} y="60" width="22" height="9" rx="3" fill="#64748b"/>
      <rect x={xa - 18} y={yBas + 8} width={xb - xa + 36} height="16" rx="4" fill="#334155"/>
      {/* cotes */}
      <line x1={xa + 42} x2={xa + 42} y1={yw + 3} y2={yBas - 3} stroke="white" strokeWidth="1.5"/>
      <polygon points={`${xa + 38},${yw + 10} ${xa + 46},${yw + 10} ${xa + 42},${yw + 2}`} fill="white"/>
      <polygon points={`${xa + 38},${yBas - 10} ${xa + 46},${yBas - 10} ${xa + 42},${yBas - 2}`} fill="white"/>
      <text x={xa + 49} y={(yw + yBas) / 2 - 6} fontSize="15" fontWeight="700" fill="white">h</text>
      <text x={(xa + xb) / 2} y={yBas - 10} fontSize="12" fontWeight="700" fill="white" textAnchor="middle">c (circonférence)</text>
      <line x1={xa - 4} y1="230" x2="118" y2="300" stroke="#334155" strokeWidth="1"/>
      <text x="14" y="314" fontSize="12.5" fill="#334155">paroi : {MATS_B[u.mat].nom}, e = {dec(u.emm, 1)} mm</text>
      {/* flèches d'énergie */}
      {ys.map(y => fl(xa + 22, y, xa - 40, y, larg('lat'), ORANGE))}
      {ys.map(y => fl(xb - 22, y, xb + 34, y, larg('lat'), ORANGE))}
      {enrichi && flux.cf > 0 && fl((xa + xb) / 2 - 40, yw + 4, (xa + xb) / 2 - 40, 44, larg('cf'), AMBRE)}
      {enrichi && flux.cf > 0 && fl((xa + xb) / 2 - 20, yBas - 6, (xa + xb) / 2 - 20, 314, larg('cf'), AMBRE)}
      {enrichi && flux.ev > 0 && [0, 1, 2].map(k => <path key={k} d={`M${136 - k * 4} ${74 - k * 6} q-10 -8 -2 -16 t-2 -16`} fill="none" stroke={CIEL} strokeWidth={1 + 4 * part('ev')} strokeLinecap="round" opacity="0.8"/>)}
      <text x={xa - 46} y={ys[0] - 24} fontSize="11.5" fill={ORANGE} fontWeight="700" textAnchor="end">énergie</text>
      <text x={xa - 46} y={ys[0] - 11} fontSize="11.5" fill={ORANGE} fontWeight="700" textAnchor="end">cédée</text>
      {/* thermomètre */}
      <line x1={(xa + xb) / 2} y1="38" x2={(xa + xb) / 2} y2={yw + (yBas - yw) * 0.55} stroke="#0f172a" strokeWidth="3"/>
      <circle cx={(xa + xb) / 2} cy={yw + (yBas - yw) * 0.55} r="5" fill="#0f172a"/>
      <rect x={(xa + xb) / 2 - 58} y="6" width="116" height="30" rx="6" fill="#0f172a"/>
      <text x={(xa + xb) / 2} y="27" fontSize="16" fontWeight="700" fill="#fde68a" textAnchor="middle" fontFamily="monospace">θ = {t1(T)} °C</text>
      {/* chronomètre */}
      <rect x="352" y="6" width="112" height="44" rx="6" fill="white" stroke="#0f172a" strokeWidth="1.5"/>
      <text x="408" y="26" fontSize="16" fontWeight="700" fill="#0f172a" textAnchor="middle" fontFamily="monospace">⏱ {dec(t, 1)} s</text>
      <text x="408" y="43" fontSize="10.5" fill={fini ? '#15803d' : '#334155'} textAnchor="middle">{fini ? 'arrêté' : `arrêt à ${t1(u.T0 - u.drop)} °C`}</text>
    </svg>
  );
}

// ════════════════ GRAPHIQUES T(t) ════════════════
const pasJoli = e => { const p = 10 ** Math.floor(Math.log10(e)), n = e / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };
function Axes({ X, Y, x0, x1, y0, y1, tMax, Tmin, Tmax, xlab, ylab, W, H, decT = 0 }) {
  const pT = pasJoli((Tmax - Tmin) / 5), pt = pasJoli(tMax / 6), tT = [], tt = [];
  for (let v = Math.ceil(Tmin / pT - 1e-9) * pT; v <= Tmax + 1e-9; v += pT) tT.push(Math.abs(v) < 1e-9 ? 0 : v);
  for (let v = 0; v <= tMax + 1e-9; v += pt) tt.push(v);
  return (
    <g>
      {tT.map(v => <g key={`T${v}`}><line x1={x0} x2={x1} y1={Y(v)} y2={Y(v)} stroke="#e2e8f0"/><text x={x0 - 5} y={Y(v) + 4} fontSize="12" fill="#334155" textAnchor="end">{dec(v, decT)}</text></g>)}
      {tt.map(v => <text key={`t${v}`} x={X(v)} y={y0 + 15} fontSize="12" fill="#334155" textAnchor="middle">{nf(v, 3)}</text>)}
      <line x1={x0} x2={x1} y1={y0} y2={y0} stroke="#0f172a" strokeWidth="1.2"/>
      <line x1={x0} x2={x0} y1={y1} y2={y0} stroke="#0f172a" strokeWidth="1.2"/>
      <text x={(x0 + x1) / 2} y={H - 4} fontSize="12.5" fontWeight="700" fill="#0f172a" textAnchor="middle">{xlab}</text>
      <text x={13} y={(y0 + y1) / 2} fontSize="12.5" fontWeight="700" fill="#0f172a" textAnchor="middle" transform={`rotate(-90 13 ${(y0 + y1) / 2})`}>{ylab}</text>
    </g>
  );
}
function GrapheGlobal({ u, s, t, fini, montrerDT, valeurDTm }) {
  const W = 520, H = 250, x0 = 52, x1 = 505, y0 = 210, y1 = 12;
  const tMax = Math.max(10, s.tEnd * 1.12), Tmin = 0, Tmax = 110;
  const X = v => x0 + v / tMax * (x1 - x0), Y = v => y0 - (v - Tmin) / (Tmax - Tmin) * (y0 - y1);
  const n = 60, pts = Array.from({ length: n + 1 }, (_, i) => { const tt = i / n * t; return `${X(tt).toFixed(1)},${Y(s.Tde(tt)).toFixed(1)}`; }).join(' ');
  const xm = X(s.tEnd * 0.3), dTm = s.Tm - u.Text;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #cbd5e1' }} role="img" aria-label="Température de l'eau en fonction du temps, échelle complète">
      <Axes X={X} Y={Y} x0={x0} x1={x1} y0={y0} y1={y1} tMax={tMax} Tmin={Tmin} Tmax={Tmax} W={W} H={H} xlab="temps t (s)" ylab="température (°C)"/>
      <line x1={x0} x2={x1} y1={Y(u.Text)} y2={Y(u.Text)} stroke={BLEU} strokeWidth="2" strokeDasharray="6 4"/>
      <text x={x1 - 4} y={Y(u.Text) - 6} fontSize="12" fill={BLEU} fontWeight="700" textAnchor="end">air : T<tspan fontSize="9" dy="3">ext</tspan><tspan dy="-3"> = {t1(u.Text)} °C</tspan></text>
      {t > 0 && <polyline points={pts} fill="none" stroke={ROUGE} strokeWidth="3"/>}
      <text x={x0 + 6} y={Y(u.T0) - 8} fontSize="12" fill={ROUGE} fontWeight="700">eau</text>
      {montrerDT && fini && <>
        <line x1={xm} x2={xm} y1={Y(s.Tm) + 3} y2={Y(u.Text) - 3} stroke={VIOLET} strokeWidth="2"/>
        <polygon points={`${xm - 5},${Y(s.Tm) + 11} ${xm + 5},${Y(s.Tm) + 11} ${xm},${Y(s.Tm) + 2}`} fill={VIOLET}/>
        <polygon points={`${xm - 5},${Y(u.Text) - 11} ${xm + 5},${Y(u.Text) - 11} ${xm},${Y(u.Text) - 2}`} fill={VIOLET}/>
        <text x={xm + 8} y={(Y(s.Tm) + Y(u.Text)) / 2} fontSize="13" fill={VIOLET} fontWeight="700">écart eau – air : ΔT<tspan fontSize="10" dy="3">m</tspan><tspan dy="-3">{valeurDTm ? ` ≈ ${dec(dTm, 1)} °C` : ' = ?'}</tspan></text>
        <text x={xm + 8} y={(Y(s.Tm) + Y(u.Text)) / 2 + 16} fontSize="11.5" fill={VIOLET}>(pour la paroi : φ = λ·S·ΔT<tspan fontSize="9" dy="3">m</tspan><tspan dy="-3"> / e)</tspan></text>
        <line x1={X(s.tEnd) + 4} x2={X(s.tEnd) + 12} y1={Y(u.T0)} y2={Y(u.T0)} stroke={ORANGE} strokeWidth="2"/>
        <line x1={X(s.tEnd) + 4} x2={X(s.tEnd) + 12} y1={Y(u.T0 - u.drop)} y2={Y(u.T0 - u.drop)} stroke={ORANGE} strokeWidth="2"/>
        <text x={X(s.tEnd) - 6} y={Y(s.Tm) + 22} fontSize="13" fill={ORANGE} fontWeight="700" textAnchor="end">baisse de l’eau : {dec(u.drop, 1)} °C</text>
        <text x={X(s.tEnd) - 6} y={Y(s.Tm) + 37} fontSize="11.5" fill={ORANGE} textAnchor="end">(à peine visible à cette échelle ; pour Q = m·C·ΔT)</text>
      </>}
    </svg>
  );
}
function GrapheZoom({ u, s, t, fini }) {
  const W = 520, H = 200, x0 = 52, x1 = 505, y0 = 162, y1 = 12;
  const tMax = Math.max(10, s.tEnd * 1.12), Tmin = Math.floor((u.T0 - u.drop - 0.6) * 2) / 2, Tmax = Math.ceil((u.T0 + 0.6) * 2) / 2;
  const X = v => x0 + v / tMax * (x1 - x0), Y = v => y0 - (v - Tmin) / (Tmax - Tmin) * (y0 - y1);
  const n = 60, pts = Array.from({ length: n + 1 }, (_, i) => { const tt = i / n * t; return `${X(tt).toFixed(1)},${Y(s.Tde(tt)).toFixed(1)}`; }).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #cbd5e1' }} role="img" aria-label="Zoom sur la baisse de température chronométrée">
      <Axes X={X} Y={Y} x0={x0} x1={x1} y0={y0} y1={y1} tMax={tMax} Tmin={Tmin} Tmax={Tmax} W={W} H={H} xlab="temps t (s)" ylab="θ (°C)" decT={1}/>
      <line x1={x0} x2={x1} y1={Y(u.T0)} y2={Y(u.T0)} stroke="#64748b" strokeDasharray="5 4"/>
      <line x1={x0} x2={x1} y1={Y(u.T0 - u.drop)} y2={Y(u.T0 - u.drop)} stroke="#64748b" strokeDasharray="5 4"/>
      <text x={x1 - 4} y={Y(u.T0) - 5} fontSize="12" fill="#334155" textAnchor="end">θ₁′ = {t1(u.T0)} °C (départ du chrono)</text>
      <text x={x0 + 6} y={Y(u.T0 - u.drop) - 5} fontSize="12" fill="#334155">θ₁″ = {t1(u.T0 - u.drop)} °C (arrêt du chrono)</text>
      {t > 0 && <polyline points={pts} fill="none" stroke={ROUGE} strokeWidth="3"/>}
      {fini && <>
        <line x1={X(s.tEnd)} x2={X(s.tEnd)} y1={Y(u.T0 - u.drop)} y2={y0} stroke={VIOLET} strokeDasharray="4 3"/>
        <line x1={X(0) + 2} x2={X(s.tEnd) - 2} y1={y0 - 10} y2={y0 - 10} stroke={VIOLET} strokeWidth="2"/>
        <polygon points={`${X(0) + 9},${y0 - 15} ${X(0) + 9},${y0 - 5} ${X(0) + 1},${y0 - 10}`} fill={VIOLET}/>
        <polygon points={`${X(s.tEnd) - 9},${y0 - 15} ${X(s.tEnd) - 9},${y0 - 5} ${X(s.tEnd) - 1},${y0 - 10}`} fill={VIOLET}/>
        <text x={(X(0) + X(s.tEnd)) / 2} y={y0 - 16} fontSize="13" fill={VIOLET} fontWeight="700" textAnchor="middle">Δt = {dec(s.tEnd, 1)} s</text>
      </>}
    </svg>
  );
}

// ════════════════ PROFIL DANS LA PAROI ════════════════
function ProfilParoi({ u, s }) {
  const W = 520, H = 206, y0 = 150, y1 = 24, films = s.E.films;
  const z = films ? [['eau', 70, couleurT(s.Tm)], ['film d’eau', 50, '#dbeafe'], [MATS_B[u.mat].nom.split(' ')[0], 130, MATS_B[u.mat].coul], ['film d’air', 90, '#e0f2fe'], ['air', 110, '#f1f5f9']]
    : [['eau', 120, couleurT(s.Tm)], [MATS_B[u.mat].nom.split(' ')[0], 220, MATS_B[u.mat].coul], ['air', 110, '#f1f5f9']];
  let x = 30; const zs = z.map(([nom, w, c]) => { const r = { nom, x, w, c }; x += w; return r; });
  const Tmin = Math.floor(u.Text / 10) * 10, Tmax = 105, Y = v => y0 - (v - Tmin) / (Tmax - Tmin) * (y0 - y1);
  const temps = films ? [s.Tm, s.Tm, s.Tsi, s.Tse, u.Text, u.Text] : [s.Tm, s.Tm, u.Text, u.Text];
  const xs = [zs[0].x, ...zs.map(r => r.x + r.w)];
  const pts = temps.map((T, k) => `${xs[k]},${Y(T)}`).join(' ');
  const iA = films ? 2 : 1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #cbd5e1' }} role="img" aria-label="Températures à travers la paroi latérale">
      {zs.map(r => <g key={r.nom}><rect x={r.x} y={y1} width={r.w} height={y0 - y1} fill={r.c} fillOpacity={r.nom === 'eau' ? 0.35 : 0.8}/><text x={r.x + r.w / 2} y={y0 + 16} fontSize="12" fill="#334155" textAnchor="middle">{r.nom}</text></g>)}
      <polyline points={pts} fill="none" stroke={ROUGE} strokeWidth="3"/>
      {[[xs[iA], temps[iA], 'face intérieure'], [xs[iA + 1], temps[iA + 1], 'face extérieure']].map(([xx, T, nom]) => (
        <g key={nom}><circle cx={xx} cy={Y(T)} r="4" fill="white" stroke={ROUGE} strokeWidth="2"/>
          <text x={xx + 7} y={Y(T) - 9} fontSize="12.5" fontWeight="700" fill="#7f1d1d">{nom} : {t1(T)} °C</text></g>))}
      <text x={zs[0].x + 4} y={Y(s.Tm) + 16} fontSize="12" fill="#7f1d1d">θ<tspan fontSize="9" dy="3">moy</tspan><tspan dy="-3"> = {t1(s.Tm)} °C</tspan></text>
      <text x={W - 14} y={Y(u.Text) - 6} fontSize="12" fill={BLEU} textAnchor="end">{t1(u.Text)} °C</text>
      <text x={W / 2} y={H - 22} fontSize="11.5" fill="#64748b" textAnchor="middle">Coupe de la paroi latérale quand l’eau est à θ<tspan fontSize="9" dy="3">moy</tspan><tspan dy="-3"> (épaisseurs non à l’échelle).</tspan></text>
      <text x={W / 2} y={H - 6} fontSize="12.5" fill={VIOLET} fontWeight="700" textAnchor="middle">La paroi ne « voit » que {dec(temps[iA] - temps[iA + 1], 1)} °C sur les {dec(s.Tm - u.Text, 1)} °C d’écart eau – air.</text>
    </svg>
  );
}

// ════════════════ BILAN DES FLUX ════════════════
function BarreFlux({ s }) {
  const W = 520, x0 = 10, x1 = 510, tot = s.flux.lat + s.flux.cf + s.flux.ev;
  const seg = [['lat', 'paroi latérale', ORANGE], ['cf', 'couvercle et fond', AMBRE], ['ev', 'évaporation', CIEL]].filter(([k]) => s.flux[k] > 0);
  let x = x0;
  return (
    <svg viewBox={`0 0 ${W} 76`} style={{ width: '100%', display: 'block' }} role="img" aria-label="Répartition de la puissance perdue">
      {seg.map(([k, nom, c]) => {
        const w = s.flux[k] / tot * (x1 - x0), xx = x; x += w;
        return (
          <g key={k}>
            <rect x={xx} y="6" width={w + 0.5} height="30" fill={c} fillOpacity="0.85" stroke="white"/>
            {w > 60 && <text x={xx + w / 2} y="26" fontSize="13" fontWeight="700" fill="white" textAnchor="middle">{Math.round(100 * s.flux[k] / tot)} %</text>}
            <text x={xx + 2} y={52 + (seg.indexOf(seg.find(z => z[0] === k)) % 2) * 15} fontSize="12" fill={c} fontWeight="700">{nom} : {nf(s.flux[k], 2)} W</text>
          </g>);
      })}
    </svg>
  );
}
function TableEffets({ lignes, lam }) {
  const max = Math.max(0.5, ...lignes.map(l => Math.abs(l.ecart)));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1.4fr) 70px 80px minmax(140px, 1.6fr)', gap: 8, fontSize: 12.5, fontWeight: 700, color: KIT.txt2 }}>
        <span>Effet ajouté au modèle du TP</span><span>Δt</span><span>λ mesuré</span><span>écart à λ = {nf(lam)}</span>
      </div>
      {lignes.map(l => (
        <div key={l.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1.4fr) 70px 80px minmax(140px, 1.6fr)', gap: 8, alignItems: 'center', fontSize: 13.5, color: KIT.txt,
          fontWeight: l.id === 'tous' ? 700 : 400, borderTop: l.id === 'tous' ? `1px solid ${KIT.bord}` : 'none', paddingTop: l.id === 'tous' ? 3 : 0 }}>
          <span>{l.nom}</span><span>{dec(l.dt, 1)} s</span><span>{dec(l.l, 2)}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ position: 'relative', flex: 1, height: 14, background: '#f1f5f9', borderRadius: 3 }}>
              <span style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: '#64748b' }}/>
              <span style={{ position: 'absolute', top: 1, bottom: 1, borderRadius: 2, background: l.ecart < 0 ? BLEU : ROUGE,
                left: l.ecart < 0 ? `${50 - 50 * Math.abs(l.ecart) / max}%` : '50%', width: `${50 * Math.abs(l.ecart) / max}%` }}/>
            </span>
            <span style={{ width: 54, textAlign: 'right', fontFamily: 'monospace' }}>{pct(l.ecart)}</span>
          </span>
        </div>))}
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 2 }}>Bleu : l’effet fait trouver un λ trop petit ; rouge : trop grand. Les effets ne s’additionnent pas exactement.</div>
    </div>
  );
}

// ════════════════ RELEVÉ ════════════════
function Releve({ u, s, fini, masses }) {
  const cell = { padding: '3px 8px', fontSize: 14, borderBottom: `1px solid ${KIT.bord}`, whiteSpace: 'nowrap' };
  const L = [
    ['Température de l’air θ₂ = T_ext', `${t1(u.Text)} °C`],
    ...(masses ? [['Masse de la bouilloire vide m_vide', `${masses[0]} g`], ['Masse de la bouilloire pleine m_plein', `${masses[1].toLocaleString('fr-FR')} g`]]
      : [['Masse d’eau m_eau', `${dec(u.m, 3)} kg`]]),
    ['Hauteur d’eau h', `${dec(u.hcm, 1)} cm`], ['Circonférence c', `${dec(u.ccm, 1)} cm`], ['Épaisseur de la paroi e', `${dec(u.emm, 1)} mm`],
    ['Température au départ θ₁′', `${t1(u.T0)} °C`], ['Température à l’arrêt θ₁″', `${t1(u.T0 - u.drop)} °C`],
    ['Durée chronométrée Δt', fini ? `${dec(s.tEnd, 1)} s` : '—'],
  ];
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', background: 'white' }}>
      <tbody>{L.map(([a, b]) => <tr key={a}><td style={{ ...cell, color: KIT.txt2 }}>{indicesProfond(a)}</td><td style={{ ...cell, fontWeight: 700, color: KIT.txt, textAlign: 'right' }}>{b}</td></tr>)}</tbody>
    </table>
  );
}

// ════════════════ DÉFI ════════════════
const tire = t => t[Math.floor(Math.random() * t.length)];
const entre = (a, b, pas = 1) => a + pas * Math.floor(Math.random() * (Math.round((b - a) / pas) + 1));
export function tirageDefi(type) {
  const mVide = entre(520, 760), m = entre(120, 170) / 100, hcm = r1(entre(110, 160) / 10), ccm = r1(entre(380, 470) / 10);
  const emm = tire([1.8, 2.0, 2.1, 2.2, 2.5]), Text = entre(36, 48) / 2, lam = tire([0.12, 0.14, 0.16, 0.18, 0.2, 0.22]);
  if (type === 'prevoir') {
    return { type, m, hcm, ccm, emm, Text, T0: 100.0, drop: 3, mat: tire(['abs', 'pp']), reps: {}, verifie: false };
  }
  const T0 = r1(entre(996, 1004) / 10), mPlein = mVide + Math.round(m * 1000);
  const s = simuler({ m: (mPlein - mVide) / 1000, h: hcm / 100, c: ccm / 100, e: emm / 1000, lam, Text, T0, drop: 3, eff: AUCUN, vent: true, ...ENRICHI });
  return { type: 'releve', mVide, mPlein, hcm, ccm, emm, Text, T0, drop: 3, dt: Math.round(s.tEnd), reps: {}, verifie: false };
}
function questionsDefi(df) {
  const S = df.ccm / 100 * df.hcm / 100, dTm = df.T0 - df.drop / 2 - df.Text;
  if (df.type === 'prevoir') {
    const lam = MATS_B[df.mat].lam, Q = df.m * C_EAU * df.drop, phi = lam * S * dTm / (df.emm / 1000);
    return [
      { id: 'Q', q: <>Énergie |Q| perdue par l’eau pendant la baisse de {dec(df.drop, 1)} °C</>, u: 'kJ', vrai: Q / 1000, tol: 0.02, detail: `|Q| = m·C·ΔT_eau = ${dec(df.m, 2)} × 4 185 × ${dec(df.drop, 1)} = ${nf(Q, 4)} J = ${nf(Q / 1000)} kJ` },
      { id: 'S', q: <>Surface latérale S</>, u: 'm²', vrai: S, tol: 0.02, detail: `S = c × h = ${nf(df.ccm / 100)} × ${nf(df.hcm / 100)} = ${nf(S)} m²` },
      { id: 'dTm', q: <>Écart moyen ΔT<Sub c="m"/> entre l’eau et l’air</>, u: '°C', vrai: dTm, tol: 0.02, detail: `ΔT_m = (θ₁′ + θ₁″)/2 − T_ext = ${t1(df.T0 - df.drop / 2)} − ${t1(df.Text)} = ${t1(dTm)} °C` },
      { id: 'phi', q: <>Puissance φ qui traverse la paroi latérale</>, u: 'W', vrai: phi, tol: 0.02, detail: `φ = λ·S·ΔT_m / e = ${nf(lam)} × ${nf(S)} × ${t1(dTm)} / ${nf(df.emm / 1000)} = ${nf(phi)} W` },
      { id: 'dt', q: <>Durée Δt prévue pour cette baisse de {dec(df.drop, 1)} °C</>, u: 's', vrai: Q / phi, tol: 0.02, detail: `Δt = |Q| / φ = ${nf(Q, 4)} / ${nf(phi)} = ${nf(Q / phi)} s` },
    ];
  }
  const m = (df.mPlein - df.mVide) / 1000, Q = -m * C_EAU * df.drop, phi = -Q / df.dt, lam = phi * (df.emm / 1000) / (S * dTm);
  return [
    { id: 'm', q: <>Masse d’eau m<Sub c="eau"/></>, u: 'kg', vrai: m, tol: 0.005, detail: `m_eau = m_plein − m_vide = ${df.mPlein} − ${df.mVide} = ${df.mPlein - df.mVide} g = ${dec(m, 3)} kg` },
    { id: 'Q', q: <>Énergie Q perdue par l’eau (avec son signe)</>, u: 'kJ', vrai: Q / 1000, tol: 0.02, detail: `Q = m·C·(θ₁″ − θ₁′) = ${dec(m, 3)} × 4 185 × (−${dec(df.drop, 1)}) = ${nf(Q / 1000)} kJ` },
    { id: 'phi', q: <>Puissance thermique φ = |Q| / Δt</>, u: 'W', vrai: phi, tol: 0.02, detail: `φ = ${nf(-Q, 4)} / ${df.dt} = ${nf(phi)} W` },
    { id: 'S', q: <>Surface latérale S</>, u: 'm²', vrai: S, tol: 0.02, detail: `S = c × h = ${nf(df.ccm / 100)} × ${nf(df.hcm / 100)} = ${nf(S)} m²` },
    { id: 'dTm', q: <>Écart moyen ΔT<Sub c="m"/> entre l’eau et l’air</>, u: '°C', vrai: dTm, tol: 0.02, detail: `ΔT_m = (${t1(df.T0)} + ${t1(df.T0 - df.drop)})/2 − ${t1(df.Text)} = ${t1(dTm)} °C` },
    { id: 'lam', q: <>Conductivité thermique λ de la paroi</>, u: 'W·m⁻¹·K⁻¹', vrai: lam, tol: 0.03, detail: `λ = φ·e / (S·ΔT_m) = ${nf(phi)} × ${nf(df.emm / 1000)} / (${nf(S)} × ${t1(dTm)}) = ${nf(lam)} W·m⁻¹·K⁻¹` },
  ];
}

// ════════════════ SIMULATION ════════════════
export function SimulationBouilloire() {
  const [mode, setMode] = useState('explore');
  const [guide, setGuide] = useEtatPersistant('bouilloire-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [rg, setRg] = useEtatPersistant('bouilloire-guide-reglage-v1', { reel: false });
  const [ux, setUx] = useState({ ...BASE, eff: { ...TOUS } });
  const [run, setRun] = useState({ cle: '', t: 0, marche: false });
  const [vitesse, setVitesse] = useState(10);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [paramOuv, setParamOuv] = useState(false);
  const [defi, setDefi] = useState(null);
  const [typeDefi, setTypeDefi] = useState('releve');
  useEffect(() => { if (guide.etape === 0) setRg({ reel: false }); }, [guide.etape, setRg]);

  // ── Parcours guidé : phase « monde idéal » puis « bouilloire réelle » ──
  const IDS = ['intro', 'energie', 'go', 'meau', 'deuxDT', 'Q', 'phi', 'chemin', 'S', 'dTm', 'lambda', 'verdict', 'reel', 'lambdaReel', 'flux', 'film', 'effets', 'conclusion', 'bravo'];
  const iEt = id => IDS.indexOf(id);
  const etape = guide.etape, enGuide = mode === 'guide';
  const vu = id => etape >= iEt(id);
  const phaseReel = etape > iEt('reel') || (etape === iEt('reel') && rg.reel);
  const uG = { ...GUIDE, enrichi: phaseReel, eff: { ...TOUS } };
  const u = enGuide ? uG : ux;
  const p = versP(u);
  const cle = `${mode}|${JSON.stringify(p)}`;
  const s = useMemo(() => simuler(p), [cle]);              // eslint-disable-line react-hooks/exhaustive-deps
  const forceFin = enGuide && ((!phaseReel && etape > iEt('go')) || (phaseReel && etape > iEt('reel')));
  const t = forceFin ? s.tEnd : (run.cle === cle ? run.t : 0);
  const fini = t >= s.tEnd - 1e-9, enMarche = run.cle === cle && run.marche && !forceFin;
  const T = s.Tde(t);
  const tEndRef = useRef(s.tEnd); tEndRef.current = s.tEnd;
  const lancer = () => setRun({ cle, t: 0, marche: true });
  const allerFin = () => setRun({ cle, t: s.tEnd, marche: false });
  useEffect(() => {
    if (!run.marche) return undefined;
    let raf, prec = null;
    const pas = ts => {
      if (prec != null) {
        const d = Math.min(0.1, (ts - prec) / 1000) * vitesse;
        setRun(r => { if (!r.marche) return r; const tt = Math.min(r.t + d, tEndRef.current); return { ...r, t: tt, marche: tt < tEndRef.current }; });
      }
      prec = ts; raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [run.marche, vitesse]);

  // Valeurs attendues du parcours (calculées à partir des valeurs affichées, comme le ferait l'élève)
  const pId = versP({ ...GUIDE, enrichi: false }), pRe = versP({ ...GUIDE, enrichi: true, eff: { ...TOUS } });
  const sId = simuler(pId), sRe = simuler(pRe);
  const A = (() => {
    const m = (GUIDE.mPlein - GUIDE.mVide) / 1000, Q = -m * C_EAU * GUIDE.drop, dt = r1(sId.tEnd), dtR = r1(sRe.tEnd);
    const S = GUIDE.ccm / 100 * GUIDE.hcm / 100, dTm = GUIDE.T0 - GUIDE.drop / 2 - GUIDE.Text, e = GUIDE.emm / 1000;
    const tot = sRe.flux.lat + sRe.flux.cf + sRe.flux.ev, eff = tableEffets(pRe);
    return { m, Q, dt, dtR, phi: -Q / dt, S, dTm, e, lam: (-Q / dt) * e / (S * dTm), lamR: (-Q / dtR) * e / (S * dTm),
      partLat: Math.round(100 * sRe.flux.lat / tot), Tse: sRe.Tse, dTabs: sRe.Tsi - sRe.Tse, eff: Object.fromEntries(eff.map(l => [l.id, l.ecart])) };
  })();
  const ETAPES = [
    { id: 'intro', titre: 'La bouilloire vient de s’arrêter', focus: ['schema'],
      texte: <>L’eau vient de bouillir : la bouilloire s’arrête, l’eau est à <strong>θ₁′ = 100,0 °C</strong>. L’air autour, renouvelé par un ventilateur, est à <strong>T<Sub c="ext"/> = 21,0 °C</strong>.</>,
      tache: { type: 'qcm', q: 'Que va faire la température de l’eau ?', options: ['Elle va baisser : l’eau cède de l’énergie à l’air, plus froid', 'Elle va rester à 100 °C', 'Elle va monter'], bonne: 0,
        expl: 'Le transfert thermique va toujours du plus chaud vers le plus froid : l’eau perd de l’énergie, sa température baisse.' } },
    { id: 'energie', titre: 'Où va l’énergie perdue par l’eau ?', focus: ['schema'],
      texte: <>L’eau est enfermée dans la bouilloire. L’énergie qu’elle perd ne disparaît pas.</>,
      tache: { type: 'qcm', q: 'L’énergie perdue par l’eau…', options: ['traverse les parois de la bouilloire, puis part dans l’air', 'disparaît', 'reste dans l’eau'], bonne: 0,
        expl: 'L’énergie se conserve : celle que l’eau perd traverse les parois par conduction, puis est emportée par l’air. C’est cette traversée de la paroi qui va permettre de mesurer la conductivité thermique λ du plastique.' } },
    { id: 'go', titre: 'Le protocole : chronométrer une baisse de 3,0 °C', focus: ['schema', 'graphe'],
      texte: <>On déclenche le chronomètre quand la bouilloire s’arrête (θ₁′ = 100,0 °C) et on l’arrête quand l’eau a perdu <strong>3,0 °C</strong> (θ₁″ = 97,0 °C). La simulation accélère le temps ; le chronomètre affiche le temps réel de l’expérience.</>,
      tache: { type: 'action', ok: fini && !phaseReel, label: '▶ Lancer l’expérience', faire: lancer, attente: enMarche ? 'Expérience en cours… le chronomètre s’arrête tout seul à 97,0 °C.' : null,
        consigne: fini ? null : 'Lancez l’expérience et attendez l’arrêt du chronomètre' } },
    { id: 'meau', titre: 'La masse d’eau', focus: ['releve'],
      texte: <>Le relevé donne la masse de la bouilloire vide et celle de la bouilloire pleine.</>,
      tache: { type: 'num', q: 'Masse d’eau m_eau', unite: 'kg', vrai: A.m, tol: 0.005, affiche: x => dec(x, 3),
        pieges: [[2.19, 'C’est la masse de la bouilloire pleine : retirez la masse de la bouilloire vide.'], [0.599, 'C’est la masse de la bouilloire vide.']],
        expl: 'm_eau = m_plein − m_vide = 2 190 − 599 = 1 591 g = 1,591 kg (en kg, l’unité de la capacité thermique).' } },
    { id: 'deuxDT', titre: 'Deux écarts de température à ne pas confondre', focus: ['graphe'],
      texte: <>Le graphique (échelle complète) montre deux écarts très différents : la <strong>baisse de température de l’eau</strong> pendant la mesure (toute petite) et l’<strong>écart entre l’eau et l’air</strong> (grand).</>,
      tache: { type: 'qcm', q: 'Pour calculer l’énergie Q perdue par l’eau, Q = m · C · ΔT, quel écart de température faut-il prendre ?',
        options: ['La baisse de température de l’eau : de θ₁′ = 100,0 °C à θ₁″ = 97,0 °C', 'L’écart entre l’eau et l’air, d’environ 78 °C', 'La température de l’eau, 100 °C'], bonne: 0,
        expl: 'Q = m·C·ΔT décrit le système « eau » : ΔT est la variation de SA température entre le début et la fin de la mesure. L’écart entre l’eau et l’air servira plus tard, pour la paroi.' } },
    { id: 'Q', titre: 'L’énergie perdue par l’eau', focus: ['releve'],
      texte: <>Q = m<Sub c="eau"/> · C<Sub c="eau"/> · (θ₁″ − θ₁′), avec C<Sub c="eau"/> = 4 185 J·kg⁻¹·°C⁻¹. Donnez Q <strong>en kJ, avec son signe</strong>.</>,
      tache: { type: 'num', q: 'Énergie Q (en kJ, avec son signe)', unite: 'kJ', vrai: A.Q / 1000, tol: 0.02, affiche: x => nf(x, 4),
        pieges: [[-A.Q / 1000, 'L’eau cède de l’énergie : Q est négative (ce qui sort du système est compté négativement).'],
          [-A.m * C_EAU * 77.5 / 1000, 'Pour Q, on utilise la variation de température de l’eau (3,0 °C), pas l’écart entre l’eau et l’air.'],
          [-A.m * C_EAU * 100 / 1000, 'ΔT est la variation de température de l’eau pendant la mesure (θ₁″ − θ₁′ = −3,0 °C), pas sa température.']],
        expl: `Q = 1,591 × 4 185 × (97,0 − 100,0) ≈ ${nf(A.Q, 4)} J ≈ ${nf(A.Q / 1000, 4)} kJ : négative, car l’eau cède de l’énergie.` } },
    { id: 'phi', titre: 'La puissance thermique', focus: ['releve', 'graphe'],
      texte: <>Cette énergie est sortie de l’eau pendant la durée Δt lue au chronomètre. La puissance thermique (énergie perdue par seconde) vaut <strong>φ = |Q| / Δt</strong>.</>,
      tache: { type: 'num', q: 'Puissance thermique φ', unite: 'W', vrai: A.phi, tol: 0.02, affiche: x => nf(x),
        pieges: [[-A.Q * A.dt, 'On divise l’énergie par la durée : φ = |Q| / Δt.'], [A.Q / A.dt, 'φ est la valeur absolue : prenez |Q|.']],
        expl: `φ = ${nf(-A.Q, 4)} J / ${dec(A.dt, 1)} s ≈ ${nf(A.phi)} W : l’eau perd environ ${nf(A.phi, 2)} J chaque seconde.` } },
    { id: 'chemin', titre: 'Par où sort cette énergie ?', focus: ['schema'],
      texte: <>Le modèle du TP fait une <strong>grosse approximation</strong> : toute cette énergie traverse la <strong>paroi latérale</strong> en plastique (les flèches orange) ; rien ne sort par le couvercle, le fond ou la vapeur. On reviendra sur cette hypothèse.</>,
      tache: { type: 'qcm', q: 'Avec cette hypothèse, la puissance qui traverse la paroi latérale est…', options: ['égale à la puissance perdue par l’eau, φ = |Q| / Δt', 'plus petite que φ', 'nulle, car la paroi est isolante'], bonne: 0,
        expl: 'Ce que l’eau perd, la paroi latérale le transmet : la même puissance φ traverse la paroi. On peut donc relier φ aux caractéristiques de la paroi (λ, S, e).' } },
    { id: 'S', titre: 'La surface de la paroi latérale', focus: ['schema', 'releve'],
      texte: <>On modélise la bouilloire par un <strong>cylindre</strong>. Déroulée, sa paroi latérale (au contact de l’eau) est un rectangle de longueur c (la circonférence) et de largeur h (la hauteur d’eau) : <strong>S = c × h</strong>.</>,
      tache: { type: 'num', q: 'Surface latérale S', unite: 'm²', vrai: A.S, tol: 0.02, affiche: x => nf(x),
        pieges: [[A.S * 1e4, 'c et h en cm donnent des cm² : convertissez d’abord en m (0,426 m et 0,143 m).'], [0.426 ** 2 / (4 * Math.PI), 'C’est l’aire du fond (un disque) : la surface latérale est c × h.'], [Math.PI * A.S, 'S = c × h : la circonférence c contient déjà le π (c = π × D).']],
        expl: `S = 0,426 m × 0,143 m ≈ ${nf(A.S)} m².` } },
    { id: 'dTm', titre: 'L’écart de température de part et d’autre de la paroi', focus: ['graphe'],
      texte: <>La puissance qui traverse une paroi dépend de l’écart de température entre ses deux côtés : l’<strong>eau</strong> dedans, l’<strong>air</strong> dehors. Ce n’est pas la baisse de 3,0 °C ! Comme l’eau passe de 100,0 à 97,0 °C pendant la mesure, on prend sa <strong>température moyenne</strong> θ<Sub c="moy"/> = (θ₁′ + θ₁″) / 2 : c’est une approximation.</>,
      tache: { type: 'num', q: 'Écart moyen ΔT_m = θ_moy − T_ext', unite: '°C', vrai: A.dTm, tol: 0.005, affiche: x => dec(x, 1),
        pieges: [[3, 'C’est la baisse de température de l’eau, utilisée pour Q. Pour la paroi, il faut l’écart entre l’eau et l’air.'], [79, 'θ₁′ − T_ext : prenez la température moyenne de l’eau pendant la mesure.'],
          [76, 'θ₁″ − T_ext : prenez la température moyenne de l’eau pendant la mesure.'], [98.5, 'C’est la température moyenne de l’eau : retirez la température de l’air.']],
        expl: 'θ_moy = (100,0 + 97,0) / 2 = 98,5 °C, donc ΔT_m = 98,5 − 21,0 = 77,5 °C : 26 fois plus que la baisse de 3,0 °C.' } },
    { id: 'lambda', titre: 'La conductivité thermique de la paroi', focus: ['releve'],
      texte: <>Pour une paroi plane d’épaisseur e : φ = λ · S · ΔT<Sub c="m"/> / e, donc <strong>λ = φ · e / (S · ΔT<Sub c="m"/>)</strong>. Attention à l’unité de e.</>,
      tache: { type: 'num', q: 'Conductivité thermique λ de la paroi', unite: 'W·m⁻¹·K⁻¹', vrai: A.lam, tol: 0.03, affiche: x => nf(x, 2),
        pieges: [[A.lam * 100, 'e = 2,1 mm = 0,0021 m : l’épaisseur doit être en mètres.'], [A.lam * A.dTm / 3, 'Vous avez pris ΔT = 3,0 °C : pour la paroi, il faut l’écart eau – air ΔT_m = 77,5 °C.'],
          [A.lam * A.dTm / 79, 'Prenez ΔT_m = 77,5 °C (température moyenne de l’eau).']],
        expl: `λ = ${nf(A.phi)} × 0,0021 / (${nf(A.S)} × 77,5) ≈ ${nf(A.lam, 2)} W·m⁻¹·K⁻¹.` } },
    { id: 'verdict', titre: 'Le verdict', focus: [],
      texte: <>La simulation utilisait une paroi en ABS, de conductivité <strong>λ = 0,16 W·m⁻¹·K⁻¹</strong>, dans un monde où <strong>toutes les hypothèses du TP sont exactement vraies</strong>.</>,
      tache: { type: 'qcm', q: 'Que montre votre résultat ?', options: ['Quand les hypothèses sont vraies, la méthode du TP retrouve la bonne valeur de λ', 'La méthode du TP donne toujours la bonne valeur, même dans une vraie bouilloire', 'La méthode du TP est fausse'], bonne: 0,
        expl: 'Dans ce monde « idéal », vous retrouvez 0,16. Pourtant, en TP, on trouve plutôt 0,13 : regardons une bouilloire plus réaliste.' } },
    { id: 'reel', titre: 'Une bouilloire plus réaliste', focus: ['schema'],
      texte: <>Même bouilloire, même eau, même ABS (λ = 0,16). Mais la simulation tient compte cette fois de ce que le modèle du TP néglige : les <strong>films d’eau et d’air</strong> contre la paroi, les pertes par le <strong>couvercle et le fond</strong>, l’<strong>évaporation</strong> et la <strong>capacité thermique de la bouilloire</strong>.</>,
      tache: { type: 'action', ok: phaseReel && fini, label: rg.reel ? null : 'Passer à la bouilloire réaliste', faire: () => setRg(x => ({ ...x, reel: true })),
        attente: enMarche ? 'Expérience en cours…' : null, consigne: phaseReel && fini ? null : rg.reel ? 'Relancez l’expérience avec « ▶ Lancer » (au-dessus de la bouilloire)' : 'Cliquez, puis relancez l’expérience' } },
    { id: 'lambdaReel', titre: 'Refaire le calcul', focus: ['releve'],
      texte: <>Seule la durée Δt a changé. Refaites le calcul de λ avec la nouvelle durée : Q, S et ΔT<Sub c="m"/> sont inchangés.</>,
      tache: { type: 'num', q: 'λ calculée avec le nouveau Δt', unite: 'W·m⁻¹·K⁻¹', vrai: A.lamR, tol: 0.03, affiche: x => nf(x, 2),
        pieges: [[0.16, 'C’est la vraie valeur de la simulation : refaites le calcul avec le nouveau Δt.'], [A.lam, 'C’est le résultat avec l’ancien Δt.']],
        expl: `λ = (${nf(-A.Q, 4)} / ${dec(A.dtR, 1)}) × 0,0021 / (${nf(A.S)} × 77,5) ≈ ${nf(A.lamR, 2)} W·m⁻¹·K⁻¹, au lieu de 0,16 : comme en TP, on trouve moins que la valeur de référence.` } },
    { id: 'flux', titre: 'Où passe vraiment l’énergie ?', focus: ['flux'],
      texte: <>Le bilan montre par où sort l’énergie de cette bouilloire réaliste.</>,
      tache: { type: 'qcm', q: 'Quelle part de l’énergie traverse la paroi latérale ?', options: [`Environ ${A.partLat} %`, '100 %, comme le suppose le modèle du TP', 'Moins de 10 %'], bonne: 0,
        expl: 'Le reste sort par le couvercle, le fond et avec la vapeur. Attribuer toute l’énergie perdue à la seule paroi latérale ferait croire à une paroi plus conductrice : cet effet seul ferait trouver un λ trop grand.' } },
    { id: 'film', titre: 'La paroi voit-elle vraiment 77,5 °C ?', focus: ['profil'],
      texte: <>Le schéma montre les températures à travers la paroi latérale.</>,
      tache: { type: 'qcm', q: 'La face extérieure de la paroi est-elle à la température de l’air (21 °C) ?', options: [`Non : elle est à environ ${Math.round(A.Tse)} °C`, 'Oui, grâce au ventilateur', 'Elle est à 98,5 °C, comme l’eau'], bonne: 0,
        expl: `Un film d’air, même brassé par le ventilateur, freine le transfert (c’est la convection). L’ABS ne « voit » qu’environ ${Math.round(A.dTabs)} °C sur les 77,5 °C. Le modèle du TP attribue tout l’écart à l’ABS : cet effet seul ferait trouver un λ trop petit. (Une bouilloire en plastique est d’ailleurs brûlante au toucher.)` } },
    { id: 'effets', titre: 'Quelle hypothèse pèse le plus ?', focus: ['effets'],
      texte: <>Le tableau donne le λ que trouverait un élève si on ajoutait <strong>un seul</strong> effet au modèle du TP, puis tous ensemble.</>,
      tache: { type: 'qcm', q: 'Quel effet fait le plus baisser le λ mesuré ?', options: ['Les films d’eau et d’air contre la paroi', 'L’évaporation', 'Les pertes par le couvercle et le fond'], bonne: 0,
        expl: `Films : ${pct(A.eff.films)} ; couvercle et fond : ${pct(A.eff.cf)} ; évaporation : ${pct(A.eff.evap)} ; capacité de la bouilloire : ${pct(A.eff.corps)}. Les effets se compensent en partie : au total ${pct(A.eff.tous)}.` } },
    { id: 'conclusion', titre: 'Et votre TP ?', focus: ['hypo'],
      texte: <>Ouvrez l’encadré « Hypothèses de travail » sous la simulation.</>,
      tache: { type: 'qcm', q: 'En TP, on trouve λ ≈ 0,13 pour 0,16 attendu. Que peut-on conclure ?',
        options: ['L’ordre de grandeur est bon, mais l’écart vient surtout des hypothèses du modèle, dont les erreurs se compensent en partie', 'Le TP mesure exactement λ : l’écart vient des erreurs de lecture', 'La bouilloire n’est pas en ABS'], bonne: 0,
        expl: 'Le TP mesure une conductivité « apparente ». Trouver une valeur proche de la référence ne prouve pas que les hypothèses sont vraies : plusieurs erreurs peuvent se compenser. Attention : les paramètres de la bouilloire réaliste sont des ordres de grandeur plausibles, pas des mesures sur votre bouilloire.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous savez distinguer la <strong>baisse de température de l’eau</strong> (pour Q = m·C·ΔT) de l’<strong>écart entre l’eau et l’air</strong> (pour la paroi, φ = λ·S·ΔT<Sub c="m"/>/e), relier les deux par la puissance φ = |Q|/Δt, et critiquer les hypothèses du modèle. En exploration libre, changez le matériau (verre, inox), arrêtez le ventilateur, ou désactivez les effets un par un.</>, tache: null },
  ];
  const et = ETAPES[Math.min(etape, ETAPES.length - 1)];
  const hl = id => enGuide && et.focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ── Éléments de la vue ──
  const enrichi = enGuide ? phaseReel : ux.enrichi;
  const montrer = {
    graphe: !enGuide || vu('go'),
    dT: !enGuide || vu('deuxDT'),
    valDTm: !enGuide || etape > iEt('dTm'),
    flux: enrichi && (!enGuide || vu('flux')),
    profil: !enGuide || vu('film'),
    effets: enrichi && (!enGuide || vu('effets')),
  };
  const lignesEffets = useMemo(() => (montrer.effets ? tableEffets(p) : []), [cle, montrer.effets]);  // eslint-disable-line react-hooks/exhaustive-deps
  const boutonsRun = (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      <button onClick={lancer} disabled={enMarche} style={{ ...stylePetitBouton(true, '#15803d'), opacity: enMarche ? 0.5 : 1 }}>▶ Lancer</button>
      <button onClick={allerFin} disabled={fini} style={{ ...stylePetitBouton(false), opacity: fini ? 0.45 : 1 }}>⏩ Résultat immédiat</button>
      <span style={{ fontSize: 12.5, color: KIT.txt2 }}>vitesse :</span>
      {[1, 10, 50].map(v => <button key={v} onClick={() => setVitesse(v)} style={stylePetitBouton(vitesse === v, '#334155')}>×{v}</button>)}
    </div>);
  const titreBoite = txt => <div style={{ fontWeight: 700, fontSize: 14, color: KIT.txt, marginBottom: 6 }}>{txt}</div>;
  const vue = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="bo-l2">
        <div style={{ ...styleBoite, ...cadre('schema') }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: KIT.txt }}>{enrichi ? 'Bouilloire réaliste (modèle enrichi)' : 'Bouilloire du modèle du TP'}</div>
          </div>
          {boutonsRun}
          <Schema u={u} s={s} T={T} t={t} fini={fini} enrichi={enrichi} flux={s.flux}/>
          {(!enGuide || etape > iEt('Q')) && (
            <div style={{ fontSize: 13.5, color: KIT.txt }}>
              Énergie déjà cédée par l’eau : m·C·(θ₁′ − θ) = <strong style={{ color: ORANGE }}>{nf(u.m * C_EAU * (u.T0 - T) / 1000, 3)} kJ</strong>
              <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, marginTop: 3 }}>
                <div style={{ height: 8, borderRadius: 4, background: ORANGE, width: `${Math.min(100, 100 * (u.T0 - T) / u.drop)}%` }}/>
              </div>
            </div>)}
        </div>
        {montrer.graphe && (
          <div style={{ ...styleBoite, ...cadre('graphe'), display: 'flex', flexDirection: 'column', gap: 8 }}>
            {titreBoite('Température de l’eau au cours du temps')}
            <GrapheGlobal u={u} s={s} t={t} fini={fini} montrerDT={montrer.dT} valeurDTm={montrer.valDTm}/>
            <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Zoom sur la baisse chronométrée</div>
            <GrapheZoom u={u} s={s} t={t} fini={fini}/>
          </div>)}
      </div>
      <div className="bo-l2">
        <div style={{ ...styleBoite, ...cadre('releve') }}>
          {titreBoite('Relevé (comme en TP)')}
          <Releve u={u} s={s} fini={fini} masses={enGuide ? [GUIDE.mVide, GUIDE.mPlein] : null}/>
        </div>
        {montrer.profil && (
          <div style={{ ...styleBoite, ...cadre('profil') }}>
            {titreBoite('Températures à travers la paroi latérale')}
            <ProfilParoi u={u} s={s}/>
          </div>)}
      </div>
      {(montrer.flux || montrer.effets) && (
        <div className="bo-l2">
          {montrer.flux && (
            <div style={{ ...styleBoite, ...cadre('flux') }}>
              {titreBoite('Par où sort l’énergie ? (puissances à θ = θ_moy)')}
              <BarreFlux s={s}/>
              <div style={{ fontSize: 12.5, color: KIT.txt2 }}>Le modèle du TP suppose 100 % par la paroi latérale.{s.E.corps && <> La bouilloire elle-même cède aussi un peu d’énergie en refroidissant (C<Sub c="corps"/> = {u.Ccorps} J·K⁻¹, contre {nf(u.m * C_EAU, 3)} J·K⁻¹ pour l’eau).</>}</div>
            </div>)}
          {montrer.effets && (
            <div style={{ ...styleBoite, ...cadre('effets') }}>
              {titreBoite('Quelle hypothèse pèse le plus sur λ ?')}
              <TableEffets lignes={lignesEffets} lam={p.lam}/>
            </div>)}
        </div>)}
    </div>
  );

  // ════════════════ EXPLORATION : réglages et calcul ════════════════
  const maj = o => setUx(x => ({ ...x, ...o }));
  const majEff = o => setUx(x => ({ ...x, eff: { ...x.eff, ...o } }));
  const lab = { fontSize: 12.5, color: KIT.txt2, fontWeight: 700 };
  const sel = { fontSize: 13.5, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, background: 'white', color: KIT.txt };
  const caseE = (k, txt) => (
    <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13.5, color: ux.enrichi ? KIT.txt : '#94a3b8', cursor: 'pointer' }}>
      <input type="checkbox" disabled={!ux.enrichi} checked={ux.eff[k]} onChange={e => majEff({ [k]: e.target.checked })}/>{txt}
    </label>);
  const reglages = (
    <div style={styleBoite}>
      {titreBoite('Réglages')}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <button onClick={() => maj({ enrichi: false })} style={stylePetitBouton(!ux.enrichi, '#0f766e')}>Modèle du TP (hypothèses des élèves)</button>
        <button onClick={() => maj({ enrichi: true })} style={stylePetitBouton(ux.enrichi, '#0f766e')}>Bouilloire réaliste (modèle enrichi)</button>
        <button onClick={() => setUx({ ...BASE, eff: { ...TOUS }, enrichi: ux.enrichi })} style={stylePetitBouton(false, '#334155')}>↺ Valeurs du TP</button>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 8, opacity: ux.enrichi ? 1 : 0.6 }}>
        {caseE('films', 'films d’eau et d’air')}
        {caseE('cf', 'pertes par le couvercle et le fond')}
        {caseE('evap', 'évaporation')}
        {caseE('corps', 'capacité thermique de la bouilloire')}
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13.5, color: ux.enrichi && ux.eff.films ? KIT.txt : '#94a3b8', cursor: 'pointer' }}>
          <input type="checkbox" disabled={!ux.enrichi || !ux.eff.films} checked={ux.vent} onChange={e => maj({ vent: e.target.checked })}/>ventilateur en marche
        </label>
      </div>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
        <span style={lab}>Matériau de la paroi</span>
        <select value={ux.mat} onChange={e => maj({ mat: e.target.value })} style={{ ...sel, maxWidth: 320 }} aria-label="Matériau de la paroi">
          {Object.entries(MATS_B).map(([k, m]) => <option key={k} value={k}>{m.nom} (λ = {nf(m.lam)} W·m⁻¹·K⁻¹)</option>)}
        </select>
      </label>
      <div className="bo-curseurs">
        <Curseur nom="Masse d’eau m_eau" valeur={ux.m} onChange={v => maj({ m: v })} min={0.5} max={1.7} pas={0.001} unite="kg" decimales={3} couleur={ROUGE}/>
        <Curseur nom="Hauteur d’eau h" valeur={ux.hcm} onChange={v => maj({ hcm: v })} min={5} max={19} pas={0.1} unite="cm" decimales={1} couleur="#334155"/>
        <Curseur nom="Circonférence c" valeur={ux.ccm} onChange={v => maj({ ccm: v })} min={30} max={55} pas={0.1} unite="cm" decimales={1} couleur="#334155"/>
        <Curseur nom="Épaisseur de la paroi e" valeur={ux.emm} onChange={v => maj({ emm: v })} min={0.5} max={5} pas={0.1} unite="mm" decimales={1} couleur="#334155"/>
        <Curseur nom="Température de l’air T_ext" valeur={ux.Text} onChange={v => maj({ Text: v })} min={10} max={30} pas={0.5} unite="°C" decimales={1} couleur={BLEU}/>
        <Curseur nom="Température au départ θ₁′" valeur={ux.T0} onChange={v => maj({ T0: v })} min={99} max={100.5} pas={0.1} unite="°C" decimales={1} couleur={ROUGE}/>
        <Curseur nom="Baisse chronométrée" valeur={ux.drop} onChange={v => maj({ drop: v })} min={1} max={10} pas={0.5} unite="°C" decimales={1} couleur={VIOLET}/>
      </div>
      <Section titre="Paramètres du modèle enrichi (ordres de grandeur, non mesurés)" ouvert={paramOuv} onBascule={() => setParamOuv(o => !o)}>
        <div className="bo-curseurs">
          <Curseur nom="h côté eau (convection naturelle)" valeur={ux.hint} onChange={v => maj({ hint: v })} min={100} max={2000} pas={50} unite="W·m⁻²·K⁻¹" couleur="#0369a1"/>
          <Curseur nom="h côté air, ventilateur en marche" valeur={ux.hextVent} onChange={v => maj({ hextVent: v })} min={15} max={150} pas={1} unite="W·m⁻²·K⁻¹" couleur="#0369a1"/>
          <Curseur nom="h côté air, ventilateur arrêté" valeur={ux.hextSans} onChange={v => maj({ hextSans: v })} min={5} max={30} pas={1} unite="W·m⁻²·K⁻¹" couleur="#0369a1"/>
          <Curseur nom="Puissance d’évaporation à 100 °C" valeur={ux.P100} onChange={v => maj({ P100: v })} min={0} max={300} pas={5} unite="W" couleur={CIEL}/>
          <Curseur nom="Capacité thermique de la bouilloire" valeur={ux.Ccorps} onChange={v => maj({ Ccorps: v })} min={0} max={1000} pas={10} unite="J·K⁻¹" couleur={AMBRE}/>
        </div>
      </Section>
    </div>
  );
  const lamMes = fini ? lambdaEleve(p, s.tEnd) : NaN, ligne = { fontSize: 14, color: KIT.txt, lineHeight: 1.7 };
  const Qx = ux.m * C_EAU * ux.drop, Sx = p.c * p.h, dTmx = ux.T0 - ux.drop / 2 - ux.Text;
  const calcul = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={ligne}><strong>1. Énergie perdue par l’eau</strong> (baisse de l’eau) : Q = m·C·(θ₁″ − θ₁′) = {dec(ux.m, 3)} × 4 185 × (−{dec(ux.drop, 1)}) = <strong>{nf(-Qx / 1000, 4)} kJ</strong></div>
      <div style={ligne}><strong>2. Puissance</strong> : φ = |Q| / Δt = {nf(Qx, 4)} / {fini ? dec(s.tEnd, 1) : 'Δt'} = <strong>{fini ? `${nf(Qx / s.tEnd)} W` : '— (lancez l’expérience)'}</strong></div>
      <div style={ligne}><strong>3. Surface latérale</strong> : S = c × h = {nf(p.c)} × {nf(p.h)} = <strong>{nf(Sx)} m²</strong></div>
      <div style={ligne}><strong>4. Écart eau – air</strong> : ΔT<Sub c="m"/> = (θ₁′ + θ₁″)/2 − T<Sub c="ext"/> = {t1(ux.T0 - ux.drop / 2)} − {t1(ux.Text)} = <strong>{dec(dTmx, 1)} °C</strong></div>
      <div style={ligne}><strong>5. Conductivité</strong> : λ = φ·e / (S·ΔT<Sub c="m"/>) = <strong>{fini ? `${nf(lamMes, 3)} W·m⁻¹·K⁻¹` : '—'}</strong>
        {fini && <span style={{ color: Math.abs(lamMes / p.lam - 1) < 0.01 ? '#15803d' : '#b45309' }}> (valeur de la simulation : {nf(p.lam)} ; écart {pct(lamMes / p.lam - 1)})</span>}</div>
    </div>
  );

  // ════════════════ DÉFI ════════════════
  function nouveauDefi(ty = typeDefi) { setDefi(tirageDefi(ty)); }
  function changerMode(m) { setMode(m); if (m === 'defi' && !defi) nouveauDefi(); }
  const voletDefi = defi && (() => {
    const Q = questionsDefi(defi), juste = q => proche(lireNombre(defi.reps[q.id]), q.vrai, q.tol);
    const setRep = (id, v) => setDefi(df => ({ ...df, verifie: false, reps: { ...df.reps, [id]: v } }));
    const cell = { padding: '3px 8px', fontSize: 14, borderBottom: `1px solid ${KIT.bord}` };
    const donnees = defi.type === 'releve'
      ? [['θ₂ = T_ext', `${t1(defi.Text)} °C`], ['m_vide', `${defi.mVide} g`], ['m_plein', `${defi.mPlein.toLocaleString('fr-FR')} g`], ['h', `${dec(defi.hcm, 1)} cm`], ['c', `${dec(defi.ccm, 1)} cm`],
        ['e', `${dec(defi.emm / 10, 2)} cm`], ['θ₁′', `${t1(defi.T0)} °C`], ['θ₁″', `${t1(defi.T0 - defi.drop)} °C`], ['Δt', `${defi.dt} s`]]
      : [['T_ext', `${t1(defi.Text)} °C`], ['m_eau', `${dec(defi.m, 2)} kg`], ['h', `${dec(defi.hcm, 1)} cm`], ['c', `${dec(defi.ccm, 1)} cm`], ['e', `${dec(defi.emm, 1)} mm`],
        ['paroi', `${MATS_B[defi.mat].nom}, λ = ${nf(MATS_B[defi.mat].lam)} W·m⁻¹·K⁻¹`], ['θ₁′', `${t1(defi.T0)} °C`], ['θ₁″', `${t1(defi.T0 - defi.drop)} °C`]];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => { setTypeDefi('releve'); nouveauDefi('releve'); }} style={stylePetitBouton(defi.type === 'releve', '#0ea5e9')}>Exploiter un relevé (comme en TP)</button>
          <button onClick={() => { setTypeDefi('prevoir'); nouveauDefi('prevoir'); }} style={stylePetitBouton(defi.type === 'prevoir', '#0ea5e9')}>Prévoir la durée</button>
        </div>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>
          {defi.type === 'releve'
            ? <>Un groupe a réalisé le TP sur une autre bouilloire (protocole identique : baisse de {dec(defi.drop, 1)} °C chronométrée). Exploitez son relevé avec le modèle du TP.</>
            : <>Avant de faire l’expérience, on veut prévoir avec le modèle du TP la durée de la baisse de {dec(defi.drop, 1)} °C pour cette bouilloire.</>}
        </div>
        <table style={{ borderCollapse: 'collapse', background: 'white', maxWidth: 460 }}>
          <tbody>{donnees.map(([a, b]) => <tr key={a}><td style={{ ...cell, color: KIT.txt2 }}>{indicesProfond(a)}</td><td style={{ ...cell, fontWeight: 700, color: KIT.txt }}>{b}</td></tr>)}</tbody>
        </table>
        <div style={{ fontSize: 13, color: KIT.txt2 }}>C<Sub c="eau"/> = 4 185 J·kg⁻¹·°C⁻¹ ; Q = m·C·ΔT ; φ = |Q| / Δt ; S = c × h ; φ = λ·S·ΔT<Sub c="m"/> / e. Notation possible : 1,2e-3.</div>
        {Q.map((q, k) => {
          const ok = juste(q);
          return (
            <div key={q.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {q.q}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={defi.reps[q.id] || ''} placeholder="?" aria-label={`Réponse au défi ${k + 1}`} onChange={e => setRep(q.id, e.target.value)}
                  style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 130 }}/>
                <span style={{ fontSize: 14, color: KIT.txt2 }}>{q.u}</span>
                {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
              {defi.verifie && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 3 }}>Réponse attendue : <strong>{nf(q.vrai, 4)} {q.u}</strong> — {indicesProfond(q.detail)}</div>}
            </div>);
        })}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => setDefi(df => ({ ...df, verifie: true }))} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
          <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}>🔄 Nouvelles données</button>
          {defi.verifie && <span style={{ fontSize: 14, fontWeight: 700, color: KIT.txt }}>{Q.filter(juste).length} / {Q.length} réponses justes</span>}
        </div>
        <div style={{ fontSize: 12.5, color: KIT.txt2 }}>Réponses acceptées à 2 % près (3 % pour λ ; 0,5 % pour la masse).</div>
      </div>
    );
  })();

  // ════════════════ HYPOTHÈSES ════════════════
  const hypotheses = (
    <div style={{ fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <div style={{ fontWeight: 700, marginBottom: 2 }}>Modèle du TP (hypothèses des élèves)</div>
      <ul style={{ margin: '0 0 8px', paddingLeft: 18 }}>
        <li><strong>Eau à température uniforme</strong> (bien mélangée), celle que lit le thermomètre ; C<Sub c="eau"/> = 4 185 J·kg⁻¹·°C⁻¹ constante.</li>
        <li><strong>Seule l’eau cède de l’énergie</strong> : la capacité thermique de la bouilloire est négligée.</li>
        <li><strong>Toute l’énergie sort par la paroi latérale</strong>, par conduction : rien par le couvercle, le fond ou la vapeur.</li>
        <li><strong>Paroi latérale = cylindre</strong> de circonférence c et de hauteur h (hauteur d’eau) constantes : S = c × h ; épaisseur e uniforme ; paroi considérée comme plane (e est très petite devant le rayon). <em>En vrai, la bouilloire n’est pas un cylindre parfait</em> (plus large en bas qu’en haut) et c est mesurée à l’extérieur : c × h surestime la surface, donc λ (λ ∝ 1/S) d’au plus quelques pour cent. Test possible : c × h est supérieur au volume d’eau réellement versé.</li>
        <li><strong>Faces de la paroi à la température de l’eau et de l’air</strong> : pas de film (on suppose que le ventilateur maintient l’air contre la paroi à T<Sub c="ext"/>), T<Sub c="ext"/> constante.</li>
        <li><strong>Température de l’eau remplacée par sa moyenne</strong> θ<Sub c="moy"/> = (θ₁′ + θ₁″)/2 pendant la mesure. Pour une baisse de 3 °C, l’erreur est négligeable (moins de 0,01 % sur λ ; la simulation, elle, calcule la baisse exacte, exponentielle).</li>
        <li><strong>Conduction quasi stationnaire dans la paroi</strong> : à chaque instant φ = λ·S·(θ − T<Sub c="ext"/>)/e.</li>
      </ul>
      <div style={{ fontWeight: 700, marginBottom: 2 }}>Bouilloire réaliste (modèle enrichi) : effets ajoutés, un par un</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li><strong>Films</strong> : résistances de convection en série avec la paroi, 1/(h<Sub c="eau"/>·S) côté eau (h ≈ {ENRICHI.hint} W·m⁻²·K⁻¹, convection naturelle dans l’eau, ordre de grandeur 100 à 1 000) et 1/(h<Sub c="air"/>·S) côté air (h ≈ {ENRICHI.hextVent} W·m⁻²·K⁻¹ avec ventilateur, {ENRICHI.hextSans} sans ; convection et rayonnement réunis). h est supposé constant ; en réalité il dépend de l’écart de température et de la vitesse de l’air.</li>
        <li><strong>Couvercle et fond</strong> : deux disques d’aire c²/(4π) chacun, supposés faits de la même paroi que le côté (même e, même λ, mêmes films). Hypothèse grossière : le fond repose sur un socle, le couvercle a souvent une autre épaisseur.</li>
        <li><strong>Évaporation</strong> (vapeur qui s’échappe par le bec et le couvercle) : P<Sub c="évap"/> = P<Sub c="100"/> · (p<Sub c="sat"/>(θ) − p<Sub c="v,air"/>) / (p<Sub c="sat"/>(100 °C) − p<Sub c="v,air"/>) (loi de Dalton), p<Sub c="sat"/> par la formule d’Antoine, air à 50 % d’humidité. P<Sub c="100"/> ≈ {ENRICHI.P100} W est mal connue (par exemple, 100 W correspondent à environ 3 g d’eau évaporée en 70 s).</li>
        <li><strong>Capacité thermique de la bouilloire</strong> : C<Sub c="corps"/> ≈ {ENRICHI.Ccorps} J·K⁻¹ (paroi en ABS et plaque chauffante qui refroidissent avec l’eau), à comparer aux ≈ 6 660 J·K⁻¹ de l’eau.</li>
        <li><strong>Ces valeurs par défaut ne sont pas mesurées</strong> : c’est un jeu plausible parmi d’autres, choisi pour retrouver l’ordre de grandeur du TP (Δt ≈ 70 s avec λ = 0,16). D’autres combinaisons donneraient le même Δt : la simulation montre le sens et l’ordre de grandeur de chaque effet, elle ne prouve pas quelle est la cause de l’écart dans votre bouilloire.</li>
        <li>Résolution numérique (Runge-Kutta d’ordre 4, pas de 0,05 s) quand l’évaporation est prise en compte ; sinon la solution exponentielle exacte.</li>
      </ul>
    </div>
  );
  const panneauHypo = (
    <div style={{ ...styleBoite, ...cadre('hypo') }}>
      <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
    </div>
  );
  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défi</button>
    </span>
  );

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .bo-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .bo-l1.cote { grid-template-columns: minmax(0, 2.2fr) minmax(300px, 1fr); }
        .bo-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(330px, 1fr)); }
        .bo-curseurs { display: grid; gap: 0 18px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
        @media (max-width: 960px) { .bo-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Bouilloire : mesurer la conductivité thermique de sa paroi</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div className={`bo-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {mode === 'defi' ? <div style={styleBoite}>{voletDefi}</div> : vue}
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : mode === 'defi' ? <div style={styleBoite}><div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Hypothèses de travail</div>{hypotheses}</div>
            : null}
      </div>
      {mode === 'explore' && <>
        <div style={{ ...styleBoite, marginBottom: 12 }}>
          {titreBoite('Calcul de λ avec la méthode du TP')}
          {calcul}
        </div>
        <div style={{ marginBottom: 12 }}>{reglages}</div>
        <div className="bo-l2">
          <div style={styleBoite}>
            <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
              <li>Modèle du TP : la méthode retrouve-t-elle exactement λ ? Et avec une baisse chronométrée de 10 °C au lieu de 3 °C ?</li>
              <li>Passez à la bouilloire réaliste : de combien le λ mesuré s’écarte-t-il de 0,16 ?</li>
              <li>Arrêtez le ventilateur : que devient la température de la face extérieure, et le λ mesuré ? (C’est la question 1 du TP.)</li>
              <li>Choisissez une paroi en inox, avec le modèle du TP puis avec la bouilloire réaliste : quel Δt est crédible ?</li>
              <li>Désactivez les effets un par un : lesquels font trouver un λ trop grand, lesquels un λ trop petit ?</li>
            </ul>
          </div>
          {panneauHypo}
        </div>
      </>}
      {mode === 'guide' && panneauHypo}
    </div>
  );
}
