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

    // Client autenticado – respeita RLS, sem service role
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

    // Buscar conexão ativa via RLS
    const { data: connection, error: connError } = await supabase
      .from('external_connections')
      .select('id, connection_token')
      .eq('user_id', user.id)
      .eq('provider', 'minha_caderneta')
      .eq('status', 'active')
      .maybeSingle();

    if (connError) {
      console.error('Erro ao buscar conexão:', connError);
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

    // Fetch B2B para endpoint protegido do projeto parceiro
    const b2bResponse = await fetch(
      `${CADERNETA_API_URL}/oncotrack-get-vaccines`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${connection.connection_token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!b2bResponse.ok) {
      const errorText = await b2bResponse.text();
      console.error('Erro B2B:', b2bResponse.status, errorText);
      return new Response(
        JSON.stringify({
          error: 'Erro ao obter dados vacinais do parceiro',
          status: b2bResponse.status,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const rawData = await b2bResponse.json();

    // Validar e mapear resposta para VaccinationSummary
    const summary = {
      total_vaccines: typeof rawData.total_vaccines === 'number' ? rawData.total_vaccines : 0,
      up_to_date: typeof rawData.up_to_date === 'number' ? rawData.up_to_date : 0,
      pending: typeof rawData.pending === 'number' ? rawData.pending : 0,
      overdue: typeof rawData.overdue === 'number' ? rawData.overdue : 0,
      last_updated: rawData.last_updated || new Date().toISOString(),
      clinical_alerts: Array.isArray(rawData.clinical_alerts)
        ? rawData.clinical_alerts.map((a: Record<string, unknown>) => ({
            id: String(a.id ?? ''),
            source: a.source === 'oncotrack' ? 'oncotrack' : 'minha_caderneta',
            type: ['warning', 'info', 'critical'].includes(String(a.type))
              ? String(a.type)
              : 'info',
            message: String(a.message ?? ''),
            created_at: String(a.created_at ?? new Date().toISOString()),
          }))
        : [],
    };

    // Atualizar last_sync_at via client autenticado (RLS)
    await supabase
      .from('external_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connection.id);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Erro inesperado:', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
