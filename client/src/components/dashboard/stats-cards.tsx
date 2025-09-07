import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { GitBranch, AlertTriangle, Lightbulb, PieChart } from "lucide-react";

interface DashboardStats {
  activeRepos: number;
  pendingDocs: number;
  aiSuggestions: number;
  coverage: number;
}

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse" data-testid={`stats-skeleton-${i}`}>
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Active Repositories",
      value: stats?.activeRepos ?? 0,
      change: "+2",
      changeLabel: "this week",
      icon: GitBranch,
      color: "text-primary",
      bgColor: "bg-primary/10",
      testId: "stats-active-repos"
    },
    {
      title: "Pending Documentation",
      value: stats?.pendingDocs ?? 0,
      change: "+5",
      changeLabel: "since yesterday",
      icon: AlertTriangle,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      testId: "stats-pending-docs"
    },
    {
      title: "AI Suggestions",
      value: stats?.aiSuggestions ?? 0,
      change: "92%",
      changeLabel: "acceptance rate",
      icon: Lightbulb,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      testId: "stats-ai-suggestions"
    },
    {
      title: "Documentation Coverage",
      value: `${stats?.coverage ?? 0}%`,
      change: "+3%",
      changeLabel: "improvement",
      icon: PieChart,
      color: "text-accent",
      bgColor: "bg-accent/10",
      testId: "stats-coverage"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat) => (
        <Card key={stat.title} className="bg-card border-border" data-testid={stat.testId}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-semibold text-foreground" data-testid={`${stat.testId}-value`}>
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-accent" data-testid={`${stat.testId}-change`}>{stat.change}</span>
              <span className="text-muted-foreground ml-1">{stat.changeLabel}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
