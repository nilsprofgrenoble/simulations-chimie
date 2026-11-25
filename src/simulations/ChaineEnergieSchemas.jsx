// Schémas de la simulation 233 (chaîne énergétique et rendement) : scène en chaîne (réservoirs en rectangles, convertisseurs en ellipses, flèches d'épaisseur proportionnelle à l'énergie) et cartes « À retenir ».
// Règles : police ≥ 15 dans un viewBox de 400 de large (indices ≥ 12), tout le texte dans le viewBox, aucune valeur de réponse dans les aria-label des scènes du parcours.
const COL = { bleu: '#0369a1', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', encre: '#0f172a', fil: '#334155', violet: '#6d28d9' };
const base = { width: '100%', maxWidth: 440, margin: '0 auto', display: 'block', background: 'white', borderRadius: 8, border: '1px solid #d5dfeb', height: 'auto' };
const halo = { stroke: 'white', strokeWidth: 4, paintOrder: 'stroke' };
const Fond = ({ children, h = 232, label }) => <svg viewBox={`0 0 400 ${h}`} style={base} role="img" aria-label={label}>{children}</svg>;
const Fleche = ({ x1, y1, x2, y2, c = COL.fil, w = 3 }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 9 + w * 0.8, d = 0.5;
  const p = [[x2, y2], [x2 - L * Math.cos(a - d), y2 - L * Math.sin(a - d)], [x2 - L * Math.cos(a + d), y2 - L * Math.sin(a + d)]].map(z => z.join(',')).join(' ');
  return <g><line x1={x1} y1={y1} x2={x2 - (L - 2) * Math.cos(a)} y2={y2 - (L - 2) * Math.sin(a)} stroke={c} strokeWidth={w} strokeLinecap="butt"/><polygon points={p} fill={c}/></g>;
};
// Symbole avec indice lisible : E + r en indice
const Sym = ({ x, y, b, s, size = 18, c = COL.encre, anchor = 'middle', w = 800 }) => <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={w} fill={c}>{b}<tspan fontSize={Math.max(12, size * 0.72)} dy={size * 0.22}>{s}</tspan></text>;
const Boite = ({ x, y = 14, w = 108, h = 70, titre, val, c, sym }) => <g><rect x={x} y={y} width={w} height={h} rx="10" fill="white" stroke={c} strokeWidth="3"/>
  {sym ? <Sym x={x + w / 2} y={y + 26} b={sym[0]} s={sym[1]} size={16} c={COL.gris} w={600}/> : <text x={x + w / 2} y={y + 26} textAnchor="middle" fontSize="15" fill={COL.gris}>{titre}</text>}
  <text x={x + w / 2} y={y + 54} textAnchor="middle" fontSize="20" fontWeight="800" fill={c}>{val}</text></g>;
const Op = ({ x, y = 56, t }) => <text x={x} y={y + 8} textAnchor="middle" fontSize="26" fontWeight="800" fill={COL.encre}>{t}</text>;
const Trois = ({ a, b, c, op1 = '+', op2 = '=' }) => <g><Boite x={8} {...a}/><Op x={132} t={op1}/><Boite x={146} {...b}/><Op x={270} t={op2}/><Boite x={284} {...c}/></g>;
const Elli = ({ cx, cy, rx = 50, ry = 36, nom, c = COL.bleu, sous }) => <g><ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#f0f9ff" stroke={c} strokeWidth="3"/><text x={cx} y={cy + (sous ? -2 : 6)} textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>{nom}</text>{sous && <text x={cx} y={cy + 19} textAnchor="middle" fontSize="16" fontWeight="800" fill={c}>{sous}</text>}</g>;
const Rect = ({ x, y, w = 62, h = 56, nom, c = COL.gris }) => <g><rect x={x} y={y} width={w} height={h} rx="6" fill="white" stroke={c} strokeWidth="3"/><text x={x + w / 2} y={y + h / 2 + 6} textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>{nom}</text></g>;

// ═════════ Scène : chaîne énergétique de 1 ou 2 convertisseurs ; conv = [{ nom, ein, eout }] (énergies relatives, flèches proportionnelles) ═════════
export function SceneChaine({ conv, emax }) {
  const n = conv.length, M = emax || conv[0].ein, W = e => 3 + 15 * Math.max(0, e) / M;
  const cx = n === 1 ? [200] : [140, 262], rx = n === 1 ? 52 : 42, cy = 92;
  const xs = [66, ...cx.map((c, i) => [c - rx, c + rx]).flat(), 334];
  const segs = []; // flèches : source -> conv1 -> ... -> charge
  for (let i = 0; i <= n; i++) segs.push({ x1: xs[2 * i], x2: xs[2 * i + 1], e: i === 0 ? conv[0].ein : conv[i - 1].eout });
  return (
    <svg viewBox="0 0 400 244" style={base} role="img" aria-label={`Schéma d’une chaîne énergétique : une source cède de l’énergie à ${n === 1 ? 'un convertisseur' : 'deux convertisseurs en série'} ; une partie arrive à la charge (énergie utile), le reste est dissipé par transfert thermique vers l’extérieur. L’épaisseur des flèches est proportionnelle à l’énergie transférée.`}>
      <Rect x={4} y={cy - 28} w={62} nom="source"/>
      <Rect x={334} y={cy - 28} w={62} nom="charge"/>
      {segs.map((s, i) => <Fleche key={i} x1={s.x1} y1={cy} x2={s.x2} y2={cy} c={i === n ? COL.vert : COL.bleu} w={W(s.e)}/>)}
      {cx.map((c, i) => <Elli key={i} cx={c} cy={cy} rx={rx} nom={conv[i].nom}/>)}
      {cx.map((c, i) => { const q = conv[i].ein - conv[i].eout; return q > 0.001 ? <Fleche key={i} x1={c} y1={cy + 38} x2={c} y2={196} c={COL.rouge} w={W(q)}/> : null; })}
      {cx.map((c, i) => <text key={i} x={c} y={226} textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.rouge} {...halo}>{cx.length > 1 ? "dissipée" : "dissipée (chaleur)"}</text>)}
      <text x={(xs[0] + xs[1]) / 2 + 2} y={cy - 36} textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.bleu} {...halo}>reçue</text>
      <text x={(xs[2 * n] + xs[2 * n + 1]) / 2} y={cy - 36} textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.vert} {...halo}>utile</text>
    </svg>);
}

// ═════════ Carte A : réservoir (rectangle) et convertisseur (ellipse) ═════════
export function SvgConvertisseur() {
  return (
    <Fond h={206} label="Schéma : un réservoir est représenté par un rectangle, son énergie stockée varie ; un convertisseur est représenté par une ellipse, son énergie stockée ne varie pas.">
      <Rect x={22} y={16} w={130} h={66} nom="réservoir" c={COL.gris}/>
      <Elli cx={290} cy={49} rx={72} ry={36} nom="convertisseur"/>
      <text x="87" y="108" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>rectangle</text>
      <text x="87" y="130" textAnchor="middle" fontSize="15" fill={COL.gris}>énergie stockée</text>
      <text x="87" y="150" textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.orange}>qui varie</text>
      <text x="290" y="108" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.encre}>ellipse</text>
      <text x="290" y="130" textAnchor="middle" fontSize="15" fill={COL.gris}>énergie stockée</text>
      <text x="290" y="150" textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.orange}>qui ne varie pas</text>
      <rect x="40" y="166" width="320" height="30" rx="8" fill="#eff6ff" stroke={COL.bleu} strokeWidth="2"/>
      <text x="200" y="187" textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.bleu}>convertisseur : reçu = cédé</text>
    </Fond>);
}

// ═════════ Carte B : conservation (500 J = 350 J + 150 J) ═════════
export function SvgConservation() {
  return (
    <Fond h={218} label="Schéma : l’énergie reçue par un convertisseur est égale à l’énergie utile plus l’énergie dissipée par transfert thermique.">
      <Trois a={{ titre: 'reçue', sym: ['E', 'r'], val: '500 J', c: COL.bleu }} b={{ titre: 'utile', sym: ['E', 'u'], val: '350 J', c: COL.vert }} c={{ titre: 'dissipée', sym: ['Q', ''], val: '150 J', c: COL.rouge }} op1="=" op2="+"/>
      <rect x="40" y="106" width="224" height="22" rx="4" fill="#dcfce7" stroke={COL.vert} strokeWidth="2"/>
      <rect x="264" y="106" width="96" height="22" rx="4" fill="#fee2e2" stroke={COL.rouge} strokeWidth="2"/>
      <text x="152" y="146" textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.vert}>utile</text>
      <text x="312" y="146" textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.rouge}>dissipée</text>
      <text x="200" y="182" textAnchor="middle" fontSize="18" fontWeight="800" fill={COL.encre}>reçue = utile + dissipée</text>
      <text x="200" y="206" textAnchor="middle" fontSize="15" fill={COL.gris}>l’énergie se conserve (en joules, J)</text>
    </Fond>);
}

// ═════════ Carte C : rendement η = utile ÷ reçue (350 J / 500 J = 70 %) ═════════
export function SvgRendement() {
  return (
    <Fond h={204} label="Schéma : le rendement d’un convertisseur est le quotient de l’énergie utile par l’énergie reçue.">
      <Trois a={{ titre: 'utile', sym: ['E', 'u'], val: '350 J', c: COL.vert }} b={{ titre: 'reçue', sym: ['E', 'r'], val: '500 J', c: COL.bleu }} c={{ titre: 'rendement η', val: '70 %', c: COL.violet }} op1="÷" op2="="/>
      <text x="200" y="118" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.encre}>η = utile ÷ reçue</text>
      <text x="200" y="146" textAnchor="middle" fontSize="16" fill={COL.gris}>(ou puissance utile ÷ puissance reçue)</text>
      <rect x="50" y="160" width="300" height="32" rx="8" fill="#f5f3ff" stroke={COL.violet} strokeWidth="2"/>
      <text x="200" y="182" textAnchor="middle" fontSize="16" fontWeight="700" fill={COL.violet}>toujours entre 0 et 100 %</text>
    </Fond>);
}

// ═════════ Carte D : deux convertisseurs en série (100 J → 90 J → 45 J) ═════════
export function SvgSerie() {
  return (
    <Fond h={216} label="Schéma : deux convertisseurs placés l’un derrière l’autre ; le rendement global est le produit des deux rendements.">
      <Fleche x1={8} y1={52} x2={74} y2={52} c={COL.bleu} w={14}/>
      <Elli cx={124} cy={52} rx={46} ry={32} nom="η₁" sous="90 %" c={COL.violet}/>
      <Fleche x1={170} y1={52} x2={226} y2={52} c={COL.bleu} w={12}/>
      <Elli cx={276} cy={52} rx={46} ry={32} nom="η₂" sous="50 %" c={COL.violet}/>
      <Fleche x1={322} y1={52} x2={392} y2={52} c={COL.vert} w={7}/>
      <text x="40" y="22" textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.bleu}>100 J</text>
      <text x="198" y="22" textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.bleu}>90 J</text>
      <text x="358" y="22" textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.vert}>45 J</text>
      <rect x="30" y="110" width="340" height="44" rx="10" fill="#f5f3ff" stroke={COL.violet} strokeWidth="2.5"/>
      <text x="200" y="138" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.violet}>η = η₁ × η₂ = 0,90 × 0,50 = 45 %</text>
      <text x="200" y="182" textAnchor="middle" fontSize="15" fill={COL.gris}>chaque étape perd une part de l’énergie</text>
      <text x="200" y="204" textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.encre}>le rendement global est le plus petit de tous</text>
    </Fond>);
}

// ═════════ Carte E : l'énergie utile dépend de l'appareil ═════════
export function SvgUtile() {
  const L = (y, nom, utile) => <g><rect x="8" y={y} width="384" height="42" rx="8" fill="white" stroke="#cbd5e1" strokeWidth="1.5"/>
    <text x="20" y={y + 27} fontSize="16" fontWeight="800" fill={COL.encre}>{nom}</text>
    <rect x="128" y={y + 8} width="150" height="26" rx="13" fill="#dcfce7" stroke={COL.vert} strokeWidth="2"/><text x="203" y={y + 27} textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.vert}>{utile}</text>
    <rect x="288" y={y + 8} width="96" height="26" rx="13" fill="#fee2e2" stroke={COL.rouge} strokeWidth="2"/><text x="336" y={y + 27} textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.rouge}>chaleur</text></g>;
  return (
    <Fond h={216} label="Schéma : pour une lampe, un moteur et une plaque de cuisson, l’énergie utile est différente ; l’énergie dissipée est toujours un transfert thermique.">
      <text x="203" y="22" textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.vert}>énergie utile</text>
      <text x="336" y="22" textAnchor="middle" fontSize="15" fontWeight="700" fill={COL.rouge}>dissipée</text>
      {L(34, 'lampe', 'lumière')}{L(84, 'moteur', 'travail mécanique')}{L(134, 'plaque', 'chaleur utile')}
      <text x="200" y="204" textAnchor="middle" fontSize="15" fill={COL.gris}>utile = ce pour quoi l’appareil est conçu</text>
    </Fond>);
}

// ═════════ Carte F : bilan ═════════
export function SvgBilanChaine() {
  return (
    <Fond h={218} label="Schéma de synthèse : conservation de l’énergie, rendement d’un convertisseur, rendement d’une chaîne.">
      <rect x="10" y="10" width="380" height="58" rx="10" fill="#eff6ff" stroke={COL.bleu} strokeWidth="2.5"/>
      <text x="200" y="36" textAnchor="middle" fontSize="15" fill={COL.gris}>conservation</text>
      <text x="200" y="58" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.bleu}>reçue = utile + dissipée</text>
      <rect x="10" y="78" width="380" height="58" rx="10" fill="#f5f3ff" stroke={COL.violet} strokeWidth="2.5"/>
      <text x="200" y="104" textAnchor="middle" fontSize="15" fill={COL.gris}>rendement</text>
      <text x="200" y="126" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.violet}>η = utile ÷ reçue ≤ 100 %</text>
      <rect x="10" y="146" width="380" height="58" rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2.5"/>
      <text x="200" y="172" textAnchor="middle" fontSize="15" fill={COL.gris}>en série</text>
      <text x="200" y="194" textAnchor="middle" fontSize="19" fontWeight="800" fill={COL.vert}>η = η₁ × η₂ × …</text>
    </Fond>);
}
