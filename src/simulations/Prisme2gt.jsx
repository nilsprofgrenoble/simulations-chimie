/* eslint-disable no-irregular-whitespace -- espaces insécables écrites telles quelles devant les unités (° nm cm) et autour du signe = */
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useMemo } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, IndiceDefi, ExempleResolu, OngletExercices, LigneMesure, Curseur } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./prisme2gtModele";
import { QCM } from "./prisme2gtQcm";
import { COL } from "./prisme2gtCouleurs";
import { dispo, SCENES, cfgExploration, cfgDefiCouleur, cfgDefiEntree } from "./prisme2gtDispo";
import { ScenePrisme, DessinDispo, BarreSpectre, TableauIndices } from "./Prisme2gtScenes";
import { FicheDispersion, FicheIndice, FicheDeuxFaces, FicheMonochrome, FicheSpectres } from "./Prisme2gtFiches";

const SIM_ID = 201, CLE_GUIDE = 'prisme-2gt-guide-v1';
declarerDefis(SIM_ID, [['angle', 'Calculer un angle de réfraction dans le prisme'], ['verres', 'Comparer la dispersion de deux verres'], ['couleur', 'Reconnaître la couleur d’un laser à sa déviation']]);

// ====================================================
//  SIM 201 — DISPERSION DE LA LUMIÈRE BLANCHE PAR UN PRISME (2GT spé PC, « Ondes et signaux », D « Vision et image »).
//  Prérequis : simulation 64 « Réfraction » (normale, angles, loi de Snell-Descartes), simulation 66 « Spectres » (spectres continus et de raies).
//  Suite : 1G (réseau, longueur d'onde), TSTL (spectroscopie). Une seule idée : la lumière blanche est un mélange de couleurs ; l'indice du verre dépend
//  de la couleur ; deux réfractions dévient chaque couleur différemment (le violet le plus, le rouge le moins) ; une lumière monochromatique n'est pas dispersée.
//  Parcours (11 étapes) : observer (1), la plus déviée (1), indice selon la couleur (1), calcul de i₂ (1), sortie (1), deux faces (1), spectre continu (1),
//  laser et longueur d'onde (1), déviation et longueur d'onde (1), lampe à vapeur (1), bilan (1). Modèle : prisme2gtModele.js (testé), mise en page : prisme2gtDispo.js (testée).
//  Capacités visées (jamais affichées à l'élève) : décrire et expliquer qualitativement la dispersion par un prisme ; caractériser un rayonnement monochromatique par sa longueur
//  d'onde ; exploiter un spectre de raies ; lois de Snell-Descartes, indice optique. Hors programme, non traité dans le parcours : formule du prisme, déviation minimale, réseau (exploration, balisé).
// ====================================================

const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
const aide = t => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{t}</div>;
const renvoi = <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>↓ La question de cette étape est juste en dessous.</div>;
const NB = M.NB, nf = M.nombreFR, deg = M.degFR;
const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
const etiquette = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 };
const ROUGE = M.couleurRayon(700), VIOLET = M.couleurRayon(400);
const T50 = { rouge: M.trajet(50, 700), violet: M.trajet(50, 400) };

export function SimulationPrisme() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviC, noterC] = useCompteurDefi(), [suiviV, noterV] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('verres');
  const [hypoOuv, setHypoOuv] = useState(() => mode === 'defi');
  const [ex, setEx] = useState({ source: 'blanc', nm: 650, lampe: 'mercure', i1: 60, verre: 'cours', ouv: {} });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  // ---------- étapes du parcours ----------
  const IDS = ['observer', 'deviee', 'indice', 'calcul', 'sortie', 'deuxfaces', 'continu', 'laser', 'longueur', 'raies', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const ETAPES = [
    { id: 'observer', titre: 'Un prisme et de la lumière blanche', focus: ['scene'],
      texte: <>Un <strong>prisme</strong> est un bloc de verre transparent, de forme triangulaire. On envoie sur lui un fin faisceau de <strong>lumière blanche</strong> (celle du Soleil ou d’une lampe), et on place un <strong>écran</strong> derrière. Regardez ce qui apparaît sur l’écran.</>,
      tache: { type: 'qcm', ...QCM.observer } },
    { id: 'deviee', titre: 'Quelle couleur est la plus déviée ?', focus: ['scene'],
      texte: <>Ce que l’on vient d’observer s’appelle la <strong>dispersion</strong> de la lumière. Une lumière est <strong>déviée</strong> quand elle change de direction. Sur le schéma, les <strong>pointillés</strong> montrent le trajet de la lumière <strong>sans prisme</strong>. Pour simplifier, on ne garde que deux couleurs : le rouge et le violet.
        <ExempleResolu>Un rayon qui arriverait exactement sur les pointillés ne serait pas dévié. Plus la tache d’une couleur est <strong>loin</strong> des pointillés, plus cette couleur est <strong>déviée</strong>.</ExempleResolu>
        À vous : comparez le rouge et le violet.</>,
      tache: { type: 'qcm', ...QCM.deviee } },
    { id: 'indice', titre: 'L’indice du verre change avec la couleur', focus: ['scene', 'tableau'],
      texte: <>Pour comprendre, regardons la <strong>première face</strong> du prisme. La <strong>normale</strong> est la droite perpendiculaire à la face (en pointillés) ; <strong>i₁</strong> est l’angle entre le rayon et la normale. Chaque verre a un <strong>indice de réfraction n</strong> (voir la simulation « Réfraction »). Pour ce verre, <strong>n dépend de la couleur</strong> : le tableau donne deux valeurs.
        <ExempleResolu>Un rayon passe de l’air (n = 1,00) à un autre verre d’indice n = 1,50, avec i₁ = 60 °. Le calcul donne i₂ = 35,3 °.</ExempleResolu>
        À vous : placez le rayon violet par rapport au rayon rouge.</>,
      tache: { type: 'qcm', ...QCM.indice } },
    { id: 'calcul', titre: 'Calculer l’angle dans le verre', focus: ['scene', 'tableau'],
      texte: <>Avec la loi de Snell-Descartes (voir « Réfraction »), l’angle i₂ dans le verre se calcule : <strong>sin i₂ = sin i₁ ÷ n</strong>. Puis on utilise la touche sin⁻¹ de la calculatrice (mode degrés).
        <ExempleResolu>Rayon <strong>rouge</strong> (n = 1,63), i₁ = 50 ° : sin i₂ = 0,766 ÷ 1,63 = 0,470, donc <strong>i₂ = 28,0 °</strong> (valeur écrite sur le schéma).</ExempleResolu>
        À vous : le rayon <strong>violet</strong>, avec le même angle i₁ = 50 °.</>,
      tache: { type: 'num', q: <>Quel est l’angle i₂ du rayon violet, en degrés ? (i₁ = 50 °, n = 1,69)</>, carnet: false, unite: '°', vrai: M.angleRefracte(50, 1.69), tol: M.TOL_ANGLE, affiche: v => nf(M.arrondiSig(v, 3)),
        calcul: () => ['Loi de Snell-Descartes : sin i₁ = n × sin i₂, donc sin i₂ = sin i₁ ÷ n. Données : i₁ = 50 °, n = 1,69 (violet).', 'sin 50 ° = 0,766 ; sin i₂ = 0,766 ÷ 1,69 = 0,453.', 'i₂ = sin⁻¹(0,453) = 27,0 °. Le violet est plus près de la normale que le rouge (28,0 °).'],
        pieges: [[28.0, 'C’est l’angle du rouge (l’exemple). Pour le violet, il faut prendre n = 1,69.'], [0.453, 'C’est sin i₂ : il faut encore appliquer la touche sin⁻¹ pour obtenir l’angle.'], [50 / 1.69, 'On ne divise pas les angles : ce sont les sinus qui sont reliés.'], [63.0, 'Cet angle est le complément de i₂ (90 ° − 27 °) : on cherche i₂ lui-même.']],
        expl: 'sin i₂ = sin 50 ° ÷ 1,69 = 0,453 ; i₂ = sin⁻¹(0,453) ≈ 27,0 °, un peu plus petit que le 28,0 ° du rouge.', indice: 'sin i₂ = sin i₁ ÷ n. Calculez sin 50 ° (mode degrés), divisez par 1,69, puis appuyez sur sin⁻¹.' },
      retenirTitre: 'La lumière blanche se disperse',
      retenir: <><FicheDispersion />
        <ul style={liste}>
          <li><strong>Phrase-clé : le rouge reste, le violet vire.</strong> Le prisme trie les couleurs : le rouge est le moins dévié, le violet le plus dévié.</li>
          <li><strong>Idée fausse</strong> : « le prisme colore la lumière ». <strong>Vrai</strong> : les couleurs étaient déjà dans la lumière blanche, le prisme les sépare.</li>
        </ul>{renvoi}</> },
    { id: 'sortie', titre: 'La seconde face : le rayon ressort', focus: ['scene', 'tableau'],
      texte: <>Le rayon traverse le verre et arrive sur la <strong>seconde face</strong>. Il passe du verre (indice élevé) à l’air (n = 1,00). Sur le schéma, <strong>i₃</strong> est l’angle entre le rayon et la normale de cette face, dans le verre ; <strong>i₄</strong> est le même angle, dans l’air.
        <ExempleResolu titre="Exemple facultatif">Un rayon passe du verre (n = 1,50) à l’air avec i₃ = 20 ° : sin i₄ = 1,50 × sin 20 ° = 0,513, donc i₄ = 30,9 °.</ExempleResolu>
        À vous : le rayon rouge, avec les angles i₃ et i₄ du schéma.</>,
      tache: { type: 'qcm', ...QCM.sortie },
      retenirTitre: 'L’indice dépend de la couleur',
      retenir: <><FicheIndice />
        <ul style={liste}>
          <li><strong>Phrase-clé : plus n est grand, plus le rayon se rapproche de la normale.</strong> Le verre a un n plus grand pour le violet que pour le rouge.</li>
          <li><strong>Exemple</strong> : à i₁ = 50 °, i₂ = 28,0 ° pour le rouge et 27,0 ° pour le violet.</li>
        </ul>{renvoi}</> },
    { id: 'deuxfaces', titre: 'Deux faces, deux déviations', focus: ['scene'],
      texte: <>La <strong>déviation D</strong> d’un rayon est l’angle entre sa direction de départ (la droite en pointillés menée à la sortie du prisme) et sa direction de sortie. La légende donne D pour le rouge et pour le violet. Dans le verre, à la première face, les deux rayons étaient séparés d’environ 1 ° seulement (28,0 ° et 27,0 °).</>,
      tache: { type: 'qcm', ...QCM.deuxFaces } },
    { id: 'continu', titre: 'Toutes les couleurs, sans trou', focus: ['scene'],
      texte: <>Revenons à la lumière blanche complète : chaque couleur, du rouge au violet, est déviée d’un angle un peu différent. L’ensemble des couleurs étalées sur l’écran est un <strong>spectre</strong>. Dans la simulation « Spectres », vous avez rencontré deux sortes de spectres : <strong>continu</strong> et <strong>de raies</strong>.</>,
      tache: { type: 'qcm', ...QCM.continu },
      retenirTitre: 'Deux faces, deux déviations',
      retenir: <><FicheDeuxFaces />
        <ul style={liste}>
          <li><strong>Phrase-clé : à chaque face, le violet est plus dévié que le rouge.</strong> Les deux séparations s’ajoutent.</li>
          <li><strong>Hypothèse</strong> : ce verre est choisi très dispersif pour que l’effet se voie bien ; un verre ordinaire sépare les couleurs environ 3 fois moins.</li>
        </ul>{renvoi}</> },
    { id: 'laser', titre: 'Une lumière d’une seule couleur', focus: ['scene', 'barre'],
      texte: <>Un <strong>laser</strong> émet une lumière <strong>monochromatique</strong> : d’une seule couleur. On repère une couleur pure par sa <strong>longueur d’onde</strong>, mesurée en <strong>nanomètres</strong> (nm). La lumière visible va de 400 nm (violet) à 800 nm (rouge) environ. Ce laser émet à 650 nm. On le fait traverser le prisme.</>,
      tache: { type: 'qcm', ...QCM.laser } },
    { id: 'longueur', titre: 'Longueur d’onde et déviation', focus: ['scene', 'tableau'],
      texte: <>On envoie maintenant trois lasers en même temps, de longueurs d’onde 405 nm, 532 nm et 650 nm. Le tableau donne l’indice du verre pour chacun. Regardez l’indice et la position des trois taches sur l’écran.</>,
      tache: { type: 'qcm', ...QCM.longueur },
      retenirTitre: 'Lumière monochromatique et longueur d’onde',
      retenir: <><FicheMonochrome />
        <ul style={liste}>
          <li><strong>Phrase-clé : une couleur pure, un nombre en nanomètres.</strong> Un laser n’est pas dispersé : il n’a qu’une couleur.</li>
          <li><strong>Exemple</strong> : un laser rouge à 650 nm donne une seule tache sur l’écran.</li>
        </ul>{renvoi}</> },
    { id: 'raies', titre: 'Une lampe à vapeur', focus: ['scene'],
      texte: <>Une lampe à vapeur contient un gaz (ici du mercure) que l’on fait briller avec un courant électrique. Sa lumière traverse le prisme. Sous le schéma, le spectre est agrandi : chaque trait est repéré par sa longueur d’onde, en nm. Vous avez déjà vu de tels spectres dans la simulation « Spectres ».</>,
      tache: { type: 'qcm', ...QCM.raies } },
    { id: 'bilan', titre: 'Le bilan', focus: ['scene'],
      texte: <>La lumière blanche est un <strong>mélange de couleurs</strong>. Le prisme les <strong>disperse</strong> car l’indice du verre dépend de la couleur : le violet (le plus dévié) et le rouge (le moins dévié) sont séparés à chacune des deux faces. Une lumière <strong>monochromatique</strong> (laser) n’est pas dispersée ; on la repère par sa <strong>longueur d’onde</strong>. Une lampe à vapeur donne un <strong>spectre de raies</strong>. Vous pouvez explorer ou relever un défi.</>,
      tache: null,
      retenirTitre: 'Spectre continu ou spectre de raies',
      retenir: <><FicheSpectres />
        <ul style={liste}>
          <li><strong>Phrase-clé : continu, toutes les couleurs ; raies, quelques couleurs seulement.</strong> Plus la longueur d’onde est petite, plus la lumière est déviée.</li>
          <li><strong>Exemple</strong> : la lumière blanche donne un spectre continu ; la lampe à mercure, quelques raies (405 nm, 436 nm, 546 nm, 577 et 579 nm).</li>
        </ul></> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});
  const i = IDS.indexOf(idE);

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = (type, prec = defi) => {
    if (type === 'angle') setDefi({ type, ...M.tirerDefiAngle(prec && prec.type === 'angle' ? prec : null), rep: '', verifie: false });
    else if (type === 'verres') setDefi({ type, ...M.tirerDefiVerres(prec && prec.type === 'verres' ? prec : null), choix: null, verifie: false });
    else setDefi({ type, ...M.tirerDefiCouleur(prec && prec.type === 'couleur' ? prec : null), choix: null, verifie: false });
  };
  function changerMode(md) { setMode(md); if (md === 'defi') setHypoOuv(true); if (md === 'defi' && !defi) nouveauDefi(typeDefi, null); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t, null); }
  const verifier = () => {
    if (defi.type === 'angle') { const x = lireNombre(defi.rep), ok = M.reponseJusteAngle(defi, x); setDefi(d => ({ ...d, verifie: true, ok, x })); noterA(ok); }
    else if (defi.type === 'verres') { const ok = defi.choix != null && M.reponseJusteVerres(defi, defi.choix); setDefi(d => ({ ...d, verifie: true, ok })); noterV(ok); }
    else { const ok = defi.choix != null && M.reponseJusteCouleur(defi, defi.choix); setDefi(d => ({ ...d, verifie: true, ok })); noterC(ok); }
  };
  const nomC = nm => M.REFERENCES.find(r => r.nm === nm).nom;
  const messageAngle = d => {
    const autre = d.nm === M.LAMBDA_VIOLET ? M.N_ROUGE : M.N_VIOLET;
    if (d.ok) return `✓ Correct : sin i₂ = sin ${d.i}${NB}° ÷ ${nf(d.n, 2)}, donc i₂ ≈ ${Math.round(d.vrai)}${NB}°.`;
    const x = d.x;
    if (!isFinite(x)) return '✗ Entrez un nombre (avec la virgule ou le point).';
    if (Math.abs(x - M.angleRefracte(d.i, autre)) <= 0.02 * d.vrai) return `✗ Vous avez pris l’indice de l’autre couleur : ici n${NB}=${NB}${nf(d.n, 2)}.`;
    if (Math.abs(x - d.i) <= 0.03 * d.i) return '✗ Vous avez recopié l’angle de l’énoncé : il faut calculer i₂.';
    if (Math.abs(x - d.i / d.n) <= 0.03 * x) return '✗ On ne divise pas les angles : calculez sin i₁ ÷ n, puis appliquez sin⁻¹.';
    return '✗ Pas encore. Calculez d’abord sin i₂ = sin i₁ ÷ n, puis appliquez la touche sin⁻¹ (mode degrés).';
  };
  const messageVerres = d => {
    const [A, B] = d.verres, eA = A.nV - A.nR, eB = B.nV - B.nR;
    if (d.ok) return `✓ Correct : le verre ${d.bonne} a l’écart n(violet) − n(rouge) le plus grand (${nf(Math.max(eA, eB), 2)} contre ${nf(Math.min(eA, eB), 2)}) : il sépare le plus les couleurs.`;
    if (d.choix != null && d.piege) return '✗ Vous avez pris le verre d’indice le plus élevé. Ce n’est pas la valeur de l’indice qui compte, mais l’écart entre l’indice du violet et celui du rouge.';
    return '✗ Pas encore : calculez, pour chaque verre, la différence entre l’indice du violet et celui du rouge.';
  };
  const champDefiAngle = d => (
    <>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>
        Un rayon <strong>{nomC(d.nm)}</strong> ({d.nm}{NB}nm) arrive sur la première face du prisme avec <strong>i₁{NB}={NB}{d.i}{NB}°</strong>. L’indice du verre pour cette couleur est <strong>n{NB}={NB}{nf(d.n, 2)}</strong>. Quel est l’angle <strong>i₂</strong> dans le verre ? Donnez le résultat en degrés, arrondi à l’unité.
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
        <span>Réponse :</span>
        <input value={d.rep} aria-label="Votre réponse" inputMode="decimal" onKeyDown={e => e.key === 'Enter' && document.getElementById('pr-verif')?.click()} onChange={e => setDefi(x => ({ ...x, rep: e.target.value, verifie: false }))}
          style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${d.verifie ? (d.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 15 }} /><span>{NB}°</span>
      </div>
      <IndiceDefi cache={false}>Loi de Snell-Descartes, air vers verre : sin i₂ = sin i₁ ÷ n. Calculez sin i₁ (mode degrés), divisez par n, puis appliquez sin⁻¹.</IndiceDefi>
    </>);
  const champDefiVerres = d => (
    <>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>On éclaire avec de la lumière blanche deux prismes identiques, l’un en <strong>verre A</strong>, l’autre en <strong>verre B</strong>. Le tableau donne l’indice de chaque verre pour le rouge et pour le violet. Quel prisme sépare le plus les couleurs ?</div>
      <table style={{ borderCollapse: 'collapse', fontSize: 14, marginBottom: 8 }}>
        <thead><tr>{['Verre', `n rouge (700${NB}nm)`, `n violet (400${NB}nm)`].map(h => <th key={h} style={{ textAlign: 'left', padding: '3px 8px', borderBottom: `1px solid ${KIT.bord}`, color: KIT.txt2, fontSize: 13 }}>{h}</th>)}</tr></thead>
        <tbody>{d.verres.map(v => <tr key={v.nom}><td style={{ padding: '3px 8px', fontWeight: 800 }}>{v.nom}</td><td style={{ padding: '3px 8px', fontWeight: 700, color: ROUGE }}>{nf(v.nR, 2)}</td><td style={{ padding: '3px 8px', fontWeight: 700, color: VIOLET }}>{nf(v.nV, 2)}</td></tr>)}</tbody></table>
      <label style={etiquette}>Votre choix
        <select value={d.choix ?? ''} onChange={e => setDefi(x => ({ ...x, choix: e.target.value === '' ? null : e.target.value, verifie: false }))} style={sel}>
          <option value="">— choisir —</option><option value="A">Le prisme en verre A</option><option value="B">Le prisme en verre B</option></select></label>
      <IndiceDefi cache={false}>Un verre disperse d’autant plus que l’indice du violet et celui du rouge sont différents. Calculez cette différence pour chaque verre : un indice élevé ne suffit pas.</IndiceDefi>
    </>);
  const champDefiCouleur = d => (
    <>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Un laser dont la couleur est cachée traverse le prisme avec <strong>i₁{NB}={NB}{d.i1}{NB}°</strong> ; sa déviation mesurée est <strong>D{NB}={NB}{nf(d.D, 1)}{NB}°</strong>. Le tableau donne la déviation de lasers de couleur connue pour le même i₁. De quelle couleur est ce laser ?</div>
      <table style={{ borderCollapse: 'collapse', fontSize: 14, marginBottom: 8 }}>
        <thead><tr>{['Couleur', 'Longueur d’onde', 'Déviation D'].map(h => <th key={h} style={{ textAlign: 'left', padding: '3px 8px', borderBottom: `1px solid ${KIT.bord}`, color: KIT.txt2, fontSize: 13 }}>{h}</th>)}</tr></thead>
        <tbody>{d.table.map(r => <tr key={r.nm}><td style={{ padding: '3px 8px', fontWeight: 800, color: M.couleurRayon(r.nm) }}>{r.nom}</td><td style={{ padding: '3px 8px' }}>{r.nm}{NB}nm</td><td style={{ padding: '3px 8px', fontWeight: 700 }}>{nf(r.D, 1)}{NB}°</td></tr>)}</tbody></table>
      <label style={etiquette}>Couleur du laser
        <select value={d.choix ?? ''} onChange={e => setDefi(x => ({ ...x, choix: e.target.value === '' ? null : +e.target.value, verifie: false }))} style={sel}>
          <option value="">— choisir —</option>{M.REFERENCES.map(r => <option key={r.nm} value={r.nm}>{r.nom} ({r.nm}{NB}nm)</option>)}</select></label>
      <IndiceDefi cache={false}>Comparez D à chaque ligne du tableau : le laser inconnu a la couleur dont la déviation est la plus proche. Rappel : plus la longueur d’onde est petite, plus la déviation est grande.</IndiceDefi>
    </>);
  const TITRES_DEFI = { angle: 'Défi : calculer un angle dans le prisme', verres: 'Défi : quel verre disperse le plus la lumière ?', couleur: 'Défi : reconnaître la couleur d’un laser' };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['verres', 'Comparer deux verres'], ['couleur', 'Reconnaître la couleur'], ['angle', 'Calculer un angle']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target" />{TITRES_DEFI[defi.type]}</div>
      {defi.type === 'angle' ? champDefiAngle(defi) : defi.type === 'verres' ? champDefiVerres(defi) : champDefiCouleur(defi)}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="pr-verif" onClick={verifier} disabled={defi.type !== 'angle' && defi.choix == null} style={{ ...styleBouton(true, '#15803d'), opacity: defi.type !== 'angle' && defi.choix == null ? 0.5 : 1 }}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh" />Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'angle' ? messageAngle(defi) : defi.type === 'verres' ? messageVerres(defi) : (defi.ok ? `✓ Correct : la déviation de ${nf(defi.D, 1)}${NB}° correspond au ${defi.ref.nom} (${defi.ref.nm}${NB}nm).` : '✗ Pas encore : cherchez dans le tableau la ligne dont la déviation est la plus proche de celle du laser.')}</div>}
    </div>);
  const sceneDefi = defi && (defi.type === 'couleur' ? <DessinDispo d={dispo(cfgDefiCouleur(defi))} aria="Un laser dont la couleur est cachée traverse le prisme et forme une tache sur l’écran." />
    : defi.type === 'verres' ? <ScenePrisme cle="blanc" aria="Schéma d’illustration : un faisceau de lumière blanche traverse un prisme et arrive sur un écran." />
    : <DessinDispo d={dispo(cfgDefiEntree(defi.i))} aria={`Un rayon arrive sur la première face du prisme avec un angle d’incidence de ${defi.i} degrés.`} />);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Un prisme de verre dans l’air</strong> : angle au sommet de 60 ° (triangle équilatéral de 4 cm de côté). L’indice de l’air est pris égal à 1,00 pour toutes les couleurs.</li>
      <li><strong>Un verre choisi très dispersif</strong> : indice 1,69 pour le violet (400 nm) et 1,63 pour le rouge (700 nm). C’est <strong>volontairement exagéré</strong> pour que l’effet soit visible ; un verre ordinaire disperse environ 3 fois moins (option de l’exploration).</li>
      <li><strong>Indices intermédiaires calculés</strong> par une formule simple (loi de Cauchy, hors programme) ajustée sur ces deux valeurs, puis arrondis au centième dans le parcours. Ce ne sont pas les valeurs d’un verre réel particulier.</li>
      <li><strong>Rayons lumineux</strong> : fin faisceau, trajets rectilignes, lois de Snell-Descartes à chaque face. Les réflexions partielles, l’absorption et l’intensité de la lumière ne sont pas modélisées.</li>
      <li><strong>Angles d’incidence de 50 ° à 80 °</strong> : limite choisie pour rester loin du cas limite. En dessous de 43 ° environ, le violet est totalement réfléchi à la seconde face (hors programme).</li>
      <li><strong>Longueurs d’onde</strong> dans le vide ou l’air ; le visible va d’environ 400 nm à 800 nm. Les couleurs dessinées sont approximatives : un écran ne reproduit pas fidèlement une couleur pure du spectre.</li>
      <li><strong>Schémas à l’échelle</strong> : 1 cm du schéma représente 1 cm, avec la même échelle dans les deux directions (règle indiquée), sauf la carte « L’indice dépend de la couleur » : l’écart entre le rouge et le violet y est exagéré (mention « écart exagéré » sur le schéma).</li>
      <li><strong>Lampes à vapeur</strong> : raies relevées sur le spectromètre de la simulation « Spectres », intensités non représentées.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search" />Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target" />Défis</button>
      <OngletExercices simId={SIM_ID} />
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const LIGNES_RV = [{ nm: 700 }, { nm: 400 }];
  const LIGNES_3 = [{ nm: 405, nom: 'violet' }, { nm: 532, nom: 'vert' }, { nm: 650, nom: 'rouge' }];
  const alt = { blanc: 'Un faisceau de lumière blanche traverse un prisme et arrive sur un écran.', deux: 'Rayons rouge et violet à la sortie du prisme, avec le trajet sans prisme en pointillés.', entree0: 'Zoom sur la première face du prisme : rayon incident, normale et angle d’incidence i1.',
    entreeRouge: 'Zoom sur la première face : le rayon rouge dans le verre, angle i2 égal 28,0 degrés.', sortie: 'Zoom sur la seconde face : les rayons rouge et violet sortent du prisme ; angles i3 et i4.', deviations: 'Rayons rouge et violet : déviations D de chaque couleur.', laser: 'Un laser de 650 nanomètres traverse le prisme.', trois: 'Trois lasers de 405, 532 et 650 nanomètres traversent le prisme.', lampe: 'Une lampe à vapeur de mercure éclaire le prisme ; sous le schéma, un spectre agrandi avec des longueurs d’onde en nanomètres.' };
  const scene = cle => <ScenePrisme cle={cle} aria={alt[cle]} />;
  const sceneGuide = (() => {
    switch (idE) {
      case 'observer': return boite('Lumière blanche, prisme, écran', scene('blanc'), cadre('scene'));
      case 'deviee': return boite('Le rouge et le violet', scene('deux'), cadre('scene'));
      case 'indice': return <>{boite('La première face du prisme', scene('entree0'), cadre('scene'))}<div style={{ ...cadre('tableau'), marginTop: 12 }}><TableauIndices lignes={LIGNES_RV} /></div></>;
      case 'calcul': return <>{boite('Le rayon rouge dans le verre', scene('entreeRouge'), cadre('scene'))}<div style={{ ...cadre('tableau'), marginTop: 12 }}><TableauIndices lignes={LIGNES_RV} /></div></>;
      case 'sortie': return <>{boite('La seconde face du prisme', scene('sortie'), cadre('scene'))}<div style={{ ...cadre('tableau'), marginTop: 12 }}><TableauIndices lignes={LIGNES_RV} /></div></>;
      case 'deuxfaces': return boite('Les déviations D', scene('deviations'), cadre('scene'));
      case 'continu': return boite('Lumière blanche et prisme', scene('blanc'), cadre('scene'));
      case 'laser': return <>{boite('Un laser et le prisme', scene('laser'), cadre('scene'))}<div style={{ ...cadre('barre'), marginTop: 12 }}>{boite('Les longueurs d’onde du visible', <BarreSpectre reperes={[[650, '650', M.couleurRayon(650)]]} />)}</div></>;
      case 'longueur': return <>{boite('Trois lasers en même temps', scene('trois'), cadre('scene'))}<div style={{ ...cadre('tableau'), marginTop: 12 }}><TableauIndices lignes={LIGNES_3} titre="Indice n du verre pour trois lasers" /></div></>;
      case 'raies': return boite('Lampe à vapeur de mercure', scene('lampe'), cadre('scene'));
      case 'bilan': return boite('Lumière blanche et prisme', scene('blanc'), cadre('scene'));
      default: return null;
    }
  })();
  void i;

  // ════════════════ EXPLORATION ════════════════
  const ouvrir = k => setEx(s => ({ ...s, ouv: { ...s.ouv, [k]: !s.ouv[k] } }));
  const f = M.VERRES.find(v => v.id === ex.verre).f;
  const cfgEx = useMemo(() => cfgExploration({ source: ex.source, nm: ex.nm, lampe: ex.lampe, i1: ex.i1, f }), [ex.source, ex.nm, ex.lampe, ex.i1, f]);
  const dEx = useMemo(() => dispo(cfgEx), [cfgEx]);
  const ligneCouleur = nm => { const t = M.trajet(ex.i1, nm, f); return t; };
  const mesuresRayon = (nm, titre) => { const t = ligneCouleur(nm); if (!t || t.reflexionTotale) return null; return (
    <div key={nm} style={{ marginTop: 6 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: M.couleurRayon(nm) }}>{titre} ({nm}{NB}nm)</div>
      <LigneMesure nom="Indice n" valeur={nf(t.n, 3)} /><LigneMesure nom="i₂ (dans le verre, entrée)" valeur={deg(t.i2)} /><LigneMesure nom="i₃ (dans le verre, sortie)" valeur={deg(t.i3)} /><LigneMesure nom="i₄ (dans l’air, sortie)" valeur={deg(t.i4)} />
      <LigneMesure nom="Déviation D" valeur={deg(t.D)} couleur={COL.orange} /></div>); };
  const reglagesEx = (<>
    <label style={etiquette}>Lumière envoyée
      <select value={ex.source} onChange={x => setEx(s => ({ ...s, source: x.target.value }))} style={sel}><option value="blanc">lumière blanche</option><option value="laser">laser (une seule couleur)</option><option value="lampe">lampe à vapeur</option></select></label>
    {ex.source === 'laser' && <Curseur nom="Longueur d’onde du laser" valeur={ex.nm} onChange={v => setEx(s => ({ ...s, nm: Math.round(v / 10) * 10 }))} min={400} max={800} pas={10} unite="nm" couleur={M.couleurRayon(ex.nm)} />}
    {ex.source === 'lampe' && <label style={etiquette}>Gaz de la lampe
      <select value={ex.lampe} onChange={x => setEx(s => ({ ...s, lampe: x.target.value }))} style={sel}>{M.LAMPES.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}</select></label>}
    <Curseur nom="Angle d’incidence i₁" valeur={ex.i1} onChange={v => setEx(s => ({ ...s, i1: Math.round(v) }))} min={M.I1_MIN} max={M.I1_MAX} pas={1} unite="°" couleur="#334155" />
    <label style={etiquette}>Verre du prisme
      <select value={ex.verre} onChange={x => setEx(s => ({ ...s, verre: x.target.value }))} style={sel}>{M.VERRES.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}</select></label>
    {aide('Choisissez la lumière envoyée, changez l’angle i₁ et le verre. Le schéma et les mesures se mettent à jour. Avec le verre sans dispersion, toutes les couleurs sont déviées pareil : plus de spectre.')}
  </>);
  const mesuresEx = (
    <div style={{ marginTop: 8 }}>
      {ex.source === 'blanc' && <>{mesuresRayon(400, 'Violet')}{mesuresRayon(700, 'Rouge')}
        <LigneMesure nom="Écart de déviation violet − rouge" valeur={deg(M.deviation(ex.i1, 400, f) - M.deviation(ex.i1, 700, f))} couleur={COL.orange} /></>}
      {ex.source === 'laser' && mesuresRayon(ex.nm, M.nomCouleur(ex.nm).replace(/^./, c => c.toUpperCase()))}
      {ex.source === 'lampe' && <table style={{ borderCollapse: 'collapse', fontSize: 14 }}><thead><tr>{['Longueur d’onde', 'Couleur', 'n', 'D'].map(h => <th key={h} style={{ textAlign: 'left', padding: '3px 8px', borderBottom: `1px solid ${KIT.bord}`, color: KIT.txt2, fontSize: 13 }}>{h}</th>)}</tr></thead>
        <tbody>{M.lampe(ex.lampe).raies.map(r => { const t = ligneCouleur(r.nm); return <tr key={r.nm}><td style={{ padding: '3px 8px', fontWeight: 700 }}>{nf(r.nm, 1)}{NB}nm</td><td style={{ padding: '3px 8px', color: M.couleurRayon(r.nm), fontWeight: 800 }}>{M.nomCouleur(r.nm)}</td><td style={{ padding: '3px 8px' }}>{t ? nf(t.n, 3) : '—'}</td><td style={{ padding: '3px 8px' }}>{t && t.D ? deg(t.D) : '—'}</td></tr>; })}</tbody></table>}
    </div>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Lumière blanche : changez l’angle i₁. L’étalement des couleurs reste-t-il le même ? Quelle couleur est toujours la plus déviée ?</li>
      <li>Choisissez le verre ordinaire, puis le verre sans dispersion. Que devient le spectre ? Que prouve cette expérience sur l’indice du verre ?</li>
      <li>Laser : faites varier la longueur d’onde de 400 nm à 800 nm. La déviation augmente-t-elle ou diminue-t-elle ?</li>
      <li>Lampe à vapeur : comparez le sodium (une raie) et le mercure (plusieurs raies). Que peut-on dire de leur lumière ?</li>
      <li>Calculez, avec la loi de Snell-Descartes, l’angle i₂ pour un laser à 400 nm et un laser à 700 nm, puis vérifiez avec les mesures.</li>
    </ul>);
  const auDela = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li><strong>Au-delà du parcours.</strong> Un <strong>réseau</strong> (par exemple la surface d’un CD) disperse aussi la lumière blanche, mais autrement : il ne la dévie pas par réfraction. Avec un réseau, c’est le <strong>rouge</strong> qui est le plus dévié, l’inverse du prisme.</li>
      <li><strong>Au-delà du parcours.</strong> Pour un angle i₁ de 43 ° environ ou moins, le violet est entièrement réfléchi à la seconde face et ne ressort plus : c’est la réflexion totale, que vous verrez en Première. Ce simulateur ne propose que des angles de 50 ° à 80 °.</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>la lumière blanche est un mélange de couleurs ; un prisme les sépare : c’est la dispersion</li>
        <li>le violet est le plus dévié, le rouge le moins : l’indice du verre est plus grand pour le violet</li>
        <li>une lumière monochromatique (laser) n’est pas dispersée ; on la repère par sa longueur d’onde, en nm (visible : 400 à 800 nm environ)</li>
        <li>spectre continu : toutes les couleurs ; spectre de raies : quelques couleurs seulement</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .pr-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .pr-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        @media (min-width: 901px) { .pr-l1.cote .pr-carte { order: 2; } .pr-l1.cote .pr-main { order: 1; } }
        @media (max-width: 900px) { .pr-l1.cote { grid-template-columns: minmax(0, 1fr); } .pr-l1.cote .pr-main { order: 1; } .pr-l1.cote .pr-carte { order: 2; } .pr-hypo-defi { order: 2; } }
        .pr-ex { display: grid; gap: 12px; grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .pr-ex { grid-template-columns: minmax(0, 3fr) minmax(260px, 2fr); } .pr-ex .pr-reg { grid-column: 2; grid-row: 1 / span 2; } }
        @media (prefers-reduced-motion: no-preference) { .pr-in { animation: pr-fondu 0.35s ease-out; } @keyframes pr-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Dispersion de la lumière blanche par un prisme</h2>
        <BoutonsModes mode={mode} setMode={changerMode} />
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une lumière traverse un <strong>prisme</strong> de verre et arrive sur un <strong>écran</strong> : que devient-elle ?</div>
      {enExplore ? <>
        <div className="pr-ex" style={{ marginBottom: 12 }}>
          <div className="pr-reg" style={styleBoite}>{reglagesEx}</div>
          <div style={styleBoite}><DessinDispo d={dEx} aria={`Prisme éclairé par ${ex.source === 'blanc' ? 'de la lumière blanche' : ex.source === 'laser' ? `un laser de ${ex.nm} nanomètres` : `une lampe à vapeur de ${M.lampe(ex.lampe).nom}`}, angle d’incidence ${ex.i1} degrés.`} />{mesuresEx}</div>
        </div>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="Au-delà du parcours (réseau, réflexion totale)" ouvert={!!ex.ouv.dela} onBascule={() => ouvrir('dela')}>{auDela}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`pr-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="pr-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours} /></div> : enDefi ? <div className="pr-carte pr-hypo-defi">{panneauHypo}</div> : null}
          <div className="pr-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'angle' ? suiviA : defi.type === 'verres' ? suiviV : suiviC} /></div>}
            {enDefi && defi && <div className="pr-in" key={`${defi.type}-${JSON.stringify(defi.verres || [defi.i, defi.i1, defi.nm, defi.ref && defi.ref.nm])}`}>{boite(null, sceneDefi)}</div>}
            {enGuide && <div className="pr-in" key={idE}>{sceneGuide}</div>}
          </div>
        </div>
        {enGuide && etape >= IDS.indexOf('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
