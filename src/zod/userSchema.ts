import { z } from "zod";



// Base user schema
const baseUser = z.object({
    id: z.coerce.number().int().positive().optional(),
    name: z.coerce.string().min(2, "Name must be at least 2 characters long"),
    email: z.coerce.string().email("Invalid email format"),
    createdAt: z.coerce.date().default(() => new Date()).optional(),
    updatedAt: z.coerce.date().default(() => new Date()).optional(),
})



// Admin user Database Schema
export const adminDBSchema = baseUser.extend({
    password: z.coerce.string().optional(),
})
// Admin user database type
export type adminDBType = z.infer<typeof adminDBSchema>



// Jury user Database Schema
export const juryDBSchema = baseUser.extend({
    session: z.coerce.number().positive().nullable().optional(),
    phoneNumber: z.coerce.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format. Use international format."),
    password: z.coerce.string().optional(),
})
// juryAdmin user database type
export type juryDBType = z.infer<typeof juryDBSchema>



// Participant user database schema
export const participantsDBSchema = baseUser.extend({
    institude: z.coerce.string().min(2,"Institude Name must at least 2 characters long"),
    phoneNumber: z.coerce.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format. Use international format."),
});
// Participant user database type
export type participantsDBType = z.infer<typeof participantsDBSchema>;



// Participant with team schema
export const participantsWithTeamSchema = participantsDBSchema.extend({
    teamId: z.coerce.number().optional().nullable(),
    teamName: z.coerce.string().optional().nullable()
})
// Participant with team type
export type participantsWithTeamType = z.infer<typeof participantsWithTeamSchema>
