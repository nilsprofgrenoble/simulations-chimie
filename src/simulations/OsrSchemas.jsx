// Cartes « À retenir » de la simulation 323 (régime forcé, résonance, facteur de qualité, amortissement et danger).
// viewBox de 300 de large, textes de 12,5 à 16, maxWidth 320.
import { K, svgStyle } from "./schemaOutils";
import * as M from "./osrModele";
import { FormuleSvg } from "../svgFrac";

const OR = '#ea580c', VERT = '#15803d', BLEU = '#0369a1', VIOLET = '#7c3aed', ROUGE = '#dc2626';
const cadre = (aria, h, children) => (
  <svg role="img" aria-label={aria} viewBox={`0 0 300 ${h}`} width="100%" style={{ ...svgStyle, maxWidth: 320 }}>
    <rect x="4" y="4" width="292" height={h - 8} rx="14" fill="#f8fafc" stroke={K.clair}/>{children}
  </svg>);
const t = (x, y, s, o = {}) => <text x={x} y={y} textAnchor={o.a || 'middle'} fontSize={o.size || 13} fontWeight={o.gras ? 800 : 400} fill={o.fill || K.txt} fontStyle={o.it ? 'italic' : undefined}>{s}</text>;
const sin = (x0, w, y, A, periodes, col, dec = 0, sw = 2.6) => { const p = []; for (let i = 0; i <= 120; i++) { const u = i / 120; p.push(`${(x0 + w * u).toFixed(1)},${(y - A * Math.sin(2 * Math.PI * periodes * u - dec)).toFixed(1)}`); } return <polyline points={p.join(' ')} fill="none" stroke={col} strokeWidth={sw} strokeLinejoin="round"/>; };
// Courbe de résonance de la carte : fréquence propre 2 Hz sur un axe 0-4 Hz.
const reso = (x0, w, yb, h, Q, col, sw = 3) => { const f0 = 2, Am = M.ampMax(f0, 10), p = []; for (let f = 0.02; f <= 4; f += 0.04) p.push(`${(x0 + w * f / 4).toFixed(1)},${(yb - Math.min(M.amp(f, f0, Q) / Am, 1.02) * h).toFixed(1)}`); return <polyline points={p.join(' ')} fill="none" stroke={col} strokeWidth={sw} strokeLinejoin="round"/>; };

// Carte 1 : en régime permanent, l'oscillateur suit l'excitateur
export function SvgForceCarte() {
  return cadre('L’excitateur impose sa fréquence : en régime permanent, l’oscillateur oscille à la fréquence de l’excitateur, avec une amplitude constante.', 220,
    <g>
      {t(150, 24, 'Oscillateur excité : régime permanent', { size: 14.5, gras: true })}
      {sin(24, 252, 72, 22, 3, OR, 0, 2.4)}{t(150, 106, 'excitateur : fréquence fe', { size: 13, gras: true, fill: OR })}
      {sin(24, 252, 152, 34, 3, BLEU, 0.9, 2.8)}{t(150, 196, 'oscillateur : même fréquence fe', { size: 13, gras: true, fill: BLEU })}
      {t(150, 212, 'amplitude constante', { size: 12.5, fill: K.gris })}
    </g>);
}

// Carte 2 : courbe de résonance
export function SvgResoCarte() {
  const x0 = 28, w = 244, yb = 150, h = 92;
  return cadre('Courbe de résonance : l’amplitude des oscillations passe par un maximum quand la fréquence d’excitation est voisine de la fréquence propre de l’oscillateur.', 232,
    <g>
      {t(150, 24, 'La résonance', { size: 14.5, gras: true })}
      <line x1={x0} x2={x0 + w} y1={yb} y2={yb} stroke="#94a3b8" strokeWidth="1.5"/><line x1={x0} x2={x0} y1={yb} y2={yb - h - 8} stroke="#94a3b8" strokeWidth="1.5"/>
      {reso(x0, w, yb, h, 6, BLEU)}
      <line x1={x0 + w / 2} x2={x0 + w / 2} y1={yb - h} y2={yb} stroke={VIOLET} strokeWidth="1.8" strokeDasharray="5 4"/>
      {t(x0 + w / 2 + 6, yb + 15, 'fres ≈ f0', { a: 'start', size: 13, gras: true, fill: VIOLET })}{t(x0 + 4, yb - h - 12, 'amplitude', { a: 'start', size: 12.5, fill: K.gris })}{t(x0 + w, yb + 15, 'fe', { a: 'end', size: 13, fill: K.gris })}
      {t(150, 190, 'amplitude maximale à la résonance', { size: 14, gras: true, fill: VIOLET })}
      {t(150, 210, 'fres voisine de la fréquence propre f0', { size: 12.5, fill: K.gris })}
    </g>);
}

// Carte 3 : largeur de bande et facteur de qualité
export function SvgQCarte() {
  const x0 = 28, w = 244, yb = 136, h = 84, Am = M.ampMax(2, 10), b = M.bande(2, 10), xb = f => x0 + w * f / 4, yh = yb - h / Math.SQRT2;
  void Am;
  return cadre('Largeur de bande Δf : largeur de la courbe de résonance à l’amplitude maximale divisée par racine de deux. Le facteur de qualité est Q égal à fres divisé par Δf.', 258,
    <g>
      {t(150, 24, 'Facteur de qualité', { size: 14.5, gras: true })}
      <line x1={x0} x2={x0 + w} y1={yb} y2={yb} stroke="#94a3b8" strokeWidth="1.5"/><line x1={x0} x2={x0} y1={yb} y2={yb - h - 8} stroke="#94a3b8" strokeWidth="1.5"/>
      {reso(x0, w, yb, h, 10, BLEU)}
      <line x1={xb(b.f1)} x2={xb(b.f2)} y1={yh} y2={yh} stroke={VERT} strokeWidth="3"/>
      <line x1={xb(b.f1)} x2={xb(b.f1)} y1={yh} y2={yb} stroke={VERT} strokeDasharray="4 3"/><line x1={xb(b.f2)} x2={xb(b.f2)} y1={yh} y2={yb} stroke={VERT} strokeDasharray="4 3"/>
      {t(xb(2) + 50, yh + 4, 'Δf', { a: 'start', size: 14, gras: true, fill: VERT })}{t(x0 + w, yb + 15, 'fe', { a: 'end', size: 13, fill: K.gris })}
      <FormuleSvg x={150} y={178} s={16} w={200} c={K.txt} parts={['Q = ', { h: 'fres', b: 'Δf' }]}/>
      {t(150, 204, 'Δf : largeur à 70 % de l’amplitude maximale', { size: 12.5, fill: K.gris })}
      {t(150, 226, 'Q grand : pic étroit, bien marqué', { size: 13, gras: true, fill: BLEU })}
      {t(150, 244, 'Q petit : pic large et aplati', { size: 13, gras: true, fill: ROUGE })}
    </g>);
}

// Carte 4 : amortissement, facteur de qualité, danger
export function SvgAmortCarte() {
  const x0 = 28, w = 244, yb = 140, h = 90;
  return cadre('Moins l’amortissement est fort, plus le facteur de qualité est grand et plus la résonance est marquée. Pour limiter une résonance dangereuse, on augmente l’amortissement.', 252,
    <g>
      {t(150, 24, 'Amortissement et résonance', { size: 14.5, gras: true })}
      <line x1={x0} x2={x0 + w} y1={yb} y2={yb} stroke="#94a3b8" strokeWidth="1.5"/><line x1={x0} x2={x0} y1={yb} y2={yb - h - 8} stroke="#94a3b8" strokeWidth="1.5"/>
      {reso(x0, w, yb, h, 10, BLEU)}{reso(x0, w, yb, h, 2.5, ROUGE)}
      {t(x0 + w / 2 + 16, yb - h + 6, 'Q grand', { a: 'start', size: 13, gras: true, fill: BLEU })}{t(x0 + w / 2 + 14, yb - 50, 'Q petit', { a: 'start', size: 13, gras: true, fill: ROUGE })}
      {t(x0 + w, yb + 15, 'fe', { a: 'end', size: 13, fill: K.gris })}
      {t(150, 178, 'amortissement faible → Q grand', { size: 13, gras: true, fill: BLEU })}
      {t(150, 198, 'amortissement fort → Q petit', { size: 13, gras: true, fill: ROUGE })}
      {t(150, 226, 'limiter le danger : amortir davantage', { size: 12.5, fill: K.gris })}
    </g>);
}
