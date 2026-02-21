// Firebase Admin SDK initialization for server-side operations, using service account credentials from environment variables
//src/lib/firebase-admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getPrivateKey() {
  const key = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!key) throw new Error('FIREBASE_ADMIN_PRIVATE_KEY is not set');
  // Handle both escaped newlines and real newlines
  return key.replace(/\\n/g, '\n').replace(/^"|"$/g, '');
}

const adminApp =
  getApps().find((a) => a.name === 'admin') ??
  initializeApp(
    {
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: getPrivateKey(),
      }),
    },
    'admin'
  );

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
