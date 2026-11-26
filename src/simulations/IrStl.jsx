import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, ARetenir, LigneMesure, IndiceDefi, Curseur, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./irTabModele";
import { QCM_PARCOURS as Q } from "./irTabQcm";
import { COL, courbe } from "./irTabCourbes";
import { SpectreIR, FIntervalles, FLireBande, FOhNh, FMethode, FEsterification } from "./irTabSchemas";
import { SvgEnergieCarte } from "./uvVisStlSchemas";
import { energieEv, energieJ } from "./uvVisStlModele";

const SIM_ID = 308, CLE_GUIDE = 'irtstl-guide-v1';
declarerDefis(SIM_ID, [['identifier', 'Identifier une espèce parmi quatre candidates'], ['associer', 'Associer chaque bande à une liaison']]);

// ====================================================
// SIM 308 — SPECTROSCOPIE INFRAROUGE EN TERMINALE STL (SPCL, « Spectroscopies UV-visible, IR et RMN »).
//  Une idée : un photon IR a une énergie E = h c / λ (et σ = 1/λ) ; on lit un spectre IR avec une banque de données (position, allure, intensité des bandes)
//  pour identifier ou confirmer une structure, et suivre une transformation.
//  Capacités visées (jamais affichées à l'élève) : interpréter l'interaction lumière-matière avec E = h c / λ ; identifier ou confirmer une structure à partir d'un spectre IR et de données tabulées.
//  Hors périmètre : UV-visible (sim 307), RMN (sim 306), interprétation de l'empreinte digitale (citée seulement). Modèle : irTabModele.js de la sim 170 (réutilisé sans modification).
// ====================================================
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
// nombres de 4 chiffres écrits sans séparateur (convention des tableaux de spectroscopie), séparateur insécable à partir de 5 chiffres
const mil = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, (m, i, str) => (str.length > 4 ? NB : ''));
const IDS = ['sigma', 'energie', 'lire', 'tableau', 'ch', 'alcool', 'acide', 'amine', 'combiner', 'espece', 'suivi', 'conclure', 'bilan'];
const E5 = energieEv(5000), EJ5 = energieJ(5000);        // photon de λ = 5,00 µm
const sci = (x, d = 2) => { const e = Math.floor(Math.log10(Math.abs(x))), m = x / Math.pow(10, e); return `${nbf(m, d)}×10${[...String(e)].map(ch => ({ '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }[ch])).join('')}`; };
const MOL = M.MOLECULES;
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
// lignes du tableau visibles à chaque étape (on accumule) : un groupe à la fois
const LIGNES_ETAPE = [[], [], [], ['co_ester', 'co_ald_cet', 'co_acide', 'co_amide'], ['ch_tet', 'oh_alcool', 'oh_acide', 'nh'], [], [], [], [], ['ch_trig', 'ch_ald', 'cc'], [], [], []];
const lignesVues = idx => { const v = new Set(); for (let i = 0; i <= idx; i++) LIGNES_ETAPE[i].forEach(x => v.add(x)); return M.TABLE.filter(r => v.has(r.id)); };
const SIG1 = M.minimumBande(MOL.propanone, 1715, 40);          // valeur attendue à l'étape 1 : minimum de la bande C=O de l'échantillon A

// ---------- tableau des données tabulées ----------
const cel = h => ({ border: `1px solid ${KIT.bord}`, padding: '4px 6px', textAlign: 'left', background: h ? '#f1f5f9' : 'transparent', fontSize: 14, verticalAlign: 'top' });
const TableauIR = ({ lignes, surligne = [] }) => (
  <div>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead><tr><th style={cel(true)}>liaison</th><th style={cel(true)}>σ (cm⁻¹) et allure</th></tr></thead>
        <tbody>{lignes.map(r => {
          const on = surligne.includes(r.id);
          return (<tr key={r.id} style={on ? { background: '#fff7ed', outline: `2px solid ${COL.orange}` } : undefined}>
            <td style={cel()}>{on && <span aria-hidden="true">▶ </span>}<strong>{r.liaison}</strong> {r.groupe}</td>
            <td style={cel()}><strong style={{ whiteSpace: 'nowrap' }}>{r.min}{NB}–{NB}{r.max}</strong><br/>{r.inten}, {r.allure}</td></tr>);
        })}</tbody>
      </table>
    </div>
    <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4, lineHeight: 1.4 }}>Intervalles typiques de nombres d’onde, en cm⁻¹. En dessous de 1500 cm⁻¹ : zone de l’empreinte digitale, citée mais non exploitée.</div>
  </div>);

export function SimulationIrStl() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviI, noterI] = useCompteurDefi(), [suiviA, noterA] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('identifier');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ table: false, aide: false, essayer: false, retenir: false, tableDefi: true, compare: false });
  const [ex, setEx] = useState({ mol: 'propanone', mol2: '', curs: 1715, hach: false });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const etape = guide.etape, idx = enGuide ? Math.min(etape, IDS.length - 1) : -1;
  const idE = IDS[Math.max(idx, 0)];

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'sigma', titre: 'Nombre d’onde et longueur d’onde',
      texte: <>En spectroscopie infrarouge, on caractérise un rayonnement par son <strong>nombre d’onde</strong> σ, inverse de la longueur d’onde : <strong>σ = 1 ÷ λ</strong>, exprimé en cm⁻¹ (λ en cm). Un spectromètre balaie l’infrarouge moyen, d’environ 2,5 à 25{NB}µm. On étudie un rayonnement de longueur d’onde <strong>λ = 5,00{NB}µm</strong>.</>,
      tache: { type: 'num', q: 'Quel est le nombre d’onde σ de ce rayonnement, en cm⁻¹ ?', unite: 'cm⁻¹', vrai: 2000, tol: 0.02, affiche: v => mil(v), cs: 3, carnet: 'Nombre d’onde σ du rayonnement',
        calcul: () => ['λ = 5,00 µm = 5,00×10⁻⁴ cm (1 µm = 10⁻⁴ cm).', 'σ = frac(1|λ) = frac(1|5,00×10⁻⁴) = 2,00×10³ cm⁻¹ = 2000 cm⁻¹.'],
        pieges: [[0.2, 'Vous avez calculé 1 ÷ λ avec λ en µm : cela donne des µm⁻¹. Convertissez λ en cm (1 µm = 10⁻⁴ cm) avant de calculer 1 ÷ λ.'], [5e-4, 'Vous avez donné λ en cm : le nombre d’onde est l’inverse de la longueur d’onde.']],
        expl: 'σ = frac(1|λ) = frac(1|5,00×10⁻⁴ cm) = 2000 cm⁻¹.', indice: 'Convertissez d’abord λ en centimètres (1 µm = 10⁻⁴ cm), puis calculez σ = 1 ÷ λ.' } },
    { id: 'energie', titre: 'Énergie d’un photon infrarouge',
      texte: <>Un rayonnement de longueur d’onde λ est fait de photons d’énergie <strong>E = h × c ÷ λ</strong>, avec h = 6,63×10⁻³⁴{NB}J·s, c = 3,00×10⁸{NB}m/s, λ en mètres, et 1{NB}eV = 1,60×10⁻¹⁹{NB}J. Reprenez le rayonnement de longueur d’onde λ = 5,00{NB}µm (σ = 2000{NB}cm⁻¹).</>,
      tache: { type: 'num', q: 'Quelle est l’énergie E d’un photon de ce rayonnement, en eV (3 chiffres significatifs) ?', unite: 'eV', vrai: E5, tol: 0.03, affiche: v => nbf(v, 3), cs: 3, carnet: 'Énergie d’un photon IR',
        calcul: () => ['λ = 5,00 µm = 5,00×10⁻⁶ m.', `E = frac(h × c|λ) = frac(6,63×10⁻³⁴ × 3,00×10⁸|5,00×10⁻⁶) = ${sci(EJ5, 2)} J.`, `E = frac(${sci(EJ5, 2)}|1,60×10⁻¹⁹) = ${nbf(E5, 3)} eV.`],
        pieges: [[EJ5 / 1e-20, 'Vous avez donné E en 10⁻²⁰ J : divisez par 1,60×10⁻¹⁹ J pour obtenir des électronvolts.'], [E5 * 1e6, 'Vous n’avez pas converti λ en mètres : 1 µm = 10⁻⁶ m.']],
        expl: `E = frac(h × c|λ) = ${sci(EJ5, 2)} J = ${nbf(E5, 3)} eV.`, indice: 'Convertissez λ en mètres (1 µm = 10⁻⁶ m), calculez E = h × c ÷ λ en joules, puis divisez par 1,60×10⁻¹⁹ pour les eV.' } },
    { id: 'lire', titre: 'Lire la position d’une bande',
      retenirTitre: 'À RETENIR : LE PHOTON INFRAROUGE',
      retenir: <><SvgEnergieCarte/><ul style={ULS}>
        <li>Nombre d’onde <strong>σ = 1 ÷ λ</strong> (cm⁻¹) ; énergie d’un photon <strong>E = h × c ÷ λ</strong>. Un photon IR est bien moins énergétique qu’un photon visible ou UV.</li>
        <li>Exemple : à λ = 5,00 µm (σ = 2000 cm⁻¹), E ≈ {nbf(E5, 2)} eV, contre environ 3 eV dans le visible bleu : le photon IR fait <strong>vibrer</strong> les liaisons, le photon UV-visible fait changer d’état les électrons.</li>
        <li>Moyen de s’en souvenir : <strong>« grand nombre d’onde, grande énergie »</strong>. Idée fausse : « une grande longueur d’onde, c’est plus d’énergie ». Vrai : l’énergie varie en 1 ÷ λ.</li></ul></>,
      texte: <>Un spectromètre infrarouge a enregistré le spectre d’un liquide pur, l’échantillon A. Le spectre donne la transmittance T en fonction du nombre d’onde σ ; une <strong>bande d’absorption</strong> est un creux. Une bande est très marquée au-dessus de 1500{NB}cm⁻¹.</>,
      tache: { type: 'num', q: 'Lisez le nombre d’onde σ du minimum de cette bande (une petite graduation vaut 100 cm⁻¹).', unite: 'cm⁻¹', vrai: SIG1, tol: 0.025, affiche: v => mil(v), cs: 2, carnet: false,
        calcul: () => ['Le creux le plus profond au-dessus de 1500 cm⁻¹ se trouve entre les graduations 1700 et 1800, tout près de 1700.', 'On lit σ ≈ 1715 cm⁻¹, à ± 30 cm⁻¹ près : c’est la précision d’une lecture sur ce graphique.'],
        pieges: [[Math.round(M.transmittance(MOL.propanone, SIG1)), 'Vous avez lu la transmittance T (axe vertical) : on demande le nombre d’onde σ, lu sur l’axe horizontal.'], [Number((1e4 / SIG1).toFixed(2)), 'Ce nombre ressemble à une longueur d’onde en µm : on demande σ en cm⁻¹, lu directement sur l’axe horizontal.']],
        expl: 'Le minimum de la bande est à σ ≈ 1715 cm⁻¹ (lecture à ± 30 cm⁻¹ près).', indice: 'Repérez le creux le plus profond dans la partie gauche du spectre, entre 1500 et 2000 cm⁻¹, et lisez la graduation sous son minimum.' } },
    { id: 'tableau', titre: 'Que dit le tableau ?',
      texte: <>Les <strong>données tabulées</strong> donnent, pour chaque liaison, un intervalle typique de nombres d’onde. Voici les lignes de la liaison C=O. La bande de l’échantillon A est à σ = 1715{NB}cm⁻¹.</>,
      tache: { type: 'qcm', q: 'Quelles lignes du tableau contiennent cette valeur ?', ...Q.tableau,
        expl: '1715 est compris entre 1705 et 1740 (aldéhyde, cétone) et entre 1700 et 1725 (acide carboxylique) ; il n’est ni dans 1735–1750 (ester) ni dans 1650–1700 (amide).',
        indice: 'Une ligne convient si 1715 est compris entre sa borne basse et sa borne haute.' } },
    { id: 'ch', titre: 'Une petite bande à côté',
      retenirTitre: 'À RETENIR : UN INTERVALLE, PAS UNE VALEUR',
      retenir: <><FIntervalles lue={1715}/><ul style={ULS}>
        <li>Le tableau donne un <strong>intervalle typique</strong>, pas une valeur.</li>
        <li>Dans l’intervalle : groupe <strong>possible</strong>, pas certain.</li></ul></>,
      texte: <>L’échantillon A présente aussi une petite bande fine, de force moyenne, vers σ = 2970{NB}cm⁻¹. Le tableau est complété avec les liaisons C–H, O–H et N–H.</>,
      tache: { type: 'qcm', q: 'À quelle liaison attribuer cette bande ?', ...Q.ch,
        expl: '2970 est dans l’intervalle 2850–3000 de C–H d’un carbone saturé, et la bande est fine, de force moyenne. Il est aussi dans l’intervalle de O–H d’un acide (2500–3200), mais cette bande-là est très large et forte, ce qui n’est pas le cas ici.',
        indice: 'Plusieurs intervalles contiennent 2970 : départagez-les avec la colonne « allure » (fine ou large) et la force de la bande.' } },
    { id: 'alcool', titre: 'Une bande large au-dessus de 3000',
      texte: <>Voici le spectre d’un autre liquide pur, l’échantillon B. Une bande forte et <strong>large</strong> a son minimum vers 3340{NB}cm⁻¹ ; on n’y voit aucune bande vers 1700.</>,
      tache: { type: 'qcm', q: 'À quelle liaison attribuer cette bande ?', ...Q.alcool,
        expl: 'Une bande forte et large dans l’intervalle 3200–3700 est celle de O–H d’un alcool. Les C–H sont plus bas (2850–3000) et les C=O vers 1700.',
        indice: 'Comparez la position (3340), l’allure (large) et l’intensité (forte) aux colonnes du tableau.' } },
    { id: 'acide', titre: 'Une bande encore plus large',
      retenirTitre: 'À RETENIR : LIRE UNE BANDE',
      retenir: <><FLireBande/><ul style={ULS}>
        <li>Pour chaque bande, trois questions : <strong>où ?</strong> (la position σ), <strong>comment ?</strong> (fine, large, très large), <strong>combien ?</strong> (forte, moyenne, faible).</li>
        <li>Exemple : O–H d’un alcool, large et forte, entre 3200 et 3700 cm⁻¹.</li>
        <li>Moyen de s’en souvenir : <strong>« où, comment, combien »</strong>.</li></ul></>,
      texte: <>Voici l’échantillon C. Une bande <strong>très large</strong> s’étale d’environ 2500 à 3300{NB}cm⁻¹, avec un petit pic fin de C–H par-dessus.</>,
      tache: { type: 'qcm', q: 'À quelle liaison attribuer la bande très large ?', ...Q.acide,
        expl: 'Une bande très large dans l’intervalle 2500–3200 est celle de O–H d’un acide carboxylique : elle est plus large et plus basse en nombre d’onde que celle d’un alcool (large, 3200–3700).',
        indice: 'Regardez la colonne « allure » : large ou très large ? Quel intervalle contient le centre de la bande ?' } },
    { id: 'amine', titre: 'O–H ou N–H ?',
      texte: <>Voici l’échantillon D : deux bandes fines, de force moyenne, vers 3380 et 3300{NB}cm⁻¹, et aucune bande vers 1700.</>,
      tache: { type: 'qcm', q: 'À quelle liaison les attribuer, et pourquoi pas O–H d’un alcool ?', ...Q.amine,
        expl: 'Les deux bandes sont dans l’intervalle de N–H. Une amine primaire donne deux bandes N–H. La position seule ne suffit pas (elle recoupe celle de O–H) : c’est l’allure qui tranche, car une bande O–H d’alcool est large et forte, alors que N–H est fine et moyenne.',
        indice: 'Les intervalles de O–H alcool (3200–3700) et de N–H (3100–3500) se recouvrent : quelle colonne du tableau permet de trancher ?' } },
    { id: 'combiner', titre: 'Combiner deux bandes',
      retenirTitre: 'À RETENIR : O–H ET N–H',
      retenir: <><FOhNh/><ul style={ULS}>
        <li>O–H d’un alcool : <strong>large et forte</strong>, 3200–3700 cm⁻¹.</li>
        <li>O–H d’un acide carboxylique : <strong>très large</strong>, 2500–3200 cm⁻¹.</li>
        <li>N–H : <strong>fines et moyennes</strong>, 3100–3500 cm⁻¹ (amine primaire : deux bandes).</li>
        <li>Moyen de s’en souvenir : <strong>« au-dessus de 3100 cm⁻¹, large : O–H ; fine : N–H »</strong>.</li></ul></>,
      texte: <>Revenons à l’échantillon C. Son spectre porte la bande très large de O–H (2500–3300{NB}cm⁻¹) <strong>et</strong> une bande fine et forte vers 1710{NB}cm⁻¹ (C=O).</>,
      tache: { type: 'qcm', q: 'Quel groupe caractéristique l’échantillon C possède-t-il ?', ...Q.combiner,
        expl: 'Un groupe caractéristique se déduit de l’ensemble des bandes : O–H très large et C=O vers 1710 ensemble désignent un acide carboxylique. O–H seul serait un alcool ; C=O seul, un composé carbonylé.',
        indice: 'Quelle ligne du tableau explique la bande très large ? Quelle ligne explique la bande vers 1710 ? Quel groupe possède les deux liaisons ?' } },
    { id: 'espece', titre: 'Identifier une espèce',
      texte: <>Voici l’échantillon E, un liquide pur dont l’étiquette est tombée : c’est l’une de ces quatre espèces, éthanol (CH₃–CH₂–OH), éthanal (CH₃–CHO), acide éthanoïque (CH₃–COOH) ou éthylamine (CH₃–CH₂–NH₂). Le tableau est maintenant complet. La zone hachurée, sous 1500{NB}cm⁻¹, est l’empreinte digitale : on ne l’interprète pas ici.</>,
      tache: { type: 'qcm', q: 'De quelle espèce s’agit-il ?', ...Q.espece,
        expl: 'Aucune bande au-dessus de 3000 cm⁻¹ : ni O–H ni N–H, donc ni l’éthanol, ni l’éthylamine. Une bande C=O fine et forte vers 1730 cm⁻¹ : un composé carbonylé ; l’acide éthanoïque aurait en plus la bande O–H très large, absente ici. Les petites bandes vers 2725 et 2825 cm⁻¹ (C–H d’aldéhyde) confirment l’éthanal.',
        indice: 'Cherchez d’abord s’il y a une bande au-dessus de 3000 cm⁻¹ (O–H ou N–H), puis une bande vers 1700 (C=O). Éliminez les candidats un à un.' } },
    { id: 'suivi', titre: 'Suivre une transformation',
      retenirTitre: 'À RETENIR : IDENTIFIER EN TROIS TEMPS',
      retenir: <><FMethode/><ul style={ULS}>
        <li><strong>1.</strong> Repérer les bandes au-dessus de 1500 cm⁻¹ ; <strong>2.</strong> chercher les groupes possibles dans le tableau ; <strong>3.</strong> choisir l’espèce qui explique tout.</li>
        <li>Sous 1500 cm⁻¹ : empreinte digitale, citée, non exploitée.</li></ul></>,
      texte: <>On fait réagir l’acide éthanoïque (CH₃–COOH) avec l’éthanol (CH₃–CH₂–OH) : on obtient l’éthanoate d’éthyle (CH₃–COO–CH₂–CH₃) et de l’eau. Après lavage et séchage, on isole l’ester pur. Voici les spectres des deux réactifs.</>,
      tache: { type: 'qcm', q: 'Qu’attend-on du spectre de l’ester pur, comparé à ceux des réactifs ?', ...Q.suivi,
        expl: 'L’ester pur n’a ni O–H d’acide ni O–H d’alcool (l’eau, elle aussi à bande O–H, a été éliminée). Il garde une liaison C=O, dont la bande est dans l’intervalle 1735–1750 des esters.',
        indice: 'Écrivez les liaisons de chaque molécule : lesquelles disparaissent dans l’ester, lesquelles restent ?' } },
    { id: 'conclure', titre: 'Lire le spectre du produit',
      texte: <>Voici le spectre du produit isolé (en tirets), superposé à celui de l’acide éthanoïque (trait plein). La bande C=O du produit est lue à 1738{NB}cm⁻¹, celle de l’acide à 1710{NB}cm⁻¹.</>,
      tache: { type: 'qcm', q: 'Que conclure en comparant les deux courbes ?', ...Q.conclure,
        expl: 'Le produit n’a plus la bande O–H très large de l’acide, et sa bande C=O est passée de 1710 (acide) à 1738 cm⁻¹ (ester) : un ester s’est formé. Ce raisonnement reste qualitatif : il ne donne pas le rendement.',
        indice: 'Qu’est devenue la bande très large de O–H ? Où est la bande C=O du produit par rapport aux intervalles du tableau ?' } },
    { id: 'bilan', titre: 'Le bilan',
      retenirTitre: 'À RETENIR : SUIVRE UNE TRANSFORMATION',
      retenir: <><FEsterification/><ul style={ULS}>
        <li>Réactif → produit : une bande qui <strong>disparaît</strong> = groupe consommé ; une bande qui <strong>apparaît</strong> ou se déplace = groupe formé.</li>
        <li>Estérification (produit purifié) : la bande O–H très large de l’acide disparaît ; la bande C=O passe de 1710 à 1738 cm⁻¹.</li>
        <li>Idée fausse : « la bande C=O est toujours là, donc rien n’a changé ». Vrai : sa position se lit dans une autre ligne du tableau (acide, puis ester).</li></ul></>,
      texte: <>Vous savez lire un spectre IR avec un tableau de données : position, allure et intensité des bandes, groupes possibles, choix d’une espèce parmi des candidates et suivi qualitatif d’une transformation. En exploration, déplacez le repère de nombre d’onde ; en défi, identifiez une espèce inconnue ou associez des bandes à leurs liaisons.</>, tache: null },
  ];

  const nouveauDefi = type => {
    if (type === 'identifier') setDefi({ type, ...M.tirageDefiIdentifier(), choix: null, bruit: 0.3, verifie: false, essais: 0 });
    else setDefi({ type, ...M.tirageDefiAssocier(), choix: {}, bruit: 0.3, verifie: false, essais: 0 });
    setOuv(o => ({ ...o, tableDefi: true }));
  };
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ DÉFIS ════════════════
  const choisirDefi = t => { setTypeDefi(t); nouveauDefi(t); };
  const verifier = () => {
    if (defi.type === 'identifier') { const ok = defi.choix === defi.inconnu; setDefi(d => ({ ...d, verifie: true, ok, essais: ok ? d.essais : d.essais + 1 })); noterI(ok); }
    else { const bons = defi.cibles.map(c => defi.choix[c.lettre] === c.liaison), ok = bons.every(Boolean); setDefi(d => ({ ...d, verifie: true, ok, bons, essais: ok ? d.essais : d.essais + 1 })); noterA(ok); }
  };
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const decritBandes = mol => M.bandesExploitables(mol).filter((b, i, t) => !(b[3] === 'nh' && t.findIndex(x => x[3] === 'nh') !== i) && !(b[3] === 'ch_ald' && t.findIndex(x => x[3] === 'ch_ald') !== i))
    .map(b => `${M.LIGNE[b[3]].liaison} ${M.LIGNE[b[3]].groupe} vers ${mil(b[0])} cm⁻¹ (${M.LIGNE[b[3]].allure}, ${M.LIGNE[b[3]].inten})`).join(' ; ');
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['identifier', 'Identifier une espèce'], ['associer', 'Associer les bandes']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      {defi.type === 'identifier' ? <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : quelle est cette espèce ?</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Le spectre ci-dessous est celui d’un liquide pur, parmi quatre espèces candidates. Utilisez le tableau pour trouver laquelle. Les candidates se distinguent par des bandes bien séparées : une lecture à ± 30{NB}cm⁻¹ près (une graduation vaut 100{NB}cm⁻¹) suffit.</div>
        <SpectreIR courbes={[courbe(defi.mol, 'échantillon inconnu', 'plein', defi.bruit)]} empreinte titre="Spectre d’un échantillon inconnu"/>
        <div role="radiogroup" aria-label="Espèce candidate" style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '10px 0' }}>
          {defi.candidats.map(k => <button key={k} role="radio" aria-checked={defi.choix === k} onClick={() => setDefi(d => ({ ...d, choix: k, verifie: false }))} style={{ ...stylePetitBouton(defi.choix === k, '#0369a1'), textAlign: 'left', padding: '8px 10px' }}>{MOL[k].nom} ({MOL[k].fsd})</button>)}
        </div>
        <IndiceDefi cache={false}>Cherchez d’abord les bandes au-dessus de 3000 cm⁻¹ : large (O–H) ou fine (N–H) ? Puis une bande fine et forte vers 1700 (C=O) ? Éliminez ensuite les candidats dont les groupes ne correspondent pas.</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : à quelle liaison correspond chaque bande ?</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Les bandes marquées par une lettre appartiennent à un même échantillon. Associez chacune à une liaison avec le tableau (lecture à ± 30{NB}cm⁻¹ près ; une graduation vaut 100{NB}cm⁻¹).</div>
        <SpectreIR courbes={[courbe(defi.mol, 'échantillon', 'plein', defi.bruit)]} marques={defi.cibles.map(c => ({ s: c.s, lettre: c.lettre }))} empreinte titre="Spectre avec bandes repérées"/>
        <div style={{ display: 'grid', gap: 8, margin: '10px 0' }}>
          {defi.cibles.map((c, i) => <label key={c.lettre} style={{ ...lbl, display: 'block' }}>Bande <strong>{c.lettre}</strong>
            <select value={defi.choix[c.lettre] || ''} onChange={e => setDefi(d => ({ ...d, choix: { ...d.choix, [c.lettre]: e.target.value }, verifie: false }))} style={{ ...menu, marginTop: 2 }}>
              <option value="">Choisir une liaison</option>{M.LIAISONS.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}</select>
            {defi.verifie && defi.bons && <span role="status" style={{ fontWeight: 700, color: defi.bons[i] ? COL.vert : COL.rouge }}>{defi.bons[i] ? '✓ juste' : '✗ à revoir'}</span>}</label>)}
        </div>
        <IndiceDefi cache={false}>Pour chaque bande, lisez sa position puis son allure (fine, large, très large) et son intensité, et cherchez la ligne du tableau qui convient. Une bande très large ou large est un O–H ; une bande fine et forte vers 1700 est un C=O.</IndiceDefi>
      </>}
      <Section titre="Données tabulées (tableau complet)" ouvert={ouv.tableDefi} onBascule={() => setOuv(o => ({ ...o, tableDefi: !o.tableDefi }))}><TableauIR lignes={M.TABLE}/></Section>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="irt-verif" onClick={verifier} disabled={defi.type === 'identifier' ? !defi.choix : defi.cibles.some(c => !defi.choix[c.lettre])} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'identifier'
          ? (defi.ok ? `✓ Correct : c’est ${MOL[defi.inconnu].nom} (${MOL[defi.inconnu].fsd}). ` : '✗ Pas tout à fait. ') + (defi.ok || defi.essais >= 2 ? `Bandes au-dessus de 1500 cm⁻¹ : ${decritBandes(defi.mol)}.` + (defi.ok ? '' : ` Réponse : ${MOL[defi.inconnu].nom}.`) : 'Relisez les bandes (position, allure, intensité), éliminez les candidats et vérifiez à nouveau (l’indice peut vous aider).')
          : (defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + (defi.ok || defi.essais >= 2 ? defi.cibles.map(c => `${c.lettre} : ${c.id.startsWith('ch') ? 'C–H' : M.LIGNE[c.id].liaison + (c.id.startsWith('oh') ? ' ' + M.LIGNE[c.id].groupe : '')} (σ ≈ ${mil(c.s)} cm⁻¹, ${M.LIGNE[c.id].allure}, ${M.LIGNE[c.id].inten})`).join(' ; ') + '.' : 'Corrigez les bandes marquées « à revoir » et vérifiez à nouveau.')}
      </div>}
    </div>);

  // ════════════════ EXPLORATION ════════════════
  const mol1 = MOL[ex.mol], mol2 = ex.mol2 ? MOL[ex.mol2] : null;
  const courbesEx = [courbe(mol1, mol1.nom, 'plein'), ...(mol2 ? [courbe(mol2, mol2.nom, 'tirets')] : [])];
  const dansTab = M.lignesContenant(ex.curs);
  const T1 = M.transmittance(mol1, ex.curs), T2 = mol2 ? M.transmittance(mol2, ex.curs) : null;
  const nomsMenu = M.NOMS.map(k => [k, MOL[k].nom]);
  const reglagesEx = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Réglages</div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 8, lineHeight: 1.5 }}>Choisissez une espèce, puis déplacez le repère de nombre d’onde pour voir quelles lignes du tableau contiennent cette valeur.</div>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Espèce (courbe bleue, trait plein)
        <select value={ex.mol} onChange={e => setEx(s => ({ ...s, mol: e.target.value, mol2: s.mol2 === e.target.value ? '' : s.mol2 }))} style={{ ...menu, marginTop: 2 }}>{nomsMenu.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
      <div style={{ fontSize: 13.5, color: KIT.txt, margin: '-2px 0 8px' }}>Formule : <strong>{mol1.fsd}</strong></div>
      <Curseur nom="Repère de nombre d’onde σ" valeur={ex.curs} onChange={x => setEx(s => ({ ...s, curs: x }))} min={500} max={4000} pas={5} unite="cm⁻¹" couleur={COL.orange}/>
      <Section titre={`Comparer : ${mol2 ? mol2.nom + ' (tirets)' : 'aucune autre espèce'}`} ouvert={ouv.compare} onBascule={() => setOuv(o => ({ ...o, compare: !o.compare }))}>
        <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Superpose une seconde espèce (courbe rouge en tirets) pour comparer les bandes.</div>
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2 }}>Seconde espèce
          <select value={ex.mol2} onChange={e => setEx(s => ({ ...s, mol2: e.target.value }))} style={{ ...menu, marginTop: 2 }}><option value="">aucune</option>{nomsMenu.filter(([k]) => k !== ex.mol).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
      </Section>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: KIT.txt, marginTop: 8 }}><input type="checkbox" checked={ex.hach} onChange={e => setEx(s => ({ ...s, hach: e.target.checked }))} style={{ width: 20, height: 20 }}/>Hachurer la zone de l’empreinte digitale (sous 1500 cm⁻¹)</label>
    </div>);
  const mesuresEx = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Au repère</div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6 }}>Valeurs à la position du repère orange.</div>
      <LigneMesure nom="Nombre d’onde σ" valeur={`${mil(ex.curs)}${NB}cm⁻¹`} couleur={COL.orange}/>
      <LigneMesure nom={`Longueur d’onde λ (µm) = frac(10${NB}000|σ)`} valeur={`${nbf(M.longueurOnde(ex.curs), 2)}${NB}µm`}/>
      <LigneMesure nom="Énergie d’un photon E = h c ÷ λ" valeur={`${nbf(energieEv(1e7 / ex.curs), 3)}${NB}eV`}/>
      <LigneMesure nom={`T (${mol1.nom})`} valeur={`${nbf(T1, 0)}${NB}%`}/>
      {mol2 && <LigneMesure nom={`T (${mol2.nom})`} valeur={`${nbf(T2, 0)}${NB}%`}/>}
      <div role="status" aria-live="polite" style={{ fontSize: 14, color: KIT.txt, marginTop: 8, lineHeight: 1.5 }}>
        {dansTab.length ? <>Lignes du tableau contenant {mil(ex.curs)}{NB}cm⁻¹ : {dansTab.map((r, i) => <span key={r.id}>{i ? ' ; ' : ''}<strong>{r.liaison}</strong> {r.groupe}</span>)}.</> : <>Aucune ligne du tableau ne contient {mil(ex.curs)}{NB}cm⁻¹ : pas de bande caractéristique attendue ici.</>}
        {ex.curs < M.SEUIL_EMPREINTE && <div style={{ color: KIT.txt2 }}>Sous 1500 cm⁻¹ : empreinte digitale, non exploitée.</div>}
      </div>
    </div>);
  const aideLire = (
    <Section titre="Comment lire un spectre IR ?" ouvert={ouv.aide} onBascule={() => setOuv(o => ({ ...o, aide: !o.aide }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>L’axe horizontal donne le nombre d’onde σ en cm⁻¹, orienté de <strong>droite à gauche</strong> (4000 à gauche, 500 à droite).</li>
        <li>L’axe vertical donne la transmittance T : une <strong>bande d’absorption est un creux</strong> ; plus il est profond, plus l’absorption est forte.</li>
        <li>Pour chaque bande : <strong>où ?</strong> (position), <strong>comment ?</strong> (fine, large), <strong>combien ?</strong> (forte, moyenne, faible).</li>
        <li>Cherchez la position dans le tableau : l’allure et l’intensité départagent les lignes qui se recouvrent.</li>
        <li>On exploite la zone au-dessus de 1500 cm⁻¹ (groupes caractéristiques) ; sous 1500 cm⁻¹, c’est l’empreinte digitale.</li>
        <li>Pour une espèce, on regarde toutes les bandes : un seul groupe ne suffit pas toujours (C=O existe dans plusieurs familles).</li></ul>)}
    </Section>);
  const tableExplore = (
    <Section titre={`Données tabulées (${M.TABLE.length} lignes : liaison, intervalle, allure)`} ouvert={ouv.table} onBascule={() => setOuv(o => ({ ...o, table: !o.table }))}>
      <TableauIR lignes={M.TABLE} surligne={dansTab.map(r => r.id)}/>
    </Section>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Comparez l’éthanol et l’éthylamine : à quoi voit-on la différence entre une bande O–H et des bandes N–H ?</li>
        <li>Comparez l’acide éthanoïque et l’éthanoate d’éthyle : quelles bandes ont disparu, laquelle s’est déplacée ?</li>
        <li>Comparez la propanone et l’éthanal : quelles bandes fines supplémentaires l’aldéhyde présente-t-il vers 2700–2900 cm⁻¹ ?</li>
        <li>Placez le repère sur la bande C=O de l’éthanoate d’éthyle puis de la propanone : combien de lignes du tableau contiennent chaque valeur ?</li>
        <li>Quelles espèces du menu n’ont aucune bande C=O ? Laquelle a une bande C=C ?</li></ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Une bande d’absorption est un creux ; on lit sa position σ (cm⁻¹), son allure et son intensité</li>
          <li>Le tableau donne des intervalles typiques : une valeur peut tomber dans plusieurs lignes</li>
          <li>O–H alcool : large, forte, 3200–3700 ; O–H acide : très large, 2500–3200 ; N–H : fines, moyennes</li>
          <li>C=O : bande fine et forte, 1650–1750 selon la famille (ester 1735–1750)</li>
          <li>On identifie une espèce avec l’ensemble des bandes au-dessus de 1500 cm⁻¹</li>
          <li>Transformation : bande qui disparaît = groupe consommé ; bande qui apparaît = groupe formé</li>
        </ul>
      </ARetenir>
    </Section>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Spectres construits</strong> : chaque spectre est la somme de bandes (position, largeur, intensité) choisies pour la molécule ; ce ne sont <strong>pas des enregistrements</strong>. Les positions sont réalistes mais approchées.</li>
      <li><strong>Valeurs tabulées = intervalles typiques</strong> : la position réelle d’une bande varie avec la molécule et son environnement ; les intervalles de plusieurs lignes se recouvrent (par exemple C=O de l’ester, de l’aldéhyde et de la cétone entre 1735 et 1740 cm⁻¹).</li>
      <li><strong>Spectre simplifié</strong> : seules les bandes principales sont tracées, sans couplages ni harmoniques ; d’autres bandes réelles (par exemple la déformation N–H d’une amine vers 1600 cm⁻¹) ne sont pas représentées. Les bandes C–H sont regroupées en une ou deux bandes.</li>
      <li><strong>Échantillon pur en phase condensée</strong> (liquide) : les liaisons O–H et N–H sont « liées » (liaisons hydrogène), d’où des bandes larges. En solution diluée ou en phase gazeuse, la bande O–H d’un alcool devient fine et se déplace vers 3600 cm⁻¹ ; ce cas n’est pas traité ici.</li>
      <li><strong>Zone exploitée</strong> : au-dessus de 1500 cm⁻¹ (groupes caractéristiques). La zone sous 1500 cm⁻¹ (empreinte digitale) est citée, mais on ne l’interprète pas.</li>
      <li><strong>Une espèce se déduit de l’ensemble des bandes</strong> : C=O existe dans plusieurs familles ; le tableau seul ne tranche pas toujours (intervalles qui se recouvrent), on s’aide des autres bandes ou d’informations sur l’échantillon.</li>
      <li><strong>Suivi d’une transformation</strong> : qualitatif, sur le produit purifié (lavé et séché). Dans un mélange réactionnel brut, l’eau formée et les réactifs restants montreraient encore des bandes O–H. Le spectre ne donne pas ici de rendement ni de quantités.</li>
      <li><strong>Lecture</strong> : le nombre d’onde se lit à environ ± 30 cm⁻¹ près sur le graphique (graduation de 100 cm⁻¹) ; les défis sont construits pour que cette précision suffise à conclure. Dans les défis, les bandes d’un même composé sont décalées au hasard de quelques cm⁻¹, toujours dans leur intervalle du tableau.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;

  // ---------- scène du parcours ----------
  const COURBES_GUIDE = {
    lire: () => [courbe(MOL.propanone, 'échantillon A')], tableau: () => [courbe(MOL.propanone, 'échantillon A')], ch: () => [courbe(MOL.propanone, 'échantillon A')],
    alcool: () => [courbe(MOL.ethanol, 'échantillon B')], acide: () => [courbe(MOL.acide, 'échantillon C')], amine: () => [courbe(MOL.ethylamine, 'échantillon D')], combiner: () => [courbe(MOL.acide, 'échantillon C')],
    espece: () => [courbe(MOL.ethanal, 'échantillon E')],
    sigma: () => [], energie: () => [],
    suivi: () => [courbe(MOL.acide, 'acide éthanoïque'), courbe(MOL.ethanol, 'éthanol', 'tirets')],
    conclure: () => [courbe(MOL.acide, 'acide éthanoïque'), courbe(MOL.ester, 'produit isolé', 'tirets')], bilan: () => [courbe(MOL.acide, 'acide éthanoïque'), courbe(MOL.ester, 'produit isolé', 'tirets')],
  };
  const spectreG = enGuide && idx >= IDS.indexOf('lire') && (
    <div style={{ ...styleBoite, padding: 6 }}>
      <SpectreIR courbes={COURBES_GUIDE[idE]()} empreinte={idx >= IDS.indexOf('espece')} titre={`Spectre infrarouge, étape ${idx + 1}`}/>
    </div>);
  const tableG = enGuide && idx >= IDS.indexOf('tableau') && (
    <div style={{ ...styleBoite, ...(idx === IDS.indexOf('tableau') || LIGNES_ETAPE[idx].length ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {}) }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Données tabulées</div>
      <TableauIR lignes={lignesVues(idx)}/>
    </div>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .irt-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .irt-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .irt-col { display: flex; flex-direction: column; gap: 12px; }
        .irt-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .irt-l1.cote .irt-carte { order: 2; } .irt-l1.cote .irt-main { order: 1; }
          .irt-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .irt-ex > * { grid-column: 1; } .irt-ex > .irt-ctrl { grid-column: 2; grid-row: 1 / span 4; } }
        @media (max-width: 900px) { .irt-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .irt-in { animation: irt-fondu 0.35s ease-out; } @keyframes irt-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Spectroscopie infrarouge : énergie des photons, bandes et structures</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Du <strong>photon infrarouge</strong> (σ = 1 ÷ λ, E = h c ÷ λ) au <strong>spectre</strong> : lire les bandes avec un tableau de données pour identifier un groupe caractéristique, puis une espèce chimique, et confirmer une transformation.</div>
      {!enExplore && <div className="irt-l1 cote">
        {enGuide ? <div className="irt-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="irt-carte">{panneauHypo}</div> : null}
        <div className="irt-main">
          {enDefi && defi && <div style={styleBoite}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'identifier' ? suiviI : suiviA}/></div>}
          {enGuide && <div className="irt-col">
            <div className="irt-in" key={`s${idE}`}>{spectreG}</div>
            {tableG && <div className="irt-in" key={`t${idx}`}>{tableG}</div>}
          </div>}
        </div>
      </div>}
      {enExplore && <div className="irt-ex">
        <div style={{ ...styleBoite, padding: 6 }}><SpectreIR courbes={courbesEx} curseur={ex.curs} empreinte={ex.hach} titre={`Spectre infrarouge : ${mol1.nom}`}/></div>
        <div className="irt-ctrl">{reglagesEx}</div>
        <div>{mesuresEx}</div>
        <div>{tableExplore}</div>
        <div>{aideLire}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && idx >= IDS.length - 1 && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
