// Client-side page to display the client's assigned consultant's profile information, including name, credentials, bio, and contact details
//src/app/client/consultant/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getConsultantProfile, getUserProfile } from '@/lib/firestore';
import { ConsultantProfile, UserProfile } from '@/lib/types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function MyConsultantPage() {
  const { profile } = useAuth();
  const [consultant, setConsultant] = useState<UserProfile | null>(null);
  const [extProfile, setExtProfile] = useState<ConsultantProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;
    const fetchConsultant = async () => {
      const q = query(collection(db, 'clients'), where('clientUserId', '==', profile.uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const consultantId = snap.docs[0].data().consultantId;
        const [userProf, extProf] = await Promise.all([
          getUserProfile(consultantId),
          getConsultantProfile(consultantId),
        ]);
        setConsultant(userProf);
        setExtProfile(extProf);
      }
      setLoading(false);
    };
    fetchConsultant();
  }, [profile]);

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  if (!consultant) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
        <p className="text-4xl mb-3">👤</p>
        <p className="text-gray-600 font-medium">No consultant linked</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Consultant</h1>
        <p className="text-gray-500 mt-1">Your nutrition expert</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-24" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-6">
            <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-green-600">
              {consultant.name?.charAt(0).toUpperCase()}
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-bold text-gray-900">{consultant.name}</h2>
              {extProfile?.credentials && (
                <p className="text-green-600 text-sm font-medium">{extProfile.credentials}</p>
              )}
              <p className="text-gray-500 text-sm">{consultant.email}</p>
            </div>
          </div>

          {extProfile?.bio && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">About</p>
              <p className="text-gray-700 text-sm">{extProfile.bio}</p>
            </div>
          )}

          {extProfile?.specializations && extProfile.specializations.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Specializations</p>
              <div className="flex flex-wrap gap-2">
                {extProfile.specializations.map((s, i) => (
                  <span key={i} className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {extProfile?.phone && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Phone</p>
              <p className="text-gray-900 font-medium">{extProfile.phone}</p>
            </div>
          )}

          {!extProfile?.isPublic && (
            <p className="text-xs text-gray-400 mt-4 italic">
              Your consultant hasn't made their full profile public yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}