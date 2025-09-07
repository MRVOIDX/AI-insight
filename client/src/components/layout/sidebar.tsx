import { Link, useLocation } from "wouter";
import { Bot, Settings, Activity } from "lucide-react";

const navigationItems = [
  { path: "/", label: "Dashboard", icon: "fas fa-tachometer-alt" },
  { path: "/repositories", label: "Repositories", icon: "fas fa-code-branch" },
  { path: "/wiki-management", label: "Wiki Management", icon: "fas fa-book" },
  { path: "/documentation", label: "Documentation", icon: "fas fa-file-alt" },
  { path: "/analytics", label: "Analytics", icon: "fas fa-chart-line" },
  { path: "/ai-assistant", label: "AI Assistant", icon: "fas fa-comments" },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col" data-testid="sidebar">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Bot className="text-primary-foreground text-lg" data-testid="logo-icon" />
          </div>
          <div>
            <h1 className="text-lg font-semibold" data-testid="app-title">GitWiki AI</h1>
            <p className="text-xs text-muted-foreground" data-testid="app-subtitle">Intelligent Docs</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2" data-testid="navigation">
        {navigationItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <div 
              className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                location === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <i className={`${item.icon} w-4`} />
              <span>{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3 mb-3">
          <div className="status-indicator status-active"></div>
          <span className="text-sm text-muted-foreground" data-testid="api-status">Gemini API Connected</span>
        </div>
        <button 
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
          data-testid="button-settings"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
