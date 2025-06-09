import { z } from 'zod';

export const teamMemberDBSchema = z.object({
  id: z.number().int().positive(),
  teamId: z.number().int().positive(),
  memberId: z.number().int().positive(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type TeamMemberDBType = z.infer<typeof teamMemberDBSchema>;
