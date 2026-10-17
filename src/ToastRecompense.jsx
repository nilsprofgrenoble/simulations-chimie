import { useEffect, useState } from "react";
import { ecouterReussite } from "./carnet";
import { getSession, estEleve, estProf } from "./serveur";
import { estDefi } from "./suivi";

// Petite fenêtre « bravo » à chaque réussite d'un exercice ou d'un défi (pas pour un professeur qui teste).
const MESSAGES = {
  3: 'Sans aucune aide : du premier coup !',
  2: 'Réussi sans voir la correction !',
  1: 'Réussi ! Refais-le sans la correction pour gagner plus d’étoiles.',
};

export function ToastRecompense({ naviguer }) {
  const [info, setInfo] = useState(null);
  useEffect(() => ecouterReussite(i => { if (!estProf(getSession())) setInfo({ ...i, id: Date.now() }); }), []);
  useEffect(() => {
    if (!info) return undefined;
    const t = setTimeout(() => setInfo(null), 6500);
    return () => clearTimeout(t);
  }, [info]);
  if (!info) return null;
  const eleve = estEleve(getSession());
  return (
    <div role="status" aria-live="polite" data-toast-recompense key={info.id}
      style={{ position: 'fixed', left: '50%', bottom: 18, transform: 'translateX(-50%)', zIndex: 1000, width: 'min(420px, calc(100vw - 24px))', boxSizing: 'border-box',
        color: '#fff', borderRadius: 18, padding: '14px 16px', background: 'linear-gradient(135deg, #2a9d8f, #1d5f58)', boxShadow: '0 14px 40px rgba(30,27,75,.55)',
        animation: 'toast-entree .45s cubic-bezier(.2,1.2,.3,1) both' }}>
      <style>{`
        @keyframes toast-entree { from { opacity: 0; transform: translate(-50%, 30px) scale(.9); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
        @keyframes toast-etoile { 0% { transform: scale(0) rotate(-40deg); opacity: 0; } 70% { transform: scale(1.35) rotate(8deg); } 100% { transform: scale(1) rotate(0); opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { [data-toast-recompense], [data-toast-recompense] * { animation: none !important; } }
      `}</style>
      <button onClick={() => setInfo(null)} aria-label="Fermer" style={{ position: 'absolute', right: 8, top: 4, background: 'none', border: 'none', color: 'rgba(255,255,255,.7)', fontSize: 20, cursor: 'pointer' }}>×</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div aria-label={`${info.etoiles} étoile${info.etoiles > 1 ? 's' : ''}`} style={{ display: 'flex', gap: 2, fontSize: 30, lineHeight: 1 }}>
          {[1, 2, 3].map(k => <span key={k} style={{ color: k <= info.etoiles ? '#fbbf24' : 'rgba(255,255,255,.25)', textShadow: k <= info.etoiles ? '0 0 14px rgba(251,191,36,.8)' : 'none',
            display: 'inline-block', animation: k <= info.etoiles ? `toast-etoile .55s ${0.15 + 0.2 * k}s both` : 'none' }}>★</span>)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{estDefi(info.cle) ? 'Défi relevé !' : 'Exercice réussi !'}</div>
          <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,.85)', lineHeight: 1.4 }}>{MESSAGES[info.etoiles]}</div>
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 12.5 }}>
        {eleve ? <button onClick={() => { naviguer(39); setInfo(null); }} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 10px', fontWeight: 700, cursor: 'pointer' }}>Voir mon carnet ▶</button>
          : <button onClick={() => { naviguer(39); setInfo(null); }} style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 10px', fontWeight: 700, cursor: 'pointer' }}>Se connecter pour garder mes étoiles ▶</button>}
      </div>
    </div>);
}
