import { useState, useEffect } from "react";
import { useSignalerMode, declarerDefis, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, ExempleResolu, lireNombre, proche } from "../commun";
import { fr, lampeI, regression } from "./elecModele";
import { BLEU, VERMILLON, VIOLET, alea, usePhase } from "./elecOutils";
import { Curseur, VoletDefiGen, Graphe, Fil, Mesure } from "./elecCommun";

// ====================================================
//  SIM 72 — CARACTÉRISTIQUE D'UNE PILE : SOURCE RÉELLE DE TENSION (1G spé PC, « Aspects énergétiques des phénomènes électriques »)
//  Caractéristique U = f(I) d'un dipôle (lampe, conducteur ohmique), puis d'une pile : U = U₀ − r·I ; source idéale (r = 0) ; modèle d'une
//  source réelle = source idéale + résistance r en série ; effet Joule dans la pile ; régression linéaire.
//  Hypothèses : caractéristique de la pile affine (U₀ et r constants : en réalité r augmente quand la pile s'use), mesures de U à 0,01 V près et
//  de I à 0,1 mA près, boîte à décades de résistances, pile plate « 4,5 V » modélisée par U₀ = 4,43 V et r = 5,0 Ω (mesures du TP chargeables).
// ====================================================

const SIM = 72;
declarerDefis(SIM, [
  ['u0r', 'Déterminer U₀ et r'],
  ['tension', 'Tension sous charge'],
  ['courant', 'Courant débité'],
  ['joule', 'Perte dans la pile'],
]);
const TITRES = { u0r: 'Trouver r', tension: 'Tension U', courant: 'Courant I', joule: 'Effet Joule' };
const DECADES = [2000, 1000, 680, 470, 330, 220, 150, 100, 68, 47, 33, 22, 15, 10];       // Ω, boîte à décades
const PILES = { plate: ['Pile plate « 4,5 V »', 4.43, 5.0], usee: ['Pile usée', 4.2, 25], labo: ['Alimentation du lycée (idéale)', 6.0, 0] };
// Mesures réelles du TP (pile plate) : [I (mA), U (V)]
const TP = [[0, 4.43], [0.4, 4.43], [3.98, 4.4], [5.44, 4.39], [7.2, 4.38], [8.6, 4.37], [10.66, 4.36], [14.04, 4.34], [20.52, 4.3], [38.2, 4.21], [41.76, 4.18], [46.17, 4.16], [51.58, 4.14], [58.46, 4.1], [67.41, 4.06], [79.69, 4.0], [97, 3.92], [125.8, 3.8]];
const arr = (x, d) => Math.round(x * Math.pow(10, d)) / Math.pow(10, d);

// ---------- schéma : pile réelle = source idéale + r ----------
function SchemaSource({ U0, r, R, I, ph, modele }) {
  const U = U0 - r * I;
  return (
    <svg viewBox="0 0 560 280" width="100%" role="img" aria-label="Pile réelle modélisée par une source idéale de tension U0 en série avec une résistance r, branchée sur un résistor R" style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10, maxWidth: 640 }}>
      <Fil pts={[[60, 235], [60, 60], [500, 60], [500, 235], [60, 235]]} v={30 + 400 * I} ph={ph}/>
      {modele ? <>
        <rect x="20" y="90" width="180" height="140" rx="10" fill="none" stroke="#64748b" strokeWidth="2.5" strokeDasharray="8 5"/>
        <text x="72" y="110" fontSize="12.5" fontWeight="800" fill="#475569">pile réelle (modèle)</text>
        <circle cx="60" cy="170" r="22" fill="#fff" stroke="#0f172a" strokeWidth="3"/><text x="60" y="176" fontSize="16" fontWeight="800" textAnchor="middle">U₀</text>
        <text x="86" y="168" fontSize="12" fontWeight="700" fill="#0f172a">source idéale</text>
        <rect x="26" y="116" width="68" height="24" fill="#fff" stroke="#d55e00" strokeWidth="3"/><text x="130" y="133" fontSize="14" fontWeight="800" fill="#d55e00">r = {fr(r, 1)} Ω</text>
      </> : <>
        <rect x="38" y="140" width="44" height="50" fill="#fff"/><line x1="40" y1="150" x2="80" y2="150" stroke="#0f172a" strokeWidth="4"/><line x1="49" y1="168" x2="71" y2="168" stroke="#0f172a" strokeWidth="6"/>
        <text x="30" y="148" fontSize="16" fontWeight="800" textAnchor="end" fill={VERMILLON}>+</text><text x="30" y="178" fontSize="18" fontWeight="800" textAnchor="end" fill={BLEU}>−</text>
        <text x="92" y="162" fontSize="14" fontWeight="800">pile</text></>}
      <rect x="320" y="46" width="110" height="28" fill="#fff" stroke="#0f172a" strokeWidth="3"/><text x="375" y="66" fontSize="14" fontWeight="800" textAnchor="middle">{R >= 1e5 ? 'K ouvert' : `R = ${fr(R, 0)} Ω`}</text>
      <Mesure x={375} y={102} nom="I" val={`${fr(I * 1000, 1)} mA`} w={118}/>
      <Mesure x={500} y={150} nom="U" val={`${fr(U, 2)} V`} couleur={BLEU} w={104}/>
      <text x="488" y="200" fontSize="12.5" fontWeight="700" fill={VERMILLON} textAnchor="end">sens ↓</text>
    </svg>);
}

// ---------- défis ----------
function nouveauDefi(type) {
  const base = { type, reps: {}, verifie: false, solution: false };
  const U0 = alea([4.5, 6, 9]), r = alea([2, 5, 10, 20]);
  if (type === 'u0r') { const I2 = alea([100, 150, 200]), U2 = arr(U0 - r * I2 / 1000, 3); return { ...base, U0, I2, U2, r: (U0 - U2) / (I2 / 1000) }; }
  if (type === 'tension') { const I = alea([50, 100, 150, 200]); return { ...base, U0, r, I, U: U0 - r * I / 1000 }; }
  if (type === 'courant') { const R = alea([10, 22, 47, 100]); return { ...base, U0, r, R, I: U0 / (r + R) * 1000 }; }
  const I = alea([100, 200, 300]), dt = alea([60, 600, 3600]); return { ...base, r, I, dt, Q: r * (I / 1000) ** 2 * dt };
}
function evaluer(d) {
  const x = lireNombre(d.reps.v);
  if (d.type === 'u0r') { const ok = isFinite(x) && proche(x, d.r, 0.03); return { ok, lignes: [[ok, ok ? 'Résistance interne correcte.' : 'Revois : U = U₀ − r·I, donc r = (U₀ − U) / I, avec I en ampères. À vide, U = U₀.']] }; }
  if (d.type === 'tension') { const ok = isFinite(x) && proche(x, d.U, 0.01); return { ok, lignes: [[ok, ok ? 'Tension correcte.' : 'Revois : U = U₀ − r × I, avec I en ampères (100 mA = 0,100 A).']] }; }
  if (d.type === 'courant') { const ok = isFinite(x) && proche(x, d.I, 0.02); return { ok, lignes: [[ok, ok ? 'Intensité correcte.' : 'Revois : la pile (U₀ en série avec r) alimente R : I = U₀ / (r + R). Réponse en mA.']] }; }
  const ok = isFinite(x) && proche(x, d.Q, 0.02); return { ok, lignes: [[ok, ok ? 'Transfert thermique correct.' : 'Revois : Q = r × I² × Δt, avec I en ampères (I est au carré), Δt en secondes.']] };
}
const enonce = (d, { champ }) => {
  if (d.type === 'u0r') return <>🎯 Une pile délivre à vide <strong>U₀ = {fr(d.U0, 1)} V</strong>. Lorsqu’elle débite <strong>I = {d.I2} mA</strong>, un voltmètre indique <strong>U = {fr(d.U2, 3)} V</strong> à ses bornes. Quelle est sa résistance interne r ?<div style={{ marginTop: 6 }}>{champ('v', 'Ω')}</div></>;
  if (d.type === 'tension') return <>🎯 Une pile de tension à vide <strong>U₀ = {fr(d.U0, 1)} V</strong> et de résistance interne <strong>r = {d.r} Ω</strong> débite un courant <strong>I = {d.I} mA</strong>. Quelle est la tension U entre ses bornes ?<div style={{ marginTop: 6 }}>{champ('v', 'V')}</div></>;
  if (d.type === 'courant') return <>🎯 Une pile de tension à vide <strong>U₀ = {fr(d.U0, 1)} V</strong> et de résistance interne <strong>r = {d.r} Ω</strong> alimente un conducteur ohmique de résistance <strong>R = {d.R} Ω</strong>. Quelle intensité I débite-t-elle ?<div style={{ marginTop: 6 }}>{champ('v', 'mA')}</div></>;
  return <>🎯 Une pile de résistance interne <strong>r = {d.r} Ω</strong> débite <strong>I = {d.I} mA</strong> pendant <strong>Δt = {d.dt} s</strong>. Quel transfert thermique Q est produit par effet Joule <strong>dans la pile</strong> ?<div style={{ marginTop: 6 }}>{champ('v', 'J')}</div></>;
};
const solution = d => d.type === 'u0r' ? <>U = U₀ − r × I donc r = (U₀ − U) / I = ({fr(d.U0, 1)} − {fr(d.U2, 3)}) / {fr(d.I2 / 1000, 3)} = <strong>{fr(d.r, 1)} Ω</strong>.</>
  : d.type === 'tension' ? <>U = U₀ − r × I = {fr(d.U0, 1)} − {d.r} × {fr(d.I / 1000, 3)} = <strong>{fr(d.U, 2)} V</strong>.</>
  : d.type === 'courant' ? <>Loi d’Ohm dans le circuit : U₀ = (r + R) × I donc I = U₀ / (r + R) = {fr(d.U0, 1)} / {d.r + d.R} = <strong>{fr(d.I, 1)} mA</strong>.</>
  : <>Q = r × I² × Δt = {d.r} × {fr(d.I / 1000, 3)}² × {d.dt} = <strong>{fr(d.Q, d.Q < 100 ? 2 : 0)} J</strong>.</>;

// ====================================================
export function SimulationCaracPile() {
  const [mode, setMode] = useState(() => modeOuverture('pile-guide-v1'));
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('pile-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [atelier, setAtelier] = useState('tp');
  const [pile, setPile] = useState('plate');
  const [K, setK] = useState({ ferme: false, d: 7 });
  const [pts, setPts] = useState([]);
  const [M, setM] = useState({ U0: 4.5, r: 5, R: 100 });
  const [Lec, setLec] = useState({ dip: 'res', U: 4 });
  const [hypoOuv, setHypoOuv] = useState(false);
  const ph = usePhase(true);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';

  const [, U0p, rp] = PILES[pile];
  const Rd = DECADES[K.d], Itp = K.ferme ? U0p / (Rd + rp) : 0, Utp = arr(U0p - rp * Itp, 2);
  const reg = pts.length >= 2 ? regression(pts) : null;       // U (V) = a·I (mA) + b
  const Im = M.U0 / (M.r + M.R), Um = M.U0 - M.r * Im;
  const voir = (at, p) => { setAtelier(at); if (p && p.pile) { setPile(p.pile); setPts([]); setK({ ferme: false, d: 7 }); } if (p && p.M) setM(m => ({ ...m, ...p.M })); };
  const noter = () => setPts(p => [...p, [arr(Itp * 1000, 1), Utp]].slice(-30));
  const nPtsOK = n => enGuide && atelier === 'tp' && pts.length >= n;

  const ETAPES = [
    { id: 'vide', titre: 'La tension à vide', depart: () => voir('tp', { pile: 'plate' }),
      texte: <>Une pile « 4,5 V » a une tension <strong>à vide</strong> U₀ (interrupteur ouvert, aucun courant) : ici <strong>4,43 V</strong>. Montage : la pile alimente une <strong>boîte à décades</strong> (résistances réglables) ; un ampèremètre mesure I et un voltmètre mesure la tension U = U<sub>PN</sub> aux bornes de la pile. Ouvrez puis fermez l’interrupteur et comparez U.</>,
      tache: { type: 'qcm', q: 'Interrupteur ouvert, quelle est l’intensité I et que mesure le voltmètre ?', options: ['I = 0 et le voltmètre donne la tension à vide U₀', 'I = 0 et U = 0', 'I est maximale', 'on ne peut rien mesurer'], bonne: 0, expl: 'Sans courant (I = 0), la tension aux bornes de la pile est sa tension à vide U₀.' } },
    { id: 'mesures', titre: 'Faire varier le courant débité', depart: () => voir('tp', { pile: 'plate' }),
      texte: <>Fermez l’interrupteur, puis <strong>diminuez R</strong> pour faire augmenter I. À chaque étape, notez (I ; U). Faites <strong>au moins 6 mesures</strong>, en incluant la mesure à vide (I = 0). Vous pouvez aussi charger les mesures réelles du TP.</>,
      tache: { type: 'action', ok: nPtsOK(6), consigne: 'Notez au moins 6 mesures (I ; U), dont une à vide.' } },
    { id: 'carac', titre: 'La caractéristique de la pile', depart: null,
      texte: <>Le graphe U = f(I) est la <strong>caractéristique</strong> de la pile. Les points sont alignés sur une <strong>droite qui ne passe pas par l’origine et qui descend</strong> : c’est une fonction <strong>affine décroissante</strong> : U = a·I + b avec a &lt; 0. Quand la pile débite davantage, sa tension <strong>baisse</strong>. (Attention : l’axe vertical ne commence pas à 0.)</>,
      tache: { type: 'qcm', q: 'Quand l’intensité I débitée par la pile augmente, la tension U entre ses bornes…', options: ['diminue', 'augmente', 'ne change pas', 'devient nulle aussitôt'], bonne: 0, expl: 'La caractéristique est une droite décroissante : plus I est grand, plus U est petit.' } },
    { id: 'modele', titre: 'U = U₀ − r × I', depart: null,
      texte: <>La régression linéaire donne la droite U = a·I + b. L’<strong>ordonnée à l’origine</strong> b est la tension à vide <strong>U₀</strong> ; le coefficient directeur a est négatif, et <strong>r = −a</strong> est la <strong>résistance interne</strong> de la pile (en Ω). Donc <strong>U = U₀ − r × I</strong>.
        <ExempleResolu>Mesures du TP : U = 4,43 V à vide et U = 3,80 V pour I = 125,8 mA. r = (4,43 − 3,80) / 0,1258 = <strong>5,0 Ω</strong>.</ExempleResolu></>,
      tache: { type: 'num', q: 'Une pile donne U₀ = 4,50 V à vide et U = 4,00 V pour I = 100 mA. Quelle est sa résistance interne r (en Ω) ?', unite: 'Ω', vrai: 5, tol: 0.02, affiche: x => String(x), pieges: [[0.005, 'Convertis I en ampères : 100 mA = 0,100 A.'], [40, 'Tu as divisé U par I : il faut diviser la baisse de tension (U₀ − U) par I.']], expl: 'r = (U₀ − U) / I = (4,50 − 4,00) / 0,100 = 5,0 Ω.' } },
    { id: 'ideale', titre: 'La source idéale de tension', depart: () => voir('tp', { pile: 'labo' }),
      texte: <>Une <strong>source idéale de tension</strong> délivre une tension <strong>indépendante du courant</strong> : sa caractéristique est une <strong>droite horizontale</strong>, sa résistance interne est <strong>nulle</strong> (r = 0). L’alimentation du lycée s’en approche. Choisissez-la, faites des mesures et regardez la tension.</>,
      tache: { type: 'qcm', q: 'La caractéristique d’une source idéale de tension est…', options: ['une droite horizontale (U constante)', 'une droite passant par l’origine', 'une droite décroissante', 'une courbe qui monte'], bonne: 0, expl: 'U = U₀ quelle que soit l’intensité : droite parallèle à l’axe des I, r = 0.' } },
    { id: 'source', titre: 'Le modèle d’une pile réelle', depart: () => voir('modele', { M: { U0: 4.5, r: 5, R: 100 } }),
      texte: <>Une pile réelle se modélise par une <strong>source idéale de tension U₀ en série avec une résistance r</strong>. La loi d’additivité des tensions donne <strong>U = U₀ − r × I</strong>. Plus R est petit, plus I est grand et plus U chute. À droite, la droite orange est la caractéristique du résistor (U = R × I) : le point d’intersection est le <strong>point de fonctionnement</strong>.
        <ExempleResolu>U₀ = 4,5 V, r = 5 Ω, R = 100 Ω : I = U₀ / (r + R) = 4,5 / 105 = <strong>42,9 mA</strong> ; U = 4,5 − 5 × 0,0429 = <strong>4,29 V</strong>.</ExempleResolu></>,
      tache: { type: 'num', q: 'Pile de U₀ = 4,5 V et r = 5 Ω débitant 100 mA : quelle est la tension U entre ses bornes (en V) ?', unite: 'V', vrai: 4, tol: 0.01, affiche: x => String(x), pieges: [[500, 'Convertis I en ampères : 100 mA = 0,100 A.']], expl: 'U = U₀ − r × I = 4,5 − 5 × 0,100 = 4,0 V.' } },
    { id: 'joule', titre: 'De l’énergie perdue dans la pile', depart: () => voir('modele', { M: { U0: 4.5, r: 5, R: 10 } }),
      texte: <>Le courant traverse la résistance interne : une partie de l’énergie de la pile est <strong>dissipée par effet Joule</strong>, <strong>P<sub>th</sub> = r × I²</strong>, soit Q = r × I² × Δt. Le reste, <strong>U × I</strong>, est fourni au circuit extérieur : le <strong>rendement</strong> de la pile vaut U / U₀. Diminuez R : la perte augmente fortement (jusqu’au court-circuit !).
        <ExempleResolu>r = 5 Ω, I = 100 mA pendant 1 h : Q = 5 × 0,100² × 3600 = <strong>180 J</strong> dissipés dans la pile.</ExempleResolu></>,
      tache: { type: 'num', q: 'Une pile de résistance interne 10 Ω débite 200 mA. Quelle puissance thermique (en W) est dissipée dans la pile ?', unite: 'W', vrai: 0.4, tol: 0.02, affiche: x => String(x).replace('.', ','), pieges: [[2, 'Convertis I en ampères et mets-le au carré : P = r × I² = 10 × 0,200².']], expl: 'P = r × I² = 10 × 0,200² = 0,40 W.' } },
    { id: 'usee', titre: 'Conséquences pratiques : la pile usée', depart: () => voir('modele', { M: { U0: 4.2, r: 25, R: 22 } }),
      texte: <>Une pile <strong>usée</strong> garde presque la même tension à vide, mais sa <strong>résistance interne r augmente beaucoup</strong>. Branchée sur un appareil, la tension U à ses bornes s’effondre : la lampe éclaire peu. Comparez : U₀ = 4,2 V, r = 25 Ω, R = 22 Ω, puis r = 1 Ω.</>,
      tache: { type: 'qcm', q: 'Pourquoi une pile usée alimente-t-elle mal un appareil alors que son voltmètre indique encore une bonne tension à vide ?', options: ['Sa résistance interne est grande : dès qu’elle débite, la tension à ses bornes chute', 'Sa tension à vide est nulle', 'Elle ne contient plus de charges', 'Le voltmètre est faux'], bonne: 0, expl: 'U = U₀ − r × I : avec r grand, la chute de tension r × I est importante dès que I est notable.' } },
    { id: 'fin', titre: 'Bravo ! Le bilan', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li>La <strong>caractéristique</strong> d’un dipôle est la courbe U = f(I). Conducteur ohmique : droite par l’origine, U = R·I.</li>
        <li>Pile réelle : <strong>U = U₀ − r·I</strong> (droite décroissante). U₀ = tension à vide, r = résistance interne = −(coefficient directeur).</li>
        <li>Modèle : <strong>source idéale U₀ en série avec r</strong> ; effet Joule dans la pile : P<sub>th</sub> = r·I² ; source idéale : r = 0.</li></ul></ARetenir>, tache: null },
  ];
  useEffect(() => {
    if (mode !== 'guide') return;
    const dep = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (dep) dep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  function lancer(type) { setDefi(nouveauDefi(type)); }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'u0r'); else if (md === 'explore') setAtelier('tp'); }

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Caractéristique affine</strong> : U₀ et r sont supposées <strong>constantes</strong>. En réalité, r varie avec le courant débité, la température et surtout l’usure : aux faibles courants, les vraies mesures du TP s’écartent un peu de la droite (voir le bouton « charger les mesures du TP »).</li>
      <li><strong>Pile plate « 4,5 V »</strong> modélisée par U₀ = 4,43 V et r = 5,0 Ω (valeurs proches de la régression des mesures du TP : r ≈ 5,1 Ω, U₀ ≈ 4,41 V). <strong>Pile usée</strong> : U₀ = 4,2 V, r = 25 Ω (valeurs d’illustration).</li>
      <li><strong>Mesures</strong> : tension à 0,01 V près, intensité à 0,1 mA près ; boîte à décades de résistances idéales (pas de résistance de contact), appareils de mesure parfaits.</li>
      <li><strong>Régression linéaire</strong> par moindres carrés sur les points notés (comme avec un tableur ou Régressi).</li>
      <li><strong>Lampe</strong> (lecture graphique) : lampe 6 V – 0,30 A de caractéristique non linéaire, modèle simplifié. <strong>Régime continu</strong> uniquement.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const carte = contenu => <div style={{ background: '#f8fafc', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: '8px 10px', fontSize: 14.5, color: KIT.txt, lineHeight: 1.8, marginTop: 8 }}>{contenu}</div>;

  const Imax = Math.max(0, ...pts.map(p => p[0])), Umin = pts.length ? Math.min(...pts.map(p => p[1])) : 4, Umax = pts.length ? Math.max(...pts.map(p => p[1])) : 5;
  const ymaxT = Math.ceil(Umax + 0.2), yminT = Math.max(0, Math.floor(Umin - 0.4));
  const xmaxT = Math.max(50, Math.ceil(Imax / 50) * 50);
  const atelierTP = (
    <div>
      <SchemaSource U0={U0p} r={rp} R={K.ferme ? Rd : 1e6} I={Itp} ph={ph} modele={false}/>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}><span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Source :</span>
        {Object.entries(PILES).map(([k, [n]]) => <button key={k} onClick={() => { setPile(k); setPts([]); }} style={stylePetitBouton(pile === k, '#0f766e')}>{n}</button>)}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
        <button onClick={() => setK(k => ({ ...k, ferme: !k.ferme }))} style={styleBouton(true, '#334155')}>{K.ferme ? '🔓 Ouvrir l’interrupteur K' : '🔒 Fermer l’interrupteur K'}</button>
        <label style={{ fontSize: 13.5, fontWeight: 600 }}>Boîte à décades R : <strong>{Rd} Ω</strong>
          <input type="range" min={0} max={DECADES.length - 1} step={1} value={K.d} aria-label="Résistance R de la boîte à décades" onChange={e => setK(k => ({ ...k, d: +e.target.value }))} style={{ width: 200, verticalAlign: 'middle', marginLeft: 6 }}/></label></div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
        <button onClick={noter} style={styleBouton(true, '#16a34a')}>➕ Noter cette mesure</button>
        <button onClick={() => { setPile('plate'); setPts(TP.map(p => [p[0], p[1]])); }} style={styleBouton(false)}>📂 Charger les mesures du TP (pile plate)</button>
        <button onClick={() => setPts([])} style={styleBouton(false)}>🗑 Effacer</button></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginTop: 8, alignItems: 'start' }}>
        <div style={{ overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
          <thead><tr>{['I (mA)', 'U (V)'].map(h => <th key={h} style={{ padding: '3px 5px', color: KIT.txt2, textAlign: 'right', borderBottom: `1px solid ${KIT.bord}` }}>{h}</th>)}</tr></thead>
          <tbody>{pts.length === 0 && <tr><td colSpan="2" style={{ padding: 6, color: KIT.txt2 }}>Aucune mesure notée.</td></tr>}
            {pts.slice(-12).map((p, k) => <tr key={k}><td style={{ padding: '2px 5px', textAlign: 'right' }}>{fr(p[0], 1)}</td><td style={{ padding: '2px 5px', textAlign: 'right' }}>{fr(p[1], 2)}</td></tr>)}</tbody></table>
          {pts.length > 12 && <div style={{ fontSize: 12, color: KIT.txt2 }}>… {pts.length - 12} mesures plus anciennes non affichées</div>}</div>
        <div><Graphe pts={pts} xmax={xmaxT} ymax={ymaxT} ymin={yminT} xlab="I (mA)" ylab="U (V)" droite={reg} w={400} h={280} rayon={4}/>
          {reg && <div style={{ fontSize: 13.5, fontWeight: 700, color: VERMILLON, marginTop: 4 }}>Régression : U = {fr(reg.a * 1000, 2)} × I + {fr(reg.b, 2)} (I en A) → <span style={{ color: '#0f172a' }}>r = {fr(-reg.a * 1000, 1)} Ω ; U₀ = {fr(reg.b, 2)} V</span></div>}</div></div>
    </div>);
  const icc = M.r > 0 ? M.U0 / M.r * 1000 : (M.U0 / M.R) * 2000;
  const xmaxM = Math.max(40, Math.ceil(Math.min(icc, 2.2 * Im * 1000) / 20) * 20), ymaxM = Math.ceil(M.U0 * 1.1);
  const atelierModele = (
    <div>
      <SchemaSource U0={M.U0} r={M.r} R={M.R} I={Im} ph={ph} modele/>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        {[['Pile neuve', { r: 1, U0: 4.5 }], ['Pile plate', { r: 5, U0: 4.5 }], ['Pile usée', { r: 25, U0: 4.2 }], ['Source idéale', { r: 0, U0: 6 }], ['Court-circuit', { R: 1 }]].map(([n, p]) => <button key={n} onClick={() => setM(m => ({ ...m, ...p }))} style={stylePetitBouton(false, '#7b2d8e')}>{n}</button>)}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginTop: 8 }}>
        <Curseur nom="Tension à vide U₀" val={M.U0} min={1} max={12} pas={0.1} set={v => setM(m => ({ ...m, U0: v }))} unite=" V"/>
        <Curseur nom="Résistance interne r" val={M.r} min={0} max={50} pas={0.5} set={v => setM(m => ({ ...m, r: v }))} unite=" Ω"/>
        <Curseur nom="Résistance du circuit R" val={M.R} min={1} max={500} pas={1} set={v => setM(m => ({ ...m, R: v }))} unite=" Ω"/></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10, marginTop: 8, alignItems: 'start' }}>
        {carte(<>
          <div>Courant : I = U₀ / (r + R) = {fr(M.U0, 1)} / {fr(M.r + M.R, 1)} = <strong>{fr(Im * 1000, 1)} mA</strong></div>
          <div>Tension aux bornes : U = U₀ − r × I = <strong>{fr(Um, 2)} V</strong></div>
          <div>Puissance fournie par la source idéale : U₀ × I = <strong>{fr(M.U0 * Im, 3)} W</strong></div>
          <div>dont perdue par effet Joule dans la pile : r × I² = <strong>{fr(M.r * Im * Im, 3)} W</strong></div>
          <div>et utile pour le circuit : U × I = <strong>{fr(Um * Im, 3)} W</strong> (rendement U / U₀ = {fr(Um / M.U0 * 100, 0)} %)</div>
          {M.R <= 2 && M.r > 0 && <div style={{ color: VERMILLON, fontWeight: 700 }}>⚠ Court-circuit : courant énorme, la pile chauffe beaucoup.</div>}</>)}
        <div><Graphe pts={[[Im * 1000, Um]]} courbe={[[0, M.U0], [xmaxM, M.U0 - M.r * xmaxM / 1000]]} series={[]} droite={{ a: M.R / 1000, b: 0 }} xmax={xmaxM} ymax={ymaxM} xlab="I (mA)" ylab="U (V)" couleur="#0f172a" w={400} h={280} rayon={6}/>
          <div style={{ fontSize: 12.5, color: KIT.txt2 }}><span style={{ fontWeight: 700 }}>trait gris</span> : caractéristique de la pile · <span style={{ color: VERMILLON, fontWeight: 700 }}>pointillés orange</span> : résistor R · ● point de fonctionnement</div></div></div>
    </div>);
  const LEC = { res: ['Résistor 100 Ω', 0.1, 4.2], lampe: ['Lampe 6 V – 0,30 A', 0.3, 9] };
  const ILec = Lec.dip === 'res' ? Lec.U / 100 : lampeI(Lec.U);
  const courbeLec = Array.from({ length: 46 }, (_, k) => { const u = k * 0.2; return [Lec.dip === 'res' ? u / 100 * 1000 : lampeI(u) * 1000, u]; });
  const atelierLire = (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}><span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Dipôle :</span>
        {Object.entries(LEC).map(([k, [n]]) => <button key={k} onClick={() => setLec(l => ({ ...l, dip: k }))} style={stylePetitBouton(Lec.dip === k, '#0f766e')}>{n}</button>)}</div>
      <div style={{ marginTop: 8 }}><Curseur nom="Tension appliquée U" val={Lec.U} min={0} max={9} pas={0.5} set={v => setLec(l => ({ ...l, U: v }))} unite=" V"/></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10, marginTop: 8, alignItems: 'start' }}>
        <Graphe pts={[[ILec * 1000, Lec.U]]} courbe={courbeLec} xmax={Lec.dip === 'res' ? 100 : 600} ymax={9} xlab="I (mA)" ylab="U (V)" couleur={VIOLET} rayon={6} w={420} h={280}/>
        {carte(<>Lecture graphique : pour U = <strong>{fr(Lec.U, 1)} V</strong>, on lit I ≈ <strong>{fr(ILec * 1000, 0)} mA</strong>.<br/>{Lec.dip === 'res' ? <>C’est une <strong>droite passant par l’origine</strong> : dipôle ohmique, R = U / I = 100 Ω.</> : <>La courbe n’est <strong>pas une droite</strong> : ce dipôle n’est pas ohmique (U / I = {Lec.U > 0 ? `${fr(Lec.U / ILec, 0)} Ω` : '—'} change avec U).</>}</>)}</div>
    </div>);
  const planche = (
    <div style={styleBoite}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Atelier :</span>
        {[['tp', '📏 Mesurer la caractéristique'], ['modele', '🧩 Le modèle source + r'], ['lire', '👓 Lire une caractéristique']].map(([k, l]) => <button key={k} onClick={() => setAtelier(k)} style={stylePetitBouton(atelier === k, '#16a34a')}>{l}</button>)}</div>
      {atelier === 'tp' && atelierTP}{atelier === 'modele' && atelierModele}{atelier === 'lire' && atelierLire}
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Pile plate : notez 8 mesures de R = 2000 Ω à R = 10 Ω et lisez r et U₀ sur la régression.</li>
        <li>Chargez les mesures réelles du TP : les points sont-ils parfaitement alignés ? Comparez avec la pile modélisée.</li>
        <li>Même expérience avec la pile usée : que change-t-il sur la pente de la droite ?</li>
        <li>Modèle : mettez r = 0 : que devient la droite de la pile ? Et U quand I augmente ?</li>
        <li>Court-circuit : quelle puissance est dissipée dans la pile ? Pourquoi est-ce dangereux ?</li>
      </ul>
    </div>);
  const retenir = <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
    <li>U = U₀ − r·I ; r = −(coefficient directeur)</li><li>Source idéale : r = 0, U = U₀</li><li>Pile = source idéale + r en série ; perte P = r·I²</li></ul></ARetenir>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défis</button>
    </span>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .cp-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .cp-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .cp-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .cp-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Caractéristique d’une pile : source réelle de tension</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>
        Pourquoi la tension d’une pile baisse-t-elle quand elle débite ? Tracez sa <strong>caractéristique</strong> U = f(I), déterminez sa <strong>résistance interne r</strong> et sa <strong>tension à vide U₀</strong>, puis modélisez la pile par une <strong>source idéale en série avec r</strong>.</div>
      <div className={`cp-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enDefi && <div style={styleBoite}><VoletDefiGen SIM={SIM} titres={TITRES} defi={defi} setDefi={setDefi} changerType={lancer} evaluer={evaluer} enonce={enonce} solution={solution}/></div>}
          {!enDefi && planche}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && <div className="cp-l2">{panneauHypo}</div>}
      {enExplore && <div className="cp-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
