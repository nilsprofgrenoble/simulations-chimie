/* eslint-disable no-irregular-whitespace -- espaces insécables écrites telles quelles devant les unités (° nm cm) et autour du signe = */
// Schémas des cartes « À retenir » de la simulation 201 « Dispersion de la lumière blanche par un prisme » (2GT).
// Chaque carte est affichée UNE ÉTAPE APRÈS la question qu'elle conclut ; ses exemples ne sont pas ceux que l'élève doit trouver à l'étape qui la porte.
// Les tracés de rayons sont les mêmes que dans les scènes (calculés par le modèle, mêmes couleurs). viewBox de 300 de large, textes de 13,5 à 15, maxWidth 320.
import { useMemo } from "react";
import { dispo, CARTES } from "./prisme2gtDispo";
import { DessinDispo } from "./Prisme2gtScenes";
import * as M from "./prisme2gtModele";
import { COL } from "./prisme2gtCouleurs";

const stl = { width: '100%', maxWidth: 320, height: 'auto', display: 'block', margin: '4px auto 6px', background: 'white', borderRadius: 8 };
const Figure = ({ cle, aria }) => { const d = useMemo(() => dispo(CARTES[cle]()), [cle]); return <DessinDispo d={d} aria={aria} max={320} />; };
// Encadré de texte (une ligne par élément de `lignes`, chacune avec sa couleur éventuelle)
const Encadre = ({ lignes, c = COL.vert, fond = '#f0fdf4', aria }) => {
  const pas = 21, h = 14 + pas * lignes.length;
  return (
    <svg viewBox={`0 0 300 ${h + 4}`} style={stl} role="img" aria-label={aria}>
      <rect x={6} y={2} width={288} height={h} rx="10" fill={fond} stroke={c} strokeWidth="1.5" />
      {lignes.map((l, i) => { const [t, col] = Array.isArray(l) ? l : [l, c]; return <text key={i} x={150} y={2 + 11 + pas * (i + 0.75)} textAnchor="middle" fontSize="13.5" fontWeight="700" fill={col}>{t}</text>; })}
    </svg>);
};
const rouge = M.couleurRayon(700), violet = M.couleurRayon(400);
const tr = M.trajet(50, 700), tv = M.trajet(50, 400);

// ── Carte 1 : la lumière blanche se disperse ──
export const FicheDispersion = () => (<>
  <Figure cle="dispersion" aria="Un faisceau de lumière blanche traverse un prisme : sur l’écran, les couleurs sont étalées du rouge, le moins dévié et le plus proche du trajet en pointillés sans prisme, au violet, le plus dévié." />
  <Encadre aria="Le rouge est le moins dévié, le violet est le plus dévié." lignes={[['Rouge : le moins dévié', rouge], ['Violet : le plus dévié', violet]]} c={COL.gris} fond="#f8fafc" />
</>);

// ── Carte 2 : l'indice dépend de la couleur ──
export const FicheIndice = () => (<>
  <Figure cle="indice" aria="Face d’entrée du prisme, écart entre les deux rayons exagéré pour qu’on le voie : le rayon violet, d’indice plus grand, est plus près de la normale que le rayon rouge." />
  <Encadre aria="Rouge : n égal 1,63 et i2 égal 28,0 degrés. Violet : n égal 1,69 et i2 égal 27,0 degrés." lignes={[[`rouge : n = ${M.nombreFR(1.63, 2)} → i₂ = ${M.degFR(tr.i2)}`, rouge], [`violet : n = ${M.nombreFR(1.69, 2)} → i₂ = ${M.degFR(tv.i2)}`, violet], ['n plus grand : plus près de la normale', COL.encre]]} c={COL.gris} fond="#f8fafc" />
</>);

// ── Carte 3 : deux faces, deux déviations ──
export const FicheDeuxFaces = () => (<>
  <Figure cle="deuxFaces" aria="Le prisme avec ses deux faces et leurs deux normales en pointillés, et le trajet sans prisme en pointillés : à chaque face, le violet est plus dévié que le rouge, et les écarts s’ajoutent." />
  <Encadre aria="Écart entre rouge et violet : environ 1 degré à l’entrée, 7,5 degrés à la sortie. Deux réfractions : les écarts s’ajoutent." lignes={['Entrée : écart d’environ 1 °', `Sortie : écart de ${M.nombreFR(tv.D - tr.D, 1)}${M.NB}°`, 'Deux réfractions : les écarts s’ajoutent']} />
</>);

// ── Carte 4 : lumière monochromatique et longueur d'onde ──
export function FicheMonochrome() {
  const W = 300, x0 = 18, x1 = 282, X = nm => x0 + (nm - 400) / 400 * (x1 - x0), bandes = []; for (let nm = 400; nm < 800; nm += 5) bandes.push(nm);
  return (<>
    <Figure cle="laser" aria="Un laser rouge de 650 nanomètres traverse le prisme : il est dévié, mais on ne voit qu’une seule tache sur l’écran." />
    <svg viewBox={`0 0 ${W} 108`} style={stl} role="img" aria-label="Échelle des longueurs d’onde du visible, de 400 nanomètres (violet) à 800 nanomètres (rouge), avec le laser de 650 nanomètres.">
      {bandes.map(nm => <rect key={nm} x={X(nm)} y={30} width={X(nm + 5) - X(nm) + 0.6} height={28} fill={M.couleurClaire(nm)} />)}
      <rect x={x0} y={30} width={x1 - x0} height={28} fill="none" stroke={COL.encre} strokeWidth="1.5" />
      {[400, 500, 600, 700, 800].map(nm => <g key={nm}><line x1={X(nm)} y1={58} x2={X(nm)} y2={65} stroke={COL.encre} strokeWidth="2" /><text x={X(nm)} y={80} textAnchor="middle" fontSize="13.5" fontWeight="700" fill={COL.encre}>{nm}</text></g>)}
      <text x={150} y={14} textAnchor="middle" fontSize="14" fontWeight="800" fill={COL.encre}>longueur d’onde (nm)</text>
      <line x1={X(650)} y1={22} x2={X(650)} y2={58} stroke={COL.encre} strokeWidth="3" /><text x={X(650)} y={100} textAnchor="middle" fontSize="13.5" fontWeight="800" fill={M.couleurRayon(650)}>laser : 650 nm</text>
    </svg>
    <Encadre aria="Une couleur pure est repérée par sa longueur d’onde, de 400 à 800 nanomètres environ." lignes={['Une couleur pure = une longueur d’onde', 'Le visible : de 400 à 800 nm environ']} c={COL.gris} fond="#f8fafc" />
  </>);
}

// ── Carte 5 : spectre continu et spectre de raies ──
export function FicheSpectres() {
  const W = 300, x0 = 18, x1 = 282, X = nm => x0 + (nm - 400) / 300 * (x1 - x0), bandes = []; for (let nm = 400; nm < 700; nm += 5) bandes.push(nm);
  const hg = M.lampe('mercure').raies;
  return (<>
    <svg viewBox={`0 0 ${W} 176`} style={stl} role="img" aria-label="Deux spectres sur l’écran : à gauche de la lumière blanche, un spectre continu avec toutes les couleurs du violet au rouge ; en dessous, la lampe à vapeur de mercure donne quelques raies colorées fines séparées par du noir.">
      <text x={150} y={18} textAnchor="middle" fontSize="14.5" fontWeight="800" fill={COL.encre}>lumière blanche : spectre continu</text>
      {bandes.map(nm => <rect key={nm} x={X(nm)} y={26} width={X(nm + 5) - X(nm) + 0.6} height={34} fill={M.couleurClaire(nm)} />)}
      <rect x={x0} y={26} width={x1 - x0} height={34} fill="none" stroke={COL.encre} strokeWidth="1.5" />
      <text x={150} y={92} textAnchor="middle" fontSize="14.5" fontWeight="800" fill={COL.encre}>lampe à mercure : spectre de raies</text>
      <rect x={x0} y={100} width={x1 - x0} height={34} fill="#111827" stroke={COL.encre} strokeWidth="1.5" />
      {hg.map(r => <rect key={r.nm} x={X(r.nm) - 2.2} y={100} width={4.4} height={34} fill={M.couleurClaire(r.nm)} />)}
      {[400, 500, 600, 700].map(nm => <g key={nm}><line x1={X(nm)} y1={134} x2={X(nm)} y2={140} stroke={COL.encre} strokeWidth="2" /><text x={X(nm)} y={156} textAnchor="middle" fontSize="13.5" fontWeight="700" fill={COL.encre}>{nm}</text></g>)}
      <text x={150} y={172} textAnchor="middle" fontSize="13.5" fill={COL.gris}>longueur d’onde (nm)</text>
    </svg>
    <Encadre aria="Continu : toutes les couleurs. Raies : quelques couleurs seulement." lignes={['Continu : toutes les couleurs', 'Raies : quelques couleurs seulement']} />
  </>);
}
