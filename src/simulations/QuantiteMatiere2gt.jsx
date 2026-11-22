import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi, ExempleResolu, VoirSolution, BoiteSolution } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./quantiteMatiere2gtModele";
import { QCM } from "./quantiteMatiere2gtQcm";
import { FicheBalance, FicheMole, FicheSci, FicheNn, FicheMasseEntite, FicheChaine } from "./QuantiteMatiere2gtFiches";
import { SceneComptage, SceneBoites, ScenePaquet, ScenePaquets, SceneAtomes, SceneBalance, SceneChaine } from "./QuantiteMatiere2gtScenes";

const SIM_ID = 178, CLE_GUIDE = 'quantite-matiere-2gt-guide-v1';
declarerDefis(SIM_ID, [['balance', 'Combien d’objets dans le tas ?'], ['echantillon', 'Quelle quantité de matière dans l’échantillon ?']]);

// ====================================================
//  SIM 178 — QUANTITÉ DE MATIÈRE : COMPTER LES ENTITÉS ET LA MOLE (2GT, thème « Constitution et transformations de la matière »,
//  partie « Modéliser la matière à l'échelle microscopique » : compter les entités dans un échantillon de matière).
//  Une seule idée : passer de la masse d'un échantillon au nombre d'entités N (en divisant par la masse d'une entité), puis à la quantité
//  de matière n (en divisant par N_A). On compte d'abord des objets du quotidien avec une balance, puis la mole comme « paquet », puis des atomes
//  et des molécules (masses en kg, puissances de 10). La masse molaire n'est PAS introduite (elle est au programme de 1G : sim 152) ; une seule
//  étape facultative en parle, sans notation. Modèle : quantiteMatiere2gtModele.js (testé).
//  Capacités visées (jamais affichées à l'élève) : déterminer la masse d'une entité à partir de sa formule brute et de la masse des atomes ;
//  déterminer le nombre d'entités et la quantité de matière d'une espèce dans une masse d'échantillon ; puissances de 10 et écriture scientifique.
// ====================================================

const NB = '\u00a0';
const nbf = M.nbf, sci = M.sci, nb = M.nb;
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', violet: '#6d28d9' };

// ---------- formules (MathML) ----------
const FN1 = <Formule><mi>N</mi><mo>=</mo><mfrac><mi>m</mi><msub><mi>m</mi><mtext>entité</mtext></msub></mfrac></Formule>;
const FN2 = <Formule><mi>N</mi><mo>=</mo><mi>n</mi><mo>×</mo><msub><mi>N</mi><mi>A</mi></msub></Formule>;
const FN3 = <Formule><mi>n</mi><mo>=</mo><mfrac><mi>N</mi><msub><mi>N</mi><mi>A</mi></msub></mfrac></Formule>;

// ---------- tableau du calcul de la masse d'une entité ----------
function TableauMasse({ e, cacher }) {
  const L = M.lignesMasse(e), tot = M.masseEntite(e);
  const td = { padding: '4px 6px', borderBottom: `1px solid ${KIT.bord}`, textAlign: 'center' };
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead><tr style={{ color: KIT.txt2, fontSize: 13 }}>
          <th style={td}>Atome</th><th style={td}>Nombre d’atomes</th><th style={td}>Masse d’un atome (kg)</th><th style={td}>Nombre × masse (kg)</th>
        </tr></thead>
        <tbody>
          {L.map(([a, k, ma, c]) => (
            <tr key={a}><td style={{ ...td, fontWeight: 700 }}><span style={{ color: M.COULEUR_ATOME[a] || COL.gris }}>●</span> {a}</td><td style={td}>{k}</td><td style={td}>{sci(ma, 3)}</td>
              <td style={td}>{cacher ? '?' : `${k} × ${sci(ma, 3)} = ${sci(c, 3)}`}</td></tr>))}
          <tr><td colSpan={3} style={{ ...td, textAlign: 'right', fontWeight: 700 }}>Masse de {M.formuleTexte(e)} =</td>
            <td style={{ ...td, fontWeight: 700, color: cacher ? KIT.txt2 : COL.orange }}>{cacher ? '? kg' : `${sci(tot, 3)}${NB}kg`}</td></tr>
        </tbody>
      </table>
    </div>);
}

// Élision : « de aluminium » → « d’aluminium » (renvoie « de » ou « d’ », suivi du nom)
const de = nom => (/^[aeiouyhàâéèêëîïôû]/i.test(nom) ? `d’${nom}` : `de ${nom}`) + ' ';
const aide = (t) => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{t}</div>;
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);

// ====================================================
export function SimulationQuantiteMatiere2gt() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviB, noterB, vueB] = useCompteurDefi(), [suiviE, noterE, vueE] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('balance');
  const [ex, setEx] = useState({ objet: 'quotidien', obj: 'coquillette', mObj: 200, paquet: 12, ent: 'h2o', mEnt: 5.0, ouv: {} });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const setE = f => setEx(s => ({ ...s, ...f }));

  // ---------- étapes du parcours ----------
  const IDS = ['balance', 'memeunite', 'paquets', 'mole', 'nbentites', 'nbmoles', 'massemol', 'conversion', 'nbechant', 'nechant', 'pas1g', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => etape > IDS.indexOf(id);
  const fait = id => apres(id) || !!(guide.reussies && guide.reussies[IDS.indexOf(id)]);   // étape passée ou réussie à l'instant

  const eau = M.entite('h2o');
  const mEau = M.masseEntite(eau);                               // 2,99 × 10⁻²⁶ kg

  const ETAPES = [
    { id: 'balance', titre: 'Compter avec une balance', focus: ['scene'],
      texte: <>Compter des objets un par un, c’est long. Une balance peut le faire à notre place : on pèse <strong>un seul objet</strong>, puis on pèse <strong>tout le tas</strong>. Chaque objet que l’on compte (ici une coquillette, une pâte en forme de coude) s’appelle une <strong>entité</strong>.
        <ExempleResolu>Une coquillette pèse 0,50{NB}g. Un petit bol de coquillettes pèse 12{NB}g. Deux coquillettes pèsent 1{NB}g, donc 12{NB}g en contiennent 12 × 2 = 24. On trouve la même chose avec une division : 12{NB}g ÷ 0,50{NB}g = <strong>24 coquillettes</strong>. Les grammes se simplifient : il reste un nombre de coquillettes.</ExempleResolu>
        À vous : on garde 0,50{NB}g par coquillette, mais le bol est plus grand. Il pèse <strong>45{NB}g</strong>.</>,
      tache: { type: 'num', q: 'Combien de coquillettes contient le grand bol ?', carnet: 'Nombre de coquillettes (bol de 45 g)', unite: 'coquillettes', vrai: 90, tol: 0.005, affiche: v => M.entier(v),
        calcul: () => ['Une coquillette pèse 0,50 g : le nombre de coquillettes est la masse du bol divisée par la masse d’une coquillette.', '45 g ÷ 0,50 g = 90 coquillettes.'],
        pieges: [[22.5, 'Vous avez multiplié (45 × 0,50 = 22,5). Pour trouver un nombre d’objets, on divise la masse du bol par la masse d’un objet.'], [0.0111, 'La division est à l’envers : on divise la masse du bol (45 g) par la masse d’une coquillette (0,50 g).']],
        expl: '45 g ÷ 0,50 g = 90 coquillettes : on a compté sans compter.', indice: 'Deux coquillettes pèsent 1 g. Combien en faut-il pour faire 45 g ?' } },
    { id: 'memeunite', titre: 'Attention aux unités', focus: ['scene'],
      texte: <>Pour diviser deux masses, elles doivent être dans la <strong>même unité</strong>. Rappel : <strong>1{NB}kg = 1000{NB}g</strong>.
        <ExempleResolu>Un tas de perles de verre pèse 3{NB}kg ; une perle pèse 0,20{NB}g. On convertit : 3{NB}kg = 3000{NB}g. Puis 3000{NB}g ÷ 0,20{NB}g = <strong>15 000 perles</strong>.</ExempleResolu>
        À vous : un tas de lentilles pèse <strong>1,2{NB}kg</strong> ; une lentille pèse <strong>0,050{NB}g</strong>.</>,
      tache: { type: 'num', q: 'Combien de lentilles contient le tas ?', carnet: 'Nombre de lentilles (1,2 kg)', unite: 'lentilles', vrai: 24000, tol: 0.01, affiche: v => M.entier(v),
        calcul: () => ['1,2 kg = 1200 g (car 1 kg = 1000 g).', 'Nombre de lentilles = 1200 g ÷ 0,050 g = 24 000 lentilles.'],
        pieges: [[24, 'Vous n’avez pas converti la masse du tas en grammes : 1,2 kg = 1200 g. Les deux masses doivent avoir la même unité.'], [60, 'Vous avez multiplié (1200 × 0,050 = 60). Pour trouver un nombre d’objets, on divise.']],
        expl: '1,2 kg = 1200 g ; 1200 g ÷ 0,050 g = 24 000 lentilles.', indice: 'Écrivez d’abord 1,2 kg en grammes. Puis divisez par la masse d’une lentille.' } },
    { id: 'paquets', titre: 'Compter par paquets', focus: ['scene'],
      retenirTitre: 'À retenir : compter avec une balance',
      retenir: <FicheBalance/>,
      texte: <>Quand il y a énormément d’objets, on les compte par <strong>paquets</strong> : une boîte de 6 œufs, une douzaine, une rame de 500 feuilles… Un paquet contient toujours le <strong>même nombre d’objets</strong>.
        <ExempleResolu>4 boîtes de 6 œufs contiennent 4 × 6 = <strong>24 œufs</strong>. Dans l’autre sens : 24 œufs ÷ 6 œufs par boîte = <strong>4 boîtes</strong>.</ExempleResolu>
        À vous : on a <strong>150 œufs</strong> à ranger dans des boîtes de 6 œufs.</>,
      tache: { type: 'num', q: 'Combien de boîtes faut-il ?', carnet: 'Nombre de boîtes (150 œufs)', unite: 'boîtes', vrai: 25, tol: 0.005, affiche: v => M.entier(v),
        calcul: () => ['Chaque boîte contient 6 œufs : le nombre de boîtes est le nombre d’œufs divisé par 6.', '150 œufs ÷ 6 œufs par boîte = 25 boîtes.'],
        pieges: [[900, 'Vous avez multiplié (150 × 6 = 900). Pour trouver un nombre de boîtes, on divise le nombre d’œufs par le nombre d’œufs d’une boîte.'], [0.04, 'La division est à l’envers : on divise 150 œufs par 6 œufs par boîte.']],
        expl: '150 ÷ 6 = 25 boîtes.', indice: 'Chaque boîte contient 6 œufs : combien de fois 6 « rentre » dans 150 ?' } },
    { id: 'mole', titre: 'La mole : un paquet pour les atomes', focus: ['scene'],
      texte: <>Les atomes et les molécules sont si minuscules que même un grain de sel en contient des milliards de milliards. Les chimistes utilisent donc un paquet géant : la <strong>mole</strong> (symbole <strong>mol</strong>).
        <div style={{ margin: '8px 0', textAlign: 'center', fontSize: 17, fontWeight: 800, color: '#b45309' }}>1{NB}mol = 6,02 × 10²³ entités</div>
        <div style={{ margin: '-4px 0 8px', textAlign: 'center', fontSize: 13.5, color: KIT.txt2 }}>(valeur arrondie ; la valeur exacte est 6,022 140 76 × 10²³)</div>
        Une entité est un atome, une molécule ou un ion. Ce nombre est tellement grand qu’on l’écrit en <strong>écriture scientifique</strong> : 6,02 × 10²³ = 602 suivi de 21 zéros. Le nombre d’entités d’une mole s’appelle la <strong>constante d’Avogadro</strong> : N<sub>A</sub> = 6,02 × 10²³ mol⁻¹ (« 6,02 × 10²³ entités <em>par</em> mole »).</>,
      tache: { type: 'qcm', ...QCM.mole } },
    { id: 'nbentites', titre: 'Du nombre de moles au nombre d’entités', focus: ['scene'],
      retenirTitre: 'À retenir : la mole, un paquet',
      retenir: <FicheMole/>,
      texte: <>Pour les œufs, on multiplie le nombre de boîtes par 6. Pour les entités, on multiplie le nombre de paquets, c’est-à-dire la <strong>quantité de matière</strong> <em>n</em> (en mol), par le nombre d’entités d’un paquet. N est le nombre d’entités.{FN2}
        <ExempleResolu>Pour <em>n</em> = 4,0{NB}mol : N = 4,0 × 6,02 × 10²³ = 24,08 × 10²³ ≈ <strong>24 × 10²³ entités</strong>. En écriture scientifique usuelle (un seul chiffre avant la virgule) : 24 × 10²³ = 2,4 × 10²⁴ entités.</ExempleResolu>
        À vous : <em>n</em> = <strong>0,50{NB}mol</strong>.</>,
      tache: { type: 'num', q: 'Combien d’entités y a-t-il dans 0,50 mol ? Écrivez le nombre qui multiplie 10²³.', carnet: 'Nombre d’entités (0,50 mol)', unite: '× 10²³ entités', vrai: 3.01, tol: 0.01, affiche: v => nbf(v, 2),
        calcul: () => ['N = n × N_A = 0,50 mol × 6,02 × 10²³ mol⁻¹ (les mol se simplifient).', 'N = 0,50 × 6,02 × 10²³ = 3,01 × 10²³ entités : la moitié d’un paquet.'],
        pieges: [[6.02, 'Vous avez oublié de multiplier par 0,50 : il n’y a que la moitié d’un paquet.'], [12.04, 'Vous avez divisé par 0,50 : on multiplie, N = n × N_A.'], [0.083, 'Vous avez divisé 0,50 par 6,02 : on multiplie, N = n × N_A.']],
        expl: 'N = 0,50 × 6,02 × 10²³ = 3,01 × 10²³ entités.', indice: 'N = n × N_A : multipliez 0,50 par 6,02. La puissance de 10 ne change pas.' } },
    { id: 'nbmoles', titre: 'Du nombre d’entités au nombre de moles', focus: ['scene'],
      retenirTitre: 'À retenir : écrire et changer une puissance de 10',
      retenir: <FicheSci/>,
      texte: <>Dans l’autre sens, comme pour les boîtes d’œufs (œufs ÷ 6), on <strong>divise</strong> le nombre d’entités par le nombre d’entités d’un paquet. Le résultat est en mol.{FN3}
        <ExempleResolu>On a N = 1,204 × 10²⁴ entités. On écrit N avec 10²³ : N = 12,04 × 10²³. Alors <em>n</em> = 12,04 × 10²³ ÷ (6,02 × 10²³) = 12,04 ÷ 6,02 = <strong>2,00 mol</strong> : les 10²³ se simplifient.</ExempleResolu>
        À vous : <strong>N = 1,806 × 10²⁴ entités</strong>.</>,
      tache: { type: 'num', q: 'Quelle est la quantité de matière n, en mol ?', carnet: 'Quantité de matière (N = 1,806 × 10²⁴)', unite: 'mol', vrai: 3.00, tol: 0.01, affiche: v => nbf(v, 2),
        calcul: () => ['N = 1,806 × 10²⁴ = 18,06 × 10²³ entités (10²⁴ = 10 × 10²³).', 'n = N ÷ N_A = 18,06 × 10²³ ÷ (6,02 × 10²³) = 18,06 ÷ 6,02 = 3,00 mol.'],
        pieges: [[0.3, 'Vous avez divisé 1,806 par 6,02 sans tenir compte de 10²⁴ = 10 × 10²³ : le résultat est dix fois trop petit.'], [30, 'Le résultat est dix fois trop grand : 10²⁴ ÷ 10²³ = 10, et 1,806 ÷ 6,02 = 0,300.'], [10.87, 'Vous avez multiplié N par N_A ; pour trouver n, on divise.']],
        expl: 'n = 1,806 × 10²⁴ ÷ (6,02 × 10²³) = 18,06 ÷ 6,02 = 3,00 mol.', indice: 'Écrivez N avec 10²³ : 1,806 × 10²⁴ = 18,06 × 10²³. Puis divisez 18,06 par 6,02.' } },
    { id: 'massemol', titre: 'La masse d’une molécule', focus: ['scene', 'tableau'],
      retenirTitre: 'À retenir : passer de n à N et de N à n',
      retenir: <FicheNn/>,
      texte: <>Une molécule est un assemblage d’atomes. Sa <strong>formule brute</strong> dit combien il y a d’atomes de chaque sorte : H₂O = 2 atomes H + 1 atome O. La masse d’une molécule est la <strong>somme des masses de tous ses atomes</strong>. Les atomes sont si légers que leur masse s’écrit en kg avec une puissance de 10 négative : 10⁻²⁶ = 1 ÷ 10²⁶, un nombre minuscule.
        <ExempleResolu>Le dioxygène O₂ a 2 atomes O, avec m(O) = 2,66 × 10⁻²⁶{NB}kg. Donc m(O₂) = 2 × 2,66 × 10⁻²⁶ = <strong>5,32 × 10⁻²⁶{NB}kg</strong>.</ExempleResolu>
        À vous : la molécule d’eau H₂O. Données : <strong>m(H) = 1,67 × 10⁻²⁷{NB}kg</strong> et <strong>m(O) = 2,66 × 10⁻²⁶{NB}kg</strong>. Pour additionner deux nombres, il faut la même puissance de 10.</>,
      tache: { type: 'num', q: 'Quelle est la masse d’une molécule d’eau ? Écrivez le nombre qui multiplie 10⁻²⁶ kg.', carnet: 'Masse d’une molécule d’eau', unite: '× 10⁻²⁶ kg', vrai: 2.994, tol: 0.005, affiche: v => nbf(v, 2),
        calcul: () => ['H₂O = 2 atomes H + 1 atome O.', '2 × m(H) = 2 × 1,67 × 10⁻²⁷ = 3,34 × 10⁻²⁷ kg = 0,334 × 10⁻²⁶ kg.', 'm(H₂O) = 0,334 × 10⁻²⁶ + 2,66 × 10⁻²⁶ = 2,99 × 10⁻²⁶ kg.'],
        pieges: [[2.66, 'Vous avez oublié les atomes d’hydrogène : H₂O contient aussi 2 atomes H.'], [6.00, 'Vous avez additionné 3,34 et 2,66 (= 6,00) comme si les puissances de 10 étaient les mêmes. Elles ne le sont pas (10⁻²⁷ et 10⁻²⁶) : écrivez 3,34 × 10⁻²⁷ = 0,334 × 10⁻²⁶ avant d’additionner.'], [2.827, 'Vous n’avez compté qu’un seul atome H : H₂O en contient deux.']],
        expl: 'm(H₂O) = 2 × 1,67 × 10⁻²⁷ + 2,66 × 10⁻²⁶ = 0,334 × 10⁻²⁶ + 2,66 × 10⁻²⁶ = 2,99 × 10⁻²⁶ kg.', indice: 'Calculez d’abord la masse des deux atomes H : 2 × 1,67 × 10⁻²⁷ = 3,34 × 10⁻²⁷ kg. Écrivez-la avec 10⁻²⁶ (3,34 × 10⁻²⁷ = 0,334 × 10⁻²⁶), puis ajoutez la masse de l’atome O.' } },
    { id: 'conversion', titre: 'Convertir des grammes en kilogrammes', focus: ['scene'],
      retenirTitre: 'À retenir : la masse d’une molécule',
      retenir: <FicheMasseEntite/>,
      texte: <>Les masses d’atomes sont en kg, mais on pèse un échantillon en grammes. Il faut convertir : <strong>1{NB}g = 10⁻³{NB}kg</strong> (un gramme est mille fois plus petit qu’un kilogramme).
        <ExempleResolu>20{NB}g = 2,0 × 10¹{NB}g = 2,0 × 10¹ × 10⁻³{NB}kg = <strong>2,0 × 10⁻²{NB}kg</strong>. On additionne les puissances de 10 : 1 + (−3) = −2.</ExempleResolu>
        À vous : une goutte d’eau pèse <strong>0,050{NB}g</strong>. Il faudra sa masse en kg pour la suite.</>,
      tache: { type: 'qcm', ...QCM.conversion } },
    { id: 'nbechant', titre: 'Combien de molécules dans la goutte ?', focus: ['scene'],
      texte: <>On a tout ce qu’il faut. Une molécule d’eau pèse <strong>2,99 × 10⁻²⁶{NB}kg</strong> (étape 7) et la goutte pèse <strong>5,0 × 10⁻⁵{NB}kg</strong> (étape 8). C’est la méthode de la balance, comme pour les coquillettes.{FN1}
        <ExempleResolu>Un échantillon de dioxygène pèse 8,0 × 10⁻⁴{NB}kg ; une molécule O₂ pèse 5,32 × 10⁻²⁶{NB}kg. N = 8,0 × 10⁻⁴ ÷ (5,32 × 10⁻²⁶) = (8,0 ÷ 5,32) × (10⁻⁴ ÷ 10⁻²⁶) = <strong>1,50 × 10²² molécules</strong>. On divise les nombres, et on soustrait les puissances : −4 − (−26) = 22.</ExempleResolu>
        À vous : la goutte d’eau.</>,
      tache: { type: 'num', q: 'Combien de molécules d’eau la goutte contient-elle ? Écrivez le nombre qui multiplie 10²¹.', carnet: 'Nombre de molécules d’eau dans la goutte', unite: '× 10²¹ molécules', vrai: 1.672, tol: 0.02, affiche: v => nbf(v, 2),
        calcul: () => ['N = m ÷ m_entité, avec les deux masses en kg.', 'N = 5,0 × 10⁻⁵ ÷ (2,99 × 10⁻²⁶) = (5,0 ÷ 2,99) × (10⁻⁵ ÷ 10⁻²⁶).', '5,0 ÷ 2,99 = 1,67 et 10⁻⁵ ÷ 10⁻²⁶ = 10²¹ (car −5 − (−26) = 21). Donc N = 1,67 × 10²¹ molécules.'],
        pieges: [[0.598, 'La division est à l’envers : on divise la masse de la goutte (5,0 × 10⁻⁵ kg) par la masse d’une molécule.'], [14.95, 'Vous avez multiplié (5,0 × 2,99 = 14,95). Pour compter des entités avec une balance, on divise.'], [1.672, 'Vous êtes tout près. Refaites la division sans arrondir trop tôt : gardez 3 chiffres significatifs (5,0 ÷ 2,99 = 1,67…).', 0.08]],
        expl: 'N = 5,0 × 10⁻⁵ ÷ (2,99 × 10⁻²⁶) = 1,67 × 10²¹ molécules.', indice: 'Divisez les nombres (5,0 ÷ 2,99), puis les puissances de 10 : 10⁻⁵ ÷ 10⁻²⁶ = 10²¹ (on soustrait : −5 − (−26) = 21).' } },
    { id: 'nechant', titre: 'Combien de moles dans la goutte ?', focus: ['scene'],
      texte: <>La goutte contient N = <strong>1,67 × 10²¹ molécules</strong> d’eau (étape précédente). Combien de paquets (de moles) cela fait-il ?{FN3}
        <ExempleResolu>Pour l’échantillon de dioxygène : N = 1,50 × 10²² molécules. <em>n</em> = 1,50 × 10²² ÷ (6,02 × 10²³) = (1,50 ÷ 6,02) × (10²² ÷ 10²³) = 0,249 × 10⁻¹ = <strong>2,49 × 10⁻² mol</strong>, soit 0,0249{NB}mol.</ExempleResolu>
        À vous : la goutte d’eau.</>,
      tache: { type: 'num', q: 'Quelle quantité de matière d’eau la goutte contient-elle ? Écrivez le nombre qui multiplie 10⁻³.', carnet: 'Quantité de matière d’eau dans la goutte', unite: '× 10⁻³ mol', vrai: 2.774, tol: 0.01, affiche: v => nbf(v, 2),
        calcul: () => ['n = N ÷ N_A = 1,67 × 10²¹ ÷ (6,02 × 10²³).', '1,67 ÷ 6,02 = 0,277 et 10²¹ ÷ 10²³ = 10⁻².', 'n = 0,277 × 10⁻² = 2,77 × 10⁻³ mol, soit 0,00277 mol.'],
        pieges: [[0.277, 'Le nombre est juste, mais l’unité demandée est « × 10⁻³ mol » : 0,277 × 10⁻² = 2,77 × 10⁻³.'], [3.6, 'La division est à l’envers : n = N ÷ N_A (le nombre d’entités en haut).'], [27.7, 'Vérifiez la puissance de 10 : 10²¹ ÷ 10²³ = 10⁻², donc 0,277 × 10⁻² = 2,77 × 10⁻³.']],
        expl: 'n = 1,67 × 10²¹ ÷ (6,02 × 10²³) = 2,77 × 10⁻³ mol.', indice: 'Divisez les nombres (1,67 ÷ 6,02), puis les puissances de 10 : 10²¹ ÷ 10²³ = 10⁻² (21 − 23 = −2). Terminez en écrivant le résultat avec 10⁻³.' } },
    { id: 'pas1g', titre: '★ Facultatif : un pas vers la Première', focus: ['scene'],
      texte: <>Cette étape est facultative : pas de question, juste une curiosité qui servira en Première. Une mole de molécules d’eau pèse combien ? C’est 6,02 × 10²³ molécules, qui pèsent chacune 2,99 × 10⁻²⁶{NB}kg.
        <ExempleResolu>6,02 × 10²³ × 2,99 × 10⁻²⁶ = 18,0 × 10⁻³{NB}kg = 0,0180{NB}kg = <strong>18,0{NB}g</strong>. Une mole d’eau pèse donc environ 18{NB}g : à peu près une cuillère à soupe d’eau.</ExempleResolu>
        En Première, cette « masse d’une mole » aura un nom et une notation, et permettra de passer directement de la masse à la quantité de matière. Retenez seulement l’idée : <strong>une mole a une masse, qui dépend de l’entité</strong>. En exploration, comparez l’eau avec l’aluminium ou le cuivre.</>,
      tache: null },
    { id: 'bilan', titre: 'Le bilan', focus: [],
      retenirTitre: 'À retenir : de la masse à la quantité de matière',
      retenir: <FicheChaine/>,
      texte: <>Vous savez maintenant compter des entités avec une balance, les regrouper en paquets de 6,02 × 10²³ (la mole), et passer de la masse d’un échantillon à son nombre d’entités, puis à sa quantité de matière. Testez-vous avec les défis, ou explorez librement.</>,
      tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => { setDefi({ ...(type === 'balance' ? { type, ...M.tirerDefiBalance(defi && defi.type === 'balance' ? defi : null) } : { type, ...M.tirerDefiEchantillon(defi && defi.type === 'echantillon' ? defi : null) }), reps: {}, verifie: false, solution: false }); };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    const x = lireNombre(defi.reps.v), tol = defi.type === 'balance' ? 0.01 : 0.06, ok = isFinite(x) && proche(x, defi.vrai, tol);
    setDefi(d => ({ ...d, verifie: true, ok })); (defi.type === 'balance' ? noterB : noterE)(ok);
  };
  const champ = (label, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps.v ?? ''} aria-label={`${label} ${unite}`} onKeyDown={e => e.key === 'Enter' && document.getElementById('qm2-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, v: e.target.value }, verifie: false }))} inputMode="decimal"
        style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const defiBalance = defi && defi.type === 'balance';
  const masseUneDefi = defiBalance ? `${nbf(defi.o.m, defi.o.m < 0.1 ? 3 : 2)}` : '';
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['balance', 'Compter avec la balance'], ['echantillon', 'Masse, nombre et moles']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defiBalance ? 'Défi : combien d’objets dans le tas ?' : 'Défi : quelle quantité de matière dans l’échantillon ?'}</div>
      {defiBalance ? <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Un tas de {defi.o.pluriel} pèse <strong>{nb(defi.valeur, 3)}{NB}{defi.enKg ? 'kg' : 'g'}</strong>. {defi.o.art === 'un' ? 'Un' : 'Une'} {defi.o.nom} pèse <strong>{masseUneDefi}{NB}g</strong>. Combien de {defi.o.pluriel} y a-t-il dans le tas ? Donnez un nombre entier.</div>
        {champ(`Nombre de ${defi.o.pluriel}`, '')}
        <IndiceDefi cache={false}>Le nombre d’objets est la masse du tas divisée par la masse d’un objet : N = frac(m|m_entité). Mettez d’abord les deux masses dans la même unité (1 kg = 1000 g) : les grammes se simplifient.</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Un échantillon {de(defi.e.nom.replace(/^(atome|molécule|ion) (d’|de |du )?/, ''))}({M.formuleTexte(defi.e)}) pèse <strong>{nbf(defi.m, defi.m < 1 ? 2 : 1)}{NB}g</strong>. La masse d’{defi.e.type === 'molécule' ? 'une ' : 'un '}{defi.e.nom} est <strong>{sci(defi.mEnt, 3)}{NB}kg</strong>. Quelle est la quantité de matière <em>n</em> de l’échantillon ? On donne N<sub>A</sub> = 6,02 × 10²³ mol⁻¹. Donnez <em>n</em> en mol avec 2 chiffres significatifs (par exemple 0,019).</div>
        {champ('Quantité de matière n', 'mol')}
        <IndiceDefi cache={false}>Trois étapes : (1) convertir la masse en kg (1 g = 10⁻³ kg) ; (2) N = frac(m|m_entité) ; (3) n = frac(N|N_A). Gardez 3 chiffres significatifs dans les calculs intermédiaires et arrondissez seulement à la fin.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="qm2-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        <VoirSolution visible={!(defi.verifie && defi.ok) && !defi.solution} onClick={() => { (defiBalance ? vueB : vueE)(); setDefi(d => ({ ...d, solution: true })); }}/>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? (defiBalance ? `✓ Correct : ${M.entier(defi.N)} ${defi.o.pluriel}.` : `✓ Correct : N = ${sci(defi.N, 3)} entités, puis n = ${nb(defi.n, 3)} mol (marge acceptée : ± 6 %).`)
          : defiBalance ? '✗ Vérifiez : mettez la masse du tas et celle d’un objet dans la même unité, puis divisez la première par la seconde.'
            : '✗ Vérifiez : masse en kg (g × 10⁻³), puis N = m ÷ masse d’une entité, puis n = N ÷ N_A.'}
      </div>}
      {defi.solution && <BoiteSolution>{defiBalance
        ? <>Masse du tas : {nb(defi.valeur, 3)}{NB}{defi.enKg ? 'kg' : 'g'}{defi.enKg ? <> = {nb(defi.totG, 3)}{NB}g</> : null}. N = masse du tas ÷ masse d’un objet = {nb(defi.totG, 3)}{NB}g ÷ {masseUneDefi}{NB}g = <strong>{M.entier(defi.N)} {defi.o.pluriel}</strong>.</>
        : <>(1) m = {nbf(defi.m, defi.m < 1 ? 2 : 1)}{NB}g = {nb(defi.m / 1000, 2)}{NB}kg. (2) N = m ÷ m<sub>entité</sub> = {nb(defi.m / 1000, 2)}{NB}kg ÷ {sci(defi.mEnt, 3)}{NB}kg = {sci(defi.N, 3)} entités. (3) n = N ÷ N<sub>A</sub> = {sci(defi.N, 3)} ÷ (6,02{NB}×{NB}10²³{NB}mol⁻¹) = <strong>{nb(defi.n, 3)}{NB}mol</strong> (réponse acceptée à ± 6 % près).</>}</BoiteSolution>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Entités toutes identiques</strong> : compter par la masse suppose que tous les objets (coquillettes, lentilles, atomes d’un même élément…) ont la même masse. Les vraies coquillettes diffèrent un peu : le résultat est donc approché, d’autant meilleur que le tas est grand. Pour un atome, on prend une masse moyenne.</li>
      <li><strong>Masses des atomes arrondies</strong> : valeurs en kg à 3 chiffres significatifs (m(H) = 1,67 × 10⁻²⁷ kg, m(O) = 2,66 × 10⁻²⁶ kg…). Les résultats n’ont pas plus de 3 chiffres significatifs.</li>
      <li><strong>Masse d’une molécule = somme des masses de ses atomes</strong> : l’énergie des liaisons est négligeable devant la masse des atomes.</li>
      <li><strong>Masse d’un électron négligée</strong> : un électron est environ 1800 fois plus léger qu’un proton ; un ion a donc la même masse que l’atome dont il vient (m(Na⁺) = m(Na)).</li>
      <li><strong>Constante d’Avogadro</strong> : N<sub>A</sub> = 6,02 × 10²³ mol⁻¹, arrondi de la valeur exacte 6,022 140 76 × 10²³ mol⁻¹ (nombre exact, fixé par la définition de la mole).</li>
      <li><strong>Échantillon pur</strong> : une seule espèce chimique, sans impureté ni eau en plus.</li>
      <li><strong>Arrondis et chiffres significatifs</strong> : un résultat n’a pas plus de chiffres significatifs que la donnée la moins précise. On garde un chiffre de plus dans les calculs intermédiaires et on arrondit à la fin ; les réponses sont acceptées avec une petite marge : 0,5 à 2 % selon les questions du parcours ; ± 1 % pour le défi « tas sur la balance » ; ± 6 % pour le défi « masse, nombre et moles » (les arrondis intermédiaires s’y accumulent).</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => setE({ ouv: { ...ex.ouv, hypo: !ex.ouv.hypo } })}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const donnee = (nom, valeur, c) => <LigneMesure key={nom} nom={nom} valeur={valeur} couleur={c}/>;
  const mGoutte = '5,0 × 10⁻⁵ kg', mEauTxt = `${sci(mEau, 3)} kg`, NGoutte = '1,67 × 10²¹', nGoutte = '2,77 × 10⁻³ mol';
  const sceneGuide = (() => {
    switch (idE) {
      case 'balance': return boite('Compter des coquillettes', <SceneComptage id="coquillette" nom="coquillette" pluriel="coquillettes" mUne="0,50 g" mTas="45 g" nombreVisible={26}/>, cadre('scene'));
      case 'memeunite': return boite('Un tas de lentilles', <SceneComptage id="lentille" nom="lentille" pluriel="lentilles" mUne="0,050 g" mTas="1,2 kg" nombreVisible={34}/>, cadre('scene'));
      case 'paquets': return boite('Des paquets d’œufs', <SceneBoites boites={4} k={6}/>, cadre('scene'));
      case 'mole': return boite('Une entité, puis un paquet : la mole', <ScenePaquet/>, cadre('scene'));
      case 'nbentites': return boite('Des paquets', <ScenePaquets n={0.5} texte="n = 0,50 mol"/>, cadre('scene'));
      case 'nbmoles': return boite('Combien de paquets ?', fait('nbmoles') ? <ScenePaquets n={3} texte="n = 3,00 mol"/> : <ScenePaquets inconnu/>, cadre('scene'));
      case 'massemol': return (<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {boite('Les atomes de la molécule H₂O', <SceneAtomes e={eau} MASSE_ATOME={M.MASSE_ATOME}/>, cadre('scene'))}
        {boite('Calcul de la masse de la molécule', <TableauMasse e={eau} cacher={!fait('massemol')}/>, cadre('tableau'))}
      </div>);
      case 'conversion': return boite('Une goutte d’eau',
        <><SceneBalance nom="Une goutte d’eau" masse="0,050 g"/><div style={{ marginTop: 8 }}>
          {donnee('Masse de la goutte', `0,050${NB}g`)}
          {fait('conversion') && donnee('Masse en kilogrammes', `5,0${NB}×${NB}10⁻⁵${NB}kg`, COL.orange)}</div></>, cadre('scene'));
      case 'nbechant': return boite('De la masse au nombre de molécules',
        <SceneChaine m={mGoutte} N={fait('nbechant') ? `${NGoutte}` : null} n={null} mEnt={mEauTxt} cherche="N"/>, cadre('scene'));
      case 'nechant': return boite('Du nombre de molécules au nombre de moles',
        <SceneChaine m={mGoutte} N={NGoutte} n={fait('nechant') ? nGoutte : null} mEnt={mEauTxt} cherche="n"/>, cadre('scene'));
      case 'pas1g': return boite('Une mole de molécules d’eau', <SceneBalance nom="1 mol de molécules d’eau" masse="18,0 g"/>, cadre('scene'));
      case 'bilan': return boite('La chaîne complète, pour la goutte d’eau', <SceneChaine m={mGoutte} N={NGoutte} n={nGoutte} mEnt={mEauTxt}/>, cadre('scene'));
      default: return null;
    }
  })();

  // ════════════════ EXPLORATION ════════════════
  const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
  const etiquette = (l, ctrl) => <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>{l}{ctrl}</label>;
  const ouvrir = k => setE({ ouv: { ...ex.ouv, [k]: !ex.ouv[k] } });

  // --- objet 1 : des objets du quotidien comptés par la masse ---
  const o = M.objet(ex.obj), Nobj = M.nombreDepuisMasse(ex.mObj, o.m), nPaq = Nobj / ex.paquet;
  const mUneTxt = `${nbf(o.m, o.m < 0.1 ? 3 : 2)} g`, mTasTxt = ex.mObj >= 1000 ? `${nbf(ex.mObj / 1000, 2)} kg` : `${nbf(ex.mObj, 0)} g`;
  const objReglages = (<>
    {etiquette('Objet à compter', <select value={ex.obj} onChange={x => setE({ obj: x.target.value })} style={sel}>{M.OBJETS.map(t => <option key={t.id} value={t.id}>{t.nom} ({nbf(t.m, t.m < 0.1 ? 3 : 2)} g)</option>)}</select>)}
    <Curseur nom="Masse du tas" valeur={ex.mObj} onChange={v => setE({ mObj: v })} min={10} max={1000} pas={10} unite="g" decimales={0} couleur="#b45309"/>
    {aide('Choisissez un objet, puis réglez la masse du tas : la balance en déduit le nombre d’objets.')}
    <Section titre={`Compter par paquets : paquets de ${ex.paquet}`} ouvert={!!ex.ouv.paq} onBascule={() => ouvrir('paq')}>
      {etiquette('Nombre d’objets par paquet', <select value={ex.paquet} onChange={x => setE({ paquet: Number(x.target.value) })} style={sel}>{[6, 12, 100, 1000].map(p => <option key={p} value={p}>{p}</option>)}</select>)}
      {aide('Comme les œufs en boîtes de 6 : le nombre de paquets est le nombre d’objets divisé par la taille d’un paquet.')}
    </Section>
  </>);
  const objMesures = (<>
    {donnee(`Masse ${o.art === 'un' ? 'd’un' : 'd’une'} ${o.nom}`, `${nbf(o.m, o.m < 0.1 ? 3 : 2)}${NB}g`)}
    {donnee('Masse du tas', `${nbf(ex.mObj, 0)}${NB}g`)}
    {donnee('Nombre d’objets N = m ÷ masse d’un objet', M.entier(Nobj), COL.violet)}
    {ex.ouv.paq && donnee(`Nombre de paquets de ${ex.paquet}`, nbf(nPaq, nPaq < 10 ? 2 : 1), COL.orange)}
  </>);
  const objScene = <SceneComptage id={o.id} nom={o.nom} pluriel={o.pluriel} mUne={mUneTxt} mTas={mTasTxt} nombreVisible={Math.round(8 + 28 * Math.min(1, ex.mObj / 500))}/>;

  // --- objet 2 : des atomes ou des molécules ---
  const eE = M.entite(ex.ent), ch = M.chaine(eE, ex.mEnt), ion = eE.type === 'ion';
  const MM1 = M.masseUneMole(eE);
  const entReglages = (<>
    {etiquette('Entité à compter', <select value={ex.ent} onChange={x => setE({ ent: x.target.value })} style={sel}>
      {['atome', 'molécule', 'ion'].map(t => <optgroup key={t} label={t === 'atome' ? 'Atomes' : t === 'molécule' ? 'Molécules' : 'Ions'}>{M.ENTITES.filter(e => e.type === t).map(e => <option key={e.id} value={e.id}>{e.nom.replace(/^(atome|molécule|ion) (d’|de |du )?/, '')} {M.formuleTexte(e)}</option>)}</optgroup>)}</select>)}
    <Curseur nom="Masse de l’échantillon" valeur={ex.mEnt} onChange={v => setE({ mEnt: v })} min={0.1} max={200} pas={0.1} unite="g" decimales={1} couleur="#b45309"/>
    {aide('Choisissez l’entité, puis réglez la masse de l’échantillon : la simulation calcule le nombre d’entités N et la quantité de matière n.')}
    <Section titre={`Calcul de la masse d’une entité : ${sci(ch.mEnt, 3)} kg`} ouvert={!!ex.ouv.mm} onBascule={() => ouvrir('mm')}>
      <TableauMasse e={eE} cacher={false}/>
      {ion && aide('Un ion a la même masse que l’atome dont il vient : la masse d’un électron est négligée.')}
    </Section>
    <Section titre="Un pas vers la Première : la masse d’une mole" ouvert={!!ex.ouv.mole} onBascule={() => ouvrir('mole')}>
      {aide('Facultatif. Une mole de ces entités pèse : (masse d’une entité) × 6,02 × 10²³. En Première, cette masse aura un nom et une notation.')}
      <LigneMesure nom={`Masse d’une mole de ${M.formuleTexte(eE)}`} valeur={`${nbf(MM1, 1)}${NB}g`} couleur={COL.orange}/>
      <button onClick={() => setE({ mEnt: Math.min(200, Math.round(MM1 * 100) / 100) })} style={{ ...stylePetitBouton(false, '#475569'), marginTop: 6 }}>Peser exactement 1 mol</button>
    </Section>
  </>);
  const entMesures = (<>
    {donnee('Masse d’une entité', `${sci(ch.mEnt, 3)}${NB}kg`)}
    {donnee('Masse de l’échantillon', `${sci(ch.mKg, 3)}${NB}kg`)}
    {donnee('Nombre d’entités N', sci(ch.N, 3), COL.violet)}
    {donnee('Quantité de matière n = N ÷ N_A', `${nb(ch.n, 3)}${NB}mol`, COL.vert)}
  </>);
  const entScene = <SceneChaine m={`${sci(ch.mKg, 3)} kg`.replace(/\s/g, ' ')} N={sci(ch.N, 3)} n={`${nb(ch.n, 3)} mol`} mEnt={`${sci(ch.mEnt, 3)} kg`} entiteNom={eE.type === 'molécule' ? 'molécule' : eE.type === 'ion' ? 'ion' : 'atome'}/>;

  const parObjet = ex.objet === 'quotidien'
    ? [objReglages, objScene, objMesures, 'Des objets comptés avec une balance']
    : [entReglages, entScene, entMesures, 'Des atomes ou des molécules : de la masse à la quantité de matière'];
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Objets : doublez la masse du tas. Que devient le nombre d’objets ? Comparez ensuite les lentilles et les coquillettes pour une même masse : lequel en contient le plus ? Pourquoi ?</li>
      <li>Atomes : comparez 10 g d’aluminium et 10 g de cuivre. Lequel contient le plus d’atomes ? Quel atome est le plus lourd ?</li>
      <li>Molécules : choisissez l’eau, puis le glucose. À masse égale, laquelle contient le plus de molécules ?</li>
      <li>Ouvrez « Un pas vers la Première », cliquez sur « Peser exactement 1 mol » pour trois entités : que vaut n ? Et le nombre d’entités ?</li>
      <li>Choisissez l’ion sodium Na⁺ : sa masse est celle de l’atome de sodium (3,82 × 10⁻²⁶ kg). Pourquoi peut-on négliger la masse des électrons ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir sansFiche>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>objets identiques : N = m ÷ masse d’un objet (même unité pour les deux masses)</li>
        <li>1 mol = 6,02 × 10²³ entités ; N<sub>A</sub> = 6,02 × 10²³ mol⁻¹</li>
        <li>de n à N : N = n × N<sub>A</sub> ; de N à n : n = N ÷ N<sub>A</sub></li>
        <li>masse d’une entité = somme des masses de ses atomes (en kg)</li>
        <li>échantillon : m (en kg) → N = m ÷ masse d’une entité → n = N ÷ N<sub>A</sub></li>
      </ul>
    </ARetenir>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .qm2-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .qm2-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .qm2-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (max-width: 900px) { .qm2-hypo-defi { order: 2; } }
        @media (min-width: 901px) { .qm2-l1.cote .qm2-carte { order: 2; } .qm2-l1.cote .qm2-main { order: 1; }
          .qm2-ex { grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr); }
          .qm2-ex > .qm2-ex-scene { grid-column: 1; grid-row: 1; } .qm2-ex > .qm2-ex-reglages { grid-column: 2; grid-row: 1 / span 2; } .qm2-ex > .qm2-ex-mesures { grid-column: 1; grid-row: 2; } }
        @media (max-width: 900px) { .qm2-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .qm2-in { animation: qm2-fondu 0.35s ease-out; } @keyframes qm2-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Quantité de matière : compter les entités et la mole</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Les atomes et les molécules sont beaucoup trop petits pour être comptés un par un. On les compte avec une <strong>balance</strong> et on les regroupe en <strong>paquets</strong> géants appelés <strong>moles</strong>.</div>
      {enExplore ? <>
        <div style={{ ...styleBoite, marginBottom: 12 }}>
          {etiquette('Que voulez-vous compter ?', <select value={ex.objet} onChange={x => setE({ objet: x.target.value })} style={sel}>
            <option value="quotidien">Des objets du quotidien (pâtes, lentilles, billes…)</option><option value="entites">Des atomes ou des molécules</option></select>)}
        </div>
        <div className="qm2-ex">
          <div className="qm2-ex-scene">{boite(parObjet[3], parObjet[1])}</div>
          <div className="qm2-ex-reglages">{boite('Réglages', parObjet[0])}</div>
          <div className="qm2-ex-mesures">{boite('Mesures et calculs', parObjet[2])}</div>
        </div>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`qm2-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="qm2-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="qm2-carte qm2-hypo-defi">{panneauHypo}</div> : null}
          <div className="qm2-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defiBalance ? suiviB : suiviE}/></div>}
            {enDefi && defi && <div className="qm2-in" key={defi.type}>{boite(defiBalance ? 'Le tas sur la balance' : 'De la masse à la quantité de matière',
              defiBalance ? <SceneComptage id={defi.o.id} nom={defi.o.nom} pluriel={defi.o.pluriel} mUne={`${masseUneDefi} g`} mTas={`${nb(defi.valeur, 3)} ${defi.enKg ? 'kg' : 'g'}`} nombreVisible={30}/>
                : <SceneChaine m={`${nbf(defi.m, defi.m < 1 ? 2 : 1)} g`} N={null} n={null} mEnt={`${sci(defi.mEnt, 3)} kg`} entiteNom={defi.e.type === 'molécule' ? 'molécule' : 'atome'}/>)}</div>}
            {enGuide && <div className="qm2-in" key={idE}>{sceneGuide}</div>}
          </div>
        </div>
        {enGuide && idE === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
