import z from 'zod';

export const placeSearchFormSchema = z.object({
  type: z.string(),
  name: z.string().min(1),
  region: z.string(),
  district: z.string(),
});
