import { z } from 'zod';

export const userRole = z.enum(['admin', 'jury', 'student']);

export const userDBSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.coerce.string().min(2, "Name must be at least 2 characters long"),
  email: z.coerce.string().email("Invalid email format"),
  phoneNumber: z.coerce.string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format. Use international format."),
  role: userRole,
  createdAt: z.coerce.date().default(() => new Date()).nullable().optional(),
  updatedAt: z.coerce.date().default(() => new Date()).nullable().optional(),
});

export type UserDBType = z.infer<typeof userDBSchema>;

export const userWithTeamSchema = userDBSchema.extend({
  teamId: z.coerce.number().nullable().optional(),
  teamName: z.coerce.string().nullable().optional()
})

export type userWithTeamType = z.infer<typeof userWithTeamSchema>