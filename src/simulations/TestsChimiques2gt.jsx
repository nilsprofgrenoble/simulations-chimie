import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, ARetenir, IndiceDefi, ExempleResolu, OngletExercices } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./testsChimiques2gtModele";
import { QCM } from "./testsChimiques2gtQcm";
import { COL } from "./testsChimiques2gtCouleurs";
import { SchemaTest, SceneUnTest, SceneNegatif, SceneFlamme, SceneBougie, TableauResultats, SceneAssocier, SceneArbre, SceneBilan, Precautions } from "./TestsChimiques2gtScenes";
import { FicheTest, FicheArbre, FicheLimites } from "./TestsChimiques2gtFiches";

const SIM_ID = 198, CLE_GUIDE = 'tests-chimiques-2gt-guide-v1';
declarerDefis(SIM_ID, [['gaz', 'Identifier un gaz inconnu avec un nombre limité de tests'], ['observation', 'Relier une observation à une espèce']]);

// ====================================================
//  SIM 198 — TESTS CHIMIQUES : EAU, DIHYDROGÈNE, DIOXYGÈNE, DIOXYDE DE CARBONE (2GT spé PC, « Constitution et transformations de la matière », A « Description et caractérisation de la matière »).
//  Prérequis : simulation 179 (équation de réaction : combustion, action d'un acide sur le calcaire ou sur un métal), simulation 63 (mélanges). Une seule idée : un test chimique = un réactif + une observation ;
//  quatre tests à connaître ; on identifie un gaz inconnu avec plusieurs tests (arbre de décision) en gardant la prudence (test négatif, flamme éteinte, mélange).
//  Parcours (12 étapes) : un test (1), eau (1), CO₂ (1), O₂ (1), H₂ avec précautions d'abord (1), associer (1), lire un tableau (1), arbre de décision (1), test négatif (1), flamme éteinte (1), mélange (1), bilan (1).
//  Capacités visées (jamais affichées à l'élève) : citer des tests chimiques courants de présence d'eau, de dihydrogène, de dioxygène, de dioxyde de carbone ;
//  mettre en œuvre des tests chimiques pour identifier une espèce chimique et, le cas échéant, qualifier l'échantillon de mélange.
//  Hors programme, non traité : les ions (identification d'ions), l'excès de CO₂ qui redonne une eau de chaux limpide, les tests des autres gaz.
// ====================================================

const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
const renvoi = <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>↓ La question de cette étape est juste en dessous.</div>;
const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
const etiquette = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 };
const NOM_TEST_COURT = { h2: 'la flamme (test du dihydrogène)', o2: 'la braise (test du dioxygène)', co2: 'l’eau de chaux (test du dioxyde de carbone)', eau: 'le sulfate de cuivre anhydre (test de l’eau)' };
const ORDRE_ASSOCIER = ['o2', 'eau', 'h2', 'co2'];   // ordre d'affichage des observations dans les menus (différent de celui des lignes)

export function SimulationTestsChimiques() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviG, noterG] = useCompteurDefi(), [suiviO, noterO] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('gaz');
  const [hypoOuv, setHypoOuv] = useState(() => mode === 'defi');
  const [assoc, setAssoc] = useState({});
  const [arbre, setArbre] = useState({ t2: '', g2: '', t3: '', g3: '', gf: '' });
  const [ex, setEx] = useState({ src: 'calcaire', test: 'co2', essais: {}, dernier: null, ouv: {} });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  // ---------- étapes du parcours ----------
  const IDS = ['un', 'eau', 'co2', 'o2', 'h2', 'associer', 'lire', 'arbre', 'negatif', 'flamme', 'melange', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const assocOk = M.OBS_ASSOCIER.every(([id]) => assoc[id] === id);
  const ETAPES = [
    { id: 'un', titre: 'Un test chimique', focus: ['scene'],
      texte: <>Pour savoir ce que contient un échantillon, on fait un <strong>test chimique</strong>. Un test, c’est <strong>un réactif</strong> (un produit que l’on met au contact de l’échantillon) et <strong>un signe visible précis</strong> que ce réactif provoque avec une espèce donnée : une couleur, un trouble, un petit bruit… Quand ce signe apparaît, on dit que le test est <strong>positif</strong>. Chaque espèce a son propre test.</>,
      tache: { type: 'qcm', ...QCM.un } },
    { id: 'eau', titre: 'Le test de la poudre blanche', focus: ['scene'],
      texte: <>Le test de l’<strong>eau</strong> utilise le <strong>sulfate de cuivre anhydre</strong> (« anhydre » veut dire « sans eau »). C’est une poudre <strong>blanche</strong>. Au contact de l’eau, elle devient <strong>bleue</strong>.
        <Precautions>Lunettes de protection. La poudre de sulfate de cuivre est nocive : on ne la touche pas avec les doigts, on ne la porte jamais à la bouche. Le test est fait avec le professeur. Les restes de poudre ou de liquide ne vont pas à l’évier (nocifs pour l’eau) : on les donne au professeur.</Precautions>
        <ExempleResolu>On dépose une goutte du liquide A sur la poudre blanche : elle devient bleue. Le changement attendu a eu lieu : le test est <strong>positif</strong>, donc le liquide A contient de l’eau.</ExempleResolu>
        À vous : un autre liquide.</>,
      tache: { type: 'qcm', ...QCM.eau } },
    { id: 'co2', titre: 'Le test de l’eau de chaux', focus: ['scene'],
      texte: <>L’<strong>eau de chaux</strong> est un liquide incolore et <strong>limpide</strong> (transparent). Pour tester un gaz, on le fait passer dans l’eau de chaux. Avec du dioxyde de carbone (CO₂, le gaz que l’on rejette en respirant), l’eau de chaux devient <strong>trouble</strong> : elle devient blanche et laiteuse, car de petits grains solides blancs se forment dans le liquide (un <strong>précipité</strong>).
        <Precautions>L’eau de chaux est irritante : lunettes de protection, expérience faite avec le professeur.</Precautions>
        <ExempleResolu>Le gaz qui s’échappe d’une boisson gazeuse est conduit dans de l’eau de chaux : elle devient trouble. Le signe attendu est apparu : le test est <strong>positif</strong>, ce gaz contient du dioxyde de carbone.</ExempleResolu>
        À vous : un autre gaz.</>,
      tache: { type: 'qcm', ...QCM.co2 },
      retenirTitre: 'Le test de l’eau', retenir: <><FicheTest test="eau" />
        <ul style={liste}>
          <li><strong>Phrase-clé : sans eau, blanc ; avec eau, bleu.</strong></li>
          <li><strong>Idée fausse</strong> : « la poudre devient bleue, donc c’est de l’eau pure ». <strong>Vrai</strong> : de l’eau est présente, peut-être mêlée à autre chose (l’éthanol du commerce contient de l’eau).</li>
        </ul>{renvoi}</> },
    { id: 'o2', titre: 'Le test de la braise', focus: ['scene'],
      texte: <>Une <strong>braise</strong> est une bûchette de bois enflammée dont on a soufflé la flamme : elle ne garde qu’un <strong>point rouge</strong> brillant, sans flamme. On la plonge dans le gaz à tester. Avec du dioxygène (O₂), la braise <strong>se rallume</strong> avec une flamme vive.
        <Precautions>Lunettes de protection, gestes lents, cheveux attachés. On travaille avec le professeur, jamais seul.</Precautions>
        <ExempleResolu>On plonge une braise dans le gaz d’un tube A : elle se rallume avec une flamme vive. Le signe attendu est apparu : le test est <strong>positif</strong>, le gaz A contient du dioxygène.</ExempleResolu>
        À vous : un autre gaz.</>,
      tache: { type: 'qcm', ...QCM.o2 },
      retenirTitre: 'Le test du dioxyde de carbone', retenir: <><FicheTest test="co2" />
        <ul style={liste}>
          <li><strong>Phrase-clé : limpide, puis trouble : c’est le CO₂.</strong></li>
          <li><strong>Exemple</strong> : le précipité blanc qui trouble l’eau de chaux est du carbonate de calcium. Un seul gaz donne ce résultat dans les tests du lycée.</li>
        </ul>{renvoi}</> },
    { id: 'h2', titre: 'Le test de la flamme', focus: ['scene'],
      texte: <>Le <strong>dihydrogène</strong> (H₂) est un gaz très léger qui brûle facilement. Son test est le plus <strong>dangereux</strong> : on commence donc par les précautions.
        <Precautions titre="Précautions d’abord">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Lunettes de protection.</li>
            <li>Le test est réalisé <strong>par le professeur</strong>, jamais par l’élève seul.</li>
            <li><strong>Très peu de gaz</strong>, dans un petit tube <strong>bouché</strong> : le professeur retire le bouchon et approche la flamme de l’ouverture.</li>
            <li><strong>Loin de toute autre flamme</strong> et des autres tubes de gaz.</li>
          </ul>
        </Precautions>
        Avec du dihydrogène, on entend une petite détonation : un <strong>« pop »</strong>. Il vient du dihydrogène qui réagit d’un coup avec le dioxygène de l’air présent dans l’ouverture du tube, au contact de la flamme.</>,
      tache: { type: 'qcm', ...QCM.h2 },
      retenirTitre: 'Le test du dioxygène', retenir: <><FicheTest test="o2" />
        <ul style={liste}>
          <li><strong>Phrase-clé : la braise REnaît, c’est le dioxygène.</strong></li>
          <li><strong>Exemple</strong> : une braise qui se contente de rester rouge ou de s’éteindre ne donne pas un test positif.</li>
        </ul>{renvoi}</> },
    { id: 'associer', titre: 'Associer espèce et observation', focus: ['scene'],
      texte: <>Vous connaissez maintenant quatre tests. À chaque espèce, associez l’observation qui la met en évidence (menus déroulants).</>,
      tache: { type: 'action', ok: assocOk, consigne: 'Associez les quatre espèces à leur observation.' } },
    { id: 'lire', titre: 'Lire les résultats d’un gaz inconnu', focus: ['scene'],
      texte: <>Pour identifier un <strong>gaz inconnu</strong>, on fait <strong>plusieurs tests</strong> avec le même gaz. On lit alors le tableau des observations : on cherche le test dont l’observation attendue a lieu.
        <ExempleResolu>Gaz A : un « pop » à la flamme ; la braise s’éteint ; l’eau de chaux reste limpide. Seul le test de la flamme a donné son observation : le gaz A est du <strong>dihydrogène</strong>.</ExempleResolu>
        À vous : le gaz B.</>,
      tache: { type: 'qcm', ...QCM.lire },
      retenirTitre: 'Le test du dihydrogène', retenir: <><FicheTest test="h2" />
        <ul style={liste}>
          <li><strong>Phrase-clé : « pop » à la flamme, c’est le H₂.</strong></li>
          <li><strong>Précautions</strong> : réalisé par le professeur, très peu de gaz, tube bouché, loin de toute autre flamme. Ce test ne se refait jamais seul.</li>
        </ul>{renvoi}</> },
    { id: 'arbre', titre: 'Construire un arbre de décision', focus: ['scene'],
      texte: <>Le gaz inconnu est l’un de ces quatre gaz : H₂, O₂, CO₂ ou <strong>N₂</strong> (le diazote, principal gaz de l’air) : c’est l’énoncé qui donne cette liste, on ne l’étend pas à d’autres gaz. Pour le diazote, aucun des trois tests n’est positif. Le tube contient <strong>un seul gaz pur</strong>, pas dilué : un test négatif suffit alors à écarter un gaz. Un <strong>arbre de décision</strong> range les tests dans l’ordre. Exemple : si la flamme ne fait pas de « pop », on passe à la braise. Si tous les tests sont négatifs, c’est le diazote, <strong>par élimination</strong>. Le test 1 est déjà construit : complétez les tests 2 et 3 et le gaz final.</>,
      tache: { type: 'action', ok: M.verifierArbre(arbre).ok, consigne: 'Complétez l’arbre de décision.' } },
    { id: 'negatif', titre: 'Que veut dire un test négatif ?', focus: ['scene'],
      texte: <>Un test est <strong>négatif</strong> quand le changement attendu n’a pas lieu. Que peut-on en conclure ? Regardons un cas. Rappel du collège : l’air contient environ <strong>un cinquième</strong> de dioxygène. Une braise est plongée dans un flacon d’air.</>,
      tache: { type: 'qcm', ...QCM.negatif },
      retenirTitre: 'L’arbre de décision', retenir: <><FicheArbre />
        <ul style={liste}>
          <li><strong>Phrase-clé : un test positif désigne un gaz ; si tout est négatif, il reste le diazote.</strong></li>
          <li><strong>Hypothèses</strong> : un seul gaz pur, et une liste de gaz donnée par l’énoncé. L’ordre des tests 2 et 3 peut changer.</li>
        </ul>{renvoi}</> },
    { id: 'flamme', titre: 'Une flamme qui s’éteint', focus: ['scene'],
      texte: <>On entend parfois : « un gaz qui éteint la flamme, c’est du dioxyde de carbone ». Voyons ce que vaut cette phrase. Voici une allumette enflammée plongée dans un tube de gaz inconnu.</>,
      tache: { type: 'qcm', ...QCM.flamme } },
    { id: 'melange', titre: 'Deux espèces en même temps', focus: ['scene'],
      texte: <>Une bougie brûle sous un flacon retourné (on a étudié les combustions dans la simulation « Équation de réaction »). On frotte de la poudre blanche sur la buée du flacon : elle devient bleue. On agite de l’eau de chaux dans le flacon : elle se trouble.</>,
      tache: { type: 'qcm', ...QCM.melange },
      retenirTitre: 'Les limites d’un test', retenir: <><FicheLimites />
        <ul style={liste}>
          <li><strong>Phrase-clé : un test se lit avec prudence.</strong></li>
          <li><strong>Idée fausse</strong> : « la braise ne se rallume pas, donc il n’y a pas de dioxygène ». <strong>Vrai</strong> : l’air en contient, mais trop peu pour ce test.</li>
        </ul>{renvoi}</> },
    { id: 'bilan', titre: 'Le bilan', focus: ['scene'],
      texte: <>Un test chimique, c’est <strong>un réactif et un signe visible</strong>. Eau : poudre blanche qui devient bleue. CO₂ : eau de chaux qui se trouble. O₂ : braise qui se rallume. H₂ : « pop » à la flamme, fait par le professeur. Pour identifier un gaz, on enchaîne les tests dans un arbre de décision, avec une liste de gaz donnée par l’énoncé. Gardez la prudence : un test négatif ne prouve pas l’absence quand l’espèce est peu présente dans un mélange, une flamme éteinte n’est pas un test, et plusieurs tests peuvent être positifs pour un mélange. Ces gaz se forment dans des réactions déjà vues : un acide sur du calcaire donne du CO₂, un acide sur un métal donne du H₂, une combustion donne de l’eau et du CO₂. Vous pouvez maintenant explorer ou relever un défi.</>,
      tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const ORANGE = ORANGE_GUIDE;
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = (type, prec = defi) => {
    if (type === 'gaz') setDefi({ type, ...M.tirerDefiGaz(prec && prec.type === 'gaz' ? prec : null), verifie: false, ok: false });
    else setDefi({ type, o: M.tirerObservation(prec && prec.type === 'observation' ? prec.o : null), verifie: false, ok: false });
  };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi') setHypoOuv(true);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi, null);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t, null); }
  const verifier = () => {
    if (defi.type === 'gaz') { const j = M.jugerDefiGaz(defi); setDefi(d => ({ ...d, verifie: true, ok: j.ok, j })); noterG(j.ok); }
    else { const ok = defi.o.rep === defi.o.bonne; setDefi(d => ({ ...d, verifie: true, ok })); noterO(ok); }
  };
  const messageGaz = d => {
    const j = d.j, n = d.obs.length;
    if (d.ok) return `✓ Correct : ${M.nomGaz(d.gaz)}, identifié avec ${n} test${n > 1 ? 's' : ''} (maximum permis : ${d.budget}).`;
    if (!d.conclusion) return '✗ Choisissez d’abord un gaz.';
    if (!j.prouvee && n >= d.budget) return `✗ Vous avez utilisé tous vos tests sans pouvoir conclure : ${j.restants.length} gaz restent possibles (${j.restants.map(g => M.ESPECES[g].formule).join(', ')}). Cliquez sur « Recommencer les tests » en choisissant des tests qui concernent les gaz possibles.`;
    if (!j.prouvee) return `✗ Vos tests ne permettent pas encore de conclure : ${j.restants.length} gaz restent possibles (${j.restants.map(g => M.ESPECES[g].formule).join(', ')}). Faites un autre test, ou relisez vos observations.`;
    return `✗ Ce n’est pas le bon gaz : relisez vos observations. Un test positif désigne un gaz ; si tous sont négatifs, il reste celui qu’aucun test ne met en évidence.`;
  };
  const defiGaz = d => {
    const faits = d.obs.map(o => o.test), plein = d.obs.length >= d.budget;
    return (<>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>
        Un tube contient <strong>un seul gaz pur</strong>, parmi : <strong>{d.candidats.map(g => `${M.ESPECES[g].nom} ${M.ESPECES[g].formule}`).join(', ')}</strong>. Vous disposez de <strong>{d.budget} tests au plus</strong> (chacun une seule fois). La flamme est un test fait par le professeur. Choisissez vos tests, lisez les observations, puis concluez.
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {M.TESTS_GAZ.map(t => <button key={t} disabled={d.verifie || plein || faits.includes(t)} onClick={() => setDefi(x => M.faireTest({ ...x, verifie: false }, t))}
          style={{ ...stylePetitBouton(false), opacity: d.verifie || plein || faits.includes(t) ? 0.45 : 1, minHeight: 40 }}>{M.TESTS[t].reactif === 'une flamme' ? 'Flamme (faite par le professeur)' : M.TESTS[t].reactif === 'une braise' ? 'Braise plongée' : 'Eau de chaux'}</button>)}
      </div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8 }}>
        <strong>Tests faits : {d.obs.length} sur {d.budget}</strong>
        {d.obs.length === 0 ? <div style={{ color: KIT.txt2 }}>Aucun test pour l’instant.</div> : (
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>{d.obs.map((o, i) => <li key={i}>{M.TESTS[o.test].reactif === 'une flamme' ? 'Flamme' : M.TESTS[o.test].reactif === 'une braise' ? 'Braise' : 'Eau de chaux'} : {o.texte}</li>)}</ul>)}
      </div>
      <label style={etiquette}>Votre conclusion
        <select value={d.conclusion} onChange={e => setDefi(x => ({ ...x, conclusion: e.target.value, verifie: false }))} style={sel}>
          <option value="">— choisir un gaz —</option>{d.candidats.map(g => <option key={g} value={g}>{M.ESPECES[g].nom} {M.ESPECES[g].formule}</option>)}</select></label>
      <IndiceDefi cache={false}>Chaque test est positif pour un seul gaz. Choisissez des tests qui correspondent aux gaz possibles : un test qui ne concerne aucun d’eux ne vous apprend rien. Quand tous les gaz sauf un sont éliminés, c’est celui qui reste.</IndiceDefi>
    </>);
  };
  const messageObs = d => (d.ok ? `✓ Correct : ${d.o.expl}` : d.o.rep ? `✗ Pas tout à fait. ${d.o.expl}` : '✗ Choisissez une réponse.');
  const defiObs = d => (
    <>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}><strong>{d.o.texte}</strong> {d.o.q}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
        {d.o.options.map(opt => <button key={opt} onClick={() => setDefi(x => ({ ...x, o: { ...x.o, rep: opt }, verifie: false }))} aria-pressed={d.o.rep === opt}
          style={{ ...styleBouton(d.o.rep === opt, '#0ea5e9'), textAlign: 'left', fontSize: 14, padding: '7px 10px' }}>{opt}</button>)}
      </div>
      <IndiceDefi cache={false}>{d.o.indice}</IndiceDefi>
    </>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['gaz', 'Identifier un gaz'], ['observation', 'Lire une observation']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target" />{defi.type === 'gaz' ? 'Défi : identifier un gaz inconnu avec peu de tests' : 'Défi : que conclure de cette observation ?'}</div>
      {defi.type === 'gaz' ? defiGaz(defi) : defiObs(defi)}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
        <button onClick={verifier} disabled={defi.type === 'gaz' ? !defi.conclusion : !defi.o.rep} style={{ ...styleBouton(true, '#15803d'), opacity: (defi.type === 'gaz' ? !defi.conclusion : !defi.o.rep) ? 0.5 : 1 }}>{defi.type === 'gaz' ? 'Conclure' : 'Vérifier'}</button>
        {defi.type === 'gaz' && <button onClick={() => setDefi(x => ({ ...x, obs: [], conclusion: '', verifie: false }))} style={styleBouton(false)}>Recommencer les tests</button>}
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh" />Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'gaz' ? messageGaz(defi) : messageObs(defi)}</div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Un seul gaz dans le tube</strong>, sans autre gaz mélangé. Dans un mélange, plusieurs tests peuvent être positifs (une bougie qui brûle forme de l’eau et du dioxyde de carbone). La liste des gaz possibles est donnée par l’énoncé : « diazote » se conclut seulement parce que les autres sont éliminés.</li>
      <li><strong>Un test pour une espèce</strong> : ici, chaque test ne réagit qu’avec un seul des gaz étudiés. Dans la vraie vie, d’autres produits peuvent aussi réagir. Pour le « pop », le tube contient un peu d’air : le bruit vient du dihydrogène qui réagit avec le dioxygène de l’air.</li>
      <li><strong>Un test négatif ne prouve pas l’absence</strong> : s’il y a très peu de l’espèce, ou si le test est mal fait, rien ne se voit. La braise ne se rallume pas dans l’air, qui contient pourtant du dioxygène.</li>
      <li><strong>Gaz secs, poudre bien conservée</strong> : un gaz qui sort d’un liquide emporte de la vapeur d’eau, et l’humidité de l’air fait bleuir peu à peu la poudre mal rangée. Poudre bleue : il y a de l’eau, pas forcément de l’eau pure.</li>
      <li><strong>Une flamme éteinte n’est pas un test</strong> du dioxyde de carbone (le diazote l’éteint aussi). Avec l’eau de chaux, on s’arrête au trouble. Les expériences sont imaginées pour la simulation, les dessins sont schématiques, et les tests du dihydrogène et du dioxygène se font avec le professeur, jamais seul.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search" />Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target" />Défis</button>
      <OngletExercices simId={SIM_ID} />
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const sceneGuide = (() => {
    switch (idE) {
      case 'un': return boite('Un test en trois temps', <SceneUnTest />, cadre('scene'));
      case 'eau': return boite('Le test de l’eau', <SchemaTest test="eau" etats={['avant', 'positif']} titre="Test de l’eau." />, cadre('scene'));
      case 'co2': return boite('Le test du dioxyde de carbone', <SchemaTest test="co2" etats={['avant']} titre="Test du dioxyde de carbone." />, cadre('scene'));
      case 'o2': return boite('Le test du dioxygène', <SchemaTest test="o2" etats={['avant']} titre="Test du dioxygène." />, cadre('scene'));
      case 'h2': return boite('Le test du dihydrogène (par le professeur)', <SchemaTest test="h2" etats={['avant']} titre="Test du dihydrogène." />, cadre('scene'));
      case 'associer': return boite('Une observation pour chaque espèce', <SceneAssocier choix={assoc} setChoix={setAssoc} ordre={ORDRE_ASSOCIER} />, cadre('scene'));
      case 'lire': return boite('Résultats des tests', <TableauResultats />, cadre('scene'));
      case 'arbre': return boite('L’arbre de décision', <SceneArbre rep={arbre} setRep={setArbre} />, cadre('scene'));
      case 'negatif': return boite('Une braise dans l’air', <SceneNegatif />, cadre('scene'));
      case 'flamme': return boite('Une allumette dans un tube', <SceneFlamme />, cadre('scene'));
      case 'melange': return boite('Une bougie sous un flacon', <SceneBougie />, cadre('scene'));
      case 'bilan': return boite('Les quatre tests', <SceneBilan />, cadre('scene'));
      default: return null;
    }
  })();

  // ════════════════ EXPLORATION ════════════════
  const ouvrir = k => setEx(s => ({ ...s, ouv: { ...s.ouv, [k]: !s.ouv[k] } }));
  const src = M.source(ex.src), cible = M.TESTS[ex.test];
  const faireEssai = () => {
    const r = M.essai(ex.src, ex.test);
    setEx(s => ({ ...s, dernier: { src: s.src, test: s.test }, essais: r.applicable ? { ...s.essais, [s.src]: { ...(s.essais[s.src] || {}), [s.test]: r.positif } } : s.essais }));
  };
  const rEx = ex.dernier ? M.essai(ex.dernier.src, ex.dernier.test) : null, sEx = ex.dernier ? M.source(ex.dernier.src) : null;
  const reglagesEx = (<>
    <label style={etiquette}>Situation
      <select value={ex.src} onChange={x => setEx(s => ({ ...s, src: x.target.value }))} style={sel}>
        <optgroup label="Un gaz à tester">{M.SOURCES.filter(s => s.type === 'gaz').map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}</optgroup>
        <optgroup label="Un liquide à tester">{M.SOURCES.filter(s => s.type === 'liquide').map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}</optgroup>
      </select></label>
    <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 8, lineHeight: 1.5 }}>{src.fait}</div>
    <label style={etiquette}>Test à appliquer
      <select value={ex.test} onChange={x => setEx(s => ({ ...s, test: x.target.value }))} style={sel}>
        {M.ORDRE_TESTS.map(t => <option key={t} value={t}>{M.TESTS[t].nom} : {M.TESTS[t].reactif}</option>)}</select></label>
    <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 8, lineHeight: 1.5 }}>Geste : {cible.geste}. Observation attendue : {cible.attendu}.</div>
    <button onClick={faireEssai} style={styleBouton(true, '#0369a1')}><Pic n="search" />Faire le test</button>
  </>);
  const scEx = rEx && (
    <div className="tc-in" key={`${ex.dernier.src}${ex.dernier.test}`} style={{ marginTop: 10 }}>
      {rEx.applicable
        ? <SchemaTest test={ex.dernier.test} etats={['avant', rEx.positif ? 'positif' : 'negatif']} titre={`${M.TESTS[ex.dernier.test].nom} sur : ${sEx.nom}.`} />
        : <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>{rEx.texte}</div>}
      {rEx.applicable && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14.5, lineHeight: 1.55, color: KIT.txt }}>
        <div><strong>Observation :</strong> {rEx.texte}.</div>
        <div style={{ fontWeight: 700, color: rEx.positif ? COL.vert : COL.rouge }}>{rEx.conclusion}</div>
        {rEx.nuance && <div style={{ color: COL.orange, fontWeight: 600 }}>{rEx.nuance}</div>}
      </div>}
    </div>);
  const lignesTab = M.SOURCES.filter(s => ex.essais[s.id]);
  const marque = v => (v === undefined ? '' : v ? '✓' : '✗');
  const tableau = (
    <div style={{ overflowX: 'auto' }}>
      {lignesTab.length === 0 ? <div style={{ fontSize: 14, color: KIT.txt2 }}>Faites un test : le résultat s’ajoute ici. ✓ : test positif, ✗ : test négatif, case vide : test pas encore fait.</div> : (
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13.5, background: 'white' }}>
          <thead><tr><th style={{ border: `1px solid ${KIT.bord}`, padding: '4px 6px', textAlign: 'left', background: '#eff6ff' }}>Situation</th>
            {M.ORDRE_TESTS.map(t => <th key={t} style={{ border: `1px solid ${KIT.bord}`, padding: '4px 4px', background: '#eff6ff' }}>{M.TESTS[t].court}</th>)}</tr></thead>
          <tbody>{lignesTab.map(s => (
            <tr key={s.id}><td style={{ border: `1px solid ${KIT.bord}`, padding: '4px 6px', fontWeight: 600 }}>{s.court}</td>
              {M.ORDRE_TESTS.map(t => { const v = ex.essais[s.id][t]; return <td key={t} style={{ border: `1px solid ${KIT.bord}`, padding: '4px 4px', textAlign: 'center', fontWeight: 800, color: v ? COL.vert : COL.rouge }}>{marque(v)}</td>; })}</tr>))}
          </tbody></table>)}
    </div>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Pour « Acide + zinc », essayez les quatre tests. Un seul est positif : lequel ?</li>
      <li>Pour « Bougie qui brûle », combien de tests sont positifs ? Que peut-on en conclure ?</li>
      <li>Pour « Air d’un flacon », essayez le test du dioxygène. Il est négatif : l’air contient pourtant du dioxygène. Pourquoi ?</li>
      <li>Comparez l’éthanol absolu et l’éthanol à 96&nbsp;% avec le test de l’eau. Que peut-on dire de l’éthanol à 96&nbsp;% ?</li>
      <li>Pour « Diazote », faites tous les tests : que remarquez-vous ? Comment reconnaître ce gaz ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>un test = un réactif + une observation ; positif quand l’observation attendue a lieu</li>
        <li>eau : poudre blanche qui bleuit ; CO₂ : eau de chaux qui se trouble ; O₂ : braise qui se rallume ; H₂ : « pop » à la flamme</li>
        <li>un test négatif ne prouve pas à lui seul l’absence de l’espèce</li>
        <li>une flamme qui s’éteint n’est pas un test du CO₂ ; plusieurs tests positifs : un mélange</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .tc-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .tc-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        @media (min-width: 901px) { .tc-l1.cote .tc-carte { order: 2; } .tc-l1.cote .tc-main { order: 1; } }
        @media (max-width: 900px) { .tc-l1.cote { grid-template-columns: minmax(0, 1fr); } .tc-l1.cote .tc-main { order: 1; } .tc-l1.cote .tc-carte { order: 2; } .tc-hypo-defi { order: 2; } }
        @media (prefers-reduced-motion: no-preference) { .tc-in { animation: tc-fondu 0.35s ease-out; } @keyframes tc-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Tests chimiques : eau, dihydrogène, dioxygène, dioxyde de carbone</h2>
        <BoutonsModes mode={mode} setMode={changerMode} />
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un <strong>test chimique</strong> met un <strong>réactif</strong> au contact d’un échantillon et cherche une <strong>observation</strong> précise : elle permet de reconnaître une espèce chimique. Quatre tests courants, et la prudence qu’il faut pour les lire.</div>
      {enExplore ? <>
        <div style={{ ...styleBoite, marginBottom: 12 }}>{reglagesEx}{scEx}</div>
        <Section titre={`Tableau récapitulatif (${lignesTab.length} situation${lignesTab.length > 1 ? 's' : ''})`} ouvert={ex.ouv.tableau ?? lignesTab.length > 0} onBascule={() => ouvrir('tableau')}>{tableau}</Section>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`tc-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="tc-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours} /></div> : enDefi ? <div className="tc-carte tc-hypo-defi">{panneauHypo}</div> : null}
          <div className="tc-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'gaz' ? suiviG : suiviO} /></div>}
            {enGuide && <div className="tc-in" key={idE}>{sceneGuide}</div>}
          </div>
        </div>
        {enGuide && etape >= IDS.indexOf('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
