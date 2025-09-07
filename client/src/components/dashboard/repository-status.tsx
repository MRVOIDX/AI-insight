import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GitBranch, Eye, RefreshCw, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Repository {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  lastSyncAt: string;
}

export default function RepositoryStatus() {
  const { data: repositories = [], isLoading } = useQuery<Repository[]>({
    queryKey: ["/api/repositories"],
  });

  if (isLoading) {
    return (
      <Card className="bg-card border-border" data-testid="repository-status-loading">
        <CardHeader className="border-b border-border">
          <CardTitle>Repository Status</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border" data-testid="repository-status">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle>Repository Status</CardTitle>
          <div className="flex items-center space-x-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-40 bg-input border-border text-sm" data-testid="filter-repositories">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Repositories</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="needs-attention">Needs Attention</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary" size="sm" data-testid="button-filter">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {repositories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="no-repositories">
            No repositories found. Add a repository to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="repositories-table">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-sm font-medium text-muted-foreground py-2">Repository</th>
                  <th className="text-left text-sm font-medium text-muted-foreground py-2">Last Sync</th>
                  <th className="text-left text-sm font-medium text-muted-foreground py-2">Status</th>
                  <th className="text-left text-sm font-medium text-muted-foreground py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {repositories.map((repo, index) => (
                  <tr key={repo.id} className="border-b border-border/50" data-testid={`repository-${index}`}>
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                          <GitBranch className="text-primary text-sm" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground" data-testid={`repository-${index}-name`}>
                            {repo.name}
                          </p>
                          <p className="text-xs text-muted-foreground" data-testid={`repository-${index}-description`}>
                            {repo.description || "No description"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div>
                        <p className="text-sm text-foreground" data-testid={`repository-${index}-sync`}>
                          {repo.lastSyncAt
                            ? formatDistanceToNow(new Date(repo.lastSyncAt), { addSuffix: true })
                            : "Never synced"}
                        </p>
                      </div>
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          repo.isActive
                            ? "bg-accent/10 text-accent"
                            : "bg-destructive/10 text-destructive"
                        }`}
                        data-testid={`repository-${index}-status`}
                      >
                        <div
                          className={`status-indicator mr-1 ${
                            repo.isActive ? "status-active" : "status-error"
                          }`}
                        ></div>
                        {repo.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary/80"
                          data-testid={`button-sync-${index}`}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary/80"
                          data-testid={`button-view-${index}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
