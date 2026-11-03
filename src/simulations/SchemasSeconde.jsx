import { useId } from "react";
import { KIT } from "../commun";

// ====================================================
//  SCHÉMAS DE SECONDE : circuits électriques, optique (miroir, dioptre, lentille), mouvements
// ====================================================
// Même principe que SchemasC1 : une banque décrit un visuel par { type, …paramètres } ; Visuel() le dessine.
// La réponse de l'exercice n'est jamais dessinée avant la correction : le paramètre `reponse` (donné par `apres: { reponse: true }`)
// ajoute ce qui donne la réponse (rayon réfracté, valeur du second ampèremètre…).
//   circuit : { montage: 'serie' | 'derivation' | 'voltmetre', … }
//   optique : { cas: 'miroir' | 'dioptre' | 'lentille-parallele' | 'lentille-centre' | 'lentille-infini', … }
//   mouvement : { cas: …, … }

const TR = '#334155', BLEU = '#2563eb', ORANGE = '#c2410c', VERT = '#15803d', GRIS = '#94a3b8', JAUNE = '#ca8a04';
const boite = { background: 'white', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: 6 };
const svgStyle = { width: '100%', maxWidth: 460, height: 'auto', display: 'block', margin: '0 auto' };
const Ind = ({ b, i }) => <><tspan>{b}</tspan><tspan fontSize="0.75em" dy="3">{i}</tspan><tspan dy="-3"> </tspan></>;
const RAD = Math.PI / 180;

// ── Composants de circuit ──
const Fil = ({ pts, c = TR, dash }) => <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke={c} strokeWidth="2.2" strokeLinejoin="round" strokeDasharray={dash}/>;
const Pile = ({ x, y, v }) => (   // pile verticale : bornes + (en haut) et − (en bas), centre en (x, y)
  <g stroke={TR} strokeWidth="2.2">
    <line x1={x - 14} y1={y - 6} x2={x + 14} y2={y - 6}/><line x1={x - 8} y1={y + 6} x2={x + 8} y2={y + 6}/>
    <text x={x + 18} y={y - 8} fontSize="13" fill={TR} stroke="none">+</text><text x={x + 18} y={y + 16} fontSize="13" fill={TR} stroke="none">−</text>
    {v && <text x={x - 20} y={y + 4} fontSize="13" fontWeight="700" fill={BLEU} stroke="none" textAnchor="end">{v}</text>}
  </g>);
const Lampe = ({ x, y, nom, grillee = false }) => (
  <g>
    <circle cx={x} cy={y} r="15" fill="white" stroke={TR} strokeWidth="2.2"/>
    <line x1={x - 10.6} y1={y - 10.6} x2={x + 10.6} y2={y + 10.6} stroke={TR} strokeWidth="2"/><line x1={x - 10.6} y1={y + 10.6} x2={x + 10.6} y2={y - 10.6} stroke={TR} strokeWidth="2"/>
    {grillee && <g><circle cx={x} cy={y} r="15" fill="white" opacity="0.7"/><line x1={x - 10.6} y1={y - 10.6} x2={x - 2} y2={y - 2} stroke={ORANGE} strokeWidth="2.4"/><line x1={x + 2} y1={y + 2} x2={x + 10.6} y2={y + 10.6} stroke={ORANGE} strokeWidth="2.4"/><line x1={x - 10.6} y1={y + 10.6} x2={x + 10.6} y2={y - 10.6} stroke={ORANGE} strokeWidth="2.4" strokeDasharray="3 4"/></g>}
    {nom && <text x={x} y={y - 22} fontSize="13" fill={TR} textAnchor="middle" fontWeight="700"><Ind b={nom[0]} i={nom.slice(1)}/></text>}
  </g>);
const Metre = ({ x, y, lettre, valeur, couleur = BLEU }) => (   // ampèremètre (A) ou voltmètre (V)
  <g>
    <circle cx={x} cy={y} r="14" fill="white" stroke={couleur} strokeWidth="2.4"/>
    <text x={x} y={y + 5} fontSize="14" fontWeight="800" fill={couleur} textAnchor="middle">{lettre}</text>
    {valeur != null && <text x={x} y={y + 31} fontSize="13" fontWeight="700" fill={couleur} textAnchor="middle">{valeur}</text>}
  </g>);
const Fleche = ({ x1, y1, x2, y2, c, id }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="2.2" markerEnd={`url(#${id})`}/>;
const Pointe = ({ id, c }) => <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={c}/></marker>;

// Circuit en série : pile, ampèremètre A₁, lampes L₁ et L₂, ampèremètre A₂ ; mesure1 = valeur lue sur A₁ ; mesure2 = valeur lue sur A₂ (cachée tant que reponse est faux)
function CircuitSerie({ mesure1 = '', mesure2 = '', tension = '', reponse = false, avecAmperemetres = true }) {
  const u = useId().replace(/:/g, '');
  return (
    <div style={boite} data-schema="circuit-serie">
      <svg viewBox="0 0 360 210" style={svgStyle} role="img" aria-label="Circuit en série : une pile, deux lampes L1 et L2, un ampèremètre avant la première lampe et un après la deuxième">
        <defs><Pointe id={`${u}p`} c={ORANGE}/></defs>
        <Fil pts={[[60, 94], [60, 50], [avecAmperemetres ? 83 : 140, 50]]}/>{avecAmperemetres && <Fil pts={[[111, 50], [140, 50]]}/>}<Fil pts={[[163, 50], [222, 50]]}/><Fil pts={[[238, 50], [avecAmperemetres ? 291 : 340, 50]]}/>{avecAmperemetres && <Fil pts={[[319, 50], [340, 50]]}/>}<Fil pts={[[340, 50], [340, 170], [60, 170], [60, 114]]}/>
        <Pile x={60} y={104} v={tension}/>
        {avecAmperemetres && <Metre x={97} y={50} lettre="A" valeur={undefined}/>}
        <Lampe x={155} y={50} nom="L1"/><Lampe x={230} y={50} nom="L2"/>
        {avecAmperemetres && <Metre x={305} y={50} lettre="A" couleur={reponse ? VERT : BLEU}/>}
        {avecAmperemetres && <>
          <text x="97" y="90" fontSize="13" fontWeight="700" fill={BLEU} textAnchor="middle"><Ind b="A" i="1"/>{mesure1 ? `= ${mesure1}` : ''}</text>
          <text x="305" y="90" fontSize="13" fontWeight="700" fill={reponse ? VERT : ORANGE} textAnchor="middle"><Ind b="A" i="2"/>{reponse ? `= ${mesure2}` : '= ?'}</text>
        </>}
        <Fleche x1={150} y1={150} x2={230} y2={150} c={GRIS} id={`${u}p`}/><text x="190" y="142" fontSize="12" fill="#64748b" textAnchor="middle">sens du courant</text>
        <text x="200" y="196" fontSize="12" fill="#64748b" textAnchor="middle">un seul chemin pour le courant</text>
      </svg>
    </div>);
}

// Circuit en dérivation : pile, deux branches avec une lampe chacune ; labels des intensités (I, I₁, I₂), tension du générateur, panne (branche 2 coupée)
function CircuitDerivation({ tension = '', courant = '', i1 = '', i2 = '', panne = false, reponse = false, tensionLampes = false }) {
  const u = useId().replace(/:/g, '');
  const bran = (x, n, coupe) => (
    <g>
      <Fil pts={[[x, 50], [x, coupe ? 78 : 86]]}/><Fil pts={[[x, coupe ? 122 : 114], [x, 170]]}/>
      {coupe ? <Lampe x={x} y={100} nom={`L${n}`} grillee/> : <Lampe x={x} y={100} nom={`L${n}`}/>}
    </g>);
  return (
    <div style={boite} data-schema="circuit-derivation">
      <svg viewBox="0 0 360 210" style={svgStyle} role="img" aria-label={panne ? 'Deux lampes en dérivation aux bornes d’une pile ; le filament de la lampe L2 est grillé' : 'Deux lampes en dérivation aux bornes d’une pile'}>
        <defs><Pointe id={`${u}b`} c={BLEU}/><Pointe id={`${u}v`} c={VERT}/></defs>
        <Fil pts={[[60, 94], [60, 50], [260, 50]]}/><Fil pts={[[60, 114], [60, 170], [260, 170]]}/>
        <circle cx="160" cy="50" r="3.5" fill={TR}/><circle cx="160" cy="170" r="3.5" fill={TR}/>
        <Pile x={60} y={104} v={tension}/>
        {bran(160, 1, false)}{bran(260, 2, panne)}
        {courant && <><Fleche x1={90} y1={36} x2={130} y2={36} c={BLEU} id={`${u}b`}/><text x="110" y="28" fontSize="13" fontWeight="700" fill={BLEU} textAnchor="middle">I = {courant}</text></>}
        {i1 && <><Fleche x1={178} y1={124} x2={178} y2={146} c={VERT} id={`${u}v`}/><text x="186" y="140" fontSize="13" fontWeight="700" fill={VERT}><Ind b="I" i="1"/>{i1 === '?' && !reponse ? '= ?' : `= ${i1}`}</text></>}
        {i2 && <><Fleche x1={278} y1={124} x2={278} y2={146} c={VERT} id={`${u}v`}/><text x="286" y="140" fontSize="13" fontWeight="700" fill={VERT}><Ind b="I" i="2"/>{i2 === '?' && !reponse ? '= ?' : `= ${i2}`}</text></>}
        {tensionLampes && <text x="210" y="192" fontSize="13" fontWeight="700" fill={ORANGE} textAnchor="middle"><Ind b="U" i="1"/> = ?   <Ind b="U" i="2"/> = ?</text>}
        {panne && <text x="260" y="140" fontSize="12.5" fill={ORANGE} textAnchor="middle">filament grillé</text>}
      </svg>
    </div>);
}

// Un circuit simple (pile + lampe) ; le voltmètre est proposé hors du circuit (« à brancher ») et, à la correction, branché en dérivation aux bornes de la lampe
function CircuitVoltmetre({ reponse = false }) {
  return (
    <div style={boite} data-schema="circuit-voltmetre">
      <svg viewBox="0 0 380 210" style={svgStyle} role="img" aria-label="Une pile et une lampe en série ; un voltmètre est à brancher pour mesurer la tension aux bornes de la lampe">
        <Fil pts={[[60, 94], [60, 50], [130, 50]]}/><Fil pts={[[146, 50], [260, 50], [260, 170], [60, 170], [60, 114]]}/>
        <Pile x={60} y={104}/>
        <Lampe x={138} y={50} nom="L"/>
        {reponse
          ? <g><Fil pts={[[110, 50], [110, 100], [138, 100]]} c={VERT}/><Fil pts={[[166, 50], [166, 100], [152, 100]]} c={VERT}/><Metre x={138} y={100} lettre="V" couleur={VERT}/>
            <circle cx="110" cy="50" r="3.5" fill={VERT}/><circle cx="166" cy="50" r="3.5" fill={VERT}/>
            <text x="200" y="104" fontSize="13" fontWeight="700" fill={VERT}>en dérivation</text></g>
          : <g><Metre x={300} y={110} lettre="V" couleur={ORANGE}/><text x="300" y="150" fontSize="13" fontWeight="700" fill={ORANGE} textAnchor="middle">voltmètre à brancher</text></g>}
      </svg>
    </div>);
}

function Circuit({ montage = 'serie', ...p }) {
  if (montage === 'derivation') return <CircuitDerivation {...p}/>;
  if (montage === 'voltmetre') return <CircuitVoltmetre {...p}/>;
  return <CircuitSerie {...p}/>;
}

// ── Optique ──
// Repère : la surface (miroir ou dioptre) est horizontale à y = 110, la normale verticale en x = 180. Un angle est compté depuis la normale.
const Rayon = ({ x1, y1, x2, y2, c = ORANGE, id, dash }) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="2.6" markerEnd={id ? `url(#${id})` : undefined} strokeDasharray={dash}/>;
const Arc = ({ cx, cy, r, a0, a1, c, txt, tx, ty }) => {   // arc de cercle entre les directions a0 et a1 (degrés, 0 = vers le haut, positif vers la droite)
  const p = a => [cx + r * Math.sin(a * RAD), cy - r * Math.cos(a * RAD)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return <g><path d={`M${x0},${y0} A${r},${r} 0 0 ${a1 > a0 ? 1 : 0} ${x1},${y1}`} fill="none" stroke={c} strokeWidth="1.8"/>{txt && <text x={tx} y={ty} fontSize="13" fontWeight="700" fill={c}>{txt}</text>}</g>;
};
const fr = x => String(x).replace('.', ',');

function Miroir({ i = 30, reponse = false, angleReponse }) {
  const u = useId().replace(/:/g, '');
  const L = 110, x0 = 180, y0 = 110;
  const xi = x0 - L * Math.sin(i * RAD), yi = y0 - L * Math.cos(i * RAD);
  const xr = x0 + L * Math.sin(i * RAD), yr = y0 - L * Math.cos(i * RAD);
  return (
    <div style={boite} data-schema="miroir">
      <svg viewBox="0 0 360 170" style={svgStyle} role="img" aria-label={`Un rayon arrive sur un miroir plan avec un angle d’incidence de ${i} degrés`}>
        <defs><Pointe id={`${u}r`} c={ORANGE}/><Pointe id={`${u}v`} c={VERT}/></defs>
        <line x1="40" y1={y0} x2="320" y2={y0} stroke={TR} strokeWidth="3"/>
        {Array.from({ length: 15 }, (_, k) => <line key={k} x1={48 + k * 19} y1={y0} x2={40 + k * 19} y2={y0 + 12} stroke={TR} strokeWidth="1.6"/>)}
        <text x="324" y={y0 + 16} fontSize="12.5" fill={TR}>miroir</text>
        <line x1={x0} y1={y0} x2={x0} y2="10" stroke={GRIS} strokeWidth="1.6" strokeDasharray="5 4"/><text x={x0 + 5} y="16" fontSize="12.5" fill="#64748b">normale</text>
        <Rayon x1={xi} y1={yi} x2={x0 - 4 * Math.sin(i * RAD)} y2={y0 - 4 * Math.cos(i * RAD)} id={`${u}r`}/>
        <Arc cx={x0} cy={y0} r={42} a0={0} a1={-i} c={ORANGE} txt={`i = ${i}°`} tx={x0 - 78} ty={y0 - 52}/>
        {reponse
          ? <g><Rayon x1={x0} y1={y0} x2={xr} y2={yr} c={VERT} id={`${u}v`}/><Arc cx={x0} cy={y0} r={56} a0={0} a1={i} c={VERT} txt={`r = ${angleReponse ?? i}°`} tx={x0 + 62} ty={y0 - 62}/></g>
          : <g><Rayon x1={x0} y1={y0} x2={xr} y2={yr} c={GRIS} dash="6 5"/><text x={x0 + 62} y={y0 - 62} fontSize="13" fontWeight="700" fill={GRIS}>r = ?</text></g>}
      </svg>
    </div>);
}

function Dioptre({ n1 = 1.0, n2 = 1.33, i = 45, reponse = false }) {
  const u = useId().replace(/:/g, '');
  const x0 = 180, y0 = 100, L = 100;
  const s = n1 * Math.sin(i * RAD) / n2, totale = s > 1, r = totale ? null : Math.asin(s) / RAD;
  const xi = x0 - L * Math.sin(i * RAD), yi = y0 - L * Math.cos(i * RAD);
  const dense = n2 > n1 ? 'bas' : 'haut';
  const fmtn = n => fr(n.toFixed(2));
  return (
    <div style={boite} data-schema="dioptre">
      <svg viewBox="0 0 360 200" style={svgStyle} role="img" aria-label={`Un rayon passe d’un milieu d’indice ${fmtn(n1)} à un milieu d’indice ${fmtn(n2)} avec un angle d’incidence de ${i} degrés`}>
        <defs><Pointe id={`${u}r`} c={ORANGE}/><Pointe id={`${u}v`} c={VERT}/></defs>
        <rect x="30" y={y0} width="300" height="90" fill="#dbeafe" opacity={dense === 'bas' ? 0.9 : 0.45}/>
        <rect x="30" y="10" width="300" height={y0 - 10} fill="#dbeafe" opacity={dense === 'haut' ? 0.9 : 0.12}/>
        <line x1="30" y1={y0} x2="330" y2={y0} stroke={TR} strokeWidth="2"/>
        <text x="36" y="26" fontSize="13" fontWeight="700" fill={TR}>milieu 1 : <Ind b="n" i="1"/>= {fmtn(n1)}</text>
        <text x="36" y="190" fontSize="13" fontWeight="700" fill={TR}>milieu 2 : <Ind b="n" i="2"/>= {fmtn(n2)}</text>
        <line x1={x0} y1="30" x2={x0} y2="180" stroke={GRIS} strokeWidth="1.6" strokeDasharray="5 4"/><text x={x0 + 5} y="44" fontSize="12.5" fill="#64748b">normale</text>
        {i === 0
          ? <Rayon x1={x0 - 0.01} y1="40" x2={x0 - 0.01} y2={y0 - 4} id={`${u}r`}/>
          : <><Rayon x1={xi} y1={yi} x2={x0 - 4 * Math.sin(i * RAD)} y2={y0 - 4 * Math.cos(i * RAD)} id={`${u}r`}/>
            <Arc cx={x0} cy={y0} r={40} a0={0} a1={-i} c={ORANGE} txt={`i = ${i}°`} tx={x0 - 100} ty={y0 - 30}/></>}
        {reponse
          ? (totale
            ? <Rayon x1={x0} y1={y0} x2={x0 + L * Math.sin(i * RAD)} y2={y0 - L * Math.cos(i * RAD)} c={VERT} id={`${u}v`}/>
            : <Rayon x1={x0} y1={y0} x2={x0 + L * Math.sin(r * RAD)} y2={y0 + L * Math.cos(r * RAD)} c={VERT} id={`${u}v`}/>)
          : <text x={x0 + 10} y={y0 + 40} fontSize="13" fontWeight="700" fill="#475569">rayon dans le milieu 2 : ?</text>}
      </svg>
    </div>);
}

// Lentille mince convergente : axe optique horizontal, centre optique O en (180, 100), foyers F et F′ à ±f = 90
function Lentille({ cas = 'parallele', f = '', reponse = false }) {
  const u = useId().replace(/:/g, '');
  const O = [180, 100], F = 90;
  const lentille = (
    <g>
      <path d={`M${O[0]},30 Q${O[0] + 24},${O[1]} ${O[0]},170 Q${O[0] - 24},${O[1]} ${O[0]},30 Z`} fill="#e0f2fe" stroke={TR} strokeWidth="2.2"/>
      <line x1="20" y1={O[1]} x2="340" y2={O[1]} stroke={GRIS} strokeWidth="1.6"/>
      <text x={O[0] - 4} y={O[1] + 16} fontSize="13" fontWeight="700" fill={TR} textAnchor="end">O</text>
      {[[O[0] - F, 'F'], [O[0] + F, 'F′']].map(([x, t]) => <g key={t}><line x1={x} y1={O[1] - 5} x2={x} y2={O[1] + 5} stroke={TR} strokeWidth="2"/><text x={x} y={O[1] + 20} fontSize="13" fontWeight="700" fill={TR} textAnchor="middle">{t}</text></g>)}
      {f && <text x={O[0] + F + 40} y={O[1] + 44} fontSize="12" fill="#475569" textAnchor="middle">OF′ = f′ = {f}</text>}
    </g>);
  let rayons = null, note = null;
  if (cas === 'parallele') {
    const ys = [60, 80, 120, 140];
    rayons = (
      <g>
        {ys.map(y => <Rayon key={y} x1={30} y1={y} x2={O[0] - 4} y2={y} id={`${u}r`}/>)}
        {reponse && ys.map(y => <Rayon key={'a' + y} x1={O[0] + 4} y1={y} x2={O[0] + 1.45 * F} y2={y + (O[1] - y) * 1.45} c={VERT} id={`${u}v`}/>)}
      </g>);
    note = reponse ? null : <text x="250" y="60" fontSize="13" fontWeight="700" fill="#475569">après la lentille : ?</text>;
  } else if (cas === 'centre') {
    const a = 22 * RAD, dx = 130, dy = Math.tan(a) * dx;
    rayons = (
      <g>
        <Rayon x1={O[0] - dx} y1={O[1] + dy} x2={O[0] - 3} y2={O[1] + 1} id={`${u}r`}/>
        {reponse ? <Rayon x1={O[0] + 3} y1={O[1] - 1} x2={O[0] + dx} y2={O[1] - dy} c={VERT} id={`${u}v`}/> : <text x="250" y="60" fontSize="13" fontWeight="700" fill="#475569">après la lentille : ?</text>}
      </g>);
  } else {   // infini : objet très éloigné
    rayons = (
      <g>
        <text x="26" y="40" fontSize="12.5" fill="#475569">objet très éloigné</text>
        {[70, 100, 130].map((y, k) => <Rayon key={y} x1={30} y1={y - (k - 1) * 8} x2={O[0] - 4} y2={y - (k - 1) * 4} id={`${u}r`}/>)}
        <line x1={O[0] + F} y1="40" x2={O[0] + F} y2="165" stroke={reponse ? VERT : GRIS} strokeWidth="1.8" strokeDasharray="5 4"/>
        {reponse ? <text x={O[0] + F - 40} y="34" fontSize="12.5" fontWeight="700" fill={VERT}>plan focal image</text> : <text x={O[0] + F + 6} y="34" fontSize="13" fontWeight="700" fill="#475569">image : ?</text>}
      </g>);
  }
  return (
    <div style={boite} data-schema={`lentille-${cas}`}>
      <svg viewBox="0 0 360 190" style={svgStyle} role="img" aria-label="Lentille mince convergente avec son axe optique, son centre optique O et ses foyers F et F′">
        <defs><Pointe id={`${u}r`} c={ORANGE}/><Pointe id={`${u}v`} c={VERT}/></defs>
        {lentille}{rayons}{note}
      </svg>
    </div>);
}

function Optique({ cas = 'miroir', ...p }) {
  if (cas === 'dioptre') return <Dioptre {...p}/>;
  if (cas === 'miroir') return <Miroir {...p}/>;
  return <Lentille cas={cas.replace('lentille-', '')} {...p}/>;
}

export const DESSINS_SECONDE = { circuit: Circuit, optique: Optique };
