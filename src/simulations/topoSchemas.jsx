// ====================================================
//  Schémas de la simulation 172 (formules topologiques et isomérie de constitution ; niveau TG).
//  Dessin d'une molécule : sommets = carbones, hydrogènes implicites, double liaison = deux traits parallèles, groupe –OH écrit en toutes lettres.
//  Scène : viewBox calculé, texte ≥ 16 ; cartes « À retenir » : viewBox de 320, texte ≥ 13. Aucune couleur seule : traits, formes et étiquettes.
//  Toutes les valeurs de x et de y sont des nombres (jamais de chaîne).
// ====================================================
import { mol, bruteTexte, boite, posAtomes } from './topoModele';

const COL = { bleu: '#0369a1', vert: '#15803d', rouge: '#b91c1c', orange: '#b45309', gris: '#64748b', txt: '#0f172a', clair: '#cbd5e1', fond: '#f1f5f9' };
const halo = { stroke: '#fff', strokeWidth: 4, paintOrder: 'stroke' };

const graphe = m => (typeof m === 'string' ? mol(m) : m);

// éléments SVG d'une molécule, son atome n° 0 étant placé (ox, oy) + décalage tel que la boîte commence en (0, 0)
export function TopoG({ g, L = 38, ox = 0, oy = 0, opts = {}, numeros = 0, epais = 2.6, surligne = null, fontO = 18 }) {
  const b = boite(g, L, opts), P = b.pts.map(p => ({ x: ox - b.x0 + p.x * L, y: oy - b.y0 - p.y * L }));
  const cx = P.reduce((s, p) => s + p.x, 0) / P.length, cy = P.reduce((s, p) => s + p.y, 0) / P.length;
  const libelle = i => { // O écrit « HO » si son voisin est à sa droite
    const l = g.bo.find(([a, c]) => a === i || c === i), j = l[0] === i ? l[1] : l[0];
    return P[j].x > P[i].x + 1 ? 'HO' : 'OH';
  };
  const raccourci = (a, c) => { // retire la place de l'étiquette aux extrémités oxygène
    let [p, q] = [{ ...P[a] }, { ...P[c] }];
    const d = Math.hypot(q.x - p.x, q.y - p.y), u = { x: (q.x - p.x) / d, y: (q.y - p.y) / d }, r = 14;
    if (g.at[a] === 'O') p = { x: p.x + u.x * r, y: p.y + u.y * r };
    if (g.at[c] === 'O') q = { x: q.x - u.x * r, y: q.y - u.y * r };
    return [p, q, u];
  };
  return (
    <g>
      {g.bo.map(([a, c, o], k) => {
        const [p, q, u] = raccourci(a, c), n = { x: -u.y, y: u.x }, ds = o === 2 ? [-3.8, 3.8] : [0];
        const gras = surligne && surligne.has(a) && surligne.has(c);
        return ds.map(d => <line key={`${k}${d}`} x1={p.x + n.x * d} y1={p.y + n.y * d} x2={q.x + n.x * d} y2={q.y + n.y * d} stroke={gras ? COL.orange : COL.txt} strokeWidth={gras ? epais + 1.6 : epais} strokeLinecap="round"/>);
      })}
      {g.at.map((e, i) => e === 'O' && <text key={`o${i}`} x={P[i].x} y={P[i].y + fontO * 0.34} textAnchor="middle" fontSize={fontO} fontWeight={700} fill={COL.txt}>{libelle(i)}</text>)}
      {numeros > 0 && g.at.slice(0, numeros).map((e, i) => {
        const dx = P[i].x - cx, dy = P[i].y - cy, d = Math.hypot(dx, dy) || 1;
        return <text key={`n${i}`} x={P[i].x + dx / d * 18} y={P[i].y + dy / d * 18 + 4.5} textAnchor="middle" fontSize={14} fill={COL.gris} fontWeight={700} {...halo}>{i + 1}</text>;
      })}
    </g>);
}

// dessin seul d'une molécule (scène, exercices) : svg adapté à la taille du dessin
export function FormuleTopo({ m, L = 38, opts = {}, numeros = 0, aria, maxW = null, surligne = null }) {
  const g = graphe(m), b = boite(g, L, opts), w = b.x1 - b.x0, h = b.y1 - b.y0;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: Math.min(maxW || 480, Math.max(140, w * 1.8)), display: 'block', margin: '0 auto' }} role="img"
      aria-label={aria || `Formule topologique de la molécule de formule brute ${bruteTexte(g)}`}>
      <TopoG g={g} L={L} opts={opts} numeros={numeros} surligne={surligne}/>
    </svg>);
}

// plusieurs molécules côte à côte, chacune sous une lettre (A, B, C…)
export function Planche({ items, L = 34, aria, lettres = true }) {
  const cases = items.map(it => { const g = graphe(it.m); return { ...it, g, b: boite(g, L, it.opts || {}) }; });
  const W = Math.max(...cases.map(c => c.b.x1 - c.b.x0), 110), H = Math.max(...cases.map(c => c.b.y1 - c.b.y0), 70) + (lettres ? 30 : 0);
  return (
    <svg viewBox={`0 0 ${W * cases.length} ${H}`} width="100%" style={{ maxWidth: Math.min(500, W * cases.length * 1.4), display: 'block', margin: '0 auto' }} role="img" aria-label={aria}>
      {cases.map((c, k) => {
        const w = c.b.x1 - c.b.x0, h = c.b.y1 - c.b.y0;
        return (
          <g key={k}>
            <rect x={k * W + 3} y={3} width={W - 6} height={H - 6} rx={10} fill="#fff" stroke={COL.clair} strokeWidth={1.5}/>
            {lettres && <text x={k * W + 14} y={27} fontSize={19} fontWeight={800} fill={COL.txt}>{c.lettre || String.fromCharCode(65 + k)}</text>}
            <TopoG g={c.g} L={L} ox={k * W + (W - w) / 2} oy={(lettres ? 26 : 0) + (H - (lettres ? 26 : 0) - h) / 2} opts={c.opts || {}}/>
          </g>);
      })}
    </svg>);
}

// ---------- cartes « À retenir » (viewBox 320, texte ≥ 13) ----------
const Svg = ({ h, aria, children }) => (
  <svg viewBox={`0 0 320 ${h}`} width="100%" style={{ maxWidth: 320, display: 'block', margin: '0 auto' }} role="img" aria-label={aria}>{children}</svg>);
const T = ({ x, y, s = 14, w = 600, c = COL.txt, a = 'start', children }) => <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} textAnchor={a}>{children}</text>;
const Sous = ({ x, y, children, c = COL.txt, a = 'middle' }) => <text x={x} y={y} fontSize={14} fontWeight={700} fill={c} textAnchor={a} {...halo}>{children}</text>;

// A : lire une formule topologique (sommets = C, hydrogènes implicites)
export function SvgLireCarte() {
  const g = mol('CCCCC'), L = 46, b = boite(g, L), w = b.x1 - b.x0, ox = (320 - w) / 2, oy = 34, P = posAtomes(g, L, ox, oy);
  const grp = ['CH₃', 'CH₂', 'CH₂', 'CH₂', 'CH₃'];
  const moy = P.reduce((t, p) => t + p.y, 0) / P.length;
  return (
    <Svg h={196} aria="Pentane en formule topologique : une ligne brisée de 4 traits ; chaque extrémité et chaque sommet est un atome de carbone, et le nombre d’hydrogènes (CH₃, CH₂) est complété pour que chaque carbone fasse 4 liaisons">
      <T x={160} y={22} a="middle" s={14} w={700}>chaque sommet ou bout de trait = 1 C</T>
      <TopoG g={g} L={L} ox={ox} oy={oy}/>
      {P.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={5.5} fill="#fff" stroke={COL.bleu} strokeWidth={2.2}/>)}
      {P.map((p, i) => <Sous key={i} x={p.x} y={p.y + (p.y > moy ? 24 : -12)} c={COL.bleu}>{grp[i]}</Sous>)}
      <rect x={10} y={124} width={300} height={62} rx={10} fill={COL.fond} stroke={COL.clair}/>
      <T x={160} y={148} a="middle">H non dessinés : on complète</T>
      <T x={160} y={172} a="middle" s={15} w={700}>chaque C a 4 liaisons au total</T>
    </Svg>);
}

// B : les trois squelettes (saturé, C=C, cycle) et leur formule brute
export function SvgSquelettesCarte() {
  const items = [['CCCC', 'C₄H₁₀', 'saturé'], ['C=CCC', 'C₄H₈', 'avec C=C'], ['C1CCC1', 'C₄H₈', 'cycle']];
  const W = 320 / 3, L = 22;
  return (
    <Svg h={188} aria="Trois squelettes à quatre carbones : le butane saturé C₄H₁₀, le but-1-ène avec une double liaison C₄H₈ et le cyclobutane C₄H₈ ; une double liaison ou un cycle fait perdre deux hydrogènes">
      {items.map(([s, f, tx], k) => {
        const g = mol(s), b = boite(g, L), w = b.x1 - b.x0;
        return (
          <g key={k}>
            <rect x={k * W + 3} y={4} width={W - 6} height={124} rx={9} fill="#fff" stroke={COL.clair} strokeWidth={1.5}/>
            <TopoG g={g} L={L} ox={k * W + (W - w) / 2} oy={6}/>
            <T x={k * W + W / 2} y={102} a="middle" w={700} s={15}>{f}</T>
            <T x={k * W + W / 2} y={120} a="middle" s={14} c={COL.txt}>{tx}</T>
          </g>);
      })}
      <T x={160} y={154} a="middle" w={700} s={14}>1 C=C ou 1 cycle : 2 H de moins</T>
      <T x={160} y={174} a="middle" s={14} c={COL.gris} w={600}>(à même nombre de C)</T>
    </Svg>);
}

// C : lire un nom (règles de nomenclature)
export function SvgNomCarte() {
  const g = mol('CCC(CCC)C'), L = 34, b = boite(g, L, { racine: 0 }), w = b.x1 - b.x0;
  return (
    <Svg h={226} aria="Exemple de lecture d’un nom : le 3-méthylhexane a une chaîne principale de 6 carbones numérotés de 1 à 6 et une ramification méthyle portée par le carbone 3">
      <g transform="translate(0 4)"><TopoG g={g} L={L} ox={(320 - w) / 2} oy={0} opts={{ racine: 0 }} numeros={6} surligne={new Set([0, 1, 2, 3, 4, 5])}/></g>
      <T x={160} y={120} a="middle" s={19} w={800}>3-méthylhexane</T>
      <T x={12} y={148} s={15}>3 : numéro du carbone ramifié</T>
      <T x={12} y={170} s={15}>méthyl : ramification de 1 C</T>
      <T x={12} y={192} s={15}>hex : chaîne principale de 6 C</T>
      <T x={12} y={214} s={15}>ane : que des liaisons simples C–C</T>
    </Svg>);
}

// D : isomères de constitution
export function SvgIsomeresCarte() {
  const A = mol('CCCC'), B = mol('CC(C)C'), L = 34, ba = boite(A, L), bb = boite(B, L), wa = ba.x1 - ba.x0, wb = bb.x1 - bb.x0;
  return (
    <Svg h={200} aria="Le butane et le 2-méthylpropane ont la même formule brute C₄H₁₀ mais des enchaînements d’atomes différents : ce sont des isomères de constitution">
      <rect x={4} y={4} width={152} height={134} rx={10} fill="#fff" stroke={COL.clair} strokeWidth={1.5}/>
      <rect x={164} y={4} width={152} height={134} rx={10} fill="#fff" stroke={COL.clair} strokeWidth={1.5}/>
      <TopoG g={A} L={L} ox={80 - wa / 2} oy={22}/>
      <TopoG g={B} L={L} ox={240 - wb / 2} oy={10}/>
      <T x={80} y={126} a="middle" w={700}>C₄H₁₀</T>
      <T x={240} y={126} a="middle" w={700}>C₄H₁₀</T>
      <T x={160} y={164} a="middle" w={700} s={14}>même formule brute</T>
      <T x={160} y={186} a="middle" w={700} s={14}>enchaînement des atomes différent</T>
    </Svg>);
}

// E : même molécule dessinée autrement
export function SvgMemeCarte() {
  const A = mol('CC(C)CC'), L = 32, ba = boite(A, L), bb = boite(A, L, { racine: 4, miroir: true }), wa = ba.x1 - ba.x0, wb = bb.x1 - bb.x0;
  return (
    <Svg h={172} aria="Deux dessins différents d’une même molécule, le 2-méthylbutane : le dessin change mais l’enchaînement des atomes reste le même, c’est la même molécule">
      <rect x={4} y={4} width={152} height={104} rx={10} fill="#fff" stroke={COL.clair} strokeWidth={1.5}/>
      <rect x={164} y={4} width={152} height={104} rx={10} fill="#fff" stroke={COL.clair} strokeWidth={1.5}/>
      <TopoG g={A} L={L} ox={80 - wa / 2} oy={26}/>
      <TopoG g={A} L={L} ox={240 - wb / 2} oy={26} opts={{ racine: 4, miroir: true }}/>
      <T x={160} y={134} a="middle" w={700} s={14}>deux dessins, une seule molécule</T>
      <T x={160} y={156} a="middle" s={14}>on compare les enchaînements</T>
    </Svg>);
}

// F : isomères de chaîne et de position
export function SvgTypesCarte() {
  const items = [['CCCCO', ['butan-1-ol']], ['CCC(C)O', ['butan-2-ol']], ['CC(C)CO', ['2-méthyl', 'propan-1-ol']]];
  const W = 320 / 3, L = 18;
  return (
    <Svg h={206} aria="Trois alcools de formule C₄H₁₀O : le butan-1-ol, le butan-2-ol dont le groupe OH a changé de place (isomère de position) et le 2-méthylpropan-1-ol dont le squelette carboné est ramifié (isomère de chaîne) ; le passage d’une double liaison à un cycle n’est ni l’un ni l’autre">
      {items.map(([s, ns], k) => {
        const g = mol(s), b = boite(g, L), w = b.x1 - b.x0;
        return (
          <g key={k}>
            <rect x={k * W + 3} y={4} width={W - 6} height={120} rx={9} fill="#fff" stroke={COL.clair} strokeWidth={1.5}/>
            <TopoG g={g} L={L} ox={k * W + (W - w) / 2} oy={10} fontO={18}/>
            {ns.map((n, i) => <T key={i} x={k * W + W / 2} y={ns.length > 1 ? 96 + 16 * i : 112} a="middle" s={14} w={700}>{n}</T>)}
          </g>);
      })}
      <T x={160} y={146} a="middle" w={700} s={14}>même formule brute C₄H₁₀O</T>
      <T x={16} y={170} s={14}>▸ OH déplacé : isomère de position</T>
      <T x={16} y={192} s={14}>▸ squelette modifié : isomère de chaîne</T>
    </Svg>);
}

