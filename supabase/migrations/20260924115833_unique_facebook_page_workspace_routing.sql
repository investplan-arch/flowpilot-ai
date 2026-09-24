create unique index if not exists integrations_facebook_page_global_uidx
on public.integrations (external_page_id)
where provider = 'facebook' and external_page_id is not null;
