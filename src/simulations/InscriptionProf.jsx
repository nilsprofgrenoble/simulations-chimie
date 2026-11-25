import { useState } from 'react';
import { styleBouton } from '../commun';
import { demanderInscriptionProf, terminerInscriptionProf, getLienAuth } from '../serveur';
import { BoutonMail } from '../contact';
import { ACCENT, TEXTE, TEXTE2, LAME } from '../theme';
import { Pic } from '../Pictos';

// Interrupteur de l'inscription libre des enseignants (adresse académique). « false » : la page ne propose que « Demander un compte » par mail.
// Ne passer à « true » qu'une fois l'envoi des mails réglé dans Supabase (voir supabase/LISEZ-MOI.md, étape 40).
export const INSCRIPTION_PROF_OUVERTE = true;
// Lien d'essai caché : ajouter « &inscription=1 » à l'adresse de la page Mon compte (…/?sim=39&inscription=1) affiche le formulaire même si l'interrupteur est fermé.
// Lu une seule fois au chargement, pour résister aux changements d'adresse du navigateur.
export const INSCRIPTION_PROF_VISIBLE = INSCRIPTION_PROF_OUVERTE
  || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('inscription') === '1');

const champ = { padding: '12px 14px', fontSize: 16, borderRadius: 14, border: '1px solid #8aa0b8', background: '#ffffff', color: TEXTE, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', marginTop: 4 };
const etiquette = { fontSize: 14, fontWeight: 700, color: TEXTE };
const titre = { margin: '0 0 6px', fontSize: 19, fontWeight: 800, color: TEXTE, fontFamily: "'Outfit', sans-serif" };

// Formulaire « Je suis enseignant·e : créer mon compte »
export function InscriptionProf() {
  const [nom, setNom] = useState(''), [email, setEmail] = useState(''), [piege, setPiege] = useState('');
  const [msg, setMsg] = useState(''), [attente, setAttente] = useState(false), [envoye, setEnvoye] = useState('');
  const valider = async e => {
    e.preventDefault(); setMsg(''); setAttente(true);
    try { await demanderInscriptionProf({ email: email.trim(), nom: nom.trim(), site_web: piege }); setEnvoye(email.trim()); }
    catch (err) { setMsg(err.message); }
    setAttente(false);
  };
  const inactif = attente || nom.trim().length < 2 || !email.includes('@');

  if (envoye) {
    return (
      <section style={LAME} aria-labelledby="titre-prof" role="status">
        <h2 id="titre-prof" style={titre}><Pic n="mail"/>Vérifiez votre messagerie</h2>
        <p style={{ margin: '0 0 8px', fontSize: 14.5, color: TEXTE2, lineHeight: 1.6 }}>
          Si l’adresse <b>{envoye}</b> est correcte, un mail vient de vous être envoyé. Cliquez sur le lien qu’il contient pour choisir votre mot de passe : vous serez alors connecté·e.
        </p>
        <p style={{ margin: 0, fontSize: 13.5, color: TEXTE2, lineHeight: 1.6 }}>
          Rien après quelques minutes ? Regardez les courriers indésirables. Le lien ne sert qu’une fois et expire au bout d’un moment : en cas de souci, refaites simplement la demande.
        </p>
      </section>
    );
  }
  return (
    <section style={LAME} aria-labelledby="titre-prof">
      <h2 id="titre-prof" style={titre}><Pic n="board"/>Vous êtes enseignant·e ?</h2>
      <p style={{ margin: '0 0 12px', fontSize: 14.5, color: TEXTE2, lineHeight: 1.6 }}>
        Créez gratuitement votre compte avec votre <b>adresse académique</b> (prenom.nom@ac-…fr) : classes, comptes élèves, devoirs et suivi de la progression.
        Vous recevez un mail avec un lien pour choisir votre mot de passe. Déjà inscrit·e et mot de passe oublié ? Utilisez le même formulaire.
      </p>
      <form onSubmit={valider} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 460 }}>
        <label style={etiquette}>Prénom et nom
          <input value={nom} onChange={e => setNom(e.target.value)} autoComplete="name" maxLength={60} style={champ} />
        </label>
        <label style={etiquette}>Adresse académique
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="prenom.nom@ac-grenoble.fr" style={champ} />
        </label>
        {/* Piège à robots : invisible et hors du parcours au clavier ; une vraie personne ne le remplit jamais */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
          <label>Ne pas remplir<input tabIndex={-1} autoComplete="off" value={piege} onChange={e => setPiege(e.target.value)} /></label>
        </div>
        {msg && <div role="alert" style={{ color: '#b91c1c', fontSize: 14, fontWeight: 700 }}><Pic n="ko"/>{msg}</div>}
        <button type="submit" disabled={inactif} style={{ ...styleBouton(!inactif, ACCENT), alignSelf: 'flex-start', opacity: inactif ? 0.6 : 1, cursor: inactif ? 'default' : 'pointer' }}>
          {attente ? 'Envoi…' : 'Recevoir mon lien de connexion'}
        </button>
      </form>
      <p style={{ margin: '14px 0 0', fontSize: 13, color: TEXTE2, lineHeight: 1.6 }}>
        Votre adresse ne sert qu’à créer votre compte et à vous connecter ; elle n’est visible que de l’administrateur du site. Les comptes élèves, eux, ne contiennent ni nom ni adresse.
        Pas d’adresse académique (enseignement agricole, établissement à l’étranger, IUT…) ?{' '}
        <BoutonMail libelle="Écrivez-moi" sujet="Demande de compte enseignant — Paillasse virtuelle" couleur={ACCENT}
          corps={'Bonjour,\n\nJe suis enseignant·e (établissement : …, discipline : …) et je souhaite un compte pour moi et mes classes.\n\nMerci !'} />
      </p>
    </section>
  );
}

// Page d'arrivée depuis le lien du mail : choix du mot de passe
export function BienvenueProf() {
  const lien = getLienAuth();
  const [a, setA] = useState(''), [b, setB] = useState(''), [msg, setMsg] = useState(''), [attente, setAttente] = useState(false);
  if (!lien) return null;
  if (lien.erreur) {
    return (
      <section style={{ ...LAME, marginBottom: 20 }} aria-labelledby="titre-lien" role="alert">
        <h2 id="titre-lien" style={titre}><Pic n="ko"/>Lien non valable</h2>
        <p style={{ margin: 0, fontSize: 14.5, color: TEXTE2, lineHeight: 1.6 }}>{lien.erreur}</p>
      </section>
    );
  }
  const envoyer = async e => {
    e.preventDefault(); setMsg('');
    if (a.length < 8) return setMsg('Au moins 8 caractères.');
    if (a !== b) return setMsg('Les deux saisies sont différentes.');
    setAttente(true);
    try { await terminerInscriptionProf(a); } catch (err) { setMsg(err.message); }
    setAttente(false);
  };
  const nouveau = lien.type === 'recovery';
  return (
    <section style={{ ...LAME, marginBottom: 20 }} aria-labelledby="titre-lien">
      <h2 id="titre-lien" style={titre}><Pic n="key"/>{nouveau ? 'Choisissez un nouveau mot de passe' : 'Bienvenue ! Choisissez votre mot de passe'}</h2>
      <p style={{ margin: '0 0 12px', fontSize: 14.5, color: TEXTE2, lineHeight: 1.6 }}>
        Votre adresse est confirmée. Il vous reste à choisir un mot de passe (8 caractères minimum) : vous serez connecté·e juste après. Pour vous reconnecter plus tard, utilisez votre adresse académique et ce mot de passe.
      </p>
      <form onSubmit={envoyer} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 460 }}>
        <label style={etiquette}>Mot de passe
          <input type="password" value={a} onChange={e => setA(e.target.value)} autoComplete="new-password" style={champ} autoFocus />
        </label>
        <label style={etiquette}>Même mot de passe, encore une fois
          <input type="password" value={b} onChange={e => setB(e.target.value)} autoComplete="new-password" style={champ} />
        </label>
        {msg && <div role="alert" style={{ color: '#b91c1c', fontSize: 14, fontWeight: 700 }}><Pic n="ko"/>{msg}</div>}
        <button type="submit" disabled={attente || !a || !b} style={{ ...styleBouton(true, ACCENT), alignSelf: 'flex-start' }}>{attente ? 'Enregistrement…' : 'Enregistrer et me connecter'}</button>
      </form>
    </section>
  );
}
