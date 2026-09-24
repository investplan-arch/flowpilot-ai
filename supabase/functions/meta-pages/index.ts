import { createClient } from 'npm:@supabase/supabase-js@2';
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Cache-Control':'no-store'};
const J=(x:any,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...C,'Content-Type':'application/json'}});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:C});
 try{
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}}),jwt=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,''),{data:u}=await db.auth.getUser(jwt);if(!u.user)return J({error:'unauthorized'},401);
  const{data:profile}=await db.from('profiles').select('organization_id,role,system_admin').eq('id',u.user.id).single();if(!profile?.organization_id)return J({error:'profile_missing'},404);if(!profile.system_admin&&!['owner','admin'].includes(String(profile.role||'')))return J({error:'forbidden'},403);
  const state=new URL(req.url).searchParams.get('state')||'',now=new Date().toISOString();if(!state)return J({error:'state_required'},400);
  if(req.method==='GET'){
   const{data}=await db.from('internal_oauth_pending_pages').select('page_id,page_name').eq('state',state).eq('user_id',u.user.id).eq('organization_id',profile.organization_id).gt('expires_at',now);return J({pages:data||[]});
  }
  if(req.method!=='POST')return J({error:'method_not_allowed'},405);
  const b=await req.json().catch(()=>({})),pageId=String(b.page_id||'');if(!pageId)return J({error:'page_id_required'},400);
  const{data:p}=await db.from('internal_oauth_pending_pages').select('*').eq('state',state).eq('page_id',pageId).eq('user_id',u.user.id).eq('organization_id',profile.organization_id).gt('expires_at',now).single();if(!p)return J({error:'page_not_found'},404);
  const{data:claimed}=await db.from('integrations').select('id').eq('provider','facebook').eq('external_page_id',p.page_id).neq('organization_id',profile.organization_id).limit(1);
  if(claimed?.length)return J({error:'page_already_connected_to_another_workspace'},409);
  const{data:i,error:ie}=await db.from('integrations').upsert({organization_id:p.organization_id,provider:'facebook',external_page_id:p.page_id,display_name:p.page_name,status:'pending',metadata:{channel:'messenger'}},{onConflict:'organization_id,provider,external_page_id'}).select('id').single();if(ie||!i)return J({error:'integration_save_failed'},500);
  const se=await db.from('internal_integration_secrets').upsert({integration_id:i.id,page_access_token:p.page_access_token,updated_at:new Date().toISOString()});if(se.error)return J({error:'secret_store_failed'},500);
  const x=new URL(`https://graph.facebook.com/v24.0/${encodeURIComponent(p.page_id)}/subscribed_apps`);x.searchParams.set('subscribed_fields','messages,messaging_postbacks');x.searchParams.set('access_token',p.page_access_token);
  const r=await fetch(x,{method:'POST',signal:AbortSignal.timeout(8000)}),z=await r.json().catch(()=>({}));if(!r.ok||z.success===false){await db.from('integrations').update({status:'error'}).eq('id',i.id);return J({error:'page_subscription_failed'},400)}
  await db.from('integrations').update({status:'connected',updated_at:new Date().toISOString()}).eq('id',i.id);await db.from('internal_oauth_pending_pages').delete().eq('state',state);await db.from('internal_oauth_states').delete().eq('state',state);
  await db.from('activity_log').insert({organization_id:profile.organization_id,actor_user_id:u.user.id,event_type:'integration.facebook_configured',entity_type:'integration',entity_id:i.id,data:{page_id:p.page_id}});
  return J({ok:true,page_name:p.page_name});
 }catch(e){return J({error:'internal_error'},500)}
});
