// Scènes et dessins de la simulation 158 (Savons et amphiphilie) : formule semi-développée colorée, tubes à essais,
// interface eau/air, micelle, lavage d'une salissure. Couleurs : bleu = tête polaire (hydrophile), orange = chaîne apolaire (lipophile).
import { C, alea } from "./savonCouleurs";
import * as M from "./savonModele";

const stl = (maxWidth = 480) => ({ display: 'block', width: '100%', maxWidth, height: 'auto', margin: '0 auto', background: 'white', borderRadius: 12, border: '1px solid #d5dfeb' });

// ---------- formule semi-développée en texte, avec les deux parties colorées ----------
export function FormuleSemi({ e, colore = true, taille = 19 }) {
  return (
    <span style={{ fontSize: taille, fontWeight: 700, overflowWrap: 'anywhere', color: C.encre }}>
      <span style={{ color: colore ? C.queue : C.encre }}>{e.chaine}</span>
      <span style={{ color: colore ? C.tete : C.encre }}>{e.teteTxt}</span>
      {e.contre && <span style={{ color: C.gris, fontWeight: 600 }}> {e.contre}</span>}
    </span>);
}

// ---------- ion ou molécule amphiphile schématique : tête ronde (origine) et queue ondulée vers le haut (-y) ----------
export function Ion({ x, y, ang = 0, L = 22, neutre = false, r = 5.4 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${ang})`}>
      <path d={L > 16 ? `M0 ${-r + 1} q3.4 ${-L / 4} 0 ${-L / 2} t0 ${-L / 2}` : `M0 ${-r + 1} L0 ${-L}`} fill="none" stroke={C.queue} strokeWidth="2.4" strokeLinecap="round"/>
      <circle cx="0" cy="0" r={r} fill={neutre ? 'white' : C.tete} stroke={neutre ? C.tete : 'white'} strokeWidth={neutre ? 2 : 0.8}/>
    </g>);
}
// ion placé à l'angle th (degrés, repère écran) autour de (cx, cy), à la distance R : tête sur le cercle, queue vers l'intérieur (vers = 'centre') ou vers l'extérieur
export function IonCercle({ cx, cy, R, th, vers = 'centre', L = 18, r }) {
  const a = (th * Math.PI) / 180, x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
  return <Ion x={x} y={y} ang={vers === 'centre' ? th - 90 : th + 90} L={L} r={r}/>;
}

// ---------- micelle : têtes à l'extérieur, chaînes au centre (coeur éventuellement rempli de salissure) ----------
export function Micelle({ cx, cy, R = 27, n = 12, L = 17, coeur = 0, decal = 0 }) {
  return (
    <g>
      {coeur > 0 && <circle cx={cx} cy={cy} r={coeur} fill={C.huile} stroke={C.huileBord} strokeWidth="1.2"/>}
      {Array.from({ length: n }, (_, k) => <IonCercle key={k} cx={cx} cy={cy} R={R} th={decal + (360 / n) * k} L={L}/>)}
    </g>);
}

// ---------- formule dessinée en zigzag : chaîne carbonée (orange) et tête (bleu) ----------
// Un sommet par atome de carbone, de la gauche (CH₃) vers la tête. Les liaisons doubles sont tracées en double trait ; la double
// liaison cis (oléate) est tracée à plat, ce qui replie la chaîne du même côté.
export function MoleculeSvg({ e, colore = true, etiquettes = false, maxWidth = 420, aria, nested = false, neutre = false }) {
  const col = (c, k = 'q') => (colore ? (k === 'q' ? C.queue : C.tete) : C.gris);
  const W = 300, dx = 13.2, dy = 9, x0 = 16, lo = 44, hi = lo - dy;
  const H = etiquettes ? 116 : 96;
  const lab = aria || `Formule de ${e.nom} : ${M.semi(e)}`;
  if (e.tete === 'ions') {
    return (
      <svg viewBox={`0 0 ${W} 100`} role="img" aria-label="Chlorure de sodium : un ion sodium Na⁺ et un ion chlorure Cl⁻, sans chaîne carbonée" style={stl(maxWidth)}>
        <circle cx="100" cy="46" r="24" fill="white" stroke={col(0, 't')} strokeWidth="2.4"/><text x="100" y="52" textAnchor="middle" fontSize="16" fontWeight="800" fill={C.encre}>Na⁺</text>
        <circle cx="200" cy="46" r="28" fill="white" stroke={col(0, 't')} strokeWidth="2.4"/><text x="200" y="52" textAnchor="middle" fontSize="16" fontWeight="800" fill={C.encre}>Cl⁻</text>
        {etiquettes && <text x="150" y="92" textAnchor="middle" fontSize="14" fontWeight="700" fill={col(0, 't')}>deux ions, pas de chaîne</text>}
      </svg>);
  }
  const nC = e.chaineC, nV = nC + (e.tete === 'COO-' || e.tete === 'COOH' ? 1 : 0);   // sommets de carbone (chaîne + carbone du groupe carboxyle)
  const ys = [lo];
  for (let i = 1; i < nV; i++) ys.push(e.dbl != null && i === e.dbl + 1 ? ys[i - 1] : (ys[i - 1] === lo ? hi : lo));
  const P = i => [x0 + dx * i, ys[i]];
  const traits = [], textes = [];
  const lien = (p, q, c, double = false, k) => {
    const [x1, y1] = p, [x2, y2] = q, L = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / L, ny = (x2 - x1) / L;
    const d = (o) => <line key={`${k}${o}`} x1={x1 + nx * o} y1={y1 + ny * o} x2={x2 + nx * o} y2={y2 + ny * o} stroke={c} strokeWidth="2.4" strokeLinecap="round"/>;
    traits.push(double ? <g key={k}>{d(-1.9)}{d(1.9)}</g> : d(0));
  };
  const tronque = (p, q, t) => { const L = Math.hypot(q[0] - p[0], q[1] - p[1]); return [p[0] + (q[0] - p[0]) * (1 - t / L), p[1] + (q[1] - p[1]) * (1 - t / L)]; };
  const cQ = col(0, 'q'), cT = col(0, 't');
  // liaisons de la chaîne : sommets 0 … nC-1 (les liaisons entre sommets de chaîne sont orangées)
  for (let i = 0; i < nC - 1; i++) lien(P(i), P(i + 1), cQ, e.dbl === i, `c${i}`);
  // tête
  let xTete = null;
  if (e.tete === 'COO-' || e.tete === 'COOH') {
    const k = nC, [xk, yk] = P(k);
    lien(P(k - 1), P(k), cQ, false, 'jc');            // liaison C–C entre la chaîne et le carbone du groupe carboxyle
    const bas = yk === lo;                               // sommet bas : =O vers le haut à droite, O–H ou O⁻ vers le bas (et inversement)
    const oD = [xk + dx, bas ? hi - 4 : lo + 4], oS = [xk, bas ? lo + 17 : hi - 17];
    lien([xk, yk], tronque([xk, yk], oD, 8), cT, true, 'do'); lien([xk, yk], tronque([xk, yk], oS, 8), cT, false, 'so');
    textes.push(<text key="o1" x={oD[0] + 0.5} y={oD[1] + 5} textAnchor="middle" fontSize="15" fontWeight="800" fill={cT}>O</text>);
    textes.push(<text key="o2" x={oS[0]} y={oS[1] + 5} textAnchor="middle" fontSize="15" fontWeight="800" fill={cT}>{e.tete === 'COO-' ? 'O⁻' : 'OH'}</text>);
    xTete = xk;
  } else if (e.tete === 'OH') {
    const k = nC, x = x0 + dx * k, y = ys[nC - 1] === lo ? hi : lo, ph = [x, y], pl = P(nC - 1);
    lien(pl, tronque(pl, ph, 6), cT, false, 'oh');
    textes.push(<text key="oh" x={x + 3} y={y + 5} textAnchor="middle" fontSize="15" fontWeight="800" fill={cT}>OH</text>);
    xTete = x;
  }
  // étiquettes : accolade sous la chaîne, accolade sous la tête
  const xa = x0 - 4, xb = x0 + dx * (nC - 1) + 4, yb = 82;
  const longue = M.carbonesChaine(e) >= M.SEUIL_CHAINE;
  const brace = (xa1, xb1, c, t, anchor, xt) => (<g key={t}>
    <path d={`M${xa1} ${yb - 5} v6 h${xb1 - xa1} v-6`} fill="none" stroke={c} strokeWidth="2"/>
    <text x={xt} y={yb + 22} textAnchor={anchor} fontSize="14" fontWeight="800" fill={c}>{t}</text></g>);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} {...(nested ? { x: 0, y: 0, width: W, height: H } : { role: 'img', 'aria-label': lab, style: stl(maxWidth) })}>
      {traits}{textes}
      {/* atome de carbone terminal CH₃ : petit repère de départ (pas de texte pour ne pas surcharger) */}
      {etiquettes && nC > 0 && brace(xa, xb, colore ? C.queue : C.gris, neutre ? 'chaîne apolaire' : longue ? 'chaîne apolaire longue' : 'chaîne apolaire courte', 'start', xa)}
      {etiquettes && e.tete && xTete != null && (() => { const x1 = Math.max(xTete - 6, xb + 6), x2 = xTete + dx + 16; return brace(x1, x2, colore ? C.tete : C.gris, 'tête polaire', 'end', 296); })()}
    </svg>);
}

// ---------- tubes à essais : A (eau + huile) et B (eau + huile + liquide vaisselle) ----------
const GOUTTES = (() => { const r = alea(158); return Array.from({ length: 46 }, () => ({ x: r(), y: r(), r: 2.2 + r() * 3.4 })); })();
function Tube({ x, savon, agite, nom }) {
  const w = 74, haut = 36, bas = 172, niv = 98;   // niveau de l'interface huile / eau
  const d = `M${x} ${haut} V${bas - 30} a${w / 2} 30 0 0 0 ${w} 0 V${haut}`;
  const emulsion = savon && agite;
  const id = `tube${x}`;
  return (
    <g>
      <clipPath id={id}><path d={d}/></clipPath>
      <g clipPath={`url(#${id})`}>
        {!emulsion && <><rect x={x} y={haut + 14} width={w} height={niv - haut - 14} fill={C.huile}/><rect x={x} y={niv} width={w} height={bas - niv + 10} fill={C.eau}/>
          <line x1={x} y1={niv} x2={x + w} y2={niv} stroke={C.huileBord} strokeWidth="1.2"/></>}
        {emulsion && <>
          <rect x={x} y={haut + 14} width={w} height={bas - haut + 4} fill="#e8f4fb"/>
          {GOUTTES.map((g, k) => <circle key={k} cx={x + 6 + g.x * (w - 12)} cy={haut + 34 + g.y * (bas - haut - 46)} r={g.r} fill={C.huile} stroke={C.huileBord} strokeWidth="0.8"/>)}</>}
        {savon && !emulsion && [0, 1, 2].map(k => <Ion key={k} x={x + 14 + k * 23} y={niv + 12 + (k % 2) * 6} ang={k * 50 - 40} L={12} r={3.2}/>)}
      </g>
      <path d={d} fill="none" stroke={C.gris} strokeWidth="2.4"/>
      <line x1={x - 4} y1={haut} x2={x + w + 4} y2={haut} stroke={C.gris} strokeWidth="2.4" strokeLinecap="round"/>
      {!emulsion && <><text x={x + w / 2} y={niv - 14} textAnchor="middle" fontSize="14" fontWeight="800" fill="#92400e">huile</text><text x={x + w / 2} y={niv + 38} textAnchor="middle" fontSize="14" fontWeight="800" fill="#075985">eau</text></>}
      {emulsion && <text x={x + w / 2} y={haut + 96} textAnchor="middle" fontSize="13" fontWeight="800" fill="#334155" stroke="white" strokeWidth="3" paintOrder="stroke">émulsion</text>}
      {nom.split('|').map((l, k) => <text key={k} x={x + w / 2} y={bas + 24 + k * 18} textAnchor="middle" fontSize={k ? 13 : 14} fontWeight="800" fill={C.encre}>{l}</text>)}
    </g>);
}
export function SceneTubes({ avecB = false, agite = false }) {
  return (
    <svg viewBox="0 0 320 224" role="img" aria-label={avecB ? `Deux tubes à essais : le tube A contient de l’eau surmontée d’huile ; le tube B contient en plus du liquide vaisselle${agite ? ' et, après agitation, de fines gouttelettes d’huile dispersées dans l’eau (une émulsion)' : ''}.` : 'Un tube à essais contenant de l’eau et, au-dessus, une couche d’huile : les deux liquides ne se mélangent pas.'} style={stl(420)}>
      {avecB ? <><Tube x={52} nom="A : eau + huile"/><Tube x={194} savon agite={agite} nom="B : eau + huile|+ liquide vaisselle"/></> : <Tube x={123} nom="A : eau + huile"/>}
    </svg>);
}

// ---------- interface eau / air ----------
export function SceneInterface({ orient = 'tete-eau', n = 6, maxWidth = 420, etiq = true }) {
  const ys = 96, xs = Array.from({ length: n }, (_, k) => 34 + k * (252 / (n - 1)));
  return (
    <svg viewBox="0 0 320 190" role="img" aria-label={orient === 'tete-eau' ? 'Ions carboxylate à la surface de l’eau : les têtes polaires plongent dans l’eau, les chaînes apolaires dépassent dans l’air.' : orient === 'plat' ? 'Ions carboxylate posés à plat sur l’eau, orientation à choisir.' : 'Ions carboxylate à la surface de l’eau placés à l’envers : les chaînes apolaires plongent dans l’eau et les têtes polaires sont dans l’air.'} style={stl(maxWidth)}>
      <rect x="0" y={ys} width="320" height={190 - ys} fill={C.eau}/>
      <line x1="0" y1={ys} x2="320" y2={ys} stroke="#0284c7" strokeWidth="1.6"/>
      {xs.map((x, k) => orient === 'tete-eau' ? <Ion key={k} x={x} y={ys + 12} ang={0} L={26}/> : orient === 'plat' ? <Ion key={k} x={x - 13} y={ys - 7} ang={90} L={26}/> : <Ion key={k} x={x} y={ys - 14} ang={180} L={26}/>)}
      {etiq && <><text x="8" y="22" fontSize="14" fontWeight="800" fill={C.gris}>air</text><text x="8" y="182" fontSize="14" fontWeight="800" fill="#075985">eau</text></>}
    </svg>);
}

// ---------- ions dispersés dans l'eau, orientés au hasard (avant assemblage) ----------
const LIBRES = (() => { const r = alea(7); return Array.from({ length: 13 }, () => ({ x: 26 + r() * 268, y: 22 + r() * 148, a: r() * 360 })); })();
export function SceneVolume() {
  return (
    <svg viewBox="0 0 320 190" role="img" aria-label="Du savon dans l’eau : des ions carboxylate dispersés, orientés au hasard, chacun avec sa tête polaire (point bleu) et sa chaîne apolaire (trait orange)." style={stl(420)}>
      <rect x="0" y="0" width="320" height="190" fill={C.eauPale}/>
      {LIBRES.map((p, k) => <Ion key={k} x={p.x} y={p.y} ang={p.a} L={22}/>)}
      <text x="8" y="182" fontSize="14" fontWeight="800" fill="#075985">eau</text>
    </svg>);
}

// ---------- goutte d'huile entourée d'ions non orientés ----------
const AUTOUR = (() => { const r = alea(11); return Array.from({ length: 9 }, (_, k) => { const th = (360 / 9) * k + r() * 25, d = 62 + r() * 20; return { th, d, a: r() * 360 }; }); })();
export function SceneGoutte() {
  return (
    <svg viewBox="0 0 320 190" role="img" aria-label="Une goutte d’huile dans l’eau, avec autour d’elle des ions carboxylate dont l’orientation n’est pas encore fixée." style={stl(420)}>
      <rect x="0" y="0" width="320" height="190" fill={C.eauPale}/>
      <circle cx="160" cy="95" r="42" fill={C.huile} stroke={C.huileBord} strokeWidth="1.6"/>
      <text x="160" y="100" textAnchor="middle" fontSize="14" fontWeight="800" fill="#92400e">huile</text>
      {AUTOUR.map((p, k) => <Ion key={k} x={160 + p.d * 1.35 * Math.cos(p.th * Math.PI / 180)} y={95 + p.d * 0.95 * Math.sin(p.th * Math.PI / 180)} ang={p.a} L={22}/>)}
      <text x="8" y="182" fontSize="14" fontWeight="800" fill="#075985">eau</text>
    </svg>);
}

// ---------- lavage : quatre stades, salissure grasse ou ionique, ions « savon », « court », « sel » ou « acide » ----------
const Tissu = ({ y = 170 }) => (<g>
  <defs><pattern id="hach" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#94a3b8" strokeWidth="2.2"/></pattern></defs>
  <rect x="0" y={y} width="320" height={190 - y + 10} fill="url(#hach)" opacity="0.8"/><line x1="0" y1={y} x2="320" y2={y} stroke={C.gris} strokeWidth="2"/>
  <text x="312" y="186" textAnchor="end" fontSize="13" fontWeight="800" fill={C.encre} stroke="white" strokeWidth="3" paintOrder="stroke">tissu</text></g>);
const DISPERSES = (() => { const r = alea(23); return Array.from({ length: 10 }, () => ({ x: 20 + r() * 280, y: 14 + r() * 120, a: r() * 360 })); })();
const Grain = ({ cx, cy, r = 18 }) => (<g><circle cx={cx} cy={cy} r={r} fill="#d6d3d1" stroke="#57534e" strokeWidth="1.8"/>
  {[[-6, -5], [5, -6], [-1, 4], [7, 3], [-8, 3]].map(([a, b], k) => <text key={k} x={cx + a * r / 18} y={cy + b * r / 18 + 4} textAnchor="middle" fontSize="13" fontWeight="800" fill="#44403c">+</text>)}</g>);

export function SceneLavage({ stade = 0, salissure = 'grasse', agent = 'savon', maxWidth = 460 }) {
  const aria = `Lavage d’une salissure ${salissure === 'grasse' ? 'grasse' : 'ionique'} sur un tissu, stade ${stade + 1} sur 4.`;
  const els = [];
  const cx0 = 160;
  if (agent !== 'savon') {
    // l'espèce ne se comporte pas comme un savon : la salissure reste collée au tissu
    const cy = salissure === 'grasse' ? 150 : 152;
    els.push(salissure === 'grasse' ? <circle key="s" cx={cx0} cy={cy} r="34" fill={C.huile} stroke={C.huileBord} strokeWidth="1.6"/> : <Grain key="s" cx={cx0} cy={cy} r={20}/>);
    DISPERSES.forEach((p, k) => {
      if (agent === 'court') els.push(<Ion key={`d${k}`} x={p.x} y={p.y} ang={p.a} L={7} r={4.6}/>);
      else if (agent === 'sel') els.push(k % 2 ? <circle key={`d${k}`} cx={p.x} cy={p.y} r="6.5" fill="white" stroke={C.tete} strokeWidth="2"/> : <circle key={`d${k}`} cx={p.x} cy={p.y} r="8" fill="white" stroke={C.gris} strokeWidth="2"/>);
      else if (k < 8) els.push(<Ion key={`d${k}`} x={196 + (k % 4) * 15} y={20 + Math.floor(k / 4) * 8} ang={(k % 4) * 6 - 9} L={20} r={4.4} neutre/>);
    });
  } else if (salissure === 'grasse') {
    const R = 34, n = stade === 0 ? 0 : stade === 1 ? 9 : stade === 2 ? 14 : 0;
    if (stade <= 1) els.push(<circle key="g" cx={cx0} cy={152} r={R} fill={C.huile} stroke={C.huileBord} strokeWidth="1.6"/>);
    if (stade === 0) DISPERSES.slice(0, 6).forEach((p, k) => els.push(<Ion key={`d${k}`} x={p.x} y={p.y} ang={p.a} L={22}/>));
    if (stade === 1) for (let k = 0; k < n; k++) els.push(<IonCercle key={`i${k}`} cx={cx0} cy={152} R={R + 4} th={190 + (160 / (n - 1)) * k} L={16}/>);
    if (stade === 2) {
      els.push(<circle key="g" cx={cx0} cy={104} r={R} fill={C.huile} stroke={C.huileBord} strokeWidth="1.6"/>);
      for (let k = 0; k < n; k++) els.push(<IonCercle key={`i${k}`} cx={cx0} cy={104} R={R + 4} th={(360 / n) * k + 10} L={16}/>);
      els.push(<g key="f"><path d="M160 66 v-20" stroke={C.gris} strokeWidth="2.4" fill="none"/><path d="M153 53 l7 -9 l7 9" stroke={C.gris} strokeWidth="2.4" fill="none"/></g>);
    }
    if (stade === 3) {
      els.push(<Micelle key="m1" cx={212} cy={86} R={30} n={13} L={15} coeur={26}/>);
      els.push(<Micelle key="m2" cx={92} cy={50} R={19} n={9} L={10} coeur={15} decal={15}/>);
      els.push(<g key="r"><path d="M30 120 h58" stroke="#0284c7" strokeWidth="3" fill="none"/><path d="M80 112 l9 8 l-9 8" stroke="#0284c7" strokeWidth="3" fill="none"/><text x="30" y="108" fontSize="13" fontWeight="800" fill="#075985">eau de rinçage</text></g>);
    }
  } else {
    // salissure ionique : grain chargé +, couche d'ions (têtes vers le grain), puis seconde couche (têtes vers l'eau)
    const cy = stade <= 1 ? 150 : stade === 2 ? 110 : 76, cx = stade === 3 ? 215 : cx0, rg = 19;
    els.push(<Grain key="g" cx={cx} cy={cy} r={rg}/>);
    const n1 = stade === 0 ? 0 : stade === 1 ? 7 : 9, R1 = rg + 7;
    for (let k = 0; k < n1; k++) els.push(<IonCercle key={`a${k}`} cx={cx} cy={cy} R={R1} th={stade === 1 ? 190 + (160 / (n1 - 1)) * k : (360 / n1) * k} vers="dehors" L={15} r={4.6}/>);
    if (stade >= 2) { const n2 = 13, R2 = R1 + 24; for (let k = 0; k < n2; k++) els.push(<IonCercle key={`b${k}`} cx={cx} cy={cy} R={R2} th={(360 / n2) * k + 8} vers="centre" L={15} r={4.6}/>); }
    if (stade === 0) DISPERSES.slice(0, 6).forEach((p, k) => els.push(<Ion key={`d${k}`} x={p.x} y={p.y} ang={p.a} L={22}/>));
    if (stade === 3) els.push(<g key="r"><path d="M30 120 h58" stroke="#0284c7" strokeWidth="3" fill="none"/><path d="M80 112 l9 8 l-9 8" stroke="#0284c7" strokeWidth="3" fill="none"/><text x="30" y="108" fontSize="13" fontWeight="800" fill="#075985">eau de rinçage</text></g>);
  }
  return (
    <svg viewBox="0 0 320 196" role="img" aria-label={aria} style={stl(maxWidth)}>
      <rect x="0" y="0" width="320" height="196" fill={C.eauPale}/>
      <Tissu y={170}/>
      {els}
      <text x="8" y="190" fontSize="13" fontWeight="700" fill={C.gris} stroke="white" strokeWidth="3" paintOrder="stroke">schéma simplifié</text>
    </svg>);
}
