import Header from "@/components/layout/header";
import StatsCards from "@/components/dashboard/stats-cards";
import RecentActivity from "@/components/dashboard/recent-activity";
import AIChat from "@/components/dashboard/ai-chat";
import RepositoryStatus from "@/components/dashboard/repository-status";
import PendingSuggestions from "@/components/dashboard/pending-suggestions";

export default function Dashboard() {
  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle="Monitor your repositories and documentation status"
      />
      
      <div className="flex-1 overflow-auto p-6 space-y-6" data-testid="dashboard-content">
        <StatsCards />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivity />
          <AIChat />
        </div>

        <RepositoryStatus />
        <PendingSuggestions />
      </div>
    </>
  );
}
