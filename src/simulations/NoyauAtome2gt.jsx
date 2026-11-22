import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, IndiceDefi, ExempleResolu, OngletExercices, LigneMesure, attrTest } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./noyauAtome2gtModele";
import { QCM, ZAX_CHOIX } from "./noyauAtome2gtQcm";
import { COL } from "./changementEtat2gtCouleurs";
import { SceneEchelle, SceneAtomeNoyau, SceneBille, SceneMasses, SceneMasseAtome, SceneCharges, SceneAtomeNeutre, SceneNoyau, SceneLireZax, SceneBilan, SceneExplore, SceneDefiNoyau, SceneDefiZax, Zax, MiniTableau } from "./NoyauAtome2gtScenes";
import { FicheTailleAtome, FicheAtomeNoyau, FicheMasses, FicheCharges, FicheZA, FicheBilanZax } from "./NoyauAtome2gtFiches";

const SIM_ID = 202, CLE_GUIDE = 'noyau-atome-2gt-guide-v1';
declarerDefis(SIM_ID, [['zax', 'De la composition à l’écriture ZAX'], ['compo', 'De l’écriture ZAX à la composition']]);

// ====================================================
//  SIM 202 — LE NOYAU DE L'ATOME : TAILLE, MASSE ET ÉCRITURE ZAX (2GT spé PC, « Modélisation à l'échelle microscopique : le noyau de l'atome »).
//  Prérequis : simulation 57 (atome, ions, octet : renvoi, pas refaite), simulation 178 (puissances de 10, écriture scientifique : même façon de les expliquer, sans les mots « exposant » ni « mantisse »).
//  Prépare la simulation 203 (isotopes, transformation nucléaire) et, en Terminale, 123 et 184 (radioactivité) sans les anticiper : ni désintégration, ni demi-vie, ni diagramme (N, Z).
//  Parcours (12 étapes) : taille de l'atome (1), noyau et quotient des tailles (1), une image à notre échelle (1), masses des particules (1), masse de l'atome et de son noyau (1),
//  charges (1), atome neutre (1), numéro atomique Z (1), nombre de masse A (1), écriture ZAX (1), lecture de ZAX (1), bilan (1).
//  Capacités visées (jamais affichées à l'élève) : citer l'ordre de grandeur de la taille d'un atome ; comparer la taille et la masse d'un atome et de son noyau ; établir l'écriture conventionnelle d'un noyau
//  à partir de sa composition et inversement ; masse et charge d'un électron, d'un proton, d'un neutron ; charge élémentaire, neutralité de l'atome ; quotient de deux grandeurs, puissances de 10.
//  Hors programme, non traité dans le parcours : isotopes (simulation 203), interaction forte, énergie de liaison, orbitales (une ligne chacun dans « Au-delà du parcours »).
// ====================================================

const liste = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);
const aide = t => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{t}</div>;
const renvoi = <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}>↓ La question de cette étape est juste en dessous.</div>;
const NB = M.NB, nf = M.nombreFR, sci = M.sciFR;
const pl = (n, mot) => `${n} ${mot}${n > 1 ? "s" : ""}`;
const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
const etiquette = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 };
const champ = { fontSize: 16, padding: '6px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 8, width: 84, color: KIT.txt };
const E = M.element;
const nbf = (v, d = 2) => nf(v, d);

export function SimulationNoyauAtome() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviZ, noterZ] = useCompteurDefi(), [suiviC, noterC] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('zax');
  const [hypoOuv, setHypoOuv] = useState(() => mode === 'defi');
  const [zaxChoix, setZaxChoix] = useState(null), [zaxIndice, setZaxIndice] = useState(false);
  const [ex, setEx] = useState({ Z: 6, vue: 'atome', objet: 'bille', ouv: {} });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  // ---------- étape 10 : choisir l'écriture ZAX du noyau d'azote (7 protons, 7 neutrons) ----------
  const ORDRE_ZAX = [1, 3, 0, 2];
  const zaxOk = zaxChoix === 0;
  const sceneZax = (
    <div>
      <SceneNoyau Z={7} nom="d’azote" />
      <p style={{ margin: '10px 0 8px', fontSize: 15, fontWeight: 700, color: KIT.txt, lineHeight: 1.5 }}>Choisissez l’écriture du noyau d’azote.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
        {ORDRE_ZAX.map(i => {
          const [A, Z, s] = ZAX_CHOIX[i], choisi = zaxChoix === i;
          return <button key={i} onClick={() => setZaxChoix(i)} aria-pressed={choisi} aria-label={`Écriture : ${A} nucléons, ${Z} protons, symbole ${s}`} data-ok={attrTest(i === 0 ? 'true' : 'false')}
            style={{ minHeight: 74, fontSize: 26, cursor: 'pointer', background: choisi ? (i === 0 ? '#f0fdf4' : '#fef2f2') : 'white', border: `2.5px solid ${choisi ? (i === 0 ? '#15803d' : '#dc2626') : KIT.bord}`, borderRadius: 12, color: KIT.txt }}><Zax A={A} Z={Z} s={s} grand /></button>;
        })}
      </div>
      {zaxChoix != null && <div role="status" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: zaxOk ? '#15803d' : '#dc2626' }}>{zaxOk ? '✓ ' : '✗ Pas encore : '}{ZAX_CHOIX[zaxChoix][3].charAt(0).toUpperCase() + ZAX_CHOIX[zaxChoix][3].slice(1)}</div>}
      {!zaxOk && (zaxIndice
        ? <div style={{ marginTop: 6, fontSize: 13.5, color: KIT.txt, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 6, padding: '6px 8px' }}><Pic n="bulb" />Z est le nombre de protons. A est le nombre de protons plus le nombre de neutrons. A s’écrit au-dessus de Z.</div>
        : <button onClick={() => setZaxIndice(true)} style={{ marginTop: 6, fontSize: 13, padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, border: '1.5px solid #fcd34d', background: '#fffbeb', color: '#92400e' }}><Pic n="bulb" />Indice</button>)}
    </div>);

  // ---------- étapes du parcours ----------
  const IDS = ['taille', 'noyau', 'echelle', 'masses', 'masseatome', 'charges', 'neutre', 'z', 'a', 'zax', 'lire', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const ETAPES = [
    { id: 'taille', titre: 'Un atome, c’est très petit', focus: ['scene'],
      texte: <>Pour écrire une taille très petite avec peu de chiffres, on utilise une <strong>puissance de 10</strong>. Écrire 10⁻³{NB}m, c’est écrire 0,001{NB}m : le chiffre 1 est à la 3<sup>e</sup> place après la virgule. C’est un millimètre. Plus le petit nombre en haut est négatif, plus la taille est petite. L’<strong>ordre de grandeur</strong> d’une taille est la puissance de 10 la plus proche.
        <ExempleResolu>Une cellule du corps mesure environ 10⁻⁵{NB}m, soit 0,000{NB}01{NB}m : le chiffre 1 est à la 5<sup>e</sup> place après la virgule.</ExempleResolu>
        À vous : l’atome est le plus petit objet de la liste. Retrouvez son ordre de grandeur.
        <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6 }}><strong>Modèle simplifié</strong> : un noyau au centre, des électrons autour (ils ne tournent pas comme des planètes) ; le proton et le neutron ont presque la même masse ; les schémas ne sont jamais à l’échelle.</div></>,
      tache: { type: 'qcm', ...QCM.taille } },
    { id: 'noyau', titre: 'Au centre de l’atome : le noyau', focus: ['scene'],
      texte: <>Au centre de chaque atome se trouve le <strong>noyau</strong>. Il mesure environ 10⁻¹⁵{NB}m. Pour comparer deux tailles, on fait leur <strong>quotient</strong> : on divise la grande par la petite. Avec des puissances de 10, on <strong>soustrait</strong> les nombres du haut.
        <ExempleResolu>Une baleine mesure environ 10¹{NB}m et une fourmi 10⁻³{NB}m. Quotient : 10¹ ÷ 10⁻³ = 10 puissance (1 − (−3)) = 10⁴. La baleine est <strong>10{NB}000 fois</strong> plus grande que la fourmi.</ExempleResolu>
        À vous : l’atome mesure 10⁻¹⁰{NB}m et son noyau 10⁻¹⁵{NB}m.</>,
      tache: { type: 'qcm', ...QCM.rapport },
      retenirTitre: 'La taille d’un atome',
      retenir: <><FicheTailleAtome />
        <ul style={liste}>
          <li><strong>Phrase-clé : un atome mesure un dixième de nanomètre, 10⁻¹⁰{NB}m.</strong></li>
          <li><strong>Exemple</strong> : mille atomes alignés font à peu près la taille d’un virus (10⁻⁷{NB}m).</li>
        </ul>{renvoi}</> },
    { id: 'echelle', titre: 'Le noyau devient une bille', focus: ['scene'],
      texte: <>Un quotient de 100{NB}000, c’est difficile à imaginer. Faisons une image : on <strong>agrandit tout dans le même rapport</strong>, l’atome comme son noyau, jusqu’à ce que le noyau devienne une bille de 1{NB}cm. L’atome étant 100{NB}000 fois plus large que son noyau, il est alors 100{NB}000 fois plus large que la bille : on <strong>multiplie</strong> 1{NB}cm par 100{NB}000.
        <ExempleResolu>Sur un schéma où tout est agrandi dans le même rapport, une fourmi mesure 5{NB}mm. Un éléphant est 1{NB}000 fois plus long qu’elle : sur ce schéma, il mesure 5{NB}mm × 1{NB}000 = 5{NB}000{NB}mm. Comme 1{NB}m = 1{NB}000{NB}mm, cela fait <strong>5{NB}m</strong>.</ExempleResolu>
        À vous : le noyau est devenu une bille de 1{NB}cm. Quel est alors le diamètre de l’atome ? Rappel : 1{NB}m = 100{NB}cm.</>,
      tache: { type: 'num', q: <>Quel est le diamètre de l’atome, en mètres ?</>, carnet: 'Atome (noyau = bille de 1\u00a0cm)', unite: 'm', vrai: 1000, tol: 0.05, affiche: v => nf(v),
        calcul: () => ['L’atome est 100\u00a0000 fois plus large que le noyau : 1\u00a0cm × 100\u00a0000 = 100\u00a0000\u00a0cm.', 'On convertit en mètres : 100\u00a0cm = 1\u00a0m, donc 100\u00a0000\u00a0cm = 1\u00a0000\u00a0m.', 'L’atome ferait 1\u00a0000\u00a0m, soit 1\u00a0km.'],
        pieges: [[1, 'Vous avez peut-être écrit 1\u00a0km : la réponse attendue est en mètres (1\u00a0km = 1\u00a0000\u00a0m).'], [100000, 'C’est le résultat en centimètres (1\u00a0cm × 100\u00a0000). Il reste à convertir en mètres : 100\u00a0cm = 1\u00a0m.'], [100, 'Pour passer des centimètres aux mètres, on divise par 100 : 100\u00a0000 ÷ 100 = 1\u00a0000.'], [10, 'Il manque des zéros : 100\u00a0000\u00a0cm ÷ 100 = 1\u00a0000\u00a0m.']],
        expl: 'Atome : 1\u00a0cm × 100\u00a0000 = 100\u00a0000\u00a0cm = 1\u00a0000\u00a0m, soit 1\u00a0km.', indice: 'Multipliez 1\u00a0cm par 100\u00a0000, puis convertissez les centimètres en mètres en divisant par 100.' } },
    { id: 'masses', titre: 'Les masses des particules', focus: ['scene'],
      texte: <>Le noyau contient des <strong>protons</strong> et des <strong>neutrons</strong>, qu’on appelle les <strong>nucléons</strong>. Autour du noyau se trouvent les <strong>électrons</strong>. La scène donne leurs masses. Pour comparer deux masses, on fait aussi leur quotient.
        <ExempleResolu>Une voiture de 1,2 × 10³{NB}kg et une balle de tennis de 6,0 × 10⁻²{NB}kg. Quotient : (1,2 × 10³) ÷ (6,0 × 10⁻²) = (1,2 ÷ 6,0) × 10⁵ = 0,20 × 10⁵ = 2,0 × 10⁴. La voiture pèse <strong>20{NB}000 fois</strong> plus.</ExempleResolu>
        À vous : le proton et l’électron.</>,
      tache: { type: 'num', q: <>L’électron est environ combien de fois plus léger que le proton ? Écrivez un nombre entier.</>, carnet: 'Proton ÷ électron (nombre de fois)', unite: 'fois', vrai: M.RAPPORT_MASSES, tol: 0.05, affiche: v => nf(v),
        calcul: () => ['On divise la masse du proton par celle de l’électron : 1,67 × 10⁻²⁷ ÷ (9,11 × 10⁻³¹).', '(1,67 ÷ 9,11) × 10 puissance (−27 − (−31)) = 0,183 × 10⁴.', '0,183 × 10⁴ = 1,83 × 10³ : environ 1\u00a0800 fois (1\u00a0833).'],
        pieges: [[10000, 'Vous avez calculé la puissance de 10 (10⁴) mais oublié de diviser 1,67 par 9,11.'], [0.000545, 'Le quotient est à l’envers : on divise la masse du proton (la plus grande) par celle de l’électron.'], [1.83, 'Il manque la puissance de 10 : (−27) − (−31) = 4, donc il faut multiplier par 10⁴ après avoir divisé 1,67 par 9,11.']],
        expl: '1,67 × 10⁻²⁷ ÷ (9,11 × 10⁻³¹) = 0,183 × 10⁴ ≈ 1\u00a0800 : le proton est environ 1\u00a0800 fois plus lourd que l’électron.', indice: 'Divisez les deux nombres : 1,67 ÷ 9,11. Puis divisez les puissances de 10 en soustrayant : −27 − (−31) = 4.' },
      retenirTitre: 'Atome et noyau : 100\u00a0000 fois',
      retenir: <><FicheAtomeNoyau />
        <ul style={liste}>
          <li><strong>Phrase-clé : le noyau est 100{NB}000 fois plus petit que l’atome.</strong></li>
          <li><strong>Idée fausse</strong> : « le noyau remplit presque tout l’atome ». <strong>Vrai</strong> : à l’échelle d’un atome de 1{NB}km, le noyau est une bille de 1{NB}cm.</li>
        </ul>{renvoi}</> },
    { id: 'masseatome', titre: 'Où est la masse de l’atome ?', focus: ['scene'],
      texte: <>Le noyau contient A nucléons, chacun de masse 1,67 × 10⁻²⁷{NB}kg. La masse du noyau est donc <strong>m(noyau) ≈ A × 1,67 × 10⁻²⁷{NB}kg</strong>. Les électrons pèsent beaucoup moins : on compare la masse de l’atome, celle de son noyau et celle de ses électrons.
        <ExempleResolu>Le carbone a A = 12 : m(noyau) ≈ 12 × 1,67 × 10⁻²⁷ = 20,0 × 10⁻²⁷ = 2,00 × 10⁻²⁶{NB}kg. L’atome entier pèse 1,99 × 10⁻²⁶{NB}kg : <strong>presque la même masse</strong>. Ses 6 électrons ne pèsent que 6 × 9,11 × 10⁻³¹ = 5,47 × 10⁻³⁰{NB}kg.</ExempleResolu>
        À vous : le noyau de sodium, avec A = 23 nucléons.</>,
      tache: { type: 'num', q: <>Quelle est la masse du noyau de sodium ? Écrivez le nombre qui multiplie 10⁻²⁶{NB}kg.</>, carnet: 'Masse du noyau de sodium', unite: '× 10⁻²⁶\u00a0kg', vrai: M.masseNoyau(23) / 1e-26, tol: 0.03, affiche: v => nbf(v, 2),
        calcul: () => ['m(noyau) ≈ A × 1,67 × 10⁻²⁷\u00a0kg avec A = 23.', '23 × 1,67 = 38,4, donc m = 38,4 × 10⁻²⁷\u00a0kg = 3,84 × 10⁻²⁶\u00a0kg.'],
        pieges: [[38.4, 'Vous avez calculé 38,4 × 10⁻²⁷\u00a0kg : il reste à écrire 38,4 × 10⁻²⁷ = 3,84 × 10⁻²⁶ pour avoir une puissance de 10 de −26.'], [0.384, 'Le décalage de la virgule est dans le mauvais sens : 38,4 × 10⁻²⁷ = 3,84 × 10⁻²⁶ et non 0,384 × 10⁻²⁶.'], [1.67, 'C’est la masse d’un seul nucléon : le noyau en contient 23.'], [2.3, 'Il faut multiplier le nombre de nucléons, 23, par la masse d’un nucléon, 1,67 × 10⁻²⁷\u00a0kg.']],
        expl: 'm(noyau) ≈ 23 × 1,67 × 10⁻²⁷ = 38,4 × 10⁻²⁷ = 3,84 × 10⁻²⁶\u00a0kg. Les 11 électrons ajoutent environ 1 × 10⁻²⁹\u00a0kg, soit moins de 0,1\u00a0% : l’atome pèse presque autant que son noyau.', indice: 'Multipliez 23 par 1,67, puis écrivez le résultat avec 10⁻²⁶ : 38,4 × 10⁻²⁷ = 3,84 × 10⁻²⁶.' } },
    { id: 'charges', titre: 'Les charges électriques', focus: ['scene'],
      texte: <>Les particules portent une <strong>charge électrique</strong>. La plus petite charge qu’on rencontre est la <strong>charge élémentaire</strong> e = 1,60 × 10⁻¹⁹{NB}C (le coulomb, C, est l’unité de charge). Le proton porte +e, l’électron −e, le neutron n’a pas de charge. La charge d’un noyau est la somme des charges de ses particules.
        <ExempleResolu>Un noyau de béryllium contient 4 protons et 5 neutrons. Les neutrons n’ont pas de charge : la charge est 4 × (+e) = +4e = 4 × 1,60 × 10⁻¹⁹ = <strong>6,40 × 10⁻¹⁹{NB}C</strong>.</ExempleResolu>
        À vous : un noyau de lithium, avec 3 protons et 4 neutrons.</>,
      tache: { type: 'num', q: <>Quelle est la charge du noyau de lithium ? Écrivez le nombre qui multiplie 10⁻¹⁹{NB}C.</>, carnet: 'Charge du noyau de lithium', unite: '× 10⁻¹⁹\u00a0C', vrai: 4.8, tol: 0.03, affiche: v => nbf(v, 2),
        calcul: () => ['Seuls les 3 protons portent une charge : +e chacun. Les 4 neutrons n’en ont pas.', 'Charge = 3 × (+e) = +3e = 3 × 1,60 × 10⁻¹⁹\u00a0C = 4,80 × 10⁻¹⁹\u00a0C.'],
        pieges: [[11.2, 'Vous avez compté les 7 particules du noyau : les neutrons n’ont pas de charge, seuls les 3 protons comptent.'], [1.6, 'C’est la charge d’un seul proton : le noyau en contient 3.'], [6.4, 'Vous avez compté 4 charges : ce sont les neutrons, qui n’en ont pas.']],
        expl: 'Charge = 3 × 1,60 × 10⁻¹⁹ = 4,80 × 10⁻¹⁹\u00a0C.', indice: 'Comptez seulement les protons, puis multipliez leur nombre par 1,60 (la puissance de 10 reste 10⁻¹⁹).' },
      retenirTitre: 'Les masses des particules',
      retenir: <><FicheMasses />
        <ul style={liste}>
          <li><strong>Phrase-clé : un proton pèse environ autant que 1{NB}800 électrons.</strong></li>
          <li><strong>Idée fausse</strong> : « les électrons font la masse de l’atome ». <strong>Vrai</strong> : presque toute la masse est dans le noyau (carbone : noyau 2,00 × 10⁻²⁶{NB}kg, atome 1,99 × 10⁻²⁶{NB}kg, 6 électrons 5,47 × 10⁻³⁰{NB}kg, soit 3{NB}600 fois moins).</li>
        </ul>{renvoi}</> },
    { id: 'neutre', titre: 'Un atome est neutre', focus: ['scene'],
      texte: <>Un atome est <strong>électriquement neutre</strong> : sa charge totale est nulle. La charge positive du noyau est exactement compensée par la charge négative des électrons.
        <ExempleResolu>Sur la scène, on compte 8 électrons autour du noyau : ils portent −8e. L’atome étant neutre, son noyau porte +8e, donc il contient <strong>8 protons</strong> : c’est un atome d’oxygène.</ExempleResolu>
        À vous : un atome de sodium.</>,
      tache: { type: 'qcm', ...QCM.neutre } },
    { id: 'z', titre: 'Z : le numéro atomique', focus: ['scene'],
      texte: <>Le nombre de protons d’un noyau s’appelle le <strong>numéro atomique</strong>, noté <strong>Z</strong>. Il donne son identité à l’<strong>élément chimique</strong> : tous les noyaux à 6 protons sont du carbone, et les autres ne le sont pas. Le tableau périodique range les éléments par Z croissant.
        <ExempleResolu>Z = 6 : dans le tableau, la case 6 est le <strong>carbone</strong>, de symbole C.</ExempleResolu>
        À vous : un noyau de 17 protons.</>,
      tache: { type: 'qcm', ...QCM.element },
      retenirTitre: 'Charges et atome neutre',
      retenir: <><FicheCharges />
        <ul style={liste}>
          <li><strong>Phrase-clé : proton +, électron −, neutron rien ; atome neutre : autant de + que de −.</strong></li>
          <li><strong>Idée fausse</strong> : « le noyau est neutre ». <strong>Vrai</strong> : le noyau est positif (ses protons) ; c’est l’atome entier qui est neutre.</li>
        </ul>{renvoi}</> },
    { id: 'a', titre: 'A : le nombre de nucléons', focus: ['scene'],
      texte: <>Le nombre total de nucléons (protons + neutrons) s’appelle le <strong>nombre de masse</strong>, noté <strong>A</strong> : A = nombre de protons + nombre de neutrons. On en déduit le nombre de neutrons : A − Z.
        <ExempleResolu>Le noyau de carbone de la scène a 6 protons et 6 neutrons : A = 6 + 6 = <strong>12</strong>.</ExempleResolu>
        À vous : un noyau de phosphore, avec 15 protons et 16 neutrons.</>,
      tache: { type: 'num', q: <>Quel est le nombre de masse A du noyau de phosphore ?</>, carnet: 'A du noyau de phosphore', unite: 'nucléons', vrai: 31, tol: 0, affiche: v => nf(v),
        calcul: () => ['A compte tous les nucléons : les protons et les neutrons.', 'A = 15 + 16 = 31.'],
        pieges: [[16, 'C’est le nombre de neutrons seulement : A compte aussi les 15 protons.'], [15, 'C’est le nombre de protons seulement : A compte aussi les neutrons.'], [1, 'On additionne les protons et les neutrons, on ne les soustrait pas.']],
        expl: 'A = 15 protons + 16 neutrons = 31 nucléons.', indice: 'A = nombre de protons + nombre de neutrons. Additionnez 15 et 16.' } },
    { id: 'zax', titre: 'Écrire un noyau : ZAX', focus: ['scene'],
      texte: <>On écrit un noyau avec le <strong>symbole X</strong> de son élément, le nombre de masse <strong>A en haut à gauche</strong> et le numéro atomique <strong>Z en bas à gauche</strong>. Pour s’en souvenir : A est avant Z dans l’alphabet, donc A est au-dessus de Z.
        <ExempleResolu>Le carbone : 6 protons et 6 neutrons. Z = 6 et A = 12, donc on écrit <Zax A={12} Z={6} s="C" grand />.</ExempleResolu>
        À vous : le noyau d’azote dessiné, avec 7 protons et 7 neutrons.</>,
      tache: { type: 'action', ok: zaxOk, consigne: 'Cliquez sur la bonne écriture du noyau d’azote.' },
      retenirTitre: 'Z, A et les neutrons',
      retenir: <><FicheZA />
        <ul style={liste}>
          <li><strong>Phrase-clé : Z compte les protons, A compte tous les nucléons.</strong></li>
          <li><strong>Exemple</strong> : le carbone a Z = 6 et A = 12, donc 12 − 6 = 6 neutrons.</li>
        </ul>{renvoi}</> },
    { id: 'lire', titre: 'Lire l’écriture d’un noyau', focus: ['scene'],
      texte: <>On sait aussi faire le chemin inverse : à partir de l’écriture d’un noyau, on retrouve sa composition. Z donne le nombre de protons, A le nombre de nucléons, et le nombre de neutrons est <strong>A − Z</strong>.
        <ExempleResolu>Le fluor s’écrit <Zax A={19} Z={9} s="F" /> : il a 9 protons, 19 nucléons, donc 19 − 9 = <strong>10 neutrons</strong>.</ExempleResolu>
        À vous : l’argon, qui s’écrit <Zax A={40} Z={18} s="Ar" />.</>,
      tache: { type: 'num', q: <>Combien de neutrons le noyau d’argon contient-il ?</>, carnet: 'Neutrons du noyau d’argon', unite: 'neutrons', vrai: 22, tol: 0, affiche: v => nf(v),
        calcul: () => ['Pour l’argon : A = 40 et Z = 18.', 'Neutrons = A − Z = 40 − 18 = 22.'],
        pieges: [[40, 'C’est A, le nombre de nucléons : il compte aussi les protons. Il faut retirer Z.'], [18, 'C’est Z, le nombre de protons. Les neutrons sont A − Z.'], [58, 'On soustrait Z à A, on ne les additionne pas.']],
        expl: 'Neutrons = A − Z = 40 − 18 = 22.', indice: 'Le nombre de neutrons est A − Z : soustrayez le nombre du bas du nombre du haut.' } },
    { id: 'bilan', titre: 'Le bilan', focus: ['scene'],
      texte: <>L’atome mesure environ 10⁻¹⁰{NB}m, son noyau 10⁻¹⁵{NB}m : 100{NB}000 fois moins. Pourtant, le noyau porte presque toute la masse. Il contient Z protons et A − Z neutrons ; l’atome neutre a Z électrons. On résume tout avec l’écriture <Zax A={23} Z={11} s="Na" />. Vous pouvez maintenant explorer ou relever un défi.</>,
      tache: null,
      retenirTitre: 'L’écriture ZAX et la composition',
      retenir: <><FicheBilanZax />
        <ul style={liste}>
          <li><strong>Phrase-clé : A au-dessus de Z, comme dans l’alphabet ; neutrons = A − Z ; électrons = Z.</strong></li>
          <li><strong>Exemple</strong> : <Zax A={23} Z={11} s="Na" /> a 11 protons, 12 neutrons et, dans l’atome neutre, 11 électrons.</li>
        </ul></> },
  ];

  // ---------- scènes du parcours guidé ----------
  const sceneGuide = (() => {
    switch (idE) {
      case 'taille': return boite('Du plus grand au plus petit', <SceneEchelle />);
      case 'noyau': return boite('Un atome et son noyau', <SceneAtomeNoyau />);
      case 'echelle': return boite('Le noyau agrandi en bille', <SceneBille />);
      case 'masses': return boite('Les masses de trois particules', <SceneMasses />);
      case 'masseatome': return boite('Un atome de carbone', <SceneMasseAtome />);
      case 'charges': return boite('Les charges de trois particules', <SceneCharges />);
      case 'neutre': return boite('Un atome d’oxygène', <SceneAtomeNeutre />);
      case 'z': return boite('Les 18 premiers éléments, par Z croissant', <><div style={{ marginBottom: 8 }}><MiniTableau surligne={[6]} /></div>{aide('Le petit nombre de chaque case est le numéro atomique Z.')}</>);
      case 'a': return boite('Le noyau de carbone', <SceneNoyau Z={6} />);
      case 'zax': return boite('Un noyau d’azote', sceneZax);
      case 'lire': return boite('Lire l’écriture d’un noyau', <SceneLireZax />);
      case 'bilan': return boite('Un atome de sodium', <SceneBilan />);
      default: return null;
    }
  })();

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = (type, prec = defi) => {
    const p = prec && prec.type === type ? prec : null;
    setDefi({ ...(type === 'zax' ? M.tirerDefiZax(p) : M.tirerDefiCompo(p)), rep: { Z: '', A: '', s: '', p: '', n: '', e: '' }, verifie: false });
  };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi') setHypoOuv(true);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi, null);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t, null); }
  const prete = d => d && (d.type === 'zax' ? d.rep.Z !== '' && d.rep.A !== '' && d.rep.s !== '' : d.rep.p !== '' && d.rep.n !== '' && d.rep.e !== '');
  const verifier = () => {
    const r = defi.type === 'zax' ? M.reponseZax(defi, defi.rep) : M.reponseCompo(defi, defi.rep);
    setDefi(d => ({ ...d, verifie: true, res: r })); (defi.type === 'zax' ? noterZ : noterC)(r.ok);
  };
  const marque = ok => <span aria-hidden="true" style={{ marginLeft: 6, fontWeight: 800, color: ok ? '#15803d' : '#dc2626' }}>{ok ? '✓' : '✗'}</span>;
  const maj = (cle, v) => setDefi(d => ({ ...d, rep: { ...d.rep, [cle]: v }, verifie: false }));
  const messageDefi = d => {
    const r = d.res, e = E(d.Z);
    if (d.type === 'zax') {
      if (r.ok) return `✓ Correct : ${pl(d.Z, "proton")} donne${d.Z > 1 ? "nt" : ""} Z = ${d.Z} (${e.le}, symbole ${e.s}) ; A = ${d.Z} + ${d.N} = ${d.A}. Le noyau s’écrit ${M.zaxTexte(e)}.`;
      return `✗ Pas encore (${[!r.z && 'Z', !r.a && 'A', !r.s && 'le symbole'].filter(Boolean).join(', ')}). Z est le nombre de protons ; A est le nombre de protons plus le nombre de neutrons ; le symbole se lit dans le tableau, en face de Z.`;
    }
    if (r.ok) return `✓ Correct : ${M.zaxTexte(e)} a ${pl(d.Z, "proton")} (Z), ${d.A} − ${d.Z} = ${pl(d.N, "neutron")} et, comme l’atome est neutre, ${pl(d.Z, "électron")}.`;
    return `✗ Pas encore (${[!r.p && 'les protons', !r.n && 'les neutrons', !r.e && 'les électrons'].filter(Boolean).join(', ')}). Les protons : le nombre du bas ; les neutrons : A − Z ; l’atome est neutre.`;
  };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['zax', 'Composition → écriture'], ['compo', 'Écriture → composition']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target" />{defi.type === 'zax' ? 'Défi : écrire le noyau' : 'Défi : retrouver la composition'}</div>
      {defi.type === 'zax' ? (
        <>
          <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Un noyau contient <strong>{defi.Z} proton{defi.Z > 1 ? "s" : ""}</strong> et <strong>{defi.N} neutron{defi.N > 1 ? "s" : ""}</strong>. Complétez son écriture conventionnelle (le symbole se lit dans le tableau).</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 8 }}>
            <label style={etiquette}>A (nucléons){defi.verifie && marque(defi.res.a)}<input inputMode="numeric" value={defi.rep.A} onChange={x => maj('A', x.target.value)} aria-label="A, nombre de nucléons" style={champ} /></label>
            <label style={etiquette}>Z (protons){defi.verifie && marque(defi.res.z)}<input inputMode="numeric" value={defi.rep.Z} onChange={x => maj('Z', x.target.value)} aria-label="Z, nombre de protons" style={champ} /></label>
            <label style={etiquette}>symbole{defi.verifie && marque(defi.res.s)}<select value={defi.rep.s} onChange={x => maj('s', x.target.value)} aria-label="Symbole de l’élément" style={{ ...sel, width: 100 }}><option value="">…</option>{M.SYMBOLES.map(s => <option key={s} value={s}>{s}</option>)}</select></label>
          </div>
          <IndiceDefi cache={false}>Z est le nombre de protons. A est le nombre de protons plus le nombre de neutrons. Le symbole correspond à la case du tableau dont le numéro est Z.</IndiceDefi>
        </>
      ) : (
        <>
          <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Voici l’écriture d’un noyau. Donnez le nombre de <strong>protons</strong>, de <strong>neutrons</strong> et, pour l’<strong>atome neutre</strong>, d’<strong>électrons</strong>.</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            <label style={etiquette}>protons{defi.verifie && marque(defi.res.p)}<input inputMode="numeric" value={defi.rep.p} onChange={x => maj('p', x.target.value)} aria-label="Nombre de protons" style={champ} /></label>
            <label style={etiquette}>neutrons{defi.verifie && marque(defi.res.n)}<input inputMode="numeric" value={defi.rep.n} onChange={x => maj('n', x.target.value)} aria-label="Nombre de neutrons" style={champ} /></label>
            <label style={etiquette}>électrons{defi.verifie && marque(defi.res.e)}<input inputMode="numeric" value={defi.rep.e} onChange={x => maj('e', x.target.value)} aria-label="Nombre d’électrons" style={champ} /></label>
          </div>
          <IndiceDefi cache={false}>Les protons : le nombre du bas (Z). Les neutrons : le nombre du haut moins le nombre du bas (A − Z). Dans l’atome neutre, il y a autant d’électrons que de protons.</IndiceDefi>
        </>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="noy-verif" onClick={verifier} disabled={!prete(defi)} style={{ ...styleBouton(true, '#15803d'), opacity: prete(defi) ? 1 : 0.5 }}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh" />Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.res.ok ? '#15803d' : '#dc2626' }}>{messageDefi(defi)}</div>}
    </div>);
  const sceneDefi = defi && (defi.type === 'zax'
    ? boite('Le noyau et les 18 premiers éléments', <><SceneDefiNoyau Z={defi.Z} /><div style={{ marginTop: 8 }}><MiniTableau /></div></>)
    : boite('Un noyau', <SceneDefiZax Z={defi.Z} />));

  // ---------- hypothèses ----------
  const lih = { marginBottom: 2 };
  const hypotheses = (
    <div style={{ fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li style={lih}><strong>Un modèle simplifié</strong> : l’atome est représenté par un noyau central et un nuage d’électrons. Les électrons ne tournent pas sur des orbites comme des planètes, et les schémas ne sont jamais à l’échelle : le noyau y est dessiné bien trop grand.</li>
        <li style={lih}><strong>Ordres de grandeur</strong> : un atome mesure environ 10⁻¹⁰{NB}m (quelques dixièmes de nanomètre selon l’atome) et un noyau environ 10⁻¹⁵{NB}m. On compare des puissances de 10, pas des mesures précises.</li>
        <li style={lih}><strong>Masses</strong> : proton et neutron sont pris de même masse, 1,67 × 10⁻²⁷{NB}kg (l’écart réel est de 0,1{NB}%). L’électron pèse 9,11 × 10⁻³¹{NB}kg. La masse d’un atome vaut donc A × 1,67 × 10⁻²⁷{NB}kg, à 1{NB}% près.</li>
        <li style={lih}><strong>Charges</strong> : e = 1,60 × 10⁻¹⁹{NB}C ; un atome est neutre : autant de protons que d’électrons.</li>
        <li style={lih}><strong>Noyaux étudiés</strong> : les 18 premiers éléments (Z de 1 à 18), avec pour chacun le noyau le plus courant. Un même élément peut avoir d’autres noyaux (même Z, A différent) : c’est l’objet de la simulation sur la transformation nucléaire.</li>
      </ul>
      <details style={{ marginTop: 8 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, color: KIT.txt }}>Pour les curieux</summary>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
          <li style={lih}><strong>Masse du noyau</strong> : en réalité, un noyau pèse un peu moins (environ 1{NB}%) que la somme des masses de ses nucléons. Cet écart est ignoré ici.</li>
          <li style={lih}><strong>Dessin du noyau</strong> : les protons et les neutrons y sont rangés au hasard ; leur vraie répartition n’est pas celle d’un tas de billes.</li>
        </ul>
      </details>
    </div>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search" />Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target" />Défis</button>
      <OngletExercices simId={SIM_ID} />
    </span>);

  // ════════════════ EXPLORATION ════════════════
  const ouvrir = k => setEx(s => ({ ...s, ouv: { ...s.ouv, [k]: !s.ouv[k] } }));
  const el = E(ex.Z), obj = M.OBJETS_AGRANDIS.find(o => o.id === ex.objet);
  const partE = M.partMasseElectrons(el.Z, el.A) * 100;
  const reglagesEx = (<>
    <label style={etiquette}>Élément (noyau le plus courant)
      <select value={ex.Z} onChange={x => setEx(s => ({ ...s, Z: Number(x.target.value) }))} style={sel}>{M.ELEMENTS.map(e => <option key={e.Z} value={e.Z}>{e.nom} ({e.s}) : Z = {e.Z}</option>)}</select></label>
    <label style={etiquette}>Schéma
      <select value={ex.vue} onChange={x => setEx(s => ({ ...s, vue: x.target.value }))} style={sel}><option value="atome">L’atome entier (modèle)</option><option value="zoom">Le noyau seul, très agrandi</option></select></label>
    {aide('Choisissez un élément : le schéma montre ses protons, ses neutrons et ses électrons, avec les nombres exacts. La vue du noyau seul le montre très agrandi, pour compter les nucléons : à ce même agrandissement, l’atome serait 100\u00a0000 fois plus large et sortirait de l’écran.')}
  </>);
  const scEx = <SceneExplore Z={ex.Z} vue={ex.vue} />;
  const mesuresEx = (
    <div style={{ marginTop: 8 }}>
      <LigneMesure nom="Écriture du noyau" valeur={<span style={{ fontFamily: "serif", fontSize: 19 }}><Zax A={el.A} Z={el.Z} s={el.s} /></span>} couleur={COL.orange} />
      <LigneMesure nom="Protons (Z)" valeur={el.Z} />
      <LigneMesure nom="Neutrons (A − Z)" valeur={el.N} />
      <LigneMesure nom="Nucléons (A)" valeur={el.A} />
      <LigneMesure nom="Électrons de l’atome neutre" valeur={el.Z} />
      <LigneMesure nom="Charge du noyau" valeur={`+${el.Z}e = ${sci(M.chargeNoyauC(el.Z), 3)}${NB}C`} />
      <LigneMesure nom="Charge de l’atome" valeur="0 (neutre)" />
      <LigneMesure nom="Masse de l’atome" valeur={`≈ ${sci(M.masseNoyau(el.A), 2)}${NB}kg`} />
      <LigneMesure nom="Part due aux électrons" valeur={`${nf(partE, 3)}${NB}%`} />
    </div>);
  const echelleEx = (
    <div style={{ ...styleBoite, marginTop: 12 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Agrandir le noyau</div>
      <label style={etiquette}>Si le noyau avait la taille de…
        <select value={ex.objet} onChange={x => setEx(s => ({ ...s, objet: x.target.value }))} style={sel}>{M.OBJETS_AGRANDIS.map(o => <option key={o.id} value={o.id}>{o.nom} ({nf(o.mm)}{NB}mm)</option>)}</select></label>
      <LigneMesure nom="…l’atome mesurerait" valeur={M.longueurFR(M.atomeAgrandiM(obj.mm))} couleur={COL.orange} />
      {aide(`On agrandit tout dans le même rapport, jusqu’à ce que le noyau ait la taille de l’objet choisi. L’atome étant ${nf(M.RAPPORT_TAILLES)} fois plus large que son noyau, il est alors ${nf(M.RAPPORT_TAILLES)} fois plus large que cet objet.`)}
    </div>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Choisissez le carbone, puis l’azote, puis le chlore. Quel nombre change toujours quand on change d’élément ? Quel nombre est égal au nombre d’électrons ?</li>
      <li>Passez à la vue du noyau seul : combien de protons (rouges) et de neutrons (gris) voyez-vous ? Retrouvez ces nombres dans la liste sous le schéma.</li>
      <li>Parmi les 18 éléments, y en a-t-il qui ont autant de neutrons que de protons ? Lesquels n’en ont pas autant ?</li>
      <li>Regardez la ligne « Part due aux électrons » : pour quel élément est-elle la plus grande ? Reste-t-elle grande ?</li>
      <li>Agrandissez le noyau jusqu’à un ballon de football : quelle taille ferait l’atome ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>atome : environ 10⁻¹⁰{NB}m ; noyau : environ 10⁻¹⁵{NB}m ; l’atome est 100{NB}000 fois plus large</li>
        <li>proton et neutron : 1,67 × 10⁻²⁷{NB}kg ; électron : 9,11 × 10⁻³¹{NB}kg, environ 1{NB}800 fois plus léger</li>
        <li>le noyau porte presque toute la masse de l’atome</li>
        <li>proton +e, électron −e, neutron sans charge ; e = 1,60 × 10⁻¹⁹{NB}C ; atome neutre</li>
        <li>Z : protons (l’élément) ; A : nucléons ; neutrons = A − Z ; écriture : <Zax A={12} Z={6} s="C" /></li>
      </ul>
    </ARetenir>);
  const auDela = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li><strong>Plusieurs noyaux pour un même élément.</strong> Le carbone a toujours Z = 6, mais on connaît des noyaux de carbone avec 6, 7 ou 8 neutrons. On les appelle des isotopes : voir la simulation sur la transformation nucléaire.</li>
      <li><strong>Pourquoi les protons restent-ils ensemble ?</strong> Ils portent la même charge et se repoussent. Une autre interaction, très intense mais seulement à très courte distance, les retient : c’est l’interaction forte (hors programme).</li>
      <li><strong>Les électrons ne tournent pas comme des planètes.</strong> Le schéma avec un nuage est un modèle : on ne peut pas dire où est exactement un électron, seulement où il a de grandes chances de se trouver.</li>
      <li><strong>Un atome qui gagne ou perd des électrons</strong> devient un ion : son noyau ne change pas, mais il n’est plus neutre (voir la simulation sur les atomes, les ions et les molécules).</li>
    </ul>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .noy-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .noy-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        @media (min-width: 901px) { .noy-l1.cote .noy-carte { order: 2; } .noy-l1.cote .noy-main { order: 1; } }
        @media (max-width: 900px) { .noy-l1.cote { grid-template-columns: minmax(0, 1fr); } .noy-l1.cote .noy-main { order: 1; } .noy-l1.cote .noy-carte { order: 2; } .noy-hypo-defi { order: 2; } }
        @media (max-width: 600px) { .noy-nomel { display: none; } }
        @media (prefers-reduced-motion: no-preference) { .noy-in { animation: noy-fondu 0.35s ease-out; } @keyframes noy-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Le noyau de l’atome : taille, masse et écriture ZAX</h2>
        <BoutonsModes mode={mode} setMode={changerMode} />
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Au centre de l’atome, un <strong>noyau</strong> minuscule porte presque toute sa masse. On compare sa taille et sa masse à celles de l’atome, puis on apprend à l’<strong>écrire</strong> avec son numéro atomique Z et son nombre de masse A.</div>
      {enExplore ? <>
        <div style={{ ...styleBoite, marginBottom: 12 }}>
          {reglagesEx}{scEx}{mesuresEx}
        </div>
        {echelleEx}
        <div style={{ height: 12 }} />
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Au-delà du parcours" ouvert={!!ex.ouv.discuter} onBascule={() => ouvrir('discuter')}>{auDela}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`noy-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="noy-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours} /></div> : enDefi ? <div className="noy-carte noy-hypo-defi">{panneauHypo}</div> : null}
          <div className="noy-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'zax' ? suiviZ : suiviC} /></div>}
            {enDefi && defi && <div className="noy-in" key={`${defi.type}${defi.Z}`}>{sceneDefi}</div>}
            {enGuide && <div className="noy-in" key={idE}>{sceneGuide}</div>}
          </div>
        </div>
        {enGuide && etape >= IDS.indexOf('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
