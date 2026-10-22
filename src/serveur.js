// ════════════════════════════════════════════════════════════════════════════
//  CLIENT DU SERVEUR (Supabase) — connexion des élèves et des professeurs, lecture et écriture des données.
//  Aucune dépendance : on parle directement aux trois services de Supabase (connexion, base, fonction « comptes »).
//  La clé ci-dessous est la clé « publishable » : elle est faite pour être publique. Ce qu'un utilisateur peut lire
//  ou écrire est décidé par les règles d'accès de la base (supabase/01-base.sql), pas par cette clé.
//  La clé secrète n'est JAMAIS dans le site.
// ════════════════════════════════════════════════════════════════════════════
import { useSyncExternalStore } from 'react';

const URL_SB = (import.meta.env.VITE_SB_URL || 'https://pqgzlklnynbkgiwmbzdj.supabase.co').replace(/\/$/, '');
const CLE_PUBLIQUE = import.meta.env.VITE_SB_KEY || 'sb_publishable_i2K6w3cEgTNcgmLWhuYx8w_9gXT6-tB';
export const DOMAINE = 'eleves.example.com';       // adresses fictives des élèves (voir supabase/functions/comptes)
const CLE_STOCKAGE = 'sb-session-v1';

// ── Session : gardée dans l'onglet (sessionStorage), ou dans le navigateur si l'élève coche « rester connecté » ──
function stockage(persistant) { try { return persistant ? window.localStorage : window.sessionStorage; } catch { return null; } }
function lireSession() {
  for (const p of [false, true]) {
    try {
      const s = JSON.parse(stockage(p)?.getItem(CLE_STOCKAGE) || 'null');
      if (s && s.access_token && s.refresh_token) return { ...s, persistant: p };
    } catch { /* session illisible : on l'ignore */ }
  }
  return null;
}
let session = lireSession();
const abonnes = new Set();
function ecrireSession(s) {
  session = s;
  for (const p of [false, true]) {
    try {
      if (s && p === !!s.persistant) stockage(p)?.setItem(CLE_STOCKAGE, JSON.stringify(s));
      else stockage(p)?.removeItem(CLE_STOCKAGE);
    } catch { /* indisponible */ }
  }
  abonnes.forEach(f => f());
}
// Plusieurs onglets ouverts avec « rester connecté » partagent la même session. Quand l'un renouvelle le jeton,
// les autres doivent reprendre le nouveau : réutiliser l'ancien ferait croire à Supabase à un vol de jeton,
// et il fermerait la session partout. Même chose pour une déconnexion faite dans un autre onglet.
const jetonsDe = s => ({ access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at });
function relireAutresOnglets() {
  if (!session?.persistant) return;
  try {
    const s = JSON.parse(window.localStorage.getItem(CLE_STOCKAGE) || 'null');
    if (s?.refresh_token && s.refresh_token !== session.refresh_token) session = { ...session, ...jetonsDe(s) };
  } catch { /* indisponible */ }
}
if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => {
    if (e.key !== CLE_STOCKAGE) return;
    try { if (e.storageArea !== window.localStorage) return; } catch { return; }
    let s = null;
    try { s = JSON.parse(e.newValue || 'null'); } catch { /* illisible */ }
    if (!s?.refresh_token) { if (session?.persistant) { session = null; abonnes.forEach(f => f()); } return; }
    session = session ? { ...session, ...jetonsDe(s), profil: s.profil || session.profil } : { ...s, persistant: true };
    abonnes.forEach(f => f());
  });
}
export const getSession = () => session;
const abonner = f => { abonnes.add(f); return () => abonnes.delete(f); };
export const useSession = () => useSyncExternalStore(abonner, getSession, getSession);
export const estEleve = s => s?.profil?.role === 'eleve';
export const estProf = s => s?.profil?.role === 'prof';

class ErreurServeur extends Error { constructor(message, statut) { super(message); this.statut = statut; } }
const messageDe = async r => {
  try { const j = await r.json(); return j.erreur || j.error_description || j.msg || j.message || j.error || `Erreur ${r.status}`; } catch { return `Erreur ${r.status}`; }
};

// ── Jeton d'accès : renouvelé automatiquement quand il approche de son expiration ──
let renouvellement = null;
async function renouveler(force = false) {
  if (renouvellement) return renouvellement;
  const avant = session?.refresh_token;
  relireAutresOnglets();
  // déjà renouvelé par un autre onglet, ou pas encore nécessaire (force : le serveur a refusé le jeton)
  if (session && (session.refresh_token !== avant || (!force && session.expires_at - Date.now() / 1000 >= 60))) return undefined;
  const s = session;
  if (!s) throw new ErreurServeur('Non connecté.', 401);
  renouvellement = (async () => {
    try {
      const r = await fetch(`${URL_SB}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST', headers: { apikey: CLE_PUBLIQUE, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: s.refresh_token }) });
      if (!r.ok) { if (r.status >= 400 && r.status < 500) ecrireSession(null); throw new ErreurServeur('Session expirée : reconnectez-vous.', r.status); }
      const j = await r.json();
      if (session) ecrireSession({ ...session, access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600) });
    } finally { renouvellement = null; }
  })();
  return renouvellement;
}
async function jeton() {
  if (!session) throw new ErreurServeur('Non connecté.', 401);
  if (session.expires_at - Date.now() / 1000 < 60) await renouveler();
  return session.access_token;
}
async function appeler(url, { method = 'GET', corps, entetes = {}, keepalive = false } = {}) {
  const faire = async () => fetch(url, {
    method, keepalive,
    headers: { apikey: CLE_PUBLIQUE, Authorization: `Bearer ${await jeton()}`, 'Content-Type': 'application/json', ...entetes },
    body: corps === undefined ? undefined : JSON.stringify(corps) });
  let r = await faire();
  if (r.status === 401 && session) { try { await renouveler(true); r = await faire(); } catch { /* on traite la réponse d'origine */ } }
  if (!r.ok) throw new ErreurServeur(await messageDe(r), r.status);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

// ── Base de données (PostgREST) ──
export const rest = (chemin, options) => appeler(`${URL_SB}/rest/v1/${chemin}`, options);
// Lit toutes les lignes, par pages de 1000
export async function toutLire(chemin) {
  const lignes = [];
  for (let debut = 0; ; debut += 1000) {
    const page = await rest(chemin, { entetes: { Range: `${debut}-${debut + 999}`, 'Range-Unit': 'items' } });
    lignes.push(...page);
    if (page.length < 1000) return lignes;
  }
}
// Fonction serveur « comptes » (création de classes et de comptes) : réservée aux professeurs
export const fonctionComptes = (action, params = {}) =>
  appeler(`${URL_SB}/functions/v1/comptes`, { method: 'POST', corps: { action, ...params } });

// ── Connexion ──
export const emailDe = identifiant => {
  const id = identifiant.replace(/\s+/g, '').toLowerCase();     // tolère espaces (« tstl1 - 07 ») et majuscules (clavier de téléphone)
  return id.includes('@') ? id : `${id}@${DOMAINE}`;       // un élève tape « tstl1-07 » ; un professeur, son adresse
};
async function chargerProfil() {
  // « admin » existe après supabase/10-administrateur.sql ; sans ce script, on retombe sur la lecture d'avant (pas d'administrateur)
  let prof;
  try { prof = await rest('professeurs?select=nom,admin'); } catch { prof = await rest('professeurs?select=nom'); }
  if (prof.length) return { role: 'prof', nom: prof[0].nom, admin: !!prof[0].admin };
  const el = await rest('eleves?select=identifiant,classe_id,classes(nom)');
  if (el.length) return { role: 'eleve', identifiant: el[0].identifiant, classe_id: el[0].classe_id, classe: el[0].classes?.nom || '' };
  return null;
}
export async function connexion(identifiant, motDePasse, persistant = false) {
  let r;
  try {
    r = await fetch(`${URL_SB}/auth/v1/token?grant_type=password`, {
      method: 'POST', headers: { apikey: CLE_PUBLIQUE, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailDe(identifiant), password: motDePasse }) });
  } catch { throw new ErreurServeur('Serveur injoignable : vérifiez votre connexion internet.', 0); }
  if (!r.ok) throw new ErreurServeur(r.status === 400 || r.status === 401 ? 'Identifiant ou mot de passe incorrect.' : await messageDe(r), r.status);
  const j = await r.json();
  ecrireSession({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600),
    user: { id: j.user?.id }, profil: null, persistant });
  try {
    const profil = await chargerProfil();
    if (!profil) { ecrireSession(null); throw new ErreurServeur('Ce compte n’est rattaché à aucune classe.', 403); }
    ecrireSession({ ...session, profil });
  } catch (e) { if (session) ecrireSession(null); throw e; }
}
export async function deconnexion() {
  const s = session;
  ecrireSession(null);
  if (s) { try { await fetch(`${URL_SB}/auth/v1/logout`, { method: 'POST', headers: { apikey: CLE_PUBLIQUE, Authorization: `Bearer ${s.access_token}` } }); } catch { /* sans importance */ } }
}
// Recharge le profil après un rechargement de la page (la session est restaurée sans profil à jour)
export async function restaurer() {
  if (!session) return;
  try { const profil = await chargerProfil(); if (profil) ecrireSession({ ...session, profil }); else ecrireSession(null); }
  catch (e) { if (e.statut === 401 || e.statut === 403) ecrireSession(null); }
}
export async function changerMotDePasse(nouveau) {
  await appeler(`${URL_SB}/auth/v1/user`, { method: 'PUT', corps: { password: nouveau } });
}
