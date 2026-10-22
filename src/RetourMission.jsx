import { useState, useEffect } from "react";
import { CLE_HORODATAGE } from "./suivi";
import { CLE_PARTIE_KEPLER, ID_ESCAPE } from "./simulations/escapeKeplerConstantes";
import { MODULES, CONTROLE, restant, mmss } from "./simulations/escapeKeplerModele";

// Bouton flottant « Retour à la station » : visible pendant une mission Kepler, dans la simulation d'une épreuve.
const lire = (cle, secours) => { try { return JSON.parse(window.localStorage.getItem(cle) || window.sessionStorage.getItem(cle) || 'null') ?? secours; } catch { return secours; } };

export default function RetourMission({ activeId, naviguer }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (activeId === ID_ESCAPE) return null;
  let retour = null;
  try { retour = JSON.parse(window.sessionStorage.getItem('escape-retour') || 'null'); } catch { retour = null; }
  const partie = lire(CLE_PARTIE_KEPLER, null);
  if (!retour || !partie || typeof partie.debut !== 'number' || retour.sim !== activeId) return null;
  const m = [...MODULES, CONTROLE].find(x => x.id === retour.id);
  const horo = lire(CLE_HORODATAGE, {});
  const fait = m && (horo[`${m.sim}:defi.principal`] || 0) >= partie.debut;
  const classe = partie.mode === 'classe';
  return (
    <button type="button" data-retour-mission onClick={() => naviguer(ID_ESCAPE)}
      style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 9999, background: fait ? '#3be29a' : '#0a1530', color: fait ? '#04122e' : '#e6f0ff', border: '2px solid #38e1ff', borderRadius: 999, padding: '10px 16px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 18px rgba(0,0,0,.35)', font: 'inherit' }}>
      {fait ? '✅ Module réparé : retour à la station' : '🚀 Retour à la station Kepler'}{classe ? ` · T−${mmss(Math.max(0, restant(partie, now)))}` : ''}
    </button>);
}
