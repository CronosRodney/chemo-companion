import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CADERNETA_API_URL =
  'https://yzegsqdpltiiawbhoafo.supabase.co/functions/v1';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticação não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Parse e validar body
    const body = await req.json();
    const { name, date, dose, observations } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nome da vacina é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!date || typeof date !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Data é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!dose || typeof dose !== 'string' || dose.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Dose é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log('[create-vaccine] userId:', user.id, 'vaccine:', name);

    // Buscar conexão ativa
    const { data: connection, error: connError } = await supabase
      .from('external_connections')
      .select('id, connection_token')
      .eq('user_id', user.id)
      .eq('provider', 'minha_caderneta')
      .eq('status', 'active')
      .maybeSingle();

    if (connError) {
      console.error('[create-vaccine] Erro ao buscar conexão:', connError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar conexão' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!connection) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma conexão ativa com Minha Caderneta' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Chamar endpoint B2B da Minha Caderneta
    console.log('[create-vaccine] calling oncotrack-create-vaccine');
    const b2bResponse = await fetch(
      `${CADERNETA_API_URL}/oncotrack-create-vaccine`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${connection.connection_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          date,
          dose: dose.trim(),
          observations: observations?.trim() || null,
          source: 'oncotrack',
        }),
      },
    );

    console.log('[create-vaccine] B2B status:', b2bResponse.status);

    if (!b2bResponse.ok) {
      const errorText = await b2bResponse.text();
      console.error('[create-vaccine] B2B error:', errorText);
      return new Response(
        JSON.stringify({
          error: 'Erro ao criar vacina no parceiro',
          status: b2bResponse.status,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const result = await b2bResponse.json();
    console.log('[create-vaccine] B2B success:', JSON.stringify(result));

    return new Response(
      JSON.stringify({ success: true, vaccine: result }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[create-vaccine] Erro inesperado:', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
