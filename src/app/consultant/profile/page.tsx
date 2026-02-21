// Consultant profile management page where consultants can view and edit their personal and professional information
//src/app/consultant/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getConsultantProfile,
  upsertConsultantProfile,
  updateUserProfile,
} from '@/lib/firestore';
import { ConsultantProfile } from '@/lib/types';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function ConsultantProfilePage() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    bio: '',
    credentials: '',
    specializations: '',
    isPublic: true,
  });

  useEffect(() => {
    if (!profile?.uid) return;
    const fetch = async () => {
      const extended = await getConsultantProfile(profile.uid);
      setForm({
        name: profile.name ?? '',
        phone: extended?.phone ?? '',
        bio: extended?.bio ?? '',
        credentials: extended?.credentials ?? '',
        specializations: extended?.specializations?.join(', ') ?? '',
        isPublic: extended?.isPublic ?? true,
      });
      setLoading(false);
    };
    fetch();
  }, [profile]);

  const handleSave = async () => {
    if (!profile?.uid) return;
    setSaving(true);
    try {
      await updateUserProfile(profile.uid, { name: form.name });
      await upsertConsultantProfile(profile.uid, {
        phone: form.phone,
        bio: form.bio,
        credentials: form.credentials,
        specializations: form.specializations
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        isPublic: form.isPublic,
      });
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">
            {form.isPublic ? 'Visible to your clients' : 'Hidden from clients'}
          </p>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)} variant="secondary">
            ✏️ Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setEditing(false)} variant="secondary">
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-24" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-6">
            <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-green-600">
              {form.name?.charAt(0).toUpperCase()}
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-bold text-gray-900">{form.name}</h2>
              <p className="text-gray-500 text-sm">{profile?.email}</p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Personal Info
              </h3>
              <div className="flex flex-col gap-3">
                {editing ? (
                  <>
                    <Input
                      label="Full Name"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    />
                    <Input
                      label="Phone"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-gray-900 font-medium">{form.phone || '—'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Professional Info
              </h3>
              <div className="flex flex-col gap-3">
                {editing ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">Bio</label>
                      <textarea
                        value={form.bio}
                        onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                        rows={4}
                        placeholder="Tell your clients about yourself..."
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 resize-none"
                      />
                    </div>
                    <Input
                      label="Credentials (e.g. RD, CNS, MSc Nutrition)"
                      value={form.credentials}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, credentials: e.target.value }))
                      }
                    />
                    <Input
                      label="Specializations (comma separated)"
                      placeholder="Weight loss, Diabetes management, Sports nutrition"
                      value={form.specializations}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, specializations: e.target.value }))
                      }
                    />
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={form.isPublic}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, isPublic: e.target.checked }))
                        }
                        className="w-4 h-4 accent-green-600"
                      />
                      <label htmlFor="isPublic" className="text-sm text-gray-700">
                        Make profile visible to my clients
                      </label>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    {form.bio && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Bio</p>
                        <p className="text-gray-900 text-sm">{form.bio}</p>
                      </div>
                    )}
                    {form.credentials && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Credentials</p>
                        <p className="text-gray-900 font-medium">{form.credentials}</p>
                      </div>
                    )}
                    {form.specializations && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-2">Specializations</p>
                        <div className="flex flex-wrap gap-2">
                          {form.specializations.split(',').map((s, i) => (
                            <span
                              key={i}
                              className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full"
                            >
                              {s.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}