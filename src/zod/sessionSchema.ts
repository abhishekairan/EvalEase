import { z } from 'zod';

export const sessionDBSchema = z.object({
    id: z.coerce.number().positive().optional(),
    name: z.coerce.string().min(2,"Name should atleast be 2 character long").max(255,"Session Name can not be longer than 255 characters"),
    startedAt: z.coerce.date().default(()=> new Date()).nullable().optional(),
    endedAt: z.coerce.date().default(()=> new Date()).nullable().optional(),
    isDraft: z.boolean().default(true).optional(),
    publishedAt: z.coerce.date().nullable().optional(),
    createdAt: z.coerce.date().default(() => new Date()).optional(),
    updatedAt: z.coerce.date().default(() => new Date()).optional(),
})

export type sessionDBType = z.infer<typeof sessionDBSchema> 