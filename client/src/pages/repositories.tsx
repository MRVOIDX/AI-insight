import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, GitBranch, RefreshCw, Trash2, Brain, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface Repository {
  id: string;
  name: string;
  description: string;
  provider: string;
  isActive: boolean;
  lastSyncAt: string;
}

export default function Repositories() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    gitUrl: "",
    provider: "github",
    accessToken: "",
  });

  const queryClient = useQueryClient();

  const { data: repositories = [], isLoading } = useQuery<Repository[]>({
    queryKey: ["/api/repositories"],
  });

  const addRepositoryMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/repositories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
      setIsAddDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        gitUrl: "",
        provider: "github",
        accessToken: "",
      });
      toast({
        title: "Success",
        description: "Repository added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add repository.",
        variant: "destructive",
      });
    },
  });

  const syncRepositoryMutation = useMutation({
    mutationFn: async (repositoryId: string) => {
      const response = await apiRequest("POST", `/api/repositories/${repositoryId}/sync`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
      toast({
        title: "Success",
        description: "Repository synced successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to sync repository.",
        variant: "destructive",
      });
    },
  });

  const deleteRepositoryMutation = useMutation({
    mutationFn: async (repositoryId: string) => {
      const response = await apiRequest("DELETE", `/api/repositories/${repositoryId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
      toast({
        title: "Success",
        description: "Repository deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete repository.",
        variant: "destructive",
      });
    },
  });

  const analyzeRepositoryMutation = useMutation({
    mutationFn: async (repositoryId: string) => {
      const response = await apiRequest("POST", `/api/repositories/${repositoryId}/detect-missing-docs`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documentation-suggestions"] });
      toast({
        title: "Success",
        description: "AI analysis completed. Check suggestions for results.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to analyze repository.",
        variant: "destructive",
      });
    },
  });

  const generateReleaseNotesMutation = useMutation({
    mutationFn: async (repositoryId: string) => {
      const response = await apiRequest("POST", `/api/repositories/${repositoryId}/release-notes`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Release Notes Generated",
        description: "Check the console for generated release notes.",
      });
      console.log("Generated Release Notes:", data);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate release notes.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addRepositoryMutation.mutate(formData);
  };

  const handleSync = (repositoryId: string) => {
    syncRepositoryMutation.mutate(repositoryId);
  };

  const handleDelete = (repositoryId: string) => {
    if (window.confirm("Are you sure you want to delete this repository?")) {
      deleteRepositoryMutation.mutate(repositoryId);
    }
  };

  const handleAnalyze = (repositoryId: string) => {
    analyzeRepositoryMutation.mutate(repositoryId);
  };

  const handleGenerateReleaseNotes = (repositoryId: string) => {
    generateReleaseNotesMutation.mutate(repositoryId);
  };

  return (
    <>
      <Header 
        title="Repositories" 
        subtitle="Manage your Git repositories and sync settings"
      />
      
      <div className="flex-1 overflow-auto p-6 space-y-6" data-testid="repositories-content">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Connected Repositories</h3>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-add-repository">
                <Plus className="w-4 h-4 mr-2" />
                Add Repository
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" data-testid="add-repository-dialog">
              <DialogHeader>
                <DialogTitle>Add New Repository</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gitUrl">Git URL</Label>
                  <Input
                    id="gitUrl"
                    type="url"
                    placeholder="https://github.com/username/repo"
                    value={formData.gitUrl}
                    onChange={(e) => setFormData({ ...formData, gitUrl: e.target.value })}
                    required
                    data-testid="input-git-url"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value) => setFormData({ ...formData, provider: value })}
                  >
                    <SelectTrigger data-testid="select-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="github">GitHub</SelectItem>
                      <SelectItem value="gitlab">GitLab</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessToken">Access Token</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={formData.accessToken}
                    onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                    required
                    data-testid="input-access-token"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the repository"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    data-testid="input-description"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={addRepositoryMutation.isPending}
                  data-testid="button-submit"
                >
                  {addRepositoryMutation.isPending ? "Adding..." : "Add Repository"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse" data-testid={`repository-skeleton-${i}`}>
                <CardContent className="p-6">
                  <div className="h-24 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : repositories.length === 0 ? (
          <Card className="bg-card border-border" data-testid="no-repositories">
            <CardContent className="p-12 text-center">
              <GitBranch className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Repositories Connected</h3>
              <p className="text-muted-foreground mb-4">
                Add your first repository to start generating documentation automatically.
              </p>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Repository
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repositories.map((repo, index) => (
              <Card key={repo.id} className="bg-card border-border" data-testid={`repository-card-${index}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <GitBranch className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base" data-testid={`repository-${index}-name`}>
                          {repo.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground capitalize">
                          {repo.provider}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSync(repo.id)}
                        disabled={syncRepositoryMutation.isPending}
                        data-testid={`button-sync-${index}`}
                      >
                        <RefreshCw className={`w-4 h-4 ${syncRepositoryMutation.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(repo.id)}
                        disabled={deleteRepositoryMutation.isPending}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3" data-testid={`repository-${index}-description`}>
                    {repo.description || "No description provided"}
                  </p>
                  
                  <div className="flex space-x-2 mb-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAnalyze(repo.id)}
                      disabled={analyzeRepositoryMutation.isPending}
                      className="flex-1"
                      data-testid={`button-analyze-${index}`}
                    >
                      <Brain className="w-3 h-3 mr-1" />
                      {analyzeRepositoryMutation.isPending ? "Analyzing..." : "AI Analysis"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateReleaseNotes(repo.id)}
                      disabled={generateReleaseNotesMutation.isPending}
                      className="flex-1"
                      data-testid={`button-release-notes-${index}`}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      {generateReleaseNotesMutation.isPending ? "Generating..." : "Release Notes"}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span data-testid={`repository-${index}-status`}>
                      {repo.isActive ? "Active" : "Inactive"}
                    </span>
                    <span data-testid={`repository-${index}-last-sync`}>
                      {repo.lastSyncAt 
                        ? `Synced ${formatDistanceToNow(new Date(repo.lastSyncAt), { addSuffix: true })}`
                        : "Never synced"
                      }
                    </span>
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
