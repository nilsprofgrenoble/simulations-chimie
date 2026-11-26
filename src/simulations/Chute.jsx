import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useMemo } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./rampeModele";
import { QCM } from "./chuteQcm";
import { SceneRampe, GrapheRampe, SvgConserv, SvgIndep, SvgFrott } from "./ChuteSchemas";

const SIM_ID = 261, CLE_GUIDE = 'chute-guide-v1';
declarerDefis(SIM_ID, [['vitesse', 'Vitesse d’arrivée sans frottement'], ['frott', 'Force de frottement moyenne']]);

// ====================================================
//  SIM 261 — CHUTE D'UNE HAUTEUR h : VITESSE D'ARRIVÉE ET FORCE DE FROTTEMENT MOYENNE (TSTL, enseignement PCM, partie « Énergie mécanique »).
//  Une seule idée : bilan d'énergie d'une chute sur une rampe : sans frottement v = √(2 g h) (ni masse ni forme) ; avec frottement ΔEm = W(f) = − f × L.
//  Capacités visées (jamais affichées) : Epp = m g z, conservation de Em, travail du poids ne dépendant que des altitudes, théorème de l'énergie mécanique.
//  Modèle : chuteModele.js (test node). QCM : chuteQcm.js. Schémas : ChuteSchemas.jsx. Situation et valeurs inventées (aucune du Moodle).
// ====================================================
const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const moins = s => s.replace('-', '−');
const PG = M.PARCOURS;
const puces = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const liste = { margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
const selectStyle = { width: '100%', minHeight: 42, padding: '6px 8px', borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, background: 'white', color: KIT.txt };
const libelle = { display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '0 0 3px' };
const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
const Sel = ({ id, label, valeur, onChange, options }) => (<div style={{ marginBottom: 8 }}>
  <label htmlFor={id} style={libelle}>{label}</label>
  <select id={id} value={valeur} onChange={ev => onChange(ev.target.value)} style={selectStyle}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>);

// ====================================================
export function SimulationChute() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('vitesse');
  const [ouv, setOuv] = useState({});
  const [ex, setEx] = useState({ m: 2, h: 5, s: 0.5, f: 0, u: 0.4 });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  const IDS = ['depart', 'epp', 'conserv', 'vitesse', 'masse', 'forme', 'hauteur', 'frott', 'ecfin', 'wf', 'fmoy', 'fin'];
  const etape = guide.etape;
  const idEtape = IDS[Math.min(etape, IDS.length - 1)];
  const deja = id => etape >= IDS.indexOf(id);
  const CAISSE = <>Une caisse de masse <strong>m = {nbf(PG.m, 1)} kg</strong> est lâchée <strong>sans vitesse</strong> du haut d’une rampe de longueur <strong>L = {nbf(PG.L, 0)} m</strong>. Le haut de la rampe est à la hauteur <strong>h = {nbf(PG.h, 1)} m</strong> au-dessus du bas ; l’origine des altitudes, z = 0, est le bas de la rampe ; g = 9,8 N/kg.</>;

  const ETAPES = [
    { id: 'depart', titre: 'Au départ de la rampe', focus: ['scene'],
      texte: <>{CAISSE} On néglige d’abord les frottements. On étudie le système « la caisse » : son <strong>énergie cinétique</strong> est Ec = ½ × m × v² et son <strong>énergie potentielle de pesanteur</strong> est Epp = m × g × z.</>,
      tache: { type: 'qcm', q: 'Au moment du lâcher, l’énergie cinétique de la caisse est :', ...QCM.depart,
        expl: 'La caisse est lâchée sans vitesse : v = 0, donc Ec = ½ × m × 0² = 0 J. Toute son énergie est potentielle.', indice: 'Ec = ½ × m × v² : que vaut la vitesse d’une caisse lâchée sans vitesse ?' } },
    { id: 'epp', titre: 'L’énergie potentielle au départ', focus: ['scene'],
      texte: <>Le haut de la rampe est à l’altitude <strong>z = h = {nbf(PG.h, 1)} m</strong> (l’origine z = 0 est au bas de la rampe). La caisse a pour masse m = {nbf(PG.m, 1)} kg.</>,
      tache: { type: 'num', q: 'Énergie potentielle de pesanteur de la caisse au départ, en joules (J)', unite: 'J', vrai: PG.Epp0, tol: 0.03, affiche: v => nbf(v, 0), cs: 2,
        pieges: [[PG.m * M.G * PG.L, 'L’altitude est la hauteur h = 5,0 m au-dessus du bas, pas la longueur L de la rampe.'], [PG.m * PG.h, 'Il manque la valeur de g : Epp = m × g × z.']],
        calcul: () => [`Epp = m × g × h = ${nbf(PG.m, 1)} × 9,8 × ${nbf(PG.h, 1)} = ${nbf(PG.Epp0, 0)} J, soit 98 J.`], expl: 'Epp = 2,0 × 9,8 × 5,0 = 98 J.', indice: 'Epp = m × g × z avec z = h = 5,0 m.' } },
    { id: 'conserv', titre: 'Une énergie qui se conserve', focus: ['scene'],
      texte: <>La caisse glisse vers le bas : son altitude diminue, sa vitesse augmente. Sans frottement, le poids est la seule force qui travaille (la réaction de la rampe est perpendiculaire au mouvement). L’énergie mécanique est Em = Ec + Epp.</>,
      tache: { type: 'qcm', q: 'Sans frottement, quand la caisse arrive en bas de la rampe (z = 0), son énergie cinétique est :', ...QCM.conserv,
        expl: 'Em = Ec + Epp est conservée : au départ Em = Epp = 98 J ; en bas Epp = 0, donc Ec = 98 J.', indice: 'Em est constante. Au départ Ec = 0 ; en bas Epp = 0 : que vaut Ec en bas ?' } },
    { id: 'vitesse', titre: 'La vitesse en bas', focus: ['scene'],
      texte: <>En bas de la rampe, toute l’énergie potentielle du départ est devenue énergie cinétique : <strong>Ec = {nbf(PG.Epp0, 0)} J</strong>. La masse de la caisse est m = {nbf(PG.m, 1)} kg.</>,
      tache: { type: 'num', q: 'Vitesse de la caisse en bas de la rampe, en m/s', unite: 'm/s', vrai: PG.vSans, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.Epp0 / PG.m, 'Il manque la racine carrée : Ec = ½ × m × v² donne v² = 2 Ec ÷ m, puis v = √(v²).'], [PG.Epp0 * 2 / PG.m / 2, 'Il manque le facteur 2 : v² = 2 × Ec ÷ m.']],
        calcul: () => [`v = √(2 × Ec ÷ m) = √(2 × ${nbf(PG.Epp0, 0)} ÷ ${nbf(PG.m, 1)}) = ${nbf(PG.vSans, 2)} m/s, soit 9,9 m/s.`], expl: 'v = √(2 × 98 ÷ 2,0) = √98 ≈ 9,9 m/s.', indice: 'Ec = ½ × m × v² : isolez v² puis prenez la racine carrée.' } },
    { id: 'masse', titre: 'Une caisse plus lourde', focus: ['scene'],
      retenirTitre: 'À retenir : la vitesse en bas',
      retenir: <>
        <SvgConserv/>
        <ul style={puces}>
          <li>Sans frottement, <strong>m g h = ½ m v²</strong> : <strong>v = √(2 g h)</strong>.</li>
          <li>L’énergie potentielle du départ devient entièrement énergie cinétique.</li>
          <li>Moyen de s’en souvenir : <strong>« Epp en haut, Ec en bas »</strong>.</li></ul></>,
      texte: <>On lâche maintenant, de la même hauteur h = {nbf(PG.h, 1)} m, une caisse de masse <strong>5 fois plus grande</strong> ({nbf(5 * PG.m, 0)} kg). Sans frottement, on compare avec la première caisse.</>,
      tache: { type: 'qcm', q: 'La vitesse de la caisse la plus lourde en bas de la rampe est :', ...QCM.masse,
        expl: 'm g h = ½ m v² : la masse se simplifie, v = √(2 g h) ne dépend que de la hauteur. Les deux caisses arrivent à la même vitesse.', indice: 'Dans m × g × h = ½ × m × v², que devient m ?' } },
    { id: 'forme', titre: 'Une rampe plus longue', focus: ['scene'],
      texte: <>On lâche la première caisse du haut d’une autre rampe : <strong>même hauteur h = {nbf(PG.h, 1)} m</strong>, mais deux fois plus <strong>longue</strong> (donc moins inclinée). Toujours sans frottement.</>,
      tache: { type: 'qcm', q: 'La vitesse de la caisse en bas de la rampe la plus longue, par rapport à la première rampe, est :', ...QCM.forme,
        expl: 'Le travail du poids W(P) = m g (z départ − z arrivée) = m g h ne dépend que de la dénivellation, pas du trajet. Même ΔEc, même vitesse.', indice: 'Le travail du poids dépend de la hauteur h ou de la longueur L du trajet ?' } },
    { id: 'hauteur', titre: 'Lâcher de plus haut', focus: ['scene'],
      texte: <>On lâche la première caisse, sans frottement, d’une hauteur <strong>4 fois plus grande</strong> : h = {nbf(PG.h4, 0)} m au lieu de {nbf(PG.h, 1)} m. En bas de la première rampe elle atteignait {nbf(PG.vSans, 1)} m/s.</>,
      tache: { type: 'qcm', q: 'Sa vitesse en bas est alors :', ...QCM.hauteur,
        expl: 'v = √(2 g h) : la hauteur est multipliée par 4, la vitesse par √4 = 2 (soit 19,8 m/s). C’est l’énergie, et non la vitesse, qui est multipliée par 4.', indice: 'v = √(2 g h) : que devient la racine quand h est multipliée par 4 ?' } },
    { id: 'frott', titre: 'Avec le frottement de la rampe', focus: ['scene'],
      retenirTitre: 'À retenir : ce qui compte',
      retenir: <>
        <SvgIndep/>
        <ul style={puces}>
          <li>Sans frottement, la vitesse en bas ne dépend <strong>ni de la masse ni de la forme</strong> de la rampe.</li>
          <li>Elle ne dépend que de la <strong>hauteur</strong> : <strong>v ∝ √h</strong>.</li>
          <li>Moyen de s’en souvenir : <strong>« seule la hauteur compte »</strong>.</li></ul></>,
      texte: <>La rampe frotte maintenant : elle exerce sur la caisse une <strong>force de frottement f</strong>, supposée constante, opposée au mouvement, le long des {nbf(PG.L, 0)} m de la rampe. Même caisse (m = {nbf(PG.m, 1)} kg), même hauteur h = {nbf(PG.h, 1)} m, lâchée sans vitesse.</>,
      tache: { type: 'qcm', q: 'Avec frottement, la vitesse de la caisse en bas est, par rapport au cas sans frottement :', ...QCM.frott,
        expl: 'Le frottement est opposé au mouvement : son travail est négatif tout le long de la rampe. Em diminue (ΔEm = W(f) < 0) : il reste moins d’énergie pour Ec, donc v est plus petite.', indice: 'Le travail du frottement est-il positif ou négatif ? Que devient Em ?' } },
    { id: 'ecfin', titre: 'L’énergie cinétique mesurée', focus: ['scene'],
      texte: <>On mesure en bas de la rampe la vitesse <strong>v<sub>R</sub> = {nbf(PG.vR, 1)} m/s</strong> (au lieu de {nbf(PG.vSans, 1)} m/s sans frottement). La masse est m = {nbf(PG.m, 1)} kg.</>,
      tache: { type: 'num', q: 'Énergie cinétique de la caisse en bas de la rampe, en joules (J)', unite: 'J', vrai: PG.EcR, tol: 0.03, affiche: v => nbf(v, 0), cs: 2,
        pieges: [[PG.m * PG.vR * PG.vR, 'Il manque le facteur ½ : Ec = ½ × m × v².'], [PG.Epp0, 'C’est l’énergie du départ ; l’énergie cinétique se calcule avec la vitesse mesurée.']],
        calcul: () => [`Ec = ½ × m × v² = ½ × ${nbf(PG.m, 1)} × ${nbf(PG.vR, 1)}² = ${nbf(PG.EcR, 0)} J, soit 64 J.`], expl: 'Ec = ½ × 2,0 × 8,0² = 64 J.', indice: 'Ec = ½ × m × v², avec v = 8,0 m/s.' } },
    { id: 'wf', titre: 'Le travail du frottement', focus: ['scene'],
      texte: <>Au départ Em = Epp = <strong>{nbf(PG.Epp0, 0)} J</strong> ; en bas (z = 0) Em = Ec = <strong>{nbf(PG.EcR, 0)} J</strong>. Le <strong>théorème de l’énergie mécanique</strong> s’écrit <strong>ΔEm = W(f)</strong> : la variation de Em est égale au travail de la force de frottement.</>,
      tache: { type: 'num', q: 'Travail de la force de frottement sur la rampe, en joules (J), avec son signe', unite: 'J', vrai: PG.Wf, tol: 0.03, affiche: v => moins(nbf(v, 0)), cs: 2,
        pieges: [[-PG.Wf, 'Le signe est inversé : le frottement retire de l’énergie, son travail est négatif.'], [PG.EcR, 'C’est l’énergie cinétique d’arrivée ; W(f) est la variation d’énergie mécanique, Em(bas) − Em(haut).']],
        calcul: () => [`W(f) = ΔEm = Em(bas) − Em(haut) = ${nbf(PG.EcR, 0)} − ${nbf(PG.Epp0, 0)} = ${moins(nbf(PG.Wf, 0))} J.`], expl: 'W(f) = 64 − 98 = −34 J.', indice: 'W(f) = Em(bas) − Em(haut) = Ec(bas) − Epp(haut).' } },
    { id: 'fmoy', titre: 'La force de frottement moyenne', focus: ['scene'],
      texte: <>Le travail de la force de frottement est <strong>W(f) = {moins(nbf(PG.Wf, 0))} J</strong>. Pour une force constante f opposée au mouvement, W(f) = − f × (distance parcourue). La caisse parcourt toute la rampe, de longueur L = {nbf(PG.L, 0)} m.</>,
      tache: { type: 'num', q: 'Valeur de la force de frottement, en newtons (N)', unite: 'N', vrai: PG.f, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[-PG.Wf / PG.h, 'Le frottement agit sur la longueur L de la rampe parcourue, pas sur la hauteur h.'], [PG.Wf / PG.L, 'Une force positive : f est la valeur de la force, W(f) = − f × L est négatif.']],
        calcul: () => [`f = − W(f) ÷ L = ${nbf(-PG.Wf, 0)} ÷ ${nbf(PG.L, 0)} = ${nbf(PG.f, 1)} N.`], expl: 'f = 34 ÷ 10 = 3,4 N.', indice: 'W(f) = − f × L : isolez f.' } },
    { id: 'fin', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : avec frottement',
      retenir: <>
        <SvgFrott/>
        <ul style={puces}>
          <li>Avec frottement, <strong>ΔEm = W(f) = − f × L</strong> : Em diminue de l’énergie dissipée.</li>
          <li>Le poids travaille sur la hauteur h, le frottement sur la longueur L parcourue.</li>
          <li>Moyen de s’en souvenir : <strong>« poids : h ; frottement : L »</strong>.</li></ul></>,
      texte: <>Vous savez prévoir la vitesse d’arrivée d’une chute, avec le bilan d’énergie, et en déduire la force de frottement moyenne. Explorez en changeant la masse, la hauteur, la pente et le frottement, ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  // scène de chaque étape (lettres h et L seulement, aucune réponse écrite)
  const SC = {
    depart: { u: 0 }, epp: { u: 0 }, conserv: { u: 0.5, v: 0.6 }, vitesse: { u: 1, v: 1 }, masse: { u: 0.5, v: 0.6 }, forme: { u: 0.5, v: 0.6, h: 5, L: 20 }, hauteur: { u: 0.5, v: 0.8, h: 20, L: 40 },
    frott: { u: 0.5, v: 0.4, frott: true }, ecfin: { u: 1, v: 0.8, frott: true }, wf: { u: 1, v: 0.8, frott: true }, fmoy: { u: 0.6, v: 0.5, frott: true }, fin: { u: 0.6, v: 0.5, frott: true } };

  // ════════════════ EXPLORATION ════════════════
  const { m: mz, h: hz, s: sz, f: fz } = ex, Lz = hz / sz;
  const pr = useMemo(() => M.profil({ m: mz, h: hz, L: hz / sz, f: fz, n: 60 }), [mz, hz, sz, fz]);
  const k = Math.round(ex.u * (pr.pts.length - 1)), pt = pr.pts[k], Ed = M.energiePot(mz, hz) - pt.Em;
  const mesures = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures à l’instant choisi</div>
      <LigneMesure nom="Longueur de la rampe L" valeur={`${nbf(Lz, 1)}${NB}m`}/>
      <LigneMesure nom="Distance parcourue" valeur={`${nbf(pt.s, 1)}${NB}m`}/>
      <LigneMesure nom="Altitude z" valeur={`${nbf(pt.z, 2)}${NB}m`}/>
      <LigneMesure nom="Vitesse" valeur={`${nbf(pt.v, 1)}${NB}m/s`}/>
      <LigneMesure nom="Énergie potentielle Epp" valeur={`${nbf(pt.Epp, 1)}${NB}J`} couleur="#b45309"/>
      <LigneMesure nom="Énergie cinétique Ec" valeur={`${nbf(pt.Ec, 1)}${NB}J`} couleur="#0369a1"/>
      <LigneMesure nom="Énergie mécanique Em" valeur={`${nbf(pt.Em, 1)}${NB}J`} couleur="#6d28d9"/>
      {fz > 0 && pr.glisse && <LigneMesure nom="Énergie dissipée depuis le départ" valeur={`${nbf(Ed, 1)}${NB}J`} couleur="#b91c1c"/>}
    </div>);
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <Sel id="chh-m" label="Masse de l’objet" valeur={ex.m} onChange={v => setEx(s => ({ ...s, m: Number(v) }))} options={[1, 2, 5, 10].map(v => [v, `${v} kg`])}/>
      <Sel id="chh-h" label="Hauteur de départ h" valeur={ex.h} onChange={v => setEx(s => ({ ...s, h: Number(v) }))} options={[2, 5, 10, 20].map(v => [v, `${v} m`])}/>
      <Sel id="chh-s" label="Inclinaison de la rampe" valeur={ex.s} onChange={v => setEx(s => ({ ...s, s: Number(v) }))} options={[[0.2, 'douce (rampe longue)'], [0.5, 'moyenne'], [0.8, 'raide (rampe courte)']]}/>
      <Sel id="chh-f" label="Force de frottement" valeur={ex.f} onChange={v => setEx(s => ({ ...s, f: Number(v) }))} options={[[0, 'aucune (frottement négligé)'], [1, '1 N'], [3, '3 N'], [8, '8 N']]}/>
      <Curseur nom="Avancée sur la rampe" valeur={Math.round(ex.u * 100)} onChange={v => setEx(s => ({ ...s, u: v / 100 }))} min={0} max={100} pas={2} unite="%" decimales={0} couleur="#475569"/>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Faites glisser l’objet : les points du graphique et les mesures suivent. Changez un réglage à la fois (masse, forme de la rampe, hauteur, frottement) et regardez la vitesse en bas.</div>
    </div>);
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{enExplore ? 'La caisse sur sa rampe' : 'La situation étudiée'}</div>
      {enExplore
        ? <SceneRampe u={pr.glisse ? ex.u : 0} h={hz} L={Lz} v={pr.glisse ? Math.min(1, pt.v / 16) : 0} frott={fz > 0}/>
        : <SceneRampe {...SC[idEtape]}/>}
    </div>);
  const graphe = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Les trois énergies pendant la descente</div>
      {pr.glisse ? <GrapheRampe pr={pr} u={ex.u}/> : <div style={{ ...lbl, color: '#b91c1c', fontWeight: 700 }}>L’objet ne glisse pas : le frottement est trop grand pour cette inclinaison (la composante du poids le long de la rampe est plus petite que f).</div>}
    </div>);

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => {
    if (type === 'vitesse') setDefi({ ...M.tirageDefiA(), type, reps: { v: '' }, verifie: false, corr: false });
    else setDefi({ ...M.tirageDefiB(), type, reps: { f: '' }, verifie: false, corr: false });
  };
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'vitesse') { const v = lireNombre(defi.reps.v), ok = isFinite(v) && proche(v, defi.v, 0.06); setDefi(x => ({ ...x, verifie: true, ok })); noterA(ok); }
    else { const f = lireNombre(defi.reps.f), ok = isFinite(f) && proche(f, defi.f, 0.06); setDefi(x => ({ ...x, verifie: true, ok })); noterB(ok); }
  };
  const change = (cle, v) => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: v }, verifie: false, corr: false }));
  const diagnosticA = () => {
    const x = defi, v = lireNombre(x.reps.v), msgs = [];
    if (!isFinite(v)) return ['Écrivez un nombre (virgule ou point), en m/s.'];
    if (proche(v, 2 * M.G * x.h, 0.05)) msgs.push('Il manque la racine carrée : m g h = ½ m v² donne v² = 2 g h, puis v = √(2 g h).');
    else if (proche(v, Math.sqrt(M.G * x.h), 0.05)) msgs.push('Il manque le facteur 2 : v² = 2 × g × h.');
    else if (proche(v, Math.sqrt(2 * M.G * x.L), 0.05)) msgs.push('C’est la hauteur h qui compte (travail du poids), pas la longueur L de la rampe.');
    else if (proche(v, Math.sqrt(2 * x.m * M.G * x.h), 0.05)) msgs.push('La masse se simplifie dans m g h = ½ m v² : elle ne doit pas apparaître dans v.');
    else msgs.push(`Refaites le calcul : v = √(2 × g × h) = √(2 × 9,8 × ${x.h}). Votre valeur est ${v > x.v ? 'trop grande' : 'trop petite'}.`);
    return msgs;
  };
  const diagnosticB = () => {
    const x = defi, f = lireNombre(x.reps.f), Ep = x.m * M.G * x.h, Ec = M.energieCin(x.m, x.vR), msgs = [];
    if (!isFinite(f)) return ['Écrivez un nombre (virgule ou point), en N.'];
    if (proche(f, (Ep - Ec) / x.h, 0.05)) msgs.push('Le frottement agit sur toute la longueur L de la rampe, pas sur la hauteur h : divisez l’énergie dissipée par L.');
    else if (proche(f, (Ep - 2 * Ec) / x.L, 0.05)) msgs.push('Ec = ½ × m × v² : n’oubliez pas le facteur ½ dans l’énergie cinétique d’arrivée.');
    else if (proche(f, Ec / x.L, 0.05) || proche(f, Ep / x.L, 0.05)) msgs.push('L’énergie dissipée est la différence Epp − Ec, pas l’une des deux énergies seule.');
    else if (proche(f, (Ep - x.m * x.vR) / x.L, 0.05) || proche(f, (Ep - 0.5 * x.m * x.vR) / x.L, 0.05)) msgs.push('La vitesse doit être élevée au carré : Ec = ½ × m × v².');
    else msgs.push(`Refaites le calcul : Epp = m g h = ${nbf(Ep, 1)} J ; Ec = ½ × ${nbf(x.m, 1)} × ${nbf(x.vR, 1)}² = ${nbf(Ec, 1)} J ; f = (Epp − Ec) ÷ L. Votre valeur est ${f > x.f ? 'trop grande' : 'trop petite'}.`);
    return msgs;
  };
  const correction = () => defi.type === 'vitesse'
    ? `m g h = ½ m v² donne v = √(2 g h) = √(2 × 9,8 × ${defi.h}) = ${nbf(defi.v, 1)} m/s (la masse et la longueur de la rampe ne servent pas).`
    : `Epp = m g h = ${nbf(defi.m * M.G * defi.h, 1)} J ; Ec = ½ m v² = ${nbf(M.energieCin(defi.m, defi.vR), 1)} J ; énergie dissipée = ${nbf(defi.m * M.G * defi.h - M.energieCin(defi.m, defi.vR), 1)} J ; f = énergie dissipée ÷ L = ${nbf(defi.f, 2)} N.`;
  const champ = (cle, aria, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{unite}</span>
      <input value={defi.reps[cle]} aria-label={aria} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('chh-verif')?.click()} onChange={e2 => change(cle, e2.target.value)} inputMode="decimal"
        style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['vitesse', 'Vitesse d’arrivée'], ['frott', 'Force de frottement']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t === 'frott' ? 'frott' : t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0f766e')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'vitesse' ? 'Défi : vitesse d’arrivée sans frottement' : 'Défi : force de frottement moyenne'}</div>
      {defi.type === 'vitesse' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un objet de masse <strong>{nbf(defi.m, 1)} kg</strong> est lâché sans vitesse du haut d’une rampe de longueur <strong>{defi.L} m</strong>, dont le haut est à la hauteur <strong>{defi.h} m</strong> au-dessus du bas. On néglige les frottements. Calculez sa vitesse en bas de la rampe, en m/s (2 chiffres significatifs).</div>
        {champ('v', 'Vitesse d’arrivée en mètres par seconde', 'v (m/s) =')}
        <IndiceDefi cache={false}>Sans frottement, Em est conservée : m g h = ½ m v². Simplifiez par m, puis isolez v (racine carrée). Certaines données ne servent pas.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un objet de masse <strong>{nbf(defi.m, 1)} kg</strong> est lâché sans vitesse du haut d’une rampe de longueur <strong>{defi.L} m</strong>, dont le haut est à <strong>{defi.h} m</strong> au-dessus du bas. Il arrive en bas à la vitesse <strong>{nbf(defi.vR, 1)} m/s</strong> : la rampe exerce un frottement, supposé constant. Calculez la valeur de la force de frottement, en newtons (2 chiffres significatifs).</div>
        {champ('f', 'Force de frottement en newtons', 'f (N) =')}
        <IndiceDefi cache={false}>ΔEm = W(f) : l’énergie dissipée est Epp(départ) − Ec(arrivée). Puis W(f) = − f × L, avec L la longueur de la rampe.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="chh-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        {defi.ok ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct.</div> : <>
          <div style={{ fontWeight: 700, color: '#dc2626' }}>✗ Pas tout à fait.</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: KIT.txt }}>{(defi.type === 'vitesse' ? diagnosticA() : diagnosticB()).map((m, i) => <li key={i}>{avecIndices(m)}</li>)}</ul>
          {defi.corr ? <div style={{ ...styleBoite, marginTop: 6, color: KIT.txt }}>{avecIndices(correction())}</div>
            : <button onClick={() => setDefi(x => ({ ...x, corr: true }))} style={{ ...stylePetitBouton(false), marginTop: 6 }}>Voir la correction</button>}
        </>}
      </div>}
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>L’objet est un point matériel</strong> qui glisse sans rouler sur une rampe rectiligne ; g = 9,8 N/kg ; l’origine des altitudes est le bas de la rampe.</li>
      <li><strong>Sans frottement</strong>, seul le poids travaille (la réaction de la rampe est perpendiculaire au mouvement) : Em = Ec + Epp est conservée et v = √(2 g h).</li>
      <li><strong>Le travail du poids ne dépend que de la dénivellation</strong> : W(P) = m g (z<sub>départ</sub> − z<sub>arrivée</sub>), quelle que soit la forme du trajet.</li>
      <li><strong>Le frottement est supposé constant</strong> et parallèle à la rampe : son travail vaut − f × L. Dans la réalité, il varie avec la vitesse et l’état des surfaces : f est une valeur moyenne.</li>
      <li><strong>Valeurs inventées</strong> pour la simulation (masses, hauteurs, forces de frottement) : ce ne sont pas des mesures.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0f766e')}><Pic n="target"/>Défis</button>
    </span>);
  const aEssayer = (
    <ul style={liste}>
      <li>Sans frottement, changez la masse puis l’inclinaison de la rampe : que devient la vitesse en bas ?</li>
      <li>Doublez la hauteur : par combien la vitesse est-elle multipliée ? Et pour une hauteur multipliée par 4 (5 m → 20 m) ?</li>
      <li>Ajoutez un frottement de 3 N : comparez Em au départ et en bas. Où est passée la différence ?</li>
      <li>Avec le même frottement, une rampe douce (longue) dissipe-t-elle plus ou moins d’énergie qu’une rampe raide (courte) ?</li>
      <li>Choisissez la rampe douce avec 8 N de frottement : que se passe-t-il ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Sans frottement : m g h = ½ m v², donc v = √(2 g h) (ni masse ni forme du trajet)</li>
        <li>Le travail du poids ne dépend que de la hauteur h</li>
        <li>Avec frottement : ΔEm = W(f) = − f × L, Em diminue</li>
        <li>L est la longueur parcourue sur la rampe, h la hauteur</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .chh-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .chh-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .chh-col { display: flex; flex-direction: column; gap: 12px; }
        .chh-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .chh-l1.cote .chh-carte { order: 2; } .chh-l1.cote .chh-main { order: 1; }
          .chh-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .chh-ex > * { grid-column: 1; }
          .chh-ex > .chh-reg { grid-column: 2; grid-row: 1 / span 4; }
        }
        @media (max-width: 900px) { .chh-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .chh-in { animation: chh-fondu 0.35s ease-out; } @keyframes chh-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Chute d’une hauteur h : vitesse d’arrivée et force de frottement moyenne</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un objet glisse du haut d’une rampe : le bilan d’énergie donne sa <strong>vitesse en bas</strong> et, s’il frotte, la <strong>force de frottement moyenne</strong>.</div>
      {!enExplore && <div className={`chh-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="chh-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="chh-carte">{panneauHypo}</div>}
        <div className="chh-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'vitesse' ? suiviA : suiviB}/></div>}
          {enGuide && <div className="chh-col"><div className="chh-in">{scene}</div></div>}
        </div>
      </div>}
      {enExplore && <>
        <div className="chh-ex">
          {scene}
          <div className="chh-reg">{reglages}</div>
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
