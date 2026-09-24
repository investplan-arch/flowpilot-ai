import { createClient } from 'npm:@supabase/supabase-js@2'
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Cache-Control':'no-store'}
const J=(x:any,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...C,'Content-Type':'application/json'}})

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
  if(!cid||!text)return J({error:'missing_fields'},400)
  const{data:c}=await db.from('conversations').select('id,organization_id,integration_id,external_thread_id').eq('id',cid).single()
  if(!p?.organization_id||!c||c.organization_id!==p.organization_id)return J({error:'not_found'},404)
  const[{data:i},{data:s}]=await Promise.all([db.from('integrations').select('id,provider,status,external_page_id').eq('id',c.integration_id).eq('organization_id',p.organization_id).single(),db.from('internal_integration_secrets').select('page_access_token').eq('integration_id',c.integration_id).single()])
  if(!i||i.status!=='connected'||!s?.page_access_token)return J({error:'integration_not_ready'},400)
  const maxLen=i.provider==='telegram'?4096:i.provider==='facebook'?2000:0
  if(!maxLen)return J({error:'provider_not_ready'},400)
  if(text.length>maxLen)return J({error:'message_too_long',max_length:maxLen},400)

  const since=new Date(Date.now()-60_000).toISOString()
  const{data:recent}=await db.from('messages').select('id,external_message_id').eq('conversation_id',cid).eq('direction','outbound').eq('status','sent').eq('body',text).gte('created_at',since).order('created_at',{ascending:false}).limit(1).maybeSingle()
  if(recent?.external_message_id)return J({ok:true,message_id:recent.external_message_id,deduplicated:true})

  if(draftId){const {data:draft}=await db.from('messages').select('id').eq('id',draftId).eq('organization_id',p.organization_id).eq('conversation_id',cid).eq('status','pending_approval').maybeSingle();if(!draft)return J({error:'draft_changed_refresh_conversation'},409)}
  let ext:string|null=null
  try{
   if(i.provider==='telegram'){
    const r=await fetch(`https://api.telegram.org/bot${s.page_access_token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:c.external_thread_id,text}),signal:AbortSignal.timeout(8000)})
    const z=await r.json().catch(()=>({}));if(!r.ok||!z.ok)return J({error:'telegram_send_failed'},400)
    ext=z.result?.message_id?`tg:${i.id}:${z.result.message_id}`:null
   }else{
    const r=await fetch(`https://graph.facebook.com/v24.0/${encodeURIComponent(i.external_page_id||'')}/messages`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${s.page_access_token}`},body:JSON.stringify({recipient:{id:c.external_thread_id},messaging_type:'RESPONSE',message:{text}}),signal:AbortSignal.timeout(8000)})
    const z=await r.json().catch(()=>({}));if(!r.ok)return J({error:'meta_send_failed'},400);ext=z.message_id||null
   }
  }catch(e){return J({error:'provider_timeout_or_unavailable'},504)}

  const{data:m,error:insertErr}=await db.from('messages').insert({organization_id:p.organization_id,conversation_id:cid,external_message_id:ext,direction:'outbound',sender_type:'human',body:text,status:'sent',sent_at:new Date().toISOString()}).select('id').single()
  if(insertErr)return J({error:'provider_sent_but_persist_failed',message_id:ext},500)

  // A manual reply supersedes every pending draft in this conversation.
  const{data:pending}=await db.from('messages').select('id').eq('organization_id',p.organization_id).eq('conversation_id',cid).eq('direction','outbound').eq('sender_type','ai').eq('status','pending_approval')
  const pendingIds=(pending||[]).map((x:any)=>x.id)
  if(pendingIds.length){
   await db.from('messages').update({status:'rejected'}).in('id',pendingIds).eq('organization_id',p.organization_id)
   await db.from('approvals').update({status:'rejected',decided_at:new Date().toISOString()}).in('message_id',pendingIds).eq('organization_id',p.organization_id).eq('status','pending')
  }

  let approvedDraft=false
  try{
   if(draftId&&pendingIds.includes(draftId)){approvedDraft=true;await db.from('messages').update({status:'approved'}).eq('id',draftId);await db.from('approvals').update({status:'approved',decided_by:u.user.id,decided_at:new Date().toISOString()}).eq('message_id',draftId)}
  }catch{}
  try{await db.from('activity_log').insert({organization_id:p.organization_id,actor_user_id:u.user.id,event_type:'message.sent',entity_type:'message',entity_id:String(m?.id||''),data:{channel:i.provider,approved_ai_draft:approvedDraft}})}catch{}
  try{await db.rpc('increment_usage_internal',{p_org:p.organization_id,p_metric:'outbound_messages',p_amount:1})}catch{}
  return J({ok:true,message_id:ext,approved_ai_draft:approvedDraft})
 }catch(e){return J({error:'internal_error'},500)}
})
