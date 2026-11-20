import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, ARetenir, IndiceDefi, ExempleResolu, OngletExercices, LigneMesure, Curseur, Formule } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./ccm2gtModele";
import { QCM } from "./ccm2gtQcm";
import { PlaqueSvg, SceneCuve, SceneUtile, SceneErreurs, LIBELLES_ETIQ, Pastille, styleChamp, COL } from "./Ccm2gtScenes";
import { FicheMateriel, FicheSchemaLegende, FicheLireComparer, FicheRf, FicheLimite, FicheErreurs } from "./Ccm2gtFiches";

const SIM_ID = 197, CLE_GUIDE = 'ccm-2gt-guide-v1';
declarerDefis(SIM_ID, [['compo', 'Quelle est la composition de l’échantillon ?'], ['identite', 'L’arôme de synthèse est-il identique à l’extrait naturel ?']]);

// ====================================================
//  SIM 197 — CHROMATOGRAPHIE SUR COUCHE MINCE : IDENTIFIER ET COMPARER (2GT spé PC, « Description et caractérisation de la matière » et « Synthèse d'une espèce chimique présente dans la nature »).
//  Une seule idée : une CCM sépare les espèces d'un mélange ; en déposant des références à côté de l'échantillon, on compare les hauteurs des taches : mêmes hauteurs = compatible avec
//  la même espèce (sans preuve), hauteurs différentes = espèces différentes. Prérequis : sim 196 (corps purs et mélanges), 63 (mélanges). Suite : 1G 109 (chalcone), 1G 112 (ampoule à décanter), TSTL 38 (CCM).
//  Parcours (13 étapes) : à quoi sert une CCM (1), matériel (1), dépôt (1), élution (1), front et schéma légendé (1), révélation (1), lire les taches (1), comparer à des références (1),
//  rapport frontal (1, facultatif, sans question), même hauteur ne prouve pas (2), erreurs (1), bilan (1). Modèle : ccm2gtModele.js (testé).
//  Capacités visées (jamais affichées à l'élève) : réaliser une CCM pour identifier une espèce chimique et, le cas échéant, qualifier l'échantillon de mélange ; comparer une espèce
//  synthétisée et une espèce extraite de la nature (même nombre de taches, mêmes hauteurs : espèce identique, avec réserve) ; réaliser le schéma légendé d'une CCM.
//  Hors programme, non exigé : le rapport frontal Rf (présenté en complément, facultatif, sans question dans le parcours).
// ====================================================

const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const boite = (titre, corps, extra = {}) => (
  <div className="cc-scene" style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
const aide = t => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{t}</div>;
const renvoi = <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>↓ La question de cette étape est juste en dessous.</div>;
const NB = M.NB;
const etiquette = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 };
const bonbon = M.SITUATIONS.bonbon;
const voieEch = (sit, id, ligne1 = 'échant.') => { const e = M.echantillon(sit, id); return { cle: id, type: 'ech', lib: [ligne1, e.court], especes: e.especes }; };
const voieRef = r => ({ cle: `r-${r}`, type: 'ref', lib: ['réf.', M.ESPECES[r].court], especes: [r] });
const nomEluant = (sit, el) => M.SITUATIONS[sit].eluants[el].nom;
const choixEluant = (el, setEl) => (
  <div role="group" aria-label="Éluant" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
    {[1, 2].map(e => <button key={e} onClick={() => setEl(e)} aria-pressed={el === e} style={stylePetitBouton(el === e, '#0369a1')}>Éluant {e}</button>)}
  </div>);

export function SimulationCcm() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviC, noterC] = useCompteurDefi(), [suiviI, noterI] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('compo');
  const [hypoOuv, setHypoOuv] = useState(() => mode === 'defi');
  const [gs, setGs] = useState({ t: 0, uv: false, eluant: 1, pins: {} });                 // état des scènes du parcours guidé
  const [ex, setEx] = useState({ sit: 'bonbon', ech1: 'violet', ech2: 'natPur', refs: ['jaune', 'rouge'], co: '', eluant: 1, avance: 0, uv: false, erreur: 'aucune', reperes: false, regle: true, anim: false, ouv: {} });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  // ---------- étapes du parcours ----------
  const IDS = ['utile', 'materiel', 'deposer', 'eluer', 'front', 'reveler', 'lire', 'comparer', 'rf', 'limite1', 'limite2', 'erreurs', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const PINS = { tache: 1, couvercle: 2, front: 3, ligne: 4, eluant: 5 };
  const pinsOk = Object.keys(PINS).every(k => gs.pins[k] === k);
  const avanceGuide = gs.t / 20;
  const sceneEluer = [voieEch('bonbon', 'vert'), voieRef('jaune'), voieRef('bleu')];
  const voiesArome = [voieEch('arome', 'synthB', 'arôme'), voieEch('arome', 'natPur', 'arôme'), { cle: 'co', type: 'co', lib: ['co-dép.', '1 + 2'], especes: [...M.echantillon('arome', 'synthB').especes, ...M.echantillon('arome', 'natPur').especes] }]
    .map((v, i) => (i === 0 ? { ...v, lib: ['synthèse', 'B'] } : i === 1 ? { ...v, lib: ['extrait', 'naturel'] } : v));
  const ETAPES = [
    { id: 'utile', titre: 'À quoi sert une CCM ?', focus: ['scene'],
      texte: <>Le colorant vert d’un bonbon est-il <strong>un seul corps</strong> ou <strong>un mélange</strong> de colorants ? Pour le savoir, on utilise la <strong>chromatographie sur couche mince</strong>, abrégée <strong>CCM</strong>. Cette technique <strong>sépare</strong> les espèces chimiques d’un mélange : chaque espèce forme sa propre <strong>tache</strong> sur une plaque.
        <ExempleResolu>On dépose une goutte du colorant d’un bonbon vert sur la plaque. Après la CCM, on voit <strong>une tache jaune et une tache bleue</strong> : le bonbon vert contient deux colorants, c’est un mélange.</ExempleResolu>
        À vous : une autre situation.</>,
      tache: { type: 'qcm', ...QCM.utile } },
    { id: 'materiel', titre: 'Le matériel d’une CCM', focus: ['scene'],
      texte: <>Une CCM se fait dans une <strong>cuve</strong> fermée par un <strong>couvercle</strong>. Au fond, un peu de liquide : l’<strong>éluant</strong>. On y plonge une <strong>plaque</strong> recouverte d’une fine couche de silice : c’est la <strong>phase stationnaire</strong> (elle ne bouge pas). <strong>Sécurité</strong> : les éluants sont volatils et inflammables. Pas de flamme ; gants et lunettes ; manipulation sous la hotte, par le professeur.</>,
      tache: { type: 'qcm', ...QCM.materiel } },
    { id: 'deposer', titre: 'Déposer les échantillons', focus: ['scene'],
      texte: <>Avec un <strong>crayon à papier</strong>, on trace la <strong>ligne de dépôt</strong> à 1&nbsp;cm du bas de la plaque. Avec un tube très fin, on dépose sur cette ligne une <strong>petite goutte</strong> de chaque échantillon, bien espacées : c’est le <strong>dépôt</strong>. On trace au crayon et non au stylo : l’encre du stylo migrerait elle aussi. On pose ensuite la plaque debout dans la cuve.</>,
      tache: { type: 'qcm', ...QCM.deposer } },
    { id: 'eluer', titre: 'Faire monter l’éluant', focus: ['scene'],
      texte: <>On referme la cuve. L’éluant <strong>monte tout seul</strong> le long de la plaque, comme l’eau dans un buvard. En montant, il entraîne les espèces déposées, mais chacune monte <strong>plus ou moins vite</strong> : elles se séparent. C’est la <strong>migration</strong>. La partie mouillée de la plaque est en bleu.</>,
      tache: { type: 'action', ok: avanceGuide >= 0.98, consigne: 'Faites monter l’éluant jusqu’à la ligne orange en pointillés avec le curseur.' },
      retenirTitre: 'Le matériel et le dépôt',
      retenir: <><FicheMateriel />
        <ul style={liste}>
          <li><strong>Phrase-clé : crayon pour la ligne, éluant sous la ligne.</strong> Ligne de dépôt à 1&nbsp;cm du bas, petite goutte.</li>
          <li><strong>Idée fausse</strong> : « il faut tremper le dépôt pour bien le mouiller ». <strong>Vrai</strong> : l’éluant monte seul jusqu’au dépôt ; s’il le recouvrait, les espèces se dissoudraient dans la cuve.</li>
        </ul>{renvoi}</> },
    { id: 'front', titre: 'Le front de l’éluant et le schéma légendé', focus: ['scene'],
      texte: <>Le <strong>front de l’éluant</strong> est le niveau le plus haut atteint par l’éluant. Quand il arrive à environ 1&nbsp;cm du bord, on sort la plaque et on <strong>marque tout de suite le front au crayon</strong> : il disparaît en séchant. Voici le schéma d’une CCM terminée (ici la plaque est encore dans la cuve), avec des taches. Associez chaque pastille numérotée à sa légende.</>,
      tache: { type: 'action', ok: pinsOk, consigne: 'Choisissez la légende de chaque pastille (la cuve et la plaque sont déjà légendées).' } },
    { id: 'reveler', titre: 'Révéler les taches', focus: ['scene'],
      texte: <>Beaucoup d’espèces sont <strong>incolores</strong> : leurs taches sont invisibles à l’œil nu. Il faut <strong>révéler</strong> la plaque : sous une <strong>lampe UV</strong>, la plaque brille et les taches apparaissent en sombre. On peut aussi utiliser un <strong>révélateur</strong>, un produit qui colore les taches. <strong>Sécurité</strong> : ne jamais regarder la lampe UV sans lunettes de protection.</>,
      tache: { type: 'action', ok: gs.uv, label: 'Allumer la lampe UV', faire: () => setGs(g => ({ ...g, uv: true })), consigne: 'Allumez la lampe UV pour révéler la plaque.' },
      retenirTitre: 'Le schéma légendé d’une CCM',
      retenir: <><FicheSchemaLegende />
        <ul style={liste}>
          <li><strong>Phrase-clé : légender, c’est nommer chaque élément</strong> : couvercle, cuve, éluant, plaque, ligne de dépôt, front, taches.</li>
          <li><strong>Idée fausse</strong> : « le front est le bord haut de la plaque ». <strong>Vrai</strong> : c’est l’endroit où l’éluant s’est arrêté, marqué au crayon avant le séchage.</li>
        </ul>{renvoi}</> },
    { id: 'lire', titre: 'Lire les taches', focus: ['scene'],
      texte: <>On <strong>lit</strong> la plaque : chaque tache correspond à une espèce chimique. <strong>Une seule tache</strong> : on ne voit qu’une espèce, c’est probablement un <strong>corps pur</strong>. <strong>Plusieurs taches</strong> : plusieurs espèces, c’est un <strong>mélange</strong>.
        <ExempleResolu>L’enrobage marron donne <strong>trois taches</strong> : il contient au moins trois colorants, c’est un mélange.</ExempleResolu>
        À vous : l’enrobage rouge.</>,
      tache: { type: 'qcm', ...QCM.lire } },
    { id: 'comparer', titre: 'Comparer à des références', focus: ['scene'],
      texte: <>Pour savoir <strong>quelles espèces</strong> contient un échantillon, on dépose à côté des <strong>références</strong> : des espèces connues et pures. Si une tache de l’échantillon est <strong>à la même hauteur</strong> que celle d’une référence, l’échantillon contient <strong>peut-être</strong> cette espèce. La règle graduée aide à comparer les hauteurs.
        <ExempleResolu>L’enrobage vert a deux taches : l’une à la hauteur de la référence jaune, l’autre à celle de la référence bleue. Il contient donc probablement le jaune E102 et le bleu E133.</ExempleResolu>
        À vous : l’enrobage orange.</>,
      tache: { type: 'qcm', ...QCM.comparer } },
    { id: 'rf', titre: 'Pour aller plus loin : le rapport frontal', focus: ['scene'],
      texte: <><strong>Étape facultative</strong> : le programme de Seconde n’exige pas ce calcul, l’identification se fait en alignant les taches. On peut cependant décrire la hauteur d’une tache par un nombre : le <strong>rapport frontal</strong>, noté <strong>R<sub>f</sub></strong>. Les distances se mesurent depuis la ligne de dépôt. R<sub>f</sub> n’a pas d’unité et se situe entre 0 et 1.
        <ExempleResolu>La tache rouge a parcouru <strong>2,1&nbsp;cm</strong> et le front <strong>6,0&nbsp;cm</strong> : R<sub>f</sub> = 2,1 ÷ 6,0 = <strong>0,35</strong> (2 chiffres significatifs).</ExempleResolu>
        Dans l’exploration, la simulation donne la distance et R<sub>f</sub> de chaque tache.</>,
      tache: null,
      retenirTitre: 'Lire et comparer',
      retenir: <><FicheLireComparer />
        <ul style={liste}>
          <li><strong>Phrase-clé : 1 tache, corps pur probable ; plusieurs taches, mélange ; taches alignées, peut-être la même espèce.</strong></li>
          <li><strong>Idée fausse</strong> : « la couleur de l’échantillon dit quels colorants il contient ». <strong>Vrai</strong> : la couleur seule ne suffit pas à identifier les colorants ; il faut l’alignement avec des références.</li>
        </ul></> },
    { id: 'limite1', titre: 'Même hauteur : est-ce une preuve ?', focus: ['scene'],
      texte: <>Un chimiste a préparé un arôme de synthèse. Il veut savoir s’il est <strong>identique</strong> à l’arôme extrait de la nature. Il dépose les deux sur la <strong>même plaque</strong>, avec le <strong>même éluant</strong> (sinon on ne peut pas comparer), et dépose aussi les deux <strong>au même endroit</strong> : c’est un <strong>co-dépôt</strong>. Ici, les plaques sont observées sous lampe UV.</>,
      tache: { type: 'qcm', ...QCM.limite1 },
      retenirTitre: 'Le rapport frontal',
      retenir: <><FicheRf />
        <Formule><msub><mi>R</mi><mi>f</mi></msub><mo>=</mo><mfrac><mtext>distance de la tache</mtext><mtext>distance du front</mtext></mfrac></Formule>
        <ul style={liste}>
          <li><strong>Phrase-clé : R<sub>f</sub> = distance de la tache ÷ distance du front, entre 0 et 1, sans unité.</strong> Exemple : 2,1 ÷ 6,0 = 0,35. Facultatif en Seconde.</li>
          <li><strong>Idée fausse</strong> : « R<sub>f</sub> peut dépasser 1 ». <strong>Vrai</strong> : une tache ne dépasse jamais le front.</li>
        </ul></> },
    { id: 'limite2', titre: 'Changer d’éluant pour confirmer', focus: ['scene'],
      texte: <>Pour confirmer, on refait la CCM avec un <strong>autre éluant</strong>. Le bouton « Éluant 2 » affiche la nouvelle plaque : les dépôts sont les mêmes, seul l’éluant a changé.</>,
      tache: { type: 'qcm', ...QCM.limite2 } },
    { id: 'erreurs', titre: 'Quand la CCM est ratée', focus: ['scene'],
      texte: <>Une CCM peut être ratée. Trois erreurs fréquentes : le dépôt est <strong>trop bas</strong> (il plonge dans l’éluant et se dissout), le dépôt est <strong>trop concentré</strong> (de grosses taches qui traînent et se touchent), ou la plaque reste <strong>trop longtemps</strong> dans la cuve (le front dépasse le bord et ne peut plus être relevé). Voici trois plaques ratées, A, B et C.</>,
      tache: { type: 'qcm', ...QCM.erreurs },
      retenirTitre: 'Même hauteur : pas une preuve',
      retenir: <><FicheLimite />
        <ul style={liste}>
          <li><strong>Phrase-clé : même hauteur, compatible mais pas prouvé ; hauteurs différentes, espèces différentes.</strong></li>
          <li><strong>Idée fausse</strong> : « deux taches alignées prouvent que c’est la même espèce ». <strong>Vrai</strong> : deux espèces peuvent migrer pareil ; on confirme avec un autre éluant.</li>
        </ul></> },
    { id: 'bilan', titre: 'Le bilan', focus: ['scene'],
      texte: <>Une CCM <strong>sépare</strong> les espèces d’un mélange : une tache par espèce. Une seule tache, c’est probablement un <strong>corps pur</strong> ; plusieurs taches, un <strong>mélange</strong>. En déposant des <strong>références</strong> à côté de l’échantillon et en comparant les hauteurs, on identifie les espèces, avec la même plaque et le même éluant. Des taches à la <strong>même hauteur</strong> sont compatibles avec la même espèce sans le prouver : on change d’éluant pour confirmer. Vous pouvez maintenant explorer ou relever un défi.</>,
      tache: null,
      retenirTitre: 'Les trois erreurs fréquentes',
      retenir: <><FicheErreurs />
        <ul style={liste}>
          <li><strong>Phrase-clé : dépôt sous le niveau, dépôt trop gros, front oublié.</strong> Dans les trois cas, la lecture est fausse ou impossible.</li>
          <li><strong>Idée fausse</strong> : « plus on dépose de produit, mieux on voit les taches ». <strong>Vrai</strong> : une goutte très petite, sinon les taches s’étalent.</li>
        </ul></> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = (type, prec = defi) => {
    if (type === 'compo') setDefi({ ...M.tirerDefiComposition(prec && prec.type === 'compo' ? prec : null), rep: { refs: [], inconnue: false }, verifie: false });
    else {
      const d = M.tirerDefiIdentite(prec && prec.type === 'identite' ? prec : null);
      const ordre = Object.keys(M.CHOIX_IDENTITE).map(k => [Math.random(), k]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
      setDefi({ ...d, ordre, rep: '', eluantVu: 1, verifie: false });
    }
  };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi') setHypoOuv(true);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi, null);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t, null); }
  const verifier = () => {
    if (defi.type === 'compo') { const v = M.verifierComposition(defi, defi.rep); setDefi(d => ({ ...d, verifie: true, ok: v.ok, v })); noterC(v.ok); }
    else { const ok = M.reponseJusteIdentite(defi, defi.rep); setDefi(d => ({ ...d, verifie: true, ok })); noterI(ok); }
  };
  const listeNoms = ids => ids.map(r => M.ESPECES[r].nom).join(', ');
  const messageCompo = d => {
    if (d.ok) return `✓ Correct : l’échantillon contient ${listeNoms(d.refs)}${d.inconnue ? ' et une espèce qui n’est pas dans les références' : ''}.`;
    const dits = [d.v.enTrop.length ? 'une référence cochée n’a aucune tache de l’échantillon à sa hauteur' : null, d.v.manque.length ? 'une tache de l’échantillon est à la hauteur d’une référence que vous n’avez pas cochée' : null,
      !d.v.inconnueOk ? 'revoyez la case « une tache n’est à la hauteur d’aucune référence » : comptez les taches de l’échantillon et celles qui sont alignées' : null].filter(Boolean);
    return `✗ À revoir : ${dits.join(' ; ')}.`;
  };
  const messageIdentite = d => {
    const sep = M.eluantsQuiSeparent(d.espece, 'van');
    if (d.ok) return d.bonne === 'probable'
      ? '✓ Correct : les hauteurs sont les mêmes avec les deux éluants. L’espèce est très probablement la même, sans preuve absolue.'
      : `✓ Correct : avec ${sep.length === 2 ? 'les deux éluants' : `l’éluant ${sep[0]}`}, les hauteurs diffèrent : ce ne sont pas les mêmes espèces.${sep.length === 1 ? ' L’autre éluant ne les séparait pas : c’est pour cela qu’il faut en changer.' : ''}`;
    if (d.rep === 'prouve') return '✗ Des taches alignées ne prouvent jamais que deux espèces sont les mêmes : deux espèces différentes peuvent migrer pareil dans un éluant.';
    if (d.rep === 'impossible') return '✗ Les deux plaques ne se contredisent pas : un éluant peut ne pas séparer deux espèces qu’un autre éluant sépare.';
    return d.bonne === 'diff' ? '✗ Regardez attentivement les deux plaques avec la règle : une hauteur diffère avec au moins un éluant.' : '✗ Regardez les deux plaques : les hauteurs sont-elles vraiment différentes (à 1\u00a0mm près) ?';
  };
  const voiesCompo = d => [{ cle: 'e', type: 'ech', lib: ['échant.', 'inconnu'], especes: d.especes }, ...M.SITUATIONS[d.sit].refs.map(voieRef)];
  const champDefiCompo = d => {
    const S = M.SITUATIONS[d.sit], objet = d.sit === 'bonbon' ? 'l’enrobage d’un bonbon' : 'un extrait de feuilles';
    const bascule = r => setDefi(x => { const refs = x.rep.refs.includes(r) ? x.rep.refs.filter(y => y !== r) : [...x.rep.refs, r]; return { ...x, rep: { ...x.rep, refs }, verifie: false }; });
    return (
      <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>On étudie <strong>{objet}</strong>. La plaque a migré avec le même éluant pour tous les dépôts : <strong>{nomEluant(d.sit, d.eluant)}</strong>. À droite de l’échantillon, quatre références pures. Les hauteurs se lisent à 1&nbsp;mm près. Quelles références l’échantillon contient-il probablement ?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
          {S.refs.map(r => (
            <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36, fontSize: 14.5, color: KIT.txt }}>
              <input type="checkbox" checked={d.rep.refs.includes(r)} onChange={() => bascule(r)} style={{ width: 20, height: 20 }} />{M.ESPECES[r].nom}</label>))}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36, fontSize: 14.5, color: KIT.txt, borderTop: `1px solid ${KIT.bord}`, paddingTop: 4 }}>
            <input type="checkbox" checked={d.rep.inconnue} onChange={() => setDefi(x => ({ ...x, rep: { ...x.rep, inconnue: !x.rep.inconnue }, verifie: false }))} style={{ width: 20, height: 20 }} />une tache n’est à la hauteur d’aucune référence</label>
        </div>
        <IndiceDefi cache={false}>Pour chaque tache de l’échantillon, cherchez une référence à la même hauteur (aidez-vous de la règle). Cochez ces références. Une tache sans référence alignée est une espèce qui n’est pas dans les références.</IndiceDefi>
      </>);
  };
  const champDefiIdentite = d => (
    <>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Un laboratoire a préparé un <strong>arôme de synthèse</strong>. On le compare à un <strong>extrait naturel purifié</strong>, sur la même plaque, sous lampe UV, avec deux éluants : <strong>{nomEluant('arome', 1)}</strong> (éluant 1) puis <strong>{nomEluant('arome', 2)}</strong> (éluant 2). Utilisez les boutons pour voir les deux plaques. Les hauteurs se lisent à 1&nbsp;mm près. L’arôme de synthèse est-il identique à l’extrait naturel ?</div>
      <div role="radiogroup" aria-label="Votre conclusion" style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
        {d.ordre.map(k => <button key={k} role="radio" aria-checked={d.rep === k} onClick={() => setDefi(x => ({ ...x, rep: k, verifie: false }))} style={{ ...stylePetitBouton(d.rep === k, '#0369a1'), textAlign: 'left', padding: '7px 10px', fontSize: 14 }}>{M.CHOIX_IDENTITE[k]}</button>)}
      </div>
      <IndiceDefi cache={false}>Comparez les hauteurs de la tache de synthèse et de la tache naturelle sur CHAQUE plaque, avec la règle. Des taches alignées ne suffisent pas à prouver l’identité ; des hauteurs différentes prouvent que les espèces sont différentes.</IndiceDefi>
    </>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['compo', 'Composition d’un échantillon'], ['identite', 'Synthèse ou nature ?']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target" />{defi.type === 'compo' ? 'Défi : quelle est la composition de l’échantillon ?' : 'Défi : l’arôme de synthèse est-il identique à l’extrait naturel ?'}</div>
      {defi.type === 'compo' ? champDefiCompo(defi) : champDefiIdentite(defi)}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={verifier} disabled={defi.type === 'identite' && !defi.rep} style={{ ...styleBouton(true, '#15803d'), opacity: defi.type === 'identite' && !defi.rep ? 0.5 : 1 }}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh" />Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'compo' ? messageCompo(defi) : messageIdentite(defi)}</div>}
    </div>);
  const sceneDefi = defi && (defi.type === 'compo'
    ? <PlaqueSvg voies={voiesCompo(defi)} eluant={defi.eluant} avance={1} regle aria={`Plaque de CCM à cinq voies : un échantillon inconnu et quatre références, avec l’éluant ${nomEluant(defi.sit, defi.eluant)}.`} />
    : <>
      <PlaqueSvg voies={[{ cle: 's', type: 'ech', lib: ['synthèse', ''], especes: [defi.espece] }, { cle: 'n', type: 'ech', lib: ['extrait', 'naturel'], especes: ['van'] }, { cle: 'c', type: 'co', lib: ['co-dép.', '1 + 2'], especes: [defi.espece, 'van'] }].map((v, i) => (i === 0 ? { ...v, lib: ['arôme', 'synthèse'] } : v))}
        eluant={defi.eluantVu} avance={1} uv regle aria={`Plaque sous lampe UV avec l’éluant ${defi.eluantVu} : arôme de synthèse, extrait naturel et co-dépôt.`} />
      {choixEluant(defi.eluantVu, e => setDefi(x => ({ ...x, eluantVu: e })))}
    </>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Même plaque, même éluant pour tous les dépôts</strong> : on ne compare des hauteurs que sur une même plaque, migrée en une seule fois. Avec un autre éluant, les hauteurs changent.</li>
      <li><strong>Des taches à la même hauteur ne prouvent pas</strong> : elles sont compatibles avec la même espèce, mais deux espèces différentes peuvent migrer pareil dans un éluant. Pour confirmer, on change d’éluant. À l’inverse, des hauteurs différentes montrent que les espèces sont différentes.</li>
      <li><strong>Dépôts de concentrations comparables, plaque non surchargée</strong> : chaque espèce donne une tache ronde et nette. Trop de produit étale les taches et fausse la lecture.</li>
      <li><strong>Hauteur du front relevée avant le séchage</strong> : on la marque au crayon dès la sortie de la plaque ; si le front a dépassé le bord, il ne peut plus être relevé.</li>
      <li><strong>Lecture à ±1&nbsp;mm</strong> : deux taches dont les centres sont à moins de 1&nbsp;mm sont jugées à la même hauteur. Une tache seule peut cacher deux espèces qui migrent ensemble.</li>
      <li><strong>Rapport frontal R<sub>f</sub></strong> : non exigé en Seconde, il est donné à titre de complément ; l’identification repose sur l’alignement des taches.</li>
      <li><strong>Valeurs inventées</strong> : les hauteurs des taches, les compositions des échantillons et les éluants sont choisis pour la simulation (ordres de grandeur réalistes, pas des mesures).</li>
      <li><strong>Sécurité</strong> : les éluants sont volatils et inflammables (pas de flamme, gants, lunettes, hotte, manipulation par le professeur) ; sous lampe UV, lunettes de protection.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search" />Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target" />Défis</button>
      <OngletExercices simId={SIM_ID} />
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const selectsPins = (
    <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
      {Object.entries(PINS).sort((a, b) => a[1] - b[1]).map(([id, n]) => (
        <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14.5, color: KIT.txt }}>
          <Pastille n={n} />
          <select value={gs.pins[id] || ''} onChange={e => setGs(g => ({ ...g, pins: { ...g.pins, [id]: e.target.value } }))} aria-label={`Légende de la pastille ${n}`}
            style={{ ...styleChamp, flex: 1, borderColor: gs.pins[id] ? (gs.pins[id] === id ? '#15803d' : '#dc2626') : KIT.bord }}>
            <option value="">— choisir —</option>
            {['couvercle', 'eluant', 'front', 'ligne', 'tache'].map(k => <option key={k} value={k}>{LIBELLES_ETIQ[k]}</option>)}
          </select>
          {gs.pins[id] ? <span aria-hidden="true" style={{ fontWeight: 800, color: gs.pins[id] === id ? '#15803d' : '#dc2626' }}>{gs.pins[id] === id ? '✓' : '✗'}</span> : null}
        </label>))}
    </div>);
  const sceneGuide = (() => {
    switch (idE) {
      case 'utile': return boite('Du bonbon à la plaque', <SceneUtile />, cadre('scene'));
      case 'materiel': return boite('Une cuve de chromatographie', <SceneCuve phase="avant" especes={['jaune']} etiq={{ couvercle: 'txt', cuve: 'txt', eluant: 'txt', plaque: 'txt' }} />, cadre('scene'));
      case 'deposer': return boite('Les dépôts sur la ligne de départ', <PlaqueSvg voies={sceneEluer} avance={0} front={false} etiqLigne />, cadre('scene'));
      case 'eluer': return boite('La migration', <>
        <PlaqueSvg voies={sceneEluer} avance={avanceGuide} front={false} mouille cible aria="Plaque pendant la migration : la partie mouillée est en bleu, les taches se séparent peu à peu." />
        <Curseur nom="Durée de la migration" valeur={gs.t} onChange={v => setGs(g => ({ ...g, t: Math.round(v) }))} min={0} max={20} pas={1} unite="min" decimales={0} couleur="#0369a1" /></>, cadre('scene'));
      case 'front': return boite('Une CCM terminée', <><SceneCuve phase="apres" especes={['jaune', 'bleu']} etiq={{ cuve: 'txt', plaque: 'txt', ...PINS }} />{selectsPins}</>, cadre('scene'));
      case 'reveler': return boite('La plaque de l’extrait de vanille', <PlaqueSvg voies={[voieEch('arome', 'natPur', 'extrait')]} eluant={1} avance={1} uv={gs.uv} aria="Plaque d’un extrait de vanille, incolore : les taches ne sont visibles que sous lampe UV." />, cadre('scene'));
      case 'lire': return boite('Trois enrobages après la CCM', <PlaqueSvg voies={['marron', 'violet', 'rouge'].map(id => voieEch('bonbon', id))} eluant={1} avance={1} />, cadre('scene'));
      case 'comparer': return boite('Un échantillon et quatre références', <PlaqueSvg voies={[voieEch('bonbon', 'orange'), ...bonbon.refs.map(voieRef)]} eluant={1} avance={1} regle />, cadre('scene'));
      case 'rf': return boite('Mesurer avec la règle', <PlaqueSvg voies={[voieRef('rouge'), voieRef('bleu')]} eluant={1} avance={1} regle aria="Deux voies de référence, rouge et bleue, à côté d’une règle graduée en centimètres." />, cadre('scene'));
      case 'limite1': return boite('Arôme de synthèse et arôme naturel, éluant 1', <PlaqueSvg voies={voiesArome} eluant={1} avance={1} uv regle />, cadre('scene'));
      case 'limite2': return boite('Les mêmes dépôts avec un autre éluant', <><PlaqueSvg voies={voiesArome} eluant={gs.eluant} avance={1} uv regle />{choixEluant(gs.eluant, e => setGs(g => ({ ...g, eluant: e })))}</>, cadre('scene'));
      case 'erreurs': return boite('Trois plaques ratées', <SceneErreurs />, cadre('scene'));
      case 'bilan': return boite('Une CCM lue en entier', <PlaqueSvg voies={[voieEch('bonbon', 'vert'), voieRef('jaune'), voieRef('bleu')]} eluant={1} avance={1} regle reperes aria="Plaque finale : les taches de l’enrobage vert sont alignées avec les références jaune et bleue, repérées par des pointillés." />, cadre('scene'));
      default: return null;
    }
  })();

  // ════════════════ EXPLORATION ════════════════
  const ouvrir = k => setEx(s => ({ ...s, ouv: { ...s.ouv, [k]: !s.ouv[k] } }));
  const S = M.SITUATIONS[ex.sit], aRef = S.refs;
  const refsActives = ex.refs.filter(r => aRef.includes(r)).slice(0, Math.max(0, 6 - 1 - (ex.sit === 'arome' && ex.ech2 ? 1 : 0) - (ex.co ? 1 : 0)));
  const ech2Actif = ex.sit === 'arome' && ex.ech2 ? ex.ech2 : null;
  const coActif = ex.co === 'e2' ? (ech2Actif ? 'e2' : null) : (ex.co && aRef.includes(ex.co) ? ex.co : null);
  const voiesEx = M.voies(ex.sit, { ech1: ex.ech1, ech2: ech2Actif, refs: refsActives, co: coActif });
  const frontMm = ex.avance * (ex.erreur === 'depasse' ? 70 : M.FRONT);
  const echInvisibles = S.uv && !ex.uv;
  const lecture = (() => {
    if (ex.avance < 0.05) return [];
    return voiesEx.map(v => {
      const tl = M.taches(v.especes, ex.eluant).filter(() => S.uv ? ex.uv : true).map(g => ({ d: g.d * frontMm / M.FRONT }));
      return { v, tl };
    });
  })();
  const lancer = () => setEx(s => ({ ...s, avance: 0, anim: true }));
  useEffect(() => {
    if (!ex.anim) return undefined;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setEx(s => ({ ...s, avance: 1, anim: false })); return undefined; }
    let t0 = null, id;
    const pas = t => { if (t0 == null) t0 = t; const a = Math.min(1, (t - t0) / 6000); setEx(s => ({ ...s, avance: a, anim: a < 1 })); if (a < 1) id = requestAnimationFrame(pas); };
    id = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(id);
  }, [ex.anim]);
  const sel = { ...styleChamp };
  const resume = `${S.court} · ${M.echantillon(ex.sit, ex.ech1)?.nom ?? ''} · éluant ${ex.eluant}`;
  const bascRef = r => setEx(s => ({ ...s, refs: s.refs.includes(r) ? s.refs.filter(y => y !== r) : [...s.refs, r] }));
  const changerSit = v => setEx(s => { const SS = M.SITUATIONS[v]; return { ...s, sit: v, ech1: SS.echantillons[v === 'arome' ? 0 : 1].id, ech2: v === 'arome' ? 'natPur' : null, refs: SS.refs.slice(0, 2), co: '', avance: 0, anim: false, uv: false, erreur: 'aucune' }; });
  const reglagesEx = (<>
    <label style={etiquette}>Situation
      <select value={ex.sit} onChange={e => changerSit(e.target.value)} style={sel}>{M.LISTE_SITUATIONS.map(x => <option key={x.id} value={x.id}>{x.titre}</option>)}</select></label>
    <label style={etiquette}>Échantillon à analyser
      <select value={ex.ech1} onChange={e => setEx(s => ({ ...s, ech1: e.target.value, avance: 0, anim: false }))} style={sel}>{S.echantillons.map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}</select></label>
    {ex.sit === 'arome' && <label style={etiquette}>Deuxième échantillon (pour comparer)
      <select value={ex.ech2 || ''} onChange={e => setEx(s => ({ ...s, ech2: e.target.value || null, co: s.co === 'e2' && !e.target.value ? '' : s.co }))} style={sel}><option value="">aucun</option>{S.echantillons.map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}</select></label>}
    <label style={etiquette}>Éluant (le liquide qui monte)
      <select value={ex.eluant} onChange={e => setEx(s => ({ ...s, eluant: Number(e.target.value) }))} style={sel}>{[1, 2].map(e => <option key={e} value={e}>Éluant {e} : {nomEluant(ex.sit, e)}</option>)}</select></label>
    <Section titre={`Références déposées à côté (${refsActives.length})`} ouvert={!!ex.ouv.refs} onBascule={() => ouvrir('refs')}>
      {aide('Une référence est une espèce pure et connue. Cochez celles à déposer : si une tache de l’échantillon est à la même hauteur, elle est peut-être la même espèce.')}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {aRef.map(r => <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 34, fontSize: 14.5, color: KIT.txt }}><input type="checkbox" checked={refsActives.includes(r)} onChange={() => bascRef(r)} style={{ width: 20, height: 20 }} />{M.ESPECES[r].nom}</label>)}
      </div>
      <label style={{ ...etiquette, marginTop: 8 }}>Co-dépôt : l’échantillon et une autre espèce au même endroit
        <select value={coActif || ''} onChange={e => setEx(s => ({ ...s, co: e.target.value }))} style={sel}><option value="">aucun co-dépôt</option>
          {ex.sit === 'arome' && ech2Actif && <option value="e2">échantillon 1 + échantillon 2</option>}{aRef.map(r => <option key={r} value={r}>échantillon 1 + {M.ESPECES[r].nom}</option>)}</select></label>
    </Section>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0' }}>
      <button onClick={lancer} disabled={ex.anim} style={styleBouton(true, '#0369a1')}>▶ Lancer la migration</button>
      <button onClick={() => setEx(s => ({ ...s, avance: 0, anim: false }))} style={styleBouton(false)}><Pic n="refresh" />Recommencer</button>
      {S.uv && <button onClick={() => setEx(s => ({ ...s, uv: !s.uv }))} aria-pressed={ex.uv} style={styleBouton(ex.uv, '#6d28d9')}>{ex.uv ? 'Éteindre la lampe UV' : 'Allumer la lampe UV'}</button>}
    </div>
    <Curseur nom="Durée de la migration" valeur={Math.round(ex.avance * 20 * 10) / 10} onChange={v => setEx(s => ({ ...s, avance: v / 20, anim: false }))} min={0} max={20} pas={0.5} unite="min" decimales={1} couleur="#0369a1" />
    {aide('Le curseur fait monter l’éluant à la main. Le front est le niveau atteint par l’éluant ; chaque espèce monte plus ou moins vite que lui.')}
    <Section titre={`Plus d’options (règle ${ex.regle ? 'affichée' : 'masquée'}, erreur : ${{ aucune: 'aucune', bas: 'dépôt trop bas', concentre: 'dépôt trop concentré', depasse: 'front dépassé' }[ex.erreur]})`} ouvert={!!ex.ouv.plus} onBascule={() => ouvrir('plus')}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 34, fontSize: 14.5, color: KIT.txt }}><input type="checkbox" checked={ex.regle} onChange={() => setEx(s => ({ ...s, regle: !s.regle }))} style={{ width: 20, height: 20 }} />Afficher la règle graduée en cm</label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 34, fontSize: 14.5, color: KIT.txt }}><input type="checkbox" checked={ex.reperes} onChange={() => setEx(s => ({ ...s, reperes: !s.reperes }))} style={{ width: 20, height: 20 }} />Tracer les repères d’alignement de l’échantillon 1</label>
      <label style={{ ...etiquette, marginTop: 6 }}>Simuler une erreur fréquente
        <select value={ex.erreur} onChange={e => setEx(s => ({ ...s, erreur: e.target.value }))} style={sel}>
          <option value="aucune">aucune erreur</option><option value="bas">dépôt trop bas (sous le niveau de l’éluant)</option><option value="concentre">dépôt trop concentré</option><option value="depasse">plaque laissée trop longtemps (front dépassé)</option></select></label>
    </Section>
  </>);
  const mesuresEx = (
    <div style={{ marginTop: 8 }}>
      {ex.erreur === 'bas' ? <LigneMesure nom="Plaque" valeur="aucune tache : dépôts dissous dans l’éluant" couleur={COL.rouge} />
        : ex.avance < 0.05 ? <LigneMesure nom="Plaque" valeur="lancez la migration pour voir les taches" />
        : <>
          <LigneMesure nom="Distance du front" valeur={ex.erreur === 'depasse' ? 'non relevée : le front a atteint le bord' : M.cmFR(frontMm)} couleur={ex.erreur === 'depasse' ? COL.rouge : undefined} />
          {echInvisibles && <LigneMesure nom="Taches" valeur="invisibles : allumez la lampe UV" couleur={COL.orange} />}
          {!echInvisibles && lecture.map(({ v, tl }) => {
            const nom = v.type === 'ref' ? `Référence ${v.lib[1]}` : v.type === 'co' ? `Co-dépôt ${v.lib[1]}` : `Échantillon ${v.lib[1]}`;
            const texte = ex.erreur === 'concentre' ? 'taches étalées : hauteurs illisibles'
              : tl.map(g => `${M.cmFR(g.d)}${ex.erreur === 'depasse' ? '' : ` · R${' '}f${NB}${M.rfFR(g.d, frontMm)}`}`).join(' ; ');
            return <LigneMesure key={v.cle} nom={nom} valeur={texte} />;
          })}
          {!echInvisibles && ex.erreur === 'aucune' && lecture[0] && <LigneMesure nom="Échantillon 1" valeur={`${lecture[0].tl.length} tache${lecture[0].tl.length > 1 ? 's' : ''} : ${M.verdictPurete(lecture[0].tl.length)}`} couleur={COL.vert} />}
        </>}
    </div>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Colorants du bonbon : choisissez l’enrobage marron et lancez la migration. Combien de taches ? Déposez des références pour trouver celles qui sont alignées.</li>
      <li>Passez à l’éluant 2 : l’ordre des taches est-il le même ? Quelle référence est alors la plus haute ?</li>
      <li>Arôme : comparez « arôme de synthèse B » et « extrait naturel purifié », avec un co-dépôt, sous lampe UV. Combien de taches avec l’éluant 1 ? avec l’éluant 2 ?</li>
      <li>Simulez un dépôt trop concentré : que devient la lecture des hauteurs ?</li>
      <li>Mesurez avec la règle : comparez la hauteur lue au calcul de R<sub>f</sub> affiché (complément, non exigé en Seconde).</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>la CCM sépare les espèces d’un mélange : une tache par espèce</li>
        <li>une tache : corps pur probable ; plusieurs taches : mélange</li>
        <li>on dépose des références à côté de l’échantillon, avec la même plaque et le même éluant</li>
        <li>même hauteur : compatible avec la même espèce, sans preuve ; hauteurs différentes : espèces différentes</li>
        <li>R<sub>f</sub> = distance de la tache ÷ distance du front (complément)</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        @media (max-width: 480px) { .cc-scene { padding: 10px 4px !important; } }
        .cc-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .cc-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        @media (min-width: 901px) { .cc-l1.cote .cc-carte { order: 2; } .cc-l1.cote .cc-main { order: 1; } }
        @media (max-width: 900px) { .cc-l1.cote { grid-template-columns: minmax(0, 1fr); } .cc-l1.cote .cc-main { order: 1; } .cc-l1.cote .cc-carte { order: 2; } .cc-hypo-defi { order: 2; } }
        @media (prefers-reduced-motion: no-preference) { .cc-in { animation: cc-fondu 0.35s ease-out; } @keyframes cc-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Chromatographie sur couche mince : identifier et comparer</h2>
        <BoutonsModes mode={mode} setMode={changerMode} />
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>La <strong>chromatographie sur couche mince</strong> (CCM) <strong>sépare</strong> les espèces d’un mélange : chacune forme une <strong>tache</strong>. En comparant avec des <strong>références</strong> déposées à côté, on peut identifier les espèces d’un échantillon.</div>
      {enExplore ? <>
        <div className="cc-scene" style={{ ...styleBoite, marginBottom: 12 }}>
          <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, textAlign: 'center' }} data-resume="1">{resume}</div>
          <PlaqueSvg voies={voiesEx} eluant={ex.eluant} avance={ex.avance} uv={ex.uv} erreur={ex.erreur} regle={ex.regle} reperes={ex.reperes} aria={`Plaque de CCM : ${resume}.`} mouille={false} />
          <div style={{ marginTop: 10 }}>{reglagesEx}</div>
          {mesuresEx}
        </div>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`cc-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="cc-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours} /></div> : enDefi ? <div className="cc-carte cc-hypo-defi">{panneauHypo}</div> : null}
          <div className="cc-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'compo' ? suiviC : suiviI} /></div>}
            {enDefi && defi && <div className="cc-in" key={`${defi.type}${defi.sit ?? ''}${defi.synth ?? ''}${(defi.especes || []).join('')}${defi.eluant ?? ''}`}>{boite(null, sceneDefi)}</div>}
            {enGuide && <div className="cc-in" key={idE}>{sceneGuide}</div>}
          </div>
        </div>
        {enGuide && etape >= IDS.indexOf('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
