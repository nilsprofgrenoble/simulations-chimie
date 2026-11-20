// ====================================================
//  Scènes (schémas) de la simulation « Niveau sonore et dangers de l'exposition » (2GT, sim 192).
//  Tous les SVG : width 100 %, maxWidth 480, centrés ; textes ≥ 16 unités (viewBox de 480 de large).
//  Règle : une scène ne montre jamais la valeur que l'élève doit trouver (paramètre « inconnu » → « ? »).
// ====================================================
import { DUREES, formatDuree } from "./niveauSonore2gtModele";

const NB = ' ';
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', encre: '#0f172a', clair: '#e2e8f0' };
const stl = { width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb' };
const dbTxt = v => `${v}${NB}dB`;

// ---------- petits dessins ----------
// Enceinte (x, y = centre du cône) et trois arcs de son vers la droite ; epais = épaisseur des arcs (amplitude)
export function Enceinte({ x, y, s = 1, arcs = true, epais = 2.2, couleur = COL.bleu }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x="-16" y="-26" width="32" height="52" rx="5" fill="#334155" stroke="#0f172a" strokeWidth="1.5"/>
      <circle cx="0" cy="-9" r="5" fill="#94a3b8"/><circle cx="0" cy="10" r="10" fill="#cbd5e1" stroke="#0f172a" strokeWidth="1.2"/><circle cx="0" cy="10" r="4" fill="#475569"/>
      {arcs && [0, 1, 2].map(i => <path key={i} d={`M ${24 + i * 11},${-9 - i * 6} Q ${33 + i * 11},0 ${24 + i * 11},${9 + i * 6}`} fill="none" stroke={couleur} strokeWidth={epais} strokeLinecap="round" opacity={1 - i * 0.22}/>)}
    </g>);
}
// Sonomètre : boîtier avec micro et écran (x, y = coin haut gauche) ; valeur = nombre de dB, ou inconnu → « ? dB »
export function Sonometre({ x, y, valeur, inconnu = false, w = 112, couleur = '#86efac' }) {
  return (
    <g>
      <rect x={x + w / 2 - 4} y={y - 14} width="8" height="16" rx="3" fill="#475569"/>
      <rect x={x} y={y} width={w} height={56} rx="9" fill="#1e293b" stroke="#0f172a" strokeWidth="2"/>
      <rect x={x + 8} y={y + 8} width={w - 16} height={40} rx="5" fill="#0f172a"/>
      <text x={x + w / 2} y={y + 36} textAnchor="middle" fontSize="22" fontWeight="700" fill={inconnu ? '#fca5a5' : couleur} style={{ fontFamily: 'monospace' }}>{inconnu ? `?${NB}dB` : dbTxt(valeur)}</text>
    </g>);
}
function Moto({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="-26" cy="14" r="13" fill="#e2e8f0" stroke="#0f172a" strokeWidth="6"/><circle cx="26" cy="14" r="13" fill="#e2e8f0" stroke="#0f172a" strokeWidth="6"/>
      <path d="M26,14 L18,-8 M18,-8 L22,-18 M12,-18 L30,-18" fill="none" stroke="#475569" strokeWidth="4"/>
      <path d="M-26,14 L-6,0 L14,0 L18,-8 L-14,-8 Z" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="2"/>
      <rect x="-8" y="2" width="20" height="14" rx="3" fill="#64748b" stroke="#0f172a" strokeWidth="2"/>
      <rect x="-22" y="-14" width="22" height="7" rx="3" fill="#0f172a"/>
      <path d="M-30,18 L-44,22" stroke="#94a3b8" strokeWidth="4"/>
    </g>);
}
// Onde sinusoïdale : (x0, yc) = début et ligne de repos ; A = amplitude ; L = longueur ; nPer = nombre de périodes
const sinus = (x0, yc, A, L, nPer) => Array.from({ length: 61 }, (_, i) => `${x0 + (L * i) / 60},${(yc - A * Math.sin((2 * Math.PI * nPer * i) / 60)).toFixed(1)}`).join(' ');

// ---------- scène : trois sons de même note, d'amplitudes différentes (étape 1) ----------
export function SceneAmplitude({ amplitudes = { C: 12, D: 40, E: 24 } }) {
  return (
    <svg viewBox="0 0 480 232" style={stl} role="img" aria-label="Trois enregistrements de micro, de même note : le son C a une petite vibration, le son D une grande, le son E une vibration moyenne.">
      {Object.entries(amplitudes).map(([nom, A], i) => {
        const x = 12 + i * 156;
        return (
          <g key={nom}>
            <rect x={x} y="14" width="144" height="146" rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5"/>
            <line x1={x + 6} y1="87" x2={x + 138} y2="87" stroke="#94a3b8" strokeDasharray="4 4"/>
            <polyline points={sinus(x + 8, 87, A, 128, 2.5)} fill="none" stroke={COL.bleu} strokeWidth="3" strokeLinejoin="round"/>
            <text x={x + 72} y="196" textAnchor="middle" fontSize="20" fontWeight="700" fill={COL.encre}>Son {nom}</text>
          </g>);
      })}
      <text x="240" y="224" textAnchor="middle" fontSize="16" fill={COL.gris}>Courbes tracées par le micro (même échelle, même note)</text>
    </svg>);
}

// ---------- scène : deux haut-parleurs identiques, chacun avec son sonomètre (étapes 2 et 5) ----------
export function SceneDeuxSonometres({ a, b, legende = 'Même haut-parleur, même distance' }) {
  const bloc = (x, d) => (
    <g>
      <Enceinte x={x + 28} y={70} s={1.15}/>
      <Sonometre x={x + 40} y={146} valeur={d.valeur} inconnu={d.inconnu}/>
      <text x={x + 96} y={228} textAnchor="middle" fontSize="20" fontWeight="700" fill={COL.encre}>{d.nom}</text>
    </g>);
  return (
    <svg viewBox="0 0 480 270" style={stl} role="img" aria-label={`Deux sons, ${a.nom} et ${b.nom}, mesurés par un sonomètre à la même distance du même haut-parleur : ${a.inconnu ? 'valeur à trouver' : dbTxt(a.valeur)} pour ${a.nom}, ${b.inconnu ? 'valeur à trouver' : dbTxt(b.valeur)} pour ${b.nom}.`}>
      {bloc(20, a)}{bloc(250, b)}
      <text x="240" y="259" textAnchor="middle" fontSize="16" fill={COL.gris}>{legende}</text>
    </svg>);
}

// ---------- scène : une source puis deux sources identiques (étape 6) ----------
export function SceneSources({ L1 = 80, inconnu = true, L2 = null, nom = 'moto' }) {
  return (
    <svg viewBox="0 0 480 270" style={stl} role="img" aria-label={`À gauche, une ${nom} seule : le sonomètre affiche ${dbTxt(L1)}. À droite, deux ${nom}s identiques en même temps : le sonomètre affiche ${inconnu ? 'une valeur à trouver' : dbTxt(L2)}.`}>
      <Moto x={78} y={86} s={1.1}/><Sonometre x={42} y={146} valeur={L1}/>
      <text x="98" y="228" textAnchor="middle" fontSize="20" fontWeight="700" fill={COL.encre}>1 {nom}</text>
      <line x1="240" y1="30" x2="240" y2="236" stroke="#cbd5e1" strokeDasharray="5 5"/>
      <Moto x={316} y={60} s={1}/><Moto x={344} y={100} s={1}/><Sonometre x={290} y={146} valeur={L2} inconnu={inconnu}/>
      <text x="346" y="228" textAnchor="middle" fontSize="20" fontWeight="700" fill={COL.encre}>2 {nom}s ensemble</text>
      <text x="240" y="259" textAnchor="middle" fontSize="16" fill={COL.gris}>Mêmes {nom}s, sonomètre à la même distance</text>
    </svg>);
}

// ---------- scène : le sonomètre à 1 m puis à 4 m (étape 7) ----------
export function SceneDistance({ L1 = 90, L2 = null, inconnu = true }) {
  return (
    <svg viewBox="0 0 480 270" style={stl} role="img" aria-label={`Une enceinte, avec un sonomètre à 1 mètre qui affiche ${dbTxt(L1)} et un sonomètre à 4 mètres qui affiche ${inconnu ? 'une valeur à trouver' : dbTxt(L2)}.`}>
      <Enceinte x={36} y={86} s={1.2}/>
      <line x1="36" y1="196" x2="450" y2="196" stroke={COL.gris} strokeWidth="2"/>
      {[[36, '0'], [156, '1 m'], [396, '4 m']].map(([x, t]) => <g key={t}><line x1={x} y1="190" x2={x} y2="202" stroke={COL.gris} strokeWidth="2"/><text x={x} y="224" textAnchor="middle" fontSize="18" fontWeight="700" fill={COL.encre}>{t}</text></g>)}
      <Sonometre x={100} y={100} valeur={L1} w={112}/>
      <Sonometre x={340} y={100} valeur={L2} inconnu={inconnu} w={112}/>
      <text x="240" y="259" textAnchor="middle" fontSize="16" fill={COL.gris}>Même enceinte, même son, deux distances</text>
    </svg>);
}

// ---------- scène : les trois dangers (étape 8) ----------
export function SceneDangers() {
  const ligne = (y, c, titre, sous, tag) => (
    <g>
      <rect x="22" y={y} width="436" height="62" rx="12" fill="white" stroke={c} strokeWidth="2.5"/>
      <rect x="22" y={y} width="12" height="62" rx="6" fill={c}/>
      <text x="48" y={y + 27} fontSize="20" fontWeight="700" fill={COL.encre}>{titre}</text>
      <text x="48" y={y + 50} fontSize="16" fill={COL.encre}>{sous}</text>
      <text x="446" y={y + 27} textAnchor="end" fontSize="15" fontWeight="700" fill={c}>{tag}</text>
    </g>);
  return (
    <svg viewBox="0 0 480 330" style={stl} role="img" aria-label="Trois conséquences possibles d'un son trop fort ou trop long : la fatigue auditive, temporaire ; les acouphènes, des sifflements ; la surdité, définitive.">
      <text x="240" y="26" textAnchor="middle" fontSize="18" fontWeight="700" fill={COL.encre}>Un son trop fort ou trop long abîme l’oreille</text>
      {ligne(42, '#ca8a04', 'Fatigue auditive', 'On entend moins bien, pendant un moment', 'temporaire')}
      {ligne(118, '#ea580c', 'Acouphènes', 'Sifflements ou bourdonnements dans l’oreille', 'parfois durable')}
      {ligne(194, COL.rouge, 'Surdité', 'Perte d’audition qui ne revient pas', 'définitive')}
      <text x="240" y="288" textAnchor="middle" fontSize="16" fill={COL.encre}>Souvent sans douleur, et sans qu’on s’en rende compte.</text>
      <text x="240" y="312" textAnchor="middle" fontSize="16" fill={COL.encre}>Les dégâts s’additionnent avec le temps.</text>
    </svg>);
}

// ---------- scène : durées repères selon le niveau (étape 9, défi) ----------
export function SceneDurees({ surligne = null }) {
  const x0 = 78, L = 300;
  return (
    <svg viewBox="0 0 480 262" style={stl} role="img" aria-label={`Durées repères d'exposition selon le niveau sonore : ${DUREES.map(([n, t]) => `${n} dB, ${formatDuree(t).replace(/\u00a0/g, ' ')}`).join(' ; ')}. Plus le niveau est élevé, plus la durée repère est courte.`}>
      <text x="240" y="24" textAnchor="middle" fontSize="18" fontWeight="700" fill={COL.encre}>Durée repère de l’exposition (indicative)</text>
      {DUREES.map(([n, t], i) => {
        const y = 40 + i * 33, w = Math.max(6, (t / 480) * L), on = surligne === n;
        return (
          <g key={n}>
            {on && <rect x="4" y={y - 3} width="472" height="30" rx="8" fill="#fef3c7" stroke={COL.orange} strokeWidth="1.5"/>}
            <text x="66" y={y + 18} textAnchor="end" fontSize="18" fontWeight="700" fill={COL.encre}>{n}{NB}dB</text>
            <rect x={x0} y={y} width={w} height="24" rx="4" fill={n >= 97 ? '#dc2626' : n >= 91 ? '#ea580c' : '#f59e0b'}/>
            <text x={x0 + w + 8} y={y + 18} fontSize="18" fontWeight="700" fill={COL.encre}>{formatDuree(t)}</text>
          </g>);
      })}
      <text x="240" y="254" textAnchor="middle" fontSize="16" fill={COL.gris}>Plus le son est fort, moins on doit y rester longtemps.</text>
    </svg>);
}

// ---------- scène : un concert (étape 10) ----------
export function SceneConcert() {
  const gens = Array.from({ length: 14 }, (_, i) => ({ x: 40 + (i % 7) * 66 + (i > 6 ? 30 : 0), y: 190 + Math.floor(i / 7) * 40 }));
  return (
    <svg viewBox="0 0 480 270" style={stl} role="img" aria-label="Une scène de concert avec deux grandes enceintes et du public. Le niveau sonore près de la scène est de 100 décibels.">
      <rect x="20" y="20" width="440" height="96" rx="8" fill="#334155"/>
      <Enceinte x={92} y={68} s={1.25} arcs={false}/><Enceinte x={388} y={68} s={1.25} arcs={false}/>
      {[0, 1, 2].map(i => <path key={i} d={`M ${130 + i * 14},${50 - i * 6} Q ${146 + i * 14},68 ${130 + i * 14},${86 + i * 6}`} fill="none" stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round" opacity={1 - i * 0.25}/>)}
      {gens.map((g, i) => <g key={i}><circle cx={g.x} cy={g.y} r="11" fill="#94a3b8"/><rect x={g.x - 12} y={g.y + 12} width="24" height="22" rx="8" fill="#64748b"/></g>)}
      <text x="240" y="150" textAnchor="middle" fontSize="18" fontWeight="700" fill={COL.encre}>Près de la scène : 100{NB}dB</text>
      <text x="240" y="262" textAnchor="middle" fontSize="16" fill={COL.gris}>Un concert (le niveau varie selon l’endroit où l’on se place)</text>
    </svg>);
}

// ---------- scène : un smartphone qui mesure (étape 11) ----------
export function SceneSmartphone({ valeur = 76, lieu = 'Cantine du lycée', cache = false }) {
  const ang = -90 + (Math.min(120, Math.max(30, valeur)) - 30) / 90 * 180;
  return (
    <svg viewBox="0 0 480 290" style={stl} role="img" aria-label={`Un smartphone avec une application de sonomètre : ${lieu}, l'application affiche ${cache ? 'une valeur' : dbTxt(valeur)}.`}>
      <rect x="150" y="14" width="180" height="262" rx="26" fill="#1e293b" stroke="#0f172a" strokeWidth="3"/>
      <rect x="162" y="40" width="156" height="214" rx="10" fill="#f8fafc"/>
      <circle cx="240" cy="27" r="4" fill="#64748b"/>
      <text x="240" y="66" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>Sonomètre</text>
      <path d="M 186,176 A 54,54 0 0 1 294,176" fill="none" stroke="#e2e8f0" strokeWidth="16"/>
      <path d="M 186,176 A 54,54 0 0 1 222,125" fill="none" stroke="#86efac" strokeWidth="16"/>
      <path d="M 222,125 A 54,54 0 0 1 262,125" fill="none" stroke="#fcd34d" strokeWidth="16"/>
      <path d="M 262,125 A 54,54 0 0 1 294,176" fill="none" stroke="#fca5a5" strokeWidth="16"/>
      <line x1="240" y1="176" x2={240 + 46 * Math.sin((ang * Math.PI) / 180)} y2={176 - 46 * Math.cos((ang * Math.PI) / 180)} stroke={COL.encre} strokeWidth="4" strokeLinecap="round"/>
      <circle cx="240" cy="176" r="7" fill={COL.encre}/>
      <text x="240" y="222" textAnchor="middle" fontSize="26" fontWeight="700" fill={COL.encre}>{cache ? `?${NB}dB` : dbTxt(valeur)}</text>
      <text x="240" y="244" textAnchor="middle" fontSize="15" fill={COL.gris}>{lieu}</text>
      {[0, 1, 2].map(i => <path key={i} d={`M ${116 - i * 12},${70 + i * 2} Q ${106 - i * 12},${110} ${116 - i * 12},${150 - i * 2}`} fill="none" stroke={COL.bleu} strokeWidth="3" strokeLinecap="round" opacity={1 - i * 0.25}/>)}
      <text x="60" y="190" textAnchor="middle" fontSize="16" fill={COL.gris}>son</text>
    </svg>);
}

// ---------- l'échelle verticale des niveaux sonores (étapes 3 et 12, défi, exploration) ----------
// marqueurs : [{ db, nom, cache }] ; niveau : pointeur noir (exploration) ; ids : liste d'ids de SONS à afficher (défaut : tous sauf 'douleur' doublon)
export function EchelleDb({ marqueurs, niveau = null, aria = '', graduations = 20, hauteur = 400 }) {
  const y = d => (hauteur - 28) - d * 2.45 * (hauteur - 28) / 372;
  const W = niveau != null ? 480 : 370, x0 = niveau != null ? 92 : 62;                     // plus étroit sans repère mobile : le texte reste lisible sur téléphone
  const M = marqueurs.slice().sort((a, b) => a.db - b.db);
  return (
    <svg viewBox={`0 0 ${W} ${hauteur}`} style={{ ...stl, maxWidth: W }} role="img" aria-label={aria || `Échelle des niveaux sonores de 0 à 140 décibels : ${M.map(m => `${m.nom}${m.cache ? ', à lire' : `, ${m.db} dB`}`).join(' ; ')}.`}>
      <text x={x0 - 40} y="12" fontSize="18" fontWeight="700" fill={COL.encre} textAnchor="middle">dB</text>
      {/* bande de couleur : sous 85 dB, de 85 à 120 dB, au-delà */}
      <rect x={x0} y={y(85)} width="14" height={y(0) - y(85)} fill="#bbf7d0"/><rect x={x0} y={y(120)} width="14" height={y(85) - y(120)} fill="#fed7aa"/><rect x={x0} y={y(140)} width="14" height={y(120) - y(140)} fill="#fecaca"/>
      <line x1={x0} y1={y(0)} x2={x0} y2={y(140)} stroke={COL.encre} strokeWidth="2.5"/>
      {Array.from({ length: 15 }, (_, i) => i * 10).map(d => (
        <g key={d}><line x1={x0 - (d % graduations === 0 ? 10 : 6)} y1={y(d)} x2={x0} y2={y(d)} stroke={COL.encre} strokeWidth={d % graduations === 0 ? 2 : 1.4}/>
          {d % graduations === 0 && <text x={x0 - 14} y={y(d) + 6} textAnchor="end" fontSize="17" fontWeight="700" fill={COL.encre}>{d}</text>}</g>))}
      {niveau != null && <g>
        <line x1={x0 - 4} y1={y(niveau)} x2="404" y2={y(niveau)} stroke={COL.encre} strokeWidth="2" strokeDasharray="6 4" opacity="0.3"/>
        <rect x="398" y={y(niveau) - 15} width="76" height="30" rx="8" fill={COL.encre}/><text x="436" y={y(niveau) + 6} textAnchor="middle" fontSize="17" fontWeight="700" fill="#86efac">{Math.round(niveau)}{NB}dB</text></g>}
      {M.map(m => (
        <g key={m.nom}>
          <line x1={x0 + 14} y1={y(m.db)} x2={x0 + 40} y2={y(m.db)} stroke={m.cache ? COL.rouge : COL.bleu} strokeWidth="2.5"/>
          <circle cx={x0 + 14} cy={y(m.db)} r="6" fill={m.cache ? 'white' : COL.bleu} stroke={m.cache ? COL.rouge : COL.bleu} strokeWidth="2.5"/>
          <text x={x0 + 46} y={y(m.db) + 6} fontSize="17" fontWeight="700" fill={m.cache ? COL.rouge : COL.encre} stroke="white" strokeWidth="4" paintOrder="stroke">{m.nom}{m.cache ? ' : ?' : ` : ${m.db}${NB}dB`}</text>
        </g>))}
    </svg>);
}

// ---------- sonomètre fictif de l'exploration ----------
export function SceneSonometreFictif({ a, r, n, L }) {
  const nb = Math.min(8, n), colonnes = nb > 4 ? 2 : 1, lignes = Math.ceil(nb / colonnes);
  const ypas = lignes > 1 ? 150 / lignes : 0;
  const xs = 200 + Math.log2(r) * 52;                       // position du sonomètre selon la distance (1, 2, 4, 8, 16 m)
  const A = 6 + 26 * Math.log10(a) / 2;                      // amplitude du dessin de la vibration
  const epais = 1.6 + 1.2 * Math.log10(a);
  return (
    <svg viewBox="0 0 480 290" style={stl} role="img" aria-label={`Sonomètre fictif : ${n} source${n > 1 ? 's' : ''} identique${n > 1 ? 's' : ''}, amplitude ${a}, sonomètre à ${r} mètre${r > 1 ? 's' : ''}. Il affiche environ ${Math.round(L)} décibels.`}>
      <rect x="8" y="8" width="150" height="58" rx="8" fill="#f8fafc" stroke="#cbd5e1"/>
      <polyline points={sinus(14, 37, A, 138, 3)} fill="none" stroke={COL.bleu} strokeWidth="2.6" strokeLinejoin="round"/>
      {Array.from({ length: nb }, (_, i) => {
        const col = i % colonnes, lig = Math.floor(i / colonnes);
        const cy = lignes > 1 ? 106 + lig * ypas + ypas / 2 - 12 : 170, cx = 34 + col * 34;
        return <Enceinte key={i} x={cx} y={cy} s={lignes > 2 ? 0.55 : lignes > 1 ? 0.7 : 1} arcs={false}/>;
      })}
      {[0, 1, 2].map(i => <path key={i} d={`M ${92 + i * 14 + (colonnes - 1) * 34},${150 - i * 7} Q ${106 + i * 14 + (colonnes - 1) * 34},170 ${92 + i * 14 + (colonnes - 1) * 34},${190 + i * 7}`} fill="none" stroke={COL.bleu} strokeWidth={epais} strokeLinecap="round" opacity={1 - i * 0.22}/>)}
      <line x1="34" y1="258" x2="462" y2="258" stroke={COL.gris} strokeWidth="2"/>
      {[1, 2, 4, 8, 16].map(d => { const x = 200 + Math.log2(d) * 52; return <g key={d}><line x1={x} y1="252" x2={x} y2="264" stroke={COL.gris} strokeWidth="2"/><text x={x} y="282" textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.gris}>{d}{NB}m</text></g>; })}
      <Sonometre x={xs - 42} y={118} valeur={Math.round(L)} w={84}/>
    </svg>);
}

// ---------- scène : l'escalier « + 10 dB = × 10 » (exemple de l'étape 4) ----------
export function SceneEscalier({ niveaux = [30, 40, 50], facteurs = ['× 1', '× 10', '× 100'] }) {
  const marches = niveaux.map((n, i) => ({ n, f: facteurs[i], x: 36 + i * 140, y: 150 - i * 44, h: 52 + i * 44 }));
  return (
    <svg viewBox="0 0 480 270" style={stl} role="img" aria-label={`Un escalier de trois marches : ${niveaux.join(', ')} décibels. À chaque marche de plus 10 décibels, l'intensité est multipliée par 10.`}>
      <text x="240" y="26" textAnchor="middle" fontSize="18" fontWeight="700" fill={COL.encre}>Chaque marche : + 10{NB}dB</text>
      {marches.map((m, i) => (
        <g key={m.n}>
          <rect x={m.x} y={m.y} width="124" height={m.h} rx="8" fill="#dbeafe" stroke={COL.bleu} strokeWidth="2.5"/>
          <text x={m.x + 62} y={m.y + 34} textAnchor="middle" fontSize="22" fontWeight="700" fill={COL.encre}>{m.n}{NB}dB</text>
          <text x={m.x + 62} y="228" textAnchor="middle" fontSize="20" fontWeight="700" fill={COL.orange}>{m.f}</text>
          {i > 0 && <text x={m.x - 8} y={m.y - 10} textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.vert}>+ 10{NB}dB</text>}
        </g>))}
      <line x1="26" y1="204" x2="454" y2="204" stroke={COL.gris}/>
      <text x="240" y="258" textAnchor="middle" fontSize="16" fill={COL.gris}>intensité par rapport au premier son</text>
    </svg>);
}
