// @ts-check
// 節慶 JSON schema：在瀏覽器與 Node script 都能直接 import（ESM）。
import { z } from 'zod';

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?([+-]\d{2}:?\d{2}|Z)$/;

const isoDateTime = z
  .string()
  .regex(ISO_DATETIME, { message: '必須是 ISO 8601 含時區的時間字串，例如 2026-03-21T12:30:00+08:00' });

export const performanceSchema = z.object({
  artist: z.string().min(1),
  start: isoDateTime,
  end: isoDateTime,
  description: z.string().optional(),
});

export const stageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  performances: z.array(performanceSchema),
});

// theme 是 UI hint，不做嚴格驗證；允許空字串、缺欄位、純色名等等。
export const themeSchema = z.object({
  primary: z.string().optional().default(''),
  secondary: z.string().optional().default(''),
  generated: z.boolean().optional().default(false),
});

export const locationSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number().finite().optional().default(0),
  longitude: z.number().finite().optional().default(0),
});

export const mapSchema = z.object({
  image: z.string().optional().default(''),
  notes: z.array(z.any()).optional().default([]),
});

export const festivalSchema = z.object({
  festivalId: z.string().regex(/^[a-z0-9-]+$/, '只能用小寫英文、數字、-'),
  name: z.string().min(1),
  startTime: isoDateTime,
  endTime: isoDateTime,
  theme: themeSchema.optional().default({ primary: '', secondary: '', generated: false }),
  location: locationSchema,
  stages: z.array(stageSchema).min(1),
  map: mapSchema.optional().default({ image: '', notes: [] }),
  contributors: z.array(z.string()).optional().default([]),
});

/** @typedef {import('zod').infer<typeof festivalSchema>} Festival */
/** @typedef {import('zod').infer<typeof stageSchema>} Stage */
/** @typedef {import('zod').infer<typeof performanceSchema>} Performance */
