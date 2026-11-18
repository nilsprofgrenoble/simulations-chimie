import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, ARetenir, LigneMesure, IndiceDefi, Curseur } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./tamponModele";
import { QCM_PARCOURS as Q } from "./tamponQcm";
import { SceneBechers, Composition, CourbeAjout, SvgResisteCarte, SvgAcideCarte, SvgBaseCarte, SvgDilCarte, SvgMelangeCarte, SvgLimiteCarte } from "./tamponSchemas";

const SIM_ID = 131, CLE_GUIDE = 'tampon-tg-guide-v1';
declarerDefis(SIM_ID, [['tampon', 'Reconnaître la solution tampon'], ['couple', 'Choisir le couple et le rapport pour un pH visé']]);

// ====================================================
// SIM 131 — LA SOLUTION TAMPON (TG spé PC, chapitre « Prévoir l'état final », sous-partie « Comparer la force des acides et des bases »).
//  Une seule idée : un tampon (acide faible + base conjuguée) fait varier le pH très peu quand on ajoute un peu d'acide, de base, ou de l'eau.
//  Troisième simulation de cette sous-partie (après la 129 : Ka et force des acides, et la 130 : prédominance, distribution, indicateurs).
//  Capacité visée (jamais affichée à l'élève) : « Citer les propriétés d'une solution tampon ».
//  Modèle de calcul : tamponModele.js (réutilise acidesBasesModele.js sans le modifier).
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const volTxt = V => (V >= 1000 ? `${nbf(V / 1000, V % 1000 === 0 ? 0 : 2)}${NB}L` : `${nbf(V, 0)}${NB}mL`);
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#475569' };
const PRESET = { c: 'ch3', Ctot: 0.20, x: 0.5, v: 0, k: 1, vs: {}, ks: 1 };
const V_DEF = { eau: 0, tampon: 0, agent: -10, base: 0, dilution: 0, melange: 0, limite: 0, bilan: 0 };

const Esp = ({ children }) => <span style={{ whiteSpace: 'nowrap' }}>{children}</span>;

// ====================================================
export function SimulationTampon() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviT, noterT] = useCompteurDefi(), [suiviC, noterC] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('tampon');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ tampon: false, curseurs: false, essayer: false, retenir: false });
  const [ti, setTi] = useState(PRESET);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;
  const setT = f => setTi(s => ({ ...s, ...f }));

  // ---------- étapes du parcours ----------
  const IDS = ['eau', 'tampon', 'agent', 'base', 'dilution', 'melange', 'limite', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => !enGuide || etape > IDS.indexOf(id), deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- situation affichée ----------
  const cp = M.COUPLES[enGuide ? 'ch3' : ti.c];
  const Ctot = enGuide ? 0.20 : ti.Ctot, xb = enGuide ? 0.5 : ti.x;
  const v = enGuide ? (ti.vs[idE] ?? V_DEF[idE]) : ti.v, k = enGuide ? (idE === 'dilution' ? ti.ks : 1) : ti.k;
  const P = { pKa: cp.pKa, ...M.quantites(Ctot, xb) }, va = v < 0 ? -v : 0, vb = v > 0 ? v : 0, ve = (k - 1) * M.V0;
  const ph0 = M.pHTampon(P), phT = M.pHTampon({ ...P, va, vb, ve }), phE = M.pHEau({ va, vb, ve }), Vt = M.volumeTotal({ va, vb, ve });
  const comp = M.composition({ ...P, va, vb, ve });
  const setV = nv => (enGuide ? setT({ vs: { ...ti.vs, [idE]: nv } }) : setT({ v: nv }));
  const setK = nk => (enGuide ? setT({ ks: nk }) : setT({ k: nk }));

  const bloqueAcide = v === -10 ? null : 'Versez d’abord 10 mL d’acide avec le bouton « Verser 10 mL d’acide ».';
  const bloqueSoude = v === 10 ? null : 'Versez d’abord 10 mL de soude avec le bouton « Verser 10 mL de soude ».';
  const bloqueDil = k === 10 ? null : 'Choisissez d’abord « × 10 » avec les boutons de dilution.';
  const bloqueLim = v <= -120 ? null : 'Avec le curseur « Acide versé », versez au moins 120 mL d’acide.';

  // ---------- formules ----------
  const ETAPES = [
    { id: 'eau', titre: 'Un peu d’acide dans de l’eau pure', focus: ['scene', 'reglage'],
      texte: <>Un bécher contient 100{NB}mL d’eau pure : son pH vaut 7,00 à 25{NB}°C. Avec le bouton « Verser 10 mL d’acide », on y ajoute 10{NB}mL d’acide chlorhydrique à 0,10{NB}mol·L⁻¹, soit 1,0{NB}mmol d’ions H₃O⁺. Le pH-mètre (afficheur noir) indique le pH.</>,
      tache: { type: 'num', q: 'Baisse du pH de l’eau pure après l’ajout (valeur positive)', unite: 'unités de pH', vrai: M.variation(7, M.pHEau({ va: 10 })), tol: 0.02, affiche: x => nbf(x, 1), cs: 2, bloque: bloqueAcide,
        calcul: () => ['pH avant l’ajout : 7,00 ; pH lu après l’ajout : 2,04.', 'Baisse = 7,00 − 2,04 = 4,96 ≈ 5,0 unités de pH : l’eau pure ne « résiste » pas.'],
        pieges: [[2.04, 'C’est le pH final ; on demande la variation du pH : soustrayez-le au pH initial 7,00.'], [9.04, 'Vous avez additionné les deux valeurs au lieu de les soustraire.'], [7, 'C’est le pH initial de l’eau pure, pas la variation du pH.']],
        expl: '1,0 mmol d’ions H₃O⁺ dans 110 mL donnent [H₃O⁺] = 9,1×10⁻³ mol·L⁻¹, soit pH = 2,04. Le pH de l’eau a baissé de 4,96 unités.', indice: 'Lisez le pH avant (7,00) et après l’ajout sur l’afficheur, puis calculez la différence : pH initial − pH final.' } },
    { id: 'tampon', titre: 'Le même ajout dans un tampon', focus: ['scene', 'reglage'],
      texte: <>Un second bécher contient 100{NB}mL d’un mélange de 10,0{NB}mmol d’acide éthanoïque CH₃COOH et de 10,0{NB}mmol d’ions éthanoate CH₃COO⁻ (ajoutés sous forme d’éthanoate de sodium) : c’est une <strong>solution tampon</strong>. Le pK<sub>A</sub> du couple vaut 4,76. Faites la même manipulation : versez 10{NB}mL d’acide dans chaque bécher et comparez les deux pH-mètres.</>,
      tache: { type: 'qcm', q: 'Dans le tampon, après l’ajout de 10 mL d’acide, le pH…', ...Q.tampon, bloque: bloqueAcide,
        expl: 'Le pH du tampon passe de 4,76 à 4,67 : il varie de 0,09 unité seulement, contre environ 5 unités pour l’eau pure. C’est la propriété essentielle d’une solution tampon.', indice: 'Comparez les deux afficheurs : de combien le pH du tampon a-t-il bougé, par rapport à celui de l’eau ?' } },
    { id: 'agent', titre: 'Qui consomme l’acide ajouté ?', focus: ['mesures'],
      retenirTitre: 'À RETENIR : UN TAMPON RÉSISTE',
      retenir: <>
        <SvgResisteCarte/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Une <strong>solution tampon</strong> est une solution dont le <strong>pH varie très peu</strong> quand on y ajoute une petite quantité d’acide ou de base.</li>
          <li>Exemple de la simulation : + 10 mL d’acide dans 100 mL, le pH de l’eau chute d’environ 5 unités, celui du tampon de moins de 0,1.</li>
          <li>Moyen de s’en souvenir : <strong>« le tampon amortit les chocs de pH »</strong>. Idée fausse : « un tampon garde le pH constant quoi qu’on ajoute ». Vrai : il résiste à un ajout modéré.</li>
        </ul></>,
      texte: <>Le tampon contient la forme acide CH₃COOH et la forme basique CH₃COO⁻. Les ions oxonium H₃O⁺ versés sont un acide : ils réagissent avec une base, selon une réaction quasi totale. Le panneau « Mesures » vous donne maintenant les variations de pH des deux béchers.</>,
      tache: { type: 'qcm', q: 'Quelle espèce du tampon consomme les ions H₃O⁺ ajoutés ?', ...Q.agent,
        expl: 'Les ions H₃O⁺ sont un acide : ils réagissent avec la base du couple, CH₃COO⁻ : CH₃COO⁻ + H₃O⁺ → CH₃COOH + H₂O. La base A⁻ est consommée et l’acide AH formé prend sa place.', indice: 'Un acide réagit avec une base. Quelle espèce du tampon est la base ?' } },
    { id: 'base', titre: 'Et si on ajoute une base ?', focus: ['compo', 'reglage'],
      retenirTitre: 'À RETENIR : A⁻ CONSOMME L’ACIDE AJOUTÉ',
      retenir: <>
        <SvgAcideCarte/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Les H₃O⁺ ajoutés réagissent avec la <strong>base conjuguée A⁻</strong> : A⁻ + H₃O⁺ → AH + H₂O. Il y a un peu moins de A⁻, un peu plus de AH.</li>
          <li>Exemple de la simulation : 1,0 mmol d’acide ajouté, A⁻ passe de 10,0 à 9,0 mmol, AH de 10,0 à 11,0 mmol.</li>
          <li>Moyen de s’en souvenir : <strong>« A⁻ attrape les H⁺ ajoutés »</strong>. Piège : « l’acide ajouté reste libre en solution ». Vrai : il est consommé, le pH ne chute pas.</li>
        </ul></>,
      texte: <>Les barres montrent les quantités de CH₃COOH et de CH₃COO⁻ avant (contour pointillé) et après (barre pleine) l’ajout. Remettez un bécher neuf, puis versez 10{NB}mL de soude à 0,10{NB}mol·L⁻¹, soit 1,00{NB}mmol d’ions HO⁻. Ils réagissent avec l’acide du tampon : CH₃COOH + HO⁻ → CH₃COO⁻ + H₂O (réaction quasi totale). Le tampon contenait 10,0{NB}mmol de CH₃COOH.</>,
      tache: { type: 'num', q: 'Quantité de CH₃COOH restant après l’ajout de la soude', unite: 'mmol', vrai: 9.0, tol: 0.005, affiche: x => nbf(x, 2), cs: 3, bloque: bloqueSoude,
        calcul: () => ['n(HO⁻) versée = 0,10 mol·L⁻¹ × 10 mL = 1,00 mmol, qui consomme 1,00 mmol de CH₃COOH.', 'n(CH₃COOH) = 10,0 − 1,00 = 9,00 mmol (et n(CH₃COO⁻) = 10,0 + 1,00 = 11,0 mmol).'],
        pieges: [[11, 'C’est la quantité de CH₃COO⁻ formé, pas celle de CH₃COOH qui reste.'], [10, 'Vous n’avez pas tenu compte de la réaction : CH₃COOH est consommé par les ions HO⁻.'], [1, 'C’est la quantité de HO⁻ versée ; retranchez-la aux 10,0 mmol de départ.']],
        expl: 'CH₃COOH + HO⁻ → CH₃COO⁻ + H₂O : chaque mole de HO⁻ consomme une mole de CH₃COOH. Il en reste 10,0 − 1,00 = 9,00 mmol.', indice: 'La réaction est quasi totale et mole à mole : n(CH₃COOH) final = n initial − n(HO⁻) versé.' } },
    { id: 'dilution', titre: 'Diluer le tampon', focus: ['reglage', 'scene'],
      retenirTitre: 'À RETENIR : AH CONSOMME LA BASE AJOUTÉE',
      retenir: <>
        <SvgBaseCarte/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Les HO⁻ ajoutés réagissent avec l’<strong>acide AH</strong> : AH + HO⁻ → A⁻ + H₂O. Il y a un peu moins de AH, un peu plus de A⁻.</li>
          <li>Exemple de la simulation : 1,00 mmol de base ajoutée, AH passe de 10,0 à 9,00 mmol, A⁻ de 10,0 à 11,0 mmol.</li>
          <li>Moyen de s’en souvenir : <strong>« AH donne son H⁺ à HO⁻ »</strong>. Un tampon a donc deux « réserves » : A⁻ contre les acides, AH contre les bases.</li>
        </ul></>,
      texte: <>On revient à 100{NB}mL de chaque solution, sans rien verser. On ajoute maintenant de l’eau pure : le bouton « × 10 » complète à 1,00{NB}L (900{NB}mL d’eau ajoutés). Les quantités de CH₃COOH et de CH₃COO⁻ sont les mêmes, réparties dans un volume dix fois plus grand. Observez les deux pH-mètres.</>,
      tache: { type: 'qcm', q: 'Après dilution par 10, le pH du tampon…', ...Q.dilution, bloque: bloqueDil,
        expl: 'Les quantités de CH₃COOH et de CH₃COO⁻ restent égales : le rapport [A⁻] / [AH] vaut toujours 1, donc le pH reste voisin du pK_A = 4,76. Le pH d’un tampon ne dépend presque pas d’une dilution modérée.', indice: 'La dilution divise les deux concentrations par 10. Que devient leur rapport [A⁻] / [AH] ?' } },
    { id: 'melange', titre: 'Fabriquer un tampon', focus: [],
      retenirTitre: 'À RETENIR : LA DILUTION',
      retenir: <>
        <SvgDilCarte/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Une <strong>dilution modérée</strong> ne change pas le rapport [A⁻] / [AH] : le pH du tampon reste voisin de son pK<sub>A</sub> (ici 4,76 avant et après).</li>
          <li>Exemple de la simulation : × 10, le pH reste 4,76 ; l’eau pure, elle, reste à 7,00 mais ne résiste à rien.</li>
          <li>Moyen de s’en souvenir : <strong>« diluer, c’est changer le volume, pas le rapport »</strong>. Limite : une dilution énorme (× 1000) finit par décaler le pH (voir l’exploration).</li>
        </ul></>,
      texte: <>On dispose de solutions que l’on peut mélanger dans l’eau. Une solution tampon se prépare avec un <strong>couple acide-base</strong> complet : la forme acide ET la forme basique, en quantités voisines.</>,
      tache: { type: 'qcm', q: 'Quel mélange constitue une solution tampon ?', ...Q.melange,
        expl: 'Un tampon contient un acide faible et sa base conjuguée en quantités voisines : CH₃COOH et CH₃COO⁻. HCl est un acide fort et Cl⁻ une base indifférente : pas de couple faible. L’acide éthanoïque seul ou NaCl seul n’ont qu’une seule des deux réserves, voire aucune.', indice: 'Il faut les deux formes d’un même couple acide-base faible, en quantités voisines. Repérez le couple dans chaque proposition.' } },
    { id: 'limite', titre: 'Jusqu’où un tampon résiste-t-il ?', focus: ['reglage', 'courbe'],
      retenirTitre: 'À RETENIR : COMPOSITION D’UN TAMPON',
      retenir: <>
        <SvgMelangeCarte/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Un tampon = un <strong>acide faible AH</strong> et sa <strong>base conjuguée A⁻</strong>, en quantités comparables (rapport de 0,1 à 10). Son pH est alors voisin du <strong>pK<sub>A</sub></strong>, exactement égal si les quantités sont égales.</li>
          <li>Exemple de la simulation : 10,0 mmol de CH₃COOH et 10,0 mmol de CH₃COO⁻ : pH = pK<sub>A</sub> = 4,76.</li>
          <li>Moyen de s’en souvenir : <strong>« les deux frères du couple, ensemble »</strong>. Idée fausse : « un tampon a un pH neutre (7) ». Vrai : son pH est proche de son pK<sub>A</sub>.</li>
        </ul></>,
      texte: <>Un tampon n’est pas inépuisable. Les curseurs permettent de verser jusqu’à 150{NB}mL d’acide ou de soude à 0,10{NB}mol·L⁻¹ ; la courbe montre le pH de l’eau pure (tirets gris) et du tampon (trait orange) selon le volume versé. Le tampon contient 10,0{NB}mmol de CH₃COO⁻.</>,
      tache: { type: 'qcm', q: 'Pourquoi le pH du tampon chute-t-il après un grand ajout d’acide ?', ...Q.limite, bloque: bloqueLim,
        expl: 'À partir de 100 mL d’acide versé (10 mmol de H₃O⁺), toute la base CH₃COO⁻ du tampon est consommée : il ne reste que CH₃COOH, et l’acide ajouté en excès fait chuter le pH. Un tampon résiste tant qu’il reste les deux formes du couple.', indice: 'Les 120 mL d’acide apportent 12 mmol de H₃O⁺. Comparez avec les 10,0 mmol de CH₃COO⁻ du tampon.' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À RETENIR : LES LIMITES D’UN TAMPON',
      retenir: <>
        <SvgLimiteCarte/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Un tampon résiste à un ajout <strong>modéré</strong> d’acide ou de base : le plateau s’arrête quand toute la base A⁻ (ajout d’acide) ou tout l’acide AH (ajout de base) est consommé.</li>
          <li>Exemple de la simulation : le tampon de 10,0 mmol de chaque forme tient jusqu’à environ 100 mL d’acide ou de soude à 0,10 mol·L⁻¹, puis le pH s’effondre.</li>
          <li>Moyen de s’en souvenir : <strong>« un amortisseur n’est pas un mur »</strong>. Plus le tampon est concentré, plus le plateau est long.</li>
        </ul></>,
      texte: <>Vous savez citer les propriétés d’une solution tampon : mélange d’un acide faible et de sa base conjuguée en quantités voisines ; pH voisin du pK<sub>A</sub> ; pH qui varie très peu par ajout modéré d’acide ou de base et par dilution modérée ; limites quand l’une des deux formes est épuisée. Passez à l’exploration (concentration, composition, volumes versés) ou tentez les deux défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'tampon'
    ? { type: 'tampon', ...M.tirageDefiTampon(), essais: { acide: false, soude: false }, reps: { choix: null, dv: '' }, verifie: false }
    : { type: 'couple', ...M.tirageDefiCouple(), reps: { choix: null, r: '' }, verifie: false });
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
    if (md === 'guide') setTi(PRESET);
    if (md === 'explore') setTi(s => ({ ...PRESET, ...s }));
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'tampon') {
      const x = lireNombre(defi.reps.dv), ok = defi.reps.choix === defi.vrai && isFinite(x) && Math.abs(x - defi.varAcide) <= 0.02;
      setDefi(d => ({ ...d, verifie: true, ok })); noterT(ok);
    } else {
      const x = lireNombre(defi.reps.r), ok = defi.reps.choix === defi.vrai && isFinite(x) && Math.abs(x - defi.ratio) / defi.ratio <= 0.06;
      setDefi(d => ({ ...d, verifie: true, ok })); noterC(ok);
    }
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const cellule = { padding: '4px 6px', borderBottom: `1px solid ${KIT.bord}`, textAlign: 'center', fontSize: 13.5, color: KIT.txt };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['tampon', 'Reconnaître le tampon'], ['couple', 'Préparer un tampon de pH visé']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'tampon' ? 'Défi : lequel de ces trois béchers est une solution tampon ?' : 'Défi : quel couple et quel rapport pour ce pH ?'}</div>
      {defi.type === 'tampon' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Trois béchers A, B et C contiennent chacun 100{NB}mL de solution ; un seul est une solution tampon. Versez 10{NB}mL d’acide chlorhydrique, ou 10{NB}mL de soude, à 0,10{NB}mol·L⁻¹ dans chaque bécher (béchers neufs pour chaque essai) et lisez les pH. Indiquez le tampon, puis la variation de son pH après l’ajout d’acide (valeur positive, à 0,02 unité près).</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <button onClick={() => setDefi(d => ({ ...d, essais: { ...d.essais, acide: true } }))} style={styleBouton(!defi.essais.acide, '#b45309')}>Verser 10 mL d’acide</button>
          <button onClick={() => setDefi(d => ({ ...d, essais: { ...d.essais, soude: true } }))} style={styleBouton(!defi.essais.soude, '#0369a1')}>Verser 10 mL de soude</button>
        </div>
        <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 440, marginBottom: 8 }} aria-label="Mesures de pH des trois béchers">
          <thead><tr>{['Bécher', 'pH initial', 'pH après acide', 'pH après soude'].map(h => <th key={h} style={{ ...cellule, fontWeight: 700, background: KIT.fond }}>{h}</th>)}</tr></thead>
          <tbody>{defi.bechers.map(b => <tr key={b.lettre}>
            <td style={{ ...cellule, fontWeight: 700 }}>{b.lettre}</td><td style={cellule}>{nbf(b.ph0, 2)}</td>
            <td style={cellule}>{defi.essais.acide ? nbf(b.phA, 2) : '?'}</td><td style={cellule}>{defi.essais.soude ? nbf(b.phB, 2) : '?'}</td></tr>)}</tbody>
        </table>
        <div role="group" aria-label="Bécher tampon" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 14 }}>Le tampon est le bécher :</span>
          {defi.bechers.map((b, i) => <button key={b.lettre} onClick={() => setDefi(d => ({ ...d, reps: { ...d.reps, choix: i }, verifie: false }))} aria-pressed={defi.reps.choix === i}
            style={stylePetitBouton(defi.reps.choix === i, defi.verifie ? (defi.vrai === i ? '#15803d' : '#dc2626') : '#475569')}>{b.lettre}</button>)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Variation du pH du tampon (acide) =</span>
          <input value={defi.reps.dv} aria-label="Variation du pH du tampon après l’ajout d’acide" onKeyDown={e => e.key === 'Enter' && document.getElementById('tp-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, dv: e.target.value }, verifie: false }))} inputMode="decimal"
            style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>unité de pH</span>
        </div>
        <IndiceDefi cache={false}>Un tampon est le bécher dont le pH varie très peu à la fois quand on ajoute de l’acide et quand on ajoute de la base. La variation de pH est la valeur absolue de la différence : |pH après − pH initial|.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>On veut préparer un tampon de pH <strong>{nbf(defi.pHvise, 1)}</strong> à partir d’un des trois couples ci-dessous. Choisissez le couple le plus adapté (son {avecIndices('pK_A')} doit être proche du pH visé), puis calculez le rapport n(A⁻) / n(AH) à introduire (2 chiffres significatifs).</div>
        <div role="group" aria-label="Couple choisi" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {defi.cand.map((c, i) => <button key={c.AH} onClick={() => setDefi(d => ({ ...d, reps: { ...d.reps, choix: i }, verifie: false }))} aria-pressed={defi.reps.choix === i}
            style={stylePetitBouton(defi.reps.choix === i, defi.verifie ? (defi.vrai === i ? '#15803d' : '#dc2626') : '#475569')}>{c.AH} / {c.A} ({avecIndices(`pK_A = ${nbf(c.pKa, 2)}`)})</button>)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>n(A⁻) / n(AH) =</span>
          <input value={defi.reps.r} aria-label="Rapport n(A moins) sur n(AH)" onKeyDown={e => e.key === 'Enter' && document.getElementById('tp-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, r: e.target.value }, verifie: false }))} inputMode="decimal"
            style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>(sans unité)</span>
        </div>
        <IndiceDefi cache={false}>Le pH d’un tampon est voisin du pK<sub>A</sub> de son couple. Pour un couple donné, [A⁻] / [AH] = 10<sup>pH − pK<sub>A</sub></sup> (relation de la simulation sur les diagrammes de prédominance) ; les deux formes sont dans le même volume, donc n(A⁻) / n(AH) a la même valeur.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="tp-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'tampon'
          ? (defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + `Le tampon est le bécher ${defi.bechers[defi.vrai].lettre} (${defi.bechers[defi.vrai].nom}) : son pH varie de ${nbf(defi.varAcide, 2)} avec l’acide et de ${nbf(defi.varBase, 2)} avec la soude. Les autres : ` + defi.bechers.filter(b => b.id !== 'tampon').map(b => `${b.lettre} = ${b.nom}`).join(', ') + '.'
          : (defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + `Le couple dont le pK_A est le plus proche de ${nbf(defi.pHvise, 1)} est ${defi.cand[defi.vrai].AH} / ${defi.cand[defi.vrai].A} (pK_A = ${nbf(defi.cand[defi.vrai].pKa, 2)}). Rapport = 10^(${nbf(defi.pHvise, 1)} − ${nbf(defi.cand[defi.vrai].pKa, 2)}) = ${nbf(defi.ratio, defi.ratio < 1 ? 2 : 1)} (marge acceptée : ± 6 %).`}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Température constante : 25 °C</strong> ; activités ≈ concentrations (solutions diluées, divisées par c° = 1 mol·L⁻¹).</li>
      <li><strong>Béchers de 100 mL</strong> ; l’acide chlorhydrique et la soude versés sont à 0,10 mol·L⁻¹, totalement dissociés ; les volumes s’additionnent.</li>
      <li><strong>Un seul couple acide-base</strong> par tampon (éthanoïque, pK<sub>A</sub> = 4,76, ou ion ammonium, pK<sub>A</sub> = 9,20) : pas de polyacide, pas d’acide α-aminé. Le pK<sub>A</sub> est une donnée, non à retrouver.</li>
      <li><strong>Le pH est calculé « exactement »</strong> (conservation de la charge, autoprotolyse de l’eau comprise) par le modèle de la simulation sur les acides et les bases, et non par une formule approchée. Les relations du cours (rapport [A⁻] / [AH] = 10<sup>pH − pK<sub>A</sub></sup>) en sont de bonnes approximations quand les concentrations sont assez élevées.</li>
      <li><strong>Dilution</strong> : seule une dilution modérée laisse le pH presque inchangé ; vers × 1000 et au-delà, l’eau et l’ionisation de l’acide ne sont plus négligeables et le pH dérive (voir l’exploration).</li>
      <li><strong>Pas de CO₂ dissous</strong> ; pH-mètre idéal (parfaitement étalonné, sans incertitude de mesure).</li>
      <li><strong>Limites</strong> : on ne calcule pas de « pouvoir tampon » (hors programme) ; « varie peu » signifie ici moins de 0,2 unité de pH pour les ajouts proposés.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- réglages ----------
  const peutAcide = enExplore || (enGuide && ['eau', 'tampon', 'agent', 'base'].includes(idE)), peutSoude = enExplore || (enGuide && idE === 'base');
  const peutDil = enExplore || (enGuide && idE === 'dilution'), peutCurseurs = enExplore || (enGuide && idE === 'limite');
  const boutonsAjout = (peutAcide || peutSoude) && (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
      {peutAcide && <button onClick={() => setV(-10)} aria-pressed={v === -10} style={stylePetitBouton(v === -10, '#b45309')}>Verser 10 mL d’acide</button>}
      {peutSoude && <button onClick={() => setV(10)} aria-pressed={v === 10} style={stylePetitBouton(v === 10, '#0369a1')}>Verser 10 mL de soude</button>}
      <button onClick={() => setV(0)} aria-pressed={v === 0} style={stylePetitBouton(v === 0, '#475569')}>Bécher neuf (0 mL)</button>
    </div>);
  const boutonsDil = peutDil && (
    <div role="group" aria-label="Dilution" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
      <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Dilution</span>
      {(enExplore ? [1, 2, 10, 100, 1000] : [1, 2, 10]).map(f => <button key={f} onClick={() => setK(f)} aria-pressed={k === f} style={stylePetitBouton(k === f, '#0f766e')}>{f === 1 ? 'pas de dilution' : `× ${f}`}</button>)}
    </div>);
  const reglages = !enExplore && (peutAcide || peutSoude || peutDil || peutCurseurs) && (
    <div style={{ ...styleBoite, ...cadre('reglage') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages de l’expérience</div>
      {enExplore && <>
        <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 4, lineHeight: 1.5 }}>1. Préparez le tampon : couple, concentration totale et part de la forme basique (50 % : quantités égales).</div>
        <div role="group" aria-label="Couple du tampon" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {M.ORDRE.map(id => <button key={id} onClick={() => setT({ c: id })} aria-pressed={ti.c === id} style={stylePetitBouton(ti.c === id, '#0f766e')}>{M.COUPLES[id].AH} / {M.COUPLES[id].A}</button>)}
        </div>
        <Curseur nom="Concentration totale du tampon (AH + A⁻)" valeur={ti.Ctot} onChange={c => setT({ Ctot: Math.round(c * 100) / 100 })} min={0.02} max={0.5} pas={0.01} decimales={2} unite="mol/L"/>
        <Curseur nom="Part de la forme basique A⁻ dans le tampon" valeur={Math.round(ti.x * 100)} onChange={p => setT({ x: p / 100 })} min={5} max={95} pas={5} unite="%"/>
        <div style={{ fontSize: 13.5, color: KIT.txt2, margin: '4px 0', lineHeight: 1.5 }}>2. Versez de l’acide ou de la soude (0,10 mol·L⁻¹), ou diluez : l’eau pure subit les mêmes ajouts.</div>
      </>}
      {boutonsAjout}
      {peutCurseurs && <>
        <Curseur nom="Acide versé" valeur={va} onChange={a => setV(a === 0 ? 0 : -a)} min={0} max={150} pas={5} unite="mL"/>
        <Curseur nom="Soude versée" valeur={vb} onChange={b => setV(b === 0 ? 0 : b)} min={0} max={150} pas={5} unite="mL"/>
      </>}
      {boutonsDil}
    </div>);

  // ---------- exploration : menus déroulants et blocs repliables ----------
  const ouvre = c => ouv[c], bascule = c => setOuv(o => ({ ...o, [c]: !o[c] }));
  const menuSt = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box', marginTop: 2 };
  const liste = (nom, valeur, options, onChange) => (
    <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, minWidth: 0 }}>{nom}
      <select value={valeur} onChange={e => onChange(e.target.value)} style={menuSt}>{options.map(o => <option key={o.v} value={o.v}>{o.t}</option>)}</select>
    </label>);
  const resumeTampon = `${cp.AH} / ${cp.A} · ${nbf(ti.Ctot, 2)}${NB}mol/L · ${Math.round(ti.x * 100)}${NB}% de ${cp.A}`;
  const reglagesEx = enExplore && (
    <div className="tp-col">
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>1. Préparer le tampon</div>
        <Section titre={<span><span style={{ display: 'block' }}>Couple, concentration, composition</span><span style={{ display: 'block', fontSize: 13, fontWeight: 400, color: KIT.txt2, marginTop: 2 }}>{resumeTampon}</span></span>} ouvert={ouvre('tampon')} onBascule={() => bascule('tampon')}>
          {liste('Couple du tampon', ti.c, M.ORDRE.map(id => ({ v: id, t: `${M.COUPLES[id].AH} / ${M.COUPLES[id].A}` })), v => setT({ c: v }))}
          <div style={{ fontSize: 13, color: KIT.txt2, margin: '8px 0 2px', lineHeight: 1.4 }}>Part de la forme basique : 50 % signifie des quantités égales de AH et A⁻.</div>
          <Curseur nom="Concentration totale (AH + A⁻)" valeur={ti.Ctot} onChange={c => setT({ Ctot: Math.round(c * 100) / 100 })} min={0.02} max={0.5} pas={0.01} decimales={2} unite="mol/L"/>
          <Curseur nom="Part de la forme basique A⁻" valeur={Math.round(ti.x * 100)} onChange={p => setT({ x: p / 100 })} min={5} max={95} pas={5} unite="%"/>
        </Section>
      </div>
      <div style={styleBoite}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>2. Verser ou diluer</div>
        <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 8, lineHeight: 1.4 }}>Acide ou soude à 0,10 mol·L⁻¹ ; l’eau pure subit les mêmes ajouts.</div>
        {boutonsAjout}
        {liste('Dilution', String(k), [1, 2, 10, 100, 1000].map(f => ({ v: String(f), t: f === 1 ? 'pas de dilution' : `× ${f}` })), x => setK(Number(x)))}
        <div style={{ marginTop: 8 }}>
          <Section titre="Volumes précis (curseurs)" ouvert={ouvre('curseurs')} onBascule={() => bascule('curseurs')}>
            <Curseur nom="Acide versé" valeur={va} onChange={a => setV(a === 0 ? 0 : -a)} min={0} max={150} pas={5} unite="mL"/>
            <Curseur nom="Soude versée" valeur={vb} onChange={b => setV(b === 0 ? 0 : b)} min={0} max={150} pas={5} unite="mL"/>
          </Section>
        </div>
      </div>
    </div>);

  // ---------- scène, composition, courbe ----------
  const items = [{ titre: `Eau pure · ${volTxt(Vt)}`, pH: phE, V: Vt, sous: 'H₂O seule' }];
  if (enExplore || deja('tampon')) items.push({ titre: `Tampon · ${volTxt(Vt)}`, pH: phT, V: Vt, sous: `${cp.AH} / ${cp.A}`, couleur: '#fed7aa' });
  const boxScene = !dd && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Les béchers et le pH-mètre</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>À gauche, de l’eau pure ; à droite, le tampon que vous avez préparé. Les deux reçoivent les mêmes ajouts : l’afficheur noir donne le pH.</div>}
      <SceneBechers items={items}/>
    </div>);
  const boxCompo = !dd && (enExplore || deja('base')) && (
    <div style={{ ...styleBoite, ...cadre('compo') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Ce que contient le tampon</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Quantités de la forme acide et de la forme basique du tampon : en pointillés avant les ajouts, en plein maintenant. Quand on verse de l’acide, que devient A⁻ ?</div>}
      <Composition AH={cp.AH} A={cp.A} a0={P.nAH} b0={P.nA} a1={comp.nAH} b1={comp.nA} nombres={enExplore || apres('base')}/>
    </div>);
  const boxCourbe = !dd && (enExplore || deja('limite')) && (
    <div style={{ ...styleBoite, ...cadre('courbe') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Le pH selon le volume versé</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>À gauche, de l’acide versé ; à droite, de la soude. Le trait orange est le tampon, les tirets gris l’eau pure ; la bande orange pâle marque pK<sub>A</sub> ± 1. Les points suivent vos réglages.</div>}
      <CourbeAjout pts={M.courbeAjout({ ...P, ve }, 150, 151)} v={v} phT={phT} phE={phE} pKa={cp.pKa} AH={cp.AH} A={cp.A}/>
    </div>);

  // ---------- mesures et réactions ----------
  const mesures = !dd && (enExplore || apres('tampon')) && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Variation du pH par rapport au bécher neuf (valeur absolue) et quantités de matière du tampon.</div>}
      <LigneMesure nom="Volume de chaque bécher" valeur={volTxt(Vt)}/>
      {(enExplore || apres('eau')) && <LigneMesure nom="Variation du pH de l’eau pure" valeur={`${nbf(M.variation(7, phE), 2)}${NB}unité`} couleur={COL.gris}/>}
      <LigneMesure nom="Variation du pH du tampon" valeur={`${nbf(M.variation(ph0, phT), 2)}${NB}unité`} couleur={COL.orange}/>
      {(enExplore || apres('base')) && <>
        <LigneMesure nom={`Quantité de ${cp.AH}`} valeur={`${nbf(comp.nAH, 2)}${NB}mmol`} couleur={COL.bleu}/>
        <LigneMesure nom={`Quantité de ${cp.A}`} valeur={`${nbf(comp.nA, 2)}${NB}mmol`} couleur={COL.orange}/></>}
      {enExplore && <LigneMesure nom="Rapport n(A⁻) / n(AH)" valeur={nbf(comp.nA / comp.nAH, comp.nA / comp.nAH >= 10 ? 0 : 2)}/>}
    </div>);
  const boxReact = !dd && (enExplore || apres('agent')) && (
    <div style={{ ...styleBoite, textAlign: 'center' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Réactions du tampon avec les ajouts</div>
      <div style={{ fontSize: 16, color: KIT.txt, lineHeight: 1.7 }} aria-label="Réactions de la base du tampon avec l’acide ajouté et de l’acide du tampon avec la base ajoutée">
        <div><Esp>{cp.A}</Esp> + <Esp>H₃O⁺</Esp> → <Esp>{cp.AH}</Esp> + <Esp>H₂O</Esp></div>
        {(enExplore || apres('base')) && <div><Esp>{cp.AH}</Esp> + <Esp>HO⁻</Esp> → <Esp>{cp.A}</Esp> + <Esp>H₂O</Esp></div>}
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 4 }}>{avecIndices(`Couple ${cp.AH} / ${cp.A} : pK_A = ${nbf(cp.pKa, 2)} à 25`)}{NB}°C</div>
    </div>);

  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouvre('essayer')} onBascule={() => bascule('essayer')}>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Versez 10 mL d’acide puis 10 mL de soude : de combien le pH du tampon varie-t-il dans chaque cas ? Et celui de l’eau pure ?</li>
        <li>Doublez la concentration du tampon : la variation de pH due à 10 mL d’acide est-elle plus petite ou plus grande ? Pourquoi ?</li>
        <li>Avec le curseur « Acide versé », cherchez le volume à partir duquel le pH du tampon s’effondre. Comparez avec la quantité de A⁻ affichée dans les mesures.</li>
        <li>Réglez la part de A⁻ sur 10 % puis sur 90 % : où est le pH par rapport au pK<sub>A</sub> ? Le tampon résiste-t-il aussi bien à l’acide et à la base ?</li>
        <li>Diluez le tampon × 10, × 100 puis × 1000 : jusqu’où le pH reste-t-il voisin de sa valeur de départ ?</li>
        <li>Passez au couple NH₄⁺ / NH₃ : le pH du tampon est-il encore voisin du pK<sub>A</sub> ?</li>
      </ul>
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées clés)" ouvert={ouvre('retenir')} onBascule={() => bascule('retenir')}>
    <ARetenir titre="IDÉES CLÉS">
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Tampon = acide faible AH + base conjuguée A⁻ en quantités comparables</li>
        <li>pH voisin du pK_A (égal si n(A⁻) = n(AH)) ; zone tampon : pK_A ± 1</li>
        <li>pH qui varie très peu pour un ajout modéré d’acide (consommé par A⁻) ou de base (consommée par AH)</li>
        <li>pH presque inchangé par une dilution modérée (le rapport [A⁻] / [AH] ne change pas)</li>
        <li>Limites : tampon épuisé quand A⁻ ou AH a disparu ; dilution énorme ou ajout excessif</li>
      </ul>
    </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .tp-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .tp-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .tp-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .tp-col { display: flex; flex-direction: column; gap: 12px; }
        .tp-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .tp-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .tp-ex > * { grid-column: 1; } .tp-ex > .tp-ctrl { grid-column: 2; grid-row: 1 / span 6; } }
        @media (min-width: 901px) { .tp-l1.cote .tp-carte { order: 2; } .tp-l1.cote .tp-main { order: 1; } }
        @media (max-width: 900px) { .tp-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .tp-in { animation: tp-fondu 0.35s ease-out; } @keyframes tp-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>La solution tampon : un pH qui résiste</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une <strong>solution tampon</strong> est un mélange d’un acide faible et de sa base conjuguée : son <strong>pH varie très peu</strong> quand on ajoute un peu d’acide, un peu de base, ou de l’eau. Comparez-la à de l’eau pure.</div>
      <div className={`tp-l1${!enExplore ? ' cote' : ''}`}>
        {enGuide ? <div className="tp-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="tp-carte">{panneauHypo}</div> : null}
        <div className="tp-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'tampon' ? suiviT : suiviC}/></div>}
          {!dd && <div className={enExplore ? 'tp-ex' : 'tp-col'}>
            {reglages && <div className="tp-in">{reglages}</div>}
            {boxScene && <div className="tp-in">{boxScene}</div>}
            {enExplore && <div className="tp-ctrl tp-col">{reglagesEx}{aEssayer}{retenirExplore}</div>}
            {mesures && <div className="tp-in">{mesures}</div>}
            {boxCompo && <div className="tp-in">{boxCompo}</div>}
            {boxReact && <div className="tp-in">{boxReact}</div>}
            {boxCourbe && <div className="tp-in">{boxCourbe}</div>}
          </div>}
        </div>
      </div>
      {!enDefi && (!enGuide || deja('bilan')) && <div className="tp-l2">{panneauHypo}</div>}
    </div>
  );
}
