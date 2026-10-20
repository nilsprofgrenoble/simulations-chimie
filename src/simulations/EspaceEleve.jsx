import { useState, useEffect, useMemo } from "react";
import { analyser, ICONES_NIVEAU, TITRES } from "../carnet";
import { tousLesExercices } from "./Entrainement";
import { etiquettesDefis, nomsSim } from "../suivi";
import { trierPourEleve } from "../devoirs";
import { PROFIL_PAR_ETAPES, etapeEleve, badgesVisibles, prochaineSimulation } from "../profil";
import { Carnet, Anneau } from "./Carnet";
import { DevoirsEleve, useDevoirs } from "./DevoirsEleve";
import { VieDeClasse } from "./VieDeClasse";
import { ACCENT, ACCENT_CLAIR, FOND_BLOC, TEXTE, TEXTE2, BORDURE } from "../theme";

// ═══════════════════════════════════════════════════════════════════════════
//  L'ESPACE ÉLÈVE (« Mon profil »), par étapes : voir ../profil.js pour les règles.
//  apercu : { devoirs, classe } = données fictives (aperçu élève du professeur) : rien n'est lu ni écrit sur le serveur.
//  pied : fonction (étape) → contenu ajouté tout en bas (détail des résultats).
// ═══════════════════════════════════════════════════════════════════════════
const css = `
  .ee-profil { border-radius: 18px; padding: 18px 20px; background: ${FOND_BLOC}; border: 1px solid ${BORDURE}; box-shadow: 0 2px 12px rgba(15,23,42,.07);
    display: flex; gap: 18px; align-items: center; flex-wrap: wrap; text-align: left; }
  .ee-barre { height: 12px; border-radius: 8px; background: #dbe3ec; overflow: hidden; max-width: 420px; }
  .ee-barre > i { display: block; height: 100%; border-radius: 8px; background: ${ACCENT}; transition: width 1.1s cubic-bezier(.2,.8,.2,1); }
  .ee-cta { border: none; border-radius: 10px; padding: 11px 20px; font: inherit; font-weight: 800; font-size: 15.5px; cursor: pointer; color: #fff; background: ${ACCENT}; }
  .ee-cta:hover { filter: brightness(1.1); }
  .ee-lien { border: 2px solid ${ACCENT}; border-radius: 10px; padding: 8px 16px; font: inherit; font-weight: 800; font-size: 14.5px; cursor: pointer; color: ${ACCENT}; background: #fff; }
  .ee-tuile { flex: 1 1 120px; border: 1px solid ${BORDURE}; border-radius: 14px; padding: 10px 12px; background: ${FOND_BLOC}; text-align: center; }
  .ee-tuile b { display: block; font-size: 28px; color: ${TEXTE}; line-height: 1.1; }
  .ee-tuile span { font-size: 13.5px; color: ${TEXTE2}; font-weight: 700; }
  .ee-h { margin: 22px 0 8px; font-size: 18px; font-weight: 800; color: ${TEXTE}; text-align: left; }
  .ee-ruban { margin-bottom: 10px; padding: 10px 14px; border-radius: 12px; background: ${ACCENT_CLAIR}; border: 1px solid #b9cfe0; color: ${TEXTE}; font-weight: 700; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; text-align: left; }
  .ee-repli { background: ${FOND_BLOC}; border: 1px solid ${BORDURE}; border-radius: 14px; padding: 0 14px; text-align: left; box-shadow: 0 1px 6px rgba(15,23,42,.05); }
  .ee-repli > summary { list-style: none; cursor: pointer; padding: 12px 0; font-size: 16px; font-weight: 800; color: ${TEXTE}; display: flex; align-items: center; gap: 10px; }
  .ee-repli > summary::-webkit-details-marker { display: none; }
  .ee-repli > summary::after { content: '▾'; margin-left: auto; color: ${TEXTE2}; transition: transform .2s; }
  .ee-repli[open] > summary::after { transform: rotate(180deg); }
  .ee-repli[open] { padding-bottom: 12px; }
  @media (prefers-reduced-motion: reduce) { .ee-barre > i { transition: none; } }
`;

// Petit ruban « nouveau palier » : affiché une fois quand le niveau a augmenté depuis la dernière visite (mémorisé sur l'appareil)
function useNouveauPalier(etiquette, actif) {
  const cle = 'profil-palier-vu';
  const [vu, setVu] = useState(() => { try { return window.localStorage.getItem(cle); } catch { return null; } });
  const nouveau = actif && vu !== null && vu !== etiquette;
  useEffect(() => {
    if (!actif) return;
    if (vu === null) { try { window.localStorage.setItem(cle, etiquette); } catch { /* mémorisation indisponible */ } }
  }, [actif, vu, etiquette]);
  const fermer = () => { try { window.localStorage.setItem(cle, etiquette); } catch { /* mémorisation indisponible */ } setVu(etiquette); };
  return [nouveau, fermer];
}

function BlocProfil({ A, etape, naviguer, prochaine, apercu }) {
  const [mont, setMont] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMont(true), 80); return () => clearTimeout(t); }, []);
  const { niveau } = A;
  const nom = etape === 0 ? 'Bienvenue' : niveau.titre, icone = etape === 0 ? '🌠' : ICONES_NIVEAU[Math.min(niveau.n, ICONES_NIVEAU.length) - 1];
  const suivant = TITRES[Math.min(niveau.n + 1, TITRES.length) - 1];
  const [ruban, fermerRuban] = useNouveauPalier(`${niveau.n}`, etape > 0 && !apercu);
  const titreSim = prochaine ? (nomsSim[prochaine.sim] || `Simulation ${prochaine.sim}`) : null;
  const frac = etape === 0 ? 0 : Math.max(0.04, niveau.frac);   // jamais « vide » une fois le parcours guidé terminé
  const texte = etape === 0
    ? (prochaine ? <>Ton professeur te propose de commencer par <b>{titreSim}</b> : suis son parcours guidé.</> : <>Réussis ton premier exercice pour gagner ta première étoile ★</>)
    : A.stat.reussis === 0 ? <>Parcours guidé terminé, bravo ! Réussis un exercice ou un défi pour faire monter la jauge.</>
      : <><b>{A.stat.reussis}</b> réussite{A.stat.reussis > 1 ? 's' : ''} : encore <b>{niveau.reste} ★</b> pour devenir <b>{suivant}</b>.</>;
  return (
    <section data-profil data-etape={etape} aria-label="Mon profil">
      {ruban && (
        <div className="ee-ruban" role="status" data-ruban-palier><span aria-hidden="true" style={{ fontSize: 22 }}>🎉</span>
          <span style={{ flex: 1 }}>Nouveau palier : tu es maintenant <b>{niveau.titre}</b> !</span>
          <button className="ee-lien" onClick={fermerRuban}>Super</button></div>)}
      <div className="ee-profil">
        {etape === 0
          ? <div aria-hidden="true" style={{ width: 96, height: 96, borderRadius: '50%', background: ACCENT_CLAIR, border: `2px solid ${ACCENT}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <span style={{ fontSize: 34 }}>🌠</span><span style={{ fontSize: 12, fontWeight: 800, color: ACCENT }}>Bienvenue</span></div>
          : <Anneau frac={niveau.frac} n={niveau.n} mont={mont} />}
        <div style={{ flex: 1, minWidth: 230 }}>
          <div style={{ fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: TEXTE2, fontWeight: 800 }}>Mon profil</div>
          {etape > 0 && <div data-nom-niveau style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.15, margin: '2px 0 6px', color: TEXTE }}><span aria-hidden="true">{icone}</span> {nom}</div>}
          {etape === 0 && <div style={{ fontSize: 20, fontWeight: 800, color: TEXTE, margin: '2px 0 6px' }}>Réalise tes exercices, franchis les paliers et augmente ton niveau !</div>}
          <div className="ee-barre" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(frac * 100)} aria-label="Progression vers le niveau suivant">
            <i style={{ width: mont ? `${frac ? Math.max(4, frac * 100) : 0}%` : '0%' }} /></div>
          <div style={{ fontSize: 14, color: TEXTE2, margin: '6px 0 0' }}>{texte}</div>
          {etape === 0 && (
            <div style={{ marginTop: 12 }}>
              <button className="ee-cta" data-cta-premiere onClick={() => (prochaine ? naviguer(Number(prochaine.sim)) : naviguer(38))}>
                {prochaine ? 'Faire la 1ʳᵉ simulation ▶' : 'Commencer à m’entraîner ▶'}</button>
            </div>)}
        </div>
      </div>
    </section>);
}

function Tuiles({ A, lignes }) {
  const nbBadges = A.badges.filter(b => b.ok).length, montrerBadges = badgesVisibles(A, lignes);
  return (
    <div data-tuiles style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '12px 0 0' }}>
      <div className="ee-tuile"><span>Exercices</span><b>{A.stat.reussisExo}</b></div>
      <div className="ee-tuile"><span>Défis</span><b>{A.stat.reussisDefi}</b></div>
      {montrerBadges && <div className="ee-tuile" data-tuile-badges><span>Badges</span><b>{nbBadges} / {A.badges.length}</b></div>}
    </div>);
}

export function EspaceEleve({ lignes, naviguer, apercu, pied }) {
  const items = useMemo(() => [...tousLesExercices(), ...etiquettesDefis().map(d => ({ cle: d.cle, comp: 'DÉFI', titre: d.titre, sim: d.sim }))], []);
  const A = useMemo(() => analyser(items, lignes), [items, lignes]);
  const devoirs = useDevoirs(apercu?.devoirs);
  const etape = etapeEleve(A, lignes);
  const prochaine = useMemo(() => prochaineSimulation(devoirs, lignes, trierPourEleve), [devoirs, lignes]);

  // Ancien affichage (PROFIL_PAR_ETAPES = false dans src/profil.js)
  if (!PROFIL_PAR_ETAPES) {
    return (<>
      <DevoirsEleve lignes={lignes} naviguer={naviguer} devoirsListe={devoirs ?? []} />
      <Carnet lignes={lignes} naviguer={naviguer} />
      <VieDeClasse lignes={lignes} apercu={apercu?.classe} />
      {pied?.(2)}
    </>);
  }
  const avecBadges = badgesVisibles(A, lignes);
  const aDesDevoirs = (devoirs || []).length > 0;
  return (
    <div data-espace-eleve data-etape={etape}>
      <style>{css}</style>
      <BlocProfil A={A} etape={etape} naviguer={naviguer} prochaine={prochaine} apercu={!!apercu} />
      {etape > 0 && (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '12px 0 0' }}>
            <button className="ee-lien" onClick={() => naviguer(38)}>Compétences →</button>
            <button className="ee-lien" onClick={() => naviguer(prochaine ? Number(prochaine.sim) : 0)}>Simulations →</button>
          </div>
        </>)}

      {/* 1. Ma classe : étape 0, une simple invitation ; ensuite, les devoirs pas à pas (2 au plus, les autres repliés) */}
      {etape === 0
        ? (aDesDevoirs && (
          <section data-ma-classe-attente style={{ marginTop: 22, textAlign: 'left' }}>
            <h3 className="ee-h" style={{ margin: '0 0 8px' }}>📌 Ma classe</h3>
            <div style={{ border: `1px dashed ${BORDURE}`, borderRadius: 14, padding: '12px 14px', color: TEXTE2, fontSize: 14.5 }}>
              Ton professeur a préparé des activités pour toi. Elles apparaîtront ici, une étape après l’autre, dès que tu auras terminé ta première simulation.
            </div>
          </section>))
        : <DevoirsEleve lignes={lignes} naviguer={naviguer} devoirsListe={devoirs ?? []} pasAPas max={2} />}

      {/* 2. À revoir (2 cartes au plus) */}
      <Carnet lignes={lignes} naviguer={naviguer} parties={{ hero: false, vide: false, revoir: true, revoirToujours: etape === 0, revoirMax: 2, objectifs: false, competences: false, badges: false, regularite: false }} />

      {etape > 0 && <VieDeClasse lignes={lignes} apercu={apercu?.classe} />}

      {/* 3. Le reste : repliable, pour ne pas noyer l'essentiel */}
      {etape > 0 && (
        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <details className="ee-repli" data-repli="chiffres"><summary>📊 Mes chiffres</summary><Tuiles A={A} lignes={lignes} /></details>
          {etape >= 2 && (
            <details className="ee-repli" data-repli="objectifs"><summary>🎯 Objectifs et compétences</summary>
              <Carnet lignes={lignes} naviguer={naviguer} parties={{ hero: false, vide: false, revoir: false, objectifs: true, competences: true, badges: false, regularite: false }} /></details>)}
          {avecBadges && (
            <details className="ee-repli" data-repli="badges-regularite"><summary>🏅 Badges et régularité</summary>
              <Carnet lignes={lignes} naviguer={naviguer} parties={{ hero: false, vide: false, revoir: false, objectifs: false, competences: false, badges: true, regularite: true }} /></details>)}
        </div>)}
      {pied?.(etape)}
    </div>);
}
