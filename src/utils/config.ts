import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({

    kickEmail: z.string(),
    kickPassword: z.string(),
    kick2FA: z.string(),
    kickChannel: z.string(),
    seChannelId: z.string(),
    seJWToken: z.string(),
    pajbotApi: z.string().url(),
    pajbotSession: z.string(),
    pajbotCsrfToken: z.string()

});

export const env = envSchema.parse(process.env);