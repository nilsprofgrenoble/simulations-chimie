// Schémas de la simulation 210 (stratégie de synthèse) : molécules en formules topologiques tracées depuis le graphe de strModele.js,
// cartes de réactions de la banque, schémas des cartes « À retenir ».
// Règles : coordonnées toujours numériques ; textes ≥ 16 (molécules, viewBox à l'échelle 1:1) ; jamais la couleur seule (forme, trait, étiquette).
import { MOLS, formule, nbH, ESPECES } from './strModele';

const NOIR = '#0f172a', GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c';

// ---------- dessin d'une molécule : éléments SVG en coordonnées locales + dimensions ----------
function dessinMol(m, { L = 34, halo = null, fontO = 18 } = {}) {
  const MX = 26, MY = 22;
  const P = m.atomes.map(a => ({ x: a.x * L, y: -a.y * L }));
  const x0 = Math.min(...P.map(p => p.x)) - MX, y0 = Math.min(...P.map(p => p.y)) - MY;
  const w = Math.max(...P.map(p => p.x)) + MX - x0, h = Math.max(...P.map(p => p.y)) + MY - y0;
  const Q = P.map(p => ({ x: p.x - x0, y: p.y - y0 }));
  const voisins = m.atomes.map(() => []);
  m.liaisons.forEach(([a, b]) => { voisins[a].push(b); voisins[b].push(a); });
  const etiquette = i => m.atomes[i].e === 'O' || m.atomes[i].e === 'Br';
  const el = [];
  if (halo) halo.forEach((hh, k) => {
    const pts = hh.atomes.map(i => Q[i]), pad = 20;
    const xa = Math.min(...pts.map(p => p.x)) - pad, ya = Math.min(...pts.map(p => p.y)) - pad, xb = Math.max(...pts.map(p => p.x)) + pad, yb = Math.max(...pts.map(p => p.y)) + pad;
    el.push(<rect key={`ha${k}`} x={xa} y={ya} width={xb - xa} height={yb - ya} rx={14} fill={hh.fond || 'none'} stroke={hh.couleur || ORANGE} strokeWidth={2.4} strokeDasharray={hh.trait || '7 5'}/>);
  });
  m.liaisons.forEach(([a, b, o], k) => {
    let p = { ...Q[a] }, q = { ...Q[b] };
    const d = Math.hypot(q.x - p.x, q.y - p.y), u = { x: (q.x - p.x) / d, y: (q.y - p.y) / d };
    const raccourci = i => (m.atomes[i].e === 'Br' ? 16 : 13);
    if (etiquette(a)) p = { x: p.x + u.x * raccourci(a), y: p.y + u.y * raccourci(a) };
    if (etiquette(b)) q = { x: q.x - u.x * raccourci(b), y: q.y - u.y * raccourci(b) };
    (o === 2 ? [-3.6, 3.6] : [0]).forEach(s => el.push(<line key={`b${k}_${s}`} x1={p.x - u.y * s} y1={p.y + u.x * s} x2={q.x - u.y * s} y2={q.y + u.x * s} stroke={NOIR} strokeWidth={2.6} strokeLinecap="round"/>));
  });
  m.atomes.forEach((a, i) => {
    if (!etiquette(i)) return;
    const vois = voisins[i], v = vois.length ? Q[vois[0]] : null;
    let txt = a.e, ancre = 'middle', dx = 0;
    if (a.e === 'O') {
      const hh = nbH(m, i);
      const droite = v && v.x > Q[i].x + 0.3 * L;   // voisin à droite : le H s'écrit à gauche
      if (a.q === -1) { txt = 'O⁻'; ancre = droite ? 'end' : 'start'; dx = droite ? 8 : -8; }
      else if (hh >= 1 && vois.length === 1) { txt = droite ? 'HO' : 'OH'; ancre = droite ? 'end' : 'start'; dx = droite ? 8 : -8; }
    }
    el.push(<text key={`t${i}`} x={Q[i].x + dx} y={Q[i].y + 6.5} textAnchor={ancre} fontSize={fontO} fontWeight={700} fill={NOIR}>{txt}</text>);
  });
  return { el, w, h, Q };
}

// molécule seule : <svg> à taille naturelle (jamais agrandie), réduite si la place manque
export function Mol({ id, L = 34, aria, halo = null, style = {} }) {
  const m = MOLS[id], { el, w, h } = dessinMol(m, { L, halo });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: w, display: 'block', margin: '0 auto', ...style }} role="img" aria-label={aria || `Formule topologique : ${m.nom}, ${formule(m)}`}>
      {el}
    </svg>);
}

// molécule + nom + formule brute
export function MolCarte({ id, L = 34, halo = null, largeur = null, role = null }) {
  const m = MOLS[id];
  return (
    <figure style={{ margin: 0, textAlign: 'center', flex: '0 1 auto', maxWidth: largeur || '100%' }}>
      <Mol id={id} L={L} halo={halo}/>
      <figcaption style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.35, marginTop: 2 }}>
        {role && <div style={{ fontWeight: 700, color: NOIR }}>{role}</div>}
        <span style={{ fontWeight: 700, color: NOIR }}>{m.nom}</span><br/>{formule(m)}
      </figcaption>
    </figure>);
}

// flèche de réaction : réactifs au-dessus, conditions au-dessous (texte HTML : retour à la ligne automatique)
export function FlecheReaction({ haut, bas, largeur = 150 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: largeur, maxWidth: '100%', flex: '0 1 auto', gap: 2 }}>
      {haut && <div style={{ fontSize: 13.5, color: NOIR, textAlign: 'center', lineHeight: 1.3 }}>{haut}</div>}
      <svg viewBox="0 0 80 14" width="80" height="14" role="img" aria-label="flèche de réaction"><line x1={2} y1={7} x2={72} y2={7} stroke={NOIR} strokeWidth={2.4}/><polygon points="78,7 68,2 68,12" fill={NOIR}/></svg>
      {bas && <div style={{ fontSize: 13, color: GRIS, textAlign: 'center', lineHeight: 1.3 }}>{bas}</div>}
    </div>);
}
const Plus = () => <span aria-hidden="true" style={{ fontSize: 22, fontWeight: 700, color: NOIR, padding: '0 2px' }}>+</span>;
const Petite = ({ t }) => <span style={{ fontSize: 17, fontWeight: 700, color: NOIR, padding: '0 4px' }}>{t}</span>;

// Carte d'une réaction de la banque : l'exemple (réactif → produits), les réactifs et les conditions sur la flèche
export function CarteReaction({ r, banque, etiquette = null, L = 30, compact = false }) {
  const [dep] = r.exemple, a = r.apps[dep], mols = ids => ids.filter(id => MOLS[id]);
  const gauche = mols(a.eq.r.map(([, id]) => id));
  const droite = a.eq.p.map(([c, id]) => ({ c, id }));
  const items = (liste, droiteCote) => liste.map((x, k) => {
    const id = x.id || x, n = (x.c || 1);
    const bloc = MOLS[id] ? <MolCarte id={id} L={L} largeur={compact ? 190 : 230}/> : (id === 'ox' || id === 'H2') ? null : <Petite t={`${n > 1 ? n + ' ' : ''}${ESPECES[id].formule}`}/>;
    return bloc ? <span key={`${droiteCote}${k}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{k > 0 && <Plus/>}{bloc}</span> : null;
  });
  void banque;
  const especes = [...a.eq.r, ...a.eq.p].map(([, id]) => id);
  const note = especes.includes('ox') ? 'Bilan simplifié : l’oxydant est représenté par un atome d’oxygène [O], non dessiné.' : especes.includes('H2') ? 'Bilan simplifié : l’hydrogène apporté par le réducteur, noté [H], n’est pas dessiné.' : null;
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6, rowGap: 4 }}>
        {etiquette}
        {items(gauche, 'g')}
        <FlecheReaction haut={r.reactifs} bas={r.conditions} largeur={compact ? 130 : 170}/>
        {items(droite, 'd')}
      </div>
      {note && <div style={{ fontSize: 12.5, color: '#64748b', textAlign: 'center', marginTop: 4 }}>{note}</div>}
    </div>);
}

// ====================================================
//  Cartes « À retenir » : viewBox 320 de large, textes ≥ 15,5 (≥ 11 px rendus à 390 px), tout le texte dans le cadre
// ====================================================
const Cadre = ({ h, aria, children }) => (
  <svg viewBox={`0 0 320 ${h}`} width="100%" style={{ maxWidth: 420, display: 'block', margin: '4px auto 8px' }} role="img" aria-label={aria}>{children}</svg>);
const T = ({ x, y, ancre = 'start', taille = 15.5, gras = false, couleur = NOIR, children }) => (
  <text x={x} y={y} textAnchor={ancre} fontSize={taille} fontWeight={gras ? 700 : 400} fill={couleur}>{children}</text>);

// 1. Les cinq types : chaque type avec son indice de reconnaissance et un mini-dessin
export function SvgCarteTypes() {
  const lignes = [
    { y: 8, nom: 'oxydo-réduction', indice: 'un oxydant ou un réducteur', forme: 'rond' },
    { y: 62, nom: 'acide-base', indice: 'un ion H⁺ change de place', forme: 'h' },
    { y: 116, nom: 'substitution', indice: 'un groupe en remplace un autre', forme: 'sub' },
    { y: 170, nom: 'addition', indice: 'C=C devient C–C', forme: 'add' },
    { y: 224, nom: 'élimination', indice: 'C–C devient C=C', forme: 'eli' },
  ];
  const mini = (f, y) => {
    const cy = y + 21;
    switch (f) {
      case 'rond': return <g><circle cx={30} cy={cy} r={13} fill="#fff" stroke={NOIR} strokeWidth={2.4}/><text x={30} y={cy + 6} textAnchor="middle" fontSize={16} fontWeight={700} fill={NOIR}>e⁻</text></g>;
      case 'h': return <g><rect x={11} y={cy - 12} width={38} height={24} rx={6} fill="#fff" stroke={NOIR} strokeWidth={2.4}/><text x={30} y={cy + 6} textAnchor="middle" fontSize={16} fontWeight={700} fill={NOIR}>H⁺</text></g>;
      case 'sub': return <g><rect x={9} y={cy - 12} width={22} height={24} rx={4} fill="#fff" stroke={NOIR} strokeWidth={2.4}/><rect x={34} y={cy - 12} width={22} height={24} rx={4} fill={NOIR}/><text x={20} y={cy + 6} textAnchor="middle" fontSize={16} fontWeight={700} fill={NOIR}>A</text><text x={45} y={cy + 6} textAnchor="middle" fontSize={16} fontWeight={700} fill="#fff">B</text></g>;
      case 'add': return <g><line x1={8} y1={cy - 3.5} x2={22} y2={cy - 3.5} stroke={NOIR} strokeWidth={2.6}/><line x1={8} y1={cy + 3.5} x2={22} y2={cy + 3.5} stroke={NOIR} strokeWidth={2.6}/><path d={`M 27 ${cy} L 38 ${cy} M 34 ${cy - 4} L 38 ${cy} L 34 ${cy + 4}`} fill="none" stroke={NOIR} strokeWidth={2}/><line x1={43} y1={cy} x2={57} y2={cy} stroke={NOIR} strokeWidth={2.6}/></g>;
      default: return <g><line x1={8} y1={cy} x2={22} y2={cy} stroke={NOIR} strokeWidth={2.6}/><path d={`M 27 ${cy} L 38 ${cy} M 34 ${cy - 4} L 38 ${cy} L 34 ${cy + 4}`} fill="none" stroke={NOIR} strokeWidth={2}/><line x1={43} y1={cy - 3.5} x2={57} y2={cy - 3.5} stroke={NOIR} strokeWidth={2.6}/><line x1={43} y1={cy + 3.5} x2={57} y2={cy + 3.5} stroke={NOIR} strokeWidth={2.6}/></g>;
    }
  };
  return (
    <Cadre h={282} aria="Les cinq types de réactions et leur indice de reconnaissance : oxydo-réduction (oxydant ou réducteur), acide-base (échange de H⁺), substitution (un groupe en remplace un autre), addition (C=C devient C–C), élimination (C–C devient C=C).">
      {lignes.map(l => (
        <g key={l.nom}>
          <rect x={4} y={l.y} width={312} height={46} rx={10} fill="#f8fafc" stroke="#94a3b8" strokeWidth={1.6}/>
          <g transform="translate(0,0)">{mini(l.forme, l.y)}</g>
          <T x={68} y={l.y + 20} gras>{l.nom}</T>
          <T x={68} y={l.y + 38} taille={15.5} couleur={GRIS}>{l.indice}</T>
        </g>))}
    </Cadre>);
}

// 2. Construire une séquence : on remonte depuis la cible
export function SvgCarteSequence() {
  const boites = [{ y: 8, t: 'éthène', note: 'départ' }, { y: 78, t: 'bromoéthane' }, { y: 148, t: 'éthanol' }, { y: 218, t: 'éthanal', note: 'cible' }];
  const fl = [{ y: 54, t: 'addition de HBr' }, { y: 124, t: 'substitution par HO⁻' }, { y: 194, t: 'oxydation ménagée' }];
  return (
    <Cadre h={270} aria="Séquence en trois étapes : éthène, addition de HBr, bromoéthane, substitution par HO⁻, éthanol, oxydation ménagée, éthanal. On remonte depuis la cible : quel groupe faut-il avoir juste avant ?">
      {boites.map(b => (
        <g key={b.t}>
          <rect x={10} y={b.y} width={136} height={40} rx={10} fill={b.note === 'cible' ? '#fff7ed' : '#f8fafc'} stroke={b.note === 'cible' ? ORANGE : '#64748b'} strokeWidth={b.note === 'cible' ? 3 : 1.8} strokeDasharray={b.note === 'départ' ? '6 4' : undefined}/>
          <T x={78} y={b.y + 26} ancre="middle" gras>{b.t}</T>
          {b.note && <T x={156} y={b.y + 26} taille={15.5} couleur={b.note === 'cible' ? ORANGE : GRIS} gras>{b.note === 'cible' ? '◄ cible' : '◄ départ'}</T>}
        </g>))}
      {fl.map(f => (
        <g key={f.t}>
          <line x1={78} y1={f.y - 6} x2={78} y2={f.y + 18} stroke={NOIR} strokeWidth={2.4}/><polygon points={`78,${f.y + 24} 72,${f.y + 14} 84,${f.y + 14}`} fill={NOIR}/>
          <T x={92} y={f.y + 14} taille={15.5} couleur={GRIS}>{f.t}</T>
        </g>))}
    </Cadre>);
}

// 3. Protéger puis déprotéger
export function SvgCarteProtection() {
  // chaque boîte : deux groupes, le groupe en cause porte une forme différente (cercle = carbonyle, carré = acétal) en plus de l'étiquette
  const etapes = [
    { y: 6, a: 'cétone', fa: 'rond', b: 'ester', fb: 'tri' },
    { y: 76, a: 'acétal', fa: 'carre', b: 'ester', fb: 'tri' },
    { y: 146, a: 'acétal', fa: 'carre', b: 'alcool', fb: 'bar' },
    { y: 216, a: 'cétone', fa: 'rond', b: 'alcool', fb: 'bar' },
  ];
  const forme = (f, x, y) => (f === 'rond' ? <circle cx={x} cy={y} r={7} fill="#fff" stroke={NOIR} strokeWidth={2.4}/> : f === 'carre' ? <rect x={x - 7} y={y - 7} width={14} height={14} fill={NOIR}/> : f === 'tri' ? <polygon points={`${x},${y - 8} ${x + 8},${y + 7} ${x - 8},${y + 7}`} fill="#fff" stroke={NOIR} strokeWidth={2.2}/> : <line x1={x - 8} y1={y} x2={x + 8} y2={y} stroke={NOIR} strokeWidth={4}/>);
  const fl = [{ y: 46, n: '1', t: 'protéger : diol, acide' }, { y: 116, n: '2', t: 'LiAlH₄ réduit l’ester' }, { y: 186, n: '3', t: 'déprotéger : eau, acide' }];
  return (
    <Cadre h={266} aria="Protéger puis déprotéger. Cétone et ester : étape 1, protéger la cétone en acétal avec un diol. Acétal et ester : étape 2, LiAlH4 réduit l'ester en alcool. Acétal et alcool : étape 3, déprotéger par l'eau et un acide. Cétone et alcool : molécule cible.">
      {etapes.map(e => (
        <g key={e.y}>
          <rect x={8} y={e.y} width={190} height={40} rx={10} fill={e.a === 'acétal' ? '#eff6ff' : '#f8fafc'} stroke={e.a === 'acétal' ? BLEU : '#64748b'} strokeWidth={e.a === 'acétal' ? 3 : 1.8} strokeDasharray={e.a === 'acétal' ? '7 4' : undefined}/>
          {forme(e.fa, 26, e.y + 20)}<T x={40} y={e.y + 26} gras>{e.a}</T>
          {forme(e.fb, 118, e.y + 20)}<T x={132} y={e.y + 26}>{e.b}</T>
        </g>))}
      {fl.map(f => (
        <g key={f.n}>
          <line x1={103} y1={f.y} x2={103} y2={f.y + 22} stroke={NOIR} strokeWidth={2.4}/><polygon points={`103,${f.y + 28} 97,${f.y + 18} 109,${f.y + 18}`} fill={NOIR}/>
          <T x={118} y={f.y + 20} taille={15.5} couleur={GRIS}>{f.n}. {f.t}</T>
        </g>))}
      <T x={206} y={236} taille={15.5} couleur={ORANGE} gras>◄ cible</T>
    </Cadre>);
}

// 4. Rendement global : chaque étape fait perdre de la matière (exemple générique 80 % puis 50 %)
export function SvgCarteRendementGlobal() {
  const H = 110, base = 150;   // 100 % = 110 de hauteur
  const barres = [{ x: 22, v: 100, t: '100' }, { x: 122, v: 80, t: '80' }, { x: 222, v: 40, t: '40' }];
  return (
    <Cadre h={206} aria="Rendement global : on part de 100, la première étape à 80 % laisse 80, la deuxième à 50 % laisse 40. Le rendement global est le produit des rendements, ici 0,80 fois 0,50 égale 0,40, soit 40 %.">
      {barres.map((b, k) => (
        <g key={b.x}>
          <rect x={b.x} y={base - H * b.v / 100} width={70} height={H * b.v / 100} fill={k === 2 ? '#fff7ed' : '#e0f2fe'} stroke={k === 2 ? ORANGE : BLEU} strokeWidth={2.4} strokeDasharray={k === 2 ? '7 4' : undefined}/>
          <T x={b.x + 35} y={base - H * b.v / 100 - 6} ancre="middle" gras>{b.t} %</T>
        </g>))}
      <line x1={10} y1={base} x2={310} y2={base} stroke={NOIR} strokeWidth={2}/>
      <T x={110} y={16} ancre="middle" couleur={GRIS}>× 0,80</T>
      <path d="M 92 25 L 130 25 M 123 20 L 130 25 L 123 30" fill="none" stroke={GRIS} strokeWidth={2}/>
      <T x={210} y={16} ancre="middle" couleur={GRIS}>× 0,50</T>
      <path d="M 192 25 L 230 25 M 223 20 L 230 25 L 223 30" fill="none" stroke={GRIS} strokeWidth={2}/>
      <T x={57} y={base + 20} ancre="middle" taille={15.5} couleur={GRIS}>départ</T>
      <T x={157} y={base + 20} ancre="middle" taille={15.5} couleur={GRIS}>étape 1</T>
      <T x={257} y={base + 20} ancre="middle" taille={15.5} couleur={GRIS}>étape 2</T>
      <T x={160} y={base + 44} ancre="middle" gras>η global = η₁ × η₂ = 40 %</T>
    </Cadre>);
}

// 5. Les leviers d'une synthèse écoresponsable
export function SvgCarteLeviers() {
  const items = [
    { y: 6, nom: 'Réactif', note: 'moins toxique', f: 'flacon' },
    { y: 66, nom: 'Solvant', note: 'eau ou aucun', f: 'goutte' },
    { y: 126, nom: 'Énergie', note: 'température plus basse', f: 'thermo' },
    { y: 186, nom: 'Déchets', note: 'moins de sous-produits, valorisés', f: 'cycle' },
  ];
  const picto = (f, y) => {
    const cx = 32, cy = y + 26;
    switch (f) {
      case 'flacon': return <g><polygon points={`${cx - 5},${cy - 18} ${cx + 5},${cy - 18} ${cx + 5},${cy - 6} ${cx + 16},${cy + 16} ${cx - 16},${cy + 16} ${cx - 5},${cy - 6}`} fill="#fff" stroke={NOIR} strokeWidth={2.4} strokeLinejoin="round"/></g>;
      case 'goutte': return <g><path d={`M${cx},${cy - 18} C${cx + 16},${cy + 2} ${cx + 14},${cy + 18} ${cx},${cy + 18} C${cx - 14},${cy + 18} ${cx - 16},${cy + 2} ${cx},${cy - 18} Z`} fill="#fff" stroke={NOIR} strokeWidth={2.4}/></g>;
      case 'thermo': return <g><rect x={cx - 5} y={cy - 18} width={10} height={26} rx={5} fill="#fff" stroke={NOIR} strokeWidth={2.4}/><circle cx={cx} cy={cy + 12} r={8} fill="#fff" stroke={NOIR} strokeWidth={2.4}/><line x1={cx} y1={cy - 6} x2={cx} y2={cy + 12} stroke={NOIR} strokeWidth={3}/></g>;
      default: return <g><path d={`M${cx - 14},${cy} A14,14 0 0 1 ${cx + 8},${cy - 12}`} fill="none" stroke={NOIR} strokeWidth={2.6}/><polygon points={`${cx + 14},${cy - 14} ${cx + 2},${cy - 18} ${cx + 8},${cy - 5}`} fill={NOIR}/><path d={`M${cx + 14},${cy} A14,14 0 0 1 ${cx - 8},${cy + 12}`} fill="none" stroke={NOIR} strokeWidth={2.6}/><polygon points={`${cx - 14},${cy + 14} ${cx - 2},${cy + 18} ${cx - 8},${cy + 5}`} fill={NOIR}/></g>;
    }
  };
  return (
    <Cadre h={246} aria="Quatre leviers d'une synthèse écoresponsable : un réactif moins toxique, un solvant moins nocif (eau ou aucun), moins d'énergie (température plus basse), moins de déchets et des sous-produits valorisés.">
      {items.map(i => (
        <g key={i.nom}>
          <rect x={4} y={i.y} width={312} height={52} rx={10} fill="#f8fafc" stroke="#94a3b8" strokeWidth={1.6}/>
          {picto(i.f, i.y)}
          <T x={62} y={i.y + 22} gras>{i.nom}</T>
          <T x={62} y={i.y + 42} couleur={GRIS}>{i.note}</T>
        </g>))}
    </Cadre>);
}

