import 'dotenv/config';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import { workspacePlugin } from './plugins/workspace.js';
import { requireAuth } from './plugins/requireAuth.js';
import { calculateRoutes } from './routes/calculate.js';
import { scenarioRoutes, sharedRoutes } from './routes/scenarios.js';
import { authRoutes } from './routes/auth.js';

async function build() {
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } });

  await app.register(cors, {
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(','),
    credentials: true,
  });
  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET ?? 'dev-secret-change-me',
  });
  await app.register(workspacePlugin);

  app.get('/api/health', async () => ({ ok: true }));

  await app.register(
    async (api) => {
      // ===== Public routes (no auth cookie required) =====
      await api.register(authRoutes);          // /auth/login, /auth/logout, /auth/me
      await api.register(calculateRoutes);     // /calculate (stateless math)
      await api.register(sharedRoutes);        // /shared/:token (read-only public)

      // ===== Protected routes (require valid inv_auth cookie) =====
      await api.register(async (protectedApi) => {
        await protectedApi.register(requireAuth);
        await protectedApi.register(scenarioRoutes); // /scenarios CRUD + share token issuance
      });
    },
    { prefix: '/api' },
  );

  return app;
}

const port = Number(process.env.PORT ?? 3000);
build()
  .then((app) =>
    app.listen({ port, host: '0.0.0.0' }).then(() => {
      app.log.info(`api listening on http://localhost:${port}`);
    }),
  )
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
