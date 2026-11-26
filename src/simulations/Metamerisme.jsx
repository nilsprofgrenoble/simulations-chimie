import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi, FormuleEnLigne } from "../commun";
import { Pic } from "../Pictos";
import * as C from "./couleurModele";
import * as M from "./mtmModele";
import { QCM } from "./mtmQcm";
import { SvgSpectre, SvgCarteChaine, SvgCarteMeta, SvgCabine } from "./MtmSchemas";


const SIM_ID = 249, CLE_GUIDE = 'mtm-guide-v1';
declarerDefis(SIM_ID, [['couleur', 'Lire une courbe de réflectance : quelle couleur ?'], ['metamere', 'Métamères ou non ?']]);

// ====================================================
//  SIM 249 — ÉCLAIRAGE, RÉFLECTANCE ET MÉTAMÉRISME (BTS MDC, Formulation, « Comment produire des couleurs ? »)
//  Capacités visées (jamais affichées à l'élève) : distinguer des sources de lumière à partir de leurs spectres d'émission ; établir un lien entre la couleur
//  d'un objet et sa courbe de réflectance ; expliquer le métamérisme (causes, conséquences).
//  Modèle : couleurModele.js et mtmModele.js (CIE 1931, illuminants D65, A, F2). Courbes de réflectance illustratives. Schémas : MtmSchemas.jsx.
// ====================================================

const COL = { vert: '#15803d', violet: '#7c3aed', orange: '#b45309', rouge: '#b91c1c', bleu: '#1d4ed8' };
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const fr = (v, d = 1) => v.toFixed(d).replace('.', ',').replace('-', '−');
const n0 = v => String(Math.round(v)).replace('-', '−');
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const ORDRE = ['sources', 'reflectance', 'produit', 'eclairage', 'metamerie', 'courbes', 'ecart', 'controle', 'bilan'];
const BASE = { src: 'D65', obj: 'bleu' };
const DEPART = { reflectance: { obj: 'bleu' }, eclairage: { obj: 'blanc' }, sources: { src: 'D65' }, metamerie: { src: 'D65' } };
const COURT = { D65: 'Lumière du jour', A: 'Lampe A', F2: 'Tube F2' };
const SOUS = { D65: 'la lumière du jour', A: 'la lampe A', F2: 'le tube F2' };
const OPT_SRC = M.SOURCES.map(id => ({ id, nom: M.NOMS_SOURCES[id] }));
const OPT_OBJ = Object.keys(M.OBJETS).map(id => ({ id, nom: M.NOMS_OBJETS[id] }));
const { r1: E1, r2: E2 } = M.PAIRE;
const dec = v => Math.round(v * 10) / 10;
const labA1 = M.labSous(E1, 'A'), labA2 = M.labSous(E2, 'A');
const arr = l => ({ L: dec(l.L), a: dec(l.a), b: dec(l.b) });
const A1 = arr(labA1), A2 = arr(labA2);
const dEA = Math.hypot(A1.L - A2.L, A1.a - A2.a, A1.b - A2.b);
const I620 = 24, S620 = Math.round(M.spd('D65')[I620]), R620 = Math.round(M.OBJETS.rouge[I620] * 100) / 100;
// Notation mathématique classique
const Pa = ({ children }) => <msup><mrow><mo stretchy="false">(</mo>{children}<mo stretchy="false">)</mo></mrow><mn>2</mn></msup>;
const Sx = ({ l }) => <msup><mi>{l}</mi><mo>*</mo></msup>;
const DE = () => <msubsup><mi>ΔE</mi><mi>ab</mi><mo>*</mo></msubsup>;
const FormProd = () => <><mi>I</mi><mo>=</mo><mi>S</mi><mo>×</mo><mi>R</mi></>;
const FormDE = () => <><DE/><mo>=</mo><msqrt><Pa><mi>Δ</mi><Sx l="L"/></Pa><mo>+</mo><Pa><mi>Δ</mi><Sx l="a"/></Pa><mo>+</mo><Pa><mi>Δ</mi><Sx l="b"/></Pa></msqrt></>;
const Pastille = ({ css, nom, hauteur = 44 }) => (<div style={{ flex: 1, minWidth: 0 }}><div aria-hidden="true" style={{ height: hauteur, borderRadius: 8, background: css, border: '1.5px solid #334155' }}/>{nom && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 3, textAlign: 'center' }}>{nom}</div>}</div>);
/** Deux échantillons accolés en une seule plaque coupée en deux : une petite différence de couleur se voit bien mieux qu'entre deux pastilles séparées. */
const Plaque = ({ c1, c2, n1 = 'E1', n2 = 'E2', hauteur = 44 }) => (<div style={{ width: '100%' }}><div aria-hidden="true" style={{ display: 'flex', height: hauteur, borderRadius: 8, overflow: 'hidden', border: '1.5px solid #334155' }}><div style={{ flex: 1, background: c1 }}/><div style={{ flex: 1, background: c2 }}/></div><div style={{ display: 'flex', fontSize: 13, color: KIT.txt2, marginTop: 3 }}><span style={{ flex: 1, textAlign: 'center' }}>{n1}</span><span style={{ flex: 1, textAlign: 'center' }}>{n2}</span></div></div>);
const rangee = ch => <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>{ch}</div>;
const specR = (courbes, label) => <SvgSpectre courbes={courbes} ymax={1} yTicks={[0, 0.5, 1]} fmtY={v => fr(v, 1)} label={label} yTitre="R"/>;
const verdictPaire = (e65, eA, eF) => (e65 < 1 && Math.max(eA, eF) > 2 ? 'métamères' : Math.max(e65, eA, eF) < 1 ? 'identiques sous toutes les lampes' : 'déjà différents sous la lumière du jour');

export function SimulationMetamerisme() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const idDe = g => ORDRE[Math.min(g.etape ?? 0, ORDRE.length - 1)];
  const [vie, setVie] = useState(() => ({ ...BASE, ...(DEPART[idDe(guide)] ?? {}) }));
  const [ex, setEx] = useState({ base: 'beige', s: 2, lampe: 'D65' });
  const [ouv, setOuv] = useState({});
  const [suiviC, noterC] = useCompteurDefi(), [suiviM, noterM] = useCompteurDefi();
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('couleur');
  const enGuide = mode === 'guide', enExplore = mode === 'explore', enDefi = mode === 'defi';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  // ---------- parcours ----------
  const ETAPES = [
    { id: 'sources', titre: 'Les sources de lumière : leur spectre', focus: ['scene', 'curseur'],
      texte: <>Une couleur vient d’une <strong>source de lumière</strong> qui éclaire un <strong>objet</strong>. Chaque source a un <strong>spectre d’émission</strong> : la puissance qu’elle émet à chaque longueur d’onde (unité relative, 100 à 560 nm). La CIE a normalisé trois sources de référence, appelées <strong>illuminants</strong> : <strong>D65</strong> (lumière du jour), <strong>A</strong> (lampe à incandescence) et <strong>F2</strong> (tube fluorescent blanc). Affichez chacune dans la liste et comparez leurs spectres.</>,
      tache: { type: 'qcm', q: 'Quelle source a un spectre fait de pics étroits ?', ...QCM.sources,
        expl: 'Le tube fluorescent émet de la lumière surtout dans quelques pics étroits, sur un fond faible. La lumière du jour (D65) a un spectre large et assez régulier ; la lampe à incandescence (A) un spectre continu qui augmente vers le rouge.', indice: 'Affichez les trois spectres l’un après l’autre : lequel n’est pas une courbe lisse, mais présente des pointes ?' } },
    { id: 'reflectance', titre: 'La réflectance d’un objet', focus: ['scene', 'curseur'],
      texte: <>Un objet n’émet pas de lumière : il <strong>renvoie</strong> une partie de celle qu’il reçoit. Sa <strong>courbe de réflectance R(λ)</strong> donne, pour chaque longueur d’onde, la fraction de lumière renvoyée : de 0 (tout est absorbé) à 1 (tout est renvoyé). La pastille montre la couleur de l’objet en lumière du jour. Choisissez plusieurs objets, en regardant leur courbe.</>,
      tache: { type: 'qcm', q: 'La réflectance d’un objet rouge, en lumière du jour, est…', ...QCM.reflectance,
        expl: 'Un objet rouge renvoie surtout les grandes longueurs d’onde (rouge, orangé) et absorbe le violet, le bleu et le vert : sa réflectance est faible en dessous de 580 nm environ et élevée au-delà.', indice: 'Choisissez « Rouge » dans la liste et comparez la courbe à gauche (violet, bleu) et à droite (rouge) du graphique.' } },
    { id: 'produit', titre: 'La lumière renvoyée : source × réflectance', focus: ['scene', 'mesures'],
      texte: <>La lumière renvoyée par l’objet, longueur d’onde par longueur d’onde, est le <strong>produit</strong> de la puissance de la source S(λ) par la réflectance de l’objet R(λ). Voici la lumière du jour éclairant un objet rouge. À <strong>620 nm</strong> (trait pointillé), la source vaut <strong>{S620}</strong> (unité relative) et l’objet a une réflectance de <strong>{fr(R620, 2)}</strong>.</>,
      tache: { type: 'num', q: 'Puissance renvoyée à 620 nm (même unité que la source)', unite: '', vrai: S620 * R620, tol: 0.03, affiche: v => n0(v), cs: 2,
        calcul: () => ['À chaque longueur d’onde, la puissance renvoyée est la puissance reçue multipliée par la fraction renvoyée.', <><FormuleEnLigne><FormProd/></FormuleEnLigne> soit <FormuleEnLigne><mi>I</mi><mo>=</mo><mn>{S620}</mn><mo>×</mo><mn>{fr(R620, 2)}</mn><mo>≈</mo><mn>{n0(S620 * R620)}</mn></FormuleEnLigne>.</>],
        pieges: [[S620 + R620, 'Vous avez additionné. La réflectance est une fraction de la lumière reçue : on multiplie.'], [S620 / R620, 'Vous avez divisé la source par la réflectance : la lumière renvoyée est plus petite que la lumière reçue, on multiplie par R.']],
        expl: `La puissance renvoyée à 620 nm est environ ${S620} × ${fr(R620, 2)} ≈ ${n0(S620 * R620)}.`, indice: <>Multipliez la puissance de la source par la réflectance : <FormuleEnLigne><FormProd/></FormuleEnLigne>.</> } },
    { id: 'eclairage', titre: 'Le même objet sous trois lampes', focus: ['scene', 'curseur'],
      texte: <>La lumière renvoyée dépend de la source : changer de lampe change la couleur de l’objet. Les trois pastilles montrent l’objet choisi éclairé par D65, A et F2. Ici, les couleurs sont affichées <strong>telles que la lumière renvoyée les produit</strong>, sans que l’œil ne s’y adapte (voir les hypothèses). Choisissez un objet, puis regardez l’objet blanc.</>,
      tache: { type: 'qcm', q: 'Sous la lampe à incandescence A, un objet blanc paraît…', ...QCM.eclairage,
        expl: 'La lampe A émet peu de bleu et beaucoup de rouge : un objet blanc, qui renvoie toute la lumière reçue, paraît orangé. C’est la source qui colore la lumière renvoyée.', indice: 'Choisissez « Blanc » : il renvoie tout ce qu’il reçoit. Quelle est la couleur de la lumière reçue sous la lampe A, d’après son spectre ?' } },
    { id: 'metamerie', titre: 'Deux échantillons identiques… sous une lampe', focus: ['scene', 'curseur'],
      retenirTitre: 'À retenir : de la source à la couleur', retenir: <>
        <SvgCarteChaine/>
        <ul style={puces}>
          <li>La lumière renvoyée est le produit source × réflectance.</li>
          <li>L’œil la résume en trois grandeurs X, Y, Z : c’est ce qui fixe la couleur perçue.</li>
        </ul></>,
      texte: <>Deux échantillons, <strong>E1</strong> et <strong>E2</strong>, sont fabriqués avec des pigments différents. Sous la lumière du jour D65, ils paraissent de la même couleur. Changez de source et comparez-les.</>,
      tache: { type: 'qcm', q: 'Sous la lampe A, les deux échantillons…', ...QCM.metamerie,
        expl: 'Deux échantillons de même couleur sous D65 peuvent avoir des couleurs différentes sous une autre lampe : c’est le métamérisme. On dit que E1 et E2 sont des métamères.', indice: 'Choisissez la source A dans la liste et regardez si les deux moitiés de la plaque sont encore de la même couleur (la ligne « Colorimètre » vous le dit aussi).' } },
    { id: 'courbes', titre: 'Pourquoi la même couleur avec deux courbes ?', focus: ['scene'],
      texte: <>Voici les courbes de réflectance des deux échantillons : <strong>E1</strong> en trait plein, <strong>E2</strong> en pointillés. Elles sont <strong>différentes</strong>. Pourtant, sous la lumière du jour, l’œil leur associe les mêmes valeurs X, Y, Z : il ne « voit » pas la courbe entière, seulement trois nombres.</>,
      tache: { type: 'qcm', q: 'Pourquoi deux courbes différentes peuvent-elles donner la même couleur sous D65 ?', ...QCM.courbes,
        expl: 'Les courbes se croisent trois fois : là où E2 renvoie plus, ailleurs elle renvoie moins, et sous D65 ces écarts se compensent dans chacune des trois grandeurs X, Y, Z (c’est pourquoi deux courbes métamères se croisent au moins trois fois). Sous une autre lampe, le poids de chaque longueur d’onde change, et la compensation disparaît.', indice: 'Observez les points où les deux courbes se coupent : E2 est tantôt au-dessus de E1, tantôt au-dessous.' } },
    { id: 'ecart', titre: 'Mesurer le métamérisme : ΔE*ab sous la lampe A', focus: ['scene', 'mesures'],
      texte: <>Sous D65, l’écart de couleur entre E1 et E2 est <strong>nul</strong> (ΔE*ab = 0,0). On les mesure maintenant sous la lampe A, avec le spectrocolorimètre (coordonnées L*, a*, b* repérées par rapport au blanc de la lampe) : <strong>E1 : L* = {fr(A1.L)} ; a* = {fr(A1.a)} ; b* = {fr(A1.b)}</strong> et <strong>E2 : L* = {fr(A2.L)} ; a* = {fr(A2.a)} ; b* = {fr(A2.b)}</strong>. Calculez l’écart de couleur.</>,
      tache: { type: 'num', q: 'Écart de couleur ΔE*ab entre E1 et E2 sous la lampe A', unite: '', vrai: dEA, tol: 0.06, affiche: v => fr(v, 1), cs: 2,
        calcul: () => [`Les écarts sont ΔL* = ${fr(A2.L - A1.L)}, Δa* = ${fr(A2.a - A1.a)} et Δb* = ${fr(A2.b - A1.b)}.`, <><FormuleEnLigne><FormDE/></FormuleEnLigne> soit <FormuleEnLigne><DE/><mo>=</mo><msqrt><Pa><mn>{fr(A2.L - A1.L)}</mn></Pa><mo>+</mo><Pa><mn>{fr(A2.a - A1.a)}</mn></Pa><mo>+</mo><Pa><mn>{fr(A2.b - A1.b)}</mn></Pa></msqrt><mo>≈</mo><mn>{fr(dEA, 1)}</mn></FormuleEnLigne>.</>, 'Cet écart est nettement visible, alors qu’il est nul sous D65.'],
        pieges: [[dEA ** 2, 'Vous n’avez pas pris la racine carrée : c’est ΔE*ab² que vous avez calculé.'], [Math.abs(A2.L - A1.L) + Math.abs(A2.a - A1.a) + Math.abs(A2.b - A1.b), 'Vous avez additionné les écarts. Il faut élever chacun au carré, additionner, puis prendre la racine.']],
        expl: `ΔE*ab ≈ ${fr(dEA, 1)} sous la lampe A, alors qu’il est nul sous D65 : E1 et E2 sont métamères.`, indice: <>Élevez chaque écart au carré, additionnez, puis prenez la racine : <FormuleEnLigne><FormDE/></FormuleEnLigne>.</> } },
    { id: 'controle', titre: 'Conséquence : contrôler sous plusieurs lampes', focus: ['scene', 'mesures'],
      texte: <>Un formulateur règle la teinte d’une peinture sous une lampe, mais le client la verra sous d’autres. Les pastilles montrent E1 et E2 sous les trois lampes, avec leur écart ΔE*ab.</>,
      tache: { type: 'qcm', q: 'Pourquoi contrôle-t-on une teinte sous plusieurs illuminants ?', ...QCM.controle,
        expl: 'Un accord de teinte réussi sous une seule lampe peut être un métamérisme : la teinte se révèle fausse sous une autre lampe. On contrôle donc au moins sous D65 et sous A (ou F2), et on limite le nombre de pigments, car un mélange compliqué favorise le métamérisme.', indice: 'Regardez l’écart sous D65, puis sous A et F2 : qu’arriverait-il si on ne contrôlait que sous D65 ?' } },
    { id: 'bilan', titre: 'Le bilan : source, objet, œil', focus: [],
      retenirTitre: 'À retenir : le métamérisme', retenir: <>
        <SvgCarteMeta/>
        <ul style={puces}>
          <li>La couleur dépend de la source, de l’objet et de l’observateur.</li>
          <li>Deux courbes de réflectance différentes peuvent donner les mêmes X, Y, Z sous une lampe.</li>
          <li>Sous une autre lampe, leurs couleurs diffèrent : c’est le métamérisme, qu’on détecte en contrôlant sous plusieurs illuminants.</li>
        </ul></>,
      texte: <>Vous savez distinguer des sources de lumière par leur spectre, relier la couleur d’un objet à sa courbe de réflectance, et expliquer pourquoi deux échantillons identiques sous une lampe peuvent différer sous une autre. En exploration, vous pouvez faire varier l’écart entre les deux courbes ; les défis testent la lecture des courbes.</> },
  ];
  const IDS = ORDRE, etape = Math.min(guide.etape, ETAPES.length - 1), idE = enGuide ? IDS[etape] : null;
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const setEtatGuide = v => {
    const nv = typeof v === 'function' ? v(guide) : v;
    const ni = Math.min(nv.etape, IDS.length - 1);
    if (ni !== Math.min(guide.etape, IDS.length - 1)) setVie(() => ({ ...BASE, ...(DEPART[IDS[ni]] ?? {}) }));
    setGuide(nv);
  };

  // ---------- scènes ----------
  const sc = idE, refObj = M.OBJETS[vie.obj] ?? M.OBJETS.blanc;
  const eP = id => M.ecartSous(E1, E2, id);
  const grillePaire = () => <div style={{ display: 'grid', gap: 8 }}>{M.SOURCES.map(id => <div key={id}>
    <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 3 }}>{M.NOMS_SOURCES[id]} : ΔE*ab = {fr(eP(id), 1)}</div>
    <Plaque c1={M.couleurSous(E1, id)} c2={M.couleurSous(E2, id)} hauteur={30}/></div>)}</div>;
  const sceneGuide = !enGuide ? null
    : sc === 'sources' ? <SvgSpectre courbes={[{ v: M.spd(vie.src), col: COL.bleu, nom: M.NOMS_SOURCES[vie.src] }]} ymax={250} yTicks={[0, 100, 200]} remplir label={`Spectre de la source ${vie.src}`} yTitre="S"/>
    : sc === 'reflectance' ? <>{rangee([<Pastille key="p" css={M.couleurSous(refObj, 'D65')} nom="couleur en lumière du jour" hauteur={30}/>])}{specR([{ v: refObj, col: COL.rouge }], 'Courbe de réflectance de l’objet')}</>
    : sc === 'produit' ? <SvgSpectre courbes={[{ v: M.spd('D65').map(v => v / 150), col: COL.bleu, nom: 'Source S' }, { v: M.OBJETS.rouge, col: COL.rouge, nom: 'Réflectance R' }, { v: M.renvoyee(M.OBJETS.rouge, 'D65').map(v => v / 150), col: COL.orange, nom: 'Renvoyée S × R' }]} ymax={1.5} yTicks={[0, 0.5, 1]} fmtY={v => fr(v, 1)} marque={620} label="Source, réflectance et lumière renvoyée"/>
    : sc === 'eclairage' ? <>{rangee(M.SOURCES.map(id => <Pastille key={id} css={M.couleurSous(refObj, id)} nom={COURT[id]} hauteur={64}/>))}</>
    : sc === 'metamerie' ? <><Plaque c1={M.couleurSous(E1, vie.src)} c2={M.couleurSous(E2, vie.src)} hauteur={80}/><div style={{ marginTop: 6, fontSize: 13.5, color: KIT.txt }}>Colorimètre : {eP(vie.src) <= 1 ? 'E1 et E2 sont indiscernables' : 'E1 et E2 sont différents'} sous cette lampe. <span style={{ color: KIT.txt2 }}>(Il donne la réponse même si l’on distingue mal les couleurs.)</span></div></>
    : sc === 'courbes' ? specR([{ v: E1, col: COL.bleu, nom: 'E1' }, { v: E2, col: COL.orange, nom: 'E2', trait: '6 3' }], 'Courbes de réflectance de E1 et E2')
    : sc === 'ecart' ? <Plaque c1={M.couleurSous(E1, 'A')} c2={M.couleurSous(E2, 'A')} n1="E1 sous la lampe A" n2="E2 sous la lampe A" hauteur={60}/>
    : sc === 'controle' ? grillePaire()
    : null;
  const MES_GUIDE = {
    produit: [['Source à 620 nm', String(S620)], ['Réflectance à 620 nm', fr(R620, 2)]],
    ecart: [['ΔE*ab sous D65', '0,0'], ['E1 sous A (L* ; a* ; b*)', `${fr(A1.L)} ; ${fr(A1.a)} ; ${fr(A1.b)}`], ['E2 sous A (L* ; a* ; b*)', `${fr(A2.L)} ; ${fr(A2.a)} ; ${fr(A2.b)}`]],
    controle: M.SOURCES.map(id => [`ΔE*ab sous ${SOUS[id]}`, fr(eP(id), 1)]),
  };
  const lignesGuide = enGuide ? (MES_GUIDE[sc] ?? []) : [];
  const curs = (id, lab, val, min, max, step, onCh, aide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab}</label>
    <input id={id} type="range" min={min} max={max} step={step} value={val} onChange={onCh} aria-label={lab} style={{ width: '100%', accentColor: '#7c3aed' }}/>
    {aide && <div style={{ fontSize: 13, color: KIT.txt2 }}>{aide}</div>}</div>);
  const selecteur = (id, lab, val, onCh, options, vide) => (<div style={{ marginTop: 8 }}>
    <label htmlFor={id} style={libelle}>{lab}</label>
    <select id={id} value={val} onChange={onCh} style={selectStyle}>{vide && <option value="">{vide}</option>}{options.map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}</select></div>);
  const curseurGuide = enGuide && ['sources', 'reflectance', 'eclairage', 'metamerie'].includes(sc) ? (
    <div style={{ ...styleBoite, ...cadre('curseur') }}>
      {(sc === 'sources' || sc === 'metamerie') && selecteur('mt-gs', 'Source de lumière', vie.src, ev => setVie(s => ({ ...s, src: ev.target.value })), OPT_SRC)}
      {(sc === 'reflectance' || sc === 'eclairage') && selecteur('mt-go', 'Objet', vie.obj, ev => setVie(s => ({ ...s, obj: ev.target.value })), OPT_OBJ)}
    </div>) : null;

  // ---------- défis ----------
  const nouveauDefi = kind => setDefi(kind === 'couleur' ? { kind, ...M.tirageCouleur(Math.random), rep: '', verifie: false } : { kind, ...M.tirageMetamere(Math.random), rep: '', verifie: false });
  const changerMode = md => { if (md === 'defi' && !defi) nouveauDefi(typeDefi); setMode(md); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const verifier = () => {
    const ok = defi.kind === 'couleur' ? defi.rep === defi.famille : defi.rep === defi.cas;
    (defi.kind === 'couleur' ? noterC : noterM)(ok);
    setDefi(d => ({ ...d, verifie: true, ok }));
  };
  const maj = f => setDefi(d => ({ ...d, ...f, verifie: false }));
  const OPT_COUL = M.FAMILLES.map(id => ({ id, nom: M.NOMS_OBJETS[id] }));
  const OPT_META = [{ id: 'meta', nom: 'Métamères : identiques sous D65, différents sous A' }, { id: 'identiques', nom: 'Même couleur sous toutes les lampes (courbes identiques)' }, { id: 'differentes', nom: 'Déjà différents sous la lumière du jour : pas de métamérisme' }];
  const nomCas = { meta: 'métamères', identiques: 'de même couleur sous toutes les lampes', differentes: 'différents dès la lumière du jour' };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['couleur', 'Quelle couleur ?'], ['metamere', 'Métamères ou non ?']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.kind === tp} style={stylePetitBouton(defi.kind === tp, '#7c3aed')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.kind === 'couleur' ? 'Défi : de quelle couleur est cet objet ?' : 'Défi : ces deux échantillons sont-ils métamères ?'}</div>
      <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6, marginBottom: 6 }}>
        {defi.kind === 'couleur'
          ? <>Voici la courbe de réflectance d’un objet. Quelle est sa couleur en lumière du jour (D65) ?</>
          : <>Voici les courbes de réflectance de deux échantillons E1 (trait plein) et E2 (pointillés). Leur écart de couleur est ΔE*ab = <strong>{fr(defi.eD65, 1)}</strong> sous la lumière du jour D65 et <strong>{fr(defi.eA, 1)}</strong> sous la lampe A. Que peut-on dire ?</>}
      </div>
      {defi.kind === 'couleur'
        ? specR([{ v: defi.refl, col: COL.rouge }], 'Courbe de réflectance de l’objet')
        : specR([{ v: defi.r1, col: COL.bleu, nom: 'E1' }, { v: defi.r2, col: COL.orange, nom: 'E2', trait: '6 3' }], 'Courbes de réflectance de E1 et E2')}
      {selecteur('mt-dr', defi.kind === 'couleur' ? 'Couleur de l’objet' : 'Les deux échantillons sont…', defi.rep, ev => maj({ rep: ev.target.value }), defi.kind === 'couleur' ? OPT_COUL : OPT_META, 'Choisir…')}
      <div style={{ marginTop: 8 }}><IndiceDefi cache={false}>{defi.kind === 'couleur'
        ? <>Un objet a la couleur des longueurs d’onde qu’il renvoie : repérez où la courbe est haute, et si elle l’est partout (blanc) ou nulle part (noir).</>
        : <>Métamères : écart nul sous une lampe (ici D65) et net sous une autre. Un écart déjà grand sous D65 n’est pas du métamérisme ; deux courbes identiques ne le sont jamais.</>}</IndiceDefi></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button onClick={verifier} disabled={!defi.rep} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.kind)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}
        {defi.kind === 'couleur' ? <>L’objet est {M.NOMS_OBJETS[defi.famille].toLowerCase()}.</> : <>Les deux échantillons sont {nomCas[defi.cas]}.</>}
      </div>}
    </div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#7c3aed')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- exploration ----------
  const pX = M.paire(ex.base, ex.s), eX = Object.fromEntries(M.SOURCES.map(id => [id, M.ecartSous(pX.r1, pX.r2, id)]));
  const OPT_BASE = Object.keys(M.BASES).map(id => ({ id, nom: M.NOMS_BASES[id] }));
  const reglagesExplore = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <div style={{ fontSize: 13, color: KIT.txt2 }}>Ici, E2 est un échantillon construit pour avoir la même couleur que E1 sous la lumière du jour. Faites varier l’écart entre leurs courbes, puis changez de lampe dans la cabine : à partir de quel écart voit-on la différence sous la lampe A ?</div>
      {selecteur('mt-xb', 'Couleur de E1', ex.base, ev => setEx(x => ({ ...x, base: ev.target.value })), OPT_BASE)}
      {curs('mt-xs', `Écart entre les deux courbes : ${n0(ex.s * 100)} %`, ex.s, 0, 2.5, 0.01, ev => setEx(x => ({ ...x, s: parseFloat(ev.target.value) })), '0 % : courbes identiques. Plus l’écart est grand, plus la différence sous la lampe A ou F2 est visible (100 % : écart de référence du parcours ; au-delà, la bosse de E2 est exagérée).')}
    </div>);
  const verdictLampe = eX[ex.lampe] <= 1 ? 'E1 et E2 sont indiscernables' : eX[ex.lampe] <= 3 ? 'E1 et E2 sont à peine différents' : eX[ex.lampe] <= 7 ? 'E1 et E2 sont différents (visible côte à côte)' : 'E1 et E2 sont nettement différents';
  const planEx = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Cabine à lumière : E1 et E2 sous la lampe de votre choix</div>
      <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Comme dans l’industrie, on contrôle une couleur dans une cabine, sous plusieurs lampes. Choisissez la lampe.</div>
      <div role="group" aria-label="Lampe de la cabine" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {M.SOURCES.map(id => <button key={id} onClick={() => setEx(x => ({ ...x, lampe: id }))} aria-pressed={ex.lampe === id} style={{ ...stylePetitBouton(ex.lampe === id, '#d97706'), minHeight: 42, flex: '1 1 90px' }}>{id === 'D65' ? '☀️ Jour (D65)' : id === 'A' ? '💡 Incandescence (A)' : '🔦 Tube (F2)'}</button>)}
      </div>
      <SvgCabine lampe={ex.lampe} css1={M.couleurSous(pX.r1, ex.lampe)} css2={M.couleurSous(pX.r2, ex.lampe)} cssBlanc={M.couleurSous(new Array(pX.r1.length).fill(1), ex.lampe)}/>
      <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: KIT.txt }}><strong>{verdictLampe}</strong> sous cette lampe (ΔE*ab = {fr(eX[ex.lampe], 2)}). Si vous distinguez mal les couleurs, fiez-vous à ce nombre : c’est la mesure, pas l’impression.</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, margin: '12px 0 2px' }}>Pourquoi ? Les courbes de réflectance</div>
      <div style={{ fontSize: 13, color: KIT.txt2 }}>E1 et E2 renvoient la lumière différemment (courbes différentes), mais de façon équivalente pour l’œil sous la lumière du jour. Sous une autre lampe, ce n’est plus le cas.</div>
      {specR([{ v: pX.r1, col: COL.bleu, nom: 'E1' }, { v: pX.r2, col: COL.orange, nom: 'E2', trait: '6 3' }], 'Courbes de réflectance de E1 et E2')}
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Écart de couleur entre E1 et E2</div>
      {M.SOURCES.map(id => <LigneMesure key={id} nom={`ΔE*ab sous ${SOUS[id]}`} valeur={fr(eX[id], 2)} couleur={eX[id] <= 1 ? COL.vert : COL.rouge}/>)}
      <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5, color: KIT.txt }}>Verdict : <strong>{verdictPaire(eX.D65, eX.A, eX.F2)}</strong></div>
      <div style={{ marginTop: 4, fontSize: 13, color: KIT.txt2 }}>Un écart ΔE*ab inférieur à 1 est à peine visible.</div>
    </div>);
  const aEssayer = (
    <ul style={liste}>
      <li>Augmentez peu à peu l’écart entre les courbes : l’écart sous D65 change-t-il ? Et sous A ?</li>
      <li>Quelle lampe, de A ou de F2, révèle le plus le métamérisme ici ?</li>
      <li>Changez la couleur de E1 : le métamérisme dépend-il de la teinte choisie ?</li>
      <li>Combien de fois les deux courbes se croisent-elles ? Est-ce possible avec deux courbes qui ne se croisent jamais ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Lumière renvoyée = source × réflectance, à chaque longueur d’onde</li>
        <li>L’œil la résume en trois grandeurs : X, Y, Z</li>
        <li>Métamères : même couleur sous un illuminant, couleurs différentes sous un autre</li>
        <li>Deux courbes identiques ne sont jamais métamères ; des courbes différentes qui se croisent peuvent l’être</li>
        <li>On contrôle une teinte sous plusieurs illuminants (D65, A, F2)</li>
      </ul>
    </ARetenir>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Illuminants</strong> : CIE D65, A et F2 (distributions relatives de la CIE, pas de 10 nm : les pics fins du tube fluorescent y sont donc un peu élargis), observateur standard 2°. X, Y, Z sont des sommes sur les longueurs d’onde de S × R × (fonction colorimétrique), avec Y = 100 pour le blanc parfait.</li>
      <li><strong>Courbes de réflectance illustratives</strong> : les pigments sont imaginaires et les courbes sont modélisées (paliers, marches et bosses lisses), pas mesurées. E1 est une courbe simple. E2 est un second pigment à courbe lisse (un fond, une marche vers 600 nm et deux bosses entre 430 et 510 nm) dont les trois coefficients sont <em>calculés</em> pour que E2 ait exactement les mêmes X, Y, Z que E1 sous D65. Mathématiquement, deux courbes métamères se croisent au moins trois fois (les trois grandeurs X, Y, Z imposent trois conditions) : c’est le cas ici, exactement trois fois. Des pigments réels donnent des écarts de l’ordre de quelques unités de ΔE*ab, comme ici ; le curseur de l’exploration agrandit l’écart pour le rendre visible (au-delà de 100 %, la bosse de E2 est exagérée).</li>
      <li><strong>Objets</strong> : surfaces mates, sans brillance, fluorescence ni transparence ; la géométrie de mesure n’est pas modélisée.</li>
      <li><strong>Écart de couleur sous une lampe</strong> : L*, a*, b* sont calculés avec le blanc de cette lampe (le blanc parfait vaut L* = 100, a* = b* = 0 sous chaque lampe). Un écart sous A ou F2 est donc un vrai métamérisme, et non l’effet d’ensemble du changement de lampe.</li>
      <li><strong>Couleurs à l’écran</strong> : la lumière renvoyée est affichée telle quelle, en sRGB, <em>sans adaptation chromatique</em>. L’œil réel s’adapte en partie à la lampe : un objet blanc paraît moins orangé sous A que sur l’écran. Les couleurs vives sont écrêtées. Seuls les nombres font foi.</li>
      <li><strong>Hors modèle</strong> : observateur 10°, indice de rendu des couleurs (IRC), fluorescence et UV, effet de la température de couleur de la lampe, perception et constance des couleurs.</li>
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
        .mt-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .mt-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .mt-col { display: flex; flex-direction: column; gap: 12px; }
        .mt-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .mt-l1.cote .mt-carte { order: 2; } .mt-l1.cote .mt-main { order: 1; }
          .mt-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .mt-ex > * { grid-column: 1; }
          .mt-ex > .mt-reg { grid-column: 2; grid-row: 1 / span 2; }
        }
        @media (max-width: 900px) { .mt-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .mt-in { animation: mt-fondu 0.35s ease-out; } @keyframes mt-fondu { from { opacity: 0; } to { opacity: 1; } } }
        @media (prefers-reduced-motion: reduce) { .mt-l1 *, .mt-ex * { transition: none !important; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Éclairage, réflectance et métamérisme</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>La couleur d’un objet dépend de la <strong>source de lumière</strong>, de la <strong>réflectance</strong> de l’objet et de l’œil. On voit pourquoi deux échantillons identiques sous une lampe peuvent différer sous une autre : le <strong>métamérisme</strong>.</div>
      {enGuide && <div className="mt-l1 cote">
        <div className="mt-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setEtatGuide} fin={finParcours}/></div>
        <div className="mt-main">
          <div className="mt-col">
            {sceneBloc && <div className="mt-in">{sceneBloc}</div>}
            {curseurGuide && <div className="mt-in">{curseurGuide}</div>}
            {mesuresGuide && <div className="mt-in">{mesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.kind}`} etat={defi.kind === 'couleur' ? suiviC : suiviM}/></div>}
      {enExplore && <>
        <div className="mt-ex">
          {planEx}
          <div className="mt-reg">{reglagesExplore}</div>
          {mesuresEx}
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || enDefi || (enGuide && idE === 'bilan')) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
