// Cartes « À retenir » de la simulation 150 (ondes mécaniques : célérité et retard) : un schéma, une phrase-clé, un exemple chiffré.
import { Formule, indicesProfond } from '../commun';
import { puces } from './Travail';

const BLEU = '#1d4ed8', ROUGE = '#dc2626', ORANGE = '#c2410c', VERT = '#15803d', GRIS = '#475569', NOIR = '#0f172a';
const Sch = ({ aria, h, children }) => (
  <svg viewBox={`0 0 300 ${h}`} role="img" aria-label={aria} style={{ display: 'block', width: '100%', maxWidth: 320, height: 'auto', margin: '6px auto', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8 }}>{children}</svg>);
const bosse = (cx, base, h = 24, w = 18) => { const p = []; for (let dx = -48; dx <= 48; dx += 3) p.push(`${cx + dx},${(base - h * Math.exp(-((dx / w) ** 2))).toFixed(1)}`); return p.join(' '); };
const fl = (x, y, ang, c, t = 6) => <polygon points={`0,0 ${-2 * t},${-t * 0.8} ${-2 * t},${t * 0.8}`} fill={c} transform={`translate(${x},${y}) rotate(${ang})`}/>;

const FICHES = {
  voyage: <>
    <Sch h={158} aria="Deux instants d’une corde : à t₁ la bosse arrive à gauche du point M, à t₂ elle est au niveau de M ; le point M, en orange, est toujours sur la même verticale et a seulement monté">
      <text x="8" y="18" fontSize="13.5" fontWeight="800" fill={GRIS}>t₁ : la bosse arrive</text>
      <line x1="8" y1="62" x2="292" y2="62" stroke="#cbd5e1" strokeWidth="1"/>
      <polyline points={bosse(95, 62)} fill="none" stroke={BLEU} strokeWidth="3"/>
      {fl(150, 40, 0, BLEU, 7)}<line x1="118" y1="40" x2="146" y2="40" stroke={BLEU} strokeWidth="2.5"/>
      <circle cx="205" cy="62" r="7" fill={ORANGE}/><text x="218" y="58" fontSize="15" fontWeight="800" fill={ORANGE}>M</text>
      <text x="8" y="86" fontSize="13.5" fontWeight="800" fill={GRIS}>t₂ : elle est en M</text>
      <line x1="8" y1="130" x2="292" y2="130" stroke="#cbd5e1" strokeWidth="1"/>
      <polyline points={bosse(205, 130)} fill="none" stroke={BLEU} strokeWidth="3"/>
      <circle cx="205" cy="106" r="7" fill={ORANGE}/><text x="218" y="104" fontSize="15" fontWeight="800" fill={ORANGE}>M</text>
      <line x1="205" y1="20" x2="205" y2="136" stroke={ORANGE} strokeWidth="1.5" strokeDasharray="3 4"/>
      <text x="150" y="152" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={ORANGE}>M monte, sur sa verticale</text>
    </Sch>
    {puces(<>Une <strong>onde mécanique progressive</strong> est une perturbation qui se transmet <strong>de proche en proche</strong> dans un milieu matériel, <strong>sans transport de matière</strong>.</>,
      <><strong>Pourquoi</strong> : chaque point entraîne son voisin (comme des ressorts ou des molécules qui se poussent). <strong>Exemple</strong> : la houle avance, le bouchon monte et descend sur place. Le son est une onde <strong>longitudinale</strong>.</>,
      <><strong>Phrase-clé</strong> : « l’onde voyage, la matière reste ».</>,
      <><strong>Idée fausse</strong> : « le point M avance avec l’onde ». <strong>Vrai</strong> : M monte puis redescend, sur place ; seule la perturbation avance.</>)}
  </>,
  retard: <>
    <Sch h={182} aria="Deux signaux en fonction du temps : le pic du capteur 1 arrive à l’instant t₁, celui du capteur 2 à l’instant t₂, plus tard ; la double flèche entre les deux pics est le retard">
      <text x="34" y="20" fontSize="14" fontWeight="800" fill={BLEU}>capteur 1</text><text x="34" y="96" fontSize="14" fontWeight="800" fill={ROUGE}>capteur 2</text>
      <line x1="30" y1="62" x2="285" y2="62" stroke={NOIR} strokeWidth="1.5"/><line x1="30" y1="138" x2="285" y2="138" stroke={NOIR} strokeWidth="1.5"/>
      <polyline points={bosse(95, 62, 34, 11)} fill="none" stroke={BLEU} strokeWidth="3"/><polyline points={bosse(215, 138, 34, 11)} fill="none" stroke={ROUGE} strokeWidth="3"/>
      <line x1="95" y1="22" x2="95" y2="152" stroke={GRIS} strokeWidth="1.5" strokeDasharray="4 3"/><line x1="215" y1="86" x2="215" y2="152" stroke={GRIS} strokeWidth="1.5" strokeDasharray="4 3"/>
      <line x1="95" y1="160" x2="215" y2="160" stroke={ORANGE} strokeWidth="2.5"/>{fl(215, 160, 0, ORANGE, 7)}{fl(95, 160, 180, ORANGE, 7)}
      <text x="155" y="176" textAnchor="middle" fontSize="15" fontWeight="800" fill={ORANGE}>retard Δt</text>
      <text x="290" y="154" textAnchor="end" fontSize="14" fontWeight="700" fill={NOIR}>t</text>
    </Sch>
    {puces(<>Le <strong>retard Δt</strong> est la durée que met la perturbation pour aller d’un point à un autre : le second point subit la même perturbation, <strong>plus tard</strong>.</>,
      <>On le lit entre <strong>deux pics identiques</strong> : Δt = t₂ − t₁. <strong>Exemple</strong> : pics à 0,30 s et 0,90 s, donc Δt = 0,90 − 0,30 = 0,60 s.</>,
      <><strong>Piège</strong> : Δt est un <strong>écart</strong> entre deux dates, pas l’une des deux dates.</>)}
  </>,
  celerite: <>
    <Sch h={132} aria="Triangle des grandeurs : la distance d en haut, la célérité c et la durée Δt en bas ; on cache la grandeur cherchée. À droite, les trois formules : d égale c fois Δt, c égale d divisé par Δt, Δt égale d divisé par c">
      <rect x="20" y="12" width="120" height="48" rx="6" fill="#fef3c7" stroke={ORANGE} strokeWidth="2"/><text x="80" y="45" textAnchor="middle" fontSize="22" fontWeight="800" fill={ORANGE}>d</text>
      <rect x="20" y="60" width="60" height="48" rx="6" fill="#dbeafe" stroke={BLEU} strokeWidth="2"/><text x="50" y="92" textAnchor="middle" fontSize="22" fontWeight="800" fill={BLEU}>c</text>
      <rect x="80" y="60" width="60" height="48" rx="6" fill="#dcfce7" stroke={VERT} strokeWidth="2"/><text x="110" y="92" textAnchor="middle" fontSize="22" fontWeight="800" fill={VERT}>Δt</text>
      <text x="158" y="40" fontSize="15" fontWeight="700" fill={NOIR}>d = c × Δt</text><text x="158" y="68" fontSize="15" fontWeight="700" fill={NOIR}>c = d ÷ Δt</text><text x="158" y="96" fontSize="15" fontWeight="700" fill={NOIR}>Δt = d ÷ c</text>
      <text x="150" y="126" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={GRIS}>on cache ce qu’on cherche</text>
    </Sch>
    <Formule><mi>c</mi><mo>=</mo><mfrac><mi>d</mi><mi>Δt</mi></mfrac></Formule>
    {puces(<>La <strong>célérité</strong> c d’une onde est la distance parcourue par la perturbation divisée par la durée : <strong>m ÷ s = m/s</strong>. <strong>Exemple</strong> : 3,0 m en 0,60 s, donc c = 3,0 ÷ 0,60 = 5,0 m/s.</>,
      <>Dans un milieu donné, <strong>c ne change pas</strong> : si la distance double, le retard double.</>,
      <><strong>Piège</strong> : convertir avant de calculer (cm → m, ms → s, km → m).</>,
      <><strong>Notation</strong> : c (notée v dans le programme) ; à ne pas confondre avec la célérité de la lumière ni avec la concentration.</>)}
  </>,
  localiser: <>
    <Sch h={186} aria="Trois stations A, B et C et trois cercles centrés sur elles ; les trois cercles se coupent en un seul point, marqué d’une croix rouge, qui est l’épicentre">
      <circle cx="60" cy="40" r="101" fill="none" stroke={BLEU} strokeWidth="2.4"/><circle cx="240" cy="50" r="97" fill="none" stroke={VERT} strokeWidth="2.4"/><circle cx="150" cy="122" r="37" fill="none" stroke={ROUGE} strokeWidth="2.4"/>
      {[[60, 40, 'A', BLEU], [240, 50, 'B', VERT], [150, 122, 'C', ROUGE]].map(([x, y, n, c]) => <g key={n}><polygon points={`${x},${y - 9} ${x - 8},${y + 6} ${x + 8},${y + 6}`} fill={NOIR}/><text x={x + 12} y={y + 4} fontSize="16" fontWeight="800" fill={c}>{n}</text></g>)}
      <line x1="141" y1="76" x2="159" y2="94" stroke="#b91c1c" strokeWidth="4"/><line x1="141" y1="94" x2="159" y2="76" stroke="#b91c1c" strokeWidth="4"/>
      <text x="168" y="86" fontSize="14" fontWeight="800" fill="#b91c1c">épicentre</text>
      <text x="150" y="180" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={NOIR}>rayon du cercle = c × Δt</text>
    </Sch>
    {puces(<>La durée de propagation donne une <strong>distance</strong> : d = c × Δt. Une station → un <strong>cercle</strong> ; deux stations → <strong>deux points</strong> ; trois stations → <strong>un seul point</strong>.</>,
      <><strong>Exemple</strong> : éclair puis tonnerre 3,0 s plus tard ; le son va à 340 m/s, donc d = 340 × 3,0 ≈ 1,0 km (« 3 s ≈ 1 km »).</>,
      <><strong>Hypothèses</strong> : l’instant d’émission est connu, le milieu est homogène (même célérité partout), les trajets sont rectilignes et le séisme est superficiel.</>)}
  </>,
  milieux: <>
    <Sch h={164} aria="Barres horizontales proportionnelles à la célérité du son : air 340 mètres par seconde (très courte), eau environ 1 500 mètres par seconde, acier environ 5 900 mètres par seconde (la plus longue)">
      <text x="8" y="16" fontSize="13.5" fontWeight="800" fill={NOIR}>célérité du son (ordre de grandeur)</text>
      {[['air', 340, '340 m/s', 38, '#64748b'], ['eau', 1500, '≈ 1 500 m/s', 76, BLEU], ['acier', 5900, '≈ 5 900 m/s', 114, ORANGE]].map(([n, c, v, y, col]) => {
        const w = Math.max(8, c * 0.0255);
        return <g key={n}><text x="8" y={y + 17} fontSize="15" fontWeight="800" fill={NOIR}>{n}</text><rect x="58" y={y} width={w} height="26" rx="3" fill={col}/>
          {w > 120 ? <text x={58 + w - 6} y={y + 18} textAnchor="end" fontSize="13.5" fontWeight="800" fill="#fff">{v}</text> : <text x={58 + w + 6} y={y + 18} fontSize="13.5" fontWeight="800" fill={NOIR}>{v}</text>}</g>;
      })}
      <text x="150" y="152" textAnchor="middle" fontSize="13.5" fontWeight="700" fill={GRIS}>c plus grande ⇒ retard Δt plus petit</text>
    </Sch>
    {puces(<>La célérité dépend du <strong>milieu</strong> (et de sa température), <strong>pas de la source</strong> : frapper plus fort ne rend pas l’onde plus rapide.</>,
      <>Ordres de grandeur : air ≈ 340 m/s (20 °C), eau ≈ 1 500 m/s, acier ≈ 5 900 m/s ; ondes sismiques P ≈ 6 km/s dans la croûte terrestre.</>,
      <><strong>Exemple</strong> : sur 100 m, le son met 0,29 s dans l’air mais 0,017 s dans l’acier.</>)}
  </>,
  bilan: <>
    <Sch h={170} aria="Quatre encadrés : l’onde voyage et la matière reste ; le retard est la durée entre deux points ; la célérité vaut d divisé par Δt ; la célérité dépend du milieu, air plus petite que eau plus petite que acier">
      {[[8, 8, '①', 'L’onde voyage,', 'la matière reste', BLEU], [152, 8, '②', 'Retard Δt : durée', 'entre deux points', ORANGE], [8, 90, '③', 'c = d ÷ Δt', '(m et s → m/s)', VERT], [152, 90, '④', 'c dépend du milieu :', 'air < eau < acier', '#7e22ce']].map(([x, y, n, a, b, c]) => (
        <g key={n}><rect x={x} y={y} width="140" height="72" rx="8" fill="#fff" stroke={c} strokeWidth="2.4"/><text x={x + 8} y={y + 22} fontSize="16" fontWeight="800" fill={c}>{n}</text>
          <text x={x + 8} y={y + 44} fontSize="13.5" fontWeight="700" fill={NOIR}>{a}</text><text x={x + 8} y={y + 62} fontSize="13.5" fontWeight="700" fill={NOIR}>{b}</text></g>))}
    </Sch>
    {puces(<>Une onde est une <strong>perturbation qui se propage</strong> de proche en proche ; le retard Δt entre deux points donne la célérité : <strong>c = d ÷ Δt</strong>.</>,
      <>Avec c et Δt, on retrouve une <strong>distance</strong> : d = c × Δt ; avec trois stations, on <strong>localise</strong> la source.</>,
      <><strong>Ne pas confondre</strong> : la célérité de l’onde (vitesse de la perturbation) et la vitesse vec(u) d’un point du milieu (il monte et descend sur place).</>)}
  </>,
};

// Une carte « À retenir » (les écritures vec(u) et les indices passent par indicesProfond)
export function Fiche({ id }) { return indicesProfond(FICHES[id]); }
