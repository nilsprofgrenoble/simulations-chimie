// Schémas de la simulation 295 (titrage redox direct) : le montage de dosage animé (burette qui se vide, zoom de lecture, goutte qui tombe,
// tache violette qui se dissipe, bulles de O₂, erlenmeyer sur fond blanc, agitateur), le graphique des quantités de matière et les cartes « À retenir ».
import { useId } from 'react';
import { KIT, Cadre, ORANGE_GUIDE } from '../commun';
import { V_BURETTE, COUL_BURETTE, couleurMnO4 } from './tcrModele';

const C = { mn: '#86198f', mnFond: '#fae8ff', h2o2: '#0369a1', h2o2Fond: '#e0f2fe', vert: '#15803d', rouge: '#b91c1c', encre: '#0f172a', gris: '#475569', brun: '#92400e', orange: '#c2410c' };

const css = `
@media (prefers-reduced-motion: no-preference) {
  .tcr-chute { animation: tcr-chute 0.42s ease-in both; }
  @keyframes tcr-chute { from { transform: translateY(0); opacity: 1; } 90% { opacity: 1; } to { transform: translateY(var(--chute)); opacity: 0; } }
  .tcr-onde { transform-box: fill-box; transform-origin: center; animation: tcr-onde 0.8s ease-out 0.4s both; }
  @keyframes tcr-onde { from { transform: scale(0.4); opacity: 0.8; } to { transform: scale(5); opacity: 0; } }
  .tcr-fondu { animation: tcr-fondu 0.4s ease-out; } @keyframes tcr-fondu { from { opacity: 0; } to { opacity: 1; } }
}
`;
export const StylesTcr = () => <style>{css}</style>;

// ====================================================================== LE MONTAGE
/**
 * V : volume versé (mL). coul : couleur de la solution (persistante). trans : 0 à 1, tache violette en train de se dissiper.
 * ouvert : robinet ouvert. goutteCle : change à chaque goutte isolée (rejoue la chute). mot : mot qui décrit la teinte.
 * etiqBurette / etiqErlen : lignes de texte (null → « ? » ou masqué). acide : false = erlenmeyer sans acide (dépôt brun de MnO₂).
 */
export function SceneDosage({ anime = true, V, coul, trans = 0, ouvert, goutteCle = 0, mot = 'incolore', etiqBurette = null, etiqErlen = null, acide = true, hl = () => false, legende = true, bulles = false }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const yB0 = 46, yB1 = 226, yNiv = yB0 + V / V_BURETTE * (yB1 - yB0);
  const ySurf = 372 - (V / V_BURETTE) * 10, yBout = 292;
  const FLACON = 'M 250 298 L 250 332 Q 250 342 244 350 L 202 394 Q 196 400 205 400 L 335 400 Q 344 400 338 394 L 296 350 Q 290 342 290 332 L 290 298';
  const brun = !acide ? Math.min(0.85, V / 12) : 0;
  return (
    <svg viewBox="0 0 640 440" role="img" aria-label="Montage du titrage : burette contenant le permanganate, erlenmeyer sur agitateur magnétique"
      style={{ width: '100%', height: 'auto', display: 'block', background: '#f1f5f9', borderRadius: 10, border: `1px solid ${KIT.bord}` }}>
      <defs>
        <clipPath id={`${id}f`}><path d={`${FLACON} Z`}/></clipPath>
        <radialGradient id={`${id}n`}><stop offset="0" stopColor="#7e1f86" stopOpacity="0.95"/><stop offset="0.55" stopColor="#a21caf" stopOpacity="0.55"/><stop offset="1" stopColor="#c026d3" stopOpacity="0"/></radialGradient>
        <linearGradient id={`${id}v`} x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.5"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>
      </defs>
      {/* potence */}
      <rect x="120" y="420" width="512" height="12" rx="3" fill="#94a3b8"/><rect x="620" y="24" width="10" height="398" fill="#94a3b8"/>
      <rect x="262" y="131" width="360" height="8" fill="#94a3b8"/><rect x="254" y="124" width="36" height="22" rx="5" fill="#64748b"/>
      {/* burette */}
      <rect x="258" y="30" width="24" height={yB1 - 30} fill="#fff" stroke={KIT.txt} strokeWidth="2"/>
      <rect x="260" y={yNiv} width="20" height={yB1 - yNiv} fill={COUL_BURETTE}/>
      <rect x="263" y={yNiv} width="4" height={yB1 - yNiv} fill="#fff" opacity="0.35"/>
      <path d={`M 260 ${yNiv} Q 270 ${yNiv + 4} 280 ${yNiv}`} fill="none" stroke="#581c87" strokeWidth="1.6"/>
      {Array.from({ length: 26 }, (_, k) => k).map(v => {
        const y = yB0 + v / V_BURETTE * (yB1 - yB0);
        return <g key={v}><line x1="282" y1={y} x2={v % 5 === 0 ? 296 : 289} y2={y} stroke={KIT.txt} strokeWidth="1"/>
          {v % 5 === 0 && <text x="300" y={y + 7} fontSize="20" fill={KIT.txt}>{v}</text>}</g>;
      })}
      <path d={`M 258 ${yB1} L 266 ${yB1 + 20} L 274 ${yB1 + 20} L 282 ${yB1} Z`} fill={V < V_BURETTE ? COUL_BURETTE : '#fff'} stroke={KIT.txt} strokeWidth="2"/>
      <rect x="262" y={yB1 + 20} width="16" height="10" rx="2" fill="#cbd5e1" stroke={KIT.txt}/>
      <g style={{ transformBox: 'fill-box' }}><rect x="278" y={yB1 + 22} width="28" height="6" rx="3" fill={ouvert ? C.vert : C.rouge}
        transform={ouvert ? `rotate(-90 278 ${yB1 + 25})` : undefined}/></g>
      <path d={`M 266 ${yB1 + 30} L 266 ${yBout - 12} L 270 ${yBout} L 274 ${yBout - 12} L 274 ${yB1 + 30} Z`} fill={V < V_BURETTE ? COUL_BURETTE : '#fff'} stroke={KIT.txt} strokeWidth="1.8"/>
      <rect x="262" y="38" width="3" height={yB1 - 44} fill={`url(#${id}v)`} opacity="0.6"/>
      {/* étiquette de la burette */}
      <text x="346" y="40" fontSize="20" fontWeight="700" fill={KIT.txt2}>Burette</text>
      {etiqBurette ? etiqBurette.map((t, k) => <text key={k} x="346" y={68 + k * 25} fontSize="19.5" fill={KIT.txt}>{t}</text>)
        : <text x="346" y="84" fontSize="40" fontWeight="800" fill={ORANGE_GUIDE}>?</text>}
      {/* zoom de lecture */}
      {(() => {
        const z0 = 70, zy = 56, zh = 150, zw = 62, mlParPx = 2 / zh, Yz = v => zy + zh / 2 + (v - V) / mlParPx;
        return <g>
          <rect x={z0} y={zy} width={zw} height={zh} fill="#fff" stroke={KIT.txt} strokeWidth="1.5"/>
          <rect x={z0 + 1} y={Math.max(zy, Math.min(zy + zh, Yz(V)))} width={zw - 2} height={Math.max(0, zy + zh - Math.max(zy, Yz(V)))} fill={COUL_BURETTE}/>
          {Array.from({ length: 41 }, (_, k) => Math.round(V * 10) / 10 - 2 + k * 0.1).map(v => {
            const y = Yz(v); if (y < zy || y > zy + zh || v < -0.001 || v > V_BURETTE + 0.001) return null;
            const r10 = Math.round(v * 10);
            return <g key={r10}><line x1={z0 + zw - (r10 % 10 === 0 ? 20 : r10 % 5 === 0 ? 14 : 8)} y1={y} x2={z0 + zw} y2={y} stroke={r10 % 5 === 0 ? '#fff' : '#e9d5ff'} strokeWidth="1.4"/>
              {r10 % 10 === 0 && <text x={z0 - 4} y={y + 7} fontSize="20" fill={KIT.txt} textAnchor="end">{r10 / 10}</text>}</g>;
          })}
          <path d={`M ${z0} ${Yz(V) - 2} Q ${z0 + zw / 2} ${Yz(V) + 7} ${z0 + zw} ${Yz(V) - 2}`} fill="none" stroke="#581c87" strokeWidth="2"/>
          <line x1={z0 - 8} y1={zy + zh / 2} x2={z0 + zw + 8} y2={zy + zh / 2} stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 3"/>
          <text x={z0 + zw / 2} y={zy - 10} fontSize="20" fill={KIT.txt2} textAnchor="middle">zoom (mL)</text>
          <line x1={z0 + zw} y1={zy + zh / 2} x2="258" y2={yNiv} stroke="#94a3b8" strokeDasharray="3 3"/>
        </g>;
      })()}
      {/* fond blanc, agitateur, erlenmeyer */}
      <rect x="176" y="290" width="188" height="110" rx="10" fill="#fff" stroke="#cbd5e1"/>
      <rect x="186" y="400" width="168" height="20" rx="4" fill="#e2e8f0" stroke={KIT.txt} strokeWidth="1.5"/>
      <circle cx="208" cy="410" r="5" fill="none" stroke={KIT.txt}/><circle cx="332" cy="410" r="4" fill="#22c55e"/>
      <g clipPath={`url(#${id}f)`}>
        <rect x="190" y={ySurf} width="160" height={402 - ySurf} fill={coul}/>
        {brun > 0 && <rect x="190" y={ySurf} width="160" height={402 - ySurf} fill="#78350f" opacity={brun}/>}
        <ellipse cx="270" cy={ySurf + 16} rx={14 + trans * 38} ry={8 + trans * 16} fill={`url(#${id}n)`} opacity={Math.min(1, trans * 1.15)}/>
        {bulles && trans > 0.04 && [0, 1, 2, 3, 4, 5].map(i => <circle key={i} cx={248 + i * 9 + (i % 2) * 3} cy={ySurf + 24} r={2 + (i % 3) * 0.8} fill="#fff" stroke="#94a3b8" strokeWidth="0.8" opacity={Math.min(1, trans * 1.3)}>
          {anime && <animate attributeName="cy" values={`${ySurf + 30};${ySurf - 2}`} dur={`${1.1 + (i % 3) * 0.3}s`} begin={`${(i * 0.23).toFixed(2)}s`} repeatCount="indefinite"/>}</circle>)}
        <rect x="257" y="388" width="26" height="6" rx="3" fill="#fff" stroke="#64748b">
          {anime && <animate attributeName="width" values="26;6;26" dur="0.5s" repeatCount="indefinite"/>}{anime && <animate attributeName="x" values="257;267;257" dur="0.5s" repeatCount="indefinite"/>}</rect>
      </g>
      <line x1="230" y1={ySurf} x2="310" y2={ySurf} stroke="#fff" strokeOpacity="0.55" clipPath={`url(#${id}f)`}/>
      <path d={FLACON} fill="none" stroke={KIT.txt} strokeWidth="2.5" strokeLinejoin="round"/>
      <rect x="246" y="294" width="48" height="7" rx="2" fill="none" stroke={KIT.txt} strokeWidth="2"/>
      <path d="M 254 304 L 254 330" stroke="#fff" strokeWidth="3.5" opacity="0.7"/>
      {/* goutte(s) */}
      {ouvert && [0, 1, 2].map(k => <circle key={k} cx="270" cy={yBout + 4} r="3.4" fill={COUL_BURETTE}>
        {anime && <animate attributeName="cy" from={yBout + 3} to={ySurf - 2} dur="0.5s" begin={`${k * 0.17}s`} repeatCount="indefinite"/>}</circle>)}
      {ouvert && <ellipse cx="270" cy={ySurf} rx="6" ry="2" fill="none" stroke="#a21caf" strokeWidth="1.5" opacity="0.7">
        {anime && <animate attributeName="rx" values="4;24" dur="0.5s" repeatCount="indefinite"/>}{anime && <animate attributeName="opacity" values="0.8;0" dur="0.5s" repeatCount="indefinite"/>}</ellipse>}
      {!ouvert && goutteCle > 0 && <g key={goutteCle}>
        <circle className="tcr-chute" style={{ '--chute': `${ySurf - yBout - 6}px` }} cx="270" cy={yBout + 5} r="4" fill={COUL_BURETTE}/>
        <ellipse className="tcr-onde" cx="270" cy={ySurf} rx="8" ry="2.5" fill="none" stroke="#a21caf" strokeWidth="1.6"/></g>}
      {/* contenu de l’erlenmeyer et légende de teinte */}
      <text x="372" y="298" fontSize="20" fontWeight="700" fill={KIT.txt2}>Erlenmeyer</text>
      {etiqErlen && etiqErlen.map((t, k) => <text key={k} x="372" y={324 + k * 25} fontSize="19.5" fill={KIT.txt}>{t}</text>)}
      {legende && <g>
        <rect x="346" y="150" width="244" height="108" rx="10" fill="#fff" stroke={KIT.bord}/>
        <text x="360" y="174" fontSize="20" fontWeight="700" fill={KIT.txt}>teinte de la solution</text>
        <rect x="360" y="190" width="64" height="44" rx="8" fill={coul} stroke={KIT.txt}/>
        {trans > 0.15 && <rect x="360" y="190" width="64" height="44" rx="8" fill="#86198f" opacity={Math.min(0.9, trans)} />}
        <text x="438" y="220" fontSize="24" fontWeight="800" fill={C.mn}>{trans > 0.35 && mot === 'incolore' ? 'violet…' : mot}</text>
        <text x="360" y="251" fontSize="17" fill={KIT.txt2}>fond blanc : on voit mieux</text>
      </g>}
      <Cadre actif={hl('burette')} x={204} y={20} w={110} h={282}/>
      <Cadre actif={hl('erlen')} x={176} y={288} w={190} h={114}/>
      <Cadre actif={hl('agitateur')} x={180} y={398} w={180} h={26}/>
    </svg>
  );
}

// ====================================================================== GRAPHIQUE DES QUANTITÉS DE MATIÈRE
/** n(H₂O₂) restant, n(MnO₄⁻) en excès et n(MnO₄⁻) versé en fonction du volume versé : tracés seulement jusqu’au volume déjà versé. */
export function GraphQuantites({ s, V, etat }) {
  const W = 460, H = 250, x0 = 58, x1 = W - 14, y0 = 34, y1 = H - 44;
  const pasN = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5].find(p => Math.ceil(s.nA * 1.05 / p) <= 5) || 5, nmax = Math.max(Math.ceil(s.nA * 1.05 / pasN) * pasN, pasN), Vmax = V_BURETTE;
  const X = v => x0 + (v / Vmax) * (x1 - x0), Y = n => y1 - (n / nmax) * (y1 - y0);
  const pas = Math.max(0.05, Vmax / 250), pts = [];
  for (let v = 0; v <= V + 1e-9; v += pas) pts.push(v);
  if (pts[pts.length - 1] < V) pts.push(V);
  const calc = v => { const nB = s.cB * v, nEx = Math.max(0, nB - 0.4 * s.nA), nR = Math.max(0, s.nA - 2.5 * nB); return { nB, nEx, nR }; };
  const ligne = f => pts.map((v, k) => `${k ? 'L' : 'M'}${X(v).toFixed(1)} ${Y(f(calc(v))).toFixed(1)}`).join(' ');
  const ticksY = Array.from({ length: Math.round(nmax / pasN) + 1 }, (_, k) => k * pasN);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Quantités de matière de H₂O₂ restant et de MnO₄⁻ en excès en fonction du volume versé" style={{ width: '100%', height: 'auto', display: 'block', background: '#fff', borderRadius: 8, border: `1px solid ${KIT.bord}` }}>
      {ticksY.map(n => <g key={n}><line x1={x0} x2={x1} y1={Y(n)} y2={Y(n)} stroke="#e2e8f0"/><text x={x0 - 6} y={Y(n) + 6} fontSize="16" fill={KIT.txt2} textAnchor="end">{(Math.round(n * 100) / 100).toString().replace('.', ',')}</text></g>)}
      <text x="8" y="16" fontSize="16" fill={KIT.txt2}>n (mmol)</text>
      {[0, 5, 10, 15, 20, 25].map(v => <g key={v}><line x1={X(v)} x2={X(v)} y1={y1} y2={y1 + 5} stroke={KIT.txt}/><text x={X(v)} y={y1 + 22} fontSize="16" fill={KIT.txt2} textAnchor="middle">{v}</text></g>)}
      <line x1={x0} x2={x1} y1={y1} y2={y1} stroke={KIT.txt}/><line x1={x0} x2={x0} y1={y0} y2={y1} stroke={KIT.txt}/>
      <text x={(x0 + x1) / 2} y={H - 6} fontSize="16" fill={KIT.txt2} textAnchor="middle">volume de permanganate versé (mL)</text>
      <path d={ligne(o => o.nB)} fill="none" stroke="#c4b5fd" strokeWidth="2.5" strokeDasharray="6 4"/>
      <path d={ligne(o => o.nR)} fill="none" stroke={C.h2o2} strokeWidth="3.5" strokeLinecap="round"/>
      <path d={ligne(o => o.nEx)} fill="none" stroke={C.mn} strokeWidth="3.5" strokeLinecap="round"/>
      {V >= s.Veq && <g><line x1={X(s.Veq)} x2={X(s.Veq)} y1={y0} y2={y1} stroke={ORANGE_GUIDE} strokeDasharray="4 4" strokeWidth="2"/><text x={X(s.Veq) + 5} y={y0 + 14} fontSize="16" fontWeight="700" fill={C.orange}>équivalence</text></g>}
      <circle cx={X(V)} cy={Y(etat.nH2O2)} r="5.5" fill={C.h2o2} stroke="#fff" strokeWidth="1.5"/>
      <circle cx={X(V)} cy={Y(etat.nExces)} r="5.5" fill={C.mn} stroke="#fff" strokeWidth="1.5"/>
      <g fontSize="16" fontWeight="700"><line x1="300" x2="320" y1="40" y2="40" stroke={C.h2o2} strokeWidth="3.5"/><text x="326" y="45" fill={C.h2o2}>H₂O₂ restant</text>
        <line x1="300" x2="320" y1="62" y2="62" stroke={C.mn} strokeWidth="3.5"/><text x="326" y="67" fill={C.mn}>MnO₄⁻ en excès</text>
        <line x1="300" x2="320" y1="84" y2="84" stroke="#c4b5fd" strokeWidth="2.5" strokeDasharray="6 4"/><text x="326" y="89" fill={KIT.txt2}>MnO₄⁻ versé</text></g>
    </svg>
  );
}

// ====================================================================== CARTES « À RETENIR » (viewBox 300 de large, textes ≥ 12,5)
const Fond = ({ h, children, titre }) => <svg viewBox={`0 0 300 ${h}`} width="100%" style={{ display: 'block', maxWidth: 320, margin: '0 auto' }} role="img"><title>{titre}</title>{children}</svg>;
const Titre = ({ t }) => <text x="150" y="20" textAnchor="middle" fontSize="14" fontWeight="700" fill={C.encre}>{t}</text>;
const Verre = ({ x, y, coul, w = 56, h = 62, niv = 0.55, brun = false, bulles = false }) => {
  const yl = y + h * (1 - niv);
  return <g>
    <path d={`M${x + w * 0.34} ${y} V${y + h * 0.28} L${x + 2} ${y + h - 4} Q${x} ${y + h} ${x + 6} ${y + h} H${x + w - 6} Q${x + w} ${y + h} ${x + w - 2} ${y + h - 4} L${x + w * 0.66} ${y + h * 0.28} V${y}`} fill="#fff" stroke={C.encre} strokeWidth="2" strokeLinejoin="round"/>
    <path d={`M${x + w * 0.2} ${yl} L${x + 5} ${y + h - 4} Q${x + 4} ${y + h - 1} ${x + 8} ${y + h - 1} H${x + w - 8} Q${x + w - 4} ${y + h - 1} ${x + w - 5} ${y + h - 4} L${x + w * 0.8} ${yl} Z`} fill={coul} stroke="none"/>
    {brun && <g fill="#78350f"><circle cx={x + w * 0.35} cy={y + h - 8} r="3"/><circle cx={x + w * 0.55} cy={y + h - 12} r="3.5"/><circle cx={x + w * 0.7} cy={y + h - 7} r="2.6"/></g>}
    {bulles && <g fill="#fff" stroke="#94a3b8" strokeWidth="1"><circle cx={x + w * 0.4} cy={yl + 10} r="2.5"/><circle cx={x + w * 0.58} cy={yl + 20} r="2"/></g>}
  </g>;
};
const Ind = ({ t }) => t.split(/_([A-Za-z])/).map((m, i) => i % 2 ? <tspan key={i} fontSize="0.75em" dy="3">{m}</tspan> : (i > 0 && m ? <tspan key={i} dy="-3">{m}</tspan> : m));
const Ligne = ({ y, t, c = C.encre, gras = false, taille = 13 }) => <text x="150" y={y} textAnchor="middle" fontSize={taille} fontWeight={gras ? 700 : 400} fill={c}>{t}</text>;

export function SvgReactionCarte() {
  return <Fond h="226" titre="Deux permanganate pour cinq eau oxygénée">
    <Titre t="Qui réagit avec qui ?"/>
    <rect x="8" y="34" width="132" height="86" rx="14" fill={C.mnFond} stroke={C.mn} strokeWidth="2"/>
    <rect x="160" y="34" width="132" height="86" rx="14" fill={C.h2o2Fond} stroke={C.h2o2} strokeWidth="2"/>
    {[0, 1].map(i => <circle key={i} cx={54 + i * 44} cy="68" r="17" fill={C.mn}/>)}
    {[0, 1, 2, 3, 4].map(i => <circle key={i} cx={186 + (i % 3) * 36 + (i > 2 ? 18 : 0)} cy={i > 2 ? 84 : 58} r="13" fill={C.h2o2}/>)}
    <text x="74" y="108" textAnchor="middle" fontSize="14" fontWeight="700" fill={C.mn}>2 MnO₄⁻</text><text x="226" y="108" textAnchor="middle" fontSize="14" fontWeight="700" fill={C.h2o2}>5 H₂O₂</text>
    <text x="150" y="82" textAnchor="middle" fontSize="22" fontWeight="800" fill={C.gris}>+</text>
    <rect x="12" y="132" width="276" height="44" rx="12" fill="#fff" stroke={C.orange} strokeWidth="2"/>
    <text x="150" y="152" textAnchor="middle" fontSize="13" fill={C.encre}>à l’équivalence, tout est consommé :</text>
    <text x="150" y="169" textAnchor="middle" fontSize="15" fontWeight="800" fill={C.encre}>n(H₂O₂) = 5/2 × n(MnO₄⁻)</text>
    <Ligne y="198" t="5 H₂O₂ pour 2 MnO₄⁻ : on lit les coefficients" c={C.gris} taille={12.5}/>
    <Ligne y="216" t="de l’équation, dans le bon sens" c={C.gris} taille={12.5}/>
  </Fond>;
}
export function SvgMilieuCarte() {
  return <Fond h="232" titre="Sans acide, le permanganate donne un dépôt brun">
    <Titre t="Le rôle du milieu acide"/>
    <rect x="8" y="30" width="134" height="150" rx="14" fill="#fff" stroke="#15803d" strokeWidth="2"/><rect x="158" y="30" width="134" height="150" rx="14" fill="#fff" stroke={C.rouge} strokeWidth="2"/>
    <text x="75" y="50" textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#15803d">avec H⁺ en excès</text><text x="225" y="50" textAnchor="middle" fontSize="13.5" fontWeight="800" fill={C.rouge}>sans acide</text>
    <Verre x={47} y={62} coul="#f8fafc" bulles/><Verre x={197} y={62} coul="#d6b88b" brun/>
    <text x="75" y="146" textAnchor="middle" fontSize="13" fill={C.encre}>Mn²⁺ incolore</text><text x="75" y="164" textAnchor="middle" fontSize="13" fill={C.encre}>+ bulles de O₂</text>
    <text x="225" y="146" textAnchor="middle" fontSize="13" fill={C.encre}>MnO₂ brun</text><text x="225" y="164" textAnchor="middle" fontSize="13" fill={C.encre}>teinte illisible</text>
    <rect x="12" y="190" width="276" height="34" rx="10" fill="#fdf2f8" stroke="#be185d" strokeWidth="1.5"/>
    <text x="150" y="212" textAnchor="middle" fontSize="13.5" fontWeight="700" fill="#9d174d">Les 6 H⁺ de l’équation réagissent</text>
  </Fond>;
}
export function SvgSituationsCarte() {
  const cas = [['avant', couleurMnO4(0), 'incolore', 'H₂O₂ en excès', '#0369a1'], ['à', couleurMnO4(0), 'incolore', 'rien en excès', '#b45309'], ['après', couleurMnO4(2e-4), 'rose', 'MnO₄⁻ en excès', C.mn]];
  return <Fond h="236" titre="Avant, à et après l’équivalence">
    <Titre t="Avant, à, après l’équivalence"/>
    {cas.map(([t, coul, mot, ex, c], i) => <g key={t} transform={`translate(${6 + i * 98} 30)`}>
      <rect x="0" y="0" width="92" height="172" rx="12" fill="#fff" stroke={c} strokeWidth="2"/>
      <text x="46" y="20" textAnchor="middle" fontSize="14" fontWeight="800" fill={c}>{t === 'à' ? 'à l’équiv.' : t === 'avant' ? 'avant' : 'après'}</text>
      <Verre x={18} y={32} coul={coul} niv={0.6}/>
      <text x="46" y="118" textAnchor="middle" fontSize="13" fontWeight="700" fill={C.encre}>{mot}</text>
      <text x="46" y="138" textAnchor="middle" fontSize="12.5" fill={C.gris}>{ex.split(' ').slice(0, 2).join(' ')}</text><text x="46" y="154" textAnchor="middle" fontSize="12.5" fill={C.gris}>{ex.split(' ').slice(2).join(' ')}</text>
    </g>)}
    <Ligne y="226" t="permanganate : limitant, puis en excès" c={C.gris} taille={12.5}/>
  </Fond>;
}
export function SvgEquivalenceCarte() {
  return <Fond h="232" titre="La première goutte qui reste rose">
    <Titre t="Le permanganate est son propre indicateur"/>
    <path d="M 74 34 V 62" stroke={C.encre} strokeWidth="3"/><circle cx="74" cy="72" r="5" fill={C.mn}/>
    <Verre x={46} y={92} coul={couleurMnO4(1e-4)} niv={0.55}/>
    <text x="74" y="170" textAnchor="middle" fontSize="13" fontWeight="700" fill={C.mn}>rose qui reste</text>
    <rect x="124" y="34" width="168" height="136" rx="12" fill="#fff" stroke={C.orange} strokeWidth="2"/>
    {[['1', 'avant :', 'goutte décolorée'], ['2', 'équivalence :', 'la goutte reste rose'], ['3', '1 goutte ≈ 0,05 mL', 'donc V_E à 0,05 près']].map(([n, a, b], i) => <g key={n} transform={`translate(0 ${i * 42})`}>
      <circle cx="144" cy="58" r="11" fill={C.orange}/><text x="144" y="63" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">{n}</text>
      <text x="162" y="55" fontSize="12.5" fontWeight="700" fill={C.encre}>{a}</text><text x="162" y="71" fontSize="12.5" fill={C.encre}><Ind t={b}/></text></g>)}
    <rect x="12" y="184" width="276" height="38" rx="10" fill={C.mnFond} stroke={C.mn} strokeWidth="1.5"/>
    <text x="150" y="208" textAnchor="middle" fontSize="13" fontWeight="700" fill={C.mn}>on n’ajoute aucun indicateur coloré</text>
  </Fond>;
}
export function SvgCalculCarte() {
  const L = [['1', 'quantité versée', 'n(MnO₄⁻) = c_B × V_E', '0,0100 × 12,0 = 0,120 mmol', C.mn], ['2', 'coefficients 5/2', 'n(H₂O₂) = 5/2 × n(MnO₄⁻)', '5/2 × 0,120 = 0,300 mmol', C.h2o2], ['3', 'concentration prélevée', 'c_A = n(H₂O₂) / V_A', '0,300 / 20,0 = 0,0150 mol/L', C.orange]];
  return <Fond h="252" titre="Du volume équivalent à la concentration">
    <Titre t="Du volume équivalent à la concentration"/>
    {L.map(([n, t, f, e, c], i) => <g key={n} transform={`translate(0 ${32 + i * 68})`}>
      <rect x="10" y="0" width="280" height="60" rx="12" fill="#fff" stroke={c} strokeWidth="2"/>
      <circle cx="30" cy="30" r="13" fill={c}/><text x="30" y="35" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff">{n}</text>
      <text x="52" y="19" fontSize="12.5" fontWeight="700" fill={c}>{t}</text><text x="52" y="37" fontSize="13.5" fontWeight="700" fill={C.encre}><Ind t={f}/></text><text x="52" y="53" fontSize="12.5" fill={C.gris}>exemple : {e}</text></g>)}
    <Ligne y="244" t="puis × dilution : solution du flacon" c={C.gris} taille={12.5}/>
  </Fond>;
}
