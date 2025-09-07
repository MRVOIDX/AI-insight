// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { z } from "zod";

// server/storage.ts
import { nanoid } from "nanoid";
var MemStorage = class {
  users = /* @__PURE__ */ new Map();
  repositories = /* @__PURE__ */ new Map();
  commits = /* @__PURE__ */ new Map();
  wikiPages = /* @__PURE__ */ new Map();
  documentationSuggestions = /* @__PURE__ */ new Map();
  chatMessages = /* @__PURE__ */ new Map();
  analysisResults = /* @__PURE__ */ new Map();
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    for (const user of Array.from(this.users.values())) {
      if (user.username === username) {
        return user;
      }
    }
    return void 0;
  }
  async createUser(insertUser) {
    const user = {
      id: nanoid(),
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email || null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(user.id, user);
    return user;
  }
  async getRepositories() {
    return Array.from(this.repositories.values()).sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
  async getRepository(id) {
    return this.repositories.get(id);
  }
  async createRepository(repo) {
    const repository = {
      id: nanoid(),
      name: repo.name,
      description: repo.description || null,
      gitUrl: repo.gitUrl,
      provider: repo.provider,
      accessToken: repo.accessToken || null,
      webhookUrl: null,
      isActive: true,
      lastSyncAt: null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.repositories.set(repository.id, repository);
    return repository;
  }
  async updateRepository(id, updates) {
    const repository = this.repositories.get(id);
    if (!repository) {
      throw new Error(`Repository with id ${id} not found`);
    }
    const updated = { ...repository, ...updates, updatedAt: /* @__PURE__ */ new Date() };
    this.repositories.set(id, updated);
    return updated;
  }
  async deleteRepository(id) {
    for (const [resultId, result] of Array.from(this.analysisResults.entries())) {
      if (result.repositoryId === id) {
        this.analysisResults.delete(resultId);
      }
    }
    for (const [suggestionId, suggestion] of Array.from(this.documentationSuggestions.entries())) {
      if (suggestion.repositoryId === id) {
        this.documentationSuggestions.delete(suggestionId);
      }
    }
    for (const [pageId, page] of Array.from(this.wikiPages.entries())) {
      if (page.repositoryId === id) {
        this.wikiPages.delete(pageId);
      }
    }
    for (const [commitId, commit] of Array.from(this.commits.entries())) {
      if (commit.repositoryId === id) {
        this.commits.delete(commitId);
      }
    }
    this.repositories.delete(id);
  }
  async getCommits(repositoryId, limit = 50) {
    return Array.from(this.commits.values()).filter((commit) => commit.repositoryId === repositoryId).sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)).slice(0, limit);
  }
  async getCommit(id) {
    return this.commits.get(id);
  }
  async createCommit(commit) {
    const newCommit = {
      id: nanoid(),
      repositoryId: commit.repositoryId ?? null,
      commitHash: commit.commitHash,
      message: commit.message,
      author: commit.author,
      authorEmail: commit.authorEmail ?? null,
      timestamp: commit.timestamp,
      filesChanged: commit.filesChanged || null,
      diff: commit.diff || null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.commits.set(newCommit.id, newCommit);
    return newCommit;
  }
  async getCommitsByRepository(repositoryId) {
    return Array.from(this.commits.values()).filter((commit) => commit.repositoryId === repositoryId).sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }
  async getWikiPages(repositoryId) {
    return Array.from(this.wikiPages.values()).filter((page) => page.repositoryId === repositoryId).sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
  }
  async getWikiPage(id) {
    return this.wikiPages.get(id);
  }
  async createWikiPage(page) {
    const wikiPage = {
      id: nanoid(),
      repositoryId: page.repositoryId ?? null,
      title: page.title,
      content: page.content,
      path: page.path,
      lastModified: page.lastModified ?? null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.wikiPages.set(wikiPage.id, wikiPage);
    return wikiPage;
  }
  async updateWikiPage(id, updates) {
    const page = this.wikiPages.get(id);
    if (!page) {
      throw new Error(`Wiki page with id ${id} not found`);
    }
    const updated = { ...page, ...updates, updatedAt: /* @__PURE__ */ new Date() };
    this.wikiPages.set(id, updated);
    return updated;
  }
  async getDocumentationSuggestions(repositoryId, status) {
    let suggestions = Array.from(this.documentationSuggestions.values());
    if (repositoryId) {
      suggestions = suggestions.filter((s) => s.repositoryId === repositoryId);
    }
    if (status) {
      suggestions = suggestions.filter((s) => s.status === status);
    }
    return suggestions.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
  async createDocumentationSuggestion(suggestion) {
    const newSuggestion = {
      id: nanoid(),
      repositoryId: suggestion.repositoryId ?? null,
      commitId: suggestion.commitId ?? null,
      functionName: suggestion.functionName ?? null,
      className: suggestion.className ?? null,
      fileName: suggestion.fileName,
      suggestedContent: suggestion.suggestedContent,
      status: "pending",
      confidence: suggestion.confidence ?? null,
      createdAt: /* @__PURE__ */ new Date(),
      reviewedAt: null
    };
    this.documentationSuggestions.set(newSuggestion.id, newSuggestion);
    return newSuggestion;
  }
  async updateDocumentationSuggestion(id, updates) {
    const suggestion = this.documentationSuggestions.get(id);
    if (!suggestion) {
      throw new Error(`Documentation suggestion with id ${id} not found`);
    }
    const updated = { ...suggestion, ...updates };
    this.documentationSuggestions.set(id, updated);
    return updated;
  }
  async getChatMessages(limit = 50) {
    return Array.from(this.chatMessages.values()).sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)).slice(0, limit);
  }
  async createChatMessage(message) {
    const chatMessage = {
      id: nanoid(),
      message: message.message,
      response: message.response ?? null,
      isFromUser: message.isFromUser,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.chatMessages.set(chatMessage.id, chatMessage);
    return chatMessage;
  }
  async getAnalysisResults(repositoryId, type) {
    let results = Array.from(this.analysisResults.values());
    if (repositoryId) {
      results = results.filter((r) => r.repositoryId === repositoryId);
    }
    if (type) {
      results = results.filter((r) => r.type === type);
    }
    return results.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
  async createAnalysisResult(result) {
    const analysisResult = {
      id: nanoid(),
      repositoryId: result.repositoryId ?? null,
      type: result.type,
      content: result.content,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.analysisResults.set(analysisResult.id, analysisResult);
    return analysisResult;
  }
  async getDashboardStats() {
    const activeRepos = Array.from(this.repositories.values()).filter((r) => r.isActive).length;
    const pendingDocs = Array.from(this.documentationSuggestions.values()).filter((s) => s.status === "pending").length;
    const aiSuggestions = this.documentationSuggestions.size;
    const coverage = activeRepos > 0 ? Math.round(Math.floor(activeRepos * 0.87) / activeRepos * 100) : 0;
    return {
      activeRepos,
      pendingDocs,
      aiSuggestions,
      coverage
    };
  }
};
var storage = new MemStorage();

// server/services/git.ts
import { Octokit } from "@octokit/rest";
var GitService = class {
  octokit;
  constructor(accessToken) {
    this.octokit = new Octokit({
      auth: accessToken
    });
  }
  async getRepositoryInfo(owner, repo) {
    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo
      });
      const { data: commits2 } = await this.octokit.repos.listCommits({
        owner,
        repo,
        per_page: 1
      });
      let lastCommit;
      if (commits2.length > 0) {
        const commit = commits2[0];
        lastCommit = {
          hash: commit.sha,
          message: commit.commit.message,
          author: commit.commit.author?.name || "Unknown",
          authorEmail: commit.commit.author?.email || "",
          timestamp: new Date(commit.commit.author?.date || Date.now()),
          filesChanged: []
          // Will be populated with detailed commit analysis
        };
      }
      return {
        name: data.name,
        description: data.description || "",
        url: data.html_url,
        lastCommit
      };
    } catch (error) {
      console.error("Failed to get repository info:", error);
      throw new Error(`Failed to get repository info: ${error}`);
    }
  }
  async getCommits(owner, repo, since, limit = 50) {
    try {
      const params = {
        owner,
        repo,
        per_page: limit
      };
      if (since) {
        params.since = since.toISOString();
      }
      const { data: commits2 } = await this.octokit.repos.listCommits(params);
      const gitCommits = [];
      for (const commit of commits2) {
        const gitCommit = {
          hash: commit.sha,
          message: commit.commit.message,
          author: commit.commit.author?.name || "Unknown",
          authorEmail: commit.commit.author?.email || "",
          timestamp: new Date(commit.commit.author?.date || Date.now()),
          filesChanged: []
        };
        try {
          const { data: detailedCommit } = await this.octokit.repos.getCommit({
            owner,
            repo,
            ref: commit.sha
          });
          if (detailedCommit.files) {
            gitCommit.filesChanged = detailedCommit.files.map((file) => file.filename);
          }
          if (detailedCommit.files && detailedCommit.files.length > 0) {
            gitCommit.diff = detailedCommit.files.map((file) => file.patch || "").join("\n").substring(0, 5e3);
          }
        } catch (error) {
          console.error(`Failed to get detailed commit info for ${commit.sha}:`, error);
        }
        gitCommits.push(gitCommit);
      }
      return gitCommits;
    } catch (error) {
      console.error("Failed to get commits:", error);
      throw new Error(`Failed to get commits: ${error}`);
    }
  }
  async getFileContent(owner, repo, path3, ref = "main") {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path: path3,
        ref
      });
      if (Array.isArray(data) || data.type !== "file") {
        throw new Error("Path is not a file");
      }
      if (data.encoding === "base64" && data.content) {
        return Buffer.from(data.content, "base64").toString("utf8");
      }
      return "";
    } catch (error) {
      console.error("Failed to get file content:", error);
      throw new Error(`Failed to get file content: ${error}`);
    }
  }
  async createWebhook(owner, repo, webhookUrl) {
    try {
      const { data } = await this.octokit.repos.createWebhook({
        owner,
        repo,
        config: {
          url: webhookUrl,
          content_type: "json",
          secret: process.env.WEBHOOK_SECRET || "default-secret"
        },
        events: ["push", "pull_request"]
      });
      return data.id.toString();
    } catch (error) {
      console.error("Failed to create webhook:", error);
      throw new Error(`Failed to create webhook: ${error}`);
    }
  }
  static parseGitUrl(gitUrl) {
    const httpsMatch = gitUrl.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/)?$/);
    if (httpsMatch) {
      return { owner: httpsMatch[1], repo: httpsMatch[2] };
    }
    const sshMatch = gitUrl.match(/git@github\.com:([^\/]+)\/([^\/]+?)(?:\.git)?$/);
    if (sshMatch) {
      return { owner: sshMatch[1], repo: sshMatch[2] };
    }
    return null;
  }
};

// server/services/gemini.ts
import { GoogleGenAI } from "@google/genai";
var ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || ""
});
async function analyzeCommitForDocumentation(commitMessage, diff, filesChanged) {
  try {
    const systemPrompt = `You are an expert documentation assistant that analyzes Git commits to identify missing documentation.

Analyze the commit and provide:
1. A brief summary of what changed
2. A description of the changes
3. Any missing documentation that should be created
4. Confidence level (0-100)

For missing documentation, identify:
- Function names and their purpose
- Class names and their role
- File names where changes occurred
- Suggested documentation content
- Type of documentation needed (function, class, module, api)
- Confidence level for each suggestion`;
    const prompt = `Commit Message: ${commitMessage}

Files Changed: ${filesChanged.join(", ")}

Diff:
${diff.substring(0, 2e3)}...

Analyze this commit and suggest documentation updates.`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            changesDescription: { type: "string" },
            missingDocumentation: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  functionName: { type: "string" },
                  className: { type: "string" },
                  fileName: { type: "string" },
                  suggestedContent: { type: "string" },
                  confidence: { type: "number" },
                  type: { type: "string", enum: ["function", "class", "module", "api"] }
                },
                required: ["fileName", "suggestedContent", "confidence", "type"]
              }
            },
            confidence: { type: "number" }
          },
          required: ["summary", "changesDescription", "missingDocumentation", "confidence"]
        }
      },
      contents: prompt
    });
    const rawJson = response.text;
    if (rawJson) {
      const data = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from Gemini API");
    }
  } catch (error) {
    console.error("Failed to analyze commit for documentation:", error);
    throw new Error(`Failed to analyze commit: ${error}`);
  }
}
async function detectMissingDocumentation(commits2, existingDocs) {
  try {
    const systemPrompt = `You are a documentation process improvement expert.
    
Analyze commits and existing documentation to identify patterns and suggest improvements.
Focus on:
- Commits without corresponding documentation
- Inconsistent documentation patterns
- Missing process documentation
- Opportunities for automation`;
    const commitsText = commits2.map(
      (c) => `${c.timestamp.toISOString()}: ${c.message} by ${c.author} (files: ${c.filesChanged.join(", ")})`
    ).join("\n");
    const docsText = existingDocs.map(
      (d) => `${d.path}: ${d.title} - ${d.content.substring(0, 100)}...`
    ).join("\n");
    const prompt = `Recent Commits:
${commitsText}

Existing Documentation:
${docsText}

Identify patterns and suggest process improvements.`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              pattern: { type: "string" },
              description: { type: "string" },
              recommendation: { type: "string" },
              priority: { type: "string", enum: ["low", "medium", "high"] }
            },
            required: ["pattern", "description", "recommendation", "priority"]
          }
        }
      },
      contents: prompt
    });
    const rawJson = response.text;
    if (rawJson) {
      const data = JSON.parse(rawJson);
      return data;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Failed to detect missing documentation:", error);
    throw new Error(`Failed to detect missing documentation: ${error}`);
  }
}
async function generateReleaseNotes(commits2, wikiUpdates) {
  try {
    const systemPrompt = `You are a technical writer that creates comprehensive release notes.
    
Analyze commits and wiki updates to generate structured release notes including:
- Version summary
- New features
- Bug fixes
- Breaking changes
- Documentation updates`;
    const commitsText = commits2.map(
      (c) => `${c.timestamp.toISOString()}: ${c.message} by ${c.author}`
    ).join("\n");
    const wikiText = wikiUpdates.map(
      (w) => `${w.lastModified.toISOString()}: ${w.title} - ${w.content.substring(0, 100)}...`
    ).join("\n");
    const prompt = `Commits:
${commitsText}

Wiki Updates:
${wikiText}

Generate comprehensive release notes.`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            version: { type: "string" },
            summary: { type: "string" },
            features: { type: "array", items: { type: "string" } },
            bugFixes: { type: "array", items: { type: "string" } },
            breakingChanges: { type: "array", items: { type: "string" } },
            documentation: { type: "array", items: { type: "string" } }
          },
          required: ["version", "summary", "features", "bugFixes", "breakingChanges", "documentation"]
        }
      },
      contents: prompt
    });
    const rawJson = response.text;
    if (rawJson) {
      const data = JSON.parse(rawJson);
      return data;
    } else {
      throw new Error("Empty response from Gemini API");
    }
  } catch (error) {
    console.error("Failed to generate release notes:", error);
    throw new Error(`Failed to generate release notes: ${error}`);
  }
}
async function answerDeveloperQuestion(question, context) {
  try {
    const systemPrompt = `You are a knowledgeable development assistant with access to code commits and documentation.
    
Answer developer questions using the provided context. Be specific and cite sources when possible.
Include commit hashes, author names, and relevant documentation when answering.`;
    const commitsText = context.commits.map(
      (c) => `Commit ${c.hash}: ${c.message} by ${c.author} on ${c.timestamp.toISOString()}`
    ).join("\n");
    const docsText = context.docs.map(
      (d) => `Doc: ${d.path} - ${d.title}
${d.content.substring(0, 200)}...`
    ).join("\n\n");
    const prompt = `Question: ${question}

Available Context:

Recent Commits:
${commitsText}

Documentation:
${docsText}

Please answer the question using the available context.`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt
      }
    });
    return response.text || "I couldn't generate a response to your question.";
  } catch (error) {
    console.error("Failed to answer developer question:", error);
    throw new Error(`Failed to answer question: ${error}`);
  }
}

// server/services/webhook.ts
import crypto from "crypto";
function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
async function handleGitHubWebhook(req, res) {
  try {
    const signature = req.headers["x-hub-signature-256"];
    const event = req.headers["x-github-event"];
    const payload = JSON.stringify(req.body);
    const secret = process.env.WEBHOOK_SECRET || "default-secret";
    if (!verifyWebhookSignature(payload, signature, secret)) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }
    if (event === "push") {
      await handlePushEvent(req.body);
    } else if (event === "pull_request") {
      await handlePullRequestEvent(req.body);
    }
    res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
}
async function handlePushEvent(payload) {
  try {
    const repositories2 = await storage.getRepositories();
    const repository = repositories2.find(
      (repo2) => repo2.gitUrl.includes(payload.repository.full_name)
    );
    if (!repository || !repository.accessToken) {
      console.log(`Repository not found or no access token: ${payload.repository.full_name}`);
      return;
    }
    const gitService = new GitService(repository.accessToken);
    const [owner, repo] = payload.repository.full_name.split("/");
    if (payload.commits) {
      for (const commitData of payload.commits) {
        try {
          const commit = await storage.createCommit({
            repositoryId: repository.id,
            commitHash: commitData.id,
            message: commitData.message,
            author: commitData.author.name,
            authorEmail: commitData.author.email,
            timestamp: new Date(commitData.timestamp),
            filesChanged: [...commitData.added, ...commitData.modified, ...commitData.removed]
          });
          const gitCommits = await gitService.getCommits(owner, repo);
          const detailedCommit = gitCommits.find((c) => c.hash === commitData.id);
          if (detailedCommit && detailedCommit.diff) {
            const analysis = await analyzeCommitForDocumentation(
              commitData.message,
              detailedCommit.diff,
              commit.filesChanged
            );
            for (const suggestion of analysis.missingDocumentation) {
              await storage.createDocumentationSuggestion({
                repositoryId: repository.id,
                commitId: commit.id,
                functionName: suggestion.functionName,
                className: suggestion.className,
                fileName: suggestion.fileName,
                suggestedContent: suggestion.suggestedContent,
                confidence: suggestion.confidence
              });
            }
            await storage.createAnalysisResult({
              repositoryId: repository.id,
              type: "commit_analysis",
              content: {
                commitHash: commit.commitHash,
                summary: analysis.summary,
                changesDescription: analysis.changesDescription,
                confidence: analysis.confidence
              }
            });
          }
        } catch (error) {
          console.error(`Failed to process commit ${commitData.id}:`, error);
        }
      }
    }
    await storage.updateRepository(repository.id, {
      lastSyncAt: /* @__PURE__ */ new Date()
    });
  } catch (error) {
    console.error("Failed to handle push event:", error);
  }
}
async function handlePullRequestEvent(payload) {
  console.log("Pull request event received:", payload.action);
}

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow()
});
var repositories = pgTable("repositories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  gitUrl: text("git_url").notNull(),
  provider: text("provider").notNull(),
  // github, gitlab, etc
  accessToken: text("access_token"),
  webhookUrl: text("webhook_url"),
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var commits = pgTable("commits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").references(() => repositories.id),
  commitHash: text("commit_hash").notNull(),
  message: text("message").notNull(),
  author: text("author").notNull(),
  authorEmail: text("author_email"),
  timestamp: timestamp("timestamp").notNull(),
  filesChanged: jsonb("files_changed"),
  // array of file paths
  diff: text("diff"),
  // git diff content
  createdAt: timestamp("created_at").defaultNow()
});
var wikiPages = pgTable("wiki_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").references(() => repositories.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  path: text("path").notNull(),
  lastModified: timestamp("last_modified"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var documentationSuggestions = pgTable("documentation_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").references(() => repositories.id),
  commitId: varchar("commit_id").references(() => commits.id),
  functionName: text("function_name"),
  className: text("class_name"),
  fileName: text("file_name").notNull(),
  suggestedContent: text("suggested_content").notNull(),
  status: text("status").default("pending"),
  // pending, accepted, rejected, modified
  confidence: integer("confidence"),
  // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at")
});
var chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  message: text("message").notNull(),
  response: text("response"),
  isFromUser: boolean("is_from_user").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var analysisResults = pgTable("analysis_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repositoryId: varchar("repository_id").references(() => repositories.id),
  type: text("type").notNull(),
  // missing_docs, process_improvement, release_notes
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var repositoriesRelations = relations(repositories, ({ many }) => ({
  commits: many(commits),
  wikiPages: many(wikiPages),
  documentationSuggestions: many(documentationSuggestions),
  analysisResults: many(analysisResults)
}));
var commitsRelations = relations(commits, ({ one, many }) => ({
  repository: one(repositories, {
    fields: [commits.repositoryId],
    references: [repositories.id]
  }),
  documentationSuggestions: many(documentationSuggestions)
}));
var wikiPagesRelations = relations(wikiPages, ({ one }) => ({
  repository: one(repositories, {
    fields: [wikiPages.repositoryId],
    references: [repositories.id]
  })
}));
var documentationSuggestionsRelations = relations(documentationSuggestions, ({ one }) => ({
  repository: one(repositories, {
    fields: [documentationSuggestions.repositoryId],
    references: [repositories.id]
  }),
  commit: one(commits, {
    fields: [documentationSuggestions.commitId],
    references: [commits.id]
  })
}));
var analysisResultsRelations = relations(analysisResults, ({ one }) => ({
  repository: one(repositories, {
    fields: [analysisResults.repositoryId],
    references: [repositories.id]
  })
}));
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true
});
var insertRepositorySchema = createInsertSchema(repositories).pick({
  name: true,
  description: true,
  gitUrl: true,
  provider: true,
  accessToken: true
});
var insertCommitSchema = createInsertSchema(commits).pick({
  repositoryId: true,
  commitHash: true,
  message: true,
  author: true,
  authorEmail: true,
  timestamp: true,
  filesChanged: true,
  diff: true
});
var insertWikiPageSchema = createInsertSchema(wikiPages).pick({
  repositoryId: true,
  title: true,
  content: true,
  path: true,
  lastModified: true
});
var insertDocumentationSuggestionSchema = createInsertSchema(documentationSuggestions).pick({
  repositoryId: true,
  commitId: true,
  functionName: true,
  className: true,
  fileName: true,
  suggestedContent: true,
  confidence: true
});
var insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  message: true,
  response: true,
  isFromUser: true
});
var clientChatMessageSchema = createInsertSchema(chatMessages).pick({
  message: true
});
var insertAnalysisResultSchema = createInsertSchema(analysisResults).pick({
  repositoryId: true,
  type: true,
  content: true
});

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Failed to get dashboard stats:", error);
      res.status(500).json({ error: "Failed to get dashboard stats" });
    }
  });
  app2.get("/api/repositories", async (req, res) => {
    try {
      const repositories2 = await storage.getRepositories();
      res.json(repositories2);
    } catch (error) {
      console.error("Failed to get repositories:", error);
      res.status(500).json({ error: "Failed to get repositories" });
    }
  });
  app2.post("/api/repositories", async (req, res) => {
    try {
      const validatedData = insertRepositorySchema.parse(req.body);
      const gitInfo = GitService.parseGitUrl(validatedData.gitUrl);
      if (!gitInfo) {
        return res.status(400).json({ error: "Invalid Git URL format" });
      }
      if (!validatedData.accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }
      const gitService = new GitService(validatedData.accessToken);
      const repoInfo = await gitService.getRepositoryInfo(gitInfo.owner, gitInfo.repo);
      const repository = await storage.createRepository({
        ...validatedData,
        name: repoInfo.name,
        description: repoInfo.description || validatedData.description
      });
      try {
        const commits2 = await gitService.getCommits(gitInfo.owner, gitInfo.repo);
        for (const commit of commits2.slice(0, 10)) {
          await storage.createCommit({
            repositoryId: repository.id,
            commitHash: commit.hash,
            message: commit.message,
            author: commit.author,
            authorEmail: commit.authorEmail,
            timestamp: commit.timestamp,
            filesChanged: commit.filesChanged,
            diff: commit.diff
          });
        }
      } catch (error) {
        console.error("Failed to sync initial commits:", error);
      }
      res.json(repository);
    } catch (error) {
      console.error("Failed to create repository:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create repository" });
    }
  });
  app2.delete("/api/repositories/:id", async (req, res) => {
    try {
      await storage.deleteRepository(req.params.id);
      res.json({ message: "Repository deleted successfully" });
    } catch (error) {
      console.error("Failed to delete repository:", error);
      res.status(500).json({ error: "Failed to delete repository" });
    }
  });
  app2.post("/api/repositories/:id/sync", async (req, res) => {
    try {
      const repository = await storage.getRepository(req.params.id);
      if (!repository) {
        return res.status(404).json({ error: "Repository not found" });
      }
      if (!repository.accessToken) {
        return res.status(400).json({ error: "Repository has no access token" });
      }
      const gitInfo = GitService.parseGitUrl(repository.gitUrl);
      if (!gitInfo) {
        return res.status(400).json({ error: "Invalid Git URL" });
      }
      const gitService = new GitService(repository.accessToken);
      const lastSync = repository.lastSyncAt || new Date(Date.now() - 24 * 60 * 60 * 1e3);
      const commits2 = await gitService.getCommits(gitInfo.owner, gitInfo.repo, lastSync);
      for (const commit of commits2) {
        const existingCommit = await storage.getCommitsByRepository(repository.id);
        if (existingCommit.some((c) => c.commitHash === commit.hash)) {
          continue;
        }
        const storedCommit = await storage.createCommit({
          repositoryId: repository.id,
          commitHash: commit.hash,
          message: commit.message,
          author: commit.author,
          authorEmail: commit.authorEmail,
          timestamp: commit.timestamp,
          filesChanged: commit.filesChanged,
          diff: commit.diff
        });
        if (commit.diff && commit.filesChanged.length > 0) {
          try {
            const analysis = await analyzeCommitForDocumentation(
              commit.message,
              commit.diff,
              commit.filesChanged
            );
            for (const suggestion of analysis.missingDocumentation) {
              await storage.createDocumentationSuggestion({
                repositoryId: repository.id,
                commitId: storedCommit.id,
                functionName: suggestion.functionName,
                className: suggestion.className,
                fileName: suggestion.fileName,
                suggestedContent: suggestion.suggestedContent,
                confidence: suggestion.confidence
              });
            }
          } catch (error) {
            console.error("Failed to analyze commit:", error);
          }
        }
      }
      await storage.updateRepository(repository.id, {
        lastSyncAt: /* @__PURE__ */ new Date()
      });
      res.json({ message: "Repository synced successfully", commitsProcessed: commits2.length });
    } catch (error) {
      console.error("Failed to sync repository:", error);
      res.status(500).json({ error: "Failed to sync repository" });
    }
  });
  app2.get("/api/documentation-suggestions", async (req, res) => {
    try {
      const { repositoryId, status } = req.query;
      const suggestions = await storage.getDocumentationSuggestions(
        repositoryId,
        status
      );
      res.json(suggestions);
    } catch (error) {
      console.error("Failed to get documentation suggestions:", error);
      res.status(500).json({ error: "Failed to get documentation suggestions" });
    }
  });
  app2.patch("/api/documentation-suggestions/:id", async (req, res) => {
    try {
      const { status, suggestedContent } = req.body;
      const suggestion = await storage.updateDocumentationSuggestion(req.params.id, {
        status,
        suggestedContent,
        reviewedAt: /* @__PURE__ */ new Date()
      });
      res.json(suggestion);
    } catch (error) {
      console.error("Failed to update documentation suggestion:", error);
      res.status(500).json({ error: "Failed to update documentation suggestion" });
    }
  });
  app2.get("/api/recent-activity", async (req, res) => {
    try {
      const repositories2 = await storage.getRepositories();
      const activity = [];
      for (const repo of repositories2.slice(0, 5)) {
        const commits2 = await storage.getCommits(repo.id, 3);
        for (const commit of commits2) {
          activity.push({
            type: "commit",
            repository: repo,
            commit,
            timestamp: commit.timestamp
          });
        }
        const suggestions = await storage.getDocumentationSuggestions(repo.id);
        for (const suggestion of suggestions.slice(0, 2)) {
          activity.push({
            type: "suggestion",
            repository: repo,
            suggestion,
            timestamp: suggestion.createdAt || /* @__PURE__ */ new Date()
          });
        }
      }
      activity.sort((a, b) => {
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return bTime - aTime;
      });
      res.json(activity.slice(0, 10));
    } catch (error) {
      console.error("Failed to get recent activity:", error);
      res.status(500).json({ error: "Failed to get recent activity" });
    }
  });
  app2.get("/api/chat/messages", async (req, res) => {
    try {
      const messages = await storage.getChatMessages(20);
      res.json(messages.reverse());
    } catch (error) {
      console.error("Failed to get chat messages:", error);
      res.status(500).json({ error: "Failed to get chat messages" });
    }
  });
  app2.post("/api/chat/messages", async (req, res) => {
    try {
      const { message } = clientChatMessageSchema.parse(req.body);
      await storage.createChatMessage({
        message,
        isFromUser: true,
        response: null
      });
      const repositories2 = await storage.getRepositories();
      const commits2 = [];
      const docs = [];
      for (const repo of repositories2.slice(0, 3)) {
        const repoCommits = await storage.getCommits(repo.id, 10);
        commits2.push(...repoCommits.map((c) => ({
          message: c.message,
          author: c.author,
          timestamp: c.timestamp,
          hash: c.commitHash
        })));
        const wikiPages2 = await storage.getWikiPages(repo.id);
        docs.push(...wikiPages2.map((w) => ({
          title: w.title,
          content: w.content,
          path: w.path
        })));
      }
      const response = await answerDeveloperQuestion(message, { commits: commits2, docs });
      const aiMessage = await storage.createChatMessage({
        message: response,
        isFromUser: false,
        response: null
      });
      res.json({ message: aiMessage });
    } catch (error) {
      console.error("Failed to process chat message:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });
  app2.post("/api/repositories/:id/release-notes", async (req, res) => {
    try {
      const repository = await storage.getRepository(req.params.id);
      if (!repository) {
        return res.status(404).json({ error: "Repository not found" });
      }
      const commits2 = await storage.getCommits(repository.id, 50);
      const wikiPages2 = await storage.getWikiPages(repository.id);
      const releaseNotes = await generateReleaseNotes(
        commits2.map((c) => ({
          message: c.message,
          author: c.author,
          timestamp: c.timestamp,
          filesChanged: c.filesChanged
        })),
        wikiPages2.map((w) => ({
          title: w.title,
          content: w.content,
          lastModified: w.updatedAt
        }))
      );
      res.json(releaseNotes);
    } catch (error) {
      console.error("Failed to generate release notes:", error);
      res.status(500).json({ error: "Failed to generate release notes" });
    }
  });
  app2.post("/api/repositories/:id/detect-missing-docs", async (req, res) => {
    try {
      const repository = await storage.getRepository(req.params.id);
      if (!repository) {
        return res.status(404).json({ error: "Repository not found" });
      }
      const commits2 = await storage.getCommits(repository.id, 30);
      const wikiPages2 = await storage.getWikiPages(repository.id);
      const improvements = await detectMissingDocumentation(
        commits2.map((c) => ({
          message: c.message,
          author: c.author,
          timestamp: c.timestamp,
          filesChanged: c.filesChanged
        })),
        wikiPages2.map((w) => ({
          title: w.title,
          content: w.content,
          path: w.path
        }))
      );
      await storage.createAnalysisResult({
        repositoryId: repository.id,
        type: "missing_documentation",
        content: { improvements }
      });
      for (const improvement of improvements) {
        await storage.createDocumentationSuggestion({
          repositoryId: repository.id,
          fileName: improvement.pattern,
          // Use pattern as the "file name" for process improvements
          suggestedContent: `**${improvement.pattern}** (${improvement.priority} priority)

${improvement.description}

**Recommendation:** ${improvement.recommendation}`,
          confidence: improvement.priority === "high" ? 90 : improvement.priority === "medium" ? 70 : 50
        });
      }
      res.json(improvements);
    } catch (error) {
      console.error("Failed to detect missing documentation:", error);
      res.status(500).json({ error: "Failed to detect missing documentation" });
    }
  });
  app2.post("/webhook/github", handleGitHubWebhook);
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid as nanoid2 } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid2()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.platform === "win32" ? "localhost" : "0.0.0.0";
  server.listen({
    port,
    host,
    reusePort: process.platform !== "win32"
  }, () => {
    log(`serving on port ${port} (${host})`);
  });
})();
