import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi, lireNombre, stylePetitBouton } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./tensioactifsModele";
import { QCM } from "./tensioactifsQcm";
import { SceneTensioactif, JaugeTension, CourbeTension, SvgFamilles, SvgStades, SvgMesureCMC, SvgStructureCMC, SvgMolecule, SvgInterface, SvgComparer } from "./TensioactifsSchemas";
import { teteDe } from "./tensioactifsCouleurs";

const SIM_ID = 146, CLE_GUIDE = 'tensioactifs-guide-v1';
declarerDefis(SIM_ID, [['classer', 'Classer des tensioactifs selon leur CMC'], ['libres', 'Monomères libres et micelles au-dessus de la CMC'], ['klevens', 'CMC et longueur de chaîne (prolongement)']]);

// ====================================================
//  SIM 146 — TENSIOACTIFS : DE LA STRUCTURE À LA CMC (BTS MDC, Formulation › Émulsions, tensioactifs)
//  Une seule idée : un tensioactif s'adsorbe à l'interface, puis forme des micelles à partir de la CMC ; la CMC dépend de sa structure.
//  Capacités visées (jamais affichées à l'élève) : décrire le rôle d'un tensioactif ; citer les familles ; évaluer la CMC par tensiométrie ou conductimétrie (parcours « référentiel ») ;
//  la prédiction de la CMC à partir de la structure est un prolongement HORS référentiel (exploration, étiquetée comme telle).
//  Modèle : tensioactifsModele.js (Klevens/Traube ajusté sur le tableau « Detergents Properties and Applications » et une série CC BY). Schémas : TensioactifsSchemas.jsx.
//  Le parcours « Au-delà du référentiel » (étapes 11 à 16), les défis, les exercices et l'enregistrement dans un chapitre viennent dans une version suivante.
// ====================================================

const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c' };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const U = `${NB}mmol·L⁻¹`;
const sig2 = v => String(Number(Number(v).toPrecision(2))).replace('.', ',');
const STADES = { interface: 'Adsorption', volume: 'Surface qui se remplit', saturation: 'Surface presque pleine', micelles: 'Micelles' };
const LEGENDE = {
  interface: 'Les premières molécules vont à la surface : tête dans l’eau, queue hors de l’eau.',
  volume: 'Quelques molécules isolées (monomères) passent aussi dans l’eau, pendant que la surface se remplit.',
  saturation: 'La surface est presque pleine : elle ne peut plus accueillir beaucoup de molécules.',
  micelles: 'Surface saturée : les molécules ajoutées s’associent en micelles. Les monomères libres restent à la concentration de la CMC.',
};
const X_FIXE = { interface: 0.02 };
const ORDRE_CURSEUR = ['sature', 'cmc', 'libres', 'tension', 'conducti'];

// ligne de mesure avec un bouton « ? » qui ouvre un encadré d’explication
function LigneInfo({ cle, ouv, bascule, nom, valeur, couleur, texte }) {
  const k = `i-${cle}`, ouvert = !!ouv[k];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}><LigneMesure nom={nom} valeur={valeur} couleur={couleur}/></div>
        <button onClick={() => bascule(k)} aria-expanded={ouvert} aria-label={`Explication : ${nom}`} title="Que veut dire cette ligne ?"
          style={{ flex: '0 0 auto', width: 30, height: 30, borderRadius: '50%', border: `1.5px solid ${ouvert ? '#0369a1' : KIT.bord}`, background: ouvert ? '#e0f2fe' : 'white', color: '#0369a1', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>?</button>
      </div>
      {ouvert && <div role="note" style={{ margin: '2px 0 8px', padding: '8px 10px', borderRadius: 8, background: '#f0f9ff', border: '1px solid #bae6fd', fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>{texte}</div>}
    </div>);
}

export function SimulationTensioactifs() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [ti, setTi] = useState({ s: M.curseurDeX(0.02), fam: 'sulfate', n: 12 });
  const [ouv, setOuv] = useState({});
  const [suiviC, noterC] = useCompteurDefi(), [suiviL, noterL] = useCompteurDefi(), [suiviK, noterK] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('classer');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const xCur = M.xDeCurseur(ti.s);

  // ---------- étapes du parcours (référentiel : rôle des tensioactifs, familles, CMC, mesure de la CMC) ----------
  const cmcSDS = 8;   // mmol/L, tableau fourni : 7 à 10 ; série : 8
  const ETAPES = [
    { id: 'amphi', titre: 'Une molécule à deux visages', focus: ['scene'],
      texte: <>Un <strong>tensioactif</strong> est une molécule <strong>amphiphile</strong> : une <strong>tête hydrophile</strong> (qui aime l’eau) et une <strong>queue hydrophobe</strong>, une chaîne carbonée (qui fuit l’eau). Exemple : le dodécylsulfate de sodium (SDS), dont la queue compte 12 carbones.</>,
      tache: { type: 'qcm', q: 'Quelle partie de la molécule est hydrophile ?', ...QCM.amphi,
        expl: 'La tête, chargée (groupe sulfate), est attirée par l’eau. La chaîne carbonée, apolaire, est hydrophobe : elle préfère l’huile ou l’air.', indice: 'Une chaîne de carbone et d’hydrogène est apolaire : aime-t-elle l’eau, qui est polaire ?' } },
    { id: 'familles', titre: 'Quatre familles de tensioactifs', focus: ['scene'],
      retenirTitre: 'À RETENIR : LES FAMILLES', retenir: <>
        <SvgFamilles/>
        <ul style={puces}>
          <li>On classe les tensioactifs selon la <strong>charge de leur tête</strong> : anionique (−), cationique (+), amphotère (+ et −) ou non ionique (0).</li>
          <li>Moyen de s’en souvenir : <strong>« anionique : anion, charge − ; cationique : cation, charge + »</strong> (les amphotères portent les deux, les non ioniques aucune).</li>
        </ul></>,
      texte: <>Les têtes hydrophiles n’ont pas toutes la même charge. On distingue les tensioactifs <strong>anioniques</strong> (tête chargée −), <strong>cationiques</strong> (+), <strong>amphotères</strong> (une charge + et une charge −, donc globalement neutre) et <strong>non ioniques</strong> (aucune charge). La tête du SDS porte une charge négative.</>,
      tache: { type: 'qcm', q: 'À quelle famille appartient le SDS ?', ...QCM.famille,
        expl: 'La tête sulfate du SDS porte une charge négative : c’est un tensioactif anionique (le contre-ion est Na⁺). Le CTAB, à tête ammonium (+), est cationique.', indice: 'Regardez la charge de la tête du schéma de la première étape.' } },
    { id: 'interface', titre: 'À la surface de l’eau', focus: ['scene'],
      retenirTitre: 'À RETENIR : À LA SURFACE', retenir: <>
        <SvgInterface/>
        <ul style={puces}>
          <li>Un tensioactif <strong>s’adsorbe à l’interface</strong> : la tête reste dans l’eau, la queue sort vers l’air.</li>
          <li>Cela fait <strong>baisser la tension superficielle</strong> de l’eau.</li>
          <li>Moyen de s’en souvenir : <strong>« la tête reste au bain, la queue prend l’air »</strong>.</li>
        </ul></>,
      texte: <>On ajoute très peu de SDS dans l’eau. Les molécules ne restent pas au hasard dans l’eau : elles gagnent la <strong>surface</strong> (l’interface eau-air). Regardez leur orientation.</>,
      tache: { type: 'qcm', q: 'Où vont en premier les molécules de tensioactif, et dans quelle position ?', ...QCM.interface,
        expl: 'La tête hydrophile reste dans l’eau, la queue hydrophobe sort vers l’air : les molécules s’adsorbent à l’interface. C’est ce qui abaisse la tension superficielle de l’eau.', indice: 'Quelle partie veut rester dans l’eau, et laquelle veut en sortir ?' } },
    { id: 'sature', titre: 'On ajoute du tensioactif', focus: ['scene', 'reglages'],
      texte: <>Un curseur règle la concentration ajoutée, exprimée en multiples de la <strong>CMC</strong> (la valeur à laquelle quelque chose change : vous allez la découvrir). Augmentez-la et observez : d’abord la surface, puis le reste de l’eau.</>,
      tache: { type: 'action', ok: xCur >= 2, consigne: 'Montez la concentration jusqu’à voir apparaître des micelles (les boules de molécules dans l’eau).', attente: null } },
    { id: 'cmc', titre: 'Quand la surface est pleine', focus: ['scene'],
      texte: <>La surface est maintenant <strong>saturée</strong> : elle ne peut plus accueillir de molécules. La concentration à partir de laquelle apparaissent les micelles est la <strong>concentration micellaire critique, CMC</strong>.</>,
      tache: { type: 'qcm', q: 'La surface est saturée. Que deviennent les molécules ajoutées ensuite ?', ...QCM.micelles,
        expl: 'Au-delà de la CMC, les molécules ajoutées s’associent en micelles : les queues hydrophobes se regroupent au centre, les têtes restent au contact de l’eau. Les monomères isolés ne sont pas plus nombreux.', indice: 'Les queues veulent éviter l’eau, mais la surface est pleine : comment se protègent-elles ?' } },
    { id: 'libres', titre: 'Combien de molécules isolées ?', focus: ['scene'],
      retenirTitre: 'À RETENIR : LES QUATRE STADES', retenir: <>
        <SvgStades/>
        <ul style={puces}>
          <li>Avant la CMC, le tensioactif <strong>s’adsorbe à l’interface</strong> et la tension superficielle diminue.</li>
          <li>À la CMC, l’interface est saturée : au-delà, le tensioactif ajouté forme des <strong>micelles</strong> et la concentration en monomères libres reste égale à la CMC.</li>
          <li>Moyen de s’en souvenir : <strong>« la CMC, c’est le plafond des molécules isolées »</strong>.</li>
          <li><strong>Idée fausse :</strong> « au-dessus de la CMC, il y a plus de molécules isolées ». <strong>Vrai :</strong> les molécules en plus forment des micelles ; exemple SDS à 20 mmol/L (CMC ≈ 8) : 8 libres, 12 en micelles.</li>
        </ul></>,
      texte: <>La CMC du SDS vaut environ <strong>{cmcSDS}{U}</strong> (le tableau donne 7 à 10{U}). On prépare une solution de SDS à <strong>20{U}</strong>, donc au-dessus de la CMC.</>,
      tache: { type: 'num', q: 'Quelle est, en gros, la concentration en molécules isolées (monomères) dans cette solution ?', unite: 'mmol·L⁻¹', vrai: cmcSDS, tol: 0.1, affiche: v => String(v).replace('.', ','), carnet: false, cs: 1,
        calcul: () => ['Au-delà de la CMC, tout le tensioactif ajouté forme des micelles.', `Les monomères libres restent à la concentration de la CMC : ${cmcSDS}${U}.`, `Le reste, 20 − ${cmcSDS} = ${20 - cmcSDS}${U}, est sous forme de micelles.`],
        pieges: [[20, 'Ce serait la concentration totale : au-dessus de la CMC, les molécules en excès sont dans les micelles.'], [12, 'C’est la quantité contenue dans les micelles (20 − 8). Les monomères libres sont à la CMC.']],
        expl: `Au-dessus de la CMC, la concentration en monomères libres reste égale à la CMC : environ ${cmcSDS}${U}. Les 12${U} restants forment des micelles.`, indice: 'Au-dessus de la CMC, la concentration en monomères libres reste constante : à quelle valeur ?' } },
    { id: 'tension', titre: 'La courbe de tension superficielle', focus: ['scene'],
      texte: <>On mesure la <strong>tension superficielle γ</strong> de la solution en ajoutant du tensioactif (tensiométrie). Elle est tracée en fonction du logarithme de la concentration ; le point orange suit votre curseur. Pas de valeurs : on regarde seulement la forme de la courbe.</>,
      tache: { type: 'qcm', q: 'Sur cette courbe, à quoi correspond la CMC ?', ...QCM.tension,
        expl: 'Tant que la surface se remplit, γ diminue. Une fois la surface saturée (CMC), γ ne change plus : la courbe devient un plateau. La CMC se lit à la rupture de pente.', indice: 'Au-delà de la CMC, la surface est saturée : que fait γ quand on ajoute encore du tensioactif ?' } },
    { id: 'conducti', titre: 'Une autre mesure : la conductivité', focus: ['scene'],
      retenirTitre: 'À RETENIR : MESURER LA CMC', retenir: <>
        <SvgMesureCMC/>
        <ul style={puces}>
          <li><strong>Tensiométrie</strong> : γ diminue puis forme un plateau ; la CMC est à la rupture de pente (tous les tensioactifs).</li>
          <li><strong>Conductimétrie</strong> : la conductivité σ augmente, puis moins vite après la CMC (les micelles transportent moins bien le courant) ; seulement pour les tensioactifs <strong>ioniques</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« la CMC se lit là où la courbe change de pente »</strong>.</li>
        </ul></>,
      texte: <>Pour un tensioactif <strong>ionique</strong>, on peut aussi suivre la <strong>conductivité</strong> de la solution : elle augmente avec la concentration, puis moins vite après la CMC, car les micelles sont des agrégats volumineux qui conduisent moins bien le courant que les ions isolés.</>,
      tache: { type: 'qcm', q: 'Peut-on mesurer la CMC d’un tensioactif non ionique par conductimétrie ?', ...QCM.conducti,
        expl: 'Un tensioactif non ionique ne libère pas d’ions : la conductivité n’a pas de rupture de pente. On utilise la tensiométrie, valable pour tous les tensioactifs.', indice: 'La conductivité dépend des ions présents : un tensioactif non ionique en fournit-il ?' } },
    { id: 'chaine', titre: 'Longueur de la chaîne', focus: ['scene'],
      texte: <>La CMC dépend de la structure. On compare deux sulfobétaïnes, de <strong>même tête</strong> : SB3-10, avec une chaîne de <strong>10 carbones</strong>, et SB3-14, avec une chaîne de <strong>14 carbones</strong> (un sommet de la ligne brisée = un carbone). Une chaîne plus longue est plus hydrophobe : elle « veut » davantage quitter l’eau.</>,
      tache: { type: 'qcm', q: 'Quand la chaîne passe de 10 à 14 carbones, la CMC…', ...QCM.chaine,
        expl: 'Plus la chaîne est longue, plus les molécules s’associent facilement : la CMC diminue. Pour les sulfobétaïnes du tableau, SB3-10 a une CMC de 25 à 40 mmol/L, SB3-14 de 0,1 à 0,4 mmol/L : environ 100 fois plus faible.', indice: 'Une chaîne plus hydrophobe s’associe-t-elle plus ou moins facilement en micelles ?' } },
    { id: 'tete', titre: 'Nature de la tête', focus: ['scene'],
      retenirTitre: 'À RETENIR : STRUCTURE ET CMC', retenir: <>
        <SvgStructureCMC/>
        <ul style={puces}>
          <li>Chaîne plus longue : <strong>CMC plus faible</strong> (environ ÷ 100 pour 4 carbones de plus, à tête non ionique ; moins fortement pour un ionique).</li>
          <li>Têtes chargées : elles se repoussent dans la micelle, donc la CMC est plus élevée qu’avec une tête non chargée.</li>
          <li>Moyen de s’en souvenir : <strong>« queue longue, CMC basse ; tête chargée, CMC haute »</strong>.</li>
          <li><strong>Idée fausse :</strong> « une tête chargée aide à former des micelles ». <strong>Vrai :</strong> les charges de même signe se repoussent, donc la CMC est plus haute.</li>
        </ul></>,
      texte: <>Deux tensioactifs ont la <strong>même chaîne de 12 carbones</strong> : le SDS, de tête chargée (anionique : sulfate −), et le dodécylmaltoside, de tête <strong>non chargée</strong> (non ionique : deux unités de sucre). Dans une micelle de SDS, les têtes chargées sont proches les unes des autres.</>,
      tache: { type: 'qcm', q: 'Lequel a la CMC la plus faible ?', ...QCM.tete,
        expl: 'Les têtes chargées du SDS se repoussent dans la micelle, ce qui rend l’association moins favorable : sa CMC est plus élevée (environ 8 mmol/L). Le maltoside non ionique n’a pas cette répulsion (CMC d’environ 0,15 mmol/L, tableau).', indice: 'Deux charges de même signe, proches l’une de l’autre, s’attirent ou se repoussent ?' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À RETENIR : COMPARER DEUX TENSIOACTIFS', retenir: <>
        <SvgComparer/>
        <ul style={puces}>
          <li>Même tête : la chaîne <strong>la plus longue</strong> a la CMC la plus basse (SB3-14 plutôt que SB3-10).</li>
          <li>Même chaîne : la tête <strong>non chargée</strong> donne la CMC la plus basse (maltoside plutôt que SDS).</li>
          <li>Moyen de s’en souvenir : <strong>« plus c’est hydrophobe, plus la CMC est basse »</strong>.</li>
        </ul></>,
      texte: <>Vous savez décrire un tensioactif, citer ses familles, expliquer l’adsorption à l’interface puis la formation des micelles à la CMC, lire la CMC sur une courbe, et relier la CMC à la chaîne et à la tête. En exploration, vous pouvez comparer des tensioactifs et voir comment un modèle simple prévoit leur CMC.</> },
  ];
  const IDS = ETAPES.map(e => e.id), etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? IDS[etape] : null;
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const basCurseur = () => setTi(s => ({ ...s, s: M.curseurDeX(0.02) }));   // l’étape « On ajoute du tensioactif » commence surface presque vide
  const setEtatGuide = v => { const nv = typeof v === 'function' ? v(guide) : v; if (IDS[Math.min(nv.etape, IDS.length - 1)] === 'sature' && nv.etape !== guide.etape) basCurseur(); setGuide(nv); };
  const curseurVisible = enExplore || (enGuide && ORDRE_CURSEUR.includes(idE));

  // ---------- grandeurs affichées ----------
  const xEff = enGuide ? (X_FIXE[idE] ?? xCur) : xCur;
  const e = M.etatScene(xEff);
  const fam = M.famille(ti.fam), cm = M.cmc(ti.fam, ti.n), bd = M.bande(ti.fam, ti.n), na = M.nAgg(ti.fam, ti.n), ref = M.reference(ti.fam, ti.n), ec = M.ecartFacteur(ti.fam, ti.n);
  const teteX = enGuide ? teteDe('anionique') : teteDe(fam.classe);
  const PARAM_B = M.PARAM[ti.fam].B;
  const libellesX = x => (x >= 1 ? `${sig2(x)} × CMC` : `${sig2(x)} × CMC`);

  // ---------- scènes ----------
  const sceneGuide = {
    amphi: () => <SvgMolecule fam="sulfate" n={12} titre={M.nomMolecule('sulfate', 12)} annoter/>, familles: () => <SvgMolecule fam="sulfate" n={12} titre={M.nomMolecule('sulfate', 12)} annoter/>,
    interface: () => <SceneTensioactif x={X_FIXE.interface} tete={teteX}/>,
    sature: () => <SceneTensioactif x={xCur} tete={teteX}/>, cmc: () => <SceneTensioactif x={xCur} tete={teteX}/>, libres: () => <SceneTensioactif x={xCur} tete={teteX}/>,
    tension: () => <CourbeTension x={xCur}/>, conducti: () => <CourbeTension x={xCur}/>,
    chaine: () => <div className="ta-col"><SvgMolecule fam="sulfobetaine" n={10} titre={M.nomMolecule('sulfobetaine', 10)}/><SvgMolecule fam="sulfobetaine" n={14} titre={M.nomMolecule('sulfobetaine', 14)}/></div>,
    tete: () => <div className="ta-col"><SvgMolecule fam="sulfate" n={12} titre={M.nomMolecule('sulfate', 12)}/><SvgMolecule fam="maltoside" n={12} titre={M.nomMolecule('maltoside', 12)}/></div>,
  }[idE]?.() ?? null;
  const MES = {
    sature: [['Concentration', libellesX(xCur), COL.orange]],
    cmc: [['Concentration', libellesX(xCur), COL.orange], ['Stade', STADES[e.stade]]],
    libres: [['Concentration', libellesX(xCur), COL.orange], ['Stade', STADES[e.stade]]],
    tension: [['Concentration', libellesX(xCur), COL.orange], ['Stade', STADES[e.stade]]],
    conducti: [['Concentration', libellesX(xCur), COL.orange]],
  };
  const lignesGuide = enGuide ? (MES[idE] ?? []) : [];
  const legendeScene = enGuide ? (['interface', 'sature', 'cmc', 'libres'].includes(idE) ? LEGENDE[M.etatScene(xEff).stade] : null) : LEGENDE[e.stade];


  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Une scène schématique</strong> : chaque point représente beaucoup de molécules, et les tailles ne sont pas à l’échelle. Dans la réalité, la saturation de la surface est progressive et les micelles apparaissent sur un petit intervalle de concentration autour de la CMC ; la simulation idéalise : surface pleine, puis micelles.</li>
      <li><strong>Au-delà de la CMC</strong>, la concentration en monomères libres est prise constante, égale à la CMC.</li>
      <li><strong>La courbe de tension superficielle est qualitative</strong> : aucune valeur chiffrée n’est donnée.</li>
      <li><strong>Modèle de CMC (hors référentiel)</strong> : relation de Klevens, log<sub>10</sub>(CMC) = A − B·n, n étant le nombre de carbones de la chaîne ; A dépend de la tête, B de la famille. Elle est ajustée sur le tableau « Detergents Properties and Applications » (CMC à 20-25{NB}°C) et, pour les sulfates et les ammoniums, sur une série publiée (S. Abbott, d’après H. Yamamoto, licence CC BY, valeurs illustratives).</li>
      <li><strong>Domaine de validité</strong> : tensioactifs <strong>monodisperses</strong> (une seule longueur de chaîne), à 25{NB}°C, dans l’eau pure sans sel, chaînes de 8 à 16 carbones selon la famille. Hors de ce domaine, aucune CMC n’est donnée. Les sels, la température, les tensioactifs polydisperses (Triton, Tween, Brij…) et les sels biliaires ne sont pas modélisés.</li>
      <li><strong>Incertitude</strong> : la fourchette affichée est × ou ÷{NB}2 autour de la valeur prédite ; sur les points d’ajustement, l’écart typique est d’environ ×{NB}1,1 et le pire cas ×{NB}1,5.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const nouveauDefi = type => {
    if (type === 'classer') setDefi({ type, ...M.tirageClasser(), reps: ['', '', ''], verifie: false });
    else if (type === 'libres') setDefi({ type, ...M.tirageLibres(), reps: { lib: '', eng: '' }, verifie: false });
    else setDefi({ type, ...M.tirageKlevens(), reps: { c: '' }, verifie: false });
  };
  const changerMode = md => { if (md === 'guide' && idE !== 'sature' && IDS[Math.min(guide.etape, IDS.length - 1)] === 'sature') basCurseur(); if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const proche = (rep, vrai, tol = 0.05) => { const x = lireNombre(rep); return isFinite(x) && Math.abs(x - vrai) <= tol * Math.abs(vrai); };
  const verifier = () => {
    if (defi.type === 'classer') { const ok = defi.reps.every((r, i) => r === defi.ordre[i]); setDefi(d => ({ ...d, verifie: true, ok })); noterC(ok); }
    else if (defi.type === 'libres') { const ok = proche(defi.reps.lib, defi.libres) && proche(defi.reps.eng, defi.engage); setDefi(d => ({ ...d, verifie: true, ok })); noterL(ok); }
    else { const ok = proche(defi.reps.c, defi.vrai); setDefi(d => ({ ...d, verifie: true, ok })); noterK(ok); }
  };
  const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
  const nbd = v => (Number.isInteger(v) ? String(v).replace('.', ',') : sig2(v));
  const champ = (cle, aria) => (
    <input value={defi.reps[cle]} aria-label={aria} inputMode="decimal" onKeyDown={ev => ev.key === 'Enter' && document.getElementById('ta-verif')?.click()}
      onChange={ev => setDefi(d => ({ ...d, reps: { ...d.reps, [cle]: ev.target.value }, verifie: false }))}
      style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${KIT.bord}`, fontSize: 14 }}/>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['classer', 'Classer'], ['libres', 'Monomères et micelles'], ['klevens', 'Chaîne et CMC (prolongement)']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.type === tp} style={stylePetitBouton(defi.type === tp, '#0369a1')}>{l}</button>)}
      </div>
      {defi.type === 'classer' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : classer ces trois tensioactifs</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.5, marginBottom: 6 }}>Rangez-les de la <strong>CMC la plus faible</strong> à la <strong>CMC la plus élevée</strong>. {defi.mode === 'chaine' ? 'Ils ont la même tête et des chaînes de longueurs différentes.' : `Ils ont la même chaîne (${defi.items[0].n} carbones) et des têtes différentes.`}</div>
        {defi.items.map(it => <SvgMolecule key={it.l} fam={it.fam} n={it.n} titre={`${it.l} : ${M.nomMolecule(it.fam, it.n)}`}/>)}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '8px 0' }}>
          {['CMC la plus faible', 'CMC intermédiaire', 'CMC la plus élevée'].map((nom, i) => (
            <label key={nom} style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>{nom}<br/>
              <select value={defi.reps[i]} onChange={ev => setDefi(d => ({ ...d, reps: d.reps.map((r, j) => (j === i ? ev.target.value : r)), verifie: false }))}
                style={{ ...selectStyle, width: 110, border: `1.5px solid ${defi.verifie ? (defi.reps[i] === defi.ordre[i] ? '#15803d' : '#dc2626') : KIT.bord}` }}>
                <option value="">Choisir…</option>{['A', 'B', 'C'].map(l => <option key={l} value={l}>{l}</option>)}</select></label>))}
        </div>
        <IndiceDefi cache={false}>Une chaîne plus longue est plus hydrophobe : la CMC diminue. À même chaîne, une tête non chargée donne une CMC plus faible qu’une tête chargée, dont les charges se repoussent dans la micelle.</IndiceDefi>
      </>}
      {defi.type === 'libres' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : monomères libres et micelles</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 8 }}>Le tensioactif <strong>{defi.nom}</strong> a une CMC de <strong>{nbd(defi.cmc)}{U}</strong> (à 25{NB}°C, dans l’eau). On prépare une solution à <strong>{nbd(defi.c)}{U}</strong>. Donnez vos résultats en {U.trim()}, avec 2 chiffres significatifs.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6, fontSize: 14 }}><span>Monomères libres :</span>{champ('lib', 'Concentration en monomères libres')}<span>{U}</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}><span>Tensioactif engagé dans les micelles :</span>{champ('eng', 'Concentration engagée dans les micelles')}<span>{U}</span></div>
        <IndiceDefi cache={false}>Au-dessus de la CMC, les monomères libres restent à la concentration de la CMC. Le reste du tensioactif (concentration totale moins CMC) forme des micelles.</IndiceDefi>
      </>}
      {defi.type === 'klevens' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : CMC et longueur de chaîne</div>
        <div style={{ fontSize: 13.5, color: COL.orange, fontWeight: 700, marginBottom: 4 }}>Prolongement du programme (hors référentiel)</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>Dans la série « {M.famille(defi.fam).nom} », chaque carbone ajouté à la chaîne divise la CMC par <strong>{nbd(defi.F)}</strong>. Le tensioactif à <strong>{defi.n0} carbones</strong> a une CMC de <strong>{nbd(defi.c0)}{U}</strong>. Quelle est la CMC du tensioactif à <strong>{defi.n1} carbones</strong> (2 chiffres significatifs) ?</div>
        <SvgMolecule fam={defi.fam} n={defi.n0} titre={`${defi.n0} carbones : CMC ${nbd(defi.c0)} mmol/L`}/><SvgMolecule fam={defi.fam} n={defi.n1} titre={`${defi.n1} carbones : CMC = ?`}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '8px 0', fontSize: 14 }}><span>CMC à {defi.n1} carbones :</span>{champ('c', 'CMC du tensioactif à plus longue chaîne')}<span>{U}</span></div>
        <IndiceDefi cache={false}>On ajoute {defi.d} carbones : on divise {defi.d} fois de suite par {nbd(defi.F)}, soit une division par {nbd(defi.F)}<sup>{defi.d}</sup>.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="ta-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}
        {defi.type === 'classer' && `Du plus faible au plus élevé : ${defi.ordre.map(l => { const it = defi.items.find(i => i.l === l); return `${l} (≈ ${sig2(it.cmc)}${U})`; }).join(' < ')}. ${defi.mode === 'chaine' ? 'Plus la chaîne est longue, plus la CMC est faible.' : 'Les têtes non chargées donnent des CMC plus faibles que les têtes chargées.'}`}
        {defi.type === 'libres' && `Monomères libres : ${nbd(defi.libres)}${U} (la CMC). Dans les micelles : ${nbd(defi.c)} − ${nbd(defi.cmc)} = ${nbd(defi.engage)}${U}.`}
        {defi.type === 'klevens' && `${nbd(defi.c0)} divisé par ${nbd(defi.F)}^${defi.d} (soit ${sig2(defi.F ** defi.d)}) donne ${sig2(defi.vrai)}${U}. Le modèle de l’exploration donne ${sig2(defi.modele)}${U}.`}
      </div>}
    </div>);

  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- réglages ----------
  const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
  const curseur = (
    <div style={{ marginBottom: 8 }}>
      <label htmlFor="ta-c" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}><span>Concentration ajoutée</span><span style={{ color: KIT.txt }}>{libellesX(xCur)}</span></label>
      <input id="ta-c" type="range" min="0" max="100" step="1" value={ti.s} onChange={ev => setTi(s => ({ ...s, s: parseFloat(ev.target.value) }))} aria-label="Concentration ajoutée en multiples de la CMC" style={{ width: '100%', accentColor: '#0369a1' }}/>
      <div style={{ fontSize: 13, color: KIT.txt2 }}>Échelle logarithmique : de 0,001 à 10 fois la CMC.</div>
    </div>);
  const choixFam = id => { const f = M.famille(id); setTi(s => ({ ...s, fam: id, n: Math.min(f.dom[1], Math.max(f.dom[0], s.n)) })); };
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {curseur}
      <Section titre={`Tensioactif : ${fam.nom}, ${ti.n}${NB}C`} ouvert={!!ouv.tens} onBascule={() => bascule('tens')}>
        <label htmlFor="ta-fam" style={libelle}>Famille de tête</label>
        <select id="ta-fam" value={ti.fam} onChange={ev => choixFam(ev.target.value)} style={{ ...selectStyle, marginBottom: 8 }}>
          {M.FAMILLES.map(f => <option key={f.id} value={f.id}>{f.nom} ({f.classe})</option>)}
        </select>
        <label htmlFor="ta-n" style={libelle}>Carbones dans la chaîne (n)</label>
        <select id="ta-n" value={ti.n} onChange={ev => setTi(s => ({ ...s, n: Number(ev.target.value) }))} style={{ ...selectStyle, marginBottom: 4 }}>
          {Array.from({ length: fam.dom[1] - fam.dom[0] + 1 }, (_, k) => fam.dom[0] + k).map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <div style={{ fontSize: 13, color: KIT.txt2 }}>Une longueur de chaîne et une famille : le modèle en déduit la CMC (prolongement du programme).</div>
      </Section>
    </div>);

  // ---------- scène (cadre) ----------
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {enExplore && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Ce qui se passe quand on ajoute du tensioactif</div>}
      {enGuide ? sceneGuide : <SceneTensioactif x={xCur} tete={teteX}/>}
      {legendeScene && <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>{legendeScene}</div>}
    </div>);
  const mesures = (enExplore || (enGuide && lignesGuide.length > 0)) && (
    <div style={{ ...styleBoite }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{enExplore ? 'Mesures' : 'Données'}</div>
      {enGuide ? lignesGuide.map(([n, v, col]) => <LigneMesure key={n} nom={n} valeur={v} couleur={col}/>) : <>
        <LigneInfo cle="conc" ouv={ouv} bascule={bascule} nom="Concentration ajoutée" valeur={libellesX(xCur)} couleur={COL.orange}
          texte="Quantité de tensioactif ajoutée à l’eau, exprimée en multiples de la CMC : « 2,5 × CMC » veut dire 2,5 fois la concentration à partir de laquelle les micelles se forment."/>
        <LigneInfo cle="stade" ouv={ouv} bascule={bascule} nom="Stade" valeur={STADES[e.stade]}
          texte="Ce que l’on voit dans la scène : les molécules s’adsorbent d’abord à la surface, puis la surface se remplit, puis les micelles se forment dans l’eau."/>
        <LigneInfo cle="libres" ouv={ouv} bascule={bascule} nom="Monomères libres" valeur={xCur >= 1 ? '= CMC' : `${sig2(xCur)} × CMC`}
          texte="Les monomères libres sont les molécules isolées dans l’eau (ni à la surface, ni dans une micelle). Au-delà de la CMC, leur concentration ne monte plus : elle reste égale à la CMC, tout le reste du tensioactif forme des micelles."/>
        <div style={{ margin: '10px 0 2px', fontSize: 13.5, fontWeight: 700, color: COL.vert }}>Prévision de la CMC par un modèle simple</div>
        <LigneInfo cle="cmc" ouv={ouv} bascule={bascule} nom="CMC prévue" valeur={`${sig2(cm)}${U}`} couleur={COL.vert}
          texte={`CMC calculée par un modèle à partir de la structure de la molécule (famille de la tête et nombre de carbones de la chaîne). Le programme de BTS demande de savoir mesurer la CMC (tensiométrie, conductimétrie) ; la prévoir à partir de la structure va au-delà : c’est un prolongement, pas une exigence du référentiel.`}/>
        <LigneInfo cle="fourchette" ouv={ouv} bascule={bascule} nom="CMC probablement entre" valeur={`${sig2(bd[0])} et ${sig2(bd[1])}${U}`}
          texte={`Le modèle n’est pas exact. Cette fourchette donne la moitié et le double de la valeur prévue : la vraie CMC a de bonnes chances de s’y trouver. Sur les tensioactifs du tableau, l’écart typique est d’environ ×${NB}1,1 et le pire cas ×${NB}1,5.`}/>
        <LigneInfo cle="reelle" ouv={ouv} bascule={bascule} nom="Concentration réelle ajoutée" valeur={`${sig2(xCur * cm)}${U}`} couleur={COL.orange}
          texte="Concentration en tensioactif correspondant à la position du curseur : curseur × CMC prévue."/>
        {na != null && <LigneInfo cle="agg" ouv={ouv} bascule={bascule} nom="Molécules par micelle" valeur={`${na}`}
          texte="Nombre d’agrégation : nombre moyen de molécules de tensioactif réunies dans une micelle (valeur du tableau fourni)."/>}
        <LigneInfo cle="ch2" ouv={ouv} bascule={bascule} nom="Effet d’un carbone de plus" valeur={`CMC ÷${NB}${sig2(10 ** PARAM_B)}`}
          texte={`Chaque carbone ajouté à la chaîne divise la CMC par environ ${sig2(10 ** PARAM_B)} (famille : ${fam.nom}). C’est un gain d’énergie d’environ ${sig2(M.kJParCH2(ti.fam))}${NB}kJ·mol⁻¹ par carbone : une chaîne plus hydrophobe s’assemble plus facilement en micelles.`}/>
      </>}
    </div>);
  const structure = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Structure de la molécule</div>
      <SvgMolecule fam={ti.fam} n={ti.n} titre={M.nomMolecule(ti.fam, ti.n)} annoter/>
      <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>Formule simplifiée : un sommet de la ligne brisée est un carbone (les hydrogènes sont sous-entendus). La CMC prévue dépend de la longueur de la queue et de la nature de la tête.</div>
    </div>);
  const courbe = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Tension superficielle (forme seulement)</div>
      <CourbeTension x={xCur}/><div style={{ marginTop: 6 }}><JaugeTension x={xCur}/></div>
    </div>);
  const comparaison = enExplore && (
    <Section titre="Comparer au tableau" ouvert={!!ouv.comp} onBascule={() => bascule('comp')}>
      {ref ? <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <div><strong>{ref.nom}</strong> ({ref.src === 'tableau' ? 'tableau fourni' : 'série publiée'}) : CMC {ref.hi ? `de ${sig2(ref.lo)} à ${sig2(ref.hi)}` : `≈ ${sig2(ref.lo)}`}{U}.</div>
        <div>Modèle : <strong>{sig2(cm)}{U}</strong>{ec != null && (ec === 1 ? ' : dans l’intervalle du tableau.' : ` : écart d’un facteur ${sig2(ec)}.`)}</div>
      </div> : <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>Pas de valeur de référence pour cette longueur de chaîne : la valeur donnée est une <strong>prédiction</strong> du modèle (fourchette × ou ÷{NB}2).</div>}
    </Section>);
  const aEssayer = (
    <ul style={liste}>
      <li>Montez le curseur de 0,001 à 10 fois la CMC : à quel moment la surface est-elle pleine ? Les micelles apparaissent-elles avant ou après ?</li>
      <li>Passez de la famille « sulfate » à « maltoside » avec la même chaîne de 12 carbones : que devient la CMC ?</li>
      <li>Avec les sulfobétaïnes, augmentez n de 8 à 16 : de quel facteur la CMC change-t-elle à chaque carbone ajouté ?</li>
      <li>Choisissez le maltoside, de tête non chargée : sa CMC est-elle plus haute ou plus basse que celle du sulfate de même longueur de chaîne ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Un tensioactif s’adsorbe à l’interface, puis forme des micelles à partir de la CMC</li>
        <li>Au-delà de la CMC, la concentration en monomères libres reste égale à la CMC</li>
        <li>Chaîne plus longue : CMC plus faible ; tête chargée : CMC plus élevée</li>
        <li>Mesure de la CMC : rupture de pente de γ (tensiométrie) ou de σ (conductimétrie, ioniques)</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ta-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ta-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ta-col { display: flex; flex-direction: column; gap: 12px; }
        .ta-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .ta-l1.cote .ta-carte { order: 2; } .ta-l1.cote .ta-main { order: 1; }
          .ta-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .ta-ex > * { grid-column: 1; }
          .ta-ex > .ta-reg { grid-column: 2; grid-row: 1 / span 5; }
        }
        @media (max-width: 900px) { .ta-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .ta-in { animation: ta-fondu 0.35s ease-out; } @keyframes ta-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Tensioactifs : de la structure à la CMC</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un <strong>tensioactif</strong> se place à la surface de l’eau, puis s’assemble en <strong>micelles</strong> à partir de la <strong>concentration micellaire critique (CMC)</strong>. On observe ce qui se passe quand on en ajoute, puis on relie la CMC à la structure de la molécule.</div>
      {enGuide && <div className="ta-l1 cote">
        <div className="ta-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="ta-main">
          <div className="ta-col">
            {sceneGuide && <div className="ta-in">{scene}</div>}
            {curseurVisible && <div className="ta-in" style={{ ...styleBoite, ...cadre('reglages') }}>{curseur}</div>}
            {mesures && <div className="ta-in">{mesures}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'classer' ? suiviC : defi.type === 'libres' ? suiviL : suiviK}/></div>}
      {enExplore && <>
        <div className="ta-ex">
          {scene}
          <div className="ta-reg">{reglages}</div>
          {structure}
          {mesures}
          {courbe}
        </div>
        {comparaison}
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
