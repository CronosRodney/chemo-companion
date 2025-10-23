// Rate limiter para edge functions
// Previne abuso de chamadas caras à OpenAI API

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function checkRateLimit(
  userId: string,
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const userLimit = rateLimits.get(userId);

  // Se não tem registro ou janela expirou, cria novo
  if (!userLimit || now > userLimit.resetAt) {
    const resetAt = now + config.windowMs;
    rateLimits.set(userId, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }

  // Se atingiu o limite
  if (userLimit.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: userLimit.resetAt,
    };
  }

  // Incrementa contador
  userLimit.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - userLimit.count,
    resetAt: userLimit.resetAt,
  };
}

// Limpa entradas antigas a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [userId, entry] of rateLimits.entries()) {
    if (now > entry.resetAt + 300000) {
      // 5 min após reset
      rateLimits.delete(userId);
    }
  }
}, 300000);
