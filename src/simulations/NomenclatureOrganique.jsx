import { useState, useMemo } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { Pic } from "../Pictos";
import * as O from "./organiqueModele";

const SIM_ID = 102;
declarerDefis(SIM_ID, [['nom', 'Nommer une molécule'], ['formule', 'Retrouver la formule à partir du nom'], ['groupe', 'Groupe caractéristique et famille'], ['brute', 'Écrire la formule brute']]);

// ====================================================
//  SIM 102 — NOMENCLATURE ET GROUPES CARACTÉRISTIQUES (1re spé, chapitre « La chimie organique »)
//  Formules brutes et semi-développées, chaîne carbonée saturée, alcanes linéaires et ramifiés, groupes hydroxyle, carbonyle et carboxyle,
//  familles (alcool, aldéhyde, cétone, acide carboxylique), nom ↔ formule semi-développée. Modèle : organiqueModele.js.
//  L'infrarouge (4e partie du chapitre) fera l'objet d'une simulation à part.
// ====================================================

const tire = t => t[Math.floor(Math.random() * t.length)];
const melange = t => { const a = [...t]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const R = n => { const m = O.retrouver(n); if (!m) throw new Error(`molécule inconnue : ${n}`); return m; };


// ---------- tirage d'un défi (hors du composant : le hasard n'est pas utilisé pendant l'affichage) ----------
const poolDefi = type => {
  if (type === 'groupe') return [...O.avecGroupe, ...O.avecGroupe, ...O.BANQUE.lineaires.slice(1), ...O.BANQUE.ramifies.slice(0, 12)];
  if (type === 'brute') return [...O.avecGroupe, ...O.BANQUE.ramifies, ...O.BANQUE.lineaires.slice(1)];
  return [...O.avecGroupe, ...O.avecGroupe, ...O.BANQUE.ramifies, ...O.BANQUE.lineaires.slice(2)];
};
function tirageDefi(type, ancien) {
  let m, essais = 0;
  do { m = tire(poolDefi(type)); essais++; } while (ancien && ancien.m && O.nom(m) === O.nom(ancien.m) && essais < 20);
  const base = { type, m, flip: Math.random() < 0.5, reps: {}, verifie: false };
  if (type !== 'formule') return base;
  const choix = melange([m, ...melange(O.moleculesProches(m)).slice(0, 3)]).map(x => ({ m: x, flip: Math.random() < 0.5 }));
  return { ...base, choix };
}

// ---------- formule brute avec indices ----------
const FB = ({ m }) => <>{O.brutePourAffichage(m).map(([e, k]) => <span key={e}>{e}{k > 1 && <sub>{k}</sub>}</span>)}</>;

// ---------- dessin d'une formule semi-développée (SVG) ----------
const PX = 58, PY = 40, FS = 18;
const larg = lab => { let w = 0; for (const c of lab) w += /\d/.test(c) ? 7 : 12; return w; };
const couleurAtome = el => (el === 'O' ? '#b91c1c' : el === 'H' ? '#334155' : KIT.txt);

function Etiquette({ x, y, lab, el }) {
  const mm = /^([A-Za-z]+)(\d)?$/.exec(lab);
  return (
    <text x={x} y={y + 6} textAnchor="middle" fontSize={FS} fontWeight="700" fill={couleurAtome(el)} fontFamily="'Nunito', system-ui, sans-serif">
      {mm[1]}{mm[2] && <tspan dy="5" fontSize="12">{mm[2]}</tspan>}
    </text>);
}

function Formule({ s, surligner = null, chemin = null, numeros = [], masqueH = false, aria, max = 560 }) {
  const N = s.noeuds, lab = n => (masqueH && n.el === 'C' ? 'C' : n.lab);
  const r0 = Math.min(...N.map(n => n.row)), r1 = Math.max(...N.map(n => n.row));
  const bandes = numeros.length, W = s.cols * PX + 12, H = (r1 - r0 + 1) * PY + 14 + (bandes ? 6 + bandes * 24 : 0);
  const cx = c => 6 + PX * (c + 0.5), cy = r => 7 + PY * (r - r0 + 0.5);
  const demi = n => larg(lab(n)) / 2;
  // zones à entourer
  const zones = [];
  const boite = ids => {
    const L = ids.map(i => N[i]);
    const x1 = Math.min(...L.map(n => cx(n.col) - demi(n))), x2 = Math.max(...L.map(n => cx(n.col) + demi(n)));
    const y1 = Math.min(...L.map(n => cy(n.row))) - 13, y2 = Math.max(...L.map(n => cy(n.row))) + 13;
    return { x: (x1 + x2) / 2, y: (y1 + y2) / 2, rx: (x2 - x1) / 2 + 10, ry: (y2 - y1) / 2 + 3 };
  };
  if (surligner === 'groupe' && s.mol.g) {
    const t = s.mol.g.t;
    if (t === 'OH') zones.push(boite(N.filter(n => n.el === 'O').map(n => n.id)));
    else {
      const dbl = s.liaisons.find(l => l.ordre === 2);
      zones.push(boite(t === 'COOH' ? [dbl.a, dbl.b, ...N.filter(n => n.el === 'O' && n.id !== dbl.a && n.id !== dbl.b).map(n => n.id)] : [dbl.a, dbl.b]));
    }
  }
  if (surligner === 'sub') { const ids = N.filter(n => n.sub).map(n => n.id); if (ids.length) zones.push(boite(ids)); }
  const colonnes = N.filter(n => n.el === 'C' && n.num).sort((a, b) => a.col - b.col);
  const yBande = b => 7 + PY * (r1 - r0 + 1) + 14 + b * 24;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: Math.max(240, Math.min(max, W * 1.5)), display: 'block', margin: '0 auto' }} role="img" aria-label={aria}>
      {chemin && chemin.length > 1 && <polyline points={chemin.map(i => `${cx(N[i].col)},${cy(N[i].row)}`).join(' ')} fill="none" stroke="#fde68a" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round"/>}
      {zones.map((z, i) => <ellipse key={i} cx={z.x} cy={z.y} rx={z.rx} ry={z.ry} fill="rgba(3,105,161,0.10)" stroke="#0369a1" strokeWidth="2.5"/>)}
      {s.liaisons.map((l, i) => {
        const A = N[l.a], B = N[l.b], col = '#334155';
        if (A.row === B.row) {
          const d = Math.sign(B.col - A.col), x1 = cx(A.col) + d * (demi(A) + 4), x2 = cx(B.col) - d * (demi(B) + 4);
          return <line key={i} x1={x1} y1={cy(A.row)} x2={x2} y2={cy(A.row)} stroke={col} strokeWidth="2.2" strokeLinecap="round"/>;
        }
        const d = Math.sign(B.row - A.row), y1 = cy(A.row) + d * 13, y2 = cy(B.row) - d * 13, x = cx(A.col);
        return l.ordre === 2
          ? <g key={i}><line x1={x - 3} y1={y1} x2={x - 3} y2={y2} stroke={col} strokeWidth="2.2" strokeLinecap="round"/><line x1={x + 3} y1={y1} x2={x + 3} y2={y2} stroke={col} strokeWidth="2.2" strokeLinecap="round"/></g>
          : <line key={i} x1={x} y1={y1} x2={x} y2={y2} stroke={col} strokeWidth="2.2" strokeLinecap="round"/>;
      })}
      {N.map(n => <Etiquette key={n.id} x={cx(n.col)} y={cy(n.row)} lab={lab(n)} el={n.el}/>)}
      {numeros.map((sens, b) => colonnes.map((n, i) => (
        <g key={`${sens}${n.id}`}>
          <circle cx={cx(n.col)} cy={yBande(b)} r="10" fill={sens === 'g' ? '#2563eb' : '#c2410c'}/>
          <text x={cx(n.col)} y={yBande(b) + 4.5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">{sens === 'g' ? i + 1 : colonnes.length - i}</text>
        </g>)))}
    </svg>);
}

// Une molécule dessinée (dans la scène ou dans un choix de défi)
function Mol({ m, flip = false, surligner = null, chaine = false, numeros = [], masqueH = false, exact = false, max }) {
  const s = useMemo(() => O.schema(m, flip, exact), [m, flip, exact]);
  const chemin = useMemo(() => (chaine ? O.nomDepuisSchema(s).chemin : null), [s, chaine]);
  return <Formule s={s} surligner={surligner} chemin={chemin} numeros={numeros} masqueH={masqueH} max={max}
    aria={`Formule semi-développée${masqueH ? ' (atomes d’hydrogène non écrits)' : ''} : ${masqueH ? 'squelette carboné' : O.lineaire(m)}`}/>;
}

// ---------- état du constructeur (exploration et fin du parcours) ----------
const DEPART = { n: 4, g: null, subs: [], flip: false, vue: { chaine: false, groupe: false, g: false, d: false } };
const molDe = c => O.mol(c.n, { subs: c.subs, g: c.g });
const etatDepuisMol = (m, vue) => ({ n: m.n, g: m.g ? { ...m.g } : null, subs: m.subs.map(s => ({ ...s })), flip: false, vue: vue || DEPART.vue });
const COURS = [['a', '2-méthylbutane'], ['b', 'pentane'], ['d', '2,3-diméthylpentane'], ['e', '2,2-diméthylpentane'], ['g', 'propan-1-ol'], ['h', 'propan-2-ol'],
  ['i', 'propanone'], ['j', 'éthanal'], ['k', 'acide éthanoïque'], ['l', 'acide méthanoïque'], ['m', 'pentanal'], ['n', 'acide pentanoïque']];
const GROUPES_BOUTONS = [[null, 'Aucun (alcane)'], ['OH', 'Alcool : –OH'], ['CHO', 'Aldéhyde : –CHO'], ['CO', 'Cétone : C=O'], ['COOH', 'Acide : –COOH']];

// ---------- fiche d'identité ----------
function Fiche({ m, nomDessin, lignes, cadre = {} }) {
  const f = O.famille(m);
  const toutes = {
    brute: ['Formule brute', <FB m={m}/>],
    nom: ['Nom', nomDessin === undefined ? O.nom(m) : (nomDessin || '—')],
    famille: ['Famille', f.nom],
    groupe: ['Groupe caractéristique', f.groupe ? `${f.groupe.nom} (${f.groupe.ecrit})` : 'aucun'],
    chaine: ['Chaîne carbonée', `${O.chaineLineaire(m) ? 'linéaire' : 'ramifiée'}, saturée`],
  };
  return (
    <div style={{ ...styleBoite, ...cadre }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Fiche d’identité</div>
      {lignes.map(k => <LigneMesure key={k} nom={toutes[k][0]} valeur={toutes[k][1]} couleur={k === 'nom' ? '#15803d' : undefined}/>)}
    </div>);
}

// ====================================================
export function SimulationNomenclatureOrganique() {
  const [mode, setMode] = useState(() => modeOuverture('nomenclature-organique-guide-v1'));
  useSignalerMode(mode);
  const [sNom, noterNom] = useCompteurDefi(), [sFormule, noterFormule] = useCompteurDefi(), [sGroupe, noterGroupe] = useCompteurDefi(), [sBrute, noterBrute] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant('nomenclature-organique-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [consBrut, setConsBrut] = useState({ ...DEPART, cle: null });
  const [defi, setDefi] = useState(null);
  const [typeDefi, setTypeDefi] = useState('nom');
  const [hypoOuv, setHypoOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi';
  const { etape } = guide;
  // En parcours guidé, chaque étape repart du réglage de départ (la réponse de l'étape précédente ne doit pas rester à l'écran)
  const cons = useMemo(() => (enGuide && consBrut.cle !== etape ? { ...DEPART, vue: consBrut.vue, cle: etape } : consBrut), [enGuide, consBrut, etape]);
  const setCons = f => setConsBrut(c => { const base = enGuide && c.cle !== etape ? { ...DEPART, vue: c.vue, cle: etape } : c; return { ...f(base), cle: enGuide ? etape : base.cle }; });

  // ---------- constructeur ----------
  const molCons = useMemo(() => molDe(cons), [cons]);
  const schemaCons = useMemo(() => O.schema(molCons, cons.flip, true), [molCons, cons.flip]);
  const lu = useMemo(() => O.nomDepuisSchema(schemaCons), [schemaCons]);
  const nomCons = lu.nom;
  const setN = v => setCons(c => {
    let g = c.g;
    if (g && g.t === 'CO' && v < 3) g = null;
    else if (g && g.t === 'OH') g = { ...g, pos: Math.min(g.pos, v) };
    else if (g && g.t === 'CO') g = { ...g, pos: Math.min(Math.max(2, g.pos), v - 1) };
    return { ...c, n: v, g, subs: v < 3 ? [] : c.subs.map(s => ({ ...s, pos: Math.min(s.pos, v - 1) })) };
  });
  const choisirGroupe = t => setCons(c => (t === null ? { ...c, g: null } : { ...c, subs: [], g: { t, pos: t === 'OH' ? Math.min(c.g && c.g.t === 'OH' ? c.g.pos : 1, c.n) : t === 'CO' ? Math.min(2, c.n - 1) : 1 } }));
  const setPosGroupe = v => setCons(c => ({ ...c, g: { ...c.g, pos: v } }));
  const ajouterSub = () => setCons(c => (c.n >= 3 && !c.g && c.subs.length < 2 ? { ...c, subs: [...c.subs, { pos: Math.min(2, c.n - 1), L: 1 }] } : c));
  const majSub = (i, f) => setCons(c => ({ ...c, subs: c.subs.map((s, j) => (j === i ? { ...s, ...f } : s)) }));
  const retirerSub = i => setCons(c => ({ ...c, subs: c.subs.filter((_, j) => j !== i) }));
  const basculerVue = k => setCons(c => ({ ...c, vue: { ...c.vue, [k]: !c.vue[k] } }));

  // ════════════════ PARCOURS GUIDÉ ════════════════
  //  scene : liste de molécules (légende facultative) ou 'cons' (le constructeur) ; fiche : lignes de la fiche d'identité visibles à cette étape
  //  (jamais celle dont la réponse est demandée) ; ctrl : commandes du constructeur visibles (elles s'accumulent d'une étape à l'autre).
  const qcmNom = (m, indice, prio) => {
    const mal = O.mauvaisNoms(m).sort((a, b) => (prio && prio.test(b[1]) ? 1 : 0) - (prio && prio.test(a[1]) ? 1 : 0)).slice(0, 2);
    return { type: 'qcm', q: 'Quel est le nom de cette molécule ?', options: [O.nom(m), ...mal.map(x => x[0])], bonne: 0, indice,
      expl: `${O.nom(m)}. Attention : « ${mal[0][0]} » est faux, car ${mal[0][1]}.` };
  };
  const construire = (nomCible, label) => ({ type: 'action', ok: nomCons === nomCible, label: 'Construire pour moi', consigne: label || `Construisez : ${nomCible}`,
    faire: () => setCons(c => ({ ...etatDepuisMol(R(nomCible)), vue: c.vue })) });
  const ETAPES = [
    { id: 'regle', titre: 'Chaque carbone fait 4 liaisons', focus: ['scene'], scene: [{ m: R('propane'), masqueH: true }],
      texte: <>Voici le squelette du propane : trois atomes de carbone liés entre eux. Les atomes d’hydrogène ne sont pas écrits, mais ils sont là. <strong>Règle à retenir : un atome de carbone établit toujours 4 liaisons.</strong></>,
      tache: { type: 'num', q: 'Combien d’atomes d’hydrogène porte un carbone situé à une extrémité de la chaîne ?', unite: '', vrai: 3, tol: 0, affiche: v => String(v),
        calcul: () => ['Un atome de carbone établit 4 liaisons en tout.', 'Un carbone d’extrémité est déjà lié à 1 carbone voisin : il lui reste 4 − 1 = 3 liaisons, donc 3 atomes H.'],
        pieges: [[4, 'Les 4 liaisons comptent aussi la liaison avec le carbone voisin : il n’en reste que 3 pour les hydrogènes.'], [2, 'Vous avez compté le carbone du milieu (2 voisins C, donc 2 H) : on demande un carbone d’extrémité (1 seul voisin C).']],
        expl: 'Un carbone d’extrémité porte 3 H (CH₃) ; celui du milieu, lié à 2 carbones, en porte 2 (CH₂).', indice: 'Au total 4 liaisons, dont 1 avec le carbone voisin.' } },
    { id: 'brute', titre: 'La formule brute', focus: ['scene'], scene: [{ m: R('éthanol') }],
      texte: <>Dans la <strong>formule semi-développée</strong>, on écrit les liaisons entre les atomes C, O… mais pas les liaisons C–H : les H sont regroupés sur chaque atome (CH₃, CH₂, OH). La <strong>formule brute</strong> donne seulement le nombre d’atomes de chaque élément, par exemple CO₂ pour le dioxyde de carbone.</>,
      tache: { type: 'qcm', q: 'Quelle est la formule brute de cette molécule ?', options: ['C₂H₆O', 'C₂H₅O', 'C₃H₆O', 'C₂H₆'], bonne: 0, indice: 'Comptez séparément les C, les H (3 + 2 + 1…) et les O.',
        expl: '2 atomes de C, 3 + 2 + 1 = 6 atomes de H et 1 atome de O : C₂H₆O.' } },
    { id: 'limite', titre: 'Pourquoi une formule semi-développée ?', focus: ['scene'], fiche: ['brute'],
      scene: [{ m: R('propan-1-ol'), legende: 'A' }, { m: R('propan-2-ol'), flip: true, legende: 'B' }],
      texte: <>Les deux molécules A et B ont la <strong>même formule brute</strong>, C₃H₈O. Pourtant ce sont deux composés différents, qui n’ont pas les mêmes propriétés.</>,
      tache: { type: 'qcm', q: 'Pourquoi la formule semi-développée est-elle plus informative que la formule brute ?', options: ['elle montre comment les atomes sont liés entre eux', 'elle donne la forme exacte de la molécule dans l’espace', 'elle indique le nombre d’atomes de chaque élément, ce que ne fait pas la formule brute'], bonne: 0, indice: 'Comparez A et B : qu’est-ce qui change, alors que la formule brute est la même ?',
        expl: 'La formule brute ne dit pas comment les atomes sont liés : A et B n’ont pas le même enchaînement. La formule semi-développée est « plane » : elle ne montre pas la géométrie réelle en 3 dimensions (les atomes de carbone ne sont pas alignés).' } },
    { id: 'chaine', titre: 'La chaîne carbonée', focus: ['scene'], fiche: ['brute'], scene: [{ m: R('2-méthylbutane'), legende: 'A' }, { m: R('pentane'), legende: 'B' }],
      texte: <>Les atomes de carbone sont liés entre eux : ils forment la <strong>chaîne carbonée</strong>. Elle est <strong>linéaire</strong> si chaque carbone est lié à 2 autres carbones au plus, <strong>ramifiée</strong> si un carbone au moins est lié à 3 autres carbones. Elle est <strong>saturée</strong> quand elle ne contient que des liaisons simples C–C.</>,
      tache: { type: 'qcm', q: 'Quelle molécule a une chaîne carbonée ramifiée ?', options: ['A', 'B', 'les deux'], bonne: 0, indice: 'Cherchez un carbone lié à 3 autres carbones.',
        expl: 'Dans A, un carbone de la ligne horizontale porte un groupe CH₃ en plus : il est lié à 3 carbones, la chaîne est ramifiée. B est une chaîne linéaire de 5 carbones.' } },
    { id: 'alcanes', titre: 'Les alcanes', focus: ['scene'], fiche: ['brute', 'chaine'],
      scene: [{ m: R('pentane'), legende: 'A' }, { m: R('éthanol'), legende: 'B' }, { m: R('2-méthylbutane'), legende: 'C' }],
      texte: <>Un <strong>hydrocarbure</strong> est un composé formé uniquement de carbone et d’hydrogène. Un <strong>alcane</strong> est un hydrocarbure à chaîne carbonée <strong>saturée et non cyclique</strong> : le méthane CH₄, l’éthane, le propane…</>,
      tache: { type: 'qcm', q: 'Laquelle de ces molécules n’est pas un alcane ?', options: ['B', 'A', 'C'], bonne: 0, indice: 'Un alcane ne contient que des atomes C et H.',
        expl: 'B contient un atome d’oxygène : ce n’est pas un hydrocarbure, donc pas un alcane. A et C ne contiennent que C et H, avec des liaisons simples.' } },
    { id: 'prefixes', titre: 'Nommer un alcane linéaire', focus: ['scene'], scene: [{ m: R('pentane') }],
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}><li>nombre de C : 1 → <strong>méth</strong> ; 2 → <strong>éth</strong> ; 3 → <strong>prop</strong> ; 4 → <strong>but</strong> ; 5 → <strong>pent</strong> ; 6 → <strong>hex</strong></li><li>nom = préfixe + <strong>ane</strong></li></ul>,
      texte: <>Le nom d’un alcane linéaire s’obtient en accolant un <strong>préfixe</strong>, qui dépend du nombre d’atomes de carbone, et la terminaison <strong>« ane »</strong>.</>,
      tache: { type: 'qcm', q: 'Quel est le nom de cet alcane ?', options: ['pentane', 'butane', 'hexane'], bonne: 0, indice: 'Comptez les atomes de carbone puis utilisez le tableau « À retenir ».',
        expl: '5 atomes de carbone : préfixe « pent », terminaison « ane » : pentane.' } },
    { id: 'principale', titre: 'Alcane ramifié : la chaîne principale', focus: ['scene'], scene: [{ m: R('3-méthylhexane'), flip: true }],
      texte: <>Pour nommer un alcane ramifié, on procède par étapes. <strong>Étape 1 : repérer la chaîne principale</strong>, c’est-à-dire la plus longue chaîne de carbones. Les carbones qui n’en font pas partie forment des <strong>ramifications</strong> (substituants).</>,
      tache: { type: 'num', q: 'Combien d’atomes de carbone compte la chaîne principale ?', unite: '', vrai: 6, tol: 0, affiche: v => String(v),
        calcul: () => ['La chaîne principale est la plus longue chaîne de carbones : ici la ligne horizontale, soit 6 carbones.', 'Le carbone situé en dehors de la ligne horizontale est une ramification (un substituant), pas un maillon de la chaîne principale.'],
        pieges: [[7, 'Vous avez compté tous les carbones de la molécule. Le carbone situé en dehors de la ligne horizontale est une ramification : il n’est pas dans la chaîne principale.']],
        expl: 'La chaîne principale compte 6 carbones : c’est un hexane. La ramification porte 1 carbone.', indice: 'Comptez les carbones de la ligne la plus longue, sans la ramification.' } },
    { id: 'numeroter', titre: 'Numéroter la chaîne principale', focus: ['scene'], scene: [{ m: R('2-méthylpentane'), flip: true, chaine: true, numeros: ['g', 'd'] }],
      texte: <><strong>Étape 2 : numéroter</strong> la chaîne principale dans le sens qui donne <strong>les plus petits numéros</strong> aux ramifications. Deux sens sont possibles ici : en bleu, de gauche à droite ; en orange, de droite à gauche.</>,
      tache: { type: 'num', q: 'Quel est le plus petit numéro possible pour le carbone qui porte la ramification ?', unite: '', vrai: 2, tol: 0, affiche: v => String(v),
        calcul: () => ['De gauche à droite (bleu), la ramification est sur le carbone n° 4.', 'De droite à gauche (orange), elle est sur le carbone n° 2.', 'On choisit le sens qui donne le plus petit numéro : 2.'],
        pieges: [[4, 'C’est le numéro obtenu de gauche à droite. L’autre sens donne un numéro plus petit : c’est lui qu’il faut choisir.']],
        expl: 'On numérote de droite à gauche : la ramification est portée par le carbone n° 2.', indice: 'Lisez le numéro sous la ramification pour chacun des deux sens.' } },
    { id: 'substituant', titre: 'Nommer la ramification', focus: ['scene'], scene: [{ m: R('3-éthylhexane'), chaine: true, surligner: 'sub' }],
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}><li>–CH₃ : <strong>méthyl</strong>e</li><li>–CH₂–CH₃ : <strong>éthyl</strong>e</li></ul>,
      texte: <><strong>Étape 3 : nommer chaque ramification.</strong> La chaîne principale est surlignée en jaune ; la ramification est entourée en bleu. Une ramification s’appelle un <strong>substituant</strong> : on lui donne le nom de l’alcane correspondant, avec la terminaison « yl ».</>,
      tache: { type: 'qcm', q: 'Comment s’appelle ce substituant (formé de 2 atomes de carbone) ?', options: ['éthyle', 'méthyle', 'propyle'], bonne: 0, indice: 'Il compte 2 carbones : préfixe « éth », terminaison « yl ».',
        expl: 'Un substituant de 2 carbones, –CH₂–CH₃, s’appelle éthyle.' } },
    { id: 'assembler', titre: 'Assembler le nom', focus: ['scene'], scene: [{ m: R('3-méthylhexane'), flip: true, chaine: true, numeros: ['g', 'd'] }],
      texte: <><strong>Étape 4 : assembler.</strong> Le nom s’écrit : numéro du substituant, tiret, nom du substituant (sans le « e » final), puis nom de l’alcane de la chaîne principale. Ici la chaîne principale compte 6 carbones et la ramification est un méthyle.</>,
      tache: qcmNom(R('3-méthylhexane'), 'Numéro du carbone qui porte le méthyle (plus petit possible), puis « méthyl », puis le nom de l’alcane à 6 carbones.', /numérot/) },
    { id: 'di', titre: 'Deux substituants identiques', focus: ['scene'], scene: [{ m: R('2,3-diméthylbutane'), chaine: true }],
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}><li>deux substituants identiques : préfixe <strong>di</strong> (trois : <strong>tri</strong>)</li><li>une <strong>virgule</strong> entre deux numéros, un <strong>tiret</strong> entre un numéro et une lettre</li></ul>,
      texte: <>Quand plusieurs substituants sont <strong>identiques</strong>, on écrit leurs numéros séparés par des virgules et on ajoute le préfixe <strong>di</strong> (deux) devant le nom du substituant. Ici, la chaîne principale compte 4 carbones et porte deux méthyles.</>,
      tache: qcmNom(R('2,3-diméthylbutane'), 'Deux méthyles : « diméthyl », avec les deux numéros séparés par une virgule.', /di/) },
    { id: 'alpha', titre: 'Deux substituants différents', focus: ['scene'], scene: [{ m: R('3-éthyl-2-méthylpentane'), flip: true, chaine: true }],
      texte: <><strong>Étape 5.</strong> Quand les substituants sont différents, on les cite dans l’<strong>ordre alphabétique</strong> (éthyl avant méthyl). Les lettres sont accolées ; un tiret sépare une lettre d’un numéro, une virgule sépare deux numéros.</>,
      tache: qcmNom(R('3-éthyl-2-méthylpentane'), 'Numérotez pour avoir les plus petits numéros, puis citez éthyl avant méthyl (ordre alphabétique).', /alphab/) },
    { id: 'hydroxyle', titre: 'Le groupe hydroxyle : les alcools', focus: ['scene'], scene: [{ m: R('éthanol'), surligner: 'groupe', legende: 'A' }, { m: R('propan-2-ol'), flip: true, surligner: 'groupe', legende: 'B' }],
      texte: <>Certains atomes ou groupes d’atomes, appelés <strong>groupes caractéristiques</strong>, donnent aux molécules qui les portent des propriétés chimiques semblables. Dans A et B, le groupe entouré est un groupe <strong>–OH</strong> lié à un carbone saturé : le <strong>groupe hydroxyle</strong>. Ces composés sont des <strong>alcools</strong>.</>,
      tache: { type: 'qcm', q: 'Quel est le groupe caractéristique des alcools ?', options: ['le groupe hydroxyle –OH', 'le groupe carbonyle C=O', 'le groupe carboxyle –COOH'], bonne: 0, indice: 'Regardez ce qui est entouré en bleu dans A et B.',
        expl: 'Les alcools portent le groupe hydroxyle –OH.' } },
    { id: 'carbonyle', titre: 'Le groupe carbonyle : aldéhydes et cétones', focus: ['scene'], fiche: ['brute'],
      scene: [{ m: R('propanal'), surligner: 'groupe', legende: 'A' }, { m: R('propanone'), flip: true, surligner: 'groupe', legende: 'B' }],
      texte: <>Dans A et B, le groupe entouré est le <strong>groupe carbonyle C=O</strong>. Si le carbonyle est en <strong>bout de chaîne</strong> (lié à un atome H), le composé est un <strong>aldéhyde</strong>. Si le carbonyle est <strong>au milieu de la chaîne</strong> (lié à deux carbones), c’est une <strong>cétone</strong>.</>,
      tache: { type: 'qcm', q: 'Laquelle de ces deux molécules est un aldéhyde ?', options: ['A', 'B'], bonne: 0, indice: 'Un aldéhyde a son groupe C=O en bout de chaîne, lié à un H.',
        expl: 'A est un aldéhyde (C=O en bout de chaîne, lié à H). B est une cétone : son C=O est lié à deux atomes de carbone.' } },
    { id: 'carboxyle', titre: 'Le groupe carboxyle : les acides carboxyliques', focus: ['scene'], scene: [{ m: R('acide éthanoïque'), surligner: 'groupe' }],
      texte: <>Le groupe entouré réunit un carbonyle C=O et un groupe hydroxyle –OH sur le <strong>même carbone</strong> : c’est le <strong>groupe carboxyle –COOH</strong>. Les composés qui le portent sont des <strong>acides carboxyliques</strong>.</>,
      tache: { type: 'num', q: 'Combien d’atomes d’oxygène le groupe carboxyle contient-il ?', unite: '', vrai: 2, tol: 0, affiche: v => String(v),
        calcul: () => ['Le groupe carboxyle –COOH contient C=O (1 atome d’oxygène) et –OH (1 atome d’oxygène).', 'Au total : 2 atomes d’oxygène.'],
        pieges: [[1, 'Il y a un oxygène dans le C=O et un autre dans le –OH.']], expl: 'Le groupe carboxyle contient 2 atomes d’oxygène (C=O et –OH).', indice: 'Un O dans C=O, un O dans –OH.' } },
    { id: 'famille', titre: 'Reconnaître une famille', focus: ['scene'], fiche: ['brute'],
      scene: [{ m: R('butan-2-ol'), legende: 'A' }, { m: R('butanal'), flip: true, legende: 'B' }, { m: R('butanone'), legende: 'C' }, { m: R('acide butanoïque'), flip: true, legende: 'D' }],
      texte: <>Ces quatre molécules ont toutes une chaîne de 4 carbones. Seul change le groupe caractéristique, donc la <strong>famille</strong>.</>,
      tache: { type: 'qcm', q: 'Laquelle est une cétone ?', options: ['C', 'A', 'B', 'D'], bonne: 0, indice: 'Cherchez un C=O au milieu de la chaîne, lié à deux carbones.',
        expl: 'C est une cétone : son groupe C=O est au milieu de la chaîne, lié à deux carbones. A est un alcool, B un aldéhyde, D un acide carboxylique.' } },
    { id: 'num-alcool', titre: 'Nommer un alcool : le numéro', focus: ['scene'], scene: [{ m: R('butan-2-ol'), flip: true, chaine: true, surligner: 'groupe', numeros: ['g', 'd'] }],
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}><li>alcool : <strong>ol</strong> · aldéhyde : <strong>al</strong> · cétone : <strong>one</strong> · acide carboxylique : <strong>oïque</strong></li><li>nom = alcane de même nombre de C (sans le « e ») + <strong>–numéro–</strong> + suffixe</li></ul>,
      texte: <>Avec un groupe caractéristique : <strong>1.</strong> la chaîne principale est la plus longue chaîne <em>qui porte le groupe</em> ; <strong>2.</strong> on la numérote pour que <strong>le groupe</strong> ait le plus petit numéro possible ; <strong>3.</strong> le nom est celui de l’alcane (sans le « e » final), le numéro du groupe entre deux tirets, puis le suffixe (« ol » pour un alcool).</>,
      tache: { type: 'num', q: 'Quel est le plus petit numéro possible pour le carbone qui porte le groupe –OH ?', unite: '', vrai: 2, tol: 0, affiche: v => String(v),
        calcul: () => ['De gauche à droite (bleu), le groupe –OH est sur le carbone n° 3.', 'De droite à gauche (orange), il est sur le carbone n° 2.', 'Le groupe doit avoir le plus petit numéro : 2.'],
        pieges: [[3, 'C’est le numéro obtenu de gauche à droite : l’autre sens donne un numéro plus petit.']],
        expl: 'Le groupe –OH porte le numéro 2 quand on numérote de droite à gauche.', indice: 'Comparez le numéro sous le carbone du –OH dans les deux sens (bleu et orange).' } },
    { id: 'nom-alcool', titre: 'Nommer un alcool', focus: ['scene'], scene: [{ m: R('butan-2-ol'), flip: true, chaine: true, surligner: 'groupe' }],
      texte: <>Vous avez la chaîne principale (4 carbones : but-) et le numéro du groupe –OH. Il reste à assembler le nom avec le suffixe « ol ».</>,
      tache: qcmNom(R('butan-2-ol'), 'but + an + –2– + ol : le « e » de « butane » disparaît devant le suffixe.', /numérot/) },
    { id: 'nom-aldehyde', titre: 'Nommer un aldéhyde', focus: ['scene'], scene: [{ m: R('pentanal'), surligner: 'groupe' }],
      texte: <>Le groupe carbonyle d’un aldéhyde est toujours en bout de chaîne : c’est le carbone n° 1, <strong>pas besoin de numéro</strong>. Suffixe : « al ».</>,
      tache: qcmNom(R('pentanal'), 'Chaîne de 5 carbones (pent) + an + al.') },
    { id: 'nom-cetone', titre: 'Nommer une cétone', focus: ['scene'], scene: [{ m: R('pentan-2-one'), flip: true, chaine: true, surligner: 'groupe', numeros: ['g', 'd'] }],
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}><li>propanone et butanone : un seul emplacement possible pour le C=O, donc <strong>pas de numéro</strong></li></ul>,
      texte: <>Pour une cétone, on numérote la chaîne pour que le carbone du groupe C=O ait le plus petit numéro, puis on utilise le suffixe « one ». Le numéro est écrit entre deux tirets.</>,
      tache: qcmNom(R('pentan-2-one'), 'Chaîne de 5 carbones, C=O sur le carbone n° 2 (plus petit numéro possible), suffixe « one ».', /numérot/) },
    { id: 'nom-acide', titre: 'Nommer un acide carboxylique', focus: ['scene'], scene: [{ m: R('acide propanoïque'), flip: true, surligner: 'groupe' }],
      texte: <>Le groupe carboxyle est lui aussi en bout de chaîne (carbone n° 1, pas de numéro). Le nom commence par le mot <strong>« acide »</strong> et le suffixe est <strong>« oïque »</strong>.</>,
      tache: qcmNom(R('acide propanoïque'), 'acide + nom de l’alcane de 3 carbones (sans le « e ») + oïque.') },
    { id: 'construire1', titre: 'Du nom à la formule (1/4)', focus: ['reglages', 'scene'], scene: 'cons', ctrl: ['n', 'groupe'], fiche: ['nom'], depart: DEPART,
      texte: <>On fait maintenant le chemin inverse : à partir du nom, <strong>construire la formule semi-développée</strong>. Réglez le nombre d’atomes de carbone de la chaîne principale et choisissez le groupe caractéristique. Le préfixe de « butanal » est « but », le suffixe « al » est celui des aldéhydes.</>,
      tache: construire('butanal', 'Construisez le butanal (la fiche d’identité affiche le nom de ce que vous avez construit)') },
    { id: 'construire2', titre: 'Du nom à la formule (2/4)', focus: ['reglages', 'scene'], scene: 'cons', ctrl: ['n', 'groupe', 'pos'], fiche: ['nom'], depart: DEPART,
      texte: <>Pour un alcool ou une cétone, le numéro du nom indique <strong>quel carbone porte le groupe</strong>. Un curseur de position apparaît. Le suffixe « ol » est celui des alcools.</>,
      tache: construire('pentan-2-ol', 'Construisez le pentan-2-ol') },
    { id: 'construire3', titre: 'Du nom à la formule (3/4)', focus: ['reglages', 'scene'], scene: 'cons', ctrl: ['n', 'groupe', 'pos', 'sub'], fiche: ['nom'], depart: DEPART,
      texte: <>Pour un alcane ramifié, on choisit la chaîne principale (le nom de l’alcane), puis on ajoute des substituants en indiquant le numéro du carbone qui les porte. Dans « 2-méthylbutane » : chaîne de 4 carbones (butane) et un méthyle sur le carbone n° 2.</>,
      tache: construire('2-méthylbutane', 'Construisez le 2-méthylbutane') },
    { id: 'construire4', titre: 'Du nom à la formule (4/4)', focus: ['reglages', 'scene'], scene: 'cons', ctrl: ['n', 'groupe', 'pos', 'sub'], fiche: ['nom'], depart: DEPART,
      texte: <>Dernier défi de construction, avec deux substituants différents : 3-éthyl-2-méthylpentane. Lisez le nom de gauche à droite : chaîne de 5 carbones (pentane), un méthyle sur le carbone 2 et un éthyle sur le carbone 3.</>,
      tache: construire('3-éthyl-2-méthylpentane', 'Construisez le 3-éthyl-2-méthylpentane') },
    { id: 'bravo', titre: 'Bravo !', focus: [], scene: [{ m: R('acide éthanoïque'), surligner: 'groupe' }],
      retenir: <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
        <li>un carbone fait <strong>4 liaisons</strong> ; la formule semi-développée montre l’enchaînement des atomes, la formule brute seulement leur nombre</li>
        <li>alcane : hydrocarbure à chaîne saturée non cyclique ; nom = préfixe (méth, éth, prop, but, pent, hex) + <strong>ane</strong></li>
        <li>ramifié : chaîne principale la plus longue, numéros les plus petits, substituants (méthyl, éthyl) par ordre alphabétique, di/tri si identiques</li>
        <li>hydroxyle –OH : alcool (<strong>ol</strong>) · carbonyle C=O : aldéhyde (<strong>al</strong>) ou cétone (<strong>one</strong>) · carboxyle –COOH : acide (<strong>oïque</strong>)</li></ul>,
      texte: <>Vous savez écrire la formule brute d’une molécule simple, reconnaître son groupe caractéristique et sa famille, la nommer, et retrouver sa formule à partir de son nom. Explorez librement, ou essayez les défis.</>, tache: null },
  ];
  const eC = ETAPES[Math.min(etape, ETAPES.length - 1)], idE = eC.id;
  const hl = id => enGuide && eC.focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});
  // commandes du constructeur visibles : celles des étapes déjà atteintes (on accumule)
  const ctrlVisibles = enGuide ? new Set(ETAPES.slice(0, Math.min(etape, ETAPES.length - 1) + 1).flatMap(e => e.ctrl || [])) : new Set(['n', 'groupe', 'pos', 'sub', 'retourner', 'vue']);

  // ════════════════ DÉFIS ════════════════
  const nouveauDefi = (type, ancien) => setDefi(tirageDefi(type, ancien));
  const changerMode = md => { setMode(md); if (md === 'defi' && !defi) nouveauDefi(typeDefi); };
  const choisirDefi = t => { setTypeDefi(t); nouveauDefi(t); };
  const compteurs = { nom: [sNom, noterNom], formule: [sFormule, noterFormule], groupe: [sGroupe, noterGroupe], brute: [sBrute, noterBrute] };
  const maj = f => setDefi(d => ({ ...d, ...f }));
  const verifierDefi = () => {
    const d = defi; let res;
    if (d.type === 'nom') {
      const st = O.comparerNom(d.reps.nom, d.m);
      if (st === 'ok') res = { ok: true };
      else if (st === 'ponctuation') res = { ok: false, msg: 'Le nom est le bon, mais vérifiez la ponctuation : un tiret entre un numéro et une lettre, une virgule entre deux numéros, un espace après « acide ».' };
      else {
        const norm = s => O.sansAccent(String(s).toLowerCase()).replace(/[\s,-]/g, '');
        const mal = O.mauvaisNoms(d.m).find(x => norm(x[0]) === norm(d.reps.nom || ''));
        res = { ok: false, msg: mal ? `Pas tout à fait : ${mal[1]}.` : 'Pas encore. Revoyez la méthode : chaîne principale (la plus longue, avec le groupe s’il y en a un), numérotation (plus petits numéros), substituants, suffixe.' };
      }
    } else if (d.type === 'formule') {
      if (d.choisi == null) return;
      const ch = d.choix[d.choisi].m;
      res = O.nom(ch) === O.nom(d.m) ? { ok: true } : { ok: false, msg: `Pas celle-là : la formule choisie est celle de ${O.nom(ch)}.${O.brute(ch).C === O.brute(d.m).C && O.brute(ch).H === O.brute(d.m).H && O.brute(ch).O === O.brute(d.m).O ? ' Elle a la même formule brute que la bonne réponse, mais pas le même enchaînement d’atomes.' : ''}` };
    } else if (d.type === 'groupe') {
      const f = O.famille(d.m), gOk = (d.reps.groupe || '') === (f.groupe ? f.groupe.cle : 'aucun'), fOk = (d.reps.famille || '') === f.cle;
      res = gOk && fOk ? { ok: true } : { ok: false, msg: !gOk && !fOk ? 'Ni le groupe, ni la famille ne sont justes.' : !gOk ? 'La famille est juste, mais pas le groupe caractéristique.' : 'Le groupe est juste, mais pas la famille : un carbonyle en bout de chaîne donne un aldéhyde, au milieu une cétone.', gOk, fOk };
    } else {
      const ok = O.comparerBrute(d.reps.brute, d.m), x = O.lireBrute(d.reps.brute);
      res = ok ? { ok: true } : { ok: false, msg: !x ? 'Écrivez la formule avec les symboles C, H et O suivis du nombre d’atomes, par exemple C3H8O.' : 'Pas encore. Comptez les C (chaîne et ramifications), les H (règle des 4 liaisons : 4 − nombre de liaisons sur chaque carbone) et les O.' };
    }
    maj({ verifie: true, res });
    compteurs[d.type][1](res.ok);
  };
  const reponseDefi = d => (d.type === 'nom' ? O.nom(d.m) : d.type === 'brute' ? O.brUnicode(d.m) : d.type === 'formule' ? O.nom(d.m) : `${O.famille(d.m).groupe ? O.famille(d.m).groupe.nom : 'aucun groupe'} · ${O.famille(d.m).nom}`);
  const champ = (cle, label, ph, larg = 260) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps[cle] ?? ''} placeholder={ph} aria-label={label} onKeyDown={e => e.key === 'Enter' && document.getElementById('no-verif')?.click()}
        onChange={e => maj({ reps: { ...defi.reps, [cle]: e.target.value }, verifie: false })}
        style={{ width: larg, maxWidth: '100%', padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.res.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 15 }}/>
    </div>);
  const choixRadio = (cle, titre, options) => (
    <div role="radiogroup" aria-label={titre} style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{titre}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map(([v, l]) => <button key={v} role="radio" aria-checked={defi.reps[cle] === v} onClick={() => maj({ reps: { ...defi.reps, [cle]: v }, verifie: false })} style={stylePetitBouton(defi.reps[cle] === v, '#0369a1')}>{l}</button>)}
      </div>
    </div>);
  const consigneDefi = d => d.type === 'nom' ? 'Défi : donnez le nom de cette molécule.' : d.type === 'formule' ? 'Défi : quelle formule semi-développée correspond à ce nom ?' : d.type === 'groupe' ? 'Défi : quel groupe caractéristique et quelle famille ?' : 'Défi : écrivez la formule brute de cette molécule.';
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['nom', 'Nommer'], ['formule', 'Du nom à la formule'], ['groupe', 'Groupe et famille'], ['brute', 'Formule brute']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{consigneDefi(defi)}</div>
      {defi.type === 'formule'
        ? <div style={{ fontSize: 18, fontWeight: 700, color: KIT.txt, margin: '4px 0 10px' }}>{O.nom(defi.m)}</div>
        : <div style={{ background: 'white', borderRadius: 14, padding: '8px 6px', margin: '4px 0 10px', border: `1px solid ${KIT.bord}` }}><Mol m={defi.m} flip={defi.flip} max={420}/></div>}
      {defi.type === 'nom' && <>{champ('nom', 'Nom :', 'par exemple 2-méthylbutane', 300)}
        <IndiceDefi cache={defi.verifie && defi.res.ok}>Méthode : chaîne principale (la plus longue{O.aGroupe(defi.m) ? ', celle qui porte le groupe' : ''}) ; numérotation avec les plus petits numéros{O.aGroupe(defi.m) ? ' pour le groupe' : ''} ; {O.aGroupe(defi.m) ? 'suffixe de la famille (ol, al, one, oïque)' : 'substituants (méthyl, éthyl) par ordre alphabétique, di / tri si identiques'}. Préfixes : méth, éth, prop, but, pent, hex.</IndiceDefi></>}
      {defi.type === 'formule' && <>
        <div role="radiogroup" aria-label="Formules proposées" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginBottom: 8 }}>
          {defi.choix.map((c, i) => (
            <button key={i} role="radio" aria-checked={defi.choisi === i} aria-label={`Formule ${'ABCD'[i]}`} onClick={() => maj({ choisi: i, verifie: false })}
              style={{ background: 'white', borderRadius: 12, padding: '8px 6px 4px', cursor: 'pointer', border: `2.5px solid ${defi.choisi === i ? '#0369a1' : KIT.bord}`, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>{'ABCD'[i]}</div>
              <Mol m={c.m} flip={c.flip} max={300}/>
            </button>))}
        </div>
        <IndiceDefi cache={defi.verifie && defi.res.ok}>Décodez le nom : le préfixe donne le nombre de carbones de la chaîne principale, le suffixe (ol, al, one, oïque) le groupe, le numéro sa position, et les substituants éventuels leur place.</IndiceDefi></>}
      {defi.type === 'groupe' && <>
        {choixRadio('groupe', 'Groupe caractéristique', [['aucun', 'aucun'], ['hydroxyle', 'hydroxyle –OH'], ['carbonyle', 'carbonyle C=O'], ['carboxyle', 'carboxyle –COOH']])}
        {choixRadio('famille', 'Famille', [['alcane', 'alcane'], ['alcool', 'alcool'], ['aldehyde', 'aldéhyde'], ['cetone', 'cétone'], ['acide', 'acide carboxylique']])}
        <IndiceDefi cache={defi.verifie && defi.res.ok}>Cherchez –OH, C=O ou –COOH. Un C=O en bout de chaîne (lié à H) : aldéhyde ; au milieu de la chaîne : cétone ; un C=O et un –OH sur le même carbone : acide carboxylique.</IndiceDefi></>}
      {defi.type === 'brute' && <>{champ('brute', 'Formule brute :', 'par exemple C3H8O', 200)}
        <IndiceDefi cache={defi.verifie && defi.res.ok}>Comptez les C (y compris ceux des ramifications), les O, puis les H : chaque carbone a 4 liaisons au total, le reste de ses liaisons est occupé par des H.</IndiceDefi></>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
        <button id="no-verif" onClick={verifierDefi} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type, defi)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.res.ok ? '#15803d' : '#dc2626' }}>
        {defi.res.ok ? <>✓ Correct : {defi.type === 'brute' ? <FB m={defi.m}/> : reponseDefi(defi)}.</> : `✗ ${defi.res.msg}`}</div>}
      <SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={compteurs[defi.type][0]}/>
    </div>);

  // ════════════════ SCÈNE ════════════════
  const elements = enGuide ? (eC.scene === 'cons' ? 'cons' : eC.scene) : 'cons';
  const sceneBox = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {elements === 'cons' ? (
        <div style={{ minHeight: 120 }}>
          <Mol m={molCons} flip={cons.flip} exact chaine={cons.vue.chaine} surligner={cons.vue.groupe ? 'groupe' : null} numeros={[...(cons.vue.g ? ['g'] : []), ...(cons.vue.d ? ['d'] : [])]} max={460}/>
          {!!(cons.vue.g || cons.vue.d) && <div style={{ fontSize: 12.5, color: KIT.txt2, textAlign: 'center', marginTop: 2 }}>{cons.vue.g && <span style={{ color: '#2563eb', fontWeight: 700 }}>bleu : numérotation de gauche à droite</span>}{cons.vue.g && cons.vue.d && ' · '}{cons.vue.d && <span style={{ color: '#c2410c', fontWeight: 700 }}>orange : de droite à gauche</span>}</div>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', minHeight: 120 }}>
          {elements.map((e, i) => (
            <figure key={i} style={{ margin: 0, flex: elements.length > 2 ? '1 1 calc(50% - 10px)' : '1 1 220px', minWidth: 0, textAlign: 'center' }}>
              <Mol m={e.m} flip={!!e.flip} surligner={e.surligner || null} chaine={!!e.chaine} numeros={e.numeros || []} masqueH={!!e.masqueH} max={elements.length > 1 ? 280 : 460}/>
              {e.legende && <figcaption style={{ fontSize: 14, fontWeight: 700, color: KIT.txt2, marginTop: 2 }}>{e.legende}</figcaption>}
            </figure>))}
        </div>)}
      {enGuide && elements !== 'cons' && elements.some(e => e.numeros && e.numeros.length) && <div style={{ fontSize: 12.5, color: KIT.txt2, textAlign: 'center', marginTop: 4 }}><span style={{ color: '#2563eb', fontWeight: 700 }}>bleu : numérotation de gauche à droite</span> · <span style={{ color: '#c2410c', fontWeight: 700 }}>orange : de droite à gauche</span></div>}
      {enGuide && elements !== 'cons' && elements.some(e => e.chaine) && <div style={{ fontSize: 12.5, color: KIT.txt2, textAlign: 'center', marginTop: 2 }}>Surlignage jaune : chaîne principale.</div>}
    </div>);

  // ════════════════ RÉGLAGES (constructeur) ════════════════
  const posOK = cons.g && (cons.g.t === 'OH' || cons.g.t === 'CO');
  const reglages = (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>{enGuide ? 'Construire la molécule' : 'Construire une molécule'}</div>
      {ctrlVisibles.has('n') && <Curseur nom="Atomes de carbone de la chaîne principale" valeur={cons.n} onChange={setN} min={1} max={6} pas={1} decimales={0} couleur="#475569"/>}
      {ctrlVisibles.has('groupe') && <div role="radiogroup" aria-label="Groupe caractéristique" style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Groupe caractéristique</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{GROUPES_BOUTONS.map(([t, l]) => {
          const actif = (cons.g ? cons.g.t : null) === t, ferme = t === 'CO' && cons.n < 3;
          return <button key={String(t)} role="radio" aria-checked={actif} disabled={ferme} title={ferme ? 'Une cétone demande au moins 3 carbones' : undefined} onClick={() => choisirGroupe(t)} style={{ ...stylePetitBouton(actif, '#0e7490'), opacity: ferme ? 0.45 : 1, cursor: ferme ? 'not-allowed' : 'pointer' }}>{l}</button>;
        })}</div></div>}
      {ctrlVisibles.has('pos') && posOK && <Curseur nom={cons.g.t === 'OH' ? 'Numéro du carbone qui porte –OH' : 'Numéro du carbone du groupe C=O'} valeur={cons.g.pos} onChange={setPosGroupe} min={cons.g.t === 'CO' ? 2 : 1} max={cons.g.t === 'CO' ? Math.max(2, cons.n - 1) : cons.n} pas={1} decimales={0} couleur="#b45309"/>}
      {ctrlVisibles.has('sub') && !cons.g && cons.n >= 3 && <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Substituants (ramifications)</div>
        {cons.subs.map((s, i) => (
          <div key={i} style={{ background: '#f1f5f9', borderRadius: 10, padding: '6px 10px', marginBottom: 6 }}>
            <Curseur nom={`Substituant ${i + 1} : numéro du carbone`} valeur={s.pos} onChange={v => majSub(i, { pos: v })} min={2} max={cons.n - 1} pas={1} decimales={0} couleur="#b45309"/>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[[1, 'méthyle –CH₃'], [2, 'éthyle –CH₂–CH₃']].map(([L, l]) => <button key={L} aria-pressed={s.L === L} onClick={() => majSub(i, { L })} style={stylePetitBouton(s.L === L, '#0e7490')}>{l}</button>)}
              <button onClick={() => retirerSub(i)} style={stylePetitBouton(false, '#b91c1c')}>Retirer</button>
            </div>
          </div>))}
        {cons.subs.length < 2 && <button onClick={ajouterSub} style={stylePetitBouton(false, '#0e7490')}>+ Ajouter un substituant</button>}
      </div>}
      {ctrlVisibles.has('vue') && <div style={{ marginTop: 6 }}>
        <div style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Afficher</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button aria-pressed={cons.vue.chaine} onClick={() => basculerVue('chaine')} style={stylePetitBouton(cons.vue.chaine, '#a16207')}>Chaîne principale</button>
          <button aria-pressed={cons.vue.groupe} onClick={() => basculerVue('groupe')} style={stylePetitBouton(cons.vue.groupe, '#0369a1')}>Groupe caractéristique</button>
          <button aria-pressed={cons.vue.g} onClick={() => basculerVue('g')} style={stylePetitBouton(cons.vue.g, '#2563eb')}>Numéros →</button>
          <button aria-pressed={cons.vue.d} onClick={() => basculerVue('d')} style={stylePetitBouton(cons.vue.d, '#c2410c')}>Numéros ←</button>
          <button aria-pressed={cons.flip} onClick={() => setCons(c => ({ ...c, flip: !c.flip }))} style={stylePetitBouton(cons.flip, '#475569')}>Retourner la molécule</button>
        </div>
      </div>}
      {!enGuide && <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 13.5, color: KIT.txt2, fontWeight: 700, marginBottom: 4 }}>Molécules de la fiche de cours (lettres de l’exercice)</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{COURS.map(([l, n]) => <button key={l} aria-label={`Molécule ${l} de la fiche de cours`} onClick={() => setCons(c => etatDepuisMol(R(n), c.vue))} style={stylePetitBouton(false, '#475569')}>{l}</button>)}</div>
      </div>}
    </div>);

  // ════════════════ FICHE D'IDENTITÉ ════════════════
  const lignesFiche = enGuide ? (eC.fiche || []) : ['brute', 'nom', 'famille', 'groupe', 'chaine'];
  const msgChaine = lu.longueur !== cons.n && !cons.g && cons.subs.length > 0;
  const fiche = enDefi ? null : (enGuide ? (elements === 'cons' ? lignesFiche.length > 0 : (elements.length === 1 && lignesFiche.length > 0)) : true) && (
    <div>
      <Fiche m={elements === 'cons' ? molCons : elements[0].m} nomDessin={elements === 'cons' ? nomCons : undefined} lignes={lignesFiche} cadre={cadre('fiche')}/>
      {elements === 'cons' && msgChaine && lignesFiche.includes('nom') && <div style={{ fontSize: 13, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 8, padding: '6px 8px', marginTop: 6 }}>
        Attention : avec ce substituant, la plus longue chaîne compte {lu.longueur} carbones et non {cons.n}. La simulation donne le nom d’après la vraie chaîne principale.</div>}
    </div>);

  // ════════════════ HYPOTHÈSES, ESSAYER, RETENIR ════════════════
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Composés étudiés</strong> : à chaîne carbonée <strong>saturée</strong> (liaisons simples C–C), chaîne principale de 1 à 6 atomes de carbone, avec au plus deux substituants méthyle ou éthyle pour les alcanes, et <strong>un seul groupe caractéristique</strong> (alcool, aldéhyde, cétone ou acide carboxylique) sur une chaîne linéaire. Les alcènes, les cycles, les amines et les molécules à plusieurs groupes ne sont pas traités.</li>
      <li><strong>Formule semi-développée plane</strong> : elle montre l’enchaînement des atomes, pas la géométrie réelle. Dans l’espace, un carbone qui ne porte que des liaisons simples est tétraédrique (angles voisins de 109°) : les carbones d’une chaîne ne sont pas alignés, contrairement au dessin.</li>
      <li><strong>Nom</strong> : calculé par la méthode du cours (chaîne principale la plus longue, avec le groupe s’il y en a un ; numéros les plus petits, d’abord pour le groupe, puis pour les substituants ; substituants par ordre alphabétique). Le programme se limite à des cas simples : les règles de priorité entre plusieurs chaînes de même longueur ne sont pas discutées.</li>
      <li><strong>Numéro du groupe</strong> : omis quand il n’y a pas d’ambiguïté (méthanol, éthanol, propanone, butanone ; aldéhydes et acides, dont le groupe est toujours en bout de chaîne). Dans les défis, « propan-2-one » et « butan-2-one » sont aussi acceptés. Pour le reste, la saisie tolère les majuscules et les accents, mais pas les oublis de tirets ou de virgules (elle le signale).</li>
      <li><strong>Formule brute</strong> : déduite du dessin avec la règle des 4 liaisons par carbone, 2 par oxygène, 1 par hydrogène.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail et limites" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Construisez le butane puis le 2-méthylpropane. Comparez leurs formules brutes et leurs noms : que remarquez-vous ?</li>
        <li>Placez un substituant éthyle sur le carbone n° 2 d’une chaîne de 4 carbones. Que dit la fiche d’identité de la chaîne principale ? Pourquoi le nom change-t-il ?</li>
        <li>Choisissez une chaîne de 5 carbones et déplacez le groupe –OH du carbone 1 au carbone 3 : comment le nom évolue-t-il ? Et la formule brute ?</li>
        <li>Avec le même nombre de carbones, comparez un aldéhyde et une cétone : mêmes atomes, mêmes formules brutes ? Quelle différence dans le dessin ?</li>
        <li>Affichez les numéros dans les deux sens (→ et ←) sur un alcool à 5 carbones dont le groupe est au carbone 4 : quel sens faut-il retenir ?</li>
        <li>Retrouvez les molécules a à n de la fiche de cours avec les boutons de lettres, et nommez-les avant de lire la fiche d’identité.</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>un carbone : 4 liaisons ; formule brute = nombre d’atomes, formule semi-développée = enchaînement</li>
        <li>alcane linéaire : préfixe (méth, éth, prop, but, pent, hex) + <strong>ane</strong></li>
        <li>ramifié : chaîne principale la plus longue · numéros les plus petits · substituants par ordre alphabétique (di, tri)</li>
        <li>–OH : alcool <strong>ol</strong> · C=O : aldéhyde <strong>al</strong> (bout de chaîne) ou cétone <strong>one</strong> · –COOH : acide <strong>oïque</strong></li>
      </ul>
    </ARetenir>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);
  const derniereEtape = enGuide && idE === 'bravo';
  const montrerReglages = enGuide ? ctrlVisibles.size > 0 && eC.scene === 'cons' : mode === 'explore';

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .no-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .no-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .no-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        .no-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); }
        .no-pri.pile { grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 901px) { .no-l1.cote .no-carte { order: 2; } .no-l1.cote .no-main { order: 1; } }
        @media (max-width: 900px) { .no-l1.cote, .no-pri { grid-template-columns: minmax(0, 1fr); }
          .no-l1.cote .no-main { order: 1; } .no-l1.cote .no-carte { order: 2; }
          .no-l1.cote.cons .no-main { order: 2; } .no-l1.cote.cons .no-carte { order: 1; } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Nomenclature et groupes caractéristiques</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      {!enGuide && <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une molécule organique se décrit par sa <strong>formule brute</strong> et sa <strong>formule semi-développée</strong>. Son <strong>nom</strong> se déduit de la chaîne carbonée et de son <strong>groupe caractéristique</strong>, qui détermine sa <strong>famille</strong>.</div>}
      <div className={`no-l1${mode !== 'explore' ? ' cote' : ''}${enGuide && eC.scene === 'cons' ? ' cons' : ''}`}>
        {enGuide ? <div className="no-carte"><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="no-carte">{panneauHypo}</div> : null}
        <div className="no-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}</div>}
          {!enDefi && <div className={`no-pri${mode !== 'explore' && !(enGuide && eC.scene === 'cons') ? ' pile' : ''}`}>
            {sceneBox}
            {(montrerReglages || fiche) && <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{montrerReglages && reglages}{fiche}</div>}
          </div>}
          {enDefi && defi && defi.type !== 'formule' && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 8 }}>Les formules sont écrites sans les liaisons C–H : un « CH₂ » est un carbone lié à deux hydrogènes.</div>}
        </div>
      </div>
      {(mode === 'explore' || derniereEtape) && <div className="no-l2">{panneauHypo}</div>}
      {mode === 'explore' && <div className="no-l2">{aEssayer}{retenir}</div>}
    </div>);
}
