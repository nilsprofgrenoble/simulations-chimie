// ════════════════════════════════════════════════════════════════════════════
//  FONCTION SERVEUR « comptes » — création et gestion des comptes élèves
//  À déployer dans Supabase → Edge Functions → Deploy a new function → Via Editor,
//  sous le nom « comptes ». Elle seule utilise la clé secrète (fournie
//  automatiquement par Supabase côté serveur : elle n'apparaît jamais dans le site).
//
//  Seul un professeur connecté (présent dans la table « professeurs ») peut l'appeler,
//  et seulement pour SES classes. Actions (corps JSON, champ « action ») :
//    creer_classe     { nom, prefixe, nombre }  → crée la classe et « nombre » comptes
//    ajouter_eleves   { classe_id, nombre }     → ajoute des comptes à la suite
//    reinitialiser    { identifiant }           → nouveau mot de passe pour un élève
//    supprimer_eleve  { identifiant }           → supprime le compte et toutes ses données
//    supprimer_classe { classe_id }             → supprime la classe, ses comptes et leurs données
//  Les mots de passe ne sont renvoyés qu'une fois, au moment de leur création : à imprimer.
// ════════════════════════════════════════════════════════════════════════════
import { createClient } from 'npm:@supabase/supabase-js@2.117.3';   // version figée : pas de mise à jour surprise

// Adresses fictives (domaine réservé, qui ne peut appartenir à personne) : aucun email n'est jamais envoyé.
// Le site utilise la même convention pour la connexion : identifiant « tstl1-07 » → tstl1-07@eleves.example.com
const DOMAINE = 'eleves.example.com';
const MAX_PAR_APPEL = 40;
const MAX_PAR_CLASSE = 60;      // garde-fous si un compte professeur était utilisé par quelqu'un d'autre
const MAX_CLASSES = 30;

// Sites autorisés à appeler la fonction (le contrôle réel est la connexion du professeur)
const ORIGINES = ['https://nilsprofgrenoble.github.io', 'http://localhost:5173', 'http://localhost:4173', 'http://localhost:4182'];
const entetes = (req: Request) => {
  const o = req.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ORIGINES.includes(o) ? o : ORIGINES[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  };
};

// Mot de passe lisible et facile à recopier : « bako-tiru-47 » (≈ 4,7 milliards de possibilités)
const CONS = 'bcdfghjklmnprstvz', VOY = 'aeiou';
function motDePasse(): string {
  const r = new Uint32Array(5);
  crypto.getRandomValues(r);
  const syl = (x: number) => CONS[x % CONS.length] + VOY[Math.floor(x / 1000) % VOY.length];
  return `${syl(r[0])}${syl(r[1])}-${syl(r[2])}${syl(r[3])}-${10 + (r[4] % 90)}`;
}
const identifiantDe = (prefixe: string, n: number) => `${prefixe}-${String(n).padStart(2, '0')}`;

Deno.serve(async (req) => {
  const h = entetes(req);
  const rep = (statut: number, corps: unknown) => new Response(JSON.stringify(corps), { status: statut, headers: h });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return rep(405, { erreur: 'Méthode non autorisée.' });

  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!url || !secret) return rep(500, { erreur: 'Configuration du serveur incomplète (clé de service absente).' });
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

  // ── Qui appelle ? Un professeur connecté, sinon refus ──
  const jeton = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: qui, error: errQui } = await admin.auth.getUser(jeton);
  if (errQui || !qui?.user) return rep(401, { erreur: 'Connexion requise.' });
  const profId = qui.user.id;
  const { data: prof, error: errProf } = await admin.from('professeurs').select('user_id').eq('user_id', profId).maybeSingle();
  if (errProf) return rep(500, { erreur: `Erreur du serveur (base de données) : ${errProf.message}` });
  if (!prof) return rep(403, { erreur: 'Action réservée aux professeurs.' });

  let corps: Record<string, unknown>;
  try { corps = await req.json(); } catch { return rep(400, { erreur: 'Requête illisible.' }); }

  // Classe du professeur appelant, ou null
  const maClasse = async (classeId: unknown) => {
    if (typeof classeId !== 'string') return null;
    const { data, error } = await admin.from('classes').select('id, prefixe, nom').eq('id', classeId).eq('prof_id', profId).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  };
  // Élève d'une classe du professeur appelant, ou null
  const monEleve = async (identifiant: unknown) => {
    if (typeof identifiant !== 'string') return null;
    const { data, error } = await admin.from('eleves').select('user_id, identifiant, classes!inner(prof_id)').eq('identifiant', identifiant.trim().toLowerCase()).maybeSingle();
    if (error) throw new Error(error.message);
    return data && (data.classes as unknown as { prof_id: string }).prof_id === profId ? data : null;
  };
  // Crée « nombre » comptes à la suite des existants
  const creerComptes = async (classe: { id: string; prefixe: string }, nombre: number) => {
    const { data: existants, error: errEx } = await admin.from('eleves').select('identifiant').eq('classe_id', classe.id);
    if (errEx) throw new Error(errEx.message);
    if ((existants ?? []).length + nombre > MAX_PAR_CLASSE) throw new Error(`Une classe ne peut pas dépasser ${MAX_PAR_CLASSE} comptes.`);
    let n = Math.max(0, ...(existants ?? []).map((e) => Number(e.identifiant.split('-').pop()) || 0));
    const comptes: { identifiant: string; mot_de_passe?: string; erreur?: string }[] = [];
    for (let i = 0; i < nombre; i++) {
      n += 1;
      const identifiant = identifiantDe(classe.prefixe, n), mot_de_passe = motDePasse();
      const { data: cree, error } = await admin.auth.admin.createUser({ email: `${identifiant}@${DOMAINE}`, password: mot_de_passe, email_confirm: true });
      if (error || !cree?.user) { comptes.push({ identifiant, erreur: error?.message ?? 'création impossible' }); continue; }
      const { error: errEl } = await admin.from('eleves').insert({ user_id: cree.user.id, classe_id: classe.id, identifiant });
      if (errEl) { await admin.auth.admin.deleteUser(cree.user.id); comptes.push({ identifiant, erreur: errEl.message }); continue; }
      comptes.push({ identifiant, mot_de_passe });
    }
    return comptes;
  };
  const nombreValide = (x: unknown) => Number.isInteger(x) && (x as number) >= 1 && (x as number) <= MAX_PAR_APPEL;

  try {
  switch (corps.action) {
    case 'creer_classe': {
      const nom = String(corps.nom ?? '').trim(), prefixe = String(corps.prefixe ?? '').trim().toLowerCase();
      if (nom.length < 1 || nom.length > 40) return rep(400, { erreur: 'Nom de classe : 1 à 40 caractères.' });
      if (!/^[a-z0-9]{2,12}$/.test(prefixe)) return rep(400, { erreur: 'Préfixe : 2 à 12 lettres minuscules ou chiffres, sans espace ni accent (ex. tstl1).' });
      if (!nombreValide(corps.nombre)) return rep(400, { erreur: `Nombre d’élèves : entre 1 et ${MAX_PAR_APPEL}.` });
      const { count: nbClasses, error: errNb } = await admin.from('classes').select('id', { count: 'exact', head: true }).eq('prof_id', profId);
      if (errNb) throw new Error(errNb.message);
      if ((nbClasses ?? 0) >= MAX_CLASSES) return rep(400, { erreur: `Vous avez déjà ${MAX_CLASSES} classes : supprimez-en une avant d’en créer une autre.` });
      const { data: classe, error } = await admin.from('classes').insert({ nom, prefixe, prof_id: profId }).select('id, prefixe, nom').single();
      if (error) return rep(409, { erreur: error.code === '23505' ? 'Ce préfixe est déjà utilisé : choisissez-en un autre.' : error.message });
      return rep(200, { classe, comptes: await creerComptes(classe, corps.nombre as number) });
    }
    case 'ajouter_eleves': {
      const classe = await maClasse(corps.classe_id);
      if (!classe) return rep(404, { erreur: 'Classe introuvable.' });
      if (!nombreValide(corps.nombre)) return rep(400, { erreur: `Nombre d’élèves : entre 1 et ${MAX_PAR_APPEL}.` });
      return rep(200, { classe, comptes: await creerComptes(classe, corps.nombre as number) });
    }
    case 'reinitialiser': {
      const el = await monEleve(corps.identifiant);
      if (!el) return rep(404, { erreur: 'Élève introuvable dans vos classes.' });
      const mot_de_passe = motDePasse();
      const { error } = await admin.auth.admin.updateUserById(el.user_id, { password: mot_de_passe });
      if (error) return rep(500, { erreur: error.message });
      return rep(200, { comptes: [{ identifiant: el.identifiant, mot_de_passe }] });
    }
    case 'supprimer_eleve': {
      const el = await monEleve(corps.identifiant);
      if (!el) return rep(404, { erreur: 'Élève introuvable dans vos classes.' });
      const { error } = await admin.auth.admin.deleteUser(el.user_id);     // supprime aussi sa ligne et ses activités
      if (error) return rep(500, { erreur: error.message });
      return rep(200, { supprimes: [el.identifiant] });
    }
    case 'supprimer_classe': {
      const classe = await maClasse(corps.classe_id);
      if (!classe) return rep(404, { erreur: 'Classe introuvable.' });
      const { data: eleves, error: errEl } = await admin.from('eleves').select('user_id, identifiant').eq('classe_id', classe.id);
      if (errEl) throw new Error(errEl.message);
      const echecs: string[] = [];
      for (const e of eleves ?? []) {
        const { error } = await admin.auth.admin.deleteUser(e.user_id);
        if (error) echecs.push(e.identifiant);
      }
      if (echecs.length) return rep(500, { erreur: `Comptes non supprimés : ${echecs.join(', ')}. Relancez la suppression.` });
      const { error: errDel } = await admin.from('classes').delete().eq('id', classe.id);
      if (errDel) throw new Error(errDel.message);
      return rep(200, { supprimes: (eleves ?? []).map((e) => e.identifiant) });
    }
    default:
      return rep(400, { erreur: 'Action inconnue.' });
  }
  } catch (err) {
    return rep(500, { erreur: `Erreur du serveur : ${err instanceof Error ? err.message : String(err)}` });
  }
});
