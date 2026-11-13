import { useState, useEffect, useCallback } from "react";
import { KIT, styleBouton, styleBoite } from "../commun";
import { fonctionComptes } from "../serveur";

const champ = { padding: '7px 9px', fontSize: 14, borderRadius: 8, border: `1px solid ${KIT.bord}`, boxSizing: 'border-box' };

const ROLES = [
  ['invite', 'Invité', 'Voit les classes qu’on lui partage, donne des devoirs, règle le chapitre en cours. Ne crée ni classe ni compte élève.'],
  ['prof', 'Professeur', 'Comme un invité, et peut en plus créer ses propres classes et ses comptes élèves.'],
  ['admin', 'Administrateur', 'Tout, y compris gérer les comptes professeur (comme vous).'],
];
const roleDe = p => (p.admin ? 'admin' : p.invite ? 'invite' : 'prof');
const nomRole = r => (ROLES.find(x => x[0] === r) || [])[1] || r;

// Gestion des comptes professeur, réservée à l'administrateur (supabase/10-administrateur.sql et 16-profs-invites.sql, actions de la fonction « comptes »).
// Créer, changer le rôle, nouveau mot de passe, supprimer. Un mot de passe n'est affiché qu'une fois : l'administrateur le transmet lui-même (aucun email n'est envoyé).
export function ComptesProf({ occupe, proteger, setMsg }) {
  const [ouvert, setOuvert] = useState(false), [profs, setProfs] = useState(null);
  const [email, setEmail] = useState(''), [nom, setNom] = useState(''), [role, setRole] = useState('invite');
  const [cree, setCree] = useState(null), [copie, setCopie] = useState(false);
  const charger = useCallback(async () => { const r = await fonctionComptes('lister_profs'); setProfs(r.profs || []); }, []);
  useEffect(() => { if (ouvert && !profs) proteger(charger); }, [ouvert, profs, proteger, charger]);

  const montrer = (r, texte) => { setCree(r); setCopie(false); setMsg(texte); };

  const creer = e => {
    e.preventDefault();
    proteger(async () => {
      const r = await fonctionComptes('creer_prof', { email, nom, invite: role === 'invite' });
      if (role === 'admin') await fonctionComptes('changer_role', { email: r.email, role: 'admin' });
      montrer(r, `Compte créé pour ${r.nom}. Notez le mot de passe ci-dessous : il ne sera plus affiché.`);
      setEmail(''); setNom(''); await charger();
    });
  };
  const changerRole = (p, nouveau) => {
    if (nouveau === roleDe(p)) return;
    const avertissement = nouveau === 'admin' ? `Donner à ${p.nom} tous les droits d’administrateur, y compris créer ou supprimer des comptes professeur ?` : `Passer ${p.nom} en « ${nomRole(nouveau)} » ?`;
    if (!window.confirm(avertissement)) return;
    proteger(async () => { await fonctionComptes('changer_role', { email: p.email, role: nouveau }); await charger(); setMsg(`${p.nom} : rôle « ${nomRole(nouveau)} ».`); });
  };
  const nouveauMotDePasse = p => {
    if (!window.confirm(`Générer un nouveau mot de passe pour ${p.nom} ? L’ancien ne fonctionnera plus.`)) return;
    proteger(async () => { const r = await fonctionComptes('reinitialiser_prof', { email: p.email }); montrer({ ...r, nom: p.nom }, `Nouveau mot de passe pour ${p.nom}. Notez-le : il ne sera plus affiché.`); });
  };
  const supprimer = p => {
    if (!window.confirm(`Supprimer le compte de ${p.nom} (${p.email}) ? Cette action est définitive.`)) return;
    proteger(async () => {
      try {
        await fonctionComptes('supprimer_prof', { email: p.email });
      } catch (err) {
        // Le professeur possède des classes : on demande une seconde confirmation, plus explicite
        if (!/possède \d+ classe/.test(String(err?.message || ''))) throw err;
        if (!window.confirm(`${err.message}\n\nSupprimer quand même le compte ET ses classes avec tous les comptes élèves ? Cette action est définitive.`)) return;
        await fonctionComptes('supprimer_prof', { email: p.email, forcer: true });
      }
      await charger(); setMsg(`Compte de ${p.nom} supprimé.`);
    });
  };
  const copier = async () => {
    try { await navigator.clipboard.writeText(`Paillasse virtuelle — identifiant : ${cree.email} — mot de passe : ${cree.mot_de_passe}`); setCopie(true); } catch { setCopie(false); }
  };

  return (
    <details data-comptes-prof open={ouvert} onToggle={e => setOuvert(e.currentTarget.open)} style={{ ...styleBoite, margin: '8px 0' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700, color: KIT.txt }}>👩‍🏫 Gérer les professeurs <span style={{ fontWeight: 500, color: KIT.txt2, fontSize: 13 }}>(administrateur)</span></summary>
      <form onSubmit={creer} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="adresse du collègue" style={{ ...champ, minWidth: 240 }} aria-label="Adresse email du nouveau professeur" />
        <input value={nom} onChange={e => setNom(e.target.value)} placeholder="nom affiché (ex. Marie Dupont)" style={{ ...champ, minWidth: 220 }} aria-label="Nom du nouveau professeur" maxLength={60} />
        <select value={role} onChange={e => setRole(e.target.value)} style={champ} aria-label="Rôle du nouveau compte">
          {ROLES.map(([id, libelle]) => <option key={id} value={id}>{libelle}</option>)}
        </select>
        <button type="submit" style={styleBouton(true, '#475569')} disabled={occupe || !email.trim() || !nom.trim()}>Créer le compte</button>
      </form>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>{(ROLES.find(r => r[0] === role) || [])[2]}</div>
      {cree && (
        <div role="status" style={{ ...styleBoite, background: '#fffbeb', border: '2px solid #f59e0b', margin: '8px 0', fontSize: 14, color: KIT.txt }}>
          <div><b>{cree.nom}</b> peut se connecter avec :</div>
          <div style={{ fontFamily: 'monospace', margin: '4px 0' }}>identifiant : {cree.email}<br />mot de passe : <b>{cree.mot_de_passe}</b></div>
          <button type="button" onClick={copier} style={styleBouton(false, '#475569')}>{copie ? 'Copié ✓' : 'Copier'}</button>
          <div style={{ fontSize: 12.5, color: '#92400e', marginTop: 6 }}>Ce mot de passe n’est affiché qu’<b>une seule fois</b>. Transmettez-le par un moyen sûr ; il pourra le changer dans « Changer mon mot de passe ».</div>
        </div>)}
      {profs && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {profs.map(p => {
            const soi = !!p.moi;
            return (
              <div key={p.email} data-prof={p.email} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 13.5, padding: '6px 0', borderTop: `1px solid ${KIT.bord}` }}>
                <span style={{ flex: '1 1 220px', minWidth: 0, overflowWrap: 'anywhere' }}><b>{p.nom}</b>{soi ? ' (vous)' : ''}<br /><span style={{ color: KIT.txt2 }}>{p.email}</span></span>
                {soi
                  ? <span style={{ color: KIT.txt2 }}>{nomRole(roleDe(p))}</span>
                  : <>
                      <select value={roleDe(p)} onChange={e => changerRole(p, e.target.value)} disabled={occupe} style={champ} aria-label={`Rôle de ${p.nom}`}>
                        {ROLES.map(([id, libelle]) => <option key={id} value={id}>{libelle}</option>)}
                      </select>
                      <button type="button" onClick={() => nouveauMotDePasse(p)} disabled={occupe} style={{ ...styleBouton(false, '#475569'), fontSize: 13 }}>🔑 Nouveau mot de passe</button>
                      <button type="button" onClick={() => supprimer(p)} disabled={occupe || p.admin} title={p.admin ? 'Retirez d’abord le rôle d’administrateur' : ''} style={{ ...styleBouton(false, '#b91c1c'), fontSize: 13 }}>Supprimer</button>
                    </>}
              </div>);
          })}
        </div>)}
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 8, lineHeight: 1.5 }}>Un professeur voit uniquement ses propres classes ; partagez-lui ensuite une classe (« Gérer la classe »). Supprimer un professeur qui possède des classes supprime aussi ces classes et les comptes de leurs élèves : une confirmation supplémentaire vous sera demandée.</div>
    </details>);
}
