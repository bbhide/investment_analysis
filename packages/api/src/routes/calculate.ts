import type { FastifyInstance } from 'fastify';
import { inputsSchema, comparablesSchema } from '@inv/shared';
import { calculate, analyzeComparables } from '@inv/calc';
import { z } from 'zod';

const bodySchema = z.object({
  inputs: inputsSchema,
  comparables: comparablesSchema.optional(),
});

export async function calculateRoutes(app: FastifyInstance) {
  app.post('/calculate', async (req, reply) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'invalid_input', details: parsed.error.flatten() });
    }
    const { inputs, comparables } = parsed.data;
    const result = calculate(inputs);
    return reply.send({
      result,
      comparablesAnalysis: comparables ? analyzeComparables(comparables) : null,
    });
  });
}
