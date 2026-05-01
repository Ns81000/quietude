import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, BookOpen, Layers, Brain } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard },
  { path: '/quizzes', icon: FileText },
  { path: '/flashcards', icon: Layers },
  { path: '/notes', icon: BookOpen },
  { path: '/discuss', icon: Brain },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-t border-border/60 shadow-[0_-4px_24px_rgba(0,0,0,0.05)]
                    flex items-center justify-around px-2 py-3 pb-safe themed">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`relative flex flex-col items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-xl transition-all duration-200 
              ${isActive ? 'text-accent' : 'text-text-muted hover:text-text'}`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 1.75} />
            {isActive && (
              <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-accent animate-in fade-in zoom-in duration-200" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
