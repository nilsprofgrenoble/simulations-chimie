import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi, avecIndices, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import { tire } from "./Travail";
import * as M from "./chiraliteModele";
import { Cram, VueAxe, COUL_GROUPE } from "./ChiraliteSchema";
import { FICHES } from "./ChiraliteFiches";

const SIM_ID = 137;
declarerDefis(SIM_ID, [['rs', 'Configuration R ou S d’un carbone asymétrique'], ['cram', 'Obtenir la configuration demandée'], ['nasym', 'Compter les carbones asymétriques']]);

// ====================================================
//  SIM 137 — CHIRALITÉ ET CONFIGURATION ABSOLUE R/S (TSTL, PCM : Constitution de la matière › Structure spatiale)
//  Chaque carbone asymétrique = 4 groupes classés par priorité (règles CIP du programme) + leur disposition (dessin de Cram).
//  R si, le groupe n°4 étant derrière, 1 → 2 → 3 tourne dans le sens horaire ; S sinon. Tout est calculé par chiraliteModele.js (testé).
// ====================================================
const MO = id => M.parId(id), cen = m => m.centres[0];
const dispo = (id, noms) => M.affDepuis(MO(id), cen(MO(id)), noms);
const avecConf = (id, conf, opt) => M.affAvecConfig(MO(id), cen(MO(id)), conf, opt);
const confDe = (id, aff) => M.configuration(MO(id).g, cen(MO(id)), aff);
const ordreTxt = (m, c) => M.classementCIP(m.g, c).ordre.map((x, k) => `${k + 1} : ${M.etiquette(m, c, x.j)}`).join('   ');

// Dispositions fixes du parcours (les lettres R/S sont calculées, jamais écrites à la main)
const A_LAC = dispo('lactique', { A: 'OH', B: 'COOH', W: 'CH₃', D: 'H' });
const A_PRO = dispo('propan2ol', { A: 'CH₃', B: 'CH₃', W: 'OH', D: 'H' });
const A_BCFM = dispo('bcfm', { A: 'Cl', B: 'F', W: 'Br', D: 'H' });
const A_BCE = dispo('bromochloroethane', { A: 'CH₃', B: 'Cl', W: 'H', D: 'Br' });
const A_BCP = dispo('bromochloropropane', { A: 'Br', B: 'CH₃', W: 'H', D: 'CH₂Cl' });
const A_AMP = dispo('aminopropanol', { A: 'CH₃', B: 'NH₂', W: 'CH₂OH', D: 'H' });
const A_ALA = avecConf('aminobutanoique', 'R');
const A_ALA2 = avecConf('aminobutanoique', 'S');
const A_CLP = avecConf('chloropropanoique', 'R');
const A_DIR = avecConf('aminopropanol', 'S', { dernier: 'D' });
const A_DEV = avecConf('bromochloropropane', 'R', { dernier: 'W' });
const A_SER = dispo('serine', { A: 'COOH', B: 'NH₂', W: 'CH₂OH', D: 'H' });
const CONF_ALA = confDe('aminobutanoique', A_ALA), CONF_ALA2 = confDe('aminobutanoique', A_ALA2), CONF_CLP = confDe('chloropropanoique', A_CLP), CONF_DIR = confDe('aminopropanol', A_DIR), CONF_DEV = confDe('bromochloropropane', A_DEV);
const THR = MO('threonine');
const CIBLE_THR = ['S', 'R'];                                   // (2S,3R) demandé à l’étape des deux carbones
const FLIPS_DEPART = [[false, false], [false, true], [true, false], [true, true]].find(f => M.descripteurs(THR, M.affChaine(THR, f)).join() === CIBLE_THR.map(M.inverse).join());

const P0 = { id: 'lactique', aff: A_LAC, flips: [false, false], miroir: false, rangs: false, axe: false, fleche: false, t: 0, cv: 0, clics: [], err: null };

// ---------- illustrations ----------
function Helices() {
  const pts = (cx, yb) => Array.from({ length: 181 }, (_, i) => { const th = i / 180 * 6 * Math.PI; return { x: cx + 34 * Math.cos(th), y: yb - 150 * th / (6 * Math.PI), av: Math.sin(th) > 0 }; });
  const morceaux = P => { const res = []; let cur = [P[0]]; for (let i = 1; i < P.length; i++) { if (P[i].av === cur[0].av) cur.push(P[i]); else { cur.push(P[i]); res.push(cur); cur = [P[i]]; } } res.push(cur); return res; };
  const dessin = M0 => morceaux(pts(100, 196)).map((seg, k) => <polyline key={k} points={seg.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={seg[1].av ? '#0f172a' : '#94a3b8'} strokeWidth={seg[1].av ? 5 : 3} strokeLinecap="round" strokeLinejoin="round" data-m={M0}/>);
  return (
    <svg viewBox="0 0 420 262" role="img" aria-label="Deux ressorts en hélice : celui de droite est l’image de celui de gauche dans un miroir vertical" style={{ width: '100%', maxWidth: 440, height: 'auto', display: 'block', margin: '0 auto' }}>
      <g>{dessin(0)}</g>
      <line x1="210" y1="14" x2="210" y2="214" stroke="#0369a1" strokeWidth="3" strokeDasharray="8 6"/>
      <text x="210" y="238" textAnchor="middle" fontSize="20" fontWeight="800" fill="#0369a1">miroir</text>
      <g transform="translate(420,0) scale(-1,1)">{dessin(1)}</g>
      <text x="100" y="256" textAnchor="middle" fontSize="19" fontWeight="800" fill="#334155">ressort</text>
      <text x="320" y="256" textAnchor="middle" fontSize="19" fontWeight="800" fill="#334155">son image</text>
    </svg>);
}
const ATOMES_Z = [['H', 1], ['C', 6], ['N', 7], ['O', 8], ['F', 9], ['S', 16], ['Cl', 17], ['Br', 35]];
function TableZ() {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }} role="table" aria-label="Numéros atomiques Z de quelques atomes">
      {ATOMES_Z.map(([s, z]) => (
        <div key={s} role="row" style={{ minWidth: 62, textAlign: 'center', border: '2px solid #0369a1', borderRadius: 10, padding: '6px 4px', background: '#fff' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0369a1' }}>{s}</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#334155' }}>Z = {z}</div>
        </div>))}
    </div>);
}
// couleurs : un groupe = une couleur ; deux groupes identiques = la même couleur
function couleursGroupes(m, c, aff) {
  const vus = {}; const res = {};
  M.EMPLACEMENTS.forEach(e => { const j = aff[e], et = M.etiquette(m, c, j); if (!(et in vus)) vus[et] = COUL_GROUPE[Object.keys(vus).length % 4]; res[j] = vus[et]; });
  return res;
}
const rangsDe = (m, c) => Object.fromEntries(M.classementCIP(m.g, c).ordre.map((x, k) => [x.j, k + 1]));
const fusion = (a, b) => ({ ...a, ...b });
const BRAS = ['A', 'B', 'W', 'D'];
const PAIRES = { 'plan': ['A', 'B'], 'devant': ['W', 'D'], 'gauche': ['A', 'W'] };
const NOMS_PAIRES = { plan: 'Échanger les deux groupes du plan', devant: 'Échanger coin plein et tirets', gauche: 'Échanger le groupe du plan à gauche et le coin plein' };

// ====================================================
//  COMPOSANT
// ====================================================
export function SimulationChiralite() {
  const [mode, setMode] = useState(() => modeOuverture('chiralite-guide-v1'));
  useSignalerMode(mode);
  const [suiviR, noterR] = useCompteurDefi(), [suiviC, noterC] = useCompteurDefi(), [suiviN, noterN] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('chiralite-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('rs');
  const [hypoOuv, setHypoOuv] = useState(false), [molOuv, setMolOuv] = useState(false), [axeOuv, setAxeOuv] = useState(false);
  const [P, setP] = useState(P0);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const m = MO(P.id), chaine = !!m.chaine;
  const c = chaine ? (P.cv === 0 ? m.chaine.c1 : m.chaine.c2) : cen(m);
  const affs = chaine ? M.affChaine(m, P.flips) : [P.aff];
  const aff = affs[chaine ? P.cv : 0];
  const cl = M.classementCIP(m.g, c), distinct = cl.distincts;
  const conf = distinct ? M.configuration(m.g, c, aff) : null;
  const nAsym = M.centresAsym(m).length;

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const dep = patch => () => setP(x => ({ ...P0, id: x.id, aff: x.aff, flips: x.flips, ...patch }));
  const sensDe = r => (r === 'R' ? 'horaire' : 'antihoraire');
  const qcmRS = conf => ({ options: [`${conf} : 1 → 2 → 3 tourne dans le sens ${sensDe(conf)}`, `${M.inverse(conf)} : 1 → 2 → 3 tourne dans le sens ${sensDe(conf)}`, `${M.inverse(conf)} : 1 → 2 → 3 tourne dans le sens ${sensDe(M.inverse(conf))}`, 'on ne peut pas conclure : cela dépend de l’observateur'], bonne: 0 });
  const ETAPES = [
    { id: 'vis', titre: 'Un objet et son image', sc: 'vis', focus: ['scene'], depart: dep({}),
      texte: <>Voici un <strong>ressort en hélice</strong> et <strong>son image dans un miroir</strong> (le trait bleu est le miroir). Les deux ressorts se ressemblent beaucoup : l’un est l’image de l’autre. On se demande s’ils sont <strong>identiques</strong>, c’est-à-dire si l’on peut poser exactement l’un sur l’autre en le tournant ou en le déplaçant, sans le déformer.</>,
      tache: { type: 'qcm', q: 'Peut-on superposer le ressort et son image dans le miroir, en les tournant ?', options: ['non : leurs hélices sont de sens opposés', 'oui : il suffit de retourner l’image du ressort', 'oui : les deux ressorts ont la même taille', 'oui : le miroir ne modifie jamais un objet'], bonne: 0,
        indice: 'Suivez le trait épais (côté face) : monte-t-il vers la droite ou vers la gauche dans chaque ressort ?', expl: 'Dans un ressort, le trait de face monte vers la droite ; dans l’image il monte vers la gauche. En tournant le ressort, on ne change jamais ce sens d’enroulement : les deux objets sont différents.' } },
    { id: 'chirale', titre: 'Le mot « chiral »', sc: 'vis', focus: [], depart: null,
      texte: <>Un objet est dit <strong>chiral</strong> quand il n’est <strong>pas superposable à son image dans un miroir</strong>. Votre main droite est chirale : son image dans un miroir ressemble à une main gauche, qu’on ne peut pas superposer à la main droite. Au contraire, un verre ou un ballon sont superposables à leur image : ils ne sont pas chiraux.</>,
      tache: { type: 'qcm', q: 'Quel objet est chiral ?', options: ['une main', 'un ballon', 'un verre', 'une règle plate'], bonne: 0,
        indice: 'Cherchez l’objet dont l’image dans un miroir n’est pas le même objet : il existe une version « droite » et une version « gauche ».', expl: 'Il existe une main droite et une main gauche, différentes. Un ballon, un verre ou une règle plate sont identiques à leur image.' } },
    { id: 'cram', titre: 'Dessiner une molécule dans l’espace', sc: 'cram', focus: ['scene'], depart: dep({ id: 'lactique', aff: A_LAC }),
      texte: <>Une molécule est un objet en trois dimensions, mais la feuille n’en a que deux. Pour dessiner l’espace, on utilise la <strong>représentation de Cram</strong> : le carbone est au centre, un <strong>trait plein</strong> est dans le plan de la feuille, un <strong>coin plein</strong> pointe <strong>vers vous</strong> (devant la feuille) et des <strong>tirets</strong> partent <strong>vers l’arrière</strong>. Voici l’acide lactique : le groupe CH₃ est dessiné avec un coin plein.</>,
      tache: { type: 'qcm', q: 'Où se trouve le groupe CH₃ par rapport à la feuille ?', options: ['devant la feuille, vers l’observateur', 'derrière la feuille, loin de l’observateur', 'dans le plan de la feuille, comme un trait plein', 'à l’intérieur de l’atome de carbone'], bonne: 0,
        indice: 'Le coin plein est large du côté du groupe : il « sort » de la feuille vers vous.', expl: 'Le coin plein indique que la liaison C–CH₃ est dirigée vers l’observateur : le groupe CH₃ est devant la feuille. Les tirets, eux, indiquent un groupe derrière.' } },
    { id: 'quatre', titre: 'Quatre liaisons', sc: 'cram', focus: ['scene'], depart: null,
      texte: <>Un atome de carbone forme toujours <strong>4 liaisons</strong>. Sur le dessin de l’acide lactique, regardez le carbone du centre : chaque liaison le relie à un groupe, y compris l’atome d’hydrogène <strong>H</strong>, qu’on dessine ici pour ne rien oublier.</>,
      tache: { type: 'num', q: 'Combien de liaisons partent du carbone central, sur ce dessin ?', unite: '', vrai: 4, tol: 0, affiche: v => `${v}`, carnet: false,
        calcul: () => ['Traits : OH et COOH (2 liaisons dans le plan).', 'Coin plein : CH₃ (1). Tirets : H (1).', 'Total : 2 + 1 + 1 = 4 liaisons.'], pieges: [[3, 'Vous avez oublié la liaison avec H (en tirets) : le carbone en a toujours 4.'], [2, 'Comptez aussi le coin plein et les tirets, pas seulement les traits.']],
        expl: 'Le carbone central est lié à OH, COOH, CH₃ et H : 4 liaisons.', indice: 'Comptez les traits pleins, le coin plein et les tirets.' } },
    { id: 'asym', titre: 'Le carbone asymétrique', sc: 'cram', focus: ['scene'], depart: null,
      retenirTitre: 'À RETENIR : LE DESSIN DE CRAM', retenir: FICHES.cram,
      texte: <>Les 4 groupes du carbone central de l’acide lactique ont des couleurs différentes : <strong>OH</strong>, <strong>COOH</strong>, <strong>CH₃</strong> et <strong>H</strong>. Un carbone lié à <strong>4 atomes ou groupes tous différents</strong> est un <strong>carbone asymétrique</strong>, noté <strong>C*</strong>.</>,
      tache: { type: 'num', q: 'Combien de groupes différents sont liés au carbone central de l’acide lactique ?', unite: '', vrai: 4, tol: 0, affiche: v => `${v}`, carnet: false,
        calcul: () => ['Les groupes sont OH, COOH, CH₃ et H.', 'Aucun n’est identique à un autre : 4 groupes différents.'], pieges: [[3, 'Les quatre groupes sont différents : OH, COOH, CH₃ et H.']],
        expl: '4 groupes différents : le carbone central est asymétrique (C*).', indice: 'Comparez OH, COOH, CH₃ et H deux à deux : y en a-t-il deux identiques ?' } },
    { id: 'achiral', titre: 'Quand il n’y a pas de C*', sc: 'cram', focus: ['scene'], depart: dep({ id: 'propan2ol', aff: A_PRO }),
      texte: <>Regardez maintenant le propan-2-ol, CH₃–CH(OH)–CH₃. Son carbone central est lié à deux groupes <strong>CH₃</strong>, de la même couleur, puis à OH et à H.</>,
      tache: { type: 'qcm', q: 'Le carbone central du propan-2-ol est-il asymétrique ?', options: ['non, il porte deux groupes CH₃ identiques', 'oui, car un carbone porte toujours 4 liaisons', 'oui, car il porte à la fois OH et H', 'non, car il ne porte aucun atome d’hydrogène'], bonne: 0,
        indice: 'Pour être asymétrique, le carbone doit porter 4 groupes tous différents.', expl: 'Le carbone porte deux groupes identiques (CH₃) : il n’est pas asymétrique. Cette molécule n’est pas chirale.' } },
    { id: 'choisir', titre: 'Reconnaître un C*', sc: 'formule', focus: [], depart: null,
      texte: <>Voici quatre molécules écrites en formule semi-développée. Pour chacune, cherchez un carbone lié à 4 groupes différents (n’oubliez pas les H).</>,
      tache: { type: 'qcm', q: 'Laquelle possède un carbone asymétrique ?', options: ['CH₃–CHCl–COOH', 'CH₃–CH₂–OH', 'H₂N–CH₂–COOH', 'CH₃CH₂–CHCl–CH₂CH₃'], bonne: 0,
        indice: 'Un CH₂ porte deux H identiques : il ne peut pas être asymétrique. Le C* doit aussi avoir deux groupes carbonés différents.', expl: 'Le carbone de CHCl dans CH₃–CHCl–COOH est lié à CH₃, Cl, COOH et H : 4 groupes différents. Dans CH₃CH₂–CHCl–CH₂CH₃, il porte deux groupes éthyle identiques ; les deux autres molécules n’ont que des CH₂ ou des groupes répétés.' } },
    { id: 'miroir-cram', titre: 'L’image dans un miroir', sc: 'miroir', focus: ['scene', 'reglages'], depart: dep({ id: 'lactique', aff: A_LAC }),
      texte: <>Revenons à l’acide lactique. Cochez « Afficher l’image dans un miroir » : le dessin de droite est l’image de la molécule dans un miroir vertical (les groupes de gauche et de droite sont échangés, le coin plein reste un coin plein).</>,
      tache: { type: 'action', ok: enGuide && P.miroir, consigne: 'Affichez l’image de la molécule dans un miroir.' } },
    { id: 'miroir-q', titre: 'Superposables ou non ?', sc: 'miroir', focus: ['scene'], depart: dep({ id: 'lactique', aff: A_LAC, miroir: true }),
      texte: <>On ne peut pas superposer les deux dessins : en tournant la molécule de gauche, on ne retrouve jamais celle de droite, comme pour les deux ressorts. Une molécule qui n’est pas superposable à son image dans un miroir a un nom.</>,
      tache: { type: 'qcm', q: 'Comment appelle-t-on une molécule non superposable à son image dans un miroir ?', options: ['une molécule chirale', 'une molécule achirale', 'une molécule asymétrique', 'une molécule symétrique'], bonne: 0,
        indice: 'On a utilisé ce mot pour la main droite et la main gauche.', expl: 'Une molécule non superposable à son image est chirale. Une molécule qui possède un seul carbone asymétrique est chirale. La relation entre une molécule chirale et son image dans un miroir s’appelle l’énantiomérie : ces deux molécules sont des énantiomères.' } },
    { id: 'z', titre: 'Classer les atomes : le numéro atomique', sc: 'z', focus: ['scene'], depart: null,
      retenirTitre: 'À RETENIR : C* ET MOLÉCULE CHIRALE', retenir: FICHES.asym,
      texte: <>Pour <strong>décrire</strong> une molécule chirale, on classe ses 4 groupes de <strong>1</strong> (prioritaire) à <strong>4</strong> (le moins prioritaire). Ce sont les <strong>règles de Cahn, Ingold et Prelog</strong> (CIP). Première règle : on regarde l’atome lié au carbone C* ; <strong>plus son numéro atomique Z est grand, plus il est prioritaire</strong>. Voici quelques valeurs de Z.</>,
      tache: { type: 'num', q: 'Parmi C, N et O, quel est le numéro atomique Z de l’atome le plus prioritaire ?', unite: '', vrai: 8, tol: 0, affiche: v => `${v}`, carnet: false,
        calcul: () => ['Z(C) = 6, Z(N) = 7, Z(O) = 8.', 'Le plus grand Z est celui de O : 8.'], pieges: [[7, 'N a Z = 7, mais O a un Z plus grand.'], [6, 'C a le plus petit Z des trois.']],
        expl: 'O (Z = 8) est prioritaire devant N (Z = 7) et C (Z = 6).', indice: 'Cherchez le plus grand des trois nombres Z.' } },
    { id: 'cip1-ex', titre: 'Un exemple de classement', sc: 'cram', focus: ['scene'], depart: dep({ id: 'bcfm', aff: A_BCFM, rangs: true }),
      texte: <>Exemple : bromochlorofluorométhane. Autour du C*, il y a <strong>Br</strong> (Z = 35), <strong>Cl</strong> (Z = 17), <strong>F</strong> (Z = 9) et <strong>H</strong> (Z = 1). On range par Z décroissant : <strong>1 = Br, 2 = Cl, 3 = F, 4 = H</strong>. Les pastilles numérotées du dessin donnent ce classement.</>,
      tache: { type: 'num', q: 'Quel est le numéro de priorité de Cl dans cet exemple ?', unite: '', vrai: 2, tol: 0, affiche: v => `${v}`, carnet: false,
        calcul: () => ['Z(Br) = 35 > Z(Cl) = 17 > Z(F) = 9 > Z(H) = 1.', 'Cl vient en 2e position.'], pieges: [[1, 'Br (Z = 35) passe avant Cl (Z = 17).'], [3, 'F (Z = 9) vient après Cl (Z = 17).']],
        expl: 'Br (35) > Cl (17) > F (9) > H (1) : Cl a la priorité 2.', indice: 'Rangez Br, Cl, F, H du plus grand Z au plus petit.' } },
    { id: 'cip1-eleve', titre: 'À vous de classer', sc: 'cram', focus: ['scene'], depart: dep({ id: 'bromochloroethane', aff: A_BCE }),
      texte: <>Dans le 1-bromo-1-chloroéthane, classez les groupes du C*. <strong>Cliquez</strong> sur le groupe n°1, puis sur le n°2, puis sur le n°3 : le dernier sera le n°4. Comparez l’atome lié au carbone : pour CH₃, c’est le carbone (Z = 6).</>,
      tache: { type: 'action', ok: enGuide && P.clics.length >= 3, consigne: 'Cliquez sur les groupes dans l’ordre de priorité : 1, 2, 3.' } },
    { id: 'egalite', titre: 'Égalité : on regarde plus loin', sc: 'cram', focus: ['scene'], depart: dep({ id: 'bromochloropropane', aff: A_BCP, rangs: true }),
      texte: <>Que faire si deux groupes sont liés au C* par le même atome ? Exemple avec le 2-bromo-1-chloropropane : <strong>CH₃</strong> et <strong>CH₂Cl</strong> commencent tous deux par un carbone. On regarde alors les <strong>atomes voisins</strong> de ce carbone : (Cl, H, H) pour CH₂Cl et (H, H, H) pour CH₃. On compare dans l’ordre du plus grand Z : Cl l’emporte sur H, donc <strong>CH₂Cl est prioritaire sur CH₃</strong>. Classement : 1 = Br, 2 = CH₂Cl, 3 = CH₃, 4 = H.</>,
      tache: { type: 'qcm', q: 'Quels sont les atomes voisins du carbone de CH₂Cl ?', options: ['Cl, H, H', 'H, H, H', 'C, Cl, H', 'Cl, Cl, H'], bonne: 0,
        indice: 'CH₂Cl : le carbone est lié à 2 H, à 1 Cl, et au C* (qu’on ne compte pas : on en vient).', expl: 'Le carbone de CH₂Cl est lié à Cl, H et H (en plus du C* d’où l’on part).' } },
    { id: 'egalite-q', titre: 'À vous : CH₂OH ou CH₃ ?', sc: 'cram', focus: ['scene'], depart: dep({ id: 'aminopropanol', aff: A_AMP }),
      texte: <>Dans le 2-aminopropan-1-ol, les groupes <strong>CH₃</strong> et <strong>CH₂OH</strong> commencent tous deux par un carbone (Z = 6). Voisins du carbone de CH₃ : (H, H, H). Voisins du carbone de CH₂OH : (O, H, H).</>,
      tache: { type: 'qcm', q: 'Lequel est le plus prioritaire ?', options: ['CH₂OH, car O (Z = 8) l’emporte sur H (Z = 1)', 'CH₃, car une chaîne plus courte est prioritaire', 'CH₃, car il a plus d’atomes H que CH₂OH', 'aucun des deux : on ne peut pas les départager'], bonne: 0,
        indice: 'Comparez les voisins dans l’ordre : le premier O de CH₂OH face au premier H de CH₃.', expl: 'On compare (O, H, H) à (H, H, H) : O (8) l’emporte sur H (1) au premier rang, donc CH₂OH est prioritaire sur CH₃.' } },
    { id: 'double', titre: 'La double liaison compte deux fois', sc: 'cram', focus: ['scene'], depart: dep({ id: 'lactique', aff: A_LAC }),
      retenirTitre: 'À RETENIR : LA RÈGLE DES PRIORITÉS', retenir: FICHES.regle,
      texte: <>Dans le groupe <strong>COOH</strong> de l’acide lactique, le carbone porte un oxygène par <strong>double liaison</strong> (C=O) et un oxygène par liaison simple (–OH). Règle : une double liaison compte <strong>deux fois</strong>, comme si l’atome au bout était écrit deux fois.</>,
      tache: { type: 'num', q: 'Combien d’atomes O sont comptés comme voisins du carbone de COOH ?', unite: '', vrai: 3, tol: 0, affiche: v => `${v}`, carnet: false,
        calcul: () => ['C=O compte 2 fois : 2 atomes O.', '–OH : 1 atome O.', 'Total : 2 + 1 = 3. Les voisins sont (O, O, O).'], pieges: [[2, 'Il manque un O : la double liaison C=O compte pour 2, et –OH ajoute 1.'], [1, 'Une double liaison compte pour 2 atomes, pas pour 1.']],
        expl: 'Les voisins du carbone de COOH sont (O, O, O) : la double liaison C=O compte deux fois, plus l’oxygène de –OH.', indice: 'C=O compte pour deux O. Ajoutez celui de –OH.' } },
    { id: 'cip2-eleve', titre: 'À vous : un acide aminé', sc: 'cram', focus: ['scene'], depart: dep({ id: 'aminobutanoique', aff: A_ALA }),
      texte: <>Classez les groupes du C* de l’<strong>acide 2-aminobutanoïque</strong>, CH₃CH₂–CH(NH₂)–COOH. Cliquez sur le n°1, puis le n°2, puis le n°3. Pour départager <strong>COOH</strong> (O, O, O) et <strong>CH₂CH₃</strong> (C, H, H), comparez leurs voisins.</>,
      tache: { type: 'action', ok: enGuide && P.clics.length >= 3, consigne: 'Cliquez sur les groupes dans l’ordre de priorité : 1, 2, 3.' } },
    { id: 'cip3-eleve', titre: 'À vous : la sérine', sc: 'cram', focus: ['scene'], depart: dep({ id: 'serine', aff: A_SER }),
      retenirTitre: 'À RETENIR : LA DOUBLE LIAISON', retenir: FICHES.double,
      texte: <>Dernier classement, la <strong>sérine</strong> : HOCH₂–CH(NH₂)–COOH. Trois groupes sont liés par un carbone ou un azote : cherchez celui qui commence par l’atome de plus grand Z, puis départagez <strong>COOH</strong> (O, O, O) et <strong>CH₂OH</strong> (O, H, H) en comparant leurs voisins un à un.</>,
      tache: { type: 'action', ok: enGuide && P.clics.length >= 3, consigne: 'Cliquez sur les groupes dans l’ordre de priorité : 1, 2, 3.' } },
    { id: 'axe', titre: 'Regarder depuis l’axe C → 4', sc: 'axe', focus: ['scene', 'reglages'], depart: dep({ id: 'aminobutanoique', aff: A_ALA, rangs: true }),
      texte: <>Pour trouver R ou S, on regarde la molécule <strong>depuis le côté opposé au groupe n°4</strong> : le groupe n°4 doit être <strong>derrière</strong> le carbone, loin de vous. Faites glisser le curseur « Tourner la molécule » jusqu’à 100 %. À la fin, le groupe n°4 est caché derrière le carbone et on voit les groupes 1, 2 et 3 autour de lui.</>,
      tache: { type: 'action', ok: enGuide && P.t >= 0.99, consigne: 'Amenez le curseur « Tourner la molécule » à 100 %.' } },
    { id: 'sens', titre: 'Le sens de rotation 1 → 2 → 3', sc: 'axe', focus: ['scene'], depart: dep({ id: 'aminobutanoique', aff: A_ALA, rangs: true, t: 1, fleche: true }),
      texte: <>La flèche relie 1 → 2 → 3 : elle tourne dans le sens {M.sensDansLAxe(MO('aminobutanoique').g, cen(MO('aminobutanoique')), A_ALA) === 'horaire' ? 'des aiguilles d’une montre (horaire)' : 'inverse des aiguilles d’une montre (antihoraire)'}. Règle : sens <strong>horaire</strong> ⇒ configuration <strong>R</strong> (du latin rectus, « droit ») ; sens <strong>antihoraire</strong> ⇒ configuration <strong>S</strong> (sinister, « gauche »).</>,
      tache: { type: 'qcm', q: 'Quelle est la configuration de cette molécule d’acide 2-aminobutanoïque ?', options: CONF_ALA === 'R' ? ['R : sens horaire', 'S : la flèche tourne dans le sens horaire', 'S : la flèche tourne dans le sens inverse', 'on ne peut pas le dire sans calcul'] : ['S : sens inverse', 'R : la flèche tourne dans le sens inverse', 'R : la flèche tourne dans le sens horaire', 'on ne peut pas le dire sans calcul'], bonne: 0,
        indice: 'Horaire = R ; antihoraire = S. Regardez le sens dans lequel la flèche tourne.', expl: `Sens ${CONF_ALA === 'R' ? 'horaire' : 'antihoraire'} avec le groupe 4 derrière : configuration ${CONF_ALA}.` } },
    { id: 'lire1', titre: 'À vous : lire la configuration', sc: 'axe', focus: ['scene'], depart: dep({ id: 'aminobutanoique', aff: A_ALA2, rangs: true, t: 1 }),
      texte: <>Autre molécule d’acide 2-aminobutanoïque, vue directement depuis l’axe C → 4 (le groupe 4 est caché derrière). Suivez 1 → 2 → 3 avec votre doigt.</>,
      tache: { type: 'qcm', q: 'Quelle est la configuration de cette molécule ?', ...qcmRS(CONF_ALA2),
        indice: 'Partez de la pastille 1, allez à la 2, puis à la 3 : tournez-vous comme une aiguille de montre ?', expl: `1 → 2 → 3 tourne dans le sens ${CONF_ALA2 === 'R' ? 'horaire : R' : 'antihoraire : S'}.` } },
    { id: 'lire2', titre: 'Encore un exemple', sc: 'axe', focus: ['scene'], depart: dep({ id: 'chloropropanoique', aff: A_CLP, rangs: true, t: 1 }),
      texte: <>Acide 2-chloropropanoïque, CH₃–CHCl–COOH, vu depuis l’axe C → 4. Classement : 1 = Cl, 2 = COOH, 3 = CH₃, 4 = H.</>,
      tache: { type: 'qcm', q: 'Quelle est la configuration de cette molécule ?', ...qcmRS(CONF_CLP),
        indice: 'Suivez 1 → 2 → 3 sur le dessin : horaire = R, antihoraire = S.', expl: `1 → 2 → 3 tourne dans le sens ${CONF_CLP === 'R' ? 'horaire : R' : 'antihoraire : S'}.` } },
    { id: 'cram-direct', titre: 'Lire directement sur le dessin de Cram', sc: 'cram', focus: ['scene'], depart: dep({ id: 'aminopropanol', aff: A_DIR, rangs: true }),
      retenirTitre: 'À RETENIR : LIRE R OU S', retenir: FICHES.lire,
      texte: <>Sur un dessin de Cram, si le groupe n°4 est en <strong>tirets</strong>, il est déjà derrière : on peut <strong>lire directement</strong> le sens 1 → 2 → 3 sur le dessin. Ici le n°4 (H) est en tirets.</>,
      tache: { type: 'qcm', q: 'Quelle est la configuration de ce 2-aminopropan-1-ol ?', ...qcmRS(CONF_DIR),
        indice: 'Le n°4 est derrière : lisez 1 → 2 → 3 directement sur le dessin.', expl: `Le n°4 est en tirets, donc la lecture directe est valable : 1 → 2 → 3 tourne dans le sens ${CONF_DIR === 'R' ? 'horaire : R' : 'antihoraire : S'}.` } },
    { id: 'h-devant', titre: 'Quand le n°4 est devant', sc: 'cram', focus: ['scene'], depart: dep({ id: 'bromochloropropane', aff: A_DEV, rangs: true }),
      texte: <>Ici le groupe n°4 (H) est en <strong>coin plein</strong> : il est <strong>devant</strong>, on le regarde de son côté, ce qui <strong>inverse</strong> le sens apparent. Astuce : on lit 1 → 2 → 3 sur le dessin, puis on <strong>inverse</strong> la lettre. Si le sens lu est horaire, la configuration est S ; s’il est antihoraire, elle est R.</>,
      tache: { type: 'qcm', q: 'Quelle est la configuration de ce 2-bromo-1-chloropropane ?',
        options: [`${CONF_DEV} : sens lu ${sensDe(M.inverse(CONF_DEV))}, puis lettre inversée`, `${M.inverse(CONF_DEV)} : sens lu ${sensDe(M.inverse(CONF_DEV))}, lecture directe, sans inversion`, `${M.inverse(CONF_DEV)} : sens lu ${sensDe(CONF_DEV)}, puis lettre inversée`, `${CONF_DEV} : sens lu ${sensDe(CONF_DEV)}, lecture directe, sans inversion`], bonne: 0,
        indice: 'Lisez le sens sur le dessin, puis inversez la lettre parce que le n°4 est devant.', expl: `Le n°4 est devant : le sens lu est ${CONF_DEV === 'R' ? 'antihoraire' : 'horaire'} et la configuration est l’inverse de ce qu’on lirait : ${CONF_DEV}.` } },
    { id: 'inverse', titre: 'L’image dans un miroir inverse R et S', sc: 'miroir', focus: ['scene', 'reglages'], depart: dep({ id: 'bromochloropropane', aff: A_DEV, rangs: true, miroir: true }),
      texte: <>La molécule de l’étape précédente est <strong>{CONF_DEV}</strong>. Le dessin de droite est son image dans un miroir : les groupes de gauche et de droite sont échangés.</>,
      tache: { type: 'qcm', q: `La molécule de gauche est ${CONF_DEV}. Quelle est la configuration de son image dans le miroir ?`, options: CONF_DEV === 'R' ? ['S, car le miroir inverse R et S', 'R, car c’est la même molécule', 'R, car les groupes sont les mêmes', 'ni R ni S'] : ['R, car le miroir inverse R et S', 'S, car c’est la même molécule', 'S, car les groupes sont les mêmes', 'ni R ni S'], bonne: 0,
        indice: 'Échanger deux groupes (gauche et droite) change le sens de rotation de 1 → 2 → 3.', expl: `Dans le miroir, 1 → 2 → 3 tourne dans l’autre sens : la configuration devient ${M.inverse(CONF_DEV)}. Deux molécules images l’une de l’autre ont des configurations opposées.` } },
    { id: 'deux', titre: 'Deux carbones asymétriques', sc: 'chaine', focus: ['scene'], depart: dep({ id: 'threonine', flips: FLIPS_DEPART }),
      texte: <>La <strong>thréonine</strong> a deux carbones qui peuvent être asymétriques : C2 (lié à NH₂, COOH, H et à C3) et C3 (lié à OH, CH₃, H et à C2). Chaque carbone asymétrique reçoit <strong>sa propre lettre</strong>, précédée de son numéro : par exemple (2R,3S).</>,
      tache: { type: 'num', q: 'Combien la thréonine possède-t-elle de carbones asymétriques ?', unite: '', vrai: 2, tol: 0, affiche: v => `${v}`, carnet: false,
        calcul: () => ['C2 : NH₂, COOH, H, C3 : 4 groupes différents.', 'C3 : OH, CH₃, H, C2 : 4 groupes différents.', 'Total : 2.'], pieges: [[1, 'C2 et C3 portent chacun 4 groupes différents : les deux sont asymétriques.']],
        expl: 'C2 et C3 sont tous deux asymétriques : (2·,3·) donne deux lettres.', indice: 'Regardez les 4 groupes autour de C2, puis ceux autour de C3.' } },
    { id: 'deux-action', titre: 'Obtenir (2S,3R)', sc: 'chaine', focus: ['scene', 'reglages', 'mesures'], depart: dep({ id: 'threonine', flips: FLIPS_DEPART }),
      texte: <>Échanger le coin plein et les tirets d’un carbone <strong>inverse sa lettre</strong>. Utilisez les boutons pour obtenir la configuration <strong>(2S,3R)</strong>. Le panneau « Mesures » affiche la configuration de chaque carbone.</>,
      tache: { type: 'action', ok: enGuide && P.id === 'threonine' && M.descripteurs(THR, M.affChaine(THR, P.flips)).join() === CIBLE_THR.join(), consigne: 'Obtenez (2S,3R) en échangeant coin plein et tirets.' } },
    { id: 'bravo', titre: 'Bravo ! Le bilan', sc: 'chaine', focus: [], depart: null,
      retenirTitre: 'À RETENIR : LE BILAN', retenir: FICHES.bilan,
      texte: <>Vous savez repérer un carbone asymétrique, classer ses 4 groupes avec les règles CIP, regarder depuis l’axe C → 4 et donner la configuration R ou S, y compris pour deux carbones. Essayez l’exploration, puis les défis.</>, tache: null },
  ];
  const etape = Math.min(guide.etape, ETAPES.length - 1);
  const IDS = ETAPES.map(e => e.id), idE = ETAPES[etape].id, scE = ETAPES[etape].sc;
  const depuis = id => !enGuide || etape >= IDS.indexOf(id);
  const apres = id => !enGuide || etape > IDS.indexOf(id);
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  useEffect(() => {
    if (mode !== 'guide') return;
    const dd = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (dd) dd();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ DÉFIS ════════════════
  const dispoAlea = (mm, cc, conf, oppose) => { const L = M.toutesLesAff(mm, cc).filter(a => (oppose ? M.configuration(mm.g, cc, a) !== conf : true)); return tire(L); };
  const tirages = {
    rs: () => { const mm = tire(M.CHIRALES_1), a = tire(M.toutesLesAff(mm, cen(mm))); return { type: 'rs', mid: mm.id, aff: a, rep: null, verifie: false, rangs: false }; },
    cram: () => { const mm = tire(M.CHIRALES_1), cible = tire(['R', 'S']), a = dispoAlea(mm, cen(mm), cible, true); return { type: 'cram', mid: mm.id, aff: a, cible, verifie: false, rangs: false, reps: {} }; },
    nasym: () => { const mm = tire(M.CATALOGUE); return { type: 'nasym', mid: mm.id, reps: {}, verifie: false, vrai: M.centresAsym(mm).length }; },
  };
  const nouveauDefi = t => setDefi(tirages[t]());
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const majDefi = patch => setDefi(x => ({ ...x, ...patch, verifie: false }));
  const dm = defi ? MO(defi.mid) : null;
  const verifierDefi = () => {
    let ok;
    if (defi.type === 'rs') ok = defi.rep === M.configuration(dm.g, cen(dm), defi.aff);
    else if (defi.type === 'cram') ok = M.configuration(dm.g, cen(dm), defi.aff) === defi.cible;
    else { const x = lireNombre(defi.reps.r); ok = isFinite(x) && proche(x, defi.vrai, 0); }
    setDefi(x => ({ ...x, verifie: true, ok }));
    ({ rs: noterR, cram: noterC, nasym: noterN })[defi.type](ok);
  };
  const echangerDefi = cle => majDefi({ aff: M.echanger(defi.aff, ...PAIRES[cle]) });
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['rs', 'R ou S ?'], ['cram', 'Obtenir R ou S'], ['nasym', 'Compter les C*']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'rs' ? 'Défi : quelle est la configuration ?' : defi.type === 'cram' ? `Défi : obtenez la configuration ${defi.cible}` : 'Défi : combien de carbones asymétriques ?'}</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>
        {defi.type === 'rs' && <>Voici <strong>{dm.nom}</strong> en représentation de Cram. Classez les groupes du C* avec les règles CIP, puis choisissez la configuration du carbone : <strong>R</strong> ou <strong>S</strong>.</>}
        {defi.type === 'cram' && <>Voici <strong>{dm.nom}</strong>. Avec les boutons, échangez des groupes pour obtenir la configuration <strong>{defi.cible}</strong>, puis cliquez sur « Vérifier ».</>}
        {defi.type === 'nasym' && <>Voici la formule semi-développée de <strong>{dm.nom}</strong> : <strong style={{ fontFamily: 'monospace', fontSize: 16 }}>{dm.semi}</strong>. Comptez les carbones asymétriques (n’oubliez pas les atomes H).</>}
      </div>
      {defi.type === 'rs' && <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>{['R', 'S'].map(l => <button key={l} onClick={() => majDefi({ rep: l })} aria-pressed={defi.rep === l} style={{ ...stylePetitBouton(defi.rep === l, '#0369a1'), minWidth: 64, fontSize: 18 }}>{l}</button>)}</div>}
      {defi.type === 'cram' && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>{Object.keys(PAIRES).map(k => <button key={k} onClick={() => echangerDefi(k)} style={stylePetitBouton(false)}>{NOMS_PAIRES[k]}</button>)}</div>}
      {defi.type === 'nasym' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Nombre de C*</span>
          <input value={defi.reps.r ?? ''} aria-label="Nombre de carbones asymétriques" inputMode="numeric" onKeyDown={e => e.key === 'Enter' && document.getElementById('ch-verif')?.click()}
            onChange={e => setDefi(x => ({ ...x, reps: { r: e.target.value }, verifie: false }))}
            style={{ width: 70, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
        </div>)}
      {defi.type === 'rs' && <IndiceDefi cache={false}>Étapes : 1) classer les 4 groupes (Z de l’atome lié, puis les voisins) ; 2) placer le n°4 derrière : s’il est en coin plein, on inverse la lettre ; 3) sens de 1 → 2 → 3 : horaire = R, antihoraire = S.</IndiceDefi>}
      {defi.type === 'cram' && <IndiceDefi cache={false}>Chaque échange de deux groupes inverse la configuration. Déterminez d’abord la configuration actuelle (cochez « Afficher les priorités » si besoin).</IndiceDefi>}
      {defi.type === 'nasym' && <IndiceDefi cache={false}>Un C* est lié à 4 groupes tous différents. Un carbone CH₂, CH₃ ou lié à deux groupes identiques n’est pas asymétrique.</IndiceDefi>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="ch-verif" onClick={verifierDefi} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {avecIndices(defi.ok ? (defi.type === 'nasym' ? `✓ Correct : ${defi.vrai} carbone${defi.vrai > 1 ? 's' : ''} asymétrique${defi.vrai > 1 ? 's' : ''}.` : `✓ Correct : configuration ${M.configuration(dm.g, cen(dm), defi.aff)}.`)
          : defi.type === 'nasym' ? '✗ Vérifiez : un C* porte 4 groupes différents (H compris).' : defi.type === 'cram' ? '✗ La configuration obtenue n’est pas celle demandée : échangez deux groupes.' : '✗ Vérifiez le classement des groupes, la position du n°4 (devant : on inverse) et le sens de 1 → 2 → 3.')}
      </div>}
    </div>);

  // ════════════════ HYPOTHÈSES ════════════════
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Règles CIP limitées au programme</strong> : on compare le numéro atomique Z de l’atome lié au C*, puis, en cas d’égalité, les atomes voisins couche par couche. Les cas plus subtils (isotopes, cycles, groupes très ramifiés) ne sont pas traités.</li>
      <li><strong>Double liaison</strong> : comptée deux fois (l’atome du bout est écrit deux fois) ; les liaisons triples, les cycles et les aromatiques ne sont pas dans le catalogue.</li>
      <li><strong>Molécules</strong> : chaînes ouvertes, tous les H sont dessinés autour du carbone étudié. On ne considère pas les composés méso (deux carbones asymétriques compensés).</li>
      <li><strong>Dessin de Cram</strong> : convention de perspective (coin plein vers l’observateur, tirets vers l’arrière). Les angles ne sont pas à l’échelle ; la molécule réelle est un tétraèdre.</li>
      <li><strong>Configuration absolue R/S</strong> : calculée avec le groupe n°4 derrière. Si le n°4 est devant, on lit le sens puis on inverse la lettre.</li>
      <li><strong>Limite</strong> : la lettre R ou S ne dit rien du sens de rotation de la lumière polarisée ; c’est une autre mesure.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;

  // ════════════════ SCÈNE ════════════════
  const clicRang = j => setP(x => {
    if (x.clics.includes(j)) return x;
    const mm = MO(x.id), cc = cen(mm), cll = M.classementCIP(mm.g, cc), attendu = cll.ordre[x.clics.length].j;
    if (j === attendu) return { ...x, clics: [...x.clics, j], err: null };
    const et = M.etiquette(mm, cc, j);
    return { ...x, err: et === 'H' ? 'H a le plus petit numéro atomique (Z = 1) : il sera classé en dernier.' : `« ${et} » n’est pas le suivant : cherchez, parmi les groupes restants, celui dont l’atome lié a le plus grand Z (en cas d’égalité, comparez les atomes voisins).` };
  });
  const clicsActifs = enGuide && ['cip1-eleve', 'cip2-eleve', 'cip3-eleve'].includes(idE);
  const rangsClics = (() => { const r = {}; P.clics.forEach((j, k) => { r[j] = k + 1; }); if (P.clics.length >= 3) M.EMPLACEMENTS.forEach(e => { if (!(aff[e] in r)) r[aff[e]] = 4; }); return r; })();
  const rangsTous = (() => { let r = {}; (chaine ? [m.chaine.c1, m.chaine.c2] : [c]).forEach(cc => { if (M.classementCIP(m.g, cc).distincts) r = fusion(r, rangsDe(m, cc)); }); return r; })();
  const veutRangs = enGuide ? ETAPES[etape].depart !== undefined && P.rangs : P.rangs;
  const rangsAff = clicsActifs ? rangsClics : (veutRangs ? rangsTous : null);
  const couleurs = enGuide && ['asym', 'achiral'].includes(idE) ? couleursGroupes(m, c, aff) : null;
  const cramPair = chaine ? null : (
    <div style={{ display: 'grid', gap: 8, gridTemplateColumns: P.miroir ? 'repeat(auto-fit, minmax(250px, 1fr))' : 'minmax(0, 1fr)' }}>
      <div><Cram mol={m} affs={affs} rangs={rangsAff} couleurs={couleurs} onChoisir={clicsActifs ? clicRang : null} ariaLabel={`Représentation de Cram de ${m.nom}`}/>{P.miroir && <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: KIT.txt2 }}>molécule</div>}</div>
      {P.miroir && <div><Cram mol={m} affs={affs} rangs={rangsAff} miroir ariaLabel={`Image de ${m.nom} dans un miroir`}/><div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#0369a1' }}>image dans un miroir</div></div>}
    </div>);
  const cramChaine = chaine && <Cram mol={m} affs={affs} rangs={rangsAff} ariaLabel={`Représentation de Cram de ${m.nom}, deux carbones C2 et C3`}/>;
  const vueAxe = <VueAxe mol={m} c={c} aff={aff} t={P.t} avecRangs fleche={P.fleche} ariaLabel={`Vue de ${m.nom} depuis l’axe du carbone vers le groupe de priorité 4`}/>;
  const montrerAxe = enGuide ? scE === 'axe' : P.axe;
  const sceneContenu = (() => {
    if (enGuide) {
      if (scE === 'vis') return <Helices/>;
      if (scE === 'z') return <TableZ/>;
      if (scE === 'formule') return <div style={{ display: 'grid', gap: 6, justifyContent: 'center', fontSize: 20, fontWeight: 700, color: KIT.txt, textAlign: 'center' }}><div>CH₃–CHCl–COOH</div><div>CH₃–CH₂–OH</div><div>H₂N–CH₂–COOH</div><div>CH₃CH₂–CHCl–CH₂CH₃</div></div>;
      if (scE === 'axe') return vueAxe;
      if (scE === 'chaine') return cramChaine;
      return cramPair;
    }
    return <div style={{ display: 'grid', gap: 10 }}>{chaine ? cramChaine : cramPair}{montrerAxe && vueAxe}</div>;
  })();
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {enDefi && defi ? (defi.type === 'nasym' ? <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, color: KIT.txt, padding: '30px 6px', overflowWrap: 'anywhere' }}>{dm.semi}</div>
        : <Cram mol={dm} affs={[defi.aff]} rangs={defi.rangs ? rangsDe(dm, cen(dm)) : null} ariaLabel={`Représentation de Cram de ${dm.nom}`}/>) : sceneContenu}
      {clicsActifs && P.err && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: '#dc2626', lineHeight: 1.45 }}>{P.err}</div>}
      {clicsActifs && P.clics.length >= 3 && <div role="status" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: '#15803d' }}>✓ Classement trouvé : {ordreTxt(m, c)}</div>}
    </div>);

  // ════════════════ MESURES ════════════════
  const afficheConf = enExplore || (enGuide && ['deux-action', 'bravo'].includes(idE));
  const mesures = (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {(enExplore || depuis('asym')) && <LigneMesure nom="Carbones asymétriques (C*)" valeur={`${nAsym}`} couleur="#b45309"/>}
      {(enExplore || apres('miroir-q')) && <LigneMesure nom="Molécule chirale ?" valeur={nAsym > 0 ? 'oui' : 'non'} couleur={nAsym > 0 ? '#15803d' : '#475569'}/>}
      {enExplore && distinct && <div style={{ padding: '5px 0', borderBottom: `1px dashed ${KIT.bord}`, fontSize: 14 }}>
        <div style={{ color: KIT.txt2, fontWeight: 600 }}>{`Priorités${chaine ? ` (C${m.numeros[P.cv]})` : ''}`}</div>
        <div style={{ color: '#b91c1c', fontWeight: 700, display: 'flex', flexWrap: 'wrap', gap: '2px 14px', marginTop: 2 }}>{cl.ordre.map((x, k) => <span key={x.j}>{k + 1} : {M.etiquette(m, c, x.j)}</span>)}</div>
      </div>}
      {enExplore && !distinct && <LigneMesure nom="Priorités" valeur="deux groupes identiques" couleur="#475569"/>}
      {enExplore && distinct && <LigneMesure nom={`Sens de 1 → 2 → 3, n°4 derrière`} valeur={M.sensDansLAxe(m.g, c, aff)} couleur="#0369a1"/>}
      {afficheConf && (chaine
        ? <LigneMesure nom="Configuration" valeur={`(${m.numeros[0]}${M.configuration(m.g, m.chaine.c1, affs[0]) || '–'},${m.numeros[1]}${M.configuration(m.g, m.chaine.c2, affs[1]) || '–'})`} couleur="#b45309"/>
        : <LigneMesure nom="Configuration absolue" valeur={conf || 'sans objet'} couleur="#b45309"/>)}
      {enExplore && P.miroir && !chaine && conf && <LigneMesure nom="Image dans un miroir" valeur={M.inverse(conf)} couleur="#0369a1"/>}
    </div>);

  // ════════════════ RÉGLAGES ════════════════
  const maj = patch => setP(x => ({ ...x, ...patch }));
  const echanger = cle => (chaine ? null : maj({ aff: M.echanger(P.aff, ...PAIRES[cle]), clics: [] }));
  const flip = i => maj({ flips: P.flips.map((f, k) => (k === i ? !f : f)) });
  const choisirMol = id => { const mm = MO(id); maj({ id, aff: M.toutesLesAff(mm, cen(mm))[0], flips: [false, false], cv: 0, clics: [], miroir: false }); };
  const resume = `${m.nom.replace(/ \(.*\)/, '')}${chaine ? '' : conf ? ` · ${conf}` : ''}`;
  const reglMol = (
    <Section titre={`Molécule : ${resume}`} ouvert={molOuv} onBascule={() => setMolOuv(o => !o)}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Choisir une molécule
        <select value={P.id} onChange={e => choisirMol(e.target.value)} style={{ display: 'block', width: '100%', minHeight: 42, marginTop: 4, fontSize: 15, borderRadius: 10, border: `1.5px solid ${KIT.bord}`, padding: '0 8px' }}>
          <optgroup label="Un carbone asymétrique">{M.CHIRALES_1.map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}</optgroup>
          <optgroup label="Deux carbones asymétriques">{M.DEUX_CENTRES.map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}</optgroup>
          <optgroup label="Pas de carbone asymétrique">{M.ACHIRALES.map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}</optgroup>
        </select>
      </label>
      {chaine && <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: KIT.txt, marginTop: 8 }}>Carbone étudié (priorités et vue dans l’axe)
        <select value={P.cv} onChange={e => maj({ cv: Number(e.target.value) })} style={{ display: 'block', width: '100%', minHeight: 42, marginTop: 4, fontSize: 15, borderRadius: 10, border: `1.5px solid ${KIT.bord}`, padding: '0 8px' }}>
          {m.numeros.map((n, i) => <option key={n} value={i}>C{n}</option>)}
        </select>
      </label>}
    </Section>);
  const boutonsEchange = chaine
    ? <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{m.numeros.map((n, i) => <button key={n} onClick={() => flip(i)} style={stylePetitBouton(false)}>Échanger coin plein et tirets en C{n}</button>)}</div>
    : <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{Object.keys(PAIRES).map(k => <button key={k} onClick={() => echanger(k)} style={stylePetitBouton(false)}>{NOMS_PAIRES[k]}</button>)}</div>;
  const caseA = (txt, val, fn) => <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 14, color: KIT.txt, cursor: 'pointer' }}><input type="checkbox" checked={val} onChange={e => fn(e.target.checked)}/>{txt}</label>;
  const reglagesExplore = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {reglMol}
      <div style={{ fontSize: 12.5, color: KIT.txt2, lineHeight: 1.45, marginBottom: 6 }}>Échanger deux groupes change la disposition dans l’espace : la configuration peut changer de lettre.</div>
      {boutonsEchange}
      {!chaine && caseA('Afficher l’image dans un miroir', P.miroir, v => maj({ miroir: v }))}
      {caseA('Afficher les priorités (pastilles 1 à 4)', P.rangs, v => maj({ rangs: v }))}
      <Section titre={`Regarder dans l’axe C → 4 · ${Math.round(P.t * 100)} %`} ouvert={axeOuv} onBascule={() => setAxeOuv(o => !o)}>
        {caseA('Afficher la vue dans l’axe', P.axe, v => maj({ axe: v }))}
        <Curseur nom="Tourner la molécule" valeur={P.t * 100} onChange={v => maj({ t: v / 100, axe: true })} min={0} max={100} pas={1} unite="%" decimales={0} couleur="#0f172a"/>
        {caseA('Afficher la flèche 1 → 2 → 3 (en fin de rotation)', P.fleche, v => maj({ fleche: v }))}
      </Section>
    </div>);
  const reglagesGuide = (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {['miroir-cram', 'inverse'].includes(idE) && caseA('Afficher l’image dans un miroir', P.miroir, v => maj({ miroir: v }))}
      {idE === 'axe' && <Curseur nom="Tourner la molécule" valeur={P.t * 100} onChange={v => maj({ t: v / 100 })} min={0} max={100} pas={1} unite="%" decimales={0} couleur="#0f172a"/>}
      {idE === 'deux-action' && boutonsEchange}
    </div>);
  const reglagesDefi = defi && defi.type !== 'nasym' && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {caseA('Afficher les priorités (pastilles 1 à 4)', defi.rangs, v => majDefi({ rangs: v }))}
    </div>);
  const aEssayer = indicesProfond(
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Choisissez l’acide 2-hydroxypropanoïque, affichez son image dans un miroir : que devient la lettre ?</li>
        <li>Échangez deux groupes : la lettre change-t-elle toujours ? Et en échangeant trois groupes de suite ?</li>
        <li>Mettez le groupe de priorité 4 en coin plein : le sens lu sur le dessin donne-t-il directement la bonne lettre ?</li>
        <li>Comparez le propan-2-ol et le 3-chloropentane : pourquoi n’ont-ils pas de C* ?</li>
        <li>Prenez la thréonine : combien de combinaisons (2·,3·) peut-on obtenir avec les boutons ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>C* : carbone lié à 4 groupes tous différents ; une molécule qui en a un seul est chirale</li>
        <li>priorités CIP : Z de l’atome lié, puis les voisins ; double liaison comptée deux fois</li>
        <li>n°4 derrière : 1 → 2 → 3 horaire = R, antihoraire = S ; n°4 devant : on inverse ; l’image dans un miroir inverse R et S</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ch-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ch-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ch-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .ch-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); }
        .ch-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .ch-l1.cote .ch-carte { order: 2; } .ch-l1.cote .ch-main { order: 1; } }
        @media (max-width: 900px) { .ch-l1.cote, .ch-pri { grid-template-columns: minmax(0, 1fr); } .ch-l1.cote .ch-main { order: 1; } .ch-l1.cote .ch-carte { order: 2; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Chiralité et configuration absolue R/S</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Qu’est-ce qu’un <strong>carbone asymétrique</strong> ? Comment classer ses 4 groupes avec les <strong>règles CIP</strong> et en déduire la configuration <strong>R</strong> ou <strong>S</strong> ?</div>
      <div className={`ch-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {enGuide ? <div className="ch-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="ch-carte">{panneauHypo}</div> : null}
        <div className="ch-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'rs' ? suiviR : defi.type === 'cram' ? suiviC : suiviN}/></div>}
          <div className={`ch-pri${mode !== 'explore' ? ' pile' : ''}`}>
            {scene}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {enGuide ? (['miroir-cram', 'inverse', 'axe', 'deux-action'].includes(idE) && reglagesGuide) : enDefi ? reglagesDefi : reglagesExplore}
              {(enExplore || (enGuide && depuis('asym') && scE !== 'vis')) && mesures}
            </div>
          </div>
        </div>
      </div>
      {(enExplore || (enGuide && etape >= ETAPES.length - 1)) && <div className="ch-l2">{panneauHypo}</div>}
      {enExplore && <div className="ch-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
