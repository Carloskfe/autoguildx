'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Wrench,
  Briefcase,
  Car,
  Award,
  Settings,
  X,
  Check,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import type {
  ProfileSection,
  ProfileSectionType,
  ExpertiseData,
  ExperienceData,
  BuildData,
  CertificationData,
  EquipmentData,
} from '@autoguildx/shared';

// ── Section config ────────────────────────────────────────────────────────────

const SECTION_META: Record<
  ProfileSectionType,
  { labelKey: string; icon: React.ElementType; color: string }
> = {
  expertise: { labelKey: 'expertise', icon: Wrench, color: 'text-brand-500' },
  experience: { labelKey: 'experience', icon: Briefcase, color: 'text-blue-400' },
  build: { labelKey: 'build', icon: Car, color: 'text-purple-400' },
  certification: { labelKey: 'certification', icon: Award, color: 'text-yellow-400' },
  equipment: { labelKey: 'equipment', icon: Settings, color: 'text-green-400' },
};

const LEVEL_COLORS = {
  beginner: 'bg-green-500/10 text-green-400 border-green-500/30',
  intermediate: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  expert: 'bg-brand-500/10 text-brand-400 border-brand-500/30',
};

// ── Display renderers ─────────────────────────────────────────────────────────

function ExpertiseItem({
  data,
  t,
}: {
  data: ExpertiseData;
  t: ReturnType<typeof useTranslations>;
}) {
  const levelKey = `level_${data.level}` as const;
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-white">{data.skill}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full border ${LEVEL_COLORS[data.level] ?? ''}`}>
        {t(levelKey as any)}
      </span>
    </div>
  );
}

function ExperienceItem({
  data,
  t,
}: {
  data: ExperienceData;
  t: ReturnType<typeof useTranslations>;
}) {
  const years = data.current
    ? `${data.startYear} – ${t('present')}`
    : data.endYear
      ? `${data.startYear} – ${data.endYear}`
      : String(data.startYear);
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-semibold text-white">{data.role}</span>
        <span className="text-xs text-gray-400">@ {data.shopName}</span>
        <span className="text-xs text-gray-500 ml-auto">{years}</span>
      </div>
      {data.description && <p className="text-xs text-gray-400 mt-1">{data.description}</p>}
    </div>
  );
}

function BuildItem({ data }: { data: BuildData }) {
  return (
    <div className="flex gap-3">
      {data.photoUrl && (
        <img
          src={data.photoUrl}
          alt={data.title}
          className="w-16 h-12 rounded object-cover shrink-0"
        />
      )}
      <div>
        <div className="text-sm font-semibold text-white">{data.title}</div>
        <div className="text-xs text-gray-400">
          {data.year} {data.make} {data.model}
        </div>
        {data.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{data.description}</p>
        )}
      </div>
    </div>
  );
}

function CertificationItem({ data }: { data: CertificationData }) {
  return (
    <div className="flex items-center gap-2">
      <Award className="w-4 h-4 text-yellow-400 shrink-0" />
      <div>
        <span className="text-sm text-white">{data.name}</span>
        <span className="text-xs text-gray-400 ml-2">
          {data.issuer}
          {data.year ? ` · ${data.year}` : ''}
        </span>
      </div>
    </div>
  );
}

function EquipmentItem({ data }: { data: EquipmentData }) {
  return (
    <div className="flex items-center gap-2">
      <span className="section-chip">
        {data.name}
        {data.brand ? ` · ${data.brand}` : ''}
      </span>
      {data.category && <span className="text-xs text-gray-500">{data.category}</span>}
    </div>
  );
}

function SectionItem({
  section,
  t,
}: {
  section: ProfileSection;
  t: ReturnType<typeof useTranslations>;
}) {
  const d = section.data;
  switch (section.type) {
    case 'expertise':
      return <ExpertiseItem data={d as unknown as ExpertiseData} t={t} />;
    case 'experience':
      return <ExperienceItem data={d as unknown as ExperienceData} t={t} />;
    case 'build':
      return <BuildItem data={d as unknown as BuildData} />;
    case 'certification':
      return <CertificationItem data={d as unknown as CertificationData} />;
    case 'equipment':
      return <EquipmentItem data={d as unknown as EquipmentData} />;
  }
}

// ── Add/edit form ─────────────────────────────────────────────────────────────

function SectionForm({
  type,
  initial,
  onSave,
  onCancel,
}: {
  type: ProfileSectionType;
  initial?: Record<string, unknown>;
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const t = useTranslations('sections');
  const [vals, setVals] = useState<Record<string, unknown>>(initial ?? {});
  const set = (k: string, v: unknown) => setVals((p) => ({ ...p, [k]: v }));
  const str = (k: string) => (vals[k] as string) ?? '';
  const num = (k: string) => (vals[k] as number) ?? '';

  return (
    <div className="border border-surface-border rounded-lg p-4 space-y-3 bg-surface">
      {type === 'expertise' && (
        <>
          <input
            className="input"
            placeholder={t('placeholder_skill')}
            value={str('skill')}
            onChange={(e) => set('skill', e.target.value)}
          />
          <select
            className="input"
            value={str('level')}
            onChange={(e) => set('level', e.target.value)}
          >
            <option value="">{t('placeholder_level')}</option>
            {(['beginner', 'intermediate', 'expert'] as const).map((l) => (
              <option key={l} value={l}>
                {t(`level_${l}` as any)}
              </option>
            ))}
          </select>
        </>
      )}
      {type === 'experience' && (
        <>
          <input
            className="input"
            placeholder={t('placeholder_shop')}
            value={str('shopName')}
            onChange={(e) => set('shopName', e.target.value)}
          />
          <input
            className="input"
            placeholder={t('placeholder_role')}
            value={str('role')}
            onChange={(e) => set('role', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="input"
              type="number"
              placeholder={t('placeholder_start_year')}
              value={num('startYear')}
              onChange={(e) => set('startYear', Number(e.target.value))}
            />
            <input
              className="input"
              type="number"
              placeholder={t('placeholder_end_year')}
              value={num('endYear')}
              onChange={(e) => set('endYear', Number(e.target.value) || undefined)}
              disabled={!!vals['current']}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={!!vals['current']}
              onChange={(e) => set('current', e.target.checked)}
            />
            {t('currently_here')}
          </label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder={t('placeholder_description')}
            value={str('description')}
            onChange={(e) => set('description', e.target.value)}
          />
        </>
      )}
      {type === 'build' && (
        <>
          <input
            className="input"
            placeholder={t('placeholder_build_title')}
            value={str('title')}
            onChange={(e) => set('title', e.target.value)}
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              className="input"
              type="number"
              placeholder={t('placeholder_year')}
              value={num('year')}
              onChange={(e) => set('year', Number(e.target.value))}
            />
            <input
              className="input"
              placeholder={t('placeholder_make')}
              value={str('make')}
              onChange={(e) => set('make', e.target.value)}
            />
            <input
              className="input"
              placeholder={t('placeholder_model')}
              value={str('model')}
              onChange={(e) => set('model', e.target.value)}
            />
          </div>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder={t('placeholder_description')}
            value={str('description')}
            onChange={(e) => set('description', e.target.value)}
          />
          <input
            className="input"
            placeholder={t('placeholder_photo_url')}
            value={str('photoUrl')}
            onChange={(e) => set('photoUrl', e.target.value)}
          />
        </>
      )}
      {type === 'certification' && (
        <>
          <input
            className="input"
            placeholder={t('placeholder_cert_name')}
            value={str('name')}
            onChange={(e) => set('name', e.target.value)}
          />
          <input
            className="input"
            placeholder={t('placeholder_issuer')}
            value={str('issuer')}
            onChange={(e) => set('issuer', e.target.value)}
          />
          <input
            className="input"
            type="number"
            placeholder={t('placeholder_year_issued')}
            value={num('year')}
            onChange={(e) => set('year', Number(e.target.value) || undefined)}
          />
        </>
      )}
      {type === 'equipment' && (
        <>
          <input
            className="input"
            placeholder={t('placeholder_tool')}
            value={str('name')}
            onChange={(e) => set('name', e.target.value)}
          />
          <input
            className="input"
            placeholder={t('placeholder_brand')}
            value={str('brand')}
            onChange={(e) => set('brand', e.target.value)}
          />
          <input
            className="input"
            placeholder={t('placeholder_category')}
            value={str('category')}
            onChange={(e) => set('category', e.target.value)}
          />
        </>
      )}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave(vals)}
          className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1"
        >
          <Check className="w-3.5 h-3.5" /> {t('save')}
        </button>
        <button
          onClick={onCancel}
          className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" /> {t('cancel')}
        </button>
      </div>
    </div>
  );
}

// ── Section group ─────────────────────────────────────────────────────────────

function SectionGroup({
  type,
  sections,
  isOwner,
  onAdd,
  onEdit,
  onDelete,
  t,
}: {
  type: ProfileSectionType;
  sections: ProfileSection[];
  isOwner: boolean;
  onAdd: (type: ProfileSectionType) => void;
  onEdit: (section: ProfileSection) => void;
  onDelete: (id: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const [open, setOpen] = useState(true);
  const meta = SECTION_META[type];
  const Icon = meta.icon;
  const label = t(meta.labelKey as any);

  if (sections.length === 0 && !isOwner) return null;

  return (
    <div className="card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 text-left"
      >
        <Icon className={`w-4 h-4 ${meta.color} shrink-0`} />
        <span className="font-semibold text-white text-sm flex-1">{label}</span>
        <span className="text-xs text-gray-500">{sections.length}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {sections.map((s) => (
            <div key={s.id} className="flex items-start gap-2 group">
              <div className="flex-1 min-w-0">
                <SectionItem section={s} t={t} />
              </div>
              {isOwner && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => onEdit(s)}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(s.id)}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {isOwner && (
            <button
              onClick={() => onAdd(type)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-400 transition-colors mt-1"
            >
              <Plus className="w-3.5 h-3.5" /> {t('add', { section: label })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProfileSections({
  profileId,
  isOwner,
}: {
  profileId: string;
  isOwner: boolean;
}) {
  const qc = useQueryClient();
  const [addingType, setAddingType] = useState<ProfileSectionType | null>(null);
  const [editing, setEditing] = useState<ProfileSection | null>(null);

  const { data: sections = [] } = useQuery<ProfileSection[]>({
    queryKey: ['profileSections', profileId],
    queryFn: () => api.get(`/profiles/${profileId}/sections`).then((r) => r.data),
    enabled: !!profileId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['profileSections', profileId] });

  const createMut = useMutation({
    mutationFn: (body: { type: ProfileSectionType; data: Record<string, unknown> }) =>
      api.post('/profiles/sections', body),
    onSuccess: () => {
      invalidate();
      setAddingType(null);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/profiles/sections/${id}`, { data }),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/profiles/sections/${id}`),
    onSuccess: invalidate,
  });

  const grouped = (Object.keys(SECTION_META) as ProfileSectionType[]).map((type) => ({
    type,
    items: sections.filter((s) => s.type === type),
  }));

  const t = useTranslations('sections');
  const hasAny = sections.length > 0;
  if (!hasAny && !isOwner) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-white">{t('title')}</h2>

      {grouped.map(({ type, items }) => (
        <div key={type}>
          {editing?.type === type ? (
            <SectionForm
              type={type}
              initial={editing.data}
              onSave={(data) => updateMut.mutate({ id: editing.id, data })}
              onCancel={() => setEditing(null)}
            />
          ) : addingType === type ? (
            <SectionForm
              type={type}
              onSave={(data) => createMut.mutate({ type, data })}
              onCancel={() => setAddingType(null)}
            />
          ) : (
            <SectionGroup
              type={type}
              sections={items}
              isOwner={isOwner}
              onAdd={setAddingType}
              onEdit={setEditing}
              onDelete={(id) => deleteMut.mutate(id)}
              t={t}
            />
          )}
        </div>
      ))}
    </div>
  );
}
