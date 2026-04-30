'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface Review {
  id: string;
  reviewerId: string;
  rating: number;
  qualityRating?: number;
  communicationRating?: number;
  timelinessRating?: number;
  valueRating?: number;
  comment?: string;
  createdAt: string;
  reviewer?: { id: string; email: string; profile?: { displayName?: string } };
}

interface ReviewData {
  reviews: Review[];
  total: number;
  avgRating: number | null;
  distribution: Record<number, number>;
}

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${cls} ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
        />
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              s <= (hovered || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
            }`}
          />
        </button>
      ))}
    </span>
  );
}

interface Props {
  targetId: string;
  targetType: 'profile' | 'listing' | 'event';
  showDimensions?: boolean;
}

export default function ReviewSection({ targetId, targetType, showDimensions = false }: Props) {
  const { isAuthenticated, userId } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [quality, setQuality] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [timeliness, setTimeliness] = useState(0);
  const [value, setValue] = useState(0);
  const [comment, setComment] = useState('');

  const qKey = ['reviews', targetType, targetId];

  const { data, isLoading } = useQuery<ReviewData>({
    queryKey: qKey,
    queryFn: () => api.get(`/reviews/${targetType}/${targetId}`).then((r) => r.data),
  });

  const submit = useMutation({
    mutationFn: () =>
      api.post('/reviews', {
        targetId,
        targetType,
        rating,
        ...(showDimensions && quality ? { qualityRating: quality } : {}),
        ...(showDimensions && communication ? { communicationRating: communication } : {}),
        ...(showDimensions && timeliness ? { timelinessRating: timeliness } : {}),
        ...(showDimensions && value ? { valueRating: value } : {}),
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      setShowForm(false);
      setRating(0);
      setQuality(0);
      setCommunication(0);
      setTimeliness(0);
      setValue(0);
      setComment('');
      qc.invalidateQueries({ queryKey: qKey });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/reviews/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qKey }),
  });

  if (isLoading)
    return (
      <div className="py-4 flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
      </div>
    );

  const total = data?.total ?? 0;
  const avg = data?.avgRating ?? null;
  const dist = data?.distribution ?? {};

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-white">Reviews</h2>
          {avg !== null && (
            <div className="flex items-center gap-1.5">
              <Stars rating={Math.round(avg)} size="sm" />
              <span className="text-sm text-yellow-400 font-medium">{avg}</span>
              <span className="text-xs text-gray-500">({total})</span>
            </div>
          )}
        </div>
        {isAuthenticated && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            {showForm ? 'Cancel' : 'Write a review'}
          </button>
        )}
      </div>

      {/* Distribution */}
      {total > 0 && (
        <div className="space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = dist[star] ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs text-gray-400">
                <span className="w-3">{star}</span>
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <div className="flex-1 h-1.5 bg-surface-border rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Write form */}
      {showForm && (
        <div className="card space-y-3">
          <div className="space-y-1">
            <p className="text-xs text-gray-400">Overall rating</p>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          {showDimensions && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Quality', val: quality, set: setQuality },
                { label: 'Communication', val: communication, set: setCommunication },
                { label: 'Timeliness', val: timeliness, set: setTimeliness },
                { label: 'Value', val: value, set: setValue },
              ].map(({ label, val, set }) => (
                <div key={label} className="space-y-1">
                  <p className="text-xs text-gray-400">{label}</p>
                  <StarPicker value={val} onChange={set} />
                </div>
              ))}
            </div>
          )}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience (optional, min 10 chars if provided)…"
            rows={3}
            className="input w-full text-sm resize-none"
            maxLength={1000}
          />
          <div className="flex justify-end">
            <button
              onClick={() => submit.mutate()}
              disabled={rating === 0 || submit.isPending}
              className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
            >
              {submit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit review'}
            </button>
          </div>
        </div>
      )}

      {/* Review list */}
      {total === 0 && !showForm && (
        <p className="text-sm text-gray-500">No reviews yet. Be the first!</p>
      )}
      <div className="space-y-3">
        {(data?.reviews ?? []).map((rev) => {
          const name = rev.reviewer?.profile?.displayName ?? rev.reviewer?.email ?? 'User';
          const isOwn = rev.reviewerId === userId;
          return (
            <div key={rev.id} className="card space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{name}</span>
                  <Stars rating={rev.rating} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(rev.createdAt), { addSuffix: true })}
                  </span>
                  {isOwn && (
                    <button
                      onClick={() => del.mutate(rev.id)}
                      className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              {showDimensions && (rev.qualityRating || rev.communicationRating) && (
                <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                  {rev.qualityRating && (
                    <span>
                      Quality: <Stars rating={rev.qualityRating} />
                    </span>
                  )}
                  {rev.communicationRating && (
                    <span>
                      Comm: <Stars rating={rev.communicationRating} />
                    </span>
                  )}
                  {rev.timelinessRating && (
                    <span>
                      Time: <Stars rating={rev.timelinessRating} />
                    </span>
                  )}
                  {rev.valueRating && (
                    <span>
                      Value: <Stars rating={rev.valueRating} />
                    </span>
                  )}
                </div>
              )}
              {rev.comment && <p className="text-sm text-gray-300">{rev.comment}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
