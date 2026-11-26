import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./chutePlaneModele";
import { QCM } from "./chutePlaneQcm";
import { ChutePlaneExplore } from "./ChutePlaneExplore";
import { SceneTrajet, SvgLoisCarte, SvgSommetCarte, SvgAngleCarte } from "./ChutePlaneSchemas";

const SIM_ID = 269, CLE_GUIDE = 'chute-plane-guide-v1';
declarerDefis(SIM_ID, [['sommet', 'Sommet de la trajectoire : durée et hauteur'], ['portee', 'Portée d’un tir']]);

// ====================================================
//  SIM 269 — CHUTE LIBRE PLANE (TSTL, enseignement PCM, partie « Interactions »).
//  Une seule idée : en chute libre (seul le poids), a = g vers le bas, soit (0 ; −g) ; v_x est constante, v_y = v0 sin α − g t ; sommet, hauteur maximale, portée ; effet de l'angle ; la masse n'intervient pas.
//  Capacités visées (jamais affichées) : appliquer la deuxième loi de Newton à un projectile ; établir et exploiter les lois horaires ; sommet et portée. Projectile lancé du sol : situation générique inventée.
//  Modèle : chutePlaneModele.js (test node). QCM : chutePlaneQcm.js. Schémas : ChutePlaneSchemas.jsx. Exploration animée : ChutePlaneExplore.jsx.
// ====================================================
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const PG = M.PARCOURS;
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };

// ====================================================
export function SimulationChutePlane() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('sommet');
  const [ouv, setOuv] = useState({});
  const [ex, setEx] = useState({ v0: 20, a: 40, m: 1 });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const fr = x => String(x).replace('.', ',');
  const IDS = ['acc', 'vx', 'v0xy', 'vy', 'sommet', 'tS', 'hauteur', 'portee', 'angle', 'masse', 'fin'];
  const etape = guide.etape;
  const idEtape = IDS[Math.min(etape, IDS.length - 1)];
  const deja = id => etape >= IDS.indexOf(id);
  const ETAPES = [
    { id: 'acc', titre: 'Un projectile en chute libre', focus: ['scene'],
      texte: <>Un projectile est lancé du sol avec une vitesse initiale <strong>v₀</strong> inclinée d’un angle <strong>α</strong> au-dessus de l’horizontale. On néglige l’air : le projectile est en <strong>chute libre</strong>, la seule force est son <strong>poids</strong>. La deuxième loi de Newton donne alors <strong>a = g</strong>, dirigée vers le bas. Dans un repère (O, x, y) avec x horizontal vers la droite et y vertical vers le haut, on note <strong>(aₓ ; aᵧ)</strong> les coordonnées de l’accélération.</>,
      tache: { type: 'qcm', q: 'Les coordonnées (aₓ ; aᵧ) de l’accélération sont :', ...QCM.acc,
        expl: 'Le poids est vertical, dirigé vers le bas : aₓ = 0 et aᵧ = −g (g = 9,8 m/s²). L’accélération est la même tout au long du vol.', indice: 'La seule force est le poids : quelle est sa direction ? Que valent alors les deux coordonnées de l’accélération ?' } },
    { id: 'vx', titre: 'La vitesse horizontale', focus: ['scene'],
      texte: <>Comme aₓ = 0, la composante horizontale <strong>vₓ</strong> de la vitesse ne change pas pendant le vol : elle garde la valeur qu’elle avait au départ.</>,
      tache: { type: 'qcm', q: 'La composante horizontale vₓ de la vitesse est :', ...QCM.vx,
        expl: 'aₓ = 0 : vₓ est constante, égale à v₀ cos α. Aucune force horizontale ne s’exerce sur le projectile.', indice: 'Une accélération nulle sur un axe : que devient la vitesse sur cet axe ?' } },
    { id: 'v0xy', titre: 'Décomposer la vitesse initiale', focus: ['scene'],
      texte: <>Le projectile est lancé avec <strong>v₀ = 20 m/s</strong> sous un angle <strong>α = 40°</strong> (la calculatrice doit être réglée en <strong>degrés</strong>). Les coordonnées de la vitesse initiale sont <strong>v₀ₓ = v₀ cos α</strong> et <strong>v₀ᵧ = v₀ sin α</strong>.</>,
      tache: { type: 'num', q: 'Composante horizontale v₀ₓ, en m/s', unite: 'm/s', vrai: PG.v0x, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.v0y, 'C’est la composante verticale v₀ sin α : la composante horizontale utilise le cosinus.'], [20 * Math.cos(40), 'Votre calculatrice semble réglée en radians : passez-la en degrés (cos 40° ≈ 0,77).']],
        calcul: () => ['v₀ₓ = v₀ cos α = 20 × cos 40°.', 'v₀ₓ = 20 × 0,766 = 15 m/s.'], expl: 'v₀ₓ = 20 × cos 40° ≈ 15 m/s ; v₀ᵧ = 20 × sin 40° ≈ 13 m/s.', indice: 'Horizontale : cosinus. Calculatrice en degrés : v₀ₓ = 20 × cos 40°.' } },
    { id: 'vy', titre: 'La vitesse verticale', focus: ['scene'],
      texte: <>La composante verticale de la vitesse évolue selon <strong>vᵧ = v₀ᵧ − g t</strong> (g = 9,8 m/s²). Ici <strong>v₀ᵧ = 12,9 m/s</strong>. On s’intéresse à l’instant <strong>t = 0,50 s</strong>.</>,
      tache: { type: 'num', q: 'Composante verticale vᵧ à t = 0,50 s, en m/s', unite: 'm/s', vrai: PG.vy1, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.v0y + 9.8 * 0.5, 'Le poids tire vers le bas : vᵧ diminue, on soustrait g t.'], [PG.v0y - 9.8, 'N’oubliez pas de multiplier g par la durée : g t = 9,8 × 0,50.']],
        calcul: () => ['vᵧ = v₀ᵧ − g t = 12,9 − 9,8 × 0,50.', 'vᵧ = 12,9 − 4,9 = 8,0 m/s.'], expl: 'vᵧ = 12,9 − 9,8 × 0,50 = 8,0 m/s.', indice: 'vᵧ = v₀ᵧ − g t : calculez d’abord g t = 9,8 × 0,50.' } },
    { id: 'sommet', titre: 'Au sommet de la trajectoire', focus: ['scene'],
      retenirTitre: 'À retenir : les lois de la chute libre',
      retenir: <>
        <SvgLoisCarte/>
        <ul style={puces}>
          <li>Chute libre : seule force le <strong>poids</strong>, donc <strong>a = g</strong> vers le bas, soit <strong>(0 ; −g)</strong> avec y vers le haut.</li>
          <li><strong>vₓ = v₀ cos α</strong> reste constante ; <strong>vᵧ = v₀ sin α − g t</strong> diminue de g chaque seconde (de 9,8 m/s par seconde).</li>
          <li>Moyen de s’en souvenir : <strong>« à l’horizontale, rien ne change ; à la verticale, g tire »</strong>. Idée fausse : « la vitesse horizontale diminue peu à peu ». Vrai : sans frottement elle est constante.</li></ul></>,
      texte: <>La composante verticale vᵧ diminue, s’annule, puis devient négative : le projectile monte, atteint le <strong>sommet S</strong>, puis redescend.</>,
      tache: { type: 'qcm', q: 'Au sommet S de la trajectoire :', ...QCM.sommet,
        expl: 'Au sommet, le projectile ne monte plus et ne descend pas encore : vᵧ = 0. La composante horizontale n’a pas changé : vₓ ≠ 0, la vitesse est horizontale.', indice: 'Au sommet, le projectile ne monte plus et ne descend pas encore. Que vaut vᵧ ? et vₓ, qui est constante ?' } },
    { id: 'tS', titre: 'La durée de la montée', focus: ['scene'],
      texte: <>Le sommet est atteint quand <strong>vᵧ = 0</strong>, soit v₀ᵧ − g t<sub>S</sub> = 0. Ici <strong>v₀ᵧ = 12,9 m/s</strong> et g = 9,8 m/s².</>,
      tache: { type: 'num', q: 'Durée de la montée t_S, en s', unite: 's', vrai: PG.tS, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.v0y * 9.8, 'On divise v₀ᵧ par g : t_S = v₀ᵧ ÷ g (et non v₀ᵧ × g).'], [9.8 / PG.v0y, 'Le quotient est inversé : t_S = v₀ᵧ ÷ g.']],
        calcul: () => ['vᵧ = 0 donne v₀ᵧ − g t_S = 0, donc t_S = v₀ᵧ ÷ g.', 't_S = 12,9 ÷ 9,8 = 1,3 s.'], expl: 't_S = v₀ᵧ ÷ g = 12,9 ÷ 9,8 ≈ 1,3 s.', indice: 'Résolvez v₀ᵧ − g t_S = 0 : t_S = v₀ᵧ ÷ g.' } },
    { id: 'hauteur', titre: 'La hauteur maximale', focus: ['scene'],
      texte: <>La hauteur est donnée par <strong>y = v₀ᵧ t − ½ g t²</strong>. Au sommet, t = t<sub>S</sub> = <strong>1,31 s</strong>, avec v₀ᵧ = 12,9 m/s. On cherche la <strong>hauteur maximale H</strong>.</>,
      tache: { type: 'num', q: 'Hauteur maximale H, en m', unite: 'm', vrai: PG.H, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.v0y * PG.tS, 'Vous avez oublié le terme −½ g t² : y = v₀ᵧ t − ½ g t².'], [PG.v0y * PG.tS - 9.8 * PG.tS ** 2, 'Il manque le facteur ½ devant g t².']],
        calcul: () => ['H = v₀ᵧ t_S − ½ g t_S² = 12,9 × 1,31 − 0,5 × 9,8 × 1,31².', 'H = 16,9 − 8,4 = 8,4 m.'], expl: 'H = 12,9 × 1,31 − ½ × 9,8 × 1,31² ≈ 16,9 − 8,4 = 8,4 m.', indice: 'Remplacez t par 1,31 s dans y = v₀ᵧ t − ½ g t² (g t² = 9,8 × 1,31²).' } },
    { id: 'portee', titre: 'La portée', focus: ['scene'],
      texte: <>Le projectile retombe à la hauteur de départ (y = 0) après une durée de vol <strong>2 t<sub>S</sub> = 2,6 s</strong>. Pendant ce temps, la composante horizontale vaut <strong>vₓ = 15 m/s</strong> (constante). La <strong>portée D</strong> est la distance horizontale parcourue : D = vₓ × (durée du vol).</>,
      tache: { type: 'num', q: 'Portée D, en m', unite: 'm', vrai: 40, tol: 0.05, affiche: v => nbf(v, 0), cs: 2,
        pieges: [[15 * 1.3, 'Vous avez utilisé la durée de la montée seule (1,3 s) : la durée du vol est 2 t_S = 2,6 s.'], [20 * 2.6, 'Utilisez la composante horizontale vₓ = 15 m/s, pas la vitesse initiale v₀.']],
        calcul: () => ['D = vₓ × durée du vol = 15 × 2,6.', 'D ≈ 39 m ; avec les valeurs non arrondies, D ≈ 40 m.'], expl: 'D = vₓ × 2 t_S = 15,3 × 2,62 ≈ 40 m.', indice: 'Mouvement uniforme à l’horizontale : D = vₓ × durée du vol, avec 2,6 s.' } },
    { id: 'angle', titre: 'Quel angle pour aller le plus loin ?', focus: ['scene'],
      retenirTitre: 'À retenir : sommet et portée',
      retenir: <>
        <SvgSommetCarte/>
        <ul style={puces}>
          <li>Au <strong>sommet</strong>, vᵧ = 0 : durée de la montée <strong>t_S = v₀ᵧ ÷ g</strong> et hauteur maximale <strong>H = v₀ᵧ² ÷ (2 g)</strong>.</li>
          <li>La <strong>portée</strong> est <strong>D = vₓ × 2 t_S</strong> (tir qui revient à la hauteur de départ).</li>
          <li>Exemple : v₀ᵧ = 10 m/s et vₓ = 17 m/s : t_S ≈ 1,0 s, H ≈ 5,1 m, D ≈ 35 m. Moyen de s’en souvenir : <strong>« monter prend t_S, redescendre aussi, l’horizontale ne s’arrête jamais »</strong>.</li></ul></>,
      texte: <>On lance le projectile toujours avec la <strong>même vitesse v₀</strong>, en changeant seulement l’angle de tir α. La portée vaut D = v₀² sin(2α) ÷ g.</>,
      tache: { type: 'qcm', q: 'Pour obtenir la portée maximale, l’angle de tir vaut :', ...QCM.angle,
        expl: 'D = v₀² sin(2α) ÷ g est maximale quand sin(2α) = 1, soit α = 45°. Deux angles complémentaires (30° et 60°) donnent la même portée.', indice: 'Pour quelle valeur de 2α le sinus est-il maximal (égal à 1) ?' } },
    { id: 'masse', titre: 'Un projectile plus lourd', focus: ['scene'],
      texte: <>On refait le tir avec la <strong>même vitesse initiale</strong> et le <strong>même angle</strong>, mais avec un projectile de <strong>masse 5 fois plus grande</strong>. Le projectile reste en chute libre.</>,
      tache: { type: 'qcm', q: 'Comparée à celle du premier projectile, la trajectoire du projectile lourd :', ...QCM.masse,
        expl: 'ΣF = m a avec ΣF = poids = m g : la masse se simplifie, a = g quelle que soit la masse. La trajectoire est inchangée.', indice: 'Écrivez m a = m g : que devient la masse dans l’équation ?' } },
    { id: 'fin', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : angle et masse',
      retenir: <>
        <SvgAngleCarte/>
        <ul style={puces}>
          <li>À même vitesse initiale, la portée est maximale pour <strong>α = 45°</strong> ; <strong>30° et 60°</strong> (angles complémentaires) donnent la même portée.</li>
          <li>La <strong>masse n’intervient pas</strong> en chute libre : a = g pour tous les corps.</li>
          <li>Moyen de s’en souvenir : <strong>« 45° pour aller loin, la masse ne compte pas »</strong>. Idée fausse : « un objet lourd tombe plus vite ». Vrai : sans air, tous les objets tombent de la même façon.</li></ul></>,
      texte: <>Vous savez décrire un mouvement de chute libre plane : accélération (0 ; −g), vitesses vₓ et vᵧ, sommet, hauteur maximale, portée et effet de l’angle. Explorez en saisissant le vecteur vitesse initiale, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const SC = {
    acc: { accel: true }, vx: { accel: true }, v0xy: { composantes: true }, vy: { composantes: true }, sommet: { composantes: true, sommet: true },
    tS: { sommet: true }, hauteur: { sommet: true }, portee: { sommet: true, portee: true }, angle: { portee: true }, masse: {}, fin: { composantes: true, sommet: true, portee: true, accel: true },
  };

  // ════════════════ EXPLORATION ════════════════
  const animee = enExplore && <ChutePlaneExplore ex={ex} setEx={setEx}/>;
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Le tir et sa trajectoire</div>
      <SceneTrajet {...SC[idEtape]}/>
    </div>);

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'sommet' ? { ...M.tirageDefiSommet(), type, reps: { t: '', h: '' }, verifie: false, corr: false } : { ...M.tirageDefiPortee(), type, reps: { d: '' }, verifie: false, corr: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    const ok = defi.type === 'sommet' ? (proche(lireNombre(defi.reps.t), defi.tS, 0.06) && proche(lireNombre(defi.reps.h), defi.H, 0.06)) : proche(lireNombre(defi.reps.d), defi.D, 0.06);
    setDefi(x => ({ ...x, verifie: true, ok })); (defi.type === 'sommet' ? noterA : noterB)(ok);
  };
  const change = (cle, v) => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: v }, verifie: false, corr: false }));
  const diagnostic = () => {
    const x = defi, msgs = [], g = M.G;
    if (x.type === 'sommet') {
      const t = lireNombre(x.reps.t), h = lireNombre(x.reps.h), vy0 = M.v0y(x.v0, x.a);
      if (!isFinite(t) || !isFinite(h)) return ['Écrivez deux nombres (virgule ou point) : la durée de la montée en s et la hauteur maximale en m.'];
      if (!proche(t, x.tS, 0.06)) msgs.push(proche(t, x.v0 / g, 0.05) ? 'Vous avez utilisé v₀ au lieu de la composante verticale v₀ᵧ = v₀ sin α.' : proche(t, x.v0 * Math.sin(x.a), 0.05) || proche(t, Math.sin(x.a * Math.PI / 180) * x.v0 * g, 0.05) ? 'Divisez v₀ᵧ par g : t_S = v₀ᵧ ÷ g (et non v₀ᵧ × g).' : `Refaites : v₀ᵧ = ${x.v0} × sin ${x.a}° = ${fr(vy0.toFixed(1))} m/s, puis t_S = v₀ᵧ ÷ g. Votre valeur est ${t > x.tS ? 'trop grande' : 'trop petite'}.`);
      if (!proche(h, x.H, 0.06)) msgs.push(proche(h, vy0 ** 2 / g, 0.05) ? 'Il manque le facteur 2 : H = v₀ᵧ² ÷ (2 g).' : proche(h, x.v0 ** 2 / (2 * g), 0.05) ? 'Utilisez la composante verticale : H = (v₀ sin α)² ÷ (2 g).' : `Calculez H = v₀ᵧ² ÷ (2 g) = ${fr(vy0.toFixed(1))}² ÷ 19,6. Votre valeur est ${h > x.H ? 'trop grande' : 'trop petite'}.`);
      return msgs;
    }
    const d = lireNombre(x.reps.d), vx = M.v0x(x.v0, x.a), tV = M.tVol(x.v0, x.a);
    if (!isFinite(d)) return ['Écrivez un nombre (virgule ou point), en m.'];
    if (proche(d, vx * tV / 2, 0.05)) return ['Vous avez utilisé la durée de la montée seule : la durée du vol est 2 t_S.'];
    if (proche(d, x.v0 * tV, 0.05)) return ['À l’horizontale, il faut la composante vₓ = v₀ cos α, pas la vitesse v₀.'];
    if (proche(d, x.v0 ** 2 / g, 0.05)) return ['Il manque l’angle : D = v₀² sin(2α) ÷ g (ou D = vₓ × 2 t_S).'];
    return [`Refaites : vₓ = ${x.v0} × cos ${x.a}° = ${fr(vx.toFixed(1))} m/s ; t_S = v₀ sin α ÷ g ; D = vₓ × 2 t_S. Votre valeur est ${d > x.D ? 'trop grande' : 'trop petite'} (calculatrice en degrés).`];
  };
  const correction = () => defi.type === 'sommet'
    ? `v₀ᵧ = ${defi.v0} × sin ${defi.a}° = ${nbf(M.v0y(defi.v0, defi.a), 2)} m/s ; t_S = v₀ᵧ ÷ g = ${nbf(defi.tS, 2)} s ; H = v₀ᵧ² ÷ (2 g) = ${nbf(defi.H, 1)} m.`
    : `vₓ = ${defi.v0} × cos ${defi.a}° = ${nbf(M.v0x(defi.v0, defi.a), 2)} m/s ; durée du vol = 2 v₀ sin α ÷ g = ${nbf(defi.tVol, 2)} s ; D = vₓ × durée = ${nbf(defi.D, 1)} m.`;
  const champ = (cle, nom, unite, id) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{nom} ({unite}) =</span>
      <input value={defi.reps[cle]} aria-label={`${nom} en ${unite}`} id={id} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('cpl-verif')?.click()} onChange={e2 => change(cle, e2.target.value)}
        style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['sommet', 'Sommet'], ['portee', 'Portée']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0b4f94')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'sommet' ? 'Défi : le sommet de la trajectoire' : 'Défi : la portée d’un tir'}</div>
      {defi.type === 'sommet'
        ? <div style={{ ...lbl, marginBottom: 8 }}>Un projectile est lancé du sol avec une vitesse initiale <strong>v₀ = {defi.v0} m/s</strong> inclinée de <strong>α = {defi.a}°</strong> au-dessus de l’horizontale (chute libre, g = 9,8 m/s², calculatrice en degrés). Donnez la durée de la montée jusqu’au sommet (en s) et la hauteur maximale atteinte (en m), avec 2 chiffres significatifs (marge acceptée : 6 %).</div>
        : <div style={{ ...lbl, marginBottom: 8 }}>Un projectile est lancé du sol avec une vitesse initiale <strong>v₀ = {defi.v0} m/s</strong> inclinée de <strong>α = {defi.a}°</strong> au-dessus de l’horizontale (chute libre, g = 9,8 m/s², calculatrice en degrés). Il retombe au sol. Donnez la portée D (en m), avec 2 chiffres significatifs (marge acceptée : 6 %).</div>}
      {defi.type === 'sommet' ? <>{champ('t', 'Durée de la montée', 's', 'cpl-defi-t')}{champ('h', 'Hauteur maximale', 'm', 'cpl-defi-h')}</> : champ('d', 'Portée', 'm', 'cpl-defi-d')}
      <IndiceDefi cache={false}>{defi.type === 'sommet' ? 'v₀ᵧ = v₀ sin α ; au sommet vᵧ = 0 donc t_S = v₀ᵧ ÷ g ; H = v₀ᵧ² ÷ (2 g).' : 'vₓ = v₀ cos α ; durée du vol = 2 t_S = 2 v₀ sin α ÷ g ; D = vₓ × durée du vol.'}</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="cpl-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
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
      <li><strong>Chute libre</strong> : seule force, le poids ; on néglige le frottement de l’air (valable pour un objet compact et lourd, à vitesse modérée). Avec frottement, la trajectoire serait plus courte et moins symétrique.</li>
      <li><strong>Champ de pesanteur uniforme</strong> : g = 9,8 m/s², constant sur toute la trajectoire (altitudes très petites devant le rayon de la Terre).</li>
      <li><strong>Repère</strong> : x horizontal vers la droite, y vertical vers le haut, origine au point de lancer ; référentiel terrestre supposé galiléen.</li>
      <li><strong>Tir depuis le sol</strong> : le projectile est lancé et retombe à la même hauteur (y = 0) ; la portée D = v₀² sin(2α) ÷ g n’est valable que dans ce cas.</li>
      <li><strong>Projectile ponctuel</strong> : on étudie le mouvement de son centre, sans rotation ; la masse n’intervient pas (elle se simplifie dans ΣF = m a).</li>
      <li><strong>Valeurs</strong> : toutes les vitesses et tous les angles sont inventés pour la simulation.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0b4f94')}><Pic n="target"/>Défis</button>
    </span>);
  const aEssayer = (
    <ul style={liste}>
      <li>Garde v₀ et change l’angle : pour quel angle le projectile va-t-il le plus loin ? et le plus haut ?</li>
      <li>Compare 30° et 60° à même v₀ : que remarques-tu sur la portée ? sur la hauteur ?</li>
      <li>Lance, puis mets en pause au sommet : que valent v_x et v_y ?</li>
      <li>Change la masse du projectile (0,1 kg, 1 kg, 5 kg) : la trajectoire change-t-elle ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Chute libre : a = g vers le bas, (0 ; −g) ; la masse n’intervient pas</li>
        <li>vₓ = v₀ cos α (constante) ; vᵧ = v₀ sin α − g t</li>
        <li>Sommet : vᵧ = 0, t_S = v₀ᵧ ÷ g, H = v₀ᵧ² ÷ (2 g)</li>
        <li>Portée (retour à la hauteur de départ) : D = vₓ × 2 t_S = v₀² sin(2α) ÷ g, maximale à 45°</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .cpl-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .cpl-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .cpl-col { display: flex; flex-direction: column; gap: 12px; }
        .cpl-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .cpl-l1.cote .cpl-carte { order: 2; } .cpl-l1.cote .cpl-main { order: 1; } }
        @media (max-width: 900px) { .cpl-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .cpl-in { animation: cpl-fondu 0.35s ease-out; } @keyframes cpl-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Chute libre plane : sommet, portée et angle de tir</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un projectile en <strong>chute libre</strong> n’a que son poids comme force : <strong>a = g</strong> vers le bas. La vitesse horizontale est constante, la vitesse verticale diminue de g par seconde ; on en déduit le <strong>sommet</strong> et la <strong>portée</strong>.</div>
      {!enExplore && <div className={`cpl-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="cpl-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="cpl-carte">{panneauHypo}</div>}
        <div className="cpl-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'sommet' ? suiviA : suiviB}/></div>}
          {enGuide && <div className="cpl-col"><div className="cpl-in">{scene}</div></div>}
        </div>
      </div>}
      {enExplore && <>
        <div className="cpl-ex">{animee}</div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('fin'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
