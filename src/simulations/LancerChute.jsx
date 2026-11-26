import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useMemo } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./lancerChuteModele";
import { QCM } from "./lancerChuteQcm";
import { SceneLancer, GrapheEnergies, SvgEnergies, SvgSans, SvgAvec } from "./LancerChuteSchemas";

const SIM_ID = 251, CLE_GUIDE = 'lancerchute-guide-v1';
declarerDefis(SIM_ID, [['courbes', 'Reconnaître les trois courbes'], ['dissipee', 'Travail du frottement sur un vol']]);

// ====================================================
//  SIM 251 — LANCER VERS LE HAUT ET CHUTE : COURBES D'ÉNERGIE (TSTL, enseignement PCM, partie « Énergie mécanique »).
//  Une seule idée : suivre Ec, Epp et Em pendant un lancer vertical ; Em constante sans frottement, qui diminue de W(f) avec frottement.
//  Capacités visées (jamais affichées) : Ec = ½mv², Epp = mgz à une constante près, Em = Ec + Epp, conservation de Em, ΔEm = W(f), lecture de courbes d'énergie.
//  Modèle : lancerChuteModele.js (test node). QCM : lancerChuteQcm.js. Schémas : LancerChuteSchemas.jsx. Situation et valeurs inventées (aucune du Moodle).
// ====================================================
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const moins = s => s.replace('-', '−');
const fmt2 = v => String(Number(Number(v).toPrecision(2))).replace('.', ',');
const PG = M.PARCOURS;
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
const Sel = ({ id, label, valeur, onChange, options }) => (<div style={{ marginBottom: 8 }}>
  <label htmlFor={id} style={libelle}>{label}</label>
  <select id={id} value={valeur} onChange={ev => onChange(ev.target.value)} style={selectStyle}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>);
const OPT_Q = [['', 'Choisir…'], ['Ec', 'Ec (énergie cinétique)'], ['Epp', 'Epp (énergie potentielle de pesanteur)'], ['Em', 'Em (énergie mécanique)']];
const COUL_ANO = ['#0f766e', '#a21caf', '#a16207'];          // couleurs des courbes a, b, c du défi (identiques à celles du graphique)
const ZREF = 3;                                                  // « toit » : origine des altitudes 3 m au-dessus du point de lancement

// ====================================================
export function SimulationLancerChute() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('courbes');
  const [ouv, setOuv] = useState({});
  const [ex, setEx] = useState({ obj: 'tennis', v0: 15, frott: false, ref: 'lancement', u: 0.3 });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  const IDS = ['epp0', 'ec0', 'sommet', 'conserv', 'hmax', 'mi', 'retour', 'frott', 'hfrott', 'wf', 'fin'];
  const etape = guide.etape;
  const idEtape = IDS[Math.min(etape, IDS.length - 1)];
  const deja = id => etape >= IDS.indexOf(id);
  const BALLE = <>Une balle de masse <strong>m = {nbf(PG.m, 2)} kg</strong> est lancée verticalement vers le haut, depuis le sol, à la vitesse <strong>v<sub>0</sub> = {PG.v0} m/s</strong>. On étudie le système « la balle » ; l’origine des altitudes, z = 0, est le point de lancement ; g = 9,8 N/kg.</>;

  const ETAPES = [
    { id: 'epp0', titre: 'L’énergie potentielle au lancement', focus: ['scene'],
      texte: <>{BALLE} On néglige d’abord les frottements de l’air. L’<strong>énergie potentielle de pesanteur</strong> d’un système à l’altitude z est <strong>Epp = m × g × z</strong> : elle est liée à son altitude.</>,
      tache: { type: 'qcm', q: 'Au moment du lancement, l’énergie potentielle de pesanteur de la balle est :', ...QCM.epp0,
        expl: 'Le point de lancement est l’origine des altitudes : z = 0, donc Epp = m × g × 0 = 0 J.', indice: 'Epp = m × g × z : quelle est l’altitude z de la balle au lancement ?' } },
    { id: 'ec0', titre: 'L’énergie cinétique au lancement', focus: ['scene'],
      texte: <>L’<strong>énergie cinétique</strong> d’un système de masse m et de vitesse v est <strong>Ec = ½ × m × v²</strong> : elle est liée à sa vitesse. La balle part avec m = {nbf(PG.m, 2)} kg et v<sub>0</sub> = {PG.v0} m/s.</>,
      tache: { type: 'num', q: 'Énergie cinétique de la balle au lancement, en joules (J)', unite: 'J', vrai: PG.Ec0, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[2 * PG.Ec0, 'Il manque le facteur ½ : Ec = ½ × m × v².'], [0.5 * PG.m * PG.v0, 'La vitesse doit être élevée au carré : Ec = ½ × m × v².']],
        calcul: () => [`Ec = ½ × m × v0² = ½ × ${nbf(PG.m, 2)} × ${PG.v0}² = ${nbf(PG.Ec0, 1)} J, soit 10 J.`],
        expl: 'Ec = ½ × 0,20 × 10² = 10 J.', indice: 'Ec = ½ × m × v², avec v = 10 m/s : calculez d’abord v².' } },
    { id: 'sommet', titre: 'Au sommet de la trajectoire', focus: ['scene'],
      texte: <>La balle monte en ralentissant, puis s’arrête un instant au <strong>sommet</strong> de sa trajectoire avant de retomber. On suit toujours le système « la balle », sans frottement.</>,
      tache: { type: 'qcm', q: 'Au sommet de la trajectoire, l’énergie cinétique de la balle est :', ...QCM.sommet,
        expl: 'Au sommet la balle s’arrête un instant : v = 0, donc Ec = ½ × m × 0² = 0 J.', indice: 'Que vaut la vitesse de la balle à l’instant où elle s’arrête avant de redescendre ?' } },
    { id: 'conserv', titre: 'L’énergie mécanique se conserve', focus: ['scene'],
      retenirTitre: 'À retenir : les trois énergies',
      retenir: <>
        <SvgEnergies/>
        <ul style={puces}>
          <li><strong>Ec = ½ m v²</strong> dépend de la vitesse ; <strong>Epp = m g z</strong> dépend de l’altitude, à une <strong>constante près</strong> (elle dépend du choix de z = 0).</li>
          <li><strong>Em = Ec + Epp</strong> : l’énergie mécanique.</li>
          <li>Moyen de s’en souvenir : <strong>« vitesse : Ec, altitude : Epp, les deux ensemble : Em »</strong>.</li></ul></>,
      texte: <>On définit l’<strong>énergie mécanique</strong> de la balle : <strong>Em = Ec + Epp</strong>. Sans frottement, le poids est la seule force qui travaille : son travail est résistant à la montée et moteur à la descente.</>,
      tache: { type: 'qcm', q: 'Sans frottement, l’énergie mécanique Em de la balle, au cours de tout le vol, est :', ...QCM.conserv,
        expl: 'Em = Ec + Epp reste constante : l’énergie cinétique perdue à la montée est exactement gagnée sous forme d’énergie potentielle (et inversement à la descente).', indice: 'Quelle est la seule force qui travaille, et que fait-elle des énergies Ec et Epp ?' } },
    { id: 'hmax', titre: 'Altitude du sommet', focus: ['scene'],
      texte: <>Au sommet, Ec = 0 : toute l’énergie cinétique du lancement est devenue énergie potentielle, et Em est restée égale à <strong>{nbf(PG.Ec0, 0)} J</strong>. Au sommet, Em = Epp = m × g × z<sub>max</sub>.</>,
      tache: { type: 'num', q: 'Altitude maximale atteinte par la balle, en mètres (m)', unite: 'm', vrai: PG.hMax, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.Ec0 / PG.m, 'Il manque la valeur de g : Epp = m × g × z.'], [PG.Ec0 / M.G, 'Il manque la masse de la balle : Epp = m × g × z.']],
        calcul: () => [`z max = Em ÷ (m × g) = ${nbf(PG.Ec0, 0)} ÷ (${nbf(PG.m, 2)} × 9,8) = ${nbf(PG.hMax, 2)} m, soit 5,1 m.`],
        expl: 'z max = 10 ÷ (0,20 × 9,8) ≈ 5,1 m.', indice: 'Em = Epp = m × g × z au sommet : isolez z.' } },
    { id: 'mi', titre: 'À mi-hauteur', focus: ['scene'],
      texte: <>La balle passe en montant par l’altitude <strong>z = {nbf(PG.zMi, 1)} m</strong>. Em est toujours égale à {nbf(PG.Ec0, 0)} J. À cet instant, Em = Ec + Epp.</>,
      tache: { type: 'num', q: 'Énergie cinétique de la balle à l’altitude z = 2,5 m, en joules (J)', unite: 'J', vrai: PG.EcMi, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.m * M.G * PG.zMi, 'Cette valeur est l’énergie potentielle Epp ; l’énergie cinétique est Em − Epp.'], [PG.Ec0, 'C’est l’énergie mécanique : il faut en retirer l’énergie potentielle.']],
        calcul: () => [`Epp = m × g × z = ${nbf(PG.m, 2)} × 9,8 × 2,5 = 4,9 J ; Ec = Em − Epp = ${nbf(PG.Ec0, 0)} − 4,9 = ${nbf(PG.EcMi, 1)} J.`],
        expl: 'Ec = 10 − 0,20 × 9,8 × 2,5 = 10 − 4,9 = 5,1 J.', indice: 'Calculez Epp = m × g × z à cette altitude, puis Ec = Em − Epp.' } },
    { id: 'retour', titre: 'Le retour au sol', focus: ['scene'],
      texte: <>La balle redescend et revient au sol, au point de lancement (z = 0). On compare cet instant au lancement, toujours sans frottement.</>,
      tache: { type: 'qcm', q: 'Quand la balle revient au sol, sa vitesse est :', ...QCM.retour,
        expl: 'Em est constante et Epp = 0 au sol comme au départ : Ec retrouve sa valeur du lancement, donc la vitesse a la même valeur v0 (de sens opposé).', indice: 'Au sol, z = 0 comme au lancement : que vaut Epp, puis Ec = Em − Epp ?' } },
    { id: 'frott', titre: 'Avec le frottement de l’air', focus: ['scene'],
      retenirTitre: 'À retenir : sans frottement',
      retenir: <>
        <SvgSans/>
        <ul style={puces}>
          <li>Sans frottement, <strong>Em est constante</strong> : Ec et Epp se convertissent l’une en l’autre.</li>
          <li>Ec est maximale au lancement, nulle au sommet ; Epp fait l’inverse.</li>
          <li>Moyen de s’en souvenir : <strong>« ce que Ec perd, Epp le gagne »</strong>.</li></ul></>,
      texte: <>La balle est maintenant plus légère et <strong>l’air exerce sur elle un frottement f</strong>, de sens opposé au mouvement : à la montée comme à la descente. Même lancement : m = {nbf(PG.m, 2)} kg, v<sub>0</sub> = {PG.v0} m/s, depuis le sol. Le frottement est une force qui retire de l’énergie à la balle.</>,
      tache: { type: 'qcm', q: 'Avec le frottement de l’air, l’énergie mécanique de la balle au cours du vol :', ...QCM.frott,
        expl: 'Le frottement est opposé au mouvement : son travail est négatif à la montée comme à la descente. Em ne fait que diminuer : ΔEm = W(f) < 0.', indice: 'Le frottement agit dans le sens du mouvement ou dans le sens opposé ? Quel est le signe de son travail ?' } },
    { id: 'hfrott', titre: 'Un sommet plus bas', focus: ['scene'],
      texte: <>Avec ou sans frottement, la balle est lancée à la même vitesse v<sub>0</sub> = {PG.v0} m/s depuis le sol : son énergie mécanique au lancement vaut {nbf(PG.Ec0, 0)} J dans les deux cas. Sans frottement, elle atteignait <strong>{nbf(PG.hMax, 1)} m</strong>.</>,
      tache: { type: 'qcm', q: 'Avec frottement, l’altitude maximale atteinte est :', ...QCM.hfrott,
        expl: 'Le frottement dissipe de l’énergie dès la montée : au sommet, Em = Epp est plus petite que 10 J, donc z max est plus petite que 5,1 m.', indice: 'Au sommet, Em = Epp = m × g × z : que devient Em à cause du frottement ?' } },
    { id: 'wf', titre: 'L’énergie dissipée', focus: ['scene'],
      texte: <>Avec frottement, la balle (m = {nbf(PG.m, 2)} kg) revient au sol à la vitesse <strong>v<sub>R</sub> = {nbf(PG.vR, 1)} m/s</strong>, au lieu de {PG.v0} m/s. Au sol, aux deux instants, z = 0 : Epp = 0 et Em = Ec. Le <strong>théorème de l’énergie mécanique</strong> s’écrit <strong>ΔEm = W(f)</strong> : la variation de Em est égale au travail de la force de frottement.</>,
      tache: { type: 'num', q: 'Travail de la force de frottement sur le vol complet, en joules (J), avec son signe', unite: 'J', vrai: PG.Wf, tol: 0.03, affiche: v => moins(nbf(v, 1)), cs: 2,
        pieges: [[-PG.Wf, 'Le signe est inversé : le frottement retire de l’énergie, son travail est négatif.'], [2 * PG.Wf, 'Il manque le facteur ½ : Ec = ½ × m × v².'], [0.5 * PG.m * (PG.vR - PG.v0), 'Les vitesses doivent être élevées au carré avant de les soustraire : Ec = ½ × m × v².']],
        calcul: () => [`W(f) = ΔEm = Ec(retour) − Ec(lancement) = ½ × ${nbf(PG.m, 2)} × (${nbf(PG.vR, 1)}² − ${PG.v0}²) = ${moins(nbf(PG.Wf, 1))} J.`],
        expl: 'W(f) = ½ × 0,20 × (8,0² − 10²) = 0,10 × (64 − 100) = −3,6 J.', indice: 'W(f) = Em(retour) − Em(lancement), avec Em = Ec = ½ × m × v² à z = 0.' } },
    { id: 'fin', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : avec frottement',
      retenir: <>
        <SvgAvec/>
        <ul style={puces}>
          <li>Avec frottement, <strong>Em diminue</strong> au cours du vol : <strong>ΔEm = W(f) &lt; 0</strong>. L’énergie perdue est dissipée.</li>
          <li>Au retour au point de lancement, Epp est la même qu’au départ, mais Ec est plus petite : la balle revient moins vite.</li>
          <li>Moyen de s’en souvenir : <strong>« le frottement prend, Em baisse »</strong>.</li></ul></>,
      texte: <>Vous savez suivre Ec, Epp et Em au cours d’un lancer vertical, avec et sans frottement. Explorez en changeant l’objet, la vitesse et le frottement, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  // scène de chaque étape (aucune réponse écrite sur le schéma)
  const SC = {
    epp0: { z: 0, v: PG.v0 }, ec0: { z: 0, v: PG.v0 }, sommet: { z: PG.hMax, v: 0 }, conserv: { z: 3.4, v: 4 }, hmax: { z: PG.hMax, v: 0 },
    mi: { z: PG.zMi, v: 7, cote: '2,5 m' }, retour: { z: 0, v: -PG.v0 }, frott: { z: 2.2, v: 7, frott: true }, hfrott: { z: 2.2, v: 7, frott: true }, wf: { z: 0, v: -PG.vR, frott: true }, fin: { z: 3.4, v: 3, frott: true } };

  // ════════════════ EXPLORATION ════════════════
  const o = M.objet(ex.obj), { obj, v0: vz, frott: fz } = ex;
  const sim = useMemo(() => { const ob = M.objet(obj); return M.vol({ m: ob.m, k: ob.k, v0: vz, frott: fz, n: 120 }); }, [obj, vz, fz]);
  const zRef = ex.ref === 'toit' ? ZREF : 0, k = Math.round(ex.u * (sim.pts.length - 1)), pt = sim.pts[k], e = M.energies(o.m, pt.z, pt.v, zRef), e0 = M.energies(o.m, 0, vz, zRef);
  const hSans = M.hauteurSansFrott(vz);
  const mesures = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures à l’instant choisi</div>
      <LigneMesure nom="Temps écoulé" valeur={`${nbf(pt.t, 2)}${NB}s`}/>
      <LigneMesure nom="Altitude z" valeur={`${nbf(pt.z, 2)}${NB}m`}/>
      <LigneMesure nom="Vitesse" valeur={`${nbf(Math.abs(pt.v), 1)}${NB}m/s (${pt.v > 0.05 ? 'montée' : pt.v < -0.05 ? 'descente' : 'sommet'})`}/>
      <LigneMesure nom="Énergie cinétique Ec" valeur={`${nbf(e.Ec, 2)}${NB}J`} couleur="#0369a1"/>
      <LigneMesure nom="Énergie potentielle Epp" valeur={`${moins(nbf(e.Epp, 2))}${NB}J`} couleur="#b45309"/>
      <LigneMesure nom="Énergie mécanique Em" valeur={`${moins(nbf(e.Em, 2))}${NB}J`} couleur="#6d28d9"/>
      <LigneMesure nom="Altitude maximale du vol" valeur={`${nbf(sim.hMax, 2)}${NB}m`}/>
      {fz && <LigneMesure nom="Em perdue depuis le lancement" valeur={`${nbf(e0.Em - e.Em, 2)}${NB}J`} couleur="#b91c1c"/>}
    </div>);
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <Sel id="lcv-o" label="Objet lancé" valeur={ex.obj} onChange={v => setEx(s => ({ ...s, obj: v }))} options={M.OBJETS.map(x => [x.id, `${x.nom} (${Math.round(x.m * 1000)} g)`])}/>
      <Sel id="lcv-v" label="Vitesse de lancement" valeur={ex.v0} onChange={v => setEx(s => ({ ...s, v0: Number(v) }))} options={[8, 10, 12, 15, 20].map(v => [v, `${v} m/s`])}/>
      <Sel id="lcv-f" label="Frottement de l’air" valeur={ex.frott ? 'avec' : 'sans'} onChange={v => setEx(s => ({ ...s, frott: v === 'avec' }))} options={[['sans', 'négligé (poids seul)'], ['avec', 'pris en compte (force k × v²)']]}/>
      <Sel id="lcv-r" label="Origine z = 0 des altitudes" valeur={ex.ref} onChange={v => setEx(s => ({ ...s, ref: v }))} options={[['lancement', 'au point de lancement'], ['toit', `${ZREF} m au-dessus du point de lancement`]]}/>
      <Curseur nom="Instant du vol" valeur={Math.round(ex.u * 100)} onChange={v => setEx(s => ({ ...s, u: v / 100 }))} min={0} max={100} pas={2} unite="%" decimales={0} couleur="#475569"/>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Déplacez l’instant : la balle, les points du graphique et les mesures suivent. Changer l’origine des altitudes décale Epp et Em, pas Ec.</div>
    </div>);
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{enExplore ? 'La balle pendant le vol' : 'La situation étudiée'}</div>
      {enExplore
        ? <SceneLancer z={pt.z} zEch={Math.max(hSans * 1.08, 1)} v={pt.v} frott={fz} hRef={fz ? hSans : null}/>
        : <SceneLancer {...SC[idEtape]} zEch={5.6}/>}
    </div>);
  const graphe = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Les trois énergies au cours du vol</div>
      <GrapheEnergies pts={sim.pts} m={o.m} zRef={zRef} u={ex.u} em0={fz}/>
    </div>);

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'courbes') { const t = M.tirageDefiA(), ob = M.objet(t.obj), s = M.vol({ m: ob.m, k: ob.k, v0: t.v0, frott: t.frott, n: 60 }); setDefi({ ...t, type, pts: s.pts, reps: { a: '', b: '', c: '' }, verifie: false, corr: false }); }
    else setDefi({ ...M.tirageDefiB(), type, reps: { w: '' }, verifie: false, corr: false });
  };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'courbes') {
      const bons = defi.ordre.map((q, i) => defi.reps['abc'[i]] === q), ok = bons.every(Boolean);
      setDefi(x => ({ ...x, verifie: true, ok, bons })); noterA(ok);
    } else {
      const w = lireNombre(defi.reps.w), ok = isFinite(w) && proche(w, defi.W, 0.05);
      setDefi(x => ({ ...x, verifie: true, ok })); noterB(ok);
    }
  };
  const change = (cle, v) => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: v }, verifie: false, corr: false }));
  const dec = (q, frott) => q === 'Em' ? (frott ? 'cette courbe est la somme de deux autres et elle diminue au cours du vol : c’est l’énergie mécanique Em (le frottement lui retire de l’énergie)' : 'cette courbe ne varie pas du tout : c’est l’énergie mécanique Em, constante sans frottement')
    : q === 'Ec' ? 'cette courbe est maximale au lancement et nulle au sommet (là où la vitesse s’annule) : c’est l’énergie cinétique Ec = ½ m v²'
    : 'cette courbe est nulle au sol (z = 0) et maximale au sommet : c’est l’énergie potentielle Epp = m g z';
  const diagnosticA = () => defi.ordre.map((q, i) => ({ q, i })).filter(({ i }) => !defi.bons[i]).map(({ q, i }) => defi.reps['abc'[i]]
    ? `Courbe ${'abc'[i]} : ${dec(q, defi.frott)}.` : `Courbe ${'abc'[i]} : choisissez la grandeur qu’elle représente.`);
  const diagnosticB = () => {
    const x = defi, w = lireNombre(x.reps.w), mk = x.mg / 1000, a = Math.abs(w), msgs = [];
    if (!isFinite(w)) return ['Écrivez un nombre avec son signe (virgule ou point).'];
    if (proche(w, -x.W, 0.05)) msgs.push('Le signe est inversé : le frottement retire de l’énergie à la balle, son travail est négatif.');
    else if (proche(a, Math.abs(x.W) * 1000, 0.05)) msgs.push('La masse est donnée en grammes : convertissez-la en kilogrammes (÷ 1 000) avant de calculer une énergie en joules.');
    else if (proche(w, 2 * x.W, 0.05)) msgs.push('Il manque le facteur ½ : Ec = ½ × m × v².');
    else if (proche(a, 0.5 * mk * Math.abs(x.v0 - x.vr), 0.05) || proche(a, 0.5 * mk * (x.v0 - x.vr) ** 2, 0.05)) msgs.push('Les vitesses doivent être élevées au carré avant de les soustraire : Ec = ½ × m × v².');
    else if (proche(a, 0.5 * mk * x.v0 ** 2, 0.05)) msgs.push('Vous avez calculé l’énergie cinétique au lancement seulement : W(f) est la variation d’énergie, Ec(retour) − Ec(lancement).');
    else if (proche(a, 0.5 * mk * x.vr ** 2, 0.05)) msgs.push('Vous avez calculé l’énergie cinétique au retour seulement : W(f) est la variation d’énergie, Ec(retour) − Ec(lancement).');
    else msgs.push(`W(f) = ΔEm = ½ × m × (v_R² − v_0²) = ½ × ${nbf(mk, 3)} × (${nbf(x.vr, 1)}² − ${x.v0}²), en J. Votre valeur est ${a > Math.abs(x.W) ? 'trop grande' : 'trop petite'} en valeur absolue.`);
    return msgs;
  };
  const correction = () => defi.type === 'courbes'
    ? `Réponse : ${defi.ordre.map((q, i) => `courbe ${'abc'[i]} = ${q}`).join(', ')}. ${defi.frott ? 'Em diminue au cours du vol (le frottement lui retire de l’énergie)' : 'Em reste constante (pas de frottement)'} ; Ec est nulle au sommet (v = 0) ; Epp est nulle au sol (z = 0) et maximale au sommet.`
    : `W(f) = ΔEm = Ec(retour) − Ec(lancement) = ½ × ${nbf(defi.mg / 1000, 3)} × (${nbf(defi.vr, 1)}² − ${defi.v0}²) = −${fmt2(Math.abs(defi.W))} J (au sol, z = 0 : Em = Ec aux deux instants).`;
  const ob = defi && M.objet(defi.obj);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['courbes', 'Reconnaître les trois courbes'], ['dissipee', 'Travail du frottement sur un vol']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0f766e')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'courbes' ? 'Défi : reconnaître les trois courbes' : 'Défi : travail du frottement sur un vol'}</div>
      {defi.type === 'courbes' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Lancer vertical, depuis le sol (origine des altitudes) : {ob.nom} de {Math.round(ob.m * 1000)}{NB}g, vitesse de lancement {defi.v0}{NB}m/s. {defi.frott ? <>L’air exerce un <strong>frottement</strong>.</> : <>On <strong>néglige</strong> les frottements de l’air.</>} Le graphique ci-dessous donne trois énergies en fonction du temps. Associez à chaque courbe la grandeur qu’elle représente.</div>
        <div style={{ marginBottom: 8 }}><GrapheEnergies pts={defi.pts} m={ob.m} ordre={defi.ordre}/></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 8 }}>
          {['a', 'b', 'c'].map((l, i) => <div key={l}><label htmlFor={`lcv-${l}`} style={{ ...libelle, color: COUL_ANO[i] }}>Courbe {l}</label>
            <select id={`lcv-${l}`} value={defi.reps[l]} onChange={e2 => change(l, e2.target.value)} style={{ ...selectStyle, borderColor: defi.verifie ? (defi.bons[i] ? '#15803d' : '#dc2626') : KIT.bord }}>{OPT_Q.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></div>)}
        </div>
        <IndiceDefi cache={false}>Ec dépend de la vitesse (nulle au sommet) ; Epp dépend de l’altitude (nulle au sol, maximale au sommet) ; Em = Ec + Epp : constante sans frottement, qui diminue avec le frottement.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>On lance verticalement vers le haut, depuis le sol, un objet de masse <strong>{defi.mg} g</strong> ({ob.nom}) à <strong>{defi.v0} m/s</strong>. À cause de l’air, il touche de nouveau le sol à <strong>{nbf(defi.vr, 1)} m/s</strong>. Calculez le travail de la force de frottement sur le vol complet, en joules et avec son signe (2 chiffres significatifs).</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>W(f) (J) =</span>
          <input value={defi.reps.w} aria-label="Travail de la force de frottement en joules, avec son signe" onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('lcv-verif')?.click()} onChange={e2 => change('w', e2.target.value)} inputMode="decimal"
            style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
        </div>
        <IndiceDefi cache={false}>ΔEm = W(f). Au sol (z = 0), Em = Ec = ½ × m × v² aux deux instants ; la masse est en grammes, à convertir en kilogrammes.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="lcv-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        {defi.ok ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct.</div> : <>
          <div style={{ fontWeight: 700, color: '#dc2626' }}>✗ Pas tout à fait.</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: KIT.txt }}>{(defi.type === 'courbes' ? diagnosticA() : diagnosticB()).map((m, i) => <li key={i}>{avecIndices(m)}</li>)}</ul>
          {defi.corr ? <div style={{ ...styleBoite, marginTop: 6, color: KIT.txt }}>{avecIndices(correction())}</div>
            : <button onClick={() => setDefi(x => ({ ...x, corr: true }))} style={{ ...stylePetitBouton(false), marginTop: 6 }}>Voir la correction</button>}
        </>}
      </div>}
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>La balle est un point matériel</strong> en mouvement vertical ; champ de pesanteur uniforme, g = 9,8 N/kg.</li>
      <li><strong>Epp = m × g × z</strong> n’est définie qu’à une constante près : elle dépend de l’origine z = 0 choisie. Seules ses variations ont un sens physique.</li>
      <li><strong>Sans frottement</strong>, le poids est la seule force : Em = Ec + Epp reste constante.</li>
      <li><strong>Avec frottement</strong>, l’air exerce une force de valeur k × v², opposée au mouvement : c’est un modèle (k = 0,0010, 0,0011 et 0,0040 kg/m pour les trois objets). La variation de Em vaut le travail de cette force : ΔEm = W(f) &lt; 0.</li>
      <li><strong>Le calcul du vol</strong> est numérique, par petits pas de temps (0,5 ms) ; l’énergie dissipée (échauffement de l’air et de l’objet) n’est pas détaillée.</li>
      <li><strong>Valeurs inventées</strong> pour la simulation (masses, coefficients k) : ce ne sont pas des mesures.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0f766e')}><Pic n="target"/>Défis</button>
    </span>);

  const aEssayer = (
    <ul style={liste}>
      <li>Sans frottement, déplacez l’instant du vol : que vaut Em à chaque instant ? Et au sommet, que valent Ec et Epp ?</li>
      <li>Passez au frottement avec le ballon en mousse : comparez l’altitude du sommet à la ligne en pointillés (sans frottement).</li>
      <li>Avec frottement, comparez Ec au lancement et Ec au retour : où est passée la différence ?</li>
      <li>Changez l’origine z = 0 des altitudes : quelles courbes bougent, et lesquelles restent identiques ?</li>
      <li>Avec la boule métallique, le frottement est-il important ? Et pour la balle de tennis lancée à 20 m/s ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Ec = ½ m v² ; Epp = m g z (à une constante près) ; Em = Ec + Epp</li>
        <li>Sans frottement, Em est constante : Ec et Epp se convertissent l’une en l’autre</li>
        <li>Avec frottement, Em diminue : ΔEm = W(f) &lt; 0 (énergie dissipée)</li>
        <li>Changer l’origine des altitudes décale Epp et Em, mais pas Ec ni les variations d’énergie</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .lcv-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .lcv-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .lcv-col { display: flex; flex-direction: column; gap: 12px; }
        .lcv-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .lcv-l1.cote .lcv-carte { order: 2; } .lcv-l1.cote .lcv-main { order: 1; }
          .lcv-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .lcv-ex > * { grid-column: 1; }
          .lcv-ex > .lcv-reg { grid-column: 2; grid-row: 1 / span 4; }
        }
        @media (max-width: 900px) { .lcv-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .lcv-in { animation: lcv-fondu 0.35s ease-out; } @keyframes lcv-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Lancer vers le haut et chute : courbes d’énergie</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Suivez <strong>Ec</strong>, <strong>Epp</strong> et <strong>Em</strong> pendant un lancer vertical : Em reste constante sans frottement et diminue du travail du frottement de l’air quand il agit.</div>
      {!enExplore && <div className={`lcv-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="lcv-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="lcv-carte">{panneauHypo}</div>}
        <div className="lcv-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'courbes' ? suiviA : suiviB}/></div>}
          {enGuide && <div className="lcv-col"><div className="lcv-in">{scene}</div></div>}
        </div>
      </div>}
      {enExplore && <>
        <div className="lcv-ex">
          {scene}
          <div className="lcv-reg">{reglages}</div>
          {graphe}
          {mesures}
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('fin'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
