import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackupRequest {
  action: 'create' | 'restore' | 'list';
  backup_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, backup_id }: BackupRequest = await req.json();

    if (action === 'create') {
      // Fetch all user data
      const [
        { data: profile },
        { data: events },
        { data: medications },
        { data: reminders },
        { data: treatmentPlans },
        { data: userStats }
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('events').select('*').eq('user_id', user.id),
        supabase.from('user_medications').select('*, medications(*)').eq('user_id', user.id),
        supabase.from('reminders').select('*').eq('user_id', user.id),
        supabase.from('treatment_plans').select('*, treatment_cycles(*), treatment_drugs(*)').eq('user_id', user.id),
        supabase.from('user_stats').select('*').eq('user_id', user.id).single()
      ]);

      const backup = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        user_id: user.id,
        version: '1.0',
        data: {
          profile,
          events,
          medications,
          reminders,
          treatment_plans: treatmentPlans,
          user_stats: userStats
        }
      };

      // In production, this would be stored in Supabase Storage or S3
      // For now, return the backup data directly
      console.log(`Backup created for user ${user.id}: ${backup.id}`);

      return new Response(
        JSON.stringify({
          success: true,
          backup_id: backup.id,
          created_at: backup.created_at,
          size_kb: Math.round(JSON.stringify(backup).length / 1024),
          download_data: backup
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'list') {
      // In production, this would list backups from storage
      return new Response(
        JSON.stringify({
          backups: [],
          message: 'Backup listing will be available when storage is configured'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'restore' && backup_id) {
      // In production, this would restore from storage
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Restore functionality requires backup storage configuration'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in user-backup:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
