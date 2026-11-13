import { declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, IndiceDefi, avecIndices, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import { nbf, tire, Schema, T, puces, ROUGE, VERT, BLEU, ORANGE, NOIR, GRIS } from "./Travail";
import * as C from "./ccmModele";

export const SIM_ID = 109;
declarerDefis(SIM_ID, [['rf', 'Identifier une impureté par son Rf']]);

// ====================================================
//  SIM 110 — CCM ET TEMPÉRATURE DE FUSION (1G, chapitre 6 : contrôler le produit du TP de la chalcone)
//  Plaque CCM virtuelle (dépôt, élution, Rf, comparaison avec les références) et banc Kofler.
// ====================================================
const PX_CM = 32, Y0 = 232, XS = [100, 170, 240, 310];
const FRONT = 6.0, TF_MES = 97;
const reduit = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const cel = (h) => ({ border: `1px solid ${KIT.bord}`, padding: '2px 8px', textAlign: 'center', background: h ? '#f1f5f9' : 'transparent' });

// ---------- plaque de CCM ----------
export function Plaque({ p, etat, front = true, niveau = false, titre }) {
  const mont = etat === 'eluee', anim = !reduit();
  return (
    <svg viewBox="0 0 385 310" style={{ width: "100%", maxWidth: 440, display: 'block', background: '#fff', borderRadius: 8 }} role="img"
      aria-label={`${titre || 'Plaque de CCM'} : ligne de dépôt à 1,5 cm du bas${etat !== 'vide' ? ', quatre dépôts : produit, chalcone, anisaldéhyde, 4’-méthylacétophénone' : ''}${mont ? `, front de l’éluant à ${nbf(p.front, 1)} cm de la ligne de dépôt` : ''}`}>
      <rect x="62" y="20" width="270" height="262" rx="4" fill="#ecfccb" stroke={GRIS} strokeWidth="2"/>
      <line x1="62" y1={Y0} x2="332" y2={Y0} stroke={NOIR} strokeWidth="1.5" strokeDasharray="5 3"/>
      <text x="336" y={Y0 + 4} fontSize="11" fill={NOIR} fontWeight="700">dépôt</text>
      {niveau && <g><line x1="40" y1={Y0 + 48 - 5} x2="352" y2={Y0 + 48 - 5} stroke={BLEU} strokeWidth="2.5"/><text x="46" y={Y0 + 47 - 12} fontSize="11" fill={BLEU} fontWeight="700">niveau de l’éluant</text></g>}
      {[0, 1, 2, 3, 4, 5, 6].map(k => <g key={k}><line x1="52" y1={Y0 - k * PX_CM} x2="62" y2={Y0 - k * PX_CM} stroke={GRIS}/><text x="48" y={Y0 - k * PX_CM + 4} textAnchor="end" fontSize="11" fill={GRIS}>{k}</text></g>)}
      <text x="8" y="14" fontSize="11" fill={GRIS}>cm depuis la ligne de dépôt</text>
      {mont && front && <g><line x1="62" y1={Y0 - p.front * PX_CM} x2="332" y2={Y0 - p.front * PX_CM} stroke={ROUGE} strokeWidth="2"/><text x="336" y={Y0 - p.front * PX_CM + 4} fontSize="11" fill={ROUGE} fontWeight="700">front</text></g>}
      {p.voies.map((v, i) => <g key={i}>
        <text x={XS[i]} y="298" textAnchor="middle" fontSize="11.5" fontWeight="700" fill={NOIR}>{i + 1}</text>
        <text x={XS[i]} y="308" textAnchor="middle" fontSize="9.5" fill={GRIS}>{v.etiquette}</text>
        {etat !== 'vide' && v.taches.map((t, k) => <ellipse key={k} cx={XS[i]} cy={Y0} rx={10} ry={5.5} fill="#4c1d95" opacity={0.35 + 0.6 * t.k} style={{ transform: `translateY(${mont ? -t.d * PX_CM : 0}px)`, transition: anim ? 'transform 1.4s ease-out' : 'none' }}/>)}
      </g>)}
    </svg>);
}

// ---------- banc Kofler ----------
const xT = T => 20 + (T - 50) * 1.6;
export function Kofler({ tf, largeur = 0 }) {
  const ticks = []; for (let T = 50; T <= 250; T += 5) ticks.push(T);
  return (
    <svg viewBox="0 0 360 150" style={{ width: '100%', maxWidth: 440, display: 'block', background: '#fff', borderRadius: 8 }} role="img"
      aria-label={`Banc Kofler : plaque chauffante graduée de 50 à 250 °C ; le curseur est placé à la limite entre cristaux solides et fondus`}>
      <defs><linearGradient id="gk" x1="0" x2="1"><stop offset="0" stopColor="#cbd5e1"/><stop offset="1" stopColor="#fb923c"/></linearGradient></defs>
      <rect x="20" y="40" width="320" height="34" rx="4" fill="url(#gk)" stroke={GRIS}/>
      <line x1="20" y1="57" x2={xT(tf)} y2="57" stroke={NOIR} strokeWidth="4" strokeDasharray={largeur ? '3 3' : '0'}/>
      <line x1={xT(tf) + 2} y1="57" x2={xT(tf) + 22} y2="57" stroke={NOIR} strokeWidth="1.5" strokeDasharray="1 5"/>
      <text x="26" y="34" fontSize="10.5" fill={GRIS}>cristaux solides</text><text x="250" y="34" fontSize="10.5" fill={GRIS}>cristaux fondus</text>
      {ticks.map(T => <line key={T} x1={xT(T)} y1="74" x2={xT(T)} y2={T % 50 === 0 ? 92 : T % 10 === 0 ? 86 : 80} stroke={NOIR}/>)}
      {[50, 100, 150, 200, 250].map(T => <text key={T} x={xT(T)} y="108" textAnchor="middle" fontSize="12" fontWeight="700" fill={NOIR}>{T}</text>)}
      <text x="340" y="126" textAnchor="end" fontSize="11" fill={GRIS}>°C</text>
      <line x1={xT(tf)} y1="36" x2={xT(tf)} y2="96" stroke={ROUGE} strokeWidth="2.5"/><path d={`M${xT(tf) - 6},30 h12 l-6,8 z`} fill={ROUGE}/>
      <text x="20" y="140" fontSize="11" fill={ROUGE} fontWeight="700">curseur : limite entre parties solide et fondue</text>
    </svg>);
}

// ---------- schémas des cartes ----------
const SchemaRf = () => (
  <Schema aria="Une plaque de CCM : le Rf est la distance parcourue par la tache divisée par la distance parcourue par le front de l'éluant" h={170}>
    <rect x="30" y="20" width="110" height="140" fill="#ecfccb" stroke={GRIS} strokeWidth="2"/>
    <line x1="30" y1="140" x2="140" y2="140" stroke={NOIR} strokeDasharray="4 3"/><line x1="30" y1="40" x2="140" y2="40" stroke={ROUGE} strokeWidth="2"/>
    <ellipse cx="85" cy="90" rx="10" ry="5.5" fill="#4c1d95"/>
    <line x1="152" y1="140" x2="152" y2="90" stroke={ORANGE} strokeWidth="2.5"/><line x1="170" y1="140" x2="170" y2="40" stroke={ROUGE} strokeWidth="2.5"/>
    <T x={146} y={154} s={11.5} c={ORANGE} w={700}>d</T><T x={168} y={154} s={11.5} c={ROUGE} w={700}>D</T>
    <T x={186} y={62} s={12.5} w={700}>Rf = d ÷ D</T><T x={186} y={82} s={11.5}>d : tache depuis la ligne</T><T x={186} y={98} s={11.5}>D : front depuis la ligne</T>
    <T x={186} y={122} s={11.5} c={VERT} w={700}>Rf est compris entre 0 et 1</T><T x={186} y={138} s={11.5} c={GRIS}>sans unité</T>
    <T x={6} y={14} s={12.5} w={700}>Un Rf = un rapport de distances</T>
  </Schema>);
const SchemaComparer = () => (
  <Schema aria="Comparer les taches du produit avec les références : une tache à la hauteur de la chalcone identifie la chalcone ; une seconde tache à la hauteur d'un réactif montre une impureté" h={170}>
    <rect x="30" y="20" width="200" height="140" fill="#ecfccb" stroke={GRIS} strokeWidth="2"/><line x1="30" y1="140" x2="230" y2="140" stroke={NOIR} strokeDasharray="4 3"/>
    {[60, 110, 160, 205].map((x, i) => <text key={i} x={x} y="154" textAnchor="middle" fontSize="11" fontWeight="700">{i + 1}</text>)}
    <ellipse cx="60" cy="100" rx="9" ry="5" fill="#4c1d95"/><ellipse cx="60" cy="82" rx="9" ry="5" fill="#4c1d95" opacity="0.45"/>
    <ellipse cx="110" cy="100" rx="9" ry="5" fill="#4c1d95"/><ellipse cx="160" cy="82" rx="9" ry="5" fill="#4c1d95"/><ellipse cx="205" cy="68" rx="9" ry="5" fill="#4c1d95"/>
    <line x1="30" y1="100" x2="230" y2="100" stroke={VERT} strokeDasharray="3 3"/><line x1="30" y1="82" x2="230" y2="82" stroke={ROUGE} strokeDasharray="3 3"/>
    <T x={238} y={90} s={11.5} c={VERT} w={700}>même hauteur :</T><T x={238} y={104} s={11.5} c={VERT} w={700}>chalcone</T><T x={238} y={74} s={11.5} c={ROUGE} w={700}>impureté</T>
    <T x={6} y={14} s={12.5} w={700}>Même hauteur = même espèce (a priori)</T>
  </Schema>);
const SchemaEluant = () => (
  <Schema aria="Avec un éluant plus polaire, les taches montent plus haut : le Rf augmente" h={170}>
    {[[40, 0.45], [150, 0.7]].map(([x, r], i) => <g key={i}><rect x={x} y="24" width="90" height="130" fill="#ecfccb" stroke={GRIS} strokeWidth="2"/><line x1={x} y1="130" x2={x + 90} y2="130" stroke={NOIR} strokeDasharray="4 3"/><line x1={x} y1="44" x2={x + 90} y2="44" stroke={ROUGE}/>
      <ellipse cx={x + 45} cy={130 - r * 86} rx="10" ry="5.5" fill="#4c1d95"/></g>)}
    <T x={40} y={166} s={11.5}>éluant peu polaire</T><T x={150} y={166} s={11.5}>éluant plus polaire</T><T x={262} y={92} s={11.5} c={ORANGE} w={700}>Rf plus grand</T>
    <T x={262} y={110} s={11} c={GRIS}>l’éluant entraîne</T><T x={262} y={124} s={11} c={GRIS}>mieux l’espèce</T><T x={6} y={14} s={12.5} w={700}>Éluant plus polaire ⇒ taches plus hautes</T>
  </Schema>);
const SchemaTfCompat = () => (
  <Schema aria="La température de fusion mesurée avec son incertitude est comparée à celle de la littérature : si l'intervalle contient la valeur de la littérature, les valeurs sont compatibles" h={150}>
    <line x1="30" y1="96" x2="340" y2="96" stroke={GRIS}/>
    <line x1="150" y1="60" x2="150" y2="104" stroke={VERT} strokeWidth="3"/><T x={150} y={120} a="middle" s={11.5} c={VERT} w={700}>littérature : 98 °C</T>
    <line x1="116" y1="78" x2="164" y2="78" stroke={BLEU} strokeWidth="4"/><line x1="116" y1="70" x2="116" y2="86" stroke={BLEU} strokeWidth="3"/><line x1="164" y1="70" x2="164" y2="86" stroke={BLEU} strokeWidth="3"/><circle cx="140" cy="78" r="4.5" fill={BLEU}/>
    <T x={100} y={58} s={11.5} c={BLEU} w={700}>mesure 97 ± 2 °C</T><T x={6} y={14} s={12.5} w={700}>|Tf mesurée − Tf littérature| ≤ u : compatibles</T>
    <T x={6} y={140} s={11.5} c={GRIS}>fusion nette + valeur compatible ⇒ produit sans doute pur</T><T x={196} y={78} s={11.5}>l’intervalle contient 98 °C</T>
  </Schema>);

export function SimulationCcm({ integre = false, modeExt, setModeExt, suite } = {}) {
  const [modeLoc, setModeLoc] = useState(() => modeOuverture('ccm-guide-v1'));
  const mode = modeExt ?? modeLoc, setMode = setModeExt ?? setModeLoc;
  const [suiviP, noterP] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('ccm-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [dep, setDep] = useState(false), [elu, setElu] = useState(false);
  const [xe, setXe] = useState(0.5), [xprod, setXprod] = useState('brut'), [ximp, setXimp] = useState(0);
  useEffect(() => { if (mode === 'defi' && !defi) nouveauDefi(); }, [mode]);   // eslint-disable-line
  const enGuide = mode === 'guide', enDefi = mode === 'defi', etape = guide.etape;
  const P1 = C.plaque({ front: FRONT, produit: 'brut' }), P2 = C.plaque({ front: FRONT, produit: 'recris' });
  const dCh = C.distance('chalcone', FRONT), dAn = C.distance('anisaldehyde', FRONT), dAc = C.distance('acetophenone', FRONT);
  const rfCh = dCh / FRONT, rfAn = dAn / FRONT;

  const ETAPES = [
    { id: 'crayon', titre: 'Préparer la plaque', focus: ['plaque'],
      texte: <>On trace sur la plaque de silice une <strong>ligne de dépôt</strong> à 1,5{NB}cm du bas, avec 4 croix distantes de 0,5{NB}cm : produit préparé, chalcone de référence, anisaldéhyde, 4’-méthylacétophénone.</>,
      tache: { type: 'qcm', q: 'Avec quoi trace-t-on la ligne de dépôt, et pourquoi ?', options: ['au crayon de papier, car l’encre d’un stylo migrerait avec l’éluant', 'au stylo, car c’est plus visible sous la lampe UV', 'au marqueur, car il résiste à l’éluant'], bonne: 0,
        expl: 'Le crayon de papier (graphite) ne se dissout pas dans l’éluant. L’encre d’un stylo ou d’un marqueur migrerait avec l’éluant et créerait de fausses taches. On ne doit pas non plus enlever la couche de silice en appuyant.', indice: 'Que fait un solvant organique à l’encre ?' } },
    { id: 'niveau', titre: 'Dans la cuve', focus: ['plaque'],
      texte: <>La plaque est placée dans une cuve contenant 10{NB}mL d’éluant (mélange de pentane et d’éther éthylique). Le niveau d’éluant est représenté sur le schéma.</>,
      tache: { type: 'qcm', q: 'Pourquoi la ligne de dépôt doit-elle être au-dessus du niveau d’éluant ?', options: ['sinon les dépôts se dissoudraient dans l’éluant de la cuve au lieu de migrer sur la plaque', 'pour que l’éluant arrive plus vite en haut', 'pour que la lampe UV éclaire mieux les taches'], bonne: 0,
        expl: 'Si la ligne est sous le niveau, les produits déposés se dissolvent directement dans la cuve : plus rien ne migre sur la plaque. L’éluant monte ensuite par capillarité en entraînant les espèces.', indice: 'Où doit se trouver le dépôt au départ pour que l’éluant puisse l’entraîner en montant ?' } },
    { id: 'depot', titre: 'Déposer les 4 solutions', focus: ['plaque'],
      texte: <>On dissout une pointe de spatule de chaque substance dans 1{NB}mL d’acétone, puis on dépose une petite goutte de chaque solution sur sa croix à l’aide d’un capillaire : la tache doit être <strong>petite et intense</strong>.</>,
      tache: { type: 'action', ok: dep, label: 'Déposer les 4 solutions', faire: () => setDep(true), consigne: 'Les 4 solutions ne sont pas encore déposées' } },
    { id: 'elution', titre: 'Éluer la plaque', focus: ['plaque'],
      texte: <>On referme la cuve et on ne la déplace plus. L’éluant monte le long de la plaque : c’est l’<strong>élution</strong>. Lancez-la.</>,
      tache: { type: 'action', ok: elu, label: 'Lancer l’élution', faire: () => setElu(true), consigne: 'L’élution n’est pas lancée' } },
    { id: 'front', titre: 'Retirer la plaque', focus: ['plaque'],
      texte: <>L’éluant arrive à 1{NB}cm du haut de la plaque.</>,
      tache: { type: 'qcm', q: 'Que faut-il faire tout de suite ?', options: ['retirer la plaque et tracer au crayon la ligne du front de l’éluant, avant qu’il ne s’évapore', 'laisser la plaque dans la cuve jusqu’à ce que l’éluant atteigne le bord supérieur', 'sécher la plaque puis chercher où se trouvait le front'], bonne: 0,
        expl: 'Le front de l’éluant (sa hauteur maximale) s’efface en séchant : on le marque tout de suite au crayon. Ensuite on sèche sous la hotte et on révèle les taches à la lampe UV en les entourant.', indice: 'Que devient le front quand la plaque sèche ?' } },
    { id: 'rf1', titre: 'Le rapport frontal de la chalcone', focus: ['plaque', 'mesures'],
      retenirTitre: 'À RETENIR : LE RAPPORT FRONTAL Rf',
      retenir: <><SchemaRf/>{puces(<><strong>Rf = d ÷ D</strong> : distance parcourue par la tache divisée par celle du front, toutes deux mesurées <strong>depuis la ligne de dépôt</strong>.</>, <>Exemple : tache à 2,0 cm, front à 5,0 cm ⇒ Rf = 0,40.</>, <>Un Rf est <strong>sans unité</strong> et toujours compris entre <strong>0 et 1</strong>.</>, <><strong>Idée fausse</strong> : « le Rf est la hauteur de la tache ». <strong>Vrai</strong> : c’est un rapport, il ne dépend pas de la taille de la plaque.</>)}</>,
      texte: <>On mesure depuis la ligne de dépôt : le front est à {nbf(FRONT, 1)}{NB}cm et la tache de la chalcone de référence est à {nbf(dCh, 1)}{NB}cm.</>,
      tache: { type: 'num', q: 'Rf de la chalcone', unite: '', vrai: rfCh, tol: 0.03, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => [`Rf = d ÷ D = ${nbf(dCh, 1)} ÷ ${nbf(FRONT, 1)} = ${nbf(rfCh, 2)}.`], pieges: [[FRONT / dCh, 'Vous avez inversé : Rf = distance de la tache ÷ distance du front (inférieur à 1).'], [dCh, 'Il faut diviser par la distance du front : un Rf est sans unité.']],
        expl: `Rf = ${nbf(dCh, 1)} / ${nbf(FRONT, 1)} = ${nbf(rfCh, 2)}.`, indice: 'Rf = d ÷ D, avec d la distance de la tache et D celle du front, depuis la ligne de dépôt.' } },
    { id: 'rf2', titre: 'Le Rf de l’anisaldéhyde', focus: ['plaque', 'mesures'],
      texte: <>La tache de l’anisaldéhyde (voie 3) est à {nbf(dAn, 1)}{NB}cm de la ligne de dépôt. Le front est à {nbf(FRONT, 1)}{NB}cm.</>,
      tache: { type: 'num', q: 'Rf de l’anisaldéhyde', unite: '', vrai: rfAn, tol: 0.03, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => [`Rf = ${nbf(dAn, 1)} ÷ ${nbf(FRONT, 1)} = ${nbf(rfAn, 2)}.`], pieges: [[FRONT / dAn, 'Vous avez inversé le rapport : le Rf est inférieur à 1.']],
        expl: `Rf = ${nbf(dAn, 1)} / ${nbf(FRONT, 1)} = ${nbf(rfAn, 2)}.`, indice: 'Rf = distance de la tache ÷ distance du front.' } },
    { id: 'brut', titre: 'Le produit brut est-il pur ?', focus: ['plaque'],
      retenirTitre: 'À RETENIR : COMPARER LES TACHES',
      retenir: <><SchemaComparer/>{puces(<>On <strong>compare</strong> la voie du produit aux voies de référence : même hauteur (même Rf) ⇒ même espèce, <strong>a priori</strong>.</>, <>Une tache à la hauteur de la chalcone confirme sa présence ; une <strong>seconde tache</strong> à la hauteur d’un réactif révèle une <strong>impureté</strong>.</>, <>Exemple : tache en plus à la hauteur de l’anisaldéhyde ⇒ il en reste dans le produit.</>, <><strong>Idée fausse</strong> : « une seule tache prouve que c’est pur ». <strong>Vrai</strong> : c’est un bon indice, pour cet éluant seulement.</>)}</>,
      texte: <>Sur la plaque, la voie 1 (produit brut) montre <strong>deux taches</strong> : l’une à {nbf(dCh, 1)}{NB}cm, l’autre, plus pâle, à {nbf(dAn, 1)}{NB}cm.</>,
      tache: { type: 'qcm', q: 'Que conclure pour le produit brut ?', options: ['il contient de la chalcone, mais aussi de l’anisaldéhyde non consommé', 'il ne contient pas de chalcone', 'il contient de la 4’-méthylacétophénone seulement'], bonne: 0,
        expl: `La grande tache est à ${nbf(dCh, 1)} cm, comme la chalcone de référence (Rf ${nbf(rfCh, 2)}). La tache pâle est à ${nbf(dAn, 1)} cm, comme l’anisaldéhyde : il en reste un peu dans le produit brut, c’est une impureté.`, indice: 'Comparez la hauteur de chaque tache de la voie 1 avec celle des voies 2, 3 et 4.' } },
    { id: 'recris', titre: 'Après la recristallisation', focus: ['plaque2'],
      texte: <>On recommence la CCM avec le produit recristallisé : il ne montre plus qu’une seule tache, à la hauteur de la chalcone de référence.</>,
      tache: { type: 'qcm', q: 'Que peut-on conclure ?', options: ['la recristallisation a éliminé l’anisaldéhyde : le produit semble pur dans cet éluant', 'le produit est certainement pur, quel que soit l’éluant utilisé', 'la recristallisation a détruit la chalcone'], bonne: 0,
        expl: 'La tache d’anisaldéhyde a disparu : l’impureté a été éliminée à la précision de la CCM. Une seule tache est un bon indice de pureté mais ne le prouve pas : une autre impureté pourrait migrer comme la chalcone dans cet éluant. Mesurer la température de fusion complète le contrôle.', indice: 'Que dit la présence ou l’absence de la tache d’anisaldéhyde ? Une seule CCM suffit-elle à prouver la pureté ?' } },
    { id: 'eluant', titre: 'Changer d’éluant', focus: [],
      retenirTitre: 'À RETENIR : L’ÉLUANT ET LE Rf',
      retenir: <><SchemaEluant/>{puces(<>La silice (phase fixe) est <strong>polaire</strong> : elle retient les espèces polaires. L’éluant (phase mobile) les entraîne d’autant mieux qu’il est <strong>polaire</strong> lui aussi.</>, <>Plus d’éther éthylique (plus polaire) dans le pentane ⇒ <strong>Rf plus grands</strong>.</>, <>Exemple : 0,45 avec un éluant, environ 0,70 avec un éluant plus polaire.</>, <>On compare toujours des Rf obtenus <strong>sur la même plaque, avec le même éluant</strong>.</>)}</>,
      texte: <>Un élève refait la plaque en ajoutant davantage d’éther éthylique, un solvant plus polaire que le pentane.</>,
      tache: { type: 'qcm', q: 'Comment évoluent les taches ?', options: ['elles montent plus haut : les Rf augmentent', 'elles restent à la même hauteur : le Rf ne dépend pas de l’éluant', 'elles descendent : les Rf diminuent'], bonne: 0,
        expl: 'Un éluant plus polaire entraîne mieux les espèces et fait monter les taches : les Rf augmentent. Le Rf dépend donc de l’éluant, et on ne compare que des taches d’une même plaque.', indice: 'Plus l’éluant ressemble aux espèces en polarité, plus il les entraîne.' } },
    { id: 'gants', titre: 'Mesurer la température de fusion', focus: [],
      texte: <>On dépose quelques cristaux de chalcone recristallisée sur le <strong>banc Kofler</strong>, plaque chauffante graduée en température. Le TP précise : « NE PAS PORTER DE GANTS ».</>,
      tache: { type: 'qcm', q: 'Pourquoi retirer ses gants près du banc Kofler ?', options: ['un gant en contact avec la plaque chaude peut fondre et coller à la peau : risque de brûlure', 'les gants empêchent de lire la graduation', 'les gants font fondre les cristaux trop vite'], bonne: 0,
        expl: 'Le banc atteint plusieurs centaines de degrés à une extrémité : un gant en matière plastique peut fondre au contact et brûler. On garde les lunettes, on éloigne les substances inflammables, et on évite tout contact avec la plaque.', indice: 'Que devient un gant en plastique sur une surface très chaude ?' } },
    { id: 'tfread', titre: 'Lire la température de fusion', focus: ['kofler'],
      texte: <>Les cristaux fondent progressivement : à gauche du curseur ils sont encore solides, à droite ils sont fondus. Le curseur est placé à la limite des deux. Lisez la température indiquée.</>,
      tache: { type: 'num', q: 'Température de fusion lue sur le banc Kofler', unite: '°C', vrai: TF_MES, tol: 0.03, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['Le curseur est entre les graduations 95 et 100 °C, au niveau de 97 °C.', 'Lecture : 97 °C (à ± 2 °C près environ).'], pieges: [],
        expl: 'La limite entre cristaux solides et fondus est à 97 °C.', indice: 'Repérez les deux graduations (en °C) qui encadrent le curseur rouge.' } },
    { id: 'tfcompat', titre: 'Le produit est-il pur ?', focus: ['kofler'],
      retenirTitre: 'À RETENIR : COMPARER À LA LITTÉRATURE',
      retenir: <><SchemaTfCompat/>{puces(<>On compare la Tf <strong>mesurée</strong> à la valeur de la <strong>littérature</strong> en tenant compte de l’<strong>incertitude</strong> de lecture.</>, <>Ici u ≈ 2 °C (valeur de travail, de type B). Exemple : 97 ± 2 °C contient 98 °C ⇒ compatible.</>, <>Un produit pur : fusion <strong>nette</strong> et Tf compatible. Impur : Tf <strong>abaissée</strong> et fusion <strong>étalée</strong>.</>, <>La CCM <strong>identifie</strong> ; la Tf juge la <strong>pureté</strong>.</>)}</>,
      texte: <>Vous avez lu {nbf(TF_MES, 0)}{NB}°C. La littérature indique 98{NB}°C pour la chalcone. Le banc est étalonné et la lecture a une incertitude d’environ 2{NB}°C (hypothèse de travail). La fusion s’est faite sur moins de 1{NB}°C.</>,
      tache: { type: 'qcm', q: 'Que conclure ?', options: ['valeurs compatibles et fusion nette : le produit est sans doute pur', 'le produit est impur, car 97 est différent de 98', 'ce n’est pas de la chalcone, car la valeur n’est pas exactement 98 °C'], bonne: 0,
        expl: '|97 − 98| = 1 °C est inférieur à l’incertitude de 2 °C : les valeurs sont compatibles. Une fusion nette (moins de 1 °C) va dans le sens d’un produit pur. Une mesure n’est jamais exactement égale à la valeur de la littérature.', indice: 'Comparez l’écart |Tf mesurée − Tf littérature| à l’incertitude u = 2 °C.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous savez lire une CCM (Rf, comparaison avec les références) et une température de fusion. En exploration, changez l’éluant, l’échantillon et le taux d’impuretés ; en défi, identifiez une impureté par son Rf.</>, tache: null },
  ];
  const IDS = ETAPES.map(e => e.id), idE = ETAPES[Math.min(etape, ETAPES.length - 1)].id;
  const depuis = id => !enGuide || etape >= IDS.indexOf(id), apres = id => !enGuide || etape > IDS.indexOf(id);
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(); }
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {suite && <button onClick={suite.action} style={styleBouton(true, '#7c3aed')}>{suite.label} ▶</button>}
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Paillasse libre</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défi</button>
    </span>);

  // ════════════════ DÉFI ════════════════
  const nouveauDefi = () => {
    const front = tire([5.0, 5.5, 6.0, 6.5, 7.0]), imp = tire(['anisaldehyde', 'acetophenone']);
    const dc = C.distance('chalcone', front), di = C.distance(imp, front);
    const ordre = Math.random() < 0.5;
    setDefi({ front, imp, dc, di, ordre, vrai: di / front, reps: {}, verifie: false });
  };
  const verifier = () => { const x = lireNombre(defi.reps.r), ok = isFinite(x) && proche(x, defi.vrai, 0.05); setDefi(d => ({ ...d, verifie: true, ok })); noterP(ok); };
  const taches = defi ? (defi.ordre ? [['A', defi.dc], ['B', defi.di]] : [['A', defi.di], ['B', defi.dc]]) : [];
  const voletDefi = defi && (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : quel est le Rf de l’impureté ?</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>
        Sur une plaque de CCM du produit brut, le front de l’éluant est à <strong>{nbf(defi.front, 1)}{NB}cm</strong> de la ligne de dépôt. La voie du produit montre deux taches, A à <strong>{nbf(taches[0][1], 1)}{NB}cm</strong> et B à <strong>{nbf(taches[1][1], 1)}{NB}cm</strong>. La chalcone de référence est à <strong>{nbf(defi.dc, 1)}{NB}cm</strong>. L’une des deux taches est la chalcone, l’autre est une impureté. Donnez le Rf de l’<strong>impureté</strong> avec 2 chiffres significatifs.
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
        <span>Rf de l’impureté</span>
        <input value={defi.reps.r ?? ''} aria-label="Rf de l’impureté" onKeyDown={e => e.key === 'Enter' && document.getElementById('cc-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { r: e.target.value }, verifie: false }))}
          style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
      </div>
      <IndiceDefi cache={false}>{'La tache qui n’est pas à la hauteur de la chalcone de référence est l’impureté. Rf = distance de la tache ÷ distance du front, toutes deux depuis la ligne de dépôt.'}</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="cc-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={nouveauDefi} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? `✓ Correct : Rf = ${nbf(defi.vrai, 2)}. Cette valeur est celle ${defi.imp === 'anisaldehyde' ? 'de l’anisaldéhyde (réactif non consommé)' : 'de la 4’-méthylacétophénone (réactif non consommé)'} dans cet éluant.` : '✗ Vérifiez : l’impureté est la tache qui n’est PAS à la hauteur de la chalcone ; Rf = d ÷ D (sans unité, inférieur à 1).'}
      </div>}
    </div>);

  // ════════════════ EXPLORATION ════════════════
  const Px = C.plaque({ front: FRONT, e: xe, produit: xprod }), fx = C.fusion(ximp);
  const explore = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={styleBoite}>
        <Plaque p={Px} etat="eluee" titre="Plaque après élution"/>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, fontSize: 14, color: KIT.txt }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><span style={{ flex: '1 1 170px' }}>Éther éthylique dans l’éluant</span><input type="range" min="0.1" max="0.9" step="0.05" value={xe} onChange={e => setXe(parseFloat(e.target.value))} aria-label="Proportion d’éther dans l’éluant" style={{ flex: '2 1 140px', minHeight: 32 }}/><strong style={{ width: 52, textAlign: 'right' }}>{nbf(xe * 100, 0)}{NB}%</strong></label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} role="group" aria-label="Échantillon déposé sur la voie 1">{Object.entries(C.ECHANTILLONS).map(([k, v]) => <button key={k} onClick={() => setXprod(k)} aria-pressed={xprod === k} style={stylePetitBouton(xprod === k, '#0e7490')}>{v.nom}</button>)}</div>
        </div>
      </div>
      <div style={styleBoite}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Rf mesurés (front à {nbf(FRONT, 1)}{NB}cm)</div>
        <table style={{ borderCollapse: 'collapse', fontSize: 13.5 }}><thead><tr><th style={cel(true)}>voie</th><th style={cel(true)}>d (cm)</th><th style={cel(true)}>Rf</th></tr></thead>
          <tbody>{Px.voies.flatMap((v, i) => v.taches.map((t, k) => <tr key={`${i}${k}`}><td style={{ ...cel(), textAlign: 'left' }}>{i + 1} · {v.etiquette}{v.taches.length > 1 ? ` (${k + 1})` : ''}</td><td style={cel()}>{nbf(t.d, 1)}</td><td style={cel()}>{nbf(t.d / FRONT, 2)}</td></tr>))}</tbody></table>
      </div>
      <div style={styleBoite}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Banc Kofler</div>
        <Kofler tf={fx.fin - fx.largeur / 2} largeur={fx.largeur > 1.5 ? 1 : 0}/>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 14, color: KIT.txt, marginTop: 8 }}><span style={{ flex: '1 1 170px' }}>Taux d’impuretés dans le produit</span><input type="range" min="0" max="8" step="0.5" value={ximp} onChange={e => setXimp(parseFloat(e.target.value))} aria-label="Taux d’impuretés" style={{ flex: '2 1 140px', minHeight: 32 }}/><strong style={{ width: 52, textAlign: 'right' }}>{nbf(ximp, 1)}{NB}%</strong></label>
        <div style={{ fontSize: 14, color: KIT.txt, marginTop: 6, lineHeight: 1.6 }}>Fusion observée de <strong>{nbf(fx.debut, 0)}</strong> à <strong>{nbf(fx.fin, 0)}{NB}°C</strong> (littérature : {C.TF_LIT}{NB}°C, u = {C.U_TF}{NB}°C). {C.compatibleTf(fx.fin) && fx.largeur < 2 ? <span style={{ color: VERT, fontWeight: 700 }}>Compatible et nette : produit sans doute pur.</span> : <span style={{ color: ROUGE, fontWeight: 700 }}>Tf abaissée ou fusion étalée : produit impur.</span>}</div>
      </div>
    </div>);

  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Rf illustratifs</strong> : les valeurs (chalcone 0,45 ; anisaldéhyde 0,55 ; 4’-méthylacétophénone 0,65 pour l’éluant de référence) respectent l’ordre de migration mais ne sont <strong>pas mesurées</strong> ; elles varient en pratique avec la plaque, l’éluant et la température.</li>
      <li><strong>Mesure des distances</strong> : lues à 0,1 cm près au centre de chaque tache ; le Rf est donc connu à quelques centièmes près.</li>
      <li><strong>Identification</strong> : deux espèces de même Rf <strong>peuvent</strong> être identiques mais ce n’est pas une preuve ; une seule tache ne prouve pas la pureté.</li>
      <li><strong>Température de fusion</strong> : incertitude de lecture u = 2 °C, <strong>valeur de travail</strong> de type B (estimée, non répétée), qui suppose le banc étalonné. Deux valeurs sont dites compatibles si leur écart est inférieur ou égal à u.</li>
      <li><strong>Modèle d’impuretés</strong> : l’abaissement linéaire de la Tf et l’étalement de la fusion avec le taux d’impuretés sont un modèle <strong>qualitatif</strong> ; les chiffres ne sont pas des mesures.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;

  const etatPlaque = !depuis('depot') || (idE === 'depot' && !dep) ? 'vide' : (!elu && !apres('elution')) ? 'depot' : 'eluee';
  const lignesMesures = depuis('rf1') && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Distances mesurées depuis la ligne de dépôt</div>
      <table style={{ borderCollapse: 'collapse', fontSize: 13.5 }}><thead><tr><th style={cel(true)}>repère</th><th style={cel(true)}>d (cm)</th></tr></thead>
        <tbody><tr><td style={{ ...cel(), textAlign: 'left' }}>front de l’éluant</td><td style={cel()}>{nbf(FRONT, 1)}</td></tr><tr><td style={{ ...cel(), textAlign: 'left' }}>voie 2 : chalcone</td><td style={cel()}>{nbf(dCh, 1)}</td></tr>
          {depuis('rf2') && <tr><td style={{ ...cel(), textAlign: 'left' }}>voie 3 : anisaldéhyde</td><td style={cel()}>{nbf(dAn, 1)}</td></tr>}{depuis('rf2') && <tr><td style={{ ...cel(), textAlign: 'left' }}>voie 4 : 4’-méthylacétophénone</td><td style={cel()}>{nbf(dAc, 1)}</td></tr>}</tbody></table>
    </div>);
  const plaques = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...styleBoite, ...cadre('plaque') }}><Plaque p={P1} etat={etatPlaque} niveau={depuis('niveau')} titre="Plaque du produit brut"/></div>
      {lignesMesures}
      {depuis('recris') && <div style={{ ...styleBoite, ...cadre('plaque2') }}><div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Plaque avec le produit recristallisé</div><Plaque p={P2} etat="eluee" titre="Plaque du produit recristallisé"/></div>}
    </div>);
  const guideScene = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {depuis('gants') ? <details style={styleBoite}><summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 700, color: KIT.txt }}>✓ Les plaques de CCM (revoir)</summary><div style={{ marginTop: 8 }}>{plaques}</div></details> : plaques}
      {depuis('tfread') && <div style={{ ...styleBoite, ...cadre('kofler') }}><div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Banc Kofler</div><Kofler tf={TF_MES}/></div>}
    </div>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .cc-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .cc-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        @media (min-width: 901px) { .cc-l1.cote .cc-carte { order: 2; } .cc-l1.cote .cc-main { order: 1; } }
        @media (max-width: 900px) { .cc-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      {!integre && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>CCM et température de fusion</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>}
      {!integre && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Contrôler le produit du TP de la <strong>chalcone</strong> : lire une plaque de <strong>CCM</strong> (Rf, comparaison avec des références) et une <strong>température de fusion</strong> sur banc Kofler.</div>}
      <div className={`cc-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {enGuide ? <div className="cc-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="cc-carte">{panneauHypo}</div> : null}
        <div className="cc-main">
          {enGuide && guideScene}
          {enDefi && defi && <div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.rf`} etat={suiviP}/></div>}
          {mode === 'explore' && explore}
        </div>
      </div>
      {(mode === 'explore' || (enGuide && etape >= ETAPES.length - 1)) && panneauHypo}
      {mode === 'explore' && <div style={{ marginTop: 12 }}><ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}><li>Rf = d ÷ D (depuis la ligne de dépôt) ; 0 &lt; Rf &lt; 1, sans unité</li><li>même plaque, même éluant : même hauteur ⇒ même espèce (a priori) ; éluant plus polaire ⇒ Rf plus grands</li><li>Tf mesurée compatible avec la littérature et fusion nette ⇒ produit sans doute pur</li></ul></ARetenir></div>}
    </div>
  );
}
