import type { FastifyInstance } from 'fastify';
import { isAuthed } from '../routes/auth.js';

/**
 * Scoped plugin: any route registered inside this plugin instance requires a valid
 * signed `inv_auth` cookie. Use by wrapping the protected route group:
 *
 *   await api.register(async (g) => {
 *     await g.register(requireAuth);
 *     await g.register(scenarioRoutes);
 *   });
 *
 * Public endpoints (auth, calculate, health, shared) must be registered OUTSIDE this scope.
 */
export async function requireAuth(app: FastifyInstance) {
  app.addHook('preHandler', async (req, reply) => {
    if (!isAuthed(req as never)) {
      return reply.code(401).send({ error: 'unauthorized' });
    }
  });
}
