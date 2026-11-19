import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { Formule, FormuleEnLigne, indicesProfond, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, ARetenir, LigneMesure, IndiceDefi, Curseur } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./vecteursVAModele";
import { QCM_PARCOURS as Q } from "./vecteursVAQcm";
import { SceneChrono, GraphesVA, SvgVitesseCarte, SvgAccelerationCarte, SvgSensCarte, SvgSigneCarte, SvgDeriveesCarte, SvgCaracteriserCarte } from "./vecteursVASchemas";
const SIM_ID = 166, CLE_GUIDE = 'vecteurs-va-tg-guide-v1';
declarerDefis(SIM_ID, [['chrono', 'Lire l’accélération sur une chronophotographie'], ['derive', 'De x(t) à l’accélération et à l’arrêt']]);
// ====================================================
// SIM 166 — VECTEURS POSITION, VITESSE ET ACCÉLÉRATION : DE LA CHRONOPHOTOGRAPHIE AUX DÉRIVÉES
//  (TG spé PC, chapitre « Décrire un mouvement », partie « Mouvement et interactions »).
//  Une seule idée : du vecteur position OM(t) au vecteur vitesse (dérivée) puis au vecteur accélération (dérivée du vecteur vitesse), en coordonnées cartésiennes ;
//  exploitation d'une chronophotographie (coordonnées approchées) ; a pour un mouvement rectiligne, rectiligne uniforme, rectiligne uniformément accéléré ;
//  l'accélération n'est pas « aller plus vite » (ralentir = a de sens opposé à v) ; signe algébrique des coordonnées de a.
//  Capacités visées (jamais affichées à l'élève) : définir le vecteur position, le vecteur vitesse (dérivée), le vecteur accélération ; établir les coordonnées cartésiennes
//  des vecteurs vitesse et accélération à partir de celles de la position ; représenter vitesse et accélération dans des situations variées ; caractériser le vecteur
//  accélération pour un mouvement rectiligne, rectiligne uniforme, rectiligne uniformément accéléré.
//  Hors périmètre : repère de Frenet et mouvement circulaire (sim 167), deuxième loi de Newton (168), tir dans le champ de pesanteur (169).
//  Modèle de calcul : vecteursVAModele.js.
// ====================================================
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const COL = { bleu: '#0b4f94', orange: '#c2410c', vert: '#15803d', rouge: '#b91c1c', gris: '#475569' };
const IDS = ['position', 'vitesse', 'tracev', 'accel', 'sens', 'freine', 'arret', 'vxt', 'axt', 'mrua', 'mru', 'bilan'];
const SCENARIO = ['acc', 'acc', 'acc', 'acc', 'acc', 'frein', 'retour', 'derive', 'derive', 'derive', 'unif', 'acc'];
const POINT = [null, 4, 4, 4, 4, 4, 3, 2, 3, 3, 4, 4];
const ANNEAUX = [[], [3, 5], [], [3, 5], [], [3, 5], [], [], [], [], [], []];
// Tableau des positions de la chronophotographie (le parcours demande de choisir les bonnes valeurs : on ne les donne pas dans l'énoncé)
const TabPos = ({ mvId }) => { const mv = M.MOUVEMENTS[mvId], P = M.chrono(mv); const d = v => nbf(v, Math.abs(v * 10 - Math.round(v * 10)) < 1e-9 ? 1 : 2);
  const lots = [P.slice(0, 5), P.slice(5)];                  // deux petits tableaux : 9 colonnes ne tiennent pas sur un téléphone
  return (<div style={{ margin: '8px 0' }}>{lots.filter(l => l.length).map((l, k) => (
    <table key={k} style={{ borderCollapse: 'collapse', fontSize: 14, width: '100%', fontFamily: 'monospace', marginBottom: 4 }}><tbody>
      <tr><td style={{ padding: '2px 4px', color: KIT.txt2, width: 52 }}>i</td>{l.map(p => <td key={p.i} style={{ padding: '2px 3px', textAlign: 'right' }}>{p.i}</td>)}</tr>
      <tr><td style={{ padding: '2px 4px', color: KIT.txt2 }}>x{NB}(m)</td>{l.map(p => <td key={p.i} style={{ padding: '2px 3px', textAlign: 'right', fontWeight: 700 }}>{d(p.x)}</td>)}</tr></tbody></table>))}</div>); };
const Ul = ({ children }) => <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>{indicesProfond(children)}</ul>;
// ---------- formules (MathML) : vecteurs surmontés d'une flèche ----------
const fl = <mo stretchy="false">→</mo>;
const vm = n => <mover><mi>{n}</mi>{fl}</mover>;
const om = <mover><mrow><mi>O</mi><mi>M</mi></mrow>{fl}</mover>;
const dt = <mrow><mi mathvariant="normal">d</mi><mi>t</mi></mrow>;
const ind = (n, i, j) => <msub>{n}<mrow><mi>i</mi><mo>{j}</mo><mn>1</mn></mrow></msub>;
const FVit = <Formule>{vm('v')}<mo>=</mo><mfrac><mrow><mi mathvariant="normal">d</mi>{om}</mrow>{dt}</mfrac></Formule>;
const FVitApp = <Formule><msub>{vm('v')}<mi>i</mi></msub><mo>≈</mo><mfrac><mrow>{ind(om, 'i', '+')}<mo>−</mo>{ind(om, 'i', '−')}</mrow><mrow><mn>2</mn><mi>τ</mi></mrow></mfrac></Formule>;
const FAcc = <Formule>{vm('a')}<mo>=</mo><mfrac><mrow><mi mathvariant="normal">d</mi>{vm('v')}</mrow>{dt}</mfrac></Formule>;
const FAccApp = <Formule><msub>{vm('a')}<mi>i</mi></msub><mo>≈</mo><mfrac><mrow>{ind(vm('v'), 'i', '+')}<mo>−</mo>{ind(vm('v'), 'i', '−')}</mrow><mrow><mn>2</mn><mi>τ</mi></mrow></mfrac></Formule>;
const FVx = <Formule><msub><mi>v</mi><mi>x</mi></msub><mo>=</mo><mfrac><mrow><mi mathvariant="normal">d</mi><mi>x</mi></mrow>{dt}</mfrac></Formule>;
const FAx = <Formule><msub><mi>a</mi><mi>x</mi></msub><mo>=</mo><mfrac><mrow><mi mathvariant="normal">d</mi><msub><mi>v</mi><mi>x</mi></msub></mrow>{dt}</mfrac></Formule>;
const FVxApp = <Formule><msub><mi>v</mi><mrow><mi>x</mi><mo>,</mo><mi>i</mi></mrow></msub><mo>≈</mo><mfrac><mrow><msub><mi>x</mi><mrow><mi>i</mi><mo>+</mo><mn>1</mn></mrow></msub><mo>−</mo><msub><mi>x</mi><mrow><mi>i</mi><mo>−</mo><mn>1</mn></mrow></msub></mrow><mrow><mn>2</mn><mi>τ</mi></mrow></mfrac></Formule>;
const FAxApp = <Formule><msub><mi>a</mi><mrow><mi>x</mi><mo>,</mo><mi>i</mi></mrow></msub><mo>≈</mo><mfrac><mrow><msub><mi>v</mi><mrow><mi>x</mi><mo>,</mo><mi>i</mi><mo>+</mo><mn>1</mn></mrow></msub><mo>−</mo><msub><mi>v</mi><mrow><mi>x</mi><mo>,</mo><mi>i</mi><mo>−</mo><mn>1</mn></mrow></msub></mrow><mrow><mn>2</mn><mi>τ</mi></mrow></mfrac></Formule>;
const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
// ====================================================
export function SimulationVecteursVA() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviC, noterC] = useCompteurDefi(), [suiviD, noterD] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('chrono');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ mesures: false, graphes: false, tableau: false, essayer: false, retenir: false });
  const [ex, setEx] = useState({ mv: 'acc', tau: 1.0, om: false, v: true, a: true, sel: 3, coord: 'x' });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;
  const etape = guide.etape, idx = enGuide ? Math.min(etape, IDS.length - 1) : -1;
  const reussie = k => !!(guide.reussies && guide.reussies[k]);
  // ---------- ce que montre la scène à chaque étape du parcours (on n'affiche une grandeur que lorsque l'étape la demande ou l'a obtenue) ----------
  const VIS = [
    { v: false, a: false, om: 5 }, { v: reussie(1), a: false }, { v: true, a: false }, { v: true, a: reussie(3) }, { v: true, a: reussie(4) }, { v: true, a: reussie(5) },
    { v: true, a: reussie(6) }, { v: reussie(7), a: false }, { v: true, a: reussie(8) }, { v: true, a: true }, { v: true, a: reussie(10) }, { v: true, a: true },
  ];
  let scene = null, caption = null;
  if (enGuide) {
    const mv = M.MOUVEMENTS[SCENARIO[idx]], P = M.chrono(mv), E = M.echelles(mv, P, mv.tau), vis = VIS[idx];
    scene = <SceneChrono mv={mv} P={P} tau={mv.tau} E={E} montrerV={vis.v} montrerA={vis.a} om={vis.om ?? null} sel={POINT[idx]} anneaux={ANNEAUX[idx]}
      aria={`Chronophotographie : ${mv.nom}. Points numérotés de 0 à ${mv.N}, pris toutes les ${nbf(mv.tau, 1)} secondes, sur un axe Ox gradué en mètres${vis.om != null ? ', avec le vecteur position OM5 tracé depuis l’origine O' : ''}${vis.v ? ', avec les vecteurs vitesse' : ''}${vis.a ? ' et les vecteurs accélération' : ''}.`}/>;
    caption = <><strong>{mv.nom}</strong> : points pris toutes les τ = {nbf(mv.tau, 1)}{NB}s (le point n° i correspond à la date t = i × τ).</>;
  }
  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'position', titre: 'Le vecteur position', focus: ['scene'],
      texte: <>Une voiture roule sur une route droite. Une caméra la photographie toutes les τ = 1,0{NB}s : les points numérotés sont ses positions successives (c’est une <strong>chronophotographie</strong>). On choisit un repère (O ; x) : O est l’origine et l’axe Ox est orienté dans le sens du déplacement. À la date t = 5,0{NB}s, la voiture est au point M_5. La flèche verte est le <strong>vecteur position</strong> vec(OM) de la voiture à cette date. Observez la figure et lisez l’axe gradué pour répondre.</>,
      tache: { type: 'qcm', q: 'Quelle est la coordonnée x du vecteur position vec(OM) à la date t = 5,0 s ?', ...Q.position,
        expl: 'Le vecteur position a pour origine le point fixe O et pour extrémité le point M : ses coordonnées (x ; y) sont celles de M. Ici x_5 = 22,5 m (et y = 0 sur cette route droite). Les autres valeurs sont les abscisses des points voisins ou un déplacement entre deux points.',
        indice: 'Le vecteur position se trace depuis l’origine O jusqu’au point M_5. Sa coordonnée x se lit sur l’axe, à la verticale du point M_5 : entre quelles graduations se trouve-t-elle ?' } },
    { id: 'vitesse', titre: 'Du vecteur position au vecteur vitesse', focus: ['scene'],
      texte: <>Le <strong>vecteur vitesse</strong> indique à quel rythme la position change : c’est la dérivée du vecteur position par rapport au temps. {FVit}Sur la chronophotographie, on ne connaît vec(OM) qu’aux dates i × τ : on approche la dérivée par la variation de position entre le point précédent et le point suivant (deux intervalles de temps, soit 2τ). En coordonnées : {FVxApp}Lisez dans le tableau les positions x_3 et x_5 des points entourés (τ = 1,0{NB}s).<TabPos mvId="acc"/></>,
      tache: { type: 'num', q: 'Coordonnée v_x du vecteur vitesse au point M_4', unite: 'm/s', vrai: 6.0, tol: 0.05, affiche: v => nbf(v, 1),
        calcul: () => ['Dans le tableau : x_3 = 10,5 m et x_5 = 22,5 m. Le point M_4 est entouré de M_3 et M_5, séparés de deux intervalles de temps : v_x(4) ≈ frac(x_5 − x_3|2τ).', 'v_x(4) ≈ frac(22,5 − 10,5|2 × 1,0) = frac(12,0|2,0) = 6,0 m/s (des mètres divisés par des secondes).'],
        pieges: [[12.0, 'Il manque le facteur 2 : de M_3 à M_5, il s’écoule deux intervalles de temps (2τ = 2,0 s), pas un seul.'], [24.0, 'Il faut diviser par 2τ, pas multiplier par 2τ.'], [4.5, 'Vous avez divisé x_5 par la date de M_5 : c’est une vitesse moyenne depuis le départ, pas la vitesse en M_4.']],
        expl: 'v_x(4) ≈ frac(22,5 − 10,5|2 × 1,0) = 6,0 m/s.', indice: 'Cherchez x_3 et x_5 dans le tableau, faites la différence x_5 − x_3, puis divisez par la durée qui sépare M_3 de M_5 : 2τ.' } },
    { id: 'tracev', titre: 'Représenter le vecteur vitesse', focus: ['scene'],
      texte: <>On trace maintenant le vecteur vitesse en chaque point (flèches pleines, rangée du haut). Sa <strong>direction</strong> est celle du mouvement (tangente à la trajectoire), son <strong>sens</strong> est celui du mouvement, et sa <strong>longueur</strong> est proportionnelle à la norme v (voir l’échelle sous la figure).</>,
      tache: { type: 'qcm', q: 'Comment évolue la norme du vecteur vitesse au fil du temps, du point M_1 au point M_7 ?', ...Q.tracev,
        expl: 'Les flèches s’allongent de point en point : la norme v augmente. C’est cohérent avec les positions, de plus en plus espacées pour une durée τ constante.',
        indice: 'Comparez la longueur de la première flèche et celle de la dernière. À durée τ égale, plus les points sont espacés, plus le mobile va vite.' } },
    { id: 'accel', titre: 'Du vecteur vitesse au vecteur accélération', focus: ['scene'],
      retenirTitre: 'À RETENIR : LE VECTEUR VITESSE',
      retenir: <>
        <SvgVitesseCarte/>
        {FVitApp}
        <Ul>
          <li>Le vecteur vitesse est la <strong>dérivée du vecteur position</strong> : il est tangent à la trajectoire, dans le sens du mouvement. Sur une chronophotographie, on divise la variation de position entre M_3 et M_5 par 2τ.</li>
          <li>Exemple de la simulation : x_3 = 10,5 m et x_5 = 22,5 m donnent v_x(4) = 6,0 m/s.</li>
          <li>Moyen de s’en souvenir : <strong>« la vitesse, c’est la dérivée de la position »</strong>. Idée fausse : « on divise par τ ». Vrai : de M_3 à M_5, il s’écoule 2τ.</li>
        </Ul></>,
      texte: <>Le <strong>vecteur accélération</strong> indique à quel rythme le <em>vecteur vitesse</em> change : c’est la dérivée du vecteur vitesse par rapport au temps. {FAcc}On procède comme pour la vitesse, en remplaçant vec(OM) par vec(v) : {FAxApp}Pour trouver a_x au point M_4, il faut d’abord la vitesse en M_3 et en M_5 (points entourés), calculées comme à l’étape précédente à partir du tableau des positions (τ = 1,0{NB}s).<TabPos mvId="acc"/></>,
      tache: { type: 'num', q: 'Coordonnée a_x du vecteur accélération au point M_4', unite: 'm/s²', vrai: 1.0, tol: 0.05, affiche: v => nbf(v, 1),
        calcul: () => ['Vitesses : v_x(3) ≈ frac(x_4 − x_2|2τ) = frac(16,0 − 6,0|2,0) = 5,0 m/s et v_x(5) ≈ frac(x_6 − x_4|2τ) = frac(30,0 − 16,0|2,0) = 7,0 m/s.', 'a_x(4) ≈ frac(v_x(5) − v_x(3)|2τ) = frac(7,0 − 5,0|2 × 1,0) = frac(2,0|2,0) = 1,0 m/s² (des m/s divisés par des s).'],
        pieges: [[2.0, 'Il manque un facteur 2 : v_x(3), v_x(5) et a_x(4) se calculent chacun en divisant par 2τ = 2,0 s.'], [-1.0, 'Vérifiez le signe : v_x(5) est plus grande que v_x(3), donc la variation est positive.'], [4.0, 'Il faut diviser par 2τ, pas multiplier par 2τ.']],
        expl: 'a_x(4) ≈ frac(7,0 − 5,0|2 × 1,0) = 1,0 m/s².', indice: 'Calculez d’abord v_x(3) avec x_2 et x_4, puis v_x(5) avec x_4 et x_6 (même formule qu’avant). Ensuite faites v_x(5) − v_x(3), divisé par 2τ.' } },
    { id: 'sens', titre: 'Direction et sens du vecteur accélération', focus: ['scene'],
      texte: <>Revenons à la voiture qui démarre : ses vecteurs vitesse s’allongent de point en point. Le vecteur accélération (flèche en tirets orange) sera tracé au-dessus de chaque vecteur vitesse quand vous aurez répondu.</>,
      tache: { type: 'qcm', q: 'Quelle est la direction et le sens du vecteur accélération vec(a) au point M_4 ?', ...Q.sens,
        expl: 'La variation vec(Δv) = vec(v)_5 − vec(v)_3 est dirigée comme vec(v) (la vitesse augmente, sans changer de direction) : vec(a) a la même direction et le même sens que vec(v). C’est cohérent avec a_x = +1,0 m/s² et v_x > 0.',
        indice: 'Construisez la variation vec(Δv) : la vitesse après est plus longue que la vitesse avant, sur la même droite. Dans quel sens va vec(Δv) ?' } },
    { id: 'freine', titre: 'Une voiture qui freine', focus: ['scene'],
      retenirTitre: 'À RETENIR : LE VECTEUR ACCÉLÉRATION',
      retenir: <>
        <SvgAccelerationCarte/>
        {FAccApp}
        <Ul>
          <li>Le vecteur accélération est la <strong>dérivée du vecteur vitesse</strong> : il a la direction et le sens de la variation vec(Δv) = vec(v)_après − vec(v)_avant, divisée par la durée.</li>
          <li>Exemple de la simulation : v_x passe de 5,0 à 7,0 m/s en 2τ = 2,0 s, donc a_x = 1,0 m/s².</li>
          <li>Moyen de s’en souvenir : <strong>« vec(a) montre dans quel sens vec(v) change »</strong>. Idée fausse : « vec(a) pointe toujours dans le sens du mouvement ». Vrai : il pointe dans le sens de vec(Δv).</li>
        </Ul></>,
      texte: <>La voiture freine maintenant : les points se rapprochent et les vecteurs vitesse raccourcissent, mais elle avance toujours dans le sens de l’axe Ox. On cherche a_x au point M_4 : calculez d’abord la vitesse en M_3 et en M_5 (points entourés) à partir du tableau des positions (τ = 1,0{NB}s).<TabPos mvId="frein"/></>,
      tache: { type: 'num', q: 'Coordonnée a_x du vecteur accélération au point M_4, avec son signe', unite: 'm/s²', vrai: -1.0, tol: 0.05, affiche: v => nbf(v, 1),
        calcul: () => ['Vitesses : v_x(3) ≈ frac(x_4 − x_2|2τ) = frac(28,0 − 16,0|2,0) = 6,0 m/s et v_x(5) ≈ frac(x_6 − x_4|2τ) = frac(36,0 − 28,0|2,0) = 4,0 m/s : la vitesse diminue.', 'a_x(4) ≈ frac(v_x(5) − v_x(3)|2τ), avec v_x(5) − v_x(3) = 4,0 − 6,0 = −2,0 m/s.', 'a_x(4) ≈ frac(−2,0|2 × 1,0) = −1,0 m/s². Le signe négatif indique que vec(a) est orienté dans le sens opposé à l’axe Ox, donc opposé à vec(v).'],
        pieges: [[1.0, 'Vérifiez le signe : v_x(5) est plus petite que v_x(3), donc la variation de vitesse est négative.'], [-2.0, 'Il manque un facteur 2 : v_x(3), v_x(5) et a_x(4) se calculent chacun en divisant par 2τ = 2,0 s.'], [2.0, 'Il manque le signe : la variation de vitesse v_x(5) − v_x(3) est négative (la vitesse diminue).']],
        expl: 'a_x(4) ≈ frac(4,0 − 6,0|2 × 1,0) = −1,0 m/s².', indice: 'Même méthode qu’à l’étape précédente : v_x(3) avec x_2 et x_4, v_x(5) avec x_4 et x_6. Gardez le signe de v_x(5) − v_x(3) : la vitesse a-t-elle augmenté ou diminué ?' } },
    { id: 'arret', titre: 'Quand le palet s’arrête…', focus: ['scene'],
      texte: <>Un palet est lancé vers le haut d’un plan incliné très glissant. L’axe Ox est parallèle au plan, orienté vers le haut. Le palet monte, s’arrête un instant au point M_3 (v<sub>x</sub> = 0), puis redescend. Les points sont décalés vers le bas au fil du temps pour ne pas se superposer : le mouvement reste rectiligne.</>,
      tache: { type: 'qcm', q: 'À l’instant où le palet s’arrête (point M_3), que vaut le vecteur accélération vec(a) ?', ...Q.arret,
        expl: 'La vitesse vaut zéro à cet instant précis, mais elle change : elle était positive (montée), elle devient négative (descente). Sa dérivée n’est donc pas nulle : vec(a) n’est pas nul, il est le même qu’aux autres points (a_x = −2,0 m/s²).',
        indice: 'Regardez les vecteurs vitesse juste avant et juste après M_3 : sont-ils égaux ? Si vec(v) change, que dire de sa dérivée ?' } },
    { id: 'vxt', titre: 'Dériver x(t) : la vitesse', focus: ['scene'],
      retenirTitre: 'À RETENIR : ACCÉLÉRER OU RALENTIR ?',
      retenir: <>
        <SvgSensCarte/>
        <Ul>
          <li>Le vecteur accélération est non nul dès que le vecteur vitesse change, en norme <em>ou</em> en direction. <strong>Ralentir, c’est aussi accélérer</strong> au sens de la physique : vec(a) est alors de sens opposé à vec(v).</li>
          <li>Exemple de la simulation : la voiture qui freine a v_x = 6,0 puis 4,0 m/s, donc a_x = −1,0 m/s² (négatif) alors qu’elle avance toujours vers les x croissants.</li>
          <li>Moyen de s’en souvenir : <strong>« même sens : la vitesse augmente ; sens contraires : elle diminue »</strong>. Idée fausse : « a_x négative veut dire que ça ne va pas plus vite, ou que le mobile recule ». Vrai : le signe de a_x dépend de l’axe, et se compare au signe de v_x.</li>
        </Ul></>,
      texte: <>On sait maintenant passer de vec(OM) à vec(v) en coordonnées : v_x est la dérivée de x(t). {FVx}Le mouvement d’un chariot sur un rail droit (y = 0) est décrit par x(t) = 1,5 t² + 2,0 t (x en m, t en s). Rappel : la dérivée de a t² est 2 a t, et celle de b t est b. On cherche la vitesse à la date t = 2,0{NB}s (point M_2 de la chronophotographie).</>,
      tache: { type: 'num', q: 'Coordonnée v_x du vecteur vitesse à la date t = 2,0 s', unite: 'm/s', vrai: 8.0, tol: 0.05, affiche: v => nbf(v, 1),
        calcul: () => ['On dérive : v_x(t) = frac(dx|dt) = 2 × 1,5 t + 2,0 = 3,0 t + 2,0 (en m/s, avec t en s).', 'À t = 2,0 s : v_x = 3,0 × 2,0 + 2,0 = 8,0 m/s.'],
        pieges: [[5.0, 'Vous trouvez 5,0 : soit vous avez divisé x(2,0) = 10 m par 2,0 s (vitesse moyenne depuis le départ), soit vous avez dérivé 1,5 t² en 1,5 t. La dérivée de a t² est 2 a t.'], [6.0, 'Il manque le terme 2,0 : la dérivée de 2,0 t est 2,0 (constante).']],
        expl: 'v_x(t) = 3,0 t + 2,0, donc v_x(2,0 s) = 8,0 m/s.', indice: 'Dérivez chaque terme : (a t²)′ = 2 a t et (b t)′ = b. Puis remplacez t par 2,0 s.' } },
    { id: 'axt', titre: 'Dériver la vitesse : l’accélération', focus: ['scene'],
      retenirTitre: 'À RETENIR : LE SIGNE DE L’ACCÉLÉRATION',
      retenir: <>
        <SvgSigneCarte/>
        <Ul>
          <li>Un mobile à l’arrêt <em>un instant</em> n’a pas forcément une accélération nulle : <strong>un vecteur vitesse nul n’implique pas un vecteur accélération nul</strong>. Le signe de a_x se lit par rapport à l’axe, et ce qui compte pour accélérer ou ralentir, c’est son signe comparé à celui de v_x.</li>
          <li>Exemple de la simulation : le palet a v_x = 4,0 m/s en M_1, 0 en M_3 et −4,0 m/s en M_5, et a_x = −2,0 m/s² en ces trois points.</li>
          <li>Moyen de s’en souvenir : <strong>« vitesse nulle un instant, accélération non nulle »</strong>. Idée fausse : « s’il est arrêté, il n’accélère pas ». Vrai : a_x = −2,0 m/s² au sommet, comme avant et après.</li>
        </Ul></>,
      texte: <>On a trouvé v_x(t) = 3,0 t + 2,0 (en m/s, t en s). De la même façon, la coordonnée a_x du vecteur accélération est la dérivée de v_x(t) : {FAx}Les vecteurs vitesse sont tracés sur la figure ; le vecteur accélération apparaîtra quand vous aurez répondu.</>,
      tache: { type: 'num', q: 'Coordonnée a_x du vecteur accélération (en m/s²)', unite: 'm/s²', vrai: 3.0, tol: 0.05, affiche: v => nbf(v, 1),
        calcul: () => ['On dérive v_x(t) = 3,0 t + 2,0 : la dérivée de 3,0 t est 3,0, celle de la constante 2,0 est 0.', 'a_x(t) = 3,0 m/s². Cette valeur ne dépend pas de t.'],
        pieges: [[2.0, 'Vous avez donné 2,0 : c’est le terme constant de v_x(t), pas sa dérivée. Le terme en t donne 3,0 et la constante donne 0.'], [8.0, 'Vous avez calculé v_x(2,0) au lieu de dériver v_x(t) une seconde fois.'], [1.5, 'Vous avez donné 1,5 : c’est le coefficient de t² dans x(t). Ici on dérive v_x(t) = 3,0 t + 2,0, pas x(t).']],
        expl: 'a_x(t) = frac(d(3,0 t + 2,0)|dt) = 3,0 m/s².', indice: 'Dérivez v_x(t) = 3,0 t + 2,0 par rapport à t : que devient 3,0 t ? et le terme constant 2,0 ?' } },
    { id: 'mrua', titre: 'Caractériser le mouvement du chariot', focus: ['scene'],
      retenirTitre: 'À RETENIR : DE LA POSITION À L’ACCÉLÉRATION',
      retenir: <>
        <SvgDeriveesCarte/>
        {FVx}{FAx}
        <Ul>
          <li>En coordonnées cartésiennes, on <strong>dérive deux fois</strong> : x(t) donne v_x(t), puis v_x(t) donne a_x(t). Même chose pour y. Règles utiles : (a t²)′ = 2 a t ; (b t)′ = b ; la dérivée d’une constante est nulle.</li>
          <li>Exemple de la simulation (voiture qui démarre) : x = 2,0 t + 0,50 t², v_x = 2,0 + 1,0 t, a_x = 1,0 m/s².</li>
          <li>Moyen de s’en souvenir : <strong>« position, vitesse, accélération : on dérive à chaque marche »</strong>. Idée fausse : « a_x = v_x divisée par t ». Vrai : a_x est la dérivée de v_x.</li>
        </Ul></>,
      texte: <>Les vecteurs vitesse et accélération du chariot sont tracés sur la figure (rail droit, x(t) = 1,5 t² + 2,0 t). Comparez les flèches d’un point à l’autre pour caractériser son mouvement.</>,
      tache: { type: 'qcm', q: 'Quel est le mouvement du chariot ?', ...Q.mrua,
        expl: 'La trajectoire est une droite (mouvement rectiligne) et vec(a) est constant et non nul, porté par cette droite : le mouvement est rectiligne uniformément accéléré. Sa vitesse change de façon régulière (v_x = 3,0 t + 2,0).',
        indice: 'La trajectoire est-elle une droite ? Le vecteur accélération change-t-il avec le temps ? Est-il nul ?' } },
    { id: 'mru', titre: 'Un chariot à vitesse constante', focus: ['scene'],
      texte: <>Un autre chariot se déplace sur un rail horizontal. Les points sont équidistants : il parcourt la même distance pendant chaque durée τ = 1,0{NB}s. Les vecteurs vitesse sont tracés : comparez-les d’un point à l’autre. Le vecteur accélération sera tracé quand vous aurez répondu.</>,
      tache: { type: 'qcm', q: 'Quel est le vecteur accélération vec(a) de ce chariot ?', ...Q.mru,
        expl: 'Le vecteur vitesse est constant : sa dérivée est nulle, donc vec(a) est nul. Le chariot n’est pas immobile pour autant : vec(v) est constant mais non nul. C’est un mouvement rectiligne uniforme.',
        indice: 'Comparez les flèches bleues d’un point à l’autre : changent-elles ? Que vaut alors la variation de vitesse entre deux points ?' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      retenirTitre: 'À RETENIR : CARACTÉRISER L’ACCÉLÉRATION',
      retenir: <>
        <SvgCaracteriserCarte/>
        <Ul>
          <li>Mouvement <strong>rectiligne</strong> : vec(a) est porté par la droite du mouvement. <strong>Rectiligne uniforme</strong> : vec(a) est nul. <strong>Rectiligne uniformément accéléré</strong> : vec(a) constant et non nul (de même sens que vec(v) si le mobile accélère, de sens opposé s’il ralentit).</li>
          <li>Exemple de la simulation : le chariot à vitesse constante a un vecteur accélération nul ; le chariot de x(t) = 1,5 t² + 2,0 t a a_x = 3,0 m/s².</li>
          <li>Moyen de s’en souvenir : <strong>« uniforme : a nul ; uniformément accéléré : a constant »</strong>. Idée fausse : « vec(a) est nul veut dire que le mobile est arrêté ». Vrai : vec(v) est constant, éventuellement non nul.</li>
        </Ul></>,
      texte: <>Vous savez passer du vecteur position au vecteur vitesse puis au vecteur accélération (par dérivation, ou de façon approchée sur une chronophotographie), les représenter, et caractériser vec(a) pour un mouvement rectiligne, rectiligne uniforme ou rectiligne uniformément accéléré. L’accélération n’est pas « aller plus vite » : ralentir, c’est aussi accélérer. Passez à l’exploration (6 mouvements, pas τ au choix) ou tentez les deux défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});
  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'chrono' ? { ...M.tirageDefiChrono(), type: 'chrono', reps: { a: '', sens: '' }, verifie: false } : { ...M.tirageDefiDerive(), type: 'derive', reps: { a: '', t: '' }, verifie: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const procheTol = (x, v, t) => isFinite(x) && Math.abs(x - v) <= t * Math.abs(v);
  const TOL = 0.06;
  const verifier = () => {
    if (defi.type === 'chrono') { const ok = procheTol(lireNombre(defi.reps.a), defi.ak, TOL) && defi.reps.sens === defi.sens; setDefi(d => ({ ...d, verifie: true, ok, essais: (d.essais || 0) + 1 })); noterC(ok); }
    else { const ok = procheTol(lireNombre(defi.reps.a), defi.a, TOL) && procheTol(lireNombre(defi.reps.t), defi.t0, TOL); setDefi(d => ({ ...d, verifie: true, ok, essais: (d.essais || 0) + 1 })); noterD(ok); }
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const champ = (cle, nom, unite, id) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{avecIndices(nom)} =</span>
      <input value={defi.reps[cle]} aria-label={nom} id={id} onKeyDown={e => e.key === 'Enter' && document.getElementById('va-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, [cle]: e.target.value }, verifie: false }))} inputMode="decimal"
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>{unite && <span>{unite}</span>}
    </div>);
  const tableauDefi = dd && dd.type === 'chrono' && (
    <table style={{ borderCollapse: 'collapse', fontSize: 14, width: '100%', fontFamily: 'monospace', marginBottom: 8 }}><tbody>
      <tr><td style={{ padding: '2px 4px', color: KIT.txt2 }}>i</td>{dd.pts.map(p => <td key={p.i} style={{ padding: '2px 3px', textAlign: 'right' }}>{p.i}</td>)}</tr>
      <tr><td style={{ padding: '2px 4px', color: KIT.txt2 }}>x{NB}(m)</td>{dd.pts.map(p => <td key={p.i} style={{ padding: '2px 3px', textAlign: 'right', fontWeight: 700 }}>{nbf(p.x, Math.abs(p.x * 10 - Math.round(p.x * 10)) < 1e-9 ? 1 : 2)}</td>)}</tr></tbody></table>);
  const solutionDefi = !defi ? '' : defi.type === 'chrono'
    ? `v_x(${defi.k - 1}) = frac(${nbf(defi.pts[defi.k].x, 2)} − ${nbf(defi.pts[defi.k - 2].x, 2)}|2 × ${nbf(defi.tau, 1)}) = ${nbf(M.vitesseApprochee(defi.pts, defi.k - 1, defi.tau).x, 2)} m/s ; v_x(${defi.k + 1}) = frac(${nbf(defi.pts[defi.k + 2].x, 2)} − ${nbf(defi.pts[defi.k].x, 2)}|2 × ${nbf(defi.tau, 1)}) = ${nbf(M.vitesseApprochee(defi.pts, defi.k + 1, defi.tau).x, 2)} m/s ; a_x(${defi.k}) = frac(v_x(${defi.k + 1}) − v_x(${defi.k - 1})|2 × ${nbf(defi.tau, 1)}) = ${nbf(defi.ak, 1)} m/s² ; v_x(${defi.k}) = ${nbf(defi.vk, 1)} m/s : ${defi.sens === 'acc' ? 'v_x et a_x ont le même signe, le mobile accélère' : defi.sens === 'ral' ? 'v_x et a_x sont de signes contraires, le mobile ralentit' : 'a_x est nul, le mobile ne fait ni l’un ni l’autre'} (marge acceptée : 6 % de la valeur).`
    : `v_x(t) = ${nbf(2 * defi.A, 1)} t ${defi.B < 0 ? '−' : '+'} ${nbf(Math.abs(defi.B), 2)} ; a_x = ${nbf(defi.a, 1)} m/s² ; v_x = 0 pour t_0 = frac(${nbf(-defi.B, 2)}|${nbf(2 * defi.A, 1)}) = ${nbf(defi.t0, 2)} s (marge acceptée : 6 % de la valeur).`;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['chrono', 'Lire a sur une chronophotographie'], ['derive', 'De x(t) à l’arrêt']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0b4f94')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'chrono' ? 'Défi : l’accélération en un point' : 'Défi : de la position à l’accélération'}</div>
      {defi.type === 'chrono' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un mobile se déplace sur l’axe Ox. On le photographie toutes les <strong>τ = {nbf(defi.tau, 1)}{NB}s</strong> : les positions x (en m) sont données dans le tableau (point n° i à la date t = i × τ). Déterminez la coordonnée <strong>a<sub>x</sub></strong> du vecteur accélération au point <strong>M<sub>{defi.k}</sub></strong> (en m/s², avec son signe, 2 chiffres significatifs ; marge acceptée : 6{NB}% de la valeur), puis dites si le mobile accélère ou ralentit en ce point.</div>
        {tableauDefi}
        {champ('a', 'a_x', 'm/s²', 'va-champ-a')}
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>{avecIndices(`En M_${defi.k}, le mobile…`)}
          <select value={defi.reps.sens} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, sens: e.target.value }, verifie: false }))} style={{ ...menu, marginTop: 2 }}>
            <option value="">Choisissez…</option>
            <option value="acc">accélère : la norme de la vitesse augmente</option>
            <option value="ral">ralentit : la norme de la vitesse diminue</option>
            <option value="cst">a une vitesse constante : ni accélère, ni ralentit</option>
          </select>
        </label>
        <IndiceDefi cache={false}>{`Estimez d’abord v_x en M_${defi.k - 1} et en M_${defi.k + 1} : v_x(i) ≈ frac(x(i+1) − x(i−1)|2τ). Puis a_x(${defi.k}) ≈ frac(v_x(${defi.k + 1}) − v_x(${defi.k - 1})|2τ). Le mobile accélère si v_x et a_x ont le même signe, il ralentit sinon. Gardez un chiffre de plus dans les calculs intermédiaires.`}</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un chariot se déplace sur un rail droit. Sa position est donnée par <strong>x(t) = {M.ecritX(defi)}</strong> (x en m, t en s). Déterminez la coordonnée <strong>a<sub>x</sub></strong> de son vecteur accélération (en m/s², avec son signe) et la <strong>date t<sub>0</sub></strong> (en s) à laquelle le chariot s’arrête un instant (v<sub>x</sub> = 0). Marge acceptée : 6{NB}% de la valeur.</div>
        {champ('a', 'a_x', 'm/s²', 'va-champ-a')}
        {champ('t', 't_0', 's', 'va-champ-t')}
        <IndiceDefi cache={false}>Dérivez x(t) pour obtenir v_x(t) : (a t²)′ = 2 a t et (b t)′ = b. Dérivez encore pour obtenir a_x. Le chariot s’arrête quand v_x(t) = 0 : résolvez cette équation d’inconnue t.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="va-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.7, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {avecIndices(defi.ok || (defi.essais || 0) >= 2
          ? (defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + solutionDefi
          : '✗ Pas tout à fait. Reprenez le calcul (l’indice peut vous aider) : la solution détaillée s’affichera après un deuxième essai.')}
      </div>}
    </div>);
  // ---------- défi : scène des positions seules (aucun vecteur : l'accélération est à trouver) ----------
  let sceneDefi = null;
  if (dd && dd.type === 'chrono') {
    const mvp = { layout: dd.pts.some((p, i) => i && p.x < dd.pts[i - 1].x) ? 'etage' : 'ligne', N: dd.pts.length - 1 }, E = M.echelles(mvp, dd.pts, dd.tau);
    sceneDefi = <SceneChrono mv={mvp} P={dd.pts} tau={dd.tau} E={E} anneaux={[dd.k]} aria={`Chronophotographie du mobile : points numérotés de 0 à ${dd.pts.length - 1}, pris toutes les ${nbf(dd.tau, 1)} secondes, sur un axe Ox gradué en mètres. Le point M${dd.k} est entouré.`}/>;
  }
  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Dérivées approchées sur des durées finies</strong> : sur une chronophotographie on ne connaît que des positions, aux dates i × τ. On approche le vecteur vitesse en M_i par la variation de position entre le point précédent et le point suivant, rapportée à 2τ : {FVitApp}puis le vecteur accélération en M_i de la même façon à partir des vecteurs vitesse : {FAccApp}C’est un choix parmi d’autres (on pourrait aussi diviser la variation de position entre deux points consécutifs par τ, ce qui donne la vitesse à la date située au milieu de l’intervalle).</li>
      <li><strong>Bords de la série</strong> : faute de point voisin de chaque côté, le vecteur vitesse n’est pas estimé en M_0 ni au dernier point, et le vecteur accélération n’est pas estimé en M_0, M_1, ni aux deux derniers points (il faut un point avant et un point après pour chaque estimation). Les cases vides du tableau et l’absence de flèche aux extrémités ne sont pas des oublis.</li>
      <li><strong>Quand est-ce exact ?</strong> Pour un mouvement dont les coordonnées sont des polynômes du second degré en t (accélération constante : démarrage, freinage, aller-retour, lancer), ces deux estimations donnent exactement la dérivée. Pour les autres mouvements (l’oscillation de l’exploration), elles sont approchées : avec τ = 1,0 s et une période de 8 s, la vitesse est sous-estimée d’environ 10 % et l’accélération d’environ 19 %. L’écart diminue quand τ diminue.</li>
      <li><strong>Pointage idéal</strong> : les positions sont exactes, sans incertitude. En pratique, le pointage a une incertitude (de l’ordre du millimètre sur l’image) ; comme l’accélération se calcule à partir de différences de différences, elle y est beaucoup plus sensible que la vitesse. Les positions sont affichées avec 2 décimales au plus, les résultats avec 2 chiffres significatifs.</li>
      <li><strong>Repère fixe</strong> : les coordonnées cartésiennes sont celles d’un repère (O ; x, y) fixe par rapport au sol, que l’on suppose lié à l’observateur ; le mobile est assimilé à un point.</li>
      <li><strong>Mouvements imposés</strong> : leurs coordonnées x(t) et y(t) sont données par des fonctions choisies. La « balle lancée » sert seulement d’exemple de coordonnées x(t) et y(t) : les causes du mouvement ne sont pas étudiées ici.</li>
      <li><strong>Lisibilité</strong> : pour un mouvement rectiligne, les vecteurs sont dessinés en rangées décalées au-dessus de la trajectoire (ils ont pour origine le point M_i) ; l’échelle des flèches est arbitraire et différente pour la vitesse et l’accélération (voir les légendes). Un vecteur nul est représenté par un petit anneau.</li>
      <li><strong>Vocabulaire</strong> : en physique, « accélérer » désigne toute variation du vecteur vitesse (augmenter ou diminuer sa norme, ou changer sa direction). Le sens courant (« aller plus vite ») n’en est qu’un cas particulier.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{indicesProfond(hypotheses)}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0b4f94')}><Pic n="target"/>Défis</button>
    </span>);
  // ---------- parcours : scène ----------
  const boxScene = enGuide && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={aide}>{caption}</div>
      {scene}
    </div>);
  // ---------- exploration ----------
  const mvE = M.MOUVEMENTS[ex.mv], tauOk = mvE.taus.includes(ex.tau) ? ex.tau : mvE.tau;
  const PE = M.chrono(mvE, tauOk), EE = M.echelles(mvE, PE, tauOk), N = mvE.N, selE = Math.min(Math.max(ex.sel, 2), N - 2);
  const setMv = id => { const m = M.MOUVEMENTS[id]; setEx(s => ({ ...s, mv: id, tau: m.tau, sel: Math.min(s.sel, m.N - 2), coord: 'x' })); };
  const vE = M.vitesseApprochee(PE, selE, tauOk), aE = M.accelerationApprochee(PE, selE, tauOk), vX = M.vitesseExacte(mvE, selE * tauOk), aX = M.accelerationExacte(mvE, selE * tauOk);
  const deux = mvE.layout === 'plan';
  const xy = (o, d = 1) => (deux ? `(${nbf(o.x, d)} ; ${nbf(o.y, d)})` : nbf(o.x, d));
  const bascule = (cle, lib) => <button key={cle} onClick={() => setEx(s => ({ ...s, [cle]: !s[cle] }))} aria-pressed={ex[cle]} style={stylePetitBouton(ex[cle], '#0b4f94')}>{ex[cle] ? '✓ ' : ''}{lib}</button>;
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Réglages de l’expérience</div>
      <div style={aide}>Choisissez un mouvement et le pas τ entre deux photos, puis déplacez le curseur pour étudier un point.</div>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Mouvement
        <select value={ex.mv} onChange={e => setMv(e.target.value)} style={{ ...menu, marginTop: 2 }}>{M.ORDRE_MOUVEMENTS.map(id => <option key={id} value={id}>{M.MOUVEMENTS[id].nom}</option>)}</select>
      </label>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Pas τ entre deux photos
        <select value={tauOk} onChange={e => setEx(s => ({ ...s, tau: Number(e.target.value) }))} style={{ ...menu, marginTop: 2 }}>{mvE.taus.map(t => <option key={t} value={t}>{nbf(t, 1)} s</option>)}</select>
      </label>
      <Curseur nom="Point étudié (numéro i)" valeur={selE} onChange={v => setEx(s => ({ ...s, sel: v }))} min={2} max={N - 2} pas={1} couleur="#c2410c"/>
      <div style={{ ...aide, marginTop: 4 }}>Vecteurs affichés sur la figure :</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{bascule('v', 'vitesse')}{bascule('a', 'accélération')}{bascule('om', 'position (OM)')}</div>
      <div style={{ ...aide, marginTop: 8, marginBottom: 0 }}>{mvE.note}</div>
    </div>);
  const boxExplore = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>{mvE.nom}</div>
      <div style={aide}>{mvE.court}. {mvE.formule}. Points pris toutes les τ = {nbf(tauOk, 1)}{NB}s ; le point n° i correspond à la date t = i × τ. Le point étudié est entouré.</div>
      <SceneChrono mv={mvE} P={PE} tau={tauOk} E={EE} montrerV={ex.v} montrerA={ex.a} om={ex.om ? selE : null} sel={selE}
        aria={`Chronophotographie : ${mvE.nom}, points de 0 à ${N} pris toutes les ${nbf(tauOk, 1)} secondes. Point étudié : ${selE}.`}/>
    </div>);
  const mesures = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>{avecIndices(`Mesures au point M_${selE}`)}</div>
      <div style={aide}>Valeurs estimées sur la chronophotographie, comparées à la dérivée exacte de la fonction x(t).</div>
      <LigneMesure nom="Date t = i × τ" valeur={`${nbf(selE * tauOk, 2)}${NB}s`}/>
      <LigneMesure nom={deux ? 'vec(OM) : (x ; y)' : 'Coordonnée x de vec(OM)'} valeur={`${xy(PE[selE], 2)}${NB}m`} couleur={COL.vert}/>
      <LigneMesure nom={deux ? 'vec(v) estimé : (v_x ; v_y)' : 'Coordonnée v_x estimée'} valeur={`${xy(vE, 2)}${NB}m/s`} couleur={COL.bleu}/>
      <LigneMesure nom={deux ? 'vec(v) exact (dérivée)' : 'Coordonnée v_x exacte (dérivée)'} valeur={`${xy(vX, 2)}${NB}m/s`}/>
      <LigneMesure nom="Norme v estimée" valeur={`${nbf(M.norme(vE), 2)}${NB}m/s`}/>
      <LigneMesure nom={deux ? 'vec(a) estimé : (a_x ; a_y)' : 'Coordonnée a_x estimée'} valeur={`${xy(aE, 2)}${NB}m/s²`} couleur={COL.orange}/>
      <LigneMesure nom={deux ? 'vec(a) exact (dérivée)' : 'Coordonnée a_x exacte (dérivée)'} valeur={`${xy(aX, 2)}${NB}m/s²`}/>
      {mvE.approx && <div style={{ fontSize: 13.5, color: '#b45309', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 6, padding: '4px 8px', marginTop: 4 }}>Ici x(t) n’est pas un polynôme du second degré : l’estimation s’écarte de la dérivée exacte, d’autant plus que τ est grand. Essayez τ = 0,5 s.</div>}
    </div>);
  const tableau = enExplore && (
    <Section titre="Tableau des positions, vitesses et accélérations estimées" ouvert={ouv.tableau} onBascule={() => setOuv(o => ({ ...o, tableau: !o.tableau }))}>
      <div style={aide}>Chaque ligne est un point de la chronophotographie. Les cases vides ne peuvent pas être estimées (il faut un point avant et un point après).</div>
      <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%', fontFamily: 'monospace' }}><thead><tr style={{ color: KIT.txt2 }}>
        <th style={{ textAlign: 'right', padding: '2px 3px' }}>i</th>{deux && <th style={{ textAlign: 'right', padding: '2px 3px' }}>x</th>}{!deux && <th style={{ textAlign: 'right', padding: '2px 3px' }}>t</th>}<th style={{ textAlign: 'right', padding: '2px 3px' }}>{deux ? 'y' : 'x'}</th><th style={{ textAlign: 'right', padding: '2px 3px' }}>v<sub>x</sub></th>{deux && <th style={{ textAlign: 'right', padding: '2px 3px' }}>v<sub>y</sub></th>}<th style={{ textAlign: 'right', padding: '2px 3px' }}>a<sub>x</sub></th>{deux && <th style={{ textAlign: 'right', padding: '2px 3px' }}>a<sub>y</sub></th>}</tr></thead>
        <tbody>{PE.map(p => { const v = M.vitesseApprochee(PE, p.i, tauOk), a = M.accelerationApprochee(PE, p.i, tauOk), c = (o, k) => (o ? nbf(o[k], 2) : '');
          return <tr key={p.i} style={{ background: p.i === selE ? '#fff7ed' : undefined }}><td style={{ textAlign: 'right', padding: '2px 3px' }}>{p.i}</td>{deux && <td style={{ textAlign: 'right', padding: '2px 3px' }}>{nbf(p.x, 2)}</td>}{!deux && <td style={{ textAlign: 'right', padding: '2px 3px' }}>{nbf(p.t, 1)}</td>}<td style={{ textAlign: 'right', padding: '2px 3px' }}>{nbf(deux ? p.y : p.x, 2)}</td><td style={{ textAlign: 'right', padding: '2px 3px' }}>{c(v, 'x')}</td>{deux && <td style={{ textAlign: 'right', padding: '2px 3px' }}>{c(v, 'y')}</td>}<td style={{ textAlign: 'right', padding: '2px 3px' }}>{c(a, 'x')}</td>{deux && <td style={{ textAlign: 'right', padding: '2px 3px' }}>{c(a, 'y')}</td>}</tr>; })}</tbody></table>
    </Section>);
  const graphes = enExplore && (
    <Section titre={<>Graphes de x, v<sub>x</sub> et a<sub>x</sub> en fonction du temps</>} ouvert={ouv.graphes} onBascule={() => setOuv(o => ({ ...o, graphes: !o.graphes }))}>
      <div style={aide}>Trait gris : fonction exacte. Points : valeurs estimées sur la chronophotographie (le point étudié est en orange). La vitesse est la pente de la courbe du dessus, l’accélération est la pente de celle du milieu.</div>
      {deux && <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Coordonnée tracée
        <select value={ex.coord} onChange={e => setEx(s => ({ ...s, coord: e.target.value }))} style={{ ...menu, marginTop: 2 }}><option value="x">x (horizontale)</option><option value="y">y (verticale)</option></select></label>}
      <GraphesVA mv={mvE} P={PE} tau={tauOk} coord={ex.coord} sel={selE}/>
    </Section>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Voiture qui freine : les points se rapprochent. Comparez le sens du vecteur vitesse et celui du vecteur accélération : que vaut le signe de a_x ?</li>
        <li>Aller-retour : à quel point le vecteur vitesse est-il nul ? Que vaut l’accélération en ce point ? Et juste avant, juste après ?</li>
        <li>Chariot à vitesse constante : que vaut l’accélération ? Pourquoi les flèches d’accélération sont-elles remplacées par de petits anneaux ?</li>
        <li>Balle lancée : tracez le graphe de x puis de y. Quelle coordonnée de l’accélération est nulle ? Laquelle ne l’est pas ?</li>
        <li>Oscillation : comparez les valeurs estimées et exactes pour τ = 2,0 s puis τ = 0,5 s. Que se passe-t-il quand τ diminue ?</li>
      </ul>
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Le vecteur position vec(OM) va de l’origine O au point M ; ses coordonnées sont celles de M</li>
          <li>Le vecteur vitesse est la dérivée du vecteur position : <FormuleEnLigne>{vm('v')}<mo>=</mo><mfrac><mrow><mi mathvariant="normal">d</mi>{om}</mrow>{dt}</mfrac></FormuleEnLigne> ; sur une chronophotographie, on divise la variation de position entre le point précédent et le point suivant par 2τ</li>
          <li>Le vecteur accélération est la dérivée du vecteur vitesse : <FormuleEnLigne>{vm('a')}<mo>=</mo><mfrac><mrow><mi mathvariant="normal">d</mi>{vm('v')}</mrow>{dt}</mfrac></FormuleEnLigne> ; il a le sens de la variation vec(Δv)</li>
          <li>En coordonnées : <FormuleEnLigne><msub><mi>v</mi><mi>x</mi></msub><mo>=</mo><mfrac><mrow><mi mathvariant="normal">d</mi><mi>x</mi></mrow>{dt}</mfrac></FormuleEnLigne> et <FormuleEnLigne><msub><mi>a</mi><mi>x</mi></msub><mo>=</mo><mfrac><mrow><mi mathvariant="normal">d</mi><msub><mi>v</mi><mi>x</mi></msub></mrow>{dt}</mfrac></FormuleEnLigne> (et de même pour y)</li>
          <li>a_x et v_x de même signe : la vitesse augmente ; de signes contraires : elle diminue (ralentir, c’est accélérer au sens de la physique)</li>
          <li>Rectiligne uniforme : vec(a) est nul ; rectiligne uniformément accéléré : vec(a) constant et non nul</li>
        </ul>
      </ARetenir>
    </Section>);
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .va-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .va-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .va-col { display: flex; flex-direction: column; gap: 12px; }
        .va-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .va-l1.cote .va-carte { order: 2; } .va-l1.cote .va-main { order: 1; }
          .va-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .va-ex > * { grid-column: 1; } .va-ex > .va-ctrl { grid-column: 2; grid-row: 1 / span 6; } }
        @media (max-width: 900px) { .va-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .va-in { animation: va-fondu 0.35s ease-out; } @keyframes va-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Vecteurs position, vitesse et accélération</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>De la <strong>chronophotographie</strong> aux <strong>dérivées</strong> : le vecteur vitesse est la dérivée du vecteur position, le vecteur accélération est la dérivée du vecteur vitesse.</div>
      {!enExplore && <div className="va-l1 cote">
        {enGuide ? <div className="va-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="va-carte">{panneauHypo}</div> : null}
        <div className="va-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'chrono' ? suiviC : suiviD}/></div>}
          {dd && dd.type === 'chrono' && <div className="va-col"><div style={styleBoite}>{sceneDefi}</div></div>}
          {enGuide && <div className="va-col"><div className="va-in" key={idx >= 0 ? SCENARIO[idx] : ''}>{boxScene}</div></div>}
        </div>
      </div>}
      {enExplore && <div className="va-ex">
        <div>{boxExplore}</div>
        <div className="va-ctrl">{reglages}</div>
        <div>{mesures}</div>
        <div>{tableau}</div>
        <div>{graphes}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && idx >= IDS.indexOf('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
