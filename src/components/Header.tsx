import { TrendingUp, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="border-b border-accent/30 bg-gradient-subtle shadow-glow backdrop-blur-md relative scan-lines">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-lg shadow-glow neon-glow">
              <TrendingUp className="h-7 w-7 text-background animate-neon-flicker" />
            </div>
            <div>
              <h1 className="text-xl font-orbitron font-black text-foreground tracking-wider">CAPITAL COMPASS</h1>
              <p className="text-sm text-accent font-space-grotesk">Portfolio Decision Intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="hover:bg-accent/20 hover:text-accent">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-accent/20 hover:text-accent">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}