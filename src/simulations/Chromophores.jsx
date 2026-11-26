import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi, Formule } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./chromoModele";
import { QCM } from "./chromoQcm";
import { SceneCuveSpectre, SvgCarteCouleur, SvgCarteConjugaison, SvgCarteEffets } from "./ChromoSchemas";
import { FormulesMolecules, FormulePolyene } from "./ChromoFormules";
import { useTiragesUV } from "./chromoTiragesHook";
import { useProgres } from "./frxTiragesHook";
import { reduitMouvement } from "./hookHorloge";
import { evenementDemo, legendePhase, scenarioVisible, scenario as scenarioDe, texteEvenement, absorbanceCase, absorbanceEstimee, indice as indiceT, domaine, energieEV } from "./chromoTirages";
import { SceneCuveUV, SceneSpectreTirUV, PanneauScenariosUV, CommandesTiragesUV } from "./ChromoTirages";

const SIM_ID = 303, CLE_GUIDE = 'chromo-guide-v1';
declarerDefis(SIM_ID, [['couleur', 'Couleur d’une solution'], ['effet', 'Nommer l’effet']]);

// ====================================================
//  SIM 303 — UV-VISIBLE : COULEUR, CONJUGAISON ET AUXOCHROMES (BTS MDC, Analyse)
//  Capacités visées (jamais affichées à l'élève) : relier la couleur d'une espèce à la longueur d'onde du maximum d'absorption (λmax) ;
//  relier λmax à la conjugaison (chromophores) ; nommer les effets bathochrome, hypsochrome, hyperchrome et hypochrome, dont ceux des auxochromes.
//  Modèle : chromoModele.js. Schémas : ChromoSchemas.jsx. Distincte de la 11 et de la 169 (dosage) et de la 299 (synthèse des couleurs).
// ====================================================

const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const NB = '\u00a0';
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const ORDRE = ['couleur', 'absorbance', 'incolore', 'conjugaison', 'decalage', 'colore', 'bathochrome', 'hypsochrome', 'hypochrome', 'auxochrome', 'bilan'];
const BASE = { lam: 600, n: 2 };
const DEPART = { couleur: { lam: 600 }, conjugaison: { n: 2 }, colore: { n: 3 } };
const nomMol = id => M.MOLS[id].nom;
const bande = (id, ref = false) => ({ lam: M.MOLS[id].lam, eps: M.MOLS[id].eps, ref });
const bandePoly = (n, ref = false) => ({ lam: M.lamPolyene(n), eps: M.epsPolyene(n), ref });
const polyNom = n => M.NOMS_POLYENE[n] ?? `polyène à ${n} C=C conjuguées`;
const FA = <Formule><mi>A</mi><mo>=</mo><mi>ε</mi><mo>·</mo><mi>l</mi><mo>·</mo><mi>c</mi></Formule>;
const COMPARAISONS = { bathochrome: ['nitrophenol', 'nitrophenolate'], hypsochrome: ['aniline', 'anilinium'], hypochrome: ['transstil', 'cisstil'], auxochrome: ['benzene', 'phenol'] };

export function SimulationChromophores() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const idDe = g => ORDRE[Math.min(g.etape ?? 0, ORDRE.length - 1)];
  const [vie, setVie] = useState(() => ({ ...BASE, ...(DEPART[idDe(guide)] ?? {}) }));
  const [ex, setEx] = useState({ onglet: 'bande', sous: 'schema', lam: 450, n: 6, mol: 'nitrophenolate', ref: 'nitrophenol', comparer: false });
  const [ouv, setOuv] = useState({});
  const tir = useTiragesUV(ex.lam);
  const demoEv = tir.demo ? evenementDemo(tir.demo.sc, tir.params) : null;
  const progAuto = useProgres(tir.demo ? 1000000 + tir.demo.cle : tir.etat.nEnv * 1000 + tir.rejeu % 1000, tir.demo ? tir.dureeDemo : tir.dureeAnim, tir.demo ? !reduitMouvement() : tir.anime);
  const progT = tir.manuel ?? progAuto, lotT = !demoEv && tir.etat.lot > 1;
  const dAff = demoEv ?? (lotT ? null : tir.etat.dernier), pAff = lotT ? 1 : progT;
  const tirOn = ex.onglet === 'bande' && ex.sous === 'tirages';
  const [suiviC, noterC] = useCompteurDefi(), [suiviE, noterE] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('couleur');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  // ---------- parcours ----------
  const ETAPES = [
    { id: 'couleur', titre: 'Couleur absorbée, couleur perçue', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Une solution colorée <strong>absorbe</strong> une partie de la lumière blanche : l’œil perçoit ce qui reste. Le spectre montre la bande d’absorption ; son maximum est à la longueur d’onde <strong>λmax</strong>. Déplacez le curseur et regardez la couleur de la solution dans la cuve.</>,
      tache: { type: 'qcm', q: 'Une solution absorbe surtout vers 450 nm (bleu). Elle paraît…', ...QCM.couleur,
        expl: 'La lumière bleue est retirée de la lumière blanche : il reste du jaune et de l’orange. La couleur perçue est la complémentaire de la couleur absorbée.', indice: 'Placez le curseur à 450 nm et regardez la cuve.' } },
    { id: 'absorbance', titre: 'L’intensité de la bande : ε', retenirTitre: 'À retenir : absorbée → perçue', retenir: <SvgCarteCouleur/>, focus: ['scene', 'mesures'],
      texte: <>La hauteur de la bande est le <strong>coefficient d’absorption molaire ε</strong> (en L·mol⁻¹·cm⁻¹). Pour une solution de l’ion 4-nitrophénolate, ε = 18{NB}000{NB}L·mol⁻¹·cm⁻¹ au maximum (400{NB}nm). La loi de Beer-Lambert donne {FA} avec l la longueur de cuve et c la concentration. Cuve de l = 2,0{NB}cm, c = 2,5·10⁻⁵{NB}mol/L.</>,
      tache: { type: 'num', q: 'Absorbance A au maximum de la bande', unite: '', vrai: 0.9, tol: 0.05, affiche: v => fr(v, 2), cs: 2,
        calcul: () => ['A = ε · l · c = 18 000 × 2,0 × 2,5·10⁻⁵ = 0,90.', 'Hypothèse : Beer-Lambert (solution diluée, lumière monochromatique, A < 1 à 2). A n’a pas d’unité.'],
        pieges: [[0.45, 'Vous avez oublié la longueur de cuve l = 2,0 cm.'], [90000, 'Il y a une erreur de puissance de 10 sur c : 2,5·10⁻⁵ mol/L.'], [1.8e-3, 'Il y a une erreur de puissance de 10 sur ε ou c : vérifiez les exposants.']],
        expl: 'A = ε·l·c = 18 000 × 2,0 × 2,5·10⁻⁵ = 0,90.', indice: 'Multipliez ε, la longueur de cuve et la concentration.' } },
    { id: 'incolore', titre: 'Pourquoi certaines solutions sont incolores', focus: ['scene'],
      texte: <>Le buta-1,3-diène (2 liaisons C=C conjuguées) a un maximum d’absorption à 217{NB}nm. Regardez la position de la bande par rapport à la zone du visible (380 à 780{NB}nm) et la couleur de la solution.</>,
      tache: { type: 'qcm', q: 'Le buta-1,3-diène est incolore car…', ...QCM.incolore,
        expl: 'Une espèce incolore n’absorbe que dans l’UV : sa bande est entièrement en dessous de 380 nm et tout le visible est transmis.', indice: 'Comparez 217 nm et la limite du visible (380 nm).' } },
    { id: 'conjugaison', titre: 'Conjuguer pour absorber plus loin', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Un <strong>chromophore</strong> est un groupe d’atomes responsable de l’absorption. Dans un polyène, les doubles liaisons C=C <strong>conjuguées</strong> (alternées avec des simples) forment un seul système d’électrons délocalisés. Faites varier le nombre n de C=C conjuguées.</>,
      tache: { type: 'qcm', q: 'Quand n augmente, λmax…', ...QCM.conjugaison,
        expl: 'Plus le système conjugué est long, plus il est facile d’exciter ses électrons : l’énergie nécessaire baisse, donc λmax augmente.', indice: 'Déplacez le curseur de n = 1 à n = 11 et lisez λmax.' } },
    { id: 'decalage', titre: 'Combien de nm par liaison ajoutée ?', focus: ['scene'],
      texte: <>Du buta-1,3-diène (n = 2, λmax = 217{NB}nm) au dodécahexaène (n = 6, λmax = 364{NB}nm), on ajoute 4 doubles liaisons conjuguées. Le spectre en tirets est celui de n = 2.</>,
      tache: { type: 'num', q: 'Décalage moyen de λmax par double liaison ajoutée', unite: 'nm', vrai: 36.75, tol: 0.05, affiche: v => fr(v, 1), cs: 3,
        calcul: () => ['Décalage total : 364 − 217 = 147 nm.', 'Liaisons ajoutées : 6 − 2 = 4, donc 147 / 4 ≈ 36,8 nm par C=C.', 'Hypothèse : valeur moyenne ; le décalage diminue peu à peu quand n grandit.'],
        pieges: [[24.5, 'Vous avez divisé par 6 : de n = 2 à n = 6, on ajoute 4 doubles liaisons.'], [29.4, 'Vous avez divisé par 5 : de n = 2 à n = 6, on ajoute 4 doubles liaisons.'], [147, 'C’est le décalage total : divisez-le par le nombre de liaisons ajoutées.']],
        expl: '(364 − 217) / (6 − 2) = 147 / 4 ≈ 36,8 nm par double liaison ajoutée.', indice: 'Décalage total divisé par le nombre de liaisons ajoutées.' } },
    { id: 'colore', titre: 'À partir de quand est-ce coloré ?', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Pour qu’une espèce soit colorée, sa bande doit atteindre le visible (λmax proche ou supérieur à 380{NB}nm). Déplacez le curseur de n et observez la cuve.</>,
      tache: { type: 'qcm', q: 'Parmi ces polyènes, lequel est coloré ?', ...QCM.colore,
        expl: 'Le β-carotène (11 C=C conjuguées, λmax ≈ 450 nm) absorbe le bleu : il paraît jaune-orangé. Les polyènes plus courts absorbent dans l’UV.', indice: 'Placez le curseur sur n = 2, 3 puis 11 et regardez la cuve.' } },
    { id: 'bathochrome', titre: 'Le 4-nitrophénol et son ion', retenirTitre: 'À retenir : conjugaison et couleur', retenir: <SvgCarteConjugaison/>, focus: ['scene', 'mesures'],
      texte: <>En milieu basique, le 4-nitrophénol perd un H⁺ et devient l’ion 4-nitrophénolate. Le spectre en tirets est celui du 4-nitrophénol (317{NB}nm, solution quasi incolore) ; le trait plein celui de l’ion (400{NB}nm, solution jaune).</>,
      tache: { type: 'qcm', q: 'Le déplacement de la bande de 317 nm à 400 nm est un effet…', ...QCM.bathochrome,
        expl: 'Un déplacement de λmax vers les grandes longueurs d’onde est un effet bathochrome ; vers les petites, hypsochrome.', indice: '400 nm est plus grand que 317 nm.' } },
    { id: 'hypsochrome', titre: 'L’aniline et l’ion anilinium', focus: ['scene', 'mesures'],
      texte: <>L’aniline porte un groupe –NH₂ dont l’azote a un doublet non liant, qui participe à la conjugaison du noyau. En milieu acide, l’azote capte H⁺ (ion anilinium) et son doublet n’est plus disponible. Tirets : aniline ; trait plein : ion anilinium.</>,
      tache: { type: 'qcm', q: 'La bande passe de 280 nm à 254 nm : c’est un effet…', ...QCM.hypsochrome,
        expl: 'La bande se décale vers les petites longueurs d’onde : effet hypsochrome. Le doublet n’étant plus conjugué, le spectre redevient celui du benzène.', indice: '254 nm est plus petit que 280 nm.' } },
    { id: 'hypochrome', titre: 'Le cis- et le trans-stilbène', focus: ['scene', 'mesures'],
      texte: <>Dans le cis-stilbène, la gêne entre les deux noyaux fait sortir la molécule de son plan : la conjugaison est moins efficace. Tirets : trans-stilbène (ε = 28{NB}000) ; trait plein : cis-stilbène (ε = 10{NB}500).</>,
      tache: { type: 'qcm', q: 'La hauteur de la bande est divisée par environ 2,7 : c’est un effet…', ...QCM.hypochrome,
        expl: 'Quand ε diminue, l’effet est hypochrome ; quand il augmente, hyperchrome. Ici la bande est aussi un peu décalée vers l’UV.', indice: 'Comparez les hauteurs de bande : ε diminue.' } },
    { id: 'auxochrome', titre: 'Les auxochromes', focus: ['scene', 'mesures'],
      texte: <>Un <strong>auxochrome</strong> est un groupe lié à un chromophore (–OH, –NH₂, –OR…) dont le doublet non liant se conjugue avec lui. Tirets : benzène (255{NB}nm, ε = 200) ; trait plein : phénol (270{NB}nm, ε = 1{NB}500).</>,
      tache: { type: 'qcm', q: 'Pour un auxochrome comme –OH, l’effet habituel sur la bande du chromophore est…', ...QCM.auxochrome,
        expl: 'Le doublet de l’oxygène étend la conjugaison : λmax augmente (bathochrome) et ε aussi (hyperchrome). Un auxochrome peut aussi décaler vers l’UV (cas de l’anilinium).', indice: 'Comparez 255 nm et 270 nm, puis ε = 200 et ε = 1 500.' } },
    { id: 'bilan', titre: 'Le bilan : de la structure à la couleur', retenirTitre: 'À retenir : les quatre effets', retenir: <SvgCarteEffets/>, focus: [],
      texte: <>Vous savez relier la couleur d’une solution à la bande absorbée, expliquer pourquoi la conjugaison déplace λmax vers le visible, et nommer les effets bathochrome, hypsochrome, hyperchrome et hypochrome. En exploration, comparez des polyènes et des molécules ; les défis testent la couleur perçue et le nom de l’effet. Pour la suite : l’appareil, la cuve et le blanc.</> },
  ];
  const etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? ORDRE[etape] : null;
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const setEtatGuide = v => {
    const nv = typeof v === 'function' ? v(guide) : v;
    const ni = Math.min(nv.etape, ORDRE.length - 1);
    if (ni !== Math.min(guide.etape, ORDRE.length - 1)) setVie(() => ({ ...BASE, ...(DEPART[ORDRE[ni]] ?? {}) }));
    setGuide(nv);
  };
  const sc = idE;
  const sceneGuide = !enGuide ? null
    : sc === 'couleur' ? <SceneCuveSpectre bandes={[{ lam: vie.lam, eps: 10000 }]} css={M.cssSolution(vie.lam)}/>
    : sc === 'absorbance' ? <SceneCuveSpectre bandes={[bande('nitrophenolate')]} marque={400}/>
    : sc === 'incolore' ? <SceneCuveSpectre bandes={[bandePoly(2)]} css={M.cssSolution(217)}/>
    : sc === 'conjugaison' ? <SceneCuveSpectre bandes={[bandePoly(vie.n)]} css={M.cssSolution(M.lamPolyene(vie.n))} ymax={160000}/>
    : sc === 'decalage' ? <SceneCuveSpectre bandes={[bandePoly(2, true), bandePoly(6)]} ymax={90000}/>
    : sc === 'colore' ? <SceneCuveSpectre bandes={[bandePoly(vie.n)]} css={M.cssSolution(M.lamPolyene(vie.n))} ymax={160000}/>
    : COMPARAISONS[sc] ? <SceneCuveSpectre bandes={[bande(COMPARAISONS[sc][0], true), bande(COMPARAISONS[sc][1])]} css={M.cssSolution(M.MOLS[COMPARAISONS[sc][1]].lam)}/>
    : null;
  const MES_GUIDE = {
    couleur: [['λmax de la bande', `${vie.lam}${NB}nm`], ['Couleur de la lumière absorbée', M.couleurAbsorbee(vie.lam)]],
    absorbance: [['λmax', `400${NB}nm`], ['ε au maximum', `18${NB}000${NB}L·mol⁻¹·cm⁻¹`]],
    conjugaison: [['Nombre n de C=C conjuguées', String(vie.n)], ['λmax', `${Math.round(M.lamPolyene(vie.n))}${NB}nm`]],
    colore: [['Nombre n de C=C conjuguées', String(vie.n)], ['λmax', `${Math.round(M.lamPolyene(vie.n))}${NB}nm`]],
  };
  for (const k of Object.keys(COMPARAISONS)) { const [a, b] = COMPARAISONS[k]; MES_GUIDE[k] = [[`${nomMol(a)} (tirets)`, `λmax ${M.MOLS[a].lam}${NB}nm ; ε ${M.MOLS[a].eps}`], [`${nomMol(b)} (trait plein)`, `λmax ${M.MOLS[b].lam}${NB}nm ; ε ${M.MOLS[b].eps}`]]; }
  const lignesGuide = enGuide ? (MES_GUIDE[sc] ?? []) : [];
  const curs = (id, lab_, val, min, max, step, onCh, aide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab_}</label>
    <input id={id} type="range" min={min} max={max} step={step} value={val} onChange={onCh} aria-label={lab_} style={{ width: '100%', accentColor: '#7c3aed' }}/>
    {aide && <div style={{ fontSize: 13, color: KIT.txt2 }}>{aide}</div>}</div>);
  const selecteur = (id, lab_, val, onCh, options, vide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab_}</label>
    <select id={id} value={val} onChange={onCh} style={selectStyle}>{vide && <option value="">{vide}</option>}{options.map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}</select></div>);
  const curseurGuide = enGuide && sc === 'couleur' ? <div style={{ ...styleBoite, ...cadre('curseur') }}>{curs('ch-lam', `λmax de la bande : ${vie.lam} nm`, vie.lam, 400, 700, 5, ev => setVie(v => ({ ...v, lam: parseInt(ev.target.value, 10) })), 'La bande se déplace dans le visible ; la cuve prend la couleur transmise.')}</div>
    : enGuide && (sc === 'conjugaison' || sc === 'colore') ? <div style={{ ...styleBoite, ...cadre('curseur') }}>{curs('ch-n', `Nombre de C=C conjuguées : n = ${vie.n}`, vie.n, 1, 11, 1, ev => setVie(v => ({ ...v, n: parseInt(ev.target.value, 10) })), 'De l’éthène (n = 1) au β-carotène (n = 11).')}</div> : null;
  const mesuresGuide = enGuide && lignesGuide.length > 0 && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {lignesGuide.map(([n, v]) => <LigneMesure key={n} nom={n} valeur={v}/>)}
    </div>);
  const sceneBloc = sceneGuide && <div style={{ ...styleBoite, ...cadre('scene') }}>{sceneGuide}</div>;

  // ---------- défis ----------
  const nouveauDefi = kind => setDefi(kind === 'couleur' ? { ...M.tirageDefiCouleur(Math.random), rep1: '', verifie: false } : { ...M.tirageDefiEffet(Math.random), rep1: '', rep2: '', verifie: false });
  const changerMode = md => { if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const maj = f => setDefi(x => ({ ...x, ...f, verifie: false }));
  const verifier = () => {
    let ok;
    if (defi.kind === 'couleur') { ok = defi.rep1 === defi.vue; noterC(ok); }
    else { ok = defi.rep1 === defi.dl && defi.rep2 === defi.de; noterE(ok); }
    setDefi(x => ({ ...x, verifie: true, ok }));
  };
  const optsCouleur = M.COULEURS_VUES.map(c => ({ id: c, nom: c }));
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['couleur', 'Couleur d’une solution'], ['effet', 'Nommer l’effet']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.kind === tp} style={stylePetitBouton(defi.kind === tp, '#7c3aed')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.kind === 'couleur' ? 'Défi : la couleur d’une solution' : 'Défi : nommer l’effet'}</div>
      {defi.kind === 'couleur' ? <>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>Le spectre ci-dessous est celui d’une solution dont la bande d’absorption est centrée sur <strong>λmax = {defi.lam}{NB}nm</strong>. De quelle couleur paraît-elle ?</div>
        <SceneCuveSpectre bandes={[{ lam: defi.lam, eps: 10000 }]}/>
        {selecteur('ch-d1', 'Couleur perçue', defi.rep1, ev => maj({ rep1: ev.target.value }), optsCouleur, 'Choisir…')}</>
      : <>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>On passe de <strong>{defi.a.nom}</strong> (λmax = {defi.a.lam}{NB}nm, ε = {defi.a.eps}) à <strong>{defi.b.nom}</strong> (λmax = {defi.b.lam}{NB}nm, ε = {defi.b.eps}). Nommez les deux effets.</div>
        <SceneCuveSpectre bandes={[{ lam: defi.a.lam, eps: defi.a.eps, ref: true }, { lam: defi.b.lam, eps: defi.b.eps }]}/>
        {selecteur('ch-d2', 'Déplacement de la bande', defi.rep1, ev => maj({ rep1: ev.target.value }), [{ id: 'bathochrome', nom: 'bathochrome' }, { id: 'hypsochrome', nom: 'hypsochrome' }, { id: 'aucun', nom: 'aucun déplacement net' }], 'Choisir…')}
        {selecteur('ch-d3', 'Intensité de la bande', defi.rep2, ev => maj({ rep2: ev.target.value }), [{ id: 'hyperchrome', nom: 'hyperchrome' }, { id: 'hypochrome', nom: 'hypochrome' }, { id: 'aucun', nom: 'aucune variation nette' }], 'Choisir…')}</>}
      <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>{defi.kind === 'couleur'
        ? <>La couleur perçue est la complémentaire de la couleur absorbée : bleu → jaune, vert → pourpre, jaune → bleu, rouge et orange → bleu-vert, violet → jaune-vert.</>
        : <>Bathochrome : λmax augmente ; hypsochrome : λmax diminue ; hyperchrome : ε augmente ; hypochrome : ε diminue.</>}</IndiceDefi></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.kind)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}
        {defi.kind === 'couleur' ? <>Réponse : la lumière {defi.abs} est absorbée ; la solution paraît {defi.vue}.</> : <>Réponse : {defi.dl}{defi.de !== 'aucun' ? ` et ${defi.de}` : ''}.</>}
      </div>}
    </div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#7c3aed')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const A_ = M.MOLS[ex.mol], R_ = M.MOLS[ex.ref];
  const lamEx = ex.onglet === 'bande' ? ex.lam : ex.onglet === 'polyene' ? M.lamPolyene(ex.n) : A_.lam;
  const reglagesExplore = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{ex.onglet === 'bande' ? (tirOn ? 'Réglez la solution et la lampe' : 'Déplacez la bande') : ex.onglet === 'polyene' ? 'Allongez la conjugaison' : 'Choisissez une molécule'}</div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>{ex.onglet === 'bande' && tirOn ? 'Chaque photon traverse la solution ou y est absorbé, au hasard : la probabilité d’être absorbé est 1 − 10^(−A). Le spectre se trace en comptant les photons transmis.'
        : ex.onglet === 'bande' ? 'Placez le maximum d’absorption où vous voulez : la cuve prend la couleur de la lumière transmise.'
        : ex.onglet === 'polyene' ? 'Un polyène a n doubles liaisons C=C conjuguées : λmax et ε grandissent avec n.'
        : 'Spectres schématiques à partir des λmax et ε usuels. Comparez avec une molécule de référence (tirets).'}</div>
      {ex.onglet === 'bande' && curs('ch-el', `λmax : ${ex.lam} nm`, ex.lam, 250, 750, 5, ev => setEx(e => ({ ...e, lam: parseInt(ev.target.value, 10) })), 'En dessous de 380 nm, la bande est dans l’UV.')}
      {tirOn && <>
        {selecteur('ch-ta', 'Absorbance au maximum (concentration)', String(tir.t.amax), ev => tir.regler({ amax: parseFloat(ev.target.value) }), [{ id: '0.3', nom: 'A = 0,3 (solution diluée)' }, { id: '1', nom: 'A = 1 (valeur usuelle)' }, { id: '2', nom: 'A = 2 (solution concentrée)' }])}
        {selecteur('ch-tm', 'Longueur d’onde des photons', tir.t.mode, ev => tir.regler({ mode: ev.target.value }), [{ id: 'hasard', nom: 'Tirée au hasard entre 200 et 800 nm' }, { id: 'choisi', nom: 'Choisie par vous' }])}
        {tir.t.mode === 'choisi' && curs('ch-tl', `λ des photons : ${tir.t.lamChoisi} nm`, tir.t.lamChoisi, 200, 800, 5, ev => tir.regler({ lamChoisi: parseInt(ev.target.value, 10) }), 'Placez λ sur le maximum de la bande pour voir presque tous les photons absorbés, loin de la bande pour les voir traverser.')}
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, fontSize: 14, color: KIT.txt }}><input type="checkbox" checked={tir.t.courbe} onChange={ev => tir.regler({ courbe: ev.target.checked })} style={{ width: 20, height: 20 }}/>Afficher le spectre attendu (pointillés)</label></>}
      {ex.onglet === 'polyene' && curs('ch-en', `n = ${ex.n} C=C conjuguées`, ex.n, 1, 11, 1, ev => setEx(e => ({ ...e, n: parseInt(ev.target.value, 10) })), 'Valeurs de référence pour n = 1 à 6 et n = 11 ; entre les deux, interpolation.')}
      {ex.onglet === 'molecule' && <>
        {selecteur('ch-em', 'Molécule', ex.mol, ev => setEx(e => ({ ...e, mol: ev.target.value })), Object.values(M.MOLS).map(m => ({ id: m.id, nom: m.nom })))}
        {selecteur('ch-er', 'Référence (tirets)', ex.comparer ? ex.ref : '', ev => setEx(e => ({ ...e, comparer: !!ev.target.value, ref: ev.target.value || e.ref })), Object.values(M.MOLS).map(m => ({ id: m.id, nom: m.nom })), 'Aucune')}</>}
    </div>);
  const pilules = (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
      {[['bande', 'Une bande'], ['polyene', 'Polyènes'], ['molecule', 'Molécules']].map(([k, l]) => <button key={k} onClick={() => setEx(e => ({ ...e, onglet: k }))} aria-pressed={ex.onglet === k} style={stylePetitBouton(ex.onglet === k, '#7c3aed')}>{l}</button>)}
    </div>);
  const sousPilules = ex.onglet === 'bande' && (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
      <span style={{ fontSize: 13.5, color: KIT.txt2 }}>Afficher :</span>
      {[['schema', 'Spectre schématique'], ['tirages', 'Tirages au hasard']].map(([k, l]) => <button key={k} onClick={() => setEx(e => ({ ...e, sous: k }))} aria-pressed={ex.sous === k} style={stylePetitBouton(ex.sous === k, '#334155')}>{l}</button>)}
    </div>);
  const sceneTirages = (<>
    <div aria-hidden="true" style={{ fontSize: 14.5, fontWeight: 700, color: '#5b21b6', minHeight: 44, lineHeight: 1.4, marginBottom: 4 }}>{lotT ? 'Les photons défilent trop vite pour être animés un par un : voici le bilan du dernier paquet. « × 10 » et « × 100 » montrent chaque photon.' : (demoEv ? 'Scénario seul. ' : '') + legendePhase(dAff, pAff)}</div>
    <div className="ch-at">
      <SceneCuveUV d={dAff} p={pAff} css={M.cssSolution(ex.lam)}/>
      <PanneauScenariosUV etat={tir.etat} params={tir.params} courant={lotT ? -1 : scenarioVisible(dAff, pAff)} demo={tir.demo} prog={progT} tir={tir}/>
    </div>
    <div role="status" aria-live={tir.lecture ? 'off' : 'polite'} style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.5, margin: '4px 0 8px', minHeight: 42 }}>{lotT ? `Bilan du dernier paquet de ${tir.etat.lotRes.n} photons : ${tir.etat.lotRes.abs} absorbés, ${tir.etat.lotRes.n - tir.etat.lotRes.abs} transmis.` : `${dAff ? `Scénario ${scenarioDe(dAff) + 1} sur 2 : ` : ''}${texteEvenement(dAff)}.`}</div>
    <SceneSpectreTirUV etat={tir.etat} params={tir.params}/><div style={{ marginTop: 10 }}><CommandesTiragesUV tir={tir}/></div></>);
  const sceneEx = tirOn ? sceneTirages : ex.onglet === 'bande' ? <SceneCuveSpectre bandes={[{ lam: ex.lam, eps: 10000 }]} css={M.cssSolution(ex.lam)}/>
    : ex.onglet === 'polyene' ? <SceneCuveSpectre bandes={[bandePoly(ex.n)]} css={M.cssSolution(M.lamPolyene(ex.n))} ymax={160000}/>
    : <SceneCuveSpectre bandes={[...(ex.comparer ? [bande(ex.ref, true)] : []), bande(ex.mol)]} css={M.cssSolution(A_.lam)}/>;
  const NOMS_MOL = Object.fromEntries(Object.values(M.MOLS).map(m => [m.id, m.nom]));
  const formules = ex.onglet === 'molecule' ? <FormulesMolecules ids={ex.comparer ? [ex.ref, ex.mol] : [ex.mol]} noms={NOMS_MOL} reference={ex.comparer ? ex.ref : null}/>
    : ex.onglet === 'polyene' ? <FormulePolyene n={ex.n} nom={polyNom(ex.n)} note={ex.n === 11 ? ' Seule la chaîne conjuguée est dessinée (le β-carotène porte aussi des groupes méthyle et un cycle à chaque extrémité).' : ''}/> : null;
  const voletScene = (<div style={styleBoite}>{pilules}{sousPilules}{formules}{sceneEx}</div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="λmax" valeur={`${Math.round(lamEx)}${NB}nm`}/>
      {tirOn && <>
        <LigneMesure nom="Photons envoyés" valeur={`${tir.etat.nEnv}`}/><LigneMesure nom="Photons absorbés" valeur={`${tir.etat.nAbs}`}/>
        <LigneMesure nom="Photons transmis (comptés)" valeur={`${tir.etat.nEnv - tir.etat.nAbs}`}/>
        <LigneMesure nom="Transmis / envoyés (toutes λ)" valeur={tir.etat.nEnv ? `${fr(100 * (tir.etat.nEnv - tir.etat.nAbs) / tir.etat.nEnv, 0)}${NB}%` : '—'}/>
        {tir.t.mode === 'choisi' && (() => { const i = indiceT(tir.t.lamChoisi), n = tir.etat.env[i], a = absorbanceEstimee(tir.etat, i); return <>
          <LigneMesure nom={`Photons envoyés vers ${tir.t.lamChoisi}${NB}nm (case de 5)`} valeur={`${n}`}/>
          <LigneMesure nom="Absorbance mesurée −log(transmis/envoyés)" valeur={a == null ? '—' : fr(a, 2)}/>
          <LigneMesure nom="Absorbance du spectre schématique" valeur={fr(absorbanceCase(tir.params, i), 2)}/>
          <LigneMesure nom="Domaine et énergie du photon" valeur={`${domaine(tir.t.lamChoisi)}, ${fr(energieEV(tir.t.lamChoisi), 2)}${NB}eV`}/></>; })()}</>}
      {ex.onglet === 'polyene' && <><LigneMesure nom="Composé" valeur={polyNom(ex.n)}/><LigneMesure nom="ε au maximum" valeur={`${M.epsPolyene(ex.n)}${NB}L·mol⁻¹·cm⁻¹`}/></>}
      {ex.onglet === 'molecule' && <><LigneMesure nom="ε au maximum" valeur={`${A_.eps}${NB}L·mol⁻¹·cm⁻¹`}/>
        {ex.comparer && <><LigneMesure nom="Déplacement par rapport à la référence" valeur={`${M.effetLambda(R_.lam, A_.lam)} (${A_.lam - R_.lam >= 0 ? '+' : '−'}${Math.abs(A_.lam - R_.lam)}${NB}nm)`}/><LigneMesure nom="Intensité par rapport à la référence" valeur={`${M.effetEps(R_.eps, A_.eps)} (×${fr(A_.eps / R_.eps, 2)})`}/></>}</>}
      <LigneMesure nom="Couleur de la lumière absorbée" valeur={M.couleurAbsorbee(lamEx)}/>
      <LigneMesure nom="Couleur perçue de la solution" valeur={M.estIncolore(lamEx) ? 'incolore' : M.couleurPercue(lamEx)}/>
    </div>);
  const aEssayer = (
    <ul style={liste}>
      <li>Une bande : placez λmax à 450 puis à 530 nm. Quelle est la couleur de la solution dans chaque cas ?</li>
      <li>Une bande : à partir de quelle valeur de λmax la solution cesse-t-elle d’être incolore ?</li>
      <li>Tirages : envoyez 1000 photons. À quelle longueur d’onde l’absorbance mesurée est-elle maximale ? Comparez avec λmax.</li>
      <li>Tirages : passez de A = 0,3 à A = 2. Que change-t-on dans la proportion de photons absorbés au maximum ?</li>
      <li>Polyènes : pour quel n la cuve se colore-t-elle ? De quelle couleur ?</li>
      <li>Molécules : comparez le phénol et l’ion phénolate. Quels effets observez-vous ?</li>
      <li>Molécules : comparez l’aniline et l’ion anilinium ; que se passe-t-il quand on acidifie ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Couleur perçue = complémentaire de la couleur absorbée (bleu absorbé → jaune)</li>
        <li>Incolore : bande entièrement dans l’UV (λmax &lt; 380 nm environ)</li>
        <li>Plus de C=C conjuguées → λmax plus grand (≈ 37 nm par C=C de n = 2 à n = 6)</li>
        <li>Bathochrome : λmax ↑ ; hypsochrome : λmax ↓ ; hyperchrome : ε ↑ ; hypochrome : ε ↓</li>
        <li>Un auxochrome (–OH, –NH₂) conjugué au chromophore : bathochrome et hyperchrome en général</li>
        <li>A = ε·l·c</li>
      </ul>
    </ARetenir>);
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Bandes</strong> : gaussiennes, de largeur choisie pour l’illustration ; en vrai, les bandes ont des profils plus complexes (structure vibrationnelle, épaulements).</li>
      <li><strong>λmax et ε</strong> : valeurs arrondies d’ordre de grandeur pour des solvants usuels ; elles dépendent du solvant, du pH et de la température.</li>
      <li><strong>Polyènes</strong> : valeurs de référence pour n = 1 à 6 et n = 11 (β-carotène) ; entre n = 6 et n = 11, interpolation linéaire illustrative ; ε en loi empirique 10 000 + 12 000 (n − 1).</li>
      <li><strong>Couleur</strong> : calculée pour une solution dont l’absorbance au maximum vaut 1 (concentration ajustée), sous lumière blanche D65 ; la couleur perçue dépend aussi de l’œil et de l’éclairage.</li>
      <li><strong>Incolore</strong> : la bande ne déborde pas sur le visible (λmax + 2,5 σ &lt; 380 nm).</li>
      <li><strong>Tirages</strong> : chaque photon est absorbé avec la probabilité 1 − 10^(−A(λ)) (loi de Beer-Lambert), indépendamment des autres ; une seule absorption par photon, ni diffusion ni fluorescence, détecteur parfait. L’absorbance estimée −log(transmis / envoyés) fluctue d’autant plus que peu de photons sont envoyés (et vaut au plus 2,3 quand aucun photon n’est transmis). La couleur de la cuve est celle d’une solution d’absorbance 1 au maximum, quel que soit le réglage de concentration.</li>
      <li><strong>Hors modèle</strong> : transitions n → π* faibles, effets de solvant détaillés, fluorescence, équilibres acido-basiques en solution réelle.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ch-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ch-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ch-col { display: flex; flex-direction: column; gap: 12px; }
        .ch-at { display: grid; gap: 10px; align-items: start; grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .ch-at { grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); } }
        .ch-sc { transition: background 0.3s, transform 0.3s; } .ch-sc.on { transform: scale(1.02); font-weight: 600; }
        @media (prefers-reduced-motion: reduce) { .ch-sc { transition: none; } .ch-sc.on { transform: none; } }
        .ch-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .ch-l1.cote .ch-carte { order: 2; } .ch-l1.cote .ch-main { order: 1; }
          .ch-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .ch-ex > * { grid-column: 1; }
          .ch-ex > .ch-reg { grid-column: 2; grid-row: 1 / span 2; }
        }
        @media (max-width: 900px) { .ch-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .ch-in { animation: ch-fondu 0.35s ease-out; } @keyframes ch-fondu { from { opacity: 0; } to { opacity: 1; } } }
        @media (prefers-reduced-motion: reduce) { .ch-l1 *, .ch-ex * { transition: none !important; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>UV-visible : couleur, conjugaison et auxochromes</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une solution est colorée parce qu’elle <strong>absorbe</strong> une partie de la lumière visible : la couleur perçue est la <strong>complémentaire</strong> de la couleur absorbée. La longueur de la conjugaison et les groupes voisins (<strong>auxochromes</strong>) déplacent la bande d’absorption et changent son intensité.</div>
      {enGuide && <div className="ch-l1 cote">
        <div className="ch-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="ch-main">
          <div className="ch-col">
            {sceneBloc && <div className="ch-in">{sceneBloc}</div>}
            {curseurGuide && <div className="ch-in">{curseurGuide}</div>}
            {mesuresGuide && <div className="ch-in">{mesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.kind}`} etat={defi.kind === 'couleur' ? suiviC : suiviE}/></div>}
      {enExplore && <>
        <div className="ch-ex">
          {voletScene}
          <div className="ch-reg">{reglagesExplore}</div>
          {mesuresEx}
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
