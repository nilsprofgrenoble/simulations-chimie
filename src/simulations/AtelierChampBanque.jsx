/* eslint-disable react-refresh/only-export-components -- fichier de données : les composants de dessin ne servent qu’ici */
// ====================================================
//  « RECONNAÎTRE UN CHAMP SUR UN SCHÉMA » (1re spécialité, chapitre « Interactions fondamentales et notion de champ »)
//  Lignes de champ dessinées : sens des flèches, forme (radiale, uniforme), resserrement = intensité.
//  Couleurs sobres ; l'information est portée par les flèches et les signes (+ / −), jamais par la couleur seule.
// ====================================================
const V = (t, e) => [t, true, e];
const F = (t, e) => [t, false, e];
const GRIS = '#475569', CLAIR = '#cbd5e1', ORANGE = '#b45a1f';

const Fleche = ({ x1, y1, x2, y2, c = ORANGE }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 9;
  const p = (t) => `${x2 - L * Math.cos(a + t)},${y2 - L * Math.sin(a + t)}`;
  return <g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="2.2"/><polyline points={`${p(0.45)} ${x2},${y2} ${p(-0.45)}`} fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round"/></g>;
};
const Cadre = ({ titre, children, w = 240, h = 170 }) => (
  <figure style={{ margin: '10px 12px 0 0', display: 'inline-block', width: 'min(100%, 280px)', verticalAlign: 'top' }}>
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={titre} style={{ width: '100%', background: '#f8fafc', border: `1px solid ${CLAIR}`, borderRadius: 8 }}>{children}</svg>
    {titre && <figcaption style={{ fontSize: 12.5, color: GRIS, marginTop: 3 }}>{titre}</figcaption>}
  </figure>);

// Lignes radiales autour d'un centre (sortantes ou entrantes) ; signe : '+', '−' ou '' (masse)
function Radial({ sortant, signe, titre, n = 8, points }) {
  const cx = 120, cy = 85, r1 = 22, r2 = 70;
  return (
    <Cadre titre={titre}>
      {Array.from({ length: n }, (_, i) => { const a = i * 2 * Math.PI / n, c = Math.cos(a), s = Math.sin(a);
        return sortant ? <Fleche key={i} x1={cx + r1 * c} y1={cy + r1 * s} x2={cx + r2 * c} y2={cy + r2 * s}/> : <Fleche key={i} x1={cx + r2 * c} y1={cy + r2 * s} x2={cx + r1 * c} y2={cy + r1 * s}/>; })}
      <circle cx={cx} cy={cy} r="15" fill="white" stroke={GRIS} strokeWidth="2"/>
      {signe && <text x={cx} y={cy + 6} fontSize="20" fontWeight="700" textAnchor="middle" fill={GRIS}>{signe}</text>}
      {points && points.map(([x, y, l]) => <g key={l}><circle cx={x} cy={y} r="4" fill={GRIS}/><text x={x + 7} y={y - 5} fontSize="14" fontWeight="700" fill={GRIS}>{l}</text></g>)}
    </Cadre>);
}
// Champ uniforme entre deux plaques
function Plaques({ titre, charge }) {
  return (
    <Cadre titre={titre}>
      <rect x="30" y="20" width="8" height="130" fill={GRIS}/><rect x="202" y="20" width="8" height="130" fill={GRIS}/>
      <text x="34" y="14" fontSize="16" fontWeight="700" textAnchor="middle" fill={GRIS}>+</text><text x="206" y="14" fontSize="16" fontWeight="700" textAnchor="middle" fill={GRIS}>−</text>
      {[40, 70, 100, 130].map(y => <Fleche key={y} x1={50} y1={y} x2={190} y2={y}/>)}
      {charge && <g><circle cx="120" cy="85" r="10" fill="white" stroke={GRIS} strokeWidth="2"/><text x="120" y="91" fontSize="16" fontWeight="700" textAnchor="middle" fill={GRIS}>{charge}</text></g>}
    </Cadre>);
}
export const CHAMPS = [
  { id: 'lignes-sortantes', domaine: 'Interactions et champs', titre: 'Lignes de champ qui sortent d’un objet',
    enonce: 'Voici les lignes d’un champ électrostatique autour d’un petit objet chargé. Les flèches indiquent le sens du champ : elles s’éloignent de l’objet.',
    figure: <Radial sortant signe="" titre="Lignes de champ : les flèches s’éloignent du centre"/>,
    q: 'Cet objet porte…', options: [
      V('une charge positive', 'Par convention, les lignes de champ électrostatique « partent » des charges positives (elles s’en éloignent) et « arrivent » sur les charges négatives.'),
      F('une charge négative', 'Pour une charge négative, les flèches seraient dirigées VERS l’objet.'),
      F('aucune charge : c’est une masse', 'Le champ de gravitation d’une masse a des lignes dirigées VERS la masse (la gravitation est toujours attractive).'),
      F('on ne peut pas le savoir', 'Le sens des flèches suffit : elles s’éloignent, donc la charge est positive.'),
    ] },
  { id: 'lignes-entrantes', domaine: 'Interactions et champs', titre: 'Lignes de champ qui arrivent sur un objet',
    enonce: 'Voici les lignes d’un champ autour d’un objet sphérique. Les flèches indiquent le sens du champ : elles se dirigent vers le centre de l’objet.',
    figure: <Radial sortant={false} signe="" titre="Lignes de champ : les flèches convergent vers le centre"/>,
    q: 'Ce schéma peut représenter…', options: [
      V('le champ de gravitation d’une planète, ou le champ électrostatique d’une charge négative', 'Dans les deux cas les lignes sont dirigées vers le centre : la gravitation est toujours attractive, et une charge négative « attire » les lignes de champ électrostatique.'),
      F('le champ électrostatique d’une charge positive seulement', 'Pour une charge positive, les flèches s’éloigneraient du centre.'),
      F('le champ uniforme entre deux plaques', 'Les lignes d’un champ uniforme sont parallèles et régulièrement espacées, pas convergentes.'),
      F('un champ nul', 'Un champ nul n’aurait aucune ligne de champ.'),
    ] },
  { id: 'champ-uniforme', domaine: 'Interactions et champs', titre: 'Entre deux plaques',
    enonce: 'Entre deux plaques parallèles reliées à un générateur, on a dessiné les lignes du champ électrique. Elles sont parallèles, régulièrement espacées, et dirigées de la plaque + vers la plaque −.',
    figure: <Plaques titre="Entre les plaques chargées"/>,
    q: 'Ce champ est…', options: [
      V('uniforme : même direction, même sens et même valeur en tout point entre les plaques', 'Des lignes parallèles et régulièrement espacées traduisent un champ uniforme.'),
      F('radial : dirigé vers un point central', 'Les lignes ne convergent ni ne divergent depuis un point : elles sont parallèles.'),
      F('plus intense près de la plaque +', 'Les lignes sont aussi serrées partout : la valeur est la même.'),
      F('nul entre les plaques', 'Il y a des lignes de champ : le champ n’est pas nul.'),
    ] },
  { id: 'champ-force-neg', domaine: 'Interactions et champs', titre: 'Force sur une charge négative',
    enonce: 'Dans un champ électrique uniforme, dirigé vers la droite (de la plaque + vers la plaque −), on place une petite boule portant une charge NÉGATIVE.',
    figure: <Plaques titre="Boule chargée négativement entre les plaques" charge="−"/>,
    q: 'La force électrique qu’elle subit est dirigée…', options: [
      V('vers la gauche (sens opposé au champ)', 'Pour une charge négative, la force F = q·E est de sens OPPOSÉ au champ E. La boule est attirée par la plaque +, à gauche.'),
      F('vers la droite (même sens que le champ)', 'C’est le cas pour une charge POSITIVE. Ici la charge est négative : la force est de sens opposé.'),
      F('vers le haut', 'La force est parallèle aux lignes de champ, pas perpendiculaire.'),
      F('nulle', 'Une charge placée dans un champ électrique subit toujours une force (si q ≠ 0).'),
    ] },
  { id: 'champ-force-pos', domaine: 'Interactions et champs', titre: 'Force sur une charge positive',
    enonce: 'Dans un champ électrique uniforme, dirigé vers la droite (de la plaque + vers la plaque −), on place une petite boule portant une charge POSITIVE.',
    figure: <Plaques titre="Boule chargée positivement entre les plaques" charge="+"/>,
    q: 'La force électrique qu’elle subit est dirigée…', options: [
      V('vers la droite (même sens que le champ)', 'Pour une charge positive, la force F = q·E est de même sens que le champ E : la boule est repoussée par la plaque + et attirée par la plaque −.'),
      F('vers la gauche (sens opposé au champ)', 'C’est le cas pour une charge négative. Ici la charge est positive : la force est de même sens que le champ.'),
      F('vers le bas', 'La force est parallèle aux lignes de champ, pas perpendiculaire.'),
      F('nulle', 'Une charge placée dans un champ électrique subit toujours une force (si q ≠ 0).'),
    ] },
  { id: 'champ-intensite', domaine: 'Interactions et champs', titre: 'Où le champ est-il le plus intense ?',
    enonce: 'Voici les lignes de champ autour d’un objet. Deux points A et B sont marqués : A est proche de l’objet, B est loin.',
    figure: <Radial sortant signe="+" titre="Deux points A et B autour d’une charge" points={[[150, 60, 'A'], [215, 150, 'B']]}/>,
    q: 'Où la valeur du champ est-elle la plus grande ?', options: [
      V('en A : les lignes de champ y sont plus rapprochées', 'Plus les lignes sont serrées, plus le champ est intense. Près de l’objet, la valeur du champ est plus grande (elle diminue comme 1/d²).'),
      F('en B : les lignes de champ s’y écartent', 'Plus les lignes s’écartent, plus le champ est faible.'),
      F('la valeur est la même en A et en B', 'Ce n’est vrai que pour un champ uniforme. Ici le champ est radial : il dépend de la distance.'),
      F('on ne peut pas le savoir', 'Le resserrement des lignes de champ indique l’intensité.'),
    ] },
];
