//src/app/api/create-client/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email, password, name, consultantId,
      dob, gender, phone, medicalHistory,
      nutritionGoals, currentPlan,
    } = body;

    // Create auth user without affecting current session
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    const clientUserId = userRecord.uid;

    // Create user profile
    await adminDb.collection('users').doc(clientUserId).set({
      uid: clientUserId,
      email,
      name,
      role: 'client',
      createdAt: new Date(),
    });

    // Create client record
    const clientRef = await adminDb.collection('clients').add({
      consultantId,
      clientUserId,
      name,
      email,
      dob,
      gender,
      phone,
      medicalHistory,
      nutritionGoals,
      currentPlan,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, clientId: clientRef.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create client';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}