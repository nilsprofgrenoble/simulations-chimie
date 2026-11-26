// Équation-bilan et mécanisme (flèches courbes) du mécanisme examiné dans « Substitution ou élimination ? ».
import { KIT } from "../commun";

const RBR = { prim: x => `CH₃CH₂CH₂CH₂${x}`, sec: x => `CH₃CH(${x})CH₂CH₃`, tert: x => `(CH₃)₃C${x}` };
const ALCENE = { prim: 'CH₃CH₂CH=CH₂', sec: 'CH₃CH=CH–CH₃', tert: '(CH₃)₂C=CH₂' };
const NUC = { HO: { nu: 'HO⁻', x: 'OH', conj: 'H₂O' }, tBuO: { nu: 'tBuO⁻', x: 'OC(CH₃)₃', conj: 'tBuOH' }, H2O: { nu: 'H₂O', x: 'OH', conj: 'H₃O⁺' } };

// Équation-bilan écrite avec les formules semi-développées, pour le substrat, le réactif et le mécanisme examinés
function equation(meca, sub, re) {
  const N = NUC[re], R = RBR[sub]('Br');
  if (meca === 'SN1' || meca === 'SN2') {
    return re === 'H2O' ? `${R} + H₂O → ${RBR[sub]('OH')} + H⁺ + Br⁻` : `${R} + ${N.nu} → ${RBR[sub](N.x)} + Br⁻`;
  }
  return re === 'H2O' ? `${R} + H₂O → ${ALCENE[sub]} + H₃O⁺ + Br⁻` : `${R} + ${N.nu} → ${ALCENE[sub]} + ${N.conj} + Br⁻`;
}

const ENC = '#0f172a', ARC = '#dc2626', BRUN = '#9a3412', GR = '#475569';
function Fleche({ d }) { return <path d={d} fill="none" stroke={ARC} strokeWidth={2.2} markerEnd="url(#pointe)" />; }
function Schema({ titre, aria, children }) {
  return (
    <div style={{ marginTop: 6 }}>
      {titre && <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>{titre}</div>}
      <svg viewBox="0 0 560 104" role="img" aria-label={aria} style={{ width: '100%', maxWidth: 620, display: 'block' }}>
        <defs><marker id="pointe" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={ARC} /></marker></defs>
        {children}
      </svg>
    </div>);
}
const T = ({ x, y = 57, children, c = ENC, a = 'middle', s = 17 }) => <text x={x} y={y} fontSize={s} fontWeight="700" fill={c} textAnchor={a}>{children}</text>;
const Trait = ({ x1, y1, x2, y2, c = ENC, w = 2.2, dash }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash} />;
// Carbone et ses trois substituants R¹ (haut), R² (bas gauche), R³ (bas droit) ; l'axe horizontal reste libre pour Nu et Br
function CR({ x, y = 52, ch = '', r = ['R¹', 'R²', 'R³'] }) {
  return (<g>
    <Trait x1={x} y1={y - 11} x2={x} y2={y - 30} /><T x={x} y={y - 35} s={13} c={GR}>{r[0]}</T>
    <Trait x1={x - 6} y1={y + 9} x2={x - 21} y2={y + 30} /><T x={x - 25} y={y + 44} s={13} c={GR}>{r[1]}</T>
    <Trait x1={x + 6} y1={y + 9} x2={x + 21} y2={y + 30} /><T x={x + 25} y={y + 44} s={13} c={GR}>{r[2]}</T>
    <T x={x} y={y + 6}>{`C${ch}`}</T>
  </g>);
}
// Alcène (ou fragment H–C–C) avec deux substituants R de chaque côté
function CC({ x, double = false, cation = false }) {
  return (<g>
    <T x={x} y={57}>C</T>
    <Trait x1={x - 4} y1={44} x2={x - 18} y2={20} /><T x={x - 22} y={15} s={13} c={GR}>R</T>
    <Trait x1={x - 4} y1={70} x2={x - 18} y2={92} /><T x={x - 22} y={104} s={13} c={GR}>R</T>
    <T x={x + 62} y={57}>{cation ? 'C⁺' : 'C'}</T>
    <Trait x1={x + 12} y1={54} x2={x + 48} y2={54} />{double && <Trait x1={x + 12} y1={62} x2={x + 48} y2={62} />}
    <Trait x1={x + 66} y1={44} x2={x + 80} y2={20} /><T x={x + 85} y={15} s={13} c={GR}>R</T>
    <Trait x1={x + 66} y1={70} x2={x + 80} y2={92} /><T x={x + 85} y={104} s={13} c={GR}>R</T>
  </g>);
}
const nuProd = N => (N === 'H₂O' ? 'H₂O⁺' : N.replace('⁻', ''));

export default function SnEquation({ meca, sub, re }) {
  const N = NUC[re].nu;
  const eq = equation(meca, sub, re);
  const sn = meca.startsWith('S');
  const baseH = NUC[re].conj;
  let schemas;
  if (meca === 'SN2') schemas = (
    <Schema aria="Mécanisme SN2, en une étape : le nucléophile attaque le carbone par l'arrière, Br part avec le doublet de la liaison C–Br">
      <T x={42} c="#1d4ed8">{N}</T><CR x={165} /><Trait x1={176} y1={52} x2={228} y2={52} /><T x={248} c={BRUN}>Br</T>
      <Fleche d="M64,38 Q112,2 154,40" /><Fleche d="M204,44 Q222,16 244,38" />
      <T x={308} s={22}>→</T>
      <T x={365} c="#1d4ed8">{nuProd(N)}</T><Trait x1={385} y1={52} x2={400} y2={52} /><CR x={412} /><T x={490} s={15}>+ Br⁻</T>
    </Schema>);
  else if (meca === 'E2') schemas = (
    <Schema aria="Mécanisme E2, en une étape : la base arrache H, la liaison C–H devient C=C et Br part">
      <T x={30} c="#1d4ed8">{N}</T><T x={98}>H</T><Trait x1={110} y1={54} x2={132} y2={54} /><CC x={146} /><Trait x1={216} y1={54} x2={246} y2={54} /><T x={266} c={BRUN}>Br</T>
      <Fleche d="M48,38 Q72,6 94,38" /><Fleche d="M120,42 Q150,10 176,42" /><Fleche d="M236,44 Q252,18 264,38" />
      <T x={318} s={22}>→</T><CC x={360} double /><T x={496} s={15}>+ {baseH} + Br⁻</T>
    </Schema>);
  else if (meca === 'SN1') schemas = (<>
    <Schema titre="Étape 1, lente : Br part avec le doublet de la liaison, il se forme un carbocation" aria="Étape 1 de la SN1 : la liaison C–Br se rompt">
      <CR x={110} /><Trait x1={121} y1={52} x2={168} y2={52} /><T x={188} c={BRUN}>Br</T>
      <Fleche d="M146,44 Q164,16 186,38" /><T x={256} s={22}>→</T>
      <CR x={330} ch="⁺" /><T x={412} s={15}>+ Br⁻</T>
    </Schema>
    <Schema titre="Étape 2, rapide : le nucléophile se lie au carbocation, plan : il peut arriver par les deux faces" aria="Étape 2 de la SN1 : le nucléophile attaque le carbone du carbocation">
      <T x={42} c="#1d4ed8">{N}</T><CR x={165} ch="⁺" />
      <Fleche d="M64,38 Q108,2 152,40" /><T x={270} s={22}>→</T>
      <T x={335} c="#1d4ed8">{nuProd(N)}</T><Trait x1={355} y1={52} x2={370} y2={52} /><CR x={382} />
    </Schema></>);
  else schemas = (<>
    <Schema titre="Étape 1, lente : Br part avec le doublet de la liaison, il se forme un carbocation" aria="Étape 1 de l'E1 : formation du carbocation">
      <T x={30}>H</T><Trait x1={42} y1={54} x2={64} y2={54} /><CC x={78} /><Trait x1={148} y1={54} x2={178} y2={54} /><T x={198} c={BRUN}>Br</T>
      <Fleche d="M168,44 Q184,18 196,38" /><T x={262} s={22}>→</T><T x={310}>H</T><Trait x1={322} y1={54} x2={338} y2={54} /><CC x={352} cation /><T x={500} s={15}>+ Br⁻</T>
    </Schema>
    <Schema titre="Étape 2, rapide : une base (ici le solvant) arrache H en β du carbocation" aria="Étape 2 de l'E1 : la base arrache H, la liaison C–H devient C=C">
      <T x={30} c="#1d4ed8">{N}</T><T x={98}>H</T><Trait x1={110} y1={54} x2={132} y2={54} /><CC x={146} cation />
      <Fleche d="M48,38 Q72,6 94,38" /><Fleche d="M120,42 Q150,10 176,42" /><T x={290} s={22}>→</T><CC x={340} double /><T x={470} s={15}>+ {baseH}</T>
    </Schema></>);
  return (
    <div style={{ background: '#f8fafc', border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: '8px 10px' }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Équation de la réaction ({sn ? 'substitution' : 'élimination'}, {meca})</div>
      <div style={{ fontSize: 15.5, fontWeight: 700, color: KIT.txt, margin: '4px 0', lineHeight: 1.5 }}>{eq}</div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginTop: 6 }}>Mécanisme (flèches rouges : déplacements de doublets d’électrons)</div>
      {schemas}
    </div>);
}
