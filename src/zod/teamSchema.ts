import { z } from 'zod';
import { participantsDBSchema } from './userSchema';

export const teamDBSchema = z.object({
  id: z.number().int().positive().optional(),
  teamName: z.string()
    .min(3, "Team name must be at least 3 characters long")
    .max(100, "Team name cannot exceed 100 characters"),
  leaderId: z.number().int().positive(),
  juryId: z.number().int().positive().nullable(),
  team: z.string().optional().nullable(),
  room: z.string().optional().nullable(),
  createdAt: z.date().default(() => new Date()).optional(),
  updatedAt: z.date().default(() => new Date()).optional(),
});

export type TeamDBType = z.infer<typeof teamDBSchema>;

export const teamDataSchema = teamDBSchema.extend({
  leaderId: participantsDBSchema,
  members: z.array(participantsDBSchema)
})

export type TeamDataType = z.infer<typeof teamDataSchema>