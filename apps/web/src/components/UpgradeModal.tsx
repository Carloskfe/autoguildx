'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Check, Loader2, Zap } from 'lucide-react';
import { SUBSCRIPTION_PRICES, SubscriptionTier } from '@autoguildx/shared';
import api from '@/lib/api';

interface Props {
  onClose: () => void;
  currentTier?: SubscriptionTier;
}

const TIERS: { id: SubscriptionTier; name: string; color: string }[] = [
  { id: 'free', name: 'Free', color: 'border-surface-border' },
  { id: 'owner', name: 'Owner', color: 'border-brand-500' },
  { id: 'company', name: 'Company', color: 'border-yellow-500' },
];

const FEATURES: Record<SubscriptionTier, string[]> = {
  free: ['Up to 5 listings', 'No featured campaigns', 'Community access'],
  owner: ['Up to 15 listings', '1 featured campaign', 'Priority listing placement'],
  company: [
    'Unlimited listings',
    '5 featured campaigns',
    'Priority listing placement',
    'Company badge',
  ],
};

export default function UpgradeModal({ onClose, currentTier = 'free' }: Props) {
  const qc = useQueryClient();

  const upgrade = useMutation({
    mutationFn: (tier: 'owner' | 'company') => api.post('/subscriptions/upgrade', { tier }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-surface border border-surface-border rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-500" />
            <h2 className="text-lg font-bold text-white">Upgrade Your Plan</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-card transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tier cards */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TIERS.map(({ id, name, color }) => {
            const isCurrent = id === currentTier;
            const price = SUBSCRIPTION_PRICES[id];
            const isUpgrade = id !== 'free' && !isCurrent;

            return (
              <div
                key={id}
                className={`relative rounded-xl border-2 p-4 space-y-4 ${color} ${isCurrent ? 'bg-surface-card' : 'bg-surface'}`}
              >
                {isCurrent && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 rounded-full bg-brand-500 text-white font-medium">
                    Current
                  </span>
                )}

                <div>
                  <p className="font-bold text-white text-lg">{name}</p>
                  <p className="text-2xl font-black text-white mt-1">
                    {price === 0 ? (
                      'Free'
                    ) : (
                      <>
                        ${price}
                        <span className="text-sm font-normal text-gray-400">/mo</span>
                      </>
                    )}
                  </p>
                </div>

                <ul className="space-y-1.5">
                  {FEATURES[id].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isUpgrade && (
                  <button
                    onClick={() => upgrade.mutate(id as 'owner' | 'company')}
                    disabled={upgrade.isPending}
                    className="btn-primary w-full text-sm py-2 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {upgrade.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      `Upgrade to ${name}`
                    )}
                  </button>
                )}

                {isCurrent && id !== 'free' && (
                  <p className="text-xs text-center text-gray-500">Active plan</p>
                )}

                {id === 'free' && !isCurrent && (
                  <p className="text-xs text-center text-gray-500">Downgrade via support</p>
                )}
              </div>
            );
          })}
        </div>

        <p className="px-6 pb-6 text-xs text-gray-500 text-center">
          No payment processor connected — upgrades are recorded instantly for demo purposes.
        </p>
      </div>
    </div>
  );
}
