import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { MoodControl } from './MoodControl';
import { useUserStore } from '@/store/user';
import { useAuthStore } from '@/store/auth';
import { useQuizStore } from '@/store/quiz';
import { usePathsStore } from '@/store/paths';
import { useSessionsStore } from '@/store/sessions';
import { useNotesStore } from '@/store/notes';
import { LogOut, User, Download, Upload } from 'lucide-react';
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
  { path: '/notes', label: 'Notes' },
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
    <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-border bg-surface themed">
      <div className="flex items-center gap-10">
        <Link to="/dashboard" className="font-display text-xl text-text tracking-tight">
          quietude
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors duration-150
                ${location.pathname === item.path
                  ? 'text-text font-medium bg-bg-2'
                  : 'text-text-soft hover:text-text hover:bg-bg-2'
                }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <SyncIndicator />
        <MoodControl />
        {name && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-soft hover:text-text hover:bg-bg-2 rounded-lg transition-colors">
              <User size={16} />
              <span>{name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
