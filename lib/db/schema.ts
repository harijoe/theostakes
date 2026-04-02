import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export type VideoSummary = {
  oneLiner: string;
  keyTakeaways: Array<{ text: string }>;
  categories: string[];
};

export const videos = pgTable("videos", {
  vidId: text("vid_id").primaryKey(),
  title: text("title").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  previewImage: text("preview_image").notNull(),
  url: text("url").notNull(),
  transcript: text("transcript"),
  summary: jsonb("summary").$type<VideoSummary>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
