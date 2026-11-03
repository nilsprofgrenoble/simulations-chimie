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


// ── Mouvements et forces ──
// cas : 'manege-sol' | 'manege-ref' | 'train-ref' | 'train-quai' | 'valve' | 'pente' | 'virage'
// Avant la correction, on montre la situation (objets, observateur) ; après, la trajectoire ou la force.
function Mouvement({ cas = 'manege-sol', reponse = false }) {
  const u = useId().replace(/:/g, '');
  const defs = <defs><Pointe id={`${u}r`} c={ORANGE}/><Pointe id={`${u}v`} c={VERT}/><Pointe id={`${u}t`} c={TR}/></defs>;
  const Etiq = ({ x, y, t, c = '#475569', a = 'middle', g }) => <text x={x} y={y} fontSize="12.5" fontWeight={g ? 700 : 400} fill={c} textAnchor={a}>{t}</text>;
  const Bonhomme = ({ x, y, c = TR }) => <g stroke={c} strokeWidth="2" fill="none"><circle cx={x} cy={y - 16} r="5"/><line x1={x} y1={y - 11} x2={x} y2={y + 4}/><line x1={x - 7} y1={y - 5} x2={x + 7} y2={y - 5}/><line x1={x} y1={y + 4} x2={x - 5} y2={y + 14}/><line x1={x} y1={y + 4} x2={x + 5} y2={y + 14}/></g>;
  let corps = null, label = '';
  if (cas === 'manege-sol' || cas === 'manege-ref') {
    const C = [180, 90], R = 58, pos = a => [C[0] + R * Math.sin(a * RAD), C[1] - R * Math.cos(a * RAD)];
    const [ex, ey] = pos(50);
    label = 'Vue de dessus d’un manège qui tourne, avec un enfant sur un cheval de bois';
    corps = (<g>
      <circle cx={C[0]} cy={C[1]} r={R + 14} fill="#f1f5f9" stroke={TR} strokeWidth="2"/><circle cx={C[0]} cy={C[1]} r="4" fill={TR}/>
      <Etiq x={C[0]} y={C[1] + 18} t="axe" a="middle"/>
      <circle cx={ex} cy={ey} r="8" fill={BLEU} stroke="white" strokeWidth="1.5"/><Etiq x={ex + 14} y={ey - 6} t="enfant" c={BLEU} a="start" g/>
      <path d={`M${C[0] - 40},${C[1] - R - 22} A${R + 22},${R + 22} 0 0 1 ${C[0] + 10},${C[1] - R - 24}`} fill="none" stroke={GRIS} strokeWidth="1.8" markerEnd={`url(#${u}t)`}/>
      <Etiq x={C[0] - 52} y={C[1] - R - 14} t="le manège tourne" a="end"/>
      {cas === 'manege-sol'
        ? <g><Bonhomme x={50} y={150}/><Etiq x={50} y={182} t="observateur au sol" g/>
          {reponse && <g><circle cx={C[0]} cy={C[1]} r={R} fill="none" stroke={VERT} strokeWidth="2.2" strokeDasharray="6 4"/>
            {[50, 170, 290].map(a => { const [x, y] = pos(a); const dx = Math.cos(a * RAD), dy = Math.sin(a * RAD); return <Rayon key={a} x1={x} y1={y} x2={x + 26 * dx} y2={y + 26 * dy} c={VERT} id={`${u}v`}/>; })}
            <Etiq x="354" y="168" t="trajectoire : cercle" c={VERT} g a="end"/><Etiq x="354" y="184" t="vitesse tangente, valeur constante" c={VERT} a="end"/></g>}</g>
        : <g><rect x={ex + 8} y={ey + 6} width="13" height="13" rx="2" fill="white" stroke={TR} strokeWidth="2"/><Etiq x="354" y="176" t="observateur sur le manège" a="end" g/>
          {reponse && <Etiq x="8" y="186" a="start" t="l’enfant reste au même endroit : immobile (v = 0)" c={VERT} g/>}</g>}
    </g>);
  } else if (cas === 'train-ref' || cas === 'train-quai') {
    label = 'Un train roule vers la droite ; un passager lâche une balle';
    const quai = cas === 'train-quai';
    corps = (<g>
      <line x1="10" y1="160" x2="350" y2="160" stroke={TR} strokeWidth="3"/>
      <rect x="90" y="60" width="190" height="85" rx="8" fill="#e0f2fe" stroke={TR} strokeWidth="2.2"/>
      <rect x="110" y="75" width="40" height="30" fill="white" stroke={TR} strokeWidth="1.6"/><rect x="215" y="75" width="40" height="30" fill="white" stroke={TR} strokeWidth="1.6"/>
      <circle cx="120" cy="150" r="9" fill={TR}/><circle cx="250" cy="150" r="9" fill={TR}/>
      <Fleche x1={290} y1={100} x2={335} y2={100} c={GRIS} id={`${u}t`}/><Etiq x="312" y="92" t="train" a="middle"/>
      <circle cx="172" cy="82" r="6" fill={ORANGE} stroke="white" strokeWidth="1.5"/><Etiq x="172" y="70" t="balle lâchée" c={ORANGE} g/>
      {quai ? <g><Bonhomme x={40} y={140} /><Etiq x="40" y="178" t="observateur sur le quai" a="start" g/></g> : <g><Bonhomme x={236} y={128}/><Etiq x="180" y="182" t="observateur dans le train" g/></g>}
      {reponse && (quai
        ? <g><path d="M172,82 Q235,95 285,145" fill="none" stroke={VERT} strokeWidth="2.6" strokeDasharray="6 4" markerEnd={`url(#${u}v)`}/><Etiq x="296" y="30" t="trajectoire : arc de parabole" c={VERT} g a="end"/></g>
        : <g><Rayon x1={172} y1={88} x2={172} y2={140} c={VERT} id={`${u}v`} dash="6 4"/><Etiq x="296" y="30" t="trajectoire : droite verticale" c={VERT} g a="end"/></g>)}
    </g>);
  } else if (cas === 'valve') {
    label = 'Un vélo roule vers la droite ; une valve est fixée sur la roue avant';
    const c = [180, 100], R = 50;
    corps = (<g>
      <line x1="10" y1="152" x2="350" y2="152" stroke={TR} strokeWidth="3"/>
      <circle cx={c[0]} cy={c[1]} r={R} fill="none" stroke={TR} strokeWidth="3"/><circle cx={c[0]} cy={c[1]} r="5" fill={TR}/>
      <line x1={c[0]} y1={c[1]} x2={c[0] - 20} y2="30" stroke={TR} strokeWidth="3"/><Etiq x={c[0] - 24} y="22" t="cadre" a="end" g/>
      <circle cx={c[0] + R * 0.7} cy={c[1] - R * 0.7} r="6" fill={ORANGE}/><Etiq x={c[0] + R * 0.7 + 12} y={c[1] - R * 0.7 - 6} t="valve" c={ORANGE} a="start" g/>
      <Fleche x1={270} y1={60} x2={330} y2={60} c={GRIS} id={`${u}t`}/><Etiq x="300" y="52" t="le vélo avance"/>
      <Etiq x="180" y="178" t="on se place dans le référentiel du cadre"/>
      {reponse && <g><circle cx={c[0]} cy={c[1]} r={R} fill="none" stroke={VERT} strokeWidth="2.6" strokeDasharray="6 4"/><Etiq x="8" y="96" t="trajectoire : cercle" c={VERT} g a="start"/><Etiq x="8" y="112" t="centré sur l’axe" c={VERT} a="start"/></g>}
    </g>);
  } else if (cas === 'pente') {
    label = 'Une caisse posée sur un plan incliné';
    const a = 28 * RAD, x0 = 40, y0 = 150, L = 280, x1 = x0 + L, y1 = y0 - Math.tan(a) * L;
    const cx = 190, cy = y0 - (cx - x0) * Math.tan(a);
    corps = (<g>
      <polygon points={`${x0},${y0} ${x1},${y0} ${x1},${y1}`} fill="#f1f5f9" stroke={TR} strokeWidth="2.2"/>
      <g transform={`translate(${cx} ${cy}) rotate(${-28})`}><rect x="-26" y="-34" width="52" height="34" fill="#fde68a" stroke={TR} strokeWidth="2.2"/></g>
      <Etiq x="62" y="143" t="pente" a="start"/><Etiq x="150" y="178" t="sol horizontal" a="middle"/>
      <circle cx={cx - 8} cy={cy - 24} r="3.5" fill={ORANGE}/><Etiq x={cx - 16} y={cy - 32} t="centre de la caisse" c={ORANGE} a="end" g/>
      {reponse && <g><Rayon x1={cx - 8} y1={cy - 24} x2={cx - 8} y2={cy + 40} c={VERT} id={`${u}v`}/><Etiq x={cx - 14} y={cy + 52} t="poids P : vertical, vers le bas" c={VERT} g a="end"/></g>}
    </g>);
  } else {   // virage
    label = 'Vue de dessus : une voiture dans un virage circulaire à vitesse constante';
    const C = [110, 150], R = 100, pos = a => [C[0] + R * Math.cos(a * RAD), C[1] - R * Math.sin(a * RAD)];
    corps = (<g>
      <path d={`M${pos(0)[0]},${pos(0)[1]} A${R},${R} 0 0 0 ${pos(90)[0]},${pos(90)[1]}`} fill="none" stroke="#cbd5e1" strokeWidth="26"/>
      <path d={`M${pos(0)[0]},${pos(0)[1]} A${R},${R} 0 0 0 ${pos(90)[0]},${pos(90)[1]}`} fill="none" stroke={TR} strokeWidth="1.6" strokeDasharray="8 6"/>
      {[8, 45, 82].map(a => { const [x, y] = pos(a); return <g key={a}><rect x={x - 9} y={y - 9} width="18" height="18" rx="4" fill={BLEU} stroke="white" strokeWidth="1.5" transform={`rotate(${-(90 - a)} ${x} ${y})`}/>
        {reponse && <Rayon x1={x} y1={y} x2={x - 40 * Math.sin(a * RAD)} y2={y - 40 * Math.cos(a * RAD)} c={VERT} id={`${u}v`}/>}</g>; })}
      <Etiq x="232" y="40" t="voiture à 3 instants" c={BLEU} g a="start"/><Etiq x="232" y="58" t="50 km·h⁻¹ constants" a="start"/>
      {reponse && <Etiq x="232" y="90" t="même valeur, mais" c={VERT} g a="start"/>}{reponse && <Etiq x="232" y="106" t="direction qui change" c={VERT} g a="start"/>}
    </g>);
  }
  return (
    <div style={boite} data-schema={`mouvement-${cas}`}>
      <svg viewBox="0 0 360 190" style={svgStyle} role="img" aria-label={label}>{defs}{corps}</svg>
    </div>);
}

// ── Circuit à deux résistors en série (loi des mailles) ──
function CircuitMailles({ tension = '12 V', u1 = '4 V', u2 = '?', reponse = false }) {
  const Res = ({ x, y, nom }) => <g><rect x={x - 22} y={y - 9} width="44" height="18" fill="white" stroke={TR} strokeWidth="2.2"/><text x={x} y={y - 15} fontSize="13" fontWeight="700" fill={TR} textAnchor="middle"><Ind b={nom[0]} i={nom.slice(1)}/></text></g>;
  return (
    <div style={boite} data-schema="circuit-mailles">
      <svg viewBox="0 0 360 200" style={svgStyle} role="img" aria-label="Un générateur de 12 volts et deux résistors R1 et R2 en série ; la tension aux bornes de R2 est à trouver">
        <Fil pts={[[60, 94], [60, 50], [118, 50]]}/><Fil pts={[[162, 50], [208, 50]]}/><Fil pts={[[252, 50], [320, 50], [320, 160], [60, 160], [60, 114]]}/>
        <Pile x={60} y={104} v={tension}/>
        <Res x={140} y={50} nom="R1"/><Res x={230} y={50} nom="R2"/>
        <text x="140" y="90" fontSize="13" fontWeight="700" fill={BLEU} textAnchor="middle"><Ind b="U" i="1"/> = {u1}</text>
        <text x="230" y="90" fontSize="13" fontWeight="700" fill={reponse ? VERT : ORANGE} textAnchor="middle"><Ind b="U" i="2"/> = {reponse ? '8 V' : u2}</text>
        <text x="190" y="186" fontSize="12" fill="#64748b" textAnchor="middle">les deux résistors sont dans la même maille que le générateur</text>
      </svg>
    </div>);
}

// ── Molécule d’eau ──
function Molecule({ reponse = false }) {
  const u = useId().replace(/:/g, '');
  return (
    <div style={boite} data-schema="molecule-eau">
      <svg viewBox="0 0 360 190" style={svgStyle} role="img" aria-label="Molécule d’eau coudée : un atome d’oxygène lié à deux atomes d’hydrogène">
        <defs><Pointe id={`${u}v`} c={VERT}/></defs>
        <line x1="180" y1="70" x2="125" y2="125" stroke={TR} strokeWidth="3"/><line x1="180" y1="70" x2="235" y2="125" stroke={TR} strokeWidth="3"/>
        <circle cx="180" cy="70" r="22" fill="#fecaca" stroke={TR} strokeWidth="2.2"/><text x="180" y="76" fontSize="16" fontWeight="800" fill={TR} textAnchor="middle">O</text>
        {[125, 235].map(x => <g key={x}><circle cx={x} cy="125" r="14" fill="#e2e8f0" stroke={TR} strokeWidth="2.2"/><text x={x} y="130" fontSize="14" fontWeight="800" fill={TR} textAnchor="middle">H</text></g>)}
        <text x="180" y="22" fontSize="12.5" fill="#475569" textAnchor="middle">O plus électronégatif que H</text>
        {reponse
          ? <g><text x="214" y="52" fontSize="15" fontWeight="800" fill={VERT}>δ−</text><text x="86" y="140" fontSize="15" fontWeight="800" fill={VERT}>δ+</text><text x="256" y="140" fontSize="15" fontWeight="800" fill={VERT}>δ+</text>
            <Rayon x1={180} y1={170} x2={180} y2={108} c={VERT} id={`${u}v`}/><text x="190" y="165" fontSize="12.5" fontWeight="700" fill={VERT}>moment dipolaire</text></g>
          : <text x="180" y="170" fontSize="13" fontWeight="700" fill="#475569" textAnchor="middle">charges partielles : ?</text>}
      </svg>
    </div>);
}

// ── Ampoule à décanter ──
function Ampoule({ reponse = false }) {
  const u = useId().replace(/:/g, '');
  const corps = 'M172,40 L188,40 L188,52 C240,66 252,110 232,138 C222,152 200,158 188,164 L188,176 L172,176 L172,164 C160,158 138,152 128,138 C108,110 120,66 172,52 Z';
  return (
    <div style={boite} data-schema="ampoule">
      <svg viewBox="0 0 360 190" style={svgStyle} role="img" aria-label="Ampoule à décanter contenant deux phases non miscibles après repos">
        <defs><clipPath id={`${u}c`}><path d={corps}/></clipPath></defs>
        <g clipPath={`url(#${u}c)`}><rect x="100" y="40" width="160" height="62" fill={reponse ? '#ddd6fe' : '#f1f5f9'}/><rect x="100" y="102" width="160" height="80" fill={reponse ? '#bfdbfe' : '#e2e8f0'}/></g>
        <path d={corps} fill="none" stroke={TR} strokeWidth="2.4"/><rect x="170" y="28" width="20" height="12" fill="white" stroke={TR} strokeWidth="2"/><line x1="165" y1="170" x2="195" y2="170" stroke={TR} strokeWidth="3"/>
        <line x1="120" y1="102" x2="240" y2="102" stroke={TR} strokeWidth="1.4" strokeDasharray="4 3"/>
        {reponse
          ? <g><text x="252" y="64" fontSize="12.5" fontWeight="700" fill="#6d28d9">cyclohexane</text><text x="252" y="80" fontSize="12.5" fontWeight="700" fill="#6d28d9">+ diiode</text><text x="252" y="96" fontSize="12.5" fill="#6d28d9">ρ = 0,78 g·mL⁻¹</text><text x="252" y="132" fontSize="12.5" fontWeight="700" fill={BLEU}>eau</text><text x="252" y="148" fontSize="12.5" fill={BLEU}>ρ = 1,00 g·mL⁻¹</text></g>
          : <g><text x="252" y="78" fontSize="13" fontWeight="700" fill="#475569">phase du haut : ?</text><text x="252" y="132" fontSize="13" fontWeight="700" fill="#475569">phase du bas : ?</text></g>}
        <text x="100" y="20" fontSize="12.5" fill="#475569" textAnchor="start">après décantation</text>
      </svg>
    </div>);
}

// ── Mailles cristallines (projection oblique) ──
// cas : 'cfc' | 'cc' | 'contact' (CFC, direction de contact) | 'octa' (sites octaédriques du CFC) ; reponse : ajoute ce qui donne la réponse
function Maille({ cas = 'cfc', reponse = false }) {
  const S = 95, ox = 26, oy = 160;
  const P = ([x, y, z]) => [ox + S * (x + 0.5 * z), oy - S * (y + 0.32 * z)];
  const som = []; for (const x of [0, 1]) for (const y of [0, 1]) for (const z of [0, 1]) som.push([x, y, z]);
  const faces = [[.5, .5, 0], [.5, .5, 1], [0, .5, .5], [1, .5, .5], [.5, 0, .5], [.5, 1, .5]];
  const aretes = []; for (const a of [0, 1]) for (const b of [0, 1]) { aretes.push([.5, a, b], [a, .5, b], [a, b, .5]); }
  const arr = (...pts) => pts.map(P).map(q => q.join(',')).join(' ');
  const cube = (
    <g fill="none" stroke={TR} strokeWidth="1.6">
      <polyline points={arr([0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1])} strokeDasharray="4 4" stroke={GRIS}/>
      <polyline points={arr([0, 0, 0], [0, 0, 1])} strokeDasharray="4 4" stroke={GRIS}/><polyline points={arr([1, 0, 0], [1, 0, 1])}/><polyline points={arr([1, 1, 0], [1, 1, 1])}/><polyline points={arr([0, 1, 0], [0, 1, 1])}/>
      <polyline points={arr([0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 0])} strokeWidth="2.2"/>
    </g>);
  const atome = (pt, k, c = BLEU, r = 10) => { const [x, y] = P(pt); return <circle key={k} cx={x} cy={y} r={r} fill={c} fillOpacity="0.75" stroke="white" strokeWidth="1.5"/>; };
  const site = (pt, k) => { const [x, y] = P(pt); return <rect key={k} x={x - 6} y={y - 6} width="12" height="12" fill={ORANGE} stroke="white" strokeWidth="1.4"/>; };
  let at = som.map((q, k) => atome(q, 's' + k, BLEU, cas === 'octa' ? 7 : 10)), txt = null, extra = null, label = '';
  if (cas === 'cfc') { at = at.concat(faces.map((q, k) => atome(q, 'f' + k, '#0ea5e9'))); label = 'Maille cubique à faces centrées : atomes aux sommets et au centre des faces'; if (reponse) txt = ['8 sommets × 1/8 = 1', '6 faces × 1/2 = 3', 'total : 4 atomes par maille']; }
  if (cas === 'cc') { at.push(atome([.5, .5, .5], 'c', '#0ea5e9')); label = 'Maille cubique centrée : atomes aux sommets et au centre du cube'; if (reponse) txt = ['8 sommets × 1/8 = 1', 'centre : 1 atome entier', 'total : 2 atomes par maille']; }
  if (cas === 'contact') {
    at = at.concat(faces.map((q, k) => atome(q, 'f' + k, '#0ea5e9'))); label = 'Maille CFC de paramètre a : trois directions possibles pour le contact entre atomes';
    const a0 = P([0, 0, 0]), a1 = P([1, 1, 0]), g0 = P([0, 0, 0]), g1 = P([1, 1, 1]), e1 = P([1, 0, 0]);
    extra = reponse
      ? <g><line x1={a0[0]} y1={a0[1]} x2={a1[0]} y2={a1[1]} stroke={VERT} strokeWidth="3.4"/><text x="192" y="70" fontSize="12.5" fontWeight="700" fill={VERT}>contact : diagonale</text><text x="192" y="88" fontSize="12.5" fontWeight="700" fill={VERT}>d’une face, a√2 = 4R</text></g>
      : <g><text x="192" y="70" fontSize="12.5" fill="#475569">contact le long de l’arête,</text><text x="192" y="88" fontSize="12.5" fill="#475569">d’une diagonale de face</text><text x="192" y="106" fontSize="12.5" fill="#475569">ou de la grande diagonale ?</text></g>;
  }
  if (cas === 'octa') { at = at.concat(faces.map((q, k) => atome(q, 'f' + k, '#93c5fd', 7))); extra = <g>{site([.5, .5, .5], 'sc')}{aretes.map((q, k) => site(q, 'a' + k))}</g>; label = 'Maille CFC : sites octaédriques (carrés orange) au centre du cube et au milieu des 12 arêtes'; if (reponse) txt = ['centre : 1', '12 arêtes × 1/4 = 3', 'total : 4 sites par maille']; }
  return (
    <div style={boite} data-schema={`maille-${cas}`}>
      <svg viewBox="0 0 360 190" style={svgStyle} role="img" aria-label={label}>
        {cube}{at}{extra}
        {txt && <g>{txt.map((t, k) => <text key={k} x="192" y={90 + 18 * k} fontSize="12.5" fontWeight={k === 2 ? 800 : 500} fill={VERT}>{t}</text>)}</g>}
        {cas === 'cfc' && !reponse && <text x="192" y="90" fontSize="12.5" fill="#475569"><tspan fill={BLEU}>●</tspan> sommets</text>}{cas === 'cfc' && !reponse && <text x="192" y="108" fontSize="12.5" fill="#475569"><tspan fill="#0ea5e9">●</tspan> centres des faces</text>}
        {cas === 'octa' && !reponse && <text x="192" y="90" fontSize="12.5" fill="#475569"><tspan fill={ORANGE}>■</tspan> sites octaédriques</text>}
      </svg>
    </div>);
}

// ── Taille des sites : droite graduée en rayon de l’atome inséré (en R) ──
function EchelleSites({ rayon = 0.30, reponse = false }) {
  const X = v => 30 + v * 600;   // 0 à 0,5 R → 30 à 330
  return (
    <div style={boite} data-schema="echelle-sites">
      <svg viewBox="0 0 360 150" style={svgStyle} role="img" aria-label="Droite graduée du rayon maximal de l’atome inséré : 0,225 R pour un site tétraédrique, 0,414 R pour un site octaédrique">
        <rect x={X(0)} y="60" width={X(0.225) - X(0)} height="22" fill="#bbf7d0" stroke={TR}/><rect x={X(0.225)} y="60" width={X(0.414) - X(0.225)} height="22" fill="#fed7aa" stroke={TR}/>
        <text x={(X(0) + X(0.225)) / 2} y="75" fontSize="11.5" textAnchor="middle" fill={TR}>tétraédrique</text><text x={(X(0.225) + X(0.414)) / 2} y="75" fontSize="11.5" textAnchor="middle" fill={TR}>octaédrique</text>
        <line x1={X(0)} y1="100" x2={X(0.5)} y2="100" stroke={TR} strokeWidth="2"/>
        {[[0, '0'], [0.225, '0,225 R'], [0.414, '0,414 R']].map(([v, t]) => <g key={v}><line x1={X(v)} y1="94" x2={X(v)} y2="106" stroke={TR} strokeWidth="2"/><text x={X(v)} y="122" fontSize="12.5" fontWeight="700" fill={TR} textAnchor="middle">{t}</text></g>)}
        <text x="180" y="30" fontSize="12.5" fill="#475569" textAnchor="middle">rayon maximal de l’atome qui peut s’insérer</text>
        {reponse && <g><line x1={X(rayon)} y1="40" x2={X(rayon)} y2="100" stroke={VERT} strokeWidth="2.6" strokeDasharray="5 3"/><text x={X(rayon)} y="140" fontSize="12.5" fontWeight="800" fill={VERT} textAnchor="middle">atome à insérer : 0,30 R</text></g>}
      </svg>
    </div>);
}

export const DESSINS_SECONDE = { circuit: Circuit, optique: Optique, mouvement: Mouvement, mailles: CircuitMailles, molecule: Molecule, ampoule: Ampoule, maille: Maille, echelleSites: EchelleSites };
