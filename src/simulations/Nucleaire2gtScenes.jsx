// Scènes de la simulation 203 « Transformation nucléaire : isotopes, Soleil et centrales » (2GT).
// Les schémas sont dessinés à partir des primitives CALCULÉES par nucleaire2gtDispo.js (testé) : nombres exacts de protons et de neutrons, aucune étiquette sur un trait ni sur un autre texte.
// Textes de 18 à 22 dans un viewBox de 480, plafonnés à maxWidth 480 ; cartes en viewBox de 300 plafonnées à 320. Les aria-label du parcours sont NEUTRES (jamais une réponse).
import { KIT } from "../commun";
import { AmasSvg } from "./EquationReactionScenes";
import { MN } from "./rdaSchemas";
import * as M from "./nucleaire2gtModele";
import * as D from "./nucleaire2gtDispo";
import { COL } from "./nucleaire2gtCouleurs";

// ---------- rendu d'une scène (liste de primitives) ----------
function Noyau({ it }) {
  const { pts } = M.nucleonsC(it.Z, it.A), r = it.r, sw = Math.max(0.7, r * 0.12);
  return (
    <g>{pts.map((p, i) => (p.proton
      ? <g key={i}><circle cx={it.cx + p.x * r} cy={it.cy + p.y * r} r={r} fill={COL.proton} stroke={COL.protonTrait} strokeWidth={sw} />{r >= 6.5 && <path d={`M${it.cx + p.x * r - r * 0.5} ${it.cy + p.y * r}H${it.cx + p.x * r + r * 0.5}M${it.cx + p.x * r} ${it.cy + p.y * r - r * 0.5}V${it.cy + p.y * r + r * 0.5}`} stroke="#fff" strokeWidth={Math.max(1, r * 0.26)} strokeLinecap="round" fill="none" aria-hidden="true" />}</g>
      : <circle key={i} cx={it.cx + p.x * r} cy={it.cy + p.y * r} r={r} fill={COL.neutron} stroke={COL.neutronTrait} strokeWidth={sw} />))}</g>);
}
function Item({ it }) {
  switch (it.t) {
    case 'texte': return <text x={it.x} y={it.y} fontSize={it.taille} fontWeight={it.gras ? 800 : 500} fill={it.c} textAnchor={it.ancre}>{it.s}</text>;
    case 'noyau': return <Noyau it={it} />;
    case 'cercle': return <g><circle cx={it.cx} cy={it.cy} r={it.r} fill={it.fill} stroke={it.stroke} strokeWidth={it.sw} />{it.plus && <path d={`M${it.cx - it.r * 0.5} ${it.cy}H${it.cx + it.r * 0.5}M${it.cx} ${it.cy - it.r * 0.5}V${it.cy + it.r * 0.5}`} stroke="#fff" strokeWidth={Math.max(1, it.r * 0.26)} strokeLinecap="round" fill="none" aria-hidden="true" />}</g>;
    case 'ligne': return <line x1={it.x1} y1={it.y1} x2={it.x2} y2={it.y2} stroke={it.c} strokeWidth={it.w} strokeDasharray={it.tirets} />;
    case 'fleche': return <g><line x1={it.x1} y1={it.y1} x2={it.x2} y2={it.y2} stroke={it.c} strokeWidth={it.w} strokeLinecap="round" /><polygon points={it.tete.map(q => q.join(',')).join(' ')} fill={it.c} /></g>;
    case 'rect': return <rect x={it.x} y={it.y} width={it.w} height={it.h} rx={it.rx} fill={it.fill} stroke={it.stroke} strokeWidth={it.sw} />;
    case 'picto': return <Picto it={it} />;
    case 'amas': return <AmasSvg id={it.id} cx={it.cx} cy={it.cy} u={it.u} police={it.police} />;
    case 'coche': return it.ok
      ? <polyline points={`${it.cx - it.s * 0.8},${it.cy} ${it.cx - it.s * 0.2},${it.cy + it.s * 0.65} ${it.cx + it.s * 0.85},${it.cy - it.s * 0.7}`} fill="none" stroke={COL.vert} strokeWidth={Math.max(3, it.s * 0.3)} strokeLinecap="round" strokeLinejoin="round" />
      : <g stroke={COL.rouge} strokeWidth={Math.max(3, it.s * 0.3)} strokeLinecap="round"><line x1={it.cx - it.s * 0.7} y1={it.cy - it.s * 0.7} x2={it.cx + it.s * 0.7} y2={it.cy + it.s * 0.7} /><line x1={it.cx + it.s * 0.7} y1={it.cy - it.s * 0.7} x2={it.cx - it.s * 0.7} y2={it.cy + it.s * 0.7} /></g>;
    default: return null;
  }
}
// pictogrammes simples de la chaîne d'une centrale (dessinés dans un carré de côté 2s centré en (cx, cy))
function Picto({ it }) {
  const { kind, cx, cy, s } = it, k = s / 20, bleu = COL.bleu, o = COL.orange;
  const g = (c) => <g transform={`translate(${cx} ${cy}) scale(${k})`} fill="none" stroke={bleu} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{c}</g>;
  if (kind === 'reacteur') return g(<><rect x="-12" y="-18" width="24" height="36" rx="8" fill="#fff" /><circle cx="-4" cy="-6" r="3.4" fill={COL.proton} stroke={COL.protonTrait} strokeWidth="1.2" /><circle cx="5" cy="-2" r="3.4" fill="#fff" stroke={COL.gris} strokeWidth="1.2" /><circle cx="-3" cy="7" r="3.4" fill="#fff" stroke={COL.gris} strokeWidth="1.2" /><circle cx="5" cy="10" r="3.4" fill={COL.proton} stroke={COL.protonTrait} strokeWidth="1.2" /></>);
  if (kind === 'vapeur') return g(<><path d="M-15 2H15V14a4 4 0 0 1-4 4H-11a4 4 0 0 1-4-4Z" fill="#fff" /><path d="M-9 -2C-13 -7 -5 -9 -9 -15M0 -2C-4 -7 4 -9 0 -15M9 -2C5 -7 13 -9 9 -15" stroke={o} /></>);
  if (kind === 'turbine') return g(<><circle r="16" fill="#fff" /><path d="M0 0L-3 -14Q3 -15 4 -9ZM0 0L14 -3Q15 3 9 4ZM0 0L3 14Q-3 15 -4 9ZM0 0L-14 3Q-15 -3 -9 -4Z" fill={bleu} /><circle r="2.5" fill="#fff" stroke={bleu} /></>);
  if (kind === 'alternateur') return g(<><circle r="16" fill="#fff" /><path d="M3 -11L-6 2H0L-3 11L7 -3H1Z" fill="#facc15" stroke={o} /></>);
  if (kind === 'pylone') return g(<><path d="M0 -17L-8 17M0 -17L8 17M-5 2H5M-3 -8H3M-11 -12H11M-9 -17H9" /><path d="M-8 17L5 2M8 17L-5 2" strokeWidth="1.6" /></>);
  return null;
}

export function Dessin({ d, aria, max = 480, marge = 0 }) {
  return (
    <svg viewBox={`0 0 ${d.W} ${d.H}`} width="100%" style={{ width: '100%', maxWidth: max, height: 'auto', display: 'block', margin: `0 auto ${marge}px`, background: 'white', borderRadius: 10 }} role="img" aria-label={aria}>
      {d.items.map((it, i) => <Item key={i} it={it} />)}
    </svg>);
}
const memo = {};
const sc = (cle, f) => (memo[cle] ??= f());

// ---------- scènes du parcours (aria-label neutres) ----------
export const SceneIsoH = () => <Dessin d={sc('isoH', D.SCENES.isoH)} aria="Trois noyaux dessinés avec leurs protons (disques rouges marqués plus) et leurs neutrons (disques blancs), chacun avec son symbole et son nom." />;
export const SceneQuatre = () => <Dessin d={sc('quatre', D.SCENES.quatre)} aria="Quatre noyaux dessinés avec leurs protons (disques rouges) et leurs neutrons (disques blancs), chacun avec son symbole." />;
export const ScenePhysChim = () => <Dessin d={sc('physChim', D.SCENES.physChim)} aria="Deux transformations. En haut, des molécules d’eau avant et après la flèche. En bas, du méthane et du dioxygène avant la flèche, du dioxyde de carbone et de l’eau après." />;
export const SceneFusionFission = () => <Dessin d={sc('ff', D.SCENES.fusionFission)} aria="Deux transformations nucléaires dessinées avec des disques rouges et blancs : en haut, de petits noyaux avant la flèche et un noyau plus gros après ; en bas, un neutron et un gros noyau avant la flèche, deux noyaux plus petits et des neutrons après." />;
export const SceneFusion = () => <Dessin d={sc('fusion', D.SCENES.fusion)} aria="Une réaction nucléaire : deux noyaux et leurs symboles avant la flèche, un noyau et un neutron avec leurs symboles après, et de l’énergie libérée." />;
export const SceneFission = () => <Dessin d={sc('fission', D.SCENES.fission)} aria="Une réaction nucléaire : un neutron et un gros noyau avant, deux noyaux plus petits et des neutrons après, chacun avec son symbole, et de l’énergie libérée. Neutrons agrandis, schéma non à l’échelle." />;
export const SceneChaine = () => <Dessin d={sc('chaine', D.SCENES.chaine)} aria="Quatre cadres reliés par des flèches vers le bas : le cœur du réacteur, l’eau chauffée en vapeur, la turbine, l’alternateur. La forme d’énergie de l’eau chauffée n’est pas indiquée." />;
export const SceneEnergie = () => <Dessin d={sc('energie', D.SCENES.energie)} aria="Deux cadres : un kilogramme de charbon qui brûle et un kilogramme d’uranium 235 dont les noyaux se cassent ; l’énergie libérée de chacun est à trouver." />;
export const SceneBilan = () => <Dessin d={sc('bilan', D.SCENES.bilan)} aria="Tableau des trois natures de transformation (physique, chimique, nucléaire) : pour les molécules, les atomes et les noyaux, une coche verte quand ils sont les mêmes avant et après, une croix rouge sinon. Physique : trois coches. Chimique : une croix puis deux coches. Nucléaire : trois croix." />;

// ---------- écritures (HTML, MathML) ----------
const POLICE_MATH = "'Nunito', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif";
export const Nx = ({ Z, A }) => <math style={{ fontSize: '1.2em', whiteSpace: 'nowrap', fontFamily: POLICE_MATH }}><MN A={A} Z={Z} s={M.sym(Z)} /></math>;
const termeMath = (x, i) => <mrow key={i}>{x.c > 1 && <mn>{x.c}</mn>}<MN A={x.A} Z={x.Z} s={M.sym(x.Z)} /></mrow>;
const listeMath = L => L.flatMap((x, i) => (i ? [<mo key={`p${i}`}>+</mo>, termeMath(x, i)] : [termeMath(x, i)]));
// côté gauche, flèche, côté droit : sur un écran étroit, le côté droit passe à la ligne sous la flèche au lieu de déborder
export const EqNucleaire = ({ r }) => (
  <div className="nu-math" data-equation-tete="1" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '2px 8px', margin: '6px 0', fontFamily: POLICE_MATH }}>
    <math style={{ whiteSpace: 'nowrap' }}><mrow>{listeMath(r.gauche)}<mo>→</mo></mrow></math>
    <math style={{ whiteSpace: 'nowrap' }}><mrow>{listeMath(r.droite)}</mrow></math>
  </div>);
export const EqNucleaireEnLigne = ({ r }) => <math style={{ fontSize: '1.2em', whiteSpace: 'nowrap', fontFamily: POLICE_MATH }}><mrow>{listeMath(r.gauche)}<mo>→</mo>{listeMath(r.droite)}</mrow></math>;
// écriture chimique ou physique : texte avec espaces insécables, états entre parenthèses
export const EqTexte = ({ texte, lettre, couleur = KIT.txt }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, justifyContent: 'center', flexWrap: 'wrap', padding: '4px 0' }} data-equation-tete="1">
    {lettre && <span style={{ fontSize: 18, fontWeight: 800, color: KIT.txt2 }}>{lettre}</span>}
    <span style={{ fontSize: 18, fontWeight: 700, color: couleur, lineHeight: 1.6, textAlign: 'center', maxWidth: '100%' }}>{texte.split(' ').map((m, i) => <span key={i}>{i > 0 && ' '}<span style={{ whiteSpace: 'nowrap' }}>{m}</span></span>)}</span>
  </div>);
// une situation (défi, exploration) : texte, puis écriture éventuelle
export const SituationAffiche = ({ s }) => (
  <div>
    <div style={{ fontSize: 15, color: KIT.txt, lineHeight: 1.6, fontWeight: 600 }}>{s.texte}</div>
    {s.ecriture && <div style={{ marginTop: 4 }}><EqTexte texte={M.ecritureTexte(M.ECRITURES[s.ecriture])} /></div>}
    {s.reaction && <div style={{ marginTop: 4 }}><EqNucleaire r={M.REACTIONS[s.reaction]} /></div>}
  </div>);
// liste d'écritures A, B, C (étape « Reconnaître l'écriture »)
export const ListeEcritures = () => (
  <div>
    <EqTexte lettre="A" texte={M.ecritureTexte({ gauche: [{ c: 1, e: M.ESP.H2Ol }], droite: [{ c: 1, e: M.ESP.H2Og }] })} />
    <EqTexte lettre="B" texte={M.ecritureTexte({ gauche: [{ c: 1, e: M.ESP.Cs }, { c: 1, e: M.ESP.O2 }], droite: [{ c: 1, e: M.ESP.CO2g }] })} />
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}><span style={{ fontSize: 18, fontWeight: 800, color: KIT.txt2 }}>C</span><EqNucleaireEnLigne r={M.REACTIONS.fissionKr} /></div>
  </div>);

// ---------- exploration ----------
export const RangeeIsotopes = ({ Z }) => { const d = sc(`iso${Z}`, () => D.rangeeIsotopes(Z)); return <Dessin d={d} aria={`Les noyaux connus de l’élément ${M.nomEl(Z)}, dessinés avec leurs protons et leurs neutrons, chacun avec son symbole.`} />; };
export const DessinReaction = ({ id }) => { const d = sc(`r${id}`, () => D.dessinReaction(M.REACTIONS[id])); return <Dessin d={d} aria={`Dessin de la réaction : ${M.REACTIONS[id].titre}.`} />; };
export const DessinChimie = () => <ScenePhysChim />;
