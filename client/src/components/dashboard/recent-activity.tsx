import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitCommit, Book, AlertTriangle, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  type: string;
  repository: any;
  commit?: any;
  suggestion?: any;
  timestamp: string;
}

export default function RecentActivity() {
  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/recent-activity"],
  });

  if (isLoading) {
    return (
      <Card className="bg-card border-border" data-testid="recent-activity-loading">
        <CardHeader className="border-b border-border">
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border" data-testid="recent-activity">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <button className="text-primary hover:text-primary/80" data-testid="button-view-all">
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="no-activity">
              No recent activity found. Add repositories to get started.
            </div>
          ) : (
            activities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-4" data-testid={`activity-${index}`}>
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  {activity.type === "commit" ? (
                    <GitCommit className="text-primary text-sm" />
                  ) : activity.type === "suggestion" ? (
                    <Book className="text-accent text-sm" />
                  ) : (
                    <AlertTriangle className="text-yellow-500 text-sm" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {activity.type === "commit" && (
                    <>
                      <p className="text-sm text-foreground">
                        <span className="font-medium" data-testid={`activity-${index}-author`}>
                          {activity.commit.author}
                        </span>{" "}
                        committed to{" "}
                        <span className="font-medium text-primary" data-testid={`activity-${index}-repo`}>
                          {activity.repository.name}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1" data-testid={`activity-${index}-message`}>
                        {activity.commit.message}
                      </p>
                      <div className="flex items-center mt-2 space-x-4">
                        <span className="text-xs text-muted-foreground" data-testid={`activity-${index}-time`}>
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-accent/10 text-accent">
                          AI suggestion pending
                        </span>
                      </div>
                    </>
                  )}
                  {activity.type === "suggestion" && (
                    <>
                      <p className="text-sm text-foreground">
                        Documentation suggestion for{" "}
                        <span className="font-medium text-primary" data-testid={`activity-${index}-function`}>
                          {activity.suggestion.functionName || activity.suggestion.fileName}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1" data-testid={`activity-${index}-suggestion`}>
                        {activity.suggestion.suggestedContent.substring(0, 100)}...
                      </p>
                      <div className="flex items-center mt-2 space-x-4">
                        <span className="text-xs text-muted-foreground" data-testid={`activity-${index}-time`}>
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                          Auto-generated
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
