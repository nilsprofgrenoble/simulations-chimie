// ====================================================
//  Schémas de la simulation 133 (électrolyse et accumulateur, niveau TG).
//  Scène : viewBox de 400 de large, police ≥ 17. Cartes « À retenir » : viewBox de 400 de large, police ≥ 16.
//  Couleurs : vert = électrons / sens spontané, orange = sens forcé et grandeur à repérer, rouge = pôle +, bleu = ions.
//  Indices en caractères Unicode (jamais de tspan) ; tout le texte DANS le viewBox.
// ====================================================
import { METAUX } from './pileModele';
import { Becher, Lame, Signe, Fleche } from './pileSchemas';
import { puiss10 } from './electrolyseModele';

const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', txt: '#0f172a', e: '#15803d', gel: '#fef3c7' };
const stl = { width: '100%', height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const concTxt = c => (c < 1e-4 ? '≈ 0 mol/L' : c < 0.01 ? `${nbf(c, 4)} mol/L` : `${nbf(c, 3)} mol/L`);
const opac = (id, c) => (id === 'cu' ? 0.15 + 0.7 * Math.min(c / 0.2, 1) : id === 'fe' ? 0.15 + 0.5 * Math.min(c / 0.2, 1) : 0.35);
const couleurSol = id => (id === 'cu' ? '#0ea5e9' : id === 'fe' ? '#86efac' : '#cbd5e1');
let _id = 0;

// ====================================================
//  Scène : accumulateur (deux demi-piles, pont salin) relié à un conducteur ohmique ou à un générateur et un ampèremètre.
//  g, d : demi-piles { id, c, m } ; et : résultat de fonctionner() ; m0 : masses de départ { g, d } ;
//  appareil 'res' (conducteur ohmique) ou 'gen' (générateur de tension U_G) ; I : intensité signée (> 0 : forcé).
// ====================================================
export function SceneAccu({ g, d, et, m0, appareil = 'gen', UG = 0, I = 0, lecture = true, flux = true, polarite = true, ions = false, noms = false, cache = false }) {
  const id = ++_id, G = METAUX[g.id], D = METAUX[d.id], XG = 51, XD = 349, plusG = et.plusG;
  const cG = plusG ? et.cP : et.cM, cD = plusG ? et.cM : et.cP;
  const mG = plusG ? et.mP : et.mM, mD = plusG ? et.mM : et.mP;
  // changements de masse exagérés à l'écran pour être visibles (0,1 g se voit)
  const lame = (m, mRef, metal) => ({ metal, fraction: m < mRef ? Math.max(0.35, 1 - 3 * (mRef - m) / mRef) : 1, depot: m > mRef ? Math.min(8, 8 * (m - mRef) / 0.15) : 0, couleurDepot: metal });
  const xMoins = plusG ? XD : XG, xPlus = plusG ? XG : XD;
  const force = I > 0, courant = I !== 0 && flux && !cache && !et.arret;
  // électrons : du pôle − vers le pôle + (spontané) ; du pôle + vers le pôle − (forcé)
  const dep = force ? xPlus : xMoins, arr = force ? xMoins : xPlus;
  const cheminE = `M${dep} 80 V40 H${arr} V80`;
  const ampli = cache ? '? A' : `${nbf(Math.abs(I), 2)} A`;
  const aria = `Accumulateur : à gauche une ${G.lame} dans une solution de ${G.sol}, à droite une ${D.lame} dans une solution de ${D.sol}, reliées par un pont salin. `
    + (appareil === 'gen' ? `Générateur de tension ${UG == null ? 'non réglée' : nbf(UG, 2) + ' volt'}, borne plus reliée au pôle plus de la pile. ` : 'Les lames sont reliées par un conducteur ohmique. ')
    + (cache ? '' : I === 0 ? 'Aucun courant.' : force ? 'Le générateur force les électrons à entrer par le pôle moins.' : 'La pile débite : les électrons sortent par le pôle moins.');
  const xe = force ? (xPlus < 200 ? 70 : 330) : (xMoins < 200 ? 70 : 330), sensE = force ? (xPlus < 200 ? 1 : -1) : (xMoins < 200 ? 1 : -1);
  return (
    <svg viewBox="0 0 400 362" style={{ ...stl, maxWidth: 500 }} role="img" aria-label={aria}>
      <style>{`.el-flux{stroke-dasharray:4 16;animation:el-f 1.2s linear infinite}@keyframes el-f{to{stroke-dashoffset:-20}}@media (prefers-reduced-motion: reduce){.el-flux{animation:none}}`}</style>
      <path d={`M${XG} 80 V40 H${XD} V80`} fill="none" stroke={COL.txt} strokeWidth="2.5"/>
      {courant && <path className="el-flux" d={cheminE} fill="none" stroke={COL.e} strokeWidth="5" strokeLinecap="round"/>}
      {appareil === 'res' ? <g>
        <rect x="166" y="30" width="68" height="20" fill="white" stroke={COL.txt} strokeWidth="2.5"/>
        <text x="200" y="76" fontSize="17" textAnchor="middle" fill={COL.txt}>conducteur ohmique</text>
      </g> : <g>
        <rect x="146" y="14" width="108" height="52" rx="8" fill="#1f2937"/>
        <text x="200" y="36" fontSize="17" textAnchor="middle" fill="white">générateur</text>
        <text x="200" y="59" fontSize="18" fontWeight="700" textAnchor="middle" fill="#d9f99d">{UG == null ? "— V" : `${nbf(UG, 2)} V`}</text>
        <text x={plusG ? 136 : 264} y="34" fontSize="20" fontWeight="800" textAnchor="middle" fill={COL.rouge}>+</text>
        <text x={plusG ? 264 : 136} y="34" fontSize="20" fontWeight="800" textAnchor="middle" fill={COL.txt}>−</text>
      </g>}
      {lecture && <g>
        <circle cx={plusG ? 100 : 300} cy="40" r="16" fill="white" stroke={COL.txt} strokeWidth="2.5"/>
        <text x={plusG ? 100 : 300} y="47" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.txt}>A</text>
        <text x={plusG ? 100 : 300} y="18" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.txt}>{ampli}</text>
      </g>}
      {courant && <g>
        <Fleche x1={xe} x2={xe + 48 * sensE} y={62} c={COL.e}/>
        <text x={xe + 24 * sensE} y="84" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.e}>e⁻</text>
      </g>}
      {/* pont salin */}
      <path d="M130 250 V118 H270 V250" fill="none" stroke={COL.txt} strokeWidth="20" strokeLinejoin="round"/>
      <path d="M130 250 V118 H270 V250" fill="none" stroke={COL.gel} strokeWidth="15" strokeLinejoin="round"/>
      <rect x="122" y="240" width="16" height="12" fill="white" stroke={COL.txt}/><rect x="262" y="240" width="16" height="12" fill="white" stroke={COL.txt}/>
      <text x="200" y="106" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.orange}>pont salin</text>
      <text x="200" y="145" fontSize="17" textAnchor="middle" fill={COL.txt}>K⁺ + NO₃⁻</text>
      <Becher x1={25} x2={165} id={`eg${id}`} sol={couleurSol(g.id)} op={opac(g.id, cG)}/>
      <Becher x1={235} x2={375} id={`ed${id}`} sol={couleurSol(d.id)} op={opac(d.id, cD)}/>
      <Lame cx={XG} {...lame(mG, m0.g, G.metal)}/><Lame cx={XD} {...lame(mD, m0.d, D.metal)}/>
      {ions && courant && (() => {
        // les anions vont là où apparaissent des cations : côté pôle − (spontané) ou côté pôle + (forcé)
        const xAn = force ? xPlus : xMoins, xCat = force ? xMoins : xPlus;
        return [[xAn < 200 ? 96 : 304, 'NO₃⁻', COL.bleu], [xCat < 200 ? 96 : 304, 'K⁺', COL.rouge]].map(([x, nom, c]) => <g key={nom}>
          <text x={x} y="174" fontSize="18" fontWeight="700" textAnchor="middle" fill={c}>{nom}</text>
          <line x1={x} y1="182" x2={x} y2="214" stroke={c} strokeWidth="3"/><polygon points={`${x},226 ${x - 7},212 ${x + 7},212`} fill={c}/>
        </g>);
      })()}
      {polarite && <><Signe x={XG + 30} y={110} plus={plusG}/><Signe x={XD - 30} y={110} plus={!plusG}/></>}
      {noms && courant && <>
        <text x={xMoins < 200 ? 112 : 288} y="266" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.orange}>{force ? 'cathode' : 'anode'}</text>
        <text x={xPlus < 200 ? 112 : 288} y="266" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.orange}>{force ? 'anode' : 'cathode'}</text>
      </>}
      <text x="95" y="292" fontSize="17" textAnchor="middle" fill={COL.txt}>{G.ion} + {G.anion}</text>
      <text x="305" y="292" fontSize="17" textAnchor="middle" fill={COL.txt}>{D.ion} + {D.anion}</text>
      <text x="95" y="326" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.txt}>{G.ion} / {G.m}</text>
      <text x="305" y="326" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.txt}>{D.ion} / {D.m}</text>
      <text x="95" y="352" fontSize="17" textAnchor="middle" fill={COL.gris}>{concTxt(cG)}</text>
      <text x="305" y="352" fontSize="17" textAnchor="middle" fill={COL.gris}>{concTxt(cD)}</text>
    </svg>);
}

// ====================================================
//  Échelle des Qr (logarithmique de 0,01 à 100, puis coupure et K très loin à droite)
// ====================================================
export function EchelleQr({ logQr, logK, sens, depart }) {
  const X = lg => 40 + 240 * (Math.min(Math.max(lg, -2), 2) + 2) / 4;
  const hors = logQr < -2 || logQr > 2;
  const grad = [[-2, '0,01'], [-1, '0,1'], [0, '1'], [1, '10'], [2, '100']];
  const Qtxt = Math.abs(logQr) < 2 ? nbf(10 ** logQr, Math.abs(logQr) < 1 ? 2 : 1) : puiss10(logQr);
  return (
    <svg viewBox="0 0 400 168" style={{ ...stl, maxWidth: 520 }} role="img"
      aria-label={`Échelle des quotients de réaction : Qr vaut ${Qtxt}, la constante K vaut ${puiss10(logK)}, très loin à droite. ${sens === 'force' ? 'Le générateur force Qr à s’éloigner de K.' : sens === 'spontane' ? 'Le système évolue spontanément : Qr se rapproche de K.' : 'Aucun courant : Qr ne change pas.'}`}>
      <line x1="30" y1="96" x2="296" y2="96" stroke={COL.txt} strokeWidth="2"/>
      <line x1="300" y1="104" x2="310" y2="88" stroke={COL.txt} strokeWidth="2"/><line x1="308" y1="104" x2="318" y2="88" stroke={COL.txt} strokeWidth="2"/>
      <line x1="322" y1="96" x2="372" y2="96" stroke={COL.txt} strokeWidth="2"/>
      {grad.map(([lg, t]) => <g key={lg}><line x1={X(lg)} y1="90" x2={X(lg)} y2="102" stroke={COL.txt}/><text x={X(lg)} y="124" fontSize="16" textAnchor="middle" fill={COL.txt}>{t}</text></g>)}
      <line x1="356" y1="84" x2="356" y2="108" stroke={COL.rouge} strokeWidth="3"/>
      <text x="356" y="124" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.rouge}>K</text>
      <text x="390" y="150" fontSize="16" textAnchor="end" fill={COL.rouge}>K ≈ {puiss10(logK)}</text>
      <text x="8" y="150" fontSize="16" fill={COL.gris}>Qr (échelle logarithmique)</text>
      {depart != null && Math.abs(depart - logQr) > 0.01 && <circle cx={X(depart)} cy="96" r="6" fill="white" stroke={COL.gris} strokeWidth="2"/>}
      <circle cx={X(logQr)} cy="96" r="8" fill={COL.bleu} stroke="white" strokeWidth="2"/>
      <text x={Math.min(Math.max(X(logQr), 60), 250)} y="76" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.bleu}>Qr = {Qtxt}{hors ? ' (hors échelle)' : ''}</text>
      {sens === 'spontane' && <g><Fleche x1={200} x2={340} y={30} c={COL.vert} w={3}/><text x="196" y="36" fontSize="17" fontWeight="700" textAnchor="end" fill={COL.vert}>spontané : vers K</text></g>}
      {sens === 'force' && <g><Fleche x1={340} x2={200} y={30} c={COL.orange} w={3}/><text x="196" y="36" fontSize="17" fontWeight="700" textAnchor="end" fill={COL.orange}>forcé : loin de K</text></g>}
      {sens === 'aucun' && <text x="200" y="36" fontSize="17" textAnchor="middle" fill={COL.gris}>aucun courant : Qr ne change pas</text>}
    </svg>);
}

// ====================================================
//  Cartes « À retenir » (viewBox 400 de large, police ≥ 16)
// ====================================================
const stc = { ...stl, maxWidth: 420 };
const T = ({ x, y, s = 16, c = COL.txt, a = 'middle', w = 400, children }) => <text x={x} y={y} fontSize={s} fill={c} textAnchor={a} fontWeight={w}>{children}</text>;

// mini-accumulateur : lames Zn (gauche) et Cu (droite), générateur au-dessus, flèche des électrons
function MiniAccu({ x, UG, force }) {
  return <g>
    <rect x={x + 10} y={120} width="60" height="56" fill="#cbd5e1" opacity="0.5"/><path d={`M${x + 10} 100 V176 H${x + 70} V100`} fill="none" stroke={COL.txt} strokeWidth="2"/>
    <rect x={x + 110} y={120} width="60" height="56" fill="#0ea5e9" opacity="0.4"/><path d={`M${x + 110} 100 V176 H${x + 170} V100`} fill="none" stroke={COL.txt} strokeWidth="2"/>
    <rect x={x + 34} y={78} width="12" height="92" fill={METAUX.zn.metal} stroke={COL.txt}/><rect x={x + 134} y={78} width="12" height="92" fill={METAUX.cu.metal} stroke={COL.txt}/>
    <path d={`M${x + 40} 78 V52 H${x + 140} V78`} fill="none" stroke={COL.txt} strokeWidth="2"/>
    <rect x={x + 58} y={38} width="64" height="28" rx="5" fill="#1f2937"/><T x={x + 90} y={58} s={16} c="#d9f99d" w={700}>{UG}</T>
    <T x={x + 40} y={196} s={16} w={700}>Zn (−)</T><T x={x + 140} y={196} s={16} w={700} c={COL.rouge}>Cu (+)</T>
    {force ? <Fleche x1={x + 120} x2={x + 60} y={86} c={COL.orange} w={3}/> : <Fleche x1={x + 60} x2={x + 120} y={86} c={COL.vert} w={3}/>}
    <T x={x + 90} y={108} s={16} c={force ? COL.orange : COL.vert} w={700}>e⁻</T>
  </g>;
}
// carte 1 : la tension du générateur décide du sens
export function SvgForcerCarte() {
  return (
    <svg viewBox="0 0 400 276" style={stc} role="img" aria-label="Pile zinc-cuivre de tension à vide 1,09 volt reliée à un générateur. À 0,60 volt, la pile débite : les électrons sortent par le zinc, sens spontané. À 1,60 volt, le générateur force : les électrons entrent par le zinc, sens inverse.">
      <T x={100} y={22} s={17} w={700}>générateur à 0,60 V</T><T x={300} y={22} s={17} w={700}>générateur à 1,60 V</T>
      <line x1="200" y1="8" x2="200" y2="236" stroke="#cbd5e1" strokeWidth="2"/>
      <MiniAccu x={10} UG="0,60 V"/><MiniAccu x={210} UG="1,60 V" force/>
      <T x={100} y={222} s={16} c={COL.vert} w={700}>la pile débite</T><T x={300} y={222} s={16} c={COL.orange} w={700}>le générateur force</T>
      <T x={200} y={248} s={16}>tension à vide de la pile : 1,09 V</T>
      <T x={200} y={270} s={16} c={COL.gris}>forcer : générateur au-dessus de la tension à vide</T>
    </svg>);
}
// carte 2 : anode et cathode suivent la réaction, les pôles restent
export function SvgNomsCarte() {
  const cell = (x, y, pole, reac, nom) => <g>
    <T x={x} y={y} s={16} c={pole === 'pôle +' ? COL.rouge : COL.txt} w={700}>{pole}</T>
    <T x={x} y={y + 22} s={16} c={COL.bleu}>{reac}</T>
    <T x={x} y={y + 46} s={17} c={COL.orange} w={700}>{nom}</T>
  </g>;
  return (
    <svg viewBox="0 0 400 262" style={stc} role="img" aria-label="Tableau : quand la pile débite, la lame de zinc est le pôle moins, siège d’une oxydation, c’est l’anode ; la lame de cuivre est le pôle plus, siège d’une réduction, la cathode. Pendant la charge forcée, le zinc reste le pôle moins mais devient la cathode (réduction), le cuivre reste le pôle plus mais devient l’anode (oxydation).">
      <rect x="80" y="6" width="156" height="32" rx="6" fill="#dcfce7"/><rect x="240" y="6" width="156" height="32" rx="6" fill="#ffedd5"/>
      <T x={158} y={28} s={16} w={700} c={COL.vert}>la pile débite</T><T x={318} y={28} s={16} w={700} c={COL.orange}>charge forcée</T>
      <T x={40} y={86} s={17} w={700}>zinc</T><T x={40} y={176} s={17} w={700}>cuivre</T>
      <line x1="4" y1="128" x2="396" y2="128" stroke="#cbd5e1" strokeWidth="2"/>
      {cell(158, 66, 'pôle −', 'oxydation', 'anode')}{cell(318, 66, 'pôle −', 'réduction', 'cathode')}
      {cell(158, 156, 'pôle +', 'réduction', 'cathode')}{cell(318, 156, 'pôle +', 'oxydation', 'anode')}
      <T x={200} y={236} s={16} w={700}>les pôles restent, les noms suivent la réaction</T>
      <T x={200} y={256} s={16} c={COL.gris}>Anode-Oxydation : deux voyelles</T>
    </svg>);
}
// carte 3 : spontané vers K, forcé loin de K
export function SvgQrCarte() {
  return (
    <svg viewBox="0 0 400 220" style={stc} role="img" aria-label="Axe des quotients de réaction. Spontanément, Qr se rapproche de K : la pile débite. Le générateur force Qr à s’éloigner de K : c’est la charge. Exemple : en une heure de charge, Qr passe de 3,0 à 1,9.">
      <line x1="20" y1="110" x2="300" y2="110" stroke={COL.txt} strokeWidth="2"/>
      <line x1="304" y1="118" x2="314" y2="102" stroke={COL.txt} strokeWidth="2"/><line x1="312" y1="118" x2="322" y2="102" stroke={COL.txt} strokeWidth="2"/>
      <line x1="326" y1="110" x2="390" y2="110" stroke={COL.txt} strokeWidth="2"/>
      <line x1="364" y1="98" x2="364" y2="122" stroke={COL.rouge} strokeWidth="3"/><T x={364} y={142} s={17} c={COL.rouge} w={700}>K</T>
      <circle cx="160" cy="110" r="7" fill={COL.bleu}/><T x={160} y={142} s={16} c={COL.bleu} w={700}>Qr</T>
      <Fleche x1={176} x2={330} y={66} c={COL.vert} w={3}/><T x={250} y={52} s={16} c={COL.vert} w={700}>spontané (pile) : vers K</T>
      <Fleche x1={144} x2={30} y={66} c={COL.orange} w={3}/><T x={86} y={52} s={16} c={COL.orange} w={700}>forcé (charge)</T>
      <T x={86} y={90} s={16} c={COL.orange}>loin de K</T>
      <T x={200} y={180} s={16}>exemple : 1 h de charge, Qr de 3,0 à 1,9</T>
      <T x={200} y={206} s={16} c={COL.gris}>s’éloigner de K demande de l’énergie</T>
    </svg>);
}
// carte 4 : de la durée à la quantité de matière
function FracSvg({ x, y, haut, bas, c = COL.txt }) {
  const w = Math.max(haut.length, bas.length) * 9 + 6;
  return <g><T x={x} y={y - 6} s={16} c={c} w={700}>{haut}</T><line x1={x - w / 2} y1={y} x2={x + w / 2} y2={y} stroke={c} strokeWidth="1.5"/><T x={x} y={y + 17} s={16} c={c} w={700}>{bas}</T></g>;
}
export function SvgQuantiteCarte() {
  const boite = (y, h, c = COL.txt, f = '#f8fafc') => <rect x="20" y={y} width="360" height={h} rx="8" fill={f} stroke={c} strokeWidth="2"/>;
  const fl = y => <polygon points={`200,${y + 10} 192,${y} 208,${y}`} fill={COL.gris}/>;
  return (
    <svg viewBox="0 0 400 268" style={stc} role="img" aria-label="Chaîne de calcul : intensité 0,10 ampère pendant 30 minutes, soit 1 800 secondes ; charge Q égale I fois delta t, 180 coulombs ; quantité d’électrons égale Q sur F, 1,9 fois 10 puissance moins 3 mole ; Zn2+ plus 2 électrons donne Zn, donc quantité de zinc déposé égale n(e−) sur 2, 9,3 fois 10 puissance moins 4 mole.">
      {boite(4, 36)}<T x={200} y={28} s={16} w={700}>I = 0,10 A pendant Δt = 30 min = 1 800 s</T>{fl(44)}
      {boite(58, 36, COL.orange, '#fff7ed')}<T x={200} y={82} s={16} c={COL.orange} w={700}>Q = I × Δt = 180 C</T>{fl(98)}
      {boite(112, 50, COL.e)}<T x={110} y={142} s={16} c={COL.e} w={700}>n(e⁻) =</T><FracSvg x={158} y={137} haut="Q" bas="F" c={COL.e}/><T x={176} y={142} s={16} c={COL.e} w={700} a="start">= 1,9 × 10⁻³ mol</T>{fl(166)}
      {boite(180, 50, COL.bleu)}<T x={100} y={210} s={16} c={COL.bleu} w={700}>n(Zn) =</T><FracSvg x={158} y={205} haut="n(e⁻)" bas="2" c={COL.bleu}/><T x={186} y={210} s={16} c={COL.bleu} w={700} a="start">= 9,3 × 10⁻⁴ mol</T>
      <T x={200} y={256} s={16} c={COL.gris}>2 car Zn²⁺ + 2 e⁻ → Zn ; F = 9,65 × 10⁴ C/mol</T>
    </svg>);
}
// carte 5 : l'accumulateur, une pile que l'on recharge
export function SvgAccuCarte() {
  const boite = (x, l1, l2) => <g><rect x={x} y="96" width="116" height="60" rx="8" fill="#f8fafc" stroke={COL.txt} strokeWidth="2.5"/><T x={x + 58} y={122} s={16} w={700}>{l1}</T><T x={x + 58} y={144} s={16} w={700}>{l2}</T></g>;
  return (
    <svg viewBox="0 0 400 262" style={stc} role="img" aria-label="Accumulateur. Décharge : c’est une pile, l’énergie chimique devient électrique, évolution spontanée. Charge : c’est une électrolyse, l’énergie électrique devient chimique, évolution forcée par un générateur.">
      {boite(30, 'énergie', 'chimique')}{boite(254, 'énergie', 'électrique')}
      <path d="M120 94 C160 52 230 52 266 90" fill="none" stroke={COL.vert} strokeWidth="3.5"/><polygon points="272,98 258,92 268,82" fill={COL.vert}/>
      <T x={200} y={24} s={16} c={COL.vert} w={700}>décharge = pile</T><T x={200} y={46} s={16} c={COL.vert}>spontanée</T>
      <path d="M280 158 C240 200 170 200 132 162" fill="none" stroke={COL.orange} strokeWidth="3.5"/><polygon points="126,154 140,160 130,170" fill={COL.orange}/>
      <T x={200} y={210} s={16} c={COL.orange} w={700}>charge = électrolyse</T><T x={200} y={230} s={16} c={COL.orange}>forcée par un générateur</T>
      <T x={200} y={250} s={16} c={COL.gris}>recharger un accumulateur, c’est électrolyser</T>
    </svg>);
}
