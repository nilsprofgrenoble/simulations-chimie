// Schémas et scènes de la simulation 164 « Lumière : domaines spectraux et énergie d'un photon ».
// Conventions : flèches à pointe de taille FIXE (dessinée à la main, indépendante du trait), traits arrondis, légendes séparées du dessin,
// couleurs cohérentes (orange = grandeur repérée, bleu = fréquence ν, ambre = longueur d'onde λ, rouge sombre = énergie E),
// information jamais portée par la couleur seule (noms écrits). Textes ≥ 13 dans un viewBox de 300 à 400 de large.
import { useId } from "react";
import * as P from "./photonModele";
import { COL } from "./photonStyle";

const stl = (max = 480) => ({ width: '100%', maxWidth: max, height: 'auto', display: 'block', margin: '0 auto' });
const FONT = { fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' };

// ───────────── Éléments communs ─────────────
// Flèche : trait fin à bouts arrondis + pointe pleine de taille fixe
export function Fl({ x1: ax, y1: ay, x2: bx2, y2: by2, c = COL.gris, w = 2, p = 8, debut = false }) {
  const x1 = +ax, y1 = +ay, x2 = +bx2, y2 = +by2;
  const a = Math.atan2(y2 - y1, x2 - x1), co = Math.cos(a), si = Math.sin(a);
  const tete = (x, y, s) => { const bx = x - s * co * p, by = y - s * si * p; return `M ${x} ${y} L ${bx - si * s * p * 0.42} ${by + co * s * p * 0.42} L ${bx + si * s * p * 0.42} ${by - co * s * p * 0.42} Z`; };
  const lx1 = debut ? x1 + co * (p - 1) : x1, ly1 = debut ? y1 + si * (p - 1) : y1;
  return (<g>
    <line x1={lx1} y1={ly1} x2={x2 - co * (p - 1)} y2={y2 - si * (p - 1)} stroke={c} strokeWidth={w} strokeLinecap="round"/>
    <path d={tete(x2, y2, 1)} fill={c}/>
    {debut && <path d={tete(x1, y1, -1)} fill={c}/>}
  </g>);
}
const NU_FONT = { fontFamily: '"Times New Roman", Times, "Liberation Serif", serif' };
// Dans un texte, chaque « ν » est écrit avec une police qui possède un vrai nu grec (sinon il ressemble à un v latin)
const melNu = (ch, taille, deja) => (typeof ch === 'string' && !deja && ch.includes('ν'))
  ? ch.split('ν').flatMap((t, k, arr) => k < arr.length - 1 ? [t, <tspan key={k} {...NU_FONT} fontStyle="italic" fontSize={taille + 3}>ν</tspan>] : [t]) : ch;
const T = ({ x, y, children, taille = 13, c = COL.encre, a = 'middle', g = false, i = false, halo = false }) => {
  const nu = typeof children === 'string' && /^2?ν$/.test(children);
  return <text x={x} y={y} textAnchor={a} fontSize={nu ? taille + 3 : taille} fontWeight={g ? 700 : 400} fontStyle={i || nu ? 'italic' : 'normal'} fill={c} {...(nu ? NU_FONT : FONT)}
    {...(halo ? { stroke: 'white', strokeWidth: 4, paintOrder: 'stroke', strokeLinejoin: 'round' } : {})}>{melNu(children, taille, nu)}</text>;
};

// Dégradé du visible : de 780 nm (rouge, à gauche) à 400 nm (violet, à droite), échelle LINÉAIRE
const STOPS_VISIBLE = [[780, '#991b1b'], [700, '#dc2626'], [650, '#ef4444'], [620, '#f97316'], [590, '#f59e0b'], [570, '#eab308'], [530, '#22c55e'], [495, '#06b6d4'], [470, '#3b82f6'], [440, '#4f46e5'], [400, '#7c3aed']];
function DegradeVisible({ id, x1, x2 }) {
  return (<linearGradient id={id} gradientUnits="userSpaceOnUse" x1={x1} y1="0" x2={x2} y2="0">
    {STOPS_VISIBLE.map(([l, c]) => <stop key={l} offset={(780 - l) / 380} stopColor={c}/>)}
  </linearGradient>);
}

// ═════════════ Onde sinusoïdale : λ entre deux crêtes ═════════════
function cheminOnde(x0, yc, amp, periode, n, pas = 2) {
  const pts = []; for (let x = 0; x <= periode * n + 0.01; x += pas) pts.push(`${(x0 + x).toFixed(1)} ${(yc - amp * Math.sin(2 * Math.PI * x / periode + Math.PI / 2)).toFixed(1)}`);
  return 'M ' + pts.join(' L ');
}
// SceneOnde : une onde, sa direction de propagation et la longueur d'onde (entre deux crêtes voisines)
export function SceneOnde() {
  const x0 = 30, per = 110, yc = 78, amp = 30;
  return (
    <svg viewBox="0 0 400 168" style={stl()} role="img" aria-label="Une onde sinusoïdale qui se propage vers la droite ; la longueur d’onde λ est la distance entre deux crêtes voisines.">
      <line x1="20" y1={yc} x2="380" y2={yc} stroke={COL.clair} strokeWidth="1.5" strokeDasharray="4 5"/>
      <path d={cheminOnde(x0, yc, amp, per, 3)} fill="none" stroke={COL.nu} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {[0, 1].map(k => <circle key={k} cx={x0 + k * per} cy={yc - amp} r="4" fill={COL.repere}/>)}
      <Fl x1={x0 + 6} y1="38" x2={x0 + per - 6} y2="38" c={COL.lam} debut/>
      <line x1={x0} y1="42" x2={x0} y2={yc - amp - 6} stroke={COL.lam} strokeWidth="1.2" strokeDasharray="3 3"/>
      <line x1={x0 + per} y1="42" x2={x0 + per} y2={yc - amp - 6} stroke={COL.lam} strokeWidth="1.2" strokeDasharray="3 3"/>
      <text x={x0} y="22" textAnchor="start" fontSize="13" fill={COL.lam} {...FONT}><tspan fontSize="17" fontWeight="700">λ</tspan> : distance entre deux crêtes voisines</text>
      <Fl x1="250" y1="146" x2="368" y2="146" c={COL.gris}/>
      <T x="309" y="136" c={COL.gris} taille={13}>propagation</T>
      <T x="30" y="152" a="start" c={COL.repere} taille={13}>● crête de l’onde</T>
    </svg>);
}

// ═════════════ SPECTRE ÉLECTROMAGNÉTIQUE en échelle logarithmique ═════════════
// Axe horizontal : la FRÉQUENCE croît vers la droite, donc la longueur d'onde décroît (radio à gauche, gamma à droite).
//  marqueur : log10 de λ (m) ou null ; domaines : noms et bornes ; nu : axe des fréquences en haut ; zoom : agrandissement du visible (échelle linéaire).
const X0 = 24, X1 = 384, DEC = (X1 - X0) / (P.LOG_MAX - P.LOG_MIN);
const xLog = lg => X0 + (P.LOG_MAX - lg) * DEC;
const LAM_MAJEURS = [[3, '1 km'], [0, '1 m'], [-3, '1 mm'], [-6, '1 µm'], [-9, '1 nm'], [-12, '1 pm']];
const NU_MAJEURS = [[6, '1 MHz'], [9, '1 GHz'], [12, '1 THz'], [15, '1 PHz'], [18, '1 EHz'], [21, '1 ZHz']];
const LC = Math.log10(P.C);
// Étiquettes des domaines : [id, ligne (1 ou 2), x du texte, ancrage, x du trait de repère]
const ETIQ = { radio: [1, 64, 'middle', 64], micro: [2, 131, 'middle', 131], ir: [1, 176, 'middle', 176], vis: [2, 232, 'middle', 232], uv: [1, 240, 'start', 252], x: [2, 325, 'middle', 325], gamma: [1, 361, 'middle', 361] };

export function SceneSpectre({ marqueur = null, domaines = true, nu = true, zoom = true, neutre = false, label }) {
  const uid = useId().replace(/:/g, '');
  const bt = nu ? 30 : 8, bb = bt + 26;
  const row1 = bb + 22, row2 = bb + 42;
  const yAx = domaines ? row2 + 14 : bb + 12, yLab = yAx + 22;
  const yZoomT = yLab + 26, zt = yZoomT + 8, zb = zt + 20, zLab = zb + 19;
  const H = (zoom ? zLab + 8 : yLab + 8);
  const lim = (l) => Math.min(P.LOG_MAX, Math.max(P.LOG_MIN, l));
  const segs = P.DOMAINES.map(d => ({ d, a: xLog(Math.log10(Math.min(d.lmax, 10 ** P.LOG_MAX))), b: xLog(lim(d.lmin > 0 ? Math.log10(d.lmin) : P.LOG_MIN)) }));
  const xv1 = xLog(Math.log10(780e-9)), xv2 = xLog(Math.log10(400e-9));
  const mx = marqueur == null ? null : xLog(lim(marqueur));
  const lamM = marqueur == null ? null : 10 ** marqueur;
  const dansVisible = lamM != null && lamM >= 400e-9 && lamM < 780e-9;
  const xz = dansVisible ? X0 + (780e-9 - lamM) / 380e-9 * (X1 - X0) : null;
  const gV = `gv-${uid}`, gZ = `gz-${uid}`, clip = `cb-${uid}`;
  const minLam = []; for (let k = P.LOG_MIN; k <= P.LOG_MAX; k++) if (!LAM_MAJEURS.some(([m]) => m === k)) minLam.push(k);
  const nuMaj = []; const nuMin = [];
  for (let k = 6; k <= 21; k++) { const x = xLog(LC - k); if (NU_MAJEURS.some(([m]) => m === k)) nuMaj.push([k, x]); else nuMin.push(x); }
  return (
    <svg viewBox={`0 0 400 ${H}`} style={stl()} role="img" aria-label={label || 'Le spectre électromagnétique en échelle logarithmique : des ondes radio aux rayons gamma, avec les axes des longueurs d’onde et des fréquences.'}>
      <defs>
        <DegradeVisible id={gV} x1={xv1} x2={xv2}/>
        <DegradeVisible id={gZ} x1={X0} x2={X1}/>
        <clipPath id={clip}><rect x={X0} y={bt} width={X1 - X0} height="26" rx="6"/></clipPath>
      </defs>
      {/* axe des fréquences (haut) */}
      {nu && <g>
        <T x="4" y={bt - 14} a="start" c={COL.nu} g taille={16} i>ν</T>
        <line x1={X0} y1={bt - 3} x2={X1} y2={bt - 3} stroke={COL.nu} strokeWidth="1.3" strokeLinecap="round"/>
        {nuMin.map((x, i) => <line key={i} x1={x} y1={bt - 3} x2={x} y2={bt - 7} stroke={COL.nu} strokeWidth="1.2" strokeLinecap="round"/>)}
        {nuMaj.map(([k, x]) => <g key={k}><line x1={x} y1={bt - 3} x2={x} y2={bt - 10} stroke={COL.nu} strokeWidth="1.8" strokeLinecap="round"/>
          <T x={Math.min(Math.max(x, X0 + 22), 394 - 16)} y={bt - 14} c={COL.nu} taille={13.5}>{NU_MAJEURS.find(m => m[0] === k)[1]}</T></g>)}
      </g>}
      {/* bande des domaines */}
      <g clipPath={`url(#${clip})`}>
        {neutre || !domaines
          ? <rect x={X0} y={bt} width={X1 - X0} height="26" fill="#e2e8f0"/>
          : segs.map(({ d, a, b }) => <rect key={d.id} x={a} y={bt} width={Math.max(b - a, 1)} height="26" fill={d.id === 'vis' ? `url(#${gV})` : d.couleur}/>)}
        {domaines && !neutre && segs.slice(1).map(({ d, a }) => <line key={d.id} x1={a} y1={bt} x2={a} y2={bt + 26} stroke="white" strokeWidth="1.6"/>)}
      </g>
      <rect x={X0} y={bt} width={X1 - X0} height="26" rx="6" fill="none" stroke="#94a3b8" strokeWidth="1"/>
      {domaines && !neutre && <rect x={xv1 - 0.5} y={bt - 1} width={xv2 - xv1 + 1} height="28" fill="none" stroke={COL.encre} strokeWidth="1.1" rx="1"/>}
      {mx != null && <line x1={mx} y1={bt - 4} x2={mx} y2={yAx + 8} stroke={COL.repere} strokeWidth="2.2" strokeLinecap="round"/>}
      {/* noms des domaines */}
      {domaines && !neutre && P.DOMAINES.map(d => { const [lg, x, anc, xt] = ETIQ[d.id]; const y = lg === 1 ? row1 : row2; return (<g key={d.id}>
        <line x1={xt} y1={bb + 3} x2={xt} y2={y - 14} stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round"/>
        <T x={x} y={y} a={anc} g taille={14.5} halo>{d.court}</T></g>); })}
      {/* axe des longueurs d'onde (bas) */}
      <g>
        <T x="4" y={yLab} a="start" c={COL.lam} g taille={16}>λ</T>
        <line x1={X0} y1={yAx} x2={X1} y2={yAx} stroke={COL.lam} strokeWidth="1.3" strokeLinecap="round"/>
        {minLam.map(k => <line key={k} x1={xLog(k)} y1={yAx} x2={xLog(k)} y2={yAx + 4} stroke={COL.lam} strokeWidth="1.2" strokeLinecap="round"/>)}
        {LAM_MAJEURS.map(([k, t]) => <g key={k}><line x1={xLog(k)} y1={yAx} x2={xLog(k)} y2={yAx + 8} stroke={COL.lam} strokeWidth="1.8" strokeLinecap="round"/>
          <T x={xLog(k)} y={yLab} c={COL.lam} a={k === 3 ? 'start' : 'middle'} taille={13.5}>{t}</T></g>)}
      </g>
      {/* repère de l'élève */}
      {mx != null && <g>
        <circle cx={mx} cy={bt + 13} r="5.5" fill="white" stroke={COL.repere} strokeWidth="2.2"/>
      </g>}
      {/* zoom sur le visible */}
      {zoom && <g>
        <T x="204" y={yZoomT} taille={13} c={COL.gris}>zoom sur le visible (échelle linéaire)</T>
        <rect x={X0} y={zt} width={X1 - X0} height="20" rx="5" fill={`url(#${gZ})`} stroke="#94a3b8" strokeWidth="1"/>
        {[[780, 'start'], [650, 'middle'], [520, 'middle'], [400, 'end']].map(([l, a]) => { const x = X0 + (780 - l) / 380 * (X1 - X0); return (<g key={l}>
          <line x1={x} y1={zb} x2={x} y2={zb + 5} stroke={COL.gris} strokeWidth="1.4" strokeLinecap="round"/>
          <T x={a === 'start' ? X0 : a === 'end' ? X1 : x} y={zLab} a={a} c={COL.gris} taille={13.5}>{l} nm</T></g>); })}
        {xz != null && <g><line x1={xz} y1={zt - 3} x2={xz} y2={zb + 5} stroke={COL.repere} strokeWidth="2.2" strokeLinecap="round"/><circle cx={xz} cy={zt + 10} r="5" fill="white" stroke={COL.repere} strokeWidth="2.2"/></g>}
      </g>}
    </svg>);
}

// ═════════════ Chaîne de calcul : λ → ν → E (J) → E (eV) ═════════════
//  ordre : grandeurs affichées de haut en bas ; vals : texte de la valeur connue (null = inconnue, « ? »).
const GR = { lam: ['λ', COL.lam], nu: ['ν', COL.nu], ej: ['E', COL.ener], eev: ['E', COL.ener] };
const OPS = { 'lam>nu': 'ν = c ÷ λ', 'nu>lam': 'λ = c ÷ ν', 'nu>ej': 'E = h × ν', 'ej>eev': 'E(eV) = E(J) ÷ 1,60×10⁻¹⁹', 'eev>ej': 'E(J) = E(eV) × 1,60×10⁻¹⁹', 'ej>lam': 'λ = h × c ÷ E', 'lam>ej': 'E = h × c ÷ λ' };
export function SceneChaine({ ordre, vals, label }) {
  const bh = 36, gap = 38, x0 = 16, bw = 190, n = ordre.length, H = n * bh + (n - 1) * gap + 12;
  const yBox = i => 6 + i * (bh + gap);
  return (
    <svg viewBox={`0 0 400 ${H}`} style={stl(420)} role="img" aria-label={label || 'Chaîne de calcul : de la longueur d’onde à la fréquence, puis à l’énergie du photon.'}>
      {ordre.map((k, i) => { const [sym, c] = GR[k], v = vals[k], y = yBox(i), unite = k === 'ej' ? '' : ''; return (<g key={k}>
        <rect x={x0} y={y} width={bw} height={bh} rx="9" fill={v ? '#fff' : COL.pale} stroke={c} strokeWidth={v ? 2 : 1.6} strokeDasharray={v ? '' : '5 4'}/>
        <T x={x0 + 12} y={y + 24} a="start" c={c} g taille={16}>{k === 'ej' ? 'E (J)' : k === 'eev' ? 'E (eV)' : sym}</T>
        <T x={x0 + bw - 10} y={y + 24} a="end" c={v ? COL.encre : COL.gris} g={!!v} taille={v && v.length > 15 ? 13.5 : 15}>{v || '?'}{unite}</T></g>); })}
      {ordre.slice(0, -1).map((k, i) => { const nx = ordre[i + 1], y1 = yBox(i) + bh + 3, y2 = yBox(i + 1) - 3, xc = x0 + 38, op = OPS[`${k}>${nx}`]; return (<g key={k + nx}>
        <Fl x1={xc} y1={y1} x2={xc} y2={y2} c={COL.gris}/>
        {vals[nx] && op && <T x={xc + 16} y={(y1 + y2) / 2 + 5} a="start" c={COL.gris} taille={13.5}>{op}</T>}</g>); })}
    </svg>);
}

// ═════════════ CARTES « À RETENIR » (viewBox de 300 de large, texte ≥ 13) ═════════════
const stc = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto' };

// Carte 1 : λ = c / ν (ν double, λ divisée par 2)
export function SvgLambdaNu() {
  const x0 = 50;
  return (
    <svg viewBox="0 0 300 206" style={stc} role="img" aria-label="Deux ondes dans le vide : la seconde a une fréquence double, donc une longueur d’onde deux fois plus petite.">
      <T x="8" y="55" a="start" c={COL.nu} g taille={16}>ν</T>
      <T x="8" y="145" a="start" c={COL.nu} g taille={16}>2ν</T>
      <path d={cheminOnde(x0, 52, 18, 104, 2)} fill="none" stroke={COL.nu} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {[0, 1].map(k => <circle key={k} cx={x0 + k * 104} cy="34" r="3.8" fill={COL.repere}/>)}
      <Fl x1={x0 + 5} y1="20" x2={x0 + 99} y2="20" c={COL.lam} debut/>
      <T x={x0 + 52} y="14" c={COL.lam} g taille={15}>λ</T>
      <path d={cheminOnde(x0, 142, 18, 52, 4)} fill="none" stroke={COL.nu} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {[0, 1].map(k => <circle key={k} cx={x0 + k * 52} cy="124" r="3.8" fill={COL.repere}/>)}
      <Fl x1={x0 + 5} y1="110" x2={x0 + 47} y2="110" c={COL.lam} debut/>
      <T x={x0 + 26} y="103" c={COL.lam} g taille={15}>λ ÷ 2</T>
      <line x1="20" y1="94" x2="284" y2="94" stroke={COL.clair} strokeWidth="1.2" strokeDasharray="3 4"/>
      <T x="150" y="190" c={COL.encre} g taille={14}>ν × 2 ⇒ λ ÷ 2 (c ne change pas)</T>
    </svg>);
}

// Carte 2 : échelle logarithmique
export function SvgLog() {
  const xs = [36, 112, 188, 264];
  return (
    <svg viewBox="0 0 300 196" style={stc} role="img" aria-label="Comparaison d’une échelle linéaire, où 1, 10 et 100 sont entassés près de zéro, et d’une échelle logarithmique, où chaque graduation est dix fois plus grande que la précédente.">
      <T x="150" y="16" g taille={14}>échelle linéaire</T>
      <Fl x1="16" y1="58" x2="288" y2="58" c={COL.gris}/>
      {[20.3, 22.6, 46, 280].map((x, i) => <circle key={i} cx={x} cy="58" r="4.2" fill={COL.repere}/>)}
      <T x="20" y="42" a="start" taille={13}>1 et 10</T>
      <T x="52" y="80" taille={13}>100</T>
      <T x="272" y="80" taille={13}>1 000</T>
      <line x1="20" y1="96" x2="280" y2="96" stroke={COL.clair} strokeWidth="1.2" strokeDasharray="3 4"/>
      <T x="150" y="114" g taille={14}>échelle logarithmique</T>
      <Fl x1="16" y1="162" x2="288" y2="162" c={COL.gris}/>
      {xs.map((x, i) => <g key={i}><circle cx={x} cy="162" r="4.2" fill={COL.repere}/><T x={x} y="184" taille={13}>{['1', '10', '100', '1 000'][i]}</T></g>)}
      {[0, 1, 2].map(i => <g key={i}><path d={`M ${xs[i] + 6} 150 Q ${(xs[i] + xs[i + 1]) / 2} 126 ${xs[i + 1] - 6} 150`} fill="none" stroke={COL.nu} strokeWidth="1.8" strokeLinecap="round"/>
        <T x={(xs[i] + xs[i + 1]) / 2} y="134" c={COL.nu} g taille={13.5}>× 10</T></g>)}
    </svg>);
}

// Carte 3 : les sept domaines (repères conventionnels) et un exemple chacun
export function SvgDomaines() {
  const uid = useId().replace(/:/g, ''), top = 28, rh = 33;
  return (
    <svg viewBox={`0 0 300 ${top + rh * 7 + 10}`} style={stc} role="img" aria-label="Les sept domaines du spectre électromagnétique, du plus grande longueur d’onde au plus petite : ondes radio, micro-ondes, infrarouge, visible, ultraviolet, rayons X et rayons gamma, avec un exemple chacun.">
      <defs><linearGradient id={`dv-${uid}`} x1="0" y1="0" x2="1" y2="0">{STOPS_VISIBLE.map(([l, c]) => <stop key={l} offset={(780 - l) / 380} stopColor={c}/>)}</linearGradient></defs>
      <T x="30" y="16" a="start" c={COL.encre} g taille={13}>λ diminue, ν augmente</T>
      <Fl x1="12" y1={top - 6} x2="12" y2={top + rh * 7 - 2} c={COL.repere}/>
      {P.DOMAINES.map((d, i) => { const y = top + i * rh; return (<g key={d.id}>
        {i > 0 && <line x1="26" y1={y} x2="292" y2={y} stroke={COL.clair} strokeWidth="1"/>}
        <rect x="28" y={y + 6} width="20" height="21" rx="5" fill={d.id === 'vis' ? `url(#dv-${uid})` : d.couleur}/>
        <T x="56" y={y + 16} a="start" c={COL.encre} g taille={13.5}>{d.nom}</T>
        <T x="56" y={y + 30} a="start" c={COL.gris} taille={12.5}>{d.exemple}</T>
        <T x="294" y={y + 16} a="end" c={COL.lam} taille={13}>{d.borne}</T></g>); })}
    </svg>);
}

// Carte 4 : préfixes et conversions avant calcul
export function SvgPrefixes() {
  const col = (x, titre, c, lignes) => (<g>
    <T x={x + 62} y="22" c={c} g taille={14.5}>{titre}</T>
    {lignes.map(([u, f], i) => { const y = 38 + i * 38; return (<g key={u}>
      <rect x={x} y={y} width="46" height="26" rx="7" fill="#fff" stroke={c} strokeWidth="1.8"/>
      <T x={x + 23} y={y + 18} g taille={14}>{u}</T>
      <Fl x1={x + 52} y1={y + 13} x2={x + 74} y2={y + 13} c={COL.gris}/>
      <T x={x + 80} y={y + 18.5} a="start" taille={14}>{f}</T></g>); })}
  </g>);
  return (
    <svg viewBox="0 0 300 192" style={stc} role="img" aria-label="Conversions avant calcul : nanomètre, micromètre et millimètre vers le mètre ; mégahertz, gigahertz et térahertz vers le hertz.">
      {col(10, 'λ en mètres', COL.lam, [['nm', '× 10⁻⁹'], ['µm', '× 10⁻⁶'], ['mm', '× 10⁻³']])}
      {col(160, 'ν en hertz', COL.nu, [['MHz', '× 10⁶'], ['GHz', '× 10⁹'], ['THz', '× 10¹²']])}
      <rect x="10" y="156" width="280" height="28" rx="9" fill="#fff7ed" stroke="#fdba74" strokeWidth="1.5"/>
      <T x="150" y="175" g taille={13.5} c="#9a3412">convertir en m et en Hz d’abord</T>
    </svg>);
}

// Carte 5 : deux modèles, une seule lumière
export function SvgModeles() {
  return (
    <svg viewBox="0 0 300 190" style={stc} role="img" aria-label="Deux descriptions de la même lumière : le modèle ondulatoire, avec une onde de longueur d’onde et de fréquence, et le modèle particulaire, avec des photons qui portent chacun une énergie.">
      <rect x="8" y="8" width="136" height="118" rx="12" fill={COL.pale} stroke={COL.clair}/>
      <rect x="156" y="8" width="136" height="118" rx="12" fill={COL.pale} stroke={COL.clair}/>
      <T x="76" y="30" g taille={14.5}>Modèle d’onde</T>
      <T x="224" y="30" g taille={14.5}>Modèle de photons</T>
      <path d={cheminOnde(22, 72, 15, 54, 2)} fill="none" stroke={COL.nu} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <T x="76" y="116" taille={14} g c={COL.lam}>λ<tspan fill={COL.encre}> et </tspan><tspan fill={COL.nu} {...NU_FONT} fontStyle="italic" fontSize="17">ν</tspan></T>
      <Fl x1="168" y1="72" x2="282" y2="72" c={COL.gris}/>
      {[184, 212, 240].map(x => <g key={x}><circle cx={x} cy="72" r="8.5" fill="#fde68a" stroke="#f59e0b" strokeWidth="2"/></g>)}
      <T x="224" y="116" taille={14} g c={COL.ener}>énergie E</T>
      <rect x="8" y="140" width="284" height="42" rx="11" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1.5"/>
      <T x="150" y="157" g taille={13.5}>une même lumière,</T>
      <T x="150" y="174" g taille={13.5}>deux descriptions complémentaires</T>
    </svg>);
}

// Carte 6 : énergie d'un photon, E = h·ν, et eV
export function SvgEnergie() {
  const g = [[34, 5, 'radio'], [90, 8, 'IR'], [146, 11, 'visible'], [202, 14, 'UV'], [258, 17, 'X']];
  return (
    <svg viewBox="0 0 300 214" style={stc} role="img" aria-label="L’énergie d’un photon augmente avec la fréquence : cinq photons de taille croissante, des ondes radio aux rayons X, puis la conversion 1 électronvolt égale 1,60 fois 10 puissance moins 19 joule.">
      <T x="150" y="18" g taille={14} c={COL.ener}>E augmente quand ν augmente</T>
      {g.map(([x, r, nom]) => <g key={nom}><circle cx={x} cy="62" r={r} fill="#fecdd3" stroke={COL.ener} strokeWidth="2"/><T x={x} y="98" taille={13}>{nom}</T></g>)}
      <Fl x1="16" y1="116" x2="284" y2="116" c={COL.nu}/>
      <T x="150" y="136" c={COL.nu} g taille={13.5}>fréquence ν croissante</T>
      <rect x="10" y="150" width="280" height="38" rx="10" fill="#fff" stroke={COL.ener} strokeWidth="1.8"/>
      <T x="150" y="166" g taille={13.5}>1 eV = 1,60×10⁻¹⁹ J</T>
      <T x="150" y="182" taille={13} c={COL.gris}>joules ÷ 1,60×10⁻¹⁹ = électronvolts</T>
      <T x="150" y="207" taille={12.5} c={COL.gris}>ronds : plus gros = plus d’énergie (schéma)</T>
    </svg>);
}
