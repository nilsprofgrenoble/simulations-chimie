// ====================================================
//  Scènes (schémas animés par les réglages) de la simulation « Mesure : variabilité, histogramme, moyenne et écart-type » (2GT).
//  Tous les SVG : width 100 %, maxWidth 480, centrés ; textes ≥ 16 unités (viewBox de 480 de large).
//  Histogramme : barres = classes (bornes lues sur l'axe), hauteur = nombre de mesures. Nuage : valeurs dans l'ordre des mesures.
// ====================================================
import { useId } from "react";
import * as M from "./mesureVariabilite2gtModele";

const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', encre: '#0f172a', violet: '#6d28d9' };
const stl = { width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb' };
const halo = { paintOrder: 'stroke', stroke: '#fff', strokeWidth: 4, strokeLinejoin: 'round' };
const PX0 = 56, PX1 = 444;

const pasY = yMax => [1, 2, 5, 10, 20, 25, 50].find(p => yMax / p <= 6) || 50;

// ---------- histogramme ----------
// classes : [{a, b, n}] ; xmin, xmax : axe horizontal (par défaut, de la première à la dernière borne) ; yMax : hauteur de l'axe (par défaut, le plus grand effectif)
// moyenne, ecart : repères facultatifs ; surligne : indice d'une classe en orange ; valRef : valeur de référence (trait vert) ; dec : décimales des bornes
export function Histogramme({ classes, xmin, xmax, yMax, nom = 'mesure', unite = '', moyenne = null, ecart = null, valRef = null, surligne = null, dec = 2, compact = false, titre = '', etiquette = '', ticks = null, aria = '', couleur = COL.bleu }) {
  const id = useId().replace(/:/g, '');
  const x0 = xmin ?? classes[0].a, x1 = xmax ?? classes[classes.length - 1].b;
  const nmax = Math.max(1, ...classes.map(c => c.n)), ps = pasY(yMax ?? nmax), ym = yMax ?? Math.ceil(nmax / ps) * ps;
  const PY0 = 56, PY1 = compact ? 156 : 212, Hsvg = PY1 + (compact ? 58 : 62);
  const X = v => PX0 + (v - x0) / (x1 - x0) * (PX1 - PX0), Y = c => PY1 - c / ym * (PY1 - PY0);
  const larg = classes[0].b - classes[0].a, fr = classes[0].a / larg - Math.floor(classes[0].a / larg + 1e-9), centrees = Math.abs(fr - 0.5) < 1e-6;
  const bornes = []; if (centrees) classes.forEach(c => bornes.push((c.a + c.b) / 2)); else classes.forEach((c, i) => { if (i === 0) bornes.push(c.a); bornes.push(c.b); });
  const aff = (ticks || bornes).filter(b => b >= x0 - 1e-9 && b <= x1 + 1e-9);
  const long = aff.some(b => M.nbf(b, dec).length > 5), pas = Math.max(1, Math.ceil(aff.length / (long ? 5 : 7)));
  const yTicks = []; for (let k = 0; k <= ym; k += ps) yTicks.push(k);
  return (
    <svg viewBox={`0 0 480 ${Hsvg}`} style={stl} role="img" aria-label={aria || `Histogramme : nombre de mesures dans chaque classe, ${nom}${unite ? ` en ${unite}` : ''}.`}>
      <defs><clipPath id={`h${id}`}><rect x={PX0} y={PY0 - 4} width={PX1 - PX0} height={PY1 - PY0 + 4}/></clipPath></defs>
      <text x="6" y="20" fontSize="17" fill={COL.gris}>{titre || 'nombre de mesures'}</text>
      {etiquette && <text x={PX1} y="20" fontSize="17" fontWeight="700" textAnchor="end" fill={COL.encre}>{etiquette}</text>}
      {yTicks.map(k => <g key={k}><line x1={PX0} y1={Y(k)} x2={PX1} y2={Y(k)} stroke="#d5dfeb" strokeWidth="1"/><text x={PX0 - 8} y={Y(k) + 6} fontSize="18" textAnchor="end" fill={COL.gris}>{k}</text></g>)}
      <g clipPath={`url(#h${id})`}>
        {classes.map((c, i) => c.n > 0 && <rect key={i} x={X(c.a) + 1} y={Y(c.n)} width={Math.max(1, X(c.b) - X(c.a) - 2)} height={PY1 - Y(c.n)} fill={surligne === i ? COL.orange : couleur} opacity={surligne === null || surligne === i ? 0.9 : 0.55} stroke="#fff" strokeWidth="1"/>)}
      </g>
      <line x1={PX0} y1={PY1} x2={PX1} y2={PY1} stroke="#64748b" strokeWidth="1.8"/>
      <line x1={PX0} y1={PY0} x2={PX0} y2={PY1} stroke="#64748b" strokeWidth="1.8"/>
      {aff.map((b, i) => i % pas === 0 && <g key={b}><line x1={X(b)} y1={PY1} x2={X(b)} y2={PY1 + 6} stroke="#64748b" strokeWidth="1.6"/><text x={X(b)} y={PY1 + 26} fontSize="18" textAnchor="middle" fill={COL.gris}>{M.nbf(b, dec)}</text></g>)}
      <text x={PX1} y={PY1 + 52} fontSize="17" textAnchor="end" fill={COL.encre}>{nom}{unite ? ` (${unite})` : ''}</text>
      {valRef !== null && <g><line x1={X(valRef)} y1={PY0 - 4} x2={X(valRef)} y2={PY1} stroke={COL.vert} strokeWidth="2.4" strokeDasharray="3 4"/></g>}
      {moyenne !== null && <g>
        <line x1={X(moyenne)} y1={PY0 - 4} x2={X(moyenne)} y2={PY1} stroke={COL.orange} strokeWidth="2.8" strokeDasharray="7 4"/>
        <text x={X(moyenne) + (X(moyenne) > 340 ? -6 : 6)} y={PY0 - 8} fontSize="17" fontWeight="700" textAnchor={X(moyenne) > 340 ? 'end' : 'start'} fill={COL.orange} style={halo}>moyenne</text></g>}
      {moyenne !== null && ecart !== null && <g stroke={COL.violet} fill={COL.violet}>
        <line x1={X(moyenne) + 2} y1="34" x2={X(moyenne + ecart) - 8} y2="34" strokeWidth="2.6"/>
        <polygon points={`${X(moyenne + ecart)},34 ${X(moyenne + ecart) - 10},29 ${X(moyenne + ecart) - 10},39`} stroke="none"/>
        <text x={(X(moyenne) + X(moyenne + ecart)) / 2} y="26" fontSize="18" fontWeight="700" textAnchor="middle" stroke="none" style={halo} fill={COL.violet}>s</text></g>}
    </svg>);
}

// plusieurs histogrammes empilés (même axe horizontal)
export function PileHistos({ items, xmin, xmax, yMax, nom, unite, dec, ticks }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{items.map((it, i) => <Histogramme key={i} compact xmin={xmin} xmax={xmax} yMax={yMax} nom={nom} unite={unite} dec={dec} ticks={ticks} {...it}/>)}</div>;
}

// ---------- valeurs dans l'ordre des mesures ----------
export function NuageOrdre({ valeurs, ymin, ymax, unite = '', nom = 'valeur', moyenne = null, dec = 2, compact = false, titre = '', etiquette = '', aria = '', couleur = COL.bleu }) {
  const n = valeurs.length, PY0 = 36, PY1 = compact ? 150 : 206, Hsvg = PY1 + (compact ? 58 : 62);
  const lo = ymin ?? Math.min(...valeurs), hi = ymax ?? Math.max(...valeurs);
  const X = i => PX0 + (i + 0.5) / n * (PX1 - PX0), Y = v => PY1 - (v - lo) / (hi - lo) * (PY1 - PY0);
  const ticks = [lo, (lo + hi) / 2, hi];
  const pasX = n <= 12 ? 1 : n <= 30 ? 5 : n <= 60 ? 10 : 20;
  return (
    <svg viewBox={`0 0 480 ${Hsvg}`} style={stl} role="img" aria-label={aria || `Valeurs dans l’ordre des mesures : ${nom}${unite ? ` en ${unite}` : ''} en fonction du numéro de la mesure.`}>
      <text x="6" y="20" fontSize="17" fill={COL.gris}>{titre || `${nom}${unite ? ` (${unite})` : ''}`}</text>
      {etiquette && <text x={PX1} y="20" fontSize="17" fontWeight="700" textAnchor="end" fill={COL.encre}>{etiquette}</text>}
      {ticks.map(v => <g key={v}><line x1={PX0} y1={Y(v)} x2={PX1} y2={Y(v)} stroke="#d5dfeb" strokeWidth="1"/><text x={PX0 - 8} y={Y(v) + 6} fontSize="18" textAnchor="end" fill={COL.gris}>{M.nbf(v, dec)}</text></g>)}
      <line x1={PX0} y1={PY1} x2={PX1} y2={PY1} stroke="#64748b" strokeWidth="1.8"/><line x1={PX0} y1={PY0} x2={PX0} y2={PY1} stroke="#64748b" strokeWidth="1.8"/>
      {valeurs.map((_, i) => ((i + 1) % pasX === 0 || i === 0) && <text key={i} x={X(i)} y={PY1 + 26} fontSize="18" textAnchor="middle" fill={COL.gris}>{i + 1}</text>)}
      <text x={PX1} y={PY1 + 52} fontSize="17" textAnchor="end" fill={COL.encre}>numéro de la mesure</text>
      {moyenne !== null && <line x1={PX0} y1={Y(moyenne)} x2={PX1} y2={Y(moyenne)} stroke={COL.orange} strokeWidth="2.4" strokeDasharray="7 4"/>}
      {valeurs.length > 1 && <polyline points={valeurs.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')} fill="none" stroke={couleur} strokeWidth="1.2" opacity="0.35"/>}
      {valeurs.map((v, i) => <circle key={i} cx={X(i)} cy={Y(v)} r={n > 40 ? 3 : 5} fill={couleur} stroke="#fff" strokeWidth="1.2"/>)}
    </svg>);
}
export function PileNuages({ items, ymin, ymax, unite, nom, dec }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{items.map((it, i) => <NuageOrdre key={i} compact ymin={ymin} ymax={ymax} unite={unite} nom={nom} dec={dec} {...it}/>)}</div>;
}

// ---------- tableau de valeurs (pastilles) ----------
export function TableauValeurs({ valeurs, unite = '', dec = 2, titre = '', surligne = null, couleurs = null }) {
  return (
    <div>
      {titre && <div style={{ fontSize: 14, fontWeight: 700, color: COL.gris, marginBottom: 6 }}>{titre}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {valeurs.map((v, i) => (
          <span key={i} style={{ border: `1.5px solid ${surligne && surligne(v) ? COL.orange : '#cbd5e1'}`, background: surligne && surligne(v) ? '#fff7ed' : 'white', borderRadius: 10, padding: '4px 9px', fontSize: 15, lineHeight: 1.3, color: couleurs ? couleurs(v) : COL.encre, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 12.5, color: COL.gris }}>n° {i + 1}</span><br/><strong>{M.nbf(v, dec)}{M.NB}{unite}</strong>
          </span>))}
      </div>
    </div>);
}

// ---------- classes à remplir ----------
export function TableauClasses({ classes, dec = 2, unite = '', remplie = false, surligne = null }) {
  return (
    <table style={{ borderCollapse: 'collapse', fontSize: 15, width: '100%', maxWidth: 420, margin: '10px auto 0' }}>
      <thead><tr><th style={cel(true)}>Classe (de … inclus à … exclu)</th><th style={cel(true)}>Nombre de valeurs</th></tr></thead>
      <tbody>{classes.map((c, i) => (
        <tr key={i} style={surligne === i ? { background: '#fff7ed' } : null}><td style={cel()}>de {M.nbf(c.a, dec)}{M.NB}{unite} à {M.nbf(c.b, dec)}{M.NB}{unite}</td><td style={{ ...cel(), textAlign: 'center', fontWeight: 700 }}>{remplie ? c.n : (surligne === i ? '?' : '')}</td></tr>))}</tbody>
    </table>);
}
const cel = ent => ({ border: '1px solid #cbd5e1', padding: '6px 8px', background: ent ? '#f1f5f9' : 'white', fontWeight: ent ? 700 : 400, color: COL.encre, textAlign: 'left' });

// ---------- montages expérimentaux ----------
const T = (x, y, t, o = {}) => <text x={x} y={y} fontSize="18" fill={COL.encre} {...o}>{t}</text>;
export function SceneMontage({ id }) {
  if (id === 'chute') return (
    <svg viewBox="0 0 480 250" style={stl} role="img" aria-label="Montage : une bille est lâchée de 1,80 mètre de haut au-dessus du sol ; on chronomètre la durée de sa chute.">
      <rect x="150" y="226" width="180" height="8" rx="3" fill="#94a3b8"/>
      <line x1="120" y1="40" x2="120" y2="226" stroke={COL.orange} strokeWidth="2.6"/><polygon points="120,32 114,46 126,46" fill={COL.orange}/><polygon points="120,234 114,220 126,220" fill={COL.orange}/>
      {T(20, 130, '1,80 m', { fill: COL.orange, fontWeight: 700 })}
      <circle cx="240" cy="46" r="13" fill={COL.bleu}/><line x1="240" y1="64" x2="240" y2="206" stroke={COL.bleu} strokeWidth="2.4" strokeDasharray="6 6"/>
      <polygon points="240,216 234,200 246,200" fill={COL.bleu}/>
      {T(262, 52, 'bille lâchée')}
      <rect x="352" y="96" width="112" height="84" rx="14" fill="#f1f5f9" stroke={COL.gris} strokeWidth="2.4"/>
      <rect x="366" y="108" width="84" height="32" rx="6" fill="white" stroke={COL.gris}/>
      {T(408, 132, 't = ? s', { textAnchor: 'middle', fontWeight: 700 })}
      <circle cx="408" cy="160" r="9" fill={COL.rouge}/>
      {T(408, 206, 'chronomètre', { textAnchor: 'middle' })}
    </svg>);
  if (id === 'gouttes') return (
    <svg viewBox="0 0 480 250" style={stl} role="img" aria-label="Montage : un robinet laisse tomber des gouttes régulièrement ; on chronomètre la durée entre deux gouttes.">
      <rect x="60" y="30" width="150" height="26" rx="8" fill="#94a3b8"/><rect x="170" y="56" width="26" height="22" fill="#94a3b8"/>
      <path d="M183,100 C176,116 172,124 183,132 C194,124 190,116 183,100 Z" fill={COL.bleu}/>
      <path d="M183,160 C176,176 172,184 183,192 C194,184 190,176 183,160 Z" fill={COL.bleu} opacity="0.5"/>
      <rect x="120" y="212" width="126" height="16" rx="6" fill="#cbd5e1"/>
      {T(26, 100, 'robinet', { fontWeight: 700 })}
      {T(206, 124, 'goutte')}
      <rect x="320" y="70" width="140" height="100" rx="14" fill="#f1f5f9" stroke={COL.gris} strokeWidth="2.4"/>
      <rect x="336" y="84" width="108" height="34" rx="6" fill="white" stroke={COL.gris}/>
      {T(390, 108, 't = ? s', { textAnchor: 'middle', fontWeight: 700 })}
      <circle cx="390" cy="146" r="10" fill={COL.rouge}/>
      {T(390, 206, 'chronomètre', { textAnchor: 'middle' })}
    </svg>);
  if (id === 'crayon') return (
    <svg viewBox="0 0 480 250" style={stl} role="img" aria-label="Montage : un crayon posé le long d’une règle graduée ; à côté, un pied à coulisse dont les mâchoires serrent le crayon.">
      <rect x="40" y="52" width="320" height="30" fill="#fde68a" stroke={COL.orange} strokeWidth="2"/><polygon points="360,52 360,82 400,67" fill="#fef3c7" stroke={COL.orange} strokeWidth="2"/><polygon points="388,62 388,72 400,67" fill={COL.encre}/>
      {T(160, 40, 'crayon', { textAnchor: 'middle', fontWeight: 700 })}
      <rect x="30" y="96" width="400" height="34" fill="#f1f5f9" stroke={COL.gris} strokeWidth="2"/>
      {Array.from({ length: 41 }, (_, k) => <line key={k} x1={40 + k * 9} y1="96" x2={40 + k * 9} y2={k % 5 === 0 ? 118 : 108} stroke={COL.gris} strokeWidth="1.6"/>)}
      {T(436, 120, 'règle', { fontSize: 17, fill: COL.gris })}
      <rect x="30" y="168" width="360" height="22" fill="#e2e8f0" stroke={COL.gris} strokeWidth="2"/><rect x="30" y="148" width="14" height="62" fill="#94a3b8"/>
      <rect x="362" y="148" width="20" height="62" fill="#94a3b8"/><rect x="362" y="196" width="40" height="14" fill="#94a3b8"/>
      {T(200, 232, 'pied à coulisse', { textAnchor: 'middle', fontWeight: 700 })}
    </svg>);
  return (
    <svg viewBox="0 0 480 250" style={stl} role="img" aria-label="Montage : de l’eau est prélevée avec une éprouvette graduée ou une pipette jaugée, puis sa masse est mesurée avec une balance.">
      <rect x="40" y="44" width="46" height="150" rx="6" fill="#e0f2fe" stroke={COL.bleu} strokeWidth="2.4"/>
      {Array.from({ length: 6 }, (_, k) => <line key={k} x1="40" y1={64 + k * 24} x2="58" y2={64 + k * 24} stroke={COL.bleu} strokeWidth="1.8"/>)}
      <rect x="40" y="94" width="46" height="100" fill={COL.bleu} opacity="0.35"/>
      {T(63, 220, 'éprouvette', { textAnchor: 'middle', fontSize: 17 })}
      <path d="M150,34 L150,70 C150,86 138,86 138,110 L138,150 L162,150 L162,110 C162,86 150,86 150,70 Z" fill="#e0f2fe" stroke={COL.bleu} strokeWidth="2.4"/>
      <rect x="147" y="150" width="6" height="44" fill={COL.bleu} opacity="0.6"/>
      {T(150, 220, 'pipette jaugée', { textAnchor: 'middle', fontSize: 17 })}
      <path d="M286,130 L296,176 L336,176 L346,130 Z" fill="#e0f2fe" stroke={COL.bleu} strokeWidth="2.4"/>
      <rect x="260" y="176" width="112" height="46" rx="10" fill="#f1f5f9" stroke={COL.gris} strokeWidth="2.4"/>
      <rect x="290" y="186" width="52" height="26" rx="5" fill="white" stroke={COL.gris}/>
      {T(316, 206, 'm = ? g', { textAnchor: 'middle', fontSize: 17, fontWeight: 700 })}
      <path d="M200,110 C230,90 250,100 282,124" fill="none" stroke={COL.orange} strokeWidth="2.6" strokeDasharray="6 5"/><polygon points="290,130 276,126 282,114" fill={COL.orange}/>
      {T(400, 190, 'balance', { fontSize: 17, textAnchor: 'start' })}
    </svg>);
}

// ---------- bilan : la chaîne complète ----------
export function SceneChaineMesure() {
  const caisse = (x, y, w, h, t1, t2, c) => (<g>
    <rect x={x} y={y} width={w} height={h} rx="10" fill="white" stroke={c} strokeWidth="2.4"/>
    <text x={x + w / 2} y={y + 25} fontSize="17" fontWeight="700" textAnchor="middle" fill={c}>{t1}</text>
    <text x={x + w / 2} y={y + 46} fontSize="16" textAnchor="middle" fill={COL.encre}>{t2}</text></g>);
  const fl = (x1, y1, x2, y2) => <g stroke={COL.gris} fill={COL.gris}><line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="2.6"/></g>;
  return (
    <svg viewBox="0 0 480 262" style={stl} role="img" aria-label="Résumé : on répète la mesure pour obtenir une série ; on la range dans un histogramme ; on en tire une moyenne (le centre) et un écart-type (la largeur). Trois hypothèses : mesures indépendantes, série à peu près symétrique, écart-type qui décrit la série et non l’erreur sur la moyenne.">
      {caisse(14, 18, 210, 62, '1. Répéter', 'une série de mesures', COL.bleu)}
      {caisse(256, 18, 210, 62, '2. Ranger', 'l’histogramme', COL.violet)}
      {fl(224, 49, 250, 49)}<polygon points="256,49 245,43 245,55" fill={COL.gris}/>
      {fl(361, 80, 361, 100)}<polygon points="361,110 355,99 367,99" fill={COL.gris}/>
      {caisse(256, 112, 210, 62, '3. Résumer', 'moyenne et écart-type', COL.orange)}
      {caisse(14, 112, 210, 62, 'Le centre : la moyenne', 'La largeur : l’écart-type', COL.vert)}
      {fl(256, 143, 232, 143)}<polygon points="224,143 235,137 235,149" fill={COL.gris}/>
      <rect x="14" y="196" width="452" height="52" rx="10" fill="#eff6ff" stroke={COL.bleu} strokeWidth="2"/>
      <text x="240" y="219" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>Valable si les mesures sont indépendantes</text>
      <text x="240" y="239" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>et à peu près symétriques</text>
    </svg>);
}
