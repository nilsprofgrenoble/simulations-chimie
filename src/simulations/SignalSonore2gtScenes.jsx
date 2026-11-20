// ====================================================
//  Scènes (schémas animés par les réglages) de la simulation « Signal sonore : période, fréquence, hauteur et timbre » (2GT).
//  Tous les SVG : width 100 %, maxWidth 480, centrés ; textes ≥ 16 unités (viewBox de 480 de large).
//  Oscillogramme : tension en fonction du temps, 10 carreaux en largeur ; la base de temps est donnée par le réglage « base ».
// ====================================================
import { useId } from "react";
import * as M from "./signalSonore2gtModele";

const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', encre: '#0f172a', violet: '#6d28d9' };
const stl = { width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb' };
const halo = { paintOrder: 'stroke', stroke: '#fff', strokeWidth: 4, strokeLinejoin: 'round' };
const PX0 = 56, DIV = 41, PX1 = PX0 + 10 * DIV;                      // 10 carreaux en largeur
const nbTick = x => M.nbc(x, 3);

// Flèche à deux pointes, horizontale
const fleche2 = (x1, x2, y, c) => (
  <g stroke={c} fill={c}>
    <line x1={x1 + 7} y1={y} x2={x2 - 7} y2={y} strokeWidth="2.6"/>
    <polygon points={`${x1},${y} ${x1 + 10},${y - 5} ${x1 + 10},${y + 5}`} stroke="none"/>
    <polygon points={`${x2},${y} ${x2 - 10},${y - 5} ${x2 - 10},${y + 5}`} stroke="none"/>
  </g>);

// ---------- oscillogramme ----------
// forme, T, dec (ms) : signal ; A (V) : amplitude ; base : durée d'un carreau (dans l'unité uT) ; compact : 4 carreaux en hauteur au lieu de 6
// sansEchelle : pas de nombres sur les axes (« temps » seulement) ; sommet : { t0 } colore en orange un motif entier à partir de t0 ;
// fleche : { t1, t2, texte } double flèche (période) ; curseurs : { c1, c2, texte } deux repères de mesure ; nom : étiquette du signal
export function Oscillogramme({ forme = 'sinus', T = 4, A = 1, dec = 0, base = 1, uT = 'ms', compact = false, sansEchelle = false, sens = 0.5, couleur = COL.bleu,
  motifOrange = null, fleche = null, curseurs = null, nom = '', aria = '', fonction = null }) {
  const id = useId().replace(/:/g, '');
  const divV = compact ? 4 : 6, hd = compact ? 22 : 27, PY0 = compact ? 30 : 36, PY1 = PY0 + divV * hd, YC = (PY0 + PY1) / 2;
  const Hsvg = PY1 + (compact ? 30 : 34) + (compact ? 0 : 0);
  const tmax = 10 * base, X = t => PX0 + t / tmax * (PX1 - PX0), Y = v => YC - v / sens * hd;
  const nMotifs = tmax / T, N = Math.min(6000, Math.max(600, Math.round(24 * nMotifs)));
  const val = fonction || (t => M.tension(forme, A, T, t, dec));
  const pts = []; for (let i = 0; i <= N; i++) { const t = i / N * tmax; pts.push(`${X(t).toFixed(1)},${Y(val(t)).toFixed(1)}`); }
  let orange = null;
  if (motifOrange) {
    const n2 = 160, p2 = []; for (let i = 0; i <= n2; i++) { const t = motifOrange.t0 + i / n2 * T; if (t < 0 || t > tmax) continue; p2.push(`${X(t).toFixed(1)},${Y(val(t)).toFixed(1)}`); }
    orange = p2.join(' ');
  }
  const ticks = []; for (let k = 0; k <= 10; k++) ticks.push(k);
  const labelY = PY1 + 20;
  const pasLab = ticks.some(k => String(nbTick(k * base)).length > 4) ? 2 : 1;   // étiquettes longues : une sur deux
  return (
    <svg viewBox={`0 0 480 ${Hsvg}`} style={stl} role="img" aria-label={aria || `Oscillogramme : tension en fonction du temps${sansEchelle ? '' : `, ${nbTick(base)} ${uT} par carreau`}.${nom ? ` ${nom}.` : ''}`}>
      <defs><clipPath id={`cl${id}`}><rect x={PX0} y={PY0} width={PX1 - PX0} height={PY1 - PY0}/></clipPath></defs>
      <rect x={PX0} y={PY0} width={PX1 - PX0} height={PY1 - PY0} fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5"/>
      {ticks.map(k => <line key={`v${k}`} x1={PX0 + k * DIV} y1={PY0} x2={PX0 + k * DIV} y2={PY1} stroke="#d5dfeb" strokeWidth="1"/>)}
      {Array.from({ length: divV + 1 }, (_, k) => <line key={`h${k}`} x1={PX0} y1={PY0 + k * hd} x2={PX1} y2={PY0 + k * hd} stroke={k === divV / 2 ? '#94a3b8' : '#d5dfeb'} strokeWidth={k === divV / 2 ? 1.6 : 1}/>)}
      {/* nom du signal et unité de la tension */}
      {nom && <text x={PX1} y={PY0 - 8} fontSize="16" fontWeight="700" textAnchor="end" fill={COL.encre}>{nom}</text>}
      <text x="6" y={PY0 - 8} fontSize="18" fill={COL.gris}>{sansEchelle ? 'tension' : 'u (V)'}</text>
      {/* graduations de la tension : 0 et ± 2 carreaux (± 1 carreau en version compacte) */}
      {!sansEchelle && (compact ? [-1, 0, 1] : [-2, 0, 2]).map(k => <text key={k} x={PX0 - 6} y={YC - k * hd + 5} fontSize="18" textAnchor="end" fill={COL.gris}>{k === 0 ? '0' : (k < 0 ? '−' : '') + nbTick(Math.abs(k) * sens)}</text>)}
      {/* graduations du temps : un nombre par carreau */}
      {sansEchelle
        ? <text x={PX1} y={labelY} fontSize="18" textAnchor="end" fill={COL.gris}>temps →</text>
        : <>{ticks.filter(k => k % pasLab === 0).map(k => <text key={`t${k}`} x={PX0 + k * DIV} y={labelY} fontSize="18" textAnchor="middle" fill={COL.gris}>{nbTick(k * base)}</text>)}
            <text x="6" y={labelY} fontSize="18" fill={COL.gris}>t({uT})</text></>}
      <g clipPath={`url(#cl${id})`}>
        <polyline points={pts.join(' ')} fill="none" stroke={couleur} strokeWidth="2.8" strokeLinejoin="round"/>
        {orange && <polyline points={orange} fill="none" stroke={COL.orange} strokeWidth="4.6" strokeLinejoin="round" strokeLinecap="round"/>}
      </g>
      {fleche && <g>
        <line x1={X(fleche.t1)} y1={PY0} x2={X(fleche.t1)} y2={PY1} stroke={COL.orange} strokeWidth="1.8" strokeDasharray="5 4"/>
        <line x1={X(fleche.t2)} y1={PY0} x2={X(fleche.t2)} y2={PY1} stroke={COL.orange} strokeWidth="1.8" strokeDasharray="5 4"/>
        {fleche2(X(fleche.t1), X(fleche.t2), PY0 + 12, COL.orange)}
        <text x={(X(fleche.t1) + X(fleche.t2)) / 2} y={PY0 - 8} fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.orange} style={halo}>{fleche.texte}</text>
      </g>}
      {curseurs && <g>
        <line x1={X(curseurs.c1)} y1={PY0} x2={X(curseurs.c1)} y2={PY1} stroke={COL.violet} strokeWidth="2.4" strokeDasharray="6 4"/>
        <line x1={X(curseurs.c2)} y1={PY0} x2={X(curseurs.c2)} y2={PY1} stroke={COL.violet} strokeWidth="2.4" strokeDasharray="6 4"/>
        {fleche2(X(curseurs.c1), X(curseurs.c2), PY0 + 12, COL.violet)}
        {curseurs.texte && <text x={(X(curseurs.c1) + X(curseurs.c2)) / 2} y={PY0 - 8} fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.violet} style={halo}>{curseurs.texte}</text>}
      </g>}
    </svg>);
}

// Un claquement : une salve irrégulière qui s'éteint (signal non périodique), en volts, t en ms
// eslint-disable-next-line react-refresh/only-export-components
export const claquement = t => {
  if (t < 1.2) return 0.03 * Math.sin(37 * t) + 0.02 * Math.sin(53 * t + 1);
  const e = Math.exp(-(t - 1.2) / 1.7);
  return Math.max(-0.95, Math.min(0.95, 0.9 * e * (0.62 * Math.sin(7.3 * t) + 0.5 * Math.sin(13.1 * t + 1) + 0.42 * Math.sin(21.7 * t + 2) + 0.2 * Math.sin(37.9 * t)) / 1.1));
};

// ---------- plusieurs oscillogrammes empilés (comparaisons) ----------
export function PileOscillos({ signaux }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{signaux.map((s, i) => <Oscillogramme key={i} compact {...s}/>)}</div>;
}

// ---------- domaines de fréquences ----------
export function SceneDomaines() {
  return (
    <svg viewBox="0 0 480 262" style={stl} role="img" aria-label="Axe des fréquences, de gauche à droite : les infrasons en dessous de 20 hertz, les sons audibles de 20 hertz à 20 kilohertz, les ultrasons au-dessus de 20 kilohertz. L’échelle n’est pas proportionnelle.">
      <text x="240" y="26" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>La fréquence d’un son</text>
      <rect x="14" y="48" width="118" height="54" rx="8" fill="#e0f2fe" stroke={COL.bleu} strokeWidth="2"/>
      <rect x="132" y="48" width="226" height="54" rx="8" fill="#dcfce7" stroke={COL.vert} strokeWidth="2"/>
      <rect x="358" y="48" width="108" height="54" rx="8" fill="#ede9fe" stroke={COL.violet} strokeWidth="2"/>
      <text x="73" y="72" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.bleu}>Infrasons</text>
      <text x="73" y="92" fontSize="16" textAnchor="middle" fill={COL.encre}>très graves</text>
      <text x="245" y="72" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.vert}>Sons audibles</text>
      <text x="245" y="92" fontSize="16" textAnchor="middle" fill={COL.encre}>on les entend</text>
      <text x="412" y="72" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.violet}>Ultrasons</text>
      <text x="412" y="92" fontSize="16" textAnchor="middle" fill={COL.encre}>très aigus</text>
      <line x1="132" y1="104" x2="132" y2="128" stroke={COL.encre} strokeWidth="2"/>
      <line x1="358" y1="104" x2="358" y2="128" stroke={COL.encre} strokeWidth="2"/>
      <text x="132" y="148" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.orange}>20 Hz</text>
      <text x="358" y="148" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.orange}>20 kHz</text>
      <text x="358" y="168" fontSize="16" textAnchor="middle" fill={COL.encre}>= 20 000 Hz</text>
      <line x1="14" y1="184" x2="462" y2="184" stroke={COL.gris} strokeWidth="2.4"/>
      <polygon points="470,184 458,178 458,190" fill={COL.gris}/>
      <text x="14" y="206" fontSize="16" fill={COL.gris}>fréquence qui augmente →</text>
      <text x="73" y="234" fontSize="16" textAnchor="middle" fill={COL.encre}>séismes,</text>
      <text x="73" y="252" fontSize="16" textAnchor="middle" fill={COL.encre}>éléphants</text>
      <text x="245" y="234" fontSize="16" textAnchor="middle" fill={COL.encre}>voix, musique,</text>
      <text x="245" y="252" fontSize="16" textAnchor="middle" fill={COL.encre}>bruits du quotidien</text>
      <text x="412" y="234" fontSize="16" textAnchor="middle" fill={COL.encre}>sonars,</text>
      <text x="412" y="252" fontSize="16" textAnchor="middle" fill={COL.encre}>échographie</text>
    </svg>);
}

// ---------- bilan : la chaîne complète ----------
export function SceneChaineSon({ T = '2,5 ms', f = '400 Hz' }) {
  const caisse = (x, y, w, h, t1, t2, c) => (<g>
    <rect x={x} y={y} width={w} height={h} rx="10" fill="white" stroke={c} strokeWidth="2.4"/>
    <text x={x + w / 2} y={y + 25} fontSize="17" fontWeight="700" textAnchor="middle" fill={c}>{t1}</text>
    <text x={x + w / 2} y={y + 46} fontSize="16" textAnchor="middle" fill={COL.encre}>{t2}</text></g>);
  return (
    <svg viewBox="0 0 480 262" style={stl} role="img" aria-label={`De l’écran à la fréquence : on mesure la durée de plusieurs motifs, on divise par leur nombre pour obtenir la période T = ${T}, on la convertit en secondes, puis f = 1 ÷ T = ${f}.`}>
      {caisse(14, 18, 210, 62, '1. Mesurer', 'Δt pour N motifs', COL.violet)}
      {caisse(256, 18, 210, 62, '2. Période', 'T = Δt ÷ N', COL.orange)}
      <g stroke={COL.gris} fill={COL.gris}><line x1="224" y1="49" x2="248" y2="49" strokeWidth="2.6"/><polygon points="256,49 245,43 245,55" stroke="none"/></g>
      <g stroke={COL.gris} fill={COL.gris}><line x1="361" y1="80" x2="361" y2="102" strokeWidth="2.6"/><polygon points="361,110 355,99 367,99" stroke="none"/></g>
      {caisse(256, 112, 210, 62, '3. En secondes', 'ms ÷ 1 000', COL.bleu)}
      <g stroke={COL.gris} fill={COL.gris}><line x1="256" y1="143" x2="232" y2="143" strokeWidth="2.6"/><polygon points="224,143 235,137 235,149" stroke="none"/></g>
      {caisse(14, 112, 210, 62, '4. Fréquence', 'f = 1 ÷ T', COL.vert)}
      <rect x="14" y="196" width="452" height="52" rx="10" fill="#eff6ff" stroke={COL.bleu} strokeWidth="2"/>
      <text x="240" y="219" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>Puis : f grande, son aigu ; forme, timbre ;</text>
      <text x="240" y="239" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.encre}>amplitude grande, son fort</text>
    </svg>);
}
