create unique index if not exists integrations_whatsapp_phone_global_unique
on public.integrations (external_page_id)
where provider = 'whatsapp' and external_page_id is not null;
