import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validação de CRM brasileiro
function validateCRM(crm: string): boolean {
  // CRM deve ter entre 4 e 10 dígitos
  const crmDigits = crm.replace(/\D/g, '');
  return crmDigits.length >= 4 && crmDigits.length <= 10;
}

// Validação de UF brasileiro
function validateUF(uf: string): boolean {
  const validUFs = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];
  return validUFs.includes(uf.toUpperCase());
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticação ausente' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar usuário autenticado
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse body
    const body = await req.json();
    const { first_name, last_name, crm, crm_uf, specialty } = body;

    // Validações obrigatórias
    if (!first_name || first_name.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Nome deve ter pelo menos 2 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!last_name || last_name.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Sobrenome deve ter pelo menos 2 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar CRM se fornecido
    if (crm && !validateCRM(crm)) {
      return new Response(
        JSON.stringify({ error: 'CRM inválido. Deve conter entre 4 e 10 dígitos.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar UF se fornecido
    if (crm_uf && !validateUF(crm_uf)) {
      return new Response(
        JSON.stringify({ error: 'UF inválida. Use uma sigla de estado brasileira válida.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se usuário é médico
    const { data: doctorProfile, error: profileError } = await supabase
      .from('healthcare_professionals')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !doctorProfile) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Perfil de médico não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar perfil
    const updateData: Record<string, any> = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      updated_at: new Date().toISOString(),
    };

    if (crm !== undefined) {
      updateData.crm = crm ? crm.replace(/\D/g, '') : null;
    }
    if (crm_uf !== undefined) {
      updateData.crm_uf = crm_uf ? crm_uf.toUpperCase() : null;
    }
    if (specialty !== undefined) {
      updateData.specialty = specialty ? specialty.trim() : null;
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('healthcare_professionals')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar perfil' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Doctor profile updated for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        profile: updatedProfile,
        message: 'Perfil atualizado com sucesso'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
