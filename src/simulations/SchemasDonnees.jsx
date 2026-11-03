import { useId } from "react";
import { KIT } from "../commun";

// Schémas des énoncés de l'atelier « Extraire les données » : ils montrent la situation et les données de l'énoncé (jamais la réponse).
const TR = '#334155', BLEU = '#2563eb', GRIS = '#94a3b8', ORANGE = '#c2410c', VERT = '#15803d', EAU = '#bfdbfe';
const boite = { background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: 6 };
const svgStyle = { width: '100%', maxWidth: 460, height: 'auto', display: 'block', margin: '0 auto' };
const Pointe = ({ id, c }) => <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={c}/></marker>;
const Fl = ({ x1, y1, x2, y2, c = TR, id, w = 2.4 }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} markerEnd={`url(#${id})`}/>;
const Tx = ({ x, y, t, c = '#475569', a = 'middle', g, s = 12.5 }) => <text x={x} y={y} fontSize={s} fontWeight={g ? 700 : 400} fill={c} textAnchor={a}>{t}</text>;

// Régulation proportionnelle du niveau d'un réservoir
function Regul({ Qmax, Qp, hc, Kp }) {
  const u = useId().replace(/:/g, '');
  return (
    <div style={boite} data-schema="regul-niveau">
      <svg viewBox="0 0 360 260" style={svgStyle} role="img" aria-label="Réservoir rempli par une pompe, vidé par un soutirage, avec un capteur de niveau relié à un régulateur proportionnel qui commande la pompe">
        <defs><Pointe id={`${u}b`} c={BLEU}/><Pointe id={`${u}o`} c={ORANGE}/><Pointe id={`${u}g`} c={GRIS}/></defs>
        <path d="M170,60 L170,190 L270,190 L270,60" fill="none" stroke={TR} strokeWidth="3"/>
        <rect x="172" y="125" width="96" height="63" fill={EAU}/>
        <line x1="170" y1="95" x2="270" y2="95" stroke={ORANGE} strokeWidth="2" strokeDasharray="6 4"/><Tx x="276" y="99" t={`consigne ${hc}`} c={ORANGE} a="start" g/>
        <Tx x="220" y="160" t="niveau H ?" c={BLEU} g/>
        <circle cx="50" cy="105" r="24" fill="white" stroke={TR} strokeWidth="2.4"/><Tx x="50" y="109" t="pompe" g c={TR}/>
        <polyline points="74,105 120,105 120,40 220,40 220,80" fill="none" stroke={BLEU} strokeWidth="2.8" markerEnd={`url(#${u}b)`}/>
        <Tx x="170" y="28" t={`débit max. de la pompe : ${Qmax}`} c={BLEU} g/>
        <line x1="270" y1="175" x2="340" y2="175" stroke={BLEU} strokeWidth="2.8" markerEnd={`url(#${u}b)`}/><Tx x="306" y="160" t="soutirage" c={BLEU} g/><Tx x="306" y="194" t={Qp} c={BLEU} g/>
        <line x1="220" y1="190" x2="220" y2="212" stroke={GRIS} strokeWidth="1.8" strokeDasharray="4 3"/><Tx x="228" y="206" t="capteur de niveau" a="start" s={11.5}/>
        <rect x="100" y="214" width="240" height="34" rx="6" fill="#f1f5f9" stroke={TR} strokeWidth="2"/><Tx x="220" y="236" t={`régulateur P : K p = ${Kp}`} g c={TR}/>
        <polyline points="100,231 50,231 50,131" fill="none" stroke={ORANGE} strokeWidth="2.4" markerEnd={`url(#${u}o)`}/><Tx x="58" y="190" t="commande Y" c={ORANGE} g a="start"/>
      </svg>
    </div>);
}

// Cuve d'huile ouverte, capteur de pression au fond, trappe de vidange (facultative)
function CuveHuile({ P, rho, d }) {
  const u = useId().replace(/:/g, '');
  return (
    <div style={boite} data-schema="cuve-huile">
      <svg viewBox="0 0 360 222" style={svgStyle} role="img" aria-label="Cuve cylindrique ouverte contenant de l’huile, avec un capteur de pression relative au fond">
        <defs><Pointe id={`${u}t`} c={TR}/><Pointe id={`${u}v`} c={VERT}/></defs>
        <path d="M110,30 L110,180 L250,180 L250,30" fill="none" stroke={TR} strokeWidth="3"/>
        <rect x="112" y="80" width="136" height="98" fill="#fde68a"/><line x1="112" y1="80" x2="248" y2="80" stroke="#b45309" strokeWidth="2"/>
        <Tx x="180" y="125" t={`huile  ρ = ${rho}`} c="#92400e" g/>
        <Fl x1={310} y1={80} x2={310} y2={178} c={VERT} id={`${u}v`}/><Fl x1={310} y1={178} x2={310} y2={80} c={VERT} id={`${u}v`}/><Tx x="304" y="132" t="h ?" c={VERT} a="end" g/>
        <circle cx="180" cy="172" r="9" fill="white" stroke={TR} strokeWidth="2.2"/><Tx x="180" y="176" t="P" g s={11} c={TR}/>
        <Tx x="180" y="199" t={`capteur : P relative = ${P}`} g c={TR}/>
        {d && <g><line x1="215" y1="181" x2="245" y2="181" stroke={ORANGE} strokeWidth="5"/><Tx x="250" y="216" t={`trappe de vidange : d = ${d}`} c={ORANGE} a="end" g/></g>}
        <Tx x="180" y="22" t="cuve ouverte à l’air libre (P atm)" a="middle"/><Fl x1={180} y1={28} x2={180} y2={64} c={GRIS} id={`${u}t`} w={1.6}/>
      </svg>
    </div>);
}

// Bassin → pompe → château d'eau
function PompeChateau({ dz, L, dp, Q }) {
  const u = useId().replace(/:/g, '');
  return (
    <div style={boite} data-schema="pompe-chateau">
      <svg viewBox="0 0 360 250" style={svgStyle} role="img" aria-label="Une pompe aspire l’eau d’un bassin et la refoule dans un château d’eau situé plus haut">
        <defs><Pointe id={`${u}b`} c={BLEU}/><Pointe id={`${u}v`} c={VERT}/></defs>
        <rect x="10" y="150" width="90" height="60" fill={EAU} stroke={TR} strokeWidth="2.4"/><Tx x="55" y="185" t="bassin" g c={TR}/>
        <path d="M250,30 L250,80 L330,80 L330,30" fill="none" stroke={TR} strokeWidth="3"/><rect x="252" y="46" width="76" height="32" fill={EAU}/><Tx x="290" y="67" t="château" g s={11.5} c={TR}/>
        <line x1="288" y1="82" x2="288" y2="120" stroke={TR} strokeWidth="3"/>
        <polyline points="100,190 150,190" fill="none" stroke={BLEU} strokeWidth="3"/><circle cx="170" cy="190" r="20" fill="white" stroke={TR} strokeWidth="2.4"/><Tx x="170" y="195" t="pompe" g s={11.5} c={TR}/>
        <polyline points="190,190 288,190 288,120" fill="none" stroke={BLEU} strokeWidth="3"/>
        <line x1="10" y1="150" x2="345" y2="150" stroke={GRIS} strokeWidth="1.2" strokeDasharray="4 4"/><line x1="240" y1="46" x2="345" y2="46" stroke={GRIS} strokeWidth="1.2" strokeDasharray="4 4"/>
        <Fl x1={346} y1={150} x2={346} y2={48} c={VERT} id={`${u}v`}/><Fl x1={346} y1={48} x2={346} y2={150} c={VERT} id={`${u}v`}/><Tx x="272" y="112" t={`Δz = ${dz}`} c={VERT} a="end" g/>
        <Tx x="200" y="226" t={`conduite : L = ${L}, perte de charge ${dp}`} a="middle" c={TR} g s={11.5}/><Tx x="200" y="241" t={`débit de l’eau : ${Q}`} a="middle" c={BLEU} g s={11.5}/>
        
        <Tx x="55" y="140" t="P atm" s={11}/><Tx x="215" y="34" t="P atm" s={11}/>
      </svg>
    </div>);
}

// Évaporateur en continu : bilan de matière
function Evaporateur({ q1, w1, w2, Pv }) {
  const u = useId().replace(/:/g, '');
  return (
    <div style={boite} data-schema="evaporateur">
      <svg viewBox="0 0 360 224" style={svgStyle} role="img" aria-label="Évaporateur : un jus sucré entre, de la vapeur d’eau pure et un sirop concentré en sortent">
        <defs><Pointe id={`${u}b`} c={BLEU}/><Pointe id={`${u}o`} c={ORANGE}/><Pointe id={`${u}v`} c={VERT}/></defs>
        <rect x="130" y="60" width="110" height="110" rx="14" fill="#fef3c7" stroke={TR} strokeWidth="3"/><Tx x="185" y="120" t="évaporateur" g c={TR}/>
        <Fl x1={20} y1={115} x2={128} y2={115} c={BLEU} id={`${u}b`} w={2.8}/><Tx x="74" y="92" t="jus sucré" g c={BLEU}/><Tx x="74" y="108" t={q1} c={BLEU} g/><Tx x="74" y="138" t={`${w1} de saccharose`} s={11.5}/>
        <Fl x1={185} y1={58} x2={185} y2={14} c={GRIS} id={`${u}b`} w={2.6}/><Tx x="196" y="30" t="vapeur d’eau pure" a="start" c={TR} g/>
        <Fl x1={240} y1={150} x2={340} y2={150} c={ORANGE} id={`${u}o`} w={2.8}/><Tx x="290" y="136" t="sirop" c={ORANGE} g/><Tx x="300" y="172" t={`${w2} de saccharose`} s={11.5}/>
        <Fl x1={185} y1={216} x2={185} y2={172} c={VERT} id={`${u}v`} w={2.6}/><Tx x="196" y="196" t="chauffage" a="start" c={VERT} g s={11.5}/><Tx x="196" y="211" t={`vapeur sous ${Pv}`} a="start" c={VERT} g s={11.5}/>
        <Tx x="40" y="30" t="régime permanent" a="start" s={11.5}/>
      </svg>
    </div>);
}

// Boussole près d'un aimant (vue de dessus)
function Boussole({ r1, Ba, BT }) {
  const u = useId().replace(/:/g, '');
  return (
    <div style={boite} data-schema="boussole-aimant">
      <svg viewBox="0 0 360 210" style={svgStyle} role="img" aria-label="Vue de dessus : un aimant dont l’axe est perpendiculaire au nord, et une boussole placée sur cet axe">
        <defs><Pointe id={`${u}b`} c={BLEU}/><Pointe id={`${u}o`} c={ORANGE}/></defs>
        <rect x="20" y="95" width="60" height="24" fill="#fecaca" stroke={TR} strokeWidth="2.2"/><rect x="80" y="95" width="60" height="24" fill="#bfdbfe" stroke={TR} strokeWidth="2.2"/>
        <Tx x="50" y="112" t="N" g c={TR}/><Tx x="110" y="112" t="S" g c={TR}/><Tx x="80" y="136" t="aimant" g/>
        <line x1="140" y1="107" x2="310" y2="107" stroke={GRIS} strokeWidth="1.4" strokeDasharray="5 4"/>
        <circle cx="260" cy="107" r="22" fill="white" stroke={TR} strokeWidth="2.4"/><Tx x="260" y="146" t="boussole" g s={11.5} c={TR}/>
        <line x1="140" y1="170" x2="260" y2="170" stroke={TR} strokeWidth="1.4"/><Tx x="200" y="186" t={`r₁ = ${r1}`} g c={TR}/>
        <Fl x1={260} y1={104} x2={260} y2={30} c={BLEU} id={`${u}b`} w={2.8}/><Tx x="270" y="50" t="B Terre" a="start" c={BLEU} g s={11.5}/><Tx x="270" y="65" t={`= ${BT}`} a="start" c={BLEU} g s={11.5}/>
        <Fl x1={236} y1={107} x2={170} y2={107} c={ORANGE} id={`${u}o`} w={2.8}/><Tx x="203" y="80" t="B aimant" c={ORANGE} g s={11.5}/><Tx x="203" y="95" t={`= ${Ba}`} c={ORANGE} g s={11.5}/>
        <Tx x="40" y="30" t="nord" g c={TR}/><Fl x1={40} y1={70} x2={40} y2={38} c={TR} id={`${u}b`} w={2}/>
      </svg>
    </div>);
}

export const DESSINS_DONNEES = { regul: Regul, cuveHuile: CuveHuile, pompeChateau: PompeChateau, evaporateur: Evaporateur, boussole: Boussole };
