'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Package, Calendar, User, PlusSquare } from 'lucide-react';
import { clsx } from 'clsx';

const NAV = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/discover', label: 'Discover', icon: Search },
  { href: '/marketplace', label: 'Market', icon: Package },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-surface-border px-4 py-3 flex items-center justify-between">
        <Link href="/feed" className="text-brand-500 font-black text-lg tracking-tight">
          AutoGuildX
        </Link>
        <Link
          href="/marketplace/new"
          className="btn-primary text-sm flex items-center gap-1.5 px-3 py-1.5"
        >
          <PlusSquare className="w-4 h-4" /> Post
        </Link>
      </header>

      {/* Main + sidebar layout */}
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <nav className="hidden md:flex flex-col gap-1 w-56 shrink-0 p-4 border-r border-surface-border">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith(href)
                  ? 'bg-surface-border text-white'
                  : 'text-gray-400 hover:text-white hover:bg-surface-card',
              )}
            >
              <Icon className="w-5 h-5" /> {label}
            </Link>
          ))}
        </nav>

        {/* Content */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-surface-border flex justify-around py-2">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex flex-col items-center gap-0.5 text-xs px-3 py-1 rounded-lg transition-colors',
              pathname.startsWith(href) ? 'text-brand-500' : 'text-gray-500',
            )}
          >
            <Icon className="w-6 h-6" /> {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
