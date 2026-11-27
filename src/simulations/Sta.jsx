import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, IndiceDefi, indicesProfond } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./staModele";
import { SceneSta, VignetteIntermediaire } from "./StaScene";
import { SvgGeometrieCarte, SvgCationsCarte, SvgAnionsCarte, SvgProduitCarte, SvgBilanStaCarte } from "./StaSchemas";
import { Seg, Chips } from "./exploAnim";

// ====================================================
// SIM 320 — « Stabilité des intermédiaires et produit majoritaire » (terminale STL, SPCL, Chimie et développement durable : séquence 9, aspects microscopiques).
//  Une idée : un intermédiaire carboné (carbocation, carbanion, radical) a une géométrie prévue par VSEPR ; sa stabilité dépend des groupes donneurs ou attracteurs
//  qui l'entourent ; le mécanisme étant fourni, l'intermédiaire le plus stable se forme le plus vite et conduit au produit majoritaire.
//  Capacité visée (jamais affichée à l'élève) : prévoir la géométrie des carbocations et carbanions ; comparer la stabilité d'intermédiaires pour interpréter le produit majoritaire.
//  Hors périmètre : hyperconjugaison détaillée, énergies chiffrées, effets mésomères, Arrhenius. Modèle : staModele.js. Scène 3D : StaScene.jsx. Réutilise regioModele.js (sim 93) sans le modifier.
// ====================================================
const BLEU = '#7c3aed';
const SIM_ID = 320, CLE_GUIDE = 'sta-guide-v1';
declarerDefis(SIM_ID, [['classer', 'Quel intermédiaire est le plus stable ?'], ['produit', 'Produit majoritaire d’une addition']]);
const IDS = ['inter', 'electrons', 'vsepr', 'anion', 'radical', 'classes', 'cations', 'attracteur', 'anions', 'mecanisme', 'produit', 'catalyseur', 'bilan'];
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const DEF = {
  inter: { type: 'cation', subs: ['Me', 'H', 'H'], chips: true, aide: 'Choisissez un type d’intermédiaire : la forme de la molécule change. Faites glisser la scène pour la tourner.' },
  electrons: { type: 'cation', subs: ['Me', 'H', 'H'], aide: 'Le carbone est lié à trois substituants (traits). Une orbitale vide est dessinée en pointillés.' },
  vsepr: { type: 'cation', subs: ['Me', 'H', 'H'], aide: 'Tournez la molécule pour la voir sous plusieurs angles.' },
  anion: { type: 'anion', subs: ['Me', 'H', 'H'], aide: 'Le trait vert posé sur le lobe est le doublet non liant du carbone.' },
  radical: { type: 'radical', subs: ['Me', 'H', 'H'], aide: 'Le point orange est l’électron célibataire du carbone.' },
  classes: { type: 'cation', subs: ['H', 'H', 'H'], sel: true, aide: 'Choisissez les trois substituants dans les menus : la classe du carbocation s’adapte.' },
  cations: { type: 'cation', subs: ['Me', 'H', 'H'], sel: true, aide: 'Changez les substituants et comparez avec le texte de l’énoncé.' },
  attracteur: { type: 'cation', subs: ['Cl', 'H', 'H'], sel: true, aide: 'Le chlore (vert) est un atome attracteur d’électrons ; le groupe CH₃ (gris) est donneur.' },
  anions: { type: 'anion', subs: ['Cl', 'H', 'H'], sel: true, aide: 'Pour un carbanion, la charge est − : le rôle des groupes est inversé.' },
};
const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
const sel = (id, lab, v, onChange, opts) => (<div style={{ minWidth: 0 }}>
  <label htmlFor={id} style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>{lab}</label>
  <select id={id} value={v} onChange={onChange} style={menu}>{opts}</select></div>);
const TYPES_OPTS = M.LISTE_TYPES.map(k => [k, M.TYPES[k].court]);
const subsOpts = M.LISTE_SUBS.map(k => <option key={k} value={k}>{M.SUBS[k].sym} ({M.SUBS[k].nom})</option>);
const ariaScene = (type, subs) => `${M.TYPES[type].nom} : carbone lié à ${subs.map(x => M.SUBS[x].nom).join(', ')} ; ${M.TYPES[type].forme}.`;
const ALC = M.ALCENES.find(a => a.id === 'mbut2ene');

// ---------- panneau « mécanisme fourni » ----------
function PanneauMeca({ etape2 }) {
  const boite = (titre, lig, c, maj) => (<div style={{ flex: '1 1 150px', minWidth: 0, border: `2px solid ${c}`, borderRadius: 12, background: maj ? '#fff7ed' : '#fff', padding: '8px 10px', fontSize: 14, lineHeight: 1.5 }}>
    <div style={{ fontWeight: 800, color: c }}>{titre}</div>{lig}</div>);
  return (<div style={{ ...styleBoite, padding: 8 }}>
    <div style={{ fontSize: 14, lineHeight: 1.5, color: KIT.txt, marginBottom: 6 }}>Mécanisme fourni : addition de <strong>HBr</strong> sur le <strong>{ALC.nom}</strong> {ALC.semi}. <strong>Étape 1</strong> : H⁺ se fixe sur l’un des deux carbones de la double liaison et forme un <strong>carbocation</strong> (étape lente). <strong>Étape 2</strong> : Br⁻ se fixe sur le carbone chargé.</div>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {boite('Voie A', <>H⁺ sur C3 : carbocation (CH₃)₂C⁺–CH₂–CH₃<br/>carbone chargé lié à <strong>3</strong> carbones : <strong>classe III</strong></>, '#ea580c', false)}
      {boite('Voie B', <>H⁺ sur C2 : carbocation (CH₃)₂CH–C⁺H–CH₃<br/>carbone chargé lié à <strong>2</strong> carbones : <strong>classe II</strong></>, '#64748b', false)}
    </div>
    {etape2 && <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 6, lineHeight: 1.45 }}>Produits possibles : 2-bromo-2-méthylbutane (Br sur C2) et 3-bromo-2-méthylbutane (Br sur C3).</div>}
  </div>);
}

// ---------- scène du guide / exploration ----------
function BlocScene({ cfg, st, onChange }) {
  const { type, subs } = st;
  return (
    <div style={{ ...styleBoite, padding: 6 }}>
      <SceneSta type={type} subs={subs} aria={ariaScene(type, subs)}/>
      <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: KIT.txt, marginTop: 2 }}>{M.nomIntermediaire(type, subs)}</div>
      {cfg.chips && <div style={{ marginTop: 8 }}><Seg label="Type d’intermédiaire" valeur={type} options={TYPES_OPTS} onChange={v => onChange({ type: v })}/></div>}
      {cfg.sel && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginTop: 8 }}>
        {[0, 1, 2].map(i => sel(`st-s${i}`, `Substituant ${i + 1}`, subs[i], ev => onChange({ subs: subs.map((x, j) => (j === i ? ev.target.value : x)) }), subsOpts))}</div>}
      {cfg.aide && <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 8, lineHeight: 1.45 }}>{cfg.aide}</div>}
    </div>);
}

// ---------- exploration ----------
function StaExplore({ ex, setEx, ouv, setOuv }) {
  const { type, subs } = ex, T = M.TYPES[type], cl = M.classe(subs), ind = M.indice(type, subs), pyr = M.pyramidalisation(type);
  const pct = Math.max(0, Math.min(100, 50 + ind * 16.5));
  const mot = type === 'radical' ? 'stabilisé par les alkyles' : ind > 0 ? 'stabilisé' : ind < 0 ? 'déstabilisé' : 'ni stabilisé ni déstabilisé';
  const message = type === 'radical' ? `Radical : ${M.nbAlkyl(subs)} groupe${M.nbAlkyl(subs) > 1 ? 's' : ''} alkyle${M.nbAlkyl(subs) > 1 ? 's' : ''}, stabilité faiblement croissante avec les alkyles ; les atomes attracteurs ne sont pas pris en compte ici.`
    : `${T.court[0].toUpperCase() + T.court.slice(1)} (${M.sym(subs)}) : ${M.nbAlkyl(subs)} groupe${M.nbAlkyl(subs) > 1 ? 's' : ''} donneur${M.nbAlkyl(subs) > 1 ? 's' : ''} (CH₃) et ${M.nbAttr(subs)} attracteur${M.nbAttr(subs) > 1 ? 's' : ''} (Cl, C≡N) : ${mot}.`;
  return (
    <div>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '0 auto 10px', gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <Section titre={`${T.court} · ${M.sym(subs)}`} ouvert={ouv.reglages} onBascule={() => setOuv(o => ({ ...o, reglages: !o.reglages }))}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
              {[0, 1, 2].map(i => sel(`sx-s${i}`, `Substituant ${i + 1}`, subs[i], ev => setEx(x => ({ ...x, subs: x.subs.map((s, j) => (j === i ? ev.target.value : s)) })), subsOpts))}</div>
            <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.45 }}>Les menus choisissent les trois groupes liés au carbone. Faites glisser la scène pour la tourner.</div>
          </div>
        </Section>
      </div>
      <div style={{ maxWidth: 520, margin: '0 auto 8px' }}><Seg label="Type d’intermédiaire (la forme change avec animation)" valeur={type} options={TYPES_OPTS} onChange={v => setEx(x => ({ ...x, type: v }))}/></div>
      <div style={{ ...styleBoite, padding: 6, maxWidth: 520, margin: '0 auto' }}>
        <SceneSta type={type} subs={subs} aria={ariaScene(type, subs)}/>
        <div style={{ margin: '4px 8px 6px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2, marginBottom: 3 }}>Stabilité relative (indice qualitatif)</div>
          <div style={{ position: 'relative', height: 16, borderRadius: 8, background: 'linear-gradient(90deg,#fecaca,#fef9c3,#bbf7d0)', border: `1px solid ${KIT.bord}` }}>
            <div style={{ position: 'absolute', left: `calc(${pct}% - 7px)`, top: -3, width: 14, height: 22, borderRadius: 6, background: '#0f172a', transition: 'left 0.4s' }}/></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: KIT.txt2, marginTop: 2 }}><span>moins stable</span><span>plus stable</span></div>
        </div>
      </div>
      <div role="status" aria-live="polite" style={{ minHeight: 56, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, color: KIT.txt2 }}>{message}</div>
      <Chips items={[['Géométrie', T.forme, '#7c3aed'], ['Angle ≈', `${Math.round(M.angleHCH(pyr))}°`, '#475569'], ['Électrons autour de C', `${T.electrons}`, '#0f766e'], ['Classe', type === 'radical' || type === 'cation' || type === 'anion' ? M.NOM_CLASSE[cl] : '', '#b45309']]}/>
    </div>);
}

export function SimulationSta() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviC, noterC] = useCompteurDefi(), [suiviP, noterP] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [st, setSt] = useState({}), [vus, setVus] = useState({});
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('classer');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ reglages: false, essayer: false, retenir: false });
  const [ex, setEx] = useState({ type: 'cation', subs: ['Me', 'Me', 'H'] });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const idx = enGuide ? Math.min(guide.etape, IDS.length - 1) : -1, idE = IDS[Math.max(idx, 0)];
  const cur = id => st[id] || { type: DEF[id]?.type || 'cation', subs: DEF[id]?.subs || ['H', 'H', 'H'] };
  const change = (id, patch) => { setSt(s => ({ ...s, [id]: { ...(s[id] || { type: DEF[id].type, subs: DEF[id].subs }), ...patch } })); if (patch.type) setVus(v => ({ ...v, [patch.type]: true })); };
  const vu = { cation: true, ...vus };

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'inter', titre: 'Un intermédiaire réactionnel carboné',
      texte: <>Lors d’une réaction, il arrive qu’une espèce <strong>très instable</strong> se forme puis disparaisse aussitôt : c’est un <strong>intermédiaire réactionnel</strong>. Quand un atome de <strong>carbone</strong> n’a que <strong>trois liaisons</strong>, trois cas sont possibles : le <strong>carbocation</strong> (charge +), le <strong>carbanion</strong> (charge −) et le <strong>radical</strong> (électron célibataire). Affichez les trois avec le sélecteur et observez la forme de la molécule.</>,
      tache: { type: 'action', ok: !!(vu.cation && vu.anion && vu.radical), consigne: vu.cation && vu.anion && vu.radical ? '✓ Vous avez observé les trois intermédiaires.' : 'Affichez successivement le carbocation, le carbanion et le radical (sélecteur sous la scène).' } },
    { id: 'electrons', titre: 'Compter les électrons autour du carbone',
      texte: <>Un carbone <strong>neutre</strong> est entouré de 8 électrons : <strong>4 liaisons</strong> de 2 électrons. Dans un <strong>carbocation</strong>, le carbone n’a que <strong>trois liaisons</strong> et <strong>aucun doublet non liant</strong> : il a perdu une liaison, la charge est +. Chaque liaison compte pour <strong>2 électrons</strong> autour du carbone.</>,
      tache: { type: 'num', q: 'Combien d’électrons entourent le carbone d’un carbocation ?', unite: '', vrai: 6, tol: 0.03, affiche: v => String(Math.round(v)), cs: 1, carnet: false,
        calcul: () => ['Le carbone a 3 liaisons, chacune de 2 électrons, et aucun doublet non liant.', 'Électrons autour de C = 3 × 2 = 6 : il manque 2 électrons pour l’octet (lacune).'],
        pieges: [[8, 'C’est le nombre d’électrons d’un carbone neutre (4 liaisons). Dans un carbocation, il n’y a que 3 liaisons.'], [3, 'Vous avez compté le nombre de liaisons : chaque liaison compte pour 2 électrons.'], [7, 'Un électron célibataire est en plus dans un radical, pas dans un carbocation.']],
        expl: 'Un carbocation a 3 liaisons et aucun doublet non liant : 3 × 2 = 6 électrons, soit une lacune de 2 électrons.', indice: 'Chaque trait de liaison représente un doublet, donc 2 électrons autour du carbone. Combien de traits sont dessinés ?' } },
    { id: 'vsepr', titre: 'Géométrie du carbocation',
      texte: <>La méthode <strong>VSEPR</strong> prévoit la géométrie d’un atome central à partir du nombre de <strong>groupes d’électrons</strong> qui l’entourent (liaisons et doublets non liants), qui se repoussent et s’écartent au maximum. Le carbone du carbocation a <strong>3 liaisons</strong> et <strong>0 doublet non liant</strong> : on note <strong>AX₃E₀</strong>.</>,
      tache: { type: 'qcm', q: 'Quelle est la géométrie d’un carbocation AX₃E₀ ?', options: ['Tétraédrique, avec des angles de 109° entre les liaisons', 'Pyramidale à base triangulaire, angles d’environ 107°', 'Trigonale plane, angles de 120°', 'Linéaire, avec un angle de 180°'], bonne: 2,
        expl: 'Trois groupes d’électrons autour de C se repoussent au maximum : ils se placent dans un plan à 120° les uns des autres (géométrie trigonale plane). L’orbitale vide est perpendiculaire à ce plan.',
        indice: 'Trois groupes qui se repoussent au maximum : où se placent-ils, tous dans le même plan ou pas ?' } },
    { id: 'anion', titre: 'Géométrie du carbanion',
      texte: <>Dans un <strong>carbanion</strong>, le carbone a <strong>3 liaisons</strong> et <strong>1 doublet non liant</strong> (dessiné par un trait) : 4 groupes d’électrons, dont 3 liaisons : <strong>AX₃E₁</strong>. Le doublet non liant occupe une direction de l’espace et repousse un peu plus les liaisons.</>,
      tache: { type: 'qcm', q: 'Comparé au carbocation, le carbanion AX₃E₁ est…', options: ['plan, comme le carbocation, avec des angles de 120°', 'pyramidal, angles proches de 107°', 'linéaire, avec un angle de 180° entre les liaisons', 'plan, avec trois angles de 90° entre les liaisons'], bonne: 1,
        expl: 'Les 4 groupes d’électrons s’orientent vers les sommets d’un tétraèdre : les 3 liaisons forment une pyramide à base triangulaire, le doublet non liant occupe le quatrième sommet. L’angle est un peu inférieur à 109° (environ 107°).',
        indice: 'Quatre groupes d’électrons autour de C (3 liaisons et 1 doublet) : quelle forme prennent-ils, comme dans l’ammoniac ?' } },
    { id: 'radical', titre: 'Le radical carboné',
      texte: <>Dans un <strong>radical</strong>, le carbone a <strong>3 liaisons</strong> et <strong>un seul électron</strong> « célibataire » (dessiné par un point), pas un doublet. Sa géométrie est <strong>presque plane</strong>, proche de celle du carbocation.</>,
      tache: { type: 'num', q: 'Combien d’électrons entourent le carbone d’un radical (3 liaisons et 1 électron célibataire) ?', unite: '', vrai: 7, tol: 0.03, affiche: v => String(Math.round(v)), cs: 1, carnet: false,
        calcul: () => ['3 liaisons × 2 électrons = 6 électrons, plus 1 électron célibataire.', 'Électrons autour de C = 6 + 1 = 7.'],
        pieges: [[6, 'Vous avez oublié l’électron célibataire : 6 électrons dans les liaisons, plus 1.'], [8, 'Il n’y a pas de doublet non liant dans un radical : un seul électron célibataire.']],
        expl: '3 liaisons (6 électrons) + 1 électron célibataire = 7 électrons autour du carbone.', indice: 'Ajoutez les électrons des trois liaisons et l’électron célibataire.' } },
    { id: 'classes', titre: 'Les classes d’un carbocation',
      retenirTitre: 'À retenir : trois géométries', retenir: <><SvgGeometrieCarte/><ul style={ULS}>
        <li><strong>Carbocation</strong> AX₃E₀ : <strong>plan</strong>, 120° ; une orbitale p vide.</li>
        <li><strong>Carbanion</strong> AX₃E₁ : <strong>pyramide</strong> à base triangulaire, environ 107° ; un doublet non liant (trait).</li>
        <li><strong>Radical</strong> : <strong>presque plan</strong> ; un électron célibataire (point).</li></ul></>,
      texte: <>On classe un carbocation selon le nombre de <strong>groupes alkyles</strong> (ici CH₃) liés au carbone chargé : <strong>classe I</strong> (primaire) : 1 groupe ; <strong>classe II</strong> (secondaire) : 2 ; <strong>classe III</strong> (tertiaire) : 3. Un alkyle est un groupe <strong>donneur d’électrons</strong>.</>,
      tache: { type: 'action', ok: st.classes && st.classes.type === 'cation' && M.nbAlkyl(st.classes.subs) === 3, consigne: st.classes && M.nbAlkyl(st.classes.subs) === 3 ? '✓ Voici un carbocation de classe III (tertiaire) : (CH₃)₃C⁺.' : 'Choisissez CH₃ pour les trois substituants afin de construire un carbocation tertiaire (classe III).' } },
    { id: 'cations', titre: 'Quel carbocation est le plus stable ?',
      texte: <>Un carbocation a une <strong>lacune d’électrons</strong> : les groupes <strong>donneurs</strong> qui l’entourent lui « envoient » des électrons et <strong>stabilisent</strong> la charge +. Plus il y a de groupes alkyles donneurs, plus le carbocation est stable.</>,
      tache: { type: 'qcm', q: 'Quel carbocation est le plus stable ?', options: ['Le primaire (classe I), le moins encombré', 'Le secondaire (classe II), de stabilité moyenne', 'Le tertiaire (classe III)', 'Ils ont tous la même stabilité'], bonne: 2,
        expl: 'Trois groupes alkyles donneurs stabilisent mieux la charge + : le carbocation tertiaire est le plus stable (III > II > I).',
        indice: 'Le carbocation manque d’électrons : lequel est entouré du plus grand nombre de groupes donneurs ?' } },
    { id: 'attracteur', titre: 'Donneur ou attracteur ?',
      retenirTitre: 'À retenir : les carbocations', retenir: <><SvgCationsCarte/><ul style={ULS}>
        <li>Plus un carbocation porte de <strong>groupes alkyles donneurs</strong>, plus il est <strong>stable</strong> : III &gt; II &gt; I.</li>
        <li>Le carbocation <strong>tertiaire</strong> est le plus stable.</li>
        <li>Un groupe <strong>attracteur</strong> le <strong>déstabilise</strong>.</li></ul></>,
      texte: <>Un atome de <strong>chlore</strong> est plus électronégatif que le carbone : il <strong>attire</strong> les électrons (groupe <strong>attracteur</strong>). Sur la scène, un carbocation porte un atome de chlore (vert) ; remplacez le chlore par CH₃ (gris, donneur) et comparez.</>,
      tache: { type: 'qcm', q: 'Un atome de chlore attracteur, lié au carbone d’un carbocation, a pour effet…', options: ['de stabiliser le carbocation, comme le fait un groupe alkyle donneur', 'de déstabiliser le carbocation, car il attire les électrons', 'de transformer le carbocation en carbanion en lui ajoutant un doublet', 'aucun effet sur la stabilité, quelle que soit la molécule'], bonne: 1,
        expl: 'Le carbocation a besoin d’électrons : un groupe attracteur lui en retire encore, ce qui déstabilise la charge +.',
        indice: 'Le carbone chargé + manque d’électrons : un groupe qui attire les électrons l’aide-t-il ou l’appauvrit-il encore ?' } },
    { id: 'anions', titre: 'Le cas du carbanion',
      texte: <>Un <strong>carbanion</strong> a un <strong>excès d’électrons</strong> (charge −). C’est l’inverse du carbocation : un groupe <strong>attracteur</strong> (Cl) l’aide à répartir la charge et le <strong>stabilise</strong>, tandis qu’un groupe <strong>donneur</strong> (alkyle) lui envoie encore des électrons et le <strong>déstabilise</strong>.</>,
      tache: { type: 'qcm', q: 'Quel carbanion est le plus stable ?', options: ['Le tertiaire, avec trois groupes alkyles donneurs', 'Le secondaire, avec deux groupes alkyles donneurs', 'Le primaire, avec un seul groupe alkyle donneur', 'Ils ont la même stabilité'], bonne: 2,
        expl: 'Les groupes alkyles donneurs déstabilisent un carbanion : le moins substitué (primaire) est le plus stable. L’ordre est inversé par rapport aux carbocations (I > II > III).',
        indice: 'Un carbanion a déjà trop d’électrons : un groupe donneur arrange-t-il ou aggrave-t-il les choses ?' } },
    { id: 'mecanisme', titre: 'Quel carbocation se forme ?',
      retenirTitre: 'À retenir : les carbanions', retenir: <><SvgAnionsCarte/><ul style={ULS}>
        <li>Un <strong>carbanion</strong> est stabilisé par les groupes <strong>attracteurs</strong>.</li>
        <li>Les groupes <strong>donneurs</strong> le déstabilisent : I &gt; II &gt; III, <strong>l’inverse</strong> des carbocations.</li>
        <li>Pour un <strong>carbocation</strong>, c’est l’inverse : donneurs stabilisent, attracteurs déstabilisent.</li></ul></>,
      texte: <>On applique ces idées à un <strong>mécanisme fourni</strong> : l’addition de HBr sur un alcène. La première étape forme un carbocation intermédiaire ; deux voies sont possibles. L’intermédiaire <strong>le plus stable se forme le plus vite</strong>.</>,
      tache: { type: 'qcm', q: 'Quel carbocation se forme majoritairement à l’étape 1 ?', options: ['Celui de la voie B (classe II), car il est le moins encombré', 'Les deux se forment à parts égales, sans préférence', 'Celui de la voie A (classe III)', 'Aucun : l’étape 1 ne forme pas de carbocation du tout'], bonne: 2,
        expl: 'Le carbocation de classe III (voie A) est plus stable que celui de classe II (voie B) : il se forme le plus vite et donc majoritairement.',
        indice: 'Comparez les classes des deux carbocations : lequel porte le plus de groupes alkyles donneurs ?' } },
    { id: 'produit', titre: 'Le produit majoritaire',
      texte: <>À l’étape 2, l’ion bromure Br⁻ se fixe sur le <strong>carbone chargé</strong> du carbocation formé. Le produit qui vient du carbocation le plus stable est le <strong>produit majoritaire</strong>.</>,
      tache: { type: 'qcm', q: 'Quel est le produit majoritaire de l’addition de HBr sur le 2-méthylbut-2-ène ?', options: ['Le 3-bromo-2-méthylbutane (Br sur C3, carbocation II)', 'Le 2-bromo-2-méthylbutane (Br sur C2)', 'Les deux produits, en quantités égales dans le mélange', 'Le 1-bromo-2-méthylbutane (Br sur un groupe CH₃)'], bonne: 1,
        expl: 'Le carbocation tertiaire (charge sur C2) est le plus stable : Br⁻ s’y fixe et donne le 2-bromo-2-méthylbutane, produit majoritaire.',
        indice: 'Sur quel carbone se trouve la charge + dans le carbocation le plus stable ? Br⁻ se fixe sur ce carbone.' } },
    { id: 'catalyseur', titre: 'Le rôle d’un catalyseur',
      retenirTitre: 'À retenir : le produit majoritaire', retenir: <><SvgProduitCarte/><ul style={ULS}>
        <li>Le mécanisme étant fourni, on compare les <strong>intermédiaires</strong> possibles.</li>
        <li>Le plus <strong>stable</strong> se forme le plus <strong>vite</strong> : il conduit au <strong>produit majoritaire</strong>.</li>
        <li>Le brome se fixe sur le <strong>carbone chargé</strong>.</li></ul></>,
      texte: <>Un <strong>catalyseur</strong> permet à la réaction de passer par un autre mécanisme, dont les étapes sont plus rapides. Il est consommé au début puis <strong>régénéré</strong> à la fin : il n’apparaît pas dans l’équation de la réaction.</>,
      tache: { type: 'qcm', q: 'Que fait un catalyseur ?', options: ['Il augmente la quantité maximale de produit que l’on peut former', 'Il accélère la réaction, puis il est régénéré', 'Il est entièrement consommé pendant la réaction pour former le produit', 'Il modifie la nature des réactifs de départ avant la réaction'], bonne: 1,
        expl: 'Le catalyseur accélère la réaction en offrant un mécanisme de plus basse énergie ; il est régénéré en fin de réaction et ne change pas la quantité maximale de produit.',
        indice: 'Un catalyseur change la vitesse : est-il consommé définitivement ou retrouvé à la fin ?' } },
    { id: 'bilan', titre: 'Le bilan',
      retenirTitre: 'À retenir : le bilan', retenir: <><SvgBilanStaCarte/><ul style={ULS}>
        <li><strong>Carbocation</strong> plan, <strong>carbanion</strong> pyramidal, <strong>radical</strong> presque plan.</li>
        <li><strong>Donneurs</strong> : stabilisent le carbocation ; <strong>attracteurs</strong> : stabilisent le carbanion.</li>
        <li>L’intermédiaire <strong>le plus stable</strong> conduit au <strong>produit majoritaire</strong>.</li></ul></>,
      texte: <>Vous savez prévoir la géométrie d’un carbocation et d’un carbanion, comparer la stabilité d’intermédiaires et en déduire le produit majoritaire d’un mécanisme fourni. La suite : explorez la scène en exploration libre, ou relevez les défis.</>,
      tache: null },
  ];

  // ---------- défis ----------
  const nouveauDefi = type => {
    if (type === 'classer') setDefi({ genre: 'classer', d: M.tirageClasser(), choix: null, verifie: false, corr: false });
    else setDefi({ genre: 'produit', d: M.tirageProduit(), cl: '', prod: '', verifie: false, corr: false });
  };
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const choisirDefi = t => { setTypeDefi(t); nouveauDefi(t); };
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, BLEU)}><Pic n="target"/>Défis</button>
    </span>);
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const modifie = patch => setDefi(d => ({ ...d, ...patch, verifie: false, corr: false }));
  const verifierC = () => { const r = M.diagClasser(defi.d, defi.choix); setDefi(d => ({ ...d, verifie: true, ok: r.ok, r })); noterC(r.ok); };
  const verifierP = () => { const r = M.diagProduit(defi.d, Number(defi.cl), defi.prod); setDefi(d => ({ ...d, verifie: true, ok: r.ok, r: defi.cl === '' || defi.prod === '' ? { ok: false, msg: 'Choisissez la classe du carbocation et le produit majoritaire.' } : r })); noterP(r.ok && defi.cl !== '' && defi.prod !== ''); };
  const lettres = 'ABC';
  const boutons = (verifier, genre) => (<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
    <button onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
    <button onClick={() => nouveauDefi(genre)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
    {defi.verifie && !defi.ok && <button onClick={() => setDefi(d => ({ ...d, corr: !d.corr }))} style={styleBouton(false, '#b45309')}>{defi.corr ? 'Masquer la correction' : 'Voir la correction'}</button>}
  </div>);
  const voletDefi = defi && (() => {
    if (defi.genre === 'classer') {
      const { type, cands, bonne } = defi.d, T = M.TYPES[type];
      return (<div>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : quel {T.court} est le plus stable ?</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Voici trois {T.court}s. Rappel : CH₃ est un groupe <strong>donneur</strong>, Cl et C≡N sont des groupes <strong>attracteurs</strong>. <strong>Cliquez sur le {T.court} le plus stable.</strong></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
          {cands.map((s, i) => { const c = defi.verifie ? (i === bonne ? '#15803d' : defi.choix === i ? '#dc2626' : KIT.bord) : defi.choix === i ? '#ea580c' : KIT.bord;
            return (<button key={i} type="button" aria-pressed={defi.choix === i} aria-label={`${T.court} ${lettres[i]} : ${M.sym(s)}`} onClick={() => modifie({ choix: i })}
              style={{ border: `2.5px solid ${c}`, borderRadius: 12, background: defi.choix === i && !defi.verifie ? '#fff7ed' : '#fff', padding: 4, cursor: 'pointer', minHeight: 44, font: 'inherit', display: 'block', width: '100%' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: c === KIT.bord ? KIT.txt2 : c, textAlign: 'left', padding: '0 4px' }}>{T.court[0].toUpperCase() + T.court.slice(1)} {lettres[i]}{defi.choix === i ? (defi.verifie && i !== bonne ? ' ✗' : ' ✓') : ''}</div>
              <VignetteIntermediaire type={type} subs={s}/></button>); })}
        </div>
        <IndiceDefi cache={false}>{type === 'cation' ? 'Un carbocation est stabilisé par les groupes donneurs (CH₃) et déstabilisé par les groupes attracteurs (Cl) : comptez les donneurs et les attracteurs de chacun.' : 'Un carbanion est stabilisé par les groupes attracteurs (Cl, C≡N) et déstabilisé par les groupes donneurs (CH₃) : comptez les attracteurs et les donneurs de chacun.'}</IndiceDefi>
        {boutons(verifierC, 'classer')}
        {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>{defi.ok ? `✓ Correct : le ${T.court} ${lettres[bonne]} est le plus stable.` : `✗ ${defi.r.msg.split('. ')[0]}.`}</div>}
        {defi.verifie && !defi.ok && defi.corr && <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: '#fffbeb', border: '1.5px solid #f59e0b', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
          {cands.map((s, i) => <div key={i}><strong>{T.court[0].toUpperCase() + T.court.slice(1)} {lettres[i]}</strong> ({M.sym(s)}) : {M.nbAlkyl(s)} donneur{M.nbAlkyl(s) > 1 ? 's' : ''}, {M.nbAttr(s)} attracteur{M.nbAttr(s) > 1 ? 's' : ''}{i === bonne ? ' → le plus stable.' : '.'}</div>)}
          <div style={{ marginTop: 4 }}>{defi.r.msg.split('. ').slice(1).join('. ')}</div></div>}
      </div>);
    }
    const { a, voies, maj, options } = defi.d;
    return (<div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : produit majoritaire de l’addition de HBr sur le {a.nom}</div>
      <div style={{ ...lbl, marginBottom: 8 }}>Mécanisme fourni : H⁺ se fixe sur un carbone de la double liaison de {a.semi} et forme un carbocation ; Br⁻ se fixe ensuite sur le carbone chargé. Les deux carbocations possibles ont pour classes : <strong>{voies.map(v => `${M.CLASSE_ROM[v.classe]} (${M.NOM_CLASSE[v.classe].split(' ')[0]})`).join(' et ')}</strong>.</div>
      {sel('sd-cl', 'Classe du carbocation le plus stable', defi.cl, ev => modifie({ cl: ev.target.value }), [<option key="" value="">Choisir…</option>, ...voies.map(v => <option key={v.classe} value={v.classe}>Classe {M.CLASSE_ROM[v.classe]} ({M.NOM_CLASSE[v.classe].split(' ')[0]})</option>)])}
      <div style={{ height: 8 }}/>
      {sel('sd-pr', 'Produit majoritaire', defi.prod, ev => modifie({ prod: ev.target.value }), [<option key="" value="">Choisir…</option>, ...options.map(o => <option key={o} value={o}>{o}</option>)])}
      <IndiceDefi cache={false}>Le carbocation le plus stable est celui dont le carbone chargé porte le plus de groupes alkyles donneurs. Le brome se fixe sur ce carbone chargé.</IndiceDefi>
      {boutons(verifierP, 'produit')}
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>{defi.ok ? `✓ Correct : le produit majoritaire est le ${maj.produit}.` : `✗ ${defi.r.msg}`}</div>}
      {defi.verifie && !defi.ok && defi.corr && <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: '#fffbeb', border: '1.5px solid #f59e0b', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
        {voies.map(v => <div key={v.cle}>Voie : carbone chargé de classe {M.CLASSE_ROM[v.classe]} → produit : {v.produit}{v === maj ? ' (le plus stable : produit majoritaire).' : '.'}</div>)}</div>}
    </div>);
  })();

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Géométrie (VSEPR)</strong> : carbocation AX₃E₀ trigonal plan (120°) ; carbanion AX₃E₁ pyramidal (environ 107°) ; radical presque plan. Les angles du dessin sont des valeurs de référence.</li>
      <li><strong>Stabilité</strong> : indice <strong>qualitatif</strong> (pas une énergie) : chaque groupe alkyle donneur stabilise un carbocation et déstabilise un carbanion ; chaque atome attracteur (Cl, C≡N) fait l’inverse. Pour un radical, seuls les alkyles comptent (effet plus faible).</li>
      <li><strong>Mécanisme</strong> : il est toujours fourni ; l’intermédiaire le plus stable se forme le plus vite (contrôle cinétique), sans calcul de vitesse ni d’énergie d’activation.</li>
      <li><strong>Substituants étudiés</strong> : H, CH₃, Cl et C≡N sur le carbone central. L’hyperconjugaison, les effets mésomères et les réarrangements ne sont pas traités.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Passez du carbanion au carbocation : que devient la géométrie ? et le doublet non liant ?</li>
        <li>Pour un carbocation, ajoutez des groupes CH₃ un par un : comment évolue la stabilité ?</li>
        <li>Remplacez un CH₃ par un chlore sur un carbocation, puis sur un carbanion : l’effet est-il le même ?</li>
        <li>Quel carbanion est le plus stable : (CH₃)₃C⁻ ou CH₃⁻ ? Comparez avec les carbocations.</li>
        <li>Pour un radical, les atomes attracteurs ont-ils un effet dans cette simulation ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.7 }}>
        <li>Carbocation : AX₃E₀, plan, 120°. Carbanion : AX₃E₁, pyramide, environ 107°. Radical : presque plan.</li>
        <li>Carbocation : stable si beaucoup de groupes alkyles donneurs (III &gt; II &gt; I) ; les attracteurs le déstabilisent.</li>
        <li>Carbanion : stabilisé par les attracteurs, déstabilisé par les alkyles : l’ordre est inversé (I &gt; II &gt; III).</li>
        <li>Le mécanisme étant fourni, l’intermédiaire le plus stable conduit au produit majoritaire.</li>
      </ul>)}
    </Section>);

  // ---------- scène ----------
  const cfg = enGuide ? DEF[idE] : null, panneau = enGuide && (idE === 'mecanisme' || idE === 'produit');
  const scEtat = cfg ? <BlocScene key={`s${idE}`} cfg={cfg} st={cur(idE)} onChange={p => change(idE, p)}/> : null;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .sx-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .sx-l1.cote { grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); }
        @media (max-width: 900px) { .sx-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .sx-in { animation: sx-fondu 0.35s ease-out; } @keyframes sx-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Stabilité des intermédiaires et produit majoritaire</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Au cours d’une réaction apparaissent des <strong>intermédiaires</strong> instables : carbocation, carbanion, radical. Quelle est leur <strong>géométrie</strong> ? Lequel est le plus <strong>stable</strong> ? Et comment cela décide-t-il du <strong>produit majoritaire</strong> ?</div>
      {!enExplore && <div className={`sx-l1${(enGuide && (cfg || panneau)) || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div>{panneauHypo}</div> : null}
        <div>
          {enDefi && defi && <div style={styleBoite}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.genre}`} etat={defi.genre === 'classer' ? suiviC : suiviP}/></div>}
          {enDefi && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {[['classer', 'Intermédiaire le plus stable'], ['produit', 'Produit majoritaire']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={typeDefi === t} style={stylePetitBouton(typeDefi === t, BLEU)}>{l}</button>)}</div>}
          {enGuide && cfg && <div className="sx-in" key={`s${idE}`}>{scEtat}</div>}
          {panneau && <div className="sx-in" key={`p${idE}`}><PanneauMeca etape2={idE === 'produit'}/></div>}
        </div>
      </div>}
      {enExplore && <div>
        <StaExplore ex={ex} setEx={setEx} ouv={ouv} setOuv={setOuv}/>
        <div style={{ maxWidth: 920, margin: '10px auto 0' }}>{aEssayer}{retenirExplore}{panneauHypo}</div>
      </div>}
      {enGuide && idx >= IDS.length - 1 && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
