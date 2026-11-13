import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, IndiceDefi, avecIndices, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import { nbf, tire, Schema, T as Tx, puces, ROUGE, VERT, BLEU, ORANGE, NOIR, GRIS } from "./Travail";
import * as I from "./irModele";

const SIM_ID = 111;
declarerDefis(SIM_ID, [['sigma', 'Lire le nombre d’onde d’une bande']]);

// ====================================================
//  SIM 111 — SPECTROSCOPIE D'ABSORPTION INFRAROUGE (1G, chapitre 5)
//  σ = 1/λ, transmittance, bandes O–H (libre, lié, acide) et C=O, comparaison de spectres (DS menthol → menthone, chalcone).
// ====================================================
const cel = (h) => ({ border: `1px solid ${KIT.bord}`, padding: '2px 8px', textAlign: 'center', background: h ? '#f1f5f9' : 'transparent' });
const M = I.MOLECULES;

// ---------- schéma de principe : I0 → échantillon → I ----------
const SchemaPrincipe = () => (
  <Schema aria="Principe : un faisceau infrarouge d'intensité I0 traverse l'échantillon ; l'intensité I qui ressort est plus faible, car une partie du rayonnement a été absorbée" h={150}>
    <line x1="20" y1="70" x2="110" y2="70" stroke={ORANGE} strokeWidth="4"/><path d="M110,70 l-9,-6 v12 z" fill={ORANGE}/>
    <rect x="120" y="40" width="80" height="60" rx="6" fill="#e0f2fe" stroke={BLEU} strokeWidth="2.5"/><Tx x={160} y={74} a="middle" s={12} c={BLEU} w={700}>échantillon</Tx>
    <line x1="210" y1="70" x2="300" y2="70" stroke={ORANGE} strokeWidth="2" strokeDasharray="6 3"/><path d="M300,70 l-9,-6 v12 z" fill={ORANGE}/>
    <Tx x={64} y={52} a="middle" s={13} c={ORANGE} w={800}>I₀</Tx><Tx x={256} y={52} a="middle" s={13} c={ORANGE} w={800}>I</Tx>
    <Tx x={6} y={18} s={12.5} w={700}>Une partie du rayonnement est absorbée</Tx><Tx x={6} y={128} s={11.5} c={GRIS}>T = I ÷ I₀ (en %) ; I est toujours inférieure à I₀</Tx>
  </Schema>);

// ---------- spectre IR : σ décroissant de 4000 à 500 cm⁻¹ ----------
const W = 600, H = 300, MX = 46, MY = 18, MB = 40;
const X = s => MX + (I.SIGMA_MAX - s) / (I.SIGMA_MAX - I.SIGMA_MIN) * (W - MX - 14);
const Y = t => MY + (100 - t) / 100 * (H - MY - MB);
function SpectreIR({ courbes, marques = [], titre, empreinte = true }) {
  const ticks = []; for (let s = I.SIGMA_MIN; s <= I.SIGMA_MAX; s += 100) ticks.push(s);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: '#fff', borderRadius: 8 }} role="img"
      aria-label={`${titre || 'Spectre d’absorption infrarouge'} : transmittance en pourcentage en fonction du nombre d’onde de 4000 à 500 cm moins un, l’axe étant orienté de la droite vers la gauche${courbes.map(c => ` ; courbe ${c.nom}`).join('')}`}>
      <rect x={X(1500)} y={MY} width={X(500) - X(1500)} height={H - MY - MB} fill="#f1f5f9" opacity={empreinte ? 1 : 0}/>
      {empreinte && <text x={(X(1500) + X(500)) / 2} y={H - MB - 8} textAnchor="middle" fontSize="11.5" fill={GRIS}>empreinte digitale</text>}
      <line x1={MX} y1={H - MB} x2={W - 10} y2={H - MB} stroke={GRIS}/><line x1={MX} y1={MY} x2={MX} y2={H - MB} stroke={GRIS}/>
      {[0, 25, 50, 75, 100].map(t => <g key={t}><line x1={MX - 4} y1={Y(t)} x2={MX} y2={Y(t)} stroke={GRIS}/><text x={MX - 7} y={Y(t) + 4} textAnchor="end" fontSize="11.5" fill={GRIS}>{t}</text></g>)}
      {ticks.map(s => <line key={s} x1={X(s)} y1={H - MB} x2={X(s)} y2={H - MB + (s % 500 === 0 ? 8 : 4)} stroke={GRIS}/>)}
      {[4000, 3500, 3000, 2500, 2000, 1500, 1000, 500].map(s => <g key={s}><line x1={X(s)} y1={MY} x2={X(s)} y2={H - MB} stroke="#e2e8f0" strokeDasharray="2 4"/><text x={X(s)} y={H - MB + 22} textAnchor="middle" fontSize="12" fill={NOIR}>{s}</text></g>)}
      <text x={W - 12} y={H - 6} textAnchor="end" fontSize="12.5" fill={GRIS}>σ (cm⁻¹)</text><text x={MX + 6} y="12" fontSize="12.5" fill={GRIS}>T (%)</text>
      {courbes.map((c, i) => <polyline key={i} fill="none" stroke={c.c} strokeWidth="2" points={c.pts.map(([s, t]) => `${X(s).toFixed(1)},${Y(t).toFixed(1)}`).join(' ')}/>)}
      {marques.map((m, i) => <g key={i}><line x1={X(m.s)} y1={Y(m.t) - 4} x2={X(m.s)} y2={Y(m.t) - 24} stroke={m.c || ROUGE} strokeWidth="2"/><text x={X(m.s)} y={Y(m.t) - 28} textAnchor="middle" fontSize="12" fontWeight="700" fill={m.c || ROUGE}>{m.txt}</text></g>)}
      <g fontSize="12" fontWeight="700">{courbes.length > 1 && courbes.map((c, i) => <text key={i} x={W - 14} y={MY + 14 + i * 16} textAnchor="end" fill={c.c}>{c.nom}</text>)}</g>
    </svg>);
}
const courbe = (mol, nom, c = BLEU, bruit = 0) => ({ nom: nom || mol.nom, c, pts: I.spectre(mol, 5, bruit) });
const TableBandes = () => (
  <div>
    <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Bandes à connaître (valeurs de référence)</div>
    <div style={{ overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', fontSize: 13 }}><thead><tr>{['liaison', 'famille', 'σ (cm⁻¹)', 'largeur', 'intensité'].map(h => <th key={h} style={cel(true)}>{h}</th>)}</tr></thead>
      <tbody>{I.TABLE_1G.map((r, i) => <tr key={i}>{r.map((c, k) => <td key={k} style={{ ...cel(), textAlign: k === 1 ? 'left' : 'center' }}>{k === 2 ? (r[0] === 'C=O' ? 'autour de 1700' : String(c)) : c}</td>)}</tr>)}</tbody></table></div>
  </div>);

// ---------- schémas des cartes ----------
const SchemaAxes = () => (
  <Schema aria="Un spectre infrarouge : la transmittance en pourcentage en fonction du nombre d'onde en cm moins un, orienté de la droite vers la gauche ; une bande est un creux vers le bas" h={170}>
    <line x1="30" y1="130" x2="340" y2="130" stroke={GRIS}/><line x1="30" y1="20" x2="30" y2="130" stroke={GRIS}/>
    <polyline fill="none" stroke={BLEU} strokeWidth="2.5" points="30,30 90,32 130,34 160,90 175,40 220,38 250,36 280,34 340,35"/>
    <Tx x={150} y={108} s={11.5} c={ROUGE} w={700}>bande</Tx><Tx x={36} y={146} s={11} c={GRIS}>σ (cm⁻¹) : 4000 ← ← ← ← 500</Tx><Tx x={36} y={16} s={11} c={GRIS}>T (%)</Tx>
    <Tx x={196} y={72} s={11.5} w={700}>σ = 1 ÷ λ (λ en cm)</Tx><Tx x={196} y={90} s={11.5}>λ petit ⇔ σ grand</Tx><Tx x={196} y={106} s={11.5}>σ en cm⁻¹ (inverse d’une longueur)</Tx>
  </Schema>);
const SchemaOH = () => (
  <Schema aria="Trois bandes O–H : alcool libre vers 3600 étroite, alcool lié vers 3300 large et forte, acide carboxylique vers 2900 très large" h={170}>
    <line x1="20" y1="120" x2="344" y2="120" stroke={GRIS}/>
    <path d="M34,40 h40 q8,0 8,0 v60 q-4,0 -8,0 h-6 v-60" fill="none" stroke="none"/>
    <path d="M30,36 L66,36 L70,100 L74,36 L120,36 C130,36 138,60 150,70 C160,80 170,60 182,40 L190,36 L344,36" fill="none" stroke={BLEU} strokeWidth="2.5"/>
    <Tx x={44} y={136} a="middle" s={11} c={BLEU} w={700}>libre</Tx><Tx x={44} y={148} a="middle" s={10.5} c={GRIS}>3600, étroite</Tx>
    <Tx x={150} y={136} a="middle" s={11} c={ROUGE} w={700}>lié</Tx><Tx x={150} y={148} a="middle" s={10.5} c={GRIS}>3300, large, forte</Tx>
    <Tx x={250} y={136} a="middle" s={11} c={ORANGE} w={700}>acide</Tx><Tx x={250} y={148} a="middle" s={10.5} c={GRIS}>2900, très large</Tx>
    <Tx x={6} y={14} s={12.5} w={700}>O–H : liaisons hydrogène ⇒ bande large</Tx>
  </Schema>);
const SchemaCO = () => (
  <Schema aria="La bande C=O est étroite et forte, vers 1700 cm moins un, présente dans les aldéhydes, les cétones et les acides carboxyliques" h={150}>
    <line x1="20" y1="110" x2="344" y2="110" stroke={GRIS}/>
    <path d="M30,30 L170,30 L174,30 L180,100 L186,30 L344,30" fill="none" stroke={BLEU} strokeWidth="2.5"/>
    <Tx x={180} y={124} a="middle" s={12} c={ROUGE} w={800}>C=O ≈ 1700 cm⁻¹</Tx><Tx x={196} y={72} s={11.5} c={GRIS}>étroite, forte</Tx>
    <Tx x={6} y={14} s={12.5} w={700}>C=O : bande fine et profonde vers 1700</Tx><Tx x={6} y={142} s={11} c={GRIS}>aldéhyde · cétone · acide carboxylique (avec O–H large en plus)</Tx>
  </Schema>);
const SchemaReaction = () => (
  <Schema aria="Avant la réaction l'alcool montre une bande large O–H vers 3300 ; après l'oxydation en cétone, cette bande a disparu et une bande fine C=O apparaît vers 1700" h={170}>
    <Tx x={6} y={14} s={12.5} w={700}>Alcool → cétone : une bande part, une autre arrive</Tx>
    <line x1="14" y1="70" x2="160" y2="70" stroke={GRIS}/><path d="M16,30 L40,30 C50,30 60,48 80,62 C95,52 110,34 130,30 L160,30" fill="none" stroke={BLEU} strokeWidth="2.5"/><Tx x={14} y={86} s={11.5} c={BLEU} w={700}>menthol : O–H</Tx>
    <line x1="196" y1="70" x2="342" y2="70" stroke={GRIS}/><path d="M198,30 L290,30 L296,64 L302,30 L342,30" fill="none" stroke={ROUGE} strokeWidth="2.5"/><Tx x={196} y={86} s={11.5} c={ROUGE} w={700}>menthone : C=O</Tx>
    <path d="M166,50 h22" stroke={GRIS} strokeWidth="2"/><path d="M188,50 l-7,-4 v8 z" fill={GRIS}/>
    <Tx x={6} y={116} s={11.5} c={VERT} w={700}>O–H disparu + C=O apparu ⇒ réaction réussie</Tx><Tx x={6} y={134} s={11.5} c={VERT} w={700}>plus de O–H ⇒ plus de menthol (sans doute)</Tx><Tx x={6} y={154} s={11} c={GRIS}>au 1G : on cherche O–H et C=O ; l’empreinte sert à comparer</Tx>
  </Schema>);

export function SimulationIr() {
  const [mode, setMode] = useState(() => modeOuverture('ir-guide-v1'));
  useSignalerMode(mode);
  const [suiviP, noterP] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('ir-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [choix, setChoix] = useState('propanol'), [choix2, setChoix2] = useState(''), [rep, setRep] = useState(false), [curs, setCurs] = useState(3000);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', etape = guide.etape;

  const ETAPES = [
    { id: 'lambda', titre: 'De la longueur d’onde au nombre d’onde', focus: ['principe'],
      retenirTitre: 'À RETENIR : LIRE UN SPECTRE IR',
      retenir: <><SchemaAxes/>{puces(<>Le <strong>nombre d’onde</strong> σ = 1 ÷ λ s’exprime en <strong>cm⁻¹</strong> (λ converti en cm). L’infrarouge utilisé couvre λ de 2,5 à 25 µm, soit environ 4000 à 400 cm⁻¹.</>, <>Un spectre trace la <strong>transmittance T = I ÷ I₀</strong> en fonction de σ (axe orienté de droite à gauche).</>, <>Une <strong>bande d’absorption</strong> est un <strong>creux</strong> : plus il est profond, plus l’absorption est forte.</>, <><strong>Idée fausse</strong> : « une bande est un pic vers le haut ». <strong>Vrai</strong> : la lumière transmise diminue, donc un creux.</>)}</>,
      texte: <>En spectroscopie infrarouge, on envoie un faisceau sur l’échantillon et on mesure ce qui ressort. On caractérise la radiation par son <strong>nombre d’onde</strong> σ = 1 ÷ λ, avec λ en cm. Une radiation a une longueur d’onde de 2,5{NB}µm (1{NB}µm = 10<sup>−4</sup>{NB}cm).</>,
      tache: { type: 'num', q: 'Nombre d’onde de la radiation de longueur d’onde 2,5 µm', unite: 'cm⁻¹', vrai: I.nombreOnde(2.5), tol: 0.03, affiche: v => nbf(v, 0), cs: 3,
        calcul: () => ['λ = 2,5 µm = 2,5 × 10⁻⁴ cm.', 'σ = 1 ÷ λ = 1 ÷ (2,5 × 10⁻⁴) = 4000 cm⁻¹.'], pieges: [[0.4, 'Vous n’avez pas converti λ en cm : 2,5 µm = 2,5 × 10⁻⁴ cm.'], [4e5, 'Vous avez obtenu des m⁻¹ : le nombre d’onde s’exprime ici en cm⁻¹ (divisez par 100).']],
        expl: 'σ = 1 / (2,5 × 10⁻⁴ cm) = 4000 cm⁻¹.', indice: 'Convertissez d’abord λ en cm : 1 µm = 10⁻⁴ cm. Puis σ = 1 ÷ λ.' } },
    { id: 'trans', titre: 'La transmittance', focus: ['principe'],
      texte: <>Un faisceau d’intensité I₀ traverse l’échantillon et ressort avec l’intensité I = 0,40{NB}I₀. On définit la <strong>transmittance</strong> T = I ÷ I₀, souvent en pourcentage.</>,
      tache: { type: 'num', q: 'Transmittance T', unite: '%', vrai: 40, tol: 0.02, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['T = I ÷ I₀ = 0,40 soit 40 %.'], pieges: [[0.4, 'Pensez à l’exprimer en pourcentage : × 100.'], [60, 'C’est le pourcentage absorbé, pas le pourcentage transmis.']],
        expl: 'T = I / I₀ = 0,40 = 40 %.', indice: 'T = I ÷ I₀ ; pour un pourcentage, multipliez par 100.' } },
    { id: 'absorbe', titre: 'La part absorbée', focus: ['principe'],
      texte: <>La transmittance vaut T = 40{NB}%. Le reste de l’intensité n’a pas traversé l’échantillon : il a été absorbé.</>,
      tache: { type: 'num', q: 'Pourcentage de l’intensité absorbé par l’échantillon', unite: '%', vrai: 60, tol: 0.02, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['Absorbé = 100 % − T = 100 − 40 = 60 %.'], pieges: [[40, 'C’est le pourcentage transmis (T) : il faut prendre le complément à 100 %.']],
        expl: 'Part absorbée = 100 % − T = 60 %.', indice: 'Ce qui n’est pas transmis est absorbé : 100 % − T.' } },
    { id: 'creux', titre: 'Lire un spectre', focus: ['spectre'],
      texte: <>Voici le spectre infrarouge du propan-1-ol (CH<sub>3</sub>–CH<sub>2</sub>–CH<sub>2</sub>–OH). Il présente un grand creux vers 3300{NB}cm⁻¹.</>,
      tache: { type: 'qcm', q: 'Que représente ce creux ?', options: ['une bande d’absorption : l’échantillon absorbe fortement vers 3300 cm⁻¹', 'un pic de transmission : l’échantillon laisse tout passer', 'une erreur de mesure du spectromètre'], bonne: 0,
        expl: 'La transmittance chute : une grande part du rayonnement est absorbée à ce nombre d’onde. C’est une bande d’absorption, liée à la vibration d’une liaison de la molécule.', indice: 'Plus la transmittance est basse, plus l’échantillon absorbe.' } },
    { id: 'ohlie', titre: 'La bande O–H d’un alcool', focus: ['spectre', 'table'],
      texte: <>La bande vers 3300{NB}cm⁻¹ est <strong>large</strong> et <strong>forte</strong>. Elle est due à la vibration d’allongement d’une liaison de la molécule de propan-1-ol. Aidez-vous du tableau des bandes de référence.</>,
      tache: { type: 'qcm', q: 'À quelle liaison correspond cette bande ?', options: ['O–H d’un alcool (molécules liées par liaisons hydrogène)', 'C=O d’une cétone', 'O–H d’un acide carboxylique'], bonne: 0,
        expl: 'Une bande large et forte vers 3300 cm⁻¹ est la signature de la liaison O–H d’un alcool lié. Le propan-1-ol n’a pas de C=O, et la bande O–H d’un acide serait plus basse (vers 2900 cm⁻¹).', indice: 'Cherchez dans le tableau une bande à 3300 cm⁻¹, large et forte.' } },
    { id: 'libre', titre: 'O–H libre ou lié', focus: ['spectre'],
      retenirTitre: 'À RETENIR : LES BANDES O–H',
      retenir: <><SchemaOH/>{puces(<><strong>Alcool lié</strong> (liaisons hydrogène entre molécules, liquide pur) : bande <strong>large</strong> et forte vers <strong>3300 cm⁻¹</strong>.</>, <><strong>Alcool libre</strong> (molécules éloignées : gaz, solution diluée) : bande <strong>étroite</strong> vers <strong>3600 cm⁻¹</strong>.</>, <><strong>Acide carboxylique</strong> : bande O–H <strong>très large</strong> vers <strong>2900 cm⁻¹</strong>.</>, <>Mnémo : <strong>les liaisons hydrogène élargissent la bande et la décalent vers les petits σ</strong>.</>)}</>,
      texte: <>On compare le spectre du propan-1-ol pur (bleu) et celui de l’éthanol <strong>dilué</strong> dans un solvant (rouge) : les molécules d’éthanol y sont éloignées les unes des autres. La bande O–H est maintenant <strong>étroite</strong>, vers 3600{NB}cm⁻¹.</>,
      tache: { type: 'qcm', q: 'Pourquoi la bande O–H est-elle étroite et déplacée vers 3600 cm⁻¹ ?', options: ['les molécules sont libres : il n’y a plus de liaisons hydrogène entre elles', 'l’éthanol ne contient pas de liaison O–H', 'le solvant absorbe tout le rayonnement'], bonne: 0,
        expl: 'Dans une solution diluée, les molécules ne peuvent plus former de liaisons hydrogène entre elles : la liaison O–H est « libre », sa bande devient fine et se place vers 3600 cm⁻¹. Dans le liquide pur, ces liaisons élargissent la bande et la décalent vers 3300 cm⁻¹.', indice: 'Que font les molécules d’alcool quand elles sont éloignées les unes des autres ?' } },
    { id: 'colire', titre: 'Lire la bande C=O', focus: ['spectre'],
      texte: <>Voici le spectre de la propanone (CH<sub>3</sub>–CO–CH<sub>3</sub>), une cétone. Il présente une bande <strong>étroite</strong> et <strong>forte</strong> vers 1700{NB}cm⁻¹. Lisez sur l’axe le nombre d’onde du minimum de cette bande (une petite graduation vaut 100{NB}cm⁻¹).</>,
      tache: { type: 'num', q: 'Nombre d’onde de la bande C=O de la propanone', unite: 'cm⁻¹', vrai: 1715, tol: 0.03, affiche: v => nbf(v, 0), cs: 3,
        calcul: () => ['Le minimum de la bande se situe entre les graduations 1700 et 1800, tout près de 1700 : σ ≈ 1715 cm⁻¹.', 'Au programme : « autour de 1700 cm⁻¹ » pour C=O.'], pieges: [],
        expl: 'La bande C=O est à σ ≈ 1715 cm⁻¹, soit autour de 1700 cm⁻¹.', indice: 'Repérez le creux étroit et lisez la graduation en dessous, entre 1500 et 2000.' } },
    { id: 'acide', titre: 'Deux bandes : un acide carboxylique', focus: ['spectre'],
      retenirTitre: 'À RETENIR : LA BANDE C=O',
      retenir: <><SchemaCO/>{puces(<>Aldéhydes, cétones et acides carboxyliques ont une bande <strong>C=O fine et forte vers 1700 cm⁻¹</strong>.</>, <>Un <strong>acide carboxylique</strong> a <strong>en plus</strong> une bande O–H très large vers 2900 cm⁻¹ : deux bandes caractéristiques.</>, <>Exemple : alcool = O–H seul ; cétone = C=O seul ; acide = les deux.</>, <><strong>Idée fausse</strong> : « C=O dit si c’est une cétone ». <strong>Vrai</strong> : C=O existe dans plusieurs familles ; on regarde aussi les autres bandes.</>)}</>,
      texte: <>Le spectre de l’acide éthanoïque (CH<sub>3</sub>–COOH) présente une bande fine et forte vers 1700{NB}cm⁻¹ <strong>et</strong> une bande très large vers 2900{NB}cm⁻¹.</>,
      tache: { type: 'qcm', q: 'Quelles liaisons ces deux bandes indiquent-elles ?', options: ['C=O (bande fine vers 1700) et O–H d’un acide carboxylique (bande très large vers 2900)', 'deux liaisons C=O', 'O–H d’un alcool lié et C=O d’un aldéhyde'], bonne: 0,
        expl: 'La bande fine vers 1700 cm⁻¹ est celle de C=O ; la bande très large vers 2900 cm⁻¹ est celle de O–H d’un acide carboxylique. Avoir les deux signale un acide.', indice: 'Cherchez dans le tableau une bande à 2900 cm⁻¹ très large et une bande autour de 1700 cm⁻¹.' } },
    { id: 'attendu', titre: 'Prévoir : menthol et menthone', focus: ['spectre'],
      texte: <>On oxyde le menthol (alcool, C<sub>9</sub>H<sub>18</sub>CHOH) en menthone (cétone, C<sub>9</sub>H<sub>18</sub>CO). Voici le spectre du menthol, réactif de départ.</>,
      tache: { type: 'qcm', q: 'Quelle bande doit apparaître sur le spectre de la menthone, et laquelle disparaître ?', options: ['apparition de la bande C=O vers 1700 cm⁻¹ ; disparition de la bande O–H large vers 3300 cm⁻¹', 'apparition de la bande O–H ; disparition de la bande C=O', 'aucune différence entre les deux spectres'], bonne: 0,
        expl: 'Le menthol (alcool) porte une liaison O–H ; la menthone (cétone) porte une liaison C=O. L’oxydation fait disparaître O–H et apparaître C=O.', indice: 'Quelle liaison caractéristique a un alcool ? une cétone ?' } },
    { id: 'ds', titre: 'Comparer le produit au réactif', focus: ['spectre'],
      retenirTitre: 'À RETENIR : COMPARER DEUX SPECTRES',
      retenir: <><SchemaReaction/>{puces(<>On compare le spectre du <strong>produit</strong> à celui du <strong>réactif</strong> : bande qui <strong>disparaît</strong> = groupe consommé ; bande qui <strong>apparaît</strong> = groupe formé.</>, <>Exemple : menthol → menthone : O–H disparaît, C=O apparaît.</>, <>Plus aucune trace de la bande du réactif ⇒ il n’en reste sans doute plus : produit <strong>probablement pur</strong> (à la sensibilité de la mesure).</>, <><strong>Piège</strong> : si deux espèces ont le même groupe (deux C=O), l’IR seul ne les distingue pas bien.</>)}</>,
      texte: <>Voici le spectre du menthol (bleu) et celui du composé synthétisé (rouge). Le composé synthétisé n’a plus de bande large vers 3300{NB}cm⁻¹ mais une bande fine et forte vers 1700{NB}cm⁻¹.</>,
      tache: { type: 'qcm', q: 'Que conclure ?', options: ['la synthèse a réussi : le groupe hydroxyle a disparu, un groupe carbonyle est apparu, et il ne reste sans doute pas de menthol', 'le composé synthétisé est du menthol non transformé', 'on ne peut rien conclure avec un spectre IR'], bonne: 0,
        expl: 'La bande O–H du menthol n’existe plus : l’alcool a été consommé. La bande C=O à 1700 cm⁻¹ est cohérente avec une cétone, la menthone. L’absence de bande O–H suggère aussi qu’il ne reste plus de menthol, à la sensibilité de la mesure près.', indice: 'Comparez les deux spectres : quelles bandes ont disparu ? Lesquelles sont apparues ?' } },
    { id: 'chalcone', titre: 'Identifier la chalcone', focus: ['spectre'],
      texte: <>Pour le TP de la chalcone, on enregistre le spectre du produit synthétisé (bleu) et celui de la chalcone de référence (rouge). Les deux ont une bande C=O et pas de bande O–H ; <strong>les deux courbes se superposent</strong>, y compris dans la région de l’empreinte digitale.</>,
      tache: { type: 'qcm', q: 'Que peut-on conclure ?', options: ['les deux spectres sont identiques : on a bien obtenu la chalcone', 'on a seulement prouvé que le produit contient un groupe C=O', 'le produit n’est pas de la chalcone car il contient C=O'], bonne: 0,
        expl: 'L’absence de O–H et la présence de C=O ne suffisent pas (les réactifs ont aussi un C=O). C’est la superposition complète avec le spectre de référence, empreinte comprise, qui indique qu’il s’agit bien de la chalcone.', indice: 'Les réactifs de la synthèse ont-ils aussi une liaison C=O ? Que dit la comparaison de toute la courbe avec la référence ?' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous savez lire un spectre IR : nombre d’onde, transmittance, bandes O–H (libre, lié, acide) et C=O, comparaison avec un réactif ou une référence. En exploration, comparez les spectres de vos choix ; en défi, lisez le nombre d’onde d’une bande.</>, tache: null },
  ];
  const IDS = ETAPES.map(e => e.id), idE = ETAPES[Math.min(etape, ETAPES.length - 1)].id;
  const depuis = id => !enGuide || etape >= IDS.indexOf(id), apres = id => !enGuide || etape > IDS.indexOf(id);
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(); }
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défi</button>
    </span>);

  // spectre affiché selon l'étape
  const vueGuide = () => {
    switch (idE) {
      case 'creux': case 'ohlie': return { c: [courbe(M.propanol)], t: 'Spectre du propan-1-ol' };
      case 'libre': return { c: [courbe(M.propanol, 'propan-1-ol (pur)', BLEU), courbe(M.ethanolDilue, 'éthanol dilué', ROUGE)], t: 'Alcool lié et alcool libre' };
      case 'colire': return { c: [courbe(M.propanone)], t: 'Spectre de la propanone' };
      case 'acide': return { c: [courbe(M.acideEthanoique)], t: 'Spectre de l’acide éthanoïque' };
      case 'attendu': return { c: [courbe(M.menthol)], t: 'Spectre du menthol' };
      case 'ds': return { c: [courbe(M.menthol, 'menthol (réactif)', BLEU), courbe(M.menthone, 'composé synthétisé', ROUGE)], t: 'Réactif et composé synthétisé' };
      case 'chalcone': return { c: [courbe(M.chalcone, 'produit synthétisé', BLEU, 0.6), courbe(M.chalcone, 'chalcone de référence', ROUGE, 0)], t: 'Produit et référence' };
      default: return { c: [courbe(M.propanol)], t: 'Spectre du propan-1-ol' };
    }
  };

  // ════════════════ DÉFI ════════════════
  const nouveauDefi = () => {
    const cle = tire(Object.keys(M).filter(k => k !== 'ethanolDilue' || Math.random() < 0.5)), mol = M[cle];
    const cible = tire(I.bandesCaracteristiques(mol)), dec = tire([-25, -15, -5, 5, 15, 25]);
    const mol2 = { ...mol, bandes: mol.bandes.map(b => (b === cible ? [b[0] + dec, b[1], b[2], b[3]] : b)) };
    const liaison = cible[3].startsWith('O–H') ? 'O–H' : 'C=O';
    setDefi({ cle, mol: mol2, base: mol, liaison, vrai: cible[0] + dec, reps: {}, verifie: false });
  };
  const verifier = () => { const x = lireNombre(defi.reps.r), ok = isFinite(x) && proche(x, defi.vrai, 0.05); setDefi(d => ({ ...d, verifie: true, ok })); noterP(ok); };
  const voletDefi = defi && (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : lire le nombre d’onde d’une bande</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>
        Voici le spectre IR d’un composé : <strong>{defi.base.nom}</strong>. Lisez le nombre d’onde du minimum de la bande due à la liaison <strong>{defi.liaison}</strong> (une petite graduation vaut 100{NB}cm⁻¹). Réponse avec 2 ou 3 chiffres significatifs.
      </div>
      <SpectreIR courbes={[{ nom: defi.base.nom, c: BLEU, pts: I.spectre(defi.mol, 5, 0.3) }]} titre={`Spectre de ${defi.base.nom}`}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '8px 0', fontSize: 14 }}>
        <span>σ ({defi.liaison})</span>
        <input value={defi.reps.r ?? ''} aria-label="Nombre d’onde de la bande" onKeyDown={e => e.key === 'Enter' && document.getElementById('ir-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { r: e.target.value }, verifie: false }))}
          style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>cm⁻¹</span>
      </div>
      <IndiceDefi cache={false}>{'Repérez le creux de la bande demandée : O–H = bande large vers 3300 (ou fine vers 3600 si libre, ou très large vers 2900 si acide) ; C=O = bande fine vers 1700. Lisez ensuite la graduation sous son minimum.'}</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="ir-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={nouveauDefi} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? `✓ Correct : σ ≈ ${nbf(defi.vrai, 0)} cm⁻¹ pour la liaison ${defi.liaison}. La longueur d’onde associée est λ = 1 ÷ σ ≈ ${nbf(I.longueurOnde(defi.vrai), 1)} µm.` : `✗ Vérifiez : cherchez la bande de la liaison ${defi.liaison} (${defi.liaison === 'C=O' ? 'fine et forte, vers 1700' : 'large vers 3300, fine vers 3600 ou très large vers 2900'}) et lisez la graduation sous son creux.`}
      </div>}
    </div>);

  // ════════════════ EXPLORATION ════════════════
  const mol1 = M[choix], mol2 = choix2 ? M[choix2] : null;
  const courbesEx = [courbe(mol1, mol1.nom, BLEU), ...(mol2 ? [courbe(mol2, mol2.nom, ROUGE)] : [])];
  const tc = I.T(mol1, curs);
  const marquesEx = rep ? I.bandesCaracteristiques(mol1).map(b => ({ s: b[0], t: I.T(mol1, b[0]), txt: b[3].startsWith('O–H') ? 'O–H' : 'C=O', c: BLEU })) : [];
  const exploreComparer = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={styleBoite}>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 6 }}>Composé <strong style={{ color: BLEU }}>(bleu)</strong>, puis éventuellement un second <strong style={{ color: ROUGE }}>(rouge)</strong> à comparer.</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }} role="group" aria-label="Premier composé">{Object.entries(M).map(([k, m]) => <button key={k} onClick={() => setChoix(k)} aria-pressed={choix === k} style={stylePetitBouton(choix === k, BLEU)}>{m.nom.split(' (')[0].replace(' dilué dans un solvant', ' dilué')}</button>)}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }} role="group" aria-label="Second composé à comparer"><button onClick={() => setChoix2('')} aria-pressed={!choix2} style={stylePetitBouton(!choix2, ROUGE)}>aucun</button>{Object.entries(M).filter(([k]) => k !== choix).map(([k, m]) => <button key={k} onClick={() => setChoix2(k)} aria-pressed={choix2 === k} style={stylePetitBouton(choix2 === k, ROUGE)}>{m.nom.split(' (')[0].replace(' dilué dans un solvant', ' dilué')}</button>)}</div>
        <SpectreIR courbes={courbesEx} marques={marquesEx} titre={`Spectre de ${mol1.nom}`}/>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 14, color: KIT.txt, marginTop: 8 }}><span style={{ flex: '1 1 160px' }}>Curseur σ</span><input type="range" min="500" max="4000" step="10" value={curs} onChange={e => setCurs(parseInt(e.target.value))} aria-label="Nombre d’onde du curseur" style={{ flex: '2 1 140px', minHeight: 32 }}/><strong>{nbf(curs, 0)}{NB}cm⁻¹</strong></label>
        <div style={{ fontSize: 14, color: KIT.txt, marginTop: 4 }}>λ = 1 ÷ σ = <strong>{nbf(I.longueurOnde(curs), 2)}{NB}µm</strong> · T = <strong>{nbf(tc, 0)}{NB}%</strong> pour {mol1.nom.split(' (')[0]} · absorbé : {nbf(100 - tc, 0)}{NB}%</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: KIT.txt, marginTop: 6 }}><input type="checkbox" checked={rep} onChange={e => setRep(e.target.checked)} style={{ width: 20, height: 20 }}/>Repérer les bandes caractéristiques (O–H, C=O) du composé bleu</label>
      </div>
      <div style={styleBoite}><TableBandes/></div>
    </div>);


  // ---- Suivre une oxydation : mélange menthol → menthone selon l'avancement ----
  const [conv, setConv] = useState(0), [sousExp, setSousExp] = useState('oxydation');
  const mixT = (sg, x) => 100 - ((1 - x) * (100 - I.T(M.menthol, sg)) + x * (100 - I.T(M.menthone, sg)));
  const ptsMix = []; for (let sg = I.SIGMA_MAX; sg >= I.SIGMA_MIN; sg -= 5) ptsMix.push([sg, Math.max(2, Math.min(99, mixT(sg, conv / 100)))]);
  const profOH = 100 - mixT(3300, conv / 100), profCO = 100 - mixT(1715, conv / 100), ohVisible = profOH > 10;
  const exploreOxydation = (
    <div style={styleBoite}>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 6, lineHeight: 1.5 }}>On oxyde le menthol (alcool) en menthone (cétone). Faites avancer la réaction et regardez le <strong>spectre du mélange</strong> : à partir de quel avancement ne voit-on plus la bande O–H ?</div>
      <SpectreIR courbes={[{ nom: `mélange à ${conv} % de conversion`, c: BLEU, pts: ptsMix }, { nom: 'menthol pur', c: '#94a3b8', pts: I.spectre(M.menthol, 5, 0) }]} titre="Spectre du mélange menthol / menthone"/>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 14, color: KIT.txt, marginTop: 8 }}><span style={{ flex: '1 1 160px' }}>Conversion du menthol</span><input type="range" min="0" max="100" step="5" value={conv} onChange={e => setConv(parseInt(e.target.value))} aria-label="Conversion du menthol en pourcentage" style={{ flex: '2 1 140px', minHeight: 32 }}/><strong>{conv}{NB}%</strong></label>
      <div role="status" aria-live="polite" style={{ fontSize: 14, color: KIT.txt, marginTop: 6, lineHeight: 1.6 }}>
        Bande O–H (3300{NB}cm⁻¹) : absorption de <strong>{nbf(profOH, 0)}{NB}%</strong> — <strong style={{ color: ohVisible ? ROUGE : VERT }}>{ohVisible ? 'bien visible' : 'quasi invisible'}</strong>. Bande C=O (1715{NB}cm⁻¹) : <strong>{nbf(profCO, 0)}{NB}%</strong> — {profCO > 10 ? 'bien visible' : 'quasi invisible'}.
        {!ohVisible && conv < 100 && <div style={{ color: '#b45309', fontWeight: 700 }}>Attention : il reste encore {100 - conv}{NB}% de menthol, mais sa bande se confond avec le bruit. Ne plus voir la bande O–H ne prouve pas qu’il ne reste plus de menthol, seulement qu’il en reste peu.</div>}
      </div>
    </div>);
  // ---- Composé mystère : identifier la famille ----
  const FAM = { propanol: 'alcool', ethanolDilue: 'alcool', menthol: 'alcool', propanone: 'carbonyle', propanal: 'carbonyle', menthone: 'carbonyle', chalcone: 'carbonyle', acideEthanoique: 'acide' };
  const [myst, setMyst] = useState(() => tire(Object.keys(FAM))), [rm, setRm] = useState('');
  const raison = { alcool: 'Une bande O–H (large vers 3300, ou fine vers 3600 si l’alcool est dilué) sans bande C=O : alcool.', carbonyle: 'Une bande C=O fine et forte vers 1700, sans bande O–H : aldéhyde ou cétone.', acide: 'Bande C=O vers 1700 et bande O–H très large vers 2900 : acide carboxylique.' };
  const exploreMystere = (
    <div style={styleBoite}>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 6, lineHeight: 1.5 }}>Voici le spectre d’un composé dont on cache le nom. Repérez ses bandes (table de référence ci-dessous) et dites à quelle famille il appartient.</div>
      <SpectreIR courbes={[{ nom: 'composé mystère', c: BLEU, pts: I.spectre(M[myst], 5, 0.4) }]} titre="Spectre d’un composé inconnu"/>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0' }} role="group" aria-label="Famille du composé">{[['alcool', 'un alcool'], ['carbonyle', 'un aldéhyde ou une cétone'], ['acide', 'un acide carboxylique']].map(([k, n]) => <button key={k} onClick={() => setRm(k)} aria-pressed={rm === k} style={stylePetitBouton(rm === k, BLEU)}>{n}</button>)}</div>
      {rm && <div role="status" aria-live="polite" style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: rm === FAM[myst] ? VERT : ROUGE }}>{rm === FAM[myst] ? `✓ Oui : c’était ${M[myst].nom}. ${raison[FAM[myst]]}` : `✗ Pas tout à fait. Cherchez d’abord s’il y a une bande fine et forte vers 1700, puis une bande O–H (3600, 3300 ou 2900).`}</div>}
      <button onClick={() => { setMyst(tire(Object.keys(FAM).filter(k => k !== myst))); setRm(''); }} style={{ ...styleBouton(false), marginTop: 8 }}><Pic n="refresh"/>Autre composé</button>
      <div style={{ marginTop: 10 }}><TableBandes/></div>
    </div>);
  const explore = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} role="group" aria-label="Que voulez-vous explorer ?">{[['oxydation', 'Suivre une oxydation'], ['mystere', 'Composé mystère'], ['comparer', 'Comparer deux spectres']].map(([k, n]) => <button key={k} onClick={() => setSousExp(k)} aria-pressed={sousExp === k} style={stylePetitBouton(sousExp === k, '#0f766e')}>{n}</button>)}</div>
      {sousExp === 'oxydation' ? exploreOxydation : sousExp === 'mystere' ? exploreMystere : exploreComparer}
    </div>);

  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Spectres illustratifs</strong> : ils sont <strong>construits</strong> à partir de bandes (position, largeur, profondeur) pour illustrer les valeurs de référence ; ce ne sont <strong>pas des enregistrements</strong> de ces composés. Les nombres d’onde des bandes sont réalistes mais approchés.</li>
      <li><strong>Table de 1G</strong> : « autour de 1700 cm⁻¹ » pour C=O. En réalité la position varie avec l’environnement : environ 1715 pour une cétone, 1730 pour un aldéhyde, 1710 pour un acide, et plus bas (≈ 1660) quand C=O est conjugué à un cycle ou une double liaison, comme dans la chalcone (hors programme de 1G, signalé ici par honnêteté).</li>
      <li><strong>Bande O–H</strong> : sa largeur dépend des liaisons hydrogène ; en solution diluée, elle devient étroite et se déplace vers 3600 cm⁻¹.</li>
      <li><strong>Région 1500–500 cm⁻¹</strong> : « empreinte digitale ». Elle n’est pas interprétée au niveau 1G ; elle sert à comparer deux spectres.</li>
      <li><strong>Pureté</strong> : l’absence d’une bande n’est constatée qu’à la sensibilité du spectromètre ; elle suggère que le composé a été consommé, sans le prouver absolument.</li>
      <li><strong>Mélange (exploration)</strong> : le spectre d’un mélange est obtenu en additionnant les absorptions des constituants pondérées par leur proportion (modèle simplifié) ; on juge une bande « visible » si elle absorbe plus de 10 % : c’est un seuil de travail, pas une limite instrumentale.</li>
      <li><strong>Lecture</strong> : le nombre d’onde est lu à une graduation de 100 cm⁻¹ près (quelques dizaines de cm⁻¹ d’incertitude de lecture) ; le défi accepte 5 % d’écart.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;

  const vg = vueGuide();
  const guideScene = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {!depuis('creux') && <div style={{ ...styleBoite, ...cadre('principe') }}><SchemaPrincipe/></div>}
      {depuis('creux') && <div style={{ ...styleBoite, ...cadre('spectre') }}><div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{vg.t}</div><SpectreIR courbes={vg.c} titre={vg.t}/></div>}
      {depuis('ohlie') && <div style={{ ...styleBoite, ...cadre('table') }}><TableBandes/></div>}
    </div>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ir-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ir-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        @media (min-width: 901px) { .ir-l1.cote .ir-carte { order: 2; } .ir-l1.cote .ir-main { order: 1; } }
        @media (max-width: 900px) { .ir-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Spectroscopie infrarouge : O–H et C=O</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Passer de la longueur d’onde au <strong>nombre d’onde</strong>, lire un <strong>spectre IR</strong>, repérer les bandes <strong>O–H</strong> et <strong>C=O</strong> et comparer deux spectres.</div>
      <div className={`ir-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {enGuide ? <div className="ir-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="ir-carte">{panneauHypo}</div> : null}
        <div className="ir-main">
          {enGuide && guideScene}
          {enDefi && defi && <div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.sigma`} etat={suiviP}/></div>}
          {mode === 'explore' && explore}
        </div>
      </div>
      {(mode === 'explore' || (enGuide && etape >= ETAPES.length - 1)) && panneauHypo}
      {mode === 'explore' && <div style={{ marginTop: 12 }}><ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}><li>σ = 1 ÷ λ (en cm⁻¹, λ en cm) ; T = I ÷ I₀ ; une bande est un creux</li><li>O–H alcool lié : 3300 large, forte ; libre : 3600 étroite ; acide : 2900 très large</li><li>C=O : autour de 1700, étroite, forte ; produit – réactif : bande disparue ou apparue</li></ul></ARetenir></div>}
    </div>
  );
}
