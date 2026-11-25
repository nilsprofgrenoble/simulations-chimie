import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, lireNombre, proche, ARetenir, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./formesModele";
import { QCM } from "./formesQcm";
import { SceneFormes, SvgEc, SvgConv, SvgU, SvgEtot } from "./FormesSchemas";

const SIM_ID = 243, CLE_GUIDE = 'formes-guide-v1';
declarerDefis(SIM_ID, [['glisse', 'Le bloc qui ralentit'], ['chute', 'La bille en chute']]);

// ====================================================
//  SIM 243 — FORMES D'ÉNERGIE STOCKÉE : CINÉTIQUE, POTENTIELLE, INTERNE (TSTL, enseignement PCM, partie « Énergie »).
//  Une seule idée : un système stocke de l'énergie sous trois formes (Ec, Ep, U) dont la somme est l'énergie totale ; l'énergie change de forme (Ec ↔ Ep, Ec → U) sans que l'énergie totale varie, sauf transfert reçu.
//  Aucune situation du Moodle : bille en chute, bloc qui glisse, eau chauffée au repos (valeurs inventées). Ep de pesanteur donnée, sans formule (vue à la séquence suivante).
//  Capacités visées (jamais affichées) : identifier les formes d'énergie stockée ; Ec = ½mv² ; Etot = Ec + Ep + U ; changement de forme ; conservation de l'énergie.
//  Modèle : formesModele.js (test node). QCM : formesQcm.js. Schémas : FormesSchemas.jsx.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const fmt2 = v => String(Number(Number(v).toPrecision(2))).replace('.', ',');
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#475569', violet: '#6d28d9' };
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
export function SimulationFormes() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviA, noterA] = useCompteurDefi(), [suiviB, noterB] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('glisse');
  const [ouv, setOuv] = useState({});
  const [ti, setTi] = useState({ sit: 'chute', p: 0.5, m: 0.5, H: 2, v0: 3, Q: 800 });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const bascule = k => setOuv(o => ({ ...o, [k]: !o[k] }));

  const IDS = ['cine', 'vitesse', 'epot', 'chute', 'conv', 'interne', 'frot', 'chauff', 'total', 'fin'];
  const etape = guide.etape;
  const deja = id => !enGuide || etape >= IDS.indexOf(id);
  const idEtape = IDS[Math.min(etape, IDS.length - 1)];

  const ETAPES = [
    { id: 'cine', titre: 'L’énergie du mouvement', focus: ['scene'],
      texte: <>Un système peut <strong>stocker de l’énergie</strong> sous plusieurs formes. La première, vue en première, est l’<strong>énergie cinétique</strong> : celle que stocke un système du fait de son <strong>mouvement</strong>. Pour un système de masse <strong>m</strong> (en kg) animé d’une vitesse <strong>v</strong> (en m/s) : <strong>Ec = ½ × m × v²</strong>, en joules. Un bloc de masse <strong>m = {nbf(PG.glisse.m, 1)} kg</strong> glisse à la vitesse <strong>v = {nbf(PG.glisse.v0, 1)} m/s</strong>.</>,
      tache: { type: 'num', q: 'Énergie cinétique du bloc, en joules (J)', unite: 'J', vrai: PG.Ec0, tol: 0.02, affiche: v => nbf(v, 1), cs: 2,
        pieges: [[PG.glisse.m * PG.glisse.v0 ** 2, 'Il manque le facteur ½ : Ec = ½ × m × v².'], [0.5 * PG.glisse.m * PG.glisse.v0, 'La vitesse doit être élevée au carré : Ec = ½ × m × v².'], [PG.glisse.m * PG.glisse.v0, 'Il faut élever la vitesse au carré et multiplier par ½.']],
        calcul: () => [`Ec = ½ × m × v² = ½ × ${nbf(PG.glisse.m, 1)} × ${nbf(PG.glisse.v0, 1)}² = ${nbf(PG.Ec0, 1)} J.`],
        expl: `Ec = ½ × ${nbf(PG.glisse.m, 1)} × ${nbf(PG.glisse.v0, 1)}² = ${nbf(PG.Ec0, 1)} J.`, indice: 'Élevez d’abord la vitesse au carré, multipliez par la masse, puis par ½.' } },
    { id: 'vitesse', titre: 'Si la vitesse double', focus: ['scene'],
      texte: <>Le bloc de masse {nbf(PG.glisse.m, 1)} kg stocke <strong>{nbf(PG.Ec0, 1)} J</strong> d’énergie cinétique à {nbf(PG.glisse.v0, 1)} m/s. Imaginons maintenant qu’il aille <strong>deux fois plus vite</strong>, à {nbf(2 * PG.glisse.v0, 1)} m/s.</>,
      tache: { type: 'qcm', q: 'Que devient son énergie cinétique ?', ...QCM.vitesse,
        expl: 'Ec = ½ m v² dépend du carré de la vitesse : si v est multipliée par 2, Ec est multipliée par 2² = 4 (ici 36 J).', indice: 'Dans la formule, la vitesse est élevée au carré. Que devient 2² ?' } },
    { id: 'epot', titre: 'L’énergie de position', focus: ['scene'],
      retenirTitre: 'À retenir : l’énergie cinétique',
      retenir: <>
        <SvgEc/>
        <ul style={puces}>
          <li>L’<strong>énergie cinétique</strong> est stockée du fait du <strong>mouvement</strong> : Ec = ½ m v².</li>
          <li>Elle dépend de la masse et du <strong>carré</strong> de la vitesse, et du référentiel d’étude.</li>
          <li>Moyen de s’en souvenir : <strong>« ½ m v au carré »</strong>.</li>
        </ul></>,
      texte: <>Une <strong>bille</strong> de masse {nbf(PG.chute.m, 2)} kg est tenue <strong>immobile à {nbf(PG.chute.H, 1)} m du sol</strong>. Un système stocke de l’<strong>énergie potentielle</strong> du fait de ses <strong>interactions avec l’extérieur</strong> (ici avec la Terre) : cette énergie peut se transformer en énergie cinétique. On se limite aux énergies cinétique et potentielle.</>,
      tache: { type: 'qcm', q: 'Quelle énergie la bille immobile stocke-t-elle ?', ...QCM.epot,
        expl: 'Immobile, la bille n’a pas d’énergie cinétique (v = 0). Mais elle interagit avec la Terre et peut tomber : elle stocke de l’énergie potentielle.', indice: 'Que vaut Ec si v = 0 ? La bille peut-elle tomber si on la lâche ?' } },
    { id: 'chute', titre: 'Une énergie qui change de forme', focus: ['scene'],
      texte: <>On <strong>lâche</strong> la bille sans vitesse. On néglige les frottements : l’énergie interne ne varie pas. Au fil de la chute, la bille accélère et se rapproche du sol.</>,
      tache: { type: 'qcm', q: 'Comment évoluent les énergies potentielle et cinétique pendant la chute ?', ...QCM.chute,
        expl: 'La bille accélère : son énergie cinétique augmente. Elle descend : son énergie potentielle diminue. L’énergie change de forme.', indice: 'La vitesse de la bille augmente-t-elle ou diminue-t-elle ? Et sa hauteur ?' } },
    { id: 'conv', titre: 'Le bilan à mi-chute', focus: ['scene'],
      texte: <>Au départ, la bille stocke <strong>Ep = {nbf(PG.Ep0, 1)} J</strong> et aucune énergie cinétique. À mi-chute, son énergie potentielle a diminué de 4,9 J : <strong>ΔEp = −4,9 J</strong>. Sans frottement, l’énergie interne ne varie pas (<strong>ΔU = 0</strong>) et l’énergie totale se conserve : <strong>ΔEc + ΔEp + ΔU = 0</strong>.</>,
      tache: { type: 'num', q: 'Variation d’énergie cinétique ΔEc de la bille, en joules (J)', unite: 'J', vrai: -PG.dEpMi, tol: 0.02, affiche: v => '+' + nbf(v, 1), cs: 2,
        pieges: [[PG.dEpMi, 'Le signe est inversé : la bille accélère, son énergie cinétique augmente, ΔEc est positive.'], [PG.Ep0, 'Cette valeur est l’énergie potentielle au départ ; on cherche la variation d’énergie cinétique à mi-chute.']],
        calcul: () => ['ΔEc = −ΔEp − ΔU = −(−4,9) − 0 = +4,9 J.'],
        expl: 'ΔEc = −ΔEp − ΔU = +4,9 J.', indice: 'ΔEc + ΔEp + ΔU = 0, avec ΔEp = −4,9 J et ΔU = 0 : isolez ΔEc.' } },
    { id: 'interne', titre: 'Quand les frottements s’en mêlent', focus: ['scene'],
      retenirTitre: 'À retenir : Ec et Ep changent de forme',
      retenir: <>
        <SvgConv/>
        <ul style={puces}>
          <li>Pendant une chute <strong>sans frottement</strong>, l’énergie potentielle perdue est gagnée en énergie cinétique.</li>
          <li>Exemple : ΔEp = −6 J donne ΔEc = +6 J, car ΔEc + ΔEp = 0.</li>
          <li>Moyen de s’en souvenir : <strong>« ce que Ep perd, Ec le gagne »</strong>.</li>
        </ul></>,
      texte: <>Revenons au <strong>bloc</strong> de {nbf(PG.glisse.m, 1)} kg qui glisse sur un <strong>sol horizontal</strong> : l’énergie potentielle ne varie pas. À cause des <strong>frottements</strong>, le bloc ralentit puis s’arrête. Le système « bloc et sol » n’échange aucune énergie avec l’extérieur.</>,
      tache: { type: 'qcm', q: 'Où est passée l’énergie cinétique du bloc ?', ...QCM.interne,
        expl: 'L’énergie ne disparaît pas : l’énergie cinétique perdue devient de l’énergie interne du bloc et du sol, qui s’échauffent légèrement.', indice: 'Que constate-t-on au toucher sur les deux surfaces qui ont frotté ?' } },
    { id: 'frot', titre: 'Combien d’énergie interne ?', focus: ['scene'],
      texte: <>Le bloc de {nbf(PG.glisse.m, 1)} kg ralentit de <strong>{nbf(PG.glisse.v0, 1)} m/s</strong> à <strong>{nbf(PG.glisse.v1, 1)} m/s</strong>. Son énergie cinétique initiale valait <strong>{nbf(PG.Ec0, 1)} J</strong>. Comme ΔEp = 0 et que le système « bloc et sol » est isolé : <strong>ΔEc + ΔU = 0</strong>.</>,
      tache: { type: 'num', q: 'Énergie interne gagnée ΔU par le bloc et le sol, en joules (J)', unite: 'J', vrai: PG.dUfrot, tol: 0.02, affiche: v => '+' + nbf(v, 1), cs: 2,
        pieges: [[PG.Ec0, 'Il faut aussi tenir compte de l’énergie cinétique qui reste au bloc : ΔEc = Ec finale − Ec initiale.'], [-PG.dUfrot, 'Le signe est inversé : l’énergie interne augmente, ΔU est positive.'], [ M.ec(PG.glisse.m, PG.glisse.v1), 'Cette valeur est l’énergie cinétique finale ; ΔU est la perte d’énergie cinétique.']],
        calcul: () => [`Ec finale = ½ × ${nbf(PG.glisse.m, 1)} × ${nbf(PG.glisse.v1, 1)}² = ${nbf(M.ec(PG.glisse.m, PG.glisse.v1), 1)} J ; ΔEc = ${nbf(M.ec(PG.glisse.m, PG.glisse.v1), 1)} − ${nbf(PG.Ec0, 1)} = −${nbf(PG.dUfrot, 1)} J ; ΔU = −ΔEc = +${nbf(PG.dUfrot, 1)} J.`],
        expl: `ΔU = ${nbf(PG.Ec0, 1)} − ${nbf(M.ec(PG.glisse.m, PG.glisse.v1), 1)} = +${nbf(PG.dUfrot, 1)} J.`, indice: 'Calculez Ec finale = ½ m v² à 1,0 m/s, puis ΔU = Ec initiale − Ec finale.' } },
    { id: 'chauff', titre: 'Chauffer sans bouger', focus: ['scene'],
      texte: <>Une cuve contenant <strong>0,20 kg d’eau</strong>, immobile, est chauffée par en dessous. L’eau reçoit un <strong>transfert thermique</strong> ; elle ne change ni de vitesse ni de hauteur, et reste liquide.</>,
      tache: { type: 'qcm', q: 'Quelle énergie stockée l’eau voit-elle varier ?', ...QCM.chauffe,
        expl: 'Sans mouvement ni changement de hauteur, ni Ec ni Ep ne varient : l’énergie reçue est stockée sous forme d’énergie interne, et la température monte.', indice: 'Ec et Ep varient-elles si l’eau ne bouge pas et ne change pas de hauteur ?' } },
    { id: 'total', titre: 'L’énergie totale', focus: ['scene'],
      retenirTitre: 'À retenir : l’énergie interne',
      retenir: <>
        <SvgU/>
        <ul style={puces}>
          <li>L’<strong>énergie interne U</strong> est la somme des énergies des particules, à l’échelle microscopique : thermique (agitation), chimique, nucléaire…</li>
          <li>Exemple : un frottement ou un transfert thermique reçu fait monter la température, donc U.</li>
          <li>Moyen de s’en souvenir : <strong>« U = énergie cachée dans la matière »</strong>.</li>
        </ul></>,
      texte: <>L’énergie totale stockée par un système est la somme des trois formes : <strong>Etot = Ec + Ep + U</strong>. Reprenons le système isolé « bloc et sol » qui ralentit : son énergie cinétique diminue, son énergie interne augmente, son énergie potentielle ne varie pas.</>,
      tache: { type: 'qcm', q: 'Que peut-on dire de l’énergie totale de ce système isolé ?', ...QCM.total,
        expl: 'Un système qui n’échange rien avec l’extérieur conserve son énergie totale : Ec + Ep + U est constante, même si chaque forme varie.', indice: 'Ce que perd l’énergie cinétique, l’énergie interne le gagne : que devient la somme ?' } },
    { id: 'fin', titre: 'Bilan', focus: [],
      retenirTitre: 'À retenir : l’énergie totale',
      retenir: <>
        <SvgEtot/>
        <ul style={puces}>
          <li><strong>Etot = Ec + Ep + U</strong> : mouvement, interactions avec l’extérieur, énergie microscopique.</li>
          <li>Exemple : un système isolé qui perd 5 J d’énergie cinétique en gagne 5 J en énergie interne.</li>
          <li>Moyen de s’en souvenir : <strong>« trois réservoirs, une somme »</strong>.</li>
        </ul></>,
      texte: <>Vous savez que l’énergie stockée prend trois formes (cinétique, potentielle, interne), que l’énergie change de forme au cours d’une transformation, et que l’énergie totale ne varie que par les transferts reçus ou cédés. Explorez les trois situations ou relevez les défis.</> },
  ];
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ---------- scène du parcours ----------
  const gl = { m: PG.glisse.m, v0: PG.glisse.v0 }, ch = { m: PG.chute.m, H: PG.chute.H };
  const sceneGuide = (() => {
    if (idEtape === 'cine' || idEtape === 'vitesse') return { sit: 'glisse', p: 0, o: gl, bars: false };
    if (idEtape === 'epot') return { sit: 'chute', p: 0, o: ch, bars: false };
    if (idEtape === 'chute' || idEtape === 'conv') return { sit: 'chute', p: 0.5, o: ch, bars: false };
    if (idEtape === 'interne' || idEtape === 'frot' || idEtape === 'total') return { sit: 'glisse', p: 2 / 3, o: gl, bars: false };
    if (idEtape === 'chauff') return { sit: 'chauffe', p: 0.5, o: { m: 0.2, Q: 800 }, bars: false };
    return { sit: 'chute', p: 0.5, o: ch, bars: true };
  })();
  const sceneProps = (() => {
    if (enExplore) {
      const o = ti.sit === 'chute' ? { m: ti.m, H: ti.H } : ti.sit === 'glisse' ? { m: ti.m, v0: ti.v0 } : { m: 0.2, Q: ti.Q };
      return { sit: ti.sit, p: ti.p, o, bars: true, vals: true };
    }
    return { ...sceneGuide, vals: true };
  })();
  const eS = M.etat(sceneProps.sit, sceneProps.p, sceneProps.o);

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = type => setDefi(type === 'glisse' ? { ...M.tirageDefiA(), reps: { a: '', u: '' }, verifie: false, corr: false } : { ...M.tirageDefiB(), reps: { c: '', v: '' }, verifie: false, corr: false });
  function changerMode(md) { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const verifier = () => {
    if (defi.type === 'glisse') {
      const a = lireNombre(defi.reps.a), u = lireNombre(defi.reps.u);
      const okA = isFinite(a) && proche(a, defi.Ec0, 0.05), okU = isFinite(u) && proche(u, defi.dU, 0.05);
      setDefi(x => ({ ...x, verifie: true, ok: okA && okU, okA, okU })); noterA(okA && okU);
    } else {
      const c = lireNombre(defi.reps.c), v = lireNombre(defi.reps.v);
      const okC = isFinite(c) && proche(c, defi.Ec, 0.05), okV = isFinite(v) && proche(v, defi.v, 0.05);
      setDefi(x => ({ ...x, verifie: true, ok: okC && okV, okC, okV })); noterB(okC && okV);
    }
  };
  const champ = (cle, aria, ok) => (
    <input value={defi.reps[cle]} aria-label={aria} onKeyDown={e2 => e2.key === 'Enter' && document.getElementById('frm-verif')?.click()} onChange={e2 => setDefi(x => ({ ...x, reps: { ...x.reps, [cle]: e2.target.value }, verifie: false, corr: false }))} inputMode="decimal"
      style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/>);

  const diagnosticA = () => {
    const x = defi, msgs = [], a = lireNombre(x.reps.a), u = lireNombre(x.reps.u);
    if (!isFinite(a)) msgs.push('Énergie cinétique initiale : écrivez un nombre (virgule ou point).');
    else if (!x.okA) {
      if (proche(a, x.m * x.v0 ** 2, 0.05)) msgs.push('Énergie cinétique initiale : il manque le facteur ½ : Ec = ½ × m × v².');
      else if (proche(a, 0.5 * x.m * x.v0, 0.05)) msgs.push('Énergie cinétique initiale : la vitesse doit être élevée au carré.');
      else if (proche(a, x.Ec1, 0.05)) msgs.push('Énergie cinétique initiale : cette valeur correspond à la vitesse finale ; utilisez la vitesse du départ.');
      else msgs.push(`Énergie cinétique initiale : Ec = ½ × m × v² = ½ × ${nbf(x.m, 1)} × ${x.v0}², en J. Votre valeur est ${a > x.Ec0 ? 'trop grande' : 'trop petite'}.`);
    }
    if (!isFinite(u)) msgs.push('Énergie interne gagnée : écrivez un nombre (virgule ou point).');
    else if (!x.okU) {
      if (proche(u, x.Ec0, 0.05)) msgs.push('Énergie interne gagnée : le bloc garde de l’énergie cinétique à la fin ; il faut retirer l’énergie cinétique finale.');
      else if (proche(u, x.Ec1, 0.05)) msgs.push('Énergie interne gagnée : cette valeur est l’énergie cinétique finale du bloc ; ΔU est l’énergie cinétique perdue.');
      else if (proche(u, -x.dU, 0.05)) msgs.push('Énergie interne gagnée : le signe est inversé : l’énergie interne augmente, ΔU est positive.');
      else if (proche(u, 0.5 * x.m * (x.v0 - x.v1) ** 2, 0.05)) msgs.push('Énergie interne gagnée : on ne soustrait pas les vitesses : on calcule les deux énergies cinétiques, puis on les soustrait.');
      else msgs.push(`Énergie interne gagnée : ΔU = Ec initiale − Ec finale, avec Ec finale = ½ × ${nbf(x.m, 1)} × ${x.v1}². Votre valeur est ${u > x.dU ? 'trop grande' : 'trop petite'}.`);
    }
    return msgs;
  };
  const diagnosticB = () => {
    const x = defi, msgs = [], c = lireNombre(x.reps.c), v = lireNombre(x.reps.v);
    if (!isFinite(c)) msgs.push('Énergie cinétique : écrivez un nombre (virgule ou point).');
    else if (!x.okC) {
      if (proche(c, x.Ep0 + x.Ep1, 0.05)) msgs.push('Énergie cinétique : l’énergie potentielle a diminué : Ec = Ep au départ − Ep à cet instant, pas leur somme.');
      else if (proche(c, x.Ep1, 0.05)) msgs.push('Énergie cinétique : cette valeur est l’énergie potentielle restante ; Ec = Ep au départ − Ep à cet instant.');
      else if (proche(c, x.Ep0, 0.05)) msgs.push('Énergie cinétique : cette valeur est l’énergie potentielle au départ ; une partie en reste à cet instant.');
      else msgs.push(`Énergie cinétique : Ec = Ep départ − Ep instant = ${x.Ep0} − ${x.Ep1}, en J (U ne varie pas, Ec valait 0 au départ). Votre valeur est ${c > x.Ec ? 'trop grande' : 'trop petite'}.`);
    }
    if (!isFinite(v)) msgs.push('Vitesse : écrivez un nombre (virgule ou point).');
    else if (!x.okV) {
      if (proche(v, Math.sqrt(x.Ec / x.m), 0.05)) msgs.push('Vitesse : il manque un facteur 2 : Ec = ½ m v² donne v = √(2 × Ec ÷ m).');
      else if (proche(v, 2 * x.Ec / x.m, 0.05)) msgs.push('Vitesse : il faut prendre la racine carrée : v = √(2 × Ec ÷ m).');
      else if (isFinite(c) && !x.okC && proche(v, Math.sqrt(2 * c / x.m), 0.05)) msgs.push('Vitesse : votre calcul est cohérent avec votre Ec, mais celle-ci n’est pas la bonne.');
      else msgs.push(`Vitesse : v = √(2 × Ec ÷ m) = √(2 × ${fmt2(x.Ec)} ÷ ${nbf(x.m, 1)}), en m/s. Votre valeur est ${v > x.v ? 'trop grande' : 'trop petite'}.`);
    }
    return msgs;
  };
  const correction = () => defi.type === 'glisse'
    ? `Ec initiale = ½ × ${nbf(defi.m, 1)} × ${defi.v0}² = ${fmt2(defi.Ec0)} J. Ec finale = ½ × ${nbf(defi.m, 1)} × ${defi.v1}² = ${fmt2(defi.Ec1)} J. Le système « bloc et sol » est isolé et Ep ne varie pas : ΔU = Ec initiale − Ec finale = ${fmt2(defi.dU)} J. Erreur fréquente : oublier l’énergie cinétique restante.`
    : `Sans frottement, Ec + Ep est constante et Ec valait 0 au départ : Ec = ${defi.Ep0} − ${defi.Ep1} = ${defi.Ec} J. Puis v = √(2 × Ec ÷ m) = √(2 × ${defi.Ec} ÷ ${nbf(defi.m, 1)}) ≈ ${fmt2(defi.v)} m/s.`;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['glisse', 'Le bloc qui ralentit'], ['chute', 'La bille en chute']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0f766e')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'glisse' ? 'Défi : le bloc qui ralentit' : 'Défi : la bille en chute'}</div>
      {defi.type === 'glisse' ? <>
        <div style={{ ...lbl, marginBottom: 8 }}>Un bloc de masse <strong>{nbf(defi.m, 1)} kg</strong> glisse sur un sol horizontal. À cause des frottements, sa vitesse passe de <strong>{defi.v0} m/s</strong> à <strong>{defi.v1} m/s</strong>. Le système « bloc et sol » n’échange aucune énergie avec l’extérieur. Calculez l’<strong>énergie cinétique initiale</strong> du bloc (en J) et l’<strong>énergie interne gagnée</strong> par le bloc et le sol (en J). Donnez vos résultats avec 2 chiffres significatifs.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Ec initiale (J) =</span>{champ('a', 'Énergie cinétique initiale en joules', defi.verifie && defi.okA)}
          <span>ΔU (J) =</span>{champ('u', 'Énergie interne gagnée en joules', defi.verifie && defi.okU)}
        </div>
        <IndiceDefi cache={false}>Ec = ½ × m × v² (v en m/s). L’énergie interne gagnée est l’énergie cinétique perdue : Ec initiale − Ec finale.</IndiceDefi>
      </> : <>
        <div style={{ ...lbl, marginBottom: 8 }}>Une bille de masse <strong>{nbf(defi.m, 1)} kg</strong> est lâchée sans vitesse. On néglige les frottements. Elle stocke une énergie potentielle <strong>{defi.Ep0} J</strong> au départ et <strong>{defi.Ep1} J</strong> à un instant de sa chute. Calculez son <strong>énergie cinétique</strong> à cet instant (en J) et sa <strong>vitesse</strong> (en m/s). Donnez vos résultats avec 2 chiffres significatifs.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
          <span>Ec (J) =</span>{champ('c', 'Énergie cinétique en joules', defi.verifie && defi.okC)}
          <span>v (m/s) =</span>{champ('v', 'Vitesse en mètres par seconde', defi.verifie && defi.okV)}
        </div>
        <IndiceDefi cache={false}>Sans frottement, Ec + Ep est constante et Ec = 0 au départ. Puis Ec = ½ × m × v² donne v = √(2 × Ec ÷ m).</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="frm-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
        {defi.ok ? <div style={{ fontWeight: 700, color: '#15803d' }}>✓ Correct.</div> : <>
          <div style={{ fontWeight: 700, color: '#dc2626' }}>✗ Pas tout à fait.</div>
          <ul style={{ margin: '4px 0 0', paddingLeft: 18, color: KIT.txt }}>{(defi.type === 'glisse' ? diagnosticA() : diagnosticB()).map((m, i) => <li key={i}>{avecIndices(m)}</li>)}</ul>
          {defi.corr ? <div style={{ ...styleBoite, marginTop: 6, color: KIT.txt }}>{avecIndices(correction())}</div>
            : <button onClick={() => setDefi(x => ({ ...x, corr: true }))} style={{ ...stylePetitBouton(false), marginTop: 6 }}>Voir la correction</button>}
        </>}
      </div>}
    </div>);

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Trois situations</strong> seulement : une bille en chute sans frottement, un bloc qui glisse sur un sol horizontal, de l’eau chauffée au repos.</li>
      <li><strong>Énergie potentielle de pesanteur</strong> : ses valeurs sont données ; la formule sera vue dans la séquence suivante (g = 9,8 N·kg⁻¹ utilisé dans le modèle).</li>
      <li><strong>Frottements</strong> : toute l’énergie cinétique perdue devient énergie interne du bloc et du sol ; le système « bloc et sol » est isolé.</li>
      <li><strong>Eau</strong> : pas de changement d’état, capacité thermique massique 4 180 J·kg⁻¹·K⁻¹ ; l’énergie reçue est entièrement stockée en énergie interne.</li>
      <li><strong>Colonne d’énergie</strong> : Ec et Ep sont les valeurs stockées ; l’énergie interne est indiquée par sa variation ΔU depuis le début.</li>
      <li><strong>Valeurs inventées</strong> pour la simulation (masses, hauteurs, vitesses) : ce ne sont pas des mesures.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={!!ouv.hypo} onBascule={() => bascule('hypo')}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0f766e')}><Pic n="target"/>Défis</button>
    </span>);

  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{M.SITUATIONS.find(s => s.id === sceneProps.sit).nom}</div>
      <SceneFormes sit={sceneProps.sit} p={sceneProps.p} e={eS} m={sceneProps.o.m} H={sceneProps.o.H} v0={sceneProps.o.v0} bars={sceneProps.bars} vals={sceneProps.vals} ligne={sceneProps.sit === 'chauffe' ? 'apport maximal' : 'énergie totale au départ'}/>
    </div>);
  const reglages = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages</div>
      <Sel id="frm-s" label="Situation" valeur={ti.sit} onChange={v => setTi(s => ({ ...s, sit: v, m: v === 'chute' ? 0.5 : v === 'glisse' ? 2 : s.m }))} options={M.SITUATIONS.map(s => [s.id, s.nom])}/>
      <Sel id="frm-p" label={ti.sit === 'chute' ? 'Avancement de la chute' : ti.sit === 'glisse' ? 'Vitesse perdue par le bloc' : 'Avancement du chauffage'} valeur={ti.p} onChange={v => setTi(s => ({ ...s, p: Number(v) }))} options={M.PAS.map(v => [v, ti.sit === 'chute' ? (v === 0 ? 'au départ (lâchée)' : v === 1 ? 'juste avant le sol' : `${Math.round(100 * v)} % de la hauteur parcourue`) : `${Math.round(100 * v)} %`])}/>
      {ti.sit === 'chute' && <>
        <Sel id="frm-m" label="Masse de la bille" valeur={ti.m} onChange={v => setTi(s => ({ ...s, m: Number(v) }))} options={[0.2, 0.5, 1].map(v => [v, `${nbf(v, 1)} kg`])}/>
        <Sel id="frm-h" label="Hauteur de lâcher" valeur={ti.H} onChange={v => setTi(s => ({ ...s, H: Number(v) }))} options={[1, 2, 3].map(v => [v, `${v} m`])}/></>}
      {ti.sit === 'glisse' && <>
        <Sel id="frm-m" label="Masse du bloc" valeur={ti.m} onChange={v => setTi(s => ({ ...s, m: Number(v) }))} options={[1, 2, 3].map(v => [v, `${v} kg`])}/>
        <Sel id="frm-v" label="Vitesse initiale" valeur={ti.v0} onChange={v => setTi(s => ({ ...s, v0: Number(v) }))} options={[3, 4, 5].map(v => [v, `${v} m/s`])}/></>}
      {ti.sit === 'chauffe' && <Sel id="frm-q" label="Énergie reçue au maximum" valeur={ti.Q} onChange={v => setTi(s => ({ ...s, Q: Number(v) }))} options={[400, 800, 1200].map(v => [v, `${v} J`])}/>}
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>{ti.sit === 'chute' ? 'Pendant la chute, l’énergie potentielle (orange) devient de l’énergie cinétique (bleu) : la hauteur totale de la colonne ne change pas.' : ti.sit === 'glisse' ? 'Le bloc ralentit : l’énergie cinétique (bleu) devient énergie interne (rouge) ; la hauteur totale de la colonne ne change pas.' : 'L’eau ne bouge pas : seule l’énergie interne (rouge) augmente, car elle reçoit de l’énergie.'}</div>
    </div>);
  const mesures = enExplore && (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Énergies stockées</div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>Ec et Ep sont les valeurs stockées ; l’énergie interne est donnée par sa variation depuis le début.</div>
      <LigneMesure nom="Énergie cinétique Ec" valeur={`${nbf(eS.Ec, 1)}${NB}J`} couleur={COL.bleu}/>
      <LigneMesure nom="Énergie potentielle Ep" valeur={`${nbf(eS.Ep, 1)}${NB}J`} couleur={COL.orange}/>
      <LigneMesure nom="Énergie interne gagnée ΔU" valeur={`${nbf(eS.dU, 1)}${NB}J`} couleur={COL.rouge}/>
      <LigneMesure nom="Somme Ec + Ep + ΔU" valeur={`${nbf(M.total(eS), 1)}${NB}J`} couleur={COL.violet}/>
      {ti.sit !== 'chauffe' && <LigneMesure nom="Vitesse v" valeur={`${nbf(eS.v, 1)}${NB}m/s`}/>}
      {ti.sit === 'chauffe' && <LigneMesure nom="Variation de température ΔT" valeur={`+${nbf(eS.dT, 1)}${NB}K`}/>}
      <LigneMesure nom="Énergie reçue de l’extérieur" valeur={`${nbf(eS.recu, 1)}${NB}J`}/>
    </div>);

  const aEssayer = (
    <ul style={liste}>
      <li>Chute : placez l’avancement à 0 %, 50 % puis 100 % : que deviennent Ec, Ep et la somme ?</li>
      <li>Chute : doublez la masse de la bille. Les énergies changent-elles ? Et la hauteur totale de la colonne ?</li>
      <li>Bloc : augmentez la vitesse initiale de 3 à 6 m/s (en passant par 4 et 5). Par combien Ec est-elle multipliée ?</li>
      <li>Bloc : quand il s’est arrêté, où est passée l’énergie cinétique ?</li>
      <li>Eau : quelle énergie varie ? La somme Ec + Ep + ΔU est-elle constante ici ? Pourquoi ?</li>
    </ul>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>Trois formes d’énergie stockée : cinétique (mouvement), potentielle (interactions avec l’extérieur), interne (échelle microscopique)</li>
        <li>Ec = ½ × m × v² ; Etot = Ec + Ep + U</li>
        <li>Au cours d’une transformation, l’énergie change de forme : ΔEc + ΔEp + ΔU = 0 pour un système isolé</li>
        <li>L’énergie totale d’un système ne varie que par les transferts reçus ou cédés</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .frm-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .frm-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .frm-col { display: flex; flex-direction: column; gap: 12px; }
        .frm-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) {
          .frm-l1.cote .frm-carte { order: 2; } .frm-l1.cote .frm-main { order: 1; }
          .frm-ex { grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); }
          .frm-ex > * { grid-column: 1; }
          .frm-ex > .frm-reg { grid-column: 2; grid-row: 1 / span 4; }
        }
        @media (max-width: 900px) { .frm-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .frm-in { animation: frm-fondu 0.35s ease-out; } @keyframes frm-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Formes d’énergie stockée : cinétique, potentielle, interne</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un système stocke de l’énergie sous trois formes : <strong>cinétique</strong> (mouvement), <strong>potentielle</strong> (interactions) et <strong>interne</strong> (échelle microscopique). Leur somme est l’<strong>énergie totale</strong>.</div>
      {!enExplore && <div className={`frm-l1${enGuide || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div className="frm-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : <div className="frm-carte">{panneauHypo}</div>}
        <div className="frm-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'glisse' ? suiviA : suiviB}/></div>}
          {enGuide && <div className="frm-col"><div className="frm-in">{scene}</div></div>}
        </div>
      </div>}
      {enExplore && <>
        <div className="frm-ex">
          {scene}
          <div className="frm-reg">{reglages}</div>
          {mesures}
        </div>
        <Section titre="À essayer" ouvert={!!ouv.essayer} onBascule={() => bascule('essayer')}>{aEssayer}</Section>
        <Section titre="À retenir" ouvert={!!ouv.retenir} onBascule={() => bascule('retenir')}>{retenirExplore}</Section>
      </>}
      {(enExplore || (enGuide && deja('fin'))) && <div style={{ marginTop: 4 }}>{panneauHypo}</div>}
    </div>
  );
}
