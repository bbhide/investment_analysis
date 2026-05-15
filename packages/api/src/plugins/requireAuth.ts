import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { isAuthed } from '../routes/auth.js';

/**
 * Adds a preHandler hook that requires a valid signed `inv_auth` cookie.
 * Wrapped in fastify-plugin so the hook bubbles up to the parent encapsulation
 * scope (otherwise it would only fire for routes registered inside this plugin).
 *
 * Use by wrapping the protected route group:
 *
 *   await api.register(async (protectedApi) => {
 *     await protectedApi.register(requireAuth);
 *     await protectedApi.register(scenarioRoutes);
 *   });
 */
async function requireAuthImpl(app: FastifyInstance) {
  app.addHook('preHandler', async (req, reply) => {
    if (!isAuthed(req as never)) {
      return reply.code(401).send({ error: 'unauthorized' });
    }
  });
}

export const requireAuth = fp(requireAuthImpl, { name: 'require-auth' });
