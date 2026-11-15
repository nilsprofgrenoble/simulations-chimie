import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi, avecIndices, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import { puces, nbf, tire } from "./Travail";
import * as M from "./microscopeModele";
import { SchemaMicroscope, COUL } from "./MicroscopeSchema";
import { C } from "./oeilLoupeSchema";

const SIM_ID = 118;
declarerDefis(SIM_ID, [['map', 'Faire la mise au point'], ['inter', 'Taille de l’image intermédiaire'], ['gross', 'Grossissement du microscope']]);

// ====================================================
//  SIM 118 — LE MICROSCOPE (TSTL, Ondes : « Des ondes pour observer »)
//  Objectif et oculaire = deux lentilles minces convergentes ; intervalle optique Δ = F1′F2 = 160 mm.
//  Image intermédiaire réelle, renversée, agrandie ; mise au point = image définitive à l'infini (A1B1 dans le plan focal objet de l'oculaire).
//  G = |γ1| × dm / f2′ = Δ·dm / (f1′·f2′), dm = 25 cm. Le pouvoir de résolution (diffraction) fait l'objet d'une autre simulation.
// ====================================================
const fm = (x, n = 1) => nbf(x, n);
const FNote = ({ children }) => <div style={{ fontSize: 12.5, color: KIT.txt2, lineHeight: 1.45, marginBottom: 6 }}>{children}</div>;
const P0 = { io: 1, ioc: 1, pg: 10.3, pf: 0, AB: 20 };
const popt = io => M.pMiseAuPoint(M.OBJECTIFS[io]);
const pAuto = io => { const o = popt(io), g = Math.round(o / 0.05) * 0.05; return { pg: Number(g.toFixed(2)), pf: Number((o - g).toFixed(4)) }; };

const FGamma = (<Formule><msub><mi>γ</mi><mn>1</mn></msub><mo>=</mo><mfrac><mrow><mi>O</mi><msub><mi>A</mi><mn>1</mn></msub></mrow><mrow><mi>O</mi><mi>A</mi></mrow></mfrac><mo>=</mo><mo>−</mo><mfrac><mi>Δ</mi><mrow><msubsup><mi>f</mi><mn>1</mn><mo>′</mo></msubsup></mrow></mfrac><mspace width="1em"/><mtext>(mise au point faite)</mtext></Formule>);
const FG = (<Formule><mi>G</mi><mo>=</mo><mfrac><msub><mi>θ</mi><mn>2</mn></msub><msub><mi>θ</mi><mn>0</mn></msub></mfrac><mo>=</mo><mo>|</mo><msub><mi>γ</mi><mn>1</mn></msub><mo>|</mo><mo>×</mo><mfrac><msub><mi>d</mi><mi>m</mi></msub><msubsup><mi>f</mi><mn>2</mn><mo>′</mo></msubsup></mfrac></Formule>);
const FConj = (<Formule><mfrac><mn>1</mn><mi>OA′</mi></mfrac><mo>−</mo><mfrac><mn>1</mn><mi>OA</mi></mfrac><mo>=</mo><mfrac><mn>1</mn><mi>f′</mi></mfrac></Formule>);

// ---------- schémas des cartes « À retenir » ----------
const svgStyle = { width: '100%', maxWidth: 380, height: 'auto', display: 'block', margin: '6px auto' };
const boite = (x, y, w, t1, t2, c, h = 54) => (
  <g key={x + t1}><rect x={x} y={y} width={w} height={h} rx="9" fill="#fff" stroke={c} strokeWidth="2"/>
    <text x={x + w / 2} y={y + 22} textAnchor="middle" fontSize="11.5" fontWeight="800" fill={c}>{t1}</text>
    <text x={x + w / 2} y={y + 40} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={C.txt}>{t2}</text></g>);
const fleche = (x, y) => <g key={`f${x}`}><line x1={x} y1={y} x2={x + 10} y2={y} stroke="#475569" strokeWidth="2"/><polygon points={`${x + 15},${y} ${x + 8},${y - 5} ${x + 8},${y + 5}`} fill="#475569"/></g>;
function CarteModeleSVG() {
  return (
    <svg viewBox="0 0 380 190" role="img" aria-label="Chaîne du microscope : l’objet, l’objectif, l’image intermédiaire réelle renversée et agrandie, l’oculaire utilisé comme une loupe, l’image définitive virtuelle à l’infini, puis l’œil" style={svgStyle}>
      {boite(4, 20, 72, 'objet', 'A₀B₀', COUL.obj)}{fleche(78, 47)}
      {boite(96, 20, 80, 'objectif', 'lentille L₁', C.lent)}{fleche(178, 47)}
      {boite(196, 20, 92, 'A₁B₁', 'réelle, renversée', COUL.inter)}{fleche(290, 47)}
      {boite(308, 20, 68, 'oculaire', 'L₂ = loupe', C.lent)}
      <line x1="342" y1="76" x2="342" y2="96" stroke="#475569" strokeWidth="2"/><polygon points="342,102 337,94 347,94" fill="#475569"/>
      {boite(262, 104, 114, 'A₂B₂', 'virtuelle, à l’infini', C.img)}
      {boite(150, 104, 90, 'œil', 'au repos', C.ret)}{fleche(242, 131)}
      <text x="190" y="176" textAnchor="middle" fontSize="11.5" fontWeight="800" fill={COUL.theta}>l’oculaire regarde l’image intermédiaire comme une loupe</text>
    </svg>);
}
function CarteMapSVG() {
  const y0 = 82, xo = 190, xf = 120;
  return (
    <svg viewBox="0 0 380 170" role="img" aria-label="Mise au point : l’image intermédiaire A1B1 est dans le plan focal objet F2 de l’oculaire ; les rayons issus de B1 ressortent de l’oculaire parallèles entre eux : l’image définitive est à l’infini" style={svgStyle}>
      <line x1="6" y1={y0} x2="374" y2={y0} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="7 4"/>
      <line x1={xo} y1={y0 - 60} x2={xo} y2={y0 + 60} stroke={C.lent} strokeWidth="3.5"/>
      <polygon points={`${xo},${y0 - 66} ${xo - 6},${y0 - 54} ${xo + 6},${y0 - 54}`} fill={C.lent}/><polygon points={`${xo},${y0 + 66} ${xo - 6},${y0 + 54} ${xo + 6},${y0 + 54}`} fill={C.lent}/>
      <line x1={xf} y1={y0 - 48} x2={xf} y2={y0 + 48} stroke={C.foyer} strokeWidth="1.4" strokeDasharray="3 4"/>
      <line x1={xf} y1={y0} x2={xf} y2={y0 + 22} stroke={COUL.inter} strokeWidth="3.5"/><polygon points={`${xf},${y0 + 28} ${xf - 5},${y0 + 19} ${xf + 5},${y0 + 19}`} fill={COUL.inter}/>
      <polyline points={`${xf},${y0 + 24} ${xo},${y0 + 24} ${xo + 150},${y0 - 12}`} fill="none" stroke={COUL.rayon1} strokeWidth="2"/>
      <polyline points={`${xf},${y0 + 24} ${xo},${y0} ${xo + 150},${y0 - 36 + 24}`} fill="none" stroke={COUL.rayon2} strokeWidth="2"/>
      <circle cx={xf} cy={y0} r="4" fill="#fff" stroke={C.foyer} strokeWidth="2"/>
      <g fontSize="11.5" fontWeight="800"><text x={xf} y={y0 - 54} textAnchor="middle" fill={C.foyer}>plan focal objet F₂</text><text x={xo} y={14} textAnchor="middle" fill={C.lent}>oculaire</text>
        <text x={xf - 8} y={y0 + 40} textAnchor="end" fill={COUL.inter}>A₁B₁</text>
        <text x="300" y={y0 + 40} textAnchor="middle" fill={C.img}>rayons parallèles</text></g>
      <text x="190" y="158" textAnchor="middle" fontSize="11.5" fontWeight="800" fill={C.img}>A₁ en F₂ ⇒ image définitive à l’infini</text>
    </svg>);
}
function CarteGammaSVG() {
  const y0 = 74, x1 = 60, xF1 = 110, xF2 = 270, x2 = 322;
  const lent = x => <g key={x}><line x1={x} y1={y0 - 40} x2={x} y2={y0 + 40} stroke={C.lent} strokeWidth="3.5"/><polygon points={`${x},${y0 - 46} ${x - 5},${y0 - 36} ${x + 5},${y0 - 36}`} fill={C.lent}/><polygon points={`${x},${y0 + 46} ${x - 5},${y0 + 36} ${x + 5},${y0 + 36}`} fill={C.lent}/></g>;
  return (
    <svg viewBox="0 0 380 190" role="img" aria-label="Intervalle optique Delta : distance entre le foyer image de l’objectif et le foyer objet de l’oculaire ; l’image intermédiaire se forme au foyer objet de l’oculaire" style={svgStyle}>
      <line x1="6" y1={y0} x2="374" y2={y0} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="7 4"/>
      {lent(x1)}{lent(x2)}
      <circle cx={xF1} cy={y0} r="4" fill={C.foyer}/><circle cx={xF2} cy={y0} r="4" fill="#fff" stroke={C.foyer} strokeWidth="2"/>
      <line x1={xF2} y1={y0} x2={xF2} y2={y0 + 22} stroke={COUL.inter} strokeWidth="3.5"/><polygon points={`${xF2},${y0 + 28} ${xF2 - 5},${y0 + 19} ${xF2 + 5},${y0 + 19}`} fill={COUL.inter}/>
      <line x1={xF1} y1={y0 + 56} x2={xF2} y2={y0 + 56} stroke={COUL.theta} strokeWidth="1.6"/><line x1={xF1} y1={y0 + 50} x2={xF1} y2={y0 + 62} stroke={COUL.theta}/><line x1={xF2} y1={y0 + 50} x2={xF2} y2={y0 + 62} stroke={COUL.theta}/>
      <g fontSize="11.5" fontWeight="800"><text x={x1} y="14" textAnchor="middle" fill={C.lent}>objectif</text><text x={x2} y="14" textAnchor="middle" fill={C.lent}>oculaire</text>
        <text x={xF1} y={y0 - 10} textAnchor="middle" fill={C.foyer}>F₁′</text><text x={xF2} y={y0 - 10} textAnchor="middle" fill={C.foyer}>F₂</text>
        <text x={(xF1 + xF2) / 2} y={y0 + 76} textAnchor="middle" fill={COUL.theta}>Δ = F₁′F₂ = 160 mm</text><text x={xF2 + 8} y={y0 + 34} fill={COUL.inter}>A₁B₁</text></g>
      <text x="190" y="170" textAnchor="middle" fontSize="11.5" fontWeight="800" fill={C.txt}>γ₁ = −Δ / f₁′ : f₁′ = 20 mm donne γ₁ = −8</text>
    </svg>);
}
function CarteGrossSVG() {
  return (
    <svg viewBox="0 0 380 150" role="img" aria-label="Le grossissement du microscope est le produit du grandissement de l’objectif et du grossissement de l’oculaire : 8 fois 5 donne 40" style={svgStyle}>
      {boite(6, 24, 100, '|γ₁| objectif', '8', COUL.inter, 56)}
      <text x="122" y="58" textAnchor="middle" fontSize="22" fontWeight="800" fill="#475569">×</text>
      {boite(136, 24, 110, 'G oculaire', 'dm / f₂′ = 5', C.lent, 56)}
      <text x="262" y="58" textAnchor="middle" fontSize="22" fontWeight="800" fill="#475569">=</text>
      {boite(276, 24, 98, 'G microscope', '40', C.img, 56)}
      <text x="190" y="116" textAnchor="middle" fontSize="12" fontWeight="800" fill={COUL.theta}>G = θ₂ / θ₀ = |γ₁| × dm / f₂′</text>
      <text x="190" y="136" textAnchor="middle" fontSize="11" fontWeight="700" fill="#64748b">les deux facteurs se multiplient</text>
    </svg>);
}
function CarteRefocusSVG() {
  const panneau = (x, ok, titre, sous) => (
    <g key={x}>
      <rect x={x} y="8" width="178" height="130" rx="9" fill="#fff" stroke={ok ? C.img : COUL.ko} strokeWidth="2"/>
      <line x1={x + 8} y1="78" x2={x + 170} y2="78" stroke="#94a3b8" strokeDasharray="6 4"/>
      <line x1={x + 120} y1="30" x2={x + 120} y2="126" stroke={C.lent} strokeWidth="3"/>
      <line x1={x + 72} y1="40" x2={x + 72} y2="116" stroke={C.foyer} strokeWidth="1.3" strokeDasharray="3 4"/>
      <circle cx={x + 72} cy="78" r="3.5" fill="#fff" stroke={C.foyer} strokeWidth="2"/>
      <line x1={x + (ok ? 72 : 40)} y1="78" x2={x + (ok ? 72 : 40)} y2="98" stroke={COUL.inter} strokeWidth="3.5"/><polygon points={`${x + (ok ? 72 : 40)},104 ${x + (ok ? 72 : 40) - 5},96 ${x + (ok ? 72 : 40) + 5},96`} fill={COUL.inter}/>
      <text x={x + 72} y="36" textAnchor="middle" fontSize="10.5" fontWeight="800" fill={C.foyer}>F₂</text><text x={x + 120} y="22" textAnchor="middle" fontSize="10.5" fontWeight="800" fill={C.lent}>oculaire</text>
      <text x={x + 89} y="128" textAnchor="middle" fontSize="11" fontWeight="800" fill={ok ? C.img : COUL.ko}>{titre}</text>
      <text x={x + 12} y="30" fontSize="10.5" fontWeight="700" fill={COUL.inter}>{sous}</text>
    </g>);
  return (
    <svg viewBox="0 0 380 190" role="img" aria-label="À gauche, après la mise au point, A1B1 est en F2 ; à droite, après un changement d’objectif sans toucher à la molette, A1B1 n’est plus en F2 : l’image est floue" style={svgStyle}>
      {panneau(8, true, 'mise au point faite', 'A₁B₁ en F₂')}{panneau(194, false, 'objectif changé : flou', 'A₁B₁ hors de F₂')}
      <text x="190" y="164" textAnchor="middle" fontSize="11.5" fontWeight="800" fill={COUL.theta}>autre f₁′ ⇒ autre distance objet–objectif</text>
      <text x="190" y="182" textAnchor="middle" fontSize="11" fontWeight="700" fill="#64748b">on tourne la molette pour refaire la mise au point</text>
    </svg>);
}
function CarteBilanSVG() {
  return (
    <svg viewBox="0 0 380 170" role="img" aria-label="Bilan : objectif puis image intermédiaire réelle, oculaire utilisé comme une loupe, mise au point quand A1 est en F2, grossissement égal au produit" style={svgStyle}>
      {boite(4, 12, 86, 'objectif', 'A₁B₁ réelle', C.lent)}{fleche(92, 39)}
      {boite(112, 12, 86, 'A₁ en F₂', 'mise au point', COUL.inter)}{fleche(200, 39)}
      {boite(220, 12, 78, 'oculaire', 'loupe', C.lent)}{fleche(300, 39)}
      {boite(320, 12, 56, 'A₂B₂', 'à l’∞', C.img)}
      <text x="190" y="104" textAnchor="middle" fontSize="12" fontWeight="800" fill={COUL.theta}>γ₁ = −Δ / f₁′      G = |γ₁| × dm / f₂′</text>
      <text x="190" y="126" textAnchor="middle" fontSize="11" fontWeight="700" fill="#64748b">Δ = 160 mm, dm = 25 cm</text>
      <text x="190" y="148" textAnchor="middle" fontSize="11" fontWeight="700" fill="#64748b">changer d’objectif ⇒ refaire la mise au point</text>
    </svg>);
}

const FICHES = {
  modele: <>
    <CarteModeleSVG/>
    {puces(<>Le microscope est formé de deux « lentilles » convergentes : l’<strong>objectif</strong> (côté objet) et l’<strong>oculaire</strong> (côté œil).</>,
      <>L’objectif donne de l’objet une <strong>image intermédiaire A₁B₁ réelle, renversée et agrandie</strong>. Cette image sert d’<strong>objet à l’oculaire</strong>.</>,
      <><strong>Mémo</strong> : « objectif = image intermédiaire ; oculaire = loupe ».</>)}
  </>,
  map: <>
    <CarteMapSVG/>
    {puces(<><strong>Microscope mis au point</strong> : l’image définitive A₂B₂ est <strong>à l’infini</strong>, pour que l’œil l’observe <strong>sans accommoder</strong>.</>,
      <>Cela revient à placer l’image intermédiaire <strong>dans le plan focal objet F₂ de l’oculaire</strong> (A₁ = F₂) : les rayons ressortent parallèles.</>,
      <><strong>Idée fausse</strong> : « la mise au point rapproche l’image de l’œil ». <strong>Vrai</strong> : on la rejette à l’infini.</>)}
  </>,
  gamma: <>
    <CarteGammaSVG/>
    {FGamma}
    {puces(<>Quand le microscope est mis au point, A₁ est en F₂ : O₁A₁ = f₁′ + Δ, où <strong>Δ = F₁′F₂ = 160{NB}mm</strong> (intervalle optique).</>,
      <><strong>Exemple</strong> : f₁′ = 20{NB}mm : O₁A₁ = 180{NB}mm, l’objet est à 22,5{NB}mm de l’objectif, γ₁ = −8 : un objet de 30{NB}µm donne A₁B₁ = 0,24{NB}mm.</>,
      <>γ₁ &lt; 0 : l’image intermédiaire est <strong>renversée</strong> ; plus f₁′ est petite, plus |γ₁| est grand.</>)}
  </>,
  gross: <>
    <CarteGrossSVG/>
    {FG}
    {puces(<>Le grossissement compare l’angle θ₂ sous lequel on voit l’image définitive à l’angle θ₀ sous lequel on verrait l’objet à l’œil nu à d<sub>m</sub> = 25{NB}cm.</>,
      <><strong>Exemple</strong> : f₁′ = 20{NB}mm et f₂′ = 50{NB}mm donnent |γ₁| = 8, G<sub>oculaire</sub> = 5, donc G = 40.</>,
      <>Pour augmenter G : objectif de f₁′ <strong>plus petite</strong> et/ou oculaire de f₂′ <strong>plus petite</strong>.</>)}
  </>,
  refaire: <>
    <CarteRefocusSVG/>
    {puces(<>La distance objet–objectif qui convient s’écrit p = f₁′(f₁′ + Δ)/Δ : elle <strong>dépend de f₁′</strong>.</>,
      <><strong>Exemple</strong> : f₁′ = 10{NB}mm ⇒ p = 10,6{NB}mm ; f₁′ = 8{NB}mm ⇒ p = 8,4{NB}mm.</>,
      <><strong>Mémo</strong> : « on change d’objectif ⇒ on refait la mise au point ».</>)}
  </>,
  bilan: <>
    <CarteBilanSVG/>
    {puces(<>Objectif : image intermédiaire réelle, renversée, agrandie, γ₁ = −Δ / f₁′ après mise au point (A₁ en F₂).</>,
      <>Oculaire utilisé comme une loupe : image définitive virtuelle à l’infini, œil au repos.</>,
      <>G = θ₂ / θ₀ = |γ₁| × d<sub>m</sub> / f₂′ ; changer d’objectif impose de refaire la mise au point.</>)}
  </>,
};

// ====================================================
//  COMPOSANT
// ====================================================
export function SimulationMicroscope() {
  const [mode, setMode] = useState(() => modeOuverture('microscope-guide-v1'));
  useSignalerMode(mode);
  const [suiviM, noterM] = useCompteurDefi(), [suiviI, noterI] = useCompteurDefi(), [suiviG, noterG] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('microscope-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('map');
  const [hypoOuv, setHypoOuv] = useState(false), [cotesOn, setCotesOn] = useState(true);
  const [P, setP] = useState(P0);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const PE = enDefi && defi ? defi.p : P;
  const f1 = M.OBJECTIFS[PE.io], f2 = M.OCULAIRES[PE.ioc], p = PE.pg + PE.pf;
  const s = M.ecartF2(p, f1), nette = M.miseAuPoint(p, f1, f2), ABmm = PE.AB / 1000;

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const dep = patch => () => setP(x => ({ ...x, ...patch }));
  const ETAPES = [
    { id: 'modele', titre: 'Deux lentilles en série', focus: ['scene'], depart: dep({ io: 1, ioc: 1, ...pAuto(1) }),
      retenirTitre: 'À RETENIR : LE MODÈLE DU MICROSCOPE', retenir: FICHES.modele,
      texte: <>Un microscope sert à observer des détails très petits. Optiquement, il se modélise par <strong>deux lentilles minces convergentes</strong> placées l’une derrière l’autre : l’<strong>objectif</strong>, près de l’objet, et l’<strong>oculaire</strong>, près de l’œil. Le schéma n’est pas à l’échelle : l’objet, les images et les angles y sont agrandis. L’objet AB (en noir) est juste devant l’objectif ; suivez les rayons bleu et orange.</>,
      tache: { type: 'qcm', q: 'Dans ce modèle, que fait l’oculaire de l’image formée par l’objectif ?', options: ['il l’observe comme une loupe : elle lui sert d’objet', 'il la projette sur un écran', 'il l’éclaire', 'il l’efface'], bonne: 0,
        indice: 'Regardez les rayons : les rayons qui sortent de l’objectif se croisent, puis entrent dans l’oculaire. Que devient le point où ils se croisent pour l’oculaire ?', expl: 'L’image donnée par l’objectif est l’objet de l’oculaire. L’oculaire joue le rôle d’une loupe qui observe cette image intermédiaire.' } },
    { id: 'inter', titre: 'L’image intermédiaire', focus: ['scene'], depart: null,
      texte: <>Les rayons issus du point B traversent l’objectif et <strong>se croisent</strong> en un point B₁ de l’image appelée <strong>image intermédiaire</strong> A₁B₁ (en marron).</>,
      tache: { type: 'qcm', q: 'Quelle est la nature de l’image intermédiaire A₁B₁ ?', options: ['réelle, renversée et agrandie', 'virtuelle, droite et agrandie', 'réelle, droite et plus petite', 'virtuelle, renversée et plus petite'], bonne: 0,
        indice: 'Les rayons se croisent-ils réellement en B₁ ? B₁ est-il du même côté de l’axe que B ?', expl: 'Les rayons lumineux passent réellement par B₁ : l’image est réelle. B₁ est de l’autre côté de l’axe que B : elle est renversée. Elle est plus grande que l’objet : agrandie.' } },
    { id: 'map', titre: 'La mise au point', focus: ['scene', 'reglages'], depart: dep({ io: 1, ioc: 1, pg: 10.3, pf: 0 }),
      texte: <>Pour observer sans fatigue, l’œil doit recevoir des rayons <strong>parallèles</strong> : l’image définitive doit être <strong>à l’infini</strong>. Sur un vrai microscope, on tourne la <strong>molette</strong>, qui change la distance objet–objectif. Réglez la molette (puis la vis fine) jusqu’à ce que le schéma indique « mise au point faite ». Le bouton « mise au point automatique » est là en secours.</>,
      tache: { type: 'action', ok: enGuide && M.miseAuPoint(p, f1, f2), consigne: 'Faites la mise au point : les rayons doivent sortir parallèles de l’oculaire.' } },
    { id: 'map-q', titre: 'Où est A₁B₁ ?', focus: ['scene'], depart: null,
      retenirTitre: 'À RETENIR : LA MISE AU POINT', retenir: FICHES.map,
      texte: <>Le microscope est mis au point : les rayons sortent de l’oculaire <strong>parallèles</strong> et l’œil voit l’image <strong>sans accommoder</strong> (comme pour un objet à l’infini). Regardez où se trouve l’image intermédiaire par rapport au point F₂, foyer objet de l’oculaire.</>,
      tache: { type: 'qcm', q: 'À quelle condition l’image définitive est-elle à l’infini ?', options: ['A₁B₁ est dans le plan focal objet de l’oculaire (A₁ en F₂)', 'A₁B₁ est dans le plan focal image de l’objectif', 'A₁B₁ est collée à l’oculaire', 'A₁B₁ est à une distance 2f₂′ de l’oculaire'], bonne: 0,
        indice: 'Souvenez-vous de la loupe : pour que les rayons ressortent parallèles, où faut-il placer l’objet ?', expl: 'Pour l’oculaire utilisé comme une loupe, l’image est à l’infini quand son objet A₁B₁ est dans son plan focal objet : A₁ est en F₂.' } },
    { id: 'delta', titre: 'Où est l’image intermédiaire ?', focus: ['mesures'], depart: dep({ io: 1, ioc: 1, ...pAuto(1) }),
      texte: <>On utilise l’objectif de distance focale <em>f₁′</em> = 10{NB}mm. L’<strong>intervalle optique</strong> Δ = F₁′F₂ vaut <strong>160{NB}mm</strong>. Le microscope étant mis au point, A₁ est en F₂. Calculez la distance O₁A₁ entre l’objectif et l’image intermédiaire.</>,
      tache: { type: 'num', q: 'Distance O₁A₁ (mise au point faite)', unite: 'mm', vrai: 170, tol: 0.01, affiche: v => fm(v, 0), carnet: 'Distance O₁A₁ (objectif – image intermédiaire)',
        calcul: () => ['O₁F₁′ = f₁′ = 10 mm (foyer image de l’objectif). F₁′F₂ = Δ = 160 mm, et A₁ est en F₂.', 'O₁A₁ = O₁F₁′ + F₁′F₂ = 10 + 160 = 170 mm.'],
        pieges: [[160, 'Vous avez oublié O₁F₁′ : O₁A₁ = f₁′ + Δ, car Δ se mesure à partir de F₁′, pas de O₁.'], [150, 'Vous avez soustrait f₁′ : on additionne, F₁′ est entre O₁ et F₂.']],
        expl: 'O₁A₁ = f₁′ + Δ = 170 mm : l’image intermédiaire est à 170 mm de l’objectif.', indice: 'O₁A₁ = O₁F₁′ + F₁′F₂, avec O₁F₁′ = f₁′ et F₁′F₂ = Δ.' } },
    { id: 'p', titre: 'Où placer l’objet ?', focus: ['mesures'], depart: null,
      texte: <>L’objectif (<em>f₁′</em> = 10{NB}mm) doit donner une image à O₁A₁ = +170{NB}mm. Calculez la distance entre l’objet et l’objectif avec la relation de conjugaison {FConj}où OA est négatif (l’objet est avant la lentille) ; donnez la distance <strong>positive</strong> |OA|.</>,
      tache: { type: 'num', q: 'Distance objet–objectif |OA|', unite: 'mm', vrai: 10.625, tol: 0.01, affiche: v => fm(v, 1), carnet: 'Distance objet–objectif |OA|',
        calcul: () => ['1/OA = 1/OA′ − 1/f′ = 1/170 − 1/10 = 0,005882 − 0,1 = −0,09412 mm⁻¹.', 'OA = −10,6 mm : l’objet est à 10,6 mm devant l’objectif, juste au-delà de son foyer objet.'],
        pieges: [[170 * 10 / (170 + 10), 'Vous avez additionné 1/OA′ et 1/f′ : 1/OA = 1/OA′ − 1/f′.'], [-10.625, 'Le signe : OA est négatif. La question demande la distance, positive.']],
        expl: '|OA| ≈ 10,6 mm. L’objet est tout près du foyer objet de l’objectif (10 mm).', indice: '1/OA = 1/OA′ − 1/f′ avec OA′ = 170 mm et f′ = 10 mm. Calculez, puis inversez.' } },
    { id: 'gamma', titre: 'Le grandissement de l’objectif', focus: ['mesures'], depart: null,
      retenirTitre: 'À RETENIR : INTERVALLE OPTIQUE ET GRANDISSEMENT', retenir: FICHES.gamma,
      texte: <>Le <strong>grandissement</strong> de l’objectif est γ₁ = O₁A₁ / O₁A (grandeurs algébriques). Vous avez O₁A₁ = +170{NB}mm et O₁A = −10,6{NB}mm. Calculez γ₁ (avec son signe).</>,
      tache: { type: 'num', q: 'Grandissement γ₁ de l’objectif', unite: '', vrai: -16, tol: 0.03, affiche: v => fm(v, 1), carnet: 'Grandissement γ₁ de l’objectif',
        calcul: () => ['γ₁ = O₁A₁ / O₁A = 170 / (−10,625) = −16.', 'Le signe négatif traduit l’image renversée. On retrouve γ₁ = −Δ / f₁′ = −160 / 10.'],
        pieges: [[16, 'Le signe : O₁A est négatif, donc γ₁ aussi. Une image renversée a un grandissement négatif.'], [-0.0625, 'Vous avez calculé O₁A / O₁A₁ : le grandissement est O₁A₁ / O₁A.']],
        expl: 'γ₁ = −16 : l’image intermédiaire est 16 fois plus grande que l’objet, et renversée.', indice: 'γ₁ = O₁A₁ / O₁A avec O₁A₁ = 170 mm et O₁A = −10,6 mm.' } },
    { id: 'a1b1', titre: 'Taille de l’image intermédiaire', focus: ['mesures'], depart: null,
      texte: <>L’objet observé est un petit détail de <strong>20{NB}µm</strong> (soit 0,020{NB}mm). Avec γ₁ = −16, calculez la taille de l’image intermédiaire A₁B₁ (valeur positive, en mm).</>,
      tache: { type: 'num', q: 'Taille de A₁B₁', unite: 'mm', vrai: 0.32, tol: 0.03, affiche: v => fm(v, 2), carnet: 'Taille de l’image intermédiaire A₁B₁',
        calcul: () => ['A₁B₁ = |γ₁| × A₀B₀ = 16 × 0,020 mm = 0,32 mm.'], pieges: [[0.02 / 16, 'Vous avez divisé par 16 : l’image est agrandie, on multiplie.'], [320, 'Valeur correcte, mais en µm : l’énoncé demande des mm.']],
        expl: 'A₁B₁ = 0,32 mm : 16 fois plus grande que l’objet.', indice: 'A₁B₁ = |γ₁| × A₀B₀ avec A₀B₀ = 0,020 mm.' } },
    { id: 'theta2', titre: 'L’angle sous lequel on voit l’image', focus: ['mesures'], depart: null,
      texte: <>L’oculaire (<em>f₂′</em> = 25{NB}mm) est une loupe dont l’objet A₁B₁ est dans le plan focal : l’œil voit l’image définitive sous l’angle <strong>θ₂ ≈ A₁B₁ / f₂′</strong> (radian). Avec A₁B₁ = 0,32{NB}mm, calculez θ₂.</>,
      tache: { type: 'num', q: 'Diamètre apparent θ₂ de l’image définitive', unite: 'rad', vrai: 0.0128, tol: 0.03, affiche: v => fm(v, 4), carnet: 'Diamètre apparent θ₂ (avec le microscope)',
        calcul: () => ['A₁B₁ et f₂′ en mm : θ₂ ≈ A₁B₁ / f₂′ = 0,32 / 25 = 0,0128 rad (12,8 mrad).'], pieges: [[0.32 / 250, 'Vous avez divisé par dm = 250 mm : c’est l’angle à l’œil nu. Avec l’oculaire, on divise par f₂′.'], [78, 'Vous avez calculé f₂′ / A₁B₁ : θ₂ = A₁B₁ / f₂′.']],
        expl: 'θ₂ ≈ 0,0128 rad = 12,8 mrad.', indice: 'θ₂ ≈ A₁B₁ / f₂′, avec A₁B₁ = 0,32 mm et f₂′ = 25 mm.' } },
    { id: 'theta0', titre: 'À l’œil nu', focus: ['mesures'], depart: null,
      texte: <>À l’œil nu, on observerait le même détail (0,020{NB}mm) à la distance minimale de vision distincte <strong>d<sub>m</sub> = 250{NB}mm</strong>. Calculez l’angle θ₀ en <strong>mrad</strong> et comparez-le au pouvoir séparateur de l’œil ε ≈ 0,3{NB}mrad : le détail est-il visible à l’œil nu ?</>,
      tache: { type: 'num', q: 'Diamètre apparent θ₀ à l’œil nu', unite: 'mrad', vrai: 0.08, tol: 0.03, affiche: v => fm(v, 3), carnet: 'Diamètre apparent θ₀ à l’œil nu',
        calcul: () => ['θ₀ ≈ AB / dm = 0,020 / 250 = 8,0×10⁻⁵ rad = 0,080 mrad.', '0,080 mrad < ε = 0,3 mrad : le détail est invisible à l’œil nu ; avec le microscope θ₂ = 12,8 mrad, bien supérieur à ε.'],
        pieges: [[0.8, 'Vous avez divisé 0,020 mm par 25 mm : dm est de 250 mm (25 cm).'], [0.00008, 'Valeur correcte en radian ; l’énoncé demande des mrad (× 1000).']],
        expl: 'θ₀ = 0,080 mrad < ε : invisible à l’œil nu. Le microscope le rend visible (θ₂ = 12,8 mrad).', indice: 'θ₀ ≈ AB / dm avec AB = 0,020 mm et dm = 250 mm ; 1 rad = 1000 mrad.' } },
    { id: 'G', titre: 'Le grossissement', focus: ['mesures'], depart: null,
      retenirTitre: 'À RETENIR : LE GROSSISSEMENT', retenir: FICHES.gross,
      texte: <>Le <strong>grossissement</strong> du microscope est G = θ₂ / θ₀. Vous avez θ₂ = 12,8{NB}mrad et θ₀ = 0,080{NB}mrad. Calculez G (sans unité).</>,
      tache: { type: 'num', q: 'Grossissement G du microscope', unite: '', vrai: 160, tol: 0.03, affiche: v => fm(v, 0), carnet: 'Grossissement G du microscope',
        calcul: () => ['G = θ₂ / θ₀ = 12,8 / 0,080 = 160.', 'Autre expression : G = |γ₁| × dm / f₂′ = 16 × (250 / 25) = 16 × 10 = 160.'], pieges: [[1 / 160, 'Vous avez calculé θ₀ / θ₂ : G = θ₂ / θ₀.']],
        expl: 'G = 160 = |γ₁| × G_oculaire = 16 × 10 : l’image définitive est vue 160 fois plus grande, angulairement, qu’à l’œil nu à 25 cm.', indice: 'G = θ₂ / θ₀, avec θ₂ = 12,8 mrad et θ₀ = 0,080 mrad (mêmes unités).' } },
    { id: 'G2', titre: 'Changer le grossissement', focus: ['reglages'], depart: dep({ io: 1, ioc: 1, ...pAuto(1) }),
      texte: <>La relation <strong>G = |γ₁| × d<sub>m</sub> / f₂′ = Δ·d<sub>m</sub> / (f₁′ f₂′)</strong> montre comment agir sur le grossissement. Essayez les boutons d’objectif et d’oculaire.</>,
      tache: { type: 'qcm', q: 'Parmi ces changements, lequel augmente le grossissement G ?', options: ['remplacer l’objectif par un autre de distance focale plus petite', 'remplacer l’oculaire par un autre de distance focale plus grande', 'éloigner l’œil de l’oculaire', 'utiliser un éclairage plus intense'], bonne: 0,
        indice: 'G = Δ·dm / (f₁′ f₂′) : G est grand quand le dénominateur est petit.', expl: 'G est inversement proportionnel à f₁′ et à f₂′ : une distance focale plus petite pour l’objectif (ou pour l’oculaire) donne un plus grand grossissement.' } },
    { id: 'refaire', titre: 'On change d’objectif', focus: ['scene', 'reglages'], depart: dep({ io: 2, ioc: 1, pg: 10.6, pf: 0.025 }),
      texte: <>On vient de tourner la tourelle pour passer à l’objectif de distance focale <em>f₁′</em> = 8{NB}mm, <strong>sans toucher</strong> à la molette. Le schéma indique que l’image n’est plus au point. Refaites la mise au point.</>,
      tache: { type: 'action', ok: enGuide && PE.io === 2 && M.miseAuPoint(p, f1, f2), consigne: 'Refaites la mise au point avec ce nouvel objectif.' } },
    { id: 'refaire-q', titre: 'Pourquoi refaire la mise au point ?', focus: [], depart: null,
      retenirTitre: 'À RETENIR : CHANGER D’OBJECTIF', retenir: FICHES.refaire,
      texte: <>Vous avez dû tourner la molette : avec l’objectif de 8{NB}mm, l’objet doit être à environ 8,4{NB}mm de l’objectif, contre 10,6{NB}mm avec celui de 10{NB}mm.</>,
      tache: { type: 'qcm', q: 'Pourquoi faut-il refaire la mise au point quand on change d’objectif ?', options: ['la distance objet–objectif qui place A₁ en F₂ dépend de f₁′', 'l’oculaire change tout seul de distance focale', 'l’œil se fatigue', 'l’intervalle optique Δ s’annule'], bonne: 0,
        indice: 'Comparez les positions de l’objet (10,6 mm et 8,4 mm) pour que A₁ soit en F₂ avec les deux objectifs.', expl: 'Avec Δ fixé, il faut O₁A₁ = f₁′ + Δ, donc une distance objet–objectif p = f₁′(f₁′ + Δ)/Δ différente pour chaque objectif : sans nouvelle mise au point, A₁ n’est plus en F₂.' } },
    { id: 'bravo', titre: 'Bravo ! Le bilan', focus: [], depart: null,
      retenirTitre: 'À RETENIR : LE BILAN', retenir: FICHES.bilan,
      texte: <>Vous savez décrire un microscope avec deux lentilles, faire la mise au point (image à l’infini, A₁ en F₂), calculer le grandissement de l’objectif et le grossissement du microscope. Essayez maintenant l’exploration, puis les défis.</>, tache: null },
  ];
  const etape = Math.min(guide.etape, ETAPES.length - 1);
  const IDS = ETAPES.map(e => e.id), idE = ETAPES[etape].id;
  const depuis = id => !enGuide || etape >= IDS.indexOf(id);
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  useEffect(() => {
    if (mode !== 'guide') return;
    const d = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (d) d();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ DÉFIS ════════════════
  const decale = io => { const o = popt(io), dx = tire([-1, 1]) * tire([0.4, 0.7, 1.1]); const g = Math.round((o + dx) / 0.05) * 0.05; return { pg: Number(g.toFixed(2)), pf: 0 }; };
  const tirages = {
    map: () => { const io = tire([0, 1, 2]), ioc = tire([0, 1, 2]); return { type: 'map', p: { io, ioc, ...decale(io), AB: 20 }, reps: {}, verifie: false }; },
    inter: () => { const io = tire([0, 1, 2]), AB = tire([10, 20, 30, 40, 50]); return { type: 'inter', p: { io, ioc: 1, ...pAuto(io), AB }, f1: M.OBJECTIFS[io], AB, reps: {}, verifie: false }; },
    gross: () => { const io = tire([0, 1, 2]), ioc = tire([0, 1, 2]); return { type: 'gross', p: { io, ioc, ...pAuto(io), AB: 20 }, f1: M.OBJECTIFS[io], f2: M.OCULAIRES[ioc], reps: {}, verifie: false }; },
  };
  const nouveauDefi = t => setDefi(tirages[t]());
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const majDefi = patch => setDefi(x => ({ ...x, p: { ...x.p, ...patch }, verifie: false }));
  const verifierDefi = () => {
    let ok, vrai;
    if (defi.type === 'map') { ok = M.miseAuPoint(defi.p.pg + defi.p.pf, M.OBJECTIFS[defi.p.io], M.OCULAIRES[defi.p.ioc]); }
    else {
      const x = lireNombre(defi.reps.r);
      vrai = defi.type === 'inter' ? defi.AB / 1000 * M.DELTA / defi.f1 : M.grossissement(defi.f1, defi.f2);
      ok = isFinite(x) && proche(x, vrai, 0.06);
    }
    setDefi(x => ({ ...x, verifie: true, ok, vrai }));
    ({ map: noterM, inter: noterI, gross: noterG })[defi.type](ok);
  };
  const champ = (unite, label) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps.r ?? ''} aria-label={label} inputMode="decimal" onKeyDown={e => e.key === 'Enter' && document.getElementById('mi-verif')?.click()}
        onChange={e => setDefi(x => ({ ...x, reps: { r: e.target.value }, verifie: false }))}
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['map', 'Mise au point'], ['inter', 'Image intermédiaire'], ['gross', 'Grossissement']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'map' ? 'Défi : faites la mise au point' : defi.type === 'inter' ? 'Défi : quelle est la taille de l’image intermédiaire ?' : 'Défi : quel est le grossissement de ce microscope ?'}</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>
        {defi.type === 'map' && <>Le microscope utilise l’objectif <em>f₁′</em> = {fm(M.OBJECTIFS[defi.p.io], 0)}{NB}mm et l’oculaire <em>f₂′</em> = {fm(M.OCULAIRES[defi.p.ioc], 0)}{NB}mm. Réglez la molette et la vis fine pour que l’image définitive soit à l’infini, puis cliquez sur « Vérifier » (le bouton automatique est désactivé).</>}
        {defi.type === 'inter' && <>Un objet de <strong>{fm(defi.AB, 0)}{NB}µm</strong> est observé avec l’objectif <em>f₁′</em> = {fm(defi.f1, 0)}{NB}mm, microscope mis au point (Δ = 160{NB}mm). Calculez la taille de l’image intermédiaire A₁B₁, en <strong>mm</strong>, avec 2 chiffres significatifs.</>}
        {defi.type === 'gross' && <>Un microscope a pour objectif <em>f₁′</em> = {fm(defi.f1, 0)}{NB}mm et pour oculaire <em>f₂′</em> = {fm(defi.f2, 0)}{NB}mm ; il est mis au point, avec Δ = 160{NB}mm et d<sub>m</sub> = 250{NB}mm. Calculez son grossissement G, avec 2 chiffres significatifs.</>}
      </div>
      {defi.type === 'inter' && champ('mm', 'Taille de A₁B₁')}
      {defi.type === 'gross' && champ('', 'Grossissement G')}
      {defi.type === 'map' && <IndiceDefi cache={false}>La mise au point est faite quand A₁ est en F₂ : l’image définitive est à l’infini. Tournez d’abord la molette près de la bonne position, puis affinez avec la vis micrométrique jusqu’à lire « mise au point faite ». Distance attendue : <em>p</em> = <em>f₁′</em>(<em>f₁′</em> + Δ)/Δ.</IndiceDefi>}
      {defi.type === 'inter' && <IndiceDefi cache={false}>A₁B₁ = |γ₁| × AB avec |γ₁| = Δ / f₁′ (mise au point faite). Convertissez AB en mm.</IndiceDefi>}
      {defi.type === 'gross' && <IndiceDefi cache={false}>G = |γ₁| × d<sub>m</sub> / f₂′ = Δ·d<sub>m</sub> / (f₁′ f₂′), avec Δ = 160 mm et d<sub>m</sub> = 250 mm.</IndiceDefi>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="mi-verif" onClick={verifierDefi} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {avecIndices(defi.ok ? (defi.type === 'map' ? '✓ Mise au point faite : l’image définitive est à l’infini.' : `✓ Correct. Valeur de la simulation : ${defi.type === 'inter' ? `A₁B₁ = ${fm(defi.vrai, 2)}${NB}mm` : `G = ${fm(defi.vrai, 0)}`}.`)
          : defi.type === 'map' ? '✗ L’image n’est pas à l’infini : A₁ n’est pas encore en F₂. Affinez avec la vis micrométrique.'
            : defi.type === 'inter' ? '✗ Vérifiez : A₁B₁ = (Δ / f₁′) × AB, avec AB converti en mm.' : '✗ Vérifiez : G = Δ·dm / (f₁′ f₂′) avec Δ = 160 mm, dm = 250 mm, f₁′ et f₂′ en mm.')}
      </div>}
    </div>);

  // ════════════════ HYPOTHÈSES, MESURES, RÉGLAGES ════════════════
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Objectif et oculaire</strong> : deux lentilles minces convergentes (approximation de Gauss, lumière monochromatique, objet plan perpendiculaire à l’axe). Un vrai objectif ou oculaire est une association de lentilles, modélisée ici par une seule.</li>
      <li><strong>Intervalle optique</strong> Δ = F₁′F₂ = 160 mm, fixé. Quand on change d’objectif, f₁′ change mais pas Δ : c’est la distance objet–objectif qui doit être modifiée pour refaire la mise au point.</li>
      <li><strong>Mise au point</strong> : image définitive à l’infini (A₁ en F₂). Le faisceau sortant est jugé quasi parallèle si sa vergence est inférieure à 1 δ : cela donne une tolérance sur A₁ de l’ordre de f₂′²/1000 (0,6 mm pour f₂′ = 25 mm), soit quelques micromètres sur la position de l’objet.</li>
      <li><strong>Grossissement commercial</strong> G = θ₂ / θ₀ avec θ₀ l’angle sous lequel on verrait l’objet à d<sub>m</sub> = 250 mm ; angles petits (θ ≈ tan θ). Pouvoir séparateur de l’œil ε ≈ 3×10⁻⁴ rad : un ordre de grandeur.</li>
      <li><strong>Limite non modélisée</strong> : la diffraction limite le pouvoir de résolution d’un microscope ; ici, un grossissement plus grand rend toujours un détail plus visible, ce qui est faux pour de très petits détails (autre simulation).</li>
      <li><strong>Dessin</strong> : non à l’échelle (objet, images et angles agrandis, distances compressées), mais les rayons sont tracés avec deux lentilles minces ; la position de A₁ par rapport à F₂ suit l’écart réel s = O₂A₁ + f₂′.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const gam = M.gamma1(p, f1), A1B1 = M.tailleA1B1(ABmm, p, f1);
  const A2 = M.posA2(p, f1, f2), nat = M.natureA2(p, f1, f2);
  const sg = v => (v < 0 ? `−${fm(Math.abs(v), 1)}` : fm(v, 1));
  const gOK = nette ? M.grossissement(f1, f2) : null;
  const mesures = (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="Objectif f₁′" valeur={`${fm(f1, 0)}${NB}mm`} couleur={C.lent}/>
      <LigneMesure nom="Oculaire f₂′" valeur={`${fm(f2, 0)}${NB}mm`} couleur={C.lent}/>
      {(enExplore || depuis('delta')) && <LigneMesure nom="Intervalle optique Δ = F₁′F₂" valeur={`160${NB}mm`} couleur="#64748b"/>}
      {(enExplore || depuis('gamma')) && <LigneMesure nom="Distance objet–objectif |OA|" valeur={`${fm(p, 3)}${NB}mm`} couleur={COUL.obj}/>}
      {(enExplore || depuis('p')) && <LigneMesure nom="Position O₁A₁ de l’image intermédiaire" valeur={`${fm(M.posA1(p, f1), 1)}${NB}mm`} couleur={COUL.inter}/>}
      {(enExplore || depuis('a1b1')) && <LigneMesure nom="Grandissement γ₁ de l’objectif" valeur={sg(gam)} couleur={COUL.inter}/>}
      {(enExplore || depuis('theta2')) && <LigneMesure nom="Taille de l’image intermédiaire A₁B₁" valeur={`${fm(A1B1, 3)}${NB}mm`} couleur={COUL.inter}/>}
      {enExplore && <LigneMesure nom="Écart s de A₁ par rapport à F₂" valeur={`${s > 0 ? '+' : s < 0 ? '−' : ''}${fm(Math.abs(s), 2)}${NB}mm`} couleur="#64748b"/>}
      {(enExplore || depuis('map')) && <LigneMesure nom="Image définitive A₂B₂" valeur={nat === 'infini' || nette ? 'à l’infini (au point)' : nat === 'virtuelle' ? `virtuelle, à ${fm(Math.abs(A2), 0)}${NB}mm de l’oculaire : floue` : `réelle, à ${fm(A2, 0)}${NB}mm : invisible pour l’œil`} couleur={nette ? '#15803d' : '#dc2626'}/>}
      {(enExplore || depuis('theta0')) && nette && <LigneMesure nom="Diamètre apparent θ₂ (microscope)" valeur={`${fm(M.theta2(A1B1, f2) * 1000, 1)}${NB}mrad`} couleur={COUL.theta}/>}
      {(enExplore || depuis('G')) && <LigneMesure nom="Diamètre apparent θ₀ (œil nu, 25 cm)" valeur={`${fm(M.theta0(ABmm) * 1000, 3)}${NB}mrad`} couleur="#64748b"/>}
      {(enExplore || depuis('bravo')) && <LigneMesure nom="Grossissement G = θ₂ / θ₀" valeur={gOK == null ? 'mise au point à faire' : fm(gOK, 0)} couleur="#b45309"/>}
      {enExplore && <LigneMesure nom="Détail visible à l’œil nu ?" valeur={M.visibleOeilNu(ABmm) ? 'oui (θ₀ ≥ ε)' : 'non (θ₀ < ε)'} couleur={M.visibleOeilNu(ABmm) ? '#15803d' : '#dc2626'}/>}
    </div>);
  const boutonsObj = (cle, liste, nomSym) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{cle === 'io' ? 'Objectif (tourelle)' : 'Oculaire'}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {liste.map((v, i) => <button key={v} onClick={() => (enDefi ? majDefi({ [cle]: i }) : setP(x => ({ ...x, [cle]: i })))} aria-pressed={PE[cle] === i} style={stylePetitBouton(PE[cle] === i, '#0369a1')}>{nomSym}′ = {v}{NB}mm</button>)}
      </div>
    </div>);
  const maj = patch => (enDefi ? majDefi(patch) : setP(x => ({ ...x, ...patch })));
  const curG = <Curseur nom="Molette (réglage grossier) : distance objet–objectif" valeur={PE.pg} onChange={v => maj({ pg: v })} min={4} max={26} pas={0.05} unite="mm" decimales={2} couleur="#0f172a"/>;
  const curF = <Curseur nom="Vis micrométrique (réglage fin)" valeur={PE.pf} onChange={v => maj({ pf: v })} min={-0.06} max={0.06} pas={0.0002} unite="mm" decimales={4} couleur={COUL.inter}/>;
  const curAB = <Curseur nom="Taille de l’objet AB" valeur={PE.AB} onChange={v => maj({ AB: v })} min={M.AB_MIN} max={M.AB_MAX} pas={5} unite="µm" decimales={0} couleur="#0f172a"/>;
  const boutonAuto = <button onClick={() => maj(pAuto(PE.io))} style={styleBouton(false)}>mise au point automatique</button>;
  const reglagesGuide = (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {(idE === 'G2' || idE === 'refaire') && boutonsObj('io', M.OBJECTIFS, 'f₁')}
      {idE === 'G2' && boutonsObj('ioc', M.OCULAIRES, 'f₂')}
      {['map', 'refaire'].includes(idE) && <>{curG}{curF}{boutonAuto}</>}
      {idE === 'G2' && <FNote>Après chaque changement, le bouton « mise au point automatique » refait le réglage.</FNote>}
      {idE === 'G2' && boutonAuto}
    </div>);
  const reglagesExplore = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {boutonsObj('io', M.OBJECTIFS, 'f₁')}{boutonsObj('ioc', M.OCULAIRES, 'f₂')}
      {curG}{curF}{curAB}
      <div style={{ marginTop: 6 }}>{boutonAuto}</div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 14, color: KIT.txt, cursor: 'pointer' }}><input type="checkbox" checked={cotesOn} onChange={e => setCotesOn(e.target.checked)}/>Afficher les cotes sur le schéma (AB, |OA|, A₁B₁)</label>
    </div>);
  const reglagesDefi = defi && (defi.type === 'map' ? (
    <div style={styleBoite}><div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>{curG}{curF}</div>
  ) : null);

  // ════════════════ SCÈNE ════════════════
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <SchemaMicroscope s={s} f1={f1} f2={f2} AB={PE.AB} cotes={enExplore && cotesOn ? { p, A1B1 } : null} montre={{ inter: !enGuide || depuis('inter'), F2: !enGuide || depuis('map'), statut: !enGuide || depuis('map'), theta: enExplore || (enGuide && depuis('theta2')), noms: true }}/>
    </div>);
  const aEssayer = indicesProfond(
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Faites la mise au point (bouton automatique), puis décalez la vis fine de quelques micromètres : que devient l’image définitive ?</li>
        <li>Changez d’objectif sans toucher à la molette : l’image reste-t-elle au point ? Quelle distance objet–objectif faut-il ?</li>
        <li>Comparez le grossissement pour les neuf couples objectif–oculaire. Lequel est le plus grand ?</li>
        <li>Choisissez un détail de 5 µm : est-il visible à l’œil nu ? Avec quel grossissement minimal devient-il visible ?</li>
        <li>Observez A₁B₁ : est-il renversé ? Est-il plus grand que l’objet ? Quelle est la nature de l’image définitive ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>objectif : image intermédiaire A₁B₁ réelle, renversée, agrandie ; oculaire = loupe</li>
        <li>mise au point : A₁ en F₂, image définitive à l’infini (œil au repos) ; γ₁ = −Δ / f₁′</li>
        <li>G = θ₂ / θ₀ = |γ₁| × d<sub>m</sub> / f₂′ ; changer d’objectif ⇒ refaire la mise au point</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .mi-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .mi-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .mi-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .mi-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); }
        .mi-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .mi-l1.cote .mi-carte { order: 2; } .mi-l1.cote .mi-main { order: 1; } }
        @media (max-width: 900px) { .mi-l1.cote, .mi-pri { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Le microscope</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Comment un microscope rend-il visible un détail invisible à l’œil nu ? Modélisez l’<strong>objectif</strong> et l’<strong>oculaire</strong>, faites la <strong>mise au point</strong> et calculez un <strong>grossissement</strong>.</div>
      <div className={`mi-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {enGuide ? <div className="mi-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="mi-carte">{panneauHypo}</div> : null}
        <div className="mi-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'map' ? suiviM : defi.type === 'inter' ? suiviI : suiviG}/></div>}
          <div className={`mi-pri${mode !== 'explore' ? ' pile' : ''}`}>
            {scene}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {enGuide ? (['map', 'G2', 'refaire'].includes(idE) && reglagesGuide) : enDefi ? reglagesDefi : reglagesExplore}
              {(enExplore || (enGuide && depuis('map'))) && mesures}
            </div>
          </div>
        </div>
      </div>
      {(enExplore || (enGuide && etape >= ETAPES.length - 1)) && <div className="mi-l2">{panneauHypo}</div>}
      {enExplore && <div className="mi-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
