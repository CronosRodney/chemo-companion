import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticação não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { invite_id } = await req.json();
    
    if (!invite_id) {
      return new Response(
        JSON.stringify({ error: 'invite_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // User client - to validate the authenticated user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user using getUser() - the correct method
    const { data: userData, error: userError } = await userClient.auth.getUser();
    
    if (userError || !userData?.user) {
      console.error('[REJECT-INVITE] Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email;

    if (!userEmail) {
      console.error('[REJECT-INVITE] User has no email');
      return new Response(
        JSON.stringify({ error: 'Usuário sem email cadastrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[REJECT-INVITE] User ${userId} (${userEmail}) rejecting invite ${invite_id}`);

    // Service role client - for atomic database operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch the invite and validate
    const { data: invite, error: inviteError } = await adminClient
      .from('connection_invites')
      .select('id, doctor_user_id, patient_email, status')
      .eq('id', invite_id)
      .single();

    if (inviteError || !invite) {
      console.error('[REJECT-INVITE] Invite not found:', inviteError);
      return new Response(
        JSON.stringify({ error: 'Convite não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validate that the authenticated user is the patient (by email)
    if (invite.patient_email.toLowerCase() !== userEmail.toLowerCase()) {
      console.error(`[REJECT-INVITE] Email mismatch: invite=${invite.patient_email}, user=${userEmail}`);
      return new Response(
        JSON.stringify({ error: 'Este convite não pertence a você' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Check invite status
    if (invite.status !== 'pending') {
      console.log(`[REJECT-INVITE] Invite already processed: ${invite.status}`);
      return new Response(
        JSON.stringify({ error: `Convite já foi ${invite.status === 'rejected' ? 'recusado' : 'processado'}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. ATOMIC OPERATIONS with service_role

    // 4a. Update invite status to rejected
    const { error: updateInviteError } = await adminClient
      .from('connection_invites')
      .update({ status: 'rejected' })
      .eq('id', invite_id);

    if (updateInviteError) {
      console.error('[REJECT-INVITE] Failed to update invite:', updateInviteError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar convite' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4b. Create rejected connection record (for history/spam prevention)
    const { error: connectionError } = await adminClient
      .from('patient_doctor_connections')
      .upsert(
        {
          patient_user_id: userId,
          doctor_user_id: invite.doctor_user_id,
          status: 'rejected',
          connected_at: null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'patient_user_id,doctor_user_id',
        }
      );

    if (connectionError) {
      console.error('[REJECT-INVITE] Failed to create rejection record:', connectionError);
      // Don't rollback - the invite rejection is more important than the history record
    }

    console.log(`[REJECT-INVITE] ✅ Success: Patient ${userId} rejected doctor ${invite.doctor_user_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Solicitação recusada'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[REJECT-INVITE] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
