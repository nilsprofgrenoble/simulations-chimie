import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useEffect } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi, avecIndices, indicesProfond } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./ondesCeleriteModele";
import { Corde, Signaux, Carte, Course } from "./ondesCeleriteScenes";
import { Fiche } from "./ondesCeleriteFiches";
const { COUL, fr, X_M } = M;

const SIM_ID = 150;
declarerDefis(SIM_ID, [['celerite', 'Mesurer la célérité sur une corde'], ['distance', 'Distance d’une source : orage ou écho'], ['source', 'Localiser l’épicentre d’un séisme']]);

// ====================================================
//  SIM 150 — ONDES MÉCANIQUES : CÉLÉRITÉ ET RETARD (1G, « Ondes et signaux », Ondes mécaniques)
//  Corde (perturbation de proche en proche, retard entre deux capteurs, c = d / Δt), carte de séisme (distance = c × Δt, trois stations),
//  course entre trois milieux (influence du milieu). Hypothèses : bosse unique sans déformation ni amortissement, c constante dans un milieu,
//  instant d'émission connu pour la localisation, milieu homogène. Échelle verticale de la corde dilatée.
// ====================================================
const TMAX_GUIDE = 1.5, K0 = { c: 4, x1: 1, x2: 3 }, REP0 = { a: 0.1, b: 1 };
const STATIONS = M.stationsDe(M.E_DEPART, M.STATIONS_DEPART);
const RAYONS_REF = M.durees(M.E_DEPART, STATIONS, M.C_CARTE).map(t => M.C_CARTE * t);          // 60, 42, 54 km
const CAND_GUIDE = (() => { const c = M.candidats(STATIONS, RAYONS_REF, M.E_DEPART); return [c.autres[0], c.autres[1], c.vrai, c.autres[2]]; })();     // le point ③ est l'épicentre
const reduit = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const ONDES = { P: { nom: 'ondes P', c: 6 }, S: { nom: 'ondes S', c: 3.5 } };

// Animation : pos ∈ [0, 1] pour la scène identifiée par « cle » (changer de scène remet l'animation à zéro)
function useAnim(duree, cle) {
  const [etat, setEtat] = useState({ cle, pos: 0, joue: false });
  const pos = etat.cle === cle ? etat.pos : 0, joue = etat.cle === cle && etat.joue;
  useEffect(() => {
    if (!joue) return undefined;
    let raf, t0 = null;
    const pas = now => { if (t0 === null) t0 = now; const p = Math.min(1, (now - t0) / (duree * 1000)); setEtat({ cle, pos: p, joue: p < 1 }); if (p < 1) raf = requestAnimationFrame(pas); };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [joue, duree, cle]);
  return { pos, joue, lancer: () => setEtat({ cle, pos: reduit() ? 1 : 0, joue: !reduit() }), setPos: p => setEtat({ cle, pos: p, joue: false }) };
}

const selectStyle = { width: '100%', minHeight: 42, padding: '6px 10px', fontSize: 15, borderRadius: 10, border: `1.5px solid ${KIT.bord}`, background: '#fff', color: KIT.txt };
const Choix = ({ nom, valeur, options, onChange }) => (
  <label style={{ display: 'block', marginBottom: 8, fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>{nom}
    <select value={valeur} onChange={e => onChange(e.target.value)} style={{ ...selectStyle, marginTop: 3 }}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
  </label>);
const Titre = ({ children }) => <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{children}</div>;

// ====================================================
//  COMPOSANT
// ====================================================
export function SimulationOndesCelerite() {
  const [mode, setMode] = useState(() => modeOuverture('ondes-celerite-guide-v1'));
  useSignalerMode(mode);
  const [suiviCel, noterCel] = useCompteurDefi(), [suiviDis, noterDis] = useCompteurDefi(), [suiviSrc, noterSrc] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('ondes-celerite-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('celerite');
  const [hypoOuv, setHypoOuv] = useState(false), [ouv, setOuv] = useState({});
  const [K, setK] = useState(K0), [rep, setRep] = useState(REP0), [lance, setLance] = useState(false);
  const [sceneEx, setSceneEx] = useState('corde'), [opt, setOpt] = useState({ pointM: true, vitesse: false });
  const [Ee, setEe] = useState(M.E_DEPART), [typeOnde, setTypeOnde] = useState('P'), [dCourse, setDCourse] = useState(100);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const IDS = ['lancer', 'point', 'capteurs', 'retard', 'celerite', 'prevoir', 'vitesse', 'stationA', 'stationB', 'epicentre', 'milieux', 'eau', 'bilan'];
  const etape = Math.min(guide.etape, IDS.length - 1);
  const depuis = id => !enGuide || etape >= IDS.indexOf(id);
  const sceneGuide = etape <= IDS.indexOf('vitesse') ? 'corde' : etape <= IDS.indexOf('epicentre') ? 'carte' : 'course';
  const sc = enGuide ? sceneGuide : enDefi ? (defi?.type === 'celerite' ? 'corde' : defi?.type === 'source' ? 'carte' : null) : ({ corde: 'corde', seisme: 'carte', milieux: 'course' })[sceneEx];
  const KE = enDefi && defi?.type === 'celerite' ? defi.K : K;
  const cOnde = enExplore ? ONDES[typeOnde].c : M.C_CARTE;
  const EE = enExplore ? Ee : M.E_DEPART;
  const tmaxCorde = enGuide ? TMAX_GUIDE : enDefi ? 2 : M.dureeObservation(KE.x2, KE.c);
  const tmaxCarte = enExplore ? Math.max(...M.durees(Ee, STATIONS, cOnde)) + 2 : 12;
  const dEff = enExplore ? dCourse : 100, tmaxCourse = enExplore ? Math.round(M.dureesCourse(dEff)[0] * 1.15 * 1000) / 1000 : 0.35;
  const tmax = sc === 'corde' ? tmaxCorde : sc === 'carte' ? tmaxCarte : tmaxCourse;
  const anim = useAnim(sc === 'corde' ? tmax * 2 : sc === 'carte' ? 6 : 5, `${mode}-${sc}-${defi?.n ?? 0}`);
  const t = anim.pos * tmax;
  const lancer = () => { setLance(true); anim.lancer(); };

  const ETAPES = [
    { id: 'lancer', titre: 'Une perturbation sur une corde', depart: () => { setK(K0); anim.setPos(0); },
      texte: <>Une personne secoue l’extrémité d’une longue corde : elle crée une <strong>perturbation</strong> (une bosse). Que devient-elle ensuite ? Cliquez sur « Lancer la perturbation » et regardez-la.</>,
      tache: { type: 'action', ok: enGuide && lance, consigne: 'Lancez la perturbation et regardez la bosse avancer.' } },
    { id: 'point', titre: 'Qui avance : la bosse ou la corde ?',
      texte: <>Le point <strong>M</strong>, en orange, est un point de la corde ; la ligne en pointillés repère son abscisse. Chaque point de la corde entraîne son voisin, un peu comme des petits ressorts : c’est ce qui fait avancer la perturbation de proche en proche (comme la houle à la surface de l’eau). Relancez la perturbation et suivez M des yeux.</>,
      tache: { type: 'qcm', q: 'Quand la bosse passe, que fait le point M ?', options: ['il monte puis redescend sur place', 'il avance avec la bosse jusqu’à droite', 'il reste immobile pendant tout le passage', 'il recule vers la source puis revient'], bonne: 0,
        indice: 'Regardez le point orange et la ligne en pointillés : son abscisse change-t-elle ?',
        expl: 'M reste sur sa verticale : il monte puis redescend. La perturbation avance de proche en proche, mais la corde ne se déplace pas avec elle : il n’y a pas de transport de matière. Ici M bouge perpendiculairement à la propagation (onde transversale) ; pour le son, les molécules d’air vont et viennent dans le sens de la propagation (onde longitudinale : le son se propage par compressions et dilatations, dans le sens de propagation).' } },
    { id: 'capteurs', titre: 'Deux capteurs, deux signaux', retenirTitre: 'À RETENIR : L’ONDE VOYAGE, LA MATIÈRE RESTE', retenir: <Fiche id="voyage"/>,
      texte: <>On place deux capteurs sur la corde, à 1,0{NB}m et 3,0{NB}m de la source. Le graphique montre ce que chacun enregistre : l’<strong>élongation</strong> y (écart du point à sa position de repos) en fonction du temps. Lancez la perturbation et observez les deux signaux.</>,
      tache: { type: 'qcm', q: 'Quel capteur voit passer la perturbation en premier ?', options: ['le capteur 1 (le plus proche)', 'le capteur 2 (le plus éloigné)', 'les deux, exactement en même temps', 'cela dépend de la hauteur de la bosse'], bonne: 0,
        indice: 'La perturbation part de la source et avance de proche en proche : elle atteint d’abord les points les plus proches.',
        expl: 'Le capteur 1 est le plus proche de la source : la perturbation l’atteint en premier. Le capteur 2 reçoit la même perturbation, mais plus tard.' } },
    { id: 'retard', titre: 'Mesurer le retard',
      texte: <>Le signal du capteur 2 est identique à celui du capteur 1, mais décalé dans le temps : c’est le <strong>retard</strong> Δt. Avec les curseurs sous le graphique, placez le repère « début » sur le pic du capteur 1 et le repère « fin » sur le pic du capteur 2, puis lisez l’écart entre les deux.</>,
      tache: { type: 'num', q: 'Retard Δt entre les deux capteurs', unite: 's', vrai: 0.5, tol: 0.08, affiche: v => fr(v, 2), carnet: 'Retard Δt entre les capteurs',
        calcul: () => ['Pic du capteur 1 : t₁ = 0,25 s ; pic du capteur 2 : t₂ = 0,75 s.', 'Δt = t₂ − t₁ = 0,75 − 0,25 = 0,50 s.'],
        pieges: [[0.75, 'Vous avez lu la date du pic du capteur 2 : le retard est l’écart entre les deux pics, t₂ − t₁.'], [0.25, 'Vous avez lu la date du pic du capteur 1 : le retard est l’écart entre les deux pics, t₂ − t₁.']],
        expl: 'Δt = 0,50 s : la perturbation met 0,50 s pour aller du capteur 1 au capteur 2.', indice: 'Retard = date du pic du capteur 2 − date du pic du capteur 1. Alignez chaque repère sur le sommet du pic.' } },
    { id: 'celerite', titre: 'Calculer la célérité', retenirTitre: 'À RETENIR : LE RETARD', retenir: <Fiche id="retard"/>,
      texte: <>Les capteurs sont distants de d = 2,0{NB}m et le retard est Δt = 0,50{NB}s. La <strong>célérité</strong> c de l’onde est la vitesse à laquelle la perturbation se propage le long de la corde (notée v dans le programme ; à ne pas confondre avec la célérité de la lumière ni avec la concentration).</>,
      tache: { type: 'num', q: 'Célérité c de l’onde sur la corde', unite: 'm/s', vrai: 4, tol: 0.05, affiche: v => fr(v, 1), carnet: 'Célérité c de l’onde',
        calcul: () => ['c = d ÷ Δt = 2,0 m ÷ 0,50 s = 4,0 m/s.'], pieges: [[0.25, 'Vous avez calculé Δt ÷ d : la célérité est d ÷ Δt.'], [1, 'Vous avez multiplié d par Δt : la célérité est d ÷ Δt.']],
        expl: 'c = d ÷ Δt = 2,0 ÷ 0,50 = 4,0 m/s : la perturbation avance de 4,0 m chaque seconde.', indice: 'c = d ÷ Δt, avec d en mètres et Δt en secondes.' } },
    { id: 'prevoir', titre: 'Une distance plus grande', depart: () => { setK(k => ({ ...k, x2: 4 })); anim.setPos(0); },
      texte: <>La corde n’a pas changé : c = 4,0{NB}m/s (valeur de l’étape précédente). On éloigne le capteur 2 : il est maintenant à 4,0{NB}m de la source, donc à d = 3,0{NB}m du capteur 1. Prévoyez le retard, puis vérifiez sur le graphique (le curseur « Position du capteur 2 » permet d’essayer d’autres distances).</>,
      tache: { type: 'num', q: 'Retard Δt pour d = 3,0 m (c = 4,0 m/s)', unite: 's', vrai: 0.75, tol: 0.04, affiche: v => fr(v, 2), carnet: 'Retard prévu pour d = 3,0 m',
        calcul: () => ['Δt = d ÷ c = 3,0 m ÷ 4,0 m/s = 0,75 s.'], pieges: [[0.5, 'Vous avez gardé le retard précédent : la distance a changé, le retard aussi.'], [12, 'Vous avez calculé c × d : le retard est d ÷ c.'], [1.33, 'Vous avez calculé c ÷ d : le retard est d ÷ c.']],
        expl: 'Δt = 0,75 s. La célérité est la même ; la distance est multipliée par 1,5 donc le retard aussi. Le graphique le confirme.', indice: 'Δt = d ÷ c, avec d = 3,0 m et c = 4,0 m/s.' } },
    { id: 'vitesse', titre: 'Ne pas confondre deux vitesses', retenirTitre: 'À RETENIR : LA CÉLÉRITÉ', retenir: <Fiche id="celerite"/>,
      texte: <>La flèche verte est la vitesse du point M, notée ici vec(u) pour ne pas la confondre avec la célérité : M monte puis redescend. Relancez la perturbation et comparez avec la célérité de l’onde, c = 4,0{NB}m/s.</>,
      tache: { type: 'qcm', q: 'Que représente c = 4,0 m/s ?', options: ['la vitesse de propagation de la perturbation', 'la vitesse du point M quand il monte ou descend', 'la vitesse de la main de la personne qui secoue', 'la vitesse de toute la corde vers la droite'], bonne: 0,
        indice: 'Rappelez-vous l’étape 2 : les points de la corde ne se déplacent pas avec l’onde.',
        expl: 'La célérité est la vitesse à laquelle la perturbation se propage. Un point de la corde monte et descend sur place : la vitesse vec(u) du point est verticale, varie au cours du temps et n’a rien à voir avec c.' } },
    { id: 'stationA', titre: 'Changeons d’échelle : un séisme', depart: () => anim.setPos(0),
      texte: <>Un séisme se produit près de la surface de la Terre ; le point de la surface situé à la verticale du foyer s’appelle l’<strong>épicentre</strong>. Pour un séisme superficiel, on assimile le foyer à l’épicentre. Les ondes sismiques (ondes P) se propagent dans la croûte terrestre à c = 6,0{NB}km/s. La station A reçoit l’onde 10,0{NB}s après le séisme (on suppose que l’instant du séisme est connu).</>,
      tache: { type: 'num', q: 'Distance d_A entre la station A et l’épicentre', unite: 'km', vrai: 60, tol: 0.03, affiche: v => fr(v, 0), carnet: 'Distance station A – épicentre',
        calcul: () => ['d_A = c × Δt = 6,0 km/s × 10,0 s = 60 km (les secondes se simplifient).'], pieges: [[0.6, 'Vous avez calculé c ÷ Δt : la distance est c × Δt.'], [1.67, 'Vous avez calculé Δt ÷ c : la distance est c × Δt.']],
        expl: 'd_A = 6,0 × 10,0 = 60 km : l’épicentre est quelque part à 60 km de la station A (sur un cercle).', indice: 'Pendant Δt, l’onde parcourt d = c × Δt.' } },
    { id: 'stationB', titre: 'Une deuxième station',
      texte: <>Le cercle de rayon 60{NB}km autour de A est tracé : l’épicentre est quelque part dessus. La station B reçoit la même onde 7,0{NB}s après le séisme (toujours c = 6,0{NB}km/s).</>,
      tache: { type: 'num', q: 'Distance d_B entre la station B et l’épicentre', unite: 'km', vrai: 42, tol: 0.03, affiche: v => fr(v, 0), carnet: 'Distance station B – épicentre',
        calcul: () => ['d_B = c × Δt = 6,0 km/s × 7,0 s = 42 km.'], pieges: [[0.86, 'Vous avez calculé c ÷ Δt : la distance est c × Δt.'], [1.17, 'Vous avez calculé Δt ÷ c : la distance est c × Δt.']],
        expl: 'd_B = 6,0 × 7,0 = 42 km.', indice: 'd = c × Δt, comme pour la station A.' } },
    { id: 'epicentre', titre: 'Trois stations, un seul point',
      texte: <>Les cercles de A (60{NB}km) et de B (42{NB}km) se coupent en deux points. La station C a mesuré Δt = 9,0{NB}s : son cercle (54{NB}km) est tracé aussi. Les points numérotés sont les endroits où au moins deux cercles se coupent. Hypothèses : milieu homogène (même célérité partout) et trajets rectilignes.</>,
      tache: { type: 'qcm', q: 'Où a eu lieu le séisme ?', options: ['au point ①', 'au point ②', 'au point ③', 'au point ④'], bonne: 2,
        indice: 'L’épicentre est à la bonne distance des trois stations : il est donc sur les trois cercles à la fois.',
        expl: 'Seul le point ③ est sur les trois cercles : il est à 60 km de A, 42 km de B et 54 km de C. Deux stations laissent deux possibilités ; la troisième lève le doute.' } },
    { id: 'milieux', titre: 'Le milieu change-t-il la célérité ?', retenirTitre: 'À RETENIR : LOCALISER UNE SOURCE', retenir: <Fiche id="localiser"/>, depart: () => anim.setPos(0),
      texte: <>Un claquement est produit à une extrémité de trois milieux de même longueur, 100{NB}m : un tube d’air, une cuve d’eau et une barre d’acier. Un récepteur est placé à l’autre extrémité. Hypothèses : chaque milieu est homogène et le signal va en ligne droite. Faites une prévision, puis cliquez sur « Lancer la course » pour vérifier.</>,
      tache: { type: 'qcm', q: 'Dans quel milieu le signal arrive-t-il en premier ?', options: ['dans l’acier', 'dans l’eau', 'dans l’air', 'en même temps partout'], bonne: 0,
        indice: 'La distance est la même dans les trois milieux : Δt = d ÷ c. Le signal arrive en premier là où la durée est la plus petite, donc là où la célérité est la plus grande.',
        expl: 'Le signal arrive d’abord dans l’acier (≈ 17 ms), puis dans l’eau (≈ 67 ms), enfin dans l’air (≈ 290 ms) : la célérité dépend du milieu.' } },
    { id: 'eau', titre: 'Calculer une durée dans l’eau', retenirTitre: 'À RETENIR : LE MILIEU COMPTE', retenir: <Fiche id="milieux"/>,
      texte: <>Dans l’eau, la célérité du son est c = 1{NB}500{NB}m/s. Un signal sonore parcourt une distance de 3,0{NB}km dans l’eau.</>,
      tache: { type: 'num', q: 'Durée de propagation Δt du signal', unite: 's', vrai: 2, tol: 0.04, affiche: v => fr(v, 1), carnet: 'Durée dans l’eau pour 3,0 km',
        calcul: () => ['d = 3,0 km = 3 000 m.', 'Δt = d ÷ c = 3 000 m ÷ 1 500 m/s = 2,0 s.'],
        pieges: [[0.002, 'Les unités ne sont pas homogènes : convertissez 3,0 km en mètres (3 000 m) avant de diviser.'], [0.5, 'Vous avez calculé c ÷ d : la durée est d ÷ c.'], [4.5e6, 'Vous avez multiplié d par c : la durée est d ÷ c.']],
        expl: 'Δt = 3 000 ÷ 1 500 = 2,0 s. Dans l’air, la même distance demanderait environ 8,8 s : le milieu change la durée.', indice: 'Δt = d ÷ c ; convertissez d en mètres.' } },
    { id: 'bilan', titre: 'Le bilan', retenirTitre: 'À RETENIR : LE BILAN', retenir: <Fiche id="bilan"/>,
      texte: <>Vous savez décrire la propagation d’une perturbation, mesurer un retard, calculer une célérité, en déduire une distance et localiser une source. Essayez maintenant l’exploration libre, puis les défis.</>, tache: null },
  ];
  useEffect(() => {
    if (mode !== 'guide') return;
    const dep = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (dep) dep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ════════════════ DÉFIS ════════════════
  const marqueurInitial = st => { let best = { x: 45, y: 45 }, bd = -1; for (let x = 0; x <= 90; x += 10) for (let y = 0; y <= 90; y += 10) { const d = Math.min(...st.map(q => M.dist({ x, y }, q))); if (d > bd) { bd = d; best = { x, y }; } } return best; };
  const tirages = {
    celerite: () => { const t = M.tirerCorde(); return { type: 'celerite', n: Date.now(), K: { c: t.c, x1: t.x1, x2: t.x2 }, d: t.d, vrai: t.c, rep: REP0, reps: {}, verifie: false }; },
    distance: () => ({ type: 'distance', n: Date.now(), ...M.tirerDistance(), reps: {}, verifie: false }),
    source: () => { const t = M.tirerSource(); return { type: 'source', n: Date.now(), ...t, marq: marqueurInitial(t.st), reps: {}, verifie: false }; },
  };
  const nouveauDefi = ty => setDefi(tirages[ty]());
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(ty) { setTypeDefi(ty); nouveauDefi(ty); }
  const majRep = (k, v) => (enDefi && defi?.type === 'celerite' ? setDefi(x => ({ ...x, rep: { ...x.rep, [k]: v }, verifie: false })) : setRep(r => ({ ...r, [k]: v })));
  const repEff = enDefi && defi?.type === 'celerite' ? defi.rep : rep;
  const marqueurDefi = defi?.type === 'source' ? defi.marq : null;
  const verifierDefi = () => {
    if (defi.type === 'source') {
      const lus = [0, 1, 2].map(i => lireNombre(defi.reps['r' + i])), rayonsOk = lus.map((x, i) => Number.isFinite(x) && proche(x, defi.R[i], 0.04)), posOk = M.dist(defi.marq, defi.E) <= 4;
      const ok = rayonsOk.every(Boolean) && posOk; setDefi(x => ({ ...x, verifie: true, ok, rayonsOk, posOk })); noterSrc(ok); return;
    }
    const x = lireNombre(defi.reps.r), ok = Number.isFinite(x) && proche(x, defi.vrai, defi.type === 'celerite' ? 0.1 : 0.05);
    setDefi(y => ({ ...y, verifie: true, ok })); (defi.type === 'celerite' ? noterCel : noterDis)(ok);
  };
  const champ = (cle, label, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{avecIndices(label)}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}><input value={defi.reps[cle] ?? ''} aria-label={label} inputMode="decimal" onKeyDown={e => e.key === 'Enter' && document.getElementById('oc-verif')?.click()}
        onChange={e => { const v = e.target.value; setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: v }, verifie: false })); }}
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? ((defi.type === 'source' ? defi.rayonsOk?.[+cle.slice(1)] : defi.ok) ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span></span>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['celerite', 'Mesurer c'], ['distance', 'Trouver une distance'], ['source', 'Localiser']].map(([k, l]) => <button key={k} onClick={() => choisirDefi(k)} aria-pressed={defi.type === k} style={stylePetitBouton(defi.type === k, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'celerite' ? 'Défi : quelle est la célérité de l’onde sur cette corde ?' : defi.type === 'distance' ? (defi.sous === 'orage' ? 'Défi : à quelle distance est l’orage ?' : 'Défi : quelle est la profondeur de la mer ?') : 'Défi : où a eu lieu le séisme ?'}</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>
        {defi.type === 'celerite' && <>La célérité de l’onde sur cette corde est <strong>inconnue</strong>. Les capteurs sont distants de d = {fr(defi.d, 1)}{NB}m. Lancez la perturbation, placez les repères sur les deux pics pour mesurer le retard, puis calculez la célérité c. Donnez c avec 2 chiffres significatifs.</>}
        {defi.type === 'distance' && defi.sous === 'orage' && <>Vous voyez un éclair, puis vous entendez le tonnerre <strong>{fr(defi.dt, 0)}{NB}s</strong> plus tard. La lumière est quasi instantanée ; la célérité du son dans l’air est c = 340{NB}m/s. Calculez la distance de l’éclair, avec 2 chiffres significatifs.</>}
        {defi.type === 'distance' && defi.sous === 'sonar' && <>Le sondeur d’un bateau émet un signal sonore vers le fond ; l’écho revient <strong>{fr(defi.dt * 1000, 0)}{NB}ms</strong> plus tard (le signal fait un aller-retour). La célérité du son dans l’eau est c = 1{NB}500{NB}m/s. Calculez la profondeur de la mer, avec 2 chiffres significatifs.</>}
        {defi.type === 'source' && <>Un séisme a eu lieu à un endroit <strong>inconnu</strong>. Les ondes P se propagent à c = {fr(defi.c, 1)}{NB}km/s. Calculez la distance de chaque station à l’épicentre : le cercle correspondant se trace. Puis déplacez la croix violette avec les curseurs, jusqu’à l’endroit où les trois cercles se coupent, et vérifiez.</>}
      </div>
      {defi.type === 'celerite' && champ('r', 'Célérité c', 'm/s')}
      {defi.type === 'distance' && champ('r', defi.sous === 'orage' ? 'Distance de l’éclair' : 'Profondeur de la mer', defi.unite)}
      {defi.type === 'source' && [0, 1, 2].map(i => <div key={i}>{champ('r' + i, `Distance ${'ABC'[i]} – épicentre`, 'km')}</div>)}
      {defi.type === 'celerite' && <IndiceDefi cache={false}>Retard Δt = date du pic du capteur 2 − date du pic du capteur 1 (repères « début » et « fin »). Puis c = d ÷ Δt, avec d en mètres et Δt en secondes.</IndiceDefi>}
      {defi.type === 'distance' && <IndiceDefi cache={false}>{defi.sous === 'orage' ? 'd = c × Δt avec c = 340 m/s ; donnez le résultat en kilomètres (divisez par 1 000).' : 'L’onde fait l’aller-retour : la distance parcourue est c × Δt, et la profondeur est la moitié de cette distance.'}</IndiceDefi>}
      {defi.type === 'source' && <IndiceDefi cache={false}>Pour chaque station : d = c × Δt (c en km/s, Δt en s). L’épicentre est sur les trois cercles à la fois.</IndiceDefi>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="oc-verif" onClick={verifierDefi} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? (defi.type === 'source' ? '✓ Correct : les trois cercles se coupent bien à l’épicentre.' : `✓ Correct. Valeur de la simulation : ${fr(defi.vrai, defi.type === 'celerite' ? 1 : defi.unite === 'km' ? 2 : 0)}${NB}${defi.unite || 'm/s'}.`)
          : defi.type === 'celerite' ? '✗ Vérifiez : le retard est l’écart entre les deux pics ; c = d ÷ Δt (d en m, Δt en s).'
            : defi.type === 'distance' ? `✗ Vérifiez : d = c × Δt${defi.sous === 'sonar' ? ', puis divisez par 2 (aller-retour)' : ''} ; attention aux unités.`
              : `✗ ${defi.rayonsOk.every(Boolean) ? 'Les distances sont justes, mais la croix n’est pas encore sur le point commun aux trois cercles.' : `Vérifiez ${defi.rayonsOk.map((o, i) => (o ? null : 'ABC'[i])).filter(Boolean).join(', ')} : d = c × Δt.`}`}
      </div>}
    </div>);

  // ════════════════ SCÈNES ════════════════
  const cartePourDefi = defi?.type === 'source' ? defi : null;
  const rayonsDefi = cartePourDefi ? [0, 1, 2].map(i => { const r = lireNombre(cartePourDefi.reps['r' + i]); return { x: cartePourDefi.st[i].x, y: cartePourDefi.st[i].y, r: Number.isFinite(r) && r > 0 && r < 200 ? r : null, couleur: ['#1d4ed8', '#15803d', '#dc2626'][i] }; }) : [];
  const nStationsGuide = depuis('stationB') ? (depuis('epicentre') ? 3 : 2) : 1;
  const rayonsGuide = [depuis('stationB') ? { ...STATIONS[0], r: RAYONS_REF[0], couleur: COUL.c1 } : null, depuis('epicentre') ? { ...STATIONS[1], r: RAYONS_REF[1], couleur: '#15803d' } : null, depuis('epicentre') ? { ...STATIONS[2], r: RAYONS_REF[2], couleur: COUL.c2 } : null].filter(Boolean);
  const dtsEx = M.durees(Ee, STATIONS, cOnde), frontEx = cOnde * t;
  const dtsGuide = [10, 7, 9];
  const reussiEpi = !!(guide.reussies && guide.reussies[IDS.indexOf('epicentre')]);
  const avecCapteurs = enGuide ? depuis('capteurs') : true, avecM = enGuide ? depuis('point') : enExplore ? opt.pointM : false;
  const avecVitesse = enGuide ? depuis('vitesse') : enExplore && opt.vitesse;
  const graphe = (sc === 'corde' && avecCapteurs) && <Signaux t={t} c={KE.c} x1={KE.x1} x2={KE.x2} tmax={tmax} rep={enGuide ? (depuis('retard') ? repEff : null) : repEff}/>;
  const boutonLancer = (txt) => <button onClick={lancer} disabled={anim.joue} style={styleBouton(true, '#0369a1')}><Pic n="wave"/>{txt}</button>;
  // ════════════════ RÉGLAGES ET MESURES ════════════════
  const dCapteurs = KE.x2 - KE.x1, retardLu = Math.abs(repEff.b - repEff.a);
  const curseursRepere = (
    <>
      <Curseur nom="Repère « début » (sur le pic du capteur 1)" valeur={repEff.a} onChange={v => majRep('a', v)} min={0} max={tmaxCorde} pas={0.01} unite="s" decimales={2} couleur={COUL.deb}/>
      <Curseur nom="Repère « fin » (sur le pic du capteur 2)" valeur={repEff.b} onChange={v => majRep('b', v)} min={0} max={tmaxCorde} pas={0.01} unite="s" decimales={2} couleur={COUL.fin}/>
      <LigneMesure nom="Écart entre les deux repères" valeur={`${fr(retardLu, 2)}${NB}s`} couleur={COUL.fin}/>
    </>);
  const reglagesGuide = enGuide && sc === 'corde' && (depuis('retard') || depuis('prevoir')) && (
    <div style={styleBoite}>
      <Titre>Réglages</Titre>
      {depuis('retard') && <><div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Placez les repères sur les pics pour lire le retard.</div>{curseursRepere}</>}
      {depuis('prevoir') && <Curseur nom="Position du capteur 2" valeur={K.x2} onChange={v => setK(k => ({ ...k, x2: v }))} min={2} max={5} pas={0.5} unite="m" decimales={1} couleur={COUL.c2}/>}
    </div>);
  const reglagesDefi = enDefi && defi?.type === 'celerite' && (
    <div style={styleBoite}><Titre>Mesure du retard</Titre><div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Placez les repères sur les deux pics.</div>{curseursRepere}</div>);
  const reglagesDefiSource = enDefi && defi?.type === 'source' && (
    <div style={styleBoite}><Titre>Position de la croix violette</Titre>
      <Curseur nom="Abscisse x" valeur={defi.marq.x} onChange={v => setDefi(x => ({ ...x, marq: { ...x.marq, x: v }, verifie: false }))} min={M.CARTE.xmin} max={M.CARTE.xmax} pas={1} unite="km" decimales={0} couleur="#7e22ce"/>
      <Curseur nom="Ordonnée y" valeur={defi.marq.y} onChange={v => setDefi(x => ({ ...x, marq: { ...x.marq, y: v }, verifie: false }))} min={M.CARTE.ymin} max={M.CARTE.ymax} pas={1} unite="km" decimales={0} couleur="#7e22ce"/></div>);
  const ouvre = k => !!ouv[k], bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));
  const reglagesExplore = enExplore && (sceneEx === 'corde' ? (
    <div style={styleBoite}>
      <Titre>Réglages de la corde</Titre>
      <Choix nom="État de la corde" valeur={String(K.c)} onChange={v => setK(k => ({ ...k, c: Number(v) }))} options={M.CORDES.map(o => [String(o.c), o.nom])}/>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['pointM', 'point M'], ['vitesse', 'vitesse vec(u) de M']].map(([k, l]) => <button key={k} onClick={() => setOpt(o => ({ ...o, [k]: !o[k], ...(k === 'vitesse' && !o.vitesse ? { pointM: true } : {}) }))} aria-pressed={opt[k]} style={stylePetitBouton(opt[k], '#334155')}>{opt[k] ? '☑' : '☐'} {avecIndices(l)}</button>)}
      </div>
      <Section titre={`Capteurs · ${fr(K.x1, 1)} m et ${fr(K.x2, 1)} m`} ouvert={ouvre('cap')} onBascule={() => bascule('cap')}>
        <Curseur nom="Position du capteur 1" valeur={K.x1} onChange={v => setK(k => ({ ...k, x1: Math.min(v, k.x2 - 0.5) }))} min={0.5} max={4.5} pas={0.5} unite="m" decimales={1} couleur={COUL.c1}/>
        <Curseur nom="Position du capteur 2" valeur={K.x2} onChange={v => setK(k => ({ ...k, x2: Math.max(v, k.x1 + 0.5) }))} min={1} max={5.5} pas={0.5} unite="m" decimales={1} couleur={COUL.c2}/>
      </Section>
      <Section titre="Repères de lecture du retard" ouvert={ouvre('rep')} onBascule={() => bascule('rep')}>{curseursRepere}</Section>
    </div>
  ) : sceneEx === 'seisme' ? (
    <div style={styleBoite}>
      <Titre>Réglages du séisme</Titre>
      <Choix nom="Type d’onde sismique" valeur={typeOnde} onChange={setTypeOnde} options={[['P', 'ondes P (≈ 6,0 km/s)'], ['S', 'ondes S (≈ 3,5 km/s)']]}/>
      <Section titre={`Épicentre · x = ${fr(Ee.x, 0)} km, y = ${fr(Ee.y, 0)} km`} ouvert={ouvre('epi')} onBascule={() => bascule('epi')}>
        <Curseur nom="Abscisse x de l’épicentre" valeur={Ee.x} onChange={v => setEe(e => ({ ...e, x: v }))} min={0} max={90} pas={1} unite="km" decimales={0} couleur="#b91c1c"/>
        <Curseur nom="Ordonnée y de l’épicentre" valeur={Ee.y} onChange={v => setEe(e => ({ ...e, y: v }))} min={0} max={90} pas={1} unite="km" decimales={0} couleur="#b91c1c"/>
      </Section>
    </div>
  ) : (
    <div style={styleBoite}>
      <Titre>Réglage de la course</Titre>
      <Choix nom="Distance parcourue" valeur={String(dCourse)} onChange={v => setDCourse(Number(v))} options={[20, 50, 100, 200, 500].map(v => [String(v), `${v} m`])}/>
    </div>));
  const vM = M.vitessePoint(X_M, t, KE.c);
  const mesuresExplore = enExplore && (
    <div style={styleBoite}>
      <Titre>Mesures</Titre>
      {sceneEx === 'corde' && <>
        <LigneMesure nom="Célérité réglée c" valeur={`${fr(K.c, 1)}${NB}m/s`} couleur={COUL.noir}/>
        <LigneMesure nom="Passage du pic au capteur 1" valeur={`${fr(M.instantPassage(K.x1, K.c), 2)}${NB}s`} couleur={COUL.c1}/>
        <LigneMesure nom="Passage du pic au capteur 2" valeur={`${fr(M.instantPassage(K.x2, K.c), 2)}${NB}s`} couleur={COUL.c2}/>
        <LigneMesure nom="Retard Δt" valeur={`${fr(M.instantPassage(K.x2, K.c) - M.instantPassage(K.x1, K.c), 2)}${NB}s`} couleur={COUL.fin}/>
        <LigneMesure nom="d ÷ Δt" valeur={`${fr(M.celerite(dCapteurs, M.instantPassage(K.x2, K.c) - M.instantPassage(K.x1, K.c)), 1)}${NB}m/s`}/>
        {opt.pointM && <LigneMesure nom="Vitesse maximale d’un point (norme de vec(u))" valeur={`${fr(M.vitesseMax(K.c), 1)}${NB}m/s`} couleur={COUL.vit}/>}
        {opt.vitesse && <LigneMesure nom="Norme de vec(u) en M à cet instant" valeur={`${fr(Math.abs(vM), 2)}${NB}m/s`} couleur={COUL.vit}/>}
      </>}
      {sceneEx === 'seisme' && <>
        <LigneMesure nom="Célérité c" valeur={`${fr(cOnde, 1)}${NB}km/s`}/>
        {STATIONS.map((s, i) => <LigneMesure key={s.id} nom={`Station ${s.id} : d et Δt`} valeur={`${fr(M.dist(Ee, s), 0)}${NB}km · ${fr(dtsEx[i], 1)}${NB}s`} couleur={['#1d4ed8', '#15803d', '#dc2626'][i]}/>)}
      </>}
      {sceneEx === 'milieux' && <>
        {M.MILIEUX.map((m, i) => <LigneMesure key={m.id} nom={`${m.nom[0].toUpperCase()}${m.nom.slice(1)} (c = ${fr(m.c, 0).replace(/\B(?=(\d{3})+(?!\d))/g, NB)}${NB}m/s)`} valeur={`${fr(M.dureesCourse(dCourse)[i] * 1000, dCourse >= 100 ? 0 : 1)}${NB}ms`}/>)}
      </>}
    </div>);
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Une seule bosse</strong> (une impulsion) qui se propage <strong>sans se déformer ni s’amortir</strong> : milieu idéal. Dans un milieu donné, la célérité c est la même partout et tout le temps. Elle est notée c ici (v dans le programme) ; ne pas la confondre avec la célérité de la lumière.</li>
      <li><strong>Instant d’arrivée</strong> : on prend l’instant où le <em>maximum</em> de la bosse arrive en un point. Lecture du retard sur le graphique : incertitude d’environ ± 0,02 s.</li>
      <li><strong>Corde</strong> : l’échelle verticale est agrandie. Les célérités de 2,5 à 6 m/s sont choisies pour l’animation (elles dépendent de la tension et de la masse de la corde).</li>
      <li><strong>Ordres de grandeur</strong> : son dans l’air ≈ 340 m/s à 20 °C (elle varie avec la température), dans l’eau ≈ 1 500 m/s, dans l’acier ≈ 5 900 m/s (onde longitudinale : le son se propage par compressions et dilatations, dans le sens de propagation) ; ondes sismiques P ≈ 6 km/s et S ≈ 3,5 km/s dans la croûte (valeurs moyennes : elles varient avec les roches).</li>
      <li><strong>Séisme</strong> : séisme superficiel, foyer assimilé à l’épicentre ; on suppose connu l’instant du séisme et un milieu homogène, avec des trajets rectilignes. En réalité, la célérité varie avec la profondeur, les trajets sont courbes, et les sismologues localisent un séisme par d’autres méthodes (hors programme).</li>
      <li><strong>Vitesse d’un point et célérité</strong> sont deux grandeurs différentes : la première (vecteur vec(u)) est verticale et varie, la seconde est la vitesse de propagation de la perturbation.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const aEssayer = indicesProfond(
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Corde : changez son état (lâche, tendue). Que devient le retard pour les mêmes capteurs ? Et d ÷ Δt ?</li>
        <li>Corde : affichez la vitesse vec(u) de M. Est-elle jamais égale à la célérité ?</li>
        <li>Séisme : déplacez l’épicentre. Quelle station reçoit l’onde en premier ? Pourquoi ?</li>
        <li>Séisme : passez des ondes P aux ondes S. Que deviennent les durées ?</li>
        <li>Milieux : doublez la distance. Les durées sont-elles doublées dans les trois milieux ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir sansFiche>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>onde = perturbation qui se propage de proche en proche, sans transport de matière</li>
        <li>retard Δt = durée entre le passage en deux points ; célérité c = d ÷ Δt</li>
        <li>distance parcourue : d = c × Δt (localisation d’une source avec trois stations)</li>
        <li>la célérité dépend du milieu : air &lt; eau &lt; acier</li>
      </ul>
    </ARetenir>);

  const sceneBox = sc && (
    <div style={styleBoite}>
      {enExplore && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {[['corde', 'Corde'], ['seisme', 'Séisme'], ['milieux', 'Milieux']].map(([k, l]) => <button key={k} onClick={() => setSceneEx(k)} aria-pressed={sceneEx === k} style={stylePetitBouton(sceneEx === k, '#0369a1')}>{l}</button>)}
        </div>)}
      {enExplore && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6 }}>{sceneEx === 'corde' ? 'Corde : une bosse se propage ; deux capteurs enregistrent son passage.' : sceneEx === 'seisme' ? 'Séisme : trois stations reçoivent l’onde émise par l’épicentre.' : 'Milieux : le même signal sur la même distance dans l’air, l’eau et l’acier.'}</div>}
      {sc === 'corde' && <Corde t={t} c={KE.c} x1={KE.x1} x2={KE.x2} capteurs={avecCapteurs} pointM={avecM} vitesse={avecVitesse}/>}
      {sc === 'corde' && graphe && <div style={{ marginTop: 10 }}>{graphe}</div>}
      {sc === 'carte' && (enDefi && cartePourDefi
        ? <Carte stations={cartePourDefi.st} dts={cartePourDefi.dts} rayons={rayonsDefi} marqueur={marqueurDefi} E={defi.verifie && defi.ok ? defi.E : null}/>
        : enExplore ? <Carte stations={STATIONS} dts={dtsEx} E={Ee} front={frontEx} atteintes={STATIONS.map(s => frontEx >= M.dist(Ee, s) - 1e-9 && t > 0)}/>
          : <Carte stations={STATIONS.slice(0, nStationsGuide)} dts={dtsGuide.slice(0, nStationsGuide)} rayons={rayonsGuide} cand={depuis('epicentre') ? CAND_GUIDE : null} E={reussiEpi ? M.E_DEPART : null}/>)}
      {sc === 'milieux' || sc === 'course' ? <Course t={t} d={dEff} tmax={tmax}/> : null}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
        {sc === 'corde' && boutonLancer('Lancer la perturbation')}
        {(sc === 'milieux' || sc === 'course') && boutonLancer('Lancer la course')}
        {sc === 'carte' && enExplore && boutonLancer('Lancer l’onde')}
        {enExplore && sc !== 'carte' && <span style={{ fontSize: 12.5, color: KIT.txt2 }}>ou réglez le temps avec le curseur.</span>}
      </div>
      {enExplore && <div style={{ marginTop: 8 }}>{sc === 'course'
        ? <Curseur nom="Temps t" valeur={Math.round(t * 1000)} onChange={v => anim.setPos(v / 1000 / tmax)} min={0} max={Math.round(tmax * 1000)} pas={1} unite="ms" decimales={0} couleur="#475569"/>
        : <Curseur nom="Temps t" valeur={Math.round(t * 100) / 100} onChange={v => anim.setPos(v / tmax)} min={0} max={Math.round(tmax * 100) / 100} pas={0.05} unite="s" decimales={2} couleur="#475569"/>}</div>}
      {!enExplore && (reglagesGuide || reglagesDefi || reglagesDefiSource) && <div style={{ marginTop: 10 }}>{reglagesGuide || reglagesDefi || reglagesDefiSource}</div>}
      {sc === 'corde' && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6 }}>L’échelle verticale est agrandie pour que la bosse se voie bien.</div>}
    </div>);

  const colonneReglages = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {reglagesExplore}
      {mesuresExplore}
    </div>);
  const pasDeScene = enDefi && !sc;
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .oc-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .oc-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .oc-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .oc-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .oc-l1.cote .oc-carte { order: 2; } .oc-l1.cote .oc-main { order: 1; } .oc-pri.large { grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); } }
        @media (max-width: 900px) { .oc-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Ondes mécaniques : célérité et retard</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une <strong>perturbation</strong> se propage de proche en proche, avec un <strong>retard</strong> d’un point à l’autre. Mesurez ce retard, calculez la <strong>célérité</strong> c = d ÷ Δt, localisez la source d’une onde et voyez ce que change le milieu.</div>
      <div className={`oc-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {enGuide ? <div className="oc-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="oc-carte">{panneauHypo}</div> : null}
        <div className="oc-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'celerite' ? suiviCel : defi.type === 'distance' ? suiviDis : suiviSrc}/></div>}
          {!pasDeScene && <div className={`oc-pri${enExplore ? ' large' : ''}`}>
            {sceneBox}
            {enExplore && colonneReglages}
          </div>}
        </div>
      </div>
      {(enExplore || (enGuide && etape >= IDS.length - 1)) && <div className="oc-l2">{panneauHypo}</div>}
      {enExplore && <div className="oc-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
