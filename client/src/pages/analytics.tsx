import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FileText, GitCommit, Brain, TrendingUp } from "lucide-react";

interface AnalyticsData {
  totalRepositories: number;
  totalCommits: number;
  documentationSuggestions: number;
  aiInteractions: number;
  documentationCoverage: number;
}

export default function Analytics() {
  const { data: repositories = [] } = useQuery({
    queryKey: ["/api/repositories"],
  });

  const { data: suggestions = [] } = useQuery({
    queryKey: ["/api/documentation-suggestions"],
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["/api/chat/messages"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const analyticsData: AnalyticsData = {
    totalRepositories: repositories.length,
    totalCommits: stats?.recentCommits || 0,
    documentationSuggestions: suggestions.length,
    aiInteractions: messages.length,
    documentationCoverage: Math.round((stats?.documentsGenerated || 0) / Math.max(repositories.length, 1) * 100),
  };

  const metrics = [
    {
      title: "Active Repositories",
      value: analyticsData.totalRepositories,
      icon: BarChart3,
      description: "Connected repositories being monitored",
      color: "text-blue-500",
    },
    {
      title: "Commits Analyzed",
      value: analyticsData.totalCommits,
      icon: GitCommit,
      description: "Total commits processed by AI",
      color: "text-green-500",
    },
    {
      title: "AI Suggestions",
      value: analyticsData.documentationSuggestions,
      icon: Brain,
      description: "Documentation improvements suggested",
      color: "text-purple-500",
    },
    {
      title: "Chat Interactions",
      value: analyticsData.aiInteractions,
      icon: FileText,
      description: "AI assistant conversations",
      color: "text-orange-500",
    },
    {
      title: "Documentation Coverage",
      value: `${analyticsData.documentationCoverage}%`,
      icon: TrendingUp,
      description: "Average documentation completeness",
      color: "text-cyan-500",
    },
  ];

  return (
    <>
      <Header 
        title="Analytics" 
        subtitle="View documentation insights and AI performance metrics"
      />
      
      <div className="flex-1 overflow-auto p-6 space-y-6" data-testid="analytics-content">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {metrics.map((metric, index) => (
            <Card key={metric.title} className="bg-card border-border" data-testid={`metric-card-${index}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <metric.icon className={`w-4 h-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${metric.color}`} data-testid={`metric-value-${index}`}>
                  {metric.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 mr-2 text-purple-500" />
                AI Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending Suggestions</span>
                  <span className="font-medium" data-testid="pending-suggestions">
                    {suggestions.filter((s: any) => s.status === 'pending').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Approved Suggestions</span>
                  <span className="font-medium" data-testid="approved-suggestions">
                    {suggestions.filter((s: any) => s.status === 'approved').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="font-medium text-green-500" data-testid="success-rate">
                    {suggestions.length > 0 
                      ? Math.round((suggestions.filter((s: any) => s.status === 'approved').length / suggestions.length) * 100)
                      : 0
                    }%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-cyan-500" />
                Activity Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Repositories</span>
                  <span className="font-medium" data-testid="active-repos">
                    {repositories.filter((r: any) => r.isActive).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Recent AI Chats</span>
                  <span className="font-medium" data-testid="recent-chats">
                    {messages.filter((m: any) => !m.isFromUser).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Documentation Health</span>
                  <span className={`font-medium ${
                    analyticsData.documentationCoverage >= 80 ? 'text-green-500' :
                    analyticsData.documentationCoverage >= 60 ? 'text-yellow-500' : 'text-red-500'
                  }`} data-testid="doc-health">
                    {analyticsData.documentationCoverage >= 80 ? 'Excellent' :
                     analyticsData.documentationCoverage >= 60 ? 'Good' : 'Needs Work'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Recent Activity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• {repositories.length} repositories connected and monitored</p>
              <p>• {suggestions.length} AI-generated documentation suggestions</p>
              <p>• {messages.length} total chat interactions with the AI assistant</p>
              <p>• {analyticsData.documentationCoverage}% average documentation coverage across all repositories</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}