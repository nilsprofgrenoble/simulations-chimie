import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, avecIndices, lireNombre, proche, ARetenir, LigneMesure, IndiceDefi, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./chcModele";
import { SCENES } from "./chcScenes";
import { QCM_PARCOURS as Q } from "./chcQcm";
import { MolCarte, CarteReaction, AnimationReaction, SvgCarteAllonger, SvgCarteTypes, SvgCarteOrganoMg, SvgCarteRamifier, SvgCarteRaccourcir, SvgCarteBilan } from "./chcSchemas";

const SIM_ID = 241, CLE_GUIDE = 'chaine-carbonee-tg-guide-v1';
declarerDefis(SIM_ID, [['sequence', 'Construire une séquence'], ['analyse', 'Analyser une modification de chaîne']]);

// ====================================================
//  SIM 241 — MODIFIER LA CHAÎNE CARBONÉE (TG spé PC, « Élaborer des stratégies en synthèse organique »).
//  Capacités visées (jamais affichées à l'élève) : élaborer une séquence réactionnelle de synthèse à partir d'une banque de réactions, en identifiant les réactions
//  qui modifient la chaîne carbonée (allongement, ramification, raccourcissement) ; identifier des réactions d'oxydo-réduction, de substitution, d'addition.
//  Modèle : chcModele.js (test : chcModele.test.mjs) ; animations : chcScenes.js ; schémas : chcSchemas.jsx. Pas de mécanisme détaillé (sim 186), pas de stéréochimie.
// ====================================================

const nbf = (v, d = 1) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const IDS = ['lire', 'allonger', 'types', 'organo', 'g4', 'g5', 'seq1', 'seq2', 'tertiaire', 'coupure', 'rend', 'bilan'];
const UL = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const BG = M.BANQUE;
const reac = id => M.reactionDe(id);
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
const lbSel = { display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 };
const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
const sceneNote = { fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5, marginTop: 4 };
const alerte = { fontSize: 13.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, padding: '4px 8px', marginTop: 4 };

// indice affiché quand un type est mal choisi (retour ciblé)
const INDICE_TYPE = {
  G1: 'L’ion cyanure prend la place de l’atome Br : un groupe en remplace un autre, c’est une substitution.',
  G2: 'LiAlH₄ est un réducteur : c’est une oxydo-réduction.',
  G3: 'Le métal magnésium est oxydé (il cède des électrons) et le carbone lié à Br est réduit : c’est une oxydo-réduction, même sans oxydant ni réducteur cité.',
  G4: 'Le carbone lié à Mg se fixe sur le groupe C=O, dont la double liaison devient simple : c’est une addition.',
  G6: 'Un oxydant est cité : c’est une oxydo-réduction.',
};
const du = nom => M.defini(nom).replace(/^le /, 'du ').replace(/^la /, 'de la ').replace(/^l’/, 'de l’');
const au = nom => M.defini(nom).replace(/^le /, 'au ').replace(/^la /, 'à la ').replace(/^l’/, 'à l’');
const phraseEffet = e => M.EFFETS[e] || '';

// ---------- petits composants ----------
const optReac = () => BG.map(r => <option key={r.id} value={r.id}>{r.id} · {r.nom}</option>);
const notePartenaire = r => (r.partenaire ? `Réactif organique apporté : ${M.NOM_PARTENAIRE[r.partenaire]}. ` : '');

function BanqueCartes({ ouvert = true, titre = 'Banque de réactions' }) {
  return (
    <details open={ouvert} style={{ marginTop: 10 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 14.5, color: KIT.txt }}>{titre} ({BG.length})</summary>
      <div style={{ ...aide, marginTop: 4 }}>Chaque carte montre un exemple : les réactifs et les conditions sont écrits sur la flèche.</div>
      {BG.map(r => (
        <div key={r.id} style={{ border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: '8px 8px 6px', marginBottom: 8, background: '#fff' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{r.id} · {avecIndices(r.nom)}</div>
          <CarteReaction r={r} compact/>
        </div>))}
    </details>);
}

function Constructeur({ depart, cible, suite, setSuite, afficher, lectureSeule = false, verdictVisible = true }) {
  const n = suite.length, d = M.derouler(depart, suite);
  const complet = suite.every(Boolean), atteint = complet && !d.echec && d.finale === cible;
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', alignItems: 'flex-start', marginBottom: 6 }}>
        <MolCarte id={depart} role={`Départ (${M.nbC(depart)} atomes de C)`} L={30}/>
        {cible && <MolCarte id={cible} role={`Cible (${M.nbC(cible)} atomes de C)`} L={30}/>}
      </div>
      {suite.map((v, k) => {
        const pas = d.pas[k], echec = d.echec && d.echec.k === k && v;
        return (
          <div key={k} style={{ border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: '8px 10px', marginBottom: 8, background: '#fff' }}>
            <label style={{ ...lbSel, marginBottom: 4 }}>Étape {k + 1} : réaction de la banque
              <select value={v} disabled={lectureSeule} onChange={e => setSuite(k, e.target.value)} style={{ ...menu, marginTop: 2 }}>
                <option value="">— choisir une réaction —</option>{optReac()}</select></label>
            {afficher && pas && (
              <div style={{ marginTop: 4 }}>
                {notePartenaire(reac(pas.reaction)) && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 2 }}>{notePartenaire(reac(pas.reaction))}</div>}
                <MolCarte id={pas.vers} L={26} role={`Après l’étape ${k + 1}${pas.nbProduits > 1 ? ` (${pas.nbProduits} molécules identiques)` : ''}`}/>
                <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 2 }}>{pas.nbProduits > 1 ? 'Chaque molécule compte' : 'La molécule compte'} {M.nbC(pas.vers)} atomes de carbone ; {phraseEffet(pas.effet)}.</div>
              </div>)}
            {afficher && echec && <div role="status" style={alerte}><strong>Étape impossible.</strong> {verdictVisible ? avecIndices(d.echec.raison) : 'Cette réaction ne se produit pas sur la molécule obtenue à l’étape précédente.'}</div>}
          </div>);
      })}
      {afficher && verdictVisible && cible && complet && !d.echec && (
        <div role="status" aria-live="polite" style={{ fontSize: 14, fontWeight: 700, color: atteint ? '#15803d' : '#b91c1c', lineHeight: 1.5 }}>
          {atteint ? `✓ La cible est atteinte en ${n} étape${n > 1 ? 's' : ''}.` : `✗ La séquence est réalisable, mais elle conduit ${au(M.MOLS[d.finale].nom)}, pas ${au(M.MOLS[cible].nom)}.`}
        </div>)}
    </div>);
}

function Classement({ ids, sel, setSel, verifie, setVerifie }) {
  const rep = id => sel[id] || '';
  return (
    <div>
      {ids.map(id => {
        const r = reac(id), ok = rep(id) === r.type, montre = verifie && rep(id);
        return (
          <div key={id} style={{ border: `1.5px solid ${montre ? (ok ? '#86efac' : '#fdba74') : KIT.bord}`, borderRadius: 10, padding: '8px 8px 6px', marginBottom: 8, background: '#fff' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Réaction {id}</div>
            <CarteReaction r={r} compact/>
            <label style={{ ...lbSel, marginTop: 6, marginBottom: 2 }}>Type de la réaction {id}
              <select value={rep(id)} onChange={e => { setSel(s => ({ ...s, [id]: e.target.value })); setVerifie(false); }} style={{ ...menu, marginTop: 2 }}>
                <option value="">— choisir un type —</option>{M.TYPES.map(o => <option key={o} value={o}>{o}</option>)}</select></label>
            {montre && (ok
              ? <div style={{ fontSize: 13.5, color: '#15803d', fontWeight: 700 }}>✓ Exact.</div>
              : <div style={alerte}><strong>Pas ce type.</strong> {INDICE_TYPE[id]}</div>)}
          </div>);
      })}
      <button type="button" onClick={() => setVerifie(true)} disabled={!ids.every(id => rep(id))} style={{ ...styleBouton(true, '#15803d'), opacity: ids.every(id => rep(id)) ? 1 : 0.5 }}>✓ Vérifier les types</button>
    </div>);
}

// ====================================================
export function SimulationChaineCarbonee() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviS, noterS] = useCompteurDefi(), [suiviA, noterA] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('sequence');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ banque: false, anim: false, essayer: false, retenir: false, mes: false });
  const [cls, setCls] = useState({}), [vCls, setVCls] = useState(false);
  const [seq1, setSeq1] = useState(['', '']), [seq2, setSeq2] = useState(['', '', '']);
  const [ex, setEx] = useState({ depart: 'BrEt', cible: 'Bu2ol', suite: ['', ''], verifie: false, anim: 'G4' });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const etape = guide.etape, idEtape = IDS[Math.min(etape, IDS.length - 1)];
  const majSuite = set => (k, v) => set(s => s.map((x, i) => (i === k ? v : x)));

  const okTypes = vCls && ['G1', 'G2', 'G3'].every(id => cls[id] === reac(id).type);
  const sOk = (dep, cib, suite) => M.bilanSequence(dep, cib, suite).atteint;
  const ok7 = sOk('BrEt', 'Bu2ol', seq1), ok8 = sOk('BrEt', 'Bu2one', seq2);
  const rG = ['G3', 'G4', 'G6'].map(id => reac(id).rendement), vRend = rG.reduce((p, e) => p * e / 100, 1) * 100;
  const note = id => <div style={sceneNote}>Réaction {id} de la banque : {reac(id).reactifs} ; {reac(id).conditions}. {notePartenaire(reac(id))}</div>;

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'lire', titre: 'Une réaction qui change la chaîne carbonée',
      texte: <>Pour fabriquer une molécule, on enchaîne des réactions d’une <strong>banque de réactions</strong>. Certaines ne changent que le groupe caractéristique ; d’autres modifient la <strong>chaîne carbonée</strong>, c’est-à-dire l’enchaînement des atomes de carbone. Regardez l’animation de la réaction G1, avec le bromoéthane : lancez-la, ou faites glisser le curseur, et comparez le début et la fin.</>,
      tache: { type: 'qcm', q: 'Que fait la réaction G1 à la chaîne carbonée du bromoéthane ?', ...Q.lire,
        expl: 'Le carbone du groupe cyano C≡N se lie au carbone qui portait l’atome Br : une liaison C–C se forme, et la chaîne passe de 2 à 3 atomes de carbone. Le groupe qui remplace Br n’est pas « sans carbone » : c’est lui qui prolonge la chaîne. L’atome Br part seul, en ion bromure, sans emporter d’atome de carbone.',
        indice: 'Comptez les atomes de carbone de la molécule organique au début, puis à la fin de l’animation. Que contient le groupe qui prend la place de Br ?' } },
    { id: 'allonger', titre: 'Une réaction qui ne change pas la chaîne',
      retenirTitre: 'Allonger la chaîne d’un atome de carbone', retenir: <>
        <SvgCarteAllonger/>
        <ul style={UL}>
          <li><strong>Une liaison C–C nouvelle allonge la chaîne</strong> ; un simple changement de groupe la laisse inchangée.</li>
          <li>Moyen de s’en souvenir : « <strong>compter les atomes de carbone avant et après</strong> ». Idée fausse : « tout atome ajouté à la molécule allonge la chaîne ». Vrai : seuls les atomes de carbone liés à la chaîne la prolongent.</li>
        </ul></>,
      texte: <>Le produit de G1 est un nitrile. On le traite par la réaction G2, une réduction avec LiAlH₄. Regardez l’animation de G2 : la triple liaison C≡N, puis le groupe obtenu.</>,
      tache: { type: 'qcm', q: 'Que fait la réaction G2 à la chaîne carbonée ?', ...Q.allonger,
        expl: 'La triple liaison C≡N devient une liaison simple C–N et le groupe NH₂ apparaît, mais aucune liaison C–C n’est formée ni rompue : 3 atomes de carbone avant et après. L’atome d’azote appartient au groupe caractéristique, pas à la chaîne carbonée, et le carbone du groupe C≡N reste dans la molécule.',
        indice: 'Y a-t-il, avant et après, le même nombre d’atomes de carbone ? Une liaison C–C a-t-elle été formée ou rompue ?' } },
    { id: 'types', titre: 'Substitution, addition ou oxydo-réduction ?',
      retenirTitre: 'Les trois types de réactions de la banque', retenir: <>
        <SvgCarteTypes/>
        <ul style={UL}>
          <li>Regarder d’abord les <strong>réactifs</strong>, puis <strong>ce qui change</strong> dans la molécule.</li>
          <li>Moyen de s’en souvenir : « <strong>un groupe en remplace un autre, un groupe se fixe, des électrons passent</strong> ». Idée fausse : « une réaction qui forme une liaison C–C est toujours une addition ». Vrai : G1 forme une liaison C–C et c’est une substitution.</li>
        </ul></>,
      texte: <>La banque contient trois types de réactions : la <strong>substitution</strong> (un atome ou un groupe en remplace un autre), l’<strong>addition</strong> (deux groupes se fixent, la double liaison C=O ou C=C devient simple) et l’<strong>oxydo-réduction</strong> (un oxydant ou un réducteur est utilisé, ou un métal cède des électrons). Classez les trois réactions G1, G2 et G3.</>,
      tache: { type: 'action', consigne: 'Associez à chaque réaction son type, puis cliquez sur « Vérifier les types ».', ok: okTypes } },
    { id: 'organo', titre: 'Préparer un carbone qui peut se lier à un autre',
      texte: <>La réaction G3 transforme le bromoéthane en <strong>organomagnésien</strong> avec le magnésium, dans l’éther anhydre. Regardez l’animation : le magnésium s’insère entre le carbone et le brome. Cette étape prépare la suivante, mais voyons ce qu’elle fait à la chaîne.</>,
      tache: { type: 'qcm', q: 'Quel est l’effet de G3 sur la chaîne carbonée du bromoéthane, et son intérêt ?', ...Q.organo,
        expl: 'Le magnésium remplace Br sur le même carbone : aucun atome de carbone n’est ajouté, la chaîne garde 2 atomes de carbone. L’intérêt est ailleurs : le carbone lié à Mg est riche en électrons et peut se lier à un carbone d’une autre molécule, ce qui allonge la chaîne à l’étape suivante.',
        indice: 'Le magnésium prend la place de Br : un atome de carbone est-il ajouté ou retiré ? Pourquoi un carbone lié à Mg est-il utile pour la suite ?' } },
    { id: 'g4', titre: 'Relier deux chaînes : l’organomagnésien et l’éthanal',
      retenirTitre: 'Relier deux squelettes par une liaison C–C', retenir: <>
        <SvgCarteOrganoMg/>
        <ul style={UL}>
          <li>L’organomagnésien se lie au <strong>carbone du groupe C=O</strong> : le produit réunit les deux squelettes ; le nombre d’atomes de carbone est la <strong>somme</strong>.</li>
          <li>Moyen de s’en souvenir : « <strong>R–Br, puis R–MgBr, puis R–C(OH)</strong> » : on passe de 2 à 4 atomes de carbone en deux étapes. Idée fausse : « Mg apporte un atome de carbone ». Vrai : Mg part dans un sel, les atomes de carbone viennent des deux molécules organiques.</li>
        </ul></>,
      texte: <>L’organomagnésien (2 atomes de carbone) réagit avec l’éthanal CH₃CHO (2 atomes de carbone), puis on hydrolyse avec de l’eau acidifiée : c’est la réaction G4. Regardez l’animation, puis comptez les atomes de carbone du produit organique.</>,
      tache: { type: 'num', carnet: false, q: 'Combien d’atomes de carbone le produit organique de G4 compte-t-il ?', unite: 'atomes de C', vrai: 4, tol: 0, affiche: v => nbf(v, 0),
        calcul: () => ['Le carbone lié à Mg se lie au carbone du groupe C=O : les deux squelettes sont réunis.', '2 + 2 = 4 atomes de carbone : c’est le butan-2-ol.'],
        pieges: [[2, 'Vous n’avez compté qu’un seul des deux squelettes : la nouvelle liaison C–C les réunit.'], [3, 'Il manque un atome de carbone : comptez séparément les atomes de carbone de chaque réactif organique, puis additionnez-les.'], [5, 'Vous avez compté un atome de carbone de trop : ni Mg ni l’eau n’en apportent.']],
        expl: '2 + 2 = 4 atomes de carbone : le produit est le butan-2-ol.',
        indice: 'Comptez les atomes de carbone de l’organomagnésien, puis ceux de l’éthanal, et additionnez : la nouvelle liaison C–C réunit les deux squelettes.' } },
    { id: 'g5', titre: 'Ramifier la chaîne : la propanone',
      retenirTitre: 'Ramifier une chaîne', retenir: <>
        <SvgCarteRamifier/>
        <ul style={UL}>
          <li>Une chaîne est <strong>ramifiée</strong> quand un atome de carbone est lié à <strong>trois autres atomes de carbone</strong> ou plus.</li>
          <li>Moyen de s’en souvenir : « <strong>éthanal : droit ; propanone : ramifié</strong> ». Idée fausse : « toute liaison C–C nouvelle ramifie la chaîne ». Vrai : cela dépend du carbone du groupe C=O : il porte déjà deux carbones avec la propanone.</li>
        </ul></>,
      texte: <>On refait la réaction avec la propanone CH₃COCH₃ à la place de l’éthanal (réaction G5). Regardez l’animation : le carbone du groupe C=O porte déjà deux groupes CH₃.</>,
      tache: { type: 'qcm', q: 'Avec la propanone (G5), que dire de la chaîne du produit par rapport à celle obtenue avec l’éthanal (G4) ?', ...Q.ramifie,
        expl: 'Avec la propanone, l’ancien carbone du groupe C=O est lié aux deux groupes CH₃ et au groupe éthyle : un atome de carbone est lié à trois autres atomes de carbone, la chaîne est ramifiée (2-méthylbutan-2-ol, 5 atomes de carbone). Avec l’éthanal, ce carbone n’est lié qu’à deux carbones : la chaîne du butan-2-ol est linéaire. Le groupe –OH n’ajoute pas d’atome de carbone.',
        indice: 'Dans le produit, repérez l’atome de carbone qui porte le groupe –OH : à combien d’atomes de carbone est-il lié ?' } },
    { id: 'seq1', titre: 'Une séquence à deux étapes',
      texte: <>Pour passer d’une molécule de départ à une cible, on <strong>enchaîne</strong> des réactions : le produit de l’une devient le réactif de la suivante, et chaque réaction exige un groupe précis. Partez du bromoéthane et construisez une séquence de 2 étapes qui conduit au butan-2-ol. Conseil : demandez-vous quelle réaction relie deux chaînes de 2 atomes de carbone, et ce qu’il faut avoir avant.</>,
      tache: { type: 'action', consigne: 'Choisissez une réaction pour chaque étape. La molécule obtenue s’affiche ; une étape impossible est signalée.', ok: ok7 } },
    { id: 'seq2', titre: 'Une séquence à trois étapes',
      texte: <>Même exercice, plus long : partez du bromoéthane et construisez une séquence de 3 étapes qui conduit à la butan-2-one. Remontez depuis la cible : par quelle réaction forme-t-on une cétone, et à partir de quel groupe ?</>,
      tache: { type: 'action', consigne: 'Choisissez trois réactions dans l’ordre.', ok: ok8 } },
    { id: 'tertiaire', titre: 'Une réaction qui ne s’applique pas à toutes les molécules',
      texte: <>On veut oxyder le 2-méthylbutan-2-ol, obtenu avec la propanone, en cétone, avec la réaction G6 : la séquence ci-dessous (G3, puis G5, puis G6) est refusée à l’étape 3. Lisez le message.</>,
      tache: { type: 'qcm', q: 'Pourquoi l’étape 3 est-elle impossible ?', ...Q.tertiaire,
        expl: 'Pour former le groupe C=O, le carbone qui porte –OH doit perdre un atome H. Dans le 2-méthylbutan-2-ol, ce carbone est lié à trois autres carbones et n’a aucun atome H : l’alcool tertiaire ne s’oxyde pas en cétone. L’oxydation de G6 ne coupe pas la chaîne, et elle s’applique bien aux alcools secondaires ; le groupe –OH est bien présent.',
        indice: 'Combien d’atomes H porte le carbone du groupe –OH dans le 2-méthylbutan-2-ol ? Et dans le butan-2-ol ?' } },
    { id: 'coupure', titre: 'Raccourcir la chaîne : couper la liaison C=C',
      retenirTitre: 'Raccourcir une chaîne', retenir: <>
        <SvgCarteRaccourcir/>
        <ul style={UL}>
          <li>Un oxydant en excès peut <strong>couper la liaison C=C</strong> : la chaîne se sépare en deux fragments, plus courts.</li>
          <li>Moyen de s’en souvenir : « <strong>C=C coupée, deux morceaux</strong> ». Idée fausse : « une oxydation ne change jamais la chaîne ». Vrai : l’oxydation d’un alcool la laisse inchangée, la coupure oxydante d’un alcène la raccourcit.</li>
        </ul></>,
      texte: <>La réaction G7 oxyde le but-2-ène avec un oxydant en excès, à chaud. Regardez l’animation : la double liaison C=C est le point de coupure.</>,
      tache: { type: 'qcm', q: 'Que devient la chaîne carbonée du but-2-ène dans G7 ?', ...Q.coupure,
        expl: 'La coupure de la liaison C=C sépare la chaîne de 4 atomes de carbone en deux fragments de 2 atomes de carbone, chacun oxydé en acide éthanoïque. La chaîne est raccourcie. L’oxydation d’un alcool (G6), elle, ne change pas la chaîne.',
        indice: 'Regardez ce qui arrive à la double liaison C=C au milieu de la molécule, puis comptez les atomes de carbone de chaque molécule formée.' } },
    { id: 'rend', titre: 'Mesurer une synthèse : le rendement global',
      texte: <>On enchaîne trois étapes du bromoéthane à la butan-2-one : G3, G4 puis G6. Les rendements d’étape sont des données <strong>fournies</strong> (fictives, d’ordre de grandeur plausible) : {rG[0]}{NB}%, {rG[1]}{NB}% et {rG[2]}{NB}%.</>,
      tache: { type: 'num', carnet: false, q: 'Rendement global de la séquence G3, G4, G6 (en %)', unite: '%', vrai: vRend, tol: 0.05, affiche: v => nbf(v, 1),
        calcul: () => ['Les étapes s’enchaînent : on multiplie les rendements écrits sous forme de nombres compris entre 0 et 1.', `η global = 0,85 × 0,70 × 0,85 = 0,506, soit ${nbf(vRend, 1)} %.`],
        pieges: [[80, 'Vous avez fait la moyenne des trois rendements : les étapes s’enchaînent, on multiplie.'], [59.5, 'Vous avez oublié la dernière étape : multipliez aussi par le rendement de G6.'], [70, 'Vous n’avez gardé que le plus petit rendement : la matière perdue aux autres étapes compte aussi.']],
        expl: `η global = 0,85 × 0,70 × 0,85 ≈ ${nbf(vRend, 1)} %.`,
        indice: 'Rendement global = η₁ × η₂ × η₃, avec 85 % = 0,85 ; il est toujours inférieur au plus petit rendement d’étape.' } },
    { id: 'bilan', titre: 'Bilan',
      retenirTitre: 'Effet de chaque réaction sur la chaîne', retenir: <>
        <SvgCarteBilan/>
        <ul style={UL}>
          <li><strong>Inchangé, allongé, ramifié, raccourci</strong> : quatre effets possibles, qu’on lit en comptant les atomes de carbone et en repérant la liaison C–C formée ou rompue.</li>
          <li>Moyen de s’en souvenir : « <strong>compter avant, compter après</strong> ». Idée fausse : « changer de groupe change la chaîne ». Vrai : la chaîne ne change que si une liaison C–C se forme ou se rompt.</li>
        </ul></>,
      texte: <>Vous savez lire l’effet d’une réaction sur la chaîne carbonée (inchangée, allongée, ramifiée, raccourcie), classer les réactions d’une banque, construire une séquence d’un départ à une cible et calculer son rendement global. Passez à l’exploration pour tester d’autres séquences, ou relevez les défis.</>, tache: null },
  ];

  // ---------- scènes du parcours ----------
  const anim = (id) => <><AnimationReaction scene={SCENES[id]} neutre nom={`Réaction ${id} : ${reac(id).nom.toLowerCase()}`}/>{note(id)}</>;
  const sceneGuide = () => {
    switch (idEtape) {
      case 'lire': return anim('G1');
      case 'allonger': return anim('G2');
      case 'types': return <Classement ids={['G1', 'G2', 'G3']} sel={cls} setSel={setCls} verifie={vCls} setVerifie={setVCls}/>;
      case 'organo': return anim('G3');
      case 'g4': return anim('G4');
      case 'g5': return anim('G5');
      case 'seq1': return <><Constructeur depart="BrEt" cible="Bu2ol" suite={seq1} setSuite={majSuite(setSeq1)} afficher/><BanqueCartes ouvert={false}/></>;
      case 'seq2': return <><Constructeur depart="BrEt" cible="Bu2one" suite={seq2} setSuite={majSuite(setSeq2)} afficher/><BanqueCartes ouvert={false}/></>;
      case 'tertiaire': return <Constructeur depart="BrEt" suite={['G3', 'G5', 'G6']} setSuite={() => {}} afficher lectureSeule verdictVisible={false}/>;
      case 'coupure': return anim('G7');
      case 'rend': return <><Constructeur depart="BrEt" cible="Bu2one" suite={['G3', 'G4', 'G6']} setSuite={() => {}} afficher lectureSeule verdictVisible={false}/><div style={sceneNote}>Données fournies : fictives, d’ordre de grandeur plausible (ce ne sont pas des mesures). Rendements : G3 {rG[0]}{NB}%, G4 {rG[1]}{NB}%, G6 {rG[2]}{NB}%.</div></>;
      default: return null;
    }
  };

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'sequence') {
      const cas = M.tirageSequence();
      setDefi({ type, cas, suite: Array(cas.n).fill(''), verifie: false, essais: 0, ok: false });
    } else setDefi({ type, ...M.tirageAnalyse() });
  };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifierDefi = () => {
    const ok = M.bilanSequence(defi.cas.depart, defi.cas.cible, defi.suite).atteint;
    setDefi(d => ({ ...d, verifie: true, essais: d.essais + 1, ok: d.ok || ok })); noterS(ok);
  };
  const voletSequence = defi && defi.type === 'sequence' && (() => {
    const { cas } = defi, sol = M.sequences(cas.depart, cas.cible, cas.n)[0], revele = defi.ok || defi.essais >= 3;
    return (<>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : construire la séquence</div>
      <div style={{ ...lbl, marginBottom: 8 }}>Passez {du(M.MOLS[cas.depart].nom)} {au(M.MOLS[cas.cible].nom)} en <strong>{cas.n} étapes</strong> avec la banque de réactions, puis cliquez sur « Vérifier ».</div>
      <Constructeur depart={cas.depart} cible={cas.cible} suite={defi.suite} setSuite={(k, v) => setDefi(d => ({ ...d, suite: d.suite.map((x, i) => (i === k ? v : x)), verifie: false }))} afficher={defi.verifie}/>
      <IndiceDefi cache={defi.ok}>Comparez le nombre d’atomes de carbone du départ ({M.nbC(cas.depart)}) et de la cible ({M.nbC(cas.cible)}) : quelle réaction relie deux chaînes, ou transforme un groupe ? Remontez depuis la cible pour savoir quel groupe il faut avoir juste avant, puis vérifiez que chaque réaction a bien son groupe de départ.</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={verifierDefi} disabled={!defi.suite.every(Boolean)} style={{ ...styleBouton(true, '#15803d'), opacity: defi.suite.every(Boolean) ? 1 : 0.5 }}>✓ Vérifier la séquence</button>
        <button onClick={() => nouveauDefi('sequence')} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {revele && sol && <div style={{ marginTop: 8, fontSize: 13.5, color: KIT.txt, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, padding: '6px 8px', lineHeight: 1.5 }}>
        {defi.ok ? 'Une séquence qui convient : ' : 'Après trois essais, voici la séquence : '}{sol.map(id => `${id} (${reac(id).nom.toLowerCase()})`).join(', puis ')}.</div>}
    </>);
  })();

  const voletAnalyse = defi && defi.type !== 'sequence' && defi.questions && (
    <>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : analyser une modification de chaîne</div>
      <div style={{ ...lbl, marginBottom: 8 }}>Répondez aux trois questions : comptez les atomes de carbone, dites l’effet d’une réaction sur la chaîne, puis choisissez la réaction qui convient (voir la banque de réactions en exploration).</div>
      {defi.questions.map((q, i) => <QuestionDefi key={`${q.id}-${i}-${q.q}`} n={i + 1} q={q} onEssai={ok => noterA(ok)}/>)}
      <button onClick={() => nouveauDefi('analyse')} style={{ ...styleBouton(false), marginTop: 10 }}><Pic n="refresh"/>Nouveau défi</button>
    </>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['sequence', 'Construire une séquence'], ['analyse', 'Analyser une modification de chaîne']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={typeDefi === t} style={stylePetitBouton(typeDefi === t, '#0369a1')}>{l}</button>)}
      </div>
      {defi.type === 'sequence' ? voletSequence : voletAnalyse}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Modèle construit</strong> : la banque est un modèle simplifié de sept réactions. Chaque réaction a des réactifs, des conditions et un produit organique principal unique : ni réactions parasites, ni mélanges de produits, ni mécanisme (les flèches courbes sont l’objet de la simulation sur les mécanismes). Aucune stéréochimie.</li>
      <li><strong>Banque de réactions</strong> : le programme demande d’élaborer et d’analyser des séquences à partir d’une banque fournie, il n’exige pas de mémoriser ces réactions. L’action des ions cyanure et l’addition d’un organomagnésien sur un composé carbonylé sont ici des exemples de réactions qui forment une liaison C–C. Les ions cyanure sont très toxiques : la simulation ne décrit aucun protocole.</li>
      <li><strong>Classement des réactions</strong> : G1 est classée parmi les substitutions (CN⁻ remplace Br) ; G3, G2, G6 et G7 parmi les oxydo-réductions (le magnésium cède des électrons en G3) ; G4 et G5 parmi les additions (le groupe C=O devient C–O). Ces classements sont des conventions de lecture de la banque.</li>
      <li><strong>Bilans simplifiés</strong> : un oxydant est représenté par des atomes d’oxygène « [O] », un réducteur par des atomes d’hydrogène « [H] », et le sel de magnésium formé en G4 et G5 est écrit Mg(OH)Br. Les atomes et la charge sont conservés ; les équations ne sont pas ajustées en électrons. L’hydrolyse est regroupée avec l’addition d’organomagnésien.</li>
      <li><strong>Ramification</strong> : une chaîne est dite ramifiée quand un atome de carbone est lié à trois autres atomes de carbone au moins. <strong>Alcool tertiaire</strong> : le carbone du groupe –OH n’a aucun atome H, il ne s’oxyde pas dans les conditions de G6. <strong>Coupure oxydante</strong> : en excès d’oxydant, la liaison C=C est coupée ; le but-2-ène, symétrique, donne deux molécules identiques.</li>
      <li><strong>Rendements d’étape</strong> : données fournies, fictives, d’ordre de grandeur plausible. Le rendement global d’une séquence est le produit des rendements d’étape, chaque produit étant isolé puis purifié avant l’étape suivante.</li>
      <li><strong>Animations</strong> : elles montrent les atomes de la chaîne et des groupes concernés ; les mouvements sont schématiques (ils ne représentent ni les trajectoires, ni les vitesses, ni les énergies des particules).</li>
      <li><strong>Hors programme, non traité</strong> : cyclisation, polymérisation (voir la simulation sur les familles et les polymères), mécanismes détaillés, réactions parasites.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const setEx2 = f => setEx(s => { const n = { ...s, ...f, verifie: false }; if (n.cible === n.depart) n.cible = M.MOLS_BANQUE.find(id => id !== n.depart); return n; });
  const dEx = M.derouler(ex.depart, ex.suite), bEx = M.bilanSequence(ex.depart, ex.cible, ex.suite);
  const resume = `${M.MOLS[ex.depart].nom} → ${M.MOLS[ex.cible].nom} · ${ex.suite.length} étape${ex.suite.length > 1 ? 's' : ''}`;
  const boxExplore = (
    <div style={styleBoite}>
      <div style={titreCarte}>Séquence à construire</div>
      <div style={aide}>Choisissez une réaction pour chaque étape : la molécule obtenue et l’effet sur la chaîne s’affichent tout de suite. « Vérifier la séquence » indique si la cible est atteinte.</div>
      <Constructeur depart={ex.depart} cible={ex.cible} suite={ex.suite} setSuite={(k, v) => setEx(s => ({ ...s, suite: s.suite.map((x, i) => (i === k ? v : x)), verifie: false }))} afficher verdictVisible={ex.verifie}/>
      <div style={{ marginTop: 8 }}><button onClick={() => setEx(s => ({ ...s, verifie: true }))} style={styleBouton(true, '#15803d')}>✓ Vérifier la séquence</button></div>
      {ex.verifie && !dEx.echec && ex.suite.every(Boolean) && <div style={{ ...sceneNote, color: bEx.atteint ? '#15803d' : '#b91c1c' }}>{bEx.atteint ? 'Séquence réussie.' : 'La cible n’est pas atteinte.'}</div>}
      {ex.verifie && dEx.echec && <div style={{ ...sceneNote, color: '#b91c1c' }}>La séquence n’est pas réalisable : lisez le message de l’étape signalée.</div>}
    </div>);
  const reglages = (
    <div style={styleBoite} className="chc-ctrl">
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Chaque menu modifie un seul élément : la molécule de départ, la cible ou le nombre d’étapes.</div>
      <label style={lbSel}>Molécule de départ
        <select value={ex.depart} onChange={e => setEx2({ depart: e.target.value, suite: ex.suite.map(() => '') })} style={{ ...menu, marginTop: 2 }}>{M.MOLS_BANQUE.map(id => <option key={id} value={id}>{M.MOLS[id].nom}</option>)}</select></label>
      <label style={lbSel}>Molécule cible
        <select value={ex.cible} onChange={e => setEx2({ cible: e.target.value })} style={{ ...menu, marginTop: 2 }}>{M.MOLS_BANQUE.filter(id => id !== ex.depart).map(id => <option key={id} value={id}>{M.MOLS[id].nom}</option>)}</select></label>
      <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 4 }}>Nombre d’étapes : {ex.suite.length}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        <button type="button" aria-label="Retirer une étape" disabled={ex.suite.length <= 1} onClick={() => setEx2({ suite: ex.suite.slice(0, -1) })} style={{ ...stylePetitBouton(false), minWidth: 44, minHeight: 40 }}>−</button>
        <button type="button" aria-label="Ajouter une étape" disabled={ex.suite.length >= 4} onClick={() => setEx2({ suite: [...ex.suite, ''] })} style={{ ...stylePetitBouton(false), minWidth: 44, minHeight: 40 }}>+</button>
        <button type="button" onClick={() => setEx({ depart: 'BrEt', cible: 'Bu2ol', suite: ['', ''], verifie: false, anim: ex.anim })} style={stylePetitBouton(false)}><Pic n="refresh"/>Rétablir</button>
      </div>
      <div style={aide}>« Rétablir » remet le départ, la cible et les étapes à leur valeur de départ.</div>
    </div>);
  const comptes = [ex.depart, ...dEx.pas.map(p => p.vers)];
  const mesures = (
    <div style={styleBoite}>
      <Section titre={`Mesures : rendement global = ${dEx.rendementGlobal == null ? '—' : nbf(dEx.rendementGlobal, 0) + ' %'}`} ouvert={ouv.mes} onBascule={() => setOuv(o => ({ ...o, mes: !o.mes }))}>
        <div style={aide}>{resume}.</div>
        <LigneMesure nom="Atomes de carbone, du départ à la fin" valeur={comptes.map(id => M.nbC(id)).join(' → ')}/>
        <LigneMesure nom="Rendement global (étapes réalisées)" valeur={dEx.rendementGlobal == null ? '—' : `${nbf(dEx.rendementGlobal, 0)}${NB}%`}/>
        <LigneMesure nom="Étapes réalisables" valeur={`${dEx.pas.length} sur ${ex.suite.length}`}/>
        <div style={{ ...aide, marginTop: 8 }}>Rendement global = produit des rendements des étapes. Les rendements d’étape sont des données fournies (fictives, ordre de grandeur plausible) : {BG.map(r => `${r.id} ${r.rendement} %`).join(', ')}.</div>
      </Section>
    </div>);
  const banqueExplore = (<div style={styleBoite}><Section titre="Banque de réactions et exemples" ouvert={ouv.banque} onBascule={() => setOuv(o => ({ ...o, banque: !o.banque }))}><BanqueCartes/></Section></div>);
  const animExplore = (
    <div style={styleBoite}>
      <Section titre={`Animation d’une réaction : ${ex.anim}`} ouvert={ouv.anim} onBascule={() => setOuv(o => ({ ...o, anim: !o.anim }))}>
        <label style={lbSel}>Réaction de la banque
          <select value={ex.anim} onChange={e => setEx(s => ({ ...s, anim: e.target.value }))} style={{ ...menu, marginTop: 2 }}>{optReac()}</select></label>
        <AnimationReaction scene={SCENES[ex.anim]} nom={`${ex.anim} : ${reac(ex.anim).nom.toLowerCase()}`}/>
        {note(ex.anim)}
      </Section>
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Du bromoéthane au 2-méthylbutan-2-ol : combien d’étapes faut-il ? Et pour atteindre la butan-2-one ?</li>
        <li>Essayez d’appliquer l’oxydation G6 au 2-méthylbutan-2-ol : quel message obtenez-vous, et pourquoi ?</li>
        <li>Du bromoéthane au propan-1-amine : par quelles étapes passe-t-on ? Que devient le nombre d’atomes de carbone à chaque étape ?</li>
        <li>Lancez les animations de G4 et de G5 : en quoi les deux produits diffèrent-ils ? Comptez les atomes de carbone.</li>
        <li>Quelles réactions de la banque laissent la chaîne inchangée ? Lesquelles l’allongent ? Laquelle la raccourcit ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Chaîne carbonée : elle ne change que si une liaison C–C se forme (allongement, ramification) ou se rompt (raccourcissement)</li>
          <li>Organomagnésien + groupe C=O : liaison C–C nouvelle, nombre d’atomes de carbone du produit = somme des deux squelettes</li>
          <li>Ramifiée : un atome de carbone lié à trois autres atomes de carbone</li>
          <li>Types : substitution (un groupe en remplace un autre), addition (un groupe se fixe sur C=O), oxydo-réduction (électrons)</li>
          <li>Rendement global = produit des rendements d’étape</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .chc-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .chc-col { display: flex; flex-direction: column; gap: 12px; }
        .chc-l1 .chc-carte { order: 1; } .chc-l1 .chc-main { order: 2; }
        .chc-df { display: block; margin-bottom: 12px; } .chc-df > * { margin-bottom: 12px; }
        @media (min-width: 901px) { .chc-l1 { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); } .chc-l1 .chc-carte { order: 2; } .chc-l1 .chc-main { order: 1; }
          .chc-df { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .chc-df > * { margin-bottom: 0; } .chc-df-volet { grid-column: 1; grid-row: 1; } .chc-df-hypo { grid-column: 2; grid-row: 1; } }
        .chc-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .chc-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .chc-ex > * { grid-column: 1; } .chc-ex > .chc-ctrl { grid-column: 2; grid-row: 1 / span 6; } }
        @media (prefers-reduced-motion: no-preference) { .chc-in { animation: chc-fondu 0.35s ease-out; } @keyframes chc-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Modifier la chaîne carbonée</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Avec une banque de réactions : voir une réaction allonger, ramifier ou raccourcir une chaîne carbonée (animations), classer les réactions, construire une séquence de synthèse et calculer son rendement global.</div>
      {enGuide && <div className="chc-l1">
        <div className="chc-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div>
        <div className="chc-main"><div className="chc-col">
          {idEtape !== 'bilan' && <div className="chc-in" key={'s-' + idEtape}><div style={styleBoite}>{sceneGuide()}</div></div>}
        </div></div>
      </div>}
      {enDefi && defi && <div className="chc-df">
        <div className="chc-df-volet"><div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type === 'sequence' ? 'sequence' : 'analyse'}`} etat={defi.type === 'sequence' ? suiviS : suiviA}/></div></div>
        <div className="chc-df-hypo">{panneauHypo}</div>
      </div>}
      {enExplore && <div className="chc-ex">
        <div>{boxExplore}</div>
        <div className="chc-ctrl">{reglages}</div>
        <div>{mesures}</div>
        <div>{animExplore}</div>
        <div>{banqueExplore}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && idEtape === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}

// ====================================================
//  Question de défi : réponse numérique ou QCM, indice, retour sur la dernière réponse, correction après une réussite ou 3 essais faux
// ====================================================
function QuestionDefi({ n, q, onEssai }) {
  const [rep, setRep] = useState(q.type === 'num' ? '' : null), [essais, setEssais] = useState(0), [ok, setOk] = useState(false), [verifie, setVerifie] = useState(false);
  const juge = () => (q.type === 'num' ? (() => { const x = lireNombre(rep); return isFinite(x) && proche(x, q.vrai, q.tol); })() : rep === q.bonne);
  const valider = () => { if (rep === null || rep === '') return; const j = juge(); setVerifie(true); setEssais(e => e + 1); if (j) setOk(true); onEssai(j); };
  const piege = () => { if (q.type !== 'num') return null; const x = lireNombre(rep); if (!isFinite(x)) return 'Entrez une valeur numérique (virgule ou point).'; const pg = (q.pieges || []).find(([v]) => proche(x, v, Math.max(q.tol, 0.04))); return pg ? pg[1] : null; };
  const revele = ok || essais >= 3, jugeMaintenant = verifie && juge();
  return (
    <div style={{ borderTop: `1px solid ${KIT.bord}`, paddingTop: 8, marginTop: 8 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, lineHeight: 1.5, marginBottom: 6 }}>{n}. {indicesProfond(q.q)}</div>
      {q.type === 'num'
        ? <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 14, marginBottom: 6 }}>
          <input value={rep} aria-label={`Réponse à la question ${n}`} inputMode="decimal" onKeyDown={e => e.key === 'Enter' && valider()} onChange={e => { setRep(e.target.value); setVerifie(false); }}
            style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${verifie ? (jugeMaintenant ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{q.unite}</span></div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 6 }}>{q.options.map((t, k) => <button key={k} onClick={() => { setRep(k); setVerifie(false); }} aria-pressed={rep === k}
          style={{ ...stylePetitBouton(rep === k, '#0ea5e9'), textAlign: 'left', padding: '6px 10px', fontSize: 14 }}>{avecIndices(t)}</button>)}</div>}
      <IndiceDefi cache={ok}>{q.indice}</IndiceDefi>
      <div style={{ marginTop: 6 }}><button onClick={valider} disabled={ok} style={styleBouton(true, '#15803d')}>✓ Vérifier</button></div>
      {verifie && <div role="status" aria-live="polite" style={{ marginTop: 6, fontSize: 14, fontWeight: 700, color: jugeMaintenant ? '#15803d' : '#b91c1c' }}>
        {jugeMaintenant ? '✓ Correct.' : '✗ Pas tout à fait.'}{!jugeMaintenant && piege() && <div style={{ fontWeight: 400, fontSize: 13.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, padding: '4px 8px', marginTop: 4 }}>{avecIndices(piege())}</div>}</div>}
      {revele && <div style={{ marginTop: 6, fontSize: 13.5, color: KIT.txt, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, padding: '6px 8px', lineHeight: 1.5 }}>{indicesProfond(q.expl)}</div>}
    </div>);
}
