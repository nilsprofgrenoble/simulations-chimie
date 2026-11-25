import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, LigneMesure, IndiceDefi, indicesProfond, avecIndices } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./pvcModele";
import { QCM_PARCOURS as Q } from "./pvcQcm";
import { SceneCellule, SceneSeuil, SankeyBilan, SvgCarteCellule, SvgCarteEnergie, SvgCarteSeuil, SvgCartePuissances, SvgCartePertes, SvgCarteBilanPvc } from "./pvcSchemas";

const SIM_ID = 242, CLE_GUIDE = 'cellule-pv-tg-guide-v1';
declarerDefis(SIM_ID, [['rendement', 'Rendement d’une cellule'], ['seuil', 'Seuil d’absorption et longueur d’onde']]);

// ====================================================
// SIM 242 — CELLULE PHOTOVOLTAÏQUE : DU PHOTON AU RENDEMENT
//  (TG spé PC, « Décrire la lumière par un flux de photons » : absorption et émission de photons, enjeux énergétiques, rendement d'une cellule
//  photovoltaïque). Capacités visées (jamais affichées à l'élève) : expliquer qualitativement le fonctionnement d'une cellule photoélectrique ;
//  citer des applications de l'interaction photon-matière (cellules photovoltaïques) ; déterminer le rendement d'une cellule photovoltaïque.
//  Modèle : pvcModele.js (test : pvcModele.test.mjs).
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sci = (x, d = 2) => { const e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e; return `${nbf(m, d)}×10${String(e).replace('-', '−').split('').map(c => SUP[c === '−' ? '-' : c]).join('')}`; };
const BLEU = '#0369a1';
const IDS = ['photon', 'energie', 'seuil', 'limites', 'puissance', 'electrique', 'rendement', 'pertes', 'comparer', 'bilan'];
const I = Object.fromEntries(IDS.map((d, k) => [d, k]));

// ---------- formules (MathML) ----------
const sur = (a, b) => <mfrac>{a}{b}</mfrac>;
const Eph = <msub><mi>E</mi><mtext>ph</mtext></msub>;
const Es = <msub><mi>E</mi><mtext>seuil</mtext></msub>;
const Prec = <msub><mi>P</mi><mtext>reçue</mtext></msub>;
const Pel = <msub><mi>P</mi><mtext>él</mtext></msub>;
const FEph = <Formule>{Eph}<mo>=</mo>{sur(<mrow><mi>h</mi><mo>×</mo><mi>c</mi></mrow>, <mi>λ</mi>)}</Formule>;
const eEph = <FormuleEnLigne>{Eph}<mo>=</mo>{sur(<mrow><mi>h</mi><mo>×</mo><mi>c</mi></mrow>, <mi>λ</mi>)}</FormuleEnLigne>;
const eRec = <FormuleEnLigne>{Prec}<mo>=</mo><mi>E</mi><mo>×</mo><mi>S</mi></FormuleEnLigne>;
const eEl = <FormuleEnLigne>{Pel}<mo>=</mo><mi>U</mi><mo>×</mo><mi>I</mi></FormuleEnLigne>;
const eEta = <FormuleEnLigne><mi>η</mi><mo>=</mo>{sur(Pel, Prec)}</FormuleEnLigne>;
const FEta = <Formule><mi>η</mi><mo>=</mo>{sur(Pel, Prec)}</Formule>;
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const CST = <>h = 6,63×10⁻³⁴{NB}J·s ; c = 3,00×10⁸{NB}m·s⁻¹ ; 1{NB}eV = 1,60×10⁻¹⁹{NB}J</>;
const SI = M.cellule('si-mono');
const E500 = M.energieEv(500), LMAX = M.lambdaMaxNm(1.12);
const PREC0 = M.recue(800, 0.015), PEL0 = M.electrique(0.50, 5.0), ETA0 = 100 * M.rendement(PEL0, PREC0);

function Controle({ nom, valeur, min, max, pas, onChange, texte, retablir = 'Rétablir', onRetablir }) {
  const btn = { ...styleBouton(false), padding: '6px 14px', minHeight: 40, minWidth: 44, fontSize: 18, lineHeight: 1 };
  const dec = Math.max(0, -Math.floor(Math.log10(pas))), arr = x => Math.max(min, Math.min(max, Number(x.toFixed(dec + 1))));
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', columnGap: 8, rowGap: 2, fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}><span>{nom}</span><span style={{ color: KIT.txt, textAlign: 'right', whiteSpace: 'nowrap' }}>{avecIndices(texte)}</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button aria-label={`Diminuer : ${nom}`} onClick={() => onChange(arr(valeur - pas))} style={btn}>−</button>
        <input type="range" min={min} max={max} step={pas} value={valeur} onChange={e => onChange(Number(e.target.value))} aria-label={nom} style={{ flex: 1, minWidth: 0, accentColor: BLEU, height: 28 }}/>
        <button aria-label={`Augmenter : ${nom}`} onClick={() => onChange(arr(valeur + pas))} style={btn}>+</button>
      </div>
      <div style={{ marginTop: 6 }}><button onClick={onRetablir} style={stylePetitBouton(false)}><Pic n="refresh"/>{retablir}</button></div>
    </div>);
}

export function SimulationCellulePhotovoltaique() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviR, noterR] = useCompteurDefi(), [suiviS, noterS] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('rendement');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ lumiere: false, photon: false, essayer: false, retenir: false });
  const [anim, setAnim] = useState(() => typeof window === 'undefined' || !window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const EX0 = { c: 'si-mono', E: 800, S: 0.015, L: 600 };
  const [ex, setEx] = useState(EX0);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;

  const etape = guide.etape, _idx = enGuide ? Math.min(etape, IDS.length - 1) : -1;
  const deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- état de l'exploration ----------
  const ce = M.cellule(ex.c), PrecEx = M.recue(ex.E, ex.S), PelEx = ce.eta * PrecEx, EphEx = M.energieEv(ex.L), LmEx = M.lambdaMaxNm(ce.gap), absEx = EphEx >= ce.gap;

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'photon', titre: 'Du photon au courant', focus: ['scene'],
      texte: <>Une <strong>cellule photovoltaïque</strong> transforme de la lumière en électricité. La lumière est un flux de <strong>photons</strong> (points jaunes du schéma). Quand un photon est absorbé par la cellule, un électron est libéré ; la structure de la cellule l’envoie vers la face avant (borne −) pendant qu’un manque d’électron (+) part vers la face arrière (borne +). Reliées à une lampe, les bornes mettent les électrons en mouvement dans le circuit : c’est un courant électrique.</>,
      tache: { type: 'qcm', q: 'Que se passe-t-il quand un photon est absorbé par la cellule ?', options: Q.photon.options, bonne: 0,
        expl: 'Le photon cède son énergie à la cellule : un électron est libéré. La structure de la cellule l’oriente vers une borne, ce qui crée un courant dans le circuit. La chaleur n’est pas la cause du courant, et un photon absorbé n’est jamais « sans effet ».',
        indice: 'Regardez le schéma : que devient le photon quand il atteint la cellule, et quelle petite boule bleue (−) apparaît alors ?' } },
    { id: 'energie', titre: 'L’énergie d’un photon', focus: [], retenirTitre: 'Du photon au courant', retenir: <>
        <SvgCarteCellule/>
        <ul style={ULS}>
          <li>Un photon absorbé libère un électron ; la structure de la cellule dirige les électrons vers la borne −, puis ils circulent dans le circuit jusqu’à la borne +.</li>
          <li>Dans le circuit, les électrons vont de la borne − vers la borne + ; le sens conventionnel du courant I est l’inverse.</li>
          <li>Moyen de s’en souvenir : <strong>« un photon, un électron libéré »</strong>. Idée fausse : « la cellule stocke la lumière ». Vrai : elle la convertit immédiatement, et sans lumière il n’y a plus de courant.</li>
        </ul></>,
      texte: <>Un photon de longueur d’onde λ transporte l’énergie{FEph}{CST}. Attention : λ s’exprime en <strong>mètres</strong> dans cette formule (1{NB}nm = 10⁻⁹{NB}m). Les énergies de photons sont si petites qu’on les donne souvent en <strong>électronvolts</strong> (eV). Un photon vert a pour longueur d’onde <strong>λ = 500{NB}nm</strong>.</>,
      tache: { type: 'num', q: 'Quelle est l’énergie E_ph d’un photon de longueur d’onde 500 nm, en eV ?', unite: 'eV', vrai: E500, tol: 0.03, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['λ = 500 nm = 500×10⁻⁹ m = 5,00×10⁻⁷ m.', <>E<sub>ph</sub> = {avecIndices('frac(6,63×10⁻³⁴ × 3,00×10⁸|5,00×10⁻⁷)')} ≈ 3,98×10⁻¹⁹ J, soit 3,98×10⁻¹⁹ / 1,60×10⁻¹⁹ ≈ 2,49 eV.</>],
        pieges: [[M.energieJ(500), 'Ce résultat est en joules : divisez par 1,60×10⁻¹⁹ pour l’obtenir en électronvolts.'], [M.energieEv(500) * 1e-9, 'λ doit être en mètres : 500 nm = 500×10⁻⁹ m.']],
        expl: <>E<sub>ph</sub> = {avecIndices('frac(6,63×10⁻³⁴ × 3,00×10⁸|500×10⁻⁹)')} ≈ 3,98×10⁻¹⁹ J ≈ 2,49 eV : un photon de lumière visible transporte quelques électronvolts.</>,
        indice: <>{eEph}, avec λ = 500×10⁻⁹ m ; le résultat est en joules, puis divisez par 1,60×10⁻¹⁹ pour passer aux eV.</> } },
    { id: 'seuil', titre: 'Le seuil d’absorption', focus: [], retenirTitre: 'L’énergie d’un photon', retenir: <>
        <SvgCarteEnergie/>
        <ul style={ULS}>
          <li>Énergie d’un photon : E<sub>ph</sub> = h × c divisé par λ, avec λ en mètres ; 1 eV = 1,60×10⁻¹⁹ J.</li>
          <li>Plus la longueur d’onde est petite, plus le photon est énergétique : un photon bleu transporte plus d’énergie qu’un photon rouge.</li>
          <li>Moyen de s’en souvenir : <strong>« petite longueur d’onde, grande énergie »</strong>. Idée fausse : « un photon plus intense est plus énergétique ». Vrai : l’intensité compte les photons ; l’énergie de chacun dépend de λ.</li>
        </ul></>,
      texte: <>Pour qu’un photon soit absorbé et libère un électron dans le silicium, son énergie doit être au moins égale à l’<strong>énergie seuil</strong> du silicium (les physiciens parlent de « gap ») : <strong>E<sub>seuil</sub> = 1,12{NB}eV</strong>. Un photon d’énergie plus petite traverse la cellule sans effet. Cela impose une longueur d’onde <strong>maximale</strong>.</>,
      tache: { type: 'num', q: 'Quelle est la longueur d’onde maximale λ_max d’un photon que le silicium peut absorber, en nm ?', unite: 'nm', vrai: LMAX, tol: 0.03, affiche: v => nbf(v, 0), cs: 3,
        calcul: () => ['E_seuil = 1,12 eV = 1,12 × 1,60×10⁻¹⁹ J = 1,79×10⁻¹⁹ J.', <>λ<sub>max</sub> = {avecIndices('frac(h × c|E_seuil)')} = {avecIndices('frac(6,63×10⁻³⁴ × 3,00×10⁸|1,79×10⁻¹⁹)')} ≈ 1,11×10⁻⁶ m = 1110 nm (infrarouge proche).</>],
        pieges: [[LMAX * 1e-9, 'Ce résultat est en mètres : exprimez-le en nanomètres (× 10⁹).'], [M.H * M.C / 1.12 * 1e9, 'L’énergie seuil doit être en joules : 1,12 eV = 1,12 × 1,60×10⁻¹⁹ J.']],
        expl: <>λ<sub>max</sub> = {avecIndices('frac(h × c|E_seuil)')} ≈ 1,11×10⁻⁶ m = 1110 nm : au-delà, dans l’infrarouge, les photons ne sont plus assez énergétiques.</>,
        indice: <>E<sub>ph</sub> = h × c divisé par λ vaut E<sub>seuil</sub> quand λ = λ<sub>max</sub> : λ<sub>max</sub> = h × c divisé par E<sub>seuil</sub>, avec E<sub>seuil</sub> converti en joules (× 1,60×10⁻¹⁹).</> } },
    { id: 'limites', titre: 'Pourquoi un rendement limité ?', focus: ['seuil'],
      texte: <>Le Soleil envoie des photons de toutes les longueurs d’onde : ultraviolet, visible et infrarouge. Le silicium absorbe ceux dont la longueur d’onde est inférieure à 1110{NB}nm. Un photon bleu a plus d’énergie que le minimum nécessaire pour libérer un électron : <strong>l’énergie en excès</strong> n’est pas récupérée.</>,
      tache: { type: 'qcm', q: 'Pourquoi une cellule en silicium ne convertit-elle pas toute la lumière reçue en électricité ?', options: Q.limites.options, bonne: 0,
        expl: 'Deux limites : les photons d’énergie inférieure au seuil (infrarouge lointain) ne sont pas absorbés ; et pour les photons plus énergétiques que le seuil, seule l’énergie du seuil est utile, l’excédent chauffe la cellule. D’autres pertes existent (réflexion, résistance des contacts).',
        indice: 'Regardez la zone à droite du seuil (photons trop faibles en énergie) et se rappeler ce que devient l’énergie d’un photon bleu qui dépasse le minimum.' } },
    { id: 'puissance', titre: 'La puissance reçue', focus: [], retenirTitre: 'Le seuil d’absorption', retenir: <>
        <SvgCarteSeuil/>
        <ul style={ULS}>
          <li>Un photon n’est absorbé que si E<sub>ph</sub> est au moins égale à E<sub>seuil</sub> (silicium : 1,12 eV, soit λ inférieure à 1110 nm).</li>
          <li>L’énergie des photons non absorbés est perdue ; l’excédent des photons très énergétiques est perdu en chaleur.</li>
          <li>Moyen de s’en souvenir : <strong>« assez d’énergie ou rien »</strong>. Idée fausse : « beaucoup de photons faibles font autant qu’un photon énergétique ». Vrai : en dessous du seuil, aucun électron n’est libéré, même en grand nombre.</li>
        </ul></>,
      texte: <>On passe au bilan de puissance. L’<strong>éclairement</strong> E est la puissance lumineuse reçue par mètre carré de cellule (en W·m⁻²) : la cellule de surface S reçoit donc{' '}{eRec}. Une cellule de <strong>S = 0,0150{NB}m²</strong> (150{NB}cm²) est éclairée avec <strong>E = 800{NB}W·m⁻²</strong> (un peu moins que le plein Soleil, environ 1000{NB}W·m⁻²).</>,
      tache: { type: 'num', q: 'Quelle puissance lumineuse P_reçue la cellule reçoit-elle, en W ?', unite: 'W', vrai: PREC0, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['E = 800 W·m⁻² ; S = 0,0150 m².', <>P<sub>reçue</sub> = E × S = 800 × 0,0150 = 12,0 W.</>],
        pieges: [[800, 'L’éclairement est une puissance par mètre carré : il faut multiplier par la surface S.'], [800 / 0.015, 'Il faut multiplier par S, pas diviser.']],
        expl: <>P<sub>reçue</sub> = E × S = 800 × 0,0150 = 12,0 W : en moyenne, la cellule reçoit 12,0 joules de lumière par seconde.</>,
        indice: <>{eRec}, avec E en W·m⁻² et S en m² : le produit est en watts.</> } },
    { id: 'electrique', titre: 'La puissance électrique', focus: [],
      texte: <>Cette cellule alimente un récepteur : elle fournit une tension <strong>U = 0,50{NB}V</strong> et une intensité <strong>I = 5,0{NB}A</strong>. La puissance électrique qu’elle délivre est{' '}{eEl}.</>,
      tache: { type: 'num', q: 'Quelle puissance électrique P_él la cellule délivre-t-elle, en W ?', unite: 'W', vrai: PEL0, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['U = 0,50 V ; I = 5,0 A.', <>P<sub>él</sub> = U × I = 0,50 × 5,0 = 2,5 W.</>],
        pieges: [[0.5 / 5, 'La puissance est le produit U × I, pas le quotient.'], [5.5, 'La puissance est le produit U × I, pas la somme.']],
        expl: <>P<sub>él</sub> = U × I = 0,50 × 5,0 = 2,5 W.</>,
        indice: <>{eEl} : une tension en volts multipliée par une intensité en ampères donne des watts.</> } },
    { id: 'rendement', titre: 'Le rendement', focus: [],
      texte: <>Le <strong>rendement</strong> η compare ce que la cellule fournit sous forme d’électricité à ce qu’elle reçoit sous forme de lumière :{FEta}C’est un nombre sans unité, plus petit que 1, qu’on exprime souvent en pourcentage. Ici, la cellule reçoit P<sub>reçue</sub> = <strong>12,0{NB}W</strong> et délivre P<sub>él</sub> = <strong>2,5{NB}W</strong>.</>,
      tache: { type: 'num', q: 'Quel est le rendement η de la cellule, en % ?', unite: '%', vrai: ETA0, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['P_reçue = 12,0 W ; P_él = 2,5 W.', <>η = {avecIndices('frac(P_él|P_reçue)')} = {avecIndices('frac(2,5|12,0)')} ≈ 0,21, soit 21 %.</>],
        pieges: [[PREC0 / PEL0, 'Le rendement est P_él divisé par P_reçue (utile sur reçue), pas l’inverse.'], [PEL0 / PREC0, 'Ce nombre est le rendement sous forme décimale : exprimez-le en pourcentage (× 100).']],
        expl: <>η = {avecIndices('frac(2,5|12,0)')} ≈ 0,21 = 21 % : une cellule en silicium de qualité courante convertit environ un cinquième de la lumière qu’elle reçoit.</>,
        indice: <>{eEta}, avec P<sub>él</sub> = 2,5 W et P<sub>reçue</sub> = 12,0 W ; multipliez par 100 pour obtenir des %.</> } },
    { id: 'pertes', titre: 'Les pertes', focus: [], retenirTitre: 'Puissance et rendement', retenir: <>
        <SvgCartePuissances/>
        <ul style={ULS}>
          <li>P<sub>reçue</sub> = E × S (éclairement fois surface) ; P<sub>él</sub> = U × I ; η = P<sub>él</sub> divisé par P<sub>reçue</sub>, sans unité, souvent en %.</li>
          <li>Le rendement est toujours inférieur à 100 % : la cellule ne peut pas fournir plus d’énergie qu’elle n’en reçoit.</li>
          <li>Moyen de s’en souvenir : <strong>« utile sur reçu »</strong>. Idée fausse : « un rendement de 21 % veut dire qu’il manque 21 % ». Vrai : 21 % est la part convertie en électricité ; les 79 % restants sont les pertes.</li>
        </ul></>,
      texte: <>La puissance reçue qui n’est pas convertie en électricité constitue les <strong>pertes</strong> : pertes = P<sub>reçue</sub> − P<sub>él</sub>. Avec P<sub>reçue</sub> = <strong>12,0{NB}W</strong> et P<sub>él</sub> = <strong>2,5{NB}W</strong>, calculez-les.</>,
      tache: { type: 'num', q: 'Quelle puissance P_pertes est perdue, en W ?', unite: 'W', vrai: PREC0 - PEL0, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['P_reçue = 12,0 W ; P_él = 2,5 W.', <>P<sub>pertes</sub> = P<sub>reçue</sub> − P<sub>él</sub> = 12,0 − 2,5 = 9,5 W.</>],
        pieges: [[PREC0 + PEL0, 'Les pertes sont une différence : reçue moins électrique.']],
        expl: <>P<sub>pertes</sub> = 12,0 − 2,5 = 9,5 W : l’essentiel de la lumière reçue est converti en chaleur ou n’est pas absorbé, et la cellule chauffe au soleil.</>,
        indice: 'Ce qui n’est pas devenu électricité est perdu : soustrayez la puissance électrique de la puissance reçue.' } },
    { id: 'comparer', titre: 'Prévoir l’effet de l’éclairement', focus: ['sankey'], retenirTitre: 'Le bilan de puissance', retenir: <>
        <SvgCartePertes/>
        <ul style={ULS}>
          <li>Pertes = P<sub>reçue</sub> − P<sub>él</sub> ; avec un rendement de 20 %, les pertes valent 80 % de la puissance reçue.</li>
          <li>Pertes : photons non absorbés, excédent d’énergie des photons très énergétiques, réflexion à la surface, résistance des contacts. Elles se retrouvent surtout en chaleur.</li>
          <li>Moyen de s’en souvenir : <strong>« ce qui n’est pas électricité est chaleur »</strong>. Idée fausse : « l’énergie perdue disparaît ». Vrai : l’énergie se conserve, mais elle prend une forme inutile (chaleur).</li>
        </ul></>,
      texte: <>On éclaire la même cellule avec un éclairement <strong>deux fois plus grand</strong> (E passe de 800 à 1600{NB}W·m⁻², S inchangée). On suppose que le rendement <strong>reste le même</strong> (hypothèse du modèle).</>,
      tache: { type: 'qcm', q: 'Que devient la puissance électrique P_él délivrée par la cellule ?', options: Q.comparer.options, bonne: 0,
        expl: <>{eRec} : si E double, P<sub>reçue</sub> double. Avec η constant, P<sub>él</sub> = η × P<sub>reçue</sub> double aussi : la puissance électrique est proportionnelle à l’éclairement. (En réalité, le rendement varie un peu avec l’éclairement et la température.)</>,
        indice: <>{eRec} : que devient P<sub>reçue</sub> quand E double ? Puis P<sub>él</sub> = η × P<sub>reçue</sub> avec η inchangé.</> } },
    { id: 'bilan', titre: 'Le bilan', focus: [], retenirTitre: 'Méthode pour une cellule', retenir: <>
        <SvgCarteBilanPvc/>
        <ul style={ULS}>
          <li>Photon : E<sub>ph</sub> = h × c divisé par λ ; absorbé si E<sub>ph</sub> est au moins égale à E<sub>seuil</sub>.</li>
          <li>Bilan : P<sub>reçue</sub> = E × S ; P<sub>él</sub> = U × I ; η = P<sub>él</sub> divisé par P<sub>reçue</sub> ; pertes = P<sub>reçue</sub> − P<sub>él</sub>.</li>
          <li>Moyen de s’en souvenir : <strong>« photon, puissance, rendement »</strong>. Idée fausse : « un meilleur matériau convertit toute la lumière ». Vrai : un rendement de quelques dizaines de % est déjà excellent, car chaque photon ne donne qu’un électron et l’énergie en excès est perdue.</li>
        </ul></>,
      texte: <>Vous savez relier l’énergie des photons {eEph} au seuil d’absorption {Es} de la cellule, calculer la puissance reçue {eRec}, la puissance électrique {eEl}, le rendement {eEta} et les pertes. Passez à l’exploration (cellule, éclairement, surface, longueur d’onde) ou tentez les défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => { setDefi({ ...(type === 'rendement' ? M.tirageRendement() : M.tirageSeuil()), type, s1: '', s2: '', s3: '', verifie: false, essais: 0, corr: false }); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const pr = (v, a, tol) => isFinite(v) && Math.abs(v - a) <= tol * Math.abs(a);
  const TOL = { rendement: [0.05, 0.05, 0.08], seuil: [0.05, 0.05, 0.05] };
  const juste = (d, k, s) => pr(s, d[`rep${k}`], TOL[d.type][k - 1]);
  const verifier = () => {
    const res = [1, 2, 3].map(k => juste(defi, k, lireNombre(defi[`s${k}`] || '')));
    const ok = res.every(Boolean);
    setDefi(d => ({ ...d, verifie: true, ok, res, essais: ok ? d.essais : (d.essais || 0) + 1 }));
    (defi.type === 'rendement' ? noterR : noterS)(ok);
  };
  // Retour diagnostique par question.
  const diagnostic = k => {
    const s = lireNombre(defi[`s${k}`] || ''), vrai = defi[`rep${k}`];
    if (!isFinite(s)) return 'écrivez un nombre (la virgule ou le point conviennent ; 1,79e-19 ou 1,79×10^-19 pour une puissance de dix).';
    if (juste(defi, k, s)) return 'juste.';
    const s1 = lireNombre(defi.s1 || ''), s2 = lireNombre(defi.s2 || '');
    if (defi.type === 'rendement') {
      if (k === 1 && pr(s, defi.E, 0.06)) return 'l’éclairement est une puissance par mètre carré : multipliez par la surface S.';
      if (k === 1 && pr(s, defi.E / defi.S, 0.06)) return 'il faut multiplier E par S, pas diviser.';
      if (k === 2 && pr(s, defi.U / defi.I, 0.06)) return 'la puissance électrique est le produit U × I, pas le quotient.';
      if (k === 2 && pr(s, defi.U + defi.I, 0.06)) return 'la puissance électrique est le produit U × I, pas la somme.';
      if (k === 3 && isFinite(s1) && isFinite(s2) && s1 > 0 && pr(s, 100 * s2 / s1, 0.04)) return 'votre calcul est cohérent avec vos réponses aux questions 1 et 2 : ce sont elles qu’il faut revoir.';
      if (k === 3 && pr(s, vrai / 100, 0.08)) return 'votre résultat est le rendement sous forme décimale : exprimez-le en pourcentage (× 100).';
      if (k === 3 && pr(s, 10000 / vrai, 0.08)) return 'le rendement est P_él divisé par P_reçue (utile sur reçue), pas l’inverse.';
    } else {
      if (k === 1 && pr(s, defi.gap, 0.01)) return 'l’énergie seuil est donnée en eV : convertissez en joules (× 1,60×10⁻¹⁹).';
      if (k === 2 && pr(s, vrai * 1e-9, 0.06)) return 'votre résultat semble en mètres : exprimez la longueur d’onde en nanomètres (× 10⁹).';
      if (k === 2 && isFinite(s1) && s1 > 0 && pr(s, M.H * M.C / s1 * 1e9, 0.04)) return 'votre calcul est cohérent avec votre réponse à la question 1 : c’est celle-là qu’il faut revoir.';
      if (k === 2 && pr(s, M.H * M.C / defi.gap * 1e9, 0.06)) return 'l’énergie seuil doit être en joules avant de diviser h × c : 1 eV = 1,60×10⁻¹⁹ J.';
      if (k === 3 && pr(s, vrai * M.EV, 0.06)) return 'votre résultat semble en joules : divisez par 1,60×10⁻¹⁹ pour obtenir des eV.';
      if (k === 3 && pr(s, vrai * 1e-9, 0.06)) return 'la longueur d’onde doit être en mètres dans E = h × c divisé par λ (1 nm = 10⁻⁹ m).';
    }
    return s < vrai ? 'votre résultat est trop petit : revoyez la formule utilisée.' : 'votre résultat est trop grand : revoyez la formule utilisée.';
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (aria, cle, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6, fontSize: 14 }}>
      <span>{avecIndices(aria)} =</span>
      <input value={defi[cle] || ''} aria-label={aria} onKeyDown={e => e.key === 'Enter' && document.getElementById('pvc-verif')?.click()} onChange={e => setDefi(d => ({ ...d, [cle]: e.target.value, verifie: false, corr: false }))} inputMode="decimal"
        style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.res[+cle.slice(1) - 1] ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
      <span>{unite}</span>
    </div>);
  const f0 = x => nbf(x, 0), f1 = x => nbf(x, 1), f2 = x => nbf(x, 2);
  const solutionDefi = d => d.type === 'rendement'
    ? <>P<sub>reçue</sub> = E × S = {d.E} × {nbf(d.S, 3)} = {f1(d.rep1)} W ; P<sub>él</sub> = U × I = {f2(d.U)} × {f1(d.I)} = {nbf(d.rep2, 2)} W ; η = {avecIndices(`frac(${nbf(d.rep2, 2)}|${f1(d.rep1)})`)} = {nbf(d.rep3 / 100, 3)}, soit {f0(d.rep3)} %. Gardez un chiffre de plus dans les calculs intermédiaires pour ne pas arrondir trop tôt.</>
    : <>E<sub>seuil</sub> = {f2(d.gap)} × 1,60×10⁻¹⁹ = {sci(d.rep1, 2)} J ; λ<sub>max</sub> = {avecIndices('frac(h × c|E_seuil)')} = {avecIndices(`frac(6,63×10⁻³⁴ × 3,00×10⁸|${sci(d.rep1, 2)})`)} = {f0(d.rep2)} nm ; E<sub>ph</sub>({d.L0} nm) = {avecIndices(`frac(h × c|${d.L0}×10⁻⁹)`)} = {f2(d.rep3)} eV, donc le photon de {d.L0} nm {d.absorbe ? `est absorbé (${f2(d.rep3)} eV ≥ ${f2(d.gap)} eV, et ${d.L0} nm < ${f0(d.rep2)} nm)` : `n’est pas absorbé (${f2(d.rep3)} eV < ${f2(d.gap)} eV, et ${d.L0} nm > ${f0(d.rep2)} nm)`}.</>;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['rendement', 'Rendement d’une cellule'], ['seuil', 'Seuil et longueur d’onde']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.type === tp} style={stylePetitBouton(defi.type === tp, BLEU)}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'rendement' ? 'Défi : rendement d’une cellule' : 'Défi : seuil d’absorption et longueur d’onde'}</div>
      {defi.type === 'rendement' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Une cellule photovoltaïque est éclairée avec un éclairement <strong>E = {defi.E}{NB}W·m⁻²</strong>. Sa surface est <strong>S = {nbf(defi.S, 3)}{NB}m²</strong>. Elle délivre une tension <strong>U = {f2(defi.U)}{NB}V</strong> et une intensité <strong>I = {f1(defi.I)}{NB}A</strong>. Donnez vos résultats avec 2 chiffres significatifs (marge acceptée : 5{NB}% pour les questions 1 et 2, 8{NB}% pour le rendement).</div>
        <div style={{ ...lbl, marginBottom: 2 }}><strong>1.</strong> Puissance lumineuse reçue P_reçue, en W.</div>
        {champ('P_reçue', 's1', 'W')}
        <IndiceDefi cache={false}>P<sub>reçue</sub> = E × S (éclairement en W·m⁻² multiplié par la surface en m²).</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>2.</strong> Puissance électrique délivrée P_él, en W.</div>
        {champ('P_él', 's2', 'W')}
        <IndiceDefi cache={false}>P<sub>él</sub> = U × I (tension en volts multipliée par intensité en ampères).</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>3.</strong> Rendement η de la cellule, en %.</div>
        {champ('η', 's3', '%')}
        <IndiceDefi cache={false}>η = P<sub>él</sub> divisé par P<sub>reçue</sub> (utile sur reçue), puis × 100 pour le pourcentage.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un semi-conducteur a pour énergie seuil <strong>E<sub>seuil</sub> = {f2(defi.gap)}{NB}eV</strong>. Données : {CST}. Donnez vos résultats avec 3 chiffres significatifs (marge acceptée : 5{NB}%).</div>
        <div style={{ ...lbl, marginBottom: 2 }}><strong>1.</strong> Énergie seuil en joules (J).</div>
        {champ('E_seuil', 's1', 'J')}
        <IndiceDefi cache={false}>E en J = E en eV × 1,60×10⁻¹⁹ (écrivez par exemple 1,79e-19).</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>2.</strong> Longueur d’onde maximale d’un photon absorbé, λ_max, en nm.</div>
        {champ('λ_max', 's2', 'nm')}
        <IndiceDefi cache={false}>λ<sub>max</sub> = h × c divisé par E<sub>seuil</sub> (en joules) ; le résultat est en mètres : × 10⁹ pour les nanomètres.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>3.</strong> Un photon a pour longueur d’onde <strong>{defi.L0}{NB}nm</strong>. Quelle est son énergie, en eV ? (comparez-la à l’énergie seuil : ce photon est-il absorbé ?)</div>
        {champ('E_ph', 's3', 'eV')}
        <IndiceDefi cache={false}>E<sub>ph</sub> = h × c divisé par λ (λ en mètres : 1 nm = 10⁻⁹ m), puis divisez par 1,60×10⁻¹⁹ pour passer des joules aux eV.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="pvc-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        <div style={{ fontWeight: 700, color: defi.ok ? '#15803d' : '#dc2626' }}>{defi.ok ? '✓ Correct.' : '✗ Pas tout à fait.'}</div>
        {!defi.ok && <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: KIT.txt }}>{[1, 2, 3].map(k => <li key={k}><strong>Question {k}</strong> : {diagnostic(k)}</li>)}</ul>}
        {!defi.ok && !defi.corr && <div style={{ marginTop: 6 }}><button onClick={() => setDefi(d => ({ ...d, corr: true }))} style={stylePetitBouton(false)}>Voir la correction</button></div>}
        {(defi.ok || defi.corr) && <div style={{ marginTop: 6, color: KIT.txt }}>{solutionDefi(defi)}</div>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Modèle de la cellule</strong> : un photon d’énergie E<sub>ph</sub> au moins égale à l’énergie seuil est absorbé et libère un électron ; en dessous, il n’est pas absorbé. L’excédent d’énergie d’un photon plus énergétique est perdu en chaleur. Le schéma est qualitatif : pas à l’échelle, structure interne simplifiée, animation illustrative.</li>
      <li><strong>Énergie d’un photon</strong> : E<sub>ph</sub> = h × c divisé par λ, avec h = 6,63×10⁻³⁴ J·s, c = 3,00×10⁸ m·s⁻¹ et 1 eV = 1,60×10⁻¹⁹ J (valeurs arrondies à 3 chiffres significatifs).</li>
      <li><strong>Matériaux</strong> : énergie seuil (le « gap ») du silicium 1,12 eV, du tellurure de cadmium 1,5 eV (valeurs arrondies de références publiques) ; rendements typiques de modules commerciaux : silicium monocristallin 21 %, silicium polycristallin 17 %, tellurure de cadmium 18 % (arrondis, d’après les données publiques NREL et fabricants). Ils varient selon les fabricants et les années.</li>
      <li><strong>Rendement supposé constant</strong> : dans l’exploration, P<sub>él</sub> = η × P<sub>reçue</sub> avec η fixé par la cellule choisie ; en réalité, η dépend de l’éclairement, de la température de la cellule et de la tension à ses bornes. Éclairement de référence : plein Soleil environ 1000 W·m⁻².</li>
      <li><strong>Un photon, un électron</strong> : au plus un électron libéré par photon absorbé ; on ne chiffre pas les autres pertes (réflexion, contacts, recombinaisons).</li>
      <li><strong>Hors périmètre</strong> : caractéristique intensité-tension et point de puissance maximale (voir les simulations de Terminale STL sur le panneau photovoltaïque), limite théorique du rendement, structure détaillée de la jonction, effet de la température.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, BLEU)}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- menus ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const lblMenu = { display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 };
  const boutonAnim = <div style={{ textAlign: 'center', marginTop: 6 }}><button onClick={() => setAnim(a => !a)} aria-pressed={!anim} style={stylePetitBouton(false)}>{anim ? 'Arrêter l’animation' : 'Lancer l’animation'}</button></div>;

  // ---------- scènes du parcours / du défi ----------
  const caption = (txt) => <div style={aide}>{txt}</div>;
  const sceneCellule = (enGuide || dd) && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {caption('Les photons (points jaunes) arrivent sur la cellule ; un électron libéré (−) est envoyé vers la borne −, un manque d’électron (+) vers la borne +. Les électrons circulent dans le circuit et traversent la lampe.')}
      <SceneCellule anim={anim}/>{boutonAnim}
    </div>);
  const sceneSeuilGuide = enGuide && deja('limites') && (
    <div style={{ ...styleBoite, ...cadre('seuil') }}>
      {caption('Le seuil d’absorption du silicium sur l’axe des longueurs d’onde : à droite du trait vert, les photons ne sont pas absorbés.')}
      <SceneSeuil lambda={1400} gap={1.12}/>
    </div>);
  const sceneSankeyGuide = enGuide && deja('comparer') && (
    <div style={{ ...styleBoite, ...cadre('sankey') }}>
      {caption('Bilan de puissance de la cellule de l’étape précédente : la part utile (électrique) et les pertes. La largeur de chaque bande est proportionnelle à la puissance.')}
      <SankeyBilan Prec={PREC0} Pel={PEL0}/>
    </div>);

  // ---------- exploration ----------
  const retablirEx = () => setEx(EX0);
  const reglagesEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Choisissez une cellule : elle fixe l’énergie seuil et le rendement. Réglez ensuite la lumière reçue et la longueur d’onde d’un photon.</div>
      <label style={lblMenu}>Cellule<select value={ex.c} onChange={e => setEx(s => ({ ...s, c: e.target.value }))} style={{ ...menu, marginTop: 2 }}>{M.CELLULES.map(c => <option key={c.id} value={c.id}>{c.court} (η {Math.round(100 * c.eta)} %, seuil {String(c.gap).replace('.', ',')} eV)</option>)}</select></label>
      <Section titre={`Lumière reçue : E = ${ex.E} W·m⁻², S = ${nbf(ex.S, 3)} m²`} ouvert={ouv.lumiere} onBascule={() => setOuv(o => ({ ...o, lumiere: !o.lumiere }))}>
        <div style={aide}>L’éclairement E est la puissance lumineuse reçue par mètre carré (plein Soleil : environ 1000 W·m⁻²) ; S est la surface de la cellule.</div>
        <Controle nom="Éclairement E" valeur={ex.E} min={100} max={1000} pas={50} onChange={E => setEx(s => ({ ...s, E }))} texte={`${ex.E} W·m⁻²`} onRetablir={() => setEx(s => ({ ...s, E: EX0.E }))} retablir="Rétablir E"/>
        <Controle nom="Surface S" valeur={ex.S} min={0.005} max={0.05} pas={0.005} onChange={S => setEx(s => ({ ...s, S: Number(S.toFixed(3)) }))} texte={`${nbf(ex.S, 3)} m²`} onRetablir={() => setEx(s => ({ ...s, S: EX0.S }))} retablir="Rétablir S"/>
      </Section>
      <Section titre={`Photon étudié : λ = ${ex.L} nm`} ouvert={ouv.photon} onBascule={() => setOuv(o => ({ ...o, photon: !o.photon }))}>
        <div style={aide}>Déplacez la longueur d’onde du photon : son énergie change, et il est absorbé ou non selon le seuil de la cellule choisie.</div>
        <Controle nom="Longueur d’onde λ" valeur={ex.L} min={300} max={1500} pas={10} onChange={L => setEx(s => ({ ...s, L }))} texte={`${ex.L} nm`} onRetablir={() => setEx(s => ({ ...s, L: EX0.L }))} retablir="Rétablir λ"/>
      </Section>
      <div style={{ marginTop: 8 }}><button onClick={retablirEx} style={stylePetitBouton(false)}><Pic n="refresh"/>Tout rétablir</button></div>
    </div>);
  const sceneEx = enExplore && (
    <div style={styleBoite}>
      {caption('Photons (jaunes), électrons libérés (−) et manques d’électron (+) : le schéma est qualitatif.')}
      <SceneCellule anim={anim}/>{boutonAnim}
    </div>);
  const sankeyEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Le bilan de puissance</div>
      <div style={aide}>La largeur des bandes est proportionnelle aux puissances : lumière reçue, électricité utile et pertes.</div>
      <SankeyBilan Prec={PrecEx} Pel={PelEx}/>
    </div>);
  const seuilEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Le photon et le seuil de la cellule</div>
      <div style={aide}>Le trait vert est le seuil d’absorption de la cellule choisie ; la flèche est le photon étudié.</div>
      <SceneSeuil lambda={ex.L} gap={ce.gap}/>
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures (valeurs du modèle)</div>
      <div style={aide}>Calculées avec P_reçue = E × S, P_él = η × P_reçue, pertes = P_reçue − P_él, E_ph = h × c divisé par λ.</div>
      <LigneMesure nom="Puissance reçue P_reçue" valeur={`${nbf(PrecEx, PrecEx < 10 ? 2 : 1)}${NB}W`} couleur="#c2410c"/>
      <LigneMesure nom="Puissance électrique P_él" valeur={`${nbf(PelEx, PelEx < 10 ? 2 : 1)}${NB}W`} couleur="#15803d"/>
      <LigneMesure nom="Pertes (chaleur…)" valeur={`${nbf(PrecEx - PelEx, PrecEx < 10 ? 2 : 1)}${NB}W`}/>
      <LigneMesure nom="Rendement η" valeur={`${nbf(100 * ce.eta, 0)}${NB}%`}/>
      <LigneMesure nom={`Énergie du photon (λ = ${ex.L} nm)`} valeur={`${nbf(EphEx, 2)}${NB}eV`} couleur={absEx ? '#15803d' : '#b91c1c'}/>
      <LigneMesure nom="Longueur d’onde maximale absorbée" valeur={`${nbf(LmEx, 0)}${NB}nm`}/>
      <div role="status" style={{ ...aide, marginTop: 6, marginBottom: 0 }}>{absEx ? `Ce photon est absorbé : son énergie (${nbf(EphEx, 2)} eV) est au moins égale au seuil (${nbf(ce.gap, 2)} eV)${EphEx > ce.gap + 0.5 ? ' ; l’excédent est perdu en chaleur.' : '.'}` : `Ce photon n’est pas absorbé : son énergie (${nbf(EphEx, 2)} eV) est inférieure au seuil (${nbf(ce.gap, 2)} eV).`}</div>
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Doublez l’éclairement : que deviennent la puissance reçue, la puissance électrique et le rendement ? Pourquoi ?</li>
        <li>Choisissez le tellurure de cadmium : quelle est sa longueur d’onde maximale ? Un photon de 1200 nm est-il absorbé par le silicium ? Par le tellurure de cadmium ?</li>
        <li>Cherchez la longueur d’onde pour laquelle l’énergie du photon est exactement égale au seuil du silicium : vérifiez qu’elle correspond à la longueur d’onde maximale.</li>
        <li>Pour un photon de 450 nm et un photon de 800 nm, lequel est le plus énergétique ? Lequel perd le plus d’énergie en chaleur dans le silicium ?</li>
        <li>Vérifiez à la main la puissance électrique affichée pour une cellule, un éclairement et une surface de votre choix.</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Énergie d’un photon : {eEph}, avec λ en mètres ; 1 eV = 1,60×10⁻¹⁹ J</li>
          <li>Un photon n’est absorbé que si son énergie est au moins égale à l’énergie seuil {Es} de la cellule ; l’excédent est perdu en chaleur</li>
          <li>Puissance reçue : {eRec} ; puissance électrique : {eEl}</li>
          <li>Rendement : {eEta}, sans unité ; pertes = P<sub>reçue</sub> − P<sub>él</sub></li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .pvc-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .pvc-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .pvc-col { display: flex; flex-direction: column; gap: 12px; }
        .pvc-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .pvc-l1.cote .pvc-carte { order: 2; } .pvc-l1.cote .pvc-main { order: 1; }
          .pvc-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .pvc-ex > * { grid-column: 1; } .pvc-ex > .pvc-ctrl { grid-column: 2; grid-row: 1 / span 6; } }
        @media (max-width: 900px) { .pvc-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .pvc-in { animation: pvc-fondu 0.35s ease-out; } @keyframes pvc-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Cellule photovoltaïque : du photon au rendement</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une cellule photovoltaïque convertit en électricité l’énergie des photons qu’elle absorbe ; son rendement compare la puissance électrique à la puissance lumineuse reçue{(enGuide && !deja('rendement')) ? '.' : <> : {eEta}.</>}</div>
      {!enExplore && <div className="pvc-l1 cote">
        {enGuide ? <div className="pvc-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="pvc-carte">{panneauHypo}</div> : null}
        <div className="pvc-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'rendement' ? suiviR : suiviS}/></div>}
          <div className="pvc-col">
            {sceneCellule && <div className="pvc-in">{sceneCellule}</div>}
            {sceneSeuilGuide && <div className="pvc-in">{sceneSeuilGuide}</div>}
            {sceneSankeyGuide && <div className="pvc-in">{sceneSankeyGuide}</div>}
          </div>
        </div>
      </div>}
      {enExplore && <div className="pvc-ex">
        <div>{sceneEx}</div>
        <div className="pvc-ctrl">{reglagesEx}</div>
        <div>{mesuresEx}</div>
        <div>{sankeyEx}</div>
        <div>{seuilEx}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && deja('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
