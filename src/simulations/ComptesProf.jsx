import { useState, useEffect, useCallback } from "react";
import { KIT, styleBouton, styleBoite } from "../commun";
import { fonctionComptes, rest, lireCapture, supprimerCapture } from "../serveur";
import { Pic } from "../Pictos";

const champ = { padding: '7px 9px', fontSize: 14, borderRadius: 8, border: `1px solid ${KIT.bord}`, boxSizing: 'border-box' };

const ROLES = [
  ['invite', 'Invité', 'Voit les classes qu’on lui partage, donne des devoirs, règle le chapitre en cours. Ne crée ni classe ni compte élève.'],
  ['prof', 'Professeur', 'Comme un invité, et peut en plus créer ses propres classes et ses comptes élèves.'],
  ['admin', 'Administrateur', 'Tout, y compris gérer les comptes professeur (comme vous).'],
];
const jours = d => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
const libelleActivite = a => {
  if (!a) return '';
  const cl = `${a.nb_classes} classe${a.nb_classes > 1 ? 's' : ''} · ${a.nb_eleves} élève${a.nb_eleves > 1 ? 's' : ''}`;
  if (!a.derniere_connexion) return `Jamais connecté·e · ${cl}`;
  const j = jours(a.derniere_connexion), d = new Date(a.derniere_connexion);
  const quand = j <= 0 ? 'aujourd’hui' : j === 1 ? 'hier' : `il y a ${j} jours`;
  return `Dernière connexion : ${quand} (${d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}) · ${cl}`;
};
const roleDe = p => (p.admin ? 'admin' : p.invite ? 'invite' : 'prof');
const nomRole = r => (ROLES.find(x => x[0] === r) || [])[1] || r;

// Gestion des comptes professeur, réservée à l'administrateur (supabase/10-administrateur.sql et 16-profs-invites.sql, actions de la fonction « comptes »).
// Créer, changer le rôle, nouveau mot de passe, supprimer. Un mot de passe n'est affiché qu'une fois : l'administrateur le transmet lui-même (aucun email n'est envoyé).
export function ComptesProf({ occupe, proteger, setMsg }) {
  const [ouvert, setOuvert] = useState(false), [profs, setProfs] = useState(null);
  const [email, setEmail] = useState(''), [nom, setNom] = useState(''), [role, setRole] = useState('invite'), [energy, setEnergy] = useState(false);
  const [cree, setCree] = useState(null), [copie, setCopie] = useState(false);
  const charger = useCallback(async () => {
    const r = await fonctionComptes('lister_profs');
    // activité (supabase/20-activite-profs.sql) : facultative, sans ce script la liste s'affiche comme avant
    let act = [];
    try { act = await rest('rpc/profs_activite', { method: 'POST', corps: {} }); } catch { /* script pas encore exécuté */ }
    const parEmail = new Map(act.map(a => [String(a.email || '').toLowerCase(), a]));
    setProfs((r.profs || []).map(p => ({ ...p, activite: parEmail.get(String(p.email || '').toLowerCase()) || null })));
  }, []);
  useEffect(() => { if (ouvert && !profs) proteger(charger); }, [ouvert, profs, proteger, charger]);

  const montrer = (r, texte) => { setCree(r); setCopie(false); setMsg(texte); };

  const creer = e => {
    e.preventDefault();
    proteger(async () => {
      const r = await fonctionComptes('creer_prof', { email, nom, invite: role === 'invite', energy });
      if (role === 'admin') await fonctionComptes('changer_role', { email: r.email, role: 'admin' });
      montrer(r, `Compte créé pour ${r.nom}. Notez le mot de passe ci-dessous : il ne sera plus affiché.`);
      setEmail(''); setNom(''); setEnergy(false); await charger();
    });
  };
  const changerRole = (p, nouveau) => {
    if (nouveau === roleDe(p)) return;
    const avertissement = nouveau === 'admin' ? `Donner à ${p.nom} tous les droits d’administrateur, y compris créer ou supprimer des comptes professeur ?` : `Passer ${p.nom} en « ${nomRole(nouveau)} » ?`;
    if (!window.confirm(avertissement)) return;
    proteger(async () => { await fonctionComptes('changer_role', { email: p.email, role: nouveau }); await charger(); setMsg(`${p.nom} : rôle « ${nomRole(nouveau)} ».`); });
  };
  const basculerEnergy = (p, valeur) => proteger(async () => {
    await fonctionComptes('acces_energy', { email: p.email, valeur });
    setProfs(l => l.map(x => (x.email === p.email ? { ...x, acces_energy: valeur } : x)));
    setMsg(`${p.nom} ${valeur ? 'peut maintenant utiliser aussi Energy@School' : 'utilise la Paillasse virtuelle seulement'}.`);
  });
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
        <label style={{ fontSize: 13.5, color: KIT.txt, cursor: 'pointer' }}><input type="checkbox" checked={energy} onChange={e => setEnergy(e.target.checked)} style={{ accentColor: '#ea580c' }} /> Autoriser aussi Energy@School</label>
        <button type="submit" style={styleBouton(true, '#475569')} disabled={occupe || !email.trim() || !nom.trim()}>Créer le compte</button>
      </form>
      <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 4, lineHeight: 1.5 }}>{(ROLES.find(r => r[0] === role) || [])[2]} Tout compte utilise la Paillasse virtuelle ; « Energy@School » permet en plus à ce professeur de choisir ce site pour ses classes.</div>
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
                <span style={{ flex: '1 1 220px', minWidth: 0, overflowWrap: 'anywhere' }}><b>{p.nom}</b>{soi ? ' (vous)' : ''}<br /><span style={{ color: KIT.txt2 }}>{p.email}</span>{p.activite && <><br /><span data-activite style={{ color: p.activite.derniere_connexion ? KIT.txt2 : '#b45309', fontSize: 12.5 }}>{libelleActivite(p.activite)}</span></>}</span>
                {p.admin
                  ? <span style={{ color: KIT.txt2, fontSize: 12.5 }}>Energy@School ✓</span>
                  : <label style={{ fontSize: 13, color: KIT.txt, cursor: 'pointer' }}><input type="checkbox" checked={!!p.acces_energy} disabled={occupe} onChange={e => basculerEnergy(p, e.target.checked)} style={{ accentColor: '#ea580c' }} /> Energy@School</label>}
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

const SITES = [['paillasse', 'Paillasse'], ['energy', 'Energy@School'], ['deux', 'Les deux']];

// Toutes les classes du site, réservé à l'administrateur (supabase/18-classes-admin.sql) : règle le « site » d'une classe sans qu'elle soit partagée.
// Replié par défaut, chargé à l'ouverture ; classes regroupées par professeur ; ni nom d'élève ni résultat.
export function ClassesAdmin({ occupe, proteger, setMsg, onChange }) {
  const [ouvert, setOuvert] = useState(false), [classes, setClasses] = useState(null);
  const charger = useCallback(async () => { setClasses(await rest('rpc/classes_admin', { method: 'POST', corps: {} })); }, []);
  useEffect(() => { if (ouvert && !classes) proteger(charger); }, [ouvert, classes, proteger, charger]);
  const regler = (c, site) => {
    if (site === c.site) return;
    proteger(async () => {
      await rest('rpc/definir_site_classe', { method: 'POST', corps: { c: c.id, s: site } });
      setClasses(l => l.map(x => (x.id === c.id ? { ...x, site } : x)));
      setMsg(`« ${c.nom} » (${c.prof_nom}) : ${site === 'deux' ? 'les deux sites' : site === 'energy' ? 'Energy@School' : 'Paillasse virtuelle'}.`);
      if (onChange) onChange();
    });
  };
  const parProf = (classes || []).reduce((m, c) => { (m[c.prof_nom] = m[c.prof_nom] || []).push(c); return m; }, {});
  return (
    <details data-classes-admin open={ouvert} onToggle={e => setOuvert(e.currentTarget.open)} style={{ ...styleBoite, margin: '8px 0' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700, color: KIT.txt }}>🌐 Site des classes de tous les professeurs <span style={{ fontWeight: 500, color: KIT.txt2, fontSize: 13 }}>(administrateur)</span></summary>
      {!classes && <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 8 }}>Chargement…</div>}
      {classes && !classes.length && <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 8 }}>Aucune classe pour l’instant.</div>}
      {classes && Object.entries(parProf).map(([prof, liste]) => (
        <div key={prof} style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: KIT.txt }}>{prof}</div>
          {liste.map(c => (
            <div key={c.id} data-classe-admin={c.id} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 13.5, padding: '5px 0', borderTop: `1px solid ${KIT.bord}` }}>
              <span style={{ flex: '1 1 110px', minWidth: 0, overflowWrap: 'anywhere' }}>{c.nom} <span style={{ color: KIT.txt2 }}>· {c.nb_eleves} élève{c.nb_eleves > 1 ? 's' : ''}</span></span>
              <select value={c.site} onChange={e => regler(c, e.target.value)} disabled={occupe} style={{ ...champ, flex: '0 0 auto', padding: '4px 6px', fontSize: 13 }} aria-label={`Site de la classe ${c.nom}`}>
                {SITES.map(([id, libelle]) => <option key={id} value={id}>{libelle}</option>)}
              </select>
            </div>))}
        </div>))}
    </details>);
}

// Signalements envoyés par le bouton « Un problème ? » (supabase/21-signalements.sql), réservés à l'administrateur.
const MOTIFS_LIB = { reponse: 'Réponse fausse ?', enonce: 'Énoncé peu clair', bug: 'Bug / affichage', texte: 'Texte ou schéma', autre: 'Autre' };
const STATUTS = [['nouveau', 'Nouveau'], ['en_cours', 'En cours'], ['corrige', 'Corrigé'], ['classe', 'Classé sans suite']];
function CaptureSignalement({ chemin }) {
  const [url, setUrl] = useState(''), [err, setErr] = useState(false);
  useEffect(() => {
    let vivant = true, u = '';
    lireCapture(chemin).then(b => { if (vivant) { u = URL.createObjectURL(b); setUrl(u); } }).catch(() => { if (vivant) setErr(true); });
    return () => { vivant = false; if (u) URL.revokeObjectURL(u); };
  }, [chemin]);
  if (err) return <div style={{ fontSize: 12.5, color: KIT.txt2 }}>Capture introuvable (déjà supprimée ?).</div>;
  if (!url) return <div style={{ fontSize: 12.5, color: KIT.txt2 }}>Chargement de la capture…</div>;
  return <a href={url} target="_blank" rel="noreferrer"><img src={url} alt="Capture jointe au signalement" style={{ maxWidth: '100%', maxHeight: 360, borderRadius: 10, border: `1px solid ${KIT.bord}`, marginTop: 4 }} /></a>;
}

export function SignalementsAdmin({ occupe, proteger, setMsg }) {
  const [ouvert, setOuvert] = useState(false), [liste, setListe] = useState(null), [tous, setTous] = useState(false);
  const charger = useCallback(async () => { setListe(await rest('signalements?select=*&order=cree_le.desc&limit=300')); }, []);
  useEffect(() => { if (ouvert && !liste) proteger(charger); }, [ouvert, liste, proteger, charger]);
  const changer = (s, statut) => proteger(async () => {
    // une fois le signalement traité, la capture n'a plus d'utilité : on la supprime (vie privée)
    const ferme = statut === 'corrige' || statut === 'classe', suppr = ferme && s.capture;
    if (suppr) { try { await supprimerCapture(s.capture); } catch { /* déjà absente */ } }
    await rest(`signalements?id=eq.${s.id}`, { method: 'PATCH', corps: suppr ? { statut, capture: null } : { statut }, entetes: { Prefer: 'return=minimal' } });
    setListe(l => l.map(x => (x.id === s.id ? { ...x, statut, ...(suppr ? { capture: null } : {}) } : x)));
    setMsg('Signalement mis à jour.');
  });
  const aTraiter = (liste || []).filter(s => s.statut === 'nouveau' || s.statut === 'en_cours');
  const vus = tous ? liste : aTraiter;
  return (
    <details data-signalements-admin open={ouvert} onToggle={e => setOuvert(e.currentTarget.open)} style={{ ...styleBoite, margin: '8px 0' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700, color: KIT.txt }}><Pic n="flag"/>Signalements des utilisateurs <span style={{ fontWeight: 500, color: KIT.txt2, fontSize: 13 }}>(administrateur){liste ? ` · ${aTraiter.length} à traiter` : ''}</span></summary>
      {!liste && <div style={{ fontSize: 13.5, color: KIT.txt2, marginTop: 8 }}>Chargement…</div>}
      {liste && (
        <label style={{ display: 'block', fontSize: 13.5, margin: '8px 0', cursor: 'pointer' }}><input type="checkbox" checked={tous} onChange={e => setTous(e.target.checked)} style={{ marginRight: 6 }} />Afficher aussi les signalements corrigés ou classés ({liste.length - aTraiter.length})</label>)}
      {liste && !vus.length && <div style={{ fontSize: 13.5, color: KIT.txt2 }}>Aucun signalement {tous ? '' : 'à traiter'} pour l’instant.</div>}
      {(vus || []).map(s => (
        <div key={s.id} data-signalement={s.id} style={{ fontSize: 13.5, padding: '8px 0', borderTop: `1px solid ${KIT.bord}`, lineHeight: 1.5 }}>
          <div><b>{MOTIFS_LIB[s.motif] || s.motif}</b> <span style={{ color: KIT.txt2 }}>· {new Date(s.cree_le).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span></div>
          <div style={{ color: KIT.txt2 }}>{[s.sim_titre && `${s.sim_titre} (sim ${s.sim_id})`, s.mode, s.etape, s.code_exo].filter(Boolean).join(' · ') || s.page}</div>
          {s.message && <div style={{ margin: '2px 0', overflowWrap: 'anywhere' }}>« {s.message} »</div>}
          {s.etat && <details style={{ margin: '3px 0' }}><summary style={{ cursor: 'pointer', fontWeight: 700 }}>État de la simulation</summary>
            <pre style={{ margin: '4px 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontFamily: 'inherit', fontSize: 12.5, background: '#f1f5f9', borderRadius: 10, padding: '6px 10px' }}>{s.etat}</pre></details>}
          {s.capture && <CaptureSignalement chemin={s.capture} />}
          <div style={{ fontSize: 12, color: KIT.txt2, overflowWrap: 'anywhere' }}>{s.appareil}</div>
          <select value={s.statut} onChange={e => changer(s, e.target.value)} disabled={occupe} aria-label="Statut du signalement" style={{ ...champ, marginTop: 4, padding: '4px 6px', fontSize: 13 }}>
            {STATUTS.map(([id, l]) => <option key={id} value={id}>{l}</option>)}
          </select>
        </div>))}
    </details>);
}
