/* eslint-disable react-refresh/only-export-components -- fichier de données : les petites figures ne servent qu’ici */
// ====================================================
//  « RECONNAÎTRE UN MOUVEMENT SUR UNE CHRONOPHOTOGRAPHIE » : vecteurs vitesse et accélération (terminale, simulation 166)
//  Exercices S'APP / ANALYSER (prévoir sans calculer). Ils sont ajoutés à la famille « Reconnaître un mouvement sur un schéma » de AtelierAnalyserBanque.js.
//  Notation vectorielle : vec(a) s'affiche a surmonté d'une flèche. Aucune information n'est portée par la couleur seule (points numérotés, axe gradué).
// ====================================================
import { MOUVEMENTS as MV, chrono, echelles } from './vecteursVAModele';
import { SceneChrono, C } from './vecteursVASchemas';

const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const DOM = 'Vecteurs vitesse et accélération';

const FigMv = ({ id, aria, N }) => { const mv = N ? { ...MV[id], N } : MV[id], P = chrono(mv), E = echelles(mv, P, mv.tau);
  return <div style={{ maxWidth: 440, margin: '8px 0' }}><SceneChrono mv={mv} P={P} tau={mv.tau} E={E} maxWidth={440} aria={aria}/></div>; };

// Deux chronophotographies A et B tracées l'une sous l'autre (même intervalle de temps entre deux points)
const FigAB = () => {
  const A = Array.from({ length: 7 }, (_, i) => 40 + 48 * i), B = Array.from({ length: 7 }, (_, i) => 40 + 14 * i + 4 * i * i);
  const ligne = (xs, y, nom) => (
    <g>
      <text x="8" y={y + 6} fontSize="18" fontWeight="700" fill={C.encre}>{nom}</text>
      <line x1="30" y1={y} x2="392" y2={y} stroke={C.clair} strokeWidth="2"/>
      {xs.map((x, i) => <g key={i}><circle cx={x} cy={y} r="5" fill={C.encre}/><text x={x} y={y + 24} fontSize="16" fontWeight="700" textAnchor="middle" fill={C.encre}>{i}</text></g>)}
    </g>);
  return (
    <div style={{ maxWidth: 440, margin: '8px 0' }}>
      <svg viewBox="0 0 400 164" role="img" aria-label="Deux chronophotographies sur une droite, points numérotés de 0 à 6, pris à intervalles de temps égaux : pour A les points sont équidistants, pour B ils sont de plus en plus espacés" style={{ width: '100%', height: 'auto', display: 'block', background: '#fff', border: `1px solid ${C.clair}`, borderRadius: 8 }}>
        {ligne(A, 38, 'A')}{ligne(B, 100, 'B')}
        <text x="396" y="154" fontSize="15" textAnchor="end" fill={C.gris}>numéro du point = date (en τ)</text>
      </svg>
    </div>);
};

export const VAC_ANA = [
  { id: 'vac-ana-freinage', domaine: DOM, titre: 'Le vecteur accélération d’une voiture qui freine',
    enonce: 'Une voiture roule vers la droite sur une route droite et freine. Voici sa chronophotographie : les points sont pris à intervalles de temps égaux et l’axe Ox est orienté vers la droite.',
    figure: <FigMv id="frein" N={6} aria="Chronophotographie d’une voiture qui freine : les points, numérotés de 0 à 6, se rapprochent de plus en plus sur un axe Ox gradué en mètres orienté vers la droite"/>,
    q: 'Quelle est la direction et le sens du vecteur accélération vec(a) de la voiture ?', options: [
      V('vers la gauche : la vitesse diminue, opposé à vec(v)', 'Les points se rapprochent : la norme de la vitesse diminue. Le vecteur vitesse est vers la droite et sa variation vec(Δv) est vers la gauche : vec(a) est de sens opposé à vec(v) (a_x < 0).'),
      F('vers la droite, comme vec(v), puisque la voiture avance', 'Le sens de vec(a) est celui de la variation de la vitesse, pas celui du mouvement. Ici la vitesse diminue : vec(a) est dirigé vers la gauche.'),
      F('perpendiculaire à la route, vers le haut de la figure', 'Une accélération perpendiculaire à la route changerait la direction de la vitesse, pas sa norme. Ici les points restent alignés et se rapprochent : vec(a) est horizontal, vers la gauche.'),
      F('aucun : vec(a) est nul car la trajectoire est une droite', 'Une trajectoire droite n’impose pas que vec(a) soit nul : ici la norme de vec(v) change, donc vec(a) n’est pas nul. Il est nul si vec(v) est constant.'),
    ] },
  { id: 'vac-ana-sommet', domaine: DOM, titre: 'Au sommet de la trajectoire d’une balle',
    enonce: 'Une balle est lancée en l’air ; on la photographie à intervalles de temps égaux (axe Ox horizontal, axe Oy vertical vers le haut). Le point M3 est le point le plus haut atteint.',
    figure: <FigMv id="parabole" aria="Chronophotographie d’une balle lancée : les points, numérotés de 0 à 6, montent puis redescendent en avançant vers la droite ; le point 3 est le plus haut ; axes Ox horizontal et Oy vertical gradués en mètres"/>,
    q: 'Que peut-on dire des vecteurs vitesse et accélération en M3 ?', options: [
      V('vec(v) horizontal ; vec(a) vertical vers le bas', 'Horizontalement, les points sont équidistants : v_x est constant (non nul) et a_x = 0. Verticalement, v_y passe de positif à négatif : a_y est négatif. En M3, v_y = 0 mais vec(v) n’est pas nul et vec(a) est dirigé vers le bas.'),
      F('vec(v) est nul car la balle s’arrête en haut', 'Seule la coordonnée v_y est nulle en M3 : la balle continue d’avancer horizontalement, donc v_x ≠ 0 et vec(v) n’est pas nul.'),
      F('vec(a) est nul car la balle ne monte ni ne descend', 'Un instant sans montée ni descente ne signifie pas que v_y est constante : elle change de signe, donc a_y ≠ 0 et vec(a) n’est pas nul.'),
      F('vec(v) et vec(a) sont tous deux horizontaux', 'vec(v) l’est, mais pas vec(a) : la coordonnée v_x est constante (a_x = 0) alors que v_y varie (a_y ≠ 0).'),
    ] },
  { id: 'vac-ana-deux', domaine: DOM, titre: 'Deux chronophotographies, une accélération nulle',
    enonce: 'Deux mobiles A et B se déplacent sur une droite, vers la droite. Voici leurs chronophotographies : pour chacun, les points sont pris à intervalles de temps égaux.',
    figure: <FigAB/>,
    q: 'Pour quel mobile le vecteur accélération est-il nul ?', options: [
      V('pour A seulement : ses points sont régulièrement espacés', 'Pour A, les écarts sont égaux : vec(v) est constant, donc sa dérivée vec(a) est nulle (mouvement rectiligne uniforme).'),
      F('pour B seulement : ses points sont de plus en plus espacés', 'Pour B, les écarts augmentent : la norme de vec(v) augmente, donc vec(a) n’est pas nul.'),
      F('pour A et pour B : les deux avancent toujours vers la droite', 'Avancer dans le même sens ne suffit pas : pour B la vitesse change (les écarts augmentent), donc vec(a) n’est pas nul.'),
      F('pour aucun : un mobile en mouvement accélère toujours', 'Un mobile peut avoir un vecteur vitesse constant non nul : c’est le cas de A. Dans ce cas vec(a) est nul.'),
    ] },
  { id: 'vac-ana-mrua', domaine: DOM, titre: 'Une voiture qui démarre : quel mouvement rectiligne ?',
    enonce: 'Une voiture démarre sur une route droite. Voici sa chronophotographie : les points, numérotés de 0 à 6, sont pris à intervalles de temps égaux ; l’axe Ox est orienté vers la droite.',
    figure: <FigMv id="acc" N={6} aria="Chronophotographie d’une voiture qui démarre : les points, numérotés de 0 à 6, sont de plus en plus espacés sur un axe Ox gradué en mètres orienté vers la droite"/>,
    q: 'Comment décrire ce mouvement rectiligne ?', options: [
      V('uniformément accéléré : vec(a) constant, de même sens que vec(v)', 'Les écarts entre points successifs augmentent de la même quantité à chaque intervalle : la vitesse augmente de la même valeur par intervalle de temps. Le vecteur accélération est constant et de même sens que vec(v) (la vitesse augmente).'),
      F('uniforme : vec(v) est constant, puisque la trajectoire est une droite', 'Une trajectoire droite n’impose pas une vitesse constante : ici les écarts entre points augmentent, donc la norme de vec(v) augmente. Un mouvement rectiligne uniforme aurait des points régulièrement espacés.'),
      F('accéléré, avec un vec(a) qui augmente à chaque intervalle de temps', 'Les écarts augmentent régulièrement, d’une même quantité : la variation de vitesse est la même à chaque intervalle, donc vec(a) est constant. Un vec(a) croissant ferait augmenter les écarts de plus en plus vite.'),
      F('uniformément accéléré : vec(a) constant, de sens opposé à vec(v)', 'Un vec(a) de sens opposé à vec(v) ferait diminuer la vitesse : les points se rapprocheraient (comme pour une voiture qui freine). Ici ils s’écartent.'),
    ] },
];
