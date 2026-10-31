/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useMemo } from "react";
import { rest } from "../serveur";
import { catalogueDevoirs } from "./catalogue";
import { trierPourEleve, infoEcheance, finEcheance, estCleSim, detailSim, SEUIL_GUIDE_S } from "../devoirs";
import { etapesDevoir, fenetreEtapes } from "../profil";
import { ACCENT } from "../theme";
import { Pic } from "../Pictos";

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

// « Parcours guidé : 3 / 5 min · défi à réussir » : où en est l'élève sur une simulation du devoir
function etatSim(lignes, cle, depuis) {
  const x = detailSim(lignes || [], cle, depuis), min = Math.floor(Math.min(x.guideS, SEUIL_GUIDE_S) / 60);
  return `🧭 parcours guidé : ${x.guideOk ? 'fait' : `${min} / ${SEUIL_GUIDE_S / 60} min`}${x.defis.length ? ` · 🎯 défi : ${x.defiOk ? 'réussi' : 'à réussir'}` : ''}`;
}

function CarteDevoir({ d, a, par, naviguer, maintenant, lignes }) {
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
        <i style={{ width: `${Math.max(frac * 100, a.nb ? 6 : 0)}%`, background: a.termine ? '#3a8a5a' : '#2a9d8f' }} /></div>
      <div style={{ fontSize: 13, color: '#475569', margin: '4px 0 8px' }}>
        {a.termine ? 'Devoir terminé, bravo !' : <><b>{a.nb}</b> sur {a.total} fait{a.nb > 1 ? 's' : ''}{a.nb === 0 ? ' : à toi de jouer' : ''}</>}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Ordre d'affichage : d'abord les simulations (parcours guidé), puis les exercices et les défis, dans l'ordre choisi par le professeur */}
        {d.cles.map((cle, i) => ({ cle, i })).sort((x, y) => (estCleSim(y.cle) ? 1 : 0) - (estCleSim(x.cle) ? 1 : 0) || x.i - y.i).map(({ cle, i }) => { const it = par.get(cle), fait = a.faits[i]; return (
          <div key={cle} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, opacity: fait ? 0.7 : 1 }}>
            <span aria-label={fait ? 'fait' : 'à faire'} style={{ fontSize: 17 }}>{fait ? '✅' : '⬜'}</span>
            <span style={{ flex: 1, textDecoration: fait ? 'line-through' : 'none', color: '#1e293b' }}>
              {it ? <><b style={{ color: '#64748b' }}>{it.comp === 'DÉFI' ? 'Défi' : it.comp === 'SIM' ? 'Simulation' : it.comp} ·</b> {it.titre}</> : <i>Exercice introuvable (retiré du site ?)</i>}
              {it && estCleSim(cle) && !fait && <span data-etat-sim style={{ display: 'block', fontSize: 12.5, color: '#64748b', textDecoration: 'none' }}>{etatSim(lignes, cle, d.cree_le)}</span>}</span>
            {it && !fait && <button className="dv-btn" onClick={() => (it.atelier ? naviguer(it.atelier, it.ex, true) : naviguer(it.sim))}>Y aller ▶</button>}
          </div>); })}
      </div>
    </div>);
}

// Version « pas à pas » (profil par étapes) : on ne montre que l'étape en cours ; les suivantes se débloquent une à une.
function CarteDevoirPasAPas({ d, a, par, naviguer, maintenant, lignes }) {
  const info = infoEcheance(d.echeance, maintenant, a.termine), ton = TONS[info.ton], fin = finEcheance(d.echeance);
  const etapes = etapesDevoir(d, lignes || []), { faites, visibles, verrouillees } = fenetreEtapes(etapes);
  const titreDe = cle => par.get(cle)?.titre;
  const nomSim = e => par.get(`sim:${e.sim}`)?.titre || `Simulation ${e.sim}`;
  const aller = e => {
    if (e.type === 'defi' && !e.unique) { try { window.sessionStorage.setItem('mode-demande', JSON.stringify({ mode: 'explore', t: Date.now() })); } catch { /* sans mémorisation, la simulation s'ouvre comme d'habitude */ } }   // le défi se lance depuis la simulation : on évite le parcours guidé
    if (e.type === 'guide' || (e.type === 'defi' && !e.unique)) return naviguer(Number(e.sim));
    const it = par.get(e.cle);
    return it?.atelier ? naviguer(it.atelier, it.ex, true) : naviguer(it?.sim ?? Number(e.sim));
  };
  const frac = etapes.length ? faites.length / etapes.length : 0;
  const libelle = e => (e.type === 'guide' ? <><b>Parcours guidé</b> · {nomSim(e)}<span data-etat-sim style={{ display: 'block', fontSize: 12.5, color: '#64748b' }}>
        {Math.floor(Math.min(e.guideS, SEUIL_GUIDE_S) / 60)} / {SEUIL_GUIDE_S / 60} min de parcours : suis les étapes de la simulation</span></>
    : e.type === 'defi' ? <><b>Défi</b> · {e.unique ? titreDe(e.cle) || e.cle : nomSim(e)}<span style={{ display: 'block', fontSize: 12.5, color: '#64748b' }}>Ouvre l’onglet « Défi » de la simulation et réussis-en un.</span></>
      : <>{par.get(e.cle) ? <><b style={{ color: '#64748b' }}>{par.get(e.cle).comp} ·</b> {par.get(e.cle).titre}</> : <i>Exercice introuvable (retiré du site ?)</i>}</>);
  return (
    <div className="dv-carte" data-pas-a-pas style={{ borderLeft: `5px solid ${a.termine ? '#16a34a' : ton.bord}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', flex: 1, minWidth: 160 }}>{a.termine ? '🎉' : '📌'} {d.titre}</div>
        <span className="dv-puce" style={{ background: ton.fond, border: `1px solid ${ton.bord}`, color: ton.texte }}>
          {fin ? `${fin.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} · ` : ''}{info.texte}</span>
      </div>
      <div className="dv-barre" role="progressbar" aria-valuemin={0} aria-valuemax={etapes.length} aria-valuenow={faites.length} aria-label="Avancement du devoir">
        <i style={{ width: `${Math.max(frac * 100, faites.length ? 6 : 0)}%`, background: a.termine ? '#3a8a5a' : ACCENT }} /></div>
      <div style={{ fontSize: 13, color: '#475569', margin: '4px 0 8px' }}>
        {a.termine ? 'Devoir terminé, bravo !' : <>Étape <b>{Math.min(faites.length + 1, etapes.length)}</b> sur {etapes.length}</>}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visibles.map(e => (
          <div key={e.cle + e.type} data-etape-courante style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14.5, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '10px 12px' }}>
            <span aria-hidden="true" style={{ fontSize: 20 }}>{e.type === 'guide' ? '🧭' : e.type === 'defi' ? '🎯' : '✏️'}</span>
            <span style={{ flex: 1, color: '#1e293b' }}>{libelle(e)}</span>
            <button className="dv-btn" onClick={() => aller(e)}>{e.type === 'guide' ? (e.guideS > 0 ? 'Continuer ▶' : 'Commencer ▶') : 'Y aller ▶'}</button>
          </div>))}
        {verrouillees > 0 && <div data-etapes-verrouillees style={{ fontSize: 13.5, color: '#64748b', padding: '2px 4px' }}><Pic n="lock"/>{verrouillees} étape{verrouillees > 1 ? 's' : ''} à débloquer, une fois celle-ci faite.</div>}
      </div>
    </div>);
}

// devoirsApercu : liste fictive (aperçu élève du professeur) : rien n'est lu sur le serveur.
// Les devoirs de l'élève (null pendant le chargement) ; devoirsApercu : liste fictive, rien n'est lu sur le serveur
export function useDevoirs(devoirsApercu) {
  const [devoirs, setDevoirs] = useState(devoirsApercu ?? null);
  useEffect(() => {
    if (devoirsApercu) return undefined;
    let vivant = true;
    rest('devoirs?select=id,titre,cles,echeance,cree_le&order=cree_le.desc')
      .then(d => { if (vivant) setDevoirs(Array.isArray(d) ? d : []); })
      .catch(() => { if (vivant) setDevoirs([]); });          // SQL pas encore appliqué, réseau coupé… : on n'affiche rien
    return () => { vivant = false; };
  }, [devoirsApercu]);
  return devoirs;
}

// devoirsListe : devoirs déjà chargés par le parent (sinon la liste est lue ici) ; pasAPas : affichage par étapes (profil par étapes)
export function DevoirsEleve({ lignes, naviguer, devoirsApercu, devoirsListe, pasAPas = false, max = Infinity }) {
  const lus = useDevoirs(devoirsListe ? [] : devoirsApercu);
  const devoirs = devoirsListe ?? lus;
  const Carte = pasAPas ? CarteDevoirPasAPas : CarteDevoir;
  const par = useMemo(() => new Map(catalogueDevoirs().map(i => [i.cle, i])), []);
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
        .dv-btn { cursor: pointer; font: inherit; font-size: 13px; font-weight: 800; color: #fff; border: none; border-radius: 10px; padding: 6px 12px; background: ${ACCENT}; }
        @media (prefers-reduced-motion: reduce) { .dv *, .dv *::before, .dv *::after { transition: none !important; } }
      `}</style>
      {ouverts.length > 0 && <h3><Pic n="pin"/>{pasAPas ? 'Ma classe : à faire' : 'À faire pour la classe'} <small>{ouverts.length} devoir{ouverts.length > 1 ? 's' : ''} de ton professeur</small></h3>}
      {ouverts.slice(0, max).map(({ d, a }) => <Carte key={d.id} d={d} a={a} par={par} naviguer={naviguer} maintenant={maintenant} lignes={lignes} />)}
      {ouverts.length > max && (
        <details data-autres-devoirs style={{ marginBottom: 8 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#334155', fontSize: 14.5 }}>Voir les {ouverts.length - max} autre{ouverts.length - max > 1 ? 's' : ''} devoir{ouverts.length - max > 1 ? 's' : ''}</summary>
          <div style={{ marginTop: 8 }}>{ouverts.slice(max).map(({ d, a }) => <Carte key={d.id} d={d} a={a} par={par} naviguer={naviguer} maintenant={maintenant} lignes={lignes} />)}</div>
        </details>)}
      {finis.length > 0 && (
        <details style={{ marginBottom: 6 }} open={ouverts.length === 0}>
          <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#166534', fontSize: 14.5 }}><Pic n="ok"/>Devoirs terminés ({finis.length})</summary>
          <div style={{ marginTop: 8 }}>{finis.map(({ d, a }) => <Carte key={d.id} d={d} a={a} par={par} naviguer={naviguer} maintenant={maintenant} lignes={lignes} />)}</div>
        </details>)}
    </section>);
}
