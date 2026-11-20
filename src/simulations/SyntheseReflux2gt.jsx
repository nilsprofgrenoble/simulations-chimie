import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, ARetenir, IndiceDefi, ExempleResolu, OngletExercices, Curseur } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./syntheseReflux2gtModele";
import * as G from "./syntheseReflux2gtGeometrie";
import { QCM } from "./syntheseReflux2gtQcm";
import { MontageSvg, PlaqueBananeSvg, SceneSynthese, SceneChauffage, COL, Pastille, styleChamp } from "./SyntheseReflux2gtScenes";
import { FicheSynthese, FicheReflux, FicheMontage, FicheSecurite, FicheBrut, FicheLimite } from "./SyntheseReflux2gtFiches";

const SIM_ID = 204, CLE_GUIDE = 'syn-2gt-guide-v1';
declarerDefis(SIM_ID, [['montage', 'Le montage à reflux est-il correct ?'], ['identite', 'L’arôme de synthèse est-il identique à l’arôme de banane ?']]);

// ====================================================
//  SIM 204 — SYNTHÈSE D'UNE ESPÈCE NATURELLE : MONTAGE À REFLUX ET CCM (2GT spé PC, « Synthèse d'une espèce chimique présente dans la nature »).
//  Une seule idée : fabriquer l'arôme de banane (acétate d'isoamyle, un ester) avec un montage à reflux, puis le comparer à l'arôme naturel par CCM.
//  Prérequis : 179 (équation de réaction), 195 (changement d'état), 197 (CCM en détail). Suite : 1G 109 (chalcone), 1G 112 (ampoule à décanter).
//  Parcours (12 étapes) : ester (1), chauffer (1), vapeurs qui s'échappent (1), assemblage (1), eau (1), reflux (1), haut ouvert (1), légende (1), sécurité (1), CCM du brut (1), identique ? (1), bilan.
//  Capacités visées (jamais affichées à l'élève) : réaliser le schéma légendé d'un montage à reflux ; mettre en œuvre un montage à reflux pour synthétiser une espèce présente dans la nature ;
//  établir qu'une espèce synthétisée peut être identique à une espèce naturelle (CCM, avec réserve). Hors programme : la limitation de la réaction (flèche simple en 2GT), la masse volumique (en VAL/REA seulement).
// ====================================================

const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const boite = (titre, corps, extra = {}) => (
  <div className="sy-scene" style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
const aide = t => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{t}</div>;
const renvoi = <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>↓ La question de cette étape est juste en dessous.</div>;
const etiquette = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 };
const NB = M.NB;
const PINS = { ballon: 1, chauffe: 2, support: 3, refrigerant: 4, entree: 5, sortie: 6 };
const ORDRE_BOUTONS = ['refrigerant', 'chauffe', 'pince', 'support', 'ballon'];
const MONTAGE_GUIDE = { ...M.MONTAGE_CORRECT, marche: false };
const Ligne = ({ nom, valeur, couleur }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '2px 12px', padding: '6px 0', borderBottom: `1px dashed ${KIT.bord}`, fontSize: 14, lineHeight: 1.5 }}>
    <span style={{ color: KIT.txt2, fontWeight: 600 }}>{nom}</span><span style={{ color: couleur || KIT.txt, fontWeight: 700, textAlign: 'right', marginLeft: 'auto' }}>{valeur}</span>
  </div>);
const check = { display: 'flex', alignItems: 'center', gap: 8, minHeight: 36, fontSize: 14.5, color: KIT.txt };

function fabriquerDefi(type, prec) {
  if (type === 'montage') return { ...M.tirerDefiMontage(prec && prec.type === 'montage' ? prec : null), rep: [], verifie: false };
  const d = M.tirerDefiIdentite(prec && prec.type === 'identite' ? prec : null), ordre = Object.keys(M.CHOIX_IDENTITE).map(k => [Math.random(), k]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  return { ...d, ordre, rep: '', verifie: false };
}

export function SimulationSyntheseReflux() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviM, noterM] = useCompteurDefi(), [suiviI, noterI] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(() => (mode === 'defi' ? fabriquerDefi('montage', null) : null)), [typeDefi, setTypeDefi] = useState('montage');
  const [hypoOuv, setHypoOuv] = useState(() => mode === 'defi');
  const [gs, setGs] = useState({ montage: M.MONTAGE_VIDE, msg: '', eau: 'aucune', msgEau: '', pins: {} });
  const [ex, setEx] = useState({ partie: 'montage', m: { ...M.MONTAGE_CORRECT, marche: false }, legendes: true, ech1: 'pur', ech2: 'nat', refs: ['alcool'], co: false, eluant: 1, avance: 0, anim: false, reperes: false, ouv: {} });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  // ---------- étapes du parcours ----------
  const IDS = ['ester', 'chauffer', 'fuite', 'assembler', 'eau', 'reflux', 'ouvert', 'legende', 'secu', 'brut', 'identique', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const pinsOk = Object.keys(PINS).every(k => gs.pins[k] === k);
  const complet = M.montageComplet(gs.montage);
  const poser = id => setGs(g => { const r = M.essaiPiece(g.montage, id); return { ...g, montage: r.montage, msg: r.message }; });
  const ETAPES = [
    { id: 'ester', titre: 'Fabriquer l’arôme de banane', focus: ['scene'],
      texte: <>L’odeur de banane vient d’une espèce chimique, l’<strong>acétate d’isoamyle</strong>, un <strong>ester</strong> (une famille d’espèces à odeur de fruit ; « acétate » est un autre nom de « éthanoate », le nom qui vient de l’acide éthanoïque). On sait la fabriquer au laboratoire : on <strong>mélange</strong> de l’alcool isoamylique et de l’acide éthanoïque, avec quelques gouttes d’un acide, le <strong>catalyseur</strong> (il aide la transformation sans être consommé), et on chauffe. Les espèces mises au départ sont les <strong>réactifs</strong> ; celles qui se forment sont les <strong>produits</strong>. En Seconde on écrit une flèche simple ; en réalité il peut rester des réactifs à la fin (voir étape 10).
        <ExempleResolu>On brûle du carbone : carbone + dioxygène → dioxyde de carbone. Les réactifs sont le carbone et le dioxygène, le produit est le dioxyde de carbone.</ExempleResolu>
        À vous : la synthèse de l’arôme de banane.</>,
      tache: { type: 'qcm', ...QCM.ester } },
    { id: 'chauffer', titre: 'Pourquoi chauffer ?', focus: ['scene'],
      texte: <>On chauffe le mélange. Pour comprendre pourquoi, on suit la quantité d’ester formé au cours du temps, pour un mélange laissé à 20{NB}°C et pour un mélange chauffé (schéma qualitatif : il n’y a pas de valeurs).
        <ExempleResolu>Deux courbes de remplissage : la baignoire A monte vite jusqu’à 100 L, la baignoire B monte lentement jusqu’à 150 L. Méthode : on lit d’abord où chaque courbe finit (100 L et 150 L : pas la même quantité), puis laquelle monte le plus vite (A).</ExempleResolu>
        À vous : lisez les deux courbes.</>,
      tache: { type: 'qcm', ...QCM.chauffer } },
    { id: 'fuite', titre: 'Chauffer dans un ballon ouvert', focus: ['scene'],
      texte: <>Le <strong>ballon</strong> est un flacon en verre à fond rond. On le pose dans un <strong>chauffe-ballon</strong> qui le chauffe sans flamme. Le mélange se met à bouillir : des vapeurs se forment.
        <ExempleResolu>Une casserole d’eau qui bout avec un couvercle : la vapeur est arrêtée par le couvercle et le niveau de l’eau ne baisse presque pas. Méthode : on se demande ce qui arrête la vapeur, ou non.</ExempleResolu>
        À vous : le ballon de la synthèse est resté ouvert.</>,
      tache: { type: 'qcm', ...QCM.fuite },
      retenirTitre: 'Fabriquer un ester',
      retenir: <><FicheSynthese />
        <ul style={liste}>
          <li><strong>Phrase-clé : les réactifs sont au départ, les produits sont formés.</strong> Ici : acide + alcool donnent un ester + de l’eau.</li>
          <li><strong>Idée fausse</strong> : « chauffer donne plus d’ester ». <strong>Vrai</strong> : chauffer fait aller plus vite, le résultat final ne change pas.</li>
        </ul>{renvoi}</> },
    { id: 'assembler', titre: 'Construire le montage, pièce par pièce', focus: ['scene'],
      texte: <>Pour ne rien perdre, on ajoute un <strong>réfrigérant</strong> : un tube vertical entouré d’une enveloppe, la gaine, où circule de l’eau froide. On le pose sur le ballon. Un montage se construit <strong>dans l’ordre</strong> : une pièce ne se pose que si ce qui la tient est déjà en place. Choisissez la pièce à poser. Les pièces sont : le support (une tige verticale sur un socle, la potence), le chauffe-ballon, le ballon avec le mélange et la pierre ponce (des petits grains qui rendent l’ébullition régulière), la pince qui tient le col du ballon, et le réfrigérant.</>,
      tache: { type: 'action', ok: complet, consigne: 'Posez les cinq pièces dans le bon ordre.' } },
    { id: 'eau', titre: 'Brancher l’eau du réfrigérant', focus: ['scene'],
      texte: <>Le réfrigérant a <strong>deux tuyaux</strong> : un par lequel l’eau froide <strong>entre</strong> dans la gaine, l’autre par lequel elle <strong>sort</strong>. Pour bien refroidir, l’eau doit être froide <strong>tout le long</strong> du tube. Choisissez par où l’eau entre : par le haut ou par le bas.</>,
      tache: { type: 'action', ok: gs.eau === 'bas', consigne: 'Branchez l’eau de façon que toute la gaine se remplisse.' } },
    { id: 'reflux', titre: 'Le reflux', focus: ['scene'],
      texte: <>Le chauffage est allumé et l’eau circule. Le montage s’appelle un <strong>montage à reflux</strong>. Observez le tube : les flèches orange sont les <strong>vapeurs</strong> qui montent.
        <ExempleResolu>Un miroir qu’on vient de chauffer au sèche-cheveux ne se couvre pas de buée : la vapeur d’eau reste un gaz. Méthode : on compare la température de la paroi à celle de la vapeur.</ExempleResolu>
        À vous : regardez ce qui se passe dans le tube du réfrigérant.</>,
      tache: { type: 'qcm', ...QCM.reflux } },
    { id: 'ouvert', titre: 'Un montage bouché', focus: ['scene'],
      texte: <>Un élève bouche le haut du réfrigérant avec un bouchon, « pour que rien ne sorte ». Les vapeurs, elles, se liquéfient dans le tube et ne montent pas jusqu’en haut.
        <ExempleResolu>Une bouteille d’eau ouverte, laissée au soleil, ne gonfle pas : l’air qu’elle contient peut sortir. Méthode : on regarde si le gaz peut s’échapper (récipient ouvert) ou non (récipient fermé).</ExempleResolu>
        À vous : le montage bouché.</>,
      tache: { type: 'qcm', ...QCM.ouvert },
      retenirTitre: 'Le principe du reflux',
      retenir: <><FicheReflux />
        <ul style={liste}>
          <li><strong>Phrase-clé : vapeurs qui montent, refroidies, gouttes qui retombent.</strong> Reflux = rien n’est perdu.</li>
          <li><strong>Idée fausse</strong> : « l’eau du réfrigérant refroidit en se mélangeant aux vapeurs ». <strong>Vrai</strong> : l’eau circule dans la gaine, autour du tube, sans toucher le mélange.</li>
        </ul>{renvoi}</> },
    { id: 'legende', titre: 'Légender le schéma du montage', focus: ['scene'],
      texte: <>Voici le montage complet, ouvert à l’air en haut. Un <strong>schéma légendé</strong> donne le nom de chaque élément. Associez chaque pastille numérotée à sa légende (une des légendes proposées ne sert pas).</>,
      tache: { type: 'action', ok: pinsOk, consigne: 'Choisissez la légende de chaque pastille.' } },
    { id: 'secu', titre: 'La sécurité', focus: ['scene'],
      texte: <>Les vapeurs de ce mélange sont <strong>irritantes</strong> et <strong>inflammables</strong>, et le verre devient chaud. Ce montage se fait <strong>au laboratoire, avec le professeur</strong> : jamais seul, jamais à la maison.</>,
      tache: { type: 'qcm', ...QCM.secu },
      retenirTitre: 'Le montage à reflux légendé',
      retenir: <><FicheMontage />
        <ul style={liste}>
          <li><strong>Phrase-clé : l’eau entre en bas, sort en haut ; le haut reste ouvert.</strong> Ballon, chauffe-ballon, support, réfrigérant à eau.</li>
          <li><strong>Idée fausse</strong> : « on bouche le haut pour garder les vapeurs ». <strong>Vrai</strong> : le reflux les garde, un montage fermé est dangereux.</li>
        </ul>{renvoi}</> },
    { id: 'brut', titre: 'Le produit est-il pur ?', focus: ['scene'],
      texte: <>La synthèse est finie. Pour examiner le produit brut, on fait une <strong>CCM</strong> (voir la simulation sur la chromatographie sur couche mince) : on dépose le produit brut et deux <strong>références</strong> (des espèces pures et connues : l’alcool isoamylique et l’ester naturel). La plaque trempe dans un liquide, l’<strong>éluant</strong>, qui monte et entraîne les espèces à des hauteurs différentes. Les hauteurs de taches sont inventées pour la simulation. Les espèces sont incolores : on <strong>révèle</strong> la plaque avec des vapeurs de diiode (sous la hotte, par le professeur) : les taches deviennent brunes.
        <ExempleResolu>L’encre d’un feutre vert donne deux taches, une jaune et une bleue : c’est un mélange de deux colorants.</ExempleResolu>
        À vous : le produit brut.</>,
      tache: { type: 'qcm', ...QCM.brut },
      retenirTitre: 'La sécurité',
      retenir: <><FicheSecurite />
        <ul style={liste}>
          <li><strong>Phrase-clé : protéger, aspirer, éloigner la flamme, ne pas boucher.</strong></li>
          <li><strong>Idée fausse</strong> : « un ballon chauffé ne risque rien tant qu’il y a de l’eau ». <strong>Vrai</strong> : vapeurs inflammables et verre chaud : lunettes, hotte, surveillance.</li>
        </ul>{renvoi}</> },
    { id: 'identique', titre: 'Arôme de synthèse ou arôme naturel ?', focus: ['scene'],
      texte: <>Après purification (on a éliminé l’alcool qui restait), l’arôme de synthèse est déposé à côté de l’<strong>arôme extrait de la banane</strong>, sur la même plaque et avec le même éluant. On dépose aussi les deux au même endroit : un <strong>co-dépôt</strong>. Les hauteurs se lisent à 1{NB}mm près.
        <ExempleResolu>Deux encres bleues de feutres donnent des taches à des hauteurs différentes : ce ne sont pas les mêmes colorants.</ExempleResolu>
        À vous : l’arôme de synthèse et l’arôme de banane.</>,
      tache: { type: 'qcm', ...QCM.identique },
      retenirTitre: 'La CCM d’un produit brut',
      retenir: <><FicheBrut />
        <ul style={liste}>
          <li><strong>Phrase-clé : une tache de plus que la référence, c’est une espèce de plus.</strong></li>
          <li><strong>Idée fausse</strong> : « le produit de synthèse est toujours pur ». <strong>Vrai</strong> : il reste souvent des réactifs, on le vérifie par CCM.</li>
        </ul>{renvoi}</> },
    { id: 'bilan', titre: 'Le bilan', focus: ['scene'],
      texte: <>On fabrique l’arôme de banane en chauffant l’alcool isoamylique et l’acide éthanoïque dans un <strong>montage à reflux</strong> : les vapeurs se refroidissent dans le réfrigérant et retombent dans le ballon. L’eau entre en bas, sort en haut ; le haut reste <strong>ouvert</strong> ; on travaille avec lunettes, blouse et hotte. Une <strong>CCM</strong> compare l’arôme de synthèse à l’arôme naturel : même hauteur, une seule tache : ils <strong>peuvent</strong> être identiques, avec cet éluant, sans preuve. Vous pouvez maintenant explorer ou relever un défi.</>,
      tache: null,
      retenirTitre: 'Même hauteur : pas une preuve',
      retenir: <><FicheLimite />
        <ul style={liste}>
          <li><strong>Phrase-clé : même hauteur, compatible mais pas prouvé ; hauteurs différentes, espèces différentes.</strong></li>
          <li><strong>Idée fausse</strong> : « taches alignées = identiques, c’est prouvé ». <strong>Vrai</strong> : deux espèces peuvent monter pareil ; on confirme avec un autre éluant.</li>
        </ul></> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = (type, prec = defi) => setDefi(fabriquerDefi(type, prec));
  function changerMode(md) { setMode(md); if (md === 'defi') setHypoOuv(true); if (md === 'defi' && !defi) nouveauDefi(typeDefi, null); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t, null); }
  const verifier = () => {
    if (defi.type === 'montage') { const v = M.verifierMontage(defi, defi.rep.filter(x => x !== 'aucune')); setDefi(d => ({ ...d, verifie: true, ok: v.ok, v })); noterM(v.ok); }
    else { const ok = M.reponseJusteIdentite(defi, defi.rep); setDefi(d => ({ ...d, verifie: true, ok })); noterI(ok); }
  };
  const messageMontage = d => {
    if (d.ok) return d.fautes.length ? `✓ Correct : ${d.fautes.map(f => M.FAUTES[f]).join(' ; ')}. ${d.fautes.map(f => M.CONSEQUENCE[f]).join(' ')}` : '✓ Correct : ce montage n’a aucun défaut.';
    const dits = [d.v.enTrop.length ? `vous avez signalé un défaut qui n’existe pas (${d.v.enTrop.length})` : null, d.v.manque.length ? 'il reste au moins un défaut non signalé' : null].filter(Boolean);
    return `✗ À revoir : ${dits.join(' ; ')}. Regardez le haut du réfrigérant, les tuyaux d’eau, le fond du ballon et la pince.`;
  };
  const messageIdentite = d => (d.ok ? `✓ Correct : ${M.MESSAGES_IDENTITE[d.bonne]}` : `✗ ${d.rep === 'prouve' ? M.MESSAGES_IDENTITE.prouve : 'Comptez les taches de chaque voie et comparez les hauteurs avec la règle : la tache de l’arôme de synthèse est-elle seule, et à la hauteur de celle de l’arôme de banane ?'}`);
  const bascule = f => setDefi(x => { let rep; if (f === 'aucune') rep = x.rep.includes('aucune') ? [] : ['aucune']; else { rep = x.rep.filter(y => y !== 'aucune'); rep = rep.includes(f) ? rep.filter(y => y !== f) : [...rep, f]; if (f === 'eauHaut') rep = rep.filter(y => y !== 'sansEau'); if (f === 'sansEau') rep = rep.filter(y => y !== 'eauHaut'); } return { ...x, rep, verifie: false }; });
  const champDefiMontage = d => (
    <>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Voici un montage de chauffage à reflux <strong>en fonctionnement</strong>. Dans un montage correct, le ballon contient des grains de pierre ponce (petits grains gris au fond). Cochez les défauts que vous voyez (il peut n’y en avoir aucun).</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
        {d.ordre.map(f => <label key={f} style={check}><input type="checkbox" checked={d.rep.includes(f)} onChange={() => bascule(f)} style={{ width: 20, height: 20 }} />{M.FAUTES[f]}</label>)}
        <label style={{ ...check, borderTop: `1px solid ${KIT.bord}`, paddingTop: 4 }}><input type="checkbox" checked={d.rep.includes('aucune')} onChange={() => bascule('aucune')} style={{ width: 20, height: 20 }} />aucun défaut : le montage est correct</label>
      </div>
      <IndiceDefi cache={false}>Suivez le trajet de l’eau avec les flèches bleues (par où entre-t-elle ?), regardez si le haut du tube est ouvert, si des grains gris sont au fond du ballon, et si une pince tient le ballon.</IndiceDefi>
    </>);
  const champDefiIdentite = d => (
    <>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Un laboratoire a préparé un <strong>arôme de synthèse</strong>. On le compare à l’<strong>arôme extrait de la banane</strong>, sur la même plaque, révélée au diiode, avec l’éluant « {M.ELUANTS[d.eluant].nom} ». Les hauteurs se lisent à 1{NB}mm près. Quelle conclusion est justifiée ?</div>
      <div role="radiogroup" aria-label="Votre conclusion" style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
        {d.ordre.map(k => <button key={k} role="radio" aria-checked={d.rep === k} onClick={() => setDefi(x => ({ ...x, rep: k, verifie: false }))} style={{ ...stylePetitBouton(d.rep === k, '#0369a1'), textAlign: 'left', padding: '7px 10px', fontSize: 14 }}>{M.CHOIX_IDENTITE[k]}</button>)}
      </div>
      <IndiceDefi cache={false}>Comptez les taches de la voie « synthèse », puis comparez leur hauteur à celle de la tache de la voie « banane », avec la règle. Des taches alignées sont compatibles avec la même espèce, sans le prouver ; une tache en plus est une espèce en plus.</IndiceDefi>
    </>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['montage', 'Le montage'], ['identite', 'Synthèse ou nature ?']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target" />{defi.type === 'montage' ? 'Défi : le montage à reflux est-il correct ?' : 'Défi : l’arôme de synthèse est-il identique à l’arôme de banane ?'}</div>
      {defi.type === 'montage' ? champDefiMontage(defi) : champDefiIdentite(defi)}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={verifier} disabled={defi.type === 'identite' ? !defi.rep : defi.rep.length === 0} style={{ ...styleBouton(true, '#15803d'), opacity: (defi.type === 'identite' ? !defi.rep : defi.rep.length === 0) ? 0.5 : 1 }}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh" />Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>{defi.type === 'montage' ? messageMontage(defi) : messageIdentite(defi)}</div>}
    </div>);
  const voiesDefi = d => { const l = ['synthèse', 'de labo']; return [{ ...M.voieEch(d.synth), lib: l }, M.voieEch('nat'), { ...M.voieCo(d.synth, 'nat'), lib: ['co-dép.', ''] }]; };
  const sceneDefi = defi && (defi.type === 'montage'
    ? <MontageSvg montage={defi.montage} legendes={['ballon', 'chauffe', 'refrigerant']} aria="Un montage de chauffage à reflux en fonctionnement : à vous de repérer les défauts éventuels." />
    : <PlaqueBananeSvg voies={voiesDefi(defi)} eluant={defi.eluant} avance={1} regle aria={`Plaque révélée au diiode avec l’éluant ${defi.eluant} : arôme de synthèse, arôme de banane et co-dépôt.`} />);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Schéma non à l’échelle</strong> : les proportions du montage sont simplifiées ; seuls l’ordre des pièces, le sens de l’eau et le trajet des vapeurs sont fidèles.</li>
      <li><strong>Flèche simple</strong> : en Seconde on écrit « acide + alcool → ester + eau ». En réalité cette transformation est <strong>limitée</strong> : il reste des réactifs à la fin (le produit brut contient encore de l’alcool). Vous le verrez en Première.</li>
      <li><strong>Chauffer accélère, sans changer le résultat</strong> : le schéma des deux courbes est qualitatif, sans valeurs.</li>
      <li><strong>L’eau entre par le bas</strong> : la gaine du réfrigérant reste ainsi entièrement remplie d’eau.</li>
      <li><strong>Des taches à la même hauteur ne prouvent pas</strong> : elles sont compatibles avec la même espèce dans cet éluant. Des hauteurs différentes prouvent des espèces différentes (voir la simulation 197 sur la CCM).</li>
      <li><strong>Valeurs inventées</strong> : les hauteurs des taches, les éluants et les échantillons sont choisis pour la simulation (ordres de grandeur réalistes, pas des mesures). L’arôme naturel est supposé déjà purifié.</li>
      <li><strong>Sécurité</strong> : lunettes, blouse, hotte, aucune flamme, haut jamais bouché ; vapeurs de diiode sous la hotte, par le professeur. Ne jamais reproduire ce montage seul ou à la maison.</li>
      <li><strong>Au-delà du parcours</strong> : la purification (lavage, décantation : voir la simulation 112 de Première) et le calcul du rendement ne sont pas traités ici.</li>
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
            {['bouchon', 'entree', 'ballon', 'support', 'sortie', 'chauffe', 'refrigerant'].map(k => <option key={k} value={k}>{M.NOMS_LEGENDES[k]}</option>)}
          </select>
          {gs.pins[id] ? <span aria-hidden="true" style={{ fontWeight: 800, color: gs.pins[id] === id ? '#15803d' : '#dc2626' }}>{gs.pins[id] === id ? '✓' : '✗'}</span> : null}
        </label>))}
    </div>);
  const assemblage = (
    <>
      <MontageSvg montage={gs.montage} aria="Un montage en cours de construction sur la paillasse." />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        {ORDRE_BOUTONS.filter(id => !gs.montage[id]).map(id => <button key={id} onClick={() => poser(id)} style={stylePetitBouton(false, '#0369a1')}>Poser {M.PIECES.find(p => p.id === id).nom}</button>)}
        {complet && <span style={{ fontWeight: 700, color: '#15803d', alignSelf: 'center' }}>✓ Montage assemblé</span>}
        {gs.montage.support && <button onClick={() => setGs(g => ({ ...g, montage: M.MONTAGE_VIDE, msg: '' }))} style={styleBouton(false)}><Pic n="refresh" />Recommencer</button>}
      </div>
      {gs.msg && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, color: KIT.txt, lineHeight: 1.5 }}>{gs.msg}</div>}
    </>);
  const branchement = (
    <>
      <MontageSvg montage={{ ...MONTAGE_GUIDE, eau: gs.eau }} aria="Un montage à reflux éteint ; le réfrigérant est vide ou rempli d’eau selon le branchement choisi." />
      <div role="group" aria-label="Entrée d’eau" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        {[['haut', 'L’eau entre par le haut'], ['bas', 'L’eau entre par le bas']].map(([v, l]) => <button key={v} onClick={() => setGs(g => ({ ...g, eau: v, msgEau: v === 'bas' ? 'La gaine est entièrement remplie d’eau : elle refroidit sur toute sa hauteur.' : 'L’eau tombe sans remplir toute la gaine : il reste de l’air en haut et le refroidissement est mauvais.' }))} aria-pressed={gs.eau === v} style={stylePetitBouton(gs.eau === v, '#0369a1')}>{l}</button>)}
      </div>
      {gs.msgEau && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, color: gs.eau === 'bas' ? '#15803d' : '#b45309', lineHeight: 1.5 }}>{gs.msgEau}</div>}
    </>);
  const voiesBrut = [M.voieEch('brut'), M.voieRef('alcool'), M.voieEch('nat')];
  const voiesIdent = [M.voieEch('pur'), M.voieEch('nat'), { ...M.voieCo('pur', 'nat'), lib: ['co-dép.', ''] }];
  const sceneGuide = (() => {
    switch (idE) {
      case 'ester': return boite('Du mélange à l’arôme', <SceneSynthese />, cadre('scene'));
      case 'chauffer': return boite('La quantité d’ester au cours du temps', <SceneChauffage />, cadre('scene'));
      case 'fuite': return boite('Un ballon chauffé, resté ouvert', <MontageSvg montage={{ ...M.MONTAGE_VIDE, chauffe: true, ballon: true, marche: true }} legendes={['ballon', 'chauffe']} aria="Un ballon posé dans un chauffe-ballon allumé. Rien n’est posé sur le col du ballon." />, cadre('scene'));
      case 'assembler': return boite('La paillasse', assemblage, cadre('scene'));
      case 'eau': return boite('Le branchement de l’eau', branchement, cadre('scene'));
      case 'reflux': return boite('Le montage en fonctionnement', <MontageSvg montage={M.MONTAGE_CORRECT} legendes={['vapeurs']} aria="Un montage à reflux en fonctionnement : le mélange bout, des flèches orange et des gouttes bleues sont dessinées dans le tube, sans légende." />, cadre('scene'));
      case 'ouvert': return boite('Le haut du réfrigérant est bouché', <MontageSvg montage={{ ...MONTAGE_GUIDE, bouchon: true }} aria="Un montage à reflux éteint dont le haut du réfrigérant est fermé par un bouchon." />, cadre('scene'));
      case 'legende': return boite('Le montage à reflux complet', <><MontageSvg montage={MONTAGE_GUIDE} pins={PINS} legendes={Object.keys(PINS)} aria="Un montage à reflux complet avec six pastilles numérotées à légender." />{selectsPins}</>, cadre('scene'));
      case 'secu': return boite('Un montage en fonctionnement', <MontageSvg montage={M.MONTAGE_CORRECT} aria="Un montage à reflux en fonctionnement, au laboratoire." />, cadre('scene'));
      case 'brut': return boite('Le produit brut et deux références', <PlaqueBananeSvg voies={voiesBrut} eluant={1} avance={1} regle aria="Plaque révélée au diiode : le produit brut, une référence alcool isoamylique et une référence arôme de banane, avec une règle graduée en centimètres." />, cadre('scene'));
      case 'identique': return boite('Arôme de synthèse, arôme de banane et co-dépôt', <PlaqueBananeSvg voies={voiesIdent} eluant={1} avance={1} regle aria="Plaque révélée au diiode : l’arôme de synthèse purifié, l’arôme extrait de la banane et le co-dépôt des deux, avec une règle graduée." />, cadre('scene'));
      case 'bilan': return boite('Le montage à reflux légendé', <MontageSvg montage={M.MONTAGE_CORRECT} legendes={G.IDS_LEGENDES} aria="Le montage à reflux complet et légendé." />, cadre('scene'));
      default: return null;
    }
  })();

  // ════════════════ EXPLORATION ════════════════
  const ouvrir = k => setEx(s => ({ ...s, ouv: { ...s.ouv, [k]: !s.ouv[k] } }));
  const sel = { ...styleChamp };
  const m = ex.m, setM = f => setEx(s => ({ ...s, m: { ...s.m, ...f } }));
  const diag = M.diagnostic(m);
  const resumeM = `${m.marche ? 'chauffage allumé' : 'chauffage éteint'} · ${m.refrigerant ? `réfrigérant, eau ${{ aucune: 'absente', bas: 'par le bas', haut: 'par le haut' }[m.eau] || ''}` : 'sans réfrigérant'}${m.bouchon ? ' · haut bouché' : ''}`;
  const reglagesMontage = (<>
    <label style={etiquette}>Chauffage
      <select value={m.marche ? '1' : '0'} onChange={e => setM({ marche: e.target.value === '1' })} style={sel}><option value="0">éteint</option><option value="1">allumé : le mélange bout</option></select></label>
    <label style={etiquette}>Réfrigérant
      <select value={m.refrigerant ? '1' : '0'} onChange={e => setM({ refrigerant: e.target.value === '1', ...(e.target.value === '0' ? { eau: 'aucune', bouchon: false } : {}) })} style={sel}><option value="1">posé sur le ballon</option><option value="0">absent : ballon ouvert</option></select></label>
    {m.refrigerant && <label style={etiquette}>Eau dans le réfrigérant
      <select value={m.eau} onChange={e => setM({ eau: e.target.value })} style={sel}><option value="bas">entre par le bas, sort par le haut</option><option value="haut">entre par le haut, sort par le bas</option><option value="aucune">ne circule pas</option></select></label>}
    <Section titre={`Autres réglages (haut ${m.bouchon ? 'bouché' : 'ouvert'}, pierre ponce ${m.pierre ? 'oui' : 'non'}, pince ${m.pince ? 'oui' : 'non'})`} ouvert={!!ex.ouv.autres} onBascule={() => ouvrir('autres')}>
      {aide('Chacun de ces réglages simule un oubli ou une erreur : regardez ce que dit le panneau « Ce qui se passe ».')}
      {m.refrigerant && <label style={check}><input type="checkbox" checked={m.bouchon} onChange={() => setM({ bouchon: !m.bouchon })} style={{ width: 20, height: 20 }} />boucher le haut du réfrigérant</label>}
      <label style={check}><input type="checkbox" checked={m.pierre} onChange={() => setM({ pierre: !m.pierre })} style={{ width: 20, height: 20 }} />pierre ponce dans le ballon</label>
      <label style={check}><input type="checkbox" checked={m.pince} onChange={() => setM({ pince: !m.pince })} style={{ width: 20, height: 20 }} />pince qui tient le ballon</label>
      <label style={check}><input type="checkbox" checked={ex.legendes} onChange={() => setEx(s => ({ ...s, legendes: !s.legendes }))} style={{ width: 20, height: 20 }} />afficher les légendes</label>
    </Section>
  </>);
  const mesuresMontage = (
    <div style={{ marginTop: 8 }}>
      <Ligne nom="Vapeurs" valeur={{ aucune: 'pas de chauffage', sechappent: 'elles s’échappent : matière perdue, danger', partiel: 'une partie s’échappe', retombent: 'elles retombent dans le ballon (reflux)' }[diag.vapeurs]} couleur={diag.vapeurs === 'retombent' ? COL.vert : diag.vapeurs === 'aucune' ? undefined : COL.rouge} />
      <Ligne nom="Pression" valeur={diag.pression ? 'monte : montage fermé, danger' : 'celle de la pièce'} couleur={diag.pression ? COL.rouge : COL.vert} />
      <Ligne nom="Ébullition" valeur={diag.ebullition === 'aucune' ? 'pas d’ébullition' : diag.ebullition === 'reguliere' ? 'régulière' : 'par à-coups : projections possibles'} couleur={diag.ebullition === 'saccadee' ? COL.rouge : undefined} />
      <Ligne nom="Maintien" valeur={diag.maintien ? 'le montage tient' : 'sans pince : le montage peut tomber'} couleur={diag.maintien ? undefined : COL.rouge} />
    </div>);
  // CCM
  const refsActives = ex.refs.filter(r => r !== undefined), voiesEx = [M.voieEch(ex.ech1), ...(ex.ech2 ? [M.voieEch(ex.ech2)] : []), ...(ex.co && ex.ech2 ? [M.voieCo(ex.ech1, ex.ech2)] : []), ...refsActives.slice(0, 2).map(M.voieRef)];
  const frontMm = ex.avance * M.FRONT;
  const lancer = () => { const reduit = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; setEx(s => ({ ...s, avance: reduit ? 1 : 0, anim: !reduit })); };
  useEffect(() => {
    if (!ex.anim) return undefined;
    let t0 = null, id;
    const pas = t => { if (t0 == null) t0 = t; const a = Math.min(1, (t - t0) / 5000); setEx(s => ({ ...s, avance: a, anim: a < 1 })); if (a < 1) id = requestAnimationFrame(pas); };
    id = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(id);
  }, [ex.anim]);
  const bascRef = r => setEx(s => ({ ...s, refs: s.refs.includes(r) ? s.refs.filter(y => y !== r) : [...s.refs, r] }));
  const reglagesCcm = (<>
    <label style={etiquette}>Échantillon à analyser
      <select value={ex.ech1} onChange={e => setEx(s => ({ ...s, ech1: e.target.value, avance: 0, anim: false }))} style={sel}>{['brut', 'pur', 'autre'].map(k => <option key={k} value={k}>{M.ECHANTILLONS[k].nom}</option>)}</select></label>
    <label style={etiquette}>Comparer avec
      <select value={ex.ech2 || ''} onChange={e => setEx(s => ({ ...s, ech2: e.target.value || null, co: e.target.value ? s.co : false }))} style={sel}><option value="">rien</option><option value="nat">{M.ECHANTILLONS.nat.nom}</option></select></label>
    <label style={etiquette}>Éluant (le liquide qui monte)
      <select value={ex.eluant} onChange={e => setEx(s => ({ ...s, eluant: Number(e.target.value) }))} style={sel}>{[1, 2].map(e => <option key={e} value={e}>Éluant {e} : {M.ELUANTS[e].nom}</option>)}</select></label>
    <Section titre={`Références (${ex.refs.length}) et co-dépôt`} ouvert={!!ex.ouv.refs} onBascule={() => ouvrir('refs')}>
      {aide('Une référence est une espèce pure et connue : une tache à sa hauteur est compatible avec elle. Le co-dépôt met les deux échantillons au même endroit.')}
      {Object.keys(M.ESPECES_CCM).map(r => <label key={r} style={check}><input type="checkbox" checked={ex.refs.includes(r)} onChange={() => bascRef(r)} style={{ width: 20, height: 20 }} />{M.ESPECES_CCM[r].nom}</label>)}
      {ex.ech2 && <label style={check}><input type="checkbox" checked={ex.co} onChange={() => setEx(s => ({ ...s, co: !s.co }))} style={{ width: 20, height: 20 }} />co-dépôt des deux échantillons</label>}
    </Section>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0' }}>
      <button onClick={lancer} disabled={ex.anim} style={styleBouton(true, '#0369a1')}>▶ Lancer la migration</button>
      <button onClick={() => setEx(s => ({ ...s, avance: 0, anim: false }))} style={styleBouton(false)}><Pic n="refresh" />Recommencer</button>
    </div>
    <Curseur nom="Durée de la migration" valeur={Math.round(ex.avance * 20 * 10) / 10} onChange={v => setEx(s => ({ ...s, avance: v / 20, anim: false }))} min={0} max={20} pas={0.5} unite="min" decimales={1} couleur="#0369a1" />
    {aide('Le curseur fait monter l’éluant à la main. Les espèces sont incolores : la plaque est révélée au diiode (taches brunes).')}
  </>);
  const mesuresCcm = (
    <div style={{ marginTop: 8 }}>
      {ex.avance < 0.05 ? <Ligne nom="Plaque" valeur="lancez la migration pour voir les taches" />
        : <>
          <Ligne nom="Distance du front" valeur={M.cmFR(frontMm)} />
          {voiesEx.map(v => <Ligne key={v.cle} nom={v.type === 'ref' ? `Référence ${v.lib[1]}` : v.type === 'co' ? 'Co-dépôt' : `Voie ${v.lib.join(' ')}`} valeur={M.taches(v.especes, ex.eluant).map(g => M.cmFR(g.d * frontMm / M.FRONT)).join(' ; ')} />)}
          <div style={{ fontSize: 14, lineHeight: 1.5, color: KIT.txt, padding: '6px 0', borderBottom: `1px dashed ${KIT.bord}` }}><strong>Voie {M.ECHANTILLONS[ex.ech1].court.join(' ')} :</strong> <span style={{ color: COL.vert, fontWeight: 700 }}>{M.nbTaches(M.ECHANTILLONS[ex.ech1].especes, ex.eluant)} tache(s), {M.verdictPurete(M.nbTaches(M.ECHANTILLONS[ex.ech1].especes, ex.eluant))}</span></div>
          {ex.ech2 && <div style={{ fontSize: 14, lineHeight: 1.5, color: KIT.txt, padding: '6px 0' }}><strong>Comparaison avec l’arôme de banane :</strong> <span style={{ color: COL.orange, fontWeight: 700 }}>{{ probable: 'même(s) hauteur(s) : compatible, pas prouvé', diff: 'aucune tache alignée : espèces différentes', melange: 'une tache de plus : le produit n’est pas pur' }[M.verdictComparaison(ex.ech1, ex.ech2, ex.eluant)]}</span></div>}
        </>}
    </div>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Montage : retirez le réfrigérant et allumez le chauffage. Que deviennent les vapeurs ? Remettez-le, faites entrer l’eau par le haut : la gaine est-elle pleine ?</li>
      <li>Bouchez le haut du réfrigérant : que dit le panneau « Ce qui se passe » de la pression ?</li>
      <li>Retirez la pierre ponce : quel est l’effet sur l’ébullition ?</li>
      <li>CCM : comparez « produit brut » et « arôme extrait de la banane » avec l’éluant 1 puis l’éluant 2. Combien de taches ? Sont-elles aux mêmes hauteurs ?</li>
      <li>Comparez « arôme de synthèse d’un autre laboratoire » à l’arôme de banane : que conclure ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>le chauffage à reflux : vapeurs qui montent, refroidies dans le réfrigérant, gouttes qui retombent</li>
        <li>l’eau entre en bas, sort en haut ; le haut du réfrigérant reste ouvert à l’air</li>
        <li>lunettes, blouse, hotte, aucune flamme, jamais seul</li>
        <li>CCM : une tache de plus, c’est une espèce de plus</li>
        <li>même hauteur : compatible, pas prouvé ; hauteurs différentes : espèces différentes</li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div className="sy-root" style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        @media (max-width: 480px) { .sy-scene { padding: 8px 0 !important; } .sy-root { padding-left: 6px !important; padding-right: 6px !important; } }
        .sy-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .sy-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        @media (min-width: 901px) { .sy-l1.cote .sy-carte { order: 2; } .sy-l1.cote .sy-main { order: 1; } }
        @media (max-width: 900px) { .sy-l1.cote { grid-template-columns: minmax(0, 1fr); } .sy-l1.cote .sy-main { order: 1; } .sy-l1.cote .sy-carte { order: 2; } .sy-hypo-defi { order: 2; } }
        @media (prefers-reduced-motion: no-preference) { .sy-in { animation: sy-fondu 0.35s ease-out; } @keyframes sy-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Synthèse d’une espèce naturelle : montage à reflux et CCM</h2>
        <BoutonsModes mode={mode} setMode={changerMode} />
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>On <strong>fabrique</strong> l’arôme de banane avec un <strong>montage à reflux</strong>, puis on le <strong>compare</strong> à l’arôme naturel par chromatographie sur couche mince. Le schéma est simplifié (non à l’échelle) et les valeurs de la CCM sont inventées.</div>
      {enExplore ? <>
        <div className="sy-scene" style={{ ...styleBoite, marginBottom: 12 }}>
          <label style={etiquette}>Étudier
            <select value={ex.partie} onChange={e => setEx(s => ({ ...s, partie: e.target.value }))} style={sel}><option value="montage">Le montage à reflux</option><option value="ccm">La comparaison par CCM</option></select></label>
          {ex.partie === 'montage' ? <>
            <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, textAlign: 'center' }} data-resume="1">{resumeM}</div>
            <MontageSvg montage={m} legendes={ex.legendes ? G.IDS_LEGENDES : []} aria={`Montage à reflux : ${resumeM}.`} />
            <div style={{ marginTop: 10 }}>{reglagesMontage}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginTop: 6 }}>Ce qui se passe</div>
            {mesuresMontage}
          </> : <>
            <PlaqueBananeSvg voies={voiesEx} eluant={ex.eluant} avance={ex.avance} regle reperes={ex.reperes} aria={`Plaque de CCM, éluant ${ex.eluant}.`} />
            <div style={{ marginTop: 10 }}>{reglagesCcm}</div>
            {mesuresCcm}
          </>}
        </div>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`sy-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="sy-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours} /></div> : enDefi ? <div className="sy-carte sy-hypo-defi">{panneauHypo}</div> : null}
          <div className="sy-main">
            {enDefi && defi && <div className="sy-in" key={`${defi.type}${defi.cle}`}>{boite(null, sceneDefi)}</div>}
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'montage' ? suiviM : suiviI} /></div>}
            {enGuide && <div className="sy-in" key={idE}>{sceneGuide}</div>}
          </div>
        </div>
        {enGuide && etape >= IDS.indexOf('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
