import { useState, useEffect } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, Curseur, indicesProfond, lireNombre, proche } from "../commun";

// ====================================================
//  SIM 30 — ÉCHANGEUR THERMIQUE COAXIAL : CO-COURANT ET CONTRE-COURANT
// ====================================================

// ── Modèle (fonctions pures) ──
// Régime stationnaire, pas de pertes vers l'extérieur, U uniforme le long du tube, eau liquide des deux côtés
// (C = 4 180 J·kg⁻¹·K⁻¹, ρ = 1,00 kg·L⁻¹, valeurs du TP). Le fluide chaud entre à gauche (x = 0) ; le froid
// entre à gauche en co-courant, à droite (x = L) en contre-courant. Surface d'échange S = π·D·L.
// Bilan sur une tranche dx : C_c·dT_c = −U·π·D·(T_c − T_f)·dx et ± C_f·dT_f = U·π·D·(T_c − T_f)·dx,
// avec C_c = Q_mC·C et C_f = Q_mF·C (débits de capacité, W·K⁻¹). Les profils sont des exponentielles exactes
// et la puissance vaut exactement P = U·S·ΔT_m avec ΔT_m moyenne logarithmique des écarts aux extrémités.
export const C_EAU = 4180, RHO_EAU = 1.0, LV_100 = 2257e3;   // J·kg⁻¹·K⁻¹, kg·L⁻¹, J·kg⁻¹ (vaporisation à 100 °C)
const qm = qv => qv * RHO_EAU / 3600;                         // L·h⁻¹ → kg·s⁻¹

export function lmtd(a, b) {
  if (!(a > 0 && b > 0)) return NaN;
  if (Math.abs(a - b) < 1e-9 * Math.max(a, b)) return a;
  return (a - b) / Math.log(a / b);
}

// p = { mode: 'co' | 'contre', cst: bool (fluide chaud à température constante), TCE, TFE (°C), QvC, QvF (L·h⁻¹),
//       U (W·m⁻²·K⁻¹), L (m), D (mm) }
export function modele(p) {
  const D = p.D / 1000, S = Math.PI * D * p.L, k = p.U * Math.PI * D;
  const Cf = qm(p.QvF) * C_EAU, Cc = p.cst ? Infinity : qm(p.QvC) * C_EAU;
  let Tc, Tf, TCS, TFS, dT1, dT2;                              // écarts aux extrémités calculés directement (précision si ΔT → 0)
  if (p.cst) {
    const ecS = (p.TCE - p.TFE) * Math.exp(-k * p.L / Cf), sortie = p.TCE - ecS;
    [dT1, dT2] = p.mode === 'co' ? [p.TCE - p.TFE, ecS] : [ecS, p.TCE - p.TFE];
    Tc = () => p.TCE;
    Tf = x => p.TCE - (p.TCE - p.TFE) * Math.exp(-k * (p.mode === 'co' ? x : p.L - x) / Cf);
    TCS = p.TCE; TFS = sortie;
  } else if (p.mode === 'co') {
    const t0 = p.TCE - p.TFE, a = k * (1 / Cc + 1 / Cf);
    const th = x => t0 * Math.exp(-a * x);
    Tc = x => p.TCE - Cf / (Cc + Cf) * (t0 - th(x));
    Tf = x => p.TFE + Cc / (Cc + Cf) * (t0 - th(x));
    TCS = Tc(p.L); TFS = Tf(p.L); dT1 = t0; dT2 = th(p.L);
  } else {
    const Cmin = Math.min(Cc, Cf), Cr = Cmin / Math.max(Cc, Cf), NTU = p.U * S / Cmin;
    const eps = Math.abs(1 - Cr) < 1e-9 ? NTU / (1 + NTU)
      : (1 - Math.exp(-NTU * (1 - Cr))) / (1 - Cr * Math.exp(-NTU * (1 - Cr)));
    const P = eps * Cmin * (p.TCE - p.TFE);
    TCS = p.TCE - P / Cc; TFS = p.TFE + P / Cf;
    const t0 = p.TCE - TFS, m = k * (1 / Cc - 1 / Cf);
    Tc = x => p.TCE - k * t0 / Cc * (Math.abs(m * p.L) < 1e-9 ? x : (1 - Math.exp(-m * x)) / m);
    Tf = x => Tc(x) - t0 * Math.exp(-m * x);
    dT1 = t0; dT2 = t0 * Math.exp(-m * p.L);
  }
  const PF = Cf * (TFS - p.TFE), PC = p.cst ? -PF : Cc * (TCS - p.TCE);
  return { S, Tc, Tf, TCS, TFS, dT1, dT2, dTm: lmtd(dT1, dT2), PF, PC, Cc, Cf };
}

// ── Mise en forme ──
const r1 = x => Math.round(x * 10) / 10;                       // températures affichées au 0,1 °C
export const nf = (x, n = 3) => (isFinite(x) ? Number(x).toLocaleString('fr-FR', { maximumSignificantDigits: n, minimumSignificantDigits: n }) : '—');
const t1 = x => (isFinite(x) ? r1(x).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '—');
const dec = (x, d) => Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const ROUGE = '#dc2626', BLEU = '#2563eb';
function couleurT(T) {                                          // 5 °C bleu → 100 °C rouge
  const f = Math.max(0, Math.min(1, (T - 5) / 95));
  const a = [37, 99, 235], b = [220, 38, 38], c = a.map((v, i) => Math.round(v + (b[i] - v) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
const Sub = ({ c }) => <sub>{c}</sub>;

// ── Situations prédéfinies ──
export const PRESETS = {
  guide: { nom: 'Exemple du parcours guidé', mode: 'co', chaud: 'circule', TCE: 65, TFE: 15, QvC: 150, QvF: 100, U: 1200, L: 3, D: 20 },
  tp: { nom: 'Échangeur coaxial du TP (L = 36 cm)', mode: 'contre', chaud: 'circule', TCE: 48, TFE: 20, QvC: 240, QvF: 210, U: 2900, L: 0.36, D: 19.5,
    note: 'Valeurs du relevé de TP 2023-2024 ; U ≈ 2,9 kW·m⁻²·K⁻¹ a été estimé à partir de ce relevé.' },
  serpentin: { nom: 'Serpentin dans un bain à 50 °C (exemple du cours)', mode: 'contre', chaud: 'bain', TCE: 50, TFE: 21, QvC: 150, QvF: 75, U: 250, L: 4, D: 12,
    note: 'Bain maintenu à 50 °C, eau froide à 75 L·h⁻¹ de 21 °C à environ 31 °C, comme dans le cours ; U a été choisi pour retrouver cet exemple.' },
};
const paramsDe = r => ({ mode: r.mode, cst: r.chaud !== 'circule', TCE: r.chaud === 'vapeur' ? 100 : r.TCE, TFE: r.TFE,
  QvC: r.QvC, QvF: r.QvF, U: r.U, L: r.L, D: r.D });

// ════════════════ SCHÉMA DE L'ÉCHANGEUR ════════════════
// Même échelle horizontale que le graphique (x de XG à XD) pour que les deux se lisent l'un sous l'autre.
const W = 760, XG = 80, XD = 720;
function Schema({ p, sol, chaud, fleches = true, enMarche = true }) {
  const X = x => XG + (x / p.L) * (XD - XG);
  const N = 64, segs = Array.from({ length: N }, (_, i) => [i / N * p.L, (i + 1) / N * p.L]);
  const yA = 54, yB = 84, yC = 116, yD = 146;                    // enveloppe (froid) : yA–yB et yC–yD ; tube intérieur : yB–yC
  const gris = '#e2e8f0';
  const fC = x => (enMarche ? couleurT(sol.Tc(x)) : gris), fF = x => (enMarche ? couleurT(sol.Tf(x)) : gris);
  const co = p.mode === 'co';
  const fleche = (x, y, versD, c) => (
    <polygon key={`${x}-${y}`} points={versD ? `${x - 9},${y - 6} ${x + 9},${y} ${x - 9},${y + 6}` : `${x + 9},${y - 6} ${x - 9},${y} ${x + 9},${y + 6}`}
      fill="white" stroke={c} strokeWidth="1.5"/>);
  const T = v => (enMarche ? `${t1(v)} °C` : '—');
  const nomChaud = chaud === 'bain' ? 'bain' : chaud === 'vapeur' ? 'vapeur' : null;
  const xFg = XG + 18, xFd = XD - 18;                            // piquages de l'eau froide
  const etiqF = (x, entree) => (fleches ? (entree ? <>T<tspan fontSize="10" dy="3">FE</tspan><tspan dy="-3"> = </tspan></>
    : <>T<tspan fontSize="10" dy="3">FS</tspan><tspan dy="-3"> = </tspan></>) : <>T = </>);
  return (
    <svg viewBox={`0 0 ${W} 210`} style={{ width: '100%', display: 'block' }} role="img" aria-label="Schéma de l'échangeur coaxial">
      {/* eau froide : piquages */}
      <rect x={xFg - 8} y={22} width={16} height={yA - 22} fill={fF(0)} stroke="#475569" strokeWidth="1.5"/>
      <rect x={xFd - 8} y={22} width={16} height={yA - 22} fill={fF(p.L)} stroke="#475569" strokeWidth="1.5"/>
      {/* bandes colorées */}
      {segs.map(([a, b], i) => {
        const xm = (a + b) / 2, w = X(b) - X(a) + 0.6;
        return (
          <g key={i}>
            <rect x={X(a)} y={yA} width={w} height={yB - yA} fill={fF(xm)}/>
            <rect x={X(a)} y={yC} width={w} height={yD - yC} fill={fF(xm)}/>
            <rect x={X(a)} y={yB} width={w} height={yC - yB} fill={fC(xm)}/>
          </g>);
      })}
      {/* tube chaud : entrée et sortie */}
      <rect x={XG - 46} y={yB} width={46} height={yC - yB} fill={fC(0)} stroke="#475569" strokeWidth="1.5"/>
      <rect x={XD} y={yB} width={34} height={yC - yB} fill={fC(p.L)} stroke="#475569" strokeWidth="1.5"/>
      {/* parois */}
      <rect x={XG} y={yA} width={XD - XG} height={yD - yA} fill="none" stroke="#334155" strokeWidth="3"/>
      <line x1={XG} x2={XD} y1={yB} y2={yB} stroke="#0f172a" strokeWidth="3.5"/>
      <line x1={XG} x2={XD} y1={yC} y2={yC} stroke="#0f172a" strokeWidth="3.5"/>
      {/* sens de circulation */}
      {fleches && enMarche && nomChaud !== 'bain' && [0.2, 0.5, 0.8].map(f => fleche(XG + f * (XD - XG), (yB + yC) / 2, true, ROUGE))}
      {fleches && enMarche && [0.35, 0.65].map(f => fleche(XG + f * (XD - XG), (yA + yB) / 2, co, BLEU))}
      {fleches && enMarche && [0.35, 0.65].map(f => fleche(XG + f * (XD - XG), (yC + yD) / 2, co, BLEU))}
      {fleches && enMarche && <>
        <polygon points={co ? `${xFg - 6},${30} ${xFg + 6},${30} ${xFg},${42}` : `${xFg - 6},${42} ${xFg + 6},${42} ${xFg},${30}`} fill="white" stroke={BLEU} strokeWidth="1.5"/>
        <polygon points={co ? `${xFd - 6},${42} ${xFd + 6},${42} ${xFd},${30}` : `${xFd - 6},${30} ${xFd + 6},${30} ${xFd},${42}`} fill="white" stroke={BLEU} strokeWidth="1.5"/>
      </>}
      {/* étiquettes : eau froide en haut, fluide chaud en bas */}
      <text x={xFg + 14} y={18} fontSize="13" fill={BLEU} fontWeight="700">{etiqF(0, co)}{T(sol.Tf(0))}</text>
      <text x={xFd - 14} y={18} fontSize="13" fill={BLEU} fontWeight="700" textAnchor="end">{etiqF(p.L, !co)}{T(sol.Tf(p.L))}</text>
      {nomChaud ? (
        <text x={(XG + XD) / 2} y={172} fontSize="13" fill={ROUGE} fontWeight="700" textAnchor="middle">
          {nomChaud === 'bain' ? 'Côté chaud : bain bien agité' : 'Côté chaud : vapeur d’eau qui se condense'} à température constante : {T(p.TCE)}
        </text>
      ) : <>
        <text x={XG - 46} y={172} fontSize="13" fill={ROUGE} fontWeight="700">T<tspan fontSize="10" dy="3">CE</tspan><tspan dy="-3"> = {T(p.TCE)}</tspan></text>
        <text x={XD + 34} y={172} fontSize="13" fill={ROUGE} fontWeight="700" textAnchor="end">T<tspan fontSize="10" dy="3">CS</tspan><tspan dy="-3"> = {T(sol.TCS)}</tspan></text>
      </>}
      <text x={(XG + XD) / 2} y={190} fontSize="12" fill="#64748b" textAnchor="middle">Fluide chaud dans le tube intérieur, eau froide dans l’enveloppe. Schéma de principe, pas à l’échelle.</text>
      <text x={(XG + XD) / 2} y={205} fontSize="12" fill="#64748b" textAnchor="middle">Couleur : température (bleu = froid, rouge = chaud).</text>
    </svg>
  );
}

// ════════════════ GRAPHIQUE T(x) ════════════════
function pasJoli(e) { const p = 10 ** Math.floor(Math.log10(e)), n = e / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
function Graphe({ p, sol, fleches = true, autre = null, dT = false, enMarche = true }) {
  const H = 316, yH = 44, yB = 266;
  const Tmin = Math.floor((p.TFE - 2) / 5) * 5, Tmax = Math.ceil((p.TCE + 2) / 5) * 5;
  const X = x => XG + (x / p.L) * (XD - XG), Y = T => yB - (T - Tmin) / (Tmax - Tmin) * (yB - yH);
  const n = 80, xs = Array.from({ length: n + 1 }, (_, i) => i / n * p.L);
  const ligne = f => xs.map(x => `${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`).join(' ');
  const pT = pasJoli((Tmax - Tmin) / 6), pX = pasJoli(p.L / 6);
  const ticksT = []; for (let t = Math.ceil(Tmin / pT) * pT; t <= Tmax + 1e-9; t += pT) ticksT.push(t);
  const ticksX = []; for (let x = 0; x <= p.L + 1e-9; x += pX) ticksX.push(x);
  const dp = pX < 0.1 ? 2 : pX < 1 ? 1 : 0;
  const co = p.mode === 'co';
  const tete = (f, x, droite, c) => {                           // petite pointe de flèche posée sur la courbe
    const h = p.L / 200, x0 = X(x), y0 = Y(f(x));
    const ang = Math.atan2(Y(f(x + h)) - Y(f(x - h)), X(x + h) - X(x - h)) + (droite ? 0 : Math.PI);
    const pt = (r, a) => `${(x0 + r * Math.cos(ang + a)).toFixed(1)},${(y0 + r * Math.sin(ang + a)).toFixed(1)}`;
    return <polygon key={`${c}${x}`} points={`${pt(9, 0)} ${pt(8, 2.5)} ${pt(8, -2.5)}`} fill={c}/>;
  };
  const doubleFleche = (xpx, ya, yb, label, cote) => (
    <g>
      <line x1={xpx} x2={xpx} y1={ya + 4} y2={yb - 4} stroke="#7e22ce" strokeWidth="2"/>
      {yb - ya > 20 && <>
        <polygon points={`${xpx - 5},${ya + 9} ${xpx + 5},${ya + 9} ${xpx},${ya}`} fill="#7e22ce"/>
        <polygon points={`${xpx - 5},${yb - 9} ${xpx + 5},${yb - 9} ${xpx},${yb}`} fill="#7e22ce"/>
      </>}
      <text x={xpx + (cote > 0 ? 8 : -8)} y={yb - ya > 20 ? (ya + yb) / 2 + 5 : ya - 8} fontSize="15" fontWeight="700" fill="#7e22ce" textAnchor={cote > 0 ? 'start' : 'end'}>{label}</text>
    </g>);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #cbd5e1' }}
      role="img" aria-label="Profils de température le long de l'échangeur">
      {ticksT.map(t => (
        <g key={`t${t}`}>
          <line x1={XG} x2={XD} y1={Y(t)} y2={Y(t)} stroke="#e2e8f0"/>
          <text x={XG - 6} y={Y(t) + 4} fontSize="13" fill="#334155" textAnchor="end">{t}</text>
        </g>))}
      {ticksX.map(x => <text key={`x${x}`} x={X(x)} y={yB + 18} fontSize="13" fill="#334155" textAnchor="middle">{dec(x, dp)}</text>)}
      <line x1={XG} x2={XD} y1={yB} y2={yB} stroke="#0f172a" strokeWidth="1.2"/>
      <line x1={XG} x2={XG} y1={yH} y2={yB} stroke="#0f172a" strokeWidth="1.2"/>
      <text x={(XG + XD) / 2} y={H - 10} fontSize="14" fill="#0f172a" textAnchor="middle" fontWeight="700">position x le long de l’échangeur (m) — le fluide chaud entre en x = 0</text>
      <text x={18} y={(yH + yB) / 2} fontSize="14" fill="#0f172a" textAnchor="middle" fontWeight="700" transform={`rotate(-90 18 ${(yH + yB) / 2})`}>température (°C)</text>
      {enMarche && <>
        {autre && <>
          <polyline points={ligne(autre.Tc)} fill="none" stroke={ROUGE} strokeOpacity="0.45" strokeWidth="2" strokeDasharray="6 5"/>
          <polyline points={ligne(autre.Tf)} fill="none" stroke={BLEU} strokeOpacity="0.45" strokeWidth="2" strokeDasharray="6 5"/>
        </>}
        <polyline points={ligne(sol.Tc)} fill="none" stroke={ROUGE} strokeWidth="3"/>
        <polyline points={ligne(sol.Tf)} fill="none" stroke={BLEU} strokeWidth="3"/>
        {fleches && !p.cst && [0.3, 0.7].map(f => tete(sol.Tc, f * p.L, true, ROUGE))}
        {fleches && [0.3, 0.7].map(f => tete(sol.Tf, f * p.L, co, BLEU))}
        {dT && doubleFleche(X(0) + 14, Y(sol.Tc(0)), Y(sol.Tf(0)), <>ΔT<tspan fontSize="11" dy="4">1</tspan></>, 1)}
        {dT && doubleFleche(X(p.L) - 14, Y(sol.Tc(p.L)), Y(sol.Tf(p.L)), <>ΔT<tspan fontSize="11" dy="4">2</tspan></>, -1)}
      </>}
      <g transform={`translate(${XG + 4}, 20)`}>
        <line x1="0" x2="22" y1="-4" y2="-4" stroke={ROUGE} strokeWidth="3"/>
        <text x="28" y="0" fontSize="13" fill="#0f172a">{p.cst ? 'côté chaud (température constante)' : 'fluide chaud'}</text>
        <line x1="290" x2="312" y1="-4" y2="-4" stroke={BLEU} strokeWidth="3"/>
        <text x="318" y="0" fontSize="13" fill="#0f172a">eau froide</text>
        {autre && <><line x1="410" x2="432" y1="-4" y2="-4" stroke="#64748b" strokeWidth="2" strokeDasharray="6 5"/>
          <text x="438" y="0" fontSize="13" fill="#0f172a">{co ? 'même échangeur à contre-courant' : 'même échangeur à co-courant'}</text></>}
      </g>
    </svg>
  );
}

// ════════════════ RELEVÉ (les « mesures », comme en TP) ════════════════
function Releve({ p, sol, chaud, enMarche = true, fleches = true }) {
  const T = v => (enMarche ? `${t1(v)} °C` : '—');
  const cell = { padding: '4px 8px', borderBottom: `1px solid ${KIT.bord}`, fontSize: 14 };
  const tete = { ...cell, fontWeight: 700, color: KIT.txt2, background: '#f1f5f9' };
  const co = p.mode === 'co';
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', background: 'white', borderRadius: 8 }}>
      <thead><tr><th style={tete}></th><th style={tete}>Débit volumique</th><th style={tete}>Entrée</th><th style={tete}>Sortie</th></tr></thead>
      <tbody>
        <tr>
          <td style={{ ...cell, color: ROUGE, fontWeight: 700 }}>{chaud === 'circule' ? 'Fluide chaud (eau)' : chaud === 'bain' ? 'Bain (T constante)' : 'Vapeur (T constante)'}</td>
          <td style={cell}>{chaud === 'circule' ? <>Q<Sub c="vC"/> = {p.QvC} L·h⁻¹</> : '—'}</td>
          <td style={cell}>{chaud === 'circule' ? <>T<Sub c="CE"/> = {T(p.TCE)}</> : T(p.TCE)}</td>
          <td style={cell}>{chaud === 'circule' ? <>T<Sub c="CS"/> = {T(sol.TCS)}</> : T(p.TCE)}</td>
        </tr>
        <tr>
          <td style={{ ...cell, color: BLEU, fontWeight: 700 }}>Eau froide</td>
          <td style={cell}>Q<Sub c="vF"/> = {p.QvF} L·h⁻¹</td>
          <td style={cell}>T<Sub c="FE"/> = {T(p.TFE)}</td>
          <td style={cell}>T<Sub c="FS"/> = {T(sol.TFS)}</td>
        </tr>
      </tbody>
      <tfoot><tr><td colSpan="4" style={{ ...cell, borderBottom: 'none', color: KIT.txt2 }}>
        Tube intérieur : diamètre D = {dec(p.D, p.D % 1 ? 1 : 0)} mm, longueur L = {dec(p.L, p.L < 1 ? 2 : p.L % 1 ? 1 : 0)} m
        {fleches && <> · circulation : <strong>{co ? 'co-courant' : 'contre-courant'}</strong></>}
      </td></tr></tfoot>
    </table>
  );
}

// ════════════════ CALCULS (exploration libre seulement) ════════════════
function Calculs({ p, sol, chaud }) {
  const QmC = qm(p.QvC), QmF = qm(p.QvF), ligne = { fontSize: 14, color: KIT.txt, lineHeight: 1.7 };
  const co = p.mode === 'co';
  const P = p.U * sol.S * sol.dTm;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={ligne}><strong>Débits massiques</strong> (ρ = 1,00 kg·L⁻¹, 1 h = 3 600 s) : {chaud === 'circule' && <>Q<Sub c="mC"/> = {p.QvC} / 3 600 = {nf(QmC)} kg·s⁻¹ ; </>}Q<Sub c="mF"/> = {p.QvF} / 3 600 = {nf(QmF)} kg·s⁻¹</div>
      <div style={ligne}><strong>Eau froide</strong> : P<Sub c="F"/> = Q<Sub c="mF"/> · C · (T<Sub c="FS"/> − T<Sub c="FE"/>) = {nf(QmF)} × 4 180 × ({t1(sol.TFS)} − {t1(p.TFE)}) = <strong>{nf(sol.PF)} W</strong> (reçue : positive)</div>
      {chaud === 'circule'
        ? <div style={ligne}><strong>Fluide chaud</strong> : P<Sub c="C"/> = Q<Sub c="mC"/> · C · (T<Sub c="CS"/> − T<Sub c="CE"/>) = {nf(QmC)} × 4 180 × ({t1(sol.TCS)} − {t1(p.TCE)}) = <strong>{nf(sol.PC)} W</strong> (cédée : négative)</div>
        : <div style={ligne}><strong>Côté chaud</strong> : sa température ne varie pas ; il cède |P<Sub c="C"/>| = P<Sub c="F"/>.
          {chaud === 'vapeur' && <> Débit de vapeur condensée : Q<Sub c="m,vap"/> = P / L<Sub c="v"/> = {nf(sol.PF)} / 2 257 000 = <strong>{nf(sol.PF / LV_100)} kg·s⁻¹</strong> (L<Sub c="v"/> = 2 257 kJ·kg⁻¹ à 100 °C).</>}</div>}
      <div style={ligne}><strong>Surface d’échange</strong> : S = π · D · L = π × {nf(p.D / 1000)} × {nf(p.L)} = <strong>{nf(sol.S)} m²</strong></div>
      <div style={ligne}><strong>Écarts aux extrémités</strong> : à gauche ΔT<Sub c="1"/> = {co ? <>T<Sub c="CE"/> − T<Sub c="FE"/></> : <>T<Sub c="CE"/> − T<Sub c="FS"/></>} = <strong>{t1(sol.dT1)} °C</strong> ; à droite ΔT<Sub c="2"/> = {co ? <>T<Sub c="CS"/> − T<Sub c="FS"/></> : <>T<Sub c="CS"/> − T<Sub c="FE"/></>} = <strong>{t1(sol.dT2)} °C</strong></div>
      <div style={ligne}><strong>Écart moyen</strong> : ΔT<Sub c="m"/> = (ΔT<Sub c="1"/> − ΔT<Sub c="2"/>) / ln(ΔT<Sub c="1"/> / ΔT<Sub c="2"/>) = <strong>{nf(sol.dTm)} °C</strong>
        <span style={{ color: KIT.txt2 }}> (moyenne arithmétique, pour comparer : {nf((sol.dT1 + sol.dT2) / 2)} °C)</span></div>
      <div style={ligne}><strong>Puissance transférée</strong> : P = U · S · ΔT<Sub c="m"/> = {p.U} × {nf(sol.S)} × {nf(sol.dTm)} = <strong>{nf(P)} W</strong>
        <span style={{ color: '#15803d' }}> ✓ égale à P<Sub c="F"/> (pas de pertes dans le modèle)</span></div>
    </div>
  );
}

// ════════════════ DÉFI : génération des données ════════════════
const tire = t => t[Math.floor(Math.random() * t.length)];
const entre = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export function tirageDefi(type) {
  for (let essai = 0; essai < 500; essai++) {
    const p = { mode: tire(['co', 'contre']), cst: false, TCE: entre(50, 90), TFE: entre(8, 20), QvC: 10 * entre(5, 30), QvF: 10 * entre(5, 30),
      U: 50 * entre(10, 50), L: tire([0.5, 1, 1.5, 2, 2.5, 3, 4]), D: tire([12, 16, 20, 25]) };
    const s = modele(p);
    const TCS = r1(s.TCS), TFS = r1(s.TFS);
    const d1 = p.mode === 'co' ? p.TCE - p.TFE : r1(p.TCE - TFS), d2 = p.mode === 'co' ? r1(TCS - TFS) : r1(TCS - p.TFE);
    if (TFS - p.TFE < 3 || p.TCE - TCS < 3 || d1 < 1 || d2 < 1 || Math.abs(d1 - d2) < 0.5) continue;
    return { type, p, TCS, TFS, d1, d2, reps: {}, verifie: false };
  }
  return tirageDefi(type);
}
function questionsDefi(df) {
  const { p, TCS, TFS, d1, d2 } = df;
  const QmF = qm(p.QvF), dTm = lmtd(d1, d2), S = Math.PI * p.D / 1000 * p.L;
  const PF = QmF * C_EAU * (TFS - p.TFE);
  if (df.type === 'U') {
    const U = PF / (S * dTm);
    return [
      { id: 'mode', choix: ['co-courant', 'contre-courant'], bonne: p.mode === 'co' ? 0 : 1,
        q: <>D’après les profils de température, l’échangeur fonctionne-t-il à co-courant ou à contre-courant ?</>,
        expl: p.mode === 'co' ? 'Le fluide chaud et l’eau froide entrent tous les deux du côté x = 0 : les deux courbes partent loin l’une de l’autre puis se rapprochent ; l’eau froide se réchauffe de gauche à droite.'
          : 'L’eau froide est la plus froide en x = L : elle entre à droite et se réchauffe en allant vers la gauche. Les deux courbes descendent de gauche à droite.' },
      { id: 'PF', q: <>Puissance thermique P<Sub c="F"/> reçue par l’eau froide</>, u: 'W', vrai: PF, tol: 0.02,
        detail: `P_F = Q_mF·C·(T_FS − T_FE) = ${nf(QmF)} × 4 180 × (${t1(TFS)} − ${t1(p.TFE)}) = ${nf(PF)} W` },
      { id: 'dTm', q: <>Écart de température moyen ΔT<Sub c="m"/></>, u: '°C', vrai: dTm, tol: 0.02,
        detail: `ΔT_1 = ${t1(d1)} °C, ΔT_2 = ${t1(d2)} °C ; ΔT_m = (ΔT_1 − ΔT_2) / ln(ΔT_1 / ΔT_2) = ${nf(dTm)} °C` },
      { id: 'S', q: <>Surface d’échange S</>, u: 'm²', vrai: S, tol: 0.02, detail: `S = π·D·L = π × ${nf(p.D / 1000, 2)} × ${dec(p.L, 1)} = ${nf(S)} m²` },
      { id: 'U', q: <>Coefficient global d’échange U (on admet que la puissance transférée est P<Sub c="F"/>)</>, u: 'W·m⁻²·K⁻¹', vrai: U, tol: 0.03,
        detail: `U = P_F / (S·ΔT_m) = ${nf(PF)} / (${nf(S)} × ${nf(dTm)}) = ${nf(U)} W·m⁻²·K⁻¹` },
    ];
  }
  const P = Number(PF.toPrecision(3)), Sd = P / (p.U * dTm), Ld = Sd / (Math.PI * p.D / 1000), QmFd = P / (C_EAU * (TFS - p.TFE));
  const autreMode = p.mode === 'co' ? 'contre-courant' : 'co-courant';
  const possible = p.mode === 'co' ? true : TFS < TCS;
  return [
    { id: 'dTm', q: <>Écart de température moyen ΔT<Sub c="m"/></>, u: '°C', vrai: dTm, tol: 0.02,
      detail: `ΔT_1 = ${t1(d1)} °C, ΔT_2 = ${t1(d2)} °C ; ΔT_m = (ΔT_1 − ΔT_2) / ln(ΔT_1 / ΔT_2) = ${nf(dTm)} °C` },
    { id: 'S', q: <>Surface d’échange S nécessaire</>, u: 'm²', vrai: Sd, tol: 0.02, detail: `S = P / (U·ΔT_m) = ${nf(P)} / (${p.U} × ${nf(dTm)}) = ${nf(Sd)} m²` },
    { id: 'L', q: <>Longueur L du tube intérieur, de diamètre D = {p.D} mm</>, u: 'm', vrai: Ld, tol: 0.02, detail: `S = π·D·L donc L = S / (π·D) = ${nf(Sd)} / (π × ${nf(p.D / 1000, 2)}) = ${nf(Ld)} m` },
    { id: 'QmF', q: <>Débit massique Q<Sub c="mF"/> d’eau froide nécessaire</>, u: 'kg·s⁻¹', vrai: QmFd, tol: 0.02,
      detail: `Q_mF = P / (C·(T_FS − T_FE)) = ${nf(P)} / (4 180 × (${t1(TFS)} − ${t1(p.TFE)})) = ${nf(QmFd)} kg·s⁻¹` },
    { id: 'possible', choix: ['oui', 'non'], bonne: possible ? 0 : 1,
      q: <>Ces quatre températures pourraient-elles être obtenues avec un échangeur fonctionnant à <strong>{autreMode}</strong> (de surface éventuellement différente) ?</>,
      expl: p.mode === 'co' ? 'Oui : à contre-courant, on peut obtenir toutes les températures possibles à co-courant (il faudrait même une surface plus petite).'
        : possible ? 'Oui : ici T_FS est inférieure à T_CS, ce que permet aussi le co-courant (avec une surface plus grande).'
          : 'Non : ici T_FS est supérieure à T_CS. À co-courant, les deux fluides se rapprochent d’une même température sans jamais se croiser : T_FS reste toujours inférieure à T_CS.' },
  ];
}

// ════════════════ SIMULATION ════════════════
export function SimulationEchangeur() {
  const [mode, setMode] = useState('explore');
  const [guide, setGuide] = useEtatPersistant('echangeur-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [rg, setRg] = useEtatPersistant('echangeur-guide-reglage-v1', { go: false, contre: false, cst: false, gm: 'contre' });
  const [r, setR] = useState(() => ({ ...PRESETS.guide }));
  const [preset, setPreset] = useState('guide');
  const [opt, setOpt] = useState({ autre: false, dT: true, fleches: true });
  const [hypoOuv, setHypoOuv] = useState(false);
  const [defi, setDefi] = useState(null);
  const [typeDefi, setTypeDefi] = useState('U');
  const maj = o => { setR(x => ({ ...x, ...o })); setPreset(''); };
  // Retour au début du parcours : on remet l'échangeur du parcours dans son état de départ
  useEffect(() => { if (guide.etape === 0) setRg({ go: false, contre: false, cst: false, gm: 'contre' }); }, [guide.etape, setRg]);
  const choisirPreset = k => { setPreset(k); if (PRESETS[k]) setR({ ...PRESETS[k] }); };

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const G = PRESETS.guide;
  const iEt = id => ETAPES_IDS.indexOf(id);
  const etape = guide.etape;
  const gMode = etape < iEt('contre') ? 'co' : etape < iEt('bain') ? (rg.contre ? 'contre' : 'co') : (rg.cst ? rg.gm : 'contre');
  const gCst = etape >= iEt('bain') && rg.cst;
  const rGuide = { ...G, mode: gMode, chaud: gCst ? 'bain' : 'circule' };
  const gEnMarche = rg.go || etape > iEt('go');
  // Valeurs attendues : calculées à partir des températures affichées (arrondies au 0,1 °C), comme le ferait l'élève
  const sCo = modele(paramsDe(G)), sCt = modele(paramsDe({ ...G, mode: 'contre' }));
  const A = (() => {
    const TCS = r1(sCo.TCS), TFS = r1(sCo.TFS), QmF = qm(G.QvF), QmC = qm(G.QvC);
    const PF = QmF * C_EAU * (TFS - G.TFE), PC = QmC * C_EAU * (TCS - G.TCE), d1 = G.TCE - G.TFE, d2 = r1(TCS - TFS);
    const dTm = lmtd(d1, d2), S = Math.PI * G.D / 1000 * G.L, U = PF / (S * dTm);
    const TCSc = r1(sCt.TCS), TFSc = r1(sCt.TFS), d1c = r1(G.TCE - TFSc), d2c = r1(TCSc - G.TFE), dTmc = lmtd(d1c, d2c);
    return { TCS, TFS, QmF, QmC, PF, PC, d1, d2, dTm, S, U, TCSc, TFSc, d1c, d2c, dTmc, Pc: G.U * S * dTmc, Pco: G.U * S * dTm };
  })();
  const ETAPES = [
    { id: 'intro', titre: 'À quoi sert un échangeur ?', focus: ['schema'],
      texte: <>Un échangeur thermique transfère de l’énergie d’un fluide <strong style={{ color: ROUGE }}>chaud</strong> à un fluide <strong style={{ color: BLEU }}>froid</strong>. Dans un échangeur <strong>coaxial</strong>, le fluide chaud circule dans le tube intérieur et l’eau froide dans l’enveloppe qui l’entoure.</>,
      tache: { type: 'qcm', q: 'Comment l’énergie passe-t-elle du fluide chaud au fluide froid ?',
        options: ['À travers la paroi du tube intérieur, sans que les deux fluides se mélangent', 'En mélangeant les deux fluides', 'Le fluide froid cède du « froid » au fluide chaud'], bonne: 0,
        expl: 'Les fluides restent séparés : l’énergie traverse la paroi du tube intérieur par conduction, toujours du chaud vers le froid. On choisit pour cette paroi un bon conducteur thermique (cuivre, inox, aluminium).' } },
    { id: 'go', titre: 'Mettre l’échangeur en marche', focus: ['schema', 'releve'],
      texte: <>On fait circuler l’eau chaude à Q<Sub c="vC"/> = {G.QvC} L·h⁻¹ (entrée à {G.TCE} °C) et l’eau froide à Q<Sub c="vF"/> = {G.QvF} L·h⁻¹ (entrée à {G.TFE} °C). Comme en TP, on attend le <strong>régime stationnaire</strong> (températures stables) avant de relever les quatre températures.</>,
      tache: { type: 'action', ok: gEnMarche, label: 'Mettre les fluides en circulation', faire: () => setRg(x => ({ ...x, go: true })),
        consigne: gEnMarche ? null : 'Cliquez pour faire circuler les deux fluides' } },
    { id: 'sens', titre: 'Le sens de circulation', focus: ['schema'],
      texte: <>Observez les flèches du schéma : elles indiquent le sens de circulation de chaque fluide.</>,
      tache: { type: 'qcm', q: 'Comment circulent les deux fluides ?', options: ['Dans le même sens : c’est un échangeur à co-courant', 'En sens opposés : c’est un échangeur à contre-courant', 'On ne peut pas le savoir'], bonne: 0,
        expl: 'Les deux fluides entrent du même côté (à gauche) et ressortent du même côté (à droite) : c’est le co-courant.' } },
    { id: 'profils', titre: 'Les profils de température', focus: ['graphe'],
      texte: <>Le graphique montre la température de chaque fluide <strong>tout le long</strong> de l’échangeur, de l’entrée du fluide chaud (x = 0) à l’autre extrémité (x = {G.L} m).</>,
      tache: { type: 'qcm', q: 'Le long de l’échangeur, l’écart de température entre le fluide chaud et le fluide froid…',
        options: ['diminue : il est grand à l’entrée et petit à la sortie', 'reste constant', 'augmente'], bonne: 0,
        expl: 'Le fluide chaud se refroidit et le fluide froid se réchauffe : leurs températures se rapprochent. Comme l’écart n’est pas constant, il faudra un écart de température moyen pour calculer la puissance échangée.' } },
    { id: 'QmF', titre: 'Le débit massique de l’eau froide', focus: ['releve'],
      texte: <>Pour calculer une puissance thermique, il faut le débit <strong>massique</strong> en kg·s⁻¹. Pour l’eau, 1 L a une masse de 1,00 kg.</>,
      tache: { type: 'num', q: 'Débit massique Q_mF de l’eau froide', unite: 'kg·s⁻¹', vrai: A.QmF, tol: 0.02, affiche: x => nf(x),
        pieges: [[G.QvF, 'C’est le débit en kg·h⁻¹ : il faut des kg·s⁻¹ (1 h = 3 600 s).'], [G.QvF / 60, '1 h = 3 600 s, et non 60 s.']],
        expl: `Q_mF = 100 kg·h⁻¹ / 3 600 s·h⁻¹ = ${nf(A.QmF)} kg·s⁻¹.` } },
    { id: 'PF', titre: 'La puissance reçue par l’eau froide', focus: ['releve'],
      texte: <>Lisez T<Sub c="FE"/> et T<Sub c="FS"/> dans le relevé. L’eau froide reçoit la puissance P<Sub c="F"/> = Q<Sub c="mF"/> · C · (T<Sub c="FS"/> − T<Sub c="FE"/>), avec C = 4 180 J·kg⁻¹·K⁻¹.</>,
      tache: { type: 'num', q: 'Puissance P_F reçue par l’eau froide', unite: 'W', vrai: A.PF, tol: 0.02, affiche: x => nf(x),
        pieges: [[A.QmF * C_EAU * A.TFS, 'Il faut la variation de température T_FS − T_FE, pas T_FS seule.'], [G.QvF * C_EAU * (A.TFS - G.TFE), 'Le débit doit être en kg·s⁻¹ (et non en L·h⁻¹).']],
        expl: `P_F = ${nf(A.QmF)} × 4 180 × (${t1(A.TFS)} − ${G.TFE}) ≈ ${nf(A.PF)} W : positive, car l’eau froide reçoit de l’énergie.` } },
    { id: 'PC', titre: 'La puissance du fluide chaud', focus: ['releve'],
      texte: <>Même calcul pour le fluide chaud : P<Sub c="C"/> = Q<Sub c="mC"/> · C · (T<Sub c="CS"/> − T<Sub c="CE"/>), avec Q<Sub c="vC"/> = {G.QvC} L·h⁻¹. Attention au <strong>signe</strong> (principe du banquier : ce qui sort du système est compté négativement).</>,
      tache: { type: 'num', q: 'Puissance P_C du fluide chaud (avec son signe)', unite: 'W', vrai: A.PC, tol: 0.02, affiche: x => nf(x),
        pieges: [[-A.PC, 'Le fluide chaud cède de l’énergie : T_CS < T_CE, donc P_C = Q_mC·C·(T_CS − T_CE) est négative.']],
        expl: `P_C = ${nf(A.QmC)} × 4 180 × (${t1(A.TCS)} − ${G.TCE}) ≈ ${nf(A.PC)} W : négative, car le fluide chaud cède de l’énergie.` } },
    { id: 'bilan', titre: 'Le bilan de l’échangeur', focus: ['hypo'],
      texte: <>Comparez la valeur absolue de P<Sub c="C"/> à P<Sub c="F"/>.</>,
      tache: { type: 'qcm', q: 'On trouve |P_C| ≈ P_F. Pourquoi ?', options: ['On suppose qu’il n’y a pas de pertes vers l’extérieur : tout ce que cède le fluide chaud est reçu par le fluide froid', 'Parce que les deux débits sont égaux', 'Parce que les deux fluides sortent à la même température'], bonne: 0,
        expl: 'C’est l’hypothèse du cours : |P_C| = P_F = P_trans. Ici, le petit écart vient seulement de l’arrondi des températures au 0,1 °C. En TP, l’écart est plus grand (pertes vers l’air, incertitudes des sondes et des débitmètres).' } },
    { id: 'dT2', titre: 'Les écarts aux deux extrémités', focus: ['graphe'],
      texte: <>On note ΔT<Sub c="1"/> et ΔT<Sub c="2"/> les écarts entre les deux fluides aux deux extrémités. À gauche, ΔT<Sub c="1"/> = T<Sub c="CE"/> − T<Sub c="FE"/> = {G.TCE} − {G.TFE} = {A.d1} °C. À droite, quelles températures se font face ?</>,
      tache: { type: 'num', q: 'Écart ΔT_2 à droite', unite: '°C', vrai: A.d2, tol: 0.03, affiche: x => t1(x),
        pieges: [[r1(A.TFS - G.TFE), 'C’est l’échauffement de l’eau froide. ΔT_2 est l’écart entre les deux fluides à la même extrémité.'], [r1(G.TCE - A.TCS), 'C’est le refroidissement du fluide chaud. ΔT_2 est l’écart entre les deux fluides à la même extrémité.']],
        expl: `À droite, sortent le fluide chaud et l’eau froide : ΔT_2 = T_CS − T_FS = ${t1(A.TCS)} − ${t1(A.TFS)} = ${t1(A.d2)} °C.` } },
    { id: 'dTm', titre: 'L’écart de température moyen', focus: ['graphe'],
      texte: <>L’écart varie beaucoup le long de l’échangeur. La bonne moyenne est la <strong>moyenne logarithmique</strong> (relation fournie) : ΔT<Sub c="m"/> = (ΔT<Sub c="1"/> − ΔT<Sub c="2"/>) / ln(ΔT<Sub c="1"/> / ΔT<Sub c="2"/>).</>,
      tache: { type: 'num', q: 'Écart de température moyen ΔT_m', unite: '°C', vrai: A.dTm, tol: 0.02, affiche: x => nf(x),
        aide: 'ln est le logarithme népérien (touche « ln » de la calculatrice).',
        pieges: [[(A.d1 + A.d2) / 2, 'C’est la moyenne arithmétique. Utilisez la relation du cours : (ΔT_1 − ΔT_2) / ln(ΔT_1 / ΔT_2).'], [(A.d1 - A.d2) / Math.log10(A.d1 / A.d2), 'Vous avez utilisé log (logarithme décimal) : il faut ln (logarithme népérien).']],
        expl: `ΔT_m = (${A.d1} − ${t1(A.d2)}) / ln(${A.d1} / ${t1(A.d2)}) ≈ ${nf(A.dTm)} °C, bien moins que la moyenne arithmétique (${nf((A.d1 + A.d2) / 2)} °C) : une grande partie de l’échangeur travaille avec un petit écart.` } },
    { id: 'S', titre: 'La surface d’échange', focus: ['releve'],
      texte: <>L’échange se fait à travers la paroi latérale du tube intérieur : un cylindre de diamètre D et de longueur L, de surface S = π · D · L.</>,
      tache: { type: 'num', q: 'Surface d’échange S', unite: 'm²', vrai: A.S, tol: 0.02, affiche: x => nf(x),
        pieges: [[Math.PI * G.D * G.L, 'D est en mm : convertissez-le en m (20 mm = 0,020 m).'], [Math.PI * G.D / 2000 * G.L, 'S = π·D·L avec le diamètre, pas le rayon.'], [Math.PI * (G.D / 1000) ** 2 / 4, 'C’est la section du tube (π·D²/4), où circule le fluide. La surface d’échange est la paroi latérale : π·D·L.']],
        expl: `S = π × 0,020 m × 3,0 m ≈ ${nf(A.S)} m².` } },
    { id: 'U', titre: 'Estimer le coefficient global d’échange', focus: ['releve'],
      texte: <>Comme en TP, on admet que la puissance transférée dans l’échangeur est P<Sub c="F"/>. La relation du cours est P = U · S · ΔT<Sub c="m"/>. Déduisez-en U, qui caractérise l’efficacité des échanges à travers la paroi.</>,
      tache: { type: 'num', q: 'Coefficient global d’échange U', unite: 'W·m⁻²·K⁻¹', vrai: A.U, tol: 0.03, affiche: x => nf(x),
        pieges: [[A.PF * A.S / A.dTm, 'U = P / (S·ΔT_m) : on divise P par le produit S·ΔT_m.'], [A.PF / (A.S * (A.d1 + A.d2) / 2), 'Il faut ΔT_m (moyenne logarithmique), pas la moyenne arithmétique.']],
        expl: `U = ${nf(A.PF)} / (${nf(A.S)} × ${nf(A.dTm)}) ≈ ${nf(A.U)} W·m⁻²·K⁻¹. La simulation était réglée sur U = ${G.U} W·m⁻²·K⁻¹ : l’écart vient de l’arrondi des températures.` } },
    { id: 'contre', titre: 'Passer à contre-courant', focus: ['schema'],
      texte: <>On garde le même échangeur, les mêmes débits et les mêmes températures d’entrée. On inverse seulement le branchement de l’eau froide : elle entre maintenant à droite.</>,
      tache: { type: 'action', ok: rg.contre, label: 'Brancher l’eau froide à contre-courant', faire: () => setRg(x => ({ ...x, contre: true })),
        consigne: rg.contre ? null : 'Cliquez pour inverser le sens de l’eau froide' } },
    { id: 'croise', titre: 'Un résultat surprenant', focus: ['releve', 'graphe'],
      texte: <>Comparez dans le relevé la température de sortie de l’eau froide T<Sub c="FS"/> et celle du fluide chaud T<Sub c="CS"/>.</>,
      tache: { type: 'qcm', q: 'Que remarquez-vous ?', options: ['T_FS est supérieure à T_CS : l’eau froide sort plus chaude que le fluide chaud', 'T_FS est toujours inférieure à T_CS', 'T_FS est supérieure à T_CE'], bonne: 0,
        expl: 'À contre-courant, l’eau froide qui sort (à gauche) est au contact du fluide chaud qui entre, encore très chaud : elle peut donc sortir plus chaude que le fluide chaud ne sort. C’est impossible à co-courant, où les deux températures se rapprochent sans se croiser. Mais T_FS reste toujours inférieure à T_CE.' } },
    { id: 'dTmc', titre: 'L’écart moyen à contre-courant', focus: ['graphe'],
      texte: <>Attention : à contre-courant, ce ne sont plus les mêmes températures qui se font face. À gauche, ΔT<Sub c="1"/> = T<Sub c="CE"/> − T<Sub c="FS"/> ; à droite, ΔT<Sub c="2"/> = T<Sub c="CS"/> − T<Sub c="FE"/>. Calculez ΔT<Sub c="m"/> avec les nouvelles valeurs du relevé.</>,
      tache: { type: 'num', q: 'Écart de température moyen ΔT_m à contre-courant', unite: '°C', vrai: A.dTmc, tol: 0.02, affiche: x => nf(x),
        pieges: [[lmtd(G.TCE - G.TFE, r1(A.TCSc - A.TFSc)), 'Vous avez associé les températures comme à co-courant. Ici, l’entrée de l’un fait face à la sortie de l’autre : ΔT_1 = T_CE − T_FS et ΔT_2 = T_CS − T_FE.'], [(A.d1c + A.d2c) / 2, 'C’est la moyenne arithmétique : utilisez la moyenne logarithmique.']],
        expl: `ΔT_1 = ${G.TCE} − ${t1(A.TFSc)} = ${t1(A.d1c)} °C et ΔT_2 = ${t1(A.TCSc)} − ${G.TFE} = ${t1(A.d2c)} °C, donc ΔT_m ≈ ${nf(A.dTmc)} °C (contre ${nf(A.dTm)} °C à co-courant).` } },
    { id: 'P2', titre: 'Quel mode est le plus efficace ?', focus: ['graphe'],
      texte: <>Même échangeur (même U, même S), mêmes débits, mêmes températures d’entrée : seul le sens de l’eau froide a changé.</>,
      tache: { type: 'qcm', q: 'À contre-courant, la puissance transférée P = U · S · ΔT_m est…', options: ['plus grande, parce que ΔT_m est plus grand', 'plus grande, parce que U est plus grand', 'la même qu’à co-courant'], bonne: 0,
        expl: `P passe d’environ ${nf(A.Pco, 2)} W à ${nf(A.Pc, 2)} W. En première approximation, U ne change pas : à débits fixés, il dépend de la paroi et des films de liquide de chaque côté, pas du sens de circulation (en pratique, il peut différer de quelques % car les propriétés de l’eau varient avec la température). C’est ΔT_m qui augmente, car à contre-courant l’écart entre les fluides reste plus régulier tout le long. Pour comparer les deux modes en TP, comparez donc P (ou T_FS) à mêmes débits et mêmes températures d’entrée, plutôt que U : avec les incertitudes de mesure, des valeurs de U voisines ou différentes ne prouvent rien.` } },
    { id: 'bain', titre: 'Un côté chaud à température constante', focus: ['schema'],
      texte: <>Remplaçons le fluide chaud par un milieu à <strong>température constante</strong> : un bain bien agité à {G.TCE} °C (comme le serpentin du cours), ou de la vapeur d’eau qui se condense (elle reste à 100 °C sous 1 bar tant qu’elle se condense).</>,
      tache: { type: 'action', ok: rg.cst, label: `Remplacer le fluide chaud par un bain à ${G.TCE} °C`, faire: () => setRg(x => ({ ...x, cst: true, gm: 'contre' })),
        consigne: rg.cst ? null : 'Cliquez pour placer le bain' } },
    { id: 'bainMode', titre: 'Co-courant ou contre-courant ?', focus: ['mode', 'graphe'],
      texte: <>Avec les boutons au-dessus du schéma, passez plusieurs fois de contre-courant à co-courant et regardez le graphique et le relevé.</>,
      tache: { type: 'qcm', q: 'Que constatez-vous ?', options: ['Les profils et la température de sortie de l’eau froide sont les mêmes dans les deux modes', 'Le contre-courant reste plus efficace', 'Le co-courant devient plus efficace'], bonne: 0,
        expl: 'La température du côté chaud est la même partout : peu importe par où entre l’eau froide, elle « voit » toujours la même température. Avec changement d’état (vapeur qui se condense) ou avec un bain, les deux modes sont équivalents.' } },
    { id: 'hypo', titre: 'Sur quoi repose ce modèle ?', focus: ['hypo'],
      texte: <>Ouvrez l’encadré « Hypothèses de travail » sous la simulation.</>,
      tache: { type: 'qcm', q: 'Quelle hypothèse de la simulation n’est PAS exactement vérifiée en TP ?', options: ['L’absence de pertes thermiques : en TP, |P_C| et P_F ne sont pas tout à fait égales', 'Le fait que l’énergie passe du fluide chaud au fluide froid', 'La conservation du débit d’eau entre l’entrée et la sortie'], bonne: 0,
        expl: 'Une partie de l’énergie s’échange avec l’air de la salle, et les sondes et débitmètres ont leurs incertitudes. Autre simplification à retenir : dans la simulation, U ne dépend pas des débits, alors qu’en réalité il augmente avec eux.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous savez faire le bilan d’un échangeur (P<Sub c="C"/> &lt; 0, P<Sub c="F"/> &gt; 0, |P<Sub c="C"/>| = P<Sub c="F"/>), calculer ΔT<Sub c="m"/> et S = π·D·L, estimer U, et reconnaître le co-courant et le contre-courant d’après les profils. En exploration libre, chargez « Échangeur coaxial du TP » pour retrouver vos mesures, puis passez au défi.</>, tache: null },
  ];
  const et = ETAPES[Math.min(etape, ETAPES.length - 1)];
  const hl = id => mode === 'guide' && et.focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});
  const vu = id => etape >= iEt(id);                              // éléments qui apparaissent au fil du parcours

  // ════════════════ VUE (partagée exploration / parcours) ════════════════
  const enGuide = mode === 'guide';
  const rv = enGuide ? rGuide : r;
  const pv = paramsDe(rv), sol = modele(pv);
  const autre = !enGuide && opt.autre ? modele({ ...pv, mode: pv.mode === 'co' ? 'contre' : 'co' }) : null;
  const enMarche = enGuide ? gEnMarche : true;
  const boutonsSens = (val, set) => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => set('co')} style={stylePetitBouton(val === 'co', '#0f766e')}>⇉ Co-courant</button>
      <button onClick={() => set('contre')} style={stylePetitBouton(val === 'contre', '#0f766e')}>⇄ Contre-courant</button>
    </div>);

  const vue = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...styleBoite, ...cadre('schema') }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: KIT.txt }}>L’échangeur coaxial</div>
          {!enGuide && boutonsSens(r.mode, m => maj({ mode: m }))}
          {enGuide && vu('bainMode') && rg.cst && <div style={cadre('mode')}>{boutonsSens(rg.gm, m => setRg(x => ({ ...x, gm: m })))}</div>}
        </div>
        <Schema p={pv} sol={sol} chaud={rv.chaud} fleches={enGuide || opt.fleches} enMarche={enMarche}/>
      </div>
      <div style={{ ...styleBoite, ...cadre('releve') }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: KIT.txt, marginBottom: 6 }}>Relevé en régime stationnaire</div>
        <Releve p={pv} sol={sol} chaud={rv.chaud} enMarche={enMarche} fleches={enGuide ? vu('profils') : opt.fleches}/>
      </div>
      {(!enGuide || vu('profils')) && (
        <div style={{ ...styleBoite, ...cadre('graphe') }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: KIT.txt, marginBottom: 6 }}>Profils de température le long de l’échangeur</div>
          <Graphe p={pv} sol={sol} fleches={enGuide || opt.fleches} autre={autre} dT={enGuide ? vu('dT2') : opt.dT} enMarche={enMarche}/>
        </div>
      )}
    </div>
  );

  // ════════════════ EXPLORATION : réglages ════════════════
  const lab = { fontSize: 12.5, color: KIT.txt2, fontWeight: 700 };
  const sel = { fontSize: 13.5, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, background: 'white', color: KIT.txt };
  const caseOpt = (k, txt) => (
    <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13.5, color: KIT.txt, cursor: 'pointer' }}>
      <input type="checkbox" checked={opt[k]} onChange={e => setOpt(o => ({ ...o, [k]: e.target.checked }))}/>{txt}
    </label>);
  const reglages = (
    <div style={styleBoite}>
      <div style={{ fontWeight: 700, fontSize: 14, color: KIT.txt, marginBottom: 8 }}>Réglages</div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={lab}>Situation</span>
          <select value={preset} onChange={e => choisirPreset(e.target.value)} style={sel} aria-label="Situation prédéfinie">
            {preset === '' && <option value="">(réglage personnel)</option>}
            {Object.entries(PRESETS).map(([k, v]) => <option key={k} value={k}>{v.nom}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={lab}>Côté chaud</span>
          <select value={r.chaud} onChange={e => maj({ chaud: e.target.value })} style={sel} aria-label="Nature du côté chaud">
            <option value="circule">Eau chaude qui circule</option>
            <option value="bain">Bain à température constante</option>
            <option value="vapeur">Vapeur d’eau qui se condense (100 °C)</option>
          </select>
        </label>
      </div>
      {PRESETS[preset] && PRESETS[preset].note && <div style={{ fontSize: 12.5, color: KIT.txt2, marginBottom: 8 }}>{PRESETS[preset].note}</div>}
      <div className="ech-curseurs">
        {r.chaud !== 'vapeur' && <Curseur nom={r.chaud === 'bain' ? 'Température du bain' : 'Entrée du fluide chaud T_CE'} valeur={r.TCE} onChange={v => maj({ TCE: v })} min={30} max={95} pas={0.5} unite="°C" decimales={1} couleur={ROUGE}/>}
        <Curseur nom="Entrée de l’eau froide T_FE" valeur={r.TFE} onChange={v => maj({ TFE: v })} min={5} max={30} pas={0.5} unite="°C" decimales={1} couleur={BLEU}/>
        {r.chaud === 'circule' && <Curseur nom="Débit volumique du fluide chaud Q_vC" valeur={r.QvC} onChange={v => maj({ QvC: v })} min={20} max={400} pas={5} unite="L·h⁻¹" couleur={ROUGE}/>}
        <Curseur nom="Débit volumique de l’eau froide Q_vF" valeur={r.QvF} onChange={v => maj({ QvF: v })} min={20} max={400} pas={5} unite="L·h⁻¹" couleur={BLEU}/>
        <Curseur nom="Coefficient global U" valeur={r.U} onChange={v => maj({ U: v })} min={100} max={5000} pas={50} unite="W·m⁻²·K⁻¹" couleur="#7e22ce"/>
        <Curseur nom="Longueur du tube L" valeur={r.L} onChange={v => maj({ L: v })} min={0.2} max={6} pas={0.01} unite="m" decimales={2} couleur="#334155"/>
        <Curseur nom="Diamètre du tube intérieur D" valeur={r.D} onChange={v => maj({ D: v })} min={8} max={40} pas={0.5} unite="mm" decimales={1} couleur="#334155"/>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
        {caseOpt('dT', 'Afficher ΔT₁ et ΔT₂')}
        {caseOpt('autre', 'Comparer avec l’autre mode (pointillés)')}
        {caseOpt('fleches', 'Afficher le sens de circulation')}
      </div>
      {!opt.fleches && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Entraînement : sans les flèches, retrouvez le mode d’après les profils, puis réaffichez-les pour vérifier.</div>}
    </div>
  );

  // ════════════════ DÉFI ════════════════
  function nouveauDefi(t = typeDefi) { setDefi(tirageDefi(t)); }
  function changerMode(m) {
    setMode(m);
    if (m === 'defi' && !defi) nouveauDefi();
    setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
  }
  const voletDefi = defi && (() => {
    const Q = questionsDefi(defi), { p } = defi;
    const s = modele(p);
    const juste = q => (q.choix ? defi.reps[q.id] === q.bonne : proche(lireNombre(defi.reps[q.id]), q.vrai, q.tol));
    const setRep = (id, v) => setDefi(df => ({ ...df, verifie: false, reps: { ...df.reps, [id]: v } }));
    const nbJustes = Q.filter(juste).length;
    const P = Number(s && (qm(p.QvF) * C_EAU * (defi.TFS - p.TFE)).toPrecision(3));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => { setTypeDefi('U'); nouveauDefi('U'); }} style={stylePetitBouton(defi.type === 'U', '#0ea5e9')}>Estimer U (comme en TP)</button>
          <button onClick={() => { setTypeDefi('dim'); nouveauDefi('dim'); }} style={stylePetitBouton(defi.type === 'dim', '#0ea5e9')}>Dimensionner un échangeur</button>
        </div>
        {defi.type === 'U' ? <>
          <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>
            Voici le relevé d’un échangeur coaxial en régime stationnaire (eau des deux côtés) et les profils de température mesurés le long du tube.
            Le sens de circulation n’est pas indiqué.
          </div>
          <Releve p={p} sol={{ TCS: defi.TCS, TFS: defi.TFS }} chaud="circule" fleches={false}/>
          <Graphe p={p} sol={s} fleches={false}/>
        </> : (
          <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>
            On veut refroidir un liquide chaud de <strong>{p.TCE} °C</strong> à <strong>{t1(defi.TCS)} °C</strong> avec de l’eau qui entre à <strong>{p.TFE} °C</strong> et ressort à <strong>{t1(defi.TFS)} °C</strong>,
            dans un échangeur à <strong>{p.mode === 'co' ? 'co-courant' : 'contre-courant'}</strong>.
            La puissance thermique à transférer est <strong>P = {nf(P / 1000)} kW</strong> et le coefficient global d’échange vaut <strong>U = {p.U} W·m⁻²·K⁻¹</strong>.
          </div>
        )}
        <div style={{ fontSize: 13, color: KIT.txt2 }}>Données : C<Sub c="eau"/> = 4 180 J·kg⁻¹·K⁻¹ ; 1 L d’eau a une masse de 1,00 kg ; S = π·D·L ; P = U·S·ΔT<Sub c="m"/> ; ΔT<Sub c="m"/> = (ΔT<Sub c="1"/> − ΔT<Sub c="2"/>) / ln(ΔT<Sub c="1"/> / ΔT<Sub c="2"/>). Notation possible : 1,2e-3.</div>
        {Q.map((q, k) => {
          const ok = juste(q);
          return (
            <div key={q.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {q.q}</div>
              {q.choix ? (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {q.choix.map((c, i) => <button key={c} onClick={() => setRep(q.id, i)} style={stylePetitBouton(defi.reps[q.id] === i, '#0ea5e9')}>{c}</button>)}
                  {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input value={defi.reps[q.id] || ''} placeholder="?" aria-label={`Réponse au défi ${k + 1}`} onChange={e => setRep(q.id, e.target.value)}
                    style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 130 }}/>
                  <span style={{ fontSize: 14, color: KIT.txt2 }}>{q.u}</span>
                  {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
                </div>
              )}
              {defi.verifie && (
                <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 3 }}>
                  {q.choix ? <>Réponse attendue : <strong>{q.choix[q.bonne]}</strong>. {indicesProfond(q.expl)}</>
                    : <>Réponse attendue : <strong>{nf(q.vrai)} {q.u}</strong> — {indicesProfond(q.detail)}</>}
                </div>
              )}
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => setDefi(df => ({ ...df, verifie: true }))} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
          <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}>🔄 Nouvelles données</button>
          {defi.verifie && <span style={{ fontSize: 14, fontWeight: 700, color: KIT.txt }}>{nbJustes} / {Q.length} réponses justes</span>}
        </div>
        <div style={{ fontSize: 12.5, color: KIT.txt2 }}>Les réponses sont acceptées à 2 % près (3 % pour U) : les températures sont arrondies au 0,1 °C.</div>
      </div>
    );
  })();

  // ════════════════ HYPOTHÈSES ════════════════
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Régime stationnaire</strong> : débits et températures ne varient plus au cours du temps (en TP, on attend que les quatre températures soient stables).</li>
      <li><strong>Pas de pertes thermiques</strong> vers l’extérieur : toute la puissance cédée par le fluide chaud est reçue par le froid, |P<Sub c="C"/>| = P<Sub c="F"/> = P<Sub c="trans"/>. En TP ce n’est pas exact (échanges avec l’air, incertitudes des sondes et des débitmètres).</li>
      <li><strong>U constant</strong> tout le long du tube, et <strong>fixé par l’utilisateur</strong>. En réalité, U dépend du matériau et de l’épaisseur de la paroi, de l’encrassement et des débits (il augmente quand le débit augmente). Dans la simulation, changer un débit ne change pas U : c’est un choix de modèle, pas la réalité. De même, U y est identique à co- et à contre-courant : c’est vrai en première approximation, à débits fixés ; en pratique il peut différer de quelques % (les propriétés de l’eau varient avec la température).</li>
      <li><strong>Eau liquide des deux côtés</strong>, de capacité thermique massique C = 4 180 J·kg⁻¹·K⁻¹ et de masse volumique 1,00 kg·L⁻¹, considérées constantes (valeurs du TP).</li>
      <li><strong>Surface d’échange S = π·D·L</strong> avec D le diamètre du tube intérieur : on néglige l’épaisseur de la paroi (avec le diamètre extérieur, S serait un peu plus grande).</li>
      <li><strong>Côté chaud à température constante</strong> (option) : bain très bien agité, ou vapeur d’eau qui se condense à 100 °C (sous 1,013 bar) ; dans ce cas, la puissance vient du changement d’état et le débit de vapeur condensée vaut P / L<Sub c="v"/>, avec L<Sub c="v"/> = 2 257 kJ·kg⁻¹.</li>
      <li><strong>Profils calculés exactement</strong> à partir du bilan d’énergie sur chaque tranche du tube : avec ces hypothèses, ce sont des exponentielles, et P = U·S·ΔT<Sub c="m"/> avec la moyenne logarithmique est exacte (c’est la relation fournie au programme). Les températures affichées sont arrondies au 0,1 °C.</li>
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
        .ech-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ech-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ech-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
        .ech-curseurs { display: grid; gap: 0 18px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
        @media (max-width: 960px) { .ech-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Échangeur thermique : co-courant et contre-courant</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div className={`ech-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {mode === 'defi' ? <div style={styleBoite}>{voletDefi}</div> : vue}
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : mode === 'defi' ? <div style={styleBoite}><div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Hypothèses de travail</div>{hypotheses}</div>
            : null}
      </div>
      {mode === 'explore' && <>
        <div style={{ marginBottom: 12 }}>{reglages}</div>
        <div style={{ ...styleBoite, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: KIT.txt, marginBottom: 6 }}>Bilan et calculs</div>
          <Calculs p={pv} sol={sol} chaud={r.chaud}/>
          {autre && <div style={{ fontSize: 14, color: KIT.txt, marginTop: 6 }}>Même échangeur à {pv.mode === 'co' ? 'contre-courant' : 'co-courant'} : P = <strong>{nf(autre.PF)} W</strong>, T<Sub c="FS"/> = {t1(autre.TFS)} °C.</div>}
        </div>
        <div className="ech-l2">
          <div style={styleBoite}>
            <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
              <li>Cochez « Comparer avec l’autre mode » : lequel transfère le plus de puissance ? Pourquoi, alors que U et S sont les mêmes ?</li>
              <li>À contre-courant, cherchez un réglage où T<Sub c="FS"/> dépasse T<Sub c="CS"/>. Est-ce possible à co-courant ?</li>
              <li>Allongez beaucoup le tube : vers quelle température tend la sortie de l’eau froide, dans chaque mode ?</li>
              <li>Chargez « Échangeur coaxial du TP » : pourquoi les deux modes y donnent-ils presque la même puissance ?</li>
              <li>Choisissez « Vapeur qui se condense » : le sens de circulation a-t-il encore une importance ?</li>
              <li>Décochez « Afficher le sens de circulation » et entraînez-vous à reconnaître le mode d’après les profils.</li>
            </ul>
          </div>
          {panneauHypo}
        </div>
      </>}
      {mode === 'guide' && panneauHypo}
    </div>
  );
}
const ETAPES_IDS = ['intro', 'go', 'sens', 'profils', 'QmF', 'PF', 'PC', 'bilan', 'dT2', 'dTm', 'S', 'U', 'contre', 'croise', 'dTmc', 'P2', 'bain', 'bainMode', 'hypo', 'bravo'];
