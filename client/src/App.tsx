import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Repositories from "@/pages/repositories";
import WikiManagement from "@/pages/wiki-management";
import Documentation from "@/pages/documentation";
import Analytics from "@/pages/analytics";
import AIAssistant from "@/pages/ai-assistant";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/repositories" component={Repositories} />
          <Route path="/wiki-management" component={WikiManagement} />
          <Route path="/documentation" component={Documentation} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/ai-assistant" component={AIAssistant} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
