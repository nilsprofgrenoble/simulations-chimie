import { useState, useEffect, useMemo } from "react";
import { rest } from "../serveur";
import { catalogue } from "./catalogue";
import { trierPourEleve, infoEcheance, finEcheance } from "../devoirs";

// ═══════════════════════════════════════════════════════════════════════════
//  « À FAIRE POUR LA CLASSE » (tout en haut de l'espace élève) : les devoirs assignés par le professeur.
//  « Fait » = réussi après la création du devoir (voir ../devoirs.js). Rien ne s'affiche s'il n'y a aucun devoir
//  ou si le serveur n'a pas encore reçu supabase/06-devoirs.sql.
// ═══════════════════════════════════════════════════════════════════════════
const TONS = {
  retard: { fond: '#fee2e2', bord: '#fca5a5', texte: '#991b1b' },
  urgent: { fond: '#ffedd5', bord: '#fdba74', texte: '#9a3412' },
  ok: { fond: '#dcfce7', bord: '#86efac', texte: '#166534' },
  aucune: { fond: '#f1f5f9', bord: '#cbd5e1', texte: '#475569' },
};

function CarteDevoir({ d, a, par, naviguer, maintenant }) {
  const info = infoEcheance(d.echeance, maintenant, a.termine), ton = TONS[info.ton];
  const frac = a.total ? a.nb / a.total : 0;
  const fin = finEcheance(d.echeance);
  return (
    <div className="dv-carte" style={{ borderLeft: `5px solid ${a.termine ? '#16a34a' : ton.bord}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', flex: 1, minWidth: 160 }}>{a.termine ? '🎉' : '📌'} {d.titre}</div>
        <span className="dv-puce" style={{ background: ton.fond, border: `1px solid ${ton.bord}`, color: ton.texte }}>
          {fin ? `${fin.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} · ` : ''}{info.texte}</span>
      </div>
      <div className="dv-barre" role="progressbar" aria-valuemin={0} aria-valuemax={a.total} aria-valuenow={a.nb} aria-label="Avancement du devoir">
        <i style={{ width: `${Math.max(frac * 100, a.nb ? 6 : 0)}%`, background: a.termine ? '#16a34a' : 'linear-gradient(90deg, #38bdf8, #8b5cf6)' }} /></div>
      <div style={{ fontSize: 13, color: '#475569', margin: '4px 0 8px' }}>
        {a.termine ? 'Devoir terminé, bravo !' : <><b>{a.nb}</b> sur {a.total} fait{a.nb > 1 ? 's' : ''}{a.nb === 0 ? ' : à toi de jouer' : ''}</>}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {d.cles.map((cle, i) => { const it = par.get(cle), fait = a.faits[i]; return (
          <div key={cle} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, opacity: fait ? 0.7 : 1 }}>
            <span aria-label={fait ? 'fait' : 'à faire'} style={{ fontSize: 17 }}>{fait ? '✅' : '⬜'}</span>
            <span style={{ flex: 1, textDecoration: fait ? 'line-through' : 'none', color: '#1e293b' }}>
              {it ? <><b style={{ color: '#64748b' }}>{it.comp === 'DÉFI' ? 'Défi' : it.comp} ·</b> {it.titre}</> : <i>Exercice introuvable (retiré du site ?)</i>}</span>
            {it && !fait && <button className="dv-btn" onClick={() => (it.atelier ? naviguer(it.atelier, it.ex) : naviguer(it.sim))}>Y aller ▶</button>}
          </div>); })}
      </div>
    </div>);
}

export function DevoirsEleve({ lignes, naviguer }) {
  const [devoirs, setDevoirs] = useState(null);
  useEffect(() => {
    let vivant = true;
    rest('devoirs?select=id,titre,cles,echeance,cree_le&order=cree_le.desc')
      .then(d => { if (vivant) setDevoirs(Array.isArray(d) ? d : []); })
      .catch(() => { if (vivant) setDevoirs([]); });          // SQL pas encore appliqué, réseau coupé… : on n'affiche rien
    return () => { vivant = false; };
  }, []);
  const par = useMemo(() => new Map(catalogue().map(i => [i.cle, i])), []);
  const maintenant = useMemo(() => new Date(), []);
  const liste = useMemo(() => trierPourEleve(devoirs || [], lignes || []), [devoirs, lignes]);
  if (!liste.length) return null;
  const ouverts = liste.filter(x => !x.a.termine), finis = liste.filter(x => x.a.termine).slice(0, 5);
  return (
    <section className="dv" aria-label="À faire pour la classe">
      <style>{`
        .dv { margin: 12px 0 6px; }
        .dv h3 { margin: 0 0 8px; font-size: 18px; font-weight: 800; color: #0f172a; display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
        .dv h3 small { font-size: 13px; font-weight: 600; color: #64748b; }
        .dv-carte { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; box-shadow: 0 2px 10px rgba(15,23,42,.06); margin-bottom: 10px; }
        .dv-puce { border-radius: 999px; padding: 3px 11px; font-size: 13px; font-weight: 700; white-space: nowrap; }
        .dv-barre { height: 9px; border-radius: 6px; background: #e2e8f0; overflow: hidden; margin-top: 10px; }
        .dv-barre > i { display: block; height: 100%; border-radius: 6px; transition: width 1s cubic-bezier(.2,.8,.2,1); }
        .dv-btn { cursor: pointer; font: inherit; font-size: 13px; font-weight: 800; color: #fff; border: none; border-radius: 10px; padding: 6px 12px; background: linear-gradient(135deg, #e11d48, #be123c); }
        @media (prefers-reduced-motion: reduce) { .dv *, .dv *::before, .dv *::after { transition: none !important; } }
      `}</style>
      {ouverts.length > 0 && <h3>📌 À faire pour la classe <small>{ouverts.length} devoir{ouverts.length > 1 ? 's' : ''} de ton professeur</small></h3>}
      {ouverts.map(({ d, a }) => <CarteDevoir key={d.id} d={d} a={a} par={par} naviguer={naviguer} maintenant={maintenant} />)}
      {finis.length > 0 && (
        <details style={{ marginBottom: 6 }} open={ouverts.length === 0}>
          <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#166534', fontSize: 14.5 }}>✅ Devoirs terminés ({finis.length})</summary>
          <div style={{ marginTop: 8 }}>{finis.map(({ d, a }) => <CarteDevoir key={d.id} d={d} a={a} par={par} naviguer={naviguer} maintenant={maintenant} />)}</div>
        </details>)}
    </section>);
}
