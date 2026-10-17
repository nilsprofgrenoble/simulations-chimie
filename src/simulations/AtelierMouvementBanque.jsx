// ====================================================
//  « RECONNAÎTRE UN MOUVEMENT SUR UN SCHÉMA » (seconde, chapitre « Décrire un mouvement »)
//  Chaque exercice montre une chronophotographie (positions d'un objet à intervalles de temps égaux)
//  ou des trajectoires dessinées, et demande de choisir la bonne description.
//  Couleurs sobres (gris, orange, vert foncé) ; les points sont numérotés : aucune information portée par la couleur seule.
// ====================================================
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];

const GRIS = '#475569', CLAIR = '#cbd5e1', ORANGE = '#b45a1f', VERT = '#166534';

// Un schéma : cadre + légende. enfants = éléments SVG.
function Cadre({ w = 360, h = 150, titre, sol = true, children }) {
  return (
    <figure style={{ margin: '10px 0 0', display: 'block', width: '100%', maxWidth: 480 }}>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={titre} style={{ width: '100%', background: '#f8fafc', border: `1px solid ${CLAIR}`, borderRadius: 8 }}>
        {sol && <line x1="8" y1={h - 14} x2={w - 8} y2={h - 14} stroke={CLAIR} strokeWidth="2"/>}
        {children}
      </svg>
      {titre && <figcaption style={{ fontSize: 12.5, color: GRIS, marginTop: 3 }}>{titre}</figcaption>}
    </figure>);
}
// Points numérotés (t = 0, 1, 2… à intervalles égaux)
function Points({ pts, premier = 0, couleur = GRIS }) {
  return <g>{pts.map(([x, y], i) => (
    <g key={i}><circle cx={x} cy={y} r="6" fill={couleur}/><text x={x} y={y - 11} fontSize="11" textAnchor="middle" fill={GRIS}>{premier + i}</text></g>))}</g>;
}
const cumul = (x0, ecarts) => ecarts.reduce((a, e) => [...a, a[a.length - 1] + e], [x0]);
const ligne = (ecarts, y = 70, x0 = 20) => cumul(x0, ecarts).map(x => [x, y]);
const LegT = h => <text x="352" y={h - 3} fontSize="11" textAnchor="end" fill={GRIS}>numéro = durée écoulée en secondes</text>;

const dUnif = ligne([45, 45, 45, 45, 45, 45, 45], 80, 25);
const dAcc = ligne([14, 22, 30, 38, 46, 54, 62], 80, 20);
const dRal = ligne([62, 54, 46, 38, 30, 22, 14], 80, 20);
const cercle = Array.from({ length: 8 }, (_, i) => [180 + 58 * Math.cos(-Math.PI / 2 + i * Math.PI / 4), 88 + 58 * Math.sin(-Math.PI / 2 + i * Math.PI / 4)]);
const lancer = Array.from({ length: 8 }, (_, i) => [30 + 42 * i, 125 - 6 * i * (7 - i) * 0.9 - 0]);

const Chrono = ({ pts, titre, h = 150 }) => <Cadre h={h} titre={titre}>{LegT(h)}<Points pts={pts}/></Cadre>;

// Trajectoires dessinées (schémas A, B, C)
const Piste = ({ lettre, d, titre }) => (
  <figure style={{ margin: '8px 10px 0 0', display: 'inline-block', width: 'min(100%, 200px)' }}>
    <svg viewBox="0 0 200 110" role="img" aria-label={titre} style={{ width: '100%', background: '#f8fafc', border: `1px solid ${CLAIR}`, borderRadius: 8 }}>
      <path d={d} fill="none" stroke={ORANGE} strokeWidth="3" strokeLinecap="round"/>
      <text x="10" y="18" fontSize="14" fontWeight="700" fill={GRIS}>{lettre}</text>
    </svg>
    <figcaption style={{ fontSize: 12, color: GRIS }}>{titre}</figcaption>
  </figure>);
const DROITE_V = 'M100 12 L100 98', DROITE_H = 'M15 55 L185 55';
const COURBE = 'M15 20 Q 100 20 185 98';
const CERCLE = 'M100 15 a40 40 0 1 1 -0.1 0';
const ARCHES = 'M10 95 Q 30 10 50 95 Q 70 10 90 95 Q 110 10 130 95 Q 150 10 170 95';
const Planche = ({ children }) => <div style={{ marginTop: 6 }}>{children}</div>;

export const MOUVEMENTS = [
  { id: 'chrono-uniforme', domaine: 'Mouvement et vitesse', titre: 'Chronophotographie n° 1',
    enonce: 'Un objet se déplace sur une table. Une caméra le photographie toutes les secondes. Voici les positions successives, vues de dessus, dans le référentiel de la table.',
    figure: <Chrono pts={dUnif} titre="Positions toutes les secondes (référentiel de la table)"/>,
    q: 'Quel est le mouvement de l’objet ?', options: [
      V('rectiligne uniforme', 'Les points sont alignés (trajectoire = droite) et régulièrement espacés : en 1 s l’objet parcourt toujours la même distance, donc sa vitesse est constante.'),
      F('rectiligne accéléré', 'Dans un mouvement accéléré, les points seraient de plus en plus éloignés les uns des autres. Ici l’écart est toujours le même.'),
      F('rectiligne ralenti', 'Dans un mouvement ralenti, les points seraient de plus en plus rapprochés. Ici l’écart est toujours le même.'),
      F('circulaire uniforme', 'Les points sont sur une droite, pas sur un cercle.'),
    ] },
  { id: 'chrono-accelere', domaine: 'Mouvement et vitesse', titre: 'Chronophotographie n° 2',
    enonce: 'Un chariot descend une pente. Une caméra le photographie toutes les secondes. Voici ses positions successives dans le référentiel du sol.',
    figure: <Chrono pts={dAcc} titre="Positions toutes les secondes (référentiel du sol)"/>,
    q: 'Quel est le mouvement du chariot ?', options: [
      V('rectiligne accéléré', 'Les points sont alignés, et l’écart entre deux points augmente : en 1 s le chariot parcourt de plus en plus de distance, il va de plus en plus vite.'),
      F('rectiligne uniforme', 'Pour un mouvement uniforme, tous les écarts seraient égaux. Ici ils grandissent.'),
      F('rectiligne ralenti', 'Pour un mouvement ralenti, les écarts diminueraient. Ici ils augmentent (lis les numéros dans l’ordre : 0, 1, 2…).'),
      F('circulaire accéléré', 'Les points sont alignés : la trajectoire est une droite, pas un cercle.'),
    ] },
  { id: 'chrono-ralenti', domaine: 'Mouvement et vitesse', titre: 'Chronophotographie n° 3',
    enonce: 'Une bille roule sur le sol et finit par s’arrêter. Une caméra la photographie toutes les secondes. Voici ses positions successives dans le référentiel du sol.',
    figure: <Chrono pts={dRal} titre="Positions toutes les secondes (référentiel du sol)"/>,
    q: 'Quel est le mouvement de la bille ?', options: [
      V('rectiligne ralenti', 'Les points sont alignés, et l’écart entre deux points diminue : en 1 s la bille parcourt de moins en moins de distance, elle ralentit.'),
      F('rectiligne accéléré', 'Pour un mouvement accéléré, les écarts augmenteraient au fil des numéros. Ici ils diminuent.'),
      F('rectiligne uniforme', 'Pour un mouvement uniforme, tous les écarts seraient égaux. Ici ils diminuent.'),
      F('immobile', 'La position change à chaque seconde : la bille se déplace.'),
    ] },
  { id: 'chrono-cercle', domaine: 'Mouvement et vitesse', titre: 'Chronophotographie n° 4',
    enonce: 'Une voiture de manège est photographiée toutes les secondes, vue de dessus, dans le référentiel du sol. Les points sont régulièrement espacés sur la figure.',
    figure: <Cadre h={170} titre="Positions toutes les secondes, vues de dessus (référentiel du sol)" sol={false}>{LegT(170)}<Points pts={cercle}/></Cadre>,
    q: 'Quel est le mouvement de la voiture ?', options: [
      V('circulaire uniforme', 'Les points sont sur un cercle (trajectoire circulaire) et régulièrement espacés : la distance parcourue en 1 s est toujours la même, la vitesse est constante.'),
      F('rectiligne uniforme', 'Les points ne sont pas alignés : ils forment un cercle.'),
      F('circulaire accéléré', 'Les points sont régulièrement espacés : la vitesse ne change pas, le mouvement est uniforme.'),
      F('rectiligne accéléré', 'Les points ne sont pas alignés et leur écart ne change pas.'),
    ] },
  { id: 'chrono-lancer', domaine: 'Mouvement et vitesse', titre: 'Chronophotographie n° 5',
    enonce: 'Une balle est lancée en l’air. On la photographie à intervalles de temps égaux. Voici ses positions dans le référentiel du sol.',
    figure: <Chrono pts={lancer} titre="Positions à intervalles de temps égaux (référentiel du sol)"/>,
    q: 'Quelle est la trajectoire de la balle ?', options: [
      V('une courbe (ni une droite, ni un cercle)', 'Les points ne sont pas alignés et ne forment pas un cercle : la trajectoire est une courbe. On dit que le mouvement est curviligne.'),
      F('une droite', 'Les points ne sont pas alignés : ils montent puis redescendent.'),
      F('un cercle', 'La balle ne revient pas à son point de départ en tournant autour d’un centre : sa trajectoire est une courbe ouverte.'),
      F('un point', 'La balle se déplace : sa position change.'),
    ] },
  { id: 'trajet-train-quai', domaine: 'Mouvement et vitesse', titre: 'Balle lâchée dans un train : quelle trajectoire ?',
    enonce: 'Dans un train qui roule en ligne droite à vitesse constante, un passager lâche une balle. Voici trois dessins. Un seul représente la trajectoire de la balle vue par une personne immobile sur le quai (référentiel terrestre).',
    figure: <Planche><Piste lettre="A" d={DROITE_V} titre="Schéma A"/><Piste lettre="B" d={COURBE} titre="Schéma B"/><Piste lettre="C" d={CERCLE} titre="Schéma C"/></Planche>,
    q: 'Quel schéma représente la trajectoire vue du quai ?', options: [
      V('Schéma B', 'Pour la personne sur le quai, la balle avance avec le train tout en descendant : sa trajectoire est une courbe.'),
      F('Schéma A', 'La droite verticale est la trajectoire vue DANS le train (référentiel du train), pas depuis le quai.'),
      F('Schéma C', 'Rien ne fait tourner la balle en rond : ce n’est pas un cercle.'),
      F('Aucun : la balle ne bouge pas', 'Par rapport au quai, la balle avance avec le train et tombe : elle bouge.'),
    ] },
  { id: 'trajet-train-dans', domaine: 'Mouvement et vitesse', titre: 'Balle lâchée dans un train : le point de vue du passager',
    enonce: 'Même situation : la balle est lâchée dans le train. Voici les mêmes trois dessins. Cette fois, on se place dans le référentiel du train (le passager qui lâche la balle).',
    figure: <Planche><Piste lettre="A" d={DROITE_V} titre="Schéma A"/><Piste lettre="B" d={COURBE} titre="Schéma B"/><Piste lettre="C" d={CERCLE} titre="Schéma C"/></Planche>,
    q: 'Quel schéma représente la trajectoire vue par le passager ?', options: [
      V('Schéma A', 'Le passager voit la balle tomber tout droit, juste devant lui : trajectoire rectiligne verticale.'),
      F('Schéma B', 'La courbe est ce que voit la personne sur le quai. Le passager avance avec la balle, il ne voit pas cette courbe.'),
      F('Schéma C', 'Rien ne fait tourner la balle en rond.'),
      F('Les schémas A et B représentent la même chose', 'Non : la trajectoire dépend du référentiel. Ce sont deux descriptions différentes du même mouvement.'),
    ] },
  { id: 'trajet-valve-sol', domaine: 'Mouvement et vitesse', titre: 'Valve de vélo vue du sol',
    enonce: 'Un vélo roule en ligne droite. On suit la valve d’une roue. Voici trois dessins de trajectoire. On se place dans le référentiel du sol (une personne immobile au bord de la route).',
    figure: <Planche><Piste lettre="A" d={DROITE_H} titre="Schéma A"/><Piste lettre="B" d={CERCLE} titre="Schéma B"/><Piste lettre="C" d={ARCHES} titre="Schéma C"/></Planche>,
    q: 'Quel schéma représente la trajectoire de la valve dans ce référentiel ?', options: [
      V('Schéma C', 'La valve tourne autour de l’axe de la roue pendant que la roue avance : elle dessine une suite d’arches.'),
      F('Schéma A', 'La valve monte et descend en tournant : elle ne reste pas à la même hauteur.'),
      F('Schéma B', 'Le cercle est la trajectoire vue depuis le vélo (le cadre). Vue du sol, la roue avance en même temps qu’elle tourne.'),
      F('Aucun des trois', 'Le schéma C représente bien ce mouvement.'),
    ] },
  { id: 'trajet-valve-velo', domaine: 'Mouvement et vitesse', titre: 'Valve de vélo vue du cadre',
    enonce: 'Même vélo, même valve. Voici les mêmes trois dessins. Cette fois, on se place dans le référentiel du vélo (le cadre).',
    figure: <Planche><Piste lettre="A" d={DROITE_H} titre="Schéma A"/><Piste lettre="B" d={CERCLE} titre="Schéma B"/><Piste lettre="C" d={ARCHES} titre="Schéma C"/></Planche>,
    q: 'Quel schéma représente la trajectoire de la valve dans ce référentiel ?', options: [
      V('Schéma B', 'Vu du cadre, la roue tourne sur place : la valve décrit un cercle autour de l’axe.'),
      F('Schéma A', 'La valve ne se déplace pas en ligne droite : elle tourne autour de l’axe de la roue.'),
      F('Schéma C', 'Les arches sont la trajectoire vue du sol. Dans le référentiel du vélo, le sol défile mais la roue ne s’éloigne pas du cadre.'),
      F('Aucun des trois', 'Le schéma B représente bien ce mouvement.'),
    ] },
];
