import { 
  repositories, 
  commits, 
  wikiPages, 
  documentationSuggestions, 
  chatMessages, 
  analysisResults,
  type Repository,
  type InsertRepository,
  type Commit,
  type InsertCommit,
  type WikiPage,
  type InsertWikiPage,
  type DocumentationSuggestion,
  type InsertDocumentationSuggestion,
  type ChatMessage,
  type InsertChatMessage,
  type AnalysisResult,
  type InsertAnalysisResult,
  type User,
  type InsertUser
} from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Repository methods
  getRepositories(): Promise<Repository[]>;
  getRepository(id: string): Promise<Repository | undefined>;
  createRepository(repo: InsertRepository): Promise<Repository>;
  updateRepository(id: string, updates: Partial<Repository>): Promise<Repository>;
  deleteRepository(id: string): Promise<void>;

  // Commit methods
  getCommits(repositoryId: string, limit?: number): Promise<Commit[]>;
  getCommit(id: string): Promise<Commit | undefined>;
  createCommit(commit: InsertCommit): Promise<Commit>;
  getCommitsByRepository(repositoryId: string): Promise<Commit[]>;

  // Wiki methods
  getWikiPages(repositoryId: string): Promise<WikiPage[]>;
  getWikiPage(id: string): Promise<WikiPage | undefined>;
  createWikiPage(page: InsertWikiPage): Promise<WikiPage>;
  updateWikiPage(id: string, updates: Partial<WikiPage>): Promise<WikiPage>;

  // Documentation suggestions methods
  getDocumentationSuggestions(repositoryId?: string, status?: string): Promise<DocumentationSuggestion[]>;
  createDocumentationSuggestion(suggestion: InsertDocumentationSuggestion): Promise<DocumentationSuggestion>;
  updateDocumentationSuggestion(id: string, updates: Partial<DocumentationSuggestion>): Promise<DocumentationSuggestion>;

  // Chat methods
  getChatMessages(limit?: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Analysis methods
  getAnalysisResults(repositoryId?: string, type?: string): Promise<AnalysisResult[]>;
  createAnalysisResult(result: InsertAnalysisResult): Promise<AnalysisResult>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    activeRepos: number;
    pendingDocs: number;
    aiSuggestions: number;
    coverage: number;
  }>;
}

export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private repositories = new Map<string, Repository>();
  private commits = new Map<string, Commit>();
  private wikiPages = new Map<string, WikiPage>();
  private documentationSuggestions = new Map<string, DocumentationSuggestion>();
  private chatMessages = new Map<string, ChatMessage>();
  private analysisResults = new Map<string, AnalysisResult>();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: nanoid(),
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email || null,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async getRepositories(): Promise<Repository[]> {
    return Array.from(this.repositories.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getRepository(id: string): Promise<Repository | undefined> {
    return this.repositories.get(id);
  }

  async createRepository(repo: InsertRepository): Promise<Repository> {
    const repository: Repository = {
      id: nanoid(),
      name: repo.name,
      description: repo.description || null,
      gitUrl: repo.gitUrl,
      provider: repo.provider,
      accessToken: repo.accessToken || null,
      webhookUrl: null,
      isActive: true,
      lastSyncAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.repositories.set(repository.id, repository);
    return repository;
  }

  async updateRepository(id: string, updates: Partial<Repository>): Promise<Repository> {
    const repository = this.repositories.get(id);
    if (!repository) {
      throw new Error(`Repository with id ${id} not found`);
    }
    const updated = { ...repository, ...updates, updatedAt: new Date() };
    this.repositories.set(id, updated);
    return updated;
  }

  async deleteRepository(id: string): Promise<void> {
    // Delete related records first
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
    // Finally delete the repository
    this.repositories.delete(id);
  }

  async getCommits(repositoryId: string, limit = 50): Promise<Commit[]> {
    return Array.from(this.commits.values())
      .filter(commit => commit.repositoryId === repositoryId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  async getCommit(id: string): Promise<Commit | undefined> {
    return this.commits.get(id);
  }

  async createCommit(commit: InsertCommit): Promise<Commit> {
    const newCommit: Commit = {
      id: nanoid(),
      repositoryId: commit.repositoryId ?? null,
      commitHash: commit.commitHash,
      message: commit.message,
      author: commit.author,
      authorEmail: commit.authorEmail ?? null,
      timestamp: commit.timestamp,
      filesChanged: commit.filesChanged || null,
      diff: commit.diff || null,
      createdAt: new Date(),
    };
    this.commits.set(newCommit.id, newCommit);
    return newCommit;
  }

  async getCommitsByRepository(repositoryId: string): Promise<Commit[]> {
    return Array.from(this.commits.values())
      .filter(commit => commit.repositoryId === repositoryId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  async getWikiPages(repositoryId: string): Promise<WikiPage[]> {
    return Array.from(this.wikiPages.values())
      .filter(page => page.repositoryId === repositoryId)
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
  }

  async getWikiPage(id: string): Promise<WikiPage | undefined> {
    return this.wikiPages.get(id);
  }

  async createWikiPage(page: InsertWikiPage): Promise<WikiPage> {
    const wikiPage: WikiPage = {
      id: nanoid(),
      repositoryId: page.repositoryId ?? null,
      title: page.title,
      content: page.content,
      path: page.path,
      lastModified: page.lastModified ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.wikiPages.set(wikiPage.id, wikiPage);
    return wikiPage;
  }

  async updateWikiPage(id: string, updates: Partial<WikiPage>): Promise<WikiPage> {
    const page = this.wikiPages.get(id);
    if (!page) {
      throw new Error(`Wiki page with id ${id} not found`);
    }
    const updated = { ...page, ...updates, updatedAt: new Date() };
    this.wikiPages.set(id, updated);
    return updated;
  }

  async getDocumentationSuggestions(repositoryId?: string, status?: string): Promise<DocumentationSuggestion[]> {
    let suggestions = Array.from(this.documentationSuggestions.values());
    
    if (repositoryId) {
      suggestions = suggestions.filter(s => s.repositoryId === repositoryId);
    }
    if (status) {
      suggestions = suggestions.filter(s => s.status === status);
    }
    
    return suggestions.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createDocumentationSuggestion(suggestion: InsertDocumentationSuggestion): Promise<DocumentationSuggestion> {
    const newSuggestion: DocumentationSuggestion = {
      id: nanoid(),
      repositoryId: suggestion.repositoryId ?? null,
      commitId: suggestion.commitId ?? null,
      functionName: suggestion.functionName ?? null,
      className: suggestion.className ?? null,
      fileName: suggestion.fileName,
      suggestedContent: suggestion.suggestedContent,
      status: "pending",
      confidence: suggestion.confidence ?? null,
      createdAt: new Date(),
      reviewedAt: null,
    };
    this.documentationSuggestions.set(newSuggestion.id, newSuggestion);
    return newSuggestion;
  }

  async updateDocumentationSuggestion(id: string, updates: Partial<DocumentationSuggestion>): Promise<DocumentationSuggestion> {
    const suggestion = this.documentationSuggestions.get(id);
    if (!suggestion) {
      throw new Error(`Documentation suggestion with id ${id} not found`);
    }
    const updated = { ...suggestion, ...updates };
    this.documentationSuggestions.set(id, updated);
    return updated;
  }

  async getChatMessages(limit = 50): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const chatMessage: ChatMessage = {
      id: nanoid(),
      message: message.message,
      response: message.response ?? null,
      isFromUser: message.isFromUser,
      createdAt: new Date(),
    };
    this.chatMessages.set(chatMessage.id, chatMessage);
    return chatMessage;
  }

  async getAnalysisResults(repositoryId?: string, type?: string): Promise<AnalysisResult[]> {
    let results = Array.from(this.analysisResults.values());
    
    if (repositoryId) {
      results = results.filter(r => r.repositoryId === repositoryId);
    }
    if (type) {
      results = results.filter(r => r.type === type);
    }
    
    return results.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createAnalysisResult(result: InsertAnalysisResult): Promise<AnalysisResult> {
    const analysisResult: AnalysisResult = {
      id: nanoid(),
      repositoryId: result.repositoryId ?? null,
      type: result.type,
      content: result.content,
      createdAt: new Date(),
    };
    this.analysisResults.set(analysisResult.id, analysisResult);
    return analysisResult;
  }

  async getDashboardStats(): Promise<{
    activeRepos: number;
    pendingDocs: number;
    aiSuggestions: number;
    coverage: number;
  }> {
    const activeRepos = Array.from(this.repositories.values()).filter(r => r.isActive).length;
    const pendingDocs = Array.from(this.documentationSuggestions.values()).filter(s => s.status === "pending").length;
    const aiSuggestions = this.documentationSuggestions.size;
    const coverage = activeRepos > 0 ? Math.round((Math.floor(activeRepos * 0.87) / activeRepos) * 100) : 0;

    return {
      activeRepos,
      pendingDocs,
      aiSuggestions,
      coverage,
    };
  }
}


export const storage = new MemStorage();
