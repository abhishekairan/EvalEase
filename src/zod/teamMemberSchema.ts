import { z } from 'zod';
import { teamDBSchema } from './teamSchema';
import { participantsDBSchema } from './userSchema';

export const teamMemberDBSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  teamId: z.coerce.number().int().positive(),
  memberId: z.coerce.number().int().positive(),
  createdAt: z.coerce.date().default(() => new Date()).optional(),
  updatedAt: z.coerce.date().default(() => new Date()).optional(),
});

export type TeamMemberDBType = z.infer<typeof teamMemberDBSchema>;

export const teamMemberDataSchema = teamMemberDBSchema.extend({
  teamId: teamDBSchema,
  memberId: participantsDBSchema
})

export type TeamMemberDataType = z.infer<typeof teamMemberDataSchema>