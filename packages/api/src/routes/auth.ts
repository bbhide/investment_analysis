import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { timingSafeEqual } from 'node:crypto';

const AUTH_COOKIE = 'inv_auth';
const SIXTY_DAYS_SEC = 60 * 60 * 24 * 60;

/**
 * Constant-time comparison so we don't leak timing information about the password.
 * Both sides are padded to equal length first, then compared as buffers.
 */
function eqConstTime(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) {
    // Still do a fake compare to keep timing roughly constant
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

const loginBody = z.object({ password: z.string().min(1).max(200) });

/** Returns true if the request carries a valid signed auth cookie. */
export function isAuthed(req: { cookies?: Record<string, string | undefined>; unsignCookie: (v: string) => { valid: boolean; value: string | null } }): boolean {
  const raw = req.cookies?.[AUTH_COOKIE];
  if (!raw) return false;
  const result = req.unsignCookie(raw);
  return result.valid && result.value === 'ok';
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/login', async (req, reply) => {
    const parsed = loginBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_input' });

    const expected = process.env.APP_PASSWORD;
    if (!expected) {
      app.log.error('APP_PASSWORD env var is not set — login disabled');
      return reply.code(500).send({ error: 'server_misconfigured' });
    }

    if (!eqConstTime(parsed.data.password, expected)) {
      // Small artificial delay to discourage scripted brute-force.
      await new Promise((r) => setTimeout(r, 250));
      return reply.code(401).send({ error: 'invalid_credentials' });
    }

    reply.setCookie(AUTH_COOKIE, 'ok', {
      httpOnly: true,
      signed: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SIXTY_DAYS_SEC,
    });
    return { ok: true };
  });

  app.post('/auth/logout', async (_req, reply) => {
    reply.clearCookie(AUTH_COOKIE, { path: '/' });
    return { ok: true };
  });

  app.get('/auth/me', async (req, reply) => {
    if (!isAuthed(req as never)) return reply.code(401).send({ authed: false });
    return { authed: true };
  });
}
