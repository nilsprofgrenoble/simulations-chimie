// Cartes « À retenir » de la simulation 322 (échange Ec/Ep, pertes par frottements, entretien, analogie mécanique-électrique).
// viewBox de 300 de large, textes de 12,5 à 16, maxWidth 320.
import { K, svgStyle } from "./schemaOutils";
import * as M from "./oseModele";

const OR = '#ea580c', VERT = '#15803d', BLEU = '#0369a1', VIOLET = '#7c3aed', ROUGE = '#dc2626';
const cadre = (aria, h, children) => (
  <svg role="img" aria-label={aria} viewBox={`0 0 300 ${h}`} width="100%" style={{ ...svgStyle, maxWidth: 320 }}>
    <rect x="4" y="4" width="292" height={h - 8} rx="14" fill="#f8fafc" stroke={K.clair}/>{children}
  </svg>);
const t = (x, y, s, o = {}) => <text x={x} y={y} textAnchor={o.a || 'middle'} fontSize={o.size || 13} fontWeight={o.gras ? 800 : 400} fill={o.fill || K.txt} fontStyle={o.it ? 'italic' : undefined}>{s}</text>;
const ress = (x1, x2, y, n = 7, a = 7) => { const h = (x2 - x1 - 8) / n; return [[x1, y], ...Array.from({ length: n }, (_, i) => [x1 + 4 + h * (i + 0.5), y + (i % 2 ? -a : a)]), [x2, y]].map(p => p.join(',')).join(' '); };
// Petit chariot sur ressort : cx = centre du chariot.
const chariot = (cx, y, lab, col) => (<g>
  <rect x="8" y={y - 20} width="7" height="40" fill="#cbd5e1"/><polyline points={ress(15, cx - 22, y)} fill="none" stroke="#64748b" strokeWidth="2.6" strokeLinejoin="round"/>
  <rect x={cx - 22} y={y - 14} width="44" height="26" rx="5" fill="#bae6fd" stroke={col} strokeWidth="2.2"/><circle cx={cx - 12} cy={y + 16} r="3.5" fill="#334155"/><circle cx={cx + 12} cy={y + 16} r="3.5" fill="#334155"/>
  <text x={cx} y={y + 5} textAnchor="middle" fontSize="14" fontStyle="italic" fontWeight="700" fill="#075985">m</text>
  <line x1="8" x2="140" y1={y + 20} y2={y + 20} stroke="#475569" strokeWidth="2"/>{lab}</g>);

// Carte 1 : échange entre énergie potentielle élastique et énergie cinétique
export function SvgEnergiesCarte() {
  return cadre('Un chariot au bout d’un ressort : à l’élongation maximale, l’énergie est potentielle ; au passage par l’équilibre, elle est cinétique. Ep vaut un demi k x carré, Ec un demi m v carré.', 262,
    <g>
      {t(150, 24, 'Deux formes d’énergie qui s’échangent', { size: 14.5, gras: true })}
      <g transform="translate(0,20)">{chariot(118, 56, null, BLEU)}</g>
      <line x1="76" x2="76" y1="44" y2="184" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3"/>{t(222, 74, 'x max', { size: 14, gras: true, fill: BLEU })}{t(222, 92, 'Ep max', { size: 14, gras: true, fill: BLEU })}{t(222, 110, 'Ec = 0', { size: 13, fill: K.gris })}
      <g transform="translate(0,96)">{chariot(76, 56, null, OR)}</g>
      {t(222, 150, 'équilibre', { size: 14, gras: true, fill: OR })}{t(222, 168, 'Ec max', { size: 14, gras: true, fill: OR })}{t(222, 186, 'Ep = 0', { size: 13, fill: K.gris })}
      {t(150, 228, 'Ep = ½ k x²', { size: 15.5, gras: true, fill: BLEU })}
      {t(150, 248, 'Ec = ½ m v²', { size: 15.5, gras: true, fill: OR })}
    </g>);
}

// Carte 2 : pertes par frottements
export function SvgPertesCarte() {
  const x0 = 26, w = 250, yb = 150, h = 84, tF = 6, S = M.serie(1, 0.1, 0, tF, 0.02);
  const tx = u => x0 + w * u / tF, ty = v => yb - v * h;
  const pl = k => S.t.map((u, i) => `${tx(u).toFixed(1)},${ty(S[k][i]).toFixed(1)}`).join(' ');
  return cadre('Avec des frottements, l’énergie mécanique Em, somme de Ec et Ep, diminue au cours du temps : l’énergie perdue est dissipée sous forme de chaleur.', 250,
    <g>
      {t(150, 24, 'Les frottements dissipent l’énergie', { size: 14.5, gras: true })}
      <line x1={x0} x2={x0 + w} y1={yb} y2={yb} stroke="#94a3b8" strokeWidth="1.5"/><line x1={x0} x2={x0} y1={yb} y2={yb - h - 6} stroke="#94a3b8" strokeWidth="1.5"/>
      <polyline points={pl('ep')} fill="none" stroke={BLEU} strokeWidth="1.8" opacity="0.7"/><polyline points={pl('ec')} fill="none" stroke={OR} strokeWidth="1.8" opacity="0.7"/>
      <polyline points={pl('em')} fill="none" stroke={VIOLET} strokeWidth="3.6"/>
      {t(x0 + 4, yb - h - 12, 'E₀', { a: 'start', size: 13, gras: true, fill: K.gris })}{t(x0 + w, yb + 15, 't', { a: 'end', size: 13, fill: K.gris })}
      {t(x0 + 165, yb - 40, 'Em', { a: 'start', size: 15, gras: true, fill: VIOLET })}
      <line x1={tx(1.6)} x2={tx(1.6)} y1={ty(S.em[Math.round(1.6 / 0.02)])} y2={ty(1)} stroke={ROUGE} strokeWidth="2.4"/>
      {t(tx(1.6) + 6, (ty(1) + ty(S.em[Math.round(1.6 / 0.02)])) / 2 + 4, 'perdue', { a: 'start', size: 13, gras: true, fill: ROUGE })}
      {t(150, 188, 'Em(t) = E₀ − énergie dissipée', { size: 14.5, gras: true })}
      {t(150, 208, 'chaleur : amortisseur, air, ressort', { size: 13, fill: ROUGE })}
      {t(150, 228, 'Em = Ec + Ep diminue, sans jamais augmenter', { size: 12.5, fill: K.gris })}
    </g>);
}

// Carte 3 : entretien des oscillations
export function SvgEntretienCarte() {
  const x0 = 26, w = 250, yb = 128, h = 76, tF = 6, A = M.serie(1, 0.1, 0, tF, 0.02), B = M.serie(1, 0.1, 1, tF, 0.02);
  const tx = u => x0 + w * u / tF, ty = v => yb - v * h;
  const pl = (S, k) => S.t.map((u, i) => `${tx(u).toFixed(1)},${ty(S[k][i]).toFixed(1)}`).join(' ');
  return cadre('Un dispositif d’entretien apporte à chaque période l’énergie dissipée : l’énergie mécanique reste constante, l’amplitude aussi.', 252,
    <g>
      {t(150, 24, 'Entretenir : compenser les pertes', { size: 14.5, gras: true })}
      <line x1={x0} x2={x0 + w} y1={yb} y2={yb} stroke="#94a3b8" strokeWidth="1.5"/><line x1={x0} x2={x0} y1={yb} y2={yb - h - 6} stroke="#94a3b8" strokeWidth="1.5"/>
      <polyline points={pl(A, 'em')} fill="none" stroke="#94a3b8" strokeWidth="2.4" strokeDasharray="6 4"/>
      <polyline points={pl(B, 'em')} fill="none" stroke={VERT} strokeWidth="3.6"/>
      {t(x0 + 6, yb - h - 12, 'E₀', { a: 'start', size: 13, gras: true, fill: K.gris })}
      {t(x0 + w - 4, ty(1) - 6, 'avec entretien', { a: 'end', size: 13, gras: true, fill: VERT })}
      {t(x0 + w - 4, ty(0.42) - 6, 'sans entretien', { a: 'end', size: 13, fill: K.gris })}
      <rect x="22" y="148" width="256" height="52" rx="10" fill="#fff" stroke={VERT} strokeWidth="2"/>
      {t(150, 170, 'énergie apportée par période', { size: 14, gras: true, fill: VERT })}
      {t(150, 190, '= énergie dissipée par période', { size: 14, gras: true, fill: ROUGE })}
      {t(150, 222, 'L’entretien ne crée pas l’oscillation : il compense', { size: 12.5, fill: K.gris })}
      {t(150, 238, 'seulement ce que les frottements dissipent.', { size: 12.5, fill: K.gris })}
    </g>);
}

// Carte 4 : analogie ressort-chariot / circuit LC
export function SvgAnalogieEnergieCarte() {
  const lignes = [['Ep = ½ k x²', 'ressort', 'Ec = ½ C u²', 'condensateur', BLEU], ['Ec = ½ m v²', 'masse', 'Ec = ½ L i²', 'bobine', OR], ['frottements', 'amortisseur', 'résistance R', 'effet Joule', ROUGE], ['entretien', 'moteur, électroaimant', 'entretien', 'amplificateur', VERT]];
  const aff = ['Ep = ½ k x²', 'Ec = ½ m v²', 'frottements', 'entretien'], aff2 = ['½ C u²', '½ L i²', 'résistance R', 'dispositif électronique'];
  return cadre('Analogie : le chariot et son ressort correspondent au circuit LC. L’énergie potentielle est stockée dans le condensateur, l’énergie cinétique dans la bobine, les frottements correspondent à la résistance.', 262,
    <g>
      {t(150, 24, 'Mécanique et électricité', { size: 14.5, gras: true })}
      {t(78, 46, 'chariot-ressort', { size: 13, gras: true, fill: K.gris })}{t(224, 46, 'circuit LC', { size: 13, gras: true, fill: K.gris })}
      {lignes.map((l, i) => { const y = 56 + i * 48; return (<g key={i}>
        <rect x="12" y={y} width="126" height="38" rx="9" fill="#fff" stroke={l[4]} strokeWidth="2"/><rect x="162" y={y} width="126" height="38" rx="9" fill="#fff" stroke={l[4]} strokeWidth="2"/>
        <text x="150" y={y + 25} textAnchor="middle" fontSize="18" fontWeight="800" fill={l[4]}>↔</text>
        {t(75, y + 17, aff[i], { size: 14, gras: true, fill: l[4] })}{t(75, y + 32, l[1], { size: 12.5, fill: K.gris })}
        {t(225, y + 17, aff2[i], { size: i === 3 ? 12.5 : 14, gras: true, fill: l[4] })}{t(225, y + 32, l[3], { size: 12.5, fill: K.gris })}
      </g>); })}
      {t(150, 258 - 6, 'Même échange d’énergie, mêmes pertes', { size: 12.5, fill: K.gris })}
    </g>);
}
