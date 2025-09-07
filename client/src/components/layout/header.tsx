import { Button } from "@/components/ui/button";
import { RefreshCw, User } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle: string;
  onSync?: () => void;
  isSyncing?: boolean;
}

export default function Header({ title, subtitle, onSync, isSyncing }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border p-6" data-testid="header">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold" data-testid="page-title">{title}</h2>
          <p className="text-muted-foreground" data-testid="page-subtitle">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          {onSync && (
            <Button 
              onClick={onSync} 
              disabled={isSyncing}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-sync"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Repositories'}</span>
            </Button>
          )}
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" data-testid="user-avatar" />
          </div>
        </div>
      </div>
    </header>
  );
}
