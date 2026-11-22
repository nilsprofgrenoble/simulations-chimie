import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useRef, useEffect, useCallback } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi, ExempleResolu, VoirSolution, BoiteSolution } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./signalSonore2gtModele";
import { QCM } from "./signalSonore2gtQcm";
import { FichePeriode, FicheUnites, FicheFrequence, FicheQualites, FicheDomaines, FicheMesure } from "./SignalSonore2gtFiches";
import { Oscillogramme, PileOscillos, SceneDomaines, SceneChaineSon, claquement } from "./SignalSonore2gtScenes";

const SIM_ID = 190;
const CLE_GUIDE = 'signal-sonore-2gt-guide-v1';
declarerDefis(SIM_ID, [['lire', 'Lire la période, puis calculer la fréquence'], ['regler', 'Régler un signal pour obtenir une fréquence donnée']]);

// ====================================================
//  SIM 190 — SIGNAL SONORE : PÉRIODE, FRÉQUENCE, HAUTEUR ET TIMBRE (2GT, thème « Ondes et signaux », partie « Émission et perception d'un son »).
//  Une seule idée : un son est un signal qui se répète ; sa période T se lit sur l'oscillogramme, sa fréquence est f = 1 ÷ T ; la fréquence donne
//  la hauteur (grave, aigu), la forme du motif donne le timbre, l'amplitude donne la force (fort, faible) ; domaines audibles, infrasons, ultrasons.
//  Pas de longueur d'onde, pas de niveau en dB (autres simulations). Enchaînement avec 1G 151 (période, λ = c·T) et TSTL 87 : mêmes symboles T, f.
//  Modèle : signalSonore2gtModele.js (testé). Exploration : générateur de signal, oscillogramme, écoute facultative (Web Audio, volume plafonné).
//  Capacités visées (jamais affichées à l'élève) : définir et déterminer la période et la fréquence d'un signal sonore à partir de sa représentation
//  temporelle ; f = 1/T et conversions ; identifier un signal périodique ; relier fréquence et hauteur, forme et timbre, amplitude et force ;
//  citer les domaines de fréquences ; mesurer une période (chaîne de mesure) ; produire un son avec un microcontrôleur (facultatif).
// ====================================================

const NB = M.NB;
const nbf = M.nbf, nbl = M.nbLisible;
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', violet: '#6d28d9' };

// ---------- formules (MathML) ----------
const FF = <Formule><mi>f</mi><mo>=</mo><mfrac><mn>1</mn><mi>T</mi></mfrac></Formule>;
const FT = <Formule><mi>T</mi><mo>=</mo><mfrac><mrow><mi>Δ</mi><mi>t</mi></mrow><mi>N</mi></mfrac></Formule>;

const aide = (t) => <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{t}</div>;
const boite = (titre, corps, extra = {}) => (
  <div style={{ ...styleBoite, ...extra }}>
    {titre && <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{titre}</div>}
    {corps}
  </div>);

// ---------- écoute (Web Audio) : jamais au chargement ; volume modéré ; arrêt automatique après 20 s ----------
const ARRET_S = 20;
function harmoniquesAudio(id) {
  const N = 40, h = new Float32Array(N + 1);
  if (id === 'triangle') for (let k = 1; k <= N; k += 2) h[k] = (k % 4 === 1 ? 1 : -1) * 8 / (Math.PI * Math.PI * k * k);
  else if (id === 'carre') for (let k = 1; k <= N; k += 2) h[k] = 4 / (Math.PI * k);
  else { const a = M.HARMONIQUES[id] || [1]; a.forEach((v, i) => { h[i + 1] = v; }); }
  return h;
}
function useSon() {
  const ref = useRef(null), minuterie = useRef(null);
  const [joue, setJoue] = useState(false), [erreur, setErreur] = useState('');
  const fermer = g => { try { g.osc.stop(); } catch { /* déjà arrêté */ } try { const p = g.ctx.close(); if (p && p.catch) p.catch(() => {}); } catch { /* rien */ } };
  const arreter = useCallback(() => {
    clearTimeout(minuterie.current);
    const g = ref.current; ref.current = null;
    if (g) { try { const t = g.ctx.currentTime; g.gain.gain.cancelScheduledValues(t); g.gain.gain.setValueAtTime(g.gain.gain.value, t); g.gain.gain.linearRampToValueAtTime(0, t + 0.08); setTimeout(() => fermer(g), 120); } catch { fermer(g); } }
    setJoue(false);
  }, []);
  useEffect(() => () => { clearTimeout(minuterie.current); const g = ref.current; ref.current = null; if (g) fermer(g); }, []);
  const niveau = A => 0.02 + 0.1 * Math.min(1, A / 1.4);               // gain : volume modéré, qui suit l'amplitude
  const appliquer = (g, e, tc) => {
    const t = g.ctx.currentTime;
    g.osc.frequency.setTargetAtTime(e.f, t, tc);
    g.gain.gain.setTargetAtTime(niveau(e.A), t, tc);
    if (g.forme !== e.forme) { g.forme = e.forme; if (e.forme === 'sinus') g.osc.type = 'sine'; else { const h = harmoniquesAudio(e.forme); g.osc.setPeriodicWave(g.ctx.createPeriodicWave(new Float32Array(h.length), h)); } }
  };
  const demarrer = useCallback(e => {
    arreter(); setErreur('');
    try {
      const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AC) { setErreur('Ce navigateur ne sait pas jouer de son.'); return; }
      const ctx = new AC(), osc = ctx.createOscillator(), gain = ctx.createGain();
      gain.gain.value = 0; osc.frequency.value = e.f; osc.connect(gain); gain.connect(ctx.destination);
      const g = { ctx, osc, gain, forme: null }; ref.current = g;
      appliquer(g, e, 0.005); osc.start(); if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      clearTimeout(minuterie.current); minuterie.current = setTimeout(arreter, ARRET_S * 1000); setJoue(true);
    } catch { ref.current = null; setErreur('Le son ne peut pas être joué sur cet appareil.'); setJoue(false); }
  }, [arreter]);   // eslint-disable-line react-hooks/exhaustive-deps
  const maj = useCallback(e => { const g = ref.current; if (!g) return; try { appliquer(g, e, 0.02); } catch { /* rien */ } clearTimeout(minuterie.current); minuterie.current = setTimeout(arreter, ARRET_S * 1000); }, [arreter]);   // eslint-disable-line react-hooks/exhaustive-deps
  return { joue, demarrer, maj, arreter, erreur };
}

// Curseur à valeurs choisies dans une liste (le curseur règle un rang, l'affichage donne la valeur)
function CurseurListe({ nom, valeurs, rang, onChange, texte, couleur = COL.orange }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}><span>{nom}</span><span style={{ color: KIT.txt }}>{texte}</span></div>
      <input type="range" min={0} max={valeurs.length - 1} step={1} value={rang} onChange={x => onChange(parseInt(x.target.value, 10))} aria-label={nom} style={{ width: '100%', accentColor: couleur }}/>
    </div>);
}

// ====================================================
export function SimulationSignalSonore2gt() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviL, noterL, vueL] = useCompteurDefi(), [suiviR, noterR, vueR] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('lire');
  const [ex, setEx] = useState({ forme: 'sinus', iT: M.PERIODES.indexOf(4), A: 0.8, base: 'auto', cache: false, curs: false, c1: 1, c2: 5, ouv: {} });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const setE = f => setEx(s => ({ ...s, ...f }));
  const son = useSon();
  useEffect(() => { if (!enExplore) son.arreter(); }, [enExplore]);   // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- étapes du parcours ----------
  const IDS = ['periodique', 'periode', 'conversion', 'frequence', 'relation', 'hauteur', 'timbre', 'amplitude', 'domaines', 'mesure', 'chaine', 'bilan'];
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => etape > IDS.indexOf(id);
  const fait = id => apres(id) || !!(guide.reussies && guide.reussies[IDS.indexOf(id)]);   // étape passée ou réussie à l'instant

  const ETAPES = [
    { id: 'periodique', titre: 'Un son qui se répète', focus: ['scene'],
      texte: <>Un micro transforme un son en tension électrique. Un oscilloscope (ou une appli de smartphone) trace cette tension en fonction du temps : c’est un <strong>oscillogramme</strong>. Un son devient ainsi un <strong>signal</strong>, une courbe que l’on peut regarder.
        Un signal est <strong>périodique</strong> quand le même dessin, appelé <strong>motif</strong>, revient identique, à intervalles de temps réguliers (comme le motif d’un papier peint qui se répète).
        <ExempleResolu>Une courbe qui fait « bosse, creux, bosse, creux, bosse, creux… » toujours de la même façon est périodique : son motif est « une bosse et un creux ». Une courbe qui s’agite une fois puis s’éteint ne se répète pas : elle n’est pas périodique.</ExempleResolu>
        À vous : voici deux enregistrements de sons.</>,
      tache: { type: 'qcm', ...QCM.periodique } },
    { id: 'periode', titre: 'La période', focus: ['scene'],
      texte: <>Pour un signal périodique, la durée d’un motif s’appelle la <strong>période</strong>, notée <em>T</em>. On la lit entre deux points identiques qui se suivent, par exemple de <strong>sommet à sommet</strong> (un sommet est le point le plus haut d’une bosse). Ici, le temps est gradué en <strong>millisecondes</strong> (ms) : 1{NB}ms est un millième de seconde.
        <ExempleResolu>Sur un autre enregistrement, un sommet est à 3{NB}ms et le sommet suivant à 8{NB}ms. La période est la durée entre les deux : <em>T</em> = 8 − 3 = <strong>5{NB}ms</strong>.</ExempleResolu>
        À vous : lisez la période du son de l’écran.</>,
      tache: { type: 'num', q: 'Quelle est la période T du signal ?', carnet: 'Période T du son (étape 2)', unite: 'ms', vrai: 4, tol: 0.03, affiche: v => nbf(v, 0),
        calcul: () => ['Le premier sommet est à 1 ms et le sommet suivant à 5 ms.', 'T = 5 − 1 = 4 ms.'],
        pieges: [[2, 'Vous avez mesuré du sommet au creux : c’est seulement une demi-période. La période va d’un sommet au sommet suivant.'], [1, 'Vous avez lu la position du premier sommet (1 ms). La période est la durée entre deux sommets.'], [5, 'Vous avez lu la position du deuxième sommet (5 ms). La période est la durée entre les deux sommets : 5 − 1.'], [8, 'Vous avez mesuré deux motifs : la période est la durée d’un seul motif.']],
        expl: 'De sommet à sommet : 5 ms − 1 ms = 4 ms.', indice: 'Repérez deux sommets qui se suivent et lisez leurs positions sur l’axe du temps. La période est la différence entre les deux.' } },
    { id: 'conversion', titre: 'Des millisecondes aux secondes', focus: ['scene'],
      retenirTitre: 'À retenir : un signal périodique et sa période',
      retenir: <FichePeriode/>,
      texte: <>En physique, le temps s’exprime en <strong>secondes</strong> (s). Une milliseconde est mille fois plus petite : <strong>1{NB}ms = 0,001{NB}s</strong>. Pour passer des ms aux s, on <strong>divise par 1 000</strong> (la virgule recule de trois rangs).
        <ExempleResolu>5{NB}ms = 5 ÷ 1 000 = <strong>0,005{NB}s</strong>.</ExempleResolu>
        À vous : le son de l’étape précédente a une période <strong><em>T</em> = 4{NB}ms</strong>.</>,
      tache: { type: 'num', q: 'Écrivez cette période T en secondes.', carnet: 'Période T du son, en secondes', unite: 's', vrai: 0.004, tol: 0.01, affiche: v => nbf(v, 3),
        calcul: () => ['1 ms = 0,001 s : on divise par 1 000.', 'T = 4 ms = 4 ÷ 1 000 = 0,004 s.'],
        pieges: [[4000, 'Vous avez multiplié par 1 000. Une milliseconde est plus petite qu’une seconde : on divise par 1 000.'], [0.4, 'Vous avez reculé la virgule d’un seul rang : il en faut trois (÷ 1 000).'], [0.04, 'Vous avez reculé la virgule de deux rangs : il en faut trois (÷ 1 000).'], [0.0004, 'Vous avez reculé la virgule de quatre rangs : il en faut trois (÷ 1 000).']],
        expl: '4 ms ÷ 1 000 = 0,004 s.', indice: '1 ms = 0,001 s. Divisez 4 par 1 000, ou reculez la virgule de trois rangs : 4 devient 0,004.' } },
    { id: 'frequence', titre: 'La fréquence', focus: ['scene'],
      retenirTitre: 'À retenir : passer des ms aux s',
      retenir: <FicheUnites/>,
      texte: <>Combien de motifs le signal fait-il en <strong>une seconde</strong> ? Ce nombre s’appelle la <strong>fréquence</strong>, notée <em>f</em>. Elle se mesure en <strong>hertz</strong> (Hz) : 1{NB}Hz = 1 motif par seconde. Pour pouvoir compter facilement, l’écran montre ici une vibration très lente (un son si grave qu’on ne l’entendrait pas) pendant exactement 1 seconde.
        <ExempleResolu>Un signal fait 5 motifs en 1{NB}s : sa fréquence est <em>f</em> = <strong>5{NB}Hz</strong>. Un autre en fait 100 en 1{NB}s : <em>f</em> = <strong>100{NB}Hz</strong>.</ExempleResolu>
        À vous : comptez les motifs de l’écran (la durée affichée est de 1{NB}s).</>,
      tache: { type: 'num', q: 'Quelle est la fréquence f du signal ?', carnet: 'Fréquence de la vibration lente', unite: 'Hz', vrai: 8, tol: 0.001, affiche: v => nbf(v, 0),
        calcul: () => ['On compte les motifs complets pendant 1 s : il y en a 8.', 'f = 8 motifs par seconde = 8 Hz.'],
        pieges: [[9, 'Vous avez compté un motif de trop. Comptez les motifs complets (par exemple de sommet à sommet) sur l’écran.'], [7, 'Il manque un motif : recomptez les sommets un par un.'], [0.125, 'Ce nombre est la durée d’un motif en secondes (c’est la période). La fréquence est le nombre de motifs par seconde.']],
        expl: '8 motifs en 1 s : f = 8 Hz.', indice: 'Comptez les sommets (une bosse = un motif) sur toute la largeur de l’écran, qui dure 1 s.' } },
    { id: 'relation', titre: 'Relier la fréquence à la période', focus: ['scene'],
      texte: <>Si un motif dure <em>T</em> secondes, il en tient 1 ÷ <em>T</em> dans une seconde. Donc, avec <em>T</em> en <strong>secondes</strong> :{FF}
        <ExempleResolu>Un motif dure <em>T</em> = 0,005{NB}s. Alors <em>f</em> = 1 ÷ 0,005 = <strong>200{NB}Hz</strong> : 200 motifs de 0,005{NB}s font 200 × 0,005 = 1{NB}s.</ExempleResolu>
        À vous : le son de l’étape 2, dont la période est <strong><em>T</em> = 0,004{NB}s</strong> (étape 3).</>,
      tache: { type: 'num', q: 'Quelle est sa fréquence f ?', carnet: 'Fréquence du son de l’étape 2', unite: 'Hz', vrai: 250, tol: 0.02, affiche: v => nbf(v, 0),
        calcul: () => ['T = 0,004 s (en secondes).', 'f = 1 ÷ T = 1 ÷ 0,004 = 250 Hz.', 'Contrôle : 250 motifs de 0,004 s font 250 × 0,004 = 1 s.'],
        pieges: [[0.25, 'Vous avez calculé 1 ÷ 4 : la période doit être en secondes (0,004 s), pas en millisecondes.'], [0.004, 'Vous avez recopié T. La fréquence est l’inverse de la période : f = 1 ÷ T.'], [4, 'Vous avez gardé le nombre de la période en ms. Calculez 1 ÷ T avec T = 0,004 s.']],
        expl: 'f = 1 ÷ 0,004 = 250 Hz.', indice: 'f = 1 ÷ T avec T en secondes. Combien de fois 0,004 s « rentre » dans 1 s ?' } },
    { id: 'hauteur', titre: 'Grave ou aigu : la hauteur', focus: ['scene'],
      retenirTitre: 'À retenir : la fréquence f = 1 ÷ T',
      retenir: <FicheFrequence/>,
      texte: <>Un son est <strong>grave</strong> ou <strong>aigu</strong> : on parle de sa <strong>hauteur</strong>. Elle dépend de la fréquence : <strong>plus la fréquence est grande, plus le son est aigu</strong>. Sur un oscillogramme, un son aigu répète son motif plus souvent : il a plus de motifs dans la même durée.
        <ExempleResolu>Le « la » d’un diapason a <em>f</em> = 440{NB}Hz. Une note plus grave, par exemple <em>f</em> = 220{NB}Hz, a deux fois moins de motifs par seconde.</ExempleResolu>
        À vous : deux sons enregistrés avec la même échelle de temps.</>,
      tache: { type: 'qcm', ...QCM.hauteur } },
    { id: 'timbre', titre: 'Le timbre', focus: ['scene'],
      texte: <>Un violon et une clarinette peuvent jouer <strong>la même note</strong> : on les reconnaît pourtant très bien. Ce qui les distingue s’appelle le <strong>timbre</strong>. Sur l’oscillogramme, deux sons qui jouent la même note ont la <strong>même période</strong> (donc la même hauteur), mais la <strong>forme du motif</strong> n’est pas la même.
        <ExempleResolu>Un piano et une trompette jouent le « la » : leurs deux oscillogrammes se répètent avec la même période, environ 2,3{NB}ms, mais le dessin d’un motif est différent. Ce sont deux timbres.</ExempleResolu>
        À vous : trois enregistrements A, B et C, avec la même échelle de temps.</>,
      tache: { type: 'qcm', ...QCM.timbre } },
    { id: 'amplitude', titre: 'L’amplitude : fort ou faible', focus: ['scene'],
      texte: <>L’<strong>amplitude</strong> d’un signal est sa hauteur maximale, mesurée à partir de la ligne du milieu (le zéro), en volts (V). Plus l’amplitude est grande, plus le son est <strong>fort</strong> : on dit que son intensité est plus grande. Un petit signal est un son faible.
        <ExempleResolu>En tournant le bouton de volume d’une chaîne hi-fi, on garde la même note : la période ne change pas. Seule l’amplitude change : le son devient plus fort ou plus faible.</ExempleResolu>
        À vous : deux enregistrements A et B, avec la même échelle de temps.</>,
      tache: { type: 'qcm', ...QCM.amplitude } },
    { id: 'domaines', titre: 'Les sons que l’on entend', focus: ['scene'],
      retenirTitre: 'À retenir : hauteur, timbre et force',
      retenir: <FicheQualites/>,
      texte: <>L’oreille humaine entend les sons dont la fréquence est comprise entre environ <strong>20{NB}Hz et 20{NB}kHz</strong>. Le <strong>kilohertz</strong> (kHz) vaut 1 000{NB}Hz : 20{NB}kHz = 20 000{NB}Hz. En dessous de 20{NB}Hz, ce sont des <strong>infrasons</strong>. Au-dessus de 20{NB}kHz, ce sont des <strong>ultrasons</strong>. Nous ne les entendons pas, mais des animaux ou des appareils les utilisent.
        <ExempleResolu>5{NB}Hz est inférieur à 20{NB}Hz : c’est un infrason. 500{NB}Hz est compris entre 20{NB}Hz et 20 000{NB}Hz : c’est un son audible.</ExempleResolu>
        À vous : un animal qui émet un son de 50{NB}kHz.</>,
      tache: { type: 'qcm', ...QCM.domaines } },
    { id: 'mesure', titre: 'Mesurer sur plusieurs motifs', focus: ['scene'],
      retenirTitre: 'À retenir : les domaines de fréquences',
      retenir: <FicheDomaines/>,
      texte: <>Pour mesurer une période avec une chaîne de mesure (un micro, puis un oscilloscope ou une appli), on ne regarde pas un seul motif. On mesure la durée <strong>Δt</strong> de plusieurs motifs, on compte leur nombre <em>N</em>, puis on divise : l’erreur de lecture est partagée entre tous les motifs, le résultat est plus précis.{FT}
        <ExempleResolu>Trois motifs durent 9{NB}ms : <em>T</em> = 9 ÷ 3 = <strong>3{NB}ms</strong>.</ExempleResolu>
        À vous : les deux repères violets encadrent plusieurs motifs, et la durée entre eux est donnée. Comptez les motifs entre les repères (attention : on compte les motifs, pas les sommets).</>,
      tache: { type: 'num', q: 'Quelle est la période T du son ?', carnet: 'Période T du son mesuré (étape 10)', unite: 'ms', vrai: 2.5, tol: 0.02, affiche: v => nbf(v, 1),
        calcul: () => ['Entre les deux repères, la durée est Δt = 12,5 ms.', 'On compte 5 motifs complets entre les repères (6 sommets).', 'T = Δt ÷ N = 12,5 ÷ 5 = 2,5 ms.'],
        pieges: [[2.083, 'Vous avez compté 6 : il y a 6 sommets, mais seulement 5 motifs entre le premier et le dernier. Divisez par 5.'], [62.5, 'Vous avez multiplié : la période est la durée divisée par le nombre de motifs.'], [12.5, 'Ce nombre est la durée de tous les motifs. Il faut la diviser par le nombre de motifs.']],
        expl: 'T = 12,5 ms ÷ 5 motifs = 2,5 ms.', indice: 'Comptez les bosses entre les deux repères (chaque bosse est un motif), puis divisez 12,5 ms par ce nombre.' } },
    { id: 'chaine', titre: 'De l’écran à la fréquence', focus: ['scene'],
      texte: <>Reprenons ce son : sa période est <strong><em>T</em> = 2,5{NB}ms</strong> (étape précédente). Pour trouver sa fréquence, on convertit d’abord <em>T</em> en secondes, puis on calcule <em>f</em> = 1 ÷ <em>T</em>.
        <ExempleResolu><em>T</em> = 8{NB}ms = 0,008{NB}s, donc <em>f</em> = 1 ÷ 0,008 = <strong>125{NB}Hz</strong>.</ExempleResolu>
        À vous : le son de l’étape précédente.</>,
      tache: { type: 'num', q: 'Quelle est sa fréquence f ?', carnet: 'Fréquence du son mesuré (étape 11)', unite: 'Hz', vrai: 400, tol: 0.02, affiche: v => nbf(v, 0),
        calcul: () => ['T = 2,5 ms = 2,5 ÷ 1 000 = 0,0025 s.', 'f = 1 ÷ T = 1 ÷ 0,0025 = 400 Hz.'],
        pieges: [[0.4, 'Vous avez calculé 1 ÷ 2,5 sans convertir T en secondes : T = 0,0025 s.'], [0.0025, 'Vous avez recopié T en secondes : la fréquence est son inverse, f = 1 ÷ T.'], [40, 'Vérifiez la conversion : 2,5 ms = 0,0025 s (trois rangs), pas 0,025 s.']],
        expl: 'f = 1 ÷ 0,0025 = 400 Hz.', indice: 'Convertissez T en secondes (÷ 1 000), puis calculez 1 ÷ T.' } },
    { id: 'bilan', titre: 'Le bilan', focus: [],
      retenirTitre: 'À retenir : de l’écran à la fréquence',
      retenir: <FicheMesure/>,
      texte: <>Vous savez maintenant reconnaître un signal périodique, lire sa période <em>T</em> sur un oscillogramme (de préférence sur plusieurs motifs), convertir les ms en s, calculer sa fréquence <em>f</em> = 1 ÷ <em>T</em>, puis relier la fréquence à la hauteur, la forme au timbre et l’amplitude à la force du son. Testez-vous avec les défis, ou explorez librement avec un vrai générateur de signal.</>,
      tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    setDefi(type === 'lire' ? { type, ...M.tirerDefiLire(defi && defi.type === 'lire' ? defi : null), reps: {}, verifie: false, solution: false }
      : { type, ...M.tirerDefiRegler(defi && defi.type === 'regler' ? defi : null), Tc: M.T_DEPART, reps: {}, verifie: false, solution: false });
  };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'lire') {
      const t = lireNombre(defi.reps.T), f = lireNombre(defi.reps.f);
      const okT = isFinite(t) && proche(t, defi.vrai, 0.05), okF = isFinite(f) && proche(f, defi.f, 0.05), ok = okT && okF;
      setDefi(d => ({ ...d, verifie: true, ok, okT, okF, coherent: isFinite(t) && isFinite(f) && proche(f, 1000 / t, 0.05) })); noterL(ok);
    } else {
      const fo = M.frequenceHz(defi.Tc), ecart = M.ecartRelatif(fo, defi.f), ok = Math.abs(ecart) <= M.toleranceRegler;
      setDefi(d => ({ ...d, verifie: true, ok, ecart })); noterR(ok);
    }
  };
  const champ = (cle, label, unite, largeur = 110) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps[cle] ?? ''} aria-label={`${label} ${unite}`} onKeyDown={e => e.key === 'Enter' && document.getElementById('ss2-verif')?.click()}
        onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, [cle]: e.target.value }, verifie: false }))} inputMode="decimal"
        style={{ width: largeur, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? ((cle === 'T' ? defi.okT : defi.okF) ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const defiLire = defi && defi.type === 'lire';
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['lire', 'Lire T puis calculer f'], ['regler', 'Régler une fréquence']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defiLire ? 'Défi : lire la période, puis calculer la fréquence' : 'Défi : régler un signal pour obtenir une fréquence donnée'}</div>
      {defiLire ? <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>Voici l’oscillogramme d’un son. Lisez sa période <em>T</em> sur l’écran, puis calculez sa fréquence <em>f</em>. Le temps est gradué en millisecondes.</div>
        {champ('T', 'Période T', 'ms')}
        {champ('f', 'Fréquence f', 'Hz')}
        <IndiceDefi cache={false}>La période est la durée d’un motif (entre deux points identiques qui se suivent) : T = nombre de carreaux × durée d’un carreau. Puis f = frac(1|T), avec T en secondes (T en ms ÷ 1 000).</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.6 }}>On veut un son de fréquence <strong><em>f</em> = {M.fTexte(defi.f)}</strong>. Réglez la période <em>T</em> du générateur pour l’obtenir, à 5 % près. L’écran montre le signal que vous réglez.</div>
        <Curseur nom="Période T du signal" valeur={defi.Tc} onChange={v => setDefi(d => ({ ...d, Tc: Number(v.toFixed(2)), verifie: false }))} min={M.T_MIN} max={M.T_MAX} pas={M.T_PAS} unite="ms" decimales={2} couleur="#b45309"/>
        <IndiceDefi cache={false}>La période est l’inverse de la fréquence : T = frac(1|f), avec f en Hz pour avoir T en secondes. Multipliez par 1 000 pour obtenir des ms, l’unité du curseur.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="ss2-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        <VoirSolution visible={!(defi.verifie && defi.ok) && !defi.solution} onClick={() => { (defiLire ? vueL : vueR)(); setDefi(d => ({ ...d, solution: true })); }}/>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defiLire
          ? (defi.ok ? `✓ Correct : T = ${nbl(defi.T)} ms, donc f = 1 ÷ ${nbl(defi.T / 1000)} s = ${M.fTexte(defi.f)} (marge acceptée : ± 5 %).`
            : !defi.okT ? (defi.coherent ? '✗ Votre calcul de f est juste à partir de votre T, mais la lecture de T est à revoir : comptez les carreaux d’un motif (entre deux points identiques qui se suivent).' : '✗ Relisez T : comptez les carreaux d’un motif (entre deux points identiques qui se suivent) et multipliez par la durée d’un carreau.')
              : '✗ La période est juste. Pour f, utilisez f = 1 ÷ T avec T en secondes (T en ms ÷ 1 000).')
          : (defi.ok ? `✓ Réglé : T = ${nbl(defi.Tc)} ms donne f = ${M.fTexte(M.frequenceHz(defi.Tc))}, à moins de 5 % de la cible.`
            : defi.ecart > 0 ? '✗ Votre son est trop aigu : sa fréquence est trop grande. Allongez la période. Calculez T = 1 ÷ f.' : '✗ Votre son est trop grave : sa fréquence est trop petite. Raccourcissez la période. Calculez T = 1 ÷ f.')}
      </div>}
      {defi.solution && <BoiteSolution>{defiLire
        ? <>Un motif (entre deux points identiques qui se suivent) occupe {defi.k} carreaux de {nbl(defi.base)}{NB}ms : T = {defi.k} × {nbl(defi.base)}{NB}ms = <strong>{nbl(defi.T)}{NB}ms</strong>. Puis f = 1 ÷ T = 1 ÷ {nbl(defi.T / 1000)}{NB}s = <strong>{M.fTexte(defi.f)}</strong> (réponses acceptées à ± 5 % près).</>
        : <>T = 1 ÷ f = 1 ÷ {M.fTexte(defi.f)} = {nbl(defi.Tvrai / 1000)}{NB}s = <strong>{nbl(defi.Tvrai)}{NB}ms</strong>. Placez le curseur sur cette valeur (à ± 5 % près sur la fréquence).</>}</BoiteSolution>}
    </div>);
  const sceneDefi = defi && (defiLire
    ? <Oscillogramme forme={defi.forme} T={defi.T} A={defi.A} dec={defi.dec} base={defi.base}
      aria={`Oscillogramme d’un son : tension en fonction du temps, ${nbl(defi.base)} ms par carreau. Le signal est périodique.`}/>
    : <Oscillogramme forme="sinus" T={defi.Tc} A={0.8} base={M.baseAuto(defi.Tc)}
      aria={`Oscillogramme du signal réglé, ${nbl(M.baseAuto(defi.Tc))} ms par carreau.`}/>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Signal supposé parfaitement périodique</strong> : un vrai son (voix, instrument) n’est périodique qu’approximativement : son motif varie un peu et le son finit par s’éteindre. On mesure sur la partie stable du son.</li>
      <li><strong>Plusieurs motifs pour mesurer</strong> : lire la durée de plusieurs motifs, puis diviser par leur nombre, réduit l’incertitude de lecture (quelques dixièmes de carreau, partagés entre tous les motifs). Avec un seul motif, la même erreur pèserait beaucoup plus.</li>
      <li><strong>Échelles choisies</strong> : la base de temps (durée d’un carreau) et la sensibilité verticale sont des réglages de l’écran, lus sur les axes. L’amplitude en volts est schématique (un vrai micro donne quelques millivolts). La forme du signal ne dépend pas de l’échelle.</li>
      <li><strong>Formes « instruments » schématiques</strong> : flûte, clarinette et violon sont des signaux simplifiés, sans attaque ni extinction. Un vrai instrument a un signal plus riche et qui évolue.</li>
      <li><strong>Hauteur, timbre et force</strong> : les liens avec la fréquence, la forme et l’amplitude sont qualitatifs. L’oreille n’est pas aussi sensible à toutes les fréquences : à même amplitude, deux sons de hauteurs différentes ne semblent pas toujours aussi forts.</li>
      <li><strong>Domaines de fréquences</strong> : 20 Hz et 20 kHz sont des valeurs approchées, qui varient d’une personne à l’autre et diminuent avec l’âge (surtout vers les aigus).</li>
      <li><strong>Écoute</strong> : le son joué est un son de synthèse, au volume volontairement modéré. Le haut-parleur d’un appareil ne reproduit correctement que de 100{NB}Hz à 8{NB}kHz environ : hors de cette plage, le bouton est désactivé.</li>
      <li><strong>Chiffres significatifs</strong> : les valeurs de l’écran sont lues au carreau près (2 ou 3 chiffres significatifs). Les réponses sont acceptées avec une petite marge : de 0,1 % à 3 % selon les questions du parcours (plus étroite quand il suffit de calculer, plus large quand on lit l’écran), et ± 5 % dans les défis.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => setE({ ouv: { ...ex.ouv, hypo: !ex.ouv.hypo } })}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ SCÈNES DU PARCOURS GUIDÉ ════════════════
  const donnee = (nom, valeur, c) => <LigneMesure key={nom} nom={nom} valeur={valeur} couleur={c}/>;
  const SC = {
    periodique: [{ nom: 'Enregistrement A', forme: 'flute', T: 2, A: 0.7, base: 1, sansEchelle: true, aria: 'Enregistrement A : oscillogramme d’un son, tension en fonction du temps, sans graduation.' },
      { nom: 'Enregistrement B', fonction: claquement, base: 1, sansEchelle: true, aria: 'Enregistrement B : oscillogramme d’un autre son, tension en fonction du temps, sans graduation.' }],
    hauteur: [{ nom: 'Son A', forme: 'sinus', T: 10, A: 0.8, base: 2 }, { nom: 'Son B', forme: 'sinus', T: 2.5, A: 0.8, base: 2 }],
    timbre: [{ nom: 'A : violon', forme: 'violon', T: 5, A: 0.7, base: 1, dec: 0.6 }, { nom: 'B : clarinette', forme: 'clarinette', T: 5, A: 0.7, base: 1 }, { nom: 'C : flûte', forme: 'flute', T: 2.5, A: 0.7, base: 1 }],
    amplitude: [{ nom: 'Son A', forme: 'sinus', T: 2.5, A: 0.3, base: 1 }, { nom: 'Son B', forme: 'sinus', T: 2.5, A: 0.9, base: 1 }],
  };
  const sceneGuide = (() => {
    switch (idE) {
      case 'periodique': return boite('Deux enregistrements', <PileOscillos signaux={SC.periodique}/>, cadre('scene'));
      case 'periode': return boite('Un son enregistré', <Oscillogramme forme="sinus" T={4} A={1} base={1} fleche={fait('periode') ? { t1: 1, t2: 5, texte: 'T = 4 ms' } : null} motifOrange={fait('periode') ? { t0: 1 } : null}
        aria={fait('periode') ? 'Oscillogramme d’un son : un motif de sommet à sommet dure 4 ms.' : 'Oscillogramme d’un son périodique : le temps est gradué de 0 à 10 ms, 1 ms par carreau.'}/>, cadre('scene'));
      case 'conversion': return boite('Un son enregistré',
        <><Oscillogramme forme="sinus" T={4} A={1} base={1} fleche={{ t1: 1, t2: 5, texte: 'T = 4 ms' }} motifOrange={{ t0: 1 }}/>
          <div style={{ marginTop: 8 }}>{donnee('Période T', `4${NB}ms`)}{fait('conversion') && donnee('Période T en secondes', `0,004${NB}s`, COL.orange)}</div></>, cadre('scene'));
      case 'frequence': return boite('Une vibration lente pendant 1 seconde',
        <Oscillogramme forme="sinus" T={0.125} A={1} base={0.1} uT="s" nom="Durée de l’écran : 1 s" aria="Oscillogramme d’une vibration lente enregistrée pendant 1 seconde, 0,1 s par carreau."/>, cadre('scene'));
      case 'relation': return boite('Le son de l’étape 2',
        <><Oscillogramme forme="sinus" T={4} A={1} base={1} fleche={{ t1: 1, t2: 5, texte: 'T = 4 ms' }} motifOrange={{ t0: 1 }}/>
          <div style={{ marginTop: 8 }}>{donnee('Période T', `0,004${NB}s`)}{donnee('Fréquence f = 1 ÷ T', fait('relation') ? `250${NB}Hz` : '?', fait('relation') ? COL.vert : undefined)}</div></>, cadre('scene'));
      case 'hauteur': return boite('Deux sons, même échelle de temps', <PileOscillos signaux={SC.hauteur}/>, cadre('scene'));
      case 'timbre': return boite('Trois enregistrements, même échelle de temps', <PileOscillos signaux={SC.timbre}/>, cadre('scene'));
      case 'amplitude': return boite('Deux sons, même échelle de temps', <PileOscillos signaux={SC.amplitude}/>, cadre('scene'));
      case 'domaines': return boite('Les trois domaines de fréquences', <SceneDomaines/>, cadre('scene'));
      case 'mesure': return boite('Un son enregistré avec un smartphone',
        <Oscillogramme forme="sinus" T={2.5} A={1} dec={1.875} base={2} curseurs={{ c1: 2.5, c2: 15, texte: 'Δt = 12,5 ms' }}
          aria="Oscillogramme d’un son, 2 ms par carreau. Deux repères violets encadrent plusieurs motifs ; la durée entre les repères est Δt = 12,5 ms."/>, cadre('scene'));
      case 'chaine': return boite('Le son mesuré',
        <><Oscillogramme forme="sinus" T={2.5} A={1} dec={1.875} base={2} curseurs={{ c1: 2.5, c2: 15, texte: 'Δt = 12,5 ms' }}
          aria="Oscillogramme du son de l’étape précédente, 2 ms par carreau, avec les deux repères violets."/>
          <div style={{ marginTop: 8 }}>{donnee('Période T', `2,5${NB}ms`)}{donnee('Fréquence f = 1 ÷ T', fait('chaine') ? `400${NB}Hz` : '?', fait('chaine') ? COL.vert : undefined)}</div></>, cadre('scene'));
      case 'bilan': return boite('La chaîne complète, pour le son mesuré', <SceneChaineSon T="2,5 ms" f="400 Hz"/>, cadre('scene'));
      default: return null;
    }
  })();

  // ════════════════ EXPLORATION ════════════════
  const sel = { minHeight: 42, fontSize: 15, padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${KIT.bord}`, maxWidth: '100%' };
  const etiquette = (l, ctrl) => <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 8 }}>{l}{ctrl}</label>;
  const ouvrir = k => setE({ ouv: { ...ex.ouv, [k]: !ex.ouv[k] } });
  const T = M.PERIODES[ex.iT], f = M.frequenceHz(T), baseE = ex.base === 'auto' ? M.baseAuto(T) : Number(ex.base), nMotifs = 10 * baseE / T;
  const dom = M.domaine(f), jouable = M.jouable(f);
  const c1 = ex.c1 * baseE, c2 = ex.c2 * baseE;
  const infoSon = { forme: ex.forme, f, A: ex.A };
  useEffect(() => { if (son.joue) { if (!jouable) son.arreter(); else son.maj({ forme: ex.forme, f, A: ex.A }); } }, [ex.forme, f, ex.A]);   // eslint-disable-line react-hooks/exhaustive-deps
  const ecouter = () => { if (son.joue) son.arreter(); else if (jouable) son.demarrer(infoSon); };
  const formeNom = M.forme(ex.forme).court;
  const exScene = (
    <Oscillogramme forme={ex.forme} T={T} A={ex.A} base={baseE} curseurs={ex.curs ? { c1, c2, texte: `Δt = ${nbl(Math.abs(c2 - c1))} ms` } : null}
      aria={`Oscillogramme du générateur : signal ${formeNom}, ${nbl(baseE)} ms par carreau, ${nMotifs >= 80 ? 'très nombreux motifs à l’écran' : `environ ${nbl(nMotifs, 2)} motifs à l’écran`}.`}/>);
  const exReglages = (<>
    {etiquette('Forme du signal', <select value={ex.forme} onChange={x => setE({ forme: x.target.value })} style={sel}>
      {['Signaux simples', 'Instruments (schématiques)'].map(g => <optgroup key={g} label={g}>{M.FORMES.filter(fm => fm.groupe === g).map(fm => <option key={fm.id} value={fm.id}>{fm.nom}</option>)}</optgroup>)}</select>)}
    <CurseurListe nom="Période T du signal" valeurs={M.PERIODES} rang={ex.iT} onChange={i => setE({ iT: i })} texte={ex.cache ? '?' : `${nbl(T)} ms`}/>
    <Curseur nom="Amplitude du signal" valeur={ex.A} onChange={v => setE({ A: Number(v.toFixed(2)) })} min={0.1} max={1.4} pas={0.1} unite="V" decimales={1} couleur="#b45309"/>
    {aide('La période règle la hauteur du son, la forme règle le timbre, l’amplitude règle la force.')}
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
      <button onClick={ecouter} disabled={!jouable && !son.joue} aria-pressed={son.joue} style={{ ...styleBouton(son.joue, '#15803d'), opacity: !jouable && !son.joue ? 0.5 : 1 }}>{son.joue ? '⏹ Arrêter le son' : '🔊 Écouter'}</button>
      <span style={{ fontSize: 13, color: KIT.txt2 }}>{son.erreur || (!jouable ? (ex.cache ? 'Ce son n’est pas joué par la simulation pour cette valeur.' : dom === 'infrason' ? 'Infrason : on ne l’entendrait pas.' : dom === 'ultrason' ? 'Ultrason : on ne l’entendrait pas.' : 'Son trop grave ou trop aigu pour le haut-parleur de la simulation (100 Hz à 8 kHz).') : 'Volume modéré : baissez celui de l’appareil si besoin.')}</span>
    </div>
    <Section titre={`Échelle de temps : ${ex.base === 'auto' ? 'automatique' : `${nbl(baseE)} ms par carreau`}`} ouvert={!!ex.ouv.base} onBascule={() => ouvrir('base')}>
      {etiquette('Durée d’un carreau (base de temps)', <select value={ex.base} onChange={x => setE({ base: x.target.value })} style={sel}>
        <option value="auto">Automatique (2 à 5 motifs à l’écran)</option>{M.BASES.map(b => <option key={b} value={b}>{nbl(b)} ms par carreau</option>)}</select>)}
      {aide('Comme sur un oscilloscope, on règle la durée d’un carreau pour voir quelques motifs. L’écran montre 10 carreaux en largeur.')}
      {nMotifs > 60 && <div style={{ fontSize: 13, color: COL.orange }}>Trop de motifs à l’écran : choisissez une durée de carreau plus petite.</div>}
    </Section>
    <Section titre={ex.curs ? `Repères de mesure : Δt = ${nbl(Math.abs(c2 - c1))} ms` : 'Repères de mesure (facultatif)'} ouvert={!!ex.ouv.curs} onBascule={() => ouvrir('curs')}>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, fontWeight: 700, marginBottom: 8 }}><input type="checkbox" checked={ex.curs} onChange={x => setE({ curs: x.target.checked })} style={{ width: 20, height: 20 }}/>Afficher deux repères sur l’écran</label>
      {ex.curs && <>
        <Curseur nom={`Repère 1 : ${nbl(c1)} ms`} valeur={ex.c1} onChange={v => setE({ c1: Number(v.toFixed(1)) })} min={0} max={10} pas={0.1} unite="carreaux" decimales={1} couleur="#6d28d9"/>
        <Curseur nom={`Repère 2 : ${nbl(c2)} ms`} valeur={ex.c2} onChange={v => setE({ c2: Number(v.toFixed(1)) })} min={0} max={10} pas={0.1} unite="carreaux" decimales={1} couleur="#6d28d9"/>
      </>}
      {aide('Placez les repères sur deux sommets éloignés : leur écart Δt est la durée de plusieurs motifs. Comptez les motifs, puis divisez Δt par leur nombre.')}
    </Section>
    <Section titre="Mesurer moi-même (cacher T et f)" ouvert={!!ex.ouv.cache} onBascule={() => ouvrir('cache')}>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, fontWeight: 700, marginBottom: 8 }}><input type="checkbox" checked={ex.cache} onChange={x => setE({ cache: x.target.checked })} style={{ width: 20, height: 20 }}/>Cacher T et f dans les mesures</label>
      {aide('Réglez un signal avec le curseur, cachez T et f, mesurez la période sur l’écran, calculez f, puis décochez pour vérifier.')}
    </Section>
  </>);
  const exMesures = (<>
    {donnee('Période T', ex.cache ? '?' : `${nbl(T)}${NB}ms = ${nbl(T / 1000)}${NB}s`, COL.orange)}
    {donnee('Fréquence f = 1 ÷ T', ex.cache ? '?' : M.fTexte(f), COL.vert)}
    {donnee('Amplitude', `${nbf(ex.A, 1)}${NB}V`)}
    {donnee('Durée d’un carreau', `${nbl(baseE)}${NB}ms`)}
    {donnee('Motifs à l’écran', nMotifs >= 60 ? 'beaucoup' : nbf(nMotifs, 1))}
    {!ex.cache && donnee('Domaine', M.NOM_DOMAINE[dom], dom === 'audible' ? COL.vert : COL.violet)}
    {!ex.cache && donnee('Hauteur', M.compareLa(f))}
    {ex.curs && donnee('Durée entre les repères Δt', `${nbl(Math.abs(c2 - c1))}${NB}ms`, COL.violet)}
  </>);
  const aEssayer = (
    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <li>Réglez <em>T</em> sur 4{NB}ms, puis sur 2{NB}ms : que devient <em>f</em> ? Que devient la hauteur du son (bouton « Écouter ») ?</li>
      <li>Gardez la même période et changez la forme (sinus, carré, violon…) : qu’est-ce qui change sur l’écran ? À l’oreille ?</li>
      <li>Augmentez l’amplitude : que se passe-t-il pour la fréquence ? Pour la force du son ?</li>
      <li>Choisissez <em>T</em> = 0,025{NB}ms, puis <em>T</em> = 100{NB}ms : de quel domaine est chaque son ? Les entendez-vous ?</li>
      <li>Cachez <em>T</em> et <em>f</em>, placez les deux repères sur deux sommets éloignés, mesurez la période, calculez <em>f</em>, puis vérifiez.</li>
    </ul>);
  const retenirExplore = (
    <ARetenir sansFiche>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>période <em>T</em> : durée d’un motif ; <em>f</em> = 1 ÷ <em>T</em> (<em>T</em> en s, <em>f</em> en Hz) ; <em>f</em> (Hz) = 1 000 ÷ <em>T</em> (ms)</li>
        <li>plus <em>f</em> est grande, plus le son est aigu (le « la » du diapason : 440{NB}Hz) ; même note : même <em>T</em>, formes différentes = timbres différents</li>
        <li>plus l’amplitude est grande, plus le son est fort</li>
        <li>audible : 20{NB}Hz à 20{NB}kHz ; infrasons en dessous, ultrasons au-dessus</li>
        <li>mesurer : <em>T</em> = Δ<em>t</em> ÷ <em>N</em> sur plusieurs motifs</li>
      </ul>
    </ARetenir>);
  const micro = (
    <div style={{ fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: COL.orange, marginBottom: 4 }}>Facultatif, au-delà du parcours guidé</div>
      Une carte à <strong>microcontrôleur</strong> (par exemple Arduino) peut produire un son : un programme envoie à un petit haut-parleur (un buzzer) un signal qui alterne entre deux tensions, avec une période choisie. Le nombre écrit dans le programme est la fréquence. Par exemple, l’instruction <code>tone(8, 440)</code> demande un signal de fréquence 440{NB}Hz sur la broche 8 : sa période est 1 ÷ 440 ≈ 2,3{NB}ms, et le buzzer émet un « la ».
      <br/>Changer le nombre change la hauteur du son. Le signal alterne brutalement entre deux valeurs : il a la forme d’un signal carré, ce qui donne un timbre assez dur. Dans la simulation, choisissez la forme « Carré » et comparez avec « Sinus » en gardant la même période.
    </div>);

  // ════════════════ MISE EN PAGE ════════════════
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ss2-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ss2-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ss2-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (max-width: 900px) { .ss2-hypo-defi { order: 2; } }
        @media (min-width: 901px) { .ss2-l1.cote .ss2-carte { order: 2; } .ss2-l1.cote .ss2-main { order: 1; }
          .ss2-ex { grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr); grid-template-rows: auto 1fr; }
          .ss2-ex > .ss2-ex-scene { grid-column: 1; grid-row: 1; } .ss2-ex > .ss2-ex-reglages { grid-column: 2; grid-row: 1 / span 2; } .ss2-ex > .ss2-ex-mesures { grid-column: 1; grid-row: 2; } }
        @media (max-width: 900px) { .ss2-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .ss2-in { animation: ss2-fondu 0.35s ease-out; } @keyframes ss2-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Signal sonore : période, fréquence, hauteur et timbre</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un son se voit sur un graphique : c’est un signal qui se répète. On mesure sa <strong>période</strong>, on en déduit sa <strong>fréquence</strong>, et on relie ce que l’on voit à ce que l’on entend.</div>
      {enExplore ? <>
        <div className="ss2-ex">
          <div className="ss2-ex-scene">{boite('Un générateur de signal et son oscillogramme', exScene)}</div>
          <div className="ss2-ex-reglages">{boite('Réglages', exReglages)}</div>
          <div className="ss2-ex-mesures">{boite('Mesures et calculs', exMesures)}</div>
        </div>
        <Section titre="À essayer" ouvert={!!ex.ouv.essayer} onBascule={() => ouvrir('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ex.ouv.retenir} onBascule={() => ouvrir('retenir')}>{retenirExplore}</Section>
        <Section titre="Pour aller plus loin : produire un son avec un microcontrôleur" ouvert={!!ex.ouv.micro} onBascule={() => ouvrir('micro')}>{micro}</Section>
        <Section titre="Hypothèses de travail" ouvert={!!ex.ouv.hypo} onBascule={() => ouvrir('hypo')}>{hypotheses}</Section>
      </> : <>
        <div className={`ss2-l1${enGuide || enDefi ? ' cote' : ''}`}>
          {enGuide ? <div className="ss2-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="ss2-carte ss2-hypo-defi">{panneauHypo}</div> : null}
          <div className="ss2-main">
            {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defiLire ? suiviL : suiviR}/></div>}
            {enDefi && defi && <div className="ss2-in" key={defi.type}>{boite(defiLire ? 'Le son à mesurer' : 'Le signal que vous réglez', sceneDefi)}</div>}
            {enGuide && <div className="ss2-in" key={idE}>{sceneGuide}</div>}
          </div>
        </div>
        {enGuide && idE === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      </>}
    </div>
  );
}
