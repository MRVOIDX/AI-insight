import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Send, User, MessageSquare, FileText, GitBranch, Lightbulb, Settings } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  message: string;
  isFromUser: boolean;
  createdAt: string;
}

interface Repository {
  id: string;
  name: string;
  isActive: boolean;
}

interface DocumentationSuggestion {
  id: string;
  functionName?: string;
  className?: string;
  suggestedContent: string;
  confidence: number;
  createdAt: string;
}

interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: any;
  category: string;
}

const quickActions: QuickAction[] = [
  {
    id: "missing-docs",
    label: "Find Missing Documentation",
    prompt: "Analyze my repositories and find functions or classes that are missing documentation",
    icon: FileText,
    category: "analysis"
  },
  {
    id: "release-notes",
    label: "Generate Release Notes",
    prompt: "Generate release notes for the latest commits across all repositories",
    icon: GitBranch,
    category: "generation"
  },
  {
    id: "code-author",
    label: "Who Added This Function?",
    prompt: "Who added the latest function in the payment service repository?",
    icon: User,
    category: "search"
  },
  {
    id: "suggest-improvements",
    label: "Suggest Process Improvements",
    prompt: "Based on my commit and documentation patterns, suggest process improvements",
    icon: Lightbulb,
    category: "analysis"
  }
];

export default function AIAssistant() {
  const [message, setMessage] = useState("");
  const [selectedRepository, setSelectedRepository] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
  });

  const { data: repositories = [], isLoading: reposLoading } = useQuery<Repository[]>({
    queryKey: ["/api/repositories"],
  });

  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery<DocumentationSuggestion[]>({
    queryKey: ["/api/documentation-suggestions"],
    queryFn: () => fetch("/api/documentation-suggestions?status=pending").then(res => res.json()),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat/messages", { message });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      setMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateReleaseNotesMutation = useMutation({
    mutationFn: async (repositoryId: string) => {
      const endpoint = repositoryId === "all" 
        ? "/api/repositories/all/release-notes" 
        : `/api/repositories/${repositoryId}/release-notes`;
      const response = await apiRequest("POST", endpoint);
      return response.json();
    },
    onSuccess: (data) => {
      const message = `Generated release notes:\n\n**${data.version}**\n\n${data.summary}\n\n**Features:**\n${data.features.map((f: string) => `• ${f}`).join('\n')}\n\n**Bug Fixes:**\n${data.bugFixes.map((f: string) => `• ${f}`).join('\n')}`;
      sendMessageMutation.mutate(message);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate release notes.",
        variant: "destructive",
      });
    },
  });

  const detectMissingDocsMutation = useMutation({
    mutationFn: async (repositoryId: string) => {
      const endpoint = repositoryId === "all"
        ? "/api/repositories/all/detect-missing-docs"
        : `/api/repositories/${repositoryId}/detect-missing-docs`;
      const response = await apiRequest("POST", endpoint);
      return response.json();
    },
    onSuccess: (data) => {
      const message = `Found process improvements:\n\n${data.map((improvement: any) => 
        `**${improvement.pattern}** (${improvement.priority} priority)\n${improvement.description}\n*Recommendation:* ${improvement.recommendation}`
      ).join('\n\n')}`;
      sendMessageMutation.mutate(message);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to detect missing documentation.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    if (action.id === "release-notes") {
      generateReleaseNotesMutation.mutate(selectedRepository);
    } else if (action.id === "missing-docs" || action.id === "suggest-improvements") {
      detectMissingDocsMutation.mutate(selectedRepository);
    } else {
      sendMessageMutation.mutate(action.prompt);
    }
  };

  const groupedActions = quickActions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = [];
    }
    acc[action.category].push(action);
    return acc;
  }, {} as Record<string, QuickAction[]>);

  return (
    <>
      <Header 
        title="AI Assistant" 
        subtitle="Interact with your intelligent documentation assistant"
      />
      
      <div className="flex-1 overflow-auto p-6" data-testid="ai-assistant-content">
        <div className="max-w-6xl mx-auto space-y-6">
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-3" data-testid="tabs-navigation">
              <TabsTrigger value="chat" data-testid="tab-chat">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="actions" data-testid="tab-actions">
                <Lightbulb className="w-4 h-4 mr-2" />
                Quick Actions
              </TabsTrigger>
              <TabsTrigger value="insights" data-testid="tab-insights">
                <FileText className="w-4 h-4 mr-2" />
                Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="bg-card border-border h-[600px] flex flex-col" data-testid="chat-container">
                    <CardHeader className="border-b border-border">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          <Bot className="w-5 h-5 text-primary" />
                          <span>AI Assistant Chat</span>
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <div className="status-indicator status-active"></div>
                          <span className="text-xs text-muted-foreground" data-testid="ai-status">Online</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col p-0">
                      <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="chat-messages">
                        {messagesLoading ? (
                          <div className="text-center py-8 text-muted-foreground">
                            Loading conversation...
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground" data-testid="no-messages">
                            <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-semibold mb-2">Welcome to your AI Assistant!</h3>
                            <p className="mb-4">
                              I can help you with documentation analysis, code insights, and repository management.
                            </p>
                            <p className="text-sm">
                              Try asking me about your repositories, missing documentation, or generate release notes.
                            </p>
                          </div>
                        ) : (
                          messages.map((msg, index) => (
                            <div
                              key={index}
                              className={`flex items-start space-x-3 ${msg.isFromUser ? 'justify-end' : ''}`}
                              data-testid={`message-${index}`}
                            >
                              {!msg.isFromUser && (
                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                                  <Bot className="text-primary-foreground text-sm" />
                                </div>
                              )}
                              <div className={`flex-1 max-w-2xl ${msg.isFromUser ? 'text-right' : ''}`}>
                                <div
                                  className={`p-4 rounded-lg inline-block ${
                                    msg.isFromUser
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-secondary'
                                  }`}
                                >
                                  <div className="text-sm whitespace-pre-wrap" data-testid={`message-${index}-content`}>
                                    {msg.message}
                                  </div>
                                </div>
                                <div className={`text-xs text-muted-foreground mt-1 ${msg.isFromUser ? 'text-right' : ''}`}>
                                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                </div>
                              </div>
                              {msg.isFromUser && (
                                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="text-muted-foreground text-sm" />
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                      <div className="border-t border-border p-6">
                        <form onSubmit={handleSubmit} className="space-y-3" data-testid="chat-form">
                          <div className="flex space-x-2">
                            <Textarea
                              placeholder="Ask me anything about your repositories, documentation, or code..."
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              className="flex-1 bg-input border-border resize-none"
                              rows={2}
                              disabled={sendMessageMutation.isPending}
                              data-testid="input-message"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSubmit(e);
                                }
                              }}
                            />
                            <Button
                              type="submit"
                              disabled={!message.trim() || sendMessageMutation.isPending}
                              className="bg-primary text-primary-foreground hover:bg-primary/90 self-end"
                              data-testid="button-send"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Press Enter to send, Shift+Enter for new line</span>
                            <span className="text-accent">Powered by Gemini AI</span>
                          </div>
                        </form>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="bg-card border-border" data-testid="context-selector">
                    <CardHeader>
                      <CardTitle className="text-base">Context</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Repository Scope</label>
                        <Select value={selectedRepository} onValueChange={setSelectedRepository}>
                          <SelectTrigger data-testid="select-repository">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Repositories</SelectItem>
                            {repositories.map((repo) => (
                              <SelectItem key={repo.id} value={repo.id}>
                                {repo.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border" data-testid="conversation-stats">
                    <CardHeader>
                      <CardTitle className="text-base">Conversation Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Messages</span>
                        <span className="text-sm font-medium" data-testid="stats-messages">{messages.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Active Repos</span>
                        <span className="text-sm font-medium" data-testid="stats-repos">{repositories.filter((r) => r.isActive).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Pending Suggestions</span>
                        <span className="text-sm font-medium" data-testid="stats-suggestions">{suggestions.length}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-6">
              <Card className="bg-card border-border" data-testid="quick-actions">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(groupedActions).map(([category, actions]) => (
                    <div key={category} className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground capitalize">{category}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {actions.map((action) => (
                          <Button
                            key={action.id}
                            variant="outline"
                            className="h-auto p-4 text-left justify-start"
                            onClick={() => handleQuickAction(action)}
                            disabled={generateReleaseNotesMutation.isPending || detectMissingDocsMutation.isPending || sendMessageMutation.isPending}
                            data-testid={`action-${action.id}`}
                          >
                            <div className="flex items-start space-x-3">
                              <action.icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="font-medium text-sm">{action.label}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {action.prompt.substring(0, 60)}...
                                </div>
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border" data-testid="pending-suggestions-overview">
                  <CardHeader>
                    <CardTitle className="text-base">Pending AI Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {suggestionsLoading ? (
                      <div className="text-center py-4 text-muted-foreground">Loading suggestions...</div>
                    ) : suggestions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground" data-testid="no-pending-suggestions">
                        <Lightbulb className="w-8 h-8 mx-auto mb-2" />
                        <p>No pending suggestions</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {suggestions.slice(0, 3).map((suggestion: any, index: number) => (
                          <div key={suggestion.id} className="border border-border rounded-lg p-3" data-testid={`suggestion-preview-${index}`}>
                            <div className="flex items-start justify-between mb-2">
                              <span className="font-medium text-sm">
                                {suggestion.functionName || suggestion.className || 'Unknown'}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {suggestion.confidence}% confidence
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {suggestion.suggestedContent.substring(0, 100)}...
                            </p>
                          </div>
                        ))}
                        {suggestions.length > 3 && (
                          <div className="text-center pt-2">
                            <Button variant="ghost" size="sm" className="text-primary">
                              View all {suggestions.length} suggestions
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border" data-testid="ai-capabilities">
                  <CardHeader>
                    <CardTitle className="text-base">AI Capabilities</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium">Auto Documentation</p>
                          <p className="text-xs text-muted-foreground">
                            Analyzes commits and generates documentation suggestions
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium">Missing Information Detection</p>
                          <p className="text-xs text-muted-foreground">
                            Compares commits with wiki content to highlight gaps
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium">Release Notes Generation</p>
                          <p className="text-xs text-muted-foreground">
                            Summarizes code changes and wiki updates for releases
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium">Developer Q&A</p>
                          <p className="text-xs text-muted-foreground">
                            Acts as knowledge assistant using code and docs
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium">Process Improvements</p>
                          <p className="text-xs text-muted-foreground">
                            Suggests workflow optimizations based on patterns
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
