import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Emails de teste com domínio exclusivo (não podem ser usados em produção)
const TEST_ACCOUNTS = {
  patient: 'test-patient@oncotrack.dev',
  doctor: 'test-doctor@oncotrack.dev'
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // 🔒 TRAVA DURA: Só funciona se ENABLE_DEV_LOGIN === 'true'
  if (Deno.env.get('ENABLE_DEV_LOGIN') !== 'true') {
    console.error('[DEV-LOGIN] Blocked: ENABLE_DEV_LOGIN not enabled')
    return new Response(
      JSON.stringify({ error: 'Dev login is disabled in this environment' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { role } = await req.json()
    
    if (!role || !['patient', 'doctor'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Use "patient" or "doctor"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const email = TEST_ACCOUNTS[role as keyof typeof TEST_ACCOUNTS]
    console.log(`[DEV-LOGIN] Starting login for ${role}: ${email}`)

    // Cliente admin com service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Cliente regular para verifyOtp
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    )

    // 1. Buscar ou criar usuário
    let userId: string
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    if (existingUser) {
      userId = existingUser.id
      console.log(`[DEV-LOGIN] User exists: ${userId}`)
    } else {
      // 🔑 Criar usuário SEM SENHA (email confirmado automaticamente)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { role, is_test_account: true }
      })

      if (createError) throw createError
      userId = newUser.user.id
      console.log(`[DEV-LOGIN] User created: ${userId}`)
    }

    // 2. Garantir perfil existe
    if (role === 'patient') {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          user_id: userId,
          first_name: 'Paciente',
          last_name: 'Teste',
          email
        }, { onConflict: 'user_id' })
      
      if (profileError) console.error('[DEV-LOGIN] Profile error:', profileError)
      else console.log(`[DEV-LOGIN] Patient profile ensured for ${userId}`)
    } else {
      const { error: professionalError } = await supabaseAdmin
        .from('healthcare_professionals')
        .upsert({
          user_id: userId,
          first_name: 'Dr.',
          last_name: 'Teste',
          specialty: 'Oncologia Clínica',
          is_verified: true
        }, { onConflict: 'user_id' })
      
      if (professionalError) console.error('[DEV-LOGIN] Professional error:', professionalError)
      else console.log(`[DEV-LOGIN] Doctor profile ensured for ${userId}`)
    }

    // 3. Garantir role existe (apenas para médicos)
    if (role === 'doctor') {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: userId, role: 'doctor' }, { onConflict: 'user_id,role' })
      
      if (roleError) console.error('[DEV-LOGIN] Role error:', roleError)
      else console.log(`[DEV-LOGIN] Doctor role ensured for ${userId}`)
    }

    // 4. 🔑 Gerar sessão via magic link (SEM SENHA)
    console.log(`[DEV-LOGIN] Generating magic link for ${email}`)
    const { data: magicLink, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email
    })

    if (linkError || !magicLink?.properties?.hashed_token) {
      console.error('[DEV-LOGIN] Magic link error:', linkError)
      throw new Error('Failed to generate magic link: ' + (linkError?.message || 'No token returned'))
    }

    console.log(`[DEV-LOGIN] Magic link generated, verifying OTP...`)

    // 5. Verificar OTP para obter sessão
    const { data: session, error: verifyError } = await supabaseClient.auth.verifyOtp({
      token_hash: magicLink.properties.hashed_token,
      type: 'email'
    })

    if (verifyError || !session?.session) {
      console.error('[DEV-LOGIN] Verify OTP error:', verifyError)
      throw new Error('Failed to verify OTP: ' + (verifyError?.message || 'No session returned'))
    }

    console.log(`[DEV-LOGIN] ✅ Success: ${role} logged in as ${userId}`)

    return new Response(
      JSON.stringify({
        success: true,
        access_token: session.session.access_token,
        refresh_token: session.session.refresh_token,
        user: session.user
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[DEV-LOGIN] Error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
