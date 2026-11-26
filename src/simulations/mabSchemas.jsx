// Schémas de la simulation 294 (équations en milieu acide ou basique) : équation « construite » avec puces colorées, bilan de conservation,
// tube à essai animé pour les transformations réelles, cartes « À retenir ». Le code ne dépend que du modèle mabModele.js.
import { useId } from 'react';
import * as M from './mabModele';

/** Couleurs par rôle : oxydant (bleu), réducteur (orange), eau (sarcelle), H⁺ (rose), HO⁻ (olive), électrons (jaune). */
const COL = { ox: '#0369a1', red: '#b45309', h2o: '#0f766e', hp: '#be185d', ohm: '#4d7c0f', em: '#a16207', encre: '#0f172a', gris: '#475569', vert: '#15803d', rouge: '#b91c1c' };
const FOND = { ox: '#e0f2fe', red: '#ffedd5', h2o: '#ccfbf1', hp: '#fce7f3', ohm: '#ecfccb', em: '#fef9c3', autre: '#f1f5f9' };
const roleDe = (id, principaux) => (id === 'H2O' ? 'h2o' : id === 'Hp' ? 'hp' : id === 'OHm' ? 'ohm' : id === 'em' ? 'em' : principaux?.ox?.includes(id) ? 'ox' : principaux?.red?.includes(id) ? 'red' : 'autre');
const couleurRole = r => COL[r] || COL.encre;

const css = `
.mab-puce { display: inline-flex; align-items: baseline; gap: 4px; padding: 5px 10px; border-radius: 999px; font-size: 17px; font-weight: 700; line-height: 1.2; border: 2px solid transparent; white-space: nowrap; }
.mab-puce b { font-size: 15px; opacity: 0.9; }
.mab-signe { font-size: 18px; font-weight: 700; color: ${COL.gris}; padding: 0 1px; }
@media (prefers-reduced-motion: no-preference) {
  .mab-neuf { animation: mab-pop 0.55s cubic-bezier(.2,1.4,.4,1); }
  @keyframes mab-pop { 0% { transform: scale(0.3) translateY(-14px); opacity: 0; } 70% { transform: scale(1.12); opacity: 1; } 100% { transform: scale(1); } }
  .mab-fondu { animation: mab-fondu 0.4s ease-out; } @keyframes mab-fondu { from { opacity: 0; } to { opacity: 1; } }
}
.mab-eq { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px 6px; }
.mab-ledger { display: grid; grid-template-columns: minmax(70px, auto) 1fr 28px 1fr; gap: 6px 8px; align-items: center; font-size: 15px; }
`;
export const StylesSchemas = () => <style>{css}</style>;

/** Une espèce sous forme de puce colorée (coefficient en gras, nouveauté entourée). */
export function Puce({ id, coef = 1, neuf = false, principaux }) {
  const r = roleDe(id, principaux), c = couleurRole(r);
  return <span className={`mab-puce${neuf ? ' mab-neuf' : ''}`} style={{ background: FOND[r], color: c, borderColor: neuf ? '#ea580c' : 'transparent', boxShadow: neuf ? '0 0 0 3px #fed7aa' : 'none' }}>
    {coef > 1 && <b>{coef}</b>}<span>{M.texte(id)}</span></span>;
}
export function Membre({ termes, nouveaux = [], principaux }) {
  const t = termes.filter(([, c]) => c > 0);
  return <>{t.map(([id, c], i) => <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    {i > 0 && <span className="mab-signe">+</span>}<Puce id={id} coef={c} neuf={nouveaux.includes(id)} principaux={principaux}/></span>)}</>;
}
/** Équation « Ox = Red » ou « réactifs → produits » en puces. */
export function EquationPuces({ gauche, droite, nouveaux = [], flecheTxt = '=', principaux, cle }) {
  return <div className="mab-eq" key={cle} role="img" aria-label={`${M.membre(gauche)} ${flecheTxt} ${M.membre(droite)}`}>
    <Membre termes={gauche} nouveaux={nouveaux} principaux={principaux}/><span className="mab-signe" style={{ fontSize: 22, padding: '0 4px' }}>{flecheTxt}</span><Membre termes={droite} nouveaux={nouveaux} principaux={principaux}/></div>;
}

/** Bilan de conservation : une ligne par élément puis la charge ; vert si égal, rouge sinon. */
export function Bilan({ gauche, droite, titre = 'Bilan de vérification' }) {
  const lignes = M.bilanLignes(gauche, droite), q = n => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');
  return <div role="table" aria-label={titre}>
    <div style={{ fontSize: 13.5, fontWeight: 700, color: COL.gris, marginBottom: 6 }}>{titre}</div>
    <div className="mab-ledger">
      <span/><span style={{ textAlign: 'center', fontSize: 12.5, color: COL.gris }}>membre de gauche</span><span/><span style={{ textAlign: 'center', fontSize: 12.5, color: COL.gris }}>membre de droite</span>
      {lignes.map(l => { const c = l.ok ? COL.vert : COL.rouge, f = l.ok ? '#dcfce7' : '#fee2e2', v = l.nom === 'charge' ? q : n => String(n);
        return <span key={l.nom} style={{ display: 'contents' }}>
          <span style={{ fontWeight: 700, color: COL.encre }}>{l.nom === 'charge' ? 'charge' : `atomes ${l.nom}`}</span>
          <span style={{ background: f, color: c, borderRadius: 8, padding: '3px 8px', textAlign: 'center', fontWeight: 700 }}>{v(l.g)}</span>
          <span aria-label={l.ok ? 'égal' : 'différent'} style={{ textAlign: 'center', fontWeight: 800, color: c, fontSize: 18 }}>{l.ok ? '✓' : '≠'}</span>
          <span style={{ background: f, color: c, borderRadius: 8, padding: '3px 8px', textAlign: 'center', fontWeight: 700 }}>{v(l.d)}</span></span>; })}
    </div></div>;
}

/** Légende des couleurs. */
export const Legende = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 12.5, justifyContent: 'center' }}>
    {[['ox', 'oxydant'], ['red', 'réducteur'], ['h2o', 'eau'], ['hp', 'ion H⁺'], ['ohm', 'ion HO⁻'], ['em', 'électron']].map(([r, t]) =>
      <span key={r} style={{ background: FOND[r], color: COL[r], borderRadius: 999, padding: '2px 9px', fontWeight: 700 }}>{t}</span>)}</div>);

// ---------------------------------------------------------------- transformations réelles : tube à essai animé
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mel = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((x, i) => Math.round(x + (B[i] - x) * t)).join(',')})`; };
const SCENES = {
  miroir: { titre: 'Test au miroir d’argent', avant: '#e0eef9', apres: '#e0eef9', note: 'Ag⁺ + RCHO (milieu basique)' },
  fehling: { titre: 'Test à la liqueur de Fehling', avant: '#2563eb', apres: '#bfdbfe', note: 'Cu²⁺ + RCHO (milieu basique, à chaud)' },
  permanganate: { titre: 'Permanganate et sulfite en milieu basique', avant: '#7e22ce', apres: '#b08968', note: 'MnO₄⁻ + SO₃²⁻' },
  aluminium: { titre: 'Aluminium dans la soude', avant: '#e0f2fe', apres: '#e0f2fe', note: 'Al + HO⁻ + H₂O' },
  javel: { titre: 'Eau de Javel et eau oxygénée', avant: '#e0f2fe', apres: '#e0f2fe', note: 'ClO⁻ + H₂O₂ (milieu basique)' },
};
/** Tube à essai : p (0 à 1) est l'avancement visuel ; les bulles tournent en continu quand anime. */
export function SceneTube({ type, p = 0, anime = true }) {
  const id = useId().replace(/:/g, ''), S = SCENES[type], x0 = 105, x1 = 195, yH = 36, yB = 212, nivL = 92;
  const liquide = mel(S.avant, S.apres, Math.min(1, p * (type === 'fehling' ? 0.85 : 1)));
  const bulles = (type === 'aluminium' || type === 'javel') && p > 0.02;
  const nB = bulles ? 7 : 0, gaz = type === 'aluminium' ? 'H₂' : 'O₂';
  const bandeAl = type === 'aluminium' ? 62 * (1 - 0.7 * p) : 0;
  return (
    <svg viewBox="0 0 300 262" width="100%" role="img" aria-label={`${S.titre} : ${p >= 1 ? 'transformation terminée' : p > 0 ? 'transformation en cours' : 'avant la réaction'}`} style={{ display: 'block', maxHeight: 330, maxWidth: '100%' }}>
      <defs>
        <clipPath id={`${id}c`}><path d={`M${x0} ${yH} V${yB - 30} Q${x0} ${yB} ${(x0 + x1) / 2} ${yB} Q${x1} ${yB} ${x1} ${yB - 30} V${yH} Z`}/></clipPath>
        <linearGradient id={`${id}a`} x1="0" x2="1"><stop offset="0" stopColor="#94a3b8"/><stop offset="0.35" stopColor="#f8fafc"/><stop offset="0.7" stopColor="#cbd5e1"/><stop offset="1" stopColor="#64748b"/></linearGradient>
        <linearGradient id={`${id}v`} x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.55"/><stop offset="0.3" stopColor="#fff" stopOpacity="0"/><stop offset="1" stopColor="#fff" stopOpacity="0.18"/></linearGradient>
      </defs>
      <rect x="1" y="1" width="298" height="260" rx="16" fill="#f8fafc" stroke="#d5dfeb"/>
      <text x="150" y="22" textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.encre}>{S.titre}</text>
      <g clipPath={`url(#${id}c)`}>
        <rect x={x0} y={nivL} width={x1 - x0} height={yB - nivL} fill={liquide}/>
        {type === 'miroir' && <>
          <rect x={x0} y={nivL + 4} width="13" height={(yB - nivL) * p} fill={`url(#${id}a)`}/>
          <rect x={x1 - 13} y={nivL + 4} width="13" height={(yB - nivL) * p} fill={`url(#${id}a)`}/>
          <path d={`M${x0} ${yB - 32 * p} Q150 ${yB + 6} ${x1} ${yB - 32 * p} V${yB} H${x0} Z`} fill={`url(#${id}a)`} opacity={Math.min(1, p * 1.2)}/></>}
        {type === 'fehling' && <rect x={x0} y={yB - 6 - 50 * p} width={x1 - x0} height={50 * p + 8} fill="#b45309" opacity={Math.min(1, p * 1.4)}/>}
        {type === 'permanganate' && [0, 1, 2, 3, 4, 5, 6, 7].map(i => <circle key={i} cx={x0 + 12 + (i * 37) % 68} cy={nivL + 14 + (i * 29) % 100} r={3 + (i % 3)} fill="#7c4a24" opacity={Math.min(1, p * 1.5) * 0.85}/>)}
        {type === 'aluminium' && <g><rect x="140" y={yB - 20 - bandeAl} width="20" height={bandeAl} rx="3" fill={`url(#${id}a)`}/></g>}
        {nB > 0 && [...Array(nB)].map((_, i) => <circle key={i} cx={x0 + 14 + (i * 23) % 64} cy={yB - 30} r={3 + (i % 3)} fill="#fff" stroke="#64748b" strokeWidth="1">
          {anime && <animate attributeName="cy" values={`${yB - 24};${nivL - 4}`} dur={`${1.6 + (i % 3) * 0.4}s`} begin={`${(i * 0.31).toFixed(2)}s`} repeatCount="indefinite"/>}</circle>)}
      </g>
      <path d={`M${x0} ${yH} V${yB - 30} Q${x0} ${yB} ${(x0 + x1) / 2} ${yB} Q${x1} ${yB} ${x1} ${yB - 30} V${yH}`} fill="none" stroke="#475569" strokeWidth="3" strokeLinecap="round"/>
      <path d={`M${x0 - 6} ${yH} H${x0} M${x1} ${yH} H${x1 + 6}`} stroke="#475569" strokeWidth="3" strokeLinecap="round"/>
      <rect x={x0 + 4} y={yH + 4} width="10" height={yB - yH - 40} rx="5" fill={`url(#${id}v)`}/>
      {bulles && <g><path d={`M${x1 + 20} ${nivL - 24} v-22`} stroke={COL.gris} strokeWidth="2" markerEnd="none"/><path d={`M${x1 + 14} ${nivL - 44} l6 -10 l6 10`} fill="none" stroke={COL.gris} strokeWidth="2"/>
        <text x={x1 + 20} y={nivL - 62} textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.gris}>{gaz}</text></g>}
      {type === 'fehling' && <g opacity={0.9}><path d="M70 232 q10 -10 0 -20 M85 232 q10 -10 0 -20" stroke="#dc2626" strokeWidth="2.5" fill="none" strokeLinecap="round"/><text x="150" y="248" textAnchor="middle" fontSize="12.5" fill={COL.gris}>bain-marie chaud</text></g>}
      {type !== 'fehling' && <text x="150" y="250" textAnchor="middle" fontSize="12.5" fill={COL.gris}>{S.note}</text>}
      {type === 'fehling' && <text x="150" y="258" textAnchor="middle" fontSize="12.5" fill={COL.gris}>{S.note}</text>}
      {type === 'miroir' && p > 0.5 && <text x="202" y="150" fontSize="12.5" fontWeight="700" fill={COL.gris}>miroir d’argent</text>}
      {type === 'fehling' && p > 0.5 && <g fontSize="12.5" fontWeight="700" fill="#b45309"><text x="202" y="186">Cu₂O</text><text x="202" y="202">rouge brique</text></g>}
      {type === 'permanganate' && p > 0.5 && <text x="206" y="150" fontSize="13" fontWeight="700" fill="#7c4a24">MnO₂ brun</text>}
      {type === 'aluminium' && <text x="206" y="196" fontSize="13" fontWeight="700" fill={COL.gris}>lame d’Al</text>}
    </svg>);
}

// ---------------------------------------------------------------- cartes « À retenir » (viewBox 300 de large, textes de 12,5 à 16)
const Fond = ({ h, children }) => <svg viewBox={`0 0 300 ${h}`} width="100%" style={{ display: 'block', maxWidth: 320, margin: '0 auto' }} role="img">{children}</svg>;
const Pastille = ({ x, y, n, c }) => <g><circle cx={x} cy={y} r="13" fill={c}/><text x={x} y={y + 5} textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff">{n}</text></g>;

export function SvgMethodeCarte() {
  const L = [['1', 'élément', 'MnO₄⁻ = Mn²⁺', COL.ox], ['2', 'oxygène O', '+ 4 H₂O à droite', COL.h2o], ['3', 'hydrogène H', '+ 8 H⁺ à gauche', COL.hp], ['4', 'charges', '+ 5 e⁻ à gauche', COL.em]];
  return <Fond h="246"><title>Méthode en quatre temps pour une demi-équation</title>
    <text x="150" y="20" textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.encre}>Demi-équation : quatre temps, dans l’ordre</text>
    {L.map(([n, t, e, c], i) => <g key={n} transform={`translate(0 ${34 + i * 50})`}>
      <rect x="10" y="0" width="280" height="42" rx="12" fill="#fff" stroke={c} strokeWidth="2"/><Pastille x={32} y={21} n={n} c={c}/>
      <text x="54" y="17" fontSize="13" fontWeight="700" fill={c}>{t}</text><text x="54" y="35" fontSize="14" fontWeight="700" fill={COL.encre}>{e}</text></g>)}
    <text x="150" y="242" textAnchor="middle" fontSize="13" fill={COL.gris}>MnO₄⁻ + 8 H⁺ + 5 e⁻ = Mn²⁺ + 4 H₂O</text></Fond>;
}
export function SvgBilanCarte() {
  const R = [['Mn', '1', '1'], ['O', '4', '4'], ['H', '8', '8'], ['charge', '+2', '+2']];
  return <Fond h="206"><title>Bilan de vérification : éléments et charge</title>
    <text x="150" y="20" textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.encre}>On vérifie toujours le bilan</text>
    <text x="108" y="44" textAnchor="middle" fontSize="12.5" fill={COL.gris}>gauche</text><text x="232" y="44" textAnchor="middle" fontSize="12.5" fill={COL.gris}>droite</text>
    {R.map(([n, g, d], i) => <g key={n} transform={`translate(0 ${52 + i * 36})`}>
      <text x="14" y="21" fontSize="14" fontWeight="700" fill={COL.encre}>{n}</text>
      <rect x="78" y="2" width="60" height="28" rx="8" fill="#dcfce7"/><text x="108" y="22" textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.vert}>{g}</text>
      <text x="170" y="23" textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.vert}>✓</text>
      <rect x="202" y="2" width="60" height="28" rx="8" fill="#dcfce7"/><text x="232" y="22" textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.vert}>{d}</text></g>)}
    <text x="150" y="200" textAnchor="middle" fontSize="12.5" fill={COL.gris}>charge à gauche : −1 + 8 − 5 = +2</text></Fond>;
}
export function SvgSommeCarte() {
  return <Fond h="236"><title>Somme de deux demi-équations</title>
    <text x="150" y="20" textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.encre}>Équation de réaction : trois gestes</text>
    {[['×', '1', 'on multiplie pour égaliser les e⁻', 'ici ×2 (5 e⁻) et ×5 (2 e⁻) : 10 e⁻', COL.ox], ['+', '2', 'on additionne : les e⁻ disparaissent', 'ils n’existent pas en solution', COL.em], ['=', '3', 'on simplifie H₂O, H⁺ ou HO⁻ communs', '16 H⁺ à gauche, 10 H⁺ à droite : 6 H⁺', COL.h2o]].map(([, n, t, e, c], i) =>
      <g key={n} transform={`translate(0 ${34 + i * 64})`}><rect x="10" y="0" width="280" height="56" rx="12" fill="#fff" stroke={c} strokeWidth="2"/><Pastille x={32} y={28} n={n} c={c}/>
        <text x="54" y="23" fontSize="13" fontWeight="700" fill={c}>{t}</text><text x="54" y="43" fontSize="13" fill={COL.encre}>{e}</text></g>)}
  </Fond>;
}
export function SvgBasculeCarte() {
  return <Fond h="226"><title>Passage au milieu basique</title>
    <text x="150" y="20" textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.encre}>Milieu basique : H⁺ + HO⁻ donne H₂O</text>
    <circle cx="58" cy="78" r="26" fill={FOND.hp} stroke={COL.hp} strokeWidth="2.5"/><text x="58" y="85" textAnchor="middle" fontSize="20" fontWeight="800" fill={COL.hp}>H⁺</text>
    <text x="106" y="86" textAnchor="middle" fontSize="24" fontWeight="800" fill={COL.gris}>+</text>
    <circle cx="154" cy="78" r="26" fill={FOND.ohm} stroke={COL.ohm} strokeWidth="2.5"/><text x="154" y="85" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.ohm}>HO⁻</text>
    <path d="M190 78 H222" stroke={COL.gris} strokeWidth="3"/><path d="M216 70 l10 8 l-10 8" fill="none" stroke={COL.gris} strokeWidth="3"/>
    <circle cx="262" cy="78" r="26" fill={FOND.h2o} stroke={COL.h2o} strokeWidth="2.5"/><text x="262" y="85" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.h2o}>H₂O</text>
    {[['1', 'on ajoute autant de HO⁻ que de H⁺,', 'des deux côtés'], ['2', 'H⁺ + HO⁻ donne H₂O', 'puis on simplifie les H₂O']].map(([n, a, b], i) => <g key={n} transform={`translate(0 ${126 + i * 50})`}>
      <rect x="10" y="0" width="280" height="42" rx="12" fill="#fff" stroke={COL.hp} strokeWidth="2"/><Pastille x={32} y={21} n={n} c={COL.hp}/><text x="54" y="18" fontSize="13" fill={COL.encre}>{a}</text><text x="54" y="35" fontSize="13" fill={COL.encre}>{b}</text></g>)}
  </Fond>;
}
export function SvgSyntheseCarte() {
  return <Fond h="226"><title>Acide ou basique : quelles espèces ?</title>
    <text x="150" y="20" textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.encre}>Quelles espèces selon le milieu ?</text>
    {[[10, 'milieu acide', 'pH < 7', COL.hp, ['H⁺ et H₂O', 'jamais de HO⁻'], 'MnO₄⁻ + 8 H⁺ + 5 e⁻', '= Mn²⁺ + 4 H₂O'], [154, 'milieu basique', 'pH > 7', COL.ohm, ['HO⁻ et H₂O', 'jamais de H⁺'], 'MnO₄⁻ + 4 H₂O + 5 e⁻', '= Mn²⁺ + 8 HO⁻']].map(([x, t, p, c, l, e1, e2]) => <g key={t} transform={`translate(${x} 34)`}>
      <rect x="0" y="0" width="136" height="180" rx="14" fill="#fff" stroke={c} strokeWidth="2.5"/><text x="68" y="24" textAnchor="middle" fontSize="14" fontWeight="800" fill={c}>{t}</text><text x="68" y="42" textAnchor="middle" fontSize="12.5" fill={COL.gris}>{p}</text>
      <text x="68" y="72" textAnchor="middle" fontSize="13" fontWeight="700" fill={COL.encre}>{l[0]}</text><text x="68" y="90" textAnchor="middle" fontSize="13" fontWeight="700" fill={COL.rouge}>{l[1]}</text>
      <line x1="14" x2="122" y1="106" y2="106" stroke="#e2e8f0"/><text x="68" y="132" textAnchor="middle" fontSize="12.5" fill={COL.encre}>{e1}</text><text x="68" y="152" textAnchor="middle" fontSize="12.5" fill={COL.encre}>{e2}</text></g>)}
  </Fond>;
}
