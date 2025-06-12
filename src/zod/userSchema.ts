import { z } from 'zod';

export const userRole = z.enum(['admin', 'jury', 'student']);

export const userDBSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Invalid email format"),
  phoneNumber: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format. Use international format."),
  role: userRole,
  createdAt: z.date().default(() => new Date()).nullable(),
  updatedAt: z.date().default(() => new Date()).nullable(),
});

export type UserDBType = z.infer<typeof userDBSchema>;
