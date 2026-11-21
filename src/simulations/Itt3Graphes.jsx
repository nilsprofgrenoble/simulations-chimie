// Schémas des cartes « À retenir » de la simulation « Thixotropie : le test 3ITT » (BTS MDC).
// SVG natif ; viewBox de 300 de large, textes ≥ 13, plafond maxWidth 320.

import { KIT } from "../commun";
import { NOIR, GRIS, ORANGE, BLEU, ROUGE } from "./Travail";
import { Svg } from "./RheoCourbesGraphes";

const VERT = "#15803d";

const axes = (x0, y0, x1, y1) => <polyline points={`${x0},${y1} ${x0},${y0} ${x1 > x0 ? x1 : x0},${y0}`} fill="none" stroke={NOIR} strokeWidth="1.6" />;

// Carte 1 : les trois intervalles du test (gradient imposé en haut, viscosité mesurée en bas).
export function FTroisIntervalles() {
  const X = (t) => 46 + (t / 120) * 224; // t de 0 à 120 s
  const haut = "46,96 " + `${X(0)},92 ${X(20)},92 ${X(20)},34 ${X(40)},34 ${X(40)},92 ${X(120)},92`;
  // η(t) qualitatif : plateau haut, chute, remontée lente
  const eta = [[0, 150], [20, 150], [20.5, 226], [40, 230]];
  const rem = Array.from({ length: 25 }, (_, i) => { const t = 40 + (i * 80) / 24; return [t, 226 - 76 * (1 - Math.exp(-(t - 40) / 22))]; });
  const pe = [...eta, ...rem].map(([t, y]) => `${X(t).toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <Svg aria="Test 3ITT en trois intervalles : le gradient de vitesse est faible, puis fort, puis faible ; la viscosité chute au deuxième intervalle puis remonte lentement au troisième" vb="0 0 300 268" maxWidth={320}>
      <polyline points="46,24 46,100 272,100" fill="none" stroke={NOIR} strokeWidth="1.6" />
      <polyline points={haut} fill="none" stroke={ROUGE} strokeWidth="3" strokeLinejoin="round" />
      <text x="6" y="18" fontSize="13.5" fill={KIT.txt2}>γ̇ ↑</text>
      <text x="52" y="86" fontSize="13.5" fontWeight="800" fill={NOIR}>1</text>
      <text x={X(30) - 4} y="28" fontSize="13.5" fontWeight="800" fill={NOIR}>2</text>
      <text x={X(80)} y="86" fontSize="13.5" fontWeight="800" fill={NOIR}>3</text>
      {[20, 40].map((t) => <line key={t} x1={X(t)} y1="24" x2={X(t)} y2="238" stroke={GRIS} strokeDasharray="4 4" />)}
      <polyline points="46,124 46,238 272,238" fill="none" stroke={NOIR} strokeWidth="1.6" />
      <polyline points={pe} fill="none" stroke={BLEU} strokeWidth="3" strokeLinejoin="round" />
      <text x="6" y="118" fontSize="13.5" fill={KIT.txt2}>η ↑</text>
      <text x="236" y="256" fontSize="13.5" fill={NOIR}>t (s) →</text>
      <text x="52" y="144" fontSize="13.5" fontWeight="800" fill={BLEU}>repos</text>
      <text x={X(20) + 4} y="214" fontSize="13.5" fontWeight="800" fill={BLEU}>détruite</text>
      <text x={X(52)} y="176" fontSize="13.5" fontWeight="800" fill={BLEU}>la structure se</text>
      <text x={X(52)} y="192" fontSize="13.5" fontWeight="800" fill={BLEU}>reconstruit</text>
    </Svg>
  );
}

// Carte 2 : les trois méthodes d'évaluation de la régénération (M1, M2, M3).
export function FMethodes() {
  const X = (t) => 46 + (t / 80) * 224; // intervalle 3 : 0 à 80 s
  const Y = (p) => 176 - (p / 100) * 140; // p : % de ηref
  const c = (t) => 100 * (0.9 - 0.82 * Math.exp(-t / 20));
  const pts = Array.from({ length: 41 }, (_, i) => { const t = (i * 80) / 40; return `${X(t).toFixed(1)},${Y(c(t)).toFixed(1)}`; }).join(" ");
  const t50 = -20 * Math.log((0.9 - 0.5) / 0.82);
  return (
    <Svg aria="Courbe de régénération de la viscosité dans le troisième intervalle, avec la viscosité de référence en tirets et les trois méthodes : M1 pourcentage à un instant donné, M2 temps pour atteindre 50 pour cent, M3 pente" vb="0 0 300 268" maxWidth={320}>
      {axes(46, 24, 272, 176)}
      <line x1="46" y1={Y(100)} x2="272" y2={Y(100)} stroke={GRIS} strokeDasharray="5 4" />
      <text x="52" y={Y(100) - 5} fontSize="13.5" fill={NOIR}>η<tspan fontSize="10" dy="3">ref</tspan><tspan dy="-3"> = 100 %</tspan></text>
      <polyline points={pts} fill="none" stroke={BLEU} strokeWidth="3" />
      <text x="6" y="20" fontSize="13.5" fill={KIT.txt2}>η ↑</text>
      <text x="228" y="196" fontSize="13.5" fill={NOIR}>t (s) →</text>
      <line x1={X(60)} y1={Y(c(60))} x2={X(60)} y2="176" stroke={ORANGE} strokeWidth="2.2" strokeDasharray="5 3" />
      <circle cx={X(60)} cy={Y(c(60))} r="4.5" fill={ORANGE} />
      <line x1="46" y1={Y(50)} x2={X(t50)} y2={Y(50)} stroke={VERT} strokeWidth="2.2" strokeDasharray="5 3" />
      <line x1={X(t50)} y1={Y(50)} x2={X(t50)} y2="176" stroke={VERT} strokeWidth="2.2" strokeDasharray="5 3" />
      <circle cx={X(t50)} cy={Y(50)} r="4.5" fill={VERT} />
      <line x1={X(8)} y1={Y(c(8))} x2={X(28)} y2={Y(c(28))} stroke={ROUGE} strokeWidth="3" />
      <text x="12" y="216" fontSize="13.5" fontWeight="800" fill={ORANGE}>M1 : % de ηref à un instant donné</text>
      <text x="12" y="236" fontSize="13.5" fontWeight="800" fill={VERT}>M2 : temps pour atteindre 25 % ou 50 %</text>
      <text x="12" y="256" fontSize="13.5" fontWeight="800" fill={ROUGE}>M3 : pente Δη / Δt sur une durée donnée</text>
    </Svg>
  );
}

// Carte 3 : compromis nivellement / affaissement (trois vitesses de régénération).
export function FCompromis() {
  const X = (t) => 46 + (t / 80) * 224;
  const Y = (p) => 150 - (p / 100) * 120;
  const courbe = (k) => Array.from({ length: 41 }, (_, i) => { const t = (i * 80) / 40; return `${X(t).toFixed(1)},${Y(100 * (1 - Math.exp(-t / k))).toFixed(1)}`; }).join(" ");
  return (
    <Svg aria="Trois vitesses de régénération de la structure après l'application : trop rapide, équilibrée, trop lente" vb="0 0 300 250" maxWidth={320}>
      {axes(46, 24, 272, 150)}
      <polyline points={courbe(3)} fill="none" stroke={ROUGE} strokeWidth="3" />
      <polyline points={courbe(14)} fill="none" stroke={VERT} strokeWidth="3" />
      <polyline points={courbe(55)} fill="none" stroke={ORANGE} strokeWidth="3" />
      <text x="6" y="20" fontSize="13.5" fill={KIT.txt2}>% ↑</text>
      <text x="196" y="170" fontSize="13.5" fill={NOIR}>t après l’application →</text>
      <text x="14" y="194" fontSize="13.5" fontWeight="800" fill={ROUGE}>trop rapide : traces de pinceau</text>
      <text x="14" y="214" fontSize="13.5" fontWeight="800" fill={VERT}>équilibrée : bon nivellement</text>
      <text x="14" y="234" fontSize="13.5" fontWeight="800" fill={ORANGE}>trop lente : risque d’affaissement</text>
    </Svg>
  );
}
