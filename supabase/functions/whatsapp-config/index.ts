import { createClient } from 'npm:@supabase/supabase-js@2';
const C={'Access-Control-Allow-Origin':'https://flowpilot-ai-app.onrender.com','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Cache-Control':'no-store'};
const J=(x:unknown,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...C,'Content-Type':'application/json'}});
Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:C});
  if(req.method!=='GET'&&req.method!=='POST')return J({error:'method_not_allowed'},405);
  try{
    const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
    const jwt=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
    const {data:user}=await db.auth.getUser(jwt);
    if(!user.user)return J({error:'unauthorized'},401);
    const {data:profile}=await db.from('profiles').select('organization_id,role,system_admin').eq('id',user.user.id).single();
    if(!profile?.organization_id)return J({error:'profile_missing'},404);
    if(req.method==='GET'){
      const {data:rows}=await db.from('integrations').select('id,status,display_name,updated_at')
        .eq('organization_id',profile.organization_id).eq('provider','whatsapp');
      return J({integrations:rows||[]});
    }
    if(!profile.system_admin&&!['owner','admin'].includes(String(profile.role||'')))return J({error:'forbidden'},403);
    const b=await req.json().catch(()=>({}));
    const phoneId=String(b.phone_number_id||'').trim(),token=String(b.access_token||'').trim();
    if(!/^\d{6,30}$/.test(phoneId)||token.length<20||token.length>2048)return J({error:'invalid_credentials'},400);
    const {data:claimed}=await db.from('integrations').select('id').eq('provider','whatsapp')
      .eq('external_page_id',phoneId).neq('organization_id',profile.organization_id).limit(1);
    if(claimed?.length)return J({error:'phone_already_connected_to_another_workspace'},409);
    const url=new URL(`https://graph.facebook.com/v24.0/${phoneId}`);
    url.searchParams.set('fields','id,display_phone_number,verified_name');
    const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(8000)});
    const number=await response.json().catch(()=>({}));
    if(!response.ok||String(number.id||'')!==phoneId)return J({error:'meta_credentials_rejected'},400);
    const display=String(number.display_phone_number||number.verified_name||'WhatsApp').slice(0,160);
    const {data:integration,error:saveError}=await db.from('integrations').upsert({
      organization_id:profile.organization_id,provider:'whatsapp',external_page_id:phoneId,
      display_name:display,status:'connected',metadata:{channel:'whatsapp'}
    },{onConflict:'organization_id,provider,external_page_id'}).select('id').single();
    if(saveError||!integration)return J({error:'phone_already_connected_to_another_workspace'},409);
    const secret=await db.from('internal_integration_secrets').upsert({
      integration_id:integration.id,page_access_token:token,updated_at:new Date().toISOString()
    });
    if(secret.error)return J({error:'secret_store_failed'},500);
    return J({ok:true,display_name:display});
  }catch(e){
    console.error('whatsapp_config_error',e instanceof Error?e.name:'unknown');
    return J({error:'internal_error'},500);
  }
});
