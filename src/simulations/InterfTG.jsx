import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, avecIndices, lireNombre, ARetenir, LigneMesure, IndiceDefi, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./itfModele";
import { QCM_PARCOURS as Q } from "./itfQcm";
import { CuveDeux, GrapheSignaux, FigHautParleurs, FigSources, CarteInterf, CarteChemins, CarteSomme, CarteDelta, CarteLignes, CarteConsequences } from "./itfSchemas";
import { COL } from "./itfStyle";

const SIM_ID = 183, CLE_GUIDE = 'interf-tg-guide-v1';
declarerDefis(SIM_ID, [['lignes', 'Compter les lignes constructives'], ['lambda', 'Retrouver la longueur d’onde']]);

// ====================================================
// SIM 183 — INTERFÉRENCES DE DEUX ONDES : CONDITIONS CONSTRUCTIVES ET DESTRUCTIVES (TG spé PC, « Caractériser les phénomènes ondulatoires »).
//  Capacités visées (jamais affichées à l'élève) : caractériser les interférences de deux ondes et en citer des conséquences concrètes ;
//  établir les conditions d'interférences constructives et destructives de deux ondes issues de deux sources ponctuelles en phase (milieu homogène) ;
//  tester ces conditions à la surface de l'eau ; capacité numérique : somme de deux signaux sinusoïdaux synchrones en faisant varier la phase à l'origine de l'un.
//  Modèle : itfModele.js (test : itfModele.test.mjs). Cuve à deux vibreurs et notations repris de la simulation 84 (TSTL), recadrés sur le programme de TG (ni Young, ni réseau).
// ====================================================

const nbf = (v, d = 1) => Number(v).toFixed(d).replace('.', ',').replace('-', '−');
const PI = Math.PI, BASE = { s: M.S_BASE, f: M.F_BASE }, PT0 = { x: 14, y: M.pointSurDelta(M.S_BASE, 3, 14).y };
const IDS = ['sources', 'zones', 'delta', 'retard', 'dephasage', 'somme', 'nature', 'etablir', 'tester', 'lignes', 'effet', 'hp', 'bilan'];
const UL = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const reduit = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const tire = t => t[Math.floor(Math.random() * t.length)];

// ---------- réglage du déphasage (curseur + boutons − et +, pas de π/12) ----------
function ReglageDphi({ dphi, setDphi }) {
  const n = Math.round(dphi / (PI / 12)), maj = k => setDphi(Math.max(0, Math.min(48, k)) * PI / 12);
  return (
    <div style={{ margin: '4px 0 8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: KIT.txt2, fontWeight: 700 }}><span>Déphasage Δφ de s₂ par rapport à s₁</span><span style={{ color: KIT.txt }}>{nbf(dphi, 2)}{NB}rad ({nbf(dphi / PI, 2)}{NB}π)</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button type="button" aria-label="Diminuer le déphasage" onClick={() => maj(n - 1)} style={{ ...stylePetitBouton(false), minWidth: 40, minHeight: 40, fontSize: 20, lineHeight: 1 }}>−</button>
        <input type="range" min={0} max={48} step={1} value={n} aria-label="Déphasage Δφ" onChange={e => maj(parseInt(e.target.value, 10))} style={{ flex: 1, accentColor: COL.s2, minWidth: 0 }}/>
        <button type="button" aria-label="Augmenter le déphasage" onClick={() => maj(n + 1)} style={{ ...stylePetitBouton(false), minWidth: 40, minHeight: 40, fontSize: 20, lineHeight: 1 }}>+</button>
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2 }}>− et + changent Δφ d’un douzième de π (15°) ; le curseur va de 0 à 4π.</div>
    </div>);
}
// ---------- flèches de déplacement du point M ----------
function FlechesM({ pt, setPt, retablir }) {
  const bouge = (dx, dy) => setPt({ x: Math.max(2, Math.min(29, Math.round((pt.x + dx) * 10) / 10)), y: Math.max(-10.5, Math.min(10.5, Math.round((pt.y + dy) * 10) / 10)) });
  const b = { ...stylePetitBouton(false), minWidth: 44, minHeight: 40, fontSize: 18, lineHeight: 1 };
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 4 }}>Déplacez M en le faisant glisser sur la cuve, ou avec les flèches (pas de 0,5{NB}cm).</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" aria-label="M vers la gauche" onClick={() => bouge(-0.5, 0)} style={b}>◀</button>
        <button type="button" aria-label="M vers la droite" onClick={() => bouge(0.5, 0)} style={b}>▶</button>
        <button type="button" aria-label="M vers le haut" onClick={() => bouge(0, 0.5)} style={b}>▲</button>
        <button type="button" aria-label="M vers le bas" onClick={() => bouge(0, -0.5)} style={b}>▼</button>
        <button type="button" onClick={retablir} style={stylePetitBouton(false)}><Pic n="refresh"/>Rétablir M</button>
      </div>
    </div>);
}

// ====================================================
export function SimulationInterfTG() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviL, noterL] = useCompteurDefi(), [suiviA, noterA] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('lignes');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ regl: false, sig: false, mes: false, python: false, essayer: false, retenir: false });
  // parcours guidé : réglages de la cuve, point M, déphasage libre, animation
  const [cG, setCG] = useState(BASE), [ptG, setPtG] = useState(PT0), [dphiG, setDphiG] = useState(0), [animG, setAnimG] = useState(() => !reduit()), [sigOuvG, setSigOuvG] = useState(false);
  // exploration
  const [ex, setEx] = useState({ f: M.F_BASE, s: M.S_BASE, vue: 'ondes', lignes: false, sig: 'M', dphi: 0 }), [ptE, setPtE] = useState(PT0), [animE, setAnimE] = useState(() => !reduit());
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const etape = guide.etape, i = Math.min(etape, IDS.length - 1), idEtape = IDS[i];
  const des = id => i >= IDS.indexOf(id), apres = id => i > IDS.indexOf(id);

  // ---------- grandeurs du parcours (réglages effectifs : le parcours impose les valeurs de base avant l'étape « effet », M est fixe avant l'étape « tester ») ----------
  const cEff = des('effet') ? cG : BASE, ptEff = des('tester') ? ptG : PT0;
  const lamG = M.lambdaCm(cEff.f), [r1, r2] = M.distancesSources(cEff.s, ptEff.x, ptEff.y), r1d = Number(r1.toFixed(2)), r2d = Number(r2.toFixed(2)), deltaG = Math.abs(r2 - r1);
  const ampG = M.amplitudeRelative(cEff.s, lamG, ptEff.x, ptEff.y);

  // ---------- exploration ----------
  const lamE = M.lambdaCm(ex.f), [e1, e2] = M.distancesSources(ex.s, ptE.x, ptE.y), deltaE = Math.abs(e2 - e1), dphiM = M.dephasage(deltaE, lamE), ampE = M.amplitudeRelative(ex.s, lamE, ptE.x, ptE.y);
  const dphiSig = ex.sig === 'M' ? dphiM : ex.dphi, natE = M.nature(deltaE / lamE);

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'sources', titre: 'Deux vibreurs, un seul générateur',
      texte: <>Une <strong>cuve à ondes</strong> est observée de dessus : deux petits vibreurs <strong>S₁</strong> et <strong>S₂</strong> frappent la surface de l’eau. Un seul <strong>générateur</strong> (GBF), réglé sur 20{NB}Hz, les alimente. Chaque vibreur émet des ondes circulaires, et ces deux ondes se superposent sur l’eau.</>,
      tache: { type: 'qcm', q: 'Pour obtenir une figure d’interférences stable, les deux ondes doivent être…', ...Q.sources,
        expl: 'Des ondes synchrones ont la même fréquence et un déphasage constant : c’est le cas ici, car un seul générateur alimente les deux vibreurs. Avec deux générateurs indépendants, ou deux fréquences un peu différentes, le déphasage varie sans cesse : la figure se brouille et ne reste pas en place.',
        indice: 'Pensez à la condition pour que le décalage entre les deux ondes reste le même au cours du temps.' } },
    { id: 'zones', titre: 'Bandes agitées et bandes calmes',
      texte: <>La carte colorée montre à présent l’<strong>amplitude</strong> de l’agitation de l’eau : foncé, l’eau est très agitée ; clair, elle est presque calme. Des bandes agitées alternent avec des bandes calmes : ce sont les <strong>franges d’interférences</strong>.</>,
      tache: { type: 'qcm', q: 'Dans une bande calme, les deux ondes qui arrivent sont…', ...Q.zones,
        expl: 'Dans une bande calme, une crête de l’une arrive en même temps qu’un creux de l’autre : les deux ondes sont en opposition de phase et se compensent (interférence destructive). Dans une bande agitée, elles arrivent en phase et s’ajoutent (interférence constructive). Les ondes ne sont pas absentes : elles arrivent bien dans la bande, mais leurs effets s’annulent, et leur fréquence est la même.',
        indice: 'Dans une bande calme, les effets des deux ondes se compensent : comment sont leurs crêtes et leurs creux ?' } },
    { id: 'delta', titre: 'Interférences et différence de chemin',
      retenirTitre: 'Interférences : constructives et destructives', retenir: <>
        <CarteInterf/>
        <ul style={UL}>
          <li>Deux ondes <strong>synchrones</strong> (même fréquence, déphasage constant) qui se superposent donnent des <strong>interférences</strong>.</li>
          <li>Elles <strong>s’ajoutent</strong> si elles arrivent en phase (constructive) et <strong>se compensent</strong> si elles arrivent en opposition de phase (destructive).</li>
          <li>Moyen de s’en souvenir : <strong>« crête sur crête : on s’ajoute ; crête sur creux : on s’annule »</strong>. Idée fausse : « les deux ondes se détruisent ». Vrai : elles se superposent, puis continuent leur route sans changement.</li>
        </ul></>,
      texte: <>Le point jaune <strong>M</strong> marque l’endroit de l’eau que l’on observe. L’onde de S₁ y arrive après avoir parcouru <em>r</em>₁ = S₁M, celle de S₂ après <em>r</em>₂ = S₂M : lisez ces deux distances dans « Mesures ». La <strong>différence de chemin</strong> est δ = <em>r</em>₂ − <em>r</em>₁, le trajet en plus de l’onde venue de S₂. Ici M est plus près de S₁, donc δ est positive (« Mesures » affiche sa valeur absolue |δ|). Calculez δ.</>,
      tache: { type: 'num', carnet: false, q: 'Différence de chemin δ (en cm)', unite: 'cm', vrai: r2d - r1d, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => [`On lit r₁ = ${nbf(r1d, 2)} cm et r₂ = ${nbf(r2d, 2)} cm.`, `δ = r₂ − r₁ = ${nbf(r2d, 2)} − ${nbf(r1d, 2)} = ${nbf(r2d - r1d, 2)} cm.`],
        pieges: [[r1d + r2d, 'Vous avez additionné les deux distances : la différence de chemin est r₂ − r₁, pas leur somme.'], [r2d, 'Vous avez donné r₂ : il faut retrancher r₁.'], [(r2d - r1d) / 100, 'Vous avez converti en mètres : l’unité demandée est le centimètre.']],
        expl: `δ = r₂ − r₁ = ${nbf(r2d, 2)} − ${nbf(r1d, 2)} ≈ ${nbf(r2d - r1d, 1)} cm.`, indice: 'Soustrayez la plus petite distance de la plus grande : δ = r₂ − r₁, avec les deux valeurs lues dans « Mesures ».' } },
    { id: 'retard', titre: 'Le retard de la deuxième onde',
      texte: <>L’onde venue de S₂ a parcouru δ = 3,0{NB}cm de plus que celle venue de S₁ : elle arrive en M avec un <strong>retard</strong> τ. La célérité des ondes est <em>v</em> = <em>λ</em> × <em>f</em>, soit 2,0{NB}cm × 20{NB}Hz = 0,40{NB}m/s, la même en tout point de la cuve. Le retard est la durée du trajet en plus : τ = frac(δ|v). Calculez-le, en millisecondes.</>,
      tache: { type: 'num', carnet: false, q: 'Retard τ (en ms)', unite: 'ms', vrai: 75, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['Hypothèse : la célérité est la même dans toute la cuve (eau de profondeur constante).', 'Unités SI : δ = 3,0 cm = 0,030 m ; v = 0,40 m/s.', 'τ = frac(0,030|0,40) = 0,075 s = 75 ms.'],
        pieges: [[0.075, 'Vous avez donné τ en secondes : l’unité demandée est la milliseconde.'], [7.5, 'Convertissez d’abord δ en mètres (0,030 m) avant de diviser par v en m/s.'], [1.2, 'Vous avez multiplié δ par v : le retard est le quotient δ ÷ v.']],
        expl: 'τ = frac(δ|v) = frac(0,030|0,40) = 0,075 s = 75 ms.', indice: 'τ = frac(δ|v) : exprimez δ en mètres et v en m/s ; le résultat est en secondes (1 s = 1 000 ms).' } },
    { id: 'dephasage', titre: 'Du retard au déphasage',
      texte: <>Chaque onde se répète avec la période <em>T</em> = frac(1|f) = 50{NB}ms. Le retard τ = 75{NB}ms (étape précédente) correspond donc à frac(τ|T) périodes, et une période entière équivaut à un déphasage de 2π radians. Le déphasage entre les deux ondes en M est ainsi Δφ = 2π × frac(τ|T) ; calculez-le, en radians.</>,
      tache: { type: 'num', carnet: false, q: 'Déphasage Δφ (en rad)', unite: 'rad', vrai: 3 * PI, tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['Les deux grandeurs sont dans la même unité : τ = 75 ms et T = 50 ms.', 'Δφ = 2π × frac(75|50) = 2π × 1,5 = 3π rad.', 'Valeur numérique : 3π ≈ 9,4 rad (calculatrice en radians).'],
        pieges: [[1.5 * PI, 'Vous avez oublié le facteur 2 : une période entière correspond à 2π radians, pas à π.'], [1.5, 'C’est le nombre de périodes τ ÷ T ; il faut le multiplier par 2π pour avoir le déphasage en radians.'], [540, 'Vous avez donné le déphasage en degrés : l’unité demandée est le radian.']],
        expl: 'Δφ = 2π × frac(τ|T) = 2π × 1,5 = 3π rad ≈ 9,4 rad.', indice: 'Δφ = 2π × frac(τ|T) : calculez d’abord frac(τ|T) (sans unité), puis multipliez par 2π.' } },
    { id: 'somme', titre: 'Chemin, retard et somme de signaux',
      retenirTitre: 'Chemin, retard et déphasage', retenir: <>
        <CarteChemins/>
        <Formule><mi>τ</mi><mo>=</mo><mfrac><mi>δ</mi><mi>v</mi></mfrac><mo>,</mo><mspace width="1.2em"/><mi>Δφ</mi><mo>=</mo><mn>2</mn><mi>π</mi><mo>×</mo><mfrac><mi>τ</mi><mi>T</mi></mfrac></Formule>
        <ul style={UL}>
          <li>Plus l’onde parcourt de chemin en plus (δ), plus elle a de retard (τ) et plus le déphasage (Δφ) est grand.</li>
          <li>Exemple de la cuve (v = 0,40 m/s, f = 20 Hz) : 1 cm de chemin en plus donne 25 ms de retard, soit une demi-période, donc Δφ = π.</li>
          <li>Moyen de s’en souvenir : <strong>« plus de chemin, plus de retard, plus de déphasage »</strong>. Idée fausse : « le déphasage dépend de la distance à une seule source ». Vrai : il dépend de la différence des deux distances.</li>
        </ul></>,
      texte: <>En M, l’eau reçoit deux signaux sinusoïdaux de même fréquence et de même amplitude <em>A</em> : <em>s</em>₁ (venu de S₁) et <em>s</em>₂ (venu de S₂, décalé de Δφ). L’eau suit leur <strong>somme</strong> <em>s</em>₁ + <em>s</em>₂. Le graphique la trace sur deux périodes. Faites varier Δφ (boutons − et + ou curseur) et observez l’amplitude de la somme, puis réglez Δφ = π.</>,
      tache: { type: 'action', ok: Math.abs(dphiG - PI) < 0.05, label: 'Régler Δφ = π', faire: () => setDphiG(PI), consigne: 'Réglez Δφ = π (12 crans de « + » depuis 0)' } },
    { id: 'nature', titre: 'Constructive ou destructive ?',
      texte: <>Vous avez vu que la somme est d’amplitude 2<em>A</em> pour Δφ = 0 et d’amplitude nulle pour Δφ = π. Le graphique va jusqu’à 4π : essayez-le. Au point M, on a trouvé Δφ = 3π{NB}rad (étape 5).</>,
      tache: { type: 'qcm', q: 'Au point M, où Δφ = 3π rad, l’interférence est…', ...Q.nature,
        expl: 'Le signal est périodique : décaler s₂ de 2π, c’est le ramener sur lui-même. Δφ = 3π = π + 2π donne donc la même somme que Δφ = π : amplitude nulle, interférence destructive. De façon générale, la somme est nulle pour Δφ = (2k + 1)π et d’amplitude 2A pour Δφ = 2kπ, avec k entier. Un multiple de π n’est constructif que si le multiple est pair.',
        indice: 'Réglez le graphique sur 3π et regardez la somme. Que donne 3π = π + 2π ?' } },
    { id: 'etablir', titre: 'Somme de signaux et condition sur δ',
      retenirTitre: 'Somme de deux signaux synchrones', retenir: <>
        <CarteSomme/>
        <ul style={UL}>
          <li>La somme de deux signaux sinusoïdaux synchrones, de même amplitude <em>A</em>, est un signal sinusoïdal de même fréquence.</li>
          <li><strong>Δφ = 2kπ</strong> : amplitude 2<em>A</em> (constructive) ; <strong>Δφ = (2k + 1)π</strong> : amplitude 0 (destructive) ; <em>k</em> entier.</li>
          <li>Moyen de s’en souvenir : <strong>« 2kπ : on double ; (2k + 1)π : on annule »</strong>. Pour un quart de période (Δφ = frac(π|2)), l’amplitude vaut environ 1,4 A.</li>
        </ul></>,
      texte: <>Le déphasage dépend de la différence de chemin : Δφ = 2π × frac(δ|λ). Condition constructive : Δφ = 2kπ donne 2π × frac(δ|λ) = 2kπ, donc δ = kλ. Faites de même pour la condition destructive, Δφ = (2k + 1)π.</>,
      tache: { type: 'qcm', q: 'Quelle condition sur δ donne une interférence destructive ?', ...Q.etablir,
        expl: '2π × frac(δ|λ) = (2k + 1)π donne frac(δ|λ) = k + ½, donc δ = (k + ½)λ : un nombre demi-entier de longueurs d’onde. Vérification au point M : δ = 3,0 cm = 1,5 × λ = (1 + ½)λ, interférence destructive, comme Δφ = 3π. δ = kλ est la condition constructive ; (2k + 1)λ est une erreur de simplification (le facteur 2π ne disparaît pas ainsi) ; frac(kλ|2) regroupe à la fois des cas constructifs (k pair) et destructifs (k impair).',
        indice: 'Divisez les deux membres de 2π × frac(δ|λ) = (2k + 1)π par 2π, puis multipliez par λ.' } },
    { id: 'tester', titre: 'Conditions sur δ et test dans la cuve',
      retenirTitre: 'Les conditions sur δ', retenir: <>
        <CarteDelta/>
        <Formule><mi>δ</mi><mo>=</mo><mi>k</mi><mi>λ</mi><mspace width="0.8em"/><mtext>constructive</mtext></Formule>
        <Formule><mi>δ</mi><mo>=</mo><mo>(</mo><mi>k</mi><mo>+</mo><mfrac><mn>1</mn><mn>2</mn></mfrac><mo>)</mo><mi>λ</mi><mspace width="0.8em"/><mtext>destructive</mtext></Formule>
        <ul style={UL}>
          <li>Valables pour deux sources ponctuelles <strong>en phase</strong>, dans un milieu homogène.</li>
          <li>Exemple de la cuve (λ = 2,0 cm) : δ = 4,0 cm = 2λ est constructive ; δ = 3,0 cm = 1,5 λ est destructive.</li>
          <li>Moyen de s’en souvenir : <strong>« entier : on s’ajoute ; demi-entier : on s’annule »</strong>. Idée fausse : « δ = 0 donne toujours du calme ». Vrai : δ = 0 (axe de symétrie) est une frange agitée.</li>
        </ul></>,
      texte: <>Testons la condition constructive à la surface de l’eau, avec <em>λ</em> = 2,0{NB}cm. Placez M sur un point où δ = 2<em>λ</em> = 4,0{NB}cm (lisez δ dans « Mesures »), puis regardez l’amplitude de l’eau en M, exprimée en pourcentage du maximum possible. La carte montre maintenant l’amplitude de l’agitation (foncé : agité).</>,
      tache: { type: 'action', ok: Math.abs(deltaG - 4) < 0.25, label: 'Placer M (δ = 4,0 cm)', faire: () => setPtG({ x: 14, y: M.yPourDelta(M.S_BASE, 4, 14) }), consigne: 'Placez M pour que δ = 4,0 cm (à 0,2 cm près)' } },
    { id: 'lignes', titre: 'Les lignes d’interférence',
      texte: <>On affiche les <strong>lignes d’interférence</strong> : en trait plein les franges agitées (constructives), en tirets les franges calmes (destructives). Déplacez M le long d’une même ligne et regardez les valeurs de « Mesures ».</>,
      tache: { type: 'qcm', q: 'Quelle grandeur garde la même valeur tout le long d’une ligne d’interférence ?', ...Q.lignes,
        expl: 'Sur une ligne, l’état d’interférence est le même, donc le déphasage et la différence de chemin δ = r₂ − r₁ sont constants (c’est la définition d’une hyperbole de foyers S₁ et S₂). Les distances r₁ et r₂ changent quand M se déplace ; leur somme (qui définirait une ellipse) ou leur rapport ne sont pas constants.',
        indice: 'Déplacez M le long d’une ligne et comparez, avant et après, les valeurs de r₁, r₂ et δ dans « Mesures ».' } },
    { id: 'effet', titre: 'Lignes d’interférence et leur nombre',
      retenirTitre: 'Les lignes d’interférence', retenir: <>
        <CarteLignes/>
        <ul style={UL}>
          <li>Une <strong>ligne d’interférence</strong> est l’ensemble des points où δ garde la même valeur : une hyperbole de foyers S₁ et S₂. La ligne centrale (δ = 0) est l’axe de symétrie.</li>
          <li>Traits pleins : constructives (δ = 0, λ, 2λ…) ; tirets : destructives (δ = ½λ, 1,5 λ, 2,5 λ…), en alternance.</li>
          <li>Moyen de s’en souvenir : <strong>« δ constant sur chaque ligne »</strong>. Idée fausse : « les franges sont des cercles autour des sources ». Vrai : ce sont des hyperboles.</li>
        </ul></>,
      texte: <>Deux réglages apparaissent sous la cuve : l’écartement <em>s</em> des sources et la fréquence <em>f</em> du générateur. La célérité reste <em>v</em> = 0,40{NB}m/s, donc <em>λ</em> = frac(v|f) change avec <em>f</em>. Essayez plusieurs valeurs en regardant le nombre de lignes tracées.</>,
      tache: { type: 'qcm', q: 'Le nombre de lignes d’interférence augmente quand…', ...Q.effet,
        expl: 'La différence de chemin ne peut pas dépasser l’écartement des sources : |δ| < s. Les lignes correspondent aux valeurs δ = kλ (constructives) et δ = (k + ½)λ (destructives) comprises entre −s et +s : leur nombre augmente quand le rapport frac(s|λ) augmente. On l’augmente en écartant les sources (s plus grand) ou en diminuant λ, donc en augmentant la fréquence (λ = frac(v|f)).',
        indice: 'Comptez les valeurs possibles de δ = kλ entre −s et +s : de quel rapport dépend leur nombre ? Rappel : λ = frac(v|f).' } },
    { id: 'hp', titre: 'Des interférences dans la vie courante',
      texte: <>Deux haut-parleurs <strong>HP₁</strong> et <strong>HP₂</strong>, distants de <em>a</em> = 2,0{NB}m, sont alimentés par le même générateur et émettent un son pur de fréquence <em>f</em> = 680{NB}Hz. La célérité du son dans l’air est <em>v</em> = 340{NB}m/s : la longueur d’onde est <em>λ</em> = frac(v|f) = 0,50{NB}m. Un auditeur est au point P, à <em>d</em>₁ = 3,00{NB}m de HP₁ et à <em>d</em>₂ = 3,75{NB}m de HP₂.</>,
      tache: { type: 'qcm', q: 'Que perçoit l’auditeur au point P ?', ...Q.hp,
        expl: 'δ = d₂ − d₁ = 0,75 m = 1,5 × λ = (1 + ½)λ : les deux sons arrivent en opposition de phase, interférence destructive, le son est très faible (presque nul : les deux amplitudes ne sont pas exactement égales). Les ondes sonores sont synchrones (même générateur), donc elles interfèrent bel et bien ; ce n’est pas δ ≠ 0 qui donne un son fort, mais δ = kλ ; et les deux haut-parleurs contribuent.',
        indice: 'Calculez δ = d₂ − d₁, puis comparez δ à λ : nombre entier ou demi-entier de longueurs d’onde ?' } },
    { id: 'bilan', titre: 'Bilan et conséquences concrètes',
      retenirTitre: 'Des conséquences concrètes', retenir: <>
        <CarteConsequences/>
        <ul style={UL}>
          <li>Deux haut-parleurs alimentés par le même signal créent des <strong>zones de silence</strong> là où δ = (k + ½)λ.</li>
          <li>Un <strong>casque à réduction de bruit</strong> émet un signal en opposition de phase avec le bruit : la somme est presque nulle.</li>
          <li>Moyen de s’en souvenir : <strong>« bruit + anti-bruit = calme »</strong>. Idée fausse : « le casque absorbe le bruit ». Vrai : il en ajoute un second qui l’annule par interférence destructive.</li>
        </ul></>,
      texte: <>Vous savez relier le retard, le déphasage et la différence de chemin, additionner deux signaux synchrones, établir et tester les conditions d’interférences constructives (δ = kλ) et destructives (δ = (k + ½)λ), et citer des conséquences concrètes. Le nombre de lignes dépend du rapport frac(s|λ). Passez à l’exploration (autres fréquences, autres écartements, programme Python de la somme de deux signaux) ou relevez les deux défis.</>, tache: null },
  ];

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'lignes') { const c = tire(M.COUPLES_LIGNES); setDefi({ type, ...c, rep: '', verifie: false }); }
    else { const t = M.tirageLambda(); setDefi({ type, ...t, rep: '', verifie: false }); }
  };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    const x = lireNombre(defi.rep);
    const ok = defi.type === 'lignes' ? isFinite(x) && x === M.nbConstructives(defi.s, defi.lam) : isFinite(x) && Math.abs(x - defi.vrai) <= 0.06 * defi.vrai;
    setDefi(d => ({ ...d, verifie: true, ok, essais: ok ? (d.essais || 0) : (d.essais || 0) + 1 })); (defi.type === 'lignes' ? noterL : noterA)(ok);
  };
  const solutionVisible = !!defi && (defi.ok || (defi.essais || 0) >= 2);
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
  const champRep = (unite, nom) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{nom} =</span>
      <input value={defi.rep} aria-label="Votre réponse" inputMode="decimal" onKeyDown={e => e.key === 'Enter' && document.getElementById('itf-verif')?.click()} onChange={e => setDefi(d => ({ ...d, rep: e.target.value, verifie: false }))}
        style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['lignes', 'Compter les lignes'], ['lambda', 'Retrouver λ']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      {defi.type === 'lignes' ? <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : compter les franges agitées</div>
        <div style={{ ...lbl, marginBottom: 8 }}>{indicesProfond(<>Deux vibreurs synchrones, en phase et distants de <strong>s = {nbf(defi.s, 0)}{NB}cm</strong>, créent dans une cuve des ondes de longueur d’onde <strong>λ = {nbf(defi.lam, 1)}{NB}cm</strong>. Combien de lignes d’interférence <strong>constructives</strong> (franges agitées) y a-t-il dans la cuve, en comptant la ligne centrale ?</>)}</div>
        {champRep('lignes', 'Nombre de lignes')}
        <IndiceDefi cache={defi.verifie && defi.ok}>{indicesProfond(<>Une ligne constructive correspond à δ = kλ avec k entier (positif, nul ou négatif). La différence de chemin vérifie toujours |δ| &lt; s. Listez les valeurs de kλ comprises entre −s et +s, en comptant k = 0.</>)}</IndiceDefi>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          <button id="itf-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
          <button onClick={() => nouveauDefi('lignes')} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        </div>
        {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
          {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}{solutionVisible && indicesProfond(M.solutionLignes(defi))}{!solutionVisible && 'Relisez l’indice, listez les valeurs de k possibles et recomptez.'}</div>}
      </> : <>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : retrouver la longueur d’onde</div>
        <div style={{ ...lbl, marginBottom: 8 }}>{indicesProfond(<>Deux vibreurs synchrones, en phase, sont distants de <strong>s = {nbf(defi.s, 0)}{NB}cm</strong>. Un capteur placé en M reçoit un signal d’amplitude nulle : M est sur la <strong>{defi.k + 1}{defi.k === 0 ? 'ʳᵉ' : 'ᵉ'} ligne d’interférence destructive</strong> en partant de l’axe de symétrie. On mesure <strong>r₁ = {nbf(defi.r1, 1)}{NB}cm</strong> et <strong>r₂ = {nbf(defi.r2, 1)}{NB}cm</strong>. Déterminez la longueur d’onde λ, avec 2 chiffres significatifs (marge acceptée : 6{NB}% de la valeur).</>)}</div>
        {champRep('cm', 'λ')}
        <IndiceDefi cache={defi.verifie && defi.ok}>{indicesProfond(<>Calculez δ = r₂ − r₁ (ici r₂ est plus grand que r₁, donc δ est positive). La n-ième ligne destructive en partant de l’axe correspond à δ = (k + ½)λ avec k = n − 1 (la première : k = 0). Isolez λ.</>)}</IndiceDefi>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          <button id="itf-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
          <button onClick={() => nouveauDefi('lambda')} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        </div>
        {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
          {defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. '}{solutionVisible && indicesProfond(M.solutionLambda(defi))}{!solutionVisible && 'Relisez l’indice : calculez δ, puis isolez λ dans la condition de la ligne destructive.'}</div>}
      </>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Sources ponctuelles, synchrones et en phase</strong> : S₁ et S₂ sont alimentées par le même générateur (même fréquence, déphasage nul entre les sources). Ce sont les seules sources étudiées : deux sources indépendantes ne donneraient pas de figure stable.</li>
      <li><strong>Ondes progressives sinusoïdales</strong>, circulaires à la surface de l’eau, dans un <strong>milieu homogène</strong> : la célérité est la même partout. Dans la simulation, v = 0,40 m/s est une valeur de modèle, indépendante de la fréquence (dans une vraie cuve, elle dépend un peu de la profondeur et de la fréquence). Pas de réflexion sur les bords, pas d’amortissement dans le temps.</li>
      <li><strong>Amplitudes égales dans les formules</strong> : les conditions δ = kλ et δ = (k + ½)λ supposent deux ondes de même amplitude en M. Dans le dessin de la cuve, l’amplitude de chaque onde décroît comme frac(1|√r) avec la distance r à sa source (modèle simplifié) : en M les deux ondes n’ont donc pas exactement la même amplitude, et la somme n’est pas rigoureusement nulle sur une ligne destructive. Ce résidu est faible loin des sources (de l’ordre de 1 à 4 % pour x ≥ 14 cm, x étant la distance aux sources le long de l’axe) et plus grand près d’elles (10 à 20 % environ à x = 2 cm), où les deux distances sont très différentes.</li>
      <li><strong>Couleurs et pourcentages</strong> : la couleur de la carte et l’« amplitude de l’eau en M » sont normalisées : elles sont exprimées en pourcentage du maximum possible au point considéré (100 % : les deux ondes s’y ajoutent parfaitement), pas en valeur absolue. D’un point à l’autre, ce maximum diminue avec la distance aux sources.</li>
      <li><strong>Conventions</strong> : δ = r₂ − r₁ est la différence de chemin, algébrique (positive du côté de S₁, négative du côté de S₂, nulle sur l’axe de symétrie) ; « Mesures » affiche sa valeur absolue |δ|, car la figure est symétrique. Le déphasage de s₂ par rapport à s₁ est Δφ = 2π × frac(δ|λ), calculé avec |δ| ; s₁(t) = A cos(2π f t) et s₂(t) = A cos(2π f t − Δφ) ; k est un entier relatif. Une frange est dite constructive (destructive) en M si le rapport frac(δ|λ), calculé avec |δ|, est à moins de 0,1 d’un entier (d’un demi-entier).</li>
      <li><strong>Longueur d’onde</strong> : λ = frac(v|f) ; avec v = 0,40 m/s et f = 20 Hz, on obtient λ = 2,0 cm. Les valeurs de f et de s proposées sont des ordres de grandeur d’une cuve de laboratoire. L’animation est volontairement ralentie (0,6 Hz au lieu de la fréquence du générateur) pour que l’œil suive les crêtes.</li>
      <li><strong>Son</strong> : la célérité du son dans l’air, 340 m/s, est une valeur de référence à 15 °C environ ; les deux haut-parleurs sont supposés identiques, ponctuels et en phase, sans réflexion sur les murs.</li>
      <li><strong>Hors programme, non traité</strong> : lumière (fentes de Young, réseau), cohérence partielle, interférences d’ondes d’amplitudes différentes ou de fréquences différentes.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- menus ----------
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const lbSel = { display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 };
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const OPT_F = [10, 16, 20, 25, 40], OPT_S = [3, 4, 5, 6, 8, 10, 12];
  const optF = f => `${f} Hz (λ = ${nbf(M.lambdaCm(f), 1)} cm)`;
  const boutonPause = (anim, setAnim) => <button type="button" onClick={() => setAnim(a => !a)} style={{ ...stylePetitBouton(false), marginTop: 6 }} aria-pressed={!anim}>{anim ? '⏸ Pause' : '▶ Lecture'}</button>;

  // ---------- scène du parcours guidé ----------
  const vueG = i === 1 || des('tester') ? 'amplitude' : 'ondes';
  const mesuresG = (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures en M</div>
      <LigneMesure nom="r₁ = S₁M" valeur={`${nbf(r1, 2)}${NB}cm`} couleur="#7c2d12"/>
      <LigneMesure nom="r₂ = S₂M" valeur={`${nbf(r2, 2)}${NB}cm`} couleur="#7c2d12"/>
      {apres('delta') && <LigneMesure nom="|δ| = |r₂ − r₁|" valeur={`${nbf(deltaG, 2)}${NB}cm`}/>}
      {apres('retard') && <LigneMesure nom="Retard τ" valeur={`${nbf(M.retardMs(deltaG), 0)}${NB}ms`}/>}
      {apres('dephasage') && <LigneMesure nom="Déphasage Δφ" valeur={`${nbf(M.dephasage(deltaG, lamG), 2)}${NB}rad`}/>}
      {des('tester') && <LigneMesure nom="Longueur d’onde λ" valeur={`${nbf(lamG, 1)}${NB}cm`}/>}
      {des('tester') && <LigneMesure nom="Amplitude de l’eau en M" valeur={`${Math.round(100 * ampG)}${NB}%`} couleur={COL.somme}/>}
      {des('tester') && <div style={{ ...aide, marginTop: 6 }}>L’amplitude de l’eau en M est donnée en pourcentage du maximum possible en M : 100 % si les deux ondes s’y ajoutent parfaitement. Sur une frange calme, elle n’est pas tout à fait nulle : dans ce modèle, chaque onde s’affaiblit un peu en s’éloignant de sa source.</div>}
    </div>);
  const signauxG = des('somme') && (
    des('tester')
      ? <Section titre={`Signaux s₁, s₂ et somme (Δφ = ${nbf(dphiG / PI, 2)} π)`} ouvert={sigOuvG} onBascule={() => setSigOuvG(o => !o)}><ReglageDphi dphi={dphiG} setDphi={setDphiG}/><GrapheSignaux dphi={dphiG}/></Section>
      : <div style={styleBoite}><div style={titreCarte}>Les deux signaux en M et leur somme</div><div style={aide}>s₂ est décalé de Δφ par rapport à s₁ ; la courbe épaisse est la somme.</div><ReglageDphi dphi={dphiG} setDphi={setDphiG}/><GrapheSignaux dphi={dphiG}/></div>);
  const boxGuide = (() => {
    if (idEtape === 'hp') return <div style={styleBoite}><FigHautParleurs/></div>;
    const libre = des('tester');
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={styleBoite}>
        <CuveDeux s={cEff.s} f={cEff.f} vue={vueG} anim={animG} lignes={des('lignes')} pt={des('delta') ? ptEff : null} setPt={libre ? setPtG : null} rayons={des('delta')}/>
        {vueG === 'amplitude' && <div style={{ ...aide, marginTop: 6 }}>Légende : foncé = eau très agitée ; clair = eau presque calme.</div>}
        {boutonPause(animG, setAnimG)}
        <div style={{ ...aide, marginTop: 4 }}>Mouvement très ralenti : l’animation tourne à 0,6 Hz, bien en dessous de la fréquence du générateur.</div>
        {libre && <FlechesM pt={ptG} setPt={setPtG} retablir={() => setPtG(PT0)}/>}
        {des('effet') && <div style={{ marginTop: 10 }}>
          <div style={aide}>{avecIndices(`Écartement des sources et fréquence du générateur : λ = frac(v|f), avec v = 0,40${NB}m/s.`)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
            <label style={lbSel}>Écartement s des sources<select value={cG.s} onChange={e => setCG(c => ({ ...c, s: +e.target.value }))} style={{ ...menu, marginTop: 2 }}>{OPT_S.map(s => <option key={s} value={s}>{s} cm</option>)}</select></label>
            <label style={lbSel}>Fréquence f du générateur<select value={cG.f} onChange={e => setCG(c => ({ ...c, f: +e.target.value }))} style={{ ...menu, marginTop: 2 }}>{OPT_F.map(f => <option key={f} value={f}>{optF(f)}</option>)}</select></label>
          </div>
          <button type="button" onClick={() => setCG(BASE)} style={stylePetitBouton(false)}><Pic n="refresh"/>Rétablir (s = 6 cm, f = 20 Hz)</button>
        </div>}
      </div>
      {des('delta') && i < IDS.indexOf('bilan') && mesuresG}
      {signauxG}
    </div>);
  })();

  // ---------- zone de scène selon le mode ----------
  const boxScene = (() => {
    if (enGuide) return boxGuide;
    if (enDefi && defi) return <div style={styleBoite}><FigSources mode={defi.type === 'lignes' ? 'lignes' : 'point'} s={defi.s}/></div>;
    const lignesTxt = ex.lignes ? 'Les lignes d’interférence sont tracées : traits pleins constructives, tirets destructives.' : '';
    return (<div style={styleBoite}>
      <div style={aide}>La cuve est vue de dessus ; faites glisser le point jaune M (ou utilisez les flèches). {lignesTxt}</div>
      <CuveDeux s={ex.s} f={ex.f} vue={ex.vue} anim={animE} lignes={ex.lignes} pt={ptE} setPt={setPtE} rayons/>
      {boutonPause(animE, setAnimE)}
      <div style={{ ...aide, marginTop: 4 }}>Mouvement très ralenti : l’animation tourne à 0,6 Hz, bien en dessous de la fréquence du générateur.</div>
      <FlechesM pt={ptE} setPt={setPtE} retablir={() => setPtE(PT0)}/>
    </div>);
  })();

  // ---------- exploration : commandes ----------
  const resume = `f = ${ex.f} Hz (λ = ${nbf(lamE, 1)} cm) · s = ${ex.s} cm`;
  const reglages = enExplore && (
    <div style={styleBoite} className="itf-ctrl">
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Choisissez la fréquence du générateur et l’écartement des sources : la cuve, les lignes et les mesures suivent.</div>
      <Section titre={`Réglages de la cuve : ${resume}`} ouvert={ouv.regl} onBascule={() => setOuv(o => ({ ...o, regl: !o.regl }))}>
        <label style={lbSel}>{avecIndices('Fréquence f du générateur (la célérité reste 0,40 m/s : λ = frac(v|f))')}
          <select value={ex.f} onChange={e => setEx(s => ({ ...s, f: +e.target.value }))} style={{ ...menu, marginTop: 2 }}>{OPT_F.map(f => <option key={f} value={f}>{optF(f)}</option>)}</select></label>
        <label style={lbSel}>Écartement s des deux sources
          <select value={ex.s} onChange={e => setEx(s => ({ ...s, s: +e.target.value }))} style={{ ...menu, marginTop: 2 }}>{OPT_S.map(s => <option key={s} value={s}>{s} cm</option>)}</select></label>
        <label style={lbSel}>Ce que montre la cuve
          <select value={ex.vue} onChange={e => setEx(s => ({ ...s, vue: e.target.value }))} style={{ ...menu, marginTop: 2 }}><option value="ondes">les ondes (crêtes et creux qui se déplacent)</option><option value="amplitude">l’amplitude (foncé : agité, clair : calme)</option></select></label>
        <label style={lbSel}>Lignes d’interférence
          <select value={ex.lignes ? 'oui' : 'non'} onChange={e => setEx(s => ({ ...s, lignes: e.target.value === 'oui' }))} style={{ ...menu, marginTop: 2 }}><option value="non">masquées</option><option value="oui">tracées (plein : constructives, tirets : destructives)</option></select></label>
      </Section>
    </div>);
  const mesures = enExplore && (
    <div style={styleBoite}>
      <Section titre={`Mesures en M : δ = ${nbf(deltaE, 2)} cm · ${natE === 'intermédiaire' ? 'ni constructive ni destructive' : natE}`} ouvert={ouv.mes} onBascule={() => setOuv(o => ({ ...o, mes: !o.mes }))}>
        <div style={aide}>M est le point jaune. L’amplitude de l’eau est en pourcentage du maximum possible en M (100 % : ondes parfaitement en phase). {avecIndices('« Constructive » ou « destructive » : le rapport frac(δ|λ) est à moins de 0,1 d’un entier ou d’un demi-entier.')}</div>
        <LigneMesure nom="r₁ = S₁M" valeur={`${nbf(e1, 2)}${NB}cm`} couleur="#7c2d12"/>
        <LigneMesure nom="r₂ = S₂M" valeur={`${nbf(e2, 2)}${NB}cm`} couleur="#7c2d12"/>
        <LigneMesure nom="|δ| = |r₂ − r₁|" valeur={`${nbf(deltaE, 2)}${NB}cm`}/>
        <LigneMesure nom="δ en nombre de λ" valeur={nbf(deltaE / lamE, 2)}/>
        <LigneMesure nom="Retard τ" valeur={`${nbf(M.retardMs(deltaE), 1)}${NB}ms`}/>
        <LigneMesure nom="Déphasage Δφ" valeur={`${nbf(dphiM, 2)}${NB}rad`}/>
        <LigneMesure nom="Amplitude de l’eau en M" valeur={`${Math.round(100 * ampE)}${NB}%`} couleur={COL.somme}/>
        <LigneMesure nom="Interférence en M" valeur={natE === 'intermédiaire' ? 'intermédiaire' : natE}/>
        <div style={{ ...aide, marginTop: 8 }}>Nombre de lignes pour ce réglage : {M.nbConstructives(ex.s, lamE)} constructives et {M.nbDestructives(ex.s, lamE)} destructives (une ligne tombe pile sur la limite |δ| = s si s est un nombre entier ou demi-entier de λ : elle n’est alors pas comptée ; c’est le cas du réglage de départ, où s = 3 λ).</div>
      </Section>
    </div>);
  const signaux = enExplore && (
    <div style={styleBoite}>
      <Section titre={`Signaux en M : s₁, s₂ et leur somme (Δφ = ${nbf(dphiSig / PI, 2)} π)`} ouvert={ouv.sig} onBascule={() => setOuv(o => ({ ...o, sig: !o.sig }))}>
        <label style={lbSel}>Déphasage utilisé
          <select value={ex.sig} onChange={e => setEx(s => ({ ...s, sig: e.target.value }))} style={{ ...menu, marginTop: 2 }}><option value="M">celui du point M (déduit de δ)</option><option value="main">réglé à la main (curseur)</option></select></label>
        {ex.sig === 'main' ? <ReglageDphi dphi={ex.dphi} setDphi={v => setEx(s => ({ ...s, dphi: v }))}/> : <div style={aide}>Δφ = {nbf(dphiM, 2)} rad : déplacez M pour le voir changer.</div>}
        <GrapheSignaux dphi={dphiSig}/>
      </Section>
    </div>);
  const python = enExplore && (
    <div style={styleBoite}>
      <Section titre="Le même graphique avec un programme Python" ouvert={ouv.python} onBascule={() => setOuv(o => ({ ...o, python: !o.python }))}>
        <div style={aide}>Ce programme trace s₁, s₂ et leur somme sur deux périodes. Recopiez-le dans votre éditeur Python, puis changez la valeur de <code>dphi</code> (0, np.pi / 2, np.pi, 3 * np.pi…) et observez l’amplitude de la somme.</div>
        <pre style={{ margin: 0, padding: 10, background: '#0f172a', color: '#e2e8f0', borderRadius: 8, fontSize: 13, lineHeight: 1.5, overflowX: 'auto' }}>{PROGRAMME_PYTHON}</pre>
      </Section>
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Placez M sur l’axe de symétrie (y = 0) : que valent δ et l’amplitude ? Pourquoi ?</li>
        <li>Placez M sur une ligne en tirets, puis sur une ligne en trait plein : comparez le rapport frac(δ|λ) et l’amplitude.</li>
        <li>Doublez la fréquence : que devient λ ? Le nombre de lignes change-t-il ? Dans quel sens ?</li>
        <li>Rapprochez les sources jusqu’à s = 3 cm avec f = 10 Hz : combien reste-t-il de lignes ? Pourquoi si peu ?</li>
        <li>Dans « Signaux en M », réglez Δφ à la main : pour quelles valeurs la somme est-elle nulle ? Et d’amplitude 2A ?</li>
        <li>Dans le programme Python, remplacez <code>dphi = np.pi</code> par <code>dphi = 3 * np.pi</code> : le graphique change-t-il ? Pourquoi ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="Idées clés" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Ondes synchrones : même fréquence, déphasage constant ; sources en phase</li>
          <li>Différence de chemin δ = |r₂ − r₁| ; retard τ = frac(δ|v) ; déphasage Δφ = 2π × frac(δ|λ)</li>
          <li>Somme de deux signaux de même amplitude A : 2A si Δφ = 2kπ, 0 si Δφ = (2k + 1)π</li>
          <li>Constructive : δ = kλ ; destructive : δ = (k + ½)λ (k entier)</li>
          <li>Lignes d’interférence : δ constant, hyperboles de foyers S₁ et S₂ ; |δ| &lt; s</li>
          <li>Conséquences : zones de silence entre deux haut-parleurs, casque à réduction de bruit</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .itf-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .itf-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .itf-col { display: flex; flex-direction: column; gap: 12px; }
        .itf-df { display: block; margin-bottom: 12px; } .itf-df > * { margin-bottom: 12px; }
        .itf-df-scene { position: sticky; top: 0; z-index: 3; background: #fff; }
        @media (min-width: 901px) { .itf-df { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .itf-df > * { margin-bottom: 0; } .itf-df-scene { position: static; grid-column: 1; grid-row: 1 / span 2; }
          .itf-df-volet { grid-column: 2; grid-row: 1; } .itf-df-hypo { grid-column: 2; grid-row: 2; } }
        .itf-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .itf-l1.cote .itf-carte { order: 2; } .itf-l1.cote .itf-main { order: 1; }
          .itf-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .itf-ex > * { grid-column: 1; } .itf-ex > .itf-ctrl { grid-column: 2; grid-row: 1 / span 7; } }
        @media (max-width: 900px) { .itf-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .itf-in { animation: itf-fondu 0.35s ease-out; } @keyframes itf-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Interférences de deux ondes</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>{avecIndices('Deux sources synchrones qui émettent en phase : on cherche où les deux ondes s’ajoutent et où elles s’annulent.')}</div>
      {enGuide && <div className="itf-l1 cote">
        <div className="itf-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div>
        <div className="itf-main"><div className="itf-col"><div className="itf-in" key={'s-' + (idEtape === 'hp' ? 'hp' : 'cuve')}>{boxScene}</div></div></div>
      </div>}
      {enDefi && defi && <div className="itf-df">
        <div className="itf-df-scene itf-in" key={'d' + defi.type}>{boxScene}</div>
        <div className="itf-df-volet"><div style={styleBoite}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'lignes' ? suiviL : suiviA}/></div></div>
        <div className="itf-df-hypo">{panneauHypo}</div>
      </div>}
      {enExplore && <div className="itf-ex">
        <div>{boxScene}</div>
        <div className="itf-ctrl">{reglages}</div>
        <div>{mesures}</div>
        <div>{signaux}</div>
        <div>{python}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && idEtape === 'bilan' && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}

const PROGRAMME_PYTHON = `import numpy as np
import matplotlib.pyplot as plt

f = 20          # fréquence (Hz)
T = 1 / f       # période (s)
A = 1.0         # amplitude
dphi = np.pi    # déphasage (rad)

t = np.linspace(0, 2 * T, 400)
w = 2 * np.pi * f
s1 = A * np.cos(w * t)
s2 = A * np.cos(w * t - dphi)
S = s1 + s2     # somme

tms = 1000 * t  # temps en ms
plt.plot(tms, s1, label="s1")
plt.plot(tms, s2, "--", label="s2")
plt.plot(tms, S, lw=3, label="somme")
plt.xlabel("t (ms)")
plt.ylabel("signal")
plt.legend()
plt.show()`;
