import { useState, useEffect } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, Curseur, indicesProfond, lireNombre, proche } from "../commun";

// ====================================================
//  SIM 31 — PAROI PLANE MULTICOUCHE : RÉSISTANCES THERMIQUES EN SÉRIE
// ====================================================

// ── Modèle (fonctions pures) ──
// Conduction à travers une paroi plane, régime stationnaire, flux unidirectionnel perpendiculaire à la paroi.
// Couche i : R_i = e_i / (λ_i · S) en K·W⁻¹. Couches superposées : R_th,global = Σ R_i (la même puissance les traverse toutes).
// P = (T_int − T_ext) / R_th,global (positive de l'intérieur vers l'extérieur) ; écart de température aux bornes d'une couche : ΔT_i = P · R_i.
// Option « films d'air » : R_si = 0,13 et R_se = 0,04 m²·K·W⁻¹ (paroi verticale, flux horizontal, ordres de grandeur de la norme NF EN ISO 6946) ;
// la résistance du film sur la surface S vaut r / S.
export const MATS = {
  platre:      { nom: 'Plaque de plâtre',      lam: 0.33,  coul: '#d6d3d1' },
  laineBois:   { nom: 'Laine de bois',         lam: 0.036, coul: '#fcd34d' },
  polystyrene: { nom: 'Polystyrène expansé',   lam: 0.035, coul: '#a5f3fc' },
  brique:      { nom: 'Brique',                lam: 0.25,  coul: '#e08e6b' },
  beton:       { nom: 'Béton',                 lam: 1.75,  coul: '#9ca3af' },
  verre:       { nom: 'Verre',                 lam: 1.0,   coul: '#93c5fd' },
  air:         { nom: 'Lame d’air immobile',   lam: 0.025, coul: '#f1f5f9' },
  bois:        { nom: 'Bois',                  lam: 0.11,  coul: '#c08457' },
  moquette:    { nom: 'Moquette',              lam: 0.06,  coul: '#f9a8d4' },
  abs:         { nom: 'ABS (plastique)',       lam: 0.16,  coul: '#c4b5fd' },
  inox:        { nom: 'Inox',                  lam: 26,    coul: '#94a3b8' },
  fer:         { nom: 'Fer',                   lam: 80,    coul: '#64748b' },
  aluminium:   { nom: 'Aluminium',             lam: 185,   coul: '#cbd5e1' },
  cuivre:      { nom: 'Cuivre',                lam: 390,   coul: '#d97706' },
};
export const R_SI = 0.13, R_SE = 0.04, PRIX_KWH = 0.17;

export function modeleParoi({ couches, S, Ti, Te, films = false }) {
  const eReel = couches.reduce((a, c) => a + c.e, 0);
  const wFilm = Math.max(4, 0.05 * eReel);                         // largeur de dessin d'un film (non à l'échelle)
  const L = [];
  if (films) L.push({ nom: 'Film d’air intérieur', film: true, e: 0, w: wFilm, lam: null, R: R_SI / S, r: R_SI, coul: '#e2e8f0', u: 'mm' });
  couches.forEach(c => {
    const m = MATS[c.mat];
    L.push({ nom: m.nom, mat: c.mat, film: false, e: c.e, w: c.e, lam: m.lam, R: (c.e / 1000) / (m.lam * S), coul: m.coul, u: c.u || 'mm' });
  });
  if (films) L.push({ nom: 'Film d’air extérieur', film: true, e: 0, w: wFilm, lam: null, R: R_SE / S, r: R_SE, coul: '#e2e8f0', u: 'mm' });
  const Rtot = L.reduce((a, l) => a + l.R, 0), P = (Ti - Te) / Rtot;
  const T = [Ti];
  L.forEach(l => T.push(T[T.length - 1] - P * l.R));
  T[T.length - 1] = Te;                                            // évite la dérive d'arrondi
  return { L, Rtot, P, T, phi: P / S, S, Ti, Te, films };
}

// ── Mise en forme ──
const nf = (x, n = 3) => (isFinite(x) ? Number(x).toLocaleString('fr-FR', { maximumSignificantDigits: n }) : '—');
const dec = (x, d) => Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const t1 = x => (isFinite(x) ? dec(Math.round(x * 10) / 10, 1) : '—');
const Sub = ({ c }) => <sub>{c}</sub>;
const eTxt = l => (l.u === 'cm' ? `${nf(l.e / 10, 3)} cm` : `${nf(l.e, 4)} mm`);
const ROUGE = '#dc2626', BLEU = '#2563eb', VIOLET = '#7e22ce';

// ════════════════ SCHÉMA DE LA PAROI ════════════════
const W = 760, XG = 106, XD = 654;
function Schema({ sol, titre }) {
  const wTot = sol.L.reduce((a, l) => a + l.w, 0);
  let x = XG;
  const rects = sol.L.map((l, i) => { const w = l.w / wTot * (XD - XG), r = { ...l, x, w, i }; x += w; return r; });
  const yT = 50, yB = 130, chaud = sol.Ti >= sol.Te;
  const fl = (cx, d) => <polygon key={cx} points={d ? `${cx - 9},${26 - 6} ${cx + 9},26 ${cx - 9},${26 + 6}` : `${cx + 9},${26 - 6} ${cx - 9},26 ${cx + 9},${26 + 6}`} fill="white" stroke={VIOLET} strokeWidth="1.5"/>;
  return (
    <svg viewBox={`0 0 ${W} 176`} style={{ width: '100%', display: 'block' }} role="img" aria-label={titre || 'Coupe de la paroi'}>
      <line x1={XG + 40} x2={XD - 40} y1="26" y2="26" stroke={VIOLET} strokeWidth="1.5" strokeDasharray="6 5"/>
      {[0.3, 0.5, 0.7].map(f => fl(XG + f * (XD - XG), chaud))}
      <text x={(XG + XD) / 2} y="16" fontSize="12.5" fill={VIOLET} fontWeight="700" textAnchor="middle">sens du transfert thermique</text>
      {rects.map(r => (
        <g key={r.i}>
          <rect x={r.x} y={yT} width={r.w + 0.5} height={yB - yT} fill={r.coul} stroke="#475569" strokeWidth="1.2" strokeDasharray={r.film ? '3 3' : 'none'}/>
          {r.w > 16 && <text x={r.x + r.w / 2} y={(yT + yB) / 2 + 5} fontSize="14" fontWeight="700" fill="#1e293b" textAnchor="middle">{r.i + 1}</text>}
        </g>))}
      <text x={XG - 8} y={yT + 14} fontSize="13" fontWeight="700" fill={ROUGE} textAnchor="end">intérieur</text>
      <text x={XG - 8} y={yT + 32} fontSize="13" fill={ROUGE} textAnchor="end">T<tspan fontSize="10" dy="3">int</tspan><tspan dy="-3"> = {t1(sol.Ti)} °C</tspan></text>
      <text x={XD + 8} y={yT + 14} fontSize="13" fontWeight="700" fill={BLEU}>extérieur</text>
      <text x={XD + 8} y={yT + 32} fontSize="13" fill={BLEU}>T<tspan fontSize="10" dy="3">ext</tspan><tspan dy="-3"> = {t1(sol.Te)} °C</tspan></text>
      <text x={(XG + XD) / 2} y="156" fontSize="12" fill="#64748b" textAnchor="middle">
        Coupe de la paroi (épaisseurs à l’échelle{sol.films ? ', sauf les films d’air' : ''}). Surface S = {nf(sol.S, 3)} m².
      </text>
    </svg>
  );
}
function Legende({ sol }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
      {sol.L.map((l, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: KIT.txt }}>
          <span style={{ width: 16, height: 16, borderRadius: 3, background: l.coul, border: '1px solid #475569', flexShrink: 0 }}/>
          <span style={{ fontWeight: 700 }}>{i + 1}.</span>
          <span>{l.nom}{l.film ? <> : r = {dec(l.r, 2)} m²·K·W⁻¹</> : <> : e = {eTxt(l)}, λ = {nf(l.lam, 3)} W·m⁻¹·K⁻¹</>}</span>
        </div>))}
    </div>
  );
}

// ════════════════ PROFIL DE TEMPÉRATURE ════════════════
function pasJoli(e) { const p = 10 ** Math.floor(Math.log10(e)), n = e / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
function Graphe({ sol, valeurs }) {
  const H = 290, yH = 24, yB = 236;
  const wTot = sol.L.reduce((a, l) => a + l.w, 0), xs = [0];
  sol.L.forEach(l => xs.push(xs[xs.length - 1] + l.w));
  const X = v => XG + v / wTot * (XD - XG);
  const Tmin = Math.floor(Math.min(sol.Ti, sol.Te) - 1), Tmax = Math.ceil(Math.max(sol.Ti, sol.Te) + 1);
  const Y = T => yB - (T - Tmin) / (Tmax - Tmin) * (yB - yH);
  const pT = pasJoli((Tmax - Tmin) / 6), ticksT = [];
  for (let t = Math.ceil(Tmin / pT) * pT; t <= Tmax + 1e-9; t += pT) ticksT.push(t);
  const pX = pasJoli(wTot / 6), ticksX = [];
  if (!sol.films) for (let v = 0; v <= wTot + 1e-9; v += pX) ticksX.push(v);
  const pts = sol.T.map((T, k) => `${X(xs[k]).toFixed(1)},${Y(T).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #cbd5e1' }}
      role="img" aria-label="Profil de température dans la paroi">
      {sol.L.map((l, k) => <rect key={k} x={X(xs[k])} y={yH} width={X(xs[k + 1]) - X(xs[k])} height={yB - yH} fill={l.coul} fillOpacity="0.4"/>)}
      {ticksT.map(t => (
        <g key={t}>
          <line x1={XG} x2={XD} y1={Y(t)} y2={Y(t)} stroke="#e2e8f0"/>
          <text x={XG - 6} y={Y(t) + 4} fontSize="13" fill="#334155" textAnchor="end">{t}</text>
        </g>))}
      {ticksX.map(v => <text key={v} x={X(v)} y={yB + 17} fontSize="13" fill="#334155" textAnchor="middle">{nf(v, 3)}</text>)}
      <line x1={XG} x2={XD} y1={yB} y2={yB} stroke="#0f172a" strokeWidth="1.2"/>
      <line x1={XG} x2={XG} y1={yH} y2={yB} stroke="#0f172a" strokeWidth="1.2"/>
      <text x={(XG + XD) / 2} y={H - 8} fontSize="14" fontWeight="700" fill="#0f172a" textAnchor="middle">
        {sol.films ? 'position dans la paroi : de l’intérieur (gauche) à l’extérieur (droite), films d’air non à l’échelle' : 'position dans la paroi (mm) : de l’intérieur (gauche) à l’extérieur (droite)'}
      </text>
      <text x={18} y={(yH + yB) / 2} fontSize="14" fontWeight="700" fill="#0f172a" textAnchor="middle" transform={`rotate(-90 18 ${(yH + yB) / 2})`}>température (°C)</text>
      <polyline points={pts} fill="none" stroke={ROUGE} strokeWidth="3" strokeLinejoin="round"/>
      {valeurs && (() => {
        // étiquettes de température : on saute celles qui se chevaucheraient (elles restent listées dans le bilan)
        const px = sol.T.map((_, k) => X(xs[k])), last = sol.T.length - 1, garde = [0];
        for (let k = 1; k < last; k++) if (px[k] - px[garde[garde.length - 1]] >= 56 && px[last] - px[k] >= 120) garde.push(k);
        if (garde.length > 1 && px[last] - px[garde[garde.length - 1]] < 120) garde.pop();
        garde.push(last);
        return sol.T.map((T, k) => {
          const i = garde.indexOf(k), desc = sol.Ti >= sol.Te, premier = k === 0, dernier = k === last;
          const dessus = dernier ? true : desc;                      // côté libre de la courbe
          return (
            <g key={k}>
              <circle cx={px[k]} cy={Y(T)} r="4" fill="white" stroke={ROUGE} strokeWidth="2"/>
              {i >= 0 && <text x={px[k] + (dernier ? -9 : 9)} y={Y(T) + (dessus ? -9 : 19)} fontSize="12.5" fontWeight="700" fill="#7f1d1d" textAnchor={dernier ? 'end' : 'start'}>{t1(T)} °C</text>}
            </g>);
        });
      })()}
    </svg>
  );
}

// ════════════════ BARRE DES RÉSISTANCES ════════════════
function BarreR({ sol }) {
  const Wb = 760, XGb = 20, XDb = 740;
  let x = XGb;
  return (
    <svg viewBox={`0 0 ${Wb} 64`} style={{ width: '100%', display: 'block' }} role="img" aria-label="Part de chaque couche dans la résistance thermique totale">
      {sol.L.map((l, i) => {
        const w = l.R / sol.Rtot * (XDb - XGb), x0 = x; x += w;
        return (
          <g key={i}>
            <rect x={x0} y="6" width={w + 0.5} height="34" fill={l.coul} stroke="#475569" strokeWidth="1.2"/>
            {w > 64 && <text x={x0 + w / 2} y="29" fontSize="14" fontWeight="700" fill="#1e293b" textAnchor="middle">{i + 1} : {Math.round(100 * l.R / sol.Rtot)} %</text>}
            {w > 14 && w <= 64 && <text x={x0 + w / 2} y="29" fontSize="13" fontWeight="700" fill="#1e293b" textAnchor="middle">{i + 1}</text>}
          </g>);
      })}
      <text x={(XGb + XDb) / 2} y="58" fontSize="12" fill="#64748b" textAnchor="middle">Largeur de chaque couche ∝ sa résistance thermique R<tspan fontSize="9" dy="3">i</tspan><tspan dy="-3"> : c’est aussi sa part de l’écart de température total.</tspan></text>
    </svg>
  );
}

// ════════════════ PRÉSETS ════════════════
export const PRESETS = {
  mur: { nom: 'Mur isolé du TD (plâtre + laine de bois + brique)', couches: [{ mat: 'platre', e: 13 }, { mat: 'laineBois', e: 114 }, { mat: 'brique', e: 200 }], S: 1, Ti: 20, Te: 0 },
  brique: { nom: 'Mur de brique seul (20 cm)', couches: [{ mat: 'brique', e: 200 }], S: 1, Ti: 20, Te: 0 },
  simple: { nom: 'Simple vitrage (8 mm)', couches: [{ mat: 'verre', e: 8 }], S: 1, Ti: 19, Te: 8 },
  double: { nom: 'Double vitrage (4 mm + air 10 mm + 4 mm)', couches: [{ mat: 'verre', e: 4 }, { mat: 'air', e: 10 }, { mat: 'verre', e: 4 }], S: 1, Ti: 19, Te: 8 },
};

// ════════════════ DÉFI : génération des données ════════════════
const tire = t => t[Math.floor(Math.random() * t.length)];
export function tirageDefi(type) {
  if (type === 'isolant') {
    return { type, S: 1, maco: tire(['brique', 'beton']), eMaco: tire([150, 200, 250]), ePlatre: tire([10, 13]), iso: tire(['laineBois', 'polystyrene']),
      Rcible: tire([3, 3.5, 4, 4.5, 5]), dT: tire([16, 18, 19, 20]), reps: {}, verifie: false };
  }
  if (type === 'vitrage') {
    return { type, S: tire([1, 1.5, 2, 2.5]), ev: tire([3, 4, 5, 6]), a: tire([6, 8, 10, 12, 16]), Ti: 19, Te: tire([0, 3, 5, 8]), reps: {}, verifie: false };
  }
  return { type: 'mur', S: tire([8, 10, 12, 15, 20, 25, 30]), Ti: tire([18, 19, 20, 21, 22]), Te: tire([-8, -5, -2, 0, 2, 5]),
    couches: [
      { mat: 'platre', e: tire([10, 13]), u: 'mm' },
      { mat: tire(['laineBois', 'polystyrene']), e: tire([60, 80, 100, 120, 140, 160]), u: tire(['mm', 'cm']) },
      { mat: tire(['brique', 'beton']), e: tire([150, 200, 250]), u: 'cm' }],
    reps: {}, verifie: false };
}
function modeleDefi(df) {
  if (df.type === 'mur') return { mur: modeleParoi({ couches: df.couches, S: df.S, Ti: df.Ti, Te: df.Te }) };
  if (df.type === 'vitrage') {
    return {
      simple: modeleParoi({ couches: [{ mat: 'verre', e: 2 * df.ev }], S: df.S, Ti: df.Ti, Te: df.Te }),
      double: modeleParoi({ couches: [{ mat: 'verre', e: df.ev }, { mat: 'air', e: df.a }, { mat: 'verre', e: df.ev }], S: df.S, Ti: df.Ti, Te: df.Te }),
    };
  }
  return {};
}
function questionsDefi(df) {
  if (df.type === 'mur') {
    const s = modeleDefi(df).mur, iso = s.L[1], dT = s.P * iso.R, E = s.P * 24 / 1000;
    return [
      { id: 'Ri', q: <>Résistance thermique R<Sub c="th"/> de la couche 2 ({iso.nom.toLowerCase()})</>, u: 'K·W⁻¹', vrai: iso.R, tol: 0.02,
        detail: `R_th = e / (λ·S) = ${nf(iso.e / 1000)} / (${nf(iso.lam)} × ${df.S}) = ${nf(iso.R)} K·W⁻¹` },
      { id: 'Rt', q: <>Résistance thermique globale R<Sub c="th,global"/> de la paroi</>, u: 'K·W⁻¹', vrai: s.Rtot, tol: 0.02,
        detail: `R_th,global = ${s.L.map(l => nf(l.R)).join(' + ')} = ${nf(s.Rtot)} K·W⁻¹` },
      { id: 'P', q: <>Puissance thermique P perdue à travers la paroi</>, u: 'W', vrai: s.P, tol: 0.02,
        detail: `P = (T_int − T_ext) / R_th,global = (${df.Ti} − (${df.Te})) / ${nf(s.Rtot)} = ${nf(s.P, 4)} W` },
      { id: 'dT', q: <>Écart de température entre les deux faces de la couche 2</>, u: '°C', vrai: dT, tol: 0.02,
        detail: `ΔT = P × R_th = ${nf(s.P, 4)} × ${nf(iso.R)} = ${nf(dT)} °C` },
      { id: 'E', q: <>Énergie thermique perdue en 24 h, en <strong>kWh</strong></>, u: 'kWh', vrai: E, tol: 0.02,
        detail: `E = P × Δt = ${nf(s.P, 4)} W × 24 h = ${nf(s.P * 24, 4)} Wh = ${nf(E)} kWh` },
    ];
  }
  if (df.type === 'isolant') {
    const mac = MATS[df.maco], iso = MATS[df.iso], Rm = (df.eMaco / 1000) / mac.lam, Rp = (df.ePlatre / 1000) / MATS.platre.lam;
    const Rmin = df.Rcible - Rm - Rp, emin = Rmin * iso.lam * 100, P = df.dT / df.Rcible;
    return [
      { id: 'Rm', q: <>Résistance thermique de la maçonnerie ({mac.nom.toLowerCase()}), pour 1 m²</>, u: 'K·W⁻¹', vrai: Rm, tol: 0.02,
        detail: `R_th = e / (λ·S) = ${nf(df.eMaco / 1000)} / (${nf(mac.lam)} × 1) = ${nf(Rm)} K·W⁻¹` },
      { id: 'Rp', q: <>Résistance thermique de la plaque de plâtre, pour 1 m²</>, u: 'K·W⁻¹', vrai: Rp, tol: 0.02,
        detail: `R_th = ${nf(df.ePlatre / 1000)} / (${MATS.platre.lam} × 1) = ${nf(Rp)} K·W⁻¹` },
      { id: 'Rmin', q: <>Résistance thermique minimale de l’isolant ({iso.nom.toLowerCase()})</>, u: 'K·W⁻¹', vrai: Rmin, tol: 0.02,
        detail: `R_isolant = R_cible − R_maçonnerie − R_plâtre = ${df.Rcible} − ${nf(Rm)} − ${nf(Rp)} = ${nf(Rmin)} K·W⁻¹` },
      { id: 'emin', q: <>Épaisseur minimale d’isolant, en <strong>cm</strong></>, u: 'cm', vrai: emin, tol: 0.02,
        detail: `e = R × λ × S = ${nf(Rmin)} × ${nf(iso.lam)} × 1 = ${nf(Rmin * iso.lam, 3)} m = ${nf(emin)} cm` },
      { id: 'P', q: <>Puissance thermique perdue par m² si R<Sub c="th,global"/> = {df.Rcible} K·W⁻¹ et T<Sub c="int"/> − T<Sub c="ext"/> = {df.dT} °C</>, u: 'W', vrai: P, tol: 0.02,
        detail: `P = ΔT / R_th,global = ${df.dT} / ${df.Rcible} = ${nf(P)} W` },
    ];
  }
  const { simple, double } = modeleDefi(df);
  return [
    { id: 'Rs', q: <>Résistance thermique R<Sub c="th"/> du simple vitrage ({2 * df.ev} mm de verre)</>, u: 'K·W⁻¹', vrai: simple.Rtot, tol: 0.02,
      detail: `R_th = e / (λ·S) = ${nf(2 * df.ev / 1000)} / (1,0 × ${df.S}) = ${nf(simple.Rtot)} K·W⁻¹` },
    { id: 'Rd', q: <>Résistance thermique R<Sub c="th,global"/> du double vitrage (2 × {df.ev} mm de verre et {df.a} mm d’air)</>, u: 'K·W⁻¹', vrai: double.Rtot, tol: 0.02,
      detail: `R_th,global = ${double.L.map(l => nf(l.R)).join(' + ')} = ${nf(double.Rtot)} K·W⁻¹` },
    { id: 'Ps', q: <>Puissance thermique P<Sub c="s"/> perdue par le simple vitrage</>, u: 'W', vrai: simple.P, tol: 0.02,
      detail: `P = (T_int − T_ext) / R_th = (${df.Ti} − ${df.Te}) / ${nf(simple.Rtot)} = ${nf(simple.P, 4)} W` },
    { id: 'Pd', q: <>Puissance thermique P<Sub c="d"/> perdue par le double vitrage</>, u: 'W', vrai: double.P, tol: 0.02,
      detail: `P = ${df.Ti - df.Te} / ${nf(double.Rtot)} = ${nf(double.P, 4)} W` },
    { id: 'rap', q: <>Rapport P<Sub c="s"/> / P<Sub c="d"/> (de combien le double vitrage divise-t-il la puissance perdue ?)</>, u: '', vrai: simple.P / double.P, tol: 0.02,
      detail: `P_s / P_d = ${nf(simple.P, 4)} / ${nf(double.P, 4)} = ${nf(simple.P / double.P)}` },
  ];
}

// ════════════════ SIMULATION ════════════════
export function SimulationParoi() {
  const [mode, setMode] = useState('explore');
  const [guide, setGuide] = useEtatPersistant('paroi-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [rg, setRg] = useEtatPersistant('paroi-guide-reglage-v1', { ajout: false, inv: false, ep: 100 });
  const [couches, setCouches] = useState(PRESETS.mur.couches.map(c => ({ ...c })));
  const [S, setS] = useState(PRESETS.mur.S);
  const [Ti, setTi] = useState(PRESETS.mur.Ti);
  const [Te, setTe] = useState(PRESETS.mur.Te);
  const [films, setFilms] = useState(false);
  const [preset, setPreset] = useState('mur');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [classeOuv, setClasseOuv] = useState(false);
  const [eClasse, setEClasse] = useState(100);
  const [defi, setDefi] = useState(null);
  const [typeDefi, setTypeDefi] = useState('mur');
  useEffect(() => { if (guide.etape === 0) setRg({ ajout: false, inv: false, ep: 100 }); }, [guide.etape, setRg]);

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const G = { S: 1, Ti: 20, Te: 0 };
  const gBrique = [{ mat: 'brique', e: 200 }];
  const mk = (ep, inv) => { const c = [{ mat: 'platre', e: 13 }, { mat: 'laineBois', e: ep }, { mat: 'brique', e: 200 }]; return inv ? c.slice().reverse() : c; };
  const s1 = modeleParoi({ couches: gBrique, ...G }), s2 = modeleParoi({ couches: mk(100, false), ...G });
  const A = { Rb: s1.Rtot, P1: s1.P, Rl: s2.L[1].R, Rp: s2.L[0].R, Rt: s2.Rtot, P2: s2.P, dTl: s2.P * s2.L[1].R,
    emin: (4 - s2.L[0].R - s2.L[2].R) * 0.036 * 100 };
  const IDS = ['intro', 'lambda', 'Rb', 'P1', 'profil1', 'ajout', 'Rl', 'serie', 'P2', 'dTl', 'part', 'ordre', 'ordreQ', 'conception', 'verif', 'hypo', 'bravo'];
  const iEt = id => IDS.indexOf(id);
  const etape = guide.etape;
  const vu = id => etape >= iEt(id);
  const apresAjout = etape > iEt('ajout') || (etape === iEt('ajout') && rg.ajout);
  const gInv = etape >= iEt('ordre') && rg.inv;
  const ep = etape >= iEt('conception') ? rg.ep : 100;
  const gCouches = apresAjout ? mk(ep, gInv) : gBrique;
  const gSol = modeleParoi({ couches: gCouches, ...G });
  const partEp = Math.round(100 * 100 / 313), partR = Math.round(100 * A.Rl / A.Rt);
  const rEp = modeleParoi({ couches: mk(rg.ep, false), ...G }).Rtot;
  const ETAPES = [
    { id: 'intro', titre: 'Un mur entre l’intérieur et l’extérieur', focus: ['schema'],
      texte: <>Une paroi sépare l’intérieur d’une maison, à <strong>20 °C</strong>, de l’extérieur, à <strong>0 °C</strong>. Ici : un mur de brique de 20 cm d’épaisseur et de 1 m² de surface. On ne s’intéresse qu’à la conduction thermique à travers la paroi (ni fenêtre, ni vent).</>,
      tache: { type: 'qcm', q: 'Dans quel sens l’énergie thermique traverse-t-elle le mur ?',
        options: ['De l’intérieur (chaud) vers l’extérieur (froid)', 'De l’extérieur vers l’intérieur', 'Elle ne traverse pas : le mur arrête le transfert'], bonne: 0,
        expl: 'Le transfert thermique se fait toujours du milieu le plus chaud vers le plus froid. Un mur ne l’arrête pas : il le ralentit plus ou moins (c’est son pouvoir isolant).' } },
    { id: 'lambda', titre: 'Conductivité et résistance thermique', focus: ['donnees'],
      texte: <>La <strong>conductivité thermique λ</strong> (W·m⁻¹·K⁻¹) dit si un matériau laisse passer facilement l’énergie. La <strong>résistance thermique R<Sub c="th"/></strong> (K·W⁻¹) d’une paroi dépend en plus de son épaisseur e et de sa surface S : <strong>R<Sub c="th"/> = e / (λ · S)</strong>.</>,
      tache: { type: 'qcm', q: 'Laquelle de ces deux grandeurs dépend de la forme de la paroi (épaisseur, surface) ?', options: ['La résistance thermique R_th', 'La conductivité thermique λ', 'Les deux'], bonne: 0,
        expl: 'λ est une propriété du matériau : la brique a la même λ en 1 cm ou en 1 m. R_th dépend aussi de e et de S : doubler e double R_th ; doubler S divise R_th par 2.' } },
    { id: 'Rb', titre: 'La résistance thermique de la brique', focus: ['donnees'],
      texte: <>Données : e = 20 cm, λ = 0,25 W·m⁻¹·K⁻¹, S = 1 m². Attention aux unités : l’épaisseur doit être en <strong>mètres</strong>.</>,
      tache: { type: 'num', q: 'R_th de la brique', unite: 'K·W⁻¹', vrai: A.Rb, tol: 0.02, affiche: x => nf(x),
        pieges: [[20 / 0.25, 'e = 20 cm = 0,20 m : convertissez en mètres.'], [200 / 0.25, 'e doit être en m (0,20 m), pas en mm.'], [0.25 / 0.2, 'R_th = e / (λ·S) : on divise e par λ·S, pas l’inverse.']],
        expl: 'R_th = e / (λ·S) = 0,20 / (0,25 × 1) = 0,80 K·W⁻¹.' } },
    { id: 'P1', titre: 'La puissance thermique à travers la brique', focus: ['schema'],
      texte: <>La puissance thermique P qui traverse la paroi est d’autant plus grande que l’écart de température est grand et que la résistance est faible : <strong>P = (T<Sub c="int"/> − T<Sub c="ext"/>) / R<Sub c="th"/></strong>.</>,
      tache: { type: 'num', q: 'Puissance P', unite: 'W', vrai: A.P1, tol: 0.02, affiche: x => nf(x),
        pieges: [[20 * A.Rb, 'On divise : P = ΔT / R_th (plus R_th est grande, plus P est faible).']],
        expl: 'P = 20 / 0,80 = 25 W : le mur laisse passer 25 J par seconde.' } },
    { id: 'profil1', titre: 'La température à l’intérieur du mur', focus: ['graphe'],
      texte: <>Le graphique montre la température en chaque point de l’épaisseur du mur, de l’intérieur (à gauche) vers l’extérieur (à droite).</>,
      tache: { type: 'qcm', q: 'Comment varie la température dans une couche homogène ?', options: ['Linéairement : une droite, la température baisse de façon régulière', 'Brutalement au milieu de la couche', 'Elle reste égale à celle de l’intérieur'], bonne: 0,
        expl: 'En régime stationnaire, la même puissance P traverse chaque tranche du mur : l’écart de température par millimètre est constant dans un matériau homogène. Le profil est donc une droite, d’autant plus inclinée que λ est faible.' } },
    { id: 'ajout', titre: 'Isoler le mur', focus: ['schema', 'donnees'],
      texte: <>On ajoute du côté intérieur <strong>10 cm de laine de bois</strong> (λ = 0,036 W·m⁻¹·K⁻¹) et une <strong>plaque de plâtre de 13 mm</strong> (λ = 0,33 W·m⁻¹·K⁻¹). Même surface, mêmes températures.</>,
      tache: { type: 'action', ok: apresAjout, label: 'Isoler le mur', faire: () => setRg(x => ({ ...x, ajout: true })), consigne: apresAjout ? null : 'Cliquez pour ajouter la laine de bois et le plâtre' } },
    { id: 'Rl', titre: 'La résistance de la laine de bois', focus: ['donnees'],
      texte: <>Même calcul que pour la brique, avec e = 10 cm et λ = 0,036 W·m⁻¹·K⁻¹ (S = 1 m²).</>,
      tache: { type: 'num', q: 'R_th de la laine de bois', unite: 'K·W⁻¹', vrai: A.Rl, tol: 0.02, affiche: x => nf(x),
        pieges: [[10 / 0.036, 'e = 10 cm = 0,10 m : convertissez en mètres.'], [A.Rb, 'C’est la valeur de la brique : la laine de bois a une λ bien plus faible.']],
        expl: `R_th = 0,10 / (0,036 × 1) ≈ ${nf(A.Rl)} K·W⁻¹ : ${nf(A.Rl / A.Rb, 2)} fois la résistance de la brique, pour la moitié de l’épaisseur.` } },
    { id: 'serie', titre: 'Les résistances s’ajoutent', focus: ['donnees'],
      texte: <>La plaque de plâtre a une résistance R<Sub c="th"/> ≈ {nf(A.Rp, 2)} K·W⁻¹ (même calcul). Les trois couches sont traversées l’une après l’autre par la même puissance : elles sont <strong>en série</strong>, et leurs résistances s’ajoutent.</>,
      tache: { type: 'num', q: 'R_th,global de la paroi', unite: 'K·W⁻¹', vrai: A.Rt, tol: 0.02, affiche: x => nf(x),
        pieges: [[A.Rl, 'Il faut ajouter les trois résistances (plâtre + laine + brique).'], [1 / (1 / A.Rb + 1 / A.Rl + 1 / A.Rp), 'Des couches superposées s’additionnent simplement : ce n’est pas la formule des résistances en parallèle.']],
        expl: `R_th,global = ${nf(A.Rp)} + ${nf(A.Rl)} + ${nf(A.Rb)} ≈ ${nf(A.Rt)} K·W⁻¹ : ${nf(A.Rt / A.Rb, 2)} fois plus qu’avec la brique seule.` } },
    { id: 'P2', titre: 'La puissance après isolation', focus: ['schema'],
      texte: <>Avec la même différence de température (20 °C), calculez la nouvelle puissance P.</>,
      tache: { type: 'num', q: 'Puissance P', unite: 'W', vrai: A.P2, tol: 0.02, affiche: x => nf(x),
        pieges: [[A.P1, 'C’est la valeur sans isolant (25 W).']],
        expl: `P = 20 / ${nf(A.Rt)} ≈ ${nf(A.P2)} W, contre 25 W sans isolant : on divise la puissance perdue par ${nf(A.Rt / A.Rb, 2)}.` } },
    { id: 'dTl', titre: 'Où tombe l’écart de température ?', focus: ['graphe'],
      texte: <>Le graphique montre maintenant les trois couches : la pente change à chaque couche. La même puissance P les traverse toutes ; l’écart de température aux bornes d’une couche vaut <strong>ΔT = P × R<Sub c="th"/></strong> (comme U = R × I en électricité).</>,
      tache: { type: 'num', q: 'Écart de température ΔT aux bornes de la laine de bois', unite: '°C', vrai: A.dTl, tol: 0.02, affiche: x => nf(x),
        pieges: [[A.P2 * A.Rb, 'Il faut la résistance de la laine de bois (pas celle de la brique).'], [A.P2, 'ΔT = P × R_th : il faut multiplier P par la résistance de la couche.']],
        expl: `ΔT = P × R_th = ${nf(A.P2)} × ${nf(A.Rl)} ≈ ${nf(A.dTl)} °C : sur les 20 °C d’écart total, ${nf(A.dTl, 3)} °C « tombent » dans la laine de bois.` } },
    { id: 'part', titre: 'Qui isole vraiment ?', focus: ['barre', 'graphe'],
      texte: <>La barre colorée montre la part de chaque couche dans la résistance thermique totale, donc dans l’écart de température.</>,
      tache: { type: 'qcm', q: 'La brique est la couche la plus épaisse. Laquelle prend pourtant la plus grande part de l’écart de température ?',
        options: ['La laine de bois, car sa résistance thermique est la plus grande', 'La brique, car elle est la plus épaisse', 'Chaque couche en prend le même tiers'], bonne: 0,
        expl: `Ce n’est pas l’épaisseur seule qui compte, mais R_th = e / (λ·S) : un isolant (λ faible) même peu épais a une grande résistance. Ici la laine de bois fait ${partEp} % de l’épaisseur du mur mais ${partR} % de sa résistance.` } },
    { id: 'ordre', titre: 'Changer l’ordre des couches', focus: ['schema', 'graphe'],
      texte: <>Mettons maintenant la brique côté intérieur et le plâtre côté extérieur : les couches dans l’ordre inverse.</>,
      tache: { type: 'action', ok: rg.inv, label: 'Inverser l’ordre des couches', faire: () => setRg(x => ({ ...x, inv: true })), consigne: rg.inv ? null : 'Cliquez pour inverser l’ordre' } },
    { id: 'ordreQ', titre: 'L’ordre change-t-il la puissance ?', focus: ['graphe'],
      texte: <>Comparez le graphique avec le précédent : les températures aux interfaces ne sont plus les mêmes.</>,
      tache: { type: 'qcm', q: 'Quand on inverse l’ordre des couches, la puissance P qui traverse le mur…', options: ['reste la même, mais les températures aux interfaces changent', 'augmente', 'diminue'], bonne: 0,
        expl: 'Les résistances s’ajoutent dans n’importe quel ordre : R_th,global et P ne changent pas. Seules les températures aux interfaces changent, ce qui peut compter dans un vrai mur (condensation, gel).' } },
    { id: 'conception', titre: 'Dimensionner l’isolant', focus: ['slider'],
      texte: <>Cahier des charges (exercice du TD) : pour 1 m², il faut <strong>R<Sub c="th,global"/> ≥ 4 K·W⁻¹</strong>. Quelle épaisseur minimale de laine de bois faut-il ?</>,
      tache: { type: 'num', q: 'Épaisseur minimale de laine de bois', unite: 'cm', vrai: A.emin, tol: 0.02, affiche: x => nf(x),
        aide: 'Calculez d’abord la résistance minimale de la laine : R_min = 4 − R_plâtre − R_brique. Puis e = R × λ × S.',
        pieges: [[A.emin * 10, 'Résultat en mm : l’énoncé demande des cm.'], [A.emin / 100, 'Résultat en m : l’énoncé demande des cm.'], [4 * 0.036 * 100, 'Il faut retirer la résistance du plâtre et de la brique : elles contribuent déjà.']],
        expl: `R_min = 4 − ${nf(A.Rp)} − ${nf(A.Rb)} = ${nf(4 - A.Rp - A.Rb)} K·W⁻¹ ; e = R × λ × S = ${nf(4 - A.Rp - A.Rb)} × 0,036 × 1 ≈ ${nf(A.emin / 100)} m, soit ${nf(A.emin)} cm.` } },
    { id: 'verif', titre: 'Vérifier avec la simulation', focus: ['slider', 'donnees'],
      texte: <>Réglez l’épaisseur de laine de bois avec le curseur : l’indicateur R<Sub c="th,global"/> doit atteindre 4 K·W⁻¹ (au mm près).</>,
      tache: { type: 'action', ok: rEp >= 4, consigne: rEp >= 4 ? null : 'Réglez le curseur jusqu’à R_th,global ≥ 4 K·W⁻¹' } },
    { id: 'hypo', titre: 'Sur quoi repose ce calcul ?', focus: ['hypo'],
      texte: <>Ouvrez l’encadré « Hypothèses de travail ».</>,
      tache: { type: 'qcm', q: 'Pour additionner les résistances des couches, on suppose que…',
        options: ['la même puissance traverse toutes les couches (régime stationnaire, bon contact entre couches, pas de fuite sur les côtés)', 'chaque couche est traversée par une puissance différente', 'la température est la même dans toute la paroi'], bonne: 0,
        expl: 'Sans ces hypothèses (ponts thermiques, fuites sur les côtés, mauvais contact entre couches, régime variable), le calcul n’est qu’une approximation. Autre simplification : ici la face du mur est à la température de l’air ; en réalité un film d’air limite l’échange (option « films d’air » en exploration libre).' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous savez calculer la résistance thermique d’une couche (R<Sub c="th"/> = e / (λ·S)), additionner les résistances de couches superposées, en déduire la puissance P = ΔT / R<Sub c="th"/> et l’écart de température aux bornes de chaque couche, et dimensionner une épaisseur d’isolant. En exploration libre, chargez le simple et le double vitrage (exercice 2 du TD), ajoutez les films d’air et comparez les matériaux.</>, tache: null },
  ];
  const et = ETAPES[Math.min(etape, ETAPES.length - 1)];
  const enGuide = mode === 'guide';
  const hl = id => enGuide && et.focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ VUE (exploration / parcours) ════════════════
  const solE = modeleParoi({ couches, S, Ti, Te, films });
  const sol = enGuide ? gSol : solE;
  const majPreset = f => { f(); setPreset(''); };
  const setCouche = (i, o) => majPreset(() => setCouches(cs => cs.map((c, k) => (k === i ? { ...c, ...o } : c))));
  const deplacer = (i, d) => majPreset(() => setCouches(cs => { const j = i + d; if (j < 0 || j >= cs.length) return cs; const n = cs.slice(); [n[i], n[j]] = [n[j], n[i]]; return n; }));
  const choisirPreset = k => { if (!PRESETS[k]) return; setPreset(k); setCouches(PRESETS[k].couches.map(c => ({ ...c }))); setS(PRESETS[k].S); setTi(PRESETS[k].Ti); setTe(PRESETS[k].Te); };

  const lab = { fontSize: 12.5, color: KIT.txt2, fontWeight: 700 };
  const sel = { fontSize: 13.5, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, background: 'white', color: KIT.txt };
  const vue = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...styleBoite, ...cadre('schema'), ...cadre('donnees') }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: KIT.txt, marginBottom: 6 }}>La paroi</div>
        <Schema sol={sol}/>
        <Legende sol={sol}/>
        {enGuide && <div style={{ fontSize: 13.5, color: KIT.txt, marginTop: 6 }}>Données : T<Sub c="int"/> = {G.Ti} °C ; T<Sub c="ext"/> = {G.Te} °C ; S = {G.S} m².</div>}
        {enGuide && etape >= iEt('verif') && etape <= iEt('verif') && (
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6, color: rEp >= 4 ? '#15803d' : KIT.txt }}>
            R<Sub c="th,global"/> = {dec(rEp, 2)} K·W⁻¹ {rEp >= 4 ? '✓ (≥ 4)' : '(objectif : ≥ 4)'}
          </div>)}
        {enGuide && etape >= iEt('conception') && apresAjout && (
          <div style={{ marginTop: 8, ...cadre('slider'), padding: 4 }}>
            <Curseur nom="Épaisseur de laine de bois" valeur={rg.ep} onChange={v => setRg(x => ({ ...x, ep: v }))} min={20} max={300} pas={1} unite="mm" couleur="#d97706"/>
          </div>)}
      </div>
      {(!enGuide || vu('profil1')) && (
        <div style={{ ...styleBoite, ...cadre('graphe') }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: KIT.txt, marginBottom: 6 }}>Profil de température dans la paroi</div>
          <Graphe sol={sol} valeurs={enGuide ? etape > iEt('dTl') : true}/>
        </div>)}
      {(!enGuide || vu('part')) && (
        <div style={{ ...styleBoite, ...cadre('barre') }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: KIT.txt, marginBottom: 4 }}>Part de chaque couche dans la résistance thermique</div>
          <BarreR sol={sol}/>
        </div>)}
    </div>
  );

  // ════════════════ EXPLORATION : réglages et calculs ════════════════
  const reglages = (
    <div style={styleBoite}>
      <div style={{ fontWeight: 700, fontSize: 14, color: KIT.txt, marginBottom: 8 }}>Réglages</div>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
        <span style={lab}>Situation</span>
        <select value={preset} onChange={e => choisirPreset(e.target.value)} style={{ ...sel, maxWidth: 420 }} aria-label="Situation prédéfinie">
          {preset === '' && <option value="">(réglage personnel)</option>}
          {Object.entries(PRESETS).map(([k, v]) => <option key={k} value={k}>{v.nom}</option>)}
        </select>
      </label>
      <div style={{ ...lab, marginBottom: 4 }}>Couches, de l’intérieur vers l’extérieur</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {couches.map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ width: 18, fontWeight: 700, color: KIT.txt }}>{i + 1}.</span>
            <select value={c.mat} onChange={e => setCouche(i, { mat: e.target.value })} style={sel} aria-label={`Matériau couche ${i + 1}`}>
              {Object.entries(MATS).map(([k, m]) => <option key={k} value={k}>{m.nom}</option>)}
            </select>
            <input type="number" min="1" max="2000" step="1" value={c.e} aria-label={`Épaisseur couche ${i + 1} (mm)`}
              onChange={e => { const v = parseFloat(e.target.value); if (isFinite(v) && v > 0) setCouche(i, { e: v }); }}
              style={{ width: 80, fontSize: 13.5, padding: '4px 6px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6 }}/>
            <span style={{ fontSize: 13.5, color: KIT.txt2 }}>mm · λ = {nf(MATS[c.mat].lam)} W·m⁻¹·K⁻¹</span>
            <button onClick={() => deplacer(i, -1)} disabled={i === 0} aria-label={`Monter la couche ${i + 1}`} style={{ ...stylePetitBouton(false), opacity: i === 0 ? 0.4 : 1 }}>◀</button>
            <button onClick={() => deplacer(i, 1)} disabled={i === couches.length - 1} aria-label={`Descendre la couche ${i + 1}`} style={{ ...stylePetitBouton(false), opacity: i === couches.length - 1 ? 0.4 : 1 }}>▶</button>
            <button onClick={() => majPreset(() => setCouches(cs => cs.filter((_, k) => k !== i)))} disabled={couches.length <= 1} aria-label={`Supprimer la couche ${i + 1}`}
              style={{ ...stylePetitBouton(false, '#b91c1c'), opacity: couches.length <= 1 ? 0.4 : 1 }}>✕</button>
          </div>))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0 10px' }}>
        <button onClick={() => majPreset(() => setCouches(cs => [...cs, { mat: 'laineBois', e: 100 }]))} disabled={couches.length >= 5} style={{ ...stylePetitBouton(true, '#0f766e'), opacity: couches.length >= 5 ? 0.45 : 1 }}>+ Ajouter une couche</button>
        <button onClick={() => majPreset(() => setCouches(cs => cs.slice().reverse()))} style={stylePetitBouton(false, '#334155')}>↔ Inverser l’ordre</button>
      </div>
      <div className="par-curseurs">
        <Curseur nom="Température intérieure T_int" valeur={Ti} onChange={v => majPreset(() => setTi(v))} min={5} max={30} pas={0.5} unite="°C" decimales={1} couleur={ROUGE}/>
        <Curseur nom="Température extérieure T_ext" valeur={Te} onChange={v => majPreset(() => setTe(v))} min={-15} max={40} pas={0.5} unite="°C" decimales={1} couleur={BLEU}/>
        <Curseur nom="Surface de la paroi S" valeur={S} onChange={v => majPreset(() => setS(v))} min={0.5} max={50} pas={0.5} unite="m²" decimales={1} couleur="#334155"/>
      </div>
      <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13.5, color: KIT.txt, cursor: 'pointer' }}>
        <input type="checkbox" checked={films} onChange={e => setFilms(e.target.checked)}/>
        Ajouter les films d’air de surface (échange avec l’air de chaque côté)
      </label>
    </div>
  );
  const Ptot = solE.P, E24 = Ptot * 24 / 1000, ligne = { fontSize: 14, color: KIT.txt, lineHeight: 1.7 };
  const calculs = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {solE.L.map((l, i) => (
        <div key={i} style={ligne}>
          <strong>{i + 1}. {l.nom}</strong> : {l.film
            ? <>R<Sub c="th"/> = r / S = {dec(l.r, 2)} / {nf(S)} = <strong>{nf(l.R)} K·W⁻¹</strong></>
            : <>R<Sub c="th"/> = e / (λ · S) = {nf(l.e / 1000)} / ({nf(l.lam)} × {nf(S)}) = <strong>{nf(l.R)} K·W⁻¹</strong></>}
          <span style={{ color: KIT.txt2 }}> · ΔT = P × R<Sub c="th"/> = {nf(Math.abs(solE.P * l.R))} °C</span>
        </div>))}
      <div style={ligne}><strong>Résistance globale</strong> (couches en série) : R<Sub c="th,global"/> = {solE.L.map(l => nf(l.R)).join(' + ')} = <strong>{nf(solE.Rtot)} K·W⁻¹</strong></div>
      <div style={ligne}><strong>Températures aux interfaces</strong> (de l’intérieur vers l’extérieur) : {solE.T.map(t1).join(' °C → ')} °C <span style={{ color: KIT.txt2 }}>(T<Sub c="k"/> = T<Sub c="k−1"/> − P × R<Sub c="th"/> de la couche)</span></div>
      <div style={ligne}><strong>Puissance thermique</strong> : P = (T<Sub c="int"/> − T<Sub c="ext"/>) / R<Sub c="th,global"/> = ({t1(Ti)} − ({t1(Te)})) / {nf(solE.Rtot)} = <strong>{nf(Math.abs(Ptot), 4)} W</strong>
        {Ptot < 0 && <span style={{ color: KIT.txt2 }}> (de l’extérieur vers l’intérieur : la paroi laisse entrer de l’énergie)</span>}
        <span style={{ color: KIT.txt2 }}> · par m² : {nf(Math.abs(solE.phi), 3)} W·m⁻²</span></div>
      <div style={ligne}><strong>Sur 24 h</strong> : E = P × 24 h = {nf(Math.abs(Ptot) * 24, 4)} Wh = <strong>{nf(Math.abs(E24))} kWh</strong>, soit {nf(Math.abs(E24) * PRIX_KWH, 3)} € à {dec(PRIX_KWH, 2)} €/kWh (prix du TD, chauffage électrique).</div>
    </div>
  );

  // Classement des matériaux
  const lignesClasse = Object.entries(MATS).map(([k, m]) => ({ k, nom: m.nom, lam: m.lam, coul: m.coul, R: (eClasse / 1000) / m.lam })).sort((a, b) => b.R - a.R);
  const lmin = Math.log10(Math.min(...lignesClasse.map(x => x.R))), lmax = Math.log10(Math.max(...lignesClasse.map(x => x.R)));
  const classement = (
    <div>
      <div style={{ fontSize: 13.5, color: KIT.txt, marginBottom: 6 }}>
        Résistance thermique d’une paroi de <input type="number" min="1" max="1000" step="1" value={eClasse} aria-label="Épaisseur pour le classement (mm)"
          onChange={e => { const v = parseFloat(e.target.value); if (isFinite(v) && v > 0) setEClasse(v); }}
          style={{ width: 64, fontSize: 13.5, padding: '2px 6px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6 }}/> mm d’épaisseur et de 1 m² de surface, pour chaque matériau
        (échelle logarithmique). Plus R<Sub c="th"/> est grande, plus le matériau est isolant.
      </div>
      {lignesClasse.map(x => (
        <div key={x.k} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 150px', gap: 8, alignItems: 'center', fontSize: 13, color: KIT.txt, padding: '2px 0' }}>
          <span>{x.nom}</span>
          <span style={{ background: '#f1f5f9', borderRadius: 4, height: 14, display: 'block' }}>
            <span style={{ display: 'block', height: 14, borderRadius: 4, background: x.coul, border: '1px solid #475569', boxSizing: 'border-box',
              width: `${Math.max(2, 4 + 96 * (Math.log10(x.R) - lmin) / (lmax - lmin))}%` }}/>
          </span>
          <span style={{ fontFamily: 'monospace' }}>λ = {nf(x.lam)} · R = {nf(x.R)}</span>
        </div>))}
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>λ en W·m⁻¹·K⁻¹ ; R en K·W⁻¹. Valeurs de λ tirées des documents du chapitre (les tables varient d’une source à l’autre).</div>
    </div>
  );

  // ════════════════ DÉFI ════════════════
  function nouveauDefi(t = typeDefi) { setDefi(tirageDefi(t)); }
  function changerMode(m) { setMode(m); if (m === 'defi' && !defi) nouveauDefi(); }
  const voletDefi = defi && (() => {
    const Q = questionsDefi(defi);
    const juste = q => proche(lireNombre(defi.reps[q.id]), q.vrai, q.tol);
    const setRep = (id, v) => setDefi(df => ({ ...df, verifie: false, reps: { ...df.reps, [id]: v } }));
    const nbJustes = Q.filter(juste).length, M = modeleDefi(defi);
    const types = [['mur', 'Mur multicouche'], ['isolant', 'Dimensionner l’isolant'], ['vitrage', 'Simple et double vitrage']];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {types.map(([k, nom]) => <button key={k} onClick={() => { setTypeDefi(k); nouveauDefi(k); }} style={stylePetitBouton(defi.type === k, '#0ea5e9')}>{nom}</button>)}
        </div>
        {defi.type === 'mur' && <>
          <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>
            Un mur de <strong>{defi.S} m²</strong> sépare l’intérieur (<strong>{defi.Ti} °C</strong>) de l’extérieur (<strong>{defi.Te} °C</strong>). Il est constitué de trois couches (de l’intérieur vers l’extérieur) :
          </div>
          <Schema sol={M.mur}/><Legende sol={M.mur}/>
        </>}
        {defi.type === 'isolant' && (
          <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>
            On veut isoler un mur de <strong>1 m²</strong> constitué de {MATS[defi.maco].nom.toLowerCase()} (e = <strong>{defi.eMaco / 10} cm</strong>, λ = {nf(MATS[defi.maco].lam)} W·m⁻¹·K⁻¹)
            et d’une plaque de plâtre (e = <strong>{defi.ePlatre} mm</strong>, λ = {MATS.platre.lam} W·m⁻¹·K⁻¹), avec de l’isolant ({MATS[defi.iso].nom.toLowerCase()}, λ = {nf(MATS[defi.iso].lam)} W·m⁻¹·K⁻¹).
            Cahier des charges : <strong>R<Sub c="th,global"/> ≥ {defi.Rcible} K·W⁻¹</strong>.
          </div>)}
        {defi.type === 'vitrage' && <>
          <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>
            On compare, pour une surface vitrée de <strong>{defi.S} m²</strong>, un simple vitrage et un double vitrage, avec T<Sub c="int"/> = <strong>{defi.Ti} °C</strong> et T<Sub c="ext"/> = <strong>{defi.Te} °C</strong>.
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt }}>Simple vitrage</div><Schema sol={M.simple}/><Legende sol={M.simple}/>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt }}>Double vitrage</div><Schema sol={M.double}/><Legende sol={M.double}/>
        </>}
        <div style={{ fontSize: 13, color: KIT.txt2 }}>Rappels : R<Sub c="th"/> = e / (λ·S) ; couches en série : R<Sub c="th,global"/> = ΣR<Sub c="th"/> ; P = ΔT / R<Sub c="th"/> ; ΔT = P × R<Sub c="th"/>. Donnez 3 chiffres significatifs (notation possible : 1,2e-3).</div>
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
              {defi.verifie && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 3 }}>Réponse attendue : <strong>{nf(q.vrai)} {q.u}</strong> — {indicesProfond(q.detail)}</div>}
            </div>);
        })}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => setDefi(df => ({ ...df, verifie: true }))} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
          <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}>🔄 Nouvelles données</button>
          {defi.verifie && <span style={{ fontSize: 14, fontWeight: 700, color: KIT.txt }}>{nbJustes} / {Q.length} réponses justes</span>}
        </div>
        <div style={{ fontSize: 12.5, color: KIT.txt2 }}>Les réponses sont acceptées à 2 % près.</div>
      </div>
    );
  })();

  // ════════════════ HYPOTHÈSES ════════════════
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Régime stationnaire</strong> : les températures ne varient plus au cours du temps. La même puissance P traverse donc toutes les couches : c’est ce qui permet d’additionner leurs résistances.</li>
      <li><strong>Paroi plane, flux unidirectionnel</strong> : l’énergie traverse la paroi perpendiculairement à ses faces ; on néglige les fuites par les bords (surface grande devant l’épaisseur). Pas de ponts thermiques (joints, poteaux, fixations).</li>
      <li><strong>Couches homogènes, λ constante</strong> : λ ne dépend ni de la température ni de l’humidité (en réalité, un isolant humide isole moins bien). Valeurs de λ tirées des documents du chapitre ; les tables varient d’une source à l’autre (par exemple verre : 1,0 ou 1,2 ; polystyrène : 0,032 ou 0,035).</li>
      <li><strong>Contact parfait entre couches</strong> : pas de résistance de contact. (En TP, on met souvent de la pâte thermique pour s’en approcher.)</li>
      <li><strong>Faces de la paroi à la température de l’air</strong> : on néglige l’échange par convection avec l’air de chaque côté. L’option « films d’air » ajoute r = 0,13 m²·K·W⁻¹ (intérieur) et 0,04 m²·K·W⁻¹ (extérieur), ordres de grandeur usuels pour une paroi verticale ; la résistance d’un film sur la surface S vaut r / S.</li>
      <li><strong>Lame d’air immobile</strong> (λ = 0,025 W·m⁻¹·K⁻¹) : modèle de conduction pure. Dans un vrai double vitrage, la convection et le rayonnement dans la lame réduisent sa résistance (de l’ordre de 0,15 m²·K·W⁻¹ pour 1 cm au lieu de 0,40 par ce modèle), donc le gain réel du double vitrage est plus faible que celui calculé ici.</li>
      <li><strong>Unités</strong> : R<Sub c="th"/> est donnée ici en K·W⁻¹ (elle dépend de la surface S), comme dans le cours. En bâtiment, on donne plutôt R en m²·K·W⁻¹, c’est-à-dire pour 1 m².</li>
      <li><strong>Énergie sur 24 h</strong> : calculée avec la puissance constante, sans variation de température au fil de la journée ; prix de 0,17 €/kWh repris du TD.</li>
    </ul>
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
        .par-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .par-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .par-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
        .par-curseurs { display: grid; gap: 0 18px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
        @media (max-width: 960px) { .par-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Paroi multicouche : résistance thermique</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div className={`par-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {mode === 'defi' ? <div style={styleBoite}>{voletDefi}</div> : vue}
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : mode === 'defi' ? <div style={styleBoite}><div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Hypothèses de travail</div>{hypotheses}</div>
            : null}
      </div>
      {mode === 'explore' && <>
        <div style={{ marginBottom: 12 }}>{reglages}</div>
        <div style={{ ...styleBoite, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: KIT.txt, marginBottom: 6 }}>Bilan et calculs</div>
          {calculs}
        </div>
        <div className="par-l2">
          <div style={styleBoite}>
            <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
              <li>Chargez le simple puis le double vitrage : par combien la puissance est-elle divisée ? Cochez ensuite « films d’air » : que devient ce rapport ?</li>
              <li>Dans le mur isolé, doublez l’épaisseur de brique, puis doublez celle de la laine de bois : lequel des deux changements réduit le plus la puissance ?</li>
              <li>Inversez l’ordre des couches : P change-t-elle ? Et le profil de température ?</li>
              <li>Remplacez la laine de bois par du béton de même épaisseur : que devient la répartition de l’écart de température ?</li>
              <li>Fixez T<Sub c="ext"/> au-dessus de T<Sub c="int"/> (été) : dans quel sens va l’énergie ?</li>
              <li>Dans le classement des matériaux, trouvez quelle épaisseur de béton est nécessaire pour égaler 1 cm de laine de bois.</li>
            </ul>
          </div>
          {panneauHypo}
        </div>
        <div style={{ marginTop: 12 }}>
          <Section titre="Classer les matériaux selon leur pouvoir isolant" ouvert={classeOuv} onBascule={() => setClasseOuv(o => !o)}>{classement}</Section>
        </div>
      </>}
      {mode === 'guide' && panneauHypo}
    </div>
  );
}
