import { useState, useEffect } from "react";
import { useSignalerMode, useSuivi, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, ExempleResolu, lireProgression, lireNombre, proche, IndiceDefi, Curseur } from "../commun";
import { Pic } from "../Pictos";
import { REACTIONS, COULEURS, reactionDe, etiquetteDe, equationTexte, bilan, etatApres, peutFaire, energieRelative,
  melangeAvecLimitant, fr, arrondi } from "./reactifLimitantModele";
import { Jeton, Becher } from "./reactifLimitantDessins";
import { FicheLimitantExces, FicheMethode, FicheEquationRecette, FicheEtatFinal, FicheLireEtatFinal, FicheEnergie } from "./ReactifLimitantFiches";

// ====================================================
//  SIM 180 — RÉACTIF LIMITANT (2GT, « Modéliser une transformation chimique par une réaction »)
//  Une réaction est une recette : l'équation donne les proportions. On compare, pour chaque réactif, quantité de matière ÷ coefficient
//  (le nombre de recettes possibles) : le plus petit résultat désigne le réactif limitant. Pas d'avancement x, pas de tableau d'avancement (1re spé).
//  (Choix de seconde : ces notions de 1re spé ne sont jamais nommées à l'élève, y compris dans le panneau Hypothèses.)
//  Parcours guidé (analogie du sandwich, puis méthane, acide sur calcaire, synthèse de la DBA), exploration libre, 2 défis.
//  Modèle : reactifLimitantModele.js. Hypothèses : transformation totale et rapide, réactifs purs, pas de réaction parasite, quantités données.
// ====================================================

const SIM = 180;
declarerDefis(SIM, [
  ['limitant', 'Trouver le réactif limitant et ce qui reste'],
  ['proportions', 'Choisir les bonnes proportions'],
]);

const ORANGE = '#b45309', VERT = '#15803d', BLEU = '#0b4f94', GRIS = '#475569', ENCRE = '#0f172a';
const NB = ' ';
const alea = liste => liste[Math.floor(Math.random() * liste.length)];
const mol = (r, x) => (r.unite === 'mol' ? `${fr(x, r.dec)}${NB}mol` : fr(x, 0));
const nomCourt = e => (e.f || e.etiquette);

// ---------- l'équation (ou la recette) : toujours en tête de l'écran ----------
const couleurDe = (r, e) => { const i = r.reactifs.indexOf(e); return i >= 0 ? COULEURS[`r${i}`] : COULEURS[`p${r.produits.indexOf(e)}`]; };
function Mini({ e, couleur }) {
  return <svg width="24" height="22" viewBox="-12 -11 24 22" aria-hidden="true" style={{ flex: 'none' }}><Jeton cx={0} cy={0} forme={e.forme} couleur={couleur} e={0.9} cid={`m-${e.id}`}/></svg>;
}
export function Equation({ r }) {
  const terme = e => (
    <span key={e.id} style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {e.coef > 1 && <b style={{ color: ENCRE }}>{e.coef}</b>}
      {r.analogie && <Mini e={e} couleur={couleurDe(r, e)}/>}
      <b style={{ color: couleurDe(r, e) }}>{etiquetteDe(e)}</b>
    </span>);
  const signe = (k, t) => <span key={k} style={{ whiteSpace: 'nowrap', fontWeight: 800, color: GRIS }}>{t}</span>;
  const suite = liste => liste.flatMap((e, i) => (i ? [signe(`+${e.id}`, '+'), terme(e)] : [terme(e)]));
  return (
    <div data-equation="1" role="group" aria-label={`${r.analogie ? 'Recette' : 'Équation de la réaction'} : ${equationTexte(r)}`}
      style={{ background: '#fff7ed', border: '2px solid #fdba74', borderRadius: 14, padding: '6px 12px 8px', marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: ORANGE }}>{r.analogie ? 'La recette' : 'Équation de la réaction'}{!r.analogie && <span style={{ fontWeight: 400, color: GRIS }}> — {r.nom.charAt(0).toLowerCase() + r.nom.slice(1)}</span>}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px', fontSize: 19, lineHeight: 1.5 }}>
        {suite(r.reactifs)}{signe('fl', '→')}{suite(r.produits)}
      </div>
    </div>);
}

// ---------- la scène : des jetons pour compter les quantités ----------
const W = 392, X0 = 124, PAS = 20, GAP = 7, ECRAN_MAX = 420;
function Scene({ r, n, k = null, avant = true, titreAvant = 'Avant', titreApres = 'Après', groupes = false, calc = false, etiq = false, energie = false, produitsSeuls = false }) {
  const els = []; let y = 4;
  const b = bilan(r, n), jeton = r.jeton;
  const posX = (i, coef) => X0 + 11 + i * PAS + (groupes && coef > 1 ? Math.floor(i / coef) * GAP : 0);
  const titre = (t, yy) => <text key={`t${t}${yy}`} x="6" y={yy + 13} fontSize="13.5" fontWeight="800" fill={GRIS}>{t}</text>;
  // une ligne : étiquette, jetons (reste : quantité restante en jetons ; total : places à dessiner), quantité, et lignes d'aide
  const ligne = (e, yy, { total, reste, fant, statut, calcul, couleur }) => {
    const h = 38 + (statut || calcul ? 16 : 0), nbSlots = Math.ceil(total - 1e-9), noeuds = [];
    for (let j = 0; j < nbSlots; j++) {
      const q = Math.max(0, Math.min(1, reste - j));
      noeuds.push(<Jeton key={j} cx={posX(j, e.coef)} cy={yy + 17} forme={e.forme} couleur={couleur} frac={q > 1 - 1e-9 ? 1 : q} fantome={fant && q < 1e-9} cid={`s${yy}-${e.id}-${j}`}/>);
    }
    if (groupes && e.coef > 1) {
      for (let g = 0; g < Math.floor(total / e.coef + 1e-9); g++) {
        const x1 = posX(g * e.coef, e.coef) - 13, x2 = posX(g * e.coef + e.coef - 1, e.coef) + 13;
        noeuds.push(<rect key={`g${g}`} x={x1} y={yy + 2} width={x2 - x1} height={30} rx={9} fill="none" stroke="#94a3b8" strokeWidth="1.4" strokeDasharray="4 3"/>);
      }
    }
    const xq = nbSlots ? posX(nbSlots - 1, e.coef) + 15 : X0 + 4;
    return { h, node: (
      <g key={`l${e.id}${yy}`}>
        <text x="6" y={yy + 16} fontSize="15" fontWeight="800" fill={couleur}>{nomCourt(e)}</text>
        <text x="6" y={yy + 31} fontSize="12" fill={GRIS}>{e.nom}</text>
        {noeuds}
        <text x={xq} y={yy + 22} fontSize="13" fontWeight="800" fill={ENCRE}>{mol(r, reste * jeton)}</text>
        {calcul && <text x={X0} y={yy + 50} fontSize="13" fontWeight="800" fill={calcul.min ? ORANGE : BLEU}>{calcul.txt}</text>}
        {statut && <text x={X0} y={yy + 50} fontSize="12.5" fontWeight="800" fill={statut.couleur}>{statut.txt}</text>}
      </g>) };
  };
  if (avant) {
    els.push(titre(titreAvant, y)); y += 20;
    r.reactifs.forEach((e, i) => {
      const t = n[i] / jeton, rec = b.rec[i] / 1;
      const calcul = calc ? { txt: `${fr(n[i], r.unite === 'mol' ? r.dec : 0)} ÷ ${e.coef} = ${fr(rec, r.unite === 'mol' ? (r.dec > 1 ? 3 : 1) : 0)} recette${rec > 1 ? 's' : ''}`, min: b.limitants.includes(i) } : null;
      const l = ligne(e, y, { total: t, reste: t, couleur: COULEURS[`r${i}`], calcul });
      els.push(l.node); y += l.h;
    });
  }
  if (k !== null) {
    if (avant) { els.push(<g key="fleche"><path d={`M${X0 - 50} ${y + 1} v10`} stroke={GRIS} strokeWidth="2.4"/><polygon points={`${X0 - 56},${y + 10} ${X0 - 44},${y + 10} ${X0 - 50},${y + 19}`} fill={GRIS}/></g>); y += 22; }
    els.push(titre(titreApres, y)); y += 20;
    const fin = etatApres(r, n, k), final = Math.abs(k - b.rmin) < 1e-9;
    if (!produitsSeuls) r.reactifs.forEach((e, i) => {
      const t = n[i] / jeton, reste = fin.reactifs[i] / jeton;
      const statut = etiq && final ? (reste < 1e-9 ? { txt: b.stoechio ? 'épuisé : plus rien ne reste' : 'épuisé : réactif limitant', couleur: ORANGE } : { txt: 'il en reste : réactif en excès', couleur: VERT }) : null;
      const l = ligne(e, y, { total: t, reste, fant: true, couleur: COULEURS[`r${i}`], statut });
      els.push(l.node); y += l.h;
    });
    r.produits.forEach((p, j) => {
      const t = fin.produits[j] / jeton;
      const l = ligne(p, y, { total: t, reste: t, couleur: COULEURS[`p${j}`] });
      els.push(l.node); y += l.h;
    });
    if (energie && r.energie) {
      const E = energieRelative(r, n) * (k / (b.rmin || 1)), cases = Math.ceil(E - 1e-9);
      els.push(<g key="energie">
        <text x="6" y={y + 22} fontSize="14" fontWeight="800" fill={ORANGE}>Énergie</text>
        <text x="6" y={y + 37} fontSize="12" fill={GRIS}>libérée</text>
        {Array.from({ length: cases }, (_, j) => <rect key={j} x={X0 + j * 24} y={y + 8} width="20" height="20" rx="3" fill="#f59e0b" stroke={ORANGE} strokeWidth="1.5"/>)}
        <text x={X0 + cases * 24 + 4} y={y + 23} fontSize="13" fontWeight="800" fill={ENCRE}>{cases ? `${cases} carré${cases > 1 ? 's' : ''}` : '0'}</text>
      </g>);
      y += 42;
    }
  }
  const legende = r.analogie ? 'Chaque dessin représente une tranche (ou un sandwich).' : `Chaque rond représente ${fr(jeton, r.dec)}${NB}mol.`;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${y + 6}`} width="100%" role="img" aria-label={`${titreAvant}${k !== null ? ` puis ${titreApres}` : ''} : quantités des espèces de la réaction ${r.nom}`}
        style={{ display: 'block', maxWidth: ECRAN_MAX, margin: '0 auto', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 14 }}>
        {els}
      </svg>
      <div style={{ fontSize: 12.5, color: KIT.txt2, textAlign: 'center', marginTop: 3 }}>{legende}{energie && r.energie && k !== null ? ' Un carré = énergie libérée par 1 mol de méthane brûlé (échelle relative).' : ''}</div>
    </div>);
}

// ---------- la scène du calcaire : deux béchers ----------
function SceneBecher({ fin }) {
  return (
    <div>
      <svg viewBox="0 0 360 172" width="100%" role="img" aria-label={fin === 'solide' ? 'Deux béchers : au début, du solide blanc dans l’acide avec des bulles ; à la fin, plus de bulles mais du solide reste au fond' : 'Deux béchers : au début, du solide blanc dans l’acide avec des bulles ; à la fin, plus de bulles et plus de solide'}
        style={{ display: 'block', maxWidth: ECRAN_MAX, margin: '0 auto', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 14 }}>
        <text x="75" y="22" textAnchor="middle" fontSize="14" fontWeight="800" fill={ENCRE}>Au début</text>
        <text x="285" y="22" textAnchor="middle" fontSize="14" fontWeight="800" fill={ENCRE}>À la fin</text>
        <Becher x={30} y={34} etat="debut"/>
        <Becher x={240} y={34} etat={fin === 'solide' ? 'fin-solide' : 'fin-sans'}/>
        <path d="M138 90 H206" stroke={GRIS} strokeWidth="2.6"/><polygon points="204,81 220,90 204,99" fill={GRIS}/>
        <text x="75" y="156" textAnchor="middle" fontSize="12.5" fill={GRIS}>solide blanc + bulles</text>
        <text x="285" y="152" textAnchor="middle" fontSize="12.5" fill={GRIS}>plus de bulles,</text>
        <text x="285" y="166" textAnchor="middle" fontSize="12.5" fill={GRIS}>{fin === 'solide' ? 'du solide reste' : 'plus de solide'}</text>
      </svg>
    </div>);
}

// ====================================================
//  DÉFIS
// ====================================================
const TITRES = { limitant: 'Limitant et reste', proportions: 'Bonnes proportions' };
const REACTIONS_DEFI = ['methane', 'calcaire', 'dba'];
function tirageLimitant(prec) {
  for (let essai = 0; essai < 200; essai++) {
    const r = reactionDe(alea(REACTIONS_DEFI)), iLim = alea([0, 1]), m = alea([1, 2, 3]), e = alea([1, 2]);
    const n = melangeAvecLimitant(r, iLim, m, e);
    if (n.some((x, i) => x / r.jeton > r.reactifs[i].max + 1e-9)) continue;
    if (prec && prec.type === 'limitant' && prec.rId === r.id && prec.iLim === iLim && prec.m === m && prec.e === e) continue;
    return { type: 'limitant', rId: r.id, n, iLim, m, e, reps: {}, verifie: false, solution: false };
  }
  return { type: 'limitant', rId: 'methane', n: [3, 4], iLim: 1, m: 2, e: 1, reps: {}, verifie: false, solution: false };
}
function tirageProportions(prec) {
  for (let essai = 0; essai < 300; essai++) {
    const r = reactionDe(alea(REACTIONS_DEFI)), fixe = alea([0, 1]), autre = 1 - fixe, m = alea([1, 2, 3, 4, 5, 6]);
    const requis = m * r.reactifs[autre].coef / r.reactifs[fixe].coef;
    if (!Number.isInteger(requis) || requis < 1 || requis > r.reactifs[autre].max || m > r.reactifs[fixe].max) continue;
    if (prec && prec.type === 'proportions' && prec.rId === r.id && prec.fixe === fixe && prec.m === m) continue;
    return { type: 'proportions', rId: r.id, fixe, m, requis, saisie: requis === 1 ? 2 : 1, verifie: false, solution: false };   // le curseur ne part jamais sur la bonne réponse
  }
  return { type: 'proportions', rId: 'methane', fixe: 0, m: 2, requis: 4, saisie: 1, verifie: false, solution: false };
}
const nDefi = d => { const r = reactionDe(d.rId); if (d.type === 'limitant') return d.n; const n = [0, 0]; n[d.fixe] = arrondi(d.m * r.jeton); n[1 - d.fixe] = arrondi(d.saisie * r.jeton); return n; };

function VoletDefi({ defi, setDefi, changerType }) {
  const r = reactionDe(defi.rId), n = nDefi(defi), b = bilan(r, n);
  const prog = lireProgression();
  let ok = false, lignes = [];
  if (defi.verifie) {
    if (defi.type === 'limitant') {
      const iExces = 1 - defi.iLim, vrai = b.restes[iExces], x = lireNombre(defi.reps.reste);
      const o1 = defi.reps.lim === defi.iLim, o2 = isFinite(x) && proche(x, vrai, 0.02);
      ok = o1 && o2;
      lignes = [[o1, o1 ? 'Réactif limitant correct.' : 'Réactif limitant : divisez la quantité de chaque réactif par son coefficient ; le plus petit résultat désigne le limitant.'],
        [o2, o2 ? 'Quantité restante correcte.' : `Quantité restante : le réactif en excès perd (coefficient × nombre de recettes). Calculez ce qui est consommé, puis soustrayez-le de la quantité de départ.`]];
    } else {
      ok = b.stoechio;
      const ex = b.limitants.length === 1 ? 1 - b.limitants[0] : null;
      lignes = [[ok, ok ? 'Bravo : les deux réactifs sont entièrement consommés, il ne reste rien.' : ex !== null ? `Il reste ${mol(r, b.restes[ex])} de ${nomCourt(r.reactifs[ex])} : ce réactif est encore en excès. Ajustez la quantité de l’autre réactif.` : 'Ajustez la quantité.']];
    }
  }
  const suivi = useSuivi(`${SIM}:defi.${defi.type}`, ok);
  const verifier = () => { suivi.essai(); setDefi(d => ({ ...d, verifie: true })); };
  const txt = { fontSize: 14.5, color: KIT.txt, marginBottom: 8, lineHeight: 1.55 }, q = t => <div style={{ fontSize: 14, fontWeight: 700, margin: '10px 0 4px' }}>{t}</div>;
  const rep = (cle, v) => setDefi(d => ({ ...d, reps: { ...(d.reps || {}), [cle]: v }, verifie: false }));
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {Object.entries(TITRES).map(([t, l]) => <button key={t} onClick={() => changerType(t)} style={stylePetitBouton(defi.type === t, '#0ea5e9')}>{prog[`${SIM}:defi.${t}`] ? '✅ ' : ''}{l}</button>)}</div>
      <Equation r={r}/>
      {defi.type === 'limitant' && <>
        <div style={txt}><Pic n="target"/>Voici le mélange de départ. Trouvez le <strong>réactif limitant</strong>, puis la quantité du <strong>réactif en excès</strong> qui reste à la fin (transformation totale).</div>
        <Scene r={r} n={n}/>
        {q('Quel est le réactif limitant ?')}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{r.reactifs.map((e, i) => <button key={e.id} onClick={() => rep('lim', i)} style={stylePetitBouton(defi.reps.lim === i, '#0ea5e9')}>{nomCourt(e)} ({e.nom})</button>)}</div>
        {q(`Quelle quantité du réactif en excès reste-t-il à la fin ?`)}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input value={defi.reps.reste ?? ''} aria-label="Quantité restante" placeholder="?" onChange={e => rep('reste', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') verifier(); }}
            style={{ width: 100, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${KIT.bord}`, fontSize: 14 }}/>
          <span style={{ fontSize: 14, color: KIT.txt2 }}>{r.unite === 'mol' ? 'mol' : 'tranches'}</span></div>
        <IndiceDefi cache={ok}>Pour chaque réactif, divisez sa quantité de matière par son coefficient dans l’équation : le plus petit résultat est le nombre de recettes, et il désigne le limitant. Le réactif en excès perd (son coefficient × ce nombre de recettes) ; ce qui reste, c’est la quantité de départ moins cette perte.</IndiceDefi></>}
      {defi.type === 'proportions' && <>
        <div style={txt}><Pic n="target"/>On dispose de <strong>{mol(r, n[defi.fixe])}</strong> de <strong>{nomCourt(r.reactifs[defi.fixe])}</strong> ({r.reactifs[defi.fixe].nom}). Réglez la quantité de <strong>{nomCourt(r.reactifs[1 - defi.fixe])}</strong> ({r.reactifs[1 - defi.fixe].nom}) pour que <strong>les deux réactifs soient entièrement consommés</strong> : aucun ne doit rester.</div>
        <Scene r={r} n={n}/>
        <div style={{ marginTop: 8 }}><Curseur nom={`Quantité de ${nomCourt(r.reactifs[1 - defi.fixe])}`} valeur={defi.saisie * r.jeton} onChange={v => setDefi(d => ({ ...d, saisie: Math.round(v / r.jeton), verifie: false }))}
          min={r.jeton} max={r.reactifs[1 - defi.fixe].max * r.jeton} pas={r.jeton} unite={r.unite === 'mol' ? 'mol' : ''} decimales={r.dec} couleur="#0ea5e9"/></div>
        <IndiceDefi cache={ok}>L’équation donne les proportions : pour chaque recette, il faut {r.reactifs[0].coef} {nomCourt(r.reactifs[0])} pour {r.reactifs[1].coef} {nomCourt(r.reactifs[1])} (en quantité de matière). Combien de recettes la quantité donnée permet-elle ? Multipliez ensuite ce nombre par le coefficient de l’autre réactif.</IndiceDefi></>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={verifier} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
        <button onClick={() => changerType(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau tirage</button>
        {!ok && !defi.solution && <button onClick={() => { suivi.vue(); setDefi(d => ({ ...d, solution: true })); }} style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>voir la solution</button>}
      </div>
      {defi.verifie && <div style={{ marginTop: 8, fontSize: 14 }}>
        {lignes.map(([o, t], k) => <div key={k} style={{ color: o ? VERT : '#b91c1c', fontWeight: 600 }}>{o ? '✅' : '❌'} {t}</div>)}
        {ok && <div style={{ color: VERT, fontWeight: 700, marginTop: 4 }}><Pic n="party"/>Défi réussi !</div>}</div>}
      {defi.solution && <div style={{ marginTop: 8, fontSize: 13.5, color: KIT.txt, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', lineHeight: 1.55 }}>
        {defi.type === 'limitant'
          ? <>{r.reactifs.map((e, i) => <div key={e.id}>{nomCourt(e)} : {fr(n[i], r.dec)} ÷ {e.coef} = {fr(b.rec[i], r.dec > 1 ? 3 : 1)} recette{b.rec[i] > 1 ? 's' : ''}</div>)}
            Le plus petit nombre est {fr(b.rmin, r.dec > 1 ? 3 : 1)} : le limitant est <strong>{nomCourt(r.reactifs[defi.iLim])}</strong>. Il reste <strong>{mol(r, b.restes[1 - defi.iLim])}</strong> de {nomCourt(r.reactifs[1 - defi.iLim])}.</>
          : <>{mol(r, n[defi.fixe])} de {nomCourt(r.reactifs[defi.fixe])} ÷ {r.reactifs[defi.fixe].coef} = {fr(n[defi.fixe] / r.reactifs[defi.fixe].coef, r.dec > 1 ? 3 : 1)} recette{n[defi.fixe] / r.reactifs[defi.fixe].coef > 1 ? 's' : ''} ; il faut donc {fr(n[defi.fixe] / r.reactifs[defi.fixe].coef, r.dec > 1 ? 3 : 1)} × {r.reactifs[1 - defi.fixe].coef} = <strong>{mol(r, defi.requis * r.jeton)}</strong> de {nomCourt(r.reactifs[1 - defi.fixe])}.</>}
      </div>}
    </div>);
}

// ====================================================
//  SIMULATION
// ====================================================
const VUE0 = { r: 'sandwich', n: [6, 4], k: null, avant: true, produitsSeuls: false, titreAvant: 'Avant', titreApres: 'Après', groupes: false, calc: false, etiq: false, energie: false, pas: false, becher: null };
const V = o => ({ ...VUE0, ...o });

export function SimulationReactifLimitant() {
  const [mode, setMode] = useState(() => modeOuverture('rl2gt-guide-v1'));
  useSignalerMode(mode);
  const VIDE = { etape: 0, reps: {}, verifs: {}, reussies: {} };
  const [guide, setGuide] = useEtatPersistant('rl2gt-guide-v1', VIDE);
  const [defi, setDefi] = useState(null);
  const [vue, setVueBrut] = useState(() => V({}));
  const setVue = o => setVueBrut(V(o));
  const [ex, setEx] = useState({ rId: 'methane', n: [3, 4], k: 0, methode: false });
  const [hypoOuv, setHypoOuv] = useState(false), [essaiOuv, setEssaiOuv] = useState(false), [retOuv, setRetOuv] = useState(false), [qteOuv, setQteOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const bouton = (label, faire) => <button onClick={faire} style={{ ...styleBouton(true, '#4338ca'), margin: '4px 6px 4px 0', padding: '6px 12px', fontSize: 13.5 }}>{label}</button>;
  const rS = reactionDe('sandwich');
  const faireSandwich = () => setVueBrut(v => (peutFaire(rS, v.n, v.k || 0) ? { ...v, k: (v.k || 0) + 1 } : v));
  const TOUTES = [
    { id: 'recette', titre: 'Une recette fixe les proportions',
      depart: () => setVue({ r: 'sandwich', n: [4, 2], k: 2, titreAvant: 'Ingrédients pour 2 sandwichs', titreApres: 'On obtient', produitsSeuls: true }),
      texte: <>Pour faire un <strong>sandwich</strong>, on suit une <strong>recette</strong> : <strong>2 tranches de pain</strong> et <strong>1 tranche de jambon</strong> donnent <strong>1 sandwich</strong>. Les nombres de la recette ne changent pas.
        <ExempleResolu>Pour <strong>2 sandwichs</strong>, il faut deux fois plus de tout : 2 × 2 = <strong>4 tranches de pain</strong> et 2 × 1 = <strong>2 tranches de jambon</strong>.</ExempleResolu>
        À vous : cette fois, on veut <strong>3 sandwichs</strong>.</>,
      tache: { type: 'qcm', q: 'Combien de tranches de pain faut-il pour faire 3 sandwichs ?', options: ['6 tranches', '3 tranches', '5 tranches', '9 tranches'], bonne: 0,
        expl: 'Chaque sandwich demande 2 tranches de pain : 3 × 2 = 6 tranches.', indice: 'Combien de tranches de pain faut-il pour un seul sandwich ? Il faut ce nombre pour chaque sandwich : multipliez-le par 3.' } },
    { id: 'stock', titre: 'Le stock : on fait des sandwichs jusqu’au bout',
      depart: () => setVue({ r: 'sandwich', n: [6, 4], k: 0, avant: false, titreApres: 'Dans la cuisine', pas: true }),
      texte: <>Dans la cuisine, il y a un <strong>stock</strong> de <strong>6 tranches de pain</strong> et <strong>4 tranches de jambon</strong>. Chaque clic sur le bouton fait <strong>un sandwich</strong> avec la recette. On va <strong>jusqu’au bout</strong> : on refait la recette tant que c’est possible. En chimie, on dit que la transformation est <strong>totale</strong>.
        <br/>À vous : faites des sandwichs <strong>jusqu’à ce que ce ne soit plus possible</strong>, et regardez ce qu’il reste.</>,
      tache: { type: 'action', ok: vue.pas && vue.r === 'sandwich' && vue.k === 3, consigne: `Faites autant de sandwichs que possible. Ici : ${vue.k || 0} sandwich${(vue.k || 0) > 1 ? 's' : ''}.` } },
    { id: 'vocab', titre: 'Réactif limitant et réactif en excès',
      depart: () => setVue({ r: 'sandwich', n: [6, 4], k: 3, titreAvant: 'Exemple : le stock de la cuisine', titreApres: 'Exemple : à la fin', etiq: true }),
      texte: <>En chimie, les ingrédients de départ s’appellent les <strong>réactifs</strong> et ce qu’on fabrique s’appelle le <strong>produit</strong>. Ici : pain et jambon sont les réactifs, le sandwich est le produit.
        <ExempleResolu>Regardez le dessin (le stock de 6 pains et 4 jambons). À la fin, il n’y a plus de pain : c’est le pain qui a manqué <em>en premier</em>. On dit que c’est le <strong>réactif limitant</strong> : il <em>limite</em> le nombre de sandwichs. Le jambon n’est pas tout utilisé : il en reste 1 tranche. On dit qu’il est <strong>en excès</strong>.</ExempleResolu>
        À vous : un autre stock. On fait les sandwichs jusqu’au bout : il reste <strong>2 tranches de pain</strong>, mais <strong>plus du tout de jambon</strong>.</>,
      tache: { type: 'qcm', q: 'Quel est le réactif limitant ?', options: ['le jambon', 'le pain', 'les deux', 'le sandwich'], bonne: 0,
        expl: 'Le jambon est entièrement utilisé : c’est lui qui a manqué en premier, il est limitant. Il reste du pain : le pain est en excès.', indice: 'Le réactif limitant est celui qui a disparu complètement. Celui dont il reste est en excès.' } },
    { id: 'methode', titre: 'Trouver le limitant sans tout essayer',
      depart: () => setVue({ r: 'sandwich', n: [10, 4], k: null, titreAvant: 'Le stock' }),
      retenirTitre: 'Réactif limitant et réactif en excès', retenir: <FicheLimitantExces/>,
      texte: <>Faire tous les sandwichs un par un prend du temps. Astuce : pour chaque ingrédient, on calcule <strong>combien de recettes</strong> il permet. On <strong>divise sa quantité par son coefficient</strong> (le nombre de la recette).
        <ExempleResolu>Stock de 6 pains et 4 jambons. Pain : 6 ÷ 2 = <strong>3 recettes</strong>. Jambon : 4 ÷ 1 = <strong>4 recettes</strong>. Le plus petit nombre est 3 : on fera <strong>3 sandwichs</strong>, et le pain est limitant.
          {bouton('Voir l’exemple', () => setVue({ r: 'sandwich', n: [6, 4], k: null, titreAvant: 'Exemple : 6 pains, 4 jambons', calc: true, groupes: true }))}{bouton('Revenir à mon stock', () => setVue({ r: 'sandwich', n: [10, 4], k: null, titreAvant: 'Le stock' }))}</ExempleResolu>
        À vous : <strong>10 tranches de pain</strong> et <strong>4 tranches de jambon</strong>.</>,
      tache: { type: 'num', q: 'Combien de sandwichs peut-on faire au maximum ?', unite: 'sandwichs', vrai: 4, tol: 0.001, affiche: x => String(x),
        calcul: () => ['Pain : 10 ÷ 2 = 5 recettes.', 'Jambon : 4 ÷ 1 = 4 recettes.', 'Le plus petit nombre est 4 : on peut faire 4 sandwichs (le jambon est limitant).'],
        pieges: [[5, 'Vous avez regardé le pain seulement (10 ÷ 2 = 5). Mais le jambon (4 ÷ 1 = 4) permet moins de recettes : c’est lui qui limite.'], [14, 'On n’additionne pas les quantités : on calcule, pour chaque ingrédient, le nombre de recettes possibles, et on garde le plus petit.'], [2.5, 'Il ne faut pas diviser les deux quantités entre elles : divisez chaque quantité par son propre coefficient.']],
        expl: 'Pain : 10 ÷ 2 = 5 recettes ; jambon : 4 ÷ 1 = 4 recettes. Le plus petit est 4 : 4 sandwichs.', indice: <>Premier coup de pouce : pour le pain, divisez 10 par 2 (son coefficient). Pour le jambon, divisez 4 par 1.<br/>Ensuite : gardez le plus petit des deux résultats.</> } },
    { id: 'equation', titre: 'Une équation de réaction, c’est une recette',
      depart: () => setVue({ r: 'methane', n: [1, 2], k: 1, titreAvant: 'Une recette', titreApres: 'Résultat' }),
      retenirTitre: 'La méthode : quantité ÷ coefficient', retenir: <FicheMethode/>,
      texte: <>Une réaction chimique suit aussi une recette : c’est l’<strong>équation de la réaction</strong>. Le nombre devant chaque formule est un <strong>coefficient</strong> : il donne la proportion. Au lieu de compter des tranches, les chimistes comptent des paquets d’entités (molécules, ions…) : <strong>1 mol = un grand paquet d’entités</strong>. Le nombre de paquets s’appelle la <strong>quantité de matière</strong>, en <strong>moles</strong> (mol).
        <ExempleResolu>CH₄ + 2 O₂ → CO₂ + 2 H₂O. Lecture : <strong>1 mol</strong> de méthane réagit avec <strong>2 mol</strong> de dioxygène et donne 1 mol de dioxyde de carbone et 2 mol d’eau.</ExempleResolu>
        À vous : on veut faire réagir <strong>4 mol de méthane</strong>.</>,
      tache: { type: 'num', q: 'Quelle quantité de dioxygène O₂ faut-il pour faire réagir 4 mol de méthane ?', unite: 'mol', vrai: 8, tol: 0.001, affiche: x => String(x),
        calcul: () => ['Pour 1 mol de CH₄, il faut 2 mol de O₂ (coefficient 2).', 'Pour 4 mol de CH₄ (4 recettes), il faut 4 × 2 mol de O₂.', '4 × 2 = 8 mol.'],
        pieges: [[4, 'Vous avez recopié la quantité de méthane. Il faut aussi tenir compte du coefficient 2 devant O₂ : 4 × 2.'], [2, 'C’est le coefficient. Pour 4 mol de méthane, il faut 4 fois la quantité d’une recette : 4 × 2.'], [6, 'On multiplie : 4 recettes demandent 4 × 2 mol de dioxygène, on n’ajoute pas.']],
        expl: 'Chaque mole de méthane demande 2 mol de dioxygène : 4 × 2 = 8 mol.', indice: <>Premier coup de pouce : combien de dioxygène faut-il pour 1 mol de méthane ?<br/>Ensuite : il faut 4 fois plus pour 4 mol de méthane.</> } },
    { id: 'methane', titre: 'Quel est le réactif limitant ? Le méthane brûle',
      depart: () => setVue({ r: 'methane', n: [5, 6], k: null, titreAvant: 'Le mélange de départ' }),
      retenirTitre: 'Une équation, c’est une recette', retenir: <FicheEquationRecette/>,
      texte: <>Même méthode qu’avec les sandwichs : pour chaque réactif, on divise la quantité de matière par son coefficient.
        <ExempleResolu>Mélange de <strong>2,0 mol</strong> de CH₄ et <strong>5,0 mol</strong> de O₂. CH₄ : 2,0 ÷ 1 = <strong>2,0</strong> recettes. O₂ : 5,0 ÷ 2 = <strong>2,5</strong> recettes. Le plus petit est 2,0 : le <strong>méthane est limitant</strong>.
          {bouton('Voir l’exemple', () => setVue({ r: 'methane', n: [2, 5], k: null, titreAvant: 'Exemple : 2,0 mol CH₄ et 5,0 mol O₂', calc: true, groupes: true }))}{bouton('Revenir à mon mélange', () => setVue({ r: 'methane', n: [5, 6], k: null, titreAvant: 'Le mélange de départ' }))}</ExempleResolu>
        À vous : <strong>5,0 mol</strong> de méthane et <strong>6,0 mol</strong> de dioxygène.</>,
      tache: { type: 'qcm', q: 'Quel est le réactif limitant ?', options: ['le dioxygène O₂', 'le méthane CH₄', 'les deux à la fois', 'aucun des deux'], bonne: 0,
        expl: 'CH₄ : 5,0 ÷ 1 = 5,0 recettes. O₂ : 6,0 ÷ 2 = 3,0 recettes. Le plus petit est 3,0 : le dioxygène est limitant (même s’il y en a plus en mol que de méthane).', indice: <>Premier coup de pouce : calculez 5,0 ÷ 1 pour le méthane, puis 6,0 ÷ 2 pour le dioxygène.<br/>Ensuite : le réactif limitant est celui qui donne le plus petit résultat.</> } },
    { id: 'final', titre: 'Ce qu’il reste à la fin',
      depart: () => setVue({ r: 'methane', n: [5, 6], k: null, titreAvant: 'Le mélange de départ' }),
      texte: <>On suppose la transformation <strong>totale</strong> : elle va jusqu’au bout, jusqu’à ce que le réactif limitant soit épuisé. Dans l’<strong>état final</strong> : le limitant a disparu, l’autre réactif (en excès) a diminué, et des produits sont apparus.
        <ExempleResolu>Mélange de 2,0 mol de CH₄ et 5,0 mol de O₂ : on fait <strong>2,0 recettes</strong>. On consomme 1 × 2,0 = 2,0 mol de CH₄ et 2 × 2,0 = 4,0 mol de O₂. Il reste 5,0 − 4,0 = <strong>1,0 mol de O₂</strong>. On obtient 2,0 mol de CO₂ et 4,0 mol de H₂O.
          {bouton('Voir l’état final', () => setVue({ r: 'methane', n: [2, 5], k: 2, titreAvant: 'Exemple : au départ', titreApres: 'Exemple : à la fin', etiq: true }))}{bouton('Revenir à mon mélange', () => setVue({ r: 'methane', n: [5, 6], k: null, titreAvant: 'Le mélange de départ' }))}</ExempleResolu>
        À vous : on reprend <strong>5,0 mol de CH₄ et 6,0 mol de O₂</strong>. Le dioxygène est limitant : il permet <strong>3,0 recettes</strong>.</>,
      tache: { type: 'num', q: 'Quelle quantité de méthane reste-t-il à la fin ?', unite: 'mol', vrai: 2, tol: 0.001, affiche: x => fr(x, 1),
        calcul: () => ['Le dioxygène permet 3,0 recettes : 3,0 recettes sont réalisées.', 'Méthane consommé : 1 × 3,0 = 3,0 mol.', 'Méthane restant : 5,0 − 3,0 = 2,0 mol.'],
        pieges: [[3, 'C’est la quantité de méthane consommée, pas celle qui reste : il faut la retirer de la quantité de départ (5,0 − 3,0).'], [5, 'C’est la quantité de départ. Une partie du méthane a été consommée.'], [0, 'Le méthane est en excès : il en reste. C’est le dioxygène qui est épuisé.']],
        expl: 'Il y a 3,0 recettes : 3,0 mol de CH₄ consommées. Il reste 5,0 − 3,0 = 2,0 mol de méthane.', indice: <>Premier coup de pouce : combien de recettes sont réalisées (nombre donné dans l’énoncé), et combien de méthane faut-il pour chaque recette ?<br/>Ensuite : soustrayez ce qui est consommé de la quantité de départ.</> } },
    { id: 'calcaire', titre: 'Lire l’état final : de l’acide sur du calcaire',
      depart: () => setVue({ r: 'calcaire', becher: 'solide' }),
      retenirTitre: 'Ce qu’il reste à la fin', retenir: <FicheEtatFinal/>,
      texte: <>On verse de l’acide sur du <strong>calcaire</strong> (un solide blanc, de formule CaCO₃). L’acide contient des <strong>ions H⁺</strong> (des particules chargées) : ce sont eux qui attaquent le calcaire. La réaction forme des bulles de gaz (CO₂) et des <strong>ions Ca²⁺</strong>, les ions calcium : on ne les voit pas, ils restent dissous dans le liquide. Les bulles s’arrêtent quand un réactif est épuisé. <strong>En regardant ce qu’il reste</strong>, on peut trouver le réactif limitant <strong>sans aucun calcul</strong>.
        <ExempleResolu>Si, à la fin, il n’y avait <strong>plus du tout de solide</strong>, le calcaire aurait disparu en premier : il serait limitant.
          {bouton('Voir ce cas', () => setVue({ r: 'calcaire', becher: 'sans' }))}{bouton('Revenir à mon bécher', () => setVue({ r: 'calcaire', becher: 'solide' }))}</ExempleResolu>
        À vous : regardez le bécher « À la fin » (le liquide reste dans le bécher ; les ions, eux, ne se voient pas).</>,
      tache: { type: 'qcm', q: 'Il n’y a plus de bulles mais il reste du solide blanc. Quel est le réactif limitant ?', options: ['l’acide (ions H⁺)', 'le calcaire CaCO₃', 'le dioxyde de carbone CO₂', 'aucun réactif'], bonne: 0,
        expl: 'Il reste du calcaire : il est en excès. Ce qui a disparu en premier, ce sont les ions H⁺ de l’acide : ils sont limitants. Les bulles s’arrêtent parce qu’il n’y a plus d’acide qui réagit.', indice: 'Le réactif en excès est celui dont il reste. Le réactif limitant est celui qui a disparu. Le dioxyde de carbone est un produit, pas un réactif.' } },
    { id: 'calcmol', titre: 'Le calcaire avec des quantités de matière',
      depart: () => setVue({ r: 'calcaire', n: [0.02, 0.07], k: null, titreAvant: 'Le mélange de départ' }),
      retenirTitre: 'Lire l’état final', retenir: <FicheLireEtatFinal/>,
      texte: <>Même méthode pour l’acide sur le calcaire, avec des quantités de matière. Elles sont petites : on utilise des centièmes de mole.
        <ExempleResolu><strong>0,050 mol</strong> de calcaire et <strong>0,060 mol</strong> d’ions H⁺. CaCO₃ : 0,050 ÷ 1 = 0,050 recette. H⁺ : 0,060 ÷ 2 = <strong>0,030</strong> recette. Le plus petit est 0,030 : H⁺ est limitant. Calcaire consommé : 1 × 0,030 = 0,030 mol. Il reste 0,050 − 0,030 = <strong>0,020 mol</strong> de calcaire.
          {bouton('Voir l’exemple', () => setVue({ r: 'calcaire', n: [0.05, 0.06], k: 0.03, titreAvant: 'Exemple : au départ', titreApres: 'Exemple : à la fin', etiq: true }))}{bouton('Revenir à mon mélange', () => setVue({ r: 'calcaire', n: [0.02, 0.07], k: null, titreAvant: 'Le mélange de départ' }))}</ExempleResolu>
        À vous : <strong>0,020 mol</strong> de calcaire et <strong>0,070 mol</strong> d’ions H⁺ (transformation totale).</>,
      tache: { type: 'num', q: 'Quelle quantité d’ions H⁺ reste-t-il à la fin ?', unite: 'mol', vrai: 0.03, tol: 0.001, affiche: x => fr(x, 3),
        calcul: () => ['Calcaire : 0,020 ÷ 1 = 0,020 recette. H⁺ : 0,070 ÷ 2 = 0,035 recette.', 'Le plus petit est 0,020 : le calcaire est limitant, on fait 0,020 recette.', 'H⁺ consommés : 2 × 0,020 = 0,040 mol. Il reste 0,070 − 0,040 = 0,030 mol.'],
        pieges: [[0.05, 'Vous avez fait 0,070 − 0,020 : on ne retire pas la quantité d’un réactif à celle d’un autre. Il faut retirer ce qui a été consommé : 2 × 0,020.'], [0.04, 'C’est la quantité d’ions H⁺ consommée, pas celle qui reste : 0,070 − 0,040.'], [0.07, 'C’est la quantité d’ions H⁺ au départ : une partie a été consommée.'], [0.015, 'C’est la différence entre les nombres de recettes (0,035 − 0,020). Il faut retirer ce qui est consommé : 2 × 0,020.'], [0, 'Les ions H⁺ sont en excès : il en reste. C’est le calcaire qui est épuisé.']],
        expl: 'Calcaire : 0,020 recette ; H⁺ : 0,035 recette. Le calcaire est limitant. Il reste 0,070 − 2 × 0,020 = 0,030 mol d’ions H⁺.', indice: <>Premier coup de pouce : divisez chaque quantité par son coefficient (1 pour le calcaire, 2 pour H⁺) et gardez le plus petit.<br/>Ensuite : retirez ce qui est consommé (coefficient de H⁺ × nombre de recettes) de la quantité de départ.</> } },
    { id: 'energie', titre: 'Plus de limitant, plus d’énergie',
      depart: () => setVue({ r: 'methane', n: [2, 6], k: 2, titreAvant: 'Exemple : 2,0 mol CH₄ et 6,0 mol O₂', titreApres: 'À la fin', energie: true }),
      texte: <>Brûler du méthane <strong>libère de l’énergie</strong> (de la chaleur). Cette énergie dépend de la quantité de <strong>réactif limitant</strong> : c’est lui qui décide combien de recettes sont réalisées. Plus il y a de recettes, plus on libère d’énergie : l’énergie est <strong>proportionnelle</strong> à la quantité de réactif limitant.
        <ExempleResolu>Avec 2,0 mol de CH₄ (limitant) : 2 carrés d’énergie. Si on ajoute du dioxygène, le méthane reste limitant : toujours 2 carrés. Avec 4,0 mol de CH₄ (et assez de O₂) : 4 carrés, le double.
          {bouton('2,0 mol CH₄', () => setVue({ r: 'methane', n: [2, 6], k: 2, titreAvant: 'Exemple : 2,0 mol CH₄ et 6,0 mol O₂', titreApres: 'À la fin', energie: true }))}{bouton('Plus de O₂', () => setVue({ r: 'methane', n: [2, 8], k: 2, titreAvant: 'Exemple : 2,0 mol CH₄ et 8,0 mol O₂', titreApres: 'À la fin', energie: true }))}{bouton('4,0 mol CH₄', () => setVue({ r: 'methane', n: [4, 8], k: 4, titreAvant: 'Exemple : 4,0 mol CH₄ et 8,0 mol O₂', titreApres: 'À la fin', energie: true }))}</ExempleResolu>
        À vous : on brûle d’abord <strong>1,0 mol</strong> de méthane, puis <strong>3,0 mol</strong>, toujours avec beaucoup de dioxygène.</>,
      tache: { type: 'qcm', q: 'Par combien l’énergie libérée est-elle multipliée ?', options: ['par 3', 'par 1 : elle ne change pas', 'par 9', 'par 4, car 3 + 1 = 4'], bonne: 0,
        expl: 'Le méthane est limitant et sa quantité est multipliée par 3 : l’énergie libérée est multipliée par 3 (proportionnalité).', indice: 'L’énergie est proportionnelle à la quantité de réactif limitant. Ici, le méthane est limitant : par combien sa quantité est-elle multipliée ?' } },
    { id: 'dba', titre: 'Un cas réel : la synthèse de la DBA',
      depart: () => setVue({ r: 'dba', n: [6, 4], k: null, titreAvant: 'Le mélange du chimiste' }),
      retenirTitre: 'Énergie et réactif limitant', retenir: <FicheEnergie/>,
      texte: <>Au laboratoire, on fabrique la <strong>DBA</strong>, un solide jaune (elle sert entre autres dans des crèmes solaires), à partir de deux liquides : le <strong>benzaldéhyde</strong> et l’<strong>acétone</strong>. Le chimiste veut savoir ce qu’il restera à la fin.
        <ExempleResolu>Autre mélange : <strong>0,080 mol</strong> de benzaldéhyde et <strong>0,030 mol</strong> d’acétone. Benzaldéhyde : 0,080 ÷ 2 = 0,040 recette. Acétone : 0,030 ÷ 1 = <strong>0,030</strong> recette. Le plus petit est 0,030 : l’acétone est limitante. Benzaldéhyde consommé : 2 × 0,030 = 0,060 mol. Il reste 0,080 − 0,060 = <strong>0,020 mol</strong> de benzaldéhyde.
          <br/>« 0,030 recette » veut dire qu’on réalise seulement une petite partie de la recette de base (2 mol de benzaldéhyde pour 1 mol d’acétone), car les quantités sont petites.
          {bouton('Voir l’exemple', () => setVue({ r: 'dba', n: [0.08, 0.03], k: 0.03, titreAvant: 'Exemple : au départ', titreApres: 'Exemple : à la fin', etiq: true }))}{bouton('Revenir à mon mélange', () => setVue({ r: 'dba', n: [6, 4], k: null, titreAvant: 'Le mélange du chimiste' }))}</ExempleResolu>
        À vous : <strong>0,060 mol</strong> de benzaldéhyde et <strong>0,040 mol</strong> d’acétone (transformation totale).</>,
      tache: { type: 'num', q: 'Quelle quantité d’acétone reste-t-il à la fin ?', unite: 'mol', vrai: 0.01, tol: 0.001, affiche: x => fr(x, 3),
        calcul: () => ['Benzaldéhyde : 0,060 ÷ 2 = 0,030 recette. Acétone : 0,040 ÷ 1 = 0,040 recette.', 'Le plus petit est 0,030 : le benzaldéhyde est limitant, on fait 0,030 recette.', 'Acétone consommée : 1 × 0,030 = 0,030 mol. Il reste 0,040 − 0,030 = 0,010 mol.'],
        pieges: [[0.04, 'C’est la quantité d’acétone au départ : une partie a été consommée.'], [0.03, 'C’est la quantité d’acétone consommée, pas celle qui reste : 0,040 − 0,030.'], [0.02, 'Vous avez fait 0,060 − 0,040 : on ne retire pas la quantité d’un réactif à celle d’un autre. Il faut retirer ce qui a été consommé : 1 × 0,030 mol d’acétone.'], [0, 'L’acétone est en excès : il en reste. C’est le benzaldéhyde qui est épuisé.']],
        expl: 'Benzaldéhyde : 0,030 recette ; acétone : 0,040 recette. Le benzaldéhyde est limitant. Il reste 0,040 − 0,030 = 0,010 mol d’acétone.', indice: <>Premier coup de pouce : divisez chaque quantité par son coefficient (2 pour le benzaldéhyde, 1 pour l’acétone) et gardez le plus petit.<br/>Ensuite : retirez ce qui est consommé de la quantité d’acétone de départ.</> } },
    { id: 'fin', titre: 'Le bilan',
      depart: () => setVue({ r: 'dba', n: [6, 4], k: 3, titreAvant: 'Au départ', titreApres: 'À la fin', etiq: true }),
      texte: <><ARetenir sansFiche><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>Une équation de réaction est une <strong>recette</strong> : les coefficients donnent les proportions.</li>
        <li>Pour chaque réactif, on calcule <strong>quantité ÷ coefficient</strong> : le plus petit résultat désigne le <strong>réactif limitant</strong>.</li>
        <li>Dans l’état final, le limitant a <strong>disparu</strong>, l’autre réactif est <strong>en excès</strong> (il en reste), des produits sont apparus.</li>
        <li>L’énergie échangée est <strong>proportionnelle</strong> à la quantité de réactif limitant.</li></ul></ARetenir>
        <p style={{ margin: '8px 0 0' }}>À la fin de la synthèse de la DBA, il reste de l’acétone. Elle se mélange très bien à l’eau, alors que la DBA est insoluble dans l’eau : un lavage à l’eau peut éliminer l’acétone en excès, et on récupère la DBA solide par filtration. Savoir quel réactif est en excès aide donc à prévoir la purification.</p></>,
      tache: null },
  ];
  const ETAPES = TOUTES;
  useEffect(() => {           // à l'arrivée sur une étape, on met en place sa situation de départ
    if (mode !== 'guide') return;
    const d = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (d) d();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  // ════════════════ DÉFIS ════════════════
  function lancer(type, prec) { setDefi(type === 'proportions' ? tirageProportions(prec) : tirageLimitant(prec)); }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'limitant', null); }

  // ════════════════ EXPLORATION ════════════════
  const rE = reactionDe(ex.rId), bE = bilan(rE, ex.n), finE = Math.abs(ex.k - bE.rmin) < 1e-9;
  const pasE = rE.jeton, peutE = peutFaire(rE, ex.n, ex.k, pasE);      // un clic = un « pas » : 1 recette (méthane), 0,01 recette (calcaire, DBA : quantités en centièmes de mole)
  const choisirReaction = id => { const r = reactionDe(id); setEx({ rId: id, n: r.n0.map(x => arrondi(x * r.jeton)), k: 0, methode: false }); };
  const regler = (i, v) => setEx(s => ({ ...s, n: s.n.map((x, j) => (j === i ? arrondi(v) : x)), k: 0 }));
  const verdictE = finE ? (bE.stoechio ? 'Les deux réactifs sont entièrement consommés : on avait exactement les proportions de la recette.'
    : `Le réactif limitant est ${nomCourt(rE.reactifs[bE.limitants[0]])}. Il reste ${mol(rE, bE.restes[1 - bE.limitants[0]])} de ${nomCourt(rE.reactifs[1 - bE.limitants[0]])} (réactif en excès).`) : null;
  const resumeQ = rE.reactifs.map((e, i) => `${nomCourt(e)} ${mol(rE, ex.n[i])}`).join(' · ');
  const exploration = (
    <div className="rl-ex">
      <div className="rl-sc">
        <Equation r={rE}/>
        <Scene r={rE} n={ex.n} k={ex.k} titreAvant="Au départ" titreApres={finE ? 'À la fin' : 'En cours'} groupes={ex.methode} calc={ex.methode} etiq={finE} energie/>
        {verdictE && <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 10, background: '#f0fdf4', border: '1.5px solid #86efac', fontSize: 14.5, lineHeight: 1.5 }}><Pic n="ok"/>{verdictE}</div>}
      </div>
      <div className="rl-reg">
        <div style={styleBoite}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>Quelle réaction ?</div>
          <select value={ex.rId} onChange={e => choisirReaction(e.target.value)} aria-label="Choisir la réaction" style={{ width: '100%', minHeight: 44, borderRadius: 10, border: `1.5px solid ${KIT.bord}`, fontSize: 15, padding: '0 8px', background: '#fff' }}>
            {REACTIONS.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}</select>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            <button onClick={() => setEx(s => ({ ...s, k: peutFaire(rE, s.n, s.k, pasE) ? arrondi(s.k + pasE) : s.k }))} disabled={!peutE} style={{ ...styleBouton(true, '#16a34a'), opacity: peutE ? 1 : 0.45 }}>{pasE === 1 ? 'Faire une recette' : `Faire ${fr(pasE, 2)} recette`}</button>
            <button onClick={() => setEx(s => ({ ...s, k: bE.rmin }))} disabled={finE} style={{ ...styleBouton(true, '#4338ca'), opacity: finE ? 0.45 : 1 }}>Tout faire</button>
            <button onClick={() => setEx(s => ({ ...s, k: 0 }))} style={styleBouton(false)}>↺ Recommencer</button>
          </div>
          <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>{pasE === 1 ? 'Chaque clic réalise la recette une fois' : `Les quantités sont petites : chaque clic réalise seulement ${fr(pasE, 2)} recette (une petite partie de la recette)`} : les réactifs diminuent, les produits apparaissent. « Tout faire » va jusqu’à l’épuisement du limitant.</div>
          {!finE && !peutE && <div style={{ fontSize: 13, color: ORANGE, fontWeight: 700, marginTop: 4 }}>Il ne reste pas de quoi faire un pas entier : cliquez sur « Tout faire ».</div>}
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={ex.methode} onChange={e => setEx(s => ({ ...s, methode: e.target.checked }))} style={{ width: 20, height: 20 }}/>Montrer la méthode : quantité ÷ coefficient</label>
        </div>
        <Section titre={`Quantités de départ · ${resumeQ}`} ouvert={qteOuv} onBascule={() => setQteOuv(o => !o)}>
          <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Changez les quantités : le limitant peut changer.</div>
          {rE.reactifs.map((e, i) => <Curseur key={e.id} nom={`${nomCourt(e)} (${e.nom})`} valeur={ex.n[i]} onChange={v => regler(i, v)} min={rE.jeton} max={e.max * rE.jeton} pas={rE.jeton} unite={rE.unite === 'mol' ? 'mol' : ''} decimales={rE.dec} couleur={COULEURS[`r${i}`]}/>)}
        </Section>
      </div>
    </div>);

  // ════════════════ PANNEAUX ════════════════
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Transformation totale et rapide</strong> : elle va jusqu’au bout, jusqu’à l’épuisement du réactif limitant, et on n’attend pas pour regarder l’état final. (Beaucoup de transformations réelles s’arrêtent avant la fin : on les étudiera plus tard.)</li>
      <li><strong>Réactifs purs</strong> : seules les espèces de l’équation interviennent. <strong>Pas de réaction parasite</strong> : aucune autre transformation ne consomme les réactifs.</li>
      <li><strong>Quantités données</strong> : les quantités de matière sont connues (on ne les calcule pas ici) ; elles sont exactes, sans incertitude.</li>
      <li><strong>Méthode de seconde</strong> : on compare quantité ÷ coefficient pour chaque réactif. Le plus petit résultat dit combien de fois la recette peut être réalisée au maximum.</li>
      <li><strong>Catalyseur et solvant</strong> (synthèse de la DBA) : en vrai, on utilise aussi un solvant (le liquide dans lequel on mélange) et un catalyseur (une espèce qui accélère la réaction sans être consommée). On ne les écrit pas dans l’équation : ils ne sont pas des réactifs et ne changent pas le réactif limitant.</li>
      <li><strong>Énergie</strong> : seule la proportionnalité à la quantité de réactif limitant est étudiée. L’échelle (1 carré = énergie de 1 mol de méthane brûlé) est relative : aucune valeur en kJ.</li>
      <li><strong>Solubilités</strong> (DBA, acétone) : indications qualitatives pour comprendre la purification, sans valeurs.</li>
    </ul>);
  const panneauHypo = <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>;
  const aEssayer = (
    <Section titre="À essayer" ouvert={essaiOuv} onBascule={() => setEssaiOuv(o => !o)}>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Recette de sandwich : mettez 2 pains et 1 jambon. Que se passe-t-il ? Et avec 5 pains et 1 jambon ?</li>
        <li>Méthane : réglez 2,0 mol de CH₄ et 4,0 mol de O₂. Les deux réactifs sont-ils consommés ? Pourquoi ?</li>
        <li>Montrez la méthode : le limitant est-il toujours celui dont il y a le moins de moles ?</li>
        <li>Augmentez la quantité du réactif en excès : l’énergie libérée change-t-elle ? Et celle du limitant ?</li>
        <li>Acide sur calcaire : trouvez deux mélanges, un où il reste du calcaire, un où il n’en reste plus.</li></ul>
    </Section>);
  const retenirExplo = (
    <Section titre="À retenir" ouvert={retOuv} onBascule={() => setRetOuv(o => !o)}>
      <ARetenir sansFiche><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>nombre de recettes d’un réactif = quantité ÷ coefficient</li>
        <li>le plus petit nombre désigne le réactif limitant : il disparaît</li>
        <li>l’autre réactif est en excès : il en reste</li></ul></ARetenir>
    </Section>);

  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}><Pic n="target"/>Défis</button>
    </span>);
  const idxFin = ETAPES.findIndex(e => e.id === 'fin'), finVu = !enGuide || (idxFin >= 0 && guide.etape >= idxFin);

  // ---------- scène du parcours guidé ----------
  const rV = reactionDe(vue.r);
  const sceneGuide = vue.becher
    ? <SceneBecher fin={vue.becher}/>
    : <Scene r={rV} n={vue.n || rV.n0.map(x => x * rV.jeton)} k={vue.k} avant={vue.avant} produitsSeuls={vue.produitsSeuls} titreAvant={vue.titreAvant} titreApres={vue.titreApres} groupes={vue.groupes} calc={vue.calc} etiq={vue.etiq} energie={vue.energie}/>;
  const pasAPas = vue.pas && (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
      <button onClick={faireSandwich} disabled={!peutFaire(rS, vue.n, vue.k || 0)} style={{ ...styleBouton(true, '#16a34a'), opacity: peutFaire(rS, vue.n, vue.k || 0) ? 1 : 0.45 }}>Faire un sandwich</button>
      <button onClick={() => setVueBrut(v => ({ ...v, k: 0 }))} style={styleBouton(false)}>↺ Recommencer</button>
      {!peutFaire(rS, vue.n, vue.k || 0) && <span style={{ fontSize: 14, color: ORANGE, fontWeight: 700 }}>Impossible d’en faire un de plus : il manque du pain.</span>}
    </div>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .rl-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .rl-l1.cote { grid-template-columns: minmax(0, 1.3fr) minmax(300px, 1fr); }
        .rl-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        .rl-ex .rl-sc { grid-column: 1; grid-row: 1; }
        @media (min-width: 901px) { .rl-ex { grid-template-columns: minmax(0, 1.4fr) minmax(280px, 1fr); } .rl-ex .rl-reg { grid-column: 2; grid-row: 1; } }
        @media (max-width: 900px) { .rl-l1.cote { grid-template-columns: minmax(0, 1fr); } .rl-ex .rl-reg { grid-row: 2; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Réactif limitant</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      {enExplore && <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>Une réaction suit une recette : quand un réactif manque, la réaction s’arrête. Choisissez une réaction, faites-la avancer et regardez ce qu’il reste.</div>}
      {enExplore && exploration}
      {enGuide && (
        <div className="rl-l1 cote">
          <div>
            <Equation r={rV}/>
            {sceneGuide}
            {pasAPas}
          </div>
          <div><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div>
        </div>)}
      {enDefi && <div style={{ ...styleBoite, marginBottom: 12 }}><VoletDefi defi={defi} setDefi={setDefi} changerType={t => lancer(t, defi)}/></div>}
      {(enExplore || enDefi || (enGuide && finVu)) && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      {enExplore && <div style={{ display: 'grid', gap: 0 }}>{aEssayer}{retenirExplo}</div>}
    </div>
  );
}

