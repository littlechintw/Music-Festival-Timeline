// Festival JSON schema (Zod)
import { z } from 'zod';

export const festivalSchema = z.object({
  festivalId: z.string(),
  name: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  logo: z.string(),
  theme: z.object({
    primary: z.string(),
    secondary: z.string(),
    generated: z.boolean(),
  }),
  location: z.object({
    name: z.string(),
    address: z.string(),
    latitude: z.number(),
    longitude: z.number(),
  }),
  stages: z.array(z.object({
    id: z.string(),
    name: z.string(),
    performances: z.array(z.object({
      artist: z.string(),
      start: z.string(),
      end: z.string(),
      description: z.string().optional(),
    })),
  })),
  map: z.object({
    image: z.string(),
    notes: z.array(z.any()),
  }),
});
