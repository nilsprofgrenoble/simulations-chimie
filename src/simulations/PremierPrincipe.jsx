import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, LigneMesure, IndiceDefi, indicesProfond, avecIndices } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./premierPrincipeModele";
import { QCM_PARCOURS as Q } from "./ppQcm";
import { SceneSysteme, SceneBlocs, GrapheBilan, SvgCarteU, SvgCarteTransferts, SvgCartePrincipe, SvgCarteC, SvgCarteBilan } from "./ppSchemas";

const SIM_ID = 216, CLE_GUIDE = 'premier-principe-tg-guide-v1';
declarerDefis(SIM_ID, [['chauffer', 'Chauffer un liquide'], ['bilan', 'Bilan d’énergie d’un bloc']]);

// ====================================================
// SIM 216 — PREMIER PRINCIPE : ÉNERGIE INTERNE, TRANSFERTS ET BILAN D'ÉNERGIE
//  (TG spé PC, « L'énergie : conversions et transferts », « Effectuer des bilans d'énergie sur un système : le premier principe »).
//  Capacités visées (jamais affichées à l'élève) : citer les contributions microscopiques à l'énergie interne ; prévoir le sens d'un transfert thermique ;
//  distinguer variation d'énergie du système et transferts (travail, chaleur) ; exploiter ΔU = C ΔT (système incompressible) pour un bilan d'énergie.
//  Modèle : premierPrincipeModele.js (test : premierPrincipeModele.test.mjs).
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const BLEU = '#0369a1';
const IDS = ['systeme', 'micro', 'temperature', 'sens', 'modes', 'principe', 'incompressible', 'bilanq', 'prevoir', 'complet', 'bilan'];
const I = Object.fromEntries(IDS.map((d, k) => [d, k]));

// ---------- formules (MathML) ----------
const sur = (a, b) => <mfrac>{a}{b}</mfrac>;
const FPrincipe = <Formule><mi>Δ</mi><mi>U</mi><mo>=</mo><mi>W</mi><mo>+</mo><mi>Q</mi></Formule>;
const FIncomp = <Formule><mi>Δ</mi><mi>U</mi><mo>=</mo><mi>C</mi><mo>×</mo><mi>Δ</mi><mi>T</mi></Formule>;
const ePrincipe = <FormuleEnLigne><mi>Δ</mi><mi>U</mi><mo>=</mo><mi>W</mi><mo>+</mo><mi>Q</mi></FormuleEnLigne>;
const eIncomp = <FormuleEnLigne><mi>Δ</mi><mi>U</mi><mo>=</mo><mi>C</mi><mo>×</mo><mi>Δ</mi><mi>T</mi></FormuleEnLigne>;
const eDT = <FormuleEnLigne><mi>Δ</mi><mi>T</mi><mo>=</mo>{sur(<mrow><mi>Δ</mi><mi>U</mi></mrow>, <mi>C</mi>)}</FormuleEnLigne>;
const eC = <FormuleEnLigne><mi>C</mi><mo>=</mo><mi>m</mi><mo>×</mo><mi>c</mi></FormuleEnLigne>;
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

// contrôle d'une grandeur : curseur + boutons − / + + rétablir
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

export function SimulationPremierPrincipe() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviC, noterC] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('chauffer');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ mat: false, essayer: false, retenir: false });
  const [qG, setQG] = useState(0);                                                                  // parcours : énergie reçue (kJ), étape « température »
  const EX0 = { mat: 'eau', m: 0.5, Ti: 20, Q: 20, W: 0 };
  const [ex, setEx] = useState(EX0);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;

  const etape = guide.etape, idx = enGuide ? Math.min(etape, IDS.length - 1) : -1;
  const deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- état de l'exploration ----------
  const matEx = M.matDe(ex.mat), solide = ex.mat === 'alu' || ex.mat === 'cuivre', Wex = solide ? 0 : ex.W, Cex = M.capacite(ex.m, matEx.c), dUex = M.variationU(Wex * 1000, ex.Q * 1000), dTex = M.variationT(dUex, Cex), Tfex = ex.Ti + dTex;

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'systeme', titre: 'Le système et l’extérieur', focus: ['scene'],
      texte: <>Pour faire un bilan d’énergie, on commence par <strong>choisir le système</strong> : la partie de l’Univers que l’on étudie, entourée ici par un trait bleu pointillé. Tout ce qui n’est pas dans le système est l’<strong>extérieur</strong>. Ici, on étudie l’eau d’un bécher posé sur une plaque chauffante ; une pale peut aussi brasser l’eau.</>,
      tache: { type: 'qcm', q: 'Le système est l’eau du bécher. Que fait alors partie de l’extérieur ?', options: Q.systeme.options, bonne: 0,
        expl: 'Le système est l’eau du bécher : tout le reste est extérieur, y compris le bécher, la plaque chauffante, la pale et l’air de la pièce. L’énergie passe d’une des parties de l’extérieur au système, ou l’inverse, à travers la limite du système.',
        indice: 'Relisez le trait pointillé : il entoure seulement l’eau. Tout le reste est extérieur.' } },
    { id: 'micro', titre: 'L’énergie interne', focus: ['scene'],
      texte: <>À l’échelle microscopique, les molécules de l’eau sont agitées et exercent des forces les unes sur les autres. L’<strong>énergie interne</strong> U du système est la somme de deux contributions : l’énergie <strong>cinétique microscopique</strong> (due à l’agitation des molécules) et l’énergie <strong>potentielle d’interaction</strong> (due aux forces entre molécules). U ne comprend pas l’énergie du système vu comme un tout (son mouvement d’ensemble, son altitude).</>,
      tache: { type: 'qcm', q: 'Laquelle de ces énergies fait partie de l’énergie interne de l’eau du bécher ?', options: Q.micro.options, bonne: 0,
        expl: 'L’énergie interne regroupe l’énergie cinétique d’agitation des molécules et l’énergie potentielle due à leurs interactions. La vitesse ou la hauteur du bécher décrivent le système entier : ce sont des énergies macroscopiques (cinétique et potentielle de pesanteur du système), pas de l’énergie interne. Le poids n’est pas une énergie.',
        indice: 'L’énergie interne se décrit à l’échelle des molécules : agitation et interactions.' } },
    { id: 'temperature', titre: 'Température et énergie interne', focus: ['scene', 'reglages'],
      texte: <>La température mesure l’agitation des molécules. Quand on chauffe l’eau, l’agitation augmente. Choisissez dans le menu l’énergie reçue par l’eau (transfert thermique de la plaque) et regardez le thermomètre. Le bécher reste immobile : seule l’énergie interne de l’eau varie.</>,
      tache: { type: 'qcm', q: 'On chauffe l’eau sans qu’elle change d’état. Que dire de l’énergie interne U ?', options: Q.temperature.options, bonne: 0,
        expl: 'Chauffer augmente la température, donc l’agitation des molécules, donc l’énergie cinétique microscopique : U augmente. Les molécules ne s’écartent pas (le liquide ne se dilate presque pas), la masse ne change pas : elle ne joue aucun rôle dans l’augmentation de U ici.',
        indice: 'Relisez le lien entre température et agitation, puis entre agitation et énergie interne.' } },
    { id: 'sens', titre: 'Le sens d’un transfert thermique', focus: ['scene'],
      retenirTitre: 'L’énergie interne',
      retenir: <>
        <SvgCarteU/>
        <ul style={ULS}>
          <li>L’<strong>énergie interne U</strong> d’un système est la somme de l’énergie cinétique microscopique (agitation) et de l’énergie potentielle d’interaction entre ses constituants.</li>
          <li>Plus la température est grande, plus l’agitation est grande : U augmente avec T (sans changement d’état).</li>
          <li>Moyen de s’en souvenir : <strong>« U = agitation + interactions »</strong>. Idée fausse : « l’énergie interne contient l’énergie du bécher qui bouge ». Vrai : mouvement d’ensemble et altitude sont à part.</li>
        </ul></>,
      texte: <>Un bloc de cuivre à <strong>80{NB}°C</strong> est plongé dans de l’eau à <strong>20{NB}°C</strong>. L’ensemble est isolé de l’extérieur. Un <strong>transfert thermique</strong> a lieu entre les deux corps parce que leurs températures sont différentes ; il est noté Q.</>,
      tache: { type: 'qcm', q: 'Dans quel sens se fait spontanément le transfert thermique ?', options: Q.sens.options, bonne: 0,
        expl: 'Un transfert thermique se fait spontanément du corps le plus chaud vers le corps le plus froid : ici du cuivre vers l’eau, jusqu’à ce que les températures soient égales. Il n’y en a pas dans l’autre sens, et il a lieu même entre un solide et un liquide.',
        indice: 'Quand on plonge une cuillère chaude dans un verre d’eau froide, laquelle se refroidit ?' } },
    { id: 'modes', titre: 'Chaleur et travail', focus: ['scene'],
      texte: <>Un système peut échanger de l’énergie avec l’extérieur de deux façons. Par <strong>transfert thermique</strong> Q (ou chaleur) : à cause d’un écart de température, par conduction, convection ou rayonnement (flèche rouge). Par <strong>travail</strong> W : une force exercée sur le système déplace son point d’application, par exemple une pale qui brasse ou un piston qui comprime (flèche verte).</>,
      tache: { type: 'qcm', q: 'Dans lequel de ces cas l’eau reçoit-elle de l’énergie par travail ?', options: Q.modes.options, bonne: 0,
        expl: 'La pale exerce une force sur l’eau et la met en mouvement : c’est un transfert d’énergie par travail. La plaque chauffante, l’air plus chaud de la pièce et l’eau plus chaude versée dans le bécher agissent par différence de température : ce sont des transferts thermiques (ou, pour l’eau versée, un apport de matière chaude).',
        indice: 'Y a-t-il une force qui déplace quelque chose dans l’eau, ou seulement un écart de température ?' } },
    { id: 'principe', titre: 'Le premier principe', focus: ['scene'],
      retenirTitre: 'Transfert thermique et travail',
      retenir: <>
        <SvgCarteTransferts/>
        <ul style={ULS}>
          <li><strong>Transfert thermique Q</strong> : du corps chaud vers le corps froid ; conduction, convection ou rayonnement.</li>
          <li><strong>Travail W</strong> : une force qui déplace son point d’application (pale, piston).</li>
          <li>Moyen de s’en souvenir : <strong>« Q = écart de température, W = force qui déplace »</strong>. Idée fausse : « la chaleur est une énergie que le système contient ». Vrai : Q et W sont des transferts, U est ce que le système contient.</li>
        </ul></>,
      texte: <>Le <strong>premier principe</strong> de la thermodynamique relie la variation d’énergie du système aux transferts :{FPrincipe}ΔU est la variation d’énergie interne du système (énergie finale moins énergie initiale) ; W et Q sont les énergies reçues par le système, comptées <strong>positivement si le système les reçoit</strong>, négativement s’il les cède (en joules, J). Ici le système reste immobile et ne change pas d’altitude : seule U varie.</>,
      tache: { type: 'num', q: 'Un gaz enfermé sous un piston reçoit Q = +600 J par transfert thermique et, en se détendant, fournit à l’extérieur un travail de 150 J (donc W = −150 J). Quelle est la variation d’énergie interne ΔU du gaz, en J ?', unite: 'J', vrai: 450, tol: 0.01, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['W = −150 J (le système cède 150 J) ; Q = +600 J (le système reçoit 600 J).', <>ΔU = W + Q = (−150) + 600 = 450 J.</>],
        pieges: [[750, 'Vous avez compté le travail positivement : le système le cède, donc W = −150 J.'], [-450, 'Le signe est inversé : l’énergie reçue (Q) est plus grande que l’énergie cédée (W), donc ΔU > 0.'], [600, 'Vous avez oublié le travail : ΔU = W + Q, pas seulement Q.']],
        expl: <>ΔU = W + Q = (−150) + 600 = 450 J : l’énergie interne augmente, car le gaz reçoit plus qu’il ne cède.</>,
        indice: <>{ePrincipe}, avec W = −150 J (énergie cédée) et Q = +600 J (énergie reçue).</> } },
    { id: 'incompressible', titre: 'Un système incompressible', focus: ['scene'],
      retenirTitre: 'Le premier principe',
      retenir: <>
        <SvgCartePrincipe/>
        <ul style={ULS}>
          <li><strong>ΔU = W + Q</strong> : variation d’énergie interne = énergie reçue par travail + énergie reçue par transfert thermique.</li>
          <li>Reçue : positive ; cédée : négative. Un système qui ne bouge pas en bloc n’a que son énergie interne qui varie.</li>
          <li>Moyen de s’en souvenir : <strong>« ce qui entre moins ce qui sort »</strong>, avec les signes. Idée fausse : « la chaleur seule fait varier U ». Vrai : le travail aussi.</li>
        </ul></>,
      texte: <>Un solide ou un liquide dont le volume ne varie pas est un système <strong>incompressible</strong> : il ne reçoit pas de travail du fait d’un changement de volume. Sa variation d’énergie interne ne dépend que de sa variation de température (sans changement d’état) :{FIncomp}C est la <strong>capacité thermique</strong> du système (en J·K⁻¹) ; C = m × c, où c est la capacité thermique massique du matériau (donnée). Pour l’eau, c = 4180{NB}J·kg⁻¹·K⁻¹. On chauffe <strong>0,500{NB}kg</strong> d’eau de 20{NB}°C à 35{NB}°C, sans changement d’état.</>,
      tache: { type: 'num', q: 'Quelle est la variation d’énergie interne ΔU de l’eau, en kJ ? (2 chiffres significatifs)', unite: 'kJ', vrai: M.capacite(0.5, 4180) * 15 / 1000, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['ΔT = 35 − 20 = 15 K (un écart de 1 °C est égal à un écart de 1 K) ; C = m × c = 0,500 × 4180 = 2090 J·K⁻¹.', <>ΔU = C × ΔT = 2090 × 15 = 31 350 J = 31 kJ.</>],
        pieges: [[73.15, 'Il faut l’écart de température ΔT = 35 − 20 = 15 K, pas la température finale.'], [62.7, 'Vous avez oublié la masse : C = m × c = 0,500 × 4180.'], [31350, 'Vous avez donné ΔU en J : la réponse est attendue en kJ (1 kJ = 1000 J).']],
        expl: <>C = m × c = 0,500 × 4180 = 2090 J·K⁻¹ ; ΔU = C × ΔT = 2090 × 15 = 31 350 J = 31 kJ.</>,
        indice: <>{eIncomp} avec {eC} et ΔT = température finale − température initiale. Convertissez le résultat de J en kJ.</> } },
    { id: 'bilanq', titre: 'Du transfert thermique à la température', focus: ['scene'],
      texte: <>On peut maintenant prévoir une température finale. De l’eau (c = 4180{NB}J·kg⁻¹·K⁻¹) de masse <strong>0,250{NB}kg</strong>, initialement à <strong>18{NB}°C</strong>, reçoit de la plaque chauffante un transfert thermique <strong>Q = 20{NB}kJ</strong>. Aucun travail n’est échangé (W = 0), les pertes sont négligées, et l’eau ne change pas d’état.</>,
      tache: { type: 'num', q: 'Quelle est la température finale de l’eau, en °C ? (2 chiffres significatifs)', unite: '°C', vrai: 18 + 20000 / (0.25 * 4180), tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['W = 0 donc ΔU = Q = 20 kJ = 20 000 J ; C = m × c = 0,250 × 4180 = 1045 J·K⁻¹.', <>{eDT} = {avecIndices('frac(20 000|1045)')} = 19 K, donc θ_f = 18 + 19 = 37 °C.</>],
        pieges: [[19.14, 'C’est l’échauffement ΔT : il faut l’ajouter à la température initiale (18 °C).'], [22.78, 'Vous avez oublié la masse : C = m × c = 0,250 × 4180.'], [18.02, 'Le transfert thermique n’a pas été converti en joules : 20 kJ = 20 000 J.']],
        expl: <>ΔU = W + Q = 0 + 20 000 J ; C = 0,250 × 4180 = 1045 J·K⁻¹ ; ΔT = {avecIndices('frac(20 000|1045)')} = 19 K ; θ_f = 18 + 19 = 37 °C.</>,
        indice: <>W = 0 donc ΔU = Q. Puis {eDT} (Q en joules, C = m × c), et enfin θ_f = θ_i + ΔT.</> } },
    { id: 'prevoir', titre: 'Prévoir sans calculer', focus: [],
      texte: <>On donne la même énergie par transfert thermique à <strong>1,0{NB}kg d’eau</strong> (c = 4180{NB}J·kg⁻¹·K⁻¹) et à <strong>1,0{NB}kg de cuivre</strong> (c = 385{NB}J·kg⁻¹·K⁻¹), au départ à la même température. Les pertes sont négligées.</>,
      tache: { type: 'qcm', q: 'Lequel s’échauffe le plus, et pourquoi ?', options: Q.prevoir.options, bonne: 0,
        expl: <>À même masse et même énergie reçue, {eDT} est d’autant plus grand que C est petite. Le cuivre a une capacité thermique massique environ 11 fois plus faible que l’eau : il s’échauffe environ 11 fois plus. La masse volumique ne joue aucun rôle ici, et l’eau (c grande) s’échauffe peu.</>,
        indice: <>{eDT} : à ΔU égale et même masse, qui a la plus petite capacité thermique C = m × c ?</> } },
    { id: 'complet', titre: 'Un bilan complet', focus: ['scene'],
      retenirTitre: 'Capacité thermique et variation de température',
      retenir: <>
        <SvgCarteC/>
        <ul style={ULS}>
          <li><strong>ΔU = C × ΔT</strong> avec <strong>C = m × c</strong> (en J·K⁻¹) pour un système incompressible, sans changement d’état.</li>
          <li>Pour une même énergie reçue : plus C est grande, plus ΔT est petite. ΔT = {avecIndices('frac(ΔU|C)')}.</li>
          <li>Moyen de s’en souvenir : <strong>« grosse capacité, petit échauffement »</strong>. Idée fausse : « un matériau lourd s’échauffe moins ». Vrai : c’est la capacité thermique massique c qui compte.</li>
        </ul></>,
      texte: <>La plaque chauffante fournit à l’eau une puissance constante <strong>P = 300{NB}W</strong> pendant <strong>2,0{NB}min</strong> (une puissance est une énergie par seconde : Q = P × durée, durée en secondes). Le bécher contient <strong>0,400{NB}kg</strong> d’eau (c = 4180{NB}J·kg⁻¹·K⁻¹) à <strong>20{NB}°C</strong>. On suppose que toute l’énergie fournie par la plaque est reçue par l’eau (pertes négligées), sans travail ni changement d’état.</>,
      tache: { type: 'num', q: 'Quelle est la température de l’eau à la fin du chauffage, en °C ? (2 chiffres significatifs)', unite: '°C', vrai: 20 + 300 * 120 / (0.4 * 4180), tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['Q = P × durée = 300 × 120 = 36 000 J (2,0 min = 120 s) ; W = 0 donc ΔU = Q ; C = 0,400 × 4180 = 1672 J·K⁻¹.', <>{eDT} = {avecIndices('frac(36 000|1672)')} = 21,5 K, donc θ_f = 20 + 21,5 ≈ 42 °C.</>],
        pieges: [[20.36, 'La durée n’a pas été convertie en secondes : 2,0 min = 120 s, donc Q = 36 000 J.'], [28.6, 'Vous avez oublié la masse : C = m × c = 0,400 × 4180.'], [21.5, 'C’est l’échauffement ΔT : il faut l’ajouter à la température initiale (20 °C).']],
        expl: <>Q = 300 × 120 = 36 000 J ; ΔU = W + Q = 36 000 J ; C = 0,400 × 4180 = 1672 J·K⁻¹ ; ΔT = {avecIndices('frac(36 000|1672)')} = 21,5 K ; θ_f = 20 + 21,5 ≈ 42 °C.</>,
        indice: <>Q = P × durée (en secondes), ΔU = Q puisque W = 0, puis {eDT} avec C = m × c, et θ_f = θ_i + ΔT.</> } },
    { id: 'bilan', titre: 'Le bilan', focus: [],
      retenirTitre: 'Méthode du bilan d’énergie',
      retenir: <>
        <SvgCarteBilan/>
        <ul style={ULS}>
          <li>Choisir le système ; lister les énergies <strong>reçues</strong> (W et Q, avec leurs signes) ; écrire <strong>ΔU = W + Q</strong> ; pour un système incompressible, <strong>ΔU = C × ΔT</strong>, d’où ΔT et la température finale.</li>
          <li>Unités : énergies en joules, temps en secondes (Q = P × durée), masse en kg, écart de température en K ou °C.</li>
          <li>Moyen de s’en souvenir : <strong>« système, W et Q, ΔU, ΔT »</strong>. Idée fausse : « la température finale est ΔT ». Vrai : θ_f = θ_i + ΔT.</li>
        </ul></>,
      texte: <>Vous savez citer les contributions à l’énergie interne, prévoir le sens d’un transfert thermique, distinguer variation d’énergie du système et transferts (travail, chaleur), écrire le premier principe {ePrincipe} et l’exploiter avec {eIncomp} pour un système incompressible. Passez à l’exploration (bécher, plaque chauffante, pale, graphique du bilan) ou tentez les défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => { setDefi({ ...(type === 'chauffer' ? M.tirageChauffer() : M.tirageBilan()), type, s1: '', s2: '', s3: '', verifie: false, essais: 0 }); };
  const choisirDefi = tp => { setTypeDefi(tp); nouveauDefi(tp); };
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const verifier = () => {
    const pr = (v, a, tol) => isFinite(v) && Math.abs(v - a) <= tol * Math.abs(a);
    const res = [1, 2, 3].map(k => pr(lireNombre(defi[`s${k}`] || ''), defi[`rep${k}`], k === 1 && defi.type === 'bilan' || k === 3 ? 0.08 : 0.06));
    const ok = res.every(Boolean);
    setDefi(d => ({ ...d, verifie: true, ok, res, essais: ok ? d.essais : (d.essais || 0) + 1 }));
    (defi.type === 'chauffer' ? noterC : noterB)(ok);
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (aria, cle, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6, fontSize: 14 }}>
      <span>{avecIndices(aria)} =</span>
      <input value={defi[cle] || ''} aria-label={aria} onKeyDown={e => e.key === 'Enter' && document.getElementById('pp1-verif')?.click()} onChange={e => setDefi(d => ({ ...d, [cle]: e.target.value, verifie: false }))} inputMode="decimal"
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.res[+cle.slice(1) - 1] ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
      <span>{unite}</span>
    </div>);
  const fJ = x => nbf(x, 0), f1 = x => nbf(x, 1);
  const solutionDefi = d => d.type === 'chauffer'
    ? <>C = m × c = {nbf(d.m, 2)} × {d.mat.c} = {fJ(d.rep1)} J·K⁻¹ ; Q = P × durée = {d.P} × {fJ(d.tmin * 60)} = {fJ(d.rep2 * 1000)} J = {f1(d.rep2)} kJ ; ΔT = {avecIndices('frac(Q|C)')} = {f1(d.rep3 - d.Ti)} K, donc θ_f = {d.Ti} + {f1(d.rep3 - d.Ti)} = {f1(d.rep3)} °C.</>
    : <>ΔU = W + Q = {fJ(d.W)} + ({fJ(d.Q)}) = {fJ(d.rep1)} J ; C = m × c = {nbf(d.m, 2)} × {d.mat.c} = {fJ(d.C)} J·K⁻¹, donc ΔT = {avecIndices('frac(ΔU|C)')} = {f1(d.rep2)} K ; sans travail, Q′ = C × (θ_c − θ_i) = {fJ(d.C)} × {d.Tc - d.Ti} = {fJ(d.rep3 * 1000)} J = {f1(d.rep3)} kJ.</>;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['chauffer', 'Chauffer un liquide'], ['bilan', 'Bilan d’énergie d’un bloc']].map(([tp, l]) => <button key={tp} onClick={() => choisirDefi(tp)} aria-pressed={defi.type === tp} style={stylePetitBouton(defi.type === tp, BLEU)}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'chauffer' ? 'Défi : chauffer un liquide' : 'Défi : bilan d’énergie d’un bloc'}</div>
      {defi.type === 'chauffer' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un récipient contient <strong>{nbf(defi.m, 2)}{NB}kg</strong> de {defi.mat.id === 'eau' ? 'l’eau' : 'l’huile alimentaire'} (c = {defi.mat.c}{NB}J·kg⁻¹·K⁻¹) à <strong>{defi.Ti}{NB}°C</strong>. Une plaque chauffante lui fournit <strong>P = {defi.P}{NB}W</strong> pendant <strong>{nbf(defi.tmin, 1)}{NB}min</strong>. Pertes négligées, pas de travail, pas de changement d’état. Donnez vos résultats avec 2 chiffres significatifs (marge acceptée : 6{NB}%, 8{NB}% pour la question 3 ; gardez un chiffre de plus dans les calculs intermédiaires).</div>
        <div style={{ ...lbl, marginBottom: 2 }}><strong>1.</strong> Capacité thermique C du liquide, en J·K⁻¹.</div>
        {champ('C', 's1', 'J·K⁻¹')}
        <IndiceDefi cache={false}>C = m × c, avec m en kg et c en J·kg⁻¹·K⁻¹.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>2.</strong> Énergie Q reçue par transfert thermique, en kJ.</div>
        {champ('Q', 's2', 'kJ')}
        <IndiceDefi cache={false}>Q = P × durée, avec la durée en secondes ; le résultat est en joules, à diviser par 1000 pour des kJ.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>3.</strong> Température finale θ_f du liquide, en °C.</div>
        {champ('θ_f', 's3', '°C')}
        <IndiceDefi cache={false}>W = 0 donc ΔU = Q, puis ΔT = {avecIndices('frac(ΔU|C)')} (en joules et J·K⁻¹) ; θ_f = θ_i + ΔT.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un bloc de <strong>{nbf(defi.m, 2)}{NB}kg</strong> de {defi.mat.id === 'alu' ? 'aluminium' : 'cuivre'} (c = {defi.mat.c}{NB}J·kg⁻¹·K⁻¹) est à <strong>{defi.Ti}{NB}°C</strong>. Posé sur une plaque chauffante et martelé par un marteau-pilon, il reçoit un transfert thermique <strong>Q = {fJ(defi.Q).replace('-', '−')}{NB}J</strong> et un travail (martelage) <strong>W = {fJ(defi.W)}{NB}J</strong> (énergies reçues : le signe − indique une énergie cédée). Le bloc ne change pas d’état. Donnez vos résultats avec 2 chiffres significatifs (marge acceptée : 6{NB}%, 8{NB}% pour les questions 2 et 3 ; gardez un chiffre de plus dans les calculs intermédiaires).</div>
        <div style={{ ...lbl, marginBottom: 2 }}><strong>1.</strong> Variation d’énergie interne ΔU du bloc, en J.</div>
        {champ('ΔU', 's1', 'J')}
        <IndiceDefi cache={false}>ΔU = W + Q, avec les signes : reçu positif, cédé négatif.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>2.</strong> Variation de température ΔT du bloc, en K (négative si le bloc se refroidit).</div>
        {champ('ΔT', 's2', 'K')}
        <IndiceDefi cache={false}>ΔT = {avecIndices('frac(ΔU|C)')} avec C = m × c, en J·K⁻¹.</IndiceDefi>
        <div style={{ ...lbl, margin: '10px 0 2px' }}><strong>3.</strong> On veut ensuite faire passer le bloc de {defi.Ti}{NB}°C à <strong>{defi.Tc}{NB}°C</strong> uniquement par transfert thermique (sans travail). Quelle énergie Q′ faut-il lui fournir, en kJ ?</div>
        {champ('Q′', 's3', 'kJ')}
        <IndiceDefi cache={false}>Sans travail, Q′ = ΔU = C × (θ_c − θ_i), en joules, à diviser par 1000 pour des kJ.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="pp1-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? '✓ Correct. ' : `✗ Pas tout à fait (question 1 ${defi.res[0] ? 'juste' : 'à revoir'}, question 2 ${defi.res[1] ? 'juste' : 'à revoir'}, question 3 ${defi.res[2] ? 'juste' : 'à revoir'}). `}
        {defi.ok || (defi.essais || 0) >= 3
          ? <span style={{ fontWeight: 400 }}>{solutionDefi(defi)}</span>
          : <span style={{ fontWeight: 400 }}>Vérifiez les conversions (min en s, kJ en J), les signes des énergies reçues et la relation utilisée, puis vérifiez à nouveau (les indices peuvent aider).</span>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Système</strong> : un corps (liquide ou solide) de masse m constante, à température <strong>uniforme</strong>, macroscopiquement immobile et à altitude constante : seule son énergie interne varie. Les énergies cinétique et potentielle macroscopiques n’interviennent pas.</li>
      <li><strong>Premier principe</strong> : ΔU = W + Q, W et Q étant les énergies <strong>reçues</strong> (positives si reçues, négatives si cédées).</li>
      <li><strong>Système incompressible</strong> : volume constant, donc aucun travail des forces de pression ; le travail envisagé est celui d’une pale qui brasse un liquide ; pour un bloc solide (défi), celui d’un martelage. ΔU = C × ΔT avec C = m × c.</li>
      <li><strong>Capacité thermique massique</strong> c supposée constante et donnée (eau 4180 ; huile alimentaire 2000 ; aluminium 900 ; cuivre 385 J·kg⁻¹·K⁻¹, valeurs usuelles arrondies). L’huile est un exemple d’ordre de grandeur.</li>
      <li><strong>Pas de changement d’état</strong> : l’eau reste liquide, les températures restent dans un domaine de 5 à 95 °C. Hors de ce domaine, le modèle n’est plus valable et la simulation le signale.</li>
      <li><strong>Pertes négligées</strong> : toute l’énergie fournie par la plaque chauffante est reçue par le système (en pratique, une partie est perdue vers l’air et le bécher). La capacité thermique du récipient est négligée.</li>
      <li><strong>Température</strong> : un écart de 1 °C est un écart de 1 K ; ΔT s’exprime indifféremment en K ou en °C ; la température finale s’écrit θ_f = θ_i + ΔT.</li>
      <li><strong>Valeurs des exercices et des défis</strong> : fictives mais réalistes (puissances de 200 à 1000 W, masses de 0,2 à 2 kg).</li>
      <li><strong>Hors périmètre</strong> : gaz (travail des forces de pression), changements d’état et chaleur latente, flux et résistance thermique (voir la simulation sur les transferts thermiques), enthalpie.</li>
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

  // ---------- scène du parcours / du défi ----------
  let sceneGuide = null;
  const Tguide = 20 + qG * 1000 / M.capacite(0.5, 4180);
  if (enGuide) {
    if (idx === I.systeme || idx === I.micro) sceneGuide = <SceneSysteme nom="eau"/>;
    else if (idx === I.temperature) sceneGuide = <SceneSysteme nom="eau" T={Tguide} Q={qG * 1000} montre={{ T: true, Q: true }}/>;
    else if (idx === I.sens) sceneGuide = <SceneBlocs T1={80} T2={20}/>;
    else if (idx === I.modes || idx === I.principe) sceneGuide = <SceneSysteme nom="eau" montre={{ Q: true, W: true }}/>;
    else if (idx === I.incompressible || idx === I.bilanq) sceneGuide = <SceneSysteme nom="eau"/>;
    else if (idx === I.complet) sceneGuide = <SceneSysteme nom="eau" montre={{ Q: true }}/>;
  } else if (dd) {
    sceneGuide = <SceneSysteme nom={dd.mat.id} montre={dd.type === 'bilan' ? { Q: true, W: true } : { Q: true }}
      aria={dd.type === 'chauffer' ? 'Un récipient contient un liquide posé sur une plaque chauffante qui lui transfère de l’énergie par chaleur.' : 'Un bloc de métal reçoit un transfert thermique et un travail ; ses valeurs sont données dans l’énoncé.'}/>;
  }
  const controlesGuide = enGuide && idx === I.temperature && (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={titreCarte}>Énergie reçue par l’eau</div>
      <label style={lblMenu}>Transfert thermique Q (plaque chauffante)<select value={qG} onChange={e => setQG(Number(e.target.value))} style={{ ...menu, marginTop: 2 }}>{[0, 10, 20, 40, 60].map(v => <option key={v} value={v}>{v === 0 ? '0 kJ (plaque éteinte)' : `${v} kJ`}</option>)}</select></label>
      <button onClick={() => setQG(0)} style={stylePetitBouton(false)}><Pic n="refresh"/>Rétablir (0 kJ)</button>
    </div>);
  const boxScene = sceneGuide && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {dd && <div style={aide}>{dd.type === 'chauffer' ? 'Schéma : le liquide est le système ; la plaque chauffante lui transfère de l’énergie (flèche rouge).' : 'Schéma : le bloc est le système ; les valeurs de Q et de W sont dans l’énoncé.'}</div>}
      {sceneGuide}
    </div>);

  // ---------- exploration ----------
  const retablirEx = () => setEx(EX0);
  const horsDomaine = !M.dansDomaine(Tfex);
  const reglagesEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Réglez l’énergie reçue par transfert thermique Q (négative : le système en cède) et, pour un liquide, par travail W (pale), puis choisissez le matériau et la masse dans la rubrique ci-dessous.</div>
      <Controle nom="Transfert thermique Q" valeur={ex.Q} min={-30} max={60} pas={1} onChange={Q => setEx(s => ({ ...s, Q }))} texte={`Q = ${ex.Q >= 0 ? '+' : '−'}${nbf(Math.abs(ex.Q), 0)}${NB}kJ`} onRetablir={retablirEx} retablir="Tout rétablir"/>
      {solide
        ? <div style={{ ...aide, marginBottom: 10 }}>Travail W : une pale ne brasse pas un solide, donc W = 0 ici (dans le défi, un bloc peut recevoir un travail par martelage). Choisissez de l’eau ou de l’huile pour agiter avec la pale.</div>
        : <Controle nom="Travail W (pale)" valeur={ex.W} min={0} max={20} pas={1} onChange={W => setEx(s => ({ ...s, W }))} texte={`W = +${nbf(ex.W, 0)}${NB}kJ`} onRetablir={() => setEx(s => ({ ...s, W: 0 }))} retablir="Rétablir (0 kJ)"/>}
      <Section titre={`Matériau : ${matEx.nom.toLowerCase()} · ${nbf(ex.m, 2)} kg · ${ex.Ti} °C`} ouvert={ouv.mat} onBascule={() => setOuv(o => ({ ...o, mat: !o.mat }))}>
        <div style={aide}>Le matériau fixe c ; avec la masse m, il fixe la capacité thermique C = m × c.</div>
        <label style={lblMenu}>Matériau<select value={ex.mat} onChange={e => setEx(s => ({ ...s, mat: e.target.value }))} style={{ ...menu, marginTop: 2 }}>{M.MATERIAUX.map(g => <option key={g.id} value={g.id}>{g.nom} (c = {g.c} J·kg⁻¹·K⁻¹)</option>)}</select></label>
        <label style={lblMenu}>Masse m<select value={ex.m} onChange={e => setEx(s => ({ ...s, m: Number(e.target.value) }))} style={{ ...menu, marginTop: 2 }}>{[0.1, 0.25, 0.5, 1, 2].map(v => <option key={v} value={v}>{nbf(v, 2)} kg</option>)}</select></label>
        <label style={lblMenu}>Température initiale<select value={ex.Ti} onChange={e => setEx(s => ({ ...s, Ti: Number(e.target.value) }))} style={{ ...menu, marginTop: 2 }}>{[10, 20, 30, 50].map(v => <option key={v} value={v}>{v} °C</option>)}</select></label>
      </Section>
    </div>);
  const sceneEx = enExplore && (
    <div style={styleBoite}>
      <div style={aide}>Le matériau étudié est le système (trait bleu pointillé). La flèche rouge est le transfert thermique Q, la flèche verte le travail W : leur sens indique si le système reçoit ou cède de l’énergie.</div>
      <SceneSysteme nom={ex.mat} T={Tfex} Q={ex.Q * 1000} W={Wex * 1000} montre={{ T: true, Q: true, W: true }}/>
    </div>);
  const grapheEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Bilan d’énergie : ΔU = W + Q</div>
      <div style={aide}>Les énergies reçues sont positives (barres vers le haut), les énergies cédées négatives (vers le bas).</div>
      <GrapheBilan W={Wex * 1000} Q={ex.Q * 1000} dU={dUex}/>
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures (valeurs du modèle)</div>
      <div style={aide}>Calculées avec ΔU = W + Q puis ΔU = C × ΔT.</div>
      <LigneMesure nom="Capacité thermique C = m × c" valeur={`${nbf(Cex, 0)}${NB}J·K⁻¹`}/>
      <LigneMesure nom="Variation d’énergie interne ΔU" valeur={`${dUex >= 0 ? '+' : '−'}${nbf(Math.abs(dUex) / 1000, 1)}${NB}kJ`} couleur={BLEU}/>
      <LigneMesure nom="Variation de température ΔT" valeur={`${dTex >= 0 ? '+' : '−'}${nbf(Math.abs(dTex), 1)}${NB}K`} couleur="#b45309"/>
      <LigneMesure nom="Température finale" valeur={`${nbf(Tfex, 1)}${NB}°C`}/>
      {horsDomaine && <div role="status" style={{ ...aide, marginTop: 6, marginBottom: 0, color: '#b91c1c', fontWeight: 700 }}>Température hors du domaine 5 à 95 °C : le modèle (sans changement d’état) n’est plus valable. Réduisez Q ou W.</div>}
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Avec de l’eau, fixez Q = 0 et augmentez W (la pale) : la température monte-t-elle ? Qu’est-ce qui change dans le graphique du bilan ?</li>
        <li>Mettez Q positif et W = 0, puis ajoutez un Q négatif : ΔU peut-il devenir négatif ? Que fait la température ?</li>
        <li>Gardez Q et W, mais passez de l’eau au cuivre : que devient ΔT ? Pourquoi ?</li>
        <li>Doublez la masse sans changer Q et W : que devient ΔT ? Et ΔU ?</li>
        <li>Trouvez des réglages où Q et W se compensent exactement (ΔU = 0) : la température change-t-elle ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Énergie interne U : énergie cinétique microscopique (agitation) + énergie potentielle d’interaction</li>
          <li>Transfert thermique Q : du chaud vers le froid ; travail W : force qui déplace</li>
          <li>Premier principe : {ePrincipe} (énergies reçues, positives si reçues)</li>
          <li>Système incompressible : {eIncomp} avec {eC}</li>
          <li>Température finale : θ_f = θ_i + {eDT}</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .pp1-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .pp1-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .pp1-col { display: flex; flex-direction: column; gap: 12px; }
        .pp1-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .pp1-l1.cote .pp1-carte { order: 2; } .pp1-l1.cote .pp1-main { order: 1; }
          .pp1-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .pp1-ex > * { grid-column: 1; } .pp1-ex > .pp1-ctrl { grid-column: 2; grid-row: 1 / span 5; } }
        @media (max-width: 900px) { .pp1-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .pp1-in { animation: pp1-fondu 0.35s ease-out; } @keyframes pp1-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Premier principe : énergie interne, transferts et bilan d’énergie</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un système échange de l’énergie avec l’extérieur par transfert thermique et par travail{(enGuide && !deja('principe')) ? '.' : <> : sa variation d’énergie interne est donnée par le premier principe, {ePrincipe}.</>}</div>
      {!enExplore && <div className="pp1-l1 cote">
        {enGuide ? <div className="pp1-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="pp1-carte">{panneauHypo}</div> : null}
        <div className="pp1-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'chauffer' ? suiviC : suiviB}/></div>}
          <div className="pp1-col">
            {boxScene && <div className="pp1-in">{boxScene}</div>}
            {controlesGuide && <div className="pp1-in">{controlesGuide}</div>}
          </div>
        </div>
      </div>}
      {enExplore && <div className="pp1-ex">
        <div>{sceneEx}</div>
        <div className="pp1-ctrl">{reglagesEx}</div>
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
