import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./milieuxDispersesModele";
import { QCM } from "./milieuxDispersesQcm";
import { SvgMilieu, SvgTableau, SvgCarteProblemes } from "./MilieuxSchemas";

const SIM_ID = 237, CLE_GUIDE = 'milieux-disperses-guide-v1';
declarerDefis(SIM_ID, [['classer', 'Classer un produit du quotidien parmi les milieux dispersés'], ['diagnostic', 'Diagnostiquer un problème de stabilité et son origine']]);

// ====================================================
//  SIM 237 — MILIEUX DISPERSÉS : TYPES ET CAUSES D’INSTABILITÉ (BTS MDC, Formulation ; fil rouge : le chariot du formulateur, des produits du quotidien à classer)
//  Capacités visées (jamais affichées à l'élève) : distinguer les différents types de milieux dispersés ; identifier les problèmes liés à l'instabilité des milieux dispersés ;
//  identifier les causes d'instabilité (masse volumique, taille, viscosité, forces de van der Waals, liaison hydrogène).
//  Classification (pas de modèle physique) : milieuxDispersesModele.js. Schémas : MilieuxSchemas.jsx.
// ====================================================

const COL = { vert: '#15803d', violet: '#7c3aed', orange: '#b45309', rouge: '#b91c1c', bleu: '#1d4ed8' };
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const ETAT_OPT = M.ETATS;
const ETAT_A = M.ETATS.map(e => ({ id: e.id, nom: e.nom }));

export function SimulationMilieuxDisperses() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [vie, setVie] = useState({ disp: 'gaz', cont: 'liquide', prod: 'lait' });              // scène du parcours
  const [ex, setEx] = useState({ disp: 'liquide', cont: 'liquide' });                           // exploration
  const [ouv, setOuv] = useState({});
  const [suiviC, noterC] = useCompteurDefi(), [suiviD, noterD] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('classer');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const typeVie = M.typeDe(vie.disp, vie.cont), pVie = M.produit(vie.prod);

  // ---------- parcours ----------
  const ETAPES = [
    { id: 'phases', titre: 'Phase dispersée et phase continue', focus: ['scene'],
      texte: <>Un formulateur prépare des produits qui ne sont pas homogènes : ils contiennent de petits objets (gouttes, bulles, particules) répartis dans un autre milieu. On parle de <strong>milieu dispersé</strong>. Les petits objets forment la <strong>phase dispersée</strong> ; le milieu qui les entoure est la <strong>phase continue</strong>. Sur le chariot du formulateur, on commence par du lait : au microscope, on voit des gouttelettes de matière grasse entourées d’eau.</>,
      tache: { type: 'qcm', q: 'Dans le lait, quelle est la phase dispersée ?', ...QCM.phases,
        expl: 'La phase dispersée est formée des petits objets : ici les gouttelettes de matière grasse. L’eau qui les entoure est la phase continue.', indice: 'La phase dispersée est celle qui est en petits objets séparés ; la phase continue les entoure.' } },
    { id: 'tableau', titre: 'Les combinaisons possibles : gaz, liquide, solide', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Chaque phase peut être un <strong>gaz</strong>, un <strong>liquide</strong> ou un <strong>solide</strong> : cela donne des combinaisons, que l’on nomme selon l’état des deux phases. Une goutte de liquide dans un autre liquide : c’est une <strong>émulsion</strong>. Réglez la phase dispersée et la phase continue pour obtenir une émulsion et notez comment est dessinée la dispersion.</>,
      tache: { type: 'action', ok: typeVie === 'émulsion', consigne: 'Régler les deux phases pour obtenir une émulsion' } },
    { id: 'case-vide', titre: 'Une combinaison qui n’existe pas : gaz dans gaz', focus: ['scene'],
      texte: <>Sur les neuf combinaisons, une ne donne pas de milieu dispersé : celle d’un gaz dans un gaz, par exemple l’oxygène et l’azote de l’air.</>,
      tache: { type: 'qcm', q: 'Pourquoi un gaz dispersé dans un gaz ne forme-t-il pas un milieu dispersé ?', ...QCM.caseVide,
        expl: 'Les gaz se mélangent à l’échelle des molécules : on obtient une seule phase homogène, sans « petits objets » séparés. Il n’y a donc pas de phase dispersée.', indice: 'Pensez à l’air : peut-on y distinguer de l’oxygène d’un côté et de l’azote de l’autre ?' } },
    { id: 'suspension', titre: 'Des particules solides dans un liquide', focus: ['scene'],
      texte: <>Sur le chariot, un pot de <strong>peinture murale</strong> : des particules solides de pigment sont réparties dans de l’eau. Ce milieu s’appelle une <strong>suspension</strong> (solide dispersé dans un liquide). Boue et encre en sont d’autres exemples.</>,
      tache: { type: 'qcm', q: 'Quel type de milieu dispersé est une peinture murale (pigments solides dans l’eau) ?', ...QCM.suspension,
        expl: 'Des particules solides dispersées dans un liquide forment une suspension.', indice: 'Identifiez d’abord la phase dispersée (solide, liquide ou gaz), puis la phase continue.' } },
    { id: 'mousse-aerosol', titre: 'Du gaz dans un liquide, des gouttes dans un gaz', focus: ['scene'],
      texte: <>Un <strong>gaz dispersé dans un liquide</strong> forme une <strong>mousse</strong> (crème chantilly, mousse à raser). À l’inverse, des <strong>gouttelettes ou des particules solides dispersées dans un gaz</strong> forment un <strong>aérosol</strong> (brouillard, fumée). Il s’agit ici du sens physique du mot « aérosol », pas de la bombe de laque.</>,
      tache: { type: 'qcm', q: 'Laquelle de ces affirmations est correcte ?', ...QCM.mousseAerosol,
        expl: 'La chantilly est du gaz (air) dispersé dans un liquide : une mousse. Le brouillard est du liquide (eau) dispersé dans un gaz (air) : un aérosol.', indice: 'Cherchez à chaque fois quelle phase est dispersée et quelle phase est continue : l’air est-il en bulles ou autour ?' } },
    { id: 'solides', titre: 'Quand la phase continue est solide', focus: ['scene'],
      texte: <>Si la phase continue est <strong>solide</strong>, les objets dispersés restent figés : on parle de <strong>mousse solide</strong> (gaz dans un solide), d’<strong>émulsion solide</strong> (liquide dans un solide, comme le beurre où l’eau est piégée dans la matière grasse figée) et de <strong>dispersion solide</strong> (solide dans un solide, comme le noir de carbone dans le caoutchouc d’un pneu).</>,
      tache: { type: 'qcm', q: 'Le polystyrène expansé est formé de bulles d’air dans du polystyrène solide. Quel est ce milieu ?', ...QCM.solide,
        expl: 'Du gaz (air) dispersé dans un solide : c’est une mousse solide.', indice: 'Phase dispersée : l’air (gaz). Phase continue : le polystyrène (solide).' } },
    { id: 'colloides', titre: 'La taille des objets dispersés : colloïdes', focus: ['scene'],
      retenirTitre: 'À retenir : les types de milieux dispersés', retenir: <>
        <SvgTableau/>
        <ul style={puces}>
          <li>Une phase <strong>dispersée</strong> (petits objets) dans une phase <strong>continue</strong> ; gaz dans gaz : pas de milieu dispersé.</li>
          <li>Phase continue liquide : mousse, émulsion, suspension. Phase continue gazeuse : aérosol. Phase continue solide : mousse, émulsion ou dispersion <em>solide</em>.</li>
        </ul></>,
      texte: <>La taille des objets compte aussi. On parle de <strong>dispersion colloïdale</strong> quand les objets font, dans au moins une direction, environ <strong>1 nm à 1 µm</strong> (définition de l’IUPAC). Un <strong>latex</strong> (de peinture par exemple) est formé de billes de polymère de l’ordre de 250 nm de diamètre (valeur illustrative) dispersées dans l’eau. Plus les objets sont petits, plus l’agitation thermique les maintient dispersés.</>,
      tache: { type: 'num', q: 'Diamètre d’une bille de latex de 250 nm, exprimé en micromètres', unite: 'µm', vrai: 0.25, tol: 0.02, affiche: v => fr(v, 2), cs: 2,
        calcul: () => ['1 µm = 1000 nm, donc 1 nm = 10⁻³ µm.', '250 nm = 250 × 10⁻³ µm = 0,25 µm.', 'Cette valeur est comprise entre 1 nm et 1 µm : la dispersion est colloïdale.'],
        pieges: [[250, 'Vous n’avez pas converti : 1 µm = 1000 nm, donc le nombre en µm est 1000 fois plus petit.'], [0.025, 'Décalage d’une puissance de 10 : 250 nm = 250 ÷ 1000 µm.'], [0.00025, 'Vous avez divisé deux fois par 1000 : 250 nm ÷ 1000 = 0,25 µm.']],
        expl: '250 nm = 0,25 µm : c’est dans le domaine colloïdal (de 1 nm à 1 µm).', indice: '1 µm = 1000 nm : on divise le nombre de nm par 1000.' } },
    { id: 'classer', titre: 'Classer les produits du chariot', focus: ['scene', 'curseur', 'mesures'],
      texte: <>Parmi les produits du chariot, un seul type correspond à des gouttelettes ou des particules <strong>dans l’air</strong>. Choisissez dans la liste un produit qui est un <strong>aérosol</strong> en vous aidant de la description de ses phases.</>,
      tache: { type: 'action', ok: M.typeDe(pVie.disp, pVie.cont) === 'aérosol', consigne: 'Choisir un produit qui est un aérosol' } },
    { id: 'probleme', titre: 'Pourquoi les milieux dispersés vieillissent', focus: ['scene'],
      texte: <>Un milieu dispersé n’est pas forcément stable : au repos, les objets dispersés peuvent se déplacer. Les <strong>problèmes de stabilité</strong> principaux sont le <strong>crémage</strong> (la phase dispersée, moins dense, monte), la <strong>sédimentation</strong> (plus dense, elle descend), la <strong>floculation</strong> (les objets s’agglomèrent en amas réversibles) et la <strong>coalescence</strong> (les gouttes ou les bulles fusionnent, de façon irréversible). Dans un flacon de lait cru laissé au repos, une couche de crème monte à la surface.</>,
      tache: { type: 'qcm', q: 'Comment s’appelle ce phénomène ?', ...QCM.probleme,
        expl: 'La matière grasse est moins dense que l’eau : les gouttelettes montent et forment la crème. C’est le crémage.', indice: 'La crème est au-dessus : la phase dispersée monte, donc elle est moins dense que la phase continue.' } },
    { id: 'densite', titre: 'Ce qui fait monter ou descendre les objets : masse volumique, taille, viscosité', focus: ['scene'],
      texte: <>Pour le crémage et la sédimentation, trois facteurs jouent : la <strong>différence de masse volumique</strong> entre les deux phases (plus elle est grande, plus le mouvement est rapide), la <strong>taille</strong> des objets (les gros vont plus vite) et la <strong>viscosité</strong> de la phase continue (un milieu épais freine). C’est la loi de Stokes, vue avec les émulsions : la vitesse augmente avec le carré du rayon et diminue quand la viscosité augmente.</>,
      tache: { type: 'qcm', q: 'Laquelle de ces actions ralentit le crémage d’une émulsion ?', ...QCM.densite,
        expl: 'La vitesse de crémage varie comme le carré du rayon : des gouttes plus petites montent beaucoup plus lentement. Une plus grande différence de masse volumique ou une viscosité plus faible l’accélérerait.', indice: 'v est proportionnelle à r² × (différence de masse volumique) ÷ (viscosité).' } },
    { id: 'vdw', titre: 'Pourquoi des particules s’agglomèrent : van der Waals et liaison hydrogène', focus: ['scene'],
      texte: <>La <strong>floculation</strong> vient d’<strong>attractions</strong> entre les objets dispersés. Entre deux particules de même nature, les <strong>forces de van der Waals</strong> (interactions de dispersion et de polarisation) sont toujours attractives ; à courte distance elles les collent. Des <strong>liaisons hydrogène</strong> peuvent aussi relier des surfaces portant des groupes –OH (silice, cellulose). Pour éviter l’agglomération, il faut une répulsion (charges, polymères adsorbés), vue dans les simulations sur la stabilisation.</>,
      tache: { type: 'qcm', q: 'Pourquoi des particules de pigment s’agglomèrent-elles si on ne fait rien ?', ...QCM.vdw,
        expl: 'Les attractions de van der Waals existent entre toutes les particules et dominent à courte distance : sans répulsion (charges, polymère adsorbé), les particules se collent.', indice: 'Pensez à la nature de l’interaction de van der Waals entre deux particules identiques : attractive ou répulsive ?' } },
    { id: 'diagnostic', titre: 'Diagnostiquer une mayonnaise qui tranche', focus: ['scene'],
      texte: <>Une mayonnaise « tranche » : de grosses gouttes d’huile apparaissent, puis l’huile se sépare en nappe. En remuant, on ne retrouve pas la mayonnaise d’origine.</>,
      tache: { type: 'qcm', q: 'Quel phénomène explique ce que l’on observe ?', ...QCM.diagnostic,
        expl: 'Des gouttes qui fusionnent en gouttes plus grosses, de façon irréversible (on ne retrouve pas l’état initial en remuant), c’est de la coalescence : le film d’interface entre les gouttes s’est rompu.', indice: 'Une floculation se défait en agitant ; une fusion de gouttes, non.' } },
    { id: 'bilan', titre: 'Le bilan : types de milieux dispersés et causes d’instabilité', focus: [],
      retenirTitre: 'À retenir : les problèmes de stabilité', retenir: <>
        <SvgCarteProblemes/>
        <ul style={puces}>
          <li>Causes : <strong>différence de masse volumique</strong>, <strong>taille</strong> des objets, <strong>viscosité</strong>, attractions de <strong>van der Waals</strong> (et liaisons hydrogène).</li>
          <li>Une phase continue solide fige la dispersion.</li>
        </ul></>,
      texte: <>Vous savez distinguer les types de milieux dispersés d’après l’état de la phase dispersée et de la phase continue, nommer les quatre problèmes de stabilité et leurs causes. En exploration, vous pouvez construire chaque combinaison et voir des exemples.</> },
  ];
  const IDS = ETAPES.map(e => e.id), etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? IDS[etape] : null;
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const setEtatGuide = v => {
    const nv = typeof v === 'function' ? v(guide) : v;
    const ni = Math.min(nv.etape, IDS.length - 1);
    if (ni !== Math.min(guide.etape, IDS.length - 1)) setVie(() => IDS[ni] === 'classer' ? { disp: 'gaz', cont: 'liquide', prod: 'chantilly' } : { disp: 'gaz', cont: 'liquide', prod: 'lait' });
    setGuide(nv);
  };

  // ---------- scènes du parcours ----------
  const sc = idE;
  const SCENES = { phases: ['liquide', 'liquide'], 'case-vide': ['gaz', 'gaz'], suspension: ['solide', 'liquide'], 'mousse-aerosol': ['gaz', 'liquide'], solides: ['gaz', 'solide'], colloides: ['solide', 'liquide'], probleme: ['liquide', 'liquide'], densite: ['liquide', 'liquide'], vdw: ['solide', 'liquide'], diagnostic: ['liquide', 'liquide'] };
  const sceneGuide = !enGuide ? null
    : sc === 'tableau' ? <SvgMilieu disp={vie.disp} cont={vie.cont}/>
    : sc === 'classer' ? <SvgMilieu disp={pVie.disp} cont={pVie.cont}/>
    : sc === 'bilan' ? <SvgTableau/>
    : SCENES[sc] ? <SvgMilieu disp={SCENES[sc][0]} cont={SCENES[sc][1]}/>
    : null;
  const MES_GUIDE = {
    'tableau': [['Phase dispersée', vie.disp], ['Phase continue', vie.cont], ['Type de milieu', typeVie ?? 'aucun (un seul mélange)']],
    'classer': [['Produit', pVie.nom], ['Ce qu’il contient', pVie.detail]],
  };
  const lignesGuide = enGuide ? (MES_GUIDE[sc] ?? []) : [];
  const selecteur = (id, lab, val, onCh, options, vide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab}</label>
    <select id={id} value={val} onChange={onCh} style={selectStyle}>{vide && <option value="">{vide}</option>}{options.map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}</select></div>);
  const curseurGuide = enGuide && ['tableau', 'classer'].includes(sc) ? (
    <div style={{ ...styleBoite, ...cadre('curseur') }}>
      {sc === 'tableau' && <>{selecteur('md-gd', 'Phase dispersée', vie.disp, ev => setVie(s => ({ ...s, disp: ev.target.value })), ETAT_OPT)}{selecteur('md-gc', 'Phase continue', vie.cont, ev => setVie(s => ({ ...s, cont: ev.target.value })), ETAT_OPT)}</>}
      {sc === 'classer' && selecteur('md-gp', 'Produit du chariot', vie.prod, ev => setVie(s => ({ ...s, prod: ev.target.value })), M.PRODUITS)}
    </div>) : null;

  // ---------- défis ----------
  const nouveauDefi = kind => setDefi(kind === 'classer' ? { kind, p: M.tirageClasser(), d: '', c: '', t: '', verifie: false } : { kind, s: M.tirageDiagnostic(), pb: '', cause: '', verifie: false });
  const changerMode = md => { if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const verifier = () => {
    let ok;
    if (defi.kind === 'classer') { ok = M.verifieClasser(defi.p, defi.d, defi.c, defi.t); noterC(ok); }
    else { ok = M.verifieDiagnostic(defi.s, defi.pb, defi.cause); noterD(ok); }
    setDefi(d => ({ ...d, verifie: true, ok }));
  };
  const maj = f => setDefi(d => ({ ...d, ...f, verifie: false }));
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['classer', 'Classer un produit'], ['diagnostic', 'Diagnostiquer']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.kind === tp} style={stylePetitBouton(defi.kind === tp, '#7c3aed')}>{l}</button>)}
      </div>
      {defi.kind === 'classer' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : classer un produit</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>Produit : <strong>{defi.p.nom}</strong>. Il contient : {defi.p.detail}. Indiquez l’état de la phase dispersée, celui de la phase continue et le type de milieu dispersé.</div>
        {selecteur('md-dd', 'Phase dispersée', defi.d, ev => maj({ d: ev.target.value }), ETAT_A, 'Choisir…')}
        {selecteur('md-dc', 'Phase continue', defi.c, ev => maj({ c: ev.target.value }), ETAT_A, 'Choisir…')}
        {selecteur('md-dt', 'Type de milieu dispersé', defi.t, ev => maj({ t: ev.target.value }), M.NOMS_TYPES.map(n => ({ id: n, nom: n })), 'Choisir…')}
        <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>Repérez d’abord ce qui est en petits objets (phase dispersée), puis le milieu qui les entoure (phase continue) ; le type se lit dans le tableau selon les deux états.</IndiceDefi></div>
      </>}
      {defi.kind === 'diagnostic' && <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : diagnostiquer un problème de stabilité</div>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>{defi.s.texte}</div>
        {selecteur('md-pb', 'Problème observé', defi.pb, ev => maj({ pb: ev.target.value }), Object.entries(M.PROBLEMES).map(([id, nom]) => ({ id, nom })), 'Choisir…')}
        {selecteur('md-ca', 'Cause principale', defi.cause, ev => maj({ cause: ev.target.value }), Object.entries(M.CAUSES).map(([id, nom]) => ({ id, nom })), 'Choisir…')}
        <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>Une phase dispersée qui monte ou descend relève d’une différence de masse volumique ; des amas réversibles viennent d’attractions entre objets ; une fusion irréversible de gouttes vient d’un film d’interface qui se rompt.</IndiceDefi></div>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="md-verif" onClick={verifier} disabled={defi.kind === 'classer' ? !(defi.d && defi.c && defi.t) : !(defi.pb && defi.cause)} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.kind)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}
        {defi.kind === 'classer' && <>{defi.p.nom} : {defi.p.detail} ; phase dispersée : {defi.p.disp}, phase continue : {defi.p.cont}, soit {M.typeDe(defi.p.disp, defi.p.cont)}.</>}
        {defi.kind === 'diagnostic' && <>{M.PROBLEMES[defi.s.pb]}, dû à {M.CAUSES[defi.s.cause]}.</>}
      </div>}
    </div>);

  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#7c3aed')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const typeEx = M.typeDe(ex.disp, ex.cont), instEx = typeEx ? M.INSTAB[typeEx] : null, exemples = M.produitsDe(ex.disp, ex.cont);
  const reglagesExplore = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {selecteur('md-xd', 'Phase dispersée (petits objets)', ex.disp, ev => setEx(x => ({ ...x, disp: ev.target.value })), ETAT_OPT)}
      {selecteur('md-xc', 'Phase continue (milieu qui entoure)', ex.cont, ev => setEx(x => ({ ...x, cont: ev.target.value })), ETAT_OPT)}
      {selecteur('md-xp', 'Ou partir d’un produit du chariot', '', ev => { const p = M.produit(ev.target.value); if (p) setEx({ disp: p.disp, cont: p.cont }); }, M.PRODUITS, 'Choisir un produit…')}
      <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>Chaque choix de produit règle les deux phases.</div>
    </div>);
  const scenes = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>La dispersion et sa place dans le tableau</div>
      <SvgMilieu disp={ex.disp} cont={ex.cont}/>
      <div style={{ height: 6 }}/>
      <SvgTableau sel={ex}/>
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Type et stabilité</div>
      <LigneMesure nom="Type de milieu dispersé" valeur={typeEx ?? 'aucun : un seul mélange homogène'} couleur={COL.violet}/>
      <LigneMesure nom="Exemples du chariot" valeur={exemples.length ? exemples.map(p => p.nom).join(', ') : 'aucun sur ce chariot'}/>
      {exemples.length > 0 && <ul style={{ ...liste, marginTop: 6, fontSize: 13.5 }}>{exemples.map(p => <li key={p.id}><strong>{p.nom}</strong> : {p.detail}</li>)}</ul>}
      <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: KIT.txt }}><strong style={{ color: COL.rouge }}>Problèmes de stabilité typiques :</strong> {instEx ? instEx.pb : 'sans objet'}.</div>
      <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5, color: KIT.txt }}><strong style={{ color: COL.orange }}>Origine :</strong> {instEx ? instEx.cause : 'sans objet'}.</div>
    </div>);
  const aEssayer = (
    <ul style={liste}>
      <li>Choisissez successivement la chantilly, le brouillard et le lait : que change-t-il dans le dessin et dans le tableau ?</li>
      <li>Passez la phase continue de « liquide » à « solide » avec une phase dispersée liquide : que devient la stabilité ?</li>
      <li>Repérez les trois cases où la phase continue est liquide : quel nom porte chacune ?</li>
      <li>Réglez gaz dans gaz : pourquoi le tableau n’a-t-il pas de nom pour cette case ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Milieu dispersé : une phase dispersée (petits objets) dans une phase continue ; chacune est gaz, liquide ou solide (gaz dans gaz exclu)</li>
        <li>Phase continue liquide : mousse (gaz), émulsion (liquide), suspension (solide) ; phase continue gazeuse : aérosol ; phase continue solide : mousse, émulsion ou dispersion solide</li>
        <li>Dispersion colloïdale : objets d’environ 1 nm à 1 µm ; latex : billes de polymère dans un liquide</li>
        <li>Problèmes : crémage, sédimentation, floculation (réversible), coalescence (irréversible)</li>
        <li>Causes : différence de masse volumique, taille, viscosité, attractions de van der Waals, liaisons hydrogène</li>
      </ul>
    </ARetenir>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Classification simplifiée</strong> : chaque produit est rangé selon l’état de sa phase dispersée et de sa phase continue. Les produits réels sont plus complexes : le lait contient aussi des protéines en dispersion colloïdale, la peinture murale contient un liant polymère (latex) en plus des pigments, la mayonnaise est une émulsion très concentrée qui se comporte aussi comme un gel. Les noms de types suivent l’usage courant en formulation ; certains auteurs utilisent d’autres noms (sol, gel).</li>
      <li><strong>Aérosol</strong> : employé au sens physico-chimique (gouttes ou particules dans un gaz : brouillard, fumée), pas au sens de la bombe de laque.</li>
      <li><strong>Taille</strong> : le domaine colloïdal correspond à des dimensions d’environ 1 nm à 1 µm dans au moins une direction (définition de l’IUPAC, Gold Book « colloidal »). La limite avec les suspensions et émulsions grossières est conventionnelle. La taille de 250 nm d’un latex est une valeur illustrative.</li>
      <li><strong>Émulsion solide</strong> : le beurre est classé ici comme gouttelettes d’eau dans une matière grasse partiellement cristallisée ; la frontière entre solide et liquide très visqueux est une simplification.</li>
      <li><strong>Stabilité</strong> : les phénomènes de crémage, sédimentation, floculation et coalescence sont décrits qualitativement ; la loi de Stokes (vitesse proportionnelle à r² et à la différence de masse volumique, inversement proportionnelle à la viscosité) suppose des objets sphériques, isolés et un milieu peu concentré. Dans un solide ou un milieu très visqueux, les objets sont figés : le milieu est stable à l’échelle de temps usuelle, ce qui ne l’empêche pas de vieillir autrement.</li>
      <li><strong>Forces d’attraction</strong> : les forces de van der Waals (dispersion, polarisation) sont attractives entre particules de même nature ; la répulsion électrostatique et stérique qui les compense est étudiée dans les simulations sur la stabilisation (charge de surface, dispersants, tensioactifs).</li>
      <li><strong>Hors modèle</strong> : mûrissement d’Ostwald, drainage détaillé des mousses, rhéologie, gels.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const mesuresGuide = enGuide && lignesGuide.length > 0 && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {lignesGuide.map(([n, v]) => <LigneMesure key={n} nom={n} valeur={v}/>)}
    </div>);
  const sceneBloc = sceneGuide && <div style={{ ...styleBoite, ...cadre('scene') }}>{sceneGuide}</div>;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .md-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .md-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .md-col { display: flex; flex-direction: column; gap: 12px; }
        .md-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .md-l1.cote .md-carte { order: 2; } .md-l1.cote .md-main { order: 1; }
          .md-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .md-ex > * { grid-column: 1; }
          .md-ex > .md-reg { grid-column: 2; grid-row: 1 / span 2; }
        }
        @media (max-width: 900px) { .md-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .md-in { animation: md-fondu 0.35s ease-out; } @keyframes md-fondu { from { opacity: 0; } to { opacity: 1; } } }
        @media (prefers-reduced-motion: reduce) { .md-l1 *, .md-ex * { transition: none !important; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Milieux dispersés : types et causes d’instabilité</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Mousse, émulsion, suspension, aérosol… Sur le chariot du formulateur, on apprend à <strong>reconnaître le type</strong> d’un milieu dispersé et à comprendre <strong>pourquoi il vieillit</strong>.</div>
      {enGuide && <div className="md-l1 cote">
        <div className="md-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="md-main">
          <div className="md-col">
            {sceneBloc && <div className="md-in">{sceneBloc}</div>}
            {curseurGuide && <div className="md-in">{curseurGuide}</div>}
            {mesuresGuide && <div className="md-in">{mesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.kind}`} etat={defi.kind === 'classer' ? suiviC : suiviD}/></div>}
      {enExplore && <>
        <div className="md-ex">
          {scenes}
          <div className="md-reg">{reglagesExplore}</div>
          {mesuresEx}
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
