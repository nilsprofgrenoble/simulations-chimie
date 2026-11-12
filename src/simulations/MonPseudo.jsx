import { useState, useEffect } from "react";
import { rest, useSession } from "../serveur";
import { pseudo, pseudoValide, propositions } from "../classe";
import { ChoixDomaine } from "./ChoixDomaine";

// ═══════════════════════════════════════════════════════════════════════════
//  « MON PSEUDO » (espace élève, onglet « Ma classe ») : UN SEUL endroit pour choisir son pseudo (liste fixe, aucun texte libre)
//  et décider où il apparaît : dans sa classe (vie de classe) et/ou dans le classement public. Les deux accords sont distincts,
//  éteints par défaut. Si les scripts SQL 05 / 13 ne sont pas appliqués, les lignes correspondantes ne s'affichent pas.
//  apercu : { moi } = exemple fixe (aperçu élève du professeur) : rien n'est lu ni écrit sur le serveur.
// ═══════════════════════════════════════════════════════════════════════════
const css = `
  .mp { background: #fff; border: 1px solid #d5dfeb; border-radius: 22px; padding: 22px; text-align: left; color: #1e293b; font-size: 15px; line-height: 1.5; }
  .mp h3 { margin: 0 0 4px; font: 800 22px Outfit, Inter, sans-serif; letter-spacing: -.01em; color: #0c1a2e; }
  .mp-sous { margin: 0 0 14px; color: #3d4d63; font-size: 14.5px; }
  .mp-pseudo { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
  .mp-pseudo b { font: 800 clamp(22px, 5vw, 28px) Outfit, Inter, sans-serif; color: #0c1a2e; }
  .mp-ico { width: 52px; height: 52px; border-radius: 16px; background: #f5a31a; display: grid; place-items: center; font-size: 28px; flex: none; }
  .mp-idees { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0 6px; }
  .mp-idee { border: 2px solid #cbd5e1; background: #f8fafc; border-radius: 999px; padding: 8px 15px; font: 700 15px inherit; font-family: inherit; cursor: pointer; color: #0c1a2e; }
  .mp-idee:hover:not(:disabled) { border-color: #0b4f94; background: #eff6ff; }
  .mp-idee:disabled { opacity: .55; cursor: default; }
  .mp-lien { border: none; background: none; padding: 0; font: inherit; font-weight: 800; color: #0b4f94; text-decoration: underline; cursor: pointer; }
  .mp-choix { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
  .mp-case { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: 16px; background: #f1f5f9; cursor: pointer; }
  .mp-case:has(input:checked) { background: #e0f2ef; }
  .mp-case input { margin-top: 3px; width: 20px; height: 20px; accent-color: #0b4f94; flex: none; }
  .mp-case small { display: block; color: #3d4d63; font-size: 13.5px; margin-top: 2px; }
  .mp-info { padding: 12px 16px; border-radius: 16px; background: #fffbeb; border: 1px solid #fde68a; font-size: 14px; }
  .mp-msg { margin-top: 10px; font-size: 14px; color: #b91c1c; font-weight: 600; }
  .mp button:focus-visible, .mp input:focus-visible { outline: 3px solid #0b4f94; outline-offset: 2px; }
`;

export function MonPseudo({ naviguer, apercu = false, onChange }) {
  const sess = useSession();
  const monId = sess?.user?.id, classeId = sess?.profil?.classe_id;
  const exemple = apercu ? { moi: apercu.moi ? { adj: apercu.moi.adj, nom: apercu.moi.nom, visible: !!apercu.moi.visible, classement: false } : null, etab: 'Ton établissement', classe: 'Ta classe', vie: true, exclu: false } : undefined;
  const [etat, setEtat] = useState(exemple);              // undefined : chargement · null : indisponible
  const [version, setVersion] = useState(0);
  const [domaine, setDomaine] = useState('tout'), [idees, setIdees] = useState(() => propositions(4));
  const [change, setChange] = useState(false), [occupe, setOccupe] = useState(false), [msg, setMsg] = useState('');

  useEffect(() => {
    if (apercu) return undefined;
    let vivant = true;
    (async () => {
      try {
        let p;
        try { p = await rest('pseudos?select=adj,nom,visible,classement,exclu'); }
        catch { p = await rest('pseudos?select=adj,nom,visible'); }          // scripts 13 / 14 pas encore appliqués
        let c = [];
        try { c = await rest('classes?select=nom,etablissement'); } catch { c = await rest('classes?select=nom'); }
        let vie = false;
        try { vie = !!(await rest('rpc/classe_semaine', { method: 'POST', corps: { c: classeId } }))?.actif; } catch { /* vie de classe indisponible */ }
        if (vivant) setEtat({ moi: p[0] || null, etab: (c[0]?.etablissement || '').trim(), classe: c[0]?.nom || '', vie, exclu: !!p[0]?.exclu });
      } catch { if (vivant) setEtat(null); }
    })();
    return () => { vivant = false; };
  }, [version, apercu, classeId]);

  if (!etat) return null;
  const { moi, etab, classe, vie, exclu } = etat;
  if (!vie && !etab && !apercu) return null;           // rien à décider tant que ni la vie de classe ni le classement ne sont ouverts
  const monPseudo = moi && pseudoValide(moi.adj, moi.nom) ? pseudo(moi.adj, moi.nom) : null;
  const apres = () => { setVersion(v => v + 1); onChange?.(); };

  const choisir = async (adj, nom) => {
    if (apercu) { setEtat(e => ({ ...e, moi: { adj, nom, visible: e.moi?.visible ?? false, classement: false } })); setChange(false); return; }
    setOccupe(true); setMsg('');
    try {
      if (moi) await rest(`pseudos?user_id=eq.${monId}`, { method: 'PATCH', corps: { adj, nom } });
      else await rest('pseudos', { method: 'POST', corps: { adj, nom, visible: false } });
      setChange(false); apres();
    } catch (e) {
      setMsg(e.statut === 409 ? 'Ce pseudo vient d’être pris dans ta classe : choisis-en un autre.' : 'Impossible d’enregistrer pour le moment. Réessaie dans un instant.');
      setIdees(propositions(4, Math.random, [], domaine));
    }
    setOccupe(false);
  };
  const basculer = async (champ, actif) => {
    setEtat(e => ({ ...e, moi: { ...e.moi, [champ]: actif } }));      // affichage immédiat, annulé si le serveur refuse
    if (apercu) return;
    setOccupe(true); setMsg('');
    try { await rest(`pseudos?user_id=eq.${monId}`, { method: 'PATCH', corps: { [champ]: actif } }); apres(); }
    catch { setEtat(e => ({ ...e, moi: { ...e.moi, [champ]: !actif } })); setMsg('Impossible d’enregistrer pour le moment. Réessaie dans un instant.'); }
    setOccupe(false);
  };

  const choixPseudo = (
    <>
      <p className="mp-sous" style={{ marginBottom: 6 }}>{monPseudo ? 'Choisis un autre pseudo' : 'Choisis ton pseudo'} (tiré d’une liste, aucun texte libre) :</p>
      <ChoixDomaine valeur={domaine} disabled={occupe && !apercu} onChange={d => { setDomaine(d); setIdees(propositions(4, Math.random, [], d)); }} />
      <div className="mp-idees">
        {idees.map(([a, n]) => { const p = pseudo(a, n); return <button key={`${a}-${n}`} type="button" className="mp-idee" disabled={occupe && !apercu} onClick={() => choisir(a, n)}><span aria-hidden="true">{p.icone}</span> {p.texte}</button>; })}
      </div>
      <button type="button" className="mp-lien" onClick={() => setIdees(propositions(4, Math.random, [], domaine))}>🎲 D’autres idées</button>
      {monPseudo && <>{' · '}<button type="button" className="mp-lien" onClick={() => setChange(false)}>Garder mon pseudo</button></>}
    </>);

  return (
    <section className="mp" data-mon-pseudo aria-label="Mon pseudo">
      <style>{css}</style>
      <h3>🎭 Mon pseudo</h3>
      <p className="mp-sous">Un seul pseudo, pour ta classe et pour le classement public. Ton nom n’apparaît jamais.</p>
      {!monPseudo || change ? choixPseudo : (
        <>
          <div className="mp-pseudo">
            <span className="mp-ico" aria-hidden="true">{monPseudo.icone}</span>
            <b>{monPseudo.texte}</b>
            <button type="button" className="mp-lien" onClick={() => { setIdees(propositions(4, Math.random, [], domaine)); setChange(true); }}>Changer</button>
          </div>
          <div className="mp-choix">
            {vie && (
              <label className="mp-case">
                <input type="checkbox" checked={!!moi.visible} disabled={occupe && !apercu} onChange={e => basculer('visible', e.target.checked)} />
                <span><b>Montrer mon pseudo dans ma classe</b><small>Seuls les élèves de ta classe le voient, dans les prouesses de la semaine. Désactivé par défaut.</small></span>
              </label>)}
            {etab ? (
              <label className="mp-case">
                <input type="checkbox" checked={!!moi.classement} disabled={occupe && !apercu} onChange={e => basculer('classement', e.target.checked)} />
                <span><b>Apparaître dans le classement public</b>
                  <small>Tout le monde sur Internet verra ton pseudo, « {etab} », « {classe} » et tes scores. Désactivé par défaut. Tu peux décocher quand tu veux. En cas de doute, demande à ton professeur ou à tes parents.</small></span>
              </label>) : (
              <div className="mp-info">Le classement public s’ouvrira quand ton professeur aura indiqué le nom de ton établissement.</div>)}
          </div>
          {exclu && <div className="mp-msg" role="status">Ton professeur t’a retiré du classement : tu n’y apparais pas. Parles-en avec lui si tu penses que c’est une erreur.</div>}
          {etab && <div style={{ marginTop: 12 }}><button type="button" className="mp-lien" onClick={() => naviguer(104)}>Voir le classement →</button></div>}
        </>)}
      {apercu && <div className="mp-msg" style={{ color: '#475569', fontWeight: 400 }}>Aperçu : chez un vrai élève, les cases enregistrent le choix.</div>}
      {msg && <div className="mp-msg" role="alert">{msg}</div>}
    </section>);
}
