import { Octokit } from "@octokit/rest";

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  authorEmail: string;
  timestamp: Date;
  filesChanged: string[];
  diff?: string;
}

export interface GitRepository {
  name: string;
  description: string;
  url: string;
  lastCommit?: GitCommit;
}

export class GitService {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({
      auth: accessToken,
    });
  }

  async getRepositoryInfo(owner: string, repo: string): Promise<GitRepository> {
    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo,
      });

      // Get latest commit
      const { data: commits } = await this.octokit.repos.listCommits({
        owner,
        repo,
        per_page: 1,
      });

      let lastCommit: GitCommit | undefined;
      if (commits.length > 0) {
        const commit = commits[0];
        lastCommit = {
          hash: commit.sha,
          message: commit.commit.message,
          author: commit.commit.author?.name || "Unknown",
          authorEmail: commit.commit.author?.email || "",
          timestamp: new Date(commit.commit.author?.date || Date.now()),
          filesChanged: [], // Will be populated with detailed commit analysis
        };
      }

      return {
        name: data.name,
        description: data.description || "",
        url: data.html_url,
        lastCommit,
      };
    } catch (error) {
      console.error("Failed to get repository info:", error);
      throw new Error(`Failed to get repository info: ${error}`);
    }
  }

  async getCommits(owner: string, repo: string, since?: Date, limit = 50): Promise<GitCommit[]> {
    try {
      const params: any = {
        owner,
        repo,
        per_page: limit,
      };

      if (since) {
        params.since = since.toISOString();
      }

      const { data: commits } = await this.octokit.repos.listCommits(params);

      const gitCommits: GitCommit[] = [];

      for (const commit of commits) {
        const gitCommit: GitCommit = {
          hash: commit.sha,
          message: commit.commit.message,
          author: commit.commit.author?.name || "Unknown",
          authorEmail: commit.commit.author?.email || "",
          timestamp: new Date(commit.commit.author?.date || Date.now()),
          filesChanged: [],
        };

        // Get detailed commit info including files changed
        try {
          const { data: detailedCommit } = await this.octokit.repos.getCommit({
            owner,
            repo,
            ref: commit.sha,
          });

          if (detailedCommit.files) {
            gitCommit.filesChanged = detailedCommit.files.map(file => file.filename);
          }

          // Get diff for the commit (limited size)
          if (detailedCommit.files && detailedCommit.files.length > 0) {
            gitCommit.diff = detailedCommit.files
              .map(file => file.patch || "")
              .join("\n")
              .substring(0, 5000); // Limit diff size
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

  async getFileContent(owner: string, repo: string, path: string, ref = "main"): Promise<string> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
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

  async createWebhook(owner: string, repo: string, webhookUrl: string): Promise<string> {
    try {
      const { data } = await this.octokit.repos.createWebhook({
        owner,
        repo,
        config: {
          url: webhookUrl,
          content_type: "json",
          secret: process.env.WEBHOOK_SECRET || "default-secret",
        },
        events: ["push", "pull_request"],
      });

      return data.id.toString();
    } catch (error) {
      console.error("Failed to create webhook:", error);
      throw new Error(`Failed to create webhook: ${error}`);
    }
  }

  static parseGitUrl(gitUrl: string): { owner: string; repo: string } | null {
    // Handle GitHub URLs like https://github.com/owner/repo or git@github.com:owner/repo.git
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
}
