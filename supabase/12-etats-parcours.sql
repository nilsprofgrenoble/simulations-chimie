-- ════════════════════════════════════════════════════════════════════════════
--  PAILLASSE VIRTUELLE — PROGRESSION DES PARCOURS RETROUVÉE SUR N'IMPORTE QUEL APPAREIL (étape 25)
--  Jusqu'ici, l'étape atteinte dans un parcours guidé n'était gardée que dans le navigateur de l'appareil :
--  un élève connecté qui reprenait son parcours au lycée après l'avoir commencé à la maison (ou l'inverse)
--  repartait du début. Cette table garde, pour chaque élève, l'état de ses parcours dans son compte.
--
--  Principes :
--   • une ligne = l'état d'un parcours (ou d'une partie) d'un élève : étape atteinte, réponses, étapes réussies ;
--   • un élève ne lit et n'écrit que ses propres lignes ; un professeur n'y a pas accès (le suivi passe par « activites ») ;
--   • aucun nom, aucun email : rien de nouveau côté données personnelles ;
--   • si ce script n'est pas exécuté, le site continue de fonctionner comme avant (progression gardée dans le navigateur).
--
--  Prérequis : 01 à 11 déjà exécutés. À coller dans Supabase → SQL Editor → « Run ». Peut être relancé sans risque.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.etats_parcours (
  user_id uuid not null default auth.uid() references public.eleves (user_id) on delete cascade,
  cle     text not null check (char_length(cle) between 1 and 120),         -- ex. « interlabo-guide-v1 »
  etat    jsonb not null check (pg_column_size(etat) < 100000),
  maj     timestamptz not null default now(),
  primary key (user_id, cle)
);

alter table public.etats_parcours enable row level security;

drop policy if exists etats_lecture on public.etats_parcours;
create policy etats_lecture on public.etats_parcours for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists etats_creation on public.etats_parcours;
create policy etats_creation on public.etats_parcours for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.est_eleve()));
drop policy if exists etats_maj on public.etats_parcours;
create policy etats_maj on public.etats_parcours for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- (pas de suppression depuis le site)

revoke all on public.etats_parcours from anon, authenticated;
grant select on public.etats_parcours to authenticated;
grant insert (cle, etat, maj) on public.etats_parcours to authenticated;   -- user_id = auth.uid() par défaut, imposé par la règle
grant update (cle, etat, maj) on public.etats_parcours to authenticated;   -- « cle » : nécessaire à l'enregistrement « insérer ou remplacer »

grant all on public.etats_parcours to service_role;   -- la fonction « comptes » supprime les données d'un élève avec son compte

-- Contrôle : doit afficher une ligne avec « t » (règles de sécurité actives)
select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename = 'etats_parcours';
