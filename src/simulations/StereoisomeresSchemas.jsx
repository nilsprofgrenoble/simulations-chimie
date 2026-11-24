// Schémas de la simulation 144 (stéréoisomères, TSTL PCM) : couples de molécules en perspective de Cram, double liaison C=C avec ses quatre groupes, cartes « À retenir ».
// Règles : police ≥ 16 dans un viewBox de 400, caractères Unicode pour les indices, tout le texte dans le viewBox, pas de « / » ni de « ^ » dans une formule affichée.
import * as M from './stereoisomeresModele';
import { Cram, COUL_RANG } from './ChiraliteSchema';
import { KIT } from '../commun';

const COL = { bleu: '#0369a1', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', violet: '#7e22ce', gris: '#475569', encre: '#0f172a' };
const base = { width: '100%', maxWidth: 440, margin: '0 auto', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb', height: 'auto' };

// ═════════ Scène : une ou deux molécules en perspective de Cram ═════════
//  mol : molécule à deux centres ; items : [{ affs, miroir, legende, desc }] ; rangs : badges de priorité
export function CoupleCram({ mol, items, ariaLabel }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: items.length > 1 ? 'repeat(auto-fit, minmax(250px, 1fr))' : 'minmax(0, 1fr)', gap: 10, alignItems: 'start' }} aria-label={ariaLabel}>
      {items.map((it, i) => (
        <figure key={i} style={{ margin: 0, textAlign: 'center' }}>
          <div style={{ background: 'white', border: `1px ${it.pointille ? 'dashed' : 'solid'} #d5dfeb`, borderRadius: 8, padding: '4px 2px' }}>
            <Cram mol={mol} affs={it.affs} miroir={!!it.miroir} ariaLabel={`${it.legende} : ${mol.nom} en perspective de Cram, carbones C2 et C3`}/>
          </div>
          <figcaption style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginTop: 4, lineHeight: 1.4 }}>{it.legende}</figcaption>
        </figure>))}
    </div>);
}

// ═════════ Scène : une double liaison C=C et ses quatre groupes ═════════
//  haut : [bool, bool], le groupe prioritaire de chaque carbone est-il en haut ? ; rangs : badges 1 et 2 ; relier : trait entre les deux groupes prioritaires ; verdict : 'Z' | 'E' | null
export function SceneAlcene({ m, haut, rangs = false, relier = false, verdict = null, titre = '' }) {
  // La liaison arrive sur le PREMIER atome du groupe : à droite on écrit CH₂CH₃, à gauche H₃CH₂C (écriture inversée, comme sur une formule semi-développée).
  const X = [155, 265], BX = [112, 308], YC = 135, YTH = 62, YTB = 222, YBH = 58, YBB = 218;
  const inverse = et => (et.match(/[A-Z][a-z]?[₀-₉]*/g) || [et]).reverse().join('');
  const largeur = et => 13 * [...et].length;
  const centre = (k, et) => (k === 0 ? BX[0] - 6 - largeur(et) / 2 : BX[1] + 6 + largeur(et) / 2);
  const cote = (k, j) => (m.subs[k] ? (m.subs[k][0] === j ? (haut[k] ? 'haut' : 'bas') : (haut[k] ? 'bas' : 'haut')) : null);
  const groupes = [0, 1].map(k => {
    const vs = m.g.voisins[m.c[k]].map(v => v.j).filter(j => j !== m.c[1 - k]);
    if (m.subs[k]) return vs.map(j => ({ j, k, pos: cote(k, j), rang: m.subs[k][0] === j ? 1 : 2 }));
    return vs.map((j, i) => ({ j, k, pos: i === 0 ? 'haut' : 'bas', rang: 0 }));
  }).flat();
  const prio = groupes.filter(g => g.rang === 1);
  return (
    <svg viewBox="-20 0 460 270" role="img" style={base}
      aria-label={`Double liaison C=C de ${m.nom} : ${groupes.map(g => `${M.etiqAlc(m, g.j)} ${g.pos === 'haut' ? 'au-dessus' : 'au-dessous'} du carbone ${g.k === 0 ? 'de gauche' : 'de droite'}`).join(', ')}.${verdict ? ` Configuration ${verdict}.` : ''}`}>
      {titre && <text x="210" y="22" textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.encre}>{titre}</text>}
      {relier && prio.length === 2 && (() => {
        const [p, q] = prio, mm = p.pos === q.pos, col = mm ? COL.vert : COL.rouge, cp = centre(p.k, M.etiqAlc(m, p.j)), cq = centre(q.k, M.etiqAlc(m, q.j));
        return mm
          ? <g stroke={col} strokeWidth="3.5" strokeDasharray="7 5" fill="none"><path d={`M ${cp} ${p.pos === 'haut' ? 38 : 236} H ${cq}`}/><path d={`M ${cp} ${p.pos === 'haut' ? 38 : 236} V ${p.pos === 'haut' ? 46 : 228}`} strokeDasharray="none"/><path d={`M ${cq} ${p.pos === 'haut' ? 38 : 236} V ${p.pos === 'haut' ? 46 : 228}`} strokeDasharray="none"/></g>
          : <path d={`M ${cp} ${p.pos === 'haut' ? 74 : 200} L ${cq} ${q.pos === 'haut' ? 74 : 200}`} stroke={col} strokeWidth="3.5" strokeDasharray="7 5" fill="none"/>;
      })()}
      {[0, 1].map(k => <g key={k}>
        <line x1={X[k]} y1={YC} x2={BX[k]} y2={YBH} stroke={COL.encre} strokeWidth="3.4" strokeLinecap="round"/>
        <line x1={X[k]} y1={YC} x2={BX[k]} y2={YBB} stroke={COL.encre} strokeWidth="3.4" strokeLinecap="round"/>
      </g>)}
      <line x1={X[0]} y1={YC - 6} x2={X[1]} y2={YC - 6} stroke={COL.encre} strokeWidth="3.4"/>
      <line x1={X[0]} y1={YC + 6} x2={X[1]} y2={YC + 6} stroke={COL.encre} strokeWidth="3.4"/>
      {X.map((x, k) => <g key={k}><circle cx={x} cy={YC} r="15" fill="#fff" stroke="#64748b" strokeWidth="2.6"/><text x={x} y={YC + 6} textAnchor="middle" fontSize="18" fontWeight="800" fill="#475569">C</text></g>)}
      {groupes.map((g, i) => {
        const y = g.pos === 'haut' ? YTH : YTB, et = M.etiqAlc(m, g.j), by = g.pos === 'haut' ? y - 8 : y + 4;
        const bx = g.k === 0 ? BX[0] - 6 - largeur(et) - 18 : BX[1] + 6 + largeur(et) + 18;
        return (<g key={i}>
          <text data-groupe={et} x={g.k === 0 ? BX[0] - 6 : BX[1] + 6} y={y} textAnchor={g.k === 0 ? 'end' : 'start'} fontSize="21" fontWeight="800" fill={rangs && g.rang ? COUL_RANG[g.rang] : COL.encre}>{g.k === 0 ? inverse(et) : et}</text>
          {rangs && g.rang > 0 && <g><circle cx={bx} cy={by - 6} r="12" fill={COUL_RANG[g.rang]}/><text x={bx} y={by} textAnchor="middle" fontSize="17" fontWeight="800" fill="#fff">{g.rang}</text></g>}
        </g>);
      })}
      {verdict && <g><rect x="170" y="108" width="80" height="0" fill="none"/><text x="210" y="262" textAnchor="middle" fontSize="19" fontWeight="800" fill={verdict === 'Z' ? COL.vert : COL.rouge}>{verdict === 'Z' ? 'Z : priorités du même côté' : 'E : priorités de côtés opposés'}</text></g>}
    </svg>);
}

// ═════════ Scène : plusieurs alcènes l'un sous l'autre, repérés par une lettre (A, B, C…) ═════════
//  items : [{ lettre, m }] ; la double liaison de chaque molécule est dessinée avec ses quatre groupes (un seul dessin par molécule, sans choix Z/E).
export function ListeAlcenes({ items, ariaLabel }) {
  const H = 118, XC = [165, 275], BX = [130, 310];
  const inverse = et => (et.match(/[A-Z][a-z]?[₀-₉]*/g) || [et]).reverse().join('');
  return (
    <svg viewBox={`0 0 460 ${H * items.length}`} role="img" aria-label={ariaLabel} style={base}>
      {items.map(({ lettre, m }, r) => {
        const oy = r * H, yc = oy + 60;
        const groupes = [0, 1].map(k => m.g.voisins[m.c[k]].map(v => v.j).filter(j => j !== m.c[1 - k]).map((j, i) => ({ k, j, haut: i === 0 }))).flat();
        return (
          <g key={lettre} data-molecule={lettre}>
            {r > 0 && <line x1="10" y1={oy} x2="450" y2={oy} stroke="#e2e8f0" strokeWidth="2"/>}
            <circle cx="34" cy={yc} r="20" fill={COL.bleu}/><text x="34" y={yc + 8} textAnchor="middle" fontSize="23" fontWeight="800" fill="#fff">{lettre}</text>
            {[0, 1].map(k => <g key={k}>
              <line x1={XC[k]} y1={yc} x2={BX[k]} y2={oy + 26} stroke={COL.encre} strokeWidth="3.4" strokeLinecap="round"/>
              <line x1={XC[k]} y1={yc} x2={BX[k]} y2={oy + 94} stroke={COL.encre} strokeWidth="3.4" strokeLinecap="round"/>
            </g>)}
            <line x1={XC[0]} y1={yc - 5} x2={XC[1]} y2={yc - 5} stroke={COL.encre} strokeWidth="3.4"/>
            <line x1={XC[0]} y1={yc + 5} x2={XC[1]} y2={yc + 5} stroke={COL.encre} strokeWidth="3.4"/>
            {XC.map((x, k) => <g key={k}><circle cx={x} cy={yc} r="14" fill="#fff" stroke="#64748b" strokeWidth="2.6"/><text x={x} y={yc + 6} textAnchor="middle" fontSize="17" fontWeight="800" fill="#475569">C</text></g>)}
            {groupes.map((g, i) => { const et = M.etiqAlc(m, g.j); return (
              <text key={i} data-groupe={et} x={g.k === 0 ? BX[0] - 6 : BX[1] + 6} y={g.haut ? oy + 26 : oy + 106} textAnchor={g.k === 0 ? 'end' : 'start'} fontSize="21" fontWeight="800" fill={COL.encre}>{g.k === 0 ? inverse(et) : et}</text>); })}
          </g>);
      })}
    </svg>);
}

// ═════════ Cartes « À retenir » ═════════
// A : combien de stéréoisomères ? arbre des configurations
export function SvgNombre() {
  const feuille = (x, t) => <g><path d={`M ${x < 200 ? 110 : 290} 134 L ${x} 172`} stroke={COL.gris} strokeWidth="2.5"/><rect x={x - 38} y="172" width="76" height="34" rx="8" fill="#fef3c7" stroke={COL.orange} strokeWidth="2"/><text x={x} y="196" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>{t}</text></g>;
  return (
    <svg viewBox="0 0 400 290" style={base} role="img" aria-label="Arbre des configurations de deux carbones asymétriques C2 et C3 : chacun peut être R ou S, soit 2 fois 2, c’est-à-dire 4 stéréoisomères au maximum : RR, RS, SR, SS.">
      <text x="200" y="24" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>Deux C* : 4 combinaisons</text>
      <rect x="130" y="40" width="140" height="34" rx="8" fill="#e0f2fe" stroke={COL.bleu} strokeWidth="2"/><text x="200" y="63" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>C2 : R ou S</text>
      <path d="M 170 74 L 110 100" stroke={COL.gris} strokeWidth="2.5"/><path d="M 230 74 L 290 100" stroke={COL.gris} strokeWidth="2.5"/>
      <rect x="40" y="100" width="140" height="34" rx="8" fill="#e0f2fe" stroke={COL.bleu} strokeWidth="2"/><text x="110" y="123" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>C3 : R ou S</text>
      <rect x="220" y="100" width="140" height="34" rx="8" fill="#e0f2fe" stroke={COL.bleu} strokeWidth="2"/><text x="290" y="123" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>C3 : R ou S</text>
      {feuille(70, '(R,R)')}{feuille(150, '(R,S)')}{feuille(250, '(S,R)')}{feuille(330, '(S,S)')}
      <path d="M 110 134 L 150 172" stroke={COL.gris} strokeWidth="2.5"/><path d="M 290 134 L 250 172" stroke={COL.gris} strokeWidth="2.5"/>
      <rect x="8" y="222" width="384" height="62" rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2"/>
      <text x="200" y="248" textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.encre}>2 × 2 = 4 stéréoisomères</text>
      <text x="200" y="272" textAnchor="middle" fontSize="16" fill={COL.encre}>n carbones asymétriques : 2ⁿ au plus</text>
    </svg>);
}
// B : énantiomères et diastéréoisomères (deux C*)
export function SvgRelations() {
  const boite = (x, y, t) => <g><rect x={x} y={y} width="100" height="40" rx="8" fill="#fef3c7" stroke={COL.orange} strokeWidth="2"/><text x={x + 50} y={y + 26} textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.encre}>{t}</text></g>;
  const fleche = y => <g stroke={COL.bleu} strokeWidth="3"><path d={`M 140 ${y} H 260`}/><path d={`M 140 ${y} l 10 -6 M 140 ${y} l 10 6 M 260 ${y} l -10 -6 M 260 ${y} l -10 6`}/></g>;
  return (
    <svg viewBox="0 0 400 296" style={base} role="img" aria-label="Les quatre stéréoisomères (R,R), (S,S), (R,S) et (S,R). Les deux couples (R,R) et (S,S), puis (R,S) et (S,R), sont des énantiomères : image l’un de l’autre dans un miroir. Tous les autres couples sont des diastéréoisomères.">
      <text x="200" y="24" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>Quatre stéréoisomères</text>
      {boite(24, 56, '(R,R)')}{boite(276, 56, '(S,S)')}{boite(24, 166, '(R,S)')}{boite(276, 166, '(S,R)')}
      {fleche(76)}{fleche(186)}
      <text x="200" y="66" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.bleu}>énantiomères</text>
      <text x="200" y="176" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.bleu}>énantiomères</text>
      <path d="M 74 96 V 166" stroke={COL.gris} strokeWidth="2.5" strokeDasharray="6 5"/><path d="M 326 96 V 166" stroke={COL.gris} strokeWidth="2.5" strokeDasharray="6 5"/>
      <path d="M 124 92 L 276 170" stroke={COL.gris} strokeWidth="2.5" strokeDasharray="6 5"/><path d="M 276 92 L 124 170" stroke={COL.gris} strokeWidth="2.5" strokeDasharray="6 5"/>
      <rect x="96" y="118" width="208" height="28" rx="6" fill="white"/><text x="200" y="138" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.gris}>diastéréoisomères</text>
      <rect x="8" y="234" width="384" height="54" rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2"/>
      <text x="200" y="258" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>chaque stéréoisomère a 1 énantiomère</text>
      <text x="200" y="278" textAnchor="middle" fontSize="16" fill={COL.encre}>et 2 diastéréoisomères</text>
    </svg>);
}
// C : propriétés biologiques : le récepteur reconnaît un seul énantiomère
export function SvgBio() {
  const cols = ['#b91c1c', '#0369a1', '#15803d'];
  const panneau = (x, ordre, titre, verdict, ok) => (<g>
    <rect x={x} y="44" width="184" height="170" rx="10" fill="#f8fafc" stroke={ok ? COL.vert : COL.rouge} strokeWidth="2.5"/>
    <text x={x + 92} y="68" textAnchor="middle" fontSize="17" fontWeight="800" fill={COL.encre}>{titre}</text>
    {[0, 1, 2].map(i => <circle key={`s${i}`} cx={x + 40} cy={96 + i * 36} r="13" fill="white" stroke={cols[i]} strokeWidth="3.5" strokeDasharray="4 3"/>)}
    {ordre.map((c, i) => <circle key={`m${i}`} cx={x + 100} cy={96 + i * 36} r="13" fill={cols[c]}/>)}
    {ordre.map((c, i) => <path key={`l${i}`} d={`M ${x + 53} ${96 + i * 36} H ${x + 87}`} stroke={cols[c]} strokeWidth="2.5" strokeDasharray={c === i ? 'none' : '4 3'}/>)}
    <text x={x + 150} y="130" textAnchor="middle" fontSize="40" fontWeight="800" fill={ok ? COL.vert : COL.rouge}>{ok ? '✓' : '✗'}</text>
    <text x={x + 92} y="204" textAnchor="middle" fontSize="16" fontWeight="800" fill={ok ? COL.vert : COL.rouge}>{verdict}</text>
  </g>);
  return (
    <svg viewBox="0 0 400 290" style={base} role="img" aria-label="Un récepteur biologique possède trois sites et ne reconnaît qu’un seul énantiomère : le premier s’ajuste et agit, son image dans un miroir ne s’ajuste pas. Un mélange racémique contient 50 % de chaque énantiomère.">
      <text x="200" y="24" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>Le récepteur choisit</text>
      {panneau(10, [0, 1, 2], 'énantiomère 1', 's’ajuste : actif', true)}{panneau(206, [1, 0, 2], 'énantiomère 2', 'ne s’ajuste pas', false)}
      <rect x="8" y="228" width="384" height="54" rx="10" fill="#fef3c7" stroke={COL.orange} strokeWidth="2"/>
      <text x="200" y="252" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>mélange racémique = 50 % / 50 %</text>
      <text x="200" y="272" textAnchor="middle" fontSize="16" fill={COL.encre}>deux énantiomères : effets possibles différents</text>
    </svg>);
}
// D : Z et E
export function SvgZE() {
  const badge = (x, y, n) => <g><circle cx={x} cy={y} r="14" fill={COUL_RANG[n]}/><text x={x} y={y + 6} textAnchor="middle" fontSize="17" fontWeight="800" fill="#fff">{n}</text></g>;
  const alc = (x0, haut2, titre, sous, col) => (<g>
    <text x={x0 + 92} y="58" textAnchor="middle" fontSize="19" fontWeight="800" fill={col}>{titre}</text>
    <line x1={x0 + 60} y1="122" x2={x0 + 124} y2="122" stroke={COL.encre} strokeWidth="3.4"/><line x1={x0 + 60} y1="132" x2={x0 + 124} y2="132" stroke={COL.encre} strokeWidth="3.4"/>
    <path d={`M ${x0 + 60} 127 L ${x0 + 28} 96 M ${x0 + 60} 127 L ${x0 + 28} 160 M ${x0 + 124} 127 L ${x0 + 156} ${haut2 ? 96 : 160} M ${x0 + 124} 127 L ${x0 + 156} ${haut2 ? 160 : 96}`} stroke={COL.encre} strokeWidth="3.4" strokeLinecap="round"/>
    {badge(x0 + 24, 92, 1)}{badge(x0 + 24, 164, 2)}{badge(x0 + 160, haut2 ? 92 : 164, 1)}{badge(x0 + 160, haut2 ? 164 : 92, 2)}
    <path d={haut2 ? `M ${x0 + 30} 74 H ${x0 + 154}` : `M ${x0 + 34} 100 L ${x0 + 152} 158`} stroke={col} strokeWidth="3" strokeDasharray="6 4" fill="none"/>
    <text x={x0 + 92} y="206" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>{sous[0]}</text>
    <text x={x0 + 92} y="226" textAnchor="middle" fontSize="16" fill={COL.encre}>{sous[1]}</text>
  </g>);
  return (
    <svg viewBox="0 0 400 296" style={base} role="img" aria-label="Isomérie Z et E : sur chaque carbone de la double liaison, on repère le groupe prioritaire (numéro 1). Du même côté de la double liaison : Z. De côtés opposés : E.">
      <text x="200" y="24" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>Z ou E : où sont les « 1 » ?</text>
      <g transform="translate(0,-8)">{alc(8, true, 'Z', ['même côté', 'zusammen'], COL.vert)}</g>
      <g transform="translate(0,-8)">{alc(208, false, 'E', ['côtés opposés', 'entgegen'], COL.rouge)}</g>
      <rect x="8" y="232" width="384" height="56" rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2"/>
      <text x="200" y="256" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>Z et E : deux diastéréoisomères</text>
      <text x="200" y="276" textAnchor="middle" fontSize="16" fill={COL.encre}>conditions : 2 groupes différents par carbone</text>
    </svg>);
}
// E : arbre de décision : quelle relation entre deux molécules de même formule semi-développée ?
export function SvgArbre() {
  const boite = (x, y, w, h, l, fond, tr) => <g><rect x={x} y={y} width={w} height={h} rx="8" fill={fond} stroke={tr} strokeWidth="2"/>{l.map((t, i) => <text key={i} x={x + w / 2} y={y + h / 2 + 6 - (l.length - 1) * 9 + i * 19} textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>{t}</text>)}</g>;
  const fl = (x1, y1, x2, y2) => <path d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={COL.encre} strokeWidth="2.5"/>;
  return (
    <svg viewBox="0 0 400 320" style={base} role="img" aria-label="Arbre de décision pour deux molécules de même formule semi-développée. Elles se superposent : identiques. Sinon, si l’une est l’image de l’autre dans un miroir : énantiomères, sinon diastéréoisomères.">
      {boite(70, 8, 260, 40, ['Se superposent-elles ?'], '#e0f2fe', COL.bleu)}
      {fl(150, 48, 70, 100)}{fl(250, 48, 290, 100)}
      <text x="86" y="82" fontSize="16" fontWeight="800" fill={COL.vert}>oui</text><text x="276" y="82" fontSize="16" fontWeight="800" fill={COL.rouge}>non</text>
      {boite(10, 100, 120, 44, ['identiques'], '#dcfce7', COL.vert)}
      {boite(150, 100, 240, 56, ['Image l’une de l’autre', 'dans un miroir ?'], '#e0f2fe', COL.bleu)}
      {fl(200, 156, 130, 208)}{fl(340, 156, 300, 208)}
      <text x="132" y="190" fontSize="16" fontWeight="800" fill={COL.vert}>oui</text><text x="318" y="190" fontSize="16" fontWeight="800" fill={COL.rouge}>non</text>
      {boite(60, 208, 140, 44, ['énantiomères'], '#fef3c7', COL.orange)}
      {boite(230, 208, 160, 56, ['diastéréo-', 'isomères'], '#fef3c7', COL.orange)}
      <rect x="8" y="276" width="384" height="38" rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2"/>
      <text x="200" y="301" textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>Z et E : toujours des diastéréoisomères</text>
    </svg>);
}
