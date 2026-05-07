'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import AppShell from '@/components/layout/AppShell';
import UpgradeModal from '@/components/UpgradeModal';
import api from '@/lib/api';
import type { SubscriptionTier } from '@autoguildx/shared';

export default function SettingsPage() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  const { data: subscription } = useQuery<{ tier: SubscriptionTier; active: boolean }>({
    queryKey: ['subscription'],
    queryFn: () => api.get('/subscriptions/me').then((r) => r.data),
    enabled: isAuthenticated,
  });

  const { data: emailSettings } = useQuery<{ emailNotificationsEnabled: boolean }>({
    queryKey: ['emailSettings'],
    queryFn: () => api.get('/notifications/email-settings').then((r) => r.data),
    enabled: isAuthenticated,
  });

  const [showUpgrade, setShowUpgrade] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Change password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  const changePwMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.patch('/auth/change-password', data).then((r) => r.data),
    onSuccess: () => {
      setPwMessage('Password changed successfully.');
      setPwError('');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    },
    onError: (err: any) => {
      setPwError(err.response?.data?.message ?? 'Failed to change password.');
      setPwMessage('');
    },
  });

  const handleChangePw = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (newPw !== confirmPw) {
      setPwError('New passwords do not match.');
      return;
    }
    changePwMutation.mutate({ currentPassword: currentPw, newPassword: newPw });
  };

  // Email notifications toggle
  const emailToggle = useMutation({
    mutationFn: (enabled: boolean) =>
      api.patch('/notifications/email-settings', { emailNotificationsEnabled: enabled }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emailSettings'] }),
  });

  // Delete account
  const deleteAccount = useMutation({
    mutationFn: () => api.delete('/auth/account').then((r) => r.data),
    onSuccess: () => {
      logout();
      router.replace('/');
    },
    onError: (err: any) => {
      setDeleteError(err.response?.data?.message ?? 'Failed to delete account.');
    },
  });

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');
    if (deleteConfirm !== 'DELETE') {
      setDeleteError('Type DELETE exactly to confirm.');
      return;
    }
    deleteAccount.mutate();
  };

  const tier = subscription?.tier ?? 'free';
  const TIER_LABELS: Record<string, string> = { free: 'Free', owner: 'Owner', company: 'Company' };

  if (!isAuthenticated) return null;

  return (
    <AppShell>
      <div className="max-w-xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold">Account Settings</h1>

        {/* Subscription / Plan */}
        <section className="card space-y-4">
          <h2 className="text-lg font-semibold">Plan &amp; Subscription</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Current plan</p>
              <p className="font-medium text-white">{TIER_LABELS[tier]} Plan</p>
            </div>
            <button
              onClick={() => setShowUpgrade(true)}
              className="btn-secondary text-sm"
            >
              {tier === 'free' ? 'Upgrade' : 'Manage plan'}
            </button>
          </div>
          {tier !== 'free' && (
            <p className="text-xs text-gray-500">
              To cancel or downgrade, click &ldquo;Manage plan&rdquo; above.
            </p>
          )}
        </section>

        {/* Change Password */}
        <section className="card space-y-4">
          <h2 className="text-lg font-semibold">Change Password</h2>
          <form onSubmit={handleChangePw} className="space-y-3">
            <input
              className="input"
              type="password"
              placeholder="Current password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
            />
            <input
              className="input"
              type="password"
              placeholder="New password (8+ characters)"
              value={newPw}
              minLength={8}
              onChange={(e) => setNewPw(e.target.value)}
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Confirm new password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
            />
            {pwError && <p className="text-red-400 text-sm">{pwError}</p>}
            {pwMessage && <p className="text-green-400 text-sm">{pwMessage}</p>}
            <button
              className="btn-primary"
              type="submit"
              disabled={changePwMutation.isPending}
            >
              {changePwMutation.isPending ? 'Saving…' : 'Update password'}
            </button>
          </form>
        </section>

        {/* Email Notifications */}
        <section className="card space-y-4">
          <h2 className="text-lg font-semibold">Email Notifications</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Receive email notifications</p>
              <p className="text-xs text-gray-500">
                New messages, followers, reviews, and verification updates.
              </p>
            </div>
            <button
              onClick={() =>
                emailToggle.mutate(!(emailSettings?.emailNotificationsEnabled ?? true))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailSettings?.emailNotificationsEnabled ? 'bg-brand-500' : 'bg-gray-600'
              }`}
              disabled={emailToggle.isPending}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  emailSettings?.emailNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="card border border-red-900/50 space-y-4">
          <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
          <p className="text-sm text-gray-400">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <form onSubmit={handleDelete} className="space-y-3">
            <input
              className="input border-red-900/50 focus:border-red-500"
              type="text"
              placeholder='Type DELETE to confirm'
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
            />
            {deleteError && <p className="text-red-400 text-sm">{deleteError}</p>}
            <button
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
              type="submit"
              disabled={deleteAccount.isPending}
            >
              {deleteAccount.isPending ? 'Deleting…' : 'Delete my account'}
            </button>
          </form>
        </section>
      </div>

      {showUpgrade && <UpgradeModal currentTier={tier} onClose={() => setShowUpgrade(false)} />}
    </AppShell>
  );
}
