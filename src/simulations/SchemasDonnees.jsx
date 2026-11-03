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
function CuveHuile({ P, rho, d, hInconnue = true }) {
  const u = useId().replace(/:/g, '');
  return (
    <div style={boite} data-schema="cuve-huile">
      <svg viewBox="0 0 360 222" style={svgStyle} role="img" aria-label="Cuve cylindrique ouverte contenant de l’huile, avec un capteur de pression relative au fond">
        <defs><Pointe id={`${u}t`} c={TR}/><Pointe id={`${u}v`} c={VERT}/></defs>
        <path d="M110,30 L110,180 L250,180 L250,30" fill="none" stroke={TR} strokeWidth="3"/>
        <rect x="112" y="80" width="136" height="98" fill="#fde68a"/><line x1="112" y1="80" x2="248" y2="80" stroke="#b45309" strokeWidth="2"/>
        <Tx x="180" y="125" t={`huile  ρ = ${rho}`} c="#92400e" g/>
        <Fl x1={310} y1={80} x2={310} y2={178} c={VERT} id={`${u}v`}/><Fl x1={310} y1={178} x2={310} y2={80} c={VERT} id={`${u}v`}/>{hInconnue && <Tx x="304" y="132" t="h ?" c={VERT} a="end" g/>}
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
        <line x1="80" y1="170" x2="260" y2="170" stroke={TR} strokeWidth="1.4"/><line x1="80" y1="164" x2="80" y2="176" stroke={TR}/><line x1="260" y1="164" x2="260" y2="176" stroke={TR}/><Tx x="170" y="186" t={`r₁ = ${r1} (depuis le centre de l’aimant)`} g c={TR}/><Tx x="330" y="20" t="schéma non à l’échelle" a="end" s={11}/>
        <Fl x1={260} y1={104} x2={260} y2={30} c={BLEU} id={`${u}b`} w={2.8}/><Tx x="270" y="50" t="B Terre" a="start" c={BLEU} g s={11.5}/><Tx x="270" y="65" t={`= ${BT}`} a="start" c={BLEU} g s={11.5}/>
        <Fl x1={236} y1={107} x2={170} y2={107} c={ORANGE} id={`${u}o`} w={2.8}/><Tx x="203" y="80" t="B aimant" c={ORANGE} g s={11.5}/><Tx x="203" y="95" t={`= ${Ba}`} c={ORANGE} g s={11.5}/>
        <Tx x="40" y="30" t="nord" g c={TR}/><Fl x1={40} y1={70} x2={40} y2={38} c={TR} id={`${u}b`} w={2}/>
      </svg>
    </div>);
}

// Conduite d'eau qui se rétrécit
function ConduiteConvergent({ D1, L, P1, v1, D2 }) {
  const u = useId().replace(/:/g, '');
  return (
    <div style={boite} data-schema="conduite-convergent">
      <svg viewBox="0 0 360 190" style={svgStyle} role="img" aria-label="Conduite d’eau qui se rétrécit : un convergent relie une conduite large à une conduite plus étroite">
        <defs><Pointe id={`${u}b`} c={BLEU}/></defs>
        <path d="M20,60 L170,60 L220,80 L340,80 L340,110 L220,110 L170,130 L20,130 Z" fill={EAU} stroke={TR} strokeWidth="3"/>
        <Fl x1={40} y1={95} x2={110} y2={95} c={BLEU} id={`${u}b`} w={2.8}/><Tx x="75" y="86" t={`v₁ = ${v1}`} c={BLEU} g/>
        <Fl x1={240} y1={95} x2={320} y2={95} c={BLEU} id={`${u}b`} w={2.8}/><Tx x="280" y="70" t="v₂ = ?" c={ORANGE} g/>
        <Tx x="95" y="40" t="conduite amont" s={11.5}/><Tx x="95" y="54" t={`diamètre ${D1}`} g c={TR}/><Tx x="95" y="148" t={`longueur ${L}`} c={TR}/><Tx x="95" y="166" t={`pression ${P1}`} c={TR}/>
        <Tx x="280" y="136" t={`diamètre ${D2}`} g c={TR}/><Tx x="195" y="182" t="convergent" s={11.5}/>
      </svg>
    </div>);
}

// Échangeur eau chaude – eau froide ; sens : 'co' (co-courant), 'contre' (contre-courant) ou null (non précisé : pas de flèche sur l'eau froide)
function Echangeur({ qc, Tce, Tcs, qf, Tfe, Tfs = '', sens = null }) {
  const u = useId().replace(/:/g, '');
  const co = sens === 'co', contre = sens === 'contre';
  return (
    <div style={boite} data-schema="echangeur">
      <svg viewBox="0 0 360 215" style={svgStyle} role="img" aria-label="Échangeur de chaleur : l’eau chaude cède de la chaleur à l’eau froide à travers une paroi">
        <defs><Pointe id={`${u}o`} c={ORANGE}/><Pointe id={`${u}b`} c={BLEU}/></defs>
        <rect x="100" y="50" width="160" height="100" rx="12" fill="#f8fafc" stroke={TR} strokeWidth="3"/><line x1="100" y1="100" x2="260" y2="100" stroke={TR} strokeWidth="2" strokeDasharray="6 4"/>
        <Tx x="180" y="94" t="paroi d’échange" s={11}/>
        <Fl x1={20} y1={75} x2={98} y2={75} c={ORANGE} id={`${u}o`} w={2.8}/><Tx x="58" y="44" t="eau chaude" c={ORANGE} g/><Tx x="58" y="60" t={`${qc}`} c={ORANGE} g s={11.5}/><Tx x="58" y="92" t={`entrée ${Tce}`} c={ORANGE} s={11.5}/>
        <Fl x1={262} y1={75} x2={340} y2={75} c={ORANGE} id={`${u}o`} w={2.8}/><Tx x="302" y="60" t={`sortie ${Tcs}`} c={ORANGE} g s={11.5}/>
        {sens === null
          ? <g><line x1="20" y1="125" x2="98" y2="125" stroke={BLEU} strokeWidth="2.8"/><line x1="262" y1="125" x2="340" y2="125" stroke={BLEU} strokeWidth="2.8"/>
            <Tx x="180" y="176" t={`eau froide : ${qf}`} c={BLEU} g/><Tx x="180" y="194" t={`entrée à ${Tfe}${Tfs ? ', sortie : ' + Tfs : ''}`} c={BLEU} s={11.5}/></g>
          : <g>
            <Fl x1={co ? 20 : 340} y1={125} x2={co ? 98 : 262 + 0} y2={125} c={BLEU} id={`${u}b`} w={2.8}/>
            {co ? <Fl x1={262} y1={125} x2={340} y2={125} c={BLEU} id={`${u}b`} w={2.8}/> : <Fl x1={98} y1={125} x2={20} y2={125} c={BLEU} id={`${u}b`} w={2.8}/>}
            <Tx x="180" y="176" t={`eau froide : ${qf}`} c={BLEU} g/><Tx x="180" y="194" t={`entrée ${co ? 'à gauche' : 'à droite'} : ${Tfe}${Tfs ? ', sortie : ' + Tfs : ''}`} c={BLEU} s={11.5}/>
            <Tx x="180" y="30" t={co ? 'les deux fluides circulent dans le même sens' : 'les deux fluides circulent en sens contraires'} s={11.5}/></g>}
      </svg>
    </div>);
}

// Moteur pas à pas : carte Arduino, driver de puissance, bobine, alimentation externe
function DriverBobine({ reponse = false }) {
  const u = useId().replace(/:/g, '');
  return (
    <div style={boite} data-schema="driver-bobine">
      <svg viewBox="0 0 360 210" style={svgStyle} role="img" aria-label="Une carte Arduino commande un driver de puissance qui alimente une bobine de moteur pas à pas à partir d’une alimentation externe de 12 volts">
        <defs><Pointe id={`${u}o`} c={ORANGE}/><Pointe id={`${u}v`} c={VERT}/></defs>
        <rect x="10" y="60" width="80" height="70" rx="8" fill="#0e7490" stroke="#164e63" strokeWidth="2.6"/><Tx x="50" y="90" t="carte" c="white" g/><Tx x="50" y="108" t="Arduino" c="white" g/>
        <rect x="140" y="60" width="80" height="70" rx="8" fill="#f1f5f9" stroke={TR} strokeWidth="2.6"/><Tx x="180" y="90" t="driver" g c={TR}/><Tx x="180" y="108" t="de puissance" c={TR} s={11}/>
        <rect x="270" y="60" width="80" height="70" rx="8" fill="#fef3c7" stroke={TR} strokeWidth="2.6"/><Tx x="310" y="90" t="bobine" g c={TR}/><Tx x="310" y="108" t="R = 30 Ω" c={TR} s={11.5}/>
        <rect x="140" y="160" width="80" height="34" rx="6" fill="white" stroke={TR} strokeWidth="2.4"/><Tx x="180" y="182" t="alim. 12 V" g c={TR}/>
        <line x1="90" y1="95" x2="140" y2="95" stroke={TR} strokeWidth="2.4"/><line x1="220" y1="95" x2="270" y2="95" stroke={TR} strokeWidth="2.4"/><line x1="180" y1="130" x2="180" y2="160" stroke={TR} strokeWidth="2.4"/>
        {reponse
          ? <g><Fl x1={92} y1={80} x2={138} y2={80} c={ORANGE} id={`${u}o`} w={2}/><Tx x="115" y="72" t="≈ 20 mA" c={ORANGE} g s={11}/>
            <Fl x1={190} y1={158} x2={190} y2={132} c={VERT} id={`${u}v`} w={4}/><Fl x1={222} y1={110} x2={268} y2={110} c={VERT} id={`${u}v`} w={4}/><Tx x="245" y="128" t="0,40 A" c={VERT} g s={11.5}/>
            <Tx x="180" y="30" t="le courant fort ne passe pas par la broche" c={VERT} g s={11.5}/></g>
          : <Tx x="115" y="84" t="broche" s={11}/>}
      </svg>
    </div>);
}

// Hydrodistillation : alambic, réfrigérant, essencier
function Hydrodistillation({ mp, Veau, P, T, mh }) {
  const u = useId().replace(/:/g, '');
  return (
    <div style={boite} data-schema="hydrodistillation">
      <svg viewBox="0 0 360 230" style={svgStyle} role="img" aria-label="Montage d’hydrodistillation : alambic chauffé contenant fleurs et eau, col de cygne, réfrigérant et essencier">
        <defs><Pointe id={`${u}g`} c={GRIS}/></defs>
        <path d="M30,80 L30,170 Q30,185 45,185 L115,185 Q130,185 130,170 L130,80 Z" fill="#dcfce7" stroke={TR} strokeWidth="3"/>
        <rect x="32" y="125" width="96" height="58" fill={EAU}/><Tx x="80" y="115" t={`fleurs : ${mp}`} g c="#166534"/><Tx x="80" y="155" t={`eau : ${Veau}`} g c={BLEU}/>
        <path d="M130,75 L130,40 Q130,30 150,30 L240,30 L240,60" fill="none" stroke={TR} strokeWidth="3"/><Tx x="136" y="22" t={T ? `vapeur : ${T}` : 'vapeur'} a="start" c={GRIS} g s={11.5}/>
        <rect x="215" y="60" width="50" height="80" rx="6" fill="#e0f2fe" stroke={TR} strokeWidth="2.4"/><Tx x="290" y="95" t="réfrigérant" a="start" s={11.5}/><Tx x="290" y="110" t="(eau froide)" a="start" s={11}/>
        <line x1="240" y1="140" x2="240" y2="165" stroke={TR} strokeWidth="2.6"/>
        <path d="M215,165 L265,165 L255,215 L225,215 Z" fill="white" stroke={TR} strokeWidth="2.4"/><rect x="227" y="196" width="26" height="17" fill={EAU}/><rect x="228" y="188" width="24" height="8" fill="#fde68a"/>
        <Tx x="276" y="182" t="huile" a="start" c="#92400e" g s={11.5}/><Tx x="276" y="196" t="essentielle" a="start" c="#92400e" g s={11.5}/>{mh && <Tx x="276" y="211" t={`recueillie : ${mh}`} a="start" c="#92400e" s={11}/>}
        <Tx x="280" y="222" t="essencier" a="start" s={11}/>
        <path d="M50,200 q10,-14 20,0 q10,14 20,0 q10,-14 20,0" fill="none" stroke={ORANGE} strokeWidth="2.4"/><Tx x="80" y="222" t={`chauffe : ${P}${'' }`} c={ORANGE} g s={11.5}/>
      </svg>
    </div>);
}

// Jet horizontal sortant d'un réservoir (loi de Torricelli)
function Jet({ h, v }) {
  const u = useId().replace(/:/g, '');
  return (
    <div style={boite} data-schema="jet-torricelli">
      <svg viewBox="0 0 360 210" style={svgStyle} role="img" aria-label="Réservoir maintenu plein, avec un petit orifice latéral d’où part un jet horizontal">
        <defs><Pointe id={`${u}v`} c={VERT}/><Pointe id={`${u}b`} c={BLEU}/></defs>
        <path d="M30,20 L30,150 L130,150 L130,20" fill="none" stroke={TR} strokeWidth="3"/>
        <rect x="32" y="50" width="96" height="98" fill={EAU}/><line x1="30" y1="50" x2="130" y2="50" stroke={BLEU} strokeWidth="2"/>
        <Fl x1={150} y1={50} x2={150} y2={128} c={VERT} id={`${u}v`}/><Fl x1={150} y1={128} x2={150} y2={50} c={VERT} id={`${u}v`}/><Tx x="158" y="94" t={`h = ${h}`} c={VERT} a="start" g/>
        <circle cx="130" cy="128" r="3.5" fill={TR}/><Tx x="112" y="172" t="petit orifice" a="end" s={11.5}/>
        <path d="M130,128 Q215,128 270,190" fill="none" stroke={BLEU} strokeWidth="3.2" markerEnd={`url(#${u}b)`}/>
        <Tx x="350" y="40" t="vitesse mesurée du jet" a="end" c={BLEU} g s={11.5}/><Tx x="350" y="56" t={`v = ${v}`} a="end" c={BLEU} g s={11.5}/>
        <line x1="10" y1="196" x2="350" y2="196" stroke={TR} strokeWidth="3"/><Tx x="80" y="12" t="réservoir ouvert, maintenu plein" s={11.5}/>
      </svg>
    </div>);
}

// Carte Arduino alimentée par l'USB mesurant une source étalon
function CanEtalon({ ref: tension = '2,500 V' }) {
  return (
    <div style={boite} data-schema="can-etalon">
      <svg viewBox="0 0 360 190" style={svgStyle} role="img" aria-label="Une source étalon est reliée à l’entrée analogique d’une carte Arduino alimentée par le port USB">
        <rect x="10" y="60" width="100" height="60" rx="8" fill="#f1f5f9" stroke={TR} strokeWidth="2.6"/><Tx x="60" y="86" t="source étalon" g c={TR}/><Tx x="60" y="106" t={tension} g c={VERT}/>
        <line x1="110" y1="90" x2="205" y2="90" stroke={TR} strokeWidth="2.4"/><Tx x="158" y="82" t="entrée A0" s={11.5}/>
        <rect x="205" y="30" width="145" height="120" rx="8" fill="#0e7490" stroke="#164e63" strokeWidth="2.6"/><Tx x="277" y="52" t="Arduino" g c="white"/><Tx x="277" y="94" t="CAN 10 bits" g c="white"/><Tx x="277" y="112" t="N entre 0 et 1 023" c="white" s={11}/>
        <rect x="215" y="150" width="125" height="26" rx="5" fill="white" stroke={TR} strokeWidth="2"/><Tx x="277" y="168" t="alimentation USB 5,00 V" c={TR} g s={11}/>
        <line x1="277" y1="150" x2="277" y2="126" stroke={TR} strokeWidth="2" strokeDasharray="4 3"/>
        <Tx x="60" y="150" t="incertitude négligeable" s={11}/>
      </svg>
    </div>);
}

// Vases communicants : deux récipients ouverts reliés à leur base
function Vases() {
  return (
    <div style={boite} data-schema="vases-communicants">
      <svg viewBox="0 0 360 200" style={svgStyle} role="img" aria-label="Deux récipients ouverts de formes différentes, reliés par un tube à leur base, contenant de l’eau">
        <polygon points="42,70 98,70 98,142 217,142 217,70 328,70 328,168 42,168" fill={EAU}/>
        <polyline points="40,30 40,170 330,170 330,30" fill="none" stroke={TR} strokeWidth="3"/>
        <polyline points="100,30 100,142 215,142 215,30" fill="none" stroke={TR} strokeWidth="3"/>
        <line x1="36" y1="70" x2="324" y2="70" stroke={ORANGE} strokeWidth="2" strokeDasharray="6 4"/>
        <Tx x="180" y="62" t="prévision : même altitude" c={ORANGE} g/>
        <Tx x="70" y="20" t="récipient ouvert" s={11.5}/><Tx x="272" y="20" t="récipient ouvert" s={11.5}/><Tx x="158" y="190" t="les deux récipients communiquent par la base" s={11.5}/>
      </svg>
    </div>);
}

export const DESSINS_DONNEES = { driverBobine: DriverBobine, vases: Vases, canEtalon: CanEtalon, jet: Jet, conduiteConvergent: ConduiteConvergent, echangeur: Echangeur, hydrodistillation: Hydrodistillation, regul: Regul, cuveHuile: CuveHuile, pompeChateau: PompeChateau, evaporateur: Evaporateur, boussole: Boussole };
