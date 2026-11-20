// Cartes « À retenir » de la simulation 199 « Image réelle et grandissement avec une lentille convergente » (2GT).
// Chaque carte est affichée UNE ÉTAPE APRÈS la question qu'elle conclut ; ses exemples ne sont pas ceux que l'élève doit trouver (f′ = 4 cm, objet à 12 cm, AB = 2 cm).
// Les tracés viennent du même modèle que les scènes (rayons calculés) : mêmes couleurs, mêmes flèches. viewBox de 300 de large, plafonnés à 320 px, textes de 14 à 16.
import { SceneLentille, sousTriangles } from "./ImageLentille2gtScenes";
import * as M from "./imageLentille2gtModele";
import * as G from "./imageLentille2gtGeometrie";

const ENCRE = '#0f172a', GRIS = '#475569', VERT = '#15803d', ORANGE = '#b45309', BLEU = '#0b4f94';
const TOUS = { 1: 'complet', 2: 'complet', 3: 'complet' };
const PTS = ['A', 'B', 'O', 'F', 'Fp', 'Ap', 'Bp'];
const carteMise = h => ({ ...G.MISE_CARTE, h });
const Cadre = ({ children, h, label }) => (
  <svg viewBox={`0 0 300 ${h}`} style={{ width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto 6px', background: 'white', borderRadius: 8 }} role="img" aria-label={label}>{children}</svg>);

// Une ligne de légende : échantillon coloré + texte
const Ligne = ({ y, col, texte, gras = false }) => (
  <g><line x1={8} y1={y - 5} x2={34} y2={y - 5} stroke={col} strokeWidth="3.4" strokeLinecap="round" /><polygon points={`24,${y - 5} 17,${y - 9} 17,${y - 1}`} fill={col} />
    <text x={42} y={y} fontSize="14.5" fontWeight={gras ? 800 : 700} fill={ENCRE}>{texte}</text></g>);

// ── Carte 1 : les trois rayons particuliers (schéma calculé + trois règles) ──
export function FicheTroisRayons() {
  const mise = carteMise(150);
  return (
    <div>
      <SceneLentille o={{ d: 8, rayons: TOUS, points: ['A', 'B', 'O', 'F', 'Fp'] }} mise={mise} max={320} note={true}
        label="Les trois rayons particuliers issus de B, tracés à l’échelle pour une lentille de distance focale 4&nbsp;cm et un objet à 8&nbsp;cm : le rayon parallèle à l’axe (bleu) ressort par F prime ; le rayon qui passe par O (orange) ne dévie pas ; le rayon qui passe par F (violet) ressort parallèle à l’axe." />
      <Cadre h={96} label="Légende des trois rayons : bleu, parallèle à l’axe, ressort par F prime ; orange, passe par O, ne dévie pas ; violet, passe par F, ressort parallèle à l’axe.">
        <Ligne y={22} col={M.COULEUR_RAYON[1]} texte="parallèle à l’axe → par F′" />
        <Ligne y={52} col={M.COULEUR_RAYON[2]} texte="par O → ne dévie pas" />
        <Ligne y={82} col={M.COULEUR_RAYON[3]} texte="par F → ressort parallèle" />
      </Cadre>
    </div>);
}

// ── Carte 2 : image réelle, sur un écran, renversée ──
export function FicheImageReelle() {
  const mise = carteMise(150);
  return (
    <div>
      <SceneLentille o={{ d: 8, rayons: TOUS, image: true, ecran: true, points: PTS }} mise={mise} max={320} note={true}
        label="Image réelle : les trois rayons se croisent en B prime. Un écran placé en A prime montre l’image A prime B prime, de couleur verte, renversée : la pointe B prime est sous l’axe alors que B est au-dessus." />
      <Cadre h={104} label="Image réelle : les rayons s’y croisent, on peut la recevoir sur un écran. Elle est renversée, la tête en bas.">
        <rect x={6} y={6} width={288} height={92} rx="10" fill="#f0fdf4" stroke={VERT} strokeWidth="1.5" />
        <text x={150} y={28} textAnchor="middle" fontSize="15" fontWeight="800" fill={VERT}>Image réelle :</text>
        <text x={150} y={48} textAnchor="middle" fontSize="15" fontWeight="800" fill={VERT}>les rayons s’y croisent,</text>
        <text x={150} y={68} textAnchor="middle" fontSize="15" fontWeight="800" fill={VERT}>on la voit sur un écran.</text>
        <text x={150} y={88} textAnchor="middle" fontSize="15" fontWeight="800" fill={ENCRE}>Renversée : tête en bas.</text>
      </Cadre>
    </div>);
}

// ── Carte 3 : lire une image (où ? quelle taille ? quel sens ?) ──
export function FicheLireImage() {
  const mise = carteMise(168);
  const c = M.construction(8), im = c.image;
  return (
    <div>
      <SceneLentille o={{ d: 8, rayons: { 2: 'complet' }, image: true, ecran: true, cotes: ['OAp', 'hImg'], points: ['A', 'B', 'O', 'F', 'Fp', 'Ap', 'Bp'] }} mise={mise} max={320} note={false}
        label="Lire l’image sur un schéma à l’échelle : OA′ = 8&nbsp;cm donne la position, A′B′ = 2&nbsp;cm la taille, et la pointe B′ sous l’axe montre que l’image est renversée." />
      <Cadre h={100} label="Trois lectures : où, quelle taille, quel sens.">
        <rect x={6} y={6} width={288} height={88} rx="10" fill="#fffbeb" stroke={ORANGE} strokeWidth="1.5" />
        <text x={16} y={30} fontSize="15" fontWeight="800" fill={ENCRE}>où ?</text><text x={72} y={30} fontSize="15" fontWeight="700" fill={VERT}>distance OA′ = {M.cmAuto(im.OAp)}</text>
        <text x={16} y={54} fontSize="15" fontWeight="800" fill={ENCRE}>taille ?</text><text x={72} y={54} fontSize="15" fontWeight="700" fill={VERT}>hauteur A′B′ = {M.cmAuto(im.hImg)}</text>
        <text x={16} y={78} fontSize="15" fontWeight="800" fill={ENCRE}>sens ?</text><text x={72} y={78} fontSize="15" fontWeight="700" fill={VERT}>renversée (B′ sous l’axe)</text>
      </Cadre>
    </div>);
}

// ── Carte 4 : le grandissement (Thalès) ──
export function FicheGrandissement() {
  const mise = carteMise(150), c = M.construction(12, M.F_PARCOURS, 4), im = c.image;
  return (
    <div>
      <SceneLentille o={{ d: 12, h: 4, rayons: { 2: 'complet' }, image: true, points: ['A', 'B', 'O', 'F', 'Fp', 'Ap', 'Bp'] }} mise={mise} max={320} note={true} sous={sousTriangles(c)}
        label="Deux triangles semblables de part et d’autre de la lentille, de sommet commun O : le triangle OAB (gris) et le triangle OA′B′ (vert), tracés à l’échelle. L’image est deux fois plus petite que l’objet." />
      <Cadre h={64} label="Exemple chiffré : A′B′ ÷ AB = 2 ÷ 4 = 0,5 et OA′ ÷ OA = 6 ÷ 12 = 0,5.">
        <rect x={6} y={6} width={288} height={52} rx="10" fill="#eff6ff" stroke={BLEU} strokeWidth="1.5" />
        <text x={150} y={28} textAnchor="middle" fontSize="15" fontWeight="700" fill={VERT}>{M.nombreFR(im.hImg, 0)} ÷ {M.nombreFR(c.h, 0)} = {M.nombreFR(im.gamma, 1)}  (les hauteurs)</text>
        <text x={150} y={48} textAnchor="middle" fontSize="15" fontWeight="700" fill={VERT}>{M.nombreFR(im.OAp, 0)} ÷ {M.nombreFR(c.d, 0)} = {M.nombreFR(im.gamma, 1)}  (les distances)</text>
      </Cadre>
    </div>);
}

// ── Carte 5 : l'effet de la distance de l'objet (3 cas côte à côte, mêmes échelles) ──
export function FicheDistanceObjet() {
  const lignes = [12, 8, 6].map(d => { const c = M.construction(d); return { d, ...c.image }; });
  const noms = { 12: ['loin', 'plus petite'], 8: ['à 2f′', 'même taille'], 6: ['plus proche', 'plus grande'] };
  const K = 10, hauteur = 3 * 82 + 8;
  return (
    <Cadre h={hauteur} label="Trois cas, à la même échelle, pour une lentille de distance focale 4&nbsp;cm. Objet à 12&nbsp;cm : image deux fois plus petite que l’objet, à 6&nbsp;cm de la lentille. Objet à 8&nbsp;cm, soit 2f′ : image de même taille, à 8&nbsp;cm. Objet à 6&nbsp;cm : image deux fois plus grande, à 12&nbsp;cm. Plus l’objet se rapproche, plus l’image s’éloigne et grandit.">
      {lignes.map((l, i) => {
        const yc = 4 + 82 * i + 34, xo = 112, xi = 160;
        return (
          <g key={l.d}>
            <rect x={4} y={4 + 82 * i} width={292} height={76} rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
            <text x={12} y={yc - 8} fontSize="15" fontWeight="800" fill={ENCRE}>OA = {l.d}&nbsp;cm</text>
            <text x={12} y={yc + 14} fontSize="14" fontWeight="700" fill={GRIS}>{noms[l.d][0]}</text>
            <line x1={100} y1={yc} x2={176} y2={yc} stroke="#94a3b8" strokeWidth="1.4" />
            <line x1={xo} y1={yc} x2={xo} y2={yc - M.H_OBJ * K} stroke={ENCRE} strokeWidth="3.6" /><polygon points={`${xo},${yc - M.H_OBJ * K - 2} ${xo - 4.5},${yc - M.H_OBJ * K + 7} ${xo + 4.5},${yc - M.H_OBJ * K + 7}`} fill={ENCRE} />
            <line x1={xi} y1={yc} x2={xi} y2={yc + l.hImg * K} stroke={VERT} strokeWidth="3.6" /><polygon points={`${xi},${yc + l.hImg * K + 2} ${xi - 4.5},${yc + l.hImg * K - 7} ${xi + 4.5},${yc + l.hImg * K - 7}`} fill={VERT} />
            <text x={188} y={yc - 6} fontSize="15" fontWeight="800" fill={VERT}>{noms[l.d][1]}</text>
            <text x={188} y={yc + 16} fontSize="15" fontWeight="800" fill={ORANGE}>× {M.nombreFR(l.gamma, l.gamma === 0.5 ? 1 : 0)}</text>
          </g>);
      })}
    </Cadre>);
}
