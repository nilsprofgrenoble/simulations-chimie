// ════════════════════════════════════════════════════════════════════════════
//  FONCTION SERVEUR « inscription-prof » — un enseignant crée lui-même son compte avec son adresse académique.
//  Déployée SANS vérification de jeton (l'appelant n'a pas encore de compte) : toute la protection est ici.
//
//  Déroulé (corps JSON : { email, nom, site_web }) :
//    1. l'adresse doit appartenir à une académie de la liste ci-dessous (liste fermée : un nom de domaine en « ac-… .fr »
//       peut être acheté par n'importe qui, un motif générique ne protégerait donc rien) ; pas d'adresse avec « + » ;
//    2. limites d'usage : par adresse (3/jour), par réseau (5/heure), au total (150/jour) ; plafond de comptes libres ;
//    3. adresse inconnue → invitation par mail (lien à usage unique) + fiche professeur (rôle « prof », auto_inscrit) ;
//       adresse déjà inscrite et confirmée → mail de réinitialisation du mot de passe ;
//       invitation jamais confirmée → elle est refaite ;
//    4. la réponse est toujours la même pour une adresse valide : on ne révèle pas si un compte existe déjà.
//  Le professeur clique sur le lien reçu, choisit son mot de passe (page « Mon compte »), et il est connecté.
//  Le mail est envoyé par Supabase avec le service d'envoi configuré (Authentication → Emails → SMTP).
//  Un compte jamais confirmé au bout de 14 jours est supprimé (il ne contient rien).
// ════════════════════════════════════════════════════════════════════════════
import { createClient } from 'npm:@supabase/supabase-js@2.117.3';   // version figée : pas de mise à jour surprise

// Adresses d'académie (messagerie des enseignants). Autres cas (enseignement agricole, établissements français à l'étranger,
// IUT, privé…) : l'administrateur crée le compte depuis « Suivi professeur → Ajouter un professeur ».
const ACADEMIES = new Set([
  'ac-aix-marseille.fr', 'ac-amiens.fr', 'ac-besancon.fr', 'ac-bordeaux.fr', 'ac-caen.fr', 'ac-clermont.fr', 'ac-corse.fr',
  'ac-creteil.fr', 'ac-dijon.fr', 'ac-grenoble.fr', 'ac-guadeloupe.fr', 'ac-guyane.fr', 'ac-lille.fr', 'ac-limoges.fr',
  'ac-lyon.fr', 'ac-martinique.fr', 'ac-mayotte.fr', 'ac-montpellier.fr', 'ac-nancy-metz.fr', 'ac-nantes.fr', 'ac-nice.fr',
  'ac-normandie.fr', 'ac-orleans-tours.fr', 'ac-paris.fr', 'ac-poitiers.fr', 'ac-reims.fr', 'ac-rennes.fr', 'ac-reunion.fr',
  'ac-rouen.fr', 'ac-strasbourg.fr', 'ac-toulouse.fr', 'ac-versailles.fr', 'ac-noumea.nc', 'ac-wf.wf',
]);
const MAX_PAR_ADRESSE_JOUR = 3;
const MAX_PAR_RESEAU_HEURE = 5;
const MAX_TOTAL_JOUR = 150;
const MAX_COMPTES_LIBRES = 400;         // au-delà, les inscriptions libres se ferment (à relever consciemment)
const PAGE_RETOUR = 'https://paillasse-virtuelle.fr/?sim=39';   // « Mon compte » : le lien du mail y ramène l'enseignant (adresse à autoriser dans Supabase → Authentication → URL Configuration)
const CLE_PUBLIQUE = 'sb_publishable_i2K6w3cEgTNcgmLWhuYx8w_9gXT6-tB';   // clé publique du site (aucun secret)

const ORIGINES = ['https://paillasse-virtuelle.fr', 'https://www.paillasse-virtuelle.fr', 'https://nilsprofgrenoble.github.io', 'http://localhost:5173', 'http://localhost:4173', 'http://localhost:4182'];
const entetes = (req: Request) => {
  const o = req.headers.get('Origin') ?? '';
  return {
    ...(ORIGINES.includes(o) ? { 'Access-Control-Allow-Origin': o } : {}),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  };
};
const ilYa = (ms: number) => new Date(Date.now() - ms).toISOString();

Deno.serve(async (req) => {
  const h = entetes(req);
  const rep = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: h });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return rep(405, { erreur: 'Méthode non autorisée.' });

  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!url || !secret) return rep(500, { erreur: 'Configuration du serveur incomplète.' });
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

  let corps: Record<string, unknown>;
  try { corps = await req.json(); } catch { return rep(400, { erreur: 'Requête illisible.' }); }

  // Piège à robots : ce champ reste vide chez une vraie personne (il est invisible dans le formulaire). On répond « ok » sans rien faire.
  if (typeof corps.site_web === 'string' && corps.site_web.trim() !== '') return rep(200, { ok: true });

  const email = String(corps.email ?? '').trim().toLowerCase();
  const nom = String(corps.nom ?? '').trim().replace(/\s+/g, ' ');
  if (!/^[a-z0-9][a-z0-9._'-]{0,63}@[a-z0-9.-]{3,60}$/.test(email)) return rep(400, { erreur: 'Adresse email invalide.' });
  const [local, domaine] = email.split('@');
  if (local.includes('+')) return rep(400, { erreur: 'Utilisez votre adresse académique habituelle, sans « + ».' });
  if (!ACADEMIES.has(domaine)) return rep(400, { erreur: 'Cette inscription est réservée aux adresses académiques (par exemple prenom.nom@ac-grenoble.fr). Autre adresse ? Écrivez-moi : je créerai votre compte à la main.' });
  if (nom.length < 2 || nom.length > 60) return rep(400, { erreur: 'Indiquez votre prénom et votre nom (2 à 60 caractères).' });

  try {
    // ── Limites d'usage ──
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim().slice(0, 64) || 'inconnue';
    const compter = async (filtre: (q: any) => any) => {   // deno-lint-ignore no-explicit-any
      const { count, error } = await filtre(admin.from('inscriptions_tentatives').select('id', { count: 'exact', head: true }));
      if (error) throw new Error(error.message);
      return count ?? 0;
    };
    if ((await compter((q) => q.eq('email', email).gte('cree', ilYa(24 * 3600e3)))) >= MAX_PAR_ADRESSE_JOUR
      || (await compter((q) => q.eq('ip', ip).gte('cree', ilYa(3600e3)))) >= MAX_PAR_RESEAU_HEURE
      || (await compter((q) => q.gte('cree', ilYa(24 * 3600e3)))) >= MAX_TOTAL_JOUR) {
      return rep(429, { erreur: 'Trop de demandes pour le moment. Réessayez dans une heure, ou écrivez-moi.' });
    }
    await admin.from('inscriptions_tentatives').insert({ email, ip });
    // Ménage : journal de plus de 2 jours, inscriptions jamais confirmées depuis 14 jours
    await admin.from('inscriptions_tentatives').delete().lt('cree', ilYa(48 * 3600e3));
    const { data: abandonnees } = await admin.rpc('inscriptions_abandonnees');
    for (const a of (abandonnees as { user_id: string }[] | null) ?? []) await admin.auth.admin.deleteUser(a.user_id);

    // ── Que faire de cette adresse ? ──
    const { data: etat, error: errEtat } = await admin.rpc('prof_etat', { e: email });
    if (errEtat) throw new Error(errEtat.message);
    const existant = (etat as { user_id: string; auto_inscrit: boolean; confirme: boolean }[] | null)?.[0];

    if (existant?.confirme) {
      // Compte déjà actif : mail de réinitialisation du mot de passe (service public de Supabase, avec la clé publique)
      const r = await fetch(`${url}/auth/v1/recover?redirect_to=${encodeURIComponent(PAGE_RETOUR)}`, {
        method: 'POST', headers: { apikey: CLE_PUBLIQUE, 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      if (!r.ok) throw new Error(`envoi du mail de réinitialisation impossible (${r.status})`);
      return rep(200, { ok: true });
    }
    if (existant && !existant.auto_inscrit) return rep(200, { ok: true });          // compte créé à la main, pas encore confirmé : on n'y touche pas

    if (!existant) {
      const { count, error } = await admin.from('professeurs').select('user_id', { count: 'exact', head: true }).eq('auto_inscrit', true);
      if (error) throw new Error(error.message);
      if ((count ?? 0) >= MAX_COMPTES_LIBRES) return rep(503, { erreur: 'Les inscriptions libres sont momentanément fermées. Écrivez-moi : je créerai votre compte.' });
    } else {
      await admin.auth.admin.deleteUser(existant.user_id);                           // invitation jamais confirmée : on la refait proprement
    }

    const { data: invite, error: errInv } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: PAGE_RETOUR });
    if (errInv || !invite?.user) throw new Error(`invitation impossible : ${errInv?.message ?? 'réponse vide'}`);
    const { error: errFiche } = await admin.from('professeurs').insert({ user_id: invite.user.id, nom, admin: false, invite: false, auto_inscrit: true });
    if (errFiche) { await admin.auth.admin.deleteUser(invite.user.id); throw new Error(`fiche professeur : ${errFiche.message}`); }
    return rep(200, { ok: true });
  } catch (e) {
    console.error('inscription-prof :', (e as Error).message);
    return rep(500, { erreur: 'L’inscription n’a pas pu aboutir pour le moment. Réessayez plus tard, ou écrivez-moi.' });
  }
});
