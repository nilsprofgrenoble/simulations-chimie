// Onglet « Fiche » de chaque simulation, à côté de « Parcours guidé », « Exploration libre », « Défi » et « Exercices ».
//  • Fiche débloquée (parcours guidé terminé ou défi réussi), ou professeur connecté : les points « À retenir » de la simulation s'ouvrent dans une fenêtre.
//  • Fiche pas encore débloquée : cadenas, liste des titres des points (pas leur contenu) et bouton vers le parcours guidé.
// Les cartes sont rendues en arrière-plan par le même cadre invisible que la page « Mes fiches » (mode consultation : ni collection ni suivi touchés).
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { recolterFiches, estTermine, lireFigure, EN_RECOLTE } from "./fiches";
import { useSession, estProf } from "./serveur";
import { nomsSim } from "./suivi";
import { SIMS_AVEC_CARTES } from "./simsAvecCartes";
import { ouvrirFiches } from "./chapitres";
import { Pic } from "./Pictos";

function FenetreFiche({ simId, debloquee, onFermer, onParcours }) {
  const [cartes, setCartes] = useState(null);
  useEffect(() => {
    let vivant = true;
    const liste = [];
    recolterFiches([simId], null, { consult: true, cartes: liste })
      .catch(() => {})
      .finally(() => { if (vivant) setCartes([...liste].sort((a, b) => (Number.isFinite(a.ordre) ? a.ordre : 1e6) - (Number.isFinite(b.ordre) ? b.ordre : 1e6))); });
    return () => { vivant = false; };
  }, [simId]);
  useEffect(() => {
    const touche = e => { if (e.key === 'Escape') onFermer(); };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [onFermer]);
  const etroit = typeof window !== 'undefined' && window.innerWidth < 520;
  const nom = nomsSim[simId] || `Simulation ${simId}`;
  const fig = debloquee ? lireFigure(simId) : null;
  const bouton = { padding: '7px 14px', borderRadius: 10, border: '1px solid #9fb8d4', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: '#0b4f94' };
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Fiche de révision : ${nom}`} data-fiche-onglet
      onClick={e => { if (e.target === e.currentTarget) onFermer(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: etroit ? '0' : '4vh 12px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: etroit ? 0 : 16, maxWidth: 640, width: '100%', minHeight: etroit ? '100%' : undefined, padding: etroit ? '12px 6px 16px' : '16px 18px 18px', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0b4f94', letterSpacing: 0.4 }}>FICHE DE RÉVISION</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: '#0f172a' }}>{nom}</div>
          </div>
          <button type="button" onClick={onFermer} aria-label="Fermer la fiche" style={{ ...bouton, padding: '4px 11px' }}>✕</button>
        </div>
        {cartes === null && <p style={{ color: '#475569', fontSize: 14 }}>🔎 Je prépare la fiche…</p>}
        {cartes !== null && cartes.length === 0 && <p style={{ color: '#475569', fontSize: 14 }}>Cette simulation n’a pas encore de fiche.</p>}
        {cartes !== null && cartes.length > 0 && !debloquee && (
          <div>
            <p style={{ margin: '10px 0 6px', fontSize: 14.5, color: '#0f172a', lineHeight: 1.5 }}>
              🔒 Cette fiche se débloque quand tu <b>termines le parcours guidé</b> (ou réussis le défi). Elle contient {cartes.length} point{cartes.length > 1 ? 's' : ''} à retenir :
            </p>
            <ol style={{ margin: '0 0 12px', paddingLeft: 22, color: '#334155', fontSize: 14.5, lineHeight: 1.6 }}>
              {cartes.map(c => <li key={c.cle}>{c.etape || 'À retenir'}</li>)}
            </ol>
            <button type="button" onClick={onParcours} style={{ ...bouton, background: '#0b4f94', color: '#fff', borderColor: '#0b4f94' }}>Aller au parcours guidé ▶</button>
          </div>)}
        {cartes !== null && cartes.length > 0 && debloquee && (
          <>
            <article className="fiche-ecran" style={{ '--c': '#0b4f94', marginTop: 10 }}>
              <div className="fiche-ecran-corps">
                {fig && <img className="fiche-figure" src={fig} alt={`Schéma de la simulation : ${nom}`} />}
                <ol className="fiche-points">
                  {cartes.map(f => (
                    <li key={f.cle}>
                      <div className="fiche-point-titre">{f.etape || 'À retenir'}</div>
                      <div className="fiche-corps" dangerouslySetInnerHTML={{ __html: f.html }} />
                    </li>))}
                </ol>
              </div>
            </article>
            <div style={{ textAlign: 'right', marginTop: 10 }}>
              <button type="button" onClick={() => { onFermer(); ouvrirFiches(); }} style={bouton}>Mes fiches (imprimer) ▶</button>
            </div>
          </>)}
      </div>
    </div>, document.body);
}

// Va au parcours guidé en cliquant sur son onglet (les simulations n'ont pas toutes la même barre de modes).
const versParcours = () => { const b = [...document.querySelectorAll('button')].find(x => /Parcours guidé/.test(x.textContent) && !x.disabled); if (b) b.click(); };

export function OngletFiche({ simId, styleBouton }) {
  const sess = useSession();
  const [ouverte, setOuverte] = useState(false);
  if (!simId || EN_RECOLTE || !SIMS_AVEC_CARTES.has(simId)) return null;
  const debloquee = estProf(sess) || estTermine(simId);
  return (
    <>
      <button onClick={() => setOuverte(true)} data-onglet-fiche title={debloquee ? 'La fiche de révision de cette simulation' : 'Fiche de révision : se débloque quand tu termines le parcours guidé'}
        style={styleBouton}>{debloquee ? <Pic n="clipboard"/> : '🔒 '}Fiche</button>
      {ouverte && <FenetreFiche simId={simId} debloquee={debloquee} onFermer={() => setOuverte(false)} onParcours={() => { setOuverte(false); versParcours(); }} />}
    </>);
}
