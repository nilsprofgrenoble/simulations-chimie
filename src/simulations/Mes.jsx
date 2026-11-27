import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState } from "react";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, IndiceDefi, indicesProfond } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./mesModele";
import { SceneMes, useCoup } from "./MesScene";
import { SvgFormesCarte, SvgHybrideCarte, SvgCationCarte, SvgProbableCarte, SvgBilanMesCarte } from "./MesSchemas";
import { StyleAnim, Chips } from "./exploAnim";

// ====================================================
// SIM 319 — « Mésomérie : délocaliser un doublet » (terminale STL, SPCL, Chimie et développement durable : séquence 9, aspects microscopiques).
//  Une idée : une même espèce peut s'écrire de plusieurs façons en schéma de Lewis (formes mésomères) qui ne diffèrent que par la place des doublets et des charges ;
//  la structure réelle est un hybride ; toutes les formes ne se valent pas (la moins chargée est la plus probable) ; plus il y a de formes équivalentes, plus l'espèce est stable.
//  Capacité visée (jamais affichée à l'élève) : identifier les formes mésomères de molécules ou d'ions simples en exploitant des schémas de Lewis fournis.
//  Hors périmètre : mésomérie du benzène et des composés aromatiques, règles de Hückel, calcul de l'énergie de résonance. Modèle : mesModele.js. Scène animée : MesScene.jsx.
// ====================================================
const BLEU = '#7c3aed', NB = M.NB, nb = M.nbf;
const SIM_ID = 319, CLE_GUIDE = 'mes-guide-v1';
declarerDefis(SIM_ID, [['formes', 'Formes limites d’une espèce'], ['hybride', 'Ordre de liaison et charge moyenne']]);
const IDS = ['ecritures', 'atomes', 'symbole', 'nitrate', 'hybride', 'charge', 'allyle', 'allyle2', 'amide', 'probable', 'stabilite', 'invalide', 'bilan'];
const ULS = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const E = M.ESPECES;
const AIDE_CLIC = 'Cliquez sur le cercle orange pointillé : le doublet se déplace en suivant les flèches courbes, puis la nouvelle écriture s’affiche.';
const BASE = { esp: 'ethanoate', handles: false, arrows: false, hybride: false, fixe: null, aide: '', compteur: false };
const nitrateFaux = () => { const e = E.nitrate, f = M.formeInit(e); f.b = [2, 1, 2]; f.lp = { n: 0, o1: 2, o2: 3, o3: 2 }; return f; };
const SCENES = {
  ecritures: { ...BASE, handles: true, aide: AIDE_CLIC },
  atomes: { ...BASE, handles: true, aide: 'Vous pouvez passer d’une écriture à l’autre autant de fois que vous voulez.' },
  symbole: { ...BASE, arrows: true, aide: 'Les flèches courbes orange montrent quels doublets se déplacent pour passer à l’autre écriture.' },
  nitrate: { ...BASE, esp: 'nitrate', handles: true, compteur: true, aide: AIDE_CLIC },
  hybride: { ...BASE, hybride: true, aide: 'Dessin de la structure réelle : trait plein + pointillés = liaison intermédiaire ; δ− = charge partielle.' },
  charge: { ...BASE, hybride: true, aide: 'Dessin de la structure réelle : δ− signifie que la charge − est répartie.' },
  allyle: { ...BASE, esp: 'allyle', handles: true, aide: 'Cliquez sur le cercle orange pointillé placé sur la double liaison : ses électrons se déplacent vers le carbone chargé.' },
  allyle2: { ...BASE, esp: 'allyle', handles: true, aide: 'Vous pouvez revenir à l’écriture de départ en recliquant sur le cercle orange.' },
  amide: { ...BASE, esp: 'amide', handles: true, aide: AIDE_CLIC },
  probable: { ...BASE, esp: 'amide', handles: true, aide: 'Passez d’une écriture à l’autre et comparez les charges formelles.' },
  stabilite: null,
  invalide: { ...BASE, esp: 'nitrate', fixe: 'faux', aide: 'Cette écriture a été proposée par un élève pour l’ion nitrate.' },
  bilan: { ...BASE, esp: 'nitrate', hybride: true },
};
const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box' };
const sel = (id, lab, v, onChange, opts) => (<div style={{ minWidth: 0 }}>
  <label htmlFor={id} style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>{lab}</label>
  <select id={id} value={v} onChange={onChange} style={menu}>{opts}</select></div>);
const lire = s => { const t = String(s).trim().replace(/\s/g, '').replace('−', '-').replace(',', '.'); if (t === '') return NaN; const m = t.match(/^(-?[\d.]+)\/([\d.]+)$/); return m ? Number(m[1]) / Number(m[2]) : Number(t); };
const ariaForme = (e, f) => `Écriture de Lewis de ${e.nom} (${e.formule}) : ${e.atomes.map(a => { const q = M.charge(e, f, a.id); return `${a.el}${a.h ? 'H' + a.h : ''}, ${f.lp[a.id]} doublet${f.lp[a.id] > 1 ? 's' : ''} non liant${f.lp[a.id] > 1 ? 's' : ''}${q ? ', charge ' + (q > 0 ? '+' : '−') : ''}`; }).join(' ; ')}.`;

// ---------- scène avec animation ----------
function BlocScene({ sc, f, nVus, onCoup, onRetablir, modifiee }) {
  const e = E[sc.esp], hy = sc.hybride ? M.hybride(e) : null;
  const [anim, lancer] = useCoup(onCoup);
  const fa = sc.fixe === 'faux' ? nitrateFaux() : f;
  const fleches = sc.arrows ? M.coups(e, fa)[0] || null : null;
  return (
    <div style={{ ...styleBoite, padding: 6 }}>
      <StyleAnim/>
      <SceneMes e={e} f={fa} anim={anim} arrows={fleches} handles={sc.handles && !anim} onCoup={lancer} hybride={hy} aria={sc.hybride ? `Hybride de résonance de ${e.nom}.` : ariaForme(e, fa)}/>
      <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: KIT.txt, marginTop: 2 }}>{e.nom} {e.formule}</div>
      {sc.compteur && <div style={{ textAlign: 'center', fontSize: 14, color: KIT.txt2, marginTop: 4 }}>Écritures différentes trouvées : <strong>{nVus}</strong></div>}
      {sc.handles && modifiee && <div style={{ textAlign: 'center', marginTop: 6 }}><button type="button" onClick={onRetablir} style={{ ...stylePetitBouton(false, '#475569'), minHeight: 40 }}><Pic n="refresh"/>Revenir à l’écriture de départ</button></div>}
      {sc.aide && <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 8, lineHeight: 1.45 }}>{sc.aide}</div>}
    </div>);
}

// ---------- vignette d'un défi ----------
function Vignette({ e, f, lettre, etat, onClick, desactive }) {
  const c = etat === 'bon' ? '#15803d' : etat === 'mauvais' ? '#dc2626' : etat === 'choisi' ? '#ea580c' : KIT.bord;
  return (<button type="button" onClick={onClick} disabled={desactive} aria-pressed={etat === 'choisi'} aria-label={`Écriture ${lettre}${etat === 'choisi' ? ' (cochée)' : ''}`}
    style={{ border: `2.5px solid ${c}`, borderRadius: 12, background: etat === 'choisi' ? '#fff7ed' : '#fff', padding: 4, cursor: desactive ? 'default' : 'pointer', minHeight: 44, textAlign: 'center', font: 'inherit', display: 'block', width: '100%' }}>
    <div style={{ fontSize: 14, fontWeight: 800, color: c === KIT.bord ? KIT.txt2 : c, textAlign: 'left', padding: '0 4px' }}>Écriture {lettre}{etat === 'choisi' ? ' ✓' : ''}</div>
    <SceneMes e={e} f={f} compact rogne aria=""/>
  </button>);
}

// ---------- exploration ----------
function MesExplore({ ex, setEx, ouv, setOuv }) {
  const e = E[ex.esp], f = ex.f[ex.esp] || M.formeInit(e), F = M.formes(e), vus = ex.vus[ex.esp] || [M.cle(M.formeInit(e))];
  const [anim, lancer] = useCoup(k => setEx(x => { const cur = x.f[x.esp] || M.formeInit(E[x.esp]), g = M.appliquer(E[x.esp], cur, k), v = x.vus[x.esp] || [M.cle(M.formeInit(E[x.esp]))]; return { ...x, f: { ...x.f, [x.esp]: g }, vus: { ...x.vus, [x.esp]: v.includes(M.cle(g)) ? v : [...v, M.cle(g)] }, touche: true }; }));
  const hy = ex.hybride && M.equivalentes(e) ? M.hybride(e) : null, q = M.charges(e, f), pen = M.penalite(e, f), pmin = Math.min(...F.map(g => M.penalite(e, g)));
  const message = !ex.touche ? 'Cliquez sur un cercle orange pointillé pour déplacer un doublet : les flèches courbes montrent le déplacement, puis la nouvelle écriture s’affiche.'
    : hy ? 'Hybride : la structure réelle est la moyenne des écritures équivalentes. Les liaisons partielles sont en pointillés et la charge est répartie (δ).'
      : `${e.nom} : ${Object.values(q).filter(x => x !== 0).length ? 'charges formelles ' + e.atomes.filter(a => q[a.id] !== 0).map(a => `${a.el} ${q[a.id] > 0 ? '+' : '−'}`).join(', ') : 'aucune charge formelle'}. ${M.equivalentes(e) ? 'Toutes les formes sont équivalentes.' : pen === pmin ? 'C’est la forme la plus probable (la moins chargée).' : 'Forme peu probable : des charges séparées coûtent de l’énergie.'}`;
  const tog = (cle, lab, off) => <button type="button" disabled={off} onClick={() => setEx(x => ({ ...x, [cle]: !x[cle] }))} aria-pressed={ex[cle]} style={{ ...stylePetitBouton(ex[cle], '#0f766e'), minHeight: 40, opacity: off ? 0.5 : 1 }}>{lab}</button>;
  return (
    <div>
      <StyleAnim/>
      <div className="xa-ctrl" style={{ maxWidth: 920, margin: '0 auto 10px', gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <Section titre={`${e.nom} ${e.formule}`} ouvert={ouv.reglages} onBascule={() => setOuv(o => ({ ...o, reglages: !o.reglages }))}>
          {sel('mx-esp', 'Espèce chimique', ex.esp, ev => setEx(x => ({ ...x, esp: ev.target.value, hybride: false })), M.LISTE.map(k => <option key={k} value={k}>{E[k].nom} {E[k].formule}</option>))}
        </Section>
      </div>
      <div style={{ ...styleBoite, padding: 6, maxWidth: 520, margin: '0 auto' }}>
        <SceneMes e={e} f={f} anim={anim} arrows={ex.fleches && !hy ? M.coups(e, f)[0] || null : null} handles={!hy && !anim} onCoup={lancer} hybride={hy} aria={hy ? `Hybride de résonance de ${e.nom}.` : ariaForme(e, f)}/>
      </div>
      <div role="status" aria-live="polite" style={{ minHeight: 56, margin: '10px auto 0', maxWidth: 920, fontSize: 15, lineHeight: 1.5, color: KIT.txt2 }}>{message}</div>
      <div style={{ maxWidth: 920, margin: '0 auto 6px', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Afficher :</span>
        {tog('fleches', 'Les flèches de mésomérie')}
        {tog('hybride', 'L’hybride de résonance', !M.equivalentes(e))}
        <button type="button" onClick={() => setEx(x => ({ ...x, f: { ...x.f, [x.esp]: M.formeInit(E[x.esp]) } }))} style={{ ...stylePetitBouton(false, '#475569'), minHeight: 40 }}><Pic n="refresh"/>Écriture de départ</button>
      </div>
      <Chips items={[['Écritures trouvées', `${vus.length}`, '#7c3aed'], ['Formes mésomères de l’espèce', `${F.length}`, '#475569'], ['Formes équivalentes', M.equivalentes(e) ? 'oui' : 'non', M.equivalentes(e) ? '#15803d' : '#b45309']]}/>
    </div>);
}

export function SimulationMes() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviF, noterF] = useCompteurDefi(), [suiviH, noterH] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [fm, setFm] = useState({}), [vus, setVus] = useState({});
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('formes');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ reglages: false, essayer: false, retenir: false });
  const [ex, setEx] = useState({ esp: 'ethanoate', f: {}, vus: {}, hybride: false, fleches: true, touche: false });
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const idx = enGuide ? Math.min(guide.etape, IDS.length - 1) : -1, idE = IDS[Math.max(idx, 0)];
  const cur = id => fm[id] || M.formeInit(E[id]);
  const change = id => M.cle(cur(id)) !== M.cle(M.formeInit(E[id])), nVus = id => (vus[id] || [M.cle(M.formeInit(E[id]))]).length;
  const appliquerGuide = id => k => { const g = M.appliquer(E[id], cur(id), k); setFm(m => ({ ...m, [id]: M.appliquer(E[id], m[id] || M.formeInit(E[id]), k) })); setVus(v => { const a = v[id] || [M.cle(M.formeInit(E[id]))], c = M.cle(g); return { ...v, [id]: a.includes(c) ? a : [...a, c] }; }); };

  // ---------- étapes du parcours ----------
  const ETAPES = [
    { id: 'ecritures', titre: 'Une espèce, plusieurs écritures',
      texte: <>Voici l’<strong>ion éthanoate</strong> CH₃COO⁻ en notation de <strong>Lewis</strong> : chaque trait est un doublet liant, chaque paire de points est un <strong>doublet non liant</strong>, et le cercle <strong>−</strong> est une <strong>charge formelle</strong>. Il existe une autre écriture de Lewis de cet ion. Cliquez sur le <strong>cercle orange pointillé</strong> (doublet de l’oxygène chargé) pour la faire apparaître.</>,
      tache: { type: 'action', ok: change('ethanoate'), consigne: change('ethanoate') ? '✓ Vous avez trouvé la deuxième écriture de l’ion éthanoate.' : 'Cliquez sur le cercle orange pointillé pour déplacer le doublet.' } },
    { id: 'atomes', titre: 'Qu’est-ce qui change ?',
      texte: <>Comparez les deux écritures de l’ion éthanoate (revenez de l’une à l’autre en recliquant sur le cercle orange). Elles décrivent <strong>la même espèce</strong> : on les appelle des <strong>formes mésomères</strong> (ou formes limites).</>,
      tache: { type: 'qcm', q: 'Qu’est-ce qui change d’une forme mésomère à l’autre ?', options: ['La place des atomes dans la molécule', 'Le nombre total d’électrons de l’ion', 'La place des doublets et des charges ; les atomes ne bougent pas', 'La formule brute CH₃COO⁻'], bonne: 2,
        expl: 'Les atomes restent à la même place. Seuls des doublets (liants ou non liants) se déplacent, ce qui change la place de la double liaison et des charges formelles. Le nombre d’électrons et la formule restent identiques.',
        indice: 'Regardez les atomes C et O : sont-ils au même endroit dans les deux écritures ? Qu’est-ce qui a changé de place ?' } },
    { id: 'symbole', titre: 'Les flèches de mésomérie',
      texte: <>Pour passer d’une forme mésomère à l’autre, on dessine des <strong>flèches courbes</strong> : chacune part d’un doublet d’électrons et pointe vers l’endroit où il va. Les deux formes sont reliées par le symbole <strong>↔</strong>, qui ne représente <strong>ni une réaction ni un équilibre</strong> : c’est une seule espèce, écrite de deux façons.</>,
      tache: { type: 'qcm', q: 'Que représente une flèche courbe orange sur ce dessin ?', options: ['Le déplacement d’un atome d’oxygène', 'Une réaction chimique entre deux molécules', 'Le déplacement d’un doublet d’électrons', 'Un équilibre entre deux espèces différentes'], bonne: 2,
        expl: 'Une flèche courbe de mésomérie représente le déplacement d’un doublet d’électrons (jamais d’un atome). Les deux formes qu’elle relie sont deux écritures de la même espèce.',
        indice: 'Chaque flèche part d’une paire de points (ou d’un trait) : que représente cette paire ?' } },
    { id: 'nitrate', titre: 'Compter les formes de l’ion nitrate',
      retenirTitre: 'À retenir : les formes mésomères', retenir: <><SvgFormesCarte/><ul style={ULS}>
        <li>Des <strong>formes mésomères</strong> sont des écritures de Lewis d’une même espèce : <strong>mêmes atomes</strong>, doublets et charges placés autrement.</li>
        <li>Une <strong>flèche courbe</strong> part d’un doublet et indique où il va.</li>
        <li>Le symbole <strong>↔</strong> n’est ni une réaction, ni un équilibre.</li></ul></>,
      texte: <>L’<strong>ion nitrate</strong> NO₃⁻ a un atome d’azote central lié à trois atomes d’oxygène. Cliquez sur les cercles orange pour déplacer les doublets et trouvez <strong>toutes ses écritures de Lewis</strong>. Le compteur indique combien d’écritures différentes vous avez trouvées.</>,
      tache: { type: 'num', q: 'Combien de formes mésomères l’ion nitrate possède-t-il ?', unite: '', vrai: 3, tol: 0.03, affiche: v => String(Math.round(v)), cs: 1, carnet: false,
        calcul: () => ['La double liaison N=O peut se placer sur chacun des trois atomes d’oxygène, avec les deux autres oxygènes portant une charge −.', 'Il y a donc 3 formes mésomères équivalentes.'],
        pieges: [[2, 'Il existe une écriture de plus : l’atome d’azote est lié à trois oxygènes, et la double liaison peut se placer sur chacun d’eux.'], [4, 'Il n’y a que trois atomes d’oxygène : la double liaison ne peut se placer que sur l’un d’eux.'], [1, 'Une seule écriture ne suffit pas : essayez de déplacer les doublets avec les cercles orange.']],
        expl: 'La double liaison peut se placer sur chacun des 3 atomes d’oxygène : 3 formes mésomères équivalentes.', indice: 'Déplacez le doublet d’un oxygène chargé − vers l’azote : la double liaison apparaît sur un autre oxygène. Combien de positions différentes ?' } },
    { id: 'hybride', titre: 'La structure réelle : un hybride',
      texte: <>Dans la réalité, l’ion éthanoate <strong>n’alterne pas</strong> entre ses deux écritures : il n’a qu’<strong>une seule structure</strong>, l’<strong>hybride de résonance</strong>, mélange de toutes les formes mésomères. Le dessin montre cet hybride : une liaison en <strong>trait plein + pointillés</strong> est une liaison intermédiaire.</>,
      tache: { type: 'qcm', q: 'Que dire des deux liaisons C–O de l’ion éthanoate ?', options: ['Une liaison C–O est simple, l’autre est double', 'Les deux liaisons sont identiques, de longueur intermédiaire entre simple et double', 'Les deux liaisons alternent très vite entre simple et double', 'Les deux liaisons sont simples'], bonne: 1,
        expl: 'La structure réelle est un hybride : les deux liaisons C–O sont identiques, de longueur intermédiaire entre une liaison simple et une liaison double. Les formes mésomères ne se succèdent pas dans le temps.',
        indice: 'Dans l’hybride, les deux oxygènes jouent le même rôle : peut-on distinguer les deux liaisons ?' } },
    { id: 'charge', titre: 'Une charge délocalisée',
      texte: <>Dans l’hybride, la charge <strong>−</strong> de l’ion éthanoate n’est pas sur un seul oxygène : elle est <strong>répartie</strong> (δ−). Pour des formes équivalentes, on obtient la charge moyenne d’un atome en <strong>additionnant sa charge dans chaque écriture, puis en divisant par le nombre d’écritures</strong> (la charge de l’ion est de −1 en tout, en unité de charge élémentaire e).</>,
      tache: { type: 'num', q: 'Quelle est la charge moyenne portée par chaque atome d’oxygène de l’ion éthanoate (en e) ?', unite: 'e', vrai: -0.5, tol: 0.03, affiche: v => nb(v, 2), cs: 2, carnet: false,
        calcul: () => ['Dans la première écriture, un oxygène porte −1 et l’autre 0 ; dans la deuxième, c’est l’inverse.', 'Charge moyenne = (−1 + 0) ÷ 2 = −0,5 e pour chaque oxygène.'],
        pieges: [[-1, 'Vous avez mis toute la charge sur un seul oxygène : dans l’hybride, elle est répartie sur les deux.'], [0.5, 'Le signe est à revoir : l’oxygène porte une charge négative (−).'], [-0.25, 'Vous avez divisé par 4. Il y a deux écritures : divisez la somme −1 + 0 par 2.']],
        expl: 'Charge moyenne de chaque O = (−1 + 0) ÷ 2 = −0,5 e.', indice: 'Dans la première écriture un oxygène porte −1 et l’autre 0 ; dans la seconde, l’inverse. Faites la moyenne sur les deux écritures.' } },
    { id: 'allyle', titre: 'Un cation : le carbone à 6 électrons',
      retenirTitre: 'À retenir : l’hybride', retenir: <><SvgHybrideCarte/><ul style={ULS}>
        <li>La structure réelle est un <strong>hybride</strong> : une seule structure, intermédiaire entre toutes les formes.</li>
        <li>Les liaisons ont un <strong>ordre moyen</strong> (ici 1,33) et la charge est <strong>répartie</strong> (δ−).</li>
        <li>Pour des formes <strong>équivalentes</strong> : moyenne simple sur toutes les écritures.</li></ul></>,
      texte: <>Le <strong>cation allyle</strong> CH₂=CH–CH₂⁺ a un carbone chargé + : il n’a que trois liaisons, donc <strong>6 électrons</strong> (une lacune). Les électrons de la <strong>double liaison</strong> peuvent venir combler cette lacune. Cliquez sur le cercle orange pointillé (sur la double liaison) pour les déplacer vers le carbone chargé.</>,
      tache: { type: 'action', ok: change('allyle'), consigne: change('allyle') ? '✓ Les électrons de la double liaison se sont déplacés : voici la deuxième écriture.' : 'Cliquez sur le cercle orange pointillé de la double liaison.' } },
    { id: 'allyle2', titre: 'Où est passée la charge +  ?',
      texte: <>Comparez les deux écritures du cation allyle. La <strong>double liaison</strong> a changé de place, et la <strong>lacune d’électrons</strong> (la charge +) aussi.</>,
      tache: { type: 'qcm', q: 'Dans la nouvelle écriture, sur quel atome se trouve la charge + ?', options: ['Sur le carbone central CH', 'Sur les deux carbones terminaux, chacun avec une charge +1', 'Sur l’autre carbone terminal CH₂', 'Sur aucun atome : il n’y a plus de charge'], bonne: 2,
        expl: 'La double liaison s’est déplacée vers le carbone chargé : la lacune passe sur l’autre carbone terminal. En réalité, la charge + est répartie entre les deux carbones terminaux (δ+ sur chacun).',
        indice: 'Quel carbone n’a plus que trois liaisons dans la nouvelle écriture ?' } },
    { id: 'amide', titre: 'Une molécule neutre aussi',
      retenirTitre: 'À retenir : une charge + qui se déplace', retenir: <><SvgCationCarte/><ul style={ULS}>
        <li>Un carbone <strong>chargé +</strong> n’a que 3 liaisons : 6 électrons (<strong>lacune</strong>).</li>
        <li>Les électrons d’une <strong>double liaison voisine</strong> peuvent venir la combler : la lacune se déplace.</li>
        <li>La charge + est <strong>répartie</strong> entre les atomes concernés.</li></ul></>,
      texte: <>Une molécule neutre peut aussi avoir des formes mésomères. L’<strong>éthanamide</strong> CH₃CONH₂ a un doublet non liant sur l’azote. Cliquez sur le cercle orange pointillé (le doublet de l’azote) : il va former une liaison C=N pendant que les électrons de C=O vont sur l’oxygène.</>,
      tache: { type: 'action', ok: change('amide'), consigne: change('amide') ? '✓ Voici la deuxième écriture : des charges + et − sont apparues.' : 'Cliquez sur le cercle orange pointillé pour déplacer le doublet de l’azote.' } },
    { id: 'probable', titre: 'Toutes les formes se valent-elles ?',
      texte: <>Comparez les deux écritures de l’éthanamide. Une des deux a des <strong>charges formelles séparées</strong> (+ sur N, − sur O), l’autre n’en a pas. Séparer des charges demande de l’énergie : les formes n’ont pas le même poids dans la structure réelle.</>,
      tache: { type: 'qcm', q: 'Quelle écriture est la plus probable (celle qui contribue le plus à la structure réelle) ?', options: ['Celle avec une charge + sur N et une charge − sur O', 'Les deux contribuent exactement autant', 'Celle sans charge formelle', 'Celle où la double liaison est la plus longue'], bonne: 2,
        expl: 'La forme la plus probable est la moins chargée : ici, l’écriture sans charge formelle. Les charges séparées sont défavorables.',
        indice: 'Quelle écriture a le moins de charges formelles ?' } },
    { id: 'stabilite', titre: 'Formes nombreuses, espèce stable',
      retenirTitre: 'À retenir : la forme la plus probable', retenir: <><SvgProbableCarte/><ul style={ULS}>
        <li>La forme la plus probable est <strong>la moins chargée</strong>.</li>
        <li>Si des charges sont inévitables, la charge <strong>−</strong> est de préférence portée par l’atome le <strong>plus électronégatif</strong> (O plutôt que C).</li>
        <li>Des formes <strong>équivalentes</strong> contribuent autant.</li></ul></>,
      texte: <>Plus une charge peut se <strong>délocaliser</strong> sur plusieurs atomes grâce aux formes mésomères, plus l’espèce chargée est stabilisée. Deux ions ont une charge −1 : l’ion A possède <strong>trois</strong> formes mésomères équivalentes, l’ion B n’en possède <strong>qu’une</strong>.</>,
      tache: { type: 'qcm', q: 'Quel ion est le plus stable ?', options: ['L’ion B, car sa charge est portée par un seul atome', 'Les deux ont la même stabilité', 'On ne peut pas comparer deux ions', 'L’ion A, car sa charge est délocalisée sur plus d’atomes'], bonne: 3,
        expl: 'Plus il y a de formes mésomères équivalentes, plus la charge est délocalisée et plus l’espèce est stable.',
        indice: 'Une charge répartie sur plusieurs atomes est-elle plus ou moins concentrée qu’une charge sur un seul atome ?' } },
    { id: 'invalide', titre: 'Repérer une écriture impossible',
      texte: <>Un élève propose cette écriture pour l’ion nitrate NO₃⁻ en déplaçant des doublets. Une forme mésomère valable doit <strong>garder les atomes en place</strong>, <strong>conserver le nombre total d’électrons</strong> et respecter l’<strong>octet</strong> (au plus 4 doublets autour de C, N, O).</>,
      tache: { type: 'qcm', q: 'Pourquoi cette écriture n’est-elle pas une forme mésomère de l’ion nitrate ?', options: ['Un atome d’oxygène a changé de place', 'L’atome d’azote est entouré de 5 doublets : il dépasse l’octet', 'Il manque un électron au total', 'Il y a trop de charges négatives'], bonne: 1,
        expl: 'L’azote est lié par une double liaison à deux oxygènes et par une simple liaison au troisième : cela fait 5 doublets liants autour de N, alors que N ne peut pas dépasser l’octet (4 doublets).',
        indice: 'Comptez les traits de liaison autour de l’atome d’azote : une double liaison compte pour 2.' } },
    { id: 'bilan', titre: 'Le bilan',
      retenirTitre: 'À retenir : le bilan', retenir: <><SvgBilanMesCarte/><ul style={ULS}>
        <li>Une forme mésomère garde les <strong>atomes</strong> en place, le <strong>nombre d’électrons</strong> et l’<strong>octet</strong>.</li>
        <li>Plus de <strong>formes équivalentes</strong> = charge plus <strong>délocalisée</strong> = espèce plus <strong>stable</strong>.</li>
        <li>La forme <strong>la plus probable</strong> est la moins chargée.</li></ul></>,
      texte: <>Vous savez identifier des formes mésomères à partir d’écritures de Lewis, décrire la structure réelle (hybride, charge délocalisée) et choisir la forme la plus probable. La suite : explorez d’autres espèces en exploration libre, ou relevez les défis.</>,
      tache: null },
  ];

  const nouveauDefi = type => {
    if (type === 'formes') setDefi({ genre: 'formes', d: M.tirageFormes(), choix: [], verifie: false, corr: false });
    else { const d = M.tirageHybride(); setDefi({ genre: 'hybride', d, rep: '', verifie: false, corr: false, f: M.formeInit(d.e), vus: [M.cle(M.formeInit(d.e))] }); }
  };
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const choisirDefi = t => { setTypeDefi(t); nouveauDefi(t); };
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, BLEU)}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- défis ----------
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.5 };
  const modifie = patch => setDefi(d => ({ ...d, ...patch, verifie: false, corr: false }));
  const verifierF = () => { const r = M.diagFormes(defi.d, defi.choix); setDefi(d => ({ ...d, verifie: true, ok: r.ok, r })); noterF(r.ok); };
  const verifierH = () => { const r = M.diagHybride(defi.d, lire(defi.rep)); setDefi(d => ({ ...d, verifie: true, ok: r.ok, r })); noterH(r.ok); };
  const lettres = 'ABCDEFG';
  const coupDefiH = k => setDefi(d => { const g = M.appliquer(d.d.e, d.f, k), c = M.cle(g); return { ...d, f: g, vus: d.vus.includes(c) ? d.vus : [...d.vus, c] }; });
  const voletDefi = defi && (() => {
    if (defi.genre === 'formes') {
      const { e, dep, cands } = defi.d, nJustes = cands.filter(c => c.juste).length;
      return (<div>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : les formes mésomères de {e.nom}</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Voici une écriture de Lewis de {e.nom} {e.formule}. Parmi les écritures proposées ci-dessous, <strong>cochez toutes celles qui sont des formes mésomères</strong> de cette espèce (obtenues en déplaçant des doublets, avec les atomes en place, le même nombre d’électrons et l’octet respecté). Il peut y en avoir une seule ou plusieurs.</div>
        <div style={{ ...styleBoite, padding: 6, maxWidth: 360, margin: '0 auto 10px' }}><div style={{ fontSize: 14, fontWeight: 800, color: KIT.txt2, padding: '0 4px' }}>Écriture donnée</div><SceneMes e={e} f={dep} compact rogne aria={ariaForme(e, dep)}/></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
          {cands.map((c, i) => <Vignette key={i} e={e} f={c.f} lettre={lettres[i]} desactive={false}
            etat={defi.verifie && !defi.ok ? (defi.choix.includes(i) ? (c.juste ? 'bon' : 'mauvais') : (c.juste ? 'mauvais' : null)) : defi.verifie && defi.ok ? (c.juste ? 'bon' : null) : defi.choix.includes(i) ? 'choisi' : null}
            onClick={() => modifie({ choix: defi.choix.includes(i) ? defi.choix.filter(x => x !== i) : [...defi.choix, i] })}/>)}
        </div>
        <div style={{ ...lbl, marginTop: 6, color: KIT.txt2 }}>{nJustes > 1 ? 'Plusieurs écritures sont correctes.' : 'Une écriture est correcte.'}</div>
        <IndiceDefi cache={false}>Une forme mésomère se déduit de l’écriture donnée en déplaçant des doublets (jamais des atomes). Vérifiez pour chaque écriture : le nombre de doublets autour de C, N, O (au plus 4), et que les charges formelles se compensent comme dans l’écriture donnée.</IndiceDefi>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          <button onClick={verifierF} style={styleBouton(true, '#15803d')}>Vérifier</button>
          <button onClick={() => nouveauDefi('formes')} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
          {defi.verifie && !defi.ok && <button onClick={() => setDefi(d => ({ ...d, corr: !d.corr }))} style={styleBouton(false, '#b45309')}>{defi.corr ? 'Masquer la correction' : 'Voir la correction'}</button>}
        </div>
        {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
          {defi.ok ? `✓ Correct : ${nJustes > 1 ? 'ce sont bien les ' + nJustes + ' formes mésomères' : 'c’est bien la forme mésomère'}.`
            : <>✗ {defi.r.fautes.length ? `${defi.r.fautes.length > 1 ? 'Des écritures cochées ne sont pas' : 'Une écriture cochée n’est pas'} une forme mésomère. ` : ''}{defi.r.manquees.length ? `Il manque ${defi.r.manquees.length > 1 ? 'des formes mésomères' : 'une forme mésomère'} dans votre sélection.` : ''}</>}
        </div>}
        {defi.verifie && !defi.ok && defi.corr && <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: '#fffbeb', border: '1.5px solid #f59e0b', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
          {cands.map((c, i) => <div key={i}><strong>Écriture {lettres[i]}</strong> : {c.juste ? 'forme mésomère valable (mêmes atomes, doublets déplacés).' : M.motifFausse(e, c.v)}</div>)}
        </div>}
      </div>);
    }
    const { e, genre, lien, atome, detail } = defi.d, f = defi.f, nbF = defi.vus.length;
    return (<div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : {genre === 'ordre' ? 'l’ordre moyen d’une liaison' : 'la charge moyenne d’un atome'} dans l’hybride de {e.nom}</div>
      <div style={{ ...lbl, marginBottom: 8 }}>Déplacez les doublets (cercles orange) pour trouver <strong>toutes les formes mésomères</strong> de {e.nom} {e.formule}, qui sont équivalentes. Puis calculez, en faisant la moyenne sur toutes les écritures, {genre === 'ordre' ? <>l’<strong>ordre moyen de la liaison {lien}</strong> (1 pour une liaison simple, 2 pour une double).</> : <>la <strong>charge moyenne de {atome}</strong>, en unité de charge élémentaire e.</>} Vous pouvez donner une fraction (par exemple −2/3) ou un nombre décimal.</div>
      <div style={{ ...styleBoite, padding: 6, maxWidth: 420, margin: '0 auto 8px' }}>
        <DefiHybScene e={e} f={f} onCoup={coupDefiH}/>
        <div style={{ textAlign: 'center', fontSize: 14, color: KIT.txt2 }}>Écritures différentes trouvées : <strong>{nbF}</strong></div>
      </div>
      <div style={{ ...lbl, marginBottom: 8 }}>{genre === 'ordre' ? `Ordre moyen de ${lien}` : `Charge moyenne`} = <input value={defi.rep} aria-label="Votre réponse" inputMode="decimal" onChange={ev => modifie({ rep: ev.target.value })} onKeyDown={ev => ev.key === 'Enter' && document.getElementById('mx-verif')?.click()}
        style={{ width: 110, padding: '6px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 15 }}/> {genre === 'charge' ? 'e' : ''}</div>
      <IndiceDefi cache={false}>{genre === 'ordre' ? `Notez l’ordre de la liaison ${lien} (1 ou 2) dans chaque écriture, additionnez, puis divisez par le nombre d’écritures.` : 'Notez la charge de cet atome (−1, 0 ou +1) dans chaque écriture, additionnez, puis divisez par le nombre d’écritures.'}</IndiceDefi>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        <button id="mx-verif" onClick={verifierH} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi('hybride')} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
        {defi.verifie && !defi.ok && <button onClick={() => setDefi(d => ({ ...d, corr: !d.corr }))} style={styleBouton(false, '#b45309')}>{defi.corr ? 'Masquer la correction' : 'Voir la correction'}</button>}
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? `✓ Correct : ${genre === 'ordre' ? 'ordre moyen' : 'charge moyenne'} = ${nb(defi.d.vrai, 2)}${genre === 'charge' ? ' e' : ''}.` : `✗ ${defi.r.msg}`}</div>}
      {defi.verifie && !defi.ok && defi.corr && <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: '#fffbeb', border: '1.5px solid #f59e0b', fontSize: 14, lineHeight: 1.6, color: KIT.txt }}>
        <div>Dans les {detail.length} écritures, {genre === 'ordre' ? `l’ordre de la liaison ${lien} vaut` : 'la charge de cet atome vaut'} : {detail.map(x => nb(x, 0)).join(' ; ')}.</div>
        <div>Moyenne = ({detail.map(x => nb(x, 0)).join(' + ')}) ÷ {detail.length} = <strong>{nb(defi.d.vrai, 2)}</strong>.</div></div>}
    </div>);
  })();

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Notation de Lewis</strong> : un trait est un doublet liant, deux points un doublet non liant. Les atomes d’hydrogène ne sont pas dessinés : ils sont notés dans le symbole (CH₃, NH₂…). Charge formelle = électrons de valence − (doublets non liants × 2) − nombre de liaisons.</li>
      <li><strong>Formes mésomères</strong> : elles ne diffèrent que par la place des doublets et des charges (pas des atomes), avec le même nombre d’électrons ; octet respecté pour C, N, O (sauf la lacune d’un carbone chargé +, à 6 électrons).</li>
      <li><strong>Hybride de résonance</strong> : pour des formes équivalentes, l’ordre de liaison et la charge d’un atome sont des moyennes simples sur toutes les écritures (poids égaux). Pour des formes de poids différents (éthanamide, ion énolate), aucune moyenne n’est calculée.</li>
      <li><strong>Forme la plus probable</strong> : critère qualitatif (moins de charges ; charge − sur l’atome le plus électronégatif). Les poids réels des formes ne sont pas calculés.</li>
      <li><strong>Espèces étudiées</strong> : ions éthanoate, nitrate, carbonate, cation allyle, éthanamide et ion énolate. Les systèmes aromatiques (benzène) ne sont pas traités ici.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Pour chaque espèce, trouvez toutes les formes mésomères : combien en trouvez-vous pour l’ion carbonate ?</li>
        <li>Affichez l’hybride de l’ion nitrate : que deviennent les trois liaisons N–O ? la charge − ?</li>
        <li>Pour l’éthanamide, comparez les deux écritures : laquelle est la plus probable, et pourquoi ?</li>
        <li>Pour l’ion énolate, la charge − est tantôt sur O, tantôt sur C : quelle écriture est la plus probable ?</li>
        <li>Comparez le nombre de formes équivalentes de l’ion éthanoate et de l’ion carbonate : lequel a sa charge la plus délocalisée ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.7 }}>
        <li>Formes mésomères : mêmes atomes, doublets et charges placés autrement ; symbole ↔.</li>
        <li>Une flèche courbe part d’un doublet et pointe vers l’endroit où il va.</li>
        <li>La structure réelle est un hybride : liaisons intermédiaires, charge délocalisée.</li>
        <li>La forme la plus probable est la moins chargée.</li>
        <li>Plus il y a de formes équivalentes, plus l’espèce est stable.</li>
      </ul>)}
    </Section>);

  // ---------- scène ----------
  const sc = enGuide ? SCENES[idE] : null;
  const scEtat = sc ? <BlocScene key={`s${idE}`} sc={sc} f={cur(sc.esp)} nVus={nVus(sc.esp)} onCoup={appliquerGuide(sc.esp)} modifiee={change(sc.esp)} onRetablir={() => setFm(m => ({ ...m, [sc.esp]: M.formeInit(E[sc.esp]) }))}/> : null;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .mx-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .mx-l1.cote { grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); }
        @media (max-width: 900px) { .mx-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .mx-in { animation: mx-fondu 0.35s ease-out; } @keyframes mx-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Mésomérie : délocaliser un doublet</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une même espèce peut s’écrire de plusieurs façons en <strong>schéma de Lewis</strong> : ce sont ses <strong>formes mésomères</strong>. Elles ne diffèrent que par la place des <strong>doublets</strong> d’électrons et des charges. Quelle forme est la plus probable ? Et pourquoi la charge est-elle <strong>délocalisée</strong> ?</div>
      {!enExplore && <div className={`mx-l1${(enGuide && sc) || enDefi ? ' cote' : ''}`}>
        {enGuide ? <div><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div>{panneauHypo}</div> : null}
        <div>
          {enDefi && defi && <div style={styleBoite}>{indicesProfond(voletDefi)}<SuiviDefi cle={`${SIM_ID}:defi.${defi.genre}`} etat={defi.genre === 'formes' ? suiviF : suiviH}/></div>}
          {enDefi && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {[['formes', 'Formes limites'], ['hybride', 'Ordre de liaison et charge moyenne']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={typeDefi === t} style={stylePetitBouton(typeDefi === t, BLEU)}>{l}</button>)}</div>}
          {enGuide && sc && <div className="mx-in" key={`s${idE}`}>{scEtat}</div>}
        </div>
      </div>}
      {enExplore && <div>
        <MesExplore ex={ex} setEx={setEx} ouv={ouv} setOuv={setOuv}/>
        <div style={{ maxWidth: 920, margin: '10px auto 0' }}>{aEssayer}{retenirExplore}{panneauHypo}</div>
      </div>}
      {enGuide && idx >= IDS.length - 1 && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
    </div>
  );
}

// scène du défi « hybride » : écriture interactive
function DefiHybScene({ e, f, onCoup }) {
  const [anim, lancer] = useCoup(onCoup);
  return <SceneMes e={e} f={f} anim={anim} handles={!anim} onCoup={lancer} aria={ariaForme(e, f)}/>;
}
