import { z } from 'zod';

export const stockSymbolSchema = z.string().min(1).max(10).toUpperCase();
export const scoreSchema = z.number().min(0).max(100);
export const percentageSchema = z.number().min(0).max(1);
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
