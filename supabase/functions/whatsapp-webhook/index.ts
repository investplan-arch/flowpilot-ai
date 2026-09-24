import { createClient } from 'npm:@supabase/supabase-js@2';

const hex=(b:ArrayBuffer)=>Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');
async function validSignature(body:string,header:string,secret:string){
  if(!/^sha256=[a-f0-9]{64}$/.test(header))return false;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const expected='sha256='+hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(body)));
  let diff=0;for(let n=0;n<expected.length;n++)diff|=expected.charCodeAt(n)^header.charCodeAt(n);
  return diff===0;
}
const label=(message:any)=>{
  if(message.type==='text')return String(message.text?.body||'').trim().slice(0,10000);
  if(message.type==='image')return '[Zdjęcie]';
  if(message.type==='document')return '[Dokument]';
  if(message.type==='audio')return '[Wiadomość głosowa]';
  if(message.type==='video')return '[Wideo]';
  return '[Wiadomość WhatsApp]';
};

Deno.serve(async(req:Request)=>{
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
  if(req.method==='GET'){
    const {data:cfg}=await db.from('internal_system_config').select('meta_verify_token').eq('id',true).single();
    const url=new URL(req.url);
    if(url.searchParams.get('hub.mode')==='subscribe'&&cfg?.meta_verify_token&&url.searchParams.get('hub.verify_token')===cfg.meta_verify_token)
      return new Response(url.searchParams.get('hub.challenge')||'');
    return new Response('forbidden',{status:403});
  }
  if(req.method!=='POST')return new Response('method_not_allowed',{status:405});
  try{
    const raw=await req.text();
    if(raw.length>2_000_000)return new Response('payload_too_large',{status:413});
    const {data:cfg}=await db.from('internal_system_config').select('meta_app_secret').eq('id',true).single();
    if(!cfg?.meta_app_secret)return new Response('not_configured',{status:503});
    if(!await validSignature(raw,req.headers.get('x-hub-signature-256')||'',cfg.meta_app_secret))
      return new Response('bad_signature',{status:401});
    const payload=JSON.parse(raw);
    if(payload.object!=='whatsapp_business_account')return new Response('EVENT_RECEIVED');
    for(const entry of payload.entry||[])for(const change of entry.changes||[]){
      if(change.field!=='messages')continue;
      const value=change.value||{},phoneId=String(value.metadata?.phone_number_id||'');
      if(!phoneId)continue;
      const {data:integration,error:routingError}=await db.from('integrations').select('id,organization_id')
        .eq('provider','whatsapp').eq('external_page_id',phoneId).eq('status','connected').maybeSingle();
      if(routingError)throw routingError;
      if(!integration)continue;
      for(const message of value.messages||[]){
        const mid=String(message.id||''),sender=String(message.from||'');
        if(!mid||!sender)continue;
        const {data:existing}=await db.from('messages').select('id').eq('external_message_id',mid).maybeSingle();
        if(existing)continue;
        const org=integration.organization_id,body=label(message);
        const media=['image','document','audio','video'].includes(message.type)?message[message.type]:null;
        const attachments=media?.id?[{type:message.type,media_id:String(media.id),mime_type:String(media.mime_type||''),title:String(media.filename||'')}]:[];
        const profile=(value.contacts||[]).find((c:any)=>String(c.wa_id||'')===sender);
        const name=String(profile?.profile?.name||sender).slice(0,160);
        let {data:contact}=await db.from('contacts').select('id,name').eq('organization_id',org)
          .eq('integration_id',integration.id).eq('external_id',sender).maybeSingle();
        if(!contact){
          const created=await db.from('contacts').insert({organization_id:org,integration_id:integration.id,external_id:sender,name,metadata:{channel:'whatsapp'}}).select('id,name').single();
          if(created.error)throw created.error;
          contact=created.data;
        }else if(contact.name!==name&&name!==sender){
          await db.from('contacts').update({name}).eq('id',contact.id).eq('organization_id',org);
        }
        let {data:conversation}=await db.from('conversations').select('id').eq('organization_id',org)
          .eq('integration_id',integration.id).eq('external_thread_id',sender).eq('status','open').maybeSingle();
        if(!conversation){
          const lead=await db.from('leads').insert({organization_id:org,contact_id:contact.id,source:'whatsapp',status:'new',pipeline_stage:'new',score:0,summary:body.slice(0,500)}).select('id').single();
          if(lead.error)throw lead.error;
          const created=await db.from('conversations').insert({organization_id:org,contact_id:contact.id,lead_id:lead.data.id,integration_id:integration.id,external_thread_id:sender,channel:'whatsapp',last_message_at:new Date().toISOString()}).select('id').single();
          if(created.error)throw created.error;
          conversation=created.data;
        }
        const inserted=await db.from('messages').insert({organization_id:org,conversation_id:conversation.id,external_message_id:mid,direction:'inbound',sender_type:'customer',body,attachments,status:'received',sent_at:new Date().toISOString()});
        if(inserted.error){if(inserted.error.code==='23505')continue;throw inserted.error;}
        await db.from('conversations').update({last_message_at:new Date().toISOString()}).eq('id',conversation.id).eq('organization_id',org);
        const {data:pending}=await db.from('messages').select('id').eq('organization_id',org).eq('conversation_id',conversation.id).eq('sender_type','ai').eq('status','pending_approval');
        const ids=(pending||[]).map((x:any)=>x.id);
        if(ids.length){
          await db.from('messages').update({status:'rejected'}).in('id',ids).eq('organization_id',org);
          await db.from('approvals').update({status:'rejected',decided_at:new Date().toISOString()}).in('message_id',ids).eq('organization_id',org).eq('status','pending');
        }
        await db.rpc('increment_usage_internal',{p_org:org,p_metric:'inbound_messages',p_amount:1});
      }
    }
    return new Response('EVENT_RECEIVED');
  }catch(e){
    console.error('whatsapp_webhook_error',e instanceof Error?e.name:'unknown');
    return new Response('processing_failed',{status:500});
  }
});
