import { z } from 'zod';
import { teamDBSchema } from './teamSchema';
import { juryDBSchema, participantsDBSchema } from './userSchema';
import { sessionDBSchema } from './sessionSchema';

export const marksDBSchema = z.object({
  id: z.number().int().positive(),
  teamId: z.number().int().positive(),
  juryId: z.number().int().positive(),
  innovationScore: z.number().int().min(-1).max(10).default(-1),
  presentationScore: z.number().int().min(-1).max(10).default(-1),
  technicalScore: z.number().int().min(-1).max(10).default(-1),
  impactScore: z.number().int().min(-1).max(10).default(-1),
  session: z.number().int().positive(),
  submitted: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()).optional(),
  updatedAt: z.date().default(() => new Date()).optional(),
});

export type MarksDBType = z.infer<typeof marksDBSchema>;

export const marksDataSchema = marksDBSchema.extend({
  teamId: teamDBSchema,
  juryId: juryDBSchema,
  session: sessionDBSchema
})

export type MarksDataType = z.infer<typeof marksDataSchema>