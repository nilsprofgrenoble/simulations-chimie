import { useState, useEffect } from "react";
import { CLE_HORODATAGE } from "./suivi";

// Cadre d'une épreuve de mission : la simulation s'ouvre dans l'univers du jeu (mêmes couleurs que la page de la mission),
// avec l'énoncé clair de l'épreuve, le moyen de la valider et un retour à la mission toujours visible.
const lire = (stockage, cle, secours) => { try { return JSON.parse(stockage.getItem(cle) || 'null') ?? secours; } catch { return secours; } };
const reussie = mission => {
  const horo = lire(window.localStorage, CLE_HORODATAGE, {});
  const depuis = mission.controle ? mission.partie.codeOkAt : mission.partie.debut;
  return typeof depuis === 'number' && (horo[`${mission.m.sim}:defi.principal`] || 0) >= depuis;
};

export default function CadreMission({ mission, naviguer, children }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const { def, m } = mission, c = def.c, M = def.M;
  const partie = lire(window.localStorage, def.cle, mission.partie);
  const fait = reussie(mission), classe = partie.mode === 'classe';
  const nbIndices = partie.indices?.[m.id] || 0;
  const bouton = (vert) => ({ padding: '8px 14px', borderRadius: 999, border: `2px solid ${vert ? c.vert : c.accent}`, background: vert ? c.vert : 'transparent', color: vert ? '#04122e' : c.texte, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 });
  return (
    <div data-cadre-mission style={{ '--entete-h': '56px', minHeight: '100vh', background: def.fond, color: c.texte, fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 30, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '9px clamp(12px, 3vw, 24px)', background: 'rgba(2,8,23,0.88)', backdropFilter: 'blur(6px)', borderBottom: `1px solid ${c.bord}` }}>
        <button type="button" data-retour-mission onClick={() => naviguer(def.page)} style={bouton(fait)}>{fait ? '✅ Réparé : retour à la mission' : `← ${def.retour}`}</button>
        <span style={{ flex: 1, minWidth: 140, textAlign: 'center', fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: '.5px', color: '#fff' }}>{def.icone} {def.nom} · {m.nom}</span>
        {classe && <span style={{ fontFamily: 'ui-monospace,monospace', fontWeight: 800, color: M.restant(partie, now) < 300 ? '#ff5a5f' : c.accent }}>T−{M.mmss(Math.max(0, M.restant(partie, now)))}</span>}
      </div>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(10px, 2.5vw, 22px)' }}>
        <section style={{ background: c.panneau, border: `1.5px solid ${fait ? c.vert : c.bord}`, borderRadius: 14, padding: '14px 18px', marginBottom: 14, lineHeight: 1.55, textAlign: 'left' }} aria-label="Énoncé de la mission">
          <div style={{ fontSize: 12.5, letterSpacing: 2, color: c.accent, fontFamily: 'ui-monospace,monospace' }}>{mission.controle ? 'ÉPREUVE FINALE' : 'RÉPARATION EN COURS'}</div>
          <h2 style={{ margin: '4px 0 8px', fontSize: 'clamp(19px, 4.5vw, 24px)', color: '#fff', fontFamily: "'Outfit', sans-serif" }}>{m.nom}</h2>
          <p style={{ margin: '0 0 6px', color: c.doux }}><b style={{ color: c.ambre }}>Panne :</b> {m.panne}</p>
          <p style={{ margin: '0 0 6px' }}><b style={{ color: c.vert }}>Ta mission :</b> {m.mission}</p>
          {m.valider && <p style={{ margin: 0 }}><b style={{ color: c.accent }}>Comment valider :</b> {m.valider}</p>}
          {nbIndices > 0 && <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: c.ambre }}>{m.indices.slice(0, nbIndices).map((t, i) => <li key={i}>💡 {t}</li>)}</ul>}
          {fait && <div role="status" style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(59,226,154,.15)', border: `1px solid ${c.vert}`, color: c.vert, fontWeight: 800 }}>✅ Épreuve réussie ! Retourne à la mission (bouton en haut) pour récupérer ton chiffre.</div>}
        </section>
        <div style={{ background: '#f6f8fb', color: '#1f2937', borderRadius: 16, padding: 'clamp(8px, 2vw, 16px)', boxShadow: '0 10px 30px rgba(0,0,0,.45)', textAlign: 'left' }}>{children}</div>
      </div>
    </div>);
}
