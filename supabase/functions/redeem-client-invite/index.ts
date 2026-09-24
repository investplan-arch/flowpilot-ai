import { createClient } from 'npm:@supabase/supabase-js@2';

const headers={
  'Access-Control-Allow-Origin':'https://flowpilot-ai-app.onrender.com',
  'Access-Control-Allow-Headers':'apikey,content-type',
  'Access-Control-Allow-Methods':'POST,OPTIONS',
  'Cache-Control':'no-store',
  'Content-Type':'application/json'
};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
const digest=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');

Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers});
  if(req.method!=='POST')return json({error:'method_not_allowed'},405);
  if(req.headers.get('origin')!=='https://flowpilot-ai-app.onrender.com')return json({error:'origin_not_allowed'},403);
  try{
    const body=await req.json().catch(()=>({}));
    const token=String(body.invite_token||'').trim();
    const email=String(body.email||'').trim().toLowerCase();
    const password=String(body.password||'');
    const fullName=String(body.full_name||'').trim().slice(0,180);
    if(!/^[a-f0-9]{64}$/.test(token)||email.length>254||!/^\S+@\S+\.\S+$/.test(email)||password.length<12||password.length>128||!fullName)return json({error:'invalid_form'},400);

    const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
    const tokenHash=await digest(token);
    const {data:invite}=await db.from('internal_client_invites').select('company_name,email').eq('token_hash',tokenHash).is('used_at',null).gt('expires_at',new Date().toISOString()).maybeSingle();
    if(!invite||!invite.email||invite.email.toLowerCase()!==email)return json({error:'invalid_or_expired_invite'},400);

    const {data:allowed,error:rateError}=await db.rpc('consume_public_lead_rate_limit_internal',{p_key:await digest('invite-redeem:'+tokenHash),p_limit:5,p_window_seconds:900});
    if(rateError||!allowed)return json({error:'too_many_attempts'},429);

    // The administrator addressed this one-use invitation to a specific mailbox.
    // Admin provisioning avoids the project's exhausted email-sending quota.
    const {error}=await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{invite_token:token,company_name:invite.company_name,full_name:fullName}});
    if(error){
      console.error('invite_activation_failed',error.code||error.status||'auth_error');
      return json({error:'activation_failed'},400);
    }
    return json({ok:true});
  }catch(e){console.error('invite_activation_exception',e instanceof Error?e.name:'unknown');return json({error:'internal_error'},500)}
});
