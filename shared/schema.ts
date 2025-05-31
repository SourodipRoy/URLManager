import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const resolvedUrls = pgTable("resolved_urls", {
  id: serial("id").primaryKey(),
  originalUrl: text("original_url").notNull(),
  resolvedUrl: text("resolved_url").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertResolvedUrlSchema = createInsertSchema(resolvedUrls).pick({
  originalUrl: true,
  resolvedUrl: true,
});

export type InsertResolvedUrl = z.infer<typeof insertResolvedUrlSchema>;
export type ResolvedUrl = typeof resolvedUrls.$inferSelect;

// URL resolution request schema
export const urlResolveSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

export type UrlResolveRequest = z.infer<typeof urlResolveSchema>;

// File analysis schemas
export const fileAnalysisSchema = z.object({
  totalLines: z.number(),
  uniqueLines: z.number(),
  duplicateLines: z.number(),
  urls: z.array(z.string()),
});

export type FileAnalysis = z.infer<typeof fileAnalysisSchema>;

export const fileMergeSchema = z.object({
  files: z.array(z.string()),
  filename: z.string().optional(),
});

export type FileMergeRequest = z.infer<typeof fileMergeSchema>;
