import { z } from 'zod';
import { userDBSchema } from './userSchema';

export const teamDBSchema = z.object({
  id: z.number().int().positive(),
  teamName: z.string()
    .min(3, "Team name must be at least 3 characters long")
    .max(100, "Team name cannot exceed 100 characters"),
  leaderId: z.number().int().positive(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type TeamDBType = z.infer<typeof teamDBSchema>;

export const teamDataSchema = teamDBSchema.extend({
  leaderId: userDBSchema,
  members: z.array(userDBSchema)
})

export type TeamDataType = z.infer<typeof teamDataSchema>