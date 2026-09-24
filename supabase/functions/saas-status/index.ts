import { createClient } from 'npm:@supabase/supabase-js@2'
const C={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'GET,OPTIONS','Cache-Control':'no-store'}
const J=(x:any,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...C,'Content-Type':'application/json'}})
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:C});if(req.method!=='GET')return J({error:'method_not_allowed'},405)
 try{
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}}),jwt=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,''),{data:u}=await db.auth.getUser(jwt);if(!u.user)return J({error:'unauthorized'},401)
  const{data:p}=await db.from('profiles').select('organization_id,role,system_admin').eq('id',u.user.id).single();if(!p?.organization_id)return J({error:'profile_missing'},404)
  const org=p.organization_id,month=new Date().toISOString().slice(0,7)+'-01',now=new Date().toISOString()
  const [{data:o},{data:s},{data:ints},{data:usage},{count:convCount},{count:hotCount},{count:wonCount},{count:teamCount},{count:dueCount},{count:pendingCount},{data:cfg}]=await Promise.all([
   db.from('organizations').select('id,name,industry,website,onboarding_completed,plan_key,subscription_status,trial_ends_at').eq('id',org).single(),
   db.from('ai_settings').select('knowledge_base,company_context,company_offer,business_goal,autonomy,tone').eq('organization_id',org).single(),
   db.from('integrations').select('id,provider,status,display_name,updated_at').eq('organization_id',org),
   db.from('usage_monthly').select('*').eq('organization_id',org).eq('period_start',month).maybeSingle(),
   db.from('conversations').select('id',{count:'exact',head:true}).eq('organization_id',org),
   db.from('leads').select('id',{count:'exact',head:true}).eq('organization_id',org).gte('score',70).not('pipeline_stage','in','(won,lost)'),
   db.from('leads').select('id',{count:'exact',head:true}).eq('organization_id',org).eq('pipeline_stage','won'),
   db.from('profiles').select('id',{count:'exact',head:true}).eq('organization_id',org),
   db.from('leads').select('id',{count:'exact',head:true}).eq('organization_id',org).not('next_follow_up_at','is',null).lte('next_follow_up_at',now).not('pipeline_stage','in','(won,lost)'),
   db.from('messages').select('id',{count:'exact',head:true}).eq('organization_id',org).eq('status','pending_approval'),
   db.from('internal_system_config').select('openai_api_key,meta_app_id,meta_app_secret,ai_status,ai_last_error,ai_last_checked_at').eq('id',true).single()
  ])
  const trialEnds=o?.trial_ends_at?new Date(o.trial_ends_at):null,days=trialEnds?Math.max(0,Math.ceil((trialEnds.getTime()-Date.now())/86400000)):null
  return J({organization:{...o,trial_days_left:days},ai:{ready:!!((s?.company_context||'').trim()&&(s?.company_offer||'').trim()),engine_ready:!!cfg?.openai_api_key&&cfg?.ai_status!=='quota_exhausted',goal:s?.business_goal||'qualify',autonomy:s?.autonomy||'approval',tone:s?.tone||'professional',runtime_status:cfg?.ai_status||'unknown',last_error:cfg?.ai_last_error||null,last_checked_at:cfg?.ai_last_checked_at||null},capabilities:{messenger:!!(cfg?.meta_app_id&&cfg?.meta_app_secret),telegram:true},integrations:ints||[],usage:usage||{inbound_messages:0,outbound_messages:0,ai_drafts:0,hot_leads:0},metrics:{conversations:convCount||0,hot_leads:hotCount||0,pending_approvals:pendingCount||0,won_leads:wonCount||0,team_members:teamCount||0,due_followups:dueCount||0},user:{role:p.role,system_admin:p.system_admin}})
 }catch(e){return J({error:'internal_error'},500)}
})

