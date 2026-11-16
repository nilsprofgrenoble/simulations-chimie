import { useState, useMemo } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ORANGE_GUIDE, lireNombre, proche, ARetenir, Curseur, LigneMesure, IndiceDefi } from "../commun";
import { NB } from "./Distillation";
import { Pic } from "../Pictos";
import * as M from "./planMelangeModele";
import Ternaire from "./PlanMelangeTernaire";
import { CarteLire, CartePlan, CarteSynergie, CarteDomaine, CarteBeta, CarteDdl } from "./PlanMelangeCartes";

const SIM_ID = 126;
declarerDefis(SIM_ID, [['lire', 'Lire une composition sur le diagramme ternaire'], ['cible', 'Trouver une formule qui atteint la fermeté visée'], ['beta', 'Calculer un coefficient d’interaction']]);

// ====================================================
//  SIM 126 — PLAN DE MÉLANGE TERNAIRE (BTS Métiers de la Chimie, Formulation)
//  Données réelles : TP « rouge à lèvres » (fermeté au texturomètre des 7 essais d'un plan de mélange centré sur une formule de référence).
//  Trois parcours guidés : débutant (strictement le programme), confirmé (conception du plan, coefficients à la main), expert (hors programme).
//  Hypothèses : voir le panneau « Hypothèses de travail » (somme des proportions = 1, une seule mesure par essai, répétabilité NON mesurée,
//  modèle valable seulement dans le domaine du plan, prix et cahier des charges fictifs).
// ====================================================

const nbf = (v, d = 0) => Number(v).toFixed(d).replace(/^-(0(\.0*)?)$/, '$1').replace('.', ',');
const pc1 = v => nbf(100 * v, 1);
const ETAT0 = { etape: 0, reps: {}, verifs: {}, reussies: {} };

// ---------- données et modèles ----------
const FREF = M.FREF, DOM = M.simplexeCentre(FREF);
const ESSAIS = M.PLAN7.map(e => ({ n: e.n, nom: e.nom, z: e.z, x: M.pseudoVersReel(e.z, DOM), y: M.FERMETE[e.n - 1] }));
const Z6 = M.PLAN7.slice(0, 6).map(e => e.z), Z7 = M.PLAN7.map(e => e.z), ZC = [1 / 3, 1 / 3, 1 / 3];
const Q6 = M.ajuste(Z6, M.FERMETE.slice(0, 6), 'quadratique');          // modèle construit avec les 6 essais du réseau (le centre est mis de côté)
const CUB = M.ajuste(Z7, M.FERMETE, 'cubique');                           // modèle exact sur les 7 essais
const Q7 = M.ajuste(Z7, M.FERMETE, 'quadratique');                        // moindres carrés sur 7 essais : 1 degré de liberté
const COEF = M.coefsMain(M.FERMETE);
const PRED_C = M.predit(Q6.coefs, 'quadratique', ZC);                     // 552,9 g
const Y7 = M.FERMETE[6];
const NORM = (() => { const r = M.alea(2611); return Array.from({ length: 6 }, () => M.gauss(r)); })();   // tirages normaux fixes (répétitions simulées)
const SIGMA0 = 24;                                                         // 5 % de 479 g, valeur CHOISIE pour l'exercice
const B_MAX = 0.40;                                                        // contrainte fictive du service qualité
const ZONE = { lo: 350, hi: 450 };                                         // cahier des charges fictif
const U_REG = [1 - DOM.L[1] - DOM.L[2], B_MAX, 1 - DOM.L[0] - DOM.L[1]];
const REGION = M.sommetsDomaine(DOM.L, U_REG);
const P0 = [0.5, 0.2, 0.3];
const dansDomaine = x => M.reelVersPseudo(x, DOM).every(v => v >= -1e-6);
const MEILLEUR = (() => {
  let best = null; const N = 240;
  for (let i = 0; i <= N; i++) for (let j = 0; i + j <= N; j++) {
    const z = [i / N, j / N, 1 - i / N - j / N], x = M.pseudoVersReel(z, DOM);
    if (x[1] > B_MAX) continue;
    const y = M.predit(CUB.coefs, 'cubique', z);
    if (y < ZONE.lo || y > ZONE.hi) continue;
    const c = M.coutKg(x);
    if (!best || c < best.c) best = { c, x, y };
  }
  return best;
})();
const MAXIMUM = M.extremes(z => M.predit(CUB.coefs, 'cubique', z), 120).max;
const valsCentre = (sigma, k) => [Y7, ...Array.from({ length: k }, (_, i) => Math.round(Y7 + sigma * NORM[i]))];
const stat = v => { const n = v.length, m = v.reduce((a, b) => a + b, 0) / n, s = n > 1 ? Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1)) : null; return { n, m, s }; };
const manque = (sigma, k) => { const { n, m, s } = stat(valsCentre(sigma, k)); const t = Math.abs(m - PRED_C) / (s / Math.sqrt(n)), crit = M.student95(n - 1); return { n, m, s, t, crit, rejet: t > crit }; };
const compo = x => x.map(v => nbf(100 * v, 1));
const alea = l => l[Math.floor(Math.random() * l.length)];

// ---------- petits composants d'affichage ----------
const Sub = (b, s) => <>{b}<sub>{s}</sub></>;
const Ym = ({ i }) => <>y<sub>{i}</sub></>;
function TableEssais({ lignes, pseudo, modele, cacher7 = false, resid = false }) {
  const th = { padding: '3px 5px', textAlign: 'right', borderBottom: `1.5px solid ${KIT.bord}`, color: KIT.txt2, fontSize: 12.5, whiteSpace: 'nowrap' };
  const td = { padding: '3px 5px', textAlign: 'right', fontFamily: 'monospace', fontSize: 13, whiteSpace: 'nowrap', borderBottom: `1px dashed ${KIT.bord}` };
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead><tr><th style={{ ...th, textAlign: 'center' }}>essai</th>{pseudo && <th className="pm-z" style={th}>z (A ; B ; C)</th>}<th style={th}>% A / B / C</th><th style={th}>fermeté (g)</th>{modele && <th style={th}>prévu (g)</th>}{resid && <th style={th}>écart</th>}</tr></thead>
        <tbody>
          {lignes.map(e => {
            const masque = cacher7 && e.n === 7, prev = modele ? modele(e.z) : null;
            return (<tr key={e.n}>
              <td style={{ ...td, textAlign: 'center', fontWeight: 700 }}>{e.n}</td>
              {pseudo && <td className="pm-z" style={td}>{e.z.map(v => nbf(v, v === 0 || v === 1 || v === 0.5 ? (v === 0.5 ? 1 : 0) : 2)).join(' ; ')}</td>}
              <td style={td}>{compo(e.x).join('/')}</td>
              <td style={{ ...td, fontWeight: 700 }}>{masque ? '—' : e.y}</td>
              {modele && <td style={td}>{nbf(prev, 0)}</td>}
              {resid && <td style={td}>{masque ? '—' : nbf(e.y - prev, 0)}</td>}
            </tr>);
          })}
        </tbody>
      </table>
    </div>);
}

// ====================================================
export function SimulationPlanMelange() {
  const [mode, setMode] = useState(() => modeOuverture('plan-melange-guide-deb-v1'));
  useSignalerMode(mode);
  const [niveau, setNiveau] = useEtatPersistant('plan-melange-niveau-v1', 'deb');
  const [gDeb, setGDeb] = useEtatPersistant('plan-melange-guide-deb-v1', ETAT0);
  const [gConf, setGConf] = useEtatPersistant('plan-melange-guide-conf-v1', ETAT0);
  const [gExp, setGExp] = useEtatPersistant('plan-melange-guide-exp-v1', ETAT0);
  const [pt, setPt] = useState(P0);
  const [explo, setExplo] = useState({ degre: 'quadratique', controle: true, reponse: 'fermete', domaine: true, essais: true, iso: true, carte: false, zone: false, region: false });
  const [rep, setRep] = useState(0), [sigma, setSigma] = useState(SIGMA0);
  const [defi, setDefi] = useState(null), [typeDefi, setTypeDefi] = useState('lire');
  const [sL, noterL] = useCompteurDefi(), [sC, noterC] = useCompteurDefi(), [sB, noterB] = useCompteurDefi();
  const [hypoOuv, setHypoOuv] = useState(false), [plusOuv, setPlusOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplo = mode === 'explore';
  const guide = niveau === 'conf' ? gConf : niveau === 'exp' ? gExp : gDeb;
  const setGuide = niveau === 'conf' ? setGConf : niveau === 'exp' ? setGExp : setGDeb;
  const setE = f => setExplo(e => ({ ...e, ...f }));

  // ---------- modèle utilisé ----------
  const etape = guide.etape;
  const fitExplo = useMemo(() => {
    const ctrl = explo.controle && explo.degre !== 'cubique';
    const Z = ctrl ? Z6 : [...Z7, ...Array(rep).fill(ZC)];
    const Y = ctrl ? M.FERMETE.slice(0, 6) : [...M.FERMETE, ...valsCentre(sigma, rep).slice(1)];
    return M.ajuste(Z, Y, explo.degre);
  }, [explo.controle, explo.degre, rep, sigma]);
  // ---------- étapes (listes définies plus bas ; ici seulement leurs identifiants pour la progressivité) ----------
  const IDS_DEB = ['sommets', 'lireC', 'deduireB', 'placer', 'ref', 'placerRef', 'domaine', 'essais', 'compo', 'mesures', 'moyenne', 'synergie', 'iso', 'choix', 'valider', 'verdict', 'bilan'];
  const IDS_CONF = ['min', 'cote', 'bornes', 'sommets', 'pseudo', 'plan', 'beta12', 'beta13', 'signes', 'prevoir', 'beta123', 'exact', 'maximum', 'bilan'];
  const IDS_EXP = ['region', 'essaisRegion', 'ddl', 'repeter', 'ecartType', 'manque', 'cout', 'optimum', 'hypotheses', 'bilan'];
  const IDS = niveau === 'conf' ? IDS_CONF : niveau === 'exp' ? IDS_EXP : IDS_DEB;
  const idx = id => IDS.indexOf(id);
  const des = id => !enGuide || idx(id) < 0 || etape >= idx(id);             // visible dès l'étape qui l'introduit
  const apres = id => !enGuide || idx(id) < 0 || etape > idx(id);            // visible une fois l'étape passée (grandeur à calculer)
  const dev = niveau === 'deb', conf = niveau === 'conf', exp = niveau === 'exp';

  const fit = enGuide ? (dev ? Q6 : conf ? (apres('beta123') ? CUB : Q6) : (apres('manque') ? CUB : Q6)) : fitExplo;
  const degre = fit.degre;
  const fZ = z => M.predit(fit.coefs, degre, z);
  const predX = x => (dansDomaine(x) ? fZ(M.reelVersPseudo(x, DOM)) : null);
  const sigEff = enGuide ? SIGMA0 : sigma;
  const repEff = enGuide ? (exp && (apres('repeter') || (des('repeter') && rep >= 3)) ? 3 : 0) : rep;
  const centre = valsCentre(sigEff, repEff), stC = stat(centre), mq = manque(sigEff, repEff);

  // ---------- éléments affichés (progressivité du parcours) ----------
  const vFref = !enGuide || (dev ? des('placerRef') : true);
  const vDomaine = !enGuide ? explo.domaine : dev ? des('domaine') : conf ? apres('sommets') : true;
  const vPlan = !enGuide ? explo.essais : dev ? des('essais') : conf ? des('plan') : true;
  const vMesures = !enGuide || (dev ? des('mesures') : conf ? des('plan') : true);
  const vPseudo = !enGuide || !dev;
  const vCompo = !enGuide || !dev || apres('deduireB');
  const vSliders = !enGuide || (dev ? des('placer') : conf ? des('plan') : des('cout'));
  const vMes = !enGuide || (dev ? etape >= 1 : conf ? des('plan') : des('cout'));
  const vGuides = enGuide && dev && des('placer') && !des('ref');
  const interactif = enDefi ? defi?.type === 'cible' : (!enGuide || vSliders);
  const vFermIso = enGuide ? (dev ? des('iso') : conf ? des('maximum') : !des('cout')) : (explo.reponse === 'fermete' && explo.iso);
  const vCoutIso = enGuide ? (exp && des('cout')) : (explo.reponse === 'cout' && explo.iso);
  const vZone = enGuide ? ((dev && des('choix')) || (exp && des('optimum'))) : explo.zone;
  const vRegion = enGuide ? (exp && des('region')) : explo.region;
  const vCarte = !enGuide && explo.carte && explo.reponse === 'fermete';
  const vPred = vFermIso || vZone || (enGuide && dev && des('iso')) || (!enGuide && explo.reponse === 'fermete');
  const pNum = vPred ? predX(pt) : null;
  const cout = M.coutKg(pt);
  const hors = !dansDomaine(pt);

  const isos = useMemo(() => {
    const L = [];
    if (vFermIso) L.push({ f: fZ, niveaux: [200, 300, 400, 500, 600, 700, 800].filter(v => v >= 0), coul: '#1d4ed8', dec: 0 });
    if (vCoutIso) L.push({ f: z => M.coutKg(M.pseudoVersReel(z, DOM)), niveaux: [16, 18, 20, 22, 24, 26, 28, 30], coul: '#15803d', dec: 0 });
    return L;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vFermIso, vCoutIso, fit]);
  const zone = useMemo(() => (vZone ? { f: fZ, lo: ZONE.lo, hi: ZONE.hi, garde: exp || (!enGuide && explo.region) ? (x => x[1] <= B_MAX + 1e-9) : null } : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vZone, fit, exp, enGuide, explo.region]);
  const carte = useMemo(() => (vCarte ? { f: fZ } : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vCarte, fit]);

  const planPts = vPlan ? ESSAIS.filter(e => !(enGuide && dev && e.n === 7 && !des('valider') && false)).map(e => ({ n: e.n, x: e.x })) : null;

  // ---------- défis ----------
  function nouveauDefi(type) {
    if (type === 'lire') {
      const a = alea([10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70]);
      const c = alea([10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70].filter(v => 100 - a - v >= 10));
      const d = { type, a, b: 100 - a - c, c, reps: {}, verifie: false };
      setDefi(d); setPt([a / 100, (100 - a - c) / 100, c / 100]);
    } else if (type === 'cible') {
      const t = alea([250, 300, 350, 400, 450, 500, 550, 600]);
      setDefi({ type, t, reps: {}, verifie: false }); setPt(FREF);
    } else {
      const y1 = alea([100, 120, 140, 160, 180, 200, 250, 300]), y2 = alea([320, 360, 400, 450, 500]);
      const dy = alea([-60, -40, 40, 80, 120, 160, 200, 260]);
      setDefi({ type, y1, y2, y12: (y1 + y2) / 2 + dy, reps: {}, verifie: false });
    }
  }
  function changerMode(md) {
    setMode(md);
    if (md === 'defi' && !defi) nouveauDefi(typeDefi);
    if (md === 'guide') setPt(P0);
  }
  function choisirDefi(t) { setTypeDefi(t); nouveauDefi(t); }
  const setRepD = (k, v) => setDefi(d => ({ ...d, reps: { ...d.reps, [k]: v }, verifie: false }));
  const verifierDefi = () => {
    let ok = false, msg = '';
    if (defi.type === 'lire') {
      const a = lireNombre(defi.reps.a), b = lireNombre(defi.reps.b), c = lireNombre(defi.reps.c);
      ok = [a, b, c].every(isFinite) && Math.abs(a - defi.a) <= 3 && Math.abs(b - defi.b) <= 3 && Math.abs(c - defi.c) <= 3;
      msg = ok ? `✓ Correct : ${defi.a}${NB}% de candelilla, ${defi.b}${NB}% d’huile de ricin, ${defi.c}${NB}% de cire d’abeille.` : '✗ Vérifiez : chaque proportion se lit sur son échelle (même couleur), en suivant la ligne de la grille parallèle au côté opposé au sommet ; la somme des trois doit faire 100 %.';
      noterL(ok);
    } else if (defi.type === 'cible') {
      const y = predX(pt);
      ok = y != null && y >= defi.t - 25 && y <= defi.t + 25;
      msg = y == null ? '✗ Le point est hors du domaine d’étude : le modèle n’y prédit rien.' : ok ? `✓ Correct : fermeté prévue ${nbf(y, 0)}${NB}g, dans la fenêtre demandée.` : `✗ La fermeté prévue est ${nbf(y, 0)}${NB}g : elle doit être entre ${defi.t - 25} et ${defi.t + 25}${NB}g. Suivez les courbes isoréponses.`;
      noterC(ok);
    } else {
      const v = 4 * defi.y12 - 2 * defi.y1 - 2 * defi.y2, x = lireNombre(defi.reps.b);
      ok = isFinite(x) && proche(x, v, 0.01);
      msg = ok ? `✓ Correct : β₁₂ = 4 × ${defi.y12} − 2 × ${defi.y1} − 2 × ${defi.y2} = ${v}${NB}g.` : `✗ Vérifiez : β₁₂ = 4 y₁₂ − 2 y₁ − 2 y₂, avec y₁₂ la fermeté du mélange au milieu du côté.`;
      noterB(ok);
    }
    setDefi(d => ({ ...d, verifie: true, ok, msg }));
  }

  // ════════════════ PARCOURS GUIDÉ : DÉBUTANT (strictement le programme) ════════════════
  const ESSAI4_B = (0 + 65) / 2;
  const ETAPES_DEB = [
    { id: 'sommets', titre: 'Un triangle pour trois constituants', focus: ['scene'],
      texte: <>Un rouge à lèvres contient plusieurs corps gras. Ici, on en étudie trois : la <strong>cire de candelilla</strong>, l’<strong>huile de ricin</strong> et la <strong>cire d’abeille</strong>. Chaque point du triangle représente un mélange de ces trois constituants. Chaque <strong>sommet</strong> correspond à un constituant utilisé seul.</>,
      tache: { type: 'qcm', q: 'Au sommet « huile de ricin » (en bas à gauche), le mélange contient…', options: ['100 % d’huile de ricin, et rien d’autre', 'un tiers de chacun des trois constituants', '50 % d’huile de ricin et 50 % de cire d’abeille'], bonne: 0,
        expl: 'Un sommet est un constituant pur. Plus on s’éloigne d’un sommet, moins il y a de ce constituant.', indice: 'Un sommet est l’endroit où un seul constituant est présent.' } },
    { id: 'lireC', titre: 'Lire une proportion', focus: ['scene'],
      texte: <>Le point orange <strong>P</strong> est un mélange. Pour lire un constituant, suivez la <strong>ligne de la grille</strong> qui passe par P, parallèle au côté opposé à son sommet, jusqu’à son échelle (même couleur que son nom). La grille est tracée tous les 10{NB}%. La <strong>cire d’abeille</strong> (violet) se lit sur le côté droit, en suivant la ligne parallèle au côté gauche.</>,
      tache: { type: 'num', q: 'Quelle est la proportion de cire d’abeille au point P ?', unite: '%', vrai: 30, tol: 0.1, affiche: v => nbf(v, 0),
        calcul: () => ['On suit la ligne violette parallèle au côté gauche qui passe par P, jusqu’à l’échelle violette du côté droit : on lit 30 %.'],
        pieges: [[50, 'Vous avez lu l’échelle de la candelilla (marron, côté gauche). La cire d’abeille se lit sur le côté droit.'], [20, 'Vous avez lu l’échelle de l’huile de ricin (vert, base).']],
        expl: 'La ligne parallèle au côté gauche qui passe par P rejoint l’échelle de la cire d’abeille à 30 %.', indice: 'Cherchez l’échelle violette, sur le côté droit du triangle.' } },
    { id: 'deduireB', titre: 'Déduire la troisième proportion', focus: ['scene'],
      texte: <>La proportion de <strong>candelilla</strong> au point P est de 50{NB}% et celle de <strong>cire d’abeille</strong> de 30{NB}%. Les trois proportions d’un mélange ont toujours pour somme <strong>100{NB}%</strong> : on peut donc calculer la troisième sans la lire.</>,
      tache: { type: 'num', q: 'Quelle est la proportion d’huile de ricin au point P ?', unite: '%', vrai: 20, tol: 0.05, affiche: v => nbf(v, 0),
        calcul: () => ['La somme des trois proportions vaut 100 %.', 'Huile de ricin = 100 − 50 − 30 = 20 %.'],
        pieges: [[80, 'C’est la somme candelilla + cire d’abeille (50 + 30). Retranchez-la de 100 %.']],
        expl: '100 − 50 − 30 = 20 %. On peut le vérifier sur l’échelle verte de la base.', indice: 'Huile de ricin = 100 % − candelilla − cire d’abeille.' } },
    { id: 'placer', titre: 'Placer un mélange', focus: ['scene', 'reglages'],
      retenirTitre: 'À RETENIR : LIRE UN DIAGRAMME TERNAIRE', retenir: <><CarteLire/><ul style={{ margin: '4px 0 0', paddingLeft: 18, lineHeight: 1.6 }}><li>sommet = constituant seul (100 %) ; côté opposé = constituant absent (0 %)</li><li>chaque proportion se lit sur <strong>son</strong> échelle, le long de la ligne parallèle au côté opposé</li><li>la somme des trois proportions fait toujours 100 %</li></ul></>,
      texte: <>À vous : placez le point sur le mélange <strong>20{NB}% de candelilla, 50{NB}% d’huile de ricin et 30{NB}% de cire d’abeille</strong>. Faites-le glisser avec la souris ou le doigt, ou utilisez les curseurs. Les lignes pointillées montrent comment lire chaque proportion.</>,
      tache: { type: 'action', ok: Math.abs(pt[0] - 0.2) <= 0.03 && Math.abs(pt[1] - 0.5) <= 0.03 && Math.abs(pt[2] - 0.3) <= 0.03, label: 'Placer le point pour moi', faire: () => setPt([0.2, 0.5, 0.3]), consigne: 'Placez le point sur 20 % / 50 % / 30 %' } },
    { id: 'ref', titre: 'La formule de départ', focus: ['scene'],
      texte: <>Le chef de laboratoire propose une <strong>formule de départ</strong>, notée <strong>Fref</strong> : 8{NB}g de cire de candelilla, 5{NB}g d’huile de ricin et 10{NB}g de cire d’abeille, soit 23{NB}g de corps gras. On ne compte que ces trois corps gras : les autres ingrédients du rouge à lèvres restent identiques.</>,
      tache: { type: 'num', q: 'Pourcentage massique de candelilla dans Fref', unite: '%', vrai: 800 / 23, tol: 0.02, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['Masse totale des trois corps gras : 8 + 5 + 10 = 23 g.', 'Candelilla : 8 / 23 × 100 = 34,8 %.'],
        pieges: [[8, 'Vous avez donné la masse. Divisez-la par la masse totale (23 g) puis multipliez par 100.'], [80, 'Vous avez divisé par 10 g. Divisez par la masse totale des trois corps gras (23 g).']],
        expl: '8 / 23 = 0,348, soit 34,8 % (35 % arrondi).', indice: 'Pourcentage = masse du constituant ÷ masse totale des trois corps gras × 100.' } },
    { id: 'placerRef', titre: 'Fref dans le diagramme', focus: ['scene', 'reglages'],
      texte: <>On trouve de même 22{NB}% d’huile de ricin et 43{NB}% de cire d’abeille (35 + 22 + 43 = 100). Placez le point sur <strong>Fref</strong> : 35{NB}% de candelilla, 22{NB}% d’huile de ricin, 43{NB}% de cire d’abeille.</>,
      tache: { type: 'action', ok: FREF.every((v, i) => Math.abs(pt[i] - v) <= 0.03), label: 'Placer le point pour moi', faire: () => setPt(FREF), consigne: 'Placez le point sur Fref (35 % / 22 % / 43 %)' } },
    { id: 'domaine', titre: 'Le domaine d’étude', focus: ['scene'],
      texte: <>On ne peut pas tester tous les mélanges. On choisit un <strong>domaine d’étude</strong> : le plus grand triangle (de même sens que le diagramme) dont Fref est le centre. Il est tracé en orange. Ses trois sommets ont pour compositions (candelilla / huile / cire d’abeille) : sommet 1 : 78 / 0 / 22 ; sommet 2 : 13 / 65 / 22 ; sommet 3 : 13 / 0 / 87 (en %).</>,
      tache: { type: 'qcm', q: 'Pourquoi choisit-on Fref comme centre du domaine ?', options: ['Pour explorer des formules de part et d’autre de la formule de départ, dans toutes les directions', 'Parce que Fref est la formule la plus ferme', 'Parce que le centre contient toujours 33 % de chaque constituant'], bonne: 0,
        expl: 'Fref est le point de départ : on cherche à l’améliorer en s’en écartant dans toutes les directions.', indice: 'Pensez à ce qu’on cherche : améliorer la formule de départ.' } },
    { id: 'essais', titre: 'Les 7 essais du plan', focus: ['scene', 'table'],
      texte: <>Le <strong>plan de mélange</strong> comporte 7 essais : les 3 sommets du domaine (essais 1, 2, 3), les milieux de ses 3 côtés (essais 4, 5, 6) et son centre (essai 7). Le tableau donne la composition de chacun.</>,
      tache: { type: 'qcm', q: 'Quel essai correspond à la formule de départ Fref ?', options: ['l’essai 7 (le centre)', 'l’essai 1', 'l’essai 5'], bonne: 0,
        expl: 'Fref est le centre du domaine : c’est l’essai 7. Il existe donc déjà dans le plan.', indice: 'Fref est au centre du domaine d’étude.' } },
    { id: 'compo', titre: 'Composition d’un essai', focus: ['table'],
      retenirTitre: 'À RETENIR : LE PLAN À 7 ESSAIS', retenir: <><CartePlan/><ul style={{ margin: '4px 0 0', paddingLeft: 18, lineHeight: 1.6 }}><li>un essai au milieu d’un côté a la <strong>moyenne</strong> des compositions des deux sommets</li><li>le centre du plan est la formule de départ</li></ul></>,
      texte: <>L’essai 4 est au <strong>milieu du côté</strong> qui relie le sommet 1 au sommet 2. Sa composition est la moyenne de celles de ces deux sommets (huile de ricin : 0{NB}% au sommet 1 et 65{NB}% au sommet 2).</>,
      tache: { type: 'num', q: 'Pourcentage d’huile de ricin dans l’essai 4', unite: '%', vrai: ESSAI4_B, tol: 0.03, affiche: v => nbf(v, 1),
        calcul: () => ['Huile de ricin : sommet 1 → 0 %, sommet 2 → 65 %.', 'Au milieu : (0 + 65) / 2 = 32,5 %.'],
        pieges: [[65, 'C’est la valeur du sommet 2. L’essai 4 est au milieu : faites la moyenne.']],
        expl: '(0 + 65) / 2 = 32,5 %. Le tableau donne 32,6 % avec les valeurs non arrondies.', indice: 'Au milieu d’un côté : moyenne des deux sommets.' } },
    { id: 'mesures', titre: 'La fermeté de chaque essai', focus: ['table'],
      texte: <>Les formules ont été fabriquées, une par essai. On a mesuré la <strong>fermeté</strong> de chaque rouge à lèvres avec un texturomètre : c’est la force maximale (en grammes) mesurée quand une lame pénètre dans le bâton, donc plus c’est élevé, plus c’est ferme. Les essais 1 à 6 sont dans le tableau ; l’<strong>essai 7 est gardé de côté</strong> : il servira à contrôler le modèle.</>,
      tache: { type: 'qcm', q: 'Parmi les essais 2, 5 et 6, lequel est le plus ferme ?', options: ['l’essai 2', 'l’essai 5', 'l’essai 6'], bonne: 1,
        expl: 'L’essai 5 (822 g) : un mélange de candelilla et de cire d’abeille, sans huile de ricin.', indice: 'Comparez les valeurs de la colonne « fermeté » du tableau.' } },
    { id: 'moyenne', titre: 'Mélange et moyenne', focus: ['table'],
      texte: <>Les sommets 1 et 3 ont pour fermetés 288{NB}g et 407{NB}g. L’essai 5 est au milieu entre eux. Si les constituants se contentaient d’additionner leurs effets, sa fermeté serait la <strong>moyenne</strong> de celles de ces deux sommets.</>,
      tache: { type: 'num', q: 'Fermeté attendue pour l’essai 5 si on fait la moyenne', unite: 'g', vrai: (288 + 407) / 2, tol: 0.01, affiche: v => nbf(v, 1), cs: 3,
        calcul: () => ['Fermeté des sommets : 288 g et 407 g.', 'Moyenne : (288 + 407) / 2 = 347,5 g.'],
        pieges: [[695, 'Vous avez additionné les deux fermetés. Divisez par 2 pour obtenir la moyenne.']],
        expl: '(288 + 407) / 2 = 347,5 g.', indice: 'Moyenne = (valeur 1 + valeur 2) ÷ 2.' } },
    { id: 'synergie', titre: 'Plus ferme que prévu', focus: ['table'],
      texte: <>La fermeté mesurée pour l’essai 5 est de <strong>822{NB}g</strong>, alors que la moyenne vaut 347,5{NB}g.</>,
      tache: { type: 'qcm', q: 'Que peut-on en conclure ?', options: ['Les deux cires ont un effet synergique : le mélange est bien plus ferme que ce que laissait prévoir la moyenne', 'Les deux cires n’interagissent pas : leurs effets s’additionnent', 'Le texturomètre est déréglé'], bonne: 0,
        expl: 'Le mélange est bien plus ferme que la moyenne : on parle de synergie. Avec une seule mesure par essai, on ne peut pas exclure une erreur, mais un écart de près de 475 g est peu vraisemblable pour une simple dispersion de mesure.', indice: 'Comparez 822 g à la moyenne attendue de 347,5 g.' } },
    { id: 'iso', titre: 'Courbes isoréponses', focus: ['scene', 'mesures'],
      retenirTitre: 'À RETENIR : UN MÉLANGE PEUT ÊTRE PLUS FERME QUE LA MOYENNE', retenir: <><CarteSynergie/><ul style={{ margin: '4px 0 0', paddingLeft: 18, lineHeight: 1.6 }}><li>comparer la mesure au milieu d’un côté à la <strong>moyenne</strong> des deux sommets</li><li>beaucoup plus haut : synergie ; beaucoup plus bas : antagonisme</li></ul></>,
      texte: <>Un logiciel a construit un <strong>modèle</strong> à partir des essais 1 à 6 : il prévoit la fermeté en tout point du domaine. Les <strong>courbes isoréponses</strong> (en bleu) relient les mélanges de même fermeté prévue, indiquée en g. Placez le point <strong>sur la courbe 500{NB}g</strong> ; la fermeté prévue s’affiche dans « Mesures ».</>,
      tache: { type: 'action', ok: pNum != null && Math.abs(pNum - 500) <= 15, label: 'Placer le point pour moi', faire: () => setPt(pointSurNiveau(500)), consigne: 'Placez le point sur la courbe 500 g (domaine orange)' } },
    { id: 'choix', titre: 'Choisir une formule', focus: ['scene', 'mesures'],
      texte: <>Cahier des charges (fictif) : un rouge à lèvres ni trop mou ni trop dur, de fermeté <strong>entre 350 et 450{NB}g</strong>. La zone verte regroupe les formules qui conviennent. Placez le point dans cette zone. Plusieurs formules conviennent : on choisira ensuite selon d’autres critères (coût, toucher…).</>,
      tache: { type: 'action', ok: pNum != null && pNum >= ZONE.lo && pNum <= ZONE.hi, label: 'Placer le point pour moi', faire: () => setPt(pointSurNiveau(400)), consigne: 'Placez le point dans la zone verte (350 à 450 g)' } },
    { id: 'valider', titre: 'Le modèle est-il valable ?', focus: ['table'],
      texte: <>L’essai 7 (le centre) n’a pas servi à construire le modèle : c’est un <strong>essai de contrôle</strong>. Le modèle prévoit <strong>553{NB}g</strong> au centre, la mesure donne <strong>479{NB}g</strong>.</>,
      tache: { type: 'num', q: 'Écart relatif (prévu − mesuré) / mesuré', unite: '%', vrai: (PRED_C - Y7) / Y7 * 100, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        calcul: () => ['Écart : 553 − 479 = 74 g.', 'Écart relatif : 74 / 479 × 100 = 15 %.'],
        pieges: [[74, 'C’est l’écart en grammes. Divisez-le par la mesure (479 g) et multipliez par 100.']],
        expl: '(553 − 479) / 479 = 0,154, soit environ 15 %.', indice: 'Écart relatif = (prévu − mesuré) ÷ mesuré × 100.' } },
    { id: 'verdict', titre: 'Verdict', focus: ['table'],
      texte: <>La dispersion habituelle des mesures du texturomètre est d’environ <strong>5{NB}%</strong> (valeur choisie pour cet exercice : elle n’a pas été mesurée sur ce TP). Un écart d’environ 15{NB}% est trois fois plus grand.</>,
      tache: { type: 'qcm', q: 'Que conclure sur le modèle construit avec 6 essais ?', options: ['Il ne décrit pas assez bien la zone centrale : il faut le compléter ou faire d’autres essais', 'Il est validé, car l’écart est inférieur à 20 %', 'Il est validé : un modèle est toujours valable à l’endroit de la formule de départ'], bonne: 0,
        expl: 'Un modèle est valable si l’écart entre prévu et mesuré reste de l’ordre de la dispersion des mesures. Ici il est environ trois fois plus grand : il manque un terme au modèle.', indice: 'Comparez l’écart (15 %) à la dispersion des mesures (5 %).' } },
    { id: 'bilan', titre: 'Bilan', focus: ['scene'],
      texte: <>Vous savez lire et placer un mélange dans un diagramme ternaire, construire et exploiter un plan de mélange, repérer une synergie, utiliser des courbes isoréponses pour choisir une formule et contrôler un modèle avec un essai supplémentaire. Le niveau <strong>confirmé</strong> vous apprend à concevoir le plan vous-même et à calculer les coefficients.</>, tache: null },
  ];
  function pointSurNiveau(niv) {
    // point du domaine dont la fermeté prévue est proche de niv, cherché sur la médiane issue du sommet 2 (ricin) vers le milieu AC
    let best = null;
    for (let i = 0; i <= 100; i++) for (let j = 0; i + j <= 100; j++) {
      const z = [i / 100, j / 100, 1 - i / 100 - j / 100], v = fZ(z);
      const d = Math.abs(v - niv) + 0.01 * Math.hypot(z[0] - 1 / 3, z[1] - 1 / 3);
      if (!best || d < best.d) best = { d, z };
    }
    return M.pseudoVersReel(best.z, DOM);
  }

  // ════════════════ PARCOURS GUIDÉ : CONFIRMÉ (conception du plan et coefficients) ════════════════
  const m = FREF[1], s = 3 * m, L0 = FREF[0] - m, S1A = L0 + s, X5C = DOM.L[2] + DOM.s * 0.5;
  const f1 = v => nbf(v, 1);
  const [b12, b13] = [COEF.cubique[3], COEF.cubique[4]], b123 = COEF.cubique[6];
  const ETAPES_CONF = [
    { id: 'min', titre: 'Concevoir un plan autour de Fref', focus: ['scene'],
      texte: <>La formule de départ <strong>Fref</strong> contient {pc1(FREF[0])}{NB}% de candelilla, {pc1(FREF[1])}{NB}% d’huile de ricin et {pc1(FREF[2])}{NB}% de cire d’abeille. Vous devez construire le domaine d’étude : le plus grand triangle, de même orientation que le diagramme, dont Fref est le centre. Au centre d’un triangle de côté <em>s</em>, chaque proportion vaut <em>x</em><sub>i</sub> = <em>L</em><sub>i</sub> + <em>s</em>/3, où <em>L</em><sub>i</sub> est la proportion minimale du constituant i dans le domaine.</>,
      tache: { type: 'qcm', q: 'Une proportion minimale Lᵢ ne peut pas être négative. Quel constituant limite la taille du domaine ?', options: ['l’huile de ricin, qui a la plus petite proportion dans Fref', 'la cire d’abeille, qui a la plus grande proportion dans Fref', 'la candelilla, car elle est en haut du diagramme'], bonne: 0,
        expl: 'Lᵢ = xᵢ − s/3 ≥ 0 donne s ≤ 3 xᵢ pour chaque constituant : c’est la plus petite proportion qui impose la limite.', indice: 'Lᵢ = xᵢ − s/3 doit rester positif pour les trois constituants.' } },
    { id: 'cote', titre: 'Le côté maximal du domaine', focus: ['scene'],
      texte: <>La condition <em>L</em><sub>i</sub> ≥ 0 donne <em>s</em> ≤ 3<em>x</em><sub>i</sub> pour chaque constituant. Le domaine est le plus grand possible quand <em>s</em> = 3 × (plus petite proportion de Fref). Ici la plus petite proportion est celle de l’huile de ricin : {pc1(FREF[1])}{NB}%.</>,
      tache: { type: 'num', q: 'Côté s du domaine', unite: '%', vrai: 100 * s, tol: 0.01, affiche: f1, cs: 3,
        calcul: () => [`Plus petite proportion : 5 / 23 = ${pc1(FREF[1])} % (huile de ricin).`, `s = 3 × ${pc1(FREF[1])} = ${f1(100 * s)} %.`],
        pieges: [[100 * FREF[1], 'C’est la plus petite proportion. Le côté vaut 3 fois cette valeur.']],
        expl: `s = 3 × ${pc1(FREF[1])} = ${f1(100 * s)} %.`, indice: 's = 3 × (plus petite proportion de Fref).' } },
    { id: 'bornes', titre: 'Les proportions minimales', focus: ['scene'],
      texte: <>Dans le domaine, chaque constituant a une proportion minimale <em>L</em><sub>i</sub> = <em>x</em><sub>i</sub> − <em>s</em>/3, avec <em>s</em>/3 = {pc1(m)}{NB}%. Pour l’huile de ricin : <em>L</em> = 0{NB}%. Calculez celle de la candelilla (<em>x</em> = {pc1(FREF[0])}{NB}%).</>,
      tache: { type: 'num', q: 'Proportion minimale de candelilla dans le domaine', unite: '%', vrai: 100 * L0, tol: 0.02, affiche: f1, cs: 3,
        calcul: () => [`s/3 = ${pc1(m)} %.`, `L = ${pc1(FREF[0])} − ${pc1(m)} = ${f1(100 * L0)} %.`],
        pieges: [[100 * FREF[0], 'C’est la proportion dans Fref. Retranchez s/3.']],
        expl: `${pc1(FREF[0])} − ${pc1(m)} = ${f1(100 * L0)} %.`, indice: 'L = x − s/3.' } },
    { id: 'sommets', titre: 'Les sommets du domaine', focus: ['scene'],
      retenirTitre: 'À RETENIR : LE PLUS GRAND DOMAINE CENTRÉ SUR FREF', retenir: <><CarteDomaine/><ul style={{ margin: '4px 0 0', paddingLeft: 18, lineHeight: 1.6 }}><li>au sommet i : <em>L</em><sub>i</sub> + <em>s</em> pour le constituant i, <em>L</em> pour les deux autres</li><li>le constituant le moins abondant dans Fref limite la taille du domaine</li></ul></>,
      texte: <>Aux sommets du domaine, deux constituants sont à leur minimum <em>L</em><sub>i</sub> et le troisième vaut <em>L</em><sub>i</sub> + <em>s</em>. Au sommet 1 (candelilla maximale) : <em>L</em> = {f1(100 * L0)}{NB}% et <em>s</em> = {f1(100 * s)}{NB}%.</>,
      tache: { type: 'num', q: 'Proportion de candelilla au sommet 1', unite: '%', vrai: 100 * S1A, tol: 0.01, affiche: f1, cs: 3,
        calcul: () => [`L + s = ${f1(100 * L0)} + ${f1(100 * s)} = ${f1(100 * S1A)} %.`],
        pieges: [[100 * s, 'C’est le côté s seul. Ajoutez la proportion minimale L.']],
        expl: `${f1(100 * L0)} + ${f1(100 * s)} = ${f1(100 * S1A)} %. Le domaine apparaît dans le diagramme.`, indice: 'Sommet 1 : proportion de candelilla = L + s.' } },
    { id: 'pseudo', titre: 'Des pseudo-composants aux proportions', focus: ['scene'],
      texte: <>Le plan est décrit en <strong>pseudo-composants</strong> <em>z</em><sub>i</sub> (de 0 à 1 dans le domaine) : <em>x</em><sub>i</sub> = <em>L</em><sub>i</sub> + <em>s</em>·<em>z</em><sub>i</sub>. L’essai 5 est au milieu du côté sommet 1 – sommet 3 : <em>z</em> = (0,5 ; 0 ; 0,5). Pour la cire d’abeille : <em>L</em> = {f1(100 * DOM.L[2])}{NB}% et <em>s</em> = {f1(100 * s)}{NB}%.</>,
      tache: { type: 'num', q: 'Proportion réelle de cire d’abeille dans l’essai 5', unite: '%', vrai: 100 * X5C, tol: 0.01, affiche: f1, cs: 3,
        calcul: () => [`x = L + s × z = ${f1(100 * DOM.L[2])} + ${f1(100 * s)} × 0,5 = ${f1(100 * X5C)} %.`],
        pieges: [[50, 'z = 0,5 n’est pas 50 % de cire d’abeille : appliquez x = L + s × z.']],
        expl: `${f1(100 * DOM.L[2])} + ${f1(100 * s)} × 0,5 = ${f1(100 * X5C)} %.`, indice: 'x = L + s × z, avec z = 0,5.' } },
    { id: 'plan', titre: 'Les 7 essais et leurs mesures', focus: ['scene', 'table'],
      texte: <>Le tableau donne les 7 essais (en pseudo-composants et en %) avec la fermeté mesurée, une seule mesure par essai. Le modèle de Scheffé s’écrit <em>Ŷ</em> = β<sub>1</sub><em>z</em><sub>1</sub> + β<sub>2</sub><em>z</em><sub>2</sub> + β<sub>3</sub><em>z</em><sub>3</sub> + β<sub>12</sub><em>z</em><sub>1</sub><em>z</em><sub>2</sub> + β<sub>13</sub><em>z</em><sub>1</sub><em>z</em><sub>3</sub> + β<sub>23</sub><em>z</em><sub>2</sub><em>z</em><sub>3</sub> : <strong>il n’a pas de terme constant</strong>.</>,
      tache: { type: 'qcm', q: 'Pourquoi le modèle de Scheffé n’a-t-il pas de terme constant ?', options: ['Parce que z₁ + z₂ + z₃ = 1 : un terme constant serait redondant', 'Parce que la réponse est nulle quand tous les constituants sont absents', 'Parce que le plan n’a pas de point au centre'], bonne: 0,
        expl: 'Comme z₁ + z₂ + z₃ = 1, une constante β₀ peut s’écrire β₀(z₁ + z₂ + z₃) : elle est déjà contenue dans les coefficients β₁, β₂, β₃.', indice: 'Que vaut la somme des trois pseudo-composants ?' } },
    { id: 'beta12', titre: 'Un coefficient d’interaction à la main', focus: ['table'],
      texte: <>Au sommet 1 (<em>z</em> = (1 ; 0 ; 0)), <em>Ŷ</em> = β<sub>1</sub> : donc β<sub>1</sub> = 288{NB}g, β<sub>2</sub> = 141{NB}g, β<sub>3</sub> = 407{NB}g. Au milieu du côté 1–2 (<em>z</em> = (½ ; ½ ; 0)) : <em>Ŷ</em> = β<sub>1</sub>/2 + β<sub>2</sub>/2 + β<sub>12</sub>/4, d’où β<sub>12</sub> = 4<em>y</em><sub>12</sub> − 2<em>y</em><sub>1</sub> − 2<em>y</em><sub>2</sub>. Calculez β<sub>12</sub> avec <em>y</em><sub>12</sub> = 377{NB}g (essai 4).</>,
      tache: { type: 'num', q: 'Coefficient β₁₂', unite: 'g', vrai: b12, tol: 0.01, affiche: v => nbf(v, 0), cs: 3,
        calcul: () => ['β₁₂ = 4 y₁₂ − 2 y₁ − 2 y₂ = 4 × 377 − 2 × 288 − 2 × 141.', '= 1508 − 576 − 282 = 650 g.'],
        pieges: [[377 - (288 + 141) / 2, 'C’est l’écart au milieu y₁₂ − (y₁ + y₂)/2. Le coefficient β₁₂ en est le quadruple.']],
        expl: 'β₁₂ = 1508 − 576 − 282 = 650 g.', indice: 'β₁₂ = 4 y₁₂ − 2 y₁ − 2 y₂, avec y₁ = 288 g, y₂ = 141 g et y₁₂ = 377 g.' } },
    { id: 'beta13', titre: 'Un deuxième coefficient', focus: ['table'],
      retenirTitre: 'À RETENIR : LE COEFFICIENT D’INTERACTION', retenir: <><CarteBeta/><ul style={{ margin: '4px 0 0', paddingLeft: 18, lineHeight: 1.6 }}><li><strong>β<sub>i</sub> = valeur au sommet i</strong> (le constituant seul du domaine)</li><li>β<sub>ij</sub> = 4 × (mesure au milieu − moyenne des sommets)</li></ul></>,
      texte: <>Même méthode pour les constituants 1 et 3 (candelilla et cire d’abeille) : <em>y</em><sub>1</sub> = 288{NB}g, <em>y</em><sub>3</sub> = 407{NB}g et <em>y</em><sub>13</sub> = 822{NB}g (essai 5).</>,
      tache: { type: 'num', q: 'Coefficient β₁₃', unite: 'g', vrai: b13, tol: 0.01, affiche: v => nbf(v, 0), cs: 3,
        calcul: () => ['β₁₃ = 4 × 822 − 2 × 288 − 2 × 407.', '= 3288 − 576 − 814 = 1898 g.'],
        pieges: [[822 - (288 + 407) / 2, 'C’est l’écart au milieu. Multipliez-le par 4.']],
        expl: 'β₁₃ = 3288 − 576 − 814 = 1898 g.', indice: 'β₁₃ = 4 y₁₃ − 2 y₁ − 2 y₃.' } },
    { id: 'signes', titre: 'Interpréter les coefficients', focus: ['table'],
      texte: <>On calcule de même β<sub>23</sub> = 4 × 254 − 2 × 141 − 2 × 407 = −80{NB}g (essai 6). Rappel : β<sub>13</sub> = 1898{NB}g et β<sub>12</sub> = 650{NB}g.</>,
      tache: { type: 'qcm', q: 'Que peut-on dire ?', options: ['La candelilla et la cire d’abeille ont une forte synergie ; l’interaction huile – cire d’abeille est faible et son signe incertain', 'Les trois interactions sont fortes', 'β₂₃ négatif prouve que l’huile et la cire d’abeille sont incompatibles'], bonne: 0,
        expl: 'β₁₃ est très grand et positif : forte synergie. β₂₃ = −80 g est petit devant les autres : avec une seule mesure par essai, on ne peut pas affirmer que cette interaction est réellement négative.', indice: 'Comparez les valeurs absolues de β₁₃ et de β₂₃.' } },
    { id: 'prevoir', titre: 'Prédire au centre', focus: ['table'],
      texte: <>Avec les 6 coefficients (β<sub>1</sub> = 288, β<sub>2</sub> = 141, β<sub>3</sub> = 407, β<sub>12</sub> = 650, β<sub>13</sub> = 1898, β<sub>23</sub> = −80, en g), prédisez la fermeté au centre : <em>z</em> = (⅓ ; ⅓ ; ⅓). On obtient <em>Ŷ</em> = (β<sub>1</sub> + β<sub>2</sub> + β<sub>3</sub>)/3 + (β<sub>12</sub> + β<sub>13</sub> + β<sub>23</sub>)/9.</>,
      tache: { type: 'num', q: 'Fermeté prévue au centre', unite: 'g', vrai: PRED_C, tol: 0.01, affiche: f1, cs: 3,
        calcul: () => ['(288 + 141 + 407)/3 = 836/3 = 278,7 g.', '(650 + 1898 − 80)/9 = 2468/9 = 274,2 g.', 'Ŷ = 278,7 + 274,2 = 552,9 g.'],
        pieges: [[278.67, 'Il manque le terme d’interaction : ajoutez (β₁₂ + β₁₃ + β₂₃)/9.']],
        expl: 'Ŷ = 278,7 + 274,2 = 552,9 g, alors que la mesure au centre donne 479 g.', indice: 'Au centre, chaque zᵢ vaut 1/3 et chaque produit zᵢzⱼ vaut 1/9.' } },
    { id: 'beta123', titre: 'Un septième coefficient', focus: ['table'],
      texte: <>Le modèle prévoit 552,9{NB}g, la mesure donne 479{NB}g : écart de −74{NB}g. On ajoute le terme β<sub>123</sub><em>z</em><sub>1</sub><em>z</em><sub>2</sub><em>z</em><sub>3</sub> (modèle « cubique spécial »). Au centre, <em>z</em><sub>1</sub><em>z</em><sub>2</sub><em>z</em><sub>3</sub> = 1/27, donc β<sub>123</sub> = 27 × (479 − 552,9).</>,
      tache: { type: 'num', q: 'Coefficient β₁₂₃', unite: 'g', vrai: b123, tol: 0.01, affiche: v => nbf(v, 0), cs: 3,
        calcul: () => ['β₁₂₃ = 27 × (y₁₂₃ − Ŷ) = 27 × (479 − 552,9).', '= 27 × (−73,9) = −1995 g.'],
        pieges: [[-73.9, 'C’est l’écart au centre. Multipliez-le par 27.']],
        expl: 'β₁₂₃ = 27 × (−73,9) ≈ −1995 g.', indice: 'β₁₂₃ = 27 × (mesure − prévision au centre).' } },
    { id: 'exact', titre: 'Un modèle exact est-il validé ?', focus: ['table'],
      texte: <>Avec 7 coefficients et 7 essais, le modèle passe exactement par toutes les mesures (tous les écarts du tableau sont nuls).</>,
      tache: { type: 'qcm', q: 'Peut-on dire que ce modèle est validé ?', options: ['Non : il ne reste aucun degré de liberté, on ne peut rien tester avec ces essais', 'Oui : un modèle qui passe par tous les points est parfait', 'Oui : son R² vaut 1'], bonne: 0,
        expl: 'Degrés de liberté = essais − coefficients = 7 − 7 = 0. Passer par tous les points est automatique avec autant de coefficients que d’essais : il faut des essais supplémentaires (contrôle, répétitions) pour valider.', indice: 'Combien de degrés de liberté reste-t-il avec 7 essais et 7 coefficients ?' } },
    { id: 'maximum', titre: 'Utiliser le modèle', focus: ['scene', 'mesures'],
      retenirTitre: 'À RETENIR : UN MODÈLE EXACT N’EST PAS UN MODÈLE VALIDÉ', retenir: <><CarteDdl/><ul style={{ margin: '4px 0 0', paddingLeft: 18, lineHeight: 1.6 }}><li>degrés de liberté = nombre d’essais − nombre de coefficients</li><li>0 ddl : aucun test possible, il faut contrôler ou répéter</li></ul></>,
      texte: <>Les courbes isoréponses du modèle complet s’affichent. Où se trouve la formule <strong>la plus ferme</strong> du domaine ? Placez le point sur le maximum.</>,
      tache: { type: 'action', ok: pNum != null && pNum >= 0.96 * MAXIMUM.y, label: 'Placer le point pour moi', faire: () => setPt(M.pseudoVersReel(MAXIMUM.z, DOM)), consigne: 'Placez le point sur le maximum de fermeté (dans le domaine)' } },
    { id: 'bilan', titre: 'Bilan', focus: ['scene'],
      texte: <>Vous savez construire le plus grand domaine centré sur une formule de référence, passer des pseudo-composants aux proportions, calculer les coefficients de Scheffé à la main et expliquer pourquoi un modèle exact n’est pas validé. Le niveau <strong>expert</strong> ajoute une contrainte, des répétitions et un second critère : le coût.</>, tache: null },
  ];

  // ════════════════ PARCOURS GUIDÉ : EXPERT (hors programme) ════════════════
  const tq = M.student95(Q7.ddl), demi = tq * Q7.se[3];
  const LOT = manque(SIGMA0, 3);
  const bonneManque = LOT.rejet ? 0 : 1;
  const ETAPES_EXP = [
    { id: 'region', titre: 'Une contrainte supplémentaire', focus: ['scene'],
      texte: <>Le service qualité impose, pour le toucher, <strong>au plus 40{NB}% d’huile de ricin</strong>. La région autorisée n’est plus un triangle : la droite « huile de ricin = 40 % » la coupe (bleu pointillé). Les 7 essais du plan sont tracés.</>,
      tache: { type: 'num', q: 'Combien de sommets a la région autorisée ?', unite: '', vrai: REGION.length, tol: 0, affiche: v => nbf(v, 0),
        calcul: () => ['Le triangle d’origine a 3 sommets. La droite « huile = 40 % » coupe le sommet 2 (65 % d’huile) et le remplace par 2 nouveaux sommets.', '3 − 1 + 2 = 4 sommets.'],
        expl: 'La région a 4 sommets : le sommet 2 est coupé et remplacé par deux points sur la droite huile de ricin = 40 %.', indice: 'Repérez où la droite pointillée coupe les deux côtés qui partent du sommet huile de ricin.' } },
    { id: 'essaisRegion', titre: 'Que devient le plan ?', focus: ['scene', 'table'],
      texte: <>Les 7 essais ont été réalisés dans le triangle d’origine. Combien d’entre eux se trouvent dans la région autorisée (huile de ricin ≤ 40{NB}%) ?</>,
      tache: { type: 'num', q: 'Nombre d’essais dans la région autorisée', unite: '', vrai: ESSAIS.filter(e => e.x[1] <= B_MAX + 1e-9).length, tol: 0, affiche: v => nbf(v, 0),
        calcul: () => ['Seul l’essai 2 (65 % d’huile de ricin) dépasse 40 %.', '7 − 1 = 6 essais.'],
        expl: 'Six essais sur sept : seul l’essai 2 est exclu. Le modèle, ajusté sur tout le triangle, reste utilisable dans la région (interpolation). Pour un nouveau plan sous contrainte, il faudrait placer des essais aux sommets de la région et en leur centre.', indice: 'Regardez quels numéros sont du côté « huile de ricin > 40 % » de la droite.' } },
    { id: 'ddl', titre: 'Peut-on valider ?', focus: ['table'],
      texte: <>Revenons au modèle à 6 coefficients, ajusté par moindres carrés sur les <strong>7 essais</strong> : il reste 7 − 6 = <strong>1 degré de liberté</strong>. L’écart-type résiduel <em>s</em> = {nbf(Q7.s, 0)}{NB}g n’est donc estimé qu’avec 1 degré de liberté. Avec la loi de Student (<em>t</em> = {nbf(tq, 2)} à 95 %), l’intervalle de confiance de β<sub>12</sub> est {nbf(Q7.coefs[3], 0)} ± {nbf(demi, 0)}{NB}g.</>,
      tache: { type: 'qcm', q: 'Peut-on affirmer que β₁₂ est différent de zéro ?', options: ['Non : l’intervalle de confiance contient 0', 'Oui : β₁₂ vaut 549 g, nettement positif', 'Oui : le modèle passe presque par tous les points'], bonne: 0,
        expl: `L’intervalle ${nbf(Q7.coefs[3] - demi, 0)} à ${nbf(Q7.coefs[3] + demi, 0)} g contient 0. Avec 1 seul degré de liberté, l’incertitude est énorme : aucun coefficient ne peut être testé. Ce calcul suppose des erreurs indépendantes, de même écart-type et de loi normale.`, indice: 'Un intervalle de confiance qui contient 0 ne permet pas de conclure que le coefficient est non nul.' } },
    { id: 'repeter', titre: 'Répéter l’essai au centre', focus: ['scene', 'table'],
      retenirTitre: 'À RETENIR : LES DEGRÉS DE LIBERTÉ', retenir: <><CarteDdl/><ul style={{ margin: '4px 0 0', paddingLeft: 18, lineHeight: 1.6 }}><li>ddl = essais − coefficients</li><li>répéter un essai donne la dispersion pure des mesures</li></ul></>,
      texte: <>Pour estimer la dispersion des mesures, on <strong>répète 3 fois l’essai central</strong>. Les valeurs sont <strong>simulées</strong> : on suppose des mesures indépendantes, de loi normale, d’écart-type σ = {SIGMA0}{NB}g (5{NB}% de 479{NB}g, hypothèse de l’exercice). Elles s’ajoutent à la mesure initiale.</>,
      tache: { type: 'action', ok: rep >= 3, label: 'Ajouter 3 répétitions', faire: () => { setSigma(SIGMA0); setRep(3); }, consigne: 'Ajoutez 3 répétitions de l’essai central' } },
    { id: 'ecartType', titre: 'L’écart-type expérimental', focus: ['table'],
      texte: <>Les 4 mesures de l’essai central (la mesure initiale et les 3 répétitions) sont affichées dans « Essai central ». Calculez leur <strong>écart-type expérimental</strong> <em>s</em> (avec <em>n</em> − 1 au dénominateur).</>,
      tache: { type: 'num', q: 'Écart-type expérimental s des 4 mesures', unite: 'g', vrai: stat(valsCentre(SIGMA0, 3)).s, tol: 0.05, affiche: v => nbf(v, 1), cs: 2,
        bloque: repEff >= 3 ? null : 'Ajoutez d’abord les 3 répétitions (étape précédente).',
        calcul: () => { const v = valsCentre(SIGMA0, 3), st = stat(v); return [`Valeurs : ${v.join(' ; ')} g ; moyenne = ${nbf(st.m, 1)} g.`, `s = √[ Σ(yᵢ − moyenne)² / (n − 1) ] = ${nbf(st.s, 1)} g.`]; },
        expl: 'Écart-type des 4 mesures, avec n − 1 = 3 degrés de liberté.', indice: 's = √[ Σ(yᵢ − moyenne)² / (n − 1) ].' } },
    { id: 'manque', titre: 'Le modèle quadratique est-il rejeté ?', focus: ['table'],
      texte: <>Le modèle à 6 coefficients (construit sur les essais 1 à 6) prévoit <strong>{nbf(PRED_C, 1)}{NB}g</strong> au centre. La moyenne des 4 mesures du centre est <strong>{nbf(LOT.m, 1)}{NB}g</strong>, avec <em>s</em> = {nbf(LOT.s, 1)}{NB}g. Pour la comparer, on calcule <em>t</em> = |moyenne − prévu| / (<em>s</em>/√<em>n</em>) = {nbf(LOT.t, 1)}, à comparer à la valeur de Student à 3 ddl (95 %) : {nbf(LOT.crit, 2)}.</>,
      tache: { type: 'qcm', q: 'Que conclure ?', options: ['Rejeté : l’écart au centre est trop grand pour s’expliquer par la seule dispersion des mesures', 'Non rejeté : l’écart est du même ordre que la dispersion', 'On ne peut rien conclure avec 4 mesures'], bonne: bonneManque,
        expl: LOT.rejet ? `t = ${nbf(LOT.t, 1)} > ${nbf(LOT.crit, 2)} : le modèle à 6 coefficients est mis en défaut au centre (manque d’ajustement). Le terme β₁₂₃ est justifié. Cette conclusion dépend de σ : avec une dispersion bien plus grande, on ne pourrait pas conclure (essayez dans l’exploration).` : `t = ${nbf(LOT.t, 1)} ≤ ${nbf(LOT.crit, 2)} : on ne peut pas rejeter le modèle.`, indice: 'Si t dépasse la valeur de Student, l’écart n’est pas dû au hasard.' } },
    { id: 'cout', titre: 'Une deuxième réponse : le coût', focus: ['scene', 'mesures'],
      texte: <>On calcule le coût matière des trois corps gras avec des <strong>prix indicatifs</strong> (candelilla {M.PRIX[0]}{NB}€/kg, huile de ricin {M.PRIX[1]}{NB}€/kg, cire d’abeille {M.PRIX[2]}{NB}€/kg ; valeurs choisies pour l’exercice, à remplacer par celles que vous relevez). Les courbes <strong>isocoût</strong> (vert) remplacent les isoréponses de fermeté.</>,
      tache: { type: 'qcm', q: 'Pourquoi les courbes isocoût sont-elles des droites parallèles ?', options: ['Le coût est une moyenne pondérée des prix : modèle linéaire, sans terme d’interaction', 'Parce que la fermeté est linéaire', 'Parce que le prix de la cire d’abeille est le plus élevé'], bonne: 0,
        expl: 'Coût = Σ xᵢ × prixᵢ : c’est un modèle de Scheffé linéaire (tous les βᵢⱼ sont nuls). Un coût n’a pas de synergie, contrairement à la fermeté.', indice: 'Y a-t-il un terme xᵢxⱼ dans le calcul d’un coût ?' } },
    { id: 'optimum', titre: 'La formule la moins chère qui convient', focus: ['scene', 'mesures'],
      texte: <>Cahier des charges (fictif) : fermeté entre <strong>350 et 450{NB}g</strong> (zone verte) et huile de ricin ≤ 40{NB}%. Parmi ces formules, trouvez la <strong>moins chère</strong> : le coût s’affiche dans « Mesures ».</>,
      tache: { type: 'action', ok: pNum != null && pNum >= ZONE.lo && pNum <= ZONE.hi && pt[1] <= B_MAX + 1e-9 && cout <= MEILLEUR.c + 0.3, label: 'Placer le point pour moi', faire: () => setPt(MEILLEUR.x), consigne: 'Placez le point sur la formule la moins chère de la zone verte' } },
    { id: 'hypotheses', titre: 'Les limites de l’analyse', focus: ['scene'],
      texte: <>Dans le TP, la note sensorielle d’un rouge à lèvres est la <strong>distance (en cm) qui le sépare du moins apprécié</strong> sur une règle : le plus mauvais a 0, le meilleur 100.</>,
      tache: { type: 'qcm', q: 'Peut-on traiter cette note comme une mesure à erreur normale, d’écart-type constant ?', options: ['Non : c’est une échelle relative, propre à chaque juge et bornée entre 0 et 100 ; les hypothèses du modèle sont douteuses', 'Oui : c’est un nombre, donc une mesure comme une autre', 'Oui : la moyenne du jury suffit à garantir la normalité'], bonne: 0,
        expl: 'Les notes dépendent du lot présenté et de chaque juge, et sont bornées : l’écart-type n’est pas constant ni l’erreur normale. Les tests du modèle sont alors à interpréter avec prudence (classement, médiane, ou plan d’analyse sensorielle adapté).', indice: 'Que valent la note du plus mauvais et celle du meilleur, quels que soient les essais ?' } },
    { id: 'bilan', titre: 'Bilan', focus: ['scene'],
      texte: <>Vous savez travailler sous contrainte, compter les degrés de liberté, estimer une dispersion par répétition, tester le manque d’ajustement avec la loi de Student, croiser deux réponses (fermeté, coût) et discuter les hypothèses d’un modèle.</>, tache: null },
  ];

  const ETAPES = niveau === 'conf' ? ETAPES_CONF : niveau === 'exp' ? ETAPES_EXP : ETAPES_DEB;
  const hl = id => enGuide && ETAPES[Math.min(etape, ETAPES.length - 1)].focus.includes(id);
  const cadre = id => (hl(id) ? { outline: `3px dashed ${ORANGE_GUIDE}`, outlineOffset: 3, borderRadius: 10 } : {});

  // ---------- panneaux ----------
  const setA = v => { const a = v / 100, c = Math.min(pt[2], 1 - a); setPt([a, 1 - a - c, c]); };
  const setC = v => { const c = v / 100; setPt([pt[0], 1 - pt[0] - c, c]); };
  const reglages = (vSliders || enDefi) && (
    <div style={{ ...styleBoite, ...cadre('reglages') }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>Position du point (précision)</div>
      <Curseur nom="Cire de candelilla" valeur={Math.round(100 * pt[0])} onChange={setA} min={0} max={100} pas={1} unite="%" couleur="#b45309"/>
      <Curseur nom="Cire d’abeille" valeur={Math.round(100 * pt[2])} onChange={setC} min={0} max={Math.round(100 * (1 - pt[0]))} pas={1} unite="%" couleur="#7c3aed"/>
      <div style={{ fontSize: 13, color: KIT.txt2 }}>L’huile de ricin se déduit : 100 % − les deux autres.</div>
    </div>);
  const mesures = !enDefi && vMes && (
    <div style={{ ...styleBoite, ...cadre('mesures') }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>Mesures au point orange</div>
      {vCompo ? <>
        <LigneMesure nom="Candelilla" valeur={`${nbf(100 * pt[0], 1)}${NB}%`} couleur="#b45309"/>
        <LigneMesure nom="Huile de ricin" valeur={`${nbf(100 * pt[1], 1)}${NB}%`} couleur="#0f766e"/>
        <LigneMesure nom="Cire d’abeille" valeur={`${nbf(100 * pt[2], 1)}${NB}%`} couleur="#7c3aed"/>
      </> : <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Lisez les proportions sur le diagramme.</div>}
      {vPseudo && vDomaine && vCompo && <LigneMesure nom="Pseudo-composants z" valeur={hors ? 'hors domaine' : M.reelVersPseudo(pt, DOM).map(v => nbf(Math.max(0, v), 2)).join(' ; ')}/>}
      {vPred && vCompo && <LigneMesure nom={`Fermeté prévue (${degre === 'lineaire' ? 'linéaire' : degre === 'quadratique' ? 'quadratique' : 'cubique spécial'})`} valeur={pNum == null ? 'hors domaine' : `${nbf(pNum, 0)}${NB}g`} couleur="#1d4ed8"/>}
      {(vCoutIso || (!enGuide && explo.reponse === 'cout')) && vCompo && <LigneMesure nom="Coût matière" valeur={`${nbf(cout, 1)}${NB}€/kg`} couleur="#15803d"/>}
      {pNum == null && vPred && vCompo && hors && <div style={{ fontSize: 13, color: '#b45309', marginTop: 4 }}>Hors du domaine d’étude, le modèle n’est pas valable : pas de prévision.</div>}
    </div>);
  const lignesTab = ESSAIS.map(e => e);
  const modTab = z => M.predit(fit.coefs, degre, z);
  const tableEssais = vPlan && (vMesures || dev) && (
    <div style={{ ...styleBoite, ...cadre('table') }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>Les 7 essais du plan</div>
      {vMesures ? <TableEssais lignes={lignesTab} pseudo={!dev} modele={!enGuide || (conf && apres('prevoir')) || (exp && des('manque')) ? modTab : null} resid={!enGuide || (conf && apres('prevoir')) || (exp && des('manque'))} cacher7={enGuide && dev && !des('valider')}/>
        : <TableEssais lignes={lignesTab.map(e => ({ ...e, y: '' }))} pseudo={false}/>}
      {!enGuide && <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4 }}>Fermeté mesurée au texturomètre (une mesure par essai, TP réel). « Prévu » : valeur donnée par le modèle choisi.</div>}
    </div>);
  const boiteCentre = (exp || !enGuide) && repEff > 0 && (
    <div style={{ ...styleBoite, ...cadre('table') }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>Essai central : {centre.length} mesures</div>
      <div style={{ fontSize: 13.5, color: KIT.txt, lineHeight: 1.6 }}>{centre.join(' ; ')}{NB}g<br/>moyenne = {nbf(stC.m, 1)}{NB}g · {stC.s != null && <>écart-type <em>s</em> = {nbf(stC.s, 1)}{NB}g</>}<br/><span style={{ color: KIT.txt2, fontSize: 12.5 }}>Mesure initiale réelle ; répétitions <strong>simulées</strong> (σ = {sigEff}{NB}g supposé).</span></div>
    </div>);
  const coefsBox = enExplo && (
    <div style={styleBoite}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 4 }}>Coefficients du modèle (g)</div>
      <div style={{ fontSize: 13.5, color: KIT.txt, lineHeight: 1.6, fontFamily: 'monospace' }}>
        {fit.noms.map((n, i) => <span key={n} style={{ display: 'inline-block', marginRight: 12 }}>{n} = {nbf(fit.coefs[i], 0)}{fit.se ? ` ± ${nbf(M.student95(fit.ddl) * fit.se[i], 0)}` : ''}</span>)}
      </div>
      <div style={{ fontSize: 13, color: KIT.txt2, marginTop: 4 }}>R² = {nbf(fit.r2, 3)} · {fit.n} essais − {fit.p} coefficients = <strong>{fit.ddl} ddl</strong>{fit.ddl === 0 ? ' : aucun test possible' : ` · intervalle de confiance à 95 % (Student, ${fit.ddl} ddl)`}</div>
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Proportions</strong> : fractions massiques des trois corps gras (candelilla, huile de ricin, cire d’abeille), de somme 1 ; les autres ingrédients du rouge à lèvres sont identiques dans tous les essais.</li>
      <li><strong>Données réelles</strong> : fermeté mesurée au texturomètre (force maximale, mobile « guillotine ») sur les 7 essais d’un TP. <strong>Une seule mesure par essai</strong> : la répétabilité n’a pas été mesurée.</li>
      <li><strong>Modèle de Scheffé</strong> sans terme constant, valable <strong>seulement dans le domaine du plan</strong> (interpolation). En dehors, la simulation n’affiche pas de prévision.</li>
      <li><strong>Validité</strong> : la dispersion de 5 % utilisée dans le parcours débutant est une valeur choisie pour l’exercice, pas une mesure.</li>
      <li><strong>Répétitions simulées (expert)</strong> : tirées dans une loi normale d’écart-type σ choisi (24 g par défaut), mesures indépendantes. La loi de Student et le test de manque d’ajustement supposent des erreurs indépendantes, de même écart-type et de loi normale.</li>
      <li><strong>Coût et cahier des charges</strong> : prix indicatifs, fermeté demandée (350 à 450 g) et limite de 40 % d’huile de ricin fictifs, choisis pour l’exercice.</li>
      <li><strong>Fermeté ≠ qualité d’usage</strong> : la fermeté ne dit rien du toucher, de l’étalement ni de la tenue ; ils s’évaluent par l’analyse sensorielle.</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {niveau !== 'exp' && <button onClick={() => { setNiveau(niveau === 'deb' ? 'conf' : 'exp'); setPt(P0); }} style={styleBouton(true, ORANGE_GUIDE)}>Niveau suivant</button>}
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- défi ----------
  const champ = (cle, label, unite) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6, fontSize: 14 }}>
      <span style={{ minWidth: 150 }}>{label}</span>
      <input value={defi.reps[cle] ?? ''} aria-label={label} onKeyDown={e => e.key === 'Enter' && document.getElementById('pm-verif')?.click()} onChange={e => setRepD(cle, e.target.value)}
        style={{ width: 90, padding: '5px 8px', borderRadius: 6, border: `1.5px solid ${defi.verifie ? (defi.ok ? '#15803d' : '#dc2626') : KIT.bord}`, fontSize: 14 }}/><span>{unite}</span>
    </div>);
  const voletDefi = defi && (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['lire', 'Lire une composition'], ['cible', 'Viser une fermeté'], ['beta', 'Un coefficient']].map(([t, l]) => <button key={t} onClick={() => choisirDefi(t)} aria-pressed={defi.type === t} style={stylePetitBouton(defi.type === t, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>{defi.type === 'lire' ? 'Défi : quelle est la composition du point orange ?' : defi.type === 'cible' ? `Défi : placez le point sur une formule de fermeté prévue entre ${defi.t - 25} et ${defi.t + 25}${NB}g` : 'Défi : calculez le coefficient β₁₂'}</div>
      <div style={{ fontSize: 14, color: KIT.txt, marginBottom: 8, lineHeight: 1.5 }}>
        {defi.type === 'lire' && <>Lisez les proportions du point P sur le diagramme (échelles de même couleur que les noms) et donnez les trois valeurs, à 3 points près.</>}
        {defi.type === 'cible' && <>Le modèle est celui du parcours expert (7 essais réels). Déplacez le point dans le domaine d’étude (triangle orange) et lisez la fermeté prévue dans « Mesures » ; les courbes bleues sont les isoréponses.</>}
        {defi.type === 'beta' && <>Dans un plan en réseau (simulation de mesures fictives), la fermeté vaut {defi.y1}{NB}g au sommet 1, {defi.y2}{NB}g au sommet 2 et {defi.y12}{NB}g au milieu du côté 1–2. Calculez β₁₂.</>}
      </div>
      {defi.type === 'lire' && <>{champ('a', 'Candelilla', '%')}{champ('b', 'Huile de ricin', '%')}{champ('c', 'Cire d’abeille', '%')}<IndiceDefi cache={false}>Chaque proportion se lit sur l’échelle de sa couleur, en suivant la ligne de la grille parallèle au côté opposé. La somme vaut 100 %.</IndiceDefi></>}
      {defi.type === 'cible' && <IndiceDefi cache={false}>Choisissez d’abord la courbe isoréponse dont la valeur est au milieu de la fenêtre, puis placez le point dessus.</IndiceDefi>}
      {defi.type === 'beta' && <>{champ('b', 'β₁₂', 'g')}<IndiceDefi cache={false}>β₁₂ = 4 y₁₂ − 2 y₁ − 2 y₂.</IndiceDefi></>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button id="pm-verif" onClick={verifierDefi} style={styleBouton(true, '#15803d')}>Vérifier</button>
        <button onClick={() => nouveauDefi(defi.type)} style={styleBouton(false)}><Pic n="refresh"/>Nouveau défi</button>
      </div>
      {defi.verifie && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 14, fontWeight: 700, lineHeight: 1.5, color: defi.ok ? '#15803d' : '#dc2626' }}>{defi.msg}</div>}
    </div>);

  // ---------- à essayer / à retenir ----------
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6, color: KIT.txt }}>
        <li>Passez du modèle <strong>linéaire</strong> au <strong>quadratique</strong> : que devient R² ? Quel terme explique le gain ?</li>
        <li>Mettez l’essai 7 de côté (« contrôle ») : l’écart prévu − mesuré change-t-il selon le modèle ?</li>
        <li>Affichez le <strong>coût</strong> : pourquoi ses courbes sont-elles des droites ?</li>
        <li>Activez la <strong>région contrainte</strong> et la zone du cahier des charges : où se trouvent les formules les moins chères ?</li>
        <li>Dans « Pour aller plus loin », ajoutez des répétitions et faites varier σ : à partir de quelle dispersion ne peut-on plus rejeter le modèle ?</li>
      </ul>
    </div>);
  const retenir = (
    <ARetenir>
      <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
        <li>plan de mélange : proportions de somme 100 %, un point du triangle = un mélange</li>
        <li>modèle de Scheffé : β<sub>i</sub> = valeur au sommet, β<sub>ij</sub> = 4 × écart au milieu</li>
        <li>ddl = essais − coefficients ; un modèle exact n’est pas validé</li>
        <li>isoréponses : mêmes valeurs prévues ; s’en servir pour choisir une formule</li>
      </ul>
    </ARetenir>);

  // ---------- scène ----------
  const titreSc = enDefi && defi?.type === 'lire' ? 'Diagramme ternaire : un point orange à lire' : undefined;
  const scene = (
    <div style={{ ...styleBoite, ...cadre('scene') }}>
      <Ternaire point={vMes || enDefi ? pt : null} onPoint={interactif ? setPt : null} guides={vGuides || (enExplo && false)} dom={DOM} domaine={vDomaine ? DOM.sommets : null} region={vRegion ? REGION : null}
        plan={vPlan ? planPts : null} fref={vFref ? FREF : false} isos={isos.length ? isos : null} carte={carte} zone={zone} clair={!!carte} titre={titreSc}/>
      {!enDefi && !(enGuide && dev && !vSliders) && <div style={{ fontSize: 12.5, color: KIT.txt2, textAlign: 'center', marginTop: 4 }}>{interactif ? 'Faites glisser le point orange (ou utilisez les curseurs).' : ''}</div>}
    </div>);
  const controlesExplo = enExplo && (
    <div style={styleBoite}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, marginBottom: 6 }}>Affichage</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['fermete', 'Fermeté mesurée (g)'], ['cout', 'Coût matière (€/kg)']].map(([r, l]) => <button key={r} onClick={() => setE({ reponse: r })} aria-pressed={explo.reponse === r} style={stylePetitBouton(explo.reponse === r, '#0369a1')}>{l}</button>)}
      </div>
      <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 2 }}>Réponse étudiée : la fermeté vient du TP réel, le coût est calculé avec des prix indicatifs.</div>
      {explo.reponse === 'fermete' && <>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '8px 0 4px' }}>Modèle de Scheffé ajusté</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[['lineaire', 'Linéaire (3 coef.)'], ['quadratique', 'Quadratique (6 coef.)'], ['cubique', 'Cubique spécial (7 coef.)']].map(([d, l]) => <button key={d} onClick={() => setE({ degre: d })} aria-pressed={explo.degre === d} style={stylePetitBouton(explo.degre === d, '#0369a1')}>{l}</button>)}
        </div>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13.5, marginTop: 6, opacity: explo.degre === 'cubique' ? 0.5 : 1 }}><input type="checkbox" checked={explo.controle && explo.degre !== 'cubique'} disabled={explo.degre === 'cubique'} onChange={e => setE({ controle: e.target.checked })}/>Mettre l’essai 7 de côté pour contrôler le modèle (6 essais pour construire)</label>
      </>}
      <div style={{ fontSize: 13.5, fontWeight: 700, color: KIT.txt2, margin: '8px 0 4px' }}>Éléments du diagramme</div>
      {[['domaine', 'Domaine d’étude (triangle orange)'], ['essais', 'Les 7 essais du plan'], ['iso', 'Courbes isoréponses'], ['carte', 'Carte de couleurs'], ['zone', 'Cahier des charges 350 – 450 g (zone verte)'], ['region', 'Contrainte : huile de ricin ≤ 40 %']].map(([k, l]) => (
        <label key={k} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13.5 }}><input type="checkbox" checked={!!explo[k]} onChange={e => setE({ [k]: e.target.checked })}/>{l}</label>))}
      <div style={{ marginTop: 8 }}>
        <Section titre="Pour aller plus loin (hors programme)" ouvert={plusOuv} onBascule={() => setPlusOuv(o => !o)}>
          <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 4 }}>Répétitions <strong>simulées</strong> de l’essai central (mesures indépendantes, loi normale d’écart-type σ). Elles donnent des degrés de liberté pour tester le modèle.</div>
          <Curseur nom="Répétitions du centre" valeur={rep} onChange={setRep} min={0} max={6} pas={1} unite=""/>
          <Curseur nom="Dispersion σ supposée" valeur={sigma} onChange={setSigma} min={5} max={150} pas={1} unite="g" couleur="#b45309"/>
          {rep > 0 && explo.degre !== 'cubique' && !explo.controle && <div style={{ fontSize: 13, color: KIT.txt, lineHeight: 1.5 }}>Manque d’ajustement du modèle à 6 coefficients au centre : <em>t</em> = {nbf(mq.t, 1)} pour une valeur critique de {nbf(mq.crit, 2)} (Student, {rep} ddl) : {mq.rejet ? <strong>rejeté</strong> : <strong>non rejeté</strong>}.</div>}
        </Section>
      </div>
    </div>);

  const descNiveau = { deb: 'Débutant : tout est dans le programme (lire un diagramme ternaire, plan de mélange à 7 essais, exploiter les résultats, isoréponses, validité du modèle).', conf: 'Confirmé : concevoir soi-même le plan autour d’une formule de référence et calculer les coefficients (au-delà du programme).', exp: 'Expert : contraintes, degrés de liberté, répétitions, plusieurs réponses (hors programme).' };
  const choixNiveau = enGuide && (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
        {[['deb', 'Débutant'], ['conf', 'Confirmé'], ['exp', 'Expert']].map(([k, l]) => <button key={k} onClick={() => { setNiveau(k); setPt(P0); }} aria-pressed={niveau === k} style={stylePetitBouton(niveau === k, ORANGE_GUIDE)}>{l}</button>)}
      </div>
      <div style={{ fontSize: 13, color: KIT.txt2, lineHeight: 1.4 }}>{descNiveau[niveau]}</div>
    </div>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .pm-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .pm-l1.cote { grid-template-columns: minmax(0, 1fr) minmax(300px, 420px); }
        .pm-pri { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1.25fr) minmax(280px, 1fr); }
        .pm-col { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
        @media (min-width: 901px) { .pm-l1.cote .pm-carte { order: 2; } .pm-l1.cote .pm-main { order: 1; } }
        @media (max-width: 600px) { .pm-z { display: none; } }
        @media (max-width: 900px) { .pm-l1.cote, .pm-pri { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Plan de mélange ternaire</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Quand on formule un mélange de trois constituants (ici, trois corps gras d’un rouge à lèvres), leurs proportions ont pour somme <strong>100 %</strong> : on les place sur un <strong>diagramme ternaire</strong> et on teste quelques formules bien choisies (un <strong>plan de mélange</strong>) pour prévoir la propriété partout ailleurs.</div>
      {choixNiveau}
      <div className={`pm-l1${!enExplo ? ' cote' : ''}`}>
        {enGuide ? <div className="pm-carte"><CarteParcours key={niveau} etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div> : enDefi ? <div className="pm-carte">{panneauHypo}</div> : null}
        <div className="pm-main">
          {enDefi && defi && <div style={{ ...styleBoite, marginBottom: 12 }}>{voletDefi}<SuiviDefi cle={`${SIM_ID}:defi.${defi.type}`} etat={defi.type === 'lire' ? sL : defi.type === 'cible' ? sC : sB}/></div>}
          <div className={enExplo ? 'pm-pri' : ''}>
            <div className="pm-col">
              {scene}
              {enExplo && tableEssais}
            </div>
            <div className="pm-col" style={enExplo ? undefined : { marginTop: 12 }}>
              {enExplo && controlesExplo}
              {reglages}{mesures}{!enExplo && tableEssais}{boiteCentre}{coefsBox}
            </div>
          </div>
        </div>
      </div>
      {!enDefi && (!enGuide || (etape >= ETAPES.length - 1)) && <div style={{ marginBottom: 12 }}>{panneauHypo}</div>}
      {enExplo && <div className="pm-l1" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>{aEssayer}{retenir}</div>}
    </div>
  );
}
