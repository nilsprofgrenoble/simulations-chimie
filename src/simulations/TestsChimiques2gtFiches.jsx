// Schémas des cartes « À retenir » de la simulation 198 « Tests chimiques : eau, dihydrogène, dioxygène, dioxyde de carbone » (2GT).
// Chaque carte est affichée UNE ÉTAPE APRÈS la question qu'elle conclut ; ses exemples ne sont pas ceux que l'élève doit trouver.
// viewBox de 300 de large (≈ 230 px sur téléphone) : textes de 13,5 à 17 ; schémas plafonnés à 320 px.
import { PanneauTest } from "./TestsChimiques2gtScenes";
import { COL } from "./testsChimiques2gtCouleurs";

const stl = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 };

// ── Cartes 1 à 4 : un test (réactif, observation, phrase-clé, précaution ou idée fausse) ──
const DONNEES = {
  eau: { titre: 'Le test de l’eau', cap: ['poudre blanche', 'poudre bleue'], reactif: 'sulfate de cuivre anhydre', positif: 'blanc → bleu', phrase: ['Sans eau : BLANC.', 'Avec eau : BLEU.'], coul: COL.bleu,
    bas: ['Idée fausse : bleu = eau pure.', 'Vrai : de l’eau est présente.'],
    aria: 'Test de l’eau. Le sulfate de cuivre anhydre est blanc ; avec de l’eau il devient bleu. Pour s’en souvenir : sans eau blanc, avec eau bleu. Idée fausse : bleu veut dire eau pure. Vrai : de l’eau est présente, peut-être avec autre chose.' },
  co2: { titre: 'Le test du dioxyde de carbone', cap: ['limpide', 'trouble'], reactif: 'eau de chaux', positif: 'limpide → trouble', phrase: ['Limpide puis TROUBLE :', 'c’est le CO₂.'], coul: COL.bleu,
    bas: ['Précaution : l’eau de chaux', 'est irritante, on met des lunettes.'],
    aria: 'Test du dioxyde de carbone. L’eau de chaux limpide se trouble avec un précipité blanc de carbonate de calcium. Pour s’en souvenir : limpide puis trouble, c’est le dioxyde de carbone. Précaution : l’eau de chaux est irritante, on met des lunettes.' },
  o2: { titre: 'Le test du dioxygène', cap: ['braise : point rouge', 'braise rallumée'], reactif: 'une braise', positif: 'elle se rallume', phrase: ['La braise REnaît :', 'c’est le dioxygène.'], coul: COL.bleu,
    bas: ['Précaution : lunettes, gestes', 'lents, pas de jeu avec le feu.'],
    aria: 'Test du dioxygène. Une braise, bûchette avec un point rouge sans flamme, plongée dans le gaz se rallume avec une flamme vive si le gaz est du dioxygène. Pour s’en souvenir : la braise renaît. Précaution : lunettes, gestes lents.' },
  h2: { titre: 'Le test du dihydrogène', cap: ['la flamme approche', 'détonation « pop »'], reactif: 'une flamme', positif: 'un « pop »', phrase: ['« Pop » à la flamme :', 'c’est le dihydrogène.'], coul: COL.bleu,
    bas: ['Fait par le professeur : très peu', 'de gaz, tube bouché, à l’écart.'],
    aria: 'Test du dihydrogène. Une flamme approchée d’un petit tube bouché contenant le gaz donne une petite détonation, un pop. Précaution : fait par le professeur, très peu de gaz, tube bouché, à l’écart des autres flammes.' },
};
const ETATS = { eau: ['avant', 'positif'], co2: ['avant', 'positif'], o2: ['avant', 'positif'], h2: ['avant', 'positif'] };
export function FicheTest({ test }) {
  const d = DONNEES[test];
  return (
    <svg viewBox="0 0 300 348" style={stl} role="img" aria-label={d.aria}>
      <text x={150} y={22} textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.encre}>{d.titre}</text>
      {[0, 1].map(i => (
        <g key={i}>
          <rect x={6 + 148 * i} y={34} width={140} height={134} rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <PanneauTest test={test} etat={ETATS[test][i]} x={11 + 148 * i} y={38} k={0.65} />
          <text x={76 + 148 * i} y={160} textAnchor="middle" fontSize="13.5" fontWeight="700" fill={COL.encre}>{d.cap[i]}</text>
        </g>))}
      <text x={10} y={192} fontSize="14" fill={COL.encre}>Réactif : <tspan fontWeight="800">{d.reactif}</tspan></text>
      <text x={10} y={212} fontSize="14" fill={COL.encre}>Positif : <tspan fontWeight="800" fill={COL.vert}>{d.positif}</tspan></text>
      <rect x={6} y={222} width={288} height={54} rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="1.5" />
      <text x={150} y={246} textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.vert}>{d.phrase[0]}</text>
      <text x={150} y={266} textAnchor="middle" fontSize="16" fontWeight="800" fill={COL.vert}>{d.phrase[1]}</text>
      <rect x={6} y={286} width={288} height={54} rx="10" fill="#fff7ed" stroke={COL.orange} strokeWidth="1.5" />
      <text x={150} y={309} textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.orange}>{d.bas[0]}</text>
      <text x={150} y={329} textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.orange}>{d.bas[1]}</text>
    </svg>);
}

// ── Carte 5 : l'arbre de décision pour identifier un gaz ──
export function FicheArbre() {
  const noeud = (y, titre) => (
    <g><rect x={8} y={y} width={156} height={44} rx="10" fill="#eff6ff" stroke={COL.bleu} strokeWidth="2" />
      <text x={86} y={y + 19} textAnchor="middle" fontSize="14" fontWeight="800" fill={COL.encre}>{titre[0]}</text>
      <text x={86} y={y + 37} textAnchor="middle" fontSize="14" fontWeight="800" fill={COL.encre}>{titre[1]}</text></g>);
  const feuille = (y, t, c = COL.vert) => (
    <g><line x1={164} y1={y + 22} x2={190} y2={y + 22} stroke={COL.gris} strokeWidth="2.5" /><polygon points={`198,${y + 22} 188,${y + 16} 188,${y + 28}`} fill={COL.gris} />
      <rect x={198} y={y + 6} width={94} height={32} rx="8" fill="#f0fdf4" stroke={c} strokeWidth="2" /><text x={245} y={y + 28} textAnchor="middle" fontSize="15" fontWeight="800" fill={c}>{t}</text></g>);
  const non = y => <g><line x1={86} y1={y + 44} x2={86} y2={y + 66} stroke={COL.gris} strokeWidth="2.5" /><polygon points={`86,${y + 76} 80,${y + 66} 92,${y + 66}`} fill={COL.gris} /><text x={96} y={y + 66} fontSize="13.5" fill={COL.gris}>non</text></g>;
  return (
    <svg viewBox="0 0 300 332" style={stl} role="img" aria-label="Arbre de décision pour identifier un gaz parmi le dihydrogène, le dioxygène, le dioxyde de carbone et le diazote. Test 1 : la flamme donne un pop, alors dihydrogène. Sinon test 2 : la braise se rallume, alors dioxygène. Sinon test 3 : l’eau de chaux se trouble, alors dioxyde de carbone. Sinon, par élimination, diazote.">
      {noeud(8, ['flamme :', 'un « pop » ?'])}{feuille(8, 'H₂')}{non(8)}
      {noeud(84, ['braise :', 'se rallume ?'])}{feuille(84, 'O₂')}{non(84)}
      {noeud(160, ['eau de chaux :', 'se trouble ?'])}{feuille(160, 'CO₂')}{non(160)}
      <rect x={8} y={236} width={156} height={32} rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="2" /><text x={86} y={258} textAnchor="middle" fontSize="15" fontWeight="800" fill={COL.vert}>N₂, par élimination</text>
      <rect x={6} y={278} width={288} height={46} rx="10" fill="#fff7ed" stroke={COL.orange} strokeWidth="1.5" />
      <text x={150} y={299} textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.orange}>On peut changer l’ordre des tests 2 et 3,</text><text x={150} y={317} textAnchor="middle" fontSize="14" fontWeight="700" fill={COL.orange}>pas la conclusion (liste donnée).</text>
    </svg>);
}

// ── Carte 6 : les limites d'un test ──
export function FicheLimites() {
  return (
    <svg viewBox="0 0 300 336" style={stl} role="img" aria-label="Deux limites. Un test négatif ne prouve pas l’absence : la braise ne se rallume pas dans l’air, qui contient pourtant du dioxygène. Une flamme qui s’éteint n’est pas un test du dioxyde de carbone : le diazote éteint aussi la flamme.">
      <rect x={6} y={6} width={288} height={154} rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
      <g transform="translate(14 8) scale(0.62)"><path d="M68 36 V122 a32 32 0 0 0 64 0 V36" fill="none" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /><line x1="100" y1="6" x2="100" y2="96" stroke="#a16207" strokeWidth="6" strokeLinecap="round" /><circle cx="100" cy="100" r="8" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2" /></g>
      <text x={102} y={34} fontSize="14.5" fontWeight="800" fill={COL.encre}>Test négatif</text>
      <text x={102} y={54} fontSize="14.5" fontWeight="800" fill={COL.rouge}>≠ absence</text>
      <text x={102} y={82} fontSize="13.5" fill={COL.encre}>L’air contient de l’O₂,</text><text x={102} y={100} fontSize="13.5" fill={COL.encre}>mais la braise ne s’y</text><text x={102} y={118} fontSize="13.5" fill={COL.encre}>rallume pas : trop peu.</text>
      <text x={150} y={150} textAnchor="middle" fontSize="13.5" fontWeight="700" fill={COL.orange}>concentration trop faible</text>
      <rect x={6} y={170} width={288} height={118} rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
      <g transform="translate(18 176) scale(0.55)"><path d="M68 36 V122 a32 32 0 0 0 64 0 V36" fill="none" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /><line x1="100" y1="10" x2="100" y2="70" stroke="#a16207" strokeWidth="6" strokeLinecap="round" /><path d="M100 70 q-10 -10 0 -22 q10 12 0 22z" fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="4 4" /></g>
      <text x={102} y={198} fontSize="14.5" fontWeight="800" fill={COL.encre}>Flamme éteinte</text>
      <text x={102} y={218} fontSize="14.5" fontWeight="800" fill={COL.rouge}>≠ test du CO₂</text>
      <text x={102} y={246} fontSize="13.5" fill={COL.encre}>Le diazote éteint aussi</text><text x={102} y={264} fontSize="13.5" fill={COL.encre}>la flamme : vrai test =</text><text x={102} y={282} fontSize="13.5" fill={COL.encre}>eau de chaux.</text>
      <rect x={6} y={298} width={288} height={32} rx="10" fill="#f0fdf4" stroke={COL.vert} strokeWidth="1.5" />
      <text x={150} y={319} textAnchor="middle" fontSize="14.5" fontWeight="700" fill={COL.vert}>Un test se lit avec prudence.</text>
    </svg>);
}
