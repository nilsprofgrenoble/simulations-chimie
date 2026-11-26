// Schémas des cartes « À retenir » de la simulation 306 (RMN du proton, STL). viewBox de 300, texte de 12,5.
const GRIS = '#475569', BLEU = '#0369a1', ORANGE = '#c2410c', VERT = '#15803d', ROUGE = '#b91c1c', VIOLET = '#6d28d9', ENCRE = '#0f172a';
const svgStyle = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px' };
const T = ({ x, y, children, a = 'start', c = ENCRE, w = 400 }) => <text x={x} y={y} textAnchor={a} fontSize="12.5" fontWeight={w} fill={c}>{children}</text>;
const Svg = ({ h, aria, children }) => <svg viewBox={`0 0 300 ${h}`} style={svgStyle} role="img" aria-label={aria}>{children}</svg>;
const XD = d => 24 + (10 - d) * 25.6;   // δ de 10 (gauche) à 0 (droite)

// Banque de déplacements chimiques : cinq zones, qui se recouvrent en partie
const ZONES = [
  { l: 'H–C (alkyle)', a: 0.8, b: 1.8, c: BLEU },
  { l: 'H–C–C–Cl ou Br', a: 1.6, b: 2.5, c: VIOLET },
  { l: 'H–C–C=O', a: 2.0, b: 2.7, c: VERT },
  { l: 'H–C–O, Cl ou Br', a: 3.3, b: 4.4, c: ROUGE },
  { l: 'H–C(Cl)₂', a: 5.5, b: 6.0, c: ORANGE },
];
export const FBanque = () => (
  <Svg h={206} aria="Banque de données : zones usuelles de déplacement chimique du proton, de 0,8 à 1,8 ppm pour un H d'alkyle, de 1,6 à 2,5 ppm pour un H voisin d'un carbone lié à Cl ou Br, de 2,0 à 2,7 ppm pour un H voisin d'un C=O, de 3,3 à 4,4 ppm pour un H d'un carbone lié à O, Cl ou Br, de 5,5 à 6,0 ppm pour un H d'un carbone lié à deux Cl. Les zones se recouvrent en partie.">
    <T x={150} y={14} a="middle" c={GRIS}>zones usuelles de δ (± 0,2 ppm)</T>
    {ZONES.map((z, i) => { const y = 28 + i * 26, x1 = XD(z.b), x2 = XD(z.a);
      return <g key={z.l}><rect x={x1} y={y} width={x2 - x1} height="16" rx="4" fill={z.c} opacity="0.88"/>
        <T x={x1 - 6} y={y + 12.5} a="end" c={z.c} w={700}>{z.l}</T></g>; })}
    <line x1={14} y1={166} x2={290} y2={166} stroke={GRIS} strokeWidth="2" strokeLinecap="round"/>
    {[10, 8, 6, 4, 2, 0].map(d => <g key={d}><line x1={XD(d)} y1={166} x2={XD(d)} y2={173} stroke={GRIS} strokeWidth="1.6"/><T x={XD(d)} y={189} a="middle" c={GRIS}>{d}</T></g>)}
    <T x={150} y={204} a="middle" w={800}>δ (ppm)</T>
  </Svg>);

// Méthode d'attribution en quatre temps
const ETAPES = [
  ['1', 'Compter les signaux', 'un signal par groupe de H', BLEU],
  ['2', 'Lire δ', 'la banque donne le type de proton', ROUGE],
  ['3', 'Lire l’intégration', 'nombre de H du signal', ORANGE],
  ['4', 'Lire la multiplicité', 'n voisins : n + 1 raies', VERT],
];
export const FMethodeStl = () => (
  <Svg h={238} aria="Méthode pour attribuer les signaux d'un spectre : compter les signaux, lire le déplacement chimique dans la banque de données, lire l'intégration pour le nombre de H, lire la multiplicité pour le nombre de voisins, puis attribuer chaque signal à un groupe de la molécule.">
    {ETAPES.map(([n, t, s, c], i) => { const y = 6 + i * 46;
      return <g key={n}><rect x="8" y={y} width="284" height="38" rx="9" fill="#f8fafc" stroke={c} strokeWidth="2"/>
        <circle cx="30" cy={y + 19} r="12" fill={c}/><text x="30" y={y + 24} textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">{n}</text>
        <T x={52} y={y + 16} w={800}>{t}</T><T x={52} y={y + 31} c={GRIS}>{s}</T></g>; })}
    <path d="M150,192 v10" stroke={GRIS} strokeWidth="2.4"/><polygon points="150,212 143,200 157,200" fill={GRIS}/>
    <rect x="8" y="214" width="284" height="20" rx="9" fill={ENCRE}/><text x="150" y="228" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#fff">chaque signal ↔ un groupe de H</text>
  </Svg>);
