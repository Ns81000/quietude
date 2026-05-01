import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';

interface ShellProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

export function Shell({ children, hideNav = false }: ShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text selection:bg-accent/20 selection:text-text subpixel-antialiased">
      {!hideNav && <TopNav />}
      <main className="flex-1 w-full max-w-content mx-auto px-4 md:px-8 py-6 md:py-10 pb-24 md:pb-10 relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/5 via-bg to-bg opacity-70 pointer-events-none" />
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
