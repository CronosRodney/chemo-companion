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
    const { oncotrack_user_id } = await req.json();

    // Validate that the authenticated user matches the requested user_id
    if (oncotrack_user_id !== user.id) {
      console.error('User ID mismatch:', { oncotrack_user_id, userId: user.id });
      return new Response(
        JSON.stringify({ success: false, error: 'ID de usuário não corresponde' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Completing connection for user:', user.id);

    // B2B handshake: Call Minha Caderneta to get the token
    const tokenResponse = await fetch(`${CADERNETA_API_URL}/oncotrack-get-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ oncotrack_user_id: user.id }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to get token from Minha Caderneta:', errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Conexão pendente não encontrada na Minha Caderneta. Por favor, autorize o acesso primeiro.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.connection_token) {
      console.error('No token in response:', tokenData);
      return new Response(
        JSON.stringify({ success: false, error: 'Token não recebido da Minha Caderneta' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Token received, saving connection...');

    // Create admin client to save connection
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Upsert connection in external_connections table
    const { error: insertError } = await supabaseAdmin
      .from('external_connections')
      .upsert({
        user_id: user.id,
        provider: 'minha_caderneta',
        connection_token: tokenData.connection_token,
        status: 'active',
        connected_at: new Date().toISOString(),
        metadata: tokenData.metadata || {},
      }, {
        onConflict: 'user_id,provider'
      });

    if (insertError) {
      console.error('Error saving connection:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao salvar conexão' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Connection saved successfully for user:', user.id);

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
