// ====================================================
//  Schémas de la simulation 173 (familles fonctionnelles et polymères ; niveau TG).
//  Le DESSIN d'une molécule est calculé à partir du graphe du modèle (polymeresModele.js) : sommets = atomes de carbone non écrits,
//  hydrogènes portés par C implicites (calculés), O / N / Cl / Br écrits avec leurs hydrogènes. Aucune coordonnée n'est écrite à la main.
//  Public daltonien : le groupe caractéristique est entouré d'un trait POINTILLÉ (forme) et peut être nommé par écrit ; le motif d'un polymère
//  est encadré par des crochets avec « n ». Toutes les valeurs de x et y sont des nombres (jamais des chaînes).
//  Scènes : viewBox ≥ 300 de large, texte 20 ; cartes « À retenir » : viewBox de 290, texte ≥ 14.
// ====================================================
import * as M from './polymeresModele';

const COL = { txt: '#0f172a', gris: '#64748b', orange: '#c2410c', fond: '#fff7ed', bleu: '#0369a1', vert: '#15803d', rouge: '#b91c1c', clair: '#cbd5e1' };
const L = 46;                                           // pixels par longueur de liaison
const FS = 21;                                          // taille des lettres d'atomes (dans le viewBox)

const valenceAff = (g, i) => (g.atoms[i].el in M.VALENCE ? M.nbH(g, i) : 0);
const GROUPE_NOM = { ester: 'groupe ester', acide: 'groupe carboxyle', amide: 'groupe amide', amine: 'groupe amine', halogeno: 'liaison C–X', alcool: 'groupe hydroxyle', aldehyde: 'groupe carbonyle', cetone: 'groupe carbonyle' };
const nomGroupe = f => GROUPE_NOM[f];

// ---------- tracé d'un graphe ; renvoie { jsx, bb: [x0, y0, x1, y1] } ----------
//  o.L : pixels par longueur de liaison (46 = taille d'une scène ; les cartes utilisent une valeur plus petite) ; o.dx, o.dy : décalage.
//  Les tailles de police, d'épaisseur et de marge suivent L : aucune transformation SVG n'est utilisée (les mesures des textes restent exactes).
function tracer(g, { groupes = [], numeros = false, brackets = null, ext = false, hFn = null, L = 46, dx = 0, dy = 0 } = {}) {
  const f = L / 46, FSx = 21 * f;
  const P = i => [dx + g.atoms[i].x * L, dy + g.atoms[i].y * L];
  const etiq = i => g.atoms[i].el !== 'C';
  const rayon = i => (g.atoms[i].el.length > 1 || g.atoms[i].el === 'R′' ? 15 : 12) * f;
  const nbHa = hFn || (i => valenceAff(g, i));
  const bb = [Infinity, Infinity, -Infinity, -Infinity];
  const etend = (x, y, r = 0) => { bb[0] = Math.min(bb[0], x - r); bb[1] = Math.min(bb[1], y - r); bb[2] = Math.max(bb[2], x + r); bb[3] = Math.max(bb[3], y + r); };
  const els = [], fond = [], textes = [];
  const deg = i => g.bonds.filter(b => b[0] === i || b[1] === i).length;
  const W = 2.8 * f;
  const halo = { stroke: '#fff', strokeWidth: 3 * f, paintOrder: 'stroke' };
  // liaisons
  g.bonds.forEach(([a, b, ordre], k) => {
    const [x1, y1] = P(a), [x2, y2] = P(b);
    const ddx = x2 - x1, ddy = y2 - y1, len = Math.hypot(ddx, ddy), ux = ddx / len, uy = ddy / len, nx = -uy, ny = ux;
    const s1 = etiq(a) ? rayon(a) : 0, s2 = etiq(b) ? rayon(b) : 0;
    const ax = x1 + ux * s1, ay = y1 + uy * s1, bx = x2 - ux * s2, by = y2 - uy * s2;
    etend(x1, y1); etend(x2, y2);
    const trait = (X1, Y1, X2, Y2, w = W) => <line key={`b${k}-${els.length}`} x1={X1} y1={Y1} x2={X2} y2={Y2} stroke={COL.txt} strokeWidth={w} strokeLinecap="round"/>;
    if (ordre === 2) {
      const cyc = g.atoms[a].cycle;
      if (cyc) {
        // double liaison d'un cycle : trait principal + trait intérieur raccourci, du côté du centre du cycle
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, cx = dx + cyc[0] * L, cy = dy + cyc[1] * L;
        const sgn = ((cx - mx) * nx + (cy - my) * ny) >= 0 ? 1 : -1, d = 5.2 * f;
        els.push(trait(ax, ay, bx, by));
        els.push(trait(ax + nx * d * sgn + ux * 5 * f, ay + ny * d * sgn + uy * 5 * f, bx + nx * d * sgn - ux * 5 * f, by + ny * d * sgn - uy * 5 * f, 2.2 * f));
      } else {
        const d = 3.6 * f;
        els.push(trait(ax + nx * d, ay + ny * d, bx + nx * d, by + ny * d));
        els.push(trait(ax - nx * d, ay - ny * d, bx - nx * d, by - ny * d));
      }
    } else els.push(trait(ax, ay, bx, by));
  });
  // atomes écrits
  g.atoms.forEach((a, i) => {
    const [x, y] = P(i);
    if (a.el === 'C') return;
    const h = nbHa(i);
    etend(x, y, 14 * f);
    textes.push(<text key={`a${i}`} x={x} y={y + 7.5 * f} fontSize={FSx} fontWeight={700} fill={COL.txt} textAnchor="middle" {...halo}>{a.el}</text>);
    if (h > 0 && (a.el === 'O' || a.el === 'N')) {
      const d = deg(i);
      if (d <= 1) {
        textes.push(<text key={`h${i}`} x={x + 11 * f} y={y + 7.5 * f} fontSize={FSx} fontWeight={700} fill={COL.txt} {...halo}>H</text>);
        if (h > 1) textes.push(<text key={`hn${i}`} x={x + 27 * f} y={y + 14 * f} fontSize={Math.max(0.8 * FSx, 14)} fontWeight={700} fill={COL.txt}>{h}</text>);
        etend(x + 36 * f, y, 4);
      } else {
        const vois = g.bonds.filter(b => b[0] === i || b[1] === i).map(b => (b[0] === i ? b[1] : b[0]));
        const dessous = vois.every(j => g.atoms[j].y < g.atoms[i].y - 0.01);        // voisins au-dessus : on écrit H en dessous
        const yy = dessous ? y + 30 * f : y - 14 * f;
        textes.push(<text key={`h${i}`} x={x - 5 * f} y={yy + 7.5 * f} fontSize={FSx} fontWeight={700} fill={COL.txt} {...halo}>H</text>);
        etend(x, yy, 14 * f);
      }
    }
  });
  // groupes caractéristiques : cadre pointillé (forme) derrière le dessin
  groupes.forEach((gr, k) => {
    const xs = gr.atomes.map(i => P(i)[0]), ys = gr.atomes.map(i => P(i)[1]);
    let x0 = Math.min(...xs) - 24 * f, x1 = Math.max(...xs) + 24 * f, y0 = Math.min(...ys) - 22 * f, y1 = Math.max(...ys) + 22 * f;
    // les hydrogènes écrits d'un N ou d'un O du groupe restent dans le cadre
    gr.atomes.forEach(i => { if ((g.atoms[i].el === 'N' || g.atoms[i].el === 'O') && nbHa(i) > 0) { const d = deg(i); if (d <= 1) x1 = Math.max(x1, P(i)[0] + 44 * f); else { y0 = Math.min(y0, P(i)[1] - 36 * f); y1 = Math.max(y1, P(i)[1] + 44 * f); } } });
    fond.push(<rect key={`g${k}`} x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={16 * f} fill={COL.fond} stroke={COL.orange} strokeWidth={2.6 * f} strokeDasharray={`${7 * f} ${5 * f}`}/>);
    etend(x0, y0); etend(x1, y1);
  });
  // numérotation de la chaîne (pour les cartes de nomenclature)
  if (numeros) {
    const base = Math.max(...g.atoms.map(a => dy + a.y * L)) + 40 * f;
    let n = 0;
    for (let i = 0; i < g.nChaine; i++) if (g.atoms[i].el === 'C') { n++; const x = P(i)[0]; textes.push(<text key={`n${i}`} x={x} y={base} fontSize={17 * Math.max(f, 0.9)} fontWeight={700} fill={COL.bleu} textAnchor="middle">{n}</text>); etend(x, base, 12 * f); }
  }
  // extrémités ouvertes et crochets (segment de polymère)
  if (ext) {
    const k2 = 2 * g.k, a0 = P(0), aN = P(k2 - 1);
    const v0 = [dx - M_U * L, dy], vN = [dx + k2 * M_U * L, dy + 0.5 * L];
    const fin = (a, v) => [a[0] + 0.62 * (v[0] - a[0]), a[1] + 0.62 * (v[1] - a[1])];
    [[a0, v0], [aN, vN]].forEach(([a, v], q) => { const e = fin(a, v); els.push(<line key={`e${q}`} x1={a[0]} y1={a[1]} x2={e[0]} y2={e[1]} stroke={COL.txt} strokeWidth={W} strokeLinecap="round"/>); etend(e[0], e[1]); });
  }
  if (brackets !== null) {
    const j = brackets, ph = g.polymere && g.polymere.sub === 'Ph';
    // les crochets coupent les liaisons à leur milieu : aucun atome du motif voisin n'est barré (cycle : coupe à 72 % pour laisser passer le noyau)
    const xl = (P(2 * j - 1)[0] + P(2 * j)[0]) / 2, xr = P(2 * j + 1)[0] + (ph ? 0.72 : 0.5) * (P(2 * j + 2)[0] - P(2 * j + 1)[0]);
    const ysMot = g.atoms.map((a, i) => ({ a, i })).filter(({ a }) => dx + a.x * L >= xl && dx + a.x * L <= xr).map(({ a }) => dy + a.y * L);
    const top = Math.min(...ysMot) - (g.polymere && g.polymere.sub === 'Ph' ? 0.74 * L : 0) - 16 * f, bas = Math.max(...ysMot) + 0.5 * L + 6 * f;
    fond.push(<rect key="surl" x={xl} y={top} width={xr - xl} height={bas - top} fill={COL.fond}/>);
    const bk = (x, sens) => <path key={`br${sens}`} d={`M ${x + sens * 9 * f} ${top} L ${x} ${top} L ${x} ${bas} L ${x + sens * 9 * f} ${bas}`} fill="none" stroke={COL.orange} strokeWidth={3.4 * f} strokeLinejoin="round"/>;
    textes.push(bk(xl, 1), bk(xr, -1));
    textes.push(<text key="nn" x={xr + 8 * f} y={bas + 4 * f} fontSize={FSx + f} fontStyle="italic" fontWeight={700} fill={COL.orange}>n</text>);
    etend(xl, top); etend(xr + 24 * f, bas + 8 * f);
  }
  return { jsx: <>{fond}{els}{textes}</>, bb };
}
const M_U = Math.sqrt(3) / 2;

// ---------- enveloppe SVG : viewBox calculé, largeur 100 %, plafond maxWidth, centré ----------
function Cadre({ bb, etiquette, aria, maxWidth = 460, minW = 300, minH = 110, marge = 26, children }) {
  const ex = etiquette ? 34 : 0;
  const w = Math.max(minW, bb[2] - bb[0] + 2 * marge), h = Math.max(minH, bb[3] - bb[1] + 2 * marge + ex);
  const cx = (bb[0] + bb[2]) / 2;
  const x0 = cx - w / 2, y0 = (bb[1] - marge) - (h - (bb[3] - bb[1] + 2 * marge + ex)) / 2;
  return (
    <svg role="img" aria-label={aria} viewBox={`${x0.toFixed(1)} ${y0.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`} width="100%" style={{ display: 'block', margin: '0 auto', maxWidth, height: 'auto' }}>
      {children}
      {etiquette && <text x={cx} y={bb[3] + 26} fontSize={17} fontWeight={700} fill={COL.orange} textAnchor="middle">{etiquette}</text>}
    </svg>);
}

// ---------- molécule seule ----------
//  montrer : 'rien' | 'groupe' | 'nomme' (cadre pointillé, puis cadre + nom du groupe)
export function SvgMolecule({ mol, montrer = 'rien', maxWidth = 440, numeros = false, famillesGroupe = null, aria }) {
  const gr = montrer === 'rien' ? [] : M.groupes(mol).filter(x => !famillesGroupe || famillesGroupe.includes(x.fam));
  const { jsx, bb } = tracer(mol, { groupes: gr, numeros });
  const et = montrer === 'nomme' && gr.length ? `${nomGroupe(gr[0].fam)}${gr[0].fam === 'amine' ? ` (${M.classeAmine(mol, gr[0].atomes[0])})` : ''}` : null;
  return <Cadre bb={bb} etiquette={et} aria={aria || `Formule topologique d’une molécule${montrer !== 'rien' ? ', groupe caractéristique entouré en pointillés' : ''}`} maxWidth={maxWidth}>{jsx}</Cadre>;
}

// ---------- segment de polymère : 3 motifs, extrémités ouvertes, crochets et n facultatifs ----------
export function SvgPolymere({ id, k = 3, crochets = false, maxWidth = 460, aria }) {
  const g = M.segmentPolymere(id, k);
  const { jsx, bb } = tracer(g, { ext: true, brackets: crochets ? Math.floor(k / 2) : null, hFn: i => (i < 2 * k ? M.hSegment(g, i) : M.nbH(g, i)) });
  return <Cadre bb={bb} aria={aria || `Segment de la chaîne d’un polymère : ${k} motifs identiques${crochets ? ', un motif encadré par des crochets avec n' : ''}`} maxWidth={maxWidth} minW={320} minH={120}>{jsx}</Cadre>;
}

// ====================================================
//  CARTES « À RETENIR » (viewBox de 290 de large (affiché vers 230 px sur téléphone), texte ≥ 14)
// ====================================================
const Titre = ({ y, children, c = COL.txt }) => <text x={160} y={y} fontSize={16} fontWeight={700} fill={c} textAnchor="middle">{children}</text>;
// place un graphe centré en (cx, cy) à l'échelle L (pixels par liaison) : coordonnées calculées, aucune transformation SVG
function Place({ g, cx, cy, L: Lp, o }) {
  const sec = tracer(g, { ...o, L: Lp }), mx = (sec.bb[0] + sec.bb[2]) / 2, my = (sec.bb[1] + sec.bb[3]) / 2;
  return tracer(g, { ...o, L: Lp, dx: cx - mx, dy: cy - my }).jsx;
}
const mm = nom => M.molParNom(nom);
const frag = (els, brs) => ({ ...M.chaine(els, brs), nChaine: els.length });

export function SvgNomEsterCarte() {
  const g = mm('éthanoate d’éthyle'), Lc = 44, X = i => 160 + (g.atoms[i].x - (g.atoms[0].x + g.atoms[4].x) / 2) * Lc;
  // sous-lignes : partie acyle (sommets 0 et 1, avec le C=O) et partie alkyle (sommets 3 et 4)
  const gauche = [X(0) - 16, X(1) + 14], droite = [X(3) - 14, X(4) + 16], yl = 150;
  return (
    <svg role="img" aria-label="Nom d’un ester : la partie qui porte le groupe C=O donne alcanoate, la partie liée à l’atome d’oxygène donne d’alkyle ; exemple éthanoate d’éthyle" viewBox="15 0 290 270" width="100%" style={{ display: 'block', margin: '0 auto', maxWidth: 320, height: 'auto' }}>
      <Titre y={24}>R–CO–O–R′ : alcanoate d’alkyle</Titre>
      <Place g={g} cx={160} cy={92} L={Lc} o={{ groupes: M.groupes(g) }}/>
      <path d={`M ${gauche[0]} ${yl - 8} L ${gauche[0]} ${yl} L ${gauche[1]} ${yl} L ${gauche[1]} ${yl - 8}`} fill="none" stroke={COL.bleu} strokeWidth={2.6}/>
      <path d={`M ${droite[0]} ${yl - 8} L ${droite[0]} ${yl} L ${droite[1]} ${yl} L ${droite[1]} ${yl - 8}`} fill="none" stroke={COL.vert} strokeWidth={2.6} strokeDasharray="6 4"/>
      <text x={(gauche[0] + gauche[1]) / 2} y={yl + 24} fontSize={15} fontWeight={700} fill={COL.bleu} textAnchor="middle">éthanoate</text>
      <text x={(gauche[0] + gauche[1]) / 2} y={yl + 44} fontSize={14} fill={COL.bleu} textAnchor="middle">(2 C)</text>
      <text x={(droite[0] + droite[1]) / 2} y={yl + 24} fontSize={15} fontWeight={700} fill={COL.vert} textAnchor="middle">d’éthyle</text>
      <text x={(droite[0] + droite[1]) / 2} y={yl + 44} fontSize={14} fill={COL.vert} textAnchor="middle">(2 C)</text>
      <text x={160} y={250} fontSize={14} fill={COL.gris} textAnchor="middle">Le C du C=O compte dans la 1re partie</text>
    </svg>);
}

export function SvgClassesAmineCarte() {
  const lignes = [['méthanamine', 'primaire', '1 C lié à N'], ['N-méthylméthanamine', 'secondaire', '2 C liés à N'], ['N,N-diméthylméthanamine', 'tertiaire', '3 C liés à N']];
  return (
    <svg role="img" aria-label="Trois classes d’amines : primaire (un carbone lié à l’azote), secondaire (deux carbones), tertiaire (trois carbones)" viewBox="15 0 290 290" width="100%" style={{ display: 'block', margin: '0 auto', maxWidth: 320, height: 'auto' }}>
      {lignes.map(([nom, cl, txt], k) => {
        const m = mm(nom);
        return (
          <g key={nom}>
            <Place g={m} cx={76} cy={50 + k * 92} L={34} o={{ groupes: M.groupes(m) }}/>
            <text x={158} y={46 + k * 92} fontSize={16} fontWeight={700} fill={COL.txt}>{cl}</text>
            <text x={158} y={68 + k * 92} fontSize={14} fill={COL.gris}>{txt}</text>
            {k < 2 && <line x1={20} y1={96 + k * 92} x2={300} y2={96 + k * 92} stroke={COL.clair} strokeWidth={1.2}/>}
          </g>);
      })}
    </svg>);
}

export function SvgTroisGroupesCarte() {
  const gE = frag(['R', 'C', 'O', 'R′'], [[1, 'O', 2]]), gA = frag(['R', 'C', 'N', 'R′'], [[1, 'O', 2]]), gN = frag(['R', 'N', 'R′'], []);
  const f = g => i => (g.atoms[i].el === 'N' || g.atoms[i].el === 'O' ? M.nbH(g, i) : 0);
  const lignes = [[gE, 'ester', ['C=O et', 'O lié à C'], [1, 4, 2]], [gA, 'amide', ['C=O et', 'N'], [1, 4, 2]], [gN, 'amine', ['N, pas de', 'C=O voisin'], [1]]];
  return (
    <svg role="img" aria-label="Distinguer ester, amide et amine : l’ester a un C=O et un oxygène lié à un carbone, l’amide a un C=O et un azote, l’amine a un azote sans C=O voisin" viewBox="15 0 290 300" width="100%" style={{ display: 'block', margin: '0 auto', maxWidth: 320, height: 'auto' }}>
      {lignes.map(([g, nom, txt, at], k) => {
        return (
          <g key={nom}>
            <Place g={g} cx={80} cy={52 + k * 92} L={32} o={{ groupes: [{ fam: nom, atomes: at }], hFn: f(g) }}/>
            <text x={156} y={48 + k * 92} fontSize={16} fontWeight={700} fill={COL.txt}>{nom}</text>
            {txt.map((t, q) => <text key={q} x={156} y={68 + q * 18 + k * 92} fontSize={14} fill={COL.gris}>{t}</text>)}
            {k < 2 && <line x1={20} y1={98 + k * 92} x2={300} y2={98 + k * 92} stroke={COL.clair} strokeWidth={1.2}/>}
          </g>);
      })}
    </svg>);
}

export function SvgHalogenoCarte() {
  const m = mm('1-bromobutane');
  return (
    <svg role="img" aria-label="Halogénoalcane : on numérote la chaîne, on repère le carbone qui porte l’halogène ; exemple 1-bromobutane" viewBox="15 0 290 250" width="100%" style={{ display: 'block', margin: '0 auto', maxWidth: 320, height: 'auto' }}>
      <Titre y={24}>C–X : chloro-, bromo-</Titre>
      <Place g={m} cx={160} cy={96} L={38} o={{ groupes: M.groupes(m), numeros: true }}/>
      <text x={160} y={176} fontSize={15} fontWeight={700} fill={COL.bleu} textAnchor="middle">numéro du C portant Br : 1</text>
      <text x={160} y={202} fontSize={15} fontWeight={700} fill={COL.txt} textAnchor="middle">1 – bromo + butane</text>
      <text x={160} y={232} fontSize={14} fill={COL.gris} textAnchor="middle">numéro le plus petit possible</text>
    </svg>);
}

export function SvgMotifCarte() {
  const g = M.segmentPolymere('pp', 3);
  return (
    <svg role="img" aria-label="Polymère : un même motif se répète n fois ; exemple du polypropylène, motif entre crochets" viewBox="15 0 290 260" width="100%" style={{ display: 'block', margin: '0 auto', maxWidth: 320, height: 'auto' }}>
      <Titre y={24}>Un motif répété n fois</Titre>
      <Place g={g} cx={160} cy={100} L={35} o={{ ext: true, brackets: 1, hFn: i => (i < 6 ? M.hSegment(g, i) : M.nbH(g, i)) }}/>
      <text x={160} y={184} fontSize={15} fontWeight={700} fill={COL.txt} textAnchor="middle">[–CH₂–CH(CH₃)–]ₙ</text>
      <text x={160} y={212} fontSize={14} fill={COL.gris} textAnchor="middle">n = nombre de motifs (très grand)</text>
      <text x={160} y={236} fontSize={14} fill={COL.gris} textAnchor="middle">extrémités de la chaîne ouvertes</text>
    </svg>);
}

export function SvgNatSynthCarte() {
  const perle = (x, y, c) => <circle key={`${x}${y}`} cx={x} cy={y} r={9} fill="#fff" stroke={c} strokeWidth={3}/>;
  const perles = (x0, y, c) => Array.from({ length: 5 }, (_, k) => perle(x0 + k * 22, y, c));
  const nat = ['cellulose : bois', 'amidon : aliments', 'protéines : soie', 'ADN : gènes', 'caoutchouc : pneus'];
  const syn = ['PE : sacs, films', 'PVC : tuyaux', 'PP : boîtes', 'PS : barquettes', 'nylon : textiles'];
  return (
    <svg role="img" aria-label="Polymères naturels (cellulose, amidon, protéines, ADN, caoutchouc naturel) et synthétiques (polyéthylène, PVC, polypropylène, polystyrène, nylon) avec leurs usages" viewBox="15 0 290 270" width="100%" style={{ display: 'block', margin: '0 auto', maxWidth: 320, height: 'auto' }}>
      <text x={80} y={24} fontSize={16} fontWeight={700} fill={COL.txt} textAnchor="middle">Naturels</text>
      <text x={240} y={24} fontSize={16} fontWeight={700} fill={COL.txt} textAnchor="middle">Synthétiques</text>
      <line x1={160} y1={10} x2={160} y2={258} stroke={COL.clair} strokeWidth={1.5} strokeDasharray="5 4"/>
      <g stroke={COL.bleu}><line x1={24} y1={52} x2={134} y2={52} strokeWidth={3}/></g>
      {perles(26, 52, COL.bleu)}
      <g><line x1={184} y1={52} x2={294} y2={52} stroke={COL.orange} strokeWidth={3}/></g>
      {perles(186, 52, COL.orange)}
      {nat.map((t, k) => <text key={t} x={24} y={92 + k * 34} fontSize={14} fill={COL.txt}>{t}</text>)}
      {syn.map((t, k) => <text key={t} x={172} y={92 + k * 34} fontSize={14} fill={COL.txt}>{t}</text>)}
      <text x={160} y={262} fontSize={14} fill={COL.gris} textAnchor="middle">○ = motif répété</text>
    </svg>);
}
