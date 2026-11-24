import { useState, useMemo, useEffect } from "react";
import { cardStyle, KIT, stylePetitBouton, styleBoite, lireProgression, Etoiles, useEtatPersistant } from "../commun";
import { etoilesSeance } from "../carnet";
import { ENONCES } from "./AtelierDonneesBanque";
import { SITUATIONS } from "./AtelierSituationsBanque";
import { SCENARIOS } from "./AtelierGraphiqueBanque";
import { FAMILLES as FAM_REA } from "./AtelierRealiserBanque";
import { FAMILLES as FAM_ANA } from "./AtelierAnalyserBanque";
import { FAMILLES as FAM_VAL } from "./AtelierValiderBanque";
import { useSession, estEleve, estProf, toutLire, rest } from "../serveur";
import { exosDuChapitre, exosCalcul, prochainExercice, avancementChapitre } from "../chapitre";
import { repartir } from "../sousThemes";
import { NIVEAUX_CHAPITRES, CHAPITRES, chapitresDuNiveau, chapitreDe, chapitresDe, domainesDe, allerChapitre } from "../chapitres";
import { nomsSim } from "../suivi";
import { ENSEIGNEMENTS, chapitresDe as chapitresNiveauEns } from "../parcoursCommun";
import { exosDeSim, EXOS_DE_SIM } from "../exosDeSim";
import { Pic, nomPicto } from "../Pictos";
import { useSimsValidees, PastilleFaite } from "../simsValidees";

const ROSE = '#0b4f94';   // bleu Blocs (ancien rose)
const ORANGE_B = '#f5a31a', TEAL_B = '#2cc4ae', BORD_B = '#d5dfeb', TITRE_B = "'Outfit', 'Inter', sans-serif";
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

// Présentation de la page « Je m'entraîne » et des pages de chapitre : pensée pour le téléphone d'abord (cibles de 44 px au moins, une colonne, détail qui s'ouvre sous la carte touchée)
const CSS_EN = `
  .en { --bleu:#0b4f94; --teal:#2cc4ae; --bord:#d5dfeb; --txt:#0f172a; --txt2:#475569; }
  .en-titre { margin:0; display:flex; align-items:center; gap:8px; font:800 clamp(24px,6vw,30px)/1.15 Outfit,Inter,sans-serif; letter-spacing:-.01em; color:#0c1a2e; }
  .en-sous { margin:4px 0 0; color:var(--txt2); font-size:15px; line-height:1.5; }
  .en-compte { display:flex; flex-wrap:wrap; align-items:center; gap:8px 12px; margin:14px 0 4px; padding:10px 14px; border-radius:18px; background:#eef4fb; font-size:13.5px; color:var(--txt); }
  .en-lien { min-height:40px; padding:0 16px; border-radius:999px; border:2px solid var(--bleu); background:#fff; color:var(--bleu); font:800 14px Inter,system-ui,sans-serif; cursor:pointer; margin-left:auto; display:inline-flex; align-items:center; gap:6px; }
  .en-lien.plein { background:var(--bleu); color:#fff; margin-left:0; }
  .en-aide { margin:4px 0 0; font-size:14px; color:var(--txt2); line-height:1.55; }
  .en-aide > summary { cursor:pointer; padding:10px 0; min-height:24px; font-weight:700; color:var(--bleu); }
  .en-etape { margin:20px 0 8px; font:800 13px Inter,system-ui,sans-serif; letter-spacing:.06em; text-transform:uppercase; color:var(--txt2); }
  .en-niveaux { display:flex; flex-wrap:wrap; gap:8px; }
  .en-niv { flex:1 1 76px; min-height:48px; padding:0 14px; border-radius:16px; border:2px solid var(--bord); background:#fff; color:var(--txt); font:800 16px Inter,system-ui,sans-serif; cursor:pointer; }
  .en-niv[aria-pressed="true"] { background:var(--bleu); border-color:var(--bleu); color:#fff; box-shadow:0 4px 12px rgba(11,79,148,.25); }
  .en-niv.tous { flex:1 1 100%; min-height:40px; font-size:14px; font-weight:700; border-style:dashed; color:var(--txt2); }
  .en-niv.tous[aria-pressed="true"] { color:#fff; }
  .en-invite { display:flex; gap:10px; align-items:center; margin:12px 0; padding:14px 16px; border-radius:20px; background:#fff7e6; border:1px solid #f3d9a4; color:#5b3b00; font-size:14.5px; line-height:1.45; }
  .en-modes { display:flex; gap:4px; padding:4px; margin:20px 0 4px; background:#e8eef6; border-radius:18px; }
  .en-mode { flex:1; min-height:48px; padding:0 6px; white-space:nowrap; border:none; border-radius:14px; background:transparent; color:var(--txt2); font:800 14.5px Inter,system-ui,sans-serif; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px; }
  @media (max-width:420px) { .en-mode .ic { display:none; } }
  .en-mode[aria-selected="true"] { background:#fff; color:var(--bleu); box-shadow:0 2px 8px rgba(15,23,42,.12); }
  .en-grille { display:grid; grid-template-columns:1fr; gap:10px; margin:10px 0; }
  @media (min-width:720px) { .en-grille { grid-template-columns:1fr 1fr; } }
  .en-detail { grid-column:1 / -1; min-width:0; }
  @media (max-width:600px) { .en-detail > section { padding:10px 2px !important; border:none !important; margin:4px 0 10px !important; } }
  .en-chap { scroll-margin-top:84px; display:flex; align-items:center; gap:12px; width:100%; min-height:72px; padding:14px; text-align:left; border-radius:22px; border:2px solid var(--bord); background:#fff; color:var(--txt); font:inherit; cursor:pointer; box-shadow:0 1px 2px rgba(15,23,42,.05); }
  .en-chap:hover { border-color:#9db8d6; }
  .en-chap:focus-visible, .en-niv:focus-visible, .en-mode:focus-visible, .en-exo:focus-visible, .en-cta:focus-visible, .en-sim:focus-visible, .en-chip:focus-visible, .en-lien:focus-visible { outline:3px solid var(--bleu); outline-offset:2px; }
  .en-chap[data-ouvert] { border-color:var(--bleu); background:#eaf2fb; }
  .en-chap[data-en-cours]:not([data-ouvert]) { border-color:var(--teal); }
  .en-chap-tuile { flex:none; width:48px; height:48px; border-radius:16px; background:#eaf2fb; color:var(--bleu); display:flex; align-items:center; justify-content:center; }
  .en-chap[data-ouvert] .en-chap-tuile { background:var(--bleu); color:#fff; }
  .en-chap-corps { flex:1; min-width:0; display:flex; flex-direction:column; gap:5px; }
  .en-chap-badge { align-self:flex-start; padding:2px 9px; border-radius:999px; background:#dcf5f0; color:#1f6f66; font:800 11px Inter,system-ui,sans-serif; letter-spacing:.05em; text-transform:uppercase; }
  .en-chap-titre { font:800 16px/1.3 Outfit,Inter,sans-serif; }
  .en-chap-stats { font-size:12.5px; color:var(--txt2); }
  .en-barre { display:block; height:8px; border-radius:4px; background:#e6edf5; overflow:hidden; }
  .en-barre > span { display:block; height:100%; border-radius:4px; background:var(--teal); }
  .en-exo { display:flex; align-items:center; gap:10px; width:100%; min-height:56px; padding:10px 12px; text-align:left; border:1px solid var(--bord); border-radius:16px; background:#fff; color:var(--txt); font:inherit; cursor:pointer; }
  .en-exo[data-fait] { background:#f1fbf8; border-color:#bfe8df; }
  .en-exo-corps { flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }
  .en-exo-tete { display:flex; flex-wrap:wrap; align-items:center; gap:4px 8px; }
  .en-pastille { padding:2px 8px; border-radius:999px; color:#fff; font:800 11px Inter,system-ui,sans-serif; letter-spacing:.03em; }
  .en-exo-theme { font-size:11.5px; color:var(--txt2); }
  .en-exo-titre { font-size:14px; line-height:1.35; }
  .en-exo-etat { flex:none; min-width:30px; display:flex; align-items:center; justify-content:flex-end; }
  .en-st { display:flex; align-items:center; gap:12px; width:100%; min-height:64px; padding:12px 14px; text-align:left; border:1px solid var(--bord); border-radius:16px; background:#fff; color:var(--txt); font:inherit; cursor:pointer; }
  .en-st:hover { border-color:#9db8d6; background:#f6f9fd; }
  .en-st:focus-visible { outline:3px solid var(--bleu); outline-offset:2px; }
  .en-st[data-fait] { background:#f1fbf8; border-color:#bfe8df; }
  .en-st-nom { font:800 15.5px/1.3 Outfit,Inter,sans-serif; }
  .en-st-cap { font-size:13px; line-height:1.4; color:var(--txt2); }
  .en-st-grille { display:grid; grid-template-columns:1fr; gap:8px; }
  @media (min-width:720px) { .en-st-grille { grid-template-columns:1fr 1fr; } }
  .en-sim { display:inline-flex; align-items:center; gap:8px; min-height:44px; padding:8px 16px; border:none; border-radius:999px; background:var(--bleu); color:#fff; font:700 14px Inter,system-ui,sans-serif; text-align:left; cursor:pointer; }
  .en-comps { display:grid; grid-template-columns:1fr; gap:12px; margin:12px 0; }
  @media (min-width:720px) { .en-comps { grid-template-columns:1fr 1fr; } }
  .en-comp { display:flex; flex-direction:column; gap:10px; padding:16px; border:2px solid var(--bord); border-top:6px solid var(--c); border-radius:22px; background:#fff; }
  .en-comp-tete { display:flex; align-items:center; gap:12px; }
  .en-comp-num { flex:none; width:40px; height:40px; border-radius:50%; background:var(--c); color:#fff; display:flex; align-items:center; justify-content:center; font:800 18px Outfit,Inter,sans-serif; }
  .en-comp-nom { font:800 18px Outfit,Inter,sans-serif; color:var(--c); }
  .en-comp-nom small { margin-left:8px; font:700 12px Inter,system-ui,sans-serif; color:var(--txt2); }
  .en-comp-stat { font-size:12.5px; color:var(--txt2); }
  .en-comp-but { margin:0; font-size:13.5px; line-height:1.5; color:var(--txt2); }
  .en-cta { min-height:48px; padding:0 18px; border:none; border-radius:999px; background:var(--c); color:#fff; font:800 15px Inter,system-ui,sans-serif; cursor:pointer; }
  .en-chips { display:flex; gap:8px; overflow-x:auto; padding:2px 4px 8px; margin:0 -4px; }
  .en-chip { flex:none; min-height:40px; padding:0 14px; border-radius:999px; border:2px solid var(--bord); background:#fff; color:var(--txt); font:700 13.5px Inter,system-ui,sans-serif; white-space:nowrap; cursor:pointer; }
  .en-chip[aria-pressed="true"] { background:var(--bleu); border-color:var(--bleu); color:#fff; }
  .en-tous { margin-top:10px; padding:2px 14px 12px; border:1px solid var(--bord); border-radius:18px; background:#fff; }
  .en-tous > summary { min-height:48px; display:flex; align-items:center; cursor:pointer; font-weight:800; color:var(--txt); }
  .en-pied { margin:18px 0 0; font-size:12px; line-height:1.5; color:var(--txt2); }
  .en-pied button { background:none; border:none; padding:6px 0; color:var(--txt2); text-decoration:underline; cursor:pointer; font-size:12px; }
`;
const CssEntrainement = () => <style>{CSS_EN}</style>;

function LigneExo({ e, prog, etoiles, ouvrir, montrerTheme }) {
  const c = COMPETENCES.find(x => x.code === e.comp) || { couleur: ROSE };
  const fait = !!prog[e.cle];
  return (
    <button type="button" className="en-exo" data-cle={e.cle} data-fait={fait || undefined} onClick={() => ouvrir(e)}>
      <span className="en-exo-corps">
        <span className="en-exo-tete"><span className="en-pastille" style={{ background: c.couleur }}>{e.comp}</span>{montrerTheme && <span className="en-exo-theme">{e.domaine}</span>}</span>
        <span className="en-exo-titre">{e.titre}</span>
      </span>
      <span className="en-exo-etat">{etoiles[e.cle] ? <Etoiles n={etoiles[e.cle]} /> : fait ? <PastilleFaite taille={24} /> : <Pic n="empty" t={24} style={{ margin: 0 }} />}</span>
    </button>);
}

// Carte d'un chapitre : pictogramme, titre, avancement en étoiles, badge « chapitre en cours » si le professeur l'a choisi
function CarteChapitre({ c, ouvert, enCours, av, onClick }) {
  const pct = av.max ? (100 * av.etoiles) / av.max : 0;
  const m = /^([^\p{L}\p{N}\s]+)\s+([\s\S]+)$/u.exec(c.label || '');
  const picto = m ? nomPicto(m[1]) : null, titre = m ? m[2] : c.label;
  return (
    <button type="button" className="en-chap" data-chapitre-id={c.id} data-ouvert={ouvert || undefined} data-en-cours={enCours || undefined} aria-expanded={ouvert} onClick={onClick}>
      <span className="en-chap-tuile" aria-hidden="true">{picto ? <Pic n={picto} t={28} style={{ margin: 0 }} /> : m ? <span style={{ fontSize: 24 }}>{m[1]}</span> : <Pic n="book" t={28} style={{ margin: 0 }} />}</span>
      <span className="en-chap-corps">
        {enCours && <span className="en-chap-badge">Chapitre en cours</span>}
        <span className="en-chap-titre">{titre}</span>
        <span className="en-chap-stats">
          {av.total > 0 ? `${av.reussis} / ${av.total} réussis · ${av.etoiles} ★ sur ${av.max}` : 'Simulations seulement (pas encore d’exercice)'}
        </span>
        {av.total > 0 && <span className="en-barre"><span style={{ width: `${pct}%` }} /></span>}
      </span>
      <Pic n="chevron" t={22} style={{ margin: 0, transform: ouvert ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
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
  // Élève connecté : seules comptent les réussites de SON compte (la mémoire de l'appareil appartient à celui qui s'en est servi avant, pas au compte)
  const prog = eleve ? { ...serveur } : { ...progLocale, ...serveur };
  const etoilesDe = cle => etoilesSrv[cle] ?? (prog[cle] ? 3 : 0);
  const nbFaits = l => l.filter(e => prog[e.cle]).length;
  return { sess, eleve, prog, setProg, etoilesSrv, etoilesDe, nbFaits, chapsEnCours, idsEnCours: chapsEnCours.map(c => c.id) };
}

// Contenu d'un chapitre : ses simulations, l'exercice conseillé et ses exercices rangés par compétence
// Exercices en lien avec UNE simulation (arrivée par l'onglet « Exercices » d'une simulation) : l'exercice à faire d'abord, puis la liste courte
function ExosDeSimulation({ simId, exos, ctx, naviguer }) {
  const { prog, etoilesSrv, etoilesDe, nbFaits } = ctx;
  const liste = useMemo(() => exosDeSim(exos, simId), [exos, simId]);
  const ouvrir = e => naviguer(e.atelier, e.ex);
  const conseil = liste.length ? prochainExercice(liste, etoilesDe) : null;
  const nom = nomsSim[simId] || `la simulation ${simId}`;
  return (
    <section data-exos-simulation={simId} style={{ margin: '14px 0 10px', padding: '18px 18px', border: `2px solid ${ROSE}`, borderRadius: 26, background: 'white' }}>
      <button onClick={() => naviguer(simId)} style={{ ...stylePetitBouton, marginBottom: 10 }}>← Retour à la simulation</button>
      <h3 style={{ margin: '0 0 4px', color: ROSE, fontFamily: TITRE_B, fontSize: 20 }}>Pour continuer après « {nom} »</h3>
      {liste.length === 0
        ? <p style={{ fontSize: 14, color: KIT.txt2, lineHeight: 1.5, margin: '6px 0 0' }}>Il n’y a pas encore d’exercice rattaché précisément à cette simulation. Tu peux travailler sur le thème du chapitre, plus bas.</p>
        : <>
          <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 10 }}>{liste.length} exercice{liste.length > 1 ? 's' : ''} directement liés à cette simulation · {nbFaits(liste)} réussi{nbFaits(liste) > 1 ? 's' : ''}</div>
          {conseil && <div data-conseil style={{ ...styleBoite, border: 'none', borderRadius: 22, padding: '14px 16px', background: ROSE, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#ffd68a', letterSpacing: 0.5 }}><Pic n="arrow"/>{conseil.raison === 'nouveau' ? 'COMMENCE PAR' : 'POUR VISER LES 3 ÉTOILES'}</div>
              <div style={{ fontWeight: 800, color: 'white', fontSize: 16, fontFamily: TITRE_B }}>{conseil.exo.comp} · {conseil.exo.titre.replace(/^[^—]*— /, '')}</div>
            </div>
            <button onClick={() => ouvrir(conseil.exo)} style={{ background: ORANGE_B, color: '#1b2b3a', border: 'none', borderRadius: 999, padding: '10px 20px', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>Y aller ▶</button>
          </div>}
          <div data-liste-exos-sim style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {["S'APP", 'ANA', 'VAL'].flatMap(code => liste.filter(e => e.comp === code)).map(e => <LigneExo key={e.cle} e={e} prog={prog} etoiles={etoilesSrv} ouvrir={ouvrir} />)}
          </div>
        </>}
    </section>);
}

// Un sous-thème du chapitre : une carte qui ouvre le prochain exercice adapté (les variations restent en réserve)
function CarteSousTheme({ st, exos, etoilesDe, ouvrir }) {
  const av = avancementChapitre(exos, etoilesDe), fini = av.reussis === av.total;
  const aller = () => ouvrir(prochainExercice(exos, etoilesDe, Math.random)?.exo || exos[Math.floor(Math.random() * exos.length)]);
  return (
    <button type="button" className="en-st" data-st={st.id} data-fait={fini || undefined} onClick={aller}>
      <span className="en-exo-corps">
        <span className="en-st-nom">{st.nom}</span>
        <span className="en-st-cap">{st.capacite}</span>
        <span className="en-barre" aria-hidden="true" style={{ height: 6, marginTop: 4 }}><span style={{ width: `${100 * av.reussis / av.total}%` }} /></span>
      </span>
      <span className="en-exo-etat">{fini ? <PastilleFaite taille={24} /> : <span aria-hidden="true" style={{ color: KIT.txt2, fontSize: 20 }}>▶</span>}</span>
    </button>);
}

function DetailChapitre({ c, exos, ctx, naviguer, sansTitre }) {
  const { prog, etoilesSrv, etoilesDe, nbFaits, idsEnCours } = ctx;
  const ouvrir = e => naviguer(e.atelier, e.ex);
  const exosChap = exosDuChapitre(exos, c.domaines), av = avancementChapitre(exosChap, etoilesDe), conseil = exosChap.length ? prochainExercice(exosChap, etoilesDe) : null;
  const enCours = idsEnCours.includes(c.id);
  const validees = useSimsValidees(c.id);
  const { themes, autres } = repartir(exosChap, c.id);
  const listesCompetences = L0 => ['S\'APP', 'ANA', 'VAL'].map(code => {
    const L = L0.filter(e => e.comp === code);
    const cc = COMPETENCES.find(x => x.code === code);
    return L.length === 0 ? null : (
      <div key={code} style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: cc.couleur, margin: '10px 0 6px', fontFamily: TITRE_B }}>{code} · {cc.nom} <span style={{ fontWeight: 600, color: KIT.txt2 }}>({nbFaits(L)} / {L.length} réussis)</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{L.map(e => <LigneExo key={e.cle} e={e} prog={prog} etoiles={etoilesSrv} ouvrir={ouvrir} />)}</div>
      </div>);
  });
  return (
    <section data-chapitre style={{ margin: '14px 0 18px', padding: '18px 18px', border: `1px solid ${BORD_B}`, borderRadius: 26, background: 'white' }}>
      {!sansTitre && <h3 style={{ margin: '0 0 4px', color: ROSE, fontFamily: TITRE_B }}><Pic n="book"/>{c.label}</h3>}
      <div style={{ fontSize: 13, color: KIT.txt2, marginBottom: 8 }}>
        {enCours ? 'Chapitre choisi par ton professeur. ' : ''}{exosChap.length > 0 ? `${av.reussis} exercice${av.reussis > 1 ? 's' : ''} réussi${av.reussis > 1 ? 's' : ''} sur ${av.total} · ${av.etoiles} ★ sur ${av.max}` : 'Pas encore d’exercice de remédiation sur ce chapitre : commence par les simulations.'}
      </div>
      {c.sims.length > 0 && (
        <div data-sims-chapitre style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: KIT.txt, margin: '0 0 8px', fontFamily: TITRE_B }}><Pic n="testtube"/>Les simulations du chapitre</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {c.sims.map(id => <button key={id} data-sim={id} className="en-sim" onClick={() => naviguer(id)}>{nomsSim[id] || `Simulation ${id}`}{validees.has(String(id)) ? <PastilleFaite taille={18} /> : <span aria-hidden="true">▶</span>}</button>)}
          </div>
        </div>)}
      {exosChap.length > 0 && <div style={{ height: 10, borderRadius: 5, background: '#e6edf5', marginBottom: 14 }} role="progressbar" aria-valuemin={0} aria-valuemax={av.max} aria-valuenow={av.etoiles} aria-label="Étoiles gagnées dans le chapitre">
        <div style={{ height: 10, borderRadius: 5, background: TEAL_B, width: `${av.max ? (100 * av.etoiles) / av.max : 0}%` }} />
      </div>}
      {exosChap.length === 0 ? null : conseil ? (
        <div data-conseil style={{ ...styleBoite, border: 'none', borderRadius: 22, padding: '16px 18px', background: ROSE, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: '#ffd68a', letterSpacing: 0.5 }}><Pic n="arrow"/>TON PROCHAIN EXERCICE CONSEILLÉ</div>
            <div style={{ fontWeight: 800, color: 'white', margin: '2px 0', fontSize: 16, fontFamily: TITRE_B }}>{conseil.exo.comp} · {conseil.exo.titre}</div>
            <div style={{ fontSize: 13, color: '#dbe8f7' }}>
              {conseil.raison === 'nouveau' ? 'Tu ne l’as pas encore réussi : on commence par la compétence où tu as le moins avancé dans ce chapitre.' : `Tu l’as réussi avec ${conseil.etoiles} étoile${conseil.etoiles > 1 ? 's' : ''} : vise les 3 étoiles.`}
            </div>
          </div>
          <button onClick={() => ouvrir(conseil.exo)} style={{ background: ORANGE_B, color: '#1b2b3a', border: 'none', borderRadius: 999, padding: '10px 20px', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>Y aller ▶</button>
        </div>
      ) : (
        <div style={{ ...styleBoite, background: '#ecfaf7', border: `1px solid ${TEAL_B}`, borderRadius: 22, marginBottom: 12 }}><Pic n="party"/><b>Tout le chapitre est réussi avec 3 étoiles !</b> Passe à un autre chapitre, ou refais un exercice pour t’entraîner.</div>
      )}
      {themes.length > 0 && (
        <div data-sous-themes style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: KIT.txt, margin: '0 0 8px', fontFamily: TITRE_B }}>Choisis ce que tu veux travailler</div>
          <div className="en-st-grille">{themes.map(t => <CarteSousTheme key={t.st.id} st={t.st} exos={t.exos} etoilesDe={etoilesDe} ouvrir={ouvrir} />)}</div>
        </div>)}
      {themes.length > 0
        ? <details data-tous-exercices style={{ marginBottom: 6 }}>
            <summary style={{ cursor: 'pointer', fontSize: 13.5, fontWeight: 700, color: KIT.txt, minHeight: 44, display: 'flex', alignItems: 'center' }}>{autres.length ? `▸ Autres exercices (${autres.length})` : `▸ Voir la liste complète des exercices (${exosChap.length})`}</summary>
            {autres.length ? listesCompetences(autres) : listesCompetences(exosChap)}
          </details>
        : listesCompetences(exosChap)}
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
  const depuis = (() => { try { const v = parseInt(new URLSearchParams(window.location.search).get('depuis')); return c && c.sims.includes(v) && v in EXOS_DE_SIM ? v : null; } catch { return null; } })();
  const cartes = l => (
    <div data-chapitres className="en-grille">
      {l.map(x => <CarteChapitre key={x.id} c={x} ouvert={false} enCours={ctx.idsEnCours.includes(x.id)} av={avancementChapitre(exosDuChapitre(exos, x.domaines), ctx.etoilesDe)} onClick={() => aller(x.id)} />)}
    </div>);
  return (
    <div className="en" style={{ ...cardStyle, maxWidth: 1000, margin: '0 auto' }} data-page-chapitre={c?.id || 'index'}>
      <CssEntrainement />
      <div style={{ fontSize: 13, color: KIT.txt2 }}>
        <button onClick={() => naviguer(38)} style={{ background: 'none', border: 'none', padding: 0, color: ROSE, textDecoration: 'underline', cursor: 'pointer', fontSize: 13 }}>Je m’entraîne</button>
        {c && <> › {niveau?.label}</>}
      </div>
      {c ? (
        <>
          <h2 style={{ margin: '4px 0 0', color: ROSE, fontFamily: TITRE_B, fontSize: 28, lineHeight: 1.2 }}>{niveau?.label} · {c.label}</h2>
          <p style={{ color: KIT.txt2, fontSize: 14, lineHeight: 1.55, margin: '6px 0 0' }}>
            Tout ce qu’il faut pour ce chapitre : les <b>simulations</b> pour comprendre et expérimenter, puis des <b>exercices</b> pour t’entraîner, rangés par thème
            (<b>s’approprier → analyser → valider</b>). Les exercices de calcul (<b>réaliser</b>) sont en bas de page.
          </p>
          {depuis ? <>
            <ExosDeSimulation simId={depuis} exos={exos} ctx={ctx} naviguer={naviguer} />
            <details open={exosDeSim(exos, depuis).length === 0} style={{ margin: '8px 0' }}>
              <summary style={{ cursor: 'pointer', fontSize: 15, fontWeight: 800, color: KIT.txt }}>Tous les exercices du chapitre « {c.label} »</summary>
              <DetailChapitre c={c} exos={exos} ctx={ctx} naviguer={naviguer} sansTitre />
            </details>
          </> : <DetailChapitre c={c} exos={exos} ctx={ctx} naviguer={naviguer} sansTitre />}
          {autres.length > 0 && <>
            <h3 style={{ margin: '10px 0 0', color: KIT.txt }}>Les autres chapitres de {niveau?.label}</h3>
            {cartes(autres)}
          </>}
        </>
      ) : (
        <>
          <h2 style={{ margin: '4px 0 0', color: ROSE, fontFamily: TITRE_B, fontSize: 28, lineHeight: 1.2 }}>Choisir un chapitre</h2>
          <p style={{ color: KIT.txt2, fontSize: 14 }}>Chaque chapitre rassemble ses simulations et ses exercices d’entraînement.</p>
          {NIVEAUX_CHAPITRES.map(n => <div key={n.key}><div style={{ fontSize: 14, fontWeight: 800, color: KIT.txt, margin: '12px 0 0' }}>{n.label}</div>{cartes(chapitresDuNiveau(n.key))}</div>)}
        </>)}
    </div>);
}

export function SimulationEntrainement({ naviguer }) {
  const [niveauChoisi, setNiveauChoisi] = useEtatPersistant('entrainement-niveau-v1', null);
  const [chapChoisi, setChapChoisi] = useState(undefined);      // undefined : pas de choix de l'élève (on ouvre le chapitre en cours) ; null : tout replié
  const [comp, setComp] = useState('toutes');
  const [ens, setEns] = useState('');                       // enseignement (TSTL : PCM ou une partie de SPCL) ; vide = tous
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
  const enseignements = ENSEIGNEMENTS[niveau] || [];
  const ensValide = enseignements.some(e => e.key === ens) ? ens : '';
  const chapsNiveau = niveau === 'tous' ? CHAPITRES : niveau ? chapitresNiveauEns(niveau, ensValide) : [];
  const ouvertId = chapChoisi !== undefined ? chapChoisi : (chapsNiveau.find(c => idsEnCours.includes(c.id))?.id ?? null);
  const exosDe = c => exosDuChapitre(exos, c.domaines);

  // Exercices du niveau (pour la partie « par compétence ») : thèmes des chapitres du niveau + calcul transversal
  const exosN = (() => {
    if (!niveau || niveau === 'tous') return exos;
    const ds = domainesDe(chapitresNiveauEns(niveau, ensValide));
    return exos.filter(e => e.domaine === TRANSVERSAL || ds.includes(e.domaine));
  })();
  const liste = exosN.filter(e => comp === 'toutes' || e.comp === comp);

  const [mode, setMode] = useEtatPersistant('entrainement-mode-v1', 'chapitre');   // « chapitre » ou « competence »
  const modeValide = mode === 'competence' ? 'competence' : 'chapitre';
  useEffect(() => {          // quand on touche un chapitre, on le ramène en haut de l'écran (son détail s'ouvre juste dessous)
    if (!chapChoisi) return;
    const t = setTimeout(() => document.querySelector(`[data-chapitre-id="${chapChoisi}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    return () => clearTimeout(t);
  }, [chapChoisi]);
  const nomNiveau = NIVEAUX_CHAPITRES.find(n => n.key === niveau)?.label;

  // Les cartes de chapitres ; le détail du chapitre ouvert s'insère juste sous sa carte (et non tout en bas de la page)
  const cartes = l => (
    <div data-chapitres className="en-grille">
      {l.flatMap(c => {
        const ouvert = ouvertId === c.id;
        const carte = <CarteChapitre key={c.id} c={c} ouvert={ouvert} enCours={idsEnCours.includes(c.id)} av={avancementChapitre(exosDe(c), etoilesDe)}
          onClick={() => setChapChoisi(ouvert ? null : c.id)} />;
        return ouvert ? [carte, <div key={`${c.id}-detail`} className="en-detail"><DetailChapitre c={c} exos={exos} ctx={ctx} naviguer={naviguer} sansTitre /></div>] : [carte];
      })}
    </div>);

  return (
    <div className="en" style={{ ...cardStyle, maxWidth: 1000, margin: '0 auto' }}>
      <CssEntrainement />
      <p className="en-sous" style={{ marginTop: 0 }}>Travaille par chapitre ou par compétence : des simulations pour comprendre, des exercices pour t’entraîner.</p>

      <div data-compte className="en-compte">
        {eleve ? <><Pic n="users"/><span>Connecté·e : <b>{sess.profil.identifiant}</b>. Ta progression te suit d’un appareil à l’autre.</span></>
          : estProf(sess) ? <><Pic n="users"/><span>Connecté : <b>{sess.profil.nom}</b> (professeur : rien n’est enregistré quand vous faites les exercices).</span></>
            : <span>Sans compte, ta progression reste sur cet appareil. Avec le compte donné par ton professeur, elle te suit partout.</span>}
        <button type="button" className="en-lien" onClick={() => naviguer(39)}>{sess?.profil ? 'Mon compte' : 'Se connecter'}</button>
        {estProf(sess) && <button type="button" className="en-lien plein" onClick={() => naviguer(40)}><Pic n="bars"/>Suivi professeur</button>}
      </div>

      <details className="en-aide">
        <summary>Comment ça marche ?</summary>
        <p style={{ margin: '0 0 6px' }}>
          Chaque exercice travaille <b>une</b> compétence de la démarche scientifique. L’ordre conseillé suit celle d’un problème :
          <b> s’approprier → analyser → réaliser → valider</b>. Tu peux commencer par n’importe quelle compétence, mais si tu hésites, suis cet ordre.
        </p>
      </details>

      <section data-niveaux>
        <h3 className="en-etape">1 · Je suis en…</h3>
        <div role="group" aria-label="Mon niveau" className="en-niveaux">
          {NIVEAUX_CHAPITRES.map(n => <button key={n.key} type="button" className="en-niv" data-niveau={n.key} aria-pressed={niveau === n.key} onClick={() => { setNiveauChoisi(n.key); setEns(''); setChapChoisi(undefined); }}>{n.label}</button>)}
          <button type="button" className="en-niv tous" data-niveau="tous" aria-pressed={niveau === 'tous'} onClick={() => { setNiveauChoisi('tous'); setEns(''); setChapChoisi(undefined); }}>Voir tous les niveaux</button>
        </div>
        {enseignements.length > 0 && (
          <div data-enseignements>
            <h4 className="en-etape" style={{ margin: '14px 0 6px' }}>Mon enseignement</h4>
            <div role="group" aria-label="Mon enseignement" className="en-niveaux">
              <button type="button" className="en-niv" data-ens="tous" aria-pressed={!ensValide} onClick={() => { setEns(''); setChapChoisi(undefined); }}>Tous</button>
              {enseignements.map(e => <button key={e.key} type="button" className="en-niv" data-ens={e.key} aria-pressed={ensValide === e.key} onClick={() => { setEns(e.key); setChapChoisi(undefined); }}>{e.label}</button>)}
            </div>
          </div>)}
      </section>

      {!niveau && <div data-choix-niveau className="en-invite"><Pic n="arrow" t={22} />Choisis ton niveau : tu verras les chapitres de ton année et les exercices qui vont avec.</div>}

      {niveau && (
        <>
          <h3 className="en-etape">2 · Je choisis comment travailler</h3>
          <div className="en-modes" role="tablist" aria-label="Façon de travailler">
            <button type="button" role="tab" className="en-mode" aria-selected={modeValide === 'chapitre'} onClick={() => setMode('chapitre')}><Pic n="book"/>Par chapitre</button>
            <button type="button" role="tab" className="en-mode" aria-selected={modeValide === 'competence'} onClick={() => setMode('competence')}><Pic n="target"/>Par compétence</button>
          </div>

          {modeValide === 'chapitre' && (
            <section data-chapitres-niveau>
              <p className="en-sous" style={{ fontSize: 14 }}>Touche un chapitre : tu y trouves ses simulations et ses exercices, rangés par compétence.</p>
              {niveau === 'tous'
                ? NIVEAUX_CHAPITRES.map(n => <div key={n.key}><h4 className="en-etape" style={{ margin: '16px 0 0' }}>{n.label}</h4>{cartes(chapitresDuNiveau(n.key))}</div>)
                : cartes(chapsNiveau)}
            </section>)}

          {modeValide === 'competence' && (
            <section data-autres>
              <p className="en-sous" style={{ fontSize: 14 }}>Une compétence à la fois{niveau !== 'tous' ? ` (niveau ${nomNiveau})` : ''}. L’ordre conseillé : 1 → 2 → 3 → 4.</p>
              <div className="en-comps">
                {COMPETENCES.map((c, i) => {
                  const mes = exosN.filter(e => e.comp === c.code), nb = nbFaits(mes);
                  return (
                    <div key={c.code} data-comp={c.code} className="en-comp" style={{ '--c': c.couleur, opacity: c.dispo ? 1 : 0.65 }}>
                      <div className="en-comp-tete">
                        <span className="en-comp-num" aria-hidden="true">{i + 1}</span>
                        <div>
                          <div className="en-comp-nom">{c.nom}<small>{c.code}</small></div>
                          <div className="en-comp-stat">{nb} exercice{nb > 1 ? 's' : ''} réussi{nb > 1 ? 's' : ''} sur {mes.length}</div>
                        </div>
                      </div>
                      <span className="en-barre"><span style={{ width: `${mes.length ? 100 * nb / mes.length : 0}%`, background: c.couleur }} /></span>
                      <p className="en-comp-but">{c.but}</p>
                      {c.dispo
                        ? c.ateliers.map(a => <button key={a.id} type="button" className="en-cta" onClick={() => naviguer(a.id)}>{a.nom} ▶</button>)
                        : <div style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}><Pic n="warn"/>Bientôt</div>}
                    </div>);
                })}
              </div>

              <details className="en-tous">
                <summary>Voir tous les exercices{niveau !== 'tous' ? ' de mon niveau' : ''} ({exosN.length})</summary>
                <div className="en-chips" role="group" aria-label="Filtrer par compétence">
                  <button type="button" className="en-chip" aria-pressed={comp === 'toutes'} onClick={() => setComp('toutes')}>Toutes</button>
                  {COMPETENCES.filter(c => c.dispo).map(c => <button key={c.code} type="button" className="en-chip" aria-pressed={comp === c.code} onClick={() => setComp(c.code)}>{c.code}</button>)}
                </div>
                <div style={{ fontSize: 12.5, color: KIT.txt2, marginBottom: 8 }}>{liste.length} exercice{liste.length > 1 ? 's' : ''} · {nbFaits(liste)} réussi{nbFaits(liste) > 1 ? 's' : ''}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {liste.map(e => <LigneExo key={e.cle} e={e} prog={prog} etoiles={etoilesSrv} ouvrir={ouvrir} montrerTheme />)}
                </div>
              </details>
            </section>)}
        </>)}

      <p className="en-pied">
        {eleve ? 'Connecté·e : tes résultats (réussite, essais, temps) sont enregistrés sur le serveur et visibles de toi et de ton professeur.'
          : 'Ta progression est mémorisée uniquement sur cet appareil et dans ce navigateur : elle n’est envoyée à personne.'}
        {' '}<button type="button" onClick={effacer}>Effacer la progression mémorisée sur cet appareil</button>
      </p>
    </div>
  );
}
