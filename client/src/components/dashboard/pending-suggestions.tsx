import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Edit, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

export default function PendingSuggestions() {
  const queryClient = useQueryClient();

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["/api/documentation-suggestions"],
    queryFn: () => fetch("/api/documentation-suggestions?status=pending").then(res => res.json()),
  });

  const updateSuggestionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/documentation-suggestions/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documentation-suggestions"] });
      toast({
        title: "Success",
        description: "Documentation suggestion updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update suggestion. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAccept = (id: string) => {
    updateSuggestionMutation.mutate({ id, status: "accepted" });
  };

  const handleReject = (id: string) => {
    updateSuggestionMutation.mutate({ id, status: "rejected" });
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border" data-testid="pending-suggestions-loading">
        <CardHeader className="border-b border-border">
          <CardTitle>AI Generated Documentation Suggestions</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse border border-border rounded-lg p-4">
                <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border" data-testid="pending-suggestions">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle>AI Generated Documentation Suggestions</CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground" data-testid="pending-count">
              {suggestions.length} pending review
            </span>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-review-all"
            >
              Review All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="no-suggestions">
              No pending documentation suggestions. Sync repositories to generate suggestions.
            </div>
          ) : (
            suggestions.map((suggestion: any, index: number) => (
              <div
                key={suggestion.id}
                className="border border-border rounded-lg p-4 fade-in"
                data-testid={`suggestion-${index}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-foreground" data-testid={`suggestion-${index}-name`}>
                        {suggestion.functionName || suggestion.className || "Unknown"}
                      </span>
                      <span className="text-sm text-muted-foreground">in</span>
                      <span className="text-primary text-sm" data-testid={`suggestion-${index}-file`}>
                        {suggestion.fileName}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                        {suggestion.functionName ? "New Function" : "New Class"}
                      </span>
                    </div>
                    <div className="code-highlight p-3 rounded text-sm font-mono mb-3">
                      <p className="text-muted-foreground mb-1">// Suggested documentation:</p>
                      <p className="text-foreground" data-testid={`suggestion-${index}-content`}>
                        {suggestion.suggestedContent}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Confidence: {suggestion.confidence || 0}%</span>
                      <span data-testid={`suggestion-${index}-time`}>
                        {formatDistanceToNow(new Date(suggestion.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(suggestion.id)}
                      disabled={updateSuggestionMutation.isPending}
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                      data-testid={`button-accept-${index}`}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="hover:bg-secondary/80"
                      data-testid={`button-edit-${index}`}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReject(suggestion.id)}
                      disabled={updateSuggestionMutation.isPending}
                      className="text-destructive hover:bg-destructive/10"
                      data-testid={`button-reject-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
