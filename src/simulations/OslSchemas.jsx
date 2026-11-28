// Cartes « À retenir » de la simulation 321 (grandeurs d'un oscillateur, amortissement et temps caractéristique, quatre régimes, analogie mécanique-électrique).
// viewBox de 300 de large, textes de 12,5 à 16, maxWidth 320.
import { K, svgStyle } from "./schemaOutils";
import * as M from "./oslModele";

const OR = '#ea580c', VERT = '#15803d', BLEU = '#0369a1', VIOLET = '#7c3aed';
const cadre = (aria, h, children) => (
  <svg role="img" aria-label={aria} viewBox={`0 0 300 ${h}`} width="100%" style={{ ...svgStyle, maxWidth: 320 }}>
    <rect x="4" y="4" width="292" height={h - 8} rx="14" fill="#f8fafc" stroke={K.clair}/>{children}
  </svg>);
const t = (x, y, s, o = {}) => <text x={x} y={y} textAnchor={o.a || 'middle'} fontSize={o.size || 13} fontWeight={o.gras ? 800 : 400} fill={o.fill || K.txt} fontStyle={o.it ? 'italic' : undefined}>{s}</text>;
const courbe = (x0, y0, w, h, f, n = 120) => Array.from({ length: n + 1 }, (_, i) => `${(x0 + w * i / n).toFixed(1)},${(y0 - f(i / n) * h).toFixed(1)}`).join(' ');
const fleche2 = (x1, x2, y, c, lab, dy = -7) => (<g stroke={c} fill={c}>
  <line x1={x1} x2={x2} y1={y} y2={y} strokeWidth="2.4"/><polygon points={`${x1},${y} ${x1 + 8},${y - 5} ${x1 + 8},${y + 5}`} stroke="none"/><polygon points={`${x2},${y} ${x2 - 8},${y - 5} ${x2 - 8},${y + 5}`} stroke="none"/>
  <text x={(x1 + x2) / 2} y={y + dy} textAnchor="middle" fontSize="15" fontWeight="800" stroke="none">{lab}</text></g>);

// Carte 1 : amplitude, période, fréquence
export function SvgGrandeursCarte() {
  const x0 = 28, w = 250, yc = 92, h = 44;
  return cadre('Une oscillation sinusoïdale : amplitude A, période T et fréquence f égale à 1 sur T.', 236,
    <g>
      {t(150, 24, 'Un oscillateur harmonique', { size: 15, gras: true })}
      <line x1={x0} x2={x0 + w} y1={yc} y2={yc} stroke="#94a3b8" strokeWidth="1.5"/>
      <polyline points={courbe(x0, yc, w, h, u => Math.cos(2 * Math.PI * 2 * u))} fill="none" stroke={BLEU} strokeWidth="3.4" strokeLinejoin="round"/>
      <line x1={x0 + w / 2} x2={x0 + w / 2} y1={yc} y2={yc - h} stroke={OR} strokeWidth="2.6"/>
      {t(x0 + w / 2 + 6, yc - h / 2 + 5, 'A', { a: 'start', size: 16, gras: true, fill: OR })}
      {fleche2(x0, x0 + w / 2, yc + h + 18, VERT, 'T')}
      {t(150, 176, 'f = 1 / T', { size: 18, gras: true, fill: VIOLET })}
      {t(150, 198, 'T en secondes (s), f en hertz (Hz)', { size: 13 })}
      {t(150, 218, 'Exemple : T = 0,50 s donne f = 2,0 Hz', { size: 13, fill: K.gris })}
    </g>);
}

// Carte 2 : oscillations amorties, pseudopériode et temps caractéristique
export function SvgAmortCarte() {
  const x0 = 24, w = 252, yc = 82, h = 46, f0 = 1.4, z = 0.12, tau = M.tauAmort(f0, z), tF = 3.6;
  const xp = u => x0 + w * u / tF;
  return cadre('Oscillations amorties : l’amplitude décroît comme une exponentielle de temps caractéristique tau, la pseudopériode est voisine de la période propre.', 262,
    <g>
      {t(150, 24, 'Régime pseudopériodique', { size: 15, gras: true })}
      <line x1={x0} x2={x0 + w} y1={yc} y2={yc} stroke="#94a3b8" strokeWidth="1.5"/>
      <polyline points={courbe(x0, yc, w, 1, u => (M.enveloppe(u * tF, 1, f0, z)) * h)} fill="none" stroke={VERT} strokeWidth="2.2" strokeDasharray="6 4"/>
      <polyline points={courbe(x0, yc, w, h, u => M.pos(u * tF, 1, f0, z))} fill="none" stroke={BLEU} strokeWidth="3.2" strokeLinejoin="round"/>
      <line x1={xp(tau)} x2={xp(tau)} y1={yc - h - 4} y2={yc + 8} stroke={OR} strokeWidth="2" strokeDasharray="4 3"/>
      {t(xp(tau) + 5, yc - h + 6, 'τ', { a: 'start', size: 16, gras: true, fill: OR })}
      {t(150, 160, 'amplitude : A(t) = A₀ · e^(−t/τ)', { size: 14, gras: true, fill: VERT })}
      {t(150, 182, 'À t = τ : A = A₀ / e ≈ 0,37 A₀', { size: 13.5 })}
      {t(150, 204, 'Exemple : A₀ = 6,0 cm donne 2,2 cm', { size: 13, fill: K.gris })}
      {t(150, 228, 'Pseudopériode ≈ période propre T₀', { size: 13.5, gras: true, fill: BLEU })}
      {t(150, 247, '(faible amortissement)', { size: 13, fill: K.gris })}
    </g>);
}

// Carte 3 : quatre régimes
export function SvgRegimesCarte() {
  const cases = [['Périodique', 'aucun amortissement', 0, 1.6], ['Pseudopériodique', 'amplitude décroissante', 0.18, 1.6], ['Critique', 'retour le plus rapide', 1, 2.6], ['Apériodique', 'retour lent', 2.2, 3.6]];
  return cadre('Les quatre régimes libres : périodique, pseudopériodique, critique et apériodique.', 262,
    <g>
      {t(150, 22, 'Les quatre régimes libres', { size: 15, gras: true })}
      {cases.map(([nom, desc, z, tF], i) => {
        const cx = 8 + (i % 2) * 144, cy = 36 + Math.floor(i / 2) * 110, w = 132, h = 62;
        return (<g key={nom}>
          <rect x={cx} y={cy} width={w} height={h + 14} rx="8" fill="#fff" stroke={K.clair}/>
          <line x1={cx + 6} x2={cx + w - 6} y1={cy + h / 2 + 7} y2={cy + h / 2 + 7} stroke="#cbd5e1" strokeWidth="1.2"/>
          <polyline points={courbe(cx + 6, cy + h / 2 + 7, w - 12, h / 2 - 4, u => M.pos(u * tF, 1, 1, z), 90)} fill="none" stroke={[BLEU, BLEU, OR, VIOLET][i]} strokeWidth="2.8" strokeLinejoin="round"/>
          {t(cx + w / 2, cy + h + 31, nom, { size: 12.5, gras: true, fill: [BLEU, BLEU, OR, VIOLET][i] })}
          {t(cx + w / 2, cy + h + 46, desc, { size: 11.5, fill: K.gris })}
        </g>);
      })}
    </g>);
}

// Carte 4 : bilan, analogie mécanique-électrique
export function SvgBilanOslCarte() {
  const lig = (y, A, B) => (<g>
    {A.map((x, i) => t(78, y + i * 16, x, { size: 13 }))}<text x="150" y={y + 6} textAnchor="middle" fontSize="16" fill={K.gris}>↔</text>{B.map((x, i) => t(224, y + i * 16, x, { size: 13 }))}</g>);
  return cadre('Analogie : ressort et masse d’un côté, circuit RLC de l’autre ; la résistance joue le rôle des frottements.', 262,
    <g>
      {t(78, 28, 'Ressort + masse', { size: 14, gras: true, fill: BLEU })}{t(224, 28, 'Circuit RLC', { size: 14, gras: true, fill: VIOLET })}
      <line x1="150" x2="150" y1="40" y2="196" stroke={K.clair} strokeWidth="1.4"/>
      {lig(62, ['position x'], ['tension aux bornes', 'du condensateur'])}
      {lig(106, ['frottements'], ['résistance R'])}
      {lig(142, ['énergie cinétique'], ['énergie', 'de la bobine'])}
      {lig(180, ['énergie élastique', 'du ressort'], ['énergie du', 'condensateur'])}
      {t(150, 232, 'Plus l’amortissement est fort, plus on', { size: 13, gras: true })}
      {t(150, 250, 'va vers le régime apériodique', { size: 13, gras: true })}
    </g>);
}
