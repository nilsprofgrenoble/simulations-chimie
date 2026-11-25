import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, LigneMesure, IndiceDefi, indicesProfond, avecIndices } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./effetPhotoModele";
import { QCM_PARCOURS as Q } from "./effetPhotoQcm";
import { ScenePhoto, SceneCellule, SceneTroisPhotons, GrapheEc, SvgCartePhoton, SvgCarteSeuil, SvgCarteBilan, SvgCarteHistoire, SvgCarteCellule } from "./effetPhotoSchemas";
import { useHorloge, T_FIGE } from "./effetPhotoHorloge";

const SIM_ID = 240, CLE_GUIDE = 'effet-photo-tg-guide-v1';
declarerDefis(SIM_ID, [['direct', 'Bilan d’énergie : métal et lumière'], ['inconnu', 'Un métal inconnu']]);

// ====================================================
// SIM 240 — EFFET PHOTOÉLECTRIQUE (TG spé PC, « Décrire la lumière par un flux de photons »).
//  Capacités visées (jamais affichées à l'élève) : décrire l'effet photoélectrique, ses caractéristiques et son importance historique ;
//  l'interpréter qualitativement avec le modèle particulaire ; établir par un bilan d'énergie la relation entre l'énergie cinétique des électrons
//  et la fréquence ; expliquer qualitativement le fonctionnement d'une cellule photoélectrique ; photon : énergie, vitesse, masse.
//  Modèle : effetPhotoModele.js (test : effetPhotoModele.test.mjs). Schémas et animation : effetPhotoSchemas.jsx.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const BLEU = '#0369a1';
const IDS = ['photon', 'energieJ', 'energieEV', 'effet', 'seuil', 'bilanE', 'intensite', 'frequence', 'nuSeuil', 'droite', 'histoire', 'cellule', 'bilan'];
const I = Object.fromEntries(IDS.map((d, k) => [d, k]));
const W_K = 2.3, NU_FIXE_BILAN = M.nu14DeLambda(355);     // étape « bilan d'énergie » : photons de 3,5 eV (355 nm) sur le potassium
const PRESETS = [['rouge', 'Rouge', 4.3], ['bleu', 'Bleu', 6.7], ['violet', 'Violet', 7.5], ['uv', 'Ultraviolet', 9.0]];

// ---------- formules (MathML) ----------
const sur = (a, b) => <mfrac>{a}{b}</mfrac>;
const hnu = <mrow><mi>h</mi><mo>×</mo><mi>ν</mi></mrow>;
const Ecm = <msub><mi>E</mi><mtext>c,max</mtext></msub>;
const nu0 = <msub><mi>ν</mi><mn>0</mn></msub>;
const FE = <Formule><mi>E</mi><mo>=</mo>{hnu}<mo>=</mo>{sur(<mrow><mi>h</mi><mo>×</mo><mi>c</mi></mrow>, <mi>λ</mi>)}</Formule>;
const eE = <FormuleEnLigne><mi>E</mi><mo>=</mo>{hnu}</FormuleEnLigne>;
const eEl = <FormuleEnLigne><mi>E</mi><mo>=</mo>{sur(<mrow><mi>h</mi><mo>×</mo><mi>c</mi></mrow>, <mi>λ</mi>)}</FormuleEnLigne>;
const FBil = <Formule>{hnu}<mo>=</mo><mi>W</mi><mo>+</mo>{Ecm}</Formule>;
const eBil = <FormuleEnLigne>{hnu}<mo>=</mo><mi>W</mi><mo>+</mo>{Ecm}</FormuleEnLigne>;
const eEc = <FormuleEnLigne>{Ecm}<mo>=</mo>{hnu}<mo>−</mo><mi>W</mi></FormuleEnLigne>;
const eSeuil = <FormuleEnLigne>{nu0}<mo>=</mo>{sur(<mi>W</mi>, <mi>h</mi>)}</FormuleEnLigne>;
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const CONSTANTES = <>h = 6,63 × 10⁻³⁴{NB}J·s ; c = 3,00 × 10⁸{NB}m·s⁻¹ ; 1{NB}eV = 1,60 × 10⁻¹⁹{NB}J</>;
const NU0_K = M.nuSeuil14(W_K);

// contrôle d'une grandeur : curseur + boutons − / +
function Controle({ nom, valeur, min, max, pas, onChange, texte, retablir, onRetablir }) {
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
      {onRetablir && <div style={{ marginTop: 6 }}><button onClick={onRetablir} style={stylePetitBouton(false)}><Pic n="refresh"/>{retablir}</button></div>}
    </div>);
}
const reduit = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const quelLumiere = nu => { const nm = M.lambdaNm(nu), d = M.domaineLumiere(nm); return `${d.nom} · λ = ${nbf(nm, 0)}${NB}nm`; };
const swatch = nu => <span aria-hidden="true" style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 4, background: M.couleurLumiere(M.lambdaNm(nu)), border: '1.5px solid #334155', verticalAlign: '-2px', marginRight: 6 }}/>;

export function SimulationEffetPhotoelectrique() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviD, noterD] = useCompteurDefi(), [suiviI, noterI] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('direct');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ essayer: false, retenir: false });
  const [nuG, setNuG] = useState(4.3), [NG, setNG] = useState(2);
  const EX0 = { m: 'k', nu: 8.0, N: 2, montage: 'plaque' };
  const [ex, setEx] = useState(EX0);
  const [anim, setAnim] = useState(() => !reduit());
  const t = useHorloge(anim);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;

  const etape = guide.etape, idx = enGuide ? Math.min(etape, IDS.length - 1) : -1;
  const deja = id => !enGuide || etape >= IDS.indexOf(id);
  // À l'étape « cellule », la lumière doit être au-dessus du seuil du potassium (sinon la scène n'éjecte rien) : on la règle une fois.
  const [celInit, setCelInit] = useState(false);
  if (idx === I.cellule && !celInit) { setCelInit(true); if (M.ecMaxEV(nuG, W_K) <= 0) setNuG(7.5); }
  const nuScene = idx === I.bilanE ? NU_FIXE_BILAN : nuG;
  const ecGuide = M.ecMaxEV(nuG, W_K);
  const mEx = M.metalDe(ex.m), EcEx = M.ecMaxEV(ex.nu, mEx.W), EphEx = M.energiePhotonEV(ex.nu);

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'photon', titre: 'Le photon', focus: ['scene'],
      texte: <>Dans le modèle particulaire, la lumière est un flux de <strong>photons</strong> : des particules sans masse qui se déplacent dans le vide à la vitesse <strong>c = 3,00 × 10⁸{NB}m·s⁻¹</strong>. Un photon de fréquence <strong>ν</strong> (en hertz, Hz) transporte l’énergie {eE}, où <strong>h = 6,63 × 10⁻³⁴{NB}J·s</strong> est la constante de Planck. Comme c = λ × ν, où λ est la longueur d’onde, on peut aussi écrire {eEl}. Dans le visible, la fréquence augmente du rouge au violet.</>,
      tache: { type: 'qcm', q: 'Parmi ces trois photons, lequel transporte le plus d’énergie ?', options: Q.photon.options, bonne: 0,
        expl: 'E = h ν : l’énergie d’un photon est proportionnelle à sa fréquence. Dans le visible, c’est le violet qui a la plus grande fréquence (et la plus petite longueur d’onde) ; le rouge a la plus petite fréquence. Les trois photons vont à la même vitesse c dans le vide, mais cela ne dit rien sur leur énergie.',
        indice: 'E = h × ν : plus la fréquence est grande, plus l’énergie est grande. Dans le visible, la fréquence augmente du rouge au violet.' } },
    { id: 'energieJ', titre: 'Énergie d’un photon, en joules', focus: [],
      texte: <>Un photon de lumière de longueur d’onde <strong>λ = 500{NB}nm</strong> (1{NB}nm = 10⁻⁹{NB}m) transporte l’énergie {eEl}, avec h = 6,63 × 10⁻³⁴{NB}J·s et c = 3,00 × 10⁸{NB}m·s⁻¹. Le résultat est de l’ordre de 10⁻¹⁹{NB}J : on l’exprime en unités de 10⁻¹⁹{NB}J.</>,
      tache: { type: 'num', q: 'Quelle est l’énergie E de ce photon, en 10⁻¹⁹ J ?', unite: '×10⁻¹⁹ J', vrai: M.H * M.C / 500e-9 / 1e-19, tol: 0.03, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => ['h = 6,63×10⁻³⁴ J·s ; c = 3,00×10⁸ m·s⁻¹ ; λ = 500 nm = 5,00×10⁻⁷ m.', <>E = {avecIndices('frac(h × c|λ)')} = {avecIndices('frac(6,63×10⁻³⁴ × 3,00×10⁸|5,00×10⁻⁷)')} = 3,98×10⁻¹⁹ J.</>],
        pieges: [[M.H * M.C / 500 / 1e-19, 'Il faut convertir λ en mètres : 500 nm = 5,00×10⁻⁷ m.'], [M.H / 500e-9 / 1e-19, 'Il manque la célérité c : E = h × c divisé par λ.']],
        expl: <>E = {avecIndices('frac(6,63×10⁻³⁴ × 3,00×10⁸|5,00×10⁻⁷)')} ≈ 3,98×10⁻¹⁹ J : un photon visible transporte une énergie minuscule en joules.</>,
        indice: <>{eEl}, avec λ en <strong>mètres</strong> : 500 nm = 500 × 10⁻⁹ m = 5,00 × 10⁻⁷ m.</> } },
    { id: 'energieEV', titre: 'L’électronvolt', focus: [],
      texte: <>Ces énergies sont minuscules en joules : on utilise souvent l’<strong>électronvolt</strong> (eV), avec <strong>1{NB}eV = 1,60 × 10⁻¹⁹{NB}J</strong>. Le photon de 500{NB}nm a une énergie de 3,98 × 10⁻¹⁹{NB}J (étape précédente).</>,
      tache: { type: 'num', q: 'Quelle est l’énergie de ce photon, en eV ?', unite: 'eV', vrai: M.energieDeLambdaEV(500), tol: 0.03, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => ['E = 3,98×10⁻¹⁹ J ; 1 eV = 1,60×10⁻¹⁹ J.', <>E = {avecIndices('frac(3,98×10⁻¹⁹|1,60×10⁻¹⁹)')} ≈ 2,49 eV.</>],
        pieges: [[3.98 * 1.6, 'Pour passer des joules aux électronvolts, on divise par 1,60×10⁻¹⁹ (un électronvolt est une très petite énergie : l’énergie en eV est plus petite que le nombre de 10⁻¹⁹ J divisé par 1,6).'], [3.98, 'Ce nombre est exprimé en 10⁻¹⁹ J : il reste à diviser par 1,60 pour obtenir des eV.']],
        expl: <>E = {avecIndices('frac(3,98×10⁻¹⁹ J|1,60×10⁻¹⁹ J)')} ≈ 2,49 eV : un photon visible transporte quelques électronvolts.</>,
        indice: 'Divisez l’énergie en joules par 1,60 × 10⁻¹⁹ (nombre de joules dans 1 eV).' } },
    { id: 'effet', titre: 'L’effet photoélectrique', focus: ['scene', 'nu'], retenirTitre: 'Le photon', retenir: <>
        <SvgCartePhoton/>
        <ul style={ULS}>
          <li>Photon : particule sans masse, de vitesse c dans le vide, d’énergie E = h ν = h c / λ.</li>
          <li>Plus la fréquence est grande, plus l’énergie est grande : l’ultraviolet est plus énergétique que le visible, le violet plus que le rouge.</li>
          <li>Moyen de s’en souvenir : <strong>« E = h ν »</strong>, fréquence haute, énergie haute. Idée fausse : « une lumière plus intense a des photons plus énergétiques ». Vrai : l’intensité change le nombre de photons, pas leur énergie.</li>
        </ul></>,
      texte: <>En 1887, Hertz remarque qu’une plaque métallique éclairée par de la lumière ultraviolette perd des électrons : c’est l’<strong>effet photoélectrique</strong>. Ici une lampe éclaire une plaque de <strong>potassium</strong> ; les électrons éjectés apparaissent en bleu (les ondulations d’un photon sont d’autant plus serrées que sa fréquence ν est grande). Modifiez la fréquence de la lumière.</>,
      tache: { type: 'action', ok: enGuide && ecGuide > 0, consigne: 'Réglez la fréquence jusqu’à voir des électrons quitter la plaque, puis comparez avec la lumière rouge.' } },
    { id: 'seuil', titre: 'Le seuil de fréquence', focus: ['scene', 'nu'],
      texte: <>On constate que les électrons ne sortent qu’au-dessus d’une <strong>fréquence seuil ν₀</strong>, propre au métal : en dessous, aucun électron, <strong>même avec une lumière très intense</strong>. Quand il y en a, ils sortent immédiatement. Le modèle particulaire l’explique : un photon est absorbé en entier par <strong>un seul</strong> électron, à qui il cède toute son énergie h ν. Pour quitter le métal, l’électron doit recevoir au moins le <strong>travail d’extraction W</strong> (en eV) : W = 2,3{NB}eV pour le potassium.</>,
      tache: { type: 'qcm', q: 'Pourquoi une lumière rouge, même très intense, n’éjecte-t-elle aucun électron du potassium ?', options: Q.seuil.options, bonne: 0,
        expl: 'Chaque électron absorbe un seul photon. Si l’énergie h ν de ce photon est inférieure à W, l’électron ne peut pas sortir. Envoyer plus de photons rouges (plus d’intensité) ne change rien : leur énergie ne s’additionne pas sur un même électron.',
        indice: 'Un électron absorbe un seul photon à la fois : compare h ν et W.' } },
    { id: 'bilanE', titre: 'Le bilan d’énergie', focus: ['scene'], retenirTitre: 'Le seuil et le travail d’extraction', retenir: <>
        <SvgCarteSeuil/>
        <ul style={ULS}>
          <li>Effet photoélectrique seulement si ν est supérieure à la fréquence seuil ν₀ ; en dessous, aucun électron, quelle que soit l’intensité.</li>
          <li>Travail d’extraction W : énergie minimale pour arracher un électron au métal ; h ν₀ = W.</li>
          <li>Moyen de s’en souvenir : <strong>« un photon, un électron, pas de cumul »</strong>. Idée fausse : « avec assez de lumière rouge, on finit par éjecter des électrons ». Vrai : si h ν est inférieure à W, aucun photon ne suffit, quel que soit leur nombre.</li>
        </ul></>,
      texte: <>Le photon cède toute son énergie h ν à un électron. Une partie, W, sert à l’extraire du métal ; le reste devient son énergie cinétique. Les électrons les plus faiblement liés sortent avec le plus d’énergie : c’est l’<strong>énergie cinétique maximale E<sub>c,max</sub></strong> (en eV). Le bilan d’énergie s’écrit{FBil}Ici des photons ultraviolets d’énergie <strong>h ν = 3,5{NB}eV</strong> (λ = 355{NB}nm) éclairent du potassium, de travail d’extraction W = 2,3{NB}eV.</>,
      tache: { type: 'num', q: 'Quelle est l’énergie cinétique maximale E_c,max des électrons éjectés, en eV ?', unite: 'eV', vrai: 3.5 - W_K, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['h ν = 3,5 eV ; W = 2,3 eV.', <>E<sub>c,max</sub> = h ν − W = 3,5 − 2,3 = 1,2 eV.</>],
        pieges: [[3.5, 'Une partie de l’énergie du photon sert à extraire l’électron : il faut retrancher W.'], [3.5 + W_K, 'W s’ajoute à l’énergie cinétique : c’est E_c,max qui vaut h ν moins W.']],
        expl: <>E<sub>c,max</sub> = h ν − W = 3,5 − 2,3 = 1,2 eV : sur les 3,5 eV du photon, 2,3 eV servent à extraire l’électron, 1,2 eV lui donnent sa vitesse.</>,
        indice: <>{eEc}, avec h ν = 3,5 eV et W = 2,3 eV (les deux sont déjà en eV).</> } },
    { id: 'intensite', titre: 'L’intensité de la lumière', focus: ['scene', 'int'],
      texte: <>L’<strong>intensité</strong> de la lumière est le nombre de photons envoyés par seconde. Choisissez une lumière au-dessus du seuil (bleue, violette ou ultraviolette), puis changez l’intensité avec le curseur, et observez la plaque. Un photon éjecte au plus un électron.</>,
      tache: { type: 'qcm', q: 'On double le nombre de photons par seconde, sans changer la fréquence (au-dessus du seuil). Que deviennent le nombre d’électrons éjectés par seconde et E_c,max ?', options: Q.intensite.options, bonne: 0,
        expl: 'Deux fois plus de photons par seconde éjectent deux fois plus d’électrons. Mais l’énergie h ν de chaque photon n’a pas changé, donc E_c,max = h ν − W non plus : l’énergie cinétique maximale ne dépend pas de l’intensité.',
        indice: <>Le nombre de photons change, mais l’énergie de chacun est toujours {eE}. Que vaut alors {eEc} ?</> } },
    { id: 'frequence', titre: 'L’effet de la fréquence', focus: ['scene', 'int'], retenirTitre: 'Le bilan d’énergie', retenir: <>
        <SvgCarteBilan/>
        <ul style={ULS}>
          <li>h ν = W + E<sub>c,max</sub>, donc E<sub>c,max</sub> = h ν − W : l’énergie du photon est cédée à un seul électron.</li>
          <li>Le nombre d’électrons éjectés par seconde est proportionnel à l’intensité (nombre de photons) ; E<sub>c,max</sub> ne dépend que de ν et du métal.</li>
          <li>Moyen de s’en souvenir : <strong>« l’intensité compte les électrons, la fréquence règle leur énergie »</strong>. Idée fausse : « plus de lumière donne des électrons plus rapides ». Vrai : seule la fréquence augmente leur énergie.</li>
        </ul></>,
      texte: <>Comparons deux lumières au-dessus du seuil, d’abord <strong>bleue</strong>, puis <strong>violette</strong> (fréquence plus grande), de même intensité, sur le même métal. Essayez avec les boutons de couleur et regardez la vitesse des électrons.</>,
      tache: { type: 'qcm', q: 'Quand on passe de la lumière bleue à la lumière violette, que devient E_c,max ?', options: Q.frequence.options, bonne: 0,
        expl: <>{eEc} : W ne change pas (même métal) et h ν augmente avec ν, donc E<sub>c,max</sub> augmente. L’intensité n’intervient pas.</>,
        indice: <>{eEc} : que devient h ν quand ν augmente ? et W ?</> } },
    { id: 'nuSeuil', titre: 'La fréquence seuil', focus: ['scene'],
      texte: <>Il n’y a plus d’électron éjecté quand h ν = W, c’est-à-dire à la fréquence seuil {eSeuil}. Attention aux unités : W doit être en joules (W en J = W en eV × 1,60 × 10⁻¹⁹). Pour le potassium, W = 2,3{NB}eV et h = 6,63 × 10⁻³⁴{NB}J·s.</>,
      tache: { type: 'num', q: 'Quelle est la fréquence seuil ν₀ du potassium, en 10¹⁴ Hz ?', unite: '×10¹⁴ Hz', vrai: NU0_K, tol: 0.03, affiche: v => nbf(v, 2), cs: 3,
        calcul: () => ['W = 2,3 eV = 2,3 × 1,60×10⁻¹⁹ J = 3,68×10⁻¹⁹ J.', <>ν₀ = {avecIndices('frac(W|h)')} = {avecIndices('frac(3,68×10⁻¹⁹|6,63×10⁻³⁴)')} ≈ 5,55×10¹⁴ Hz.</>],
        pieges: [[W_K / 6.63e-34 / 1e14, 'W doit être converti en joules : multipliez les eV par 1,60×10⁻¹⁹.'], [W_K * 1.6 / 6.63, 'Pensez à la puissance de 10 : 10⁻¹⁹ divisé par 10⁻³⁴ donne 10¹⁵, soit 10 fois 10¹⁴.']],
        expl: <>ν₀ = {avecIndices('frac(3,68×10⁻¹⁹ J|6,63×10⁻³⁴ J·s)')} ≈ 5,55×10¹⁴ Hz : en dessous (lumière rouge, orangée), aucun électron ; au-dessus (bleu, violet, ultraviolet), des électrons sont éjectés. Cela correspond à λ₀ ≈ 540 nm.</>,
        indice: <>{eSeuil}, avec W = 2,3 × 1,60 × 10⁻¹⁹ J. Donnez le résultat en unités de 10¹⁴ Hz.</> } },
    { id: 'droite', titre: 'Ec,max en fonction de la fréquence', focus: ['graphe'],
      texte: <>Pour un métal donné, {eEc} est une fonction affine de ν : le graphique est une <strong>droite</strong>, de pente h, qui part de l’axe des fréquences en ν₀. Le point du graphique suit la fréquence que vous réglez avec le curseur ; sous le seuil, il reste sur l’axe : aucun électron.</>,
      tache: { type: 'qcm', q: 'Que représente le point où la droite quitte l’axe des fréquences ?', options: Q.droite.options, bonne: 0,
        expl: 'En ce point E_c,max = 0 : h ν = W. C’est la fréquence seuil ν₀. À gauche de ce point, h ν est inférieure à W : aucun électron n’est éjecté.',
        indice: <>Au départ de la droite, {Ecm} = 0 : que vaut alors h ν par rapport à W ?</> } },
    { id: 'histoire', titre: 'Pourquoi c’est important', focus: [],
      texte: <>Avant 1905, la lumière est décrite comme une onde. Dans ce modèle, une lumière plus intense, même rouge, devrait finir par arracher des électrons, avec une énergie qui augmente avec l’intensité. Or l’expérience montre un <strong>seuil de fréquence</strong> et une énergie E<sub>c,max</sub> qui ne dépend pas de l’intensité. En 1905, Einstein interprète l’effet avec des photons ; il reçoit pour cela le prix Nobel de physique en 1921.</>,
      tache: { type: 'qcm', q: 'Pourquoi l’effet photoélectrique a-t-il été important pour la physique ?', options: Q.histoire.options, bonne: 0,
        expl: 'Le seuil de fréquence et l’indépendance de E_c,max vis-à-vis de l’intensité ne s’expliquent pas avec le seul modèle ondulatoire, mais très bien avec des photons. L’effet a donc montré que la lumière possède aussi un aspect particulaire (sans que son aspect ondulatoire, démontré par ailleurs, disparaisse).',
        indice: 'Le modèle ondulatoire seul ne prévoit pas de seuil : quel autre modèle de la lumière l’explique ?' } },
    { id: 'cellule', titre: 'La cellule photoélectrique', focus: ['scene', 'nu'], retenirTitre: 'L’effet photoélectrique dans l’histoire', retenir: <>
        <SvgCarteHistoire/>
        <ul style={ULS}>
          <li>1887 : Hertz observe l’effet ; 1905 : Einstein l’interprète avec des photons ; 1921 : prix Nobel de physique d’Einstein.</li>
          <li>Seuil de fréquence et E<sub>c,max</sub> indépendante de l’intensité : impossibles à expliquer avec le seul modèle ondulatoire.</li>
          <li>Moyen de s’en souvenir : <strong>« seuil = photons »</strong>. Idée fausse : « la lumière est uniquement une particule ». Vrai : elle a un aspect ondulatoire (interférences) et un aspect particulaire (effet photoélectrique).</li>
        </ul></>,
      texte: <>Une <strong>cellule photoélectrique</strong> utilise l’effet : dans une ampoule vide, la lumière éclaire une <strong>photocathode</strong> qui éjecte des électrons ; l’<strong>anode</strong>, reliée au pôle + d’un générateur, les attire. Un courant circule alors dans le circuit, mesuré par l’ampèremètre. On l’utilise comme détecteur de lumière (portes automatiques, capteurs de lumière). Essayez avec les réglages de la lumière.</>,
      tache: { type: 'qcm', q: 'La fréquence est au-dessus du seuil et on double le nombre de photons par seconde. Que devient le courant ?', options: Q.cellule.options, bonne: 0,
        expl: 'Le courant est le nombre de charges qui traversent le circuit par seconde : il est proportionnel au nombre d’électrons éjectés par seconde, donc au nombre de photons reçus par seconde (en supposant que tous les électrons éjectés sont collectés). Sous le seuil de fréquence, il n’y aurait aucun courant.',
        indice: 'Le courant est proportionnel au nombre d’électrons collectés par seconde : combien d’électrons sont éjectés si l’on double le nombre de photons ?' } },
    { id: 'bilan', titre: 'Le bilan', focus: [], retenirTitre: 'La cellule photoélectrique', retenir: <>
        <SvgCarteCellule/>
        <ul style={ULS}>
          <li>Photocathode éclairée (ν supérieure à ν₀) : électrons éjectés ; l’anode (reliée au pôle +) les collecte : un courant circule.</li>
          <li>Courant proportionnel au nombre de photons reçus par seconde ; aucun courant sous le seuil.</li>
          <li>Moyen de s’en souvenir : <strong>« la lumière fait le courant »</strong>. Idée fausse : « une cellule photoélectrique stocke de l’électricité ». Vrai : elle convertit de la lumière en courant, tant qu’elle est éclairée.</li>
        </ul></>,
      texte: <>Vous savez calculer l’énergie d’un photon {eE}, appliquer le bilan {eBil} pour trouver {eEc}, repérer la fréquence seuil {eSeuil}, et expliquer le fonctionnement d’une cellule photoélectrique. Passez à l’exploration (choix du métal, de la lumière, de l’intensité) ou tentez les défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => { setDefi({ ...(type === 'direct' ? M.tirageDirect() : M.tirageInconnu()), type, s1: '', s2: '', s3: '', verifie: false, essais: 0, corr: false }); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const pr = (v, a, tol) => isFinite(v) && Math.abs(v - a) <= tol * Math.abs(a);
  // Marges : relative, avec un plancher absolu pour les différences d'énergies (un E arrondi à 2 chiffres significatifs doit rester accepté)
  const juste = (d, k, s) => {
    const a = d[`rep${k}`];
    if (!isFinite(s)) return false;
    if (d.type === 'direct') return k === 1 ? pr(s, a, 0.04) : k === 2 ? Math.abs(s - a) <= Math.max(0.10 * a, 0.06) : pr(s, a, 0.05);
    return k === 1 ? pr(s, a, 0.04) : k === 2 ? Math.abs(s - a) <= Math.max(0.08 * a, 0.06) : pr(s, a, 0.08);
  };
  const verifier = () => {
    const res = [1, 2, 3].map(k => juste(defi, k, lireNombre(defi[`s${k}`] || '')));
    const ok = res.every(Boolean);
    setDefi(d => ({ ...d, verifie: true, ok, res, essais: ok ? d.essais : (d.essais || 0) + 1 }));
    (defi.type === 'direct' ? noterD : noterI)(ok);
  };
  // Retour diagnostique par question.
  const diagnostic = k => {
    const s = lireNombre(defi[`s${k}`] || ''), vrai = defi[`rep${k}`];
    if (!isFinite(s)) return 'écrivez un nombre (la virgule ou le point conviennent).';
    if (juste(defi, k, s)) return 'juste.';
    const s1 = lireNombre(defi.s1 || ''), s2 = lireNombre(defi.s2 || '');
    if (k === 1) {
      if (defi.type === 'direct' && s < 1e-3) return 'λ doit être convertie en mètres (1 nm = 10⁻⁹ m) avant le calcul de h c divisé par λ.';
      if (s > 1e5 || (s > 20 && s < 1e5 && pr(s * 1.6e-19 * 1e19, vrai, 0.5))) return 'votre résultat semble exprimé en joules ou en 10⁻¹⁹ J : l’énoncé demande des électronvolts (divisez par 1,60×10⁻¹⁹ J).';
      if (defi.type === 'inconnu' && pr(s, vrai * 10, 0.05)) return 'vérifiez la puissance de 10 : ν est donnée en unités de 10¹⁴ Hz.';
    }
    if (k === 2) {
      if (defi.type === 'direct') {
        if (isFinite(s1) && pr(s1 - defi.W, s, 0.06)) return 'votre calcul est cohérent avec votre réponse à la question 1 : c’est celle-là qu’il faut revoir.';
        if (pr(s, defi.rep1, 0.06)) return 'vous avez donné l’énergie du photon : une partie, W, sert à extraire l’électron ; E_c,max = h ν − W.';
        if (isFinite(s1) && pr(s1 + defi.W, s, 0.06)) return 'W ne s’ajoute pas : il se retranche (E_c,max = h ν − W).';
      } else {
        if (isFinite(s1) && pr(s1 - defi.Ec, s, 0.06)) return 'votre calcul est cohérent avec votre réponse à la question 1 : c’est celle-là qu’il faut revoir.';
        if (pr(s, defi.rep1 + defi.Ec, 0.06)) return 'W se calcule par W = h ν − E_c,max : on retranche l’énergie cinétique, on ne l’ajoute pas.';
        if (pr(s, defi.Ec, 0.06)) return 'vous avez recopié E_c,max : le travail d’extraction est W = h ν − E_c,max.';
      }
    }
    if (k === 3) {
      if (s > 1e5) return 'il faut convertir W en joules (× 1,60×10⁻¹⁹) puis diviser par h, et donner le résultat en 10¹⁴ Hz.';
      if (defi.type === 'inconnu' && isFinite(s2) && pr(M.nuSeuil14(s2), s, 0.05)) return 'votre calcul est cohérent avec votre réponse à la question 2 : c’est celle-là qu’il faut revoir.';
      if (pr(s, vrai * 10, 0.08) || pr(s, vrai / 10, 0.08)) return 'vérifiez la puissance de 10 : le résultat est attendu en unités de 10¹⁴ Hz.';
    }
    return s < vrai ? 'votre résultat est trop petit : revoyez la formule utilisée.' : 'votre résultat est trop grand : revoyez la formule utilisée.';
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (aria, cle, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6, fontSize: 14 }}>
      <span>{avecIndices(aria)} =</span>
      <input value={defi[cle] || ''} aria-label={aria} onKeyDown={e => e.key === 'Enter' && document.getElementById('phe-verif')?.click()} onChange={e => setDefi(d => ({ ...d, [cle]: e.target.value, verifie: false, corr: false }))} inputMode="decimal"
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.res[+cle.slice(1) - 1] ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
      <span>{unite}</span>
    </div>);
  const f1 = x => nbf(x, 1), f2 = x => nbf(x, 2);
  const solutionDefi = d => d.type === 'direct'
    ? <>E = {avecIndices('frac(h × c|λ)')} = {avecIndices(`frac(6,63×10⁻³⁴ × 3,00×10⁸|${d.lam}×10⁻⁹)`)} = {f2(d.rep1 * 1.6e-19 / 1e-19)}×10⁻¹⁹ J = {f2(d.rep1)} eV ; E<sub>c,max</sub> = E − W = {f2(d.rep1)} − {f1(d.W)} = {f2(d.rep2)} eV ; ν₀ = {avecIndices('frac(W|h)')} = {avecIndices(`frac(${f1(d.W)} × 1,60×10⁻¹⁹|6,63×10⁻³⁴)`)} = {f2(d.rep3)}×10¹⁴ Hz. Gardez un chiffre de plus dans les calculs intermédiaires pour ne pas arrondir trop tôt.</>
    : <>E = h ν = 6,63×10⁻³⁴ × {f1(d.nu)}×10¹⁴ = {f2(d.rep1 * 1.6e-19 / 1e-19)}×10⁻¹⁹ J = {f2(d.rep1)} eV ; h ν = W + E<sub>c,max</sub> donne W = {f2(d.rep1)} − {f1(d.Ec)} = {f2(d.rep2)} eV ; ν₀ = {avecIndices('frac(W|h)')} = {avecIndices(`frac(${f2(d.rep2)} × 1,60×10⁻¹⁹|6,63×10⁻³⁴)`)} = {f2(d.rep3)}×10¹⁴ Hz. Gardez un chiffre de plus dans les calculs intermédiaires.</>;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['direct', 'Bilan d’énergie : métal et lumière'], ['inconnu', 'Un métal inconnu']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.type === tp} style={stylePetitBouton(defi.type === tp, BLEU)}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'direct' ? 'Défi : bilan d’énergie sur un métal' : 'Défi : un métal inconnu'}</div>
      {defi.type === 'direct' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>On éclaire une plaque de <strong>{defi.metal}</strong>, de travail d’extraction <strong>W = {f1(defi.W)}{NB}eV</strong>, avec une lumière de longueur d’onde <strong>λ = {defi.lam}{NB}nm</strong>. Données : {CONSTANTES}. Donnez vos résultats avec 3 chiffres significatifs (marge acceptée : 4{NB}% pour la question 1, 10{NB}% pour la question 2, 5{NB}% pour la question 3).</div>
        <div style={{ ...lbl, marginBottom: 2 }}><strong>1.</strong> Énergie E d’un photon de cette lumière, en eV.</div>
        {champ('E', 's1', 'eV')}
        <IndiceDefi cache={false}>E = h × c divisé par λ, avec λ en mètres ; puis divisez par 1,60 × 10⁻¹⁹ pour passer des joules aux eV.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>2.</strong> {avecIndices('Énergie cinétique maximale E_c,max des électrons éjectés, en eV.')}</div>
        {champ('E_c,max', 's2', 'eV')}
        <IndiceDefi cache={false}>Bilan d’énergie : h ν = W + E<sub>c,max</sub>, donc E<sub>c,max</sub> = E − W (les deux en eV).</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>3.</strong> Fréquence seuil ν₀ de ce métal, en 10¹⁴ Hz.</div>
        {champ('ν₀', 's3', '×10¹⁴ Hz')}
        <IndiceDefi cache={false}>ν₀ = W divisé par h, avec W en joules : W (J) = W (eV) × 1,60 × 10⁻¹⁹.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Une plaque d’un <strong>métal inconnu</strong> est éclairée par une lumière de fréquence <strong>ν = {f1(defi.nu)} × 10¹⁴{NB}Hz</strong>. On mesure l’énergie cinétique maximale des électrons éjectés : <strong>E<sub>c,max</sub> = {f1(defi.Ec)}{NB}eV</strong>. Données : {CONSTANTES}. Donnez vos résultats avec 3 chiffres significatifs (marge acceptée : 4{NB}% pour la question 1, 8{NB}% pour les questions 2 et 3).</div>
        <div style={{ ...lbl, marginBottom: 2 }}><strong>1.</strong> Énergie E = h ν d’un photon de cette lumière, en eV.</div>
        {champ('E', 's1', 'eV')}
        <IndiceDefi cache={false}>E = h × ν en joules, avec ν = {f1(defi.nu)} × 10¹⁴ Hz ; puis divisez par 1,60 × 10⁻¹⁹ pour obtenir des eV.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>2.</strong> Travail d’extraction W du métal, en eV.</div>
        {champ('W', 's2', 'eV')}
        <IndiceDefi cache={false}>h ν = W + E<sub>c,max</sub>, donc W = h ν − E<sub>c,max</sub>.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>3.</strong> Fréquence seuil ν₀ de ce métal, en 10¹⁴ Hz.</div>
        {champ('ν₀', 's3', '×10¹⁴ Hz')}
        <IndiceDefi cache={false}>ν₀ = W divisé par h, avec W en joules : W (J) = W (eV) × 1,60 × 10⁻¹⁹.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="phe-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        <div style={{ fontWeight: 700, color: defi.ok ? '#15803d' : '#dc2626' }}>{defi.ok ? '✓ Correct.' : '✗ Pas tout à fait.'}</div>
        {!defi.ok && <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: KIT.txt }}>{[1, 2, 3].map(k => <li key={k}><strong>Question {k}</strong> : {avecIndices(diagnostic(k))}</li>)}</ul>}
        {!defi.ok && !defi.corr && <div style={{ marginTop: 6 }}><button onClick={() => setDefi(d => ({ ...d, corr: true }))} style={stylePetitBouton(false)}>Voir la correction</button></div>}
        {(defi.ok || defi.corr) && <div style={{ marginTop: 6, color: KIT.txt }}>{solutionDefi(defi)}</div>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Modèle particulaire</strong> : un photon de fréquence ν a l’énergie E = h ν et est absorbé en entier par un seul électron. On néglige les effets à plusieurs photons (qui n’apparaissent qu’avec des lasers très intenses).</li>
      <li><strong>Bilan d’énergie</strong> : h ν = W + E<sub>c,max</sub>. E<sub>c,max</sub> est l’énergie des électrons les plus faiblement liés ; les autres électrons éjectés perdent de l’énergie dans le métal et sortent avec une énergie cinétique comprise entre 0 et E<sub>c,max</sub>. On suppose la plaque propre et sous vide.</li>
      <li><strong>Travaux d’extraction</strong> (valeurs arrondies, ordres de grandeur) : césium 2,0 eV ; potassium 2,3 eV ; calcium 2,9 eV ; zinc 4,3 eV ; cuivre 4,7 eV. Ils varient selon l’état de surface et la méthode de mesure ; les valeurs de la littérature diffèrent parfois de plusieurs dixièmes d’eV.</li>
      <li><strong>Constantes</strong> : h = 6,63 × 10⁻³⁴ J·s, c = 3,00 × 10⁸ m·s⁻¹, 1 eV = 1,60 × 10⁻¹⁹ J (valeurs arrondies : l’énergie d’un photon en eV est environ 1 240 divisé par λ en nm).</li>
      <li><strong>Intensité et courant</strong> : le nombre d’électrons éjectés par seconde est proportionnel au nombre de photons reçus par seconde. Dans l’animation, un photon éjecte un électron ; en réalité, seule une faible fraction des photons absorbés éjecte un électron. Dans la cellule, on suppose une tension suffisante pour collecter tous les électrons éjectés.</li>
      <li><strong>Animation</strong> : qualitative. Les vitesses des électrons sont rangées dans le bon ordre (plus de E<sub>c,max</sub>, plus rapides) mais ne sont pas à l’échelle ; la vitesse des photons est ralentie pour être visible. Le sens du courant conventionnel n’est pas représenté.</li>
      <li><strong>Hors périmètre</strong> : potentiel d’arrêt, effet Compton, photoémission d’autres matériaux (semi-conducteurs), effet photovoltaïque (autre simulation).</li>
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
  const boutonAnim = <button onClick={() => setAnim(a => !a)} aria-pressed={!anim} style={{ ...stylePetitBouton(false), marginTop: 6 }}>{anim ? 'Mettre l’animation en pause' : 'Reprendre l’animation'}</button>;
  const presets = (nu, set) => (
    <div role="group" aria-label="Couleurs de lumière prêtes à l’emploi" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '2px 0 8px' }}>
      {PRESETS.map(([id, nom, v]) => <button key={id} onClick={() => set(v)} aria-pressed={Math.abs(nu - v) < 0.05} style={stylePetitBouton(Math.abs(nu - v) < 0.05, BLEU)}>{nom}</button>)}
    </div>);
  const infoLumiere = nu => <div style={{ fontSize: 13.5, color: KIT.txt, margin: '0 0 6px' }}>{swatch(nu)}Lumière : {quelLumiere(nu)}</div>;

  // ---------- scène du parcours / du défi ----------
  let sceneGuide = null;
  if (enGuide) {
    if (idx <= I.energieEV) sceneGuide = <SceneTroisPhotons/>;
    else if (idx >= I.cellule) sceneGuide = <SceneCellule nu={nuG} W={W_K} N={Math.min(NG, 3)} t={t}/>;
    else sceneGuide = <ScenePhoto nu={nuScene} W={W_K} N={NG} t={t} nomMetal="potassium"/>;
  } else if (dd) {
    const nuD = dd.type === 'direct' ? M.nu14DeLambda(dd.lam) : dd.nu, WD = dd.type === 'direct' ? dd.W : dd.rep2;
    sceneGuide = <ScenePhoto nu={nuD} W={WD} N={2} t={t} nomMetal={dd.type === 'direct' ? dd.metal : 'métal inconnu'} aria="Une lampe envoie de la lumière vers une plaque métallique ; les valeurs sont données dans l’énoncé."/>;
  }
  const boxScene = sceneGuide && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {dd && <div style={aide}>Schéma : la lumière éclaire la plaque (valeurs dans l’énoncé). Les électrons éjectés apparaissent en bleu.</div>}
      {sceneGuide}
      {(idx > I.energieEV || dd) && boutonAnim}
    </div>);
  const ctrlNu = enGuide && idx >= I.effet && idx !== I.bilanE && (
    <div style={{ ...styleBoite, ...cadre('nu'), ...cadre('int') }}>
      <div style={titreCarte}>Réglages de la lumière</div>
      {idx >= I.intensite && presets(nuG, setNuG)}
      <Controle nom="Fréquence ν de la lumière" valeur={nuG} min={3} max={14} pas={0.1} onChange={v => setNuG(Number(v.toFixed(1)))} texte={`${nbf(nuG, 1)} × 10¹⁴${NB}Hz`}/>
      {infoLumiere(nuG)}
      {idx >= I.intensite && <Controle nom="Intensité (nombre de photons envoyés par seconde)" valeur={NG} min={1} max={5} pas={1} onChange={setNG} texte={`${NG} sur 5`}/>}
    </div>);
  const grapheG = enGuide && idx >= I.droite && (
    <div style={{ ...styleBoite, ...cadre('graphe') }}>
      <div style={aide}>{avecIndices('Potassium : énergie cinétique maximale E_c,max des électrons en fonction de la fréquence ν. Le point suit le réglage de la lumière.')}</div>
      <GrapheEc nu={nuG} W={W_K}/>
    </div>);

  // ---------- exploration ----------
  const retablirEx = () => setEx(EX0);
  const reglagesEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Choisissez le montage et le métal (il fixe le travail d’extraction W), puis réglez la fréquence et l’intensité de la lumière : regardez si des électrons sont éjectés et à quelle vitesse.</div>
      <label style={lblMenu}>Montage<select value={ex.montage} onChange={e => setEx(s => ({ ...s, montage: e.target.value }))} style={{ ...menu, marginTop: 2 }}><option value="plaque">Plaque métallique éclairée</option><option value="cellule">Cellule photoélectrique</option></select></label>
      <label style={lblMenu}>Métal (photocathode)<select value={ex.m} onChange={e => setEx(s => ({ ...s, m: e.target.value }))} style={{ ...menu, marginTop: 2 }}>{M.METAUX.map(g => <option key={g.id} value={g.id}>{g.court} (W = {nbf(g.W, 1)} eV)</option>)}</select></label>
      {presets(ex.nu, v => setEx(s => ({ ...s, nu: v })))}
      <Controle nom="Fréquence ν de la lumière" valeur={ex.nu} min={3} max={14} pas={0.1} onChange={v => setEx(s => ({ ...s, nu: Number(v.toFixed(1)) }))} texte={`${nbf(ex.nu, 1)} × 10¹⁴${NB}Hz`}/>
      {infoLumiere(ex.nu)}
      <Controle nom="Intensité (nombre de photons envoyés par seconde)" valeur={ex.N} min={1} max={5} pas={1} onChange={v => setEx(s => ({ ...s, N: v }))} texte={`${ex.N} sur 5`}/>
      <div style={{ marginTop: 8 }}><button onClick={retablirEx} style={stylePetitBouton(false)}><Pic n="refresh"/>Tout rétablir</button></div>
    </div>);
  const sceneEx = enExplore && (
    <div style={styleBoite}>
      <div style={aide}>{ex.montage === 'plaque' ? 'La lampe envoie des photons sur la plaque ; les électrons éjectés apparaissent en bleu.' : 'Dans l’ampoule vide, la photocathode éjecte des électrons (en bleu) que l’anode collecte : un courant circule dans le circuit.'}</div>
      {ex.montage === 'plaque' ? <ScenePhoto nu={ex.nu} W={mEx.W} N={ex.N} t={t} nomMetal={mEx.nom}/> : <SceneCellule nu={ex.nu} W={mEx.W} N={Math.min(ex.N, 3)} t={t}/>}
      {boutonAnim}
      <div role="status" aria-live="polite" style={{ marginTop: 6, fontSize: 14, fontWeight: 700, color: EcEx > 0 ? BLEU : KIT.txt2 }}>{EcEx > 0 ? (ex.montage === 'plaque' ? 'Des électrons sont éjectés.' : 'Des électrons sont éjectés : un courant circule.') : 'Aucun électron éjecté : h ν est inférieure à W.'}</div>
    </div>);
  const grapheEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>{avecIndices('E_c,max en fonction de la fréquence')}</div>
      <div style={aide}>La droite part de la fréquence seuil ν₀ du métal choisi. Le point indique la fréquence réglée.</div>
      <GrapheEc nu={ex.nu} W={mEx.W}/>
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures (valeurs du modèle)</div>
      <div style={aide}>Calculées avec E = h ν, puis E<sub>c,max</sub> = h ν − W si h ν est supérieure à W.</div>
      <LigneMesure nom="Énergie d’un photon h ν" valeur={`${nbf(EphEx, 2)}${NB}eV (${nbf(M.energiePhotonJ(ex.nu) / 1e-19, 2)}×10⁻¹⁹${NB}J)`} couleur="#c2410c"/>
      <LigneMesure nom="Travail d’extraction W" valeur={`${nbf(mEx.W, 1)}${NB}eV`}/>
      <LigneMesure nom="Énergie cinétique maximale E_c,max" valeur={EcEx > 0 ? `${nbf(EcEx, 2)}${NB}eV` : 'aucun électron'} couleur={EcEx > 0 ? BLEU : '#64748b'}/>
      <LigneMesure nom="Fréquence seuil ν₀" valeur={`${nbf(M.nuSeuil14(mEx.W), 2)} × 10¹⁴${NB}Hz (λ₀ = ${nbf(M.lambdaSeuilNm(mEx.W), 0)}${NB}nm)`}/>
      <LigneMesure nom={ex.montage === 'plaque' ? 'Électrons éjectés par seconde (unités relatives)' : 'Courant de la cellule (unités relatives)'} valeur={EcEx > 0 ? String(ex.N) : '0'}/>
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Avec le césium, quelles couleurs de lumière éjectent des électrons ? Et avec le cuivre ?</li>
        <li>Pour le potassium, augmentez l’intensité avec une lumière rouge : se passe-t-il quelque chose ? Expliquez avec h ν et W.</li>
        <li>Pour une lumière ultraviolette fixée, comparez le césium et le zinc : lequel éjecte les électrons les plus rapides ? Vérifiez avec E<sub>c,max</sub> = h ν − W.</li>
        <li>Pour un métal choisi, repérez la fréquence où le point quitte l’axe des fréquences du graphique : comparez avec la valeur de ν₀ dans les mesures.</li>
        <li>En montage « cellule photoélectrique », que devient le courant quand on double l’intensité ? Et quand on passe sous le seuil ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Énergie d’un photon : {eE} = {eEl}</li>
          <li>Bilan d’énergie : {eBil}, donc {eEc}</li>
          <li>Fréquence seuil : {eSeuil} ; en dessous, aucun électron, quelle que soit l’intensité</li>
          <li>Intensité : nombre d’électrons (donc courant d’une cellule) ; fréquence : énergie des électrons</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .phe-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .phe-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .phe-col { display: flex; flex-direction: column; gap: 12px; }
        .phe-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .phe-l1.cote .phe-carte { order: 2; } .phe-l1.cote .phe-main { order: 1; }
          .phe-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .phe-ex > * { grid-column: 1; } .phe-ex > .phe-ctrl { grid-column: 2; grid-row: 1 / span 5; } }
        @media (max-width: 900px) { .phe-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .phe-in { animation: phe-fondu 0.35s ease-out; } @keyframes phe-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Effet photoélectrique</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>La lumière est un flux de photons : un photon d’énergie h ν peut arracher un électron à un métal, mais seulement si cette énergie est suffisante.</div>
      {!enExplore && <div className="phe-l1 cote">
        {enGuide ? <div className="phe-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="phe-carte">{panneauHypo}</div> : null}
        <div className="phe-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'direct' ? suiviD : suiviI}/></div>}
          <div className="phe-col">
            {boxScene && <div className="phe-in">{boxScene}</div>}
            {ctrlNu}
            {grapheG}
          </div>
        </div>
      </div>}
      {enExplore && <div className="phe-ex">
        <div>{sceneEx}</div>
        <div className="phe-ctrl">{reglagesEx}</div>
        <div>{grapheEx}</div>
        <div>{mesuresEx}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && deja('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
