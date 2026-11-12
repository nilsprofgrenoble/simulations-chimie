import { useState, useEffect, useMemo } from "react";
import { analyser, iconeNiveau, titreNiveau } from "../carnet";
import { tousLesExercices } from "./Entrainement";
import { etiquettesDefis, nomsSim } from "../suivi";
import { trierPourEleve } from "../devoirs";
import { PROFIL_PAR_ETAPES, etapeEleve, badgesVisibles, prochaineSimulation, prochainesSimulations } from "../profil";
import { Carnet, Anneau } from "./Carnet";
import { DevoirsEleve, useDevoirs } from "./DevoirsEleve";
import { VieDeClasse } from "./VieDeClasse";
import { ACCENT, ACCENT_CLAIR, FOND_BLOC, TEXTE, TEXTE2, BORDURE } from "../theme";
import { Pic } from "../Pictos";

// ═══════════════════════════════════════════════════════════════════════════
//  L'ESPACE ÉLÈVE (« Mon profil »), par étapes : voir ../profil.js pour les règles.
//  apercu : { devoirs, classe } = données fictives (aperçu élève du professeur) : rien n'est lu ni écrit sur le serveur.
//  pied : fonction (étape) → contenu ajouté tout en bas (détail des résultats).
// ═══════════════════════════════════════════════════════════════════════════
const css = `
  .ee-profil { border-radius: 28px; padding: 26px; background: #0b4f94; color: #fff; display: flex; gap: 22px; align-items: center; flex-wrap: wrap; text-align: left; }
  .ee-profil .ee-etiq { font: 700 13px Inter, system-ui, sans-serif; letter-spacing: .09em; text-transform: uppercase; color: #cfe3f7; }
  .ee-profil .ee-nom { font: 800 clamp(28px, 6vw, 40px)/1.1 Outfit, Inter, sans-serif; letter-spacing: -.02em; margin: 4px 0 10px; color: #fff; }
  .ee-barre { height: 12px; border-radius: 8px; background: rgba(255,255,255,.28); overflow: hidden; max-width: 420px; }
  .ee-barre > i { display: block; height: 100%; border-radius: 8px; background: #f5a31a; transition: width 1.1s cubic-bezier(.2,.8,.2,1); }
  .ee-cta { border: none; border-radius: 14px; padding: 13px 22px; font: inherit; font-weight: 800; font-size: 15.5px; cursor: pointer; color: #3a2500; background: #f5a31a; }
  .ee-cta:hover { background: #ffb83d; }
  .ee-lien { border: none; border-radius: 14px; padding: 12px 20px; font: inherit; font-weight: 800; font-size: 15px; cursor: pointer; color: #3a2500; background: #f5a31a; }
  .ee-lien:hover { background: #ffb83d; }
  .ee-tuile { flex: 1 1 120px; border-radius: 22px; padding: 16px 14px; text-align: left; }
  .ee-tuile:nth-child(1) { background: #f5a31a; color: #3a2500; }
  .ee-tuile:nth-child(2) { background: #2cc4ae; color: #04352d; }
  .ee-tuile:nth-child(3) { background: #5b4bdb; color: #fff; }
  .ee-tuile b { display: block; font: 800 40px/1 Outfit, Inter, sans-serif; letter-spacing: -.03em; margin-top: 4px; }
  .ee-tuile span { font-size: 14px; font-weight: 700; }
  .ee-h { margin: 26px 0 10px; font: 800 24px Outfit, Inter, sans-serif; letter-spacing: -.01em; color: #0c1a2e; text-align: left; }
  .ee-ruban { margin-bottom: 12px; padding: 14px 18px; border-radius: 22px; background: #f5a31a; color: #3a2500; font-weight: 700; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; text-align: left; }
  .ee-ruban .ee-lien { background: #fff; }
  .ee-repli { background: ${FOND_BLOC}; border: 1px solid #d5dfeb; border-radius: 22px; padding: 0 20px; text-align: left; }
  .ee-repli > summary { list-style: none; cursor: pointer; padding: 16px 0; font: 800 19px Outfit, Inter, sans-serif; color: #0c1a2e; display: flex; align-items: center; gap: 10px; }
  .ee-repli > summary::-webkit-details-marker { display: none; }
  .ee-repli > summary::after { content: '▾'; margin-left: auto; color: ${TEXTE2}; transition: transform .2s; }
  .ee-repli[open] > summary::after { transform: rotate(180deg); }
  .ee-repli[open] { padding-bottom: 16px; }
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

function BlocProfil({ A, etape, naviguer, prochaine, prochaines = [], apercu }) {
  const [mont, setMont] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMont(true), 80); return () => clearTimeout(t); }, []);
  const { niveau } = A;
  const nom = etape === 0 ? 'Bienvenue' : niveau.titre, icone = etape === 0 ? '🌠' : iconeNiveau(niveau.n);
  const suivant = titreNiveau(niveau.n + 1);
  const [ruban, fermerRuban] = useNouveauPalier(`${niveau.n}`, etape > 0 && !apercu);
  const titreSim = prochaine ? (nomsSim[prochaine.sim] || `Simulation ${prochaine.sim}`) : null;
  const frac = etape === 0 ? 0 : Math.max(0.04, niveau.frac);   // jamais « vide » une fois le parcours guidé terminé
  const texte = etape === 0
    ? (prochaines.length > 1 ? <>Tes professeurs te proposent de commencer par ces {prochaines.length} simulations : suis leurs parcours guidés.</> : prochaine ? <>Ton professeur te propose de commencer par <b>{titreSim}</b> : suis son parcours guidé.</> : <>Réussis ton premier exercice pour gagner ta première étoile ★</>)
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
          ? <div aria-hidden="true" style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(255,255,255,.16)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <span style={{ fontSize: 34 }}>🌠</span><span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>Bienvenue</span></div>
          : <Anneau frac={niveau.frac} n={niveau.n} mont={mont} sombre />}
        <div style={{ flex: 1, minWidth: 230 }}>
          <div className="ee-etiq">Mon profil</div>
          {etape > 0 && <div data-nom-niveau className="ee-nom"><span aria-hidden="true">{icone}</span> {nom}</div>}
          {etape === 0 && <div className="ee-nom" style={{ fontSize: 26 }}>Réalise tes exercices, franchis les paliers et augmente ton niveau !</div>}
          <div className="ee-barre" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(frac * 100)} aria-label="Progression vers le niveau suivant">
            <i style={{ width: mont ? `${frac ? Math.max(4, frac * 100) : 0}%` : '0%' }} /></div>
          <div style={{ fontSize: 15, color: '#fff', margin: '10px 0 0', lineHeight: 1.5 }}>{texte}</div>
          {etape === 0 && (
            <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {prochaines.length > 1
                ? prochaines.map(p => (
                    <button key={p.sim} className="ee-cta" data-cta-premiere onClick={() => naviguer(Number(p.sim))}>
                      {nomsSim[p.sim] || `Simulation ${p.sim}`} ▶</button>))
                : <button className="ee-cta" data-cta-premiere onClick={() => (prochaine ? naviguer(Number(prochaine.sim)) : naviguer(38))}>
                    {prochaine ? 'Faire la 1ʳᵉ simulation ▶' : 'Commencer à m’entraîner ▶'}</button>}
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
  const prochaines = useMemo(() => prochainesSimulations(devoirs, lignes, trierPourEleve), [devoirs, lignes]);

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
      <BlocProfil A={A} etape={etape} naviguer={naviguer} prochaine={prochaine} prochaines={prochaines} apercu={!!apercu} />
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
            <h3 className="ee-h" style={{ margin: '0 0 8px' }}><Pic n="pin"/>Ma classe</h3>
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
          <details className="ee-repli" data-repli="chiffres"><summary><Pic n="bars"/>Mes chiffres</summary><Tuiles A={A} lignes={lignes} /></details>
          {etape >= 2 && (
            <details className="ee-repli" data-repli="objectifs"><summary><Pic n="target"/>Objectifs et compétences</summary>
              <Carnet lignes={lignes} naviguer={naviguer} parties={{ hero: false, vide: false, revoir: false, objectifs: true, competences: true, badges: false, regularite: false }} /></details>)}
          {avecBadges && (
            <details className="ee-repli" data-repli="badges-regularite"><summary><Pic n="medal"/>Badges et régularité</summary>
              <Carnet lignes={lignes} naviguer={naviguer} parties={{ hero: false, vide: false, revoir: false, objectifs: false, competences: false, badges: true, regularite: true }} /></details>)}
        </div>)}
      {pied?.(etape)}
    </div>);
}
