import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, avecIndices, lireNombre, proche, ARetenir, LigneMesure, IndiceDefi, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./strModele";
import { QCM_PARCOURS as Q } from "./strQcm";
import { MolCarte, CarteReaction, SvgCarteTypes, SvgCarteSequence, SvgCarteProtection, SvgCarteRendementGlobal, SvgCarteLeviers } from "./strSchemas";

const SIM_ID = 210, CLE_GUIDE = 'strategie-synthese-tg-guide-v1';
declarerDefis(SIM_ID, [['sequence', 'Construire une séquence'], ['analyse', 'Protection ou voie écoresponsable']]);

// ====================================================
//  SIM 210 — STRATÉGIE DE SYNTHÈSE MULTI-ÉTAPES, PROTECTION, SYNTHÈSE ÉCORESPONSABLE (TG spé PC, « Élaborer des stratégies en synthèse organique »).
//  Capacités visées (jamais affichées à l'élève) : élaborer une séquence réactionnelle à partir d'une banque de réactions ; identifier des réactions d'oxydo-réduction,
//  acide-base, de substitution, d'addition, d'élimination ; identifier des étapes de protection / déprotection et justifier leur intérêt ; discuter l'impact
//  environnemental d'une synthèse et proposer des améliorations à l'aide de données fournies.
//  Modèle : strModele.js (test : strModele.test.mjs). Pas de mécanisme détaillé (sim 186), pas de stéréochimie, pas d'économie d'atomes.
// ====================================================

const nbf = (v, d = 1) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const IDS = ['lire', 'redox', 'types', 'type', 'seq1', 'seq2', 'fragile', 'prot', 'ident', 'eco1', 'eco2', 'eco3', 'bilan'];
const UL = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const BG = M.BANQUE_GENERALE, BP = M.BANQUE_PROTECTION;
const reac = (banque, id) => M.reactionDe(banque, id);
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
const lbSel = { display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 };
const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
const sceneNote = { fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5, marginTop: 4 };
const tdS = { border: `1px solid ${KIT.bord}`, padding: '5px 6px', textAlign: 'left', fontSize: 13.5, color: KIT.txt, verticalAlign: 'top' };
const thS = { ...tdS, fontWeight: 700, background: '#f1f5f9' };

// indice affiché quand un type est mal choisi (retour ciblé)
const INDICE_TYPE = {
  R1: 'Un oxydant (ions permanganate ou dichromate) est cité : c’est une oxydo-réduction.',
  R2: 'Un oxydant est cité : c’est une oxydo-réduction.',
  R3: 'Un oxydant est cité : c’est une oxydo-réduction.',
  R4: 'NaBH₄ est un réducteur : c’est une oxydo-réduction.',
  R5: 'L’ion hydroxyde HO⁻ (une base) capte un ion H⁺ de l’acide : c’est une réaction acide-base.',
  R6: 'Le groupe –OH de l’acide est remplacé par le groupe –OCH₂CH₃ (de l’eau se forme) : c’est une substitution.',
  R7: 'L’atome Br est remplacé par le groupe –OH, même si HO⁻ est une base : c’est une substitution.',
  R8: 'La double liaison C=C disparaît et les atomes H et Br s’ajoutent : c’est une addition.',
  R9: 'Une double liaison C=C apparaît et une molécule d’eau est éliminée : c’est une élimination.',
};

// ---------- petits composants ----------
const optReac = (banque) => banque.map(r => <option key={r.id} value={r.id}>{r.id} · {r.nom}</option>);

function BanqueCartes({ banque, ouvert = true, titre = 'Banque de réactions' }) {
  return (
    <details open={ouvert} style={{ marginTop: 10 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 14.5, color: KIT.txt }}>{titre} ({banque.length})</summary>
      <div style={{ ...aide, marginTop: 4 }}>Chaque carte montre un exemple : le réactif et les conditions sont écrits sur la flèche.</div>
      {banque.map(r => (
        <div key={r.id} style={{ border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: '8px 8px 6px', marginBottom: 8, background: '#fff' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{r.id} · {avecIndices(r.nom)}</div>
          <CarteReaction r={r} banque={banque} compact/>
        </div>))}
    </details>);
}

function Constructeur({ banque, depart, cible, suite, setSuite, afficher, lectureSeule = false, verdictVisible = true }) {
  const n = suite.length, d = M.derouler(banque, depart, suite);
  const complet = suite.every(Boolean), atteint = complet && !d.echec && d.finale === cible;
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', alignItems: 'flex-start', marginBottom: 6 }}>
        <MolCarte id={depart} role="Départ" L={30}/>
        <MolCarte id={cible} role="Cible" L={30}/>
      </div>
      {suite.map((v, k) => {
        const pas = d.pas[k], echec = d.echec && d.echec.k === k && v;
        return (
          <div key={k} style={{ border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: '8px 10px', marginBottom: 8, background: '#fff' }}>
            <label style={{ ...lbSel, marginBottom: 4 }}>Étape {k + 1} : réaction de la banque
              <select value={v} disabled={lectureSeule} onChange={e => setSuite(k, e.target.value)} style={{ ...menu, marginTop: 2 }}>
                <option value="">— choisir une réaction —</option>{optReac(banque)}</select></label>
            {afficher && pas && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                <MolCarte id={pas.vers} L={26} role={`Après l’étape ${k + 1}`}/>
                {pas.co.length > 0 && <div style={{ fontSize: 13.5, color: KIT.txt2 }}>autre produit : {pas.co.map(c => M.defini(M.nomEspece(c))).join(', ')}</div>}
              </div>)}
            {afficher && pas && pas.remarque && <div style={{ fontSize: 13.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, padding: '4px 8px', marginTop: 4 }}>{avecIndices(pas.remarque)}</div>}
            {afficher && echec && <div role="status" style={{ fontSize: 13.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, padding: '4px 8px', marginTop: 4 }}><strong>Étape impossible.</strong> {avecIndices(d.echec.raison)}</div>}
          </div>);
      })}
      {afficher && verdictVisible && complet && !d.echec && (
        <div role="status" aria-live="polite" style={{ fontSize: 14, fontWeight: 700, color: atteint ? '#15803d' : '#b91c1c', lineHeight: 1.5 }}>
          {atteint ? `✓ La cible est atteinte en ${n} étape${n > 1 ? 's' : ''}.` : `✗ La séquence est réalisable, mais elle conduit à ${M.defini(M.MOLS[d.finale].nom)}, pas à ${M.defini(M.MOLS[cible].nom)}.`}
        </div>)}
    </div>);
}

function Classement({ banque, ids, options, sel, setSel, verifie, setVerifie }) {
  const rep = id => sel[id] || '';
  return (
    <div>
      {ids.map(id => {
        const r = reac(banque, id), ok = rep(id) === r.type, montre = verifie && rep(id);
        return (
          <div key={id} style={{ border: `1.5px solid ${montre ? (ok ? '#86efac' : '#fdba74') : KIT.bord}`, borderRadius: 10, padding: '8px 8px 6px', marginBottom: 8, background: '#fff' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Réaction {id}</div>
            <CarteReaction r={r} banque={banque} compact/>
            <label style={{ ...lbSel, marginTop: 6, marginBottom: 2 }}>Type de la réaction {id}
              <select value={rep(id)} onChange={e => { setSel(s => ({ ...s, [id]: e.target.value })); setVerifie(false); }} style={{ ...menu, marginTop: 2 }}>
                <option value="">— choisir un type —</option>{options.map(o => <option key={o} value={o}>{o}</option>)}</select></label>
            {montre && (ok
              ? <div style={{ fontSize: 13.5, color: '#15803d', fontWeight: 700 }}>✓ Exact.</div>
              : <div style={{ fontSize: 13.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, padding: '4px 8px' }}><strong>Pas ce type.</strong> {INDICE_TYPE[id]}</div>)}
          </div>);
      })}
      <button type="button" onClick={() => setVerifie(true)} disabled={!ids.every(id => rep(id))} style={{ ...styleBouton(true, '#15803d'), opacity: ids.every(id => rep(id)) ? 1 : 0.5 }}>✓ Vérifier les types</button>
    </div>);
}

const dureeTexte = h => `${nbf(h, 0)}${NB}h`;
function TableVoie({ v, titre = v.nom, dechets = true }) {
  const ligne = (nom, f) => <tr><th scope="row" style={thS}>{nom}</th>{v.etapes.map((e, k) => <td key={k} style={tdS}>{f(e)}</td>)}</tr>;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{titre}</div>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead><tr><th style={thS}></th>{v.etapes.map((e, k) => <th key={k} style={thS}>Étape {k + 1} : {e.nom.toLowerCase().replace('oxydation de l’éthanol en acide éthanoïque', 'oxydation')}</th>)}</tr></thead>
        <tbody>
          {ligne('Réactif ou catalyseur', e => e.reactif)}
          {ligne('Solvant', e => e.solvant)}
          {ligne('Température', e => `${e.T}${NB}°C`)}
          {ligne('Durée', e => dureeTexte(e.duree))}
          {ligne('Rendement de l’étape', e => `${e.eta}${NB}%`)}
          {dechets && ligne('Déchets (kg par kg d’ester)', e => <>{nbf(e.dechets, 1)}{NB}kg : {e.dechetsNature}</>)}
          {ligne('Danger principal', e => e.danger)}
        </tbody>
      </table>
    </div>);
}

// ====================================================
export function SimulationStrategieSynthese() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviS, noterS] = useCompteurDefi(), [suiviA, noterA] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('sequence');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ banque: false, voies: false, essayer: false, retenir: false });
  // parcours : états locaux des étapes interactives (les étapes réussies restent réussies grâce à l'état persistant du parcours)
  const [cls2, setCls2] = useState({}), [v2, setV2] = useState(false), [cls3, setCls3] = useState({}), [v3, setV3] = useState(false);
  const [seq1, setSeq1] = useState(['', '']), [seq2, setSeq2] = useState(['', '', '']), [seqP, setSeqP] = useState(['', '', '']);
  const [ex, setEx] = useState({ banque: 'generale', depart: 'C', cible: 'E', suite: ['', ''], verifie: false, v1: 'A', v2: 'A' });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const etape = guide.etape, idEtape = IDS[Math.min(etape, IDS.length - 1)];
  const majSuite = (set) => (k, v) => set(s => s.map((x, i) => (i === k ? v : x)));

  const bonsTypes = (banque, ids, sel, verifie) => verifie && ids.every(id => sel[id] === reac(banque, id).type);
  const ok2 = bonsTypes(BG, ['R1', 'R2', 'R3', 'R4', 'R5'], cls2, v2), ok3 = bonsTypes(BG, ['R6', 'R7', 'R8', 'R9'], cls3, v3);
  const sOk = (banque, dep, cib, suite) => M.bilanSequence(banque, dep, cib, suite).atteint;
  const ok4 = sOk(BG, 'C', 'E', seq1), ok5 = sOk(BG, 'A', 'D', seq2), ok8 = sOk(BP, 'Q', 'T', seqP);
  const V = { A: M.VOIES.A, B: M.VOIES.B };
  const eA = V.A.etapes, gA = M.rendementGlobal(V.A);

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'lire', titre: 'Lire une réaction de la banque',
      texte: <>Pour fabriquer une molécule, on s’appuie sur une <strong>banque de réactions</strong> : pour chaque réaction, elle donne un exemple, les réactifs et les conditions (sur la flèche). Voici la première réaction de la banque, R1.</>,
      tache: { type: 'qcm', q: 'Que fait la réaction R1 à la molécule ?', ...Q.lire,
        expl: 'R1 est une modification de groupe caractéristique : le groupe –OH de l’alcool devient le groupe C=O d’un aldéhyde, et la chaîne carbonée ne change pas. Aucun atome de carbone n’est ajouté ni retiré, et le groupe –OH n’est pas conservé : il est transformé.',
        indice: 'Comparez les deux formules topologiques : les atomes de carbone sont-ils les mêmes ? Que devient le groupe à l’extrémité de la molécule ?' } },
    { id: 'redox', titre: 'Oxydation, réduction ou échange de H⁺ ?',
      texte: <>Une <strong>oxydo-réduction</strong> met en jeu un oxydant ou un réducteur (ions permanganate ou dichromate, NaBH₄, LiAlH₄…). Une réaction <strong>acide-base</strong> est un échange d’ion H⁺ entre un acide et une base. Pour chaque réaction ci-dessous, repérez ce que fait le réactif, puis choisissez le type.</>,
      tache: { type: 'action', consigne: 'Associez à chaque réaction son type, puis cliquez sur « Vérifier les types ».', ok: ok2 } },
    { id: 'types', titre: 'Substitution, addition ou élimination ?',
      texte: <>Trois autres types se reconnaissent à ce qui change dans la molécule. <strong>Substitution</strong> : un atome ou un groupe d’atomes est remplacé par un autre. <strong>Addition</strong> : une double liaison C=C devient une liaison simple, deux groupes s’ajoutent. <strong>Élimination</strong> : une petite molécule est retirée et une double liaison C=C se forme. Classez les quatre réactions suivantes (les cinq premières sont déjà classées).</>,
      tache: { type: 'action', consigne: 'Associez à chaque réaction son type, puis cliquez sur « Vérifier les types ».', ok: ok3 } },
    { id: 'type', titre: 'Reconnaître le type d’une réaction',
      texte: <>Les réactions R5 et R7 font intervenir toutes les deux l’ion hydroxyde HO⁻, une base, mais vous les avez rangées dans deux types différents.</>,
      tache: { type: 'qcm', q: 'Pourquoi R5 et R7 ne sont-elles pas du même type ?', ...Q.type,
        expl: 'En R5, HO⁻ capte un ion H⁺ de l’acide carboxylique : c’est un échange d’ion H⁺, donc une réaction acide-base. En R7, HO⁻ prend la place de l’atome Br : un groupe en remplace un autre, c’est une substitution. Le réactif ne suffit pas : il faut regarder ce qui change. R5 n’est pas une substitution (le groupe –OH de l’acide est conservé : il perd seulement son H⁺), et aucune des deux n’est une oxydo-réduction (aucun oxydant ni réducteur n’est utilisé).',
        indice: 'Dans chaque réaction, que devient la molécule organique : gagne-t-elle ou perd-elle un ion H⁺, ou un groupe prend-il la place d’un autre ?' } },
    { id: 'seq1', titre: 'Une séquence à deux étapes',
      retenirTitre: 'Les cinq types de réactions', retenir: <>
        <SvgCarteTypes/>
        <ul style={UL}>
          <li>Regarder d’abord le <strong>réactif</strong>, puis <strong>ce qui change</strong> dans la molécule.</li>
          <li>Moyen de s’en souvenir : « <strong>H⁺ qui passe, groupe qui change, C=C qui apparaît ou disparaît</strong> ».</li>
        </ul></>,
      texte: <>Pour passer d’une molécule de départ à une cible, on <strong>enchaîne</strong> des réactions : le produit de l’une devient le réactif de la suivante. Chaque réaction exige un groupe précis. Partez de l’éthanol et construisez une séquence de 2 étapes qui conduit à l’acide éthanoïque. Conseil : demandez-vous quel groupe il faut avoir juste avant l’acide.</>,
      tache: { type: 'action', consigne: 'Choisissez une réaction pour chaque étape. La molécule obtenue s’affiche ; une étape impossible est signalée.', ok: ok4 } },
    { id: 'seq2', titre: 'Une séquence à trois étapes',
      texte: <>Même exercice, plus long : partez de l’éthène et construisez une séquence de 3 étapes qui conduit à l’éthanal. Remontez depuis la cible : par quelle réaction forme-t-on un aldéhyde, et à partir de quel groupe ?</>,
      tache: { type: 'action', consigne: 'Choisissez trois réactions dans l’ordre.', ok: ok5 } },
    { id: 'fragile', titre: 'Enchaîner des étapes jusqu’à la cible',
      retenirTitre: 'Construire une séquence', retenir: <>
        <SvgCarteSequence/>
        <ul style={UL}>
          <li><strong>On remonte depuis la cible</strong> : quel groupe faut-il avoir juste avant ? Puis on vérifie, étape par étape, que le groupe requis est présent.</li>
          <li>Moyen de s’en souvenir : « <strong>la cible d’abord, le départ ensuite</strong> ». Idée fausse : « n’importe quelle réaction s’applique à n’importe quelle molécule ». Vrai : chaque réaction exige un groupe précis.</li>
        </ul></>,
      texte: <>Une molécule peut porter <strong>deux groupes</strong>. Ici, le 4-oxopentanoate d’éthyle possède une cétone et un ester ; on veut obtenir le 5-hydroxypentan-2-one, où la cétone est conservée et où l’ester est devenu un alcool. Le réactif disponible pour transformer un ester est LiAlH₄, qui réduit les esters, mais aussi les aldéhydes et les cétones, en alcools.</>,
      tache: { type: 'qcm', q: 'Si l’on traite directement cette molécule par LiAlH₄, que se passe-t-il ?', ...Q.fragile,
        expl: 'LiAlH₄ réduit tout ce qu’il peut réduire : l’ester devient un alcool primaire et la cétone un alcool secondaire. On obtient le pentane-1,4-diol, pas la cible. Il est faux de croire que seul l’ester est visé ou que seule la cétone réagit : LiAlH₄ ne choisit pas. Et il réagit bien avec ces deux groupes.',
        indice: 'Relisez ce que LiAlH₄ réduit : les esters, mais aussi quels autres groupes ? Lesquels sont présents dans la molécule de départ ?' } },
    { id: 'prot', titre: 'Protéger un groupe avant une étape agressive',
      texte: <>La banque ci-dessous contient quatre réactions, P1 à P4. L’une d’elles permet de <strong>masquer</strong> un groupe pour qu’il ne réagisse pas, une autre de le rétablir. Construisez la séquence de 3 étapes qui transforme le 4-oxopentanoate d’éthyle en 5-hydroxypentan-2-one.</>,
      tache: { type: 'action', consigne: 'Choisissez trois réactions de la banque, dans le bon ordre.', ok: ok8 } },
    { id: 'ident', titre: 'Identifier la protection et la déprotection',
      texte: <>Voici la séquence que vous avez construite : étape 1, puis étape 2, puis étape 3.</>,
      tache: { type: 'qcm', q: 'Quelles étapes sont la protection et la déprotection ?', ...Q.ident,
        expl: 'L’étape 1 (avec l’éthane-1,2-diol) transforme la cétone en acétal : elle masque le groupe fragile, c’est la protection. L’étape 3 (eau et acide) transforme l’acétal en cétone : elle rétablit le groupe, c’est la déprotection. L’étape 2 (LiAlH₄) est la transformation recherchée : elle réduit l’ester, et ne touche pas à l’acétal. L’intérêt de la protection : sans elle, LiAlH₄ aurait aussi détruit la cétone, qu’on veut conserver.',
        indice: 'Une protection cache un groupe avant l’étape qui l’aurait détruit ; une déprotection le rétablit à la fin. Quelle étape est la transformation voulue, entre les deux ?' } },
    { id: 'eco1', titre: 'Mesurer une synthèse : le rendement global',
      retenirTitre: 'Protéger puis déprotéger', retenir: <>
        <SvgCarteProtection/>
        <ul style={UL}>
          <li><strong>Protéger, transformer, déprotéger</strong> : le groupe fragile est caché pendant l’étape qui l’aurait détruit, puis rétabli.</li>
          <li>On ne protège que si le réactif détruirait aussi le groupe à conserver : cela coûte deux étapes de plus. Idée fausse : « protéger accélère la réaction ». Vrai : cela rend l’étape <strong>sélective</strong>.</li>
        </ul></>,
      texte: <>Deux voies permettent de fabriquer l’éthanoate d’éthyle à partir de l’éthanol, en deux étapes : une oxydation en acide éthanoïque (les deux oxydations successives sont ici regroupées), puis une estérification. Les données du tableau sont <strong>fournies</strong> : fictives, mais d’ordre de grandeur plausible. Voici la voie A : le rendement de l’étape 1 est η₁ = {eA[0].eta}{NB}% et celui de l’étape 2 est η₂ = {eA[1].eta}{NB}%.</>,
      tache: { type: 'num', carnet: false, q: 'Rendement global de la voie A, produit des rendements des deux étapes (en %)', unite: '%', vrai: gA, tol: 0.05, affiche: v => nbf(v, 1),
        calcul: () => ['Les étapes s’enchaînent : la matière obtenue à l’étape 1 est le point de départ de l’étape 2, donc on multiplie les rendements écrits sous forme de nombres compris entre 0 et 1.', `η global = 0,85 × 0,67 = 0,5695, soit ${nbf(gA, 1)} %.`],
        pieges: [[76, 'Vous avez fait la moyenne des deux rendements : les étapes s’enchaînent, on multiplie.'], [152, 'Vous avez additionné les rendements : le rendement global ne peut pas dépasser 100 %.'], [67, 'Vous n’avez gardé que la dernière étape : la matière perdue à la première compte aussi.'], [85, 'Vous n’avez gardé que la première étape : la deuxième perd aussi de la matière.']],
        expl: `η global = 0,85 × 0,67 ≈ ${nbf(gA, 1)} %.`,
        indice: 'Rendement global = η₁ × η₂, avec 85 % = 0,85 et 67 % = 0,67. Un rendement global est toujours inférieur au plus petit rendement d’étape.' } },
    { id: 'eco2', titre: 'Les déchets d’une synthèse',
      texte: <>Le tableau donne aussi les déchets de la voie A : {nbf(eA[0].dechets, 1)}{NB}kg à l’étape 1 et {nbf(eA[1].dechets, 1)}{NB}kg à l’étape 2, pour 1,0{NB}kg d’éthanoate d’éthyle obtenu. On veut préparer 100{NB}g d’ester.</>,
      tache: { type: 'num', carnet: false, q: 'Masse de déchets produite par la voie A pour obtenir 100 g d’ester (en g)', unite: 'g', vrai: 500, tol: 0.05, affiche: v => nbf(v, 0),
        calcul: () => ['Déchets des deux étapes pour 1,0 kg d’ester : 3,0 + 2,0 = 5,0 kg.', 'Pour 100 g = 0,100 kg d’ester : 5,0 × 0,100 = 0,50 kg, soit 500 g.'],
        pieges: [[5000, 'Cette masse correspond à 1,0 kg d’ester ; ici on prépare 100 g, soit dix fois moins : convertissez la masse en kg.'], [5, 'Vous avez gardé les kg de déchets par kg d’ester : pour 100 g d’ester, convertissez en kg de produit puis en g de déchets.'], [300, 'Vous n’avez compté que l’étape 1 : ajoutez les déchets de l’étape 2.']],
        expl: 'Déchets : (3,0 + 2,0) × 0,100 = 0,50 kg, soit 500 g.',
        indice: 'Additionnez les déchets des deux étapes (kg par kg d’ester), puis multipliez par la masse d’ester en kg : 100 g = 0,100 kg.' } },
    { id: 'eco3', titre: 'Rendement, déchets et amélioration d’une voie',
      retenirTitre: 'Rendement global et déchets', retenir: <>
        <SvgCarteRendementGlobal/>
        <ul style={UL}>
          <li><strong>Rendement global = produit des rendements d’étape</strong> : il est plus petit que le plus petit d’entre eux. Les <strong>déchets</strong> se comptent en kg par kg de produit.</li>
          <li>Moyen de s’en souvenir : « <strong>chaque étape fait perdre une part</strong> ». Idée fausse : « on peut moyenner les rendements ». Vrai : on les multiplie.</li>
        </ul></>,
      texte: <>La voie B, elle aussi aux données fournies, fabrique le même ester. Comparez les deux voies : rendement global, solvants, températures, dangers et déchets. Pour la voie A, η global ≈ {nbf(gA, 0)}{NB}% et déchets de {nbf(M.dechetsTotal(V.A), 1)}{NB}kg par kg d’ester ; pour la voie B, η global ≈ {nbf(M.rendementGlobal(V.B), 0)}{NB}% et déchets de {nbf(M.dechetsTotal(V.B), 1)}{NB}kg par kg d’ester.</>,
      tache: { type: 'qcm', q: 'Pour rendre l’étape 1 de la voie A (oxydation par les ions dichromate) moins nocive pour l’environnement, quelle modification est la plus pertinente ?', ...Q.amelio,
        expl: 'La voie B remplace le dichromate (chrome VI, toxique, qui laisse des sels de chrome) par l’air et un catalyseur biologique, dans l’eau, à 30 °C au lieu de 100 °C : réactif moins dangereux, moins de déchets, moins d’énergie. Les autres choix sont des compromis incomplets : chauffer moins longtemps économise un peu d’énergie mais garde le chrome VI et ses sels de chrome ; distiller l’eau consomme de l’énergie et ne supprime pas la toxicité ; un solvant organique ajoute un danger sans régler le problème du réactif.',
        indice: 'Un bon choix de réactif réduit la toxicité et les déchets. L’apport d’énergie dépend de la température et de la durée. Comparez l’étape 1 des deux voies.' } },
    { id: 'bilan', titre: 'Bilan',
      retenirTitre: 'Les leviers d’une synthèse écoresponsable', retenir: <>
        <SvgCarteLeviers/>
        <ul style={UL}>
          <li><strong>Réactif, solvant, énergie, déchets</strong> : quatre leviers, à juger sur des données (rendement global, déchets par kg, température, dangers).</li>
          <li>Moyen de s’en souvenir : « <strong>moins toxique, moins de solvant, moins chaud, moins de déchets</strong> ». Idée fausse : « un bon rendement suffit pour qu’une voie soit écoresponsable ». Vrai : il faut aussi regarder réactifs, solvants, énergie et déchets.</li>
        </ul></>,
      texte: <>Vous savez classer les réactions d’une banque, construire une séquence à partir d’un départ et d’une cible, repérer et justifier une protection et une déprotection, et discuter l’impact d’une synthèse à partir de données. Passez à l’exploration pour tester d’autres séquences, ou relevez les défis.</>, tache: null },
  ];

  // ---------- scènes du parcours ----------
  const bandeauDonnees = <div style={sceneNote}>Données fournies : fictives, d’ordre de grandeur plausible (ce ne sont pas des mesures).</div>;
  const recapTypes = (ids) => (
    <details style={{ marginBottom: 8 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 14, color: KIT.txt }}>Réactions déjà classées ({ids.length})</summary>
      <ul style={{ ...UL, fontSize: 14 }}>{ids.map(id => { const r = reac(BG, id), [a] = r.exemple, p = r.apps[a].prod[0]; return <li key={id}>{id} : {M.MOLS[a].nom} → {M.MOLS[p].nom} · <strong>{r.type}</strong></li>; })}</ul>
    </details>);
  const sceneGuide = () => {
    switch (idEtape) {
      case 'lire': return <><div style={titreCarte}>Réaction R1 de la banque</div><CarteReaction r={reac(BG, 'R1')} banque={BG}/></>;
      case 'redox': return <><div style={aide}>Les réactions R1 à R5 de la banque. Le réactif est écrit au-dessus de la flèche.</div><Classement banque={BG} ids={['R1', 'R2', 'R3', 'R4', 'R5']} options={['oxydo-réduction', 'acide-base', 'ni l’une ni l’autre']} sel={cls2} setSel={setCls2} verifie={v2} setVerifie={setV2}/></>;
      case 'types': return <>{recapTypes(['R1', 'R2', 'R3', 'R4', 'R5'])}<Classement banque={BG} ids={['R6', 'R7', 'R8', 'R9']} options={M.TYPES} sel={cls3} setSel={setCls3} verifie={v3} setVerifie={setV3}/></>;
      case 'type': return <><div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>{['R5', 'R7'].map(id => <div key={id} style={{ border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: 8, background: '#fff' }}><div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Réaction {id}</div><CarteReaction r={reac(BG, id)} banque={BG} compact/></div>)}</div></>;
      case 'seq1': return <><Constructeur banque={BG} depart="C" cible="E" suite={seq1} setSuite={majSuite(setSeq1)} afficher/><BanqueCartes banque={BG} ouvert={false}/></>;
      case 'seq2': return <><Constructeur banque={BG} depart="A" cible="D" suite={seq2} setSuite={majSuite(setSeq2)} afficher/><BanqueCartes banque={BG} ouvert={false}/></>;
      case 'fragile': return (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', alignItems: 'flex-start' }}>
            <MolCarte id="Q" L={30} role="Molécule de départ"/>
            <MolCarte id="T" L={30} role="Molécule cible"/>
          </div>
          <div style={sceneNote}>Réactif disponible : <strong>LiAlH₄</strong> (hydrure de lithium et d’aluminium) dans l’éther anhydre, puis ajout d’eau.</div>
        </>);
      case 'prot': return <><Constructeur banque={BP} depart="Q" cible="T" suite={seqP} setSuite={majSuite(setSeqP)} afficher/><BanqueCartes banque={BP} ouvert={false} titre="Banque : molécule à deux groupes"/></>;
      case 'ident': return (
        <>
          <Constructeur banque={BP} depart="Q" cible="T" suite={['P1', 'P3', 'P4']} setSuite={() => {}} afficher lectureSeule verdictVisible={false}/>
        </>);
      case 'eco1': return <>{bandeauDonnees}<TableVoie v={V.A} dechets={false}/></>;
      case 'eco2': return <>{bandeauDonnees}<TableVoie v={V.A}/></>;
      case 'eco3': return <>{bandeauDonnees}<TableVoie v={V.A}/><TableVoie v={V.B}/></>;
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
    const b = M.bilanSequence(BG, defi.cas.depart, defi.cas.cible, defi.suite), ok = b.atteint;
    setDefi(d => ({ ...d, verifie: true, essais: d.essais + 1, ok: d.ok || ok })); noterS(ok);
  };
  const voletSequence = defi && defi.type === 'sequence' && (() => {
    const { cas } = defi, sol = M.sequences(BG, cas.depart, cas.cible, cas.n)[0], revele = defi.ok || defi.essais >= 3;
    const groupe = M.MOLS[cas.cible].groupes.map(g => M.GROUPE_ART[g]).join(' et ');
    return (<>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : construire la séquence</div>
      <div style={{ ...lbl, marginBottom: 8 }}>Passez de {M.defini(M.MOLS[cas.depart].nom)} à {M.defini(M.MOLS[cas.cible].nom)} en <strong>{cas.n} étapes</strong> avec la banque de réactions, puis cliquez sur « Vérifier ».</div>
      <Constructeur banque={BG} depart={cas.depart} cible={cas.cible} suite={defi.suite} setSuite={(k, v) => setDefi(d => ({ ...d, suite: d.suite.map((x, i) => (i === k ? v : x)), verifie: false }))} afficher={defi.verifie}/>
      <IndiceDefi cache={defi.ok}>La cible est {groupe} : quelle réaction forme ce groupe, et à partir de quel groupe ? Remontez depuis la cible, puis vérifiez que chaque réaction a bien son groupe de départ.</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={verifierDefi} disabled={!defi.suite.every(Boolean)} style={{ ...styleBouton(true, '#15803d'), opacity: defi.suite.every(Boolean) ? 1 : 0.5 }}>✓ Vérifier la séquence</button>
        <button onClick={() => nouveauDefi('sequence')} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {revele && sol && <div style={{ marginTop: 8, fontSize: 13.5, color: KIT.txt, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, padding: '6px 8px', lineHeight: 1.5 }}>
        {defi.ok ? 'Une séquence qui convient : ' : 'Après trois essais, voici la séquence : '}{sol.map(id => `${id} (${reac(BG, id).nom.toLowerCase()})`).join(', puis ')}.</div>}
    </>);
  })();

  const voletAnalyse = defi && defi.type !== 'sequence' && defi.questions && (
    <>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.kind === 'prot' ? 'Défi : protection et déprotection' : 'Défi : comparer deux voies de synthèse'}</div>
      {defi.kind === 'eco' && <div style={{ ...lbl, marginBottom: 8 }}>Deux voies fabriquent l’éthanoate d’éthyle à partir de l’éthanol (données fournies, fictives mais plausibles). Répondez aux trois questions.</div>}
      {defi.kind === 'prot' && <div style={{ ...lbl, marginBottom: 8 }}>On veut transformer le 4-oxopentanoate d’éthyle en 5-hydroxypentan-2-one : l’ester doit devenir un alcool, la cétone doit être conservée. Répondez aux trois questions.</div>}
      {defi.questions.map((q, i) => <QuestionDefi key={`${defi.kind}-${q.id}-${i}`} n={i + 1} q={q} onEssai={ok => noterA(ok)}/>)}
      <button onClick={() => nouveauDefi('analyse')} style={{ ...styleBouton(false), marginTop: 10 }}><Pic n="refresh"/>Nouveau défi</button>
    </>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['sequence', 'Construire une séquence'], ['analyse', 'Protection ou voie écoresponsable']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={typeDefi === t} style={stylePetitBouton(typeDefi === t, '#0369a1')}>{l}</button>)}
      </div>
      {defi.type === 'sequence' ? voletSequence : voletAnalyse}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Modèle construit</strong> : la banque est un modèle simplifié. Chaque réaction a un réactif organique, des conditions et un produit unique : ni réactions parasites, ni mélanges de produits, ni mécanisme (les flèches courbes sont l’objet de la simulation sur les mécanismes). Aucune stéréochimie.</li>
      <li><strong>Classement des réactions</strong> : une oxydo-réduction est reconnue à l’emploi d’un oxydant ou d’un réducteur (la réduction d’un aldéhyde ou d’une cétone par NaBH₄ y est classée, bien qu’elle puisse aussi se décrire comme l’addition d’un « H₂ » formel) ; l’estérification est classée parmi les substitutions : le groupe –OH de l’acide est remplacé par –OR. Ces classements sont des conventions de lecture de la banque.</li>
      <li><strong>Bilans simplifiés</strong> : un oxydant est représenté par un atome d’oxygène « [O] » et un réducteur par des atomes d’hydrogène « [H] » transférés. Les équations ne sont pas ajustées en électrons ; les atomes et la charge sont conservés.</li>
      <li><strong>Produit unique</strong> : l’addition de HBr sur un alcène dissymétrique (propène) donne deux produits possibles : ce cas n’est pas traité. L’éthène donne un seul produit.</li>
      <li><strong>Rendements d’étape</strong> : données fournies, fictives, d’ordre de grandeur plausible. Le rendement global d’une séquence est le produit des rendements d’étape, chaque produit étant isolé puis purifié avant l’étape suivante.</li>
      <li><strong>Protection</strong> : LiAlH₄ réduit les esters, les aldéhydes et les cétones ; NaBH₄ réduit les aldéhydes et les cétones mais pas les esters ; l’acétal est stable vis-à-vis de ces réducteurs et se coupe en milieu acide aqueux. Les conditions décrites sont des repères, pas un protocole de laboratoire. La cyclisation (lactone) d’un hydroxy-ester n’est pas traitée.</li>
      <li><strong>Chaîne carbonée</strong> : aucune réaction de la banque ne modifie la chaîne carbonée (pas de formation de liaison C–C) : la banque ne permet de passer que d’un groupe caractéristique à un autre, sur une chaîne donnée.</li>
      <li><strong>Synthèse écoresponsable</strong> : les données des deux voies (rendements, températures, durées, solvants, déchets en kg par kg d’ester) sont fictives. On compare à l’aide d’indicateurs simples (rendement global, déchets par kg de produit) ; l’économie d’atomes n’est pas traitée. L’oxydation de l’éthanol en acide éthanoïque regroupe ici les deux oxydations successives.</li>
      <li><strong>Hors programme, non traité</strong> : mécanismes détaillés, polymérisation (voir la simulation sur les familles et les polymères), stéréochimie, chimie verte quantitative.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const banqueEx = ex.banque === 'generale' ? BG : BP, molsEx = ex.banque === 'generale' ? M.MOLS_GENERALE : M.MOLS_PROTECTION;
  const setEx2 = f => setEx(s => { const n = { ...s, ...f, verifie: false }; const liste = n.banque === 'generale' ? M.MOLS_GENERALE : M.MOLS_PROTECTION; if (n.cible === n.depart || !liste.includes(n.cible)) n.cible = liste.find(id => id !== n.depart); return n; });
  const changerBanque = b => setEx2(b === 'generale' ? { banque: b, depart: 'C', cible: 'E', suite: ['', ''] } : { banque: b, depart: 'Q', cible: 'T', suite: ['', '', ''] });
  const dEx = M.derouler(banqueEx, ex.depart, ex.suite), bEx = M.bilanSequence(banqueEx, ex.depart, ex.cible, ex.suite);
  const resume = `${ex.banque === 'generale' ? 'banque générale' : 'molécule à deux groupes'} · ${M.MOLS[ex.depart].nom} → ${M.MOLS[ex.cible].nom} · ${ex.suite.length} étape${ex.suite.length > 1 ? 's' : ''}`;
  const hybride = { nom: 'Voie choisie', etapes: [ex.v1 === 'A' ? V.A.etapes[0] : V.B.etapes[0], ex.v2 === 'A' ? V.A.etapes[1] : V.B.etapes[1]] };
  const boxExplore = (
    <div style={styleBoite}>
      <div style={titreCarte}>Séquence à construire</div>
      <div style={aide}>Choisissez une réaction pour chaque étape : la molécule obtenue s’affiche tout de suite. « Vérifier la séquence » indique si la cible est atteinte.</div>
      <Constructeur banque={banqueEx} depart={ex.depart} cible={ex.cible} suite={ex.suite} setSuite={(k, v) => setEx(s => ({ ...s, suite: s.suite.map((x, i) => (i === k ? v : x)), verifie: false }))} afficher verdictVisible={ex.verifie}/>
      <div style={{ marginTop: 8 }}><button onClick={() => setEx(s => ({ ...s, verifie: true }))} style={styleBouton(true, '#15803d')}>✓ Vérifier la séquence</button></div>
      {ex.verifie && !dEx.echec && ex.suite.every(Boolean) && <div style={{ ...sceneNote, color: bEx.atteint ? '#15803d' : '#b91c1c' }}>{bEx.atteint ? 'Séquence réussie.' : 'La cible n’est pas atteinte.'}</div>}
      {ex.verifie && dEx.echec && <div style={{ ...sceneNote, color: '#b91c1c' }}>La séquence n’est pas réalisable : lisez le message de l’étape signalée.</div>}
    </div>);
  const reglages = (
    <div style={styleBoite} className="str-ctrl">
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Chaque menu modifie un seul élément : la banque de réactions, la molécule de départ, la cible ou le nombre d’étapes.</div>
      <label style={lbSel}>Banque de réactions
        <select value={ex.banque} onChange={e => changerBanque(e.target.value)} style={{ ...menu, marginTop: 2 }}><option value="generale">banque générale (9 réactions)</option><option value="protection">molécule à deux groupes (protection, 4 réactions)</option></select></label>
      <label style={lbSel}>Molécule de départ
        <select value={ex.depart} onChange={e => setEx2({ depart: e.target.value, suite: ex.suite.map(() => '') })} style={{ ...menu, marginTop: 2 }}>{molsEx.map(id => <option key={id} value={id}>{M.MOLS[id].nom}</option>)}</select></label>
      <label style={lbSel}>Molécule cible
        <select value={ex.cible} onChange={e => setEx2({ cible: e.target.value })} style={{ ...menu, marginTop: 2 }}>{molsEx.filter(id => id !== ex.depart).map(id => <option key={id} value={id}>{M.MOLS[id].nom}</option>)}</select></label>
      <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 4 }}>Nombre d’étapes : {ex.suite.length}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        <button type="button" aria-label="Retirer une étape" disabled={ex.suite.length <= 1} onClick={() => setEx2({ suite: ex.suite.slice(0, -1) })} style={{ ...stylePetitBouton(false), minWidth: 44, minHeight: 40 }}>−</button>
        <button type="button" aria-label="Ajouter une étape" disabled={ex.suite.length >= 4} onClick={() => setEx2({ suite: [...ex.suite, ''] })} style={{ ...stylePetitBouton(false), minWidth: 44, minHeight: 40 }}>+</button>
        <button type="button" onClick={() => changerBanque(ex.banque)} style={stylePetitBouton(false)}><Pic n="refresh"/>Rétablir</button>
      </div>
      <div style={aide}>« Rétablir » remet la banque, le départ, la cible et les étapes à leur valeur de départ.</div>
    </div>);
  const mesures = (
    <div style={styleBoite}>
      <Section titre={`Mesures : rendement global = ${dEx.rendementGlobal == null ? '—' : nbf(dEx.rendementGlobal, 0) + ' %'}`} ouvert={ouv.mes} onBascule={() => setOuv(o => ({ ...o, mes: !o.mes }))}>
        <div style={aide}>{resume}.</div>
        <LigneMesure nom="Rendement global (étapes réalisées)" valeur={dEx.rendementGlobal == null ? '—' : `${nbf(dEx.rendementGlobal, 0)}${NB}%`}/>
        <LigneMesure nom="Étapes réalisables" valeur={`${dEx.pas.length} sur ${ex.suite.length}`}/>
        <div style={{ ...aide, marginTop: 8 }}>Rendement global = produit des rendements des étapes. Les rendements d’étape sont des données fournies (fictives, ordre de grandeur plausible) : {banqueEx.map(r => `${r.id} ${r.rendement} %`).join(', ')}.</div>
      </Section>
    </div>);
  const banqueExplore = (<div style={styleBoite}><Section titre="Banque de réactions et exemples" ouvert={ouv.banque} onBascule={() => setOuv(o => ({ ...o, banque: !o.banque }))}><BanqueCartes banque={banqueEx}/></Section></div>);
  const voiesExplore = (
    <div style={styleBoite}>
      <Section titre={`Comparer deux voies de synthèse : ${ex.v1 === 'A' ? 'A' : 'B'} puis ${ex.v2 === 'A' ? 'A' : 'B'}`} ouvert={ouv.voies} onBascule={() => setOuv(o => ({ ...o, voies: !o.voies }))}>
        <div style={aide}>Deux voies fabriquent l’éthanoate d’éthyle à partir de l’éthanol. Pour chaque étape, choisissez la version de la voie A ou de la voie B : les indicateurs se recalculent.</div>
        <label style={lbSel}>Étape 1 (oxydation)
          <select value={ex.v1} onChange={e => setEx(s => ({ ...s, v1: e.target.value }))} style={{ ...menu, marginTop: 2 }}><option value="A">version de la voie A (dichromate)</option><option value="B">version de la voie B (air et catalyseur)</option></select></label>
        <label style={lbSel}>Étape 2 (estérification)
          <select value={ex.v2} onChange={e => setEx(s => ({ ...s, v2: e.target.value }))} style={{ ...menu, marginTop: 2 }}><option value="A">version de la voie A (toluène)</option><option value="B">version de la voie B (résine solide)</option></select></label>
        <TableVoie v={hybride} titre="Voie choisie (données fournies, fictives)"/>
        <LigneMesure nom="Rendement global" valeur={`${nbf(M.rendementGlobal(hybride), 1)}${NB}%`}/>
        <LigneMesure nom="Déchets par kg d’ester" valeur={`${nbf(M.dechetsTotal(hybride), 1)}${NB}kg`}/>
        <LigneMesure nom="Température la plus haute" valeur={`${Math.max(...hybride.etapes.map(e => e.T))}${NB}°C`}/>
        <LigneMesure nom="Durée totale" valeur={`${hybride.etapes.reduce((s, e) => s + e.duree, 0)}${NB}h`}/>
        <div style={{ ...aide, marginTop: 6 }}>Compromis : une voie moins polluante peut durer plus longtemps ou avoir un rendement différent ; à vous d’arbitrer entre durée, déchets, température et danger.</div>
        <button type="button" onClick={() => setEx(s => ({ ...s, v1: 'A', v2: 'A' }))} style={{ ...stylePetitBouton(false), marginTop: 6 }}><Pic n="refresh"/>Rétablir la voie A</button>
      </Section>
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Banque générale, de l’éthanol à l’éthanoate d’éthyle : combien d’étapes faut-il ? Quel rendement global obtient-on ?</li>
        <li>Essayez d’appliquer l’estérification à l’éthanal : quel message obtenez-vous, et pourquoi ?</li>
        <li>De l’éthène à l’acide éthanoïque : quelle est la plus courte séquence ? Que devient le rendement global quand on ajoute une étape ?</li>
        <li>Banque à deux groupes : que donne LiAlH₄ directement sur le 4-oxopentanoate d’éthyle ? Et NaBH₄ ? Comparez avec la séquence protégée.</li>
        <li>Voies de synthèse : quelle étape de la voie A améliore le plus les déchets quand on la remplace par celle de la voie B ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Types : oxydo-réduction (oxydant ou réducteur), acide-base (H⁺), substitution (un groupe en remplace un autre), addition (C=C devient C–C), élimination (C–C devient C=C)</li>
          <li>Séquence : on remonte depuis la cible ; chaque réaction exige un groupe précis</li>
          <li>Protection : cacher le groupe fragile avant l’étape qui l’aurait détruit, puis le rétablir</li>
          <li>Rendement global = produit des rendements d’étape</li>
          <li>Synthèse écoresponsable : réactif, solvant, énergie, déchets</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .str-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .str-l1.cote { grid-template-columns: minmax(0, 1fr); }
        .str-col { display: flex; flex-direction: column; gap: 12px; }
        .str-l1 .str-carte { order: 1; } .str-l1 .str-main { order: 2; }
        .str-df { display: block; margin-bottom: 12px; } .str-df > * { margin-bottom: 12px; }
        @media (min-width: 901px) { .str-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); } .str-l1.cote .str-carte { order: 2; } .str-l1.cote .str-main { order: 1; }
          .str-df { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .str-df > * { margin-bottom: 0; } .str-df-volet { grid-column: 1; grid-row: 1; } .str-df-hypo { grid-column: 2; grid-row: 1; } }
        .str-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .str-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .str-ex > * { grid-column: 1; } .str-ex > .str-ctrl { grid-column: 2; grid-row: 1 / span 6; } }
        @media (prefers-reduced-motion: no-preference) { .str-in { animation: str-fondu 0.35s ease-out; } @keyframes str-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Stratégie de synthèse multi-étapes</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>À partir d’une banque de réactions : reconnaître le type d’une réaction, construire une séquence de synthèse, protéger un groupe fragile, et comparer l’impact environnemental de deux voies.</div>
      {enGuide && <div className="str-l1 cote">
        <div className="str-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div>
        <div className="str-main"><div className="str-col">
          {idEtape !== 'bilan' && <div className="str-in" key={'s-' + idEtape}><div style={styleBoite}>{sceneGuide()}</div></div>}
        </div></div>
      </div>}
      {enDefi && defi && <div className="str-df">
        <div className="str-df-volet"><div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type === 'sequence' ? 'sequence' : 'analyse'}`} etat={defi.type === 'sequence' ? suiviS : suiviA}/></div></div>
        <div className="str-df-hypo">{panneauHypo}</div>
      </div>}
      {enExplore && <div className="str-ex">
        <div>{boxExplore}</div>
        <div className="str-ctrl">{reglages}</div>
        <div>{mesures}</div>
        <div>{banqueExplore}</div>
        <div>{voiesExplore}</div>
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
