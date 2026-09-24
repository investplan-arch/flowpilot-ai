import { createClient } from 'npm:@supabase/supabase-js@2';

const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Cache-Control':'no-store','Content-Type':'application/json'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers});
  if(req.method!=='POST')return json({error:'method_not_allowed'},405);
  try{
    const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
    const jwt=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
    const {data:{user}}=await db.auth.getUser(jwt);
    if(!user)return json({error:'unauthorized'},401);
    const {data:profile}=await db.from('profiles').select('organization_id').eq('id',user.id).single();
    const body=await req.json().catch(()=>({}));
    const id=String(body.conversation_id||''),takeover=body.human_takeover;
    if(!profile?.organization_id||!id||typeof takeover!=='boolean')return json({error:'invalid_request'},400);
    const {data:conversation,error}=await db.from('conversations').update({human_takeover:takeover}).eq('id',id).eq('organization_id',profile.organization_id).select('id,human_takeover').maybeSingle();
    if(error)return json({error:'update_failed'},500);
    if(!conversation)return json({error:'not_found'},404);
    if(takeover){
      const {data:pending}=await db.from('messages').select('id').eq('organization_id',profile.organization_id).eq('conversation_id',id).eq('sender_type','ai').eq('status','pending_approval');
      const ids=(pending||[]).map(x=>x.id);
      if(ids.length){
        await db.from('messages').update({status:'rejected'}).in('id',ids).eq('organization_id',profile.organization_id);
        await db.from('approvals').update({status:'rejected',decided_at:new Date().toISOString()}).in('message_id',ids).eq('organization_id',profile.organization_id).eq('status','pending');
      }
    }
    await db.from('activity_log').insert({organization_id:profile.organization_id,actor_user_id:user.id,event_type:takeover?'conversation.taken_over':'conversation.ai_resumed',entity_type:'conversation',entity_id:id,data:{}});
    return json({conversation});
  }catch(e){console.error(e);return json({error:'internal_error'},500)}
});
