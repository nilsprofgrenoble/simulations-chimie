import { useState, useEffect, useCallback } from "react";
import { KIT, styleBouton, styleBoite } from "../commun";
import { fonctionComptes } from "../serveur";

const champ = { padding: '7px 9px', fontSize: 14, borderRadius: 8, border: `1px solid ${KIT.bord}`, boxSizing: 'border-box' };

// Création de comptes professeur, réservée à l'administrateur (supabase/10-administrateur.sql + action « creer_prof » de la fonction « comptes »).
// Le mot de passe n'est affiché qu'une fois : l'administrateur le transmet lui-même (aucun email n'est envoyé).
export function ComptesProf({ occupe, proteger, setMsg }) {
  const [ouvert, setOuvert] = useState(false), [profs, setProfs] = useState(null);
  const [email, setEmail] = useState(''), [nom, setNom] = useState(''), [cree, setCree] = useState(null), [copie, setCopie] = useState(false);
  const charger = useCallback(async () => { const r = await fonctionComptes('lister_profs'); setProfs(r.profs || []); }, []);
  useEffect(() => { if (ouvert && !profs) proteger(charger); }, [ouvert, profs, proteger, charger]);

  const creer = e => {
    e.preventDefault();
    proteger(async () => {
      const r = await fonctionComptes('creer_prof', { email, nom });
      setCree(r); setCopie(false); setEmail(''); setNom('');
      await charger(); setMsg(`Compte professeur créé pour ${r.nom}. Notez le mot de passe ci-dessous : il ne sera plus affiché.`);
    });
  };
  const copier = async () => {
    try { await navigator.clipboard.writeText(`Paillasse virtuelle — identifiant : ${cree.email} — mot de passe : ${cree.mot_de_passe}`); setCopie(true); } catch { setCopie(false); }
  };

  return (
    <details data-comptes-prof open={ouvert} onToggle={e => setOuvert(e.currentTarget.open)} style={{ ...styleBoite, margin: '8px 0' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700, color: KIT.txt }}>👩‍🏫 Ajouter un professeur <span style={{ fontWeight: 500, color: KIT.txt2, fontSize: 13 }}>(administrateur)</span></summary>
      <form onSubmit={creer} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="adresse du collègue" style={{ ...champ, minWidth: 240 }} aria-label="Adresse email du nouveau professeur" />
        <input value={nom} onChange={e => setNom(e.target.value)} placeholder="nom affiché (ex. Marie Dupont)" style={{ ...champ, minWidth: 220 }} aria-label="Nom du nouveau professeur" maxLength={60} />
        <button type="submit" style={styleBouton(true, '#475569')} disabled={occupe || !email.trim() || !nom.trim()}>Créer le compte</button>
      </form>
      {cree && (
        <div role="status" style={{ ...styleBoite, background: '#fffbeb', border: '2px solid #f59e0b', margin: '8px 0', fontSize: 14, color: KIT.txt }}>
          <div><b>{cree.nom}</b> peut se connecter avec :</div>
          <div style={{ fontFamily: 'monospace', margin: '4px 0' }}>identifiant : {cree.email}<br />mot de passe : <b>{cree.mot_de_passe}</b></div>
          <button type="button" onClick={copier} style={styleBouton(false, '#475569')}>{copie ? 'Copié ✓' : 'Copier'}</button>
          <div style={{ fontSize: 12.5, color: '#92400e', marginTop: 6 }}>Ce mot de passe n’est affiché qu’<b>une seule fois</b>. Transmettez-le par un moyen sûr ; il pourra le changer dans « Changer mon mot de passe ».</div>
        </div>)}
      {profs && <ul style={{ margin: '8px 0 0', paddingLeft: 18, lineHeight: 1.7, fontSize: 13.5 }}>
        {profs.map(p => <li key={p.email}><b>{p.nom}</b> — {p.email}{p.admin ? ' (administrateur)' : ''}</li>)}
      </ul>}
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 6, lineHeight: 1.5 }}>Un professeur voit uniquement ses propres classes ; vous pouvez ensuite partager une classe avec lui. La suppression d’un compte professeur se fait dans Supabase.</div>
    </details>);
}
