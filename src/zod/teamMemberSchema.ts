import { z } from 'zod';
import { teamDBSchema } from './teamSchema';
import { userDBSchema } from './userSchema';

export const teamMemberDBSchema = z.object({
  id: z.number().int().positive(),
  teamId: z.number().int().positive(),
  memberId: z.number().int().positive(),
  createdAt: z.date().default(() => new Date()).nullable(),
  updatedAt: z.date().default(() => new Date()).nullable(),
});

export type TeamMemberDBType = z.infer<typeof teamMemberDBSchema>;

export const teamMemberDataSchema = teamMemberDBSchema.extend({
  teamId: teamDBSchema,
  memberId: userDBSchema
})

export type TeamMemberDataType = z.infer<typeof teamMemberDataSchema>