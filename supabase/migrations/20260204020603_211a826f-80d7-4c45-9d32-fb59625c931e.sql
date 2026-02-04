-- Tabela genérica para conexões com sistemas externos
CREATE TABLE IF NOT EXISTS public.external_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('minha_caderneta')),
  connection_token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_sync_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, provider)
);

-- Índices
CREATE INDEX idx_external_connections_user_provider 
  ON public.external_connections(user_id, provider);
CREATE INDEX idx_external_connections_status 
  ON public.external_connections(status);

-- RLS
ALTER TABLE public.external_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connections"
  ON public.external_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connections"
  ON public.external_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections"
  ON public.external_connections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at (usando função existente)
CREATE TRIGGER update_external_connections_updated_at
  BEFORE UPDATE ON public.external_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();