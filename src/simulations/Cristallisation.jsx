import { useState, useEffect, useRef, useMemo } from "react";
import { TabBtn, cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, avecIndices, fmt, lireNombre, proche } from "../commun";

// ============================================================
//  SIMULATION 7 — Cristallisation de KNO₃
// ============================================================

// ── Modèle (fonctions pures) ──
// Solubilité de KNO₃ dans l'eau (g de sel pour 100 g d'eau), valeurs tabulées tous les 10 °C.
// Hypothèse : entre deux valeurs, interpolation linéaire.
const SOLUB = [[0, 13.3], [10, 20.9], [20, 31.6], [30, 45.8], [40, 63.9], [50, 85.5], [60, 110.0],
  [70, 138.0], [80, 169.0], [90, 202.0], [100, 246.0]];
const solubilite = temp => {
  const t = Math.max(0, Math.min(100, temp));
  for (let i = 0; i < SOLUB.length - 1; i++) {
    const [t1, s1] = SOLUB[i], [t2, s2] = SOLUB[i + 1];
    if (t >= t1 && t <= t2) return s1 + (s2 - s1) * (t - t1) / (t2 - t1);
  }
  return SOLUB[SOLUB.length - 1][1];
};
// Température à laquelle la solubilité vaut s (g / 100 g d'eau) : inverse de l'interpolation linéaire
const tempDeSolub = s => {
  for (let i = 0; i < SOLUB.length - 1; i++) {
    const [t1, s1] = SOLUB[i], [t2, s2] = SOLUB[i + 1];
    if (s >= s1 && s <= s2) return t1 + (t2 - t1) * (s - s1) / (s2 - s1);
  }
  return NaN;
};

export function Simulation7({ plotlyReady }) {
  const [mode, setMode]         = useState("explore");              // on arrive sur l'exploration libre
  const [guide, setGuide]       = useEtatPersistant('crist-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi]         = useState(null);
  const [hypoOuv, setHypoOuv]   = useState(false);
  const [typeCr, setTypeCr]     = useState("refroidissement");
  const [T, setT]               = useState(60);
  const [mEau, setMEau]         = useState(100);
  const [mSolute, setMSolute]   = useState(50);
  const [animPos, setAnimPos] = useState(() =>
    Array.from({length: 20}, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random()-0.5)*0.02,
      vy: (Math.random()-0.5)*0.02,
    }))
  );

  const plotRef = useRef(null);
  const enGuide = mode === 'guide';

  // ── Calculs ──
  // mSolute : masse de KNO₃ pour 100 g d'eau au départ. En refroidissement, la masse d'eau reste 100 g ;
  // en évaporation, la température est fixe et la masse d'eau diminue jusqu'à mEau.
  const mEauEff    = typeCr === "evaporation" ? mEau : 100;
  const sT         = solubilite(T);
  const mDissoute  = Math.min(mSolute, sT * mEauEff / 100);
  const mCristaux  = Math.max(0, mSolute - mDissoute);
  const conc       = mEauEff > 0 ? mDissoute / mEauEff * 100 : 0;
  const sature     = mCristaux > 1e-9;
  const fracDiss   = mSolute > 0 ? mDissoute / mSolute : 1;

  // Points du diagramme (T ; g de KNO₃ pour 100 g d'eau) : composition globale, et solution liquide
  const yGlobal = mEauEff > 0 ? mSolute / mEauEff * 100 : 0;
  const yLiquide = sature ? sT : yGlobal;

  // ── Plotly diagramme solubilité ──
  useEffect(() => {
    if (!window.Plotly || !plotRef.current || !plotlyReady) return;

    const Ts = Array.from({length:101}, (_,i) => i);
    const Ss = Ts.map(solubilite);
    const fillX = [...Ts, ...Ts.slice().reverse()];
    const fillY = [...Ss, ...Array(101).fill(0)];
    const yMax = Math.max(260, Math.ceil(yGlobal * 1.1 / 20) * 20);

    const data = [
      // Zone sous la courbe : solution insaturée
      {x:fillX, y:fillY, fill:'toself', fillcolor:'rgba(144,213,255,0.15)',
       line:{width:0}, showlegend:false, hoverinfo:'none'},
      // Courbe de solubilité
      {x:Ts, y:Ss, mode:'lines', line:{color:'#0096c7', width:2.5},
       name:'Solubilité de KNO₃', hovertemplate:'T = %{x} °C<br>solubilité = %{y:.1f} g / 100 g d’eau<extra></extra>'},
      // Trajectoire du point : à masse de soluté fixée, la composition globale est sur une horizontale
      ...(typeCr === 'refroidissement' ? [{x:[0,100], y:[yGlobal,yGlobal], mode:'lines',
        line:{color:'rgba(233,168,36,0.5)', width:1, dash:'dash'}, showlegend:false, hoverinfo:'skip'}] : []),
      // Composition globale du système
      {x:[T], y:[yGlobal], mode:'markers',
       marker:{color: sature ? '#e63946' : '#2a9d8f', size:14, symbol:'diamond', line:{color:'white', width:2}},
       name:'Composition globale (sel total pour 100 g d’eau)',
       hovertemplate:'T = %{x} °C<br>sel total = %{y:.1f} g / 100 g d’eau<extra></extra>'},
    ];
    // Si des cristaux sont présents, la solution est saturée : son point est sur la courbe
    if (sature) data.push({x:[T], y:[sT], mode:'markers',
      marker:{color:'#0096c7', size:10, symbol:'circle', line:{color:'white', width:2}},
      name:'Solution saturée (liquide)', hoverinfo:'skip'});

    const annotations = [
      {x:80, y:50, text:'Solution insaturée', showarrow:false, font:{size:12, color:'#0096c7'}, opacity:0.7},
      {x:22, y:Math.min(190, yMax*0.7), text:'Solution saturée<br>+ cristaux', showarrow:false, font:{size:12, color:'#e63946'}, opacity:0.7},
    ];
    const shapes = [
      {type:'line', x0:T, x1:T, y0:0, y1:yMax, line:{dash:'dot', color:'#888', width:1}},
    ];
    if (sature) shapes.push({type:'line', x0:T, x1:T, y0:sT, y1:yGlobal, line:{color:'#e63946', width:3}});

    window.Plotly.react(plotRef.current, data, {
      xaxis:{title:'Température (°C)', range:[0,100], dtick:10, gridcolor:'rgba(0,0,0,0.08)', zeroline:false,
        showspikes:true, spikemode:'across', spikesnap:'cursor', spikethickness:1, spikedash:'dot', spikecolor:'#64748b'},
      yaxis:{title:'g de KNO₃ pour 100 g d’eau', range:[0,yMax], dtick: yMax > 400 ? 50 : 20, gridcolor:'rgba(0,0,0,0.08)', zeroline:false,
        showspikes:true, spikemode:'across', spikesnap:'cursor', spikethickness:1, spikedash:'dot', spikecolor:'#64748b'},
      margin:{t:20, b:50, l:70, r:20},
      paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'#fafcff',
      legend:{orientation:'h', y:-0.25},
      annotations, shapes, autosize:true, hovermode:'closest',
    }, {displayModeBar:false, responsive:true});
  }, [plotlyReady, mode, T, mEau, mSolute, typeCr]); // eslint-disable-line

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimPos(prev => prev.map(p => {
        let nx = p.x + p.vx;
        let ny = p.y + p.vy;
        let nvx = p.vx + (Math.random()-0.5)*0.005;
        let nvy = p.vy + (Math.random()-0.5)*0.005;
        // Rebond sur les bords
        if (nx < 0 || nx > 1) { nvx = -nvx; nx = Math.max(0, Math.min(1, nx)); }
        if (ny < 0 || ny > 1) { nvy = -nvy; ny = Math.max(0, Math.min(1, ny)); }
        // Limiter la vitesse
        nvx = Math.max(-0.03, Math.min(0.03, nvx));
        nvy = Math.max(-0.03, Math.min(0.03, nvy));
        return { x:nx, y:ny, vx:nvx, vy:nvy };
      }));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // ── Animation bécher ──
  const maxParticules = 20;
  const nDissous   = Math.round(fracDiss * maxParticules);
  const nCristaux  = maxParticules - nDissous;

  const particulesPos = useMemo(() => Array.from({length: maxParticules}, (_, i) => ({
    x: 20 + Math.random() * 110, y: 20 + Math.random() * 120, id: i })), []);
  const cristauxPos = useMemo(() => Array.from({length: maxParticules}, (_, i) => ({
    x: 15 + (i % 10) * 14, y: 155 - Math.floor(i/10) * 14, id: i })), []);

  const solColor = `rgba(0, 150, 200, ${0.1 + fracDiss*0.4})`;

  const fieldStyle = {display:"flex", flexDirection:"column", gap:2};
  const labelStyle = {fontSize:12, color:"#666"};
  const inputStyle = {width:90, padding:"3px 6px", borderRadius:4,
    border:"1px solid #ccc", fontSize:13};

  // ════════════════ PARCOURS GUIDÉ ════════════════
  const etape = guide.etape;
  const ref = { m: 100 };                                         // scénario de refroidissement : 100 g de KNO₃ dans 100 g d'eau
  const s80 = solubilite(80), s40 = solubilite(40), s20 = solubilite(20);
  const tSat100 = tempDeSolub(ref.m);                             // ≈ 55,9 °C
  const c40 = ref.m - s40, c20 = ref.m - s20;
  const sEv = solubilite(60), eauSat = 50 / sEv * 100, cEv20 = 50 - sEv * 20 / 100;   // évaporation : 50 g de KNO₃, 60 °C
  const modeRef = typeCr === 'refroidissement' && mSolute === ref.m;
  const modeEv = typeCr === 'evaporation' && T === 60 && mSolute === 50;
  const ETAPES = [
    { id: 'objectif', titre: 'Que cherche-t-on ?', focus: [],
      texte: <>Pour obtenir du nitrate de potassium KNO₃ solide à partir d'une solution, on le fait <strong>cristalliser</strong> : on rend la solution <strong>saturée</strong>, puis les cristaux apparaissent. Deux procédés : refroidir la solution, ou évaporer une partie de l'eau.</>,
      tache: { type: 'qcm', q: 'Qu’est-ce qu’une solution saturée ?', options: ['Une solution qui ne peut plus dissoudre de soluté à cette température', 'Une solution très concentrée, quelle que soit la température', 'Une solution qui contient des cristaux de soluté dissous'], bonne: 0,
        expl: 'À une température donnée, la solubilité est la masse maximale de soluté que l’on peut dissoudre dans une masse d’eau donnée. Au-delà, le soluté en excès reste solide.' } },
    { id: 'lecture', titre: 'Lire le diagramme de solubilité', focus: ['diagramme'],
      texte: <>Le diagramme donne la <strong>solubilité</strong> de KNO₃ (masse de sel pour 100 g d'eau) en fonction de la température. On dissout <strong>100 g</strong> de KNO₃ dans 100 g d'eau à 80 °C. Lisez sur la courbe la solubilité à 80 °C (le survol de la courbe affiche les valeurs).</>,
      tache: { type: 'num', q: 'Solubilité de KNO₃ à 80 °C', unite: 'g / 100 g d’eau', vrai: s80, tol: 0.03, affiche: x => fmt(x, 0),
        bloque: !(typeCr === 'refroidissement' && T === 80) ? 'Gardez le mode « Par refroidissement » et T = 80 °C.' : null,
        expl: `À 80 °C, 100 g d'eau peuvent dissoudre jusqu'à ${fmt(s80, 0)} g de KNO₃. Comme on n'en a mis que 100 g, la solution est insaturée : tout est dissous.` } },
    { id: 'sens', titre: 'Effet de la température', focus: ['diagramme', 'params'],
      texte: <>Déplacez le curseur de température vers des valeurs plus basses et observez la courbe : la solubilité de KNO₃ varie fortement avec la température.</>,
      tache: { type: 'qcm', q: 'Quand on refroidit la solution, la solubilité de KNO₃…', options: ['diminue : du sel peut devenir solide', 'augmente : le sel se dissout mieux', 'ne change pas'], bonne: 0,
        expl: 'La solubilité de KNO₃ chute de 169 g à 80 °C à environ 13 g à 0 °C (pour 100 g d’eau) : c’est ce qui rend la cristallisation par refroidissement efficace pour ce sel.' } },
    { id: 'refroid40', titre: 'Refroidir à 40 °C', focus: ['params', 'diagramme', 'becher'],
      texte: <>On refroidit la solution (100 g de KNO₃ pour 100 g d'eau). Réglez la température à <strong>40 °C</strong>. Le losange est la composition globale du système ; le trait rouge vertical mesure l'écart entre cette composition et la courbe.</>,
      tache: { type: 'action', ok: T === 40, label: 'Régler T = 40 °C', faire: () => setT(40), consigne: T === 40 ? null : `Température : ${T} °C → 40 °C` } },
    { id: 'sol40', titre: 'Solubilité à 40 °C', focus: ['diagramme'],
      texte: <>À 40 °C, la courbe donne la quantité maximale de KNO₃ qui reste dissoute dans 100 g d'eau.</>,
      tache: { type: 'num', q: 'Solubilité de KNO₃ à 40 °C', unite: 'g / 100 g d’eau', vrai: s40, tol: 0.03, affiche: x => fmt(x, 1),
        bloque: !(modeRef && T === 40) ? 'Gardez le mode « Par refroidissement », 100 g de soluté et T = 40 °C.' : null,
        expl: `Environ ${fmt(s40, 1)} g de KNO₃ restent dissous.` } },
    { id: 'cristaux40', titre: 'Masse de cristaux', focus: ['diagramme', 'bilan'],
      texte: <>Sur les 100 g de KNO₃ introduits, une partie reste dissoute (la masse dissoute figure maintenant dans le bilan de matière) et le reste cristallise. La longueur du trait rouge sur le diagramme représente cette masse.</>,
      tache: { type: 'num', q: 'Masse de cristaux obtenue à 40 °C', unite: 'g', vrai: c40, tol: 0.03, affiche: x => fmt(x, 1),
        bloque: !(modeRef && T === 40) ? 'Gardez le mode « Par refroidissement », 100 g de soluté et T = 40 °C.' : null,
        expl: `m(cristaux) = 100 − ${fmt(s40, 1)} = ${fmt(c40, 1)} g. Vérifiez dans le bilan de matière.` } },
    { id: 'tsat', titre: 'Où apparaissent les premiers cristaux ?', focus: ['diagramme', 'params', 'bilan'],
      texte: <>En partant de 80 °C, la solution est insaturée. Refroidissez-la progressivement : la composition globale (losange) se déplace sur l'horizontale en pointillés. Les premiers cristaux apparaissent quand ce point <strong>rejoint la courbe</strong>.</>,
      tache: { type: 'num', q: 'Température à laquelle les premiers cristaux apparaissent', unite: '°C', vrai: tSat100, tol: 0.03, affiche: x => fmt(x, 0),
        bloque: !modeRef ? 'Gardez le mode « Par refroidissement » et 100 g de soluté.' : null,
        expl: `La solution devient saturée quand sa solubilité vaut 100 g / 100 g d'eau, soit vers ${fmt(tSat100, 0)} °C.` } },
    { id: 'rendement', titre: 'Quel rendement de cristallisation ?', focus: ['params', 'bilan'],
      texte: <>On refroidit maintenant jusqu'à <strong>20 °C</strong>. Le rendement est la proportion du KNO₃ introduit que l'on récupère sous forme de cristaux.</>,
      tache: { type: 'num', q: 'Rendement de la cristallisation à 20 °C', unite: '%', vrai: c20 / ref.m * 100, tol: 0.02, affiche: x => fmt(x, 0),
        bloque: !(modeRef && T === 20) ? 'Réglez T = 20 °C (mode « Par refroidissement », 100 g de soluté).' : null,
        expl: `m(cristaux) = 100 − ${fmt(s20, 1)} = ${fmt(c20, 1)} g, soit ${fmt(c20, 1)} % du sel introduit. Même à 0 °C, on ne récupère jamais tout : ${fmt(solubilite(0), 1)} g restent dissous.` } },
    { id: 'evap', titre: 'Cristalliser par évaporation', focus: ['mode', 'params'],
      texte: <>Autre procédé : on garde la température constante et on <strong>évapore l'eau</strong> (sous pression réduite, pour ne pas chauffer). On part de 50 g de KNO₃ dans 100 g d'eau, à 60 °C.</>,
      tache: { type: 'action', ok: modeEv, label: 'Passer en évaporation (60 °C, 50 g)', faire: () => { setTypeCr('evaporation'); setT(60); setMSolute(50); setMEau(100); },
        consigne: modeEv ? null : 'Mode « Par évaporation », T = 60 °C, soluté 50 g' } },
    { id: 'eausat', titre: 'Jusqu’où évaporer ?', focus: ['params', 'diagramme', 'bilan'],
      texte: <>À 60 °C, 100 g d'eau dissolvent au plus {fmt(sEv, 0)} g de KNO₃. En évaporant, on diminue la masse d'eau : la solution devient saturée quand les 50 g de sel sont <strong>la masse maximale</strong> que l'eau restante peut dissoudre. Calculez cette masse d'eau (produit en croix), puis vérifiez avec le curseur.</>,
      tache: { type: 'num', q: 'Masse d’eau restante à laquelle la solution devient saturée', unite: 'g', vrai: eauSat, tol: 0.03, affiche: x => fmt(x, 1),
        bloque: !modeEv ? 'Gardez le mode « Par évaporation », T = 60 °C et 50 g de soluté.' : null,
        expl: `${fmt(sEv, 0)} g de sel pour 100 g d'eau, donc 50 g de sel pour m(eau) : m(eau) = 50 × 100 / ${fmt(sEv, 0)} ≈ ${fmt(eauSat, 1)} g.` } },
    { id: 'eau20', titre: 'Évaporer davantage', focus: ['params', 'bilan'],
      texte: <>On continue d'évaporer jusqu'à ce qu'il ne reste que <strong>20 g d'eau</strong>, toujours à 60 °C. Réglez 20 g avec le curseur et lisez la masse de cristaux dans le bilan de matière.</>,
      tache: { type: 'num', q: 'Masse de cristaux obtenue avec 20 g d’eau restants', unite: 'g', vrai: cEv20, tol: 0.03, affiche: x => fmt(x, 1),
        bloque: !(modeEv && mEau === 20) ? 'Réglez la masse d’eau restante à 20 g (mode « Par évaporation », T = 60 °C, 50 g de soluté).' : null,
        expl: `Contrôle par le calcul : la solution saturée garde ${fmt(sEv, 0)} × 20 / 100 = ${fmt(sEv * 0.2, 0)} g de sel dissous, donc ${fmt(cEv20, 0)} g de cristaux (50 − ${fmt(sEv * 0.2, 0)}).` } },
    { id: 'choix', titre: 'Quel procédé choisir ?', focus: ['diagramme'],
      texte: <>Pour le chlorure de sodium NaCl, la solubilité varie très peu avec la température : environ 36 g pour 100 g d'eau à 20 °C et 39 g à 100 °C.</>,
      tache: { type: 'qcm', q: 'Pour récupérer NaCl dissous dans l’eau, quel procédé est le plus efficace ?', options: ['L’évaporation de l’eau, car le refroidissement ne fait presque rien cristalliser', 'Le refroidissement, comme pour KNO₃', 'Les deux sont également efficaces'], bonne: 0,
        expl: 'Quand la courbe de solubilité est presque horizontale, refroidir ne diminue presque pas la quantité de sel dissous. Il faut retirer de l’eau, comme dans les marais salants.' } },
    { id: 'hypotheses', titre: 'Sur quoi repose ce modèle ?', focus: ['hypo'],
      texte: <>Lisez l'encadré « Hypothèses de travail ».</>,
      tache: { type: 'qcm', q: 'Quelle hypothèse est faite sur la solution ?', options: ['À chaque température, l’équilibre est atteint : dès que la solution est saturée, l’excès cristallise (pas de sursaturation)', 'Les cristaux obtenus contiennent de l’eau', 'La solubilité de KNO₃ ne dépend pas de la température'], bonne: 0,
        expl: 'Dans la réalité, une solution peut rester sursaturée (métastable) tant qu’aucun germe cristallin ne se forme ; le modèle ne le décrit pas.' } },
    { id: 'bravo', titre: 'Bravo !', focus: [],
      texte: <>Vous savez lire un diagramme de solubilité, trouver la température d'apparition des cristaux et calculer la masse obtenue par refroidissement ou par évaporation. En exploration libre, changez la masse de sel ou la température pour d'autres cas.</>, tache: null },
  ];
  const idx = id => ETAPES.findIndex(e => e.id === id);
  const passe = id => !enGuide || etape > idx(id);
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {};
  const bilanVisible = passe('cristaux40');            // masse cristallisée et répartition
  const dissVisible = passe('sol40');                  // masse dissoute, concentration, solubilité (dès l'étape de calcul des cristaux)

  // ════════════════ DÉFI ════════════════
  function nouveauDefi() {
    const tire = t => t[Math.floor(Math.random() * t.length)];
    let d;
    if (Math.random() < 0.5) {
      const Tf = tire([10, 20, 30, 40]);
      const m = tire([50, 60, 80, 100, 120, 150].filter(x => x > solubilite(Tf) + 10));
      d = { type: 'refroidissement', m, Tf };
    } else {
      const Tv = tire([40, 50, 60, 70, 80]);
      const m = tire([30, 40, 50, 60]);
      const eSat = m / solubilite(Tv) * 100;
      const ef = tire([10, 15, 20, 25, 30].filter(x => x < eSat - 3));
      d = { type: 'evaporation', m, Tv, ef };
    }
    setDefi({ ...d, reps: {}, verifie: false });
  }
  function changerMode(m) {
    setMode(m);
    if (m === 'defi' && !defi) nouveauDefi();
    if (m === 'guide') { setTypeCr('refroidissement'); setT(80); setMEau(100); setMSolute(100); }
  }
  const voletDefi = defi && (() => {
    let Q, enonce, regler;
    if (defi.type === 'refroidissement') {
      const s = solubilite(defi.Tf), c = defi.m - s, ts = tempDeSolub(defi.m);
      enonce = <>On dissout <strong>{defi.m} g</strong> de KNO₃ dans 100 g d'eau, à chaud (solution insaturée), puis on refroidit jusqu'à <strong>{defi.Tf} °C</strong>.</>;
      Q = [
        { id: 's', q: `Solubilité de KNO₃ à ${defi.Tf} °C (à lire sur le diagramme)`, unite: 'g / 100 g d’eau', vrai: s, tol: 0.03, aff: fmt(s, 1) },
        { id: 'd', q: `Masse de KNO₃ restant dissoute à ${defi.Tf} °C`, unite: 'g', vrai: s, tol: 0.03, aff: fmt(s, 1) },
        { id: 'c', q: 'Masse de cristaux obtenue', unite: 'g', vrai: c, tol: 0.03, aff: fmt(c, 1) },
        { id: 'r', q: 'Rendement de la cristallisation (cristaux / sel introduit)', unite: '%', vrai: c / defi.m * 100, tol: 0.02, aff: fmt(c / defi.m * 100, 0) },
        { id: 't', q: 'Température à laquelle les premiers cristaux apparaissent', unite: '°C', vrai: ts, tol: 0.03, aff: fmt(ts, 0) },
      ];
      regler = () => { setTypeCr('refroidissement'); setMSolute(defi.m); setT(defi.Tf); setMEau(100); };
    } else {
      const s = solubilite(defi.Tv), eSat = defi.m / s * 100, dis = s * defi.ef / 100, c = defi.m - dis;
      enonce = <>On évapore l'eau d'une solution de <strong>{defi.m} g</strong> de KNO₃ dans 100 g d'eau, maintenue à <strong>{defi.Tv} °C</strong>, jusqu'à ce qu'il ne reste que <strong>{defi.ef} g d'eau</strong>.</>;
      Q = [
        { id: 's', q: `Solubilité de KNO₃ à ${defi.Tv} °C (à lire sur le diagramme)`, unite: 'g / 100 g d’eau', vrai: s, tol: 0.03, aff: fmt(s, 1) },
        { id: 'e', q: 'Masse d’eau restante à laquelle apparaissent les premiers cristaux', unite: 'g', vrai: eSat, tol: 0.03, aff: fmt(eSat, 1) },
        { id: 'd', q: `Masse de KNO₃ dissoute dans les ${defi.ef} g d’eau restants`, unite: 'g', vrai: dis, tol: 0.03, aff: fmt(dis, 1) },
        { id: 'c', q: 'Masse de cristaux obtenue', unite: 'g', vrai: c, tol: 0.03, aff: fmt(c, 1) },
        { id: 'r', q: 'Proportion du sel introduit qui a cristallisé', unite: '%', vrai: c / defi.m * 100, tol: 0.02, aff: fmt(c / defi.m * 100, 0) },
      ];
      regler = () => { setTypeCr('evaporation'); setMSolute(defi.m); setT(defi.Tv); setMEau(defi.ef); };
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.55 }}>
          {enonce}
          <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 4 }}>Rappel : m(cristaux) = m(sel introduit) − m(sel dissous), la solution restante étant saturée.</div>
          <button onClick={() => { regler(); setMode('explore'); }}
            style={{ ...stylePetitBouton(false, '#334155'), marginTop: 6 }}>🔍 Régler l’exploration sur ces valeurs</button>
        </div>
        {Q.map((qu, k) => {
          const rep = defi.reps[qu.id] || '', ok = proche(lireNombre(rep), qu.vrai, qu.tol);
          return (
            <div key={qu.id} style={{ borderLeft: `3px solid ${defi.verifie ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {avecIndices(qu.q)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input value={rep} placeholder="?" aria-label={`Réponse ${k + 1}`} onChange={x => { const val = x.target.value; setDefi(d => ({ ...d, verifie: false, reps: { ...d.reps, [qu.id]: val } })); }}
                  style={{ fontSize: 14, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 110 }}/>
                <span style={{ fontSize: 14, color: KIT.txt2 }}>{qu.unite}</span>
                {defi.verifie && <span>{ok ? '✅' : '❌'}</span>}
              </div>
              {defi.verifie && !ok && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 3 }}>Réponse attendue : {qu.aff} {qu.unite}</div>}
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setDefi(d => ({ ...d, verifie: true }))} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
          <button onClick={nouveauDefi} style={styleBouton(false)}>🔄 Nouveau défi</button>
        </div>
      </div>
    );
  })();

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Solubilité</strong> : valeurs tabulées de KNO₃ dans l'eau pure tous les 10 °C, avec une interpolation linéaire entre deux valeurs (les lectures graphiques sont donc approchées). Pas d'impuretés ni d'autres ions en solution.</li>
      <li><strong>Équilibre</strong> : à chaque température, l'équilibre est atteint. Dès que la solution est saturée, l'excès cristallise aussitôt : on ignore la sursaturation (solution métastable) et la cinétique de cristallisation.</li>
      <li><strong>Cristaux</strong> : KNO₃ pur et anhydre. Les cristaux ne retiennent pas de solution (pas d'eau-mère), et la masse récupérée est supposée entièrement séparée du liquide.</li>
      <li><strong>Masses</strong> : le sel est exprimé en g pour 100 g d'eau de départ. En refroidissement, la masse d'eau reste égale à 100 g. En évaporation, la température est constante, seule l'eau s'évapore (KNO₃ n'est pas volatil) et il en reste la masse indiquée.</li>
      <li><strong>Diagramme</strong> : le losange représente la composition globale (tout le sel introduit, pour 100 g de l'eau restante) ; en présence de cristaux, le point de la solution saturée est sur la courbe et l'écart vertical représente la masse de cristaux.</li>
    </ul>
  );
  const panneauHypo = (
    <div style={{ ...styleBoite, ...cadre('hypo') }}>
      <Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section>
    </div>
  );
  const finParcours = (
    <span style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défi</button>
    </span>
  );

  const bil = (v, f) => bilanVisible ? f(v) : '?';

  const exploration = (
    <div style={{display:"flex", flexDirection:"column", gap:12}}>

      {/* Choix du mode */}
      <div style={{...styleBoite, ...cadre('mode')}}>
        <div style={{fontWeight:600, color:"#445", marginBottom:10}}>Mode de cristallisation</div>
        <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
          <TabBtn active={typeCr==="refroidissement"} color="#0096c7"
            onClick={()=>setTypeCr("refroidissement")}>
            🧊 Par refroidissement
          </TabBtn>
          <TabBtn active={typeCr==="evaporation"} color="#e9a824"
            onClick={()=>setTypeCr("evaporation")}>
            💨 Par évaporation
          </TabBtn>
        </div>
      </div>

      {/* Diagramme + bécher */}
      <div style={{display:"flex", gap:12, flexWrap:"wrap"}}>

        <div style={{...styleBoite, flex:1, minWidth:320, ...cadre('diagramme')}}>
          <div style={{fontWeight:600, color:"#445", marginBottom:6}}>
            Diagramme de solubilité — KNO₃
          </div>
          <div ref={plotRef} style={{height:400}}/>
        </div>

        <div style={{flex:"0 0 260px", maxWidth:"100%"}}>
          <div style={{...styleBoite, height:"100%", boxSizing:"border-box", ...cadre('becher')}}>
            <div style={{fontWeight:600, color:"#445", marginBottom:8}}>
              {typeCr==="refroidissement" ? "Cristallisoir + bécher" : "Montage évaporation"}
            </div>
          <svg viewBox="0 0 240 340" style={{width:"100%", display:"block"}}>

              {/* ── MODE REFROIDISSEMENT ── */}
              {typeCr==="refroidissement" && <>

                {/* CRISTALLISOIR — occupe toute la hauteur basse */}
                <line x1="10"  y1="200" x2="10"  y2="330" stroke="#5599bb" strokeWidth="2"/>
                <line x1="230" y1="200" x2="230" y2="330" stroke="#5599bb" strokeWidth="2"/>
                <line x1="10"  y1="330" x2="230" y2="330" stroke="#5599bb" strokeWidth="2"/>
                {/* Eau cristallisoir */}
                <rect x="11" y="220" width="219" height="109" fill="rgba(173,216,230,0.25)"/>

                {/* Glaçons GAUCHE (entre paroi cristallisoir et bécher) */}
                {[[15,225],[15,248],[15,270],[15,292]].map(([x,y],i)=>(
                  <rect key={`gl${i}`} x={x} y={y} width="16" height="12" rx="3"
                    fill="rgba(200,240,255,0.85)" stroke="#aaddff" strokeWidth="1"/>
                ))}
                {/* Glaçons DROITE */}
                {[[205,225],[205,248],[205,270],[205,292]].map(([x,y],i)=>(
                  <rect key={`gr${i}`} x={x} y={y} width="16" height="12" rx="3"
                    fill="rgba(200,240,255,0.85)" stroke="#aaddff" strokeWidth="1"/>
                ))}

                <text x="120" y="325" textAnchor="middle" fontSize="9" fill="#5599bb">
                  Cristallisoir — T = {T}°C
                </text>

                {/* BÉCHER — bord haut y=150, bord bas y=310, plongé dans cristallisoir */}
                {/* Solution : bord bas=310, bord haut=220, côtés collés aux parois */}
                <rect x="56" y="220" width="128" height="90" fill={solColor}/>
                {/* Parois bécher */}
                <line x1="55"  y1="150" x2="55"  y2="310" stroke="#5599bb" strokeWidth="2"/>
                <line x1="185" y1="150" x2="185" y2="310" stroke="#5599bb" strokeWidth="2"/>
                <line x1="55"  y1="310" x2="185" y2="310" stroke="#5599bb" strokeWidth="2"/>

                {/* Particules dissoutes — DANS le rectangle bleu */}
                {particulesPos.slice(0, nDissous).map((p,i)=>(
                  <circle key={p.id}
                    cx={58 + animPos[i].x * 124}
                    cy={224 + animPos[i].y * 82}
                    r="4" fill="#0096c7" opacity="0.8"/>
                ))}
                {/* Cristaux au fond du bécher */}
                {cristauxPos.slice(0, nCristaux).map(p=>(
                  <g key={p.id} transform={`translate(${60 + (p.id%10)*12}, ${300 - Math.floor(p.id/10)*12})`}>
                    <polygon points="0,-5 1.5,-1.5 5,0 1.5,1.5 0,5 -1.5,1.5 -5,0 -1.5,-1.5"
                      fill="#e9a824" stroke="#c07800" strokeWidth="0.5"/>
                  </g>
                ))}

                <text x="120" y="195" textAnchor="middle" fontSize="10" fill="#0096c7">
                  Solution KNO₃
                </text>
                <text x="120" y="140" textAnchor="middle" fontSize="11" fill="#333" fontWeight="bold">
                  T = {T}°C
                </text>
              </>}

              {/* ── MODE EVAPORATION ── */}
              {typeCr==="evaporation" && <>

                {/* Flèche vers pompe à vide — au dessus de tout */}
                <line x1="120" y1="24" x2="120" y2="8" stroke="#e9a824" strokeWidth="2.5"
                  markerEnd="url(#arrEvap)"/>
                <text x="128" y="12" fontSize="9" fill="#e9a824" fontWeight="bold">vers pompe à vide</text>

                {/* Col entonnoir */}
                <rect x="108" y="22" width="24" height="20" rx="2"
                  fill="rgba(200,230,255,0.3)" stroke="#5599bb" strokeWidth="1.5"/>

                {/* Entonnoir renversé — épouse les bords du bécher */}
                <path d="M55,80 L108,42 L132,42 L185,80"
                  fill="rgba(200,230,255,0.2)" stroke="#5599bb" strokeWidth="1.5"/>

                {/* Bécher */}
                <line x1="55"  y1="80"  x2="55"  y2="280" stroke="#5599bb" strokeWidth="2"/>
                <line x1="185" y1="80"  x2="185" y2="280" stroke="#5599bb" strokeWidth="2"/>
                <line x1="55"  y1="280" x2="185" y2="280" stroke="#5599bb" strokeWidth="2"/>

                {/* Niveau eau — diminue avec mEau */}
                {(() => {
                  const niveauY = 80 + (1 - mEau/100) * 180;
                  const solH = Math.max(0, 280 - niveauY);
                  return <>
                    <rect x="56" y={niveauY} width="128" height={solH} fill={solColor}/>
                    <line x1="56" y1={niveauY} x2="184" y2={niveauY}
                      stroke="#0096c7" strokeWidth="1" strokeDasharray="3,2"/>
                    <text x="190" y={niveauY+4} fontSize="9" fill="#0096c7">{mEau}g</text>

                    {/* Particules — UNIQUEMENT dans la solution */}
                    {particulesPos.slice(0, nDissous).map((p,i)=>(
                      <circle key={p.id}
                        cx={58 + animPos[i].x * 124}
                        cy={niveauY + 6 + animPos[i].y * Math.max(solH - 12, 1)}
                        r="3.5" fill="#0096c7" opacity="0.8"/>
                    ))}
                    {/* Cristaux au fond */}
                    {cristauxPos.slice(0, nCristaux).map(p=>(
                      <g key={p.id} transform={`translate(${60 + (p.id%10)*12}, ${270 - Math.floor(p.id/10)*12})`}>
                        <polygon points="0,-4 1.2,-1.2 4,0 1.2,1.2 0,4 -1.2,1.2 -4,0 -1.2,-1.2"
                          fill="#e9a824" stroke="#c07800" strokeWidth="0.5"/>
                      </g>
                    ))}
                  </>;
                })()}

                {/* Pression + T */}
                <text x="120" y="300" textAnchor="middle" fontSize="10"
                  fill="#e9a824" fontWeight="bold">
                  pression réduite — T = {T}°C
                </text>

                <defs>
                  <marker id="arrEvap" viewBox="0 0 10 10" refX="8" refY="5"
                    markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M2 1L8 5L2 9" fill="none" stroke="#e9a824" strokeWidth="1.5"/>
                  </marker>
                </defs>
              </>}

            </svg>
          </div>
        </div>
      </div>

      {/* Paramètres + bilan */}
      <div style={{display:"flex", gap:12, flexWrap:"wrap"}}>

        <div style={{...styleBoite, ...cadre('params')}}>
          <div style={{fontWeight:600, color:"#445", marginBottom:10}}>Paramètres</div>
          <div style={{display:"flex", gap:12, flexWrap:"wrap"}}>

            <div style={fieldStyle}>
              <span style={labelStyle}>Masse de soluté pour 100 g d’eau (g)</span>
              <input type="number" style={inputStyle} step="5" min="5" max="200"
                value={mSolute} onChange={e=>setMSolute(Math.max(0, parseFloat(e.target.value) || 0))}/>
            </div>

            {typeCr==="refroidissement" && (
              <div style={fieldStyle}>
                <span style={labelStyle}>Température (°C)</span>
                <input type="range" min="0" max="100" step="1" value={T}
                  onChange={e=>setT(parseFloat(e.target.value))}
                  style={{accentColor:"#0096c7", width:150}}/>
                <strong style={{fontSize:13}}>{T} °C</strong>
              </div>
            )}

            {typeCr==="evaporation" && <>
              <div style={fieldStyle}>
                <span style={labelStyle}>Température (°C) — fixe</span>
                <input type="number" style={inputStyle} step="5" min="0" max="100"
                  value={T} onChange={e=>setT(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}/>
              </div>
              <div style={fieldStyle}>
                <span style={labelStyle}>Masse d’eau restante (g)</span>
                <input type="range" min="10" max="100" step="1" value={mEau}
                  onChange={e=>setMEau(parseFloat(e.target.value))}
                  style={{accentColor:"#e9a824", width:150}}/>
                <strong style={{fontSize:13}}>{mEau} g</strong>
              </div>
            </>}

          </div>
        </div>

        <div style={{...styleBoite, flex:1, minWidth:260, ...cadre('bilan')}}>
          <div style={{fontWeight:600, color:"#445", marginBottom:10}}>Bilan de matière</div>
          <div style={{display:"flex", flexDirection:"column", gap:10}}>

            <div style={{display:"flex", flexDirection:"column", gap:6}}>
              <div style={{fontSize:13}}>
                Masse de soluté totale : <strong>{mSolute} g</strong>
              </div>
              <div style={{fontSize:13, color:"#0096c7"}}>
                ● Masse dissoute : <strong>{dissVisible ? mDissoute.toFixed(1) + ' g' : '?'}</strong>
              </div>
              <div style={{fontSize:13, color:"#b7791f"}}>
                ★ Masse cristallisée : <strong>{bil(mCristaux, x => x.toFixed(1) + ' g')}</strong>
              </div>
              <div style={{fontSize:13}}>
                Concentration de la solution : <strong>{dissVisible ? conc.toFixed(1) + ' g/100g eau' : '?'}</strong>
              </div>
              <div style={{fontSize:13}}>
                Solubilité à {T}°C : <strong>{dissVisible ? sT.toFixed(1) + ' g/100g eau' : '?'}</strong>
              </div>
              <div style={{marginTop:6, padding:"6px 10px", borderRadius:6,
                background: sature ? "#fff0f0" : "#f0fff4",
                border: `1px solid ${sature ? "#e63946" : "#2a9d8f"}`,
                fontSize:12, fontWeight:600,
                color: sature ? "#e63946" : "#2a9d8f"}}>
                {sature ? "⚠ Solution saturée — cristallisation en cours" : "✓ Solution insaturée"}
              </div>
            </div>

            {bilanVisible && (
              <div style={{width:"100%"}}>
                <div style={{fontSize:12, color:"#666", marginBottom:4}}>
                  Répartition du soluté :
                </div>
                <div style={{background:"#eee", borderRadius:8, height:24, overflow:"hidden", display:"flex"}}>
                  <div style={{
                    width:`${fracDiss*100}%`,
                    background:"#0096c7", transition:"width 0.3s",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:11, color:"white", fontWeight:600
                  }}>
                    {mDissoute.toFixed(0)}g dissous
                  </div>
                  <div style={{
                    width:`${(1-fracDiss)*100}%`,
                    background:"#b7791f", transition:"width 0.3s",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:11, color:"white", fontWeight:600
                  }}>
                    {mCristaux > 0 ? `${mCristaux.toFixed(0)}g cristaux` : ""}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .cr-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .cr-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .cr-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        @media (max-width: 960px) { .cr-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Cristallisation du nitrate de potassium</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div className={`cr-l1${mode !== 'explore' ? ' cote' : ''}`}>
        {mode === 'defi' ? <div style={styleBoite}>{voletDefi}</div> : exploration}
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/>
          : mode === 'defi' ? <div style={styleBoite}><div style={{ fontWeight: 700, fontSize: 15, color: KIT.txt, marginBottom: 6 }}>Hypothèses de travail</div>{hypotheses}</div>
            : null}
      </div>
      {mode === 'explore' && (
        <div className="cr-l2">
          <div style={styleBoite}>
            <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
              <li>Avec 100 g de sel, refroidissez depuis 80 °C : à quelle température les premiers cristaux apparaissent-ils ?</li>
              <li>Comparez la masse de cristaux à 20 °C et à 0 °C. Peut-on tout récupérer par refroidissement ?</li>
              <li>Passez en évaporation à 60 °C : jusqu'à quelle masse d'eau la solution reste-t-elle insaturée ?</li>
              <li>Augmentez la masse de soluté : la température d'apparition des cristaux change-t-elle ?</li>
            </ul>
          </div>
          {panneauHypo}
        </div>
      )}
      {mode === 'guide' && panneauHypo}
    </div>
  );
}
