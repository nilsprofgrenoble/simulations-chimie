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

const ENC = '#0f172a', ARC = '#dc2626';
function Fleche({ d }) { return <path d={d} fill="none" stroke={ARC} strokeWidth={2} markerEnd="url(#pointe)" />; }
function Schema({ titre, aria, children, large = 440 }) {
  return (
    <div style={{ marginTop: 6 }}>
      {titre && <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>{titre}</div>}
      <svg viewBox={`0 0 ${large} 84`} role="img" aria-label={aria} style={{ width: '100%', maxWidth: 520, display: 'block' }}>
        <defs><marker id="pointe" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={ARC} /></marker></defs>
        {children}
      </svg>
    </div>);
}
const T = ({ x, y, children, c = ENC, a = 'middle', s = 16 }) => <text x={x} y={y} fontSize={s} fontWeight="700" fill={c} textAnchor={a}>{children}</text>;

export default function SnEquation({ meca, sub, re }) {
  const N = NUC[re].nu;
  const eq = equation(meca, sub, re);
  const sn = meca.startsWith('S');
  let schemas;
  if (meca === 'SN2') schemas = (
    <Schema aria="Mécanisme SN2 : le nucléophile attaque le carbone par l'arrière tandis que Br part avec le doublet de la liaison C–Br">
      <T x={34} y={58}>{N}</T><T x={170} y={58}>C</T><T x={205} y={58}>–</T><T x={235} y={58} c="#9a3412">Br</T>
      <T x={170} y={80} s={12} c={KIT.txt2}>R¹R²R³</T>
      <Fleche d="M52,42 Q110,2 160,42" /><Fleche d="M205,42 Q222,18 233,40" />
      <T x={290} y={58}>→</T><T x={355} y={58}>{`${N === 'H₂O' ? 'H₂O⁺' : N.replace('⁻', '')}–C`}</T><T x={415} y={58} s={14}>+ Br⁻</T>
    </Schema>);
  else if (meca === 'E2') schemas = (
    <Schema aria="Mécanisme E2 : une base arrache H en β, la liaison C–H devient C=C et Br part, le tout en une étape">
      <T x={30} y={58}>{N}</T><T x={100} y={58}>H</T><T x={125} y={58}>–</T><T x={147} y={58}>C</T><T x={172} y={58}>–</T><T x={196} y={58}>C</T><T x={221} y={58}>–</T><T x={249} y={58} c="#9a3412">Br</T>
      <Fleche d="M48,42 Q70,10 96,40" /><Fleche d="M128,42 Q172,6 190,40" /><Fleche d="M221,42 Q235,18 247,40" />
      <T x={300} y={58}>→</T><T x={365} y={58} s={14}>C=C + {N === 'H₂O' ? 'H₃O⁺' : `${N.replace('⁻', '')}H`}</T><T x={425} y={58} s={14}>+ Br⁻</T>
    </Schema>);
  else if (meca === 'SN1') schemas = (<>
    <Schema titre="Étape 1, lente : départ de Br⁻, formation du carbocation" aria="Étape 1 de la SN1 : la liaison C–Br se rompt, Br part avec le doublet">
      <T x={120} y={58}>C</T><T x={152} y={58}>–</T><T x={182} y={58} c="#9a3412">Br</T><T x={225} y={58}>→</T><T x={265} y={58}>C⁺</T><T x={310} y={58} s={14}>+ Br⁻</T>
      <Fleche d="M152,42 Q168,18 180,40" />
    </Schema>
    <Schema titre="Étape 2, rapide : le nucléophile se lie au carbocation (plan, attaqué par les deux faces)" aria="Étape 2 de la SN1 : le nucléophile attaque le carbone du carbocation">
      <T x={50} y={58}>{N}</T><T x={150} y={58}>C⁺</T><T x={210} y={58}>→</T><T x={290} y={58}>{`${N === 'H₂O' ? 'H₂O⁺' : N.replace('⁻', '')}–C`}</T>
      <Fleche d="M68,42 Q108,6 140,40" />
    </Schema></>);
  else schemas = (<>
    <Schema titre="Étape 1, lente : départ de Br⁻, formation du carbocation" aria="Étape 1 de l'E1 : formation du carbocation">
      <T x={110} y={58}>H</T><T x={135} y={58}>–</T><T x={158} y={58}>C</T><T x={182} y={58}>–</T><T x={206} y={58}>C</T><T x={231} y={58}>–</T><T x={259} y={58} c="#9a3412">Br</T>
      <Fleche d="M231,42 Q245,18 257,40" /><T x={310} y={58}>→</T><T x={365} y={58} s={14}>H–C–C⁺ + Br⁻</T>
    </Schema>
    <Schema titre="Étape 2, rapide : une base (ici le solvant) arrache H en β du carbocation" aria="Étape 2 de l'E1 : la base arrache H, la liaison C–H devient C=C">
      <T x={30} y={58}>{N}</T><T x={100} y={58}>H</T><T x={125} y={58}>–</T><T x={147} y={58}>C</T><T x={172} y={58}>–</T><T x={200} y={58}>C⁺</T>
      <Fleche d="M48,42 Q70,10 96,40" /><Fleche d="M128,42 Q165,6 190,40" /><T x={265} y={58}>→</T><T x={335} y={58} s={14}>C=C</T>
    </Schema></>);
  return (
    <div style={{ background: '#f8fafc', border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: '8px 10px' }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Équation de la réaction ({sn ? 'substitution' : 'élimination'}, {meca})</div>
      <div style={{ fontSize: 15.5, fontWeight: 700, color: KIT.txt, margin: '4px 0', lineHeight: 1.5 }}>{eq}</div>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginTop: 6 }}>Mécanisme (flèches rouges : déplacements de doublets d’électrons)</div>
      {schemas}
    </div>);
}
