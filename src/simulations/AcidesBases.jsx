import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, FormuleEnLigne, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { SchemaBurette } from "./titrageCommun";
import { Pic } from "../Pictos";
import { FICHES } from "./AcidesBasesFiches";
import * as M from "./acidesBasesModele";

const ID_AB = { acide: 147, distrib: 148, tampon: 149, titrage: 85 };
const DEFIS_PART = { acide: ['tau', 'nature'], distrib: ['rapport', 'espece'], tampon: ['tampon', 'ajout'], titrage: ['pka', 'conc'] };
declarerDefis(147, [['tau', 'Calculer le taux d’avancement d’un acide'], ['nature', 'Dire si un acide est fort ou faible']]);
declarerDefis(148, [['rapport', 'Calculer le rapport des deux formes à un pH donné'], ['espece', 'Trouver l’espèce prédominante']]);
declarerDefis(149, [['tampon', 'Préparer une solution tampon de pH donné'], ['ajout', 'Prévoir le pH après un ajout']]);
declarerDefis(85, [['pka', 'Quel est le pKa de l’acide inconnu ?'], ['conc', 'Quelle est la concentration de la solution d’acide ?']]);

// ====================================================
//  SIMS 147, 148, 149 et 85 — ACIDES ET BASES (TSTL, SPCL, Chimie et développement durable : Composition des systèmes chimiques)
//  Une seule base de code, quatre simulations (l'ancienne simulation 85, de 30 étapes, a été découpée le 19/11/2026) :
//    147 pH d'un acide (acide fort / faible, taux d'avancement, dilution) ; 148 pH, pKa et prédominance (diagrammes de distribution) ;
//    149 solution tampon ; 85 titrage pH-métrique et choix d'un indicateur.
//  Notations : pKa du couple AH/A⁻ ; pH = −log[H₃O⁺] ; Ka = [A⁻][H₃O⁺]/[AH] ; Qr,éq = K.
// ====================================================
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const sci = (x, d = 1) => { if (!isFinite(x) || x === 0) return '0'; const e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e; return `${nbf(m, d)}${NB}×${NB}10${String(e).replace('-', '⁻').replace(/\d/g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c])}`; };
const tire = t => t[Math.floor(Math.random() * t.length)];
const pile = () => Math.random() < 0.5;
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
const COUL_ESP = ['#0b4f94', '#b45309', '#0e7490', '#6d28d9'];
const POUR_DEFI = [3.75, 4.2, 4.8, 4.9];                            // pKa possibles de l'acide inconnu
const ID_PAR_PKA = { 3.75: 'form', 4.2: 'benz', 4.8: 'etha', 4.9: 'prop' };

const VMAX = 25;                                                    // volume de la burette (mL)
const U_CB = 0.005, U_V0 = 0.03, U_VEQ = 0.1;                       // demi-étendues : Cb ± 0,5 %, prise d'essai (pipette) ± 0,03 mL, repérage de Veq ± 0,1 mL
const R3 = Math.sqrt(3);

const PRESET_TI = { id: 'etha', C0: 0.050, V0: 20, Cb: 0.100, Vb: 0, ind: null, deriv: false };
const PRESET_TP = { nAH: 10, nA: 10, V: 100, ajout: 0 };
const TP_DEPART = { nAH: 5, nA: 15, V: 100, ajout: 0 };
const PRESET_AC = { id: 'hcl', logC: -2 };
const PRESET_DS = { id: 'etha', ph: 3 };
const FAIBLES = ['form', 'benz', 'etha', 'prop'];
const phSol = (id, lc) => { const a = ACIDES[id]; return M.pH({ C: a.fort ? 0 : 10 ** lc, pKas: a.pKas, ca: a.fort ? 10 ** lc : 0 }); };
const arr2 = v => Math.round(v * 100) / 100;
const idxDefi = d => { const fr = M.fractions(M.concH(d.ph), POLY[d.polyId].pKas); return fr.indexOf(Math.max(...fr)); };

// Liste déroulante étiquetée (réglage à choix multiples)
function Liste({ nom, valeur, onChange, options }) {
  return (
    <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, fontWeight: 700, marginBottom: 8 }}>{nom}
      <select value={valeur} onChange={e => onChange(e.target.value)} aria-label={nom}
        style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 8px', fontSize: 14, borderRadius: 8, border: `1.5px solid ${KIT.bord}`, background: 'white', color: KIT.txt }}>
        {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </label>);
}

export const SimulationAcidesBases = () => <SimulationBase partie="titrage"/>;
export const SimulationPhAcide = () => <SimulationBase partie="acide"/>;
export const SimulationPredominancePka = () => <SimulationBase partie="distrib"/>;
export const SimulationTamponCdd = () => <SimulationBase partie="tampon"/>;

// Étape dès laquelle apparaissent les réglages (GR) et les mesures (GM) dans le parcours guidé de chaque partie
const GR = { acide: 'faible', distrib: 'pkaegal', tampon: 'tampon', titrage: 'equiv' };
const GM = { acide: 'faible', distrib: 'egalite', tampon: 'ajout', titrage: 'equiv' };
const TITRES = { acide: 'Acides et bases : le pH d’un acide', distrib: 'Acides et bases : pH, pKa et prédominance', tampon: 'Acides et bases : la solution tampon', titrage: 'Acides et bases : le titrage pH-métrique' };
const INTROS = {
  acide: <>Le <strong>pH</strong> mesure l’acidité d’une solution. Un acide <strong>fort</strong> réagit totalement avec l’eau, un acide <strong>faible</strong> partiellement : le <strong>taux d’avancement</strong> τ dit quelle fraction de l’acide a réagi.</>,
  distrib: <>Le <strong>pKa</strong> d’un couple acide/base dit quelle forme, acide ou basique, <strong>prédomine</strong> à un pH donné. Le <strong>diagramme de distribution</strong> montre la fraction de chaque espèce en fonction du pH.</>,
  tampon: <>Une <strong>solution tampon</strong> contient un acide faible et sa base conjuguée en quantités comparables : son pH varie très peu quand on y ajoute un peu d’acide ou de base.</>,
  titrage: <>Le <strong>titrage pH-métrique</strong> d’un acide par la soude permet de trouver sa concentration (à l’équivalence) et son pKa (à la demi-équivalence) ; un <strong>indicateur coloré</strong> peut repérer l’équivalence.</>,
};
const LIB_DEFI = { tau: 'Taux d’avancement', nature: 'Acide fort ou faible ?', rapport: 'Rapport des deux formes', espece: 'Espèce prédominante', tampon: 'Préparer un tampon', ajout: 'pH après un ajout', pka: 'pKa d’un acide inconnu', conc: 'Concentration d’un acide' };

function SimulationBase({ partie }) {
  const SIM_ID = ID_AB[partie], CLE = `ab-${partie}-guide-v1`, [D1, D2] = DEFIS_PART[partie];
  const [mode, setMode] = useState(() => modeOuverture(CLE));
  useSignalerMode(mode);
  const [suivi1, noter1] = useCompteurDefi(), [suivi2, noter2] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [typeDefi, setTypeDefi] = useState(D1);
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ac, setAc] = useState(PRESET_AC);
  const [ds, setDs] = useState(PRESET_DS);
  const [tp, setTp] = useState(partie === 'tampon' ? TP_DEPART : PRESET_TP);
  const [ti, setTi] = useState(PRESET_TI);
  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const dd = enDefi && defi ? defi : null;
  // en défi, les données tirées au sort remplacent les réglages
  const acEff = dd && partie === 'acide' ? { id: dd.acId, logC: dd.logC } : ac;
  const dsEff = dd && partie === 'distrib' ? { id: dd.polyId || 'etha', ph: dd.ph } : ds;

  // ---------- grandeurs effectives ----------
  const Ti = dd && partie === 'titrage' ? { ...ti, id: dd.id, C0: dd.C0, V0: 20, Cb: 0.100 } : ti;
  const acT = ACIDES[Ti.id];
  const pT = { C0: Ti.C0, V0: Ti.V0 * 1e-3, pKas: acT.pKas, Cb: Ti.Cb };
  const Veq = M.volumeEquivalent(Ti.C0, Ti.V0 * 1e-3, Ti.Cb) * 1e3;                // mL
  const phTi = M.pHTitrage({ ...pT, Vb: Ti.Vb * 1e-3 });
  const pasD = 0.1;
  const derTi = (M.pHTitrage({ ...pT, Vb: (Ti.Vb + pasD) * 1e-3 }) - M.pHTitrage({ ...pT, Vb: Math.max(0, Ti.Vb - pasD) * 1e-3 })) / ((Ti.Vb + pasD) - Math.max(0, Ti.Vb - pasD));
  const { id: tId, C0: tC0, V0: tV0, Cb: tCb } = Ti;
  const ptsTi = M.courbeTitrage({ C0: tC0, V0: tV0 * 1e-3, pKas: ACIDES[tId].pKas, Cb: tCb, Vb: 0 }, VMAX * 1e-3, 500).map(p => ({ V: p.V * 1e3, pH: p.pH, d: p.d * 1e-3 }));   // d en unités de pH par mL
  const equivDer = M.equivalenceDerivee(ptsTi.map(p => ({ V: p.V, pH: p.pH, d: p.d })));
  const pKaT = acT.pKas[0];
  const phDemi = M.pHTitrage({ ...pT, Vb: Veq / 2 * 1e-3 });

  // solution étudiée dans la partie « pH d'un acide »
  const A = ACIDES[acEff.id], C = 10 ** acEff.logC;
  const phA = M.pH({ C: A.fort ? 0 : C, pKas: A.pKas, ca: A.fort ? C : 0 }), hA = M.concH(phA);
  const fracA = A.fort ? [0, 1] : M.fractions(hA, A.pKas);
  const tauA = A.fort ? 1 : fracA[1];
  const phApprox = A.fort ? M.pHAcideFortApprox(C) : M.pHAcideFaibleApprox(C, A.pKas[0]);
  // tampon
  const nAHm = tp.nAH * 1e-3, nAm = tp.nA * 1e-3, Vtp = tp.V * 1e-3, ajm = tp.ajout * 1e-3, pKaTp = dd && partie === 'tampon' ? dd.pKa : 4.8;
  const phTp0 = M.pHTampon({ nAH: nAHm, nA: nAm, V: Vtp, pKa: pKaTp }), phTp = M.pHTampon({ nAH: nAHm, nA: nAm, V: Vtp, pKa: pKaTp, nAjout: ajm });
  const phEau = M.pH({ cb: Math.max(0, ajm) / Vtp, ca: Math.max(0, -ajm) / Vtp });
  const betaTp = M.pouvoirTampon({ nAH: nAHm, nA: nAm, V: Vtp, pKa: pKaTp });
  // distribution
  const P = POLY[dsEff.id], frD = M.fractions(M.concH(dsEff.ph), P.pKas);
  const idxMax = frD.indexOf(Math.max(...frD));

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const tiBase = partie === 'titrage' && ti.id === 'etha' && ti.C0 === 0.05 && ti.V0 === 20 && ti.Cb === 0.1;
  const tpBase = partie === 'tampon' && tp.nAH === 10 && tp.nA === 10 && tp.V === 100;
  const acEth = partie === 'acide' && ac.id === 'etha' && ac.logC === -2;
  const phAjout1 = M.pHTampon({ nAH: 0.01, nA: 0.01, V: 0.1, pKa: 4.8, nAjout: -1e-3 });
  const dTamp = phAjout1 - 4.8, dEau = M.pH({ ca: 1e-3 / 0.1 }) - 7;
  const tau0 = M.tauAcide(1e-2, 4.8);
  const idPh = (ph0, d = 0.06) => partie === 'distrib' && Math.abs(ds.ph - ph0) < d;
  const PHEQ = M.phEquivalence({ C0: 0.05, V0: 0.02, pKas: [4.8], Cb: 0.1 }), SAUT = M.sautPH({ C0: 0.05, V0: 0.02, pKas: [4.8], Cb: 0.1 });
  const ETAPES_ACIDE = [
    { id: 'ph', titre: 'Le pH d’une solution', focus: ['scene'],
      texte: <>Le <strong>pH</strong> d’une solution aqueuse se définit par pH = −log [H₃O⁺] (concentration en mol·L⁻¹) : il se lit sur une échelle de 0 (très acide) à 14 (très basique). Nous étudierons une solution d’acide chlorhydrique de concentration <em>C</em> = 1,0 × 10⁻² mol·L⁻¹.</>,
      tache: { type: 'qcm', indice: 'Appliquez pH = −log [H₃O⁺] : 1,0 × 10⁻³ = 10⁻³, et log(10⁻³) = −3.', q: 'Si [H₃O⁺] = 1,0 × 10⁻³ mol·L⁻¹, le pH vaut…', options: ['3,0', '−3,0', '0,001'], bonne: 0,
        expl: 'pH = −log(1,0 × 10⁻³) = 3,0. Plus la solution est acide, plus [H₃O⁺] est grande et plus le pH est petit.' } },
    { id: 'phfort', titre: 'Un acide fort', focus: ['scene'],
      texte: <>L’acide chlorhydrique HCl réagit <strong>totalement</strong> avec l’eau : HCl + H₂O → H₃O⁺ + Cl⁻. Calculez le pH de la solution de HCl de concentration <em>C</em> = 1,0 × 10⁻² mol·L⁻¹.</>,
      tache: { type: 'num', indice: 'Un acide fort réagit totalement : [H₃O⁺] = C. Il ne reste plus qu’à calculer −log C.', q: 'pH de la solution d’acide chlorhydrique', unite: '', vrai: M.pH({ ca: 1e-2 }), tol: 0.02, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['[H₃O⁺] = C = 1,0 × 10⁻² mol·L⁻¹.', 'pH = −log(1,0 × 10⁻²) = 2,0.'], pieges: [[-2, 'Le pH est −log [H₃O⁺], pas log [H₃O⁺] : il est positif ici.']],
        expl: 'pH = 2,0. Pour un acide fort, le pH se déduit directement de la concentration apportée.' } },
    { id: 'faible', titre: 'Un acide faible', focus: ['scene', 'reglages'],
      retenirTitre: 'À RETENIR : LE PH D’UN ACIDE FORT', retenir: FICHES.acideFort,
      texte: <>Prenons la même concentration, <em>C</em> = 1,0 × 10⁻² mol·L⁻¹, mais avec l’<strong>acide éthanoïque</strong> CH₃COOH (pKa = 4,8) : sa réaction avec l’eau est <em>limitée</em> : CH₃COOH + H₂O ⇌ CH₃COO⁻ + H₃O⁺. Le <strong>tableau d’avancement</strong> sous le schéma la décrit : AH + H₂O ⇌ A⁻ + H₃O⁺.</>,
      tache: { type: 'action', ok: acEth, label: 'Choisir l’acide éthanoïque à 10⁻² mol/L', faire: () => setAc({ id: 'etha', logC: -2 }), consigne: 'Choisissez « acide éthanoïque » et réglez log C = −2' } },
    { id: 'tabacide', titre: 'Lire le tableau d’avancement', focus: ['scene'],
      texte: <>Dans le tableau, la ligne <em>x</em><sub>max</sub> est ce qui se passerait si <strong>tout</strong> l’acide AH réagissait ; la ligne <em>x</em><sub>f</sub> est l’état final réellement atteint. Comparez-les pour l’acide éthanoïque à 1,0 × 10⁻² mol·L⁻¹.</>,
      tache: { type: 'qcm', q: 'Pour l’acide éthanoïque, l’avancement final x_f est…', indice: 'Comparez les deux dernières lignes du tableau : la quantité de AH restant est-elle nulle ou non ? Si AH n’a pas disparu, la réaction n’est pas allée jusqu’à x_max.', options: ['inférieur à x_max : il reste de l’acide AH', 'égal à x_max : tout l’acide a réagi', 'supérieur à x_max'], bonne: 0,
        bloque: acEth ? null : 'Choisissez d’abord l’acide éthanoïque à 10⁻² mol/L.',
        expl: 'Pour un acide faible, la réaction avec l’eau est limitée : x_f < x_max, il reste de AH en solution, à côté de A⁻ et H₃O⁺. Pour un acide fort, on aurait x_f = x_max.' } },
    { id: 'tau', titre: 'Le taux d’avancement', focus: ['scene', 'mesures'],
      retenirTitre: 'À RETENIR : LE PH D’UN ACIDE FAIBLE', retenir: FICHES.acideFaible,
      texte: <>Le <strong>taux d’avancement final</strong> est la fraction d’acide qui a réagi : τ = <FormuleEnLigne><mfrac><msub><mi>x</mi><mi>f</mi></msub><msub><mi>x</mi><mi>max</mi></msub></mfrac></FormuleEnLigne>. Lisez <em>x</em><sub>f</sub> et <em>x</em><sub>max</sub> dans le tableau d’avancement (acide éthanoïque, <em>C</em> = 1,0 × 10⁻² mol·L⁻¹ pour 1,00 L), puis calculez τ.</>,
      tache: { type: 'num', indice: 'Dans le tableau, repérez x_f (dernière ligne) et x_max (ligne d’avant) : τ = frac(x_f|x_max). Pensez à convertir en pourcentage.', q: 'Taux d’avancement τ de l’acide éthanoïque', unite: '%', vrai: tau0 * 100, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        bloque: acEth ? null : 'Choisissez d’abord l’acide éthanoïque à 10⁻² mol/L.',
        calcul: () => [`Dans le tableau : x_f = ${sci(1e-2 * tau0, 2)} mol et x_max = 1,0 × 10⁻² mol.`, `τ = frac(x_f|x_max) = ${nbf(tau0 * 100, 1)} %.`],
        pieges: [[tau0, 'Le taux d’avancement est demandé en pourcentage.']],
        expl: `τ ≈ ${nbf(tau0 * 100, 1)} % : seule une petite fraction des molécules d’acide a réagi avec l’eau. Pour un acide fort, τ = 100 %.` } },
    { id: 'dilution', titre: 'Diluer l’acide', focus: ['reglages', 'mesures'],
      texte: <>Diluez la solution d’acide éthanoïque jusqu’à <em>C</em> = 1,0 × 10⁻⁴ mol·L⁻¹ (log C = −4) et observez le taux d’avancement dans « Mesures ».</>,
      tache: { type: 'action', ok: partie === 'acide' && ac.id === 'etha' && ac.logC === -4, label: 'Diluer à 10⁻⁴ mol/L', faire: () => setAc({ id: 'etha', logC: -4 }), consigne: 'Réglez log C = −4 pour l’acide éthanoïque' } },
    { id: 'dilcons', titre: 'Effet de la dilution', focus: ['mesures'],
      texte: <>À 1,0 × 10⁻² mol·L⁻¹, le taux d’avancement valait τ = {nbf(tau0 * 100, 1)} %. Comparez-le à celui qui s’affiche maintenant à 1,0 × 10⁻⁴ mol·L⁻¹.</>,
      tache: { type: 'qcm', indice: 'Comparez, dans le tableau, la valeur de x_f par rapport à x_max à 10⁻² puis à 10⁻⁴ mol·L⁻¹.', q: 'Quand on dilue un acide faible, son taux d’avancement final…', options: ['augmente', 'diminue', 'ne change pas'], bonne: 0,
        expl: 'Plus la solution est diluée, plus une grande fraction de l’acide réagit : τ augmente (il tend vers 100 % aux très faibles concentrations). Le pH, lui, augmente quand même, car [H₃O⁺] diminue.' } },
    { id: 'bilanA', titre: 'Bilan : le pH d’un acide', focus: [],
      retenirTitre: 'À RETENIR : DILUTION ET TAUX D’AVANCEMENT', retenir: FICHES.dilution,
      texte: <>Pour un acide fort, [H₃O⁺] = <em>C</em> et pH = −log <em>C</em>. Pour un acide faible, la réaction avec l’eau est limitée (τ &lt; 100 %), mais τ augmente quand on dilue. Vous pouvez maintenant explorer librement ou passer aux défis.</>, tache: null },
  ];
  const ETAPES_DISTRIB = [
    { id: 'pkaegal', titre: 'Le diagramme de distribution', focus: ['scene', 'reglages'],
      texte: <>Le <strong>diagramme de distribution</strong> donne, en fonction du pH, la fraction de chaque forme d’un couple acide/base : l’acide AH (courbe bleue) et sa base conjuguée A⁻ (courbe orange). Choisissez l’acide éthanoïque (pKa = 4,8) et placez le pH sur la valeur du pKa, soit pH = 4,8.</>,
      tache: { type: 'action', ok: ds.id === 'etha' && idPh(4.8), label: 'Placer pH = 4,8', faire: () => setDs({ id: 'etha', ph: 4.8 }), consigne: 'Réglez le curseur de pH sur 4,8 (acide éthanoïque)' } },
    { id: 'egalite', titre: 'Quand pH = pKa', focus: ['scene', 'mesures'],
      texte: <>Les deux courbes se croisent exactement à pH = pKa = 4,8. Observez les fractions de AH et de A⁻ dans « Mesures ».</>,
      tache: { type: 'qcm', indice: 'Partez de pH = pKa + log frac([A⁻]|[AH]) et posez pH = pKa : que vaut alors le logarithme ?', q: 'À pH = pKa, on a…', options: ['[AH] = [A⁻]', '[AH] = 0', '[A⁻] = 10 [AH]'], bonne: 0,
        bloque: ds.id === 'etha' && idPh(4.8) ? null : 'Placez d’abord le pH sur 4,8 (étape précédente).',
        expl: 'De Ka = frac([A⁻][H₃O⁺]|[AH]), on tire pH = pKa + log frac([A⁻]|[AH]). Si pH = pKa, le logarithme est nul : les deux formes sont en concentrations égales.' } },
    { id: 'predom', titre: 'Domaines de prédominance', focus: ['scene', 'reglages'],
      retenirTitre: 'À RETENIR : pH = pKa', retenir: FICHES.balance,
      texte: <>Placez maintenant le curseur de pH sur 6,5, c’est-à-dire plus d’une unité au-dessus du pKa = 4,8 du couple CH₃COOH / CH₃COO⁻.</>,
      tache: { type: 'qcm', indice: 'Comparez pH = 6,5 au pKa = 4,8 : le pH est-il inférieur ou supérieur ? Rappel : acide si pH < pKa, base si pH > pKa.', q: 'À pH = 6,5, quelle espèce prédomine pour le couple CH₃COOH / CH₃COO⁻ (pKa = 4,8) ?', options: ['CH₃COO⁻ (la base)', 'CH₃COOH (l’acide)', 'aucune : elles sont à égalité'], bonne: 0,
        bloque: ds.id === 'etha' && idPh(6.5) ? null : 'Placez d’abord le pH sur 6,5.',
        expl: 'Pour pH > pKa, la base prédomine ; pour pH < pKa, c’est l’acide. À pH = 6,5, la base est largement majoritaire.' } },
    { id: 'rapport', titre: 'Le rapport des deux formes', focus: ['reglages', 'mesures'],
      retenirTitre: 'À RETENIR : DOMAINES DE PRÉDOMINANCE', retenir: FICHES.domaines,
      texte: <>Placez le pH sur 5,5 (le pKa vaut toujours 4,8). Le rapport des concentrations se calcule par <FormuleEnLigne><mfrac><mrow><mo>[</mo><msup><mi>A</mi><mo>−</mo></msup><mo>]</mo></mrow><mrow><mo>[</mo><mi>AH</mi><mo>]</mo></mrow></mfrac><mo>=</mo><msup><mn>10</mn><mrow><mi>pH</mi><mo>−</mo><msub><mi>pK</mi><mi>a</mi></msub></mrow></msup></FormuleEnLigne>.</>,
      tache: { type: 'num', indice: 'Calculez pH − pKa = 5,5 − 4,8, puis la puissance de 10 correspondante (touche 10ˣ de la calculatrice).', q: 'Rapport frac([A⁻]|[AH]) à pH = 5,5', unite: '', vrai: 10 ** 0.7, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        bloque: ds.id === 'etha' && idPh(5.5) ? null : 'Placez d’abord le pH sur 5,5.',
        calcul: () => ['pH − pKa = 5,5 − 4,8 = 0,7.', 'frac([A⁻]|[AH]) = 10^(0,7) ≈ 5,0.'], pieges: [[0.7, 'Vous avez donné le logarithme du rapport : il faut élever 10 à cette puissance.'], [1 / 10 ** 0.7, 'Vous avez inversé le rapport : au-dessus du pKa, la base A⁻ est la plus abondante.']],
        expl: 'À pH = 5,5, la base est environ 5 fois plus abondante que l’acide : [A⁻] ≈ 5,0 [AH].' } },
    { id: 'citrique', titre: 'Un polyacide', focus: ['scene', 'reglages'],
      texte: <>L’acide citrique H₃A possède <strong>trois acidités</strong> : pKa₁ = 3,1 ; pKa₂ = 4,8 ; pKa₃ = 6,4. Choisissez-le et placez le pH à 4,0.</>,
      tache: { type: 'action', ok: ds.id === 'cit' && idPh(4), label: 'Acide citrique, pH = 4,0', faire: () => setDs({ id: 'cit', ph: 4 }), consigne: 'Choisissez « acide citrique » et réglez pH = 4,0' } },
    { id: 'citpredom', titre: 'Espèce prédominante', focus: ['mesures'],
      texte: <>Repérez dans quel intervalle de pKa se trouve pH = 4,0 (pKa₁ = 3,1 ; pKa₂ = 4,8 ; pKa₃ = 6,4).</>,
      tache: { type: 'qcm', indice: 'Placez pH = 4,0 sur l’échelle des pKa (3,1 ; 4,8 ; 6,4) : entre quels deux pKa se trouve-t-il ?', q: 'À pH = 4,0, quelle espèce de l’acide citrique prédomine ?', options: ['H₂A⁻', 'H₃A', 'HA²⁻'], bonne: 0,
        bloque: ds.id === 'cit' && idPh(4) ? null : 'Choisissez d’abord l’acide citrique et placez le pH à 4,0.',
        expl: 'On a pKa₁ = 3,1 < pH = 4,0 < pKa₂ = 4,8 : H₃A a cédé un proton (pH > pKa₁) mais H₂A⁻ n’en a pas encore cédé un second (pH < pKa₂). H₂A⁻ prédomine.' } },
    { id: 'bilanD', titre: 'Bilan : pH, pKa et prédominance', focus: [],
      retenirTitre: 'À RETENIR : LES POLYACIDES', retenir: FICHES.polyacide,
      texte: <>À pH = pKa, les deux formes sont à égalité ; pour pH &lt; pKa l’acide domine, pour pH &gt; pKa la base domine. Un polyacide a un pKa par proton cédé : une seule espèce prédomine entre deux pKa consécutifs. Vous pouvez maintenant explorer ou passer aux défis.</>, tache: null },
  ];
  const ETAPES_TAMPON = [
    { id: 'tampon', titre: 'Une solution tampon', focus: ['scene', 'reglages'],
      texte: <>Une <strong>solution tampon</strong> contient l’acide <em>et</em> sa base conjuguée en quantités comparables. Préparez 100{NB}mL de solution contenant 10{NB}mmol d’acide éthanoïque (pKa = 4,8) et 10{NB}mmol d’ion éthanoate.</>,
      tache: { type: 'action', ok: tpBase && tp.ajout === 0, label: 'Préparer le tampon équimolaire', faire: () => setTp(PRESET_TP), consigne: 'Réglez 10 mmol d’acide, 10 mmol de base, V = 100 mL, sans ajout' } },
    { id: 'phtampon', titre: 'Le pH du tampon', focus: ['scene'],
      texte: <>Avec [A⁻] = [AH] (10{NB}mmol de chaque dans 100{NB}mL), la relation pH = pKa + log frac([A⁻]|[AH]) donne directement le pH de la solution. Calculez-le.</>,
      tache: { type: 'num', indice: 'Il y a autant d’acide que de base : le rapport frac([A⁻]|[AH]) vaut 1. Que vaut alors log(1) ?', q: 'pH du tampon équimolaire', unite: '', vrai: 4.8, tol: 0.01, affiche: v => nbf(v, 1), cs: 2,
        bloque: tpBase && tp.ajout === 0 ? null : 'Préparez d’abord le tampon équimolaire (étape précédente).',
        calcul: () => ['frac([A⁻]|[AH]) = frac(10|10) = 1, donc log(1) = 0.', 'pH = pKa + 0 = 4,8.'], pieges: [[9.6, 'Ne doublez pas le pKa : pH = pKa + log frac([A⁻]|[AH]).']],
        expl: 'pH = pKa = 4,8 : un tampon équimolaire a un pH égal au pKa de son couple.' } },
    { id: 'ajout', titre: 'Ajouter de l’acide fort', focus: ['reglages', 'mesures'],
      retenirTitre: 'À RETENIR : LE TAMPON ÉQUIMOLAIRE', retenir: FICHES.equimolaire,
      texte: <>Ajoutez maintenant 1,0{NB}mmol d’acide fort (curseur « Ajout » sur −1,0{NB}mmol). Comparez avec ce qui se passe dans 100{NB}mL d’eau pure.</>,
      tache: { type: 'action', ok: tpBase && Math.abs(tp.ajout + 1) < 0.05, label: 'Ajouter 1,0 mmol d’acide', faire: () => setTp({ ...PRESET_TP, ajout: -1 }), consigne: 'Réglez l’ajout à −1,0 mmol (acide fort)' } },
    { id: 'delta', titre: 'La variation de pH', focus: ['mesures'],
      texte: <>Avant l’ajout, le pH du tampon était 4,80. Après l’ajout de 1,0{NB}mmol d’acide fort, il a une nouvelle valeur ; l’eau pure, elle, passe de 7 à une valeur très différente. Calculez la variation de pH du tampon.</>,
      tache: { type: 'num', indice: 'Lisez le pH du tampon après l’ajout et retranchez 4,80 : la variation est la différence des deux (en valeur absolue).', q: 'Variation de pH du tampon (valeur absolue)', unite: '', vrai: Math.abs(dTamp), tol: 0.1, affiche: v => nbf(v, 2), cs: 1,
        bloque: tpBase && Math.abs(tp.ajout + 1) < 0.05 ? null : 'Ajoutez d’abord 1,0 mmol d’acide fort au tampon.',
        calcul: () => [`Après l’ajout : pH = ${nbf(phAjout1, 2)}.`, `ΔpH = ${nbf(phAjout1, 2)} − 4,80 = ${nbf(dTamp, 2)}, soit ${nbf(Math.abs(dTamp), 2)} en valeur absolue.`],
        expl: `Le pH ne varie que de ${nbf(Math.abs(dTamp), 2)} unité, alors que dans l’eau pure il chute de ${nbf(Math.abs(dEau), 0)} unités.` } },
    { id: 'pourquoi', titre: 'Pourquoi ça résiste ?', focus: ['mesures'],
      texte: <>Le pH du tampon n’a varié que de {nbf(Math.abs(dTamp), 2)} unité. Cherchez quelle espèce a consommé les ions H₃O⁺ ajoutés.</>,
      tache: { type: 'qcm', indice: 'Quelle espèce du tampon peut consommer les ions H₃O⁺ ajoutés ? Pensez à la base A⁻ qui réagit avec eux.', q: 'Pourquoi le pH varie-t-il si peu ?', options: ['les ions H₃O⁺ ajoutés sont consommés par CH₃COO⁻ (A⁻ + H₃O⁺ → AH + H₂O), et le rapport frac([A⁻]|[AH]) ne change que peu', 'l’acide ajouté ne se dissocie pas', 'l’eau neutralise l’acide ajouté'], bonne: 0,
        expl: 'La base A⁻ consomme les H₃O⁺ ajoutés (et l’acide AH consomme les HO⁻ ajoutés). Comme A⁻ et AH sont abondants, leur rapport, donc le pH, varie peu.' } },
    { id: 'zone', titre: 'Où un tampon est-il efficace ?', focus: ['mesures'],
      retenirTitre: 'À RETENIR : COMMENT UN TAMPON RÉSISTE', retenir: FICHES.reserve,
      texte: <>Faites varier les quantités (essayez 1 mmol d’acide pour 19 mmol de base) et regardez le « pouvoir tampon » ainsi que le rapport frac([A⁻]|[AH]).</>,
      tache: { type: 'qcm', indice: 'Rappel : le pouvoir tampon est maximal quand [AH] = [A⁻], c’est-à-dire pH = pKa.', q: 'Un tampon est efficace lorsque le pH est…', options: ['dans l’intervalle pKa ± 1', 'toujours compris entre 6 et 8', 'très supérieur au pKa'], bonne: 0,
        expl: 'La résistance aux ajouts est maximale quand [AH] = [A⁻] (pH = pKa) et reste correcte tant que 0,1 < frac([A⁻]|[AH]) < 10, c’est-à-dire pour pH compris entre pKa − 1 et pKa + 1.' } },
    { id: 'bilanT', titre: 'Bilan : la solution tampon', focus: [],
      retenirTitre: 'À RETENIR : ZONE D’EFFICACITÉ', retenir: FICHES.zoneTampon,
      texte: <>Un tampon contient l’acide et sa base conjuguée en quantités comparables ; son pH est proche du pKa de son couple (pKa ± 1) et il limite les variations de pH tant qu’une des deux réserves n’est pas épuisée. Vous pouvez maintenant explorer ou passer aux défis.</>, tache: null },
  ];
  const ETAPES_TITRAGE = [
    { id: 'titrage', titre: 'Titrer un acide', focus: ['scene'],
      texte: <>On dose 20,0{NB}mL d’une solution d’acide éthanoïque de concentration inconnue par de la soude à 0,100{NB}mol·L⁻¹, versée à la burette. La courbe ci-dessous donne le pH en fonction du volume de soude versé.</>,
      tache: { type: 'qcm', indice: 'Pensez à la réaction de titrage HO⁻ + AH → H₂O + A⁻ : à l’équivalence, les réactifs sont dans les proportions stœchiométriques.', q: 'À l’équivalence, on a introduit…', options: ['autant de matière de soude que d’acide au départ', 'le même volume de soude que de solution d’acide', 'une quantité de soude égale à la moitié de celle de l’acide'], bonne: 0,
        expl: 'À l’équivalence, n(HO⁻ versé) = n(acide initial) : c’est la quantité de matière qui compte, pas le volume (ici les concentrations des deux solutions sont différentes).' } },
    { id: 'equiv', titre: 'L’équivalence', focus: ['scene', 'reglages', 'mesures'],
      texte: <>On repère l’équivalence au <strong>saut de pH</strong>, c’est-à-dire au maximum de la dérivée dpH/dV. Affichez la dérivée et déplacez le curseur de volume jusqu’à ce maximum : lisez le volume équivalent <em>V</em><sub>eq</sub>.</>,
      tache: { type: 'num', indice: 'À l’équivalence, le pH varie très brusquement : cherchez le saut de pH, ou le maximum de la courbe dérivée.', q: 'Volume équivalent Veq', unite: 'mL', vrai: Veq, tol: 0.03, affiche: v => nbf(v, 1), cs: 3,
        bloque: tiBase ? null : 'Les réglages du titrage ont été modifiés : rouvrez la simulation pour la rétablir.',
        calcul: () => ['Le maximum de dpH/dV se situe à V ≈ 10,0 mL.', 'Veq = 10,0 mL.'], pieges: [[Veq / 2, 'C’est le volume de la demi-équivalence, pas celui de l’équivalence.']],
        expl: 'Veq = 10,0 mL : le point où la courbe pH = f(V) a la pente la plus forte (maximum de la dérivée).' } },
    { id: 'pkalu', titre: 'Lire le pKa', focus: ['mesures'],
      retenirTitre: 'À RETENIR : L’ÉQUIVALENCE', retenir: FICHES.equivalence,
      texte: <>Le volume équivalent est <em>V</em><sub>eq</sub> = {nbf(Veq, 1)}{NB}mL. À la <strong>demi-équivalence</strong> (<em>V</em> = <em>V</em><sub>eq</sub>/2 = {nbf(Veq / 2, 1)}{NB}mL), la moitié de l’acide a été transformée en sa base conjuguée : [AH] = [A⁻]. Déplacez le curseur sur cette valeur et lisez le pH.</>,
      tache: { type: 'num', indice: 'À V = Veq/2 la moitié de l’acide a été transformée : [AH] = [A⁻], donc pH = pKa. Placez le curseur sur Veq/2.', q: 'pH à la demi-équivalence, donc pKa du couple', unite: '', vrai: pKaT, tol: 0.02, affiche: v => nbf(v, 1), cs: 2,
        bloque: tiBase ? null : 'Les réglages du titrage ont été modifiés : rouvrez la simulation pour la rétablir.',
        calcul: () => [`À V = Veq/2 = ${nbf(Veq / 2, 1)} mL, [AH] = [A⁻].`, `pH = pKa + log(1) = pKa ≈ ${nbf(phDemi, 1)}.`],
        expl: `On lit pH ≈ ${nbf(phDemi, 1)} : c’est le pKa du couple CH₃COOH / CH₃COO⁻ (4,8).` } },
    { id: 'basique', titre: 'Un pH basique à l’équivalence', focus: ['mesures'],
      texte: <>À l’équivalence, il ne reste plus d’acide : la solution contient l’ion éthanoate. Placez le curseur sur <em>V</em><sub>eq</sub> = {nbf(Veq, 1)}{NB}mL et lisez le pH : il est supérieur à 7.</>,
      tache: { type: 'qcm', indice: 'À l’équivalence, il ne reste que la base conjuguée A⁻ du couple : quel est le caractère acide ou basique de A⁻ en solution ?', q: 'Pourquoi le pH à l’équivalence est-il supérieur à 7 ?', options: ['l’ion éthanoate CH₃COO⁻ est une base faible qui réagit avec l’eau', 'il reste de la soude en excès', 'l’acide éthanoïque est une base'], bonne: 0,
        expl: 'Seule l’espèce CH₃COO⁻ (base faible) est présente à l’équivalence : CH₃COO⁻ + H₂O ⇌ CH₃COOH + HO⁻. La solution est donc basique, au contraire d’un titrage acide fort / base forte pour lequel pH = 7.' } },
    { id: 'indic', titre: 'Choisir un indicateur coloré', focus: ['reglages', 'scene'],
      retenirTitre: 'À RETENIR : LA COURBE DE TITRAGE', retenir: FICHES.courbe,
      texte: <>Sans pH-mètre, on repère l’équivalence par le changement de couleur d’un <strong>indicateur coloré</strong>. Il convient si sa zone de virage <strong>contient le pH à l’équivalence</strong> (ici pH<sub>éq</sub> ≈ {nbf(PHEQ, 1)} ; le saut de pH va d’environ pH {nbf(SAUT[0], 1)} à {nbf(SAUT[1], 1)} autour de l’équivalence). Choisissez celui qui convient (au lycée, le bleu de thymol remplace la phénolphtaléine, classée CMR : les deux conviennent ici).</>,
      tache: { type: 'action', ok: tiBase && (ti.ind === 'bth' || ti.ind === 'php'), label: 'Choisir le bleu de thymol', faire: () => setTi(t => ({ ...PRESET_TI, ind: 'bth', Vb: t.Vb })), consigne: 'Choisissez l’indicateur dont la zone de virage contient le pH à l’équivalence' } },
    { id: 'conc', titre: 'Calculer la concentration', focus: ['mesures'],
      retenirTitre: 'À RETENIR : CHOISIR UN INDICATEUR', retenir: FICHES.indicateur,
      texte: <>La relation à l’équivalence est <FormuleEnLigne><msub><mi>C</mi><mi>a</mi></msub><mo>×</mo><msub><mi>V</mi><mn>0</mn></msub><mo>=</mo><msub><mi>C</mi><mi>b</mi></msub><mo>×</mo><msub><mi>V</mi><mi>éq</mi></msub></FormuleEnLigne>. Exprimez <em>C</em><sub>a</sub> pour une prise d’essai <em>V</em><sub>0</sub> = 20,0{NB}mL, avec la soude à <em>C</em><sub>b</sub> = 0,100{NB}mol·L⁻¹ et le volume équivalent <em>V</em><sub>éq</sub> = {nbf(Veq, 1)}{NB}mL trouvé plus haut.</>,
      tache: { type: 'num', indice: 'Isolez Ca dans Ca × V0 = Cb × Véq : Ca = frac(Cb × Véq|V0).', q: 'Concentration Cₐ de la solution d’acide', unite: 'mol/L', vrai: 0.050, tol: 0.02, affiche: v => nbf(v, 3), cs: 3,
        bloque: tiBase ? null : 'Les réglages du titrage ont été modifiés : rouvrez la simulation pour la rétablir.',
        calcul: () => ['Cₐ = frac(C_b × V_éq|V₀) = frac(0,100 × 10,0|20,0).', 'Cₐ = 0,0500 mol·L⁻¹.'], pieges: [[0.1 * 20 / 10, 'Vous avez inversé Véq et V₀.']],
        expl: 'Cₐ = 5,00 × 10⁻² mol·L⁻¹ : c’est la concentration de la solution d’acide dosée.' } },
    { id: 'bilanR', titre: 'Bilan : le titrage', focus: [],
      texte: <>À l’équivalence, n(HO⁻ versé) = n(acide initial) ; à la demi-équivalence, pH = pKa ; l’indicateur coloré convient si sa zone de virage contient le pH à l’équivalence. Vous pouvez maintenant explorer librement ou passer aux défis.</>, tache: null },
  ];
  const ETAPES0 = partie === 'acide' ? ETAPES_ACIDE : partie === 'distrib' ? ETAPES_DISTRIB : partie === 'tampon' ? ETAPES_TAMPON : ETAPES_TITRAGE;
  // la bonne réponse des QCM est répartie entre les positions (pas toujours la première)
  const ETAPES = ETAPES0.map((e, i) => {
    if (e.tache?.type !== 'qcm') return e;
    const o = [...e.tache.options], bonne = o.splice(e.tache.bonne, 1)[0], pos = (i * 2 + 1) % (o.length + 1);
    o.splice(pos, 0, bonne);
    return { ...e, tache: { ...e.tache, options: o, bonne: pos } };
  });
  const IDS = ETAPES.map(e => e.id), apres = id => !enGuide || etape > IDS.indexOf(id);
  // Progressivité : en parcours guidé, un élément n'apparaît qu'à partir de l'étape qui l'introduit (puis reste affiché) ; ailleurs, tout est visible.
  const depuis = id => !enGuide || etape >= IDS.indexOf(id);
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  // ce qui est affiché en défi : on masque tout ce qui livrerait la réponse
  const sceneVisible = !(enDefi && (partie === 'acide' || (partie === 'distrib' && dd?.type === 'rapport') || (partie === 'tampon' && dd?.type === 'ajout')));
  const reglagesVisibles = !enDefi || partie === 'titrage' || (partie === 'tampon' && dd?.type === 'tampon');
  const mesuresVisibles = !enDefi || partie === 'titrage' || (partie === 'tampon' && dd?.type === 'tampon');

  // ════════════════ DÉFIS ════════════════
  function nouveauDefi(type) {
    const base = { type, reps: {}, verifie: false };
    if (type === 'tau') { const acId = tire(FAIBLES), logC = tire([-2, -3, -4]); setDefi({ ...base, acId, logC, phAff: arr2(phSol(acId, logC)) }); }
    else if (type === 'nature') { const fort = pile(), acId = fort ? 'hcl' : tire(FAIBLES), logC = tire([-2, -3]); setDefi({ ...base, acId, logC, fort, phAff: arr2(phSol(acId, logC)) }); }
    else if (type === 'rapport') { const pKa = tire(POUR_DEFI), dpH = tire([-1.5, -1, -0.5, 0.5, 1, 1.5]); setDefi({ ...base, pKa, acId: ID_PAR_PKA[pKa], ph: arr2(pKa + dpH) }); }
    else if (type === 'espece') {
      const polyId = tire(['cit', 'carb', 'phos']), ph = tire(Array.from({ length: 121 }, (_, i) => Math.round(10 + i) / 10).filter(v => POLY[polyId].pKas.every(p => Math.abs(v - p) >= 0.6)));
      setDefi({ ...base, polyId, ph });
    }
    else if (type === 'tampon') { const pKa = tire([4.2, 4.8, 6.4, 7.2]); setDefi({ ...base, pKa, cible: Math.round((pKa + tire([-0.8, -0.5, -0.3, 0.3, 0.5, 0.8])) * 10) / 10 }); setTp({ nAH: 10, nA: 10, V: 100, ajout: 0 }); }
    else if (type === 'ajout') { const a = tire([1, 2, 3]); setDefi({ ...base, pKa: tire([4.2, 4.8, 6.4, 7.2]), nAH: tire([5, 8, 10, 12]), nA: tire([5, 8, 10, 12]), ajout: pile() ? -a : a }); }
    else if (type === 'pka') { const pKa = tire(POUR_DEFI); setDefi({ ...base, pKa, id: ID_PAR_PKA[pKa], C0: tire([0.040, 0.050, 0.060, 0.080]) }); setTi(t => ({ ...t, Vb: 0, ind: null, deriv: true })); }
    else {
      const C0 = tire([0.040, 0.045, 0.055, 0.065, 0.075, 0.085]), pKa = tire(POUR_DEFI), Ceti = Math.round(C0 * (1 + tire([-0.03, -0.015, 0.0, 0.015, 0.03])) * 1000) / 1000;
      setDefi({ ...base, pKa, id: ID_PAR_PKA[pKa], C0, Ceti }); setTi(t => ({ ...t, Vb: 0, ind: null, deriv: true }));
    }
  }
  function changerMode(md) {
    setMode(md);
    if (md === 'defi') { if (!defi) nouveauDefi(typeDefi); else if (partie === 'titrage') setTi(t => ({ ...t, Vb: 0, ind: null, deriv: true })); else if (partie === 'tampon') setTp(PRESET_TP); }
    if (md === 'guide') { setAc(PRESET_AC); setDs(PRESET_DS); setTi(PRESET_TI); setTp(partie === 'tampon' ? TP_DEPART : PRESET_TP); }
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const incTi = M.incertitudeTitrage({ Cb: Ti.Cb, Veq: Math.max(equivDer, 1e-3), V0: Ti.V0, uCb: U_CB * Ti.Cb / R3, uVeq: U_VEQ / R3, uV0: U_V0 / R3 });
  const verifier = () => {
    const x = lireNombre(defi.reps.v);
    let ok, compat = null;
    if (defi.type === 'tau') ok = isFinite(x) && proche(x, 100 * 10 ** (-defi.phAff) / 10 ** defi.logC, 0.05);
    else if (defi.type === 'nature') ok = defi.reps.v === (defi.fort ? 'fort' : 'faible');
    else if (defi.type === 'rapport') ok = isFinite(x) && proche(x, 10 ** (defi.ph - defi.pKa), 0.05);
    else if (defi.type === 'espece') { const fr = M.fractions(M.concH(defi.ph), POLY[defi.polyId].pKas); ok = Number(defi.reps.v) === fr.indexOf(Math.max(...fr)); }
    else if (defi.type === 'ajout') ok = isFinite(x) && Math.abs(x - M.pHTampon({ nAH: defi.nAH * 1e-3, nA: defi.nA * 1e-3, V: 0.1, pKa: defi.pKa, nAjout: defi.ajout * 1e-3 })) <= 0.1;
    else if (defi.type === 'pka') ok = isFinite(x) && Math.abs(x - defi.pKa) <= 0.15;
    else if (defi.type === 'conc') {
      const vrai = defi.C0, tol = Math.max(0.03, 2 * incTi.rel); ok = isFinite(x) && proche(x, vrai, tol);
      const uEt = 0.02 * defi.Ceti / R3, uMes = x * incTi.rel;
      compat = isFinite(x) ? { z: Math.abs(x - defi.Ceti) / Math.hypot(uMes, uEt), ok: Math.abs(x - defi.Ceti) / Math.hypot(uMes, uEt) <= 2 } : null;
    } else ok = Math.abs(phTp0 - defi.cible) <= 0.1 && Math.abs(tp.V - 100) < 1 && tp.nAH >= 1 && tp.nA >= 1 && tp.nAH + tp.nA >= 10;
    setDefi(d => ({ ...d, verifie: true, ok, compat }));
    (defi.type === D1 ? noter1 : noter2)(ok);
  };
  const champReponse = (cle, unite, label) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps[cle] ?? ''} aria-label={label} onKeyDown={e => e.key === 'Enter' && document.getElementById('ab-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, [cle]: e.target.value }, verifie: false }))}
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const choixReponse = (options) => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
      {options.map(([v, t]) => <button key={v} onClick={() => setDefi(d => ({ ...d, reps: { ...d.reps, v: String(v) }, verifie: false }))} aria-pressed={defi.reps.v === String(v)} style={stylePetitBouton(defi.reps.v === String(v), '#0f766e')}>{t}</button>)}
    </div>);
  const titreDefi = !defi ? '' : {
    tau: 'Défi : quel est le taux d’avancement de cet acide ?', nature: 'Défi : cet acide est-il fort ou faible ?', rapport: 'Défi : quel est le rapport des deux formes ?', espece: 'Défi : quelle espèce prédomine ?',
    tampon: `Défi : préparer 100 mL de tampon de pH ${nbf(defi.cible ?? 0, 1)}`, ajout: 'Défi : quel est le pH après l’ajout ?', pka: 'Défi : quel est le pKa de l’acide ?', conc: 'Défi : quelle est la concentration de la solution d’acide ?' }[defi.type];
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[D1, D2].map(t => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0f766e')}>{LIB_DEFI[t]}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{titreDefi}</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>
        {defi.type === 'tau' && <>On prépare une solution d’{ACIDES[defi.acId].nom} ({ACIDES[defi.acId].formule}) de concentration <em>C</em> = {sci(10 ** defi.logC, 1)}{NB}mol·L⁻¹. Un pH-mètre indique pH = <strong>{nbf(defi.phAff, 2)}</strong>. Calculez le taux d’avancement final τ de la réaction de cet acide avec l’eau, en pourcentage, avec 2 chiffres significatifs.</>}
        {defi.type === 'nature' && <>On prépare une solution d’un acide de concentration <em>C</em> = {sci(10 ** defi.logC, 1)}{NB}mol·L⁻¹. Un pH-mètre indique pH = <strong>{nbf(defi.phAff, 2)}</strong>. Comparez ce pH à celui que donnerait un acide fort de même concentration.</>}
        {defi.type === 'rapport' && <>Pour le couple {ACIDES[defi.acId].formule} / {ACIDES[defi.acId].base}, pKa = <strong>{nbf(defi.pKa, 2)}</strong>. La solution a pour pH = <strong>{nbf(defi.ph, 2)}</strong>. Calculez le rapport <FormuleEnLigne><mfrac><mrow><mo>[</mo><msup><mi>A</mi><mo>−</mo></msup><mo>]</mo></mrow><mrow><mo>[</mo><mi>AH</mi><mo>]</mo></mrow></mfrac></FormuleEnLigne> avec 2 chiffres significatifs.</>}
        {defi.type === 'espece' && <>On étudie {POLY[defi.polyId].nom} ({POLY[defi.polyId].especes.join(', ')}). Le pH de la solution vaut <strong>{nbf(defi.ph, 1)}</strong>. Lisez le diagramme de distribution (pKa indiqués) et choisissez l’espèce qui prédomine.</>}
        {defi.type === 'tampon' && <>On dispose d’un couple acide/base de pKa = <strong>{nbf(defi.pKa, 1)}</strong> et on veut 100{NB}mL de solution de pH = <strong>{nbf(defi.cible, 1)}</strong> (± 0,1). Réglez les quantités d’acide et de base conjuguée (au moins 10 mmol au total, pour que le tampon ait une capacité suffisante), sans ajout, puis vérifiez.</>}
        {defi.type === 'ajout' && <>Un tampon de 100{NB}mL contient {defi.nAH}{NB}mmol d’acide AH et {defi.nA}{NB}mmol de base conjuguée A⁻ (pKa = <strong>{nbf(defi.pKa, 1)}</strong>). On y ajoute <strong>{Math.abs(defi.ajout)}{NB}mmol {defi.ajout < 0 ? 'd’acide fort' : 'de base forte'}</strong> (le volume ne change pas). Calculez le pH de la solution après l’ajout.</>}
        {defi.type === 'pka' && <>On titre 20,0{NB}mL d’une solution (<em>C</em> = {nbf(defi.C0, 3)}{NB}mol·L⁻¹) d’un acide faible inconnu par de la soude à 0,100{NB}mol·L⁻¹. Repérez l’équivalence, puis lisez le pH à la demi-équivalence : il donne le pKa du couple.</>}
        {defi.type === 'conc' && <>On titre 20,0{NB}mL d’une solution d’acide dont l’étiquette indique <strong>{nbf(defi.Ceti, 3)}{NB}mol·L⁻¹</strong> (± 2 %) par de la soude à 0,100{NB}mol·L⁻¹. Repérez le volume équivalent, calculez la concentration, puis jugez si votre résultat est <strong>compatible</strong> avec l’étiquette.</>}
      </div>
      {defi.type === 'tau' && champReponse('v', '%', 'Taux d’avancement τ')}
      {defi.type === 'nature' && choixReponse([['fort', 'acide fort'], ['faible', 'acide faible']])}
      {defi.type === 'rapport' && champReponse('v', '', 'Rapport des concentrations')}
      {defi.type === 'espece' && choixReponse(POLY[defi.polyId].especes.map((e, i) => [i, e]))}
      {defi.type === 'ajout' && champReponse('v', '', 'pH après l’ajout')}
      {defi.type === 'pka' && champReponse('v', '', 'pKa de l’acide')}
      {defi.type === 'conc' && champReponse('v', 'mol/L', 'Concentration trouvée')}
      {defi.type === 'tampon' && <div style={{ fontSize: 14, marginBottom: 8, color: KIT.txt2 }}>Aucune saisie : le pH affiché dans « Mesures » est celui qui sera contrôlé.</div>}
      {defi.type === 'tau' && <IndiceDefi cache={false}>τ = frac(x_f|x_max) = frac([H₃O⁺]|C) avec [H₃O⁺] = 10^(−pH). Convertissez en pourcentage.</IndiceDefi>}
      {defi.type === 'nature' && <IndiceDefi cache={false}>Pour un acide fort, [H₃O⁺] = C donc pH = −log C. Calculez −log C et comparez au pH mesuré : pH plus grand, la réaction n’est pas totale.</IndiceDefi>}
      {defi.type === 'rapport' && <IndiceDefi cache={false}>frac([A⁻]|[AH]) = 10^(pH − pKa) : calculez d’abord pH − pKa.</IndiceDefi>}
      {defi.type === 'espece' && <IndiceDefi cache={false}>Placez le pH sur l’axe : l’espèce qui prédomine est celle de la courbe la plus haute à ce pH, entre deux pKa consécutifs.</IndiceDefi>}
      {defi.type === 'ajout' && <IndiceDefi cache={false}>L’acide fort ajouté transforme A⁻ en AH (la base forte transforme AH en A⁻). Calculez les nouvelles quantités, puis pH = pKa + log frac(n(A⁻)|n(AH)) : le volume s’élimine du rapport.</IndiceDefi>}
      {defi.type === 'pka' && <IndiceDefi cache={false}>Repérez le volume équivalent, puis lisez le pH à la demi-équivalence : à V_eq ÷ 2, pH = pKa.</IndiceDefi>}
      {defi.type === 'conc' && <IndiceDefi cache={false}>À l’équivalence : C_acide × V_acide = C_base × V_eq. Isolez C_acide, puis comparez à l’étiquette en tenant compte des incertitudes.</IndiceDefi>}
      {defi.type === 'tampon' && <IndiceDefi cache={false}>pH = pKa + log frac(n(base)|n(acide)) : trouvez le rapport base / acide nécessaire, puis les quantités pour 100 mL.</IndiceDefi>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="ab-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? `✓ Correct. ${{ tau: `τ = ${nbf(100 * 10 ** (-defi.phAff) / 10 ** defi.logC, 1)} %.`, nature: defi.fort ? 'C’était l’acide chlorhydrique, un acide fort.' : `C’était l’${ACIDES[defi.acId].nom}, un acide faible.`, rapport: `Rapport = ${nbf(10 ** (defi.ph - defi.pKa), 2)}.`, espece: `${POLY[defi.polyId]?.especes[idxDefi(defi)]} prédomine.`, ajout: `pH = ${nbf(M.pHTampon({ nAH: defi.nAH * 1e-3, nA: defi.nA * 1e-3, V: 0.1, pKa: defi.pKa, nAjout: defi.ajout * 1e-3 }), 2)}.`, pka: `pKa = ${nbf(defi.pKa, 2)} (${ACIDES[defi.id]?.nom}).`, conc: `Valeur de la simulation : ${nbf(defi.C0, 3)} mol/L.`, tampon: `pH obtenu : ${nbf(phTp0, 2)}.` }[defi.type]}`
          : { tau: '✗ Vérifiez : τ = frac([H₃O⁺]|C), avec [H₃O⁺] = 10^(−pH) en mol/L, puis × 100.', nature: '✗ Calculez −log C : si le pH mesuré est égal à −log C, l’acide est fort ; s’il est plus grand, l’acide est faible.', rapport: '✗ Vérifiez : frac([A⁻]|[AH]) = 10^(pH − pKa) ; le rapport est supérieur à 1 si pH > pKa, inférieur à 1 sinon.', espece: '✗ Comparez le pH aux pKa : une seule espèce prédomine entre deux pKa consécutifs.', ajout: '✗ Vérifiez : l’acide fort fait diminuer n(A⁻) et augmenter n(AH) de la même quantité (l’inverse pour une base forte), puis pH = pKa + log frac(n(A⁻)|n(AH)).', pka: '✗ Vérifiez : à la demi-équivalence V = Veq / 2, pH = pKa. Repérez d’abord Veq au maximum de dpH/dV, puis placez le curseur sur Veq/2.', conc: '✗ Vérifiez : Cₐ = frac(C_b × Veq|V₀), avec Veq au maximum de dpH/dV (en mL, comme V₀).', tampon: '✗ Rappel : pH = pKa + log frac(n(base)|n(acide)). Il faut frac(n(base)|n(acide)) = 10^(pH − pKa).' }[defi.type]}
        {defi.type === 'conc' && defi.compat && <div style={{ color: defi.compat.ok ? '#15803d' : '#b45309', marginTop: 4 }}>Comparaison avec l’étiquette : écart normalisé = {nbf(defi.compat.z, 1)} ({defi.compat.ok ? '≤ 2 : résultat compatible avec l’étiquette' : '> 2 : résultat non compatible avec l’étiquette'}).</div>}
      </div>}
    </div>);

  // ---------- scènes ----------
  const Echelle = ph => (
    <svg viewBox="0 0 600 46" style={{ width: '100%', display: 'block' }} role="img" aria-label={ph == null ? 'Échelle de pH de 0 (très acide) à 14 (très basique)' : `Échelle de pH : la solution a un pH de ${nbf(ph, 2)}`}>
      <defs><linearGradient id="ab-ech" x1="0" x2="1"><stop offset="0" stopColor="#dc2626"/><stop offset="0.25" stopColor="#f59e0b"/><stop offset="0.5" stopColor="#22c55e"/><stop offset="0.75" stopColor="#3b82f6"/><stop offset="1" stopColor="#6d28d9"/></linearGradient></defs>
      <rect x="20" y="8" width="560" height="14" rx="7" fill="url(#ab-ech)"/>
      {[0, 2, 4, 6, 8, 10, 12, 14].map(k => <text key={k} x={20 + 560 * k / 14} y="40" fontSize="11" textAnchor="middle" fill="#334155">{k}</text>)}
      {ph != null && <polygon points={`${20 + 560 * Math.max(0, Math.min(14, ph)) / 14 - 7},0 ${20 + 560 * Math.max(0, Math.min(14, ph)) / 14 + 7},0 ${20 + 560 * Math.max(0, Math.min(14, ph)) / 14},11`} fill="#0f172a"/>}
    </svg>);

  const SceneAcide = () => {
    // Tableau d'avancement pour V = 100 mL (autoprotolyse de l'eau négligée dans le tableau)
    const Vtab = 1, n0 = C * Vtab, xf = n0 * Math.min(1, tauA), xmax = n0;
    const cel = { border: `1px solid ${KIT.bord}`, padding: '4px 2px', textAlign: 'center', fontSize: 12, lineHeight: 1.2 };
    const ent = { ...cel, background: '#f1f5f9', fontWeight: 700 };
    const q = v => (v < 1e-12 ? '0' : sci(v, 1));
    const fin = A.fort ? '→' : '⇌';
    return (
      <div>
        {Echelle(!enGuide || apres('phfort') ? phA : null)}
        {depuis('faible') && <div className="acb-in">
        <div style={{ fontSize: 13, color: KIT.txt2, margin: '8px 0 4px' }}>
          Tableau d’avancement (mol) pour V = 1,00{NB}L de solution ; x<sub>max</sub> : réaction totale, x<sub>f</sub> : état final. AH = <b>{A.formule}</b> et A⁻ = <b>{A.base}</b>.</div>
        <div style={{ overflowX: 'auto' }}>
          <table data-tableau-acide style={{ borderCollapse: 'collapse', background: 'white', width: '100%' }}
            aria-label={`Tableau d’avancement de la réaction de ${A.formule} avec l’eau`}>
            <thead><tr>
              <th style={ent}>x</th><th style={{ ...ent, color: '#6d28d9' }}>AH</th><th style={ent}>+ H₂O</th>
              <th style={{ ...ent, color: '#0e7490' }}>{fin} A⁻</th><th style={{ ...ent, color: '#dc2626' }}>+ H₃O⁺</th></tr></thead>
            <tbody>
              <tr><td style={ent}>0</td><td style={cel}>{q(n0)}</td><td style={cel}>excès</td><td style={cel}>0</td><td style={cel}>≈ 0</td></tr>
              <tr><td style={ent}>x</td><td style={cel}>{q(n0)} − x</td><td style={cel}>excès</td><td style={cel}>x</td><td style={cel}>x</td></tr>
              <tr><td style={ent}>x<sub>max</sub></td><td style={cel}>0</td><td style={cel}>excès</td><td style={cel}>{q(xmax)}</td><td style={cel}>{q(xmax)}</td></tr>
              <tr style={{ background: '#fffbeb' }}><td style={ent}>x<sub>f</sub></td>
                <td style={{ ...cel, fontWeight: 700 }}>{q(n0 - xf)}</td><td style={cel}>excès</td>
                <td style={{ ...cel, fontWeight: 700 }}>{q(xf)}</td><td style={{ ...cel, fontWeight: 700 }}>{q(xf)}</td></tr>
            </tbody>
          </table>
        </div>
        </div>}
        {apres('tau') && <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 14, color: KIT.txt, fontWeight: 700 }}>x<sub>f</sub> = {nbf(Math.min(100, tauA * 100), 1)}{NB}% de x<sub>max</sub></div>
          <div role="img" aria-label={`x f représente ${nbf(Math.min(100, tauA * 100), 1)} pour cent de x max`} style={{ flex: 1, minWidth: 140, height: 14, background: '#e2e8f0', borderRadius: 7, overflow: 'hidden' }}>
            <div style={{ width: `${Math.max(0.8, Math.min(100, tauA * 100))}%`, height: '100%', background: A.fort ? '#15803d' : '#d97706' }}/></div>
        </div>}
        {depuis('faible') && apres('tabacide') && <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4 }}>
          {A.fort ? <>Réaction totale : <i>x</i><sub>f</sub> = <i>x</i><sub>max</sub>, il ne reste plus d’acide AH.</> : <>Réaction limitée : <i>x</i><sub>f</sub> &lt; <i>x</i><sub>max</sub>, il reste de l’acide AH en solution à côté de A⁻ et H₃O⁺.</>}</div>}
      </div>);
  };

  const SceneDistrib = () => {
    const W = 600, H = 250, X = ph => 44 + (W - 60) * ph / 14, Y = a => 20 + (H - 52) * (1 - a);
    const courbes = P.especes.map((_, i) => { let d = ''; for (let k = 0; k <= 140; k++) { const ph = k / 10, a = M.fractions(M.concH(ph), P.pKas)[i]; d += `${k ? 'L' : 'M'}${X(ph).toFixed(1)},${Y(a).toFixed(1)}`; } return d; });
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }} role="img"
        aria-label={`Diagramme de distribution de ${P.nom}, pH choisi : ${nbf(dsEff.ph, 1)}${dd ? '' : `. ${P.especes.map((e, i) => `${e} ${nbf(frD[i] * 100, 0)} pour cent`).join(', ')}`}`}>
        <line x1={X(0)} y1={Y(0)} x2={X(14)} y2={Y(0)} stroke="#94a3b8"/><line x1={X(0)} y1={Y(0)} x2={X(0)} y2={Y(1)} stroke="#94a3b8"/>
        {[0, 2, 4, 6, 8, 10, 12, 14].map(k => <text key={k} x={X(k)} y={H - 14} fontSize="11" textAnchor="middle" fill="#334155">{k}</text>)}
        {[0, 0.5, 1].map(a => <text key={a} x={X(0) - 6} y={Y(a) + 4} fontSize="11" textAnchor="end" fill="#334155">{a * 100}%</text>)}
        <text x={W / 2} y={H - 1} fontSize="11" textAnchor="middle" fill="#334155">pH</text>
        {P.pKas.map((p, i) => <g key={i}><line x1={X(p)} y1={Y(1)} x2={X(p)} y2={Y(0)} stroke="#cbd5e1" strokeDasharray="4 3"/><text x={X(p)} y={Y(1) - 4} fontSize="10.5" textAnchor="middle" fill="#475569">pKa{sub(i + 1)} = {nbf(p, 1)}</text></g>)}
        {courbes.map((d, i) => <path key={i} d={d} fill="none" stroke={COUL_ESP[i]} strokeWidth="2.2"/>)}
        {P.especes.map((e, i) => { const phm = i === 0 ? (P.pKas[0] - 1.2) : i === P.especes.length - 1 ? Math.min(13.2, P.pKas[P.pKas.length - 1] + 1.2) : (P.pKas[i - 1] + P.pKas[i]) / 2; return <text key={e} x={X(Math.max(0.6, phm))} y={Y(0.62) - (i % 2 ? 0 : 6)} fontSize="12.5" fontWeight="700" textAnchor="middle" fill={COUL_ESP[i]} stroke="white" strokeWidth="3" paintOrder="stroke">{e}</text>; })}
        <line x1={X(dsEff.ph)} y1={Y(1)} x2={X(dsEff.ph)} y2={Y(0)} stroke="#0f172a" strokeWidth="1.5"/>
        {!dd && frD.map((a, i) => <circle key={i} cx={X(dsEff.ph)} cy={Y(a)} r="4.5" fill={COUL_ESP[i]} stroke="white" strokeWidth="1.5"/>)}
      </svg>);
  };

  const SceneTampon = () => {
    const montrePh = !enGuide || apres('phtampon'), montreEau = !enDefi && depuis('ajout');
    // Une seule échelle de pH : en haut le pH de la solution tampon, en bas celui de l'eau pure ayant reçu le même ajout
    const xp = ph => 20 + 560 * Math.max(0, Math.min(14, ph)) / 14;
    const etiq = (ph, y, txt, col) => <text x={xp(ph)} y={y} fontSize="13" fontWeight="700" fill={col} textAnchor={xp(ph) < 190 ? 'start' : xp(ph) > 410 ? 'end' : 'middle'}>{txt}</text>;
    const echelleDouble = (
      <svg viewBox={`0 0 600 ${montreEau ? 118 : 74}`} style={{ width: '100%', display: 'block' }} role="img"
        aria-label={`Échelle de pH. Solution tampon de ${tp.V} mL${montrePh ? ` : pH ${nbf(phTp, 2)}` : ''}${montreEau ? `. ${tp.V} mL d’eau pure, même ajout : pH ${nbf(phEau, 2)}` : ''}`}>
        <defs><linearGradient id="ab-ech2" x1="0" x2="1"><stop offset="0" stopColor="#dc2626"/><stop offset="0.25" stopColor="#f59e0b"/><stop offset="0.5" stopColor="#22c55e"/><stop offset="0.75" stopColor="#3b82f6"/><stop offset="1" stopColor="#6d28d9"/></linearGradient></defs>
        {montrePh && etiq(phTp, 14, `${tp.V} mL de solution tampon : pH = ${nbf(phTp, 2)}`, '#0e7490')}
        {montrePh && <polygon points={`${xp(phTp) - 8},22 ${xp(phTp) + 8},22 ${xp(phTp)},38`} fill="#0e7490"/>}
        <rect x="20" y="40" width="560" height="16" rx="8" fill="url(#ab-ech2)"/>
        {[0, 2, 4, 6, 8, 10, 12, 14].map(k => <text key={k} x={20 + 560 * k / 14} y="72" fontSize="11" textAnchor="middle" fill="#334155">{k}</text>)}
        {montreEau && <>
          <polygon points={`${xp(phEau) - 8},96 ${xp(phEau) + 8},96 ${xp(phEau)},80`} fill="#b45309"/>
          {etiq(phEau, 112, `${tp.V} mL d’eau pure, même ajout : pH = ${nbf(phEau, 2)}`, '#b45309')}</>}
      </svg>);
    const nIni = tp.nAH + tp.nA;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {echelleDouble}
        <svg viewBox="0 0 600 70" style={{ width: '100%', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }} role="img" aria-label={`Quantités dans la solution : ${nbf(tp.nAH, 0)} millimoles d’acide et ${nbf(tp.nA, 0)} millimoles de base conjuguée`}>
          <rect x="20" y="14" width={Math.max(2, 560 * tp.nAH / 40)} height="20" fill="#6d28d9" opacity="0.85" rx="3"/><text x="24" y="28" fontSize="12" fill="white" fontWeight="700">AH</text>
          <rect x="20" y="40" width={Math.max(2, 560 * tp.nA / 40)} height="20" fill="#0e7490" opacity="0.85" rx="3"/><text x="24" y="54" fontSize="12" fill="white" fontWeight="700">A⁻</text>
          <text x="580" y="28" fontSize="11" textAnchor="end" fill="#334155">{nbf(tp.nAH, 0)} mmol</text><text x="580" y="54" fontSize="11" textAnchor="end" fill="#334155">{nbf(tp.nA, 0)} mmol</text>
        </svg>
        {nIni === 0 && <div role="alert" style={{ color: '#b91c1c', fontSize: 13.5 }}>Il faut au moins un des deux constituants.</div>}
      </div>);
  };

  const SceneTitrage = () => {
    const W = 600, H = 430, mx = 44, X = v => mx + (W - mx - 12) * v / VMAX, Y = p => 14 + (H - 46) * (1 - p / 14);
    const tr = ptsTi.map((p, i) => `${i ? 'L' : 'M'}${X(p.V).toFixed(1)},${Y(p.pH).toFixed(1)}`).join('');
    const dmax = Math.max(...ptsTi.map(p => p.d));
    const Yd = d => (H - 32) - (H - 60) * 0.5 * d / dmax;
    const trd = ptsTi.map((p, i) => `${i ? 'L' : 'M'}${X(p.V).toFixed(1)},${Yd(p.d).toFixed(1)}`).join('');
    const indo = Ti.ind ? M.INDICATEURS.find(i => i.id === Ti.ind) : null;
    const coulSol = indo ? M.couleurIndicateur(indo, phTi) : '#e0f2fe';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ maxWidth: 560 }}>
            <SchemaBurette V2={Ti.Vb} ouvert={false} coul={coulSol} indicateur={indo ? indo.nom : null} reperes={false} legendeCouleur={false} sonde={{ valeur: nbf(phTi, 2) }}
              etiquetteBurette={<><strong>Burette : solution titrante</strong><br/>soude, C<sub>b</sub> = {nbf(Ti.Cb, 3)} mol/L</>}
              etiquetteErlen={<><strong>Erlenmeyer : solution titrée</strong><br/>{nbf(Ti.V0, 1)} mL d’{acT.nom}{indo ? <> + indicateur coloré</> : null}</>}/>
          </div>
          <div>
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
  const zoneScene = partie === 'acide' ? SceneAcide() : partie === 'distrib' ? SceneDistrib() : partie === 'tampon' ? SceneTampon() : SceneTitrage();
  const legende = { acide: depuis('dilution') && <>Modifiez la concentration : observez comment <i>x</i><sub>f</sub> se compare à <i>x</i><sub>max</sub> dans le tableau.</>,
    distrib: 'Le trait vertical est le pH choisi ; les points donnent la fraction de chaque espèce à ce pH.',
    tampon: depuis('ajout') && 'Comparez la variation de pH de la solution tampon à celle de l’eau pure pour le même ajout.',
    titrage: 'Bleu : pH = f(V). Le point orange suit le curseur de volume. Vert pointillé : dérivée dpH/dV (si affichée).' }[partie];
  const sceneBox = sceneVisible && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {zoneScene}
      {legende && !(enDefi && partie === 'distrib') && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6 }}>{legende}</div>}
    </div>);

  const reglages = (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      {partie === 'acide' && <>
        <Liste nom="Acide étudié" valeur={ac.id} onChange={v => setAc(s => ({ ...s, id: v }))}
          options={Object.entries(ACIDES).filter(([k]) => !enGuide || k === 'hcl' || k === 'etha').map(([k, a]) => [k, `${a.nom} (${a.formule})`])}/>
        {depuis('dilution') && <div className="acb-in"><Curseur nom="log C (C en mol/L)" valeur={ac.logC} onChange={v => setAc(s => ({ ...s, logC: v }))} min={-6} max={-1} pas={1} unite="" decimales={0} couleur="#475569"/></div>}
        <div style={{ fontSize: 13, color: KIT.txt2 }}>C = {sci(C, 1)} mol/L</div>
      </>}
      {partie === 'distrib' && <>
        <Liste nom="Couple ou polyacide étudié" valeur={ds.id} onChange={v => setDs(s => ({ ...s, id: v }))}
          options={Object.entries(POLY).filter(([k]) => !enGuide || k === 'etha' || (k === 'cit' && depuis('citrique'))).map(([k, a]) => [k, `${a.nom} (pKa : ${a.pKas.map(p => nbf(p, 1)).join(' ; ')})`])}/>
        <Curseur nom="pH de la solution" valeur={ds.ph} onChange={v => setDs(s => ({ ...s, ph: v }))} min={0} max={14} pas={0.1} unite="" decimales={1} couleur="#475569"/>
      </>}
      {partie === 'tampon' && <>
        {dd ? <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6 }}>Couple de pKa = {nbf(dd.pKa, 1)}, volume 100 mL. Réglez les quantités.</div> : <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6 }}>Couple CH₃COOH / CH₃COO⁻ (pKa = 4,8)</div>}
        <Curseur nom="Quantité d’acide AH" valeur={tp.nAH} onChange={v => setTp(s => ({ ...s, nAH: v }))} min={0} max={40} pas={1} unite="mmol" decimales={0} couleur="#0b4f94"/>
        <Curseur nom="Quantité de base A⁻" valeur={tp.nA} onChange={v => setTp(s => ({ ...s, nA: v }))} min={0} max={40} pas={1} unite="mmol" decimales={0} couleur="#b45309"/>
        {!dd && <>{!enGuide && <Curseur nom="Volume de solution" valeur={tp.V} onChange={v => setTp(s => ({ ...s, V: v }))} min={50} max={200} pas={10} unite="mL" decimales={0} couleur="#475569"/>}
          {depuis('ajout') && <div className="acb-in"><Curseur nom="Ajout (− acide fort / + base forte)" valeur={tp.ajout} onChange={v => setTp(s => ({ ...s, ajout: v }))} min={-5} max={5} pas={0.5} unite="mmol" decimales={1} couleur="#b45309"/></div>}</>}
      </>}
      {partie === 'titrage' && <>
        {!enDefi && !enGuide && <Liste nom="Acide titré (solution de l’erlenmeyer)" valeur={ti.id} onChange={v => setTi(sx => ({ ...sx, id: v }))}
          options={Object.entries(ACIDES).filter(([k]) => k !== 'amm').map(([k, a]) => [k, `${a.nom} (${a.formule})`])}/>}
        {enDefi ? <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6 }}>20,0 mL d’acide inconnu titrés par la soude (0,100 mol·L⁻¹).</div> : enGuide ? <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Prise d’essai 20,0 mL d’acide de concentration inconnue ; soude à 0,100 mol/L.</div> : <>
          <Curseur nom="Concentration de l’acide C" valeur={ti.C0} onChange={v => setTi(sx => ({ ...sx, C0: v }))} min={0.02} max={0.1} pas={0.005} unite="mol/L" decimales={3} couleur="#475569"/>
          <Curseur nom="Prise d’essai V₀ (pipette)" valeur={ti.V0} onChange={v => setTi(sx => ({ ...sx, V0: v }))} min={10} max={25} pas={5} unite="mL" decimales={1} couleur="#475569"/>
          <Curseur nom="Concentration de la soude Cb" valeur={ti.Cb} onChange={v => setTi(sx => ({ ...sx, Cb: v }))} min={0.05} max={0.2} pas={0.01} unite="mol/L" decimales={3} couleur="#475569"/>
          {Veq > VMAX && <div role="alert" style={{ fontSize: 13, color: '#b91c1c', marginBottom: 6 }}>Le volume équivalent ({nbf(Veq, 1)} mL) dépasse la burette de {VMAX} mL : prélevez moins d’acide ou prenez une soude plus concentrée.</div>}</>}
        <Curseur nom="Volume de soude versé V" valeur={ti.Vb} onChange={v => setTi(s => ({ ...s, Vb: v }))} min={0} max={VMAX} pas={0.1} unite="mL" decimales={1} couleur="#b45309"/>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          {depuis('equiv') && <button className="acb-in" onClick={() => setTi(s => ({ ...s, deriv: !s.deriv }))} aria-pressed={ti.deriv} style={stylePetitBouton(ti.deriv, '#15803d')}>Afficher la dérivée</button>}
        </div>
        {!enDefi && depuis('indic') && <div className="acb-in" style={{ marginTop: 8 }}><Liste nom="Indicateur coloré" valeur={ti.ind || ''} onChange={v => setTi(sx => ({ ...sx, ind: v || null }))}
          options={[['', 'aucun'], ...M.INDICATEURS.map(i => [i.id, `${i.nom} (zone de virage ${nbf(i.zone[0], 1)} – ${nbf(i.zone[1], 1)})`])]}/></div>}
      </>}
    </div>);
  const mesures = (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {partie === 'acide' && <>
        <LigneMesure nom="pH (pH-mètre)" valeur={nbf(phA, 2)} couleur="#b45309"/>
        {depuis('tabacide') && <LigneMesure nom="[H₃O⁺] = 10^(−pH)" valeur={`${sci(hA, 2)}${NB}mol/L`}/>}
        {apres('phfort') && <LigneMesure nom="Concentration apportée C" valeur={`${sci(C, 1)}${NB}mol/L`}/>}
        {apres('tau') && <LigneMesure nom="Taux d’avancement τ = frac([A⁻]|C)" valeur={`${nbf(Math.min(100, tauA * 100), 1)}${NB}%`} couleur="#15803d"/>}
        {!enGuide && !A.fort && <LigneMesure nom={`pH approché ½(pKa − log C), pKa = ${nbf(A.pKas[0], 2)}`} valeur={nbf(phApprox, 2)}/>}
        {!enGuide && A.fort && <LigneMesure nom="pH approché −log C" valeur={nbf(phApprox, 2)}/>}
        {!enGuide && !A.fort && <LigneMesure nom="Écart entre pH approché et pH exact" valeur={nbf(phApprox - phA, 2)} couleur={Math.abs(phApprox - phA) > 0.05 ? '#b91c1c' : '#15803d'}/>}
      </>}
      {partie === 'distrib' && <>
        <LigneMesure nom="pH" valeur={nbf(dsEff.ph, 1)} couleur="#b45309"/>
        {P.especes.map((e, i) => <LigneMesure key={e} nom={`Fraction de ${e}`} valeur={`${nbf(frD[i] * 100, 1)}${NB}%`} couleur={COUL_ESP[i]}/>)}
        {(apres('citpredom') || !enGuide) ? <LigneMesure nom="Espèce prédominante" valeur={[...frD].sort((a, b) => b - a)[0] - [...frD].sort((a, b) => b - a)[1] < 0.01 ? 'égalité de deux espèces' : P.especes[idxMax]} couleur="#15803d"/> : null}
        {!enGuide && P.pKas.map((p, i) => <LigneMesure key={i} nom={`pH − pKa${sub(i + 1)}`} valeur={nbf(dsEff.ph - p, 2)}/>)}
      </>}
      {partie === 'tampon' && <>
        <LigneMesure nom="pH de la solution" valeur={nbf(phTp, 2)} couleur="#b45309"/>
        {!enDefi && depuis('ajout') && <LigneMesure nom={`pH de ${tp.V} mL d’eau pure, même ajout`} valeur={nbf(phEau, 2)}/>}
        {!enDefi && apres('delta') && <LigneMesure nom="Variation de pH du tampon" valeur={nbf(phTp - phTp0, 2)} couleur="#15803d"/>}
        {!enDefi && (!enGuide || apres('ajout')) && <LigneMesure nom="Rapport frac([A⁻]|[AH])" valeur={tp.nAH > 0 ? nbf(tp.nA / tp.nAH, 2) : '–'}/>}
        {!enDefi && (!enGuide || apres('ajout')) && <LigneMesure nom="Pouvoir tampon β (mol·L⁻¹ par unité de pH)" valeur={isFinite(betaTp) ? nbf(betaTp, 3) : '–'}/>}
        {!enDefi && (!enGuide || apres('ajout')) && tp.nAH > 0 && tp.nA > 0 && <LigneMesure nom="pH dans l’intervalle pKa ± 1 ?" valeur={Math.abs(phTp0 - 4.8) <= 1 ? 'oui : tampon efficace' : 'non : peu efficace'} couleur={Math.abs(phTp0 - 4.8) <= 1 ? '#15803d' : '#b91c1c'}/>}
        {enDefi && <LigneMesure nom="pH préparé (sans ajout)" valeur={nbf(phTp0, 2)}/>}
      </>}
      {partie === 'titrage' && <>
        <LigneMesure nom="Volume versé V" valeur={`${nbf(Ti.Vb, 1)}${NB}mL`}/>
        <LigneMesure nom="pH (pH-mètre)" valeur={nbf(phTi, 2)} couleur="#b45309"/>
        {Ti.deriv && <LigneMesure nom="Dérivée dpH/dV (± 0,1 mL)" valeur={`${nbf(derTi, 2)}${NB}pH/mL`} couleur="#15803d"/>}
        {!enGuide && !enDefi && <LigneMesure nom="Volume équivalent (maximum de la dérivée)" valeur={`${nbf(equivDer, 1)}${NB}mL`} couleur="#15803d"/>}
        {!enGuide && !enDefi && pKaT != null && <LigneMesure nom={`pH à Veq / 2 (pKa du couple = ${nbf(pKaT, 2)})`} valeur={nbf(phDemi, 2)}/>}
        {!enGuide && !enDefi && <LigneMesure nom="Concentration Cb × Veq / V₀" valeur={`${nbf(Ti.Cb * equivDer / Ti.V0, 4)}${NB}mol/L`}/>}
        {Ti.ind && !enDefi && (() => { const indo = M.INDICATEURS.find(i => i.id === Ti.ind), peq = M.phEquivalence(pT), [s1, s2] = M.sautPH(pT), cv = M.convient(indo, peq), ok2 = !cv && M.convientDansSaut(indo, pT);
          return <><LigneMesure nom="pH à l’équivalence" valeur={nbf(peq, 2)}/><LigneMesure nom="Saut de pH (à ± 1 % de Veq)" valeur={`${nbf(s1, 1)} → ${nbf(s2, 1)}`}/>
            <LigneMesure nom={`Indicateur ${indo.nom} adapté à ce titrage ?`} valeur={cv ? 'oui' : ok2 ? 'acceptable' : 'non'} couleur={cv ? '#15803d' : ok2 ? '#b45309' : '#b91c1c'}/>
            <div style={{ fontSize: 12.5, color: KIT.txt2, lineHeight: 1.45, padding: '2px 0 4px' }}>{cv ? 'La zone de virage contient le pH à l’équivalence.' : ok2 ? 'La zone de virage ne contient pas le pH à l’équivalence, mais elle est entièrement dans le saut de pH : le virage se produit à moins de 1 % de Veq.' : 'La zone de virage n’est pas dans le saut de pH : le virage a lieu trop tôt ou trop tard.'}</div></>; })()}
      </>}
    </div>);

  const incertBox = enDefi && defi?.type === 'conc' && (
    <div style={{ ...styleBoite }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Sources d’incertitude sur la concentration</div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginBottom: 6 }}>Type B : u = demi-étendue / √3 ; sources indépendantes.</div>
      <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
        <thead><tr style={{ textAlign: 'left', color: KIT.txt2 }}><th style={{ padding: '2px 4px' }}>Source</th><th style={{ padding: '2px 4px' }}>± demi-étendue</th></tr></thead>
        <tbody>{[['Cb (soude)', '0,5 %', U_CB / R3], ['Veq (repérage)', `${nbf(U_VEQ, 1)} mL`, U_VEQ / R3 / Math.max(equivDer, 1e-3)], ['V₀ (pipette)', `${nbf(U_V0, 2)} mL`, U_V0 / R3 / Ti.V0]].map(([n, dem]) => (
          <tr key={n} style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ padding: '3px 4px', fontWeight: 600 }}>{n}</td><td style={{ padding: '3px 4px' }}>{dem}</td></tr>))}</tbody>
      </table>
      {defi.verifie && <LigneMesure nom="u(Cₐ) / Cₐ" valeur={`${nbf(incTi.rel * 100, 2)} %`}/>}
    </div>);

  // ---------- hypothèses (selon la partie) ----------
  const HYPO = [
    [['acide', 'distrib', 'tampon', 'titrage'], <li key="t"><strong>Température 25 °C</strong> : K<sub>e</sub> = 1,0 × 10⁻¹⁴. Les pKa sont les valeurs de la simulation, proches de celles des tables.</li>],
    [['acide', 'distrib', 'tampon', 'titrage'], <li key="a"><strong>Activités = concentrations</strong> : solutions diluées (C ≤ 0,1 mol·L⁻¹), sans effet de force ionique.</li>],
    [['acide', 'distrib', 'tampon', 'titrage'], <li key="e"><strong>pH calculé exactement</strong> par la conservation de la charge (autoprotolyse de l’eau et polyacides compris), pas par les formules approchées. Les formules du cours (pH = ½(pKa − log C), pH = pKa + log frac([A⁻]|[AH])) sont affichées pour comparaison.</li>],
    [['acide', 'tampon', 'titrage'], <li key="f"><strong>Acides forts et bases fortes</strong> : totalement dissociés. Pas de CO₂ dissous dans les solutions. Titrage : volumes additifs ; tampon : l’ajout ne change pas le volume de la solution.</li>],
    [['titrage'], <li key="u"><strong>Titrage</strong> : le pH-mètre est supposé parfaitement étalonné. Incertitudes (type B, loi rectangulaire, u = demi-étendue / √3, sources indépendantes) : concentration de la soude ± 0,5 %, prise d’essai à la pipette ± 0,03 mL, repérage du volume équivalent ± 0,1 mL. Compatibilité avec l’étiquette (± 2 %, loi rectangulaire) : |écart| / √(u² + u_étiq²) ≤ 2.</li>],
    [['titrage'], <li key="i"><strong>Indicateurs</strong> : un indicateur convient (critère du programme) si sa zone de virage contient le pH à l’équivalence ; il est dit « acceptable » si elle ne le contient pas mais se trouve entièrement dans le saut de pH, c’est-à-dire entre les pH à 0,99 et 1,01 Veq (virage repéré à 1 % près) ; la couleur est un mélange des teintes acide et basique selon le pH ; les zones de virage sont celles des tables ({M.INDICATEURS.map(i => `${i.nom} ${nbf(i.zone[0], 1)}–${nbf(i.zone[1], 1)}`).join(' ; ')}).</li>],
    [['tampon'], <li key="b"><strong>Pouvoir tampon</strong> : β = variation de quantité de base forte ajoutée par litre et par unité de pH, calculée autour de l’état courant.</li>],
  ].filter(([ps]) => ps.includes(partie)).map(([, li]) => li);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}><ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>{HYPO}</ul></Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0f766e')}><Pic n="target"/>Défis</button>
    </span>);

  const ESSAIS = {
    acide: ['Diluez l’acide éthanoïque de 10⁻² à 10⁻⁶ mol/L. Le pH approché reste-t-il proche du pH exact ? Pourquoi décroche-t-il ?', 'Comparez l’ion ammonium et l’acide méthanoïque à la même concentration. Lequel est le plus dissocié ?', 'Choisissez l’acide chlorhydrique à 10⁻⁶ mol/L : quel pH trouvez-vous ? Est-ce 6 ? Pourquoi ?'],
    distrib: ['Dans l’acide citrique, pour quel pH H₂A⁻ est-elle maximale, et quelle fraction atteint-elle ?', 'Pour l’acide phosphorique, existe-t-il une espèce prédominante à tout pH, sauf aux valeurs pH = pKa ?', 'Pour le dioxyde de carbone dissous, quelle espèce prédomine dans le sang (pH voisin de 7,4) ?'],
    tampon: ['Gardez 20 mmol au total mais changez le rapport A⁻/AH de 1 à 10 puis à 0,1. Que devient le pouvoir tampon ?', 'Ajoutez 5 mmol d’acide fort à un tampon à 5 mmol d’AH et 5 mmol d’A⁻. Que se passe-t-il ? Pourquoi dit-on que la capacité du tampon est limitée ?', 'Doublez le volume de solution en gardant les mêmes quantités : le pH du tampon change-t-il ?'],
    titrage: ['Comparez l’acide chlorhydrique et l’acide éthanoïque à la même concentration. Le saut de pH est-il le même ? Quels indicateurs conviennent à chaque cas ?', 'Titrez l’acide benzoïque. Quel indicateur choisir ? Pourquoi le bleu de bromothymol ne convient-il pas ?', 'Changez la concentration de la soude : comment évoluent le volume équivalent et la hauteur du saut de pH ?'],
  }[partie];
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>{ESSAIS.map(t => <li key={t}>{t}</li>)}</ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        {{
          acide: [<li key="1">acide fort : réaction totale, [H₃O⁺] = C, pH = −log C</li>, <li key="2">acide faible : réaction limitée (τ &lt; 100 %), τ augmente quand on dilue</li>],
          distrib: [<li key="1">pH = pKa + log frac([A⁻]|[AH]) ; acide prédominant si pH &lt; pKa, base prédominante si pH &gt; pKa</li>, <li key="2">polyacide : une seule espèce prédomine entre deux pKa consécutifs</li>],
          tampon: [<li key="1">solution tampon : pH = pKa ± 1, AH et A⁻ en quantités comparables</li>, <li key="2">l’acide AH consomme les bases ajoutées, la base A⁻ consomme les acides ajoutés</li>],
          titrage: [<li key="1">titrage : C<sub>a</sub>V₀ = C<sub>b</sub>V<sub>eq</sub> ; à V<sub>eq</sub>/2, pH = pKa</li>, <li key="2">l’indicateur coloré convient si sa zone de virage contient le pH à l’équivalence</li>],
        }[partie]}
      </ul>
    </ARetenir>);

  const colonne = reglagesVisibles || mesuresVisibles || incertBox;
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .acb-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .acb-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .acb-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .acb-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); }
        .acb-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (prefers-reduced-motion: no-preference) { .acb-in { animation: acb-in .45s ease-out; } @keyframes acb-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } } }
        @media (min-width: 901px) { .acb-l1.cote .acb-carte { order: 2; } .acb-l1.cote .acb-main { order: 1; } }
        @media (max-width: 900px) { .acb-l1.cote, .acb-pri { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>{TITRES[partie]}</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      {!enGuide && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>{INTROS[partie]}</div>}
      <div className={`acb-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {enGuide ? <div className="acb-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="acb-carte">{panneauHypo}</div> : null}
        <div className="acb-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === D1 ? suivi1 : suivi2}/></div>}
          <div className={`acb-pri${mode !== 'explore' || !sceneVisible ? ' pile' : ''}`}>
            {sceneBox}
            {colonne && (!enGuide || depuis(GR[partie])) && <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reglagesVisibles && (!enGuide || depuis(GR[partie])) && <div className="acb-in">{reglages}</div>}
              {mesuresVisibles && (!enGuide || depuis(GM[partie])) && <div className="acb-in">{mesures}</div>}{incertBox}</div>}
          </div>
        </div>
      </div>
      {mode === 'explore' && <div className="acb-l2">{panneauHypo}{aEssayer}{retenir}</div>}
    </div>
  );
}
