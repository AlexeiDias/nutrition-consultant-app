// src/app/api/send-message-notification/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { recipientEmail, recipientName, senderName, messageText, portalUrl } =
      await req.json();

    if (!recipientEmail || !senderName || !messageText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
        <div style="background:#16a34a;padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">💬 New Message</h1>
          <p style="color:#bbf7d0;margin:4px 0 0;">From ${senderName}</p>
        </div>
        <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;">
          <p style="color:#374151;">Hi ${recipientName},</p>
          <p style="color:#374151;">You have a new message from <strong>${senderName}</strong>:</p>
          <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="color:#111827;margin:0;font-size:15px;">"${messageText}"</p>
          </div>
          <a href="${portalUrl}"
            style="display:inline-block;background:#16a34a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;">
            View Message →
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:16px;">
            This notification was sent by the Nutrition Consultant App.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Nutrition App" <${process.env.GMAIL_USER}>`,
      to: recipientEmail,
      subject: `💬 New message from ${senderName}`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Message notification error:', err);
    const message = err instanceof Error ? err.message : 'Failed to send notification';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
