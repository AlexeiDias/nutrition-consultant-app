// API route to allow consultants to update a consultant's email address in Firebase Auth and Firestore, ensuring the consultant's account remains consistent across authentication and database records
//src/app/api/update-consultant-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { uid, newEmail } = await req.json();

    if (!uid || !newEmail) {
      return NextResponse.json(
        { error: 'Missing uid or newEmail' },
        { status: 400 }
      );
    }

    // Update Firebase Auth email
    await adminAuth.updateUser(uid, { email: newEmail });

    // Update users collection in Firestore
    await adminDb.collection('users').doc(uid).update({
      email: newEmail,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Update consultant email error:', err);
    const message = err instanceof Error ? err.message : 'Failed to update email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}