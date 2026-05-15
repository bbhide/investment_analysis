import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { randomUUID } from 'node:crypto';

const COOKIE_NAME = 'inv_ws';
const ONE_YEAR_SEC = 60 * 60 * 24 * 365;

declare module 'fastify' {
  interface FastifyRequest {
    workspaceId: string;
  }
}

/**
 * Issues an anonymous workspaceId via httpOnly cookie on first hit.
 * Wrapped in fastify-plugin so the onRequest hook fires for sibling-registered routes
 * (the /api routes are registered in a separate `app.register(...)` and would otherwise
 * be in their own encapsulation scope).
 */
async function workspacePluginImpl(app: FastifyInstance) {
  app.addHook('onRequest', async (req: FastifyRequest, reply) => {
    let id = req.cookies?.[COOKIE_NAME];
    if (!id) {
      id = randomUUID();
      reply.setCookie(COOKIE_NAME, id, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: ONE_YEAR_SEC,
      });
    }
    req.workspaceId = id;
  });
}

export const workspacePlugin = fp(workspacePluginImpl, { name: 'workspace' });
