import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, accepte, ARetenir, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./conductimetrieKModele";
import { QCM_PARCOURS as Q } from "./conductimetrieKQcm";
import { SceneAcide, SvgEquilibreCarte, SvgSigmaXCarte, SvgTableauKCarte, SvgTauCarte, SvgKconstanteCarte } from "./conductimetrieKSchemas";

const SIM_ID = 256, CLE_GUIDE = 'constante-acide-conductimetrie-tstl-guide-v1';
declarerDefis(SIM_ID, [['K', 'Constante d’équilibre à partir de la conductivité'], ['tau', 'Taux d’avancement final à partir de la conductivité']]);

// ====================================================
// SIM 256 — CONSTANTE D'ÉQUILIBRE D'UN ACIDE FAIBLE PAR CONDUCTIMÉTRIE (TSTL SPCL, chapitre « Conductivité et titrages conductimétriques »).
//  Une seule idée : la conductivité d'une solution d'acide faible donne [H₃O⁺], donc K = x² / (c − x) ; K ne dépend pas de c, le taux d'avancement final si.
//  Capacités visées (jamais affichées à l'élève) : déterminer la valeur d'une constante d'équilibre à partir de mesures conductimétriques ; exploiter la loi de Kohlrausch ;
//  exprimer la constante d'équilibre et utiliser un tableau d'avancement ; comparer à une valeur tabulée (constante d'acidité).
//  Modèle : conductimetrieKModele.js. Situation originale : acides méthanoïque et propanoïque ; aucune situation, valeur ni question du Moodle n'est reprise.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sci = (v, d = 1) => { const [m, e] = Number(v).toExponential(d).split('e'); return `${m.replace('.', ',')}×10${[...String(Number(e))].map(c => SUP[c]).join('')}`; };
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b' };
const Ul = ({ children }) => <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>{children}</ul>;
const EQ = 'HA + H₂O ⇌ A⁻ + H₃O⁺';
const mouvementReduit = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- parcours : acide méthanoïque, d'abord c = 1,2×10⁻² mol/L puis c' = 3,0×10⁻³ mol/L ----------
const AC = 'HCOOH', A_ = M.ACIDES[AC], C1 = 0.012, C2 = 0.0030, LS = M.lambdaSomme(AC);
const SIG1 = M.sigmaMesuree(AC, C1), SIG2 = M.sigmaMesuree(AC, C2);
const X1 = M.xDepuisSigma(AC, SIG1), X1r = Number(X1.toPrecision(2)), HA1 = C1 - X1r, K1 = M.Kcalcule(C1, X1r);
const X2 = M.xDepuisSigma(AC, SIG2), X2r = Number(X2.toPrecision(2)), K2 = M.Kcalcule(C2, X2r), T2 = 100 * X2r / C2, T1 = 100 * X1r / C1;
const KTAB = M.Ka(AC);
const IDS = ['equation', 'relation', 'conc', 'tableau', 'expression', 'K1', 'K2', 'alpha', 'dilution', 'tabulee', 'ecart', 'bilan'];
const apresK2 = id => IDS.indexOf(id) >= IDS.indexOf('K2');

// ====================================================
export function SimulationConstanteAcideConductimetrie() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviK, noterK] = useCompteurDefi(), [suiviT, noterT] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('K');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ lambda: false, gardees: false, essayer: false, retenir: false, bruit: false });
  const [ti, setTi] = useState({ acide: 'HCOOH', c: 0.012, bruit: false, graine: 0 });
  const [gardees, setGardees] = useState([]);
  const [reduit] = useState(mouvementReduit);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;
  const setT = f => setTi(s => ({ ...s, ...f }));

  // ---------- étapes du parcours ----------
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- situation affichée ----------
  const acide = enGuide ? AC : dd ? dd.acide : ti.acide;
  const c = enGuide ? (apresK2(idE) ? C2 : C1) : dd ? dd.c : ti.c;
  const graineMes = enExplore && ti.bruit ? ti.graine || 1 : 0;
  const sig = enGuide ? (apresK2(idE) ? SIG2 : SIG1) : dd ? dd.sigma : M.sigmaMesuree(acide, c, graineMes);
  const A = M.ACIDES[acide], LSom = M.lambdaSomme(acide);
  const x = M.xDepuisSigma(acide, sig), HA = c - x, tau = x / c, Kc = M.Kcalcule(c, x), Ktab = M.Ka(acide);
  const lectureCond = enGuide && idE === 'equation' ? null : `${nbf(sig, sig >= 100 ? 0 : 1)} mS/m`;
  const montrerEq = !enGuide || deja('relation');

  // ---------- étapes ----------
  const ETAPES = [
    { id: 'equation', titre: 'Un acide faible dans l’eau', focus: ['becher'],
      texte: <>L’acide méthanoïque HCOOH est un <strong>acide faible</strong> : mis dans l’eau, il réagit avec elle, mais pas complètement. On prépare une solution en dissolvant de l’acide méthanoïque : sa <strong>concentration apportée</strong>, c’est-à-dire la quantité d’acide introduite par litre avant toute réaction, est c&nbsp;=&nbsp;1,2×10⁻²&nbsp;mol/L. Regardez le bécher : les molécules d’acide (grises) sont nombreuses, et quelques ions sont apparus.</>,
      tache: { type: 'qcm', q: 'Quelle équation décrit la réaction de l’acide méthanoïque HCOOH avec l’eau ?', ...Q.equation,
        expl: 'Un acide cède un proton H⁺ à l’eau : HCOOH + H₂O ⇌ HCOO⁻ + H₃O⁺. La double flèche ⇌ indique une réaction limitée (un équilibre) : c’est ce qui distingue un acide faible d’un acide fort, dont la réaction avec l’eau serait totale.',
        indice: 'Un acide cède un proton H⁺ à l’eau, qui devient H₃O⁺. L’acide devient sa base conjuguée HCOO⁻. Un acide faible ne réagit pas totalement : quelle flèche ?' } },
    { id: 'relation', titre: 'La conductivité vient des ions', focus: ['cellule', 'lecture', 'donnees'],
      retenirTitre: 'À retenir : un équilibre, peu d’ions',
      retenir: <>
        <SvgEquilibreCarte/>
        <Ul>
          <li>Un <strong>acide faible</strong> réagit avec l’eau de façon limitée : {EQ}. À l’équilibre, la plupart des molécules HA sont encore là.</li>
          <li>Exemple de la simulation : sur 60 molécules d’acide introduites, seules quelques-unes ont donné des ions ; chaque molécule qui réagit donne un H₃O⁺ et un A⁻.</li>
          <li>Moyen de s’en souvenir : <strong>« ⇌ : la réaction s’arrête avant la fin »</strong>. Idée fausse : « un acide faible ne réagit pas du tout ». Vrai : il réagit, mais seulement en partie.</li>
        </Ul></>,
      texte: <>Une cellule plongée dans la solution est reliée à un <strong>conductimètre</strong> : il affiche la conductivité σ&nbsp;=&nbsp;{nbf(SIG1, 1)}&nbsp;mS/m. Seuls les ions dissous conduisent le courant ; on néglige les ions HO⁻ de l’eau (très peu nombreux dans une solution acide). Données : λ(H₃O⁺)&nbsp;=&nbsp;35,0 et λ(HCOO⁻)&nbsp;=&nbsp;5,46&nbsp;mS·m²·mol⁻¹ (λ : conductivité ionique molaire de chaque ion). La notation [X] désigne la concentration de l’espèce X à l’équilibre.</>,
      tache: { type: 'qcm', q: 'Quelle relation relie σ à [H₃O⁺] ?', ...Q.relation,
        expl: 'D’après l’équation, chaque molécule qui réagit donne un H₃O⁺ et un HCOO⁻ : [HCOO⁻] = [H₃O⁺]. La loi de Kohlrausch donne σ = λ(H₃O⁺) × [H₃O⁺] + λ(HCOO⁻) × [HCOO⁻] = (λ(H₃O⁺) + λ(HCOO⁻)) × [H₃O⁺].',
        indice: 'Quels ions conduisent le courant ? Combien de HCOO⁻ se forme-t-il pour chaque H₃O⁺ ? Appliquez σ = Σ λ × c.' } },
    { id: 'conc', titre: 'De la conductivité à [H₃O⁺]', focus: ['lecture', 'donnees'],
      texte: <>Le conductimètre affiche σ&nbsp;=&nbsp;{nbf(SIG1, 1)}&nbsp;mS·m⁻¹ pour c&nbsp;=&nbsp;1,2×10⁻²&nbsp;mol/L. On a [HCOO⁻]&nbsp;=&nbsp;[H₃O⁺] et σ&nbsp;=&nbsp;(λ(H₃O⁺)&nbsp;+&nbsp;λ(HCOO⁻))&nbsp;×&nbsp;[H₃O⁺], avec les concentrations en mol·m⁻³ (1&nbsp;mol/L&nbsp;=&nbsp;1&nbsp;000&nbsp;mol·m⁻³).</>,
      tache: { type: 'num', q: 'Concentration [H₃O⁺] à l’équilibre', unite: 'mol/L', vrai: X1, tol: 0.05, affiche: v => sci(v, 1), cs: 2,
        calcul: () => [`[H₃O⁺] = σ / (λ(H₃O⁺) + λ(HCOO⁻)) = ${nbf(SIG1, 1)} / (35,0 + 5,46) = ${nbf(SIG1 / LS, 2)} mol·m⁻³.`, `En mol/L : ${nbf(SIG1 / LS, 2)} / 1 000 = ${sci(X1, 1)} mol/L.`],
        pieges: [[SIG1 / LS, 'Ce résultat est en mol·m⁻³ : divisez par 1 000 pour obtenir des mol/L.'], [SIG1 / 35.0 / 1000, 'Il faut diviser par la somme λ(H₃O⁺) + λ(HCOO⁻) : les deux ions contribuent à σ.'], [SIG1 * LS / 1000, 'Il faut diviser σ par la somme des λ, pas la multiplier.']],
        expl: `[H₃O⁺] = ${nbf(SIG1, 1)} / 40,46 / 1 000 = ${sci(X1, 1)} mol/L.`, indice: 'Isolez [H₃O⁺] dans σ = (λ(H₃O⁺) + λ(HCOO⁻)) × [H₃O⁺] : le résultat est en mol·m⁻³, puis convertissez en mol/L.' } },
    { id: 'tableau', titre: 'Ce qui reste d’acide', focus: ['becher'],
      retenirTitre: 'À retenir : de σ à [H₃O⁺]',
      retenir: <>
        <SvgSigmaXCarte/>
        <Ul>
          <li>La conductivité donne la concentration en ions : [H₃O⁺] = σ / (λ(H₃O⁺) + λ(A⁻)), d’abord en mol·m⁻³, puis en mol/L (on divise par 1 000).</li>
          <li>Exemple de la simulation : un acide faible dont les deux ions ont une somme de λ voisine de 40 mS·m²·mol⁻¹ ; on convertit toujours en mol/L à la fin.</li>
          <li>Moyen de s’en souvenir : <strong>« σ divisée par la somme des λ »</strong>. Idée fausse : « σ divisée par un seul λ ». Vrai : les deux ions H₃O⁺ et A⁻ contribuent.</li>
        </Ul></>,
      texte: <>On a trouvé [H₃O⁺]&nbsp;=&nbsp;{sci(X1r, 1)}&nbsp;mol/L. Chaque molécule HCOOH qui réagit disparaît et donne un H₃O⁺ et un HCOO⁻ : [HCOO⁻]&nbsp;=&nbsp;[H₃O⁺]&nbsp;=&nbsp;x&nbsp;=&nbsp;{sci(X1r, 1)}&nbsp;mol/L (x désigne la concentration en ions formés à l’équilibre). La concentration apportée est c&nbsp;=&nbsp;1,2×10⁻²&nbsp;mol/L.</>,
      tache: { type: 'num', q: 'Concentration [HCOOH] restant à l’équilibre', unite: 'mol/L', vrai: HA1, tol: 0.05, affiche: v => sci(v, 2), cs: 2,
        calcul: () => ['Tableau d’avancement en concentrations : HCOOH passe de c à c − x.', `[HCOOH] = c − x = 1,2×10⁻² − ${sci(X1r, 1)} = ${sci(HA1, 2)} mol/L.`],
        pieges: [[C1, 'C’est la concentration apportée, avant réaction : retranchez x, la quantité qui a réagi.'], [C1 + X1r, 'Il faut retrancher x à c, pas l’ajouter : la molécule qui réagit disparaît.'], [X1r, 'C’est [H₃O⁺] : on demande la concentration d’acide restant, c − x.']],
        expl: `[HCOOH] = ${sci(C1, 1)} − ${sci(X1r, 1)} = ${sci(HA1, 2)} mol/L.`, indice: 'À l’équilibre, la quantité d’acide a diminué de x : [HCOOH] = c − x.' } },
    { id: 'expression', titre: 'La constante d’équilibre', focus: [],
      texte: <>À l’équilibre, la solution contient [HCOOH]&nbsp;=&nbsp;{sci(HA1, 2)}&nbsp;mol/L, et [HCOO⁻]&nbsp;=&nbsp;[H₃O⁺]&nbsp;=&nbsp;{sci(X1r, 1)}&nbsp;mol/L. Pour une réaction limitée, le rapport des concentrations à l’équilibre garde une valeur fixe à température donnée : c’est la <strong>constante d’équilibre K</strong>. L’eau, solvant très majoritaire, n’y figure pas.</>,
      tache: { type: 'qcm', q: 'Quelle est l’expression de K pour HCOOH + H₂O ⇌ HCOO⁻ + H₃O⁺ ?', ...Q.expression,
        expl: 'K est le quotient des concentrations des produits par celles des réactifs à l’équilibre, chacune élevée à son coefficient (ici 1). L’eau, solvant, n’intervient pas : K = [HCOO⁻] × [H₃O⁺] / [HCOOH]. Elle est sans unité.',
        indice: 'Produits au numérateur, réactifs au dénominateur ; on n’écrit pas l’eau, qui est le solvant.' } },
    { id: 'K1', titre: 'Calculer K', focus: [],
      texte: <>À l’équilibre : [HCOO⁻]&nbsp;=&nbsp;[H₃O⁺]&nbsp;=&nbsp;{sci(X1r, 1)}&nbsp;mol/L et [HCOOH]&nbsp;=&nbsp;{sci(HA1, 2)}&nbsp;mol/L. On utilise K&nbsp;=&nbsp;[HCOO⁻]&nbsp;×&nbsp;[H₃O⁺]&nbsp;/&nbsp;[HCOOH].</>,
      tache: { type: 'num', q: 'Constante d’équilibre K (sans unité)', unite: '', vrai: K1, tol: 0.08, affiche: v => sci(v, 1), cs: 2,
        calcul: () => [`K = (${sci(X1r, 1)})² / ${sci(HA1, 2)} = ${sci(X1r * X1r, 2)} / ${sci(HA1, 2)}.`, `K = ${sci(K1, 2)}, soit environ ${sci(K1, 1)} (sans unité).`],
        pieges: [[X1r * X1r, 'C’est le numérateur seul : divisez par [HCOOH].'], [X1r / HA1, 'Il manque le carré : [HCOO⁻] et [H₃O⁺] sont deux facteurs égaux à x.'], [1 / K1, 'Le rapport est inversé : les produits sont au numérateur.'], [X1r * X1r / C1, 'Au dénominateur, il faut [HCOOH] = c − x et non la concentration apportée c.']],
        expl: `K = (${sci(X1r, 1)})² / ${sci(HA1, 2)} = ${sci(K1, 2)}.`, indice: 'Remplacez les trois concentrations par leurs valeurs : x au carré au numérateur, c − x au dénominateur.' } },
    { id: 'K2', titre: 'Une solution plus diluée', focus: ['becher', 'lecture'],
      retenirTitre: 'À retenir : tableau d’avancement et K',
      retenir: <>
        <SvgTableauKCarte/>
        <Ul>
          <li>Le <strong>tableau d’avancement</strong> en concentrations donne [A⁻] = [H₃O⁺] = x et [HA] = c − x ; la constante vaut alors K = x² / (c − x).</li>
          <li>Exemple de la simulation : x se déduit de σ, c est la concentration apportée ; avec ces deux nombres, on calcule K sans autre information.</li>
          <li>Moyen de s’en souvenir : <strong>« c − x, x, x »</strong>. Idée fausse : « au dénominateur, on met c ». Vrai : on met la concentration restante, c − x.</li>
        </Ul></>,
      texte: <>On prépare maintenant une solution plus diluée du même acide, à la même température : c&nbsp;=&nbsp;3,0×10⁻³&nbsp;mol/L. Le conductimètre affiche σ&nbsp;=&nbsp;{nbf(SIG2, 1)}&nbsp;mS·m⁻¹. Procédez comme avant : [H₃O⁺]&nbsp;=&nbsp;σ&nbsp;/&nbsp;(λ(H₃O⁺)&nbsp;+&nbsp;λ(HCOO⁻)) en mol·m⁻³ puis en mol/L, [HCOOH]&nbsp;=&nbsp;c&nbsp;−&nbsp;x, et K. Gardez deux chiffres significatifs dans les calculs intermédiaires.</>,
      tache: { type: 'num', q: 'Constante d’équilibre K pour c = 3,0×10⁻³ mol/L', unite: '', vrai: K2, tol: 0.08, affiche: v => sci(v, 1), cs: 2,
        calcul: () => [`[H₃O⁺] = ${nbf(SIG2, 1)} / 40,46 / 1 000 = ${sci(X2, 2)} mol/L, soit x ≈ ${sci(X2r, 1)} mol/L.`, `[HCOOH] = 3,0×10⁻³ − ${sci(X2r, 1)} = ${sci(C2 - X2r, 2)} mol/L.`, `K = (${sci(X2r, 1)})² / ${sci(C2 - X2r, 2)} = ${sci(K2, 2)}.`],
        pieges: [[X2r * X2r, 'C’est le numérateur seul : divisez par [HCOOH] = c − x.'], [X2r * X2r / C2, 'Au dénominateur, il faut c − x, pas la concentration apportée c : avec une solution diluée, la différence compte.'], [X2 * 1000, 'Ce résultat est en mol·m⁻³ : convertissez en mol/L avant de calculer K.']],
        expl: `K = (${sci(X2r, 1)})² / ${sci(C2 - X2r, 2)} = ${sci(K2, 2)}.`, indice: 'Même démarche qu’à l’étape précédente : x = σ / (λ(H₃O⁺) + λ(HCOO⁻)) en mol/L, puis K = x² / (c − x).' } },
    { id: 'alpha', titre: 'La part qui a réagi', focus: ['becher'],
      texte: <>Pour c&nbsp;=&nbsp;3,0×10⁻³&nbsp;mol/L, on a trouvé x&nbsp;=&nbsp;[H₃O⁺]&nbsp;=&nbsp;{sci(X2r, 1)}&nbsp;mol/L. Le <strong>taux d’avancement final</strong> τ est la proportion de molécules d’acide introduites qui ont réagi : τ&nbsp;=&nbsp;x&nbsp;/&nbsp;c. On l’exprime souvent en pourcentage.</>,
      tache: { type: 'num', q: 'Taux d’avancement final τ', unite: '%', vrai: T2, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => [`τ = x / c = ${sci(X2r, 1)} / 3,0×10⁻³ = ${nbf(X2r / C2, 3)}.`, `En pourcentage : ${nbf(T2, 0)} %.`],
        pieges: [[X2r / C2, 'Ce résultat est une fraction : multipliez par 100 pour l’exprimer en pourcentage.'], [X2r / (C2 - X2r) * 100, 'Il faut diviser par c (concentration apportée), pas par c − x.'], [X2r * 1000 / C2 * 100, 'Les deux concentrations doivent être dans la même unité : ici x et c en mol/L.']],
        expl: `τ = ${sci(X2r, 1)} / 3,0×10⁻³ = ${nbf(T2, 0)} %.`, indice: 'τ = x / c, avec x et c dans la même unité, puis multipliez par 100.' } },
    { id: 'dilution', titre: 'Dilution : que change-t-elle ?', focus: [],
      retenirTitre: 'À retenir : le taux d’avancement final',
      retenir: <>
        <SvgTauCarte/>
        <Ul>
          <li>Le <strong>taux d’avancement final</strong> est τ = x / c : la part des molécules introduites qui ont réagi. Pour un acide fort, τ = 1 ; pour un acide faible, τ est inférieur à 1.</li>
          <li>Exemple de la simulation : sur la solution à 3,0×10⁻³ mol/L, environ une molécule sur cinq a réagi.</li>
          <li>Moyen de s’en souvenir : <strong>« τ : la part qui a réagi »</strong>. Idée fausse : « un acide faible ne réagit jamais ». Vrai : il réagit, mais τ reste inférieur à 1.</li>
        </Ul></>,
      texte: <>Récapitulatif, à la même température. Pour c&nbsp;=&nbsp;1,2×10⁻²&nbsp;mol/L : K&nbsp;≈&nbsp;{sci(K1, 1)} et τ&nbsp;≈&nbsp;{nbf(T1, 0)}&nbsp;%. Pour c&nbsp;=&nbsp;3,0×10⁻³&nbsp;mol/L : K&nbsp;≈&nbsp;{sci(K2, 1)} et τ&nbsp;≈&nbsp;{nbf(T2, 0)}&nbsp;%.</>,
      tache: { type: 'qcm', q: 'Que peut-on dire de K et de τ quand on dilue la solution ?', ...Q.dilution,
        expl: 'K garde la même valeur (aux incertitudes près) : elle ne dépend que de la température. Le taux d’avancement final τ augmente quand on dilue : une plus grande part des molécules réagit (ici de 12 % à 22 %).',
        indice: 'Comparez les deux valeurs de K, puis les deux valeurs de τ, entre la solution concentrée et la solution diluée.' } },
    { id: 'tabulee', titre: 'Comparer à la valeur tabulée', focus: [],
      retenirTitre: 'À retenir : K ne bouge pas, τ si',
      retenir: <>
        <SvgKconstanteCarte/>
        <Ul>
          <li>La constante d’équilibre <strong>K ne dépend que de la température</strong>, pas de la concentration apportée ; le taux d’avancement final τ, lui, <strong>augmente quand on dilue</strong>.</li>
          <li>Exemple de la simulation : deux solutions de concentrations différentes donnent la même valeur de K, mais une part plus grande de molécules réagit dans la solution diluée.</li>
          <li>Moyen de s’en souvenir : <strong>« K ne bouge pas, τ si »</strong>. Idée fausse : « un acide dilué est devenu plus fort, donc K a changé ». Vrai : seule la proportion τ change.</li>
        </Ul></>,
      texte: <>Les tables donnent le pK<sub>a</sub> du couple HCOOH/HCOO⁻ : pK<sub>a</sub>&nbsp;=&nbsp;3,75 à 25&nbsp;°C. La constante K de la réaction de l’acide avec l’eau est la <strong>constante d’acidité</strong> K<sub>a</sub> du couple, liée au pK<sub>a</sub> par K<sub>a</sub>&nbsp;=&nbsp;10<sup>−pK<sub>a</sub></sup>.</>,
      tache: { type: 'num', q: 'Constante d’acidité K_a tabulée (sans unité)', unite: '', vrai: KTAB, tol: 0.03, affiche: v => sci(v, 1), cs: 2,
        calcul: () => ['Ka = 10^(−pKa) = 10^(−3,75).', `Ka = ${sci(KTAB, 2)}, soit environ ${sci(KTAB, 1)}.`],
        pieges: [[3.75, 'C’est le pKa : la constante est K_a = 10^(−pKa).'], [10 ** 3.75, 'Le signe de l’exposant est inversé : K_a = 10^(−pKa), petit pour un acide faible.'], [-3.75, 'On ne prend pas l’opposé du pKa mais 10 à la puissance (−pKa).']],
        expl: `Ka = 10^(−3,75) = ${sci(KTAB, 2)}.`, indice: 'K_a = 10^(−pKa) : utilisez la touche 10^x de la calculatrice avec −3,75.' } },
    { id: 'ecart', titre: 'Un petit écart', focus: [],
      texte: <>Vos deux valeurs de K sont voisines de {sci(K1, 2)} et {sci(K2, 2)} ; la valeur tabulée est {sci(KTAB, 2)}. L’écart avec la valeur tabulée est d’environ {nbf(100 * Math.abs(K1 - KTAB) / KTAB, 0)}&nbsp;% : une constante déterminée avec une conductivité n’est jamais exactement égale à la valeur tabulée.</>,
      tache: { type: 'qcm', q: 'Quelle cause explique le mieux ce petit écart ?', ...Q.ecart,
        expl: 'Plusieurs causes s’ajoutent : les arrondis dans les calculs, l’incertitude de mesure de σ, et les approximations du modèle (λ supposés constants, égaux à leur valeur à dilution infinie, activités égales aux concentrations). K ne dépend pas de la concentration, et HO⁻ est négligeable.',
        indice: 'Pensez aux arrondis, à l’incertitude du conductimètre et aux hypothèses faites pour appliquer la loi de Kohlrausch.' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      texte: <>Vous savez relier la conductivité d’une solution d’acide faible à [H₃O⁺], utiliser un tableau d’avancement, calculer la constante d’équilibre K = x² / (c − x), et constater que K ne dépend pas de la concentration alors que le taux d’avancement final augmente avec la dilution. Passez à l’exploration pour tester l’acide propanoïque, plusieurs concentrations et l’effet de l’incertitude de mesure, ou aux défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi({ type, ...M.tirageDefi(), rep: '', verifie: false });
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const TOL_K = 0.10, TOL_T = 0.08;
  const verifier = () => {
    const d = defi, v = lireNombre(d.rep); let diag, ok = false;
    const L = M.lambdaSomme(d.acide), xx = d.x, cc = d.c;
    if (!isFinite(v) || v <= 0) diag = { cle: 'nan', msg: d.type === 'K' ? 'Entrez un nombre positif : la constante K, sans unité (par exemple 1,8e-4 ou 0,00018).' : 'Entrez un nombre positif : le taux d’avancement τ en pourcentage (par exemple 12).' };
    else if (d.type === 'K') {
      if (accepte(v, d.rep, d.K, TOL_K)) { ok = true; diag = { cle: 'ok', msg: '' }; }
      else {
        const x1 = d.sigma / M.LAMBDA_H / 1000, x2 = d.sigma / L;
        const essais = [
          [xx * xx / cc, 'Vous avez divisé par c, la concentration apportée : au dénominateur, il faut [HA] = c − x.'],
          [xx / (cc - xx), 'Il manque le carré : [A⁻] et [H₃O⁺] sont deux facteurs égaux à x, donc K = x² / (c − x).'],
          [1 / d.K, 'Le rapport est inversé : les produits sont au numérateur, K = x² / (c − x).'],
          [x1 * x1 / (cc - x1), 'Vous n’avez utilisé que λ(H₃O⁺) : H₃O⁺ et A⁻ contribuent tous deux à σ, il faut diviser par λ(H₃O⁺) + λ(A⁻).'],
          [x2 * x2 / Math.max(cc - x2, 1e-12), 'Vous avez laissé x en mol·m⁻³ : convertissez en mol/L (÷ 1 000) avant de calculer K.'],
          [xx * xx, 'C’est le numérateur seul : divisez par c − x.'],
        ].filter(([val]) => isFinite(val) && val > 0);
        const trouve = essais.find(([val]) => Math.abs(val - d.K) > 0.03 * d.K && Math.abs(v - val) <= 0.06 * val);
        diag = trouve ? { cle: 'piege', msg: trouve[1] } : { cle: 'ecart', msg: `Votre valeur est ${v < d.K ? 'trop petite' : 'trop grande'}. Refaites la chaîne : x = σ / (λ(H₃O⁺) + λ(A⁻)) en mol·m⁻³, converti en mol/L, puis K = x² / (c − x), avec deux ou trois chiffres significatifs.` };
      }
    } else {
      if (accepte(v, d.rep, 100 * d.tau, TOL_T)) { ok = true; diag = { cle: 'ok', msg: '' }; }
      else {
        const essais = [
          [d.tau, 'Ce résultat est une fraction : multipliez par 100 pour l’exprimer en pourcentage.'],
          [xx / (cc - xx) * 100, 'Il faut diviser par c, la concentration apportée, et non par c − x.'],
          [d.sigma / L / cc * 100, 'Vous avez laissé x en mol·m⁻³ : convertissez en mol/L (÷ 1 000) avant de diviser par c.'],
        ].filter(([val]) => isFinite(val) && val > 0);
        const trouve = essais.find(([val]) => Math.abs(val - 100 * d.tau) > 0.03 * 100 * d.tau && Math.abs(v - val) <= 0.06 * val);
        diag = trouve ? { cle: 'piege', msg: trouve[1] } : { cle: 'ecart', msg: `Votre valeur est ${v < 100 * d.tau ? 'trop petite' : 'trop grande'}. Calculez x = σ / (λ(H₃O⁺) + λ(A⁻)) en mol/L, puis τ = x / c, en pourcentage.` };
      }
    }
    setDefi(s => ({ ...s, verifie: true, ok, diag, corr: false }));
    (d.type === 'K' ? noterK : noterT)(ok);
  };
  const correction = d => {
    const L = M.lambdaSomme(d.acide), Ad = M.ACIDES[d.acide];
    const base = `x = σ / (λ(H₃O⁺) + λ(${Ad.base})) = ${nbf(d.sigma, 1)} / ${nbf(L, 2)} = ${nbf(d.sigma / L, 2)} mol·m⁻³ = ${sci(d.x, 2)} mol/L.`;
    return d.type === 'K'
      ? `${base} [${Ad.f}] = c − x = ${sci(d.c - d.x, 2)} mol/L, donc K = x² / (c − x) = ${sci(d.K, 2)} (marge acceptée : 10 %). Pour comparaison, K_a tabulée = ${sci(d.Ktab, 2)}.`
      : `${base} τ = x / c = ${sci(d.x, 2)} / ${sci(d.c, 2)} = ${nbf(100 * d.tau, 1)} % (marge acceptée : 8 %).`;
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['K', 'Constante d’équilibre K'], ['tau', 'Taux d’avancement τ']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'K' ? 'Défi : quelle est la constante d’équilibre K ?' : 'Défi : quel est le taux d’avancement final τ ?'}</div>
      <div style={{ ...lbl, marginBottom: 8 }}>Une solution d’{M.ACIDES[defi.acide].nom} ({M.ACIDES[defi.acide].f}), de concentration apportée c = <strong>{sci(defi.c, 1)}{NB}mol/L</strong>, a une conductivité σ = <strong>{nbf(defi.sigma, 1)}{NB}mS·m⁻¹</strong> à 25 °C. {defi.type === 'K' ? 'Calculez la constante d’équilibre K de sa réaction avec l’eau (sans unité).' : 'Calculez son taux d’avancement final τ, en pourcentage.'} Données : λ(H₃O⁺) = 35,0 et λ({M.ACIDES[defi.acide].base}) = {nbf(M.ACIDES[defi.acide].lambdaA, 2)} mS·m²·mol⁻¹ ; on néglige HO⁻.</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
        <span>{defi.type === 'K' ? 'K' : 'τ'} =</span>
        <input value={defi.rep} aria-label={defi.type === 'K' ? 'K' : 'τ'} onKeyDown={e => e.key === 'Enter' && document.getElementById('kc-verif')?.click()} onChange={e => setDefi(d => ({ ...d, rep: e.target.value, verifie: false, corr: false }))} inputMode="decimal"
          style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>{defi.type === 'tau' && <span>%</span>}
      </div>
      <IndiceDefi cache={false}>{defi.type === 'K' ? <>x&nbsp;=&nbsp;[H₃O⁺]&nbsp;=&nbsp;σ&nbsp;/&nbsp;(λ(H₃O⁺)&nbsp;+&nbsp;λ(A⁻)) d’abord en mol·m⁻³, puis en mol/L (÷&nbsp;1&nbsp;000) ; ensuite K&nbsp;=&nbsp;x²&nbsp;/&nbsp;(c&nbsp;−&nbsp;x). Gardez 3 chiffres significatifs dans les calculs intermédiaires.</> : <>x&nbsp;=&nbsp;σ&nbsp;/&nbsp;(λ(H₃O⁺)&nbsp;+&nbsp;λ(A⁻)) d’abord en mol·m⁻³, puis en mol/L (÷&nbsp;1&nbsp;000) ; ensuite τ&nbsp;=&nbsp;x&nbsp;/&nbsp;c, multiplié par 100.</>}</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="kc-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {avecIndices((defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + (defi.ok ? correction(defi) : defi.diag.msg))}
        {!defi.ok && <div style={{ marginTop: 6 }}><button type="button" onClick={() => setDefi(d => ({ ...d, corr: !d.corr }))} style={{ ...styleBouton(false), minHeight: 42 }}>{defi.corr ? 'Masquer la correction' : 'Voir la correction'}</button></div>}
        {!defi.ok && defi.corr && <div style={{ marginTop: 6, fontWeight: 400, color: KIT.txt }}>{avecIndices(correction(defi))}</div>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Température constante : 25 °C</strong> ; les conductivités ioniques molaires λ sont des valeurs usuelles de la littérature, données du problème et supposées constantes (valeurs à dilution infinie) : λ(H₃O⁺) = 35,0 (valeur arrondie, 34,98 en réalité) ; λ(HCOO⁻) = 5,46 ; λ(C₂H₅COO⁻) = 3,58 mS·m²·mol⁻¹.</li>
      <li><strong>Loi de Kohlrausch</strong> : σ = Σ λ × c, valable pour une solution <strong>diluée</strong> (ions à moins de 10 mol·m⁻³, soit 1,0×10⁻² mol/L) : toutes les solutions de la simulation respectent ce domaine (x est au plus de l’ordre de 3×10⁻³ mol/L).</li>
      <li><strong>Ions HO⁻ négligés</strong> : dans une solution d’acide, [HO⁻] est inférieure à 10⁻¹⁰ mol/L, bien trop faible pour contribuer à σ ; on a donc [A⁻] = [H₃O⁺].</li>
      <li><strong>Activités égales aux concentrations</strong> : les interactions entre ions sont ignorées. En réalité, elles font que K calculé diffère un peu de la valeur tabulée, surtout aux fortes concentrations.</li>
      <li><strong>Valeur tabulée</strong> : K<sub>a</sub> = 10<sup>−pK<sub>a</sub></sup>, avec pK<sub>a</sub>(HCOOH/HCOO⁻) = 3,75 et pK<sub>a</sub>(C₂H₅COOH/C₂H₅COO⁻) = 4,87 à 25 °C. La conductivité « mesurée » est calculée avec ces valeurs ; l’écart observé sur K vient des arrondis et, si la case est cochée, d’un bruit de mesure simulé de ± 1 % sur σ.</li>
      <li><strong>Précision</strong> : une erreur de 1 % sur σ donne environ 2 % d’erreur sur K, car K est proportionnelle à x² ; c’est pourquoi on garde au moins deux chiffres significatifs dans les calculs.</li>
      <li><strong>Schéma</strong> : sur 60 molécules d’acide introduites, le nombre de paires d’ions dessinées est proportionnel à τ (arrondi à l’entier le plus proche) ; l’agitation du dessin est schématique et ne représente ni les vitesses ni les distances réelles.</li>
      <li><strong>Limites</strong> : pas de variation de la température, pas d’acide fort ni de base, pas d’autodissociation de l’eau (K<sub>e</sub>) dans les calculs.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène, données ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const boxScene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {enExplore && <div style={aide}>Le bécher contient la solution d’acide ; chaque petit haltère gris est une molécule d’acide HA, les points rouges (+) et verts (−) sont les ions H₃O⁺ et A⁻ formés. Le schéma montre 60 molécules d’acide introduites ; le conductimètre donne σ.</div>}
      <SceneAcide acide={acide} c={c} lecture={lectureCond} anime={!reduit} montrer={{ equation: montrerEq, cellule: !enGuide || deja('relation'), ions: !(dd && dd.type === 'tau') }} hl={hl}/>
    </div>);
  const lignesLambda = [['H₃O⁺', M.LAMBDA_H], [A.base, A.lambdaA]];
  const tableLambda = (
    <div style={{ ...styleBoite, ...cadre('donnees') }}>
      <div style={titreCarte}>Données : conductivités ioniques molaires λ</div>
      <div style={aide}>En mS·m²·mol⁻¹, à 25 °C.</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', fontSize: 16, color: KIT.txt }}>
        {lignesLambda.map(([f, l]) => <span key={f} style={{ whiteSpace: 'nowrap' }}>λ({f}) = <strong>{nbf(l, l === 35 ? 1 : 2)}</strong></span>)}
      </div>
    </div>);
  const boxDonnees = (enGuide && deja('relation')) ? tableLambda : null;

  // ---------- réglages (exploration) ----------
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Réglages de l’expérience</div>
      <div style={aide}>Choisissez l’acide et sa concentration apportée : le schéma, la conductivité et les grandeurs calculées se mettent à jour.</div>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Acide
        <select value={ti.acide} onChange={e => setT({ acide: e.target.value })} style={{ ...menu, marginTop: 2 }}>
          {Object.values(M.ACIDES).map(a => <option key={a.id} value={a.id}>{a.nom} ({a.f})</option>)}
        </select>
      </label>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Concentration apportée c
        <select value={ti.c} onChange={e => setT({ c: Number(e.target.value) })} style={{ ...menu, marginTop: 2 }}>
          {M.C_LISTE.map(v => <option key={v} value={v}>{sci(v, 1)} mol/L</option>)}
        </select>
      </label>
      <Section titre={<span><span style={{ display: 'block' }}>Incertitude de mesure</span><span style={{ display: 'block', fontSize: 13, fontWeight: 400, color: KIT.txt2, marginTop: 2 }}>{ti.bruit ? 'σ bruitée de ± 1 %' : 'σ sans bruit'}</span></span>} ouvert={ouv.bruit} onBascule={() => setOuv(o => ({ ...o, bruit: !o.bruit }))}>
        <div style={aide}>Un vrai conductimètre a une incertitude. Cochez la case pour ajouter un bruit de ± 1 % à σ, puis cliquez sur « Nouvelle mesure » : K calculé varie d’une mesure à l’autre autour de la valeur tabulée.</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 42, fontSize: 15, color: KIT.txt, cursor: 'pointer' }}><input type="checkbox" checked={ti.bruit} onChange={e => setT({ bruit: e.target.checked, graine: e.target.checked ? 1 + Math.floor(Math.random() * 1e6) : 0 })} style={{ width: 22, height: 22, flex: '0 0 auto' }}/>Simuler l’incertitude de mesure (± 1 %)</label>
        {ti.bruit && <button type="button" onClick={() => setT({ graine: 1 + Math.floor(Math.random() * 1e6) })} style={{ ...styleBouton(false), minHeight: 42 }}><Pic n="refresh"/>Nouvelle mesure</button>}
      </Section>
    </div>);

  // ---------- mesures ----------
  const ecartK = 100 * (Kc - Ktab) / Ktab;
  const mesures = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures et grandeurs calculées</div>
      <div style={aide}>À partir de σ, on calcule [H₃O⁺], [HA], le taux d’avancement final et la constante K.</div>
      <LigneMesure nom="Conductivité σ" valeur={`${nbf(sig, 1)}${NB}mS·m⁻¹`} couleur={COL.bleu}/>
      <LigneMesure nom={avecIndices('[H₃O⁺] = [A⁻] = x')} valeur={`${sci(x, 2)}${NB}mol/L`}/>
      <LigneMesure nom={avecIndices('[HA] = c − x')} valeur={`${sci(HA, 2)}${NB}mol/L`}/>
      <LigneMesure nom="Taux d’avancement final τ" valeur={`${nbf(100 * tau, 1)}${NB}%`} couleur={COL.orange}/>
      <LigneMesure nom="Constante K calculée" valeur={sci(Kc, 2)} couleur={COL.vert}/>
      <LigneMesure nom={avecIndices('K_a tabulée (pK_a = ' + nbf(A.pKa, 2) + ')')} valeur={sci(Ktab, 2)}/>
      <LigneMesure nom="Écart relatif" valeur={`${ecartK >= 0 ? '+' : '−'}${nbf(Math.abs(ecartK), 1)}${NB}%`} couleur={Math.abs(ecartK) > 5 ? COL.rouge : COL.gris}/>
      <div style={{ marginTop: 6 }}>
        <button type="button" onClick={() => setGardees(g => [...g, { acide, c, sig, Kc, tau }].slice(-8))} style={{ ...styleBouton(false), minHeight: 42 }}>Garder cette mesure dans le tableau</button>
      </div>
    </div>);
  const sectionGardees = enExplore && (
    <Section titre={<span><span style={{ display: 'block' }}>Mesures gardées</span><span style={{ display: 'block', fontSize: 13, fontWeight: 400, color: KIT.txt2, marginTop: 2 }}>{gardees.length ? `${gardees.length} mesure${gardees.length > 1 ? 's' : ''}` : 'aucune pour le moment'}</span></span>} ouvert={ouv.gardees} onBascule={() => setOuv(o => ({ ...o, gardees: !o.gardees }))}>
      <div style={aide}>Gardez plusieurs mesures à des concentrations différentes, puis comparez la colonne K (elle reste voisine) et la colonne τ (elle change).</div>
      {gardees.length > 0 && <div style={{ overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', fontSize: 13.5, width: '100%' }}>
        <thead><tr style={{ color: KIT.txt2, textAlign: 'left' }}><th style={{ padding: '3px 6px' }}>acide</th><th style={{ padding: '3px 6px' }}>c (mol/L)</th><th style={{ padding: '3px 6px' }}>σ</th><th style={{ padding: '3px 6px' }}>τ (%)</th><th style={{ padding: '3px 6px' }}>K</th></tr></thead>
        <tbody>{gardees.map((g, i) => <tr key={i} style={{ borderTop: `1px solid ${KIT.bord}` }}><td style={{ padding: '3px 6px' }}>{M.ACIDES[g.acide].f}</td><td style={{ padding: '3px 6px' }}>{sci(g.c, 1)}</td><td style={{ padding: '3px 6px' }}>{nbf(g.sig, 1)}</td><td style={{ padding: '3px 6px' }}>{nbf(100 * g.tau, 1)}</td><td style={{ padding: '3px 6px', fontWeight: 700 }}>{sci(g.Kc, 2)}</td></tr>)}</tbody></table></div>}
      {gardees.length > 0 && <button type="button" onClick={() => setGardees([])} style={{ ...styleBouton(false), minHeight: 42, marginTop: 6 }}>Vider le tableau</button>}
    </Section>);
  const sectionLambda = enExplore && (
    <Section titre="Données : conductivités ioniques molaires" ouvert={ouv.lambda} onBascule={() => setOuv(o => ({ ...o, lambda: !o.lambda }))}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', fontSize: 16, color: KIT.txt }}>
        {lignesLambda.map(([f, l]) => <span key={f} style={{ whiteSpace: 'nowrap' }}>λ({f}) = <strong>{nbf(l, l === 35 ? 1 : 2)}</strong></span>)}
      </div>
      <div style={{ ...aide, marginTop: 6, marginBottom: 0 }}>En mS·m²·mol⁻¹, à 25 °C.</div>
    </Section>);
  const boxDefiDonnees = dd && tableLambda;

  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Faites varier c pour l’acide méthanoïque : comment évolue σ ? Et le taux d’avancement final τ ? Et K ?</li>
        <li>Gardez cinq mesures à cinq concentrations : la colonne K est-elle constante ? Que dire de la colonne τ ?</li>
        <li>Remplacez l’acide méthanoïque par l’acide propanoïque, à la même concentration : lequel est le plus dissocié ? Comparez les pK<sub>a</sub> et les valeurs de K.</li>
        <li>Cochez « Simuler l’incertitude de mesure » et refaites plusieurs mesures à la même concentration : de combien K calculé varie-t-il ? Est-ce plus ou moins que l’incertitude sur σ ?</li>
        <li>Pour quelle concentration τ est-il le plus grand ? Le plus petit ? Que devient le schéma (nombre de paires d’ions) ?</li>
      </ul>
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>HA + H₂O ⇌ A⁻ + H₃O⁺ : un acide faible réagit de façon limitée, il reste surtout des molécules HA</li>
          <li>{avecIndices('σ = (λ(H₃O⁺) + λ(A⁻)) × [H₃O⁺]')}, d’où [H₃O⁺] = x en mol·m⁻³, puis en mol/L (÷ 1 000)</li>
          <li>Tableau d’avancement : [HA] = c − x, [A⁻] = [H₃O⁺] = x ; {avecIndices('K = x² / (c − x)')} (K_a du couple)</li>
          <li>Taux d’avancement final τ = x / c : il augmente quand on dilue</li>
          <li>K ne dépend que de la température : même valeur quelle que soit la concentration apportée</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .kc-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .kc-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .kc-col { display: flex; flex-direction: column; gap: 12px; }
        .kc-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .kc-l1.cote .kc-carte { order: 2; } .kc-l1.cote .kc-main { order: 1; }
          .kc-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .kc-ex > * { grid-column: 1; } .kc-ex > .kc-ctrl { grid-column: 2; grid-row: 1 / span 6; } }
        @media (max-width: 900px) { .kc-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .kc-in { animation: kc-fondu 0.35s ease-out; } @keyframes kc-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Constante d’un acide faible par conductimétrie</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un acide faible ne réagit que partiellement avec l’eau. La <strong>conductivité</strong> de la solution donne la concentration en ions, donc la <strong>constante d’équilibre K</strong> de la réaction.</div>
      {!enExplore && <div className={enGuide ? "kc-l1 cote" : "kc-l1"}>
        {enGuide ? <div className="kc-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : null}
        <div className="kc-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'K' ? suiviK : suiviT}/></div>}
          <div className="kc-col">
            <div className="kc-in">{boxScene}</div>
            {boxDonnees && <div className="kc-in">{boxDonnees}</div>}
            {boxDefiDonnees && <div>{boxDefiDonnees}</div>}
            {enDefi && <div>{panneauHypo}</div>}
          </div>
        </div>
      </div>}
      {enExplore && <div className="kc-ex">
        <div>{boxScene}</div>
        <div className="kc-ctrl">{reglages}</div>
        <div>{mesures}</div>
        <div>{sectionGardees}</div>
        <div>{sectionLambda}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && deja('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
