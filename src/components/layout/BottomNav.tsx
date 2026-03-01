import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import { LayoutDashboard, FileText, BookOpen, BarChart3, User, LogOut, Download, Upload, Palette, Check, Loader2 } from 'lucide-react';
import { useUserStore } from '@/store/user';
import { useQuizStore } from '@/store/quiz';
import { usePathsStore } from '@/store/paths';
import { useSessionsStore } from '@/store/sessions';
import { useNotesStore } from '@/store/notes';
import { useUIStore } from '@/store/ui';
import { useAuthStore } from '@/store/auth';
import { type MoodTheme, THEME_LABELS, getTimeTheme, applyTheme } from '@/lib/theme';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { downloadExport, readImportFile, importData } from '@/lib/dataExport';
import { SyncIndicator } from '@/components/auth/SyncIndicator';

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard },
  { path: '/quizzes', icon: FileText },
  { path: '/notes', icon: BookOpen },
  { path: '/stats', icon: BarChart3 },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clear: clearUser } = useUserStore();
  const { reset: resetQuiz } = useQuizStore();
  const { logout: authLogout, syncAllData, syncStatus } = useAuthStore();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Sync all data before logout
      await syncAllData();
      
      // Perform auth logout
      await authLogout();
      
      // Clear local stores
      clearUser();
      resetQuiz();
      usePathsStore.setState({ paths: [], activePathId: null });
      useSessionsStore.setState({ sessions: [] });
      useNotesStore.setState({ notes: [], selectedNote: null });
      
      // Clear local storage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('quietude')) {
          localStorage.removeItem(key);
        }
      });
      // Clear sessionStorage flags
      sessionStorage.removeItem('quietude:sync-done');
      sessionStorage.removeItem('quietude:login-in-progress');
      
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error during logout, but local data cleared');
      navigate('/');
    } finally {
      setIsLoggingOut(false);
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border
                    flex items-center justify-around px-4 py-3 themed">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`p-2 rounded-md transition-colors duration-150
              ${isActive ? 'text-accent' : 'text-text-muted hover:text-text-soft'}`}
          >
            <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
          </Link>
        );
      })}
      
      {/* Profile/Logout Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="p-2 rounded-md text-text-muted hover:text-text-soft transition-colors duration-150 relative">
          <User size={22} strokeWidth={1.5} />
          {/* Sync status indicator dot */}
          {syncStatus === 'syncing' && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          )}
          {syncStatus === 'error' && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="min-w-[180px]">
          {/* Sync Status */}
          <div className="px-2 py-1.5">
            <SyncIndicator />
          </div>
          <DropdownMenuSeparator />
          {/* Theme Selection */}
          <ThemeSelector />
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
          <DropdownMenuItem 
            onClick={handleLogout} 
            className="text-incorrect"
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <Loader2 size={14} className="mr-2 animate-spin" />
            ) : (
              <LogOut size={14} className="mr-2" />
            )}
            {isLoggingOut ? 'Syncing...' : 'Log Out'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Hidden file input for import */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        onChange={handleImportFile}
        className="hidden"
      />
    </nav>
  );
}

// Theme selector component for mobile dropdown
const MOODS: (MoodTheme | null)[] = [null, 'sage', 'storm', 'sand', 'plum', 'ink'];

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
