import { useState, useMemo, useEffect } from "react";
import { cardStyle, KIT, styleBouton, stylePetitBouton, styleBoite, lireProgression, Etoiles, useEtatPersistant } from "../commun";
import { etoilesSeance } from "../carnet";
import { ENONCES } from "./AtelierDonneesBanque";
import { SITUATIONS } from "./AtelierSituationsBanque";
import { SCENARIOS } from "./AtelierGraphiqueBanque";
import { FAMILLES as FAM_REA } from "./AtelierRealiserBanque";
import { FAMILLES as FAM_ANA } from "./AtelierAnalyserBanque";
import { FAMILLES as FAM_VAL } from "./AtelierValiderBanque";
import { useSession, estEleve, estProf, toutLire, rest } from "../serveur";
import { exosDuChapitre, exosCalcul, prochainExercice, avancementChapitre } from "../chapitre";
import { NIVEAUX_CHAPITRES, CHAPITRES, chapitresDuNiveau, chapitreDe, chapitresDe, domainesDe, allerChapitre } from "../chapitres";
import { nomsSim } from "../suivi";
import { Pic } from "../Pictos";
import { JeuxCode } from "./JeuxEscape";

const ROSE = '#e11d48';
const TRANSVERSAL = 'Tous thèmes (transversal)';

// Titre court d'un graphique (la fonction titre dépend des valeurs tirées au hasard)
const titreGraphique = s => {
  try { return String(s.titre(s.gen ? s.gen() : {})).replace(/\s*\(.*\)\s*$/, ''); } catch { return s.id; }
};

// Les quatre compétences, dans l'ordre conseillé
const COMPETENCES = [
  { code: "S'APP", nom: "S’approprier", couleur: '#3f78a8', dispo: true,
    but: "Comprendre ce qui est demandé : repérer les données utiles, les associer aux symboles et aux unités, lire un graphique.",
    ateliers: [{ id: 34, nom: 'Extraire les données d’un énoncé' }, { id: 35, nom: 'Lire un graphique' }] },
  { code: 'ANA', nom: 'Analyser', couleur: '#1f7a72', dispo: true,
    but: "Construire la démarche : ce que l’on cherche, quelles relations, quelles hypothèses, dans quel ordre calculer, et prévoir sans calculer.",
    ateliers: [{ id: 37, nom: 'Analyser un problème' }] },
  { code: 'REA', nom: 'Réaliser', couleur: '#357f54', dispo: true,
    but: "Mener le calcul sans se tromper : unités et conversions, isoler une grandeur, chiffres significatifs, calculatrice.",
    ateliers: [{ id: 36, nom: 'Réaliser un calcul' }] },
  { code: 'VAL', nom: 'Valider', couleur: '#b45a1f', dispo: true,
    but: "Juger son résultat : ordre de grandeur, unité, cohérence physique, incertitude.", ateliers: [{ id: 77, nom: 'Valider un résultat' }] },
];

// Tous les exercices, avec leur clé de progression (voir noterReussite dans les ateliers)
export function tousLesExercices() {
  const L = [];
  ENONCES.forEach(e => e.noms.forEach((n, q) => L.push({ atelier: 34, comp: "S'APP", cle: `34:${e.id}.${q}`, ex: `${e.id}.${q}`, domaine: e.domaine, titre: `${e.titre} — ${n}` })));
  SITUATIONS.forEach(s => L.push({ atelier: 34, comp: "S'APP", cle: `34:${s.id}`, ex: s.id, domaine: s.domaine, titre: `Comprendre une situation — ${s.titre}` }));
  SCENARIOS.forEach(s => L.push({ atelier: 35, comp: "S'APP", cle: `35:${s.id}`, ex: s.id, domaine: s.domaine, titre: titreGraphique(s) }));
  FAM_ANA.forEach(f => f.liste.forEach(it => L.push({ atelier: 37, comp: 'ANA', cle: `37:${f.id}:${it.id}`, ex: `${f.id}.${it.id}`, domaine: it.domaine, titre: `${f.titre} — ${it.titre}` })));
  FAM_VAL.forEach(f => f.liste.forEach(it => L.push({ atelier: 77, comp: 'VAL', cle: `77:${f.id}:${it.id}`, ex: `${f.id}.${it.id}`, domaine: it.domaine, niveau: it.niveau, titre: `${f.titre} — ${it.titre}` })));
  FAM_REA.forEach(f => L.push({ atelier: 36, comp: 'REA', cle: `36:${f.id}`, ex: f.id, domaine: f.domaine || TRANSVERSAL, titre: f.titre }));
  return L;
}

// Chapitre(s) en cours de la classe de l'élève (supabase/07) ; en cas d'erreur ou si le script n'est pas lancé : aucun chapitre
const lireChapitres = classeId => rest(`classes?select=chapitres&id=eq.${classeId}`)
  .then(r => (r[0]?.chapitres || []).filter(c => chapitreDe(c))).catch(() => []);

function LigneExo({ e, prog, etoiles, ouvrir, montrerTheme }) {
  const c = COMPETENCES.find(x => x.code === e.comp);
  return (
    <button data-cle={e.cle} onClick={() => ouvrir(e)}
      style={{ display: 'flex', gap: 10, alignItems: 'center', textAlign: 'left', padding: '7px 10px', border: `1px solid ${KIT.bord}`, borderRadius: 8, background: prog[e.cle] ? '#f0fdf4' : 'white', cursor: 'pointer', fontSize: 13.5, color: KIT.txt }}>
      <span style={{ width: 46, flex: 'none' }}>{etoiles[e.cle] ? <Etoiles n={etoiles[e.cle]} /> : prog[e.cle] ? '✅' : '⬜'}</span>
      <span style={{ fontWeight: 800, color: c.couleur, minWidth: 48 }}>{e.comp}</span>
      <span style={{ flex: 1 }}>{e.titre}</span>
      {montrerTheme && <span style={{ fontSize: 11.5, color: KIT.txt2 }}>{e.domaine}</span>}
    </button>);
}

// Carte d'un chapitre : titre, avancement en étoiles, badge « chapitre en cours » si le professeur l'a choisi
function CarteChapitre({ c, ouvert, enCours, av, onClick }) {
  const pct = av.max ? (100 * av.etoiles) / av.max : 0;
  return (
    <button type="button" data-chapitre-id={c.id} aria-expanded={ouvert} onClick={onClick}
      style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 14, cursor: 'pointer', background: ouvert ? '#fff1f2' : 'white', border: `2px solid ${ouvert ? ROSE : enCours ? '#2a9d8f' : KIT.bord}`, display: 'flex', flexDirection: 'column', gap: 5, font: 'inherit' }}>
      {enCours && <span style={{ fontSize: 11, fontWeight: 800, color: '#1f6f66', letterSpacing: 0.4 }}>👉 CHAPITRE EN COURS</span>}
      <span style={{ fontWeight: 800, color: KIT.txt, fontSize: 14.5, lineHeight: 1.35 }}>{c.label}</span>
      <span style={{ fontSize: 12.5, color: KIT.txt2 }}>
        {av.total > 0 ? `${av.reussis} / ${av.total} exercices réussis · ${av.etoiles} ★ sur ${av.max}` : 'Simulations seulement (pas encore d’exercice)'}
      </span>
      {av.total > 0 && <span style={{ height: 6, borderRadius: 3, background: '#e2e8f0', display: 'block' }}><span style={{ display: 'block', height: 6, borderRadius: 3, background: '#2a9d8f', width: `${pct}%` }} /></span>}
    </button>);
}

// Progression de l'élève (appareil + serveur) et chapitres choisis par son professeur : partagé par « Je m'entraîne » et les pages de chapitre
function useProgressionEleve() {
  const [progLocale, setProg] = useState(lireProgression);
  const sess = useSession();
  const eleve = estEleve(sess), identifiantUtilisateur = sess?.user?.id;
  const [serveur, setServeur] = useState({});
  const [etoilesSrv, setEtoilesSrv] = useState({});
  useEffect(() => {          // un élève connecté retrouve ses réussites, d'où qu'il les ait faites
    let actif = true;
    if (!eleve) { setServeur({}); setEtoilesSrv({}); return undefined; }
    toutLire('activites?select=cle,reussi,essais,corrections_vues').then(l => {
      if (!actif) return;
      const ok = {}, et = {};
      l.forEach(x => { const e = etoilesSeance(x); if (e > (et[x.cle] || 0)) et[x.cle] = e; if (x.reussi) ok[x.cle] = true; });
      setServeur(ok); setEtoilesSrv(et);
    }).catch(() => {});
    return () => { actif = false; };
  }, [eleve, identifiantUtilisateur]);
  const classeId = eleve ? sess.profil.classe_id : null;
  const [chapitres, setChapitres] = useState([]);
  useEffect(() => {
    if (!classeId) return undefined;
    let actif = true;
    lireChapitres(classeId).then(c => { if (actif) setChapitres(c); });
    return () => { actif = false; };
  }, [classeId]);
  const chapActifs = useMemo(() => (classeId ? chapitres : []), [classeId, chapitres]);
  const chapsEnCours = useMemo(() => chapitresDe(chapActifs), [chapActifs]);
  const prog = { ...progLocale, ...serveur };
  const etoilesDe = cle => etoilesSrv[cle] ?? (prog[cle] ? 3 : 0);
  const nbFaits = l => l.filter(e => prog[e.cle]).length;
  return { sess, eleve, prog, setProg, etoilesSrv, etoilesDe, nbFaits, chapsEnCours, idsEnCours: chapsEnCours.map(c => c.id) };
}

// Contenu d'un chapitre : ses simulations, l'exercice conseillé et ses exercices rangés par compétence
function DetailChapitre({ c, exos, ctx, naviguer, sansTitre }) {
  const { prog, etoilesSrv, etoilesDe, nbFaits, idsEnCours } = ctx;
  const ouvrir = e => naviguer(e.atelier, e.ex);
  const exosChap = exosDuChapitre(exos, c.domaines), av = avancementChapitre(exosChap, etoilesDe), conseil = exosChap.length ? prochainExercice(exosChap, etoilesDe) : null;
  const enCours = idsEnCours.includes(c.id);
  return (
    <section data-chapitre style={{ margin: '14px 0 18px', padding: '12px 14px', border: `2px solid ${ROSE}`, borderRadius: 16, background: 'white' }}>
      {!sansTitre && <h3 style={{ margin: '0 0 4px', color: KIT.txt }}><Pic n="book"/>{c.label}</h3>}
      <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>
        {enCours ? 'Chapitre choisi par ton professeur. ' : ''}{exosChap.length > 0 ? `${av.reussis} exercice${av.reussis > 1 ? 's' : ''} réussi${av.reussis > 1 ? 's' : ''} sur ${av.total} · ${av.etoiles} ★ sur ${av.max}` : 'Pas encore d’exercice de remédiation sur ce chapitre : commence par les simulations.'}
      </div>
      {c.sims.length > 0 && (
        <div data-sims-chapitre style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: KIT.txt, margin: '0 0 4px' }}><Pic n="testtube"/>Les simulations du chapitre</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {c.sims.map(id => <button key={id} data-sim={id} onClick={() => naviguer(id)} style={{ ...styleBouton(false, '#475569'), fontSize: 13 }}>{nomsSim[id] || `Simulation ${id}`} ▶</button>)}
          </div>
        </div>)}
      {exosChap.length > 0 && <div style={{ height: 8, borderRadius: 4, background: '#e2e8f0', marginBottom: 12 }} role="progressbar" aria-valuemin={0} aria-valuemax={av.max} aria-valuenow={av.etoiles} aria-label="Étoiles gagnées dans le chapitre">
        <div style={{ height: 8, borderRadius: 4, background: '#2a9d8f', width: `${av.max ? (100 * av.etoiles) / av.max : 0}%` }} />
      </div>}
      {exosChap.length === 0 ? null : conseil ? (
        <div data-conseil style={{ ...styleBoite, border: '2px solid #2a9d8f', background: '#eef7f5', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: '#1f6f66', letterSpacing: 0.5 }}>👉 TON PROCHAIN EXERCICE CONSEILLÉ</div>
            <div style={{ fontWeight: 800, color: KIT.txt, margin: '2px 0' }}>{conseil.exo.comp} · {conseil.exo.titre}</div>
            <div style={{ fontSize: 12.5, color: KIT.txt2 }}>
              {conseil.raison === 'nouveau' ? 'Tu ne l’as pas encore réussi : on commence par la compétence où tu as le moins avancé dans ce chapitre.' : `Tu l’as réussi avec ${conseil.etoiles} étoile${conseil.etoiles > 1 ? 's' : ''} : vise les 3 étoiles.`}
            </div>
          </div>
          <button onClick={() => ouvrir(conseil.exo)} style={styleBouton(true, ROSE)}>Y aller ▶</button>
        </div>
      ) : (
        <div style={{ ...styleBoite, background: '#f0fdf4', marginBottom: 12 }}><Pic n="party"/><b>Tout le chapitre est réussi avec 3 étoiles !</b> Passe à un autre chapitre, ou refais un exercice pour t’entraîner.</div>
      )}
      {['S\'APP', 'ANA', 'VAL'].map(code => {
        const L = exosChap.filter(e => e.comp === code);
        const cc = COMPETENCES.find(x => x.code === code);
        return L.length === 0 ? null : (
          <div key={code} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: cc.couleur, margin: '6px 0 4px' }}>{code} · {cc.nom} <span style={{ fontWeight: 600, color: KIT.txt2 }}>({nbFaits(L)} / {L.length} réussis)</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{L.map(e => <LigneExo key={e.cle} e={e} prog={prog} etoiles={etoilesSrv} ouvrir={ouvrir} />)}</div>
          </div>);
      })}
      {exosChap.length > 0 && <details style={{ marginTop: 6 }}>
        <summary style={{ cursor: 'pointer', fontSize: 13.5, fontWeight: 700, color: KIT.txt }}><Pic n="abacus"/>Pour t’aider à calculer (REA, valable pour tous les chapitres) <span style={{ fontWeight: 600, color: KIT.txt2 }}>({nbFaits(exosCalcul(exos))} / {exosCalcul(exos).length} réussis)</span></summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>{exosCalcul(exos).map(e => <LigneExo key={e.cle} e={e} prog={prog} etoiles={etoilesSrv} ouvrir={ouvrir} />)}</div>
      </details>}
      {exosChap.length > 0 && <div style={{ fontSize: 12, color: KIT.txt2, marginTop: 8 }}>Le conseil est calculé à partir de tes résultats ; ce n’est pas une note.</div>}
    </section>);
}

// Page d'accueil d'un chapitre (?sim=82&chap=<id>) : ses simulations, puis ses exercices de remédiation rangés par compétence.
// Sans chapitre dans l'adresse (ou chapitre inconnu) : la liste des chapitres de tous les niveaux.
export function SimulationChapitre({ naviguer }) {
  const ctx = useProgressionEleve();
  const exos = useMemo(() => tousLesExercices(), []);
  const idChap = (() => { try { return new URLSearchParams(window.location.search).get('chap'); } catch { return null; } })();
  const c = chapitreDe(idChap);
  const niveau = c && NIVEAUX_CHAPITRES.find(n => n.key === c.niveau);
  const autres = c ? chapitresDuNiveau(c.niveau).filter(x => x.id !== c.id) : [];
  const aller = id => allerChapitre(naviguer, id);
  const cartes = l => (
    <div data-chapitres style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10, margin: '8px 0' }}>
      {l.map(x => <CarteChapitre key={x.id} c={x} ouvert={false} enCours={ctx.idsEnCours.includes(x.id)} av={avancementChapitre(exosDuChapitre(exos, x.domaines), ctx.etoilesDe)} onClick={() => aller(x.id)} />)}
    </div>);
  return (
    <div style={{ ...cardStyle, maxWidth: 1000, margin: '0 auto' }} data-page-chapitre={c?.id || 'index'}>
      <div style={{ fontSize: 13, color: KIT.txt2 }}>
        <button onClick={() => naviguer(38)} style={{ background: 'none', border: 'none', padding: 0, color: ROSE, textDecoration: 'underline', cursor: 'pointer', fontSize: 13 }}>Je m’entraîne</button>
        {c && <> › {niveau?.label}</>}
      </div>
      {c ? (
        <>
          <h2 style={{ margin: '4px 0 0', color: ROSE }}>{niveau?.label} · {c.label}</h2>
          <p style={{ color: KIT.txt2, fontSize: 14, lineHeight: 1.55, margin: '6px 0 0' }}>
            Tout ce qu’il faut pour ce chapitre : les <b>simulations</b> pour comprendre et expérimenter, puis des <b>exercices</b> pour t’entraîner, rangés par compétence
            (<b>s’approprier → analyser → valider</b>). Les exercices de calcul (<b>réaliser</b>) sont en bas de page.
          </p>
          <DetailChapitre c={c} exos={exos} ctx={ctx} naviguer={naviguer} sansTitre />
          {autres.length > 0 && <>
            <h3 style={{ margin: '10px 0 0', color: KIT.txt }}>Les autres chapitres de {niveau?.label}</h3>
            {cartes(autres)}
          </>}
        </>
      ) : (
        <>
          <h2 style={{ margin: '4px 0 0', color: ROSE }}>Choisir un chapitre</h2>
          <p style={{ color: KIT.txt2, fontSize: 14 }}>Chaque chapitre rassemble ses simulations et ses exercices d’entraînement.</p>
          {NIVEAUX_CHAPITRES.map(n => <div key={n.key}><div style={{ fontSize: 14, fontWeight: 800, color: KIT.txt, margin: '12px 0 0' }}>{n.label}</div>{cartes(chapitresDuNiveau(n.key))}</div>)}
        </>)}
    </div>);
}

export function SimulationEntrainement({ naviguer }) {
  const [niveauChoisi, setNiveauChoisi] = useEtatPersistant('entrainement-niveau-v1', null);
  const [chapChoisi, setChapChoisi] = useState(undefined);      // undefined : pas de choix de l'élève (on ouvre le chapitre en cours) ; null : tout replié
  const [comp, setComp] = useState('toutes');
  const ctx = useProgressionEleve();
  const { sess, eleve, prog, setProg, etoilesSrv, etoilesDe, nbFaits, chapsEnCours, idsEnCours } = ctx;
  const exos = useMemo(() => tousLesExercices(), []);
  const ouvrir = e => naviguer(e.atelier, e.ex);
  const effacer = () => {
    if (!window.confirm('Effacer la progression mémorisée sur cet appareil ?')) return;
    try { window.localStorage.removeItem('progression-ateliers-v1'); } catch { /* indisponible */ }
    setProg({});
  };

  // Niveau : le choix de l'élève, sinon celui du chapitre en cours de sa classe, sinon rien (on lui demande)
  const niveauValide = NIVEAUX_CHAPITRES.some(n => n.key === niveauChoisi) || niveauChoisi === 'tous';
  const niveau = (niveauValide && niveauChoisi) || chapsEnCours[0]?.niveau || null;
  const chapsNiveau = niveau === 'tous' ? CHAPITRES : niveau ? chapitresDuNiveau(niveau) : [];
  const ouvertId = chapChoisi !== undefined ? chapChoisi : (chapsNiveau.find(c => idsEnCours.includes(c.id))?.id ?? null);
  const chapOuvert = chapsNiveau.find(c => c.id === ouvertId) || null;
  const exosDe = c => exosDuChapitre(exos, c.domaines);

  // Exercices du niveau (pour la partie « par compétence ») : thèmes des chapitres du niveau + calcul transversal
  const exosN = (() => {
    if (!niveau || niveau === 'tous') return exos;
    const ds = domainesDe(chapitresDuNiveau(niveau));
    return exos.filter(e => e.domaine === TRANSVERSAL || ds.includes(e.domaine));
  })();
  const liste = exosN.filter(e => comp === 'toutes' || e.comp === comp);

  const cartes = l => (
    <div data-chapitres style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10, margin: '8px 0' }}>
      {l.map(c => <CarteChapitre key={c.id} c={c} ouvert={ouvertId === c.id} enCours={idsEnCours.includes(c.id)} av={avancementChapitre(exosDe(c), etoilesDe)}
        onClick={() => setChapChoisi(ouvertId === c.id ? null : c.id)} />)}
    </div>);

  return (
    <div style={{ ...cardStyle, maxWidth: 1000, margin: '0 auto' }}>
      <h2 style={{ margin: 0, color: '#0c1a2e', fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: '-0.01em' }}><Pic n="dumbbell"/>Je m’entraîne ! Travail par compétence.</h2>
      <p style={{ color: KIT.txt2, fontSize: 14, lineHeight: 1.55 }}>
        Chaque exercice travaille <b>une</b> compétence de la démarche scientifique. L’ordre conseillé suit celle d’un problème :
        <b> s’approprier → analyser → réaliser → valider</b>. Tu peux commencer par n’importe quelle compétence, mais si tu hésites, suis cet ordre.
      </p>

      <div data-compte style={{ ...styleBoite, fontSize: 13.5, margin: '8px 0', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {eleve ? <><Pic n="users"/>Connecté·e : <b>{sess.profil.identifiant}</b> — ta progression est enregistrée et te suit d’un appareil à l’autre.</>
          : estProf(sess) ? <><Pic n="users"/>Connecté : <b>{sess.profil.nom}</b> (professeur : rien n’est enregistré quand vous faites les exercices).</>
            : <>Sans compte, ta progression reste sur cet appareil. Avec le compte donné par ton professeur, elle te suit partout.</>}
        <button onClick={() => naviguer(39)} style={styleBouton(false, ROSE)}>{sess?.profil ? 'Mon compte' : 'Se connecter'}</button>
        {estProf(sess) && <button onClick={() => naviguer(40)} style={styleBouton(true, ROSE)}><Pic n="bars"/>Suivi professeur</button>}
      </div>

      <JeuxCode naviguer={naviguer} />

      <section data-niveaux style={{ margin: '14px 0 6px' }}>
        <h3 style={{ margin: '0 0 6px', color: KIT.txt }}>1. Je suis en…</h3>
        <div role="group" aria-label="Mon niveau" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {NIVEAUX_CHAPITRES.map(n => <button key={n.key} data-niveau={n.key} aria-pressed={niveau === n.key} onClick={() => { setNiveauChoisi(n.key); setChapChoisi(undefined); }}
            style={{ ...styleBouton(niveau === n.key, ROSE), fontSize: 15, padding: '9px 18px' }}>{n.label}</button>)}
          <button data-niveau="tous" aria-pressed={niveau === 'tous'} onClick={() => { setNiveauChoisi('tous'); setChapChoisi(undefined); }}
            style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', fontSize: 13 }}>Voir tous les niveaux</button>
        </div>
      </section>

      {!niveau && <div data-choix-niveau style={{ ...styleBoite, margin: '10px 0', fontSize: 14 }}>👆 Choisis ton niveau : tu verras les chapitres de ton année et les exercices qui vont avec.</div>}

      {niveau && (
        <section data-chapitres-niveau style={{ margin: '14px 0 6px' }}>
          <h3 style={{ margin: '0 0 2px', color: KIT.txt }}>2. Je choisis mon chapitre</h3>
          <div style={{ fontSize: 13, color: KIT.txt2 }}>Clique sur un chapitre : tu y trouves ses simulations et ses exercices, rangés par compétence.</div>
          {niveau === 'tous'
            ? NIVEAUX_CHAPITRES.map(n => <div key={n.key}><div style={{ fontSize: 13, fontWeight: 800, color: KIT.txt, margin: '10px 0 0' }}>{n.label}</div>{cartes(chapitresDuNiveau(n.key))}</div>)
            : cartes(chapsNiveau)}
          {chapOuvert && <DetailChapitre c={chapOuvert} exos={exos} ctx={ctx} naviguer={naviguer} />}
        </section>)}

      <details data-autres style={{ ...styleBoite, background: '#fff', marginTop: 12 }}>
        <summary style={{ cursor: 'pointer', fontSize: 15.5, fontWeight: 800, color: KIT.txt }}><Pic n="target"/>Travailler une compétence précise{niveau && niveau !== 'tous' ? ` (niveau ${NIVEAUX_CHAPITRES.find(n => n.key === niveau)?.label})` : ''}</summary>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, margin: '14px 0' }}>
        {COMPETENCES.map((c, i) => {
          const mes = exosN.filter(e => e.comp === c.code);
          return (
            <div key={c.code} data-comp={c.code} style={{ ...styleBoite, borderLeft: `5px solid ${c.couleur}`, opacity: c.dispo ? 1 : 0.65 }}>
              <div style={{ fontSize: 12, color: KIT.txt2 }}>Étape {i + 1}</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: c.couleur }}>{c.code} <span style={{ fontWeight: 600, fontSize: 14, color: KIT.txt }}>{c.nom}</span></div>
              <div style={{ fontSize: 13, color: KIT.txt2, margin: '6px 0 8px', lineHeight: 1.5 }}>{c.but}</div>
              {c.dispo ? (
                <>
                  <div style={{ fontSize: 12.5, color: KIT.txt2, marginBottom: 6 }}>{nbFaits(mes)} exercice{nbFaits(mes) > 1 ? 's' : ''} réussi{nbFaits(mes) > 1 ? 's' : ''} sur {mes.length}</div>
                  <div style={{ height: 6, borderRadius: 3, background: '#e2e8f0', marginBottom: 8 }}>
                    <div style={{ height: 6, borderRadius: 3, background: c.couleur, width: `${mes.length ? 100 * nbFaits(mes) / mes.length : 0}%` }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {c.ateliers.map(a => <button key={a.id} onClick={() => naviguer(a.id)} style={styleBouton(true, c.couleur)}>{a.nom} ▶</button>)}
                  </div>
                </>
              ) : <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>🚧 Bientôt</div>}
            </div>
          );
        })}
      </div>

      <h3 style={{ marginBottom: 6 }}>Tous les exercices{niveau && niveau !== 'tous' ? ' de mon niveau' : ''}</h3>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <button onClick={() => setComp('toutes')} style={stylePetitBouton(comp === 'toutes', ROSE)}>Toutes les compétences</button>
        {COMPETENCES.filter(c => c.dispo).map(c => <button key={c.code} onClick={() => setComp(c.code)} style={stylePetitBouton(comp === c.code, c.couleur)}>{c.code}</button>)}
      </div>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginBottom: 6 }}>{liste.length} exercice{liste.length > 1 ? 's' : ''} · {nbFaits(liste)} réussi{nbFaits(liste) > 1 ? 's' : ''}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {liste.map(e => <LigneExo key={e.cle} e={e} prog={prog} etoiles={etoilesSrv} ouvrir={ouvrir} montrerTheme />)}
      </div>
      </details>

      <p style={{ fontSize: 12, color: KIT.txt2, marginTop: 14, lineHeight: 1.5 }}>
        {eleve ? 'Connecté·e : tes résultats (réussite, essais, temps) sont enregistrés sur le serveur et visibles de toi et de ton professeur. Sur cet appareil, une copie des réussites est gardée.'
          : 'Ta progression est mémorisée uniquement sur cet appareil et dans ce navigateur : elle n’est envoyée à personne.'}
        {' '}<button onClick={effacer} style={{ background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer', fontSize: 12 }}>Effacer ma progression</button>
      </p>
    </div>
  );
}
