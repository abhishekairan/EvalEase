import { z } from 'zod';
import { teamDBSchema } from './teamSchema';
import { userDBSchema } from './userSchema';

export const teamMemberDBSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  teamId: z.coerce.number().int().positive(),
  memberId: z.coerce.number().int().positive(),
  createdAt: z.coerce.date().default(() => new Date()).nullable(),
  updatedAt: z.coerce.date().default(() => new Date()).nullable(),
});

export type TeamMemberDBType = z.infer<typeof teamMemberDBSchema>;

export const teamMemberDataSchema = teamMemberDBSchema.extend({
  teamId: teamDBSchema,
  memberId: userDBSchema
})

export type TeamMemberDataType = z.infer<typeof teamMemberDataSchema>