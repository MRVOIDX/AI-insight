import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { FileText, Search, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DocumentationSuggestion {
  id: string;
  functionName?: string;
  className?: string;
  fileName?: string;
  suggestedContent: string;
  confidence: number;
  status: string;
  createdAt: string;
  repositoryId: string;
}

export default function Documentation() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: suggestions = [], isLoading } = useQuery<DocumentationSuggestion[]>({
    queryKey: ["/api/documentation-suggestions"],
  });

  const { data: repositories = [] } = useQuery({
    queryKey: ["/api/repositories"],
  });

  const filteredSuggestions = suggestions.filter((suggestion) => {
    const matchesSearch = searchQuery === "" || 
      suggestion.suggestedContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (suggestion.functionName && suggestion.functionName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (suggestion.className && suggestion.className.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || suggestion.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getRepositoryName = (repositoryId: string) => {
    const repo = repositories.find((r: any) => r.id === repositoryId);
    return repo?.name || "Unknown Repository";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    }
  };

  const statusCounts = {
    all: suggestions.length,
    pending: suggestions.filter(s => s.status === "pending").length,
    approved: suggestions.filter(s => s.status === "approved").length,
    rejected: suggestions.filter(s => s.status === "rejected").length,
  };

  return (
    <>
      <Header 
        title="Documentation Browser" 
        subtitle="Browse and manage AI-generated documentation suggestions"
      />
      
      <div className="flex-1 overflow-auto p-6 space-y-6" data-testid="documentation-content">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search documentation suggestions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="search-input"
            />
          </div>
          <div className="flex gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="capitalize"
                data-testid={`filter-${status}`}
              >
                {status} ({count})
              </Button>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Suggestions</p>
                  <p className="text-2xl font-bold" data-testid="total-suggestions">{suggestions.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-500" data-testid="pending-count">
                    {statusCounts.pending}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-green-500" data-testid="approved-count">
                    {statusCounts.approved}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-cyan-500" data-testid="success-rate">
                    {suggestions.length > 0 
                      ? Math.round((statusCounts.approved / suggestions.length) * 100)
                      : 0
                    }%
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-cyan-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documentation Suggestions List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse" data-testid={`skeleton-${i}`}>
                <CardContent className="p-6">
                  <div className="h-24 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredSuggestions.length === 0 ? (
          <Card className="bg-card border-border" data-testid="no-suggestions">
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Documentation Found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" 
                  ? "No suggestions match your current filters."
                  : "Connect repositories and analyze them to generate documentation suggestions."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSuggestions.map((suggestion, index) => (
              <Card key={suggestion.id} className="bg-card border-border" data-testid={`suggestion-${index}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">
                          {suggestion.functionName || suggestion.className || "Code Documentation"}
                        </CardTitle>
                        <Badge className={getStatusColor(suggestion.status)}>
                          {getStatusIcon(suggestion.status)}
                          <span className="ml-1 capitalize">{suggestion.status}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span data-testid={`repository-${index}`}>
                          {getRepositoryName(suggestion.repositoryId)}
                        </span>
                        {suggestion.fileName && (
                          <span data-testid={`filename-${index}`}>
                            {suggestion.fileName}
                          </span>
                        )}
                        <span data-testid={`confidence-${index}`}>
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </span>
                        <span data-testid={`date-${index}`}>
                          {formatDistanceToNow(new Date(suggestion.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap" data-testid={`content-${index}`}>
                      {suggestion.suggestedContent}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}