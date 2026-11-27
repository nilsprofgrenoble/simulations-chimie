// Schémas neutres (ni valeur, ni résultat, ni sens de circulation) pour des exercices d'analyse.
const ENCRE = '#0f172a', GRIS = '#64748b';

// Angle de raccordement θ d'une goutte posée sur un support : seule la définition de l'angle est dessinée.
export function GoutteAngle() {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 6 }}>
      <svg viewBox="0 0 480 215" style={{ width: '100%', display: 'block' }} role="img" aria-label="Goutte de liquide posée sur un support, avec l'angle de raccordement θ entre le support et la tangente à la goutte">
        <rect x="20" y="140" width="440" height="30" fill="#e2e8f0" />
        <text x="30" y="162" fontSize="18" fill={GRIS}>support</text>
        <path d="M140 140 Q150 60 240 56 Q330 60 340 140 Z" fill="#bfdbfe" stroke="#2563eb" strokeWidth="2.5" />
        <text x="250" y="110" fontSize="16" fill={ENCRE} textAnchor="middle">goutte</text>
        <line x1="140" y1="140" x2="215" y2="86" stroke="#dc2626" strokeWidth="2" strokeDasharray="6 4" />
        <path d="M176 140 A36 36 0 0 0 163 116" fill="none" stroke="#dc2626" strokeWidth="2.5" transform="translate(0 0)" />
        <text x="188" y="128" fontSize="20" fontStyle="italic" fill="#dc2626">θ</text>
        <text x="240" y="204" fontSize="17" fill={GRIS} textAnchor="middle">θ : angle entre le support et la tangente</text>
      </svg>
    </div>);
}

// Pile à deux demi-piles reliées par un pont salin, lampe entre les lames : pôles indiqués, aucun sens de circulation.
export function PileLampe({ gauche = 'Zn', droite = 'Ag' }) {
  const bec = (x, nom, pole) => (
    <g>
      <path d={`M${x} 110 L${x} 190 Q${x} 200 ${x + 10} 200 L${x + 90} 200 Q${x + 100} 200 ${x + 100} 190 L${x + 100} 110`} fill="#dbeafe" stroke={GRIS} strokeWidth="2.5" />
      <rect x={x + 42} y="70" width="16" height="110" fill="#94a3b8" stroke={ENCRE} strokeWidth="1.5" />
      <text x={x + 50} y="222" fontSize="22" fill={ENCRE} textAnchor="middle" fontWeight="700">{nom}</text>
      <circle cx={x + 84} cy="62" r="17" fill="#fff" stroke="#dc2626" strokeWidth="2.5" />
      <text x={x + 84} y="70" fontSize="26" fill="#dc2626" textAnchor="middle" fontWeight="800">{pole}</text>
    </g>);
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 6 }}>
      <svg viewBox="0 0 480 240" style={{ width: '100%', display: 'block' }} role="img" aria-label={`Pile ${gauche} / ${droite} : deux demi-piles reliées par un pont salin, lampe branchée entre les deux lames`}>
        {bec(60, gauche, '−')}
        {bec(320, droite, '+')}
        <path d="M110 70 L110 28 L210 28" fill="none" stroke={ENCRE} strokeWidth="2.5" />
        <path d="M370 70 L370 28 L270 28" fill="none" stroke={ENCRE} strokeWidth="2.5" />
        <circle cx="240" cy="28" r="26" fill="#fef9c3" stroke={ENCRE} strokeWidth="2.5" />
        <path d="M226 42 L254 14 M226 14 L254 42" stroke={ENCRE} strokeWidth="2" />
        <path d="M130 140 L130 108 L340 108 L340 140" fill="none" stroke="#a16207" strokeWidth="8" strokeLinejoin="round" opacity="0.55" />
        <text x="240" y="152" fontSize="19" fill={GRIS} textAnchor="middle">pont salin</text>
      </svg>
    </div>);
}
export const DESSINS_LOT6 = { goutteAngle: GoutteAngle, pileLampe: PileLampe };
