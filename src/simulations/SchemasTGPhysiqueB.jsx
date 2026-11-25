// ====================================================
//  Schémas NEUTRES des exercices de remédiation de Terminale spécialité « Ondes et signaux » (lunette, photons, circuit RC)
//  et « L'énergie : conversions et transferts » (gaz parfait, premier principe, transferts thermiques, bilan de la Terre).
//  Règle : géométrie et symboles seulement, jamais de valeur chiffrée de l'énoncé, jamais le résultat. Ce qui n'apparaît qu'après correction
//  est décrit par le drapeau « apres » (voir Visuel dans SchemasC1.jsx). viewBox de 480 : textes de 16 (13 px à 390 px de large).
//  Types : lunetteTG, rcSerie, gazTG, thermoTG, pp1TG, terreTG, photoTG, condoTG.
// ====================================================
import { useId } from 'react';
import { KIT } from '../commun';
import { SceneLunetteTG } from './LunetteTGSchemas.jsx';

const TR = '#334155', BLEU = '#2563eb', ROUGE = '#c2410c', GRIS = '#64748b', VERT = '#15803d', EAU = '#bfdbfe', JAUNE = '#ca8a04', VIOLET = '#7c3aed';
const boite = { background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: 6 };
const svgStyle = { width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto' };
const Fleche = ({ id, c }) => <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={c}/></marker>;
const T = ({ x, y, children, c = '#0f172a', s = 20, a = 'middle', w = 600 }) => <text x={x} y={y} fontSize={s} fill={c} textAnchor={a} fontWeight={w}>{children}</text>;
const It = ({ children }) => <tspan fontStyle="italic">{children}</tspan>;
const Ind = ({ children }) => <tspan fontSize="15" dy="5">{children}</tspan>;
const Cadre = ({ nom, aria, h, children }) => <div style={boite} data-schema={nom}><svg viewBox={`0 0 480 ${h}`} role="img" aria-label={aria} style={svgStyle}>{children}</svg></div>;

// ───────────────────────── Lunette afocale (réutilise la scène de la simulation 171) ─────────────────────────
// montre : voir SceneLunetteTG ; legende : lignes de texte sous le dessin
export function LunetteTG({ f1 = 400, f2 = 50, d, theta = 0.5, montre = { axe: true, ocu: true }, legende, aria = 'Lunette afocale : objectif et oculaire, convergents' }) {
  return <div style={boite} data-schema="lunetteTG"><SceneLunetteTG f1={f1} f2={f2} d={d ?? f1 + f2} theta={theta} montre={montre} legende={legende} aria={aria} carte/></div>;
}

// ───────────────────────── Circuit RC série ─────────────────────────
// generateur : source idéale de tension E ; interrupteur : 'ouvert' | 'ferme' ; i, uC : flèches (convention récepteur) ; armature : nom de l'armature vers laquelle pointe i ; signes : + / − sur les armatures
export function RcSerie({ generateur = true, interrupteur = 'ferme', i = true, uC = true, armature = '', signes = false, nomsDipoles = true }) {
  const u = useId().replace(/:/g, '');
  const sw = interrupteur === 'ouvert';
  return (
    <Cadre nom="rcSerie" h={250} aria={`Circuit série : ${generateur ? 'générateur idéal de tension E, ' : ''}interrupteur ${sw ? 'ouvert' : 'fermé'}, résistor R et condensateur C${i ? ', courant i fléché vers le condensateur' : ''}${uC ? ', tension u_C aux bornes du condensateur' : ''}`}>
      <defs><Fleche id={`${u}i`} c={ROUGE}/><Fleche id={`${u}u`} c={BLEU}/></defs>
      <g fill="none" stroke={TR} strokeWidth="2.5" strokeLinecap="round">
        <polyline points="60,100 60,60 130,60"/><polyline points={sw ? '190,60 250,60' : '184,60 250,60'}/>
        <line x1="130" y1="60" x2={sw ? 178 : 184} y2={sw ? 36 : 60}/><line x1="330" y1="60" x2="420" y2="60"/><line x1="420" y1="60" x2="420" y2="105"/>
        <line x1="420" y1="127" x2="420" y2="200"/><polyline points="420,200 60,200 60,152"/>
        <rect x="250" y="46" width="80" height="28" fill="white"/>
        <line x1="396" y1="105" x2="444" y2="105" strokeWidth="4"/><line x1="396" y1="127" x2="444" y2="127" strokeWidth="4"/>
      </g>
      {!generateur && <line x1="60" y1="100" x2="60" y2="152" stroke={TR} strokeWidth="2.5"/>}
      {generateur && <g><circle cx="60" cy="126" r="26" fill="white" stroke={TR} strokeWidth="2.5"/><T x={60} y={133} s={20}><It>E</It></T></g>}
      <circle cx="130" cy="60" r="4" fill={TR}/><circle cx="190" cy="60" r="4" fill={TR}/>
      <T x={160} y={26} c={GRIS} s={20} w={500}>interrupteur</T>
      <T x={290} y={36}><It>R</It></T>
      {nomsDipoles && <T x={452} y={138} a="start"><It>C</It></T>}
      {i && <g><line x1="338" y1="42" x2="386" y2="42" stroke={ROUGE} strokeWidth="2.5" markerEnd={`url(#${u}i)`}/><T x={362} y={30} c={ROUGE}><It>i</It></T></g>}
      {uC && <g><line x1="384" y1="127" x2="384" y2="105" stroke={BLEU} strokeWidth="2.5" markerEnd={`url(#${u}u)`}/><T x={366} y={122} c={BLEU} a="end"><It>u</It><Ind>C</Ind></T></g>}
      {armature && <T x={452} y={110} a="start" c={TR} s={20}>{armature}</T>}
      {signes && <g><T x={410} y={98} a="end" c={ROUGE} s={20}>+</T><T x={410} y={148} a="end" c={BLEU} s={22}>−</T></g>}
      <T x={240} y={238} c={GRIS} s={20} w={400}>schéma non à l’échelle</T>
    </Cadre>);
}

// ───────────────────────── Gaz : bouteille rigide chauffée, gaz sous piston, ballon ouvert ─────────────────────────
const Points = ({ pts, c = BLEU }) => <g fill={c}>{pts.map(([x, y], k) => <circle key={k} cx={x} cy={y} r="4"/>)}</g>;
const Flamme = ({ x, y }) => <g><path d={`M${x},${y} q-16,-22 0,-40 q4,16 12,18 q8,-8 -2,-26 q26,22 14,48 z`} fill="#f97316" stroke="#c2410c" strokeWidth="1.5"/><path d={`M${x + 6},${y} q-8,-12 2,-22 q8,10 4,22 z`} fill="#fde047"/></g>;
export function GazTG({ cas = 'bouteille' }) {
  const u = useId().replace(/:/g, '');
  if (cas === 'piston') return (
    <Cadre nom="gazTG" h={230} aria="Gaz enfermé dans un cylindre fermé par un piston mobile, plongé dans un bain à température constante">
      <defs><Fleche id={`${u}a`} c={ROUGE}/></defs>
      <rect x="100" y="60" width="350" height="120" rx="6" fill="#e0f2fe" stroke={BLEU} strokeWidth="2" strokeDasharray="6 4"/>
      <T x={275} y={50} c={BLEU}>bain à température constante</T>
      <rect x="150" y="85" width="270" height="70" fill="#f1f5f9" stroke={TR} strokeWidth="3"/>
      <rect x="190" y="77" width="16" height="86" fill="#94a3b8" stroke={TR} strokeWidth="2.5"/>
      <line x1="190" y1="120" x2="128" y2="120" stroke={TR} strokeWidth="4"/><line x1="128" y1="106" x2="128" y2="134" stroke={TR} strokeWidth="6"/>
      <line x1="24" y1="120" x2="116" y2="120" stroke={ROUGE} strokeWidth="3" markerEnd={`url(#${u}a)`}/>
      <T x={24} y={100} a="start" c={ROUGE}>poussée</T>
      <Points pts={[[230, 98], [255, 140], [280, 108], [305, 130], [332, 100], [350, 142], [370, 112], [245, 120]]}/>
      <T x={330} y={205}>gaz (parfait)</T><T x={198} y={205} c={TR}>piston</T>
    </Cadre>);
  if (cas === 'ballon') return (
    <Cadre nom="gazTG" h={290} aria="Ballon ouvert par le bas, rempli d’air, chauffé par une flamme">
      <path d="M240,24 C340,24 372,100 330,160 C312,186 292,194 282,200 L198,200 C188,194 168,186 150,160 C108,100 140,24 240,24 Z" fill="#ffedd5" stroke={ROUGE} strokeWidth="3"/>
      <Points pts={[[200, 150], [285, 150], [215, 182], [270, 178], [250, 70], [212, 84], [288, 92]]} c={ROUGE}/>
      <T x={240} y={124} c="#9a3412">air chaud</T>
      <Flamme x={226} y={246}/>
      <T x={340} y={224} a="start" c={TR}>ouverture</T>
      <line x1="336" y1="218" x2="290" y2="203" stroke={TR} strokeWidth="2"/>
      <T x={240} y={282} c={GRIS}>air extérieur à la pression atmosphérique</T>
    </Cadre>);
  return (
    <Cadre nom="gazTG" h={250} aria="Bouteille rigide et fermée contenant un gaz, munie d’un manomètre, chauffée par une flamme">
      <rect x="170" y="70" width="150" height="130" rx="14" fill="#f1f5f9" stroke={TR} strokeWidth="3.5"/>
      <rect x="225" y="48" width="40" height="24" fill="#94a3b8" stroke={TR} strokeWidth="2.5"/>
      <circle cx="245" cy="30" r="20" fill="white" stroke={TR} strokeWidth="2.5"/><line x1="245" y1="30" x2="256" y2="20" stroke={ROUGE} strokeWidth="3"/>
      <T x={282} y={34} a="start" c={TR}>manomètre</T>
      <Points pts={[[196, 100], [226, 150], [255, 112], [285, 160], [300, 100], [205, 170], [262, 182], [232, 122]]}/>
      <T x={150} y={120} a="end" c={TR}>bouteille</T><T x={150} y={140} a="end" c={TR}>rigide</T><T x={150} y={160} a="end" c={TR}>et fermée</T>
      <Flamme x={232} y={246}/>
      <T x={470} y={226} a="end" c={GRIS}>source de chaleur</T>
    </Cadre>);
}

// ───────────────────────── Thermique : tasse(s) dans une pièce, bouteille isolante ─────────────────────────
const Tasse = ({ x, y, niveau = 0.8, nom, vapeur = true }) => (
  <g>
    <path d={`M${x},${y} L${x + 12},${y + 80} L${x + 78},${y + 80} L${x + 90},${y} Z`} fill="white" stroke={TR} strokeWidth="3"/>
    <path d={`M${x + 12 * (80 * (1 - niveau)) / 80},${y + 80 * (1 - niveau)} L${x + 12},${y + 80} L${x + 78},${y + 80} L${x + 90 - 12 * (80 * (1 - niveau)) / 80},${y + 80 * (1 - niveau)} Z`} fill="#92400e" opacity="0.85"/>
    <path d={`M${x + 90},${y + 14} q28,2 22,26 q-4,14 -20,12`} fill="none" stroke={TR} strokeWidth="3"/>
    {vapeur && <g fill="none" stroke={GRIS} strokeWidth="2" strokeLinecap="round"><path d={`M${x + 30},${y - 8} q-8,-10 0,-18`}/><path d={`M${x + 52},${y - 8} q-8,-10 0,-18`}/></g>}
    <T x={x + 45} y={y + 110}>{nom}</T>
  </g>);
export function ThermoTG({ cas = 'tasse' }) {
  const u = useId().replace(/:/g, '');
  if (cas === 'deuxTasses') return (
    <Cadre nom="thermoTG" h={210} aria="Deux tasses identiques, l’une moins remplie de café que l’autre, posées dans la même pièce">
      <rect x="10" y="10" width="460" height="190" rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5"/>
      <T x={240} y={32} c={GRIS} w={500}>même pièce</T>
      <Tasse x={80} y={72} niveau={0.45} nom="tasse A"/><Tasse x={290} y={72} niveau={0.9} nom="tasse B"/>
    </Cadre>);
  if (cas === 'pieces') return (
    <Cadre nom="thermoTG" h={210} aria="Deux tasses identiques, l’une dans une pièce, l’autre dans une cave">
      <rect x="10" y="10" width="220" height="190" rx="10" fill="#fef9c3" stroke="#cbd5e1" strokeWidth="1.5"/><rect x="250" y="10" width="220" height="190" rx="10" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5"/>
      <T x={120} y={32} c={GRIS} w={500}>pièce</T><T x={360} y={32} c={GRIS} w={500}>cave</T>
      <Tasse x={75} y={72} niveau={0.8} nom="tasse 1"/><Tasse x={315} y={72} niveau={0.8} nom="tasse 2"/>
    </Cadre>);
  if (cas === 'thermos') return (
    <Cadre nom="thermoTG" h={260} aria="Coupe d’une bouteille isolante : double paroi avec vide, surfaces intérieures brillantes, bouchon">
      <rect x="170" y="40" width="180" height="200" rx="24" fill="#f1f5f9" stroke={TR} strokeWidth="3"/><rect x="192" y="62" width="136" height="156" rx="14" fill="#dbeafe" stroke={TR} strokeWidth="3"/>
      <rect x="150" y="14" width="220" height="26" rx="6" fill="#94a3b8" stroke={TR} strokeWidth="2.5"/>
      <T x={260} y={136} c="#1e3a8a">liquide</T><T x={260} y={160} c="#1e3a8a">chaud</T>
      <T x={14} y={118} a="start" c={VIOLET}>vide entre</T><T x={14} y={142} a="start" c={VIOLET}>les parois</T>
      <line x1="120" y1="130" x2="180" y2="130" stroke={VIOLET} strokeWidth="2.5"/>
      <T x={474} y={118} a="end" c={TR}>surfaces</T><T x={474} y={142} a="end" c={TR}>intérieures</T><T x={474} y={166} a="end" c={TR}>argentées</T>
    </Cadre>);
  return (
    <Cadre nom="thermoTG" h={240} aria="Une tasse de café dans une pièce, le flux thermique va de la tasse vers la pièce">
      <defs><Fleche id={`${u}a`} c={ROUGE}/></defs>
      <rect x="10" y="10" width="460" height="220" rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5"/>
      <Tasse x={90} y={70} niveau={0.8} nom="café : T(t)"/>
      <line x1="220" y1="116" x2="330" y2="116" stroke={ROUGE} strokeWidth="3" markerEnd={`url(#${u}a)`}/>
      <T x={275} y={102} c={ROUGE}>flux thermique</T>
      <T x={400} y={112} c={TR}>pièce</T><T x={400} y={134} c={TR} s={20} w={500}>(thermostat)</T><T x={400} y={156} c={TR}><It>T</It><Ind>ext</Ind> constante</T>
    </Cadre>);
}

// ───────────────────────── Premier principe : bloc dans l'eau, pale dans un liquide, deux récipients chauffés ─────────────────────────
const Hachures = ({ x, y, w, h }) => <rect x={x} y={y} width={w} height={h} fill="#e2e8f0" stroke={TR} strokeWidth="2.5"/>;
export function Pp1TG({ cas = 'bloc' }) {
  const u = useId().replace(/:/g, '');
  if (cas === 'recipients') return (
    <Cadre nom="pp1TG" h={250} aria="Deux récipients identiques contenant de l’eau, l’un en plus grande quantité que l’autre, chacun posé sur une plaque chauffante">
      <defs><Fleche id={`${u}a`} c={ROUGE}/></defs>
      <T x={240} y={22} c={ROUGE}>même transfert thermique</T><T x={240} y={46} c={ROUGE}>reçu par chaque récipient</T>
      {[[60, 'récipient 1', 150], [280, 'récipient 2', 84]].map(([x, nom, yL]) => (
        <g key={nom}>
          <rect x={x + 2} y={yL} width="116" height={170 - yL} fill={EAU}/>
          <path d={`M${x},64 L${x},170 L${x + 120},170 L${x + 120},64`} fill="none" stroke={TR} strokeWidth="3.5"/>
          <rect x={x - 10} y="170" width="140" height="14" fill="#94a3b8" stroke={TR} strokeWidth="2.5"/>
          <line x1={x + 60} y1="226" x2={x + 60} y2="194" stroke={ROUGE} strokeWidth="3" markerEnd={`url(#${u}a)`}/>
          <T x={x + 60} y={246}>{nom}</T>
        </g>))}
    </Cadre>);
  if (cas === 'pale') return (
    <Cadre nom="pp1TG" h={250} aria="Liquide brassé par une pale dans un récipient isolé thermiquement">
      <defs><Fleche id={`${u}a`} c={ROUGE}/></defs>
      <Hachures x={230} y={80} w={220} h={150}/><rect x={246} y={96} width={188} height={118} fill="#dbeafe" stroke={TR} strokeWidth="2"/>
      <line x1="340" y1="30" x2="340" y2="160" stroke={TR} strokeWidth="5"/><rect x="306" y="156" width="68" height="12" fill={TR}/>
      <path d="M380,48 a40,14 0 1 0 -80,0" fill="none" stroke={ROUGE} strokeWidth="3" markerEnd={`url(#${u}a)`}/>
      <T x={290} y={30} a="end" c={ROUGE}>on tourne</T><T x={290} y={50} a="end" c={ROUGE}>la pale</T>
      <T x={340} y={196} c="#1e3a8a">liquide</T>
      <T x={20} y={150} a="start" c={TR}>paroi</T><T x={20} y={170} a="start" c={TR}>isolante</T><line x1="86" y1="160" x2="228" y2="160" stroke={TR} strokeWidth="2"/>
    </Cadre>);
  return (
    <Cadre nom="pp1TG" h={250} aria="Un bloc de métal chaud plongé dans de l’eau froide, dans un récipient isolé thermiquement de l’extérieur">
      <Hachures x={230} y={50} w={220} h={180}/><rect x={246} y={66} width={188} height={148} fill={EAU}/>
      <rect x={306} y={110} width={68} height={50} fill="#9a3412" stroke={TR} strokeWidth="2.5"/>
      <T x={340} y={141} c="white">bloc</T><T x={340} y={196} c="#1e3a8a">eau</T>
      <T x={20} y={130} a="start" c={TR}>paroi</T><T x={20} y={150} a="start" c={TR}>isolante</T><line x1="86" y1="140" x2="228" y2="140" stroke={TR} strokeWidth="2"/>
    </Cadre>);
}

// ───────────────────────── Bilan thermique de la Terre ─────────────────────────
// serre : on dessine une couche d'atmosphère qui absorbe une partie du rayonnement infrarouge émis
export function TerreTG({ serre = false }) {
  const u = useId().replace(/:/g, '');
  return (
    <Cadre nom="terreTG" h={250} aria={`Le Soleil envoie un rayonnement vers la Terre ; une partie est réfléchie, la Terre émet un rayonnement infrarouge${serre ? ' ; une couche d’atmosphère absorbe une partie de ce rayonnement infrarouge' : ''}`}>
      <defs><Fleche id={`${u}j`} c={JAUNE}/><Fleche id={`${u}r`} c={ROUGE}/><Fleche id={`${u}g`} c={GRIS}/></defs>
      <circle cx="40" cy="110" r="28" fill="#fde047" stroke={JAUNE} strokeWidth="3"/><T x={40} y={160} c={TR}>Soleil</T>
      {serre && <circle cx="350" cy="110" r="84" fill="none" stroke="#7dd3fc" strokeWidth="12" opacity="0.6"/>}
      <circle cx="350" cy="110" r="70" fill="#bae6fd" stroke={TR} strokeWidth="3"/><path d="M322,72 q20,-10 30,10 q-10,20 -30,18 z M370,120 q22,-6 24,16 q-12,14 -26,4 z" fill="#86efac"/>
      <T x={350} y={116} c={TR}>Terre</T>
      {serre && <T x={474} y={24} a="end" c="#0369a1">atmosphère</T>}
      <g fill="none" strokeWidth="3"><line x1="76" y1="84" x2="258" y2="84" stroke={JAUNE} markerEnd={`url(#${u}j)`}/><line x1="76" y1="110" x2="258" y2="110" stroke={JAUNE} markerEnd={`url(#${u}j)`}/><line x1="76" y1="136" x2="258" y2="136" stroke={JAUNE} markerEnd={`url(#${u}j)`}/></g>
      <T x={166} y={62} c="#92400e">rayonnement solaire</T>
      <line x1="262" y1="168" x2="170" y2="206" stroke={GRIS} strokeWidth="3" markerEnd={`url(#${u}g)`}/><T x={14} y={228} a="start" c={TR}>partie réfléchie</T>
      <line x1="398" y1="168" x2="450" y2="222" stroke={ROUGE} strokeWidth="3" markerEnd={`url(#${u}r)`}/><T x={474} y={246} a="end" c={ROUGE}>infrarouge émis</T>
    </Cadre>);
}

// ───────────────────────── Effet photoélectrique ─────────────────────────
export function PhotoTG() {
  const u = useId().replace(/:/g, '');
  return (
    <Cadre nom="photoTG" h={240} aria="Une lumière éclaire une plaque métallique ; des électrons peuvent être éjectés de la plaque">
      <defs><Fleche id={`${u}p`} c={VIOLET}/><Fleche id={`${u}e`} c={BLEU}/></defs>
      <rect x="90" y="176" width="300" height="30" fill="#cbd5e1" stroke={TR} strokeWidth="3"/><T x={240} y={226} c={TR}>plaque métallique</T>
      {[150, 240, 330].map((x, k) => <path key={k} d={`M${x - 50},${20 + k * 8} q10,-12 20,0 t20,0 t20,0 t20,0 l12,10`} fill="none" stroke={VIOLET} strokeWidth="3" markerEnd={`url(#${u}p)`} transform={`translate(${k === 1 ? 18 : 0},${k === 1 ? 24 : 40}) rotate(0)`}/>)}
      <T x={60} y={44} a="start" c={VIOLET}>lumière</T>
      <g fill="none" stroke={BLEU} strokeWidth="2.5"><line x1="140" y1="168" x2="180" y2="116" markerEnd={`url(#${u}e)`}/><line x1="220" y1="168" x2="252" y2="128" markerEnd={`url(#${u}e)`}/></g>
      <T x={470} y={146} a="end" c={BLEU}>électrons éjectés ?</T>
    </Cadre>);
}

// ───────────────────────── Condensateur : deux plaques, capteur de niveau ─────────────────────────
export function CondoTG({ cas = 'plaques' }) {
  const u = useId().replace(/:/g, '');
  if (cas === 'niveau') return (
    <Cadre nom="condoTG" h={250} aria="Réservoir contenant un liquide isolant, avec deux électrodes verticales plongées dans le réservoir ; la hauteur de liquide peut varier">
      <defs><Fleche id={`${u}h`} c={TR}/></defs>
      <path d="M130,20 L130,220 L350,220 L350,20" fill="none" stroke={TR} strokeWidth="3.5"/>
      <rect x="132" y="110" width="216" height="108" fill="#fde68a"/><path d="M132,110 q27,-6 54,0 t54,0 t54,0 t54,0" fill="none" stroke="#b45309" strokeWidth="2"/>
      <T x={240} y={212} c="#92400e">liquide isolant</T>
      <rect x="180" y="24" width="10" height="170" fill="#94a3b8" stroke={TR} strokeWidth="2.5"/><rect x="290" y="24" width="10" height="170" fill="#94a3b8" stroke={TR} strokeWidth="2.5"/>
      <T x={185} y={16} s={20}>électrode</T><T x={295} y={16} s={20}>électrode</T>
      <line x1="90" y1="110" x2="90" y2="218" stroke={TR} strokeWidth="2" markerStart={`url(#${u}h)`} markerEnd={`url(#${u}h)`}/><T x={80} y={170} a="end"><It>h</It></T>
      <T x={240} y={70} c={GRIS} w={500}>air</T>
    </Cadre>);
  return (
    <Cadre nom="condoTG" h={220} aria="Deux plaques métalliques parallèles, de surface S, séparées d’une distance d par un isolant">
      <defs><Fleche id={`${u}h`} c={TR}/></defs>
      <rect x="130" y="60" width="220" height="12" fill="#94a3b8" stroke={TR} strokeWidth="2.5"/><rect x="130" y="148" width="220" height="12" fill="#94a3b8" stroke={TR} strokeWidth="2.5"/>
      <T x={240} y={116} c={GRIS} w={500}>isolant (air, vide…)</T>
      <line x1="100" y1="74" x2="100" y2="146" stroke={TR} strokeWidth="2" markerStart={`url(#${u}h)`} markerEnd={`url(#${u}h)`}/><T x={90} y={116} a="end"><It>d</It></T>
      <T x={365} y={72} a="start" c={TR}>plaque 1</T><T x={365} y={160} a="start" c={TR}>plaque 2</T>
      <T x={240} y={196} c={TR}>surface de chaque plaque : <It>S</It></T>
    </Cadre>);
}

