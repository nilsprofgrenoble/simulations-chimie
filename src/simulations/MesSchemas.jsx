// Cartes « À retenir » de la simulation 319 (formes mésomères, hybride, délocalisation d'un cation, forme la plus probable, bilan).
// viewBox de 300 de large, textes de 12 à 16, maxWidth 320. Les petites écritures de Lewis sont dessinées par SceneMes (cadre rogné).
import { K, svgStyle } from "./schemaOutils";
import * as M from "./mesModele";
import { SceneMes } from "./MesScene";

const OR = '#ea580c', VERT = '#15803d', ROUGE = '#b91c1c';
const cadre = (aria, h, children) => (
  <svg role="img" aria-label={aria} viewBox={`0 0 300 ${h}`} width="100%" style={{ ...svgStyle, maxWidth: 320 }}>
    <rect x="4" y="4" width="292" height={h - 8} rx="14" fill="#f8fafc" stroke={K.clair}/>{children}
  </svg>);
const E = id => M.ESPECES[id];
const mini = (id, f, x, y, w, extra = {}) => { const e = E(id), xs = e.atomes.map(a => a.x), ys = e.atomes.map(a => a.y), W = Math.max(...xs) - Math.min(...xs) + 84, H = Math.max(...ys) - Math.min(...ys) + 70;
  return <SceneMes e={e} f={f} compact rogne pos={{ x, y, w, h: w * H / W }} {...extra}/>; };
const hauteur = (id, w) => { const e = E(id), xs = e.atomes.map(a => a.x), ys = e.atomes.map(a => a.y); return w * (Math.max(...ys) - Math.min(...ys) + 70) / (Math.max(...xs) - Math.min(...xs) + 84); };
const t = (x, y, s, o = {}) => <text x={x} y={y} textAnchor={o.a || 'middle'} fontSize={o.size || 12.5} fontWeight={o.gras ? 800 : 400} fill={o.fill || K.txt}>{s}</text>;

// Carte 1 : les formes mésomères
export function SvgFormesCarte() {
  const e = E('ethanoate'), F = M.formes(e), w = 132, h = hauteur('ethanoate', w);
  return cadre('Formes mésomères de l’ion éthanoate : deux écritures de Lewis de la même espèce, reliées par une flèche à double pointe. Les atomes ne bougent pas, seuls les doublets et les charges changent.', 262,
    <g>
      {t(150, 26, 'Les formes mésomères', { size: 14.5, gras: true })}
      {mini('ethanoate', F[0], 6, 38, w, { arrows: M.coups(e, F[0])[0] })}
      {mini('ethanoate', F[1], 162, 38, w, { arrows: M.coups(e, F[1])[0] })}
      <path d="M 141 78 L 159 78 M 141 78 l 5 -4 M 141 78 l 5 4 M 159 78 l -5 -4 M 159 78 l -5 4" stroke={K.txt} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
      {t(150, 38 + h + 26, 'mêmes atomes, doublets déplacés', { gras: true, fill: OR })}
      {t(150, 38 + h + 46, 'le symbole ↔ n’est ni une réaction', {})}
      {t(150, 38 + h + 62, 'ni un équilibre : c’est la même espèce', {})}
    </g>);
}
// Carte 2 : l'hybride de résonance
export function SvgHybrideCarte() {
  const e = E('nitrate'), hy = M.hybride(e), w = 170, h = hauteur('nitrate', w), x0 = 65;
  return cadre('Hybride de résonance de l’ion nitrate : les trois liaisons N–O sont identiques, de longueur intermédiaire, et la charge moins est répartie sur les trois atomes d’oxygène.', 276,
    <g>
      {t(150, 26, 'L’hybride : la structure réelle', { size: 14.5, gras: true })}
      {mini('nitrate', M.formeInit(e), x0, 34, w, { hybride: hy })}
      {t(150, 34 + h + 20, 'ordre moyen N–O : (1 + 1 + 2) ÷ 3 = 1,33', { fill: K.txt })}
      {t(150, 34 + h + 38, 'charge moyenne de O : (−1 − 1 + 0) ÷ 3 = −0,67', { fill: K.txt })}
      {t(150, 34 + h + 58, 'formes équivalentes : moyenne simple', { gras: true, fill: OR })}
    </g>);
}
// Carte 3 : délocalisation dans un cation
export function SvgCationCarte() {
  const e = E('allyle'), F = M.formes(e), w = 132, h = hauteur('allyle', w);
  return cadre('Cation allyle : le carbone chargé a une lacune ; les électrons de la double liaison se déplacent vers lui et la lacune passe sur l’autre carbone terminal.', 262,
    <g>
      {t(150, 26, 'Une charge + qui se déplace', { size: 14.5, gras: true })}
      {mini('allyle', F[0], 6, 38, w, { arrows: M.coups(e, F[0])[0] })}
      {mini('allyle', F[1], 162, 38, w, { arrows: M.coups(e, F[1])[0] })}
      <path d="M 141 78 L 159 78 M 141 78 l 5 -4 M 141 78 l 5 4 M 159 78 l -5 -4 M 159 78 l -5 4" stroke={K.txt} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
      {t(150, 38 + h + 26, 'lacune = carbone à 3 liaisons, 6 électrons', { fill: K.txt })}
      {t(150, 38 + h + 46, 'la charge + est partagée entre', { gras: true, fill: OR })}
      {t(150, 38 + h + 62, 'les deux carbones terminaux', { gras: true, fill: OR })}
    </g>);
}
// Carte 4 : forme la plus probable
export function SvgProbableCarte() {
  const e = E('amide'), F = M.formes(e), w = 132, h = hauteur('amide', w);
  return cadre('Forme la plus probable : pour l’éthanamide, l’écriture sans charge formelle contribue le plus à la structure réelle ; l’écriture à charges séparées contribue peu.', 236,
    <g>
      {t(150, 26, 'Toutes les formes ne se valent pas', { size: 14.5, gras: true })}
      {mini('amide', F[0], 2, 38, w)}
      {mini('amide', F[1], 146, 38, w)}
      {t(68, 38 + h + 20, 'sans charges', { gras: true, fill: VERT })}
      {t(68, 38 + h + 37, 'forme la plus probable', { fill: VERT, size: 12 })}
      {t(212, 38 + h + 20, 'charges séparées', { gras: true, fill: ROUGE })}
      {t(212, 38 + h + 37, 'forme peu probable', { fill: ROUGE, size: 12 })}
      {t(150, 38 + h + 62, 'la plus probable : la moins chargée', { gras: true, fill: K.txt })}
    </g>);
}
// Carte 5 : bilan
export function SvgBilanMesCarte() {
  return cadre('Bilan : une écriture de Lewis valable garde les atomes en place, le même nombre d’électrons et l’octet ; plus une espèce a de formes mésomères, plus la charge est délocalisée et plus elle est stable.', 270,
    <g>
      {t(150, 26, 'Une forme mésomère valable', { size: 14.5, gras: true })}
      {[['✓', 'les atomes ne bougent pas'], ['✓', 'même nombre total d’électrons'], ['✓', 'octet respecté (≤ 4 doublets)']].map(([m, s], i) => <g key={i}>
        <rect x="22" y={42 + i * 34} width="256" height="28" rx="9" fill="#fff" stroke={VERT} strokeWidth="2"/>
        <text x="38" y={61 + i * 34} fontSize="15" fontWeight="800" fill={VERT}>{m}</text><text x="58" y={61 + i * 34} fontSize="12.5" fill={K.txt}>{s}</text></g>)}
      {t(150, 168, 'Plus de formes mésomères équivalentes', { gras: true, fill: OR })}
      {t(150, 186, '= charge plus délocalisée', { gras: true, fill: OR })}
      {t(150, 204, '= espèce plus stable', { gras: true, fill: OR })}
      {t(150, 232, 'forme la plus probable : la moins chargée,', { fill: K.txt })}
      {t(150, 249, 'charge − sur l’atome le plus électronégatif', { fill: K.txt })}
    </g>);
}
