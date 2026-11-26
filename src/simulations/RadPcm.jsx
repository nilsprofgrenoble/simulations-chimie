import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./radPcmModele";
import { QCM } from "./radPcmQcm";
import { RadPcmExplore, NoyauGuide, PopGuide, EulerGuide, CourbeGuide, ProtGuide } from "./RadPcmExplore";
import { SceneNoyau, GrapheDecroissance, GrapheLn, SceneCompteur, SceneSources, SvgTypesCarte, SvgConservationCarte, SvgLoiCarte, SvgActiviteCarte, SvgProtectionCarte } from "./RadPcmSchemas";

const SIM_ID = 309, CLE_GUIDE = 'rad-pcm-guide-v1', CLE_P2 = 'rad-pcm-guide-p2', CLE_CHOIX = 'rad-pcm-parcours';
declarerDefis(SIM_ID, [['equation', 'Identifier le type de radioactivité ou compléter une équation'], ['comptage', 'Exploiter des mesures de comptage : demi-vie et durée']]);

// ====================================================
//  SIM 309 — RADIOACTIVITÉ : DÉSINTÉGRATIONS, LOI DE DÉCROISSANCE ET ACTIVITÉ (TSTL, enseignement PCM, séquence 6).
//  Deux parcours courts. 1) Types de radioactivité (α, β⁻, β⁺, γ) et lois de conservation. 2) Hasard, dN = −λ N dt, loi de décroissance et analogie avec l'ordre 1,
//  demi-vie, activité et comptage, modélisation (ln A), comparaison de sources, protection, applications.
//  Capacités visées (jamais affichées) : définir α, β⁻, β⁺, γ ; écrire une équation nucléaire ; interpréter dN = −λ N dt ; établir la loi et l'analogie avec l'ordre 1 ;
//  exploiter une courbe ; définir t½ et relier λ à t½ ; définir l'activité et le becquerel ; citer des applications ; comparer des sources et choisir des protections ;
//  exploiter un comptage, tracer et modéliser une décroissance (capacités numériques).
//  Situations originales (noyaux fictifs R, S, T et noyaux réels hors documents du cours) : aucune situation du Moodle n'est reprise.
//  Modèle : radPcmModele.js (réutilise rdaModele.js et radioactiviteModele.js, TG, sans les modifier). Schémas : RadPcmSchemas.jsx. Exploration : RadPcmExplore.jsx.
// ====================================================
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
const sci = (x, cs = 2) => M.fmtSci(x, cs);
const PG = M.PG;
const nCo = M.nucl('Co', 60), nNa = M.nucl('Na', 22), nAm = M.nucl('Am', 241), nTh = M.nucl('Th', 232), nCl = M.nucl('Cl', 36);
const NOMS_PARC = ['1. Types de radioactivité', '2. Loi de décroissance et activité'];
const IDS1 = ['noyau', 'alpha', 'betam', 'betap', 'gamma', 'conservation', 'type', 'ecrire', 'bilan1'];
const IDS2 = ['hasard', 'dN', 'euler', 'solution', 'demi', 'lambda', 'activite', 'comptage', 'ln', 'sources', 'protection', 'applications', 'bilan2'];
const NOM_DEFI = { a: 'radioactivité α', 'b-': 'radioactivité β⁻', 'b+': 'radioactivité β⁺' };

export function SimulationRadPcm() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const VIDE = { etape: 0, reps: {}, verifs: {}, reussies: {} };
  const [g1, setG1] = useEtatPersistant(CLE_GUIDE, VIDE), [g2, setG2] = useEtatPersistant(CLE_P2, VIDE);
  const [parcBrut, setParc] = useEtatPersistant(CLE_CHOIX, 1);
  const parc = parcBrut === 2 ? 2 : 1;
  const guide = parc === 1 ? g1 : g2, setGuide = parc === 1 ? setG1 : setG2;
  const IDS = parc === 1 ? IDS1 : IDS2;
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('equation');
  const [ouv, setOuv] = useState({});
  const [ex, setEx] = useState({ vue: 'noyau', noyau: 'Co60', n: 100, th: 6, graine: 4242, dtRel: 0, rayon: 'b', ecran: 'aucun', dist: 1, duree: 1 });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const fr = x => String(x).replace('.', ',');
  const etape = guide.etape;
  const idEtape = IDS[Math.min(etape, IDS.length - 1)];
  const deja = id => etape >= IDS.indexOf(id);

  // ════════════════ PARCOURS 1 : TYPES DE RADIOACTIVITÉ ════════════════
  const ETAPES1 = [
    { id: 'noyau', titre: 'Le noyau et son symbole', focus: ['scene'],
      texte: <>Un noyau est formé de <strong>nucléons</strong> : des <strong>protons</strong> (en rouge, de charge positive) et des <strong>neutrons</strong> (en gris, sans charge). Il se note <strong>ᴬ<sub>Z</sub>X</strong> : <strong>A</strong> est le nombre de nucléons, <strong>Z</strong> le nombre de protons, donc N = A − Z neutrons. Certains noyaux sont instables : ils se transforment spontanément en émettant un rayonnement. C’est la <strong>radioactivité</strong>. Voici le noyau de cobalt 60, ⁶⁰₂₇Co.</>,
      tache: { type: 'qcm', q: 'Le noyau ⁶⁰₂₇Co contient :', ...QCM.noyau,
        expl: 'Z = 27 protons ; le nombre de neutrons est N = A − Z = 60 − 27 = 33.', indice: 'A est le nombre total de nucléons : neutrons = A − Z.' } },
    { id: 'alpha', titre: 'La radioactivité α', focus: ['scene'],
      texte: <>Dans la <strong>radioactivité α</strong>, un noyau lourd émet une <strong>particule α</strong>. Lance la désintégration de l’américium 241 : regarde ce qui part du noyau, et ce qui reste.</>,
      tache: { type: 'qcm', q: 'Dans la radioactivité α, la particule émise est :', ...QCM.alpha,
        expl: 'La particule α est un noyau d’hélium ⁴₂He (2 protons et 2 neutrons) : le noyau perd 4 nucléons et 2 charges.', indice: 'Regarde le petit amas rouge et gris qui s’éloigne : combien de protons et de neutrons ?' } },
    { id: 'betam', titre: 'La radioactivité β⁻', focus: ['scene'],
      texte: <>Dans la <strong>radioactivité β⁻</strong>, un neutron du noyau se transforme en proton et émet un <strong>électron</strong> ⁰₋₁e (avec un antineutrino). Lance la désintégration du cobalt 60.</>,
      tache: { type: 'qcm', q: 'Dans une désintégration β⁻, pour le noyau :', ...QCM.betam,
        expl: 'Un neutron devient un proton : Z augmente de 1, et le nombre de nucléons A reste le même.', indice: 'Un neutron est remplacé par un proton : le nombre de nucléons ne change pas.' } },
    { id: 'betap', titre: 'La radioactivité β⁺', focus: ['scene'],
      texte: <>Dans la <strong>radioactivité β⁺</strong>, c’est l’inverse : un proton du noyau se transforme en neutron et émet un <strong>positon</strong> ⁰₊₁e, particule de même masse que l’électron mais de charge opposée (avec un neutrino). Lance la désintégration du sodium 22.</>,
      tache: { type: 'qcm', q: 'Dans une désintégration β⁺, la particule émise et la variation de Z sont :', ...QCM.betap,
        expl: 'Un proton devient un neutron : la particule émise est un positon et Z diminue de 1 ; A ne change pas.', indice: 'Un proton disparaît : que devient Z ?' } },
    { id: 'gamma', titre: 'L’émission γ', focus: ['scene'],
      texte: <>Après une désintégration, le noyau fils est souvent <strong>excité</strong> : il possède trop d’énergie. Il se désexcite en émettant un <strong>photon γ</strong>, un rayonnement électromagnétique très énergétique. Ici, le nickel 60 excité (noté Ni*, contour orange) émet un photon.</>,
      tache: { type: 'qcm', q: 'Lors de l’émission γ d’un noyau :', ...QCM.gamma,
        expl: 'Un photon n’a ni masse ni charge : le noyau garde le même nombre de nucléons et le même nombre de protons, il perd seulement de l’énergie.', indice: 'Le noyau d’avant et celui d’après sont dessinés avec les mêmes nucléons.' } },
    { id: 'conservation', titre: 'Les lois de conservation', focus: ['scene'],
      texte: <>Lors d’une désintégration, deux grandeurs <strong>se conservent</strong> : le <strong>nombre de nucléons A</strong> et la <strong>charge</strong>, qui s’écrit avec Z (Z = −1 pour l’électron, +1 pour le positon, 2 pour la particule α). On écrit : <strong>Σ A à gauche = Σ A à droite</strong> et <strong>Σ Z à gauche = Σ Z à droite</strong>. Le thorium 232, ²³²₉₀Th, est émetteur α.</>,
      tache: { type: 'num', q: 'Nombre de nucléons A du noyau fils', unite: '', vrai: 228, tol: 0, affiche: v => String(v), cs: 3,
        pieges: [[236, 'La particule α emporte 4 nucléons : A du fils = A du père − 4.'], [232, 'Le noyau fils a perdu les 4 nucléons de la particule α.']],
        calcul: () => ['A du père = A du fils + A de la particule α : 232 = A + 4.', 'Le noyau fils a donc A = 228 nucléons (Z = 90 − 2 = 88 : c’est du radium).'], expl: '232 = A + 4 donc A = 228.', indice: 'Σ A à gauche = Σ A à droite, la particule α a A = 4.' } },
    { id: 'type', titre: 'Reconnaître le type', focus: ['scene'],
      texte: <>On peut retrouver le type de radioactivité à partir des noyaux. Le chlore 36, ³⁶₁₇Cl, se transforme en argon 36, ³⁶₁₈Ar, en émettant une particule : <strong>A est inchangé</strong> et <strong>Z augmente de 1</strong>.</>,
      tache: { type: 'qcm', q: 'Cette transformation est :', ...QCM.type,
        expl: 'A ne change pas et Z augmente de 1 : un neutron devient un proton, avec émission d’un électron. C’est une radioactivité β⁻.', indice: 'Pour α, A baisse de 4 ; en β, A ne change pas : le signe de la variation de Z départage β⁻ et β⁺.' } },
    { id: 'ecrire', titre: 'Écrire l’équation complète', focus: ['scene'],
      texte: <>Le sodium 22 (Z = 11) est un émetteur <strong>β⁺</strong>. Son noyau fils est du néon (Z = 10). On écrit l’équation en vérifiant les deux sommes (le neutrino, sans nucléon ni charge, n’est pas écrit).</>,
      tache: { type: 'qcm', q: 'L’équation de la désintégration du sodium 22 est :', ...QCM.ecrire,
        expl: 'β⁺ : le positon ⁰₊₁e est émis. Nucléons : 22 = 22 + 0. Charge : 11 = 10 + 1.', indice: 'Vérifie Σ A puis Σ Z : le positon a A = 0 et Z = +1.' } },
    { id: 'bilan1', titre: 'Le bilan', focus: [],
      retenirTitre: 'À retenir : α, β⁻, β⁺, γ et conservation',
      retenir: <>
        <SvgTypesCarte/><SvgConservationCarte/>
        <ul style={puces}>
          <li><strong>α</strong> : émission d’un noyau d’hélium ⁴₂He (A − 4, Z − 2) ; <strong>β⁻</strong> : électron (Z + 1) ; <strong>β⁺</strong> : positon (Z − 1) ; <strong>γ</strong> : photon, noyau inchangé.</li>
          <li>Équation nucléaire : <strong>Σ A</strong> et <strong>Σ Z</strong> sont les mêmes de chaque côté de la flèche.</li>
          <li>Moyen de s’en souvenir : <strong>« en β, A ne bouge pas ; en α, A perd 4 »</strong>. Idée fausse : « l’électron de la radioactivité β⁻ vient du cortège électronique. » Vrai : il est créé quand un neutron du noyau devient un proton.</li></ul></>,
      texte: <>Tu sais définir les radioactivités α, β⁻, β⁺ et l’émission γ, et écrire une équation de désintégration avec les lois de conservation. La suite : comment évolue un échantillon contenant un grand nombre de noyaux radioactifs ?</> },
  ];

  // ════════════════ PARCOURS 2 : LOI DE DÉCROISSANCE ET ACTIVITÉ ════════════════
  const ETAPES2 = [
    { id: 'hasard', titre: 'Un hasard régulier', focus: ['scene'],
      texte: <>Un échantillon radioactif contient un très grand nombre de noyaux identiques. Chaque noyau se désintègre <strong>au hasard</strong>, à un instant <strong>imprévisible</strong>, indépendamment des autres. Lance l’animation avec 10 noyaux, puis avec 1 000 : la durée écoulée est de 10 h, la demi-vie du noyau fictif X.</>,
      tache: { type: 'qcm', q: 'Que peut-on prévoir ?', ...QCM.hasard,
        expl: 'On ne peut pas prévoir l’instant de désintégration d’un noyau, mais pour un très grand nombre de noyaux la proportion restante est très régulière.', indice: 'Compare ce qui se passe avec 10 noyaux et avec 1 000 : lequel donne un résultat à peu près toujours le même ?' } },
    { id: 'dN', titre: 'Interpréter dN = −λ N dt', focus: ['scene'],
      texte: <>Pour décrire un grand échantillon, on suit le nombre <strong>N</strong> de noyaux radioactifs présents à l’instant t. Pendant une durée très courte <strong>dt</strong>, chaque noyau a la même probabilité <strong>λ dt</strong> de se désintégrer (λ est la <strong>constante de désintégration</strong>, en s⁻¹ ou en h⁻¹). Le nombre de noyaux qui disparaissent est donc proportionnel à N et à dt : <strong>dN = −λ N dt</strong>. Le signe − traduit la <strong>diminution</strong> de N (dN est une variation négative).</>,
      tache: { type: 'qcm', q: 'Si N double (même noyau, même durée dt), le nombre de noyaux désintégrés pendant dt devient :', ...QCM.dN,
        expl: 'dN = −λ N dt : à λ et dt fixés, dN est proportionnel à N. Deux fois plus de noyaux, deux fois plus de désintégrations.', indice: 'Dans dN = −λ N dt, N est un facteur : que devient le produit quand N double ?' } },
    { id: 'euler', titre: 'Calculer pas à pas', focus: ['scene'],
      texte: <>Sur une durée finie <strong>Δt</strong>, on écrit <strong>ΔN ≈ −λ N Δt</strong> : on calcule N pas à pas. Pour le noyau fictif R, <strong>λ = 0,12 h⁻¹</strong>. Essaie les pas : plus Δt est petit, plus l’escalier orange colle à la courbe bleue ; à la limite Δt → 0, on retrouve dN = −λ N dt. À un instant où il reste N = <strong>8,0 × 10<sup>5</sup></strong> noyaux R, on prend Δt = <strong>0,50 h</strong>.</>,
      tache: { type: 'num', q: 'Nombre de noyaux qui se désintègrent pendant Δt, en noyaux', unite: 'noyaux', vrai: PG.dNEuler, tol: 0.03, affiche: v => sci(v, 2), cs: 2,
        pieges: [[0.12 * 8e5, 'Il manque la durée : ΔN = λ N Δt, avec Δt = 0,50 h.'], [M.LN2 * 8e5 * 0.5, 'λ est donnée (0,12 h⁻¹) : pas besoin de ln 2 ici.']],
        calcul: () => ['|ΔN| = λ N Δt = 0,12 × 8,0 × 10^5 × 0,50.', '|ΔN| = 4,8 × 10^4 noyaux (ΔN = − 4,8 × 10^4).'], expl: '|ΔN| = 0,12 × 8,0 × 10^5 × 0,50 = 4,8 × 10^4 noyaux.', indice: '|ΔN| = λ N Δt, avec λ en h⁻¹ et Δt en h.' } },
    { id: 'solution', titre: 'La loi de décroissance', focus: ['scene'],
      texte: <>Quand Δt tend vers 0, on obtient l’équation différentielle <strong>dN/dt = −λ N</strong>, linéaire du premier ordre à coefficients constants. Sa solution avec N(0) = N₀ est <strong>N(t) = N₀ e<sup>−λt</sup></strong>. C’est la même forme que pour la concentration d’un réactif de vitesse d’ordre 1 : −d[A]/dt = k [A], donc <strong>[A](t) = [A]₀ e<sup>−kt</sup></strong>.</>,
      tache: { type: 'qcm', q: 'Par analogie avec une réaction d’ordre 1, la constante de désintégration λ joue le rôle de :', ...QCM.analogie,
        expl: 'N joue le rôle de [A] et λ celui de k : la décroissance radioactive est un phénomène « d’ordre 1 ».', indice: 'Compare dN/dt = −λ N et d[A]/dt = −k [A] : qui correspond à qui ?' } },
    { id: 'demi', titre: 'Le temps de demi-vie', focus: ['scene'],
      texte: <>Le <strong>temps de demi-vie t½</strong> est la durée au bout de laquelle la <strong>moitié</strong> des noyaux initiaux s’est désintégrée : N(t½) = N₀ ÷ 2. Sur la courbe du noyau fictif R, déplace le curseur d’instant jusqu’au point où la courbe coupe le niveau N₀ ÷ 2 (pointillés orange).</>,
      tache: { type: 'num', q: 'Demi-vie t½ du noyau R lue sur la courbe, en heures', unite: 'h', vrai: M.thDe(PG.lamR), tol: 0.10, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[12, 'Lisez l’instant où N est égal à N₀ ÷ 2, pas la fin de la courbe.']],
        calcul: () => ['La courbe est à N₀ ÷ 2 pour t ≈ 5,8 h.', 'On le vérifiera : t½ = ln 2 ÷ λ = 0,693 ÷ 0,12 ≈ 5,8 h.'], expl: 'La courbe coupe N₀ ÷ 2 pour t ≈ 5,8 h.', indice: 'Cherche l’abscisse du point d’intersection avec la ligne pointillée.' } },
    { id: 'lambda', titre: 'Relier λ et t½', focus: ['scene'],
      texte: <>La condition N(t½) = N₀ ÷ 2 donne N₀ e<sup>−λ t½</sup> = N₀ ÷ 2, soit <strong>λ = ln 2 ÷ t½</strong> (λ et t½ dans des unités de temps inverses). Vérification pour R : ln 2 ÷ 5,8 h ≈ 0,12 h⁻¹. Un autre noyau fictif, <strong>S</strong>, a une demi-vie de <strong>8,0 h</strong>.</>,
      tache: { type: 'num', q: 'Constante de désintégration λ du noyau S, en h⁻¹', unite: 'h⁻¹', vrai: PG.lamS, tol: 0.03, affiche: v => nbf(v, 3), cs: 2,
        pieges: [[8 / M.LN2, 'On divise ln 2 par t½ : λ = ln 2 ÷ t½, pas l’inverse.'], [1 / 8, 'Il faut ln 2 : λ = ln 2 ÷ t½, pas 1 ÷ t½.']],
        calcul: () => ['λ = ln 2 ÷ t½ = 0,693 ÷ 8,0 h.', 'λ ≈ 0,087 h⁻¹.'], expl: 'λ = ln 2 ÷ 8,0 = 0,0866 h⁻¹ ≈ 0,087 h⁻¹.', indice: 'λ = ln 2 ÷ t½ avec ln 2 ≈ 0,693.' } },
    { id: 'activite', titre: 'L’activité', focus: ['scene'],
      retenirTitre: 'À retenir : la loi de décroissance',
      retenir: <>
        <SvgLoiCarte/>
        <ul style={puces}>
          <li><strong>N(t) = N₀ e<sup>−λt</sup></strong> : solution de dN/dt = −λ N, comme [A](t) = [A]₀ e<sup>−kt</sup> en cinétique d’ordre 1.</li>
          <li><strong>t½ = ln 2 ÷ λ</strong> : après chaque demi-vie, il reste la moitié des noyaux (N₀ ÷ 2, N₀ ÷ 4, N₀ ÷ 8…).</li>
          <li>Moyen de s’en souvenir : <strong>« la moitié, puis la moitié de la moitié »</strong>. Idée fausse : « après deux demi-vies, plus rien ne reste. » Vrai : il reste le quart des noyaux.</li></ul></>,
      texte: <>L’<strong>activité</strong> A d’un échantillon est le nombre de désintégrations <strong>par seconde</strong> : <strong>A = −dN/dt = λ N</strong>. Son unité est le <strong>becquerel</strong> : 1 Bq = 1 désintégration par seconde. Pour obtenir des Bq, λ doit être en <strong>s⁻¹</strong>. Un échantillon contient <strong>2,0 × 10<sup>9</sup></strong> noyaux S (t½ = 8,0 h ; λ = 0,087 h⁻¹).</>,
      tache: { type: 'num', q: 'Activité A de l’échantillon, en becquerels (Bq)', unite: 'Bq', vrai: PG.A_S, tol: 0.03, affiche: v => sci(v, 2), cs: 2,
        pieges: [[PG.lamS * 2e9, 'λ est en h⁻¹ : cela donne des désintégrations par heure. Convertissez λ en s⁻¹ (÷ 3 600) pour obtenir des Bq.']],
        calcul: () => ['λ = 0,0866 h⁻¹ ÷ 3 600 = 2,4 × 10^−5 s⁻¹.', 'A = λ N = 2,4 × 10^−5 × 2,0 × 10^9 ≈ 4,8 × 10^4 Bq.'], expl: 'A = λ N = (0,0866 ÷ 3 600) × 2,0 × 10^9 ≈ 4,8 × 10^4 Bq.', indice: 'A = λ N avec λ en s⁻¹ : 1 h = 3 600 s.' } },
    { id: 'comptage', titre: 'Mesurer une activité', focus: ['scene'],
      texte: <>Un <strong>compteur</strong> détecte les désintégrations : on lit le nombre n de désintégrations comptées pendant une durée Δt, et <strong>A ≈ n ÷ Δt</strong>. Les désintégrations étant aléatoires, n fluctue : plus on compte longtemps (n grand), plus la mesure est précise. L’activité suit la même loi que N : <strong>A(t) = A₀ e<sup>−λt</sup></strong>, divisée par 2 à chaque demi-vie. Ici, le compteur a enregistré <strong>1 440 désintégrations en 60 s</strong>.</>,
      tache: { type: 'num', q: 'Activité mesurée, en Bq', unite: 'Bq', vrai: PG.A_compte, tol: 0.02, affiche: v => nbf(v, 0), cs: 2,
        pieges: [[1440, 'Divisez par la durée de comptage : A = n ÷ Δt.'], [1440 * 60, 'On divise le nombre de désintégrations par la durée : A = n ÷ Δt.']],
        calcul: () => ['A = n ÷ Δt = 1 440 ÷ 60.', 'A = 24 Bq.'], expl: 'A = n ÷ Δt = 1 440 ÷ 60 = 24 Bq.', indice: 'A est un nombre de désintégrations par seconde.' } },
    { id: 'ln', titre: 'Modéliser par une droite', focus: ['scene'],
      retenirTitre: 'À retenir : l’activité',
      retenir: <>
        <SvgActiviteCarte/>
        <ul style={puces}>
          <li><strong>A = λ N</strong>, en becquerels (1 Bq = 1 désintégration par seconde) : λ doit être en s⁻¹.</li>
          <li>L’activité décroît comme N : <strong>A(t) = A₀ e<sup>−λt</sup></strong>, divisée par 2 à chaque demi-vie ; un compteur donne A ≈ n ÷ Δt.</li>
          <li>Moyen de s’en souvenir : <strong>« Bq = par seconde »</strong>. Idée fausse : « une activité élevée signifie une demi-vie longue. » Vrai : A = λ N, un noyau de demi-vie courte a un λ grand.</li></ul></>,
      texte: <>Pour <strong>modéliser</strong> des mesures, on trace <strong>ln A</strong> en fonction de t : comme ln A = ln A₀ − λ t, les points s’alignent sur une <strong>droite de pente −λ</strong>. Pour un noyau fictif T, un compteur donne <strong>A = 1 200 Bq</strong> à t = 0 et <strong>A = 730 Bq</strong> à t = <strong>10 h</strong>.</>,
      tache: { type: 'num', q: 'Constante de désintégration λ du noyau T, en h⁻¹', unite: 'h⁻¹', vrai: PG.lamT, tol: 0.04, affiche: v => nbf(v, 3), cs: 2,
        pieges: [[Math.log10(1200 / 730) / 10, 'Utilisez le logarithme népérien ln (touche ln), pas log.'], [(1200 - 730) / 10, 'La pente se calcule avec ln A : λ = ln(A₀ ÷ A) ÷ t.']],
        calcul: () => ['λ = [ln(1 200) − ln(730)] ÷ 10 h = ln(1 200 ÷ 730) ÷ 10.', 'λ ≈ 0,497 ÷ 10 ≈ 0,050 h⁻¹ (t½ = ln 2 ÷ λ ≈ 14 h).'], expl: 'λ = ln(1 200 ÷ 730) ÷ 10 ≈ 0,050 h⁻¹.', indice: 'Pente de la droite : (ln A₁ − ln A₀) ÷ t = −λ.' } },
    { id: 'sources', titre: 'Comparer des sources', focus: ['scene'],
      texte: <>L’activité varie énormément d’une source à l’autre, des objets naturels (banane, eau de mer, roche, corps humain) aux sources artificielles (détecteur de fumée, radiothérapie). On les compare sur une <strong>échelle logarithmique</strong> : chaque graduation vaut 1 000 fois plus que la précédente. Valeurs : ordres de grandeur arrondis. Un détecteur de fumée a une activité de <strong>3 × 10<sup>4</sup> Bq</strong>, une banane de <strong>15 Bq</strong>.</>,
      tache: { type: 'num', q: 'Combien de fois l’activité du détecteur de fumée dépasse-t-elle celle de la banane ?', unite: 'fois', vrai: 3e4 / 15, tol: 0.05, affiche: v => sci(v, 1), cs: 1,
        pieges: [[15 / 3e4, 'Le détecteur est plus actif : divisez la plus grande activité par la plus petite.']],
        calcul: () => ['Rapport = 3 × 10^4 ÷ 15.', 'Rapport = 2 × 10^3 : le détecteur est 2 000 fois plus actif.'], expl: '3 × 10^4 ÷ 15 = 2 × 10^3.', indice: 'Rapport = plus grande activité ÷ plus petite activité.' } },
    { id: 'protection', titre: 'Se protéger', focus: ['scene'],
      texte: <>Pour se protéger des rayonnements, on agit sur trois facteurs : la <strong>distance</strong> (s’éloigner de la source), l’<strong>écran</strong> (adapté au rayonnement) et la <strong>durée</strong> d’exposition. Les rayonnements α, β et γ ne traversent pas la matière de la même façon. Essaie les écrans devant une source qui émet un rayonnement β.</>,
      tache: { type: 'qcm', q: 'Pour arrêter un rayonnement β, un écran suffisant est :', ...QCM.protection,
        expl: 'Les particules β sont arrêtées par quelques millimètres d’aluminium ; une feuille de papier ne suffit pas, il faut plus de matière.', indice: 'Teste les trois écrans : lequel est le plus léger à arrêter tous les rayons ?' } },
    { id: 'applications', titre: 'Des applications', focus: [],
      retenirTitre: 'À retenir : se protéger',
      retenir: <>
        <SvgProtectionCarte/>
        <ul style={puces}>
          <li>Pénétration croissante : <strong>α</strong> (papier) &lt; <strong>β</strong> (aluminium) &lt; <strong>γ</strong> (plomb épais, atténué sans jamais être arrêté).</li>
          <li>Trois leviers : <strong>distance</strong>, <strong>écran</strong>, <strong>durée</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« loin, caché, bref »</strong>. Idée fausse : « un écran quelconque protège de tous les rayonnements. » Vrai : l’écran doit être adapté au rayonnement.</li></ul></>,
      texte: <>La radioactivité a des applications : en <strong>médecine</strong> (imagerie : un noyau émetteur est injecté pour repérer un organe ; radiothérapie : des rayonnements détruisent des cellules tumorales), dans l’<strong>industrie</strong> (contrôle d’épaisseur ou de soudures, stérilisation par rayonnement γ) et pour la <strong>datation</strong> (on compare la quantité restante d’un noyau à sa quantité initiale). La demi-vie doit être adaptée à l’usage.</>,
      tache: { type: 'qcm', q: 'Pour une imagerie médicale (un noyau radioactif est injecté au patient), on choisit un noyau de demi-vie :', ...QCM.applications,
        expl: 'Quelques heures : assez long pour réaliser l’examen, assez court pour que l’activité disparaisse vite et que l’exposition du patient soit limitée.', indice: 'L’activité doit durer le temps de l’examen, sans persister pendant des mois.' } },
    { id: 'bilan2', titre: 'Le bilan', focus: [],
      texte: <>Tu sais interpréter dN = −λ N dt, établir la loi N(t) = N₀ e<sup>−λt</sup> et l’analogie avec l’ordre 1, relier λ à t½, calculer et mesurer une activité en becquerels, modéliser une décroissance, comparer des sources et choisir des protections. Explore avec les animations, ou relève les défis.</> },
  ];
  const ETAPES = parc === 1 ? ETAPES1 : ETAPES2;
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // Scène du parcours : introduite par l'étape qui s'en sert (la clé remet l'animation à zéro à chaque étape)
  const sceneDe = id => {
    switch (id) {
      case 'noyau': return { t: 'Le noyau de cobalt 60', e: <NoyauGuide key={id} n={nCo} anim={false} aria="Noyau de cobalt 60 dessiné nucléon par nucléon : 27 protons en rouge et 33 neutrons en gris."/> };
      case 'alpha': return { t: 'L’américium 241 se désintègre', e: <NoyauGuide key={id} n={nAm} aria="Noyau d’américium 241 qui émet une particule alpha et devient du neptunium 237."/> };
      case 'betam': return { t: 'Le cobalt 60 se désintègre', e: <NoyauGuide key={id} n={nCo} aria="Noyau de cobalt 60 qui émet un électron et devient du nickel 60."/> };
      case 'betap': return { t: 'Le sodium 22 se désintègre', e: <NoyauGuide key={id} n={nNa} aria="Noyau de sodium 22 qui émet un positon et devient du néon 22."/> };
      case 'gamma': return { t: 'Un noyau de nickel 60 excité', e: <NoyauGuide key={id} n={nCo} gamma aria="Noyau de nickel 60 excité qui émet un photon gamma ; son nombre de nucléons et sa charge ne changent pas."/> };
      case 'conservation': return { t: 'Le noyau de thorium 232', e: <NoyauGuide key={id} n={nTh} anim={false} aria="Noyau de thorium 232, avant sa désintégration."/> };
      case 'type': return { t: 'Le noyau de chlore 36', e: <NoyauGuide key={id} n={nCl} anim={false} aria="Noyau de chlore 36, avant sa désintégration."/> };
      case 'ecrire': return { t: 'Le noyau de sodium 22', e: <NoyauGuide key={id} n={nNa} anim={false} aria="Noyau de sodium 22, avant sa désintégration."/> };
      case 'hasard': case 'dN': return { t: 'Des noyaux qui se désintègrent au hasard', e: <PopGuide key={id}/> };
      case 'euler': return { t: 'Le noyau fictif R : calcul pas à pas', e: <EulerGuide key={id}/> };
      case 'solution': return { t: 'Le noyau fictif R : N(t)', e: <CourbeGuide key={id} l={PG.lamR}/> };
      case 'demi': return { t: 'Le noyau fictif R : lire t½', e: <CourbeGuide key={id} l={PG.lamR} niveau curseur/> };
      case 'lambda': return { t: 'Le noyau fictif S', e: <CourbeGuide key={id} l={PG.lamS} niveau marque={PG.thS}/> };
      case 'activite': return { t: 'L’activité de l’échantillon de noyaux S', e: <CourbeGuide key={id} l={PG.lamS} grandeur="A" tMax={24}/> };
      case 'comptage': return { t: 'Un compteur de désintégrations', e: <SceneCompteur n={PG.compte} dureeS={PG.dureeCompte} aria="Compteur affichant 1 440 désintégrations comptées pendant une durée de comptage de 60 secondes."/> };
      case 'ln': return { t: 'ln A en fonction du temps (noyau T)', e: <GrapheLn pts={[{ t: 0, A: PG.T0 }, { t: PG.tT, A: PG.T1 }]} aria="Graphe de ln A en fonction du temps : deux points mesurés à 0 et 10 heures, reliés par une droite décroissante."/> };
      case 'sources': return { t: 'Des activités sur 12 ordres de grandeur', e: <SceneSources aria="Barres en échelle logarithmique de l’activité de six sources : banane, eau de mer, granite, adulte, détecteur de fumée, source de radiothérapie."/> };
      case 'protection': return { t: 'Quel écran pour un rayonnement β ?', e: <ProtGuide key={id}/> };
      default: return null;
    }
  };
  const SC = sceneDe(idEtape);
  const scene = SC && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{SC.t}</div>
      {SC.e}
    </div>);

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'equation'
    ? { ...M.tirageDefiEquation(), type, reps: { type: '', A: '', Z: '' }, verifie: false, corr: false }
    : { ...M.tirageDefiComptage(), type, reps: { th: '', t: '' }, verifie: false, corr: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    const x = defi;
    const ok = x.type === 'equation'
      ? (x.variante === 'type' ? x.reps.type === x.nucl.mode : (lireNombre(x.reps.A) === x.A && lireNombre(x.reps.Z) === x.Z))
      : (proche(lireNombre(x.reps.th), x.th, M.tolDefi.th) && proche(lireNombre(x.reps.t), x.duree, M.tolDefi.duree));
    setDefi(y => ({ ...y, verifie: true, ok })); (x.type === 'equation' ? noterA : noterB)(ok);
  };
  const change = (cle, v) => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: v }, verifie: false, corr: false }));
  const diagnostic = () => {
    const x = defi, msgs = [];
    if (x.type === 'equation') {
      const n = x.nucl;
      if (x.variante === 'type') {
        if (!x.reps.type) return ['Choisissez un type de radioactivité.'];
        msgs.push(`A passe de ${n.A} à ${n.fils.A} (variation ${n.fils.A - n.A}) et Z passe de ${n.Z} à ${n.fils.Z} (variation ${n.fils.Z - n.Z > 0 ? '+' : '−'}${Math.abs(n.fils.Z - n.Z)}). α : A − 4 et Z − 2 ; β⁻ : A inchangé et Z + 1 ; β⁺ : A inchangé et Z − 1.`);
        return msgs;
      }
      const a = lireNombre(x.reps.A), z = lireNombre(x.reps.Z);
      if (!Number.isFinite(a) || !Number.isFinite(z)) return ['Écrivez deux nombres entiers : A et Z du noyau fils.'];
      if (a !== x.A) msgs.push(n.mode === 'a' ? `En radioactivité α, la particule émise ⁴₂He emporte 4 nucléons : A du fils = ${n.A} − 4.` : 'En radioactivité β, la particule émise (électron ou positon) n’a pas de nucléon : A du fils = A du père.');
      if (z !== x.Z) msgs.push(n.mode === 'a' ? `La particule α emporte 2 charges : Z du fils = ${n.Z} − 2.` : n.mode === 'b-' ? `En β⁻, Σ Z : ${n.Z} = Z du fils + (−1), donc Z du fils = ${n.Z} + 1.` : `En β⁺, Σ Z : ${n.Z} = Z du fils + 1, donc Z du fils = ${n.Z} − 1.`);
      return msgs;
    }
    const th = lireNombre(x.reps.th), t = lireNombre(x.reps.t);
    if (!Number.isFinite(th) || !Number.isFinite(t)) return ['Écrivez deux nombres (virgule ou point) : t½ en heures et la durée en heures.'];
    if (!proche(th, x.th, M.tolDefi.th)) msgs.push(`Cherchez l’instant où l’activité est divisée par 2 (environ ${fr(Math.round(x.A0 / 2))} Bq), en interpolant entre deux mesures, ou utilisez λ = ln(A₀ ÷ A) ÷ t avec deux points éloignés puis t½ = ln 2 ÷ λ. Votre valeur est ${th > x.th ? 'trop grande' : 'trop petite'}.`);
    if (!proche(t, x.duree, M.tolDefi.duree)) {
      const lm = M.lambdaDe(th), tm = Math.log(1 / x.seuil) / lm;
      msgs.push(proche(t, tm, 0.06) ? 'Votre durée est cohérente avec VOTRE demi-vie ; corrigez d’abord t½.'
        : `Avec VOTRE t½ = ${fr(th)} h : λ = ln 2 ÷ ${fr(th)} = ${fr(lm.toFixed(3))} h⁻¹ ; il reste ${fr(Math.round(x.seuil * 100))} % quand t = ln(1 ÷ ${fr(x.seuil)}) ÷ λ = ${fr(tm.toFixed(1))} h. Votre valeur est ${t > tm ? 'trop grande' : 'trop petite'}.`);
    }
    return msgs;
  };
  const correction = () => {
    const x = defi;
    if (x.type === 'equation') { const n = x.nucl; return `${M.equation(n)} : ${NOM_DEFI[n.mode]}. Σ A : ${n.A} = ${n.fils.A} + ${M.PART[n.mode].A} ; Σ Z : ${n.Z} = ${n.fils.Z} + ${M.PART[n.mode].Z < 0 ? '(−1)' : M.PART[n.mode].Z}.`; }
    return `t½ = ${fr(x.th)} h (l’activité est divisée par 2 toutes les ${fr(x.th)} h). λ = ln 2 ÷ ${fr(x.th)} = ${fr(x.l.toFixed(3))} h⁻¹ ; l’activité vaut ${fr(Math.round(x.seuil * 100))} % de A₀ quand t = ln(1 ÷ ${fr(x.seuil)}) ÷ λ = ${fr(x.duree.toFixed(1))} h.`;
  };
  const ChampTexte = (cle, nom, unite, id) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{nom}{unite ? ` (${unite})` : ''} =</span>
      <input value={defi.reps[cle]} aria-label={`${nom}${unite ? ` en ${unite}` : ''}`} id={id} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('rpm-verif')?.click()} onChange={e2 => change(cle, e2.target.value)}
        style={{ width: 110, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['equation', 'Type et équation'], ['comptage', 'Comptage et demi-vie']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#b45309')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'equation' ? 'Défi : une désintégration' : 'Défi : mesures de comptage'}</div>
      {defi.type === 'equation'
        ? <>
          {defi.variante === 'type'
            ? <div style={{ ...lbl, marginBottom: 8 }}>Le noyau <strong>{avecIndices(M.noyau(defi.nucl.A, defi.nucl.Z, defi.nucl.s))}</strong> ({defi.nucl.nom} {defi.nucl.A}) se désintègre en <strong>{avecIndices(M.noyau(defi.nucl.fils.A, defi.nucl.fils.Z, defi.nucl.fils.s))}</strong> ({defi.nucl.fils.nom} {defi.nucl.fils.A}) en émettant une particule. Quel est le type de radioactivité ?</div>
            : <div style={{ ...lbl, marginBottom: 8 }}>Le noyau <strong>{avecIndices(M.noyau(defi.nucl.A, defi.nucl.Z, defi.nucl.s))}</strong> ({defi.nucl.nom} {defi.nucl.A}) est un émetteur de <strong>{NOM_DEFI[defi.nucl.mode]}</strong>. Donnez le nombre de nucléons A et le nombre de protons Z de son noyau fils.</div>}
          <div style={{ marginBottom: 8 }}><SceneNoyau n={defi.nucl} maxWidth={360} aria={`Noyau ${defi.nucl.nom} ${defi.nucl.A}, avec ${defi.nucl.Z} protons et ${defi.nucl.N} neutrons, avant sa désintégration.`}/></div>
          {defi.variante === 'type'
            ? <div style={{ marginBottom: 8, fontSize: 14 }}>
              <label htmlFor="rpm-type" style={{ display: 'block', fontWeight: 700, color: KIT.txt2, marginBottom: 3 }}>Type de radioactivité</label>
              <select id="rpm-type" value={defi.reps.type} onChange={e2 => change('type', e2.target.value)} style={{ width: '100%', maxWidth: 360, minHeight: 42, borderRadius: 8, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, padding: '0 10px', fontSize: 15 }}>
                <option value="">— choisir —</option><option value="a">radioactivité α</option><option value="b-">radioactivité β⁻</option><option value="b+">radioactivité β⁺</option></select>
            </div>
            : <>{ChampTexte('A', 'Nombre de nucléons A du fils', '', 'rpm-A')}{ChampTexte('Z', 'Nombre de protons Z du fils', '', 'rpm-Z')}</>}
          <IndiceDefi cache={false}>Lois de conservation : Σ A et Σ Z identiques avant et après. α : ⁴₂He (A − 4, Z − 2) ; β⁻ : ⁰₋₁e (Z + 1) ; β⁺ : ⁰₊₁e (Z − 1).</IndiceDefi>
        </>
        : <>
          <div style={{ ...lbl, marginBottom: 8 }}>Un compteur mesure l’activité A d’un échantillon d’un noyau radioactif, toutes les {defi.pas} h. Déterminez la <strong>demi-vie</strong> t½, puis la durée au bout de laquelle l’activité passe à <strong>{fr(Math.round(defi.seuil * 100))} %</strong> de sa valeur initiale.</div>
          <GrapheDecroissance l={defi.l} tMax={defi.pas * 6} xStep={defi.pas} ymax={1.12} masqueCourbe points={defi.pts.map(p => ({ t: p.t, f: p.A / defi.A0 }))}
            yTicks={[[0, '0'], [0.5, fr(Math.round(defi.A0 / 2))], [1, fr(defi.A0)]]} yLabel="A (Bq)" maxWidth={400} aria={`Points de mesure de l’activité en becquerels en fonction du temps, de ${fr(defi.A0)} becquerels à t égal 0 jusqu’à ${fr(defi.pts[6].A)} becquerels à t égal ${defi.pas * 6} heures.`}/>
          <div style={{ overflowX: 'auto', marginBottom: 8 }}><table style={{ borderCollapse: 'collapse', fontSize: 13.5 }}>
            <tbody><tr><th style={{ padding: '3px 8px', border: `1px solid ${KIT.bord}`, background: '#f1f5f9' }}>t (h)</th>{defi.pts.map(p => <td key={p.t} style={{ padding: '3px 8px', border: `1px solid ${KIT.bord}`, textAlign: 'center' }}>{p.t}</td>)}</tr>
              <tr><th style={{ padding: '3px 8px', border: `1px solid ${KIT.bord}`, background: '#f1f5f9' }}>A (Bq)</th>{defi.pts.map(p => <td key={p.t} style={{ padding: '3px 8px', border: `1px solid ${KIT.bord}`, textAlign: 'center' }}>{fr(p.A)}</td>)}</tr></tbody></table></div>
          {ChampTexte('th', 'Demi-vie t½', 'h', 'rpm-th')}{ChampTexte('t', `Durée pour atteindre ${fr(Math.round(defi.seuil * 100))} % de A₀`, 'h', 'rpm-t')}
          <IndiceDefi cache={false}>t½ : durée pour que A soit divisée par 2 (ou λ = ln(A₀ ÷ A) ÷ t avec deux points, puis t½ = ln 2 ÷ λ). Durée : A = A₀ e^(−λt) donne t = ln(A₀ ÷ A) ÷ λ, avec A ÷ A₀ = {fr(defi.seuil)}.</IndiceDefi>
        </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="rpm-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        {defi.ok ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct.</div> : <>
          <div style={{ fontWeight: 700, color: '#dc2626' }}>✗ Pas tout à fait.</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: KIT.txt }}>{diagnostic().map((m, i) => <li key={i}>{avecIndices(m)}</li>)}</ul>
          {defi.corr ? <div style={{ ...styleBoite, marginTop: 6, color: KIT.txt }}>{avecIndices(correction())}</div>
            : <button onClick={() => setDefi(x => ({ ...x, corr: true }))} style={{ ...stylePetitBouton(false), marginTop: 6 }}>Voir la correction</button>}
        </>}
      </div>}
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Hasard et moyenne</strong> : tous les noyaux d’un même type sont identiques et indépendants ; chacun a la même probabilité λ dt de se désintégrer pendant dt, quel que soit son âge. La loi N(t) = N₀ e<sup>−λt</sup> décrit la <strong>valeur moyenne</strong> : pour peu de noyaux, le nombre réel s’en écarte.</li>
      <li><strong>Calcul pas à pas</strong> : ΔN ≈ −λ N Δt est une approximation qui s’améliore quand Δt diminue ; à la limite Δt → 0, on retrouve dN = −λ N dt. Le calcul exact donne N = N₀ e<sup>−λt</sup>.</li>
      <li><strong>Activité</strong> : A = λ N, en Bq si λ est en s⁻¹ ; le compteur est supposé idéal (il détecte toutes les désintégrations) et A ≈ n ÷ Δt, avec une fluctuation de l’ordre de √n sur n.</li>
      <li><strong>Un seul noyau radioactif</strong> : les noyaux fils sont supposés non radioactifs (pas de filiation) pendant l’étude.</li>
      <li><strong>Équations nucléaires</strong> : α = ⁴₂He, β⁻ = électron ⁰₋₁e, β⁺ = positon ⁰₊₁e ; le (anti)neutrino ⁰₀ν n’est pas nécessaire aux comptes de A et de Z et n’est écrit que dans l’exploration.</li>
      <li><strong>Protection et sources</strong> : les niveaux d’exposition de l’exploration sont qualitatifs ; les activités des sources sont des ordres de grandeur arrondis, et les écrans donnés sont les plus usuels (une épaisseur suffisante est nécessaire).</li>
      <li><strong>Noyaux R, S, T, X</strong> : noyaux fictifs aux valeurs inventées pour les calculs ; les noyaux des équations sont réels.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = parc === 1
    ? <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => setParc(2)} style={styleBouton(true, ORANGE_GUIDE)}>Parcours suivant</button>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
    </span>
    : <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#b45309')}><Pic n="target"/>Défis</button>
    </span>;
  const aEssayer = (
    <ul style={liste}>
      <li>Vue « Un noyau » : choisis un émetteur β⁺, puis un émetteur α. Que deviennent A et Z ? Prévois l’équation avant de lancer.</li>
      <li>Vue « Beaucoup de noyaux » : lance avec 10, puis 1 000 noyaux. Laquelle des deux courbes grises suit le mieux la loi ?</li>
      <li>Choisis un pas Δt plus grand, puis plus petit : que devient l’écart entre l’escalier orange et la courbe ?</li>
      <li>Vue « Se protéger » : pour un rayonnement γ, quel écran est le plus efficace ? Peut-on l’arrêter complètement ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Σ A et Σ Z se conservent ; α : A − 4 et Z − 2 ; β⁻ : Z + 1 ; β⁺ : Z − 1 ; γ : noyau inchangé</li>
        <li>dN = −λ N dt ; N(t) = N₀ e^(−λt) ; t½ = ln 2 ÷ λ</li>
        <li>A = λ N (Bq, avec λ en s⁻¹) ; A(t) = A₀ e^(−λt) ; protection : distance, écran, durée</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .rpm-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .rpm-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .rpm-col { display: flex; flex-direction: column; gap: 12px; }
        .rpm-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .rpm-l1.cote .rpm-carte { order: 2; } .rpm-l1.cote .rpm-main { order: 1; } }
        @media (max-width: 900px) { .rpm-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .rpm-in { animation: rpm-fondu 0.35s ease-out; } @keyframes rpm-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Radioactivité : désintégrations, loi de décroissance et activité</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un noyau instable se <strong>désintègre</strong> en émettant α, β⁻, β⁺ ou γ. Pour un grand nombre de noyaux, le hasard individuel donne une <strong>loi régulière</strong> : <strong>dN = −λ N dt</strong>, avec une <strong>demi-vie</strong> et une <strong>activité</strong> mesurée en becquerels.</div>
      {!enExplore && <div className={`rpm-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="rpm-carte">
          <div role="group" aria-label="Choix du parcours" style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8, fontSize: 13.5 }}>
            <span style={{ color: KIT.txt2 }}>Parcours :</span>
            {NOMS_PARC.map((l, i) => <button key={i} onClick={() => setParc(i + 1)} aria-pressed={parc === i + 1} style={{ ...styleBouton(parc === i + 1, ORANGE_GUIDE), fontSize: 13 }}>{l}</button>)}
          </div>
          <CarteParcours key={parc} etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="rpm-carte">{panneauHypo}</div>}
        <div className="rpm-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'equation' ? suiviA : suiviB}/></div>}
          {enGuide && scene && <div className="rpm-col"><div className="rpm-in" key={idEtape}>{scene}</div></div>}
        </div>
      </div>}
      {enExplore && <>
        <div className="rpm-ex"><RadPcmExplore ex={ex} setEx={setEx}/></div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja(parc === 1 ? 'bilan1' : 'bilan2'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
