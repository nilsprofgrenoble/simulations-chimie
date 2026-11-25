import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { useState, useMemo } from "react";
import { Formule, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi, avecIndices } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./radioactiviteModele";
import { SvgGrandsNombres, SvgLoi, SvgActivite, SvgComptage, SvgDatation } from "./radioactiviteSchemas";

const SIM_ID = 123, CLE_GUIDE = 'radioactivite-tg-guide-v1';
declarerDefis(SIM_ID, [['th', 'Quelle est la demi-vie d’après les mesures d’activité ?'], ['age', 'Quel est l’âge de l’échantillon ?']]);

// ====================================================
//  SIM 123 — RADIOACTIVITÉ : LOI DE DÉCROISSANCE, DEMI-VIE, ACTIVITÉ ET DATATION (TG spé PC, thème « Constitution et transformations de la matière »,
//  partie « Modéliser l’évolution temporelle d’un système, siège d’une transformation nucléaire »).
//  Une seule idée : la population de noyaux radioactifs décroît selon dN/dt = −λ·N. (1) hasard individuel et régularité des grands nombres, (2) loi N(t) et demi-vie,
//  (3) activité A = λ·N et comptage (incertitude), (4) datation par un noyau radioactif.
//  Le calcul de la décroissance est celui de la 122 (vitesseOrdre1Modele.js, non modifié) ; modèle propre : radioactiviteModele.js. Situations originales.
//  Capacités visées (jamais affichées à l’élève) : établir l’expression de l’évolution temporelle de la population de noyaux ; exploiter la loi et une courbe de décroissance ;
//  expliquer le principe de la datation et dater un événement.
// ====================================================

const nbf = (v, d) => Number(v).toFixed(d).replace('.', ',');
const fmtMilliers = v => String(Math.round(v)).replace(/\B(?=(\d{3})+$)/g, NB);
const tire = t => t[Math.floor(Math.random() * t.length)];
const nouvelleGraine = () => 1 + Math.floor(Math.random() * 900000);
const COL = { bleu: '#0369a1', orange: '#b45309', vert: '#15803d', rouge: '#b91c1c', gris: '#64748b', violet: '#6d28d9' };
const cadreGraphe = { width: '100%', display: 'block', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` };
const TH_AGE = M.TH_C14;                       // demi-vie du carbone 14 (années)
const PRESET = { th: 8, N0: 4.0e7, t: 0, age: 0, tn: 0, graines: [], nSc: 100, dtS: 10, grB: 5, bruit: false, niv: false, tang: false, ctx: 'ech', scene: undefined };

// nombre de noyaux restants (sur n) à l’instant t pour un essai de graine g : individus pour n = 100, tirage global au-delà
const compte = (n, g, th, t) => (n === 100 ? M.restantsA(M.instantsDeces(100, th, g), t) : M.restantsApres(n, th, t, g));
const pctTxt = (k, n) => `${nbf(100 * k / n, n >= 10000 ? 2 : 0)}${NB}%`;

// ---------- formules (MathML) ----------
const FdN = <Formule><mfrac><mrow><mi mathvariant="normal">d</mi><mi>N</mi></mrow><mrow><mi mathvariant="normal">d</mi><mi>t</mi></mrow></mfrac><mo>=</mo><mo>−</mo><mi>λ</mi><mo>·</mo><mi>N</mi></Formule>;
const FloiN = <Formule><mi>N</mi><mo>(</mo><mi>t</mi><mo>)</mo><mo>=</mo><msub><mi>N</mi><mn>0</mn></msub><mo>·</mo><msup><mi mathvariant="normal">e</mi><mrow><mo>−</mo><mi>λ</mi><mo>·</mo><mi>t</mi></mrow></msup></Formule>;
const FtDemi = <Formule><msub><mi>t</mi><mn>½</mn></msub><mo>=</mo><mfrac><mrow><mi>ln</mi><mo>(</mo><mn>2</mn><mo>)</mo></mrow><mi>λ</mi></mfrac></Formule>;
const FactA = <Formule><mi>A</mi><mo>=</mo><mo>−</mo><mfrac><mrow><mi mathvariant="normal">d</mi><mi>N</mi></mrow><mrow><mi mathvariant="normal">d</mi><mi>t</mi></mrow></mfrac><mo>=</mo><mi>λ</mi><mo>·</mo><mi>N</mi></Formule>;
const Fage = <Formule><mi>t</mi><mo>=</mo><mfrac><mn>1</mn><mi>λ</mi></mfrac><mo>·</mo><mi>ln</mi><mo>(</mo><mfrac><msub><mi>N</mi><mn>0</mn></msub><mi>N</mi></mfrac><mo>)</mo></Formule>;
const FageT = <Formule><mi>t</mi><mo>=</mo><mfrac><msub><mi>t</mi><mn>½</mn></msub><mrow><mi>ln</mi><mn>2</mn></mrow></mfrac><mo>·</mo><mi>ln</mi><mo>(</mo><mfrac><msub><mi>N</mi><mn>0</mn></msub><mi>N</mi></mfrac><mo>)</mo></Formule>;

// ---------- les noyaux : grille de 100 noyaux, ou barre de proportion ----------
function Noyaux({ n, restants, inst, tn }) {
  const cases = Array.from({ length: 100 }, (_, i) => i);
  const part = restants / n;
  return (
    <svg viewBox="0 0 230 230" style={{ width: '100%', maxWidth: 230, display: 'block', margin: '0 auto', background: 'white', borderRadius: 8, border: `1px solid ${KIT.bord}` }} role="img"
      aria-label={n === 100 ? `Cent noyaux : ${restants} intacts (gris) et ${100 - restants} désintégrés (orange).` : `${n} noyaux, représentés par une barre : ${nbf(100 * part, 2)} pour cent sont intacts.`}>
      {n === 100
        ? cases.map(i => { const x = 15 + (i % 10) * 20, y = 15 + Math.floor(i / 10) * 20, des = inst[i] <= tn;
          return des ? <g key={i}><circle cx={x} cy={y} r="7" fill="#fed7aa" stroke={COL.orange} strokeDasharray="2 2"/><path d={`M${x - 3},${y - 3} L${x + 3},${y + 3} M${x + 3},${y - 3} L${x - 3},${y + 3}`} stroke={COL.orange} strokeWidth="1.5"/></g>
            : <circle key={i} cx={x} cy={y} r="7" fill="#64748b" stroke="#334155"/>; })
        : <g>
          <rect x="20" y="50" width="190" height="60" fill="#fed7aa" stroke={COL.orange} strokeDasharray="3 3"/>
          <rect x="20" y="50" width={190 * part} height="60" fill="#64748b"/>
          <text x="115" y="136" fontSize="13" fontWeight="700" textAnchor="middle" fill="#0f172a">{nbf(100 * part, 2)} % intacts</text>
          <text x="115" y="160" fontSize="12" textAnchor="middle" fill="#475569">gris : intacts · orange : désintégrés</text>
        </g>}
    </svg>);
}

// ---------- graphe N(t) / A(t) ----------
function CourbeN({ P, th, ctx, tmax, t, pts, afficherA, niv, tang, modele, ligneF, masque }) {
  const dat = ctx === 'dat';
  const W = 480, H = 340, mx = masque ? 22 : 66, mr = afficherA && !dat ? 70 : 16, my = 16, bas = H - 56;
  const lS = M.lambdaS(P), ech = dat ? 1 : 1e-6, ymax = dat ? 100 : Math.ceil(P.c0 / 1e7) * 10;
  const X = u => mx + (W - mx - mr) * u / tmax, Y = v => bas - (bas - my) * v / ymax;     // v : millions de noyaux (ech) ou % (dat)
  const Nv = u => M.N(P, u) * ech;
  const ligne = (n = 90) => Array.from({ length: n + 1 }, (_, i) => { const u = tmax * i / n; return `${i ? 'L' : 'M'}${X(u).toFixed(1)},${Y(Nv(u)).toFixed(1)}`; }).join('');
  const pas = dat ? 25 : (ymax === 10 ? 5 : ymax / 4), ticksY = []; for (let v = 0; v <= ymax + 1e-9; v += pas) ticksY.push(v);
  const pasX = [1, 2, 5, 10, 20].find(v => tmax / v <= 6), ticksNeutres = []; for (let v = 0; v <= tmax + 1e-9; v += pasX) ticksNeutres.push(v);
  const ticksX = masque ? ticksNeutres : dat ? [0, 1, 2, 3, 4].map(k => k * th) : [0, 1, 2, 3, 4, 5].map(k => k * th);
  const fmtA = a => (a < 10 ? nbf(a, 1) : nbf(a, 0));
  const tg = tang ? M.tangente(P, t) : null, tEnd = tg ? Math.min(tg.tB, tmax) : 0;
  const unite = dat ? 'ans' : 'jours';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={cadreGraphe} role="img"
      aria-label={`${dat ? 'Pourcentage de carbone 14 restant' : 'Nombre de noyaux restants (en millions)'} en fonction du temps, de ${dat ? '100 pour cent' : nbf(P.c0 / 1e6, 0) + ' millions'} à t égal 0, divisé par 2 toutes les demi-vies de ${nbf(th, dat ? 0 : 1)} ${unite}. ${pts ? 'Des points de mesure de l’activité, dispersés autour de la courbe, sont tracés.' : ''} Le curseur est à t égal ${nbf(t, dat ? 0 : 1)} ${unite}.`}>
      <defs><clipPath id="ra-clip"><rect x={mx} y={my - 4} width={W - mx - mr + 2} height={bas - my + 4}/></clipPath></defs>
      <line x1={mx} y1={bas} x2={W - mr} y2={bas} stroke="#94a3b8"/><line x1={mx} y1={my} x2={mx} y2={bas} stroke="#94a3b8"/>
      {ticksX.map((u, i) => <text key={u} x={X(u)} y={bas + 20} fontSize="16" textAnchor={i === ticksX.length - 1 ? 'end' : 'middle'} fill="#334155">{dat ? fmtMilliers(u) : nbf(u, th % 1 ? 1 : 0)}</text>)}
      {ticksY.map(v => <g key={v}><line x1={mx} y1={Y(v)} x2={W - mr} y2={Y(v)} stroke="#eef2f7"/>
        {!masque && <text x={mx - 6} y={Y(v) + 5} fontSize="16" textAnchor="end" fill="#334155">{nbf(v, 0)}</text>}
        {afficherA && !dat && <text x={W - mr + 6} y={Y(v) + 5} fontSize="16" fill={COL.violet}>{fmtA(v * 1e6 * lS)}</text>}</g>)}
      <text x={(mx + W - mr) / 2} y={H - 10} fontSize="16" textAnchor="middle" fill="#334155">{dat ? 'temps écoulé depuis la mort (ans)' : 'temps t (jours)'}</text>
      {!masque && <text x="18" y={(my + bas) / 2} fontSize="16" fill="#334155" transform={`rotate(-90 18 ${(my + bas) / 2})`} textAnchor="middle">{dat ? 'carbone 14 restant (%)' : 'N (millions de noyaux)'}</text>}
      {afficherA && !dat && <text x={W - 12} y={(my + bas) / 2} fontSize="16" fill={COL.violet} transform={`rotate(90 ${W - 12} ${(my + bas) / 2})`} textAnchor="middle">A (Bq)</text>}
      {niv.map(({ n, c, vert }) => { const tn = n * th; return (
        <g key={n}><line x1={mx} y1={Y(c)} x2={vert ? X(tn) : W - mr} y2={Y(c)} stroke={COL.gris} strokeDasharray="4 3"/>
          {vert && <line x1={X(tn)} y1={Y(c)} x2={X(tn)} y2={bas} stroke={COL.gris} strokeDasharray="4 3"/>}
          {vert && <text x={X(tn) + 4} y={bas - 6} fontSize="15" fontWeight="700" fill={COL.vert}>{n} t½</text>}
          {!vert && <text x={W - mr - 4} y={Y(c) - 4} fontSize="15" fill="#475569" textAnchor="end">A₀/{2 ** n}</text>}</g>); })}
      {ligneF != null && <line x1={mx} y1={Y(ligneF)} x2={W - mr} y2={Y(ligneF)} stroke={COL.rouge} strokeDasharray="5 3"/>}
      {modele && <path d={ligne()} fill="none" stroke={COL.bleu} strokeWidth={pts ? 1.4 : 2.4} opacity={pts ? 0.65 : 1} strokeDasharray={pts ? '5 3' : undefined}/>}
      {pts && pts.map(p => <circle key={p.t} cx={X(p.t)} cy={Y(p.am / lS / 1e6)} r="3.4" fill={COL.violet} opacity="0.9"/>)}
      {tg && <g clipPath="url(#ra-clip)"><line x1={X(0)} y1={Y(tg.cA * ech)} x2={X(tEnd)} y2={Y(Math.max(0, (tg.cA - tg.v * tEnd) * ech))} stroke={COL.orange} strokeWidth="2" strokeDasharray="6 3"/></g>}
      <line x1={X(t)} y1={my} x2={X(t)} y2={bas} stroke={COL.orange} strokeWidth="1.3" strokeDasharray="3 3"/>
      {modele && <circle cx={X(t)} cy={Y(Nv(t))} r="6" fill="#f59e0b" stroke="#0f172a" strokeWidth="1.5"/>}
    </svg>);
}

// ====================================================
export function SimulationRadioactivite() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviT, noterT] = useCompteurDefi(), [suiviA, noterA] = useCompteurDefi();
  const VIDE = { etape: 0, reps: {}, verifs: {}, reussies: {} };
  const [g1, setG1] = useEtatPersistant(CLE_GUIDE, VIDE), [g2, setG2] = useEtatPersistant(CLE_GUIDE + '-p2', VIDE), [g3, setG3] = useEtatPersistant(CLE_GUIDE + '-p3', VIDE);
  const [parcBrut, setParc] = useEtatPersistant(CLE_GUIDE + '-parcours-choix', 1);
  const parc = [1, 2, 3].includes(parcBrut) ? parcBrut : 1;
  const guide = [g1, g2, g3][parc - 1], setGuide = [setG1, setG2, setG3][parc - 1];
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('th');
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ti, setTi] = useState(PRESET);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const dd = enDefi && defi ? defi : null;
  const setT = f => setTi(s => ({ ...s, ...f }));

  // ---------- étapes du parcours ----------
  const ORDRE_PARC = [['hasard', 'essai', 'repetes', 'grands', 'equation', 'solution', 'demi', 'lambda', 'nrest', 'bilan1'],
    ['lambdas', 'a0', 'at', 'mesure', 'compter', 'bilan2'],
    ['datprinc', 'dat3', 'datln', 'limites', 'bravo']];
  const IDS = ORDRE_PARC[parc - 1];
  // étape d’un autre parcours : déjà passée (parcours précédent) ou pas encore atteinte (parcours suivant)
  const iEt = id => { const k = IDS.indexOf(id); if (k >= 0) return k; return ORDRE_PARC.findIndex(o => o.includes(id)) < parc - 1 ? -1 : Infinity; };
  const etape = guide.etape, idE = enGuide ? IDS[Math.min(etape, IDS.length - 1)] : null;
  const apres = id => !enGuide || etape > iEt(id), deja = id => !enGuide || etape >= iEt(id);

  // ---------- grandeurs effectives ----------
  const ctx = dd ? (dd.type === 'age' ? 'dat' : 'ech') : enGuide ? (deja('datprinc') ? 'dat' : 'ech') : ti.ctx;
  const th = ctx === 'dat' ? TH_AGE : dd ? dd.th : enGuide ? M.TH_DEFAUT : ti.th;
  const N0 = ctx === 'dat' ? 100 : dd ? dd.N0 : enGuide ? M.N0_DEFAUT : ti.N0;
  const P = useMemo(() => M.params(N0, th), [N0, th]);
  const tmax = ctx === 'dat' ? 4 * TH_AGE : 5 * th;
  const tc = ctx === 'dat' ? ti.age : ti.t;
  const lS = M.lambdaS(P, M.JOUR_S);
  const dtS = dd ? 60 : ti.dtS;
  const grB = dd ? dd.graine : ti.grB;
  const pas = th / 4;
  const montrerPts = ctx === 'ech' && ((enGuide && deja('mesure')) || (enExplore && ti.bruit) || (dd && dd.type === 'th'));
  const pts = useMemo(() => (montrerPts ? M.serieActivite(P, dtS, grB, pas, tmax) : null), [montrerPts, P, dtS, grB, pas, tmax]);
  const iPt = pts ? Math.min(pts.length - 1, Math.max(0, Math.round(tc / pas))) : 0;
  const Nlu = M.N(P, tc), fracLu = M.fraction(P, tc);
  const nivN = (() => {
    if (dd && dd.type === 'age') return [];
    if (dd) return ti.niv ? [1, 2, 3] : [];
    if (enGuide) return deja('demi') && ctx === 'ech' ? [1, 2, 3] : [];
    return ti.niv ? [1, 2, 3] : [];
  })();
  // défi « demi-vie » : repères A₀/2, A₀/4, A₀/8 d'après la première mesure, sans trait vertical (la réponse n'est pas donnée)
  const a0Mes = pts && pts.length ? pts[0].am / lS / 1e6 : 0;
  const niv = nivN.map(n => (dd && dd.type === 'th' ? { n, c: a0Mes / 2 ** n, vert: false } : { n, c: P.c0 * (ctx === 'dat' ? 1 : 1e-6) / 2 ** n, vert: true }));

  // ---------- essais de la petite expérience ----------
  const dernier = ti.graines[ti.graines.length - 1];
  const nS = dernier ? dernier.n : ti.nSc, gS = dernier ? dernier.g : 1, thS = enGuide ? M.TH_DEFAUT : ti.th;
  const inst = useMemo(() => (nS === 100 ? M.instantsDeces(100, thS, gS) : null), [nS, thS, gS]);
  const { graines } = ti;
  const tnEff = enExplore ? thS : ti.tn, tnS = enExplore && !dernier ? 0 : tnEff;     // exploration : toujours une demi-vie ; 0 tant qu'aucun essai
  const restS = useMemo(() => (nS === 100 ? M.restantsA(inst, tnS) : M.restantsApres(nS, thS, tnS, gS)), [nS, inst, thS, tnS, gS]);
  const essais = useMemo(() => graines.map(e => ({ ...e, k: compte(e.n, e.g, thS, e.t) })), [graines, thS]);
  const nouvelEssai = (n = ti.nSc) => setT({ graines: [...ti.graines.slice(-5), { g: nouvelleGraine(), n, t: tnEff }] });

  const bloqueRepetes = ti.graines.length >= 3 ? null : 'Cliquez d’abord sur « Nouvel essai » pour avoir au moins trois résultats dans le tableau.';
  const bloqueGrands = ti.graines.some(e => e.n > 100) ? null : 'Choisissez 10 000 noyaux, puis cliquez sur « Nouvel essai » pour obtenir un résultat.';

  const TOUTES = [
    { id: 'hasard', titre: 'Des noyaux qui se désintègrent', focus: ['scene'],
      texte: <>Voici un petit échantillon de <strong>100 noyaux d’iode 131</strong>, tous identiques et intacts (ronds gris). Un noyau radioactif peut se <strong>désintégrer</strong> : le rond devient orange.</>,
      tache: { type: 'qcm', q: 'Peut-on prévoir lequel de ces 100 noyaux se désintégrera en premier ?', options: ['non : chaque noyau se désintègre au hasard', 'oui : le noyau le plus ancien se désintègre toujours le premier', 'oui : les noyaux du centre partent avant ceux du bord'], bonne: 0,
        expl: 'Les noyaux sont identiques et indépendants : aucun n’est « plus fragile » qu’un autre, et aucun ne « vieillit ». On ne peut prévoir ni lequel ni quand ; seule la probabilité de désintégration par unité de temps est connue.', indice: 'Ces 100 noyaux sont identiques : qu’est-ce qui pourrait distinguer l’un d’eux ?' } },
    { id: 'essai', titre: 'Laisser passer une demi-vie', focus: ['scene'],
      texte: <>La <strong>demi-vie</strong> de l’iode 131 est <em>t</em><sub>½</sub> = 8,0{NB}jours : c’est la durée au bout de laquelle, en moyenne, la moitié des noyaux d’un échantillon s’est désintégrée. Cliquez sur « Laisser passer 8 jours » sous les noyaux.</>,
      tache: { type: 'action', ok: ti.tn === 8 && ti.graines.length >= 1, label: 'Laisser passer 8 jours', faire: () => setT({ tn: 8, nSc: 100, graines: [{ g: nouvelleGraine(), n: 100, t: 8 }] }), consigne: 'Cliquez sur « Laisser passer 8 jours » (sous les noyaux)' } },
    { id: 'repetes', titre: 'On recommence', focus: ['scene', 'mesures'],
      texte: <>Le bouton « Nouvel essai » refait l’expérience avec <strong>100 autres noyaux identiques</strong>, toujours pendant 8,0{NB}jours. Le tableau garde les derniers résultats : cliquez au moins trois fois sur le bouton, puis répondez.</>,
      tache: { type: 'qcm', q: 'Après 8,0 jours, le nombre de noyaux restants sur 100 est…', options: ['voisin de 50, mais différent d’un essai à l’autre', 'toujours exactement 50 : c’est la définition de la demi-vie', 'quelconque entre 0 et 100, sans lien avec la demi-vie'], bonne: 0, bloque: bloqueRepetes,
        expl: 'La demi-vie donne la valeur moyenne (50 sur 100), mais chaque essai est un tirage au hasard : on obtient 50 « à quelques noyaux près », avec un écart typique de l’ordre de 5.', indice: 'Regardez les résultats du tableau : sont-ils tous égaux ? sont-ils très éloignés de 50 ?' } },
    { id: 'grands', titre: 'Avec beaucoup plus de noyaux', focus: ['scene', 'mesures'],
      texte: <>On refait l’expérience avec un plus grand nombre de noyaux : choisissez <strong>10 000</strong> puis <strong>1 000 000</strong> noyaux (boutons sous les noyaux), cliquez sur « Nouvel essai » plusieurs fois, et comparez les pourcentages de noyaux restants après 8,0{NB}jours.</>,
      tache: { type: 'qcm', q: 'Quand le nombre de noyaux augmente, le pourcentage de noyaux restants après 8,0 jours…', options: ['se rapproche de 50 %, avec des écarts de plus en plus faibles', 'varie de plus en plus, car il y a plus de hasard', 'se rapproche de 100 %, car il y a plus de noyaux à désintégrer'], bonne: 0, bloque: bloqueGrands,
        expl: 'Le hasard d’un noyau se « moyenne » quand ils sont très nombreux : l’écart relatif diminue (environ 10 % pour 100 noyaux, 1 % pour 10 000, 0,1 % pour 1 000 000). Pour un grand nombre de noyaux, on peut décrire la population par une loi continue.', indice: 'Comparez, dans le tableau, la dispersion des pourcentages pour 100, 10 000 et 1 000 000 noyaux.' } },
    { id: 'equation', titre: 'Mettre la loi en équation', focus: ['scene'],
      texte: <>Pour un grand nombre de noyaux, on décrit la <strong>valeur moyenne</strong>. Pendant une courte durée d<em>t</em>, chaque noyau a la même probabilité λ·d<em>t</em> de se désintégrer (λ : <strong>constante radioactive</strong>, en j⁻¹). Parmi les <em>N</em> noyaux présents, il s’en désintègre en moyenne λ·<em>N</em>·d<em>t</em> : le nombre de noyaux varie de d<em>N</em> = −λ·<em>N</em>·d<em>t</em>.</>,
      tache: { type: 'qcm', q: 'Quelle équation différentielle vérifie le nombre N(t) de noyaux restants ?', options: ['dN/dt = −λ·N : proportionnelle au nombre de noyaux', 'dN/dt = −λ : le même nombre de noyaux se désintègre à chaque instant', 'dN/dt = +λ·N : le nombre de noyaux augmente', 'dN/dt = −λ/N : il se désintègre moins de noyaux quand il y en a beaucoup'], bonne: 0,
        expl: 'Chaque noyau a la même probabilité de se désintégrer : plus il y a de noyaux, plus il y a de désintégrations par unité de temps, d’où dN/dt proportionnel à N. Le signe moins traduit que N diminue.', indice: 'Combien de noyaux se désintègrent pendant dt ? Chaque noyau a une probabilité λ·dt.' },
      retenirTitre: 'Hasard pour un noyau, loi pour un grand nombre',
      retenir: <>
        <SvgGrandsNombres/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Un noyau : on ne peut prévoir ni quand ni lequel</strong> (probabilité λ·dt par durée dt, quel que soit son âge).</li>
          <li>Exemple de la simulation : après une demi-vie, <strong>50 ± 5 noyaux restants sur 100</strong> ; 5 000 ± 50 sur 10 000. L’écart relatif diminue quand N augmente.</li>
          <li>Moyen de s’en souvenir : <strong>« un noyau : hasard ; beaucoup de noyaux : loi »</strong>. D’où dN = −λ·N·dt pour la valeur moyenne.</li>
        </ul></> },
    { id: 'solution', titre: 'La loi de décroissance', focus: ['courbe', 'mesures'],
      texte: <>Le nombre moyen de noyaux vérifie {FdN}Un échantillon d’iode 131 contient à <em>t</em> = 0 : <em>N</em><sub>0</sub> = 4,0 × 10⁷ noyaux (40 millions). Le graphique montre <em>N</em>(<em>t</em>) ; déplacez le curseur de temps pour lire <em>N</em>. La fonction qui vérifie cette équation avec <em>N</em>(0) = <em>N</em><sub>0</sub> est donnée par la loi de décroissance.</>,
      tache: { type: 'qcm', q: 'Quelle fonction vérifie dN/dt = −λ·N avec N(0) = N₀ ?', options: ['N(t) = N₀·e^(−λt) : sa dérivée vaut −λ·N(t)', 'N(t) = N₀ − λ·t : sa dérivée est constante, égale à −λ', 'N(t) = N₀·e^(+λt) : elle croît avec le temps', 'N(t) = N₀ / (1 + λt) : une décroissance plus lente'], bonne: 0,
        expl: 'On dérive N₀·e^(−λt) : −λ·N₀·e^(−λt) = −λ·N, et N(0) = N₀·e⁰ = N₀. N₀ − λt a pour dérivée −λ (constante) ; N₀·e^(λt) croît ; N₀/(1 + λt) a pour dérivée −λ·N₀/(1 + λt)², qui n’est pas −λ·N.', indice: 'Dérivez chaque proposition et comparez avec −λ·N.' } },
    { id: 'demi', titre: 'La demi-vie', focus: ['courbe'],
      texte: <>Les traits en pointillés marquent <em>N</em><sub>0</sub>/2, <em>N</em><sub>0</sub>/4 et <em>N</em><sub>0</sub>/8. À l’instant <em>t</em><sub>½</sub>, il reste la moitié des noyaux : <em>N</em>(<em>t</em><sub>½</sub>) = <em>N</em><sub>0</sub>/2, soit <em>N</em><sub>0</sub>·e<sup>−λ·<em>t</em><sub>½</sub></sup> = <em>N</em><sub>0</sub>/2.</>,
      tache: { type: 'qcm', q: 'Quelle relation en déduit-on entre λ et t½ ?', options: ['λ·t½ = ln 2, donc t½ = ln 2 / λ', 'λ·t½ = 1/2, donc t½ = 1 / (2λ)', 'λ = t½ / ln 2', 't½ = 2 / λ'], bonne: 0,
        expl: 'e^(−λ·t½) = 1/2 ; on prend le logarithme népérien : −λ·t½ = ln(1/2) = −ln 2, donc t½ = frac(ln 2|λ). La demi-vie ne dépend pas de N₀ : λ est une caractéristique du noyau.', indice: 'Divisez par N₀, puis appliquez ln aux deux membres : ln(e^x) = x et ln(1/2) = −ln 2.' } },
    { id: 'lambda', titre: 'La constante radioactive λ', focus: ['mesures'],
      texte: <>On a établi <em>t</em><sub>½</sub> = {avecIndices('frac(ln 2|λ)')}. Pour l’iode 131, <em>t</em><sub>½</sub> = 8,0{NB}jours.</>,
      tache: { type: 'num', q: 'Constante radioactive λ de l’iode 131', unite: 'j⁻¹', vrai: 0.0866, tol: 0.01, affiche: v => nbf(v, 4), cs: 2,
        calcul: () => ['λ = frac(ln 2|t½) avec ln 2 ≈ 0,693 et t½ = 8,0 j.', 'λ = frac(0,693|8,0) = 0,0866 j⁻¹ (l’unité est l’inverse d’un temps).'],
        pieges: [[0.125, 'Il manque ln 2 : t½ = frac(ln 2|λ), donc λ = frac(ln 2|t½) et pas frac(1|t½).'], [11.54, 'Le rapport est inversé : λ = frac(ln 2|t½).'], [0.0625, 'Le facteur est ln 2 ≈ 0,693, pas 0,5.']],
        expl: 'λ = frac(ln 2|t½) = frac(0,693|8,0) = 0,0866 j⁻¹.', indice: 'λ = frac(ln 2|t½), avec ln 2 ≈ 0,693 ; le résultat est l’inverse d’un temps (ici j⁻¹).' },
      retenirTitre: 'La loi de décroissance et la demi-vie',
      retenir: <>
        <SvgLoi/>
        {FloiN}
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>N(t) = N₀·e<sup>−λt</sup></strong>, solution de dN/dt = −λ·N. <strong>t½ = {avecIndices('frac(ln 2|λ)')}</strong> : λ grand, vie courte. Après n demi-vies : N = {avecIndices('frac(N₀|2ⁿ)')}.</li>
          <li>Exemple de la simulation : 40 → 20 → 10 → 5 millions de noyaux en 8 j, 16 j, 24 j.</li>
          <li><strong>Idée fausse</strong> : « après deux demi-vies, plus rien ». <strong>Vrai</strong> : il reste le quart.</li>
        </ul></> },
    { id: 'nrest', titre: 'Utiliser la loi', focus: ['courbe', 'mesures'],
      texte: <>Avec <em>N</em><sub>0</sub> = 4,0 × 10⁷ noyaux (40 millions) et λ = 0,0866{NB}j⁻¹, on cherche le nombre de noyaux restants au bout de 20{NB}jours. Vous pouvez vérifier la valeur sur le graphique avec le curseur de temps.</>,
      tache: { type: 'num', q: 'Nombre de noyaux restants à t = 20 jours', unite: '× 10⁶ noyaux', vrai: 7.07, tol: 0.03, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['λ·t = 0,0866 × 20 = 1,73 (sans unité : j⁻¹ × j).', 'N = N₀·e^(−λt) = 40 × e^(−1,73) = 40 × 0,177 = 7,1 millions de noyaux (7,07 avec les valeurs non arrondies).'],
        pieges: [[226, 'Le signe de l’exponentielle est faux : N décroît, donc N = N₀·e^(−λt), avec un signe moins.'], [36.7, 'Il manque le facteur t dans l’exponentielle : c’est e^(−λ·t) avec t = 20 j, pas e^(−λ).'], [38.3, 'Ce n’est pas une décroissance linéaire (N₀ − λ·t) : la loi est exponentielle.']],
        expl: 'N = 40 × e^(−0,0866 × 20) ≈ 7,1 millions de noyaux : environ 18 % de N₀ ; cela correspond à 2,5 demi-vies (frac(20|8,0)).', indice: 'Calculez d’abord l’exposant λ·t (sans unité), puis N = N₀·e^(−λt) avec N₀ = 40 millions.' } },
    { id: 'bilan1', titre: 'Le bilan', focus: [],
      texte: <>Vous savez que la désintégration d’un noyau est aléatoire, que le nombre de noyaux restants suit une loi exponentielle et vous savez utiliser la demi-vie et la constante radioactive λ. Le parcours 2 traite l’activité d’un échantillon et sa mesure.</>, tache: null },
    { id: 'lambdas', titre: 'λ en s⁻¹ pour calculer une activité', focus: ['mesures'],
      texte: <>L’<strong>activité</strong> <em>A</em> d’un échantillon est le nombre moyen de désintégrations par <strong>seconde</strong> : on l’exprime en becquerel (1{NB}Bq = 1 désintégration par seconde). Pour la calculer, λ doit donc être en s⁻¹. Rappel : 1{NB}j = 86 400{NB}s et <em>t</em><sub>½</sub> = 8,0{NB}j.</>,
      tache: { type: 'num', q: 'Constante radioactive λ de l’iode 131, en s⁻¹', unite: '× 10⁻⁶ s⁻¹', vrai: 1.00, tol: 0.02, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['t½ = 8,0 × 86 400 = 6,9 × 10⁵ s (691 200 s).', 'λ = frac(ln 2|t½) = frac(0,693|691 200) = 1,0 × 10⁻⁶ s⁻¹.'],
        pieges: [[86600, 'Vous avez laissé λ en j⁻¹ (0,0866) : pour l’avoir en s⁻¹, divisez par 86 400.'], [1.45, 'Il manque ln 2 : λ = frac(ln 2|t½).'], [0.0866, 'Cette valeur est en j⁻¹ (0,0866 j⁻¹) ; ici il faut convertir en s⁻¹ (÷ 86 400), soit 1,0 × 10⁻⁶ s⁻¹.']],
        expl: 'λ = frac(0,0866 j⁻¹|86 400 s·j⁻¹) = 1,0 × 10⁻⁶ s⁻¹.', indice: 'Convertissez d’abord t½ en secondes (× 86 400), puis λ = frac(ln 2|t½).' } },
    { id: 'a0', titre: 'L’activité initiale', focus: ['mesures'],
      texte: <>L’activité vaut <em>A</em> = −d<em>N</em>/d<em>t</em> = λ·<em>N</em>. Avec λ = 1,0 × 10⁻⁶{NB}s⁻¹ et <em>N</em><sub>0</sub> = 4,0 × 10⁷ noyaux :</>,
      tache: { type: 'num', q: 'Activité initiale A₀ de l’échantillon', unite: 'Bq', vrai: 40.1, tol: 0.02, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['A₀ = λ·N₀ = 1,0 × 10⁻⁶ s⁻¹ × 4,0 × 10⁷ = 40 s⁻¹.', 'A₀ = 40 Bq : en moyenne 40 désintégrations par seconde.'],
        pieges: [[3465700, 'Vous avez utilisé λ en j⁻¹ : le résultat est un nombre de désintégrations par jour, pas par seconde. Utilisez λ en s⁻¹.'], [4.0e7, 'Il manque λ : A = λ·N, pas N.']],
        expl: 'A₀ = 1,0 × 10⁻⁶ × 4,0 × 10⁷ = 40 Bq (40,1 avec les valeurs non arrondies).', indice: 'A = λ·N avec λ en s⁻¹ : 1,0 × 10⁻⁶ × 4,0 × 10⁷ (les puissances de 10 s’additionnent).' } },
    { id: 'at', titre: 'L’activité au cours du temps', focus: ['courbe', 'mesures'],
      texte: <>L’activité est proportionnelle à <em>N</em> : <em>A</em>(<em>t</em>) = λ·<em>N</em>(<em>t</em>). À <em>t</em> = 16{NB}jours (deux demi-vies), le nombre de noyaux est <em>N</em> = 1,0 × 10⁷ (10 millions).</>,
      tache: { type: 'num', q: 'Activité de l’échantillon à t = 16 jours', unite: 'Bq', vrai: 10.0, tol: 0.03, affiche: v => nbf(v, 0), cs: 2,
        calcul: () => ['A = λ·N = 1,0 × 10⁻⁶ s⁻¹ × 1,0 × 10⁷ = 10 s⁻¹.', 'A = 10 Bq, soit frac(A₀|4) : deux demi-vies.'],
        pieges: [[20.1, 'Une seule demi-vie divise l’activité par 2 : à 16 j (deux demi-vies), elle est divisée par 4.'], [5.0, 'Trois demi-vies donneraient frac(A₀|8) ; à 16 j il y en a deux.'], [2.5, 'On ne divise pas par le nombre de jours : on utilise A = λ·N, ou frac(A₀|2ⁿ).']],
        expl: 'A = λ·N = 1,0 × 10⁻⁶ × 1,0 × 10⁷ = 10 Bq, soit frac(A₀|2²) : l’activité décroît comme N.', indice: 'A = λ·N avec λ en s⁻¹ et N = 1,0 × 10⁷ ; ou A₀ divisée par 2 à chaque demi-vie.' } },
    { id: 'mesure', titre: 'Mesurer une activité', focus: ['courbe'],
      texte: <>En pratique, un compteur détecte les désintégrations : on compte le nombre <em>n</em> de désintégrations pendant une durée Δ<em>t</em> (ici 10{NB}s) et on calcule <em>A</em> ≈ {avecIndices('frac(n|Δ)')}<em>t</em>. Des mesures faites tous les 2{NB}jours sont tracées en violet. Les points ne sont pas exactement sur la courbe en pointillés.</>,
      tache: { type: 'qcm', q: 'Pourquoi les points mesurés s’écartent-ils de la courbe ?', options: ['le comptage fluctue au hasard autour de sa valeur moyenne', 'la loi de décroissance exponentielle est fausse ici', 'l’échantillon reçoit de nouveaux noyaux au cours du temps'], bonne: 0,
        expl: 'La désintégration est un phénomène aléatoire : le nombre n compté pendant 10 s n’est pas toujours le même, même avec le même échantillon. La courbe donne la valeur moyenne ; les points fluctuent autour d’elle.', indice: 'Rappelez-vous les essais des noyaux : le nombre de noyaux restants était-il toujours le même ?' },
      retenirTitre: 'L’activité',
      retenir: <>
        <SvgActivite/>
        {FactA}
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>A = λ·N</strong> : nombre moyen de désintégrations par seconde, en becquerel (1 Bq = 1 s⁻¹). Elle décroît comme N : <strong>A(t) = A₀·e<sup>−λt</sup></strong>.</li>
          <li>Exemple de la simulation : 40 → 20 → 10 → 5 Bq à 0, 8, 16, 24 jours.</li>
          <li><strong>Idée fausse</strong> : « l’activité, c’est le nombre de noyaux ». <strong>Vrai</strong> : A dépend de N <em>et</em> de λ (pour un même N, un noyau de petite demi-vie est plus actif).</li>
        </ul></> },
    { id: 'compter', titre: 'Réduire les fluctuations', focus: ['courbe', 'mesures'],
      texte: <>Les boutons « Durée de comptage Δ<em>t</em> » (sous le graphique) permettent de compter pendant 1{NB}s, 10{NB}s ou 60{NB}s. Essayez les trois valeurs et regardez l’écart des points avec la courbe. Pour <em>n</em> désintégrations comptées, l’incertitude-type est de l’ordre de √<em>n</em>, soit une incertitude relative de l’ordre de 1/√<em>n</em> (ordre de grandeur donné).</>,
      tache: { type: 'qcm', q: 'Comment diminuer l’écart relatif entre l’activité mesurée et l’activité moyenne ?', options: ['compter plus longtemps : n est plus grand, donc 1/√n est plus petit', 'compter moins longtemps, pour que l’échantillon ait moins de temps de décroître', 'rien n’y fait : la fluctuation relative est toujours la même'], bonne: 0,
        expl: 'Avec A ≈ 40 Bq : Δt = 1 s donne n ≈ 40 (écart relatif ≈ 16 %), Δt = 10 s donne n ≈ 400 (≈ 5 %), Δt = 60 s donne n ≈ 2 400 (≈ 2 %). Il faut cependant que A reste à peu près constante pendant le comptage (Δt petit devant t½).', indice: 'Regardez la dispersion des points pour Δt = 1 s puis pour Δt = 60 s.' } },
    { id: 'bilan2', titre: 'Le bilan', focus: [],
      texte: <>Vous savez calculer l’activité A = λ·N en becquerels, la suivre dans le temps et savez que sa mesure fluctue : on réduit les fluctuations en comptant plus longtemps. Le parcours 3 utilise la décroissance pour dater.</>, tache: null },
    { id: 'datprinc', titre: 'Dater avec un noyau radioactif', focus: ['courbe'],
      texte: <>Un organisme vivant échange du carbone avec son milieu : sa teneur en <strong>carbone 14</strong> (noyau radioactif, <em>t</em><sub>½</sub> = 5 730{NB}ans) reste constante. À sa mort, les échanges cessent et le carbone 14 se désintègre selon la loi vue plus haut. Le graphique montre la fraction de carbone 14 restante depuis la mort (100 % au départ).</>,
      tache: { type: 'qcm', q: 'Quelle mesure permet de dater la mort d’un organisme ?', options: ['la fraction de carbone 14 restante', 'la masse totale de l’échantillon', 'la quantité de carbone 12, qui diminue'], bonne: 0,
        expl: 'La décroissance du carbone 14 sert d’horloge : la fraction restante N/N₀ donne la durée écoulée depuis la mort, à condition de connaître la teneur de départ N₀. Le carbone 12 est stable : sa quantité ne varie pas avec le temps.', indice: 'Quel noyau décroît selon la loi N₀·e^(−λt) ?' },
      retenirTitre: 'Mesurer une activité (comptage)',
      retenir: <>
        <SvgComptage/>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>A ≈ {avecIndices('frac(n|Δt)')}</strong> : n désintégrations comptées pendant Δt. n fluctue : incertitude-type ≈ √n, incertitude relative ≈ <strong>1/√n</strong>.</li>
          <li>Exemple de la simulation (A ≈ 40 Bq) : Δt = 1 s → ± 16 % ; 10 s → ± 5 % ; 60 s → ± 2 %.</li>
          <li>Moyen de s’en souvenir : <strong>« 100 fois plus de comptages, 10 fois moins d’écart relatif »</strong>. Une mesure d’activité s’écrit avec son incertitude.</li>
        </ul></> },
    { id: 'dat3', titre: 'Dater avec les demi-vies', focus: ['courbe', 'mesures'],
      texte: <>Un morceau de bois d’un objet ancien contient <strong>12,5 %</strong> du carbone 14 d’un bois vivant, soit <em>N</em>/<em>N</em><sub>0</sub> = 0,125. Le trait pointillé du graphique indique 12,5 %. On rappelle <em>t</em><sub>½</sub> = 5 730{NB}ans.</>,
      tache: { type: 'num', q: 'Âge du morceau de bois', unite: 'ans', vrai: 17190, tol: 0.02, affiche: v => fmtMilliers(v), cs: 2,
        calcul: () => ['12,5 % = 1/8 = (1/2)³ : trois demi-vies se sont écoulées.', 'Âge = 3 × t½ = 3 × 5 730 = 17 190 ans.'],
        pieges: [[45840, 'On ne multiplie pas t½ par 8 (le rapport N₀/N) : l’âge est n × t½ avec N₀/N = 2ⁿ, donc ici n = 3.'], [11460, 'Deux demi-vies donnent 25 % ; 12,5 % correspond à trois demi-vies.'], [22920, 'Quatre demi-vies donneraient 6,25 % ; 12,5 % correspond à trois demi-vies.']],
        expl: '1/8 = (1/2)³ : trois demi-vies, soit 3 × 5 730 = 17 190 ans.', indice: 'Divisez 100 % par 2 autant de fois qu’il faut pour arriver à 12,5 % et comptez le nombre de divisions.' } },
    { id: 'datln', titre: 'Dater quand ce n’est pas une puissance de 2', focus: ['courbe', 'mesures'],
      texte: <>Un os contient <strong>60 %</strong> du carbone 14 d’un os vivant : <em>N</em>/<em>N</em><sub>0</sub> = 0,60, qui n’est pas une puissance de 1/2. De <em>N</em> = <em>N</em><sub>0</sub>·e<sup>−λ·<em>t</em></sup> on tire {Fage}On donne λ = {avecIndices('frac(ln 2|5 730)')} = 1,21 × 10⁻⁴{NB}an⁻¹.</>,
      tache: { type: 'num', q: 'Âge de l’os', unite: 'ans', vrai: 4223, tol: 0.03, affiche: v => fmtMilliers(v), cs: 2,
        calcul: () => ['ln(N₀/N) = ln(1/0,60) = 0,511.', 't = frac(0,511|1,21 × 10⁻⁴) an⁻¹ = 4,2 × 10³ ans (4 223 ans avec les valeurs non arrondies).'],
        pieges: [[3438, 'La décroissance est exponentielle : l’âge n’est pas proportionnel au pourcentage restant (règle de trois).'], [2927, 'Il manque ln 2 : t = frac(t½ · ln(N₀/N)|ln) 2.'], [1834, 'Utilisez le logarithme népérien ln (touche ln), pas le logarithme décimal log.']],
        expl: 't = frac(ln(1/0,60)|λ) = frac(0,511|1,21 × 10⁻⁴) ≈ 4,2 × 10³ ans : moins d’une demi-vie (5 730 ans), cohérent avec 60 % > 50 %.', indice: 't = frac(ln(N₀/N)|λ) avec N₀/N = 1/0,60 ≈ 1,67 ; le résultat est en années car λ est en an⁻¹.' } },
    { id: 'limites', titre: 'Un résultat de datation et son incertitude', focus: [],
      texte: <>Un laboratoire annonce « 4 200{NB}ans ± 150{NB}ans » pour l’os précédent. La datation suppose que la teneur initiale en carbone 14 était la même que celle d’un organisme vivant actuel et qu’aucun échange n’a eu lieu après la mort.</>,
      tache: { type: 'qcm', q: 'D’où vient en partie l’incertitude de ± 150 ans ?', options: ['du comptage aléatoire et de la teneur initiale incertaine', 'de la demi-vie du carbone 14, qui augmente avec le temps', 'du fait qu’un âge ne peut pas se calculer avec une exponentielle'], bonne: 0,
        expl: 'Le carbone 14 restant est faible et se mesure par comptage : par hasard, n fluctue (incertitude relative ≈ 1/√n). La teneur initiale supposée constante est aussi connue avec une incertitude. La demi-vie, elle, ne change pas.', indice: 'Pensez aux fluctuations de comptage vues plus haut, et à l’hypothèse sur la teneur initiale.' },
      retenirTitre: 'La datation',
      retenir: <>
        <SvgDatation/>
        {FageT}
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Principe</strong> : un organisme vivant renouvelle son carbone 14 ; après la mort, N décroît. Mesurer N/N₀ donne la durée écoulée : <strong>t = ({avecIndices('frac(t½|ln)')} 2) · ln(N₀/N)</strong>.</li>
          <li>Exemple de la simulation : 50 % ↔ 1 t½, 25 % ↔ 2 t½, 12,5 % ↔ 3 t½ ; pour 60 %, moins d’une demi-vie.</li>
          <li><strong>Hypothèses</strong> : teneur initiale connue, pas d’échange après la mort. Un âge s’annonce avec son incertitude.</li>
        </ul></> },
    { id: 'bravo', titre: 'Le bilan', focus: [],
      texte: <>Vous savez établir la loi de décroissance radioactive, l’exploiter sur une courbe (demi-vie, constante λ, activité), évaluer une incertitude de comptage et dater un événement avec un noyau radioactif. Passez à l’exploration (autres demi-vies, autres échantillons, mesures bruitées, datation) ou tentez les deux défis.</>, tache: null },
  ];
  const ETAPES = IDS.map(id => TOUTES.find(e => e.id === id));
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};

  // ════════════════ DÉFIS ════════════════
  const donneesDefi = type => {
    const graine = nouvelleGraine();
    if (type === 'th') {
      const thD = tire([3, 4, 5, 6, 8, 10]), l = Math.LN2 / thD / M.JOUR_S, N0D = Math.round(60 / l / 1e5) * 1e5;
      return { type, th: thD, N0: N0D, graine };
    }
    const f = tire([85, 75, 65, 55, 45, 35, 22]);
    return { type, f, graine };
  };
  const nouveauDefi = type => { setDefi({ ...donneesDefi(type), type, reps: {}, verifie: false }); setTi(s => ({ ...s, ...PRESET, graines: [], t: 0, age: 0 })); };
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
    if (md === 'guide') setTi(PRESET);
    if (md === 'explore') setTi(s => ({ ...s, ctx: 'ech' }));
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const vraiDefi = defi ? (defi.type === 'th' ? defi.th : M.ageDepuisFraction(TH_AGE, defi.f / 100)) : null;
  const tolDefi = defi && defi.type === 'th' ? 0.10 : 0.06;
  const verifier = () => {
    const x = lireNombre(defi.reps.v), ok = isFinite(x) && proche(x, vraiDefi, tolDefi);
    setDefi(d => ({ ...d, verifie: true, ok })); (defi.type === 'th' ? noterT : noterA)(ok);
  };
  const champ = (label, unite, largeur = 100) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8, fontSize: 14 }}>
      <span>{label}</span>
      <input value={defi.reps.v ?? ''} aria-label={`${label} ${unite}`} onKeyDown={e => e.key === 'Enter' && document.getElementById('ra-verif')?.click()} onChange={e => setDefi(d => ({ ...d, reps: { ...d.reps, v: e.target.value }, verifie: false }))} inputMode="decimal"
        style={{ width: largeur, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['th', 'Demi-vie d’après les mesures'], ['age', 'Âge d’un échantillon']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'th' ? 'Défi : quelle est la demi-vie de ce noyau ?' : 'Défi : quel est l’âge de cet échantillon ?'}</div>
      {defi.type === 'th' ? <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>Un compteur mesure l’activité d’un échantillon d’un noyau radioactif inconnu : <strong>comptage de 60{NB}s</strong> à intervalles réguliers (points violets ; lisez les instants sur l’axe). Les points fluctuent, car les désintégrations sont aléatoires. Utilisez le curseur et les « Traits de demi-vie » pour estimer la demi-vie du noyau, en jours (2{NB}chiffres significatifs ; marge acceptée : ± 10{NB}%).</div>
        {champ('Demi-vie t½', 'jours', 90)}
        <IndiceDefi cache={false}>La demi-vie est la durée au bout de laquelle l’activité est divisée par 2 : repérez l’activité initiale A₀ (premier point), cherchez l’instant où l’activité mesurée vaut A₀/2 (le bouton « Traits de demi-vie » trace des repères), puis lisez t½. Ou : λ = {avecIndices('frac(ln 2|t)')}½ et A = A₀·e<sup>−λt</sup>.</IndiceDefi>
      </> : <>
        <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>Un échantillon organique contient <strong>{defi.f}{NB}%</strong> du carbone 14 d’un échantillon vivant (<em>t</em><sub>½</sub> = 5 730{NB}ans). Calculez son âge, en années (2{NB}chiffres significatifs ; marge acceptée : ± 6{NB}%). Le trait rouge du graphique marque {defi.f}{NB}%.</div>
        {champ('Âge', 'ans', 100)}
        <IndiceDefi cache={false}>Pour N/N₀ = {defi.f / 100} : <em>t</em> = ({avecIndices('frac(t_½|ln 2)')}) × ln(<em>N</em><sub>0</sub>/<em>N</em>) = (5 {avecIndices('frac(730|ln 2)')}) × ln(1/{nbf(defi.f / 100, 2)}), avec ln (touche ln de la calculatrice), pas log. Vérifiez : l’âge doit être inférieur à 5 730 ans si N/N₀ dépasse 50 %.</IndiceDefi>
      </>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="ra-verif" onClick={verifier} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>
        {defi.ok ? `✓ Correct. Valeur du modèle : ${defi.type === 'th' ? `${nbf(vraiDefi, 1)} jours` : `${fmtMilliers(vraiDefi)} ans`} (marge acceptée : ± ${defi.type === 'th' ? 10 : 6} %).`
          : defi.type === 'th' ? '✗ Vérifiez : t½ est la durée pour que l’activité soit divisée par 2 (de A₀ à A₀/2), en jours ; les points fluctuent, appuyez-vous sur la tendance.'
            : '✗ Vérifiez : t = (t½ / ln 2) × ln(N₀/N), avec ln (népérien) ; pour plus de 50 % restant, l’âge est inférieur à 5 730 ans.'}
      </div>}
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Nature aléatoire de la désintégration</strong> : on ne peut prévoir ni quel noyau se désintègre ni quand. Chaque noyau a la même probabilité λ·dt de se désintégrer pendant dt, <strong>quel que soit son âge</strong> : les noyaux sont identiques, indépendants et sans « vieillissement ». Le simulateur tire au hasard l’instant de désintégration de chaque noyau (loi exponentielle de paramètre λ).</li>
      <li><strong>Grands nombres</strong> : la loi N(t) = N₀·e<sup>−λt</sup> décrit la <strong>valeur moyenne</strong> du nombre de noyaux. Pour un petit échantillon, le nombre réel fluctue autour d’elle (écart typique √(N₀/4) à t½ : environ 5 pour 100 noyaux, 50 pour 10 000 : ordre de grandeur donné, non exigible). L’écart relatif devient négligeable pour les échantillons usuels (10⁷ noyaux et plus).</li>
      <li><strong>Activité d’un échantillon</strong> : nombre <em>moyen</em> de désintégrations par seconde, A = −dN/dt = λ·N, en becquerel ; elle ne dit rien de l’énergie ni de la nature du rayonnement émis. Elle décroît comme N : A(t) = A₀·e<sup>−λt</sup>.</li>
      <li><strong>Demi-vie constante</strong> : t½ = {avecIndices('frac(ln 2|λ)')} ne dépend ni de N, ni de la température, ni de l’état chimique. Valeurs retenues : iode 131, t½ = 8,0 jours (valeur arrondie) ; carbone 14, t½ = 5 730 ans (valeur usuelle). N₀ = 4,0 × 10⁷ noyaux est un choix de la simulation (activité faible, de l’ordre de quelques dizaines de becquerels), pas une donnée d’un échantillon réel.</li>
      <li><strong>Limites du modèle</strong> : un seul type de noyau radioactif ; les noyaux fils sont supposés stables (pas de désintégrations en chaîne) ; la loi vaut tant que N est grand ; au-delà d’une dizaine de demi-vies, l’activité devient trop faible devant le bruit de fond d’un vrai compteur.</li>
      <li><strong>Incertitudes de mesure de l’activité</strong> : compteur idéal (il détecte toutes les désintégrations, sans bruit de fond ni temps mort). Le nombre n compté pendant Δt est aléatoire (loi de Poisson : écart-type √n, incertitude relative 1/√n) ; l’activité est supposée constante pendant Δt (Δt ≪ t½). La lecture d’une demi-vie sur un graphique ajoute sa propre incertitude (± 10 % acceptés dans le défi).</li>
      <li><strong>Datation</strong> : teneur initiale en carbone 14 supposée connue et constante, aucun échange avec l’extérieur après la mort ; en pratique, la teneur varie au cours du temps (étalonnage nécessaire) et la méthode ne s’applique qu’à quelques dizaines de milliers d’années au plus, car il reste trop peu de carbone 14 ensuite.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const NOMS_PARC = ['1. La loi de décroissance radioactive', '2. L’activité et sa mesure', '3. Dater avec un noyau radioactif'];
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {parc < 3 && <button onClick={() => setParc(parc + 1)} style={styleBouton(true, ORANGE_GUIDE)}>Parcours {parc + 1} : {NOMS_PARC[parc].slice(3).toLowerCase()}</button>}
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène : les noyaux ----------
  const montrerEssais = (enGuide && deja('repetes')) || enExplore;
  const montrerChoixN = (enGuide && deja('grands')) || enExplore;
  const sceneOuverte = ti.scene === undefined ? !(enGuide && deja('equation')) : ti.scene;
  const memes = essais.filter(e => e.n === nS), pcts = memes.map(e => 100 * e.k / e.n);
  const synthese = enExplore && memes.length > 0 && (
    <div role="status" style={{ marginTop: 10, fontSize: 14, color: KIT.txt, lineHeight: 1.55, background: '#f1f5f9', borderRadius: 8, padding: '8px 10px' }}>
      <strong>{fmtMilliers(restS)} noyaux restants sur {fmtMilliers(nS)}</strong> ({pctTxt(restS, nS)}). La loi prévoit la moitié : 50{NB}%.
      {memes.length > 1 && <> Sur les {memes.length} essais avec {fmtMilliers(nS)} noyaux, le résultat varie de <strong>{nbf(Math.min(...pcts), nS >= 10000 ? 2 : 0)}{NB}%</strong> à <strong>{nbf(Math.max(...pcts), nS >= 10000 ? 2 : 0)}{NB}%</strong>.</>}
    </div>);
  const tableEssais = enGuide && montrerEssais && essais.length > 0 && (
    <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', marginTop: 8 }}>
      <thead><tr style={{ textAlign: 'left', color: KIT.txt2 }}><th style={{ padding: '2px 4px' }}>Essai</th><th style={{ padding: '2px 4px' }}>Noyaux</th><th style={{ padding: '2px 4px' }}>Restants</th>{(enGuide ? deja('grands') : true) && <th style={{ padding: '2px 4px' }}>Pourcentage</th>}</tr></thead>
      <tbody>{essais.map((e, i) => (
        <tr key={e.g} style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ padding: '2px 4px' }}>{i + 1}</td><td style={{ padding: '2px 4px' }}>{fmtMilliers(e.n)}</td>
          <td style={{ padding: '2px 4px', fontFamily: 'monospace', fontWeight: 700 }}>{fmtMilliers(e.k)}</td>{(enGuide ? deja('grands') : true) && <td style={{ padding: '2px 4px', fontFamily: 'monospace' }}>{pctTxt(e.k, e.n)}</td>}</tr>))}</tbody>
    </table>);
  const controlesScene = (
    <div style={{ marginTop: 8 }}>
      {enGuide && idE === 'essai' && <button onClick={() => setT({ tn: 8, nSc: 100, graines: [{ g: nouvelleGraine(), n: 100, t: 8 }] })} style={styleBouton(true, '#b45309')}>Laisser passer 8 jours</button>}
      {((enGuide && deja('repetes')) || enExplore) && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => nouvelEssai()} style={styleBouton(true, '#b45309')}><Pic n="refresh"/>Nouvel essai</button>
        {montrerChoixN && <span role="group" aria-label="Nombre de noyaux" style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
          {[100, 10000, 1000000].map(n => <button key={n} onClick={() => setT({ nSc: n, graines: [...ti.graines.slice(-5), { g: nouvelleGraine(), n, t: tnEff }] })} aria-pressed={ti.nSc === n} style={stylePetitBouton(ti.nSc === n, '#475569')}>{fmtMilliers(n)}{NB}noyaux</button>)}</span>}
      </div>}
    </div>);
  const sceneBox = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <Section titre={enExplore ? 'Le hasard et la loi : que reste-t-il après une demi-vie ?' : `Un petit échantillon : ${fmtMilliers(nS)} noyaux d’iode 131`} ouvert={sceneOuverte} onBascule={() => setT({ scene: !sceneOuverte })}>
        {enExplore && <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 6, lineHeight: 1.5 }}>Choisissez un nombre de noyaux puis cliquez sur « Nouvel essai » : on laisse passer <strong>une demi-vie ({nbf(thS, 1)}{NB}jours)</strong> et on compte les noyaux restants. Chaque essai donne un résultat un peu différent, d’autant moins que les noyaux sont nombreux.</div>}
        <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 }}>{nS === 100 ? 'Rond gris : noyau intact ; rond orange barré : noyau désintégré.' : 'Chaque essai tire au hasard le sort des noyaux ; la barre montre la proportion de noyaux intacts.'} Demi-vie : {nbf(thS, 1)}{NB}jours.</div>
        <Noyaux n={nS} restants={restS} inst={inst} tn={tnS}/>
        {controlesScene}
        {tableEssais}
        {synthese}
      </Section>
    </div>);

  // ---------- graphique et contrôles ----------
  const montrerCourbe = (enGuide && deja('solution')) || enExplore || !!dd;
  const modeleVisible = !(dd && dd.type === 'th');
  const pasT = ctx === 'dat' ? 10 : 0.5;
  const afficherA = ctx === 'ech' && (dd ? dd.type === 'th' : enGuide ? apres('at') : enExplore);
  const ptCur = pts ? pts[iPt] : null;
  const controlesCourbe = (
    <div style={{ marginTop: 8 }}>
      <Curseur nom={ctx === 'dat' ? 'Temps écoulé depuis la mort' : 'Temps t'} valeur={tc} onChange={v => (ctx === 'dat' ? setT({ age: Math.max(0, Math.min(tmax, Math.round(v / pasT) * pasT)) }) : setT({ t: Math.max(0, Math.min(tmax, Math.round(v / pasT) * pasT)) }))} min={0} max={tmax} pas={pasT} unite={ctx === 'dat' ? 'ans' : 'j'} decimales={ctx === 'dat' ? 0 : 1} couleur="#b45309"/>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {enExplore && ctx === 'ech' && <button onClick={() => setT({ tang: !ti.tang })} aria-pressed={ti.tang} style={stylePetitBouton(ti.tang, '#b45309')}>{ti.tang ? 'Masquer la tangente' : 'Tracer la tangente'}</button>}
        {(enExplore || (dd && dd.type === 'th')) && <button onClick={() => setT({ niv: !ti.niv })} aria-pressed={ti.niv} style={stylePetitBouton(ti.niv, '#475569')}>Traits de demi-vie</button>}
        {enExplore && ctx === 'ech' && <button onClick={() => setT({ bruit: !ti.bruit })} aria-pressed={ti.bruit} style={stylePetitBouton(ti.bruit, '#6d28d9')}>{ti.bruit ? 'Mesures d’activité affichées' : 'Afficher des mesures d’activité'}</button>}
        {((enGuide && deja('mesure')) || (enExplore && ti.bruit)) && ctx === 'ech' && <button onClick={() => setT({ grB: nouvelleGraine() })} style={stylePetitBouton(false, '#475569')}><Pic n="refresh"/>Nouvelle série</button>}
      </div>
      {((enGuide && deja('compter') && ctx === 'ech') || (enExplore && ti.bruit)) && <div role="group" aria-label="Durée de comptage" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
        <span style={{ flexBasis: '100%', fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>Un compteur ne voit pas l’activité d’un coup : il <strong>compte les désintégrations pendant une durée Δt</strong>, puis calcule A ≈ {avecIndices('frac(n|Δt)')}. Essayez 1 s, 10 s ou 60 s : plus on compte longtemps, moins les points violets s’écartent de la courbe.</span>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Durée de comptage Δt</span>
        {[1, 10, 60].map(d => <button key={d} onClick={() => setT({ dtS: d })} aria-pressed={ti.dtS === d} style={stylePetitBouton(ti.dtS === d, COL.violet)}>{d} s</button>)}
      </div>}
    </div>);
  const graphique = montrerCourbe && (
    <div style={{ ...styleBoite, ...cadre('courbe') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{ctx === 'dat' ? 'Carbone 14 restant depuis la mort' : dd ? 'Activité mesurée de l’échantillon' : 'Noyaux restants N(t)' + (afficherA ? ' et activité A(t)' : '')}</div>
      <CourbeN P={P} th={th} ctx={ctx} tmax={tmax} t={tc} pts={pts} afficherA={afficherA} niv={niv} tang={enExplore && ti.tang && ctx === 'ech' ? true : false} modele={modeleVisible} masque={!!(dd && dd.type === 'th')} ligneF={dd && dd.type === 'age' ? dd.f : enGuide && idE === 'dat3' ? 12.5 : enGuide && idE === 'datln' ? 60 : null}/>
      {controlesCourbe}
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6 }}>{pts ? `Points violets : activité mesurée (comptage de ${dtS} s), échelle de droite en becquerel. ` : ''}{modeleVisible ? 'Le point orange suit le curseur de temps.' : 'Le trait vertical orange suit le curseur de temps.'}{ctx === 'dat' && dd == null ? ' 100 % : teneur d’un organisme vivant.' : ''}</div>
    </div>);

  // ---------- mesures ----------
  const lam = M.lambda(P);
  const mesures = (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mesures</div>
      {(!dd) && ctx === 'ech' && (enGuide && deja('essai') && ti.graines.length > 0) && <LigneMesure nom={`Noyaux restants (essai de ${fmtMilliers(nS)})`} valeur={`${fmtMilliers(restS)} sur ${fmtMilliers(nS)}`} couleur="#475569"/>}
      {montrerCourbe && <LigneMesure nom={ctx === 'dat' ? 'Temps écoulé' : 'Temps t'} valeur={`${ctx === 'dat' ? fmtMilliers(tc) : nbf(tc, 1)}${NB}${ctx === 'dat' ? 'ans' : 'j'}`}/>}
      {montrerCourbe && !(dd && dd.type === 'th') && ctx === 'ech' && !(enGuide && idE === 'nrest') && <LigneMesure nom="Noyaux restants N" valeur={`${nbf(Nlu / 1e6, 1)}${NB}millions`} couleur="#b45309"/>}
      {montrerCourbe && !(dd && dd.type === 'th') && !(enGuide && idE === 'nrest') && <LigneMesure nom={ctx === 'dat' ? 'Carbone 14 restant' : 'Fraction N / N₀'} valeur={`${nbf(100 * fracLu, ctx === 'dat' ? 1 : 1)}${NB}%`}/>}
      {!dd && ctx === 'ech' && ((enGuide && apres('lambda')) || enExplore) && <LigneMesure nom="Constante radioactive λ" valeur={`${nbf(lam, 4)}${NB}j⁻¹`} couleur="#15803d"/>}
      {!dd && ctx === 'ech' && ((enGuide && apres('at')) || enExplore) && <LigneMesure nom="Activité A = λ·N" valeur={`${nbf(M.activite(P, tc), M.activite(P, tc) < 10 ? 1 : 0)}${NB}Bq`} couleur={COL.violet}/>}
      {ptCur && ctx === 'ech' && ((enGuide && deja('mesure')) || enExplore || dd) && <>
        <LigneMesure nom={`Activité mesurée (Δt = ${dtS} s)`} valeur={`${nbf(ptCur.am, ptCur.am < 10 ? 1 : 0)}${NB}Bq`} couleur={COL.violet}/>
        {!(dd) && <LigneMesure nom="n compté ; incertitude relative ≈ 1/√n" valeur={`${fmtMilliers(ptCur.n)} ; ${ptCur.n > 0 ? nbf(100 * M.incertitudeRelative(ptCur.n), 1) : '—'}${NB}%`}/>}</>}
      {enExplore && ctx === 'ech' && <LigneMesure nom="Demi-vie t½ = ln 2 / λ" valeur={`${nbf(th, 1)}${NB}j`}/>}
      {enExplore && ctx === 'ech' && <LigneMesure nom="Activité initiale A₀" valeur={`${nbf(M.activite(P, 0), 1)}${NB}Bq`}/>}
    </div>);

  // ---------- exploration ----------
  const reglages = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>Réglages de l’expérience</div>
      <div role="group" aria-label="Situation" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['ech', 'Échantillon : noyaux et activité'], ['dat', 'Datation au carbone 14']].map(([k, l]) => <button key={k} onClick={() => setT({ ctx: k })} aria-pressed={ti.ctx === k} style={stylePetitBouton(ti.ctx === k, '#0f766e')}>{l}</button>)}
      </div>
      {ti.ctx === 'ech' ? <>
        <div role="group" aria-label="Demi-vie" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Demi-vie</span>
          {M.TH_OPTIONS.map(v => <button key={v} onClick={() => setT({ th: v, t: Math.min(ti.t, 5 * v), graines: [] })} aria-pressed={ti.th === v} style={stylePetitBouton(ti.th === v, '#475569')}>{v},0 j{v === 8 ? ' (iode 131)' : ''}</button>)}
        </div>
        <div role="group" aria-label="Nombre de noyaux au départ" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2 }}>Noyaux au départ</span>
          {M.N0_OPTIONS.map(v => <button key={v} onClick={() => setT({ N0: v })} aria-pressed={ti.N0 === v} style={stylePetitBouton(ti.N0 === v, '#475569')}>{fmtMilliers(v / 1e6)} millions</button>)}
        </div>
      </> : <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Carbone 14 : demi-vie 5 730 ans. Déplacez le curseur pour lire la fraction restante, ou activez « Traits de demi-vie ».</div>}
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Doublez le nombre de noyaux au départ, sans changer la demi-vie. Que deviennent l’activité initiale A₀ et la demi-vie ?</li>
        <li>Passez la demi-vie de 8 à 2 jours : comment varient λ, la pente de la courbe et l’activité initiale pour le même nombre de noyaux ?</li>
        <li>Dans « Le hasard et la loi », faites plusieurs essais avec 100, 10 000 puis 1 000 000 noyaux : le résultat est-il toujours le même ? Autour de quelle valeur varie-t-il ?</li>
        <li>Affichez des mesures d’activité et comparez Δt = 1 s et Δt = 60 s : à partir de quel instant les points s’écartent-ils le plus de la courbe ? Pourquoi ?</li>
        <li>Datation : à quelle fraction de carbone 14 correspond un âge de 10 000 ans ? Vérifiez avec la formule.</li>
      </ul>
    </div>);
  const retenirExplore = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>un noyau : désintégration aléatoire ; un grand nombre de noyaux : loi dN/dt = −λ·N, soit N(t) = N₀·e<sup>−λt</sup></li>
        <li>demi-vie : t½ = {avecIndices('frac(ln 2|λ)')} ; après n demi-vies, N = N₀ / 2ⁿ</li>
        <li>activité : A = −dN/dt = λ·N, en becquerel ; A(t) = A₀·e<sup>−λt</sup></li>
        <li>comptage : A ≈ {avecIndices('frac(n|Δt)')}, incertitude relative ≈ 1/√n</li>
        <li>datation : t = (t½ / ln 2)·ln(N₀/N), teneur initiale supposée connue</li>
      </ul>
    </ARetenir>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .ra-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .ra-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .ra-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (min-width: 901px) { .ra-l1.cote .ra-carte { order: 2; } .ra-l1.cote .ra-main { order: 1; } }
        @media (max-width: 900px) { .ra-l1.cote { grid-template-columns: minmax(0, 1fr); } }
        @media (prefers-reduced-motion: no-preference) { .ra-in { animation: ra-fondu 0.35s ease-out; } @keyframes ra-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Radioactivité : décroissance, demi-vie et activité</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Une désintégration est <strong>aléatoire</strong>, mais pour un grand nombre de noyaux le nombre de noyaux restants suit une <strong>loi de décroissance</strong> : on en tire la <strong>demi-vie</strong>, l’<strong>activité</strong> et un principe de <strong>datation</strong>.</div>
      <div className={`ra-l1${!enExplore ? ' cote' : ''}`}>
        {enGuide ? <div className="ra-carte">
          <div role="group" aria-label="Choix du parcours" style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8, fontSize: 13.5 }}>
            <span style={{ color: KIT.txt2 }}>Parcours :</span>
            {NOMS_PARC.map((l, i) => <button key={i} onClick={() => setParc(i + 1)} aria-pressed={parc === i + 1} style={{ ...styleBouton(parc === i + 1, ORANGE_GUIDE), fontSize: 13 }}>{l}</button>)}
          </div>
          <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="ra-carte">{panneauHypo}</div> : null}
        <div className="ra-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'th' ? suiviT : suiviA}/></div>}
          {!dd && !enExplore && ctx === 'ech' && <div className="ra-in" style={{ marginBottom: 12 }}>{sceneBox}</div>}
          <div className="ra-l2">
            {graphique && <div className="ra-in">{graphique}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(enExplore || dd || (enGuide && deja('essai'))) && <div className="ra-in">{mesures}</div>}
              {enExplore && reglages}
            </div>
          </div>
        </div>
      </div>
      {enExplore && ctx === 'ech' && <div style={{ marginBottom: 12 }}>{sceneBox}</div>}
      {enExplore && <div className="ra-l2">{aEssayer}{retenirExplore}</div>}
      {!enDefi && (!enGuide || deja('bravo')) && <div className="ra-l2">{panneauHypo}</div>}
    </div>
  );
}
