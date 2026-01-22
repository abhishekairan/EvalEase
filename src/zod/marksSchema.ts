import { z } from 'zod';
import { teamDBSchema } from './teamSchema';
import { juryDBSchema } from './userSchema';
import { sessionDBSchema } from './sessionSchema';

export const marksDBSchema = z.object({
  id: z.number().int().positive(),
  teamId: z.number().int().positive(),
  juryId: z.number().int().positive(),
  feasibilityScore: z.number().int().min(-1,"Marks should range between 0-25").max(25).default(-1),
  techImplementationScore: z.number().int().min(-1,"Marks should range between 0-25").max(25).default(-1),
  innovationCreativityScore: z.number().int().min(-1,"Marks should range between 0-25").max(25).default(-1),
  problemRelevanceScore: z.number().int().min(-1,"Marks should range between 0-25").max(25).default(-1),
  session: z.number().int().positive(),
  submitted: z.boolean().default(false),
  locked: z.boolean().default(false),
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

export const MarksFormSchema = z.object({
  feasibilityScore: z.number().int().min(-1,"Marks should range between 0-25").max(25).default(-1),
  techImplementationScore: z.number().int().min(-1,"Marks should range between 0-25").max(25).default(-1),
  innovationCreativityScore: z.number().int().min(-1,"Marks should range between 0-25").max(25).default(-1),
  problemRelevanceScore: z.number().int().min(-1,"Marks should range between 0-25").max(25).default(-1),
});

export type MarksFormData = z.infer<typeof MarksFormSchema>;