import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useRef } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi, avecIndices, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import { puces, nbf, tire } from "./Travail";
import * as M from "./lunetteModele";
import { SchemaLunette, COUL } from "./LunetteSchema";
import { useHorloge, Commandes, T_BOUCLE } from "./lentilleMinceAnim";
import { StyleAnim } from "./exploAnim";
import { C } from "./oeilLoupeSchema";

const SIM_ID = 120;
declarerDefis(SIM_ID, [['map', 'Faire la mise au point (lunette afocale)'], ['gross', 'Grossissement de la lunette'], ['myope', 'Régler pour un œil myope']]);

// ====================================================
//  SIM 120 — LA LUNETTE ASTRONOMIQUE (TSTL, Ondes : « Des ondes pour observer »)
//  Objectif (f1′ longue) + oculaire (f2′ courte), objet à l'infini de diamètre angulaire θ0.
//  Image intermédiaire A1B1 = f1′ θ0 dans le plan focal image de l'objectif ; lunette afocale : O1O2 = f1′ + f2′, F1′ = F2, image à l'infini.
//  G = θ2/θ0 = f1′/f2′. Œil myope : il faut rapprocher l'oculaire (image virtuelle au punctum remotum). Diffraction et luminosité non modélisées.
// ====================================================
const fm = (x, n = 1) => nbf(x, n);
const FNote = ({ children }) => <div style={{ fontSize: 12.5, color: KIT.txt2, lineHeight: 1.45, marginBottom: 6 }}>{children}</div>;
const cible = (io, ioc, oeil) => (oeil === 'myope' ? M.dMyope(M.OBJECTIFS[io], M.OCULAIRES[ioc]) : M.dAfocal(M.OBJECTIFS[io], M.OCULAIRES[ioc]));
const reglage = (io, ioc, oeil) => { const t = cible(io, ioc, oeil), g = Math.round(t); return { dg: g, df: Number((t - g).toFixed(2)) }; };
const P0 = { io: 1, ioc: 1, ...reglage(1, 1, 'normal'), th: 2, oeil: 'normal' };

const FConj = (<Formule><mfrac><mn>1</mn><mi>OA′</mi></mfrac><mo>−</mo><mfrac><mn>1</mn><mi>OA</mi></mfrac><mo>=</mo><mfrac><mn>1</mn><mi>f′</mi></mfrac></Formule>);
const FG = (<Formule><mi>G</mi><mo>=</mo><mfrac><msub><mi>θ</mi><mn>2</mn></msub><msub><mi>θ</mi><mn>0</mn></msub></mfrac><mo>=</mo><mfrac><msubsup><mi>f</mi><mn>1</mn><mo>′</mo></msubsup><msubsup><mi>f</mi><mn>2</mn><mo>′</mo></msubsup></mfrac></Formule>);

// ---------- schémas des cartes « À retenir » ----------
const svgStyle = { width: '100%', maxWidth: 380, height: 'auto', display: 'block', margin: '6px auto' };
const lentille = (x, y0, c, h = 40) => <g key={x}><line x1={x} y1={y0 - h} x2={x} y2={y0 + h} stroke={c} strokeWidth="3.5"/><polygon points={`${x},${y0 - h - 6} ${x - 5},${y0 - h + 6} ${x + 5},${y0 - h + 6}`} fill={c}/><polygon points={`${x},${y0 + h + 6} ${x - 5},${y0 + h - 6} ${x + 5},${y0 + h - 6}`} fill={c}/></g>;
const T = (x, y, t, c, anchor = 'middle', fs = 11.5) => <text x={x} y={y} textAnchor={anchor} fontSize={fs} fontWeight="800" fill={c}>{t}</text>;
function CarteModeleSVG() {
  const y0 = 80;
  return (
    <svg viewBox="0 0 380 170" role="img" aria-label="Lunette astronomique : des rayons parallèles issus d’un astre très lointain traversent l’objectif de grande distance focale puis l’oculaire de courte distance focale" style={svgStyle}>
      <line x1="6" y1={y0} x2="374" y2={y0} stroke="#94a3b8" strokeDasharray="7 4"/>
      {lentille(110, y0, C.lent, 50)}{lentille(300, y0, C.lent, 30)}
      <line x1="6" y1={y0 - 40} x2="110" y2={y0 - 28} stroke={COUL.rayon1} strokeWidth="2"/><line x1="6" y1={y0 - 10} x2="110" y2={y0 - 0} stroke={COUL.rayon2} strokeWidth="2"/>
      <line x1="110" y1={y0 - 28} x2="250" y2={y0 + 30} stroke={COUL.rayon1} strokeWidth="2"/><line x1="110" y1={y0} x2="250" y2={y0 + 30} stroke={COUL.rayon2} strokeWidth="2"/>
      <line x1="250" y1={y0 + 30} x2="300" y2={y0 + 25} stroke={COUL.rayon1} strokeWidth="2"/>
      {T(110, 14, 'objectif', C.lent)}{T(300, 24, 'oculaire', C.lent)}{T(52, y0 - 48, 'astre à l’infini', COUL.obj)}
      {T(190, 150, 'objectif : grande focale f₁′ · oculaire : petite focale f₂′', COUL.theta)}
    </svg>);
}
function CarteInterSVG() {
  const y0 = 82, xo = 120, xf = 250;
  return (
    <svg viewBox="0 0 380 170" role="img" aria-label="L’objectif donne d’un objet à l’infini une image intermédiaire A1B1 dans son plan focal image, réelle et renversée, de taille f1′ fois θ0" style={svgStyle}>
      <line x1="6" y1={y0} x2="374" y2={y0} stroke="#94a3b8" strokeDasharray="7 4"/>
      {lentille(xo, y0, C.lent, 50)}
      <line x1="6" y1={y0 - 24} x2={xo} y2={y0 - 8} stroke={COUL.rayon1} strokeWidth="2"/><line x1="6" y1={y0 - 40} x2={xo} y2={y0 - 24} stroke={COUL.rayon2} strokeWidth="2" opacity="0"/>
      <line x1="6" y1={y0 - 8} x2={xo} y2={y0 + 6} stroke={COUL.rayon2} strokeWidth="2" opacity="0"/>
      <line x1="6" y1={y0 - 56} x2={xo} y2={y0 - 40} stroke={COUL.rayon2} strokeWidth="2"/>
      <line x1={xo} y1={y0 - 40} x2={xf} y2={y0 + 27} stroke={COUL.rayon2} strokeWidth="2"/><line x1={xo} y1={y0 - 8} x2={xf} y2={y0 + 27} stroke={COUL.rayon1} strokeWidth="2" opacity="0"/>
      <line x1={xo} y1={y0} x2={xf} y2={y0 + 27} stroke={COUL.rayon1} strokeWidth="2"/>
      <line x1={xf} y1={y0} x2={xf} y2={y0 + 22} stroke={COUL.inter} strokeWidth="3.5"/><polygon points={`${xf},${y0 + 30} ${xf - 5},${y0 + 20} ${xf + 5},${y0 + 20}`} fill={COUL.inter}/>
      <circle cx={xf} cy={y0} r="4" fill="#fff" stroke={C.foyer} strokeWidth="2"/>
      {T(xo, 14, 'objectif', C.lent)}{T(xf, y0 - 12, 'F₁′', C.foyer)}{T(xf + 8, y0 + 46, 'A₁B₁', COUL.inter, 'start')}
      {T(xo + 40, y0 + 62, 'f₁′', COUL.theta)}
      <line x1={xo} y1={y0 + 70} x2={xf} y2={y0 + 70} stroke={COUL.theta} strokeWidth="1.5"/>
      {T(190, 150, 'A₁B₁ = f₁′ × θ₀ (dans le plan focal image)', COUL.theta)}
    </svg>);
}
function CarteAfocalSVG() {
  const y0 = 78, x1 = 40, xF = 210, x2 = 270;
  return (
    <svg viewBox="0 0 380 170" role="img" aria-label="Lunette afocale : le foyer image F1′ de l’objectif et le foyer objet F2 de l’oculaire sont confondus ; la distance O1O2 vaut f1′ plus f2′ ; l’image définitive est à l’infini" style={svgStyle}>
      <line x1="6" y1={y0} x2="374" y2={y0} stroke="#94a3b8" strokeDasharray="7 4"/>
      {lentille(x1, y0, C.lent, 44)}{lentille(x2, y0, C.lent, 44)}
      <circle cx={xF} cy={y0} r="5" fill="#fff" stroke={C.foyer} strokeWidth="2.2"/><circle cx={xF} cy={y0} r="2" fill={C.foyer}/>
      {T(xF, y0 - 12, 'F₁′ = F₂', C.foyer)}{T(x1, 14, 'objectif', C.lent)}{T(x2, 14, 'oculaire', C.lent)}
      <line x1={x1} y1={y0 + 56} x2={xF} y2={y0 + 56} stroke={COUL.theta} strokeWidth="1.6"/><line x1={xF} y1={y0 + 56} x2={x2} y2={y0 + 56} stroke="#15803d" strokeWidth="1.6"/>
      {T((x1 + xF) / 2, y0 + 72, 'f₁′', COUL.theta)}{T((xF + x2) / 2, y0 + 72, 'f₂′', '#15803d')}
      {T(190, 120, 'O₁O₂ = f₁′ + f₂′', COUL.theta, 'middle', 12.5)}
      {T(190, 156, 'objet à l’infini ⇒ image à l’infini : « afocale »', C.img)}
    </svg>);
}
function CarteGrossSVG() {
  return (
    <svg viewBox="0 0 380 150" role="img" aria-label="Le grossissement de la lunette est le rapport des distances focales de l’objectif et de l’oculaire : par exemple 900 millimètres divisés par 30 millimètres donnent 30" style={svgStyle}>
      <rect x="6" y="20" width="110" height="56" rx="9" fill="#fff" stroke={C.lent} strokeWidth="2"/>{T(61, 44, 'objectif', C.lent)}{T(61, 64, 'f₁′ = 900 mm', C.txt, 'middle', 11)}
      {T(138, 56, '÷', '#475569', 'middle', 22)}
      <rect x="156" y="20" width="110" height="56" rx="9" fill="#fff" stroke={C.lent} strokeWidth="2"/>{T(211, 44, 'oculaire', C.lent)}{T(211, 64, 'f₂′ = 30 mm', C.txt, 'middle', 11)}
      {T(284, 56, '=', '#475569', 'middle', 22)}
      <rect x="298" y="20" width="76" height="56" rx="9" fill="#fff" stroke={C.img} strokeWidth="2"/>{T(336, 44, 'G', C.img)}{T(336, 64, '30', C.txt, 'middle', 13)}
      {T(190, 112, 'G = θ₂ / θ₀ = f₁′ / f₂′', COUL.theta, 'middle', 12.5)}
      {T(190, 134, 'objectif long, oculaire court : grand G', '#64748b', 'middle', 11)}
    </svg>);
}
function CarteOculaireSVG() {
  const col = (x, titre, f2, g, c) => (
    <g key={x}><rect x={x} y="8" width="178" height="112" rx="9" fill="#fff" stroke={c} strokeWidth="2"/>
      {T(x + 89, 28, titre, c)}{T(x + 89, 50, `f₂′ = ${f2} mm`, C.txt, 'middle', 12)}{T(x + 89, 74, `G = 800 / ${f2} = ${g}`, COUL.theta, 'middle', 13)}
      {T(x + 89, 98, f2 === 20 ? 'plus de champ, plus de lumière' : 'moins de champ, moins de lumière', '#64748b', 'middle', 10.5)}</g>);
  return (
    <svg viewBox="0 0 380 170" role="img" aria-label="Changer d’oculaire : une distance focale plus courte donne un plus grand grossissement mais un champ plus étroit et une image moins lumineuse ; il faut refaire la mise au point" style={svgStyle}>
      {col(8, 'oculaire long', 20, 40, C.lent)}{col(194, 'oculaire court', 10, 80, C.img)}
      {T(190, 146, 'on change d’oculaire ⇒ on refait la mise au point', COUL.theta)}
      {T(190, 163, 'O₁O₂ = f₁′ + f₂′ change', '#64748b', 'middle', 10.5)}
    </svg>);
}
function CarteBilanSVG() {
  const b = (x, w, t1, t2, c) => <g key={x}><rect x={x} y="12" width={w} height="52" rx="9" fill="#fff" stroke={c} strokeWidth="2"/>{T(x + w / 2, 34, t1, c, 'middle', 11)}{T(x + w / 2, 52, t2, C.txt, 'middle', 10)}</g>;
  return (
    <svg viewBox="0 0 380 150" role="img" aria-label="Bilan : l’objectif donne l’image intermédiaire dans son plan focal image, l’oculaire la regarde comme une loupe, lunette afocale quand F1′ est en F2, grossissement f1′ sur f2′" style={svgStyle}>
      {b(4, 88, 'objectif', 'A₁B₁ en F₁′', C.lent)}{b(98, 88, 'afocale', 'F₁′ = F₂', COUL.inter)}{b(192, 88, 'oculaire', 'loupe', C.lent)}{b(286, 90, 'A₂B₂', 'à l’infini', C.img)}
      {T(190, 100, 'O₁O₂ = f₁′ + f₂′      G = f₁′ / f₂′', COUL.theta, 'middle', 12.5)}
      {T(190, 126, 'œil myope : on rapproche l’oculaire', '#64748b', 'middle', 11)}
    </svg>);
}
const FICHES = {
  modele: <><CarteModeleSVG/>
    {puces(<>Un astre est <strong>très loin</strong> : les rayons issus d’un même point de l’astre arrivent <strong>parallèles</strong> sur la lunette (objet « à l’infini »).</>,
      <>L’<strong>objectif</strong> (lentille de grande distance focale) et l’<strong>oculaire</strong> (petite distance focale) sont deux lentilles convergentes.</>,
      <><strong>Mémo</strong> : « objectif = grande focale ; oculaire = petite focale ».</>)}</>,
  inter: <><CarteInterSVG/>
    {puces(<>Objet à l’infini : l’objectif en donne une image <strong>dans son plan focal image</strong> (en F₁′, pour le point de l’axe). C’est l’<strong>image intermédiaire</strong> A₁B₁.</>,
      <>A₁B₁ est <strong>réelle et renversée</strong>, et A₁B₁ = f₁′ × θ₀ (petits angles, θ₀ en rad).</>,
      <><strong>Exemple</strong> : f₁′ = 500{NB}mm et θ₀ = 3,0{NB}mrad donnent A₁B₁ = 1,5{NB}mm.</>)}</>,
  afocal: <><CarteAfocalSVG/>
    {puces(<>Pour observer sans fatigue, l’image définitive doit être <strong>à l’infini</strong> : l’image intermédiaire doit être dans le plan focal objet de l’oculaire.</>,
      <>Donc <strong>F₁′ et F₂ sont confondus</strong> : O₁O₂ = f₁′ + f₂′. La lunette est dite <strong>afocale</strong>.</>,
      <><strong>Exemple</strong> : f₁′ = 800{NB}mm et f₂′ = 20{NB}mm donnent O₁O₂ = 820{NB}mm.</>)}</>,
  gross: <><CarteGrossSVG/>{FG}
    {puces(<>G compare l’angle θ₂ sous lequel on voit l’image définitive à l’angle θ₀ sous lequel on voit l’astre à l’œil nu.</>,
      <>θ₀ = A₁B₁ / f₁′ et θ₂ = A₁B₁ / f₂′ : on en déduit <strong>G = f₁{avecIndices('frac(′|f)')}₂′</strong>.</>,
      <><strong>Exemple</strong> : {avecIndices('frac(900|30)')} = 30. Pour augmenter G : oculaire de focale <strong>plus courte</strong>.</>)}</>,
  oculaire: <><CarteOculaireSVG/>
    {puces(<>Changer d’oculaire change f₂′ : il faut <strong>refaire la mise au point</strong>, car O₁O₂ = f₁′ + f₂′ n’est plus la bonne valeur.</>,
      <>Avantage d’un oculaire plus court : G plus grand. Inconvénients : image <strong>moins lumineuse</strong> et <strong>champ plus étroit</strong>.</>,
      <><strong>Mémo</strong> : « plus de grossissement = moins de champ et moins de lumière ».</>)}</>,
  bilan: <><CarteBilanSVG/>
    {puces(<>Objectif : image intermédiaire A₁B₁ dans le plan focal image, réelle et renversée ; oculaire : loupe.</>,
      <>Lunette afocale : F₁′ = F₂, O₁O₂ = f₁′ + f₂′ ; image définitive à l’infini ; G = f₁{avecIndices('frac(′|f)')}₂′.</>,
      <>Un œil myope voit net une image plus proche : on rapproche l’oculaire de l’objectif.</>)}</>,
};

// ====================================================
//  COMPOSANT
// ====================================================
// exploration animée : photons le long des deux rayons (impact en un point de la rétine si l'image est nette), oculaire saisissable
function SceneAnimee({ schema, vmin, vmax, setD }) {
  const L = useHorloge(T_BOUCLE, true), [touche, setTouche] = useState(false), ref = useRef(null);
  return (
    <div><StyleAnim/>
      <SchemaLunette {...schema} lum={{ t: L.t, mode: 'boucle' }} refSvg={ref} poignee={{ vmin, vmax, touche, onToucher: () => setTouche(true), set: v => setD(Math.round(Math.max(vmin, Math.min(vmax, v)))) }}/>
      <div style={{ fontSize: 13, color: KIT.txt2, margin: '8px 0 2px', lineHeight: 1.45 }}>Saisissez l’<strong>oculaire</strong> (le rond <strong>↔</strong> sous la lentille de droite) et faites-le glisser : les photons arrivent au même point de la rétine quand l’image est nette.</div>
      <Commandes L={L}/>
    </div>);
}

export function SimulationLunette() {
  const [mode, setMode] = useState(() => modeOuverture('lunette-guide-v1'));
  useSignalerMode(mode);
  const [suiviM, noterM] = useCompteurDefi(), [suiviG, noterG] = useCompteurDefi(), [suiviY, noterY] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('lunette-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('map');
  const [hypoOuv, setHypoOuv] = useState(false), [cotesOn, setCotesOn] = useState(true);
  const [P, setP] = useState({ ...P0, dg: P0.dg + 8, df: 0 });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const PE = enDefi && defi ? defi.p : P;
  const f1 = M.OBJECTIFS[PE.io], f2 = M.OCULAIRES[PE.ioc], d = PE.dg + PE.df, th = PE.th;
  const afo = M.afocale(d, f1, f2), nette = M.net(d, f1, f2, PE.oeil);
  const A1B1 = M.tailleA1B1(f1, th), th2 = M.theta2(A1B1, f2);

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const dep = patch => () => setP(x => ({ ...x, ...patch }));
  const ETAPES = [
    { id: 'modele', titre: 'Un astre est très loin', focus: ['scene'], depart: dep({ io: 1, ioc: 1, th: 2, oeil: 'normal', dg: 828, df: 0 }),
      retenirTitre: 'À RETENIR : LE MODÈLE DE LA LUNETTE', retenir: FICHES.modele,
      texte: <>Une lunette astronomique sert à observer des objets <strong>très grands et très lointains</strong>. Elle se modélise par deux lentilles convergentes : l’<strong>objectif</strong> (grande distance focale) et l’<strong>oculaire</strong> (petite distance focale). Le schéma n’est pas à l’échelle (angles et focales modifiés). Suivez les rayons bleu et orange qui viennent de la gauche.</>,
      tache: { type: 'qcm', q: 'Pourquoi les rayons issus d’un même point d’un astre arrivent-ils parallèles entre eux sur la lunette ?', options: ['parce que l’astre est très loin, on le modélise par un objet à l’infini', 'parce que l’objectif les rend parallèles', 'parce que l’oculaire est une loupe', 'parce que la lunette est afocale'], bonne: 0,
        indice: 'Pensez à la lumière du Soleil : les rayons qui nous arrivent d’un même point du Soleil sont-ils très écartés ?', expl: 'L’astre est tellement éloigné que le faisceau issu d’un point de l’astre qui arrive sur l’objectif est, à l’échelle de la lunette, un faisceau de rayons parallèles : on parle d’objet à l’infini.' } },
    { id: 'inter', titre: 'L’image intermédiaire', focus: ['scene'], depart: null,
      retenirTitre: 'À RETENIR : L’IMAGE INTERMÉDIAIRE', retenir: FICHES.inter,
      texte: <>L’objectif fait converger les rayons parallèles issus de B₀ en un point B₁ : l’ensemble des points forme l’<strong>image intermédiaire</strong> A₁B₁ (en marron). Regardez où elle se forme par rapport au point F₁′, foyer image de l’objectif.</>,
      tache: { type: 'qcm', q: 'Où l’objectif forme-t-il l’image d’un objet à l’infini ?', options: ['dans son plan focal image (en F₁′ pour le point de l’axe)', 'à une distance 2f₁′ derrière lui', 'collée à l’objectif', 'à l’infini'], bonne: 0,
        indice: 'Un faisceau parallèle à l’axe converge en un point particulier de la lentille. Lequel ?', expl: 'Un faisceau de rayons parallèles converge dans le plan focal image de la lentille : l’image intermédiaire se forme dans le plan focal image de l’objectif.' } },
    { id: 'map', titre: 'La mise au point', focus: ['scene', 'reglages'], depart: dep({ io: 1, ioc: 1, dg: 828, df: 0, oeil: 'normal' }),
      texte: <>L’œil observe sans effort une image <strong>à l’infini</strong> : les rayons doivent sortir <strong>parallèles</strong> de l’oculaire. Vous réglez la <strong>distance entre l’objectif et l’oculaire</strong> avec le tirage (réglage grossier, puis vis fine). Faites la mise au point jusqu’à ce que le schéma indique « lunette afocale ». Le bouton « mise au point automatique » est là en secours.</>,
      tache: { type: 'action', ok: enGuide && M.afocale(d, f1, f2), consigne: 'Réglez la distance O₁O₂ pour que les rayons sortent parallèles de l’oculaire.' } },
    { id: 'map-q', titre: 'Où est l’image intermédiaire ?', focus: ['scene'], depart: null,
      retenirTitre: 'À RETENIR : LA LUNETTE AFOCALE', retenir: FICHES.afocal,
      texte: <>La lunette est mise au point : les rayons sortent parallèles et l’œil voit l’image <strong>sans accommoder</strong>. Regardez la position de F₁′ (foyer image de l’objectif) et de F₂ (foyer objet de l’oculaire).</>,
      tache: { type: 'qcm', q: 'Que peut-on dire des foyers F₁′ et F₂ quand la lunette est afocale ?', options: ['ils sont confondus', 'ils sont distants de f₁′ + f₂′', 'F₂ est placé au centre optique de l’objectif', 'F₁′ est à l’infini'], bonne: 0,
        indice: 'L’image intermédiaire est dans le plan focal image de l’objectif ET dans le plan focal objet de l’oculaire.', expl: 'L’image intermédiaire est à la fois dans le plan focal image de l’objectif et dans le plan focal objet de l’oculaire : F₁′ et F₂ sont confondus.' } },
    { id: 'dist', titre: 'La distance entre les lentilles', focus: ['mesures'], depart: null,
      texte: <>Une autre lunette a un objectif de distance focale <em>f₁′</em> = 1000{NB}mm et un oculaire de <em>f₂′</em> = 25{NB}mm. Quelle distance O₁O₂ faut-il entre les deux lentilles pour qu’elle soit afocale ? (F₁′ et F₂ confondus)</>,
      tache: { type: 'num', q: 'Distance O₁O₂ de la lunette afocale', unite: 'mm', vrai: 1025, tol: 0.005, affiche: v => fm(v, 0), carnet: 'Distance O₁O₂ (lunette afocale)',
        calcul: () => ['F₁′ = F₂ : O₁O₂ = O₁F₁′ + F₂O₂ = f₁′ + f₂′.', 'O₁O₂ = 1000 + 25 = 1025 mm.'],
        pieges: [[975, 'Vous avez soustrait : F₁′ est entre O₁ et O₂ ; la distance O₁O₂ est la somme f₁′ + f₂′.'], [1000, 'Vous avez oublié f₂′ : O₁O₂ = f₁′ + f₂′.']],
        expl: 'O₁O₂ = f₁′ + f₂′ = 1025 mm.', indice: 'O₁O₂ = O₁F₁′ + F₂O₂ avec F₁′ = F₂.' } },
    { id: 'a1b1', titre: 'Taille de l’image intermédiaire', focus: ['mesures'], depart: dep({ io: 1, ioc: 1, th: 2, oeil: 'normal', ...reglage(1, 1, 'normal') }),
      texte: <>Retour à la lunette de départ : <em>f₁′</em> = 800{NB}mm et <em>f₂′</em> = 20{NB}mm. L’objet observé a un diamètre angulaire <strong>θ₀ = 2,0{NB}mrad</strong> (soit 0,0020{NB}rad). Avec les petits angles, A₁B₁ = f₁′ × θ₀. Calculez la taille de l’image intermédiaire, en mm.</>,
      tache: { type: 'num', q: 'Taille de A₁B₁', unite: 'mm', vrai: 1.6, tol: 0.03, affiche: v => fm(v, 2), carnet: 'Taille de l’image intermédiaire A₁B₁',
        calcul: () => ['θ₀ = 2,0 mrad = 0,0020 rad.', 'A₁B₁ = f₁′ × θ₀ = 800 × 0,0020 = 1,6 mm.'], pieges: [[1600, 'Vous avez oublié de convertir θ₀ de mrad en rad : 2,0 mrad = 0,0020 rad.'], [0.0020 / 800, 'Vous avez divisé : A₁B₁ = f₁′ × θ₀.']],
        expl: 'A₁B₁ = 800 × 0,0020 = 1,6 mm.', indice: 'A₁B₁ = f₁′ × θ₀, θ₀ en radian (1 mrad = 0,001 rad).' } },
    { id: 'theta2', titre: 'L’angle sous lequel on voit l’image', focus: ['mesures'], depart: null,
      texte: <>L’oculaire est une loupe dont l’objet A₁B₁ est dans le plan focal : l’œil voit l’image définitive sous l’angle <strong>θ₂ ≈ {avecIndices('frac(A₁B₁|f₂′)')}</strong>. Avec A₁B₁ = 1,6{NB}mm et <em>f₂′</em> = 20{NB}mm, calculez θ₂ en <strong>mrad</strong>.</>,
      tache: { type: 'num', q: 'Diamètre apparent θ₂ de l’image définitive', unite: 'mrad', vrai: 80, tol: 0.03, affiche: v => fm(v, 0), carnet: 'Diamètre apparent θ₂ (avec la lunette)',
        calcul: () => ['θ₂ ≈ frac(A₁B₁|f₂′) = frac(1,6|20) = 0,080 rad (A₁B₁ et f₂′ en mm).', '0,080 rad = 80 mrad.'], pieges: [[0.08, 'Valeur correcte en radian ; l’énoncé demande des mrad (× 1000).'], [1.6 / 800 * 1000, 'Vous avez divisé par f₁′ : c’est θ₀. Avec l’oculaire, on divise par f₂′.']],
        expl: 'θ₂ ≈ 80 mrad : 40 fois plus que θ₀ = 2,0 mrad.', indice: 'θ₂ ≈ frac(A₁B₁|f₂′), les deux en mm ; 1 rad = 1000 mrad.' } },
    { id: 'G', titre: 'Le grossissement', focus: ['mesures'], depart: null,
      retenirTitre: 'À RETENIR : LE GROSSISSEMENT', retenir: FICHES.gross,
      texte: <>Le <strong>grossissement</strong> de la lunette est G = {avecIndices('frac(θ₂|θ₀)')}. Vous avez θ₂ = 80{NB}mrad et θ₀ = 2,0{NB}mrad. Calculez G (sans unité).</>,
      tache: { type: 'num', q: 'Grossissement G de la lunette', unite: '', vrai: 40, tol: 0.03, affiche: v => fm(v, 0), carnet: 'Grossissement G de la lunette',
        calcul: () => ['G = frac(θ₂|θ₀) = frac(80|2,0) = 40.', 'Autre expression : G = frac(f₁′|f₂′) = frac(800|20) = 40.'], pieges: [[1 / 40, 'Vous avez calculé frac(θ₀|θ₂) : G = frac(θ₂|θ₀).']],
        expl: 'G = 40 = frac(f₁′|f₂′) : l’image définitive est vue sous un angle 40 fois plus grand que l’objet à l’œil nu.', indice: 'G = frac(θ₂|θ₀), avec les deux angles en mrad.' } },
    { id: 'Gq', titre: 'Agir sur le grossissement', focus: [], depart: null,
      texte: <>La relation <strong>G = {avecIndices('frac(f₁′|f₂′)')}</strong> montre comment agir sur le grossissement d’une lunette.</>,
      tache: { type: 'qcm', q: 'Quel choix donne le plus grand grossissement ?', options: ['un objectif de grande focale et un oculaire de petite focale', 'un objectif de petite focale et un oculaire de grande focale', 'deux lentilles de même focale', 'un objectif de petit diamètre'], bonne: 0,
        indice: 'G = frac(f₁′|f₂′) est grand quand le numérateur est grand et le dénominateur petit.', expl: 'G = frac(f₁′|f₂′) : on gagne en grossissement avec un objectif de grande focale et un oculaire de petite focale. Deux lentilles de même focale donnent G = 1.' } },
    { id: 'oculaire', titre: 'On change d’oculaire', focus: ['scene', 'reglages'], depart: dep({ io: 1, ioc: 0, dg: 820, df: 0, oeil: 'normal' }),
      texte: <>On remplace l’oculaire par un autre de distance focale <em>f₂′</em> = 10{NB}mm, sans toucher au tirage : le schéma montre que l’image n’est plus au point. Refaites la mise au point.</>,
      tache: { type: 'action', ok: enGuide && PE.ioc === 0 && M.afocale(d, f1, f2), consigne: 'Refaites la mise au point avec le nouvel oculaire.' } },
    { id: 'oculaire-q', titre: 'Intérêt et limites', focus: [], depart: null,
      retenirTitre: 'À RETENIR : CHANGER D’OCULAIRE', retenir: FICHES.oculaire,
      texte: <>Avec l’oculaire de 10{NB}mm, le grossissement devient G = {avecIndices('frac(800|10)')} = 80 : il double. Vous avez dû modifier O₁O₂ (810{NB}mm au lieu de 820{NB}mm).</>,
      tache: { type: 'qcm', q: 'Quel est l’inconvénient d’un oculaire de plus courte focale ?', options: ['l’image est moins lumineuse et le champ de vision plus étroit', 'l’image est renversée', 'le grossissement diminue', 'l’image n’est plus à l’infini'], bonne: 0,
        indice: 'On agrandit l’image : la même énergie lumineuse est répartie sur une image plus grande, et on ne voit qu’une petite partie du ciel.', expl: 'Un plus grand grossissement s’accompagne d’une baisse de luminosité de l’image et d’une réduction du champ (portion du ciel visible).' } },
    { id: 'myope-q', titre: 'Un observateur myope', focus: ['scene'], depart: dep({ io: 1, ioc: 1, oeil: 'myope', ...reglage(1, 1, 'normal') }),
      texte: <>Un observateur myope, sans ses lunettes, ne voit net que jusqu’à <strong>40{NB}cm</strong> (son punctum remotum). Il regarde dans la lunette afocale : le schéma indique que l’image est floue pour lui, car un faisceau parallèle n’est pas net pour son œil.</>,
      tache: { type: 'qcm', q: 'Pour que cet observateur voie net, comment faut-il régler la lunette par rapport au réglage afocal ?', options: ['rapprocher l’oculaire de l’objectif : l’image définitive devient virtuelle, à 40 cm', 'éloigner l’oculaire de l’objectif', 'changer d’objectif pour un plus court', 'ne rien changer, le myope doit accommoder'], bonne: 0,
        indice: 'Un œil myope voit net un objet proche : il faut que les rayons sortent légèrement divergents, comme s’ils venaient d’un objet à 40 cm.', expl: 'Pour obtenir une image virtuelle à distance finie (40 cm), A₁ doit se trouver entre F₂ et l’oculaire : on rapproche l’oculaire de l’objectif, c’est-à-dire qu’on diminue O₁O₂.' } },
    { id: 'myope', titre: 'Régler pour l’œil myope', focus: ['scene', 'reglages'], depart: null,
      texte: <>Réglez la distance O₁O₂ pour que l’image définitive soit <strong>nette pour l’œil myope</strong> : le schéma doit indiquer « image nette pour cet œil » sans que la lunette soit afocale. Le bouton automatique règle aussi pour cet œil.</>,
      tache: { type: 'action', ok: enGuide && PE.oeil === 'myope' && nette && !afo, consigne: 'Réglez la lunette pour l’œil myope.' } },
    { id: 'bravo', titre: 'Bravo ! Le bilan', focus: [], depart: null,
      retenirTitre: 'À RETENIR : LE BILAN', retenir: FICHES.bilan,
      texte: <>Vous savez décrire une lunette astronomique : image intermédiaire dans le plan focal image, lunette afocale (O₁O₂ = f₁′ + f₂′), grossissement G = {avecIndices('frac(f₁′|f₂′)')}, et adapter le réglage à un œil myope. Essayez l’exploration, puis les défis.</>, tache: null },
  ];
  const etape = Math.min(guide.etape, ETAPES.length - 1);
  const IDS = ETAPES.map(e => e.id), idE = ETAPES[etape].id;
  const depuis = id => !enGuide || etape >= IDS.indexOf(id);
  const hl = id => enGuide && ETAPES[etape].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  useEffect(() => {
    if (mode !== 'guide') return;
    const dd = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (dd) dd();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ DÉFIS ════════════════
  const decale = (io, ioc, oeil) => { const t = cible(io, ioc, oeil), dx = tire([-1, 1]) * tire([4, 7, 11, 15]); return { dg: Math.round(t + dx), df: 0 }; };
  const tirages = {
    map: () => { const io = tire([0, 1, 2]), ioc = tire([0, 1, 2]); return { type: 'map', p: { io, ioc, ...decale(io, ioc, 'normal'), th: 2, oeil: 'normal' }, reps: {}, verifie: false }; },
    gross: () => { const io = tire([0, 1, 2]), ioc = tire([0, 1, 2]); return { type: 'gross', p: { io, ioc, ...reglage(io, ioc, 'normal'), th: 2, oeil: 'normal' }, f1: M.OBJECTIFS[io], f2: M.OCULAIRES[ioc], reps: {}, verifie: false }; },
    myope: () => { const io = tire([0, 1, 2]), ioc = tire([0, 1, 2]); return { type: 'myope', p: { io, ioc, ...reglage(io, ioc, 'normal'), th: 2, oeil: 'myope' }, reps: {}, verifie: false }; },
  };
  const nouveauDefi = t => setDefi(tirages[t]());
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const majDefi = patch => setDefi(x => ({ ...x, p: { ...x.p, ...patch }, verifie: false }));
  const verifierDefi = () => {
    let ok, vrai;
    if (defi.type === 'map') ok = M.afocale(defi.p.dg + defi.p.df, M.OBJECTIFS[defi.p.io], M.OCULAIRES[defi.p.ioc]);
    else if (defi.type === 'myope') ok = M.net(defi.p.dg + defi.p.df, M.OBJECTIFS[defi.p.io], M.OCULAIRES[defi.p.ioc], 'myope') && !M.afocale(defi.p.dg + defi.p.df, M.OBJECTIFS[defi.p.io], M.OCULAIRES[defi.p.ioc]);
    else { const x = lireNombre(defi.reps.r); vrai = M.grossissement(defi.f1, defi.f2); ok = isFinite(x) && proche(x, vrai, 0.06); }
    setDefi(x => ({ ...x, verifie: true, ok, vrai }));
    ({ map: noterM, gross: noterG, myope: noterY })[defi.type](ok);
  };
  const champ = (unite, label) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps.r ?? ''} aria-label={label} inputMode="decimal" onKeyDown={e => e.key === 'Enter' && document.getElementById('lu-verif')?.click()}
        onChange={e => setDefi(x => ({ ...x, reps: { r: e.target.value }, verifie: false }))}
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['map', 'Mise au point'], ['gross', 'Grossissement'], ['myope', 'Œil myope']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'map' ? 'Défi : rendez la lunette afocale' : defi.type === 'gross' ? 'Défi : quel est le grossissement de cette lunette ?' : 'Défi : réglez la lunette pour un œil myope'}</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>
        {defi.type === 'map' && <>La lunette a pour objectif <em>f₁′</em> = {fm(M.OBJECTIFS[defi.p.io], 0)}{NB}mm et pour oculaire <em>f₂′</em> = {fm(M.OCULAIRES[defi.p.ioc], 0)}{NB}mm. Réglez le tirage (grossier puis fin) pour que l’image définitive soit à l’infini, puis cliquez sur « Vérifier » (le bouton automatique est désactivé).</>}
        {defi.type === 'gross' && <>Une lunette a pour objectif <em>f₁′</em> = {fm(defi.f1, 0)}{NB}mm et pour oculaire <em>f₂′</em> = {fm(defi.f2, 0)}{NB}mm ; elle est mise au point (afocale). Calculez son grossissement G, avec 2 chiffres significatifs.</>}
        {defi.type === 'myope' && <>Un observateur myope ne voit net que jusqu’à 40{NB}cm. La lunette (<em>f₁′</em> = {fm(M.OBJECTIFS[defi.p.io], 0)}{NB}mm, <em>f₂′</em> = {fm(M.OCULAIRES[defi.p.ioc], 0)}{NB}mm) est afocale. Réglez le tirage pour que l’image soit nette pour lui, puis cliquez sur « Vérifier ».</>}
      </div>
      {defi.type === 'gross' && champ('', 'Grossissement G')}
      {defi.type === 'map' && <IndiceDefi cache={false}>La lunette est afocale quand F₁′ et F₂ sont confondus : O₁O₂ = <em>f₁′</em> + <em>f₂′</em>. Réglez d’abord le tirage grossier près de cette valeur, puis affinez.</IndiceDefi>}
      {defi.type === 'gross' && <IndiceDefi cache={false}>G = θ₂ / θ₀ = <em>f₁′</em> / <em>f₂′</em>, avec les deux focales dans la même unité.</IndiceDefi>}
      {defi.type === 'myope' && <IndiceDefi cache={false}>Il faut une image virtuelle à 40 cm : rapprochez l’oculaire de l’objectif par rapport au réglage afocale. Comptez d’abord quelques dixièmes de millimètre.</IndiceDefi>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="lu-verif" onClick={verifierDefi} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {avecIndices(defi.ok ? (defi.type === 'map' ? '✓ Lunette afocale : l’image définitive est à l’infini.' : defi.type === 'myope' ? '✓ Image nette pour l’œil myope : l’oculaire est rapproché de l’objectif.' : `✓ Correct. G = ${fm(defi.vrai, 0)}.`)
          : defi.type === 'map' ? '✗ La lunette n’est pas afocale : F₁′ et F₂ ne sont pas confondus. Affinez le tirage.'
            : defi.type === 'myope' ? '✗ L’image n’est pas nette pour cet œil : l’image doit être virtuelle, à 40 cm de l’oculaire.' : '✗ Vérifiez : G = f₁′ / f₂′ avec les deux focales dans la même unité.')}
      </div>}
    </div>);

  // ════════════════ HYPOTHÈSES, MESURES, RÉGLAGES ════════════════
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Objectif et oculaire</strong> : deux lentilles minces convergentes (approximation de Gauss, lumière monochromatique). Les vrais objectifs et oculaires sont des associations de lentilles.</li>
      <li><strong>Objet à l’infini</strong> : un astre, de diamètre angulaire θ₀ (petits angles : θ ≈ tan θ). Son image intermédiaire se forme dans le plan focal image de l’objectif, avec A₁B₁ = f₁′ θ₀.</li>
      <li><strong>Lunette afocale</strong> : O₁O₂ = f₁′ + f₂′. Le faisceau sortant est jugé quasi parallèle si sa vergence est inférieure à 1 δ (soit un écart de l’ordre de f₂′²/1000 sur O₁O₂ : 0,4 mm pour f₂′ = 20 mm).</li>
      <li><strong>Œil myope</strong> : on suppose qu’il voit net, au repos, une image à 40 cm (punctum remotum) ; même tolérance de 1 δ. Un œil normal voit net à l’infini au repos.</li>
      <li><strong>Limites non modélisées</strong> : la diffraction (qui limite la résolution selon le diamètre de l’objectif), la luminosité de l’image et le champ de vision. Le grossissement n’est donc pas le seul critère de qualité d’une lunette.</li>
      <li><strong>Dessin</strong> : non à l’échelle (focales compressées, angles et image intermédiaire agrandis), mais les rayons sont tracés à travers deux lentilles minces ; l’écart au réglage afocal suit la valeur du modèle.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const nat = M.natureA2(d, f1, f2), A2 = M.posA2(d, f1, f2), G = M.grossissement(f1, f2);
  const mesures = (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      <LigneMesure nom="Objectif f₁′" valeur={`${fm(f1, 0)}${NB}mm`} couleur={C.lent}/>
      <LigneMesure nom="Oculaire f₂′" valeur={`${fm(f2, 0)}${NB}mm`} couleur={C.lent}/>
      {(enExplore || depuis('a1b1')) && <LigneMesure nom="Distance O₁O₂ entre les lentilles" valeur={`${fm(d, 2)}${NB}mm`} couleur="#64748b"/>}
      {(enExplore || depuis('a1b1')) && <LigneMesure nom="Diamètre apparent θ₀ de l’objet" valeur={`${fm(th, 1)}${NB}mrad`} couleur={COUL.obj}/>}
      {(enExplore || depuis('theta2')) && <LigneMesure nom="Image intermédiaire A₁B₁ = f₁′ θ₀" valeur={`${fm(A1B1, 2)}${NB}mm`} couleur={COUL.inter}/>}
      {(enExplore || depuis('map')) && <LigneMesure nom="Image définitive A₂B₂" valeur={afo ? 'à l’infini (afocale)' : nat === 'virtuelle' ? `virtuelle, à ${fm(Math.abs(A2), 0)}${NB}mm de l’oculaire` : nat === 'reelle' ? `réelle, à ${fm(A2, 0)}${NB}mm : invisible pour l’œil` : 'à l’infini'} couleur={nette ? '#15803d' : '#dc2626'}/>}
      {(enExplore || depuis('G')) && afo && <LigneMesure nom="Diamètre apparent θ₂ (avec la lunette)" valeur={`${fm(th2 * 1000, 1)}${NB}mrad`} couleur={COUL.theta}/>}
      {(enExplore || depuis('bravo')) && <LigneMesure nom="Grossissement G = θ₂ / θ₀" valeur={afo ? fm(G, 0) : 'lunette à régler (afocale)'} couleur="#b45309"/>}
      {enExplore && <LigneMesure nom="Objet visible à l’œil nu ? (θ₀ ≥ ε)" valeur={M.visibleOeilNu(th) ? 'oui' : 'non'} couleur={M.visibleOeilNu(th) ? '#15803d' : '#dc2626'}/>}
      {enExplore && afo && <LigneMesure nom="Visible avec la lunette ? (θ₂ ≥ ε)" valeur={th2 >= M.EPS ? 'oui' : 'non'} couleur={th2 >= M.EPS ? '#15803d' : '#dc2626'}/>}
    </div>);
  const maj = patch => (enDefi ? majDefi(patch) : setP(x => ({ ...x, ...patch })));
  const choisirObj = i => { const lim = [M.OBJECTIFS[i] - 20, M.OBJECTIFS[i] + 55]; maj({ io: i, dg: Math.max(lim[0], Math.min(lim[1], PE.dg + (M.OBJECTIFS[i] - f1))) }); };
  const boutons = (cle, liste, nomSym, titre, fn) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{titre}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {liste.map((v, i) => <button key={v} onClick={() => (fn ? fn(i) : maj({ [cle]: i }))} aria-pressed={PE[cle] === i} style={stylePetitBouton(PE[cle] === i, '#0369a1')}>{nomSym}′ = {v}{NB}mm</button>)}
      </div>
    </div>);
  const curG = <Curseur nom="Tirage grossier : distance O₁O₂" valeur={PE.dg} onChange={v => maj({ dg: v })} min={f1 - 20} max={f1 + 55} pas={1} unite="mm" decimales={0} couleur="#0f172a"/>;
  const curF = <Curseur nom="Vis fine" valeur={PE.df} onChange={v => maj({ df: v })} min={-1} max={1} pas={0.01} unite="mm" decimales={2} couleur={COUL.inter}/>;
  const curTh = <Curseur nom="Diamètre apparent θ₀ de l’objet" valeur={PE.th} onChange={v => maj({ th: v })} min={M.THETA_MIN} max={M.THETA_MAX} pas={0.1} unite="mrad" decimales={1} couleur="#0f172a"/>;
  const boutonAuto = <button onClick={() => maj(reglage(PE.io, PE.ioc, PE.oeil))} style={styleBouton(false)}>mise au point automatique</button>;
  const reglagesGuide = (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {['map', 'oculaire', 'myope'].includes(idE) && <>{curG}{curF}{boutonAuto}</>}
    </div>);
  const reglagesExplore = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {boutons('io', M.OBJECTIFS, 'f₁', 'Objectif', choisirObj)}{boutons('ioc', M.OCULAIRES, 'f₂', 'Oculaire')}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Œil de l’observateur</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[['normal', 'normal'], ['myope', 'myope (voit net jusqu’à 40 cm)']].map(([v, l]) => <button key={v} onClick={() => maj({ oeil: v })} aria-pressed={PE.oeil === v} style={stylePetitBouton(PE.oeil === v, '#0369a1')}>{l}</button>)}
        </div>
      </div>
      {curG}{curF}{curTh}
      <div style={{ marginTop: 6 }}>{boutonAuto}</div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 14, color: KIT.txt, cursor: 'pointer' }}><input type="checkbox" checked={cotesOn} onChange={e => setCotesOn(e.target.checked)}/>Afficher les cotes sur le schéma (θ₀, A₁B₁, O₁O₂)</label>
    </div>);
  const reglagesDefi = defi && (defi.type === 'gross' ? null : (
    <div style={styleBoite}><div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>{curG}{curF}</div>));

  // ════════════════ SCÈNE ════════════════
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {(() => {
        const schema = { d, f1, f2, theta0: th, oeil: PE.oeil, cotes: enExplore && cotesOn ? { A1B1 } : null,
          montre: { inter: !enGuide || depuis('inter'), F: !enGuide || depuis('map-q') || idE === 'map', statut: !enGuide || depuis('map'), theta: enExplore || (enGuide && depuis('G')), noms: true } };
        return enExplore ? <SceneAnimee schema={schema} vmin={f1 - 20} vmax={f1 + 55} setD={v => maj({ dg: v, df: 0 })}/> : <SchemaLunette {...schema}/>;
      })()}
    </div>);
  const aEssayer = indicesProfond(
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Faites la mise au point (bouton automatique) : où se trouve l’image intermédiaire par rapport à F₁′ et F₂ ?</li>
        <li>Changez d’oculaire sans toucher au tirage : la lunette reste-t-elle afocale ? De combien faut-il corriger O₁O₂ ?</li>
        <li>Comparez le grossissement pour les neuf couples objectif–oculaire. Lequel est le plus grand ?</li>
        <li>Choisissez θ₀ = 0,2 mrad : l’objet est-il visible à l’œil nu ? Et avec la lunette ?</li>
        <li>Passez à l’œil myope : faut-il rapprocher ou éloigner l’oculaire ? Quelle est alors la nature de l’image définitive ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>objet à l’infini : image intermédiaire A₁B₁ = f₁′ θ₀ dans le plan focal image de l’objectif</li>
        <li>lunette afocale : F₁′ = F₂, O₁O₂ = f₁′ + f₂′, image définitive à l’infini</li>
        <li>G = θ₂ / θ₀ = f₁{avecIndices('frac(′|f)')}₂′ ; changer d’oculaire ⇒ refaire la mise au point ; œil myope : rapprocher l’oculaire</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .lu-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .lu-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .lu-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .lu-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); }
        .lu-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .lu-l1.cote .lu-carte { order: 2; } .lu-l1.cote .lu-main { order: 1; } }
        @media (max-width: 900px) { .lu-l1.cote, .lu-pri { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>La lunette astronomique</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Comment une lunette astronomique grossit-elle un astre lointain ? Modélisez l’<strong>objectif</strong> et l’<strong>oculaire</strong>, réglez la lunette <strong>afocale</strong> et calculez son <strong>grossissement</strong>.</div>
      <div className={`lu-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {enGuide ? <div className="lu-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="lu-carte">{panneauHypo}</div> : null}
        <div className="lu-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'map' ? suiviM : defi.type === 'gross' ? suiviG : suiviY}/></div>}
          <div className={`lu-pri${mode !== 'explore' ? ' pile' : ''}`}>
            {scene}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {enGuide ? (['map', 'oculaire', 'myope'].includes(idE) && reglagesGuide) : enDefi ? reglagesDefi : reglagesExplore}
              {(enExplore || (enGuide && depuis('map'))) && mesures}
            </div>
          </div>
        </div>
      </div>
      {(enExplore || (enGuide && etape >= ETAPES.length - 1)) && <div className="lu-l2">{panneauHypo}</div>}
      {enExplore && <div className="lu-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
