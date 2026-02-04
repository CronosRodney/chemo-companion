import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CADERNETA_API_URL = 'https://yzegsqdpltiiawbhoafo.supabase.co/functions/v1';

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token de autenticação não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create client with user's auth
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { connection_token } = await req.json();

    if (!connection_token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token de conexão não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Disconnecting Minha Caderneta for user:', user.id);

    // B2B call: Notify Minha Caderneta to revoke the connection
    try {
      const revokeResponse = await fetch(`${CADERNETA_API_URL}/oncotrack-disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-oncotrack-token': connection_token,
        },
      });

      if (!revokeResponse.ok) {
        console.warn('Failed to notify Minha Caderneta of disconnection:', await revokeResponse.text());
        // Continue anyway - we'll revoke locally
      } else {
        console.log('Minha Caderneta notified of disconnection');
      }
    } catch (fetchError) {
      console.warn('Error calling Minha Caderneta disconnect:', fetchError);
      // Continue anyway - we'll revoke locally
    }

    // Create admin client to update connection
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Update connection status to revoked
    const { error: updateError } = await supabaseAdmin
      .from('external_connections')
      .update({ 
        status: 'revoked',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('provider', 'minha_caderneta')
      .eq('connection_token', connection_token);

    if (updateError) {
      console.error('Error updating connection status:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao atualizar status da conexão' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Connection revoked successfully for user:', user.id);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
