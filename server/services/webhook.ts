import crypto from "crypto";
import { Request, Response } from "express";
import { storage } from "../storage";
import { GitService } from "./git";
import { analyzeCommitForDocumentation } from "./gemini";

export interface WebhookPayload {
  repository: {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    description: string;
  };
  commits?: Array<{
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
    timestamp: string;
    added: string[];
    removed: string[];
    modified: string[];
  }>;
  head_commit?: {
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
    timestamp: string;
    added: string[];
    removed: string[];
    modified: string[];
  };
}

export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")}`;
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function handleGitHubWebhook(req: Request, res: Response): Promise<void> {
  try {
    const signature = req.headers["x-hub-signature-256"] as string;
    const event = req.headers["x-github-event"] as string;
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    const secret = process.env.WEBHOOK_SECRET || "default-secret";
    if (!verifyWebhookSignature(payload, signature, secret)) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    if (event === "push") {
      await handlePushEvent(req.body as WebhookPayload);
    } else if (event === "pull_request") {
      await handlePullRequestEvent(req.body);
    }

    res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
}

async function handlePushEvent(payload: WebhookPayload): Promise<void> {
  try {
    // Find the repository in our database
    const repositories = await storage.getRepositories();
    const repository = repositories.find(repo => 
      repo.gitUrl.includes(payload.repository.full_name)
    );

    if (!repository || !repository.accessToken) {
      console.log(`Repository not found or no access token: ${payload.repository.full_name}`);
      return;
    }

    const gitService = new GitService(repository.accessToken);
    const [owner, repo] = payload.repository.full_name.split("/");

    // Process each commit
    if (payload.commits) {
      for (const commitData of payload.commits) {
        try {
          // Store commit in database
          const commit = await storage.createCommit({
            repositoryId: repository.id,
            commitHash: commitData.id,
            message: commitData.message,
            author: commitData.author.name,
            authorEmail: commitData.author.email,
            timestamp: new Date(commitData.timestamp),
            filesChanged: [...commitData.added, ...commitData.modified, ...commitData.removed],
          });

          // Get detailed diff for analysis
          const gitCommits = await gitService.getCommits(owner, repo);
          const detailedCommit = gitCommits.find(c => c.hash === commitData.id);

          if (detailedCommit && detailedCommit.diff) {
            // Analyze commit with Gemini AI
            const analysis = await analyzeCommitForDocumentation(
              commitData.message,
              detailedCommit.diff,
              commit.filesChanged as string[]
            );

            // Create documentation suggestions from analysis
            for (const suggestion of analysis.missingDocumentation) {
              await storage.createDocumentationSuggestion({
                repositoryId: repository.id,
                commitId: commit.id,
                functionName: suggestion.functionName,
                className: suggestion.className,
                fileName: suggestion.fileName,
                suggestedContent: suggestion.suggestedContent,
                confidence: suggestion.confidence,
              });
            }

            // Store analysis result
            await storage.createAnalysisResult({
              repositoryId: repository.id,
              type: "commit_analysis",
              content: {
                commitHash: commit.commitHash,
                summary: analysis.summary,
                changesDescription: analysis.changesDescription,
                confidence: analysis.confidence,
              },
            });
          }
        } catch (error) {
          console.error(`Failed to process commit ${commitData.id}:`, error);
        }
      }
    }

    // Update repository last sync time
    await storage.updateRepository(repository.id, {
      lastSyncAt: new Date(),
    });

  } catch (error) {
    console.error("Failed to handle push event:", error);
  }
}

async function handlePullRequestEvent(payload: any): Promise<void> {
  // Handle pull request events (future enhancement)
  console.log("Pull request event received:", payload.action);
}
