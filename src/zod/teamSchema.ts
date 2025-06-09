import { z } from 'zod';

export const teamSchema = z.object({
  id: z.number().int().positive(),
  teamName: z.string()
    .min(3, "Team name must be at least 3 characters long")
    .max(100, "Team name cannot exceed 100 characters"),
  leaderId: z.number().int().positive(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type TeamDBType = z.infer<typeof teamSchema>;
