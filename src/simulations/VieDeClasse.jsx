import { useState, useEffect, useMemo } from "react";
import { rest, useSession } from "../serveur";
import { PROUESSES, MAX_PAR_ELEVE, pseudo, pseudoValide, propositions, progressionSemaine, lundiDe } from "../classe";
import { Pic } from "../Pictos";

// ═══════════════════════════════════════════════════════════════════════════
//  « MA CLASSE CETTE SEMAINE » (sous « Mon carnet »), si le professeur a activé la vie de classe :
//   • un objectif collectif (total de réussites de la classe, chacun compte pour 5 au plus) ;
//   • les prouesses de la semaine : des pseudos, sans classement ni chiffres individuels ;
//   • le choix de son pseudo (liste fixe, aucun texte libre) et la décision d'apparaître ou non.
//  Si le serveur n'a pas encore reçu supabase/05-vie-de-classe.sql, ou si la vie de classe est éteinte : rien ne s'affiche.
// ═══════════════════════════════════════════════════════════════════════════


// Lit la semaine de la classe et le pseudo de l'élève ; null si la vie de classe est éteinte ou indisponible
async function lireClasse(classeId) {
  try {
    const s = await rest('rpc/classe_semaine', { method: 'POST', corps: { c: classeId } });
    if (!s?.actif) return null;
    const m = await rest('pseudos?select=adj,nom,visible');
    return { semaine: s, moi: m[0] || null };
  } catch { return null; }           // migration non appliquée, réseau coupé… : on n'affiche rien
}

// apercu : { semaine, moi } = données fictives (aperçu élève du professeur) : rien n'est lu ni écrit sur le serveur.
export function VieDeClasse({ lignes, apercu }) {
  const sess = useSession();
  const classeId = sess?.profil?.classe_id, monId = sess?.user?.id;
  const [semaine, setSemaine] = useState(apercu?.semaine ?? null);          // null : chargement ou indisponible
  const [moi, setMoi] = useState(apercu?.moi ?? null);                  // null : pas de pseudo
  const [idees, setIdees] = useState(() => propositions(4));
  const [msg, setMsg] = useState(''), [occupe, setOccupe] = useState(false), [mont, setMont] = useState(false);
  const [version, setVersion] = useState(0);             // augmente après chaque enregistrement : relit le serveur

  useEffect(() => {
    if (apercu || !classeId) return undefined;
    let vivant = true;
    lireClasse(classeId).then(r => { if (vivant) { setSemaine(r?.semaine || null); setMoi(r?.moi || null); } });
    return () => { vivant = false; };
  }, [classeId, version, apercu]);
  useEffect(() => { if (semaine) { const t = setTimeout(() => setMont(true), 80); return () => clearTimeout(t); } return undefined; }, [semaine]);
  const recharger = () => setVersion(v => v + 1);

  const prog = useMemo(() => progressionSemaine(lignes || []), [lignes]);

  const choisir = async (adj, nom) => {
    if (apercu) { setMoi(m => ({ adj, nom, visible: m?.visible ?? false })); return; }
    setOccupe(true); setMsg('');
    try {
      if (moi) await rest(`pseudos?user_id=eq.${monId}`, { method: 'PATCH', corps: { adj, nom } });
      else await rest('pseudos', { method: 'POST', corps: { adj, nom, visible: false } });
      recharger();
    } catch (e) {
      setMsg(e.statut === 409 ? 'Ce pseudo vient d’être pris dans ta classe : choisis-en un autre.' : `Impossible d’enregistrer : ${e.message}`);
      setIdees(propositions(4));
    }
    setOccupe(false);
  };
  const montrer = async visible => {
    setMoi(m => (m ? { ...m, visible } : m));               // affichage immédiat, annulé si le serveur refuse
    if (apercu) return;
    setOccupe(true); setMsg('');
    try { await rest(`pseudos?user_id=eq.${monId}`, { method: 'PATCH', corps: { visible } }); recharger(); }
    catch (e) { setMoi(m => (m ? { ...m, visible: !visible } : m)); setMsg(`Impossible d’enregistrer : ${e.message}`); }
    setOccupe(false);
  };

  if (!semaine) return null;
  const { reussites, objectif, prouesses, effectif } = semaine;
  const frac = Math.min(1, reussites / Math.max(1, objectif)), atteint = reussites >= objectif;
  const reste = Math.max(0, objectif - reussites);
  const monPseudo = moi && pseudoValide(moi.adj, moi.nom) ? pseudo(moi.adj, moi.nom) : null;
  const lundi = lundiDe(new Date()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const parCode = new Map((prouesses || []).map(p => [p.code, p.pseudos]));
  const estMoi = (a, n) => !!moi && moi.visible && moi.adj === a && moi.nom === n;

  return (
    <section className="vc" aria-label="Ma classe cette semaine">
      <style>{`
        .vc { margin-top: 26px; }
        .vc h3 { margin: 0 0 4px; font-size: 18px; font-weight: 800; color: #0f172a; }
        .vc-repli { margin-top: 22px; }
        .vc-repli > summary { list-style: none; cursor: pointer; margin: 0 0 10px; padding: 10px 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; font-size: 17px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .vc-repli > summary::-webkit-details-marker { display: none; }
        .vc-repli > summary::after { content: '▾'; margin-left: auto; color: #64748b; transition: transform .2s; }
        .vc-repli[open] > summary::after { transform: rotate(180deg); }
        .vc-repli > summary:hover { border-color: #cbd5e1; background: #fafcfc; }
        .vc-repli > summary small { font-size: 13px; font-weight: 600; color: #64748b; }
        .vc-sous { font-size: 13px; color: #64748b; margin: 0 0 12px; }
        .vc-objectif { border-radius: 20px; padding: 18px; color: #1f3b4d; position: relative; overflow: hidden;
          background: #e3f3f0; border: 1px solid #cfe6e1; }
        .vc-piste { position: relative; height: 16px; border-radius: 10px; background: rgba(255,255,255,.8); box-shadow: inset 0 0 0 1px #d5dfe6; margin: 22px 8px 8px 0; }
        .vc-piste > i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 10px; background: #2a9d8f; transition: width 1.4s cubic-bezier(.2,.8,.2,1); }
        .vc-fusee { position: absolute; top: -17px; font-size: 26px; transition: left 1.4s cubic-bezier(.2,.8,.2,1); transform: translateX(-50%) rotate(45deg); }
        .vc-fin { position: absolute; right: -4px; top: -20px; font-size: 22px; }
        .vc-grille { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); margin-top: 12px; }
        .vc-carte { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; box-shadow: 0 2px 10px rgba(15,23,42,.05); }
        .vc-carte.or { border-color: #fbbf24; background: #fffbeb; }
        .vc-puces { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; min-height: 28px; }
        .vc-puce { display: inline-flex; align-items: center; gap: 5px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 999px; padding: 3px 10px 3px 6px; font-size: 13px; font-weight: 600; color: #1e293b; animation: vc-pop .5s both; }
        .vc-puce.moi { background: #e3f1ee; border-color: #2a9d8f; color: #134e4a; }
        .vc-mini { height: 7px; border-radius: 5px; background: #e2e8f0; overflow: hidden; margin-top: 8px; }
        .vc-mini > i { display: block; height: 100%; border-radius: 5px; background: #2a9d8f; transition: width 1.1s cubic-bezier(.2,.8,.2,1); }
        .vc-idee { cursor: pointer; font: inherit; font-size: 14px; font-weight: 700; background: #fff; border: 1.5px solid #a9d3cc; border-radius: 12px; padding: 7px 12px; color: #134e4a; display: inline-flex; gap: 6px; align-items: center; transition: transform .15s, background .15s; }
        .vc-idee:hover:not(:disabled) { background: #eef7f5; transform: translateY(-1px); }
        .vc-idee:disabled { opacity: .55; cursor: default; }
        @keyframes vc-pop { 0% { transform: scale(.4); opacity: 0; } 70% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .vc *, .vc *::before, .vc *::after { animation: none !important; transition: none !important; } }
      `}</style>

      <h3>👥 Ma classe cette semaine</h3>
      <p className="vc-sous">Depuis le lundi {lundi}. Ici, personne n’est classé : on avance ensemble.</p>

      <div className="vc-objectif">
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, opacity: .8 }}>OBJECTIF DE LA CLASSE</div>
        <div style={{ fontSize: 22, fontWeight: 800, margin: '2px 0' }}>
          {atteint ? '🎉 Objectif atteint !' : <>Encore <span style={{ color: '#b45309' }}>{reste}</span> réussite{reste > 1 ? 's' : ''} à faire ensemble</>}
        </div>
        <div className="vc-piste" role="progressbar" aria-valuemin={0} aria-valuemax={objectif} aria-valuenow={Math.min(reussites, objectif)} aria-label="Avancée de l’objectif de la classe">
          <i style={{ width: mont ? `${Math.max(3, frac * 100)}%` : '0%' }} />
          <span className="vc-fusee" aria-hidden="true" style={{ left: mont ? `${Math.max(3, frac * 100)}%` : '0%' }}>🚀</span>
          <span className="vc-fin" aria-hidden="true">{atteint ? '🏆' : '🪐'}</span>
        </div>
        <div style={{ fontSize: 14, opacity: .9 }}>
          <b>{Math.min(reussites, objectif)}</b> sur {objectif} exercices réussis par la classe ({effectif} élèves). Chacun compte pour {MAX_PAR_ELEVE} au plus :
          c’est l’effort de tous qui fait avancer la fusée.
          {prog.reussis > 0 && <> Toi, cette semaine : <b>{Math.min(prog.reussis, MAX_PAR_ELEVE)}</b> 💪</>}
        </div>
      </div>

      <details className="vc-repli" data-repli="prouesses">
      <summary><Pic n="medal"/>Les prouesses de la semaine <small>{PROUESSES.filter(p => (prog[p.code] || 0) >= p.cible).length} sur {PROUESSES.length} pour toi{monPseudo ? ` · pseudo : ${monPseudo.texte}` : ' · choisis ton pseudo'}</small></summary>
      <p className="vc-sous">Pas de podium : si tu atteins une prouesse, ton pseudo y apparaît (si tu l’as décidé ci-dessous). Tout repart à zéro chaque lundi.</p>
      <div className="vc-grille">
        {PROUESSES.map(p => {
          const liste = parCode.get(p.code) || [], mien = Math.min(p.cible, prog[p.code] || 0), fait = mien >= p.cible;
          return (
            <div key={p.code} className={`vc-carte${fait ? ' or' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 28 }} aria-hidden="true">{p.icone}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{p.titre}</div>
                  <div style={{ fontSize: 12.5, color: '#64748b' }}>{p.regle}</div>
                </div>
                {fait && <span title="Prouesse atteinte" style={{ fontSize: 20 }}>✅</span>}
              </div>
              <div className="vc-mini" role="progressbar" aria-valuemin={0} aria-valuemax={p.cible} aria-valuenow={mien} aria-label={`Ta progression : ${p.titre}`}>
                <i style={{ width: mont ? `${(mien / p.cible) * 100}%` : '0%' }} /></div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Toi : {mien} / {p.cible}</div>
              <div className="vc-puces">
                {liste.length === 0 && <span style={{ fontSize: 12.5, color: '#94a3b8' }}>Personne pour l’instant. Pourquoi pas toi ?</span>}
                {liste.map(([a, n]) => { const ps = pseudo(a, n); return (
                  <span key={`${a}-${n}`} className={`vc-puce${estMoi(a, n) ? ' moi' : ''}`}><span aria-hidden="true">{ps.icone}</span>{ps.texte}{estMoi(a, n) ? ' (toi)' : ''}</span>); })}
              </div>
            </div>);
        })}
      </div>

      <div className="vc-carte" style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>🎭 Mon pseudo</div>
        {monPseudo ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 34 }} aria-hidden="true">{monPseudo.icone}</span>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#134e4a' }}>{monPseudo.texte}</div>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, marginTop: 4, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!moi.visible} disabled={occupe} onChange={e => montrer(e.target.checked)} style={{ accentColor: '#e11d48' }} />
                Montrer mon pseudo dans les prouesses de ma classe
              </label>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 14, color: '#475569' }}>Tu n’en as pas encore. C’est facultatif : choisis-en un pour pouvoir apparaître dans les prouesses.</div>
        )}
        <div style={{ fontSize: 13, fontWeight: 700, margin: '10px 0 6px', color: '#475569' }}>{monPseudo ? 'Changer de pseudo :' : 'Choisis ton pseudo :'}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {idees.map(([a, n]) => { const ps = pseudo(a, n); return (
            <button key={`${a}-${n}`} className="vc-idee" disabled={occupe} onClick={() => choisir(a, n)}><span aria-hidden="true">{ps.icone}</span>{ps.texte}</button>); })}
          <button className="vc-idee" style={{ borderStyle: 'dashed' }} disabled={occupe} onClick={() => setIdees(propositions(4))}>🎲 Autres idées</button>
        </div>
        {msg && <div role="alert" style={{ color: '#b91c1c', fontWeight: 600, fontSize: 13.5, marginTop: 8 }}><Pic n="ko"/>{msg}</div>}
        <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 10, lineHeight: 1.45 }}>
          Seuls les élèves de ta classe voient ce pseudo (et ton professeur sait de toute façon qui tu es). Aucun nom, aucune note, aucun chiffre sur toi n’est montré à la classe.
        </div>
      </div>
      </details>
    </section>
  );
}
