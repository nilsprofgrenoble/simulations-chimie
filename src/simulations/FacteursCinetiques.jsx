import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, avecIndices, ARetenir, LigneMesure, IndiceDefi, indicesProfond, FormuleEnLigne } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./facteursCinModele";
import { QCM_PARCOURS as Q } from "./facteursCinQcm";
import { GraphiqueC, LegendeC, Montage, EchelleDurees, CarteLenteRapide, CarteCapteurs, CarteTemperatureConcentration, CarteUnSeulFacteur, CarteCatalyseur, CarteCatalyseurReactif, STYLES, COL } from "./facteursCinSchemas";

const SIM_ID = 187, CLE_GUIDE = 'facteurs-cin-tg-guide-v1';
declarerDefis(SIM_ID, [['facteurs', 'Comparer des expériences'], ['catalyseur', 'Repérer le catalyseur'], ['capteur', 'Choisir les capteurs']]);

// ====================================================
// SIM 187 — FACTEURS CINÉTIQUES, CATALYSE ET CHOIX D'UN CAPTEUR DE SUIVI
//  (TG spé PC, « Modéliser l'évolution temporelle d'un système, siège d'une transformation chimique »).
//  Capacités visées (jamais affichées à l'élève) : justifier le choix d'un capteur de suivi temporel ; identifier, à partir de données expérimentales, des facteurs cinétiques ;
//  citer les propriétés d'un catalyseur et identifier un catalyseur à partir de données expérimentales ; transformations lentes et rapides.
//  Modèle CONSTRUIT : facteursCinModele.js (test : facteursCinModele.test.mjs). Vitesse volumique, t½ et ordre 1 : sim. 122 ; mécanismes : sim. 186.
// ====================================================
const { NB, nbf } = M;
const UL = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const nomCap = c => M.CAPTEURS[c].court;
const tCell = { border: '1px solid #cbd5e1', padding: '3px 5px', verticalAlign: 'top' };

// ---------- équation en tête de l'écran (HTML, 17 px, blocs insécables) ----------
function Equation({ especes }) {
  const cote = r => especes.filter(e => e.role === r).map((e, i) => <span key={i}>{i > 0 && ' + '}<span style={{ whiteSpace: 'nowrap' }}>{e.coeff > 1 ? `${e.coeff}${NB}` : ''}{e.f}</span></span>);
  return <span style={{ fontSize: 17, fontWeight: 700, color: KIT.txt }}>{cote('reactif')} <span style={{ whiteSpace: 'nowrap' }}>→ </span>{cote('produit')}</span>;
}
function Entete({ especes, suivi, contexte }) {
  return (
    <div style={{ ...styleBoite, padding: '8px 14px', marginBottom: 10 }} data-equation="1">
      <div style={{ lineHeight: 1.5 }}><Equation especes={especes}/></div>
      {contexte && <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5, marginTop: 2 }}>{contexte}</div>}
      {suivi && <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Espèce suivie : <strong style={{ color: KIT.txt }}>{suivi.nom} {suivi.f}</strong>{suivi.sens === 'reactif' ? ` (réactif, concentration initiale ${M.formatConc(suivi.cMax, suivi.unite)})` : ` (produit, concentration finale ${M.formatConc(suivi.cMax, suivi.unite)})`}.</div>}
    </div>);
}
const EnteteR = ({ rid, suivi = false, ctx = false }) => <Entete especes={M.REACTIONS[rid].especes} suivi={suivi ? M.REACTIONS[rid].suivi : null} contexte={ctx ? M.REACTIONS[rid].contexte : null}/>;

const typeTexte = e => `${{ ion: 'ion en solution', mol: 'molécule dissoute', gaz: 'gaz', solide: 'solide', liquide: 'liquide' }[e.type]}, ${e.couleur}`;
function TableEspeces({ especes }) {
  return (
    <div style={{ ...styleBoite, padding: '8px 10px', overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 14, width: '100%' }} aria-label="Espèces de la transformation et leurs propriétés">
        <thead><tr style={{ background: '#f1f5f9' }}><th style={{ ...tCell, textAlign: 'left' }}>Espèce</th><th style={{ ...tCell, textAlign: 'left' }}>Nom</th><th style={{ ...tCell, textAlign: 'left' }}>Propriétés</th></tr></thead>
        <tbody>{especes.map((e, i) => <tr key={i}><td style={{ ...tCell, fontWeight: 700, whiteSpace: 'nowrap' }}>{e.f}</td><td style={tCell}>{e.nom}</td><td style={tCell}>{typeTexte(e)}</td></tr>)}</tbody>
      </table>
    </div>);
}

// ---------- conditions d'expérience ----------
const nomCat = c => (c === 'aucun' ? 'aucun' : M.CATALYSEURS[c].nom);
function TableConditions({ rid, exps, t12Visible = false }) {
  const R = M.REACTIONS[rid];
  return (
    <div style={{ ...styleBoite, padding: '8px 10px', overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }} aria-label="Conditions des expériences">
        <thead><tr style={{ background: '#f1f5f9' }}>
          <th style={{ ...tCell, textAlign: 'left' }}>Exp.</th><th style={{ ...tCell, textAlign: 'left' }}>Temp.</th>
          {R.exces && <th style={{ ...tCell, textAlign: 'left' }}>{`c(${R.exces.f})`}</th>}
          {R.catalyseurs && <th style={{ ...tCell, textAlign: 'left' }}>Catalyseur</th>}
          {t12Visible && <th style={{ ...tCell, textAlign: 'left' }}>t½</th>}
        </tr></thead>
        <tbody>{exps.map((e, i) => <tr key={i}>
          <td style={{ ...tCell, fontWeight: 700, whiteSpace: 'nowrap' }}><svg width="26" height="10" viewBox="0 0 30 10" aria-hidden="true" style={{ marginRight: 4 }}><line x1="1" y1="5" x2="29" y2="5" stroke={STYLES[e.st ?? i].c} strokeWidth="3" strokeDasharray={STYLES[e.st ?? i].dash}/></svg>{e.nom.replace(/^Expérience /, 'Exp. ').replace(/ \(.*\)$/, '')}</td>
          <td style={{ ...tCell, whiteSpace: 'nowrap' }}>{e.cond.T}{NB}°C</td>
          {R.exces && <td style={{ ...tCell, whiteSpace: 'nowrap' }}>{M.formatCExces(R.exces.valeurs[e.cond.iB])}</td>}
          {R.catalyseurs && <td style={tCell}>{e.cond.cat === 'fe3' ? 'Fe³⁺' : e.cond.cat === 'catalase' ? 'catalase' : 'aucun'}</td>}
          {t12Visible && <td style={{ ...tCell, whiteSpace: 'nowrap', fontWeight: 700 }}>{M.formatDuree(M.t12(rid, e.cond))}</td>}
        </tr>)}</tbody>
      </table>
    </div>);
}
const diffParams = (rid, a, b) => [a.T !== b.T && 'T', a.iB !== b.iB && M.REACTIONS[rid].exces && 'c', a.cat !== b.cat && 'cat'].filter(Boolean);
const ex = (nom, cond, st) => ({ nom, cond, st });

// ---------- commandes − / + ----------
function Pas({ nom, texte, onMoins, onPlus, moinsOff, plusOff, aide }) {
  const b = { ...stylePetitBouton(false), minWidth: 44, minHeight: 44, fontSize: 22, lineHeight: 1 };
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}>{nom}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
        <button type="button" aria-label={`Diminuer : ${nom}`} onClick={onMoins} disabled={moinsOff} style={{ ...b, opacity: moinsOff ? 0.4 : 1 }}>−</button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 700, color: KIT.txt }} aria-live="polite">{texte}</div>
        <button type="button" aria-label={`Augmenter : ${nom}`} onClick={onPlus} disabled={plusOff} style={{ ...b, opacity: plusOff ? 0.4 : 1 }}>+</button>
      </div>
      {aide && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 2 }}>{aide}</div>}
    </div>);
}
const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
const lbSel = { display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 };

// ====================================================
export function SimulationFacteursCinetiques() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviF, noterF] = useCompteurDefi(), [suiviK, noterK] = useCompteurDefi(), [suiviC, noterC] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [typeDefi, setTypeDefi] = useState('facteurs'), [graine, setGraine] = useState(0);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ cond: false, comp: false, mes: false, essayer: false, retenir: false });
  const [e, setE] = useState({ rid: 'persulfate', capteur: 'spectro', cond: M.condRef('persulfate'), tm: 0, ref: null });
  const [exB, setExB] = useState({ T: 20, iB: 1, cat: 'aucun' });          // expérience B de l'étape « mettre en évidence »
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const etape = guide.etape;

  // ---------- exploration : état ----------
  const R = M.REACTIONS[e.rid], horizonMin = R.horizon / 60;
  const tmCur = Math.min(e.tm, horizonMin), kE = M.kcst(e.rid, e.cond), fE = 1 - Math.exp(-kE * tmCur * 60);
  const capOk = R.capteurs[e.capteur][0];
  const choisirReaction = rid => setE({ rid, capteur: M.REACTIONS[rid].proposes.find(c => M.REACTIONS[rid].capteurs[c][0]), cond: M.condRef(rid), tm: 0, ref: null });
  const majCond = f => setE(s => ({ ...s, cond: { ...s.cond, ...f } }));
  const rEx = e.ref ? e.ref : null;

  // ---------- étape « mettre en évidence » : B diffère-t-elle de A par un seul paramètre, plus rapide ? ----------
  const condA = { T: 20, iB: 1, cat: 'aucun' };
  const dB = diffParams('persulfate', condA, exB), plusRapide = M.t12('persulfate', exB) < M.t12('persulfate', condA) - 1e-9;
  const okSeul = dB.length === 1 && plusRapide;
  const msgSeul = dB.length === 0 ? 'B est identique à A : changez un paramètre.' : dB.length > 1 ? `B diffère de A par ${dB.length} paramètres (${dB.map(p => ({ T: 'température', c: 'concentration', cat: 'catalyseur' }[p])).join(' et ')}) : on ne pourrait pas attribuer l’écart à un seul facteur.` : !plusRapide ? `B ne diffère de A que par ${{ T: 'la température', c: 'la concentration', cat: 'le catalyseur' }[dB[0]]}, mais n’est pas plus rapide que A : essayez un autre changement.` : `✓ B ne diffère de A que par ${{ T: 'la température', c: 'la concentration', cat: 'le catalyseur' }[dB[0]]}, et elle est plus rapide.`;

  // ---------- étapes du parcours ----------
  const A20 = M.condRef('persulfate');
  const ETAPES = [
    { id: 'echelle', titre: 'Lente ou rapide ?',
      texte: <>Les transformations chimiques n’ont pas toutes la même durée. Le dessin place quatre transformations sur une échelle de durées (ordres de grandeur ; l’échelle est logarithmique : chaque graduation est beaucoup plus grande que la précédente). On distingue les transformations <strong>rapides</strong> et les transformations <strong>lentes</strong>.</>,
      tache: { type: 'qcm', q: 'Laquelle de ces transformations peut être qualifiée de rapide ?', ...Q.echelle,
        expl: 'Une transformation rapide est terminée dès le mélange des réactifs : on ne peut pas en suivre l’évolution. D’après l’échelle, c’est la précipitation de AgCl. Les trois autres durent de quelques minutes (décoloration du cristal violet) à une heure environ (oxydation de I⁻ par S₂O₈²⁻), voire des mois et des années (rouille) : elles sont lentes, car on peut en suivre l’évolution au cours du temps.',
        indice: 'Cherchez la barre la plus à gauche de l’échelle, avant « 1 s » : sa durée est si courte que la transformation paraît terminée dès le mélange.' } },
    { id: 'spectro', titre: 'Un premier capteur',
      retenirTitre: 'Lente ou rapide', retenir: <><CarteLenteRapide/>
        <ul style={UL}>
          <li>Rapide : <strong>terminée dès le mélange</strong>, on ne peut pas la suivre ; lente : son évolution dure assez longtemps pour être suivie.</li>
          <li>Exemple : Ag⁺ + Cl⁻ → AgCl est rapide ; I⁻ + S₂O₈²⁻ (environ une heure) est lente.</li>
          <li>Moyen de s’en souvenir : <strong>« lente = on a le temps de la suivre »</strong>. Idée fausse : « une transformation lente n’a pas lieu ».</li>
        </ul></>,
      texte: <>Pour étudier une transformation lente, on ne prélève pas d’échantillon : on place un <strong>capteur</strong> dans le système, qui mesure en continu une grandeur physique reliée à la concentration d’une espèce. On étudie l’oxydation des ions iodure I⁻ par les ions peroxodisulfate S₂O₈²⁻ (équation en haut) ; le tableau donne les propriétés des espèces.</>,
      tache: { type: 'qcm', q: 'Quel capteur permet de suivre l’évolution de cette transformation ?', ...Q.spectro,
        expl: 'Le diiode I₂ est la seule espèce colorée (jaune-brun) : sa concentration fait varier l’absorbance de la solution, que mesure un spectrophotomètre. Le pH-mètre ne convient pas : ni H₃O⁺ ni HO⁻ n’intervient dans l’équation. Le capteur de pression ne convient pas non plus : aucun gaz n’est formé ni consommé. D’autres capteurs pourraient aussi convenir (un conductimètre : les ions I⁻ et S₂O₈²⁻ laissent place aux ions SO₄²⁻, la conductivité varie donc, mais modestement) ; on retient ici le capteur le plus direct.',
        indice: 'Quelle grandeur mesure chaque capteur ? Cherchez dans le tableau une espèce dont la concentration change cette grandeur (couleur, acidité, gaz).' } },
    { id: 'pression', titre: 'Un gaz se forme',
      texte: <>L’eau oxygénée H₂O₂ se décompose lentement en eau et en dioxygène, en présence d’un catalyseur. La solution est placée dans un <strong>flacon fermé</strong> ; l’équation est en haut et le tableau donne les propriétés des espèces.</>,
      tache: { type: 'qcm', q: 'Quel capteur permet de suivre l’évolution de cette transformation ?', ...Q.pression,
        expl: 'Du dioxygène gazeux se forme : dans le flacon fermé, la pression augmente avec l’avancement, ce que mesure un capteur de pression. Le spectrophotomètre ne convient pas : H₂O₂, H₂O et O₂ sont incolores. Le conductimètre non plus : aucun ion n’apparaît ni ne disparaît. Le pH-mètre non plus : ni H₃O⁺ ni HO⁻ n’intervient dans l’équation.',
        indice: 'Regardez la colonne « Propriétés » du tableau : une espèce est un gaz. Que devient la pression dans un flacon fermé quand un gaz se forme ?' } },
    { id: 'conduct', titre: 'Des ions apparaissent',
      texte: <>Le 2-chloro-2-méthylpropane (CH₃)₃C–Cl réagit avec l’eau, dans un mélange d’eau et de propanone (équation en haut). Trois capteurs sont disponibles : un conductimètre, un spectrophotomètre et un capteur de pression.</>,
      tache: { type: 'qcm', q: 'Lequel de ces capteurs permet de suivre l’évolution de cette transformation ?', ...Q.conduct,
        expl: 'Les ions H₃O⁺ et Cl⁻ apparaissent : la conductivité de la solution augmente avec l’avancement, ce que mesure un conductimètre. Toutes les espèces sont incolores (le spectrophotomètre ne détecte rien) et aucun gaz ne se forme (la pression ne varie pas). Un pH-mètre aurait aussi pu convenir, puisque H₃O⁺ apparaît : plusieurs capteurs peuvent convenir pour une même transformation.',
        indice: 'Dans le tableau, repérez les espèces qui sont des ions : qu’est-ce que leur présence change dans une solution ?' } },
    { id: 'temperature', titre: 'Effet de la température',
      retenirTitre: 'Un capteur, une grandeur', retenir: <><CarteCapteurs/>
        <ul style={UL}>
          <li>On choisit le capteur d’après les <strong>espèces</strong> de l’équation : couleur, ions, H₃O⁺ ou HO⁻, gaz.</li>
          <li>Exemples : I₂ coloré, spectrophotomètre ; H₃O⁺ et Cl⁻ formés, conductimètre ; O₂ gazeux, capteur de pression.</li>
          <li>Moyen de s’en souvenir : <strong>« couleur, ions, acide, gaz »</strong>. Plusieurs capteurs peuvent convenir pour une même transformation.</li>
        </ul></>,
      texte: <>On revient à l’oxydation de I⁻ par S₂O₈²⁻, suivie par spectrophotométrie : les courbes donnent la concentration en diiode formé au cours du temps. Deux expériences, A et B, sont réalisées ; le tableau donne leurs conditions.</>,
      tache: { type: 'qcm', q: 'Que montre la comparaison de A et de B ?', ...Q.temperature,
        expl: 'La courbe B (40 °C) monte plus vite et atteint son plateau plus tôt : la transformation est plus rapide et son temps de demi-réaction est plus court (environ 4,5 min contre 18 min à 20 °C). Elle n’est pas plus lente, et la température ne change pas la quantité finale de diiode : les deux courbes finissent au même niveau, 2,0 mmol·L⁻¹.',
        indice: 'Seule la température change entre A et B. Quelle courbe atteint le plateau en premier ?' } },
    { id: 'concentration', titre: 'Effet de la concentration',
      texte: <>Même transformation, à 20 °C. Les expériences A et B ne diffèrent que par la concentration en ions iodure I⁻, le réactif en large excès : 0,050{NB}mol·L⁻¹ pour A et 0,10{NB}mol·L⁻¹ pour B. Les ions peroxodisulfate, réactif limitant, ont la même concentration initiale dans les deux expériences.</>,
      tache: { type: 'qcm', q: 'Que montre la comparaison de A et de B ?', ...Q.concentration,
        expl: 'La courbe B (I⁻ plus concentré) monte plus vite : la transformation est plus rapide, son temps de demi-réaction est plus court (environ 18 min contre 36 min). La transformation n’est pas plus lente, et la concentration en I⁻ modifie bien sa durée. La quantité finale de diiode est la même, car c’est le réactif limitant S₂O₈²⁻ qui la fixe.',
        indice: 'Une seule ligne du tableau change. Quelle courbe monte le plus vite ?' } },
    { id: 'seul', titre: 'Mettre en évidence un facteur',
      
      texte: <>L’expérience A (20 °C, 0,050{NB}mol·L⁻¹ d’ions iodure, sans catalyseur) est tracée en trait plein. Vous réglez l’expérience B (tirets) avec les boutons − et +.</>,
      tache: { type: 'action', ok: okSeul, consigne: 'Réglez B pour qu’elle ne diffère de A que par un seul paramètre et qu’elle soit plus rapide que A.' } },
    { id: 'catalyseur1', titre: 'Ajouter des ions fer(III)',
      retenirTitre: 'Température et concentration', retenir: <><CarteTemperatureConcentration/>
        <ul style={UL}>
          <li><strong>Plus chaud : t½ plus court</strong> ; réactif (en excès) plus concentré : t½ plus court.</li>
          <li>Exemple de la simulation : 20 °C, t½ = 18 min ; 40 °C, t½ = 4,5 min ; la quantité finale (2,0 mmol·L⁻¹) ne change pas.</li>
          <li>Moyen de s’en souvenir : <strong>« plus chaud, plus concentré : plus vite »</strong>. Idée fausse : « la température change la quantité finale ».</li>
        </ul></>,
      texte: <>On ajoute des ions fer(III) Fe³⁺ (0,020{NB}mmol dans 100{NB}mL) au mélange d’ions iodure (0,10{NB}mol·L⁻¹) et d’ions peroxodisulfate, à 20 °C. Ces ions n’apparaissent pas dans l’équation. A : sans ajout ; B : avec Fe³⁺. On suit toujours le diiode formé.</>,
      tache: { type: 'qcm', q: 'Que peut-on dire des ions fer(III) d’après ces deux courbes ?', ...Q.catalyseur1,
        expl: 'Avec Fe³⁺, le plateau est atteint beaucoup plus tôt (t½ environ 1,8 min contre 18 min), mais les deux courbes finissent au même niveau, 2,0 mmol·L⁻¹ : l’état final et la quantité formée ne changent pas. L’effet n’est pas nul (la courbe B est très différente), il ne ralentit pas la transformation, et il ne fait pas augmenter la quantité finale.',
        indice: 'Comparez la vitesse des deux courbes, puis leur niveau final.' } },
    { id: 'catalyseur2', titre: 'Repérer un catalyseur',
      retenirTitre: 'Un seul facteur à la fois', retenir: <><CarteUnSeulFacteur/>
        <ul style={UL}>
          <li>Pour attribuer un écart à un facteur, <strong>un seul paramètre doit changer</strong> entre les deux expériences.</li>
          <li>Exemple : 20 °C et 40 °C avec la même concentration : conclusion possible ; si la concentration change aussi, aucune.</li>
          <li>Moyen de s’en souvenir : <strong>« une seule différence, une conclusion »</strong>. Idée fausse : « l’expérience la plus chaude suffit à conclure ».</li>
        </ul></>,
      texte: <>Trois ajouts sont testés, chacun dans un mélange de référence (20 °C, I⁻ à 0,050{NB}mol·L⁻¹, volume 100{NB}mL) : des ions fer(III), des ions iodure supplémentaires (le mélange de référence contient 5,0{NB}mmol d’iodure ; dans l’expérience avec cet ajout, il en contient 10,0{NB}mmol au total) et du nitrate de sodium. Le tableau donne la quantité de l’espèce ajoutée avant et après la transformation ; la courbe grise est la référence sans ajout.</>,
      tache: { type: 'qcm', q: 'Lequel de ces trois ajouts est un catalyseur ?', ...Q.catalyseur2,
        expl: 'Les ions Fe³⁺ accélèrent la transformation, ne figurent pas dans l’équation et leur quantité est la même avant et après (0,020 mmol) : ce sont des catalyseurs. Les ions I⁻ accélèrent aussi, mais ils sont des réactifs : ils figurent dans l’équation et leur quantité diminue (10,0 mmol puis 9,6 mmol). Le nitrate de sodium ne change pas la courbe : il n’a aucun effet sur la vitesse, ce n’est ni un réactif ni un catalyseur.',
        indice: 'Un catalyseur accélère la transformation, n’est pas dans l’équation et se retrouve en même quantité à la fin. Testez ces trois critères sur chaque ajout.' } },
    { id: 'specifique', titre: 'Un catalyseur est-il universel ?',
      retenirTitre: 'Le catalyseur', retenir: <><CarteCatalyseur/>
        <ul style={UL}>
          <li>Un catalyseur <strong>accélère</strong> la transformation, <strong>n’est pas dans l’équation</strong> et <strong>est retrouvé intact</strong> à la fin ; l’état final ne change pas.</li>
          <li>Exemple : Fe³⁺ fait passer t½ de 18 min à 1,8 min ; la quantité finale de diiode reste 2,0 mmol·L⁻¹.</li>
          <li>Moyen de s’en souvenir : <strong>« plus vite, même arrivée, retrouvé »</strong>. Idée fausse : « il fait former plus de produit ».</li>
        </ul></>,
      texte: <>La catalase est une enzyme présente dans le foie. On l’ajoute, à 20 °C, à de l’eau oxygénée, puis au mélange d’ions iodure et d’ions peroxodisulfate. Les deux graphiques comparent chaque transformation sans catalase et avec catalase.</>,
      tache: { type: 'qcm', q: 'Que peut-on conclure sur la catalase ?', ...Q.specifique,
        expl: 'La catalase accélère nettement la décomposition de l’eau oxygénée mais n’a aucun effet sur l’oxydation de I⁻ par S₂O₈²⁻ : un catalyseur est spécifique d’une transformation (ou d’une famille). Il n’accélère pas n’importe quelle transformation ; il n’est pas consommé (il est retrouvé intact) ; et le fait qu’il n’agisse pas sur une transformation n’empêche pas qu’il soit un catalyseur pour une autre. Au niveau microscopique, il ouvre un autre chemin réactionnel (le mécanisme).',
        indice: 'Comparez l’effet de la catalase dans chaque graphique : est-il le même ?' } },
    { id: 'bilan', titre: 'Le bilan',
      retenirTitre: 'Catalyseur ou réactif', retenir: <><CarteCatalyseurReactif/>
        <ul style={UL}>
          <li>Un réactif est <strong>dans l’équation et consommé</strong> ; un catalyseur n’y est pas et se retrouve intact.</li>
          <li>Exemple : I⁻ (10,0 mmol, puis 9,6 mmol) est un réactif ; Fe³⁺ (0,020 mmol avant et après) est un catalyseur.</li>
          <li>Moyen de s’en souvenir : <strong>« le catalyseur aide, le réactif se consomme »</strong>. Idée fausse : « tout ce qui accélère est un catalyseur ».</li>
        </ul></>,
      texte: <>Vous savez choisir un capteur d’après les espèces de l’équation, comparer des expériences en ne changeant qu’un paramètre (température, concentration), identifier un catalyseur par ses propriétés et dire qu’il est spécifique. Passez à l’exploration (autres transformations et capteurs, deux expériences superposées) ou relevez les trois défis.</>, tache: null },
  ];
  const idEtape = ETAPES[Math.min(etape, ETAPES.length - 1)].id;

  // ---------- scènes du parcours ----------
  const expA = (nom, cond, st) => ex(nom, cond, st);
  const sceneGuide = (() => {
    const g = (rid, series, extra = {}) => (<><GraphiqueC rid={rid} series={series} {...extra}/><LegendeC series={series}/></>);
    switch (idEtape) {
      case 'echelle': return <div style={styleBoite}><EchelleDurees/><div style={{ fontSize: 13, color: KIT.txt2, textAlign: 'center' }}>Ordres de grandeur, à température ambiante.</div></div>;
      case 'spectro': return <><EnteteR rid="persulfate"/><TableEspeces especes={M.REACTIONS.persulfate.especes}/></>;
      case 'pression': return <><EnteteR rid="h2o2"/><TableEspeces especes={M.REACTIONS.h2o2.especes}/></>;
      case 'conduct': return <><EnteteR rid="rcl"/><TableEspeces especes={M.REACTIONS.rcl.especes}/></>;
      case 'temperature': { const s = [expA('A', A20, 0), expA('B', { ...A20, T: 40 }, 1)]; return <><EnteteR rid="persulfate" suivi/><div style={styleBoite}>{g('persulfate', s)}</div><TableConditions rid="persulfate" exps={s}/></>; }
      case 'concentration': { const s = [expA('A', { ...A20, iB: 1 }, 0), expA('B', { ...A20, iB: 2 }, 1)]; return <><EnteteR rid="persulfate" suivi/><div style={styleBoite}>{g('persulfate', s)}</div><TableConditions rid="persulfate" exps={s}/></>; }
      case 'seul': { const s = [expA('A', condA, 0), expA('B', exB, 1)]; return (<><EnteteR rid="persulfate" suivi/><div style={styleBoite}>{g('persulfate', s)}</div><TableConditions rid="persulfate" exps={s}/>
        <div style={styleBoite}>
          <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 8 }}>Réglages de l’expérience B (A ne change pas).</div>
          <Pas nom="Température de B" texte={`${exB.T}${NB}°C`} onMoins={() => setExB(x => ({ ...x, T: x.T - 5 }))} onPlus={() => setExB(x => ({ ...x, T: x.T + 5 }))} moinsOff={exB.T <= 10} plusOff={exB.T >= 50}/>
          <Pas nom="Concentration en ions iodure de B" texte={M.formatCExces(M.REACTIONS.persulfate.exces.valeurs[exB.iB])} onMoins={() => setExB(x => ({ ...x, iB: x.iB - 1 }))} onPlus={() => setExB(x => ({ ...x, iB: x.iB + 1 }))} moinsOff={exB.iB <= 0} plusOff={exB.iB >= 4}/>
          <label style={lbSel}>Catalyseur de B
            <select value={exB.cat} onChange={ev => setExB(x => ({ ...x, cat: ev.target.value }))} style={{ ...menu, marginTop: 2 }}><option value="aucun">aucun</option><option value="fe3">ions fer(III) Fe³⁺</option><option value="catalase">catalase (enzyme)</option></select></label>
          <div role="status" aria-live="polite" style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: okSeul ? '#15803d' : KIT.txt2 }}>{msgSeul}</div>
          <button type="button" onClick={() => setExB({ ...condA })} style={{ ...stylePetitBouton(false), marginTop: 6 }}><Pic n="refresh"/>Rétablir B = A</button>
        </div></>); }
      case 'catalyseur1': { const s = [expA('A (sans ajout)', { ...A20 }, 0), expA('B (avec Fe³⁺)', { ...A20, cat: 'fe3' }, 1)]; return <><EnteteR rid="persulfate" suivi/><div style={styleBoite}>{g('persulfate', s)}</div><TableConditions rid="persulfate" exps={s}/></>; }
      case 'catalyseur2': { const base = { ...A20, iB: 1 };
        const s = [expA('Référence', base, 3), expA('Ajout de Fe³⁺', { ...base, cat: 'fe3' }, 0), expA('Ajout de I⁻', { ...base, iB: 2 }, 1), expA('Ajout de NaNO₃', base, 2)];
        const ajouts = [['Fe³⁺ (ions fer(III))', 'non', '0,020 mmol', '0,020 mmol'], ['I⁻ (ions iodure)', 'oui', '10,0 mmol', '9,6 mmol'], ['NaNO₃ (nitrate de sodium)', 'non', '5,0 mmol', '5,0 mmol']];
        return (<><EnteteR rid="persulfate" suivi/><div style={styleBoite}><GraphiqueC rid="persulfate" series={s.map(x => ({ ...x, st: x.st }))}/><LegendeC series={s}/></div>
          <div style={{ ...styleBoite, padding: '8px 10px', overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', fontSize: 14, width: '100%' }} aria-label="Quantité de l’espèce ajoutée avant et après la transformation">
            <thead><tr style={{ background: '#f1f5f9' }}>{['Espèce ajoutée', 'Dans l’équation ?', 'Quantité avant', 'Quantité après'].map(h => <th key={h} style={{ ...tCell, textAlign: 'left' }}>{h}</th>)}</tr></thead>
            <tbody>{ajouts.map((r, i) => <tr key={i}>{r.map((c, k) => <td key={k} style={{ ...tCell, fontWeight: k === 0 ? 700 : 400 }}>{c}</td>)}</tr>)}</tbody></table></div></>); }
      case 'specifique': { const sh = [expA('sans catalase', M.condRef('h2o2'), 0), expA('avec catalase', { ...M.condRef('h2o2'), cat: 'catalase' }, 1)], sp = [expA('sans catalase', A20, 0), expA('avec catalase', { ...A20, cat: 'catalase' }, 1)];
        return (<><div style={styleBoite}><div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 4 }}>Décomposition de l’eau oxygénée H₂O₂ (20 °C)</div>{g('h2o2', sh, { maxWidth: 400 })}</div>
          <div style={styleBoite}><div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 4 }}>Oxydation de I⁻ par S₂O₈²⁻ (20 °C, 0,10 mol·L⁻¹ d’iodure)</div>{g('persulfate', sp, { maxWidth: 400 })}</div></>); }
      default: return null;
    }
  })();

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Modèle construit</strong> : les courbes ne sont pas des mesures. L’espèce suivie évolue comme c(t) = c₀ e<sup>−kt</sup> (réactif) ou c∞ (1 − e<sup>−kt</sup>) (produit) ; le temps de demi-réaction vaut <FormuleEnLigne><msub><mi>t</mi><mn>½</mn></msub><mo>=</mo><mfrac><mrow><mi>ln</mi><mn>2</mn></mrow><mi>k</mi></mfrac></FormuleEnLigne>. Les durées sont des ordres de grandeur de séances de TP.</li>
      <li><strong>Température</strong> : dans ce modèle, t½ est divisé par 2 quand la température augmente de 10 °C (ordre de grandeur courant pour des réactions en solution à température ambiante, pas une loi). Température uniforme ; pas de loi d’Arrhenius ni d’énergie d’activation.</li>
      <li><strong>Concentration</strong> : on fait varier la concentration du réactif en <em>large excès</em> (I⁻ ; HO⁻), le réactif suivi étant limitant : dans ce cas simple, t½ est inversement proportionnel à cette concentration. Pour un réactif seul d’ordre 1 (sim. 122), t½ ne dépend pas de la concentration initiale : c’est pourquoi cette commande n’existe pas pour H₂O₂ ni pour le 2-chloro-2-méthylpropane.</li>
      <li><strong>Catalyseurs</strong> : un catalyseur multiplie la rapidité d’une transformation par un facteur propre au couple (catalyseur, transformation) et ne change pas la quantité finale. La catalase est supposée sans effet sur l’oxydation de I⁻ par S₂O₈²⁻ (catalyseur spécifique) ; la catalase n’est pas proposée pour les autres transformations.</li>
      <li><strong>Capteurs</strong> : le signal est supposé linéaire dans son domaine et fournir directement c(t) (étalonnage parfait). Un capteur « convient » si une espèce dont la concentration varie change la grandeur qu’il mesure ; HO⁻ est supposé en excès pour le cristal violet (conductivité et pH constants). Pour l’oxydation de I⁻ par S₂O₈²⁻, un conductimètre conviendrait aussi (les ions ne sont pas les mêmes avant et après), mais la variation de conductivité est modeste : seul le spectrophotomètre, le plus direct, est proposé.</li>
      <li><strong>Notations</strong> : le diiode dissous est noté I₂ (la formation de I₃⁻ en présence d’excès d’iodure n’est pas distinguée). Dilution et température uniformes, un seul paramètre varie à la fois dans une comparaison.</li>
      <li><strong>Hors programme, non traité</strong> : loi d’Arrhenius, énergie d’activation, lois de vitesse d’ordre 0 ou 2, mécanismes (sim. 186), « vitesse de réaction » ; vitesse volumique et loi d’ordre 1 : sim. 122.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const changerMode = md => setMode(md);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration : commandes et scène ----------
  const titreBoite = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 8, lineHeight: 1.5 };
  const parametresDiff = rEx ? diffParams(e.rid, rEx.cond, e.cond) : [];
  const resumeCond = `${e.cond.T} °C${R.exces ? ` · ${R.exces.f} ${M.formatCExces(R.exces.valeurs[e.cond.iB])}` : ''}${R.catalyseurs ? ` · ${nomCat(e.cond.cat)}` : ''}`;
  const seriesEx = [{ nom: rEx ? 'expérience actuelle' : 'expérience', cond: e.cond, st: 0 }, ...(rEx ? [{ nom: 'référence gardée', cond: rEx.cond, st: 1 }] : [])];
  const nomsDiff = parametresDiff.map(p => ({ T: 'température', c: 'concentration', cat: 'catalyseur' }[p]));
  const reglages = enExplore && (
    <div style={styleBoite} className="fc-ctrl">
      <div style={titreBoite}>Réglages</div>
      <div style={aide}>Choisissez la transformation, le capteur et la température : la courbe, le montage et le temps de demi-réaction suivent.</div>
      <label style={lbSel}>Transformation
        <select value={e.rid} onChange={ev => choisirReaction(ev.target.value)} style={{ ...menu, marginTop: 2 }}>{M.ORDRE_REACTIONS.map(r => <option key={r} value={r}>{M.REACTIONS[r].menu}</option>)}</select></label>
      <label style={lbSel}>Capteur de suivi
        <select value={e.capteur} onChange={ev => setE(s => ({ ...s, capteur: ev.target.value }))} style={{ ...menu, marginTop: 2 }}>{R.proposes.map(c => <option key={c} value={c}>{`${M.CAPTEURS[c].court} (${M.CAPTEURS[c].grandeur})`}</option>)}</select></label>
      <Pas nom="Température" texte={`${e.cond.T}${NB}°C`} onMoins={() => majCond({ T: e.cond.T - 5 })} onPlus={() => majCond({ T: e.cond.T + 5 })} moinsOff={e.cond.T <= 10} plusOff={e.cond.T >= 50} aide="Chaque pas change la température de 5 °C."/>
      <Section titre={`Concentration et catalyseur : ${R.exces || R.catalyseurs ? resumeCond.split(' · ').slice(1).join(' · ') : 'aucun réglage ici'}`} ouvert={ouv.cond} onBascule={() => setOuv(o => ({ ...o, cond: !o.cond }))}>
        {R.exces ? <Pas nom={`Concentration en ${R.exces.nom} ${R.exces.f} (réactif en excès)`} texte={M.formatCExces(R.exces.valeurs[e.cond.iB])} onMoins={() => majCond({ iB: e.cond.iB - 1 })} onPlus={() => majCond({ iB: e.cond.iB + 1 })} moinsOff={e.cond.iB <= 0} plusOff={e.cond.iB >= 4} aide="Chaque pas double ou divise par 2 la concentration."/>
          : <div style={aide}>Un seul réactif : pas de réactif en excès dont on puisse faire varier la concentration ici (voir la simulation sur la loi d’ordre 1).</div>}
        {R.catalyseurs ? <label style={lbSel}>Catalyseur ajouté
          <select value={e.cond.cat} onChange={ev => majCond({ cat: ev.target.value })} style={{ ...menu, marginTop: 2 }}><option value="aucun">aucun</option>{Object.keys(R.catalyseurs).map(k => <option key={k} value={k}>{M.CATALYSEURS[k].nom}</option>)}</select></label>
          : <div style={aide}>Pas de catalyseur courant à étudier pour cette transformation.</div>}
      </Section>
      <Section titre={rEx ? 'Comparer : une référence est gardée' : 'Comparer deux expériences'} ouvert={ouv.comp} onBascule={() => setOuv(o => ({ ...o, comp: !o.comp }))}>
        <div style={aide}>Gardez l’expérience actuelle comme référence, changez un réglage : les deux courbes sont superposées.</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setE(s => ({ ...s, ref: { cond: { ...s.cond } } }))} style={stylePetitBouton(false)}>Garder comme référence</button>
          {rEx && <button type="button" onClick={() => setE(s => ({ ...s, ref: null }))} style={stylePetitBouton(false)}>Effacer la référence</button>}
        </div>
      </Section>
      <button type="button" onClick={() => setE(s => ({ ...s, cond: M.condRef(s.rid), tm: 0, ref: null }))} style={{ ...stylePetitBouton(false), marginTop: 4 }}><Pic n="refresh"/>Rétablir les conditions de départ</button>
    </div>);
  const sceneExplore = enExplore && (
    <div style={styleBoite}>
      <div style={aide}>{avecIndices(`Le montage montre le système à la date t choisie sous le graphique ; la courbe donne la concentration de l’espèce suivie (${R.suivi.nom}) au cours du temps.`)}</div>
      <Montage rid={e.rid} capteur={e.capteur} f={fE}/>
      <div role="status" aria-live="polite" style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.5, margin: '4px 0 6px', color: capOk ? '#15803d' : '#b45309' }}>
        {capOk ? `✓ ${nomCap(e.capteur)} : ${R.capteurs[e.capteur][1]}` : `✗ ${nomCap(e.capteur)} : ${R.capteurs[e.capteur][1]} Le signal reste constant, on ne voit aucune évolution.`}</div>
      <GraphiqueC rid={e.rid} series={seriesEx} marque={capOk ? tmCur : null} marquesT12 constant={!capOk}/>
      {capOk && <LegendeC series={seriesEx} t12Visible/>}
      <label style={{ display: 'block', fontSize: 13.5, color: KIT.txt2, fontWeight: 700, marginTop: 6 }}>{`Date t = ${nbf(tmCur, tmCur % 1 ? 1 : 0)}${NB}min`}
        <input type="range" min={0} max={horizonMin} step={horizonMin >= 60 ? 1 : 0.5} value={tmCur} onChange={ev => setE(s => ({ ...s, tm: parseFloat(ev.target.value) }))} aria-label="Date t" style={{ width: '100%', accentColor: COL.A, display: 'block' }}/></label>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>{capOk ? 'Les repères sur la courbe marquent le temps de demi-réaction t½ : à cette date, la concentration de l’espèce suivie est la moitié de sa valeur maximale.' : ' '}</div>
    </div>);
  const mesures = enExplore && (
    <div style={styleBoite}>
      <Section titre={`Temps de demi-réaction : ${M.formatDuree(M.t12(e.rid, e.cond))}${rEx ? ` (référence : ${M.formatDuree(M.t12(e.rid, rEx.cond))})` : ''}`} ouvert={ouv.mes} onBascule={() => setOuv(o => ({ ...o, mes: !o.mes }))}>
        <LigneMesure nom="t½ (expérience actuelle)" valeur={M.formatDuree(M.t12(e.rid, e.cond))} couleur={COL.A}/>
        {rEx && <LigneMesure nom="t½ (référence gardée)" valeur={M.formatDuree(M.t12(e.rid, rEx.cond))} couleur={COL.B}/>}
        <LigneMesure nom={`c(${R.suivi.f}) à la date t`} valeur={M.formatConc(M.concSuivi(e.rid, e.cond, tmCur * 60), R.suivi.unite)}/>
        <TableConditions rid={e.rid} exps={[{ nom: rEx ? 'actuelle' : 'expérience', cond: e.cond, st: 0 }, ...(rEx ? [{ nom: 'référence', cond: rEx.cond, st: 1 }] : [])]} t12Visible/>
        {rEx && <div role="status" style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.5, fontWeight: 700, color: parametresDiff.length === 1 ? '#15803d' : '#b45309' }}>
          {parametresDiff.length === 0 ? 'Les deux expériences ont les mêmes conditions.' : parametresDiff.length === 1 ? `Un seul paramètre diffère : ${nomsDiff[0]}. L’écart entre les deux courbes peut lui être attribué.` : `Plusieurs paramètres diffèrent (${nomsDiff.join(', ')}) : on ne peut pas attribuer l’écart à un seul facteur.`}</div>}
      </Section>
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Choisissez l’eau oxygénée et changez de capteur : lequel détecte une évolution ? Pourquoi ?</li>
        <li>Pour I⁻ et S₂O₈²⁻, gardez la référence à 20 °C puis passez à 30 °C : de quel facteur t½ est-il divisé ? Et à 40 °C ?</li>
        <li>Pour l’eau oxygénée, comparez 50 °C sans catalyseur et 20 °C avec Fe³⁺ : lequel est le plus rapide ?</li>
        <li>Ajoutez Fe³⁺ puis la catalase à I⁻ et S₂O₈²⁻ : quelle différence ? Et pour l’eau oxygénée ?</li>
        <li>Pour le cristal violet, changez la concentration en HO⁻ : qu’est-ce qui change, qu’est-ce qui reste identique ?</li>
        <li>Gardez une référence puis changez la température et la concentration : que dit le panneau de comparaison ?</li>
      </ul>
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Rapide : terminée dès le mélange ; lente : on peut la suivre dans le temps</li>
          <li>Capteur : spectrophotomètre (espèce colorée), conductimètre (ions), pH-mètre (H₃O⁺, HO⁻), capteur de pression (gaz)</li>
          <li>Plus chaud, plus concentré (réactif en excès) : t½ plus court</li>
          <li>On ne conclut que si un seul paramètre change entre deux expériences</li>
          <li>Catalyseur : accélère, n’est pas dans l’équation, est retrouvé intact, ne change pas l’état final ; il est spécifique</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .fc-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .fc-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .fc-col { display: flex; flex-direction: column; gap: 12px; }
        .fc-df { display: block; margin-bottom: 12px; } .fc-df > * { margin-bottom: 12px; }
          .fc-l1.cote .fc-carte { order: 2; } .fc-l1.cote .fc-main { order: 1; }
        @media (max-width: 900px) { .fc-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        .fc-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .fc-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .fc-ex > * { grid-column: 1; } .fc-ex > .fc-ctrl { grid-column: 2; grid-row: 1 / span 5; } }
        @media (prefers-reduced-motion: no-preference) { .fc-in { animation: fc-fondu 0.35s ease-out; } @keyframes fc-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Facteurs cinétiques, catalyse et choix d’un capteur</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Comment suivre une transformation lente au cours du temps, et qu’est-ce qui la rend plus rapide : température, concentration, catalyseur ? Les courbes de cette simulation sont issues d’un modèle construit (voir « Hypothèses de travail »).</div>
      {enGuide && <div className="fc-l1 cote">
        <div className="fc-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div>
        <div className="fc-main"><div className="fc-col">{sceneGuide && <div className="fc-in" key={'s-' + idEtape} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{sceneGuide}</div>}</div></div>
      </div>}
      {enDefi && <div className="fc-df">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {[['facteurs', 'Comparer des expériences'], ['catalyseur', 'Repérer le catalyseur'], ['capteur', 'Choisir les capteurs']].map(([t, l]) => <button key={t} onClick={() => { setTypeDefi(t); setGraine(g => g + 1); }} aria-pressed={typeDefi === t} style={stylePetitBouton(typeDefi === t, '#0369a1')}>{l}</button>)}
        </div>
        <div className="fc-in" key={typeDefi + graine}>
          {typeDefi === 'facteurs' && <DefiFacteurs noter={noterF}/>}
          {typeDefi === 'catalyseur' && <DefiCatalyseur noter={noterK}/>}
          {typeDefi === 'capteur' && <DefiCapteur noter={noterC}/>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><button onClick={() => setGraine(g => g + 1)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button></div>
        <SuiviDefi cle={`${SIM_ID}:defi.${typeDefi}`} etat={typeDefi === 'facteurs' ? suiviF : typeDefi === 'catalyseur' ? suiviK : suiviC}/>
        {panneauHypo}
      </div>}
      {enExplore && <div className="fc-ex">
        <div>{<EnteteR rid={e.rid} suivi ctx/>}{sceneExplore}</div>
        <div className="fc-ctrl">{reglages}</div>
        <div>{mesures}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && idEtape === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}

// ====================================================
//  DÉFIS : chaque défi a une seule vérification ; la correction n'apparaît qu'après réussite ou 3 essais ; un indice par question.
// ====================================================
const tire = t => t[Math.floor(Math.random() * t.length)];
const btnRadio = (actif, ok = null) => ({ ...stylePetitBouton(actif, ok === true ? '#15803d' : ok === false ? '#b91c1c' : '#0369a1'), textAlign: 'left', padding: '7px 10px', fontSize: 14, minHeight: 40 });
const phrase = (rid, ch) => {
  if (ch.param === 'T') return `la température passe de ${ch.de}${NB}°C à ${ch.vers}${NB}°C`;
  if (ch.param === 'c') { const x = M.REACTIONS[rid].exces; return `la concentration en ${x.nom} ${x.f} passe de ${M.formatCExces(x.valeurs[ch.de])} à ${M.formatCExces(x.valeurs[ch.vers])}`; }
  return ch.vers === 'fe3' ? 'on ajoute des ions fer(III) Fe³⁺ (catalyseur)' : 'on ajoute de la catalase (enzyme)';
};
const EFFETS = { rapide: 'elle devient plus rapide (t½ plus court)', lente: 'elle devient plus lente (t½ plus long)', aucun: 'elle n’est pas modifiée : aucun effet visible' };
function Retour({ ok, msg }) { return <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: ok ? '#15803d' : '#b91c1c' }}>{msg}</div>; }
const Question = ({ titre, children }) => <div style={{ marginTop: 10 }}><div style={{ fontSize: 14.5, fontWeight: 700, color: KIT.txt, marginBottom: 6, lineHeight: 1.5 }}>{titre}</div>{children}</div>;

function DefiFacteurs({ noter }) {
  const [d] = useState(() => M.tirageDefiFacteurs());
  const [rep, setRep] = useState({ q1: null, q2: null }), [essais, setEssais] = useState(0), [res, setRes] = useState(null);
  const [perm] = useState(() => { const a = [0, 1, 2]; for (let k = 2; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; });   // ordre d'affichage des trois expériences (la comparaison juste n'est pas toujours la même paire)
  const R = M.REACTIONS[d.rid], paires = [[0, 1], [0, 2], [1, 2]], ch = d.changes[d.quelle], effet = M.effetChangement(d.ratios[d.quelle]);
  const cleP = ([x, y]) => [perm[x], perm[y]].sort().join(), bonne = paires.findIndex(pr => cleP(pr) === (d.quelle === 0 ? '0,1' : '1,2')), confond = paires.findIndex(pr => cleP(pr) === '0,2');
  const oA = d.quelle === 0 ? 0 : 1, oB = oA + 1;
  const gagne = res && res.q1 && res.q2, revele = gagne || essais >= 3;
  const s = perm.map((o, i) => ({ nom: `Expérience ${i + 1}`, cond: d.E[o], st: i }));
  const verifier = () => { const r = { q1: rep.q1 === bonne, q2: rep.q2 === effet }; setRes(r); setEssais(n => n + 1); noter(r.q1 && r.q2); };
  const [a, b] = paires[bonne];
  return (
    <div style={styleBoite}>
      <div style={titreBoite0}><Pic n="target"/>Défi : comparer des expériences</div>
      <EnteteR rid={d.rid} suivi/>
      <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.5, marginBottom: 8 }}>{`Trois expériences sont réalisées sur cette transformation. Les courbes donnent la concentration de l’espèce suivie ; le tableau donne les conditions.`}</div>
      <GraphiqueC rid={d.rid} series={s}/><LegendeC series={s}/>
      <TableConditions rid={d.rid} exps={s}/>
      <Question titre={`1. Quelle comparaison permet d’étudier l’effet de ${M.nomParam(ch.param)} seule ?`}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{paires.map(([x, y], i) => <button key={i} type="button" aria-pressed={rep.q1 === i} disabled={revele} onClick={() => setRep(r => ({ ...r, q1: i }))} style={btnRadio(rep.q1 === i, revele ? (i === bonne ? true : rep.q1 === i ? false : null) : null)}>{`Expériences ${x + 1} et ${y + 1}`}</button>)}</div>
        <IndiceDefi cache={revele}>Cherchez deux expériences dont une seule colonne du tableau est différente ; les autres colonnes sont identiques.</IndiceDefi>
      </Question>
      <Question titre={`2. Dans cette comparaison, ${phrase(d.rid, ch)}. Que devient la transformation ?`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>{Object.entries(EFFETS).map(([k, t]) => <button key={k} type="button" aria-pressed={rep.q2 === k} disabled={revele} onClick={() => setRep(r => ({ ...r, q2: k }))} style={btnRadio(rep.q2 === k, revele ? (k === effet ? true : rep.q2 === k ? false : null) : null)}>{t}</button>)}</div>
        <IndiceDefi cache={revele}>Comparez les deux courbes de la comparaison : laquelle atteint plus tôt le plateau ? Si elles sont superposées, le paramètre n’a pas d’effet.</IndiceDefi>
      </Question>
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>{!revele && <button type="button" onClick={verifier} disabled={rep.q1 == null || rep.q2 == null} style={{ ...styleBouton(true, '#15803d'), opacity: rep.q1 == null || rep.q2 == null ? 0.5 : 1 }}>✓ Vérifier</button>}</div>
      {res && !revele && <Retour ok={false} msg={`✗ ${res.q1 ? 'La question 1 est juste' : 'La question 1 est fausse'}, ${res.q2 ? 'la question 2 est juste' : 'la question 2 est fausse'}. Il reste ${3 - essais} essai${3 - essais > 1 ? 's' : ''}.`}/>}
      {gagne && <Retour ok msg="✓ Bravo, les deux réponses sont justes."/>}
      {revele && <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.55, color: KIT.txt }}>
        <strong>Correction.</strong> {`Les expériences ${a + 1} et ${b + 1} ne diffèrent que par ${M.nomParam(ch.param)} : ${phrase(d.rid, ch)}. Leur temps de demi-réaction passe de ${M.formatDuree(M.t12(d.rid, d.E[oA]))} à ${M.formatDuree(M.t12(d.rid, d.E[oB]))} : ${EFFETS[effet]}. `}
        {`La comparaison des expériences ${paires[confond][0] + 1} et ${paires[confond][1] + 1} ne permet aucune conclusion : deux paramètres y diffèrent.`}{d.rid === 'persulfate' && ch.param === 'cat' && ch.vers === 'catalase' ? ' La catalase est spécifique : elle n’agit pas sur cette transformation.' : ''}</div>}
    </div>);
}
const titreBoite0 = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 };

function DefiCatalyseur({ noter }) {
  const [d] = useState(() => M.tirageDefiCatalyseur());
  const brasse = t => { const a = [...t]; for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; };
  const [exps] = useState(() => brasse(d.experiences));
  const [rep, setRep] = useState({ q1: null, q2: null }), [essais, setEssais] = useState(0), [res, setRes] = useState(null);
  const gagne = res && res.q1 && res.q2, revele = gagne || essais >= 3;
  const cat = exps.find(x => x.vraiment === 'catalyseur');
  const s = [{ nom: 'Référence (sans ajout)', cond: d.base, st: 3 }, ...exps.map((x, i) => ({ nom: `Ajout de ${x.nom}`, cond: x.cond, st: i }))];
  const fmt = v => `${nbf(v, v < 1 ? 3 : 1)}${NB}mmol`;
  const eq = { fe3: 'non', iodure: 'oui', nitrate: 'non' };
  const verifier = () => { const r = { q1: rep.q1 === cat.id, q2: rep.q2 === 'identique' }; setRes(r); setEssais(n => n + 1); noter(r.q1 && r.q2); };
  const [opts2] = useState(() => brasse([['plus', 'plus grande que dans la référence'], ['identique', 'la même que dans la référence'], ['moins', 'plus petite que dans la référence']]));
  return (
    <div style={styleBoite}>
      <div style={titreBoite0}><Pic n="target"/>Défi : repérer le catalyseur</div>
      <EnteteR rid="persulfate" suivi/>
      <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.5, marginBottom: 8 }}>Dans le mélange de référence (20 °C, I⁻ à 0,050 mol·L⁻¹, 100 mL, courbe grise), on teste trois ajouts, un par expérience. Le tableau donne la quantité de l’espèce ajoutée avant et après la transformation (pour I⁻, le mélange contient alors 10,0 mmol d’iodure au total, contre 5,0 mmol dans le mélange de référence).</div>
      <GraphiqueC rid="persulfate" series={s}/><LegendeC series={s}/>
      <div style={{ ...styleBoite, padding: '8px 10px', overflowX: 'auto', marginTop: 6 }}><table style={{ borderCollapse: 'collapse', fontSize: 14, width: '100%' }} aria-label="Espèces ajoutées">
        <thead><tr style={{ background: '#f1f5f9' }}>{['Espèce ajoutée', 'Dans l’équation ?', 'Quantité avant', 'Quantité après'].map(h => <th key={h} style={{ ...tCell, textAlign: 'left' }}>{h}</th>)}</tr></thead>
        <tbody>{exps.map((x, i) => <tr key={x.id}><td style={{ ...tCell, fontWeight: 700 }}><svg width="26" height="10" viewBox="0 0 30 10" aria-hidden="true" style={{ marginRight: 4 }}><line x1="1" y1="5" x2="29" y2="5" stroke={STYLES[i].c} strokeWidth="3" strokeDasharray={STYLES[i].dash}/></svg>{x.nom}</td><td style={tCell}>{eq[x.id]}</td><td style={tCell}>{fmt(x.avant)}</td><td style={tCell}>{fmt(x.apres)}</td></tr>)}</tbody></table></div>
      <Question titre="1. Lequel de ces trois ajouts est un catalyseur ?">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{exps.map(x => <button key={x.id} type="button" aria-pressed={rep.q1 === x.id} disabled={revele} onClick={() => setRep(r => ({ ...r, q1: x.id }))} style={btnRadio(rep.q1 === x.id, revele ? (x.id === cat.id ? true : rep.q1 === x.id ? false : null) : null)}>{x.nom}</button>)}</div>
        <IndiceDefi cache={revele}>Un catalyseur accélère la transformation, n’est pas dans l’équation et se retrouve en même quantité à la fin : appliquez ces trois critères à chaque ajout.</IndiceDefi>
      </Question>
      <Question titre="2. La quantité finale de diiode formé, dans l’expérience avec le catalyseur, est…">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>{opts2.map(([k, t]) => <button key={k} type="button" aria-pressed={rep.q2 === k} disabled={revele} onClick={() => setRep(r => ({ ...r, q2: k }))} style={btnRadio(rep.q2 === k, revele ? (k === 'identique' ? true : rep.q2 === k ? false : null) : null)}>{t}</button>)}</div>
        <IndiceDefi cache={revele}>Regardez le niveau du plateau de la courbe du catalyseur et celui de la courbe grise de référence.</IndiceDefi>
      </Question>
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>{!revele && <button type="button" onClick={verifier} disabled={rep.q1 == null || rep.q2 == null} style={{ ...styleBouton(true, '#15803d'), opacity: rep.q1 == null || rep.q2 == null ? 0.5 : 1 }}>✓ Vérifier</button>}</div>
      {res && !revele && <Retour ok={false} msg={`✗ ${res.q1 ? 'La question 1 est juste' : 'La question 1 est fausse'}, ${res.q2 ? 'la question 2 est juste' : 'la question 2 est fausse'}. Il reste ${3 - essais} essai${3 - essais > 1 ? 's' : ''}.`}/>}
      {gagne && <Retour ok msg="✓ Bravo, les deux réponses sont justes."/>}
      {revele && <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.55, color: KIT.txt }}><strong>Correction.</strong> {`${cat.nom} est le catalyseur : il accélère la transformation (t½ de ${M.formatDuree(M.t12('persulfate', d.base))} à ${M.formatDuree(M.t12('persulfate', cat.cond))}), n’est pas dans l’équation et sa quantité est la même avant et après. Les ions I⁻ supplémentaires accélèrent aussi, mais ils sont des réactifs (dans l’équation, quantité qui diminue). Le nitrate de sodium ne change pas la courbe. Les trois courbes finissent au même niveau que la référence : un catalyseur ne change pas l’état final.`}</div>}
    </div>);
}

function DefiCapteur({ noter }) {
  const [sit] = useState(() => M.SITUATIONS[tire(M.ORDRE_SITUATIONS)]);
  const [coche, setCoche] = useState({}), [essais, setEssais] = useState(0), [res, setRes] = useState(null);
  const valides = M.capteursValides(sit), gagne = res === true, revele = gagne || essais >= 3;
  const verifier = () => { const ok = M.ORDRE_CAPTEURS.every(c => !!coche[c] === valides.includes(c)); setRes(ok); setEssais(n => n + 1); noter(ok); };
  const ordre = useState(() => [...M.ORDRE_CAPTEURS].sort(() => Math.random() - 0.5))[0];
  return (
    <div style={styleBoite}>
      <div style={titreBoite0}><Pic n="target"/>Défi : choisir les capteurs</div>
      <Entete especes={sit.especes}/>
      <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.5, margin: '8px 0' }}>{sit.enonce} Le tableau donne les propriétés des espèces.</div>
      <TableEspeces especes={sit.especes}/>
      <Question titre="Cochez tous les capteurs qui permettent de suivre l’évolution de cette transformation.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
          {ordre.map(c => <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.5, minHeight: 40, cursor: revele ? 'default' : 'pointer', color: KIT.txt }}>
            <input type="checkbox" checked={!!coche[c]} disabled={revele} onChange={ev => setCoche(x => ({ ...x, [c]: ev.target.checked }))} style={{ width: 20, height: 20 }}/>{`${M.CAPTEURS[c].court} (${M.CAPTEURS[c].grandeur})`}</label>)}
        </div>
        <IndiceDefi cache={revele}>Pour chaque capteur, cherchez dans le tableau une espèce dont la concentration varie et qui change la grandeur mesurée : couleur, ions, H₃O⁺ ou HO⁻, gaz. Plusieurs capteurs peuvent convenir.</IndiceDefi>
      </Question>
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>{!revele && <button type="button" onClick={verifier} style={styleBouton(true, '#15803d')}>✓ Vérifier</button>}</div>
      {res === false && !revele && <Retour ok={false} msg={`✗ Pas tout à fait : au moins un capteur est mal classé. Il reste ${3 - essais} essai${3 - essais > 1 ? 's' : ''}.`}/>}
      {gagne && <Retour ok msg="✓ Bravo, la liste est exacte."/>}
      {revele && <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.55, color: KIT.txt }}><strong>Correction.</strong>
        <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{M.ORDRE_CAPTEURS.map(c => <li key={c}><strong>{M.CAPTEURS[c].court}</strong> : {sit.capteurs[c][0] ? 'convient. ' : 'ne convient pas. '}{sit.capteurs[c][1]}</li>)}</ul></div>}
    </div>);
}
