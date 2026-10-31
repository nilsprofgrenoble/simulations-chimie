import { useState, useEffect } from "react";
import { cardStyle, KIT, styleBouton, styleBoite } from "../commun";
import { useSession, estEleve, estProf, connexion, deconnexion, toutLire, changerMotDePasse } from "../serveur";
import { tousLesExercices } from "./Entrainement";
import { estSimulation, estDefi, tempsParSimulation, MODES, etiquettesDefis } from "../suivi";
import { EspaceEleve } from "./EspaceEleve";
import { BoutonMail } from "../contact";
import { ACCENT, TEXTE, TEXTE2, LAME } from "../theme";
import { Pic, Emo } from "../Pictos";

const ROSE = '#e11d48';

export const formatDuree = s => {
  s = Math.round(s || 0);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ${String(s % 60).padStart(2, '0')} s`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;
};
export const formatDate = iso => (iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—');

// Regroupe les séances d'un même exercice : { cle → { reussi, essais, vues, duree, seances, derniere } }
export function agreger(lignes) {
  const m = new Map();
  for (const l of lignes) {
    const a = m.get(l.cle) || { cle: l.cle, reussi: false, essais: 0, vues: 0, duree: 0, seances: 0, derniere: null };
    a.reussi = a.reussi || l.reussi; a.essais += l.essais; a.vues += l.corrections_vues; a.duree += l.duree_s; a.seances += 1;
    if (!a.derniere || l.maj > a.derniere) a.derniere = l.maj;
    m.set(l.cle, a);
  }
  return m;
}
// Libellés des exercices « je m'entraîne » et des défis des simulations (« Nom de la simulation — défi »)
export const etiquettes = () => Object.fromEntries([...tousLesExercices(), ...etiquettesDefis()].map(e => [e.cle, e]));

const champ = { padding: '12px 14px', fontSize: 16, borderRadius: 14, border: 'none', background: '#ffffff', color: TEXTE, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' };

function ContactEnseignant() {
  return (
    <section style={LAME} aria-labelledby="titre-prof">
      <h2 id="titre-prof" style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 800, color: TEXTE, fontFamily: "'Outfit', sans-serif" }}><Pic n="board"/>Vous êtes enseignant·e ?</h2>
      <p style={{ margin: '0 0 12px', fontSize: 14.5, color: TEXTE2, lineHeight: 1.6 }}>
        Pour les profs : classes, devoirs et suivi de la progression. Demandez un compte enseignant, je vous répondrai rapidement.
      </p>
      <BoutonMail libelle={<><Pic n="mail"/>Demander un compte enseignant</>} sujet="Demande de compte enseignant — Paillasse virtuelle" couleur={ACCENT} plein
        corps={'Bonjour,\n\nJe suis enseignant·e (établissement : …, discipline : …) et je souhaite un compte pour moi et mes classes.\n\nMerci !'} />
    </section>
  );
}

function Connexion() {
  // Les fiches imprimées ont un QR code qui ouvre cette page avec l'identifiant déjà rempli (?id=…) : il ne reste que le mot de passe
  const idUrl = (() => { try { const v = new URLSearchParams(window.location.search).get('id') || ''; return /^[A-Za-z0-9._@-]{1,64}$/.test(v) ? v : ''; } catch { return ''; } })();
  const [id, setId] = useState(idUrl), [mdp, setMdp] = useState(''), [garder, setGarder] = useState(false);
  const [msg, setMsg] = useState(''), [attente, setAttente] = useState(false);
  const valider = async e => {
    e.preventDefault(); setMsg(''); setAttente(true);
    try { await connexion(id, mdp, garder); } catch (err) { setMsg(err.message); }
    setAttente(false);
  };
  const inactif = attente || !id.trim() || !mdp;
  return (
    <div data-connexion style={{ display: 'flex', flexDirection: 'column', gap: 20, textAlign: 'left' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <section style={{ background: '#0b4f94', borderRadius: 28, padding: 26, textAlign: 'left' }} aria-labelledby="titre-connexion">
          <h2 id="titre-connexion" style={{ margin: '0 0 14px', fontSize: 26, fontWeight: 800, color: '#ffffff', fontFamily: "'Outfit', sans-serif" }}>Me connecter</h2>
          <form onSubmit={valider} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Identifiant <span style={{ fontWeight: 500, color: '#d3e3f6' }}>(donné par ton professeur)</span>
              <input value={id} onChange={e => setId(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="tstl1-07" autoFocus={!idUrl} style={{ ...champ, marginTop: 4 }} aria-label="Identifiant" />
            </label>
            <label style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Mot de passe
              <input type="password" value={mdp} onChange={e => setMdp(e.target.value)} autoComplete="current-password" autoFocus={!!idUrl} style={{ ...champ, marginTop: 4 }} aria-label="Mot de passe" />
            </label>
            <label style={{ fontSize: 13, color: '#d3e3f6', display: 'flex', gap: 8, alignItems: 'flex-start', lineHeight: 1.5 }}>
              <input type="checkbox" checked={garder} onChange={e => setGarder(e.target.checked)} style={{ marginTop: 3, accentColor: '#f5a31a' }} />
              <span>Rester connecté sur cet appareil <b>(appareil personnel uniquement, jamais sur un ordinateur partagé du lycée)</b></span>
            </label>
            {msg && <div role="alert" style={{ color: '#ffd9d9', fontSize: 14, fontWeight: 700 }}><Pic n="ko"/>{msg}</div>}
            <div style={{ fontSize: 13, color: '#d3e3f6' }}>Mot de passe oublié ? Demande à ton professeur : il peut t’en donner un nouveau en quelques secondes.</div>
            <button type="submit" disabled={inactif} style={{ padding: '14px 22px', borderRadius: 14, border: 'none', fontWeight: 800, fontSize: 16, fontFamily: 'inherit', color: inactif ? '#e3edf8' : '#3a2500',
              background: inactif ? '#5f88b5' : '#f5a31a', cursor: inactif ? 'default' : 'pointer' }}>{attente ? 'Connexion…' : 'Me connecter'}</button>
          </form>
        </section>

        <section style={LAME} aria-labelledby="titre-pourquoi">
          <h2 id="titre-pourquoi" style={{ margin: '0 0 6px', fontSize: 21, fontWeight: 800, color: TEXTE, fontFamily: "'Outfit', sans-serif" }}>Gardez la trace de tout ce que vous réussissez</h2>
          <p style={{ margin: '0 0 10px', fontSize: 14.5, color: TEXTE2, lineHeight: 1.6 }}>
            Avec un compte, ta progression te suit d’un ordinateur à l’autre (chez toi, au lycée). Tu n’as pas besoin de compte pour t’entraîner :
            sans compte, elle reste seulement sur l’appareil que tu utilises.
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14.5, color: TEXTE }}>
            <li><span aria-hidden="true"><Pic n="star"/></span> <b>Des étoiles à gagner</b> : jusqu’à 3 par exercice</li>
            <li><span aria-hidden="true"><Pic n="tree"/></span> <b>Des paliers par compétence</b> : de Découverte à Expert·e</li>
            <li><span aria-hidden="true"><Pic n="medal"/></span> <b>Des niveaux et des badges</b> : de Novice à Légende de la paillasse</li>
          </ul>
        </section>
      </div>

      <ContactEnseignant />

      <section style={{ ...LAME, fontSize: 13, color: TEXTE2, lineHeight: 1.65 }} aria-labelledby="titre-donnees">
        <h2 id="titre-donnees" style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: TEXTE, fontFamily: "'Outfit', sans-serif" }}>Ce qui est enregistré quand tu es connecté·e</h2>
        Pour chaque exercice : la date, le temps passé actif sur la page, le nombre de fois où tu as cliqué sur « Corriger », le nombre de corrections consultées et si tu as réussi.
        Pour les défis des simulations : la même chose (essais = clics sur « Vérifier », solutions consultées, réussite). Sur le reste des simulations : seulement le temps passé, par simulation et par mode (parcours guidé, exploration libre, défi). Rien d’autre : ni ton nom, ni ton adresse, ni ce que tu écris dans les réponses.
        Ces données sont visibles de toi et de ton professeur, servent à t’aider à progresser, ne sont pas notées, et sont supprimées à la fin de l’année scolaire.
      </section>
    </div>
  );
}

export function MotDePasse() {
  const [ouvert, setOuvert] = useState(false), [a, setA] = useState(''), [b, setB] = useState(''), [msg, setMsg] = useState(null);
  const envoyer = async e => {
    e.preventDefault(); setMsg(null);
    if (a.length < 8) return setMsg({ ok: false, t: 'Au moins 8 caractères.' });
    if (a !== b) return setMsg({ ok: false, t: 'Les deux saisies sont différentes.' });
    try { await changerMotDePasse(a); setMsg({ ok: true, t: 'Mot de passe modifié.' }); setA(''); setB(''); } catch (err) { setMsg({ ok: false, t: err.message }); }
  };
  if (!ouvert) return <button onClick={() => setOuvert(true)} style={{ ...styleBouton(false, '#475569'), fontSize: 13 }}><Pic n="key"/>Changer mon mot de passe</button>;
  return (
    <form onSubmit={envoyer} style={{ ...styleBoite, maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input type="password" value={a} onChange={e => setA(e.target.value)} placeholder="Nouveau mot de passe (8 caractères minimum)" autoComplete="new-password" style={champ} aria-label="Nouveau mot de passe" />
      <input type="password" value={b} onChange={e => setB(e.target.value)} placeholder="Même mot de passe, encore une fois" autoComplete="new-password" style={champ} aria-label="Confirmation du mot de passe" />
      {msg && <div role="status" style={{ color: msg.ok ? '#15803d' : '#b91c1c', fontSize: 14, fontWeight: 600 }}>{msg.ok ? '✅' : '❌'} {msg.t}</div>}
      <button type="submit" style={styleBouton(true, '#475569')}>Enregistrer</button>
    </form>
  );
}

function MesResultats({ naviguer }) {
  const [lignes, setLignes] = useState(null), [erreur, setErreur] = useState('');
  useEffect(() => {
    toutLire('activites?select=cle,reussi,essais,corrections_vues,duree_s,debut,maj&order=debut.desc').then(setLignes).catch(e => setErreur(e.message));
  }, []);
  if (erreur) return <div style={{ color: '#b91c1c' }}><Pic n="ko"/>{erreur}</div>;
  if (!lignes) return <div style={{ color: KIT.txt2 }}>Chargement…</div>;
  const ag = [...agreger(lignes.filter(l => !estSimulation(l.cle))).values()], etq = etiquettes();
  const nbOk = ag.filter(a => a.reussi && !estDefi(a.cle)).length, nbEx = ag.filter(a => !estDefi(a.cle)).length;
  const nbDefis = ag.filter(a => a.reussi && estDefi(a.cle)).length, total = ag.reduce((t, a) => t + a.duree, 0);
  return (
    <div>
      <EspaceEleve lignes={lignes} naviguer={naviguer} pied={etape => etape >= 2 && (
      <details style={{ marginTop: 22 }}>
      <summary style={{ cursor: 'pointer', fontSize: 16, fontWeight: 800, color: KIT.txt, padding: '6px 0' }}><Pic n="clipboard"/>Le détail de mes résultats</summary>
      <h3 style={{ margin: '14px 0 6px' }}>Mes résultats</h3>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 8 }}>
        {nbOk} exercice{nbOk > 1 ? 's' : ''} réussi{nbOk > 1 ? 's' : ''} · {nbEx} travaillé{nbEx > 1 ? 's' : ''} · {nbDefis} défi{nbDefis > 1 ? 's' : ''} de simulation réussi{nbDefis > 1 ? 's' : ''} · {formatDuree(total)} au total
      </div>
      {!ag.length ? <div style={{ ...styleBoite, fontSize: 14 }}>Rien pour l’instant : fais un exercice depuis « je m’entraîne », ou un défi d’une simulation.</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 13.5, width: '100%' }}>
            <thead><tr style={{ textAlign: 'left', color: KIT.txt2 }}>
              <th style={{ padding: '4px 8px' }}></th><th style={{ padding: '4px 8px' }}>Exercice</th><th style={{ padding: '4px 8px' }}>Essais</th>
              <th style={{ padding: '4px 8px' }}>Corrections vues</th><th style={{ padding: '4px 8px' }}>Temps</th><th style={{ padding: '4px 8px' }}>Dernière fois</th></tr></thead>
            <tbody>{ag.sort((a, b) => (b.derniere || '').localeCompare(a.derniere || '')).map(a => (
              <tr key={a.cle} style={{ borderTop: `1px solid ${KIT.bord}` }}>
                <td style={{ padding: '4px 8px' }}>{a.reussi ? '✅' : '⬜'}</td>
                <td style={{ padding: '4px 8px' }}><b>{etq[a.cle]?.comp}</b> {etq[a.cle]?.titre || a.cle}</td>
                <td style={{ padding: '4px 8px' }}>{a.essais}</td><td style={{ padding: '4px 8px' }}>{a.vues}</td>
                <td style={{ padding: '4px 8px' }}>{formatDuree(a.duree)}</td><td style={{ padding: '4px 8px' }}>{formatDate(a.derniere)}</td>
              </tr>))}</tbody>
          </table>
        </div>)}
      <h3 style={{ margin: '18px 0 6px' }}>Temps passé sur les simulations</h3>
      <TableauTempsSimulations lignes={lignes} />
      </details>)} />
    </div>
  );
}

// Temps actif par simulation et par mode (tableau commun élève / professeur)
export function TableauTempsSimulations({ lignes, vide = 'Aucun temps enregistré sur les simulations.' }) {
  const t = tempsParSimulation(lignes), th = { padding: '4px 8px', textAlign: 'left', color: KIT.txt2 };
  if (!t.length) return <div style={{ ...styleBoite, fontSize: 14 }}>{vide}</div>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table data-temps-simulations style={{ borderCollapse: 'collapse', fontSize: 13.5, width: '100%' }}>
        <thead><tr><th style={th}>Simulation</th><th style={th}>Total</th>{MODES.map(([k, l]) => <th key={k} style={th}>{l}</th>)}</tr></thead>
        <tbody>{t.map(a => (
          <tr key={a.id} style={{ borderTop: `1px solid ${KIT.bord}` }}>
            <td style={{ padding: '4px 8px' }}>{a.nom}</td><td style={{ padding: '4px 8px' }}><b>{formatDuree(a.total)}</b></td>
            {MODES.map(([k]) => <td key={k} style={{ padding: '4px 8px', color: a[k] ? KIT.txt : KIT.txt2 }}>{a[k] ? formatDuree(a[k]) : '—'}</td>)}
          </tr>))}</tbody>
      </table>
    </div>);
}

export function SimulationCompte({ naviguer }) {
  const sess = useSession();
  return (
    <div style={{ ...(sess?.profil ? cardStyle : {}), maxWidth: sess?.profil ? 900 : 940, margin: '0 auto' }}>
      {!sess?.profil && <Connexion />}
      {estEleve(sess) && (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, color: KIT.txt2, marginBottom: 6 }}>
            <span>Connecté·e : <b style={{ color: KIT.txt }}>{sess.profil.identifiant}</b>{sess.profil.classe ? <> — classe <b style={{ color: KIT.txt }}>{sess.profil.classe}</b></> : null}</span>
            <button onClick={deconnexion} style={{ ...styleBouton(false, '#475569'), fontSize: 13 }}>Se déconnecter</button>
          </div>
          <MesResultats naviguer={naviguer} />
          <div style={{ marginTop: 22 }}><MotDePasse /></div>
        </>)}
      {estProf(sess) && (
        <>
          <p style={{ fontSize: 15, color: KIT.txt }}>Connecté : <b>{sess.profil.nom}</b> (professeur)</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => naviguer(40)} style={styleBouton(true, ROSE)}><Pic n="bars"/>Suivi professeur</button>
            <button onClick={deconnexion} style={styleBouton(false, '#475569')}>Se déconnecter</button>
          </div>
          <div style={{ marginTop: 10 }}><MotDePasse /></div>
        </>)}
    </div>
  );
}
