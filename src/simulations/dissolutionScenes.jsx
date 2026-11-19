// ====================================================
//  Scènes (schémas) de la simulation « Dissolution d'un solide ionique dans l'eau : équation et concentration des ions » (1G, sim 157).
//  Tous les SVG : width 100 %, maxWidth 480, centrés ; viewBox de 420 de large, textes ≥ 14 unités (≥ 11 px sur un téléphone de 390 px).
//  Couleurs : cation = bleu, anion = vert, oxygène de l'eau = rouge, hydrogène = gris clair. Schémas SIMPLIFIÉS (2D, tailles et nombres de
//  molécules d'eau autour d'un ion schématiques) : ils montrent les proportions et l'orientation des molécules d'eau, pas la vraie géométrie.
// ====================================================
import { COL, signeIon, rayons, nbIonsReseau } from "./dissolutionDessin";
const stl = { width: '100%', maxWidth: 480, height: 'auto', display: 'block', margin: '0 auto', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb' };
const alea = i => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };   // pseudo-aléa déterministe
const rad = d => d * Math.PI / 180;


// ---------- un ion : disque + signe de la charge (ion polyatomique : même disque, le nom est dans la légende) ----------
export function Ion({ x, y, r, plus, q = 1, poly = false }) {
  return (
    <g>
      {poly && <circle cx={x} cy={y} r={r + 3.5} fill="none" stroke="#14532d" strokeWidth="1.5" strokeDasharray="3 2" />}
      <circle cx={x} cy={y} r={r} fill={plus ? COL.cat : COL.an} opacity="0.92" stroke="white" strokeWidth="1.5" />
      <text x={x} y={y + 5} fontSize="14" fontWeight="700" textAnchor="middle" fill="white">{signeIon(q, plus)}</text>
    </g>);
}
// rayons schématiques (le cation est plus petit que l'anion, comme pour Na⁺ et Cl⁻ ; plus la charge est grande, plus le cation est petit)

// ---------- une molécule d'eau : O au centre (x, y), la bissectrice O→H pointe vers l'angle bis (degrés, y vers le bas) ----------
export function Eau({ x, y, bis, k = 1, delta = false }) {
  const L = 11 * k, a1 = rad(bis - 52.25), a2 = rad(bis + 52.25);
  const h1 = { x: x + L * Math.cos(a1), y: y + L * Math.sin(a1) }, h2 = { x: x + L * Math.cos(a2), y: y + L * Math.sin(a2) };
  return (
    <g>
      <line x1={x} y1={y} x2={h1.x} y2={h1.y} stroke={COL.gris} strokeWidth="2" /><line x1={x} y1={y} x2={h2.x} y2={h2.y} stroke={COL.gris} strokeWidth="2" />
      <circle cx={x} cy={y} r={7 * k} fill={COL.ox} /><circle cx={h1.x} cy={h1.y} r={4.6 * k} fill={COL.hy} stroke={COL.gris} /><circle cx={h2.x} cy={h2.y} r={4.6 * k} fill={COL.hy} stroke={COL.gris} />
      {delta && <>
        <text x={x - (7 * k + 12) * Math.cos(rad(bis))} y={y - (7 * k + 12) * Math.sin(rad(bis)) + 5} fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.ox}>δ−</text>
        <text x={(h1.x + h2.x) / 2 + (4.6 * k + 14) * Math.cos(rad(bis))} y={(h1.y + h2.y) / 2 + (4.6 * k + 14) * Math.sin(rad(bis)) + 5} fontSize="15" fontWeight="700" textAnchor="middle" fill={COL.cat}>δ+</text></>}
    </g>);
}
// couronne de molécules d'eau autour d'un ion : anion → les H tournés vers l'ion ; cation → l'O tourné vers l'ion
function Couronne({ x, y, r, plus, n = 4, phase = 20 }) {
  const d = r + 19;
  return Array.from({ length: n }, (_, i) => {
    const a = phase + i * 360 / n, ox = x + d * Math.cos(rad(a)), oy = y + d * Math.sin(rad(a));
    return <Eau key={i} x={ox} y={oy} bis={plus ? a : a + 180} />;
  });
}

// ---------- scène 1 : un réseau de cristal (2D simplifié) ----------
// Les ions minoritaires sont répartis en diagonale ; le rapport des nombres d'ions est celui de la formule (1:1, 1:y ou x:1).
export function SceneCristal({ sel, titre = 'Un cristal ionique (schéma 2D simplifié)', nC = 6, nL = 4, legende = true, legendeBas = true }) {
  const { rc, ra } = rayons(sel), { p, cationMin } = nbIonsReseau(sel, nC, nL), esp = 44, x0 = 36, y0 = 70;
  const ions = [];
  for (let l = 0; l < nL; l++) for (let k = 0; k < nC; k++) {
    const m = (k + l) % p === 0, plus = m === cationMin;
    ions.push(<Ion key={`${k}-${l}`} x={x0 + k * esp + (l % 2 ? 0 : 0)} y={y0 + l * esp} r={plus ? rc : ra} plus={plus} poly={!plus && sel.an.poly} q={plus ? sel.cat.q : sel.an.q} />);
  }
  return (
    <svg viewBox="0 0 420 270" style={stl} role="img"
      aria-label={`${titre} : cristal de ${sel.nom} ${sel.f}, un empilement ordonné d’ions ${sel.cat.s} (bleus, signe plus) et ${sel.an.s} (verts, signe moins). Les proportions sont celles de la formule : ${sel.cat.nu} ion ${sel.cat.s} pour ${sel.an.nu} ion ${sel.an.s} dans la formule ${sel.f}.`}>
      <text x="210" y="24" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>{titre}</text>
      <rect x="10" y="44" width={20 + (nC - 1) * esp + 40} height={(nL - 1) * esp + 60} rx="8" fill="#f8fafc" stroke="#cbd5e1" />
      {ions}
      {legende && <g>
        <Ion x={312} y={92} r={rc} plus q={sel.cat.q} /><text x="334" y="98" fontSize="15" fill={COL.encre}>{sel.cat.s}</text>
        <text x="312" y="124" fontSize="14" fill="#334155">cation</text>
        <Ion x={312} y={160} r={ra} plus={false} poly={sel.an.poly} q={sel.an.q} /><text x="336" y="166" fontSize="15" fill={COL.encre}>{sel.an.s}</text>
        <text x="312" y="192" fontSize="14" fill="#334155">anion</text></g>}
      {legendeBas && <text x="210" y="262" fontSize="14" textAnchor="middle" fill="#334155">Les ions de signes opposés s’attirent.</text>}
    </svg>);
}

// ---------- scène 2 : un ion et sa charge, avant de former un cristal neutre (étape « neutralité ») ----------
export function SceneNeutralite({ sel, nbAnions = null, revele = false }) {
  const { rc, ra } = rayons(sel), n = nbAnions ?? sel.an.nu;
  return (
    <svg viewBox="0 0 420 200" style={stl} role="img"
      aria-label={`Un ion ${sel.cat.s} porte ${sel.cat.q} charges positives ; un ion ${sel.an.s} porte ${sel.an.q} charge négative. ${revele ? `Le cristal neutre compte ${sel.cat.nu} ion ${sel.cat.s} pour ${sel.an.nu} ions ${sel.an.s}.` : 'Combien d’ions négatifs faut-il pour rendre le cristal neutre ?'}`}>
      <text x="210" y="24" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>Un ion {sel.cat.s} et des ions {sel.an.s}</text>
      <Ion x={70} y={90} r={rc + 6} plus q={sel.cat.q} />
      <text x="70" y="136" fontSize="15" textAnchor="middle" fill={COL.encre}>{sel.cat.s}</text>
      <text x="70" y="156" fontSize="14" textAnchor="middle" fill={COL.cat}>charge {sel.cat.q} +</text>
      <text x="130" y="96" fontSize="26" fontWeight="700" textAnchor="middle" fill={COL.gris}>+</text>
      {revele ? Array.from({ length: n }, (_, i) => <Ion key={i} x={175 + i * 44} y={90} r={ra} plus={false} poly={sel.an.poly} q={sel.an.q} />)
        : <text x="215" y="98" fontSize="24" fontWeight="700" textAnchor="middle" fill={COL.orange}>? × </text>}
      {!revele && <Ion x={270} y={90} r={ra} plus={false} poly={sel.an.poly} q={sel.an.q} />}
      <text x={revele ? 175 + (n - 1) * 22 : 270} y="136" fontSize="15" textAnchor="middle" fill={COL.encre}>{sel.an.s}</text>
      <text x={revele ? 175 + (n - 1) * 22 : 270} y="156" fontSize="14" textAnchor="middle" fill={COL.an}>charge {sel.an.q} −</text>
      <text x="210" y="188" fontSize="14" textAnchor="middle" fill="#334155">{revele ? `Charges : ${sel.cat.nu * sel.cat.q} + et ${sel.an.nu * sel.an.q} − : le cristal est neutre.` : 'Le cristal est neutre : autant de charges + que de charges −.'}</text>
    </svg>);
}

// ---------- scène 3 : les trois temps de la dissolution ----------
//  temps 1 : dissociation ; temps 2 : solvatation (revele = orientation des molécules d'eau visible) ; temps 3 : dispersion.
const TITRES_TEMPS = { 1: '1. Dissociation : l’eau s’approche', 2: '2. Solvatation : l’eau entoure les ions', 3: '3. Dispersion : les ions s’éloignent' };
export function SceneTroisTemps({ sel, temps, revele = true, annote = true }) {
  const { rc, ra } = rayons(sel), { p, cationMin } = nbIonsReseau(sel, 4, 3);
  const corps = [];
  if (temps === 1) {
    const x0 = 80, y0 = 150, esp = 40;
    for (let l = 0; l < 3; l++) for (let k = 0; k < 4; k++) { const m = (k + l) % p === 0, plus = m === cationMin; corps.push(<Ion key={`c${k}${l}`} x={x0 + k * esp} y={y0 + l * esp} r={Math.min(plus ? rc : ra, 15)} plus={plus} poly={!plus && sel.an.poly} q={plus ? sel.cat.q : sel.an.q} />); }
    // molécules d'eau orientées : près d'un cation l'oxygène (δ−) est tourné vers l'ion, près d'un anion ce sont les hydrogènes (δ+)
    const cible = [[0, 0, -90], [1, 0, -90], [2, 0, -90], [3, 0, -55], [3, 1, 0], [3, 2, 25], [0, 1, 180], [0, 2, 205]];
    cible.forEach(([k, l, a], i) => {
      const plus = ((k + l) % p === 0) === cationMin, r = Math.min(plus ? rc : ra, 15), d = r + 22;
      corps.push(<Eau key={`e${i}`} x={x0 + k * esp + d * Math.cos(rad(a))} y={y0 + l * esp + d * Math.sin(rad(a))} bis={plus ? a : a + 180} />);
    });
    const fl = [[0, 0, -90], [2, 0, -90], [3, 1, 0]].map(([k, l, a]) => { const r = 15, ux = Math.cos(rad(a)), uy = Math.sin(rad(a)); return `M${x0 + k * esp + (r + 66) * ux},${y0 + l * esp + (r + 66) * uy} L${x0 + k * esp + (r + 50) * ux},${y0 + l * esp + (r + 50) * uy}`; });
    corps.push(<g key="fl" stroke={COL.orange} strokeWidth="2.2" fill="none">{fl.map((d, i) => <path key={i} d={d} markerEnd="url(#pointe)" />)}</g>);
    corps.push(<text key="t1" x="352" y="228" fontSize="15" textAnchor="middle" fill={COL.encre}>molécules d’eau</text>, <text key="t1b" x="352" y="247" fontSize="15" textAnchor="middle" fill={COL.encre}>(polaires)</text>);
    corps.push(<line key="tl" x1="300" y1="234" x2="258" y2="244" stroke={COL.gris} strokeDasharray="3 3" />);
    if (annote) corps.push(<text key="t1c" x="352" y="130" fontSize="15" textAnchor="middle" fill={COL.orange}>l’attraction entre</text>, <text key="t1d" x="352" y="150" fontSize="15" textAnchor="middle" fill={COL.orange}>ions s’affaiblit</text>);
  } else if (temps === 2) {
    corps.push(<Ion key="a" x={110} y={140} r={ra} plus={false} poly={sel.an.poly} q={sel.an.q} />, <Ion key="c" x={310} y={140} r={rc} plus q={sel.cat.q} />);
    corps.push(<text key="na" x="110" y="222" fontSize="15" textAnchor="middle" fill={COL.encre}>{sel.an.s}</text>, <text key="nc" x="310" y="222" fontSize="15" textAnchor="middle" fill={COL.encre}>{sel.cat.s}</text>);
    if (revele) {
      corps.push(<g key="ka"><Couronne x={110} y={140} r={ra} plus={false} n={5} phase={10} /></g>, <g key="kc"><Couronne x={310} y={140} r={rc} plus n={5} phase={40} /></g>);
      corps.push(<text key="la" x="110" y="244" fontSize="14" textAnchor="middle" fill={COL.an}>H tournés vers l’anion</text>, <text key="lc" x="310" y="244" fontSize="14" textAnchor="middle" fill={COL.cat}>O tourné vers le cation</text>);
    } else {
      corps.push(<g key="mod"><Eau x={210} y={118} bis={-90} k={2} delta /></g>, <text key="mt" x="210" y="190" fontSize="14" textAnchor="middle" fill="#334155">molécule d’eau polaire</text>);
    }
  } else {
    const n = p === 2 ? 3 : 2, lst = [];
    for (let i = 0; i < n; i++) { for (let j = 0; j < sel.cat.nu; j++) lst.push(true); for (let j = 0; j < sel.an.nu; j++) lst.push(false); }
    const pos = [[62, 100], [152, 100], [242, 100], [332, 100], [62, 190], [152, 190], [242, 190], [332, 190]];
    const ordre = [0, 5, 2, 7, 4, 1, 6, 3];
    lst.slice(0, 8).forEach((plus, i) => {
      const [x, y] = pos[ordre[i]], dx = (alea(i * 3) - 0.5) * 18, dy = (alea(i * 3 + 1) - 0.5) * 12, r = plus ? Math.min(rc, 13) : Math.min(ra, 15);
      corps.push(<g key={i}><Couronne x={x + dx} y={y + dy} r={r} plus={plus} n={4} phase={20 + alea(i) * 50} /><Ion x={x + dx} y={y + dy} r={r} plus={plus} poly={!plus && sel.an.poly} q={plus ? sel.cat.q : sel.an.q} /></g>);
    });
    corps.push(<text key="ts" x="210" y="244" fontSize="14" textAnchor="middle" fill="#334155">Les ions solvatés se répartissent dans l’eau.</text>);
  }
  return (
    <svg viewBox="0 0 420 262" style={stl} role="img"
      aria-label={`Dissolution de ${sel.nom} ${sel.f}, ${TITRES_TEMPS[temps]}. ${temps === 1 ? 'Des molécules d’eau polaires s’approchent du cristal.' : temps === 2 ? (revele ? 'Chaque anion est entouré de molécules d’eau dont les atomes d’hydrogène (pôle positif) sont tournés vers lui ; chaque cation est entouré de molécules d’eau dont l’atome d’oxygène (pôle négatif) est tourné vers lui.' : 'Un cation et un anion sont libres dans l’eau ; une molécule d’eau polaire est dessinée avec ses pôles δ plus sur les hydrogènes et δ moins sur l’oxygène.') : 'Les ions entourés de molécules d’eau se répartissent dans la solution.'}`}>
      <defs><marker id="pointe" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill={COL.orange} /></marker></defs>
      <text x="210" y="24" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>{TITRES_TEMPS[temps]}</text>
      <rect x="8" y="40" width="404" height="214" rx="10" fill={COL.eau} opacity="0.35" />
      {corps}
    </svg>);
}

// ---------- scène 4 : bécher de solution (ions dessinés, l'eau n'est pas représentée) ----------
export function SceneBecherIons({ sel, nF = 4, ions = true, titre, sous }) {
  const { rc, ra } = rayons(sel), lst = [];
  for (let i = 0; i < nF; i++) { for (let j = 0; j < sel.cat.nu; j++) lst.push(true); for (let j = 0; j < sel.an.nu; j++) lst.push(false); }
  const W = 250, x0 = 85, yH = 70, base = 232;
  const pts = lst.map((plus, i) => ({ plus, x: x0 + 18 + alea(i * 2 + 5) * (W - 36), y: yH + 28 + alea(i * 2 + 6) * (base - yH - 46) }));
  // écarte les ions trop proches (relaxation simple et déterministe)
  for (let it = 0; it < 60; it++) for (let a = 0; a < pts.length; a++) for (let b = a + 1; b < pts.length; b++) {
    const dx = pts[b].x - pts[a].x, dy = pts[b].y - pts[a].y, d = Math.hypot(dx, dy) || 0.1, mini = 33;
    if (d < mini) { const f = (mini - d) / 2 / d; pts[a].x -= dx * f; pts[a].y -= dy * f; pts[b].x += dx * f; pts[b].y += dy * f; }
    pts[a].x = Math.min(x0 + W - 18, Math.max(x0 + 18, pts[a].x)); pts[a].y = Math.min(base - 18, Math.max(yH + 22, pts[a].y));
  }
  return (
    <svg viewBox="0 0 420 300" style={stl} role="img"
      aria-label={`${titre}. ${ions ? `Schéma de ${nF} formules ${sel.f} dissoutes : ${nF * sel.cat.nu} ions ${sel.cat.s} et ${nF * sel.an.nu} ions ${sel.an.s} (l’eau n’est pas dessinée).` : 'Bécher de solution, ions non encore représentés.'}`}>
      <text x="210" y="24" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>{titre}</text>
      {sous && <text x="210" y="46" fontSize="15" textAnchor="middle" fill="#334155">{sous}</text>}
      <rect x={x0} y={yH} width={W} height={base - yH} fill={COL.eau} opacity="0.9" />
      {ions && pts.map((q, i) => <Ion key={i} x={q.x} y={q.y} r={q.plus ? rc : ra} plus={q.plus} poly={!q.plus && sel.an.poly} q={q.plus ? sel.cat.q : sel.an.q} />)}
      <path d={`M${x0},${yH - 14} L${x0},${base - 3} Q${x0},${base} ${x0 + 3},${base} L${x0 + W - 3},${base} Q${x0 + W},${base} ${x0 + W},${base - 3} L${x0 + W},${yH - 14}`} fill="none" stroke={COL.gris} strokeWidth="2.5" />
      <text x="210" y="262" fontSize="14" textAnchor="middle" fill="#334155">{ions ? `Schéma : ${nF} formules dissoutes (l’eau n’est pas dessinée)` : 'Solution aqueuse'}</text>
      <g><Ion x={110} y={284} r={9} plus q={1} /><text x="124" y="289" fontSize="14" fill={COL.encre}>{sel.cat.s}</text>
        <Ion x={250} y={284} r={9} plus={false} poly={sel.an.poly} q={1} /><text x="264" y="289" fontSize="14" fill={COL.encre}>{sel.an.s}</text></g>
    </svg>);
}

// ---------- scène 5 : barres des concentrations (c, [cation], [anion]) ----------
export function SceneBarres({ sel, c, fmt, max = null, titre = 'Concentrations dans la solution' }) {
  const cc = sel.cat.nu * c, ca = sel.an.nu * c, M = max ?? Math.max(c, cc, ca) * 1.12;
  const L = v => Math.max(3, 230 * v / M);
  const lignes = [['c (soluté apporté)', c, COL.orange, 'c'], [`[${sel.cat.s}]`, cc, COL.cat, 'cat'], [`[${sel.an.s}]`, ca, COL.an, 'an']];
  return (
    <svg viewBox="0 0 420 190" style={stl} role="img"
      aria-label={`${titre} : c vaut ${fmt(c)} mol/L, la concentration en ions ${sel.cat.s} vaut ${fmt(cc)} mol/L et celle des ions ${sel.an.s} vaut ${fmt(ca)} mol/L.`}>
      <text x="210" y="24" fontSize="16" fontWeight="700" textAnchor="middle" fill={COL.encre}>{titre}</text>
      {lignes.map(([nom, v, col], i) => (
        <g key={i}>
          <text x="10" y={68 + i * 46} fontSize="15" fontWeight="700" fill={COL.encre}>{nom}</text>
          <rect x="10" y={74 + i * 46} width={L(v)} height="18" rx="3" fill={col} opacity="0.9" />
          <text x={16 + L(v)} y={89 + i * 46} fontSize="15" fill={COL.encre} fontWeight="700"> {fmt(v)} mol/L</text>
        </g>))}
    </svg>);
}
