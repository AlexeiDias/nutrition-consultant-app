// API route to allow consultants to update a client's email address in Firebase Auth and Firestore, ensuring the client's account remains consistent across authentication and database records
//src/app/api/update-client-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { clientUserId, newEmail } = await req.json();

    if (!clientUserId || !newEmail) {
      return NextResponse.json(
        { error: 'Missing clientUserId or newEmail' },
        { status: 400 }
      );
    }

    // Update Firebase Auth email
    await adminAuth.updateUser(clientUserId, { email: newEmail });

    // Update users collection in Firestore
    await adminDb.collection('users').doc(clientUserId).update({
      email: newEmail,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Update email error:', err);
    const message = err instanceof Error ? err.message : 'Failed to update email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}