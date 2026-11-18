// ====================================================
//  Schémas de la simulation 132 (la pile, niveau TG).
//  Scène : viewBox de 400 de large (affichée à environ 0,8 sur ordinateur, 0,8 sur téléphone dans la boîte), police ≥ 17.
//  Cartes « À retenir » : viewBox de 400 de large, police ≥ 15.
//  Couleurs : bleu = ions Cu²⁺ / solution, orange = grandeur à repérer, vert = électrons, rouge = pôle +, noir = pôle −.
//  Indices en caractères Unicode (jamais de tspan) ; tout le texte DANS le viewBox.
// ====================================================
import { METAUX } from './pileModele';

const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', txt: '#0f172a', e: '#15803d', gel: '#fef3c7', cuivre: '#b45309' };
const stl = { width: '100%', height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const concTxt = c => (c < 1e-4 ? '≈ 0 mol/L' : c < 0.01 ? `${nbf(c, 4)} mol/L` : `${nbf(c, 2)} mol/L`);
const opac = (id, c) => (id === 'cu' ? 0.18 + 0.7 * Math.min(c / 0.2, 1) : id === 'fe' ? 0.15 + 0.5 * Math.min(c / 0.2, 1) : 0.35);
const couleurSol = id => (id === 'cu' ? '#0ea5e9' : id === 'fe' ? '#86efac' : '#cbd5e1');
let _id = 0;

// ---------- bécher (paroi + liquide découpé par la paroi) ----------
function Becher({ x1, x2, yTop = 150, yBas = 300, yLiq = 190, sol, op, id }) {
  const paroi = `M${x1} ${yTop} V${yBas - 10} Q${x1} ${yBas} ${x1 + 10} ${yBas} H${x2 - 10} Q${x2} ${yBas} ${x2} ${yBas - 10} V${yTop}`;
  return <g>
    <clipPath id={id}><path d={paroi + ' Z'}/></clipPath>
    <rect x={x1} y={yLiq} width={x2 - x1} height={yBas - yLiq + 2} fill={sol} opacity={op} clipPath={`url(#${id})`}/>
    <line x1={x1} y1={yLiq} x2={x2} y2={yLiq} stroke={COL.txt} strokeWidth="1.2" opacity="0.4"/>
    <path d={paroi} fill="none" stroke={COL.txt} strokeWidth="2.5" strokeLinejoin="round"/>
    <line x1={x1 - 6} y1={yTop} x2={x1 + 4} y2={yTop} stroke={COL.txt} strokeWidth="2.5" strokeLinecap="round"/>
    <line x1={x2 - 4} y1={yTop} x2={x2 + 6} y2={yTop} stroke={COL.txt} strokeWidth="2.5" strokeLinecap="round"/>
  </g>;
}
// ---------- lame métallique avec pince crocodile ; « fraction » rétrécit la partie immergée, « depot » épaissit (dépôt de métal) ----------
function Lame({ cx, yHaut = 92, yBas = 270, yLiq = 190, metal, fraction = 1, depot = 0, couleurDepot }) {
  const w = 18, wi = Math.max(5, w * Math.max(0.3, fraction));
  return <g>
    <rect x={cx - w / 2} y={yHaut} width={w} height={yLiq - yHaut} fill={metal} stroke={COL.txt} strokeWidth="1.5"/>
    <rect x={cx - wi / 2} y={yLiq} width={wi} height={yBas - yLiq} fill={metal} stroke={COL.txt} strokeWidth="1.5"/>
    {depot > 0 && <>
      <rect x={cx - w / 2 - depot} y={yLiq + 4} width={depot} height={yBas - yLiq - 4} fill={couleurDepot} opacity="0.9"/>
      <rect x={cx + w / 2} y={yLiq + 4} width={depot} height={yBas - yLiq - 4} fill={couleurDepot} opacity="0.9"/></>}
    <rect x={cx - 7} y={yHaut - 12} width="14" height="16" rx="2" fill="#1f2937"/>
  </g>;
}
function Signe({ x, y, plus }) {
  return <g><circle cx={x} cy={y} r="14" fill={plus ? COL.rouge : COL.txt}/><text x={x} y={y + 7} fontSize="22" fontWeight="800" textAnchor="middle" fill="white">{plus ? '+' : '−'}</text></g>;
}
function Fleche({ x1, x2, y, c, w = 2.5 }) {
  const s = Math.sign(x2 - x1);
  return <g><line x1={x1} y1={y} x2={x2 - 8 * s} y2={y} stroke={c} strokeWidth={w}/><polygon points={`${x2},${y} ${x2 - 10 * s},${y - 6} ${x2 - 10 * s},${y + 6}`} fill={c}/></g>;
}

// ====================================================
//  Scène 1 : lame de zinc plongée directement dans une solution de sulfate de cuivre
// ====================================================
export function SceneContact({ plonge }) {
  const id = `pc${++_id}`;
  return (
    <svg viewBox="0 0 400 330" style={{ ...stl, maxWidth: 460 }} role="img"
      aria-label={plonge ? 'Lame de zinc plongée dans une solution bleue de sulfate de cuivre : un dépôt rouge de cuivre recouvre la partie immergée et la solution devient plus pâle.'
        : 'Lame de zinc tenue au-dessus d’un bécher de solution bleue de sulfate de cuivre.'}>
      <Becher x1={120} x2={280} id={id} sol="#0ea5e9" op={plonge ? 0.3 : 0.8}/>
      <Lame cx={200} yHaut={plonge ? 92 : 20} yBas={plonge ? 270 : 160} yLiq={plonge ? 190 : 160} metal={METAUX.zn.metal} fraction={plonge ? 0.85 : 1}/>
      {plonge && [200, 222, 246, 262].map((y, k) => <g key={y}><circle cx={k % 2 ? 189 : 211} cy={y} r="5" fill={COL.cuivre}/><circle cx={k % 2 ? 211 : 189} cy={y + 9} r="4" fill={COL.cuivre}/></g>)}
      <text x="300" y="70" fontSize="18" fill={COL.txt}>lame de</text><text x="300" y="92" fontSize="18" fill={COL.txt}>zinc Zn</text>
      <line x1="296" y1="80" x2="214" y2={plonge ? 120 : 90} stroke={COL.gris} strokeWidth="1.5"/>
      {plonge && <><text x="20" y="214" fontSize="18" fontWeight="700" fill={COL.cuivre}>dépôt de</text><text x="20" y="236" fontSize="18" fontWeight="700" fill={COL.cuivre}>cuivre Cu</text>
        <line x1="104" y1="226" x2="184" y2="236" stroke={COL.cuivre} strokeWidth="1.5"/></>}
      <text x="200" y="320" fontSize="18" textAnchor="middle" fill={COL.txt}>{plonge ? 'solution plus pâle : moins de Cu²⁺' : 'Cu²⁺ + SO₄²⁻ (solution bleue)'}</text>
    </svg>);
}

// ====================================================
//  Scène 2 : la pile (deux demi-piles, pont salin, voltmètre ou conducteur ohmique)
//  g, d : demi-piles { id, c, V, m } ; et : état du modèle ; affichage : texte du voltmètre
// ====================================================
export function ScenePile({ g, d, et, pont, appareil = 'volt', borneV = 'd', affichage = '', polarite = false, debit = false, ions = false, cachee = false }) {
  const id = ++_id, G = METAUX[g.id], D = METAUX[d.id], XG = 51, XD = 349;
  const plusG = et.plus === g.id;
  // concentrations et masses actuelles de chaque côté
  const cG = plusG ? et.cPlus : et.cMoins, cD = plusG ? et.cMoins : et.cPlus;
  const fracMoins = et.mMoins / et.Mo.m, depot = Math.min(7, 7 * (et.mPlus - et.P.m) / 0.5);
  const xMoins = plusG ? XD : XG, xPlus = plusG ? XG : XD;
  const aria = `Pile : à gauche une ${G.lame} dans une solution de ${G.sol}, à droite une ${D.lame} dans une solution de ${D.sol}`
    + `${pont ? ', reliées par un pont salin' : ', sans pont salin'}. ${appareil === 'volt' ? `Voltmètre : ${affichage}.` : appareil === 'res' ? 'Les lames sont reliées par un conducteur ohmique : la pile débite.' : ''}`;
  const lameProps = (cote) => {
    const estPlus = (cote === 'g') === plusG, mid = METAUX[cote === 'g' ? g.id : d.id];
    return { metal: mid.metal, fraction: estPlus ? 1 : fracMoins, depot: estPlus ? Math.max(0, depot) : 0, couleurDepot: mid.metal };
  };
  const cheminE = `M${xMoins} 80 V40 H${xPlus} V80`;
  return (
    <svg viewBox="0 0 400 362" style={{ ...stl, maxWidth: 500 }} role="img" aria-label={aria}>
      <style>{`.pl-flux{stroke-dasharray:4 16;animation:pl-f 1.2s linear infinite}@keyframes pl-f{to{stroke-dashoffset:-20}}@media (prefers-reduced-motion: reduce){.pl-flux{animation:none}}`}</style>
      {/* fils */}
      {appareil !== 'aucun' && <path d={`M${XG} 80 V40 H${XD} V80`} fill="none" stroke={COL.txt} strokeWidth="2.5"/>}
      {debit && <path className="pl-flux" d={cheminE} fill="none" stroke={COL.e} strokeWidth="5" strokeLinecap="round"/>}
      {/* appareil */}
      {appareil === 'volt' && <g>
        <rect x="136" y="10" width="128" height="72" rx="10" fill="#1f2937"/>
        <rect x="148" y="18" width="104" height="34" rx="4" fill="#d9f99d"/>
        <text x="200" y="44" fontSize="24" fontWeight="700" textAnchor="middle" fill={COL.txt}>{affichage}</text>
        <text x="166" y="74" fontSize="17" fontWeight="700" textAnchor="middle" fill={borneV === 'g' ? '#fca5a5' : 'white'}>{borneV === 'g' ? 'V' : 'COM'}</text>
        <text x="234" y="74" fontSize="17" fontWeight="700" textAnchor="middle" fill={borneV === 'd' ? '#fca5a5' : 'white'}>{borneV === 'd' ? 'V' : 'COM'}</text>
      </g>}
      {appareil === 'res' && <g>
        <rect x="166" y="30" width="68" height="20" fill="white" stroke={COL.txt} strokeWidth="2.5"/>
        <text x="200" y="76" fontSize="17" textAnchor="middle" fill={COL.txt}>conducteur ohmique</text>
      </g>}
      {debit && <g>
        <text x={(xMoins + 200) / 2} y="28" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.e}>e⁻</text>
        <text x={(xPlus + 200) / 2} y="28" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.e}>e⁻</text>
        <Fleche x1={xMoins < 200 ? 80 : 320} x2={xMoins < 200 ? 128 : 272} y={58} c={COL.e}/>
      </g>}
      {/* pont salin */}
      {pont && <g>
        <path d="M130 250 V118 H270 V250" fill="none" stroke={COL.txt} strokeWidth="20" strokeLinejoin="round"/>
        <path d="M130 250 V118 H270 V250" fill="none" stroke={COL.gel} strokeWidth="15" strokeLinejoin="round"/>
        <rect x="122" y="240" width="16" height="12" fill="white" stroke={COL.txt}/><rect x="262" y="240" width="16" height="12" fill="white" stroke={COL.txt}/>
        <text x="200" y="106" fontSize="17" fontWeight="700" textAnchor="middle" fill={COL.orange}>pont salin</text>
        <text x="200" y="145" fontSize="17" textAnchor="middle" fill={COL.txt}>K⁺ + NO₃⁻</text>
      </g>}
      {/* béchers et lames */}
      <Becher x1={25} x2={165} id={`pg${id}`} sol={couleurSol(g.id)} op={opac(g.id, cG)}/>
      <Becher x1={235} x2={375} id={`pd${id}`} sol={couleurSol(d.id)} op={opac(d.id, cD)}/>
      <Lame cx={XG} {...lameProps('g')}/><Lame cx={XD} {...lameProps('d')}/>
      {pont && ions && [[xMoins < 200 ? 96 : 304, 'NO₃⁻', COL.bleu], [xPlus < 200 ? 96 : 304, 'K⁺', COL.rouge]].map(([x, nom, c]) => <g key={nom}>
        <text x={x} y="174" fontSize="18" fontWeight="700" textAnchor="middle" fill={c}>{nom}</text>
        <line x1={x} y1="182" x2={x} y2="214" stroke={c} strokeWidth="3"/><polygon points={`${x},226 ${x - 7},212 ${x + 7},212`} fill={c}/>
      </g>)}
      {polarite && <><Signe x={XG + 30} y={110} plus={plusG}/><Signe x={XD - 30} y={110} plus={!plusG}/></>}
      {/* ions de chaque solution */}
      <text x="95" y="292" fontSize="17" textAnchor="middle" fill={COL.txt}>{cachee ? 'ions X' : G.ion} + {G.anion}</text>
      <text x="305" y="292" fontSize="17" textAnchor="middle" fill={COL.txt}>{cachee ? 'ions Y' : D.ion} + {D.anion}</text>
      <text x="95" y="326" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.txt}>{G.ion} / {G.m}</text>
      <text x="305" y="326" fontSize="18" fontWeight="700" textAnchor="middle" fill={COL.txt}>{D.ion} / {D.m}</text>
      <text x="95" y="352" fontSize="17" textAnchor="middle" fill={COL.gris}>{concTxt(cG)}</text>
      <text x="305" y="352" fontSize="17" textAnchor="middle" fill={COL.gris}>{concTxt(cD)}</text>
    </svg>);
}

// ====================================================
//  Graphique : tension à vide selon la charge débitée (usure)
// ====================================================
export function CourbeUsure({ pts, Q, U, Qmax }) {
  const qM = Math.max(Qmax * 1.08, 1), uM = Math.max(...pts.map(p => p.U), 0.2) * 1.2;
  const X = q => 62 + 318 * q / qM, Y = u => 196 - 160 * u / uM;
  const pas = qM > 4000 ? 2000 : qM > 2000 ? 1000 : qM > 800 ? 500 : qM > 300 ? 100 : 50;
  const gradQ = []; for (let q = 0; q <= qM; q += pas) gradQ.push(q);
  const pasU = uM > 1.2 ? 0.5 : 0.2, gradU = []; for (let u = 0; u <= uM + 1e-9; u += pasU) gradU.push(u);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.Q).toFixed(1)} ${Y(p.U).toFixed(1)}`).join(' ');
  return (
    <svg viewBox="0 0 400 250" style={{ ...stl, maxWidth: 520 }} role="img"
      aria-label={`Tension à vide en fonction de la charge débitée : presque constante, puis chute à zéro quand la pile est usée. Point actuel : ${nbf(Q, 0)} coulombs, ${nbf(U, 2)} volt.`}>
      <line x1="62" y1="196" x2="384" y2="196" stroke={COL.txt} strokeWidth="2"/><line x1="62" y1="196" x2="62" y2="28" stroke={COL.txt} strokeWidth="2"/>
      {gradQ.map(q => <g key={q}><line x1={X(q)} y1="196" x2={X(q)} y2="202" stroke={COL.txt}/><text x={X(q)} y="220" fontSize="16" textAnchor="middle" fill={COL.txt}>{q}</text></g>)}
      {gradU.map(u => <g key={u}><line x1="56" y1={Y(u)} x2="62" y2={Y(u)} stroke={COL.txt}/><text x="52" y={Y(u) + 6} fontSize="16" textAnchor="end" fill={COL.txt}>{nbf(u, 1)}</text></g>)}
      <text x="70" y="22" fontSize="16" fill={COL.txt}>tension à vide (V)</text>
      <text x="384" y="244" fontSize="16" textAnchor="end" fill={COL.txt}>charge débitée Q (C)</text>
      <path d={d} fill="none" stroke={COL.orange} strokeWidth="3"/>
      <circle cx={X(Q)} cy={Y(U)} r="7" fill={COL.bleu} stroke="white" strokeWidth="2"/>
    </svg>);
}

// ====================================================
//  Cartes « À retenir » (viewBox 400 de large, police ≥ 15)
// ====================================================
const stc = { ...stl, maxWidth: 420 };
const T = ({ x, y, s = 16, c = COL.txt, a = 'middle', w = 400, children }) => <text x={x} y={y} fontSize={s} fill={c} textAnchor={a} fontWeight={w}>{children}</text>;
function MiniBecher({ x, sol = '#0ea5e9', op = 0.5, w = 90 }) {
  return <g><rect x={x} y={128} width={w} height={62} fill={sol} opacity={op}/><path d={`M${x} 100 V190 H${x + w} V100`} fill="none" stroke={COL.txt} strokeWidth="2.5"/></g>;
}

// carte 1 : même réaction, deux chemins pour les électrons
export function SvgTransfertCarte() {
  return (
    <svg viewBox="0 0 400 250" style={stc} role="img" aria-label="À gauche, contact direct : le zinc donne ses électrons aux ions cuivre dans le bécher, l’énergie part en chaleur. À droite, pile : les électrons passent par un fil et font fonctionner une lampe.">
      <T x={100} y={22} s={17} w={700}>contact direct</T><T x={300} y={22} s={17} w={700}>pile</T>
      <line x1="200" y1="8" x2="200" y2="242" stroke="#cbd5e1" strokeWidth="2"/>
      <MiniBecher x={55}/><rect x={92} y={70} width="14" height="112" fill={METAUX.zn.metal} stroke={COL.txt}/>
      <T x={128} y={160} s={16} c={COL.e} w={700}>e⁻</T><T x={100} y={60} s={16}>Zn dans Cu²⁺</T>
      <T x={100} y={218} s={16} c={COL.rouge} w={700}>énergie perdue</T><T x={100} y={238} s={16} c={COL.rouge}>en chaleur</T>
      <MiniBecher x={212} w={70} sol="#cbd5e1"/><MiniBecher x={318} w={70}/>
      <rect x={228} y={74} width="12" height="108" fill={METAUX.zn.metal} stroke={COL.txt}/><rect x={362} y={74} width="12" height="108" fill={METAUX.cu.metal} stroke={COL.txt}/>
      <path d="M234 74 V44 H368 V74" fill="none" stroke={COL.txt} strokeWidth="2.5"/>
      <circle cx="301" cy="44" r="13" fill="#fef08a" stroke={COL.txt} strokeWidth="2"/><T x={301} y={50} s={16}>✕</T>
      <Fleche x1={248} x2={282} y={62} c={COL.e}/><T x={262} y={92} s={16} c={COL.e} w={700}>e⁻</T>
      <T x={300} y={218} s={16} c={COL.vert} w={700}>électrons dans le fil</T><T x={300} y={238} s={16} c={COL.vert}>énergie électrique utile</T>
    </svg>);
}
// carte 2 : rôle du pont salin
export function SvgPontCarte() {
  return (
    <svg viewBox="0 0 400 250" style={stc} role="img" aria-label="Pile avec pont salin : les électrons circulent dans les fils, les ions circulent dans les solutions et dans le pont salin, qui ferme le circuit.">
      <path d="M60 80 V40 H340 V80" fill="none" stroke={COL.txt} strokeWidth="2.5"/><Fleche x1={110} x2={160} y={40} c={COL.e} w={4}/>
      <T x={200} y={30} s={16} c={COL.e} w={700}>électrons : dans les fils</T>
      <path d="M140 200 V108 H260 V200" fill="none" stroke={COL.txt} strokeWidth="20"/><path d="M140 200 V108 H260 V200" fill="none" stroke={COL.gel} strokeWidth="15"/>
      <T x={200} y={86} s={16} c={COL.orange} w={700}>pont salin : ions K⁺ et NO₃⁻</T>
      <rect x="30" y="140" width="130" height="66" fill="#bae6fd" opacity="0.6"/><path d="M30 110 V206 H160 V110" fill="none" stroke={COL.txt} strokeWidth="2.5"/>
      <rect x="240" y="140" width="130" height="66" fill="#bae6fd" opacity="0.6"/><path d="M240 110 V206 H370 V110" fill="none" stroke={COL.txt} strokeWidth="2.5"/>
      <rect x="54" y="72" width="12" height="124" fill={METAUX.zn.metal} stroke={COL.txt}/><rect x="334" y="72" width="12" height="124" fill={METAUX.cu.metal} stroke={COL.txt}/>
      <T x={200} y={232} s={16} c={COL.bleu} w={700}>ions : dans les solutions et le pont</T>
    </svg>);
}
// carte 3 : polarité et tension à vide
export function SvgPolariteCarte() {
  const volt = (x, txt, gauche, droite) => <g>
    <rect x={x} y="40" width="150" height="58" rx="8" fill="#1f2937"/><rect x={x + 12} y="48" width="126" height="30" rx="4" fill="#d9f99d"/>
    <T x={x + 75} y={70} s={20} w={700}>{txt}</T>
    <T x={x + 34} y={94} s={16} c={gauche === 'V' ? '#fca5a5' : 'white'} w={700}>{gauche}</T><T x={x + 116} y={94} s={16} c={droite === 'V' ? '#fca5a5' : 'white'} w={700}>{droite}</T>
  </g>;
  return (
    <svg viewBox="0 0 400 250" style={stc} role="img" aria-label="Voltmètre branché borne V sur le cuivre et COM sur le zinc : il affiche plus 1,10 volt, donc le cuivre est le pôle plus. Branchement inversé : moins 1,10 volt.">
      {volt(18, '+ 1,10 V', 'COM', 'V')}{volt(232, '− 1,10 V', 'V', 'COM')}
      <T x={52} y={124} s={16}>Zn</T><T x={134} y={124} s={16}>Cu</T><T x={266} y={124} s={16}>Zn</T><T x={348} y={124} s={16}>Cu</T>
      <line x1="200" y1="30" x2="200" y2="140" stroke="#cbd5e1" strokeWidth="2"/>
      <T x={200} y={22} s={16} w={700}>borne V sur le pôle + ⇒ U &gt; 0</T>
      <T x={200} y={170} s={16}>valeur positive : la borne V est sur le pôle +</T>
      <T x={120} y={196} s={17} c={COL.rouge} w={700}>Cu : pôle +</T><T x={280} y={196} s={17} c={COL.txt} w={700}>Zn : pôle −</T>
      <T x={200} y={228} s={16} c={COL.gris}>tension à vide : la pile ne débite pas (I = 0)</T>
    </svg>);
}
// carte 4 : fonctionnement (réactions aux électrodes, électrons)
export function SvgFonctionCarte() {
  return (
    <svg viewBox="0 0 400 262" style={stc} role="img" aria-label="Pile en fonctionnement : au pôle moins, le zinc est oxydé, Zn donne Zn2+ et 2 électrons, c’est l’anode. Au pôle plus, les ions cuivre sont réduits, c’est la cathode. Les électrons vont du pôle moins vers le pôle plus dans le fil ; le courant va en sens inverse.">
      <path d="M70 92 V48 H330 V92" fill="none" stroke={COL.txt} strokeWidth="2.5"/>
      <Fleche x1={120} x2={180} y={48} c={COL.e} w={4}/><T x={150} y={36} s={16} c={COL.e} w={700}>e⁻</T>
      <Fleche x1={280} x2={220} y={70} c={COL.orange} w={3}/><T x={250} y={92} s={16} c={COL.orange} w={700}>I</T>
      <Signe x={40} y={48} plus={false}/><Signe x={360} y={48} plus/>
      <rect x="62" y="92" width="16" height="70" fill={METAUX.zn.metal} stroke={COL.txt}/><rect x="322" y="92" width="16" height="70" fill={METAUX.cu.metal} stroke={COL.txt}/>
      <T x={70} y={186} s={16} w={700}>Zn → Zn²⁺ + 2 e⁻</T><T x={330} y={186} s={16} w={700}>Cu²⁺ + 2 e⁻ → Cu</T>
      <T x={70} y={210} s={16} c={COL.bleu}>oxydation</T><T x={330} y={210} s={16} c={COL.bleu}>réduction</T>
      <T x={70} y={232} s={16} c={COL.gris}>anode</T><T x={330} y={232} s={16} c={COL.gris}>cathode</T>
      <T x={200} y={256} s={16} c={COL.orange}>Anode-Oxydation : deux voyelles</T>
    </svg>);
}
// carte 5 : capacité électrique
export function SvgCapaciteCarte() {
  const boite = (y, txt, c = COL.txt, f = '#f8fafc') => <g><rect x="50" y={y} width="300" height="36" rx="8" fill={f} stroke={c} strokeWidth="2"/><T x={200} y={y + 24} s={16} c={c} w={700}>{txt}</T></g>;
  const fl = y => <polygon points={`200,${y + 12} 192,${y} 208,${y}`} fill={COL.gris}/>;
  return (
    <svg viewBox="0 0 400 256" style={stc} role="img" aria-label="Chaîne de calcul de la capacité : réactif limitant, avancement maximal 1,0 fois 10 puissance moins 2 mole, quantité d’électrons égale à 2 fois l’avancement maximal, capacité Q égale à n(e−) fois F, soit 1,9 fois 10 puissance 3 coulombs.">
      {boite(6, 'réactif limitant : Cu²⁺ (1,0 × 10⁻² mol)')}{fl(46)}
      {boite(62, 'xmax = 1,0 × 10⁻² mol')}{fl(102)}
      {boite(118, 'Cu²⁺ + 2 e⁻ → Cu : n(e⁻) = 2 xmax', COL.e)}{fl(158)}
      {boite(174, 'Q = n(e⁻) × F = 1,9 × 10³ C', COL.orange, '#fff7ed')}
      <T x={200} y={240} s={16} c={COL.gris}>F = 9,65 × 10⁴ C/mol : charge d’une mole d’électrons</T>
    </svg>);
}
// carte 6 : usure
export function SvgUsureCarte() {
  const X = q => 60 + 300 * q, Y = u => 170 - 120 * u;
  const pts = [[0, 1.1], [0.3, 1.09], [0.6, 1.08], [0.85, 1.06], [0.95, 1.03], [0.99, 0.98], [0.997, 0.8], [1, 0]];
  return (
    <svg viewBox="0 0 400 250" style={stc} role="img" aria-label="Tension à vide d’une pile en fonction de la charge débitée : presque constante, puis chute à zéro quand le réactif limitant est épuisé ; alors le quotient de réaction a atteint K et la pile est usée.">
      <line x1="60" y1="170" x2="390" y2="170" stroke={COL.txt} strokeWidth="2"/><line x1="60" y1="170" x2="60" y2="30" stroke={COL.txt} strokeWidth="2"/>
      <T x={64} y={22} s={16} a="start">tension à vide U</T><T x={390} y={194} s={16} a="end">charge débitée Q</T>
      <path d={pts.map(([q, u], i) => `${i ? 'L' : 'M'}${X(q)} ${Y(u)}`).join(' ')} fill="none" stroke={COL.orange} strokeWidth="3.5"/>
      <T x={180} y={74} s={16} c={COL.vert} w={700}>Qr &lt; K : la pile débite</T>
      <line x1={X(1)} y1="170" x2={X(1)} y2="40" stroke={COL.rouge} strokeDasharray="5 4"/>
      <T x={350} y={150} s={16} c={COL.rouge} w={700} a="end">Qr = K</T>
      <T x={200} y={218} s={16} c={COL.rouge} w={700}>réactif limitant épuisé : pile usée</T>
      <T x={200} y={242} s={16} c={COL.gris}>(équilibre atteint, plus de transformation)</T>
    </svg>);
}
