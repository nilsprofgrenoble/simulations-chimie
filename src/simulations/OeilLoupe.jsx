import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useRef } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi, avecIndices, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import { puces, nbf, tire } from "./Travail";
import * as M from "./oeilLoupeModele";
import { SchemaOeil, SchemaAngle, SchemaLoupe, FormeOeil, C } from "./oeilLoupeSchema";
import { useHorloge, Commandes, T_BOUCLE } from "./lentilleMinceAnim";
import { StyleAnim } from "./exploAnim";

const SIM_ID = 117;
declarerDefis(SIM_ID, [['accomm', 'Mettre l’œil au point'], ['theta', 'Calculer un diamètre apparent'], ['gross', 'Grossissement d’une loupe']]);

// ====================================================
//  SIM 117 — L'ŒIL ET LA LOUPE (TSTL, Ondes : « Des ondes pour observer »)
//  Œil réduit emmétrope (cristallin = lentille convergente de focale variable, rétine = écran à 17 mm), accommodation,
//  diamètre apparent et pouvoir séparateur, loupe (image à l'infini, grossissement commercial G = dm / f′).
//  Hypothèses : lentille mince, approximation de Gauss, lumière monochromatique, œil sans défaut de vision, dm = 25 cm,
//  pouvoir séparateur ε ≈ 3×10⁻⁴ rad (ordre de grandeur), netteté jugée à ± 0,1 mm près sur la rétine.
// ====================================================

const fm = (x, n = 1) => nbf(x, n);
const bloqueSi = (ok, msg) => ok ? null : msg;
const P0 = { vue: 'oeil', D: 25, inf: true, fe: 17, dl: 3, fl: 5, AB: 2 };
const VUES = [['oeil', 'L’œil'], ['angle', 'Diamètre apparent'], ['loupe', 'La loupe']];
const FCurseurNote = ({ children }) => <div style={{ fontSize: 12.5, color: KIT.txt2, lineHeight: 1.45 }}>{children}</div>;

const FConj = (
  <Formule><mfrac><mn>1</mn><mi>OA′</mi></mfrac><mo>−</mo><mfrac><mn>1</mn><mi>OA</mi></mfrac><mo>=</mo><mfrac><mn>1</mn><mi>f′</mi></mfrac></Formule>);
const FTheta = (
  <Formule><mi>θ</mi><mo>≈</mo><mfrac><mi>AB</mi><mi>D</mi></mfrac><mspace width="1em"/><mtext>(θ en radian, petits angles)</mtext></Formule>);
const FG = (
  <Formule><mi>G</mi><mo>=</mo><mfrac><mi>θ′</mi><mi>θ</mi></mfrac><mo>=</mo><mfrac><msub><mi>d</mi><mi>m</mi></msub><mi>f′</mi></mfrac></Formule>);

// ---------- schémas des cartes « À retenir » (dessinés ici : ils ne dépendent pas de la scène principale) ----------
function CarteLoupeSVG() {
  const y0 = 92, xo = 96, xl = 160, xe = 232, ab = 30;
  return (
    <svg viewBox="0 0 380 180" role="img" aria-label="Loupe : l’objet est dans le plan focal objet ; les rayons issus de B ressortent parallèles entre eux ; l’œil au repos, derrière la loupe, voit l’image à l’infini sous l’angle thêta prime" style={{ width: '100%', maxWidth: 380, height: 'auto', display: 'block', margin: '6px auto' }}>
      <line x1="6" y1={y0} x2="374" y2={y0} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="7 4"/>
      <line x1={xl} y1={y0 - 62} x2={xl} y2={y0 + 62} stroke={C.lent} strokeWidth="3.5"/>
      <polygon points={`${xl},${y0 - 68} ${xl - 6},${y0 - 56} ${xl + 6},${y0 - 56}`} fill={C.lent}/><polygon points={`${xl},${y0 + 68} ${xl - 6},${y0 + 56} ${xl + 6},${y0 + 56}`} fill={C.lent}/>
      <line x1={xo} y1={y0} x2={xo} y2={y0 - ab + 5} stroke={C.obj} strokeWidth="3.5"/><polygon points={`${xo},${y0 - ab - 2} ${xo - 5},${y0 - ab + 8} ${xo + 5},${y0 - ab + 8}`} fill={C.obj}/>
      <polyline points={`${xo},${y0 - ab} ${xl},${y0 - ab} ${xl + 64},${y0}`} fill="none" stroke={C.r1} strokeWidth="2"/>
      <polyline points={`${xo},${y0 - ab} ${xl},${y0} ${xe - 12},${y0 + (xe - 12 - xl) * ab / (xl - xo)}`} fill="none" stroke={C.r2} strokeWidth="2"/>
      <polyline points={`${xl + 64},${y0} ${xe - 12},${y0 + (xe - 12 - xl - 64) * ab / (xl - xo)}`} fill="none" stroke={C.r1} strokeWidth="2"/>
      <g fontSize="11.5" fontWeight="800"><text x={xo - 5} y={y0 + 17} textAnchor="end" fill={C.foyer}>F</text><circle cx={xo} cy={y0} r="3.5" fill="#fff" stroke={C.foyer} strokeWidth="2"/>
        <circle cx={xl + 64} cy={y0} r="3.5" fill={C.foyer}/><text x={xl + 64} y={y0 - 8} textAnchor="middle" fill={C.foyer}>F′</text>
        <text x={xl} y="14" textAnchor="middle" fill={C.lent}>loupe</text>
        <text x={xo} y={y0 - ab - 8} textAnchor="middle" fill={C.obj}>B</text></g>
      <FormeOeil xL={xe} y0={y0} k={4.3} fe={M.L_OEIL}/>
      <g fontSize="12" fontWeight="800" fill={C.theta}><line x1={xe} y1={y0} x2={xe - 70} y2={y0 - 33} stroke={C.theta} strokeWidth="1.5" strokeDasharray="3 3"/>
        <path d={`M${xe - 40},${y0} A40,40 0 0 1 ${xe - 40 * Math.cos(0.4636)},${y0 - 40 * Math.sin(0.4636)}`} fill="none" stroke={C.theta} strokeWidth="1.8"/>
        <text x={xe - 46} y={y0 - 14} textAnchor="end">θ′</text></g>
      <text x="190" y="166" textAnchor="middle" fontSize="11" fontWeight="800" fill={C.img}>objet en F : rayons parallèles, image à l’infini</text>
      <text x={xe + 20} y="30" textAnchor="middle" fontSize="11" fontWeight="800" fill={C.txt}>œil au repos</text>
    </svg>);
}
function CarteGrossissementSVG() {
  const y0 = 80, h = 20;
  return (
    <svg viewBox="0 0 380 170" role="img" aria-label="Deux situations : à l’œil nu, l’objet est à 25 centimètres et on le voit sous l’angle thêta ; avec la loupe, l’objet est dans le plan focal et on le voit sous l’angle thêta prime, plus grand ; le grossissement est le rapport des deux angles" style={{ width: '100%', maxWidth: 380, height: 'auto', display: 'block', margin: '6px auto' }}>
      <text x="95" y="14" textAnchor="middle" fontSize="11.5" fontWeight="800" fill={C.txt}>à l’œil nu</text><text x="285" y="14" textAnchor="middle" fontSize="11.5" fontWeight="800" fill={C.txt}>avec la loupe</text>
      <line x1="190" y1="22" x2="190" y2="160" stroke="#e2e8f0" strokeWidth="1.5"/>
      {/* gauche : objet à dm */}
      <line x1="10" y1={y0} x2="172" y2={y0} stroke="#94a3b8" strokeDasharray="6 4"/>
      <line x1="22" y1={y0} x2="22" y2={y0 - h + 4} stroke={C.obj} strokeWidth="3.5"/><polygon points={`22,${y0 - h - 2} 17,${y0 - h + 7} 27,${y0 - h + 7}`} fill={C.obj}/>
      <polyline points={`22,${y0 - h} 150,${y0} 22,${y0}`} fill="none" stroke={C.theta} strokeWidth="1.6"/>
      <FormeOeil xL={150} y0={y0} k={2.4} fe={M.L_OEIL}/>
      <text x="86" y={y0 + 30} textAnchor="middle" fontSize="11.5" fontWeight="800" fill={C.txt}>{`dm = 25${NB}cm`}</text>
      <text x="64" y={y0 - 6} fontSize="13" fontWeight="800" fill={C.theta}>θ</text>
      {/* droite : loupe */}
      <line x1="198" y1={y0} x2="374" y2={y0} stroke="#94a3b8" strokeDasharray="6 4"/>
      <line x1="262" y1={y0 - 46} x2="262" y2={y0 + 46} stroke={C.lent} strokeWidth="3"/>
      <line x1="224" y1={y0} x2="224" y2={y0 - h + 4} stroke={C.obj} strokeWidth="3.5"/><polygon points={`224,${y0 - h - 2} 219,${y0 - h + 7} 229,${y0 - h + 7}`} fill={C.obj}/>
      <polyline points={`224,${y0 - h} 262,${y0 - h} 330,${y0}`} fill="none" stroke={C.r1} strokeWidth="1.6"/>
      <FormeOeil xL={296} y0={y0} k={2.4} fe={M.L_OEIL}/>
      <polyline points={`296,${y0} 224,${y0 - h * 1.0}`} fill="none" stroke={C.theta} strokeWidth="1.6" strokeDasharray="3 3"/>
      <text x="243" y={y0 + 30} textAnchor="middle" fontSize="11.5" fontWeight="800" fill={C.txt}>objet en F</text>
      <text x="262" y={y0 - 52} textAnchor="middle" fontSize="11" fontWeight="800" fill={C.lent}>loupe</text>
      <text x="272" y={y0 + 46} fontSize="13" fontWeight="800" fill={C.theta}>θ′</text>
      <text x="190" y="158" textAnchor="middle" fontSize="11.5" fontWeight="800" fill={C.theta}>θ′ plus grand que θ : G = θ′ / θ &gt; 1</text>
    </svg>);
}
function CarteBilanSVG() {
  const boite = (x, y, w, t1, t2, c) => (
    <g key={x}><rect x={x} y={y} width={w} height="50" rx="9" fill="#fff" stroke={c} strokeWidth="2"/>
      <text x={x + w / 2} y={y + 21} textAnchor="middle" fontSize="11.5" fontWeight="800" fill={c}>{t1}</text><text x={x + w / 2} y={y + 38} textAnchor="middle" fontSize="11" fontWeight="700" fill={C.txt}>{t2}</text></g>);
  const fl2 = x => <g key={`f${x}`}><line x1={x} y1="70" x2={x + 12} y2="70" stroke="#475569" strokeWidth="2"/><polygon points={`${x + 17},70 ${x + 9},65 ${x + 9},75`} fill="#475569"/></g>;
  return (
    <svg viewBox="0 0 380 170" role="img" aria-label="Enchaînement : objet dans le plan focal de la loupe, image à l’infini, œil au repos, image nette sur la rétine sans accommodation" style={{ width: '100%', maxWidth: 380, height: 'auto', display: 'block', margin: '6px auto' }}>
      {boite(6, 45, 80, 'objet', 'au foyer F', C.obj)}{fl2(88)}
      {boite(106, 45, 80, 'loupe', 'à l’infini', C.lent)}{fl2(188)}
      {boite(206, 45, 80, 'œil au repos', 'f′ = 17 mm', C.ret)}{fl2(288)}
      {boite(306, 45, 70, 'rétine', 'image nette', C.img)}
      <text x="190" y="128" textAnchor="middle" fontSize="12" fontWeight="800" fill={C.theta}>G = θ′ / θ = dm / f′     (dm = 25 cm)</text>
      <text x="190" y="148" textAnchor="middle" fontSize="11" fontWeight="700" fill="#64748b">plus f′ est petite, plus G est grand</text>
    </svg>);
}

const FICHES = {
  modele: <>
    <SchemaOeil D={Infinity} fe={17} large={380} haut={180} k={6.2} xL={205} compact etiquettes label="Œil réduit au repos : une lentille convergente, le cristallin, et un écran, la rétine, à 17 millimètres derrière ; les rayons venant d’un objet très éloigné convergent sur la rétine"/>
    {puces(<><strong>Œil réduit</strong> : cristallin + cornée = <strong>lentille convergente</strong> ; rétine = <strong>écran</strong> à L = 17{NB}mm derrière.</>,
      <>Un objet est vu <strong>net</strong> si son image se forme <strong>sur la rétine</strong>. Œil <strong>au repos</strong> : l’objet est à l’infini, le foyer image F′ est <strong>sur la rétine</strong> (f′ = L).</>,
      <><strong>Idée fausse</strong> : « la rétine est un miroir ». <strong>Vrai</strong> : c’est un écran qui reçoit une image <strong>renversée</strong> (le cerveau la remet à l’endroit).</>)}
  </>,
  accomm: <>
    <SchemaOeil D={25} fe={17} large={380} haut={180} k={6.2} xL={205} compact etiquettes label="Objet à 25 centimètres, cristallin au repos : l’image se forme derrière la rétine, la rétine reçoit une tache floue"/>
    <SchemaOeil D={25} fe={M.focaleOeil(250)} large={380} haut={180} k={6.2} xL={205} compact etiquettes label="Objet à 25 centimètres, cristallin accommodé : sa distance focale a diminué et l’image se forme sur la rétine"/>
    {puces(<><strong>Accommodation</strong> : pour un objet plus proche, le cristallin devient <strong>plus bombé</strong> : sa distance focale <strong>f′ diminue</strong> et l’image revient sur la rétine.</>,
      <><strong>Exemple</strong> : objet à 25{NB}cm, L = 17,0{NB}mm : f′ = 15,9{NB}mm (au repos : 17,0{NB}mm).</>,
      <><strong>Mémo</strong> : « objet proche ⇒ cristallin bombé ⇒ f′ petite ». La distance L ne change pas.</>)}
  </>,
  diam: <>
    <SchemaAngle D={50} AB={2} fantome large={380} haut={170} sc={2.2} label="Un même objet vu à 50 centimètres et à 25 centimètres : plus il est proche, plus l’angle thêta sous lequel on le voit est grand" texte={false}/>
    {FTheta}
    {puces(<>L’œil ne mesure pas la taille d’un objet, mais l’<strong>angle θ</strong> sous lequel il le voit : son <strong>diamètre apparent</strong> (en radian).</>,
      <><strong>Exemple</strong> : AB = 2,0{NB}cm vu à D = 50{NB}cm : θ ≈ 20 ÷ 500 = 0,040{NB}rad = 40{NB}mrad. À 25{NB}cm, θ est <strong>deux fois plus grand</strong>.</>,
      <><strong>Pouvoir séparateur</strong> : l’œil sépare deux détails si θ ≥ ε ≈ 3×10⁻⁴{NB}rad (≈ 1′). Deux traits distants de 0,10{NB}mm sont séparés à 25{NB}cm (θ = 0,40{NB}mrad), plus à 50{NB}cm (0,20{NB}mrad).</>)}
  </>,
  loupe: <>
    <CarteLoupeSVG/>
    {puces(<>Une <strong>loupe</strong> est une lentille convergente. Objet <strong>entre O et F</strong> : image <strong>virtuelle</strong>, droite, agrandie.</>,
      <>Objet <strong>dans le plan focal objet</strong> (OA = −f′) : les rayons ressortent <strong>parallèles</strong>, l’image est <strong>à l’infini</strong> : l’œil la voit <strong>au repos</strong>, sans accommodation.</>,
      <><strong>Exemple</strong> : OA = −4,5{NB}cm et f′ = 5,0{NB}cm donnent OA′ = −45{NB}cm : image virtuelle du côté de l’objet, que l’œil doit accommoder pour voir nette.</>)}
  </>,
  gross: <>
    <CarteGrossissementSVG/>
    {FG}
    {puces(<>Le <strong>grossissement</strong> compare le diamètre apparent θ′ de l’image à celui, θ, de l’objet vu à l’œil nu à d<sub>m</sub> = 25{NB}cm.</>,
      <><strong>Plus f′ est petite, plus G est grand</strong> : f′ = 5,0{NB}cm donne G = 25 ÷ 5,0 = 5,0 ; f′ = 2,5{NB}cm donne G = 10.</>,
      <><strong>Idée fausse</strong> : « G est le grandissement de la loupe ». <strong>Vrai</strong> : G compare des <strong>angles</strong> ; l’image est à l’infini, on ne peut pas parler de taille A′B′.</>)}
  </>,
  bilan: <>
    <CarteBilanSVG/>
    {puces(<><strong>Œil réduit</strong> : lentille de focale f′ variable + rétine à 17{NB}mm ; image nette ⇔ sur la rétine ; objet proche ⇒ f′ diminue (accommodation).</>,
      <><strong>Diamètre apparent</strong> θ ≈ {avecIndices('frac(AB|D)')} ; détails séparés si θ ≥ ε ≈ 3×10⁻⁴{NB}rad.</>,
      <><strong>Loupe</strong> : objet dans le plan focal, image à l’infini, G = {avecIndices('frac(θ′|θ)')} = {avecIndices('frac(d_m|f′)')}.</>)}
  </>,
};

// ====================================================
//  COMPOSANT
// ====================================================
// exploration animée : photons le long des rayons ; objet saisissable (loupe : position OA ; diamètre apparent : distance D)
function SceneAnimee({ vue, schema, setD, setDl }) {
  const L = useHorloge(T_BOUCLE, true), [touche, setTouche] = useState(false), ref = useRef(null);
  const lum = { t: L.t, mode: 'boucle' }, tch = () => setTouche(true);
  const consigne = vue === 'oeil' ? 'Les photons arrivent au même point de la rétine quand l’image est nette ; sinon ils s’étalent.' : 'Saisissez l’objet (le rond ↔ sous lui) pour le déplacer : la lumière suit.';
  return (
    <div><StyleAnim/>
      {vue === 'oeil' && <SchemaOeil {...schema} lum={lum}/>}
      {vue === 'angle' && <SchemaAngle {...schema} lum={lum} refSvg={ref} poignee={{ vmin: M.D_MIN, vmax: 150, touche, onToucher: tch, set: v => setD(Math.round(Math.max(M.D_MIN, Math.min(150, v)) / 5) * 5) }}/>}
      {vue === 'loupe' && <SchemaLoupe {...schema} lum={lum} refSvg={ref} poignee={{ touche, onToucher: tch, set: v => setDl(Math.round(Math.max(M.DL_MIN, Math.min(M.DL_MAX, -v)) * 10) / 10) }}/>}
      <div style={{ fontSize: 13, color: KIT.txt2, margin: '8px 0 2px', lineHeight: 1.45 }}>{consigne}</div>
      <Commandes L={L}/>
    </div>);
}

export function SimulationOeilLoupe() {
  const [mode, setMode] = useState(() => modeOuverture('oeil-loupe-guide-v1'));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviT, noterT] = useCompteurDefi(), [suiviG, noterG] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('oeil-loupe-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('accomm');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [P, setP] = useState(P0);
  const [auto, setAuto] = useState(false), [fantome, setFantome] = useState(true);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const PE = enDefi && defi ? defi.p : P;
  const vue = PE.vue;
  const Dc = PE.inf ? Infinity : PE.D;                                        // cm
  const feEff = enExplore && auto ? M.focaleOeil(Dc * 10) : PE.fe;
  const nette = M.netteRetine(Dc * 10, feEff);

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const dep = patch => () => setP(p => ({ ...p, ...patch }));
  const ETAPES = [
    { id: 'modele', titre: 'L’œil, un instrument d’optique', focus: ['scene'], depart: dep({ vue: 'oeil', D: 25, inf: true, fe: 17 }),
      retenirTitre: 'À RETENIR : L’ŒIL RÉDUIT', retenir: FICHES.modele,
      texte: <>En optique, l’œil se modélise par l’<strong>œil réduit</strong> : le cristallin et la cornée forment ensemble une <strong>lentille convergente</strong>, et la <strong>rétine</strong> est un <strong>écran</strong> placé à <em>L</em> = 17,0{NB}mm derrière elle. L’œil et ses rayons sont dessinés à l’échelle ; l’objet, lui, est très loin (l’axe est interrompu). L’œil est <strong>au repos</strong> : il regarde un objet à l’infini.</>,
      tache: { type: 'qcm', q: 'L’œil au repos voit net un objet à l’infini. Où se trouve alors le foyer image F′ du cristallin ?', options: ['sur la rétine', 'devant la rétine', 'derrière la rétine', 'au centre du cristallin'], bonne: 0,
        indice: 'L’image d’un objet à l’infini se forme au foyer image F′. Et elle doit être nette : où faut-il qu’elle se forme ?', expl: 'Les rayons venant de l’infini sont parallèles : ils convergent en F′. Pour que l’image soit nette, F′ est sur la rétine : la distance focale du cristallin au repos est égale à L = 17,0 mm.' } },
    { id: 'proche', titre: 'Un objet plus proche', focus: ['scene', 'reglages'], depart: dep({ vue: 'oeil', D: 25, inf: false, fe: 17 }),
      texte: <>L’objet est maintenant à <em>D</em> = 25{NB}cm de l’œil. Avec le cristallin au repos (<em>f′</em> = 17,0{NB}mm), l’image se forme <strong>derrière</strong> la rétine : la rétine reçoit une tache floue. Le cristallin peut se déformer : réglez sa distance focale <em>f′</em> pour que l’image soit <strong>nette sur la rétine</strong>.</>,
      tache: { type: 'action', ok: enGuide && M.netteRetine(250, P.fe), consigne: 'Réglez f′ pour obtenir une image nette sur la rétine.' } },
    { id: 'accomm', titre: 'L’accommodation', focus: ['scene', 'mesures'], depart: dep({ vue: 'oeil', D: 25, inf: false, fe: M.focaleOeil(250) }),
      retenirTitre: 'À RETENIR : L’ACCOMMODATION', retenir: FICHES.accomm,
      texte: <>L’image est nette. Le cristallin s’est déformé pour voir un objet proche : c’est l’<strong>accommodation</strong>. Comparez avec l’œil au repos (<em>f′</em> = 17,0{NB}mm).</>,
      tache: { type: 'qcm', q: 'Pour voir net un objet plus proche, la distance focale f′ du cristallin…', options: ['diminue : le cristallin devient plus bombé', 'augmente : le cristallin s’aplatit', 'ne change pas : c’est L qui change', 'devient infinie'], bonne: 0,
        indice: 'Comparez la valeur de f′ affichée dans les mesures avec celle de l’œil au repos, 17,0 mm.', expl: 'L’objet est plus proche, donc l’image se formerait plus loin derrière le cristallin ; pour la ramener sur la rétine (L fixe), le cristallin doit être plus convergent : sa distance focale diminue.' } },
    { id: 'accomm-calc', titre: 'Calculer l’accommodation', focus: ['mesures'], depart: null,
      texte: <>Vérifions par le calcul. L’image doit se former sur la rétine : OA′ = +<em>L</em> = +17,0{NB}mm. L’objet est à 25{NB}cm = 250{NB}mm devant le cristallin : OA = −250{NB}mm. Calculez <em>f′</em> avec la relation de conjugaison {FConj}</>,
      tache: { type: 'num', q: 'Distance focale f′ du cristallin pour voir net un objet à 25 cm', unite: 'mm', vrai: 1 / (1 / 17 + 1 / 250), tol: 0.01, affiche: v => fm(v, 1), carnet: 'Distance focale f′ du cristallin à 25 cm',
        calcul: () => ['1/f′ = 1/OA′ − 1/OA = 1/17,0 + 1/250 = 0,0588 + 0,0040 = 0,0628 mm⁻¹.', 'f′ = 1 ÷ 0,0628 = 15,9 mm : plus petite que 17,0 mm (accommodation).'],
        pieges: [[1 / (1 / 17 - 1 / 250), 'Vous avez pris OA = +250 mm : l’objet est avant le cristallin, OA est négatif ; on additionne 1/17,0 et 1/250.'], [0.0628, 'Vous avez calculé 1/f′ : il reste à inverser.'], [17, 'C’est la valeur de l’œil au repos (objet à l’infini). Ici l’objet est à 25 cm : 1/f′ = 1/17,0 + 1/250.']],
        expl: 'f′ ≈ 15,9 mm : le cristallin a une distance focale plus petite que 17,0 mm, il est plus convergent.', indice: '1/f′ = 1/OA′ − 1/OA avec OA′ = +17,0 mm et OA = −250 mm. Calculez 1/f′, puis inversez.' } },
    { id: 'diam', titre: 'Ce que voit l’œil : un angle', focus: ['scene', 'reglages'], depart: dep({ vue: 'angle', D: 50, AB: 2 }),
      texte: <>Un objet <strong>AB</strong> de 2,0{NB}cm est vu à la distance <em>D</em> de l’œil. Ce que perçoit l’œil n’est pas sa taille, mais l’<strong>angle θ</strong> entre les deux rayons issus de ses extrémités : son <strong>diamètre apparent</strong>. Faites varier <em>D</em> avec le curseur (l’objet gris est à 25{NB}cm) et regardez l’angle.</>,
      tache: { type: 'qcm', q: 'Quand on rapproche l’objet de l’œil (D diminue), son diamètre apparent θ…', options: ['augmente', 'diminue', 'ne change pas', 'devient nul'], bonne: 0,
        indice: 'Regardez l’angle θ du schéma quand l’objet se rapproche (objet gris, à 25 cm, comparé à l’objet à 50 cm).', expl: 'Plus l’objet est proche, plus il est vu sous un grand angle : θ ≈ frac(AB|D) augmente quand D diminue, même si AB ne change pas.' } },
    { id: 'diam-calc', titre: 'Calculer un diamètre apparent', focus: ['mesures'], depart: dep({ vue: 'angle', D: 50, AB: 2 }),
      texte: <>On a AB = 2,0{NB}cm = 20{NB}mm et <em>D</em> = 50{NB}cm = 500{NB}mm. Les angles sont petits : on utilise l’approximation <strong>θ ≈ {avecIndices('frac(AB|D)')}</strong>, avec θ en <strong>radian</strong>.</>,
      tache: { type: 'num', q: 'Diamètre apparent θ de l’objet', unite: 'rad', vrai: 0.04, tol: 0.03, affiche: v => fm(v, 3), carnet: 'Diamètre apparent θ à 50 cm',
        calcul: () => ['AB et D dans la même unité : AB = 20 mm, D = 500 mm.', 'θ ≈ frac(AB|D) = 20 ÷ 500 = 0,040 rad, soit 40 mrad (environ 2,3°).'],
        pieges: [[4, 'Vous avez divisé AB = 2,0 cm par D = 0,50 m sans convertir : AB et D doivent avoir la même unité.'], [25, 'Vous avez calculé frac(D|AB) : le diamètre apparent est frac(AB|D).'], [2.29, 'Ce résultat est en degrés. L’approximation θ ≈ frac(AB|D) donne θ en radian.']],
        expl: 'θ ≈ 0,040 rad = 40 mrad. À 25 cm, θ serait deux fois plus grand (0,080 rad).', indice: 'θ ≈ frac(AB|D), avec AB et D dans la même unité (par exemple en mm).' } },
    { id: 'sep', titre: 'Le pouvoir séparateur de l’œil', focus: ['scene', 'mesures'], depart: dep({ vue: 'angle', D: 25, AB: 0.01 }),
      texte: <>L’œil ne sépare deux détails que si l’angle θ qui les sépare est au moins égal à son <strong>pouvoir séparateur</strong> ε ≈ 3×10⁻⁴{NB}rad = 0,3{NB}mrad (environ 1′, un ordre de grandeur). Deux traits très fins sont distants de <strong>0,10{NB}mm</strong>, observés à <em>D</em> = 25{NB}cm. Calculez l’angle θ entre eux.</>,
      tache: { type: 'num', q: 'Angle θ entre les deux traits (D = 25 cm)', unite: 'mrad', vrai: 0.4, tol: 0.03, affiche: v => fm(v, 2), carnet: 'Angle θ entre deux traits à 25 cm',
        calcul: () => ['Écart AB = 0,10 mm ; D = 25 cm = 250 mm.', 'θ ≈ frac(AB|D) = 0,10 ÷ 250 = 4,0×10⁻⁴ rad = 0,40 mrad.'],
        pieges: [[4, 'Vous avez divisé 0,10 mm par 25 cm sans convertir (mm et cm mélangés). Passez D en mm : 250 mm.'], [0.0004, 'C’est la bonne valeur, mais en radian : l’énoncé demande des mrad (1 mrad = 10⁻³ rad).'], [2500, 'Vous avez calculé frac(D|AB) : le diamètre apparent est frac(AB|D).']],
        expl: 'θ = 4,0×10⁻⁴ rad = 0,40 mrad, supérieur à ε = 0,3 mrad : les deux traits sont vus séparés.', indice: 'θ ≈ frac(AB|D) avec AB = 0,10 mm et D = 250 mm ; 1 mrad = 10⁻³ rad.' } },
    { id: 'sep2', titre: 'Et si on recule ?', focus: ['scene', 'mesures'], depart: dep({ vue: 'angle', D: 50, AB: 0.01 }),
      retenirTitre: 'À RETENIR : DIAMÈTRE APPARENT ET POUVOIR SÉPARATEUR', retenir: FICHES.diam,
      texte: <>Les mêmes traits (écart 0,10{NB}mm) sont maintenant observés à <em>D</em> = 50{NB}cm. On rappelle ε ≈ 0,3{NB}mrad.</>,
      tache: { type: 'qcm', q: 'À 50 cm, les deux traits sont-ils vus séparés ?', options: ['Non : θ = 0,20 mrad est inférieur à ε', 'Oui : θ = 0,20 mrad est supérieur à ε', 'Oui : l’œil accommode et sépare tout', 'Non : θ est devenu nul'], bonne: 0,
        indice: 'Calculez θ ≈ frac(AB|D) = 0,10 mm ÷ 500 mm, puis comparez-le à ε = 0,3 mrad.', expl: 'θ = 0,10 ÷ 500 = 2,0×10⁻⁴ rad = 0,20 mrad < 0,3 mrad : les traits se confondent. Pour mieux voir, on rapproche l’objet (limite : 25 cm) ou on utilise un instrument.' } },
    { id: 'loupe', titre: 'La loupe : où placer l’objet ?', focus: ['scene', 'reglages'], depart: dep({ vue: 'loupe', dl: 3, fl: 5 }),
      texte: <>Une <strong>loupe</strong> est une lentille convergente (ici <em>f′</em> = 5,0{NB}cm). L’objet AB (0,50{NB}cm) est entre la loupe et son foyer F ; l’œil est juste derrière la loupe. Déplacez l’objet jusqu’à ce que les rayons qui sortent de la loupe soient <strong>parallèles</strong> entre eux.</>,
      tache: { type: 'action', ok: enGuide && M.imageALInfini(P.dl, 5), consigne: 'Placez l’objet pour que les rayons ressortent parallèles.' } },
    { id: 'inf', titre: 'Pourquoi à l’infini ?', focus: ['scene'], depart: dep({ vue: 'loupe', dl: 5, fl: 5 }),
      retenirTitre: 'À RETENIR : LA LOUPE ET L’IMAGE À L’INFINI', retenir: FICHES.loupe,
      texte: <>L’objet est dans le plan focal objet de la loupe : l’image est <strong>rejetée à l’infini</strong> (rayons parallèles). On se souvient que l’œil au repos voit net un objet à l’infini.</>,
      tache: { type: 'qcm', q: 'Pourquoi est-ce la meilleure position pour observer longtemps à la loupe ?', options: ['L’œil voit l’image à l’infini au repos, sans accommodation', 'L’image est réelle et plus grande', 'L’image est renversée, ce qui repose l’œil', 'L’objet est plus près de l’œil'], bonne: 0,
        indice: 'Souvenez-vous de la première étape : quand l’œil est au repos, sa distance focale est 17,0 mm. Que voit-il net ?', expl: 'Les rayons sortent parallèles : c’est comme un objet à l’infini. L’œil les voit nets avec f′ = 17,0 mm, sans effort d’accommodation.' } },
    { id: 'conj', titre: 'Où est l’image ?', focus: ['scene', 'mesures', 'reglages'], depart: dep({ vue: 'loupe', dl: 4.5, fl: 5 }),
      texte: <>On éloigne un peu l’objet : OA = −4,5{NB}cm, <em>f′</em> = 5,0{NB}cm. Calculez la position OA′ de l’image avec la relation de conjugaison {FConj}</>,
      tache: { type: 'num', q: 'Position OA′ de l’image donnée par la loupe', unite: 'cm', vrai: -45, tol: 0.02, affiche: v => fm(v, 1), carnet: 'Position OA′ de l’image (OA = −4,5 cm)',
        calcul: () => ['1/OA′ = 1/f′ + 1/OA = 1/5,0 + 1/(−4,5) = 0,2000 − 0,2222 = −0,0222 cm⁻¹.', 'OA′ = 1 ÷ (−0,0222) = −45 cm : négatif, image virtuelle du côté de l’objet.'],
        pieges: [[45, 'Le signe : 1/OA′ est négatif, donc OA′ aussi. OA′ < 0 signifie image virtuelle, du côté de l’objet.'], [-0.0222, 'Vous avez calculé 1/OA′ : il reste à inverser.'], [1 / (1 / 5 + 1 / 4.5), 'Vous avez pris OA = +4,5 cm : l’objet est avant la loupe, OA est négatif.']],
        expl: 'OA′ = −45 cm : l’image est virtuelle, à 45 cm de la loupe du côté de l’objet. L’œil peut la voir nette (plus loin que 25 cm), mais en accommodant : f′ du cristallin ≈ 16,4 mm.', indice: '1/OA′ = 1/f′ + 1/OA avec OA = −4,5 cm. Calculez 1/OA′, puis inversez.' } },
    { id: 'thetap', titre: 'L’angle sous lequel on voit l’image', focus: ['scene', 'mesures'], depart: dep({ vue: 'loupe', dl: 5, fl: 5 }),
      texte: <>L’objet est de nouveau dans le plan focal (<em>d</em> = <em>f′</em> = 5,0{NB}cm), l’œil est contre la loupe. Il voit le point B sous l’angle <strong>θ′</strong> ; avec AB = 0,50{NB}cm, l’approximation des petits angles donne <strong>θ′ ≈ {avecIndices('frac(AB|f′)')}</strong>. Calculez θ′ en radian.</>,
      tache: { type: 'num', q: 'Diamètre apparent θ′ de l’image', unite: 'rad', vrai: 0.1, tol: 0.03, affiche: v => fm(v, 3), carnet: 'Diamètre apparent θ′ avec la loupe',
        calcul: () => ['AB = 0,50 cm ; f′ = 5,0 cm : même unité.', 'θ′ ≈ frac(AB|f′) = 0,50 ÷ 5,0 = 0,10 rad.'],
        pieges: [[0.02, 'Vous avez divisé par 25 cm : c’est le diamètre apparent de l’objet à l’œil nu. Avec la loupe, l’objet est vu depuis la distance f′.'], [10, 'Vous avez calculé frac(f′|AB) : θ′ = frac(AB|f′).']],
        expl: 'θ′ ≈ 0,10 rad = 100 mrad.', indice: 'θ′ ≈ frac(AB|f′), AB et f′ dans la même unité (ici en cm).' } },
    { id: 'theta0', titre: 'Sans la loupe', focus: ['mesures'], depart: null,
      texte: <>Sans la loupe, on observe le même objet (AB = 0,50{NB}cm) à la <strong>distance minimale de vision distincte</strong> d<sub>m</sub> = 25{NB}cm : plus près, l’œil ne peut plus accommoder. Calculez son diamètre apparent θ.</>,
      tache: { type: 'num', q: 'Diamètre apparent θ de l’objet à 25 cm', unite: 'rad', vrai: 0.02, tol: 0.03, affiche: v => fm(v, 3), carnet: 'Diamètre apparent θ à l’œil nu (25 cm)',
        calcul: () => ['θ ≈ frac(AB|dm) = 0,50 ÷ 25 = 0,020 rad (20 mrad).'],
        pieges: [[0.1, 'Vous avez utilisé f′ = 5,0 cm au lieu de dm = 25 cm : c’est le résultat avec la loupe.'], [50, 'Vous avez calculé frac(dm|AB) : θ ≈ frac(AB|dm).']],
        expl: 'θ ≈ 0,020 rad = 20 mrad.', indice: 'θ ≈ frac(AB|dm) avec dm = 25 cm.' } },
    { id: 'gross', titre: 'Le grossissement', focus: ['mesures'], depart: null,
      retenirTitre: 'À RETENIR : LE GROSSISSEMENT D’UNE LOUPE', retenir: FICHES.gross,
      texte: <>Le <strong>grossissement</strong> de la loupe compare les deux angles : <strong>G = {avecIndices('frac(θ′|θ)')}</strong>. Vous avez θ′ = 0,10{NB}rad avec la loupe et θ = 0,020{NB}rad à l’œil nu. Calculez G (sans unité).</>,
      tache: { type: 'num', q: 'Grossissement G de la loupe', unite: '', vrai: 5, tol: 0.03, affiche: v => fm(v, 1), carnet: 'Grossissement G',
        calcul: () => ['G = frac(θ′|θ) = 0,10 ÷ 0,020 = 5,0.', 'On retrouve G = frac(dm|f′) = 25 ÷ 5,0 = 5,0.'],
        pieges: [[0.2, 'Vous avez calculé frac(θ|θ′) : le grossissement est frac(θ′|θ).']],
        expl: 'G = 5,0 : l’objet est vu sous un angle 5 fois plus grand qu’à l’œil nu à 25 cm. Plus généralement G = frac(θ′|θ) = (frac(AB|f′)) ÷ (frac(AB|dm)) = frac(dm|f′).', indice: 'G = frac(θ′|θ), avec θ′ = 0,10 rad et θ = 0,020 rad.' } },
    { id: 'gross2', titre: 'Une loupe plus puissante', focus: ['scene'], depart: dep({ vue: 'loupe', dl: 2.5, fl: 2.5 }),
      texte: <>La relation <strong>G = {avecIndices('frac(d_m|f′)')}</strong> (d<sub>m</sub> = 25{NB}cm) permet de comparer des loupes. Voici une loupe plus convergente, de distance focale <em>f′</em> = 2,5{NB}cm, avec l’objet dans son plan focal.</>,
      tache: { type: 'num', q: 'Grossissement G de cette loupe', unite: '', vrai: 10, tol: 0.03, affiche: v => fm(v, 1), carnet: 'Grossissement G (f′ = 2,5 cm)',
        calcul: () => ['G = frac(dm|f′) = 25 ÷ 2,5 = 10.'],
        pieges: [[0.1, 'Vous avez calculé frac(f′|dm) : G = frac(dm|f′).'], [62.5, 'Vous avez multiplié dm par f′ : G = frac(dm|f′).']],
        expl: 'G = 10 : plus f′ est petite, plus le grossissement est grand.', indice: 'G = frac(dm|f′) avec dm = 25 cm et f′ = 2,5 cm.' } },
    { id: 'bravo', titre: 'Bravo ! Le bilan', focus: [], depart: null,
      retenirTitre: 'À RETENIR : LE BILAN', retenir: FICHES.bilan,
      texte: <>Vous savez modéliser l’œil, expliquer l’accommodation, calculer un diamètre apparent et le comparer au pouvoir séparateur de l’œil, et calculer le grossissement d’une loupe. Essayez maintenant l’exploration, puis les défis.</>, tache: null },
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
  const tirages = {
    accomm: () => ({ type: 'accomm', p: { vue: 'oeil', D: tire([25, 30, 40, 50, 80, 120, 200]), inf: false, fe: 17, AB: 2 }, reps: {}, verifie: false }),
    theta: () => { const c = []; [0.5, 1, 2, 5, 10].forEach(ab => [25, 40, 50, 80, 100, 200].forEach(D => { const t = 100 * ab / D; if (t >= 0.4 && t <= 40) c.push([ab, D]); })); const [ab, D] = tire(c);
      return { type: 'theta', p: { vue: 'angle', D, inf: false, fe: 17, AB: ab / 10 }, ab, reps: {}, verifie: false }; },
    gross: () => { const f = tire([2.5, 4, 5, 8, 10]); return { type: 'gross', p: { vue: 'loupe', dl: f, fl: f, D: 25, inf: false, fe: 17, AB: 2 }, f, reps: {}, verifie: false }; },
  };
  const nouveauDefi = t => setDefi(tirages[t]());
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const majDefi = patch => setDefi(x => ({ ...x, p: { ...x.p, ...patch }, verifie: false }));
  const verifierDefi = () => {
    let ok, vrai;
    if (defi.type === 'accomm') { ok = M.netteRetine(defi.p.D * 10, defi.p.fe); vrai = M.focaleOeil(defi.p.D * 10); }
    else {
      const x = lireNombre(defi.reps.r);
      if (defi.type === 'theta') { vrai = 100 * defi.ab / defi.p.D; ok = isFinite(x) && proche(x, vrai, 0.06); }
      else { vrai = M.grossissement(defi.f); ok = isFinite(x) && proche(x, vrai, 0.06); }
    }
    setDefi(x => ({ ...x, verifie: true, ok, vrai }));
    ({ accomm: noterA, theta: noterT, gross: noterG })[defi.type](ok);
  };
  const champ = (unite, label) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps.r ?? ''} aria-label={label} inputMode="decimal" onKeyDown={e => e.key === 'Enter' && document.getElementById('ol-verif')?.click()}
        onChange={e => setDefi(x => ({ ...x, reps: { r: e.target.value }, verifie: false }))}
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['accomm', 'Mise au point'], ['theta', 'Diamètre apparent'], ['gross', 'Grossissement']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'accomm' ? 'Défi : mettez l’œil au point' : defi.type === 'theta' ? 'Défi : sous quel angle voit-on ce détail ?' : 'Défi : quel est le grossissement de cette loupe ?'}</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>
        {defi.type === 'accomm' && <>Un objet est à <em>D</em> = {fm(defi.p.D, 0)}{NB}cm de l’œil. Réglez la distance focale <em>f′</em> du cristallin pour que l’image soit nette sur la rétine, puis cliquez sur « Vérifier ».</>}
        {defi.type === 'theta' && <>Un détail de <strong>{fm(defi.ab, 1)}{NB}mm</strong> est observé à <em>D</em> = {fm(defi.p.D, 0)}{NB}cm de l’œil. Calculez son diamètre apparent θ, en <strong>mrad</strong>, avec 2 chiffres significatifs.</>}
        {defi.type === 'gross' && <>Une loupe a une distance focale <em>f′</em> = <strong>{fm(defi.f, 1)}{NB}cm</strong>. L’objet est placé dans son plan focal objet. Calculez son grossissement G (distance minimale de vision distincte : 25{NB}cm), avec 2 chiffres significatifs.</>}
      </div>
      {defi.type === 'theta' && champ('mrad', 'Diamètre apparent θ')}
      {defi.type === 'gross' && champ('', 'Grossissement G')}
      {defi.type === 'accomm' && <IndiceDefi cache={false}>Augmentez ou diminuez <em>f′</em> pas à pas jusqu’à ce que l’image soit nette. Pour vérifier : 1/<em>f′</em> = 1/<em>L</em> + 1/<em>D</em> avec <em>L</em> = 17,0{NB}mm et <em>D</em> en mm.</IndiceDefi>}
      {defi.type === 'theta' && <IndiceDefi cache={false}>θ ≈ AB / D, avec AB et D dans la même unité (en mm) ; le résultat est en radian : multipliez par 1000 pour obtenir des mrad.</IndiceDefi>}
      {defi.type === 'gross' && <IndiceDefi cache={false}>G = θ′ / θ = <em>d</em><sub>m</sub> / <em>f′</em>, avec <em>d</em><sub>m</sub> = 25{NB}cm et <em>f′</em> dans la même unité.</IndiceDefi>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="ol-verif" onClick={verifierDefi} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {avecIndices(defi.ok ? `✓ Correct. Valeur de la simulation : ${defi.type === 'accomm' ? `f′ = ${fm(defi.vrai, 1)}${NB}mm` : defi.type === 'theta' ? `θ = ${fm(defi.vrai, 2)}${NB}mrad` : `G = ${fm(defi.vrai, 1)}`}.`
          : defi.type === 'accomm' ? '✗ L’image n’est pas encore nette sur la rétine : modifiez f′ (1/f′ = 1/L + 1/D).'
            : defi.type === 'theta' ? '✗ Vérifiez : θ ≈ AB / D avec AB et D dans la même unité (mm), puis passez des radians aux mrad (× 1000).' : '✗ Vérifiez : G = dm / f′ avec dm = 25 cm et f′ en cm.')}
      </div>}
    </div>);

  // ════════════════ HYPOTHÈSES, MESURES, RÉGLAGES ════════════════
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Œil réduit emmétrope</strong> : le cristallin et la cornée sont remplacés par une lentille mince convergente de distance focale variable ; la rétine est un écran plan à L = 17,0 mm. L’œil n’a aucun défaut de vision (ni myopie, ni hypermétropie).</li>
      <li><strong>Lentille mince, approximation de Gauss</strong>, lumière monochromatique : on néglige les aberrations. La netteté sur la rétine est jugée à ± 0,1 mm près (la diffraction par la pupille est ignorée).</li>
      <li><strong>Accommodation</strong> : la distance focale du cristallin peut varier ; la plage affichée (15,0 à 17,5 mm) est plus large que celle d’un œil réel pour laisser des erreurs possibles. La distance minimale de vision distincte est d<sub>m</sub> = 25 cm.</li>
      <li><strong>Diamètre apparent</strong> : θ ≈ {avecIndices('frac(AB|D)')} pour les petits angles, en radian (erreur inférieure à 1 % tant que θ &lt; 0,25 rad). <strong>Pouvoir séparateur</strong> de l’œil : ε ≈ 3×10⁻⁴ rad (environ 1′), un ordre de grandeur : il varie d’une personne à l’autre.</li>
      <li><strong>Loupe</strong> : lentille mince convergente, œil collé à la loupe ; objet-plan de hauteur 0,50 cm. G = {avecIndices('frac(θ′|θ)')} = {avecIndices('frac(d_m|f′)')} suppose l’objet dans le plan focal objet (image à l’infini).</li>
      <li><strong>Dessins</strong> : dans l’œil, l’échelle est la même sur l’axe et en hauteur ; la distance à l’objet et la taille de l’objet sont <em>hors échelle</em> (axe interrompu) ; pour l’angle et la loupe, l’échelle verticale est agrandie.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const theta = vue === 'angle' ? M.diametreApproche(PE.AB * 10, PE.D * 10) : M.diametreApproche(M.AB_OEIL, Dc * 10);
  const imO = M.positionImageOeil(Dc * 10, feEff);
  const imL = M.imageLoupe(PE.dl, PE.fl);
  const accL = M.accommodationPourImage(PE.dl, PE.fl);
  const sg = v => (v < 0 ? `−${fm(Math.abs(v))}` : fm(v));
  const mesures = (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {vue === 'oeil' && <>
        <LigneMesure nom="Distance de l’objet D" valeur={PE.inf ? 'à l’infini' : `${fm(PE.D, 0)}${NB}cm`} couleur={C.obj}/>
        {(!enGuide || idE === 'accomm') && <LigneMesure nom="Distance focale du cristallin f′" valeur={`${fm(feEff, 2)}${NB}mm`} couleur={C.lent}/>}
        {enExplore && <LigneMesure nom="Position de l’image OA′" valeur={`${fm(imO, 2)}${NB}mm`} couleur={C.img}/>}
        <LigneMesure nom="Image sur la rétine" valeur={nette ? 'nette' : imO > M.L_OEIL ? 'floue (image derrière la rétine)' : 'floue (image devant la rétine)'} couleur={nette ? '#15803d' : '#dc2626'}/>
      </>}
      {vue === 'angle' && <>
        <LigneMesure nom="Distance de l’objet D" valeur={`${fm(PE.D, 0)}${NB}cm`} couleur={C.obj}/>
        <LigneMesure nom="Taille de l’objet AB" valeur={PE.AB < 0.1 ? `${fm(PE.AB * 10, 2)}${NB}mm` : `${fm(PE.AB, 1)}${NB}cm`} couleur={C.obj}/>
        {depuis('sep') && <LigneMesure nom="Diamètre apparent θ" valeur={`${fm(theta * 1000, theta * 1000 < 1 ? 2 : 0)}${NB}mrad`} couleur={C.theta}/>}
        {(enExplore || idE === 'sep' || idE === 'sep2') && <LigneMesure nom="Pouvoir séparateur ε (ordre de grandeur)" valeur={`0,3${NB}mrad`} couleur="#64748b"/>}
        {enExplore && <LigneMesure nom="Un détail de taille AB est-il discernable ?" valeur={M.separes(theta) ? 'oui (θ ≥ ε)' : 'non (θ < ε)'} couleur={M.separes(theta) ? '#15803d' : '#dc2626'}/>}
      </>}
      {vue === 'loupe' && <>
        <LigneMesure nom="Position de l’objet OA" valeur={`−${fm(PE.dl)}${NB}cm`} couleur={C.obj}/>
        <LigneMesure nom="Distance focale de la loupe f′" valeur={`${fm(PE.fl)}${NB}cm`} couleur={C.foyer}/>
        {(enExplore || depuis('thetap')) && <LigneMesure nom="Position de l’image OA′" valeur={isFinite(imL.OAp) ? `${sg(imL.OAp)}${NB}cm` : 'à l’infini'} couleur={C.img}/>}
        {(enExplore || depuis('theta0')) && <LigneMesure nom="Diamètre apparent θ′ (avec la loupe)" valeur={`${fm(M.thetaPrime(M.AB_LOUPE, PE.dl) * 1000, 0)}${NB}mrad`} couleur={C.theta}/>}
        {(enExplore || depuis('gross')) && <LigneMesure nom="Diamètre apparent θ (œil nu, 25 cm)" valeur={`${fm(M.thetaNu(M.AB_LOUPE) * 1000, 0)}${NB}mrad`} couleur="#64748b"/>}
        {(enExplore || depuis('bravo')) && <LigneMesure nom="Grossissement G = θ′ / θ" valeur={fm(M.thetaPrime(M.AB_LOUPE, PE.dl) / M.thetaNu(M.AB_LOUPE), 1)} couleur="#b45309"/>}
        {enExplore && <LigneMesure nom="Nature de l’image" valeur={!isFinite(imL.OAp) ? 'à l’infini' : `${imL.nature === 'reelle' ? 'réelle' : 'virtuelle'}, ${imL.droite ? 'droite' : 'renversée'}`}/>}
        {enExplore && <LigneMesure nom="Œil derrière la loupe" valeur={!isFinite(imL.OAp) ? 'au repos (f′ = 17,0 mm)' : accL == null ? 'ne voit pas net' : `accommode (f′ = ${fm(accL, 1)} mm)`} couleur={accL == null && isFinite(imL.OAp) ? '#dc2626' : '#15803d'}/>}
      </>}
    </div>);
  const curF = <Curseur nom="Distance focale du cristallin f′" valeur={P.fe} onChange={v => setP(p => ({ ...p, fe: v }))} min={M.FE_MIN} max={M.FE_MAX} pas={0.05} unite="mm" decimales={2} couleur={C.lent}/>;
  const curD = <Curseur nom="Distance de l’objet D" valeur={P.D} onChange={v => setP(p => ({ ...p, D: v, inf: false }))} min={M.D_MIN} max={vue === 'angle' ? 150 : M.D_MAX} pas={5} unite="cm" decimales={0} couleur="#0f172a"/>;
  const curAB = <Curseur nom="Taille de l’objet AB" valeur={P.AB} onChange={v => setP(p => ({ ...p, AB: v }))} min={0.5} max={5} pas={0.5} unite="cm" decimales={1} couleur="#0f172a"/>;
  const curDl = <Curseur nom="Position de l’objet OA" valeur={-P.dl} onChange={v => setP(p => ({ ...p, dl: -v }))} min={-M.DL_MAX} max={-M.DL_MIN} pas={0.1} unite="cm" decimales={1} couleur="#0f172a"/>;
  const curFl = <Curseur nom="Distance focale de la loupe f′" valeur={P.fl} onChange={v => setP(p => ({ ...p, fl: v, dl: Math.min(p.dl, M.DL_MAX) }))} min={M.FL_MIN} max={M.FL_MAX} pas={0.5} unite="cm" decimales={1} couleur="#0369a1"/>;
  const reglagesGuide = (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {vue === 'oeil' && curF}
      {vue === 'angle' && <>{curD}</>}
      {vue === 'loupe' && curDl}
    </div>);
  const boutonsBascule = (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
      {vue === 'oeil' && <>
        <button onClick={() => setP(p => ({ ...p, inf: !p.inf }))} aria-pressed={P.inf} style={stylePetitBouton(P.inf, '#334155')}>{P.inf ? '☑' : '☐'} objet à l’infini</button>
        <button onClick={() => setAuto(a => !a)} aria-pressed={auto} style={stylePetitBouton(auto, '#334155')}>{auto ? '☑' : '☐'} accommodation automatique</button></>}
      {vue === 'angle' && <button onClick={() => setFantome(a => !a)} aria-pressed={fantome} style={stylePetitBouton(fantome, '#334155')}>{fantome ? '☑' : '☐'} comparer avec 25 cm</button>}
    </div>);
  const reglagesExplore = (
    <div style={styleBoite}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {VUES.map(([k, l]) => <button key={k} onClick={() => setP(p => ({ ...p, vue: k }))} aria-pressed={vue === k} style={stylePetitBouton(vue === k, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {vue === 'oeil' && <>{!P.inf && curD}{auto ? <FCurseurNote>Accommodation automatique : <strong>f′ = {fm(feEff, 2)}{NB}mm</strong>.</FCurseurNote> : curF}</>}
      {vue === 'angle' && <>{curD}{curAB}</>}
      {vue === 'loupe' && <>{curDl}{curFl}</>}
      {boutonsBascule}
    </div>);
  const reglagesDefi = defi && (defi.type === 'accomm' ? (
    <div style={styleBoite}><div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <Curseur nom="Distance focale du cristallin f′" valeur={defi.p.fe} onChange={v => majDefi({ fe: v })} min={M.FE_MIN} max={M.FE_MAX} pas={0.05} unite="mm" decimales={2} couleur={C.lent}/></div>
  ) : null);

  // ════════════════ SCÈNE ════════════════
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {(() => {
        const sch = { oeil: { D: Dc, fe: feEff, rayons: true, etiquettes: true },
          angle: { D: PE.D, AB: PE.AB, fantome: (enExplore && fantome) || idE === 'diam', texte: enExplore, nomAB: PE.AB < 0.1 ? `écart ${fm(PE.AB * 10, 2)}${NB}mm` : `AB = ${fm(PE.AB, 1)}${NB}cm` },
          loupe: { d: PE.dl, f: PE.fl, AB: M.AB_LOUPE, rayons: true, etiquettes: true, theta: enExplore || (enGuide && depuis('theta0')) } };
        if (enExplore) return <SceneAnimee vue={vue} schema={sch[vue]} setD={v => setP(p => ({ ...p, D: v, inf: false }))} setDl={v => setP(p => ({ ...p, dl: v }))}/>;
        return (<>{vue === 'oeil' && <SchemaOeil {...sch.oeil}/>}{vue === 'angle' && <SchemaAngle {...sch.angle}/>}{vue === 'loupe' && <SchemaLoupe {...sch.loupe}/>}</>);
      })()}
    </div>);
  const aEssayer = indicesProfond(
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Œil : placez l’objet à 25 cm, cristallin au repos (f′ = 17 mm). Où se forme l’image ? Réglez f′ pour la ramener sur la rétine.</li>
        <li>Œil : activez l’accommodation automatique et éloignez l’objet. Comment varie f′ ? Quelle est sa valeur pour un objet à l’infini ?</li>
        <li>Diamètre apparent : doublez D. Que devient θ ? Doublez AB. Que devient θ ?</li>
        <li>Diamètre apparent : choisissez un détail de 0,5 cm (AB) : à quelle distance maximale l’œil le sépare-t-il encore (θ ≥ ε) ?</li>
        <li>Loupe : placez l’objet en F. Où est l’image ? Éloignez-le un peu : l’œil doit-il accommoder ?</li>
        <li>Loupe : comparez G pour f′ = 10 cm et f′ = 2,5 cm. Quelle loupe est la plus puissante ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>œil réduit : lentille de focale f′ variable + rétine à 17 mm ; image nette ⇔ sur la rétine ; objet proche ⇒ f′ diminue</li>
        <li>diamètre apparent : θ ≈ {avecIndices('frac(AB|D)')} (rad) ; détails séparés si θ ≥ ε ≈ 3×10⁻⁴ rad</li>
        <li>loupe : objet dans le plan focal, image à l’infini ; G = {avecIndices('frac(θ′|θ)')} = {avecIndices('frac(d_m|f′)')} (d<sub>m</sub> = 25 cm)</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ol-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ol-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ol-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .ol-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); }
        .ol-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .ol-l1.cote .ol-carte { order: 2; } .ol-l1.cote .ol-main { order: 1; } }
        @media (max-width: 900px) { .ol-l1.cote, .ol-pri { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>L’œil et la loupe</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Comment l’œil forme-t-il une image nette sur la rétine, comment juge-t-il la taille d’un objet, et comment une <strong>loupe</strong> permet-elle de mieux voir ? Modélisez l’œil, mesurez un <strong>diamètre apparent</strong> et calculez un <strong>grossissement</strong>.</div>
      <div className={`ol-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {enGuide ? <div className="ol-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="ol-carte">{panneauHypo}</div> : null}
        <div className="ol-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'accomm' ? suiviA : defi.type === 'theta' ? suiviT : suiviG}/></div>}
          <div className={`ol-pri${mode !== 'explore' ? ' pile' : ''}`}>
            {scene}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {enGuide ? (idE !== 'modele' && reglagesGuide) : enDefi ? reglagesDefi : reglagesExplore}
              {(enExplore || (enGuide && depuis('accomm'))) && mesures}
            </div>
          </div>
        </div>
      </div>
      {(enExplore || (enGuide && etape >= ETAPES.length - 1)) && <div className="ol-l2">{panneauHypo}</div>}
      {enExplore && <div className="ol-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
