// API route to send the daily report email to the consultant
//src/app/api/send-report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { adminDb } from '@/lib/firebase-admin';
import { buildReportEmail } from '@/lib/email';
import { DailyLog } from '@/lib/types';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { logId, clientId } = await req.json();

    // Get the daily log
    const logSnap = await adminDb.collection('dailyLogs').doc(logId).get();
    if (!logSnap.exists) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }
    const log = { id: logSnap.id, ...logSnap.data() } as DailyLog;

    // Get the client record
    const clientSnap = await adminDb.collection('clients').doc(clientId).get();
    if (!clientSnap.exists) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    const client = clientSnap.data()!;

    // Get the consultant profile
    const consultantSnap = await adminDb
      .collection('users')
      .doc(client.consultantId)
      .get();
    if (!consultantSnap.exists) {
      return NextResponse.json({ error: 'Consultant not found' }, { status: 404 });
    }
    const consultant = consultantSnap.data()!;

    // Build and send email
    const { subject, html } = buildReportEmail(client.name, consultant.name, log);

    try {
  await transporter.sendMail({
    from: `"Nutrition App" <${process.env.GMAIL_USER}>`,
    to: consultant.email,
    subject,
    html,
  });
} catch (mailErr) {
  console.error('Nodemailer error:', mailErr);
  return NextResponse.json({ error: 'Email failed to send' }, { status: 500 });
}

    // Mark log as sent
    await adminDb.collection('dailyLogs').doc(logId).update({
      reportSent: true,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Send report error:', err);
    const message = err instanceof Error ? err.message : 'Failed to send report';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}