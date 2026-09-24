
import { createClient } from 'npm:@supabase/supabase-js@2'
import { humanAgentEnabled, replyWindow, windowClosedMessage } from '../_shared/reply-window.ts'
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Cache-Control':'no-store'}
const J=(x:any,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...C,'Content-Type':'application/json'}})
const MSG:Record<string,string>={
 missing_fields:'Wybierz rozmowę i wpisz treść odpowiedzi.',
 not_found:'Nie znaleziono rozmowy. Odśwież panel.',
 integration_not_ready:'Kanał jest rozłączony. Połącz go ponownie w Integracjach.',
 provider_not_ready:'Ten kanał nie obsługuje jeszcze wysyłki.',
 draft_changed_refresh_conversation:'Szkic zmienił się w międzyczasie albo został już wysłany. Odśwież rozmowę.',
 telegram_send_failed:'Telegram odrzucił wiadomość. Spróbuj ponownie za chwilę.',
 whatsapp_send_failed:'WhatsApp odrzucił wiadomość. Sprawdź połączenie numeru w Integracjach.',
 meta_send_failed:'Messenger odrzucił wiadomość. Sprawdź połączenie strony w Integracjach.',
 provider_timeout_or_unavailable:'Meta nie odpowiedziała na czas. Sprawdź w rozmowie, czy wiadomość doszła, zanim wyślesz ją ponownie.',
 provider_sent_but_persist_failed:'Wiadomość wysłana, ale nie udało się jej zapisać w panelu. Nie wysyłaj jej ponownie.',
 internal_error:'Nie udało się wysłać wiadomości. Spróbuj ponownie.'
}
const E=(error:string,s:number,extra:any={})=>J({error,message:MSG[error]||extra.message||error,...extra},s)
// Meta returns these when the messaging window has closed.
const windowError=(z:any)=>{const c=Number(z?.error?.code),sc=Number(z?.error?.error_subcode);return sc===2018278||c===131047}

Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:C})
 if(req.method!=='POST')return J({error:'method_not_allowed'},405)
 try{
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}})
  const jwt=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'')
  const{data:u}=await db.auth.getUser(jwt);if(!u.user)return J({error:'unauthorized'},401)
  const{data:p}=await db.from('profiles').select('organization_id').eq('id',u.user.id).single()
  const b=await req.json().catch(()=>({})),cid=String(b.conversation_id||''),text=String(b.body||'').trim()
  const draftId=b.draft_id?String(b.draft_id):null;
  if(!cid||!text)return E('missing_fields',400)
  const{data:c}=await db.from('conversations').select('id,organization_id,integration_id,external_thread_id').eq('id',cid).single()
  if(!p?.organization_id||!c||c.organization_id!==p.organization_id)return E('not_found',404)
  const org=p.organization_id
  const[{data:i},{data:s}]=await Promise.all([db.from('integrations').select('id,provider,status,external_page_id').eq('id',c.integration_id).eq('organization_id',org).single(),db.from('internal_integration_secrets').select('page_access_token').eq('integration_id',c.integration_id).single()])
  if(!i||i.status!=='connected'||!s?.page_access_token)return E('integration_not_ready',400)
  const maxLen=i.provider==='telegram'||i.provider==='whatsapp'?4096:i.provider==='facebook'?2000:0
  if(!maxLen)return E('provider_not_ready',400)
  if(text.length>maxLen)return J({error:'message_too_long',max_length:maxLen,message:`Wiadomość jest za długa. Limit tego kanału to ${maxLen} znaków.`},400)

  const since=new Date(Date.now()-60_000).toISOString()
  const{data:recent}=await db.from('messages').select('id,external_message_id').eq('conversation_id',cid).eq('direction','outbound').eq('status','sent').eq('body',text).gte('created_at',since).order('created_at',{ascending:false}).limit(1).maybeSingle()
  if(recent?.external_message_id)return J({ok:true,message_id:recent.external_message_id,deduplicated:true})

  const{data:lastIn}=await db.from('messages').select('created_at').eq('conversation_id',cid).eq('organization_id',org).eq('direction','inbound').order('created_at',{ascending:false}).limit(1).maybeSingle()
  const w=replyWindow(i.provider,lastIn?.created_at,Date.now(),humanAgentEnabled())
  if(!w.open)return J({error:'window_closed',message:windowClosedMessage(w),reply_window:w},409)

  // Reserve the draft before contacting Meta, so two operators cannot send it twice.
  let draftBody:string|null=null
  if(draftId){
   const{data:claimed}=await db.from('messages').update({status:'approved'}).eq('id',draftId).eq('organization_id',org).eq('conversation_id',cid).eq('status','pending_approval').select('id,body').maybeSingle()
   if(!claimed)return E('draft_changed_refresh_conversation',409)
   draftBody=String(claimed.body||'')
  }
  const release=async()=>{if(draftId)try{await db.from('messages').update({status:'pending_approval'}).eq('id',draftId).eq('organization_id',org).eq('status','approved')}catch{}}
  const fail=async(error:string,z:any)=>{
   await release()
   try{await db.from('activity_log').insert({organization_id:org,actor_user_id:u.user.id,event_type:'message.send_failed',entity_type:'conversation',entity_id:cid,data:{channel:i.provider,error,code:z?.error?.code??null,subcode:z?.error?.error_subcode??null}})}catch{}
   if(windowError(z))return J({error:'window_closed',message:windowClosedMessage(w),reply_window:w},409)
   return E(error,400)
  }
  let ext:string|null=null
  try{
   if(i.provider==='telegram'){
    const r=await fetch(`https://api.telegram.org/bot${s.page_access_token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:c.external_thread_id,text}),signal:AbortSignal.timeout(8000)})
    const z=await r.json().catch(()=>({}));if(!r.ok||!z.ok)return await fail('telegram_send_failed',z)
    ext=z.result?.message_id?`tg:${i.id}:${z.result.message_id}`:null
   }else if(i.provider==='whatsapp'){
    const r=await fetch(`https://graph.facebook.com/v24.0/${encodeURIComponent(i.external_page_id||'')}/messages`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${s.page_access_token}`},body:JSON.stringify({messaging_product:'whatsapp',to:c.external_thread_id,type:'text',text:{body:text}}),signal:AbortSignal.timeout(8000)})
    const z=await r.json().catch(()=>({}));if(!r.ok)return await fail('whatsapp_send_failed',z);ext=z.messages?.[0]?.id||null
   }else{
    const messaging=w.mode==='human_agent'?{messaging_type:'MESSAGE_TAG',tag:'HUMAN_AGENT'}:{messaging_type:'RESPONSE'}
    const r=await fetch(`https://graph.facebook.com/v24.0/${encodeURIComponent(i.external_page_id||'')}/messages`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${s.page_access_token}`},body:JSON.stringify({recipient:{id:c.external_thread_id},...messaging,message:{text}}),signal:AbortSignal.timeout(8000)})
    const z=await r.json().catch(()=>({}));if(!r.ok)return await fail('meta_send_failed',z);ext=z.message_id||null
   }
  }catch(e){
   // The outcome is unknown (timeout), so the draft stays reserved: re-sending could duplicate the message.
   return E('provider_timeout_or_unavailable',504)
  }

  const{data:m,error:insertErr}=await db.from('messages').insert({organization_id:org,conversation_id:cid,external_message_id:ext,direction:'outbound',sender_type:'human',body:text,status:'sent',sent_at:new Date().toISOString()}).select('id').single()
  if(insertErr)return J({error:'provider_sent_but_persist_failed',message:MSG.provider_sent_but_persist_failed,message_id:ext},500)

  // A manual reply supersedes every other pending draft in this conversation.
  const{data:pending}=await db.from('messages').select('id').eq('organization_id',org).eq('conversation_id',cid).eq('direction','outbound').eq('sender_type','ai').eq('status','pending_approval')
  const pendingIds=(pending||[]).map((x:any)=>x.id)
  if(pendingIds.length){
   await db.from('messages').update({status:'rejected'}).in('id',pendingIds).eq('organization_id',org)
   await db.from('approvals').update({status:'rejected',decided_at:new Date().toISOString()}).in('message_id',pendingIds).eq('organization_id',org).eq('status','pending')
  }

  const approvedDraft=draftBody!==null
  try{
   if(approvedDraft)await db.from('approvals').update({status:'approved',decided_by:u.user.id,decided_at:new Date().toISOString()}).eq('message_id',draftId).eq('organization_id',org)
  }catch{}
  const edited=approvedDraft&&draftBody!.trim()!==text
  const responseSeconds=lastIn?.created_at?Math.max(0,Math.round((Date.now()-Date.parse(lastIn.created_at))/1000)):null
  try{await db.from('activity_log').insert({organization_id:org,actor_user_id:u.user.id,event_type:'message.sent',entity_type:'message',entity_id:String(m?.id||''),data:{channel:i.provider,approved_ai_draft:approvedDraft,edited,response_seconds:responseSeconds,window_mode:w.mode,...(edited?{draft_body:draftBody!.slice(0,1500),sent_body:text.slice(0,1500)}:{})}})}catch{}
  try{await db.rpc('increment_usage_internal',{p_org:org,p_metric:'outbound_messages',p_amount:1})}catch{}
  return J({ok:true,message_id:ext,approved_ai_draft:approvedDraft})
 }catch(e){return E('internal_error',500)}
})
