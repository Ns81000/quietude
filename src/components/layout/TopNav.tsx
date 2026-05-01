import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { motion } from 'framer-motion';
import { MoodControl } from './MoodControl';
import { useUserStore } from '@/store/user';
import { useAuthStore } from '@/store/auth';
import { useQuizStore } from '@/store/quiz';
import { usePathsStore } from '@/store/paths';
import { useSessionsStore } from '@/store/sessions';
import { useNotesStore } from '@/store/notes';
import { LogOut, User, Download, Upload, BarChart3 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { downloadExport, readImportFile, importData } from '@/lib/dataExport';
import { SyncIndicator } from '@/components/auth/SyncIndicator';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/quizzes', label: 'Quizzes' },
  { path: '/flashcards', label: 'Flashcards' },
  { path: '/notes', label: 'Notes' },
  { path: '/discuss', label: 'Discuss' },
  { path: '/stats', label: 'Stats' },
];

export function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, clear: clearUser } = useUserStore();
  const { logout } = useAuthStore();
  const { reset: resetQuiz } = useQuizStore();
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    toast.loading('Syncing data before logout...', { id: 'logout' });
    
    try {
      await logout();
      
      clearUser();
      resetQuiz();
      usePathsStore.setState({ paths: [], activePathId: null });
      useSessionsStore.setState({ sessions: [] });
      useNotesStore.setState({ notes: [], selectedNote: null });
      
      // Clear all quietude localStorage (auth session already removed by logout())
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('quietude')) {
          localStorage.removeItem(key);
        }
      });
      // Clear sessionStorage flags
      sessionStorage.removeItem('quietude:sync-done');
      sessionStorage.removeItem('quietude:login-in-progress');
      
      toast.success('Logged out successfully', { id: 'logout' });
      navigate('/');
    } catch (err) {
      toast.error('Logout failed', { id: 'logout' });
    }
  };

  const handleExport = () => {
    try {
      downloadExport();
      toast.success('Data exported successfully');
    } catch {
      toast.error('Failed to export data');
    }
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await readImportFile(file);
      const result = importData(data, true);
      if (result.success && result.stats) {
        toast.success(
          `Imported ${result.stats.pathsImported} subjects, ${result.stats.sessionsImported} sessions, ${result.stats.notesImported} notes`
        );
      } else {
        toast.error(result.error || 'Import failed');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to read file');
    }
    e.target.value = '';
  };

  return (
    <header className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b border-border/60 bg-surface/80 backdrop-blur-xl sticky top-0 z-30 themed">
      <div className="flex items-center gap-10">
        <Link to="/dashboard" className="font-display text-xl text-accent tracking-tight">
          quietude
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-out
                  ${isActive ? 'text-accent bg-accent/5 shadow-[inset_0_-2px_0_0_rgba(var(--accent),1)]' : 'text-text-soft hover:text-text hover:bg-bg-2/50'}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <SyncIndicator />
        <div className="hidden md:block">
          <MoodControl />
        </div>
        {name && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-2 md:px-3 py-1.5 text-sm text-text-soft hover:text-text hover:bg-bg-2 rounded-lg transition-colors">
              <User size={16} />
              <span className="hidden md:inline">{name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              <DropdownMenuItem onClick={() => navigate('/stats')} className="md:hidden">
                <BarChart3 size={14} className="mr-2" />
                Stats
              </DropdownMenuItem>
              
              <div className="md:hidden">
                <DropdownMenuSeparator />
                <ThemeSelector />
              </div>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExport}>
                <Download size={14} className="mr-2" />
                Export Data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleImportClick}>
                <Upload size={14} className="mr-2" />
                Import Data
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-incorrect">
                <LogOut size={14} className="mr-2" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <input
          ref={importInputRef}
          type="file"
          accept=".json"
          onChange={handleImportFile}
          className="hidden"
        />
      </div>
    </header>
  );
}

// Theme selector component for mobile dropdown
import { type MoodTheme, THEME_LABELS, getTimeTheme, applyTheme } from '@/lib/theme';
import { useUIStore } from '@/store/ui';
import { Palette, Check } from 'lucide-react';

const MOODS: (MoodTheme | null)[] = [null, 'sage', 'storm', 'sand', 'plum', 'ink', 'midnight'];

function ThemeSelector() {
  const { activeMood, setMood } = useUIStore();

  const handleSelect = (mood: MoodTheme | null) => {
    setMood(mood);
    if (!mood) applyTheme(getTimeTheme());
  };

  return (
    <div className="px-2 py-1.5">
      <div className="flex items-center gap-2 mb-2 px-1">
        <Palette size={14} className="text-text-muted" />
        <span className="text-xs text-text-muted font-medium">Theme</span>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {MOODS.map((mood) => (
          <button
            key={mood || 'auto'}
            onClick={() => handleSelect(mood)}
            className={`px-2 py-1.5 text-xs rounded-md transition-colors flex items-center justify-center gap-1
              ${mood === 'midnight' ? 'col-span-3 mt-1' : ''}
              ${activeMood === mood 
                ? 'bg-accent text-accent-text' 
                : 'bg-bg-2 text-text-muted hover:text-text'}`}
          >
            {mood ? THEME_LABELS[mood] : 'Auto'}
            {activeMood === mood && <Check size={10} />}
          </button>
        ))}
      </div>
    </div>
  );
}
