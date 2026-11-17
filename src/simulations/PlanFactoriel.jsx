import { useState } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./planFactorielModele";
import { CubeVue, EffetsVue, InterVue, IsoVue } from "./PlanFactorielVues";
import { CarteCube, CarteEffet, CarteInter, CarteFraction, CarteModele, CarteDdl, CartePareto, CarteSignif } from "./PlanFactorielCartes";

const SIM_ID = 127;
declarerDefis(SIM_ID, [['coef', 'Calculer un coefficient d’un plan 2²'], ['predire', 'Prédire une réponse à partir de niveaux réels'], ['cible', 'Atteindre une viscosité cible']]);

// ====================================================
//  SIM 127 — PLANS FACTORIELS (BTS Métiers de la Chimie, Formulation)
//  Données réelles : TP « flan au chocolat » (2³ complet), activité « vinaigrette » (2⁴ complet) et mémo « vinaigrette » (2⁵⁻¹, résolution V).
//  Trois parcours guidés : débutant (strictement le programme : plan complet 2³, coefficients, interactions, prévision, isoréponses),
//  confirmé (plan 2⁴, degrés de liberté, diagramme de Pareto, réduction du modèle), expert (hors programme : fraction 2⁵⁻¹, alias, Student).
//  Hypothèses : voir le panneau « Hypothèses de travail » (niveaux codés, une seule mesure par essai, facteurs qualitatifs, notes de jury bornées…).
// ====================================================

const nbf = (v, d = 0) => Number(v).toFixed(d).replace(/^-(0(\.0*)?)$/, '$1').replace('.', ',').replace('-', '−');
const nbe = (v, d = 1) => nbf(v, Math.abs(v - Math.round(v)) < 1e-9 ? 0 : d);
const sgn = v => (v >= 0 ? '+' : '−');
const hasard = () => Math.random();
const alea = l => l[Math.floor(hasard() * l.length)];
const entier = n => Math.floor(hasard() * n);
const ETAT0 = { etape: 0, reps: {}, verifs: {}, reussies: {} };

// ---------- données et modèles ----------
const J = M.JEUX;
const TERMES = { flan: M.termes(3, 3), vin4: M.termes(4, 4), vin5: M.termes(5, 2) };
const cle = t => t.join('');
const deCle = c => c.split('').map(Number);
const KEPT0 = { flan: ['0', '1', '2'], vin4: TERMES.vin4.map(cle), vin5: TERMES.vin5.map(cle) };
const MODELE_VISC = ['0', '1', '01'];                       // viscosité du flan : recette, température et leur interaction
const CIBLE_CONF = ['1', '2', '3', '23'];                   // vinaigrette 2⁴ : X, U, N et U·N
const CIBLE_EXP = ['2', '3', '4', '24', '34'];              // vinaigrette 2⁵⁻¹ : C, D, E, C·E et D·E
const NOTES = J.flan.reponses[0].y, VISC = J.flan.reponses[1].y;
const Y4 = J.vin4.reponses[0].y, Y5 = J.vin5.reponses[0].y;
const mR = M.moyennes(J.flan.X, NOTES, [0]);                // Moy⁺ = 2,375 ; Moy⁻ = 6,25
const A_R = M.coefTerme(J.flan.X, NOTES, [0]);              // −1,9375
const A0 = M.moyenneGenerale(NOTES);                        // 4,3125
const MOD_NOTE = M.ajuste(J.flan.X, NOTES, [[0], [1], [2]]);
const MOD_VISC = M.ajuste(J.flan.X, VISC, MODELE_VISC.map(deCle));
const MN4 = M.moyennes(J.vin4.X, Y4, [3]);                  // 3,7625 ; 7,3375
const MOD4 = M.ajuste(J.vin4.X, Y4, CIBLE_CONF.map(deCle));
const S4 = 0.155;                                           // écart-type résiduel du modèle réduit, donné à l'élève (arrondi de 0,1552)
const SEUIL4 = 1.96 * S4 / Math.sqrt(16);                   // 0,076 : demi-largeur de l'intervalle de confiance (σ supposée connue)
const ME5 = M.moyennes(J.vin5.X, Y5, [4]);                  // 4,125 ; 7,375
const MOD5 = M.ajuste(J.vin5.X, Y5, CIBLE_EXP.map(deCle));
const IC5 = M.demiICstudent(MOD5);                          // 0,363
const NIVEAUX_ISO = { flan: [[2, 3, 4, 5, 6], [1000, 2000, 3000, 4000, 5000]], vin4: [[2, 3, 4, 5, 6, 7, 8]], vin5: [[2, 4, 5, 6, 7, 8, 9]] };
const PAIRE0 = { flan: [0, 1], vin4: [2, 3], vin5: [3, 4] };
const TITRES_CHART = { note: 'coefficients du modèle (points de note sur 10)', visc: 'coefficients du modèle (unités de viscosité)' };
const coefDe2 = (y, c) => { const col = { A: [-1, -1, 1, 1], B: [-1, 1, -1, 1], AB: [1, -1, -1, 1] }[c]; return col.reduce((s, v, i) => s + v * y[i], 0) / 4; };
const FACT_DEFI = [['la température', '°C', 60, 100], ['le temps de malaxage', 'min', 10, 30], ['la concentration en xanthane', 'g/L', 2, 6], ['la masse de sel', 'g', 1, 3]];

const lib = f => ({ bas: typeof f.bas === 'number' ? `${nbe(f.bas)}${f.unite ? NB + f.unite : ''}` : f.bas, haut: typeof f.haut === 'number' ? `${nbe(f.haut)}${f.unite ? NB + f.unite : ''}` : f.haut });
const quanti = f => typeof f.bas === 'number';
const reelTxt = (f, x) => (quanti(f) ? `${nbf(M.reelDe(x, f.bas, f.haut), 2)}${NB}${f.unite || ''}` : (x < -0.99 ? f.bas : x > 0.99 ? f.haut : 'valeur intermédiaire (sans sens physique)'));

// ---------- tableau de la matrice d'expérience ----------
function TableMatrice({ jd, ris, modele, ri, alias, resid }) {
  const th = { padding: '3px 2px', textAlign: 'center', borderBottom: `1.5px solid ${KIT.bord}`, color: KIT.txt2, fontSize: 12.5, whiteSpace: 'nowrap' };
  const td = { padding: '3px 2px', textAlign: 'center', fontFamily: 'monospace', fontSize: 13, whiteSpace: 'nowrap', borderBottom: `1px dashed ${KIT.bord}` };
  const aliasCol = alias ? M.colonne(jd.X, [0, 1, 2, 3]) : null;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead><tr>
          <th style={th}>essai</th>
          {jd.facteurs.map(f => <th key={f.id} style={th} title={f.nom}>{f.id}</th>)}
          {alias && <th style={th}>A·B·C·D</th>}
          {ris.map(r => <th key={r} style={th}>{jd.reponses[r].id === 'note' ? 'note' : 'viscosité'}</th>)}
          {modele && <th style={th}>prévu</th>}{modele && resid && <th style={th}>écart</th>}
        </tr></thead>
        <tbody>
          {jd.X.map((r, i) => {
            const prev = modele ? modele(r) : null, rr = jd.reponses[ri];
            return (<tr key={i}>
              <td style={{ ...td, fontWeight: 700 }}>{i + 1}</td>
              {r.map((v, k) => <td key={k} style={td}>{v > 0 ? '+1' : '−1'}</td>)}
              {alias && <td style={td}>{aliasCol[i] > 0 ? '+1' : '−1'}</td>}
              {ris.map(q => <td key={q} style={{ ...td, fontWeight: 700 }}>{nbf(jd.reponses[q].y[i], jd.reponses[q].dec)}</td>)}
              {modele && <td style={td}>{nbf(prev, rr.dec)}</td>}
              {modele && resid && <td style={td}>{nbf(rr.y[i] - prev, rr.dec)}</td>}
            </tr>);
          })}
        </tbody>
      </table>
    </div>);
}

// ====================================================
export function SimulationPlanFactoriel() {
  const [mode, setMode] = useState(() => modeOuverture('plan-factoriel-guide-deb-v1'));
  useSignalerMode(mode);
  const [niveau, setNiveau] = useEtatPersistant('plan-factoriel-niveau-v1', 'deb');
  const [gDeb, setGDeb] = useEtatPersistant('plan-factoriel-guide-deb-v1', ETAT0);
  const [gConf, setGConf] = useEtatPersistant('plan-factoriel-guide-conf-v1', ETAT0);
  const [gExp, setGExp] = useEtatPersistant('plan-factoriel-guide-exp-v1', ETAT0);
  const [kept, setKept] = useEtatPersistant('plan-factoriel-termes-v1', KEPT0);
  const [x, setX] = useState([0, 0, 0, 0, 0]);
  const [explo, setExplo] = useState({ jeu: 'flan', ri: 0, paire: PAIRE0.flan, effets: true, inter: false, iso: false, ic: false });
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('coef');
  const [sC, noterC] = useCompteurDefi(), [sP, noterP] = useCompteurDefi(), [sI, noterI] = useCompteurDefi();
  const [hypoOuv, setHypoOuv] = useState(false), [aliasOuv, setAliasOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplo = mode === 'explore';
  const guide = niveau === 'conf' ? gConf : niveau === 'exp' ? gExp : gDeb;
  const setGuide = niveau === 'conf' ? setGConf : niveau === 'exp' ? setGExp : setGDeb;
  const dev = niveau === 'deb', conf = niveau === 'conf', exp = niveau === 'exp';
  const setE = f => setExplo(e => ({ ...e, ...f }));
  const etape = guide.etape;

  // ---------- progressivité du parcours ----------
  const IDS_DEB = ['facteurs', 'codage', 'mesures', 'moyennes', 'coefficient', 'autres', 'a0', 'predire', 'ecart', 'optimiser', 'visc', 'interaction', 'iso', 'choix', 'bilan'];
  const IDS_CONF = ['essais', 'matrice', 'effetN', 'inter', 'pareto', 'ddl', 'seuil', 'reduire', 'prevoir', 'optimum', 'bilan'];
  const IDS_EXP = ['fraction', 'alias', 'resolution', 'coefs', 'ddl', 'reduire', 'student', 'verif', 'optimum', 'hypotheses', 'bilan'];
  const IDS = conf ? IDS_CONF : exp ? IDS_EXP : IDS_DEB;
  const idx = id => IDS.indexOf(id);
  const des = id => !enGuide || idx(id) < 0 || etape >= idx(id);
  const apres = id => !enGuide || idx(id) < 0 || etape > idx(id);

  // ---------- jeu de données, réponse et modèle ----------
  const jeu = enGuide ? (dev ? 'flan' : conf ? 'vin4' : 'vin5') : enDefi ? 'flan' : explo.jeu;
  const jd = J[jeu];
  const ri = enDefi ? 1 : enGuide ? (dev && des('visc') ? 1 : 0) : Math.min(explo.ri, jd.reponses.length - 1);
  const rep = jd.reponses[ri], y = rep.y;
  const cles = enDefi || (enGuide && dev) ? (ri === 1 ? MODELE_VISC : ['0', '1', '2']) : kept[jeu];
  const ts = cles.map(deCle);
  const fit = M.ajuste(jd.X, y, ts);
  const k = jd.facteurs.length;
  const prevX = xx => M.predit(fit.coefs, fit.ts, xx);
  const facteursActifs = jd.facteurs.map((f, i) => i).filter(i => ts.some(t => t.includes(i)));
  const lesFacteurs = enExplo ? jd.facteurs.map((f, i) => i) : facteursActifs;
  const paire = enGuide ? (dev ? [0, 1] : conf ? [2, 3] : [3, 4]) : enDefi ? [0, 1] : explo.paire;
  const xx = x.slice(0, k);
  const pred = prevX(xx);

  // ---------- éléments affichés ----------
  const vCube = jeu === 'flan' && (enGuide ? dev : enExplo);
  const vFacteurs = enGuide ? !dev : enExplo && jeu !== 'flan';
  const vTable = enGuide ? (dev ? des('codage') : conf ? des('matrice') : des('alias')) : enExplo;
  const vNotes = enGuide ? (dev ? des('mesures') : true) : true;
  const vPrevTab = enGuide ? (dev ? apres('ecart') : conf ? apres('reduire') : apres('verif')) : enExplo;
  const vEffets = enGuide ? (dev ? des('autres') : conf ? des('pareto') : des('ddl')) : enExplo && explo.effets;
  const vInter = enGuide ? (dev ? des('interaction') : conf ? des('inter') : false) : enExplo && explo.inter;
  const vIso = enGuide ? (dev ? des('iso') : conf ? des('optimum') : des('optimum')) : enDefi ? defi?.type === 'cible' : enExplo && explo.iso;
  const vSliders = enGuide ? (dev ? des('optimiser') : des('optimum')) : enDefi ? defi?.type === 'cible' : enExplo;
  const vChips = enGuide ? (conf ? des('reduire') : exp ? des('reduire') : false) : enExplo;
  const vPred = vSliders;
  const vSeuil = enGuide && conf && apres('seuil');
  const vIC = enGuide ? (exp && apres('student')) : enExplo && explo.ic && fit.ddl > 0;
  const surligneMoy = enGuide && dev && idx('moyennes') === etape ? { f: 0, niveau: -1 } : null;

  // ---------- éléments du graphique des coefficients ----------
  const tousT = enGuide && dev && ri === 0 ? [[0], [1], [2]] : TERMES[jeu];
  const items = tousT.map(t => ({ nom: M.nomTerme(t, jd.facteurs), v: M.coefTerme(jd.X, y, t), cle: cle(t) }));
  const trie = enGuide && dev ? items : [...items].sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
  const toutGarde = kept[jeu].length === TERMES[jeu].length;
  const surlignes = enGuide && dev ? (ri === 1 ? MODELE_VISC : []).map(c => M.nomTerme(deCle(c), jd.facteurs)) : (vChips && !toutGarde ? kept[jeu].map(c => M.nomTerme(deCle(c), jd.facteurs)) : []);
  const icAff = vSeuil ? SEUIL4 : null;
  const icBarre = vIC ? (enGuide ? IC5 : M.demiICstudent(fit)) : null;

  // ---------- défis ----------
  function nouveauDefi(type) {
    if (type === 'coef') {
      let yy, cible, v;
      do { yy = [0, 1, 2, 3].map(() => 20 + 5 * entier(15)); cible = alea(['A', 'B', 'AB']); v = coefDe2(yy, cible); } while (Math.abs(v) < 1);
      setDefi({ type, y: yy, cible, v, reps: {}, verifie: false });
    } else if (type === 'predire') {
      const [f1, f2] = [...FACT_DEFI].sort(() => hasard() - 0.5).slice(0, 2);
      const x1 = alea([-0.5, 0, 0.5]), x2 = alea([-1, -0.5, 0.5, 1]);
      const a0 = 40 + entier(31), a1 = alea([-8, -6, -4, 4, 6, 8]), a2 = alea([-8, -6, -4, 4, 6, 8]), a12 = alea([-4, -2, 2, 4]);
      const r1 = M.reelDe(x1, f1[2], f1[3]), r2 = M.reelDe(x2, f2[2], f2[3]);
      setDefi({ type, f1, f2, x1, x2, a0, a1, a2, a12, r1, r2, v: a0 + a1 * x1 + a2 * x2 + a12 * x1 * x2, reps: {}, verifie: false });
    } else {
      setDefi({ type, t: alea([1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000]), reps: {}, verifie: false });
      setX([0, 0, 0, 0, 0]);
    }
  }
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
    if (md === 'guide') setX([0, 0, 0, 0, 0]);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const setRepD = (c, v) => setDefi(d => ({ ...d, reps: { ...d.reps, [c]: v }, verifie: false }));
  const verifierDefi = () => {
    let ok = false, msg = '';
    if (defi.type === 'coef') {
      const v = lireNombre(defi.reps.a);
      const nom = defi.cible === 'AB' ? 'a₁₂' : defi.cible === 'A' ? 'a₁' : 'a₂';
      ok = isFinite(v) && Math.abs(v - defi.v) <= 0.06;
      msg = ok ? `✓ Correct : ${nom} = ${nbf(defi.v, 2)}.` : defi.cible === 'AB' ? '✗ Vérifiez : le coefficient d’interaction est la moyenne de (signe de A × signe de B × réponse) sur les 4 essais ; les signes de A·B sont +, −, −, + dans l’ordre du tableau.' : `✗ Vérifiez : le coefficient est (Moy⁺ − Moy⁻) / 2, les moyennes portant chacune sur 2 essais.`;
      noterC(ok);
    } else if (defi.type === 'predire') {
      const v = lireNombre(defi.reps.a);
      ok = isFinite(v) && Math.abs(v - defi.v) <= 0.06;
      msg = ok ? `✓ Correct : x₁ = ${nbf(defi.x1, 2)}, x₂ = ${nbf(defi.x2, 2)}, donc Ŷ = ${nbf(defi.v, 2)}.` : '✗ Vérifiez : calculez d’abord les niveaux codés x = (valeur − centre) / demi-étendue, puis Ŷ = a₀ + a₁x₁ + a₂x₂ + a₁₂x₁x₂.';
      noterP(ok);
    } else {
      ok = Math.abs(pred - defi.t) <= 150;
      msg = ok ? `✓ Correct : viscosité prévue ${nbf(pred, 0)}${NB}unités, dans la fenêtre demandée.` : `✗ La viscosité prévue est ${nbf(pred, 0)}${NB}unités : elle doit être entre ${defi.t - 150} et ${defi.t + 150}${NB}unités. Suivez les courbes isoréponses.`;
      noterI(ok);
    }
    setDefi(d => ({ ...d, verifie: true, ok, msg }));
  }

  // ---------- étapes ----------
  const ens = (a, b) => a.length === b.length && b.every(c => a.includes(c));
  const X1 = (id) => <><em>x</em><sub>{id}</sub></>;
  const A1 = (id) => <><em>a</em><sub>{id}</sub></>;
  const Y0 = <>Ŷ = <em>a</em><sub>0</sub> + <em>a</em><sub>R</sub><em>x</em><sub>R</sub> + <em>a</em><sub>T</sub><em>x</em><sub>T</sub> + <em>a</em><sub>C</sub><em>x</em><sub>C</sub></>;
  const liste = (...l) => <ul style={{ margin: '4px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>{l.map((t, i) => <li key={i}>{t}</li>)}</ul>;
  const yCible3000 = (3000 - (MOD_VISC.coefs[0] + MOD_VISC.coefs[1])) / (MOD_VISC.coefs[2] + MOD_VISC.coefs[3]);

  // ════════════════ PARCOURS DÉBUTANT (strictement le programme) ════════════════
  const ETAPES_DEB = [
    { id: 'facteurs', titre: 'Trois facteurs, deux niveaux', focus: ['scene'],
      texte: <>Un fabricant veut mettre au point un <strong>flan au chocolat</strong>. Il étudie trois <strong>facteurs</strong>, chacun à deux <strong>niveaux</strong> : la <strong>recette</strong> (matières premières animales ou végétales), la <strong>température de travail</strong> (75{NB}°C ou 102{NB}°C) et la <strong>vitesse de refroidissement</strong> (lente, par étapes ; ou rapide, au congélateur). Un <strong>plan factoriel complet</strong> teste toutes les combinaisons de niveaux.</>,
      tache: { type: 'qcm', q: 'Combien d’essais comporte un plan complet à 3 facteurs à 2 niveaux ?', options: ['8 essais : 2 × 2 × 2 combinaisons', '6 essais : 3 facteurs × 2 niveaux', '9 essais : 3 facteurs × 3 niveaux'], bonne: 0,
        expl: 'Chaque facteur a 2 niveaux : 2 × 2 × 2 = 2³ = 8 essais, un par sommet du cube.', indice: 'Pour chaque niveau du premier facteur, on teste les deux niveaux du deuxième, puis ceux du troisième.' } },
    { id: 'codage', titre: 'Coder les niveaux', focus: ['table', 'scene'],
      retenirTitre: 'À RETENIR : UN PLAN 2³', retenir: <><CarteCube/>{liste('k facteurs à 2 niveaux : 2ᵏ essais', 'niveaux codés : −1 (bas) et +1 (haut)', 'un essai = une ligne de la matrice d’expérience = un sommet du cube')}</>,
      texte: <>Pour calculer, on <strong>code</strong> les niveaux : <strong>−1</strong> pour le niveau bas, <strong>+1</strong> pour le niveau haut (recette animale −1, végétale +1 ; 75{NB}°C −1, 102{NB}°C +1 ; refroidissement lent −1, rapide +1). Chaque ligne du tableau est un essai : c’est la <strong>matrice d’expérience</strong>. Elle contient toutes les combinaisons possibles de niveaux.</>,
      tache: { type: 'qcm', q: 'Quel est le codage (R ; T ; C) de l’essai 6 : recette végétale, 75 °C, refroidissement rapide ?', options: ['(+1 ; −1 ; +1)', '(−1 ; +1 ; +1)', '(+1 ; +1 ; −1)'], bonne: 0,
        expl: 'Végétale = +1 ; 75 °C est le niveau bas = −1 ; rapide = +1.', indice: 'Animale −1 / végétale +1 ; 75 °C −1 / 102 °C +1 ; lent −1 / rapide +1.' } },
    { id: 'mesures', titre: 'Les notes du jury', focus: ['table', 'scene'],
      texte: <>Pour chaque essai, un jury a donné une <strong>note moyenne sur 10</strong> au flan obtenu. Les notes sont écrites sur chaque sommet du cube et dans la dernière colonne du tableau.</>,
      tache: { type: 'qcm', q: 'Quel essai a obtenu la meilleure note ?', options: ['l’essai 3', 'l’essai 1', 'l’essai 8'], bonne: 0,
        expl: 'L’essai 3 : 7 sur 10 (recette animale, 102 °C, refroidissement lent).', indice: 'Cherchez la plus grande valeur de la colonne « note ».' } },
    { id: 'moyennes', titre: 'Comparer deux moyennes', focus: ['scene', 'table'],
      texte: <>Pour mesurer l’effet de la <strong>recette</strong>, on compare deux moyennes. La première, <strong>Moy⁻</strong>, porte sur les 4 essais où la recette est animale (niveau −1 : face de gauche du cube, essais 1 à 4).</>,
      tache: { type: 'num', q: 'Moy⁻ : moyenne des notes des essais 1 à 4', unite: '/ 10', vrai: mR.moins, tol: 0.01, affiche: v => nbf(v, 2),
        calcul: () => ['Notes des essais 1 à 4 : 6,5 ; 6 ; 7 et 5,5.', 'Somme : 25 ; moyenne : 25 / 4 = 6,25.'], pieges: [[25, 'C’est la somme des quatre notes. Divisez par 4 pour obtenir la moyenne.']],
        expl: '(6,5 + 6 + 7 + 5,5) / 4 = 6,25.', indice: 'Moyenne = somme des notes ÷ nombre d’essais (4).' } },
    { id: 'coefficient', titre: 'Le coefficient d’un facteur', focus: ['scene', 'table'],
      texte: <>Les deux moyennes sont maintenant connues : <strong>Moy⁻</strong> = 6,25 (recette animale, essais 1 à 4, calculée à l’étape précédente) et <strong>Moy⁺</strong> = 2,375 (recette végétale, essais 5 à 8). Le <strong>coefficient</strong> de la recette dans le modèle est la demi-différence des deux moyennes : {A1('R')} = (Moy⁺ − Moy⁻) / 2. Il indique de combien la note s’écarte de la moyenne générale quand la recette passe au niveau +1.</>,
      tache: { type: 'num', q: 'Coefficient aR de la recette', unite: '/ 10', vrai: A_R, tol: 0.02, affiche: v => nbf(v, 2),
        calcul: () => ['Moy⁻ = 6,25 et Moy⁺ = 2,375.', 'aR = (2,375 − 6,25) / 2 = −3,875 / 2 = −1,94.'],
        pieges: [[-3.875, 'Vous n’avez pas divisé par 2 : le coefficient est la demi-différence.'], [1.9375, 'Attention au signe : c’est Moy⁺ − Moy⁻ = 2,375 − 6,25, qui est négatif.']],
        expl: '(2,375 − 6,25) / 2 = −1,94 : passer à la recette végétale fait baisser la note.', indice: 'a = (Moy⁺ − Moy⁻) / 2 ; ici la différence est négative.' } },
    { id: 'autres', titre: 'Comparer les trois facteurs', focus: ['effets'],
      retenirTitre: 'À RETENIR : LE COEFFICIENT D’UN FACTEUR', retenir: <><CarteEffet/>{liste('coefficient = (Moy⁺ − Moy⁻) / 2', 'signe : sens de variation de la réponse quand on passe de −1 à +1', 'valeur absolue : importance du facteur')}</>,
      texte: <>Le logiciel calcule de même les deux autres coefficients : {A1('T')} = +0,19 pour la température et {A1('C')} = −0,19 pour le refroidissement. Le diagramme montre les trois coefficients.</>,
      tache: { type: 'qcm', q: 'Quel facteur influence le plus la note ?', options: ['La recette : |−1,94| est le plus grand', 'La température, dont le coefficient est positif', 'Le refroidissement, dont le coefficient est négatif'], bonne: 0,
        expl: 'On compare les valeurs absolues : 1,94 est bien plus grand que 0,19. Le signe donne le sens de variation, pas l’importance.', indice: 'L’importance d’un facteur se lit sur la valeur absolue de son coefficient.' } },
    { id: 'a0', titre: 'Le modèle', focus: ['table'],
      texte: <>Le <strong>modèle</strong> prévoit la note à partir des niveaux codés : {Y0}. Le terme constant {A1('0')} est la <strong>moyenne des 8 notes</strong>.</>,
      tache: { type: 'num', q: 'a₀ : moyenne des 8 notes', unite: '/ 10', vrai: A0, tol: 0.01, affiche: v => nbf(v, 2),
        calcul: () => ['Somme des 8 notes : 6,5 + 6 + 7 + 5,5 + 2 + 2 + 2,5 + 3 = 34,5.', 'a₀ = 34,5 / 8 = 4,31.'], pieges: [[34.5, 'C’est la somme des notes. Divisez par 8.']],
        expl: '34,5 / 8 = 4,31.', indice: 'Moyenne = somme des 8 notes ÷ 8.' } },
    { id: 'predire', titre: 'Prévoir une note', focus: ['table'],
      texte: <>Le modèle est complet : Ŷ = 4,31 − 1,94 {X1('R')} + 0,19 {X1('T')} − 0,19 {X1('C')}. Prévoyez la note d’un flan fabriqué avec la <strong>recette végétale</strong>, à <strong>102{NB}°C</strong>, avec un <strong>refroidissement lent</strong>.</>,
      tache: { type: 'num', q: 'Note prévue Ŷ', unite: '/ 10', vrai: 2.75, tol: 0.03, affiche: v => nbf(v, 2),
        calcul: () => ['Codage : végétale xR = +1 ; 102 °C xT = +1 ; lent xC = −1.', 'Ŷ = 4,31 − 1,94 × (+1) + 0,19 × (+1) − 0,19 × (−1)', 'Ŷ = 4,31 − 1,94 + 0,19 + 0,19 = 2,75.'],
        pieges: [[2.37, 'Le refroidissement lent est le niveau −1 : xC = −1, donc −0,19 × (−1) = +0,19.']],
        expl: 'Ŷ = 2,75 sur 10.', indice: 'Remplacez chaque x par son niveau codé, +1 ou −1.' } },
    { id: 'ecart', titre: 'Le modèle est-il fidèle ?', focus: ['table'],
      retenirTitre: 'À RETENIR : PRÉVOIR AVEC LE MODÈLE', retenir: <><CarteModele/>{liste('on part de la moyenne a₀ puis on ajoute, pour chaque facteur, coefficient × niveau codé', 'le modèle ne vaut que dans le domaine : niveaux entre −1 et +1')}</>,
      texte: <>Les niveaux (+1 ; +1 ; −1) sont ceux de l’<strong>essai 7</strong>, dont la note mesurée est <strong>2,5</strong>. La note prévue par le modèle à l’étape précédente était <strong>2,75</strong>. On compare la valeur prévue à la valeur mesurée.</>,
      tache: { type: 'num', q: 'Écart prévu − mesuré pour l’essai 7', unite: '/ 10', vrai: 0.25, tol: 0.1, affiche: v => nbf(v, 2),
        calcul: () => ['Note prévue : 2,75 ; note mesurée : 2,5.', 'Écart : 2,75 − 2,5 = 0,25 point.'],
        expl: 'L’écart de 0,25 point est faible devant l’étendue des notes (de 2 à 7) : le modèle décrit bien cet essai. Avec une seule mesure par essai, on ne peut pourtant pas dire si cet écart est du bruit de mesure ou un défaut du modèle.', indice: 'Écart = valeur prévue − valeur mesurée.' } },
    { id: 'optimiser', titre: 'Chercher la meilleure note', focus: ['prevision'],
      texte: <>Réglez les <strong>curseurs</strong> pour trouver les niveaux des trois facteurs qui donnent la <strong>meilleure note prévue</strong>. Lisez la note prévue dans le cadre « Niveaux des facteurs ». Aidez-vous du signe des coefficients.</>,
      tache: { type: 'action', ok: Math.abs(x[0] + 1) < 0.11 && Math.abs(x[1] - 1) < 0.11 && Math.abs(x[2] + 1) < 0.11, label: 'Placer les curseurs pour moi', faire: () => setX([-1, 1, -1, 0, 0]), consigne: 'Réglez les curseurs sur la meilleure note prévue' } },
    { id: 'visc', titre: 'Une deuxième réponse : la viscosité', focus: ['scene', 'table'],
      texte: <>Le fabricant a aussi mesuré la <strong>viscosité à bas gradient</strong> de chaque flan (en unités du viscosimètre) : elle doit rester élevée pour que le flan tienne. Elle s’ajoute au cube et au tableau. Calculez la moyenne des essais où la recette est <strong>végétale</strong> et la température de <strong>102{NB}°C</strong> (essais 7 et 8).</>,
      tache: { type: 'num', q: 'Viscosité moyenne, recette végétale à 102 °C', unite: '', vrai: 5476, tol: 0.01, affiche: v => nbf(v, 0),
        calcul: () => ['Essais 7 et 8 : 5 863 et 5 089.', 'Moyenne : (5 863 + 5 089) / 2 = 5 476.'], pieges: [[10952, 'C’est la somme des deux viscosités. Divisez par 2.']],
        expl: '(5 863 + 5 089) / 2 = 5 476.', indice: 'Moyenne des viscosités des essais 7 et 8.' } },
    { id: 'interaction', titre: 'Lire une interaction', focus: ['inter'],
      texte: <>Le graphique montre la viscosité moyenne selon la recette, avec <strong>une droite par niveau de température</strong>. Chaque point est la moyenne de 2 essais (par exemple 5 476 pour la recette végétale à 102{NB}°C).</>,
      tache: { type: 'qcm', q: 'Que signifie le fait que les deux droites ne soient pas parallèles ?', options: ['L’effet de T dépend de la recette', 'La température n’a aucun effet sur la viscosité', 'Les mesures contiennent des erreurs de lecture'], bonne: 0,
        expl: 'Si l’effet de la température était le même avec les deux recettes, les droites seraient parallèles. Ici, passer de 75 à 102 °C augmente la viscosité de 2 370 avec la recette animale et de 5 276 avec la végétale : les deux facteurs interagissent.', indice: 'Comparez la pente des deux droites : sont-elles identiques ?' } },
    { id: 'iso', titre: 'Courbes isoréponses', focus: ['iso', 'prevision'],
      retenirTitre: 'À RETENIR : LES INTERACTIONS', retenir: <><CarteInter/>{liste('droites parallèles : pas d’interaction', 'droites non parallèles : l’effet d’un facteur dépend du niveau de l’autre', 'dans le modèle : produit des deux colonnes, coefficient aRT')}</>,
      texte: <>Le modèle de la viscosité contient l’<strong>interaction</strong> recette × température : Ŷ = {A1('0')} + {A1('R')}{X1('R')} + {A1('T')}{X1('T')} + {A1('RT')}{X1('R')}{X1('T')}. Les <strong>courbes isoréponses</strong> relient les points de même viscosité prévue. Placez le point sur la courbe <strong>3{NB}000</strong>, au bord « recette végétale » ({X1('R')} = +1) : la recette est un facteur qualitatif, seuls les bords de la carte sont de vrais flans. Lisez ensuite la température sur le curseur.</>,
      tache: { type: 'action', ok: Math.abs(x[0] - 1) <= 0.06 && Math.abs(pred - 3000) <= 150, label: 'Placer le point pour moi', faire: () => setX([1, yCible3000, 0, 0, 0]), consigne: 'Point sur la courbe 3 000, au bord recette végétale (xR = +1)' } },
    { id: 'choix', titre: 'Choisir un compromis', focus: ['table'],
      texte: <>Le flan idéal combine une <strong>bonne note</strong> et une <strong>viscosité élevée</strong>. Comparez les deux dernières colonnes du tableau.</>,
      tache: { type: 'qcm', q: 'Quel essai est le meilleur compromis ?', options: ['l’essai 3 : meilleure note, viscosité élevée', 'l’essai 7 : viscosité maximale, mais note faible', 'l’essai 1 : note correcte, viscosité élevée'], bonne: 0,
        expl: 'L’essai 3 (recette animale, 102 °C, refroidissement lent) a la meilleure note (7) et une viscosité de 5 403, proche du maximum (5 863 à l’essai 7, noté 2,5 seulement).', indice: 'Cherchez un essai bien placé dans les deux colonnes.' } },
    { id: 'bilan', titre: 'Bilan', focus: ['scene'],
      texte: <>Vous savez coder les niveaux d’un plan 2³, calculer le coefficient d’un facteur, écrire et utiliser le modèle, lire un graphique d’interaction et chercher une formule avec des courbes isoréponses. Le niveau <strong>confirmé</strong> traite 4 facteurs (16 essais) : degrés de liberté, diagramme de Pareto, réduction du modèle.</>, tache: null },
  ];

  // ════════════════ PARCOURS CONFIRMÉ : vinaigrette 2⁴ ════════════════
  const ETAPES_CONF = [
    { id: 'essais', titre: 'Quatre facteurs', focus: ['facteurs'],
      texte: <>On veut mettre au point une <strong>vinaigrette allégée</strong> stable et agréable. Quatre facteurs sont étudiés, chacun à deux niveaux (tableau) : le <strong>sel</strong> (S), la <strong>gomme xanthane</strong> (X), l’<strong>amidon Ultratech</strong> (U) et l’<strong>amidon Novation</strong> (N). La réponse est la <strong>note du jury</strong> sur 10.</>,
      tache: { type: 'num', q: 'Nombre d’essais du plan complet', unite: 'essais', vrai: 16, tol: 0, affiche: v => nbf(v, 0),
        calcul: () => ['4 facteurs à 2 niveaux : 2 × 2 × 2 × 2 = 2⁴ = 16 essais.'], pieges: [[8, 'C’est 2 × 4. Le nombre d’essais est 2 puissance 4 : 2 × 2 × 2 × 2.']],
        expl: '2⁴ = 16 essais.', indice: 'k facteurs à 2 niveaux : 2 puissance k essais.' } },
    { id: 'matrice', titre: 'La matrice d’expérience', focus: ['table'],
      texte: <>La matrice compte 16 lignes : le dernier facteur, N, change de niveau à chaque ligne. Les notes du jury sont dans la dernière colonne.</>,
      tache: { type: 'qcm', q: 'Dans l’essai 11, quel est le niveau de l’amidon Novation (N) ?', options: ['0 g (niveau −1)', '1 g (niveau +1)', '2,2 g (niveau +1)'], bonne: 0,
        expl: 'N, dernier facteur, alterne −1, +1 à chaque ligne : les lignes impaires (dont la 11) ont N = −1, soit 0 g.', indice: 'N change à chaque ligne, en commençant par −1.' } },
    { id: 'effetN', titre: 'L’effet de Novation', focus: ['table'],
      texte: <>Comme pour un plan 2³, le coefficient d’un facteur est la demi-différence de deux moyennes, chacune sur 8 essais. Pour Novation : Moy⁺ (N = +1) = 7,34 et Moy⁻ (N = −1) = 3,76.</>,
      tache: { type: 'num', q: 'Coefficient aN de l’amidon Novation', unite: '/ 10', vrai: M.coefTerme(J.vin4.X, Y4, [3]), tol: 0.02, affiche: v => nbf(v, 2),
        calcul: () => ['aN = (Moy⁺ − Moy⁻) / 2 = (7,34 − 3,76) / 2', 'aN = 3,58 / 2 = 1,79.'], pieges: [[3.58, 'Vous n’avez pas divisé par 2.']],
        expl: 'Ajouter de l’amidon Novation augmente la note de 1,79 point en moyenne, par rapport à la moyenne générale.', indice: 'a = (Moy⁺ − Moy⁻) / 2.' } },
    { id: 'inter', titre: 'Une interaction', focus: ['inter'],
      texte: <>Le graphique montre la note moyenne selon l’amidon Ultratech (U), avec une droite par niveau de Novation (N).</>,
      tache: { type: 'qcm', q: 'Quand N = 1 g, passer de U = 0,9 g à 2,2 g fait…', options: ['baisser légèrement la note', 'augmenter fortement la note', 'ne rien changer du tout'], bonne: 0,
        expl: 'Avec N = 1 g, la note passe de 7,63 à 7,05 : elle baisse légèrement. Avec N = 0, elle passait de 2,4 à 5,1 : l’effet de U dépend de N, c’est l’interaction U·N.', indice: 'Lisez la droite correspondant à N = +1.' } },
    { id: 'pareto', titre: 'Le diagramme de Pareto', focus: ['effets'],
      texte: <>Le logiciel calcule les <strong>15 coefficients</strong> du modèle complet : 4 effets principaux, 6 interactions d’ordre 2, 4 d’ordre 3 et 1 d’ordre 4. Le <strong>diagramme de Pareto</strong> les range par valeur absolue décroissante.</>,
      tache: { type: 'qcm', q: 'Quels sont les quatre plus grands coefficients (en valeur absolue) ?', options: ['N, X, U·N et U', 'N, X, S et X·U', 'S, X·U, S·N et X·N'], bonne: 0,
        expl: 'N (1,79), X (0,95), U·N (−0,83) et U (0,54). Tous les autres sont inférieurs à 0,08 en valeur absolue.', indice: 'Cherchez les barres les plus longues, quel que soit leur sens.' } },
    { id: 'ddl', titre: 'Les degrés de liberté', focus: ['effets'],
      texte: <>Un modèle à <em>p</em> coefficients (constante comprise) ajusté sur <em>n</em> essais laisse <strong>ddl = n − p</strong> degrés de liberté. Le modèle complet a 16 coefficients : ddl = 0, il passe par tous les points et on ne peut rien tester. On garde donc la constante et les 4 plus grands termes (N, X, U, U·N) : le modèle réduit a <strong>p = 5</strong> coefficients, ajustés sur <strong>n = 16</strong> essais.</>,
      tache: { type: 'num', q: 'Degrés de liberté du modèle réduit', unite: 'ddl', vrai: 11, tol: 0, affiche: v => nbf(v, 0),
        calcul: () => ['p = 5 coefficients : la constante, N, X, U et U·N.', 'ddl = 16 − 5 = 11.'], pieges: [[12, 'N’oubliez pas la constante : elle fait partie des coefficients (p = 5).']],
        expl: '16 − 5 = 11 degrés de liberté : il reste de quoi estimer la dispersion et tester.', indice: 'ddl = nombre d’essais − nombre de coefficients, constante comprise.' } },
    { id: 'seuil', titre: 'Un seuil de significativité', focus: ['effets'],
      retenirTitre: 'À RETENIR : DEGRÉS DE LIBERTÉ', retenir: <><CarteDdl/>{liste('ddl = nombre d’essais − nombre de coefficients', 'ddl = 0 : le modèle passe par tous les points, aucun test', 'réduire le modèle redonne des degrés de liberté')}</>,
      texte: <>Pour savoir si un coefficient se distingue du bruit, on le compare à son incertitude. Le logiciel donne l’écart-type résiduel du modèle réduit : <em>s</em> = 0,155. On le traite comme l’écart-type σ des mesures (hypothèse de travail : erreurs normales, indépendantes, de même écart-type). Un coefficient est une moyenne de 16 termes : son intervalle de confiance à 95 % est ± 1,96 σ / √16.</>,
      tache: { type: 'num', q: 'Demi-largeur de l’intervalle de confiance', unite: '', vrai: SEUIL4, tol: 0.03, affiche: v => nbf(v, 3),
        calcul: () => ['1,96 × 0,155 / √16 = 1,96 × 0,155 / 4', '= 0,076.'], pieges: [[0.304, 'Vous n’avez pas divisé par √16 = 4.'], [0.152, 'Vous avez divisé par 2 au lieu de √16 = 4.']],
        expl: '± 0,076 : un coefficient dont la valeur absolue est inférieure à 0,076 ne se distingue pas du bruit.', indice: 'Demi-largeur = 1,96 × σ ÷ √n, avec n = 16.' } },
    { id: 'reduire', titre: 'Réduire le modèle', focus: ['termes', 'effets'],
      texte: <>Le seuil ± 0,076 est tracé en pointillés rouges. Dans « Termes du modèle », ne gardez que les coefficients dont la <strong>valeur absolue dépasse le seuil</strong> : cliquez sur un terme pour le garder ou l’écarter.</>,
      tache: { type: 'action', ok: ens(kept.vin4, CIBLE_CONF), label: 'Garder les termes significatifs', faire: () => setKept(kp => ({ ...kp, vin4: CIBLE_CONF })), consigne: 'Gardez uniquement les termes dont |coefficient| > 0,076' } },
    { id: 'prevoir', titre: 'Prévoir avec le modèle réduit', focus: ['effets'],
      retenirTitre: 'À RETENIR : CLASSER PUIS TRIER LES EFFETS', retenir: <><CartePareto/>{liste('classer les coefficients par valeur absolue (Pareto)', 'garder ceux qui dépassent nettement le bruit', 'un modèle réduit laisse des degrés de liberté pour le tester')}</>,
      texte: <>Le modèle réduit s’écrit Ŷ = 5,55 + 0,95 {X1('X')} + 0,54 {X1('U')} + 1,79 {X1('N')} − 0,83 {X1('U')}{X1('N')}. Prévoyez la note pour <strong>0,4{NB}g de xanthane, 1,55{NB}g d’Ultratech et 1{NB}g de Novation</strong>. La valeur codée est x = (valeur − centre) / demi-étendue, le centre étant la moyenne des deux niveaux.</>,
      tache: { type: 'num', q: 'Note prévue Ŷ', unite: '/ 10', vrai: M.predit(MOD4.coefs, MOD4.ts, [0, 1, 0, 1]), tol: 0.015, affiche: v => nbf(v, 2),
        calcul: () => ['Codage : X = 0,4 g → +1 ; U = 1,55 g est le centre (0,9 + 2,2) / 2 → 0 ; N = 1 g → +1.', 'Ŷ = 5,55 + 0,95 × 1 + 0,54 × 0 + 1,79 × 1 − 0,83 × 0 × 1', 'Ŷ = 8,29.'],
        pieges: [[8.0, 'U = 1,55 g est exactement le centre : sa valeur codée est 0, pas +1.']],
        expl: 'Ŷ = 8,29 sur 10. Comme U est au centre, ni U ni U·N ne contribuent.', indice: 'x = (valeur − centre) / demi-étendue. Pour U : centre 1,55 g, demi-étendue 0,65 g.' } },
    { id: 'optimum', titre: 'Chercher le meilleur compromis', focus: ['iso', 'prevision'],
      texte: <>Cherchez la formule de <strong>meilleure note prévue</strong> (au moins 8,5). La carte montre la note prévue selon l’amidon Ultratech et l’amidon Novation ; la xanthane se règle au curseur. Les courbes ne sont pas des droites : c’est l’effet de l’interaction U·N.</>,
      tache: { type: 'action', ok: pred >= 8.5, label: 'Placer le point pour moi', faire: () => setX([0, 1, -1, 1, 0]), consigne: 'Placez le point où la note prévue atteint au moins 8,5' } },
    { id: 'bilan', titre: 'Bilan', focus: ['effets'],
      texte: <>Vous savez construire et lire un plan 2⁴, classer les effets avec un diagramme de Pareto, compter les degrés de liberté, fixer un seuil de significativité et réduire le modèle avant de prévoir. Le niveau <strong>expert</strong> montre comment économiser des essais avec un plan fractionnaire, et ce que cela coûte.</>, tache: null },
  ];

  // ════════════════ PARCOURS EXPERT : fraction 2⁵⁻¹ (hors programme) ════════════════
  const ETAPES_EXP = [
    { id: 'fraction', titre: 'Économiser des essais', focus: ['facteurs'],
      texte: <>On ajoute un cinquième facteur à la vinaigrette : l’<strong>agitation</strong> (A : Ultra-Turrax ou turbine), avec le sel (B), la xanthane (C), l’amidon Ultratech (D) et l’amidon Novation (E). Le plan complet comporterait 2⁵ essais. Pour économiser, on n’en réalise que la <strong>moitié</strong> : c’est un plan <strong>fractionnaire 2⁵⁻¹</strong> (hors programme).</>,
      tache: { type: 'num', q: 'Nombre d’essais du plan complet à 5 facteurs', unite: 'essais', vrai: 32, tol: 0, affiche: v => nbf(v, 0),
        calcul: () => ['2 × 2 × 2 × 2 × 2 = 2⁵ = 32 essais.'], pieges: [[10, 'C’est 2 × 5. Le nombre d’essais est 2 puissance 5.']],
        expl: '2⁵ = 32 essais ; la fraction en comporte 16.', indice: 'k facteurs à 2 niveaux : 2 puissance k essais.' } },
    { id: 'alias', titre: 'Un plan construit, pas choisi au hasard', focus: ['table'],
      texte: <>Les 16 essais retenus vérifient <strong>E = A·B·C·D</strong> : la colonne de E est le produit des quatre autres (vérifiez-le dans le tableau). Conséquence : des effets sont <strong>confondus</strong> (alias). En multipliant la relation par E, on obtient <strong>I = A·B·C·D·E</strong> ; un effet est confondu avec le terme formé des facteurs qui n’en font pas partie.</>,
      tache: { type: 'qcm', q: 'Avec quel terme l’interaction D·E est-elle confondue ?', options: ['A·B·C', 'A·B·D', 'C·D·E'], bonne: 0,
        expl: 'D·E multiplié par A·B·C·D·E donne A·B·C : les facteurs D et E se simplifient. On ne peut pas distinguer l’effet de D·E de celui de A·B·C.', indice: 'Quels facteurs ne figurent pas dans D·E ?' } },
    { id: 'resolution', titre: 'La résolution', focus: ['table'],
      texte: <>Un plan fractionnaire est caractérisé par sa <strong>résolution</strong>. Ici, résolution V : un effet principal est confondu avec une interaction d’ordre 4, une interaction d’ordre 2 avec une d’ordre 3. On <strong>suppose</strong> les interactions d’ordre 3 et plus négligeables : les effets principaux et les interactions d’ordre 2 sont alors lisibles. Un plan de résolution III (8 essais) confondrait les effets principaux avec des interactions d’ordre 2.</>,
      tache: { type: 'qcm', q: 'Que garantit la résolution V ?', options: ['Principaux ↔ ordre 4 ; ordre 2 ↔ ordre 3', 'Les effets principaux sont confondus entre eux', 'Les interactions d’ordre 2 sont confondues entre elles'], bonne: 0,
        expl: 'En résolution V, aucun effet principal ni aucune interaction d’ordre 2 n’est confondu avec un autre du même type. L’hypothèse (interactions d’ordre 3 et plus négligeables) reste à discuter.', indice: 'La résolution V est la somme des ordres de deux termes confondus : 1 + 4 = 2 + 3 = 5.' } },
    { id: 'coefs', titre: 'Les coefficients estimables', focus: ['table'],
      retenirTitre: 'À RETENIR : PLAN FRACTIONNAIRE', retenir: <><CarteFraction/>{liste('2⁵⁻¹ : la moitié des essais d’un plan complet', 'relation de définition I = A·B·C·D·E', 'résolution V : effets principaux et interactions d’ordre 2 lisibles si l’ordre 3 est négligeable')}</>,
      texte: <>Le logiciel estime 15 coefficients : 5 effets principaux et 10 interactions d’ordre 2. Pour E : Moy⁺ (E = +1) = 7,375 et Moy⁻ (E = −1) = 4,125, sur 8 essais chacune.</>,
      tache: { type: 'num', q: 'Coefficient aE de l’amidon Novation', unite: '/ 10', vrai: M.coefTerme(J.vin5.X, Y5, [4]), tol: 0.02, affiche: v => nbf(v, 3),
        calcul: () => ['aE = (7,375 − 4,125) / 2 = 3,25 / 2 = 1,625.'], pieges: [[3.25, 'Vous n’avez pas divisé par 2.']],
        expl: 'aE = 1,625. Les plus grands coefficients sont D·E (−2), E, C·E et D.', indice: 'a = (Moy⁺ − Moy⁻) / 2.' } },
    { id: 'ddl', titre: 'Zéro degré de liberté', focus: ['effets'],
      texte: <>Le diagramme range les 15 coefficients estimables : les plus grands sont D·E, E, C·E, D et C. Le modèle complet a 1 constante + 5 effets principaux + 10 interactions = <strong>16 coefficients</strong> pour 16 essais.</>,
      tache: { type: 'num', q: 'Degrés de liberté du modèle complet', unite: 'ddl', vrai: 0, tol: 0, affiche: v => nbf(v, 0),
        calcul: () => ['ddl = 16 − 16 = 0.'], pieges: [[16, 'Vous avez donné le nombre d’essais. ddl = essais − coefficients.']],
        expl: 'Avec 0 ddl, le modèle passe exactement par les 16 points : pas d’écart-type résiduel, donc ni intervalle de confiance ni p-value. Il faut réduire le modèle.', indice: 'ddl = n − p avec n = 16 et p = 16.' } },
    { id: 'reduire', titre: 'Réduire le modèle', focus: ['termes', 'effets'],
      texte: <>Gardez les cinq plus grands coefficients du diagramme, en respectant la <strong>hiérarchie</strong> : une interaction n’est gardée que si ses deux effets principaux le sont.</>,
      tache: { type: 'action', ok: ens(kept.vin5, CIBLE_EXP), label: 'Garder ces termes', faire: () => setKept(kp => ({ ...kp, vin5: CIBLE_EXP })), consigne: 'Gardez D·E, E, C·E, D et C' } },
    { id: 'student', titre: 'Intervalle de confiance de Student', focus: ['effets'],
      texte: <>Le modèle réduit a 6 coefficients : ddl = 16 − 6 = 10, et un écart-type résiduel <em>s</em> = 0,65. L’écart-type σ n’est plus connu : on utilise la loi de <strong>Student</strong> à 10 ddl (<em>t</em> = 2,23). L’incertitude d’un coefficient est <em>t</em> · <em>s</em> / √<em>n</em>, avec <em>n</em> = 16.</>,
      tache: { type: 'num', q: 'Demi-largeur de l’intervalle de confiance à 95 %', unite: '', vrai: 2.23 * 0.65 / 4, tol: 0.03, affiche: v => nbf(v, 2),
        calcul: () => ['2,23 × 0,65 / √16 = 2,23 × 0,65 / 4', '= 0,36.'], pieges: [[1.45, 'Vous n’avez pas divisé par √16 = 4.']],
        expl: '± 0,36 : les barres d’erreur sont maintenant tracées sur le diagramme.', indice: 't × s ÷ √n, avec n = 16.' } },
    { id: 'verif', titre: 'Contrôler le modèle', focus: ['effets', 'table'],
      retenirTitre: 'À RETENIR : EFFET SIGNIFICATIF', retenir: <><CarteSignif/>{liste('intervalle de confiance qui contient 0 : effet non significatif', 'ici : C, D, E, C·E et D·E sont significatifs, A et B ne le sont pas', 'le test suppose des erreurs normales et indépendantes')}</>,
      texte: <>Les cinq termes gardés sortent du bruit : leur intervalle ne contient pas 0 ; A et B n’agissent pas. Le modèle réduit s’écrit Ŷ = 5,75 + 0,5 {X1('C')} + 0,625 {X1('D')} + 1,625 {X1('E')} − 1,375 {X1('C')}{X1('E')} − 2 {X1('D')}{X1('E')}. On le contrôle sur l’<strong>essai 16</strong>, tous les facteurs au niveau haut : sa note mesurée est <strong>4</strong>.</>,
      tache: { type: 'num', q: 'Note prévue pour l’essai 16 (tous les niveaux à +1)', unite: '/ 10', vrai: M.predit(MOD5.coefs, MOD5.ts, [1, 1, 1, 1, 1]), tol: 0.02, affiche: v => nbf(v, 2),
        calcul: () => ['Ŷ = a₀ + aC + aD + aE + aCE + aDE, tous les x valant +1.', 'Ŷ = 5,75 + 0,5 + 0,625 + 1,625 − 1,375 − 2 = 5,125.'], pieges: [[11.875, 'Les coefficients d’interaction négatifs doivent être retranchés : −1,375 et −2.']],
        expl: 'Prévu 5,1 contre 4 mesuré : écart −1,1, soit environ 1,7 fois s, plus que tous les autres résidus (0,9 au plus). Le modèle réduit est un peu juste pour cet essai.', indice: 'Additionnez la constante et les cinq coefficients, chacun multiplié par 1.' } },
    { id: 'optimum', titre: 'Chercher la meilleure formule', focus: ['iso', 'prevision'],
      texte: <>Cherchez la combinaison de C, D et E de <strong>meilleure note prévue</strong> (au moins 9,5). La carte montre D et E ; C se règle au curseur. Observez le rôle des interactions D·E et C·E.</>,
      tache: { type: 'action', ok: pred >= 9.5, label: 'Placer le point pour moi', faire: () => setX([0, 0, -1, -1, 1]), consigne: 'Placez le point où la note prévue atteint au moins 9,5' } },
    { id: 'hypotheses', titre: 'Les limites de l’analyse', focus: ['effets'],
      texte: <>Les intervalles de Student supposent des erreurs <strong>normales, indépendantes et de même écart-type</strong>. Ici, il n’y a qu’une mesure par essai : <em>s</em> n’est pas une vraie répétabilité (il mêle le bruit de mesure et les défauts du modèle), et les notes d’un jury sont bornées entre 0 et 10.</>,
      tache: { type: 'qcm', q: 'Que conclure sur les intervalles de confiance obtenus ?', options: ['À prendre comme un ordre de grandeur', 'Ils sont exacts : Student corrige tout défaut', 'Ils sont faux : on ne peut jamais utiliser Student'], bonne: 0,
        expl: 'Les intervalles donnent un ordre de grandeur ; pour conclure, il faudrait répéter des essais (essai central, répétitions) afin d’estimer la vraie dispersion.', indice: 'Que contient s, quand on n’a fait aucune répétition ?' } },
    { id: 'bilan', titre: 'Bilan', focus: ['effets'],
      texte: <>Vous savez construire et lire un plan fractionnaire 2⁵⁻¹, repérer les alias et la résolution, compter les degrés de liberté, réduire le modèle, utiliser la loi de Student et discuter les hypothèses du test.</>, tache: null },
  ];
  const ETAPES = conf ? ETAPES_CONF : exp ? ETAPES_EXP : ETAPES_DEB;
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ---------- panneaux ----------
  const titreP = t => <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>{t}</div>;
  const fmtRep = v => (rep.id === 'note' ? `${nbf(v, 2)}${NB}/${NB}10` : `${nbf(v, 0)}${NB}unités`);
  const cubeBox = vCube && (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      {titreP(`Les 8 essais du plan 2³${vNotes ? ` : ${rep.id === 'note' ? 'note du jury' : 'viscosité'}` : ''}`)}
      <CubeVue X={jd.X} y={vNotes ? y : null} dec={rep.dec} facteurs={jd.facteurs} surligne={surligneMoy}/>
    </div>);
  const facteursBox = vFacteurs && (
    <div style={{ ...styleBoite, ...cadre('facteurs') }}>
      {titreP(`${jd.titre} : facteurs et niveaux`)}
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13.5 }}>
        <thead><tr style={{ color: KIT.txt2, fontSize: 12.5 }}><th style={{ textAlign: 'left' }}> </th><th style={{ textAlign: 'left' }}>facteur</th><th>niveau −1</th><th>niveau +1</th></tr></thead>
        <tbody>{jd.facteurs.map(f => <tr key={f.id} style={{ borderTop: `1px dashed ${KIT.bord}` }}><td style={{ fontWeight: 800, padding: '3px 4px' }}>{f.id}</td><td>{f.court || f.nom}</td><td style={{ textAlign: 'center' }}>{lib(f).bas}</td><td style={{ textAlign: 'center' }}>{lib(f).haut}</td></tr>)}</tbody>
      </table>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Réponse : {jd.reponses.map(r => r.nom).join(' et ')}. {jd.plan}{jd.generateur ? `, avec ${jd.generateur}` : ''}.</div>
    </div>);
  const tableBox = vTable && (
    <div style={{ ...styleBoite, ...cadre('table') }}>
      {titreP(`Matrice d’expérience : ${jd.plan}`)}
      <TableMatrice jd={jd} ris={vNotes ? (enGuide && dev ? (des('visc') ? [0, 1] : [0]) : jd.reponses.map((r, q) => q)) : []} modele={vPrevTab ? prevX : null} ri={ri} resid={vPrevTab} alias={enGuide && exp}/>
      {enExplo && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Chaque ligne est un essai (−1 = niveau bas, +1 = niveau haut). « Prévu » : valeur du modèle choisi ; « écart » : mesuré − prévu.</div>}
    </div>);
  const effetsBox = vEffets && (
    <div style={{ ...styleBoite, ...cadre('effets') }}>
      {titreP(`Coefficients du modèle complet${jeu === 'vin5' ? ' (effets principaux et interactions d’ordre 2)' : ''}`)}
      <EffetsVue items={trie.map(({ nom, v }) => ({ nom, v }))} seuil={icAff} ic={icBarre} titre={TITRES_CHART[rep.id]} surlignes={surlignes} dec={rep.id === 'note' ? 2 : 0}/>
      {icBarre != null && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Trait noir : intervalle de confiance à 95 % (± {nbf(icBarre, 2)}). Un coefficient dont l’intervalle contient 0 n’est pas significatif.</div>}
      {surlignes.length > 0 && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Termes grisés : écartés du modèle.</div>}
    </div>);
  const interBox = vInter && (
    <div style={{ ...styleBoite, ...cadre('inter') }}>
      {titreP(`Interaction ${jd.facteurs[paire[0]].court || jd.facteurs[paire[0]].nom} × ${jd.facteurs[paire[1]].court || jd.facteurs[paire[1]].nom}`)}
      <InterVue X={jd.X} y={y} i={paire[0]} j={paire[1]} facteurs={jd.facteurs} dec={rep.dec} unite={rep.id === 'note' ? 'note sur 10' : 'viscosité'}/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Chaque point est la moyenne des essais correspondants. Droites parallèles : pas d’interaction.</div>
    </div>);
  const f2 = (a, b) => { const v = [...xx]; v[paire[0]] = a; v[paire[1]] = b; return M.predit(fit.coefs, fit.ts, v); };
  const niveauxIso = (NIVEAUX_ISO[jeu][ri] || NIVEAUX_ISO[jeu][0]);
  const isoBox = vIso && (
    <div style={{ ...styleBoite, ...cadre('iso') }}>
      {titreP(`Courbes isoréponses : ${rep.id === 'note' ? 'note prévue' : 'viscosité prévue'}`)}
      <IsoVue f={f2} niveaux={niveauxIso} point={[x[paire[0]], x[paire[1]]]} onPoint={([a, b]) => setX(v => v.map((u, q) => (q === paire[0] ? a : q === paire[1] ? b : u)))} i={paire[0]} j={paire[1]} facteurs={jd.facteurs} dec={0}/>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Faites glisser le point. Chaque courbe relie les niveaux des deux facteurs qui donnent la même réponse prévue ; les autres facteurs sont réglés par les curseurs.</div>
    </div>);
  const slidersBox = vSliders && (
    <div style={{ ...styleBoite, ...cadre('prevision') }}>
      {titreP('Niveaux des facteurs (valeurs codées de −1 à +1)')}
      {lesFacteurs.map(i => { const f = jd.facteurs[i];
        return (<div key={f.id} style={{ marginBottom: 2 }}>
          <Curseur nom={`${f.id} : ${f.court || f.nom}`} valeur={x[i]} onChange={v => setX(a => a.map((u, p) => (p === i ? v : u)))} min={-1} max={1} pas={0.05} decimales={2} couleur={['#b45309', '#0f766e', '#7c3aed', '#be185d', '#0369a1'][i]}/>
          <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: -4, marginBottom: 6 }}>= {reelTxt(f, x[i])}</div>
        </div>); })}
      {vPred && <LigneMesure nom={rep.id === 'note' ? 'Note prévue' : 'Viscosité prévue'} valeur={fmtRep(pred)} couleur="#1d4ed8"/>}
    </div>);
  const resume = (
    <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>
      {fit.p} coefficients (constante comprise) pour {fit.n} essais : <strong>ddl = {fit.ddl}</strong>
      {fit.ddl > 0 ? <> · écart-type résiduel <em>s</em> = {nbf(fit.s, 2)} · R² = {nbf(fit.r2, 3)}</> : ' : le modèle passe par tous les points, aucun test possible'}
    </div>);
  const termesBox = vChips && (
    <div style={{ ...styleBoite, ...cadre('termes') }}>
      {titreP('Termes du modèle (cliquer pour garder ou écarter)')}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {trie.map(it => { const on = kept[jeu].includes(it.cle);
          return <button key={it.cle} aria-pressed={on} onClick={() => setKept(kp => ({ ...kp, [jeu]: on ? kp[jeu].filter(c => c !== it.cle) : [...kp[jeu], it.cle] }))} style={stylePetitBouton(on, '#0369a1')}>{it.nom}</button>; })}
      </div>
      {resume}
      {enExplo && fit.ddl > 0 && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Hors programme : intervalle de confiance à 95 % de chaque coefficient (Student, {fit.ddl} ddl) = ± {nbf(M.demiICstudent(fit), 3)}.</div>}
    </div>);
  const aliasBox = enExplo && jeu === 'vin5' && (
    <Section titre="Alias de la fraction (hors programme)" ouvert={aliasOuv} onBascule={() => setAliasOuv(o => !o)}>
      <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 4 }}>Avec E = A·B·C·D (I = A·B·C·D·E), chaque effet est confondu avec le terme formé des autres facteurs :</div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.5 }}>
        {TERMES.vin5.map(t => <li key={cle(t)}>{M.nomTerme(t, jd.facteurs)} ↔ {M.alias(t, 5).map(i => jd.facteurs[i].id).join('·')}</li>)}
      </ul>
    </Section>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Niveaux codés</strong> : −1 (niveau bas) et +1 (niveau haut). Le modèle n’est valable <strong>que dans le domaine du plan</strong> : pas d’extrapolation hors de [−1 ; +1].</li>
      <li><strong>Facteurs qualitatifs</strong> : la recette, le refroidissement et l’agitation n’ont que deux états ; les valeurs intermédiaires des curseurs n’ont pas de sens physique. Seul un facteur quantitatif (température, masses) se règle continûment.</li>
      <li><strong>Données réelles</strong> : TP « flan au chocolat » (note moyenne d’un jury, viscosité à bas gradient) et activité « vinaigrette » (note du jury). <strong>Une seule mesure par essai</strong> : la répétabilité n’a pas été mesurée.</li>
      <li><strong>Modèle polynomial</strong> : effets principaux et interactions ; chaque coefficient est la demi-différence de deux moyennes (plan orthogonal, essais bien répartis). Les interactions ne sont gardées que si leurs effets principaux le sont.</li>
      <li><strong>Seuil de significativité (confirmé)</strong> : l’écart-type résiduel est traité comme l’écart-type σ des mesures, avec des erreurs normales, indépendantes et de même écart-type. C’est une approximation : σ n’est pas connu.</li>
      <li><strong>Plan fractionnaire (expert)</strong> : les interactions d’ordre 3 et plus sont supposées négligeables ; sans cela, les effets confondus ne peuvent pas être séparés. Student suppose en plus des erreurs normales, ce qui est douteux pour des notes bornées de 0 à 10.</li>
      <li><strong>Notes d’un jury</strong> : échelle relative et bornée, propre au lot présenté ; à interpréter avec prudence.</li>
      <li><strong>Défis</strong> : données fictives tirées au hasard, sauf la viscosité du flan (données réelles).</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {niveau !== 'exp' && <button onClick={() => { setNiveau(niveau === 'deb' ? 'conf' : 'exp'); setX([0, 0, 0, 0, 0]); }} style={styleBouton(true, ORANGE_GUIDE)}>Niveau suivant</button>}
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- défi ----------
  const champ = (c, label, u) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6, fontSize: 14 }}>
      <span style={{ minWidth: 150 }}>{label}</span>
      <input value={defi.reps[c] ?? ''} aria-label={label} onKeyDown={e => e.key === 'Enter' && document.getElementById('pf-verif')?.click()} onChange={e => setRepD(c, e.target.value)}
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{u}</span>
    </div>);
  const nomCible = defi?.cible === 'AB' ? <>a<sub>12</sub> (interaction A·B)</> : defi?.cible === 'A' ? <>a<sub>1</sub> (facteur A)</> : <>a<sub>2</sub> (facteur B)</>;
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['coef', 'Un coefficient'], ['predire', 'Prédire'], ['cible', 'Viser une viscosité']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'coef' ? 'Défi : calculez un coefficient du modèle' : defi.type === 'predire' ? 'Défi : prévoyez la réponse à partir de niveaux réels' : `Défi : placez le point sur une formule de viscosité prévue entre ${defi.t - 150} et ${defi.t + 150}${NB}unités`}</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>
        {defi.type === 'coef' && <>Un plan 2² (facteurs A et B, niveaux −1 et +1) a donné les rendements ci-dessous (en %). Calculez le coefficient {nomCible} du modèle Ŷ = a<sub>0</sub> + a<sub>1</sub>x<sub>1</sub> + a<sub>2</sub>x<sub>2</sub> + a<sub>12</sub>x<sub>1</sub>x<sub>2</sub>.</>}
        {defi.type === 'predire' && <>Le modèle d’un procédé est Ŷ = {defi.a0} {sgn(defi.a1)} {Math.abs(defi.a1)} x<sub>1</sub> {sgn(defi.a2)} {Math.abs(defi.a2)} x<sub>2</sub> {sgn(defi.a12)} {Math.abs(defi.a12)} x<sub>1</sub>x<sub>2</sub> (rendement en %), où x<sub>1</sub> est la valeur codée de {defi.f1[0]} (de {defi.f1[2]} à {defi.f1[3]}{NB}{defi.f1[1]}) et x<sub>2</sub> celle de {defi.f2[0]} (de {defi.f2[2]} à {defi.f2[3]}{NB}{defi.f2[1]}). Calculez le rendement prévu pour {defi.f1[0]} = {nbf(defi.r1, 1)}{NB}{defi.f1[1]} et {defi.f2[0]} = {nbf(defi.r2, 1)}{NB}{defi.f2[1]}.</>}
        {defi.type === 'cible' && <>Le modèle est celui de la viscosité du flan (données réelles) : recette × température. Déplacez le point sur la carte et lisez la viscosité prévue ; les courbes sont les isoréponses.</>}
      </div>
      {defi.type === 'coef' && <>
        <table style={{ borderCollapse: 'collapse', marginBottom: 8, fontSize: 14 }}>
          <thead><tr style={{ color: KIT.txt2, fontSize: 13 }}><th style={{ padding: '2px 10px' }}>essai</th><th style={{ padding: '2px 10px' }}>A</th><th style={{ padding: '2px 10px' }}>B</th><th style={{ padding: '2px 10px' }}>rendement (%)</th></tr></thead>
          <tbody>{[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b], i) => <tr key={i} style={{ textAlign: 'center', borderTop: `1px dashed ${KIT.bord}` }}><td>{i + 1}</td><td>{a > 0 ? '+1' : '−1'}</td><td>{b > 0 ? '+1' : '−1'}</td><td style={{ fontWeight: 700 }}>{defi.y[i]}</td></tr>)}</tbody>
        </table>
        {champ('a', 'Coefficient', '')}
        <IndiceDefi cache={false}>{defi.cible === 'AB' ? 'Multipliez, pour chaque essai, le signe de A par le signe de B (+, −, −, +), puis faites la moyenne de ce signe × le rendement sur les 4 essais.' : 'a = (Moy⁺ − Moy⁻) / 2, chaque moyenne portant sur les 2 essais où le facteur est au niveau +1 (ou −1).'}</IndiceDefi></>}
      {defi.type === 'predire' && <>{champ('a', 'Rendement prévu', '%')}<IndiceDefi cache={false}>Niveau codé : x = (valeur − centre) / demi-étendue, avec centre = (bas + haut) / 2 et demi-étendue = (haut − bas) / 2. Puis remplacez x<sub>1</sub> et x<sub>2</sub> dans le modèle.</IndiceDefi></>}
      {defi.type === 'cible' && <IndiceDefi cache={false}>Choisissez d’abord la courbe isoréponse dont la valeur est au milieu de la fenêtre, puis placez le point dessus.</IndiceDefi>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="pf-verif" onClick={verifierDefi} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>{defi.msg}</div>}
    </div>);

  // ---------- à essayer / à retenir ----------
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6, color: KIT.txt }}>
        <li>Flan : passez de la note à la <strong>viscosité</strong>. Quel facteur domine dans chaque cas ? Y a-t-il une interaction ?</li>
        <li>Vinaigrette 2⁴ : écartez un terme du modèle, puis rajoutez-le. Que deviennent les degrés de liberté et R² ?</li>
        <li>Affichez les <strong>courbes isoréponses</strong> de Novation et d’Ultratech : où est la note maximale ?</li>
        <li>Plan 2⁵⁻¹ (hors programme) : ouvrez les <strong>alias</strong>. Quels termes sont confondus avec D·E ?</li>
        <li>Quand le modèle est-il saturé (ddl = 0) ? Que perd-on ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>plan complet : 2<sup>k</sup> essais ; niveaux codés −1 et +1</li>
        <li>coefficient d’un facteur = (Moy⁺ − Moy⁻) / 2 ; interaction = produit des colonnes</li>
        <li>droites non parallèles : interaction entre les deux facteurs</li>
        <li>ddl = essais − coefficients ; un modèle saturé n’est pas testable</li>
        <li>plan fractionnaire : moins d’essais, effets confondus (alias)</li>
      </ul>
    </ARetenir>);

  const controlesExplo = enExplo && (
    <div style={styleBoite}>
      {titreP('Jeu de données')}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        {[['flan', 'Flan 2³'], ['vin4', 'Vinaigrette 2⁴'], ['vin5', 'Vinaigrette 2⁵⁻¹']].map(([c, l]) => <button key={c} onClick={() => { setE({ jeu: c, ri: 0, paire: PAIRE0[c] }); setX([0, 0, 0, 0, 0]); }} aria-pressed={explo.jeu === c} style={stylePetitBouton(explo.jeu === c, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 6 }}>Trois TP réels de BTS : {jd.titre} ({jd.plan}).</div>
      {jd.reponses.length > 1 && <><div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>Réponse étudiée</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>{jd.reponses.map((r, q) => <button key={r.id} onClick={() => setE({ ri: q })} aria-pressed={ri === q} style={stylePetitBouton(ri === q, '#0369a1')}>{r.nom}</button>)}</div></>}
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '6px 0 4px' }}>Affichage</div>
      {[['effets', 'Coefficients du modèle (Pareto)'], ['inter', 'Graphique d’interaction'], ['iso', 'Courbes isoréponses'], ['ic', 'Barres d’erreur (Student, hors programme)']].map(([c, l]) => (
        <label key={c} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13.5, opacity: c === 'ic' && fit.ddl === 0 ? 0.5 : 1 }}><input type="checkbox" disabled={c === 'ic' && fit.ddl === 0} checked={!!explo[c]} onChange={e => setE({ [c]: e.target.checked })}/>{l}{c === 'ic' && fit.ddl === 0 ? ' (indisponible : 0 ddl)' : ''}</label>))}
      {(explo.inter || explo.iso) && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8, fontSize: 13.5 }}>
        {[0, 1].map(q => <label key={q} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>{q === 0 ? 'Facteur 1' : 'Facteur 2'}
          <select value={explo.paire[q]} onChange={e => { const v = +e.target.value; setE({ paire: q === 0 ? [v, v === explo.paire[1] ? explo.paire[0] : explo.paire[1]] : [v === explo.paire[0] ? explo.paire[1] : explo.paire[0], v] }); }} style={{ padding: 3, borderRadius: 6 }}>
            {jd.facteurs.map((f, i) => <option key={f.id} value={i}>{f.id} : {f.court || f.nom}</option>)}</select></label>)}
      </div>}
    </div>);

  const descNiveau = { deb: 'Débutant : tout est dans le programme (plan 2³ complet, coefficients, interactions, prévision, isoréponses).', conf: 'Confirmé : 4 facteurs, 16 essais, degrés de liberté, diagramme de Pareto et réduction du modèle (au-delà du programme).', exp: 'Expert : plan fractionnaire, alias, résolution et loi de Student (hors programme).' };
  const choixNiveau = enGuide && (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
        {[['deb', 'Débutant'], ['conf', 'Confirmé'], ['exp', 'Expert']].map(([c, l]) => <button key={c} onClick={() => { setNiveau(c); setX([0, 0, 0, 0, 0]); }} aria-pressed={niveau === c} style={stylePetitBouton(niveau === c, ORANGE_GUIDE)}>{l}</button>)}
      </div>
      <div style={{ fontSize: 13, color: KIT.txt2, lineHeight: 1.4 }}>{descNiveau[niveau]}</div>
    </div>);

  const panneauxCol = <>{cubeBox}{facteursBox}{tableBox}{effetsBox}{interBox}{termesBox}{slidersBox}{isoBox}</>;
  const colGauche = <>{cubeBox}{facteursBox}{effetsBox}{interBox}{isoBox}</>;
  const colDroite = <>{controlesExplo}{tableBox}{termesBox}{slidersBox}{aliasBox}</>;

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .pf-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .pf-l1.cote { grid-template-columns: minmax(0, 1fr) minmax(300px, 420px); }
        .pf-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.25fr) minmax(280px, 1fr); }
        .pf-col { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
        @media (min-width: 901px) { .pf-l1.cote .pf-carte { order: 2; } .pf-l1.cote .pf-main { order: 1; } }
        @media (max-width: 900px) { .pf-l1.cote, .pf-pri { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Plans factoriels</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Pour savoir quels <strong>facteurs</strong> agissent sur une réponse (une note, une viscosité), on teste <strong>toutes les combinaisons</strong> de leurs niveaux haut et bas : c’est un <strong>plan factoriel</strong>. On en déduit un modèle qui prévoit la réponse ailleurs, et les interactions entre facteurs.</div>
      {choixNiveau}
      <div className={`pf-l1${!enExplo ? ' cote' : ''}`}>
        {enGuide ? <div className="pf-carte"><CarteParcours key={niveau} etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="pf-carte">{panneauHypo}</div> : null}
        <div className="pf-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'coef' ? sC : defi.type === 'predire' ? sP : sI}/></div>}
          {enExplo ? (
            <div className="pf-pri">
              <div className="pf-col">{colGauche}</div>
              <div className="pf-col">{colDroite}</div>
            </div>
          ) : <div className="pf-col">{enDefi ? (defi?.type === 'cible' ? <>{isoBox}{slidersBox}</> : null) : panneauxCol}</div>}
        </div>
      </div>
      {!enDefi && (!enGuide || (etape >= ETAPES.length - 1)) && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      {enExplo && <div className="pf-l1" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>{aEssayer}{retenir}</div>}
    </div>
  );
}
