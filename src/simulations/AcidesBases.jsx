import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useMemo } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./acidesBasesModele";

const SIM_ID = 85;
declarerDefis(SIM_ID, [['pka', 'Quel est le pKa de l’acide inconnu ?'], ['conc', 'Quelle est la concentration de la solution d’acide ?'], ['tampon', 'Comment préparer une solution tampon de pH donné ?']]);

// ====================================================
//  SIM 85 — ACIDES ET BASES : pH d'un acide fort / faible (taux d'avancement), diagrammes de distribution, solution tampon, titrage pH-métrique et choix d'un indicateur
//  Notations : pKa du couple AH/A⁻ ; pH = −log[H₃O⁺] ; Ka = [A⁻][H₃O⁺]/[AH] ; Qr,éq = K.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const sci = (x, d = 1) => { if (!isFinite(x) || x === 0) return '0'; const e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e; return `${nbf(m, d)}${NB}×${NB}10${String(e).replace('-', '⁻').replace(/\d/g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c])}`; };
const tire = t => t[Math.floor(Math.random() * t.length)];
const sub = n => String(n).replace(/\d/g, c => '₀₁₂₃₄₅₆₇₈₉'[c]);

// ---------- les acides de la simulation ----------
// pKas : [] = acide fort ; valeurs de la simulation à 25 °C (proches des valeurs usuelles des tables)
const ACIDES = {
  hcl:   { nom: 'acide chlorhydrique', formule: 'HCl', base: 'Cl⁻', pKas: [], fort: true },
  form:  { nom: 'acide méthanoïque', formule: 'HCOOH', base: 'HCOO⁻', pKas: [3.75] },
  benz:  { nom: 'acide benzoïque', formule: 'C₆H₅COOH', base: 'C₆H₅COO⁻', pKas: [4.2] },
  etha:  { nom: 'acide éthanoïque', formule: 'CH₃COOH', base: 'CH₃COO⁻', pKas: [4.8] },
  prop:  { nom: 'acide propanoïque', formule: 'C₂H₅COOH', base: 'C₂H₅COO⁻', pKas: [4.9] },
  amm:   { nom: 'ion ammonium', formule: 'NH₄⁺', base: 'NH₃', pKas: [9.25] },
};
const POLY = {
  cit:  { nom: 'acide citrique', formule: 'H₃A', especes: ['H₃A', 'H₂A⁻', 'HA²⁻', 'A³⁻'], pKas: [3.1, 4.8, 6.4] },
  carb: { nom: 'dioxyde de carbone dissous', formule: 'CO₂,H₂O', especes: ['CO₂,H₂O', 'HCO₃⁻', 'CO₃²⁻'], pKas: [6.4, 10.3] },
  etha: { nom: 'acide éthanoïque', formule: 'CH₃COOH', especes: ['CH₃COOH', 'CH₃COO⁻'], pKas: [4.8] },
  phos: { nom: 'acide phosphorique', formule: 'H₃PO₄', especes: ['H₃PO₄', 'H₂PO₄⁻', 'HPO₄²⁻', 'PO₄³⁻'], pKas: [2.1, 7.2, 12.4] },
};
const COUL_ESP = ['#dc2626', '#d97706', '#0e7490', '#6d28d9'];
const POUR_DEFI = [3.75, 4.2, 4.8, 4.9];                            // pKa possibles de l'acide inconnu
const ID_PAR_PKA = { 3.75: 'form', 4.2: 'benz', 4.8: 'etha', 4.9: 'prop' };

const VMAX = 25;                                                    // volume de la burette (mL)
const U_CB = 0.005, U_V0 = 0.03, U_VEQ = 0.1;                       // demi-étendues : Cb ± 0,5 %, prise d'essai (pipette) ± 0,03 mL, repérage de Veq ± 0,1 mL
const R3 = Math.sqrt(3);

const PRESET_TI = { id: 'etha', C0: 0.050, V0: 20, Cb: 0.100, Vb: 0, ind: null, deriv: false };
const PRESET_TP = { nAH: 10, nA: 10, V: 100, ajout: 0 };
const PRESET_AC = { id: 'etha', logC: -2 };

export function SimulationAcidesBases({ naviguer }) {
  const [mode, setMode] = useState(() => modeOuverture('acides-bases-guide-v1'));
  useSignalerMode(mode);
  const [suiviPka, noterPka] = useCompteurDefi(), [suiviConc, noterConc] = useCompteurDefi(), [suiviTampon, noterTampon] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('acides-bases-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [typeDefi, setTypeDefi] = useState('pka');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [scene, setScene] = useState('acide');
  const [ac, setAc] = useState(PRESET_AC);
  const [ds, setDs] = useState({ id: 'etha', ph: 4.8 });
  const [tp, setTp] = useState(PRESET_TP);
  const [ti, setTi] = useState(PRESET_TI);
  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const dd = enDefi && defi ? defi : null;
  const sceneEff = dd ? (dd.type === 'tampon' ? 'tampon' : 'titrage') : scene;

  // ---------- grandeurs effectives ----------
  const Ti = dd && dd.type !== 'tampon' ? { ...ti, id: dd.id, C0: dd.C0, V0: 20, Cb: 0.100 } : ti;
  const acT = ACIDES[Ti.id];
  const pT = { C0: Ti.C0, V0: Ti.V0 * 1e-3, pKas: acT.pKas, Cb: Ti.Cb };
  const Veq = M.volumeEquivalent(Ti.C0, Ti.V0 * 1e-3, Ti.Cb) * 1e3;                // mL
  const phTi = M.pHTitrage({ ...pT, Vb: Ti.Vb * 1e-3 });
  const pasD = 0.1;
  const derTi = (M.pHTitrage({ ...pT, Vb: (Ti.Vb + pasD) * 1e-3 }) - M.pHTitrage({ ...pT, Vb: Math.max(0, Ti.Vb - pasD) * 1e-3 })) / ((Ti.Vb + pasD) - Math.max(0, Ti.Vb - pasD));
  const ptsTi = useMemo(() => M.courbeTitrage({ ...pT, Vb: 0 }, VMAX * 1e-3, 500).map(p => ({ V: p.V * 1e3, pH: p.pH, d: p.d * 1e-3 })), [Ti.id, Ti.C0, Ti.V0, Ti.Cb]);   // d en unités de pH par mL
  const equivDer = M.equivalenceDerivee(ptsTi.map(p => ({ V: p.V, pH: p.pH, d: p.d })));
  const pKaT = acT.pKas[0];
  const phDemi = M.pHTitrage({ ...pT, Vb: Veq / 2 * 1e-3 });

  // solution étudiée dans la scène « acide »
  const A = ACIDES[ac.id], C = 10 ** ac.logC;
  const phA = M.pH({ C: A.fort ? 0 : C, pKas: A.pKas, ca: A.fort ? C : 0 }), hA = M.concH(phA);
  const fracA = A.fort ? [0, 1] : M.fractions(hA, A.pKas);
  const tauA = A.fort ? 1 : fracA[1];
  const phApprox = A.fort ? M.pHAcideFortApprox(C) : M.pHAcideFaibleApprox(C, A.pKas[0]);
  // tampon
  const nAHm = tp.nAH * 1e-3, nAm = tp.nA * 1e-3, Vtp = tp.V * 1e-3, ajm = tp.ajout * 1e-3, pKaTp = defTamponPka(dd);
  const phTp0 = M.pHTampon({ nAH: nAHm, nA: nAm, V: Vtp, pKa: pKaTp }), phTp = M.pHTampon({ nAH: nAHm, nA: nAm, V: Vtp, pKa: pKaTp, nAjout: ajm });
  const phEau = M.pH({ cb: Math.max(0, ajm) / Vtp, ca: Math.max(0, -ajm) / Vtp });
  const betaTp = M.pouvoirTampon({ nAH: nAHm, nA: nAm, V: Vtp, pKa: pKaTp });
  // distribution
  const P = POLY[ds.id], frD = M.fractions(M.concH(ds.ph), P.pKas);
  const idxMax = frD.indexOf(Math.max(...frD));

  function defTamponPka(d) { return d && d.type === 'tampon' ? d.pKa : 4.8; }

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const tiBase = scene === 'titrage' && ti.id === 'etha' && ti.C0 === 0.05 && ti.V0 === 20 && ti.Cb === 0.1;
  const tpBase = scene === 'tampon' && tp.nAH === 10 && tp.nA === 10 && tp.V === 100;
  const phAjout1 = M.pHTampon({ nAH: 0.01, nA: 0.01, V: 0.1, pKa: 4.8, nAjout: -1e-3 });
  const dTamp = phAjout1 - 4.8, dEau = M.pH({ ca: 1e-3 / 0.1 }) - 7;
  const ETAPES0 = [
    { id: 'ph', titre: 'Le pH d’une solution', focus: ['scene'],
      texte: <>Le <strong>pH</strong> d’une solution aqueuse se définit par pH = −log [H₃O⁺] (concentration en mol·L⁻¹). On dispose ici d’une solution d’acide de concentration <em>C</em> = 1,0 × 10⁻² mol·L⁻¹.</>,
      tache: { type: 'qcm', q: 'Si [H₃O⁺] = 1,0 × 10⁻³ mol·L⁻¹, le pH vaut…', options: ['3,0', '−3,0', '0,001'], bonne: 0,
        expl: 'pH = −log(1,0 × 10⁻³) = 3,0. Plus la solution est acide, plus [H₃O⁺] est grande et plus le pH est petit.' } },
    { id: 'fort', titre: 'Un acide fort', focus: ['scene', 'reglages'],
      texte: <>L’acide chlorhydrique HCl réagit <strong>totalement</strong> avec l’eau : HCl + H₂O → H₃O⁺ + Cl⁻. Sélectionnez-le, avec <em>C</em> = 1,0 × 10⁻² mol·L⁻¹.</>,
      tache: { type: 'action', ok: scene === 'acide' && ac.id === 'hcl' && ac.logC === -2, label: 'Choisir HCl à 10⁻² mol/L', faire: () => { setScene('acide'); setAc({ id: 'hcl', logC: -2 }); }, consigne: 'Choisissez « acide chlorhydrique » et réglez log C = −2' } },
    { id: 'phfort', titre: 'Lire le pH', focus: ['mesures'],
      texte: <>Lisez le pH dans « Mesures » pour HCl à <em>C</em> = 1,0 × 10⁻² mol·L⁻¹. Pour un acide fort totalement dissocié, [H₃O⁺] = <em>C</em>.</>,
      tache: { type: 'num', q: 'pH de la solution d’acide chlorhydrique', unite: '', vrai: M.pH({ ca: 1e-2 }), tol: 0.02, affiche: v => nbf(v, 1), cs: 2,
        bloque: scene === 'acide' && ac.id === 'hcl' && ac.logC === -2 ? null : 'Choisissez d’abord HCl à 10⁻² mol/L (étape précédente).',
        calcul: () => ['[H₃O⁺] = C = 1,0 × 10⁻² mol·L⁻¹.', 'pH = −log(1,0 × 10⁻²) = 2,0.'], pieges: [[-2, 'Le pH est −log [H₃O⁺], pas log [H₃O⁺] : il est positif ici.']],
        expl: 'pH = 2,0. Pour un acide fort, le pH se déduit directement de la concentration apportée.' } },
    { id: 'faible', titre: 'Un acide faible', focus: ['scene', 'reglages'],
      texte: <>Prenons la même concentration, mais avec l’<strong>acide éthanoïque</strong> CH₃COOH (pKa = 4,8) : sa réaction avec l’eau est <em>limitée</em> : CH₃COOH + H₂O ⇌ CH₃COO⁻ + H₃O⁺.</>,
      tache: { type: 'action', ok: scene === 'acide' && ac.id === 'etha' && ac.logC === -2, label: 'Choisir l’acide éthanoïque à 10⁻² mol/L', faire: () => { setScene('acide'); setAc({ id: 'etha', logC: -2 }); }, consigne: 'Choisissez « acide éthanoïque » et réglez log C = −2' } },
    { id: 'compare', titre: 'Comparer les pH', focus: ['mesures'],
      texte: <>Le pH est plus grand que celui de l’acide chlorhydrique à la même concentration.</>,
      tache: { type: 'qcm', q: 'Pourquoi le pH de l’acide éthanoïque est-il plus grand ?', options: ['il ne réagit que partiellement avec l’eau : [H₃O⁺] est inférieure à C', 'sa concentration est plus faible', 'il contient moins d’atomes d’hydrogène'], bonne: 0,
        expl: 'Un acide faible ne se dissocie que partiellement. À la même concentration apportée C, il fournit donc moins d’ions H₃O⁺ qu’un acide fort et le pH est plus élevé.' } },
    { id: 'tau', titre: 'Le taux d’avancement', focus: ['mesures'],
      texte: <>Le <strong>taux d’avancement final</strong> est la fraction d’acide qui a réagi : τ = [A⁻] / <em>C</em> = [H₃O⁺] / <em>C</em> (ici [A⁻] = [H₃O⁺], on néglige l’autoprotolyse de l’eau). Calculez-le à partir du pH lu dans « Mesures » (pH = {nbf(M.pH({ C: 1e-2, pKas: [4.8] }), 2)} pour l’acide éthanoïque à <em>C</em> = 1,0 × 10⁻² mol·L⁻¹).</>,
      tache: { type: 'num', q: 'Taux d’avancement τ de l’acide éthanoïque', unite: '%', vrai: M.tauAcide(1e-2, 4.8) * 100, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        bloque: scene === 'acide' && ac.id === 'etha' && ac.logC === -2 ? null : 'Choisissez d’abord l’acide éthanoïque à 10⁻² mol/L.',
        calcul: () => [`pH = ${nbf(M.pH({ C: 1e-2, pKas: [4.8] }), 2)} donc [H₃O⁺] = 10^(−pH) = ${sci(M.concH(M.pH({ C: 1e-2, pKas: [4.8] })), 2)} mol·L⁻¹.`, `τ = [H₃O⁺] / C = ${nbf(M.tauAcide(1e-2, 4.8) * 100, 1)} %.`],
        pieges: [[M.tauAcide(1e-2, 4.8), 'Le taux d’avancement est demandé en pourcentage.']],
        expl: 'τ ≈ 4 % : seule une petite fraction des molécules d’acide a réagi avec l’eau. Pour un acide fort, τ = 100 %.' } },
    { id: 'dilution', titre: 'Diluer l’acide', focus: ['reglages', 'mesures'],
      texte: <>Diluez la solution jusqu’à <em>C</em> = 1,0 × 10⁻⁴ mol·L⁻¹ (log C = −4) et observez le taux d’avancement.</>,
      tache: { type: 'action', ok: scene === 'acide' && ac.id === 'etha' && ac.logC === -4, label: 'Diluer à 10⁻⁴ mol/L', faire: () => { setScene('acide'); setAc({ id: 'etha', logC: -4 }); }, consigne: 'Réglez log C = −4 pour l’acide éthanoïque' } },
    { id: 'dilcons', titre: 'Effet de la dilution', focus: ['mesures'],
      texte: <>À 10⁻⁴ mol·L⁻¹, τ est bien plus grand qu’à 10⁻² mol·L⁻¹ (voir « Mesures »).</>,
      tache: { type: 'qcm', q: 'Quand on dilue un acide faible, son taux d’avancement final…', options: ['augmente', 'diminue', 'ne change pas'], bonne: 0,
        expl: 'Plus la solution est diluée, plus une grande fraction de l’acide réagit : τ augmente (il tend vers 100 % aux très faibles concentrations). Le pH, lui, augmente quand même, car [H₃O⁺] diminue.' } },
    { id: 'distrib', titre: 'Qui domine à un pH donné ?', focus: ['scene'],
      texte: <>Le <strong>diagramme de distribution</strong> donne la fraction de chaque forme du couple en fonction du pH. Affichez celui de l’acide éthanoïque, avec pH = pKa = 4,8.</>,
      tache: { type: 'action', ok: scene === 'distrib' && ds.id === 'etha' && Math.abs(ds.ph - 4.8) < 0.06, label: 'Afficher le diagramme à pH = 4,8', faire: () => { setScene('distrib'); setDs({ id: 'etha', ph: 4.8 }); }, consigne: 'Choisissez l’acide éthanoïque et réglez pH = 4,8' } },
    { id: 'pkaegal', titre: 'Quand pH = pKa', focus: ['scene', 'mesures'],
      texte: <>Les deux courbes se croisent exactement à pH = pKa.</>,
      tache: { type: 'qcm', q: 'À pH = pKa, on a…', options: ['[AH] = [A⁻]', '[AH] = 0', '[A⁻] = 10 [AH]'], bonne: 0,
        expl: 'De Ka = [A⁻][H₃O⁺]/[AH], on tire pH = pKa + log([A⁻]/[AH]). Si pH = pKa, alors log([A⁻]/[AH]) = 0 : les deux formes sont en concentrations égales.' } },
    { id: 'predom', titre: 'Domaines de prédominance', focus: ['scene'],
      texte: <>Placez le pH à 6,5 : vous êtes plus d’une unité au-dessus du pKa.</>,
      tache: { type: 'qcm', q: 'À pH = 6,5, quelle espèce prédomine pour le couple CH₃COOH / CH₃COO⁻ (pKa = 4,8) ?', options: ['CH₃COO⁻ (la base)', 'CH₃COOH (l’acide)', 'aucune : elles sont à égalité'], bonne: 0,
        expl: 'Pour pH > pKa, la base prédomine ; pour pH < pKa, c’est l’acide. À pH = 6,5, [A⁻]/[AH] = 10^(6,5 − 4,8) ≈ 50 : la base est largement majoritaire.' } },
    { id: 'citrique', titre: 'Un polyacide', focus: ['scene'],
      texte: <>L’acide citrique H₃A possède <strong>trois acidités</strong> : pKa₁ = 3,1 ; pKa₂ = 4,8 ; pKa₃ = 6,4. Choisissez-le et placez le pH à 4,0.</>,
      tache: { type: 'action', ok: scene === 'distrib' && ds.id === 'cit' && Math.abs(ds.ph - 4) < 0.06, label: 'Acide citrique, pH = 4,0', faire: () => { setScene('distrib'); setDs({ id: 'cit', ph: 4 }); }, consigne: 'Choisissez « acide citrique » et réglez pH = 4,0' } },
    { id: 'citpredom', titre: 'Espèce prédominante', focus: ['mesures'],
      texte: <>Repérez dans quel intervalle de pKa se trouve pH = 4,0.</>,
      tache: { type: 'qcm', q: 'À pH = 4,0, quelle espèce de l’acide citrique prédomine ?', options: ['H₂A⁻', 'H₃A', 'HA²⁻'], bonne: 0,
        expl: 'On a pKa₁ = 3,1 < pH = 4,0 < pKa₂ = 4,8 : H₃A a cédé un proton (pH > pKa₁) mais H₂A⁻ n’en a pas encore cédé un second (pH < pKa₂). H₂A⁻ prédomine.' } },
    { id: 'tampon', titre: 'Une solution tampon', focus: ['scene', 'reglages'],
      texte: <>Une <strong>solution tampon</strong> contient l’acide <em>et</em> sa base conjuguée en quantités comparables. Préparez 100{NB}mL de solution contenant 10{NB}mmol d’acide éthanoïque et 10{NB}mmol d’ion éthanoate.</>,
      tache: { type: 'action', ok: tpBase && tp.ajout === 0, label: 'Préparer le tampon équimolaire', faire: () => { setScene('tampon'); setTp(PRESET_TP); }, consigne: 'Réglez 10 mmol d’acide, 10 mmol de base, V = 100 mL, sans ajout' } },
    { id: 'phtampon', titre: 'Le pH du tampon', focus: ['mesures'],
      texte: <>Lisez le pH. Avec [A⁻] = [AH], la relation pH = pKa + log([A⁻]/[AH]) donne directement la valeur.</>,
      tache: { type: 'num', q: 'pH du tampon équimolaire', unite: '', vrai: 4.8, tol: 0.01, affiche: v => nbf(v, 1), cs: 2,
        bloque: tpBase && tp.ajout === 0 ? null : 'Préparez d’abord le tampon équimolaire (étape précédente).',
        calcul: () => ['[A⁻]/[AH] = 10/10 = 1, donc log(1) = 0.', 'pH = pKa + 0 = 4,8.'], pieges: [[9.6, 'Ne doublez pas le pKa : pH = pKa + log([A⁻]/[AH]).']],
        expl: 'pH = pKa = 4,8 : un tampon équimolaire a un pH égal au pKa de son couple.' } },
    { id: 'ajout', titre: 'Ajouter de l’acide fort', focus: ['reglages', 'mesures'],
      texte: <>Ajoutez maintenant 1,0{NB}mmol d’acide fort (ajout = −1,0{NB}mmol). Comparez avec ce qui se passe dans 100{NB}mL d’eau pure.</>,
      tache: { type: 'action', ok: tpBase && Math.abs(tp.ajout + 1) < 0.05, label: 'Ajouter 1,0 mmol d’acide', faire: () => { setScene('tampon'); setTp({ ...PRESET_TP, ajout: -1 }); }, consigne: 'Réglez l’ajout à −1,0 mmol (acide fort)' } },
    { id: 'delta', titre: 'La variation de pH', focus: ['mesures'],
      texte: <>Après l’ajout de 1,0{NB}mmol d’acide fort, le pH du tampon passe de 4,80 à une nouvelle valeur ; l’eau pure, elle, passe de 7 à une valeur très différente.</>,
      tache: { type: 'num', q: 'Variation de pH du tampon (valeur absolue)', unite: '', vrai: Math.abs(dTamp), tol: 0.1, affiche: v => nbf(v, 2), cs: 1,
        bloque: tpBase && Math.abs(tp.ajout + 1) < 0.05 ? null : 'Ajoutez d’abord 1,0 mmol d’acide fort au tampon.',
        calcul: () => [`Après l’ajout : pH = ${nbf(phAjout1, 2)}.`, `ΔpH = ${nbf(phAjout1, 2)} − 4,80 = ${nbf(dTamp, 2)}, soit ${nbf(Math.abs(dTamp), 2)} en valeur absolue.`],
        expl: `Le pH ne varie que de ${nbf(Math.abs(dTamp), 2)} unité, alors que dans l’eau pure il chute de ${nbf(Math.abs(dEau), 0)} unités.` } },
    { id: 'pourquoi', titre: 'Pourquoi ça résiste ?', focus: ['mesures'],
      texte: <>L’acide fort ajouté a réagi avec la base conjuguée du tampon.</>,
      tache: { type: 'qcm', q: 'Pourquoi le pH varie-t-il si peu ?', options: ['les ions H₃O⁺ ajoutés sont consommés par CH₃COO⁻ (A⁻ + H₃O⁺ → AH + H₂O), et le rapport [A⁻]/[AH] ne change que peu', 'l’acide ajouté ne se dissocie pas', 'l’eau neutralise l’acide ajouté'], bonne: 0,
        expl: 'La base A⁻ consomme les H₃O⁺ ajoutés (et l’acide AH consomme les HO⁻ ajoutés). Comme A⁻ et AH sont abondants, leur rapport, donc le pH, varie peu.' } },
    { id: 'zone', titre: 'Où un tampon est-il efficace ?', focus: ['mesures'],
      texte: <>Faites varier le rapport des quantités (essayez 1 mmol d’acide pour 19 mmol de base) et regardez le « pouvoir tampon ».</>,
      tache: { type: 'qcm', q: 'Un tampon est efficace lorsque le pH est…', options: ['dans l’intervalle pKa ± 1', 'toujours compris entre 6 et 8', 'très supérieur au pKa'], bonne: 0,
        expl: 'La résistance aux ajouts est maximale quand [AH] = [A⁻] (pH = pKa) et reste correcte tant que 0,1 < [A⁻]/[AH] < 10, c’est-à-dire pour pH compris entre pKa − 1 et pKa + 1.' } },
    { id: 'titrage', titre: 'Titrer un acide', focus: ['scene', 'reglages'],
      texte: <>On dose 20,0{NB}mL d’une solution d’acide éthanoïque de concentration inconnue par de la soude à 0,100{NB}mol·L⁻¹. Ouvrez le titrage préréglé ; sa concentration est à déterminer.</>,
      tache: { type: 'action', ok: tiBase, label: 'Ouvrir le titrage', faire: () => { setScene('titrage'); setTi(PRESET_TI); }, consigne: 'Choisissez l’onglet « Titrage » et réglez acide éthanoïque, C = 0,050 mol/L' } },
    { id: 'equiv', titre: 'L’équivalence', focus: ['scene', 'mesures'],
      texte: <>À l’<strong>équivalence</strong>, les réactifs ont été introduits dans les proportions stœchiométriques : <em>n</em>(HO⁻ versé) = <em>n</em>(acide initial). On la repère au maximum de la dérivée dpH/dV : affichez-la et déplacez le curseur de volume jusqu’à ce maximum.</>,
      tache: { type: 'num', q: 'Volume équivalent Veq', unite: 'mL', vrai: Veq, tol: 0.03, affiche: v => nbf(v, 1), cs: 3,
        bloque: tiBase ? null : 'Ouvrez d’abord le titrage préréglé (étape précédente).',
        calcul: () => ['Le maximum de dpH/dV se situe à V ≈ 10,0 mL.', 'Veq = 10,0 mL.'], pieges: [[Veq / 2, 'C’est le volume de la demi-équivalence, pas celui de l’équivalence.']],
        expl: 'Veq = 10,0 mL : le point où la courbe pH = f(V) a la pente la plus forte (maximum de la dérivée).' } },
    { id: 'pkalu', titre: 'Lire le pKa', focus: ['mesures'],
      texte: <>À la <strong>demi-équivalence</strong> (V = Veq/2), la moitié de l’acide a été transformée en sa base conjuguée : [AH] = [A⁻]. Déplacez le curseur sur V = 5,0{NB}mL.</>,
      tache: { type: 'num', q: 'pH à la demi-équivalence, donc pKa du couple', unite: '', vrai: pKaT, tol: 0.02, affiche: v => nbf(v, 1), cs: 2,
        bloque: tiBase ? null : 'Ouvrez d’abord le titrage préréglé (acide éthanoïque, 0,050 mol/L).',
        calcul: () => [`À V = Veq/2 = ${nbf(Veq / 2, 1)} mL, [AH] = [A⁻].`, `pH = pKa + log(1) = pKa ≈ ${nbf(phDemi, 1)}.`],
        expl: `On lit pH ≈ ${nbf(phDemi, 1)} : c’est le pKa du couple CH₃COOH / CH₃COO⁻ (4,8).` } },
    { id: 'basique', titre: 'Un pH basique à l’équivalence', focus: ['mesures'],
      texte: <>À l’équivalence, il ne reste plus d’acide : la solution contient l’ion éthanoate, dont le pH est supérieur à 7.</>,
      tache: { type: 'qcm', q: 'Pourquoi le pH à l’équivalence est-il supérieur à 7 ?', options: ['l’ion éthanoate CH₃COO⁻ est une base faible qui réagit avec l’eau', 'il reste de la soude en excès', 'l’acide éthanoïque est une base'], bonne: 0,
        expl: 'Seule l’espèce CH₃COO⁻ (base faible) est présente à l’équivalence : CH₃COO⁻ + H₂O ⇌ CH₃COOH + HO⁻. La solution est donc basique, au contraire d’un titrage acide fort / base forte pour lequel pH = 7.' } },
    { id: 'indic', titre: 'Choisir un indicateur coloré', focus: ['reglages', 'scene'],
      texte: <>Sans pH-mètre, on repère l’équivalence par le changement de couleur d’un <strong>indicateur coloré</strong>. Il convient si sa zone de virage <strong>contient le pH à l’équivalence</strong> (ici pH<sub>éq</sub> ≈ {nbf(M.phEquivalence({ C0: 0.05, V0: 0.02, pKas: [4.8], Cb: 0.1 }), 1)} ; le saut de pH va d’environ pH {nbf(M.sautPH({ C0: 0.05, V0: 0.02, pKas: [4.8], Cb: 0.1 })[0], 1)} à {nbf(M.sautPH({ C0: 0.05, V0: 0.02, pKas: [4.8], Cb: 0.1 })[1], 1)} autour de l’équivalence). Choisissez celui qui convient.</>,
      tache: { type: 'action', ok: tiBase && ti.ind === 'php', label: 'Choisir la phénolphtaléine', faire: () => { setScene('titrage'); setTi(t => ({ ...PRESET_TI, ind: 'php', Vb: t.Vb })); }, consigne: 'Choisissez l’indicateur dont la zone de virage contient le pH à l’équivalence' } },
    { id: 'conc', titre: 'Calculer la concentration', focus: ['mesures'],
      texte: <>La relation à l’équivalence est <em>C</em><sub>a</sub>·<em>V</em><sub>0</sub> = <em>C</em><sub>b</sub>·<em>V</em><sub>eq</sub>. Exprimez <em>C</em><sub>a</sub> pour une prise d’essai <em>V</em>₀ = 20,0{NB}mL, avec la soude à <em>C</em><sub>b</sub> = 0,100{NB}mol·L⁻¹ et le volume équivalent <em>V</em><sub>eq</sub> trouvé à l’étape précédente « L’équivalence ».</>,
      tache: { type: 'num', q: 'Concentration Cₐ de la solution d’acide', unite: 'mol/L', vrai: 0.050, tol: 0.02, affiche: v => nbf(v, 3), cs: 3,
        bloque: tiBase ? null : 'Ouvrez d’abord le titrage préréglé.',
        calcul: () => ['Cₐ = C_b × Veq / V₀ = 0,100 × 10,0 / 20,0.', 'Cₐ = 0,0500 mol·L⁻¹.'], pieges: [[0.1 * 20 / 10, 'Vous avez inversé Veq et V₀.']],
        expl: 'Cₐ = 5,00 × 10⁻² mol·L⁻¹ : c’est la concentration de la solution d’acide dosée.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
        <li>pH = −log [H₃O⁺] ; un acide fort réagit totalement (τ = 100 %), un acide faible partiellement (τ &lt; 100 %)</li>
        <li>pH = pKa + log([A⁻]/[AH]) ; la forme acide prédomine pour pH &lt; pKa, la forme basique pour pH &gt; pKa</li>
        <li>une solution tampon contient AH et A⁻ en quantités comparables ; elle limite les variations de pH (pH = pKa ± 1)</li>
        <li>à l’équivalence d’un titrage : n(titrant versé) = n(espèce titrée) ; à la demi-équivalence, pH = pKa</li>
        <li>l’indicateur coloré convient si sa zone de virage contient le pH à l’équivalence</li></ul>,
      texte: <>Vous savez relier pH, pKa et prédominance, expliquer le rôle d’un tampon et exploiter un titrage pH-métrique. Essayez maintenant les défis.</>, tache: null },
  ];
  // la bonne réponse des QCM est répartie entre les positions (pas toujours la première)
  const ETAPES = ETAPES0.map((e, i) => {
    if (e.tache?.type !== 'qcm') return e;
    const o = [...e.tache.options], bonne = o.splice(e.tache.bonne, 1)[0], pos = (i * 2 + 1) % (o.length + 1);
    o.splice(pos, 0, bonne);
    return { ...e, tache: { ...e.tache, options: o, bonne: pos } };
  });
  const idE = ETAPES[Math.min(etape, ETAPES.length - 1)].id;
  const IDS = ETAPES.map(e => e.id), apres = id => !enGuide || etape > IDS.indexOf(id);
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFIS ════════════════
  function nouveauDefi(type) {
    const base = { type, reps: {}, verifie: false };
    if (type === 'pka') { const pKa = tire(POUR_DEFI); setDefi({ ...base, pKa, id: ID_PAR_PKA[pKa], C0: tire([0.040, 0.050, 0.060, 0.080]) }); setTi(t => ({ ...t, Vb: 0, ind: null, deriv: true })); }
    else if (type === 'conc') {
      const C0 = tire([0.040, 0.045, 0.055, 0.065, 0.075, 0.085]), pKa = tire(POUR_DEFI), Ceti = Math.round(C0 * (1 + tire([-0.03, -0.015, 0.0, 0.015, 0.03])) * 1000) / 1000;
      setDefi({ ...base, pKa, id: ID_PAR_PKA[pKa], C0, Ceti }); setTi(t => ({ ...t, Vb: 0, ind: null, deriv: true }));
    } else { const pKa = tire([4.2, 4.8, 6.4, 7.2]); setDefi({ ...base, pKa, cible: Math.round((pKa + tire([-0.8, -0.5, -0.3, 0.3, 0.5, 0.8])) * 10) / 10 }); setTp({ nAH: 10, nA: 10, V: 100, ajout: 0 }); }
  }
  function changerMode(md) {
    setMode(md);
    if (md === 'defi') { if (!defi) nouveauDefi(typeDefi); else { setTi(t => ({ ...t, Vb: 0, ind: null, deriv: true })); setTp(PRESET_TP); } }
    if (md === 'guide') { setScene('acide'); setAc(PRESET_AC); setTi(PRESET_TI); setTp(PRESET_TP); setDs({ id: 'etha', ph: 4.8 }); }
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const incTi = M.incertitudeTitrage({ Cb: Ti.Cb, Veq: Math.max(equivDer, 1e-3), V0: Ti.V0, uCb: U_CB * Ti.Cb / R3, uVeq: U_VEQ / R3, uV0: U_V0 / R3 });
  const verifier = () => {
    const x = lireNombre(defi.reps.v);
    let ok, imprecis = false, compat = null;
    if (defi.type === 'pka') ok = isFinite(x) && Math.abs(x - defi.pKa) <= 0.15;
    else if (defi.type === 'conc') {
      const vrai = defi.C0, tol = Math.max(0.03, 2 * incTi.rel); ok = isFinite(x) && proche(x, vrai, tol);
      const uEt = 0.02 * defi.Ceti / R3, uMes = x * incTi.rel;
      compat = isFinite(x) ? { z: Math.abs(x - defi.Ceti) / Math.hypot(uMes, uEt), ok: Math.abs(x - defi.Ceti) / Math.hypot(uMes, uEt) <= 2 } : null;
    } else ok = Math.abs(phTp0 - defi.cible) <= 0.1 && Math.abs(tp.V - 100) < 1 && tp.nAH >= 1 && tp.nA >= 1 && tp.nAH + tp.nA >= 10;
    setDefi(d => ({ ...d, verifie: true, ok, imprecis, compat }));
    (defi.type === 'pka' ? noterPka : defi.type === 'conc' ? noterConc : noterTampon)(ok);
  };
  const champReponse = (cle, unite, label) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps[cle] ?? ''} aria-label={label} onKeyDown={e => e.key === 'Enter' && document.getElementById('ab-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, [cle]: e.target.value }, verifie: false }))}
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['pka', 'pKa d’un acide inconnu'], ['conc', 'Concentration d’un acide'], ['tampon', 'Préparer un tampon']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0f766e')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'pka' ? 'Défi : quel est le pKa de l’acide ?' : defi.type === 'conc' ? 'Défi : quelle est la concentration de la solution d’acide ?' : `Défi : préparer 100 mL de tampon de pH ${nbf(defi.cible, 1)}`}</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>
        {defi.type === 'pka' && <>On titre 20,0{NB}mL d’une solution (<em>C</em> = {nbf(defi.C0, 3)}{NB}mol·L⁻¹) d’un acide faible inconnu par de la soude à 0,100{NB}mol·L⁻¹. Repérez l’équivalence, puis lisez le pH à la demi-équivalence : il donne le pKa du couple.</>}
        {defi.type === 'conc' && <>On titre 20,0{NB}mL d’une solution d’acide dont l’étiquette indique <strong>{nbf(defi.Ceti, 3)}{NB}mol·L⁻¹</strong> (± 2 %) par de la soude à 0,100{NB}mol·L⁻¹. Repérez le volume équivalent, calculez la concentration, puis jugez si votre résultat est <strong>compatible</strong> avec l’étiquette.</>}
        {defi.type === 'tampon' && <>On dispose d’un couple acide/base de pKa = <strong>{nbf(defi.pKa, 1)}</strong> et on veut 100{NB}mL de solution de pH = <strong>{nbf(defi.cible, 1)}</strong> (± 0,1). Réglez les quantités d’acide et de base conjuguée (au moins 10 mmol au total, pour que le tampon ait une capacité suffisante), sans ajout, puis vérifiez.</>}
      </div>
      {defi.type === 'pka' && champReponse('v', '', 'pKa de l’acide')}
      {defi.type === 'conc' && champReponse('v', 'mol/L', 'Concentration trouvée')}
      {defi.type === 'tampon' && <div style={{ fontSize: 14, marginBottom: 8, color: KIT.txt2 }}>Aucune saisie : le pH affiché dans « Mesures » est celui qui sera contrôlé.</div>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="ab-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? `✓ Correct. ${defi.type === 'pka' ? `pKa = ${nbf(defi.pKa, 2)} (${ACIDES[defi.id].nom}).` : defi.type === 'conc' ? `Valeur de la simulation : ${nbf(defi.C0, 3)} mol/L.` : `pH obtenu : ${nbf(phTp0, 2)}.`}`
          : defi.type === 'pka' ? '✗ Vérifiez : à la demi-équivalence V = Veq / 2, pH = pKa. Repérez d’abord Veq au maximum de dpH/dV, puis placez le curseur sur Veq/2.'
            : defi.type === 'conc' ? '✗ Vérifiez : Cₐ = C_b × Veq / V₀, avec Veq au maximum de dpH/dV (en mL, comme V₀).'
              : '✗ Rappel : pH = pKa + log(n(base) / n(acide)). Il faut n(base)/n(acide) = 10^(pH − pKa).'}
        {defi.type === 'conc' && defi.compat && <div style={{ color: defi.compat.ok ? '#15803d' : '#b45309', marginTop: 4 }}>Comparaison avec l’étiquette : écart normalisé = {nbf(defi.compat.z, 1)} ({defi.compat.ok ? '≤ 2 : résultat compatible avec l’étiquette' : '> 2 : résultat non compatible avec l’étiquette'}).</div>}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Température 25 °C</strong> : K<sub>e</sub> = 1,0 × 10⁻¹⁴. Les pKa sont les valeurs de la simulation, proches de celles des tables.</li>
      <li><strong>Activités = concentrations</strong> : solutions diluées (C ≤ 0,1 mol·L⁻¹), sans effet de force ionique.</li>
      <li><strong>pH calculé exactement</strong> par la conservation de la charge (autoprotolyse de l’eau et polyacides compris), pas par les formules approchées. Les formules du cours (pH = ½(pKa − log C), pH = pKa + log([A⁻]/[AH])) sont affichées pour comparaison.</li>
      <li><strong>Acides forts et bases fortes</strong> : totalement dissociés. Pas de CO₂ dissous dans les solutions. Titrage : volumes additifs ; tampon : l’ajout ne change pas le volume de la solution.</li>
      <li><strong>Titrage</strong> : le pH-mètre est supposé parfaitement étalonné. Incertitudes (type B, loi rectangulaire, u = demi-étendue / √3, sources indépendantes) : concentration de la soude ± 0,5 %, prise d’essai à la pipette ± 0,03 mL, repérage du volume équivalent ± 0,1 mL. Compatibilité avec l’étiquette (± 2 %, loi rectangulaire) : |écart| / √(u² + u_étiq²) ≤ 2.</li>
      <li><strong>Indicateurs</strong> : un indicateur convient si sa zone de virage contient le pH à l’équivalence ; la couleur est un mélange des teintes acide et basique selon le pH ; les zones de virage sont celles des tables ({M.INDICATEURS.map(i => `${i.nom} ${nbf(i.zone[0], 1)}–${nbf(i.zone[1], 1)}`).join(' ; ')}).</li>
      <li><strong>Pouvoir tampon</strong> : β = variation de quantité de base forte ajoutée par litre et par unité de pH, calculée autour de l’état courant.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0f766e')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scènes ----------
  const Echelle = ph => (
    <svg viewBox="0 0 600 46" style={{ width: '100%', display: 'block' }} role="img" aria-label={`Échelle de pH : la solution a un pH de ${nbf(ph, 2)}`}>
      <defs><linearGradient id="ab-ech" x1="0" x2="1"><stop offset="0" stopColor="#dc2626"/><stop offset="0.25" stopColor="#f59e0b"/><stop offset="0.5" stopColor="#22c55e"/><stop offset="0.75" stopColor="#3b82f6"/><stop offset="1" stopColor="#6d28d9"/></linearGradient></defs>
      <rect x="20" y="8" width="560" height="14" rx="7" fill="url(#ab-ech)"/>
      {[0, 2, 4, 6, 8, 10, 12, 14].map(k => <text key={k} x={20 + 560 * k / 14} y="40" fontSize="11" textAnchor="middle" fill="#334155">{k}</text>)}
      <polygon points={`${20 + 560 * Math.max(0, Math.min(14, ph)) / 14 - 7},0 ${20 + 560 * Math.max(0, Math.min(14, ph)) / 14 + 7},0 ${20 + 560 * Math.max(0, Math.min(14, ph)) / 14},11`} fill="#0f172a"/>
    </svg>);

  const SceneAcide = () => {
    const esp = A.fort ? [['H₃O⁺', hA, '#dc2626'], [A.base, C, '#0e7490']] : [['H₃O⁺', hA, '#dc2626'], [A.base, C * fracA[1], '#0e7490'], [A.formule, C * fracA[0], '#6d28d9']];
    const lo = -8, hi = 0;
    return (
      <div>
        {Echelle(phA)}
        <svg viewBox="0 0 600 150" style={{ width: '100%', display: 'block', marginTop: 6, background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }} role="img"
          aria-label={`Concentrations à l’équilibre en échelle logarithmique : ${esp.map(([n, c]) => `${n} ${sci(c, 1)} mol par litre`).join(' ; ')}`}>
          {esp.map(([n, c, col], i) => { const lg = Math.log10(Math.max(c, 1e-12)), w = Math.max(2, 440 * (lg - lo) / (hi - lo)); return (
            <g key={n}><text x="8" y={34 + i * 38} fontSize="13" fontWeight="700" fill="#0f172a">{n}</text><rect x="90" y={20 + i * 38} width={w} height="22" rx="4" fill={col} opacity="0.85"/><text x={96 + w} y={36 + i * 38} fontSize="12" fill="#0f172a">{sci(c, 1)} mol/L</text></g>); })}
          <text x="8" y="144" fontSize="11" fill="#475569">échelle logarithmique : une barre deux fois plus longue = concentration bien plus grande</text>
        </svg>
      </div>);
  };

  const SceneDistrib = () => {
    const W = 600, H = 250, X = ph => 44 + (W - 60) * ph / 14, Y = a => 20 + (H - 52) * (1 - a);
    const courbes = P.especes.map((_, i) => { let d = ''; for (let k = 0; k <= 140; k++) { const ph = k / 10, a = M.fractions(M.concH(ph), P.pKas)[i]; d += `${k ? 'L' : 'M'}${X(ph).toFixed(1)},${Y(a).toFixed(1)}`; } return d; });
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }} role="img"
        aria-label={`Diagramme de distribution de ${P.nom} : à pH ${nbf(ds.ph, 1)}, ${P.especes.map((e, i) => `${e} ${nbf(frD[i] * 100, 0)} pour cent`).join(', ')}`}>
        <line x1={X(0)} y1={Y(0)} x2={X(14)} y2={Y(0)} stroke="#94a3b8"/><line x1={X(0)} y1={Y(0)} x2={X(0)} y2={Y(1)} stroke="#94a3b8"/>
        {[0, 2, 4, 6, 8, 10, 12, 14].map(k => <text key={k} x={X(k)} y={H - 14} fontSize="11" textAnchor="middle" fill="#334155">{k}</text>)}
        {[0, 0.5, 1].map(a => <text key={a} x={X(0) - 6} y={Y(a) + 4} fontSize="11" textAnchor="end" fill="#334155">{a * 100}%</text>)}
        <text x={W / 2} y={H - 1} fontSize="11" textAnchor="middle" fill="#334155">pH</text>
        {P.pKas.map((p, i) => <g key={i}><line x1={X(p)} y1={Y(1)} x2={X(p)} y2={Y(0)} stroke="#cbd5e1" strokeDasharray="4 3"/><text x={X(p)} y={Y(1) - 4} fontSize="10.5" textAnchor="middle" fill="#475569">pKa{sub(i + 1)} = {nbf(p, 1)}</text></g>)}
        {courbes.map((d, i) => <path key={i} d={d} fill="none" stroke={COUL_ESP[i]} strokeWidth="2.2"/>)}
        {P.especes.map((e, i) => { const phm = i === 0 ? (P.pKas[0] - 1.2) : i === P.especes.length - 1 ? Math.min(13.2, P.pKas[P.pKas.length - 1] + 1.2) : (P.pKas[i - 1] + P.pKas[i]) / 2; return <text key={e} x={X(Math.max(0.6, phm))} y={Y(0.62) - (i % 2 ? 0 : 6)} fontSize="12.5" fontWeight="700" textAnchor="middle" fill={COUL_ESP[i]} stroke="white" strokeWidth="3" paintOrder="stroke">{e}</text>; })}
        <line x1={X(ds.ph)} y1={Y(1)} x2={X(ds.ph)} y2={Y(0)} stroke="#0f172a" strokeWidth="1.5"/>
        {frD.map((a, i) => <circle key={i} cx={X(ds.ph)} cy={Y(a)} r="4.5" fill={COUL_ESP[i]} stroke="white" strokeWidth="1.5"/>)}
      </svg>);
  };

  const SceneTampon = () => {
    const gauge = (titre, ph, col) => (<div style={{ flex: 1, minWidth: 220 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>{titre} : pH = {nbf(ph, 2)}</div>{Echelle(ph)}</div>);
    const nIni = tp.nAH + tp.nA;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {gauge(`Solution tampon (${tp.nAH} mmol AH / ${tp.nA} mmol A⁻)`, phTp)}
          {!enDefi && gauge(`${tp.V} mL d’eau pure, même ajout`, phEau)}
        </div>
        <svg viewBox="0 0 600 70" style={{ width: '100%', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }} role="img" aria-label={`Quantités dans la solution : ${nbf(tp.nAH, 0)} millimoles d’acide et ${nbf(tp.nA, 0)} millimoles de base conjuguée`}>
          <rect x="20" y="14" width={Math.max(2, 560 * tp.nAH / 40)} height="20" fill="#6d28d9" opacity="0.85" rx="3"/><text x="24" y="28" fontSize="12" fill="white" fontWeight="700">AH</text>
          <rect x="20" y="40" width={Math.max(2, 560 * tp.nA / 40)} height="20" fill="#0e7490" opacity="0.85" rx="3"/><text x="24" y="54" fontSize="12" fill="white" fontWeight="700">A⁻</text>
          <text x="580" y="28" fontSize="11" textAnchor="end" fill="#334155">{nbf(tp.nAH, 0)} mmol</text><text x="580" y="54" fontSize="11" textAnchor="end" fill="#334155">{nbf(tp.nA, 0)} mmol</text>
        </svg>
        {nIni === 0 && <div role="alert" style={{ color: '#b91c1c', fontSize: 13.5 }}>Il faut au moins un des deux constituants.</div>}
      </div>);
  };

  const SceneTitrage = () => {
    const W = 600, H = 280, mx = 44, X = v => mx + (W - mx - 12) * v / VMAX, Y = p => 14 + (H - 46) * (1 - p / 14);
    const tr = ptsTi.map((p, i) => `${i ? 'L' : 'M'}${X(p.V).toFixed(1)},${Y(p.pH).toFixed(1)}`).join('');
    const dmax = Math.max(...ptsTi.map(p => p.d));
    const Yd = d => (H - 32) - (H - 60) * 0.5 * d / dmax;
    const trd = ptsTi.map((p, i) => `${i ? 'L' : 'M'}${X(p.V).toFixed(1)},${Yd(p.d).toFixed(1)}`).join('');
    const indo = Ti.ind ? M.INDICATEURS.find(i => i.id === Ti.ind) : null;
    const coulSol = indo ? M.couleurIndicateur(indo, phTi) : '#e0f2fe';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'stretch' }}>
          <svg viewBox="0 0 150 230" style={{ width: 110, flex: '0 0 auto', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }} role="img"
            aria-label={`Montage : burette de soude (volume versé ${nbf(Ti.Vb, 1)} mL) et bécher contenant la solution${indo ? `, de couleur ${phTi < indo.zone[0] ? 'acide' : phTi > indo.zone[1] ? 'basique' : 'intermédiaire'} de l’indicateur` : ''}`}>
            <rect x="66" y="8" width="18" height="100" fill="#f1f5f9" stroke="#64748b"/><rect x="67" y={8 + 100 * Ti.Vb / VMAX} width="16" height={100 - 100 * Ti.Vb / VMAX} fill="#cbd5e1"/>
            <text x="92" y="22" fontSize="10" fill="#475569">0</text><text x="92" y="108" fontSize="10" fill="#475569">25</text>
            <line x1="75" y1="108" x2="75" y2="128" stroke="#64748b" strokeWidth="2"/>
            <path d="M28,140 L122,140 L112,218 L38,218 Z" fill={coulSol} stroke="#475569" strokeWidth="2"/><ellipse cx="75" cy="140" rx="47" ry="5" fill="none" stroke="#475569"/>
            <circle cx="75" cy="205" r="5" fill="white" stroke="#475569"/>
          </svg>
          <div style={{ flex: '1 1 300px', minWidth: 280 }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }} role="img"
              aria-label={`Courbe de titrage pH en fonction du volume de soude versé. Curseur à ${nbf(Ti.Vb, 1)} mL, pH ${nbf(phTi, 2)}${Ti.deriv ? ' ; dérivée du pH affichée en vert' : ''}`}>
              <line x1={mx} y1={Y(0)} x2={W - 12} y2={Y(0)} stroke="#94a3b8"/><line x1={mx} y1={Y(0)} x2={mx} y2={Y(14)} stroke="#94a3b8"/>
              {[0, 5, 10, 15, 20, 25].map(v => <text key={v} x={X(v)} y={H - 4} fontSize="11" textAnchor="middle" fill="#334155">{v}</text>)}
              {[0, 2, 4, 6, 8, 10, 12, 14].map(p => <g key={p}><line x1={mx} y1={Y(p)} x2={W - 12} y2={Y(p)} stroke="#eef2f7"/><text x={mx - 5} y={Y(p) + 4} fontSize="11" textAnchor="end" fill="#334155">{p}</text></g>)}
              <text x={W / 2} y={H - 18} fontSize="11" textAnchor="middle" fill="#334155">volume de soude versé (mL)</text><text x="12" y={Y(7)} fontSize="11" fill="#334155" transform={`rotate(-90 12 ${Y(7)})`} textAnchor="middle">pH</text>
              {indo && <rect x={mx} y={Y(indo.zone[1])} width={W - mx - 12} height={Y(indo.zone[0]) - Y(indo.zone[1])} fill={indo.base} opacity="0.18"/>}
              {indo && <text x={W - 16} y={Y(indo.zone[1]) + 13} fontSize="10.5" textAnchor="end" fill="#334155">zone de virage : {indo.nom}</text>}
              {Ti.deriv && <path d={trd} fill="none" stroke="#15803d" strokeWidth="1.6" strokeDasharray="5 3"/>}
              {Ti.deriv && <text x={X(Math.min(VMAX - 5, equivDer + 0.8))} y={Yd(dmax) + 4} fontSize="11" fill="#15803d">dpH/dV</text>}
              <path d={tr} fill="none" stroke="#0369a1" strokeWidth="2.4"/>
              <line x1={X(Ti.Vb)} y1={Y(0)} x2={X(Ti.Vb)} y2={Y(14)} stroke="#b45309" strokeWidth="1.4" strokeDasharray="3 3"/>
              <circle cx={X(Ti.Vb)} cy={Y(phTi)} r="5.5" fill="#f59e0b" stroke="#0f172a" strokeWidth="1.5"/>
            </svg>
          </div>
        </div>
      </div>);
  };

  const zoneScene = sceneEff === 'acide' ? SceneAcide() : sceneEff === 'distrib' ? SceneDistrib() : sceneEff === 'tampon' ? SceneTampon() : SceneTitrage();
  const ONGLETS = [['acide', 'pH d’un acide'], ['distrib', 'Diagramme de distribution'], ['tampon', 'Solution tampon'], ['titrage', 'Titrage']];
  const sceneBox = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {!enDefi && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {ONGLETS.map(([k, l]) => <button key={k} onClick={() => setScene(k)} aria-pressed={scene === k} style={stylePetitBouton(scene === k, '#0f766e')}>{l}</button>)}
      </div>}
      {zoneScene}
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6 }}>
        {sceneEff === 'acide' && 'Barres en échelle logarithmique : les concentrations varient de plusieurs puissances de 10.'}
        {sceneEff === 'distrib' && 'Le trait vertical est le pH choisi ; les points donnent la fraction de chaque espèce à ce pH.'}
        {sceneEff === 'tampon' && 'Comparez la variation de pH de la solution tampon à celle de l’eau pure pour le même ajout.'}
        {sceneEff === 'titrage' && 'Bleu : pH = f(V). Le point orange suit le curseur de volume. Vert pointillé : dérivée dpH/dV (si affichée).'}
      </div>
    </div>);

  const reglages = (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {sceneEff === 'acide' && <>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>{Object.entries(ACIDES).map(([k, a]) => <button key={k} onClick={() => setAc(s => ({ ...s, id: k }))} aria-pressed={ac.id === k} style={stylePetitBouton(ac.id === k, '#0f766e')}>{a.nom}</button>)}</div>
        <Curseur nom="log C (C en mol/L)" valeur={ac.logC} onChange={v => setAc(s => ({ ...s, logC: v }))} min={-6} max={-1} pas={1} unite="" decimales={0} couleur="#475569"/>
        <div style={{ fontSize: 13, color: KIT.txt2 }}>C = {sci(C, 1)} mol/L</div>
      </>}
      {sceneEff === 'distrib' && <>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>{Object.entries(POLY).map(([k, a]) => <button key={k} onClick={() => setDs(s => ({ ...s, id: k }))} aria-pressed={ds.id === k} style={stylePetitBouton(ds.id === k, '#0f766e')}>{a.nom}</button>)}</div>
        <Curseur nom="pH" valeur={ds.ph} onChange={v => setDs(s => ({ ...s, ph: v }))} min={0} max={14} pas={0.1} unite="" decimales={1} couleur="#475569"/>
      </>}
      {sceneEff === 'tampon' && <>
        {dd ? <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6 }}>Couple de pKa = {nbf(dd.pKa, 1)}, volume 100 mL. Réglez les quantités.</div> : <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6 }}>Couple CH₃COOH / CH₃COO⁻ (pKa = 4,8)</div>}
        <Curseur nom="Quantité d’acide AH" valeur={tp.nAH} onChange={v => setTp(s => ({ ...s, nAH: v }))} min={0} max={40} pas={1} unite="mmol" decimales={0} couleur="#6d28d9"/>
        <Curseur nom="Quantité de base A⁻" valeur={tp.nA} onChange={v => setTp(s => ({ ...s, nA: v }))} min={0} max={40} pas={1} unite="mmol" decimales={0} couleur="#0e7490"/>
        {!dd && <><Curseur nom="Volume de solution" valeur={tp.V} onChange={v => setTp(s => ({ ...s, V: v }))} min={50} max={200} pas={10} unite="mL" decimales={0} couleur="#475569"/>
          <Curseur nom="Ajout (− acide fort / + base forte)" valeur={tp.ajout} onChange={v => setTp(s => ({ ...s, ajout: v }))} min={-5} max={5} pas={0.5} unite="mmol" decimales={1} couleur="#b45309"/></>}
      </>}
      {sceneEff === 'titrage' && <>
        {!enDefi && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>{Object.entries(ACIDES).filter(([k]) => k !== 'amm').map(([k, a]) => <button key={k} onClick={() => setTi(s => ({ ...s, id: k }))} aria-pressed={ti.id === k} style={stylePetitBouton(ti.id === k, '#0f766e')}>{a.nom}</button>)}</div>}
        {enDefi ? <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6 }}>20,0 mL d’acide inconnu titrés par la soude (0,100 mol·L⁻¹).</div> : enGuide ? <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Prise d’essai 20,0 mL d’acide de concentration inconnue ; soude à 0,100 mol/L.</div> : <>
          <Curseur nom="Concentration de l’acide C" valeur={ti.C0} onChange={v => setTi(s => ({ ...s, C0: v }))} min={0.02} max={0.1} pas={0.005} unite="mol/L" decimales={3} couleur="#475569"/>
          <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Prise d’essai 20,0 mL ; soude à 0,100 mol/L.</div></>}
        <Curseur nom="Volume de soude versé V" valeur={ti.Vb} onChange={v => setTi(s => ({ ...s, Vb: v }))} min={0} max={VMAX} pas={0.1} unite="mL" decimales={1} couleur="#b45309"/>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          <button onClick={() => setTi(s => ({ ...s, deriv: !s.deriv }))} aria-pressed={ti.deriv} style={stylePetitBouton(ti.deriv, '#15803d')}>Afficher la dérivée</button>
        </div>
        {!enDefi && <><div style={{ fontSize: 13, color: KIT.txt2, fontWeight: 700, margin: '8px 0 4px' }}>Indicateur coloré</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => setTi(s => ({ ...s, ind: null }))} aria-pressed={!ti.ind} style={stylePetitBouton(!ti.ind, '#475569')}>aucun</button>
            {M.INDICATEURS.map(i => <button key={i.id} onClick={() => setTi(s => ({ ...s, ind: i.id }))} aria-pressed={ti.ind === i.id} style={stylePetitBouton(ti.ind === i.id, '#475569')}>{i.nom}</button>)}
          </div></>}
      </>}
    </div>);

  const mesures = (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {sceneEff === 'acide' && <>
        <LigneMesure nom="pH (pH-mètre)" valeur={nbf(phA, 2)} couleur="#b45309"/>
        <LigneMesure nom="[H₃O⁺] = 10^(−pH)" valeur={`${sci(hA, 2)}${NB}mol/L`}/>
        {apres('phfort') && <LigneMesure nom="Concentration apportée C" valeur={`${sci(C, 1)}${NB}mol/L`}/>}
        {apres('tau') && <LigneMesure nom="Taux d’avancement τ = [A⁻] / C" valeur={`${nbf(Math.min(100, tauA * 100), 1)}${NB}%`} couleur="#15803d"/>}
        {!enGuide && !A.fort && <LigneMesure nom={`pH approché ½(pKa − log C), pKa = ${nbf(A.pKas[0], 2)}`} valeur={nbf(phApprox, 2)}/>}
        {!enGuide && A.fort && <LigneMesure nom="pH approché −log C" valeur={nbf(phApprox, 2)}/>}
        {!enGuide && !A.fort && <LigneMesure nom="Écart entre pH approché et pH exact" valeur={nbf(phApprox - phA, 2)} couleur={Math.abs(phApprox - phA) > 0.05 ? '#b91c1c' : '#15803d'}/>}
      </>}
      {sceneEff === 'distrib' && <>
        <LigneMesure nom="pH" valeur={nbf(ds.ph, 1)} couleur="#b45309"/>
        {P.especes.map((e, i) => <LigneMesure key={e} nom={`Fraction de ${e}`} valeur={`${nbf(frD[i] * 100, 1)}${NB}%`} couleur={COUL_ESP[i]}/>)}
        {apres('citpredom') || !enGuide ? <LigneMesure nom="Espèce prédominante" valeur={[...frD].sort((a, b) => b - a)[0] - [...frD].sort((a, b) => b - a)[1] < 0.01 ? 'égalité de deux espèces' : P.especes[idxMax]} couleur="#15803d"/> : null}
        {!enGuide && P.pKas.map((p, i) => <LigneMesure key={i} nom={`pH − pKa${sub(i + 1)}`} valeur={nbf(ds.ph - p, 2)}/>)}
      </>}
      {sceneEff === 'tampon' && <>
        <LigneMesure nom="pH de la solution" valeur={nbf(phTp, 2)} couleur="#b45309"/>
        {!enDefi && <LigneMesure nom={`pH de ${tp.V} mL d’eau pure, même ajout`} valeur={nbf(phEau, 2)}/>}
        {!enDefi && <LigneMesure nom="Variation de pH du tampon" valeur={nbf(phTp - phTp0, 2)} couleur="#15803d"/>}
        {!enDefi && (!enGuide || apres('ajout')) && <LigneMesure nom="Rapport [A⁻] / [AH]" valeur={tp.nAH > 0 ? nbf(tp.nA / tp.nAH, 2) : '–'}/>}
        {!enDefi && (!enGuide || apres('ajout')) && <LigneMesure nom="Pouvoir tampon β" valeur={isFinite(betaTp) ? `${nbf(betaTp, 3)}${NB}mol·L⁻¹ par unité de pH` : '–'}/>}
        {!enDefi && (!enGuide || apres('ajout')) && tp.nAH > 0 && tp.nA > 0 && <LigneMesure nom="pH dans l’intervalle pKa ± 1 ?" valeur={Math.abs(phTp0 - 4.8) <= 1 ? 'oui : tampon efficace' : 'non : peu efficace'} couleur={Math.abs(phTp0 - 4.8) <= 1 ? '#15803d' : '#b91c1c'}/>}
        {enDefi && <LigneMesure nom="pH préparé (sans ajout)" valeur={nbf(phTp0, 2)}/>}
      </>}
      {sceneEff === 'titrage' && <>
        <LigneMesure nom="Volume versé V" valeur={`${nbf(Ti.Vb, 1)}${NB}mL`}/>
        <LigneMesure nom="pH (pH-mètre)" valeur={nbf(phTi, 2)} couleur="#b45309"/>
        {Ti.deriv && <LigneMesure nom="Dérivée dpH/dV (± 0,1 mL)" valeur={`${nbf(derTi, 2)}${NB}pH/mL`} couleur="#15803d"/>}
        {!enGuide && !enDefi && <LigneMesure nom="Volume équivalent (maximum de la dérivée)" valeur={`${nbf(equivDer, 1)}${NB}mL`} couleur="#15803d"/>}
        {!enGuide && !enDefi && pKaT != null && <LigneMesure nom={`pH à Veq / 2 (pKa du couple = ${nbf(pKaT, 2)})`} valeur={nbf(phDemi, 2)}/>}
        {!enGuide && !enDefi && <LigneMesure nom="Concentration Cb × Veq / V₀" valeur={`${nbf(Ti.Cb * equivDer / Ti.V0, 4)}${NB}mol/L`}/>}
        {Ti.ind && !enDefi && (() => { const indo = M.INDICATEURS.find(i => i.id === Ti.ind), peq = M.phEquivalence(pT), cv = M.convient(indo, peq); return <><LigneMesure nom="pH à l’équivalence" valeur={nbf(peq, 2)}/><LigneMesure nom={`Indicateur ${indo.nom} adapté à ce titrage ?`} valeur={cv ? 'oui' : 'non'} couleur={cv ? '#15803d' : '#b91c1c'}/></>; })()}
      </>}
    </div>);

  const incertBox = enDefi && defi?.type === 'conc' && (
    <div style={{ ...styleBoite }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Sources d’incertitude sur la concentration</div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginBottom: 6 }}>Type B : u = demi-étendue / √3 ; sources indépendantes.</div>
      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
        <thead><tr style={{ textAlign: 'left', color: KIT.txt2 }}><th style={{ padding: '2px 4px' }}>Source</th><th style={{ padding: '2px 4px' }}>± demi-étendue</th></tr></thead>
        <tbody>{[['Cb (soude)', '0,5 %', U_CB / R3], ['Veq (repérage)', `${nbf(U_VEQ, 1)} mL`, U_VEQ / R3 / Math.max(equivDer, 1e-3)], ['V₀ (pipette)', `${nbf(U_V0, 2)} mL`, U_V0 / R3 / Ti.V0]].map(([n, dem, r]) => (
          <tr key={n} style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ padding: '3px 4px', fontWeight: 600 }}>{n}</td><td style={{ padding: '3px 4px' }}>{dem}</td></tr>))}</tbody>
      </table>
      {defi.verifie && <LigneMesure nom="u(Cₐ) / Cₐ" valeur={`${nbf(incTi.rel * 100, 2)} %`}/>}
    </div>);

  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>pH d’un acide : diluez l’acide éthanoïque de 10⁻² à 10⁻⁶ mol/L. Le pH approché reste-t-il proche du pH exact ? Pourquoi décroche-t-il ?</li>
        <li>pH d’un acide : comparez l’ion ammonium et l’acide méthanoïque à la même concentration. Lequel est le plus dissocié ?</li>
        <li>Distribution : dans l’acide citrique, pour quel pH H₂A⁻ est-elle maximale, et quelle fraction atteint-elle ? Pour l’acide phosphorique, existe-t-il une espèce prédominante à tout pH, sauf aux valeurs pH = pKa ?</li>
        <li>Tampon : gardez 20 mmol au total mais changez le rapport A⁻/AH de 1 à 10 puis à 0,1. Que devient le pouvoir tampon ?</li>
        <li>Tampon : ajoutez 5 mmol d’acide fort à un tampon à 5 mmol d’AH et 5 mmol d’A⁻. Que se passe-t-il ? Pourquoi dit-on que la capacité du tampon est limitée ?</li>
        <li>Titrage : comparez l’acide chlorhydrique et l’acide éthanoïque à la même concentration. Le saut de pH est-il le même ? Quels indicateurs conviennent à chaque cas ?</li>
        <li>Titrage : titrez l’acide benzoïque. Quel indicateur choisir ? Pourquoi le bleu de bromothymol ne convient-il pas ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>pH = pKa + log([A⁻]/[AH]) ; acide prédominant si pH &lt; pKa, base prédominante si pH &gt; pKa</li>
        <li>solution tampon : pH = pKa ± 1, AH et A⁻ en quantités comparables</li>
        <li>titrage : C<sub>a</sub>V₀ = C<sub>b</sub>V<sub>eq</sub> ; à V<sub>eq</sub>/2, pH = pKa</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ab-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ab-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ab-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .ab-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); }
        .ab-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .ab-l1.cote .ab-carte { order: 2; } .ab-l1.cote .ab-main { order: 1; } }
        @media (max-width: 900px) { .ab-l1.cote, .ab-pri { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Acides et bases</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Le <strong>pH</strong> mesure l’acidité d’une solution. Un acide <strong>fort</strong> réagit totalement avec l’eau, un acide <strong>faible</strong> partiellement : son pKa dit quelle forme, acide ou basique, <strong>prédomine</strong> à un pH donné. On en tire les solutions <strong>tampons</strong> et le <strong>titrage</strong> pH-métrique.</div>
      <div className={`ab-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {enGuide ? <div className="ab-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="ab-carte">{panneauHypo}</div> : null}
        <div className="ab-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'pka' ? suiviPka : defi.type === 'conc' ? suiviConc : suiviTampon}/></div>}
          <div className={`ab-pri${mode !== 'explore' ? ' pile' : ''}`}>
            {sceneBox}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{reglages}{mesures}{incertBox}</div>
          </div>
        </div>
      </div>
      {!enDefi && <div className="ab-l2">{panneauHypo}</div>}
      {mode === 'explore' && <div className="ab-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
