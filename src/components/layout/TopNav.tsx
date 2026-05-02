import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MoodControl } from './MoodControl';
import { QuickStats } from './QuickStats';
import { useUserStore } from '@/store/user';
import { useAuthStore } from '@/store/auth';
import { useQuizStore } from '@/store/quiz';
import { usePathsStore } from '@/store/paths';
import { useSessionsStore } from '@/store/sessions';
import { useNotesStore } from '@/store/notes';
import { LogOut, User, Download, Upload, BarChart3, Check, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetClose,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        <QuickStats />
        <div className="hidden md:block">
          <MoodControl />
        </div>
        <div className="hidden md:block">
          <SyncIndicator />
        </div>
        {name && (
          <>
            {/* Desktop: Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-text-soft hover:text-text hover:bg-bg-2 rounded-lg transition-colors">
                <User size={16} />
                <span>{name}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px]">
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

            {/* Mobile: Sheet Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-text-soft hover:text-text hover:bg-bg-2 transition-colors">
                  <User size={20} />
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto flex flex-col rounded-t-2xl border-t">
                <SheetHeader className="pt-4">
                  <SheetTitle className="text-lg font-display font-semibold text-text">{name}</SheetTitle>
                  <SheetDescription className="text-sm text-text-muted">Account Menu</SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto space-y-6 py-6">
                  {/* Stats Section (Mobile Only) */}
                  <div className="space-y-2">
                    <p className="px-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Analytics</p>
                    <button
                      onClick={() => {
                        navigate('/stats');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 rounded-lg flex items-center gap-3 text-text-soft hover:text-text hover:bg-bg-2 transition-all duration-200"
                    >
                      <BarChart3 size={18} />
                      <span className="font-medium flex-1 text-left">Statistics</span>
                      <ChevronRight size={18} className="opacity-50" />
                    </button>
                  </div>

                  {/* Theme Selector Section */}
                  <div className="space-y-3">
                    <p className="px-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Theme</p>
                    <MobileThemeSelector onClose={() => setMobileMenuOpen(false)} />
                  </div>

                  {/* Data Actions Section */}
                  <div className="space-y-2">
                    <p className="px-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Data</p>
                    <button
                      onClick={handleExport}
                      className="w-full px-4 py-3 rounded-lg flex items-center gap-3 text-text-soft hover:text-text hover:bg-bg-2 transition-all duration-200"
                    >
                      <Download size={18} />
                      <span className="font-medium flex-1 text-left">Export Data</span>
                      <ChevronRight size={18} className="opacity-50" />
                    </button>
                    <button
                      onClick={handleImportClick}
                      className="w-full px-4 py-3 rounded-lg flex items-center gap-3 text-text-soft hover:text-text hover:bg-bg-2 transition-all duration-200"
                    >
                      <Upload size={18} />
                      <span className="font-medium flex-1 text-left">Import Data</span>
                      <ChevronRight size={18} className="opacity-50" />
                    </button>
                  </div>
                </div>

                {/* Logout Section (Bottom) */}
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 rounded-lg flex items-center gap-3 text-incorrect hover:bg-incorrect/10 transition-all duration-200 font-medium border-t border-border"
                >
                  <LogOut size={18} />
                  <span className="flex-1 text-left">Log Out</span>
                  <ChevronRight size={18} className="opacity-50" />
                </button>
              </SheetContent>
            </Sheet>
          </>
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

// Mobile Theme Selector Component
import { type MoodTheme, THEME_LABELS, getTimeTheme, applyTheme, persistMood } from '@/lib/theme';
import { useUIStore } from '@/store/ui';

const MOODS: MoodTheme[] = ['sage', 'storm', 'sand', 'plum', 'golden-glow', 'midnight'];

const MOOD_COLORS: Record<MoodTheme, string> = {
  sage: '#4A7A38',
  storm: '#3058A0',
  sand: '#8A6840',
  plum: '#703888',
  'golden-glow': '#d97706',
  midnight: '#10141a',
};

interface MobileThemeSelectorProps {
  onClose?: () => void;
}

function MobileThemeSelector({ onClose }: MobileThemeSelectorProps) {
  const { activeMood, setMood } = useUIStore();

  const handleSelect = (mood: MoodTheme | null) => {
    setMood(mood);
    persistMood(mood);
    if (!mood) applyTheme(getTimeTheme());
    onClose?.();
  };

  return (
    <div className="px-4 space-y-2">
      {/* Auto Button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => handleSelect(null)}
        className={`w-full px-4 py-3 rounded-lg flex items-center justify-between transition-all duration-200
          ${
            !activeMood
              ? 'bg-accent text-accent-text'
              : 'bg-bg-2 text-text-soft hover:text-text'
          }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-current opacity-60" />
          <span className="font-medium">Auto (Time-based)</span>
        </div>
        {!activeMood && <Check size={18} />}
      </motion.button>

      {/* Mood Buttons */}
      {MOODS.map((mood, index) => (
        <motion.button
          key={mood}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (index + 1) * 0.05 }}
          onClick={() => handleSelect(mood)}
          className={`w-full px-4 py-3 rounded-lg flex items-center justify-between transition-all duration-200
            ${
              activeMood === mood
                ? 'bg-accent text-accent-text'
                : 'bg-bg-2 text-text-soft hover:text-text'
            }`}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full border-2"
              style={{
                backgroundColor: MOOD_COLORS[mood],
                borderColor: 'currentColor',
              }}
            />
            <span className="font-medium">{THEME_LABELS[mood]}</span>
          </div>
          {activeMood === mood && <Check size={18} />}
        </motion.button>
      ))}
    </div>
  );
}
