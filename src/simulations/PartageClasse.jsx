import { useState, useEffect, useCallback } from "react";
import { KIT, styleBouton, styleBoite } from "../commun";
import { rest, fonctionComptes } from "../serveur";

const champ = { padding: '7px 9px', fontSize: 14, borderRadius: 8, border: `1px solid ${KIT.bord}`, boxSizing: 'border-box' };

// Professeurs d'une classe : le propriétaire peut la partager avec un collègue (qui a déjà un compte professeur) ;
// un co-professeur voit la classe, assigne des devoirs et réinitialise des mots de passe, mais ne peut ni la supprimer,
// ni supprimer un élève, ni la renommer, ni la partager. Il peut la quitter. (supabase/09-partage-classe.sql)
export function PartageClasse({ classe, proprio, occupe, proteger, onQuitte, setMsg }) {
  const [profs, setProfs] = useState(null), [dispo, setDispo] = useState(true), [email, setEmail] = useState('');
  const charger = useCallback(async () => {
    try { setProfs(await rest('rpc/profs_classe', { method: 'POST', corps: { c: classe.id } })); setDispo(true); }
    catch { setDispo(false); }                       // supabase/09-partage-classe.sql pas encore appliqué
  }, [classe.id]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setProfs(null); charger(); }, [charger]);

  if (!dispo) return (
    <div style={{ ...styleBoite, margin: '6px 0 8px', fontSize: 13.5 }}>
      👥 <b>Partager la classe avec un collègue</b> : disponible après avoir exécuté <code>supabase/09-partage-classe.sql</code> dans Supabase (SQL Editor → Run).
    </div>);

  const partager = e => {
    e.preventDefault();
    proteger(async () => { await fonctionComptes('partager', { classe_id: classe.id, email }); setEmail(''); await charger(); setMsg('Classe partagée : votre collègue la voit dans son suivi.'); });
  };
  const retirer = p => {
    if (!window.confirm(`Retirer ${p.nom} de la classe « ${classe.nom} » ? Il ou elle ne la verra plus (les élèves et leurs données ne changent pas).`)) return;
    proteger(async () => { await fonctionComptes('retirer_prof', { classe_id: classe.id, prof_id: p.prof_id }); await charger(); setMsg(`${p.nom} n’a plus accès à la classe.`); });
  };
  const quitter = () => {
    if (!window.confirm(`Quitter la classe « ${classe.nom} » ? Vous ne la verrez plus ; le propriétaire pourra la partager de nouveau.`)) return;
    proteger(async () => { await fonctionComptes('quitter_classe', { classe_id: classe.id }); await onQuitte(); setMsg('Vous avez quitté la classe.'); });
  };

  return (
    <div style={{ ...styleBoite, margin: '6px 0 8px', fontSize: 13.5 }} data-partage>
      <div style={{ fontWeight: 700, color: KIT.txt, marginBottom: 4 }}>👥 Professeurs de la classe</div>
      {!profs && <span style={{ color: KIT.txt2 }}>Chargement…</span>}
      {profs && <ul style={{ margin: '0 0 6px', paddingLeft: 18, lineHeight: 1.7 }}>
        {profs.map(p => <li key={p.prof_id}>
          <b>{p.nom}</b>{p.moi ? ' (vous)' : ''} — {p.proprietaire ? 'propriétaire' : 'co-professeur·e'}
          {proprio && !p.proprietaire && <button onClick={() => retirer(p)} disabled={occupe} style={{ ...styleBouton(false, '#b91c1c'), marginLeft: 8, padding: '2px 8px', fontSize: 12.5 }}>Retirer</button>}
        </li>)}
      </ul>}
      {proprio ? (
        <form onSubmit={partager} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="adresse du collègue (compte professeur)" style={{ ...champ, minWidth: 260 }} aria-label="Adresse email du collègue" />
          <button type="submit" style={styleBouton(false, '#475569')} disabled={occupe || !email.trim()}>Partager la classe</button>
        </form>
      ) : (
        <button onClick={quitter} style={styleBouton(false, '#475569')} disabled={occupe}>Quitter cette classe</button>
      )}
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>
        {proprio ? <>Un co-professeur voit les élèves et leurs résultats, assigne des devoirs, règle le chapitre et la vie de classe, ajoute des comptes et réinitialise des mots de passe.
          Il ne peut <b>ni supprimer la classe ni un compte élève, ni la renommer, ni la partager</b>. Votre collègue doit déjà avoir un compte professeur sur le site.</>
          : <>Vous êtes co-professeur·e : vous ne pouvez pas supprimer la classe ni un compte élève, ni la renommer ou la partager.</>}
      </div>
    </div>);
}
