// Helpers de autenticação para edge functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

export async function getUserFromRequest(req: Request): Promise<{ userId: string | null; error: string | null }> {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return { userId: null, error: 'Token de autenticação não fornecido' };
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { userId: null, error: 'Token inválido ou expirado' };
    }

    return { userId: user.id, error: null };
  } catch (error) {
    return { userId: null, error: 'Erro ao validar autenticação' };
  }
}
