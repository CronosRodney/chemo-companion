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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    // Suportar contexto de médico: se patient_id for enviado, verificar vínculo
    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* empty body is OK */ }
    const requestedPatientId = body.patient_id as string | undefined;
    let targetUserId = user.id;

    if (requestedPatientId && requestedPatientId !== user.id) {
      // Verificar que o médico tem acesso ao paciente
      const adminClient = createClient(supabaseUrl, supabaseServiceKey);
      const { data: hasAccess } = await adminClient.rpc('doctor_has_patient_access', {
        _doctor_id: user.id,
        _patient_id: requestedPatientId,
      });
      if (!hasAccess) {
        return new Response(
          JSON.stringify({ error: 'Sem acesso a este paciente' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      targetUserId = requestedPatientId;
      console.log('[sync] doctor context: doctor=', user.id, 'patient=', targetUserId);
    }

    console.log('[sync] targetUserId:', targetUserId);

    // Buscar conexão ativa do paciente (usar service role quando em contexto de médico)
    const queryClient = requestedPatientId ? createClient(supabaseUrl, supabaseServiceKey) : supabase;
    const { data: connection, error: connError } = await queryClient
      .from('external_connections')
      .select('id, connection_token')
      .eq('user_id', targetUserId)
      .eq('provider', 'minha_caderneta')
      .eq('status', 'active')
      .maybeSingle();

    console.log('[sync] connection found:', !!connection);
    if (connection) {
      console.log('[sync] connection id:', connection.id);
      console.log('[sync] token length:', connection.connection_token?.length ?? 0);
    }

    if (connError) {
      console.error('[sync] Erro ao buscar conexão:', connError);
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
    console.log('[sync] calling oncotrack-get-vaccines');
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

    console.log('[sync] B2B status:', b2bResponse.status);

    if (!b2bResponse.ok) {
      const errorText = await b2bResponse.text();
      console.error('[sync] B2B error body:', errorText);
      return new Response(
        JSON.stringify({
          error: 'Erro ao obter dados vacinais do parceiro',
          status: b2bResponse.status,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const rawData = await b2bResponse.json();
    console.log('[sync] B2B raw body:', JSON.stringify(rawData));

    // Tentar extrair vacinas de diferentes formatos possíveis
    const vaccines = Array.isArray(rawData.vaccines)
      ? rawData.vaccines
      : Array.isArray(rawData.vaccinations)
        ? rawData.vaccinations
        : Array.isArray(rawData.data)
          ? rawData.data
          : [];

    // Gerar ID deterministico para cada vacina
    const vaccinesWithId = vaccines.map((v: Record<string, unknown>, i: number) => ({
      ...v,
      id: v.id || `${String(v.name || '')}-${String(v.date || '')}-${String(v.dose || '')}`.toLowerCase().replace(/\s+/g, '-') || `vaccine-${i}`,
    }));

    console.log('[sync] extracted vaccines array length:', vaccinesWithId.length);

    if (vaccinesWithId.length === 0) {
      console.warn('[sync] B2B returned empty vaccines array — keys in response:', Object.keys(rawData));
    }

    // Mapear para VaccinationSummary
    const totalVaccines = typeof rawData.total_vaccines === 'number'
      ? rawData.total_vaccines
      : typeof rawData.total === 'number'
        ? rawData.total
        : vaccinesWithId.length;

    const summary = {
      total_vaccines: totalVaccines,
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

    console.log('[sync] final summary:', JSON.stringify(summary));

    // Atualizar last_sync_at via client autenticado (RLS)
    await supabase
      .from('external_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connection.id);

    return new Response(
      JSON.stringify({
        connected: true,
        summary,
        vaccines: vaccinesWithId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('Erro inesperado:', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
