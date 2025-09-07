import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Plus, Edit, Trash2, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface WikiPage {
  id: string;
  title: string;
  content: string;
  path: string;
  repositoryId: string;
  createdAt: string;
  updatedAt: string;
}

export default function WikiManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPage, setEditingPage] = useState<WikiPage | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    path: "",
    repositoryId: "",
  });

  const queryClient = useQueryClient();

  const { data: wikiPages = [], isLoading } = useQuery<WikiPage[]>({
    queryKey: ["/api/wiki-pages"],
    queryFn: async () => {
      // For now, we'll create mock data since wiki pages aren't fully implemented
      return [];
    }
  });

  const { data: repositories = [] } = useQuery({
    queryKey: ["/api/repositories"],
  });

  const createPageMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // This would be implemented when wiki API is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wiki-pages"] });
      setIsCreateDialogOpen(false);
      setFormData({ title: "", content: "", path: "", repositoryId: "" });
      toast({
        title: "Success",
        description: "Wiki page created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create wiki page.",
        variant: "destructive",
      });
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      // This would be implemented when wiki API is ready
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wiki-pages"] });
      toast({
        title: "Success",
        description: "Wiki page deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete wiki page.",
        variant: "destructive",
      });
    },
  });

  const filteredPages = wikiPages.filter(page =>
    searchQuery === "" ||
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPageMutation.mutate(formData);
  };

  const handleDelete = (pageId: string) => {
    if (window.confirm("Are you sure you want to delete this wiki page?")) {
      deletePageMutation.mutate(pageId);
    }
  };

  const getRepositoryName = (repositoryId: string) => {
    const repo = repositories.find((r: any) => r.id === repositoryId);
    return repo?.name || "Unknown Repository";
  };

  return (
    <>
      <Header 
        title="Wiki Management" 
        subtitle="Manage wiki pages and documentation structure"
      />
      
      <div className="flex-1 overflow-auto p-6 space-y-6" data-testid="wiki-management-content">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search wiki pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="search-input"
            />
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="create-page-button">
                <Plus className="w-4 h-4 mr-2" />
                Create Page
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]" data-testid="create-page-dialog">
              <DialogHeader>
                <DialogTitle>Create New Wiki Page</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Page Title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      data-testid="input-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="path">Path</Label>
                    <Input
                      id="path"
                      placeholder="/docs/api-guide"
                      value={formData.path}
                      onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                      required
                      data-testid="input-path"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your documentation content here..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                    required
                    data-testid="input-content"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={createPageMutation.isPending}
                  data-testid="submit-button"
                >
                  {createPageMutation.isPending ? "Creating..." : "Create Page"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pages</p>
                  <p className="text-2xl font-bold" data-testid="total-pages">{wikiPages.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Connected Repos</p>
                  <p className="text-2xl font-bold" data-testid="connected-repos">{repositories.length}</p>
                </div>
                <FileText className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Recently Updated</p>
                  <p className="text-2xl font-bold" data-testid="recent-updates">
                    {wikiPages.filter(p => {
                      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                      return new Date(p.updatedAt) > dayAgo;
                    }).length}
                  </p>
                </div>
                <Edit className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wiki Pages List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse" data-testid={`skeleton-${i}`}>
                <CardContent className="p-6">
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPages.length === 0 ? (
          <Card className="bg-card border-border" data-testid="no-pages">
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {wikiPages.length === 0 ? "No Wiki Pages Yet" : "No Pages Match Your Search"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {wikiPages.length === 0 
                  ? "Create your first wiki page to start organizing your documentation."
                  : "Try adjusting your search terms or create a new page."
                }
              </p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Page
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPages.map((page, index) => (
              <Card key={page.id} className="bg-card border-border" data-testid={`page-${index}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1" data-testid={`page-title-${index}`}>
                        {page.title}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span data-testid={`page-path-${index}`}>{page.path}</span>
                        <span data-testid={`page-repo-${index}`}>
                          {getRepositoryName(page.repositoryId)}
                        </span>
                        <span data-testid={`page-updated-${index}`}>
                          Updated {formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPage(page)}
                        data-testid={`edit-button-${index}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(page.id)}
                        disabled={deletePageMutation.isPending}
                        className="text-destructive hover:text-destructive"
                        data-testid={`delete-button-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`page-content-${index}`}>
                    {page.content.substring(0, 200)}...
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}