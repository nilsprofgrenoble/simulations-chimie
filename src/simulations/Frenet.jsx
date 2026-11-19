import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect, useRef } from "react";
import { Formule, FormuleEnLigne, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, LigneMesure, IndiceDefi, Curseur, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./frenetModele";
import { QCM_PARCOURS as Q } from "./frenetQcm";
import { SceneFrenet, SvgRepereCarte, SvgVitesseCarte, SvgIdeeFausseCarte, SvgCentripeteCarte, SvgComposantesCarte, SvgSensCarte } from "./frenetSchemas";

const SIM_ID = 167, CLE_GUIDE = 'frenet-tg-guide-v1';
declarerDefis(SIM_ID, [['vitesse', 'Régler la vitesse pour une accélération donnée'], ['norme', 'Norme de l’accélération dans un virage']]);

// ====================================================
// SIM 167 — MOUVEMENT CIRCULAIRE : LE REPÈRE DE FRENET, VITESSE ET ACCÉLÉRATION
//  (TG spé PC, « Mouvement et interactions », partie « Décrire un mouvement »).
//  Une seule idée : citer et exploiter les expressions des coordonnées de vec(v) et de vec(a) dans le repère de Frenet pour un mouvement circulaire :
//    vec(v) = v · vec(u)_t ;  vec(a) = (dv/dt) · vec(u)_t + (v²/R) · vec(u)_n. Caractériser vec(a) pour un mouvement circulaire et circulaire uniforme.
//  Capacités visées (jamais affichées à l'élève) : citer et exploiter les expressions des coordonnées des vecteurs vitesse et accélération dans le repère
//  de Frenet pour un mouvement circulaire ; caractériser le vecteur accélération pour un mouvement circulaire et circulaire uniforme.
//  Hors périmètre : mouvement rectiligne et coordonnées cartésiennes (sim 166), deuxième loi de Newton (sim 168), mouvement des satellites (plus tard).
//  Modèle de calcul : frenetModele.js.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const rad = d => d * Math.PI / 180;
const IDS = ['repere', 'vitesse', 'pred', 'formule', 'uniforme', 'rayon', 'acc', 'noncirc', 'ralenti', 'satellite', 'bilan'];
const BLEU = '#0369a1';
// valeurs de départ de chaque étape du parcours (R en m, v en m/s, dv/dt en m/s²) ; un curseur ne modifie que l'étape en cours
const PRESETS = [
  { R: 2, v: 3, at: 0 }, { R: 2, v: 3, at: 0 }, { R: 2, v: 3, at: 0 }, { R: 2, v: 3, at: 0 }, { R: 2, v: 3, at: 0 }, { R: 2, v: 3, at: 0 },
  { R: 2, v: 2, at: 2 }, { R: 1.5, v: 3, at: 4 }, { R: 2, v: 3, at: -2 }, { R: 2, v: 3, at: 0 }, { R: 2, v: 3, at: 1.5 },
];

// ---------- formules (MathML), avec flèche sur chaque vecteur ----------
const vv = l => <mover><mi>{l}</mi><mo stretchy="false">→</mo></mover>;
const vi = (l, i) => <msub><mover><mi>{l}</mi><mo stretchy="false">→</mo></mover><mi>{i}</mi></msub>;
const dvdt = <mfrac><mrow><mi>d</mi><mi>v</mi></mrow><mrow><mi>d</mi><mi>t</mi></mrow></mfrac>;
const v2R = <mfrac><msup><mi>v</mi><mn>2</mn></msup><mi>R</mi></mfrac>;
const FVit = <Formule>{vv('v')}<mo>=</mo><mi>v</mi><mo>×</mo>{vi('u', 't')}</Formule>;
const FAcc = <Formule>{vv('a')}<mo>=</mo>{dvdt}<mo>×</mo>{vi('u', 't')}<mo>+</mo>{v2R}<mo>×</mo>{vi('u', 'n')}</Formule>;
const FCoord = <Formule><msub><mi>a</mi><mi>t</mi></msub><mo>=</mo>{dvdt}<mspace width="1.5em"/><msub><mi>a</mi><mi>n</mi></msub><mo>=</mo>{v2R}</Formule>;
const FNorme = <Formule><mi>a</mi><mo>=</mo><msqrt><msubsup><mi>a</mi><mi>t</mi><mn>2</mn></msubsup><mo>+</mo><msubsup><mi>a</mi><mi>n</mi><mn>2</mn></msubsup></msqrt></Formule>;
const FUnif = <Formule><mi>a</mi><mo>=</mo>{v2R}<mspace width="1.2em"/><mtext>(v constante : </mtext><msub><mi>a</mi><mi>t</mi></msub><mo>=</mo><mn>0</mn><mtext>)</mtext></Formule>;
const racine = (x, y) => <FormuleEnLigne><mi>a</mi><mo>=</mo><msqrt><msubsup><mi>a</mi><mi>t</mi><mn>2</mn></msubsup><mo>+</mo><msubsup><mi>a</mi><mi>n</mi><mn>2</mn></msubsup></msqrt><mo>=</mo><msqrt><msup><mn>{x}</mn><mn>2</mn></msup><mo>+</mo><msup><mn>{y}</mn><mn>2</mn></msup></msqrt></FormuleEnLigne>;
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };

export function SimulationFrenet() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviV, noterV] = useCompteurDefi(), [suiviN, noterN] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('vitesse');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ reglages: false, essayer: false, retenir: false });
  const [thG, setThG] = useState(rad(40)), [ovG, setOvG] = useState({});           // parcours : position de M et réglages modifiés par étape
  const [ex, setEx] = useState({ R: 2, v: 2, v0: 2, at: 0, th: rad(40), aff: 'va' });   // exploration
  const [thD, setThD] = useState(rad(40));                                           // défi : position de M
  const [joue, setJoue] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;

  // ---------- étapes du parcours ----------
  const etape = guide.etape, idx = enGuide ? Math.min(etape, IDS.length - 1) : -1;
  const apres = id => !enGuide || etape > IDS.indexOf(id), deja = id => !enGuide || etape >= IDS.indexOf(id);

  // ---------- paramètres affichés dans la scène ----------
  const PG = { ...PRESETS[Math.max(idx, 0)], ...(ovG[idx] || {}) };
  // exploration : aux bornes de la vitesse (0 ou V_MAX), la variation de vitesse effective est nulle (le modèle bloque v), et un message l'explique
  let limite = null;
  if (enExplore) { if (ex.at > 0 && ex.v >= M.V_MAX - 1e-9) limite = 'max'; else if (ex.at < 0 && ex.v <= 1e-9) limite = 'arret'; }
  let P;                                                      // { R, v, at, th }
  if (enGuide) P = { ...PG, th: thG };
  else if (dd) P = { R: dd.R, v: dd.v, at: dd.type === 'norme' ? dd.at : 0, th: thD };
  else P = { R: ex.R, v: ex.v, at: limite ? 0 : ex.at, th: ex.th };

  // ---------- animation : M avance sur le cercle (en exploration, v varie aussi avec dv/dt) ----------
  const tickRef = useRef(null);
  useEffect(() => {
    tickRef.current = dt => {
      if (enExplore) setEx(s => { const r = M.pas({ theta: s.th, v: s.v }, s.R, s.at, dt); return { ...s, th: r.theta, v: r.v }; });
      else if (enGuide) setThG(t => (t + P.v / P.R * dt) % (2 * Math.PI));
      else setThD(t => (t + P.v / P.R * dt) % (2 * Math.PI));
    };
  });
  useEffect(() => {
    if (!joue) return undefined;
    let raf, t0 = null;
    const boucle = t => { if (t0 !== null) tickRef.current(Math.min(0.05, (t - t0) / 1000)); t0 = t; raf = requestAnimationFrame(boucle); };
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, [joue]);
  const reduit = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lancer = () => {
    if (reduit) { const d = rad(30); if (enExplore) setEx(s => ({ ...s, th: (s.th + d) % (2 * Math.PI) })); else if (enGuide) setThG(t => (t + d) % (2 * Math.PI)); else setThD(t => (t + d) % (2 * Math.PI)); return; }
    setJoue(j => !j);
  };
  const changerMode = md => { setJoue(false); setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };

  // ---------- étapes ----------
  const aStep4 = M.normeAcc(3, 2, 0), aStep8 = M.normeAcc(3, 1.5, 4), aSat = M.an(7.5e3, 7.0e6);
  const ETAPES = [
    { id: 'repere', titre: 'Un repère qui suit le point', focus: ['scene', 'curseurs'],
      texte: <>Un point M décrit un cercle de centre O et de rayon R, dans le sens indiqué. Pour décrire son mouvement, on utilise en chaque point le <strong>repère de Frenet</strong> : vec(u)_t est tangent au cercle, dans le sens du mouvement ; vec(u)_n est perpendiculaire à la tangente, dirigé vers le centre O. Les deux vecteurs sont unitaires. Déplacez le curseur pour faire avancer M sur le cercle.</>,
      tache: { type: 'qcm', q: 'Quand M avance sur le cercle, que devient la direction du vecteur vec(u)_t ?', ...Q.repere,
        expl: 'Le repère de Frenet est défini en chaque point de la trajectoire : vec(u)_t reste tangent au cercle, donc sa direction change quand M avance. C’est un repère qui suit le point, pas un repère fixe.',
        indice: 'Regardez la flèche bleue tangente au cercle quand vous déplacez M : pointe-t-elle toujours dans la même direction de la page ?' } },
    { id: 'vitesse', titre: 'Le vecteur vitesse dans ce repère', focus: ['scene'],
      retenirTitre: 'À RETENIR : LE REPÈRE DE FRENET',
      retenir: <>
        <SvgRepereCarte/>
        <ul style={ULS}>
          <li>Le <strong>repère de Frenet</strong> est attaché au point M : <strong>vec(u)_t</strong> est tangent à la trajectoire, dans le sens du mouvement ; <strong>vec(u)_n</strong> est normal, dirigé vers le centre du cercle. Il tourne avec M.</li>
          <li>Exemple de la simulation : sur un cercle, vec(u)_n pointe vers O depuis tous les points ; vec(u)_t, lui, est tangent au cercle en chaque point, sa direction est donc différente en chaque point.</li>
          <li>Moyen de s’en souvenir : <strong>« t comme tangent, n comme normal, vers le centre »</strong>. Idée fausse : « le repère de Frenet est fixe, comme (x ; y) ». Vrai : il se déplace et tourne avec le point.</li>
        </ul></>,
      texte: <>La flèche verte épaisse est le vecteur vitesse vec(v) de M ; sa norme vaut v = 3,0{NB}m/s. Déplacez M sur le cercle et observez cette flèche par rapport aux flèches bleues.</>,
      tache: { type: 'qcm', q: 'Quelles sont les coordonnées de vec(v) dans le repère de Frenet (vec(u)_t ; vec(u)_n) ?', ...Q.vitesse,
        expl: 'vec(v) est tangent à la trajectoire : il est porté par vec(u)_t, donc sa coordonnée sur vec(u)_n est nulle. Sa coordonnée sur vec(u)_t est sa norme v : vec(v) = v × vec(u)_t.',
        indice: 'La flèche verte est-elle dans la direction de vec(u)_t, de vec(u)_n, ou entre les deux ?' } },
    { id: 'pred', titre: 'Vitesse de norme constante : accélération nulle ?', focus: ['scene', 'lecture'],
      retenirTitre: 'À RETENIR : LA VITESSE EST TANGENTE',
      retenir: <>
        <SvgVitesseCarte/>
        <ul style={ULS}>
          <li>Le vecteur vitesse est <strong>toujours tangent</strong> à la trajectoire, dans le sens du mouvement : {FVit}où v est la norme de la vitesse (en m/s).</li>
          <li>Ses coordonnées dans le repère de Frenet sont donc (v ; 0) : tout sur vec(u)_t, rien sur vec(u)_n.</li>
          <li>Moyen de s’en souvenir : <strong>« la vitesse n’a qu’une coordonnée, sur la tangente »</strong>. Idée fausse : « la vitesse a une coordonnée vers le centre ». Vrai : vers le centre, c’est l’accélération.</li>
        </ul></>,
      texte: <>M tourne maintenant à vitesse de norme constante, v = 3,0{NB}m/s, sur un cercle de rayon R = 2,0{NB}m : c’est un <strong>mouvement circulaire uniforme</strong>. Lancez le mouvement et observez la flèche verte.</>,
      tache: { type: 'qcm', q: 'La norme de la vitesse reste constante. L’accélération de M est-elle nulle ?', ...Q.pred,
        expl: 'L’accélération mesure la variation du vecteur vitesse, pas seulement de sa norme. Ici la direction de vec(v) change à chaque instant : vec(v) varie, donc l’accélération n’est pas nulle, même si v est constante.',
        indice: 'Comparez la flèche verte à deux instants différents : est-ce le même vecteur (même longueur et même direction) ?' } },
    { id: 'formule', titre: 'Les coordonnées de l’accélération', focus: ['scene', 'mesures'],
      retenirTitre: 'À RETENIR : VITESSE CONSTANTE, ACCÉLÉRATION NON NULLE',
      retenir: <>
        <SvgIdeeFausseCarte/>
        <ul style={ULS}>
          <li>L’accélération décrit la variation du <strong>vecteur</strong> vitesse : si sa <strong>direction</strong> change, il y a une accélération, même quand la norme v est constante.</li>
          <li>Exemple de la simulation : v = 3,0 m/s constante sur un cercle, mais vec(v) change de direction à chaque instant : l’accélération n’est pas nulle.</li>
          <li>Moyen de s’en souvenir : <strong>« la vitesse est un vecteur : si elle tourne, elle varie »</strong>. Idée fausse : « v constante, donc a = 0 ». Vrai : a = 0 seulement si vec(v) est constant (norme ET direction).</li>
        </ul></>,
      texte: <>Le vecteur accélération vec(a) apparaît sur le schéma (flèche rouge). Pour un mouvement circulaire, on <strong>cite</strong> ses coordonnées dans le repère de Frenet : {FAcc}c’est-à-dire a_t = frac(dv|dt) sur vec(u)_t et a_n = frac(v²|R) sur vec(u)_n. Ici frac(dv|dt) = 0 (v est constante), v = 3,0{NB}m/s et R = 2,0{NB}m.</>,
      tache: { type: 'num', q: 'Norme a de l’accélération, en m/s²', unite: 'm/s²', vrai: aStep4, tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['frac(dv|dt) = 0 : la coordonnée tangentielle est nulle, a_t = 0.', 'a_n = frac(v²|R) = frac(3,0²|2,0) = frac(9,0|2,0) = 4,5 m/s², donc a = 4,5 m/s² (la norme est celle de la seule coordonnée non nulle).'],
        pieges: [[3 / 2, 'Vous avez calculé v divisée par R : il faut v au carré, divisée par R.'], [9 * 2, 'Le rayon R est au dénominateur : a = v² divisée par R, pas multipliée.'], [9 / 4, 'Il n’y a pas de facteur 2 : a = v² divisée par R, pas par 2R.'], [9, 'Vous avez oublié de diviser par le rayon R.']],
        expl: 'a = a_n = frac(v²|R) = frac(9,0|2,0) = 4,5 m/s².', indice: 'Ici frac(dv|dt) = 0, donc il ne reste que la coordonnée sur vec(u)_n : a = v² divisée par R, avec v en m/s et R en m.' } },
    { id: 'uniforme', titre: 'Direction de l’accélération au fil du mouvement', focus: ['scene', 'curseurs'],
      texte: <>Les Mesures sont apparues. Faites avancer M (curseur de position ou bouton de lecture) et regardez la flèche rouge vec(a) en plusieurs points du cercle : sa longueur, puis sa direction par rapport au centre O.</>,
      tache: { type: 'qcm', q: 'Pour un mouvement circulaire uniforme, quelle affirmation sur le vecteur vec(a) est exacte ?', ...Q.uniforme,
        expl: 'Quand frac(dv|dt) = 0, vec(a) = (frac(v²|R)) × vec(u)_n : sa norme frac(v²|R) est constante (v et R ne changent pas) et il est dirigé vers le centre. Sa direction, elle, change puisque vec(u)_n tourne avec M : vec(a) n’est donc pas un vecteur constant.',
        indice: 'Avec frac(dv|dt) = 0, il ne reste que le terme porté par vec(u)_n. Dans quelle direction pointe vec(u)_n, et sa direction change-t-elle avec M ?' } },
    { id: 'rayon', titre: 'Rôle de la vitesse et du rayon', focus: ['curseurs', 'mesures'],
      retenirTitre: 'À RETENIR : CIRCULAIRE UNIFORME, ACCÉLÉRATION CENTRIPÈTE',
      retenir: <>
        <SvgCentripeteCarte/>
        <ul style={ULS}>
          <li>Mouvement <strong>circulaire uniforme</strong> : vec(a) est dirigé <strong>vers le centre</strong> (accélération centripète), sa norme est constante : {FUnif}Sa direction change avec M.</li>
          <li>Exemple de la simulation : v = 3,0 m/s, R = 2,0 m donne a constante en norme, en tout point du cercle, mais vec(a) tourne avec M.</li>
          <li>Moyen de s’en souvenir : <strong>« uniforme, mais jamais sans accélération : a pointe toujours vers le centre »</strong>. Idée fausse : « a est tangent, dans le sens du mouvement ». Vrai : a est perpendiculaire à vec(v).</li>
        </ul></>,
      texte: <>Un curseur permet maintenant de changer la vitesse de M sur le même cercle (R = 2,0{NB}m). Essayez, en regardant la ligne « a » des Mesures, puis répondez.</>,
      tache: { type: 'qcm', q: 'On double la vitesse v sans changer le rayon. Que devient la norme de l’accélération ?', ...Q.rayon,
        expl: 'a = frac(v²|R) : si v est multipliée par 2, v² est multipliée par 4, donc a aussi (R inchangé). Par exemple, v = 1,5 m/s donne 1,1 m/s² et v = 3,0 m/s donne 4,5 m/s² pour R = 2,0 m.',
        indice: 'Dans a = v² divisée par R, remplacez v par 2v et comparez avec la valeur de départ.' } },
    { id: 'acc', titre: 'Quand la valeur de la vitesse change', focus: ['scene', 'curseurs'],
      texte: <>Jusqu’ici la valeur de la vitesse était constante. Maintenant, le point <strong>accélère</strong> : la norme de vec(v) augmente au cours du mouvement. Lancez le mouvement et regardez la flèche rouge vec(a) par rapport aux flèches bleues vec(u)_t et vec(u)_n.</>,
      tache: { type: 'qcm', q: 'Le point accélère : la norme de vec(v) augmente. Que dire de la coordonnée a_t de vec(a) ?', ...Q.acc,
        expl: 'a_t = frac(dv|dt) : si la norme de vec(v) augmente, frac(dv|dt) est positive, donc la composante tangentielle est dans le sens de vec(u)_t (sens du mouvement). vec(a) penche alors vers l’avant, tout en pointant vers l’intérieur du cercle à cause de a_n.',
        indice: 'a_t est égale à frac(dv|dt), la variation de la norme de la vitesse : quel est son signe quand la vitesse augmente ?' } },
    { id: 'noncirc', titre: 'Norme de l’accélération dans un mouvement non uniforme', focus: ['scene'],
      retenirTitre: 'À RETENIR : LES DEUX COORDONNÉES DE L’ACCÉLÉRATION',
      retenir: <>
        <SvgComposantesCarte/>
        <ul style={ULS}>
          <li>Mouvement circulaire : {FAcc}<strong>a_t = frac(dv|dt)</strong> change la valeur de la vitesse (a_t &gt; 0 quand le point accélère) ; <strong>a_n = frac(v²|R)</strong> change sa direction. Les deux coordonnées sont perpendiculaires : {FNorme}</li>
          <li>Exemple de la simulation : a_t = 3,0 m/s² et a_n = 4,0 m/s² donnent a = 5,0 m/s² (et non 7,0 m/s² : on n’additionne pas les coordonnées).</li>
          <li>Moyen de s’en souvenir : <strong>« tangente : la valeur de v ; normale : la direction de v »</strong>. Idée fausse : « a = a_t + a_n ». Vrai : a est la diagonale du rectangle formé par les deux coordonnées.</li>
        </ul></>,
      texte: <>M décrit un cercle de rayon R = 1,5{NB}m ; à l’instant étudié, v = 3,0{NB}m/s et frac(dv|dt) = 4,0{NB}m/s² (M accélère). Les deux coordonnées de vec(a) sont perpendiculaires, donc sa norme est : {FNorme}</>,
      tache: { type: 'num', q: 'Norme a de l’accélération, en m/s² (2 chiffres significatifs)', unite: 'm/s²', vrai: aStep8, tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['a_t = frac(dv|dt) = 4,0 m/s².', 'a_n = frac(v²|R) = frac(3,0²|1,5) = 6,0 m/s².', <>{racine('4,0', '6,0')} = √52 = {nbf(aStep8, 2)}{NB}m/s², soit 7,2{NB}m/s².</>],
        pieges: [[10, 'Vous avez additionné les deux coordonnées : elles sont perpendiculaires, on utilise la racine de la somme des carrés.'], [6, 'C’est la seule coordonnée normale a_n : il manque la contribution de a_t.'], [4, 'C’est la seule coordonnée tangentielle a_t : il manque la contribution de a_n = frac(v²|R).'], [Math.sqrt(10), 'Vous avez oublié les carrés sous la racine : il faut a_t au carré plus a_n au carré.'], [Math.sqrt(16 + 4), 'La coordonnée normale est frac(v²|R) = 6,0 m/s², pas v/R.']],
        expl: `a_t = 4,0 ; a_n = frac(3,0²|1,5) = 6,0 ; a = √(16 + 36) = ${nbf(aStep8, 2)} m/s² ≈ 7,2 m/s².`, indice: 'Calculez d’abord a_n = v² divisée par R, puis la norme avec les deux coordonnées perpendiculaires : racine de a_t au carré plus a_n au carré.' } },
    { id: 'ralenti', titre: 'Quand le point freine', focus: ['scene', 'curseurs'],
      texte: <>Maintenant, le point <strong>freine</strong> : la norme de vec(v) diminue au cours du mouvement (v = 3,0{NB}m/s et R = 2,0{NB}m à l’instant étudié). Lancez le mouvement et regardez la flèche rouge vec(a) par rapport aux flèches bleues.</>,
      tache: { type: 'qcm', q: 'Le point freine : la norme de vec(v) diminue. Que deviennent les coordonnées de vec(a) ?', ...Q.ralenti,
        expl: 'a_t = frac(dv|dt) est négative : la composante tangentielle est dirigée dans le sens opposé au mouvement. En revanche a_n = frac(v²|R) reste positive tant que v n’est pas nulle : vec(a) pointe toujours vers l’intérieur du cercle, mais penché vers l’arrière.',
        indice: 'a_t est frac(dv|dt) : quel est son signe quand la vitesse diminue ? Et a_n = frac(v²|R) peut-elle être négative ?' } },
    { id: 'satellite', titre: 'Un exemple : un satellite en orbite circulaire', focus: ['scene'],
      retenirTitre: 'À RETENIR : ACCÉLÉRÉ OU RALENTI ?',
      retenir: <>
        <SvgSensCarte/>
        <ul style={ULS}>
          <li>Le <strong>signe de frac(dv|dt)</strong> donne le sens de a_t : même sens que vec(v) si le point accélère (frac(dv|dt) &gt; 0), sens opposé s’il ralentit (frac(dv|dt) &lt; 0). La coordonnée <strong>a_n = frac(v²|R) reste positive</strong> : vers le centre.</li>
          <li>Exemple de la simulation : frac(dv|dt) = +2,0 m/s² ou −2,0 m/s², avec v = 3,0 m/s et R = 2,0 m : a_n vaut 4,5 m/s² dans les deux cas.</li>
          <li>Moyen de s’en souvenir : <strong>« freiner ou accélérer ne change que a_t ; vers le centre, a_n reste »</strong>. Idée fausse : « si le point freine, a pointe vers l’arrière ». Vrai : a_n pointe toujours vers le centre, seule a_t s’inverse.</li>
        </ul></>,
      texte: <>Un satellite artificiel décrit autour de la Terre un cercle de rayon R = 7,0×10⁶{NB}m, à vitesse de norme constante v = 7,5{NB}km/s (mouvement circulaire uniforme). Le schéma est qualitatif : les valeurs sont celles du satellite, pas celles du dessin.</>,
      tache: { type: 'num', q: 'Norme a de l’accélération du satellite, en m/s² (2 chiffres significatifs)', unite: 'm/s²', vrai: aSat, tol: 0.05, affiche: v => nbf(v, 2), cs: 2,
        calcul: () => ['Le mouvement est uniforme : frac(dv|dt) = 0, donc a = a_n = frac(v²|R).', 'Conversion : v = 7,5 km/s = 7,5×10³ m/s.', `a = frac((7,5×10³)²|7,0×10⁶) = frac(5,6×10⁷|7,0×10⁶) = ${nbf(aSat, 2)} m/s², soit 8,0 m/s².`],
        pieges: [[7.5 ** 2 / 7.0e6, 'Vous avez gardé v en km/s : convertissez-la en m/s (7,5 km/s = 7,5×10³ m/s) avant de calculer.'], [7.5e3 / 7.0e6, 'Il faut v au carré, divisée par R : v/R n’est pas une accélération.'], [(7.5e3) ** 2 / (2 * 7.0e6), 'Il n’y a pas de facteur 2 : a = v² divisée par R.'], [(7.5e3) ** 2 * 7.0e6, 'Le rayon R est au dénominateur : a = v² divisée par R.']],
        expl: `a = frac(v²|R) = frac((7,5×10³)²|7,0×10⁶) = ${nbf(aSat, 2)} m/s² ≈ 8,0 m/s².`, indice: 'Mouvement uniforme : a = v² divisée par R. Convertissez d’abord v en m/s (1 km/s = 1 000 m/s), R est déjà en m.' } },
    { id: 'bilan', titre: 'Bilan', focus: [],
      texte: <>Vous savez citer et utiliser, dans le repère de Frenet, les coordonnées de la vitesse (v ; 0) et de l’accélération (frac(dv|dt) ; frac(v²|R)) pour un mouvement circulaire ; caractériser le mouvement circulaire uniforme (a non nulle, centripète, de norme frac(v²|R)) et distinguer mouvement accéléré et ralenti. Passez à l’exploration (vitesse, rayon et frac(dv|dt) réglables) ou tentez les deux défis.</>, tache: null },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'vitesse') { const t = M.tirageDefiVitesse(); setDefi({ type, ...t, v: 1.0, rep: '', verifie: false }); }
    else { const t = M.tirageDefiNorme(); setDefi({ type, ...t, rep: '', verifie: false }); }
    setThD(rad(40)); setJoue(false);
  };
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const procheTol = (x, v, t) => isFinite(x) && Math.abs(x - v) <= t * v;
  const verifier = () => {
    if (defi.type === 'vitesse') { const ok = M.defiVitesseReussi(defi, defi.v); setDefi(d => ({ ...d, verifie: true, ok, essais: ok ? d.essais : (d.essais || 0) + 1 })); noterV(ok); }
    else { const ok = procheTol(lireNombre(defi.rep), defi.norme, 0.06); setDefi(d => ({ ...d, verifie: true, ok, essais: ok ? d.essais : (d.essais || 0) + 1 })); noterN(ok); }
  };
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['vitesse', 'Régler la vitesse'], ['norme', 'Norme de l’accélération']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, BLEU)}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'vitesse' ? 'Défi : quelle vitesse pour cette accélération ?' : 'Défi : quelle est la norme de l’accélération ?'}</div>
      {defi.type === 'vitesse' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un point M décrit un cercle de rayon <strong>R = {nbf(defi.R, 1)}{NB}m</strong> à vitesse de norme constante. Réglez sa vitesse pour que la norme de son accélération soit égale à <strong>a = {nbf(defi.aCible, 1)}{NB}m/s²</strong> (marge acceptée : 5{NB}% sur a).</div>
        <Curseur nom="Vitesse v" valeur={defi.v} onChange={x => setDefi(d => ({ ...d, v: x, verifie: false }))} min={0.5} max={6} pas={M.PAS_V} unite="m/s" decimales={2} couleur="#15803d"/>
        <IndiceDefi cache={false}>Pour un mouvement circulaire uniforme, a = v² divisée par R. Isolez v : v = √(a × R), avec a en m/s² et R en m ; v sort en m/s.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Dans un virage circulaire de rayon <strong>R = {nbf(defi.R, 1)}{NB}m</strong>, un mobile {defi.sens} : à l’instant étudié, sa vitesse vaut <strong>v = {nbf(defi.v, 1)}{NB}m/s</strong> et frac(dv|dt) = <strong>{nbf(defi.at, 1)}{NB}m/s²</strong>. Déterminez la norme de son accélération, en m/s², avec 2 chiffres significatifs (marge acceptée : 6{NB}% de la valeur).</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>a =</span>
          <input value={defi.rep} aria-label="a" onKeyDown={e => e.key === 'Enter' && document.getElementById('fr-verif')?.click()} onChange={e => setDefi(d => ({ ...d, rep: e.target.value, verifie: false }))} inputMode="decimal"
            style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>m/s²</span>
        </div>
        <IndiceDefi cache={false}>Deux coordonnées perpendiculaires : a_t = frac(dv|dt) (sur vec(u)_t) et a_n = v² divisée par R (sur vec(u)_n). La norme est la racine de la somme des carrés de a_t et de a_n. Le signe de frac(dv|dt) ne change pas la norme.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
        <button id="fr-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.type === 'vitesse'
          ? (defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + `Avec v = ${nbf(defi.v, 2)} m/s, a = frac(v²|R) = ${nbf(M.an(defi.v, defi.R), 2)} m/s² (cible : ${nbf(defi.aCible, 1)} m/s², marge acceptée : 5 %).`
            + (defi.ok ? ` Valeur exacte : v = racine de (a × R) = ${nbf(defi.vAttendue, 2)} m/s.` : (defi.essais || 0) >= 2 ? ` Valeur exacte : v = racine de (a × R) = ${nbf(defi.vAttendue, 2)} m/s.` : ' Corrigez v et vérifiez à nouveau (l’indice peut vous aider).')
          : (defi.ok ? '✓ Correct. ' : '✗ Pas tout à fait. ') + (defi.ok || (defi.essais || 0) >= 2
            ? `a_n = frac(v²|R) = ${nbf(defi.aN, 2)} m/s² ; a = racine de (${nbf(defi.at, 1)}² + ${nbf(defi.aN, 2)}²) = ${nbf(defi.norme, 2)} m/s² (marge acceptée : 6 % de la valeur).`
            : 'Calculez a_n = frac(v²|R), puis la norme avec a_t et a_n, et vérifiez à nouveau (l’indice peut vous aider).')}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Point matériel</strong> : M est réduit à un point ; on ne s’intéresse ni à sa taille ni à sa rotation propre.</li>
      <li><strong>Mouvement plan et circulaire</strong> : la trajectoire est un cercle de rayon R constant, parcouru dans le sens trigonométrique, sans jamais s’arrêter (v ≥ 0). Le rayon R ne varie pas.</li>
      <li><strong>Repère de Frenet défini en chaque point</strong> : vec(u)_t est tangent à la trajectoire dans le sens du mouvement, vec(u)_n est normal, dirigé vers le centre. Ce repère n’est pas fixe : il tourne avec le point. Les expressions de vec(v) et de vec(a) sont <strong>citées</strong> (programme), pas démontrées.</li>
      <li><strong>Grandeurs instantanées</strong> : le schéma représente l’état à un instant. Dans l’exploration, frac(dv|dt) est constante pendant la lecture et v reste comprise entre 0 et 4,0 m/s (aux bornes, a_t est ramenée à 0 et un message l’indique) ; dans le parcours, la lecture garde v constante.</li>
      <li><strong>Échelles des flèches</strong> : une échelle est donnée sous le schéma (1 m/s pour vec(v), 2 m/s² pour vec(a)) ; elle peut changer d’un mode à l’autre, et l’échelle de vec(a) est masquée aux deux étapes où il faut calculer a (on ne la mesure pas à la règle). Le rayon dessiné ne change pas : R est un nombre, pas une longueur du dessin.</li>
      <li><strong>Chiffres significatifs</strong> : les données sont à 2 chiffres significatifs ; une marge de 5 à 6 % est acceptée sur les résultats, qui s’arrondissent à 2 chiffres significatifs.</li>
      <li><strong>Hors périmètre</strong> : mouvement rectiligne et coordonnées cartésiennes, causes du mouvement (forces) et mouvement des satellites ne sont pas traités ici ; le satellite n’est qu’un exemple numérique.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, BLEU)}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène ----------
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  let montre, echV, echA;
  if (enGuide) { const compG = idx === 7 || idx === 10; montre = { rep: true, vit: idx >= 1 && !compG, acc: idx >= 3, comp: compG }; echV = 26; echA = 14; }
  else if (dd) { montre = { rep: true, vit: true, acc: false, comp: false }; echV = 18; echA = 14; }
  else { montre = { rep: true, vit: ex.aff !== 'comp', acc: ex.aff !== 'v', comp: ex.aff === 'comp' }; echV = 26; echA = 16; }
  const ariaScene = `Point M sur un cercle de centre O et de rayon ${nbf(P.R, 1)} mètre${P.R >= 2 ? 's' : ''}, qui tourne dans le sens trigonométrique à la vitesse de ${nbf(P.v, 1)} mètre par seconde, avec le repère de Frenet vec u t tangent et vec u n vers le centre${montre.acc ? ' et son vecteur accélération' : ''}${montre.comp ? ` avec ses deux composantes (a t = ${nbf(P.at, 1)} mètre par seconde carrée)` : ''}`;
  const scene = (
    <SceneFrenet theta={P.th} v={P.v} R={P.R} at={P.at} montre={montre} echV={echV} echA={echA} sansEchA={enGuide && (idx === 3 || idx === 7)} aria={ariaScene} legende={enGuide && idx === 9 ? 'schéma qualitatif' : undefined}/>);
  const boutonLecture = (enExplore || (enGuide && deja('pred')) || (dd && dd.type === 'vitesse')) && (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', ...cadre('lecture') }}>
      <button onClick={lancer} style={styleBouton(true, '#15803d')}>{reduit ? 'Avancer de 30°' : joue ? 'Pause' : 'Lancer le mouvement'}</button>
      {enExplore && <button onClick={() => { setJoue(false); setEx(s => ({ ...s, v: s.v0, th: rad(40) })); }} style={styleBouton(false)}><Pic n="refresh"/>Remettre au départ</button>}
    </div>);
  const boxScene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {enExplore && <div style={aide}>M tourne sur un cercle. La flèche verte est la vitesse, la rouge l’accélération ; les flèches bleues forment le repère de Frenet.</div>}
      {dd && dd.type === 'norme' && <div style={aide}>Image du mobile à l’instant étudié : sa vitesse est en train de varier, le mouvement n’est pas lancé ici.</div>}
      {scene}
      {boutonLecture && <div style={{ marginTop: 8 }}>{boutonLecture}</div>}
    </div>);

  // ---------- commandes du parcours ----------
  const majOv = f => setOvG(o => ({ ...o, [idx]: { ...(o[idx] || {}), ...f } }));
  const boxCommandes = enGuide && (
    <div style={{ ...styleBoite, ...cadre('curseurs') }}>
      <div style={titreCarte}>{deja('rayon') ? 'Réglages' : 'Position de M'}</div>
      <Curseur nom="Position de M sur le cercle" valeur={Math.round(thG * 180 / Math.PI)} onChange={x => setThG(rad(x))} min={0} max={359} pas={1} unite="°" couleur={BLEU}/>
      {deja('rayon') && idx !== 9 && <Curseur nom="Vitesse v" valeur={PG.v} onChange={x => majOv({ v: x })} min={0.5} max={3} pas={0.1} unite="m/s" decimales={1} couleur="#15803d"/>}
      {deja('acc') && idx !== 9 && idx !== 6 && idx !== 8 && <Curseur nom="Variation de la vitesse frac(dv|dt)" valeur={PG.at} onChange={x => majOv({ at: x })} min={-4} max={4} pas={0.5} unite="m/s²" decimales={1} couleur={ORANGE_GUIDE}/>}
    </div>);

  // ---------- mesures ----------
  const aN = M.an(P.v, P.R), aTot = M.normeAcc(P.v, P.R, P.at);
  const lignesGuide = (() => {
    const l = [['Vitesse v', `${nbf(P.v, 1)}${NB}m/s`], ['Rayon R', `${nbf(P.R, 1)}${NB}m`]];
    if (idx === 7 || idx === 10) l.push(['frac(dv|dt) = a_t', `${nbf(P.at, 1)}${NB}m/s²`]);
    if (idx !== 7) l.push(['a_n = frac(v²|R)', `${nbf(aN, 2)}${NB}m/s²`]);
    if (idx !== 7 && idx !== 6 && idx !== 8) l.push(['Norme a de vec(a)', `${nbf(aTot, 2)}${NB}m/s²`]);
    return l;
  })();
  const boxMesuresGuide = enGuide && apres('formule') && idx !== 9 && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={titreCarte}>Mesures</div>
      {lignesGuide.map(([n, vl], k) => <LigneMesure key={n} nom={n} valeur={vl} couleur={k === lignesGuide.length - 1 && lignesGuide[k][0].startsWith('Norme') ? '#b91c1c' : undefined}/>)}
    </div>);
  const mesuresEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Mesures</div>
      <div style={aide}>Valeurs à l’instant affiché.</div>
      {limite && <div role="status" aria-live="polite" style={{ margin: '0 0 8px', padding: '6px 10px', borderRadius: 8, background: '#fffbeb', border: '1.5px solid #b45309', color: '#7c2d12', fontSize: 13.5, fontWeight: 600, lineHeight: 1.5 }}>
        {indicesProfond(limite === 'max' ? `Vitesse maximale atteinte (${nbf(M.V_MAX, 1)} m/s) : elle ne peut plus augmenter, donc a_t est ramenée à 0. Réglez à nouveau la vitesse ou frac(dv|dt) pour repartir.`
          : 'Le point s’est arrêté (v = 0) : la vitesse ne peut pas devenir négative dans ce modèle, donc a_t est ramenée à 0. Réglez à nouveau la vitesse ou frac(dv|dt) pour repartir.')}
      </div>}
      <LigneMesure nom="Vitesse v" valeur={`${nbf(ex.v, 2)}${NB}m/s`} couleur="#15803d"/>
      <LigneMesure nom="Rayon R" valeur={`${nbf(ex.R, 1)}${NB}m`}/>
      <LigneMesure nom="a_t = frac(dv|dt)" valeur={`${nbf(P.at, 1)}${NB}m/s²`} couleur="#b45309"/>
      <LigneMesure nom="a_n = frac(v²|R)" valeur={`${nbf(M.an(ex.v, ex.R), 2)}${NB}m/s²`} couleur="#b45309"/>
      <LigneMesure nom="Norme a de vec(a)" valeur={`${nbf(M.normeAcc(ex.v, ex.R, P.at), 2)}${NB}m/s²`} couleur="#b91c1c"/>
      <LigneMesure nom="Angle de vec(a) avec vec(u)_n" valeur={`${nbf(M.angleAcc(ex.v, ex.R, P.at), 0)}${NB}°`}/>
      <LigneMesure nom="Mouvement" valeur={limite === 'arret' ? 'point arrêté' : M.nature(P.at) === 'uniforme' ? 'circulaire uniforme' : M.nature(P.at) === 'accéléré' ? 'circulaire accéléré' : 'circulaire ralenti'}/>
    </div>);

  // ---------- réglages de l'exploration ----------
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
  const reglagesEx = enExplore && (
    <div style={styleBoite}>
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Réglez la position de M et sa vitesse, puis lancez le mouvement.</div>
      <Curseur nom="Position de M sur le cercle" valeur={Math.round(ex.th * 180 / Math.PI)} onChange={x => setEx(s => ({ ...s, th: rad(x) }))} min={0} max={359} pas={1} unite="°" couleur={BLEU}/>
      <Curseur nom="Vitesse v" valeur={ex.v} onChange={x => setEx(s => ({ ...s, v: x, v0: x }))} min={0} max={M.V_MAX} pas={M.PAS_V} unite="m/s" decimales={2} couleur="#15803d"/>
      <Section titre={`Rayon et variation de la vitesse : R = ${nbf(ex.R, 1)} m · variation de v = ${nbf(ex.at, 1)} m/s²`} ouvert={ouv.reglages} onBascule={() => setOuv(o => ({ ...o, reglages: !o.reglages }))}>
        <div style={aide}>{indicesProfond('Le rayon fixe le cercle ; frac(dv|dt) fait varier la vitesse pendant la lecture (0 : mouvement uniforme).')}</div>
        <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>Rayon R du cercle
          <select value={ex.R} onChange={e => setEx(s => ({ ...s, R: Number(e.target.value) }))} style={{ ...menu, marginTop: 2 }}>
            {M.R_MENU.map(r => <option key={r} value={r}>{nbf(r, 1)} m</option>)}
          </select>
        </label>
        <Curseur nom="Variation de la vitesse frac(dv|dt)" valeur={ex.at} onChange={x => setEx(s => ({ ...s, at: x }))} min={-M.AT_MAX} max={M.AT_MAX} pas={0.5} unite="m/s²" decimales={1} couleur={ORANGE_GUIDE}/>
      </Section>
      <label style={{ display: 'block', fontSize: 13, color: KIT.txt2, marginBottom: 4 }}>Flèches affichées
        <select value={ex.aff} onChange={e => setEx(s => ({ ...s, aff: e.target.value }))} style={{ ...menu, marginTop: 2 }}>
          <option value="v">Vitesse seulement</option><option value="va">Vitesse et accélération</option><option value="comp">Accélération et ses deux composantes (sans la vitesse)</option>
        </select>
      </label>
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Avec frac(dv|dt) = 0, lancez le mouvement : la norme de vec(a) change-t-elle ? Sa direction ? Pointe-t-elle toujours vers O ?</li>
        <li>Gardez v constante et doublez le rayon : que devient a ? Doublez ensuite v avec le même rayon.</li>
        <li>Réglez frac(dv|dt) = 3,0 m/s² puis lancez : que devient l’angle de vec(a) avec vec(u)_n quand la vitesse augmente ? Pourquoi ?</li>
        <li>Réglez frac(dv|dt) négatif : à quel moment a_t s’inverse-t-elle par rapport à vec(u)_t ? La composante normale s’annule-t-elle ?</li>
        <li>Peut-on avoir a = 0 sur un cercle avec une vitesse non nulle ? Cherchez avec les curseurs.</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées et formules clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Repère de Frenet en M : vec(u)_t tangent, dans le sens du mouvement ; vec(u)_n normal, vers le centre</li>
          <li>Vitesse : vec(v) = v × vec(u)_t, coordonnées (v ; 0)</li>
          <li>Accélération : vec(a) = (frac(dv|dt)) × vec(u)_t + (frac(v²|R)) × vec(u)_n, coordonnées (a_t ; a_n)</li>
          <li>Circulaire uniforme : frac(dv|dt) = 0, vec(a) est centripète, de norme frac(v²|R) constante, de direction qui change</li>
          <li>Vitesse constante en norme n’implique pas accélération nulle : vec(v) change de direction</li>
          <li>Accéléré : a_t &gt; 0 ; ralenti : a_t &lt; 0 ; a_n = frac(v²|R) est toujours positive (vers le centre)</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .fr-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .fr-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .fr-col { display: flex; flex-direction: column; gap: 12px; }
        .fr-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .fr-l1.cote .fr-carte { order: 2; } .fr-l1.cote .fr-main { order: 1; }
          .fr-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .fr-ex > * { grid-column: 1; } .fr-ex > .fr-ctrl { grid-column: 2; grid-row: 1 / span 4; } }
        @media (max-width: 900px) { .fr-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .fr-in { animation: fr-fondu 0.35s ease-out; } @keyframes fr-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Mouvement circulaire : le repère de Frenet, vitesse et accélération</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Sur un cercle, le <strong>repère de Frenet</strong> (tangente, normale) permet d’écrire la vitesse et l’<strong>accélération</strong> du point : même à vitesse de norme constante, l’accélération n’est pas nulle.</div>
      {!enExplore && <div className="fr-l1 cote">
        {enGuide ? <div className="fr-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="fr-carte">{panneauHypo}</div> : null}
        <div className="fr-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'vitesse' ? suiviV : suiviN}/></div>}
          <div className="fr-col">
            {(!enDefi || defi) && <div className="fr-in">{boxScene}</div>}
            {boxCommandes && <div className="fr-in">{boxCommandes}</div>}
            {boxMesuresGuide && <div className="fr-in">{boxMesuresGuide}</div>}
          </div>
        </div>
      </div>}
      {enExplore && <div className="fr-ex">
        <div>{boxScene}</div>
        <div className="fr-ctrl">{reglagesEx}</div>
        <div>{mesuresEx}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
      {enGuide && deja('bilan') && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}
