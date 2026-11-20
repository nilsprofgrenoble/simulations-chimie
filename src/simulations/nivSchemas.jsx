// Schémas et scènes de la simulation 165 « Niveaux d'énergie : absorption, émission et spectres de raies ».
// Conventions : flèches fines à pointe de taille FIXE (composant Fl de photonSchemas), traits arrondis, légendes séparées du dessin, texte ≥ 14,5 dans le viewBox,
// aucun texte sur un autre texte (halo blanc sous les étiquettes qui croisent un trait), information jamais portée par la couleur seule (λ écrites, noms des domaines).
// Pas d'orbites : l'atome est un disque, ses énergies possibles sont des niveaux (traits horizontaux).
import { useId } from "react";
import * as N from "./nivModele";
import { Fl } from "./photonSchemas";
import { COL } from "./photonStyle";

const stl = (max = 480) => ({ width: '100%', maxWidth: max, height: 'auto', display: 'block', margin: '0 auto' });
const FONT = { fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' };
const NU_FONT = { fontFamily: '"Times New Roman", Times, "Liberation Serif", serif' };
export const ORANGE = '#ea580c';
const sombre = css => { const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(css); return m ? `rgb(${Math.round(m[1] * 0.78)},${Math.round(m[2] * 0.78)},${Math.round(m[3] * 0.78)})` : css; };
const surNoir = lam => (lam < 400 ? '#c4b5fd' : lam >= 780 ? '#fb7185' : N.cssVisible(lam));
// Texte : « ν » est écrit avec une police qui possède un vrai nu grec (voir sim 164)
const melNu = (ch, taille) => (typeof ch === 'string' && ch.includes('ν'))
  ? ch.split('ν').flatMap((t, k, arr) => k < arr.length - 1 ? [t, <tspan key={k} {...NU_FONT} fontStyle="italic" fontSize={taille + 3}>ν</tspan>] : [t]) : ch;
export const T = ({ x, y, children, taille = 15, c = COL.encre, a = 'middle', g = false, i = false, halo = false }) => (
  <text x={x} y={y} textAnchor={a} fontSize={taille} fontWeight={g ? 700 : 400} fontStyle={i ? 'italic' : 'normal'} fill={c} {...FONT}
    {...(halo ? { stroke: 'white', strokeWidth: 4.5, paintOrder: 'stroke', strokeLinejoin: 'round' } : {})}>{melNu(children, taille)}</text>);
const fmtE = (atome, E) => {
  if (atome.id === 'H') return ['−13,6', '−3,40', '−1,51', '−0,85'][atome.niveaux.indexOf(E)] ?? N.dec(E, 3);
  return (E < 0 ? '−' : '') + N.dec(Math.abs(E), 3);
};
const NBSP = ' ';

// ═════════════ Diagramme de niveaux d'énergie ═════════════
// trans : [{ bas, haut, sens: 'abs' | 'emi', label?, sel? }]  — sel : transition mise en valeur ; onClick(bas, haut) rend les flèches cliquables
// masques : niveaux dont la valeur est cachée (« ? ») ; etiqFond : écrit « fondamental » sous le niveau le plus bas ; etiqExcite : « excité » sur les autres
export function DiagrammeNiveaux({ atome, trans = [], onClick = null, masques = [], etiqFond = false, valeurs = true, label, tout = null }) {
  const L = atome.niveaux, n = L.length, reg = atome.id === 'H';
  const Emin = L[0], Emax = L[n - 1], span = Emax - Emin;
  const top = 36, bas = 34, plotH = reg ? 230 : Math.max(150, Math.min(240, span * 62)), H = top + plotH + bas, W = 360;
  const y = (E, i) => reg ? top + plotH - (i / (n - 1)) * plotH : top + plotH - ((E - Emin) / span) * plotH;
  const toutes = tout || N.transitions(atome).map(t => [t.bas, t.haut]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const xs = toutes.length === 1 ? [124] : toutes.map((_, k) => 66 + (k * 116) / (toutes.length - 1));
  const posX = (b, h) => xs[Math.max(0, toutes.findIndex(p => p[0] === b && p[1] === h))];
  const graduations = []; if (!reg) for (let e = Math.ceil(Emin); e <= Emax + 1e-9; e++) graduations.push(e);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={stl(430)} role="img" aria-label={label || `Diagramme des niveaux d’énergie de l’${atome.nom}, du niveau le plus bas au plus haut${reg ? ' (échelle non respectée)' : ''}.`}>
      <Fl x1="32" y1={top + plotH + 8} x2="32" y2="24" c={COL.gris} w={1.8} p={7}/>
      <T x="4" y="16" a="start" taille={17} c={COL.gris}>énergie (eV)</T>
      {graduations.map(e => <g key={e}>
        <line x1="27" y1={y(e)} x2="37" y2={y(e)} stroke={COL.gris} strokeWidth="1.6" strokeLinecap="round"/>
        <T x="22" y={y(e) + 6} a="end" taille={16.5} c={COL.gris}>{String(e)}</T></g>)}
      {reg && <T x="48" y={top + plotH + 26} a="start" taille={16.5} c={COL.gris} i>échelle non respectée</T>}
      {L.map((E, i) => <g key={i}>
        <line x1="48" y1={y(E, i)} x2="200" y2={y(E, i)} stroke="#334155" strokeWidth="3.2" strokeLinecap="round"/>
        <T x="208" y={y(E, i) + 6} a="start" taille={17} c={COL.encre}><tspan fontWeight="700">{N.nomNiveauHtml(atome, i)}</tspan>{valeurs ? ` = ${masques.includes(i) ? '?' : fmtE(atome, E)}${NBSP}eV` : ''}</T>
        {etiqFond && !reg && i === 0 && <T x="48" y={y(E, i) + 21} a="start" taille={16.5} c={COL.gris} i>niveau fondamental</T>}
      </g>)}
      {trans.map(t => {
        const x = posX(t.bas, t.haut), yb = y(L[t.bas], t.bas), yh = y(L[t.haut], t.haut), up = t.sens === 'abs';
        const tr = N.trouveTransition(atome, t.bas, t.haut), c = t.neutre ? '#1d4ed8' : sombre(N.cssVisible(Math.min(780, Math.max(380, tr.lam)))), sel = t.sel;
        const [a, b] = up ? [yb, yh] : [yh, yb];
        const clic = onClick ? { role: 'button', tabIndex: 0, style: { cursor: 'pointer', outline: 'none' }, onClick: () => onClick(t.bas, t.haut), onKeyDown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(t.bas, t.haut); } },
          'aria-label': `Transition entre ${N.nomNiveau(atome, t.bas)} et ${N.nomNiveau(atome, t.haut)}${sel ? ' (sélectionnée)' : ''}` } : {};
        return (<g key={`${t.bas}-${t.haut}`} {...clic}>
          {onClick && <line x1={x} y1={a} x2={x} y2={b} stroke="transparent" strokeWidth="22"/>}
          {sel && <line x1={x} y1={a} x2={x} y2={b} stroke="#fdba74" strokeWidth="9" strokeLinecap="round" opacity="0.75"/>}
          <Fl x1={x} y1={a} x2={x} y2={b} c={sel ? ORANGE : c} w={sel ? 3 : 2.4} p={9}/>
          {t.label && <T x={x + 8 + String(t.label).length * 9.5 > 204 ? x - 8 : x + 8} y={(a + b) / 2 + 6} a={x + 8 + String(t.label).length * 9.5 > 204 ? 'end' : 'start'} taille={17} g c={sel ? '#9a3412' : COL.encre} halo>{t.label}</T>}
        </g>);
      })}
    </svg>);
}

// ═════════════ Spectre de raies, aligné sur une échelle de longueur d'onde ═════════════
// raies : [{ lam, sel? , nom? }] ; mode : 'emission' (raies colorées sur fond noir) | 'absorption' (raies noires sur fond continu)
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const mix = (c1, c2, f) => c1.map((v, i) => Math.round(v + f * (c2[i] - v)));
const continu = lam => {
  if (lam >= 380 && lam <= 780) return N.rgbVisible(lam);
  if (lam < 380) return mix([237, 233, 254], N.rgbVisible(380), clamp((lam - 200) / 180, 0, 1));
  return mix(N.rgbVisible(780), [254, 205, 211], clamp((lam - 780) / 500, 0, 1));
};
const sMin = nom => nom === 'visible' ? 66 : 32;
export function SpectreRaies({ raies, mode = 'emission', plage = [300, 1900], echelle = 'lin', label, titre = true }) {
  const idg = useId().replace(/:/g, ''), [lo, hi] = plage, W = 360, x0 = 14, x1 = 346, LW = x1 - x0;
  const pos = lam => x0 + LW * (echelle === 'log' ? (Math.log(lam) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)) : (lam - lo) / (hi - lo));
  const inv = f => echelle === 'log' ? Math.exp(Math.log(lo) + f * (Math.log(hi) - Math.log(lo))) : lo + f * (hi - lo);
  const tri = [...raies].filter(r => r.lam >= lo && r.lam <= hi).sort((a, b) => a.lam - b.lam);
  // rangées d'étiquettes : une raie va sur la première rangée où elle ne touche pas la précédente (largeur ≈ 36)
  const fins = [], rang = tri.map(r => { let k = 0; while (fins[k] !== undefined && pos(r.lam) - fins[k] < 46) k++; fins[k] = pos(r.lam); return k; });
  const nRang = tri.length ? Math.max(1, ...rang.map(k => k + 1)) : 0, yS = 14 + nRang * 22 + 6, hS = 58, yB = yS + hS;
  const ticks = echelle === 'log' ? [100, 200, 500, 1000, 2000].filter(v => v >= lo && v <= hi) : (() => { const pas = (hi - lo) > 800 ? 400 : 100, t = []; for (let v = Math.ceil(lo / pas) * pas; v <= hi + 1e-9; v += pas) t.push(v); return t; })();
  const dom = [['UV', 0, 400], ['visible', 400, 780], ['IR', 780, 1e9]].map(([nom, a, b]) => ({ nom, a: Math.max(a, lo), b: Math.min(b, hi) })).filter(d => d.b > d.a);
  const yAxe = yB + 6, yDom = yAxe + 54;
  const stops = Array.from({ length: 61 }, (_, k) => [k / 60, `rgb(${continu(inv(k / 60)).join(',')})`]);
  return (
    <svg viewBox={`0 0 ${W} ${yDom + 38}`} style={stl(430)} role="img" aria-label={label || (mode === 'emission' ? 'Spectre d’émission : raies colorées sur fond noir, placées selon leur longueur d’onde.' : 'Spectre d’absorption : raies noires sur un fond coloré continu, placées selon leur longueur d’onde.')}>
      <defs><linearGradient id={`g${idg}`} x1="0" x2="1" y1="0" y2="0">{stops.map(([o, c]) => <stop key={o} offset={o} stopColor={c}/>)}</linearGradient></defs>
      <rect x={x0} y={yS} width={LW} height={hS} rx="6" fill={mode === 'emission' ? '#0b1020' : `url(#g${idg})`} stroke="#64748b" strokeWidth="1.2"/>
      {tri.map((r, k) => {
        const x = pos(r.lam);
        return (<g key={k}>
          {r.sel && <line x1={x} y1={yS + 2} x2={x} y2={yB - 2} stroke={mode === 'emission' ? '#ffffff' : '#ffffff'} strokeWidth="8" opacity="0.45" strokeLinecap="round"/>}
          {mode === 'absorption' && <line x1={x} y1={yS + 3} x2={x} y2={yB - 3} stroke="#ffffff" strokeWidth="6.5" opacity="0.55" strokeLinecap="round"/>}
          <line x1={x} y1={yS + 3} x2={x} y2={yB - 3} stroke={mode === 'emission' ? surNoir(r.lam) : '#0b1020'} strokeWidth={r.sel ? 4.2 : 3.4} strokeLinecap="round"/>
          {rang[k] > 0 && <line x1={x} y1={14 + (rang[k] + 1) * 22 - 14} x2={x} y2={yS} stroke={COL.clair} strokeWidth="1" strokeDasharray="2 3"/>}
          <T x={x} y={14 + rang[k] * 22 + 7} taille={17} g={!!r.sel} c={r.sel ? '#9a3412' : COL.encre} halo>{String(Math.round(r.lam))}</T>
        </g>);
      })}
      <line x1={x0} y1={yAxe} x2={x1} y2={yAxe} stroke={COL.gris} strokeWidth="1.6" strokeLinecap="round"/>
      {ticks.map(v => <g key={v}><line x1={pos(v)} y1={yAxe} x2={pos(v)} y2={yAxe + 6} stroke={COL.gris} strokeWidth="1.6" strokeLinecap="round"/>
        <T x={pos(v)} y={yAxe + 24} a={pos(v) - x0 < 14 ? 'start' : undefined} taille={16.5} c={COL.gris}>{String(v)}</T></g>)}
      {titre && <T x={x1} y={yAxe + 46} a="end" taille={17} c={COL.gris}>longueur d’onde λ (nm){echelle === 'log' ? ', échelle log' : ''}</T>}
      {dom.map(d => { const xa = pos(d.a), xb = pos(d.b), w = xb - xa; return (<g key={d.nom}>
        {w >= sMin(d.nom) && <rect x={xa + 1} y={yDom} width={w - 2} height="26" rx="5" fill={d.nom === 'visible' ? '#f0fdf4' : '#f1f5f9'} stroke="#cbd5e1"/>}
        {w >= sMin(d.nom) && <T x={(xa + xb) / 2} y={yDom + 19} taille={16.5} c={COL.encre}>{d.nom}</T>}</g>); })}
    </svg>);
}

// ═════════════ Scène atome + photon (absorption, émission, photon refusé) ═════════════
// cas : 'abs' | 'emi' | 'non' ; lam : couleur du photon
function Onde({ x0, x1, y, amp = 9, per = 22, c, w = 2.4 }) {
  const pts = []; for (let x = x0; x <= x1 + 0.01; x += 2) pts.push(`${x.toFixed(1)} ${(y - amp * Math.sin(((x - x0) / per) * 2 * Math.PI)).toFixed(1)}`);
  return <path d={'M ' + pts.join(' L ')} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/>;
}
function Atome({ cx, cy, excite, id }) {
  return (<g>
    {excite && <circle cx={cx} cy={cy} r="38" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 5" strokeLinecap="round"/>}
    <circle cx={cx} cy={cy} r="26" fill={`url(#at${id})`} stroke="#475569" strokeWidth="1.8"/>
    <circle cx={cx} cy={cy} r="4" fill="#334155"/>
  </g>);
}
export function ScenePhoton({ cas = 'abs', lam = 654 }) {
  const id = useId().replace(/:/g, ''), c = sombre(N.cssVisible(Math.min(780, Math.max(380, lam))));
  const etat = (cx, ex, cy = 52) => <T x={cx} y={cy + 60} taille={21} c={COL.encre} g={ex}>{ex ? 'atome excité' : 'atome'}</T>;
  return (
    <svg viewBox="0 0 440 136" style={stl(480)} role="img" aria-label={cas === 'abs0' ? 'Un photon arrive sur un atome ; on ne sait pas encore ce qui se passe.' : cas === 'abs' ? 'Avant : un photon arrive sur un atome. Après : le photon a disparu et l’atome est excité.' : cas === 'emi' ? 'Avant : un atome excité. Après : l’atome est revenu à un niveau plus bas et un photon est parti.' : 'Un photon passe à côté d’un atome sans être absorbé : l’atome reste dans son état et le photon continue.'}>
      <defs><radialGradient id={`at${id}`} cx="0.38" cy="0.35" r="0.8"><stop offset="0" stopColor="#f8fafc"/><stop offset="1" stopColor="#cbd5e1"/></radialGradient></defs>
      {cas === 'abs' && <><Onde x0={14} x1={86} y={52} c={c}/><Fl x1="90" y1="52" x2="132" y2="52" c={c} w={2.2} p={8}/><T x="52" y="86" taille={21}>photon</T>
        <Atome cx={165} cy={52} excite={false} id={id}/>{etat(165, false)}
        <T x="220" y="46" taille={22} c={COL.gris}>→</T>
        <Atome cx={290} cy={52} excite id={id}/>{etat(290, true)}<T x="338" y="50" a="start" taille={21} c={COL.gris}>photon</T><T x="338" y="76" a="start" taille={21} c={COL.gris}>absorbé</T></>}
      {cas === 'abs0' && <><Onde x0={14} x1={110} y={52} c={c}/><Fl x1="114" y1="52" x2="168" y2="52" c={c} w={2.2} p={8}/><T x="62" y="86" taille={21}>photon</T>
        <Atome cx={215} cy={52} excite={false} id={id}/>{etat(215, false)}<T x="330" y="62" taille={30} c={COL.gris} g>?</T></>}
      {cas === 'emi' && <><Atome cx={70} cy={52} excite id={id}/>{etat(70, true)}
        <T x="150" y="46" taille={22} c={COL.gris}>→</T>
        <Atome cx={225} cy={52} excite={false} id={id}/>{etat(225, false)}
        <Fl x1="262" y1="52" x2="302" y2="52" c={c} w={2.2} p={8}/><Onde x0={308} x1={380} y={52} c={c}/><T x="345" y="86" taille={21}>photon émis</T></>}
      {cas === 'non' && <><Atome cx={220} cy={74} excite={false} id={id}/>{etat(220, false, 74)}
        <Onde x0={14} x1={188} y={74} c={c}/><Onde x0={252} x1={388} y={74} c={c}/><Fl x1="392" y1="74" x2="428" y2="74" c={c} w={2.2} p={8}/>
        <T x="100" y="48" taille={21}>photon</T></>}
    </svg>);
}

// ═════════════ Schémas des cartes « À retenir » (viewBox de 300 de large, plafonnés à 320) ═════════════
const carte = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto' };
const Niv = ({ x1 = 50, x2 = 168, y, c = '#334155', w = 3 }) => <line x1={x1} y1={y} x2={x2} y2={y} stroke={c} strokeWidth={w} strokeLinecap="round"/>;
const AxeE = ({ yb, yh }) => <g><Fl x1="28" y1={yb} x2="28" y2={yh} c={COL.gris} w={1.8} p={7}/><T x="28" y={yh - 7} taille={14.5} c={COL.gris}>énergie</T></g>;

// Carte « Niveaux d'énergie » : trois niveaux, zone d'énergies impossibles entre deux niveaux
export function SvgNiveaux() {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 300 200" style={carte} role="img" aria-label="Trois niveaux d’énergie d’un atome : le niveau fondamental en bas, deux niveaux excités au-dessus. Entre deux niveaux, aucune énergie n’est possible.">
      <defs><pattern id={`h${id}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#cbd5e1" strokeWidth="2"/></pattern></defs>
      <AxeE yb={176} yh={34}/>
      <rect x="50" y="108" width="118" height="42" fill={`url(#h${id})`} rx="4"/>
      <T x="109" y="125" taille={14.5} c={COL.encre} halo>énergies</T><T x="109" y="142" taille={14.5} c={COL.encre} halo>impossibles</T>
      <Niv y={150}/><Niv y={108}/><Niv y={52}/>
      <T x="180" y="56" a="start" g>E₂ excité</T><T x="180" y="112" a="start" g>E₁ excité</T><T x="180" y="154" a="start" g>E₀ fondamental</T>
      <T x="180" y="176" a="start" taille={14.5} c={COL.gris} i>(le plus bas)</T>
    </svg>);
}
// Carte « Absorption » : un photon absorbé fait monter l'atome d'un niveau à un autre
export function SvgAbsorption() {
  return (
    <svg viewBox="0 0 300 190" style={carte} role="img" aria-label="Absorption : une flèche vers le haut relie le niveau de départ au niveau d’arrivée ; l’énergie du photon absorbé est égale à l’écart entre les deux niveaux.">
      <AxeE yb={170} yh={22}/>
      <Niv x2={150} y={140}/><Niv x2={150} y={56}/>
      <T x="160" y="145" a="start" g>E départ</T><T x="160" y="61" a="start" g>E arrivée</T>
      <Fl x1="98" y1="140" x2="98" y2="56" c={ORANGE} w={2.6} p={9}/>
      <T x="108" y="104" a="start" taille={15} c="#9a3412" g halo>ΔE</T>
      <Onde x0={176} x1={262} y={86} c="#1d4ed8" amp={8} per={20}/><T x="219" y="112" taille={14.5}>photon absorbé</T>
    </svg>);
}
// Carte « Conversion » : ΔE (eV) → ΔE (J) → λ (m) → λ (nm)
const BoiteConv = ({ y, t }) => <g><rect x="40" y={y} width="130" height="34" rx="9" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5"/><T x="105" y={y + 23} g>{t}</T></g>;
const FlecheConv = ({ y, t }) => <g><Fl x1="105" y1={y} x2="105" y2={y + 30} c={COL.gris} w={2} p={8}/><T x="122" y={y + 20} a="start" taille={14.5} c={COL.gris}>{t}</T></g>;
export function SvgConversion() {
  return (
    <svg viewBox="0 0 300 250" style={carte} role="img" aria-label="Chaîne de conversion : écart d’énergie en électronvolts, multiplié par 1,60 fois 10 puissance moins 19 pour obtenir des joules, puis longueur d’onde égale h c divisé par l’énergie en mètres, puis multipliée par 10 puissance 9 pour obtenir des nanomètres.">
      <BoiteConv y={6} t="ΔE en eV"/><FlecheConv y={42} t="× 1,60×10⁻¹⁹"/>
      <BoiteConv y={74} t="ΔE en J"/><FlecheConv y={110} t="λ = h·c ÷ ΔE"/>
      <BoiteConv y={142} t="λ en m"/><FlecheConv y={178} t="× 10⁹"/>
      <BoiteConv y={210} t="λ en nm"/>
    </svg>);
}
// Carte « Émission » : retour vers un niveau plus bas, photon émis
export function SvgEmission() {
  return (
    <svg viewBox="0 0 300 190" style={carte} role="img" aria-label="Émission : une flèche vers le bas relie le niveau de départ, plus haut, au niveau d’arrivée, plus bas ; un photon est émis, d’énergie égale à l’écart entre les deux niveaux.">
      <AxeE yb={170} yh={22}/>
      <Niv x2={150} y={140}/><Niv x2={150} y={56}/>
      <T x="160" y="145" a="start" g>E arrivée</T><T x="160" y="61" a="start" g>E départ</T>
      <Fl x1="98" y1="56" x2="98" y2="140" c={ORANGE} w={2.6} p={9}/>
      <T x="108" y="104" a="start" taille={15} c="#9a3412" g halo>ΔE</T>
      <Onde x0={168} x1={248} y={86} c="#1d4ed8" amp={8} per={20}/><Fl x1="252" y1="86" x2="284" y2="86" c="#1d4ed8" w={2.2} p={8}/><T x="226" y="112" taille={14.5}>photon émis</T>
    </svg>);
}
// Carte « Du diagramme au spectre » : 3 niveaux, 3 transitions a, b, c ; 3 raies placées selon λ
export function SvgDiagSpectre() {
  const niv = [0, 2.0, 3.1], y = E => 134 - E * 30;   // 0 → 134 ; 2,0 → 74 ; 3,1 → 41
  const tr = [['c', 0, 2, 401], ['b', 0, 1, 621], ['a', 1, 2, 1129]], px = lam => 20 + 260 * (lam - 350) / 900;
  const xs = { c: 104, b: 138, a: 172 };
  return (
    <svg viewBox="0 0 300 262" style={carte} role="img" aria-label="Un diagramme à trois niveaux donne trois transitions a, b et c ; chacune correspond à une raie d’émission, placée selon sa longueur d’onde : la plus grande énergie correspond à la plus petite longueur d’onde.">
      <AxeE yb={150} yh={26}/>
      {niv.map(E => <Niv key={E} x1={66} x2={206} y={y(E)}/>)}
      {tr.map(([k, b, h, lam]) => <g key={k}><Fl x1={xs[k]} y1={y(niv[h])} x2={xs[k]} y2={y(niv[b])} c={sombre(N.cssVisible(Math.min(780, Math.max(380, lam))))} w={2.4} p={8}/>
        <T x={xs[k]} y={y(niv[h]) - 7} taille={15} g halo>{k}</T></g>)}
      <rect x="20" y="170" width="260" height="46" rx="6" fill="#0b1020" stroke="#64748b"/>
      {tr.map(([k, , , lam]) => <g key={k}><line x1={px(lam)} y1="174" x2={px(lam)} y2="212" stroke={surNoir(lam)} strokeWidth="3.6" strokeLinecap="round"/><T x={px(lam)} y="236" g>{k}</T></g>)}
      <T x="20" y="256" a="start" taille={14.5} c={COL.gris}>← petite λ</T><T x="280" y="256" a="end" taille={14.5} c={COL.gris}>grande λ →</T>
    </svg>);
}
// Carte « Spectres d'émission et d'absorption » : mêmes longueurs d'onde
export function SvgAbsSpectre() {
  const id = useId().replace(/:/g, ''), lo = 380, hi = 780, px = l => 20 + 260 * (l - lo) / (hi - lo), L = [450, 620], Lem = [450, 520, 620];
  const stops = Array.from({ length: 41 }, (_, k) => [k / 40, `rgb(${N.rgbVisible(lo + (k / 40) * (hi - lo)).join(',')})`]);
  return (
    <svg viewBox="0 0 300 268" style={carte} role="img" aria-label="Deux spectres alignés sur la même échelle de longueur d’onde : en haut, le spectre d’émission avec trois raies colorées sur fond noir ; en bas, le spectre d’absorption avec seulement deux raies noires, aux positions des raies d’émission qui partent du niveau fondamental ; la raie du milieu n’a pas de raie noire.">
      <defs><linearGradient id={`g${id}`} x1="0" x2="1">{stops.map(([o, c]) => <stop key={o} offset={o} stopColor={c}/>)}</linearGradient></defs>
      <T x="150" y="18" g>émission</T>
      <rect x="20" y="28" width="260" height="46" rx="6" fill="#0b1020" stroke="#64748b"/>
      {Lem.map(l => <line key={l} x1={px(l)} y1="32" x2={px(l)} y2="70" stroke={surNoir(l)} strokeWidth="3.6" strokeLinecap="round"/>)}
      {L.map(l => <line key={l} x1={px(l)} y1="76" x2={px(l)} y2="132" stroke="#94a3b8" strokeWidth="1.4" strokeDasharray="3 4" strokeLinecap="round"/>)}
      <T x="150" y="108" taille={15} c={COL.gris} halo i>mêmes λ</T>
      <rect x="20" y="136" width="260" height="46" rx="6" fill={`url(#g${id})`} stroke="#64748b"/>
      {L.map(l => <g key={l}><line x1={px(l)} y1="139" x2={px(l)} y2="179" stroke="#ffffff" strokeWidth="6.5" opacity="0.55" strokeLinecap="round"/><line x1={px(l)} y1="139" x2={px(l)} y2="179" stroke="#0b1020" strokeWidth="3.6" strokeLinecap="round"/></g>)}
      <T x="150" y="204" g>absorption</T>
      <T x="150" y="224" taille={15} c={COL.encre}>seules les raies qui partent</T><T x="150" y="242" taille={15} c={COL.encre}>du fondamental sont absorbées</T>
      <T x="20" y="262" a="start" taille={14.5} c={COL.gris}>violet</T><T x="280" y="262" a="end" taille={14.5} c={COL.gris}>rouge</T>
    </svg>);
}
