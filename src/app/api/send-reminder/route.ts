// API route to send daily email reminders to clients about their nutrition action plans, including progress and pending tasks
//src/app/api/send-reminder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { adminDb } from '@/lib/firebase-admin';
import { ActionPlan } from '@/lib/types';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const categoryIcons: Record<string, string> = {
  nutrition: '🥗',
  exercise: '🏃',
  hydration: '💧',
  lifestyle: '🌿',
};

export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json();

    // Simple secret to prevent unauthorized calls
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active action plans
    const plansSnap = await adminDb
      .collection('actionPlans')
      .where('status', '==', 'active')
      .get();

    let sent = 0;

    for (const planDoc of plansSnap.docs) {
      const plan = { id: planDoc.id, ...planDoc.data() } as ActionPlan;

      // Get client user profile
      const clientSnap = await adminDb.collection('clients').doc(plan.clientId).get();
      if (!clientSnap.exists) continue;
      const client = clientSnap.data()!;

      const clientUserSnap = await adminDb.collection('users').doc(client.clientUserId).get();
      if (!clientUserSnap.exists) continue;
      const clientUser = clientUserSnap.data()!;

      const completedTasks = plan.tasks.filter((t) => t.completed);
      const pendingTasks = plan.tasks.filter((t) => !t.completed);
      const progress = plan.tasks.length > 0
        ? Math.round((completedTasks.length / plan.tasks.length) * 100)
        : 0;

      const completedHtml = completedTasks.length > 0
        ? completedTasks.map((t) => `
            <li style="padding:4px 0;color:#16a34a;">
              ✅ ${categoryIcons[t.category] ?? ''} ${t.title}
            </li>`).join('')
        : '<li style="color:#9ca3af;">Nothing completed yet — keep going!</li>';

      const pendingHtml = pendingTasks.length > 0
        ? pendingTasks.map((t) => `
            <li style="padding:4px 0;color:#374151;">
              ⬜ ${categoryIcons[t.category] ?? ''} ${t.title}
              ${t.description ? `<br><span style="font-size:11px;color:#9ca3af;">${t.description}</span>` : ''}
            </li>`).join('')
        : '<li style="color:#16a34a;">🎉 All tasks completed!</li>';

      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
          <div style="background:#16a34a;padding:24px;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;font-size:20px;">🌅 Good morning, ${clientUser.name?.split(' ')[0]}!</h1>
            <p style="color:#bbf7d0;margin:4px 0 0;">Here's your daily nutrition plan reminder</p>
          </div>
          <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;">

            <h2 style="color:#111827;margin:0 0 4px;">${plan.title}</h2>
            <p style="color:#6b7280;font-size:14px;margin:0 0 16px;">Overall progress: <strong style="color:#16a34a;">${progress}%</strong></p>

            <!-- Progress Bar -->
            <div style="background:#e5e7eb;border-radius:999px;height:12px;margin-bottom:24px;">
              <div style="background:#16a34a;height:12px;border-radius:999px;width:${progress}%;"></div>
            </div>

            <h3 style="color:#111827;margin:0 0 8px;">✅ Completed So Far</h3>
            <ul style="margin:0 0 20px;padding-left:16px;">${completedHtml}</ul>

            <h3 style="color:#111827;margin:0 0 8px;">📋 Today's Tasks</h3>
            <ul style="margin:0 0 20px;padding-left:16px;">${pendingHtml}</ul>

            <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center;">
              <p style="margin:0;color:#374151;">Don't forget to log your meals today! 🥗</p>
            </div>

            <p style="color:#9ca3af;font-size:12px;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:16px;">
              This is an automated reminder from your Nutrition Consultant App.
            </p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"Nutrition App" <${process.env.GMAIL_USER}>`,
        to: clientUser.email,
        subject: `🌅 Daily Reminder: ${plan.title} — ${progress}% complete`,
        html,
      });

      sent++;
    }

    return NextResponse.json({ success: true, remindersSent: sent });
  } catch (err: unknown) {
    console.error('Reminder error:', err);
    const message = err instanceof Error ? err.message : 'Failed to send reminders';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}