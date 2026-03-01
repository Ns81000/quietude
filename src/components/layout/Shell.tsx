import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';

interface ShellProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

export function Shell({ children, hideNav = false }: ShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {!hideNav && <TopNav />}
      <main className="flex-1 w-full max-w-content mx-auto px-4 md:px-8 py-6 md:py-10 pb-24 md:pb-10">
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
