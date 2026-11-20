import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, avecIndices, lireNombre, ARetenir, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./rdaModele";
import { QCM_PARCOURS as Q } from "./rdaQcm";
import { Diagramme, LegendeDiagramme, EqMath, MN, SvgSymbole, SvgNucleons, SvgIsotopesCarte, SvgConservationCarte, SvgTroisCarte, SvgPositionCarte, SvgChaineCarte } from "./rdaSchemas";

const SIM_ID = 184, CLE_GUIDE = 'equations-desintegration-tg-guide-v1';
declarerDefis(SIM_ID, [['type', 'Identifier le type de radioactivité et la particule émise'], ['trou', 'Compléter une équation de désintégration']]);

// ====================================================
//  SIM 184 — RADIOACTIVITÉ : DIAGRAMME (N, Z) ET ÉQUATIONS DE DÉSINTÉGRATION (TG spé PC, « Modéliser l’évolution temporelle d’un système, siège d’une
//  transformation nucléaire », stabilité et instabilité des noyaux).
//  Capacités visées (jamais affichées à l’élève) : déterminer, à partir d’un diagramme (N, Z), les isotopes radioactifs d’un élément ; utiliser des données et les lois de
//  conservation pour écrire l’équation d’une réaction nucléaire et identifier le type de radioactivité (α, β⁻, β⁺).
//  La loi de décroissance (demi-vie, activité, datation) est dans la simulation 123 : non reprise ici.
//  Modèle : rdaModele.js (test : rdaModele.test.mjs) ; schémas : rdaSchemas.jsx ; QCM : rdaQcm.js.
// ====================================================

const UL = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const MIN = x => String(x).replace('-', '−');
// noyau A/Z X au fil du texte
const Nx = ({ A, Z, s, signe }) => <math style={{ fontSize: '1.05em', whiteSpace: 'nowrap' }}><MN A={A} Z={Z} s={s} signe={signe}/></math>;
const EqF = props => <Formule><EqMath {...props}/></Formule>;
const sup = x => String(x).replace(/[0-9]/g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]);
const nomNoyau = n => `${M.nomEl(n[0])} ${M.A(n)}`;
const SYM_ANTI = <math style={{ fontSize: '1.05em' }}><mover accent="true"><mi>ν</mi><mo>¯</mo></mover></math>;
const NU_ = <math style={{ fontSize: '1.05em' }}><mi>ν</mi></math>;

// exemples du parcours (valeurs vérifiées par rdaModele.test.mjs)
const RA = { A: 226, Z: 88, s: 'Ra' }, RN = { A: 222, Z: 86, s: 'Rn' };
const C14 = { A: 14, Z: 6, s: 'C' }, N14 = { A: 14, Z: 7, s: 'N' };
const F18 = { A: 18, Z: 9, s: 'F' }, O18 = { A: 18, Z: 8, s: 'O' };
const NA22 = { A: 22, Z: 11, s: 'Na' }, NE22 = { A: 22, Z: 10, s: 'Ne' };
const U238N = M.trouve(92, 146), PB206N = M.trouve(82, 124), NA24N = M.trouve(11, 13);

const IDS = ['symbole', 'isotopes', 'diagramme', 'radios', 'conservation', 'alpha', 'beta-', 'beta+', 'position', 'perefils', 'chaine-a', 'chaine-b', 'bilan'];

// scène du diagramme des noyaux lourds, avec seulement le départ et l'arrivée de la chaîne
const masqueChaine = n => !(n[0] === 92 && n[1] === 146) && !(n[0] === 82 && n[1] === 124);
const etiqChaine = [{ Z: 92, N: 146, t: '²³⁸U (départ)', a: 'end', dx: -10, dy: 5.5 }, { abs: true, x: 54, y: 34, t: 'arrivée : ²⁰⁶Pb (carré)' }];

const IndiceSur = ({ t, cache, children }) => cache ? null : <div style={{ marginTop: 4 }}><div style={{ fontSize: 12.5, fontWeight: 600, color: KIT.txt2 }}>{t}</div><IndiceDefi>{children}</IndiceDefi></div>;

// ====================================================
export function SimulationEquationsDesintegration() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviT, noterT] = useCompteurDefi(), [suiviH, noterH] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('type');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ aff: false, essayer: false, retenir: false });
  const [ex, setEx] = useState({ region: 'legers', Z: 6, N: 8, desint: false, types: false, ligne: false });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const etape = guide.etape, idEtape = IDS[Math.min(etape, IDS.length - 1)];

  // ---------- exploration ----------
  const R = M.REGIONS[ex.region];
  const nSel = M.trouve(ex.Z, ex.N) || R.noyaux[0];
  const elements = [...new Set(R.noyaux.map(n => n[0]))].sort((a, b) => a - b);
  const isoEl = M.isotopesDe(R.noyaux, nSel[0]);
  const filsSel = M.estRadio(nSel) ? M.filsDe(nSel) : null;
  const choisirRegion = r => { const n = r === 'legers' ? M.trouve(6, 8) : M.trouve(92, 146); setEx(s => ({ ...s, region: r, Z: n[0], N: n[1], desint: false })); };
  const choisirElement = Z => { const n = M.isotopesDe(R.noyaux, Z); const pref = n.find(m => m[2] !== 's') || n[0]; setEx(s => ({ ...s, Z, N: pref[1], desint: false })); };
  const choisirNoyau = N => setEx(s => ({ ...s, N, desint: false }));
  const statutTxt = n => (n[2] === 's' ? 'stable' : `radioactif ${M.PARTICULES[n[2]].court}`);

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'symbole', titre: 'Le noyau et son symbole',
      texte: <>Un noyau est formé de <strong>nucléons</strong> : des protons et des neutrons. On le désigne par le symbole <Nx A="A" Z="Z" s="X"/>, où X est le symbole de l’élément, <strong>A</strong> le nombre de nucléons et <strong>Z</strong> le nombre de protons. Le schéma montre le noyau de carbone 14 (symbole C), noté <Nx A={14} Z={6} s="C"/>.</>,
      tache: { type: 'num', carnet: false, q: 'Combien de neutrons N le noyau de carbone 14 contient-il ?', unite: 'neutrons', vrai: 8, tol: 0, affiche: v => String(v),
        pieges: [[14, 'Vous avez donné A : c’est le nombre total de nucléons (protons et neutrons). Il faut retrancher les protons.'], [6, 'Vous avez donné Z, le nombre de protons.'], [20, 'Vous avez additionné A et Z : les neutrons sont les nucléons qui ne sont pas des protons, N = A − Z.']],
        expl: 'A = Z + N, donc N = A − Z = 14 − 6 = 8 neutrons.',
        indice: 'Les nucléons sont des protons ou des neutrons : A = Z + N. Isolez N.' } },
    { id: 'isotopes', titre: 'Les isotopes d’un élément',
      texte: <>Des <strong>isotopes</strong> sont des noyaux d’un même élément : ils ont le même nombre de protons Z, mais des nombres de neutrons N différents. Le schéma montre le noyau de carbone 12 : 6 protons et 6 neutrons (Z = 6).</>,
      tache: { type: 'qcm', q: 'Lequel de ces noyaux est un isotope du carbone 12 ?', ...Q.isotopes,
        expl: 'Un isotope du carbone garde Z = 6 (6 protons) ; seul N change : 6 protons et 8 neutrons donnent le carbone 14. Les autres noyaux ont un autre nombre de protons, donc ce sont d’autres éléments (azote, bore) : avoir aussi 12 nucléons, comme le carbone 12, ne suffit pas.',
        indice: 'Même élément signifie même nombre de protons Z. Cherchez le noyau qui a 6 protons.' } },
    { id: 'diagramme', titre: 'Le diagramme (N, Z)',
      texte: <>Pour ranger les noyaux, on les place dans un <strong>diagramme (N, Z)</strong> : le nombre de neutrons N en abscisse, le nombre de protons Z en ordonnée. Chaque case est un noyau. Les carrés pleins sont les noyaux stables (liste complète pour Z de 1 à 18). Le carbone 12 est entouré. Ce diagramme est schématique.</>,
      tache: { type: 'qcm', q: 'Dans ce diagramme, les isotopes d’un même élément sont alignés sur…', ...Q.diagramme,
        expl: 'Les isotopes ont le même Z et des N différents : ils sont sur une même ligne horizontale. Une colonne verticale regroupe des noyaux de même N (éléments différents) ; une diagonale descendante, des noyaux de même A = Z + N ; la diagonale ascendante est celle où N = Z.',
        indice: 'Un élément a un Z fixé. Quel axe garde la même valeur sur les cases d’un même élément ?' } },
    { id: 'radios', titre: 'Noyaux stables et radioactifs',
      texte: <>Tous les noyaux ne sont pas stables. Un noyau <strong>radioactif</strong> (cercle creux) se transforme spontanément en un autre noyau : on dit qu’il se <strong>désintègre</strong>. Le diagramme montre une sélection de noyaux radioactifs réels (elle n’est pas complète). La rangée du carbone (Z = 6) est entourée. La loi de décroissance (demi-vie, activité) est l’objet de la simulation « Radioactivité : loi de décroissance, demi-vie et activité ».</>,
      tache: { type: 'num', carnet: false, q: 'Combien d’isotopes radioactifs du carbone sont représentés ?', unite: 'noyaux', vrai: 4, tol: 0, affiche: v => String(v),
        pieges: [[2, 'Vous avez compté les isotopes stables (carrés pleins) : on demande les isotopes radioactifs (cercles creux).'], [6, 'Vous avez compté tous les isotopes de la rangée : il faut ne garder que les cercles creux.']],
        expl: 'Dans la rangée Z = 6 : 2 carrés pleins (carbone 12 et carbone 13, stables) et 4 cercles creux (carbone 10, 11, 14 et 15, radioactifs).',
        indice: 'Restez sur la rangée entourée et ne comptez que les cercles creux.' } },
    { id: 'conservation', titre: 'Les lois de conservation',
      retenirTitre: 'Isotopes et diagramme (N, Z)', retenir: <>
        <SvgIsotopesCarte/>
        <ul style={UL}>
          <li><strong>Isotopes</strong> : même Z, N différent ; dans le diagramme (N, Z), ils sont sur une <strong>ligne horizontale</strong>.</li>
          <li>Noyau : <Nx A="A" Z="Z" s="X"/> avec <strong>A = Z + N</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« isotopes : même Z, même ligne »</strong>. Idée fausse : « un noyau radioactif est un autre élément ». Vrai : le carbone 14 est du carbone (Z = 6).</li>
        </ul></>,
      texte: <>Un noyau radioactif, le <strong>noyau père</strong> X, se transforme en un <strong>noyau fils</strong> Y en émettant une <strong>particule</strong> P. On l’écrit comme une équation. Pour chaque noyau ou particule, A (en haut) est le nombre de nucléons ; Z (en bas) est la charge en nombre de charges élémentaires (Z = 2 pour 2 protons, Z = −1 pour un électron).
        <Formule><MN A="A" Z="Z" s="X"/><mo>→</mo><MN A="A′" Z="Z′" s="Y"/><mo>+</mo><MN A="A″" Z="Z″" s="P"/></Formule></>,
      tache: { type: 'qcm', q: 'Quelles grandeurs se conservent au cours d’une désintégration ?', ...Q.conservation,
        expl: 'Comme dans toute réaction nucléaire, le nombre de nucléons A et la charge électrique (donc la somme des Z) se conservent. Ni N ni Z ne se conservent séparément : dans la radioactivité β, un neutron devient un proton. Et une désintégration peut produire plusieurs particules (un noyau fils et la particule émise).',
        indice: 'Que garde-t-on toujours quand on compte les nucléons ? Et la charge électrique ?' } },
    { id: 'alpha', titre: 'La radioactivité α',
      retenirTitre: 'Deux conservations', retenir: <>
        <SvgConservationCarte/>
        <ul style={UL}>
          <li>Somme des <strong>A</strong> à gauche = somme des <strong>A</strong> à droite ; même chose pour <strong>Z</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« le haut égale le haut, le bas égale le bas »</strong> (A avec A, Z avec Z).</li>
          <li>Idée fausse : « il y a conservation de N ». Vrai : A et Z se conservent, pas N.</li>
        </ul></>,
      texte: <>Dans la radioactivité <strong>α</strong>, le noyau père émet une particule α : un noyau d’hélium <Nx A={4} Z={2} s="He"/> (A = 4, Z = 2). Exemple : le radium 226 (A = 226, Z = 88) est radioactif α.
        <EqF pere={RA} fils={RN} mode="a" trou="fils" nu={false}/></>,
      tache: { type: 'qcm', q: 'Quels sont A et Z du noyau fils Y ?', ...Q.alpha,
        expl: 'Conservation de A : 226 = A + 4, donc A = 222. Conservation de Z : 88 = Z + 2, donc Z = 86 : c’est le radon. A et Z diminuent tous les deux ; garder Z = 88 oublie le noyau d’hélium emporté, ajouter 4 et 2 donnerait un noyau plus lourd que le père, et A ne reste pas égal à 226 car 4 nucléons sont partis.',
        indice: 'Écrivez 226 = A + 4 pour les nucléons, puis 88 = Z + 2 pour la charge.' } },
    { id: 'beta-', titre: 'La radioactivité β⁻',
      texte: <>Dans la radioactivité <strong>β⁻</strong>, un neutron du noyau se transforme en proton en émettant un électron <Nx A={0} Z={-1} s="e"/> (A = 0, Z = −1) et un antineutrino {SYM_ANTI} (A = 0, Z = 0 : il ne change aucun calcul sur A et Z). Exemple : le carbone 14 (A = 14, Z = 6).
        <EqF pere={C14} fils={N14} mode="b-" trou="fils"/></>,
      tache: { type: 'num', carnet: false, q: 'Quelle est la valeur de Z du noyau fils Y ?', unite: '', vrai: 7, tol: 0, affiche: v => String(v),
        pieges: [[5, 'Vous avez retranché 1 : la charge de l’électron est −1, donc 6 = Z + (−1), d’où Z = 7.'], [6, 'Z change : un neutron est devenu un proton, le noyau fils a un proton de plus.'], [14, 'Vous avez donné A, qui reste égal à 14 : on demande Z.']],
        expl: 'Charge : 6 = Z + (−1) + 0, donc Z = 7. Nucléons : 14 = A + 0 + 0, donc A = 14 (inchangé). Le noyau fils est l’azote 14 : un neutron est devenu un proton.',
        indice: 'Conservation de la charge : Z du père = Z du fils + Z de l’électron + Z de l’antineutrino, avec Z = −1 pour l’électron.' } },
    { id: 'beta+', titre: 'La radioactivité β⁺',
      texte: <>Dans la radioactivité <strong>β⁺</strong>, un proton du noyau se transforme en neutron en émettant un positon <Nx A={0} Z={1} s="e" signe/> (A = 0, Z = +1 : l’antiparticule de l’électron) et un neutrino {NU_} (A = 0, Z = 0). Exemple : le fluor 18 (A = 18, Z = 9).
        <EqF pere={F18} fils={O18} mode="b+" trou="fils"/></>,
      tache: { type: 'num', carnet: false, q: 'Combien de neutrons N le noyau fils Y contient-il ?', unite: 'neutrons', vrai: 10, tol: 0, affiche: v => String(v),
        pieges: [[9, 'Vous avez gardé le Z du noyau père pour calculer N : Z change dans la désintégration, et N = A − Z se calcule avec le Z du noyau fils.'], [8, 'C’est le Z du noyau fils : on demande son nombre de neutrons, N = A − Z.'], [18, 'C’est A, le nombre total de nucléons : on demande les neutrons seulement.']],
        expl: 'Nucléons : 18 = A + 0, donc A = 18. Charge : 9 = Z + (+1), donc Z = 8. Le noyau fils (oxygène 18) a N = A − Z = 18 − 8 = 10 neutrons : un proton est devenu un neutron.',
        indice: 'Trouvez d’abord A et Z du noyau fils avec les deux conservations (Z du positon : +1), puis N = A − Z.' } },
    { id: 'position', titre: 'Se déplacer dans le diagramme',
      retenirTitre: 'Trois désintégrations', retenir: <>
        <SvgTroisCarte/>
        <ul style={UL}>
          <li><strong>α</strong> : A − 4, Z − 2 ; <strong>β⁻</strong> : A inchangé, Z + 1 (n → p) ; <strong>β⁺</strong> : A inchangé, Z − 1 (p → n).</li>
          <li>Moyen de s’en souvenir : <strong>« β⁻ : un neutron de moins, un proton de plus »</strong>. Idée fausse : « β⁻ émet un proton ». Vrai : il émet un électron.</li>
        </ul></>,
      texte: <>Une désintégration déplace le noyau dans le diagramme, vers un noyau plus stable. Le sodium 24 (N = 13, Z = 11) est entouré : on ne sait pas encore quel est son type de radioactivité. Regardez les noyaux stables (carrés pleins) autour de lui.</>,
      tache: { type: 'qcm', q: 'Quelle désintégration déplace le sodium 24 vers un noyau stable ?', ...Q.position,
        expl: 'En β⁻, le noyau passe de (N = 13 ; Z = 11) à (N = 12 ; Z = 12), où se trouve un noyau stable (le magnésium 24). En β⁺ il irait en (14 ; 10) et en α en (11 ; 9) : aucune de ces deux cases ne contient de noyau stable. L’émission γ, elle, ne déplace pas le noyau.',
        indice: 'Regardez les cases voisines du sodium 24 : laquelle contient un carré plein ? Dans quel sens faut-il se déplacer pour l’atteindre ?' } },
    { id: 'perefils', titre: 'Père, fils et type de radioactivité',
      texte: <>On peut aussi identifier le type de radioactivité à partir du noyau père et du noyau fils. Le sodium 22 (A = 22, Z = 11) se désintègre en néon 22 (A = 22, Z = 10) en émettant une particule P, ici inconnue.
        <EqF pere={NA22} fils={NE22} mode="b+" sans="particule" nu={false}/></>,
      tache: { type: 'qcm', q: 'Quelle est la particule émise ?', ...Q.particule,
        expl: 'Nucléons : 22 = 22 + A de P, donc A = 0. Charge : 11 = 10 + Z de P, donc Z = +1 : c’est un positon, radioactivité β⁺ (un proton devient un neutron). Un électron (Z = −1) augmenterait Z du fils ; une particule α changerait A de 4 ; un photon γ (Z = 0) laisserait le noyau fils avec Z = 11.',
        indice: 'Écrivez A et Z de la particule avec les deux conservations : 22 = 22 + A et 11 = 10 + Z.' } },
    { id: 'chaine-a', titre: 'Une chaîne de désintégrations',
      retenirTitre: 'Où est le noyau ? Quel type ?', retenir: <>
        <SvgPositionCarte/>
        <ul style={UL}>
          <li>Noyau <strong>à droite</strong> de la vallée de stabilité (excès de neutrons) : <strong>β⁻</strong>. Noyau <strong>à gauche</strong> (excès de protons) : <strong>β⁺</strong>. Noyau très lourd : souvent <strong>α</strong>.</li>
          <li>Dans le diagramme (N, Z) : α déplace de 2 cases vers la gauche et 2 vers le bas ; β⁻ d’une case vers la gauche et une vers le haut ; β⁺ d’une case vers la droite et une vers le bas.</li>
          <li>Avec le père et le fils : A diminue de 4 et Z de 2 → α ; A égal et Z + 1 → β⁻ ; A égal et Z − 1 → β⁺.</li>
          <li>Moyen de s’en souvenir : <strong>« la désintégration ramène vers la vallée »</strong>. Idée fausse : « un noyau radioactif se désintègre une seule fois ». Vrai : le fils peut lui aussi être radioactif.</li>
        </ul></>,
      texte: <>Le noyau fils d’une désintégration peut lui-même être radioactif : on obtient une <strong>chaîne</strong>. Le noyau d’uranium 238 (A = 238, Z = 92) se transforme par des désintégrations α et β⁻ jusqu’au plomb 206 (A = 206, Z = 82), qui est stable. Rappel : seule une désintégration α modifie A.</>,
      tache: { type: 'num', carnet: false, q: 'Combien de désintégrations α la chaîne comporte-t-elle ?', unite: 'désintégrations', vrai: 8, tol: 0, affiche: v => String(v),
        pieges: [[32, 'C’est la variation de A (238 − 206 = 32) : chaque désintégration α fait perdre 4 nucléons, il faut diviser par 4.'], [10, 'C’est la variation de Z : les α ne sont pas seules à la changer. Utilisez plutôt A, que seules les α modifient.'], [4, 'Vous avez divisé par 8 : une désintégration α retire 4 nucléons, il faut diviser 32 par 4.']],
        expl: 'A passe de 238 à 206 : il diminue de 32. Seules les désintégrations α modifient A, de 4 à chaque fois : 32 ÷ 4 = 8 désintégrations α (les β⁻ ne changent pas A).',
        indice: 'Calculez la perte de nucléons A entre l’uranium 238 et le plomb 206, puis divisez par le nombre de nucléons perdus à chaque α.' } },
    { id: 'chaine-b', titre: 'Compter les désintégrations β⁻',
      texte: <>On sait que la chaîne comporte 8 désintégrations α. Chaque α fait diminuer Z de 2 ; chaque β⁻ fait augmenter Z de 1. Au total, Z passe de 92 (uranium) à 82 (plomb).</>,
      tache: { type: 'num', carnet: false, q: 'Combien de désintégrations β⁻ la chaîne comporte-t-elle ?', unite: 'désintégrations', vrai: 6, tol: 0, affiche: v => String(v),
        pieges: [[10, 'C’est la variation totale de Z (92 − 82). Elle mélange l’effet des α et celui des β⁻ : il faut déduire celui des α.'], [16, 'C’est la baisse de Z due aux 8 α : il reste à compenser par les β⁻ pour arriver à 82.'], [8, 'C’est le nombre de α : on demande les β⁻.']],
        expl: 'Les 8 α font baisser Z de 8 × 2 = 16 : de 92 on arriverait à 76. Pour finir à 82, il faut remonter de 6 : chaque β⁻ ajoute 1, donc 6 désintégrations β⁻.',
        indice: 'Écrivez Z final = 92 − 2 × 8 + (nombre de β⁻) = 82 et isolez le nombre de β⁻.' } },
    { id: 'bilan', titre: 'Bilan',
      retenirTitre: 'Chaîne de l’uranium 238', retenir: <>
        <SvgChaineCarte/>
        <ul style={UL}>
          <li>Seules les <strong>α</strong> changent A (de 4). Nombre de α = <strong>variation de A divisée par 4</strong> ; puis les β⁻ complètent la variation de Z.</li>
          <li>Exemple de la simulation : 238 → 206, soit 32 nucléons perdus, donc 8 α ; Z : 92 − 16 + 6 = 82, donc 6 β⁻.</li>
          <li>Moyen de s’en souvenir : <strong>« A compte les α, puis Z compte les β »</strong>. Idée fausse : « Z suffit pour tout compter ». Vrai : les α et les β⁻ changent tous deux Z.</li>
        </ul></>,
      texte: <>Vous savez lire un diagramme (N, Z), repérer les isotopes radioactifs d’un élément, écrire l’équation d’une désintégration avec les deux conservations (A et Z), identifier le type de radioactivité par le père et le fils ou par la position, et compter les désintégrations d’une chaîne. Passez à l’exploration (désintégrer n’importe quel noyau du diagramme) ou relevez les deux défis. La loi de décroissance (demi-vie, activité) est dans la simulation « Radioactivité : loi de décroissance, demi-vie et activité ».</>, tache: null },
  ];

  // ════════════════ DÉFIS ════════════════
  const vide = { repType: '', repA: '', repZ: '', verifie: false, bonnes: null, essais: 0, solution: false };
  const nouveauDefi = type => setDefi({ type, ...(type === 'type' ? M.tirageDefi() : M.tirageTrou()), ...vide });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const entier = s => { const x = lireNombre(s); return Number.isFinite(x) && Number.isInteger(x) ? x : NaN; };
  const verifier = () => {
    const d = defi;
    let bonnes;
    if (d.type === 'type') {
      const p = M.PARTICULES[d.mode];
      bonnes = { type: d.repType === d.mode, A: entier(d.repA) === p.A, Z: entier(d.repZ) === p.Z };
    } else {
      const cible = d.cache === 'pere' ? d.pere : d.fils;
      bonnes = { A: entier(d.repA) === cible.A, Z: entier(d.repZ) === cible.Z };
    }
    const ok = Object.values(bonnes).every(Boolean);
    setDefi(x => ({ ...x, verifie: true, bonnes, ok, essais: x.essais + 1 }));
    (d.type === 'type' ? noterT : noterH)(ok);
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const lbSel = { display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 };
  const champ = (cle, ok) => ({ width: 80, padding: '5px 8px', borderRadius: 6, fontSize: 14, border: `1.5px solid ${defi && defi.verifie ? (ok ? '#15803d' : '#dc2626') : KIT.bord}` });
  const marque = ok => (defi.verifie ? (ok ? ' ✓' : ' ✗') : '');
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['type', 'Identifier le type et la particule'], ['trou', 'Compléter l’équation']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      {defi.type === 'type' ? <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : type de radioactivité et particule émise</div>
        <div style={lbl}>Le noyau {defi.pere.s} {defi.pere.A} se désintègre en noyau {defi.fils.s} {defi.fils.A}, en émettant une particule P (le neutrino ou l’antineutrino éventuel est omis). Indiquez le type de radioactivité, puis A et Z de la particule P (nombres entiers).</div>
        <EqF pere={defi.pere} fils={defi.fils} mode={defi.mode} sans="particule" nu={false}/>
        <label style={lbSel}>Type de radioactivité{marque(defi.bonnes?.type)}
          <select value={defi.repType} onChange={e => setDefi(d => ({ ...d, repType: e.target.value, verifie: false }))} style={{ ...menu, marginTop: 2 }}>
            <option value="">Choisir…</option>{M.TYPES.map(t => <option key={t} value={t}>{M.NOM_TYPE[t]}</option>)}</select></label>
        <IndiceDefi cache={defi.verifie && defi.bonnes.type}>Comparez A et Z du noyau père et du noyau fils : α fait baisser A de 4 et Z de 2 ; β⁻ garde A et fait monter Z de 1 ; β⁺ garde A et fait baisser Z de 1.</IndiceDefi>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', margin: '8px 0 4px', fontSize: 14 }}>
          <label>A de P{marque(defi.bonnes?.A)} = <input value={defi.repA} aria-label="A de la particule" inputMode="numeric" onKeyDown={e => e.key === 'Enter' && document.getElementById('rda-verif')?.click()} onChange={e => setDefi(d => ({ ...d, repA: e.target.value, verifie: false }))} style={champ('A', defi.bonnes?.A)}/></label>
          <label>Z de P{marque(defi.bonnes?.Z)} = <input value={defi.repZ} aria-label="Z de la particule" inputMode="numeric" onKeyDown={e => e.key === 'Enter' && document.getElementById('rda-verif')?.click()} onChange={e => setDefi(d => ({ ...d, repZ: e.target.value, verifie: false }))} style={champ('Z', defi.bonnes?.Z)}/></label>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <IndiceSur t="Indice sur A" cache={defi.verifie && defi.bonnes.A}>Conservation du nombre de nucléons : A du père = A du fils + A de la particule.</IndiceSur>
          <IndiceSur t="Indice sur Z" cache={defi.verifie && defi.bonnes.Z}>Conservation de la charge : Z du père = Z du fils + Z de la particule (électron : −1 ; positon : +1 ; particule α : +2).</IndiceSur>
        </div>
      </> : <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : compléter l’équation</div>
        <div style={lbl}>Dans cette équation de désintégration, un noyau est caché (« ? » pour A et Z). Donnez A et Z du noyau caché (nombres entiers).</div>
        <EqF pere={defi.pere} fils={defi.fils} mode={defi.mode} trou={defi.cache}/>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', margin: '8px 0 4px', fontSize: 14 }}>
          <label>A du noyau caché{marque(defi.bonnes?.A)} = <input value={defi.repA} aria-label="A du noyau caché" inputMode="numeric" onKeyDown={e => e.key === 'Enter' && document.getElementById('rda-verif')?.click()} onChange={e => setDefi(d => ({ ...d, repA: e.target.value, verifie: false }))} style={champ('A', defi.bonnes?.A)}/></label>
          <label>Z du noyau caché{marque(defi.bonnes?.Z)} = <input value={defi.repZ} aria-label="Z du noyau caché" inputMode="numeric" onKeyDown={e => e.key === 'Enter' && document.getElementById('rda-verif')?.click()} onChange={e => setDefi(d => ({ ...d, repZ: e.target.value, verifie: false }))} style={champ('Z', defi.bonnes?.Z)}/></label>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <IndiceSur t="Indice sur A" cache={defi.verifie && defi.bonnes.A}>Conservation du nombre de nucléons : A du père = A du fils + A de la particule (A d’un électron ou d’un positon : 0 ; A d’une particule α : 4).</IndiceSur>
          <IndiceSur t="Indice sur Z" cache={defi.verifie && defi.bonnes.Z}>Conservation de la charge : Z du père = Z du fils + Z de la particule (électron : −1 ; positon : +1 ; particule α : +2).</IndiceSur>
        </div>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="rda-verif" onClick={verifier} disabled={defi.type === 'type' ? !defi.repType || defi.repA === '' || defi.repZ === '' : defi.repA === '' || defi.repZ === ''} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        {!defi.ok && defi.essais >= 3 && !defi.solution && <button onClick={() => setDefi(d => ({ ...d, solution: true }))} style={styleBouton(false)}>Voir la solution</button>}
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#b91c1c' }}>
        {defi.ok ? '✓ Correct.' : `✗ Pas tout à fait : les réponses marquées ✗ sont à revoir (essai ${defi.essais}).`}</div>}
      {(defi.ok || defi.solution) && defi.verifie !== undefined && (defi.ok || defi.solution) && <div style={{ ...lbl, marginTop: 6 }}>
        <div>Équation complète :</div>
        <EqF pere={defi.pere} fils={defi.fils} mode={defi.mode}/>
        <div style={{ fontSize: 13.5, color: KIT.txt2 }}>{defi.mode === 'a' ? 'A : conservation du nombre de nucléons ; Z : conservation de la charge (particule α : A = 4, Z = 2).' : defi.mode === 'b-' ? 'Radioactivité β⁻ : électron (A = 0, Z = −1) et antineutrino.' : 'Radioactivité β⁺ : positon (A = 0, Z = +1) et neutrino.'}</div></div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Modèle</strong> : un noyau père se transforme en noyau fils en émettant une particule ; on utilise seulement les deux conservations (nombre de nucléons A et charge, donc la somme des Z). L’énergie libérée, le défaut de masse et la masse des noyaux ne sont pas traités.</li>
      <li><strong>Liste de noyaux choisie</strong> : tous les noyaux et modes de désintégration sont réels (table des états fondamentaux de l’AIEA), mais ce n’est pas la table complète. Les noyaux stables sont tous représentés pour Z de 1 à 18 ; les noyaux radioactifs sont une sélection : un noyau absent du diagramme n’est pas forcément stable.</li>
      <li><strong>Diagramme schématique</strong> : une case par noyau, N en abscisse, Z en ordonnée ; la « vallée de stabilité » est une zone approximative, pas une échelle de stabilité exacte.</li>
      <li><strong>Mode principal</strong> : pour un noyau radioactif, on ne garde que le mode de désintégration principal. Quelques noyaux ont plusieurs modes (le chlore 36 est β⁻ à 98 % ; le sodium 22 est β⁺ à 90 %, avec aussi de la capture électronique) ; la capture électronique, la fission spontanée et l’émission de neutrons ne sont pas étudiées.</li>
      <li><strong>Conventions d’écriture</strong> : la particule α est ⁴₂He ; l’électron β⁻ est ⁰₋₁e (Z = −1) ; le positon β⁺ est ⁰₊₁e (Z = +1). Le neutrino ν et l’antineutrino ν̄ (A = 0, Z = 0) accompagnent β⁺ et β⁻ ; ils sont écrits dans les équations complètes de la simulation et dans les corrigés, mais ils ne changent aucun calcul sur A et Z : les réponses demandées portent sur A et Z.</li>
      <li><strong>Symboles des éléments</strong> : fournis par la simulation (aucun tableau périodique à mémoriser). Z est la charge exprimée en nombre de charges élémentaires.</li>
      <li><strong>Noyau fils</strong> : on suppose qu’il est dans son état fondamental ; s’il est excité, il émet un rayonnement γ (le noyau garde le même A et le même Z), non écrit dans les équations. Les états excités de longue durée (isomères) sont ignorés.</li>
      <li><strong>Hasard</strong> : l’instant de la désintégration d’un noyau est imprévisible ; la loi de décroissance, la demi-vie et l’activité sont dans la simulation « Radioactivité : loi de décroissance, demi-vie et activité » et ne sont pas reprises ici.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const sceneGuide = () => {
    switch (idEtape) {
      case 'symbole': return <SvgSymbole/>;
      case 'isotopes': return <SvgNucleons/>;
      case 'diagramme': return <><Diagramme region="legers" radios="aucun" sel={[6, 6]} etiquettes={[{ Z: 6, N: 6, t: '¹²C', dx: -14, dy: -12, a: 'end' }]} aria="Diagramme (N, Z) des noyaux stables de Z égal 1 à 18. Le noyau de carbone 12 est entouré."/><LegendeDiagramme radios="aucun"/></>;
      case 'radios': return <><Diagramme region="legers" radios="un" ligneZ={6} aria="Diagramme (N, Z) des noyaux de Z égal 1 à 18 : carrés pleins pour les noyaux stables, cercles creux pour les noyaux radioactifs représentés. La rangée du carbone (Z égal 6) est entourée."/><LegendeDiagramme radios="un"/></>;
      case 'conservation': return <div style={{ fontSize: 14, color: KIT.txt2, lineHeight: 1.5 }}>Dans l’équation : <strong>X</strong> = noyau père, <strong>Y</strong> = noyau fils, <strong>P</strong> = particule émise.</div>;
      case 'position': return <><Diagramme region="legers" radios="un" sel={[11, 13]} etiquettes={[{ Z: 11, N: 13, t: '²⁴Na', dx: 12, dy: 5.5 }]} aria="Diagramme (N, Z) des noyaux de Z égal 1 à 18 : carrés pleins pour les noyaux stables, cercles creux pour les noyaux radioactifs. Le noyau de sodium 24 (N égal 13, Z égal 11) est entouré."/><LegendeDiagramme radios="un"/></>;
      case 'chaine-a': case 'chaine-b': return <><Diagramme region="lourds" radios="un" masquer={masqueChaine} etiquettes={etiqChaine} aria="Diagramme (N, Z) des noyaux lourds : le noyau de départ, l'uranium 238 (N égal 146, Z égal 92), et le noyau d'arrivée, le plomb 206 (N égal 124, Z égal 82), stable."/><LegendeDiagramme radios="un"/></>;
      case 'bilan': {
        const ch = M.chaine(U238N);
        return <><Diagramme region="lourds" radios="types" fleches={ch.slice(0, -1).map((n, k) => ({ de: [n[0], n[1]], vers: [ch[k + 1][0], ch[k + 1][1]], mode: n[2] }))} etiquettes={etiqChaine.map(e => ({ ...e, t: e.t.replace(/ \(.*\)/, '') }))} aria="Chaîne complète de l'uranium 238 au plomb 206 dans le diagramme (N, Z) : 8 désintégrations alpha (triangles) et 6 désintégrations bêta moins (disques)."/><LegendeDiagramme radios="types"/></>;
      }
      default: return null;
    }
  };
  // exploration : scène + équation
  const fn = filsSel;
  const flechesEx = ex.desint && fn ? [{ de: [nSel[0], nSel[1]], vers: fn, mode: nSel[2], cadre: true }] : [];
  const etiqEx = [];
  const pereAZ = M.noyauAZ(nSel), filsAZ = fn ? { A: fn[0] + fn[1], Z: fn[0], s: M.sym(fn[0]) } : null;
  const bil = fn ? M.bilan(pereAZ, filsAZ, nSel[2]) : null;
  const boxScene = (() => {
    if (enGuide) { const s = sceneGuide(); return s ? <div style={styleBoite}>{s}</div> : null; }
    if (enDefi && defi) return null;
    return (<div style={styleBoite}>
      <div style={aide}>Chaque case est un noyau (N en abscisse, Z en ordonnée). Le noyau choisi est entouré ; cliquez sur une case pour le choisir.</div>
      <Diagramme region={ex.region} radios={ex.types ? 'types' : 'un'} ligneZ={ex.ligne ? nSel[0] : null} sel={[nSel[0], nSel[1]]} fleches={flechesEx} etiquettes={etiqEx}
        onPick={n => setEx(s => ({ ...s, Z: n[0], N: n[1], desint: false }))}
        aria={`Diagramme (N, Z), région des ${R.nom}. Noyau choisi : ${M.nomEl(nSel[0])} ${M.A(nSel)}, ${statutTxt(nSel)}.${ex.desint && fn ? ` Une flèche mène au noyau fils : ${M.nomEl(fn[0])} ${fn[0] + fn[1]}.` : ''}`}/>
      <LegendeDiagramme radios={ex.types ? 'types' : 'un'}/>
      {ex.desint && fn && <div style={{ fontSize: 14, color: KIT.txt2, lineHeight: 1.5 }}>Cadre orange plein : noyau père ({sup(M.A(nSel))}{M.sym(nSel[0])}). Cadre en tirets : noyau fils ({sup(fn[0] + fn[1])}{M.sym(fn[0])}).</div>}
    </div>);
  })();
  const panneauDes = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>{nomNoyau(nSel)} : {statutTxt(nSel)}</div>
      <div style={aide}>Z = {nSel[0]} protons, N = {nSel[1]} neutrons, A = {M.A(nSel)} nucléons.{M.estRadio(nSel) ? '' : ' Ce noyau est stable : il ne se désintègre pas.'}</div>
      {M.estRadio(nSel) && !ex.desint && <button onClick={() => setEx(s => ({ ...s, desint: true }))} style={styleBouton(true, '#c2410c')}>Désintégrer ce noyau</button>}
      {ex.desint && fn && <div>
        <EqF pere={pereAZ} fils={filsAZ} mode={nSel[2]}/>
        <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
          <div>Nucléons : {bil.A.gauche} = {filsAZ.A} + {M.PARTICULES[nSel[2]].A}{NB}{M.conserve(bil) ? '✓' : '✗'}</div>
          <div>Charge : {bil.Z.gauche} = {filsAZ.Z} + ({MIN(M.PARTICULES[nSel[2]].Z)}){NB}{M.conserve(bil) ? '✓' : '✗'}</div>
          <div style={{ marginTop: 4 }}>{M.NOM_TYPE[nSel[2]][0].toUpperCase() + M.NOM_TYPE[nSel[2]].slice(1)} : le noyau passe {/^[aeiouyhéèâîô]/i.test(M.nomEl(nSel[0])) ? 'd’' : 'de '}{M.nomEl(nSel[0])} {M.A(nSel)} à {M.nomEl(fn[0])} {fn[0] + fn[1]}.{nSel[2] === 'b-' ? ' Un neutron devient un proton.' : nSel[2] === 'b+' ? ' Un proton devient un neutron.' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {M.trouve(fn[0], fn[1]) && <button onClick={() => setEx(s => ({ ...s, Z: fn[0], N: fn[1], desint: false }))} style={styleBouton(true, '#334155')}>{M.estRadio(M.trouve(fn[0], fn[1])) ? 'Continuer avec le noyau fils' : 'Voir le noyau fils (stable)'}</button>}
          <button onClick={() => setEx(s => ({ ...s, desint: false }))} style={styleBouton(false)}><Pic n="refresh"/>Revenir au noyau père</button>
        </div></div>}
    </div>);
  const reglages = enExplore && (
    <div style={styleBoite} className="rda-ctrl">
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Choisissez une région du diagramme, un élément, puis un de ses isotopes ; vous pouvez aussi cliquer sur une case du diagramme.</div>
      <label style={lbSel}>Région du diagramme (cadre affiché)
        <select value={ex.region} onChange={e => choisirRegion(e.target.value)} style={{ ...menu, marginTop: 2 }}>{Object.values(M.REGIONS).map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}</select></label>
      <label style={lbSel}>Élément (nombre de protons Z)
        <select value={nSel[0]} onChange={e => choisirElement(+e.target.value)} style={{ ...menu, marginTop: 2 }}>{elements.map(Z => <option key={Z} value={Z}>{`${M.nomEl(Z)} (Z = ${Z})`}</option>)}</select></label>
      <label style={lbSel}>Isotope (nombre de neutrons N)
        <select value={nSel[1]} onChange={e => choisirNoyau(+e.target.value)} style={{ ...menu, marginTop: 2 }}>{isoEl.map(n => <option key={n[1]} value={n[1]}>{`${M.nomEl(n[0])} ${M.A(n)} (N = ${n[1]}) : ${statutTxt(n)}`}</option>)}</select></label>
      <Section titre={`Affichage : ${ex.types ? 'types par la forme' : 'radioactifs en cercles'}${ex.ligne ? ' · isotopes entourés' : ''}`} ouvert={ouv.aff} onBascule={() => setOuv(o => ({ ...o, aff: !o.aff }))}>
        <label style={{ ...lbSel, display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={ex.types} onChange={e => setEx(s => ({ ...s, types: e.target.checked }))}/>Distinguer les types de radioactivité par la forme (disque β⁻, losange β⁺, triangle α)</label>
        <label style={{ ...lbSel, display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={ex.ligne} onChange={e => setEx(s => ({ ...s, ligne: e.target.checked }))}/>Entourer la rangée des isotopes de l’élément choisi</label>
      </Section>
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Choisissez l’oxygène : quels isotopes sont stables ? Quels types de radioactivité ont les autres ?</li>
        <li>Regardez la position des noyaux β⁻ et celle des noyaux β⁺ par rapport aux noyaux stables d’une même rangée : que remarquez-vous ?</li>
        <li>Désintégrez le carbone 14, puis « Continuer avec le noyau fils » : dans quel sens la flèche va-t-elle ? Le noyau obtenu est-il stable ?</li>
        <li>Passez aux noyaux lourds et suivez la chaîne de l’uranium 238 jusqu’au plomb 206 : comptez les flèches α puis β⁻.</li>
        <li>Dans l’équation affichée, vérifiez à la main que la somme des A et la somme des Z sont les mêmes à gauche et à droite.</li>
      </ul>
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Noyau <Nx A="A" Z="Z" s="X"/> : A = Z + N ; isotopes : même Z, N différent (ligne horizontale du diagramme (N, Z))</li>
          <li>Équation d’une désintégration : conservation de A et conservation de Z (charge)</li>
          <li>α : A − 4 et Z − 2 ; β⁻ : Z + 1 (un neutron devient un proton) ; β⁺ : Z − 1 (un proton devient un neutron)</li>
          <li>Excès de neutrons : β⁻ ; excès de protons : β⁺ ; noyaux lourds : souvent α</li>
          <li>Chaîne : nombre de α = variation de A divisée par 4 ; les β⁻ complètent la variation de Z</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .rda-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .rda-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .rda-col { display: flex; flex-direction: column; gap: 12px; }
        .rda-df { display: block; margin-bottom: 12px; } .rda-df > * { margin-bottom: 12px; }
        @media (min-width: 901px) { .rda-df { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .rda-df > * { margin-bottom: 0; }
          .rda-df-volet { grid-column: 1; grid-row: 1; } .rda-df-hypo { grid-column: 2; grid-row: 1; } }
        .rda-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .rda-l1.cote .rda-carte { order: 2; } .rda-l1.cote .rda-main { order: 1; }
          .rda-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .rda-ex > * { grid-column: 1; } .rda-ex > .rda-ctrl { grid-column: 2; grid-row: 1 / span 5; } }
        @media (max-width: 900px) { .rda-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .rda-in { animation: rda-fondu 0.35s ease-out; } @keyframes rda-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Radioactivité : diagramme (N, Z) et équations de désintégration</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>{avecIndices('Un noyau instable se désintègre en émettant une particule : on lit sa place dans le diagramme (N, Z) et on écrit l’équation avec la conservation de A et de Z.')}</div>
      {enGuide && <div className="rda-l1 cote">
        <div className="rda-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div>
        <div className="rda-main">
          <div className="rda-col">
            {boxScene && <div className="rda-in" key={'s-' + idEtape}>{boxScene}</div>}
          </div>
        </div>
      </div>}
      {enDefi && defi && <div className="rda-df">
        <div className="rda-df-volet"><div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'type' ? suiviT : suiviH}/></div></div>
        <div className="rda-df-hypo">{panneauHypo}</div>
      </div>}
      {enExplore && <div className="rda-ex">
        <div>{boxScene}</div>
        <div className="rda-ctrl">{reglages}</div>
        <div>{panneauDes}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && idEtape === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
