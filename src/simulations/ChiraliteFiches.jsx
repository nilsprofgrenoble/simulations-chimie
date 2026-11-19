/* eslint-disable react-refresh/only-export-components -- fichier de dessins : les constantes de couleur sont partagées avec la simulation */
// Cartes « À retenir » de la simulation « Chiralité et configuration R/S » : une idée par carte, un schéma explicite
// (police ≥ 16 dans un viewBox de 400, rien qui déborde), une phrase-clé à retenir.
import { puces } from './Travail';
import * as M from './chiraliteModele';
import { Cram, COUL_GROUPE, COUL_RANG } from './ChiraliteSchema';

const svgStyle = { width: '100%', maxWidth: 400, height: 'auto', display: 'block', margin: '6px auto' };
const T = (x, y, t, c = '#0f172a', anchor = 'middle', fs = 19, w = 800) => <text x={x} y={y} textAnchor={anchor} fontSize={fs} fontWeight={w} fill={c}>{t}</text>;
const lac = M.parId('lactique'), pro = M.parId('propan2ol');
const affLac = M.affDepuis(lac, 1, { A: 'OH', B: 'COOH', W: 'CH₃', D: 'H' });
const affPro = M.affDepuis(pro, 1, { A: 'CH₃', B: 'CH₃', W: 'OH', D: 'H' });
const jOf = (m, aff, etiq) => M.EMPLACEMENTS.map(e => aff[e]).find(j => M.etiquette(m, m.centres[0], j) === etiq);
const coulLac = Object.fromEntries(['OH', 'COOH', 'CH₃', 'H'].map((e, k) => [jOf(lac, affLac, e), COUL_GROUPE[k]]));
const coulPro = { [affPro.A]: '#0f766e', [affPro.B]: '#0f766e', [affPro.W]: '#6d28d9', [affPro.D]: '#475569' };

// ───── 1. Carbone asymétrique et molécule chirale ─────
function CarteAsym() {
  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: 14, color: '#0f766e', textAlign: 'center' }}>4 groupes tous différents : C* asymétrique</div>
      <div style={{ maxWidth: 330, margin: '0 auto' }}><Cram mol={lac} affs={[affLac]} couleurs={coulLac} hauteur={240} ariaLabel="Acide lactique : le carbone central est lié à OH, COOH, CH₃ et H, quatre groupes différents, donc il est asymétrique" /></div>
      <div style={{ fontWeight: 800, fontSize: 14, color: '#b91c1c', textAlign: 'center', marginTop: 6 }}>deux groupes identiques : pas de C*</div>
      <div style={{ maxWidth: 330, margin: '0 auto' }}><Cram mol={pro} affs={[affPro]} couleurs={coulPro} hauteur={240} ariaLabel="Propan-2-ol : le carbone central porte deux groupes CH₃ identiques, il n’est pas asymétrique" /></div>
    </div>);
}
// ───── 2. Représentation de Cram ─────
function CarteCram() {
  const ligne = (y, dessin, titre, sous) => (
    <g>
      {dessin}
      {T(150, y + 2, titre, '#0f172a', 'start', 20)}
      {T(150, y + 26, sous, '#475569', 'start', 17, 700)}
    </g>);
  const x0 = 20, x1 = 120;
  const plein = y => <line x1={x0} y1={y} x2={x1} y2={y} stroke="#0f172a" strokeWidth="4" strokeLinecap="round"/>;
  const coin = y => <polygon points={`${x0},${y} ${x1},${y - 11} ${x1},${y + 11}`} fill="#0f172a"/>;
  const tirets = y => <g>{[0, 1, 2, 3, 4, 5, 6].map(k => { const f = (k + 0.5) / 7, w = 2 + 9 * f; const x = x0 + (x1 - x0) * f; return <line key={k} x1={x} y1={y - w} x2={x} y2={y + w} stroke="#0f172a" strokeWidth="3"/>; })}</g>;
  return (
    <svg viewBox="0 0 400 250" role="img" aria-label="Représentation de Cram : un trait plein est dans le plan de la feuille, un coin plein pointe vers l’observateur, des tirets partent vers l’arrière" style={svgStyle}>
      {ligne(46, plein(46), 'trait plein', 'dans le plan de la feuille')}
      {ligne(116, coin(116), 'coin plein', 'vers vous (devant)')}
      {ligne(186, tirets(186), 'tirets', 'derrière la feuille')}
      {T(200, 240, 'mémo : plein = devant, tirets = derrière', '#b45309', 'middle', 17)}
    </svg>);
}
// ───── 3. Règle des priorités ─────
function CarteRegle() {
  const atomes = [['H', 1], ['C', 6], ['N', 7], ['O', 8], ['S', 16], ['Cl', 17], ['Br', 35]];
  return (
    <svg viewBox="0 0 400 290" role="img" aria-label="Règle de priorité : l’atome lié au carbone qui a le plus grand numéro atomique Z passe en premier ; en cas d’égalité on compare les atomes voisins, par exemple O, O, O devant H, H, H" style={svgStyle}>
      {T(200, 26, 'plus grand Z = plus prioritaire', '#0f172a', 'middle', 20)}
      {atomes.map(([s, z], k) => <g key={s}><rect x={8 + k * 55} y={40} width="50" height="64" rx="9" fill="#fff" stroke="#0369a1" strokeWidth="2.4"/>{T(33 + k * 55, 70, s, '#0369a1', 'middle', 22)}{T(33 + k * 55, 94, `${z}`, '#334155', 'middle', 18, 700)}</g>)}
      <line x1="10" y1="122" x2="386" y2="122" stroke="#334155" strokeWidth="3" markerEnd="url(#ar3)"/>
      <defs><marker id="ar3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#334155"/></marker></defs>
      {T(200, 146, 'priorité croissante', '#334155', 'middle', 17, 700)}
      {T(200, 186, 'même atome lié ? égalité !', '#b45309', 'middle', 20)}
      {T(200, 214, 'on regarde les voisins, dans l’ordre :', '#334155', 'middle', 17, 700)}
      {T(200, 248, 'COOH (O, O, O)  >  CH₃ (H, H, H)', '#0f172a', 'middle', 20)}
      {T(200, 276, 'on compare terme à terme : O > H', '#475569', 'middle', 17, 700)}
    </svg>);
}
// ───── 4. Liaison double : compter deux fois ─────
function CarteDouble() {
  return (
    <svg viewBox="0 0 400 270" role="img" aria-label="Dans le groupe COOH, la double liaison C=O compte deux fois : les voisins du carbone sont O, O et O" style={svgStyle}>
      <line x1="136" y1="150" x2="136" y2="84" stroke="#0f172a" strokeWidth="4"/><line x1="150" y1="150" x2="150" y2="84" stroke="#0f172a" strokeWidth="4"/>
      <line x1="150" y1="164" x2="226" y2="208" stroke="#0f172a" strokeWidth="4"/><line x1="128" y1="164" x2="64" y2="200" stroke="#0f172a" strokeWidth="4"/>
      <circle cx="143" cy="164" r="17" fill="#fff" stroke="#b45309" strokeWidth="2.6"/>{T(143, 171, 'C', '#b45309', 'middle', 20)}
      {T(143, 70, 'O', '#b91c1c', 'middle', 24)}
      {T(250, 70, 'O', '#b91c1c', 'middle', 24)}<circle cx="250" cy="62" r="23" fill="none" stroke="#b91c1c" strokeWidth="2.2" strokeDasharray="5 4"/>
      <line x1="168" y1="66" x2="224" y2="66" stroke="#b91c1c" strokeWidth="2" strokeDasharray="5 4"/>
      {T(250, 24, 'compté 2 fois', '#b91c1c', 'middle', 17)}
      {T(246, 226, 'O', '#0f172a', 'middle', 24)}{T(276, 226, 'H', '#0f172a', 'start', 24)}
      {T(48, 214, 'R', '#475569', 'middle', 22)}
      {T(200, 258, 'voisins de C : (O, O, O)', '#0f172a', 'middle', 20)}
    </svg>);
}
// ───── 5. Lire R ou S ─────
function CarteLire() {
  const pt = (cx, cy, r, deg) => [cx + r * Math.cos(deg * Math.PI / 180), cy - r * Math.sin(deg * Math.PI / 180)];
  const bloc = (cx, horaire, titre, sous, coul) => {
    const angs = horaire ? [90, -30, 210] : [90, 210, -30];       // 1 en haut ; 2 puis 3
    const P = angs.map(a => pt(cx, 112, 52, a));
    const sw = horaire ? 1 : 0;
    return (
      <g>
        <circle cx={cx} cy="112" r="64" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2"/>
        <path d={`M ${P[0][0]} ${P[0][1]} A 52 52 0 0 ${sw} ${P[1][0]} ${P[1][1]}`} fill="none" stroke={coul} strokeWidth="4" markerEnd={`url(#ar5${horaire ? 'h' : 'a'})`}/>
        <path d={`M ${P[1][0]} ${P[1][1]} A 52 52 0 0 ${sw} ${P[2][0]} ${P[2][1]}`} fill="none" stroke={coul} strokeWidth="4" markerEnd={`url(#ar5${horaire ? 'h' : 'a'})`}/>
        {P.map(([x, y], k) => <g key={k}><circle cx={x} cy={y} r="14" fill={COUL_RANG[k + 1]}/>{T(x, y + 7, `${k + 1}`, '#fff', 'middle', 18)}</g>)}
        {T(cx, 200, titre, coul, 'middle', 26)}{T(cx, 226, sous, '#334155', 'middle', 17, 700)}
      </g>);
  };
  return (
    <svg viewBox="0 0 400 270" role="img" aria-label="Le groupe 4 est derrière. Si 1, 2, 3 tournent dans le sens des aiguilles d’une montre, la configuration est R ; dans le sens inverse, elle est S" style={svgStyle}>
      <defs>{[['h', '#b91c1c'], ['a', '#1d4ed8']].map(([k, c]) => <marker key={k} id={`ar5${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={c}/></marker>)}</defs>
      {bloc(100, true, 'R', 'sens horaire', '#b91c1c')}
      {bloc(300, false, 'S', 'sens antihoraire', '#1d4ed8')}
      {T(200, 258, 'avec le n°4 derrière, loin de vous', '#b45309', 'middle', 17)}
    </svg>);
}
// ───── 6. Bilan ─────
function CarteBilan() {
  const ligne = (y, a, b, c) => <g><rect x="8" y={y} width="384" height="52" rx="10" fill="#fff" stroke={c} strokeWidth="2.4"/>{T(200, y + 23, a, c, 'middle', 19)}{T(200, y + 44, b, '#334155', 'middle', 16, 700)}</g>;
  return (
    <svg viewBox="0 0 400 270" role="img" aria-label="Bilan : l’image dans un miroir inverse R et S ; échanger deux groupes change la lettre ; si le groupe 4 est devant, on lit puis on inverse ; chaque carbone asymétrique a sa propre lettre" style={svgStyle}>
      {ligne(6, 'image miroir : R ⇄ S', 'échanger 2 groupes = changer de lettre', '#b91c1c')}
      {ligne(68, 'le n°4 est devant ? lire puis inverser', 'sens horaire lu devant ⇒ S', '#c2410c')}
      {ligne(130, 'chaque C* a sa propre lettre', 'exemple : (2R,3S)', '#1d4ed8')}
      {ligne(192, 'R et S : deux molécules différentes', 'ce ne sont pas « droite » et « gauche »', '#0f766e')}
    </svg>);
}

export const FICHES = {
  asym: <><CarteAsym/>
    {puces(<>Un <strong>carbone asymétrique</strong> (noté C*) est lié à <strong>4 atomes ou groupes tous différents</strong>.</>,
      <>Une molécule est <strong>chirale</strong> si elle a au moins un C* et aucun axe, plan ou centre de symétrie : un seul C* suffit.</>,
      <><strong>Mémo</strong> : « 4 groupes différents = C* ; 2 groupes pareils = pas de C* ».</>)}</>,
  cram: <><CarteCram/>
    {puces(<>Le carbone est <strong>au centre</strong> : il a toujours <strong>4 liaisons</strong>, y compris vers H.</>,
      <>Deux liaisons sont dans le plan (traits pleins), une va <strong>devant</strong> (coin plein), une va <strong>derrière</strong> (tirets).</>,
      <><strong>Exemple</strong> : CH₃ en coin plein, H en tirets.</>)}</>,
  regle: <><CarteRegle/>
    {puces(<>On classe les 4 groupes de <strong>1</strong> (le plus prioritaire) à <strong>4</strong>.</>,
      <>On regarde <strong>l’atome lié au carbone C*</strong> : plus son Z est grand, plus le groupe est prioritaire.</>,
      <>Même atome lié ? On compare les <strong>voisins</strong> de cet atome, du plus grand Z au plus petit.</>)}</>,
  double: <><CarteDouble/>
    {puces(<>Une <strong>double liaison</strong> équivaut à <strong>deux liaisons simples</strong> : l’atome au bout est écrit deux fois.</>,
      <>Dans <strong>COOH</strong>, le carbone a pour voisins <strong>O, O, O</strong> (le O de C=O compte 2 fois).</>,
      <><strong>Exemple</strong> : COOH (O, O, O) passe avant CH₂OH (O, H, H).</>)}</>,
  lire: <><CarteLire/>
    {puces(<><strong>1)</strong> numéroter les groupes ; <strong>2)</strong> placer le n°4 <strong>derrière</strong> ; <strong>3)</strong> suivre 1 → 2 → 3.</>,
      <><strong>Horaire = R</strong> (« rectus », droite) ; <strong>antihoraire = S</strong> (« sinister », gauche).</>,
      <><strong>Mémo</strong> : « R comme la Roue qui tourne comme les aiguilles ».</>)}</>,
  bilan: <><CarteBilan/>
    {puces(<>R et S sont deux molécules <strong>différentes</strong>, images l’une de l’autre dans un miroir.</>,
      <>Plusieurs C* : on donne <strong>une lettre par carbone</strong>, avec son numéro : (2R,3S).</>,
      <>R et S ne disent rien du sens de rotation de la lumière (c’est une autre mesure).</>)}</>,
};
