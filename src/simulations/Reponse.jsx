import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, Curseur, indicesProfond, lireNombre, proche } from "../commun";

// ====================================================
//  SIM 33 — TEMPS DE RÉPONSE D'UN CAPTEUR : ÉCHELON, BANDE À 5 %, t_R = 3τ, SYSTÈME QUI OSCILLE
// ====================================================

// ── Modèle (fonctions pures) ──
// Échelon : à l'instant t0 la grandeur mesurée passe brusquement de la valeur ini à la valeur fin (grandeur d'entrée idéale).
// • Système du 1er ordre : y(t) = fin − (fin − ini)·exp(−(t − t0)/τ). Temps de réponse à 5 % : t_R = τ·ln 20 = 2,996·τ ≈ 3τ.
// • Système du 2nd ordre sous-amorti (ζ < 1) : y = ini + (fin − ini)·[1 − e^(−ζω0·u)·(cos ωd·u + ζ/√(1−ζ²)·sin ωd·u)], u = t − t0, ωd = ω0·√(1−ζ²).
//   Dépassement relatif D = exp(−πζ/√(1−ζ²)) (atteint à u = π/ωd) ; pseudo-période T = 2π/ωd.
// • Temps de réponse à 5 % (définition du TP) : intervalle de temps, compté depuis t0, au bout duquel la grandeur ne diffère plus de sa valeur finale
//   de plus de 5 % de |fin − ini|. Pour un système qui oscille, c'est la DERNIÈRE sortie de la bande ±5 %. Calculé numériquement (courbe sans bruit).
export const mulberry32 = a => () => {
  a |= 0; a = (a + 0x6D2B79F5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export function reponse(s, t) {
  if (t < s.t0) return s.ini;
  const u = t - s.t0, D = s.fin - s.ini;
  if (s.ordre === 1) return s.fin - D * Math.exp(-u / s.tau);
  const z = s.zeta, w0 = s.w0, k = Math.sqrt(1 - z * z), wd = w0 * k;
  return s.ini + D * (1 - Math.exp(-z * w0 * u) * (Math.cos(wd * u) + (z / k) * Math.sin(wd * u)));
}

export function analyse(s) {
  const D = s.fin - s.ini, aD = Math.abs(D), seuil = 0.05 * aD;
  const tauEff = s.ordre === 1 ? s.tau : 1 / (s.zeta * s.w0);
  const N = 40000, dt = (14 * tauEff) / N;
  let dernier = 0, premier = -1;
  for (let i = 0; i <= N; i++) {
    const e = Math.abs(reponse(s, s.t0 + i * dt) - s.fin);
    if (e > seuil) dernier = i; else if (premier < 0) premier = i;
  }
  let lo = dernier * dt, hi = (dernier + 1) * dt;
  for (let k = 0; k < 40; k++) {
    const m = (lo + hi) / 2;
    if (Math.abs(reponse(s, s.t0 + m) - s.fin) > seuil) lo = m; else hi = m;
  }
  const tR = s.ordre === 1 ? s.tau * Math.log(20) : (lo + hi) / 2;
  const r = { D, aD, seuil, tauEff, tR, t1: s.t0 + tR, tEntree: premier * dt, depass: 0, ymax: s.fin, tpic: 0, T: 0 };
  if (s.ordre === 2) {
    const k = Math.sqrt(1 - s.zeta * s.zeta), wd = s.w0 * k;
    r.depass = Math.exp(-Math.PI * s.zeta / k);
    r.ymax = s.fin + D * r.depass;
    r.tpic = Math.PI / wd;
    r.T = 2 * Math.PI / wd;
  }
  return r;
}

// Nuage de points « mesurés » : courbe exacte + bruit uniforme reproductible (bruit en % de |fin − ini|)
export function mesures(s, bruit, tmax, N = 320) {
  const rnd = mulberry32(s.seed || 11), amp = (bruit / 100) * Math.abs(s.fin - s.ini) * Math.sqrt(3);
  return Array.from({ length: N + 1 }, (_, i) => { const t = (tmax * i) / N; return { t, y: reponse(s, t) + (rnd() * 2 - 1) * amp }; });
}

function pasJoli(e) { const p = 10 ** Math.floor(Math.log10(e)), n = e / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
export function fenetre(s, an) {
  const raw = s.t0 + 2.6 * an.tR, st = pasJoli(raw / 7);
  return Math.ceil(raw / st - 1e-9) * st;
}

// ── Mise en forme ──
const nf = (x, n = 3) => (isFinite(x) ? Number(x).toLocaleString('fr-FR', { maximumSignificantDigits: n }) : '—');
const dec = (x, d) => Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const Sub = ({ c }) => <sub>{c}</sub>;
const decimalesDe = pas => Math.max(0, Math.ceil(-Math.log10(pas) - 1e-9));
const etaler = (ys, ecart) => {                                                 // écarte des étiquettes trop proches (ordre vertical conservé)
  const idx = ys.map((y, i) => i).sort((a, b) => ys[a] - ys[b]), out = ys.slice();
  for (let k = 1; k < idx.length; k++) { const a = idx[k - 1], b = idx[k]; if (out[b] - out[a] < ecart) out[b] = out[a] + ecart; }
  return out;
};

// ── Situations ──
export const CTX = {
  ctn:   { nom: 'Sonde CTN plongée dans l’eau froide (TP bouilloire)', ordre: 1, y: 'V', grand: 'Tension', yU: 'V', tU: 's', ini: 4.38, fin: 2.08, t0: 10, tau: 1.66 },
  pt100: { nom: 'Sonde Pt100 gainée inox plongée dans l’eau chaude', ordre: 1, y: 'θ', grand: 'Température lue', yU: '°C', tU: 's', ini: 20, fin: 90, t0: 5, tau: 5.926 },
  bain:  { nom: 'Bain thermostaté mal réglé : la température oscille (modèle illustratif)', ordre: 2, y: 'θ', grand: 'Température', yU: '°C', tU: 's', ini: 20, fin: 60, t0: 30, zeta: 0.25, w0: 0.05 },
  bainOk: { nom: 'Bain thermostaté bien réglé : pas d’oscillation marquée (modèle illustratif)', ordre: 2, y: 'θ', grand: 'Température', yU: '°C', tU: 's', ini: 20, fin: 60, t0: 30, zeta: 0.7, w0: 0.05 },
  rlc:   { nom: 'Circuit RLC série : tension aux bornes du condensateur après un échelon de tension', ordre: 2, y: 'u', grand: 'Tension', yU: 'V', tU: 'ms', ini: 0, fin: 5, t0: 1, zeta: 0.2, w0: 4 },
};
function paramsDe(k) {
  const x = CTX[k];
  return { ordre: x.ordre, ini: x.ini, fin: x.fin, t0: x.t0, seed: 7,
    tau: x.ordre === 1 ? x.tau : 1 / (x.zeta * x.w0), zeta: x.ordre === 2 ? x.zeta : 0.3, w0: x.ordre === 2 ? x.w0 : 2 / x.tau };
}
const CTN = { ...paramsDe('ctn'), seed: 3 };
const BAIN = { ...paramsDe('bain'), seed: 5 };
const BRUIT_GUIDE = 0.4;

// ════════════════ GRAPHE ════════════════
const W = 760, H = 380, ML = 66, MR = 128, MT = 16, MB = 50;
const C_PTS = '#2563eb', C_INI = '#64748b', C_FIN = '#b91c1c', C_BANDE = '#16a34a', C_TR = '#dc2626', C_MOD = '#ea580c';
function Lab({ x, y, pre, sub, post, fill, anchor = 'start', size = 12, bold }) {
  return <text x={x} y={y} fontSize={size} fill={fill} textAnchor={anchor} fontWeight={bold ? 700 : 400}>{pre}{sub && <tspan dy="3" fontSize={size - 3}>{sub}</tspan>}{post && <tspan dy={sub ? -3 : 0}>{post}</tspan>}</text>;
}
// c : calques {niveaux, delta, bande, t0, tR, entree, modele (τ ou null)} ; ctx : {y, grand, yU, tU}
function Graphe({ s, an, bruit, c = {}, ctx }) {
  const [cur, setCur] = useState(null);
  const tmax = fenetre(s, an), N = 320, pts = mesures(s, bruit, tmax, N);
  const vals = [s.ini, s.fin, an.ymax], amp = (bruit / 100) * an.aD * Math.sqrt(3);
  let lo = Math.min(...vals) - amp, hi = Math.max(...vals) + amp;
  const pad = 0.1 * (hi - lo), sy = pasJoli((hi - lo + 2 * pad) / 6);
  lo = Math.floor((lo - pad) / sy + 1e-9) * sy; hi = Math.ceil((hi + pad) / sy - 1e-9) * sy;
  const sx = pasJoli(tmax / 7), dy = decimalesDe(sy), dx = decimalesDe(sx);
  const px = t => ML + (t / tmax) * (W - ML - MR), py = y => H - MB - ((y - lo) / (hi - lo)) * (H - MT - MB);
  const yt = [], xt = [];
  for (let v = lo; v <= hi + sy * 1e-6; v += sy) yt.push(Math.round(v / sy) * sy);
  for (let v = 0; v <= tmax + sx * 1e-6; v += sx) xt.push(Math.round(v / sx) * sx);
  const sgn = s.ini > s.fin ? 1 : -1, yBande = s.fin + sgn * an.seuil;
  const mod = c.modele ? { ordre: 1, ini: s.ini, fin: s.fin, t0: s.t0, tau: c.modele } : null;
  const chemin = mod ? Array.from({ length: 201 }, (_, i) => { const t = (tmax * i) / 200; return `${i ? 'L' : 'M'}${px(t).toFixed(1)},${py(reponse(mod, t)).toFixed(1)}`; }).join(' ') : '';
  // étiquettes de droite
  const eti = [];
  if (c.niveaux) { eti.push({ y: py(s.ini), pre: ctx.y, sub: 'ini', fill: C_INI }); eti.push({ y: py(s.fin), pre: ctx.y, sub: 'fin', fill: C_FIN }); }
  if (c.bande) {
    if (s.ordre === 2) { eti.push({ y: py(s.fin + an.seuil), pre: ctx.y, sub: 'fin', post: ' + 5 %Δ' + ctx.y, fill: C_BANDE }); eti.push({ y: py(s.fin - an.seuil), pre: ctx.y, sub: 'fin', post: ' − 5 %Δ' + ctx.y, fill: C_BANDE }); }
    else eti.push({ y: py(yBande), pre: ctx.y, sub: 'fin', post: (sgn > 0 ? ' + ' : ' − ') + '5 %Δ' + ctx.y, fill: C_BANDE });
  }
  const ey = etaler(eti.map(e => e.y + 4), 17);
  const bouge = e => {
    const r = e.currentTarget.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((x - ML) / (W - ML - MR)) * N);
    setCur(i < 0 || i > N ? null : i);
  };
  const pc = cur != null ? pts[cur] : null;
  const xD = Math.max(ML + 34, px(s.t0) - 22);
  const yTR = H - MB - 15;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', background: 'white', borderRadius: 8, touchAction: 'pan-y', cursor: 'crosshair' }}
      role="img" aria-label={`Réponse du capteur à un échelon : ${ctx.grand} en fonction du temps`}
      onPointerMove={bouge} onPointerDown={bouge} onPointerLeave={e => { if (e.pointerType === 'mouse') setCur(null); }}>
      <defs>
        <marker id="rp-fl" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 z" fill={C_TR}/></marker>
        <marker id="rp-fk" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 z" fill="#0f172a"/></marker>
      </defs>
      {yt.map(v => <g key={`y${v}`}><line x1={ML} x2={W - MR} y1={py(v)} y2={py(v)} stroke="#e2e8f0"/><text x={ML - 6} y={py(v) + 4} fontSize="13" textAnchor="end" fill="#334155">{dec(v === 0 ? 0 : v, dy)}</text></g>)}
      {xt.map(v => <g key={`x${v}`}><line x1={px(v)} x2={px(v)} y1={MT} y2={H - MB} stroke="#e2e8f0"/><text x={px(v)} y={H - MB + 17} fontSize="13" textAnchor="middle" fill="#334155">{dec(v, dx)}</text></g>)}
      <line x1={ML} x2={ML} y1={MT} y2={H - MB} stroke="#0f172a"/><line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="#0f172a"/>
      <text x={(ML + W - MR) / 2} y={H - 8} fontSize="13.5" textAnchor="middle" fill="#0f172a">temps t ({ctx.tU})</text>
      <text transform={`translate(15 ${(MT + H - MB) / 2}) rotate(-90)`} fontSize="13.5" textAnchor="middle" fill="#0f172a">{ctx.grand} {ctx.y} ({ctx.yU})</text>

      {c.bande && (s.ordre === 2
        ? <g><rect x={ML} y={py(s.fin + an.seuil)} width={W - MR - ML} height={py(s.fin - an.seuil) - py(s.fin + an.seuil)} fill={C_BANDE} opacity="0.12"/>
            <line x1={ML} x2={W - MR} y1={py(s.fin + an.seuil)} y2={py(s.fin + an.seuil)} stroke={C_BANDE} strokeDasharray="8 3 2 3" strokeWidth="1.6"/>
            <line x1={ML} x2={W - MR} y1={py(s.fin - an.seuil)} y2={py(s.fin - an.seuil)} stroke={C_BANDE} strokeDasharray="8 3 2 3" strokeWidth="1.6"/></g>
        : <line x1={ML} x2={W - MR} y1={py(yBande)} y2={py(yBande)} stroke={C_BANDE} strokeDasharray="8 3 2 3" strokeWidth="1.6"/>)}
      {c.niveaux && <g>
        <line x1={ML} x2={W - MR} y1={py(s.ini)} y2={py(s.ini)} stroke={C_INI} strokeDasharray="5 4" strokeWidth="1.5"/>
        <line x1={ML} x2={W - MR} y1={py(s.fin)} y2={py(s.fin)} stroke={C_FIN} strokeDasharray="5 4" strokeWidth="1.5"/></g>}
      {c.delta && <g>
        <line x1={xD} x2={xD} y1={py(s.ini) + (s.ini > s.fin ? 2 : -2)} y2={py(s.fin) + (s.ini > s.fin ? -2 : 2)} stroke="#0f172a" strokeWidth="1.6" markerStart="url(#rp-fk)" markerEnd="url(#rp-fk)"/>
        <Lab x={xD - 6} y={(py(s.ini) + py(s.fin)) / 2 + 4} pre="Δ" post={ctx.y} fill="#0f172a" anchor="end" size={14} bold/></g>}
      {c.entree && <g>
        <line x1={px(s.t0 + an.tEntree)} x2={px(s.t0 + an.tEntree)} y1={MT} y2={H - MB} stroke="#64748b" strokeDasharray="2 3" strokeWidth="1.5"/>
        <text x={px(s.t0 + an.tEntree) + 4} y={MT + 24} fontSize="13" fill="#475569">1ʳᵉ entrée</text></g>}
      {c.t0 && <g><line x1={px(s.t0)} x2={px(s.t0)} y1={MT} y2={H - MB} stroke="#0f172a" strokeDasharray="2 3" strokeWidth="1.5"/>
        <Lab x={px(s.t0) - 4} y={MT + 11} pre="t" sub="0" fill="#0f172a" anchor="end" size={14} bold/></g>}
      {c.tR && <g><line x1={px(an.t1)} x2={px(an.t1)} y1={MT} y2={H - MB} stroke={C_TR} strokeDasharray="2 3" strokeWidth="1.5"/>
        <Lab x={px(an.t1) + 4} y={MT + 11} pre="t" sub="1" fill={C_TR} size={14} bold/>
        <line x1={px(s.t0)} x2={px(an.t1)} y1={yTR} y2={yTR} stroke={C_TR} strokeWidth="2" markerStart="url(#rp-fl)" markerEnd="url(#rp-fl)"/>
        <Lab x={(px(s.t0) + px(an.t1)) / 2} y={yTR - 6} pre="t" sub="R" fill={C_TR} anchor="middle" size={14} bold/></g>}

      {pts.map((p, i) => <circle key={i} cx={px(p.t)} cy={py(p.y)} r="1.7" fill={C_PTS}/>)}
      {mod && <path d={chemin} fill="none" stroke={C_MOD} strokeWidth="2.2" strokeDasharray="7 4"/>}
      {eti.map((e, i) => <Lab key={i} x={W - MR + 6} y={ey[i]} pre={e.pre} sub={e.sub} post={e.post} fill={e.fill} size={14} bold/>)}
      {pc && <g pointerEvents="none">
        <line x1={px(pc.t)} x2={px(pc.t)} y1={MT} y2={H - MB} stroke="#0f172a" strokeWidth="0.8" strokeDasharray="3 3"/>
        <line x1={ML} x2={W - MR} y1={py(pc.y)} y2={py(pc.y)} stroke="#0f172a" strokeWidth="0.8" strokeDasharray="3 3"/>
        <circle cx={px(pc.t)} cy={py(pc.y)} r="4.5" fill="none" stroke="#0f172a" strokeWidth="1.5"/>
        <rect x={W - MR - 196} y={MT + 4} width="192" height="26" rx="4" fill="white" stroke="#0f172a" opacity="0.95"/>
        <text x={W - MR - 188} y={MT + 22} fontSize="13.5" fill="#0f172a" fontFamily="monospace">t = {nf(pc.t)} {ctx.tU} ; {ctx.y} = {nf(pc.y, 4)}</text></g>}
    </svg>
  );
}

function LegendeGraphe({ modele }) {
  return (
    <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>
      <span style={{ color: C_PTS, fontWeight: 700 }}>●</span> points de mesure (avec un peu de bruit) · passez la souris ou le doigt sur la courbe pour lire t et la valeur d’un point.
      {modele && <> <span style={{ color: C_MOD, fontWeight: 700 }}>- - -</span> modèle exponentiel</>}
    </div>
  );
}

// ════════════════ DÉFI : génération ════════════════
const tire = t => t[Math.floor(Math.random() * t.length)];
export function tirageDefi(type) {
  const seed = 1 + Math.floor(Math.random() * 9999);
  if (type === 'oscille') {
    for (;;) {
      const bain = Math.random() < 0.6, zeta = tire([0.15, 0.2, 0.25, 0.3, 0.35, 0.4]), k = Math.sqrt(1 - zeta * zeta);
      if ([1, 2, 3, 4, 5, 6, 7, 8].some(n => Math.abs(Math.exp(-n * Math.PI * zeta / k) - 0.05) < 0.007)) continue;   // évite les pics presque exactement à 5 %
      const ctx = bain ? CTX.bain : CTX.rlc;
      const sys = bain ? { ordre: 2, ini: tire([15, 20, 25]), fin: tire([50, 60, 70, 80]), t0: tire([20, 30, 40]), zeta, w0: tire([0.03, 0.04, 0.05, 0.06]), seed }
        : { ordre: 2, ini: 0, fin: tire([3.3, 5, 9, 12]), t0: tire([1, 2]), zeta, w0: tire([2, 3, 4, 5]), seed };
      return { type, ctx, sys, reps: {}, verifie: false };
    }
  }
  const desc = Math.random() < 0.5, a = tire([3.6, 3.8, 4, 4.2, 4.4]), b = tire([1.6, 1.8, 2, 2.2, 2.4]);
  const tau = tire([0.8, 1.2, 1.5, 2, 2.5, 3, 4]);
  return { type: 'ordre1', ctx: CTX.ctn, tau2: tire([5, 6, 7, 8, 9]),
    sys: { ordre: 1, ini: desc ? a : b, fin: desc ? b : a, t0: tire([5, 8, 10, 12]), tau, seed }, reps: {}, verifie: false };
}
function questionsDefi(df) {
  const s = df.sys, an = analyse(s), y = df.ctx.y, u = df.ctx.yU, tU = df.ctx.tU;
  const sgn = s.ini > s.fin ? 1 : -1;
  const base = [
    { id: 'dV', q: <>Variation totale Δ{y} (valeur absolue)</>, u, vrai: an.aD, tol: 0.03,
      detail: `Δ${y} = |${y}_fin − ${y}_ini| = |${nf(s.fin)} − ${nf(s.ini)}| = ${nf(an.aD)} ${u}` },
    { id: 'seuil', q: <>5 % de Δ{y}</>, u, vrai: an.seuil, tol: 0.04, detail: `0,05 × ${nf(an.aD)} = ${nf(an.seuil)} ${u}` },
  ];
  if (df.type === 'oscille') {
    return [...base,
      { id: 'max', q: <>Valeur maximale atteinte par {y} (le « pic »)</>, u, vrai: an.ymax, tol: 0.03,
        detail: `${y}_max = ${y}_fin + D × Δ${y} = ${nf(s.fin)} + ${nf(an.depass, 3)} × ${nf(an.aD)} = ${nf(an.ymax)} ${u}` },
      { id: 'dep', q: <>Dépassement D = ({y}<Sub c="max"/> − {y}<Sub c="fin"/>) / Δ{y}, en <strong>%</strong></>, u: '%', vrai: an.depass * 100, tol: 0.08,
        detail: `D = (${nf(an.ymax)} − ${nf(s.fin)}) / ${nf(an.aD)} = ${nf(an.depass * 100)} %` },
      { id: 'tR', q: <>Temps de réponse à 5 % t<Sub c="R"/> (dernière entrée dans la bande ±5 %, comptée depuis t<Sub c="0"/>)</>, u: tU, vrai: an.tR, tol: 0.06,
        detail: `t₀ = ${nf(s.t0)} ${tU} ; la courbe ne sort plus de la bande [${nf(s.fin - an.seuil)} ; ${nf(s.fin + an.seuil)}] à partir de t₁ ≈ ${nf(an.t1)} ${tU} ; t_R = t₁ − t₀ = ${nf(an.tR)} ${tU}` },
    ];
  }
  const lim = s.fin + sgn * an.seuil, tr2 = 3 * df.tau2;
  return [...base,
    { id: 'lim', q: <>Valeur limite {y}<Sub c="fin"/> {sgn > 0 ? '+' : '−'} 5 %Δ{y} (la bande que la courbe doit atteindre)</>, u, vrai: lim, tol: 0.02,
      detail: `${y}_fin ${sgn > 0 ? '+' : '−'} 5 %Δ${y} = ${nf(s.fin)} ${sgn > 0 ? '+' : '−'} ${nf(an.seuil)} = ${nf(lim)} ${u} (la courbe approche ${y}_fin par ${sgn > 0 ? 'au-dessus' : 'en dessous'})` },
    { id: 'tR', q: <>Temps de réponse à 5 % t<Sub c="R"/> par la méthode graphique (compté depuis t<Sub c="0"/>)</>, u: tU, vrai: an.tR, tol: 0.07,
      detail: `t₀ = ${nf(s.t0)} ${tU} ; la courbe atteint ${nf(lim)} ${u} à t₁ ≈ ${nf(an.t1)} ${tU} ; t_R = t₁ − t₀ = ${nf(an.tR)} ${tU}` },
    { id: 'tau', q: <>Constante de temps τ du modèle exponentiel (avec t<Sub c="R"/> = 3τ)</>, u: tU, vrai: s.tau, tol: 0.07,
      detail: `τ = t_R / 3 = ${nf(an.tR)} / 3 ≈ ${nf(s.tau)} ${tU}` },
    { id: 'tr2', q: <>Une seconde sonde a une constante de temps τ = {df.tau2} s. Son temps de réponse à 5 % ?</>, u: 's', vrai: tr2, tol: 0.02,
      detail: `t_R = 3τ = 3 × ${df.tau2} = ${nf(tr2)} s` },
    { id: 'rap', q: <>De combien de fois la seconde sonde est-elle plus lente que la première ? (rapport des temps de réponse)</>, u: '', vrai: tr2 / an.tR, tol: 0.08,
      detail: `${nf(tr2)} / ${nf(an.tR)} = ${nf(tr2 / an.tR)}` },
  ];
}

// ════════════════ SIMULATION ════════════════
export function SimulationReponse() {
  const [mode, setMode] = useState('explore');
  const [guide, setGuide] = useEtatPersistant('reponse-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [rg, setRg] = useEtatPersistant('reponse-guide-reglage-v1', { tau: 3 });
  const [ck, setCk] = useState('ctn');
  const [P, setP] = useState(() => paramsDe('ctn'));
  const [bruit, setBruit] = useState(0.4);
  const [cal, setCal] = useState({ niveaux: true, delta: true, bande: true, tR: true, modele: false });
  const [tauM, setTauM] = useState(CTX.ctn.tau);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [defi, setDefi] = useState(null);
  const [typeDefi, setTypeDefi] = useState('ordre1');

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const aC = analyse(CTN), aB = analyse(BAIN);
  const IDS = ['intro', 'niveaux', 'seuil', 'bande', 'tR', 'modele', 'troisTau', 'compare', 'sondes', 'choix', 'osc', 'oscBande', 'oscTR', 'osc3tau', 'oscDep', 'hypo', 'bravo'];
  const iEt = id => IDS.indexOf(id);
  const etape = guide.etape;
  const vu = id => etape >= iEt(id);
  const apres = id => etape > iEt(id) || (etape === iEt(id) && !!(guide.reussies && guide.reussies[etape]));   // l'étape est passée ou vient d'être réussie
  const partie2 = etape >= iEt('osc');
  const gSys = partie2 ? BAIN : CTN, gAn = partie2 ? aB : aC, gCtx = partie2 ? CTX.bain : CTX.ctn;
  const tauOk = Math.abs(rg.tau - CTN.tau) <= 0.06 * CTN.tau;
  const dB = BAIN.fin - BAIN.ini;
  const ETAPES = [
    { id: 'intro', titre: 'Un capteur n’est pas instantané', focus: ['graphe'],
      texte: <>Une sonde de température CTN est en <strong>eau chaude</strong>. À l’instant t<Sub c="0"/>, on la plonge dans de l’<strong>eau froide</strong> (un « échelon » de température). Le graphique montre la tension V aux bornes du conducteur ohmique du montage : elle suit la température de la sonde. Passez la souris sur la courbe pour lire des valeurs.</>,
      tache: { type: 'qcm', q: 'Pourquoi la tension ne passe-t-elle pas instantanément de sa valeur initiale à sa valeur finale ?',
        options: ['La sonde a une inertie thermique : elle doit échanger de l’énergie avec l’eau pour changer de température', 'Le générateur met du temps à réagir', 'La sonde est mal branchée'], bonne: 0,
        expl: 'Comme tout corps, la sonde (son enveloppe, son élément sensible) a une capacité thermique : changer de température demande un transfert thermique, donc du temps. Le temps de réponse mesure cette lenteur.' } },
    { id: 'niveaux', titre: 'Relever V_ini et V_fin, calculer ΔV', focus: ['graphe'],
      texte: <>Avant l’échelon, la tension est stable à <strong>V<Sub c="ini"/></strong> (tension initiale) ; longtemps après, elle se stabilise à <strong>V<Sub c="fin"/></strong> (tension finale). Lisez-les sur l’axe vertical, puis calculez la variation totale <strong>ΔV</strong> (en valeur absolue : ici V diminue, donc ΔV est négative, mais on utilise |ΔV|).</>,
      tache: { type: 'num', q: '|ΔV| = |V_fin − V_ini|', unite: 'V', vrai: Math.abs(CTN.fin - CTN.ini), tol: 0.03, affiche: x => nf(x),
        aide: 'Lisez V_ini sur le palier de gauche et V_fin sur le palier de droite (aidez-vous des lignes pointillées).',
        pieges: [[-(CTN.ini - CTN.fin), 'La tension diminue : ΔV est négative. On donne ici la valeur absolue, 2,3 V.'], [CTN.ini, 'C’est V_ini. ΔV est la différence entre V_ini et V_fin.'], [CTN.fin, 'C’est V_fin. ΔV est la différence entre V_ini et V_fin.']],
        expl: 'V_ini ≈ 4,38 V ; V_fin ≈ 2,08 V ; |ΔV| = 4,38 − 2,08 = 2,30 V.' } },
    { id: 'seuil', titre: 'Calculer 5 % de ΔV', focus: ['graphe', 'releve'],
      texte: <>Le temps de réponse à 5 % est la durée au bout de laquelle la tension <strong>ne diffère plus de sa valeur finale de plus de 5 % de ΔV</strong>. Commençons par calculer cet écart admis.</>,
      tache: { type: 'num', q: '5 % de ΔV', unite: 'V', vrai: 0.05 * aC.aD, tol: 0.03, affiche: x => nf(x),
        pieges: [[0.05, 'C’est 5 % de ΔV (2,3 V), pas 0,05 V.'], [5 * aC.aD, 'Convertissez 5 % en 0,05 avant de multiplier par ΔV.']],
        expl: '0,05 × 2,30 = 0,115 V.' } },
    { id: 'bande', titre: 'La valeur limite à atteindre', focus: ['graphe', 'releve'],
      texte: <>La tension descend vers V<Sub c="fin"/> <strong>par au-dessus</strong>. Elle sera « assez proche » de V<Sub c="fin"/> quand elle aura atteint <strong>V<Sub c="fin"/> + 5 %ΔV</strong> (et qu’elle y reste).</>,
      tache: { type: 'num', q: 'Valeur limite V_fin + 5 %ΔV', unite: 'V', vrai: CTN.fin + aC.seuil, tol: 0.02, affiche: x => nf(x),
        pieges: [[aC.seuil, 'C’est l’écart (5 %ΔV) ; il faut l’ajouter à V_fin.'], [CTN.fin - aC.seuil, 'La courbe arrive de V_ini > V_fin, donc par au-dessus : on ajoute 5 %ΔV à V_fin.']],
        expl: 'V_fin + 5 %ΔV = 2,08 + 0,115 ≈ 2,20 V. La ligne verte pointillée du graphique la représente.' } },
    { id: 'tR', titre: 'Lire t₀, t₁ et en déduire t_R', focus: ['graphe', 'releve'],
      texte: <>Repérez <strong>t<Sub c="0"/></strong> (début de la chute) et <strong>t<Sub c="1"/></strong> (l’instant où la courbe atteint la ligne verte pour ne plus en ressortir). Le temps de réponse est <strong>t<Sub c="R"/> = t<Sub c="1"/> − t<Sub c="0"/></strong>.</>,
      tache: { type: 'num', q: 'Temps de réponse à 5 % t_R', unite: 's', vrai: aC.tR, tol: 0.05, affiche: x => nf(x),
        aide: 'Aidez-vous du curseur de lecture : cherchez le point de la courbe qui est sur la ligne verte.',
        pieges: [[CTN.t0 + aC.tR, 't₁ est un instant (≈ 15 s). Le temps de réponse est la durée t₁ − t₀.'], [CTN.t0, 'C’est t₀, l’instant de l’échelon, pas une durée de réponse.']],
        expl: 't₀ = 10 s ; t₁ ≈ 15,0 s ; t_R = t₁ − t₀ ≈ 5,0 s, à la précision de lecture près.' } },
    { id: 'modele', titre: 'Modéliser par une exponentielle', focus: ['graphe', 'modele'],
      texte: <>La courbe ressemble à une <strong>exponentielle décroissante</strong> (comme le logiciel du TP). Réglez la constante de temps <strong>τ</strong> avec le curseur jusqu’à ce que la courbe orange en pointillés passe au plus près des points.</>,
      tache: { type: 'action', ok: tauOk, consigne: tauOk ? null : 'Réglez τ pour que la courbe orange suive les points' } },
    { id: 'troisTau', titre: 't_R = 3τ', focus: ['modele', 'releve'],
      texte: <>Pour une exponentielle, l’écart à la valeur finale vaut e<sup>−3</sup> ≈ 5 % de ΔV au bout de 3τ (exactement 2,996 τ) : <strong>t<Sub c="R"/> = 3τ</strong>.</>,
      tache: { type: 'num', q: 'Calculez t_R = 3τ avec votre valeur de τ', unite: 's', vrai: 3 * rg.tau, tol: 0.02, affiche: x => nf(x),
        pieges: [[rg.tau, 'τ est la constante de temps ; le temps de réponse à 5 % vaut 3τ.']],
        expl: `t_R = 3 × ${nf(rg.tau)} ≈ ${nf(3 * rg.tau)} s : on retrouve la valeur lue sur le graphique (≈ 5 s).` } },
    { id: 'compare', titre: 'Quelle méthode est la plus précise ?', focus: ['graphe'],
      texte: <>Les deux méthodes donnent presque le même résultat (≈ 5 s).</>,
      tache: { type: 'qcm', q: 'En général, pourquoi la méthode du modèle exponentiel est-elle plus précise que la lecture graphique ?',
        options: ['Elle utilise tous les points de la courbe, alors que la lecture graphique repose sur un seul croisement avec la ligne, sensible au bruit et à la lecture', 'Parce que 3τ est une valeur exacte et 5 % une approximation', 'Parce qu’elle n’a pas besoin de connaître t₀'], bonne: 0,
        expl: 'L’ajustement exploite des centaines de points et moyenne le bruit ; la lecture graphique dépend d’un seul point d’intersection et de la précision du tracé. Attention : cela suppose que la courbe est vraiment une exponentielle, ce qu’on va remettre en question.' } },
    { id: 'sondes', titre: 'Comparer deux sondes', focus: [],
      texte: <>La sonde Pt100 gainée en inox de la fiche technique (document 7 du TP) a une constante de temps <strong>τ = 5,926 s</strong>.</>,
      tache: { type: 'num', q: 'Temps de réponse à 5 % de la sonde Pt100', unite: 's', vrai: 3 * 5.926, tol: 0.02, affiche: x => nf(x),
        pieges: [[5.926, 'C’est τ ; le temps de réponse à 5 % vaut 3τ.']],
        expl: 't_R = 3τ = 3 × 5,926 ≈ 17,8 s.' } },
    { id: 'choix', titre: 'Choisir la bonne sonde', focus: [],
      texte: <>Dans la bouilloire, la sonde doit couper le chauffage dès que l’eau bout.</>,
      tache: { type: 'qcm', q: 'Quelle sonde choisir pour que l’ébullition ne soit pas prolongée inutilement ?',
        options: ['La sonde CTN (t_R ≈ 5 s) : elle réagit plus vite', 'La Pt100 (t_R ≈ 18 s) : sa constante de temps est plus grande', 'Peu importe'], bonne: 0,
        expl: 'Plus t_R est court, plus tôt le chauffage est coupé. Réserve : t_R dépend aussi des conditions (fluide, agitation, gaine), donc la comparaison n’est rigoureuse que si les deux valeurs sont obtenues dans les mêmes conditions.' } },
    { id: 'osc', titre: 'Quand la grandeur oscille', focus: ['graphe'],
      texte: <>Autre situation : un <strong>bain thermostaté mal réglé</strong>. À l’instant t<Sub c="0"/> on change la consigne de 20 °C à 60 °C. La température ne monte pas gentiment : elle <strong>dépasse</strong> la consigne, redescend en dessous, et oscille de moins en moins avant de se stabiliser (modèle illustratif, pas une mesure).</>,
      tache: { type: 'num', q: 'Valeur maximale atteinte par la température θ (le pic)', unite: '°C', vrai: aB.ymax, tol: 0.03, affiche: x => nf(x),
        aide: 'Utilisez le curseur de lecture au sommet de la première oscillation.',
        expl: 'Le pic est vers 78 °C : la température dépasse la consigne de 60 °C d’environ 18 °C.' } },
    { id: 'oscBande', titre: 'La bande de ±5 %', focus: ['graphe'],
      texte: <>θ<Sub c="ini"/> = 20 °C et θ<Sub c="fin"/> = 60 °C, donc Δθ = 40 °C. Cette fois la courbe arrive à θ<Sub c="fin"/> <strong>des deux côtés</strong> : on trace une <strong>bande</strong> de ± 5 %Δθ autour de θ<Sub c="fin"/>.</>,
      tache: { type: 'num', q: 'Borne haute de la bande : θ_fin + 5 %Δθ', unite: '°C', vrai: BAIN.fin + 0.05 * dB, tol: 0.01, affiche: x => nf(x),
        pieges: [[0.05 * dB, 'C’est l’écart (5 % de 40 °C) ; il faut l’ajouter à θ_fin.'], [BAIN.fin - 0.05 * dB, 'C’est la borne basse. On demande la borne haute.']],
        expl: '5 % de 40 = 2,0 °C ; la bande est [58 ; 62] °C.' } },
    { id: 'oscTR', titre: 'Temps de réponse : attention à la dernière sortie', focus: ['graphe'],
      texte: <>On cherche l’instant où la température <strong>ne sort plus de la bande</strong>. La courbe y entre une première fois en montant, puis en ressort en dépassant la consigne… Lisez t<Sub c="1"/>, et calculez t<Sub c="R"/> = t<Sub c="1"/> − t<Sub c="0"/> (t<Sub c="0"/> = 30 s).</>,
      tache: { type: 'num', q: 'Temps de réponse à 5 % t_R', unite: 's', vrai: aB.tR, tol: 0.05, affiche: x => nf(x),
        aide: 'Cherchez le dernier moment où la courbe passe la limite de la bande : après, elle y reste.',
        pieges: [[aB.tEntree, 'C’est la première entrée dans la bande, mais la courbe en ressort ensuite. Le temps de réponse est lié à la dernière sortie.'], [BAIN.t0 + aB.tR, 't₁ est un instant. Le temps de réponse est la durée t₁ − t₀.']],
        expl: `La courbe ne quitte plus la bande à partir de t₁ ≈ ${nf(aB.t1, 3)} s, donc t_R = t₁ − t₀ ≈ ${nf(aB.tR, 3)} s. La première entrée dans la bande (ligne grise) a lieu bien plus tôt, mais ne convient pas.` } },
    { id: 'osc3tau', titre: 'Peut-on utiliser t_R = 3τ ?', focus: ['graphe'],
      texte: <>La courbe orange est l’exponentielle de constante de temps τ = t<Sub c="R"/> / 3 : elle ne ressemble en rien à la réponse.</>,
      tache: { type: 'qcm', q: 'Pour cette grandeur qui oscille, la relation t_R = 3τ…',
        options: ['ne s’applique pas : la courbe n’est pas une exponentielle ; seule la méthode graphique (bande à 5 %) reste valable', 's’applique, avec une constante de temps plus grande', 's’applique si on ajuste la courbe sur le premier pic'], bonne: 0,
        expl: 't_R = 3τ vient de l’exponentielle (e⁻³ ≈ 5 %) : sans exponentielle, pas de τ. La définition à 5 % par la bande, elle, est valable pour toute réponse.' } },
    { id: 'oscDep', titre: 'Mesurer le dépassement', focus: ['graphe'],
      texte: <>Le <strong>dépassement</strong> D compare l’excès au-dessus de la valeur finale à la variation totale : <strong>D = (θ<Sub c="max"/> − θ<Sub c="fin"/>) / Δθ</strong>.</>,
      tache: { type: 'num', q: 'Dépassement D, en %', unite: '%', vrai: aB.depass * 100, tol: 0.08, affiche: x => nf(x),
        pieges: [[aB.ymax, 'C’est θ_max ; D est un écart rapporté à Δθ.'], [aB.depass, 'Exprimez D en % (multipliez par 100).']],
        expl: `D = (${nf(aB.ymax, 3)} − 60) / 40 ≈ ${nf(aB.depass * 100, 3)} %.` } },
    { id: 'hypo', titre: 'Sur quoi repose ce travail ?', focus: ['hypo'],
      texte: <>Ouvrez l’encadré « Hypothèses de travail ».</>,
      tache: { type: 'qcm', q: 'La relation t_R = 3τ n’a de sens que si la réponse du capteur est…',
        options: ['celle d’un système du premier ordre : une exponentielle, sans oscillation', 'n’importe quelle courbe qui se stabilise', 'une courbe qui oscille autour de la valeur finale'], bonne: 0,
        expl: 'Hypothèses à retenir : échelon idéal, capteur du premier ordre (une seule constante de temps), tension proportionnelle à la température. Si l’une d’elles est fausse, la méthode graphique reste la référence.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous savez mesurer un temps de réponse à 5 % : relever V<Sub c="ini"/>, V<Sub c="fin"/>, t<Sub c="0"/>, tracer la bande de ±5 %ΔV et lire t<Sub c="R"/> = t<Sub c="1"/> − t<Sub c="0"/> ; l’obtenir aussi par un modèle exponentiel (t<Sub c="R"/> = 3τ) ; et vous savez que pour une grandeur qui oscille, seule la dernière sortie de la bande compte. En exploration libre, essayez d’autres situations, changez l’amortissement, ajoutez du bruit.</>, tache: null },
  ];
  const et = ETAPES[Math.min(etape, ETAPES.length - 1)];
  const enGuide = mode === 'guide';
  const hl = id => enGuide && et.focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  const gCal = partie2
    ? { niveaux: true, delta: vu('oscBande'), bande: apres('oscBande'), t0: vu('oscTR'), tR: apres('oscTR'), entree: apres('oscTR'), modele: etape === iEt('osc3tau') ? aB.tR / 3 : null }
    : { niveaux: vu('niveaux'), delta: apres('niveaux'), bande: apres('bande'), t0: vu('tR'), tR: apres('tR'), entree: false,
      modele: etape >= iEt('modele') && etape <= iEt('compare') ? rg.tau : null };
  const lignesReleve = partie2
    ? [[apres('osc'), <>θ<Sub c="max"/></>, `${nf(aB.ymax, 3)} °C`], [apres('oscBande'), <>Δθ ; 5 %Δθ</>, `${nf(Math.abs(dB))} °C ; ${nf(0.05 * Math.abs(dB))} °C`],
      [apres('oscBande'), <>Bande</>, `[${nf(BAIN.fin - 0.05 * dB)} ; ${nf(BAIN.fin + 0.05 * dB)}] °C`], [apres('oscTR'), <>t<Sub c="0"/> ; t<Sub c="1"/> ; t<Sub c="R"/></>, `${nf(BAIN.t0)} s ; ${nf(aB.t1, 3)} s ; ${nf(aB.tR, 3)} s`],
      [apres('oscDep'), <>Dépassement D</>, `${nf(aB.depass * 100, 3)} %`]]
    : [[apres('niveaux'), <>V<Sub c="ini"/> ; V<Sub c="fin"/> ; |ΔV|</>, `${nf(CTN.ini)} V ; ${nf(CTN.fin)} V ; ${nf(aC.aD)} V`], [apres('seuil'), <>5 %ΔV</>, `${nf(aC.seuil)} V`],
      [apres('bande'), <>V<Sub c="fin"/> + 5 %ΔV</>, `${nf(CTN.fin + aC.seuil, 4)} V`], [apres('tR'), <>t<Sub c="0"/> ; t<Sub c="1"/> ; t<Sub c="R"/></>, `${nf(CTN.t0)} s ; ${nf(aC.t1, 3)} s ; ${nf(aC.tR, 3)} s`],
      [apres('troisTau'), <>τ ; 3τ</>, `${nf(rg.tau)} s ; ${nf(3 * rg.tau)} s`]];
  const releve = lignesReleve.filter(l => l[0]);

  // ════════════════ EXPLORATION ════════════════
  const sysE = { ...P };
  const anE = analyse(sysE), ctxE = CTX[ck];
  const choisir = k => { setCk(k); setP(paramsDe(k)); setTauM(paramsDe(k).tau); };
  const set = o => setP(p => ({ ...p, ...o }));
  const span = Math.abs(ctxE.fin - ctxE.ini), pasY = pasJoli(span / 100), tau0 = paramsDe(ck).tau, w00 = paramsDe(ck).w0;
  const calE = { ...cal, entree: false, modele: cal.modele ? tauM : null };
  const lab = { fontSize: 12.5, color: KIT.txt2, fontWeight: 700 };
  const sel = { fontSize: 13.5, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, background: 'white', color: KIT.txt };
  const ligne = { fontSize: 14, color: KIT.txt, lineHeight: 1.7 };
  const reglages = (
    <div style={styleBoite}>
      <div style={{ fontWeight: 700, fontSize: 14, color: KIT.txt, marginBottom: 8 }}>Réglages</div>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
        <span style={lab}>Situation</span>
        <select value={ck} onChange={e => choisir(e.target.value)} style={{ ...sel, maxWidth: 520 }} aria-label="Situation prédéfinie">
          {Object.entries(CTX).map(([k, v]) => <option key={k} value={k}>{v.nom}</option>)}
        </select>
      </label>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 8, fontSize: 13.5, color: KIT.txt }}>
        <span style={lab}>Type de système :</span>
        <label style={{ cursor: 'pointer' }}><input type="radio" name="rp-ordre" checked={P.ordre === 1} onChange={() => set({ ordre: 1 })}/> 1ᵉʳ ordre (exponentielle)</label>
        <label style={{ cursor: 'pointer' }}><input type="radio" name="rp-ordre" checked={P.ordre === 2} onChange={() => set({ ordre: 2 })}/> 2ᵈ ordre (peut osciller)</label>
      </div>
      <div className="rep-curseurs">
        <Curseur nom={`${ctxE.y}_ini`} valeur={P.ini} onChange={v => set({ ini: v })} min={Math.min(ctxE.ini, ctxE.fin) - span * 0.5} max={Math.max(ctxE.ini, ctxE.fin) + span * 0.5} pas={pasY} unite={ctxE.yU} decimales={decimalesDe(pasY)} couleur={C_INI}/>
        <Curseur nom={`${ctxE.y}_fin`} valeur={P.fin} onChange={v => set({ fin: v })} min={Math.min(ctxE.ini, ctxE.fin) - span * 0.5} max={Math.max(ctxE.ini, ctxE.fin) + span * 0.5} pas={pasY} unite={ctxE.yU} decimales={decimalesDe(pasY)} couleur={C_FIN}/>
        <Curseur nom="t_0 (instant de l’échelon)" valeur={P.t0} onChange={v => set({ t0: v })} min={0} max={ctxE.t0 * 3} pas={pasJoli(ctxE.t0 / 20)} unite={ctxE.tU} decimales={decimalesDe(pasJoli(ctxE.t0 / 20))} couleur="#334155"/>
        {P.ordre === 1
          ? <Curseur nom="Constante de temps τ du capteur" valeur={P.tau} onChange={v => set({ tau: v })} min={tau0 * 0.2} max={tau0 * 4} pas={pasJoli(tau0 / 50)} unite={ctxE.tU} decimales={decimalesDe(pasJoli(tau0 / 50))} couleur="#0f766e"/>
          : <>
            <Curseur nom="Amortissement ζ" valeur={P.zeta} onChange={v => set({ zeta: v })} min={0.05} max={0.95} pas={0.05} decimales={2} couleur="#0f766e"/>
            <Curseur nom="Pulsation propre ω_0" valeur={P.w0} onChange={v => set({ w0: v })} min={w00 * 0.3} max={w00 * 3} pas={pasJoli(w00 / 50)} unite={`rad/${ctxE.tU}`} decimales={decimalesDe(pasJoli(w00 / 50))} couleur="#7e22ce"/>
          </>}
        <Curseur nom="Bruit de mesure (en % de ΔV)" valeur={bruit} onChange={setBruit} min={0} max={3} pas={0.1} unite="%" decimales={1} couleur="#64748b"/>
      </div>
      <div style={{ ...lab, margin: '4px 0' }}>Constructions à afficher</div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13.5, color: KIT.txt }}>
        {[['niveaux', 'niveaux initial et final'], ['delta', 'variation ΔV'], ['bande', 'limite(s) à 5 %'], ['tR', 't₀, t₁ et temps de réponse'], ['modele', 'exponentielle de comparaison']].map(([k, nom]) =>
          <label key={k} style={{ cursor: 'pointer' }}><input type="checkbox" checked={cal[k]} onChange={e => setCal(c => ({ ...c, [k]: e.target.checked }))}/> {nom}</label>)}
      </div>
      {cal.modele && <div style={{ marginTop: 8, maxWidth: 420 }}>
        <Curseur nom="τ de l’exponentielle de comparaison" valeur={tauM} onChange={setTauM} min={anE.tauEff * 0.1} max={anE.tauEff * 4} pas={pasJoli(anE.tauEff / 100)} unite={ctxE.tU} decimales={decimalesDe(pasJoli(anE.tauEff / 100))} couleur={C_MOD}/>
      </div>}
    </div>
  );
  const tU = ctxE.tU, yU = ctxE.yU, y = ctxE.y;
  const exact = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={ligne}>Variation : Δ{y} = <strong>{nf(anE.aD)} {yU}</strong> ; 5 %Δ{y} = <strong>{nf(anE.seuil)} {yU}</strong> ; bande [{nf(P.fin - anE.seuil)} ; {nf(P.fin + anE.seuil)}] {yU}.</div>
      {P.ordre === 1
        ? <>
          <div style={ligne}>Constante de temps : τ = <strong>{nf(P.tau)} {tU}</strong>.</div>
          <div style={ligne}>Temps de réponse à 5 % (exact) : t<Sub c="R"/> = τ·ln 20 = <strong>{nf(anE.tR)} {tU}</strong> ; avec 3τ : <strong>{nf(3 * P.tau)} {tU}</strong> (l’écart ne dépasse pas 0,2 %).</div>
        </>
        : <>
          <div style={ligne}>Amortissement ζ = {nf(P.zeta)} ; pulsation propre ω<Sub c="0"/> = {nf(P.w0)} rad/{tU} ; pseudo-période T = <strong>{nf(anE.T)} {tU}</strong>.</div>
          <div style={ligne}>Dépassement D = exp(−πζ/√(1−ζ²)) = <strong>{nf(anE.depass * 100)} %</strong>, soit un pic à <strong>{nf(anE.ymax)} {yU}</strong>.</div>
          <div style={ligne}>Temps de réponse à 5 % (dernière sortie de la bande) : t<Sub c="R"/> = <strong>{nf(anE.tR)} {tU}</strong>. Première entrée dans la bande, elle, dès <strong>{nf(anE.tEntree)} {tU}</strong> après t<Sub c="0"/>.</div>
          <div style={{ ...ligne, color: KIT.txt2 }}>Ici il n’y a pas de constante de temps τ unique : la relation t<Sub c="R"/> = 3τ ne s’applique pas.</div>
        </>}
    </div>
  );

  // ════════════════ DÉFI ════════════════
  function nouveauDefi(t = typeDefi) { setDefi(tirageDefi(t)); }
  function changerMode(m) { setMode(m); if (m === 'defi' && !defi) nouveauDefi(); }
  const voletDefi = defi && (() => {
    const Q = questionsDefi(defi), s = defi.sys, an = analyse(s), ctx = defi.ctx;
    const juste = q => proche(lireNombre(defi.reps[q.id]), q.vrai, q.tol);
    const setRep = (id, v) => setDefi(df => ({ ...df, verifie: false, reps: { ...df.reps, [id]: v } }));
    const nbJustes = Q.filter(juste).length;
    const types = [['ordre1', 'Capteur du 1ᵉʳ ordre'], ['oscille', 'Grandeur qui oscille']];
    const calD = defi.verifie ? { niveaux: true, delta: true, bande: true, t0: true, tR: true, entree: s.ordre === 2 } : { t0: true };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {types.map(([k, nom]) => <button key={k} onClick={() => { setTypeDefi(k); nouveauDefi(k); }} style={stylePetitBouton(defi.type === k, '#0ea5e9')}>{nom}</button>)}
        </div>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.6 }}>
          {defi.type === 'ordre1'
            ? <>Une sonde subit un échelon à t<Sub c="0"/> = {s.t0} s (tension en {ctx.yU}). Voici l’enregistrement. Exploitez-le avec la procédure du TP.</>
            : <>{ctx === CTX.bain ? 'Un bain thermostaté (modèle illustratif)' : 'Un circuit RLC série (tension aux bornes du condensateur)'} reçoit un échelon à t<Sub c="0"/> = {s.t0} {ctx.tU}. La grandeur oscille avant de se stabiliser. Exploitez l’enregistrement.</>}
        </div>
        <Graphe s={s} an={an} bruit={BRUIT_GUIDE} c={calD} ctx={ctx}/>
        <LegendeGraphe/>
        <div style={{ fontSize: 13, color: KIT.txt2 }}>Rappels : Δ{ctx.y} = |{ctx.y}<Sub c="fin"/> − {ctx.y}<Sub c="ini"/>| ; limite = {ctx.y}<Sub c="fin"/> ± 5 %Δ{ctx.y} ; t<Sub c="R"/> = t<Sub c="1"/> − t<Sub c="0"/> ; pour un 1ᵉʳ ordre t<Sub c="R"/> = 3τ. Donnez 3 chiffres significatifs.</div>
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
        <div style={{ fontSize: 12.5, color: KIT.txt2 }}>Lecture graphique : les réponses sont acceptées avec une tolérance de 2 à 8 % selon la question. Après vérification, les constructions s’affichent sur le graphique.</div>
      </div>
    );
  })();

  // ════════════════ HYPOTHÈSES ════════════════
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Échelon idéal</strong> : la grandeur à mesurer (la température du fluide) change instantanément à t<Sub c="0"/>. En TP, le transfert de la sonde d’un bécher à l’autre prend un peu de temps et agite l’eau : cela s’ajoute à la réponse propre de la sonde.</li>
      <li><strong>Capteur du premier ordre</strong> : une seule constante de temps, échange thermique linéaire avec le fluide (coefficient d’échange constant), température uniforme dans la sonde. La réponse est alors une exponentielle y = y<Sub c="fin"/> − Δy·exp(−(t − t<Sub c="0"/>)/τ). Une sonde gainée (enveloppe + élément sensible) a en réalité plusieurs constantes de temps ; la courbe réelle n’est alors qu’approximativement exponentielle.</li>
      <li><strong>Tension proportionnelle à la température de la sonde</strong> : pour une CTN, la relation est non linéaire (la résistance varie exponentiellement avec la température). Pour un grand échelon, la tension n’est donc qu’approximativement une exponentielle, ce qui contribue (parmi d’autres causes) à l’écart entre les deux méthodes.</li>
      <li><strong>Définition à 5 %</strong> : t<Sub c="R"/> est la durée, depuis t<Sub c="0"/>, au bout de laquelle la courbe ne s’écarte plus de la valeur finale de plus de 5 % de |Δy|. Pour un 1ᵉʳ ordre, e<sup>−3</sup> = 4,98 % : t<Sub c="R"/> = τ·ln 20 = 2,996 τ, arrondi à 3τ.</li>
      <li><strong>Bruit de mesure</strong> : bruit uniforme ajouté aux points (de 0,4 % de ΔV par défaut), reproductible. Les valeurs « exactes » affichées sont calculées sur la courbe sans bruit.</li>
      <li><strong>Systèmes qui oscillent (2ᵈ ordre sous-amorti)</strong> : modèle standard à deux paramètres, l’amortissement ζ (inférieur à 1) et la pulsation propre ω<Sub c="0"/>. Le « bain thermostaté mal réglé » est un modèle <em>illustratif</em> d’un bain régulé : les valeurs sont choisies pour la pédagogie, ce ne sont pas des mesures ; un vrai bain dépend de son régulateur et de plusieurs capacités thermiques. Le circuit RLC, lui, suit réellement ce modèle (ζ = (R/2)·√(C/L), ω<Sub c="0"/> = 1/√(LC)).</li>
      <li><strong>Temps de réponse d’un système qui oscille</strong> : c’est la <em>dernière</em> sortie de la bande ±5 %. La relation t<Sub c="R"/> = 3τ n’y a pas de sens (pas d’exponentielle) ; un ajustement exponentiel serait trompeur. La méthode graphique reste valable.</li>
      <li><strong>Dépassement D</strong> : D = exp(−πζ/√(1−ζ²)), atteint à t − t<Sub c="0"/> = π/(ω<Sub c="0"/>√(1−ζ²)).</li>
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

  // ════════════════ VUES ════════════════
  const vueGuide = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...styleBoite, ...cadre('graphe') }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: KIT.txt, marginBottom: 6 }}>{partie2 ? 'Bain thermostaté mal réglé (modèle illustratif)' : 'Réponse de la sonde CTN à un échelon de température'}</div>
        <Graphe s={gSys} an={gAn} bruit={BRUIT_GUIDE} c={gCal} ctx={gCtx}/>
        <LegendeGraphe modele={!!gCal.modele}/>
      </div>
      {!partie2 && vu('modele') && etape <= iEt('compare') && (
        <div style={{ ...styleBoite, ...cadre('modele') }}>
          <Curseur nom="Constante de temps τ du modèle" valeur={rg.tau} onChange={v => setRg(x => ({ ...x, tau: v }))} min={0.5} max={6} pas={0.01} unite="s" decimales={2} couleur={C_MOD}/>
        </div>)}
      {releve.length > 0 && (
        <div style={{ ...styleBoite, ...cadre('releve') }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: KIT.txt, marginBottom: 4 }}>Vos relevés</div>
          {releve.map((l, i) => <div key={i} style={ligne}>{l[1]} = <strong>{l[2]}</strong></div>)}
        </div>)}
    </div>
  );
  const vueExplore = (
    <div style={{ ...styleBoite }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: KIT.txt, marginBottom: 6 }}>{ctxE.nom}</div>
      <Graphe s={sysE} an={anE} bruit={bruit} c={calE} ctx={ctxE}/>
      <LegendeGraphe modele={!!calE.modele}/>
    </div>
  );

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .rep-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .rep-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .rep-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
        .rep-curseurs { display: grid; gap: 0 18px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
        @media (max-width: 960px) { .rep-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Temps de réponse d’un capteur</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div className={`rep-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {mode === 'defi' ? <div style={styleBoite}>{voletDefi}</div> : enGuide ? vueGuide : vueExplore}
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : mode === 'defi' ? <div style={styleBoite}><div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Hypothèses de travail</div>{hypotheses}</div>
            : null}
      </div>
      {mode === 'explore' && <>
        <div style={{ marginBottom: 12 }}>{reglages}</div>
        <div style={{ ...styleBoite, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: KIT.txt, marginBottom: 6 }}>Valeurs exactes de la simulation (à comparer à vos lectures)</div>
          {exact}
        </div>
        <div className="rep-l2">
          <div style={styleBoite}>
            <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
              <li>Sonde CTN : doublez τ. Que devient t<Sub c="R"/> ? Vérifiez que t<Sub c="R"/> reste égal à 3τ.</li>
              <li>Comparez la CTN et la Pt100 : combien de fois la seconde est-elle plus lente ?</li>
              <li>Augmentez le bruit à 3 % : la lecture graphique de t<Sub c="1"/> devient-elle plus incertaine ? Et l’exponentielle de comparaison ?</li>
              <li>Bain mal réglé : repérez les sorties successives de la bande de ±5 %. Laquelle fixe t<Sub c="R"/> ?</li>
              <li>Passez de ζ = 0,25 à 0,7 : que deviennent le dépassement et t<Sub c="R"/> ? Un amortissement plus fort donne-t-il toujours un temps de réponse plus court ?</li>
              <li>Affichez l’exponentielle de comparaison sur le circuit RLC : peut-on la faire coller aux points ?</li>
            </ul>
          </div>
          {panneauHypo}
        </div>
      </>}
      {mode === 'guide' && panneauHypo}
    </div>
  );
}
