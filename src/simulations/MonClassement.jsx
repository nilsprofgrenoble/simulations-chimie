import { useState, useEffect } from "react";
import { rest, useSession } from "../serveur";
import { pseudo, pseudoValide, propositions } from "../classe";

// ═══════════════════════════════════════════════════════════════════════════
//  « CLASSEMENT PUBLIC » dans l'espace élève : choisir son pseudo (liste fixe, aucun texte libre) et décider d'apparaître
//  ou non dans le classement public (page n° 104). Éteint par défaut ; l'élève seul décide, et peut décocher à tout moment.
//  Cet accord est distinct de celui de la « vie de classe ». Si supabase/13-classement.sql n'est pas appliqué, rien ne s'affiche.
// ═══════════════════════════════════════════════════════════════════════════
const css = `
  .mc { margin-top: 26px; text-align: left; }
  .mc h3 { margin: 0 0 6px; font-size: 18px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px; }
  .mc-carte { background: #fff; border: 1px solid #d5dfeb; border-radius: 18px; padding: 16px 18px; color: #1e293b; font-size: 14.5px; line-height: 1.5; }
  .mc-pseudo { font-size: 19px; font-weight: 800; color: #0f172a; }
  .mc-idees { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 4px; }
  .mc-idee { border: 2px solid #cbd5e1; background: #f8fafc; border-radius: 999px; padding: 7px 14px; font: 800 14.5px inherit; font-family: inherit; cursor: pointer; color: #0f172a; }
  .mc-idee:hover:not(:disabled) { border-color: #0b4f94; background: #eff6ff; }
  .mc-case { display: flex; gap: 10px; align-items: flex-start; margin-top: 12px; padding: 12px 14px; border-radius: 14px; background: #fffbeb; border: 1px solid #fde68a; cursor: pointer; }
  .mc-case input { margin-top: 3px; width: 18px; height: 18px; accent-color: #0b4f94; flex: none; }
  .mc-lien { border: none; background: none; padding: 0; font: inherit; font-weight: 800; color: #0b4f94; text-decoration: underline; cursor: pointer; }
  .mc-msg { margin-top: 8px; font-size: 13.5px; color: #b91c1c; }
  .mc button:focus-visible, .mc input:focus-visible { outline: 3px solid #0b4f94; outline-offset: 2px; }
`;

export function MonClassement({ naviguer, apercu = false }) {
  const sess = useSession();
  const monId = sess?.user?.id;
  const [etat, setEtat] = useState(apercu ? { moi: apercu.moi ? { adj: apercu.moi.adj, nom: apercu.moi.nom, classement: false } : null, etab: 'Ton établissement', classe: 'Ta classe', exclu: false } : undefined);              // undefined : chargement · null : indisponible · { moi, etab, classe }
  const [version, setVersion] = useState(0);
  const [idees, setIdees] = useState(() => propositions(4));
  const [change, setChange] = useState(false), [occupe, setOccupe] = useState(apercu), [msg, setMsg] = useState('');

  useEffect(() => {
    if (apercu) return undefined;      // aperçu du professeur : exemple fixe, rien n'est lu ni écrit
    let vivant = true;
    (async () => {
      try {
        const [p, c] = await Promise.all([rest('pseudos?select=adj,nom,classement'), rest('classes?select=nom,etablissement')]);
        let exclu = false;
        try { exclu = !!(await rest('pseudos?select=exclu'))[0]?.exclu; } catch { /* script 14 pas encore appliqué */ }
        if (vivant) setEtat({ moi: p[0] || null, etab: (c[0]?.etablissement || '').trim(), classe: c[0]?.nom || '', exclu });
      } catch { if (vivant) setEtat(null); }      // script SQL 13 pas encore appliqué, réseau coupé… : on n'affiche rien
    })();
    return () => { vivant = false; };
  }, [version, apercu]);

  if (!etat) return null;
  const recharger = () => setVersion(v => v + 1);
  const { moi, etab, classe, exclu } = etat;
  const monPseudo = moi && pseudoValide(moi.adj, moi.nom) ? pseudo(moi.adj, moi.nom) : null;

  const choisir = async (adj, nom) => {
    setOccupe(true); setMsg('');
    try {
      if (moi) await rest(`pseudos?user_id=eq.${monId}`, { method: 'PATCH', corps: { adj, nom } });
      else await rest('pseudos', { method: 'POST', corps: { adj, nom, visible: false, classement: false } });
      setChange(false); recharger();
    } catch (e) {
      setMsg(e.statut === 409 ? 'Ce pseudo vient d’être pris dans ta classe : choisis-en un autre.' : 'Impossible d’enregistrer pour le moment. Réessaie dans un instant.');
      setIdees(propositions(4));
    }
    setOccupe(false);
  };
  const basculer = async actif => {
    setEtat(e => ({ ...e, moi: { ...e.moi, classement: actif } }));      // affichage immédiat, annulé si le serveur refuse
    setOccupe(true); setMsg('');
    try { await rest(`pseudos?user_id=eq.${monId}`, { method: 'PATCH', corps: { classement: actif } }); recharger(); }
    catch { setEtat(e => ({ ...e, moi: { ...e.moi, classement: !actif } })); setMsg('Impossible d’enregistrer pour le moment. Réessaie dans un instant.'); }
    setOccupe(false);
  };

  const choixPseudo = (
    <>
      <div>{moi ? 'Choisis un autre pseudo (tiré d’une liste, aucun texte libre) :' : 'Choisis ton pseudo (tiré d’une liste, aucun texte libre) :'}</div>
      <div className="mc-idees">
        {idees.map(([a, n]) => { const p = pseudo(a, n); return <button key={`${a}-${n}`} type="button" className="mc-idee" disabled={occupe} onClick={() => choisir(a, n)}><span aria-hidden="true">{p.icone}</span> {p.texte}</button>; })}
      </div>
      <button type="button" className="mc-lien" onClick={() => setIdees(propositions(4))}>D’autres idées</button>
      {moi && <>{' · '}<button type="button" className="mc-lien" onClick={() => setChange(false)}>Garder mon pseudo</button></>}
    </>);

  return (
    <section className="mc" data-mon-classement aria-label="Classement public">
      <style>{css}</style>
      <h3><span aria-hidden="true">🏅</span>Classement public</h3>
      <div className="mc-carte">
        {!etab ? (
          <>Ton professeur doit d’abord indiquer le nom de ton établissement pour que tu puisses apparaître dans le classement.
            {' '}<button type="button" className="mc-lien" onClick={() => naviguer(104)}>Voir le classement</button></>
        ) : !monPseudo || change ? choixPseudo : (
          <>
            <div>Ton pseudo : <span className="mc-pseudo"><span aria-hidden="true">{monPseudo.icone}</span> {monPseudo.texte}</span></div>
            <div style={{ fontSize: 13.5, color: '#475569' }}>C’est le même pseudo que dans ta classe : si tu le changes ici, il change aussi là-bas.</div>
            <label className="mc-case">
              <input type="checkbox" checked={!!moi.classement} disabled={occupe} onChange={e => basculer(e.target.checked)} />
              <span><b>Apparaître dans le classement public</b> (désactivé par défaut).<br />
                Si tu coches, <b>tout le monde sur Internet</b> verra ton pseudo, « {etab} », « {classe} » et tes scores. Ton nom n’apparaît jamais. Tu peux décocher quand tu veux.
                En cas de doute, demande à ton professeur ou à tes parents avant de cocher.</span>
            </label>
            {exclu && <div className="mc-msg" role="status">Ton professeur t’a retiré du classement : tu n’y apparais pas. Parles-en avec lui si tu penses que c’est une erreur.</div>}
            <div style={{ marginTop: 10 }}>
              <button type="button" className="mc-lien" onClick={() => naviguer(104)}>Voir le classement</button>{' · '}
              <button type="button" className="mc-lien" onClick={() => { setIdees(propositions(4)); setChange(true); }}>Changer de pseudo</button>
            </div>
          </>)}
        {apercu && <div className="mc-msg" style={{ color: '#475569' }}>Aperçu : chez un vrai élève, la case est cliquable et le pseudo se choisit dans une liste.</div>}
        {msg && <div className="mc-msg" role="alert">{msg}</div>}
      </div>
    </section>);
}
