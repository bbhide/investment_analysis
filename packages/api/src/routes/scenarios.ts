import type { FastifyInstance } from 'fastify';
import { scenarioCreateSchema, scenarioUpdateSchema, type Inputs } from '@inv/shared';
import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { randomBytes } from 'node:crypto';

function listItem(s: {
  id: string;
  name: string;
  currency: string;
  inputs: unknown;
  updatedAt: Date;
}) {
  const inputs = s.inputs as Inputs;
  return {
    id: s.id,
    name: s.name,
    currency: s.currency,
    address: inputs?.property?.address ?? '',
    totalPurchasePrice: inputs?.property?.totalPurchasePrice ?? 0,
    holdingPeriodYears: inputs?.property?.holdingPeriodYears ?? 0,
    updatedAt: s.updatedAt.toISOString(),
  };
}

export async function scenarioRoutes(app: FastifyInstance) {
  app.get('/scenarios', async (req) => {
    const rows = await prisma.scenario.findMany({
      where: { workspaceId: req.workspaceId },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map(listItem);
  });

  app.post('/scenarios', async (req, reply) => {
    const parsed = scenarioCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_input', details: parsed.error.flatten() });
    }
    const created = await prisma.scenario.create({
      data: {
        workspaceId: req.workspaceId,
        name: parsed.data.name,
        currency: parsed.data.currency,
        inputs: parsed.data.inputs,
        comparables: parsed.data.comparables ?? undefined,
      },
    });
    return reply.code(201).send(serialize(created));
  });

  app.get<{ Params: { id: string } }>('/scenarios/:id', async (req, reply) => {
    const row = await prisma.scenario.findUnique({ where: { id: req.params.id } });
    if (!row || row.workspaceId !== req.workspaceId) {
      return reply.code(404).send({ error: 'not_found' });
    }
    return serialize(row);
  });

  app.put<{ Params: { id: string } }>('/scenarios/:id', async (req, reply) => {
    const parsed = scenarioUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_input', details: parsed.error.flatten() });
    }
    const existing = await prisma.scenario.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.workspaceId !== req.workspaceId) {
      return reply.code(404).send({ error: 'not_found' });
    }
    const updated = await prisma.scenario.update({
      where: { id: req.params.id },
      data: {
        name: parsed.data.name ?? existing.name,
        currency: parsed.data.currency ?? existing.currency,
        inputs: (parsed.data.inputs ?? (existing.inputs as Prisma.InputJsonValue)) as Prisma.InputJsonValue,
        comparables:
          parsed.data.comparables === undefined
            ? ((existing.comparables ?? Prisma.JsonNull) as Prisma.InputJsonValue | typeof Prisma.JsonNull)
            : (parsed.data.comparables as Prisma.InputJsonValue),
      },
    });
    return serialize(updated);
  });

  app.delete<{ Params: { id: string } }>('/scenarios/:id', async (req, reply) => {
    const existing = await prisma.scenario.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.workspaceId !== req.workspaceId) {
      return reply.code(404).send({ error: 'not_found' });
    }
    await prisma.scenario.delete({ where: { id: req.params.id } });
    return reply.code(204).send();
  });

  app.post<{ Params: { id: string } }>('/scenarios/:id/share', async (req, reply) => {
    const existing = await prisma.scenario.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.workspaceId !== req.workspaceId) {
      return reply.code(404).send({ error: 'not_found' });
    }
    const token = existing.shareToken ?? randomBytes(24).toString('base64url');
    const updated = await prisma.scenario.update({
      where: { id: req.params.id },
      data: { shareToken: token },
    });
    return { shareToken: updated.shareToken };
  });

  app.delete<{ Params: { id: string } }>('/scenarios/:id/share', async (req, reply) => {
    const existing = await prisma.scenario.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.workspaceId !== req.workspaceId) {
      return reply.code(404).send({ error: 'not_found' });
    }
    await prisma.scenario.update({ where: { id: req.params.id }, data: { shareToken: null } });
    return reply.code(204).send();
  });
}

export async function sharedRoutes(app: FastifyInstance) {
  app.get<{ Params: { token: string } }>('/shared/:token', async (req, reply) => {
    const row = await prisma.scenario.findUnique({ where: { shareToken: req.params.token } });
    if (!row) return reply.code(404).send({ error: 'not_found' });
    return {
      id: row.id,
      name: row.name,
      currency: row.currency,
      inputs: row.inputs,
      comparables: row.comparables,
    };
  });
}

function serialize(row: {
  id: string;
  name: string;
  currency: string;
  inputs: unknown;
  comparables: unknown;
  shareToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    currency: row.currency,
    inputs: row.inputs,
    comparables: row.comparables,
    shareToken: row.shareToken,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
