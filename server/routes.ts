import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { GitService } from "./services/git";
import { 
  analyzeCommitForDocumentation, 
  answerDeveloperQuestion,
  detectMissingDocumentation,
  generateReleaseNotes 
} from "./services/gemini";
import { handleGitHubWebhook } from "./services/webhook";
import { 
  insertRepositorySchema, 
  insertChatMessageSchema,
  clientChatMessageSchema,
  insertDocumentationSuggestionSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Failed to get dashboard stats:", error);
      res.status(500).json({ error: "Failed to get dashboard stats" });
    }
  });

  // Repository management
  app.get("/api/repositories", async (req, res) => {
    try {
      const repositories = await storage.getRepositories();
      res.json(repositories);
    } catch (error) {
      console.error("Failed to get repositories:", error);
      res.status(500).json({ error: "Failed to get repositories" });
    }
  });

  app.post("/api/repositories", async (req, res) => {
    try {
      const validatedData = insertRepositorySchema.parse(req.body);
      
      // Validate Git URL and get repository info
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
        description: repoInfo.description || validatedData.description,
      });

      // Initial sync of commits
      try {
        const commits = await gitService.getCommits(gitInfo.owner, gitInfo.repo);
        for (const commit of commits.slice(0, 10)) { // Limit initial sync
          await storage.createCommit({
            repositoryId: repository.id,
            commitHash: commit.hash,
            message: commit.message,
            author: commit.author,
            authorEmail: commit.authorEmail,
            timestamp: commit.timestamp,
            filesChanged: commit.filesChanged,
            diff: commit.diff,
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

  app.delete("/api/repositories/:id", async (req, res) => {
    try {
      await storage.deleteRepository(req.params.id);
      res.json({ message: "Repository deleted successfully" });
    } catch (error) {
      console.error("Failed to delete repository:", error);
      res.status(500).json({ error: "Failed to delete repository" });
    }
  });

  // Sync repository
  app.post("/api/repositories/:id/sync", async (req, res) => {
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
      const lastSync = repository.lastSyncAt || new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const commits = await gitService.getCommits(gitInfo.owner, gitInfo.repo, lastSync);
      
      for (const commit of commits) {
        // Check if commit already exists
        const existingCommit = await storage.getCommitsByRepository(repository.id);
        if (existingCommit.some(c => c.commitHash === commit.hash)) {
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
          diff: commit.diff,
        });

        // Analyze commit for documentation suggestions
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
                confidence: suggestion.confidence,
              });
            }
          } catch (error) {
            console.error("Failed to analyze commit:", error);
          }
        }
      }

      await storage.updateRepository(repository.id, {
        lastSyncAt: new Date(),
      });

      res.json({ message: "Repository synced successfully", commitsProcessed: commits.length });
    } catch (error) {
      console.error("Failed to sync repository:", error);
      res.status(500).json({ error: "Failed to sync repository" });
    }
  });

  // Documentation suggestions
  app.get("/api/documentation-suggestions", async (req, res) => {
    try {
      const { repositoryId, status } = req.query;
      const suggestions = await storage.getDocumentationSuggestions(
        repositoryId as string,
        status as string
      );
      res.json(suggestions);
    } catch (error) {
      console.error("Failed to get documentation suggestions:", error);
      res.status(500).json({ error: "Failed to get documentation suggestions" });
    }
  });

  app.patch("/api/documentation-suggestions/:id", async (req, res) => {
    try {
      const { status, suggestedContent } = req.body;
      const suggestion = await storage.updateDocumentationSuggestion(req.params.id, {
        status,
        suggestedContent,
        reviewedAt: new Date(),
      });
      res.json(suggestion);
    } catch (error) {
      console.error("Failed to update documentation suggestion:", error);
      res.status(500).json({ error: "Failed to update documentation suggestion" });
    }
  });

  // Recent activity
  app.get("/api/recent-activity", async (req, res) => {
    try {
      const repositories = await storage.getRepositories();
      const activity = [];

      for (const repo of repositories.slice(0, 5)) {
        const commits = await storage.getCommits(repo.id, 3);
        for (const commit of commits) {
          activity.push({
            type: "commit",
            repository: repo,
            commit,
            timestamp: commit.timestamp,
          });
        }

        const suggestions = await storage.getDocumentationSuggestions(repo.id);
        for (const suggestion of suggestions.slice(0, 2)) {
          activity.push({
            type: "suggestion",
            repository: repo,
            suggestion,
            timestamp: suggestion.createdAt || new Date(),
          });
        }
      }

      // Sort by timestamp and limit
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

  // Chat with AI assistant
  app.get("/api/chat/messages", async (req, res) => {
    try {
      const messages = await storage.getChatMessages(20);
      res.json(messages.reverse()); // Return in chronological order
    } catch (error) {
      console.error("Failed to get chat messages:", error);
      res.status(500).json({ error: "Failed to get chat messages" });
    }
  });

  app.post("/api/chat/messages", async (req, res) => {
    try {
      const { message } = clientChatMessageSchema.parse(req.body);

      // Store user message
      await storage.createChatMessage({
        message: message,
        isFromUser: true,
        response: null,
      });

      // Prepare context for AI
      const repositories = await storage.getRepositories();
      const commits = [];
      const docs = [];

      for (const repo of repositories.slice(0, 3)) {
        const repoCommits = await storage.getCommits(repo.id, 10);
        commits.push(...repoCommits.map(c => ({
          message: c.message,
          author: c.author,
          timestamp: c.timestamp!,
          hash: c.commitHash,
        })));

        const wikiPages = await storage.getWikiPages(repo.id);
        docs.push(...wikiPages.map(w => ({
          title: w.title,
          content: w.content,
          path: w.path,
        })));
      }

      // Get AI response
      const response = await answerDeveloperQuestion(message, { commits, docs });

      // Store AI response
      const aiMessage = await storage.createChatMessage({
        message: response,
        isFromUser: false,
        response: null,
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

  // Generate release notes
  app.post("/api/repositories/:id/release-notes", async (req, res) => {
    try {
      const repository = await storage.getRepository(req.params.id);
      if (!repository) {
        return res.status(404).json({ error: "Repository not found" });
      }

      const commits = await storage.getCommits(repository.id, 50);
      const wikiPages = await storage.getWikiPages(repository.id);

      const releaseNotes = await generateReleaseNotes(
        commits.map(c => ({
          message: c.message,
          author: c.author,
          timestamp: c.timestamp!,
          filesChanged: c.filesChanged as string[],
        })),
        wikiPages.map(w => ({
          title: w.title,
          content: w.content,
          lastModified: w.updatedAt!,
        }))
      );

      res.json(releaseNotes);
    } catch (error) {
      console.error("Failed to generate release notes:", error);
      res.status(500).json({ error: "Failed to generate release notes" });
    }
  });

  // Detect missing documentation
  app.post("/api/repositories/:id/detect-missing-docs", async (req, res) => {
    try {
      const repository = await storage.getRepository(req.params.id);
      if (!repository) {
        return res.status(404).json({ error: "Repository not found" });
      }

      const commits = await storage.getCommits(repository.id, 30);
      const wikiPages = await storage.getWikiPages(repository.id);

      const improvements = await detectMissingDocumentation(
        commits.map(c => ({
          message: c.message,
          author: c.author,
          timestamp: c.timestamp!,
          filesChanged: c.filesChanged as string[],
        })),
        wikiPages.map(w => ({
          title: w.title,
          content: w.content,
          path: w.path,
        }))
      );

      // Store analysis results
      await storage.createAnalysisResult({
        repositoryId: repository.id,
        type: "missing_documentation",
        content: { improvements },
      });

      // Create documentation suggestions from the improvements
      for (const improvement of improvements) {
        await storage.createDocumentationSuggestion({
          repositoryId: repository.id,
          fileName: improvement.pattern, // Use pattern as the "file name" for process improvements
          suggestedContent: `**${improvement.pattern}** (${improvement.priority} priority)\n\n${improvement.description}\n\n**Recommendation:** ${improvement.recommendation}`,
          confidence: improvement.priority === "high" ? 90 : improvement.priority === "medium" ? 70 : 50,
        });
      }

      res.json(improvements);
    } catch (error) {
      console.error("Failed to detect missing documentation:", error);
      res.status(500).json({ error: "Failed to detect missing documentation" });
    }
  });

  // Webhook endpoint
  app.post("/webhook/github", handleGitHubWebhook);

  const httpServer = createServer(app);

  return httpServer;
}
