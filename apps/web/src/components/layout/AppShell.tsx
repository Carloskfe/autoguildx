'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Package,
  Calendar,
  User,
  PlusSquare,
  Zap,
  MessageSquare,
  Bell,
  Hash,
  ShieldCheck,
  GraduationCap,
  Settings,
  MapIcon,
  Wrench,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import UpgradeModal from '@/components/UpgradeModal';
import NotificationPanel from '@/components/NotificationPanel';
import TourGuide, { TOUR_KEY } from '@/components/TourGuide';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import api from '@/lib/api';
import type { SubscriptionTier } from '@autoguildx/shared';
import { useTranslations } from 'next-intl';

const NAV_ITEMS: { href: string; labelKey: string; icon: React.ElementType; tourId?: string }[] = [
  { href: '/feed', labelKey: 'feed', icon: Home, tourId: 'tour-nav-feed' },
  { href: '/discover', labelKey: 'discover', icon: Search },
  { href: '/agxtopics', labelKey: 'agxtopics', icon: Hash },
  { href: '/courses', labelKey: 'courses', icon: GraduationCap, tourId: 'tour-nav-courses' },
  { href: '/marketplace', labelKey: 'market', icon: Package, tourId: 'tour-nav-market' },
  { href: '/events', labelKey: 'events', icon: Calendar },
  { href: '/messages', labelKey: 'messages', icon: MessageSquare },
  { href: '/profile', labelKey: 'profile', icon: User, tourId: 'tour-nav-profile' },
];

const MOBILE_NAV_ITEMS: { href: string; labelKey: string; icon: React.ElementType }[] = [
  { href: '/feed', labelKey: 'feed', icon: Home },
  { href: '/discover', labelKey: 'discover', icon: Search },
  { href: '/marketplace', labelKey: 'market', icon: Package },
  { href: '/messages', labelKey: 'messages', icon: MessageSquare },
  { href: '/profile', labelKey: 'profile', icon: User },
];

const TIER_BADGE: Record<string, { labelKey: string; className: string }> = {
  free: {
    labelKey: 'plan_free',
    className: 'bg-surface-card text-gray-400 border border-surface-border',
  },
  owner: {
    labelKey: 'plan_owner',
    className: 'bg-brand-500/20 text-brand-500 border border-brand-500/40',
  },
  company: {
    labelKey: 'plan_company',
    className: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
  },
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, role } = useAuth();
  const tn = useTranslations('nav');
  const ta = useTranslations('appshell');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [tourRun, setTourRun] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    // Tour targets the desktop sidebar — only run on md+ screens
    if (window.innerWidth < 768) return;
    if (!localStorage.getItem(TOUR_KEY)) setTourRun(true);
  }, [isAuthenticated]);

  const { data: subscription } = useQuery<{ tier: SubscriptionTier; active: boolean }>({
    queryKey: ['subscription'],
    queryFn: () => api.get('/subscriptions/me').then((r) => r.data),
    enabled: isAuthenticated,
  });

  const unreadCount = useUnreadCount();

  const { data: notifUnread } = useQuery<{ count: number }>({
    queryKey: ['notifUnread'],
    queryFn: () => api.get('/notifications/unread-count').then((r) => r.data),
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });

  const notifCount = notifUnread?.count ?? 0;
  const tier = subscription?.tier ?? 'free';
  const badge = TIER_BADGE[tier] ?? TIER_BADGE.free;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-surface-border shadow-sm shadow-black/40 px-4 py-3 flex items-center justify-between">
        <Link href="/feed" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-md bg-brand-500 flex items-center justify-center shrink-0 group-hover:bg-brand-600 transition-colors">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-black text-lg tracking-tight text-white">
            AutoGuildX
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <button
              onClick={() => setShowUpgrade(true)}
              className={clsx(
                'hidden sm:flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium transition-colors hover:opacity-80',
                badge.className,
              )}
            >
              <Zap className="w-3 h-3" />
              {ta(badge.labelKey)}
            </button>
          )}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative p-1.5 text-gray-400 hover:text-white transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {notifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-brand-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <NotificationPanel onClose={() => setShowNotifications(false)} />
              )}
            </div>
          )}
          <LocaleSwitcher />
          <Link
            href="/marketplace/new"
            className="btn-primary text-sm flex items-center gap-1.5 px-3 py-1.5"
          >
            <PlusSquare className="w-4 h-4" /> {ta('post')}
          </Link>
        </div>
      </header>

      {/* Main + sidebar layout */}
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <nav className="hidden md:flex flex-col gap-1 w-56 shrink-0 p-4 border-r border-surface-border sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          {NAV_ITEMS.map(({ href, labelKey, icon: Icon, tourId }) => (
            <Link
              key={href}
              id={tourId}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith(href)
                  ? 'bg-brand-500/10 text-white border-l-2 border-brand-500 pl-[10px]'
                  : 'text-gray-400 hover:text-white hover:bg-surface-card border-l-2 border-transparent',
              )}
            >
              <span className="relative">
                <Icon className="w-5 h-5" />
                {href === '/messages' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-brand-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
              {tn(labelKey)}
            </Link>
          ))}

          {isAuthenticated && (
            <button
              onClick={() => setShowUpgrade(true)}
              className={clsx(
                'mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80',
                badge.className,
              )}
            >
              <Zap className="w-4 h-4" />
              {tn('upgrade')}
            </button>
          )}

          {isAuthenticated && (
            <Link
              href="/settings"
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith('/settings')
                  ? 'bg-surface-border text-white'
                  : 'text-gray-400 hover:text-white hover:bg-surface-card',
              )}
            >
              <Settings className="w-5 h-5" />
              {tn('settings')}
            </Link>
          )}

          {role === 'admin' && (
            <Link
              href="/admin"
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith('/admin')
                  ? 'bg-surface-border text-white'
                  : 'text-gray-400 hover:text-white hover:bg-surface-card',
              )}
            >
              <ShieldCheck className="w-5 h-5" />
              {tn('admin')}
            </Link>
          )}

          <div className="mt-auto pt-6 flex flex-col gap-1 text-xs text-gray-600">
            {isAuthenticated && (
              <button
                onClick={() => {
                  localStorage.removeItem(TOUR_KEY);
                  setTourRun(true);
                }}
                className="flex items-center gap-1.5 hover:text-gray-400 transition-colors text-left"
              >
                <MapIcon className="w-3 h-3" />
                {tn('take_tour')}
              </button>
            )}
            <Link href="/team" className="hover:text-gray-400 transition-colors">
              {tn('about')}
            </Link>
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">
              {tn('privacy')}
            </Link>
            <Link href="/terms" className="hover:text-gray-400 transition-colors">
              {tn('terms')}
            </Link>
            <Link href="/cookies" className="hover:text-gray-400 transition-colors">
              {tn('cookies')}
            </Link>
            <Link href="/disclaimer" className="hover:text-gray-400 transition-colors">
              {tn('disclaimer')}
            </Link>
            <span className="mt-1">{tn('copyright')}</span>
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-surface-border flex justify-around py-2">
        {MOBILE_NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex flex-col items-center gap-0.5 text-xs px-2 py-1 rounded-lg transition-colors min-w-0',
              pathname.startsWith(href) ? 'text-brand-500' : 'text-gray-500',
            )}
          >
            <span className="relative">
              <Icon className="w-6 h-6" />
              {href === '/messages' && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
            <span className="truncate">{tn(labelKey)}</span>
          </Link>
        ))}
      </nav>

      {showUpgrade && <UpgradeModal currentTier={tier} onClose={() => setShowUpgrade(false)} />}
      <TourGuide run={tourRun} onEnd={() => setTourRun(false)} />
    </div>
  );
}
