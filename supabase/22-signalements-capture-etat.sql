-- ═════════════════════════════════════════════════════════════════
--  SIGNALEMENTS, suite : « état » de la simulation (réglages et réponses saisis, joints automatiquement)
--  et capture d'écran facultative (image JPEG légère, stockage privé, lisible par l'administrateur seulement).
--  Prérequis : 21-signalements.sql. À exécuter UNE fois ; relançable sans risque.
-- ═════════════════════════════════════════════════════════════════
alter table public.signalements add column if not exists etat text check (etat is null or char_length(etat) <= 3000);
alter table public.signalements add column if not exists capture text check (capture is null or char_length(capture) <= 80);

-- espace de stockage privé : une image JPEG de 400 Ko au plus par fichier
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('signalements', 'signalements', false, 400000, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 400000, allowed_mime_types = array['image/jpeg'];

-- tout visiteur peut déposer (pas lire) un fichier nommé « <uuid>.jpg » ; seul l'administrateur lit et supprime
drop policy if exists signalements_depot on storage.objects;
create policy signalements_depot on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'signalements' and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$');
drop policy if exists signalements_lecture_fichiers on storage.objects;
create policy signalements_lecture_fichiers on storage.objects for select to authenticated
  using (bucket_id = 'signalements' and public.est_admin());
drop policy if exists signalements_suppression_fichiers on storage.objects;
create policy signalements_suppression_fichiers on storage.objects for delete to authenticated
  using (bucket_id = 'signalements' and public.est_admin());

-- plafond global : au plus 30 dépôts par minute, pour tout le site
create or replace function public.signalements_depots_plafond() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.bucket_id = 'signalements'
     and (select count(*) from storage.objects where bucket_id = 'signalements' and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'Trop d’images en ce moment, réessayez dans une minute.' using errcode = '54000';
  end if;
  return new;
end $$;
do $$ begin
  drop trigger if exists signalements_depots_plafond on storage.objects;
  create trigger signalements_depots_plafond before insert on storage.objects for each row execute function public.signalements_depots_plafond();
exception when others then
  raise notice 'Plafond de dépôts non installé (%), la limite de taille du stockage reste active.', sqlerrm;
end $$;

select column_name as verification from information_schema.columns where table_schema = 'public' and table_name = 'signalements' and column_name in ('etat', 'capture');
