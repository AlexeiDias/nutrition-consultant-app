// src/app/consultant/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useConsultantType } from '@/context/ConsultantTypeContext';
import { getConsultantProfile, upsertConsultantProfile, updateUserProfile } from '@/lib/firestore';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import {
  CONSULTANT_TYPES,
  ConsultantType,
  ToolPreferences,
  TOOL_LABELS,
  CONSULTANT_TYPE_CONFIGS,
} from '@/lib/consultant-type';

export default function ConsultantProfilePage() {
  const { profile, user } = useAuth();
  const { refresh } = useConsultantType();
  const [extended, setExtended] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    credentials: '',
    specializations: '',
    isPublic: true,
    consultantType: 'nutritionist' as ConsultantType,
    customTypeName: '',
    toolPreferences: {
      aiMealPlan: true,
      mealsBuilder: true,
      calorieCalculator: true,
      tasksSection: true,
    } as ToolPreferences,
  });

  useEffect(() => {
    if (!profile?.uid) return;
    const fetchProfile = async () => {
      const ext = await getConsultantProfile(profile.uid);
      setExtended(ext);
      setForm({
        name: profile.name ?? '',
        email: profile.email ?? '',
        phone: ext?.phone ?? '',
        bio: ext?.bio ?? '',
        credentials: ext?.credentials ?? '',
        specializations: ext?.specializations?.join(', ') ?? '',
        isPublic: ext?.isPublic ?? true,
        consultantType: ext?.consultantType ?? 'nutritionist',
        customTypeName: ext?.customTypeName ?? '',
        toolPreferences: ext?.toolPreferences ??
          CONSULTANT_TYPE_CONFIGS['nutritionist'].defaultTools,
      });
    };
    fetchProfile();
  }, [profile]);

  // When type changes, apply default tools for that type
  const handleTypeChange = (type: ConsultantType) => {
    setForm((p) => ({
      ...p,
      consultantType: type,
      toolPreferences: CONSULTANT_TYPE_CONFIGS[type].defaultTools,
    }));
  };

  const handleToolToggle = (tool: keyof ToolPreferences) => {
    setForm((p) => ({
      ...p,
      toolPreferences: { ...p.toolPreferences, [tool]: !p.toolPreferences[tool] },
    }));
  };

  const handleSave = async () => {
    if (!profile?.uid) return;
    setSaving(true);
    try {
      // Update email if changed
      if (user?.email !== form.email) {
        const res = await fetch('/api/update-consultant-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: profile.uid, newEmail: form.email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      }

      await updateUserProfile(profile.uid, { name: form.name });

      await upsertConsultantProfile(profile.uid, {
        phone: form.phone,
        bio: form.bio,
        credentials: form.credentials,
        specializations: form.specializations.split(',').map((s) => s.trim()).filter(Boolean),
        isPublic: form.isPublic,
        consultantType: form.consultantType,
        customTypeName: form.customTypeName,
        toolPreferences: form.toolPreferences,
      });

      await refresh();
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const selectedTypeConfig = CONSULTANT_TYPE_CONFIGS[form.consultantType];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your consultant profile</p>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)}>✏️ Edit</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>Save</Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">

        {/* Practice Type */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Practice Type
          </h2>
          {editing ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CONSULTANT_TYPES.map((type) => (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => handleTypeChange(type.key)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      form.consultantType === type.key
                        ? 'bg-green-50 border-green-500'
                        : 'bg-white border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <span className="text-2xl">{type.emoji}</span>
                    <div>
                      <p className={`text-sm font-semibold ${
                        form.consultantType === type.key ? 'text-green-800' : 'text-gray-900'
                      }`}>
                        {type.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              {form.consultantType === 'custom' && (
                <Input
                  label="Custom Practice Name"
                  placeholder="e.g. Holistic Wellness Coach"
                  value={form.customTypeName}
                  onChange={(e) => setForm((p) => ({ ...p, customTypeName: e.target.value }))}
                />
              )}

              {/* Tool Preferences */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Tools & Features
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  Defaults set by your practice type. Customize as needed.
                </p>
                <div className="flex flex-col gap-3">
                  {(Object.keys(TOOL_LABELS) as Array<keyof ToolPreferences>).map((tool) => (
                    <label key={tool} className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => handleToolToggle(tool)}
                        className={`w-10 h-6 rounded-full transition-all relative cursor-pointer ${
                          form.toolPreferences[tool] ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                          form.toolPreferences[tool] ? 'left-5' : 'left-1'
                        }`} />
                      </div>
                      <span className="text-sm text-gray-700">{TOOL_LABELS[tool]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-4xl">{selectedTypeConfig?.emoji ?? '🥗'}</span>
              <div>
                <p className="font-semibold text-gray-900">
                  {form.consultantType === 'custom' && form.customTypeName
                    ? form.customTypeName
                    : selectedTypeConfig?.label ?? 'Nutritionist'}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {selectedTypeConfig?.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(Object.keys(TOOL_LABELS) as Array<keyof ToolPreferences>).map((tool) => (
                    form.toolPreferences[tool] ? (
                      <span key={tool} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        {TOOL_LABELS[tool]}
                      </span>
                    ) : (
                      <span key={tool} className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full line-through">
                        {TOOL_LABELS[tool]}
                      </span>
                    )
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Personal Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Personal Information
          </h2>
          {editing ? (
            <div className="flex flex-col gap-4">
              <Input label="Full Name" value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              <Input label="Email" type="email" value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              <Input label="Phone" value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Name', value: profile?.name },
                { label: 'Email', value: profile?.email },
                { label: 'Phone', value: extended?.phone },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-gray-900 font-medium truncate">{item.value || '—'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Professional Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Professional Information
          </h2>
          {editing ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Bio</label>
                <textarea rows={4} placeholder="Tell your clients about yourself..."
                  value={form.bio}
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>
              <Input label="Credentials" placeholder="e.g. RD, CPT, CHC"
                value={form.credentials}
                onChange={(e) => setForm((p) => ({ ...p, credentials: e.target.value }))} />
              <Input label="Specializations (comma separated)"
                placeholder="e.g. Weight loss, Diabetes, Sports nutrition"
                value={form.specializations}
                onChange={(e) => setForm((p) => ({ ...p, specializations: e.target.value }))} />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPublic}
                  onChange={(e) => setForm((p) => ({ ...p, isPublic: e.target.checked }))}
                  className="w-4 h-4 accent-green-600" />
                <span className="text-sm text-gray-700">Make profile visible to clients</span>
              </label>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {extended?.bio && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Bio</p>
                  <p className="text-gray-900 text-sm">{extended.bio}</p>
                </div>
              )}
              {extended?.credentials && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Credentials</p>
                  <p className="text-gray-900 text-sm">{extended.credentials}</p>
                </div>
              )}
              {extended?.specializations?.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-2">Specializations</p>
                  <div className="flex flex-wrap gap-1">
                    {extended.specializations.map((s: string) => (
                      <span key={s} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Profile Visibility</p>
                <p className="text-gray-900 text-sm">
                  {extended?.isPublic ? '👁️ Visible to clients' : '🔒 Private'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
