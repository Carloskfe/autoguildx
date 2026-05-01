'use client';

import { useState } from 'react';
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
  const [loading, setLoading] = useState<SubscriptionTier | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async (tier: 'owner' | 'company') => {
    setError('');
    setLoading(tier);
    try {
      const { data } = await api.post<{ url: string }>('/subscriptions/create-checkout-session', {
        tier,
      });
      window.location.href = data.url;
    } catch {
      setError('Unable to start checkout. Please try again.');
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    setError('');
    setCancelling(true);
    try {
      await api.delete('/subscriptions/me');
      onClose();
      window.location.reload();
    } catch {
      setError('Unable to cancel subscription. Please try again.');
      setCancelling(false);
      setConfirmCancel(false);
    }
  };

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
                    onClick={() => handleUpgrade(id as 'owner' | 'company')}
                    disabled={loading !== null}
                    className="btn-primary w-full text-sm py-2 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading === id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      `Upgrade to ${name}`
                    )}
                  </button>
                )}

                {isCurrent && id !== 'free' && (
                  <p className="text-xs text-center text-gray-500">Active plan</p>
                )}

                {id === 'free' &&
                  currentTier !== 'free' &&
                  (confirmCancel ? (
                    <div className="space-y-2">
                      <p className="text-xs text-center text-gray-400">
                        Cancel and return to Free?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCancel}
                          disabled={cancelling}
                          className="flex-1 text-xs py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-1"
                        >
                          {cancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmCancel(false)}
                          disabled={cancelling}
                          className="flex-1 text-xs py-1.5 rounded-lg border border-surface-border text-gray-400 hover:text-white transition-colors"
                        >
                          Keep plan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmCancel(true)}
                      className="w-full text-xs py-1.5 rounded-lg border border-surface-border text-gray-500 hover:text-red-400 hover:border-red-500/40 transition-colors"
                    >
                      Downgrade to Free
                    </button>
                  ))}
              </div>
            );
          })}
        </div>

        {error && <p className="px-6 pb-4 text-sm text-red-400 text-center">{error}</p>}

        <p className="px-6 pb-6 text-xs text-gray-500 text-center">
          Powered by Stripe. You will be redirected to a secure payment page.
        </p>
      </div>
    </div>
  );
}
