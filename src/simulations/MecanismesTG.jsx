import { useState, useEffect } from "react";
import { useSignalerMode, declarerDefis, useCompteurDefi, SuiviDefi, modeOuverture } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section, BoutonsModes, avecIndices, ARetenir, IndiceDefi, indicesProfond, lireNombre, proche } from "../commun";
import { Pic } from "../Pictos";
import * as M from "./mrxModele";
import * as C from "./mrxChocs";
import { QCM as Q, INDICES_DEFI as IND } from "./mrxQcm";
import { SceneActe, AtelierFleches, SceneChocs, CarteFleche, CarteIntermediaire, CarteCatalyseur, CarteBilan, CarteFrequence, CarteEfficacite } from "./mrxSchemas";

const SIM_ID = 186, CLE_GUIDE = 'mecanismes-tg-guide-v1';
declarerDefis(SIM_ID, [['mecanisme', 'Intermédiaire, catalyseur et bilan'], ['fleches', 'Tracer les flèches courbes']]);

// ====================================================
// SIM 186 — MÉCANISMES RÉACTIONNELS : ACTES ÉLÉMENTAIRES, INTERMÉDIAIRES, CATALYSEUR ET FLÈCHES COURBES
//  (TG spé PC, « Modéliser l’évolution temporelle d’un système, siège d’une transformation chimique » : modélisation microscopique).
//  Capacités visées (jamais affichées à l’élève) : à partir d’un mécanisme fourni, identifier un intermédiaire réactionnel, un catalyseur et établir l’équation de
//  la réaction modélisée ; représenter les flèches courbes d’un acte élémentaire en justifiant leur sens ; modification du mécanisme par un catalyseur ;
//  interpréter l’influence des concentrations et de la température sur la vitesse d’un acte élémentaire (fréquence et efficacité des chocs).
//  Modèles : mrxModele.js (mécanismes et flèches, test mrxModele.test.mjs) et mrxChocs.js (scène des chocs, test mrxChocs.test.mjs).
// ====================================================
const NB = ' ';
const UL = { margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 };
const SUBST = M.mecaParId('subst-Br'), HYDRO = M.mecaParId('hydratation');
const ACTE = { subst: SUBST.actes[0], a1: HYDRO.actes[0], a2: HYDRO.actes[1], a3: HYDRO.actes[2] };
const IDS = ['sites', 'fleches', 'sens', 'prep', 'acte1', 'acte2', 'acte3', 'inter', 'cata', 'bilan', 'chemin', 'freq', 'effic', 'fin'];
const eqActe = a => `${a.avant.especes.map(e => e.f).join(' + ')} → ${a.apres.especes.map(e => e.f).join(' + ')}`;
const eqActes = m => m.actes.map((a, i) => ({ n: i + 1, eq: a.avant ? eqActe(a) : M.ecrireEquation(M.listeActes({ actes: [a] })[0].react, M.listeActes({ actes: [a] })[0].prod) }));

// ---------- panneau du mécanisme fourni (équations des actes) ----------
function PanneauMecanisme({ meca, avecBilan = false, jusquA = null }) {
  const lignes = eqActes(meca), an = M.analyserMecanisme(meca);
  return (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Mécanisme fourni : {meca.titre}</div>
      <ol style={{ margin: 0, paddingLeft: 22, lineHeight: 1.8, fontSize: 15.5, color: KIT.txt }}>
        {lignes.filter(l => jusquA == null || l.n <= jusquA).map(l => <li key={l.n}>Acte {l.n}{NB}: {l.eq}</li>)}
      </ol>
      {avecBilan && <div style={{ marginTop: 8, fontSize: 15.5, color: KIT.txt }}>Équation de la réaction : <strong>{M.ecrireEquation(an.reactifs, an.produits)}</strong></div>}
    </div>);
}

// ---------- scène des chocs avec ses réglages et ses compteurs ----------
const FENETRE = 60;   // secondes du modèle
function PanneauChocs({ avecTemp = true, avecEff = true, actif = true }) {
  const [conc, setConc] = useState(1), [temp, setTemp] = useState(1), [pause, setPause] = useState(() => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [snap, setSnap] = useState(null);
  useEffect(() => {
    const b = C.creerBoite({ nB: C.NIV_CONC[conc].nB, kT: C.NIV_TEMP[temp].kT, graine: C.GRAINES[conc][temp] });
    let ev = [];
    for (let k = 0; k < FENETRE / 0.01; k++) C.pas(b, 0.01).forEach(e => ev.push({ t: b.t, eff: e.eff, x: e.x, y: e.y, reel: -1e9 }));
    let raf, dernier = null;
    const publier = now => setSnap({ P: b.P.map(p => ({ type: p.type, x: p.x, y: p.y })), anneaux: ev.filter(e => now - e.reel < 900).map(e => ({ x: e.x, y: e.y, eff: e.eff, age: (now - e.reel) / 900 })), chocs: ev.length, eff: ev.filter(e => e.eff).length });
    const boucle = now => {
      if (dernier !== null && actif && !pause) {
        const dt = Math.min(0.05, (now - dernier) / 1000), sim = dt * 2.5, n = Math.max(1, Math.ceil(sim / 0.01));
        for (let i = 0; i < n; i++) C.pas(b, sim / n).forEach(e => ev.push({ t: b.t, eff: e.eff, x: e.x, y: e.y, reel: now }));
        ev = ev.filter(e => e.t > b.t - FENETRE);
      }
      dernier = now; publier(now);
      if (actif && !pause) raf = requestAnimationFrame(boucle);
    };
    raf = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(raf);
  }, [actif, pause, conc, temp]);
  if (!snap) return null;
  const { chocs, eff } = snap, nb1 = x => x.toFixed(1).replace('.', ','), part = chocs ? Math.round(100 * eff / chocs) : 0;
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box', marginTop: 2 };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SceneChocs boite={snap} eff={avecEff} anneaux={snap.anneaux}/>
      <div style={{ fontSize: 13.5, color: KIT.txt2, lineHeight: 1.5 }}>Dix entités A (cercles) et des entités B (carrés arrondis) s’agitent dans une boîte plane. Un choc entre un A et un B est compté ; {avecEff ? 'un choc efficace est entouré d’un double cercle.' : 'les chocs apparaissent en anneaux gris.'} Modèle schématique : les nombres sont des ordres de grandeur du modèle, pas des valeurs réelles.</div>
      <div style={{ display: 'grid', gridTemplateColumns: avecTemp ? 'repeat(auto-fit, minmax(170px, 1fr))' : '1fr', gap: 8 }}>
        <label style={{ fontSize: 13.5, color: KIT.txt2 }}>Concentration de B (nombre d’entités B)
          <select value={conc} onChange={e => setConc(+e.target.value)} style={menu}>{C.NIV_CONC.map((c, i) => <option key={c.id} value={i}>{c.nom} ({c.nB} entités B)</option>)}</select></label>
        {avecTemp && <label style={{ fontSize: 13.5, color: KIT.txt2 }}>Température (relative, modèle)
          <select value={temp} onChange={e => setTemp(+e.target.value)} style={menu}>{C.NIV_TEMP.map((t, i) => <option key={t.id} value={i}>{t.nom}</option>)}</select></label>}
      </div>
      <div style={{ ...styleBoite, padding: '8px 12px', fontSize: 14.5, color: KIT.txt, lineHeight: 1.7 }} aria-live="off">
        <div>Chocs entre A et B : <strong>{nb1(chocs / FENETRE)}</strong>{NB}par{NB}seconde</div>
        {avecEff && <div>Chocs efficaces : <strong>{nb1(eff / FENETRE)}</strong>{NB}par{NB}seconde, soit <strong>{part}{NB}%</strong> des chocs</div>}
        <div style={{ fontSize: 12.5, color: KIT.txt2 }}>Moyenne sur les {FENETRE}{NB}dernières secondes du modèle ; elle fluctue un peu, comme toute statistique.</div>
      </div>
      <div><button type="button" onClick={() => setPause(p => !p)} style={stylePetitBouton(false)}>{pause ? '▶ Reprendre le mouvement' : '⏸ Pause'}</button></div>
    </div>);
}

// ====================================================
export function SimulationMecanismesTG() {
  const [mode, setMode] = useState(() => modeOuverture(CLE_GUIDE));
  useSignalerMode(mode);
  const [suiviM, noterM] = useCompteurDefi(), [suiviF, noterF] = useCompteurDefi();
  const [guide, setGuide] = useEtatPersistant(CLE_GUIDE, { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [trace, setTrace] = useState({ subst: [], a1: [], a2: [], a3: [] });
  const [hypoOuv, setHypoOuv] = useState(false);
  const [ouv, setOuv] = useState({ repere: false, chocs: false, essayer: false, retenir: false });
  const [ex, setEx] = useState({ meca: 'subst-Br', k: 0, fleches: true });
  const [dfM, setDfM] = useState(null), [dfF, setDfF] = useState(null), [typeDefi, setTypeDefi] = useState('mecanisme');
  const enGuide = mode === 'guide', enDefi = mode === 'defi', enExplore = mode === 'explore';
  const idEtape = IDS[Math.min(guide.etape, IDS.length - 1)];
  const setTr = (cle, v) => setTrace(t => ({ ...t, [cle]: v }));
  const okActe = cle => M.verifierFleches(ACTE[cle], trace[cle]).ok;

  const faire = cle => () => setTr(cle, ACTE[cle].fleches);
  const consigneFl = n => `Trace ${n > 1 ? 'les ' + n + ' flèches' : 'la flèche'} de l’acte, puis lis le message sous le schéma.`;
  const eqSubst = eqActe(ACTE.subst);

  // ---------- parcours guidé ----------
  const ETAPES = [
    { id: 'sites', titre: 'Les deux espèces qui se rencontrent',
      texte: <>On étudie la réaction de l’ion hydroxyde HO⁻ avec le bromométhane CH₃Br : HO⁻ + CH₃Br → CH₃OH + Br⁻. Les petits traits autour des atomes sont des <strong>doublets non liants</strong> ; le signe ⊖ est une charge formelle. Électronégativités (échelle de Pauling) : χ(H){NB}={NB}2,20 ; χ(C){NB}={NB}2,55 ; χ(Br){NB}={NB}2,96.</>,
      tache: { type: 'qcm', q: Q.sites.q, options: Q.sites.options, bonne: Q.sites.bonne, indice: Q.sites.indice, expl: Q.sites.expl } },
    { id: 'fleches', titre: 'Un acte élémentaire : les flèches courbes',
      texte: <>La transformation se fait en <strong>un seul acte élémentaire</strong> : un choc, une seule étape. L’équation de l’acte est : {eqSubst}. Une <strong>flèche courbe</strong> représente le déplacement d’un doublet d’électrons ; ici, deux doublets se déplacent en même temps. Les polarisations de la liaison C–Br sont indiquées sur le schéma.
        <IndiceDefi cache={okActe('subst')}>Une flèche part d’un doublet (petit trait) ou d’une liaison, et pointe vers l’atome qui reçoit ce doublet. Un atome de carbone ne peut pas dépasser quatre liaisons.</IndiceDefi></>,
      tache: { type: 'action', ok: okActe('subst'), label: 'Le faire pour moi', faire: faire('subst'), consigne: consigneFl(2) } },
    { id: 'sens', titre: 'Justifier le sens des flèches',
      texte: <>Voici les deux flèches de l’acte (flèche 1 : doublet de HO⁻ ; flèche 2 : liaison C–Br).</>,
      tache: { type: 'qcm', q: Q.sens.q, options: Q.sens.options, bonne: Q.sens.bonne, indice: Q.sens.indice, expl: Q.sens.expl } },
    { id: 'prep', titre: 'Un second mécanisme : qui apporte le doublet ?',
      texte: <>Deuxième mécanisme, fourni : l’hydratation de l’éthène en milieu acide, C₂H₄ + H₂O → C₂H₅OH, en trois actes élémentaires (H₃O⁺ désigne ici le proton H⁺ en solution aqueuse). Dans l’<strong>acte 1</strong>{NB}: {eqActe(ACTE.a1)}, un doublet d’électrons se déplace pour former une nouvelle liaison.</>,
      tache: { type: 'qcm', q: Q.prep.q, options: Q.prep.options, bonne: Q.prep.bonne, indice: Q.prep.indice, expl: Q.prep.expl } },
    { id: 'acte1', titre: 'Flèches courbes : du doublet vers le site accepteur',
      retenirTitre: 'La flèche courbe', retenir: <>
        <CarteFleche/>
        <ul style={UL}>
          <li>Une flèche courbe suit un <strong>doublet d’électrons</strong> : elle part d’un doublet non liant ou d’une liaison, jamais d’un atome.</li>
          <li>Elle arrive sur l’atome qui reçoit le doublet : un site pauvre en électrons (δ+, charge +, lacune), ou l’atome le plus électronégatif d’une liaison qui se rompt.</li>
          <li>Moyen de s’en souvenir : <strong>« du riche vers le pauvre »</strong>. Idée fausse : « la flèche suit un atome ». Vrai : elle suit des électrons.</li>
        </ul></>,
      texte: <><strong>Acte 1</strong>{NB}: {eqActe(ACTE.a1)}. L’atome d’hydrogène de H₃O⁺ est δ+ (la charge + de l’ion). Dans C₂H₄, l’un des deux doublets de la liaison double (la liaison π) se déplace facilement : c’est lui qui forme la nouvelle liaison C–H.
        <IndiceDefi cache={okActe('a1')}>Deux doublets se déplacent : l’un part de la liaison double C=C, l’autre d’une liaison de H₃O⁺. Un atome d’hydrogène ne peut avoir qu’une seule liaison.</IndiceDefi></>,
      tache: { type: 'action', ok: okActe('a1'), label: 'Le faire pour moi', faire: faire('a1'), consigne: consigneFl(2) } },
    { id: 'acte2', titre: 'Acte 2 : l’eau attaque le carbocation',
      texte: <>L’acte 1 a formé le cation éthyle C₂H₅⁺ : son carbone de droite n’a que trois liaisons et porte la charge + ; il lui manque un doublet (<strong>lacune électronique</strong>, carré en pointillés). <strong>Acte 2</strong>{NB}: {eqActe(ACTE.a2)}. Une molécule d’eau possède deux doublets non liants.
        <IndiceDefi cache={okActe('a2')}>Une seule flèche : elle part d’un doublet non liant de l’eau et arrive sur le carbone qui a une lacune.</IndiceDefi></>,
      tache: { type: 'action', ok: okActe('a2'), label: 'Le faire pour moi', faire: faire('a2'), consigne: consigneFl(1) } },
    { id: 'acte3', titre: 'Acte 3 : une eau reprend un H⁺',
      texte: <><strong>Acte 3</strong>{NB}: {eqActe(ACTE.a3)}. Dans l’ion éthyloxonium, l’oxygène porte la charge + : ses atomes d’hydrogène sont δ+. Une autre molécule d’eau intervient. Deux doublets se déplacent.
        <IndiceDefi cache={okActe('a3')}>Un doublet non liant de l’eau forme une liaison avec un hydrogène de l’ion ; cet hydrogène ne peut pas garder deux liaisons : l’autre liaison se rompt, au profit de l’oxygène.</IndiceDefi></>,
      tache: { type: 'action', ok: okActe('a3'), label: 'Le faire pour moi', faire: faire('a3'), consigne: consigneFl(2) } },
    { id: 'inter', titre: 'Les intermédiaires réactionnels',
      texte: <>Voici le mécanisme complet. Une espèce est <strong>formée</strong> par un acte (elle est un produit de cet acte) et <strong>consommée</strong> par un acte suivant (elle est un réactif de cet acte).</>,
      tache: { type: 'qcm', q: Q.inter.q, options: Q.inter.options, bonne: Q.inter.bonne, indice: Q.inter.indice, expl: Q.inter.expl } },
    { id: 'cata', titre: 'Intermédiaire et catalyseur',
      retenirTitre: 'L’intermédiaire réactionnel', retenir: <>
        <CarteIntermediaire/>
        <ul style={UL}>
          <li>Un <strong>intermédiaire</strong> est formé par un acte puis consommé par un acte suivant : il n’apparaît ni parmi les réactifs ni parmi les produits du bilan.</li>
          <li>Exemple de la simulation : C₂H₅⁺ et C₂H₅OH₂⁺ dans l’hydratation de l’éthène.</li>
          <li>Moyen de s’en souvenir : <strong>« il passe, il ne reste pas »</strong>. Idée fausse : « un intermédiaire est un produit ». Vrai : il n’est jamais dans l’équation bilan.</li>
        </ul></>,
      texte: <>Un autre rôle se repère dans le mécanisme : une espèce peut être <strong>consommée</strong> par un acte puis <strong>régénérée</strong> par un acte suivant.</>,
      tache: { type: 'qcm', q: Q.cata.q, options: Q.cata.options, bonne: Q.cata.bonne, indice: Q.cata.indice, expl: Q.cata.expl } },
    { id: 'bilan', titre: 'Équation bilan et catalyseur',
      retenirTitre: 'Le catalyseur', retenir: <>
        <CarteCatalyseur/>
        <ul style={UL}>
          <li>Un <strong>catalyseur</strong> est consommé par un acte puis régénéré par un acte suivant : présent au départ et à la fin, il n’apparaît pas dans l’équation bilan.</li>
          <li>Exemple de la simulation : H₃O⁺, consommé à l’acte 1 et régénéré à l’acte 3.</li>
          <li>Moyen de s’en souvenir : <strong>« il prête, il rend »</strong>. Idée fausse : « un catalyseur est un réactif en plus ». Vrai : il n’est pas consommé au bilan.</li>
        </ul></>,
      texte: <>L’équation de la réaction modélisée par un mécanisme s’obtient en <strong>additionnant les actes</strong> (réactifs avec réactifs, produits avec produits) puis en <strong>simplifiant</strong> ce qui figure des deux côtés. Vérifie que les atomes et la charge sont conservés.</>,
      tache: { type: 'qcm', q: Q.bilan.q, options: Q.bilan.options, bonne: Q.bilan.bonne, indice: Q.bilan.indice, expl: Q.bilan.expl } },
    { id: 'chemin', titre: 'Équation bilan et mécanisme catalysé',
      retenirTitre: 'Le bilan d’un mécanisme', retenir: <>
        <CarteBilan/>
        <ul style={UL}>
          <li>Bilan = <strong>somme des actes, puis simplification</strong> : on compte chaque espèce à gauche et à droite des actes ; ce qui reste donne les réactifs (reste positif) et les produits (reste négatif).</li>
          <li>Intermédiaires et catalyseur ont un reste nul : ils disparaissent. Atomes et charge sont conservés.</li>
          <li>Moyen de s’en souvenir : <strong>« on additionne, on simplifie, on vérifie »</strong>.</li>
        </ul></>,
      texte: <>Sans catalyseur, l’eau ne s’additionne presque pas à l’éthène : la transformation est extrêmement lente. En milieu acide, on a le mécanisme en trois actes de ce parcours.</>,
      tache: { type: 'qcm', q: Q.chemin.q, options: Q.chemin.options, bonne: Q.chemin.bonne, indice: Q.chemin.indice, expl: Q.chemin.expl } },
    { id: 'freq', titre: 'La fréquence des chocs',
      texte: <>Pour qu’un acte se produise, les entités doivent d’abord se <strong>rencontrer</strong> : c’est un choc. Observe la boîte : change la concentration de B (le nombre d’entités B dans la même boîte) et lis le compteur de chocs entre A et B.</>,
      tache: { type: 'qcm', q: Q.freq.q, options: Q.freq.options, bonne: Q.freq.bonne, indice: Q.freq.indice, expl: Q.freq.expl } },
    { id: 'effic', titre: 'L’efficacité des chocs',
      retenirTitre: 'La fréquence des chocs', retenir: <>
        <CarteFrequence/>
        <ul style={UL}>
          <li>Plus la <strong>concentration</strong> d’un réactif est grande, plus les rencontres entre entités sont fréquentes : plus de chocs par seconde.</li>
          <li>Dans le modèle de la simulation, à température moyenne, 4, 10 puis 20 entités B donnent environ 2 ; 5,5 puis 12,5 chocs par seconde (ordres de grandeur du modèle).</li>
          <li>Moyen de s’en souvenir : <strong>« plus de monde, plus de rencontres »</strong>. Idée fausse : « les entités se gênent quand elles sont nombreuses ». Vrai : elles se rencontrent plus souvent.</li>
        </ul></>,
      texte: <>Tous les chocs ne conduisent pas à une réaction. Un choc est <strong>efficace</strong> si les entités ont assez d’énergie (énergie cinétique relative supérieure à un seuil) <strong>et</strong> une orientation favorable. Dans la boîte, l’orientation de chaque choc est tirée au hasard (une chance sur deux). Règle maintenant aussi la température.</>,
      tache: { type: 'qcm', q: Q.effic.q, options: Q.effic.options, bonne: Q.effic.bonne, indice: Q.effic.indice, expl: Q.effic.expl } },
    { id: 'fin', titre: 'Bilan : du choc au mécanisme',
      retenirTitre: 'Les chocs efficaces', retenir: <>
        <CarteEfficacite/>
        <ul style={UL}>
          <li>Un choc est <strong>efficace</strong> si les entités ont assez d’énergie <strong>et</strong> une orientation favorable ; seule une petite part des chocs l’est.</li>
          <li>Une température plus haute augmente l’agitation : chocs plus fréquents et plus souvent assez énergétiques, donc acte plus rapide (dans le modèle : environ 5 %, 12 % puis 21 % de chocs efficaces).</li>
          <li>Moyen de s’en souvenir : <strong>« se rencontrer ne suffit pas »</strong>. Idée fausse : « tous les chocs font réagir ». Vrai : seuls les chocs efficaces font réagir.</li>
        </ul></>,
      texte: <>Tu sais lire un mécanisme fourni : décrire chaque acte avec ses flèches courbes (du doublet vers le site accepteur), repérer les intermédiaires et le catalyseur, établir l’équation bilan, et relier la vitesse d’un acte à la fréquence et à l’efficacité des chocs. Passe à l’exploration ou relève les deux défis.</>, tache: null },
  ];

  // ---------- défis ----------
  const nouveauM = () => setDfM(M.tirageMecanisme());
  const nouveauF = () => setDfF(M.tirageFleches());
  function changerMode(md) { setMode(md); if (md === 'defi') { if (!dfM) nouveauM(); if (!dfF) nouveauF(); } }
  const lbl = { fontSize: 14, color: KIT.txt, lineHeight: 1.6 };
  const REVELE = 3;   // la solution n'apparaît qu'après réussite ou après 3 vérifications
  const justeM = q => (q.type === 'num' ? proche(lireNombre(dfM.reps[q.id] ?? ''), q.vrai, 0) && isFinite(lireNombre(dfM.reps[q.id] ?? '')) : dfM.reps[q.id] === q.bonne);
  const voletM = dfM && (() => {
    const tousOk = dfM.Q.every(justeM), revele = dfM.verifie && (tousOk || (dfM.nv || 0) >= REVELE);
    return (
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : lire un mécanisme fourni</div>
        <div style={{ ...lbl, marginBottom: 8 }}>Pour le mécanisme ci-dessous (actes élémentaires fournis), réponds aux quatre questions.</div>
        <PanneauMecanisme meca={dfM.meca}/>
        {dfM.Q.map((q, k) => {
          const ok = justeM(q), vu = dfM.verifie;
          return (
            <div key={q.id} style={{ borderLeft: `3px solid ${vu ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8, marginTop: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{k + 1}. {avecIndices(q.q)}</div>
              <IndiceDefi cache={vu && ok}>{IND[q.id]}</IndiceDefi>
              {q.type === 'qcm' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                  {q.options.map((o, i) => <button key={i} aria-pressed={dfM.reps[q.id] === i} onClick={() => setDfM(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: i } }))}
                    style={{ textAlign: 'left', fontSize: 14, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${dfM.reps[q.id] === i ? '#0284c7' : KIT.bord}`, background: dfM.reps[q.id] === i ? '#e0f2fe' : 'white', color: KIT.txt }}>{avecIndices(o)}</button>)}
                </div>) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <input value={dfM.reps[q.id] || ''} inputMode="numeric" placeholder="?" aria-label={`Réponse à la question ${k + 1}`} onChange={e => setDfM(d => ({ ...d, verifie: false, reps: { ...d.reps, [q.id]: e.target.value } }))}
                    style={{ fontSize: 15, padding: '5px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 90 }}/><span style={{ fontSize: 14, color: KIT.txt2 }}>acte(s)</span>
                </div>)}
              {vu && <div style={{ fontSize: 13.5, marginTop: 3, color: ok ? '#15803d' : '#b91c1c', fontWeight: 700 }}>{ok ? '✓ Juste' : '✗ Pas encore'}</div>}
              {revele && <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 3 }}>{avecIndices(q.detail)}</div>}
            </div>);
        })}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
          <button onClick={() => { noterM(dfM.Q.every(justeM)); setDfM(d => ({ ...d, verifie: true, nv: (d.nv || 0) + 1 })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
          <button onClick={nouveauM} style={styleBouton(false)}><Pic n="refresh"/>Nouveau mécanisme</button>
          {dfM.verifie && <span style={{ fontSize: 14, fontWeight: 700, color: KIT.txt }}>{dfM.Q.filter(justeM).length} / {dfM.Q.length} réponses justes</span>}
        </div>
        {dfM.verifie && !tousOk && !revele && <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 6 }}>Corrige tes réponses et vérifie de nouveau (la solution s’affichera après {REVELE} vérifications).</div>}
        {revele && <div style={{ fontSize: 14, color: KIT.txt, marginTop: 8, lineHeight: 1.6 }}>Équation bilan : <strong>{dfM.bilan}</strong>. Hypothèse : chaque équation du mécanisme est un acte élémentaire.</div>}
      </div>);
  })();

  const fonc = (cle, acte) => M.verifierFleches(acte, dfF.tr[cle]).ok;
  const justeF = () => dfF && fonc('a', dfF.A.acte) && fonc('b', dfF.B.acte) && dfF.rep === dfF.role.bonne;
  const voletF = dfF && (() => {
    const tous = justeF(), revele = dfF.verifie && (tous || (dfF.nv || 0) >= REVELE);
    const bloc = (cle, X, n) => {
      const ok = fonc(cle, X.acte), vu = dfF.verifie;
      return (
        <div key={cle} style={{ borderLeft: `3px solid ${vu ? (ok ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8, marginTop: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 2 }}>{n}. Trace les flèches courbes de l’acte : {X.acte.avant.especes.map(e => e.f).join(' + ')} → {X.acte.apres.especes.map(e => e.f).join(' + ')}</div>
          <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 4 }}>{X.meca.titre}</div>
          <IndiceDefi cache={vu && ok}>{IND.fleches}</IndiceDefi>
          <AtelierFleches key={cle + dfF.seed} acte={X.acte} tracees={dfF.tr[cle]} setTracees={v => setDfF(d => ({ ...d, verifie: false, tr: { ...d.tr, [cle]: v } }))} retourImmediat={false} etat={{ ...X.acte.avant, delta: X.acte.avant.delta }}/>
          {vu && <div style={{ fontSize: 13.5, marginTop: 3, color: ok ? '#15803d' : '#b91c1c', fontWeight: 700 }}>{ok ? '✓ Juste' : '✗ Pas encore'}</div>}
          {revele && !ok && <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 3 }}>Solution : {X.acte.fleches.length} flèche{X.acte.fleches.length > 1 ? 's' : ''}. <button type="button" onClick={() => setDfF(d => ({ ...d, tr: { ...d.tr, [cle]: X.acte.fleches } }))} style={stylePetitBouton(false)}>Afficher la solution</button></div>}
        </div>);
    };
    const okR = dfF.rep === dfF.role.bonne, vu = dfF.verifie;
    return (
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}><Pic n="target"/>Défi : tracer les flèches courbes</div>
        <div style={lbl}>Deux actes d’un mécanisme sont fournis avec leur équation. Trace leurs flèches courbes, puis réponds à la dernière question.</div>
        {bloc('a', dfF.A, 1)}{bloc('b', dfF.B, 2)}
        <div style={{ borderLeft: `3px solid ${vu ? (okR ? '#16a34a' : '#dc2626') : KIT.bord}`, paddingLeft: 8, marginTop: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>3. Dans l’acte de la question 1, quelle espèce est le donneur : celle qui apporte le doublet servant à former la nouvelle liaison ?</div>
          <IndiceDefi cache={vu && okR}>{IND.role}</IndiceDefi>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
            {dfF.role.options.map((o, i) => <button key={i} aria-pressed={dfF.rep === i} onClick={() => setDfF(d => ({ ...d, verifie: false, rep: i }))}
              style={{ textAlign: 'left', fontSize: 14, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${dfF.rep === i ? '#0284c7' : KIT.bord}`, background: dfF.rep === i ? '#e0f2fe' : 'white', color: KIT.txt }}>{avecIndices(o)}</button>)}
          </div>
          {vu && <div style={{ fontSize: 13.5, marginTop: 3, color: okR ? '#15803d' : '#b91c1c', fontWeight: 700 }}>{okR ? '✓ Juste' : '✗ Pas encore'}</div>}
          {revele && !okR && <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 3 }}>Le donneur est {dfF.A.acte.donneur} : elle apporte le doublet qui forme la nouvelle liaison.</div>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
          <button onClick={() => { noterF(justeF()); setDfF(d => ({ ...d, verifie: true, nv: (d.nv || 0) + 1 })); }} style={styleBouton(true, '#16a34a')}>✓ Vérifier</button>
          <button onClick={nouveauF} style={styleBouton(false)}><Pic n="refresh"/>Nouveaux actes</button>
        </div>
        {dfF.verifie && !tous && !revele && <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 6 }}>Corrige et vérifie de nouveau (la solution pourra s’afficher après {REVELE} vérifications).</div>}
      </div>);
  })();

  const voletDefi = (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {[['mecanisme', 'Lire un mécanisme'], ['fleches', 'Tracer les flèches']].map(([t, l]) => <button key={t} onClick={() => setTypeDefi(t)} aria-pressed={typeDefi === t} style={stylePetitBouton(typeDefi === t, '#0369a1')}>{l}</button>)}
      </div>
      {typeDefi === 'mecanisme' ? voletM : voletF}
      <SuiviDefi cle={`${SIM_ID}:defi.mecanisme`} etat={suiviM}/><SuiviDefi cle={`${SIM_ID}:defi.fleches`} etat={suiviF}/>
    </div>);

  // ---------- hypothèses ----------
  const hypotheses = indicesProfond(
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.5 }}>
      <li><strong>Mécanismes fournis</strong> : l’élève ne les invente pas. Ce sont des modèles de la littérature : on ne voit pas directement les actes. L’hydratation de l’éthène est écrite en milieu acide, H⁺ en solution aqueuse étant noté H₃O⁺.</li>
      <li><strong>Substitution</strong> : HO⁻ et CH₃Br (ou CH₃Cl) réagissent en un seul acte, concerté ; le solvant est ignoré. Aucune classification à mémoriser, pas de stéréochimie.</li>
      <li><strong>Schémas de Lewis</strong> : atomes, liaisons, doublets non liants ; charge formelle = nombre d’électrons de valence − 2 × (doublets non liants) − (nombre de liaisons). La géométrie réelle des molécules n’est pas représentée (schémas plans, pas à l’échelle).</li>
      <li><strong>Polarisations δ+ et δ−</strong> : charges partielles qualitatives, déduites des électronégativités de Pauling (H 2,20 ; C 2,55 ; O 3,44 ; Cl 3,16 ; Br 2,96). Seules les polarisations utiles à l’acte étudié sont annotées ; δ+ n’est pas une charge entière.</li>
      <li><strong>Flèches courbes</strong> : une flèche = un doublet d’électrons (flèche pleine, pas de radicaux ni de demi-flèche). Elle part d’un doublet non liant ou d’une liaison et arrive sur un atome. L’état de transition entre « avant » et « après » n’est pas représenté.</li>
      <li><strong>Boîte des chocs</strong> : modèle plan, disques durs, chocs élastiques. Un choc est efficace si l’énergie cinétique relative dépasse un seuil arbitraire du modèle ET si l’orientation, tirée au hasard (une chance sur deux), est favorable. Les réactifs ne sont pas consommés pendant l’observation. La température est relative (basse, moyenne, élevée), sans valeur en kelvins.</li>
      <li><strong>Nombres affichés</strong> : moyennes de 60 secondes du modèle, qui fluctuent d’un instant à l’autre ; ce sont des ordres de grandeur du modèle, pas des mesures. Aucune loi chiffrée de la vitesse n’est utilisée.</li>
      <li><strong>Hors programme, non traité</strong> : profil énergétique chiffré, loi d’Arrhenius, stéréochimie, classification des mécanismes de substitution.</li>
    </ul>);
  const panneauHypo = (<div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>);
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}><Pic n="search"/>Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0369a1')}><Pic n="target"/>Défis</button>
    </span>);

  // ---------- scène du parcours ----------
  const atelier = (cle, titre) => {
    const a = ACTE[cle], ok = okActe(cle);
    return (<>
      <div style={styleBoite}>
        <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>{titre}</div>
        <AtelierFleches key={cle} acte={a} tracees={trace[cle]} setTracees={v => setTr(cle, v)} bloque={ok} etat={{ ...a.avant, delta: a.avant.delta }}/>
      </div>
      {ok && <div style={styleBoite} className="mrx-in"><div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Après l’acte</div><SceneActe etat={a.apres} plage={M.plageX(a)} aria="Schéma de Lewis des espèces formées par l’acte"/></div>}
    </>);
  };
  const sceneGuide = () => {
    switch (idEtape) {
      case 'sites': return <div style={styleBoite}><div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Avant le choc</div><SceneActe etat={{ ...ACTE.subst.avant, delta: {} }} plage={M.plageX(ACTE.subst)} aria="Schéma de Lewis de l’ion hydroxyde et du bromométhane avant leur rencontre"/></div>;
      case 'fleches': return atelier('subst', 'Acte élémentaire : avant le choc');
      case 'sens': return (<>
        <div style={styleBoite}><div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Les deux flèches de l’acte</div><SceneActe etat={ACTE.subst.avant} fleches={ACTE.subst.fleches} delta plage={M.plageX(ACTE.subst)} aria="Schéma de l’acte avec ses deux flèches courbes numérotées"/></div>
        <div style={styleBoite}><div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Après l’acte</div><SceneActe etat={ACTE.subst.apres} plage={M.plageX(ACTE.subst)} aria="Schéma de Lewis des espèces formées"/></div></>);
      case 'prep': return (<><PanneauMecanisme meca={HYDRO}/><div style={styleBoite}><div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>Acte 1 : avant le choc</div><SceneActe etat={ACTE.a1.avant} delta plage={M.plageX(ACTE.a1)} aria="Schéma de Lewis de H₃O⁺ et de l’éthène avant l’acte 1"/></div></>);
      case 'acte1': return atelier('a1', 'Acte 1 : avant le choc');
      case 'acte2': return atelier('a2', 'Acte 2 : avant le choc');
      case 'acte3': return atelier('a3', 'Acte 3 : avant le choc');
      case 'inter': return <PanneauMecanisme meca={HYDRO}/>;
      case 'cata': return <PanneauMecanisme meca={HYDRO}/>;
      case 'bilan': return <PanneauMecanisme meca={HYDRO}/>;
      case 'chemin': return <PanneauMecanisme meca={HYDRO} avecBilan/>;
      case 'freq': return <div style={styleBoite}><PanneauChocs avecTemp={false} avecEff={false}/></div>;
      case 'effic': return <div style={styleBoite}><PanneauChocs avecTemp avecEff/></div>;
      default: return panneauHypo;
    }
  };

  // ---------- exploration ----------
  const menu = { font: 'inherit', fontSize: 15, padding: '8px 10px', minHeight: 42, borderRadius: 10, border: `1px solid ${KIT.bord}`, background: '#fff', color: KIT.txt, width: '100%', boxSizing: 'border-box', marginTop: 2 };
  const mecaEx = M.mecaParId(ex.meca), acteEx = mecaEx.actes[Math.min(ex.k, mecaEx.actes.length - 1)], anEx = M.analyserMecanisme(mecaEx);
  const titreCarte = { fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 4 };
  const aide = { fontSize: 13.5, color: KIT.txt2, marginBottom: 6, lineHeight: 1.5 };
  const sceneExplore = (
    <div style={styleBoite}>
      <div style={titreCarte}>{acteEx.titre}{NB}: {eqActe(acteEx)}</div>
      <div style={aide}>Schéma de Lewis des espèces avant l’acte (les petits traits autour des atomes sont des doublets non liants), puis après l’acte. Les flèches rouges numérotées montrent le déplacement des doublets.</div>
      <SceneActe etat={acteEx.avant} fleches={ex.fleches ? acteEx.fleches : []} delta plage={M.plageX(acteEx)} aria="Schéma de Lewis avant l’acte avec ses flèches courbes"/>
      <div style={{ ...titreCarte, marginTop: 8 }}>Après l’acte</div>
      <SceneActe etat={acteEx.apres} plage={M.plageX(acteEx)} aria="Schéma de Lewis après l’acte"/>
    </div>);
  const reglages = (
    <div style={styleBoite} className="mrx-ctrl">
      <div style={titreCarte}>Réglages</div>
      <div style={aide}>Choisis un mécanisme, puis avance acte par acte : le schéma, les flèches et l’équation de l’acte suivent.</div>
      <label style={{ display: 'block', fontSize: 13.5, color: KIT.txt2, marginBottom: 8 }}>Mécanisme
        <select value={ex.meca} onChange={e => setEx({ ...ex, meca: e.target.value, k: 0 })} style={menu}>{M.MECANISMES.map(m => <option key={m.id} value={m.id}>{m.titre}</option>)}</select></label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        <button type="button" onClick={() => setEx(s => ({ ...s, k: Math.max(0, s.k - 1) }))} disabled={ex.k === 0} style={{ ...stylePetitBouton(false), minHeight: 40, opacity: ex.k === 0 ? 0.5 : 1 }}>◀ Acte précédent</button>
        <button type="button" onClick={() => setEx(s => ({ ...s, k: Math.min(mecaEx.actes.length - 1, s.k + 1) }))} disabled={ex.k >= mecaEx.actes.length - 1} style={{ ...stylePetitBouton(true, '#0284c7'), minHeight: 40, opacity: ex.k >= mecaEx.actes.length - 1 ? 0.5 : 1 }}>Acte suivant ▶</button>
        <span style={{ fontSize: 13.5, color: KIT.txt2 }}>Acte {Math.min(ex.k, mecaEx.actes.length - 1) + 1} sur {mecaEx.actes.length}</span>
      </div>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, color: KIT.txt, minHeight: 40 }}><input type="checkbox" checked={ex.fleches} onChange={e => setEx({ ...ex, fleches: e.target.checked })}/> Montrer les flèches courbes</label>
      <div style={aide}>Décoche pour deviner les flèches avant de les voir.</div>
    </div>);
  const repere = (
    <div style={styleBoite}>
      <Section titre={`Intermédiaires, catalyseur et bilan : ${mecaEx.court}`} ouvert={ouv.repere} onBascule={() => setOuv(o => ({ ...o, repere: !o.repere }))}>
        <div style={aide}>Repérés par programme à partir de toutes les équations du mécanisme (réponses à utiliser après avoir réfléchi).</div>
        <div style={{ fontSize: 14.5, color: KIT.txt, lineHeight: 1.7 }}>
          <div>Intermédiaires{NB}: <strong>{anEx.intermediaires.length ? anEx.intermediaires.join(', ') : 'aucun (un seul acte)'}</strong></div>
          <div>Catalyseur{NB}: <strong>{anEx.catalyseurs.length ? anEx.catalyseurs.join(', ') : 'aucun'}</strong></div>
          <div>Équation bilan{NB}: <strong>{M.ecrireEquation(anEx.reactifs, anEx.produits)}</strong></div>
        </div>
      </Section>
    </div>);
  const chocs = (
    <div style={styleBoite}>
      <Section titre="La boîte des chocs : concentration et température" ouvert={ouv.chocs} onBascule={() => setOuv(o => ({ ...o, chocs: !o.chocs }))}>
        {ouv.chocs && <PanneauChocs avecTemp avecEff actif={enExplore && ouv.chocs}/>}
      </Section>
    </div>);
  const aEssayer = (
    <Section titre="À essayer (questions pour explorer)" ouvert={ouv.essayer} onBascule={() => setOuv(o => ({ ...o, essayer: !o.essayer }))}>
      {indicesProfond(<ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Pour chaque acte, masque les flèches puis devine-les : d’où part chaque doublet, et où arrive-t-il ?</li>
        <li>Dans l’hydratation, quelles espèces apparaissent à l’acte 1 puis disparaissent à l’acte 2 ? Lesquelles sont retrouvées à la fin ?</li>
        <li>Compare le bilan de la substitution et celui de l’hydratation : y a-t-il un intermédiaire ? un catalyseur ?</li>
        <li>Dans la boîte, double la concentration de B : que devient le nombre de chocs par seconde ? et la part de chocs efficaces ?</li>
        <li>Passe de la température basse à élevée : le nombre de chocs change-t-il beaucoup ? la part des chocs efficaces ?</li>
      </ul>)}
    </Section>);
  const retenirExplore = (
    <Section titre="À retenir (idées clés)" ouvert={ouv.retenir} onBascule={() => setOuv(o => ({ ...o, retenir: !o.retenir }))}>
      <ARetenir titre="IDÉES CLÉS" sansFiche>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Acte élémentaire : un seul choc, une seule étape</li>
          <li>Flèche courbe : un doublet d’électrons, du doublet (ou de la liaison) vers l’atome qui le reçoit</li>
          <li>Intermédiaire : formé puis consommé, absent du bilan</li>
          <li>Catalyseur : consommé puis régénéré, absent du bilan</li>
          <li>Bilan : somme des actes, puis simplification</li>
          <li>Vitesse d’un acte : fréquence des chocs (concentrations, température) × proportion de chocs efficaces (énergie, orientation)</li>
        </ul>
      </ARetenir>
    </Section>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .mrx-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .mrx-col { display: flex; flex-direction: column; gap: 12px; }
        .mrx-ex { display: grid; gap: 12px; align-items: start; grid-template-columns: minmax(0, 1fr); margin-bottom: 12px; }
        @media (min-width: 901px) { .mrx-l1 { grid-template-columns: minmax(300px, 1fr) minmax(0, 2fr); } .mrx-ex { grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); } .mrx-ex > * { grid-column: 1; } .mrx-ex > .mrx-ctrl { grid-column: 2; grid-row: 1 / span 5; } }
        @media (prefers-reduced-motion: no-preference) { .mrx-in { animation: mrx-fondu 0.35s ease-out; } @keyframes mrx-fondu { from { opacity: 0; } to { opacity: 1; } } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Mécanismes réactionnels et flèches courbes</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10, lineHeight: 1.5 }}>Un mécanisme décrit, à l’échelle des entités, les actes élémentaires d’une transformation : on suit les doublets d’électrons avec des flèches courbes, on repère intermédiaires et catalyseur, et on relie la vitesse aux chocs.</div>
      {enGuide && <div className="mrx-l1">
        <div><CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/></div>
        <div className="mrx-col"><div className="mrx-in" key={'s-' + idEtape} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{sceneGuide()}</div></div>
      </div>}
      {enDefi && <div className="mrx-col" style={{ marginBottom: 12 }}><div style={styleBoite}>{voletDefi}</div>{panneauHypo}</div>}
      {enExplore && <div className="mrx-ex">
        <div>{sceneExplore}</div>
        <div className="mrx-ctrl">{reglages}</div>
        <div>{repere}</div>
        <div>{chocs}</div>
        <div>{aEssayer}</div>
        <div>{retenirExplore}</div>
        <div>{panneauHypo}</div>
      </div>}
    </div>
  );
}
