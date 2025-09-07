import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const repositories = pgTable("repositories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  gitUrl: text("git_url").notNull(),
  provider: text("provider").notNull(), // github, gitlab, etc
  accessToken: text("access_token"),
  webhookUrl: text("webhook_url"),
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const commits = pgTable("commits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").references(() => repositories.id),
  commitHash: text("commit_hash").notNull(),
  message: text("message").notNull(),
  author: text("author").notNull(),
  authorEmail: text("author_email"),
  timestamp: timestamp("timestamp").notNull(),
  filesChanged: jsonb("files_changed"), // array of file paths
  diff: text("diff"), // git diff content
  createdAt: timestamp("created_at").defaultNow(),
});

export const wikiPages = pgTable("wiki_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").references(() => repositories.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  path: text("path").notNull(),
  lastModified: timestamp("last_modified"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documentationSuggestions = pgTable("documentation_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").references(() => repositories.id),
  commitId: varchar("commit_id").references(() => commits.id),
  functionName: text("function_name"),
  className: text("class_name"),
  fileName: text("file_name").notNull(),
  suggestedContent: text("suggested_content").notNull(),
  status: text("status").default("pending"), // pending, accepted, rejected, modified
  confidence: integer("confidence"), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  message: text("message").notNull(),
  response: text("response"),
  isFromUser: boolean("is_from_user").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const analysisResults = pgTable("analysis_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").references(() => repositories.id),
  type: text("type").notNull(), // missing_docs, process_improvement, release_notes
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const repositoriesRelations = relations(repositories, ({ many }) => ({
  commits: many(commits),
  wikiPages: many(wikiPages),
  documentationSuggestions: many(documentationSuggestions),
  analysisResults: many(analysisResults),
}));

export const commitsRelations = relations(commits, ({ one, many }) => ({
  repository: one(repositories, {
    fields: [commits.repositoryId],
    references: [repositories.id],
  }),
  documentationSuggestions: many(documentationSuggestions),
}));

export const wikiPagesRelations = relations(wikiPages, ({ one }) => ({
  repository: one(repositories, {
    fields: [wikiPages.repositoryId],
    references: [repositories.id],
  }),
}));

export const documentationSuggestionsRelations = relations(documentationSuggestions, ({ one }) => ({
  repository: one(repositories, {
    fields: [documentationSuggestions.repositoryId],
    references: [repositories.id],
  }),
  commit: one(commits, {
    fields: [documentationSuggestions.commitId],
    references: [commits.id],
  }),
}));

export const analysisResultsRelations = relations(analysisResults, ({ one }) => ({
  repository: one(repositories, {
    fields: [analysisResults.repositoryId],
    references: [repositories.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertRepositorySchema = createInsertSchema(repositories).pick({
  name: true,
  description: true,
  gitUrl: true,
  provider: true,
  accessToken: true,
});

export const insertCommitSchema = createInsertSchema(commits).pick({
  repositoryId: true,
  commitHash: true,
  message: true,
  author: true,
  authorEmail: true,
  timestamp: true,
  filesChanged: true,
  diff: true,
});

export const insertWikiPageSchema = createInsertSchema(wikiPages).pick({
  repositoryId: true,
  title: true,
  content: true,
  path: true,
  lastModified: true,
});

export const insertDocumentationSuggestionSchema = createInsertSchema(documentationSuggestions).pick({
  repositoryId: true,
  commitId: true,
  functionName: true,
  className: true,
  fileName: true,
  suggestedContent: true,
  confidence: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  message: true,
  response: true,
  isFromUser: true,
});

// Schema for client requests (only message needed)
export const clientChatMessageSchema = createInsertSchema(chatMessages).pick({
  message: true,
});

export const insertAnalysisResultSchema = createInsertSchema(analysisResults).pick({
  repositoryId: true,
  type: true,
  content: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertRepository = z.infer<typeof insertRepositorySchema>;
export type Repository = typeof repositories.$inferSelect;

export type InsertCommit = z.infer<typeof insertCommitSchema>;
export type Commit = typeof commits.$inferSelect;

export type InsertWikiPage = z.infer<typeof insertWikiPageSchema>;
export type WikiPage = typeof wikiPages.$inferSelect;

export type InsertDocumentationSuggestion = z.infer<typeof insertDocumentationSuggestionSchema>;
export type DocumentationSuggestion = typeof documentationSuggestions.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertAnalysisResult = z.infer<typeof insertAnalysisResultSchema>;
export type AnalysisResult = typeof analysisResults.$inferSelect;
